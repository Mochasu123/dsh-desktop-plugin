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
			// 目前**只放插件市场**（用户选择：不要定时任务）。放开其它面板只需往
			// PANEL_ALLOW 里加 id（定时任务是 "schedules"，插件市场是 "plugins"）。
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
