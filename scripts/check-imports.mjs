// 依赖门禁：源码里出现的**每一个裸模块名**（静态 import / 动态 import() / require）
// 都必须 (1) 声明在 package.json、(2) 能从插件目录解析。
//
// 为什么重写（2026-09-26）：旧实现的正则只匹配 `@deepseek-ai/*`，而本插件运行时
// 一个都没有——于是它永远打印「全部 @deepseek-ai 导入均已声明且可解析 ✓」并以
// exit 0 结束，恰好漏掉了唯一真实缺失的依赖（`undici`）。恒绿的门禁比没有门禁更糟：
// 它给人"已经查过了"的错觉。
//
// 另外报告"声明了但没人用"的依赖，防止 manifest 与代码继续漂移。
// 退出码：1 = 有未声明/不可解析/未使用的运行时依赖；0 = 干净。

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

const runtimeDeclared = new Map(Object.entries(pkg.dependencies ?? {}));
const devDeclared = new Map(Object.entries(pkg.devDependencies ?? {}));
const peerDeclared = new Map(Object.entries(pkg.peerDependencies ?? {}));

// 扫描：lib/（服务端）、client.js（客户端产物）、scripts/（工具）与 test/（测试）
const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(js|mjs|cjs)$/.test(name)) files.push(p);
  }
};
for (const dir of ["lib", "scripts", "test"]) walk(join(root, dir));
for (const extra of ["client.js", "index.js", "server.js"]) {
  try {
    if (statSync(join(root, extra)).isFile()) files.push(join(root, extra));
  } catch { /* absent is fine */ }
}

const SPECIFIER_RE = /\bfrom\s*['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)|\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)|\bimport\s+['"]([^'"]+)['"]/g;

// 先把注释与**模板字面量**挖空，再匹配 specifier。
//
// 必要性：lib/kernel-patches.js 里存着要注入内核的补丁文本（模板字面量），其中就
// 包含 `import koffi from "koffi"` —— 那是**内核**的依赖，不是本插件的；
// 而模板里还有 `/* ... */` 形态的片段，用正则三连（先去块注释→再去行注释→再掩模板）
// 会因配对错位而漏掩（实测踩到：koffi 仍被报为未声明依赖）。
// 所以这里用一个单趟状态机：注释整体丢弃、模板整体替换成 ``，
// **普通引号字符串原样保留**（specifier 就在里面）。
function stripNonCode(text) {
  let out = "";
  let i = 0;
  const n = text.length;
  while (i < n) {
    const ch = text[i];
    if (ch === "/" && text[i + 1] === "/") {
      while (i < n && text[i] !== "\n") i += 1;
      continue;
    }
    if (ch === "/" && text[i + 1] === "*") {
      i += 2;
      while (i < n && !(text[i] === "*" && text[i + 1] === "/")) i += 1;
      i += 2;
      continue;
    }
    if (ch === "`") {
      i += 1;
      while (i < n) {
        if (text[i] === "\\") { i += 2; continue; }
        if (text[i] === "`") { i += 1; break; }
        i += 1;
      }
      out += "``";
      continue;
    }
    if (ch === '"' || ch === "'") {
      const quote = ch;
      out += ch;
      i += 1;
      while (i < n) {
        if (text[i] === "\\") {
          out += text[i];
          i += 1;
          if (i < n) { out += text[i]; i += 1; }
          continue;
        }
        out += text[i];
        const done = text[i] === quote;
        i += 1;
        if (done) break;
      }
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

/** 取包名（作用域包取两段）。 */
function packageOf(spec) {
  const parts = spec.split("/");
  return spec.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

const used = new Map(); // package name -> Set(files)
for (const file of files) {
  const text = stripNonCode(readFileSync(file, "utf8"));
  for (const m of text.matchAll(SPECIFIER_RE)) {
    const spec = m[1] ?? m[2] ?? m[3] ?? m[4];
    if (spec === undefined) continue;
    if (spec.startsWith(".") || spec.startsWith("/") || spec.startsWith("node:") || spec.startsWith("file:") || spec.startsWith("#")) continue;
    const name = packageOf(spec);
    if (!used.has(name)) used.set(name, new Set());
    used.get(name).add(file.slice(root.length + 1).replaceAll("\\", "/"));
  }
}

const require = createRequire(join(root, "package.json"));
let failed = false;

console.log(`扫描 ${files.length} 个文件，发现 ${used.size} 个裸模块依赖：\n`);

for (const [name, where] of [...used].sort()) {
  const issues = [];
  const declared = runtimeDeclared.has(name) || devDeclared.has(name) || peerDeclared.has(name);
  if (!declared) issues.push("未声明在 package.json");
  try {
    require.resolve(name, { paths: [root] });
  } catch {
    issues.push("插件目录内无法解析（需在插件目录 pnpm install）");
  }
  const kind = runtimeDeclared.has(name) ? "dependencies" : devDeclared.has(name) ? "devDependencies" : peerDeclared.has(name) ? "peerDependencies" : "—";
  if (issues.length > 0) {
    failed = true;
    console.log(`✗ ${name}  [${kind}]  ${issues.join("；")}`);
    console.log(`    引用自：${[...where].join(", ")}`);
  } else {
    console.log(`✓ ${name}  [${kind}]`);
  }
}

// 声明了却没人用：运行期依赖未使用 = 真实缺陷（会把不需要的包拖进 profile）；
// 开发依赖未使用 = 告警（可能只是给编辑器/测试夹具用）。
const unusedRuntime = [...runtimeDeclared.keys()].filter((name) => !used.has(name));
const unusedDev = [...devDeclared.keys()].filter((name) => !used.has(name));
if (unusedRuntime.length > 0) {
  failed = true;
  console.log(`\n✗ dependencies 里没有任何引用的包：${unusedRuntime.join(", ")}（删掉，或把引用补上）`);
}
if (unusedDev.length > 0) {
  console.log(`\n⚠ devDependencies 里没有引用的包：${unusedDev.join(", ")}（确认是否还需要）`);
}

if (failed) {
  console.error("\n修复：把缺失的包补进 package.json 的 dependencies（版本与内核线对齐），");
  console.error("然后在插件目录运行 pnpm install，最后重启 dsh web。");
  process.exit(1);
}
console.log("\n依赖门禁通过 ✓");
