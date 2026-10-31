# 兼容性与内部契约

基线：DSH `0.2.1-rc.2`，`web` profile。
本插件**只使用公开的客户端插件契约**（`ctx.slots` / `ctx.layout` / `ctx.locale` / `ctx.remote`），没有 import 任何 Harness 客户端包，也不 patch 别人的包。

下面这些是它依赖的「运行时事实」。上游改动时，其中大部分会**降级**而不是报错；只有 CSS 锚点那条是静默失效。

| # | 依赖 | 用途 | 上游变化时的表现 | 降级方式 |
| --- | --- | --- | --- | --- |
| 1 | `shell.overlay` 列表槽 | 窗口挂在整帧浮动层 | 窗口不出现 | 无（这是唯一的渲染位置） |
| 2 | `sidebar.panellist` 列表槽 | 第一段「面板入口」 | 列表为空 | 显示「没有插件注册面板入口」提示，不报错 |
| 3 | `main` 键控槽的 key | 跳转前校验目标面板存在 | 校验失败 → 不跳 | `console.warn`，点击无副作用 |
| 4 | `ctx.layout.selectPanel(id)` | 切换到面板 / `null` 回对话 | 未注册 key 会 throw | 调用前用 `ctx.slots.entries('main')` 校验 |
| 5 | `ctx.pluginNavigation.openBundle(name)` | 已安装插件 → 详情页 | 服务缺失 | 回退到 `selectPanel('plugins')` |
| 6 | `remote.pluginInventory.list()` | 判断宿主是否支持插件管理 | 缺失 / `managementAvailable:false` | 第二段显示「不可用」 |
| 7 | `remote.pluginManager.listBundles()` | 已安装插件清单（标题/图标/启用） | 缺失 | 第二段显示「不可用」 |
| 8 | `ctx.locale.register` / `resolveText` | 中英文案 | 服务缺失 | 使用内置中文字典 |
| 9 | 主题 token `--dsw-alias-*` 等 | 明暗主题自适应 | token 改名 | 每条 CSS 都带硬编码回退色 |
| 10 | `nav[class*="panelList"]` | **集中模式**隐藏侧栏图标列 | class 局部名变化 → 规则匹配不到 | **静默失效**：开关变成「无效果」，页面不受影响 |
| 11 | overlay 层的 `pointer-events` 约定（层本身 `none`，直接子元素 `auto`） | 窗口可点击但其它区域 click-through | 约定变化 | 窗口可能点不到 |
| 12 | `localStorage` | 记住位置 / 折叠 / 开关 | 被禁用 | 每次加载回默认（右下角、收起、开关开） |

## 版本策略

- 只在 DSH 出现 minor 变化（`0.2.x` → `0.3.x`）时复验上表；patch / rc 之间通常不需要动。
- 第 10 条是唯一需要肉眼验证的：切一次开关，看侧栏那排图标有没有收起。没收起就是锚点变了，改 `client.js` 里的 `CONSOLIDATED_CSS` 即可。
- 上游如果提供官方的「隐藏侧栏入口」API，应替换掉第 10 条的 CSS 规则。
