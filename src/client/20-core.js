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
		let lastActiveSessionId = null;

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
