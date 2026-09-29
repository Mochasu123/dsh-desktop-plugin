# DeepSeek Harness Desktop Plugin (`dsh-desktop-plugin`)

专为 **DeepSeek Harness**（DSH）量身打造的高颜值沉浸式桌面端与 Web 端增强插件。提供全屏液态玻璃壁纸、折叠态灵动呼吸鲸鱼、桌面端标题栏深度融合、操作行实时费用与余额统计、标签化会话管理、多代日志备份与脑裂一键修复等全套功能。

---

## ✨ 核心特性

### 1. 🎨 桌面端专属：液态玻璃与灵动交互
- **全屏沉浸式壁纸与毛玻璃（Liquid Glass UI）**：
  - 框架全透明化，侧边栏、对话流与输入区通透呈现壁纸背景。
  - 支持自定义大图上传（IndexedDB Blob 存储，突破 4MB 限制），具备模糊度、不透明度、多档调色遮罩与鼠标光斑动效。
- **悬浮灵动小鲸鱼球（Whale Orb）**：
  - 侧边栏折叠后，平滑聚拢收缩为 44px 液态玻璃球，居中展示 DeepSeek 原生蓝色小鲸鱼，带有 3D 呼吸光晕动效。
  - 针对 Windows 桌面端（Titlebar 模式）特别注水修复原生 React 树不渲染小鲸鱼图标的问题。
- **展开态智能排版防重叠**：
  - 彻底覆写桌面端脱流定位，使侧边栏收起按钮 `◨` 归位于侧栏卡片右上角，与左侧 `deepseek HARNESS` 商标优雅共存，绝不发生层叠遮挡。
- **Windows 标题栏菜单美化**：
  - 深度优化左侧“应用 / 编辑”原生菜单按钮，提供微晶光泽、悬停浮光与亮/暗色自适应边框。
- **现代文件夹选择器**：
  - 附带原生 `bin/ModernFolderPicker.dll`，在 Windows 下唤起现代 Vista/Win10/Win11 风格的通用文件夹拾取器。

---

### 2. 💰 输入卡操作行：实时费用与余额统计
- 紧凑停靠在输入框底部操作行中间，与“权限 / 上传 / 模型 / 发送”按钮同一水平线。
- **实时费用计算**：按 LLM 每次请求的实际服务通道（官方直连 / CCAI 中转）+ 具体模型 + 高峰/半价时段精确累计。
- **官方余额展示**：直连 DeepSeek 官方 API 获取当前账户余额（服务端 30 秒缓存并掩码鉴权）。

---

### 3. 🏷️ 侧边栏会话中心与标签管理
- **时间线视图**：按最后更新时间倒序排列，彻底取代传统的平铺或嵌套目录，更符合日常对话习惯。
- **📌 置顶会话**：重要会话一键固定置顶，置顶区独立排序。
- **彩虹标签系统**：
  - 8 种精选预置配色（番茄红、蜜橙、柠檬黄、薄荷绿、天青蓝、薰衣草紫、樱花粉、石墨灰）。
  - 支持全屏居中浮层新建、重命名、调色、删除与批量打标签。
- **液态玻璃悬浮卡片**：鼠标悬停 2 秒展示会话时间、输入/输出 Token 细分与缓存命中率。

---

### 4. 🛡️ 数据安全中心：回收站、备份与脑裂修复
- **删除与回收站**：删除会话即移入安全隔离区，支持一键还原（重新挂接 workspace）或彻底清空，防止误删。
- **多代代际备份**：会话关闭时自动 snapshot，保留最新 20 份完整副本。
- **脑裂体检与一键修复**：针对多进程共享 `$DSH_HOME` 导致的 seq 交错、断帧、坏流问题，提供无损修复引擎。

---

### 5. ⚡ Windows 控制台防闪窗补丁
- 宿主 `dsh web` 衍生子进程时默认弹黑窗问题，提供内置补丁（注入 `CREATE_NO_WINDOW` / `windowsHide`），杜绝每次工具调用闪烁弹窗。

---

## 🚀 安装指南

### 方式 A：桌面端（DeepSeek Harness Desktop）

在终端中定位到克隆目录，将其链接到桌面端 profile：

```powershell
# 1. 克隆本仓库
git clone https://github.com/Mochasu123/dsh-desktop-plugin.git C:\Workspace\dsh-desktop-plugin

# 2. 挂载到桌面端配置
dsh plugin --profile desktop add link:C:\Workspace\dsh-desktop-plugin

# 3. 重启桌面端或在窗口中按 Ctrl + R 即可生效
```

*(或者在 `~/.dsh/profiles/desktop/node_modules/dsh-my` 创建软链接/Junction 指向该目录)*

---

### 方式 B：Web 端（DeepSeek Harness Web）

```powershell
dsh plugin --profile web add link:C:\Workspace\dsh-desktop-plugin
```

在前端界面左下角点击“重启 Harness”，随后刷新浏览器页面即可加载最新客户端 Bundle。

---

## 🛠️ 本地开发与门禁验证

项目代码遵循严苛的自动化门禁规范：

```bash
# 安装开发依赖
pnpm install

# 运行 74 项功能单元测试
npm test

# 构建客户端 Bundle（源码位于 src/client/）
npm run build

# 运行全量代码门禁（语法、依赖、锁文件、单测、打包清单）
npm run verify
```

> **注意**：[client.js](client.js) 为自动构建生成物，请勿直接手动修改。源码位于 [src/client/](src/client/) 目录下。

---

## 📜 开源协议

本项目基于 [MIT License](LICENSE) 开源发布。
