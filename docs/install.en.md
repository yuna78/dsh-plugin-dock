# Install & troubleshooting

## Requirements

- DSH `>=0.2.1-rc.2 <0.3.0`
- Web GUI (this is a client-only bundle; the host half is an empty `apply()`)
- No other plugin with the same id installed in the target profile

## Install from npm

```bash
dsh plugin --profile web add dsh-plugin-dock
```

Then **reload the page** (⌘R / Ctrl+R). The plugin loads in the client, so it is not visible before a reload.

## Install from inside DSH

- **Add plugin** dialog: search the **npm package name** `dsh-plugin-dock`;
- Marketplace (awesome-dsh-plugin): search "Plugin Dock" / `dsh-plugin-dock`.

> Marketplace indexing is delayed: after the entry is merged, the nightly build has to probe npm before the package shows up in `index.json`. Use the CLI command if the dialog cannot find it yet.

## Local development install

```bash
dsh plugin --profile web add link:/path/to/dsh-plugin-dock
```

`client.js` changes appear after a page reload; `index.js` (host half) changes need a `dsh` restart.

## Upgrade / uninstall

```bash
dsh plugin --profile web add dsh-plugin-dock@latest
dsh plugin --profile web remove dsh-plugin-dock
```

## Confirm it is installed

1. A "Plugin Dock" pill appears in the bottom-right corner;
2. The **Plugins** panel shows a "Plugin Dock / 插件坞" card with an icon;
3. Expanding the pill lists the registered panels.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| No pill | Page not reloaded / plugin disabled | Reload; check the Plugins panel |
| Pill is there but the list is empty | No plugin registered `sidebar.panellist` | Expected: a hint is shown |
| Switch does nothing | Shell sidebar markup changed (CSS anchor) | See [compat.md](compat.md); update the plugin |
| Second section says "unavailable" | `pluginInventory` / `pluginManager` remotes missing | Upgrade DSH |
| Clicking a row does nothing | Panel not registered / disabled | Reload; check the `[plugin-dock]` warning in the console |

The log prefix is `[plugin-dock]`; failures are `console.warn` only and never throw into the page.
