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
