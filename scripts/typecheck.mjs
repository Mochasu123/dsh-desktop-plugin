// 类型门禁（可选工具链）。
//
// 找不到 typescript 时**明确报告 SKIPPED**，绝不假装通过——"恒绿的门禁比没有门禁
// 更糟"（这正是 check-imports 旧实现的问题）。jsconfig.json 已经就绪，装一次
// typescript 即可启用：在插件目录 `pnpm add -D typescript`。

import { existsSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function findTsc() {
  const candidates = [
    join(root, "node_modules", "typescript", "lib", "tsc.js"),
    process.env.APPDATA ? join(process.env.APPDATA, "npm", "node_modules", "typescript", "lib", "tsc.js") : null,
    process.env.npm_config_prefix ? join(process.env.npm_config_prefix, "node_modules", "typescript", "lib", "tsc.js") : null,
    process.env.ProgramFiles ? join(process.env.ProgramFiles, "nodejs", "node_modules", "typescript", "lib", "tsc.js") : null,
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  const pnpm = join(root, "node_modules", ".pnpm");
  if (existsSync(pnpm)) {
    const hit = readdirSync(pnpm).find((name) => name.startsWith("typescript@"));
    if (hit) {
      const p = join(pnpm, hit, "node_modules", "typescript", "lib", "tsc.js");
      if (existsSync(p)) return p;
    }
  }
  return null;
}

const tsc = findTsc();
if (tsc === null) {
  console.log("typecheck: SKIPPED — 未找到 typescript。");
  console.log("  启用方式：在 dsh-plugin 目录执行 `pnpm add -D typescript`，然后 `npm run typecheck`。");
  console.log("  （jsconfig.json 已就绪：checkJs + noEmit，先只覆盖服务端 lib/、scripts/、test/。）");
  process.exit(0);
}

console.log(`typecheck: ${tsc}`);
const result = spawnSync(process.execPath, [tsc, "--noEmit", "-p", join(root, "jsconfig.json")], {
  cwd: root,
  stdio: "inherit",
});
process.exit(result.status ?? 1);
