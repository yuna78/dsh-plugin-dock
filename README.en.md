# Plugin Dock · 插件坞

> A **sidebar-entry collector** for the DSH Web GUI: every plugin's left-sidebar entry folds into one collapsible floating window, collapsed by default into a small pill in the bottom-right corner.

The more DSH plugins you install, the longer that column of plugin icons in the sidebar gets. Plugin Dock collects them:

- **Collapsed** – a small pill with an entry-count badge, out of the way;
- **Expanded** – a list; click a row to switch to that plugin's panel, with the current panel highlighted;
- **Switch at the top** decides who owns the sidebar:
  - **Off** (default) – "dock mode": the original icon column is hidden and every entry lives in this card;
  - **On** – plugins keep their own sidebar entries; the window is just an extra launcher;
- **"Installed plugins" section** – every bundle installed in the current profile (including those without a sidebar entry); click a row to deep-link into its detail page in the Plugins panel.

```
┌────────────────────────────────┐
│ ◈ Plugin Dock          ←   —  │  ← drag the header to move
├────────────────────────────────┤
│ Keep sidebar entries      [○ ] │  ← off by default = dock mode
├────────────────────────────────┤
│ Panels                         │
│  [P] Plugins          ↗        │  ← click = switch panel
│  [S] Schedules        ↗        │
│  [G] gitee dashboard  ↗        │
├────────────────────────────────┤
│ Installed plugins · 18  ▸     │  ← collapsed by default
└────────────────────────────────┘
```

## Install

Requires DSH `>=0.2.1-rc.2 <0.3.0` (Web GUI).

```bash
dsh plugin --profile web add dsh-plugin-dock
```

Then **reload the page**; the pill appears in the bottom-right corner. You can also install it from the DSH **Add plugin** dialog (search the npm name `dsh-plugin-dock`) or from the plugin marketplace. For a local `link:` install see [docs/install.en.md](docs/install.en.md).

## Usage

| Action | Result |
| --- | --- |
| Click the pill | Expand the card |
| Drag pill / header | Move the window (clamped to the viewport) |
| Click a panel row | `layout.selectPanel(id)` switches to that panel |
| Click "←" | Back to the conversation |
| Click "—" | Collapse to the pill |
| Toggle the switch | Dock mode on / off (instant) |

Position, collapsed state and switch state are persisted in `localStorage`.

## What it touches

- Adds one entry to `shell.overlay` (the frame-wide floating layer); nothing else in the UI is modified.
- The sidebar icons are never removed: with the switch **on** nothing changes; with it **off** a single CSS rule hides that one `<nav>` (see limitations).
- No Harness client packages are imported; only `require('react')`. Styling uses `--dsw-*` theme tokens only.

Internal contracts and graceful-degradation behaviour: [docs/compat.md](docs/compat.md).

## Known limitations

1. **Dock mode depends on one CSS anchor**: `nav[class*="panelList"]{display:none!important}`. If the shell's markup changes, the rule simply matches nothing – the switch becomes a no-op and nothing breaks.
2. **Sidebar footer action buttons are not collected.** Entries in `sidebar.footer.action` are per-plugin action buttons (their click runs plugin-internal logic), not addressable panels; the slot API does not let another plugin render or trigger them.
3. Panel icons are components owned by their plugins, so panel rows use an initial-letter badge; the installed-plugins section uses the host-provided base64 icon.
4. There is no public package↔panel mapping, so the two sections are not deduplicated.
5. Visual/interaction behaviour cannot be verified automatically; `verify/smoke.mjs` covers contract and static checks only.

## Development

```bash
node verify/smoke.mjs                      # contract + slots + locale + privacy scan (no network)
node scripts/build-public-bundle.mjs       # build the public repo content into dist/public
```

## License

[MIT](LICENSE) © 2026 Yuna
