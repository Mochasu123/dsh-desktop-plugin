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

		// ------------------------------------------------------- main browser
