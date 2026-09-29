// dsh-session-center — 内核热补丁引擎测试（定义 / 只读检测 / 应用 / 还原）。
//
// 全部在临时「假内核树」上跑：这些函数会**写文件**，所以测试绝不能碰真机内核
// （这正是 2026-09-26 重构要解决的问题——此前 apply() 直接写全局 npm 安装树，
// 连 `npm test` 都会改内核）。
//
// 假树镜像真实布局：<root>/node_modules/@deepseek-ai/<pkg>/lib/<file>，
// 并且带上 `{"type":"module"}`，因为补丁写入后的 `node --check` 依赖它按 ESM 解析。

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  BACKUP_SUFFIX,
  detectPatches,
  applyPatches,
  revertPatches,
  formatPatchSummary,
} from "../lib/kernel-patches.js";

const HOME = mkdtempSync(join(tmpdir(), "dsh-sc-patch-"));
const ROOT = join(HOME, "kernel");

/** 真实内核里 CreateProcessW 那一行的形状（补丁 4 的 anchor 就在其中）。
    注意 anchor 片段以 `));` 结尾——它同时闭掉内层 createProcessW 与外层调用，
    所以假文件必须给它一个外层调用，否则文件本身就是语法错误。 */
const P4_SRC = [
  "export function spawnJobProcess(api, options, startupInfo, processInfo) {",
  "\tconst environment = encodeWindowsEnvironment(options.env);",
  "\treturn runJob(api, (startupInfo, processInfo) => api.createProcessW(options.applicationName, commandLine, null, null, 1, 1028, environment, options.cwd, startupInfo, processInfo));",
  "}",
  "",
].join("\n");

/** 补丁 3（opt-in）的目标函数原文。 */
const P3_SRC = [
  "function requestHeaders(headers) {",
  "\tconst attribution = attributionHeaders();",
  "\tconst reserved = new Set(Object.keys(attribution).map((name) => name.toLowerCase()));",
  "\treturn {",
  "\t\t...Object.fromEntries(Object.entries(headers ?? {}).filter(([name]) => !reserved.has(name.toLowerCase()))),",
  "\t\t...attribution",
  "\t};",
  "}",
  "",
].join("\n");

function seed(pkg, rel, content) {
  const dir = join(ROOT, "node_modules", "@deepseek-ai", pkg, rel.split("/").slice(0, -1).join("/"));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(ROOT, "node_modules", "@deepseek-ai", pkg, "package.json"), JSON.stringify({ name: pkg, type: "module" }));
  writeFileSync(join(ROOT, "node_modules", "@deepseek-ai", pkg, rel), content);
  return join(ROOT, "node_modules", "@deepseek-ai", pkg, rel);
}

const P4_FILE = seed("dsh-win32-process", "lib/index.js", P4_SRC);
const P3_FILE = seed("dsh-llm-pi-ai", "lib/index.js", P3_SRC);

const findEntry = (report, id) => report.entries.find((e) => e.id === id);

test("detect is read-only: reports 'appliable' and touches nothing", async () => {
  const before = readFileSync(P4_FILE, "utf8");
  const report = await detectPatches({ root: ROOT, platform: "win32" });

  assert.equal(findEntry(report, "p4-win32-process-no-window").status, "appliable");
  // 未 seed 的内核包 → absent（而不是抛错）
  assert.equal(findEntry(report, "p2-acl-hidden-console").status, "absent");
  // 非 Windows 上控制台补丁不适用
  const onLinux = await detectPatches({ root: ROOT, platform: "linux" });
  assert.equal(findEntry(onLinux, "p4-win32-process-no-window").status, "platform-skipped");
  // 全平台的那条仍在检测范围内，但被标成 opt-in
  assert.equal(findEntry(onLinux, "p3-llm-headers").optIn, "llmHeaders");

  assert.equal(readFileSync(P4_FILE, "utf8"), before, "detect must not modify the file");
  assert.equal(existsSync(P4_FILE + BACKUP_SUFFIX), false, "detect must not create a backup");
  // 摘要字符串只作展示，结构断言在上面；seed 过的两个文件（P4 与 opt-in 的 P3）都可注入
  assert.match(formatPatchSummary(report), /appliable 2/);
});

test("apply --dry-run reports the action without writing", async () => {
  const before = readFileSync(P4_FILE, "utf8");
  const result = await applyPatches({ root: ROOT, platform: "win32", dryRun: true });
  const action = result.actions.find((a) => a.id === "p4-win32-process-no-window");
  assert.equal(action.status, "would-apply");
  assert.equal(readFileSync(P4_FILE, "utf8"), before, "dry-run writes nothing");
  assert.equal(existsSync(P4_FILE + BACKUP_SUFFIX), false);
});

test("apply injects CREATE_NO_WINDOW, keeps a pristine .bak, and is idempotent", async () => {
  const result = await applyPatches({ root: ROOT, platform: "win32" });
  const action = result.actions.find((a) => a.id === "p4-win32-process-no-window");
  assert.equal(action.status, "applied", action.note);

  const patched = readFileSync(P4_FILE, "utf8");
  assert.ok(patched.includes("1028 | 0x08000000"), "the flag is injected");
  // 备份必须是"最初的干净原件"，而不是上一次的补丁产物
  assert.equal(readFileSync(P4_FILE + BACKUP_SUFFIX, "utf8"), P4_SRC, "backup holds the original");
  // 写入后的语法校验已经在 apply 内部跑过（node --check），文件应仍是合法 ESM

  // 再次检测：doneMark 命中 → satisfied；再次 apply：noop（不重复注入）
  const report = await detectPatches({ root: ROOT, platform: "win32" });
  assert.equal(findEntry(report, "p4-win32-process-no-window").status, "satisfied");
  const again = await applyPatches({ root: ROOT, platform: "win32" });
  assert.equal(again.actions.find((a) => a.id === "p4-win32-process-no-window").status, "noop");
  assert.equal(readFileSync(P4_FILE, "utf8"), patched, "idempotent: content unchanged");
});

test("opt-in patch (LLM headers) is skipped unless explicitly enabled", async () => {
  const before = readFileSync(P3_FILE, "utf8");
  const skipped = await applyPatches({ root: ROOT, platform: "win32" });
  assert.equal(skipped.actions.find((a) => a.id === "p3-llm-headers").status, "skipped");
  assert.equal(readFileSync(P3_FILE, "utf8"), before);

  const applied = await applyPatches({ root: ROOT, platform: "win32", withLlmHeaders: true });
  assert.equal(applied.actions.find((a) => a.id === "p3-llm-headers").status, "applied");
  assert.ok(readFileSync(P3_FILE, "utf8").includes("允许自定义 headers"), "opt-in injection happened");
});

test("revert restores every patched file from its backup", async () => {
  const result = await revertPatches({ root: ROOT });
  assert.ok(result.restored.some((r) => r.id === "p4-win32-process-no-window"));
  assert.equal(readFileSync(P4_FILE, "utf8"), P4_SRC, "P4 restored byte-for-byte");
  assert.equal(readFileSync(P3_FILE, "utf8"), P3_SRC, "P3 restored byte-for-byte");

  const report = await detectPatches({ root: ROOT, platform: "win32" });
  assert.equal(findEntry(report, "p4-win32-process-no-window").status, "appliable", "back to appliable");
});

test("an anchor that no longer matches is reported, never silently skipped", async () => {
  const gone = seed("dsh-win32-process", "lib/index.js", "export const changed = true;\n");
  const result = await applyPatches({ root: ROOT, platform: "win32" });
  const action = result.actions.find((a) => a.id === "p4-win32-process-no-window");
  assert.equal(action.status, "unmatched", "kernel drift must surface, not pass silently");
  assert.equal(readFileSync(gone, "utf8"), "export const changed = true;\n", "nothing written");
});

test("teardown", () => {
  rmSync(HOME, { recursive: true, force: true });
});
