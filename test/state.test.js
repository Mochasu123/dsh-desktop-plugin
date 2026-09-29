// dsh-session-center — state store (CenterState) regression tests.
//
// Two behaviours that used to be silently wrong and both have on-disk
// consequences, so they are worth pinning down:
//
//   A16  `pushBackup` trimmed its in-memory index to 20 entries but never
//        deleted the directories those entries pointed at — `backups/` grew
//        without bound (a session backed up on every dispose keeps a full copy
//        of every generation forever). The fix deletes the retired snapshot
//        directory as well; deleting real user data makes a test mandatory.
//
//   A20  zstd logs are attacker-controlled input in the sense that a corrupt
//        or hand-crafted frame can decompress to gigabytes. `decodeAll` now
//        passes `maxOutputLength`; without it the host process is OOM-killed
//        (= the whole harness dies).

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Isolate the plugin data root (centerRoot()) from the real $DSH_HOME.
const HOME = mkdtempSync(join(tmpdir(), "dsh-sc-state-"));
process.env.DSH_HOME = HOME;

const { CenterState, centerRoot } = await import("../lib/state.js");

test("pushBackup keeps the newest 20 entries AND removes the retired snapshot dirs", async () => {
  const state = new CenterState(join(centerRoot(), "state.json"));
  await state.load();

  const made = [];
  for (let i = 0; i < 23; i += 1) {
    const dir = join(centerRoot(), "backups", "sess-1", `snap-${i}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "session.jsonl.zstd"), "x", "utf8");
    made.push(dir);
    state.pushBackup("sess-1", { id: `snap-${i}`, at: 1000 + i, path: dir, bytes: 1, reason: "auto" });
  }

  // The index is capped…
  const kept = state.listBackups("sess-1");
  assert.equal(kept.length, 20, "the index keeps the 20 newest entries");
  // …by recency, not insertion order.
  assert.equal(kept[0].id, "snap-22", "newest first");
  assert.equal(kept[19].id, "snap-3", "oldest surviving entry is snap-3");

  // Give the fire-and-forget rm() calls a turn to complete.
  await new Promise((r) => setTimeout(r, 200));

  for (const id of ["snap-0", "snap-1", "snap-2"]) {
    assert.equal(existsSync(join(centerRoot(), "backups", "sess-1", id)), false,
      `retired snapshot ${id} must be gone from disk, index trimming alone leaks it`);
  }
  for (const id of ["snap-3", "snap-22"]) {
    assert.equal(existsSync(join(centerRoot(), "backups", "sess-1", id)), true,
      `surviving snapshot ${id} must stay on disk`);
  }
});

test("decodeAll refuses a decompression bomb instead of eating all memory", async () => {
  const { zstdCompressSync } = await import("node:zlib");
  const { decodeAll } = await import("../lib/zstd.js");

  // 走**同一条**代码路径（单帧 maxOutputLength + 累计检查），但把上限降到 1 MB：
  // 2 MB 的载荷就是一次"压缩炸弹"，而测试自身不再瞬时分配几百 MB —— 早先那版用
  // 300 MB 载荷，并行跑时把 routes.test.js 的进程拖挂过一次（门禁偶发红）。
  const bomb = zstdCompressSync(Buffer.alloc(2 * 1024 * 1024));
  assert.ok(bomb.length < 64 * 1024, "the bomb is tiny on disk");
  assert.throws(() => decodeAll(bomb, 1024 * 1024), /cap|beyond|larger|maxOutputLength/i);

  // 不越界时照常解出来（证明拒绝的是"超限"，不是把正常日志也一起拒了）
  const ok = decodeAll(bomb, 4 * 1024 * 1024);
  assert.equal(ok.text.length, 2 * 1024 * 1024, "a payload under the cap decodes normally");
});

test("teardown", () => {
  rmSync(HOME, { recursive: true, force: true });
});
