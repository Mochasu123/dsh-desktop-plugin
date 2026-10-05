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

		// 页面级对话框宿主：挂在 shell.overlay 槽上，整页居中渲染
		function ScDialogsHost() {
			react.useSyncExternalStore(dialogBus.subscribe, dialogBus.getSnapshot, dialogBus.getSnapshot);
			const st = dialogBus.state;
			const activePanelId = react.useSyncExternalStore(
				(onStoreChange) => {
					try {
						return ctxLayout?.panelInfo?.subscribe?.(onStoreChange) ?? (() => {});
					} catch {
						return () => {};
					}
				},
				() => {
					try {
						return ctxLayout?.panelInfo?.getSnapshot?.()?.activePanelId ?? null;
					} catch {
						return null;
					}
				},
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
					const toolbar = document.querySelector('[data-plugin-panel] [class*="toolbar"]');
					if (!toolbar || toolbar.querySelector(".sc-panel-tb-back")) return;
					const btn = document.createElement("button");
					btn.type = "button";
					btn.className = "sc-panel-back-btn sc-panel-tb-back";
					btn.title = (L("backToConversation") || "返回会话") + " (Esc)";
					btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle"><line x1="13" y1="8" x2="3" y2="8"></line><polyline points="8 3 3 8 8 13"></polyline></svg><span>${L("backToConversation") || "返回会话"}</span><span class="sc-panel-back-key">Esc</span>`;
					btn.onclick = () => { try { ctxLayout?.selectPanel?.(null); } catch {} };
					toolbar.prepend(btn);
				};
				const tId = setTimeout(injectToolbar, 60);
				let observer = null;
				try {
					observer = new MutationObserver(injectToolbar);
					observer.observe(document.body, { childList: true, subtree: true });
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
			if (activePanelId) {
				kids.push(h("div", { key: "panel-back", className: "sc-panel-back-floating" },
					h("button", {
						type: "button",
						className: "sc-panel-back-btn",
						title: (L("backToConversation") || "返回会话") + " (Esc)",
						"aria-label": (L("backToConversation") || "返回会话"),
						onClick: () => {
							try { ctxLayout?.selectPanel?.(null); } catch (e) { console.debug(e); }
						},
					},
						h("svg", {
							width: 14, height: 14, viewBox: "0 0 16 16", fill: "none",
							stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round",
							style: { display: "inline-block", verticalAlign: "middle" },
						},
							h("line", { x1: "13", y1: "8", x2: "3", y2: "8" }),
							h("polyline", { points: "8 3 3 8 8 13" }),
						),
						h("span", null, L("backToConversation") || "返回会话"),
						h("span", { className: "sc-panel-back-key", "aria-hidden": "true" }, "Esc"),
					),
				));
			}
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
