// dsh-session-center — session-log repair engine.
//
// Generalizes the manual repair proven on the split-brain session:
//   1. scan the log with the harness's own validator;
//   2. keep the accepted prefix (events the harness scanner would accept);
//   3. among the remaining rows, follow the stream that chains all the way to
//      the final run (backward-connect walk over seq-contiguous runs);
//   4. drop the losing stream's rows and any prefix tail the winning stream
//      reuses (overlapping seqs);
//   5. validate the merged log and re-encode it as checksummed frames.
// Rows are preserved byte-for-byte (only dropped, never rewritten); the
// container is re-encoded as a header frame plus one events frame.
//
// Format coverage: rows are expanded through ./session-log.js, which handles
// both the v0 packed vocabulary and the v1+ one-event-per-row layout. The
// header line is carried through verbatim, so a repaired v3 log stays v3 (the
// kernel refuses a v3 artifact whose header or admission rules were rewritten)
// and a repaired v0 log stays v0.

import { decodeAll, encodeFrames, scanZstdFrames } from "./zstd.js";
import { expandStorageRow, headerFormatVersion } from "./session-log.js";
import { validateLogText } from "./logscan.js";

/**
 * Build seq-contiguous runs over the given event rows.
 * @param {{events:{seq:number}[]}[]} rows - rows in file order.
 * @returns {{start:number,end:number,rowFrom:number,rowTo:number}[]}
 */
function buildRuns(rows) {
  const runs = [];
  let cur = null;
  for (let i = 0; i < rows.length; i++) {
    const evs = rows[i].events;
    if (evs.length === 0) continue;
    const first = evs[0].seq;
    const last = evs[evs.length - 1].seq;
    const contiguous = evs.every((e, k) => k === 0 || e.seq === evs[k - 1].seq + 1);
    if (cur !== null && first === cur.end + 1 && contiguous) {
      cur.end = last;
      cur.rowTo = i;
    } else {
      cur = { start: first, end: last, rowFrom: i, rowTo: i };
      runs.push(cur);
    }
  }
  return runs;
}

/**
 * Repair a corrupted session log artifact.
 * @param {Buffer} buffer - the compressed session file bytes.
 * @returns {Promise<{
 *   ok: boolean,
 *   repaired?: Buffer,
 *   report: object
 * }>}
 */
export async function repairLogBuffer(buffer) {
  const { frames, tornStart } = scanZstdFrames(buffer);
  const base = { frames, tornStart };

  const { text } = decodeAll(buffer);
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const formatVersion = headerFormatVersion(text);
  const withVersion = { ...base, formatVersion };

  // Parse every row once, keeping the original line text.
  const rows = lines.map((lineText, i) => {
    if (i === 0) return { line: i + 1, text: lineText, events: [], header: true };
    try {
      const events = expandStorageRow(JSON.parse(lineText));
      if (events === null) return { line: i + 1, text: lineText, events: [], unparsable: true };
      return { line: i + 1, text: lineText, events };
    } catch {
      return { line: i + 1, text: lineText, events: [], unparsable: true };
    }
  });

  const first = validateLogText(text);
  if (first.valid) {
    return { ok: true, repaired: null, report: { ...withVersion, ...first, note: "already valid" } };
  }

  // Accepted prefix: rows whose events chain from seq 0. Start clean — the
  // validation above only told us the log is corrupt, not where (the prefix
  // loop re-derives the boundary so interleaved streams are handled right).
  let count = 0;
  const prefixRows = [];
  const restRows = [];
  let issue = null;
  for (const row of rows.slice(1)) {
    if (issue !== null || row.unparsable) {
      restRows.push(row);
      continue;
    }
    let ok = true;
    for (let k = 0; k < row.events.length; k++) {
      if (row.events[k].seq !== count + k) { ok = false; break; }
    }
    if (ok) {
      prefixRows.push(row);
      count += row.events.length;
    } else {
      issue = { line: row.line, expected: count, got: row.events[0].seq };
      restRows.push(row);
    }
  }

  // 尾部损坏（半行 JSON、不可解析行、其后没有任何可续流的行）：截断到已接受前缀。
  //
  // 判据必须是「剩余行里没有一行能参与 seq 连通」，而**不是** restRows.length === 0：
  // 任何被拒的行都会进 restRows，所以后者恒假 —— 这段「truncated trailing rows」
  // 逻辑此前永远走不到，一条被写坏的半行尾记录只会得到
  // 「unrepairable / no rows after prefix」。docs/ARCHITECTURE.md §5.4 声称撕裂
  // 帧由这条分支处理，实际并非如此（2026-09-26 修正）。
  const continuable = restRows.some((row) => row.unparsable !== true && row.events.length > 0);
  if (!continuable) {
    return finalize(withVersion, rows[0], prefixRows, restRows, first, "truncated trailing rows", {
      droppedPrefixRows: 0,
      droppedRestRows: restRows.length,
    });
  }

  // Backward-connect walk over runs of the remaining rows. The final run is
  // kept unconditionally (it holds the log's latest events); earlier runs are
  // kept only when they chain onto the kept suffix (run.end + 1 === need).
  const runs = buildRuns(restRows);
  if (runs.length === 0) return { ok: false, report: { ...withVersion, ...first, note: "no rows after prefix", error: "unrepairable" } };
  const lastRun = runs[runs.length - 1];
  const keep = new Set([runs.length - 1]);
  let need = lastRun.start;
  for (let i = runs.length - 2; i >= 0; i--) {
    if (runs[i].end + 1 === need) {
      keep.add(i);
      need = runs[i].start;
    }
  }
  const chainStart = need;
  const chainRows = restRows.filter((_, idx) => {
    const ri = runs.findIndex((r) => idx >= r.rowFrom && idx <= r.rowTo);
    return ri !== -1 && keep.has(ri);
  });

  // Merged rows: prefix rows whose seqs stay below the chain start, plus the chain.
  const keptPrefix = prefixRows.filter((row) => row.events.length === 0 || row.events[row.events.length - 1].seq < chainStart);
  const droppedPrefixRows = prefixRows.filter((row) => !keptPrefix.includes(row));
  const droppedRestRows = restRows.filter((row) => !chainRows.includes(row));
  const merged = [...keptPrefix, ...chainRows];
  // droppedRows 必须是「真正没进 merged 的行」：既包含被赢家流复用而丢弃的
  // 前缀尾部，也包含落败流；此前传的是 restRows（把**保留**的 chain 行也算作
  // 丢弃、又漏掉被丢的前缀行），而客户端会把这两个数字直接显示给用户。
  const res = finalize(withVersion, rows[0], merged, [...droppedPrefixRows, ...droppedRestRows], first, `kept prefix to seq ${chainStart - 1}, kept winning stream to seq ${lastRun.end}`, {
    chainStart,
    maxSeq: lastRun.end,
    droppedPrefixRows: droppedPrefixRows.length,
    droppedRestRows: droppedRestRows.length,
  });
  if (!res.ok && res.report?.error === "merged log still invalid") {
    return {
      ok: false,
      report: {
        ...withVersion, ...first, chainStart, maxSeq: lastRun.end,
        droppedRows: droppedPrefixRows.length + droppedRestRows.length,
        droppedPrefixRows: droppedPrefixRows.length,
        droppedRestRows: droppedRestRows.length,
        keptRows: merged.length,
        note: "merged log still invalid", error: "unrepairable",
      },
    };
  }
  return res;
}

/**
 * Validate and encode the selected rows; produce the final result.
 *
 * The header row is emitted verbatim, which keeps the artifact's format
 * generation intact. 0.1.5 refuses a v3 artifact whose header it cannot admit,
 * so a header that is not a `session` record aborts the repair instead of
 * producing a file the kernel would then reject.
 *
 * @param {object} base - frame/torn/format metadata.
 * @param {{text:string}} headerRow
 * @param {object[]} keptRows
 * @param {object[]} droppedRows
 * @param {object} firstIssue
 * @param {string} note
 * @param {object} [extra]
 */
function finalize(base, headerRow, keptRows, droppedRows, firstIssue, note, extra = {}) {
  let header = null;
  try {
    header = JSON.parse(headerRow.text);
  } catch {
    header = null;
  }
  if (header === null || header.type !== "session") {
    return { ok: false, report: { ...base, ...firstIssue, note, error: "header line is not a session record" } };
  }
  const text = [headerRow.text, ...keptRows.map((r) => r.text)].join("\n") + "\n";
  const check = validateLogText(text);
  if (!check.valid) {
    return { ok: false, report: { ...base, ...firstIssue, note, error: "merged log still invalid", ...extra } };
  }
  return {
    ok: true,
    repaired: encodeFrames(text),
    report: {
      ...base,
      valid: true,
      acceptedEvents: check.acceptedEvents,
      lines: check.lines,
      issue: firstIssue.issue ?? firstIssue,
      droppedRows: droppedRows.length,
      keptRows: keptRows.length,
      lastSeq: check.lastSeq,
      lastType: check.lastType,
      note,
      ...extra,
    },
  };
}
