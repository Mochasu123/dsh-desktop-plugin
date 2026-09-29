// dsh-session-center — session-log validation.
//
// Replicates the harness's own event-stream scanner (the count-based seq
// check in @deepseek-ai/dsh-session-persistence-jsonl): every storage row is
// expanded into the events it stores and each event's `seq` must equal the
// running count of accepted events. Packed v0 rows (text-chunks etc.) expand
// to many events, so "line N" below is the plaintext row line — 1-based over
// the whole file, header line included (index 0 is the header, so the first
// event row reports as line 2).
//
// The expansion lives in ./session-log.js and is written against the on-disk
// shapes rather than the kernel's helpers: 0.1.5 removed `decodeStorageRecord`
// from `@deepseek-ai/dsh-session`, and its session format moved from v0 to v3
// (one event per row). This scanner therefore covers every generation.

import { expandStorageRow, headerFormatVersion } from "./session-log.js";
import { decodeAll } from "./zstd.js";

/**
 * Validate a decoded session log (plaintext JSONL, header line first).
 * @param {string} text
 * @returns {{
 *   valid: boolean,
 *   acceptedEvents: number,
 *   lines: number,
 *   issue?: { line: number, expected: number, got: number } | { line: number, kind: 'unparsable' | 'header' },
 *   lastSeq: number | null,
 *   lastType: string | null
 * }}
 */
export function validateLogText(text) {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  // Header line: the kernel refuses an artifact whose first record is not a
  // `session` record, so "valid" has to include that. Without this check a log
  // with a foreign/truncated header but contiguous seqs was reported
  // "already valid" and `session.repair` answered "nothing to do" — while the
  // kernel would have rejected the artifact outright (the only tool that exists
  // to catch that class of damage stayed silent).
  let header = null;
  try { header = JSON.parse(lines[0] ?? ""); } catch { header = null; }
  if (header === null || typeof header !== "object" || Array.isArray(header) || header.type !== "session") {
    return { valid: false, acceptedEvents: 0, lines: lines.length, issue: { line: 1, kind: "header" }, lastSeq: null, lastType: null };
  }
  let count = 0;
  let issue = null;
  let lastSeq = null;
  let lastType = null;
  for (let i = 1; i < lines.length; i++) {
    let decoded;
    try {
      decoded = expandStorageRow(JSON.parse(lines[i]));
    } catch {
      decoded = null;
    }
    if (decoded === null) {
      issue ??= { line: i + 1, kind: "unparsable" };
      continue;
    }
    if (issue !== null) {
      // Rows after the first issue are skipped by the real scanner until a
      // turn/end row would make it throw; we keep collecting stats instead.
      for (const e of decoded) {
        lastSeq = e.seq;
        lastType = e.type;
      }
      continue;
    }
    for (const e of decoded) {
      if (e.seq !== count) {
        issue = { line: i + 1, expected: count, got: e.seq };
        break;
      }
      count++;
      lastSeq = e.seq;
      lastType = e.type;
    }
  }
  return { valid: issue === null, acceptedEvents: count, lines: lines.length, issue, lastSeq, lastType };
}

/**
 * Validate a compressed session artifact end to end.
 * @param {Buffer} buffer
 * @returns {{frames: number, tornStart?: number, text: string, formatVersion: number|null, ...validation}}
 */
export function validateLogBuffer(buffer) {
  const { text, frames, tornStart } = decodeAll(buffer);
  const v = validateLogText(text);
  return { frames, tornStart, text, formatVersion: headerFormatVersion(text), ...v };
}
