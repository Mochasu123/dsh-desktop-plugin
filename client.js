// ⚠ 生成物 —— 不要手工编辑。
// 源码：src/client/*.js（顺序见 src/client/manifest.json），改完运行：node scripts/build-client.mjs
// 校验：node scripts/build-client.mjs --check（scripts/verify.mjs 已包含这一步）

// dsh-session-center client half.
//
// Replaces the official sidebar session browser (sidebar.workspaces single
// slot, registered at a lower priority so it shadows the shipped UI):
//   - time-descending session list (newest first), no workspace grouping
//   - pinned section on top
//   - running spinner, tag pills, relative time
//   - hover tooltip: last activity + input/output/cache tokens
//   - row menu: pin, tags, rename, fork, backup, diagnose/repair, delete
//   - batch mode: multi-select → tag / pin / delete
//   - tag manager overlay (create/edit/delete, preset palette, quick apply)
//   - trash section (restore / purge)
// Server APIs live under /api/session-center.* (see lib/index.js; mounted on the
// kernel Connection seam, so host/origin fencing + browser auth are inherited).
//
// NOTE: the slot renderer passes `t` as a translation FUNCTION (t("key")),
// not a dictionary object — keys resolve against the locale registered for
// this bundle's NS.

window.__ModuleLoader__.load({
	id: "dsh-my",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");

		const NS = "sessionCenter";
		const zh = {
			sessions: "会话",
			pinned: "置顶",
			trash: "回收站",
			manageTags: "标签管理",
			batch: "多选",
			batchDone: "完成",
			pin: "置顶",
			unpin: "取消置顶",
			tags: "标签管理",
			rename: "重命名",
			fork: "复制会话",
			backup: "备份会话",
			diagnose: "日志健康检查",
			repair: "一键修复",
			delete: "删除",
			restore: "恢复",
			purge: "彻底删除",
			purgeAll: "清空回收站",
			applyTags: "打标签",
			selectAll: "全选",
			newTag: "新建标签",
			tagName: "标签名",
			tagNamePlaceholder: "输入标签名…",
			save: "保存",
			cancel: "取消",
			confirmOk: "确定",
			close: "关闭",
			confirmDelete: "确定删除此会话？文件将移入回收站，可在回收站中恢复。",
			deleteFailedCount: "条删除失败",
			confirmForceDelete: "此会话正在运行。强制删除将立即终止它，确定？",
			confirmPurge: "彻底删除后无法恢复，确定？",
			confirmPurgeAll: "确定清空回收站？所有内容将永久删除。",
			confirmTagDelete: "删除标签将从所有会话中移除，确定？",
			lastActive: "最后活动",
			input: "输入",
			output: "输出",
			cache: "缓存",
			healthy: "会话健康",
			issuesFound: "发现问题",
			repairDone: "修复完成",
			repairNone: "无需修复",
			backupDone: "已备份",
			restored: "已恢复",
			deleted: "已移入回收站",
			applied: "已应用",
			pinnedToast: "已置顶",
			unpinnedToast: "已取消置顶",
			running: "运行中",
			error: "出错了",
			empty: "暂无会话",
			emptyTrash: "回收站是空的",
			noSelection: "先选择会话",
			quickApply: "快速覆盖：标签将直接覆盖所选会话的现有标签",
			applyingTo: "应用到",
			sessionsCount: "个会话",
			events: "事件",
			line: "行",
			expected: "期望",
			got: "实际",
			kept: "保留",
			dropped: "丢弃",
			lastEvent: "最后事件",
			originalAt: "原件保存在",
			pluginsPanel: "插件市场",
			// 会话搜索（0.1.7 接回：官方搜索框随官方侧栏被 shadow 掉）
			search: "搜索",
			searchSessions: "搜索会话",
			searchPlaceholder: "搜索会话标题与消息内容…",
			searchResults: "搜索结果",
			searching: "搜索中",
			searchNoHits: "没有匹配的会话",
			searchFailed: "搜索失败",
			searchUnavailable: "当前宿主不支持会话搜索",
			restart: "重启",
			restartTitle: "重启 Harness",
			restartConfirm: "重启会短暂断开页面连接，重启后回到主页面（新对话）。确定重启？",
			restarting: "正在重启…",
			welcomeBack: "欢迎回来",
			welcomeSub: "重启完成 · 一切就绪",
			noTags: "暂无标签，输入名称后点击「新建标签」",
			queueCount: "排队",
			queueEdit: "编辑",
			queueSave: "保存",
			queueCancel: "取消",
			queueRemove: "删除",
			queueRemoveFailed: "删除失败",
			queueEditFailed: "编辑失败",
			queueSendFailed: "发送失败",
			send: "发送",
			// 统计行 / 相对时间（带 {占位符}，由 makeTF 插值）
			statCost: "费用 {v}",
			statBalance: "余额 {v}",
			statTurnsSteps: "{turns} 轮 · {steps} 步",
			statFirstToken: "首 token 平均 {v}",
			statCacheHit: "缓存命中 {hit}%",
			statTokens: "输入 {input} tok · 输出 {output} tok",
			relNow: "现在",
			relJustNow: "刚刚",
			relMinutes: "{n} 分钟前",
			relHours: "{n} 小时前",
			relDays: "{n} 天前",
			restoreTitle: "刷新后回到上次会话",
			restoreDesc: "刷新页面或重启后自动重开最近进行中的会话；关闭则回到新对话（下次刷新/重启时生效）。",
			restoreOn: "开",
			restoreOff: "关",
			wallpaper: "壁纸",
			wallpaperTitle: "壁纸（沉浸式背景）",
			wallpaperDesc: "开启沉浸式毛玻璃背景：自定义图片、遮罩、模糊、缩放与毛玻璃强度。",
			open: "打开",
			sessionLog: "Session log",
			backToConversation: "返回会话",
		};
		const en = {
			sessions: "Sessions",
			pinned: "Pinned",
			trash: "Trash",
			manageTags: "Manage tags",
			batch: "Multi-select",
			batchDone: "Done",
			pin: "Pin",
			unpin: "Unpin",
			tags: "Manage tags",
			rename: "Rename",
			fork: "Duplicate",
			backup: "Backup session",
			diagnose: "Log health check",
			repair: "Repair",
			delete: "Delete",
			restore: "Restore",
			purge: "Purge",
			purgeAll: "Empty trash",
			applyTags: "Apply tags",
			selectAll: "Select all",
			newTag: "New tag",
			tagName: "Name",
			tagNamePlaceholder: "Tag name…",
			save: "Save",
			cancel: "Cancel",
			confirmOk: "OK",
			close: "Close",
			confirmDelete: "Delete this session? Files move to the trash and can be restored.",
			deleteFailedCount: "failed to delete",
			confirmPurge: "This cannot be undone. Purge?",
			confirmForceDelete: "This session is running. Force-delete will terminate it immediately — proceed?",
			confirmPurgeAll: "Empty the trash permanently?",
			confirmTagDelete: "Deleting the tag removes it from all sessions. Continue?",
			lastActive: "Last active",
			input: "Input",
			output: "Output",
			cache: "Cache",
			healthy: "Session healthy",
			issuesFound: "Issues found",
			repairDone: "Repaired",
			repairNone: "Nothing to repair",
			backupDone: "Backed up",
			restored: "Restored",
			deleted: "Moved to trash",
			applied: "Applied",
			pinnedToast: "Pinned",
			unpinnedToast: "Unpinned",
			running: "Running",
			error: "Error",
			empty: "No sessions yet",
			emptyTrash: "Trash is empty",
			noSelection: "Select sessions first",
			quickApply: "Quick apply: tags replace the selected sessions' current tags",
			applyingTo: "Applying to",
			sessionsCount: "sessions",
			events: "events",
			line: "line",
			expected: "expected",
			got: "got",
			kept: "kept",
			dropped: "dropped",
			lastEvent: "last event",
			originalAt: "original kept at",
			pluginsPanel: "Plugin marketplace",
			// Session search (re-exposed on 0.1.7)
			search: "Search",
			searchSessions: "Search sessions",
			searchPlaceholder: "Search session titles and message content…",
			searchResults: "Results",
			searching: "searching",
			searchNoHits: "No matching session",
			searchFailed: "Search failed",
			searchUnavailable: "This host does not support session search",
			restart: "Restart",
			restartTitle: "Restart Harness",
			restartConfirm: "The page will briefly disconnect and return to the home view (new session) after restart. Restart now?",
			restarting: "Restarting…",
			welcomeBack: "Welcome back",
			welcomeSub: "Restart complete · All ready",
			noTags: "No tags yet — type a name and hit \"New tag\"",
			queueCount: "Queue",
			queueEdit: "Edit",
			queueSave: "Save",
			queueCancel: "Cancel",
			queueRemove: "Remove",
			queueRemoveFailed: "Remove failed",
			queueEditFailed: "Edit failed",
			queueSendFailed: "Send failed",
			send: "Send",
			// Stats line / relative time (placeholders filled by makeTF)
			statCost: "Cost {v}",
			statBalance: "Balance {v}",
			statTurnsSteps: "{turns} turns · {steps} steps",
			statFirstToken: "avg first token {v}",
			statCacheHit: "cache hit {hit}%",
			statTokens: "in {input} tok · out {output} tok",
			relNow: "now",
			relJustNow: "just now",
			relMinutes: "{n} min ago",
			relHours: "{n} h ago",
			relDays: "{n} d ago",
			restoreTitle: "Restore last session on refresh",
			restoreDesc: "Reopen the most recent session after a page refresh or restart; off returns to the new-chat screen (takes effect next refresh/restart).",
			restoreOn: "On",
			restoreOff: "Off",
			wallpaper: "Wallpaper",
			wallpaperTitle: "Wallpaper (immersive background)",
			wallpaperDesc: "Enable immersive frosted-glass background: custom image, mask, blur, zoom and glass strength.",
			open: "Open",
			sessionLog: "Session log",
			backToConversation: "Back to Chat",
		};

		// 0.1.7（2026-09-28 升级）：客户端**会话选择**从 `ctx.sessions` 搬到
		// `ctx.uiWorkspace`。实测对比 0.1.5-rc.1 → 0.1.7-rc.2 两份内核源码：
		//   · `ClientSessions`（dsh-api-session-controller/lib/client.js）删掉了
		//     `open()` / `clear()` / `openSubagent()` / `setSubagentCatalogOpen()` /
		//     `refreshSubagents()`，改成 `retain()` / `using()` / `retainInfo()`
		//     的 retention 模型；
		//   · `selection` 持久化单元与 `list.current` 字段整块搬走，导航权归
		//     `dsh-client-ui-workspace` 的 `uiWorkspace` 服务：
		//     `openSession(target)`（揭示已有会话）/ `startSession(wsId)`（等价旧
		//     `clear()`）/ `archiveSession` / `pinSession` / `forkSession`；
		//   · 旧的 `ctx.sessions.open()` 现在会抛 TypeError —— 表现为「侧栏点会话
		//     行没反应、当前行不高亮」。
		// 因此这里必须自己 inject `uiWorkspace`（不再经 `sidebar` 槽的 injectProps）。
		const inject = ["slots", "sessions", "locale", "uiWorkspace"];

		// ------------------------------------------------------------- api
		//
		// 路由代际过渡兜底（2026-09-26 实测事故后补）：
		// 服务端半包从 `/api-ext/session-center.*` 迁到 Connection seam 的
		// `/api/session-center.*`。宿主进程与浏览器 bundle 的加载时机不同步——只重启
		// 一侧时，新客户端打新路径会命中 SPA 兜底（返回 HTML），表现为每个接口都
		// 报通用失败（**连"重启 Harness"按钮自己都失效**，用户就失去了自救手段）。
		// 判定"路由没命中"而不是"业务失败"的依据：响应体不是 JSON。
		// 401/403 属于认证，不回落（避免把跨站/过期会话的拒绝掩饰成路径问题）。
		const API_PATHS = ["/api/session-center.", "/api-ext/session-center."];

		async function postJson(path, method, body) {
			const res = await fetch(`${path}${method}`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body,
			});
			const text = await res.text().catch(() => "");
			let json = null;
			try { json = JSON.parse(text); } catch { json = null; }
			return { res, json };
		}

		async function call(method, payload) {
			const body = JSON.stringify(payload ?? {});
			let { res, json } = await postJson(API_PATHS[0], method, body);
			if (json === null && res.status !== 401 && res.status !== 403) {
				// 新路径没命中（旧宿主）：回落一次旧路径。命中后本轮会话不再来回试。
				({ res, json } = await postJson(API_PATHS[1], method, body));
			}
			if (!json || json.ok !== true) {
				// 两条路径都没给出 JSON = 服务端半包与客户端 bundle 不是同一代
				// （典型：宿主进程还是迁移前的代码、浏览器已拿到新 bundle）。
				// 这种"通用失败"最误导人，所以直接把处置办法写进错误里。
				const message = json === null
					? `${method}: server/client generation mismatch (no JSON from either route) — 请点界面左下角「重启 Harness」；按钮无效时在新终端执行 pwsh -File dsh-plugin/restart-web.ps1`
					: (json.error?.message ?? `${method} failed (HTTP ${res.status})`);
				const err = new Error(message);
				if (json?.error?.code) err.code = json.error.code;
				throw err;
			}
			return json.value;
		}

		async function fetchSessionList() {
			// 0.1.2 移除了 /api/session.list（APIProxy → Remote 网关，升级卡 A1-01），
			// 旧接口对新内核返回 "not found"（被 callHost 吞成 undefined → 空列表）。
			// 改读宿主注入的 ctx.sessions 快照（ISessions.list：{ids, byId}，与官方
			// 侧栏同源）：先 refresh() 拉一次 Host 权威列表再读快照。
			// 快照行是 service 形状：{id, title?, displayTitle, projectionValues?}——
			// 主键是 id 不是 sessionId，投影值平铺在 projectionValues 上。这里折回
			// toRow 期望的旧条目形状（sessionId + projections.values），否则标题全空、
			// 点击拿不到会话 id；title 只取 host 的耐久标题（缺省走 sessionId 回退）。
			const api = ctxSessions;
			if (!api?.list) return [];
			await api.refresh?.();
			const st = typeof api.list.getSnapshot === "function" ? api.list.getSnapshot() : null;
			if (!st) return [];
			return (st.ids ?? [])
				.map((id) => {
					const row = st.byId?.[id];
					if (!row) return null;
					return {
						...row,
						sessionId: row.id ?? id,
						projections: {
							values: {
								...(row.projectionValues ?? {}),
								...(row.title !== undefined ? { title: row.title } : {}),
							},
						},
					};
				})
				.filter(Boolean);
		}

		// ---------------------------------------------------------- helpers

		const h = (tag, props, ...kids) => react.createElement(tag, props, ...kids);

		/** Localize: t is the renderer-provided function; fall back to our dict. */
		function makeT(t) {
			return (key) => {
				if (typeof t === "function") {
					const v = t(key);
					return v === undefined ? (zh[key] ?? key) : v;
				}
				return (t?.[key] ?? zh[key] ?? key);
			};
		}

		/** 带占位符的本地化：tf("statCost", { v: "¥1.23" })；词典里写 "费用 {v}"。 */
		function makeTF(t) {
			const L = makeT(t);
			return (key, vars) => String(L(key)).replace(/\{(\w+)\}/g, (whole, name) =>
				(vars && Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : whole));
		}

		function fmtNum(n) {
			if (n === null || n === undefined || Number.isNaN(n)) return "—";
			if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
			if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
			if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
			return String(Math.round(n));
		}

		function fmtBytes(n) {
			if (n === null || n === undefined) return "—";
			if (n >= 1e9) return (n / 1e9).toFixed(1) + "GB";
			if (n >= 1e6) return (n / 1e6).toFixed(1) + "MB";
			if (n >= 1e3) return (n / 1e3).toFixed(0) + "KB";
			return n + "B";
		}

		/**
		 * 相对时间。第二个参数是 makeTF() 出来的翻译函数；缺省时用 zh 词典兜底
		 * （纯函数，测试与无 locale 环境都能用）。未来时间不再当成"X 分钟前"。
		 */
		function fmtRelative(ts, tf) {
			if (!ts) return "";
			const L = typeof tf === "function"
				? tf
				: (key, vars) => String(zh[key] ?? key).replace(/\{(\w+)\}/g, (whole, name) =>
					(vars && Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : whole));
			const diff = Date.now() - ts;
			const abs = Math.abs(diff);
			if (abs < 60e3) return diff >= 0 ? L("relJustNow") : L("relNow");
			if (abs < 3600e3) return L("relMinutes", { n: Math.round(abs / 60e3) });
			if (abs < 86400e3) return L("relHours", { n: Math.round(abs / 3600e3) });
			if (abs < 7 * 86400e3) return L("relDays", { n: Math.round(abs / 86400e3) });
			const d = new Date(ts);
			return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
		}

		function fmtStamp(ts) {
			if (!ts) return "";
			const d = new Date(ts);
			return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
		}

		// Session list item → our row model. The real item shape:
		//   { sessionId, updatedAt, running, blank, cwd, agentPreset,
		//     projections: { asOfSeq, values: { title, sessionStats,
		//       tokenUsage, sessionListMetadata: { blank, lastPromptAt }, ... } } }
		// tokenUsage is the totals object DIRECTLY (no .totals wrapper).
		function toRow(item, sessionTags, pins) {
			const pv = item.projections?.values ?? {};
			const usage = pv.tokenUsage?.totals ?? pv.tokenUsage ?? {};
			const meta = pv.sessionListMetadata ?? {};
			const title = typeof pv.title === "string" && pv.title !== "" ? pv.title : item.sessionId;
			return {
				sessionId: item.sessionId,
				title,
				titleSet: typeof pv.title === "string" && pv.title !== "",
				running: item.running === true,
				blank: item.blank === true,
				origin: item.origin,
				agentPreset: item.agentPreset,
				lastActive: item.updatedAt ?? meta.lastPromptAt ?? 0,
				tokens: {
					input: usage.uncachedInputTokens,
					output: usage.outputTokens,
					cache: usage.cacheReadTokens,
				},
				tagIds: sessionTags[item.sessionId] ?? [],
				pinned: pins.includes(item.sessionId),
			};
		}

		// ------------------------------------------------------------ styles

		const CSS = `
.sc-root{position:relative;display:flex;flex-direction:column;height:100%;min-height:0;width:256px !important;min-width:256px !important;max-width:256px !important;box-sizing:border-box !important;padding:0 8px 8px;container-type:inline-size;margin:6px;border-radius:16px;background:color-mix(in srgb, var(--dsw-alias-bg-base, #fdf6e3) 34%, transparent);border:1px solid color-mix(in srgb, var(--dsw-alias-border-l2, rgba(120,130,150,.35)) 55%, transparent);box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 8px 28px rgba(15,20,30,.12);color:var(--dsw-alias-label-primary,#23272e);contain:layout style;transform:translate3d(0, 0, 0);backface-visibility:hidden;opacity:1;transition:opacity var(--sc-sb-expand-dur, 340ms) var(--sc-sb-expand-ease, cubic-bezier(0.16, 1, 0.3, 1)) 50ms, transform var(--sc-sb-expand-dur, 340ms) var(--sc-sb-expand-ease, cubic-bezier(0.16, 1, 0.3, 1)) !important;will-change:opacity, transform;}
.sc-root.sc-hidden,
[class*="frame"][data-sidebar-collapsed] .sc-root,
[data-slot="sidebar"]:has([class*="collapsed"]) .sc-root,
[data-slot="sidebar"] [class*="collapsed"] .sc-root{opacity:0 !important;transform:translate3d(-14px, 0, 0) !important;pointer-events:none !important;transition:opacity 130ms var(--sc-sb-collapse-ease, cubic-bezier(0.32, 0.72, 0, 1)), transform 180ms var(--sc-sb-collapse-ease, cubic-bezier(0.32, 0.72, 0, 1)) !important;}
/* 内容层必须在折叠/展开的"错位窗口"里被立刻摘掉：
   本面板恒为 256px，而外层 [data-slot="sidebar"] 在 240ms 内从 280px 收到 44px 且 overflow:hidden，
   于是仍不透明的文字会被裁成一条 44px 的竖条，正好挂在小鲸鱼那个位置（2026-09-26 用户报的
   "显示有错位、文字显示在那个位置"）。visibility 不参与插值 → 折叠瞬间即生效（只留玻璃卡淡出，
   动画看起来照旧）；展开方向延迟 200ms 再显示，等面板足够宽了内容才出现，同样避免竖条。 */
.sc-root > *{visibility:visible;transition:visibility 0s linear 200ms;}
[data-slot="sidebar"] [class*="collapsed"] .sc-root > *,
[class*="frame"][data-sidebar-collapsed] .sc-root > *{visibility:hidden;transition:visibility 0s linear 0s;}
/* NOTE: .sc-root must NOT get overflow:hidden or backdrop-filter changes would
   clip/misplace the fixed-position menu & tooltip (backdrop-filter and
   container-type make .sc-root the containing block for fixed descendants).
   The glow is clipped by its own wrapper instead. */
.sc-glow-wrap{position:absolute;inset:0;border-radius:14px;overflow:hidden;pointer-events:none;z-index:0;}
.sc-nudge{container-type:normal;-webkit-backdrop-filter:none;backdrop-filter:none;}
.sc-glow{position:absolute;left:0;top:0;width:380px;height:380px;border-radius:50%;background:radial-gradient(circle,rgba(150,180,255,.5) 0%,rgba(150,180,255,.16) 45%,transparent 72%);pointer-events:none;opacity:0;transition:opacity .3s ease,transform .12s ease-out;will-change:transform;}
.sc-list{position:relative;z-index:1;flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:1px;padding-bottom:8px;}
@container (max-width: 200px){
  .sc-row{padding:4px 5px;gap:4px;}
  .sc-row-time{display:none;}
  .sc-tagpill{font-size:10px;padding:1px 6px 1px 4px;}
  .sc-section-label{font-size:10px;padding:4px 6px 2px;}
  .sc-btn{font-size:11px;padding:2px 6px;}
  .sc-row-title{font-size:12px;}
  .sc-header{padding:4px 4px 2px;}
}
@container (max-width: 150px){
  .sc-header-actions .sc-btn{font-size:0;}
  .sc-header-actions .sc-btn::before{content:attr(data-icon);font-size:14px;}
}
.sc-root{display:flex;flex-direction:column;height:100%;min-height:0;padding:0 8px 8px;}
.sc-header{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;padding:6px 6px 4px;}
.sc-header{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:6px;padding:6px 6px 4px;}
.sc-title{font-size:12px;font-weight:600;letter-spacing:.04em;opacity:.72;flex:none;}
button.sc-title,
.sc-title-btn{display:inline-flex;align-items:center;gap:5px;background:none;border:none;color:inherit;font:inherit;font-size:12px;font-weight:600;letter-spacing:.04em;opacity:.78;padding:3px 6px;margin:-3px -6px;border-radius:7px;cursor:pointer;transition:background .15s ease,opacity .15s ease,color .15s ease;user-select:none;}
button.sc-title:hover{opacity:1;background:var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,.14));}
button.sc-title.sc-title-active{opacity:1;color:var(--dsw-alias-accent, #4dabf7);background:var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,.16));}
.sc-title-text{min-width:0;line-height:1;}
.sc-glyph-search{display:inline-block;vertical-align:middle;}
/* 头部动作行：**永不换行**。侧栏内容区只有 240px（256 - 2×8 padding），
   按钮放不下，一换行就变成竖排断字
   （2026-09-28 用户报"两个功能挤在一个按钮里"）。这里做两件事：
     1) nowrap + 不收缩，保证按钮不会互相挤压/叠字；
     2) 侧栏内容区窄于 250px 时自动收成纯图标。 */
.sc-header-actions{display:flex;flex-wrap:nowrap;gap:4px;flex:0 0 auto;justify-content:flex-end;}
.sc-btn{display:inline-flex;align-items:center;justify-content:center;gap:4px;flex:0 0 auto;white-space:nowrap;border:none;background:none;color:inherit;font:inherit;font-size:12px;padding:3px 8px;border-radius:6px;cursor:pointer;opacity:.75;}
.sc-btn:hover{background:var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,.14));opacity:1;}
.sc-btn.danger{color:var(--dsw-alias-danger, #e5484d);}
.sc-btn-icon{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;flex-shrink:0;}
.sc-header .sc-btn-label{display:none;}
.sc-header .sc-btn{padding:3px 7px;}
@container (max-width: 200px){
  .sc-title{display:none;}
}
/* ===== 全局面板入口（0.1.7：plugins 等 sidebar.panellist 图标；见 45-app-sidebar.js） =====
   官方侧栏用的是 hHd-Xa_panelList/hHd-Xa_panelRow，但那是它自己 CSS 模块里的局部类名，
   跨插件不可依赖，所以这里按本插件的玻璃风格重画一份，只依赖 dsw-* 设计令牌。 */
.sc-panels{position:relative;z-index:1;display:flex;flex-direction:column;gap:2px;padding:2px 4px 6px;}
.sc-panel-btn{display:flex;align-items:center;gap:8px;width:100%;box-sizing:border-box;border:none;background:none;color:inherit;font:inherit;font-size:12px;text-align:left;padding:6px 8px;border-radius:9px;cursor:pointer;opacity:.82;transition:background .15s ease,opacity .15s ease;}
.sc-panel-btn:hover{background:var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,.14));opacity:1;}
.sc-panel-btn.sc-panel-active{background:var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,.16));opacity:1;font-weight:600;}
.sc-panel-glyph{flex:none;display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;}
.sc-panel-label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
/* 折叠轨（宽 44px）：只留图标，与官方 panelRow 的折叠形态一致。
   ⚠️ 类名**绝不能含 "collapsed" 子串**：本文件的折叠判定用的是
   [data-slot="sidebar"]:has([class*="collapsed"]) 与
   [data-slot="sidebar"] [class*="collapsed"] .sc-root（见第 4-6 / 640-642 /
   708-717 行），其中 :has() 是**后代任意深度**匹配。
   第一版这里叫 .sc-panels.sc-collapsed → 这一行的元素自己就让整条侧栏被判定为
   "已折叠"：.sc-root 被 opacity:0 + pointer-events:none、子元素 visibility:hidden，
   而 isSidebarExpanded() 也随之返回 false，ensureBootLayout() /
   collapseSidebarIfOpen() 便再也不会去展开它 —— 表现为「小鲸鱼位置显示错乱、
   点开不出会话列表」。所以这里用 sc-rail 这个名字，且今后任何新类名都要避开
   collapsed 子串（client-render 测试里有一条守卫在扫）。 */
.sc-panels.sc-rail{padding:2px 4px 8px;gap:4px;align-items:center;}
.sc-panels.sc-rail .sc-panel-btn{width:36px;height:36px;padding:0;justify-content:center;gap:0;}
.sc-panels.sc-rail .sc-panel-label{display:none;}
/* ===== 官方侧栏导航行（插件市场与壁纸入口并列居中，横向排开） ===== */
[data-slot="sidebar"] [class*="panelList"]{display:flex !important;flex-direction:row !important;align-items:center !important;gap:6px !important;margin:0 2px 8px !important;}
[data-slot="sidebar"] [class*="panelList"] [class*="panelRow"]{flex:1 1 0 !important;min-width:0 !important;width:auto !important;margin:0 !important;padding:7px 10px !important;justify-content:flex-start !important;}
[data-slot="sidebar"] [class*="panelList"] ~ [class*="regionArea"] .sc-panels{display:none !important;}
/* ===== 会话搜索（0.1.7 接回：官方搜索框随官方侧栏被 shadow 掉） ===== */
.sc-search-row{position:relative;z-index:1;display:flex;align-items:center;gap:4px;padding:2px 6px 6px;}
.sc-search-input{flex:1;min-width:0;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.4));background:color-mix(in srgb, var(--dsw-alias-bg-base) 62%, transparent);color:inherit;font:inherit;font-size:12px;padding:6px 9px;border-radius:9px;outline:none;transition:border-color .15s ease,background .15s ease;}
.sc-search-input:focus{border-color:var(--dsw-alias-accent, #4dabf7);background:color-mix(in srgb, var(--dsw-alias-bg-layer-1) 78%, transparent);}
.sc-btn.sc-btn-on{background:var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,.14));opacity:1;}
.sc-search-excerpt{display:block;margin-top:2px;font-size:11px;line-height:1.45;opacity:.62;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.sc-btn:disabled{opacity:.35;cursor:default;}
.sc-section-label{font-size:11px;opacity:.5;padding:6px 8px 2px;letter-spacing:.03em;}
.sc-list{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:1px;padding-bottom:8px;}
.sc-row{position:relative;display:flex;align-items:center;gap:6px;padding:5px 6px;border-radius:10px;cursor:pointer;user-select:none;}
.sc-row:hover{background:rgba(120,140,180,.16);box-shadow:inset 0 1px 0 rgba(255,255,255,.35);}
.sc-row.selected{background:rgba(77,171,247,.22);box-shadow:inset 0 1px 0 rgba(255,255,255,.35);}
/* 当前会话高亮：唯美渐变淡彩叠加（左深右浅的流光蓝紫） + 左侧细亮条，
   与选择态（selected）区分：selected 是操作批量态，current 是正在进行的会话。 */
.sc-row.current{background:linear-gradient(90deg, rgba(99,102,241,.20) 0%, rgba(129,140,248,.14) 45%, rgba(168,85,247,.12) 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.4), inset 0 0 0 1px rgba(129,140,248,.22);}
.sc-row.current::before{content:"";position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:60%;border-radius:0 3px 3px 0;background:linear-gradient(180deg,#6366f1,#a855f7);box-shadow:0 0 8px rgba(129,140,248,.5);}
html.sc-wall-on body[data-ds-dark-theme] .sc-row.current{background:linear-gradient(90deg, rgba(99,102,241,.30) 0%, rgba(129,140,248,.22) 45%, rgba(168,85,247,.20) 100%);}
.sc-row-main{flex:1;min-width:0;}
/* 标题行 = 网格 [标题 1fr | 时间 auto]：时间戳永远垂直居中、右对齐，
   不随标题 2 行换行而漂移；标题改 overflow-wrap:break-word（不再劈开
   英文单词，如 pluspl/us），单行省略优先。 */
.sc-row-line1{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:6px;min-width:0;}
.sc-row-title{min-width:0;font-size:13px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;white-space:normal;overflow-wrap:break-word;word-break:normal;}
.sc-row-time{grid-column:2;justify-self:end;flex-shrink:0;font-size:11px;line-height:1;opacity:.5;font-variant-numeric:tabular-nums;letter-spacing:.02em;}
.sc-row-tags{display:flex;gap:4px;flex-wrap:wrap;margin-top:2px;}
.sc-tagpill{display:inline-flex;align-items:center;gap:4px;font-size:11px;line-height:1;padding:2px 7px 2px 5px;border-radius:999px;max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sc-tagpill .dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
.sc-row-menu{flex-shrink:0;border:none;background:none;color:inherit;font-size:14px;line-height:1;padding:2px 4px;border-radius:6px;cursor:pointer;opacity:.55;visibility:hidden;}
.sc-row:hover .sc-row-menu{visibility:visible;}
.sc-row-menu:hover{opacity:1;background:var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,.14));}
.sc-status{width:10px;height:10px;flex-shrink:0;}
.sc-spinner{border:2px solid rgba(77,171,247,.28);border-top-color:var(--dsw-alias-accent,#4dabf7);border-radius:50%;animation:sc-spin .8s linear infinite;}
@keyframes sc-spin{to{transform:rotate(360deg);}}
.sc-check{-webkit-appearance:none;appearance:none;margin:0;width:16px;height:16px;flex-shrink:0;border-radius:5px;border:1.5px solid var(--dsw-alias-border-l2, rgba(120,130,150,.45));background:color-mix(in srgb, var(--dsw-alias-bg-layer-1, #ffffff) 45%, transparent);box-shadow:inset 0 1px 1px rgba(0,0,0,.04);cursor:pointer;display:inline-grid;place-content:center;position:relative;transition:border-color .15s ease,background .15s ease,box-shadow .15s ease,transform .12s ease;box-sizing:border-box;}
.sc-row:hover .sc-check{border-color:var(--dsw-alias-border-l1, rgba(120,130,150,.7));}
.sc-check:hover{border-color:var(--dsw-alias-accent, #4dabf7);background:color-mix(in srgb, var(--dsw-alias-accent, #4dabf7) 15%, transparent);transform:scale(1.05);}
.sc-check:checked{border-color:var(--dsw-alias-accent, #4dabf7);background:var(--dsw-alias-accent, #4dabf7);box-shadow:0 1px 4px rgba(77,171,247,.45);}
.sc-check:checked::after{content:"";display:block;width:4px;height:8px;border:solid #ffffff;border-width:0 1.8px 1.8px 0;transform:rotate(45deg) translate(-0.5px,-0.5px);}
body[data-ds-dark-theme] .sc-check{border-color:rgba(255,255,255,.28);background:rgba(255,255,255,.08);}
body[data-ds-dark-theme] .sc-row:hover .sc-check{border-color:rgba(255,255,255,.55);}
body[data-ds-dark-theme] .sc-check:checked{border-color:var(--dsw-alias-accent, #4dabf7);background:var(--dsw-alias-accent, #4dabf7);}
.sc-menu{position:fixed;z-index:60;min-width:min(160px,70vw);background:color-mix(in srgb, var(--dsw-alias-bg-layer-1, #ffffff) 80%, transparent);-webkit-backdrop-filter:blur(26px) saturate(180%);backdrop-filter:blur(26px) saturate(180%);border:1px solid color-mix(in srgb, var(--dsw-alias-border-l2, rgba(120,130,150,.35)) 55%, transparent);border-radius:14px;box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 8px 32px rgba(15,20,30,.28);padding:5px;display:flex;flex-direction:column;color:var(--dsw-alias-label-primary,#23272e);max-height:min(420px,70vh);overflow-y:auto;}
.sc-menu-item{display:flex;align-items:center;gap:8px;width:100%;border:none;background:none;color:inherit;font:inherit;font-size:13px;text-align:left;padding:7px 10px;border-radius:9px;cursor:pointer;}
.sc-menu-item:hover{background:var(--dsw-alias-interactive-bg-hover, rgba(120,140,180,.14));}
.sc-menu-item.danger{color:var(--dsw-alias-danger,#e5484d);}
.sc-menu-sep{height:1px;background:color-mix(in srgb, var(--dsw-alias-border-l2, rgba(90,100,115,.18)) 60%, transparent);margin:4px 6px;}
.sc-tooltip{position:fixed;z-index:80;background:color-mix(in srgb, var(--dsw-alias-bg-layer-1, #ffffff) 84%, transparent);-webkit-backdrop-filter:blur(26px) saturate(190%);backdrop-filter:blur(26px) saturate(190%);border:1px solid color-mix(in srgb, var(--dsw-alias-border-l2, rgba(120,130,150,.35)) 55%, transparent);border-radius:16px;padding:10px 14px;font-size:12px;line-height:1.8;box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 10px 36px rgba(15,20,30,.3);pointer-events:none;max-width:min(280px,72vw);color:var(--dsw-alias-label-primary,#23272e);}
.sc-tooltip-title{font-size:13px;font-weight:600;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-all;max-width:250px;margin-bottom:4px;}
.sc-tooltip .muted{opacity:.55;font-size:11px;color:var(--dsw-alias-label-tertiary,#6b7280);}
.sc-tooltip .row{white-space:normal;}
/* 页面级弹窗图层（shell.overlay）：必须提升堆叠上下文，压过侧栏及其官方设置弹窗。
   官方设置弹窗打开时，侧栏会被抬到 z-index:10000（见下方"包含块彻底修复"块），
   故本层取 10001 以维持"插件页面级弹窗永远在最上"这条约定 —— 两者都是模态、
   实际不会同屏，但不能让约定与实现脱节。历史值：官方 25 / 1000 → 本层 2000。 */
[data-shell-overlay],
[class*="overlayLayer"],
.pI_x6G_overlayLayer{
  z-index: 10001 !important;
}
.sc-overlay{position:fixed;inset:0;z-index:2100 !important;display:flex;align-items:center;justify-content:center;background:rgba(8,12,20,.45);-webkit-backdrop-filter:blur(10px) saturate(120%);backdrop-filter:blur(10px) saturate(120%);padding:24px;animation:sc-fade .18s ease;}
.sc-dialog{position:relative;z-index:2101;width:min(680px,94vw);max-height:86vh;overflow-y:auto;box-sizing:border-box;display:flex;flex-direction:column;gap:14px;background:color-mix(in srgb, var(--dsw-alias-bg-layer-1, #ffffff) 88%, transparent);-webkit-backdrop-filter:blur(34px) saturate(180%);backdrop-filter:blur(34px) saturate(180%);border:1px solid color-mix(in srgb, var(--dsw-alias-border-l2, rgba(120,130,150,.35)) 60%, transparent);border-radius:22px;box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 24px 72px rgba(8,12,20,.35);padding:20px 22px;color:var(--dsw-alias-label-primary,#23272e);animation:sc-pop .22s cubic-bezier(.22,.61,.36,1);}
.sc-dialog.sc-dialog-wide{width:min(980px,95vw) !important;max-width:980px !important;height:min(720px,92vh) !important;max-height:min(720px,92vh) !important;padding:18px 22px !important;display:flex !important;flex-direction:column !important;overflow:hidden !important;}
.sc-dialog.sc-dialog-wide > .body{flex:1 1 0 !important;min-height:0 !important;overflow:hidden !important;display:flex !important;flex-direction:column !important;padding-top:2px !important;}
.sc-wall-layout{display:grid;grid-template-columns:430px 1fr;gap:20px;flex:1 1 0;min-height:0;height:100%;}
@media (max-width:860px){.sc-wall-layout{grid-template-columns:1fr;overflow-y:auto;}}
.sc-wall-left{display:flex;flex-direction:column;gap:10px;min-height:0;height:100%;overflow-y:auto;padding-right:4px;}
.sc-wall-right{display:flex;flex-direction:column;gap:12px;min-height:0;height:100%;overflow-y:auto;padding-right:6px;}
.sc-wall-card{background:color-mix(in srgb, var(--dsw-alias-bg-base, #fff) 45%, transparent);border:1px solid color-mix(in srgb, var(--dsw-alias-border-l2, rgba(120,130,150,.3)) 45%, transparent);border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;gap:10px;}
.sc-wall-card-title{font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:space-between;letter-spacing:.01em;}
.sc-wall-subtext{font-size:11px;opacity:.65;line-height:1.4;}
.sc-wall-slider-group{display:flex;flex-direction:column;gap:3px;}
.sc-wall-slider-header{display:flex;justify-content:space-between;align-items:baseline;font-size:12px;}
.sc-wall-slider-header .val{font-weight:600;color:var(--dsw-alias-accent,#4dabf7);font-variant-numeric:tabular-nums;font-size:11.5px;}
/* 「仅展示」滑杆（目前是流光脉冲速度）：数值照常显示，但不可交互——视觉上给出明确线索，
   同时 pointer-events:none 保证拖动/点击都不会改动 prefs。 */
.sc-wall-slider-group.is-readonly{cursor:default;}
.sc-wall-slider-group.is-readonly .sc-wall-slider-header .val{color:var(--dsw-alias-label-secondary,#4c5563);opacity:.75;}
.sc-wall-slider-group.is-readonly input[type="range"]{opacity:.45;pointer-events:none;cursor:default;filter:grayscale(.35);}
.sc-preset-pill{flex:1;padding:8px 10px;border-radius:10px;border:1px solid color-mix(in srgb, var(--dsw-alias-border-l2, rgba(128,128,128,0.3)) 50%, transparent);background:color-mix(in srgb, var(--dsw-alias-bg-base, #fff) 50%, transparent);color:inherit;font:inherit;font-size:12px;font-weight:600;cursor:pointer;display:flex;flex-direction:column;align-items:flex-start;gap:3px;transition:all .15s ease;text-align:left;}
.sc-preset-pill:hover{background:var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,0.14));border-color:var(--dsw-alias-accent,#4dabf7);transform:translateY(-1px);}
.sc-preset-pill.active{border-color:var(--dsw-alias-accent,#4dabf7);background:color-mix(in srgb, var(--dsw-alias-accent,#4dabf7) 14%, transparent);box-shadow:0 0 0 1px var(--dsw-alias-accent,#4dabf7);}
.sc-preset-pill .desc{font-size:10px;opacity:.65;font-weight:400;line-height:1.3;}
.sc-dialog-head{display:flex;align-items:center;gap:10px;flex:none;}
.sc-dialog-title{flex:1;margin:0;font-size:16px;font-weight:600;letter-spacing:.01em;}
.sc-dialog-x{flex:none;display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border:none;background:var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,.12));color:inherit;border-radius:9px;font-size:13px;cursor:pointer;opacity:.8;}
.sc-dialog-x:hover{opacity:1;background:var(--dsw-alias-interactive-bg-hover-solid, rgba(128,128,128,.22));}
.sc-dialog .body{font-size:13px;line-height:1.65;color:var(--dsw-alias-label-secondary,#4c5563);}
.sc-dialog .body pre{font-size:11px;white-space:pre-wrap;background:color-mix(in srgb, var(--dsw-alias-bg-base) 40%, transparent);border:1px solid color-mix(in srgb, var(--dsw-alias-border-l2) 50%, transparent);border-radius:10px;padding:8px;margin:0;color:inherit;}
.sc-dialog-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:2px;flex:none;}
.sc-dialog input[type=text]{flex:1;min-width:0;border:1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.4));background:color-mix(in srgb, var(--dsw-alias-bg-base) 62%, transparent);color:inherit;font:inherit;font-size:13px;padding:7px 10px;border-radius:10px;outline:none;transition:border-color .15s ease,background .15s ease;}
.sc-dialog input[type=text]:focus{border-color:var(--dsw-alias-accent,#4dabf7);}
.sc-primary{border:none;background:var(--dsw-alias-accent,#4dabf7);color:#fff;font:inherit;font-size:13px;font-weight:550;padding:7px 16px;border-radius:10px;cursor:pointer;transition:filter .15s ease;}
.sc-primary:hover{filter:brightness(1.08);}
.sc-primary:disabled{opacity:.5;cursor:default;}
.sc-ghost{border:1px solid var(--dsw-alias-border-l2, rgba(128,128,128,.35));background:transparent;color:var(--dsw-alias-label-secondary,#4c5563);font:inherit;font-size:13px;padding:7px 16px;border-radius:10px;cursor:pointer;transition:background .15s ease,color .15s ease;}
.sc-ghost:hover{background:var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,.12));color:var(--dsw-alias-label-primary,#23272e);}
.sc-danger{border:none;background:var(--dsw-alias-danger,#e5484d);color:#fff;font:inherit;font-size:13px;font-weight:550;padding:7px 16px;border-radius:10px;cursor:pointer;}
.sc-tag-list{display:flex;flex-direction:column;gap:10px;max-height:44vh;overflow-y:auto;padding:2px;}
.sc-tag-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:14px;background:color-mix(in srgb, var(--dsw-alias-bg-base) 42%, transparent);border:1px solid color-mix(in srgb, var(--dsw-alias-border-l2, rgba(120,130,150,.25)) 50%, transparent);}
.sc-tag-item .swatch{width:18px;height:18px;border-radius:6px;flex-shrink:0;border:none;cursor:pointer;display:inline-block;box-shadow:inset 0 0 0 1px rgba(0,0,0,.08);}
.sc-tag-item input[type=text]{flex:1;min-width:0;}
.sc-tag-item .del{border:none;background:none;color:var(--dsw-alias-danger,#e5484d);cursor:pointer;font-size:15px;opacity:.85;padding:2px 6px;border-radius:8px;}
.sc-tag-item .del:hover{opacity:1;background:rgba(229,72,77,.12);}
.sc-palette{display:flex;flex-wrap:wrap;gap:6px;}
.sc-palette .swatch{width:22px;height:22px;border-radius:8px;border:2px solid transparent;cursor:pointer;transition:transform .12s ease;box-shadow:inset 0 0 0 1px rgba(0,0,0,.06);}
.sc-palette .swatch:hover{transform:scale(1.12);}
.sc-palette .swatch.on{border-color:transparent;box-shadow:inset 0 0 0 1px rgba(255,255,255,.5),0 0 0 2px var(--dsw-alias-bg-layer-1,#fff),0 0 0 3.5px var(--dsw-alias-label-primary,#333);}
.sc-picker-grid{display:flex;flex-wrap:wrap;gap:10px;max-height:40vh;overflow-y:auto;}
.sc-picker-tag{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:500;padding:8px 14px;border-radius:999px;cursor:pointer;border:1.5px solid rgba(90,100,115,.28);user-select:none;transition:transform .12s ease,box-shadow .15s ease;}
.sc-picker-tag:hover{transform:translateY(-1px);}
.sc-picker-tag.on{border-color:currentColor;box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 4px 14px color-mix(in srgb, currentColor 22%, transparent);}
.sc-batchbar{position:relative;z-index:1;display:flex;align-items:center;gap:6px;padding:6px 4px;border-top:1px solid color-mix(in srgb, var(--dsw-alias-border-l2, rgba(90,100,115,.16)) 55%, transparent);}
.sc-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:1060;background:color-mix(in srgb, var(--dsw-alias-bg-layer-1, #ffffff) 86%, transparent);-webkit-backdrop-filter:blur(22px) saturate(180%);backdrop-filter:blur(22px) saturate(180%);color:var(--dsw-alias-label-primary,#23272e);border:1px solid color-mix(in srgb, var(--dsw-alias-border-l2, rgba(120,130,150,.3)) 55%, transparent);padding:9px 18px;border-radius:999px;font-size:13px;box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 8px 28px rgba(15,20,30,.28);animation:sc-fade .18s ease;}
.sc-trash-section{position:relative;z-index:1;border-top:1px solid rgba(90,100,115,.16);margin-top:4px;}
.sc-trash-head{display:flex;align-items:center;gap:6px;width:100%;border:none;background:none;color:inherit;font:inherit;font-size:12px;padding:8px 8px 4px;cursor:pointer;opacity:.7;}
.sc-trash-row{display:flex;align-items:center;gap:6px;padding:4px 8px;border-radius:8px;font-size:12px;cursor:pointer;}
.sc-trash-row:hover{background:var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,.1));}
.sc-trash-row .t{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sc-trash-row .act{border:none;background:none;color:inherit;font:inherit;font-size:12px;cursor:pointer;opacity:.8;padding:2px 4px;border-radius:6px;}
.sc-trash-row .act:hover{background:rgba(128,128,128,.16);}
.sc-trash-row .act.danger{color:var(--dsw-alias-danger,#e5484d);}
.sc-empty{padding:24px 8px;text-align:center;font-size:12px;opacity:.4;}
/* ================= 壁纸层（UI 底座） =================
   铁律：这一段只在 html.sc-wall-on（壁纸开启）时生效。
   此前这些规则没有作用域前缀，于是**壁纸关着的时候页面/列/会话容器也被强制透明**，
   内容一旦落在非默认底色上（壁纸、深色主题、第三方皮肤）就会出现「文字浮在背景上、
   表格失去底色与分隔线」的不可读现象（2026-09-26 报障：markdown 表格压在壁纸上）。
   插件对宿主是客人：功能关闭时必须完全无副作用。 */
html.sc-wall-on, html.sc-wall-on body, html.sc-wall-on #root { background: transparent !important; }
html.sc-wall-on [class*="_frame"], html.sc-wall-on .pI_x6G_frame, html.sc-wall-on .WnhlBa_frame { background: transparent !important; }
html.sc-wall-on [class*="sidebarCol"], html.sc-wall-on .pI_x6G_sidebarCol { background: transparent !important; }
html.sc-wall-on [class*="centerCol"], html.sc-wall-on .pI_x6G_centerCol { background: transparent !important; }
html.sc-wall-on [data-slot="root"] > div, html.sc-wall-on [data-slot="root"] > div > div { background: transparent !important; }
html.sc-wall-on [data-slot*="conversation"], html.sc-wall-on [data-slot="main"], html.sc-wall-on [data-slot="main.conversation"] { background: transparent !important; }
html.sc-wall-on [data-slot*="conversation"] > div, html.sc-wall-on [data-slot="main.conversation"] > div { background: transparent !important; }
html.sc-wall-on [data-slot="conversation.session"] { background: transparent !important; }
html.sc-wall-on .wSkVaW_root, html.sc-wall-on .c6Hg_q_root, html.sc-wall-on [class*="wSkVaW_root"] { background: transparent !important; }
html.sc-wall-on .wSkVaW_scrollBody, html.sc-wall-on [class*="scrollBody"] { background: transparent !important; }
html.sc-wall-on .wSkVaW_body, html.sc-wall-on [class*="wSkVaW_body"] { background: transparent !important; }
html.sc-wall-on .wSkVaW_viewArea, html.sc-wall-on [class*="wSkVaW_viewArea"] { background: transparent !important; }
/* 正文表格 / 代码块 / 引用（壁纸模式下）——三条诉求：
   ① **不超出会话宽度**：列多也不横向顶出去。关键不是强制等分列宽（那会把两列表格
      压成 50/50，更难看），而是让单元格能任意断行：overflow-wrap:anywhere 把
      单元格的最小宽度降到约一个字，表格因此可被 max-width 收进容器；长路径/长 token
      也被强制换行而不是撑破。列宽仍按内容自然分配。
   ② **内边距舒展**：宿主默认单元格 padding 很紧，这里给 8×14 并让文字顶对齐。
   ③ **底色更透**：贴合毛玻璃底座（可读性由 [data-chat-flow] 的 --sc-content-glass
      下限 + 这里的描边保证，而不是靠把单元格涂成实心白）。 */
html.sc-wall-on [data-slot*="conversation"] table{
  max-width:100% !important;
  margin:12px 0 !important;
  border-collapse:collapse !important;
  border:1px solid color-mix(in srgb, var(--dsw-alias-border-l2, #d3d8e0) 60%, transparent) !important;
  border-radius:10px !important;
  overflow:hidden !important;
}
html.sc-wall-on [data-slot*="conversation"] th,
html.sc-wall-on [data-slot*="conversation"] td{
  padding:8px 14px !important;
  vertical-align:top !important;
  overflow-wrap:anywhere !important;
  word-break:break-word !important;
  border-color:color-mix(in srgb, var(--dsw-alias-border-l2, #d3d8e0) 45%, transparent) !important;
}
html.sc-wall-on [data-slot*="conversation"] thead,
html.sc-wall-on [data-slot*="conversation"] tbody,
html.sc-wall-on [data-slot*="conversation"] tr,
html.sc-wall-on [data-slot*="conversation"] td{
  background:color-mix(in srgb, var(--dsw-alias-bg-layer-1, #ffffff) 55%, transparent) !important;
}
html.sc-wall-on [data-slot*="conversation"] th{
  background:color-mix(in srgb, var(--dsw-alias-bg-layer-2, #e9ecf1) 66%, transparent) !important;
  font-weight:600 !important;
}
html.sc-wall-on [data-slot*="conversation"] pre,
html.sc-wall-on [data-slot*="conversation"] blockquote{
  background:color-mix(in srgb, var(--dsw-alias-bg-layer-2, #e9ecf1) 62%, transparent) !important;
  padding:10px 14px !important;
  border-radius:10px !important;
}
html.sc-wall-on [data-slot*="conversation"] hr{
  border-color:var(--dsw-alias-border-l2, #d3d8e0) !important;
  opacity:1 !important;
}
.sc-wall{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none;}
/* 模糊填充层：整图 contain 显示时，边缘空隙用同图放大模糊填充（成熟壁纸方案） */
.sc-wall .wall-bg{position:absolute;inset:-4%;background-position:center;background-size:cover;filter:blur(22px) saturate(140%) brightness(.85);z-index:0;transition:background-image .6s ease-in-out;transform:translateZ(0);}
/* 弹窗/面板打开时冻结壁纸的动态层（网格 canvas 在 JS 侧跳过绘制，这里管 CSS 动画）：
   背景每帧都变 → 面板/遮罩的 backdrop-filter 每帧重算 → 滚动掉帧。 */
html.sc-veil-open .sc-wall *{animation-play-state:paused !important;}
/* 面板内两个滚动列：把重排/重绘限制在列内，并约束滚动链 */
.sc-wall-left,.sc-wall-right{contain:layout paint;overscroll-behavior:contain;}
.sc-wall img{position:absolute;transition:opacity .6s ease-in-out,filter .3s ease,transform .25s ease;z-index:1;}
.sc-wall .sc-grid-canvas{position:absolute;inset:0;width:100vw;height:100vh;z-index:2;pointer-events:none;display:block;}
.sc-wall .wall-mask{position:absolute;inset:0;transition:background .3s ease;z-index:3;}
/* 苹果 Liquid Glass 边缘折射与流光滤镜（物理微倒角高光与水晶折射层） */
html.sc-liquid-refract .sc-dialog,
html.sc-liquid-refract .uV2eYG_card,
html.sc-liquid-refract [data-chat-flow]{
  border: 1px solid rgba(255, 255, 255, 0.45) !important;
  box-shadow:
    inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.75),
    inset 0 -1px 1.5px 0 rgba(0, 0, 0, 0.12),
    inset 1px 0 1.5px 0 rgba(255, 255, 255, 0.25),
    inset -1px 0 1.5px 0 rgba(255, 255, 255, 0.25),
    0 8px 32px 0 rgba(0, 0, 0, 0.18) !important;
  background-image: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.14) 0%,
    rgba(255, 255, 255, 0.02) 40%,
    rgba(255, 255, 255, 0.08) 100%
  ) !important;
  backdrop-filter: blur(var(--sc-card-blur, 24px)) saturate(175%) !important;
  -webkit-backdrop-filter: blur(var(--sc-card-blur, 24px)) saturate(175%) !important;
}
html.sc-liquid-refract[data-ds-dark-theme] .sc-dialog,
html.sc-liquid-refract[data-ds-dark-theme] .uV2eYG_card,
html.sc-liquid-refract[data-ds-dark-theme] [data-chat-flow]{
  border: 1px solid rgba(255, 255, 255, 0.22) !important;
  box-shadow:
    inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.45),
    inset 0 -1px 1px 0 rgba(0, 0, 0, 0.35),
    0 8px 32px 0 rgba(0, 0, 0, 0.35) !important;
}
@media (prefers-reduced-motion: reduce) {
  .sc-grid-canvas { display: none !important; }
}
/* ============ 壁纸沉浸欣赏模式（Zen Mode / 闲置自动隐去中间输入与工作区） ============ */
/* 注意：绝不可将 [class*="scrollBody"]、[data-composer-seat] 等祖先容器设为 opacity: 0，
   因为「探索未至之境」胶囊处于主体容器内部，祖先透明会导致其连带消失。
   这里精确隐藏：工作区选择行、输入框卡片本体、以及对话消息流。 */
html.sc-wall-zen {
  overflow-x: hidden !important;
}
html.sc-wall-zen [class*="scrollBody"],
html.sc-wall-zen [class*="composerSeat"],
html.sc-wall-zen [class*="composerHero"],
html.sc-wall-zen [class*="stack"] {
  overflow: visible !important;
}
html.sc-wall-zen:not(.sc-wall-working) [class*="workspaceRow"],
html.sc-wall-zen:not(.sc-wall-working) [class*="heroWorkspaceRow"],
html.sc-wall-zen:not(.sc-wall-working) [data-composer-card],
html.sc-wall-zen:not(.sc-wall-working) [class*="inputBar"] {
  opacity: 0 !important;
  transform: scale(0.985) translateY(8px) !important;
  pointer-events: none !important;
  transition: opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1), transform 0.55s cubic-bezier(0.16, 1, 0.3, 1) !important;
}
/* 对话消息流与翻页导航：在任何情况下都必须保持完整可见，绝不进入闲置隐藏 */
/* 对话消息流与翻页导航：在任何情况下都必须保持完整可见，绝不进入闲置隐藏。
   ⚠️ 轮次导航轨道（右侧那排 2px 短横）由内核 dsh-client-ui-chat 的 TurnNavigator
   渲染，其类名来自 CSS Module、**带哈希前缀**（0.1.7 实测为 eGxaPq_* ：
   slot / frame / marks / mark / markActive / markPreview / markBusy / markUnloaded）。
   因此 [class*="turnNavigator"] 在真实 DOM 里**一个都匹配不到**（模块名不会出现在
   类名中），靠它保护等于没保护。这里补上两个真实存在的锚点：
     · [class*="eGxaPq_"] nav —— 组件根（<nav> 带组件自有的 aria-label）；
     · button[data-index][aria-current] —— TurnMark 刻度的稳定属性，
       active 时 <button aria-current="true">。
   哈希前缀会随内核构建变化，所以 client-render 测试里有一条守卫在盯它：
   一旦内核换了前缀，测试会直接失败并提示更新这里。
   颜色令牌无需额外保护：.eGxaPq_mark* 走 --dsw-alias-border-l4 /
   --dsw-alias-label-primary|tertiary，壁纸模式已由本文件统一重绘（见下方令牌块）。 */
[data-chat-flow],
[data-phase="active"] [data-chat-flow],
[class*="turnNavigator"],
[class*="eGxaPq_"] nav,
nav > button[data-index][aria-current],
[data-phase="active"] [data-composer-card],
[data-phase="active"] [class*="inputBar"],
html.sc-wall-conv-open [data-chat-flow],
html.sc-wall-conv-open [data-composer-card],
html.sc-wall-conv-open [class*="inputBar"] {
  opacity: 1 !important;
  transform: none !important;
  pointer-events: auto !important;
}
html.sc-wall-working [data-composer-card],
html.sc-wall-working [class*="inputBar"],
html.sc-wall-working [class*="turnNavigator"],
html.sc-wall-working [class*="eGxaPq_"] nav,
html.sc-wall-working nav > button[data-index][aria-current],
html.sc-wall-working [data-chat-flow] {
  opacity: 1 !important;
  transform: none !important;
  pointer-events: auto !important;
}
/* 探索未至之境与小鲸鱼：保持同款呼吸动感浮出，绝对不自动隐藏，常驻浮沉 */
html.sc-wall-zen [class*="headline"],
html.sc-wall-zen [class*="headline"]:not([class*="headlineText"]),
html.sc-wall-zen [class*="fishHitbox"],
html.sc-wall-zen [class*="titleGroup"],
html.sc-wall-zen [class*="previewBadge"] {
  opacity: 1 !important;
  visibility: visible !important;
  pointer-events: auto !important;
}
html.sc-wall-zen [data-slot*="conversation"] [data-composer-seat] [class*="headline"]:not([class*="headlineText"]),
html.sc-wall-zen [class*="headline"]:not([class*="headlineText"]) {
  display: inline-flex !important;
  flex: 0 0 auto !important;
  align-self: center !important;
  width: fit-content !important;
  max-width: max-content !important;
  margin-left: auto !important;
  margin-right: auto !important;
  padding: 8px 22px 8px 18px !important;
  border-radius: 999px !important;
  box-sizing: border-box !important;
  animation: sc-whale-glow 3.4s ease-in-out infinite !important;
  transition: none !important;
  will-change: transform;
}
html.sc-wall-zen body[data-ds-dark-theme] [data-slot*="conversation"] [data-composer-seat] [class*="headline"]:not([class*="headlineText"]),
html.sc-wall-zen body[data-ds-dark-theme] [class*="headline"]:not([class*="headlineText"]) {
  animation: sc-whale-glow-dark 3.4s ease-in-out infinite !important;
  transition: none !important;
  will-change: transform;
}
/* 会话列表（侧边栏）：展开后常驻显示 */
html.sc-wall-zen [data-slot="sidebar"] {
  opacity: 1 !important;
  pointer-events: auto !important;
}
[class*="workspaceRow"],
[class*="heroWorkspaceRow"],
[data-composer-card],
[class*="inputBar"],
[data-chat-flow] {
  transition: opacity 0.22s ease-out, transform 0.22s ease-out;
}
/* 标题：50 字内完整显示，窗口窄时再省略 */
.wSkVaW_crumb, .c6Hg_q_crumb, [class*="crumb"]{max-width:min(50ch,100%) !important;}
/* ============ 沉浸式壁纸（html.sc-wall-on 激活） ============ */
/* 中性化：壁纸模式下剥离 Solarized 奶油底（屎黄），换成干净的白/灰蓝；深色主题不动 */
html.sc-wall-on body:not([data-ds-dark-theme]){
  --dsw-alias-bg-base:#eef1f5 !important;
  --dsw-alias-bg-layer-1:#ffffff !important;
  --dsw-alias-bg-layer-2:#e9ecf1 !important;
  --dsw-alias-bg-layer-3:#f4f6f9 !important;
  --dsw-alias-bg-overlay:#f2f4f8 !important;
  --dsw-alias-border-l1:#e6e9ee !important;
  --dsw-alias-border-l2:#d3d8e0 !important;
  --dsw-alias-label-primary:#1b2028 !important;
  --dsw-alias-label-secondary:#3c4350 !important;
  --dsw-alias-label-tertiary:#6b7280 !important;
  --dsw-alias-label-caption:#8a93a3 !important;
  --dsw-alias-label-dimmed:#b0b7c2 !important;
  --dsw-alias-brand-primary:#4d6bfe !important;
  --dsw-alias-interactive-bg-hover:rgba(99,116,150,.1) !important;
  --dsw-alias-interactive-bg-hover-solid:rgba(99,116,150,.16) !important;
  --dsw-alias-interactive-bg-active:rgba(77,107,254,.12) !important;
  --dsw-specific-sidebar-fill:#f6f7fa !important;
  --dsw-specific-menu:#ffffff !important;
  --dsw-specific-input-major:#ffffff !important;
  --dsw-specific-login-input:#ffffff !important;
  --dsw-specific-tip:#f4f6f9 !important;
  --dsw-specific-selector:#f4f6f9 !important;
  --dsw-specific-bubble:#ffffff !important;
  --dsw-specific-bubble-highlight:#eef1f5 !important;
  --dsw-specific-sidebar-nav-item-active:#eceff3 !important;
  --dsw-specific-sidebar-nav-item-hover:#f0f2f6 !important;
  --dsw-specific-sidebar-nav-item-active-accent:#e7eaf0 !important;
  --dsw-alias-markdown-code-block:#f0f2f6 !important;
  --dsw-alias-markdown-code-block-banner:#e7eaf0 !important;
  --dsw-alias-markdown-inline-code:#e9ecf1 !important;
  --dsw-alias-markdown-code-segment-unselected:#e9ecf1 !important;
  --dsw-alias-markdown-citation:#e9ecf1 !important;
  --dsw-alias-button-primary-fill:#4d6bfe !important;
  --dsw-alias-button-primary-hover:#5b78ff !important;
  --dsw-alias-button-primary-dimmed:#e7eaf0 !important;
  --dsw-alias-button-info-fill:#4dabf7 !important;
  --dsw-alias-button-info-hover:#69b8f9 !important;
  --dsw-alias-button-contrast-fill:#1b2028 !important;
  --dsw-alias-button-floating-fill:#ffffff !important;
  --dsw-alias-button-floating-hover:#f0f2f6 !important;
  --dsw-alias-button-elevated-fill:#ffffff !important;
  --dsw-alias-button-ghost-active-fill:#e9ecf1 !important;
  --dsw-alias-button-ghost-active-border:#c9cfd9 !important;
  --dsw-alias-tooltip-bg:#1b2028 !important;
  --dsw-alias-toast-bg:#1b2028 !important;
  --dsw-hovercard-bg:#1b2028 !important;
  --dsw-alias-border-inverted:#ffffff !important;
  --dsw-alias-border-l3:#d3d8e0 !important;
  --dsw-alias-border-l4:#b9c0ca !important;
  --dsw-alias-bg-skeleton:rgba(99,116,150,.08) !important;
  --dsw-alias-scrollbar-bg-l1:#b6bfcd !important;
  --dsw-alias-scrollbar-bg-l2:#b6bfcd !important;
  --dsw-alias-scrollbar-hover-l1:#9da9bc !important;
  --dsw-alias-scrollbar-hover-l2:#9da9bc !important;
}
/* 大容器只用半透明纯色、绝不 backdrop-filter（滚轮/打字流畅的关键） */
html.sc-wall-on [data-slot="root"] > div:first-child{background:transparent !important;}
html.sc-wall-on [data-slot="root"] > div:first-child > div:first-child{background:transparent !important;}
html.sc-wall-on .pI_x6G_frame, html.sc-wall-on [class*="_frame"]{background:transparent !important;}
html.sc-wall-on .pI_x6G_sidebarCol, html.sc-wall-on [class*="sidebarCol"]{background:transparent !important;}
html.sc-wall-on .pI_x6G_centerCol, html.sc-wall-on [class*="centerCol"]{background:transparent !important;}
/* 会话列完全透明：壁纸全沉浸；正文包在可读卡片里 */
html.sc-wall-on .wSkVaW_root, html.sc-wall-on [class*="wSkVaW_root"]{background:transparent !important;}
html.sc-wall-on .wSkVaW_scrollBody, html.sc-wall-on [class*="scrollBody"]{background:transparent !important;}
html.sc-wall-on .wSkVaW_body, html.sc-wall-on [class*="wSkVaW_body"]{background:transparent !important;}
html.sc-wall-on .wSkVaW_viewArea, html.sc-wall-on [class*="wSkVaW_viewArea"]{background:transparent !important;}
html.sc-wall-on [data-slot*="conversation"]{background:transparent !important;}
html.sc-wall-on [data-slot*="conversation"] > div{background:transparent !important;}
html.sc-wall-on [data-slot="main"]{background:transparent !important;}
html.sc-wall-on [data-slot="main"] > div{background:transparent !important;}
html.sc-wall-on [data-slot="main.conversation"]{background:transparent !important;}
html.sc-wall-on [data-slot="main.conversation"] > div{background:transparent !important;}
html.sc-wall-on [data-slot="conversation.session"]{background:transparent !important;}
/* 非会话主列内容（插件市场 / 定时任务等全局面板）的可读性底座。
   作用域只认 [data-slot="main"]:not(:has([data-slot*="conversation"]))，排除会话。 */
html.sc-wall-on [data-slot="main"]:not(:has([data-slot*="conversation"])){
  display: block !important;
  position: relative !important;
  width: 100% !important;
  height: 100% !important;
  min-width: 0 !important;
}
html.sc-wall-on [data-slot="main"]:not(:has([data-slot*="conversation"]))::before{
  content: "";
  position: absolute;
  inset: 12px clamp(14px, 2.5vw, 32px) 16px;
  max-width: 1040px;
  left: 0;
  right: 0;
  margin: 0 auto;
  z-index: 0;
  pointer-events: none;
  border-radius: var(--sc-radius-lg, 24px);
  background: color-mix(in srgb, #fafbfd var(--sc-content-glass, 70%), transparent);
  -webkit-backdrop-filter: blur(var(--sc-card-blur, 28px)) saturate(180%) contrast(102%);
  backdrop-filter: blur(var(--sc-card-blur, 28px)) saturate(180%) contrast(102%);
  border: 1px solid color-mix(in srgb, rgba(255,255,255,.8) 75%, transparent);
  box-shadow: 0 10px 36px rgba(15,20,30,.1), inset 0 1px 0 rgba(255,255,255,.6);
}
html.sc-wall-on body[data-ds-dark-theme] [data-slot="main"]:not(:has([data-slot*="conversation"]))::before{
  background: color-mix(in srgb, #161820 var(--sc-content-glass, 75%), transparent);
  border: 1px solid rgba(255,255,255,.14);
  box-shadow: 0 10px 36px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.1);
}
/* 插件管理面板（data-plugin-panel）卡片美化与深度融入壁纸 */
html.sc-wall-on [data-plugin-panel]{
  position: relative !important;
  z-index: 1 !important;
  background: transparent !important;
  width: 100% !important;
  height: 100% !important;
  box-sizing: border-box !important;
}
html.sc-wall-on [data-plugin-panel] [data-plugin-group]{
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-1, #ffffff) 48%, transparent) !important;
  border: 1px solid color-mix(in srgb, rgba(255,255,255,.8) 50%, transparent) !important;
  border-radius: 18px !important;
  padding: 16px 20px !important;
  margin-bottom: 24px !important;
  box-shadow: 0 4px 16px rgba(15,20,30,.03) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
}
html.sc-wall-on body[data-ds-dark-theme] [data-plugin-panel] [data-plugin-group]{
  background: color-mix(in srgb, #1c202a 58%, transparent) !important;
  border: 1px solid rgba(255,255,255,.08) !important;
  box-shadow: 0 4px 16px rgba(0,0,0,.25) !important;
}
html.sc-wall-on [data-plugin-panel] [class*="card"]{
  border-radius: 10px !important;
  transition: background .15s ease !important;
}
html.sc-wall-on [data-plugin-panel] [class*="card"]:hover{
  background: color-mix(in srgb, var(--dsw-alias-interactive-bg-hover, rgba(99,116,150,.1)) 75%, transparent) !important;
}
/* 全局主面板顶部工具栏返回按钮 */
.sc-panel-back-btn{
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 11px;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1;
  color: var(--dsw-alias-label-primary, #1b2028);
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-1, #ffffff) 84%, transparent);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-border-l2, rgba(120,130,150,.35)) 60%, transparent);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  backdrop-filter: blur(16px) saturate(180%);
  box-shadow: 0 2px 10px rgba(15,20,30,.08), inset 0 1px 0 rgba(255,255,255,.5);
  cursor: pointer;
  user-select: none;
  transition: transform .12s ease, background .15s ease, border-color .15s ease, box-shadow .15s ease;
}
.sc-panel-back-btn:hover{
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-1, #ffffff) 96%, transparent);
  border-color: var(--dsw-alias-brand-primary, #4d6bfe);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(77,107,254,.2), inset 0 1px 0 rgba(255,255,255,.6);
}
.sc-panel-back-btn:active{
  transform: translateY(0);
}
body[data-ds-dark-theme] .sc-panel-back-btn{
  color: #f0f3f8;
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-2, #1b2028) 84%, transparent);
  border-color: rgba(255,255,255,.14);
  box-shadow: 0 2px 10px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.08);
}
body[data-ds-dark-theme] .sc-panel-back-btn:hover{
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-2, #1b2028) 96%, transparent);
  border-color: #6366f1;
  box-shadow: 0 4px 14px rgba(99,102,241,.3), inset 0 1px 0 rgba(255,255,255,.12);
}
.sc-panel-back-key{
  display: inline-block;
  font-size: 10px;
  line-height: 13px;
  padding: 1px 4px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-3, rgba(120,130,150,.18)) 75%, transparent);
  color: var(--dsw-alias-label-tertiary, #6b7280);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-border-l1, rgba(120,130,150,.2)) 50%, transparent);
}
/* 悬浮液态玻璃顶栏（Floating Liquid Glass Capsule Header） */
html.sc-wall-on [data-slot="conversation.session.header"]{
  padding: 8px 14px 0 14px !important;
  background: transparent !important;
  box-sizing: border-box !important;
  z-index: 15 !important;
  /* 顶栏与正文同宽体系：内容居中、不随侧栏收起而向左拉伸（侧栏收起只改变
     centerCol 起点，顶栏胶囊保持居中固定宽度，视觉自然）。 */
  display: flex !important;
  align-items: flex-start !important;
  justify-content: center !important;
  /* 与下方消息卡拉开可见间距，成为独立的悬浮玻璃胶囊（对话框式分栏） */
  margin-bottom: 14px !important;
}
html.sc-wall-on [data-slot="conversation.session.header"] > header{
  background: color-mix(in srgb, #fafbfd var(--sc-glass, 65%), transparent) !important;
  -webkit-backdrop-filter: blur(var(--sc-card-blur, 28px)) saturate(190%) contrast(102%) !important;
  backdrop-filter: blur(var(--sc-card-blur, 28px)) saturate(190%) contrast(102%) !important;
  /* 不用实体 border：宽胶囊上一条 1px 亮白实线会读成「横线出头」。
     改由外发光 rim + 内高光 box-shadow 勾勒边缘，玻璃感保留但无硬线。 */
  border: none !important;
  border-radius: 18px !important;
  box-shadow:
    0 0 0 1px color-mix(in srgb, rgba(255,255,255,.65) 55%, transparent),
    inset 0 1.5px 1px 0 rgba(255,255,255,.75),
    inset 0 -1px 2px 0 rgba(0,0,0,.06),
    0 12px 36px rgba(15,20,30,.16) !important;
  padding: 4px 12px !important;
  /* 内容宽度胶囊：与正文（--dsh-my-width）同宽对齐；软性 rim 落在圆角内，
     不产生满宽硬线。 */
  width: 100% !important;
  max-width: var(--dsh-my-width) !important;
  margin: 0 auto !important;
  box-sizing: border-box !important;
  transition: all .2s cubic-bezier(.22,.61,.36,1) !important;
}
html.sc-wall-on body[data-ds-dark-theme] [data-slot="conversation.session.header"] > header{
  background: color-mix(in srgb, #141722 var(--sc-glass, 65%), transparent) !important;
  border: none !important;
  box-shadow:
    0 0 0 1px rgba(255,255,255,.1),
    inset 0 1.5px 1px 0 rgba(255,255,255,.22),
    inset 0 -1px 2px 0 rgba(0,0,0,.5),
    0 16px 44px rgba(0,0,0,.4) !important;
}
/* 顶栏文字对比强化：官方 label-secondary/tertiary 在 86% 玻璃上仍偏淡，
   统一提档到更深的 label-primary，保证标题/面包屑/按钮/状态在壁纸上稳读。 */
html.sc-wall-on [data-slot="conversation.session.header"] > header,
html.sc-wall-on [data-slot="conversation.session.header"] > header *{
  color:var(--dsw-alias-label-primary,#1b2028);
}
html.sc-wall-on [data-slot="conversation.session.header"] > header [class*="crumb"],
html.sc-wall-on [data-slot="conversation.session.header"] > header [class*="title"]{
  color:var(--dsw-alias-label-primary,#1b2028) !important;
  font-weight:600;
}
html.sc-wall-on [data-slot="conversation.session.header"] > header button,
html.sc-wall-on [data-slot="conversation.session.header"] > header [role="button"]{
  color:var(--dsw-alias-label-secondary,#3c4350) !important;
}
html.sc-wall-on [data-slot="conversation.session.header"] > header button:hover,
html.sc-wall-on [data-slot="conversation.session.header"] > header [role="button"]:hover{
  color:var(--dsw-alias-label-primary,#1b2028) !important;
}
html.sc-wall-on body[data-ds-dark-theme] [data-slot="conversation.session.header"] > header,
html.sc-wall-on body[data-ds-dark-theme] [data-slot="conversation.session.header"] > header *{
  color:var(--dsw-alias-label-primary,#e6e9f0);
}
html.sc-wall-on body[data-ds-dark-theme] [data-slot="conversation.session.header"] > header button,
html.sc-wall-on body[data-ds-dark-theme] [data-slot="conversation.session.header"] > header [role="button"]{
  color:var(--dsw-alias-label-secondary,#c3c9d4) !important;
}
html.sc-wall-on [data-slot*="conversation"] [data-chat-flow]{
  background:color-mix(in srgb, #fafbfd var(--sc-content-glass, 88%), transparent) !important;
  /* 不用实体 border：宽卡上 1px 亮白实线会在上/右/下缘读成「横竖线出头」。
     改由外发光 rim + 内高光 box-shadow 勾勒，同上方的头部胶囊。 */
  border:none !important;
  border-radius:22px !important;
  box-shadow:
    0 0 0 1px color-mix(in srgb, rgba(255,255,255,.45) 55%, transparent),
    inset 0 1px 0 rgba(255,255,255,.35),
    0 12px 40px rgba(15,20,30,.16) !important;
  padding:18px 20px !important;
}
html.sc-wall-on body[data-ds-dark-theme] [data-slot*="conversation"] [data-chat-flow]{
  background:color-mix(in srgb, #161820 var(--sc-content-glass, 88%), transparent) !important;
  border:none !important;
  box-shadow:
    0 0 0 1px rgba(255,255,255,.07),
    inset 0 1px 0 rgba(255,255,255,.08),
    0 12px 40px rgba(0,0,0,.3) !important;
}
/* 壁纸模式下隐藏会话正文的原生滚动条轨道/滑块：否则最右侧会出现 1px 竖向
   细条（滚动条 border）与轨道底色，读作「横竖线出头」。滚动功能保留。 */
html.sc-wall-on [data-slot*="conversation"] ::-webkit-scrollbar{width:0 !important;height:0 !important;display:none !important;}
html.sc-wall-on [data-slot*="conversation"] {scrollbar-width:none !important;}
/* 细节面板（右侧 details）即使收起也残留 1px 竖向细条（滚动容器 border + 底色）。
   把 details 内的滚动容器边框与底色一并清掉，避免右侧「竖线出头」。 */
html.sc-wall-on [data-slot="details"] [class*="root"]{border:none !important;background:transparent !important;}
html.sc-wall-on [data-slot="details"] [class*="scroll"]{border:none !important;background:transparent !important;}
html.sc-wall-on [data-slot="details"] > div{border:none !important;background:transparent !important;}
/* ===== 悬浮液态玻璃侧边栏（全高精致 280px 玻璃悬浮卡片 + 收起为小鲸鱼 🐳） ===== */
/* 彻底消灭左侧分割线、三列网格边框与残余白线 */
html.sc-wall-on [class*="sidebarCol"],
html.sc-wall-on [class*="centerCol"],
html.sc-wall-on [class*="detailsCol"],
html.sc-wall-on [class*="frame"],
html.sc-wall-on [data-slot="sidebar"],
html.sc-wall-on [data-slot="sidebar"] *,
html.sc-wall-on [data-slot="details"],
html.sc-wall-on [data-slot="details"] *,
html.sc-wall-on [data-slot="root"] > div:first-child{
  border: none !important;
  border-right: none !important;
  border-inline-end: none !important;
  border-left: none !important;
  border-inline-start: none !important;
  border-top: none !important;
  border-bottom: none !important;
}
/* 布局分隔件/拖拽柄：只处理三列网格自己的东西。
   注意不要用无作用域的 [class*="handle"|"divider"|"separator"]——宿主（以及第三方
   插件）的哈希类名里出现这些子串是常态（消息分隔、表格分隔、按钮 handleXxx），
   文档级 display:none 会把真正的**内容**一起吃掉，属于最危险的一类全局覆盖。 */
html.sc-wall-on [class*="resize"],
html.sc-wall-on [class*="splitHandle"],
html.sc-wall-on [data-slot="sidebar"] [class*="separator"],
html.sc-wall-on [data-slot="sidebar"] [class*="divider"],
html.sc-wall-on [data-slot="details"] [class*="separator"],
html.sc-wall-on [data-slot="details"] [class*="divider"]{
  display: none !important;
  opacity: 0 !important;
  border: none !important;
  width: 0 !important;
  pointer-events: none !important;
}

/* ===== 去掉会话顶栏（含「对话/轨迹」标签）：壁纸功能迁到设置、Session log 移到
   会话列表右键菜单后，顶栏已无存在必要，整体隐藏，消息列上移填充。 ===== */
html.sc-wall-on [data-slot="conversation.session.header"]{
  display: none !important;
}
html.sc-wall-on [data-slot*="conversation"] [data-chat-flow]{
  margin-top: 16px !important;
}

/* ================= 极速丝滑过渡动效引擎（Apple HIG / Linear 2024 物理弹簧曲线） ================= */
/* 展开：240ms cubic-bezier(0.16, 1, 0.3, 1) —— 爆发加速后阻尼缓入
   收起：180ms cubic-bezier(0.32, 0.72, 0, 1) —— 果断收拢
   2026-09-26：340/240ms 偏长，而这段动画是 grid-template-columns 的**逐帧重排**
   （整个 app 网格 + 满屏模糊壁纸一起参与），时长越长掉的帧越多。缩到 240/180ms：
   视觉几乎无差，但重排帧数直接少三分之一。 */
:root {
  --sc-sb-expand-dur: 240ms;
  --sc-sb-expand-ease: cubic-bezier(0.16, 1, 0.3, 1);
  --sc-sb-collapse-dur: 180ms;
  --sc-sb-collapse-ease: cubic-bezier(0.32, 0.72, 0, 1);
}

/* 1. 消除外层 AppFrame 网格列与侧栏卡片的动画脱节，让两侧同频收放 */
[class*="frame"],
.pI_x6G_frame {
  transition: grid-template-columns var(--sc-sb-expand-dur) var(--sc-sb-expand-ease) !important;
  will-change: grid-template-columns;
  contain: layout style;
}
[class*="frame"][data-sidebar-collapsed],
.pI_x6G_frame[data-sidebar-collapsed] {
  transition: grid-template-columns var(--sc-sb-collapse-dur) var(--sc-sb-collapse-ease) !important;
}

/* 2. 侧边栏主体：GPU 独立合成层，杜绝中间对话列重绘 (Zero-Jank Compositing) */
[data-slot="sidebar"] {
  contain: layout paint;
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  transition:
    width var(--sc-sb-expand-dur) var(--sc-sb-expand-ease),
    height var(--sc-sb-expand-dur) var(--sc-sb-expand-ease),
    transform var(--sc-sb-expand-dur) var(--sc-sb-expand-ease) !important;
  will-change: width, height, transform;
}
[class*="frame"][data-sidebar-collapsed] [data-slot="sidebar"],
[data-slot="sidebar"]:has([class*="collapsed"]),
[data-slot="sidebar"] [class*="collapsed"] {
  transition:
    width var(--sc-sb-collapse-dur) var(--sc-sb-collapse-ease),
    height var(--sc-sb-collapse-dur) var(--sc-sb-collapse-ease),
    transform var(--sc-sb-collapse-dur) var(--sc-sb-collapse-ease) !important;
}

/* 展开状态：舒适大气的 280px 宽度 + 全高悬浮玻璃卡片（充分展示会话列表与标签） */
html.sc-wall-on [data-slot="sidebar"]{
  width: 280px !important;
  min-width: 280px !important;
  max-width: 280px !important;
  height: calc(100vh - 24px) !important;
  max-height: calc(100vh - 24px) !important;
  align-self: flex-start !important;
  padding: 12px 0 12px 12px !important;
  box-sizing: border-box !important;
  z-index: 25 !important;
  background: transparent !important;
  border: none !important;
  transform-origin: 22px 22px !important;
  transition:
    width var(--sc-sb-expand-dur) var(--sc-sb-expand-ease),
    height var(--sc-sb-expand-dur) var(--sc-sb-expand-ease),
    transform var(--sc-sb-expand-dur) var(--sc-sb-expand-ease) !important;
  will-change: width, height, transform;
}
html.sc-wall-on [data-slot="sidebar"] > div:first-child{
  background: color-mix(in srgb, #fafbfd 70%, transparent) !important;
  border: 1px solid rgba(255,255,255,.85) !important;
  border-radius: 20px !important;
  box-shadow: inset 0 1.5px 1px 0 rgba(255,255,255,.9), inset 0 -1px 2px 0 rgba(0,0,0,.06), 0 16px 40px rgba(15,20,30,.15) !important;
  height: 100% !important;
  max-height: 100% !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
  transform-origin: 22px 22px !important;
  contain: layout paint;
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  transition: border-radius var(--sc-sb-expand-dur) var(--sc-sb-expand-ease) !important;
}
/* 列表区域自适应铺满滚动 + 遮罩揭示动效（Unmask Reveal，无文字折行重排） */
html.sc-wall-on [data-slot="sidebar"] [class*="regionArea"]{
  flex: 1 1 auto !important;
  min-height: 0 !important;
  height: 100% !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  transition:
    opacity 240ms var(--sc-sb-expand-ease) 50ms,
    transform 320ms var(--sc-sb-expand-ease) !important;
  will-change: opacity, transform;
}
html.sc-wall-on [class*="frame"][data-sidebar-collapsed] [data-slot="sidebar"] [class*="regionArea"],
html.sc-wall-on [data-slot="sidebar"]:has([class*="collapsed"]) [class*="regionArea"],
html.sc-wall-on [data-slot="sidebar"] [class*="collapsed"] [class*="regionArea"]{
  opacity: 0 !important;
  transform: translate3d(-16px, 0, 0) !important;
  pointer-events: none !important;
  transition:
    opacity 120ms var(--sc-sb-collapse-ease),
    transform 160ms var(--sc-sb-collapse-ease) !important;
}
html.sc-wall-on body[data-ds-dark-theme] [data-slot="sidebar"] > div:first-child{
  background: color-mix(in srgb, #141722 68%, transparent) !important;
  border: 1px solid rgba(255,255,255,.16) !important;
  box-shadow: inset 0 1.5px 1px 0 rgba(255,255,255,.22), 0 20px 50px rgba(0,0,0,.45) !important;
}

/* 收起状态：直接向左上角聚拢收拢为 44px 悬浮小鲸鱼灵动球（位置固定；拖拽交互 2026-09-26 已移除，见 40 号片段回归记录） */
html.sc-wall-on [class*="frame"][data-sidebar-collapsed] [data-slot="sidebar"] > div:first-child,
html.sc-wall-on [class*="frame"][data-sidebar-collapsed] [data-slot="sidebar"],
html.sc-wall-on [data-slot="sidebar"]:has([class*="collapsed"]) > div:first-child,
html.sc-wall-on [data-slot="sidebar"]:has([class*="collapsed"]),
html.sc-wall-on [data-slot="sidebar"] > [class*="collapsed"],
html.sc-wall-on [data-slot="sidebar"] [class*="collapsed"]{
  width: 44px !important;
  min-width: 44px !important;
  max-width: 44px !important;
  height: 44px !important;
  position: fixed !important;
  top: 48px !important;
  left: 14px !important;
  padding: 0 !important;
  margin: 0 !important;
  z-index: 60 !important;
  border-radius: 999px !important;
  border: none !important;
  background: transparent !important;
  touch-action: none !important;
  user-select: none !important;
  cursor: grab !important;
  /* 卡片是一颗覆盖在左上角的 44px 球；它下面的官方行（logoRow，36px + 负 margin）
     不再承担布局，否则会把里面那颗鲸鱼往上顶出卡片和列之外。
     2026-09-28 CDP 实测：
       .pI_x6G_sidebarCol  overflow:hidden  盒 = x0..56
       切换按钮(卡片)                        盒 = y13..57
       小鲸鱼 svg                            盒 = y1..19  ← 顶部被列裁掉 12px
     修法见下方 logoRow / railMark 两条规则。 */
  transform-origin: 22px 22px !important;
  transition:
    width var(--sc-sb-collapse-dur) var(--sc-sb-collapse-ease),
    height var(--sc-sb-collapse-dur) var(--sc-sb-collapse-ease),
    transform var(--sc-sb-collapse-dur) var(--sc-sb-collapse-ease) !important;
  will-change: width, height, transform;
}
/* ===== 桌面版 Windows 标题栏左侧菜单（"应用" / "编辑"）位置与对齐 ===== */
html[data-windows-titlebar],
html[data-windows-titlebar]:has([data-sidebar-collapsed="true"]) {
  --dsh-windows-menu-start: 14px !important;
}
div[data-windows-menu] {
  left: 14px !important;
  -webkit-app-region: no-drag !important;
}
/* ===== 悬浮小鲸鱼灵动球：3D 呼吸动感浮出与微晶光晕 ===== */
@keyframes sc-whale-breathe {
  0%, 100% {
    transform: translateY(0) scale(1);
    box-shadow:
      inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.95),
      0 8px 24px rgba(15, 25, 45, 0.16),
      0 0 0 0 rgba(77, 107, 254, 0);
    border-color: rgba(255, 255, 255, 0.9);
  }
  50% {
    transform: translateY(-4px) scale(1.06);
    box-shadow:
      inset 0 2px 2px 0 rgba(255, 255, 255, 1),
      0 16px 36px rgba(0, 102, 255, 0.35),
      0 0 22px 6px rgba(77, 107, 254, 0.4);
    border-color: rgba(140, 190, 255, 0.95);
  }
}
@keyframes sc-whale-breathe-dark {
  0%, 100% {
    transform: translateY(0) scale(1);
    box-shadow:
      inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.25),
      0 8px 24px rgba(0, 0, 0, 0.45),
      0 0 0 0 rgba(77, 107, 254, 0);
    border-color: rgba(255, 255, 255, 0.2);
  }
  50% {
    transform: translateY(-4px) scale(1.06);
    box-shadow:
      inset 0 2px 2px 0 rgba(255, 255, 255, 0.45),
      0 16px 36px rgba(0, 102, 255, 0.45),
      0 0 24px 8px rgba(77, 107, 254, 0.45);
    border-color: rgba(110, 160, 255, 0.6);
  }
}
@keyframes sc-whale-icon-bob {
  0%, 100% {
    transform: translateY(0) scale(1);
    filter: drop-shadow(0 2px 4px rgba(0, 102, 255, 0.25));
  }
  50% {
    transform: translateY(-1.5px) scale(1.06);
    filter: drop-shadow(0 4px 10px rgba(0, 102, 255, 0.55));
  }
}
/* 纯光晕呼吸（闲置漫游时使用，transform 完全由游动物理引擎控制） */
@keyframes sc-whale-glow {
  0%, 100% {
    box-shadow:
      inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.95),
      0 8px 24px rgba(15, 25, 45, 0.16),
      0 0 0 0 rgba(77, 107, 254, 0);
    border-color: rgba(255, 255, 255, 0.9);
  }
  50% {
    box-shadow:
      inset 0 2px 2px 0 rgba(255, 255, 255, 1),
      0 16px 36px rgba(0, 102, 255, 0.35),
      0 0 22px 6px rgba(77, 107, 254, 0.4);
    border-color: rgba(140, 190, 255, 0.95);
  }
}
@keyframes sc-whale-glow-dark {
  0%, 100% {
    box-shadow:
      inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.25),
      0 8px 24px rgba(0, 0, 0, 0.45),
      0 0 0 0 rgba(77, 107, 254, 0);
    border-color: rgba(255, 255, 255, 0.2);
  }
  50% {
    box-shadow:
      inset 0 2px 2px 0 rgba(255, 255, 255, 0.45),
      0 16px 36px rgba(0, 102, 255, 0.45),
      0 0 24px 8px rgba(77, 107, 254, 0.45);
    border-color: rgba(110, 160, 255, 0.6);
  }
}
/* 声呐波纹与点击光点 */
@keyframes sc-sonar-expand {
  0% {
    transform: translate(-50%, -50%) scale(0.1);
    opacity: 0.95;
    border-color: rgba(0, 150, 255, 0.9);
    box-shadow: 0 0 10px rgba(0, 150, 255, 0.8), inset 0 0 10px rgba(0, 150, 255, 0.5);
  }
  50% {
    opacity: 0.65;
    border-color: rgba(77, 160, 255, 0.6);
  }
  100% {
    transform: translate(-50%, -50%) scale(2.4);
    opacity: 0;
    border-color: rgba(0, 102, 255, 0);
    box-shadow: 0 0 26px rgba(0, 150, 255, 0);
  }
}
@keyframes sc-sonar-dot-fade {
  0% { transform: translate(-50%, -50%) scale(1.6); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(0.2); opacity: 0; }
}
.sc-sonar-ripple {
  position: fixed;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 2px solid rgba(0, 150, 255, 0.85);
  pointer-events: none;
  z-index: 9999;
  animation: sc-sonar-expand 0.85s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
}
.sc-sonar-ripple::after {
  content: '';
  position: absolute;
  inset: 6px;
  border-radius: 50%;
  border: 1.5px solid rgba(130, 200, 255, 0.75);
  animation: sc-sonar-expand 0.85s 0.12s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
}
.sc-sonar-dot {
  position: fixed;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #0099ff;
  box-shadow: 0 0 8px #00d2ff, 0 0 16px #0077ff;
  pointer-events: none;
  z-index: 10000;
  animation: sc-sonar-dot-fade 0.7s ease-out forwards;
}
/* 破水光晕环 */
@keyframes sc-splash-expand {
  0% {
    transform: translate(-50%, -50%) scale(0.3);
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(0, 180, 255, 0.9), inset 0 0 12px rgba(255, 255, 255, 0.9);
  }
  60% {
    opacity: 0.85;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.75);
    opacity: 0;
    box-shadow: 0 0 40px 14px rgba(0, 150, 255, 0), inset 0 0 28px rgba(255, 255, 255, 0);
  }
}
.sc-splash-ring {
  position: fixed;
  border-radius: 999px;
  border: 2.5px solid rgba(100, 200, 255, 0.9);
  pointer-events: none;
  z-index: 9999;
  animation: sc-splash-expand 0.65s cubic-bezier(0.1, 0.85, 0.25, 1) forwards;
}
html.sc-wall-on [data-slot="sidebar"]:has([class*="collapsed"]):active,
html.sc-wall-on [data-slot="sidebar"] [class*="collapsed"]:active{
  cursor: grabbing !important;
}
/* 折叠态放开「列」的裁剪：小鲸鱼球是覆盖在左上角的一颗 fixed 球，比 56px 的
   sidebarCol 允许的范围更靠上（2026-09-28 CDP 实测 svg 在 y3，而列从 y0 开始
   且 overflow:hidden）。列本身占满整个视口高度，放开不会牵连任何布局，
   只让这颗球完整显示。 */
html.sc-wall-on [class*="frame"][data-sidebar-collapsed] .pI_x6G_sidebarCol,
html.sc-wall-on [class*="frame"][data-sidebar-collapsed] [class*="sidebarCol"]{
  overflow: visible !important;
}
html.sc-wall-on [class*="frame"][data-sidebar-collapsed] [data-slot="sidebar"] > div:first-child,
html.sc-wall-on [data-slot="sidebar"]:has([class*="collapsed"]) > div:first-child,
html.sc-wall-on [data-slot="sidebar"] > [class*="collapsed"],
html.sc-wall-on [data-slot="sidebar"] [class*="collapsed"]{
  position: fixed !important;
  top: 48px !important;
  left: 14px !important;
  width: 44px !important;
  height: 44px !important;
  min-width: 44px !important;
  /* 折叠成 44px 小鲸鱼球时，官方根节点自带 overflow:hidden 也会切掉字形。
     CDP 实测那次的盒是 y13..57 而 svg 在 y1..19，顶部被裁掉 12px。 */
  overflow: visible !important;
  border-radius: 14px !important;
  background: color-mix(in srgb, #ffffff 88%, transparent) !important;
  border: 1px solid rgba(255,255,255,.9) !important;
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transform-origin: 22px 22px !important;
  animation: sc-whale-breathe 3.4s ease-in-out infinite !important;
  will-change: transform, box-shadow;
  transition: border-radius var(--sc-sb-collapse-dur) var(--sc-sb-collapse-ease) !important;
}
html.sc-wall-on body[data-ds-dark-theme] [class*="frame"][data-sidebar-collapsed] [data-slot="sidebar"] > div:first-child,
html.sc-wall-on body[data-ds-dark-theme] [data-slot="sidebar"]:has([class*="collapsed"]) > div:first-child,
html.sc-wall-on body[data-ds-dark-theme] [data-slot="sidebar"] [class*="collapsed"]{
  background: color-mix(in srgb, #161922 85%, transparent) !important;
  border: 1px solid rgba(255,255,255,.2) !important;
  animation: sc-whale-breathe-dark 3.4s ease-in-out infinite !important;
}
html.sc-wall-on [data-slot="sidebar"]:has([class*="collapsed"]) > div:first-child:hover,
html.sc-wall-on [data-slot="sidebar"] [class*="collapsed"]:hover{
  animation-play-state: paused !important;
  transform: translateY(-5px) scale(1.12) !important;
  box-shadow: inset 0 2px 2px 0 rgba(255,255,255,1), 0 18px 42px rgba(0,102,255,.5), 0 0 28px 8px rgba(77,107,254,.5) !important;
}
html.sc-wall-on [data-slot="sidebar"]:has([class*="collapsed"]):active > div:first-child,
html.sc-wall-on [data-slot="sidebar"] [class*="collapsed"]:active > div:first-child{
  animation: none !important;
  transform: scale(0.96) !important;
}
html.sc-wall-on [data-slot="sidebar"] [class*="collapsed"] [class*="toggle"] svg,
html.sc-wall-on [data-slot="sidebar"] [class*="collapsed"] [class*="logoRow"] svg{
  transform-origin: center !important;
  will-change: transform;
}
/* 底部与辅助区域：利落滑移淡出与优雅缓入 */
html.sc-wall-on [data-slot="sidebar"] [class*="footArea"],
html.sc-wall-on [data-slot="sidebar"] [class*="newSession"],
html.sc-wall-on [data-slot="sidebar"] [class*="buildRevision"]{
  transition:
    opacity 200ms var(--sc-sb-expand-ease) 50ms,
    transform 260ms var(--sc-sb-expand-ease) !important;
  will-change: opacity, transform;
}
html.sc-wall-on [class*="frame"][data-sidebar-collapsed] [data-slot="sidebar"] [class*="footArea"],
html.sc-wall-on [class*="frame"][data-sidebar-collapsed] [data-slot="sidebar"] [class*="newSession"],
html.sc-wall-on [class*="frame"][data-sidebar-collapsed] [data-slot="sidebar"] [class*="buildRevision"],
html.sc-wall-on [data-slot="sidebar"]:has([class*="collapsed"]) [class*="footArea"],
html.sc-wall-on [data-slot="sidebar"]:has([class*="collapsed"]) [class*="newSession"],
html.sc-wall-on [data-slot="sidebar"]:has([class*="collapsed"]) [class*="buildRevision"]{
  opacity: 0 !important;
  transform: translate3d(0, 8px, 0) !important;
  pointer-events: none !important;
  transition: opacity 120ms var(--sc-sb-collapse-ease) !important;
}
/* 收起时隐藏多余的设置/列表/新建按钮，只居中保留小鲸鱼。
   2026-09-28 CDP 实测：卡片（.hHd-Xa_root，44px，display:flex + align-items:center）
   里此时有 **两个** flex 子项 —— logoRow（44px）与 panelList（36px），
   合计 80px > 44px，于是居中布局把 logoRow 顶到 y-10、鲸鱼顶到 y3，
   看起来就是"小鲸鱼被卡片上边切掉"。所以 panelList 必须一起隐藏。 */
/* 卡片里保留两个字形：鲸鱼（brand.mark）+ 面板图标（toggle 自带）。
   注意曾试图只留鲸鱼，但 brand.mark 的包裹 div 是 display:contents
   （不生成盒子），相邻兄弟选择器（railMark ~ svg）根本选不中它，
   写了等于没写 —— 所以不做隐藏，避免留下"看起来在管、其实没管"的死规则。 */
/* 折叠态：卡片里**只留小鲸鱼**。
   那个带竖线的方框是官方 toggle 自带的"展开侧栏"图标 —— 按设计它属于**展开态**
   的收起按钮，不该出现在折叠球里（用户 2026-09-28 明确指出）。
   作用域严格限定在折叠态：两种等价判定（官方给 root 加 hHd-Xa_collapsed；
   frame 上有 data-sidebar-collapsed），展开后自动恢复，不影响展开态的收起按钮。 */
html.sc-wall-on [class*="frame"][data-sidebar-collapsed] [data-slot="sidebar"] [class*="panelIcon"],
html.sc-wall-on [data-slot="sidebar"]:has([class*="collapsed"]) [class*="panelIcon"],
html.sc-wall-on [data-slot="sidebar"] [class*="collapsed"] [class*="panelIcon"]{
  display: none !important;
}
html.sc-wall-on [class*="frame"][data-sidebar-collapsed] [data-slot="sidebar"] [class*="brand"],
html.sc-wall-on [class*="frame"][data-sidebar-collapsed] [data-slot="sidebar"] [class*="panelList"],
html.sc-wall-on [class*="frame"][data-sidebar-collapsed] [data-slot="sidebar"] [class*="regionArea"],
html.sc-wall-on [class*="frame"][data-sidebar-collapsed] [data-slot="sidebar"] [class*="footArea"],
html.sc-wall-on [class*="frame"][data-sidebar-collapsed] [data-slot="sidebar"] [class*="newSession"],
html.sc-wall-on [class*="frame"][data-sidebar-collapsed] [data-slot="sidebar"] [class*="buildRevision"],
html.sc-wall-on [data-slot="sidebar"]:has([class*="collapsed"]) [class*="brand"],
html.sc-wall-on [data-slot="sidebar"]:has([class*="collapsed"]) [class*="panelList"],
html.sc-wall-on [data-slot="sidebar"]:has([class*="collapsed"]) [class*="regionArea"],
html.sc-wall-on [data-slot="sidebar"]:has([class*="collapsed"]) [class*="footArea"],
html.sc-wall-on [data-slot="sidebar"]:has([class*="collapsed"]) [class*="newSession"],
html.sc-wall-on [data-slot="sidebar"]:has([class*="collapsed"]) [class*="buildRevision"],
html.sc-wall-on [data-slot="sidebar"] [class*="collapsed"] [class*="brand"],
html.sc-wall-on [data-slot="sidebar"] [class*="collapsed"] [class*="panelList"],
html.sc-wall-on [data-slot="sidebar"] [class*="collapsed"] [class*="regionArea"],
html.sc-wall-on [data-slot="sidebar"] [class*="collapsed"] [class*="footArea"],
html.sc-wall-on [data-slot="sidebar"] [class*="collapsed"] [class*="newSession"],
html.sc-wall-on [data-slot="sidebar"] [class*="collapsed"] [class*="buildRevision"]{
  display: none !important;
}
html.sc-wall-on [class*="frame"][data-sidebar-collapsed] [class*="logoRow"],
html.sc-wall-on [class*="frame"][data-sidebar-collapsed] [class*="toggle"],
html.sc-wall-on [data-slot="sidebar"]:has([class*="collapsed"]) [class*="logoRow"],
html.sc-wall-on [data-slot="sidebar"]:has([class*="collapsed"]) [class*="toggle"],
html.sc-wall-on [data-slot="sidebar"] [class*="collapsed"] [class*="logoRow"],
html.sc-wall-on [data-slot="sidebar"] [class*="collapsed"] [class*="toggle"]{
  width: 100% !important;
  height: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  /* 官方折叠态给 logoRow 的是 height:36px + margin-top:-12px，toggle 是
     position:absolute（top 以标题栏高度算出）。卡片只有 44px，这套偏移会把
     卡片里的图标顶到卡片外 —— 2026-09-28 CDP 实测放大截图里，
     鲸鱼与 toggle 自带图标两个字形**同时叠在卡片顶边**。
     这里把二者都改成参与 flex 居中：position:relative（不脱流）+ top/margin 归零。
     注意不能写 position:static —— 官方的 absolute 规则带 !important 且特异性更高，
     实测 static 不生效。 */
  margin: 0 !important;
  position: relative !important;
  top: auto !important;
  left: auto !important;
  right: auto !important;
  bottom: auto !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;
  background: transparent !important;
  border: none !important;
  cursor: pointer !important;
  overflow: hidden !important;
}
/* 折叠轨里的小鲸鱼：**只保留一个字形、并让它稳稳居中**。
   2026-09-28 用户两次报「左边小鲸鱼显示错误」（截图里小鲸鱼被 44px 卡片裁掉上半）。
   原因有二，都出在这里：
     1) railMark 上的 transform: scale(1.25) 把图标放大出卡片可视区；
     2) 上面给卡片里的**所有** svg 挂了 sc-whale-icon-bob，图标一边动一边被裁。
   现在：不放大、图标自身不参与位移动画（呼吸感由整卡 sc-whale-breathe 提供），
   并用 inline-flex 固定字形盒，保证任何 viewBox 都完整可见。
   注意：本注释所在的 CSS 是模板字面量，**注释里不能出现反引号**，
   否则会提前终结字符串、生成语法坏掉的产物（构建期语法闸会拦，但不能靠它兜）。 */
html.sc-wall-on [data-slot="sidebar"] [class*="collapsed"] [class*="railMark"]{
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  color: #0066ff !important;
  line-height: 0 !important;
  transform: none !important;
}
html.sc-wall-on body[data-ds-dark-theme] [data-slot="sidebar"] [class*="collapsed"] [class*="railMark"],
html.sc-wall-on body[data-ds-dark-theme] .sc-whale-mark{
  color: #4dabf7 !important;
}
.sc-whale-mark{
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  color: #0066ff !important;
  line-height: 0 !important;
  transform: none !important;
}
[class*="toggle"]:has([class*="railMark"]) .sc-whale-mark{
  display: none !important;
}
.sc-whale-mark svg{
  display: block !important;
  flex: none !important;
  max-width: 100% !important;
  max-height: 100% !important;
  animation: none !important;
  transform: none !important;
}
html.sc-wall-on [data-slot="sidebar"] [class*="collapsed"] [class*="railMark"] svg,
html.sc-wall-on [data-slot="sidebar"] [class*="collapsed"] [class*="logoRow"] svg,
html.sc-wall-on [data-slot="sidebar"] [class*="collapsed"] [class*="toggle"] svg{
  display: block !important;
  flex: none !important;
  max-width: 100% !important;
  max-height: 100% !important;
  animation: none !important;   /* 位移动画交还给整卡，避免图标被裁 */
  transform: none !important;
}

/* 禁用官方折叠轨入场水平滑移动画，防止收起瞬间图标产生 49px 横向跳动 */
html.sc-wall-on [class*="railIn"] [class*="iconButton"],
html.sc-wall-on [class*="railIn"] [class*="toggle"]{
  animation: none !important;
  transform: none !important;
}

/* 折叠态桌面端兜底：当官方组件未渲染 railMark（如 Windows 桌面端）时，在 toggle 内呈现居中小鲸鱼 */
html.sc-wall-on [data-slot="sidebar"] [class*="collapsed"] [class*="toggle"]:not(:has([class*="railMark"])):not(:has(.sc-whale-mark))::after,
html.sc-wall-on [class*="frame"][data-sidebar-collapsed] [data-slot="sidebar"] [class*="toggle"]:not(:has([class*="railMark"])):not(:has(.sc-whale-mark))::after {
  content: "" !important;
  display: block !important;
  width: 24px !important;
  height: 18px !important;
  background-color: #0066ff !important;
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 23.16 17.04'%3E%3Cpath d='M22.9168 1.43018C22.6713 1.31018 22.5658 1.53918 22.4223 1.65519C22.3733 1.69269 22.3318 1.74169 22.2903 1.78669C21.9317 2.1697 21.5127 2.42121 20.9657 2.39121C20.1657 2.34621 19.4827 2.59771 18.8787 3.20973C18.7502 2.45521 18.3236 2.0047 17.6746 1.71569C17.3351 1.56568 16.9916 1.41518 16.7536 1.08867C16.5876 0.856163 16.5421 0.597155 16.4591 0.341647C16.4061 0.187643 16.3536 0.0301382 16.1761 0.00363739C15.9836 -0.0263635 15.9081 0.135141 15.8326 0.270145C15.5306 0.822162 15.4136 1.43018 15.4251 2.0462C15.4516 3.43174 16.0366 4.53527 17.1991 5.3203C17.3311 5.4103 17.3651 5.5003 17.3236 5.63181C17.2441 5.90231 17.1501 6.16482 17.0671 6.43533C17.0141 6.60784 16.9351 6.64584 16.7501 6.57033C16.1121 6.30383 15.5611 5.90931 15.074 5.4328C14.2475 4.63328 13.5 3.75075 12.568 3.05973C12.349 2.89822 12.13 2.74822 11.9034 2.60522C10.9524 1.68169 12.028 0.923165 12.277 0.833162C12.5375 0.739159 12.3675 0.41615 11.5259 0.42015C10.6844 0.42365 9.91439 0.705658 8.93286 1.08117C8.78935 1.13767 8.63835 1.17867 8.48384 1.21267C7.59332 1.04367 6.66829 1.00617 5.70226 1.11517C3.88321 1.31768 2.43016 2.1777 1.36213 3.64575C0.0790928 5.4103 -0.222916 7.41536 0.146595 9.50642C0.535106 11.7105 1.66014 13.535 3.38869 14.9616C5.18125 16.4406 7.24581 17.1657 9.60138 17.0266C11.0319 16.9441 12.6245 16.7526 14.421 15.2321C14.874 15.4576 15.3496 15.5476 16.1381 15.6151C16.7456 15.6716 17.3306 15.5851 17.7836 15.4911C18.4931 15.3411 18.4441 14.6841 18.1876 14.5636C16.1081 13.595 16.5646 13.9891 16.1496 13.67C17.2061 12.42 18.8202 10.1979 19.3182 7.17235C19.3672 6.83834 19.4297 6.36783 19.4222 6.09732C19.4182 5.93231 19.4562 5.86831 19.6447 5.84931C20.1657 5.78931 20.6712 5.64681 21.1357 5.3913C22.4833 4.65528 23.0268 3.44624 23.1548 1.9972C23.1738 1.77569 23.1508 1.54668 22.9168 1.43018ZM11.1749 14.4736C9.15936 12.889 8.18184 12.3675 7.77832 12.39C7.40081 12.4125 7.46881 12.8445 7.55182 13.126C7.63882 13.404 7.75182 13.5955 7.91033 13.8396C8.01983 14.0011 8.09533 14.2411 7.80083 14.4216C7.15181 14.8231 6.02327 14.2866 5.97027 14.2601C4.65673 13.4865 3.5587 12.4655 2.78467 11.069C2.03715 9.72493 1.60314 8.28289 1.53164 6.74384C1.51264 6.37233 1.62214 6.24082 1.99215 6.17332C2.47916 6.08332 2.98118 6.06432 3.46769 6.13582C5.52476 6.43633 7.27581 7.35586 8.74385 8.8129C9.58188 9.64243 10.2159 10.634 10.8689 11.6025C11.5634 12.631 12.3105 13.611 13.262 14.4146C13.598 14.6961 13.866 14.9101 14.1225 15.0681C13.349 15.1546 12.058 15.1731 11.1749 14.4746L11.1749 14.4736ZM12.141 8.25988C12.141 8.09488 12.273 7.96338 12.439 7.96338C12.4765 7.96338 12.5105 7.97088 12.541 7.98188C12.5825 7.99688 12.6205 8.01938 12.6505 8.05338C12.7035 8.10588 12.7335 8.18088 12.7335 8.25988C12.7335 8.42489 12.6015 8.55639 12.4355 8.55639C12.2695 8.55639 12.141 8.42489 12.141 8.25988ZM15.1415 9.79893C14.949 9.87793 14.7565 9.94544 14.5715 9.95294C14.2845 9.96794 13.9715 9.85143 13.8015 9.70893C13.5375 9.48742 13.3485 9.36342 13.2695 8.97691C13.2355 8.8119 13.2545 8.55639 13.2845 8.40989C13.3525 8.09438 13.277 7.89187 13.0545 7.70787C12.8735 7.55786 12.643 7.51636 12.39 7.51636C12.2955 7.51636 12.209 7.47486 12.1445 7.44136C12.039 7.38886 11.9519 7.25735 12.035 7.09585C12.0615 7.04335 12.19 6.91584 12.22 6.89334C12.5635 6.69784 12.9595 6.76184 13.326 6.90834C13.6655 7.04735 13.9225 7.30236 14.292 7.66287C14.6695 8.09838 14.7375 8.21838 14.9525 8.54539C15.1225 8.8009 15.277 9.06341 15.3831 9.36392C15.4471 9.55142 15.3641 9.70493 15.1415 9.79893Z' fill='%23000'/%3E%3C/svg%3E") no-repeat center / contain !important;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 23.16 17.04'%3E%3Cpath d='M22.9168 1.43018C22.6713 1.31018 22.5658 1.53918 22.4223 1.65519C22.3733 1.69269 22.3318 1.74169 22.2903 1.78669C21.9317 2.1697 21.5127 2.42121 20.9657 2.39121C20.1657 2.34621 19.4827 2.59771 18.8787 3.20973C18.7502 2.45521 18.3236 2.0047 17.6746 1.71569C17.3351 1.56568 16.9916 1.41518 16.7536 1.08867C16.5876 0.856163 16.5421 0.597155 16.4591 0.341647C16.4061 0.187643 16.3536 0.0301382 16.1761 0.00363739C15.9836 -0.0263635 15.9081 0.135141 15.8326 0.270145C15.5306 0.822162 15.4136 1.43018 15.4251 2.0462C15.4516 3.43174 16.0366 4.53527 17.1991 5.3203C17.3311 5.4103 17.3651 5.5003 17.3236 5.63181C17.2441 5.90231 17.1501 6.16482 17.0671 6.43533C17.0141 6.60784 16.9351 6.64584 16.7501 6.57033C16.1121 6.30383 15.5611 5.90931 15.074 5.4328C14.2475 4.63328 13.5 3.75075 12.568 3.05973C12.349 2.89822 12.13 2.74822 11.9034 2.60522C10.9524 1.68169 12.028 0.923165 12.277 0.833162C12.5375 0.739159 12.3675 0.41615 11.5259 0.42015C10.6844 0.42365 9.91439 0.705658 8.93286 1.08117C8.78935 1.13767 8.63835 1.17867 8.48384 1.21267C7.59332 1.04367 6.66829 1.00617 5.70226 1.11517C3.88321 1.31768 2.43016 2.1777 1.36213 3.64575C0.0790928 5.4103 -0.222916 7.41536 0.146595 9.50642C0.535106 11.7105 1.66014 13.535 3.38869 14.9616C5.18125 16.4406 7.24581 17.1657 9.60138 17.0266C11.0319 16.9441 12.6245 16.7526 14.421 15.2321C14.874 15.4576 15.3496 15.5476 16.1381 15.6151C16.7456 15.6716 17.3306 15.5851 17.7836 15.4911C18.4931 15.3411 18.4441 14.6841 18.1876 14.5636C16.1081 13.595 16.5646 13.9891 16.1496 13.67C17.2061 12.42 18.8202 10.1979 19.3182 7.17235C19.3672 6.83834 19.4297 6.36783 19.4222 6.09732C19.4182 5.93231 19.4562 5.86831 19.6447 5.84931C20.1657 5.78931 20.6712 5.64681 21.1357 5.3913C22.4833 4.65528 23.0268 3.44624 23.1548 1.9972C23.1738 1.77569 23.1508 1.54668 22.9168 1.43018ZM11.1749 14.4736C9.15936 12.889 8.18184 12.3675 7.77832 12.39C7.40081 12.4125 7.46881 12.8445 7.55182 13.126C7.63882 13.404 7.75182 13.5955 7.91033 13.8396C8.01983 14.0011 8.09533 14.2411 7.80083 14.4216C7.15181 14.8231 6.02327 14.2866 5.97027 14.2601C4.65673 13.4865 3.5587 12.4655 2.78467 11.069C2.03715 9.72493 1.60314 8.28289 1.53164 6.74384C1.51264 6.37233 1.62214 6.24082 1.99215 6.17332C2.47916 6.08332 2.98118 6.06432 3.46769 6.13582C5.52476 6.43633 7.27581 7.35586 8.74385 8.8129C9.58188 9.64243 10.2159 10.634 10.8689 11.6025C11.5634 12.631 12.3105 13.611 13.262 14.4146C13.598 14.6961 13.866 14.9101 14.1225 15.0681C13.349 15.1546 12.058 15.1731 11.1749 14.4746L11.1749 14.4736ZM12.141 8.25988C12.141 8.09488 12.273 7.96338 12.439 7.96338C12.4765 7.96338 12.5105 7.97088 12.541 7.98188C12.5825 7.99688 12.6205 8.01938 12.6505 8.05338C12.7035 8.10588 12.7335 8.18088 12.7335 8.25988C12.7335 8.42489 12.6015 8.55639 12.4355 8.55639C12.2695 8.55639 12.141 8.42489 12.141 8.25988ZM15.1415 9.79893C14.949 9.87793 14.7565 9.94544 14.5715 9.95294C14.2845 9.96794 13.9715 9.85143 13.8015 9.70893C13.5375 9.48742 13.3485 9.36342 13.2695 8.97691C13.2355 8.8119 13.2545 8.55639 13.2845 8.40989C13.3525 8.09438 13.277 7.89187 13.0545 7.70787C12.8735 7.55786 12.643 7.51636 12.39 7.51636C12.2955 7.51636 12.209 7.47486 12.1445 7.44136C12.039 7.38886 11.9519 7.25735 12.035 7.09585C12.0615 7.04335 12.19 6.91584 12.22 6.89334C12.5635 6.69784 12.9595 6.76184 13.326 6.90834C13.6655 7.04735 13.9225 7.30236 14.292 7.66287C14.6695 8.09838 14.7375 8.21838 14.9525 8.54539C15.1225 8.8009 15.277 9.06341 15.3831 9.36392C15.4471 9.55142 15.3641 9.70493 15.1415 9.79893Z' fill='%23000'/%3E%3C/svg%3E") no-repeat center / contain !important;
  pointer-events: none !important;
}
html.sc-wall-on body[data-ds-dark-theme] [data-slot="sidebar"] [class*="collapsed"] [class*="toggle"]:not(:has([class*="railMark"])):not(:has(.sc-whale-mark))::after,
html.sc-wall-on body[data-ds-dark-theme] [class*="frame"][data-sidebar-collapsed] [data-slot="sidebar"] [class*="toggle"]:not(:has([class*="railMark"])):not(:has(.sc-whale-mark))::after {
  background-color: #4dabf7 !important;
}

/* 展开态：桌面端收起按钮归位到侧边栏卡片顶部右侧，恢复弹性流排版，不遮挡品牌图标 */
[data-windows-titlebar] [class*="logoRow"]:has([class*="brand"]) [class*="toggle"],
[data-windows-titlebar] [class*="root"]:not([class*="collapsed"]) [class*="toggle"],
[data-windows-titlebar] [class*="frame"]:not([data-sidebar-collapsed="true"]) [class*="root"] [class*="toggle"],
[data-windows-titlebar] [class*="frame"]:not([data-sidebar-collapsed="true"]) [data-slot="sidebar"] [class*="toggle"],
[data-windows-titlebar] [data-slot="sidebar"]:not(:has([class*="collapsed"])) [class*="toggle"],
[data-windows-titlebar] [data-slot="sidebar"] [class*="root"]:not([class*="collapsed"]) [class*="toggle"] {
  position: relative !important;
  top: auto !important;
  left: auto !important;
  right: auto !important;
  bottom: auto !important;
  z-index: 5 !important;
  width: 28px !important;
  height: 28px !important;
  margin: 0 !important;
  padding: 0 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  color: var(--dsw-alias-label-secondary) !important;
  border-radius: var(--dsw-radius-sm, 6px) !important;
  flex: 0 0 28px !important;
}
[data-windows-titlebar] [class*="logoRow"]:has([class*="brand"]) [class*="toggle"]:hover,
[data-windows-titlebar] [class*="root"]:not([class*="collapsed"]) [class*="toggle"]:hover,
[data-windows-titlebar] [class*="frame"]:not([data-sidebar-collapsed="true"]) [class*="root"] [class*="toggle"]:hover,
[data-windows-titlebar] [data-slot="sidebar"]:not(:has([class*="collapsed"])) [class*="toggle"]:hover,
[data-windows-titlebar] [data-slot="sidebar"] [class*="root"]:not([class*="collapsed"]) [class*="toggle"]:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(128, 128, 128, 0.14)) !important;
  color: var(--dsw-alias-label-primary) !important;
}
[data-windows-titlebar] [class*="root"]:not([class*="collapsed"]) [class*="logoRow"],
[data-windows-titlebar] [data-slot="sidebar"] [class*="root"]:not([class*="collapsed"]) [class*="logoRow"],
[data-windows-titlebar] [class*="logoRow"]:has([class*="brand"]) {
  height: 40px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 0 4px 0 2px !important;
  margin: 0 0 4px 0 !important;
}

/* 侧边栏内容与导航项半透明悬浮质感 */
html.sc-wall-on [data-slot="sidebar"] [class*="scroll"],
html.sc-wall-on [data-slot="sidebar"] [class*="content"],
html.sc-wall-on [data-slot="sidebar"] [class*="wrapper"]{
  background: transparent !important;
}
html.sc-wall-on [data-slot="sidebar"] [class*="navItem"]{
  border-radius: 12px !important;
  transition: background .15s ease, transform .12s ease !important;
}
html.sc-wall-on [data-slot="sidebar"] [class*="navItem"]:hover{
  background: rgba(255,255,255,.3) !important;
  transform: translateX(2px) !important;
}
html.sc-wall-on body[data-ds-dark-theme] [data-slot="sidebar"] [class*="navItem"]:hover{
  background: rgba(255,255,255,.08) !important;
}
/* 统计行（conversation.composer.dock，含本对话费用/账户余额）：由 JS 移入
   输入卡底部操作行（div.row）中间，与 权限/上传/模型选择/发送按钮 同一水平线、
   垂直居中平齐；输入框长高不受影响，窄窗口下统计行整体省略、悬停显示全部。 */
[data-slot="conversation.composer.dock"]{
  position:relative !important;
  z-index:1 !important;
  flex:1 1 0 !important;
  min-width:0 !important;
  display:flex !important;
  flex-direction:row !important;
  align-items:center !important;
  justify-content:center !important;
  gap:8px !important;
  overflow:hidden !important;
  white-space:nowrap !important;
  margin:0 !important;
  padding:0 6px !important;
  background:transparent !important;
  border:none !important;
  box-shadow:none !important;
  font-size:10.5px !important;
  color:var(--dsw-alias-label-secondary,#3c4350) !important;
}
[data-slot="conversation.composer.dock"] > *{max-width:100%;overflow:hidden;}
/* 自研统计行（同 id shadow 官方 StatsLine）：与官方排版一致
   （label-tertiary 色），全部文本同一文本行 → 颜色与基线天然统一；
   去掉了「工具调用」耗时项。字号较官方大一档（13px）；统计项之间
   用 4 倍不换行空格分隔（比项内「名称 内容」的单个空格宽），无 | 分隔符。 */
.sc-dock-stats{
  box-sizing:border-box;
  min-width:0;
  max-width:100%;
  text-align:center;
  white-space:nowrap;
  text-overflow:ellipsis;
  overflow:hidden;
  color:var(--dsw-alias-label-tertiary,#8a93a3);
  font-size:13px !important;
  line-height:22px !important;
  display:block;
}
/* 设置 → 常规：第三方识图工具策略行（分段选择） */
.sc-vp-row{display:flex;align-items:flex-start;gap:12px;padding:16px 0;border-bottom:1px solid var(--dsw-alias-border-l2);}
.sc-vp-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;padding-right:24px;}
.sc-vp-title{color:var(--dsw-alias-label-primary,#23272e);font-size:14px;font-weight:400;line-height:22px;}
.sc-vp-desc{color:var(--dsw-alias-label-tertiary,#6b7280);font-size:12px;font-weight:400;line-height:18px;}
.sc-vp-control{display:flex;gap:6px;flex:none;align-items:center;}
.sc-vp-btn{font:inherit;font-size:12px;line-height:1;padding:7px 12px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2,rgba(120,130,150,.35));background:transparent;color:var(--dsw-alias-label-secondary,#4c5563);cursor:pointer;white-space:nowrap;transition:background .15s ease,color .15s ease,border-color .15s ease;}
.sc-vp-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.12));}
.sc-vp-btn.on{background:var(--dsw-alias-accent,#4dabf7);border-color:transparent;color:#fff;}
.sc-vp-btn:disabled{opacity:.5;cursor:default;}
/* 底部通栏（任务面板 + 输入框所在卡片）→ 液态玻璃，宽度与会话内容框一致 */
html.sc-wall-on .wSkVaW_composerSeat{background:transparent !important;}
/* 输入框上缘那一排 dock（内核的目标横幅 GoalBar + 本插件的排队条）：
   上面那批「会话容器一律透明」的规则会把 GoalBar 的底色一起剥掉 → 会话正文从它
   背后透出来，看着"不是独立的一行"。这里按 composer 卡同一套玻璃配方把底色补回来，
   并抬 z-index：会话往上滚动时它始终是独立的一行（对齐 dsh-client-ui-goal 的
   conversation.input.dock 槽；:not(.sc-q-dock) 是留给本插件排队条自己的样式）。 */
html.sc-wall-on [data-slot="conversation.input.dock"] > *:not(.sc-q-dock){
  position:relative !important;
  z-index:3 !important;
  background:color-mix(in srgb, #fafbfd 66%, transparent) !important;
  -webkit-backdrop-filter:blur(var(--sc-card-blur, 24px)) saturate(160%) !important;
  backdrop-filter:blur(var(--sc-card-blur, 24px)) saturate(160%) !important;
  border:1px solid color-mix(in srgb, var(--dsw-alias-border-l2, rgba(120,130,150,.35)) 55%, transparent) !important;
  border-radius:14px !important;
}
html.sc-wall-on body[data-ds-dark-theme] [data-slot="conversation.input.dock"] > *:not(.sc-q-dock){
  background:color-mix(in srgb, #161820 66%, transparent) !important;
}
html.sc-wall-on .uV2eYG_card{ background:color-mix(in srgb, #fafbfd 66%, transparent) !important;
  max-width:var(--dsh-my-width) !important;
  -webkit-backdrop-filter:blur(var(--sc-card-blur, 24px)) saturate(160%) !important;
  backdrop-filter:blur(var(--sc-card-blur, 24px)) saturate(160%) !important;
  border-radius:22px !important;
  overflow:hidden !important;
  /* 与消息卡一致：去实体 border，用软 rim 勾勒，避免宽卡边缘「线出头」。
     加上下间距，成为独立悬浮的输入卡（对话框式分栏）。 */
  border:none !important;
  box-shadow:
    0 0 0 1px color-mix(in srgb, rgba(255,255,255,.55) 60%, transparent),
    inset 0 1px 0 rgba(255,255,255,.4),
    0 14px 44px rgba(15,20,30,.2) !important;
  margin: 14px auto 0 !important;
}
html.sc-wall-on body[data-ds-dark-theme] .uV2eYG_card{
  background:color-mix(in srgb, #161820 62%, transparent) !important;
  border:none !important;
  border-radius:22px !important;
  overflow:hidden !important;
  box-shadow:
    0 0 0 1px rgba(255,255,255,.09),
    inset 0 1px 0 rgba(255,255,255,.1),
    0 14px 44px rgba(0,0,0,.32) !important;
}
/* 输入卡内的模型选择/权限/工作区弹层是 absolute 锚在卡内（_menu 根：
   bottom:calc(100%+8px) 向上展开），会被卡片的 overflow:hidden 裁得只剩
   靠触发器的一两项。弹层展开时（触发器 aria-expanded 或存在 _menu 根）
   临时解除裁剪：卡片圆角由背景自身呈现、文本区另有独立圆角，去掉裁剪
   不破外观；收起后自动恢复。暗色规则特异性更高，须并列覆盖。 */
html.sc-wall-on .uV2eYG_card:has([aria-expanded="true"], [class*="_menu"]),
html.sc-wall-on body[data-ds-dark-theme] .uV2eYG_card:has([aria-expanded="true"], [class*="_menu"]){
  overflow: visible !important;
}
/* 输入框文本区顶部圆角：与输入卡圆角拼接处不再露出直角（盒子最上缘圆角） */
html.sc-wall-on [data-slot*="conversation"] [data-composer-seat] [class*="input"]{
  border-top-left-radius:16px !important;
  border-top-right-radius:16px !important;
}
/* 输入卡内文字对比提升：占位符从 caption → secondary；模型选择器、辅助
   说明同步提档，保证在 66% 玻璃上仍清晰可读。 */
html.sc-wall-on [data-slot*="conversation"] [data-composer-seat] [class*="input"]::placeholder{
  color:var(--dsw-alias-label-secondary, #3c4350) !important;
  -webkit-text-fill-color:var(--dsw-alias-label-secondary, #3c4350) !important;
}
html.sc-wall-on [data-slot*="conversation"] [data-composer-seat] [class*="select"]{
  color:var(--dsw-alias-label-secondary, #3c4350) !important;
  font-weight:600 !important;
}
html.sc-wall-on [data-slot*="conversation"] [data-composer-seat] [class*="primary"]{
  box-shadow:0 4px 14px rgba(77,171,247,.45) !important;
}
html.sc-wall-on .uV2eYG_add{background:color-mix(in srgb, #fafbfd 55%, transparent) !important;}
html.sc-wall-on .sc-root{background:transparent !important;}
/* ===== 苹果纯净液态水晶玻璃体系（Unified Liquid Crystal Glass System） =====
   消除所有黑白补丁割裂感：输入卡、上方选择器胶囊、英雄标徽章、弹出菜单
   全部共享同一套晶莹通透、温润高贵的 Apple 液态玻璃材质。 */

/* 1. 「探索未至之境」英雄徽章：高透纯白水晶胶囊（全模式常驻紧凑胶囊） */
html.sc-wall-on [data-slot*="conversation"] [data-composer-seat] [class*="headline"]:not([class*="headlineText"]),
html.sc-wall-on [class*="headline"]:not([class*="headlineText"]){
  display: inline-flex !important;
  flex: 0 0 auto !important;
  align-self: center !important;
  width: fit-content !important;
  max-width: max-content !important;
  margin-left: auto !important;
  margin-right: auto !important;
  padding: 8px 22px 8px 18px !important;
  border-radius: 999px !important;
  background: color-mix(in srgb, #fafbfd 75%, transparent) !important;
  -webkit-backdrop-filter: blur(24px) saturate(180%) !important;
  backdrop-filter: blur(24px) saturate(180%) !important;
  border: 1px solid rgba(255,255,255,.88) !important;
  box-sizing: border-box !important;
  color: #111827 !important;
  text-shadow: none !important;
  align-items: center !important;
  gap: 8px !important;
  will-change: transform, box-shadow;
}
/* 工作模式下：3.4s 呼吸浮沉与悬停微放大（进入 Zen 模式后自动解绑） */
html.sc-wall-on:not(.sc-wall-zen) [data-slot*="conversation"] [data-composer-seat] [class*="headline"]:not([class*="headlineText"]),
html.sc-wall-on:not(.sc-wall-zen) [class*="headline"]:not([class*="headlineText"]){
  animation: sc-whale-breathe 3.4s ease-in-out infinite !important;
  transition: transform .3s ease, box-shadow .3s ease !important;
}
html.sc-wall-on:not(.sc-wall-zen) [data-slot*="conversation"] [data-composer-seat] [class*="headline"]:not([class*="headlineText"]):hover,
html.sc-wall-on:not(.sc-wall-zen) [class*="headline"]:not([class*="headlineText"]):hover{
  animation-play-state: paused !important;
  transform: translateY(-5px) scale(1.08) !important;
  box-shadow: inset 0 2px 2px 0 rgba(255,255,255,1), 0 18px 42px rgba(0,102,255,.35), 0 0 28px 8px rgba(77,107,254,.35) !important;
}
html.sc-wall-on [data-slot*="conversation"] [data-composer-seat] [class*="headline"],
html.sc-wall-on [class*="headline"]{
  color: #111827 !important;
  font-weight: 600 !important;
}
html.sc-wall-on [data-slot*="conversation"] [data-composer-seat] [class*="fish"],
html.sc-wall-on [class*="fish"]{
  color: #0066ff !important;
  animation: sc-whale-icon-bob 3.4s ease-in-out infinite !important;
  display: inline-block !important;
  transform-origin: center !important;
}
html.sc-wall-on [data-slot*="conversation"] [data-composer-seat] [class*="previewBadge"],
html.sc-wall-on [class*="previewBadge"]{
  background: rgba(0,102,255,.08) !important;
  border: 1px solid rgba(0,102,255,.24) !important;
  color: #0066ff !important;
  -webkit-backdrop-filter: blur(10px) !important;
  backdrop-filter: blur(10px) !important;
  box-shadow: none !important;
  font-weight: 600 !important;
  padding: 2px 8px !important;
  border-radius: 999px !important;
}
html.sc-wall-on body[data-ds-dark-theme] [data-slot*="conversation"] [data-composer-seat] [class*="headline"]:not([class*="headlineText"]),
html.sc-wall-on body[data-ds-dark-theme] [class*="headline"]:not([class*="headlineText"]){
  background: color-mix(in srgb, #141722 72%, transparent) !important;
  border: 1px solid rgba(255,255,255,.18) !important;
  color: #f3f4f6 !important;
}
html.sc-wall-on:not(.sc-wall-zen) body[data-ds-dark-theme] [data-slot*="conversation"] [data-composer-seat] [class*="headline"]:not([class*="headlineText"]),
html.sc-wall-on:not(.sc-wall-zen) body[data-ds-dark-theme] [class*="headline"]:not([class*="headlineText"]){
  animation: sc-whale-breathe-dark 3.4s ease-in-out infinite !important;
}
html.sc-wall-on body[data-ds-dark-theme] [data-slot*="conversation"] [data-composer-seat] [class*="headline"],
html.sc-wall-on body[data-ds-dark-theme] [class*="headline"]{
  color: #f3f4f6 !important;
}

/* 1b. 英雄屏「工作区」选择器（📁 dsh chip）：默认透明底 + 深字，落在深色壁纸上
   几乎不可见。这里提亮为高透纯白水晶胶囊，文件夹图标与文字用深色，圆角胶囊。 */
html.sc-wall-on [data-slot*="conversation"] [data-composer-seat] [class*="heroWorkspaceRow"] button[class*="workspace"]{
  background: color-mix(in srgb, #fafbfd 78%, transparent) !important;
  -webkit-backdrop-filter: blur(22px) saturate(180%) !important;
  backdrop-filter: blur(22px) saturate(180%) !important;
  border: 1px solid rgba(255,255,255,.9) !important;
  border-radius: 999px !important;
  box-shadow: inset 0 1.5px 1px 0 rgba(255,255,255,.95), 0 10px 28px rgba(15,20,30,.14) !important;
  color: #111827 !important;
  font-weight: 600 !important;
  margin: 2px 0 !important;
  padding: 2px 10px 2px 8px !important;
  min-height: 28px !important;
  transition: all .15s ease !important;
}
html.sc-wall-on [data-slot*="conversation"] [data-composer-seat] [class*="heroWorkspaceRow"] button[class*="workspace"] [class*="folder"],
html.sc-wall-on [data-slot*="conversation"] [data-composer-seat] [class*="heroWorkspaceRow"] button[class*="workspace"] [class*="workspaceLabel"]{
  color: #0b1220 !important;
}
html.sc-wall-on [data-slot*="conversation"] [data-composer-seat] [class*="heroWorkspaceRow"] button[class*="workspace"] [class*="chevron"]{
  color: #3c4350 !important;
}
html.sc-wall-on [data-slot*="conversation"] [data-composer-seat] [class*="heroWorkspaceRow"] button[class*="workspace"]:hover,
html.sc-wall-on [data-slot*="conversation"] [data-composer-seat] [class*="heroWorkspaceRow"] button[class*="workspace"][aria-expanded="true"]{
  background: color-mix(in srgb, #ffffff 96%, transparent) !important;
  border-color: rgba(255,255,255,1) !important;
}
html.sc-wall-on body[data-ds-dark-theme] [data-slot*="conversation"] [data-composer-seat] [class*="heroWorkspaceRow"] button[class*="workspace"]{
  background: color-mix(in srgb, #161922 74%, transparent) !important;
  border: 1px solid rgba(255,255,255,.2) !important;
  box-shadow: inset 0 1.5px 1px 0 rgba(255,255,255,.28), 0 12px 32px rgba(0,0,0,.5) !important;
  color: #f3f4f6 !important;
}
html.sc-wall-on body[data-ds-dark-theme] [data-slot*="conversation"] [data-composer-seat] [class*="heroWorkspaceRow"] button[class*="workspace"] [class*="folder"],
html.sc-wall-on body[data-ds-dark-theme] [data-slot*="conversation"] [data-composer-seat] [class*="heroWorkspaceRow"] button[class*="workspace"] [class*="workspaceLabel"]{
  color: #ffffff !important;
}

/* 2. 精简输入框上方小标签（工作区/预设选择），确保新会话英雄卡片与输入框正常呈现 */
html.sc-wall-on [data-slot*="conversation"] [data-composer-seat] [data-slot="conversation.hero.workspace"],
html.sc-wall-on [data-slot*="conversation"] [data-composer-seat] [data-slot="conversation.hero.agentPreset"],
html.sc-wall-on [data-slot*="conversation"] [data-composer-seat] [class*="workspacePicker"],
html.sc-wall-on [data-slot*="conversation"] [data-composer-seat] [class*="agentPresetPicker"],
html.sc-wall-on [data-slot*="conversation"] [data-composer-seat] [class*="presetSelector"],
html.sc-wall-on [data-slot*="conversation"] [data-composer-seat] > div:first-child span[class*="sep"],
html.sc-wall-on [data-slot*="conversation"] [data-composer-seat] > div:first-child div[class*="divider"],
html.sc-wall-on [data-slot*="conversation"] [data-composer-seat] > div:first-child [class*="dash"]{
  display: none !important;
}

/* 3. 模型选择弹出菜单 / 下拉框（Popover & Dropdown Menu）：高透纯白水晶玻璃浮窗 */
html.sc-wall-on [data-radix-popper-content-wrapper] > div,
html.sc-wall-on [role="menu"],
html.sc-wall-on [role="dialog"][class*="popover"],
html.sc-wall-on [class*="popover"],
html.sc-wall-on [class*="popMenu"],
html.sc-wall-on [class*="dropdown-menu"]{
  background: color-mix(in srgb, #fafbfd 85%, transparent) !important;
  -webkit-backdrop-filter: blur(32px) saturate(190%) contrast(102%) !important;
  backdrop-filter: blur(32px) saturate(190%) contrast(102%) !important;
  border: 1px solid rgba(255,255,255,.85) !important;
  border-radius: 18px !important;
  box-shadow: inset 0 1.5px 1px 0 rgba(255,255,255,.9), 0 24px 60px rgba(15,20,30,.22) !important;
  color: #111827 !important;
  padding: 6px !important;
}
html.sc-wall-on [data-radix-popper-content-wrapper] [role="menuitem"],
html.sc-wall-on [role="menu"] [role="menuitem"],
html.sc-wall-on [class*="popover"] button,
html.sc-wall-on [class*="popMenu"] button{
  color: #1f2937 !important;
  border-radius: 10px !important;
  padding: 8px 12px !important;
  transition: all .15s ease !important;
}
html.sc-wall-on [data-radix-popper-content-wrapper] [role="menuitem"]:hover,
html.sc-wall-on [role="menu"] [role="menuitem"]:hover,
html.sc-wall-on [class*="popover"] button:hover,
html.sc-wall-on [class*="popMenu"] button:hover{
  background: rgba(0, 102, 255, 0.10) !important;
  color: #0066ff !important;
}
html.sc-wall-on body[data-ds-dark-theme] [data-radix-popper-content-wrapper] > div,
html.sc-wall-on body[data-ds-dark-theme] [role="menu"],
html.sc-wall-on body[data-ds-dark-theme] [class*="popover"]{
  background: color-mix(in srgb, #161822 84%, transparent) !important;
  border: 1px solid rgba(255,255,255,.16) !important;
  box-shadow: inset 0 1.5px 1px 0 rgba(255,255,255,.22), 0 24px 60px rgba(0,0,0,.5) !important;
  color: #f3f4f6 !important;
}
html.sc-wall-on body[data-ds-dark-theme] [data-radix-popper-content-wrapper] [role="menuitem"],
html.sc-wall-on body[data-ds-dark-theme] [role="menu"] [role="menuitem"]{
  color: #e5e7eb !important;
}

/* 4. 输入卡底部按钮：纯白晶莹圆钮、权限胶囊与流光发送按钮。
   注意：一律用 button[class*=…] 定位真实按钮，避免把按钮内部的
   *_triggerLabel / *_triggerIcon / *_triggerEffort 这类 span 也命中，
   否则每个 span 都会套一层白圈 → 出现「圆中圆／双环」叠圈问题。 */
html.sc-wall-on [data-slot*="conversation"] [data-composer-seat] button[class*="trigger"],
html.sc-wall-on [data-slot*="conversation"] [data-composer-seat] button[class*="select"],
html.sc-wall-on [data-slot*="conversation"] [data-composer-seat] button[class*="add"]{
  background: color-mix(in srgb, #fafbfd 70%, transparent) !important;
  border: 1px solid rgba(255,255,255,.8) !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.85), 0 2px 8px rgba(15,20,30,.06) !important;
  color: #374151 !important;
  border-radius: 999px !important;
  transition: all .15s ease !important;
  /* 清除内部 span 可能继承到的环状描边，统一由外层按钮呈现胶囊 */
}
html.sc-wall-on [data-slot*="conversation"] [data-composer-seat] button[class*="trigger"]:hover,
html.sc-wall-on [data-slot*="conversation"] [data-composer-seat] button[class*="select"]:hover,
html.sc-wall-on [data-slot*="conversation"] [data-composer-seat] button[class*="add"]:hover{
  background: color-mix(in srgb, #ffffff 90%, transparent) !important;
  color: #0066ff !important;
  border-color: rgba(255,255,255,1) !important;
}
/* 防御：把权限/模型按钮内部命中过 trigger 的 span 还原为无环文字，
   彻底杜绝「圆中圆」。 */
html.sc-wall-on [data-slot*="conversation"] [data-composer-seat] button[class*="trigger"] [class*="triggerLabel"],
html.sc-wall-on [data-slot*="conversation"] [data-composer-seat] button[class*="trigger"] [class*="triggerEffort"],
html.sc-wall-on [data-slot*="conversation"] [data-composer-seat] button[class*="trigger"] [class*="triggerIcon"]{
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
}
html.sc-wall-on [data-slot*="conversation"] [data-composer-seat] [class*="send"],
html.sc-wall-on [data-slot*="conversation"] [data-composer-seat] button[class*="primary"]{
  background: linear-gradient(135deg, #0077ff, #00d2ff) !important;
  border: 1px solid rgba(255,255,255,.5) !important;
  box-shadow: 0 4px 16px rgba(0,119,255,.45) !important;
  color: #ffffff !important;
}
html.sc-wall-on [data-slot*="conversation"] [data-composer-seat] [class*="send"]:hover,
html.sc-wall-on [data-slot*="conversation"] [data-composer-seat] button[class*="primary"]:hover{
  filter: brightness(1.1) !important;
  box-shadow: 0 6px 22px rgba(0,119,255,.55) !important;
}
/* 壁纸设置弹窗：预览（宽高比由面板按视口比例计算，保证裁切与真实壁纸一致） */
.sc-wall-preview{position:relative;border-radius:16px;overflow:hidden;flex:none;border:1px solid color-mix(in srgb, var(--dsw-alias-border-l2, rgba(120,130,150,.3)) 55%, transparent);background:color-mix(in srgb, var(--dsw-alias-bg-base) 30%, transparent);cursor:grab;touch-action:none;user-select:none;margin:0 auto;}
.sc-wall-preview.dragging{cursor:grabbing;}
.sc-wall-preview .bg{position:absolute;inset:-4%;background-position:center;background-size:cover;filter:blur(22px) saturate(140%) brightness(.85);}
.sc-wall-preview img{position:absolute;display:block;}
.sc-wall-preview .mask{position:absolute;inset:0;}
.sc-wall-preview .hint{position:absolute;left:50%;bottom:8px;transform:translateX(-50%);font-size:11px;line-height:1;padding:5px 10px;border-radius:999px;color:var(--dsw-alias-label-secondary,#4c5563);background:color-mix(in srgb, var(--dsw-alias-bg-layer-1,#ffffff) 72%, transparent);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);pointer-events:none;white-space:nowrap;}
/* 会话顶栏壁纸按钮（Session log 旁） */
.sc-hdr-btn{display:inline-flex;align-items:center;gap:5px;border:1px solid color-mix(in srgb, var(--dsw-alias-border-l2, rgba(120,130,150,.3)) 60%, transparent);background:color-mix(in srgb, var(--dsw-alias-bg-layer-1, #ffffff) 55%, transparent);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);color:var(--dsw-alias-label-secondary,#4c5563);font:inherit;font-size:12px;line-height:1;padding:6px 11px;border-radius:999px;cursor:pointer;transition:background .15s ease,color .15s ease;white-space:nowrap;}
.sc-hdr-btn:hover{background:color-mix(in srgb, var(--dsw-alias-bg-layer-1, #ffffff) 88%, transparent);color:var(--dsw-alias-label-primary,#23272e);}
.sc-hdr-btn.on{background:var(--dsw-alias-accent,#4dabf7);color:#fff;border-color:transparent;}
/* 侧栏底部「重启」按钮（sidebar.footer.action 行，与设置按钮同排右侧） */
.sc-restart-btn{box-sizing:border-box;cursor:pointer;height:34px;color:var(--dsw-alias-label-primary,#23272e);background:transparent;border:none;border-radius:12px;flex:none;align-items:center;gap:8px;margin:4px 2px;padding:6px 10px;font-family:inherit;font-size:14px;line-height:22px;display:inline-flex;overflow:hidden;white-space:nowrap;}
.sc-restart-btn:hover{background:var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,.14));}
.sc-restart-btn:disabled{opacity:.5;cursor:default;}
.sc-restart-btn .ic{flex:none;font-size:15px;line-height:1;}
.sc-restart-btn.rail{border-radius:50%;justify-content:center;width:36px;height:36px;margin:4px auto;padding:0;}
.sc-restart-btn.rail .lb{display:none;}
/* ===== 侧栏脚区横排：设置按钮占满剩余宽度，重启按钮贴其右侧 =====
   官方脚区（.footArea）默认纵向堆叠：footerActions 行在上、settingsArea 在下。
   这里改为一行：settingsArea(order 0, flex:1) + footerActions(order 1, flex:none)，
   于是「⟳ 重启」出现在「⚙️ 设置」右侧。类名用 [class*="后缀"] 匹配，
   对 CSS Modules 的哈希前缀变化免疫（本地名后缀是稳定的）。 */
/* ===== 侧栏脚区横排：设置按钮与重启按钮各按自然宽度并排，不占满底栏 =====
   官方脚区（.footArea）默认纵向堆叠：footerActions 行在上、settingsArea 在下。
   这里改为一行，两个按钮都是紧凑内容宽度（图标+文字各自成组、不可拆散），
   中间留 6px 间隙，底栏剩余空间留白。类名用 [class*="后缀"] 匹配，
   对 CSS Modules 的哈希前缀变化免疫（本地名后缀是稳定的）。 */
[data-slot="sidebar"] [class*="footArea"]{flex-direction:row !important;align-items:center !important;gap:6px !important;}
[data-slot="sidebar"] [class*="settingsArea"]{order:0 !important;flex:none !important;width:auto !important;min-width:0 !important;}
[data-slot="sidebar"] [class*="footerActions"]{order:1 !important;flex:none !important;width:auto !important;min-width:0 !important;}
[data-slot="sidebar"] [data-slot="sidebar.settings"] button[class*="trigger"]{width:auto !important;margin:4px 0 !important;}
[data-slot="sidebar"] .sc-restart-btn{flex:none;margin:4px 0 !important;}
/* ===== 侧边栏收起（rail）后脚区改为竖排图标列：设置 / 重启 / 检查更新 =====
   展开态本插件把 footArea 强制为横排（row）；收起态恢复纵向堆叠，三个按钮
   各显示为 36px 圆形图标、不显示文字（官方设置触发自带 rail 形态；重启与
   检查更新由各自插件加 .rail 类）。顺序与展开态一致：设置在上、重启/检查
   更新在下（settingsArea order -1 置顶，footerActions 内部改 column 竖排）。
   类名后缀匹配对 CSS Modules 哈希前缀变化免疫（官方类名后缀稳定）。 */
[data-slot="sidebar"] [class*="collapsed"] [class*="footArea"]{flex-direction:column !important;align-items:center !important;gap:4px !important;justify-content:flex-start !important;}
[data-slot="sidebar"] [class*="collapsed"] [class*="settingsArea"]{order:-1 !important;flex:none !important;width:auto !important;min-width:0 !important;}
[data-slot="sidebar"] [class*="collapsed"] [class*="footerActions"]{order:0 !important;flex:none !important;width:auto !important;min-width:0 !important;flex-direction:column !important;gap:4px !important;align-items:center !important;}
[data-slot="sidebar"] [class*="collapsed"] [data-slot="sidebar.settings"] button[class*="trigger"]{width:36px !important;height:36px !important;margin:4px 0 !important;padding:0 !important;justify-content:center !important;gap:0 !important;border-radius:50% !important;}
/* ===== 侧栏脚区「模式」切换（sidebar.footer.mode，位于设置/重启左侧） =====
   脚区首个子元素是模式切换按钮（Agent preset 选择）；与设置/重启同排、
   同高对齐，折叠为轨道时随 footArea 隐藏（宽态才渲染）。 */
[data-slot="sidebar"] [class*="footArea"] > button{margin:4px 0 !important;max-width:min(150px,100%) !important;}
/* ===== 官方设置弹窗包含块彻底修复（Settings Dialog Containing Block Fix） =====
   当设置弹窗（挂载在 sidebar.settings 内）打开时，解除包含块与溢出裁剪限制：
   1. 祖先 AppFrame 及 .pI_x6G_frame 解除 contain: layout style 与 will-change
   2. 侧边栏主体 [data-slot="sidebar"] 及其所有父层 div 解除 contain: layout paint、transform、will-change 与 overflow 裁剪
   3. 侧边栏提升至最高层级 z-index: 10000，确保 fixed 遮罩与 800px 弹窗完整覆盖视口并居中呈现
   4. 支持双重激活检测：:has([role="dialog"]) 原生 CSS 选择器与 sc-settings-open 类名 */
html:has([data-slot="sidebar"] [role="dialog"]) [class*="frame"],
html:has([data-slot="sidebar"] [role="dialog"]) .pI_x6G_frame,
html.sc-settings-open [class*="frame"],
html.sc-settings-open .pI_x6G_frame {
  contain: none !important;
  will-change: auto !important;
}

html:has([data-slot="sidebar"] [role="dialog"]) [data-slot="sidebar"],
html:has([data-slot="sidebar"] [role="dialog"]) [data-slot="sidebar"] *:has([role="dialog"]),
html:has([data-slot="sidebar"] [class*="overlay"]) [data-slot="sidebar"],
html:has([data-slot="sidebar"] [class*="overlay"]) [data-slot="sidebar"] *:has([class*="overlay"]),
html.sc-settings-open [data-slot="sidebar"],
html.sc-settings-open [data-slot="sidebar"] *:has([role="dialog"]),
[data-slot="sidebar"]:has([role="dialog"]),
[data-slot="sidebar"]:has([role="dialog"]) *:has([role="dialog"]) {
  transform: none !important;
  transform-origin: initial !important;
  -webkit-backdrop-filter: none !important;
  backdrop-filter: none !important;
  filter: none !important;
  transition: none !important;
  overflow: visible !important;
  contain: none !important;
  will-change: auto !important;
}

html:has([data-slot="sidebar"] [role="dialog"]) [data-slot="sidebar"],
html.sc-settings-open [data-slot="sidebar"],
[data-slot="sidebar"]:has([role="dialog"]) {
  z-index: 10000 !important;
}

[data-slot="sidebar"] [class*="_overlay"],
[data-slot="sidebar"] [role="presentation"]:has(> [role="dialog"]) {
  position: fixed !important;
  inset: 0 !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 10000 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  pointer-events: auto !important;
}

[data-slot="sidebar"] [class*="_mask"] {
  position: fixed !important;
  inset: 0 !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  background: var(--dsw-alias-bg-mask-1, rgba(0, 0, 0, 0.45)) !important;
  -webkit-backdrop-filter: var(--dsw-mask-blur, blur(12px)) !important;
  backdrop-filter: var(--dsw-mask-blur, blur(12px)) !important;
  z-index: 0 !important;
  pointer-events: auto !important;
}

[data-slot="sidebar"] [class*="_panel"][role="dialog"],
[data-slot="sidebar"] [role="dialog"][aria-modal="true"],
[data-slot="sidebar"] [role="dialog"]:not([class*="popover"]):not([role="menu"]) {
  width: 800px !important;
  max-width: calc(100vw - 48px) !important;
  height: min(800px, calc(100vh - 48px)) !important;
  background: color-mix(in srgb, #fafbfd 95%, transparent) !important;
  -webkit-backdrop-filter: blur(36px) saturate(180%) contrast(102%) !important;
  backdrop-filter: blur(36px) saturate(180%) contrast(102%) !important;
  border: 1px solid rgba(255,255,255,.85) !important;
  border-radius: 24px !important;
  box-shadow: inset 0 1.5px 1px 0 rgba(255,255,255,.9), 0 28px 80px rgba(15,20,30,.28) !important;
  display: flex !important;
  position: relative !important;
  z-index: 1 !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
  pointer-events: auto !important;
}

body[data-ds-dark-theme] [data-slot="sidebar"] [class*="_panel"][role="dialog"],
body[data-ds-dark-theme] [data-slot="sidebar"] [role="dialog"][aria-modal="true"],
body[data-ds-dark-theme] [data-slot="sidebar"] [role="dialog"]:not([class*="popover"]):not([role="menu"]) {
  background: color-mix(in srgb, #161822 95%, transparent) !important;
  border: 1px solid rgba(255,255,255,.16) !important;
  box-shadow: inset 0 1.5px 1px 0 rgba(255,255,255,.22), 0 28px 80px rgba(0,0,0,.6) !important;
}

[data-slot="sidebar"] [class*="_panel"] nav[class*="nav"],
[data-slot="sidebar"] [role="dialog"] nav[class*="nav"] {
  width: 188px !important;
  min-width: 188px !important;
  max-width: 188px !important;
  flex: 0 0 188px !important;
  box-sizing: border-box !important;
  display: flex !important;
  flex-direction: column !important;
}

[data-slot="sidebar"] [class*="_panel"] [class*="navLabel"],
[data-slot="sidebar"] [role="dialog"] [class*="navLabel"] {
  width: auto !important;
  flex: 1 1 0 !important;
  min-width: 0 !important;
}

[data-slot="sidebar"] [class*="_panel"] div[class*="content"],
[data-slot="sidebar"] [role="dialog"] div[class*="content"] {
  flex: 1 1 auto !important;
  min-width: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
}

[data-slot="sidebar"] [class*="_panel"] [class*="options"],
[data-slot="sidebar"] [role="dialog"] [class*="options"] {
  flex: 1 1 auto !important;
  min-height: 0 !important;
  overflow-y: auto !important;
}
/* ===== 附件浮动栏（conversation.input.dock，悬浮于输入框上边缘） ===== */
.sc-att-dock{box-sizing:border-box;width:calc(100% - var(--dsh-composer-side-clearance, 0px) * 2 - var(--dsh-composer-dock-inset, 8px) * 2);max-width:calc(var(--dsh-composer-card-max-width, 720px) - var(--dsh-composer-dock-inset, 8px) * 2);margin:0 auto calc(0px - var(--dsh-composer-stack-gap, 8px) - 3px);padding:0 var(--dsh-composer-dock-inset, 8px);flex:none;position:relative;z-index:2;}
.sc-att-panel{display:flex;gap:8px;align-items:center;padding:8px;border-radius:12px 12px 0 0;background:color-mix(in srgb, var(--dsw-specific-tip, var(--dsw-alias-bg-layer-1, #ffffff)) 82%, transparent);-webkit-backdrop-filter:blur(16px) saturate(160%);backdrop-filter:blur(16px) saturate(160%);border:1px solid color-mix(in srgb, var(--dsw-alias-border-l1, rgba(120,130,150,.3)) 60%, transparent);border-bottom:none;overflow-x:auto;overflow-y:hidden;scrollbar-width:thin;}
.sc-att{position:relative;flex:none;width:56px;height:56px;border-radius:10px;cursor:pointer;}
.sc-att img{width:56px;height:56px;object-fit:cover;border-radius:10px;display:block;border:1px solid color-mix(in srgb, var(--dsw-alias-border-l2, rgba(120,130,150,.35)) 55%, transparent);background:color-mix(in srgb, var(--dsw-alias-bg-base) 30%, transparent);}
.sc-att:hover img{box-shadow:0 4px 14px rgba(15,20,30,.25);}
.sc-att-x{position:absolute;top:-7px;right:-7px;width:20px;height:20px;border:none;border-radius:50%;background:var(--dsw-alias-danger,#e5484d);color:#fff;font-size:11px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.35);transition:transform .12s ease;}
.sc-att-x:hover{transform:scale(1.15);}
/* 点击放大预览（页面级 overlay） */
.sc-preview{position:relative;max-width:92vw;max-height:86vh;display:flex;align-items:center;justify-content:center;}
.sc-preview img{max-width:92vw;max-height:86vh;object-fit:contain;border-radius:18px;box-shadow:0 24px 80px rgba(8,12,20,.45);background:color-mix(in srgb, var(--dsw-alias-bg-layer-1,#ffffff) 8%, transparent);cursor:zoom-out;}
.sc-preview .sc-preview-label{position:absolute;left:0;right:0;bottom:-32px;text-align:center;font-size:12px;opacity:.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--dsw-alias-label-secondary,#4c5563);max-width:100%;}
/* ===== 四框等宽对齐（会话列 / 输入卡 / 排队条 / 任务面板）：统一规划 =====
   不依赖官方变量链（避免继承/覆盖失效），用插件自有变量 --dsh-my-width：
   每个框 width:100% + max-width 同值 + 居中；输入栏容器左右内边距归零，
   使所有框外宽 = min(容器宽, --dsh-my-width)，绝对对齐。 */
:root{--dsh-my-width:min(1280px, calc(100vw - 160px));}
/* 英雄屏输入卡纳入同一宽度体系：默认 812px（--dsh-composer-card-max-width
   780 + 2×clearance 16），宽屏下比会话列（--dsh-my-width=1280）窄 468px，
   与对话中的输入卡不同轴、不同宽；这里统一为 var(--dsh-my-width)。 */
[data-slot*="conversation"] [data-composer-seat] [class*="composerHero"]{
  box-sizing:border-box !important;
  width:100% !important;
  max-width:var(--dsh-my-width) !important;
  margin-left:auto !important;
  margin-right:auto !important;
}
[data-slot="conversation.session"] [class*="column"]{
  box-sizing:border-box !important;
  width:100% !important;
  max-width:var(--dsh-my-width) !important;
  margin-left:auto !important;
  margin-right:auto !important;
  /* 去掉列自身 1px 边框：否则在内容/头部右缘形成一条竖直细线「出头」 */
  border:none !important;
}
/* 会话列外层滚动容器的左右内边距归零：列 width:100% 才能与输入卡
   同样按容器全宽取 min(容器宽, --dsh-my-width)，否则窄 64px；
   配合 column 的 border-box，玻璃卡片外宽与输入卡/排队条完全一致。 */
[data-slot="conversation.session"] [class*="scroll"]{
  padding-left:0 !important;
  padding-right:0 !important;
}
[data-slot*="conversation"] [data-composer-seat] [class*="card"]{
  width:100% !important;
  max-width:var(--dsh-my-width) !important;
}
[data-slot*="conversation"] [data-composer-seat] [class*="root"]{padding-left:0 !important;padding-right:0 !important;}
[data-slot="conversation.input.dock"] > [class*="root"],
[data-slot="conversation.input.dock"] > [class*="dock"]{
  width:100% !important;
  max-width:var(--dsh-my-width) !important;
  padding-left:0 !important;
  padding-right:0 !important;
  margin-left:auto !important;
  margin-right:auto !important;
}
/* ===== GoalBar（进行中的目标条）纳入四框宽度体系 =====
   官方 GoalBar 是两层：外层 dock（nLMEza_dock，带 data-goal-bar）只管
   容器，内层 bar（nLMEza_bar）才是有背景的可见条，自带
   max-width:calc(var(--dsh-composer-card-max-width) - 4*var(--dsh-composer-dock-inset))
   ≈ 748px —— 只改 dock 不会生效（这就是上轮「看起来还是原宽度」的原因），
   所以 dock 与 bar 两层都要压到 --dsh-my-width。 */
[data-goal-bar]{
  box-sizing:border-box !important;
  width:100% !important;
  max-width:var(--dsh-my-width) !important;
  padding-left:0 !important;
  padding-right:0 !important;
  margin-left:auto !important;
  margin-right:auto !important;
}
[data-goal-bar] > div{
  box-sizing:border-box !important;
  width:100% !important;
  max-width:var(--dsh-my-width) !important;
}
/* ===== 重启后「欢迎回来」艺术字提示 ===== */
.sc-welcome{position:fixed;inset:0;z-index:1070;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse at center, rgba(77,107,254,.10) 0%, rgba(8,12,20,.42) 75%);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);animation:sc-fade .3s ease;cursor:pointer;}
.sc-welcome-card{position:relative;padding:46px 72px 40px;border-radius:30px;background:color-mix(in srgb, var(--dsw-alias-bg-layer-1,#ffffff) 80%, transparent);-webkit-backdrop-filter:blur(32px) saturate(175%);backdrop-filter:blur(32px) saturate(175%);border:1px solid rgba(255,255,255,.55);box-shadow:inset 0 1px 0 rgba(255,255,255,.6),0 30px 90px rgba(8,12,20,.38);text-align:center;overflow:hidden;animation:sc-pop .5s cubic-bezier(.22,.61,.36,1);}
.sc-welcome-title{position:relative;font-size:54px;font-weight:800;letter-spacing:.08em;display:flex;justify-content:center;gap:3px;filter:drop-shadow(0 8px 22px rgba(77,107,254,.4));}
.sc-welcome-title span{display:inline-block;background:linear-gradient(120deg,#4dabf7 0%,#9775fa 48%,#ff6b6b 100%);-webkit-background-clip:text;background-clip:text;color:transparent;animation:sc-wc-in .62s cubic-bezier(.22,.61,.36,1) both;animation-delay:calc(var(--i) * 95ms + 140ms);}
@keyframes sc-wc-in{from{opacity:0;transform:translateY(28px) scale(.65) rotate(-10deg);filter:blur(8px);}to{opacity:1;transform:none;filter:blur(0);}}
.sc-welcome-sub{margin-top:16px;font-size:14px;font-weight:500;color:var(--dsw-alias-label-secondary,#4c5563);letter-spacing:.22em;text-indent:.22em;opacity:0;animation:sc-wc-sub 1.1s ease .95s both;}
@keyframes sc-wc-sub{from{opacity:0;transform:translateY(10px);}to{opacity:.85;transform:none;}}
.sc-welcome-shine{position:absolute;top:-10%;bottom:-10%;width:34%;background:linear-gradient(105deg,transparent 0%,rgba(255,255,255,.6) 50%,transparent 100%);transform:skewX(-18deg);animation:sc-wc-shine 1.9s ease .6s infinite;pointer-events:none;}
@keyframes sc-wc-shine{from{left:-45%;}to{left:125%;}}
.sc-welcome-spark{position:absolute;font-size:13px;color:#ffd43b;opacity:0;animation:sc-wc-spark 2.6s ease-in-out infinite;pointer-events:none;text-shadow:0 0 10px rgba(255,212,59,.9);}
@keyframes sc-wc-spark{0%{opacity:0;transform:translateY(12px) scale(.35);}28%{opacity:1;}100%{opacity:0;transform:translateY(-52px) scale(1.2) rotate(24deg);}}
/* ===== 排队条（自定义，替换官方 QueueDock）：↑↓ 调序 + 独立「发送」按钮 =====
   队列条与输入卡之间有间距、独立成框，四角全部圆角（此前只有上圆角 +
   无下边框，下边是直角，与四框风格不一致）。 */
.sc-q-dock{box-sizing:border-box;flex:none;border-radius:14px;}
.sc-q-panel{background:var(--dsw-specific-tip);border-radius:14px;width:100%;padding:3px 0;position:relative;overflow:hidden;border:1px solid color-mix(in srgb, var(--dsw-alias-border-l1, rgba(120,130,150,.3)) 60%, transparent);}
.sc-q-header{box-sizing:border-box;width:100%;height:32px;color:var(--dsw-alias-label-primary);text-align:left;cursor:pointer;background:none;border:none;border-radius:8px;align-items:center;gap:10px;padding:0 18px;display:flex;font:inherit;font-size:13px;}
.sc-q-header:hover{background:var(--dsw-alias-interactive-bg-hover);}
.sc-q-count{flex:1;min-width:0;font-weight:600;letter-spacing:.02em;}
.sc-q-chevron{opacity:.6;}
.sc-q-list{max-height:196px;margin:0;padding:0;list-style:none;overflow-y:auto;overflow-x:hidden;}
.sc-q-row{display:flex;align-items:center;gap:10px;width:100%;min-width:0;box-sizing:border-box;min-height:32px;padding:2px 18px;}
.sc-q-row + .sc-q-row{box-shadow:inset 0 1px 0 var(--dsw-alias-border-l1, rgba(120,130,150,.18));}
.sc-q-num{flex:none;min-width:16px;text-align:center;font-size:12px;font-weight:700;line-height:16px;color:var(--dsw-alias-label-caption,#8a93a3);font-variant-numeric:tabular-nums;}
.sc-q-preview{flex:1;min-width:0;font-size:13px;line-height:20px;color:var(--dsw-alias-label-primary-dimmed);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sc-q-editor{flex:1;min-width:0;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);height:26px;color:var(--dsw-alias-label-primary);border-radius:7px;outline:none;padding:0 8px;font:inherit;font-size:13px;}
.sc-q-actions{flex:none;display:flex;align-items:center;gap:6px;}
.sc-q-btn{width:26px;height:26px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:none;border:none;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:13px;line-height:1;padding:0;}
.sc-q-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);}
.sc-q-btn:disabled{opacity:.32;cursor:default;}
.sc-q-btn.danger{color:var(--dsw-alias-danger,#e5484d);}
/* ↑ 上移：醒目圆形强调钮（浅色底 + 强调色箭头，悬停变实心） */
.sc-q-up{width:28px;height:28px;border:none;border-radius:50%;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;line-height:1;padding:0;color:var(--dsw-alias-accent,#4dabf7);background:color-mix(in srgb, var(--dsw-alias-accent,#4dabf7) 14%, transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--dsw-alias-accent,#4dabf7) 30%, transparent);transition:background .15s ease,color .15s ease;}
.sc-q-up:hover:not(:disabled){background:var(--dsw-alias-accent,#4dabf7);color:#fff;}
.sc-q-up:disabled{opacity:.32;cursor:default;}
/* 「发送」：柔和强调描边钮，融入整体 */
.sc-q-send{flex:none;border:1px solid color-mix(in srgb, var(--dsw-alias-accent,#4dabf7) 30%, transparent);background:color-mix(in srgb, var(--dsw-alias-accent,#4dabf7) 10%, transparent);color:var(--dsw-alias-accent,#4dabf7);font:inherit;font-size:12px;font-weight:600;line-height:1;padding:6px 13px;border-radius:9px;cursor:pointer;transition:background .15s ease,color .15s ease;white-space:nowrap;}
.sc-q-send:hover:not(:disabled){background:color-mix(in srgb, var(--dsw-alias-accent,#4dabf7) 20%, transparent);}
.sc-q-send:disabled{opacity:.4;cursor:default;}
/* 弹窗动画 */
@keyframes sc-fade{from{opacity:0;}to{opacity:1;}}
@keyframes sc-pop{from{opacity:0;transform:translateY(10px) scale(.98);}to{opacity:1;transform:none;}}
@media (prefers-reduced-motion: reduce){.sc-overlay,.sc-dialog,.sc-toast{animation:none;}}
`;

		// view-modes 摘要模式遮罩 → 底部居中玻璃状态胶囊（不遮挡对话）
		const OVERRIDE_CSS = `
[data-dsh-om-overlay]{left:50% !important;top:auto !important;right:auto !important;bottom:84px !important;width:auto !important;max-width:min(600px,92vw) !important;height:auto !important;transform:translateX(-50%) translateY(6px) !important;background:rgba(255,255,255,.74) !important;-webkit-backdrop-filter:blur(18px) saturate(170%) !important;backdrop-filter:blur(18px) saturate(170%) !important;border:1px solid rgba(255,255,255,.55) !important;border-radius:14px !important;box-shadow:inset 0 1px 0 rgba(255,255,255,.6),0 10px 32px rgba(15,20,30,.25) !important;padding:10px 16px !important;color:#23272e !important;}
[data-dsh-om-overlay][data-on]{transform:translateX(-50%) !important;}
.dsh-om-veil{display:none !important;}
.dsh-om-stage{max-width:none !important;padding:0 !important;}
.dsh-om-text,.dsh-om-meta,.dsh-om-sub{color:#3a4150 !important;}
/* ===== 详尽模式：还原被 dsh-enhance 折叠胶囊隐藏的完整过程 =====
   dsh-enhance 的折叠对 tool-call/think/context 一律 display:none !important，
   导致 view-modes 的"详尽/普通"看不出区别。这里在 详尽 下重新展开，
   并隐藏 enhancer 的折叠胶囊（优先级高于 enhance 的样式，与注入顺序无关）。 */
html[data-dsh-omode="verbose"] [data-chat-flow] > [data-chat-flow-kind="tool-call"],
html[data-dsh-omode="verbose"] [data-chat-flow] > [data-chat-flow-kind="context"]{display:block !important;}
html[data-dsh-omode="verbose"] [data-chat-flow] > [data-chat-flow-kind="assistant-step"] [data-variant="think"]{display:flex !important;}
html[data-dsh-omode="verbose"] [data-chat-flow] > [data-chat-flow-kind="assistant-step"] [data-tool]{display:flex !important;}
html[data-dsh-omode="verbose"] [data-chat-flow] > [data-chat-flow-kind="assistant-step"] :has(> [data-sample="bash"]){display:flex !important;}
html[data-dsh-omode="verbose"] [data-chat-flow] > .dsh-round{display:none !important;}
html[data-dsh-omode="verbose"] [data-chat-flow] > [data-chat-flow-kind="tool-call"].dsh-ec-show,
html[data-dsh-omode="verbose"] [data-chat-flow] > [data-chat-flow-kind="context"].dsh-ec-show{display:block !important;}
html[data-dsh-omode="verbose"] [data-chat-flow] > [data-chat-flow-kind="assistant-step"].dsh-ec-think-open [data-variant="think"],
html[data-dsh-omode="verbose"] [data-chat-flow] > [data-chat-flow-kind="assistant-step"].dsh-ec-tools-open [data-tool]{display:flex !important;}
`;

		// ---------------------------------------------------------- palette

		const PALETTE = [
			// 色块本身表意，不再用中文名做 title（英文界面会露出中文）；
			// name 保留给未来的无障碍标签/调试，不参与渲染。
			{ name: "tomato", color: "#FF6B6B" },
			{ name: "orange", color: "#FFA94D" },
			{ name: "lemon", color: "#FFD43B" },
			{ name: "mint", color: "#51CF66" },
			{ name: "sky", color: "#4DABF7" },
			{ name: "lavender", color: "#9775FA" },
			{ name: "sakura", color: "#F783AC" },
			{ name: "graphite", color: "#868E96" },
		];

		// ================= 壁纸引擎（UI 底座，可复用到其他插件） =================
		const WALL_KEY = "dsh-sc-wallpaper-v1";
		const WALL_DEFAULT_IMG = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gAXR2VuZXJhdGVkIGJ5IFNuaXBhc3Rl/9sAhAAKBwcIBwYKCAgICwoKCw4YEA4NDQ4dFRYRGCMfJSQiHyIhJis3LyYpNCkhIjBBMTQ5Oz4+PiUuRElDPEg3PT47AQoLCw4NDhwQEBw7KCIoOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozv/wAARCAM0BcwDAREAAhEBAxEB/8QBogAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoLEAACAQMDAgQDBQUEBAAAAX0BAgMABBEFEiExQQYTUWEHInEUMoGRoQgjQrHBFVLR8CQzYnKCCQoWFxgZGiUmJygpKjQ1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4eLj5OXm5+jp6vHy8/T19vf4+foBAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKCxEAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDxmgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgBaAFoAKACgCW2AM6humaAPoj4YQaZbeH1miZftUhIcnqAOgFOSdriujzv4k+MrzUNXktkkKwRMVRAcDA7/WoQzz55pJDlnJqwNDSb8Wdykkm4qrBiFPJxWkZcruKWxb1zxDPqoEbYSNTlUXp9fenOq5kxjymJg1kULigBaAFoAUUwFpAFMAFACigBaAFoAUUAKKAFoAKAGt1pMZmUgCgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAWgAoAeiM54FAEws5CM4PFA7DTbOFDbWwehxwaBFi20u7nYFIzj1piO68NXOq6OgDI7RNjcvI/Ee9bU59CJQ5jC8U6fI+otcxjdHOS6N/MH0INTKOuhSv1MddJuWTeI22+uOKnlZdhi2biTYRzS62BJl+30vzDt6nuScAfjSNo07iXOnrFwCjH/ZcH+VIUqbRnSrsPQj60zNxGZzQSKKBCigBaACmAooAUUALQAtACgUALQAYoAXFADX60mMy6QBQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAtABQA5V3MBQB1OjaREYRPLhh/Cv+NJs9DD0YyXMzctNDk8QStZWdhK0qcEouAv1bpSuXP2TVnoadt8H57YiXUtZW3LEDyrddxJPQZPGfbFHOm7I4uRbs9Q0Xwjo+h2sca26zSqBmWZQWJolKxlbsUPEOvlZzYWRCKhxI69z6CtsPTc3qRUmoI4HUgtxersjXeDsclRgnPH6V6qpxRy88u5e0yeaIrLAoVR8ksH8Jx1Hp9KmpTjKOxUKrixNW8M2F3K+0KrHo6RhD6gkDjkEGsFSjJFutJM5y40d9Nk8traOTurZ+8Pasp4drVHdSxUNpIhaO3K/NBGPUAdK45Xi7M9FOEkY9/p8DkmMbD7cilc5qlKPQwZ4HhPIOPUdKZxyi0MSTsaZBKKYhaYBQAoFACgUAOxQAuKAFFAC0ALigAoAY/WkxmXSAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoABQAtACigDR0/Tbm4+eOF5CSFRFXJZieAKBo9k8G/DCeKCO616Vo94B+xxt/6Ee34VLNY1JR+E7t5bbTFj03TYI43PREGAg7k/5zTUG15Ak3qxthZNcXw1G5U7IQVtlb1PWQj1PQeg+tLljBEybZnahrzzz3T2zfuLVNqsP45GOAfoOaiNNyldjuoxOQnm8raq/PLIQAD79zXuQioxR5k3d3JBaxsA5HPmGTPr2H6VVyLirGsUrunG/7w96BC3UjOUeP7yIFx/eA7UorQdyrPtuICMblPOD1B/xqwT1MO7sYbxCjsUkH3ZEODWVSjGaOqnXlF6HLaktxpsvkyFy38LHlXFeXUpOm7M9BVk0Z4uVkysgAz+RrMXNfcpzwBGLJyv8AKmZSjYbG/Y0yCYc0xC4pgOoAWgBaAFoAUUALQAtABQBG/wB78KTGZdIAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgBRQAtAG74b8OXWtXkcccTMWIAAHWgD6F8J+DLLw7ao7RrJd45cjOz2H+NIDT1fUksYxGrfvpBxgZ2j1xThTcmb0oORR0KOOSeWWPzZGB/eTTY5z1AHr0rSq3GNh1W1oZ3iXxQWzpml4klcYZx0Hr+HvSp0HP3mc8p8pz8lx9lsvsoHmOzj5V6uwB/xrujSV7nNKq2U/KdblY8hrh/mkYfwAdB9K6dDnZpeXhFwODx9KkOV2uVZyyxMw6gE/lTFYjjkWaFJF6MARVANKBclR160gKF9CQDKg6feHr71aKRmX9lFq1k0Eh2sOVfH3T61lWpKcTaMmmefXMUtrO8Eww6HBFeRKLi7M7E7rQIpSPkb7tQUmNkTY2R0PSmJokjfOKpEMkpiFoAUCgB1AC0AKKAFoAKACgCOT734UmMy6QBQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQA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oWw5cgegHJrkrycVdF4eHPKwy8vNe1i1uIdC2adp+nALLMbkpvycYY8AnnNeOo87uz0qk3H3YlHwtquvT3LacL37ZFIGAinferbf7rHlfUEEU3DqiaUne0jvkW7WFJJ7aQ7uG45B7jHYj06HqPSiNfudfu9DR0O5S21ExlsxT/Ln+6/TB9Mj+VTWipe8hTWhc1TwtY3jmVoIiQQURYlUA/3m4yx+vA9Kxg7GUWeceM7L/SrixttFsrVIswbxEXfG4EybjyWPy8+hNd6guVESoOUbo5uHw1dRXYtBEJi0mwY77iApx2zmqcVEzlQklc6298MPouuwWukXE0c7tl4ixKooONxIOSCexrkq8tzqop9NiS3WQQgSCPvgpnGMk17WHi1TR4mKknVdhlnOf3Z9HKn8K3MdifTyTbluxGcfXJq2UldmbKm3LexpMdtTOg+e3FZrUtlqAEgZq4kmXrztFrEjLwQwIPoa82t8bN4bGTdjMpkAwH+YfjXMyyEUCFoAKAFoAUUxC0wAUALQBBP98fSpluNGTUjCgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoABQAtAC0AFACimBoaTqU2m3STQyNG8bBlYdQR0NA1udPfXMXijUYbuC2aK8nIWdF+47/3l9M9x61pCN2En1Or06yVdQsbBeVEqBj/e55r1WuSnciOrL91cm6t9cnB5FyMeww2P5Uo+60vIqexzS3GLwyEdRkj69a1ehzNXL+l2yT3sttIOGjI5JGRkHHHqK5MQtDuy+3O0zRXw7HJp5ifZFbTBX3bgqpNGShyDxgjn6j3ryIVOSTTPRmk5bGt4d8NaHY6sjWl5FcSW8RykWHHIKkkjoSCOP9miVfmvpYwbTVkjs0tRcIVYDbjGCM1io8xlKoomdc6DYXBPnQ5YDbnvj61LujZVW0W4ITDEI/MeQDoXOT+felckq38KktLHbQySuAH8zgMB07HmnKo5KxcVK1kzJt7WRbgzS2VlE6vvQxAk5x97OBzTVRxjY1VJv4mM1TFjpl7eADz2TCnuzn5V/mKVKLqVEmOpJU4Oxx0rCC1ds8InH5YFfTpWVj5mTu2ynaRtE0sDfe2q4+uOaob7mjEvk2AHTPSruaQ2M66cCznk/uqQPx4FS3ZDW5n2sWLLzD6ms47FNFyzTLIWHB5q0ZtWMXxQpTWpU7ggH64rzKzvJnUtjPmjLWUT+jMufyP9a57D6FTFAgFAC0ALTABTEOoABQAoFMCC4++PpUS3GjIqRhQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAYoAUCgBcUAFABQAopiHxpvcL60DPS/BFillZS6jIvKqUjJ9T1I/l+Nd+Hh1Zm30NzR3I8S2TMMHzRx6HBrsq602VD4iPSH8yW/tJelxDv/wCBIxz+jH8qznpOLL3TRz1whguRu4xlWrWpsYxWqOlktmtbqO/gQlMAsB2z/Tn9a4+bmjynoun7OaqROr0Ex3mlswxJE0z4yOOTk8fjXjVfjZ0uavdGxb28dumyKNI1znCrgZrEzkyxa3c32ZPMiVH6MB6/4VfNZHO6d3cQsWJJ6moNbBQBFJHuXFIuLsVGtmBpM6FURy/iu733EWmxtxHiWYj1/hX+Z/KvSwFJ352ebja2nKjnLjazIH5UHIH949q9o8khZlF75o5wNpx39a0UboOlh1xeYxEDnaOD6+lSzSLK9+oFhFAPvTyD8VHJ/pSltY0iQOnkafGp6swGPrk1OysUzc060DTWy4BGf0xT6FqF2jivEUnn67csDnMzc/jXlVPiZb3IrpvL0y3iPUs8n4HAH/oNQDVkZ3WpJACgBcUwFxTEKBQAuKYBQAtAivcf6wfSoluUjIqRhQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAtACigAoAKAFApiHAc0AXNOjD3Iz2ppXYz0++dLG103SYzh1RXlx2Ldv8+1eipctkSlcluWaz1ITJ96Nww/Cu6ycCYuxYtrcC8N/A6kIxeND0bPUH2IyD9a560eZHTRcdeYp6jaxm5W6RS9tIwLA9QOjA+4BP5Uc3PTMlHlqWZ1dnavb2VrDKQzoChcHIcAcN+IxXCj2IL3S74fhhhnvVjXYxdXKqxCkEddvTqp5rz8QveMakUnobtcxAdqACgAoAKAM7WtWh0m0MjFWmcERRE/fPv6AdzWtKlKpKyM51OVXPObm7aSWRi5uLiQl5GA6k+3p/KvoaUFCPKjyJylOXMylA80krO67RtO3PJz0zWyFIaXRVLLyo4B9TWl7IRBCXuJkUDLZwPpWa95lpEVzck357rD+7X+v61MpK5oOu5972agcedk/TGP/ZqzqN3RUdTp4bmOwtDdufnAIQepxn+gonKx0pHIT6asUj3V+3loOQmfnkPoB2+prinFLVia1uYV3N58zPjGT07Aelc5LdyCkSApgOFMQtACimAtABQIKAK9x/rB9KiW5SMipGFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAF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xQAopgLTAcBSAUCmSLTAXFAC4oAWgBQKAHAUALQAUwFAoAcBQAtADqBBQByHi7/kKxf9cB/6E1clf4jenschWJoFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAAoAdQAUAFACigQ7FMBwFABQMWgBcUALQACgQoFACigBRQAtMBaACgBRQAuKAFoAKAFxQA6gBQKAFxQAuKAOj8K6U97dqFUFiQF3dMk4H64quhcTsfiKsFroFjpunszW9nePFdsR96fYGBb1J3MazbGjz0VJRFPKFUgdaVwM875HCopZ2OFUdSfQU9RNnQX0C6PYR6cAPNYCS5Yd3PRc+grVIhsyOpp2JFpiFoAKAHAUgFAoAUCmA6gAoELQAtACigB1MAoAXFAhcUxjgKBCgUALQAYpgLikA6mAYoAUUALigBQKAHAUAIRwaYFOQYn+q1y1NzohsSKOKzNBaBkch4pklV/vUxD7OPfL7ZrWmjKbNpBgAV02MCQCgQopgLTEFMBRSAdigBcUAKKAFFMBaAFApiHYoAdQIKYC0ALQAuKAHAUALQAUwFFACgUAOAoELQAtAC0Acf4u/wCQrF/1wH/oTVyV/iN6exyFYmgUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAooAWgAoAUUAOFMBQKAFoAWgAoELQMWgQooAWgBRTAWkAUwFoAWgBRQAtABQA4UALQAtACigBaAAdRQM9I+HEO/VtPXHWbcfoqOf5gVb2LVrM154bafxhr/hjV2Mdvq0qy203eOXGVI+o4/4DjvWQLY4DXtFvfDt89pfIAyn5ZE+5IPUH+lSUYEjbicUhHR+GdLW1tm8QXinyoiVtkI++/r+HP6+lbxjbUlsyr+6e7unkY5LHJPvTIIAMUCCgQoFAxQKQC0AKKAHUxBQAtMBaQC0DCgBaYhaYhaQx1MQ4UALQIWgYtMAoAWgBaAFoAUUAOoAUUxBjg0DKUo/fr9DXNU3OiBIOlZGgUICCU8mqEVWPNAmaFhHz05HBrppo55s01FbGQ4UALQIKoApAOAoAdQAtAC0wFFACimAooJHUwFoAKAHUAKBQAoFADqACmAtACgUAOAoAUUCFxQAtABTEcf4u/5CsX/XAf8AoTVyV/iOilschWBoFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAtAC0AFAC4oAUCmIcKAFoGFAC0CDFADhQMWgBcUCFxTAWkAUwFoAMUAOFAC0ALQAoFAC0AFADhQAtABQAo6igD0T4eX0NrqdlPIQFil2Pz0DqVB/AkfnVvWJXQ7P4leGjf2Ca1ZRk3liMuF6vH1/NTyPxrF3toOD1OA1fxXpbalBaSwJJYQqyyxxxgmV2BBY/Tj36nvWdKDWsjWTXQZbaX4au2N5Fpl5HZIctLcSmOP6KPvMfYV1JRepgZviLXPt8qxQKI7eIbY4xwFFO4mYQpEi0AFADgKQxcUgFpgKKYhaYC0gFFAC0DFxQIMUwFFAhQKBjqBCigBwpoQtMYtAC0AFAC0ALQAooAcKAFpgKKBC44NAFGcfvk/H+lc9Tc6IDx0rJmoGhDKsrcmmSyGIb5AD071UdzOTNmzjKxjPU811RRzyLQ6VRAuKoBRQMUUCFAoAcKAFFAC0wFoABTAcKBDhTELQAooAKAHCgBQKAFxQAtMBaAFAoAcBQAtAgFADhTAMUCFFAHH+L/wDkKxf9cB/6E1clf4jop7HH1gaBQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABigBcUALQAUAGKAHYoEOxTGLQAtABQIBQA6gAAoAcBQAuKAFxTAKAFoAWgBcUAKBQAuKAFAoAXFABigBRQA6gAoAUCgAxQBoafftaseTgjB+laxdhnoFl8Q7mexjstRlMkSADzkHztjpvHf6j8qpRje4NEF/4r02AE29us8hH32QKB+OMmrckLXucjq2u3OqT7pJCQOFUcKo9hWLdxXMrr1pCbAUALQMXFADsUgFxQAtMQooAXFAC4oAWgAoAWmAtAhQKBjgKBCgUAKBTELimMUCgB1ABQAuKAFxQAuKAFAoAcBTAXFMQCgB38JpBcoz/65P8AgX9K56hvAcOlZGwjdDQgKcp5xVEjraMk59TgVcFqZSZtxDCCupHO2SAVQhaYCikAoFADsUALigAApgLQA7FMQtADhTELQAtAAKAHYoAUUAOFABTAKAHAUAOoELigAxQA4CmAuKBC4oAAKYHHeMP+QtF/1wH/AKE1cmI+I6Kexx9c5oFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUALQAtABQAooAXFMBcUAOoAWgAoEFACgUAOxQAuKAFAoAWmAtABQAUALQA6gBRQAooAWgAoAcKACgBaAFFAC0AFMBwpgPDsBwaYXAszdTSAQCmIdigQUAKBQMdikAuKYC0AFAhRTAWkAtADhQMMUxC0CFpjHCgQoFAC0AKKAHAUwFoAKAFFAC0ALQAtACigBRTELTAcBQAuODSEUJx+9X8a56h0QHDpWRsMlPy0wKTnJpkMvWSZIGOgropowkzVUYGK3MR1ABQAooAcKAFoAWmAoFACgUAOApiFxQA6mIKAFoAUUAOAoAdigApgLQAoFADgKBC0ALQAuKYCigQUwHUAFMDjfGH/IWi/64D/0Jq48R8R0U9jj65zQKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAo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AUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUALQAtABQAoFADhTAUUCFoGLQIWgBaACgBaAFpgLQAtAC0AFAC0ALQAtABQA4CgBaAFFADhQAUALQAtABQAtMQoqgFpAKKYmLQAtABQA4UhiigBwpgLQIKAFoAUUALQMWmIWgQopgKBQMUCgQ6gBaAFpgLQAtABQAtAC0AKKAHCgBaYhaAFFMQ4UAAoAWgQtMBwoAUUAOFMBaYgpgLSAcKAFoESW7+XOrduhqWXA9X8Caol/wCGreAuDNZjyHXPI28A/liudqxtI09bntotPk80RvJtxGrAEhux/rRCN2TexxaKqfcAX6DFdlkS2UNU1iDTgUH725P3Ygenux7D9TS5ktioxucy009xM88775H6noAPQDsKQ5TS0iOAqkc8hRVEjqQxaAFxQAtMBaAFAoAeKACgQtADqACmIcKAFqgFpALVALSAcKAFFADqACgB1AhcUwFoAWmAUAKKAHCgBaBC0DCgDgvHf/Ibh/69l/8AQmrhxHxnRS+E4iuc1CgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAWgBaACgBRQAtMQuKAHUALQACgBaAFoAUdaAFoAXFMBaQAKAFpgLQAooAWgAoAUUAOoAWgBaAFoABQA4dKACgBcUwFApiFFAC0wFFAgoAWgYtIBwoAUUAKKYhaAFoAWgBRQA6gApgFMQ7FACgUAOAoAUUALQAtMAoAUUALQAtACigBRQAopgKBQIdjmgBRTEOFABQIXFADgKYCigBaYC0xC0ALQAtACigBwoAMUDiOt7+/065NxZXDQufvbT978Klo3TT3L3/CW6hg+dbxSOf4yWBP86adi+SJDL4h1S4yFdYAf+eSYP5nNPVgoxiVI4fmLtlmJySTkk+p9aOUxnV6InC4qrGI4UxBQAooAcBQA4UAFMBaAHAUALQA6gQCgB1MQAUwHCgApgOoAWgBaAHCgBaAFoAUUAOxQIWmAooAKYC0ALQAtAh1AwoAKAOC8d/8huH/AK9l/wDQmrhxHxnRS+E4iuc1CgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAWgBaACgBaYhw60DFoELQMWgQCgBaAFoAUUALQA4dKYBSABQAtMBRQA6gAoAKAHCgBaAFoAWgBaAAUAOHSgBaAFpoQUwFoAWmAtAgoGOFACikAtACimAtAhaBiigQooAcKAFpgJQIcKBjqBCimAtIQopjFpgLSGLTEAoAWgBaAFFADqAFFMQooGOoJCmA4UAFAhaYDhQA4UwCgBaYhaAFFAxwoJFoGKKYC0AGKQXDaPSgakx4UelMHJjqZmLVFCihiFpAFADx0pgLQAUwHCkA4UALQIWgAFADqYhRTAWgApgOoAWgB1ADqQBQAtMBwoELTAWgBRTAKAFoAdQIUUALQMKACgDgvHf/Ibh/69l/8AQmrhxHxnRS+E/9k=";
		const WALL_DEFAULTS = {
			enabled: true,
			img: null,
			imgKey: null,
			maskColor: "rgba(12,16,24,0.2)",
			blur: 0,
			cardBlur: 24,
			glass: 55,
			zoom: 100,
			offsetX: 0,
			offsetY: 0,
			gridEnabled: true,
			gridSpeed: 100,
			gridDensity: 45,
			gridGlow: 70,
			glassRefract: false,
			mode: "single", // "single" | "slideshow"
			slideshowFolder: "",
			slideshowInterval: 30, // seconds
			slideshowOrder: "random", // "random" | "sequence"
			slideshowPaused: false,
			zenIdleEnabled: true, // 闲置自动隐去界面静心欣赏壁纸
			zenIdleDelay: 3, // 闲置秒数
		};
		let wall = null;
		// 遮罩色历史上是"自由文本"：预设写 rgba(...)、默认值又是另一个数，
		// 非法值时旧代码会把它直接塞进 style 和滑块算术里（滑块显示 `NaN%`、
		// 或遮罩整个失效）。统一在应用点解析一次：取 RGB + alpha，缺 alpha 视为 1。
		const MASK_FALLBACK = "rgba(12,16,24,0.20)";
		function parseMaskColor(color) {
			const m = /^\s*rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)\s*$/i.exec(String(color ?? ""));
			if (!m) return null;
			const r = Number(m[1]), g = Number(m[2]), b = Number(m[3]);
			const a = m[4] === undefined ? 1 : Number(m[4]);
			if (![r, g, b, a].every((n) => Number.isFinite(n))) return null;
			return {
				r: Math.min(255, Math.max(0, Math.round(r))),
				g: Math.min(255, Math.max(0, Math.round(g))),
				b: Math.min(255, Math.max(0, Math.round(b))),
				a: Math.min(1, Math.max(0, a)),
			};
		}
		function normalizeMaskColor(color) {
			const p = parseMaskColor(color);
			return p ? "rgba(" + p.r + "," + p.g + "," + p.b + "," + p.a + ")" : MASK_FALLBACK;
		}
		function maskAlphaPercent(color) {
			const p = parseMaskColor(color) ?? parseMaskColor(MASK_FALLBACK);
			return Math.round(p.a * 100);
		}
		function withMaskAlpha(color, alpha) {
			const p = parseMaskColor(color) ?? parseMaskColor(MASK_FALLBACK);
			return "rgba(" + p.r + "," + p.g + "," + p.b + "," + Math.min(1, Math.max(0, alpha)) + ")";
		}
		// 当前会话已解析好的壁纸 prefs（img 为 blob: URL，resize 等场景复用，避免重复查 IDB）
		let wallResolved = null;
		// blob: URL 缓存：key = prefs.imgKey，value = { id, url }
		let wallIdbUrl = null;

		// ---------- 大图存储：IndexedDB ----------
		// localStorage 配额仅约 5MB，且 data URL 有 4/3 的 base64 膨胀，
		// 4MB 以上的图片读成 data URL 必然写爆。因此大图按 Blob 存进 IndexedDB
		// （容量可达数百 MB 级），localStorage 里只留 "idb:<id>" 引用。
		
		// ============ 全局 SVG 液态玻璃折射滤镜注入 ============
		
		// ============ 收起态小鲸鱼灵动球：**拖拽交互已删除**（2026-09-26 回归记录） ============
		// 这里原本有一个 `installDraggableWhaleOrb()`：document 级 pointerdown/move/up 三件套，
		// 把 `[data-slot="sidebar"] [class*="collapsed"]` 容器当作可拖拽的球。它定义了但从未被
		// 调用（死代码），本轮（B6）曾把它接进 ensureWall()，**立刻造成用户可见回归**：
		// 它在 pointerdown 的捕获阶段对"折叠容器"调用 `setPointerCapture`，指针被捕获后
		// 随后的 pointerup/click 会重定向到捕获元素本身，于是容器里真正的
		// 「展开侧栏」按钮（`button[aria-label*="打开"/"展开"/"open"/"expand"]`）的 onClick
		// 永不触发 —— 表现就是"点小鲸鱼没反应、侧栏打不开，连重启按钮都够不着"。
		//
		// 结论：**删除**（而不是修好它）。理由：该能力从未在生产中生效过，收益只是"折叠球可拖"，
		// 而它的代价是在 document 上常驻捕获阶段的手势拦截器 —— 一旦与内核自己的按钮冲突，
		// 用户就失去了唯一的自救入口（界面里的「重启 Harness」）。要恢复此功能，
		// 正确做法是绝不调用 setPointerCapture、且 pointerdown 目标若是 button/a/input 就整体放行。

		// ============ 壁纸沉浸欣赏模式（Wallpaper Zen Mode） ============
		// 当连续 5 秒没有打字或移动鼠标时（前提是对话框里没有字），自动隐藏中间界面元素；
		// 界面转入海洋巡游，仅在鼠标右键单击时唤醒工作态。
		let zenState = {
			active: false,
			timer: null,
			sidebarTimer: null,
			lastMouseX: -9999,
			lastMouseY: -9999,
			initialized: false,
			enabled: false,
			delayMs: 5000,
			sidebarDelayMs: 10000,
			sidebarIdleEnabled: true,
			isComposing: false,
			lastRightClickWakeTime: 0,
			lastSendTime: 0,
			// 上一次的「保持唤醒」判定（isWorking || 浮层 || 对话页 || 设置面板）：
			// 由 true 转 false 时必须重新武装闲置计时器，详见 syncWorkingState。
			keepAwake: false,
		};

		function getHeadlineEl() {
			if (typeof document === "undefined") return null;
			return document.querySelector(
				'html.sc-wall-on [data-composer-seat] [class*="headline"]:not([class*="headlineText"]), ' +
				'html.sc-wall-on [class*="headline"]:not([class*="headlineText"]), ' +
				'[class*="pXSMma_headline"]'
			);
		}

		function hasComposerText() {
			if (typeof document === "undefined") return false;
			// 只在 composer 作用域内找"有没有字"。
			// 此前是**全文档** querySelectorAll('input…')：任何第三方插件的普通文本框
			// 有内容就会被判成"输入框有字"，于是 zen 闲置模式永不触发（功能静默失效）。
			// 找不到 composer 时按"没有文本"处理——宁可进入闲置：任何输入（鼠标/键盘/
			// 合成事件）都会立刻唤醒，代价远小于功能静默失效。
			const seat = document.querySelector("[data-composer-seat]");
			if (!seat) return false;
			for (const el of seat.querySelectorAll('[data-composer-input], [contenteditable="true"], textarea')) {
				const text = (el.innerText || el.textContent || "").replace(/[\s\u00A0\u200B]+/g, "").trim();
				if (text.length > 0) return true;
			}
			for (const el of seat.querySelectorAll('input:not([type="hidden"])')) {
				if ((el.value || "").trim().length > 0) return true;
			}
			const activeEl = document.activeElement;
			if (activeEl && typeof seat.contains === "function" && seat.contains(activeEl)
				&& (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.isContentEditable)) {
				const text = (activeEl.value || activeEl.textContent || "").replace(/[\s\u00A0\u200B]+/g, "").trim();
				if (text.length > 0) return true;
			}
			return false;
		}

		function hasOpenOverlay() {
			if (typeof document === "undefined") return false;
			try {
				if (typeof dialogBus !== "undefined" && dialogBus?.state) {
					const s = dialogBus.state;
					if (s.confirm || s.picker || s.repair || s.tags || s.wallpaper) {
						return true;
					}
				}
			} catch (e) {}
			// 处于非会话全局面板（如插件市场）时，视为活动界面，不进入 Zen 闲置态
			if (document.querySelector('[data-plugin-panel]')) {
				return true;
			}
			// 仅检测真正的模态弹窗或可见遮罩层，杜绝 Radix Tooltip、popper 占位、ContextMeter token 弹窗或隐藏容器误判
			const overlays = document.querySelectorAll(
				'.sc-overlay, .sc-dialog, .sc-dialog-mask, ' +
				'[role="alertdialog"], ' +
				'[role="dialog"][aria-modal="true"], ' +
				'[class*="dialog-overlay"], [class*="modal-backdrop"]'
			);
			for (const el of overlays) {
				if (el.getAttribute("aria-hidden") === "true") continue;
				if (el.offsetWidth > 0 || el.offsetHeight > 0) return true;
			}
			return false;
		}

		function isSidebarBusy() {
			if (typeof document === "undefined") return false;
			try {
				if (typeof dialogBus !== "undefined" && dialogBus?.state) {
					const s = dialogBus.state;
					if (s.confirm || s.picker || s.repair || s.tags) {
						return true;
					}
				}
			} catch (e) {}
			// 处于非会话全局面板（如插件市场）时，保护侧栏不自动收起
			if (document.querySelector('[data-plugin-panel]')) {
				return true;
			}
			const sidebar = document.querySelector('[data-slot="sidebar"]');
			if (!sidebar) return false;
			// 1. 侧栏内部有正在操作的弹出菜单或对话框
			const activePopup = sidebar.querySelector('[role="menu"], [role="dialog"], .sc-menu');
			if (activePopup && (activePopup.offsetWidth > 0 || activePopup.offsetHeight > 0)) {
				return true;
			}
			// 2. 焦点位于侧边栏内的输入框（如会话搜索框、标签过滤等）
			const activeEl = document.activeElement;
			if (activeEl && sidebar.contains(activeEl) && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
				return true;
			}
			return false;
		}

		function isWorking() {
			if (typeof document === "undefined") return false;

			// 1. 用户刚刚触发发送的保护缓冲期（2.5 秒，覆盖网络与 WebSocket 状态同步的毫秒级时延）
			if (Date.now() - (zenState.lastSendTime || 0) < 2500) {
				return true;
			}

			// 2. 宿主数据层会话运行状态（ctxSessions 快照）
			try {
				const st = typeof ctxSessions?.list?.getSnapshot === "function" ? ctxSessions.list.getSnapshot() : null;
				if (st) {
					if (st.current && st.byId?.[st.current]?.running === true) {
						return true;
					}
					if (st.byId) {
						for (const id in st.byId) {
							if (st.byId[id]?.running === true) return true;
						}
					}
					if (st.jobsBySession) {
						for (const id in st.jobsBySession) {
							const jobs = st.jobsBySession[id];
							if (Array.isArray(jobs) && jobs.length > 0) return true;
						}
					}
				}
			} catch (e) {}

			// 3. DOM 状态：停止/取消生成按钮（生成中或执行中时处于可见状态）
			try {
				const stopSelectors = [
					'button[aria-label*="停止"]',
					'button[aria-label*="Stop"]',
					'button[aria-label*="stop" i]',
					'button[aria-label*="Cancel"]',
					'button[aria-label*="cancel" i]',
					'button[data-cordis-switch="stop"]',
					'[data-composer-seat] button[class*="primary"] svg rect',
					'[data-composer-card] button[class*="primary"] svg rect',
					'button[class*="stopButton"]'
				];
				for (const sel of stopSelectors) {
					const els = document.querySelectorAll(sel);
					for (const el of els) {
						const btn = el.tagName === "BUTTON" ? el : el.closest("button");
						if (btn && !btn.disabled) {
							const rect = btn.getBoundingClientRect();
							if (rect.width > 0 && rect.height > 0) return true;
						}
					}
				}
			} catch (e) {}

			// 4. DOM 状态：正在流式输出的消息或 running 状态
			try {
				const streamingEls = document.querySelectorAll(
					'[data-streaming], ' +
					'[data-status="running"], ' +
					'[class*="streaming"], ' +
					'[class*="turnGenerating"], ' +
					'[class*="activeTurn"]'
				);
				for (const el of streamingEls) {
					const rect = el.getBoundingClientRect();
					if (rect.width > 0 || rect.height > 0) return true;
				}
			} catch (e) {}

			// 5. DOM 状态：对话流中或侧边栏中的 loading 旋转动画
			try {
				const spinner = document.querySelector(
					'[data-chat-flow] [class*="historyLoadingSpinner"], ' +
					'[data-chat-flow] [class*="historyLoadingBar"], ' +
					'[data-chat-flow] [class*="spinner"], ' +
					'[data-chat-flow] [class*="running"], ' +
					'[data-slot*="conversation"] [class*="historyLoadingSpinner"], ' +
					'[data-slot*="conversation"] [class*="spinner"], ' +
					'.sc-status.sc-spinner'
				);
				if (spinner) {
					const rect = spinner.getBoundingClientRect();
					if (rect.width > 0 || rect.height > 0) return true;
				}
			} catch (e) {}

			return false;
		}

		function isConversationOpen() {
			if (typeof document === "undefined") return false;

			// 1. 如果明确存在 hero 模式或空白会话待机首屏特征，说明当前是新会话待机首屏，不是已打开的历史对话
			if (document.querySelector('[data-phase="hero"], [class*="composerHero"], [class*="heroWorkspaceRow"]')) {
				return false;
			}

			// 2. 如果存在活跃对话消息流、活跃阶段标记或翻页导航，说明处于已打开的会话页面
			if (document.querySelector('[data-phase="active"], [data-chat-flow], [class*="turnNavigator"]')) {
				return true;
			}

			// 3. 检查是否有包含消息条目的对话容器（历史回合、消息流卡片等）
			const flow = document.querySelector('[data-slot*="conversation"] [class*="scrollBody"]');
			if (flow && flow.querySelector('[class*="turn"], [class*="message"], [data-chat-flow-kind]')) {
				return true;
			}

			// 4. 宿主数据层会话快照（st.current 指向当前打开的有效会话，且非空白 blank 态）
			try {
				const st = typeof ctxSessions?.list?.getSnapshot === "function" ? ctxSessions.list.getSnapshot() : null;
				if (st?.current) {
					const cur = st.byId?.[st.current];
					if (cur && cur.blank !== true) return true;
				}
			} catch (e) {}

			return false;
		}

		function isSidebarExpanded() {
			if (typeof document === "undefined" || typeof document.querySelector !== "function") return false;
			const sidebar = document.querySelector('[data-slot="sidebar"]');
			if (!sidebar) return false;
			// 1. 若存在明确的“打开侧边栏”按钮，说明当前已处于折叠轨状态
			if (sidebar.querySelector('button[aria-label*="打开"], button[aria-label*="展开"], button[aria-label*="open" i], button[aria-label*="expand" i]')) {
				return false;
			}
			// 2. 若侧边栏根容器带有 collapsed 标识，说明已折叠
			if (sidebar.matches('[class*="collapsed"]') || sidebar.classList.contains("collapsed") || sidebar.querySelector(':scope > [class*="collapsed"]')) {
				return false;
			}
			// 3. 若外层 frame 标记了侧栏折叠，说明已折叠
			const frame = typeof sidebar.closest === "function" ? sidebar.closest('[class*="frame"]') : null;
			if (frame?.hasAttribute?.("data-sidebar-collapsed")) {
				return false;
			}
			// 4. 若存在明确的收起按钮或展开态独有的新建会话按钮，说明当前处于展开态
			if (sidebar.querySelector('button[aria-label*="收起"], button[aria-label*="折叠"], button[aria-label*="collapse" i], [class*="logoRow"] button[class*="brand"]')) {
				return true;
			}
			// 5. 几何尺寸兜底：折叠轨为 56px，展开态至少 264px
			const rect = sidebar.getBoundingClientRect();
			return rect.width > 120;
		}

		function spawnSonarRipple(x, y) {
			if (typeof document === "undefined") return;
			const ripple = document.createElement("div");
			ripple.className = "sc-sonar-ripple";
			ripple.style.left = `${x}px`;
			ripple.style.top = `${y}px`;

			const dot = document.createElement("div");
			dot.className = "sc-sonar-dot";
			dot.style.left = `${x}px`;
			dot.style.top = `${y}px`;

			document.body.appendChild(ripple);
			document.body.appendChild(dot);
			setTimeout(() => {
				ripple.remove();
				dot.remove();
			}, 900);
		}

		function spawnSplashRing(cx, cy, w, h) {
			if (typeof document === "undefined") return;
			const ring = document.createElement("div");
			ring.className = "sc-splash-ring";
			ring.style.left = `${cx}px`;
			ring.style.top = `${cy}px`;
			ring.style.width = `${Math.max(w, 80)}px`;
			ring.style.height = `${Math.max(h, 36)}px`;
			document.body.appendChild(ring);
			setTimeout(() => ring.remove(), 700);
		}

		const swimController = {
			rafId: null,
			active: false,
			offset: { x: 0, y: 0, rot: 0 },
			origin: { x: 0, y: 0 },
			target: null,
			mode: "wander",
			wanderTimer: null,
			speed: 1.0,
			currentAngle: 0,
			wavePhase: 0,

			start() {
				if (this.active || typeof window === "undefined" || typeof document === "undefined") return;
				const headline = getHeadlineEl();
				if (!headline) return;

				headline.style.removeProperty("transform");
				const r = headline.getBoundingClientRect();
				this.origin = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
				this.offset = { x: 0, y: 0, rot: 0 };
				this.currentAngle = 0;
				this.target = null;
				this.mode = "wander";
				this.wavePhase = 0;
				this.active = true;
				this.pickNextWanderPoint();
				this.loop();
			},

			pickNextWanderPoint() {
				if (!this.active || this.mode === "guided" || typeof window === "undefined") return;
				const minX = isSidebarExpanded() ? 340 : 80;
				const maxX = Math.max(minX + 120, window.innerWidth - 180);
				const minY = 80;
				const maxY = Math.max(minY + 80, window.innerHeight - 100);

				const tx = minX + Math.random() * (maxX - minX);
				const ty = minY + Math.random() * (maxY - minY);
				this.target = { x: tx, y: ty };
				this.speed = 0.8 + Math.random() * 0.45;
			},

			navigateTo(clientX, clientY) {
				if (typeof window === "undefined") return;
				this.mode = "guided";
				this.target = { x: clientX, y: clientY };
				this.speed = 3.2;
				if (this.wanderTimer) {
					clearTimeout(this.wanderTimer);
					this.wanderTimer = null;
				}
				if (!this.active) {
					this.start();
				}
			},

			loop() {
				if (!this.active || typeof requestAnimationFrame === "undefined") return;
				this.rafId = requestAnimationFrame(() => {
					this.update();
					this.loop();
				});
			},

			update() {
				const headline = getHeadlineEl();
				if (!headline) return;

				if (!this.target) {
					this.pickNextWanderPoint();
				}
				if (!this.target) return;

				const currentX = this.origin.x + this.offset.x;
				const currentY = this.origin.y + this.offset.y;

				const dx = this.target.x - currentX;
				const dy = this.target.y - currentY;
				const dist = Math.hypot(dx, dy);

				if (dist < 26) {
					if (this.mode === "guided") {
						this.mode = "wander";
						this.target = null;
						this.wanderTimer = setTimeout(() => {
							this.pickNextWanderPoint();
						}, 1200 + Math.random() * 1200);
					} else {
						this.pickNextWanderPoint();
					}
				} else {
					const step = Math.min(this.speed, dist);
					this.offset.x += (dx / dist) * step;
					this.offset.y += (dy / dist) * step;

					let targetRot = 0;
					if (dx >= 0) {
						targetRot = Math.max(-14, Math.min(14, (dy / (Math.abs(dx) + 0.1)) * 18));
					} else {
						targetRot = Math.max(-14, Math.min(14, -(dy / (Math.abs(dx) + 0.1)) * 18));
					}
					this.currentAngle += (targetRot - this.currentAngle) * 0.06;
				}

				this.wavePhase += 0.035;
				const waveY = Math.sin(this.wavePhase) * 2.6;
				const waveScale = 1 + Math.sin(this.wavePhase * 0.8) * 0.025;

				this.offset.rot = this.currentAngle;
				headline.style.setProperty(
					"transform",
					`translate3d(${this.offset.x.toFixed(2)}px, ${(this.offset.y + waveY).toFixed(2)}px, 0) rotate(${this.currentAngle.toFixed(2)}deg) scale(${waveScale.toFixed(3)})`,
					"important"
				);
			},

			getCurrentOffset() {
				return { ...this.offset };
			},

			stop() {
				this.active = false;
				if (this.rafId && typeof cancelAnimationFrame !== "undefined") {
					cancelAnimationFrame(this.rafId);
					this.rafId = null;
				}
				if (this.wanderTimer) {
					clearTimeout(this.wanderTimer);
					this.wanderTimer = null;
				}
			},

			reset() {
				this.stop();
				this.offset = { x: 0, y: 0, rot: 0 };
				this.target = null;
				this.mode = "wander";
				const headline = getHeadlineEl();
				if (headline) {
					headline.style.removeProperty("transform");
				}
			}
		};

		function resetZenTimer(delayOverride) {
			if (zenState.timer) {
				clearTimeout(zenState.timer);
				zenState.timer = null;
			}
			if (!zenState.enabled) return;
			// 处于任务执行、工作状态、有弹窗/浮层打开、或处于已打开的对话页面：绝对不启动闲置计时器！
			// **顺序有讲究**：isConversationOpen() 是纯选择器判断（不读布局），而 hasOpenOverlay()
			// 要读 offsetWidth/offsetHeight（强制同步布局）。本函数在 wheel/scroll 热路径上被调用，
			// 把最常见的"对话已打开"放最前，就能在滚动时完全跳过那次强制布局。
			if (isConversationOpen() || isWorking() || hasOpenOverlay()) return;

			const delay = typeof delayOverride === "number" ? delayOverride : zenState.delayMs;
			zenState.timer = setTimeout(() => {
				if (!zenState.enabled) return;
				if (isWorking() || hasOpenOverlay() || isConversationOpen()) return;
				if (zenState.isComposing) return;
				if (hasComposerText()) return;
				enterZenMode();
			}, delay);
		}

		function getSidebarCollapseBtn() {
			if (typeof document === "undefined" || typeof document.querySelector !== "function") return null;
			const sidebar = document.querySelector('[data-slot="sidebar"]');
			if (!sidebar) return null;

			// 1. 优先精确匹配带有“收起/折叠/collapse”含义的按钮（严格排除新建会话按钮）
			let btn = sidebar.querySelector(
				'button[aria-label*="收起"], ' +
				'button[aria-label*="折叠"], ' +
				'button[aria-label*="collapse" i]'
			);
			if (btn) return btn;

			// 2. 匹配 logoRow 中的非 brand 切换按钮或含有 toggle 类名的按钮
			const logoRow = sidebar.querySelector('[class*="logoRow"]');
			if (logoRow) {
				const toggle = logoRow.querySelector('button[class*="toggle"], button:not([class*="brand"])');
				if (toggle) return toggle;
			}

			// 3. 全局在 sidebar 下寻找带有 toggle 类的按钮，严格排除 brand/newSession/restart
			const candidates = sidebar.querySelectorAll('button[class*="toggle"], button');
			for (const b of candidates) {
				const label = (b.getAttribute("aria-label") || "").toLowerCase();
				const cls = (b.className || "").toLowerCase();
				if (cls.includes("brand") || cls.includes("newsession") || cls.includes("restart") ||
					label.includes("新建") || label.includes("new") || label.includes("重启")) {
					continue;
				}
				if (cls.includes("toggle") || label.includes("收起") || label.includes("collapse")) {
					return b;
				}
			}
			return null;
		}

		function collapseSidebarIfOpen(retry = true) {
			if (typeof document === "undefined" || typeof document.querySelector !== "function") return;
			if (!isSidebarExpanded()) return;

			const toggleBtn = getSidebarCollapseBtn();
			if (toggleBtn) {
				try {
					// 核心修复：只触发单次点击！绝对不能同时执行 click() 和 dispatchEvent，否则会产生两次连续点击将展开状态重新拉起
					if (typeof toggleBtn.click === "function") {
						toggleBtn.click();
					} else {
						toggleBtn.dispatchEvent(new MouseEvent("click", {
							bubbles: true,
							cancelable: true,
							view: window
						}));
					}
				} catch (err) {
					try {
						toggleBtn.dispatchEvent(new MouseEvent("click", {
							bubbles: true,
							cancelable: true,
							view: window
						}));
					} catch (e2) {}
				}
			}

			if (retry) {
				setTimeout(() => {
					if (isSidebarExpanded()) {
						collapseSidebarIfOpen(false);
					}
				}, 250);
			}
		}

		// 确保开屏一打开 dsh，侧边栏直接处于收起状态（呈现通透壁纸）
		// 优化：仅在开屏初始阶段执行单次静默收起。
		// 一旦侧边栏已处于收起态、或用户有主动点击/交互意图、或超过极短检查窗口，立即彻底注销退出，
		// 严禁持续长达 4 秒监听并反复收起，避免强行拦截并扼杀用户主动展开侧边栏（会话列表）的操作。
		function ensureBootLayout() {
			if (typeof document === "undefined" || typeof document.querySelector !== "function") return;

			let done = false;
			let hasTriggeredCollapse = false;
			let observer = null;
			let safetyTimer = null;

			const cleanup = () => {
				if (done) return;
				done = true;
				if (observer) {
					try { observer.disconnect(); } catch (e) {}
					observer = null;
				}
				if (safetyTimer) {
					clearTimeout(safetyTimer);
					safetyTimer = null;
				}
				if (typeof window !== "undefined" && typeof window.removeEventListener === "function") {
					window.removeEventListener("pointerdown", onUserInteract, true);
					window.removeEventListener("click", onUserInteract, true);
					window.removeEventListener("keydown", onUserInteract, true);
				}
			};

			// 用户有任何主动交互（点击、按键等），100% 遵从用户意图，立即永久退出开屏收起
			const onUserInteract = () => {
				cleanup();
			};

			if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
				window.addEventListener("pointerdown", onUserInteract, { capture: true, passive: true });
				window.addEventListener("click", onUserInteract, { capture: true, passive: true });
				window.addEventListener("keydown", onUserInteract, { capture: true, passive: true });
			}

			const tryInitialCollapse = () => {
				if (done) return;
				const sidebar = document.querySelector('[data-slot="sidebar"]');
				if (!sidebar) return; // 侧栏元素尚未挂载，等待挂载

				if (!isSidebarExpanded()) {
					// 侧栏已是收起状态，开屏布局已达标，立即结束退出
					cleanup();
					return;
				}

				// 侧栏处于展开态且尚未尝试过收起：仅触发一次静默收起
				if (!hasTriggeredCollapse) {
					hasTriggeredCollapse = true;
					collapseSidebarIfOpen(false);
					// 短延时后再次确认：若已收起则立即清理，若仍在收起动画中则交由 observer 捕获收起态后立即退出
					setTimeout(() => {
						if (!isSidebarExpanded()) {
							cleanup();
						}
					}, 50);
				}
			};

			// 1. 立即检查一次
			tryInitialCollapse();

			// 2. 若侧边栏尚未挂载完成，挂载短时 MutationObserver（一旦检测到收起立即断开，最多兜底 800ms）
			if (!done && typeof MutationObserver !== "undefined" && document.body) {
				try {
					observer = new MutationObserver(() => {
						if (done) return;
						tryInitialCollapse();
					});
					observer.observe(document.body, { childList: true, subtree: true });
				} catch (e) {}
			}

			// 最多 800ms 兜底超时后强制退出并移除所有监听，绝不长时间占用
			if (!done) {
				safetyTimer = setTimeout(cleanup, 800);
			}
		}

		function resetSidebarTimer(delayOverride) {
			if (zenState.sidebarTimer) {
				clearTimeout(zenState.sidebarTimer);
				zenState.sidebarTimer = null;
			}
			if (!zenState.sidebarIdleEnabled) return;
			if (typeof document === "undefined") return;
			if (!isSidebarExpanded()) return;
			if (isSidebarBusy()) {
				// 侧栏当前繁忙（有弹窗/菜单/编辑焦点），延后重试，不立即关闭
				zenState.sidebarTimer = setTimeout(() => {
					zenState.sidebarTimer = null;
					resetSidebarTimer(3000);
				}, 3000);
				return;
			}

			const delay = typeof delayOverride === "number" ? delayOverride : (zenState.sidebarDelayMs || 10000);
			zenState.sidebarTimer = setTimeout(() => {
				zenState.sidebarTimer = null;
				if (isSidebarBusy()) {
					resetSidebarTimer(3000);
					return;
				}
				if (isSidebarExpanded()) {
					collapseSidebarIfOpen();
				}
			}, delay);
		}

		function enterZenMode() {
			if (zenState.active) return;
			// 处于任务执行/工作状态、有弹窗打开、或处于已打开的对话页面：绝对不进入闲置！
			if (isWorking() || hasOpenOverlay() || isConversationOpen()) return;
			zenState.active = true;
			document.documentElement.classList.add("sc-wall-zen");
			collapseSidebarIfOpen();
			swimController.start();
		}

		let prevWorking = false;
		let prevSidebarExpanded = false;
		function syncWorkingState() {
			if (typeof document === "undefined" || typeof document.querySelector !== "function") return;
			const working = isWorking();
			const overlayOpen = hasOpenOverlay();
			const convOpen = isConversationOpen();
			const sidebarExpanded = isSidebarExpanded();
			// 与 hasOpenOverlay() 同一约定：只认"真的渲染出来"的弹窗，杜绝隐藏容器误判。
			// 官方 SettingsPanel 目前是 open && 条件渲染（client-ui-settings-general），
			// 所以两者等价；将来官方若改成常挂载（forceMount），存在性判断会一直命中，
			// 而这里的可见性判断仍然正确。
			const settingsOpen = Array.from(document.querySelectorAll('[data-slot="sidebar"] [role="dialog"], [data-slot="sidebar"] [class*="_panel"], [data-slot="sidebar"] [class*="_overlay"]')).some((el) => el.getAttribute("aria-hidden") !== "true" && (el.offsetWidth > 0 || el.offsetHeight > 0));
			const keepAwake = working || overlayOpen || convOpen || settingsOpen;

			if (document.documentElement) {
				document.documentElement.classList.toggle("sc-wall-working", working || overlayOpen || settingsOpen);
				document.documentElement.classList.toggle("sc-wall-conv-open", convOpen);
				document.documentElement.classList.toggle("sc-sidebar-open", sidebarExpanded);
				document.documentElement.classList.toggle("sc-settings-open", settingsOpen);
			}

			// 侧边栏展开状态同步：只要检测到侧栏展开，且没有运行中的定时器，就启动 10 秒无操作隐藏倒计时
			if (sidebarExpanded) {
				if (!prevSidebarExpanded || !zenState.sidebarTimer) {
					resetSidebarTimer();
				}
			} else {
				if (zenState.sidebarTimer) {
					clearTimeout(zenState.sidebarTimer);
					zenState.sidebarTimer = null;
				}
			}
			prevSidebarExpanded = sidebarExpanded;

			if (keepAwake) {
				// 任务正在执行中、有弹窗打开、或处于已打开的对话页面：若当前处于闲置态，立即唤醒，恢复对话界面与交互
				if (zenState.active) {
					wakeFromZenMode(true);
				}
				// 清除闲置计时器
				if (zenState.timer) {
					clearTimeout(zenState.timer);
					zenState.timer = null;
				}
			} else if (prevWorking || zenState.keepAwake === true) {
				// 回到待机态就重新武装闲置计时器。只看 prevWorking 不够：关掉弹窗 /
				// 离开对话页时 keepAwake 是由「浮层/对话」而非「执行中」支撑的，
				// prevWorking 恒为假 → 计时器再也挂不上，表现为「关掉任意弹窗后，
				// 静置壁纸/静心模式再也不自动进入」，直到下一次鼠标或按键。
				resetZenTimer();
			}
			zenState.keepAwake = keepAwake;
			prevWorking = working;
		}

		let workingMonitorStarted = false;
		function startWorkingMonitor() {
			if (workingMonitorStarted || typeof window === "undefined" || typeof document === "undefined" || typeof document.querySelector !== "function") return;
			workingMonitorStarted = true;

			// 1. 定时检测（400ms），平滑跟踪任务执行与结束、会话页面切换、侧边栏展开状态
			// 800ms 而非 400ms：每次 syncWorkingState 会做十余次全文档 querySelectorAll
			// 与若干 getBoundingClientRect（强制布局）。页面不可见时直接跳过——
			// 后台标签页没必要每 0.4s 扫一遍 DOM 只为判断"是否在流式输出"。
			const timer = setInterval(() => {
				if (typeof document !== "undefined" && document.visibilityState && document.visibilityState !== "visible") return;
				syncWorkingState();
			}, 800);
			if (timer && typeof timer.unref === "function") timer.unref();

			// 2. DOM 节点变动监听（捕获停止按钮、流式节点变化、phase 阶段变化、侧栏类名变化）
			if (typeof MutationObserver !== "undefined" && document.body) {
				let rafId = null;
				const observer = new MutationObserver(() => {
					if (rafId) return;
					rafId = requestAnimationFrame(() => {
						rafId = null;
						syncWorkingState();
					});
				});
				observer.observe(document.body, {
					childList: true,
					subtree: true,
					attributes: true,
					attributeFilter: ["data-streaming", "data-status", "data-phase", "aria-label", "disabled", "class"]
				});
			}
		}

		function wakeFromZenMode(immediate = false) {
			if (!zenState.active) return;
			if (immediate || typeof document === "undefined") {
				zenState.active = false;
				swimController.reset();
				document.documentElement.classList.remove("sc-wall-zen");
				const headline = getHeadlineEl();
				if (headline) {
					headline.style.removeProperty("transform");
					headline.style.removeProperty("filter");
					headline.style.removeProperty("opacity");
				}
				resetZenTimer();
				if (isSidebarExpanded()) {
					resetSidebarTimer();
				}
				return;
			}
			wakeFromZenModeWithDive();
		}

		function wakeFromZenModeWithDive() {
			if (!zenState.active) return;
			zenState.active = false;
			document.documentElement.classList.remove("sc-wall-zen");

			const headline = getHeadlineEl();
			const offset = swimController.getCurrentOffset();
			swimController.stop();

			if (!headline || typeof headline.animate !== "function") {
				swimController.reset();
				if (headline) {
					headline.style.removeProperty("transform");
					headline.style.removeProperty("filter");
					headline.style.removeProperty("opacity");
				}
				resetZenTimer();
				if (isSidebarExpanded()) {
					resetSidebarTimer();
				}
				return;
			}

			const startX = offset.x;
			const startY = offset.y;
			const startRot = offset.rot;

			// Clear inline transform before WAAPI animation takes over
			headline.style.removeProperty("transform");

			const anim = headline.animate([
				{
					transform: `translate3d(${startX}px, ${startY}px, 0) rotate(${startRot}deg) scale(1)`,
					filter: "blur(0px) brightness(1)",
					opacity: 1
				},
				{
					transform: `translate3d(${startX}px, ${startY + 28}px, 0) rotate(${startRot}deg) scale(0.38)`,
					filter: "blur(14px) brightness(0.35)",
					opacity: 0.15,
					offset: 0.28
				},
				{
					transform: "translate3d(0px, 20px, 0) rotate(0deg) scale(0.4)",
					filter: "blur(14px) brightness(0.35)",
					opacity: 0.15,
					offset: 0.58
				},
				{
					transform: "translate3d(0px, -6px, 0) rotate(0deg) scale(1.1)",
					filter: "blur(0px) brightness(1.3)",
					opacity: 1,
					offset: 0.85
				},
				{
					transform: "translate3d(0px, 0px, 0) rotate(0deg) scale(1)",
					filter: "blur(0px) brightness(1)",
					opacity: 1,
					offset: 1
				}
			], {
				duration: 720,
				easing: "cubic-bezier(0.2, 0.8, 0.25, 1)",
				fill: "forwards"
			});

			setTimeout(() => {
				const rect = headline.getBoundingClientRect();
				spawnSplashRing(rect.left + rect.width / 2, rect.top + rect.height / 2, rect.width, rect.height);
			}, 480);

			anim.onfinish = () => {
				anim.cancel();
				headline.style.removeProperty("transform");
				headline.style.removeProperty("filter");
				headline.style.removeProperty("opacity");
				swimController.reset();
				resetZenTimer();
				if (isSidebarExpanded()) {
					resetSidebarTimer();
				}
			};
		}

		function initZenListeners() {
			if (zenState.initialized || typeof window === "undefined" || typeof window.addEventListener !== "function") return;
			zenState.initialized = true;

			startWorkingMonitor();

			// 1. 鼠标移动：仅在鼠标移入侧边栏内部时重置侧栏收起计时；若未在 Zen 模式则重置闲置计时
			const onPointerMove = (e) => {
				zenState.lastMouseX = e.clientX;
				zenState.lastMouseY = e.clientY;
				if (isSidebarExpanded()) {
					if (e.target?.closest?.('[data-slot="sidebar"]')) {
						resetSidebarTimer();
					}
				}
				if (!zenState.active) {
					resetZenTimer();
				}
			};

			// 2. 键盘事件：Escape 退出弹窗；侧边栏内打字重置侧栏计时；回车发送立即标记工作态缓冲
			const onKeyDown = (e) => {
				if (isSidebarExpanded()) {
					if (document.activeElement?.closest?.('[data-slot="sidebar"]') || e.target?.closest?.('[data-slot="sidebar"]')) {
						resetSidebarTimer();
					}
				}
				if (e.key === "Escape") {
					try {
						if (typeof dialogBus !== "undefined" && dialogBus?.state) {
							const s = dialogBus.state;
							if (s.confirm || s.picker || s.repair || s.tags || s.wallpaper) {
								dialogBus.set({ confirm: null, picker: null, repair: null, tags: false, wallpaper: false });
								wakeFromZenMode(true);
							}
						}
					} catch (err) {}
				}
				if (e.key === "Enter" && !e.shiftKey) {
					zenState.lastSendTime = Date.now();
					syncWorkingState();
				}
				if (zenState.active) {
					return;
				}
				resetZenTimer();
			};

			// 3. 鼠标交互拦截器（左键水波导航 vs 右键唤醒工作态）
			const onCaptureClick = (e) => {
				const isInsideSidebar = !!e.target?.closest?.('[data-slot="sidebar"]');
				if (isSidebarExpanded() && isInsideSidebar) {
					resetSidebarTimer();
				}

				// 0. 极其关键：检查是否点击在任何弹窗、浮层、菜单、对话框内部，或者当前处于已打开的对话页面中！
				const isInsideOverlay = !!e.target?.closest?.(
					'.sc-overlay, .sc-dialog, .sc-dialog-mask, .sc-menu, ' +
					'[role="dialog"], [role="alertdialog"], [role="menu"], ' +
					'[data-radix-popper-content-wrapper], .sc-welcome, .sc-toast'
				);
				if (isInsideOverlay || isConversationOpen()) {
					// 弹窗或已打开的对话页面：100% 放行所有原生事件，坚决不拦截，并确保退出 Zen 模式！
					if (zenState.active) {
						wakeFromZenMode(true);
					}
					return;
				}

				// 检查是否点击了发送或停止按钮
				const isSendOrStop = !!e.target?.closest?.('button[class*="primary"], button[aria-label*="发送"], button[aria-label*="Send"], button[aria-label*="停止"], button[aria-label*="Stop"]');
				if (isSendOrStop) {
					zenState.lastSendTime = Date.now();
					setTimeout(syncWorkingState, 50);
				}

				// 检查右键（button === 2）
				if (e.button === 2) {
					zenState.lastRightClickWakeTime = Date.now();
					if (zenState.active) {
						e.stopPropagation();
						e.stopImmediatePropagation?.();
						e.preventDefault();
						wakeFromZenModeWithDive();
						return;
					}
				}

				if (!zenState.active) {
					resetZenTimer();
					return;
				}

				// 检查左键（button === 0）
				if (e.button === 0) {
					// 侧边栏内部区域（会话项、折叠小球、按钮、滚动区等）：允许正常交互并重置收起计时器
					if (isInsideSidebar) {
						resetSidebarTimer();
						return;
					}

					// 画面其余任意位置（壁纸/主区域）：
					// 1. 若侧边栏当前正展开，点击外部壁纸立即顺手收起侧边栏
					if (isSidebarExpanded()) {
						collapseSidebarIfOpen();
					}

					// 2. 波纹动效并更新小鲸鱼游动导航目标
					e.stopPropagation();
					e.stopImmediatePropagation?.();
					e.preventDefault();

					if (e.type === "pointerdown") {
						spawnSonarRipple(e.clientX, e.clientY);
						swimController.navigateTo(e.clientX, e.clientY);
					}
				}
			};

			// 4. 右键原生菜单拦截（彻底杜绝浏览器右键弹窗）
			const onContextMenu = (e) => {
				// 检查是否在弹窗、浮层、菜单内部，或者处于已打开的对话页面中
				const isInsideOverlay = !!e.target?.closest?.(
					'.sc-overlay, .sc-dialog, .sc-dialog-mask, .sc-menu, ' +
					'[role="dialog"], [role="alertdialog"], [role="menu"]'
				);
				if (isInsideOverlay || isConversationOpen()) return;

				// 检查是否聚焦在文字输入框内部，或者用户选用了文字（以便允许常规选词复制）
				const isInput = !!e.target?.closest?.('input, textarea, [contenteditable="true"]');
				const hasSelection = typeof window !== "undefined" && (window.getSelection()?.toString()?.trim()?.length ?? 0) > 0;

				// 闲置状态下、刚唤醒 1.5s 窗口期内、或者点击在壁纸/背景/非编辑区时：坚决拦截并阻止浏览器弹窗！
				if (zenState.active || (Date.now() - zenState.lastRightClickWakeTime < 1500) || (!isInput && !hasSelection)) {
					e.stopPropagation();
					e.stopImmediatePropagation?.();
					e.preventDefault();
					if (zenState.active) {
						zenState.lastRightClickWakeTime = Date.now();
						wakeFromZenModeWithDive();
					}
					return false;
				}
			};

			// 滚动是**热路径**：wheel/scroll 每秒可触发上百次，而这条链里会走到
			// hasOpenOverlay()/isSidebarBusy() —— 它们读 offsetWidth/offsetHeight，属于
			// "强制同步布局"。每个滚动事件强制一次布局 = 会话列表滚动严重掉帧（2026-09-26 用户报障）。
			// 用 rAF 合并：一帧最多重置一次。计时器语义是"数百毫秒无操作后触发"，
			// 晚到下一帧重置没有任何行为差别。
			let scrollRaf = 0;
			const onScrollOrWheel = (e) => {
				const inSidebar = !!e?.target?.closest?.('[data-slot="sidebar"]');
				if (scrollRaf) return;
				scrollRaf = requestAnimationFrame(() => {
					scrollRaf = 0;
					if (inSidebar && isSidebarExpanded()) resetSidebarTimer();
					if (inSidebar || !zenState.active) resetZenTimer();
				});
			};

			const onCompStart = (e) => {
				zenState.isComposing = true;
				if (isSidebarExpanded() && (e?.target?.closest?.('[data-slot="sidebar"]') || document.activeElement?.closest?.('[data-slot="sidebar"]'))) {
					resetSidebarTimer();
				}
				resetZenTimer();
			};
			const onCompEnd = (e) => {
				zenState.isComposing = false;
				if (isSidebarExpanded() && (e?.target?.closest?.('[data-slot="sidebar"]') || document.activeElement?.closest?.('[data-slot="sidebar"]'))) {
					resetSidebarTimer();
				}
				resetZenTimer();
			};

			window.addEventListener("pointermove", onPointerMove, { passive: true });
			window.addEventListener("keydown", onKeyDown, { passive: true });
			window.addEventListener("wheel", onScrollOrWheel, { passive: true });
			window.addEventListener("scroll", onScrollOrWheel, { passive: true });

			window.addEventListener("pointerdown", onCaptureClick, { capture: true });
			window.addEventListener("mousedown", onCaptureClick, { capture: true });
			window.addEventListener("mouseup", onCaptureClick, { capture: true });
			window.addEventListener("click", onCaptureClick, { capture: true });
			window.addEventListener("contextmenu", onContextMenu, { capture: true });

			window.addEventListener("compositionstart", onCompStart, { passive: true });
			window.addEventListener("compositionend", onCompEnd, { passive: true });
		}

		function updateZenMode(prefs) {
			const shouldEnable = !!(prefs?.enabled && (prefs?.zenIdleEnabled ?? true));
			zenState.enabled = shouldEnable;
			zenState.delayMs = Math.max(1, (prefs?.zenIdleDelay ?? 5)) * 1000;
			zenState.sidebarDelayMs = Math.max(1, (prefs?.sidebarIdleDelay ?? 10)) * 1000;
			zenState.sidebarIdleEnabled = prefs?.sidebarIdleEnabled ?? true;

			if (!shouldEnable) {
				wakeFromZenMode();
				if (zenState.timer) {
					clearTimeout(zenState.timer);
					zenState.timer = null;
				}
			} else {
				// 开屏/初次进入：精确 5 秒倒计时后进入闲置
				resetZenTimer(5000);
			}
			initZenListeners();

			if (isSidebarExpanded()) {
				resetSidebarTimer();
			}
		}

		// ============ DeepSeek 官网科技流光网格引擎（柔和深邃微光版） ============
		class DeepSeekGridEngine {
			constructor(canvas) {
				this.canvas = canvas;
				this.ctx = canvas && typeof canvas.getContext === "function" ? canvas.getContext("2d") : null;
				this.animId = null;
				this.running = false;
				this.width = 0;
				this.height = 0;
				this.dpr = 1;
				this.pulses = [];
				this.mouse = { x: -9999, y: -9999, active: false };
				this.wavePhase = 0;
				this.opts = {
					enabled: true,
					speed: 80,
					density: 48,
					glow: 60,
				};
				this._onResize = () => this.resize();
				this._onVisibility = () => {
					if (typeof document !== "undefined" && document.hidden) {
						this.pause();
					} else if (this.opts.enabled) {
						this.start();
					}
				};
				this._onPointerMove = (e) => {
					if (!this.opts.enabled) return;
					this.mouse.x = e.clientX;
					this.mouse.y = e.clientY;
					this.mouse.active = true;
				};
				this._onPointerLeave = () => {
					this.mouse.active = false;
				};
				this.init();
			}

			init() {
				if (!this.canvas || !this.ctx) return;
				if (typeof window !== "undefined") {
					window.addEventListener("resize", this._onResize);
					window.addEventListener("pointermove", this._onPointerMove, { capture: true, passive: true });
					window.addEventListener("mousemove", this._onPointerMove, { capture: true, passive: true });
					window.addEventListener("pointerleave", this._onPointerLeave, { capture: true, passive: true });
					if (typeof document !== "undefined") {
						document.addEventListener("visibilitychange", this._onVisibility);
					}
				}
				this.resize();
				this.initPulses();
				if (this.opts.enabled) this.start();
			}

			updateOptions(newOpts) {
				this.opts = { ...this.opts, ...newOpts };
				if (!this.opts.enabled) {
					this.pause();
					if (this.ctx && this.width && this.height) {
						this.ctx.clearRect(0, 0, this.width, this.height);
					}
				} else {
					this.start();
				}
			}

			resize() {
				if (!this.canvas || typeof window === "undefined") return;
				const w = window.innerWidth || 1920;
				const h = window.innerHeight || 1080;
				this.width = w;
				this.height = h;
				this.dpr = Math.min(window.devicePixelRatio || 1, 2);
				this.canvas.width = Math.floor(w * this.dpr);
				this.canvas.height = Math.floor(h * this.dpr);
				this.canvas.style.width = w + "px";
				this.canvas.style.height = h + "px";
				if (this.ctx) {
					this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
				}
			}

			initPulses() {
				this.pulses = [];
				const count = 18;
				for (let i = 0; i < count; i++) {
					this.pulses.push(this.createPulse(true));
				}
			}

			createPulse(randomPos = false) {
				const isHorizontal = Math.random() > 0.5;
				const density = Math.max(28, this.opts.density || 48);
				const cols = Math.ceil((this.width || 1920) / density);
				const rows = Math.ceil((this.height || 1080) / density);
				const speedMult = (this.opts.speed || 80) / 100;
				const baseSpeed = (1.2 + Math.random() * 1.8) * speedMult;

				if (isHorizontal) {
					const row = Math.floor(Math.random() * (rows + 1));
					const y = row * density;
					const forward = Math.random() > 0.5;
					const len = 50 + Math.random() * 90;
					const x = randomPos ? Math.random() * (this.width || 1920) : (forward ? -len : (this.width || 1920) + len);
					return {
						horizontal: true,
						x, y,
						len,
						vx: (forward ? 1 : -1) * baseSpeed,
						life: 1,
						color: Math.random() > 0.4 ? "#00e5ff" : "#4dabf7",
						size: 1.2 + Math.random() * 1.2,
					};
				} else {
					const col = Math.floor(Math.random() * (cols + 1));
					const x = col * density;
					const downward = Math.random() > 0.5;
					const len = 50 + Math.random() * 90;
					const y = randomPos ? Math.random() * (this.height || 1080) : (downward ? -len : (this.height || 1080) + len);
					return {
						horizontal: false,
						x, y,
						len,
						vy: (downward ? 1 : -1) * baseSpeed,
						life: 1,
						color: Math.random() > 0.4 ? "#00e5ff" : "#4dabf7",
						size: 1.2 + Math.random() * 1.2,
					};
				}
			}

			start() {
				if (this.running || !this.opts.enabled || !this.ctx) return;
				this.running = true;
				const loop = () => {
					if (!this.running) return;
					// 面板/弹窗打开时**跳过绘制**：网格 canvas 每帧都变，会让浏览器每帧
					// 重算面板与遮罩的整块 backdrop-filter（下面还有全屏 22px 模糊填充层），
					// 表现为「滑动设置面板掉帧」。保留 rAF（不绘制几乎零成本）以便立刻恢复。
					const veiled = typeof document !== "undefined"
						&& document.documentElement.classList.contains("sc-veil-open");
					if (!veiled) this.draw();
					if (typeof requestAnimationFrame !== "undefined") {
						this.animId = requestAnimationFrame(loop);
					}
				};
				if (typeof requestAnimationFrame !== "undefined") {
					this.animId = requestAnimationFrame(loop);
				}
			}

			pause() {
				this.running = false;
				if (this.animId && typeof cancelAnimationFrame !== "undefined") {
					cancelAnimationFrame(this.animId);
					this.animId = null;
				}
			}

			draw() {
				if (!this.ctx || !this.width || !this.height) return;
				const ctx = this.ctx;
				const w = this.width;
				const h = this.height;
				const isDark = typeof document !== "undefined" && !!document.body.hasAttribute("data-ds-dark-theme");
				const glowMult = (this.opts.glow || 60) / 100;
				const density = Math.max(28, this.opts.density || 48);

				ctx.clearRect(0, 0, w, h);
				this.wavePhase += 0.012;

				// 1. 底层科技基础网格线（极细致微光，低调柔和）
				ctx.save();
				ctx.lineWidth = 0.5;
				ctx.strokeStyle = isDark
					? `rgba(64, 150, 255, ${0.055 * glowMult})`
					: `rgba(30, 90, 180, ${0.045 * glowMult})`;
				ctx.beginPath();
				for (let x = 0; x <= w; x += density) {
					ctx.moveTo(x, 0);
					ctx.lineTo(x, h);
				}
				for (let y = 0; y <= h; y += density) {
					ctx.moveTo(0, y);
					ctx.lineTo(w, y);
				}
				ctx.stroke();

				// 2. 交叉点微光星阵（0.8px 极小微尘）
				const breath = 0.7 + 0.3 * Math.sin(this.wavePhase * 1.5);
				ctx.fillStyle = isDark
					? `rgba(0, 229, 255, ${0.16 * glowMult * breath})`
					: `rgba(0, 120, 255, ${0.12 * glowMult * breath})`;
				const dotRadius = 0.8;
				for (let x = 0; x <= w; x += density * 2) {
					for (let y = 0; y <= h; y += density * 2) {
						ctx.fillRect(x - dotRadius, y - dotRadius, dotRadius * 2, dotRadius * 2);
					}
				}
				ctx.restore();

				// 3. 鼠标交互聚光灯（柔和自然的多阶羽化光晕）
				if (this.mouse.active && this.mouse.x >= 0 && this.mouse.y >= 0) {
					ctx.save();
					const mx = this.mouse.x;
					const my = this.mouse.y;
					const radius = 260;

					const grad = ctx.createRadialGradient(mx, my, 0, mx, my, radius);
					if (isDark) {
						grad.addColorStop(0, `rgba(0, 229, 255, ${0.12 * glowMult})`);
						grad.addColorStop(0.35, `rgba(0, 102, 255, ${0.05 * glowMult})`);
						grad.addColorStop(0.7, `rgba(0, 80, 220, ${0.015 * glowMult})`);
						grad.addColorStop(1, "rgba(0, 80, 220, 0)");
					} else {
						grad.addColorStop(0, `rgba(0, 150, 255, ${0.10 * glowMult})`);
						grad.addColorStop(0.4, `rgba(77, 171, 247, ${0.04 * glowMult})`);
						grad.addColorStop(1, "rgba(77, 171, 247, 0)");
					}
					ctx.fillStyle = grad;
					ctx.beginPath();
					ctx.arc(mx, my, radius, 0, Math.PI * 2);
					ctx.fill();

					// 鼠标附近的网格柔和微显（0.7px 细线）
					ctx.lineWidth = 0.7;
					ctx.strokeStyle = isDark
						? `rgba(0, 229, 255, ${0.16 * glowMult})`
						: `rgba(0, 120, 255, ${0.12 * glowMult})`;
					const startX = Math.max(0, Math.floor((mx - radius) / density) * density);
					const endX = Math.min(w, Math.ceil((mx + radius) / density) * density);
					const startY = Math.max(0, Math.floor((my - radius) / density) * density);
					const endY = Math.min(h, Math.ceil((my + radius) / density) * density);

					ctx.beginPath();
					for (let x = startX; x <= endX; x += density) {
						const dy = Math.sqrt(Math.max(0, radius * radius - (x - mx) * (x - mx)));
						ctx.moveTo(x, Math.max(0, my - dy));
						ctx.lineTo(x, Math.min(h, my + dy));
					}
					for (let y = startY; y <= endY; y += density) {
						const dx = Math.sqrt(Math.max(0, radius * radius - (y - my) * (y - my)));
						ctx.moveTo(Math.max(0, mx - dx), y);
						ctx.lineTo(Math.min(w, mx + dx), y);
					}
					ctx.stroke();
					ctx.restore();
				}

				// 4. 柔和光子流波束（Smooth Particle Pulses）
				ctx.save();
				ctx.globalCompositeOperation = isDark ? "screen" : "source-over";
				for (let i = 0; i < this.pulses.length; i++) {
					const p = this.pulses[i];
					if (p.horizontal) {
						p.x += p.vx;
						const grad = ctx.createLinearGradient(p.x - p.len, p.y, p.x, p.y);
						grad.addColorStop(0, "rgba(0, 229, 255, 0)");
						grad.addColorStop(0.65, p.color);
						grad.addColorStop(1, "rgba(255, 255, 255, 0.9)");

						ctx.strokeStyle = grad;
						ctx.lineWidth = p.size;
						ctx.beginPath();
						ctx.moveTo(p.x - (p.vx > 0 ? p.len : -p.len), p.y);
						ctx.lineTo(p.x, p.y);
						ctx.stroke();

						ctx.fillStyle = "#ffffff";
						ctx.beginPath();
						ctx.arc(p.x, p.y, p.size * 0.9, 0, Math.PI * 2);
						ctx.fill();

						if ((p.vx > 0 && p.x > w + p.len) || (p.vx < 0 && p.x < -p.len)) {
							this.pulses[i] = this.createPulse(false);
						}
					} else {
						p.y += p.vy;
						const grad = ctx.createLinearGradient(p.x, p.y - p.len, p.x, p.y);
						grad.addColorStop(0, "rgba(0, 229, 255, 0)");
						grad.addColorStop(0.65, p.color);
						grad.addColorStop(1, "rgba(255, 255, 255, 0.9)");

						ctx.strokeStyle = grad;
						ctx.lineWidth = p.size;
						ctx.beginPath();
						ctx.moveTo(p.x, p.y - (p.vy > 0 ? p.len : -p.len));
						ctx.lineTo(p.x, p.y);
						ctx.stroke();

						ctx.fillStyle = "#ffffff";
						ctx.beginPath();
						ctx.arc(p.x, p.y, p.size * 0.9, 0, Math.PI * 2);
						ctx.fill();

						if ((p.vy > 0 && p.y > h + p.len) || (p.vy < 0 && p.y < -p.len)) {
							this.pulses[i] = this.createPulse(false);
						}
					}
				}
				ctx.restore();
			}

			dispose() {
				this.pause();
				if (typeof window !== "undefined") {
					window.removeEventListener("resize", this._onResize);
					window.removeEventListener("pointermove", this._onPointerMove, { capture: true });
					window.removeEventListener("mousemove", this._onPointerMove, { capture: true });
					window.removeEventListener("pointerleave", this._onPointerLeave, { capture: true });
					if (typeof document !== "undefined") {
						document.removeEventListener("visibilitychange", this._onVisibility);
					}
				}
			}
		}

		const IDB_NAME = "dsh-sc-wallpaper";
		const IDB_STORE = "images";
		let idbDb = null; // 惰性打开的连接，复用
		function idbOpen() {
			if (idbDb) return Promise.resolve(idbDb);
			return new Promise((resolve, reject) => {
				try {
					const req = indexedDB.open(IDB_NAME, 1);
					req.onupgradeneeded = () => {
						if (!req.result.objectStoreNames.contains(IDB_STORE)) {
							req.result.createObjectStore(IDB_STORE);
						}
					};
					req.onsuccess = () => {
						idbDb = req.result;
						// 其他标签页/窗口升级或删除该库时，这条缓存连接会立刻失效，
						// 之后每次 put/get 都抛 InvalidStateError 且永不恢复（旧实现）。
						// 收到 versionchange 就主动关掉并丢弃缓存，下次调用重新 open。
						try {
							idbDb.onversionchange = () => {
								try { idbDb?.close?.(); } catch { /* 已关闭 */ }
								idbDb = null;
							};
						} catch { /* 某些实现不允许挂该钩子 */ }
						resolve(idbDb);
					};
					req.onerror = () => reject(req.error || new Error("indexedDB open failed"));
					req.onblocked = () => reject(new Error("indexedDB open blocked by another tab"));
				} catch (e) { reject(e); }
			});
		}
		async function idbPutImage(blob) {
			const db = await idbOpen();
			return new Promise((resolve, reject) => {
				const id = "img-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
				const req = db.transaction(IDB_STORE, "readwrite").objectStore(IDB_STORE).put(blob, id);
				req.onsuccess = () => resolve(id);
				req.onerror = () => reject(req.error || new Error("indexedDB put failed"));
			});
		}
		async function idbGetImage(id) {
			const db = await idbOpen();
			return new Promise((resolve, reject) => {
				const req = db.transaction(IDB_STORE, "readonly").objectStore(IDB_STORE).get(id);
				req.onsuccess = () => resolve(req.result ?? null);
				req.onerror = () => reject(req.error || new Error("indexedDB get failed"));
			});
		}
		async function idbDelImage(id) {
			const db = await idbOpen();
			return new Promise((resolve, reject) => {
				const tx = db.transaction(IDB_STORE, "readwrite");
				tx.objectStore(IDB_STORE).delete(id);
				tx.oncomplete = () => resolve();
				tx.onerror = () => reject(tx.error || new Error("indexedDB delete failed"));
			});
		}

		function loadWallPrefs() {
			try {
				const p = { ...WALL_DEFAULTS, ...JSON.parse(localStorage.getItem(WALL_KEY) || "{}") };
				// img 可能是 "idb:<id>" 引用（大图）：抽出 imgKey 供异步解析为 blob: URL；
				// 解析完成前 img 置 null → 先显示默认图占位，避免把 "idb:..." 当 src 加载。
				if (typeof p.img === "string" && p.img.startsWith("idb:")) {
					return { ...p, img: null, imgKey: p.img.slice(4) };
				}
				return { ...p, imgKey: null };
			} catch {
				return { ...WALL_DEFAULTS };
			}
		}
		function saveWallPrefs(p) {
			try {
				const prev = loadWallPrefs();
				const { img, imgKey, ...rest } = p;
				// imgKey 优先：运行时 img 是 blob: URL（仅当前会话有效），落盘一律转回 "idb:" 引用
				const stored = imgKey ? "idb:" + imgKey : (typeof img === "string" && img.startsWith("blob:") ? null : img);
				localStorage.setItem(WALL_KEY, JSON.stringify({ ...rest, img: stored }));
				// 提交成功之后才清理被替换掉的旧图（见 pick() 里的注释：提前删会丢图）
				if (prev?.imgKey && prev.imgKey !== imgKey) {
					idbDelImage(prev.imgKey).catch(() => {});
					if (wallIdbUrl && wallIdbUrl.id === prev.imgKey) {
						revokeBlobUrl(wallIdbUrl.url);
						wallIdbUrl = null;
					}
				}
				if (prev?.img && prev.img !== img && String(prev.img).startsWith("blob:")) revokeBlobUrl(prev.img);
			} catch {
				/* storage full or blocked — cosmetic only */
			}
		}
		/** 把 prefs 里的 imgKey（IDB 引用）解析成 blob: URL；默认图/data URL 原样返回。
		    记录缺失或解析失败 → img 置 null（回落默认图），保证不黑屏。 */
		async function resolveWallPrefs(prefs) {
			if (!prefs.imgKey) return { ...prefs, img: prefs.img };
			if (wallIdbUrl && wallIdbUrl.id === prefs.imgKey) return { ...prefs, img: wallIdbUrl.url };
			try {
				const blob = await idbGetImage(prefs.imgKey);
				if (!blob) return { ...prefs, img: null };
				const url = URL.createObjectURL(blob);
				wallIdbUrl = { id: prefs.imgKey, url };
				return { ...prefs, img: url };
			} catch (e) {
				console.error("[dsh-session-center] wallpaper idb load failed:", e);
				return { ...prefs, img: null };
			}
		}
		/** 释放 blob: URL（防 object URL 泄漏）。 */
		function revokeBlobUrl(u) {
			if (typeof u === "string" && u.startsWith("blob:")) {
				try { URL.revokeObjectURL(u); } catch { /* ignore */ }
			}
		}
		let lastWallDebug = 0;
		/** 壁纸显示框 = 整个窗口（桌面壁纸式固定画布）：
		    侧栏收起/展开只是遮挡变化，壁纸图层本身不动 → 收起侧栏完全无感；
		    预览与实景使用同一矩形比例，拖动/缩放所见即所得。 */
		function wallFrameRect() {
			return { x: 0, y: 0, w: window.innerWidth || 1, h: window.innerHeight || 1 };
		}
		/** 统一取框矩形：支持元素或 {x,y,w,h} 对象。 */
		function rectOf(boxEl) {
			if (boxEl && typeof boxEl.getBoundingClientRect === "function") {
				const r = boxEl.getBoundingClientRect();
				return { x: r.left, y: r.top, w: r.width, h: r.height };
			}
			if (boxEl && typeof boxEl === "object" && Number.isFinite(boxEl.w)) return boxEl;
			return { x: 0, y: 0, w: 1, h: 1 };
		}
		/** 壁纸布局（裁剪框模型）：固定显示框，图片作为图层在框内缩放/平移。
		    图片图层尺寸 = 图片原始尺寸 × contain适配 × 用户缩放；
		    图层以框中心为基准，用 translate 平移；框外内容一律裁掉。
		    预览与真实壁纸用同一套参数、各自按自身框尺寸渲染，结果比例一致。
		    offsetX/Y 为最大平移范围的百分比（-100..100，越界自动钳制）。 */
		function wallLayout(prefs, imgEl, boxEl) {
			const r = rectOf(boxEl);
			const z = (prefs.zoom ?? 100) / 100;
			const nw = imgEl?.naturalWidth ?? 0;
			const nh = imgEl?.naturalHeight ?? 0;
			const bw = r.w;
			const bh = r.h;
			const ox = Math.max(-100, Math.min(100, prefs.offsetX ?? 0));
			const oy = Math.max(-100, Math.min(100, prefs.offsetY ?? 0));
			let s = z;
			let layerW = bw;
			let layerH = bh;
			let maxPanX = 1;
			let maxPanY = 1;
			if (nw > 0 && nh > 0) {
				// 封面式填充（cover）：无论窗口宽高比，图片始终铺满显示框，
				// 非全屏窗口也不再出现左右模糊条带与「清晰图/模糊图」硬切边。
				// 用户可用 zoom/offset 继续微调构图。
				const fit = Math.max(bw / nw, bh / nh);
				s = fit * z;
				layerW = nw * s;
				layerH = nh * s;
				maxPanX = Math.max(1, Math.abs(layerW - bw)) / 2;
				maxPanY = Math.max(1, Math.abs(layerH - bh)) / 2;
			}
			if (imgEl) {
				imgEl.style.width = layerW + "px";
				imgEl.style.height = layerH + "px";
				imgEl.style.left = (r.x + bw / 2) + "px";
				imgEl.style.top = (r.y + bh / 2) + "px";
				imgEl.style.transform = `translate(-50%, -50%) translate(${(ox / 100) * maxPanX}px, ${(oy / 100) * maxPanY}px)`;
			}
			return { scale: s, shiftX: maxPanX, shiftY: maxPanY, layerW, layerH };
		}
		let slideshowTimer = null;
		let slideshowFiles = [];
		let slideshowIndex = -1;
		let slideshowHistory = [];

		async function scanSlideshowFolder(folder) {
			if (!folder) return [];
			try {
				const res = await call("wallpaper.scanFolder", { folder });
				slideshowFiles = res.files || [];
				return slideshowFiles;
			} catch (e) {
				console.error("[dsh-session-center] scanSlideshowFolder failed:", e);
				slideshowFiles = [];
				return [];
			}
		}

		function getNextSlideSrc(prefs) {
			if (!slideshowFiles.length) return null;
			if (prefs.slideshowOrder === "random") {
				if (slideshowFiles.length === 1) {
					slideshowIndex = 0;
				} else {
					let next = Math.floor(Math.random() * slideshowFiles.length);
					if (next === slideshowIndex) {
						next = (next + 1) % slideshowFiles.length;
					}
					slideshowIndex = next;
				}
			} else {
				slideshowIndex = (slideshowIndex + 1) % slideshowFiles.length;
			}
			const file = slideshowFiles[slideshowIndex];
			return "/api/session-center.wallpaper.file?path=" + encodeURIComponent(file);
		}

		function getPrevSlideSrc() {
			if (!slideshowFiles.length) return null;
			if (slideshowHistory.length > 1) {
				// 只"看"不"剪"：旧实现连续 pop 两次却不回填，历史栈每次点击净少两条，
				// 连点两次「上一张」会跳张，之后「下一张」也失去参照。
				return slideshowHistory[slideshowHistory.length - 2];
			}
			slideshowIndex = (slideshowIndex - 1 + slideshowFiles.length) % slideshowFiles.length;
			const file = slideshowFiles[slideshowIndex];
			return "/api/session-center.wallpaper.file?path=" + encodeURIComponent(file);
		}

		function crossfadeTo(src, p) {
			if (!wall || !src) return;
			const nextImg = new Image();
			nextImg.onload = () => {
				if (!wall) return;
				wall.img.style.opacity = "0";
				setTimeout(() => {
					if (!wall) return;
					wall.img.src = src;
					wall.bg.style.backgroundImage = `url("${src}")`;
					wallLayout(p || (wallResolved ?? loadWallPrefs()), wall.img, wallFrameRect());
					wall.img.style.opacity = "1";
				}, 300);
			};
			nextImg.src = src;
		}

		function startSlideshow(prefs) {
			stopSlideshow();
			const p = prefs || (wallResolved ?? loadWallPrefs());
			if (!p.enabled || p.mode !== "slideshow" || !p.slideshowFolder || p.slideshowPaused) return;

			const cycle = () => {
				const curP = wallResolved ?? loadWallPrefs();
				if (!curP.enabled || curP.mode !== "slideshow" || curP.slideshowPaused) return;
				const nextSrc = getNextSlideSrc(curP);
				if (nextSrc) {
					slideshowHistory.push(nextSrc);
					if (slideshowHistory.length > 50) slideshowHistory.shift();
					crossfadeTo(nextSrc, curP);
				}
			};

			const intervalMs = Math.max(5, curIntervalSec(p)) * 1000;
			slideshowTimer = setInterval(cycle, intervalMs);
			// 同上：Node（渲染测试）里让这个轮播心跳不阻塞进程退出。
			slideshowTimer?.unref?.();
		}

		function stopSlideshow() {
			if (slideshowTimer) {
				clearInterval(slideshowTimer);
				slideshowTimer = null;
			}
		}

		function curIntervalSec(p) {
			const n = Number(p.slideshowInterval);
			return Number.isFinite(n) && n >= 5 ? n : 30;
		}

		function applyWall(prefs) {
			if (!wall) return;
			const p = { ...WALL_DEFAULTS, ...prefs };
			wall.root.style.display = p.enabled ? "" : "none";
			
			if (p.mode === "slideshow") {
				// 幻灯片轮播模式
				if (p.slideshowFolder) {
					if (!slideshowFiles.length) {
						scanSlideshowFolder(p.slideshowFolder).then((files) => {
							if (files.length) {
								const firstSrc = getNextSlideSrc(p);
								if (firstSrc) {
									slideshowHistory.push(firstSrc);
									crossfadeTo(firstSrc, p);
								}
								startSlideshow(p);
							}
						});
					} else {
						startSlideshow(p);
					}
				} else {
					stopSlideshow();
				}
			} else {
				// 单张壁纸模式
				stopSlideshow();
				const src = p.img || WALL_DEFAULT_IMG;
				if (wall.img.src !== src) wall.img.src = src;
				if (wall.bg.style.backgroundImage !== `url("${src}")`) wall.bg.style.backgroundImage = `url("${src}")`;
				wall.img.style.opacity = "1";
			}

			wall.img.style.filter = p.blur ? `blur(${p.blur}px)` : "none";
			wall.mask.style.background = normalizeMaskColor(p.maskColor);
			// 联动更新 DeepSeek 官网科技网格动画
			if (wall.gridEngine) {
				wall.gridEngine.updateOptions({
					enabled: !!p.enabled && (p.gridEnabled ?? true),
					speed: p.gridSpeed ?? 100,
					density: p.gridDensity ?? 45,
					glow: p.gridGlow ?? 70,
				});
			}
			// 显示框 = 全窗口（桌面壁纸式）：侧栏收起/展开不改变构图，图层永不移动
			wallLayout(p, wall.img, wallFrameRect());
			// 沉浸式底座：启用壁纸时 shell 框架转毛玻璃，--sc-glass 控制会话列强度
			if (typeof document !== "undefined" && document.documentElement) {
				document.documentElement.classList.toggle("sc-wall-on", !!p.enabled);
				document.documentElement.classList.toggle("sc-liquid-refract", !!p.enabled && (p.glassRefract ?? false));
				document.documentElement.style.setProperty("--sc-glass", String(p.glass ?? 55) + "%");
				// 正文内容面的不透明度下限：毛玻璃强度是外观偏好，但承载正文的内容卡
				// 不能低于 80%，否则浅色/高对比壁纸下正文对比度不足（表格尤其明显）。
				document.documentElement.style.setProperty(
					"--sc-content-glass",
					String(Math.max(80, Math.min(100, Number(p.glass ?? 55)))) + "%",
				);
				// 输入卡液态玻璃的磨砂强度（backdrop blur，截图同款效果）
				document.documentElement.style.setProperty("--sc-card-blur", String(p.cardBlur ?? 24) + "px");
				updateZenMode(p);
			}
		}
		function ensureWall() {
			if (wall) return wall;
			if (typeof document === "undefined" || !document.body) return null;
			const root = document.createElement("div");
			root.className = "sc-wall";
			const bg = document.createElement("div");
			bg.className = "wall-bg";
			const img = document.createElement("img");
			img.alt = "";
			const gridCanvas = document.createElement("canvas");
			gridCanvas.className = "sc-grid-canvas";
			const mask = document.createElement("div");
			mask.className = "wall-mask";
			root.appendChild(bg);
			root.appendChild(img);
			root.appendChild(gridCanvas);
			root.appendChild(mask);
			document.body.insertBefore(root, document.body.firstChild);

			const gridEngine = new DeepSeekGridEngine(gridCanvas);

			// 图片加载完成后再应用布局（naturalWidth 就绪，适配基准才准确）
			img.addEventListener("load", () => applyWall(wallResolved ?? loadWallPrefs()));
			// 窗口尺寸变化 → 主内容区矩形变化 → 重新应用布局
			const onResize = () => applyWall(wallResolved ?? loadWallPrefs());
			window.addEventListener("resize", onResize);
			wall = {
				root,
				bg,
				img,
				gridCanvas,
				gridEngine,
				mask,
				dispose() {
					stopSlideshow();
					window.removeEventListener("resize", onResize);
					gridEngine.dispose();
					root.remove();
					wall = null;
				},
			};
			applyWall(loadWallPrefs()); // 先用磁盘设置（默认图/占位）渲染
			// 注意：这里曾调用 `installDraggableWhaleOrb()`（B6 接线），因它在 pointerdown
			// 捕获阶段调用 setPointerCapture 而吞掉「展开侧栏」按钮的 click，已整体删除；
			// 详见 40-app-palette-wallpaper.js 顶部的回归记录。
			// 大图存 IndexedDB：异步解析为 blob: URL 后再应用一次（IDB 读取是毫秒级）
			resolveWallPrefs(loadWallPrefs()).then((p) => {
				wallResolved = p;
				applyWall(p);
			}).catch(() => {});
			return wall;
		}
		function setWallPrefs(patch) {
			// 基于内存中已解析的 prefs（img=blob: URL 且带 imgKey）合并，
			// 避免重新 load 时 idb 引用被占位 null 覆盖而丢图
			const p = { ...(wallResolved ?? loadWallPrefs()), ...patch };
			saveWallPrefs(p);
			applyWall(p);
		}

		// ============ 粘贴图片 → 路径文本（paste-to-path）：已整体移除 ============
		// 2026-09-10：该功能被用户判定为「不要」而删除。原因记录：0.1.5 内核下它先
		// preventDefault 再异步上传，上传失败（宿主 /api-ext 路由曾因 connection 未 inject
		// 而全 400）时图既没进原生通道也没插入路径文本，表现为「粘贴毫无反应」；
		// 且输入框已是 Lexical contenteditable，路径文本插入本身也不可靠。
		// 粘贴图片现在完全交回官方原生通道（含视觉模型的原生图片块）。
		// 宿主侧路由 paste.upload / paste.policy 与 sniffImageExt / pastePolicyFor 一并删除。

		// ------------------------------------------------ 全局对话框总线
		// 对话框（标签管理/壁纸/打标签/确认/修复/提示）原来渲染在侧栏内，
		// .sc-root 的 container-type 会把 position:fixed 后代的包含块限制在
		// 侧栏宽度内（弹窗被压成一条）。总线 + shell.overlay 宿主把弹窗提升到
		// 页面级渲染：整页居中、任意宽度、不受侧栏影响。
		const dialogBus = {
			state: { tags: false, wallpaper: false, picker: null, confirm: null, repair: null, preview: null, welcome: false, toast: null },
			version: 0,
			listeners: new Set(),
			t: null, // 侧栏传入的翻译函数（壳层渲染时刷新）
			getTags: null, // () => tags（每次宿主渲染时重新读取）
			onChanged: null, // 标签变更后刷新（由侧栏提供，稳定引用）
			set: (patch) => {
				dialogBus.state = { ...dialogBus.state, ...(typeof patch === "function" ? patch(dialogBus.state) : patch) };
				dialogBus.version++;
				dialogBus.emit();
				try {
					if (hasOpenOverlay()) {
						if (zenState.active) {
							wakeFromZenMode(true);
						}
						if (zenState.timer) {
							clearTimeout(zenState.timer);
							zenState.timer = null;
						}
					}
				} catch (e) {}
			},
			touch: () => {
				dialogBus.version++;
				dialogBus.emit();
			},
			emit: () => {
				dialogBus.listeners.forEach((fn) => fn(dialogBus.version));
			},
			subscribe: (fn) => {
				dialogBus.listeners.add(fn);
				return () => dialogBus.listeners.delete(fn);
			},
			getSnapshot: () => dialogBus.version,
		};

		// --------------------------------------------------------- dialogs

		function Dialog({ title, body, actions, onClose, className = "", style = {} }) {
			return h("div", { className: "sc-overlay", onClick: (e) => { if (e.target === e.currentTarget) onClose?.(); } },
				h("div", { className: `sc-dialog ${className}`.trim(), style, onClick: (e) => e.stopPropagation() },
					h("div", { className: "sc-dialog-head" },
						h("h3", { className: "sc-dialog-title" }, title),
						h("button", { type: "button", className: "sc-dialog-x", "aria-label": "close", title: "关闭", onClick: () => onClose?.() }, "✕"),
					),
					body !== undefined ? h("div", { className: "body" }, body) : null,
					actions ? h("div", { className: "sc-dialog-actions" }, actions) : null,
				),
			);
		}

		function Confirm({ t, title, message, danger, onOk, onCancel }) {
			return Dialog({
				title,
				body: message,
				onClose: onCancel,
				actions: [
					h("button", { className: "sc-ghost", onClick: onCancel }, t("cancel")),
					h("button", { className: danger ? "sc-danger" : "sc-primary", onClick: onOk }, t("confirmOk")),
				],
			});
		}

		// -------------------------------------------------------- tag UI

		function TagManager({ t, tags, onClose, onChanged }) {
			const [name, setName] = react.useState("");
			const [color, setColor] = react.useState(PALETTE[4].color);
			const [busy, setBusy] = react.useState(false);
			const create = async () => {
				if (!name.trim() || busy) return;
				setBusy(true);
				try {
					await call("tag.save", { name: name.trim(), color });
					setName("");
					onChanged?.();
				} catch (e) {
					window.alert(String(e.message ?? e));
				} finally {
					setBusy(false);
				}
			};
			const update = async (id, patch) => {
				try {
					await call("tag.save", { id, ...patch });
					onChanged?.();
				} catch (e) {
					window.alert(String(e.message ?? e));
				}
			};
			const del = async (id) => {
				if (!window.confirm(t("confirmTagDelete"))) return;
				try {
					await call("tag.delete", { id });
					onChanged?.();
				} catch (e) {
					window.alert(String(e.message ?? e));
				}
			};
			return Dialog({
				title: t("manageTags"),
				onClose,
				body: h("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
					h("div", { className: "sc-tag-list" },
						tags.length === 0 ? h("div", { className: "sc-empty" }, t("noTags")) :
						tags.map((tag) => h("div", { key: tag.id, className: "sc-tag-item" },
							h("span", { className: "swatch", style: { background: tag.color }, title: tag.color }),
							h("input", {
								type: "text", defaultValue: tag.name, key: "n-" + tag.id,
								onBlur: (e) => { const v = e.target.value.trim(); if (v && v !== tag.name) update(tag.id, { name: v }); },
								onKeyDown: (e) => { if (e.key === "Enter") e.target.blur(); },
							}),
							h("div", { className: "sc-palette" },
								PALETTE.map((p) => h("button", {
									key: p.color, type: "button", className: "swatch", style: { background: p.color },
									onClick: () => update(tag.id, { color: p.color }),
								})),
							),
							h("button", { type: "button", className: "del", onClick: () => del(tag.id) }, "✕"),
						)),
					),
					h("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
						h("input", {
							type: "text", placeholder: t("tagNamePlaceholder"), value: name,
							onChange: (e) => setName(e.target.value),
							onKeyDown: (e) => { if (e.key === "Enter") create(); },
						}),
						h("div", { className: "sc-palette" },
							PALETTE.map((p) => h("button", {
								key: p.color, type: "button", className: "swatch" + (color === p.color ? " on" : ""),
								style: { background: p.color },
								onClick: () => setColor(p.color),
							})),
						),
						h("button", { type: "button", className: "sc-primary", onClick: create, disabled: busy }, t("newTag")),
					),
				),
				actions: [h("button", { className: "sc-ghost", onClick: onClose }, t("close"))],
			});
		}

		function TagPicker({ t, tags, current, count, onClose, onApplied }) {
			const [selected, setSelected] = react.useState(new Set(current));
			const [busy, setBusy] = react.useState(false);
			const toggle = (id) => {
				const next = new Set(selected);
				if (next.has(id)) next.delete(id);
				else next.add(id);
				setSelected(next);
			};
			const apply = async () => {
				if (busy) return;
				setBusy(true);
				try {
					await call("tag.setSessions", { sessionIds: count.sessions, tagIds: [...selected] });
					onApplied?.();
					onClose?.();
				} catch (e) {
					window.alert(String(e.message ?? e));
				} finally {
					setBusy(false);
				}
			};
			return Dialog({
				title: t("tags"),
				onClose,
				body: h("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
					h("div", { className: "body" },
						`${t("applyingTo")} ${count.sessions.length} ${t("sessionsCount")}` + (count.sessions.length > 1 ? ` · ${t("quickApply")}` : "")),
					tags.length === 0
						? h("div", { className: "sc-empty" }, t("empty"))
						: h("div", { className: "sc-picker-grid" },
							tags.map((tag) => {
								const on = selected.has(tag.id);
								return h("button", {
									key: tag.id, type: "button", className: "sc-picker-tag" + (on ? " on" : ""),
									style: {
										background: tag.color + (on ? "59" : "17"),
										color: tag.color,
										borderColor: on ? tag.color : "rgba(90,100,115,.28)",
									},
									onClick: () => toggle(tag.id),
								}, (on ? "✓ " : "") + tag.name);
							}),
						),
				),
				actions: [
					h("button", { className: "sc-ghost", onClick: onClose }, t("cancel")),
					h("button", { className: "sc-primary", onClick: apply, disabled: busy }, t("applyTags")),
				],
			});
		}

		// ----------------------------------------------------- wallpaper UI

		const WALL_MASKS = [
			{ name: "无遮罩", color: "rgba(12,16,24,0)" },
			{ name: "轻暗", color: "rgba(12,16,24,0.28)" },
			{ name: "中暗", color: "rgba(12,16,24,0.45)" },
			{ name: "深暗", color: "rgba(12,16,24,0.62)" },
			{ name: "蓝夜", color: "rgba(20,26,40,0.55)" },
			{ name: "雾白", color: "rgba(240,244,250,0.3)" },
		];

		const WALL_PRESETS = [
			{
				id: "anime",
				name: "🌸 原画鉴赏",
				desc: "原画超清 · 浓郁毛玻璃阻隔杂线 · 轻暗护眼",
				patch: { blur: 0, cardBlur: 30, maskColor: "rgba(12,16,24,0.30)", glass: 58, glassRefract: true }
			},
			{
				id: "work",
				name: "💻 专注办公",
				desc: "背景景深虚化不抢眼 · 深色遮罩 · 高对比文字",
				patch: { blur: 10, cardBlur: 24, maskColor: "rgba(12,16,24,0.50)", glass: 75, gridEnabled: true, gridSpeed: 100, gridDensity: 45, gridGlow: 70 }
			},
			{
				id: "crystal",
				name: "🧊 水晶通透",
				desc: "极度通透卡片 · 大范围边缘折射 · 晶莹悬浮感",
				patch: { blur: 0, cardBlur: 44, maskColor: "rgba(12,16,24,0)", glass: 38, glassRefract: true }
			}
		];

		function WallpaperPanel({ t, onClose }) {
			const [prefs, setPrefs] = react.useState(loadWallPrefs());
			const [warn, setWarn] = react.useState("");
			const [folderScanning, setFolderScanning] = react.useState(false);
			const [folderCount, setFolderCount] = react.useState(slideshowFiles.length);
			const [activePreset, setActivePreset] = react.useState(null);
			const [slideIndexState, setSlideIndexState] = react.useState(slideshowIndex >= 0 ? slideshowIndex : 0);
			const [currentSlideSrc, setCurrentSlideSrc] = react.useState(null);
			const [showMockCard, setShowMockCard] = react.useState(false);

			// 大图引用存 IndexedDB：打开面板后异步解析成 blob: URL（读取为毫秒级）；
			// 仅当用户还没换图（imgKey 存在且 img 仍为占位 null）时才替换。
			react.useEffect(() => {
				let dead = false;
				resolveWallPrefs(loadWallPrefs()).then((p) => {
					if (!dead) setPrefs((cur) => (cur.imgKey && cur.img == null ? p : cur));
				}).catch(() => {});
				return () => { dead = true; };
			}, []);

			// 如果是幻灯片模式且有目录，初次打开面板时扫描并统计图片张数。
			// 这里的依赖是受控输入本身：`onChange` 每敲一个字符就 update 一次 prefs，
			// 于是旧实现每敲一键都打一次宿主扫描路由（输入 "C:\Pictures" 扫 11 次盘，
			// 每次都要列目录）。加 400ms 防抖 + 取消（离开/改值即中止）。
			react.useEffect(() => {
				if (prefs.mode !== "slideshow" || !prefs.slideshowFolder) return undefined;
				const folder = prefs.slideshowFolder;
				let dead = false;
				const timer = setTimeout(() => {
					if (dead) return;
					setFolderScanning(true);
					scanSlideshowFolder(folder).then((files) => {
						if (dead) return;
						setFolderCount(files.length);
						if (files.length > 0) {
							const idx = slideshowIndex >= 0 && slideshowIndex < files.length ? slideshowIndex : 0;
							setSlideIndexState(idx);
							setCurrentSlideSrc("/api/session-center.wallpaper.file?path=" + encodeURIComponent(files[idx]));
						}
					}).finally(() => {
						if (!dead) setFolderScanning(false);
					});
				}, 400);
				return () => { dead = true; clearTimeout(timer); };
			}, [prefs.slideshowFolder, prefs.mode]);

			const fileRef = react.useRef(null);
			const dirInputRef = react.useRef(null);
			const previewRef = react.useRef(null);
			const previewImgRef = react.useRef(null);
			const dragRef = react.useRef(null);

			const update = (patch) => {
				// 预览模式：只更新面板状态与预览图，不落盘、不应用到真实壁纸
				const p = { ...prefs, ...patch };
				setPrefs(p);
			};

			// 「应用」：把当前面板设置提交到真实壁纸（保存 + 应用 + 提示）
			const apply = () => {
				saveWallPrefs(prefs);
				wallResolved = prefs; // 会话内 resize 直接复用当前 blob: URL
				applyWall(prefs);
				dialogBus.set({ toast: "壁纸与视觉配置已生效" });
				onClose?.();
			};

			const pickFolderNative = async () => {
				setWarn("");
				setFolderScanning(true);
				try {
					const res = await call("wallpaper.pickFolder", { folder: prefs.slideshowFolder || "" });
					if (res && res.folder) {
						const files = await scanSlideshowFolder(res.folder);
						setFolderCount(files.length);
						update({ slideshowFolder: res.folder, mode: "slideshow" });
						if (files.length === 0) {
							setWarn("所选文件夹内未发现有效图片格式 (.jpg, .png, .webp, .bmp 等)");
						} else {
							setSlideIndexState(0);
							setCurrentSlideSrc("/api/session-center.wallpaper.file?path=" + encodeURIComponent(files[0]));
						}
					}
				} catch (err) {
					setWarn("选择文件夹失败：" + (err?.message || String(err)));
				} finally {
					setFolderScanning(false);
				}
			};

			const onBrowserDirChange = async (e) => {
				const files = e.target.files;
				if (!files || files.length === 0) return;
				setWarn("提示：浏览器模式已选择 " + files.length + " 张图片。如需保持后台永久自动轮播，建议点击「📁 浏览文件夹…」。");
			};

			// 预览框局部矩形：图片图层以预览框为包含块，坐标必须是框内局部值
			const previewLocalRect = () => {
				const el = previewRef.current;
				if (!el) return { x: 0, y: 0, w: 1, h: 1 };
				const r = el.getBoundingClientRect();
				return { x: 0, y: 0, w: r.width, h: r.height };
			};

			// 拖拽预览平移：以当前缩放的可平移范围为界
			const onDragStart = (e) => {
				if (e.button !== 0) return;
				// 指针捕获会把随后的 pointerup/click 重定向到"捕获元素"本身：若用户在预览框
				// 内部的按钮上按下（右上角的文字气泡开关就在这个容器里），捕获之后那个按钮的
				// onClick 永远不会触发 —— 表现就是"点了没反应"。交互元素一律放行，不进拖拽。
				const target = e.target;
				if (target && typeof target.closest === "function" &&
					target.closest("button, a, input, textarea, select, [role='button'], [contenteditable='true']")) {
					return;
				}
				e.preventDefault();
				dragRef.current = { x: e.clientX, y: e.clientY, ox: prefs.offsetX ?? 0, oy: prefs.offsetY ?? 0 };
				previewRef.current?.classList.add("dragging");
				previewRef.current?.setPointerCapture?.(e.pointerId);
			};
			const onDragMove = (e) => {
				const d = dragRef.current;
				if (!d) return;
				const geo = wallLayout(prefs, previewImgRef.current, previewLocalRect());
				const dx = ((e.clientX - d.x) / Math.max(1, geo.shiftX)) * 50;
				const dy = ((e.clientY - d.y) / Math.max(1, geo.shiftY)) * 50;
				update({
					offsetX: Math.max(-100, Math.min(100, d.ox + dx)),
					offsetY: Math.max(-100, Math.min(100, d.oy + dy)),
				});
			};
			const onDragEnd = () => {
				dragRef.current = null;
				previewRef.current?.classList.remove("dragging");
			};

			const pick = async (e) => {
				const file = e.target.files?.[0];
				e.target.value = "";
				if (!file) return;
				setWarn("");
				try {
					const id = await idbPutImage(file);
					// 这里**不能**删旧图/吊销旧 blob：此刻还没提交（apply 才 saveWallPrefs）。
					// 旧实现在"选图"时就 idbDelImage(prefs.imgKey)+revokeBlobUrl(prefs.img)，
					// 于是用户选完图不点「应用」直接关面板 → localStorage 里的 idb:<oldKey>
					// 悬空、实景壁纸的 blob URL 被吊销 → 重启后自选壁纸永久丢失。
					// 清理改到 saveWallPrefs() 提交成功之后。
					update({ img: URL.createObjectURL(file), imgKey: id, mode: "single" });
				} catch (err) {
					setWarn("图片保存失败：" + (err?.message || String(err)));
				}
			};

			const setZoom = (v) => {
				update({ zoom: v });
			};

			// 渲染后把缩放/平移应用到预览图（wallLayout 直接写 style）
			react.useEffect(() => {
				wallLayout(prefs, previewImgRef.current, previewLocalRect());
			}, [prefs, prefs.zoom, prefs.offsetX, prefs.offsetY, prefs.img, currentSlideSrc]);

			const isSlideshow = prefs.mode === "slideshow";

			const applyPreset = (preset) => {
				setActivePreset(preset.id);
				update(preset.patch);
				dialogBus.set({ toast: `已套用「${preset.name}」搭配参数` });
			};

			const resetDefaults = () => {
				if (!window.confirm("确定要恢复默认壁纸与视觉配置吗？")) return;
				update({
					maskColor: "rgba(12,16,24,0.35)",
					blur: 0,
					cardBlur: 24,
					glass: 55,
					zoom: 100,
					offsetX: 0,
					offsetY: 0,
					gridEnabled: true,
					gridSpeed: 100,
					gridDensity: 45,
					gridGlow: 70,
					glassRefract: false,
					zenIdleEnabled: true,
					zenIdleDelay: 3,
				});
				setActivePreset(null);
			};

			/**
			 * 滑杆（label + 数值 + range）。
			 * @param {object} [opts] - { readOnly: true } = **仅展示**：禁用交互（disabled +
			 *   pointer-events:none），数值照常显示，拖动/点击都不会改动 prefs。
			 *   目前「流光脉冲速度」用它：该参数不接受用户调整，只展示当前值。
			 */
			const sliderWithDesc = (label, desc, value, min, max, step, unit, onChange, opts = {}) => {
				const readOnly = opts.readOnly === true;
				return h("div", { className: "sc-wall-slider-group" + (readOnly ? " is-readonly" : "") },
					h("div", { className: "sc-wall-slider-header" },
						h("span", { style: { fontWeight: 600 } }, label),
						h("span", { className: "val" }, `${value} ${unit}` + (readOnly ? " · 仅展示" : ""))
					),
					desc ? h("div", { className: "sc-wall-subtext" }, desc) : null,
					h("input", {
						type: "range",
						min,
						max,
						step,
						value,
						disabled: readOnly,
						"aria-disabled": readOnly ? "true" : "false",
						title: readOnly ? "仅展示：此项不接受调整" : undefined,
						style: { width: "100%", margin: "3px 0 5px" },
						onChange: readOnly ? undefined : (e) => onChange(Number(e.target.value))
					})
				);
			};

			const toggleWithDesc = (label, desc, checked, onChange) =>
				h("label", { style: { display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", userSelect: "none" } },
					h("input", {
						type: "checkbox",
						checked,
						style: { marginTop: 3, accentColor: "var(--dsw-alias-accent, #4dabf7)" },
						onChange: (e) => onChange(e.target.checked)
					}),
					h("div", { style: { display: "flex", flexDirection: "column", gap: 2 } },
						h("span", { style: { fontSize: 13, fontWeight: 550 } }, label),
						desc ? h("span", { className: "sc-wall-subtext" }, desc) : null
					)
				);

			// 当前预览图源
			const displaySrc = isSlideshow
				? (currentSlideSrc || (slideshowFiles.length > 0 ? ("/api/session-center.wallpaper.file?path=" + encodeURIComponent(slideshowFiles[0])) : (prefs.img || WALL_DEFAULT_IMG)))
				: (prefs.img || WALL_DEFAULT_IMG);

			const currentFileName = isSlideshow && slideshowFiles.length > 0 && slideIndexState >= 0 && slideIndexState < slideshowFiles.length
				? slideshowFiles[slideIndexState].split(/[\\/]/).pop()
				: (prefs.slideshowFolder ? "正在轮播…" : "未选目录");

			return Dialog({
				title: "🖼 壁纸与幻灯片设置",
				className: "sc-dialog-wide",
				onClose,
				body: h("div", { className: "sc-wall-layout" },
					// ====================== 左侧：实景监视器 & 播控 ======================
					h("div", { className: "sc-wall-left" },
						// 预览视窗
						h("div", {
							ref: previewRef,
							className: "sc-wall-preview",
							style: { width: "100%", height: 230 },
							onPointerDown: onDragStart,
							onPointerMove: onDragMove,
							onPointerUp: onDragEnd,
							onPointerLeave: onDragEnd,
						},
							h("div", { className: "bg", style: { backgroundImage: `url("${displaySrc}")` } }),
							h("img", {
								ref: previewImgRef,
								src: displaySrc,
								alt: "",
								style: { filter: prefs.blur ? `blur(${prefs.blur}px)` : "none" },
								onLoad: () => setPrefs((p) => ({ ...p })),
								onError: (e) => { e.target.style.visibility = "hidden"; },
								draggable: false,
							}),
							h("div", { className: "mask", style: { background: normalizeMaskColor(prefs.maskColor) } }),
							// 顶部悬浮控制：按需开启/关闭文字可读性测试气泡，默认纯净不遮挡壁纸预览
							h("button", {
								type: "button",
								title: showMockCard ? "隐藏文字测试气泡，完整预览壁纸" : "在壁纸上浮现模拟文字气泡，检查文字清晰度",
								style: {
									position: "absolute",
									top: 8,
									right: 8,
									zIndex: 6,
									fontSize: 11,
									padding: "3px 9px",
									borderRadius: 999,
									border: "1px solid rgba(255,255,255,0.4)",
									background: showMockCard ? "var(--dsw-alias-brand-primary, #4d6bfe)" : "rgba(15, 20, 30, 0.65)",
									color: "#fff",
									cursor: "pointer",
									backdropFilter: "blur(10px)",
									WebkitBackdropFilter: "blur(10px)",
									boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
									display: "flex",
									alignItems: "center",
									gap: 4,
									fontWeight: 500,
									transition: "all .18s ease"
								},
								onClick: (e) => {
									e.stopPropagation();
									setShowMockCard(!showMockCard);
								}
							}, showMockCard ? "👁 隐藏文字气泡" : "💬 试看文字测试卡"),
							// 真实文字可读性效果预览卡片（按需展示，绝不默认遮挡）
							showMockCard ? h("div", {
								className: "sc-preview-mock-card",
								style: {
									position: "absolute",
									left: 14,
									bottom: 12,
									right: 14,
									padding: "10px 14px",
									borderRadius: 12,
									background: `color-mix(in srgb, #fafbfd ${prefs.glass ?? 55}%, transparent)`,
									backgroundImage: (prefs.glassRefract)
										? "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.02) 40%, rgba(255,255,255,0.08) 100%)"
										: "none",
									backdropFilter: `blur(${prefs.cardBlur ?? 24}px) saturate(180%)`,
									WebkitBackdropFilter: `blur(${prefs.cardBlur ?? 24}px) saturate(180%)`,
									border: (prefs.glassRefract) ? "1px solid rgba(255,255,255,0.85)" : "1px solid rgba(255,255,255,0.5)",
									boxShadow: (prefs.glassRefract)
										? "inset 0 1.5px 2px 0 rgba(255,255,255,0.95), inset 0 -1px 1px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.22)"
										: "0 8px 24px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.5)",
									color: "#1e2430",
									userSelect: "none",
									display: "flex",
									flexDirection: "column",
									gap: 3,
									zIndex: 5,
								}
							},
								h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
									h("span", { style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.02em" } }, "💬 文字可读性实景预览"),
									h("div", { style: { display: "flex", gap: 6, alignItems: "center" } },
										(prefs.glassRefract) ? h("span", {
											style: { fontSize: 9, color: "#2b5cd9", background: "rgba(77,107,254,0.12)", padding: "1px 6px", borderRadius: 999, fontWeight: 600 }
										}, "✨ Liquid Glass 折射") : null,
										h("button", {
											type: "button",
											style: { background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "inherit", opacity: 0.6, padding: "0 2px", lineHeight: 1 },
											onClick: (e) => { e.stopPropagation(); setShowMockCard(false); }
										}, "✕")
									)
								),
								h("div", { style: { fontSize: 10.5, lineHeight: 1.45, opacity: 0.88 } },
									"这是模拟对话气泡。调节右侧磨砂与透明度，可实时观察文字在此壁纸下的清晰度。"
								)
							) : null,
							h("div", { className: "hint" }, isSlideshow ? "可拖拽调整居中 · 轮播进行中" : "可拖拽调整壁纸居中构图")
						),

						// 壁纸总开关卡片
						h("div", { className: "sc-wall-card", style: { padding: "10px 12px" } },
							toggleWithDesc(
								"启用沉浸式毛玻璃壁纸",
								"关闭后界面恢复官方纯净默认样式",
								prefs.enabled,
								(v) => {
									update({ enabled: v });
									setWallPrefs({ enabled: v });
								}
							)
						),

						// 模式选择分段器
						h("div", { className: "sc-wall-card", style: { padding: "10px 12px", gap: 8 } },
							h("span", { style: { fontSize: 12, fontWeight: 600, opacity: 0.85 } }, "壁纸展示模式"),
							h("div", { style: { display: "flex", gap: 8 } },
								h("button", {
									type: "button",
									className: !isSlideshow ? "sc-primary" : "sc-ghost",
									style: { flex: 1, padding: "7px 10px", borderRadius: 9, fontSize: 12.5, fontWeight: !isSlideshow ? 600 : 400 },
									onClick: () => update({ mode: "single" })
								}, "🖼 单张固定壁纸"),
								h("button", {
									type: "button",
									className: isSlideshow ? "sc-primary" : "sc-ghost",
									style: { flex: 1, padding: "7px 10px", borderRadius: 9, fontSize: 12.5, fontWeight: isSlideshow ? 600 : 400 },
									onClick: () => update({ mode: "slideshow" })
								}, "🎞 文件夹幻灯片轮播"),
							),
							// 单张模式下的操作键
							!isSlideshow ? h("div", { style: { display: "flex", gap: 6, marginTop: 2 } },
								h("button", {
									type: "button",
									className: "sc-ghost",
									style: { flex: 1, padding: "5px 8px", fontSize: 11.5, borderRadius: 8 },
									onClick: () => fileRef.current?.click()
								}, "📤 自选图片"),
								h("button", {
									type: "button",
									className: "sc-ghost",
									style: { flex: 1, padding: "5px 8px", fontSize: 11.5, borderRadius: 8 },
									onClick: () => {
										// 同样不能在"尚未提交"时删图：这里只清引用，
										// 旧图由 saveWallPrefs()（点「应用」时）清理——
										// 否则点「恢复默认」又取消 = 图被删而引用还在。
										update({ img: null, imgKey: null });
									}
								}, "🔄 恢复默认"),
								h("button", {
									type: "button",
									className: "sc-ghost",
									style: { flex: 1, padding: "5px 8px", fontSize: 11.5, borderRadius: 8 },
									onClick: () => { setZoom(100); update({ offsetX: 0, offsetY: 0 }); }
								}, "🎯 重置位置"),
								h("input", { ref: fileRef, type: "file", accept: "image/*", style: { display: "none" }, onChange: pick }),
							) : null,
						),

						// 幻灯片专属播控 Deck
						isSlideshow ? h("div", { className: "sc-wall-card", style: { padding: "10px 12px", gap: 8 } },
							h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
								h("span", { style: { fontSize: 12, fontWeight: 600 } }, "当前播放图库"),
								h("span", {
									style: {
										fontSize: 11,
										color: "var(--dsw-alias-accent, #4dabf7)",
										fontWeight: 600,
										fontVariantNumeric: "tabular-nums"
									}
								}, `${folderCount > 0 ? (slideIndexState + 1) : 0} / ${folderCount} 张`)
							),
							h("div", {
								style: {
									fontSize: 11,
									opacity: 0.75,
									whiteSpace: "nowrap",
									overflow: "hidden",
									textOverflow: "ellipsis",
									background: "rgba(0,0,0,0.06)",
									padding: "3px 8px",
									borderRadius: 6
								},
								title: currentFileName
							}, currentFileName),
							h("div", { style: { display: "flex", gap: 6, alignItems: "center", marginTop: 2 } },
								h("button", {
									type: "button",
									className: "sc-ghost",
									style: { flex: 1, padding: "6px 8px", fontSize: 12, borderRadius: 8 },
									disabled: folderCount === 0,
									onClick: () => {
										const prev = getPrevSlideSrc();
										if (prev) {
											// 历史栈的"当前张"换成上一张（getPrevSlideSrc 只读不剪）
											slideshowHistory.pop();
											slideshowHistory.push(prev);
											if (slideshowHistory.length > 50) slideshowHistory.shift();
											crossfadeTo(prev, prefs);
											setSlideIndexState(slideshowIndex);
											setCurrentSlideSrc(prev);
										}
									}
								}, "⏮ 上一张"),
								h("button", {
									type: "button",
									className: prefs.slideshowPaused ? "sc-ghost" : "sc-primary",
									style: { flex: 1.2, padding: "6px 8px", fontSize: 12, borderRadius: 8, fontWeight: 600 },
									disabled: folderCount === 0,
									onClick: () => {
										const nextPaused = !prefs.slideshowPaused;
										update({ slideshowPaused: nextPaused });
										setWallPrefs({ slideshowPaused: nextPaused });
										if (nextPaused) stopSlideshow();
										else startSlideshow({ ...prefs, slideshowPaused: false });
									}
								}, prefs.slideshowPaused ? "▶ 继续轮播" : "⏸ 暂停轮播"),
								h("button", {
									type: "button",
									className: "sc-ghost",
									style: { flex: 1, padding: "6px 8px", fontSize: 12, borderRadius: 8 },
									disabled: folderCount === 0,
									onClick: () => {
										const next = getNextSlideSrc(prefs);
										if (next) {
											slideshowHistory.push(next);
											crossfadeTo(next, prefs);
											setSlideIndexState(slideshowIndex);
											setCurrentSlideSrc(next);
										}
									}
								}, "⏭ 下一张"),
							)
						) : null
					),

					// ====================== 右侧：模块化卡片调参 ======================
					h("div", { className: "sc-wall-right" },
						// 1. 一键风格搭配预设
						h("div", { className: "sc-wall-card" },
							h("div", { className: "sc-wall-card-title" },
								h("span", null, "🌟 风格预设（一键套用最佳搭配）"),
								h("span", { style: { fontSize: 11, opacity: 0.6 } }, "点击即生效")
							),
							h("div", { style: { display: "flex", gap: 8 } },
								WALL_PRESETS.map((p) =>
									h("button", {
										key: p.id,
										type: "button",
										className: `sc-preset-pill ${activePreset === p.id ? "active" : ""}`.trim(),
										onClick: () => applyPreset(p)
									},
										h("span", null, p.name),
										h("span", { className: "desc" }, p.desc)
									)
								)
							)
						),

						// 2. 幻灯片图库与播放设置（仅轮播模式）
						isSlideshow ? h("div", { className: "sc-wall-card" },
							h("div", { className: "sc-wall-card-title" },
								h("span", null, "📁 图库与轮播调度"),
								h("span", {
									style: {
										fontSize: 11,
										color: "var(--dsw-alias-accent, #4dabf7)",
										background: "color-mix(in srgb, var(--dsw-alias-accent, #4dabf7) 12%, transparent)",
										padding: "2px 8px",
										borderRadius: 999,
										fontWeight: 600
									}
								}, folderScanning ? "正在扫描…" : `已识别 ${folderCount} 张图片`)
							),
							// 目录选择栏
							h("div", { style: { display: "flex", gap: 6, alignItems: "center" } },
								h("input", {
									type: "text",
									className: "sc-input",
									style: {
										fontSize: 11.5,
										padding: "6px 9px",
										borderRadius: 8,
										border: "1px solid rgba(128,128,128,0.25)",
										background: "rgba(0,0,0,0.12)",
										color: "inherit",
										flex: 1,
										minWidth: 0,
										boxSizing: "border-box"
									},
									placeholder: "输入或直接粘贴图库完整路径（如 C:\\Pictures）回车",
									value: prefs.slideshowFolder || "",
									onChange: (e) => {
										const val = e.target.value;
										update({ slideshowFolder: val, mode: "slideshow" });
									},
									onBlur: async (e) => {
										const val = e.target.value.trim();
										if (val) {
											setFolderScanning(true);
											try {
												const files = await scanSlideshowFolder(val);
												setFolderCount(files.length);
												if (files.length === 0) {
													setWarn("所选文件夹内未发现有效图片格式 (.jpg, .png, .webp 等)");
												} else {
													setWarn("");
													setSlideIndexState(0);
													setCurrentSlideSrc("/api/session-center.wallpaper.file?path=" + encodeURIComponent(files[0]));
												}
											} catch (err) {
												setWarn("路径无效或无法访问：" + (err?.message || String(err)));
											} finally {
												setFolderScanning(false);
											}
										}
									},
									onKeyDown: (e) => { if (e.key === "Enter") e.target.blur(); }
								}),
								h("button", {
									type: "button",
									className: "sc-primary",
									disabled: folderScanning,
									style: { padding: "6px 12px", fontSize: 12, borderRadius: 8, flexShrink: 0, whiteSpace: "nowrap" },
									onClick: pickFolderNative
								}, folderScanning ? "扫描中…" : "📁 浏览文件夹…"),
								h("input", {
									ref: dirInputRef,
									type: "file",
									webkitdirectory: "",
									directory: "",
									multiple: true,
									style: { display: "none" },
									onChange: onBrowserDirChange
								})
							),
							warn ? h("div", { style: { fontSize: 11.5, color: "#e5484d" } }, warn) : null,

							// 切换间隔
							h("div", { style: { display: "flex", flexDirection: "column", gap: 5, marginTop: 2 } },
								h("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12 } },
									h("span", { style: { opacity: 0.8 } }, "自动切换间隔"),
									h("span", { style: { fontSize: 11, opacity: 0.55 } }, "后台平滑淡入淡出")
								),
								h("div", { style: { display: "flex", gap: 4 } },
									[10, 30, 60, 300, 900, 1800].map((sec) => {
										const label = sec < 60 ? `${sec}秒` : `${sec / 60}分钟`;
										const active = (prefs.slideshowInterval ?? 30) === sec;
										return h("button", {
											key: sec,
											type: "button",
											className: active ? "sc-primary" : "sc-ghost",
											style: { flex: 1, padding: "4px 0", fontSize: 11, borderRadius: 6, textAlign: "center" },
											onClick: () => {
												update({ slideshowInterval: sec });
												setWallPrefs({ slideshowInterval: sec });
												startSlideshow({ ...prefs, slideshowInterval: sec });
											}
										}, label);
									})
								)
							),

							// 播放顺序
							h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 } },
								h("span", { style: { fontSize: 12, opacity: 0.8 } }, "轮播播放策略"),
								h("div", { style: { display: "flex", gap: 6 } },
									h("button", {
										type: "button",
										className: prefs.slideshowOrder === "random" ? "sc-primary" : "sc-ghost",
										style: { padding: "3px 10px", fontSize: 11.5, borderRadius: 6 },
										onClick: () => update({ slideshowOrder: "random" })
									}, "🔀 随机洗牌播放"),
									h("button", {
										type: "button",
										className: prefs.slideshowOrder === "sequence" ? "sc-primary" : "sc-ghost",
										style: { padding: "3px 10px", fontSize: 11.5, borderRadius: 6 },
										onClick: () => update({ slideshowOrder: "sequence" })
									}, "🔁 顺序循环轮播"),
								)
							)
						) : null,

						// 3. 画面遮罩与调光（Mask & Tint）
						h("div", { className: "sc-wall-card" },
							h("div", { className: "sc-wall-card-title" },
								h("span", null, "🎨 画面遮罩色调（防晃眼滤镜）"),
								h("span", { className: "sc-wall-subtext" }, "在壁纸上覆盖半透明色层")
							),
							h("div", { className: "sc-wall-subtext" }, "降低画面整体高光与饱和度，让浅色或复杂二次元壁纸不刺眼，统一整体明暗氛围。"),
							h("div", { className: "sc-palette", style: { marginTop: 2 } },
								WALL_MASKS.map((m) => h("button", {
									key: m.color,
									type: "button",
									className: "swatch" + (prefs.maskColor === m.color ? " on" : ""),
									style: { background: m.color, border: "1px solid rgba(90,100,115,.35)", width: 28, height: 28, borderRadius: 8 },
									title: m.name,
									onClick: () => update({ maskColor: m.color }),
								}))
							),
							sliderWithDesc(
								"遮罩不透明度",
								"值越高遮罩越深，背景越沉稳克制；0% 为原始壁纸明度",
								maskAlphaPercent(prefs.maskColor),
								0, 85, 5, "%",
								(v) => update({ maskColor: withMaskAlpha(prefs.maskColor, v / 100) })
							)
						),

						// 4. 景深虚化与毛玻璃质感（Blur & Glass）
						h("div", { className: "sc-wall-card" },
							h("div", { className: "sc-wall-card-title" },
								h("span", null, "🔍 景深虚化与毛玻璃质感"),
								h("span", { className: "sc-wall-subtext" }, "对比左侧实景文字预览")
							),
							sliderWithDesc(
								"背景景深模糊 (Wallpaper Blur)",
								"虚化底层壁纸画面。0px 为壁纸原图超清；调高可柔化成色彩景深，不抢视线",
								prefs.blur, 0, 18, 1, "px",
								(v) => update({ blur: v })
							),
							sliderWithDesc(
								"卡片磨砂模糊 (Card Frosted Blur)",
								"聊天卡片自身的毛玻璃折射强度。调大能彻底柔化底图杂线，让文字极易阅读",
								prefs.cardBlur ?? 24, 0, 48, 2, "px",
								(v) => update({ cardBlur: v })
							),
							sliderWithDesc(
								"会话卡片透明度 (Card Opacity)",
								"聊天卡片底色实心程度。调低通透感强烈（显露壁纸），调高文字对比度更强",
								prefs.glass ?? 55, 30, 100, 5, "%",
								(v) => update({ glass: v })
							),
							sliderWithDesc(
								"壁纸画面缩放比例",
								"放大壁纸后，可在左侧预览画框中按住鼠标左键拖动平移构图",
								Math.round(prefs.zoom ?? 100), 100, 250, 5, "%",
								setZoom
							)
						),

						// 5. 科技动效与高级质感
						h("div", { className: "sc-wall-card" },
							h("div", { className: "sc-wall-card-title" },
								h("span", null, "✨ 科技动效与高阶质感"),
								null
							),
							toggleWithDesc(
								"DeepSeek 官网科技网格流光动效",
								"在背景生成科技感呼吸网格星阵与鼠标交互光晕",
								prefs.gridEnabled ?? true,
								(v) => update({ gridEnabled: v })
							),
							(prefs.gridEnabled ?? true) ? h("div", {
								style: {
									display: "flex",
									flexDirection: "column",
									gap: 8,
									paddingLeft: 12,
									borderLeft: "2px solid var(--dsw-alias-accent, #4dabf7)",
									marginTop: 4
								}
							},
								sliderWithDesc("流光脉冲速度", "", prefs.gridSpeed ?? 100, 30, 250, 10, "%", (v) => update({ gridSpeed: v }), { readOnly: true }),
								sliderWithDesc("网格密度 (点阵间距)", "", prefs.gridDensity ?? 45, 25, 75, 5, "px", (v) => update({ gridDensity: v })),
								sliderWithDesc("科技光晕亮度", "", prefs.gridGlow ?? 70, 10, 100, 5, "%", (v) => update({ gridGlow: v })),
							) : null,
							h("div", { style: { height: 1, background: "rgba(128,128,128,0.14)", margin: "4px 0" } }),
							toggleWithDesc(
								"苹果 Liquid Glass 边缘折射质感",
								"模拟液态玻璃微透镜边缘衍射，让卡片边缘浮现晶莹高光",
								prefs.glassRefract ?? false,
								(v) => update({ glassRefract: v })
							),
							h("div", { style: { height: 1, background: "rgba(128,128,128,0.14)", margin: "4px 0" } }),
							toggleWithDesc(
								"闲置 3 秒自动隐去界面（静心欣赏壁纸）",
								"输入框无文字且 3 秒无鼠标移动时自动淡出中间界面；仅移动鼠标即刻唤醒（隐藏时单击屏幕无效）",
								prefs.zenIdleEnabled ?? true,
								(v) => update({ zenIdleEnabled: v })
							)
						)
					)
				),
				actions: [
					h("div", { style: { display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" } },
						h("button", {
							type: "button",
							className: "sc-ghost",
							style: { fontSize: 12, padding: "6px 12px" },
							onClick: resetDefaults
						}, "🔄 恢复默认配置"),
						h("div", { style: { display: "flex", gap: 8 } },
							h("button", { type: "button", className: "sc-ghost", onClick: onClose }, t("close")),
							h("button", {
								type: "button",
								className: "sc-primary",
								style: { padding: "7px 20px", fontWeight: 600, fontSize: 13 },
								onClick: apply
							}, "💾 保存并应用"),
						)
					)
				],
			});
		}

		// -------------------------------------------------------- row menu

		function RowMenu({ t, x, y, onClose, items }) {
			react.useEffect(() => {
				const onDown = (e) => {
					if (!e.target.closest?.(".sc-menu")) onClose();
				};
				document.addEventListener("mousedown", onDown);
				return () => document.removeEventListener("mousedown", onDown);
			}, [onClose]);
			// x/y are already relative to the containing block (.sc-root).
			return h("div", { className: "sc-menu", style: { left: x, top: y } },
				items.map((item, i) =>
					item.sep
						? h("div", { key: "s" + i, className: "sc-menu-sep" })
						: h("button", {
							key: item.key, type: "button", className: "sc-menu-item" + (item.danger ? " danger" : ""),
							disabled: item.disabled,
							onClick: () => { onClose(); item.onClick(); },
						}, item.label),
				),
			);
		}

		function RepairDialog({ t, r, onClose, onRepair }) {
			const L = makeT(t);
			const body = r.busy
				? h("div", { className: "body" }, "…")
				: r.report
					? h("div", { className: "body" },
						r.report.valid
							? h("div", null, `${L("healthy")} ✓` + (r.report.acceptedEvents ? ` · ${fmtNum(r.report.acceptedEvents)} ${L("events")}` : ""))
							: h("div", null,
								h("div", null, `${L("issuesFound")}: ${r.report.issue ? `${L("line")} ${r.report.issue.line} (${L("expected")} ${r.report.issue.expected}, ${L("got")} ${r.report.issue.got})` : r.report.note}`),
								r.repaired
									? h("div", { style: { marginTop: 8 } },
										h("div", null, `${L("repairDone")} ✓`),
										h("pre", null, `${L("kept")} ${r.report.keptRows} · ${L("dropped")} ${r.report.droppedRows}\n${L("lastEvent")}: seq ${r.report.lastSeq} (${r.report.lastType})${r.corruptBackup ? `\n${L("originalAt")}:\n${r.corruptBackup}` : ""}`),
									)
									: null,
							),
					)
					: null;
			const actions = r.report && !r.report.valid && !r.repaired
				? [
					h("button", { className: "sc-ghost", onClick: onClose }, L("cancel")),
					h("button", { className: "sc-primary", onClick: () => onRepair(r.sessionId), disabled: r.busy }, L("repair")),
				]
				: [h("button", { className: "sc-ghost", onClick: onClose }, L("close"))];
			return Dialog({ title: L("diagnose"), body, actions, onClose });
		}

		const subscribePanelInfo = (onStoreChange) => {
			try {
				return ctxLayout?.panelInfo?.subscribe?.(onStoreChange) ?? (() => {});
			} catch {
				return () => {};
			}
		};
		const getSnapshotPanelInfo = () => {
			try {
				return ctxLayout?.panelInfo?.getSnapshot?.()?.activePanelId ?? null;
			} catch {
				return null;
			}
		};

		// 页面级对话框宿主：挂在 shell.overlay 槽上，整页居中渲染
		function ScDialogsHost() {
			react.useSyncExternalStore(dialogBus.subscribe, dialogBus.getSnapshot, dialogBus.getSnapshot);
			const st = dialogBus.state;
			const activePanelId = react.useSyncExternalStore(
				subscribePanelInfo,
				getSnapshotPanelInfo,
				() => null,
			);
			// 有弹窗/面板打开时给 <html> 挂 sc-veil-open：冻结壁纸的动态层（网格 canvas
			// 在 JS 侧跳过绘制，CSS 动画在样式表里暂停）。否则背景每帧都变，面板与遮罩的
			// backdrop-filter 就要每帧重算 —— 滑动壁纸设置面板、点重启弹确认框都会掉帧。
			// toast 不算"遮罩打开"：它是 2.2s 的小提示，不该冻住背景。
			react.useEffect(() => {
				try {
					const open = Boolean(st.confirm || st.picker || st.repair || st.tags
						|| st.wallpaper || st.preview || st.welcome || activePanelId);
					document.documentElement.classList.toggle("sc-veil-open", open);
				} catch { /* ignore */ }
			}, [st, activePanelId]);
			const L = makeT(dialogBus.t);
			const tags = dialogBus.getTags?.() ?? [];
			const refresh = dialogBus.onChanged;
			react.useEffect(() => {
				if (!activePanelId) return;
				const onKey = (e) => {
					if (e.key === "Escape") {
						const hasDialog = Boolean(st.confirm || st.picker || st.repair || st.tags || st.wallpaper);
						if (!hasDialog) {
							e.preventDefault();
							try { ctxLayout?.selectPanel?.(null); } catch {}
						}
					}
				};
				window.addEventListener("keydown", onKey, true);
				return () => window.removeEventListener("keydown", onKey, true);
			}, [activePanelId, st]);
			react.useEffect(() => {
				if (!activePanelId) return;
				const injectToolbar = () => {
					const panel = document.querySelector('[data-plugin-panel]');
					if (!panel) return;
					const toolbar = panel.querySelector('[class*="toolbar"]');
					if (!toolbar || toolbar.querySelector(".sc-panel-tb-back")) return;
					const btn = document.createElement("button");
					btn.type = "button";
					btn.className = "sc-panel-back-btn sc-panel-tb-back";
					btn.title = (L("backToConversation") || "返回会话") + " (Esc)";
					btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle"><line x1="13" y1="8" x2="3" y2="8"></line><polyline points="8 3 3 8 8 13"></polyline></svg><span>' + (L("backToConversation") || "返回会话") + '</span><span class="sc-panel-back-key">Esc</span>';
					btn.onclick = () => { try { ctxLayout?.selectPanel?.(null); } catch {} };
					toolbar.prepend(btn);
				};
				injectToolbar();
				const tId = setTimeout(injectToolbar, 80);
				let observer = null;
				try {
					const host = document.querySelector('[data-plugin-panel]') || document.querySelector('[class*="centerCol"]');
					if (host) {
						observer = new MutationObserver(injectToolbar);
						observer.observe(host, { childList: true, subtree: true });
					}
				} catch {}
				return () => {
					clearTimeout(tId);
					if (observer) observer.disconnect();
					const existing = document.querySelector(".sc-panel-tb-back");
					if (existing) existing.remove();
				};
			}, [activePanelId, L]);
			react.useEffect(() => {
				if (!st.toast) return;
				const timer = setTimeout(() => dialogBus.set({ toast: null }), 2200);
				return () => clearTimeout(timer);
			}, [st.toast]);
			react.useEffect(() => {
				if (!st.welcome) return;
				// 感知提速：欢迎弹窗 4.2s → 2.2s。弹窗遮着内容，内容在弹窗后面已
				// 开始渲染；提前放行，用户能更快看到可用界面（点击仍立即关闭）。
				const timer = setTimeout(() => dialogBus.set({ welcome: false }), 2200);
				return () => clearTimeout(timer);
			}, [st.welcome]);
			const kids = [];
			if (st.tags) {
				kids.push(h(TagManager, {
					key: "tags", t: L, tags,
					onClose: () => dialogBus.set({ tags: false }),
					onChanged: () => { refresh?.(); dialogBus.touch(); },
				}));
			}
			if (st.wallpaper) {
				kids.push(h(WallpaperPanel, { key: "wall", t: L, onClose: () => dialogBus.set({ wallpaper: false }) }));
			}
			if (st.picker) {
				kids.push(h(TagPicker, {
					key: "picker", t: L, tags, current: st.picker.current,
					count: { sessions: st.picker.sessionIds },
					onClose: () => dialogBus.set({ picker: null }),
					onApplied: () => {
						dialogBus.set({ toast: L("applied") });
						refresh?.();
						dialogBus.touch();
						dialogBus.set({ picker: null });
					},
				}));
			}
			if (st.confirm) {
				kids.push(h(Confirm, {
					key: "confirm", t: L, title: st.confirm.title, message: st.confirm.message, danger: st.confirm.danger,
					onCancel: () => dialogBus.set({ confirm: null }),
					onOk: () => {
						const ok = st.confirm.onOk;
						dialogBus.set({ confirm: null });
						ok?.();
					},
				}));
			}
			if (st.repair) {
				kids.push(h(RepairDialog, {
					key: "repair", t: L, r: st.repair,
					onClose: () => dialogBus.set({ repair: null }),
					onRepair: (sessionId) => {
						dialogBus.set((s) => ({ repair: { ...s.repair, busy: true } }));
						call("session.repair", { sessionId })
							.then((result) => {
								dialogBus.set((s) => ({ repair: { sessionId, report: result.report, repaired: result.repaired, corruptBackup: result.corruptBackup, busy: false } }));
								refresh?.();
								dialogBus.touch();
							})
							.catch((e) => {
								dialogBus.set({ repair: null });
								window.alert(String(e.message ?? e));
							});
					},
				}));
			}
			if (st.preview) {
				kids.push(h("div", {
					key: "preview", className: "sc-overlay",
					onClick: () => dialogBus.set({ preview: null }),
				}, h("div", { className: "sc-preview", onClick: (e) => e.stopPropagation() },
					h("img", {
						src: st.preview.url, alt: st.preview.label ?? "",
						referrerPolicy: "no-referrer",
						onClick: () => dialogBus.set({ preview: null }),
					}),
					h("button", {
						type: "button", className: "sc-dialog-x", "aria-label": "close",
						style: { position: "absolute", top: 10, right: 10 },
						onClick: () => dialogBus.set({ preview: null }),
					}, "✕"),
					st.preview.label ? h("div", { className: "sc-preview-label", title: st.preview.label }, st.preview.label) : null,
				)));
			}
			if (st.welcome) {
				kids.push(h(WelcomeOverlay, { key: "welcome" }));
			}
			if (st.toast) kids.push(h("div", { key: "toast", className: "sc-toast" }, st.toast));
			return h(react.Fragment, null, ...kids);
		}

		// ---------- 设置 → 常规：刷新/重启后是否回到上次会话（localStorage 开关，
		// 纯客户端行为，服务端不感知；关闭时由 apply 里的生效逻辑清键 + clear） ----------
		function SessionRestoreRow({ t }) {
			const tt = makeT(t);
			const [on, setOn] = react.useState(() => {
				try { return localStorage.getItem("dsh-my:restore-session") !== "0"; }
				catch { return true; }
			});
			const choose = (value) => {
				if (value === on) return;
				try {
					localStorage.setItem("dsh-my:restore-session", value ? "1" : "0");
					setOn(value);
				} catch { /* localStorage 不可用时保持原值 */ }
			};
			const options = [
				{ id: true, label: tt("restoreOn") },
				{ id: false, label: tt("restoreOff") },
			];
			return h("div", { className: "sc-vp-row" },
				h("div", { className: "sc-vp-text" },
					h("div", { className: "sc-vp-title" }, tt("restoreTitle")),
					h("div", { className: "sc-vp-desc" }, tt("restoreDesc")),
				),
				h("div", { className: "sc-vp-control" }, options.map((o) =>
					h("button", {
						key: String(o.id),
						type: "button",
						className: "sc-vp-btn" + (on === o.id ? " on" : ""),
						onClick: () => choose(o.id),
					}, o.label)
				)),
			);
		}

		// ---------- 设置 → 常规：壁纸（沉浸式背景）入口：顶栏壁纸按钮移除后迁到设置，
		// 点击打开壁纸设置弹窗（dialogBus.wallpaper） ----------
		function WallpaperSettingsRow({ t }) {
			const tt = makeT(t);
			const on = dialogBus.state.wallpaper;
			react.useSyncExternalStore(dialogBus.subscribe, dialogBus.getSnapshot, dialogBus.getSnapshot);
			return h("div", { className: "sc-vp-row" },
				h("div", { className: "sc-vp-text" },
					h("div", { className: "sc-vp-title" }, tt("wallpaperTitle")),
					h("div", { className: "sc-vp-desc" }, tt("wallpaperDesc")),
				),
				h("div", { className: "sc-vp-control" },
					h("button", { type: "button", className: "sc-vp-btn" + (on ? " on" : ""), onClick: () => dialogBus.set({ wallpaper: !on }) }, tt("open")),
				),
			);
		}

		// ---------- 输入行统计（替换官方 StatsLine）：砍掉「工具调用」耗时项，
		// 前置「费用 / 余额」，与官方同排版（12px/20px/label-tertiary），同线同基线 ----------
		// 以下推导/格式化逻辑与官方 StatsLine 一致（字段与口径对齐 sessionStats 投影）。

		/** 折叠 assistant/tool-result 节点得到窗口级统计（无 sessionStats 投影时的兜底）。 */
		function statsDerive(nodes) {
			const turns = new Set();
			let steps = 0;
			let llmMs = 0;
			let ttftMs = 0;
			let ttftSteps = 0;
			let decodeMs = 0;
			let decodeTokens = 0;
			for (const node of nodes) {
				if (node.kind === "tool-result") continue;
				if (node.kind !== "assistant") continue;
				turns.add(node.turn);
				steps += 1;
				if (node.timing !== void 0 && node.timing.stepStartTime !== null) {
					llmMs += Math.max(0, node.timing.completedTime - node.timing.stepStartTime);
				}
				const reading = assistantStepReading(node);
				if (reading.ttftMs !== null) {
					ttftMs += reading.ttftMs;
					ttftSteps += 1;
				}
				if (reading.decodeMs !== null && reading.outputTokens !== null) {
					decodeMs += reading.decodeMs;
					decodeTokens += reading.outputTokens;
				}
			}
			return { turns: turns.size, steps, llmMs, ttftMs, ttftSteps, decodeMs, decodeTokens };
		}

		/** assistant 节点 timing 读出（ttft/decode/输出 token，官方同款口径）。 */
		function assistantStepReading(node) {
			const timing = node.timing;
			const outputTokens = (() => {
				const v = node.usage?.outputTokens;
				return typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null;
			})();
			return {
				ttftMs: timing !== void 0 && timing.stepStartTime !== null && timing.firstTokenTime !== null
					? Math.max(0, timing.firstTokenTime - timing.stepStartTime) : null,
				decodeMs: timing !== void 0 && timing.firstTokenTime !== null
					? Math.max(0, timing.completedTime - timing.firstTokenTime) : null,
				outputTokens,
			};
		}

		/** 紧凑 token 数：517 / 12.2K / 517K / 1.2M。 */
		function statsFmtTokens(n) {
			const scaled = (v) => (v >= 100 ? String(Math.round(v)) : String(Math.round(v * 10) / 10));
			if (n < 1e3) return String(n);
			if (n < 1e6) return `${scaled(n / 1e3)}K`;
			return `${scaled(n / 1e6)}M`;
		}

		/** 紧凑时长：45.2s / 2m42s。 */
		function statsFmtDuration(ms) {
			const s = ms / 1e3;
			if (s < 60) return `${Math.round(s * 10) / 10}s`;
			const whole = Math.round(s);
			return `${Math.floor(whole / 60)}m${whole % 60}s`;
		}

		/** 吞吐量数字：>=10 取整，其余一位小数。 */
		function statsFmtTps(tps) {
			const clamped = Math.max(0, tps);
			return clamped >= 10 ? String(Math.round(clamped)) : String(Math.round(clamped * 10) / 10);
		}

		/** 缓存命中率整数百分比（与官方同算法），全命中返回 100。 */
		function statsCacheHitPercent(usage) {
			const denominator = statsBilledInput(usage);
			if (denominator === 0) return null;
			const missed = usage.uncachedInputTokens + usage.cacheWriteTokens;
			if (missed === 0) return "100";
			const integerPercent = statsRoundedPercent(usage.cacheReadTokens, denominator);
			if (integerPercent < 100) return String(integerPercent);
			let decimalPlaces = 1;
			let scaledDoubleGap = missed * 200;
			const denominatorTens = Math.floor(denominator / 10);
			while (scaledDoubleGap <= denominatorTens) {
				scaledDoubleGap *= 10;
				decimalPlaces += 1;
			}
			const denominatorOnes = denominator % 10;
			let roundedLoss = 5;
			for (let loss = 1; loss < 5; loss += 1) {
				const factor = loss * 2 + 1;
				const threshold = factor * denominatorTens + Math.floor(factor * denominatorOnes / 10);
				if (scaledDoubleGap <= threshold) {
					roundedLoss = loss;
					break;
				}
			}
			return `99.${"9".repeat(decimalPlaces - 1)}${10 - roundedLoss}`;
		}

		/** 命中率整数百分比二分（官方算法）。 */
		function statsRoundedPercent(cacheReadTokens, denominator) {
			const denominatorQuotient = Math.floor(denominator / 200);
			const denominatorRemainder = denominator % 200;
			let lower = 0;
			let upper = 100;
			while (lower < upper) {
				const candidate = Math.floor((lower + upper + 1) / 2);
				const factor = candidate * 2 - 1;
				if (cacheReadTokens >= factor * denominatorQuotient + Math.ceil(factor * denominatorRemainder / 200)) lower = candidate;
				else upper = candidate - 1;
			}
			return lower;
		}

		/** 计费输入三桶之和（未命中 + 命中 + 写缓存）。 */
		function statsBilledInput(usage) {
			return usage.uncachedInputTokens + usage.cacheReadTokens + usage.cacheWriteTokens;
		}

		// 统计项之间的分隔：2 个不换行空格（≈7px），比项内「名称 内容」的
		// 单个空格（≈3.5px）宽；不用 | 分隔符，保证整行不被截断。
		const GAP = "\u00a0\u00a0";

		function StatsLinePlus({ useChat, useProjection, sessionId, t }) {
			// chat.legacy.nodes 属于「对话视图」store，不在 SessionSnapshot 上：
			// 宿主官方同槽实现读的也是 useChat((s) => s.legacy.nodes)
			// （dsh-client-ui-chat/lib/client.js:4080）。此前写的是
			// useSession((s) => s.chat.legacy.nodes)，渲染期必然抛 TypeError，
			// 被 slot 错误边界退役整条统计行 —— 表现为官方 StatsPills 顶替、
			// 「费用/余额」静默消失（2026-09-26 定位）。
			const settledNodes = useChat((s) => s.legacy?.nodes ?? []);
			const tt = makeTF(t);
			const usage = typeof useProjection === "function" ? useProjection("tokenUsage") : void 0;
			const projected = typeof useProjection === "function" ? useProjection("sessionStats") : void 0;
			const stats = react.useMemo(() => projected ?? statsDerive(settledNodes), [projected, settledNodes]);
			// 费用 / 余额：服务端精确计费（每请求时段）+ 官方余额接口（30s 缓存）
			const [cost, setCost] = react.useState(null);
			const [balance, setBalance] = react.useState(null);
			react.useEffect(() => {
				if (!sessionId) return;
				let alive = true;
				let timer = null;
				// channel 记录最近一次成本响应的厂商通道；余额只在官方直连时拉取/展示。
				let channel = null;
				const tick = async () => {
					if (!alive) return;
					const c = await call("session.cost", { sessionId }).catch(() => null);
					if (!alive) return;
					if (c) {
						setCost(c);
						channel = c.channel ?? null;
					}
					// 仅当非 CCAI 中转（或通道未知）时才查询官方余额；ccai 无官方余额接口。
					if (channel !== "ccai") {
						const b = await call("balance", {}).catch(() => null);
						if (alive && b) setBalance(b);
					} else if (alive) {
						setBalance(null);
					}
					timer = setTimeout(tick, 8000);
				};
				tick();
				return () => {
					alive = false;
					if (timer !== null) clearTimeout(timer);
				};
			}, [sessionId]);
			const fmtMoney = (n) => (Number.isFinite(n) ? n.toFixed(2) : "—");
			const sym = (currency) => (currency === "USD" ? "$" : "¥");
			const groups = [];
			// 费用/余额前置：窄宽截断时仍完整可见。
			// 费用按服务端厂商通道/模型精确计价；余额仅对 DeepSeek 官方直连有意义，
			// 使用 CCAI 等第三方中转（channel=ccai）或混用通道时不予显示（成本仍准确）。
			if (cost) {
				groups.push(tt("statCost", { v: `${sym("CNY")}${fmtMoney(cost.cost)}` }));
			}
			const balanceRelevant = balance && cost?.channel !== "ccai";
			if (balanceRelevant) groups.push(tt("statBalance", { v: `${sym(balance.currency)}${fmtMoney(balance.total)}` }));
			if (stats.steps > 0) {
				groups.push(tt("statTurnsSteps", { turns: stats.turns, steps: stats.steps }));
				const durations = [];
				if (stats.llmMs > 0) durations.push(`LLM ${statsFmtDuration(stats.llmMs)}`);
				// 工具调用耗时：按用户要求砍掉（此前显示 530m 级长耗时）
				if (durations.length > 0) groups.push(durations.join(" · "));
				const speeds = [];
				if (stats.ttftSteps > 0) speeds.push(tt("statFirstToken", { v: statsFmtDuration(stats.ttftMs / stats.ttftSteps) }));
				if (stats.decodeMs > 0) speeds.push(`${statsFmtTps(stats.decodeTokens / (stats.decodeMs / 1e3))} tok/s`);
				if (speeds.length > 0) groups.push(speeds.join(" · "));
			}
			if (usage !== void 0 && (statsBilledInput(usage) > 0 || usage.outputTokens > 0)) {
				const hit = statsCacheHitPercent(usage);
				if (hit !== null) groups.push(tt("statCacheHit", { hit }));
				groups.push(tt("statTokens", { input: statsFmtTokens(statsBilledInput(usage)), output: statsFmtTokens(usage.outputTokens) }));
			}
			const line = groups.join(GAP);
			const rootRef = react.useRef(null);
			const [truncated, setTruncated] = react.useState(false);
			react.useLayoutEffect(() => {
				const el = rootRef.current;
				if (el === null) return;
				const measure = () => setTruncated(el.scrollWidth > el.clientWidth);
				measure();
				if (typeof ResizeObserver === "undefined") return;
				const observer = new ResizeObserver(measure);
				observer.observe(el);
				return () => observer.disconnect();
			}, [line]);
			return h("div", {
				ref: rootRef,
				className: "sc-dock-stats",
				title: truncated ? line : void 0,
			}, groups.map((group, i) => react.createElement(react.Fragment, { key: i },
				i > 0 && GAP,
				h("span", null, group),
			)));
		}

		// 统计行（composer.dock）归位器：把 dock 从输入卡的 DOM 末尾移入底部操作行
		// （div.row）中间，与 权限/上传/模型选择/发送 同排平齐。React 重建 dock
		// 时（会话切换/槽位版本更新）会被放回原处，MutationObserver 立即再归位。
		function installDockParking() {
			let raf = 0;
			const park = () => {
				raf = 0;
				const seat = document.querySelector("[data-composer-seat]");
				if (!seat) return;
				const dock = seat.querySelector('[data-slot="conversation.composer.dock"]');
				if (!dock) return;
				// dock 是输入卡的兄弟节点（card 之后），row 在 card 内部；
				// 精确匹配：含 trailing 子元素的「操作行」才是目标（避开 grow/scroll）
				const card = seat.querySelector("[data-composer-card]");
				const row = [...(card?.querySelectorAll("[class*='_row']") ?? [])]
					.find((el) => el.querySelector("[class*='trailing']"));
				if (!row || dock.parentElement === row) return;
				const trailing = row.querySelector("[class*='trailing']");
				row.insertBefore(dock, trailing ?? null);
			};
			const observer = new MutationObserver(() => {
				if (raf) return;
				raf = requestAnimationFrame(park);
			});
			observer.observe(document.documentElement, { childList: true, subtree: true });
			park();
			// 返回 observer，由调用方（apply 里的 ctx.effect）负责 disconnect：
			// 此前它观察 document.documentElement 的 childList+subtree 且**永不断开**，
			// 流式输出期间每个 DOM 变更都会进回调（已有 rAF 节流，但没有生命周期终点）。
			return observer;
		}

		// 排队条（替换官方 QueueDock）：编辑 / 删除 / 独立「发送」（steer）。
		// 曾经还有一个「↑ 上移」按钮，它调用 /api-ext/session-center.queue.move，
		// 但服务端从未注册过该路由（点一次错一次），而官方 updateQueue 只有
		// edit/remove/steer —— 要重排就得碰私有 Agent.inbox。故删除该按钮：
		// 不保留一个永远报错的入口，也不为它去依赖私有 API。
		function QueueStrip({ useSession, sessionId, updateQueue, notify, t }) {
			const inbox = typeof useSession === "function" ? useSession((s) => s?.queue) : null;
			const queue = react.useMemo(() => (Array.isArray(inbox) ? inbox.filter((row) => row && row.placement === "queued") : []), [inbox]);
			const running = typeof useSession === "function" ? useSession((s) => s?.running) : false;
			const [busy, setBusy] = react.useState(null);
			const [collapsed, setCollapsed] = react.useState(true);
			const [editing, setEditing] = react.useState(null);
			const tt = makeT(t);
			if (queue.length === 0) return null;
			const expanded = queue.length === 1 || !collapsed || editing !== null || busy !== null;
			const applyAction = async (itemId, action, failure) => {
				setBusy(itemId);
				try {
					await updateQueue(itemId, action);
					return true;
				} catch {
					notify("error", failure);
					return false;
				} finally {
					setBusy((c) => (c === itemId ? null : c));
				}
			};
			const saveEdit = async () => {
				if (editing === null || editing.text.trim() === "") return;
				if (await applyAction(editing.id, {
					kind: "edit",
					content: [{ type: "text", text: editing.text }],
				}, tt("queueEditFailed"))) setEditing(null);
			};
			return h("div", { className: "sc-q-dock", "data-queue-dock": "" },
				h("div", { className: "sc-q-panel" },
					queue.length > 1 && h("button", {
						type: "button", className: "sc-q-header",
						"aria-expanded": expanded,
						onClick: () => setCollapsed(!collapsed),
					},
						h("span", { className: "sc-q-count" }, `${tt("queueCount")} ${queue.length}`),
						h("span", { className: "sc-q-chevron" }, expanded ? "▾" : "▸"),
					),
					h("ul", { className: "sc-q-list", hidden: !expanded },
						queue.map((row, i) => h("li", { key: row.id, className: "sc-q-row" },
							h("span", { className: "sc-q-num", "aria-hidden": "true" }, String(i + 1)),
							editing?.id === row.id
								? h("input", {
									className: "sc-q-editor", autoFocus: true,
									"aria-label": tt("queueEdit"),
									value: editing.text,
									onChange: (e) => setEditing({ id: row.id, text: e.currentTarget.value }),
									onKeyDown: (e) => {
										if (e.key === "Escape") { setEditing(null); return; }
										if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); saveEdit(); }
									},
								})
								: h("span", { className: "sc-q-preview", title: row.preview }, row.preview),
							h("div", { className: "sc-q-actions" },
								editing?.id === row.id ? [
									h("button", { key: "ok", type: "button", className: "sc-q-btn", title: tt("queueSave"), disabled: busy !== null || editing.text.trim() === "", onClick: saveEdit }, "✓"),
									h("button", { key: "x", type: "button", className: "sc-q-btn", title: tt("queueCancel"), disabled: busy !== null, onClick: () => setEditing(null) }, "✕"),
								] : [
									h("button", { key: "edit", type: "button", className: "sc-q-btn", title: tt("queueEdit"), disabled: busy !== null || row.text === null, onClick: () => setEditing({ id: row.id, text: row.text ?? "" }) }, "✎"),
									h("button", { key: "del", type: "button", className: "sc-q-btn danger", title: tt("queueRemove"), disabled: busy !== null, onClick: () => applyAction(row.id, { kind: "remove" }, tt("queueRemoveFailed")) }, "🗑"),
									h("button", { key: "send", type: "button", className: "sc-q-send", title: tt("send"), disabled: busy !== null || !running, onClick: () => applyAction(row.id, { kind: "steer" }, tt("queueSendFailed")) }, tt("send")),
								],
							),
						)),
					),
				),
			);
		}

		// 重启成功后的「欢迎回来」艺术字提示（connection/reset 触发，自动消失）
		function WelcomeOverlay() {
			const tt = makeT(dialogBus.t);
			const title = tt("welcomeBack");
			return h("div", { className: "sc-welcome", onClick: () => dialogBus.set({ welcome: false }) },
				h("div", { className: "sc-welcome-card" },
					h("div", { className: "sc-welcome-shine" }),
					title.split("").map((ch, i) => h("span", {
						key: "s" + i, className: "sc-welcome-spark",
						style: { left: (14 + i * 25) + "%", top: (16 + (i % 2) * 34) + "%", animationDelay: (i * 0.55) + "s" },
					}, "✦")),
					h("div", { className: "sc-welcome-title" },
						title.split("").map((ch, i) => h("span", { key: "c" + i, style: { "--i": i } }, ch))),
					h("div", { className: "sc-welcome-sub" }, tt("welcomeSub")),
				),
			);
		}

		// 侧栏底部「重启」按钮（sidebar.footer.action 行，与设置按钮同排右侧）。
		// 确认后调用宿主 /api/session-center.restart：宿主 spawn 继任实例并退出，
		// 页面短暂断开后自动恢复。
		// 侧边栏收起（wide=false，rail 轨道）时只显示圆形图标（无文字），
		// 与设置/检查更新一起竖排一列。
		function RestartButton({ wide, t }) {
			const [busy, setBusy] = react.useState(false);
			const tt = makeT(t);
			const ask = () => {
				if (busy) return;
				dialogBus.set({ confirm: {
					title: tt("restartTitle"),
					message: tt("restartConfirm"),
					danger: true,
					onOk: () => {
						setBusy(true);
						// 重启 arm：先记住「重启前」的服务端重启序号（seq0）。arm 存
						// localStorage（跨页面/跨刷新），token 标记本轮；重连后若服务端
						// seq 变大 → 真重启了 → 欢迎提示必显示；没变大 → 不显示并清理。
						const token = String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8);
						(async () => {
							let seq0 = 0;
							try {
								const v = await call("restart.status", {});
								seq0 = Number(v?.seq) || 0;
							} catch { /* 拿不到旧 seq 就按 0 算，重启后仍是变大 */ }
							try {
								localStorage.setItem("dsh-my:restart-arm", JSON.stringify({ token, seq0 }));
							} catch { /* ignore */ }
							call("restart", {}).then(() => {
								dialogBus.set({ toast: tt("restarting") });
								// 兜底：正常情况下页面会断开、组件卸载；若意外没断，
								// 8s 后恢复按钮可点，避免「卡住」。
								setTimeout(() => setBusy(false), 8000);
							}).catch((e) => {
								try { localStorage.removeItem("dsh-my:restart-arm"); } catch { /* ignore */ }
								setBusy(false);
								dialogBus.set({ toast: `${tt("error")}: ${String(e?.message ?? e)}` });
							});
						})();
					},
				}});
			};
			return h("button", {
				type: "button",
				className: "sc-restart-btn" + (wide ? "" : " rail"),
				title: tt("restart"),
				"aria-label": tt("restart"),
				onClick: ask,
				disabled: busy,
			}, h("span", { className: "ic", "aria-hidden": "true" }, "⟳"), wide ? h("span", { className: "lb" }, tt("restart")) : null);
		}

		/**
		 * 侧栏导航行壁纸入口图标（与插件市场并列）
		 */
		function WallpaperPanelIcon({ size = 16 }) {
			return h("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.3",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				"aria-hidden": "true",
				style: { cursor: "pointer", display: "inline-block", verticalAlign: "middle" },
				onClick: (e) => {
					e.stopPropagation();
					dialogBus.set({ wallpaper: true });
				},
			},
				h("rect", { x: "1.5", y: "2", width: "13", height: "12", rx: "2" }),
				h("circle", { cx: "5.5", cy: "5.5", r: "1", fill: "currentColor", stroke: "none" }),
				h("polyline", { points: "2.5 12 6.5 8 9.5 11 11.5 9 13.5 11" }),
			);
		}

		// ------------------------------------------------------- main browser


		/**
		 * 单个全局面板入口（0.1.7）。独立顶层组件，保证 hook 顺序稳定；
		 * 行内用注入的 `usePanelInfo` 只订阅自己那一格高亮。
		 *
		 * @param props.id - 面板 id（= 该面板注册进 `main` 槽时的 `key`）。
		 * @param props.label - 已本地化的标签（由 slot host 解析后传入）。
		 * @param props.render - 图标渲染器 `renderSlot("sidebar.panellist", …, {only:id})`。
		 * @param props.select - 点击动作 `ctx.layout.selectPanel(id)`。
		 * @param props.usePanelInfo - layout 提供的 `{activePanelId}` 快照。
		 * @param props.L - 本地化函数（兜底标签用）。
		 */
		function ScPanelIcon({ id, label, render, select, usePanelInfo, L }) {
			const activePanelId = typeof usePanelInfo === "function" ? usePanelInfo((info) => info?.activePanelId ?? null) : null;
			const active = activePanelId === id;
			// 标签形态与官方 `resolveSlotLabel` 对齐：函数型 label 直接调用（参数是
			// 该面板的局部翻译器，本插件不持有它，故按无参调用并兜底），字符串直接
			// 用，取不到才回落到本插件词典（默认"插件市场"）。
			const resolved = typeof label === "function"
				? (() => { try { return label(); } catch { return undefined; } })()
				: label;
			const text = typeof resolved === "string" && resolved.length > 0 ? resolved : L("pluginsPanel");
			const tooltip = active ? `${L("backToConversation")} (${text})` : text;
			return h("button", {
				type: "button",
				className: "sc-panel-btn" + (active ? " sc-panel-active" : ""),
				title: tooltip,
				"aria-label": tooltip,
				"aria-current": active ? "page" : undefined,
				onClick: () => {
					try {
						select(active ? null : id);
					} catch (e) {
						console.debug("[dsh-session-center] selectPanel failed:", e);
					}
				},
			},
				h("span", { className: "sc-panel-glyph", "aria-hidden": "true" }, render ? render({ size: 16, active }) : null),
				h("span", { className: "sc-panel-label" }, text),
			);
		}

		function SearchGlyph({ active }) {
			return h("svg", {
				width: 12,
				height: 12,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.75",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				className: "sc-glyph-search",
				"aria-hidden": "true",
				style: { opacity: active ? 1 : 0.62, flexShrink: 0, transition: "opacity .15s ease, transform .15s ease" },
			},
				h("circle", { cx: "6.5", cy: "6.5", r: "4.5" }),
				h("line", { x1: "10", y1: "10", x2: "14", y2: "14" }),
			);
		}

		function TagGlyph() {
			return h("svg", {
				width: 14,
				height: 14,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.4",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				className: "sc-glyph-tag",
				"aria-hidden": "true",
				style: { display: "inline-block", verticalAlign: "middle" },
			},
				h("path", { d: "M1.5 7.5V2.5A1 1 0 0 1 2.5 1.5H7.5L14.2 8.2A1.4 1.4 0 0 1 14.2 10.2L10.2 14.2A1.4 1.4 0 0 1 8.2 14.2L1.5 7.5Z" }),
				h("circle", { cx: "5", cy: "5", r: "1.2", fill: "currentColor", stroke: "none" }),
			);
		}

		function BatchGlyph({ active }) {
			return h("svg", {
				width: 14,
				height: 14,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.4",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				className: "sc-glyph-batch",
				"aria-hidden": "true",
				style: { display: "inline-block", verticalAlign: "middle" },
			},
				h("rect", { x: "2", y: "2", width: "12", height: "12", rx: "3" }),
				h("polyline", { points: "5 8.2 7.2 10.5 11 5.8", strokeWidth: "1.75" }),
			);
		}

		function SessionCenterBrowser({ wide, expandSidebar, useSessions, useWorkspaces, useStore, usePanelInfo, t, renderSlot, open, panels: panelsProp, searchOpen: searchOpenProp }) {
			const L = makeT(t);
			const TF = makeTF(t);
			const [sessions, setSessions] = react.useState([]);
			const [tags, setTags] = react.useState([]);
			const [sessionTags, setSessionTags] = react.useState({});
			const [pins, setPins] = react.useState([]);
			const [trash, setTrash] = react.useState([]);
			const [menu, setMenu] = react.useState(null);
			const [hover, setHover] = react.useState(null);
			const [selecting, setSelecting] = react.useState(false);
			const [selected, setSelected] = react.useState(new Set());
			const [trashOpen, setTrashOpen] = react.useState(false);
			// 当前会话 id（从 localStorage dsh.sessions.current 读，用于高亮当前行）
			const [currentId, setCurrentId] = react.useState(null);
			const readCurrent = react.useCallback(() => {
				try {
					const raw = localStorage.getItem("dsh.sessions.current");
					const sessionId = raw ? (JSON.parse(raw)?.sessionId ?? null) : null;
					setCurrentId(sessionId);
				} catch { setCurrentId(null); }
			}, []);

			// ------------------------------------------------ 全局面板入口（0.1.7）
			//
			// 内核 0.1.7 把「全局面板」（插件市场 / 定时任务）做成了 `sidebar.panellist`
			// 图标行：图标由各插件注册进该 list 槽，面板本体注册进 `main` 槽（按
			// `key` = 面板 id）。官方侧栏（dsh-client-ui-sidebar）负责渲染这排图标。
			//
			// 本插件用 priority:-1 占死了单槽 `sidebar.workspaces`，官方侧栏整棵不渲染，
			// 于是这排图标一起消失（面板本体没丢，但没了入口 = 插件市场打不开）。
			// 这里按官方同一套契约把这排图标接回来：
			//   · 列表来源 `ctx.slots.entriesOfSlot("sidebar.panellist")`；
			//   · 点击 `ctx.layout.selectPanel(panelId)`；
			//   · 高亮读注入的 `usePanelInfo`（`{activePanelId}`，由 layout 的
			//     `slots.provideRoot({hooks:{panelInfo}})` 提供，官方侧栏用的是同一个）。
			//
			// 目前只放插件市场（用户选择：不要定时任务）。
			const PANEL_ALLOW = new Set(["plugins"]);

			/**
			 * 读取全部 `sidebar.panellist` 入口（按 order 升序）。
			 *
			 * 纯函数、不碰 state —— 既给 `useState` 的惰性初值用（首帧就有数据，
			 * 不必等 effect），也让过滤/渲染两条路径共享同一份读取逻辑。
			 * 允许清单的过滤放在渲染处（见 PANEL_ALLOW 的用法），这样测试注入的
			 * 面板列表走的是同一条过滤路径。
			 * @returns {{entry: object, id: string, order: number, label: unknown}[]}
			 */
			const readPanelEntries = () => {
				try {
					const host = ctxSlots;
					const raw = typeof host?.entriesOfSlot === "function"
						? host.entriesOfSlot("sidebar.panellist")
						: (typeof host?.entries === "function" ? host.entries("sidebar.panellist") : []);
					return (raw ?? [])
						.map((entry) => ({
							entry,
							id: entry?.options?.id,
							order: typeof entry?.options?.order === "number" ? entry.options.order : 0,
							label: entry?.options?.label,
						}))
						.filter((row) => typeof row.id === "string")
						.sort((a, b) => a.order - b.order);
				} catch (e) {
					console.debug("[dsh-session-center] panel list read failed:", e);
					return [];
				}
			};

			const [panelsState, setPanels] = react.useState(readPanelEntries);
			// `panels` 属性优先：渲染测试直接注入面板列表，不必伪造 DOM
			// （本组件在无 document 的环境里会判定为折叠态而不渲染这排入口）。
			const panels = Array.isArray(panelsProp) ? panelsProp : panelsState;
			const refreshPanels = react.useCallback(() => {
				const next = readPanelEntries();
				setPanels((prev) => {
					if (prev.length === next.length && prev.every((row, i) => row.id === next[i].id && row.entry === next[i].entry)) return prev;
					return next;
				});
			}, []);
			react.useEffect(() => {
				refreshPanels();
				let unsub = null;
				try {
					unsub = ctxSlots?.subscribe?.("sidebar.panellist", refreshPanels) ?? null;
				} catch (e) {
					console.debug("[dsh-session-center] panel list subscribe failed:", e);
				}
				return () => { if (typeof unsub === "function") unsub(); };
			}, [refreshPanels]);

			const hoverTimer = react.useRef(null);
			const glowRef = react.useRef(null);
			const rootRef = react.useRef(null);

			// Liquid-glass cursor spotlight: driven directly on the DOM node so
			// the spotlight never triggers React re-renders on mousemove.
			const onRootMove = (e) => {
				const el = glowRef.current;
				if (!el) return;
				const rect = e.currentTarget.getBoundingClientRect();
				el.style.transform = `translate3d(${e.clientX - rect.left - 160}px, ${e.clientY - rect.top - 160}px, 0)`;
				el.style.opacity = "1";
			};
			const onRootLeave = () => {
				if (glowRef.current) glowRef.current.style.opacity = "0";
			};
			const showToast = (msg) => {
				dialogBus.set({ toast: msg });
			};

			// Tooltip appears only after the pointer has rested on a row for 2s.
			const armHover = (row, x, y) => {
				if (hoverTimer.current) clearTimeout(hoverTimer.current);
				hoverTimer.current = setTimeout(() => setHover({ row, x, y }), 2000);
			};
			const disarmHover = () => {
				if (hoverTimer.current) {
					clearTimeout(hoverTimer.current);
					hoverTimer.current = null;
				}
				setHover(null);
			};
			// 悬浮卡片的坐标跟随：mousemove 每秒可触发上百次，每次都 setState 会让整张
			// 会话列表重渲染（实测掉帧）。改成 rAF 节流——一帧最多写一次状态。
			const hoverMove = react.useRef(null);
			const hoverRaf = react.useRef(0);
			const queueHoverMove = (row, x, y) => {
				hoverMove.current = { row, x, y };
				if (hoverRaf.current) return;
				hoverRaf.current = requestAnimationFrame(() => {
					hoverRaf.current = 0;
					const next = hoverMove.current;
					if (next) setHover(next);
				});
			};
			react.useEffect(() => () => {
				if (hoverTimer.current) clearTimeout(hoverTimer.current);
				if (hoverRaf.current) cancelAnimationFrame(hoverRaf.current);
			}, []);

			const refresh = react.useCallback(async () => {
				let items = [];
				let center = { tags: [], sessionTags: {}, pins: [] };
				try {
					items = await fetchSessionList();
				} catch (e) {
					console.debug("[dsh-session-center] fetchSessionList failed:", e);
				}
				try {
					const c = await call("tag.list", {});
					if (c && typeof c === "object") center = c;
				} catch (e) {
					console.debug("[dsh-session-center] tag.list call failed:", e);
				}
				try {
					const rows = (items || [])
						.filter((item) => item.blank !== true && item.origin !== "subagent")
						.map((item) => toRow(item, center.sessionTags ?? {}, center.pins ?? []))
						.sort((a, b) => b.lastActive - a.lastActive);
					setSessions(rows);
					setTags(center.tags ?? []);
					setSessionTags(center.sessionTags ?? {});
					setPins(center.pins ?? []);
					dialogBus.touch();
				} catch (e) {
					console.debug("[dsh-session-center] refresh failed:", e);
				}
				readCurrent();
			}, [readCurrent]);

			const refreshTrash = react.useCallback(async () => {
				try {
					const value = await call("trash.list", {});
					setTrash(value.entries ?? []);
				} catch {
					// keep last state
				}
			}, []);

			react.useEffect(() => {
				refresh();
				refreshTrash();
				const unsub = ctxSessions?.list?.subscribe ? ctxSessions.list.subscribe(() => {
					refresh();
				}) : null;
				const timer = setInterval(() => {
					if (document.visibilityState === "visible") refresh();
				}, 5000);
				// 浏览器里 setInterval 的返回值没有 unref；Node（渲染测试）里有。
				// 不加这一句，这个 5s 心跳会让测试进程结束后仍空等一个周期才退出。
				timer?.unref?.();
				return () => {
					clearInterval(timer);
					if (typeof unsub === "function") unsub();
				};
			}, [refresh, refreshTrash]);

			// Chromium keeps large backdrop-filter / container-type surfaces in a
			// stale compositor state across window minimize→restore, leaving the
			// list area blank. When the page becomes visible again (or the window
			// resizes), force one frame with blur/containment disabled so the
			// browser rebuilds the layer and re-evaluates the container queries.
			const [nudge, setNudge] = react.useState(false);
			const runNudge = react.useCallback(() => {
				setNudge(true);
				requestAnimationFrame(() => setTimeout(() => setNudge(false), 60));
				refresh();
			}, [refresh]);
			react.useEffect(() => {
				const onVis = () => {
					if (document.visibilityState === "visible") runNudge();
				};
				let rt = null;
				const onResize = () => {
					clearTimeout(rt);
					rt = setTimeout(runNudge, 150);
				};
				document.addEventListener("visibilitychange", onVis);
				window.addEventListener("resize", onResize);
				return () => {
					document.removeEventListener("visibilitychange", onVis);
					window.removeEventListener("resize", onResize);
					clearTimeout(rt);
				};
			}, [runNudge]);

			// 侧栏折叠时（wide=false）隐藏本组件内容，官方图标栏接管（不早退，保证 hooks 顺序稳定）

			// ------------------------------------------------ 会话搜索（0.1.7 接回）
			//
			// 官方的搜索框长在官方侧栏（WorkspaceBrowser）内部：一个受控 input + 250ms
			// 去抖 + `ctx.sessions.search(query, signal)`。本插件用 priority:-1 占死单槽
			// `sidebar.workspaces` 后官方侧栏整棵不渲染，于是搜索框一起消失
			// （**内核能力没丢**，`ctx.sessions.search` 仍然可用，只是没有入口）。
			//
			// 这里按官方同一套契约接回：
			//   · 本地即时匹配（已在快照里的标题）+ 远端内容索引结果，本地先出、远端后并；
			//   · 250ms 去抖（官方 SEARCH_DEBOUNCE_MS）+ AbortController 取消被取代的请求；
			//   · `manager.search()` 返回的是 RemoteResult（`{ok, value|error}`），
			//     0.1.7 起要把 error.code 当业务错误读，不能只判断异常。
			const [searchOpen, setSearchOpen] = react.useState(searchOpenProp === true);
			const [searchQuery, setSearchQuery] = react.useState("");
			const [searchStatus, setSearchStatus] = react.useState("idle");
			const [searchHits, setSearchHits] = react.useState([]);
			const SEARCH_DEBOUNCE_MS = 250;

			/** 与官方一致的查询归一化：去首尾空白并把连续空白压成一个空格。 */
			const normalizedQuery = (value) => String(value ?? "").trim().replace(/\s+/g, " ");

			const closeSearch = react.useCallback(() => {
				setSearchOpen(false);
				setSearchQuery("");
				setSearchStatus("idle");
				setSearchHits([]);
			}, []);

			react.useEffect(() => {
				const q = normalizedQuery(searchQuery);
				if (q === "") {
					setSearchStatus("idle");
					setSearchHits([]);
					return undefined;
				}
				try {
					if (typeof ctxSessions?.search !== "function") {
						setSearchStatus("unavailable");
						setSearchHits([]);
						return undefined;
					}
				} catch {
					setSearchStatus("unavailable");
					return undefined;
				}
				const controller = typeof AbortController === "function" ? new AbortController() : null;
				setSearchStatus("loading");
				const timer = setTimeout(() => {
					let pending;
					try {
						pending = ctxSessions.search(q, controller?.signal);
					} catch (e) {
						setSearchStatus("error");
						return;
					}
					Promise.resolve(pending).then((result) => {
						if (controller?.signal?.aborted) return;
						// RemoteResult：ok=false 时 value 不存在，错误在 error.code/message。
						if (!result || result.ok !== true) {
							setSearchStatus("error");
							setSearchHits([]);
							return;
						}
						const items = Array.isArray(result.value?.items) ? result.value.items : [];
						setSearchHits(items.map((item) => ({
							id: item?.id ?? item?.sessionId ?? null,
							title: typeof item?.title === "string" && item.title !== "" ? item.title : (item?.id ?? ""),
							excerpt: typeof item?.excerpt === "string" ? item.excerpt : "",
							archived: item?.archived === true,
						})).filter((row) => row.id !== null));
						setSearchStatus("ready");
					}).catch(() => {
						if (controller?.signal?.aborted) return;
						setSearchStatus("error");
						setSearchHits([]);
					});
				}, SEARCH_DEBOUNCE_MS);
				// Node（渲染测试）里让去抖定时器不阻塞进程退出；浏览器无 unref。
				timer?.unref?.();
				return () => {
					clearTimeout(timer);
					try { controller?.abort(); } catch { /* already gone */ }
				};
			}, [searchQuery]);

			/** 本地即时命中：标题子串匹配，先于远端结果出现，避免"打字没反应"。 */
			const localSearchHits = react.useMemo(() => {
				const q = normalizedQuery(searchQuery).toLowerCase();
				if (q === "") return [];
				return sessions
					.filter((row) => String(row.title ?? "").toLowerCase().includes(q))
					.slice(0, 20)
					.map((row) => ({ id: row.sessionId, title: row.title, excerpt: "", archived: false }));
			}, [searchQuery, sessions]);

			/** 本地 + 远端合并（按 id 去重，本地优先，最多 30 条）。 */
			const searchRows = react.useMemo(() => {
				const seen = new Set();
				const out = [];
				for (const row of [...localSearchHits, ...searchHits]) {
					if (row.id === null || seen.has(row.id)) continue;
					seen.add(row.id);
					out.push(row);
					if (out.length >= 30) break;
				}
				return out;
			}, [localSearchHits, searchHits]);

			const openSession = (sessionId) => {
				try {
					open?.(sessionId);
				} catch {
					/* not openable */
				}
			};

			const doPin = async (sessionId, pinned) => {
				try {
					await call("pin.set", { sessionIds: [sessionId], pinned });
					showToast(pinned ? L("pinnedToast") : L("unpinnedToast"));
					refresh();
				} catch (e) {
					window.alert(String(e.message ?? e));
				}
			};

			const doRename = (sessionId) => {
				const row = sessions.find((s) => s.sessionId === sessionId);
				const title = window.prompt(L("rename"), row?.titleSet ? row.title : "");
				if (title === null) return;
				// 0.1.2：rename 从 /api/session.rename 挪到了 SessionFace（ISession.rename，
				// 升级卡 A1-01/A1-27）。对列表内会话 scope() 解析 Agent 作用域视图
				// （未列出/未 scoped 才是 undefined），sessionOf() 取脸，rename 返回
				// RemoteResult<{title, seq}>，成功后 host 落 title 投影。
				const face = ctxSessions?.sessionOf?.(ctxSessions.scope?.(sessionId));
				if (!face?.rename) {
					window.alert(L("rename") + ": SessionFace unavailable");
					return;
				}
				face.rename(title.trim())
					.then((res) => {
						if (!res?.ok) throw new Error(res?.error?.message ?? "rename failed");
						return refresh();
					})
					.catch((e) => window.alert(String(e.message ?? e)));
			};

			const doFork = (sessionId) => {
				try {
					ctxSessions.fork({ sessionId, increaseTitle: true })
						// 0.1.7：fork 仍在 ClientSessions 上，但「揭示子会话」必须走
						// uiWorkspace.openSession（旧的 ctxSessions.open 已删除）。
						.then((childId) => ctxUiWorkspace?.openSession?.(childId))
						.catch((e) => window.alert(String(e.message ?? e)));
				} catch (e) {
					window.alert(String(e.message ?? e));
				}
			};

			// 下载「Session log」（会话导出 ZIP）：等价于原顶栏的 Session log 按钮，
			// 直接触发宿主 /api/session.export 的浏览器下载，无需依赖内部 service。
			const doDownloadLog = (sessionId) => {
				try {
					const url = `/api/session.export?sessionId=${encodeURIComponent(sessionId)}`;
					const a = document.createElement("a");
					a.href = url;
					a.rel = "noopener";
					a.download = `dsh-session-${String(sessionId).replace(/[^A-Za-z0-9_-]/g, "_")}.zip`;
					document.body.appendChild(a);
					a.click();
					a.remove();
					showToast(L("sessionLog"));
				} catch (e) {
					window.alert(String(e.message ?? e));
				}
			};

			const doBackup = async (sessionId) => {
				try {
					const entry = await call("session.backup", { sessionId, reason: "manual" });
					showToast(`${L("backupDone")} · ${fmtBytes(entry.bytes)}`);
				} catch (e) {
					window.alert(String(e.message ?? e));
				}
			};

			const doDiagnose = async (sessionId) => {
				dialogBus.set({ repair: { sessionId, report: null, busy: true } });
				try {
					const report = await call("session.diagnose", { sessionId });
					dialogBus.set((s) => ({ repair: { ...s.repair, report, busy: false } }));
				} catch (e) {
					dialogBus.set({ repair: null });
					window.alert(String(e.message ?? e));
				}
			};

			const doDelete = (sessionId) => {
				const tryDelete = async (force) => {
					await call("session.delete", { sessionId, ...(force ? { force: true } : {}) });
				};
				dialogBus.set({
					confirm: {
						title: L("delete"),
						message: L("confirmDelete"),
						danger: true,
						onOk: async () => {
							try {
								await tryDelete(false);
								showToast(L("deleted"));
								refresh();
								refreshTrash();
							} catch (e) {
								if (e.code === "refused" || /running/.test(String(e?.message ?? e))) {
									dialogBus.set({
										confirm: {
											title: L("delete"),
											message: L("confirmForceDelete"),
											danger: true,
											onOk: async () => {
												try {
													await tryDelete(true);
													showToast(L("deleted"));
													refresh();
													refreshTrash();
												} catch (e2) {
													window.alert(String(e2.message ?? e2));
												}
											},
										},
									});
									return;
								}
								window.alert(String(e.message ?? e));
							}
						},
					},
				});
			};

			const doRestore = async (sessionId) => {
				try {
					await call("session.restore", { sessionId });
					showToast(L("restored"));
					refresh();
					refreshTrash();
				} catch (e) {
					window.alert(String(e.message ?? e));
				}
			};

			const doPurge = (sessionId) => {
				dialogBus.set({
					confirm: {
						title: L("purge"),
						message: L("confirmPurge"),
						danger: true,
						onOk: async () => {
							try {
								await call("trash.purge", { sessionId });
								refreshTrash();
							} catch (e) {
								window.alert(String(e.message ?? e));
							}
						},
					},
				});
			};

			const doPurgeAll = () => {
				dialogBus.set({
					confirm: {
						title: L("purgeAll"),
						message: L("confirmPurgeAll"),
						danger: true,
						onOk: async () => {
							try {
								await call("trash.purge", {});
								refreshTrash();
							} catch (e) {
								window.alert(String(e.message ?? e));
							}
						},
					},
				});
			};

			const doBatchDelete = () => {
				const ids = [...selected];
				if (ids.length === 0) return;
				// 逐条执行、逐条记账。旧实现是一句 `for (…) await call(…)`：任何一条抛错就中断
				// 整批，catch 又按「全批失败」处理——先删掉的几条其实已经进回收站了，用户看到
				// 的却是失败；点「强制删除」还会对已删除的 id 再删一遍（再抛错，剩下的永远删不掉）。
				const runBatch = async (targets, force) => {
					const failed = [];
					for (const id of targets) {
						try {
							await call("session.delete", { sessionId: id, ...(force ? { force: true } : {}) });
						} catch (e) {
							failed.push({ id, error: e });
						}
					}
					return failed;
				};
				const finish = (deletedCount, failed) => {
					setSelected(new Set());
					setSelecting(false);
					refresh();
					refreshTrash();
					if (failed.length === 0) {
						showToast(L("deleted"));
					} else if (deletedCount > 0) {
						// 部分成功：如实给出「删掉了几条」，并单独报告失败原因
						showToast(`${L("deleted")} ${deletedCount}/${ids.length}`);
						window.alert(`${failed.length} ${L("deleteFailedCount")}：${String(failed[0].error?.message ?? failed[0].error)}`);
					} else {
						window.alert(String(failed[0].error?.message ?? failed[0].error));
					}
				};
				dialogBus.set({
					confirm: {
						title: L("delete"),
						message: `${L("confirmDelete")} (${ids.length})`,
						danger: true,
						onOk: async () => {
							const failed = await runBatch(ids, false);
							const stuck = failed.filter((f) => f.error?.code === "refused" || /running/.test(String(f?.error?.message ?? "")));
							if (failed.length === 0) {
								finish(ids.length, []);
								return;
							}
							if (stuck.length === 0) {
								finish(ids.length - failed.length, failed);
								return;
							}
							// 只有「运行中被拒」的那几条需要二次确认强删，已删掉的绝不重删
							const deletedSoFar = ids.length - failed.length;
							dialogBus.set({
								confirm: {
									title: L("delete"),
									message: `${L("confirmForceDelete")} (${stuck.length})`,
									danger: true,
									onOk: async () => {
										const failed2 = await runBatch(stuck.map((f) => f.id), true);
										finish(ids.length - failed.length - failed2.length, failed2);
									},
								},
							});
						},
					},
				});
			};

			const byId = new Map(sessions.map((s) => [s.sessionId, s]));
			const pinnedRows = sessions.filter((s) => s.pinned);
			const normalRows = sessions.filter((s) => !s.pinned);
			const tagsById = new Map(tags.map((x) => [x.id, x]));
			// 页面级对话框宿主的数据源：每次渲染刷新闭包，宿主重渲染时读到最新值
			dialogBus.t = t;
			dialogBus.getTags = () => tags;
			dialogBus.onChanged = refresh;

			const renderRow = (row) => {
				const status = row.running
					? h("span", { className: "sc-status sc-spinner" })
					: null;
				const isCurrent = row.sessionId === currentId;
				return h("div", {
					key: row.sessionId,
					className: "sc-row"
						+ (selected.has(row.sessionId) ? " selected" : "")
						+ (isCurrent ? " current" : ""),
					onClick: (e) => {
						if (selecting) {
							const next = new Set(selected);
							if (next.has(row.sessionId)) next.delete(row.sessionId);
							else next.add(row.sessionId);
							setSelected(next);
							return;
						}
						openSession(row.sessionId);
					},
					onMouseEnter: (e) => armHover(row, e.clientX, e.clientY),
					onMouseMove: (e) => {
						if (hover && hover.row.sessionId === row.sessionId) queueHoverMove(row, e.clientX, e.clientY);
					},
					onMouseLeave: () => disarmHover(),
				},
					selecting
						? h("input", { type: "checkbox", className: "sc-check", checked: selected.has(row.sessionId), readOnly: true, tabIndex: -1 })
						: null,
					status,
					h("div", { className: "sc-row-main" },
						h("div", { className: "sc-row-line1" },
							h("span", { className: "sc-row-title" }, row.title),
							h("span", { className: "sc-row-time" }, fmtRelative(row.lastActive, TF)),
						),
						row.tagIds.length > 0
							? h("div", { className: "sc-row-tags" },
								row.tagIds.map((id) => {
									const tag = tagsById.get(id);
									if (!tag) return null;
									return h("span", { key: id, className: "sc-tagpill", style: { background: tag.color + "26", color: tag.color } },
										h("span", { className: "dot", style: { background: tag.color } }), tag.name);
								}),
							)
							: null,
					),
					h("button", {
						type: "button", className: "sc-row-menu", "aria-label": "menu",
						onClick: (e) => {
							e.stopPropagation();
							setMenu({ sessionId: row.sessionId, x: e.clientX, y: e.clientY });
						},
					}, "⋮"),
				);
			};

			const menuRow = menu ? byId.get(menu.sessionId) : null;
			const menuItems = menuRow
				? [
					{ key: "pin", label: menuRow.pinned ? L("unpin") : L("pin"), onClick: () => doPin(menuRow.sessionId, !menuRow.pinned) },
					{ key: "tags", label: L("tags"), onClick: () => dialogBus.set({ picker: { sessionIds: [menuRow.sessionId], current: menuRow.tagIds } }) },
					{ key: "rename", label: L("rename"), onClick: () => doRename(menuRow.sessionId) },
					{ key: "sessionLog", label: L("sessionLog"), onClick: () => doDownloadLog(menuRow.sessionId) },
					{ key: "fork", label: L("fork"), onClick: () => doFork(menuRow.sessionId) },
					{ sep: true },
					{ key: "backup", label: L("backup"), onClick: () => doBackup(menuRow.sessionId) },
					{ key: "diagnose", label: L("diagnose"), onClick: () => doDiagnose(menuRow.sessionId) },
					{ sep: true },
					{ key: "delete", label: L("delete"), danger: true, onClick: () => doDelete(menuRow.sessionId) },
				]
				: [];

			// Fixed-position children resolve against .sc-root (its backdrop-filter
			// and container-type make it their containing block), so all floating
			// UI coordinates are computed relative to the panel's box.
			const rr = rootRef.current?.getBoundingClientRect();
			// 悬浮提示卡/右键菜单都是 position:fixed，用面板自身宽度来夹坐标。面板折叠后只剩 44px，
			// `rr.width - 300` 是负数，`Math.max(6, …)` 会把它钉在面板左上角 —— 正好是小鲸鱼的位置，
			// 用户看到的就是"文字错位显示在那个位置"（2026-09-26）。两道防线：
			// ① 折叠态根本不渲染浮层；② 右上边界用 Math.max(6, …) 兜底，防再次出现负值。
			const panelCollapsed = wide === false || !isSidebarExpanded();
			// 只有允许清单里的面板会被渲染（默认仅插件市场；定时任务 "schedules" 不暴露）。
			const panelEntries = panels.filter((row) => PANEL_ALLOW.has(row.id));
			// 搜索生效时列表区换成结果；空查询回到常规会话列表。
			const searchActive = normalizedQuery(searchQuery) !== "";
			const menuPos = menu
				? rr
					? {
						x: Math.max(6, Math.min(menu.x - rr.left, Math.max(6, rr.width - 176))),
						y: Math.max(6, Math.min(menu.y - rr.top, Math.max(6, rr.height - 36 * menuItems.length - 12))),
					}
					: { x: menu.x, y: menu.y }
				: null;
			const tipPos = rr && hover && !panelCollapsed
				? {
					left: Math.max(6, Math.min(hover.x + 14 - rr.left, Math.max(6, rr.width - 300))),
					top: Math.max(6, Math.min(hover.y + 14 - rr.top, Math.max(6, rr.height - 150))),
				}
				: null;

			return h("div", {
				ref: rootRef,
				className: "sc-root" + (nudge ? " sc-nudge" : "") + (wide === false ? " sc-hidden" : ""),
				onMouseEnter: () => {
					if (isSidebarExpanded()) resetSidebarTimer();
				},
				onMouseMove: (e) => {
					onRootMove(e);
					if (isSidebarExpanded()) resetSidebarTimer();
				},
				onMouseLeave: () => {
					onRootLeave();
					if (isSidebarExpanded()) resetSidebarTimer();
				},
			},
				h("div", { className: "sc-glow-wrap" }, h("div", { ref: glowRef, className: "sc-glow" })),
				// 全局面板入口（09-28 0.1.7：把被单槽 shadow 吞掉的入口接回来）。
				//
				// ⚠️ 类名用 sc-rail 而不是 sc-collapsed：本文件的折叠判定是
				// [data-slot="sidebar"]:has([class*="collapsed"])（任意深度），
				// 名字里带 collapsed 会让这一行自己把整条侧栏判成折叠态。
				// PANEL_ALLOW 在这里过滤：允许清单只表达"本插件愿意暴露哪些面板"，
				// 与数据来源（live 读取 / 测试注入）无关。
				panelEntries.length > 0
					? h("div", { className: "sc-panels" + (panelCollapsed ? " sc-rail" : "") }, panelEntries.map((row) => h(ScPanelIcon, {
						key: row.id,
						id: row.id,
						label: row.label,
						render: renderSlot ? (slotProps) => renderSlot("sidebar.panellist", slotProps, { only: row.id }) : null,
						select: (panelId) => ctxLayout?.selectPanel?.(panelId),
						usePanelInfo,
						L,
					})))
					: null,
				h("div", { className: "sc-header" },
					h("button", {
						type: "button",
						className: "sc-title sc-title-btn" + (searchOpen ? " sc-title-active" : ""),
						title: L("searchSessions"),
						"aria-label": L("searchSessions"),
						"aria-expanded": searchOpen ? "true" : "false",
						onClick: () => { if (searchOpen) closeSearch(); else setSearchOpen(true); },
					},
						h("span", { className: "sc-title-text" }, L("sessions")),
						h(SearchGlyph, { active: searchOpen }),
					),
					// 每个按钮 = 图标 + `.sc-btn-label`。侧栏内容区窄于 250px 时由 CSS
					// 容器查询只留图标，避免出现"两个功能挤在一个按钮里"的折行断字
					// （2026-09-28 用户报）。
					h("div", { className: "sc-header-actions" },
						h("button", {
							type: "button", className: "sc-btn", title: L("manageTags"), "aria-label": L("manageTags"),
							onClick: () => dialogBus.set({ tags: true }),
						}, h("span", { className: "sc-btn-icon", "aria-hidden": "true" }, h(TagGlyph)), h("span", { className: "sc-btn-label" }, L("manageTags"))),
						h("button", {
							type: "button", className: "sc-btn" + (selecting ? " sc-btn-on" : ""),
							title: L("batch"),
							"aria-label": selecting ? L("batchDone") : L("batch"),
							onClick: () => { setSelecting(!selecting); setSelected(new Set()); },
						}, h("span", { className: "sc-btn-icon", "aria-hidden": "true" }, h(BatchGlyph, { active: selecting })), h("span", { className: "sc-btn-label" }, selecting ? L("batchDone") : L("batch"))),
					),
				),
				// 搜索输入行（0.1.7 接回：官方搜索框随官方侧栏被 shadow 掉了）
				searchOpen
					? h("div", { className: "sc-search-row" },
						h("input", {
							type: "search",
							className: "sc-search-input",
							placeholder: L("searchPlaceholder"),
							value: searchQuery,
							autoFocus: true,
							"aria-label": L("searchSessions"),
							onChange: (e) => setSearchQuery(e.target.value),
							onKeyDown: (e) => { if (e.key === "Escape") closeSearch(); },
						}),
						h("button", { type: "button", className: "sc-btn", onClick: closeSearch, title: L("close") }, "✕"),
					)
					: null,
				h("div", { className: "sc-list" },
					searchActive
						? [
							// 结果区：本地即时命中先出，远端内容索引结果随后并入。
							h("div", { className: "sc-section-label" },
								`🔍 ${L("searchResults")} · ${searchRows.length}`
								+ (searchStatus === "loading" ? ` · ${L("searching")}` : "")),
							searchRows.map((row) => h("div", {
								key: `hit-${row.id}`,
								className: "sc-row sc-search-row" + (row.id === currentId ? " current" : ""),
								role: "button",
								tabIndex: 0,
								title: row.title,
								onClick: () => { openSession(row.id); closeSearch(); },
								onKeyDown: (e) => { if (e.key === "Enter" || e.key === " ") { openSession(row.id); closeSearch(); } },
							},
								h("span", { className: "sc-row-title" }, row.title || row.id),
								row.excerpt ? h("span", { className: "sc-search-excerpt" }, row.excerpt) : null,
							)),
							searchStatus === "unavailable" ? h("div", { className: "sc-empty" }, L("searchUnavailable")) : null,
							searchStatus === "error" ? h("div", { className: "sc-empty" }, L("searchFailed")) : null,
							searchStatus !== "loading" && searchStatus !== "unavailable" && searchStatus !== "error" && searchRows.length === 0
								? h("div", { className: "sc-empty" }, L("searchNoHits"))
								: null,
						]
						: [
							pinnedRows.length > 0 ? h("div", { className: "sc-section-label" }, `📌 ${L("pinned")}`) : null,
							pinnedRows.map(renderRow),
							normalRows.map(renderRow),
							sessions.length === 0 ? h("div", { className: "sc-empty" }, L("empty")) : null,
						],
				),
				selecting
					? h("div", { className: "sc-batchbar" },
						h("span", { style: { fontSize: 12, opacity: 0.7 } }, `${selected.size} / ${sessions.length}`),
						h("button", { type: "button", className: "sc-btn", title: L("selectAll"), onClick: () => { const n = new Set(sessions.map((s) => s.sessionId)); setSelected(n); } }, L("selectAll")),
						h("button", {
							type: "button", className: "sc-btn",
							disabled: selected.size === 0,
							onClick: () => {
								const ids = [...selected];
								const current = ids.length === 1 ? (byId.get(ids[0])?.tagIds ?? []) : [];
								dialogBus.set({ picker: { sessionIds: ids, current } });
							},
						}, L("applyTags")),
						h("button", { type: "button", className: "sc-btn", disabled: selected.size === 0, onClick: doBatchDelete }, L("delete")),
					)
					: null,
				h("div", { className: "sc-trash-section" },
					h("button", { type: "button", className: "sc-trash-head", onClick: () => setTrashOpen(!trashOpen) },
						trashOpen ? "▾" : "▸", `🗑 ${L("trash")} (${trash.length})`,
						trash.length > 0 ? h("span", { style: { marginLeft: "auto", fontSize: 11, opacity: 0.6 } }, fmtBytes(trash.reduce((a, b) => a + (b.bytes ?? 0), 0))) : null,
					),
					trashOpen ? h("div", { style: { paddingBottom: 4 } },
						trash.length === 0 ? h("div", { className: "sc-empty" }, L("emptyTrash")) :
						trash.map((e) => h("div", { key: e.sessionId, className: "sc-trash-row" },
							h("span", { className: "t", title: e.title ?? e.sessionId }, e.title ?? e.sessionId),
							h("span", { style: { fontSize: 11, opacity: 0.5 } }, fmtRelative(e.deletedAt, TF)),
							h("button", { type: "button", className: "act", onClick: () => doRestore(e.sessionId) }, L("restore")),
							h("button", { type: "button", className: "act danger", onClick: () => doPurge(e.sessionId) }, L("purge")),
						)),
						trash.length > 0 ? h("div", { style: { textAlign: "right", padding: "4px 8px" } },
							h("button", { type: "button", className: "sc-btn danger", onClick: doPurgeAll }, L("purgeAll")),
						) : null,
					) : null,
				),
				hover && !selecting && tipPos
					? h("div", {
						className: "sc-tooltip",
						style: tipPos,
					},
						h("div", { className: "sc-tooltip-title" }, hover.row.title),
						h("div", { className: "row" }, `${L("lastActive")} ${fmtRelative(hover.row.lastActive, TF)} · ${fmtStamp(hover.row.lastActive)}`),
						h("div", { className: "row" }, `${L("input")} ${fmtNum(hover.row.tokens.input)} · ${L("output")} ${fmtNum(hover.row.tokens.output)}`),
						h("div", { className: "row muted" }, `${L("cache")} ${fmtNum(hover.row.tokens.cache)}`),
					)
					: null,
				menu && menuPos ? h(RowMenu, { t: L, x: menuPos.x, y: menuPos.y, onClose: () => setMenu(null), items: menuItems }) : null,
			);
		}

		// ------------------------------------------------------------- entry

		let ctxSessions = null;
		// 0.1.7：会话导航 + 全局面板选择归 `uiWorkspace` / `layout` 两个服务。
		// 由 46-app-entry.js 的 apply() 赋值（本文件只读）。
		let ctxUiWorkspace = null;
		let ctxLayout = null;
		// slot 服务句柄。**必须存成模块变量**：组件在 factory 闭包里求值，
		// 那里没有 `apply(ctx)` 的 `ctx` 形参（第一版直接写 ctx.slots，
		// 结果 ReferenceError 被 catch 吞掉，面板入口静默不显示）。
		let ctxSlots = null;

		/** Error boundary: a client render crash shows a visible message instead of
		 *  silently falling back to the official sidebar (which looks like the
		 *  plugin "disappeared"). */
		const SCBoundary = class extends react.Component {
			constructor(props) {
				super(props);
				this.state = { error: null };
			}
			static getDerivedStateFromError(error) {
				return { error };
			}
			componentDidCatch(error) {
				console.error("[dsh-session-center] render failed:", error);
			}
			render() {
				if (this.state.error) {
					return react.createElement(
						"div",
						{ style: { padding: 12, fontSize: 12, opacity: 0.8, whiteSpace: "pre-wrap" } },
						"[dsh-session-center] UI error: " + String(this.state.error?.message ?? this.state.error),
					);
				}
				return this.props.children;
			}
		};

		function apply(ctx) {
			ctxSessions = ctx.sessions;
			// 0.1.7：这两张脸是会话导航与全局面板选择的权威来源（见 20-core.js 顶部注记）。
			// `uiWorkspace` 已进 inject（导航是硬需求）；`layout` 用非严格 `ctx.get()`
			// 按需取——项目既有约定是「不为用不到的服务留硬门禁」，而面板入口属于
			// 增强项，缺失时只退化为不显示入口，不该让整插件不加载。
			ctxUiWorkspace = ctx.uiWorkspace ?? null;
			ctxLayout = ctx.get?.("layout", false) ?? null;
			ctxSlots = ctx.slots ?? null;
			const hookLayout = (l) => {
				if (!l || l.__wpHooked) return;
				l.__wpHooked = true;
				const origSelect = l.selectPanel?.bind(l);
				l.selectPanel = (panelId) => {
					if (panelId === "wallpaper") {
						dialogBus.set({ wallpaper: true });
						return;
					}
					return origSelect ? origSelect(panelId) : undefined;
				};
				if (typeof l.hasMainPanel === "function") {
					const origHas = l.hasMainPanel.bind(l);
					l.hasMainPanel = (id) => id === "wallpaper" || origHas(id);
				}
			};
			hookLayout(ctxLayout);
			try {
				ctx.on?.("internal/service", (name) => {
					if (name === "layout") {
						ctxLayout = ctx.get?.("layout", false) ?? ctx.layout ?? null;
						hookLayout(ctxLayout);
					}
				});
			} catch { /* ignore */ }
			try {
				if (ctxSessions?.list?.subscribe) {
					ctxSessions.list.subscribe(() => {
						syncWorkingState();
					});
				}
			} catch (e) {
				console.error("[dsh-session-center] sessions subscribe hook failed:", e);
			}
			if (!document.getElementById("dsh-session-center-css")) {
				const style = document.createElement("style");
				style.id = "dsh-session-center-css";
				style.textContent = CSS;
				document.head.appendChild(style);
			}
			// 壁纸层
			try {
				ensureWall();
			} catch (e) {
				console.error("[dsh-session-center] wallpaper init failed:", e);
			}
			// 侧栏 10s 闲置收起与工作态监控（独立于壁纸层，确保任何壁纸配置下皆可正常运行）
			try {
				initZenListeners();
				startWorkingMonitor();
			} catch (e) {
				console.error("[dsh-session-center] listeners & monitor init failed:", e);
			}
			// 确保开屏一打开 dsh，侧边栏直接处于收起状态（呈现用户截图所示的通透壁纸）
			try {
				ensureBootLayout();
			} catch (e) {
				console.error("[dsh-session-center] boot layout failed:", e);
			}
			// 刷新/重启后回到上次打开的会话（而不是新开对话）：前端把当前会话持久化
			// 在 localStorage `dsh.sessions.current`，SessionRuntime 构造时读取它并把
			// 它作为 restoredSelection 交给 SessionManager，页面加载即恢复该会话。
			//
			// 设置项「刷新后回到上次会话」（localStorage `dsh-my:restore-session`，
			// 默认 "1" = 开）控制此行为。开关关闭时，本插件清掉该键并让主视图回到
			// 「新对话」英雄屏——两者任一都足以打回英雄屏。需要新对话时也可走侧栏
			// 的新建按钮。
			try {
				if (localStorage.getItem("dsh-my:restore-session") === "0") {
					localStorage.removeItem("dsh.sessions.current");
					// 0.1.7 起 `ctx.sessions.clear()` 已被删除；等价行为在
					// `uiWorkspace.startSession()`（清掉主视图选择 + 持久化键），
					// 见 20-core.js 顶部的 API 搬迁注记。
					ctx.uiWorkspace?.startSession?.();
				}
			} catch (e) {
				console.error("[dsh-session-center] restore-session off hook failed:", e);
			}

			// 覆盖样式（标题 50 字、view-modes 摘要遮罩）延迟注入，确保排在插件样式之后
			setTimeout(() => {
				if (!document.getElementById("dsh-session-center-overrides")) {
					const s = document.createElement("style");
					s.id = "dsh-session-center-overrides";
					s.textContent = OVERRIDE_CSS;
					document.head.appendChild(s);
				}
			}, 1200);
			ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-session-center: locale");
			// （粘贴图片 → 路径文本已移除：不再注册任何 paste 捕获监听，
			//   剪贴板图片由宿主官方通道处理）
			// 重启成功 → 「欢迎回来」：连接（重连/刷新后首连）建立时检查重启 arm。
			// arm 在 localStorage（dsh-my:restart-arm，含 token + 重启前 seq），只有
			// 点过重启按钮才会存在；用户手动刷新（无 arm 或已清）零副作用。
			// 链路：断开重连（旧页面，无 reload 标记）→ 整页 reload 一次（拿新
			// __DSH_BOOT__ 清单）→ 新页面首连 → 查服务端 restart.status：seq 变大
			// = 真重启了 → 欢迎提示必显示（不依赖时间窗，重启再慢也不丢）；未变大
			// = 重启失败 → 不显示并清理。两种标记都随显示/失败清理。
			//
			// 兼容层：若发现上一代按钮留下 sessionStorage 标记（旧 client.js 写的
			// restart-pending，没有 seq 证据），说明本次重启由旧代码发起——能连上
			// 即视为成功。显示欢迎并清掉旧标记，完成一次性过渡。
			//
			// 轮询兜底：connection/reset 只在 onConnected（首连/重连成功）时发出；
			// reload 后新页面首连可能快于本插件 bundle 加载激活 → reset 先发 → 钩子
			// 注册时事件已过 → arm 永不被消费（实测症状：重启了却不显示欢迎）。
			// 因此把消费逻辑抽成函数：既挂事件，又注册后轮询补查（幂等，清完即止）。
			const consumeRestart = () => {
				try {
					const armRaw = localStorage.getItem("dsh-my:restart-arm");
					const legacyPending = sessionStorage.getItem("dsh-my:restart-pending");
					if (!armRaw && legacyPending) {
						sessionStorage.removeItem("dsh-my:restart-pending");
						sessionStorage.removeItem("dsh-my:restart-reload");
						dialogBus.set({ welcome: true });
						return;
					}
					if (!armRaw) {
						// 无 arm：可能情形之二——旧代码发起的重启，其 sessionStorage
						// 标记已在旧页面被消费（新页面读不到）。此时查服务端 legacy
						// 标记（由继任实例启动时自行留下，见 lib/index.js），查到即
						// 显示一次性欢迎（服务端同时清除标记，此后不再出现）。
						call("restart.status", {}).then((v) => {
							if (v?.legacy) dialogBus.set({ welcome: true });
						}).catch(() => {});
						return;
					}
					const arm = JSON.parse(armRaw);
					if (!arm || typeof arm.token !== "string") {
						localStorage.removeItem("dsh-my:restart-arm");
						return;
					}
					if (!localStorage.getItem("dsh-my:restart-reload")) {
						localStorage.setItem("dsh-my:restart-reload", String(arm.token));
						setTimeout(() => {
							// 重启后仍需整页 reload 一次，才能拿到新的 __DSH_BOOT__
							// 清单（新装插件/新 bundle）。但保留 localStorage
							// `dsh.sessions.current`，让 reload 后 SessionRuntime 恢复
							// 重启前打开的那个会话，而不是落到新对话英雄屏。
							try { window.location.reload(); } catch { /* ignore */ }
						}, 300);
						return;
					}
					(async () => {
						let seqNow = 0;
						for (let i = 0; i < 5; i++) {
							try {
								const v = await call("restart.status", {});
								seqNow = Number(v?.seq) || 0;
								break;
							} catch {
								await new Promise((r) => setTimeout(r, 800));
							}
						}
						if (seqNow > (Number(arm.seq0) || 0)) {
							dialogBus.set({ welcome: true });
						}
						localStorage.removeItem("dsh-my:restart-arm");
						localStorage.removeItem("dsh-my:restart-reload");
					})();
				} catch { /* ignore */ }
			};
			try {
				ctx.on("connection/reset", consumeRestart);
				// 轮询兜底：首连 reset 早于注册时也不丢；1s×10，arm 消费后自然停。
				// 存储访问全部安全化（测试/无浏览器环境直接停）。
				let poll = 0;
				const safeArm = () => {
					try { return localStorage.getItem("dsh-my:restart-arm"); }
					catch { return null; }
				};
				const pollConsume = () => {
					const arm = safeArm();
					if (arm) consumeRestart();
					poll += 1;
					if (poll < 10 && safeArm()) setTimeout(pollConsume, 1000);
				};
				setTimeout(pollConsume, 800);
			} catch (e) {
				console.error("[dsh-session-center] welcome hook failed:", e);
			}
			ctx.slots.inject("sidebar.workspaces", () => ctx.slots.register({
				name: "sidebar.workspaces",
				priority: -1,
				inject: () => ({
					// 0.1.7：会话导航归 `ctx.uiWorkspace.openSession(id)`（旧
					// `ctx.sessions.open` 已删除，调用即 TypeError）。语义一致：
					// 内部 `replaceMain(id, …, "reveal")` = 保留并揭示该会话。
					open: (sessionId) => ctx.uiWorkspace.openSession(sessionId),
				}),
				locale: NS,
			}, (props) => react.createElement(SCBoundary, null, react.createElement(SessionCenterBrowser, props))));
			// 页面级对话框宿主：标签管理/壁纸/打标签/确认/修复整页居中
			try {
				ctx.slots.inject("shell.overlay", () => ctx.slots.register({
					name: "shell.overlay",
					id: "dsh-session-center-dialogs",
					order: 6,
				}, () => react.createElement(ScDialogsHost)));
			} catch (e) {
				console.error("[dsh-session-center] overlay slot failed:", e);
			}
			// 会话顶栏已整体移除（含壁纸按钮），壁纸入口迁到 设置 → 常规
			// 侧栏底部重启按钮（footer.action 行，位于设置按钮上方；list 槽可并列）
			try {
				ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
					name: "sidebar.footer.action",
					id: "dsh-session-center-restart",
					order: 10,
					locale: NS,
				}, (props) => react.createElement(RestartButton, props)));
			} catch (e) {
				console.error("[dsh-session-center] footer action slot failed:", e);
			}
			// 侧栏全局面板行壁纸入口（位于插件市场旁边）
			try {
				ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({
					name: "sidebar.panellist",
					id: "wallpaper",
					order: 10,
					label: (t) => (typeof t === "function" ? t("wallpaper") : "壁纸"),
					locale: NS,
				}, (props) => react.createElement(WallpaperPanelIcon, props)));
			} catch (e) {
				console.error("[dsh-session-center] panellist wallpaper slot failed:", e);
			}
			// （此处原有一个「附件浮动栏」槽注册：它引用服务端早已删除的
			//  /api-ext/session-center.paste.get，detectTextAttachment 也从未被调用，
			//   条目恒为空、组件恒返回 null——2026-09-26 整条链路删除。）
			// 自定义排队条：同 cell（id "queue"）低优先级 shadow 官方 QueueDock，
			// 提供 编辑 / 删除 / 独立「发送」（steer）。
			try {
				ctx.slots.inject("conversation.input.dock", () => ctx.slots.register({
					name: "conversation.input.dock",
					id: "queue",
					priority: -1,
					order: 20,
					locale: NS,
					inject: (sessionId) => {
						let actx = null;
						let conversation = null;
						try {
							actx = ctx.sessions.scope(sessionId);
							conversation = actx?.get?.("conversation");
						} catch { /* scoping unavailable — actions will no-op */ }
						return {
							sessionId,
							updateQueue: (itemId, action) => conversation?.updateQueue?.(itemId, action) ?? Promise.reject(new Error("conversation unavailable")),
							notify: (level, text) => conversation?.input?.for?.(actx)?.notify?.(level, text),
						};
					},
				}, (props) => react.createElement(QueueStrip, props)));
			} catch (e) {
				console.error("[dsh-session-center] queue strip slot failed:", e);
			}
			// 设置 → 常规：刷新后回到上次会话开关（localStorage，纯客户端）
			try {
				ctx.slots.inject("settings.general.item", () => ctx.slots.register({
					name: "settings.general.item",
					id: "dsh-session-center-restore-session",
					order: 31,
					locale: NS,
				}, (props) => react.createElement(SessionRestoreRow, props)));
			} catch (e) {
				console.error("[dsh-session-center] restore session settings row failed:", e);
			}
			// 设置 → 常规：壁纸入口（顶栏壁纸按钮移除后迁到设置）
			try {
				ctx.slots.inject("settings.general.item", () => ctx.slots.register({
					name: "settings.general.item",
					id: "dsh-session-center-wallpaper",
					order: 32,
					locale: NS,
				}, (props) => react.createElement(WallpaperSettingsRow, props)));
			} catch (e) {
				console.error("[dsh-session-center] wallpaper settings row failed:", e);
			}
			// 统计行整体替换：与官方 StatsLine 同 id（stats）+ 低优先级 → 官方不渲染，
			// 由我方输出（砍掉「工具调用」耗时项；费用/余额前置，见 StatsLinePlus）。
			try {
				ctx.slots.inject("conversation.composer.dock", () => ctx.slots.register({
					name: "conversation.composer.dock",
					id: "stats",
					priority: -1,
					locale: NS,
					inject: (sessionId) => ({ sessionId }),
				}, (props) => react.createElement(StatsLinePlus, props)));
			} catch (e) {
				console.error("[dsh-session-center] stats line slot failed:", e);
			}
			// 统计行归位：dock 移入输入卡底部操作行中间（权限/上传/提示/模型/发送 平齐）
			try {
				ctx.effect(() => {
					const observer = installDockParking();
					return () => observer?.disconnect?.();
				}, "dsh-session-center: dock parking");
			} catch (e) {
				console.error("[dsh-session-center] dock parking failed:", e);
			}

			// 桌面版顶栏菜单（"应用" / "编辑"）边界与位置优化
			function installWindowsMenuEnhance() {
				if (typeof document === "undefined" || typeof document.querySelector !== "function") return null;

				const MENU_STYLE_ID = "dsh-windows-menu-custom-style";
				const MENU_CSS = `
:host {
  left: var(--dsh-windows-menu-start, 14px) !important;
}
[role="menubar"] {
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
}
button {
  height: 26px !important;
  padding: 0 11px !important;
  border-radius: 6px !important;
  font: inherit !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  cursor: pointer !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1) !important;
  border: 1px solid var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.28)) !important;
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-1, rgba(20, 24, 35, 0.45)) 75%, transparent) !important;
  color: var(--dsw-alias-label-primary, #f0f3f6) !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.18) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
}
:host-context(body[data-ds-dark-theme]) button,
:host-context(html[data-ds-dark-theme]) button {
  border: 1px solid rgba(255, 255, 255, 0.28) !important;
  background: rgba(255, 255, 255, 0.08) !important;
  color: #f0f3f6 !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.18) !important;
}
:host-context(body[data-ds-dark-theme]) button:hover,
:host-context(body[data-ds-dark-theme]) button[aria-expanded="true"],
:host-context(html[data-ds-dark-theme]) button:hover,
:host-context(html[data-ds-dark-theme]) button[aria-expanded="true"] {
  border-color: rgba(255, 255, 255, 0.5) !important;
  background: rgba(255, 255, 255, 0.18) !important;
  color: #ffffff !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3) !important;
  transform: translateY(-0.5px) !important;
}
:host-context(body:not([data-ds-dark-theme])) button,
:host-context(html:not([data-ds-dark-theme])) button {
  border: 1px solid rgba(0, 0, 0, 0.2) !important;
  background: rgba(255, 255, 255, 0.75) !important;
  color: #1a1e24 !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.85) !important;
}
:host-context(body:not([data-ds-dark-theme])) button:hover,
:host-context(body:not([data-ds-dark-theme])) button[aria-expanded="true"],
:host-context(html:not([data-ds-dark-theme])) button:hover,
:host-context(html:not([data-ds-dark-theme])) button[aria-expanded="true"] {
  border-color: rgba(0, 0, 0, 0.35) !important;
  background: rgba(255, 255, 255, 0.95) !important;
  color: #000000 !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15), inset 0 1px 0 #ffffff !important;
  transform: translateY(-0.5px) !important;
}
button:active {
  transform: translateY(0.5px) !important;
  opacity: 0.85 !important;
}
`;

				const injectIntoMenu = () => {
					const host = document.querySelector("div[data-windows-menu]");
					if (!host || !host.shadowRoot) return false;
					if (host.shadowRoot.getElementById(MENU_STYLE_ID)) return true;
					const style = document.createElement("style");
					style.id = MENU_STYLE_ID;
					style.textContent = MENU_CSS;
					host.shadowRoot.appendChild(style);
					return true;
				};

				if (injectIntoMenu()) return null;

				let attempts = 0;
				let timer = null;
				let observer = null;

				const cleanup = () => {
					if (timer) { clearInterval(timer); timer = null; }
					if (observer) { observer.disconnect(); observer = null; }
				};

				timer = setInterval(() => {
					attempts++;
					if (injectIntoMenu() || attempts > 40) {
						cleanup();
					}
				}, 250);

				if (typeof MutationObserver !== "undefined") {
					try {
						observer = new MutationObserver(() => {
							if (injectIntoMenu()) {
								cleanup();
							}
						});
						observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
					} catch (e) {
						// fallback to timer
					}
				}

				return { disconnect: cleanup };
			}

			try {
				ctx.effect(() => {
					const handle = installWindowsMenuEnhance();
					return () => handle?.disconnect?.();
				}, "dsh-session-center: windows menu enhance");
			} catch (e) {
				console.error("[dsh-session-center] windows menu enhance failed:", e);
			}

			// 桌面版（Windows 标题栏）折叠态下官方不渲染 FishLogo 时的图标注水兜底
			function installCollapsedWhaleObserver() {
				if (typeof document === "undefined" || typeof document.querySelector !== "function") return null;

				const FISH_PATH = "M22.9168 1.43018C22.6713 1.31018 22.5658 1.53918 22.4223 1.65519C22.3733 1.69269 22.3318 1.74169 22.2903 1.78669C21.9317 2.1697 21.5127 2.42121 20.9657 2.39121C20.1657 2.34621 19.4827 2.59771 18.8787 3.20973C18.7502 2.45521 18.3236 2.0047 17.6746 1.71569C17.3351 1.56568 16.9916 1.41518 16.7536 1.08867C16.5876 0.856163 16.5421 0.597155 16.4591 0.341647C16.4061 0.187643 16.3536 0.0301382 16.1761 0.00363739C15.9836 -0.0263635 15.9081 0.135141 15.8326 0.270145C15.5306 0.822162 15.4136 1.43018 15.4251 2.0462C15.4516 3.43174 16.0366 4.53527 17.1991 5.3203C17.3311 5.4103 17.3651 5.5003 17.3236 5.63181C17.2441 5.90231 17.1501 6.16482 17.0671 6.43533C17.0141 6.60784 16.9351 6.64584 16.7501 6.57033C16.1121 6.30383 15.5611 5.90931 15.074 5.4328C14.2475 4.63328 13.5 3.75075 12.568 3.05973C12.349 2.89822 12.13 2.74822 11.9034 2.60522C10.9524 1.68169 12.028 0.923165 12.277 0.833162C12.5375 0.739159 12.3675 0.41615 11.5259 0.42015C10.6844 0.42365 9.91439 0.705658 8.93286 1.08117C8.78935 1.13767 8.63835 1.17867 8.48384 1.21267C7.59332 1.04367 6.66829 1.00617 5.70226 1.11517C3.88321 1.31768 2.43016 2.1777 1.36213 3.64575C0.0790928 5.4103 -0.222916 7.41536 0.146595 9.50642C0.535106 11.7105 1.66014 13.535 3.38869 14.9616C5.18125 16.4406 7.24581 17.1657 9.60138 17.0266C11.0319 16.9441 12.6245 16.7526 14.421 15.2321C14.874 15.4576 15.3496 15.5476 16.1381 15.6151C16.7456 15.6716 17.3306 15.5851 17.7836 15.4911C18.4931 15.3411 18.4441 14.6841 18.1876 14.5636C16.1081 13.595 16.5646 13.9891 16.1496 13.67C17.2061 12.42 18.8202 10.1979 19.3182 7.17235C19.3672 6.83834 19.4297 6.36783 19.4222 6.09732C19.4182 5.93231 19.4562 5.86831 19.6447 5.84931C20.1657 5.78931 20.6712 5.64681 21.1357 5.3913C22.4833 4.65528 23.0268 3.44624 23.1548 1.9972C23.1738 1.77569 23.1508 1.54668 22.9168 1.43018ZM11.1749 14.4736C9.15936 12.889 8.18184 12.3675 7.77832 12.39C7.40081 12.4125 7.46881 12.8445 7.55182 13.126C7.63882 13.404 7.75182 13.5955 7.91033 13.8396C8.01983 14.0011 8.09533 14.2411 7.80083 14.4216C7.15181 14.8231 6.02327 14.2866 5.97027 14.2601C4.65673 13.4865 3.5587 12.4655 2.78467 11.069C2.03715 9.72493 1.60314 8.28289 1.53164 6.74384C1.51264 6.37233 1.62214 6.24082 1.99215 6.17332C2.47916 6.08332 2.98118 6.06432 3.46769 6.13582C5.52476 6.43633 7.27581 7.35586 8.74385 8.8129C9.58188 9.64243 10.2159 10.634 10.8689 11.6025C11.5634 12.631 12.3105 13.611 13.262 14.4146C13.598 14.6961 13.866 14.9101 14.1225 15.0681C13.349 15.1546 12.058 15.1731 11.1749 14.4746L11.1749 14.4736ZM12.141 8.25988C12.141 8.09488 12.273 7.96338 12.439 7.96338C12.4765 7.96338 12.5105 7.97088 12.541 7.98188C12.5825 7.99688 12.6205 8.01938 12.6505 8.05338C12.7035 8.10588 12.7335 8.18088 12.7335 8.25988C12.7335 8.42489 12.6015 8.55639 12.4355 8.55639C12.2695 8.55639 12.141 8.42489 12.141 8.25988ZM15.1415 9.79893C14.949 9.87793 14.7565 9.94544 14.5715 9.95294C14.2845 9.96794 13.9715 9.85143 13.8015 9.70893C13.5375 9.48742 13.3485 9.36342 13.2695 8.97691C13.2355 8.8119 13.2545 8.55639 13.2845 8.40989C13.3525 8.09438 13.277 7.89187 13.0545 7.70787C12.8735 7.55786 12.643 7.51636 12.39 7.51636C12.2955 7.51636 12.209 7.47486 12.1445 7.44136C12.039 7.38886 11.9519 7.25735 12.035 7.09585C12.0615 7.04335 12.19 6.91584 12.22 6.89334C12.5635 6.69784 12.9595 6.76184 13.326 6.90834C13.6655 7.04735 13.9225 7.30236 14.292 7.66287C14.6695 8.09838 14.7375 8.21838 14.9525 8.54539C15.1225 8.8009 15.277 9.06341 15.3831 9.36392C15.4471 9.55142 15.3641 9.70493 15.1415 9.79893Z";

				const syncWhale = () => {
					try {
						const frame = document.querySelector('[class*="frame"]');
						const sidebar = document.querySelector('[data-slot="sidebar"]');
						if (!sidebar) return;

						const isCollapsed = Boolean(
							frame?.getAttribute("data-sidebar-collapsed") === "true" ||
							sidebar.querySelector('[class*="_collapsed"], [class$="collapsed"]') ||
							sidebar.matches(':has([class*="_collapsed"], [class$="collapsed"])')
						);

						const toggle = sidebar.querySelector('[class*="toggle"]');
						if (!toggle) return;

						const isWindowsDesktop = Boolean(document.querySelector("[data-windows-titlebar]"));

						if (isCollapsed && isWindowsDesktop) {
							const hasNativeRail = Boolean(toggle.querySelector('[class*="railMark"]:not(.sc-whale-mark)'));
							if (!hasNativeRail) {
								let mark = toggle.querySelector(".sc-whale-mark");
								if (!mark) {
									mark = document.createElement("span");
									mark.className = "sc-whale-mark";
									mark.setAttribute("aria-hidden", "true");
									mark.innerHTML = `<svg viewBox="0 0 23.16 17.04" width="24" height="18" fill="none"><path d="${FISH_PATH}" fill="currentColor"/></svg>`;
									toggle.appendChild(mark);
								}
							} else {
								const marks = toggle.querySelectorAll(".sc-whale-mark");
								for (const m of marks) m.remove();
							}
						} else {
							const marks = toggle.querySelectorAll(".sc-whale-mark");
							for (const m of marks) m.remove();
						}
					} catch (e) {
						// ignore
					}
				};

				syncWhale();

				let observer = null;
				if (typeof MutationObserver !== "undefined") {
					try {
						observer = new MutationObserver(() => {
							syncWhale();
						});
						observer.observe(document.body || document.documentElement, {
							attributes: true,
							childList: true,
							subtree: true,
							attributeFilter: ["data-sidebar-collapsed", "class"],
						});
					} catch (e) {
						// ignore
					}
				}

				return {
					disconnect: () => {
						if (observer) {
							observer.disconnect();
							observer = null;
						}
					},
				};
			}

			try {
				ctx.effect(() => {
					const handle = installCollapsedWhaleObserver();
					return () => handle?.disconnect?.();
				}, "dsh-session-center: collapsed whale observer");
			} catch (e) {
				console.error("[dsh-session-center] collapsed whale observer failed:", e);
			}
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	},
});
