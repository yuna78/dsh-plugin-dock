# 安装与排错

## 要求

- DSH `>=0.2.1-rc.2 <0.3.0`
- Web GUI（本插件是纯客户端 bundle，宿主半部是空实现）
- 目标 profile 里没有任何同 id 的插件

## 从 npm 安装

```bash
dsh plugin --profile web add dsh-plugin-dock
```

装完**刷新页面**（⌘R / Ctrl+R）。插件是在客户端加载的，不刷新看不到。

## 从 DSH 里安装

- **Add plugin** 弹窗：搜 **npm 包名** `dsh-plugin-dock`（不是仓库名）；
- 插件市场（awesome-dsh-plugin）：搜「插件坞」或 `dsh-plugin-dock`。

> 市场收录有延迟：条目合并后要等夜间构建探测 npm，`index.json` 里才会出现，当天的弹窗可能还搜不到。搜不到时直接用上面的 CLI 命令装。

## 本地开发安装

```bash
dsh plugin --profile web add link:/path/to/dsh-plugin-dock
```

改 `client.js` 后刷新页面即可看到新代码；改 `index.js`（宿主半部）需要重启 `dsh`。

## 升级

```bash
dsh plugin --profile web add dsh-plugin-dock@latest
```

## 卸载

```bash
dsh plugin --profile web remove dsh-plugin-dock
```

卸载后刷新页面，右下角胶囊消失；侧栏（如果是集中模式）会在下一次渲染恢复。

## 确认装上了

1. 右下角出现「插件坞」小胶囊；
2. **Plugins** 面板里出现一张「插件坞 / Plugin Dock」卡片，有图标；
3. 点开胶囊能看到「面板入口」列表。

## 排错

| 症状 | 原因 | 处理 |
| --- | --- | --- |
| 看不见胶囊 | 页面没刷新 / 插件未启用 | 刷新页面；到 Plugins 面板确认已启用 |
| 胶囊在，列表空 | 当前 profile 没有插件注册 `sidebar.panellist` | 正常：会显示「没有插件注册面板入口」 |
| 开关切了没反应 | 侧栏 DOM 变了（CSS 锚点失效） | 见 [compat.md](compat.md)；升级插件，或等上游提供官方隐藏 API |
| 第二段提示「不可用」 | Host 没挂 `pluginInventory` / `pluginManager` remote | 升级 DSH 到兼容版本 |
| 点行没跳转 | 那些面板还没注册 / 被禁用 | 刷新页面；看浏览器控制台里的 `[plugin-dock]` 警告 |
| Add plugin 弹窗搜不到 | 市场索引还没收录（夜间探测） | 用 CLI 命令装，或等一天 |

本插件的日志前缀是 `[plugin-dock]`，出错只 `console.warn`，不会抛出中断页面。
