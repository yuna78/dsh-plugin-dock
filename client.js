window.__ModuleLoader__.load({
  id: 'dsh-plugin-dock',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** Client locale namespace owned by this plugin. */
    const NS = 'pluginDock';
    /** Overlay list id of the floating window. */
    const OVERLAY_ID = 'dsh-plugin-dock';
    /** Expanded window width in pixels. */
    const WIDTH = 296;
    /** Browser-persisted preferences (per browser, no Host state). */
    const STORE = {
      respect: 'dsh-plugin-dock.respect',
      collapsed: 'dsh-plugin-dock.collapsed',
      pos: 'dsh-plugin-dock.pos',
      installedOpen: 'dsh-plugin-dock.installed-open',
    };
    /** Minimum pointer travel before a press counts as a drag instead of a click. */
    const DRAG_THRESHOLD = 4;

    const zh = {
      title: '插件坞',
      expand: '展开插件坞',
      collapse: '收起',
      backToConversation: '返回对话',
      switchLabel: '保留插件自带侧栏入口',
      switchHintOn: '左栏入口按插件原样显示',
      switchHintOff: '左栏入口已隐藏，全部收在这里',
      panels: '面板入口',
      empty: '还没有插件提供左栏入口',
      entries: '{count} 个入口',
      installed: '已安装插件',
      installedHint: '点击打开插件详情页',
      loading: '读取中…',
      unavailable: '当前 Host 不支持插件清单',
      loadFailed: '插件清单读取失败',
      dragHint: '按住拖动位置',
      hasPage: '这个插件有独立页面，点击直达',
    };
    const en = {
      title: 'Plugin Dock',
      expand: 'Open Plugin Dock',
      collapse: 'Collapse',
      backToConversation: 'Back to conversation',
      switchLabel: 'Keep plugins’ own sidebar entries',
      switchHintOn: 'Sidebar entries are shown as the plugins define them',
      switchHintOff: 'Sidebar entries are hidden and collected here',
      panels: 'Panel entries',
      empty: 'No plugin provides a sidebar entry yet',
      entries: '{count} entries',
      installed: 'Installed plugins',
      installedHint: 'Click to open the plugin detail page',
      loading: 'Loading…',
      unavailable: 'This Host exposes no plugin inventory',
      loadFailed: 'Could not read the plugin inventory',
      dragHint: 'Drag to move',
      hasPage: 'This plugin has its own page; click to open it',
    };

    const CSS = [
      '[data-dsh-dock-root],[data-dsh-dock-root] *{box-sizing:border-box}',
      '[data-dsh-dock-card]{display:flex;flex-direction:column;background:var(--dsw-alias-bg-overlay,var(--dsw-alias-bg-layer-1,#fff));border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.28));border-radius:12px;box-shadow:var(--dsw-elevation-panel,0 8px 28px rgba(0,0,0,.16));overflow:hidden;color:var(--dsw-alias-label-primary,#111);font-family:var(--dsw-font-family,system-ui,sans-serif);font-size:12px}',
      '[data-dsh-dock-header]{display:flex;align-items:center;gap:6px;padding:7px 8px 7px 10px;cursor:grab;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.16))}',
      '[data-dsh-dock-header]:active{cursor:grabbing}',
      '[data-dsh-dock-title]{flex:1;min-width:0;font-size:12px;font-weight:600;letter-spacing:.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '[data-dsh-dock-glyph]{flex:0 0 auto;display:flex;align-items:center;color:var(--dsw-alias-brand-primary,#2f6fed)}',
      '[data-dsh-dock-iconbtn]{flex:0 0 auto;display:flex;align-items:center;justify-content:center;width:22px;height:22px;padding:0;border:0;border-radius:6px;background:none;color:var(--dsw-alias-label-secondary,#666);font:inherit;font-size:12px;line-height:1;cursor:pointer}',
      '[data-dsh-dock-iconbtn]:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12));color:var(--dsw-alias-label-primary,#111)}',
      '[data-dsh-dock-iconbtn]:focus-visible{outline:2px solid var(--dsw-focus-ring-color,#2f6fed);outline-offset:-1px}',
      '[data-dsh-dock-switchrow]{display:flex;align-items:center;gap:8px;padding:7px 10px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.16))}',
      '[data-dsh-dock-switchlabel]{flex:1;min-width:0;font-size:11px;line-height:15px;color:var(--dsw-alias-label-secondary,#666)}',
      '[data-dsh-dock-switch]{flex:0 0 auto;display:flex;align-items:center;padding:0;border:0;background:none;cursor:pointer}',
      '[data-dsh-dock-track]{position:relative;display:inline-block;width:26px;height:15px;border-radius:999px;background:var(--dsw-alias-border-l3,rgba(127,127,127,.4));transition:background .15s ease}',
      '[data-dsh-dock-track][data-on]{background:var(--dsw-alias-brand-primary,#2f6fed)}',
      '[data-dsh-dock-thumb]{position:absolute;top:2px;left:2px;width:11px;height:11px;border-radius:50%;background:#fff;transition:transform .15s ease}',
      '[data-dsh-dock-track][data-on] [data-dsh-dock-thumb]{transform:translateX(11px)}',
      '[data-dsh-dock-switch]:focus-visible [data-dsh-dock-track]{outline:2px solid var(--dsw-focus-ring-color,#2f6fed);outline-offset:2px}',
      '[data-dsh-dock-list]{display:flex;flex-direction:column;gap:1px;padding:4px;max-height:48vh;overflow-y:auto;overscroll-behavior:contain}',
      '[data-dsh-dock-section]{display:flex;align-items:center;gap:6px;width:100%;padding:6px 8px 3px;border:0;background:none;color:var(--dsw-alias-label-tertiary,rgba(127,127,127,.85));font:inherit;font-size:10px;font-weight:600;letter-spacing:.4px;text-transform:uppercase;cursor:pointer;border-radius:6px}',
      '[data-dsh-dock-section]:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.08))}',
      '[data-dsh-dock-section][data-static]{cursor:default}',
      '[data-dsh-dock-section][data-static]:hover{background:none}',
      '[data-dsh-dock-sectionname]{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:left}',
      '[data-dsh-dock-row]{display:flex;align-items:center;gap:8px;width:100%;padding:6px 8px;border:0;border-radius:7px;background:none;color:inherit;font:inherit;font-size:12px;text-align:left;cursor:pointer}',
      '[data-dsh-dock-row]:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.1))}',
      '[data-dsh-dock-row][data-active]{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12));font-weight:600}',
      '[data-dsh-dock-row]:focus-visible{outline:2px solid var(--dsw-focus-ring-color,#2f6fed);outline-offset:-1px}',
      '[data-dsh-dock-avatar]{flex:0 0 auto;display:flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:5px;background:var(--dsw-alias-bg-layer-2,rgba(127,127,127,.12));color:var(--dsw-alias-label-secondary,#666);font-size:10px;font-weight:600;text-transform:uppercase;overflow:hidden}',
      '[data-dsh-dock-avatar] img{display:block;width:16px;height:16px;object-fit:contain}',
      '[data-dsh-dock-name]{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '[data-dsh-dock-go]{flex:0 0 auto;font-size:11px;color:var(--dsw-alias-label-tertiary,rgba(127,127,127,.7));opacity:0;transition:opacity .12s ease}',
      '[data-dsh-dock-row]:hover [data-dsh-dock-go],[data-dsh-dock-row]:focus-visible [data-dsh-dock-go]{opacity:1}',
      '[data-dsh-dock-dot]{flex:0 0 auto;width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-state-success-primary,#2fb344)}',
      '[data-dsh-dock-dot][data-off]{background:var(--dsw-alias-state-idle-primary,rgba(127,127,127,.45))}',
      '[data-dsh-dock-note]{padding:6px 10px 8px;font-size:11px;text-align:center;color:var(--dsw-alias-label-tertiary,rgba(127,127,127,.75))}',
      '[data-dsh-dock-foot]{display:flex;justify-content:space-between;gap:8px;padding:5px 10px 7px;border-top:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.12));font-size:10.5px;color:var(--dsw-alias-label-tertiary,rgba(127,127,127,.75))}',
      '[data-dsh-dock-pill]{display:flex;align-items:center;gap:6px;height:32px;padding:0 11px 0 9px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.28));background:var(--dsw-alias-bg-overlay,var(--dsw-alias-bg-layer-1,#fff));box-shadow:var(--dsw-elevation-panel,0 4px 16px rgba(0,0,0,.14));color:var(--dsw-alias-label-primary,#111);font-family:var(--dsw-font-family,system-ui,sans-serif);font-size:12px;line-height:1;cursor:grab;user-select:none}',
      '[data-dsh-dock-pill]:active{cursor:grabbing}',
      '[data-dsh-dock-pill]:hover{background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-bg-layer-1,#fff))}',
      '[data-dsh-dock-pill]:focus-visible{outline:2px solid var(--dsw-focus-ring-color,#2f6fed);outline-offset:2px}',
      '[data-dsh-dock-pillcount]{display:inline-flex;align-items:center;justify-content:center;min-width:16px;height:16px;padding:0 4px;border-radius:999px;background:var(--dsw-alias-bg-layer-2,rgba(127,127,127,.14));color:var(--dsw-alias-label-secondary,#666);font-size:10px;font-weight:600}',
    ].join('\n');

    /**
     * Consolidation mode: hide the sidebar's own global-panel rows, because this
     * window now owns every entry. The rule targets the shell's nav wrapper
     * (`panelList`) — the only such element in the shipped sidebar. If that
     * markup ever changes the rule matches nothing and the default per-plugin
     * behavior returns; it cannot break the page.
     */
    const CONSOLIDATED_CSS = 'nav[class*="panelList"]{display:none!important}';

    function readFlag(key, fallback) {
      try {
        const raw = window.localStorage.getItem(key);
        return raw === null ? fallback : raw === '1';
      } catch (err) {
        return fallback;
      }
    }

    function writeFlag(key, value) {
      try {
        window.localStorage.setItem(key, value ? '1' : '0');
      } catch (err) {
        /* storage unavailable: preference lives for this page only */
      }
    }

    function readPos() {
      try {
        const raw = window.localStorage.getItem(STORE.pos);
        if (raw === null) return null;
        const parsed = JSON.parse(raw);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return { x: parsed.x, y: parsed.y };
        }
      } catch (err) {
        /* ignore malformed position */
      }
      return null;
    }

    function writePos(pos) {
      try {
        if (pos === null) window.localStorage.removeItem(STORE.pos);
        else window.localStorage.setItem(STORE.pos, JSON.stringify(pos));
      } catch (err) {
        /* ignore */
      }
    }

    /** Resolve the slot's label option (string or thunk) to display text. */
    function resolveLabel(label, fallback) {
      try {
        const value = typeof label === 'function' ? label() : label;
        if (typeof value === 'string' && value.trim() !== '') return value;
      } catch (err) {
        /* a throwing thunk falls back to the id, like the sidebar does */
      }
      return fallback;
    }

    /**
     * Reactive view of the entries plugins registered into `sidebar.panellist`.
     * Mirrors the sidebar's own metadata (order + resolved label) so this window
     * lists exactly the rows the shell would draw.
     */
    function createPanelStore(ctx) {
      const listeners = new Set();
      let snapshot = [];
      const read = () => {
        const seen = new Set();
        const rows = [];
        for (const entry of ctx.slots.entriesOfSlot('sidebar.panellist')) {
          const options = entry.options || {};
          const id = options.id;
          if (typeof id !== 'string' || seen.has(id)) continue;
          seen.add(id);
          rows.push({
            id,
            order: typeof options.order === 'number' ? options.order : 0,
            label: resolveLabel(options.label, id),
          });
        }
        rows.sort((a, b) => a.order - b.order);
        return rows;
      };
      const same = (a, b) =>
        a.length === b.length &&
        a.every(
          (row, index) =>
            row.id === b[index].id &&
            row.order === b[index].order &&
            row.label === b[index].label,
        );
      const sync = () => {
        const next = read();
        if (same(next, snapshot)) return;
        snapshot = next;
        for (const fn of [...listeners]) {
          try {
            fn();
          } catch (err) {
            /* one listener must not stop the others */
          }
        }
      };
      snapshot = read();
      return {
        get: () => snapshot,
        subscribe(fn) {
          listeners.add(fn);
          return () => listeners.delete(fn);
        },
        sync,
      };
    }

    function useSnapshot(store) {
      const [snapshot, setSnapshot] = React.useState(store.get);
      React.useEffect(
        () => store.subscribe(() => setSnapshot(store.get())),
        [store],
      );
      return snapshot;
    }

    function clamp(value, min, max) {
      if (max < min) return min;
      return Math.min(Math.max(value, min), max);
    }

    function initialOf(label) {
      const chars = Array.from(label || '');
      return chars.length > 0 ? chars[0] : '·';
    }

    function Glyph({ size }) {
      const edge = size || 14;
      return h(
        'svg',
        {
          width: edge,
          height: edge,
          viewBox: '0 0 16 16',
          fill: 'none',
          'aria-hidden': 'true',
          style: { display: 'block' },
        },
        h('rect', {
          x: 1.2,
          y: 1.2,
          width: 13.6,
          height: 13.6,
          rx: 3.4,
          stroke: 'currentColor',
          strokeWidth: 1.3,
        }),
        h('path', {
          d: 'M4.4 5.4h7.2M4.4 8h7.2M4.4 10.6h4.4',
          stroke: 'currentColor',
          strokeWidth: 1.3,
          strokeLinecap: 'round',
        }),
      );
    }

    function Avatar({ icon, label }) {
      const [failed, setFailed] = React.useState(null);
      if (
        typeof icon === 'string' &&
        icon !== '' &&
        failed !== icon
      ) {
        return h(
          'span',
          { 'data-dsh-dock-avatar': '' },
          h('img', {
            src: icon,
            alt: '',
            width: 16,
            height: 16,
            draggable: false,
            onError: () => setFailed(icon),
          }),
        );
      }
      return h(
        'span',
        { 'data-dsh-dock-avatar': '', 'aria-hidden': 'true' },
        initialOf(label),
      );
    }

    function Dock(props) {
      const {
        t: tRaw,
        store,
        usePanelInfo,
        selectPanel,
        openBundle,
        loadInventory,
      } = props;
      /** Defensive translator: a missing locale seat must not blank the window. */
      const t = React.useCallback(
        (key, params) => {
          if (typeof tRaw === 'function') {
            try {
              return tRaw(key, params);
            } catch (err) {
              /* fall through to the bundled dictionary */
            }
          }
          const template = zh[key] === undefined ? key : zh[key];
          return params === undefined
            ? template
            : template.replace(/\{(\w+)\}/g, (match, name) =>
                Object.prototype.hasOwnProperty.call(params, name)
                  ? String(params[name])
                  : match,
              );
        },
        [tRaw],
      );
      const panels = useSnapshot(store);
      const activeId =
        typeof usePanelInfo === 'function'
          ? usePanelInfo((info) => info.activePanelId)
          : null;
      const [collapsed, setCollapsed] = React.useState(() =>
        readFlag(STORE.collapsed, true),
      );
      const [respect, setRespect] = React.useState(() =>
        readFlag(STORE.respect, true),
      );
      const [installedOpen, setInstalledOpen] = React.useState(() =>
        readFlag(STORE.installedOpen, false),
      );
      const [pos, setPos] = React.useState(readPos);
      const [inventory, setInventory] = React.useState({
        status: 'idle',
        packages: [],
      });
      const inventoryRef = React.useRef('idle');
      const posRef = React.useRef(pos);
      posRef.current = pos;
      const dragRef = React.useRef(null);
      const movedRef = React.useRef(false);

      React.useEffect(() => writeFlag(STORE.collapsed, collapsed), [collapsed]);
      React.useEffect(() => writeFlag(STORE.respect, respect), [respect]);
      React.useEffect(
        () => writeFlag(STORE.installedOpen, installedOpen),
        [installedOpen],
      );

      React.useEffect(() => {
        if (collapsed) return undefined;
        if (
          inventoryRef.current === 'loading' ||
          inventoryRef.current === 'ready'
        ) {
          return undefined;
        }
        inventoryRef.current = 'loading';
        let cancelled = false;
        setInventory((current) =>
          current.status === 'loading' ? current : { status: 'loading', packages: [] },
        );
        Promise.resolve()
          .then(() => loadInventory())
          .then((result) => {
            if (cancelled) return;
            inventoryRef.current = result.status;
            setInventory(result);
          })
          .catch(() => {
            if (cancelled) return;
            inventoryRef.current = 'error';
            setInventory({ status: 'error', packages: [] });
          });
        return () => {
          cancelled = true;
        };
      }, [collapsed, loadInventory]);

      const startDrag = (event) => {
        if (event.button !== 0) return;
        const root = event.currentTarget.closest('[data-dsh-dock-root]');
        if (!root) return;
        const box = root.getBoundingClientRect();
        dragRef.current = {
          startX: event.clientX,
          startY: event.clientY,
          x: box.left,
          y: box.top,
          width: box.width,
          height: box.height,
        };
        movedRef.current = false;
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch (err) {
          /* capture is best effort */
        }
      };

      const moveDrag = (event) => {
        const drag = dragRef.current;
        if (!drag) return;
        const dx = event.clientX - drag.startX;
        const dy = event.clientY - drag.startY;
        if (!movedRef.current && Math.abs(dx) + Math.abs(dy) < DRAG_THRESHOLD) {
          return;
        }
        movedRef.current = true;
        const next = {
          x: clamp(drag.x + dx, 8, Math.max(8, window.innerWidth - drag.width - 8)),
          y: clamp(drag.y + dy, 8, Math.max(8, window.innerHeight - drag.height - 8)),
        };
        posRef.current = next;
        setPos(next);
      };

      const endDrag = (event) => {
        const drag = dragRef.current;
        dragRef.current = null;
        if (!drag) return;
        try {
          event.currentTarget.releasePointerCapture(event.pointerId);
        } catch (err) {
          /* capture may already be released */
        }
        if (movedRef.current) writePos(posRef.current);
      };

      const dragProps = {
        onPointerDown: startDrag,
        onPointerMove: moveDrag,
        onPointerUp: endDrag,
        onPointerCancel: endDrag,
      };

      const anchor = pos
        ? { left: pos.x, top: pos.y }
        : { right: 18, bottom: 18 };

      const switchHint = respect ? t('switchHintOn') : t('switchHintOff');

      const panelRows = panels.map((panel) =>
        h(
          'button',
          {
            key: 'panel:' + panel.id,
            type: 'button',
            'data-dsh-dock-row': '',
            'data-active': panel.id === activeId ? '' : undefined,
            'aria-current': panel.id === activeId ? 'page' : undefined,
            title: panel.label,
            onClick: () => selectPanel(panel.id),
          },
          h(Avatar, { icon: null, label: panel.label }),
          h('span', { 'data-dsh-dock-name': '' }, panel.label),
          h('span', { 'data-dsh-dock-go': '', 'aria-hidden': 'true' }, '↗'),
        ),
      );

      const installedRows = inventory.packages.map((pkg) =>
        h(
          'button',
          {
            key: 'pkg:' + pkg.name,
            type: 'button',
            'data-dsh-dock-row': '',
            title: t('installedHint'),
            onClick: () => openBundle(pkg.name),
          },
          h(Avatar, { icon: pkg.icon, label: pkg.title }),
          h('span', { 'data-dsh-dock-name': '' }, pkg.title),
          h('span', {
            'data-dsh-dock-dot': '',
            'data-off': pkg.enabled ? undefined : '',
            title: pkg.enabled ? 'enabled' : 'disabled',
            'aria-hidden': 'true',
          }),
          h('span', { 'data-dsh-dock-go': '', 'aria-hidden': 'true' }, '↗'),
        ),
      );

      const inventoryNote =
        inventory.status === 'loading'
          ? h('div', { 'data-dsh-dock-note': '' }, t('loading'))
          : inventory.status === 'unavailable'
            ? h('div', { 'data-dsh-dock-note': '' }, t('unavailable'))
            : inventory.status === 'error'
              ? h('div', { 'data-dsh-dock-note': '' }, t('loadFailed'))
              : null;

      const card = h(
        'div',
        { 'data-dsh-dock-card': '' },
        h(
          'div',
          { 'data-dsh-dock-header': '', title: t('dragHint'), ...dragProps },
          h('span', { 'data-dsh-dock-glyph': '' }, h(Glyph, { size: 14 })),
          h('span', { 'data-dsh-dock-title': '' }, t('title')),
          activeId != null
            ? h(
                'button',
                {
                  type: 'button',
                  'data-dsh-dock-iconbtn': '',
                  title: t('backToConversation'),
                  'aria-label': t('backToConversation'),
                  onClick: () => selectPanel(null),
                  onPointerDown: (event) => event.stopPropagation(),
                },
                '←',
              )
            : null,
          h(
            'button',
            {
              type: 'button',
              'data-dsh-dock-iconbtn': '',
              title: t('collapse'),
              'aria-label': t('collapse'),
              onClick: () => setCollapsed(true),
              onPointerDown: (event) => event.stopPropagation(),
            },
            '—',
          ),
        ),
        h(
          'div',
          { 'data-dsh-dock-switchrow': '' },
          h(
            'span',
            { 'data-dsh-dock-switchlabel': '', title: switchHint },
            t('switchLabel'),
          ),
          h(
            'button',
            {
              type: 'button',
              role: 'switch',
              'aria-checked': respect,
              'aria-label': t('switchLabel'),
              title: switchHint,
              'data-dsh-dock-switch': '',
              onClick: () => setRespect((value) => !value),
            },
            h(
              'span',
              {
                'data-dsh-dock-track': '',
                'data-on': respect ? '' : undefined,
                'aria-hidden': 'true',
              },
              h('span', { 'data-dsh-dock-thumb': '' }),
            ),
          ),
        ),
        h(
          'div',
          { 'data-dsh-dock-list': '', role: 'list' },
          h(
            'div',
            { 'data-dsh-dock-section': '', 'data-static': '' },
            h('span', { 'data-dsh-dock-sectionname': '' }, t('panels')),
          ),
          panels.length === 0
            ? h('div', { 'data-dsh-dock-note': '' }, t('empty'))
            : panelRows,
          h(
            'button',
            {
              type: 'button',
              'data-dsh-dock-section': '',
              'aria-expanded': installedOpen,
              title: t('installedHint'),
              onClick: () => setInstalledOpen((value) => !value),
            },
            h(
              'span',
              { 'data-dsh-dock-sectionname': '' },
              inventory.packages.length > 0
                ? t('installed') + ' · ' + String(inventory.packages.length)
                : t('installed'),
            ),
            h(
              'span',
              { 'data-dsh-dock-go': '', style: { opacity: 1 }, 'aria-hidden': 'true' },
              installedOpen ? '▾' : '▸',
            ),
          ),
          installedOpen ? installedRows : null,
          installedOpen ? inventoryNote : null,
        ),
        h(
          'div',
          { 'data-dsh-dock-foot': '' },
          h('span', null, t('entries', { count: panels.length })),
          h('span', null, switchHint),
        ),
      );

      const pill = h(
        'div',
        {
          'data-dsh-dock-pill': '',
          role: 'button',
          tabIndex: 0,
          title: t('expand'),
          'aria-label': t('expand'),
          ...dragProps,
          onClick: () => {
            if (movedRef.current) return;
            setCollapsed(false);
          },
          onKeyDown: (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setCollapsed(false);
            }
          },
        },
        h('span', { 'data-dsh-dock-glyph': '' }, h(Glyph, { size: 14 })),
        h('span', null, t('title')),
        panels.length > 0
          ? h('span', { 'data-dsh-dock-pillcount': '' }, String(panels.length))
          : null,
      );

      return h(
        'div',
        {
          'data-dsh-dock-root': '',
          style: {
            position: 'fixed',
            ...anchor,
            zIndex: collapsed ? 59 : 63,
            pointerEvents: 'auto',
            width: collapsed ? 'auto' : WIDTH,
            userSelect: 'none',
          },
        },
        h('style', {
          'data-dsh-dock-css': '',
          dangerouslySetInnerHTML: {
            __html: respect ? CSS : CSS + '\n' + CONSOLIDATED_CSS,
          },
        }),
        collapsed ? pill : card,
      );
    }

    return {
      inject: ['slots', 'layout', 'locale'],
      apply(ctx) {
        const store = createPanelStore(ctx);

        ctx.effect(
          () => ctx.locale.register(NS, { zh, en }),
          'dsh-plugin-dock: dictionaries',
        );

        ctx.effect(
          () => ctx.slots.subscribe('sidebar.panellist', () => store.sync()),
          'dsh-plugin-dock: panel entries',
        );

        ctx.effect(
          () => ctx.locale.subscribe(() => store.sync()),
          'dsh-plugin-dock: panel labels',
        );

        /** Resolve a Host service by key, tolerating both flat and nested access. */
        const readService = (key) => {
          try {
            const direct = ctx.get(key);
            if (direct !== undefined && direct !== null) return direct;
          } catch (err) {
            /* fall through to the nested lookup */
          }
          try {
            const remote = ctx.get('remote');
            if (remote === undefined || remote === null) return undefined;
            const name = String(key).startsWith('remote.')
              ? String(key).slice('remote.'.length)
              : String(key);
            return remote[name];
          } catch (err) {
            return undefined;
          }
        };

        const textOf = (text, fallback) => {
          if (text === undefined || text === null) return fallback;
          try {
            const value = ctx.locale.resolveText(text);
            if (typeof value === 'string' && value.trim() !== '') return value;
          } catch (err) {
            /* fall back to the plain string form */
          }
          return typeof text === 'string' && text.trim() !== '' ? text : fallback;
        };

        const loadInventory = async () => {
          const inventoryNs = readService('remote.pluginInventory');
          const managerNs = readService('remote.pluginManager');
          if (!inventoryNs || !managerNs) {
            return { status: 'unavailable', packages: [] };
          }
          try {
            const snapshot = await inventoryNs.list();
            if (!snapshot || snapshot.ok !== true) {
              return { status: 'error', packages: [] };
            }
            if (
              snapshot.value &&
              snapshot.value.managementAvailable !== true
            ) {
              return { status: 'unavailable', packages: [] };
            }
            const bundles = await managerNs.listBundles();
            if (!bundles || bundles.ok !== true) {
              return { status: 'error', packages: [] };
            }
            const packages = [];
            for (const bundle of bundles.value || []) {
              if (!bundle || bundle.installed !== true) continue;
              if (bundle.availability === 'missing') continue;
              const meta = bundle.meta || {};
              packages.push({
                name: bundle.name,
                title: textOf(meta.title, bundle.name),
                icon: typeof meta.icon === 'string' ? meta.icon : null,
                enabled: bundle.enabled === true,
              });
            }
            packages.sort((a, b) => a.title.localeCompare(b.title));
            return { status: 'ready', packages };
          } catch (err) {
            console.warn('[dsh-plugin-dock] inventory failed:', err);
            return { status: 'error', packages: [] };
          }
        };

        const selectPanel = (id) => {
          try {
            if (id !== null) {
              const registered = ctx.slots
                .entries('main')
                .some((entry) => entry.options && entry.options.key === id);
              if (!registered) return;
            }
            ctx.layout.selectPanel(id);
          } catch (err) {
            console.warn('[dsh-plugin-dock] selectPanel failed:', id, err);
          }
        };

        const openBundle = (packageName) => {
          const navigation = readService('pluginNavigation');
          if (navigation && typeof navigation.openBundle === 'function') {
            try {
              navigation.openBundle(packageName);
              return;
            } catch (err) {
              console.warn('[dsh-plugin-dock] openBundle failed:', err);
            }
          }
          selectPanel('plugins');
        };

        ctx.effect(
          () =>
            ctx.slots.inject('shell.overlay', () =>
              ctx.slots.register(
                {
                  name: 'shell.overlay',
                  id: OVERLAY_ID,
                  order: 90,
                  locale: NS,
                  inject: () => ({
                    store,
                    selectPanel,
                    openBundle,
                    loadInventory,
                  }),
                },
                Dock,
              ),
            ),
          'dsh-plugin-dock: floating window',
        );
      },
    };
  },
});
