# 更新日志

## [0.1.1] · 2026-10-31

### 变更（行为默认值）

- **开关默认改为「关」**：装好、刷新后立刻进入集中模式——左侧栏那排插件图标收起，所有入口都在插件坞里；想恢复插件自己的侧栏入口，把开关打开即可。
- 存储键 `dsh-plugin-dock.respect` → `dsh-plugin-dock.respect-mode`，避免 0.1.0 存下的旧值覆盖新默认值。

### 工程

- 无接口变化；`verify/smoke.mjs --public` 全绿，`npm pack` 文件清单不变（14 个）。

## [0.1.0] · 2026-10-31

首个公开版本。从「左侧栏插件入口太多太乱」出发，把入口收进一个可折叠的浮动窗口。

### 功能

- **入口收纳**：在 `shell.overlay` 浮动层里渲染一张卡片，收起时是右下角一颗胶囊（带入口数量角标），展开后是列表。
- **面板入口列表**：实时快照 `sidebar.panellist`（与侧栏同源，插件增删自动跟随），点一行 `layout.selectPanel(id)` 直接切面板，当前面板高亮，「←」回对话。
- **集中模式开关**：开（默认）= 尊重插件自己的侧栏入口；关 = 只保留本窗口，收起侧栏那排图标（一条 CSS 规则，失效时静默降级）。
- **已安装插件清单**：通过 Host 的 `pluginInventory` / `pluginManager` remote 读取当前 profile 的全部已安装 bundle（真图标、启用状态），点一行 `pluginNavigation.openBundle(name)` 深链到 Plugins 面板详情页。
- **可拖拽 + 记忆**：位置、折叠、开关状态存 `localStorage`；拖动限制在视口内。
- **主题与文案**：只用 `--dsw-*` 主题 token（带硬编码回退色）；中英文案走 Client locale 字典，locale 服务缺失时回退内置中文。

### 工程

- 纯客户端 bundle：`index.js` 宿主半部为空实现，不 import 任何 Harness 客户端包，只 `require('react')`。
- `verify/smoke.mjs`：契约 / 槽位 / locale 键集 / ModuleLoader id / 隐私扫描，共 263（公开仓 299） 项（不联网、不开浏览器）。
- `scripts/build-public-bundle.mjs`：白名单构建 + 包身份重写 + 隐私扫描 0 命中，产物 19 个文件 / 72.7 KiB；`npm pack` 后 14 个文件 / 17.7 KiB（含 README、LICENSE、docs、locale、icon）。
- 已知限制（集中模式的 CSS 锚点、侧栏底部动作按钮不纳入、占位图标等）见 README。
