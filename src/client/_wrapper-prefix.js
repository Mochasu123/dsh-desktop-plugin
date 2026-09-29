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
