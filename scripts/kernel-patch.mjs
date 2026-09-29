#!/usr/bin/env node
// dsh-my 内核热补丁工具 —— 显式、可逆、原子。
//
// 背景：宿主 dsh web 由唤醒代理以 detached+windowsHide 拉起，自己没有控制台；
// Windows 会为「无控制台的父进程」派生控制台程序时新建可见窗口，于是每条 shell
// 命令/每次工具体调用都可能闪出一个命令行窗口。修法是给内核若干 spawn 点补
// windowsHide / CREATE_NO_WINDOW（详见 lib/kernel-patches.js 的补丁表）。
//
// 这些补丁写在全局 npm 安装树里，内核升级（npm i -g @deepseek-ai/dsh@x.y.z）会把
// 它们冲掉——重新执行本脚本即可。插件**不会**在启动时自动写内核：那是全系统唯一
// 能把宿主搞到起不来的副作用，必须由人显式触发。
//
// 用法：
//   node scripts/kernel-patch.mjs                      # 只读检测（默认）
//   node scripts/kernel-patch.mjs --check              # 同上，显式
//   node scripts/kernel-patch.mjs --apply              # 应用控制台补丁（原子写 + .bak + 语法校验）
//   node scripts/kernel-patch.mjs --apply --dry-run    # 只报告将要做什么
//   node scripts/kernel-patch.mjs --apply --with-llm-headers   # 额外应用 LLM 请求头补丁（默认 OFF）
//   node scripts/kernel-patch.mjs --revert             # 从 .bak 还原全部补丁
//   node scripts/kernel-patch.mjs --root <path>        # 覆盖内核根目录（默认自动推导）
//
// 退出码：0 = 检测/应用/还原成功；1 = 有失败项（写失败、anchor 不匹配、语法校验不过）。
// 生效时机：补丁写的是**下次启动**要加载的模块，当前进程不受影响——应用后需要重启
// DSH（界面左下角「重启 Harness」）才会看到效果。

import {
  detectPatches,
  applyPatches,
  revertPatches,
  kernelRoot,
  formatPatchSummary,
} from "../lib/kernel-patches.js";

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const valueOf = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};

const root = valueOf("--root") ?? kernelRoot();
const dryRun = has("--dry-run");
const withLlmHeaders = has("--with-llm-headers");

const STATUS_LABEL = {
  applied: "已注入",
  satisfied: "内核已自带",
  appliable: "可注入",
  unmatched: "anchor 不匹配",
  absent: "文件缺失",
  "platform-skipped": "平台不适用",
  "would-apply": "将注入",
  skipped: "跳过",
  noop: "无需动作",
  failed: "失败",
};

function printEntries(entries) {
  for (const entry of entries) {
    const label = STATUS_LABEL[entry.status] ?? entry.status;
    const opt = entry.optIn ? ` [opt-in: ${entry.optIn}]` : "";
    console.log(`  ${entry.status.padEnd(16)} ${entry.id}${opt}  — ${entry.note}`);
    if (entry.file) console.log(`      ${entry.file}`);
  }
}

if (has("--revert")) {
  const result = await revertPatches({ root });
  console.log(`内核根目录：${result.root}`);
  for (const item of result.restored) console.log(`  已还原 ${item.id} ← ${item.from}`);
  for (const item of result.missing) console.log(`  跳过   ${item.id} — ${item.note}`);
  process.exit(result.missing.some((m) => String(m.note).startsWith("还原失败")) ? 1 : 0);
}

if (has("--apply")) {
  const result = await applyPatches({ root, dryRun, withLlmHeaders, log: (m) => console.log(`  · ${m}`) });
  console.log(`内核根目录：${result.root}${dryRun ? "（dry-run，未写盘）" : ""}`);
  printEntries(result.actions);
  const failed = result.actions.filter((a) => a.status === "failed").length;
  const unmatched = result.actions.filter((a) => a.status === "unmatched").length;
  const changed = result.actions.filter((a) => a.status === "applied" || a.status === "would-apply").length;
  console.log(`\n小结：${changed} 项${dryRun ? "待写入" : "已写入"}，${failed} 项失败，${unmatched} 项 anchor 不匹配。`);
  if (!dryRun && changed > 0) {
    console.log("注意：补丁作用于下次启动加载的模块——请在界面左下角点「重启 Harness」后生效。");
  }
  process.exit(failed > 0 || unmatched > 0 ? 1 : 0);
}

const report = await detectPatches({ root });
console.log(formatPatchSummary(report));
printEntries(report.entries);
const pending = report.entries.filter((e) => e.status === "appliable" && !e.optIn);
const broken = report.entries.filter((e) => e.status === "unmatched");
if (pending.length > 0) {
  console.log(`\n有 ${pending.length} 个补丁可以注入：node scripts/kernel-patch.mjs --apply`);
}
if (broken.length > 0) {
  console.log(`\n有 ${broken.length} 个补丁的 anchor 不再匹配（内核版本变了，补丁需要更新）。`);
}
process.exit(0);
