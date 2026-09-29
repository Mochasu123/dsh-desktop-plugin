// dsh-session-center — plugin state (tags, session tags, trash, backups, pins).
//
// A single JSON file under $DSH_HOME/session-center/state.json, loaded once at
// apply time and written atomically (temp file + rename) on every mutation.
// The shape is versioned so future migrations stay explicit.

import { copyFile, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

export const STATE_VERSION = 1;

/** Root directory for everything the plugin owns. */
export function centerRoot() {
  return join(process.env.DSH_HOME ?? join(homedir(), ".dsh"), "session-center");
}

const EMPTY = () => ({
  version: STATE_VERSION,
  tags: [],               // [{id, name, color, createdAt}]
  sessionTags: {},        // { [sessionId]: string[] of tagIds }
  pins: [],               // [sessionId] (pinned first, newest pinned first)
  trash: {},              // { [sessionId]: {sessionId, projectDir, workspaceIds, deletedAt, bytes} }
  backups: {},            // { [sessionId]: [{id, at, reason, path, bytes}] }
});

export class CenterState {
  #path;
  #data;
  #saveChain = Promise.resolve();
  #onError;

  constructor(path, { onError } = {}) {
    this.#path = path;
    this.#data = EMPTY();
    this.#onError = typeof onError === "function" ? onError : null;
  }

  #warn(message) {
    if (this.#onError) this.#onError(message);
    else console.warn(`[dsh-session-center] ${message}`);
  }

  get data() {
    return this.#data;
  }

  /** Load from disk (or seed empty state). Must be awaited once at startup. */
  async load() {
    let raw = null;
    try {
      raw = await readFile(this.#path, "utf8");
    } catch {
      return; // absent — first save creates the file
    }
    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      parsed = null;
      this.#warn(`state.json is not valid JSON (${String(error?.message ?? error)}); starting empty`);
    }
    if (parsed && typeof parsed === "object" && parsed.version === STATE_VERSION) {
      this.#data = { ...EMPTY(), ...parsed };
      return;
    }
    // 解析失败或版本不符：**先留证据再归零**。此前这里静默 start empty，
    // 下一次 save 就会把用户全部标签/置顶/回收站与备份索引覆盖掉，且没有任何
    // 痕迹能追查（回收站目录还在，但界面上永久不可见 = 事实上的数据不可达）。
    if (raw.trim().length > 0) {
      const bad = `${this.#path}.bad-${Date.now()}`;
      try {
        await copyFile(this.#path, bad);
        this.#warn(`state.json version/shape mismatch — kept a copy at ${bad} and started empty`);
      } catch (error) {
        this.#warn(`state.json unreadable and could not be preserved: ${String(error?.message ?? error)}`);
      }
    }
  }

  /** Persist the current state atomically. Serialized to avoid interleaved writes. */
  save() {
    this.#saveChain = this.#saveChain.then(async () => {
      await mkdir(centerRoot(), { recursive: true });
      const tmp = this.#path + ".tmp";
      await writeFile(tmp, JSON.stringify(this.#data, null, 2), "utf8");
      await rename(tmp, this.#path);
    }).catch((error) => {
      // 调用方全是 fire-and-forget，所以这里至少要让失败可见（走 ctx.logger），
      // 而不是只在进程 stdout 上留一行 console.warn。
      // 再包一层 try：如果 onError 自己抛（宿主 logger 在关停期异常等），这个"报错"
      // 会变成一个无人处理的 rejection —— 而这条链是 fire-and-forget，没人 await 它，
      // 于是变成进程级的 unhandledRejection（实测在测试退出阶段表现为整个测试文件失败）。
      try {
        this.#warn(`state save failed: ${String(error?.message ?? error)}`);
      } catch { /* 记录失败绝不能反过来炸掉调用方 */ }
    });
    return this.#saveChain;
  }

  // ---------------------------------------------------------------- tags

  listTags() {
    return this.#data.tags;
  }

  saveTag({ id, name, color }) {
    const tags = this.#data.tags;
    const existing = tags.find((t) => t.id === id);
    if (existing) {
      // 部分更新：只覆盖提供的字段
      if (name !== undefined) existing.name = name;
      if (color !== undefined) existing.color = color;
    } else {
      tags.push({ id, name: name ?? "", color: color ?? "#868E96", createdAt: Date.now() });
    }
    this.save();
    return existing ?? tags[tags.length - 1];
  }

  deleteTag(id) {
    this.#data.tags = this.#data.tags.filter((t) => t.id !== id);
    for (const key of Object.keys(this.#data.sessionTags)) {
      this.#data.sessionTags[key] = this.#data.sessionTags[key].filter((tid) => tid !== id);
    }
    this.save();
  }

  tagsOf(sessionId) {
    return this.#data.sessionTags[sessionId] ?? [];
  }

  /** Replace the tag set of the given sessions ("快速覆盖"). */
  setSessionsTags(sessionIds, tagIds) {
    const valid = new Set(this.#data.tags.map((t) => t.id));
    const clean = tagIds.filter((id) => valid.has(id));
    for (const sid of sessionIds) this.#data.sessionTags[sid] = [...clean];
    this.save();
  }

  // ----------------------------------------------------------------- pins

  listPins() {
    return [...this.#data.pins];
  }

  setPinned(sessionIds, pinned) {
    const set = new Set(this.#data.pins);
    for (const sid of sessionIds) {
      if (pinned) {
        if (!set.has(sid)) set.add(sid);
      } else {
        set.delete(sid);
      }
    }
    this.#data.pins = [...set];
    this.save();
  }

  // ----------------------------------------------------------------- trash

  trashEntry(sessionId) {
    return this.#data.trash[sessionId];
  }

  listTrash() {
    return Object.values(this.#data.trash).sort((a, b) => b.deletedAt - a.deletedAt);
  }

  putTrash(entry) {
    this.#data.trash[entry.sessionId] = entry;
    this.save();
  }

  removeTrash(sessionId) {
    if (this.#data.trash[sessionId]) {
      delete this.#data.trash[sessionId];
      this.save();
    }
  }

  // --------------------------------------------------------------- backups

  listBackups(sessionId) {
    return this.#data.backups[sessionId] ?? [];
  }

  pushBackup(sessionId, entry) {
    const list = (this.#data.backups[sessionId] ??= []);
    list.push(entry);
    list.sort((a, b) => b.at - a.at);
    if (list.length > 20) {
      // 「保留最近 20 份」以前只裁内存索引：被裁掉的快照目录永远留在盘上（backups/ 只增不减）。
      // 现在裁索引的同时删掉对应目录；删除失败只告警，不影响索引落盘。
      const retired = list.splice(20);
      for (const old of retired) {
        if (typeof old?.path !== "string") continue;
        rm(old.path, { recursive: true, force: true }).catch((error) => {
          // 同上：这条也是 fire-and-forget，报错路径本身必须绝对不可能抛。
          try {
            this.#warn(`could not remove retired backup ${old.path}: ${String(error?.message ?? error)}`);
          } catch { /* ignore */ }
        });
      }
    }
    this.save();
  }

  removeBackup(sessionId, id) {
    const list = this.#data.backups[sessionId];
    if (!list) return;
    const idx = list.findIndex((e) => e.id === id);
    if (idx !== -1) {
      list.splice(idx, 1);
      this.save();
    }
  }
}
