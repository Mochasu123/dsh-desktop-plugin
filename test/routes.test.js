// dsh-session-center — server route tests with a mocked ctx and a temp DSH_HOME.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { apply } from "../lib/index.js";
import { encodeFrames } from "../lib/zstd.js";

const HOME = mkdtempSync(join(tmpdir(), "dsh-sc-test-"));
process.env.DSH_HOME = HOME;
// 内核补丁只做只读检测，但仍把 root 指向临时目录：测试不该去读（更不该写）真机内核。
process.env.DSH_KERNEL_ROOT = join(HOME, "fake-kernel");

const SESSION_ID = "session-testabc";
const PROJECT = "--tmp--";
const sessionDir = () => join(HOME, "sessions", PROJECT, SESSION_ID);

function tinyLogText() {
  const header = JSON.stringify({ type: "session", version: 0, id: SESSION_ID, createdAt: 1, cwd: "E:\\x" });
  const ev = (seq, type, data = {}) => JSON.stringify({ type, seq, time: seq, data });
  const rows = [
    ev(0, "permission/preset"),
    ev(1, "user/message"),
    ev(2, "session/title", { title: "测试会话标题" }),
    ev(3, "turn/end"),
  ];
  return [header, ...rows].join("\n") + "\n";
}

let routes = new Map();
const routeHandlers = new Map();
const fakeWorkspace = (id, sessionIds) => ({
  id,
  sessionIds,
  detachSession: async (sid) => { sessionIds.splice(sessionIds.indexOf(sid), 1); },
  attachSession: async (sid) => { if (!sessionIds.includes(sid)) sessionIds.unshift(sid); },
});
const workspaces = [fakeWorkspace("ws-1", [SESSION_ID])];

const ctx = {
  // 走内核的 Connection seam：注册自动归属调用者 fiber，且重复 path 抛错
  // （宿主 HostConnectionService.registerFetchRoute 就是 owner.effect + 重复即抛）。
  // 测试替身必须复刻这两点，否则「注册没挂 fiber」这类缺陷在测试里走不到。
  connection: {
    fetch: {
      register: (route) => {
        if (routeHandlers.has(route.path)) {
          throw new Error(`connection: exact Fetch route "${route.path}" is already registered`);
        }
        routeHandlers.set(route.path, route);
        return () => { routeHandlers.delete(route.path); };
      },
    },
  },
  workspaceRegistry: { list: () => workspaces, get: (id) => workspaces.find((w) => w.id === id) },
  sessions: { store: new Map() },
  agents: { get: () => undefined },
  logger: { info: () => {}, warn: () => {} },
  on: () => () => {},
};

before(async () => {
  mkdirSync(sessionDir(), { recursive: true });
  writeFileSync(join(sessionDir(), "session.jsonl.zstd"), encodeFrames(tinyLogText()));
  await apply(ctx);
  routes = routeHandlers;
});

after(() => {
  rmSync(HOME, { recursive: true, force: true });
});

/** 走真实 seam：构造一个 POST Request，交给注册的 fetch 处理器，解析 JSON Response。 */
async function callRoute(name, payload) {
  const route = routes.get(`/api/session-center.${name}`);
  if (!route) throw new Error(`no route registered for ${name}`);
  const request = new Request(`http://127.0.0.1/api/session-center.${name}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload ?? {}),
  });
  const response = await route.fetch(request);
  return response.json();
}

test("tag lifecycle: save → list → setSessions → delete", async () => {
  let v = await callRoute("tag.save", { name: "工作", color: "#4DABF7" });
  assert.equal(v.ok, true);
  const tagId = v.value.id;
  v = await callRoute("tag.list", {});
  assert.equal(v.value.tags.length, 1);
  assert.equal(v.value.tags[0].name, "工作");
  v = await callRoute("tag.setSessions", { sessionIds: [SESSION_ID], tagIds: [tagId] });
  assert.equal(v.ok, true);
  v = await callRoute("tag.list", {});
  assert.deepEqual(v.value.sessionTags[SESSION_ID], [tagId]);
  v = await callRoute("tag.delete", { id: tagId });
  assert.equal(v.ok, true);
  v = await callRoute("tag.list", {});
  assert.equal(v.value.tags.length, 0);
  assert.deepEqual(v.value.sessionTags[SESSION_ID], []);
});

test("pin.set toggles", async () => {
  let v = await callRoute("pin.set", { sessionIds: [SESSION_ID], pinned: true });
  assert.equal(v.value.pinned, true);
  v = await callRoute("tag.list", {});
  assert.deepEqual(v.value.pins, [SESSION_ID]);
});

test("session.backup → backups.list → backups.restore", async () => {
  const before = readFileSync(join(sessionDir(), "session.jsonl.zstd"));
  let v = await callRoute("session.backup", { sessionId: SESSION_ID, reason: "manual" });
  assert.equal(v.ok, true);
  assert.ok(v.value.bytes > 0);
  const entry = v.value;
  v = await callRoute("backups.list", { sessionId: SESSION_ID });
  assert.equal(v.value.entries.length, 1);
  // corrupt the live file, then restore from the backup
  writeFileSync(join(sessionDir(), "session.jsonl.zstd"), Buffer.from("garbage"));
  v = await callRoute("backups.restore", { sessionId: SESSION_ID, backupId: entry.id });
  assert.equal(v.ok, true);
  assert.deepEqual(readFileSync(join(sessionDir(), "session.jsonl.zstd")), before);
});

test("backups.delete removes both the index entry and the files on disk", async () => {
  const made = await callRoute("session.backup", { sessionId: SESSION_ID, reason: "manual" });
  assert.equal(made.ok, true);
  const { id: backupId, path } = made.value;
  assert.equal(existsSync(path), true);

  const deleted = await callRoute("backups.delete", { sessionId: SESSION_ID, backupId });
  assert.equal(deleted.ok, true);
  // 索引与磁盘必须同源：只裁索引会让 backups/ 只增不减
  assert.equal(existsSync(path), false);

  const listed = await callRoute("backups.list", { sessionId: SESSION_ID });
  assert.equal(listed.value.entries.some((e) => e.id === backupId), false);

  const again = await callRoute("backups.delete", { sessionId: SESSION_ID, backupId });
  assert.equal(again.ok, false);
  assert.equal(again.error.code, "not-found");
});

test("session.delete moves to trash, detaches, and removes the artifact dir", async () => {
  let v = await callRoute("session.delete", { sessionId: SESSION_ID });
  assert.equal(v.ok, true);
  assert.equal(v.value.trash, SESSION_ID);
  assert.equal(workspaces[0].sessionIds.includes(SESSION_ID), false);
  assert.equal(existsSync(sessionDir()), false);
  v = await callRoute("trash.list", {});
  assert.equal(v.value.entries.length, 1);
  assert.equal(v.value.entries[0].title, "测试会话标题");
  assert.equal(v.value.entries[0].sessionId, SESSION_ID);
});

test("session.restore brings the session back and re-attaches its workspace", async () => {
  let v = await callRoute("session.restore", { sessionId: SESSION_ID });
  assert.equal(v.ok, true);
  assert.equal(existsSync(join(sessionDir(), "session.jsonl.zstd")), true);
  assert.equal(workspaces[0].sessionIds.includes(SESSION_ID), true);
  v = await callRoute("trash.list", {});
  assert.equal(v.value.entries.length, 0);
});

test("trash.purge permanently removes", async () => {
  await callRoute("session.delete", { sessionId: SESSION_ID });
  let v = await callRoute("trash.purge", { sessionId: SESSION_ID });
  assert.equal(v.ok, true);
  assert.equal(existsSync(join(HOME, "session-center", "trash", SESSION_ID)), false);
  v = await callRoute("trash.list", {});
  assert.equal(v.value.entries.length, 0);
});

test("session.diagnose and session.repair handle a corrupt log", async () => {
  // recreate the session with a corrupt log: a seq-regressing tail (split-brain style)
  const { decodeAll } = await import("../lib/zstd.js");
  const text = decodeAll(encodeFrames(tinyLogText())).text;
  const ghost = [
    JSON.stringify({ type: "user/message", seq: 1, time: 9, data: {} }),
    JSON.stringify({ type: "assistant/message", seq: 2, time: 10, data: {} }),
  ].join("\n");
  mkdirSync(sessionDir(), { recursive: true });
  writeFileSync(join(sessionDir(), "session.jsonl.zstd"), encodeFrames(text + ghost + "\n"));
  let v = await callRoute("session.diagnose", { sessionId: SESSION_ID });
  assert.equal(v.ok, true);
  assert.equal(v.value.valid, false);
  assert.ok(v.value.issue);
  assert.equal(v.value.issue.expected, 4);
  assert.equal(v.value.issue.got, 1);
  v = await callRoute("session.repair", { sessionId: SESSION_ID });
  assert.equal(v.ok, true);
  assert.equal(v.value.repaired, true);
  assert.equal(v.value.report.valid, true);
  assert.equal(v.value.report.lastSeq, 2);
  v = await callRoute("session.diagnose", { sessionId: SESSION_ID });
  assert.equal(v.value.valid, true);
});

test("wallpaper.file only serves images inside scanned folders (and hardens SVG)", async () => {
  const allowed = join(HOME, "壁纸白名单");
  const elsewhere = join(HOME, "别处");
  mkdirSync(allowed, { recursive: true });
  mkdirSync(elsewhere, { recursive: true });
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
  writeFileSync(join(allowed, "a.png"), png);
  writeFileSync(join(elsewhere, "b.png"), png);
  writeFileSync(join(allowed, "c.svg"), "<svg xmlns='http://www.w3.org/2000/svg'/>");

  const fileRoute = routes.get("/api/session-center.wallpaper.file");
  assert.ok(fileRoute, "wallpaper.file route is registered");
  const getFile = async (path) => {
    const request = new Request(`http://127.0.0.1/api/session-center.wallpaper.file?path=${encodeURIComponent(path)}`, { method: "GET" });
    return fileRoute.fetch(request);
  };

  // 扫描即授权该目录
  const scan = await callRoute("wallpaper.scanFolder", { folder: allowed });
  assert.equal(scan.ok, true);

  const inside = await getFile(join(allowed, "a.png"));
  assert.equal(inside.status, 200);
  assert.equal(inside.headers.get("content-type"), "image/png");
  assert.equal(inside.headers.get("x-content-type-options"), "nosniff", "图片必须带 nosniff");

  const outside = await getFile(join(elsewhere, "b.png"));
  assert.equal(outside.status, 403, "扫描过的目录之外的路径必须拒绝（此前是任意路径可读）");

  // SVG 不能被当作同源文档执行：attachment + CSP sandbox
  const svg = await getFile(join(allowed, "c.svg"));
  assert.equal(svg.status, 200);
  assert.equal(svg.headers.get("content-disposition"), "attachment");
  assert.match(String(svg.headers.get("content-security-policy")), /sandbox/);

  const unsupported = await getFile(join(allowed, "a.txt"));
  assert.equal(unsupported.status, 403, "非图片扩展名拒绝");
});

test("trash.list answers from the recorded summary instead of re-decoding the artifact", async () => {
  // 删除时把摘要记进记录 → 之后**把回收站里的日志删掉**，列表仍应给出 createdAt。
  // 若列表还依赖解码整个日志，这里就会退化成 null（旧实现即如此，且实测 ~500 ms）。
  const deleted = await callRoute("session.delete", { sessionId: SESSION_ID, force: true });
  assert.equal(deleted.ok, true);

  let listed = await callRoute("trash.list", {});
  let row = listed.value.entries.find((e) => e.sessionId === SESSION_ID);
  assert.ok(row, "trashed entry is listed");
  assert.equal(row.createdAt, 1, "createdAt 来自删除时记录的摘要");

  rmSync(join(HOME, "session-center", "trash", SESSION_ID, "artifact"), { recursive: true, force: true });

  listed = await callRoute("trash.list", {});
  row = listed.value.entries.find((e) => e.sessionId === SESSION_ID);
  assert.equal(row.createdAt, 1, "日志已不存在，摘要仍来自记录（证明不再全量解码）");

  await callRoute("trash.purge", { sessionId: SESSION_ID });
});

test("wallpaper.scanFolder handles Chinese paths and image extensions", async () => {
  const chineseDir = join(HOME, "壁纸测试文件夹", "二次元图片");
  mkdirSync(chineseDir, { recursive: true });
  writeFileSync(join(chineseDir, "壁纸1.jpg"), "fake-jpg");
  writeFileSync(join(chineseDir, "壁纸2.PNG"), "fake-png");
  writeFileSync(join(chineseDir, "not-image.txt"), "hello");
  const v = await callRoute("wallpaper.scanFolder", { folder: chineseDir });
  assert.equal(v.ok, true);
  assert.equal(v.value.count, 2);
  assert.equal(v.value.files.length, 2);
});
