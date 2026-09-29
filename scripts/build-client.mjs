#!/usr/bin/env node
// dsh-my 客户端构建器 —— 零依赖（本机没有 esbuild，也不假设能装）。
//
// 背景：宿主只加载**一个**客户端产物（包的 `exports["./client"]`），而
// `window.__ModuleLoader__` 给出的 `require` 只能解析"模块表"里的词（react 等
// baseline 外部包），**不能** `require("./子文件")`。所以客户端要模块化，必须有
// 构建步：本脚本把 `src/client/*` 按序拼成一个 `client.js`。
//
// 设计要点（保证行为零变化）：
//   * `_wrapper-prefix.js` / `_wrapper-suffix.js` 是**直接从原文件切出来**的宿主外壳
//     （`window.__ModuleLoader__.load({...})` 的开关与 `exports.apply/inject`），
//     不手抄，因此拼接结果与重构前的文件逐字节一致（只多一行"生成物"横幅）。
//   * 各片段是**普通脚本片段**，共享同一个 factory 闭包作用域——不是 ES 模块。
//     这样拆分不改动任何作用域语义（`const`/`function` 的相对顺序原样保留）。
//     类型检查由 `tsc` 覆盖 `src/client`（见 jsconfig.json）——等装上 typescript 后即可启用。
//   * `--split` 是**一次性搬运**：从当前 `client.js` 切出片段，并在写盘前断言
//     "prefix + 片段 + suffix === 原文件"，不一致就中止（绝不产出残件）。
//   * `--check` 供门禁用：只在生成物与源码不一致时失败（提醒重跑构建）。
//
// 用法：
//   node scripts/build-client.mjs            # 由 src/client/* 生成 client.js
//   node scripts/build-client.mjs --check    # 只校验生成物是否最新（CI/门禁）
//   node scripts/build-client.mjs --split    # 一次性：从旧 client.js 切出 src/client/*
//
// 想换成 esbuild：`pnpm add -D esbuild` 后把下面 build() 里的拼接换成
//   esbuild src/client/entry.js --bundle --format=iife --external:react --outfile=client.js
// 但注意宿主外壳（`window.__ModuleLoader__.load` + factory 的 require）仍需保留，
// 现成的 `_wrapper-*.js` 可以继续用。

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const clientPath = join(root, "client.js");
const srcDir = join(root, "src", "client");
const MANIFEST = "manifest.json";

const BANNER = "// ⚠ 生成物 —— 不要手工编辑。\n"
  + "// 源码：src/client/*.js（顺序见 src/client/manifest.json），改完运行：node scripts/build-client.mjs\n"
  + "// 校验：node scripts/build-client.mjs --check（scripts/verify.mjs 已包含这一步）\n\n";

/** 片段切分点（有序；都用「行首去空白后 startsWith」匹配）。想再拆细就在这里加一行。 */
const SPLIT_POINTS = [
  { file: "10-i18n.js", from: 'const NS = "sessionCenter";' },
  { file: "20-core.js", from: 'const inject = ["slots", "sessions", "locale", "uiWorkspace"];' },
  { file: "30-styles.js", from: "const CSS = `" },
  { file: "40-app-palette-wallpaper.js", from: "const PALETTE = [" },
  { file: "41-app-zen-detect.js", from: "let zenState = {" },
  { file: "42-app-dialogs.js", from: "function Dialog({ title, body, actions, onClose" },
  { file: "43-app-composer.js", from: "function StatsLinePlus({ useChat" },
  { file: "44-app-restart-welcome.js", from: "function RestartButton({ wide, t })" },
  { file: "45-app-sidebar.js", from: "function SessionCenterBrowser({ wide" },
  { file: "46-app-entry.js", from: "function apply(ctx) {" },
];
/** 宿主外壳的收尾行（`exports.apply = apply;` 起算，含 loader 的闭合括号）。 */
const BODY_END = "exports.apply = apply;";

function readClient() {
  if (!existsSync(clientPath)) throw new Error(`找不到 ${clientPath}`);
  return readFileSync(clientPath, "utf8");
}

/** 按切分点把（已去横幅的）文件切成 [prefix, 片段..., suffix]。 */
function slice(text) {
  const lines = text.split("\n");
  const indexOfLine = (needle) => {
    const i = lines.findIndex((line) => line.trimStart().startsWith(needle));
    if (i < 0) throw new Error(`找不到锚点：${needle}`);
    return i;
  };
  const points = SPLIT_POINTS.map((p) => ({ ...p, at: indexOfLine(p.from) }));
  const end = indexOfLine(BODY_END);
  const ordered = [...points.map((p) => p.at), end];
  for (let i = 1; i < ordered.length; i += 1) {
    if (ordered[i] <= ordered[i - 1]) {
      throw new Error(`锚点顺序异常（第 ${i} 个）：${SPLIT_POINTS.map((p, k) => `${p.file}@${ordered[k]}`).join(", ")}`);
    }
  }
  const fragments = [];
  for (let i = 0; i < points.length; i += 1) {
    const stop = i + 1 < points.length ? points[i + 1].at : end;
    fragments.push({ file: points[i].file, body: lines.slice(points[i].at, stop).join("\n") });
  }
  return {
    prefix: lines.slice(0, points[0].at).join("\n"),
    fragments,
    suffix: lines.slice(end).join("\n"),
  };
}

function assemble() {
  const manifestPath = join(srcDir, MANIFEST);
  if (!existsSync(manifestPath)) throw new Error(`缺少 ${manifestPath}；先跑一次 --split`);
  const order = JSON.parse(readFileSync(manifestPath, "utf8")).fragments;
  // 陈旧片段守卫：src/client 里出现 manifest 未列出的片段时直接失败。
  // （教训：细分拆一次之后，上一版的 40-app.js 被留在目录里——构建会忽略它，
  //   但下一个人可能去改一个根本不参与产物的文件。）
  const known = new Set(["_wrapper-prefix.js", "_wrapper-suffix.js", MANIFEST, ...order]);
  const stale = readdirSync(srcDir).filter((name) => !known.has(name));
  if (stale.length > 0) {
    throw new Error(`src/client 里有未参与构建的文件：${stale.join(", ")}（删掉，或加进 manifest.json 的 fragments）`);
  }
  const prefix = readFileSync(join(srcDir, "_wrapper-prefix.js"), "utf8");
  const suffix = readFileSync(join(srcDir, "_wrapper-suffix.js"), "utf8");
  const parts = order.map((name) => readFileSync(join(srcDir, name), "utf8"));
  return `${BANNER}${prefix}\n${parts.join("\n")}\n${suffix}`;
}

/**
 * 拼接结果的语法自检。**必须在写盘前跑**。
 *
 * 为什么不能靠目录里的 `node --check client.js`：目录内没有 package.json 的
 * `type`（本包是 `"type": "module"`，但 `node --check` 对 `.js` 走的是
 * CommonJS 猜测路径），顶层 `export {}` 会被判成语法错误 —— 假红。
 *
 * 做法：把拼接结果按 `.mjs` 语义做一次真正的模块解析。`node --check <file>.mjs`
 * 只解析不执行，所以不会触发客户端的任何副作用，也正好用上 `"type": "module"`。
 *
 * 教训（2026-09-28）：`30-styles.js` 的 CSS 是**模板字面量**，在注释里写反引号
 * 会直接终结字符串、生成一个语法坏掉却"构建成功"的产物。加这道闸后，坏产物
 * 再也出不了构建器。
 *
 * @param {string} code - assemble() 的结果。
 */
function assertParses(code) {
  const probe = join(root, `client.build-check-${process.pid}.mjs`);
  // 探针必须先登记、后写盘：`process.exit()` **不会**执行 finally，
  // 所以失败路径上的清理只能挂在 exit 钩子上（2026-09-28 实测：语法闸拦下三次，
  // 仓库里就留了三个 client.build-check-*.mjs 残件）。
  const cleanup = () => { try { rmSync(probe, { force: true }); } catch { /* 不影响结论 */ } };
  process.once("exit", cleanup);
  try {
    writeFileSync(probe, code, "utf8");
    const result = spawnSync(process.execPath, ["--check", probe], { encoding: "utf8" });
    if (result.status !== 0) {
      console.error("✗ 拼接结果语法错误（未写盘）：");
      console.error(String(result.stderr ?? "").trim().slice(0, 2000));
      process.exit(1);
    }
  } finally {
    cleanup();
    process.removeListener("exit", cleanup);
  }
}

function build({ check }) {
  const generated = assemble();
  assertParses(generated);
  const fragmentCount = JSON.parse(readFileSync(join(srcDir, MANIFEST), "utf8")).fragments.length;
  if (check) {
    const current = readFileSync(clientPath, "utf8");
    if (current !== generated) {
      console.error("✗ client.js 与 src/client/* 不一致 —— 运行 `node scripts/build-client.mjs` 重新生成。");
      process.exit(1);
    }
    console.log(`✓ client.js 与 src/client/* 一致（${generated.split("\n").length} 行，${fragmentCount} 个片段）`);
    return;
  }
  writeFileSync(clientPath, generated, "utf8");
  console.log(`✓ 已生成 client.js（${generated.split("\n").length} 行，来自 ${fragmentCount} 个片段）`);
}

function split() {
  const raw = readClient();
  // 生成物带横幅：切分时先剥掉，避免横幅被并进 _wrapper-prefix.js（否则构建会叠两遍）
  const text = raw.startsWith(BANNER) ? raw.slice(BANNER.length) : raw;
  const { prefix, fragments, suffix } = slice(text);

  // 写盘前先自证：拼回去必须与正文完全一致（绝不产出残件）
  const rebuilt = `${prefix}\n${fragments.map((f) => f.body).join("\n")}\n${suffix}`;
  if (rebuilt !== text) {
    console.error("✗ 切分自检失败：拼回结果与原文件不一致，未写任何文件。");
    process.exit(1);
  }

  const existing = existsSync(srcDir) ? readdirSync(srcDir).filter((n) => n !== MANIFEST) : [];
  if (existing.length > 0 && !process.argv.includes("--force")) {
    console.error(`✗ ${srcDir} 已有 ${existing.length} 个文件；如需重切，加 --force（会覆盖片段）。`);
    process.exit(1);
  }
  mkdirSync(srcDir, { recursive: true });
  writeFileSync(join(srcDir, "_wrapper-prefix.js"), prefix, "utf8");
  writeFileSync(join(srcDir, "_wrapper-suffix.js"), suffix, "utf8");
  for (const fragment of fragments) writeFileSync(join(srcDir, fragment.file), fragment.body, "utf8");
  writeFileSync(
    join(srcDir, MANIFEST),
    JSON.stringify({
      note: "客户端产物的片段顺序；client.js 由 scripts/build-client.mjs 生成，勿手改产物。",
      fragments: fragments.map((f) => f.file),
      generated: "client.js",
    }, null, 2) + "\n",
    "utf8",
  );
  const sizes = [["_wrapper-prefix.js", prefix], ...fragments.map((f) => [f.file, f.body]), ["_wrapper-suffix.js", suffix]]
    .map(([name, body]) => `  ${String(body.split("\n").length).padStart(5)} 行  ${name}`)
    .join("\n");
  console.log(`✓ 已切分 src/client/：\n${sizes}\n  合计 ${rebuilt.split("\n").length} 行（与正文一致）`);
}

const mode = process.argv.includes("--split") ? "split" : process.argv.includes("--check") ? "check" : "build";
if (mode === "split") split();
else build({ check: mode === "check" });
