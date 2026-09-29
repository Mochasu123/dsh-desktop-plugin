// dsh-session-center — session-format generation tests.
//
// Covers the 0.1.5 migration surface, all hermetic (no kernel, no fixtures):
//
//   A. generation-addressed artifact names (`session.jsonl` vs `session.vN.jsonl`)
//   B. row expansion for the v0 packed vocabulary AND the v1+ one-event-per-row
//      layout, replacing the kernel's removed `decodeStorageRecord`
//   C. validation / repair of a v3 log, including the split-brain case
//   D. the regression that motivated the migration: a session directory holding
//      BOTH the preserved `session.jsonl.zstd` and the live
//      `session.v3.jsonl.zstd` must be diagnosed, costed, deleted and restored
//      as a whole — the old single-file trash deleted the live log.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { apply } from "../lib/index.js";
import { encodeFrames, decodeAll } from "../lib/zstd.js";
import { parseLogFilename, logFilename, pickNewestLog, expandStorageRow, headerFormatVersion } from "../lib/session-log.js";
import { validateLogBuffer } from "../lib/logscan.js";
import { repairLogBuffer } from "../lib/repair.js";

// --------------------------------------------------------------- A. filenames

test("canonical log filenames are generation-addressed", () => {
  assert.equal(logFilename(0), "session.jsonl.zstd");
  assert.equal(logFilename(3), "session.v3.jsonl.zstd");
  assert.equal(logFilename(3, false), "session.v3.jsonl");
  assert.deepEqual(parseLogFilename("session.jsonl.zstd"), { version: 0, compressed: true });
  assert.deepEqual(parseLogFilename("session.v3.jsonl.zstd"), { version: 3, compressed: true });
  assert.deepEqual(parseLogFilename("session.v12.jsonl"), { version: 12, compressed: false });
  // non-canonical names must not be mistaken for a generation
  assert.equal(parseLogFilename("session.lock"), null);
  assert.equal(parseLogFilename("session.v0.jsonl.zstd"), null);
  assert.equal(parseLogFilename("session.jsonl.zstd.tmp"), null);
});

test("the newest generation wins, compressed over plain within one generation", () => {
  assert.deepEqual(pickNewestLog(["session.jsonl.zstd"]), { name: "session.jsonl.zstd", version: 0, compressed: true });
  // the migrated layout: the preserved v0 original next to the live v3 log
  assert.deepEqual(
    pickNewestLog(["session.jsonl.zstd", "session.v3.jsonl.zstd", "session.lock"]),
    { name: "session.v3.jsonl.zstd", version: 3, compressed: true },
  );
  assert.equal(pickNewestLog(["session.lock", "notes.txt"]), null);
});

// ------------------------------------------------------------- B. row expansion

test("v0 packed rows expand to their member events, in seq order", () => {
  const text = expandStorageRow({
    type: "text-chunks",
    seq0: 5,
    time0: 100,
    data: { turn: 1, step: 1, index: 0, dt: [1, 2], texts: ["a", "b", "c"] },
  });
  assert.deepEqual(text.map((e) => e.seq), [5, 6, 7]);
  assert.ok(text.every((e) => e.type === "assistant/chunk"));

  const args = expandStorageRow({
    type: "tool-call-chunks",
    seq0: 0,
    time0: 1,
    data: { turn: 1, step: 1, index: 0, id: "t", dt: [1], args: ["{", "}"] },
  });
  assert.deepEqual(args.map((e) => e.seq), [0, 1]);
});

test("a v3 row is exactly one event, and malformed rows are rejected", () => {
  assert.deepEqual(expandStorageRow({ type: "assistant/message", seq: 4, time: 1, data: {} }), [
    { seq: 4, type: "assistant/message" },
  ]);
  // a packed tag is not part of the v1+ vocabulary: without seq0 it cannot expand
  assert.equal(expandStorageRow({ type: "text-chunks", data: {} }), null);
  assert.equal(expandStorageRow({ type: "assistant/message" }), null); // no seq
  assert.equal(expandStorageRow(null), null);
  assert.equal(expandStorageRow("nope"), null);
  assert.equal(expandStorageRow([1, 2]), null);
});

test("headerFormatVersion reads the declared generation", () => {
  assert.equal(headerFormatVersion('{"type":"session","version":3}\n{"type":"x","seq":0}\n'), 3);
  assert.equal(headerFormatVersion('{"type":"session","version":0}\n'), 0);
  assert.equal(headerFormatVersion("not json\n"), null);
});

// ------------------------------------------------------ C. v3 validate & repair

/** Build a v3 session log: header + one row per event, seqs from the given list. */
function v3Log(seqs, { id = "session-v3test" } = {}) {
  const header = JSON.stringify({
    type: "session", version: 3, id, createdAt: 1, cwd: "C:\\tmp",
    isSeeded: false, delegationDepth: 0,
  });
  const rows = seqs.map((seq, i) =>
    JSON.stringify({ type: i === seqs.length - 1 ? "turn/end" : "user/message", seq, time: 1000 + seq, data: { turn: 1 } }),
  );
  return [header, ...rows].join("\n") + "\n";
}

test("a contiguous v3 log validates; a seq gap is reported at the right line", () => {
  const good = validateLogBuffer(encodeFrames(v3Log([0, 1, 2, 3])));
  assert.equal(good.valid, true);
  assert.equal(good.acceptedEvents, 4);
  assert.equal(good.formatVersion, 3);

  const bad = validateLogBuffer(encodeFrames(v3Log([0, 1, 5, 6])));
  assert.equal(bad.valid, false);
  // lines are 1-based over the whole file, header included
  assert.deepEqual(bad.issue, { line: 4, expected: 2, got: 5 });
});

test("repairing a v3 split-brain keeps the winning stream and preserves version 3", async () => {
  // 0,1,2 accepted; a stale branch (9,10) breaks the chain; 3,4,5 is the live tail.
  const result = await repairLogBuffer(encodeFrames(v3Log([0, 1, 2, 9, 10, 3, 4, 5])));
  assert.equal(result.ok, true);
  assert.notEqual(result.repaired, null);

  const { text } = decodeAll(result.repaired);
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  // header is carried through verbatim, so the artifact stays v3
  assert.equal(headerFormatVersion(text), 3);
  assert.deepEqual(JSON.parse(lines[0]), {
    type: "session", version: 3, id: "session-v3test", createdAt: 1, cwd: "C:\\tmp",
    isSeeded: false, delegationDepth: 0,
  });
  // the stale 9/10 rows are gone and the survivors are contiguous
  const seqs = lines.slice(1).map((l) => JSON.parse(l).seq);
  assert.deepEqual(seqs, [0, 1, 2, 3, 4, 5]);
  assert.equal(result.report.keptRows, 6);
  assert.equal(result.report.lastSeq, 5);
  // 丢弃计数只统计真正没进 merged 的行（此前把**保留**的 chain 行也算了进去，
  // 而这个数字会由客户端直接显示给用户：「保留 X · 丢弃 Y」）
  assert.equal(result.report.droppedRestRows, 2, "the stale 9/10 run is the only loss");
  assert.equal(result.report.droppedPrefixRows, 0);
  assert.equal(result.report.droppedRows, 2);
  assert.equal(validateLogBuffer(result.repaired).valid, true);
});

test("a foreign header is invalid, and repair does not answer 'already valid'", async () => {
  // Contiguous events + a header that is not a session record: previously the
  // validator ignored the header entirely, so this was reported "already valid"
  // and repair said "nothing to do" while the kernel would reject the artifact.
  const header = JSON.stringify({ type: "not-a-session", version: 3 });
  const rows = [0, 1, 2].map((seq) => JSON.stringify({ type: "user/message", seq, time: 1, data: {} }));
  const buffer = encodeFrames([header, ...rows].join("\n") + "\n");

  const v = validateLogBuffer(buffer);
  assert.equal(v.valid, false);
  assert.deepEqual(v.issue, { line: 1, kind: "header" });

  const repaired = await repairLogBuffer(buffer);
  assert.equal(repaired.ok, false);
  assert.equal(repaired.report.error, "header line is not a session record");
});

test("repair refuses a log whose header is not a session record", async () => {
  const header = JSON.stringify({ type: "not-a-session", version: 3 });
  const rows = [0, 1, 9].map((seq) => JSON.stringify({ type: "user/message", seq, time: 1, data: {} }));
  const result = await repairLogBuffer(encodeFrames([header, ...rows].join("\n") + "\n"));
  assert.equal(result.ok, false);
  assert.equal(result.report.error, "header line is not a session record");
});

// ------------------------------------------- D. two-generation session directory

const HOME = mkdtempSync(join(tmpdir(), "dsh-sc-fmt-"));
process.env.DSH_HOME = HOME;
process.env.DSH_KERNEL_ROOT = join(HOME, "fake-kernel");
const SESSION_ID = "session-twogen";
const PROJECT = "--tmp--";
const sessionDir = () => join(HOME, "sessions", PROJECT, SESSION_ID);

/** The live v3 log: usage rides `assistant/message` in this generation. */
function v3LiveText() {
  const header = JSON.stringify({ type: "session", version: 3, id: SESSION_ID, createdAt: 2, isSeeded: false, delegationDepth: 0 });
  const rows = [
    JSON.stringify({ type: "request/header", seq: 0, time: 1000, data: { header: { config: { provider: "deepseek-official", model: "deepseek-flash" } } } }),
    JSON.stringify({ type: "assistant/message", seq: 1, time: 2000, data: { turn: 1, step: 1, usage: { inputTokens: 1000, cacheReadTokens: 500, outputTokens: 200 } } }),
  ];
  return [header, ...rows].join("\n") + "\n";
}

/** The preserved v0 original, written by the pre-0.1.5 kernel. */
function v0LegacyText() {
  const header = JSON.stringify({ type: "session", version: 0, id: SESSION_ID, createdAt: 1, cwd: "C:\\tmp" });
  const rows = [
    JSON.stringify({ type: "user/message", seq: 0, time: 1, data: {} }),
    JSON.stringify({ type: "text-chunks", seq0: 1, time0: 2, data: { turn: 1, step: 1, index: 0, dt: [1], texts: ["old", "original"] } }),
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
  // 内核 Connection seam：注册归属调用者 fiber + 重复 path 抛错（宿主同款语义）
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
  writeFileSync(join(sessionDir(), "session.jsonl.zstd"), encodeFrames(v0LegacyText()));
  writeFileSync(join(sessionDir(), "session.v3.jsonl.zstd"), encodeFrames(v3LiveText()));
  await apply(ctx);
  routes = routeHandlers;
});

after(() => {
  rmSync(HOME, { recursive: true, force: true });
});

function req(payload) {
  const body = Buffer.from(JSON.stringify(payload ?? {}));
  return {
    [Symbol.asyncIterator]() {
      let done = false;
      return { next: async () => (done ? { done: true } : ((done = true), { done: false, value: body })) };
    },
  };
}

function res() {
  const out = { status: 0, body: "" };
  return {
    out,
    writeHead: (s) => { out.status = s; },
    end: (b) => { out.body = b ?? ""; },
  };
}

async function call(method, payload) {
  const route = routes.get(`/api/session-center.${method}`);
  if (!route) throw new Error(`no route registered for ${method}`);
  const request = new Request(`http://127.0.0.1/api/session-center.${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload ?? {}),
  });
  return (await route.fetch(request)).json();
}

test("the v3 generation is found even though session.jsonl.zstd also exists", async () => {
  const diagnosis = await call("session.diagnose", { sessionId: SESSION_ID });
  assert.equal(diagnosis.ok, true);
  // the LIVE log is the one reported, not the preserved v0 original
  assert.equal(diagnosis.value.file, "session.v3.jsonl.zstd");
  assert.equal(diagnosis.value.formatVersion, 3);
  assert.equal(diagnosis.value.valid, true);
});

test("cost is read from the v3 usage carrier (assistant/message.data.usage)", async () => {
  const cost = await call("session.cost", { sessionId: SESSION_ID });
  assert.equal(cost.ok, true);
  assert.equal(cost.value.requests, 1);
  assert.equal(cost.value.inputTokens, 1000);
  assert.equal(cost.value.cacheReadTokens, 500);
  assert.equal(cost.value.outputTokens, 200);
  assert.ok(cost.value.cost > 0, "a priced request must not report zero cost");
});

test("delete trashes EVERY generation and restore brings the live log back intact", async () => {
  const before3 = readFileSync(join(sessionDir(), "session.v3.jsonl.zstd"));
  const before0 = readFileSync(join(sessionDir(), "session.jsonl.zstd"));

  const deleted = await call("session.delete", { sessionId: SESSION_ID, force: true });
  assert.equal(deleted.ok, true);
  assert.equal(deleted.value.trashed, true);
  // the old implementation removed the directory and silently destroyed the
  // live v3 log, which it had not moved
  assert.equal(existsSync(join(HOME, "session-center", "trash", SESSION_ID, "artifact", "session.v3.jsonl.zstd")), true);
  assert.equal(existsSync(sessionDir()), false);

  const listed = await call("trash.list", {});
  assert.equal(listed.ok, true);
  assert.equal(listed.value.entries.length, 1);

  const restored = await call("session.restore", { sessionId: SESSION_ID });
  assert.equal(restored.ok, true);
  assert.deepEqual(readFileSync(join(sessionDir(), "session.v3.jsonl.zstd")), before3);
  assert.deepEqual(readFileSync(join(sessionDir(), "session.jsonl.zstd")), before0);
});

test("backup snapshots the whole generation set and restores it", async () => {
  const backup = await call("session.backup", { sessionId: SESSION_ID, reason: "test" });
  assert.equal(backup.ok, true);
  assert.equal(backup.value.files, 2);

  const live = encodeFrames(v3Log([0, 1, 2], { id: SESSION_ID }));
  writeFileSync(join(sessionDir(), "session.v3.jsonl.zstd"), live);

  const restored = await call("backups.restore", { sessionId: SESSION_ID, backupId: backup.value.id });
  assert.equal(restored.ok, true);
  const back = validateLogBuffer(readFileSync(join(sessionDir(), "session.v3.jsonl.zstd")));
  assert.equal(back.formatVersion, 3);
  assert.equal(back.acceptedEvents, 2, "the snapshot's usage-bearing log is restored");
});

test("repair/restore refuse a session that still has a live agent", async () => {
  const liveCtx = { ...ctx, agents: { get: () => ({ id: SESSION_ID, status: "idle" }) } };
  const handlers = new Map();
  const localCtx = {
    ...liveCtx,
    connection: {
      fetch: {
        register: (route) => {
          handlers.set(route.path, route);
          return () => { handlers.delete(route.path); };
        },
      },
    },
  };
  await apply(localCtx);
  const callLocal = async (method, payload) => {
    const route = handlers.get(`/api/session-center.${method}`);
    const request = new Request(`http://127.0.0.1/api/session-center.${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload ?? {}),
    });
    return (await route.fetch(request)).json();
  };

  const repaired = await callLocal("session.repair", { sessionId: SESSION_ID });
  assert.equal(repaired.ok, false);
  assert.equal(repaired.error.code, "refused");

  // 备份恢复此前没有这道门禁（只有 session.repair 有），会在内核 flush 脚下换掉 artifact
  const made = await callLocal("session.backup", { sessionId: SESSION_ID, reason: "gate-test" });
  assert.equal(made.ok, true);
  const restored = await callLocal("backups.restore", { sessionId: SESSION_ID, backupId: made.value.id });
  assert.equal(restored.ok, false);
  assert.equal(restored.error.code, "refused");
});

test("session.repair writes back to the v3 generation, never the v0 original", async () => {
  const dir = join(HOME, "sessions", PROJECT, "session-repairv3");
  mkdirSync(dir, { recursive: true });
  const v0 = encodeFrames(v0LegacyText());
  writeFileSync(join(dir, "session.jsonl.zstd"), v0);
  const corrupt = v3Log([0, 1, 9, 2, 3], { id: "session-repairv3" });
  writeFileSync(join(dir, "session.v3.jsonl.zstd"), encodeFrames(corrupt));

  const result = await call("session.repair", { sessionId: "session-repairv3" });
  assert.equal(result.ok, true);
  assert.equal(result.value.repaired, true);
  assert.equal(result.value.file, "session.v3.jsonl.zstd");
  // the preserved v0 original is untouched
  assert.deepEqual(readFileSync(join(dir, "session.jsonl.zstd")), v0);
  const repaired = validateLogBuffer(readFileSync(join(dir, "session.v3.jsonl.zstd")));
  assert.equal(repaired.valid, true);
  assert.equal(repaired.formatVersion, 3);
});
