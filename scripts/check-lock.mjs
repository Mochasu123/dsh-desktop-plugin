// 锁文件门禁：pnpm-lock.yaml 的 importer 声明必须与 package.json 一致。
//
// 为什么需要它：lockfile 长期与 manifest 漂移——里面躺着 package.json 根本没声明的
// `@deepseek-ai/dsh-tools`（旧实现遗留），也有已从清单移除的包。漂移本身不会报错，
// 但在新机器 / CI 上 `pnpm install --frozen-lockfile` 会直接失败。
//
// 判定分级（避免"改完 manifest 但还没 pnpm install"时无脑红）：
//   ✗ 清单声明了、lock 里没有 / specifier 不一致 → exit 1（这是会装错的）
//   ⚠ lock 里有、清单没有 → 只告警（陈旧条目；跑一次 pnpm install 即消失）
//   ⚠ 清单里没有任何 importers 记录（lock 残缺）→ 告警

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const lockPath = join(root, "pnpm-lock.yaml");
if (!existsSync(lockPath)) {
  console.log("没有 pnpm-lock.yaml（不是 pnpm 工程？）— 跳过");
  process.exit(0);
}

const lock = readFileSync(lockPath, "utf8");
// 取 `importers:` 下 `  .:` 这一段（缩进两空格的 key 到下一个同级 key 之前）
const importersAt = lock.indexOf("importers:");
if (importersAt < 0) {
  console.log("pnpm-lock.yaml 里没有 importers 段（lock 版本不同？）— 跳过");
  process.exit(0);
}
const rest = lock.slice(importersAt);
const selfAt = rest.search(/\n {2}\.\s*:/);
if (selfAt < 0) {
  console.log("pnpm-lock.yaml 里没有根 importer（`.`）— 跳过");
  process.exit(0);
}
const afterSelf = rest.slice(selfAt + 1);
const nextKey = afterSelf.slice(1).search(/\n {2}[^\s].*:\s*\n/);
const block = nextKey < 0 ? afterSelf : afterSelf.slice(0, nextKey + 1);

const lockEntries = new Map(); // name -> specifier
for (const m of block.matchAll(/'?(@?[^'\s:]+)'?:\s*\n\s+specifier:\s*(\S+)/g)) {
  lockEntries.set(m[1], m[2]);
}

const declared = new Map([
  ...Object.entries(pkg.dependencies ?? {}),
  ...Object.entries(pkg.devDependencies ?? {}),
]);

let failed = false;
for (const [name, spec] of [...declared].sort()) {
  const lockSpec = lockEntries.get(name);
  if (lockSpec === undefined) {
    failed = true;
    console.log(`✗ ${name} 在 package.json 里声明了（${spec}），pnpm-lock.yaml 的根 importer 里没有`);
  } else if (lockSpec !== spec) {
    failed = true;
    console.log(`✗ ${name} specifier 不一致：package.json=${spec}，lock=${lockSpec}`);
  } else {
    console.log(`✓ ${name}  ${spec}`);
  }
}

const stale = [...lockEntries.keys()].filter((name) => !declared.has(name) && name !== "@deepseek-ai/cordis");
if (stale.length > 0) {
  console.log(`\n⚠ pnpm-lock.yaml 里还有 package.json 未声明的条目：${stale.join(", ")}`);
  console.log("  （陈旧条目；在插件目录跑一次 pnpm install 会同步掉。CI 上的 --frozen-lockfile 会因此失败。）");
}
const peer = Object.keys(pkg.peerDependencies ?? {});
if (peer.length > 0) {
  console.log(`\n注：peerDependencies（${peer.join(", ")}）由 pnpm 自动安装，会出现在 lock 的 dependencies 段，属正常。`);
}

if (failed) {
  console.error("\n修复：在插件目录运行 pnpm install 重新生成锁文件（未安装的依赖会一起装上）。");
  process.exit(1);
}
console.log("\n锁文件门禁通过 ✓");
