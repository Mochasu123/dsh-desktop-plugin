// dsh-session-center — server half.
//
// Registers /api/session-center.* routes on the kernel Connection seam
// (ctx.connection.fetch.register → inherits host/origin fencing + browser auth):
//   tag.list / tag.save / tag.delete / tag.setSessions
//   pin.set
//   session.delete / session.restore
//   trash.list / trash.purge
//   session.backup / backups.list / backups.restore
//   session.diagnose / session.repair
//   restart (POST only — spawn successor process, then exit)
// Also auto-backs-up sessions when they are disposed, and refuses to delete
// sessions that still have an attached running agent.

import { appendFile, mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { closeSync, openSync, readFileSync, existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { homedir } from "node:os";
import { basename, dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { CenterState, centerRoot } from "./state.js";
import {
  backupSessionFile,
  findSessionDir,
  findSessionLog,
  purgeTrashFile,
  restoreBackupFile,
  restoreTrashFile,
  trashLogPath,
  trashSessionFile,
} from "./backup.js";
import { repairLogBuffer } from "./repair.js";
import { validateLogBuffer } from "./logscan.js";
import { decodeAll } from "./zstd.js";
import { detectPatches, formatPatchSummary } from "./kernel-patches.js";

// 注意（2026-09-26 移除）：这里曾有一块 import 期副作用——`await import("undici")`
// 并在 `HTTP_PROXY/HTTPS_PROXY` 缺失时写死 `http://127.0.0.1:7897`，再
// `setGlobalDispatcher(new EnvHttpProxyAgent())`。它是模块加载期执行的，会影响
// **整个宿主进程**的所有出站请求（含内核的 LLM 调用），而 7897 是本机专属端口；
// 它还与 `~/.dsh/proxy-bootstrap.mjs`（由 `--import` 在主入口之前跑）职责重叠。
// 依赖门禁（scripts/check-imports.mjs）也证实 `undici` 从未声明在 package.json 里。
// 代理一律交给 bootstrap / 环境变量，插件不再越权。见 docs/ARCHITECTURE.md §7 缺陷 #7。

export const name = "dsh-session-center";

// 0.1.2 起路由走内核 Connection seam（ctx.connection.fetch.register）：认证与
// Host/Origin 栅栏由 Connection 统一施加，本插件不再手写 gate()，注册也自动归属
// 调用者 fiber，因此必须声明 connection —— 未 inject 时 Cordis 4 直接抛
// 「cannot get property "connection" without inject」，表现为路由整块不注册。
// tools/llm 已随 clock.js（未注册的 get_current_time）一并移除：能力应由内核的
// dsh-time-context 之类插件提供，插件不该为用不到的服务留硬门禁。
export const inject = ["webServer", "connection", "workspaceRegistry", "sessions", "agents", "systemPrompt"];

const SESSION_ID_RE = /^[A-Za-z0-9][A-Za-z0-9-]{0,127}$/;
/** Windows 保留设备名：`join(dir, "CON")` 会落到设备而不是目录，必须显式拒绝。 */
const RESERVED_WINDOWS_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
/** 会话 id 校验（正则 + 保留名）。 */
function isValidSessionId(id) {
  return typeof id === "string" && SESSION_ID_RE.test(id) && !RESERVED_WINDOWS_NAMES.test(id);
}
const TAG_ID_RE = /^tag-[A-Za-z0-9-]{1,64}$/;

// 壁纸图片文件的**授权目录**：只有用户在本进程里扫描/选择过的目录才允许通过
// `wallpaper.file` 读取。此前该路由按扩展名放行**任意绝对路径**（等于给 Web 侧
// 开了一个"读取本机任意图片/SVG"的口子）。见 docs/ARCHITECTURE.md §7 缺陷 #9。
// 集合为空时（尚未扫描）保持放行并告警一次：客户端挂载后会先 scanFolder 再请求
// 图片，若因竞态直接拒绝会让幻灯片整块失效。
const wallpaperRoots = new Set();
let wallpaperRootsWarned = false;

/** 路径是否落在任一授权目录内（大小写不敏感；Windows 同盘比较用 resolve 归一）。 */
function isAuthorizedWallpaperPath(filePath) {
  if (wallpaperRoots.size === 0) return true;
  const target = resolve(filePath).toLowerCase();
  for (const root of wallpaperRoots) {
    if (target === root || target.startsWith(root.endsWith(sep) ? root : root + sep)) return true;
  }
  return false;
}

// ------------------------------------------------------------ 费用 / 余额
// 计费价格表（人民币 / 百万 tokens），按「厂商通道」x「模型」两级索引。
//
// 官方（DeepSeek 官方直连，2026-08-17 起峰谷定价，周末全天空闲 / 半价）：
//   模型            输入缓存命中(空闲/高峰)  输入未命中(空闲/高峰)  输出(空闲/高峰)
//   v4-pro         0.15 / 0.30             4.50 / 9.00           13.50 / 27.00
//   v4-flash       0.05 / 0.10             1.50 / 3.00            4.50 / 9.00
//   v4-flash-vision-exp = v4-flash
//
// 我方（CCAI 中转 deep-seek.cc 自身渠道价，同样峰谷定价）：
//   v4-pro         0.10 / 0.20             2.97 / 5.94            8.91 / 17.82
//   v4-flash       0.02 / 0.03             0.50 / 0.99            1.49 / 2.97
//   v4-flash-vision-exp = v4-flash
//
// 高峰时段 = 北京时间周一至周五 9:00–12:00、14:00–18:00；其余（含周六/周日
// 全天）为空闲时段。参考 api-docs.deepseek.com/zh-cn/quick_start/pricing 及
// deep-seek.cc 模型价目页。
const PRICES_CHANNEL = {
  // DeepSeek 官方直连
  official: {
    "deepseek-v4-pro":         { missIdle: 4.5,  missPeak: 9.0,  hitIdle: 0.15, hitPeak: 0.30, outIdle: 13.5,  outPeak: 27.0 },
    "deepseek-v4-flash":       { missIdle: 1.5,  missPeak: 3.0,  hitIdle: 0.05, hitPeak: 0.10, outIdle: 4.5,   outPeak: 9.0 },
    "deepseek-v4-flash-vision-exp": { missIdle: 1.5, missPeak: 3.0, hitIdle: 0.05, hitPeak: 0.10, outIdle: 4.5, outPeak: 9.0 },
  },
  // CCAI 中转（deep-seek.cc）自身渠道
  ccai: {
    "deepseek-v4-pro":         { missIdle: 2.97, missPeak: 5.94, hitIdle: 0.10, hitPeak: 0.20, outIdle: 8.91,  outPeak: 17.82 },
    "deepseek-v4-flash":       { missIdle: 0.5,  missPeak: 0.99, hitIdle: 0.02, hitPeak: 0.03, outIdle: 1.49,  outPeak: 2.97 },
    "deepseek-v4-flash-vision-exp": { missIdle: 0.5, missPeak: 0.99, hitIdle: 0.02, hitPeak: 0.03, outIdle: 1.49, outPeak: 2.97 },
  },
};

/** 模型缺省价格档：未收录的模型按 v4-flash（官方/CCAI 各自档）计费。 */
const DEFAULT_MODEL = "deepseek-v4-flash";

/** 把日志 provider 名映射到厂商通道（official / ccai）。未知 provider → 官方。 */
function channelForProvider(provider) {
  if (typeof provider !== "string") return "official";
  const p = provider.toLowerCase();
  if (p.includes("ccai") || p === "deep-seek") return "ccai";
  return "official";
}

/** 取某模型在指定通道下的价格表；模型未知时回落到默认档。 */
function priceFor(channel, model) {
  const table = PRICES_CHANNEL[channel] ?? PRICES_CHANNEL.official;
  return table[model] ?? table[DEFAULT_MODEL];
}

/** 北京时间是否处于高峰时段：
    周一至周五 09:00–12:00、14:00–18:00 为高峰；其余（含周六/周日全天）空闲。 */
export function isPeakBeijing(time) {
  const d = new Date(Number(time) + 8 * 3600e3);
  const day = d.getUTCDay(); // 0=周日
  if (day === 0 || day === 6) return false; // 周末全天空闲
  const hour = d.getUTCHours();
  return (hour >= 9 && hour < 12) || (hour >= 14 && hour < 18);
}

// 扫描缓存：sig = 文件 size:mtimeMs；运行中日志每次追加都会换 sig，
// 故再按 10s 冷却，避免 5s 轮询时反复全量解压大日志。
const costCache = new Map();
const COST_CACHE_MAX = 500;
const COST_REFRESH_MS = 10_000;

/**
 * 扫描会话日志，按每次 LLM 请求（turn:step 的最终 usage）的实际时段
 * （高峰/空闲）与所用厂商通道/模型精确累计本对话费用（人民币）。
 * usage 字段已是 disjoint 口径（inputTokens 为未命中输入，
 * cacheReadTokens 为命中输入）。通道/模型由日志里的 request/header 记录
 * 按 seq 前向归属：排在某个 usage 之前最近的 request/header 即该次请求的
 * provider/model；无归属或未知模型时回落到官方 v4-flash 档。
 * @param sessionId - 会话 id。
 * @returns 费用与 token 汇总。
 */
export async function scanSessionCost(sessionId) {
  const found = await findSessionLog(sessionId);
  if (!found?.log) throw Object.assign(new Error(`session "${sessionId}" has no on-disk artifact`), { code: "not-found" });
  const file = found.log;
  const st = await stat(file).catch(() => null);
  if (!st) throw Object.assign(new Error(`session "${sessionId}" log unreadable`), { code: "not-found" });
  const sig = `${st.size}:${st.mtimeMs}`;
  const now = Date.now();
  const cached = costCache.get(sessionId);
  if (cached && (cached.sig === sig || now - cached.at < COST_REFRESH_MS)) return cached.value;
  const buffer = await readFile(file);
  const { text } = decodeAll(buffer);
  // 按 seq 升序收集：request/header（provider/model 归属）+ usage（消费）。
  const headers = [];
  const perRequest = new Map(); // turn:step -> 最后一次 usage（取 seq 最大者）
  for (const line of text.split("\n")) {
    if (line.includes('"type":"request/header"')) {
      let row;
      try { row = JSON.parse(line); } catch { continue; }
      const cfg = row.data?.header?.config ?? {};
      if (cfg && (cfg.model || cfg.provider)) {
        headers.push({ seq: row.seq, provider: cfg.provider, model: cfg.model });
      }
      continue;
    }
    // Token usage moved between formats (0.1.2-rc.1 → 0.1.5-rc.1):
    //   v0/v1/v2  `assistant/chunk` whose chunk is `{type:"usage", usage:{…}}`
    //   v3        `assistant/message` carrying `data.usage` directly
    //             (the event vocabulary dropped `assistant/chunk`, and the
    //             release notes say there is no separate usage record).
    // Match on the ROW TYPE first: `assistant/attempt` rows embed the whole
    // compressed stream, whose nested usage chunk would otherwise be counted
    // twice.
    let usage = null;
    let row = null;
    if (line.includes('"type":"assistant/message"')) {
      try { row = JSON.parse(line); } catch { continue; }
      if (row.type !== "assistant/message") continue;
      usage = row.data?.usage ?? null;
    } else if (line.includes('"type":"assistant/chunk"')) {
      try { row = JSON.parse(line); } catch { continue; }
      if (row.type !== "assistant/chunk") continue;
      const chunk = row.data?.chunk;
      usage = chunk?.type === "usage" ? chunk.usage : null;
    } else {
      continue;
    }
    if (!usage) continue;
    const key = `${row.data.turn}:${row.data.step}`;
    const rec = {
      seq: row.seq,
      time: row.time,
      uncached: usage.inputTokens ?? 0,
      cacheRead: usage.cacheReadTokens ?? 0,
      output: usage.outputTokens ?? 0,
    };
    const prev = perRequest.get(key);
    if (!prev || rec.seq >= prev.seq) perRequest.set(key, rec);
  }
  headers.sort((a, b) => a.seq - b.seq);
  let cost = 0;
  let uncached = 0;
  let cacheRead = 0;
  let output = 0;
  let peakRequests = 0;
  let idleRequests = 0;
  const channelSet = new Set(); // 用到的厂商通道（official / ccai）
  for (const r of perRequest.values()) {
    // 该 request 之前最近的 header 归属（无则回落官方默认档）
    let active = null;
    for (const h of headers) {
      if (h.seq <= r.seq) active = h;
      else break;
    }
    const channel = channelForProvider(active?.provider);
    channelSet.add(channel);
    const p = priceFor(channel, active?.model);
    const peak = isPeakBeijing(r.time);
    if (peak) peakRequests += 1;
    else idleRequests += 1;
    const miss = peak ? p.missPeak : p.missIdle;
    const hit = peak ? p.hitPeak : p.hitIdle;
    const out = peak ? p.outPeak : p.outIdle;
    cost += (r.uncached * miss + r.cacheRead * hit + r.output * out) / 1e6;
    uncached += r.uncached;
    cacheRead += r.cacheRead;
    output += r.output;
  }
  const value = {
    cost,
    requests: perRequest.size,
    peakRequests,
    idleRequests,
    inputTokens: uncached,
    cacheReadTokens: cacheRead,
    outputTokens: output,
    channel: channelSet.size === 1 ? [...channelSet][0] : "mixed",
  };
  if (costCache.size >= COST_CACHE_MAX) costCache.delete(costCache.keys().next().value);
  costCache.set(sessionId, { sig, at: Date.now(), value });
  return value;
}

/** 从 $DSH_HOME/.credentials.yaml（refs.DEEPSEEK_API_KEY）读取服务端密钥；
    仅在服务端使用，绝不进入客户端或模型上下文。 */
function readDeepSeekApiKey() {
  try {
    const raw = readFileSync(join(process.env.DSH_HOME ?? homedir(), ".credentials.yaml"), "utf8");
    const m = /^[ \t]*DEEPSEEK_API_KEY:[ \t]*(\S+)/m.exec(raw);
    if (m && m[1]) return m[1];
  } catch { /* fall through to env */ }
  return process.env.DEEPSEEK_API_KEY ?? "";
}

const balanceCache = { at: 0, value: null };
const BALANCE_TTL_MS = 30_000;

/** 查询 DeepSeek 官方账户余额（GET /user/balance，服务端 30s 缓存）。 */
export async function fetchDeepSeekBalance(ctx) {
  const now = Date.now();
  if (balanceCache.value && now - balanceCache.at < BALANCE_TTL_MS) return balanceCache.value;
  const key = readDeepSeekApiKey();
  if (!key) throw Object.assign(new Error("DeepSeek API key not configured (DEEPSEEK_API_KEY)"), { code: "unconfigured" });
  const res = await fetch("https://api.deepseek.com/user/balance", {
    headers: { authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(8000),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw Object.assign(new Error(`DeepSeek balance query failed (HTTP ${res.status})`), { code: "balance-error" });
  }
  const infos = Array.isArray(body?.balance_infos) ? body.balance_infos : [];
  const info = infos.find((b) => b?.currency === "CNY") ?? infos[0];
  if (!info) throw Object.assign(new Error("DeepSeek balance query returned no balance info"), { code: "balance-error" });
  const value = {
    isAvailable: body?.is_available === true,
    currency: typeof info.currency === "string" ? info.currency : "CNY",
    total: Number(info.total_balance),
    granted: Number(info.granted_balance ?? 0),
    toppedUp: Number(info.topped_up_balance ?? 0),
  };
  balanceCache.at = now;
  balanceCache.value = value;
  return value;
}

// 说明：原先的 readJsonBody/sendJson/ok/fail 四件套已随路由迁移删除——
// 请求体上限由 Connection 的 buffered 模式统一执行，封包改成 Response.json。

/** Dispose an agent's scope/fiber so deletion can proceed. */
async function disposeAgentFiber(agent, sessionId, ctx, force) {
  if (!agent || typeof agent !== "object") return false;

  // If running and force=true, cancel the current activity first.
  if (force === true && typeof agent.status === "string" && agent.status === "running") {
    try {
      if (typeof agent.cancel === "function") {
        agent.cancel({ kind: "disposed" });
        const TIMEOUT_MS = 15_000;
        if (agent.activityDone instanceof Promise) {
          await Promise.race([
            agent.activityDone,
            new Promise((r) => setTimeout(r, TIMEOUT_MS)),
          ]);
        }
      }
    } catch {
      // cancellation is best-effort; proceed to dispose anyway
    }
  }

  // 1. Preferred: ReactLoopAgent / scope-based agents.
  //    agent.scope.dispose() = quiesceFiber(fiber): properly waits for
  //    the scope fiber to quiesce, then disposes it. Same path as the
  //    agent-loop's own lifecycle teardown.
  try {
    if (typeof agent.scope?.dispose === "function") {
      // Double-check: if force is not set and the agent is now running,
      // refuse (protects against a race where the agent wakes up between
      // the route check and this point).
      if (force !== true && typeof agent.status === "string" && agent.status === "running") {
        return false;
      }
      await agent.scope.dispose();
      removeAgentStoreEntry(ctx, sessionId);
      return true;
    }
  } catch (e) {
    ctx.logger?.warn?.("[dsh-session-center] agent.scope.dispose failed:", e);
  }

  // 2. Fallback: any agent exposing a Cordis ctx with a real Fiber.
  //    NOTE: ctx.dispose throws "cannot get property dispose without inject"
  //    because ctx is a Cordis Proxy — use ctx.fiber.dispose instead.
  try {
    const fiber = agent.ctx?.fiber;
    if (fiber && typeof fiber.dispose === "function") {
      await Promise.resolve(fiber.dispose());
      removeAgentStoreEntry(ctx, sessionId);
      return true;
    }
  } catch (e) {
    ctx.logger?.warn?.("[dsh-session-center] agent.ctx.fiber.dispose failed:", e);
  }

  return false;
}

/** Remove the agent from the live registry (agents.store) after disposal. */
function removeAgentStoreEntry(ctx, sessionId) {
  if (!ctx.agents) return;
  try {
    const entry = ctx.agents.store?.get?.(sessionId);
    if (!entry) return;
    try {
      ctx.agents.detachEntered(entry);
    } catch (e) {
      // last resort: raw delete so the id stays reusable
      ctx.logger?.warn?.("[dsh-session-center] detachEntered failed, raw-deleting entry:", e);
      ctx.agents.store?.delete?.(sessionId);
    }
  } catch (e) {
    ctx.logger?.warn?.("[dsh-session-center] removeAgentStoreEntry failed:", e);
  }
}

/** Detach the session from the live SessionStore entry registry, if present. */
function detachLiveStore(sessions, sessionId) {
  const entry = sessions?.store?.get?.(sessionId);
  if (entry?.detach === undefined) return false;
  entry.detach();
  return true;
}

/** Remove the session id from every workspace record that lists it. */
async function detachWorkspaces(workspaceRegistry, sessionId) {
  if (workspaceRegistry?.list === undefined) return 0;
  let removed = 0;
  for (const ws of workspaceRegistry.list()) {
    const ids = ws?.sessionIds;
    if (!Array.isArray(ids) || !ids.includes(sessionId)) continue;
    await ws.detachSession?.(sessionId);
    removed += 1;
  }
  return removed;
}

/**
 * 一次读取拿到回收站行需要的全部摘要（header 字段 + 标题）。
 *
 * 2026-09-26 实测：回收站只有 1.5 MB / 10 条目，旧实现（readHeaderMeta 与
 * readTrashTitle 各自 readFile+decodeAll，且对最多 5000 行逐行 JSON.parse）在宿主
 * 主线程上要 ~500 ms —— 这就是「打开侧栏很卡、掉帧」的根因（refreshTrash() 一跑，
 * 事件循环被堵近 1 秒，所有在途请求一起卡）。
 * 现在：只解码一次；标题扫描先用子串快筛，只有含 "session/title" 的行才 JSON.parse，
 * 大日志里那几千行普通事件不再被解析。
 *
 * @param {string} filePath - 日志文件（当前代际）
 * @param {number} [maxScan] - 标题最多扫多少行（删除时用 5000 求准；列表读旧条目时用 400 求快）
 * @returns {Promise<{id:string|null,createdAt:number|null,cwd:string|null,title:string|null}|null>}
 */
async function readArtifactSummary(filePath, maxScan = 5000) {
  try {
    const buf = await readFile(filePath);
    const { text } = decodeAll(buf);
    const lines = text.split("\n");
    const summary = { id: null, createdAt: null, cwd: null, title: null };
    try {
      const header = JSON.parse(lines[0] ?? "");
      summary.id = header?.id ?? null;
      summary.createdAt = header?.createdAt ?? null;
      summary.cwd = header?.cwd ?? null;
    } catch { /* header 不可解析：其余字段仍尽力而为 */ }
    const limit = Math.min(lines.length, maxScan);
    for (let i = 1; i < limit; i += 1) {
      const line = lines[i];
      if (!line.includes('"session/title"')) continue;
      try {
        const row = JSON.parse(line);
        if (row.type === "session/title" && typeof row.data?.title === "string") {
          summary.title = row.data.title;
          break;
        }
      } catch { /* skip unparsable rows */ }
    }
    return summary;
  } catch {
    return null;
  }
}

let restarting = false;

/**
 * 一次性补齐旧回收站条目的摘要（标题/创建时间/cwd）。
 *
 * 背景：`trash.list` 以前每次都对每个条目全量解码（实测 1.5 MB / 10 条目 ≈ 500 ms，
 * 堵死宿主事件循环 → 打开侧栏掉帧）。新删除会在删除时记摘要，但**旧条目没有**，
 * 于是这次在启动路径上补一次并落盘：代价一次性，之后列表几乎零成本。
 * 处理不了的条目（日志缺失/损坏）打 `summaryTried` 标记，避免每次启动重试。
 */
async function backfillTrashSummaries(state, logger) {
  const MAX_PER_BOOT = 20;
  let changed = 0;
  for (const entry of state.listTrash()) {
    if (changed >= MAX_PER_BOOT) break;
    if (entry.summaryTried === true) continue;
    if (entry.title != null && entry.createdAt != null && entry.cwd != null) continue;
    const file = await trashLogPath(entry.sessionId);
    const summary = file === null ? null : await readArtifactSummary(file);
    entry.title = summary?.title ?? null;
    entry.createdAt = summary?.createdAt ?? null;
    entry.cwd = summary?.cwd ?? null;
    entry.summaryTried = true;
    changed += 1;
  }
  if (changed > 0) {
    await state.save();
    logger?.info?.(`[dsh-session-center] trash summaries backfilled: ${changed}`);
  }
  return changed;
}

/** 从当前命令行解析 --port（仅用于日志/诊断；缺省 3080）。 */
function currentPort() {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length - 1; i++) {
    if (args[i] === "--port") {
      const n = Number(args[i + 1]);
      if (Number.isInteger(n) && n > 0 && n < 65536) return n;
    }
  }
  return 3080;
}

/**
 * 重启整个 harness web 进程（侧栏「重启 Harness」按钮）：
 *   1. 用当前进程的 execPath/execArgv/argv/cwd/env 原样 spawn 一个 detached
 *      继任实例，stdout/stderr 追加到 <centerRoot>/restart.out.log|err.log；
 *   2. 立即返回（页面显示「正在重启…」）；
 *   3. 1.2s 后退出当前进程，释放端口；继任实例接管，页面短暂断开后自动重连。
 */
// ---- 重启序号（restart seq）：客户端据此判定「服务端确实重启过」 ----
// restart.json 位于 $DSH_HOME/session-center/restart.json，形如 {"seq":N,"at":ISO}。
// seq 只在「即将 spawn 继任」时递增（先落盘再动作，崩溃安全）。客户端点击重启时
// 记录旧 seq；页面重连后查询 seq 是否变大 —— 变大则本次重启成功，欢迎提示必显示；
// 没变大（重启被拒/失败）则不显示。不依赖时间窗，重启再慢也不丢提示。
const RESTART_SEQ_FILE = () => join(centerRoot(), "restart.json");
// 跨代过渡标记：旧代码（无 seq 机制）发起的重启没有 restart.json 证据，且旧页面
// 钩子可能在 reload 前就把 sessionStorage 标记消费掉（新页面读不到）。所以由
// 继任实例（新代码）启动时自行留下证据：out.log 存在 + restart.json 不存在 =
// 本进程是被旧代码的重启拉起的唯一形态。客户端首连无 arm 时查它、显示并清除。
const RESTART_LEGACY_FILE = () => join(centerRoot(), "restart.legacy.json");
const RESTART_OUT_LOG = () => join(centerRoot(), "restart.out.log");

async function readRestartSeq() {
  try {
    const raw = JSON.parse(await readFile(RESTART_SEQ_FILE(), "utf8"));
    return { seq: Number(raw?.seq) || 0, at: typeof raw?.at === "string" ? raw.at : null };
  } catch {
    return { seq: 0, at: null };
  }
}

/** 跨代检测：仅在「本进程是旧代码重启的继任」时写一次 legacy 标记（幂等）。 */
export async function markLegacyRestartIfNeeded() {
  try {
    if (existsSync(RESTART_LEGACY_FILE())) return;
    if (existsSync(RESTART_SEQ_FILE())) return;
    if (!existsSync(RESTART_OUT_LOG())) return;
    await writeFile(RESTART_LEGACY_FILE(), JSON.stringify({ at: new Date().toISOString() }), "utf8");
  } catch { /* 标记失败不阻断启动 */ }
}

/** 读取并清除 legacy 标记（显示欢迎后不再重复出现）。 */
export async function readAndClearLegacyRestart() {
  const existed = existsSync(RESTART_LEGACY_FILE());
  try {
    if (existed) await rm(RESTART_LEGACY_FILE(), { force: true });
  } catch { /* ignore */ }
  return existed;
}

async function bumpRestartSeq() {
  const { seq } = await readRestartSeq();
  const next = { seq: seq + 1, at: new Date().toISOString() };
  await writeFile(RESTART_SEQ_FILE(), JSON.stringify(next), "utf8");
  return next;
}

async function doRestart(ctx) {
  if (restarting) throw Object.assign(new Error("restart already in progress"), { code: "refused" });
  restarting = true;
  const logDir = centerRoot();
  // 纯 node relaunch：用当前进程的 execPath / execArgv / argv / cwd / env 原样
  // 复刻一条启动命令（含 --import 代理引导，见 execArgv）。终端兜底脚本
  // restart-web.ps1 走的是同款路径，仅多了 -Port 参数。
  // 历史上这里还有一条 Windows .cmd 分支，但那个文件名带着写死的旧端口
  // （restart-web-3080.cmd）且仓库里并不存在，属死代码，已删除。
  const prevSeq = await readRestartSeq();
  const seqInfo = await bumpRestartSeq().catch(() => null);
  const outFd = openSync(join(logDir, "restart.out.log"), "a");
  const errFd = openSync(join(logDir, "restart.err.log"), "a");
  let child;
  try {
    const script = process.argv[1];
    if (!script) throw Object.assign(new Error("cannot reconstruct launch command (no script argv)"), { code: "internal" });
    child = spawn(
      process.execPath,
      [...process.execArgv, script, ...process.argv.slice(2), "--no-open"],
      {
        cwd: process.cwd(),
        env: process.env,
        detached: true,
        windowsHide: true,
        stdio: ["ignore", outFd, errFd],
      }
    );
  } catch (e) {
    // 「先落盘再动作」的对称面：动作失败必须把 seq 退回。否则客户端看到
    // seq 变大就会弹「欢迎回来」，而服务端其实根本没重启（假成功）。
    if (seqInfo) {
      await writeFile(RESTART_SEQ_FILE(), JSON.stringify(prevSeq), "utf8").catch(() => {});
    }
    restarting = false;
    throw e;
  } finally {
    // 子进程已 dup 这两个 fd，父进程侧的副本必须关掉（否则每次重启泄漏 2 个 fd）。
    try { closeSync(outFd); } catch { /* ignore */ }
    try { closeSync(errFd); } catch { /* ignore */ }
  }
  child.unref();
  setTimeout(() => {
    try { process.exit(0); } catch { /* already exiting */ }
  }, 250);
  return {
    pid: child.pid ?? null,
    // 真实监听端口来自 webServer 服务；argv 解析只是兜底（历史实现缺省写死 3080）。
    port: Number(ctx?.webServer?.port) || currentPort(),
    log: join(logDir, "restart.out.log"),
    seq: seqInfo?.seq ?? null,
    seqAt: seqInfo?.at ?? null,
  };
}

export async function apply(ctx) {
  const state = new CenterState(join(centerRoot(), "state.json"), {
    onError: (message) => ctx.logger?.warn?.("[dsh-session-center]", message),
  });
  await state.load();
  const log = (...args) => ctx.logger?.info?.("[dsh-session-center]", ...args);

  // 启动路径上补齐旧回收站摘要（一次性；详见函数注释——它决定打开侧栏是否掉帧）
  try {
    await backfillTrashSummaries(state, ctx.logger);
  } catch (e) {
    ctx.logger?.warn?.("[dsh-session-center] trash summary backfill failed: " + String(e?.message ?? e));
  }

  // 一次性安全清理：历史上 vision 功能把 DASHSCOPE 的 key 明文抄进了 state.json
  // （与宿主 `.credentials.yaml` 里的 `DASHSCOPE_API_KEY` 同值双存）。vision 功能已整体
  // 移除，这里把残留块删掉并留一份**脱敏**备份文件。**绝不触碰 `.credentials.yaml`**——
  // 那是宿主自己的活密钥来源，插件只读不写。
  // 2026-09-26 修正：首版把 vision 块**原样**另存，等于换个地方继续存密钥（同一把密钥
  // 又变成两份，正是本次要修的问题）。备份必须脱敏；密钥的唯一来源是 .credentials.yaml，
  // 所以清空敏感字段不会丢任何东西。
  try {
    if (state.data?.vision !== undefined) {
      const backupPath = join(centerRoot(), `state.json.vision-backup-${Date.now()}`);
      const redact = (value) => {
        if (Array.isArray(value)) return value.map(redact);
        if (value && typeof value === "object") {
          const out = {};
          for (const [k, v] of Object.entries(value)) {
            out[k] = /^(api_?key|token|secret|password|authorization)$/i.test(k) ? "" : redact(v);
          }
          return out;
        }
        return value;
      };
      const safe = redact(state.data.vision);
      const payload = safe && typeof safe === "object" && !Array.isArray(safe)
        ? { ...safe, _note: "apiKey 等敏感字段已清空；密钥唯一来源是宿主的 .credentials.yaml（插件只读不写）" }
        : { value: safe, _note: "vision 块已移除；密钥唯一来源是宿主的 .credentials.yaml" };
      await writeFile(backupPath, JSON.stringify(payload, null, 2), "utf8");
      delete state.data.vision;
      await state.save();
      ctx.logger?.warn?.(`[dsh-session-center] removed the legacy plaintext vision key from state.json (redacted backup: ${backupPath})`);
    }
  } catch (e) {
    ctx.logger?.warn?.("[dsh-session-center] legacy vision cleanup failed: " + String(e?.message ?? e));
  }

  // 内核热补丁：**只读检测**（写盘走 `scripts/kernel-patch.mjs --apply`）。
  //
  // 2026-09-26 改：此前 apply() 直接往全局 npm 安装树写文件（5 处补丁）。那是全系统
  // 里唯一能「把宿主搞到起不来」的副作用——宿主起不来，负责自愈的这个插件也加载
  // 不了——而且它让 `npm test` 变成"改内核"。现在插件只报告状态：缺补丁只影响
  // 「命令会不会闪窗」这个外观问题，应用与否由人显式决定（脚本带备份/原子写/语法
  // 校验/一键还原）。
  try {
    const report = await detectPatches();
    ctx.logger?.info?.("[dsh-session-center]", formatPatchSummary(report));
    const pending = report.entries.filter((e) => e.status === "appliable" && e.optIn == null);
    const unmatched = report.entries.filter((e) => e.status === "unmatched");
    if (pending.length > 0) {
      ctx.logger?.warn?.(
        `[dsh-session-center] ${pending.length} 个内核补丁未应用（Windows 下每条命令可能闪窗）：`
        + `${pending.map((e) => e.id).join(", ")}；需要时在插件目录执行：node scripts/kernel-patch.mjs --apply`,
      );
    }
    if (unmatched.length > 0) {
      ctx.logger?.warn?.(
        `[dsh-session-center] ${unmatched.length} 个内核补丁的 anchor 不再匹配（内核版本变了，补丁需更新）：`
        + unmatched.map((e) => `${e.id}（${e.note}）`).join(", "),
      );
    }
    // 跨代过渡：本进程若是「旧代码重启」拉起的继任，给客户端留欢迎证据（见函数注释）
    await markLegacyRestartIfNeeded();
  } catch (e) {
    ctx.logger?.warn?.("[dsh-session-center] kernel patch detection failed: " + String(e?.message ?? e));
  }

  try {
    ctx.systemPrompt.section({
      name: "session-center:restart-guidance",
      order: 510,
      text: "【重要规范】如果在修改了配置或插件后需要重启 DeepSeek Harness 服务，严禁在 bash/pwsh 终端中直接运行 kill/pkill、Stop-Process 或启动 dsh 命令（这会导致你自身所在的会话被系统杀死并引发端口冲突）！如果需要重启，请明确告知用户点击界面左下角的「重启 Harness」按钮，由宿主安全重载。",
    });
  } catch (e) {
    ctx.logger?.warn?.("[dsh-session-center] systemPrompt section 注册失败: " + String(e?.message ?? e));
  }

  // Auto-backup on session disposal.
  ctx.on("session/disposed", (session) => {
    backupSessionFile(session.id, "auto")
      .then((entry) => state.pushBackup(session.id, entry))
      .catch((error) => {
        // 自动备份失败以前被 `.catch(() => {})` 完全吞掉：用户看不到、日志也没有痕迹。
        ctx.logger?.warn?.(`[dsh-session-center] auto-backup failed for ${session.id}: ${String(error?.message ?? error)}`);
      });
  });

  const routes = {
    // ------------------------------------------------------------- tags
    "tag.list": async (payload) => ({
      tags: state.listTags(),
      sessionTags: state.data.sessionTags,
      pins: state.listPins(),
    }),
    "tag.save": async ({ id, name, color }) => {
      if (typeof name !== "string" || name.trim().length === 0 || name.length > 24) {
        throw Object.assign(new Error("tag name must be 1-24 characters"), { code: "bad-request" });
      }
      const tagId = typeof id === "string" && TAG_ID_RE.test(id) ? id : `tag-${randomUUID().slice(0, 8)}`;
      const tag = state.saveTag({
        id: tagId,
        name: name.trim(),
        color: /^#[0-9a-fA-F]{6}$/.test(String(color ?? "")) ? color : "#868E96",
      });
      return tag;
    },
    "tag.delete": async ({ id }) => {
      if (typeof id !== "string" || !TAG_ID_RE.test(id)) {
        throw Object.assign(new Error("invalid tag id"), { code: "bad-request" });
      }
      state.deleteTag(id);
      return { deleted: id };
    },
    "tag.setSessions": async ({ sessionIds, tagIds }) => {
      const ids = Array.isArray(sessionIds) ? sessionIds.filter((s) => isValidSessionId(String(s))) : [];
      const tids = Array.isArray(tagIds) ? tagIds.filter((t) => TAG_ID_RE.test(String(t))) : [];
      if (ids.length === 0) throw Object.assign(new Error("no valid sessionIds"), { code: "bad-request" });
      state.setSessionsTags(ids, tids);
      return { sessions: ids.length, tags: tids.length };
    },

    // --------------------------------------------------------------- pins
    "pin.set": async ({ sessionIds, pinned }) => {
      const ids = Array.isArray(sessionIds) ? sessionIds.filter((s) => isValidSessionId(String(s))) : [];
      state.setPinned(ids, pinned === true);
      return { sessions: ids.length, pinned: pinned === true };
    },

    // ------------------------------------------------------------ delete
    "session.delete": async ({ sessionId, force }) => {
      if (typeof sessionId !== "string" || !isValidSessionId(sessionId)) {
        throw Object.assign(new Error("missing or invalid sessionId"), { code: "bad-request" });
      }
      // Refuse running agents unless force=true; dispose idle ones through their scope.
      const agent = ctx.agents?.get?.(sessionId);
      if (agent !== undefined && agent.status === "running" && force !== true) {
        throw Object.assign(new Error(`session "${sessionId}" is running; stop it before deleting (or pass force: true)`), { code: "refused" });
      }
      if (agent !== undefined) {
        const stopped = await disposeAgentFiber(agent, sessionId, ctx, force === true);
        if (!stopped) {
          throw Object.assign(new Error(`session "${sessionId}" has an attached agent that could not be stopped`), { code: "refused" });
        }
      }
      // 1. move the artifact into the trash (recoverable) BEFORE anything else;
      //    sessions without an on-disk artifact (e.g. never-flushed children) are
      //    deleted outright.
      const workspaces = [];
      if (ctx.workspaceRegistry?.list !== undefined) {
        for (const ws of ctx.workspaceRegistry.list()) {
          if (Array.isArray(ws?.sessionIds) && ws.sessionIds.includes(sessionId)) workspaces.push(ws.id);
        }
      }
      let trashEntry = null;
      let trashed = true;
      try {
        trashEntry = await trashSessionFile(sessionId, workspaces);
        state.putTrash(trashEntry);
      } catch (error) {
        const missing = String(error?.message ?? error).includes("no on-disk artifact");
        if (!missing) throw error;
        trashed = false;
        ctx.logger?.info?.("[dsh-session-center] session has no on-disk artifact, deleting without trash:", sessionId);
      }
      // 2. detach from the live store and workspace records
      const detached = detachLiveStore(ctx.sessions, sessionId);
      const wsRemoved = await detachWorkspaces(ctx.workspaceRegistry, sessionId);
      // 3. nothing left to remove: trashSessionFile MOVES the whole artifact
      //    directory (all format generations + the lease), so the old
      //    "rename one file, then rm the directory" sequence — which destroyed
      //    the live session.v3.jsonl.zstd — is gone by construction.
      return { detached, workspaces: wsRemoved, trashed, trash: trashEntry?.sessionId ?? null };
    },

    "session.restore": async ({ sessionId }) => {
      if (typeof sessionId !== "string" || !isValidSessionId(sessionId)) {
        throw Object.assign(new Error("missing or invalid sessionId"), { code: "bad-request" });
      }
      const entry = state.trashEntry(sessionId);
      if (!entry) throw Object.assign(new Error(`session "${sessionId}" is not in the trash`), { code: "not-found" });
      await restoreTrashFile(entry);
      state.removeTrash(sessionId);
      // re-attach to its former workspaces so it shows up where it was
      for (const workspaceId of entry.workspaceIds ?? []) {
        try {
          await ctx.workspaceRegistry?.get?.(workspaceId)?.attachSession?.(sessionId);
        } catch {
          // workspace may have been deleted in the meantime
        }
      }
      return { restored: sessionId, workspaces: entry.workspaceIds?.length ?? 0 };
    },

    "trash.list": async () => {
      const entries = state.listTrash();
      const withMeta = [];
      for (const e of entries) {
        // 优先用删除时记下的摘要（state 记录或 meta.json）；只有旧条目缺摘要才去解码，
        // 且一条只解一次（旧实现每条两次全量解码 + 5000 行 JSON.parse）。
        let title = e.title ?? null;
        let createdAt = e.createdAt ?? null;
        let cwd = e.cwd ?? null;
        if (title === null || createdAt === null || cwd === null) {
          const file = await trashLogPath(e.sessionId);
          if (file !== null) {
            // 旧条目（没有摘要）：只扫前 400 行找标题——标题事件总在日志很靠前的位置，
            // 而大日志的代价主要来自整段解码，不差这几百次子串比较。
            const summary = await readArtifactSummary(file, 400);
            title = title ?? summary?.title ?? null;
            createdAt = createdAt ?? summary?.createdAt ?? null;
            cwd = cwd ?? summary?.cwd ?? null;
          }
        }
        withMeta.push({ ...e, createdAt, cwd, title });
      }
      return { entries: withMeta };
    },

    "trash.purge": async ({ sessionId }) => {
      if (sessionId !== undefined) {
        if (typeof sessionId !== "string" || !isValidSessionId(sessionId)) {
          throw Object.assign(new Error("invalid sessionId"), { code: "bad-request" });
        }
        await purgeTrashFile(sessionId);
        state.removeTrash(sessionId);
        return { purged: 1, failed: [] };
      }
      const entries = state.listTrash();
      const failed = [];
      let purged = 0;
      for (const e of entries) {
        // 逐条隔离：一条删除失败不能让其余条目卡在「文件已删、索引还在」的
        // 幽灵状态（此前是「全部删完才更新索引」，中途抛错即索引与磁盘不一致，
        // 回收站里会出现点恢复必报错的条目）。
        try {
          await purgeTrashFile(e.sessionId);
          state.removeTrash(e.sessionId);
          purged += 1;
        } catch (error) {
          failed.push({ sessionId: e.sessionId, error: String(error?.message ?? error) });
        }
      }
      if (failed.length > 0) {
        ctx.logger?.warn?.(`[dsh-session-center] trash.purge: ${failed.length} entr(ies) failed`, failed);
      }
      return { purged, failed };
    },

    // ------------------------------------------------------------ backup
    "session.backup": async ({ sessionId, reason }) => {
      if (typeof sessionId !== "string" || !isValidSessionId(sessionId)) {
        throw Object.assign(new Error("missing or invalid sessionId"), { code: "bad-request" });
      }
      const entry = await backupSessionFile(sessionId, typeof reason === "string" && reason ? reason : "manual");
      state.pushBackup(sessionId, entry);
      return entry;
    },

    "backups.list": async ({ sessionId }) => {
      if (typeof sessionId !== "string" || !isValidSessionId(sessionId)) {
        throw Object.assign(new Error("missing or invalid sessionId"), { code: "bad-request" });
      }
      return { entries: state.listBackups(sessionId) };
    },

    "backups.restore": async ({ sessionId, backupId }) => {
      if (typeof sessionId !== "string" || !isValidSessionId(sessionId)) {
        throw Object.assign(new Error("missing or invalid sessionId"), { code: "bad-request" });
      }
      const entry = state.listBackups(sessionId).find((e) => e.id === backupId);
      if (!entry) throw Object.assign(new Error("backup not found"), { code: "not-found" });
      // 与 session.repair 同样的活会话门禁：0.1.5 的持久化由持有 session.lock
      // 租约的 SessionHandle 掌控，在其脚下换掉 artifact 会与内核 flush 打架
      // （恢复的文件随后被覆盖），而且「先删全部代际、再拷回快照」之间存在
      // 一个「会话目录里没有任何日志」的窗口，此刻崩溃就是整段会话丢失。
      const agent = ctx.agents?.get?.(sessionId);
      if (agent !== undefined) {
        throw Object.assign(new Error(`session "${sessionId}" is live; stop it before restoring a backup`), { code: "refused" });
      }
      await restoreBackupFile(sessionId, entry);
      return { restored: sessionId, backupId };
    },

    // 删除单个备份。此前只有 list/restore 两个路由，removeBackup() 是死代码，
    // 而「保留最近 20 份」只裁内存索引——第 21 份往后的快照目录永远留在磁盘上，
    // 用户也没有任何清理入口（backups/ 只增不减）。
    "backups.delete": async ({ sessionId, backupId }) => {
      if (typeof sessionId !== "string" || !isValidSessionId(sessionId)) {
        throw Object.assign(new Error("missing or invalid sessionId"), { code: "bad-request" });
      }
      const entry = state.listBackups(sessionId).find((e) => e.id === backupId);
      if (!entry) throw Object.assign(new Error("backup not found"), { code: "not-found" });
      await rm(entry.path, { recursive: true, force: true });
      state.removeBackup(sessionId, backupId);
      return { deleted: backupId, path: entry.path };
    },

    // ---------------------------------------------------------- diagnose
    "session.diagnose": async ({ sessionId }) => {
      if (typeof sessionId !== "string" || !isValidSessionId(sessionId)) {
        throw Object.assign(new Error("missing or invalid sessionId"), { code: "bad-request" });
      }
      const found = await findSessionLog(sessionId);
      if (!found?.log) throw Object.assign(new Error(`session "${sessionId}" has no on-disk artifact`), { code: "not-found" });
      const file = found.log;
      const buffer = await readFile(file);
      const report = validateLogBuffer(buffer);
      return { bytes: buffer.length, file: basename(file), ...report };
    },

    "session.repair": async ({ sessionId }) => {
      if (typeof sessionId !== "string" || !isValidSessionId(sessionId)) {
        throw Object.assign(new Error("missing or invalid sessionId"), { code: "bad-request" });
      }
      const found = await findSessionLog(sessionId);
      if (!found?.log) throw Object.assign(new Error(`session "${sessionId}" has no on-disk artifact`), { code: "not-found" });
      // Refuse while an agent is attached: 0.1.5 owns persistence through a
      // lifecycle-scoped SessionHandle holding a `session.lock` lease, so
      // swapping the artifact underneath a live session would fight it (and be
      // overwritten on the next flush). Same gate the delete route uses.
      const agent = ctx.agents?.get?.(sessionId);
      if (agent !== undefined) {
        throw Object.assign(new Error(`session "${sessionId}" is live; stop it before repairing its log`), { code: "refused" });
      }
      // Repair the NEWEST generation — writing back over a hardcoded
      // `session.jsonl.zstd` would edit the preserved v0 original instead of
      // the log the kernel actually reads.
      const file = found.log;
      const buffer = await readFile(file);
      const result = await repairLogBuffer(buffer);
      if (!result.ok) {
        throw Object.assign(new Error(`repair failed: ${result.report.error ?? result.report.note}`), { code: "unrepairable", report: result.report });
      }
      if (result.repaired === null) {
        return { repaired: false, file: basename(file), report: result.report };
      }
      // preserve the corrupt original before replacing
      const corruptDir = join(centerRoot(), "corrupt", sessionId);
      await mkdir(corruptDir, { recursive: true });
      const corruptPath = join(corruptDir, `${basename(file)}.corrupt-${Date.now()}`);
      await writeFile(corruptPath, buffer);
      await writeFile(file + ".tmp", result.repaired);
      await rename(file + ".tmp", file);
      return { repaired: true, file: basename(file), corruptBackup: corruptPath, report: result.report };
    },

    // ------------------------------------------------------------ cost/balance
    "session.cost": async ({ sessionId }) => {
      if (typeof sessionId !== "string" || !isValidSessionId(sessionId)) {
        throw Object.assign(new Error("missing or invalid sessionId"), { code: "bad-request" });
      }
      return scanSessionCost(sessionId);
    },

    "balance": async () => fetchDeepSeekBalance(ctx),

    // ------------------------------------------------------------ wallpaper slideshow
    "wallpaper.scanFolder": async ({ folder }) => {
      if (typeof folder !== "string" || !folder.trim()) {
        throw Object.assign(new Error("folder path must be a non-empty string"), { code: "bad-request" });
      }
      const dir = folder.trim();
      const st = await stat(dir).catch(() => null);
      if (!st || !st.isDirectory()) {
        throw Object.assign(new Error(`folder "${dir}" not found or not a directory`), { code: "not-found" });
      }
      // 授权该目录：此后 wallpaper.file 只放行这些目录里的图片
      wallpaperRoots.add(resolve(dir).toLowerCase());
      const names = await readdir(dir).catch(() => []);
      const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif", ".avif", ".svg"]);
      const files = names
        .filter((n) => IMAGE_EXTS.has(extname(n).toLowerCase()))
        .sort((a, b) => a.localeCompare(b, "zh-CN", { numeric: true, sensitivity: "base" }))
        .map((n) => join(dir, n));
      return { folder: dir, count: files.length, files };
    },

    "wallpaper.pickFolder": async ({ folder: initialFolder } = {}) => {
      if (process.platform !== "win32") {
        throw Object.assign(new Error("native folder picker only supported on Windows"), { code: "unsupported" });
      }
      return new Promise((resolve) => {
        const pluginRoot = dirname(dirname(fileURLToPath(import.meta.url)));
        const dllPath = join(pluginRoot, "bin", "ModernFolderPicker.dll");
        const initPath = typeof initialFolder === "string" && initialFolder.trim() ? initialFolder.trim() : "";

        // 1. 优先加载 ModernFolderPicker.dll 调用系统原生 IFileOpenDialog（Win10/11 常用现代资源管理器选择窗口）
        // 2. 进程以 windowsHide: true + -STA 启动，彻底消灭命令行黑窗口闪烁，且保证 COM 线程处于单线程公寓
        // 3. 选定路径通过 Base64 输出并以 UTF-8 解码，彻底解决 Windows 控制台默认代码页（GBK/ANSI）导致的中文字符乱码
        const psScript = `
param()
$dll = '${dllPath.replace(/'/g, "''")}';
$initial = '${initPath.replace(/'/g, "''")}';
$folder = $null;

if (Test-Path $dll) {
  try {
    Add-Type -Path $dll;
    $folder = [ModernFolderPicker]::Pick('请选择壁纸图片文件夹', $initial);
  } catch {
    $folder = $null;
  }
}

if (-not $folder) {
  try {
    Add-Type -AssemblyName System.Windows.Forms;
    $dlg = New-Object System.Windows.Forms.FolderBrowserDialog;
    if ($dlg.PSObject.Properties['AutoUpgradeEnabled']) {
      $dlg.AutoUpgradeEnabled = $true;
    }
    $dlg.Description = '请选择壁纸图片文件夹';
    $dlg.ShowNewFolderButton = $false;
    if ($initial -and (Test-Path $initial)) {
      $dlg.SelectedPath = $initial;
    }
    if ($dlg.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
      $folder = $dlg.SelectedPath;
    }
  } catch {
    $folder = $null;
  }
}

if ($folder) {
  [Console]::OutputEncoding = [System.Text.Encoding]::UTF8;
  [Console]::Write([Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($folder)));
}
`;
        const enc = Buffer.from(psScript, "utf16le").toString("base64");
        const child = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-STA", "-EncodedCommand", enc], {
          windowsHide: true,
          stdio: ["ignore", "pipe", "ignore"],
        });
        let settled = false;
        let timer = null;
        const finish = (value) => {
          if (settled) return;
          settled = true;
          if (timer) clearTimeout(timer);
          resolve(value);
        };
        // 原生对话框可以一直挂着（用户忘记关 / COM 卡死）。没有超时的话这条路由的 Promise
        // 永不 settle：客户端「扫描中」永久转圈、宿主侧挂着一条未完成请求。5 分钟后强杀
        // 子进程并按「用户取消」返回——只影响这一次选择，不碰会话与连接。
        timer = setTimeout(() => {
          try { child.kill(); } catch { /* 可能已自行退出 */ }
          ctx.logger?.warn?.("[dsh-session-center] pickFolder timed out after 300s — dialog process killed");
          finish({ ok: false, folder: null, reason: "timeout" });
        }, 300_000);
        if (typeof timer.unref === "function") timer.unref();
        let output = "";
        child.stdout.on("data", (chunk) => {
          output += chunk.toString("utf8");
        });
        child.on("close", () => {
          const b64 = output.trim();
          if (!b64) {
            finish({ ok: true, folder: null });
          } else {
            try {
              const folder = Buffer.from(b64, "base64").toString("utf8");
              finish({ ok: true, folder: folder || null });
            } catch {
              finish({ ok: true, folder: null });
            }
          }
        });
        child.on("error", (err) => {
          ctx.logger?.warn?.(`[dsh-session-center] pickFolder error: ${String(err?.message ?? err)}`);
          finish({ ok: false, folder: null });
        });
      });
    },
  };

  // ---- 路由挂载：走内核自己的 Connection seam，而不是自注册 webServer 路由 ----
  //
  // 为什么改（2026-09-26）：
  //   1. `ctx.connection.fetch.register()` 注册的 exact 路由，由 Connection 的物理
  //      载体统一施加「Host/Origin 栅栏 + 浏览器会话认证」。旧写法靠插件手写
  //      `gate()`，而它在 `ctx.connection?.requestRejection` 取不到时是 **fail-open**
  //      （放行），把会话删除/回收站清空/重启这些破坏性接口暴露出去。
  //   2. register 内部就是 `owner.effect(...)`：注册自动归属调用者 fiber，
  //      插件 unload→reload 不会残留路由（旧写法丢弃 disposer，第二次注册直接抛
  //      「webserver: duplicate exact route」）。宿主 7 处功能（session.export、
  //      file-upload…）全部是这个形状，本插件跟随同一契约。
  //   3. 一个 request ⇒ 一个 Response：不再手写 writeHead/JSON 封包；请求体上限由
  //      Connection 的 buffered 模式统一执行（旧 readJsonBody 的 1 MiB 是重复发明）。
  // 路径：`/api` 之下（本插件用 `/api/session-center.<verb>`），与内核其它功能一致。
  const registerFetch = (verb, { methods = ["POST"], fetch }) =>
    ctx.connection.fetch.register({
      path: `/api/session-center.${verb}`,
      methods,
      requestBody: "buffered",
      fetch,
    });

  const jsonOk = (value) => Response.json({ ok: true, value });
  const jsonFail = (code, message) => Response.json({ ok: false, error: { code, message } });

  /** 统一的「JSON 入参 → JSON 出参」适配器（等价于旧的 readJsonBody/ok/fail 三件套）。 */
  const bindJsonRoute = (verb, handler) => registerFetch(verb, {
    fetch: async (request) => {
      let payload = {};
      const text = await request.text().catch(() => "");
      if (text.trim().length > 0) {
        try {
          payload = JSON.parse(text);
        } catch (error) {
          return jsonFail("bad-request", `invalid JSON body: ${String(error?.message ?? error)}`);
        }
      }
      try {
        return jsonOk(await handler(payload ?? {}));
      } catch (error) {
        ctx.logger?.warn?.(`[dsh-session-center] ${verb} failed: ${String(error?.message ?? error)}`);
        return jsonFail(error?.code ?? "internal", String(error?.message ?? error));
      }
    },
  });

  for (const [verb, handler] of Object.entries(routes)) bindJsonRoute(verb, handler);

  // ---- 重启 Harness（POST）：spawn 继任实例并退出当前进程 ----
  // 非 POST 请求不会落到这里：methods 声明由 Connection 负责，其余方法走共享通道
  // 的常规分发（旧实现自己回 405，属于重复实现框架职责）。
  registerFetch("restart", {
    fetch: async () => {
      try {
        return jsonOk(await doRestart(ctx));
      } catch (error) {
        ctx.logger?.warn?.(`[dsh-session-center] restart failed: ${String(error?.message ?? error)}`);
        return jsonFail(error?.code ?? "internal", String(error?.message ?? error));
      }
    },
  });

  // ---- 重启序号查询（POST，只读）：客户端重连后用它判定是否真重启过 ----
  registerFetch("restart.status", {
    fetch: async () => {
      try {
        const info = await readRestartSeq();
        // legacy 标记只消费一次：读到即返回并删除（客户端据此显示欢迎，此后不再出现）
        const legacy = await readAndClearLegacyRestart();
        // 取证痕迹：每次 status 调用记一行（时间/seq/legacy），排查「重启了却不显示
        // 欢迎」时看客户端到底有没有查到服务端状态（restart.trace.log）。
        try {
          await appendFile(
            join(centerRoot(), "restart.trace.log"),
            JSON.stringify({ t: Date.now(), seq: info.seq, legacy }) + "\n",
            "utf8",
          );
        } catch { /* 记录失败不阻断 */ }
        return jsonOk({ ...info, legacy });
      } catch (error) {
        ctx.logger?.warn?.(`[dsh-session-center] restart.status failed: ${String(error?.message ?? error)}`);
        return jsonFail(error?.code ?? "internal", String(error?.message ?? error));
      }
    },
  });

  // ---- 壁纸本地图片文件传输（GET/HEAD）：供幻灯片轮播直接展示本地文件夹图片 ----
  // 安全注记：本路由仍是「按扩展名读取任意绝对路径」，因此
  //   · SVG 一律以 attachment 返回并加 CSP sandbox —— 否则任何磁盘上的 .svg
  //     被浏览器当作同源文档打开时，其内联脚本会在 DSH 应用源上执行；
  //   · 图片加 nosniff、缓存降为 private（避免代理/共享缓存留下私有文件）。
  // 目录白名单（只允许扫描/选择过的目录）需要一个配置面，留待后续批次。
  registerFetch("wallpaper.file", {
    methods: ["GET", "HEAD"],
    fetch: async (request) => {
      const text = (message, status) =>
        new Response(message, { status, headers: { "content-type": "text/plain; charset=utf-8" } });
      try {
        const u = new URL(request.url);
        const filePath = u.searchParams.get("path");
        if (!filePath) return text("missing path parameter", 400);
        // 目录白名单：只允许读"本进程里被扫描/选择过"的目录（详见文件顶部注释）
        if (!isAuthorizedWallpaperPath(filePath)) {
          ctx.logger?.warn?.(`[dsh-session-center] wallpaper.file refused a path outside the scanned folders: ${filePath}`);
          return text("path outside the scanned wallpaper folders", 403);
        }
        if (wallpaperRoots.size === 0 && !wallpaperRootsWarned) {
          wallpaperRootsWarned = true;
          ctx.logger?.warn?.("[dsh-session-center] wallpaper.file served a path before any folder was scanned (no whitelist yet)");
        }
        const ext = extname(filePath).toLowerCase();
        const MIME_MAP = {
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".png": "image/png",
          ".webp": "image/webp",
          ".bmp": "image/bmp",
          ".gif": "image/gif",
          ".avif": "image/avif",
          ".svg": "image/svg+xml",
        };
        const mime = MIME_MAP[ext];
        if (!mime) return text("unsupported file extension", 403);
        const st = await stat(filePath).catch(() => null);
        if (!st || !st.isFile()) return text("file not found", 404);
        const buf = await readFile(filePath);
        const headers = {
          "content-type": mime,
          "content-length": String(buf.length),
          "cache-control": "private, max-age=300",
          "x-content-type-options": "nosniff",
        };
        if (mime === "image/svg+xml") {
          headers["content-disposition"] = "attachment";
          headers["content-security-policy"] = "default-src 'none'; sandbox";
        }
        return new Response(request.method === "HEAD" ? null : buf, { status: 200, headers });
      } catch (err) {
        ctx.logger?.warn?.(`[dsh-session-center] wallpaper.file error: ${String(err?.message ?? err)}`);
        return text(String(err?.message ?? err), 500);
      }
    },
  });

  // 粘贴图片 → 路径文本（paste-to-path）已于 2026-09-10 整体移除：
  // 该功能的 paste.upload / paste.policy 两个特殊路由连同 sniffImageExt /
  // pastePolicyFor 一起删除，粘贴图片完全交回官方原生通道。
  log(`routes registered (${Object.keys(routes).length}), state at ${state ? "ok" : "missing"}`);
}
