// Boot smoke test for dsh-session-center's server half.
//
// Runs the plugin's apply(ctx) against a mock context and asserts the shape of
// the route table it mounts on the kernel's Connection seam
// (`ctx.connection.fetch.register`, the same seam session.export / file-upload
// use). Two regressions this guards:
//   1. the route table (including the restart route the sidebar button calls)
//      actually mounts;
//   2. every route carries the Connection fetch contract — a route registered
//      with the wrong shape (or on the raw webServer instead) never receives a
//      request, and the failure is a silent 404 in the browser.
//
// Isolation: DSH_HOME and DSH_KERNEL_ROOT point into a temp dir. apply() runs
// the kernel-patch engine, so without this the test would read — and on a
// freshly upgraded machine even WRITE — the globally installed kernel
// (docs/ARCHITECTURE.md §7). Tests must never touch the real install.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const HOME = mkdtempSync(join(tmpdir(), "dsh-sc-boot-"));
process.env.DSH_HOME = HOME;
process.env.DSH_KERNEL_ROOT = join(HOME, "fake-kernel");

const { apply } = await import("../lib/index.js");

const registered = new Map();
const ctx = {
  logger: { info: () => {}, warn: () => {}, error: () => {} },
  systemPrompt: { section: () => () => {} },
  on: () => () => {},
  tools: { register: () => {} },
  agents: { get: () => undefined },
  sessions: { store: undefined },
  workspaceRegistry: { list: () => [] },
  connection: {
    fetch: {
      // 宿主语义：重复 exact path 抛错（HostConnectionService.registerFetchRoute）
      register: (route) => {
        if (registered.has(route.path)) {
          throw new Error(`connection: exact Fetch route "${route.path}" is already registered`);
        }
        registered.set(route.path, route);
        return () => { registered.delete(route.path); };
      },
    },
  },
};

await apply(ctx);

test("apply() mounts the full route table on the Connection seam", () => {
  assert.ok(registered.size >= 21, `expected >=21 routes, got ${registered.size}`);
  assert.ok(registered.has("/api/session-center.restart"), "restart route mounts");
  assert.ok(registered.has("/api/session-center.restart.status"), "restart.status route mounts");
  for (const path of registered.keys()) {
    assert.ok(path.startsWith("/api/session-center."), `route stays under the plugin path: ${path}`);
    assert.ok(path.startsWith("/api/"), `route lives below /api so Connection gates it: ${path}`);
  }
});

test("every route declares a valid Connection fetch contract", () => {
  for (const [path, route] of registered) {
    assert.equal(route.path, path, `${path}: path matches the registry key`);
    assert.ok(Array.isArray(route.methods) && route.methods.length > 0, `${path}: methods declared`);
    for (const method of route.methods) {
      assert.ok(["GET", "HEAD", "POST"].includes(method), `${path}: unsupported method ${method}`);
    }
    assert.ok(["buffered", "streaming"].includes(route.requestBody), `${path}: requestBody mode`);
    assert.equal(typeof route.fetch, "function", `${path}: fetch handler`);
  }
});

test("destructive routes are POST-only; the wallpaper file route is read-only", () => {
  for (const method of ["session.delete", "trash.purge", "session.repair", "backups.restore", "tag.save", "restart"]) {
    const route = registered.get(`/api/session-center.${method}`);
    assert.ok(route, `${method} route exists`);
    assert.deepEqual(route.methods, ["POST"], `${method} must not answer GET/HEAD`);
  }
  const fileRoute = registered.get("/api/session-center.wallpaper.file");
  assert.deepEqual(fileRoute.methods, ["GET", "HEAD"], "wallpaper.file is the only read-only route");
});

test("teardown", () => {
  rmSync(HOME, { recursive: true, force: true });
});
