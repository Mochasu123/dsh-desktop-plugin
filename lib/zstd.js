// dsh-session-center — Zstandard frame utilities for session logs.
//
// A dsh session log is a container of concatenated, checksummed Zstandard
// frames: the header record lives in its own frame and event batches are
// appended as further frames. This module locates complete frame ranges
// without decompressing blocks (the same structural walk the harness's own
// jsonl persistence uses), decodes a whole container, and re-encodes plaintext
// back into checksummed frames.

import { zstdCompressSync, zstdDecompressSync, constants } from "node:zlib";

export const ZSTD_MAGIC = 4247762216; // 0xFD2FB528 little-endian

const CHECKSUM_OPTIONS = { params: { [constants.ZSTD_c_checksumFlag]: 1 } };

/**
 * Locate complete frames without decompressing their blocks. Invalid complete
 * structure rejects; EOF inside the final frame returns its start for repair.
 * Mirrors the harness's own scanZstdFrames.
 * @param {Buffer} buffer - complete bytes of the session artifact.
 * @returns {{frames: {start:number,end:number}[], tornStart?: number}}
 */
export function scanZstdFrames(buffer) {
  const frames = [];
  let offset = 0;
  while (offset < buffer.length) {
    const start = offset;
    if (buffer.length - offset < 4) return { frames, tornStart: start };
    if (buffer.readUInt32LE(offset) !== ZSTD_MAGIC) {
      throw new Error(`corrupt Zstandard session log: invalid frame magic at byte ${offset}`);
    }
    offset += 4;
    if (offset === buffer.length) return { frames, tornStart: start };
    const descriptor = buffer.readUInt8(offset);
    offset += 1;
    if ((descriptor & 24) !== 0) {
      throw new Error(`corrupt Zstandard session log: reserved frame-header bit at byte ${offset - 1}`);
    }
    const contentSizeFlag = descriptor >>> 6;
    const singleSegment = (descriptor & 32) !== 0;
    const checksum = (descriptor & 4) !== 0;
    const dictionaryFlag = descriptor & 3;
    const dictionaryBytes = dictionaryFlag === 3 ? 4 : dictionaryFlag;
    const contentSizeBytes = contentSizeFlag === 0 ? (singleSegment ? 1 : 0) : 1 << contentSizeFlag;
    const remainingHeaderBytes = (singleSegment ? 0 : 1) + dictionaryBytes + contentSizeBytes;
    if (buffer.length - offset < remainingHeaderBytes) return { frames, tornStart: start };
    offset += remainingHeaderBytes;
    for (;;) {
      if (buffer.length - offset < 3) return { frames, tornStart: start };
      const blockHeader = buffer.readUIntLE(offset, 3);
      offset += 3;
      const lastBlock = (blockHeader & 1) !== 0;
      const blockType = (blockHeader >>> 1) & 3;
      const blockSize = blockHeader >>> 3;
      if (blockType === 3) {
        throw new Error(`corrupt Zstandard session log: reserved block type at byte ${offset - 3}`);
      }
      const payloadBytes = blockType === 1 ? 1 : blockSize;
      if (buffer.length - offset < payloadBytes) return { frames, tornStart: start };
      offset += payloadBytes;
      if (lastBlock) break;
    }
    if (checksum) {
      if (buffer.length - offset < 4) return { frames, tornStart: start };
      offset += 4;
    }
    frames.push({ start, end: offset });
    if (frames.length === 1_000_000) return { frames };
  }
  return { frames };
}

/**
 * 解压上限（默认 256 MB）。zstd 压缩比可以极高，一个损坏/被投毒的日志能一次性吃掉几 GB
 * 内存（宿主 OOM = 整机 harness 崩溃，而这条路径是 session.diagnose/repair/cost 与
 * trash.list 共用的）。超限直接报错，而不是让进程被 OOM 杀掉。
 * 之所以做成参数：测试要能验证"超限必须报错"这条路径，而不必真的构造 256 MB+ 的载荷
 * （那样测试本身会吃掉几百 MB 内存，并行跑时会把别的测试进程拖挂 —— 实测过一次偶发红）。
 */
export const MAX_DECODE_BYTES = 256 * 1024 * 1024;

/**
 * Decode every complete frame and concatenate the plaintext.
 * @param {Buffer} buffer
 * @param {number} [maxOutputLength] 单帧与累计的双重上限，默认 {@link MAX_DECODE_BYTES}
 * @returns {{text: string, frames: {start:number,end:number}[], tornStart?: number}}
 */
export function decodeAll(buffer, maxOutputLength = MAX_DECODE_BYTES) {
  const { frames, tornStart } = scanZstdFrames(buffer);
  const MAX_OUTPUT = maxOutputLength;
  let total = 0;
  const chunks = frames.map((frame) => {
    let out;
    try {
      out = zstdDecompressSync(buffer.subarray(frame.start, frame.end), { maxOutputLength: MAX_OUTPUT });
    } catch (error) {
      // Node 在超过 maxOutputLength 时抛的是 ERR_BUFFER_TOO_LARGE（"Cannot create a
      // Buffer larger than N bytes"）——对上层（repair/diagnose/trash.list）来说
      // 这句话没有信息量，换成能定位到"日志被投毒/损坏"的说明。
      if (error?.code === "ERR_BUFFER_TOO_LARGE") {
        throw new Error(`session log frame decodes beyond the ${MAX_OUTPUT}-byte cap — refusing to continue (possible zip bomb)`);
      }
      throw error;
    }
    total += out.length;
    if (total > MAX_OUTPUT) {
      throw new Error(`session log decompresses beyond ${MAX_OUTPUT} bytes — refusing to continue (possible zip bomb)`);
    }
    return out;
  });
  return { text: Buffer.concat(chunks).toString("utf8"), frames, tornStart };
}

/**
 * Encode plaintext as checksummed frames: the first line (header) in its own
 * frame, the remaining lines in one events frame — the same container shape
 * the harness writer produces.
 * @param {string} text - plaintext JSONL (header line first).
 * @returns {Buffer}
 */
export function encodeFrames(text) {
  const newline = text.indexOf("\n");
  const header = newline === -1 ? text : text.slice(0, newline + 1);
  const rest = newline === -1 ? "" : text.slice(newline + 1);
  const headerFrame = zstdCompressSync(Buffer.from(header, "utf8"), CHECKSUM_OPTIONS);
  const eventsFrame = zstdCompressSync(Buffer.from(rest, "utf8"), CHECKSUM_OPTIONS);
  return Buffer.concat([headerFrame, eventsFrame]);
}
