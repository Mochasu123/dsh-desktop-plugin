// dsh-session-center — client render smoke test.
//
// Loads the client bundle in Node, captures the sidebar component through the
// same slot-registration path the web runtime uses, and server-renders it.
// Catches render-time crashes (e.g. null-state dereferences) that would
// otherwise blank the sidebar in the browser.

import { test, after } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// ---------------------------------------------------------------------------
// Timer capture: importing the client bundle runs the plugin's long-lived
// heartbeats (sidebar list poll, wallpaper slideshow, …). Nothing in this file
// owns them, so without cleanup the runner keeps the event loop alive until the
// longest pending timer elapses (~11s of pure teardown). Capture every handle
// this FILE creates and cancel them at the end.
// ---------------------------------------------------------------------------
const nativeSetTimeout = globalThis.setTimeout;
const nativeSetInterval = globalThis.setInterval;
const nativeClearTimeout = globalThis.clearTimeout;
const nativeClearInterval = globalThis.clearInterval;
const pendingTimers = new Set();
globalThis.setTimeout = (...args) => {
  const handle = nativeSetTimeout(...args);
  pendingTimers.add(["timeout", handle]);
  return handle;
};
globalThis.setInterval = (...args) => {
  const handle = nativeSetInterval(...args);
  pendingTimers.add(["interval", handle]);
  return handle;
};
globalThis.clearTimeout = (handle) => {
  pendingTimers.delete(["timeout", handle]);
  return nativeClearTimeout(handle);
};
globalThis.clearInterval = (handle) => {
  pendingTimers.delete(["interval", handle]);
  return nativeClearInterval(handle);
};
after(() => {
  for (const [kind, handle] of pendingTimers) {
    try {
      if (kind === "interval") nativeClearInterval(handle);
      else nativeClearTimeout(handle);
    } catch {
      /* already gone */
    }
  }
  pendingTimers.clear();
  globalThis.setTimeout = nativeSetTimeout;
  globalThis.setInterval = nativeSetInterval;
  globalThis.clearTimeout = nativeClearTimeout;
  globalThis.clearInterval = nativeClearInterval;
});

let factory = null;
// Sidebar element stand-in: `isSidebarExpanded()` (and the zen detector) inspect
// `[data-slot="sidebar"]`, so an expanded-looking element is needed for the
// panel row to render. No open/expand affordance, no `collapsed` marker,
// everything else resolves to null.
const sidebarEl = {
  querySelector: () => null,
  querySelectorAll: () => [],
  matches: () => false,
  contains: () => false,
  classList: { contains: () => false },
  closest: () => null,
  hasAttribute: () => false,
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 256, height: 800 }),
};

globalThis.window = {
  __ModuleLoader__: {
    load: ({ factory: f }) => {
      factory = f;
    },
  },
  innerWidth: 1920,
  innerHeight: 1080,
};
globalThis.document = {
  getElementById: () => null,
  createElement: () => ({ style: {}, setAttribute() {}, appendChild() {}, remove() {} }),
  head: { appendChild: () => {} },
  body: { appendChild: () => {}, removeChild: () => {} },
  addEventListener: () => {},
  removeEventListener: () => {},
  querySelector: (sel) => (sel === '[data-slot="sidebar"]' ? sidebarEl : null),
  querySelectorAll: () => [],
  visibilityState: "visible",
  activeElement: null,
};

await import("../client.js");
assert.ok(factory, "client factory captured");

// The plugin injects MANY slots (sidebar, overlay, session header, footer,
// input dock, settings, composer dock). Capture registrations BY SLOT KEY: a
// single-slot fake silently keeps whichever registered last, so the sidebar
// assertions below would run against, say, the composer stats chip and fail
// for a reason that has nothing to do with the sidebar.
const SIDEBAR_SLOT = "sidebar.workspaces";
const injects = [];
const registered = [];
let currentSlot = null;
// Minimal panel registry stand-in: the real host exposes entriesOfSlot()/subscribe()
// for `sidebar.panellist`, where the plugin marketplace ("plugins") and the task
// manager ("schedules") register themselves. The plugin must re-expose ONLY "plugins".
const PANEL_ENTRIES = [
  { options: { id: "schedules", order: 10, label: "定时任务" } },
  { options: { id: "plugins", order: 0, label: "插件市场" } },
];
const fakeCtx = {
  effect: () => () => {},
  on: () => {},
  get: () => null,
  locale: { register: () => {} },
  sessions: { fork: async () => "session-child", open: () => {}, scope: () => ({}) },
  uiWorkspace: { openSession: () => {}, startSession: () => {} },
  workspaces: { startSession: () => {} },
  slots: {
    inject: (key, cb) => {
      injects.push([key, cb]);
    },
    register: (_opts, comp) => {
      registered.push({ slot: currentSlot, comp });
    },
    entriesOfSlot: (key) => (key === "sidebar.panellist" ? PANEL_ENTRIES : []),
    subscribe: () => () => {},
  },
};

const mod = factory((id) => {
  if (id === "react") return React;
  throw new Error("unexpected require: " + id);
});
mod.apply(fakeCtx);
for (const [key, cb] of injects) {
  currentSlot = key;
  cb();
}
currentSlot = null;

const sidebar = registered.find((entry) => entry.slot === SIDEBAR_SLOT);
assert.ok(sidebar, `component registered for ${SIDEBAR_SLOT}`);
const component = sidebar.comp;

const props = {
  t: (key) => key, // function-form locale, as the real renderer passes it
  wide: true,
  open: () => {},
  startSession: () => {},
  useSessions: null,
  useWorkspaces: null,
  useStore: null,
  // layout's `{activePanelId}` snapshot source (the official sidebar reads the same one).
  usePanelInfo: (select) => select({ activePanelId: "plugins" }),
  renderSlot: (_key, slotProps) => React.createElement("span", { "data-glyph": String(slotProps?.active) }),
};

test("global panel entry: plugin marketplace is re-exposed, schedules is not", () => {
  const panelProps = {
    ...props,
    // Injected directly (the prop override) because a DOM-less render reports the
    // sidebar as collapsed and the panel row is deliberately hidden in that state.
    panels: [
      { id: "schedules", order: 10, label: "定时任务" },
      { id: "plugins", order: 0, label: "插件市场" },
    ],
  };
  const html = renderToStaticMarkup(React.createElement(component, panelProps));
  assert.ok(html.includes("sc-panels"), "panel row container renders");
  assert.ok(html.includes("sc-panel-btn"), "panel button renders");
  assert.ok(html.includes("插件市场"), "localized panel label renders");
  assert.ok(html.includes("sc-panel-active"), "active panel (activePanelId=plugins) is highlighted");
  assert.ok(!html.includes("定时任务"), "schedules panel is intentionally not exposed by this plugin");
});

test("client renders without crashing (menu closed, the state that regressed)", () => {
  const html = renderToStaticMarkup(React.createElement(component, props));
  assert.ok(html.includes("sc-root"), "renders the session center root");
  assert.ok(!html.includes("undefined"), "no literal undefined in markup");
});

test("client renders with a pinned row + tags (populated state)", () => {
  const withState = React.createElement(component, props);
  // Rows only appear after data loads; simulate by rendering twice is not
  // possible server-side, so assert the empty state + header are sound.
  const html = renderToStaticMarkup(withState);
  assert.ok(html.includes("sc-header"), "header renders");
  assert.ok(html.includes("sc-trash-section"), "trash section renders");
});

test("sc-wall-working CSS rules prevent hiding dialog during execution", async () => {
  const fs = await import("node:fs");
  const clientContent = fs.readFileSync(new URL("../client.js", import.meta.url), "utf8");
  assert.ok(clientContent.includes("html.sc-wall-zen:not(.sc-wall-working) [data-composer-card]"), "zen hiding excludes working state");
  assert.ok(clientContent.includes("html.sc-wall-working [data-composer-card]"), "working state explicitly forces visible");
  assert.ok(clientContent.includes("function isWorking"), "isWorking function defined");
});

test("opened conversation is protected from Zen mode hiding", async () => {
  const fs = await import("node:fs");
  const clientContent = fs.readFileSync(new URL("../client.js", import.meta.url), "utf8");
  assert.ok(clientContent.includes("function isConversationOpen"), "isConversationOpen function defined");
  assert.ok(clientContent.includes("[data-phase=\"active\"] [data-chat-flow]"), "active chat flow explicitly forced visible");
  assert.ok(!clientContent.includes("html.sc-wall-zen:not(.sc-wall-working) [data-chat-flow]"), "chat flow must NOT be in zen hiding list");
});

test("sidebar auto-hides after 10s of no operation", async () => {
  const fs = await import("node:fs");
  const clientContent = fs.readFileSync(new URL("../client.js", import.meta.url), "utf8");
  assert.ok(clientContent.includes("sidebarDelayMs: 10000"), "sidebar idle delay defaults to 10s (10000ms)");
  assert.ok(clientContent.includes("function resetSidebarTimer"), "resetSidebarTimer function defined");
  assert.ok(clientContent.includes("function collapseSidebarIfOpen"), "collapseSidebarIfOpen function defined");
  assert.ok(clientContent.includes("function isSidebarExpanded"), "isSidebarExpanded function defined");
  assert.ok(clientContent.includes("function isSidebarBusy"), "isSidebarBusy function defined");
  assert.ok(clientContent.includes("function getSidebarCollapseBtn"), "getSidebarCollapseBtn function defined");
  assert.ok(!clientContent.includes("ctxLayout?.toggleSidebar"), "no unsafe ctxLayout access");
});

test("sidebar auto-hides helper logic behavior", async () => {
  const fs = await import("node:fs");
  const clientContent = fs.readFileSync(new URL("../client.js", import.meta.url), "utf8");

  // Extract isSidebarExpanded, getSidebarCollapseBtn, collapseSidebarIfOpen
  const fnDefs = clientContent.match(/function isSidebarExpanded\(\)[\s\S]*?function getSidebarCollapseBtn\(\)[\s\S]*?function collapseSidebarIfOpen\([^)]*\)[\s\S]*?\n\t\t\}/)?.[0];
  assert.ok(fnDefs, "extracted sidebar helper functions");

  // Test with mock DOM elements
  let clickCalls = 0;
  let dispatchCalls = 0;
  const brandBtn = {
    tagName: "BUTTON",
    className: "hHd-Xa_brand hHd-Xa_wide",
    getAttribute: (attr) => (attr === "aria-label" ? "新建会话" : null),
  };
  const toggleBtn = {
    tagName: "BUTTON",
    className: "hHd-Xa_iconButton hHd-Xa_toggle",
    getAttribute: (attr) => (attr === "aria-label" ? "收起侧边栏" : null),
    click: () => { clickCalls++; },
    dispatchEvent: () => { dispatchCalls++; },
  };

  const mockSidebar = {
    matches: () => false,
    classList: { contains: () => false },
    getBoundingClientRect: () => ({ width: 280 }),
    querySelector: (selector) => {
      if (selector.includes("打开")) return null;
      if (selector.includes("collapsed")) return null;
      if (selector.includes("收起")) return toggleBtn;
      if (selector.includes("brand")) return brandBtn;
      return null;
    },
    querySelectorAll: (selector) => {
      if (selector.includes("logoRow") || selector.includes("toggle")) {
        return [brandBtn, toggleBtn];
      }
      return [];
    },
  };

  const mockDoc = {
    querySelector: (sel) => (sel === '[data-slot="sidebar"]' ? mockSidebar : null),
  };

  const evalFn = new Function("document", `
    ${fnDefs}
    return { isSidebarExpanded, getSidebarCollapseBtn, collapseSidebarIfOpen };
  `);

  const helpers = evalFn(mockDoc);
  assert.equal(helpers.isSidebarExpanded(), true, "sidebar detected as expanded");
  const foundBtn = helpers.getSidebarCollapseBtn();
  assert.equal(foundBtn, toggleBtn, "found toggleBtn instead of brandBtn");

  // Test single click
  helpers.collapseSidebarIfOpen(false);
  assert.equal(clickCalls, 1, "toggleBtn.click() was called exactly once");
  assert.equal(dispatchCalls, 0, "dispatchEvent was NOT called when click() succeeded (no double click!)");
});

test("fluid spring transition animations and zero-jank rules for expand and collapse", async () => {
  const fs = await import("node:fs");
  const clientContent = fs.readFileSync(new URL("../client.js", import.meta.url), "utf8");

  // Verify Apple/Linear fluid spring variables.
  // 2026-09-26：340/240ms → 240/180ms。这段过渡是 grid-template-columns 的逐帧重排
  // （整个 app 网格 + 满屏模糊壁纸一起参与），时长越长掉的帧越多；缩短后视觉几乎无差。
  assert.ok(clientContent.includes("--sc-sb-expand-dur: 240ms"), "expand duration defined as 240ms");
  assert.ok(clientContent.includes("--sc-sb-expand-ease: cubic-bezier(0.16, 1, 0.3, 1)"), "expand ease defined with Apple fluid spring curve");
  assert.ok(clientContent.includes("--sc-sb-collapse-dur: 180ms"), "collapse duration defined as 180ms");
  assert.ok(clientContent.includes("--sc-sb-collapse-ease: cubic-bezier(0.32, 0.72, 0, 1)"), "collapse ease defined with crisp spring curve");

  // Verify AppFrame grid transition synchronization
  assert.ok(clientContent.includes(".pI_x6G_frame"), "AppFrame grid transition rule exists");
  assert.ok(clientContent.includes("[data-sidebar-collapsed]"), "data-sidebar-collapsed synchronized transition exists");
  // 2026-09-26：曾把 `will-change: grid-template-columns` 当"自欺"删掉，随即出现
  // "会话界面上下滚动严重掉帧"。该属性虽然不能合成网格列，但它会让 AppFrame 自带
  // 层/堆叠上下文——删掉后整个应用框的滚动合成路径改变。此类"看起来没用"的提示
  // 不要顺手删：它与滚动合成是耦合的。断言它必须存在，防止再次被当垃圾清掉。
  assert.ok(clientContent.includes("will-change: grid-template-columns"), "the AppFrame will-change hint stays (scroll compositing depends on it)");

  // Verify GPU containment and layer promotion to prevent reflow jank
  assert.ok(clientContent.includes("contain: layout paint"), "sidebar GPU containment layout paint enabled");
  assert.ok(clientContent.includes("width:256px !important"), "sc-root keeps a fixed width during the transition");
  assert.ok(clientContent.includes("contain:layout style"), "sc-root containment layout style enabled");

  // 折叠窗口期的内容裁剪（用户报的"文字显示在小鲸鱼那个位置"）：
  // 面板恒为 256px 而外层收到 44px 且 overflow:hidden，若不立刻摘掉内容层，
  // 文字会被裁成一条 44px 的竖条挂在小鲸鱼处。
  assert.ok(
    clientContent.includes('[data-slot="sidebar"] [class*="collapsed"] .sc-root > *'),
    "collapsed state hides the panel's content layer (no 44px text sliver next to the orb)",
  );
  assert.ok(
    /\.sc-root > \*\{visibility:visible;transition:visibility 0s linear 200ms;\}/.test(clientContent),
    "expanding reveals the content layer only after the panel is wide enough",
  );
});

test("settings dialog containing block rules unset contain, will-change, and raise z-index", async () => {
  const fs = await import("node:fs");
  const clientContent = fs.readFileSync(new URL("../client.js", import.meta.url), "utf8");

  assert.ok(clientContent.includes("html.sc-settings-open"), "sc-settings-open class supported");
  assert.ok(clientContent.includes("contain: none !important"), "contain is explicitly unset when dialog is open");
  assert.ok(clientContent.includes("will-change: auto !important"), "will-change is explicitly unset when dialog is open");
  assert.ok(clientContent.includes("z-index: 10000 !important"), "sidebar and overlay raised to top z-index when dialog is open");
});

test("page-level shell.overlay layer still outranks the raised sidebar dialog layer", async () => {
  const fs = await import("node:fs");
  const clientContent = fs.readFileSync(new URL("../client.js", import.meta.url), "utf8");

  // 官方设置弹窗只是把侧栏抬到 10000；插件自己的整页弹窗（shell.overlay 宿主）
  // 必须仍然在其之上，否则"先开设置、再从侧栏打开插件弹窗"时会被侧栏压住。
  assert.ok(clientContent.includes("z-index: 10001 !important"), "shell.overlay layer outranks the 10000 sidebar dialog layer");
  assert.ok(!clientContent.includes("z-index: 2000 !important"), "no layer left behind at the old 2000 level");
});

test("settings-open detection follows the visibility convention, not mere DOM presence", async () => {
  const fs = await import("node:fs");
  const clientContent = fs.readFileSync(new URL("../client.js", import.meta.url), "utf8");

  const idx = clientContent.indexOf("const settingsOpen =");
  assert.ok(idx > 0, "settingsOpen detection exists");
  const snippet = clientContent.slice(idx, idx + 600);
  assert.ok(snippet.includes("offsetWidth > 0"), "hidden/mounted-but-invisible panels must not count as open");
  assert.ok(snippet.includes('aria-hidden'), "aria-hidden panels must be skipped");
});

// ---------------------------------------------------------------------------
// 0.1.7 会话导航搬迁回归守卫（2026-09-28）
//
// 内核 0.1.7 把客户端会话选择从 `ctx.sessions` 搬到 `ctx.uiWorkspace`：
//   · ClientSessions 删掉 open()/clear()/openSubagent()/setSubagentCatalogOpen()/
//     refreshSubagents()，改为 retain()/using()/retainInfo() 的 retention 模型；
//   · 导航权归 uiWorkspace.openSession(target)（揭示）与 startSession(wsId)（等价 clear）。
// 症状是「侧栏点会话行没反应、当前行不高亮」，而且**不会**报成加载失败 —— 所以必须有
// 静态守卫盯着这两个名字，否则下次内核再动这块又是一次静默回归。
//
// 只扫**代码**：本项目每个片段都缩进两/三层，行注释一律是「整行 //」，所以丢掉
// 以 `//` 开头的行即可，不会碰到字符串里的 URL。这样注释里说明历史 API 是允许的，
// 真正的调用才会失败。
// ---------------------------------------------------------------------------

/** 去注释后的客户端片段拼接（用于「不得再调用」这类守卫）。 */
async function codeOnlySources() {
  const fs = await import("node:fs");
  const dir = new URL("../src/client/", import.meta.url);
  const files = fs.readdirSync(dir).filter((name) => name.endsWith(".js") && !name.startsWith("_"));
  return files
    .map((name) => fs.readFileSync(new URL(name, dir), "utf8"))
    .join("\n")
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("//"))
    .join("\n");
}

test("no removed 0.1.7 client session API is called", async () => {
  const code = await codeOnlySources();

  // 只认真正的调用点（服务访问 + 左括号）。`ctx.sessions.scope()` 仍属合法 API，
  // 所以逐个方法点名，不做宽泛匹配。
  const removedCalls = [
    { what: "ctx.sessions.open", pattern: /ctx\.sessions\.open\s*\(/ },
    { what: "ctx.sessions.clear", pattern: /ctx\.sessions\.clear\s*\(/ },
    { what: "ctx.sessions.openSubagent", pattern: /ctx\.sessions\.openSubagent\s*\(/ },
    { what: "sessions.openSubagent", pattern: /sessions\.openSubagent\s*\(/ },
    { what: "sessions.setSubagentCatalogOpen", pattern: /sessions\.setSubagentCatalogOpen\s*\(/ },
    { what: "sessions.refreshSubagents", pattern: /sessions\.refreshSubagents\s*\(/ },
    { what: "ctxSessions.open", pattern: /ctxSessions\.open\s*\(/ },
    { what: "ctxSessions.clear", pattern: /ctxSessions\.clear\s*\(/ },
  ];
  for (const { what, pattern } of removedCalls) {
    assert.ok(!pattern.test(code), `removed 0.1.7 API must not be called: ${what}`);
  }
  // 仍然合法的 API 必须还在用（防止"顺手把整块删了"式假修复）。
  assert.ok(/ctx\.sessions\.scope\s*\(/.test(code), "ctx.sessions.scope() is still a valid API");
  assert.ok(/ctxSessions\.fork\s*\(/.test(code), "ctxSessions.fork() is still a valid API");
});

test("session navigation goes through ctx.uiWorkspace (0.1.7)", async () => {
  const code = await codeOnlySources();

  assert.ok(/"uiWorkspace"/.test(code), "uiWorkspace is declared in inject");
  assert.ok(/ctx\.uiWorkspace\.openSession\s*\(/.test(code), "row click reveals via uiWorkspace.openSession");
  assert.ok(/ctxUiWorkspace\?\.openSession\?\.\(/.test(code), "fork reveals the child via uiWorkspace.openSession");
  assert.ok(/ctx\.uiWorkspace\?\.startSession\?\.\(\)/.test(code), "restore-session=off clears via uiWorkspace.startSession");
});

test("sidebar re-exposes the global panel entry swallowed by the single-slot shadow", async () => {
  const code = await codeOnlySources();

  // dsh-my 用 priority:-1 占死单槽 sidebar.workspaces，官方侧栏整棵不渲染，
  // 于是 sidebar.panellist 那排入口（插件市场 / 定时任务）一起消失。这里把它接回来。
  assert.ok(code.includes('"sidebar.panellist"'), "panel list slot is read");
  assert.ok(code.includes("entriesOfSlot"), "entries are read through entriesOfSlot");
  assert.ok(/ctxLayout\?\.selectPanel\?\.\(/.test(code), "clicking a panel goes through ctx.layout.selectPanel");
  assert.ok(code.includes("sc-panel-btn"), "panel row markup is rendered");
  assert.ok(
    /PANEL_ALLOW\s*=\s*new Set\(\["plugins"\]\)/.test(code),
    "only the plugin marketplace is allowed (schedules intentionally not exposed)",
  );
});

test("uiWorkspace is a declared dependency but layout stays an optional probe", async () => {
  const fs = await import("node:fs");
  const source = fs.readFileSync(new URL("../src/client/20-core.js", import.meta.url), "utf8");
  const entry = fs.readFileSync(new URL("../src/client/46-app-entry.js", import.meta.url), "utf8");

  // uiWorkspace 是导航硬需求 → 进 inject（缺失就该让插件不加载，而不是静默无导航）。
  assert.ok(/const inject = \[[^\]]*"uiWorkspace"[^\]]*\]/.test(source), "uiWorkspace is injected");
  // layout 只是面板入口的增强项 → 非严格 ctx.get，避免为用不到的服务留硬门禁。
  assert.ok(entry.includes('ctx.get?.("layout", false)'), "layout is probed with a non-strict ctx.get");
});

test("session search is wired to the kernel contract, not re-invented", async () => {
  const code = await codeOnlySources();

  // 内核能力：ctx.sessions.search(query, signal) → RemoteResult（ok/value|error）。
  assert.ok(/ctxSessions\.search\s*\(/.test(code), "search goes through ctx.sessions.search");
  // 被取代的请求必须取消（官方同样用 AbortController）。
  assert.ok(code.includes("AbortController"), "a superseded search is aborted");
  assert.ok(/SEARCH_DEBOUNCE_MS\s*=\s*250/.test(code), "the official 250ms debounce is preserved");
  // 0.1.7 的 RemoteResult 语义：ok !== true 即错误，error.code 在 result.error 上。
  assert.ok(/ok\s*!==\s*true/.test(code), "RemoteResult ok flag is checked");
});

// ---------------------------------------------------------------------------
// 右侧「轮次导航」轨道（那排 2px 短横）不得被本插件隐藏（2026-09-28）
//
// 该轨道由内核 dsh-client-ui-chat 的 TurnNavigator 渲染：
//   <div slot><nav aria-label="轮次导航"><div scroller><div marks><button data-index …>
// 类名来自 CSS Module、**带哈希前缀**（0.1.7 = `eGxaPq_*`），模块名不会出现在类名里。
// 因此 `[class*="turnNavigator"]` 是死选择器 —— 曾经的保护等于没保护。这两条测试
// 把「真实锚点」和「绝不能出现的隐藏规则」都钉住。
// ---------------------------------------------------------------------------
test("session search UI renders when opened (0.1.7 re-exposure)", () => {
  const html = renderToStaticMarkup(React.createElement(component, { ...props, searchOpen: true }));
  assert.ok(html.includes("sc-search-row"), "search row renders");
  assert.ok(html.includes("sc-search-input"), "search input renders");
  assert.ok(html.includes("searchPlaceholder"), "placeholder comes from the locale dictionary");
  assert.ok(html.includes("aria-label=\"searchSessions\""), "input is labelled for screen readers");
});

test("session search is closed by default (no stray input in the normal list)", () => {
  const html = renderToStaticMarkup(React.createElement(component, props));
  assert.ok(!html.includes("sc-search-input"), "no search input until the user asks for it");
  assert.ok(html.includes("sc-header"), "normal header still renders");
});

test("turn rail protection targets a selector that actually matches", async () => {  const code = await codeOnlySources();

  // 真实锚点必须在保护规则里：组件根 nav 与刻度 button 的稳定属性。
  assert.ok(
    /\[class\*="eGxaPq_\"\]\s*nav/.test(code) || code.includes('[class*="eGxaPq_"] nav'),
    'the rail is protected via its real hashed component root ([class*="eGxaPq_"] nav)',
  );
  assert.ok(
    code.includes("nav > button[data-index][aria-current]"),
    "the active mark is protected via its stable attributes",
  );
  // 说明性：保留历史选择器可以，但注释里必须写明它匹配不到，避免下一个人误以为有保护。
  assert.ok(
    code.includes("turnNavigator"),
    "the legacy selector stays documented next to the working one",
  );
});

// ---------------------------------------------------------------------------
// 侧栏折叠判定不得被插件自己的类名误伤（2026-09-28 实锤回归）
//
// 折叠判定用的是 `[data-slot="sidebar"]:has([class*="collapsed"])` 与
// `... [class*="collapsed"] .sc-root`，**:has() 是后代任意深度匹配**。第一版给面板
// 入口写的类名是 `.sc-panels.sc-collapsed` —— 这个元素自己就让整条侧栏被判定为
// "已折叠"：`.sc-root` 被 opacity:0 + pointer-events:none、子元素 visibility:hidden，
// 且 `isSidebarExpanded()` 返回 false 后 `ensureBootLayout()` / `collapseSidebarIfOpen()`
// 再也不会去展开它。表现：「小鲸鱼位置显示错乱、点开不出会话列表」。
//
// 这条守卫扫描本插件声明的所有 sc-* 类名（样式表里的选择器 + JS 里的 className 字面量），
// 只要有人再起一个含 "collapsed" 子串的名字就直接失败。
// ---------------------------------------------------------------------------
test("no plugin class name contains the substring 'collapsed'", async () => {
  const fs = await import("node:fs");
  /** 去掉行注释与块注释：注释里提到历史类名是允许的，只有真正声明的类名才算犯规。 */
  const stripComments = (text) => text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("//"))
    .join("\n");

  const css = stripComments(fs.readFileSync(new URL("../src/client/30-styles.js", import.meta.url), "utf8"));
  const jsFiles = fs.readdirSync(new URL("../src/client/", import.meta.url))
    .filter((name) => name.endsWith(".js") && !name.startsWith("_"));
  const js = stripComments(jsFiles
    .map((name) => fs.readFileSync(new URL(`../src/client/${name}`, import.meta.url), "utf8"))
    .join("\n"));

  const names = new Set();
  // 样式表里的 `.sc-xxx`
  for (const m of css.matchAll(/\.(sc-[A-Za-z0-9_-]+)/g)) names.add(m[1]);
  // JS 里的类名字面量片段（"sc-x"、"sc-x sc-y" 里的每个单词）
  for (const m of js.matchAll(/["'`]([^"'`]*\bsc-[A-Za-z0-9_-]+[^"'`]*)["'`]/g)) {
    for (const word of m[1].split(/\s+/)) {
      if (/^sc-[A-Za-z0-9_-]+$/.test(word)) names.add(word);
    }
  }

  assert.ok(names.size > 10, `the scan found plugin class names (${names.size})`);
  const offenders = [...names].filter((name) => /collapsed/.test(name));
  assert.deepEqual(
    offenders,
    [],
    `these class names match [class*="collapsed"] and would make the sidebar self-collapse: ${offenders.join(", ")}`,
  );
});

test("no rule in the client stylesheet can hide the turn rail", async () => {  const fs = await import("node:fs");
  const css = fs.readFileSync(new URL("../src/client/30-styles.js", import.meta.url), "utf8");

  // 找出所有 opacity:0 / visibility:hidden / display:none 规则的**选择器**，
  // 任何一条能命中轨道（nav 或其刻度 button）都算回归。
  const railing = [/turnNavigator/, /eGxaPq_/, /nav\s*>/, /data-index/, /aria-current/, /\bnav\b/];
  const rules = css.split("}");
  let checkedSelectors = 0;
  for (const rule of rules) {
    const brace = rule.indexOf("{");
    if (brace === -1) continue;
    const selector = rule.slice(0, brace);
    const body = rule.slice(brace);
    const hides = /opacity:\s*0(?!\.)/.test(body) || /visibility:\s*hidden/.test(body) || /display:\s*none/.test(body);
    if (!hides) continue;
    checkedSelectors += 1;
    for (const pattern of railing) {
      assert.ok(
        !pattern.test(selector),
        `a hiding rule targets the turn rail: ${selector.trim().slice(0, 120)}`,
      );
    }
  }
  assert.ok(checkedSelectors > 0, "the scan actually found hiding rules to check");
});

// ---------------------------------------------------------------------------
// 全局面板在壁纸下的可读性底座（用户报「插件界面没有遮罩、看不清字」）
//
// 壁纸模式把 centerCol / 主列刷成全透明，会话列自己有玻璃卡，但插件市场这类
// 全局面板是别的插件渲染的、没有这一层；而它的文字用 --dsw-alias-label-primary，
// 壁纸浅色模式又把这个令牌重绘成近黑 → 深色壁纸 + 近黑文字 = 看不清。
// 修法是给非会话的主列内容补一层 ::before 背景（纯叠加，不改面板自身的
// background/color，所以最坏也只是多一层底，不可能藏内容）。
// 这两条测试保证：修法在（::before 形态）+ 会话视图绝不被这层底盖住。
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// 30-styles.js 的 CSS 是**模板字面量**：注释里出现反引号会提前终结字符串，
// 生成语法坏掉却"构建成功"的产物。这个坑 2026-09-28 一天内踩了三次（每次都被
// 构建期语法闸拦下，但那是最后一道防线）。这里提前在测试里拦住。
// ---------------------------------------------------------------------------
test("the CSS template literal contains no stray backticks", async () => {
  const fs = await import("node:fs");
  const src = fs.readFileSync(new URL("../src/client/30-styles.js", import.meta.url), "utf8");

  const start = src.indexOf("const CSS = `");
  assert.ok(start > 0, "the CSS template literal exists");
  const end = src.indexOf("\n`;", start);
  assert.ok(end > start, "the CSS template literal is properly terminated");
  const body = src.slice(start + "const CSS = `".length, end);

  assert.equal(
    (body.match(/`/g) || []).length,
    0,
    "no backtick may appear inside the CSS template literal (it would terminate the string early)",
  );
  assert.equal(
    /\/\*[\s\S]*?`[\s\S]*?\*\//.exec(body),
    null,
    "no backtick inside a CSS block comment",
  );
});

// ---------------------------------------------------------------------------
// 折叠轨的小鲸鱼不得被放大或单独做位移动画（用户两次报"小鲸鱼显示错误"）
// ---------------------------------------------------------------------------
test("the collapsed-rail whale glyph is not scaled or clipped", async () => {
  const fs = await import("node:fs");
  const css = fs.readFileSync(new URL("../src/client/30-styles.js", import.meta.url), "utf8");

  // railMark 不再放大。
  const railMarkBlock = /\[class\*="railMark"\]\{([^}]*)\}/.exec(css);
  assert.ok(railMarkBlock, "the railMark rule exists");
  assert.ok(
    !/scale\(/.test(railMarkBlock[1]),
    "the rail glyph must not be scaled (it overflowed the 44px whale card)",
  );
  assert.ok(/transform: none !important/.test(railMarkBlock[1]), "the rail glyph transform is neutralised");

  // rail 的 svg 不再单独做位移动画，并被夹在卡片内。
  const svgBlock = /\[class\*="railMark"\] svg,[\s\S]{0,300}?\{([^}]*)\}/.exec(css);
  assert.ok(svgBlock, "the rail svg rule exists");
  assert.ok(/animation: none !important/.test(svgBlock[1]), "the glyph does not animate on its own (that clipped it)");
  assert.ok(/max-height: 100% !important/.test(svgBlock[1]), "the glyph is clamped to the card");
  assert.ok(/display: block !important/.test(svgBlock[1]), "the glyph is a block box, so centring is deterministic");
});

test("non-conversation main panels get a wall-paper readability backdrop", async () => {
  const fs = await import("node:fs");
  const css = fs.readFileSync(new URL("../src/client/30-styles.js", import.meta.url), "utf8");

  // 定位那条给非会话主列补底的规则块。
  const idx = css.indexOf("非会话主列内容");
  assert.ok(idx > 0, "the readability-backdrop block exists");
  const block = css.slice(idx, idx + 1800);

  assert.ok(block.includes("::before"), "the backdrop is a ::before layer (additive, cannot hide content)");
  assert.ok(block.includes("pointer-events: none"), "the backdrop never swallows clicks");
  assert.ok(block.includes("--sc-content-glass"), "it reuses the same glass variable as the conversation column");
  // 两种主题都要有底。
  assert.ok(block.includes("#fafbfd"), "light-theme backdrop present");
  assert.ok(block.includes("#161820"), "dark-theme backdrop present");
  // 关键：作用域必须只落在主列面板那一个元素上，并且把会话排除掉。
  assert.ok(
    block.includes('[data-slot="main"]:not(:has([data-slot*="conversation"]))'),
    "the backdrop is scoped to the main panel and excludes the conversation",
  );
  // 回归守卫：绝不能再写回「整个中间列」那种过宽作用域（用户报"遮罩加错位置"）。
  assert.ok(
    !/\[class\*="centerCol"\]\s*>/.test(block),
    "the backdrop must NOT target centerCol's children (that covered the whole middle column)",
  );
});

test("the conversation view is recognised as conversation by the backdrop selector", async () => {
  const fs = await import("node:fs");
  const css = fs.readFileSync(new URL("../src/client/30-styles.js", import.meta.url), "utf8");

  // 排除依据是「子树里存在 [data-slot*="conversation"]」。内核把主列的 keyed
  // 入口 key 定为 "conversation"，其内部 renderSlot("conversation.session") 会
  // 渲染出 [data-slot="conversation.session"]，是**:后代**而非直接子元素 ——
  // 所以必须用后代匹配（:has() 默认就是）。
  assert.ok(css.includes('[data-slot*="conversation"]'), "the conversation marker is used for exclusion");
  assert.ok(
    /\[data-slot="main"\]:not\(:has\(\[data-slot\*="conversation"\]\)\)/.test(css),
    "the exclusion uses a descendant match (:has), not a direct-child test",
  );
});

// ---------------------------------------------------------------------------
// 侧栏头部不得折行成"两个功能挤在一个按钮里"（2026-09-28 用户报；截图里
// 「会话 搜索 图壁 纸 标签 管理 多 选」被拆成竖排断字）
//
// 侧栏内容区只有 240px，4 个带字按钮放不下。修法：动作行 nowrap + 不收缩，
// 并用容器查询在窄于 250px 时收成纯图标（图标是独立 <span>，标签是
// .sc-btn-label，可整块隐藏）。
// ---------------------------------------------------------------------------
test("sidebar header actions never wrap into stacked characters", async () => {
  const fs = await import("node:fs");
  const css = fs.readFileSync(new URL("../src/client/30-styles.js", import.meta.url), "utf8");
  const js = fs.readFileSync(new URL("../src/client/45-app-sidebar.js", import.meta.url), "utf8");

  assert.ok(/\.sc-header-actions\{[^}]*flex-wrap:nowrap/.test(css), "header actions never wrap");
  assert.ok(/\.sc-btn\{[^}]*white-space:nowrap/.test(css), "button labels never wrap");
  assert.ok(/\.sc-btn\{[^}]*flex:0 0 auto/.test(css), "buttons do not shrink into each other");
  // 侧栏内容盒恒为 240px，而 4 个中文带字按钮 ≈270px → 必须常态收成图标。
  // （不能只靠容器查询：.sc-root 的容器内容盒是固定 240px，阈值永远不触发。）
  assert.ok(
    /\.sc-header \.sc-btn-label\{display:none;\}/.test(css),
    "the header collapses button labels to icons so nothing can wrap",
  );
  assert.ok(js.includes('className: "sc-btn-label"'), "each button carries a hideable label span");
  assert.ok(js.includes('"aria-label": L("searchSessions")'), "the icon-only state keeps an accessible name");
  // 每个 header 按钮都要有 title，图标态才可发现。
  const headerBlock = js.slice(js.indexOf("sidebar.workspaces") === -1 ? 0 : js.indexOf("h(\"div\", { className: \"sc-header\" }"));
  const titles = (headerBlock.match(/title: L\(/g) || []).length;
  assert.ok(titles >= 4, `every header button has a native tooltip title (found ${titles})`);
});




