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
