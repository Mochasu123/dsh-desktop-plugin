// 一键门禁（跨平台，比 .ps1 更适合放进 CI）。
//
// 顺序：语法 → 客户端一致性 → 依赖声明 → 锁文件 → 单元测试 → 打包清单 → 类型（若装了 tsc）。
// 任何一步失败即 exit 1，并在末尾打印小结。

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const pluginDir = join(dirname(fileURLToPath(import.meta.url)), "..");

/** 收集所有需要语法检查的 JS 文件。 */
function collectJs(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) collectJs(p, out);
    else if (/\.(js|mjs|cjs)$/.test(name)) out.push(p);
  }
  return out;
}

const results = [];
const step = (label, fn) => {
  process.stdout.write(`\n──── ${label} ────\n`);
  const ok = fn();
  results.push({ label, ok });
  return ok;
};

step("语法检查（node --check）", () => {
  const targets = [
    ...collectJs(join(pluginDir, "lib")),
    ...collectJs(join(pluginDir, "scripts")),
    ...collectJs(join(pluginDir, "test")),
    join(pluginDir, "client.js"),
  ].filter((p) => existsSync(p));
  let bad = 0;
  for (const file of targets) {
    const r = spawnSync(process.execPath, ["--check", file], { stdio: "ignore" });
    if (r.status !== 0) {
      bad += 1;
      console.log(`✗ ${file.slice(pluginDir.length + 1)}`);
    }
  }
  console.log(bad === 0 ? `✓ ${targets.length} 个文件语法通过` : `✗ ${bad}/${targets.length} 个文件语法失败`);
  return bad === 0;
});

step("客户端产物（client.js 是否与 src/client/* 一致）", () => {
  const r = spawnSync(process.execPath, [join(pluginDir, "scripts", "build-client.mjs"), "--check"], { cwd: pluginDir, stdio: "inherit" });
  return r.status === 0;
});

step("依赖声明（check-imports）", () => {
  const r = spawnSync(process.execPath, [join(pluginDir, "scripts", "check-imports.mjs")], { cwd: pluginDir, stdio: "inherit" });
  return r.status === 0;
});

step("锁文件（check-lock）", () => {
  const r = spawnSync(process.execPath, [join(pluginDir, "scripts", "check-lock.mjs")], { cwd: pluginDir, stdio: "inherit" });
  return r.status === 0;
});

step("单元测试：dsh-desktop-plugin", () => {
  const r = spawnSync(process.execPath, ["--test"], { cwd: pluginDir, stdio: "inherit" });
  return r.status === 0;
});

step("打包清单（files[] 覆盖运行时产物）", () => {
  const pkg = JSON.parse(readFileSync(join(pluginDir, "package.json"), "utf8"));
  const entries = pkg.files ?? [];
  const required = [
    "lib/index.js",
    "lib/kernel-patches.js",
    "client.js",
    "cordis.patch.yml",
    "bin/ModernFolderPicker.dll",
  ];
  let ok = true;
  for (const rel of required) {
    if (!existsSync(join(pluginDir, rel))) {
      console.log(`✗ 运行时产物缺失：${rel}`);
      ok = false;
      continue;
    }
    // 必须被 files[] 的某一条覆盖（目录条目也算）
    const covered = entries.some((e) => rel === e || rel.startsWith(e.replace(/\/$/, "") + "/"));
    console.log(`${covered ? "✓" : "✗"} ${rel}${covered ? "" : "  ← 未被 files[] 包含，npm pack 会丢掉它"}`);
    if (!covered) ok = false;
  }
  return ok;
});

step("类型检查（typescript，可选）", () => {
  const r = spawnSync(process.execPath, [join(pluginDir, "scripts", "typecheck.mjs")], { cwd: pluginDir, stdio: "inherit" });
  return r.status === 0;
});

console.log("\n════════ 门禁小结 ════════");
for (const { label, ok } of results) console.log(`${ok ? "✓" : "✗"} ${label}`);
const failed = results.filter((r) => !r.ok).length;
console.log(failed === 0 ? "\n全部通过 ✓" : `\n${failed} 项失败 ✗`);
process.exit(failed === 0 ? 0 : 1);
