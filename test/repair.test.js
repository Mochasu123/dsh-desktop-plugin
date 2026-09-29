// dsh-session-center — repair engine tests.
//
// Hermetic by construction: every log under test is built in this file, so the
// suite passes on any machine, any drive, any user. It replaces an earlier
// version pinned to two absolute paths outside the repo — a corrupt log in the
// OS temp directory and its proven repair under
// `~/.dsh/sessions/--E-Workspace--/…` (that `--E-Workspace--` key encodes the
// workspace path `E:\Workspace` of a machine this repo no longer runs on).
// Those files are gone, so the assertions that pinned their byte counts
// (157620/157617, 169246/169245) are gone with them.
//
// The shape they captured is what matters, and it is reproduced below:
//
//   SPLIT-BRAIN — two writers interleaved into one log, so `seq` numbering
//   restarts mid-file. The real stream runs 0..realEnd; a stale stream
//   re-numbered from `forkAt` is spliced in just before the real stream
//   reaches that point. File order:
//
//       real[0 .. forkAt-1]  stale[forkAt .. forkAt+staleLen-1]  real[forkAt .. realEnd]
//
//   The harness validator counts accepted events from 0, so it swallows the
//   stale run (its first seq happens to equal the running count) and only
//   trips when the real stream resumes — that seam is the corruption.
//   `repairLogBuffer` must keep the real stream whole and drop the stale run.

import { test } from "node:test";
import assert from "node:assert/strict";
import { repairLogBuffer } from "../lib/repair.js";
import { validateLogBuffer } from "../lib/logscan.js";
import { decodeAll, encodeFrames } from "../lib/zstd.js";

/** One storage row carrying exactly one event at `seq`. */
const ev = (seq, type) => JSON.stringify({ type, seq, time: seq, data: {} });

/** The session header row: line 1, excluded from seq counting. */
const headerRow = () =>
  JSON.stringify({ type: "session", version: 0, id: "session-synthetic01", createdAt: 1, cwd: "/synthetic" });

/** Join a header plus event rows into log text, as the harness writes it. */
const logText = (rows) => [headerRow(), ...rows].join("\n") + "\n";

/** The stale stream's row type — used to prove those rows really were dropped. */
const STALE_TYPE = "tool/call";

/** A clean log: seq 0..realEnd, terminated by turn/end. */
function healthyRows(realEnd) {
  const rows = [];
  for (let s = 0; s < realEnd; s++) rows.push(ev(s, s % 5 === 4 ? "step/end" : "assistant/chunk"));
  rows.push(ev(realEnd, "turn/end"));
  return rows;
}

/**
 * Build a split-brain log plus the expectations its parameters imply.
 * Every expected number below is derived, never transcribed.
 */
function splitBrain({ realEnd, forkAt, staleLen }) {
  const real = healthyRows(realEnd);
  const stale = [];
  for (let s = forkAt; s < forkAt + staleLen; s++) stale.push(ev(s, STALE_TYPE));
  const text = logText([...real.slice(0, forkAt), ...stale, ...real.slice(forkAt)]);
  return {
    buffer: encodeFrames(text),
    // The validator accepts real[0..forkAt-1] then the whole stale run, so the
    // seam reports the post-stale count against the real stream's resumed seq.
    seamExpected: forkAt + staleLen,
    seamGot: forkAt,
    // A correct repair yields exactly the real stream.
    repairedEvents: realEnd + 1,
    repairedLastSeq: realEnd,
    repairedLastType: "turn/end",
  };
}

test("split-brain log is detected as invalid at the stream seam", () => {
  const c = splitBrain({ realEnd: 200, forkAt: 150, staleLen: 30 });
  const v = validateLogBuffer(c.buffer);
  assert.equal(v.valid, false);
  assert.ok(v.issue, "reports an issue");
  assert.equal(v.issue.expected, c.seamExpected);
  assert.equal(v.issue.got, c.seamGot);
});

test("repair keeps the winning stream and drops the stale one", async () => {
  const c = splitBrain({ realEnd: 200, forkAt: 150, staleLen: 30 });
  const result = await repairLogBuffer(c.buffer);
  assert.equal(result.ok, true);
  assert.ok(result.repaired, "produced a repaired buffer");

  const v = validateLogBuffer(result.repaired);
  assert.equal(v.valid, true);
  assert.equal(v.acceptedEvents, c.repairedEvents);
  assert.equal(v.lastSeq, c.repairedLastSeq);
  assert.equal(v.lastType, c.repairedLastType);

  // The point of the repair: the stale stream is gone, not merely re-ordered.
  assert.ok(!decodeAll(result.repaired).text.includes(STALE_TYPE), "no stale rows survive");
});

test("repair scales to a large split-brain log", async () => {
  // The regime the original incident lived in: a long real stream with a
  // several-hundred-row stale run spliced in.
  const c = splitBrain({ realEnd: 2000, forkAt: 1500, staleLen: 300 });
  const result = await repairLogBuffer(c.buffer);
  assert.equal(result.ok, true);
  assert.ok(result.repaired);
  const v = validateLogBuffer(result.repaired);
  assert.equal(v.valid, true);
  assert.equal(v.acceptedEvents, c.repairedEvents);
  assert.equal(v.lastSeq, c.repairedLastSeq);
  assert.equal(v.lastType, c.repairedLastType);
  assert.ok(!decodeAll(result.repaired).text.includes(STALE_TYPE), "no stale rows survive");
});

test("valid log reports already valid and repairs to nothing", async () => {
  const buffer = encodeFrames(logText(healthyRows(120)));
  assert.equal(validateLogBuffer(buffer).valid, true, "the built log is clean to begin with");

  const result = await repairLogBuffer(buffer);
  assert.equal(result.ok, true);
  assert.equal(result.repaired, null);
  assert.match(result.report.note, /already valid/);
});

test("a torn trailing line is truncated, not reported unrepairable", async () => {
  // The most common real corruption: the process died mid-append, so the last
  // record is a half-written line inside an otherwise complete frame. The
  // scanner sees the full prefix and one unparsable tail row.
  const rows = healthyRows(6);
  const text = logText([...rows, '{"type":"assistant/chunk","seq":7,"time":7,"da']);
  const result = await repairLogBuffer(encodeFrames(text));

  assert.equal(result.ok, true, "a torn tail must be repairable by truncation");
  assert.equal(result.report.note, "truncated trailing rows");
  assert.equal(result.report.droppedRows, 1);
  assert.equal(result.report.droppedRestRows, 1);

  const { text: repaired } = decodeAll(result.repaired);
  const seqs = repaired.split("\n").filter((l) => l.trim().length > 0).slice(1).map((l) => JSON.parse(l).seq);
  assert.deepEqual(seqs, [0, 1, 2, 3, 4, 5, 6], "exactly the accepted prefix survives");
  assert.equal(validateLogBuffer(result.repaired).valid, true);
});

test("zstd round trip is lossless", () => {
  // A pure codec property: it needs text, not any particular session.
  const text = logText(healthyRows(500));
  assert.equal(decodeAll(encodeFrames(text)).text, text);
});
