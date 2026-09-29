// dsh-session-center — plugin lifecycle (fiber scoping) regression test.
//
// Guards the contract behind "the plugin's routes must belong to its fiber":
// `ctx.connection.fetch.register()` returns a disposer that the framework ties
// to the calling fiber. A plugin that drops it leaves its routes behind on
// unload, the next registration of the same exact path throws
//   connection: exact Fetch route "/api/session-center.tag.list" is already registered
// and the server half fails to load while the client half keeps running — the
// UI stays, every endpoint 404s.
//
// The mock below is deliberately faithful in three ways:
//   1. the disposer returned by register() is recorded on the calling fiber
//      (here: one array), as Cordis does;
//   2. registering an already-registered exact path throws;
//   3. unloading runs the recorded disposers.
// Under those rules the pre-2026-09-26 implementation (which registered on the
// raw webServer and discarded the disposer) throws on the second apply.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Isolate BOTH the plugin's own data root and the kernel-patch target so this
// test can never touch the real $DSH_HOME or the globally installed kernel.
const HOME = mkdtempSync(join(tmpdir(), "dsh-sc-lifecycle-"));
process.env.DSH_HOME = HOME;
process.env.DSH_KERNEL_ROOT = join(HOME, "fake-kernel");

const { apply } = await import("../lib/index.js");

/** Build a fiber-faithful mock context. */
function makeCtx() {
  const routes = new Map();
  const disposers = [];
  return {
    routes,
    disposers,
    ctx: {
      logger: { info: () => {}, warn: () => {}, error: () => {} },
      on: () => () => {},
      systemPrompt: { section: () => () => {} },
      connection: {
        fetch: {
          register: (route) => {
            if (routes.has(route.path)) {
              throw new Error(`connection: exact Fetch route "${route.path}" is already registered`);
            }
            routes.set(route.path, route);
            const dispose = () => { routes.delete(route.path); };
            disposers.push(dispose);
            return dispose;
          },
        },
      },
    },
    disposeAll() {
      while (disposers.length > 0) disposers.pop()();
    },
  };
}

test("apply() scopes every route to the plugin fiber, so unload→reload is clean", async () => {
  const host = makeCtx();

  await apply(host.ctx);
  const first = host.routes.size;
  assert.ok(first >= 21, `expected the full route table, got ${first}`);
  assert.equal(host.disposers.length, first, "every route must hand a disposer to the fiber");

  // Unload: the framework runs the fiber's disposers.
  host.disposeAll();
  assert.equal(host.routes.size, 0, "unload must remove every route");

  // Reload in the SAME process: with the reported bug this throws
  // "already registered" and the server half dies.
  await apply(host.ctx);
  assert.equal(host.routes.size, first, "reload re-registers the same route table");
});

test("teardown", () => {
  rmSync(HOME, { recursive: true, force: true });
});
