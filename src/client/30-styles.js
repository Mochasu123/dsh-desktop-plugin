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
[data-slot="sidebar"] [class*="panelList"] [class*="panelRow"]:has([aria-label*="自动化"]),
[data-slot="sidebar"] [class*="panelList"] [class*="panelRow"][aria-label*="自动化"],
[data-slot="sidebar"] [class*="panelList"] [class*="panelRow"]:has([aria-label*="Schedule"]),
[data-slot="sidebar"] [class*="panelList"] [class*="panelRow"][aria-label*="Schedule"]{display:none !important;}
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
html.sc-wall-on [data-slot="main"] [class*="page"],
html.sc-wall-on [data-slot="main"] [class*="listPane"],
html.sc-wall-on [data-slot="main"] [class*="pageScroll"]{
  background: transparent !important;
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
  pointer-events: auto !important;
  -webkit-app-region: no-drag !important;
  app-region: no-drag !important;
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
html.sc-wall-on [class*="frame"][data-sidebar-collapsed] [data-slot="sidebar"],
html.sc-wall-on [data-slot="sidebar"]:has([class*="collapsed"]),
html.sc-wall-on [data-slot="sidebar"][class*="collapsed"]{
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
}
html.sc-wall-on [class*="sidebarCol"]{
  background: transparent !important;
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
