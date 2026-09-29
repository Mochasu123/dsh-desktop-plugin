// dsh-session-center — 内核热补丁：补丁定义 + 只读检测 + 显式应用/还原。
//
// 为什么把「定义/检测」和「应用」分开（2026-09-26 重构）：
//   * 插件 `apply()` 只做**只读检测**并报告。往全局 npm 安装树写文件是全系统里
//     唯一能「把宿主搞到起不来」的副作用（宿主起不来 → 负责自愈的这个插件也
//     加载不了），而它买到的只是外观：少弹几个控制台窗口；
//   * 真正落盘走显式脚本 `node scripts/kernel-patch.mjs --apply`：原子写
//     （tmp + rename）、一次性 `.bak` 备份、写后 `node --check` 语法校验、失败
//     自动还原、`--revert` 一键恢复。内核升级（npm i -g）会把补丁冲掉，重跑一次
//     脚本即可——这是"知道自己改过内核"（ARCHITECTURE 心法 #1）的可执行形式；
//   * 检测路径只读、且所有路径都由传入的 root 派生，测试把 root 指到临时目录就
//     永远不会碰到真机内核（此前测试跑 apply() 会真的去写全局内核）。
//
// 宿主入口恒为 <kernelRoot>/lib/bin.js，所以 kernelRoot() 先按 process.argv[1]
// 反推（对 npm 全局 / ~/.dsh/kernels/<ver> / npx / junction 都精确）；非标准入口
// （脚本、测试、直接 import）再退回 DSH_KERNEL_ROOT 或 APPDATA 推断。

import { copyFile, readFile, rename, rm, writeFile } from "node:fs/promises";
import { existsSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

/** 所有控制台补丁共用的 marker（据此判定"已打过"）。 */
export const MARKER = "// [dsh-my: windows-console-hide]";
/** P5 与 P1 落在同一个文件上，故用独立 marker，避免互相遮蔽。 */
export const P5_MARK = "// [dsh-my: windows-console-hide:p5-runner]";
/** 备份后缀：只为"最初的干净原件"留一份，重复 apply 不覆盖。 */
export const BACKUP_SUFFIX = ".dsh-my.bak";
/** 语法校验用的临时后缀：**必须保留 .js**，否则 node --check 无法按包内
    `type: module` 解析 ESM，会把正常文件误判成语法错误。 */
const TMP_SUFFIX = ".dsh-my.tmp.js";

/**
 * 内核根目录。
 * @returns {string} POSIX 分隔符形式的内核包根（`<root>/node_modules/@deepseek-ai/dsh` 的父级）。
 */
export function kernelRoot() {
  const entry = process.argv[1];
  if (typeof entry === "string" && /[\\/]lib[\\/]bin\.js$/i.test(entry)) {
    return dirname(dirname(entry)).replaceAll("\\", "/");
  }
  if (process.env.DSH_KERNEL_ROOT) return process.env.DSH_KERNEL_ROOT.replaceAll("\\", "/");
  // 全部从环境推导，不写死用户名；APPDATA 是 npm 全局根的实际位置。
  const appData =
    process.env.APPDATA ||
    join(process.env.USERPROFILE || homedir(), "AppData", "Roaming");
  return `${appData.replaceAll("\\", "/")}/npm/node_modules/@deepseek-ai/dsh`;
}

/** 内核包内的文件路径。 */
const kernelFile = (root, pkg, rel) =>
  join(root, "node_modules", "@deepseek-ai", pkg, rel);

/** 补丁 1 的落点：0.1.5 起 spawn 代码被拆进 `runner-launch-*.js` chunk。 */
function subprocessLaunchFile(root) {
  const dir = kernelFile(root, "dsh-subprocess-local", "lib");
  try {
    const chunk = readdirSync(dir).find((f) => /^runner-launch-.*\.js$/.test(f));
    if (chunk) return join(dir, chunk);
  } catch { /* 目录不存在 → 退回 index.js，由检测报 absent */ }
  return join(dir, "index.js");
}

// ---------------------------------------------------------------------------
// 补丁 3：dsh-llm-pi-ai —— 允许自定义 headers（如 User-Agent）覆盖默认 attribution
//
// 这一条与"闪窗"无关，而且它放松的是内核对自己请求头的保护，所以**默认不应用**：
// 只有显式 `--with-llm-headers` 才会写；检测会把它标成 opt-in。
// ---------------------------------------------------------------------------
const P3_OLD = `function requestHeaders(headers) {\n\tconst attribution = attributionHeaders();\n\tconst reserved = new Set(Object.keys(attribution).map((name) => name.toLowerCase()));\n\treturn {\n\t\t...Object.fromEntries(Object.entries(headers ?? {}).filter(([name]) => !reserved.has(name.toLowerCase()))),\n\t\t...attribution\n\t};\n}`;
const P3_NEW = `function requestHeaders(headers) {\n\tconst attribution = attributionHeaders();\n\t${MARKER} 允许自定义 headers（如 User-Agent）覆盖默认 attribution\n\tconst out = { ...attribution };\n\tfor (const [k, v] of Object.entries(headers ?? {})) {\n\t\tconst lower = k.toLowerCase();\n\t\tfor (const key of Object.keys(out)) {\n\t\t\tif (key.toLowerCase() === lower) delete out[key];\n\t\t}\n\t\tout[k] = v;\n\t}\n\treturn out;\n}`;
const P3_DONE = `\tconst out = { ...attribution };\n\tfor (const [k, v] of Object.entries(headers ?? {})) {`;

// ---------------------------------------------------------------------------
// 补丁 1：dsh-subprocess-local 的 spawnSubprocess 补 windowsHide
//
// 0.1.5 起上游自己修了这处（`windowsHide: platform === "win32"`，代码拆进了
// runner-launch chunk），命中 doneMark 即视为不需要注入；旧锚点保留给 ≤0.1.2 回滚。
// ---------------------------------------------------------------------------
const P1_OLD = `\t\tdetached: platform !== "win32"\n\t});`;
const P1_NEW = `\t\tdetached: platform !== "win32",\n\t\t${MARKER} 宿主无控制台时，Windows spawn 控制台程序会新建可见控制台窗口\n\t\t// （闪屏）；windowsHide 使其不可见（Linux/macOS 上无效果）。\n\t\twindowsHide: true\n\t});`;
const P1_DONE = `windowsHide: platform === "win32"`;

// ---------------------------------------------------------------------------
// 补丁 2：dsh-sandbox-windows-acl 的 runner 分配隐藏控制台供受限 pwsh 继承
// （受限令牌包不出 CREATE_NO_WINDOW，会 0xC0000142；只能让 pwsh 继承控制台）
// ---------------------------------------------------------------------------
const P2_IMPORT_OLD = `import { join } from "node:path";`;
const P2_IMPORT_NEW = `import { join } from "node:path";\nimport koffi from "koffi";`;
const P2_ANCHOR = `\t\tinitialized = true;`;
const P2_INSERT = `\t\tinitialized = true;\n\t\t${MARKER} 宿主通常无控制台：受限令牌包不出 CREATE_NO_WINDOW（0xC0000142），\n\t\t// 只能让 pwsh 继承控制台。这里先分配一个隐藏控制台，使受限 pwsh 继承它，\n\t\t// 从而不弹出可见的命令行窗口。\n\t\tif (process.platform === "win32") {\n\t\t\ttry {\n\t\t\t\tconst kernel32 = koffi.load("kernel32.dll");\n\t\t\t\tconst user32 = koffi.load("user32.dll");\n\t\t\t\tconst pv = koffi.pointer("void");\n\t\t\t\tconst getConsoleWindow = kernel32.func("__stdcall", "GetConsoleWindow", pv, []);\n\t\t\t\tconst allocConsole = kernel32.func("__stdcall", "AllocConsole", "int", []);\n\t\t\t\tconst showWindow = user32.func("__stdcall", "ShowWindow", "int", [pv, "int"]);\n\t\t\t\tif (!getConsoleWindow()) allocConsole();\n\t\t\t\tconst hwnd = getConsoleWindow();\n\t\t\t\tif (hwnd) showWindow(hwnd, 0);\n\t\t\t} catch { /* 补丁无效不阻塞沙箱；最坏情况恢复为原闪窗行为 */ }\n\t\t}`;

// ---------------------------------------------------------------------------
// 补丁 4：dsh-win32-process 的原生 CreateProcessW 补 CREATE_NO_WINDOW
//
// 2026-09-17 实测定位到的真实闪窗点（P1 管不到）：windowsHide 只覆盖 runner 自己
// 的 node spawn，目标控制台程序是 runner 用原生 CreateProcessW 拉起的，标志位里
// 没有 CREATE_NO_WINDOW。只补普通令牌这一处；createRestrictedProcess 不能加
// （受限令牌加了会 0xC0000142，由补丁 2 兜底）。该注入**刻意不带 marker**：
// 目标形态本身就是判据（与内核既有写法一致）。
// ---------------------------------------------------------------------------
const P4_OLD = `, 1, 1028, environment, options.cwd, startupInfo, processInfo));`;
const P4_NEW = `, 1, 1028 | 0x08000000, environment, options.cwd, startupInfo, processInfo));`;
const P4_DONE = `1028 | 0x08000000`;

// ---------------------------------------------------------------------------
// 补丁 5：dsh-subprocess-local 起 Windows runner 时补 windowsHide
//
// 2026-09-21 实测定位（「每条命令弹一个 Windows Terminal」的真凶）：launchWindowsJob()
// 用 Node spawn 起 runner（**每条 shell 命令一个 node runner**，它是 pwsh 的父进程），
// spawn 选项里没有 windowsHide，而无控制台的父进程会让 Windows 新建控制台。
// 上游 0.1.5 只给 spawnSubprocess（起 pwsh 那一层）补了，这一层漏了 —— P1 管不到。
// ---------------------------------------------------------------------------
const P5_OLD = `\t\t\tenv: runnerEnvironment(WINDOWS_RUNNER_SELECTION, invocation),\n\t\t\tstdio: runnerStdio(spec, true, ignoredStdinFd ?? "pipe")\n\t\t});`;
const P5_NEW = `\t\t\tenv: runnerEnvironment(WINDOWS_RUNNER_SELECTION, invocation),\n\t\t\tstdio: runnerStdio(spec, true, ignoredStdinFd ?? "pipe"),\n\t\t\t${P5_MARK} 宿主无控制台：这一层不带 windowsHide，Windows 会为 runner\n\t\t\t// 新建控制台；默认终端是 Windows Terminal 时表现为每次命令弹一个终端窗口。\n\t\t\twindowsHide: true\n\t\t});`;
const P5_DONE = `windowsHide: true`;

/**
 * 补丁表。字段说明：
 *   platforms — 适用平台（null = 全平台）；`detect`/`apply` 都按传入 platform 判定。
 *   optIn     — 需要一个显式开关才应用（目前只有 `llmHeaders`）。
 *   doneMark  — 目标形态特征串：命中即"内核已自带/已是目标形态"，不再注入。
 *   marker    — 本补丁自己写下的 marker（P1/P5 同文件，必须区分）。
 */
export const PATCHES = [
  {
    id: "p4-win32-process-no-window",
    label: "dsh-win32-process CreateProcessW CREATE_NO_WINDOW",
    platforms: ["win32"],
    file: (root) => kernelFile(root, "dsh-win32-process", "lib/index.js"),
    steps: [{ match: P4_OLD, insert: P4_NEW }],
    doneMark: P4_DONE,
    doneNote: "已带 CREATE_NO_WINDOW，无需补丁",
    marker: MARKER,
    why: "每条 shell 命令新建一个可见控制台（真凶，2026-09-17 实测）",
  },
  {
    id: "p5-runner-windowsHide",
    label: "dsh-subprocess-local runner windowsHide",
    platforms: ["win32"],
    file: (root) => kernelFile(root, "dsh-subprocess-local", "lib/index.js"),
    steps: [{ match: P5_OLD, insert: P5_NEW }],
    doneMark: P5_DONE,
    doneNote: "已带 windowsHide，无需补丁",
    marker: P5_MARK,
    why: "每次工具调用弹一个 Windows Terminal 窗口（2026-09-21 实测）",
  },
  {
    id: "p2-acl-hidden-console",
    label: "dsh-sandbox-windows-acl runner hidden console",
    platforms: ["win32"],
    file: (root) => kernelFile(root, "dsh-sandbox-windows-acl", "lib/runner.js"),
    steps: [
      { match: P2_IMPORT_OLD, insert: P2_IMPORT_NEW },
      { match: P2_ANCHOR, insert: P2_INSERT },
    ],
    doneMark: null,
    doneNote: null,
    marker: MARKER,
    why: "受限令牌子进程闪窗（0xC0000142 不能直接加 CREATE_NO_WINDOW）",
  },
  {
    id: "p1-subprocess-windowsHide",
    label: "dsh-subprocess-local spawnSubprocess windowsHide",
    platforms: ["win32"],
    file: (root) => subprocessLaunchFile(root),
    steps: [{ match: P1_OLD, insert: P1_NEW }],
    doneMark: P1_DONE,
    doneNote: "内核已自带 windowsHide（0.1.5+），无需补丁",
    marker: MARKER,
    why: "≤0.1.2 一线：spawnSubprocess 自身缺 windowsHide",
  },
  {
    id: "p3-llm-headers",
    label: "dsh-llm-pi-ai custom requestHeaders",
    platforms: null,
    optIn: "llmHeaders",
    file: (root) => kernelFile(root, "dsh-llm-pi-ai", "lib/index.js"),
    steps: [{ match: P3_OLD, insert: P3_NEW }],
    doneMark: P3_DONE,
    doneNote: "已是目标形态（自定义头可覆盖 attribution）",
    marker: MARKER,
    why: "让自定义 User-Agent 生效；放松内核请求头保护，默认不应用",
  },
];

/** 读文件；不存在/不可读返回 null。 */
async function readText(path) {
  try {
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
}

/**
 * 判定单个补丁在给定文本上的状态。
 * @returns {{status: 'absent'|'satisfied'|'applied'|'unmatched'|'appliable', note: string}}
 */
function classify(patch, text) {
  if (text === null) return { status: "absent", note: "文件不存在（内核包未安装或布局变了）" };
  if (patch.doneMark !== null && text.includes(patch.doneMark)) {
    return { status: "satisfied", note: patch.doneNote ?? "已是目标形态" };
  }
  if (text.includes(patch.marker)) return { status: "applied", note: "marker 在，已注入" };
  const missing = patch.steps.filter((step) => !text.includes(step.match));
  if (missing.length > 0) {
    return { status: "unmatched", note: `${missing.length} 个 anchor 不匹配（内核版本变了？）` };
  }
  return { status: "appliable", note: "可以注入" };
}

/**
 * 只读检测：绝不写盘。
 * @param {{root?: string, platform?: string}} [options]
 * @returns {Promise<{root: string, platform: string, entries: object[], summary: object}>}
 */
export async function detectPatches({ root = kernelRoot(), platform = process.platform } = {}) {
  const entries = [];
  for (const patch of PATCHES) {
    const file = patch.file(root);
    if (patch.platforms !== null && !patch.platforms.includes(platform)) {
      entries.push({ id: patch.id, label: patch.label, file, optIn: patch.optIn ?? null, status: "platform-skipped", note: `不适用于 ${platform}` });
      continue;
    }
    const text = await readText(file);
    entries.push({ id: patch.id, label: patch.label, file, optIn: patch.optIn ?? null, why: patch.why, ...classify(patch, text) });
  }
  const count = (status) => entries.filter((e) => e.status === status).length;
  return {
    root,
    platform,
    entries,
    summary: {
      total: entries.length,
      applied: count("applied"),
      satisfied: count("satisfied"),
      appliable: count("appliable"),
      unmatched: count("unmatched"),
      absent: count("absent"),
      platformSkipped: count("platform-skipped"),
    },
  };
}

/**
 * 应用补丁（显式调用；`dryRun` 只报告不写盘）。
 *
 * 每个文件：`.bak` 备份（只在缺失时写，保留最初干净原件）→ 写入 `.tmp` →
 * `node --check` 语法校验（内核包是 ESM，node 会按包内 package.json 的
 * `type: module` 解析）→ rename 覆盖。任一步失败即删 tmp 并记为 failed，
 * 已写坏的现场可用 `--revert` 从 `.bak` 还原。
 *
 * @param {{root?: string, platform?: string, dryRun?: boolean, withLlmHeaders?: boolean, log?: Function}} [options]
 * @returns {Promise<{root: string, dryRun: boolean, actions: object[]}>}
 */
export async function applyPatches({
  root = kernelRoot(),
  platform = process.platform,
  dryRun = false,
  withLlmHeaders = false,
  log = () => {},
} = {}) {
  const actions = [];
  for (const patch of PATCHES) {
    const file = patch.file(root);
    if (patch.platforms !== null && !patch.platforms.includes(platform)) {
      actions.push({ id: patch.id, status: "skipped", note: `不适用于 ${platform}` });
      continue;
    }
    if (patch.optIn === "llmHeaders" && !withLlmHeaders) {
      actions.push({ id: patch.id, status: "skipped", note: "opt-in 未开启（--with-llm-headers）" });
      continue;
    }
    const text = await readText(file);
    const verdict = classify(patch, text);
    if (verdict.status === "applied" || verdict.status === "satisfied") {
      actions.push({ id: patch.id, status: "noop", note: verdict.note });
      continue;
    }
    if (verdict.status !== "appliable") {
      actions.push({ id: patch.id, status: "unmatched", note: verdict.note });
      continue;
    }
    if (dryRun) {
      actions.push({ id: patch.id, status: "would-apply", note: verdict.note });
      continue;
    }

    const backup = file + BACKUP_SUFFIX;
    const tmp = file + TMP_SUFFIX;
    try {
      if (!existsSync(backup)) await copyFile(file, backup);
      let out = text;
      for (const step of patch.steps) out = out.replace(step.match, step.insert);
      await writeFile(tmp, out, "utf8");
      const check = spawnSync(process.execPath, ["--check", tmp], { encoding: "utf8", windowsHide: true });
      if (check.status !== 0) {
        await rm(tmp, { force: true });
        actions.push({ id: patch.id, status: "failed", note: `语法校验未通过，已放弃：${String(check.stderr ?? "").trim().slice(0, 300)}` });
        continue;
      }
      await rename(tmp, file);
      log(`applied ${patch.id} → ${file} (backup ${backup})`);
      actions.push({ id: patch.id, status: "applied", note: `备份：${backup}` });
    } catch (error) {
      await rm(tmp, { force: true }).catch(() => {});
      actions.push({ id: patch.id, status: "failed", note: String(error?.message ?? error) });
    }
  }
  return { root, dryRun, actions };
}

/**
 * 从 `.bak` 还原所有打过补丁的文件。
 * @param {{root?: string}} [options]
 * @returns {Promise<{root: string, restored: object[], missing: object[]}>}
 */
export async function revertPatches({ root = kernelRoot() } = {}) {
  const restored = [];
  const missing = [];
  for (const patch of PATCHES) {
    const file = patch.file(root);
    const backup = file + BACKUP_SUFFIX;
    if (!existsSync(backup)) {
      missing.push({ id: patch.id, file, note: "没有备份（从未由本插件打过）" });
      continue;
    }
    try {
      await copyFile(backup, file);
      restored.push({ id: patch.id, file, from: backup });
    } catch (error) {
      missing.push({ id: patch.id, file, note: `还原失败：${String(error?.message ?? error)}` });
    }
  }
  return { root, restored, missing };
}

/**
 * 人类可读的一行摘要（给插件启动日志用）。
 * @param {object} report - detectPatches() 的返回值。
 * @returns {string}
 */
export function formatPatchSummary(report) {
  const { summary, root } = report;
  return `kernel patches @ ${root}: applied ${summary.applied}, satisfied ${summary.satisfied}, appliable ${summary.appliable}, unmatched ${summary.unmatched}, absent ${summary.absent}, n/a ${summary.platformSkipped}`;
}
