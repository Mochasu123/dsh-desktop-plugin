// dsh-session-center — session-log format & artifact knowledge.
//
// Session logs are generation-addressed. The kernel names a log after the
// format version it is written in:
//
//   v0 (0.1.2-rc.1 and earlier)  →  session.jsonl[.zstd]
//   vN (N >= 1, v3 since 0.1.5)  →  session.vN.jsonl[.zstd]
//
// (`@deepseek-ai/dsh-session-format` → `sessionFormatLogFilename`.)
//
// A Session directory can hold SEVERAL generations at once: the 0.1.5 kernel
// migrates a v0 log by writing a new `session.v3.jsonl.zstd` NEXT TO the
// original and never deletes the source, so a downgrade can still read v0.
// The live log is therefore always the HIGHEST generation present — reading a
// hardcoded `session.jsonl.zstd` after such a migration means reading a stale
// file (and, on delete, trashing it while destroying the live one).
//
// Row vocabulary also changed. A v0 row is either one session event, or a
// PACKED run of `assistant/chunk` deltas (`text-chunks` / `reasoning-chunks` /
// `tool-call-chunks`, anchored by `seq0`). Packing was removed at v1, so a v3
// row is exactly one event and its `seq` must equal the running event count.
// `decodeStorageRecord` — the old kernel helper that expanded those rows — no
// longer exists in 0.1.5, and importing it from `@deepseek-ai/dsh-session`
// fails at module instantiation. The expansion below is written against the
// frozen on-disk shapes instead, so it works on every generation without
// depending on kernel internals.

import { readdir } from "node:fs/promises";
import { join } from "node:path";

/**
 * Canonical generation filename: `session.jsonl` or `session.vN.jsonl`,
 * optionally `.zstd`. Mirrors the kernel's own `CANONICAL_LOG_FILENAME`
 * (`[1-9][0-9]*`), so `.v0`, leading-zero and uppercase forms are NOT
 * generations: v0 keeps the bare `session.jsonl` name.
 */
const LOG_FILENAME_RE = /^session(?:\.v([1-9][0-9]*))?\.jsonl(\.zstd)?$/;

/** Packed-run tags; they exist only in the v0 vocabulary. */
const PACKED_TAGS = new Set(["text-chunks", "reasoning-chunks", "tool-call-chunks"]);

/**
 * Parse a canonical session-log filename.
 * @param {string} name - one directory entry.
 * @returns {{version:number, compressed:boolean} | null} null when not canonical.
 */
export function parseLogFilename(name) {
  const m = LOG_FILENAME_RE.exec(name);
  if (!m) return null;
  return { version: m[1] === undefined ? 0 : Number(m[1]), compressed: m[2] === ".zstd" };
}

/**
 * Canonical filename for one format generation.
 * @param {number} version - format version.
 * @param {boolean} [compressed] - append `.zstd`.
 * @returns {string}
 */
export function logFilename(version, compressed = true) {
  const base = version === 0 ? "session.jsonl" : `session.v${version}.jsonl`;
  return compressed ? `${base}.zstd` : base;
}

/**
 * Pick the newest canonical log from a set of directory entry names.
 * Higher generation wins; within one generation a compressed artifact wins
 * (zstd is the kernel's default encoding).
 * @param {string[]} names - entry names of one Session directory.
 * @returns {{name:string, version:number, compressed:boolean} | null}
 */
export function pickNewestLog(names) {
  let best = null;
  for (const name of names) {
    const parsed = parseLogFilename(name);
    if (!parsed) continue;
    if (
      best === null ||
      parsed.version > best.version ||
      (parsed.version === best.version && parsed.compressed && !best.compressed)
    ) {
      best = { name, ...parsed };
    }
  }
  return best;
}

/**
 * Every canonical log in a Session directory, newest generation first.
 * Used by backup/trash so no generation is silently left behind.
 * @param {string} dir - Session directory.
 * @returns {Promise<string[]>} absolute paths.
 */
export async function listSessionLogs(dir) {
  let names;
  try {
    names = await readdir(dir);
  } catch {
    return [];
  }
  return names
    .map((name) => ({ name, parsed: parseLogFilename(name) }))
    .filter((entry) => entry.parsed !== null)
    .sort((a, b) => b.parsed.version - a.parsed.version)
    .map((entry) => join(dir, entry.name));
}

/**
 * Read the format version declared by a log's header line.
 * @param {string} text - decoded plaintext of the log.
 * @returns {number | null} the header's `version`, or null when unreadable.
 */
export function headerFormatVersion(text) {
  try {
    const first = text.split("\n").find((line) => line.trim().length > 0);
    if (first === undefined) return null;
    const header = JSON.parse(first);
    return Number.isSafeInteger(header?.version) ? header.version : null;
  } catch {
    return null;
  }
}

/**
 * Expand one parsed JSONL row into the session events it stores.
 *
 * v0: a packed run expands to `payload.length` events whose seqs run
 *     `seq0 … seq0 + n - 1`. Every other row is one event.
 * v1+: a row is exactly one event.
 *
 * Only `seq` and `type` are reconstructed for packed runs: the scanner and the
 * repair engine reason about row boundaries and seq continuity, and rows are
 * preserved byte-for-byte when a log is rewritten — the event bodies of a
 * packed run are never needed.
 *
 * @param {unknown} row - one line's `JSON.parse` result.
 * @returns {{seq:number, type:string}[] | null} null when the row is not a
 *   storage record (malformed, or a header-shaped value).
 */
export function expandStorageRow(row) {
  if (row === null || typeof row !== "object" || Array.isArray(row)) return null;
  const tag = row.type;
  if (typeof tag === "string" && PACKED_TAGS.has(tag)) {
    const payload = tag === "tool-call-chunks" ? row.data?.args : row.data?.texts;
    if (!Array.isArray(payload) || payload.length === 0) return null;
    const seq0 = row.seq0;
    if (!Number.isSafeInteger(seq0) || seq0 < 0) return null;
    const events = [];
    for (let k = 0; k < payload.length; k += 1) events.push({ seq: seq0 + k, type: "assistant/chunk" });
    return events;
  }
  if (typeof row.seq === "number" && Number.isSafeInteger(row.seq) && row.seq >= 0) {
    return [{ seq: row.seq, type: typeof tag === "string" ? tag : "" }];
  }
  return null;
}
