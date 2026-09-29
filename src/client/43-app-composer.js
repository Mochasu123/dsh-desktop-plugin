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
			const inbox = useSession((s) => s.queue);
			const queue = react.useMemo(() => inbox.filter((row) => row.placement === "queued"), [inbox]);
			const running = useSession((s) => s.running);
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