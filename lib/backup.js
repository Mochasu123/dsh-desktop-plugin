// dsh-session-center — backup & trash file operations.
//
// Layout under $DSH_HOME/session-center/:
//   backups/<sessionId>/<at>-<reason>/          snapshot of the Session directory
//   trash/<sessionId>/artifact/                 the moved Session directory
//   trash/<sessionId>/meta.json                 restore metadata
//   trash/<sessionId>/session.jsonl.zstd        LEGACY layout (single file, pre-2026-09-11)
//
// A Session directory is no longer "one log file". Since kernel 0.1.5 it holds
// ONE FILE PER FORMAT GENERATION — `session.jsonl.zstd` (the preserved v0
// original) next to `session.v3.jsonl.zstd` (the live log) — plus a
// `session.lock` lease. Operations that touched only `session.jsonl.zstd`
// therefore backed up, trashed and restored a STALE file while the live log
// was destroyed by the follow-up directory removal. Everything here now works
// on the whole directory, and reads/writes are addressed through the
// generation-aware resolver in ./session-log.js.

import { access, copyFile, mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { centerRoot } from "./state.js";
import { headerFormatVersion, listSessionLogs, logFilename, parseLogFilename, pickNewestLog } from "./session-log.js";
import { decodeAll } from "./zstd.js";

/** Legacy single-file name, still read for pre-2026-09-11 trash/backup entries. */
export const SESSION_FILE = "session.jsonl.zstd";

/** The persistence lease; never snapshotted (a restored stale lease is poison). */
const LEASE_FILE = "session.lock";

function sessionsRoot() {
  return join(process.env.DSH_HOME ?? join(homedir(), ".dsh"), "sessions");
}

/** True when `dir` holds at least one canonical session log. */
async function holdsSessionLog(dir) {
  try {
    const names = await readdir(dir);
    return pickNewestLog(names) !== null;
  } catch {
    return false;
  }
}

/**
 * Locate the artifact directory for a session under every project dir.
 * A directory counts when it holds ANY format generation, so a session whose
 * only log is `session.v3.jsonl.zstd` is still found.
 * @returns {Promise<{dir:string, projectDir:string, log:string|null} | null>}
 */
export async function findSessionDir(sessionId) {
  const root = sessionsRoot();
  let projects;
  try {
    projects = await readdir(root, { withFileTypes: true });
  } catch {
    return null;
  }
  for (const proj of projects) {
    if (!proj.isDirectory()) continue;
    const dir = join(root, proj.name, sessionId);
    if (!(await holdsSessionLog(dir))) continue;
    const names = await readdir(dir);
    const newest = pickNewestLog(names);
    return { dir, projectDir: proj.name, log: newest ? join(dir, newest.name) : null };
  }
  return null;
}

/**
 * The log a session tool should READ: the highest generation present.
 * @returns {Promise<{dir:string, projectDir:string, log:string|null} | null>}
 */
export async function findSessionLog(sessionId) {
  const found = await findSessionDir(sessionId);
  if (found === null) return null;
  if (found.log !== null) return found;
  // Legacy trash-style directory: a bare log with no canonical name.
  try {
    await access(join(found.dir, SESSION_FILE));
    return { ...found, log: join(found.dir, SESSION_FILE) };
  } catch {
    return null;
  }
}

/** Copy every canonical log of a Session directory into `destDir`; returns the file count. */
async function snapshotLogs(srcDir, destDir) {
  const logs = await listSessionLogs(srcDir);
  await mkdir(destDir, { recursive: true });
  for (const log of logs) {
    await copyFile(log, join(destDir, log.slice(srcDir.length + 1)));
  }
  return logs.length;
}

/** Total byte size of a directory tree (0 when unreadable). */
async function dirBytes(dir) {
  let total = 0;
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) total += await dirBytes(path);
      else total += (await stat(path).catch(() => ({ size: 0 }))).size;
    }
  } catch {
    // unreadable subtree contributes nothing
  }
  return total;
}

/**
 * Snapshot a session's logs into the backup store.
 *
 * The whole generation set is copied, so restoring a backup cannot resurrect a
 * stale generation over a live one. `session.lock` is deliberately excluded.
 *
 * @param {string} sessionId
 * @param {string} reason
 * @returns {Promise<object>} the backup entry (persisted in state.json).
 */
export async function backupSessionFile(sessionId, reason) {
  const found = await findSessionDir(sessionId);
  if (!found) throw new Error(`session "${sessionId}" has no on-disk artifact`);
  const at = Date.now();
  const id = `${at}-${String(Math.random().toString(36).slice(2, 8))}`;
  const slug = String(reason).replace(/[^a-z0-9-]/gi, "");
  const destDir = join(centerRoot(), "backups", sessionId, `${id}-${slug}`);
  const files = await snapshotLogs(found.dir, destDir);
  if (files === 0) throw new Error(`session "${sessionId}" has no readable log generation`);
  return { id, at, reason, path: destDir, bytes: await dirBytes(destDir), files, dir: found.dir };
}

/**
 * Restore a backup snapshot over the session's current generations.
 *
 * Only log generations are written back; the live `session.lock` is left to
 * the persistence layer, and generations absent from the snapshot are removed
 * so the restored state is exactly the snapshot (not a merge).
 *
 * @param {string} sessionId
 * @param {{path:string}} entry
 */
export async function restoreBackupFile(sessionId, entry) {
  const found = await findSessionDir(sessionId);
  if (!found) throw new Error(`session "${sessionId}" has no artifact directory to restore into`);
  let st;
  try {
    st = await stat(entry.path);
  } catch {
    throw new Error(`backup missing: ${entry.path}`);
  }
  if (st.isDirectory()) {
    // Preserve the pre-restore generations once, then swap in the snapshot.
    const preDir = `${entry.path}.pre-restore-${Date.now()}`;
    await snapshotLogs(found.dir, preDir);
    for (const log of await listSessionLogs(found.dir)) await rm(log, { force: true });
    for (const log of await listSessionLogs(entry.path)) {
      await copyFile(log, join(found.dir, log.slice(entry.path.length + 1)));
    }
    return;
  }
  // LEGACY: a single-file backup。**按快照自身的代际**决定落点：把一个 v0 文本写进
  // `session.v3.jsonl.zstd`，内核会按 v3 解析然后拒绝/报错（旧实现正是写到最新的那个文件名上）。
  const { text } = decodeAll(await readFile(entry.path));
  const legacyVersion = headerFormatVersion(text);
  const target = legacyVersion === null
    ? (found.log ?? join(found.dir, SESSION_FILE))
    : join(found.dir, logFilename(legacyVersion));
  await copyFile(target, `${target}.pre-restore`).catch(() => {
    // 目标代际文件可能本来就不存在（例如快照是 v0 而磁盘上只剩 v3）：没有可留存的原件。
  });
  await copyFile(entry.path, target);
}

/**
 * 摘要（标题/创建时间/cwd）：删除时算一次，写进回收站记录与 meta.json，
 * 让 `trash.list` 不必每次都对回收站做全量解码。
 * @param {string} dir - 已搬入回收站的 artifact 目录
 * @returns {Promise<{title:string|null,createdAt:number|null,cwd:string|null}>}
 */
async function artifactSummary(dir) {
  const summary = { title: null, createdAt: null, cwd: null };
  try {
    const newest = pickNewestLog(await readdir(dir));
    if (!newest) return summary;
    const { text } = decodeAll(await readFile(join(dir, newest.name)));
    const lines = text.split("\n");
    try {
      const header = JSON.parse(lines[0] ?? "");
      summary.createdAt = header?.createdAt ?? null;
      summary.cwd = header?.cwd ?? null;
    } catch { /* header 不可解析：标题仍尽力而为 */ }
    const limit = Math.min(lines.length, 5000);
    for (let i = 1; i < limit; i += 1) {
      if (!lines[i].includes('"session/title"')) continue; // 子串快筛，跳过普通事件行
      try {
        const row = JSON.parse(lines[i]);
        if (row.type === "session/title" && typeof row.data?.title === "string") {
          summary.title = row.data.title;
          break;
        }
      } catch { /* skip */ }
    }
  } catch { /* 摘要尽力而为，失败不影响删除 */ }
  return summary;
}

/**
 * Move a session's WHOLE artifact directory into the trash.
 *
 * Moving the directory (rather than one file) is what makes deletion
 * recoverable: the previous implementation renamed `session.jsonl.zstd` and
 * then removed the directory, which silently destroyed the live v3 log that
 * the kernel had written alongside it.
 *
 * @param {string} sessionId
 * @param {string[]} workspaceIds
 * @returns {Promise<object>} the trash entry.
 */
export async function trashSessionFile(sessionId, workspaceIds) {
  const found = await findSessionDir(sessionId);
  if (!found) throw new Error(`session "${sessionId}" has no on-disk artifact`);
  const trashDir = join(centerRoot(), "trash", sessionId);
  // 同 id 的回收站目录可能已存在（重复删除、或上次 restore 半途失败留下）。先改名让位，
  // 等新条目完全落定后再删——旧实现是「先 rm 再 rename」：rename 一旦失败（EBUSY/EPERM），
  // 那份本来还能恢复的旧副本就已经被删掉了。
  let displaced = null;
  if (existsSync(trashDir)) {
    displaced = `${trashDir}.old-${Date.now()}`;
    await rename(trashDir, displaced);
  }
  await mkdir(trashDir, { recursive: true });
  const artifactDir = join(trashDir, "artifact");
  try {
    await rename(found.dir, artifactDir);
  } catch (error) {
    // 回滚：把让位的旧回收站放回去，别让这次失败把回收站一起吞掉。
    await rm(trashDir, { recursive: true, force: true });
    if (displaced !== null) await rename(displaced, trashDir).catch(() => {});
    throw error;
  }
  const entry = {
    sessionId,
    projectDir: found.projectDir,
    workspaceIds: workspaceIds ?? [],
    deletedAt: Date.now(),
    bytes: await dirBytes(artifactDir),
    dir: found.dir,
    layout: "directory",
    // 删除时顺手记摘要（标题/创建时间/cwd）：回收站列表因此不必再全量解码。
    // 这里多花一次解码是"发生在删除路径上"的，不在打开侧栏的热路径里
    // （2026-09-26 实测：列表侧旧实现要 ~500 ms，堵死宿主事件循环）。
    ...(await artifactSummary(artifactDir)),
  };
  await writeFile(join(trashDir, "meta.json"), JSON.stringify(entry, null, 2), "utf8");
  // 新条目已经落定（artifact + meta.json 都写完了），现在才可以丢旧副本。
  if (displaced !== null) await rm(displaced, { recursive: true, force: true }).catch(() => {});
  return entry;
}

/** The log inside a trash entry — new directory layout or legacy single file. */
export async function trashLogPath(sessionId) {
  const trashDir = join(centerRoot(), "trash", sessionId);
  const artifactDir = join(trashDir, "artifact");
  if (await holdsSessionLog(artifactDir)) {
    const newest = pickNewestLog(await readdir(artifactDir));
    return newest ? join(artifactDir, newest.name) : null;
  }
  const legacy = join(trashDir, SESSION_FILE);
  try {
    await access(legacy);
    return legacy;
  } catch {
    return null;
  }
}

/** Restore a trashed session's artifact back into its original project dir. */
export async function restoreTrashFile(entry) {
  const trashDir = join(centerRoot(), "trash", entry.sessionId);
  const artifactDir = join(trashDir, "artifact");
  const destDir = join(sessionsRoot(), entry.projectDir, entry.sessionId);
  await mkdir(destDir, { recursive: true });

  if (await holdsSessionLog(artifactDir)) {
    // Directory layout: copy every generation back, then drop the trash entry.
    for (const log of await listSessionLogs(artifactDir)) {
      await copyFile(log, join(destDir, log.slice(artifactDir.length + 1)));
    }
    await rm(trashDir, { recursive: true, force: true });
    return;
  }

  // LEGACY layout: the log sits directly under trash/<sessionId>/.
  let legacy = null;
  try {
    const names = await readdir(trashDir);
    legacy = names.map((n) => ({ n, p: parseLogFilename(n) })).find((e) => e.p !== null)?.n ?? null;
    if (legacy === null) {
      await access(join(trashDir, SESSION_FILE));
      legacy = SESSION_FILE;
    }
  } catch {
    throw new Error(`trash file missing for ${entry.sessionId}`);
  }
  await copyFile(join(trashDir, legacy), join(destDir, legacy));
  await rm(trashDir, { recursive: true, force: true });
}

/** Permanently delete a trashed session's files. */
export async function purgeTrashFile(sessionId) {
  await rm(join(centerRoot(), "trash", sessionId), { recursive: true, force: true });
}
