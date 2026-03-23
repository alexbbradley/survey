/* ============================================================
   app.js — Gantt Chart SPA
   Vanilla JS + Tailwind CSS utility classes
   ============================================================ */

(function () {
  'use strict';

  // ============================================================
  // REUSABLE TAILWIND CLASS STRINGS
  // Defined as constants so Tailwind JIT can scan them statically
  // ============================================================
  const T = {
    // Button base
    btn:     'inline-flex items-center gap-1 rounded-md font-medium cursor-pointer border border-transparent transition-colors duration-150 whitespace-nowrap select-none no-underline leading-none',
    md:      'px-3.5 py-[7px] text-[13px]',
    sm:      'px-2.5 py-[5px] text-xs',
    primary: 'bg-green text-black hover:bg-greenlight border-green hover:bg-[#2f6db5] hover:border-[#2f6db5]',
    outline: 'bg-transparent text-[#fffbf5] border-[#484848] hover:bg-[#2e2e2e]',
    danger:  'bg-red text-white border-red hover:bg-red-700',
    // Form
    inp:     'w-full px-3 py-2 border border-[#484848] rounded-md text-[14px] text-[#fffbf5] bg-[#2a2a2a] focus:outline-none focus:border-green focus:ring-2 focus:ring-green/20 font-[inherit]',
    ta:      'w-full px-3 py-2 border border-[#484848] rounded-md text-[14px] text-[#fffbf5] bg-[#2a2a2a] focus:outline-none focus:border-green focus:ring-2 focus:ring-green/20 font-[inherit] resize-y min-h-[80px]',
    sel:     'w-full px-3 py-2 border border-[#484848] rounded-md text-[14px] text-[#fffbf5] bg-[#2a2a2a] focus:outline-none focus:border-green focus:ring-2 focus:ring-green/20 font-[inherit]',
    lbl:     'block font-semibold text-[13px] mb-[5px] text-[#fffbf5]',
    // Modal structure
    mHead:   'px-[22px] pt-[18px] pb-3.5 border-b border-[#383838] flex items-center justify-between',
    mBody:   'px-[22px] py-5',
    mFoot:   'px-[22px] py-3.5 border-t border-[#383838] flex justify-end gap-2.5',
    mErr:    'bg-red-900/40 border border-red-700 rounded-md px-3.5 py-2.5 text-red-400 text-[13px] mb-3.5',
    mClose:  'bg-transparent border-none cursor-pointer text-[22px] text-[#909090] leading-none px-1 hover:text-[#fffbf5]',
    mTitle:  'text-[17px] font-bold',
    // Badges
    adminBadge: 'inline-block bg-green text-black hover:bg-greenlight text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ml-1 align-middle',
    userBadge:  'inline-block bg-[#2a2a2a] text-[#909090] text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-[#484848] align-middle',
  };

  // ============================================================
  // CONSTANTS
  // ============================================================
  function DAY_PX()    { return state.compact ? 28 : 40; }
  function WEEK_PX()   { return state.compact ? 70 : 100; }
  function taskColW()  { return state.compact ? state.taskColWidthCompact : state.taskColWidth; }

  // 5-family × 2-shade colour palette (dark = task bars, light = section tints)
  const PALETTE = [
    { name: 'green',  dark: '#8DCCB4', light: '#74c69d' },
    { name: 'red',    dark: '#FF6D3B', light: '#f4a0a0' },
    { name: 'yellow', dark: '#F3C15F', light: '#f4d060' },
    { name: 'blue',   dark: '#4285F4', light: '#90c3f9' },
    { name: 'pink',   dark: '#EDBBBB', light: '#f4a0c8' },
    { name: 'cream',   dark: '#F5EDE2', light: '#f5f5f5' },
  ];
  const COLORS      = PALETTE.map(p => p.dark);  // task bar defaults
  const TINT_COLORS = PALETTE.map(p => p.light); // section tint defaults

  const EMOJI_MAP = [
    // Faces & people
    ['smile','😊'],['grin','😄'],['laugh','😂'],['wink','😉'],['cool','😎'],
    ['think','🤔'],['cry','😢'],['sob','😭'],['angry','😠'],['rage','😡'],
    ['sweat','😅'],['nervous','😬'],['shocked','😲'],['confused','😕'],
    ['sleepy','😴'],['sick','🤒'],['nerd','🤓'],['monocle','🧐'],['robot','🤖'],
    ['ghost','👻'],['skull','💀'],['clown','🤡'],['alien','👽'],['devil','😈'],
    ['party','🥳'],['tada','🎉'],['clap','👏'],['wave','👋'],['muscle','💪'],
    ['thumbsup','👍'],['thumbsdown','👎'],['handshake','🤝'],['ok','👌'],
    ['point','👉'],['raise','🙋'],['facepalm','🤦'],['shrug','🤷'],['bow','🙇'],
    ['pray','🙏'],['eyes','👀'],['brain','🧠'],['ear','👂'],['nose','👃'],
    // Hearts & symbols
    ['heart','❤️'],['orange_heart','🧡'],['yellow_heart','💛'],['green_heart','💚'],
    ['blue_heart','💙'],['purple_heart','💜'],['black_heart','🖤'],['broken_heart','💔'],
    ['sparkle_heart','💖'],['fire','🔥'],['star','⭐'],['sparkles','✨'],['boom','💥'],
    ['check','✅'],['x','❌'],['warning','⚠️'],['stop','🛑'],['no_entry','⛔'],
    ['100','💯'],['exclaim','❗'],['question','❓'],['zzz','💤'],['speech','💬'],
    // Nature & weather
    ['sun','☀️'],['moon','🌙'],['cloud','☁️'],['rain','🌧️'],['snow','❄️'],
    ['lightning','⚡'],['zap','⚡'],['rainbow','🌈'],['wind','🌬️'],['fog','🌫️'],
    ['earth','🌍'],['mountain','⛰️'],['tree','🌲'],['flower','🌸'],['cactus','🌵'],
    ['wave_ocean','🌊'],['island','🏝️'],['sunrise','🌅'],
    // Animals
    ['dog','🐶'],['cat','🐱'],['bear','🐻'],['fox','🦊'],['lion','🦁'],
    ['shark','🦈'],['bug','🐛'],['bee','🐝'],['butterfly','🦋'],['snake','🐍'],
    // Food & drink
    ['coffee','☕'],['pizza','🍕'],['burger','🍔'],['sushi','🍣'],['cake','🎂'],
    ['beer','🍺'],['wine','🍷'],['cocktail','🍹'],['avocado','🥑'],['taco','🌮'],
    // Objects & tools
    ['rocket','🚀'],['target','🎯'],['trophy','🏆'],['crown','👑'],['flag','🚩'],
    ['pin','📌'],['pushpin','📍'],['calendar','📅'],['chart','📊'],['up','📈'],
    ['down','📉'],['memo','📝'],['folder','🗂️'],['inbox','📥'],['outbox','📤'],
    ['key','🔑'],['lock','🔒'],['unlock','🔓'],['link','🔗'],['clip','📎'],
    ['scissors','✂️'],['wrench','🔧'],['hammer','🔨'],['axe','🪓'],['gear','⚙️'],
    ['magnet','🧲'],['microscope','🔬'],['telescope','🔭'],['bulb','💡'],
    ['battery','🔋'],['computer','💻'],['phone','📱'],['email','📧'],['printer','🖨️'],
    ['camera','📷'],['video','🎥'],['music','🎵'],['headphone','🎧'],['game','🎮'],
    ['dice','🎲'],['art','🎨'],['palette','🖌️'],['book','📚'],['newspaper','📰'],
    // Money & work
    ['money','💰'],['coin','🪙'],['credit','💳'],['chart_bar','📊'],['briefcase','💼'],
    ['office','🏢'],['home','🏠'],['hospital','🏥'],['school','🏫'],['bank','🏦'],
    // Transport
    ['car','🚗'],['bus','🚌'],['train','🚆'],['plane','✈️'],['ship','🚢'],
    ['bike','🚲'],['scooter','🛴'],['ambulance','🚑'],
    // Time & clock
    ['clock','🕐'],['hourglass','⏳'],['alarm','⏰'],['stopwatch','⏱️'],
    // Misc
    ['gift','🎁'],['balloon','🎈'],['confetti','🎊'],['medal','🥇'],['ribbon','🎀'],
    ['mail','✉️'],['package','📦'],['label','🏷️'],['ticket','🎫'],['id','🪪'],
    ['white_flag','🏳️'],['checkered','🏁'],['recycle','♻️'],['infinity','♾️'],
    ['soon','🔜'],['top','🔝'],['back','🔙'],['new','🆕'],['free','🆓'],
  ];

  // True when white text is more readable on the colour
  function isDarkColor(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  }

  // Tiny SVG tick for selected-swatch indicator
  function checkSvg(stroke) {
    return `<svg viewBox="0 0 10 10" width="8" height="8" fill="none" style="pointer-events:none"><path d="M1 5l3 3 5-5" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  // Renders a single row of colour swatches (one per family) plus a custom-colour picker.
  function buildSwatchGrid(currentColor) {
    const allPaletteColors = PALETTE.flatMap(p => [p.dark, p.light]);
    const isCustom = !allPaletteColors.includes(currentColor);

    const cells = PALETTE.map(col => {
      const c   = col.dark;
      const sel = c === currentColor;
      const shadow = sel
        ? '0 0 0 2px #fffbf5, inset 0 0 0 1px rgba(0,0,0,0.12)'
        : 'inset 0 0 0 1px rgba(255,255,255,0.10)';
      return `<div class="cursor-pointer flex items-center justify-center rounded hover:scale-110 transition-transform duration-100"
                   style="background:${c};aspect-ratio:1;box-shadow:${shadow}${sel ? ';transform:scale(1.1)' : ''}"
                   data-color="${c}" title="${col.name}">${sel ? checkSvg('#fff') : ''}</div>`;
    }).join('');

    const customBg    = isCustom ? `background:${currentColor};box-shadow:0 0 0 2px #fffbf5;border:none` : 'background:transparent;border:2px dashed #484848';
    const customInner = isCustom
      ? checkSvg(isDarkColor(currentColor) ? '#fff' : '#1a1a1a')
      : `<span style="color:#909090;font-size:15px;line-height:1;pointer-events:none">+</span>`;

    return `
      <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:4px;margin-bottom:6px" id="color-swatches">${cells}</div>
      <label id="custom-color-btn" class="inline-flex items-center gap-1.5 cursor-pointer text-[12px] text-[#909090] hover:text-[#fffbf5] mt-0.5" title="Custom colour">
        <span class="flex items-center justify-center rounded flex-shrink-0" style="width:22px;height:22px;position:relative;overflow:hidden;${customBg}">
          ${customInner}
          <input type="color" id="custom-color-input" value="${esc(currentColor)}" style="position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer">
        </span>
        Custom colour
      </label>`;
  }

  // Blend a hex colour with the dark app background at the given alpha (0–1).
  // Returns a fully-opaque hex, safe for sticky-cell backgrounds.
  function blendWithWhite(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const bg = 0x1a; // #1a1a1a
    return '#'
      + Math.round(r * alpha + bg * (1 - alpha)).toString(16).padStart(2, '0')
      + Math.round(g * alpha + bg * (1 - alpha)).toString(16).padStart(2, '0')
      + Math.round(b * alpha + bg * (1 - alpha)).toString(16).padStart(2, '0');
  }

  // Returns a Map of taskId → section colour (null if the task has no parent section).
  function buildSectionMap() {
    const sorted = [...state.tasks].sort((a, b) => a.sort_order - b.sort_order);
    const map = new Map();
    let curColor = null;
    for (const t of sorted) {
      if (t.type === 'section') {
        curColor = t.color || TINT_COLORS[0];
        map.set(t.id, curColor);
      } else {
        map.set(t.id, curColor);
      }
    }
    return map;
  }

  const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun',
                        'Jul','Aug','Sep','Oct','Nov','Dec'];

  // ============================================================
  // HEROICONS (mini 16px, fill="currentColor")
  // ============================================================
  function svg16(paths) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="13" height="13" style="display:inline;vertical-align:-1px;flex-shrink:0">${paths}</svg>`;
  }
  const ICONS = {
    plus:       svg16('<path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z"/>'),
    pencil:     svg16('<path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.262-4.262a1.75 1.75 0 0 0 0-2.474Z"/><path d="M4.75 13.25a.75.75 0 1 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z"/>'),
    users:      svg16('<path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z"/>'),
    lockClosed: svg16('<path fill-rule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 12 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z" clip-rule="evenodd"/>'),
    lockOpen:   svg16('<path d="M11.5 1A3.5 3.5 0 0 0 8 4.5V7H3.75A1.75 1.75 0 0 0 2 8.75v5.5c0 .966.784 1.75 1.75 1.75h8.5A1.75 1.75 0 0 0 14 14.25v-5.5A1.75 1.75 0 0 0 12.25 7H9.5V4.5a2 2 0 0 1 4 0V6a.75.75 0 0 0 1.5 0V4.5A3.5 3.5 0 0 0 11.5 1Z"/>'),
    logout:     svg16('<path fill-rule="evenodd" d="M2 4.75A2.75 2.75 0 0 1 4.75 2h3a.75.75 0 0 1 0 1.5h-3c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h3a.75.75 0 0 1 0 1.5h-3A2.75 2.75 0 0 1 2 11.25v-6.5Zm9.47.47a.75.75 0 0 1 1.06 0l2.25 2.25a.75.75 0 0 1 0 1.06l-2.25 2.25a.75.75 0 1 1-1.06-1.06l.97-.97H6.75a.75.75 0 0 1 0-1.5h5.69l-.97-.97a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/>'),
    compress:   svg16('<path fill-rule="evenodd" d="M14 2.75a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0 0 1.5h1.69l-3.22 3.22a.75.75 0 0 0 1.06 1.06l3.22-3.22v1.69a.75.75 0 0 0 1.5 0v-3.5ZM2.75 9a.75.75 0 0 0-.75.75v3.5a.75.75 0 0 0 .75.75h3.5a.75.75 0 0 0 0-1.5H4.56l3.22-3.22a.75.75 0 0 0-1.06-1.06L3.5 10.44V8.75A.75.75 0 0 0 2.75 9Z" clip-rule="evenodd"/>'),
    trash:      svg16('<path fill-rule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clip-rule="evenodd"/>'),
    archive:    svg16('<path d="M2 3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3ZM2 7.5h12V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.5ZM5.75 9.25a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-4.5Z"/>'),
    restore:    svg16('<path fill-rule="evenodd" d="M13.836 2.477a.75.75 0 0 1 .75.75V6.75a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1 0-1.5h2.975A5.25 5.25 0 0 0 2.75 8a.75.75 0 0 1-1.5 0A6.75 6.75 0 0 1 12.75 4.43V3.227a.75.75 0 0 1 .75-.75Zm-9.84 9.048a.75.75 0 0 1-.75-.75V9.25a.75.75 0 0 1 .75-.75h4.086a.75.75 0 0 1 0 1.5H5.107A5.25 5.25 0 0 0 13.25 8a.75.75 0 0 1 1.5 0 6.75 6.75 0 0 1-10.5 5.571v1.204a.75.75 0 0 1-.754.75Z" clip-rule="evenodd"/>'),
    copy:       svg16('<path d="M4 4.085V10.5A2.5 2.5 0 0 0 6.5 13h4.415A2.5 2.5 0 0 1 8.5 14H6.5A3.5 3.5 0 0 1 3 10.5V5.5a2.5 2.5 0 0 1 1-.415Z"/><path fill-rule="evenodd" d="M6 2.5A1.5 1.5 0 0 1 7.5 1h5A1.5 1.5 0 0 1 14 2.5v8a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 6 10.5v-8Zm1.5 0h5v8h-5v-8Z" clip-rule="evenodd"/>'),
  };

  // Returns icon SVG in normal mode; empty string in compact (icons hidden)
  function icon(svg) { return state.compact ? '' : svg; }

  // ============================================================
  // STATE
  // ============================================================
  const state = {
    page:          'home',
    chartSlug:     null,
    chart:         null,
    tasks:         [],
    charts:        [],
    binCharts:     [],
    viewingBin:    false,
    compact:       false,
    locked:        false,
    taskColWidth:        260,
    taskColWidthCompact: 180,
    isLoggedIn:    false,
    isAdmin:       false,
    email:         null,
    userId:        null,
    expandedNotes:   new Set(),
    openMenuId:      null,
    dragTaskId:      null,
    selectedTaskIds: new Set(),
    clipboard:       null,    // { action:'copy'|'cut', tasks:[...taskObjects] }
    undoStack:       [],      // max 20 entries
  };

  // ============================================================
  // DATE UTILITIES
  // ============================================================
  function parseDate(str) {
    if (!str) return null;
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function formatDate(date) {
    if (!date) return '';
    return date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0');
  }

  function today() {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  }

  function daysBetween(a, b) { return Math.round((b - a) / 86400000); }

  function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
  }

  function isoToday() { return formatDate(today()); }

  // ============================================================
  // GANTT GEOMETRY
  // ============================================================
  function pxPerDay() {
    return state.chart?.view_mode === 'day' ? DAY_PX() : (WEEK_PX() / 7);
  }

  function totalTimelineWidth() {
    if (!state.chart) return 0;
    const days = daysBetween(parseDate(state.chart.view_start), parseDate(state.chart.view_end)) + 1;
    return Math.ceil(days * pxPerDay());
  }

  function barStyle(task) {
    const vs = parseDate(state.chart.view_start);
    const ve = parseDate(state.chart.view_end);
    const ts = parseDate(task.start_date);
    const te = parseDate(task.end_date);
    if (!ts || !te || !vs || !ve) return null;

    const pp = pxPerDay();
    const left  = Math.max(0, daysBetween(vs, ts)) * pp;
    const right = Math.min((daysBetween(vs, ve) + 1) * pp, (daysBetween(vs, te) + 1) * pp);
    const width = right - left;
    if (width <= 0) return null;

    return `left:${left}px;width:${width}px;background:${task.color || COLORS[0]}`;
  }

  function launchColumnStyles() {
    const vs = parseDate(state.chart.view_start);
    const ve = parseDate(state.chart.view_end);
    if (!vs || !ve) return [];
    const pp   = pxPerDay();
    const maxW = (daysBetween(vs, ve) + 1) * pp;
    return state.tasks.filter(t => t.type === 'launch' && t.end_date)
      .map(t => {
        const te = parseDate(t.end_date);
        if (!te) return null;
        const left = daysBetween(vs, te) * pp;
        if (left < 0 || left >= maxW) return null;
        return { left, width: pp, color: t.color || COLORS[0] };
      })
      .filter(Boolean);
  }

  function weekendColumns() {
    if (!state.chart || state.chart.view_mode !== 'day') return [];
    const vs = parseDate(state.chart.view_start);
    const ve = parseDate(state.chart.view_end);
    if (!vs || !ve) return [];
    const pp   = pxPerDay();
    const cols = [];
    let cur = new Date(vs), i = 0;
    while (cur <= ve) {
      const dow = cur.getDay();
      if (dow === 0 || dow === 6) cols.push({ left: i * pp, width: pp });
      cur = addDays(cur, 1);
      i++;
    }
    return cols;
  }

  function todayLineStyle() {
    if (!state.chart) return null;
    const vs = parseDate(state.chart.view_start);
    const ve = parseDate(state.chart.view_end);
    const td = today();
    if (td < vs || td > ve) return null;
    return `left:${daysBetween(vs, td) * pxPerDay()}px`;
  }

  // ============================================================
  // UTILITIES
  // ============================================================
  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  async function api(action, method, body) {
    const opts = { method: method || 'GET', headers: {} };
    if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    const res  = await fetch(`api.php?action=${action}`, opts);
    const json = await res.json().catch(() => ({ error: 'Invalid server response' }));
    if (!res.ok) throw new Error(json.error || 'Request failed');
    return json;
  }

  // ============================================================
  // TIMELINE HEADER
  // ============================================================
  function buildTimelineHeader() {
    const vs   = parseDate(state.chart.view_start);
    const ve   = parseDate(state.chart.view_end);
    const mode = state.chart.view_mode;

    const months = [];
    const cells  = [];

    if (mode === 'day') {
      let cur = new Date(vs), monthIdx = -1, monthW = 0;
      while (cur <= ve) {
        const m = cur.getMonth(), y = cur.getFullYear();
        if (m !== monthIdx) {
          if (monthIdx !== -1) months.push({ label: MONTH_SHORT[monthIdx] + ' ' + months._y, width: monthW });
          months._y = y; monthIdx = m; monthW = 0;
        }
        const isWE = cur.getDay() === 0 || cur.getDay() === 6;
        const isTd = daysBetween(today(), cur) === 0;
        const cls  = isWE ? 'bg-[#1e1e1e] !text-[#555]' : isTd ? 'bg-amber-900/30 !text-amber-400 font-bold' : '';
        cells.push({ label: cur.getDate(), dow: cur.getDay(), cls, width: DAY_PX() });
        monthW += DAY_PX();
        cur = addDays(cur, 1);
      }
      if (monthIdx !== -1) months.push({ label: MONTH_SHORT[monthIdx] + ' ' + months._y, width: monthW });
    } else {
      let weekStart = new Date(vs);
      const dow = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - (dow === 0 ? 6 : dow - 1));

      let cur = new Date(weekStart), monthIdx = -1, monthW = 0;
      while (cur <= ve) {
        const m = cur.getMonth(), y = cur.getFullYear();
        if (m !== monthIdx) {
          if (monthIdx !== -1) months.push({ label: MONTH_SHORT[monthIdx] + ' ' + months._y, width: monthW });
          months._y = y; monthIdx = m; monthW = 0;
        }
        cells.push({ label: MONTH_SHORT[cur.getMonth()] + ' ' + cur.getDate(), cls: '', width: WEEK_PX() });
        monthW += WEEK_PX();
        cur = addDays(cur, 7);
      }
      if (monthIdx !== -1) months.push({ label: MONTH_SHORT[monthIdx] + ' ' + months._y, width: monthW });
    }

    const monthsHtml = months.map(m =>
      `<div class="flex-shrink-0 text-[11px] font-semibold text-[#909090] px-2 py-1 border-r border-[#383838] whitespace-nowrap overflow-hidden text-ellipsis" style="width:${m.width}px">${esc(m.label)}</div>`
    ).join('');

    // Week spans — day mode groups Mon→Sun; week mode one span per cell
    let weekSpans = [];
    if (mode === 'day') {
      let weekNum = 1, spanW = 0;
      cells.forEach((c, i) => {
        if (c.dow === 1 && i > 0) {
          weekSpans.push({ label: 'Wk ' + weekNum, width: spanW });
          weekNum++;
          spanW = 0;
        }
        spanW += c.width;
      });
      if (spanW > 0) weekSpans.push({ label: 'Wk ' + weekNum, width: spanW });
    } else {
      weekSpans = cells.map((c, i) => ({ label: 'Wk ' + (i + 1), width: c.width }));
    }
    const weekHtml = `<div class="flex bg-[#1a1a1a]">${weekSpans.map(w =>
      `<div class="flex-shrink-0 flex items-center px-1.5 text-[10px] text-[#666] border-r border-[#383838] h-[16px] overflow-hidden whitespace-nowrap" style="width:${w.width}px">${w.label}</div>`
    ).join('')}</div>`;

    const DOW = ['S','M','T','W','T','F','S'];
    const dowHtml = mode === 'day' ? cells.map(c =>
      `<div class="flex-shrink-0 flex items-center justify-center text-[10px] text-[#555] border-r border-[#383838] h-[16px] ${c.cls}" style="width:${c.width}px">${DOW[c.dow]}</div>`
    ).join('') : '';

    const cellsHtml = cells.map(c =>
      `<div class="flex-shrink-0 flex items-center justify-center text-[11px] text-[#909090] border-r border-[#383838] h-[22px] whitespace-nowrap ${c.cls}" style="width:${c.width}px">${c.label}</div>`
    ).join('');

    return `<div class="flex bg-[#222222] border-b border-[#383838]">${monthsHtml}</div>${weekHtml}${dowHtml ? `<div class="flex">${dowHtml}</div>` : ''}<div class="flex">${cellsHtml}</div>`;
  }

  // ============================================================
  // RENDER — HOME
  // ============================================================
  function renderHome() {
    if (!state.isLoggedIn) {
      return `
        <div class="flex flex-col h-screen overflow-hidden bg-[#1a1a1a]">
          <div class="flex-1 flex items-center justify-center">
            <div class="text-center">
              <h1 class="text-2xl font-bold mb-2">Gantt Charts</h1>
              <p class="text-[#909090] text-[14px] mb-6">Log in to access your charts.</p>
              <button class="${T.btn} ${T.md} ${T.primary}" id="btn-login-modal">${icon(ICONS.lockClosed)} Log In</button>
            </div>
          </div>
        </div>`;
    }

    const charts = state.viewingBin ? state.binCharts : state.charts;

    const listHtml = state.viewingBin
      ? (charts.length === 0
          ? `<p class="text-center py-12 text-[#909090]">Bin is empty.</p>`
          : `<div class="flex flex-col gap-2.5">${charts.map(c => `
              <div class="bg-[#222222] border border-[#383838] rounded-lg ${state.compact ? 'px-3 py-2' : 'px-[18px] py-3.5'} flex items-center justify-between gap-3">
                <div class="flex flex-col gap-[3px] min-w-0">
                  <span class="font-semibold text-[15px] text-[#909090] truncate">${esc(c.title)}</span>
                  <span class="text-xs text-white">${esc(c.view_start)} → ${esc(c.view_end)} &nbsp;·&nbsp; deleted ${esc((c.deleted_at || '').split('T')[0] || (c.deleted_at || '').split(' ')[0] || '')}</span>
                </div>
                <div class="flex gap-2 flex-shrink-0">
                  <button class="${T.btn} ${T.sm} ${T.outline}" data-restore-chart="${c.id}">${icon(ICONS.restore)} Restore</button>
                  <button class="${T.btn} ${T.sm} ${T.danger}" data-purge-chart="${c.id}">${icon(ICONS.trash)} Delete Forever</button>
                </div>
              </div>`).join('')}
            </div>`)
      : (charts.length === 0
          ? `<p class="text-center py-12 text-[#909090]">No charts yet.${state.isLoggedIn ? ' Click &ldquo;+ New Chart&rdquo; to get started.' : ' Login to create charts.'}</p>`
          : `<div class="flex flex-col gap-2.5">${charts.map(c => `
              <div class="bg-[#222222] border border-[#383838] rounded-lg ${state.compact ? 'px-3 py-2' : 'px-[18px] py-3.5'} flex items-center justify-between gap-3">
                <div class="flex flex-col gap-[3px] min-w-0">
                  <a href="?c=${esc(c.slug)}" class="font-semibold text-[15px] text-green no-underline truncate hover:underline">${esc(c.title)}</a>
                  <span class="text-xs text-white">${esc(c.view_start)} → ${esc(c.view_end)} &nbsp;·&nbsp; ${esc(c.view_mode)} view</span>
                </div>
                <div class="flex gap-2 flex-shrink-0">
                  <a href="?c=${esc(c.slug)}" class="${T.btn} ${T.sm} ${T.outline}">Open</a>
                  ${state.isLoggedIn ? `<button class="${T.btn} ${T.sm} ${T.outline}" data-rename-chart="${c.id}" title="Rename chart">${icon(ICONS.pencil)} Rename</button>` : ''}
                  ${state.isLoggedIn ? `<button class="${T.btn} ${T.sm} ${T.outline}" data-duplicate-chart="${c.id}" title="Duplicate chart">${icon(ICONS.copy)} Duplicate</button>` : ''}
                  ${state.isLoggedIn ? `<button class="${T.btn} ${T.sm} ${T.danger}" data-delete-chart="${c.id}">${icon(ICONS.trash)} Delete</button>` : ''}
                </div>
              </div>`).join('')}
            </div>`);

    return `
      <div class="flex flex-col h-screen overflow-hidden">
        <header class="min-h-[56px] bg-[#222222] border-b border-[#383838] flex items-center justify-between px-4 gap-2 py-2 flex-shrink-0 relative z-10 overflow-x-auto">
          <div class="flex items-center gap-3 min-w-0">
            <h1 class="text-lg font-bold whitespace-nowrap">Gantt Charts</h1>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <button class="${T.btn} ${T.sm} ${state.compact ? 'bg-[#2a2a2a] border-[#484848] text-[#fffbf5]' : T.outline}" id="btn-compact" title="Toggle compact view">${icon(ICONS.compress)} Compact</button>
            ${state.isLoggedIn
              ? `<span class="text-xs text-white whitespace-nowrap">${esc(state.email)}${state.isAdmin ? `<span class="${T.adminBadge}">Admin</span>` : ''}</span>
                 ${state.isAdmin ? `<button class="${T.btn} ${T.sm} ${T.outline}" id="btn-manage-users">${icon(ICONS.users)} Users</button>` : ''}
                 <button class="${T.btn} ${T.sm} ${T.outline}" id="btn-logout">${icon(ICONS.logout)} Logout</button>`
              : `<button class="${T.btn} ${T.sm} ${T.outline}" id="btn-login-modal">${icon(ICONS.lockClosed)} Login</button>`}
          </div>
        </header>
        <main class="flex-1 overflow-y-auto ${state.compact ? 'py-4 px-5' : 'py-8 px-10'}">
          <div class="max-w-3xl mx-auto">
            <div class="flex items-center justify-between mb-5">
              <div class="flex items-center gap-3">
                ${state.viewingBin
                  ? `<button class="text-green text-[13px] hover:underline bg-transparent border-none cursor-pointer p-0" id="btn-view-home">← Back to Charts</button>
                     <h2 class="text-xl font-semibold">Bin</h2>`
                  : `<h2 class="text-xl font-semibold">Your Charts</h2>`}
              </div>
              <div class="flex gap-2">
                ${state.isLoggedIn && !state.viewingBin ? `<button class="${T.btn} ${T.md} ${T.outline}" id="btn-view-bin">${icon(ICONS.archive)} Bin</button>` : ''}
                ${state.isLoggedIn && state.viewingBin && state.binCharts.length > 0 ? `<button class="${T.btn} ${T.md} ${T.danger}" id="btn-purge-bin">${icon(ICONS.trash)} Empty Bin</button>` : ''}
                ${state.isLoggedIn && !state.viewingBin ? `<button class="${T.btn} ${T.md} ${T.primary}" id="btn-create-chart">${icon(ICONS.plus)} New Chart</button>` : ''}
              </div>
            </div>
            ${listHtml}
          </div>
        </main>
      </div>`;
  }

  // ============================================================
  // RENDER — CHART PAGE
  // ============================================================
  function renderChart() {
    const ch  = state.chart;
    const tw  = totalTimelineWidth();
    const tdLine = todayLineStyle();

    const sectionMap    = buildSectionMap();
    const launchColumns = launchColumnStyles();
    const weekendCols   = weekendColumns();
    const taskRowsHtml = state.tasks.length === 0
      ? `<div class="text-center py-12 px-5 text-[14px] text-[#909090]">No tasks yet.${state.isLoggedIn ? ' Use &ldquo;+ Task&rdquo; or &ldquo;+ Section&rdquo; in the Task column header.' : ' Login to add tasks.'}</div>`
      : state.tasks.map(t => renderTaskRow(t, tw, tdLine, sectionMap.get(t.id), launchColumns, weekendCols)).join('');

    return `
      <div class="flex flex-col h-screen overflow-hidden">
        <header class="min-h-[56px] bg-[#222222] border-b border-[#383838] flex items-center justify-between px-4 gap-2 py-2 flex-shrink-0 relative z-10 overflow-x-auto">
          <div class="flex items-center gap-3.5 min-w-0">
            ${state.isLoggedIn ? `<a href="index.php" class="text-green no-underline whitespace-nowrap text-[13px] flex-shrink-0 hover:underline">← All Charts</a>` : ''}
            <h1 class="text-lg font-bold truncate max-w-[360px]">${esc(ch.title)}</h1>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <div class="flex border border-[#484848] rounded-md overflow-hidden divide-x divide-[#484848]">
              <button class="px-2.5 py-[5px] text-xs font-medium transition-colors ${ch.view_mode === 'day' ? 'bg-green text-black hover:bg-greenlight' : 'bg-[#2a2a2a] text-[#fffbf5] hover:bg-[#2e2e2e]'}" data-view="day">Day</button>
              <button class="px-2.5 py-[5px] text-xs font-medium transition-colors ${ch.view_mode === 'week' ? 'bg-green text-black hover:bg-greenlight' : 'bg-[#2a2a2a] text-[#fffbf5] hover:bg-[#2e2e2e]'}" data-view="week">Week</button>
            </div>
            <button class="${T.btn} ${T.sm} ${state.compact ? 'bg-[#2a2a2a] border-[#484848] text-[#fffbf5]' : T.outline}" id="btn-compact" title="Toggle compact view">${icon(ICONS.compress)} Compact</button>
            ${state.isLoggedIn ? `
              <button class="${T.btn} ${T.sm} ${state.locked ? 'bg-amber-100 border-amber-400 text-amber-700' : T.outline}" id="btn-lock" title="${state.locked ? 'Unlock drag &amp; resize' : 'Lock drag &amp; resize'}">${state.locked ? ICONS.lockClosed : icon(ICONS.lockOpen)} ${state.locked ? 'Locked' : 'Lock'}</button>
              <button class="${T.btn} ${T.sm} ${T.outline}" id="btn-edit-chart">${icon(ICONS.pencil)} Edit Chart</button>
              ${state.isAdmin ? `<button class="${T.btn} ${T.sm} ${T.outline}" id="btn-manage-users">${icon(ICONS.users)} Users</button>` : ''}
              <span class="text-xs text-white">${esc(state.email)}${state.isAdmin ? `<span class="${T.adminBadge}">Admin</span>` : ''}</span>
              <button class="${T.btn} ${T.sm} ${T.outline}" id="btn-logout">${icon(ICONS.logout)} Logout</button>
            ` : `
              <button class="${T.btn} ${T.sm} ${T.outline}" id="btn-login-modal">${icon(ICONS.lockClosed)} Login to Edit</button>
            `}
          </div>
        </header>

        <div class="flex-1 overflow-auto bg-[#1a1a1a] gantt-scroll" id="ganttScroll">
          <div class="inline-block min-w-full" style="min-width:calc(${taskColW()}px + ${tw}px)">

            <div class="flex sticky top-0 z-30 bg-[#222222] border-b-2 border-[#383838] select-none">
              <div class="flex-shrink-0 sticky left-0 z-[31] relative px-3 font-semibold text-[11px] uppercase tracking-wider text-[#909090] flex items-center justify-between bg-[#222222] border-r border-[#383838]" style="width:${taskColW()}px;min-width:${taskColW()}px" data-task-col>
                <span class="self-end pb-1.5">Task</span>
                ${state.isLoggedIn ? `<div class="flex gap-1 flex-shrink-0 pb-1"><button class="${T.btn} ${T.sm} ${T.primary}" id="btn-add-task">${icon(ICONS.plus)} Task</button><button class="${T.btn} ${T.sm} ${T.outline}" id="btn-add-section">${icon(ICONS.plus)} Section</button></div>` : ''}
                <div class="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-green/30 z-[32]" data-col-resize></div>
              </div>
              <div class="relative" id="timelineHeaderWrap" style="width:${tw}px">
                <div class="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize z-[40] hover:bg-green/30" data-view-resize="left" title="Drag to change start date"></div>
                <div class="flex flex-col overflow-hidden" id="timelineHeader">
                  ${buildTimelineHeader()}
                </div>
                <div class="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-[40] hover:bg-green/30" data-view-resize="right" title="Drag to change end date"></div>
              </div>
            </div>

            <div id="ganttBody">
              ${taskRowsHtml}
            </div>

          </div>
        </div>
      </div>`;
  }

  function renderTaskRow(task, tw, tdLine, sectionColor, launchColumns = [], weekendCols = []) {
    const isSec    = task.type === 'section';
    const expanded = state.expandedNotes.has(task.id);
    const bs       = barStyle(task);
    const isMenuOpen = state.openMenuId === task.id;

    // All rows get `group` so kebab fades in on hover
    const rh = state.compact ? 'min-h-[30px]' : 'min-h-[44px]';
    const rowCls = `group flex border-b border-[#383838] ${rh}`;

    // Tint background for the sticky task-column cell (fully opaque so sticky masking works)
    const tintSrc = isSec
      ? (task.color || TINT_COLORS[0])
      : (sectionColor || task.color || COLORS[0]);
    const tintBg     = isSec ? (task.color || TINT_COLORS[0]) : blendWithWhite(tintSrc, 0.25);
    const secTimelineBg = isSec ? blendWithWhite(task.color || TINT_COLORS[0], 0.30) : null;
    const barLabel   = !isSec
      ? (task.start_date === task.end_date
        ? '<span class="pointer-events-none text-[12px] flex-1 text-center">📌</span>'
        : `<span class="text-[11px] whitespace-nowrap overflow-hidden text-ellipsis pointer-events-none font-medium px-4 flex-1 min-w-0" style="color:${isDarkColor(task.color || COLORS[0]) ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.70)'}">${esc(task.title)}</span>`)
      : '';

    const labelCls = `flex-shrink-0 sticky left-0 z-10 border-r border-[#383838] flex items-stretch`;

    const tlCls = isSec
      ? 'relative flex-shrink-0'
      : 'relative flex-shrink-0 group-hover:bg-[#242424]';

    // Colour dot
    const colorDot = !isSec
      ? `<span class="flex-shrink-0 rounded-full inline-block" style="width:8px;height:8px;background:${esc(task.color || COLORS[0])}" aria-hidden="true"></span>`
      : '';

    const isSelected = state.selectedTaskIds.has(task.id);
    const isCut      = state.clipboard?.action === 'cut' && state.clipboard.tasks.some(t => t.id === task.id);
    const rowStyle   = `${isSelected ? 'outline:3px solid #4A90E2;outline-offset:-3px;background:rgba(74,144,226,0.10);' : ''}${isCut ? 'opacity:0.45;' : ''}`;

    return `
      <div class="${rowCls}" data-task-id="${task.id}" draggable="${state.isLoggedIn && !state.locked ? 'true' : 'false'}" style="${rowStyle}">
        <div class="${labelCls}" style="width:${taskColW()}px;min-width:${taskColW()}px;background-color:${tintBg}" data-task-col>
          <div class="flex flex-col w-full px-2.5 pl-1 justify-center ${state.compact ? 'min-h-[30px]' : 'min-h-[44px]'} relative">
            <div class="flex items-center gap-1.5 ${state.compact ? 'min-h-[30px]' : 'min-h-[44px]'}">
              ${state.isLoggedIn ? `
                <div class="relative flex-shrink-0">
                  <button class="kebab-btn opacity-0 group-hover:opacity-100 bg-transparent border-none cursor-pointer text-[#909090] text-base leading-none px-[5px] py-1 rounded hover:bg-white/10 hover:text-[#fffbf5] transition-opacity duration-100" data-menu="${task.id}" title="Options">⋮</button>
                  <div class="${isMenuOpen ? 'block' : 'hidden'} absolute left-0 top-full bg-[#2a2a2a] border border-[#484848] rounded-md shadow-xl z-[200] min-w-[160px] overflow-hidden" id="menu-${task.id}">
                    ${isSec ? `
                      <button class="block w-full text-left px-3.5 py-[9px] bg-transparent border-none cursor-pointer text-[13px] text-[#fffbf5] hover:bg-[#383838]" data-action="edit-section" data-id="${task.id}">Edit Section</button>
                      <button class="block w-full text-left px-3.5 py-[9px] bg-transparent border-none cursor-pointer text-[13px] text-[#fffbf5] hover:bg-[#383838]" data-action="duplicate-task" data-id="${task.id}">Duplicate Section</button>
                      <button class="block w-full text-left px-3.5 py-[9px] bg-transparent border-none cursor-pointer text-[13px] text-red-400 hover:bg-red-900/30" data-action="delete-task" data-id="${task.id}">Delete Section</button>
                    ` : `
                      <button class="block w-full text-left px-3.5 py-[9px] bg-transparent border-none cursor-pointer text-[13px] text-[#fffbf5] hover:bg-[#383838]" data-action="edit-task" data-id="${task.id}">Edit Task</button>
                      <button class="block w-full text-left px-3.5 py-[9px] bg-transparent border-none cursor-pointer text-[13px] text-[#fffbf5] hover:bg-[#383838]" data-action="edit-dates" data-id="${task.id}">Edit Dates</button>
                      <button class="block w-full text-left px-3.5 py-[9px] bg-transparent border-none cursor-pointer text-[13px] text-[#fffbf5] hover:bg-[#383838]" data-action="change-color" data-id="${task.id}">Change Color</button>
                      <button class="block w-full text-left px-3.5 py-[9px] bg-transparent border-none cursor-pointer text-[13px] text-[#fffbf5] hover:bg-[#383838]" data-action="duplicate-task" data-id="${task.id}">Duplicate Task</button>
                      <button class="block w-full text-left px-3.5 py-[9px] bg-transparent border-none cursor-pointer text-[13px] text-red-400 hover:bg-red-900/30" data-action="delete-task" data-id="${task.id}">Delete Task</button>
                    `}
                  </div>
                </div>` : ''}
              ${colorDot}
              <span class="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] ${isSec ? 'font-bold' : ''}" ${isSec ? `style="color:${isDarkColor(task.color || TINT_COLORS[0]) ? '#fff' : '#1a1a1a'}"` : ''}>${esc(task.title)}</span>
              ${!isSec && task.note ? `
                <button class="flex-shrink-0 bg-transparent border-none cursor-pointer text-[#909090] text-[10px] px-1 py-0.5 rounded hover:bg-white/10 hover:text-[#fffbf5]" data-toggle-note="${task.id}" title="${expanded ? 'Hide note' : 'Show note'}">${expanded ? '▲' : '▼'}</button>
              ` : ''}
            </div>
            ${!isSec && task.note && expanded ? `
              <div class="text-xs text-white leading-relaxed py-1 pb-2 pl-[30px] whitespace-pre-wrap break-words">${esc(task.note)}</div>
            ` : ''}
          </div>
        </div>
        <div class="${tlCls}" style="${isSec ? `width:${tw}px;background:${secTimelineBg}` : `width:${tw}px`}">
          ${weekendCols.map(c => `<div class="absolute top-0 bottom-0 z-[1] pointer-events-none" style="left:${c.left}px;width:${c.width}px;background:rgba(255,255,255,0.06)"></div>`).join('')}
          ${tdLine ? `<div class="absolute top-0 bottom-0 w-0.5 bg-amber-400 opacity-70 z-[5] pointer-events-none" style="${tdLine}"></div>` : ''}
          ${launchColumns.map(c => `<div class="absolute top-0 bottom-0 z-[4] pointer-events-none" style="left:${c.left}px;width:${c.width}px;background:${c.color};opacity:0.40"></div>`).join('')}
          ${bs ? (isSec
            ? `<div class="absolute top-[5px] bottom-[5px] rounded-[4px] cursor-grab" style="${bs}" data-bar-id="${task.id}"><div class="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize z-10" data-resize-edge="left" data-resize-id="${task.id}"></div><div class="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-10" data-resize-edge="right" data-resize-id="${task.id}"></div></div>`
            : `<div class="absolute ${state.compact ? 'top-1 h-[18px]' : 'top-2 h-[26px]'} rounded-[5px] cursor-grab flex items-center overflow-hidden min-w-1 opacity-90 hover:opacity-100 transition-all duration-150" draggable="false" style="${bs}" data-bar-id="${task.id}"><div class="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize z-10" data-resize-edge="left" data-resize-id="${task.id}"></div>${barLabel}<div class="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-10" data-resize-edge="right" data-resize-id="${task.id}"></div></div>`
          ) : ''}
        </div>
      </div>`;
  }

  // ============================================================
  // MODAL HTML BUILDERS
  // ============================================================
  function modalLoginHtml(lockedMinutes) {
    const locked = !!lockedMinutes;
    return `
      <div class="${T.mHead}">
        <h2 class="${T.mTitle}">Login</h2>
        <button class="${T.mClose}" id="modal-close-btn">×</button>
      </div>
      <form id="modal-form" autocomplete="on">
        <div class="${T.mBody}">
          <div id="modal-err" class="${T.mErr}"${locked ? '' : ' style="display:none"'}>${locked ? `Too many failed attempts. Please wait ${lockedMinutes} minute(s) before trying again.` : ''}</div>
          <div class="mb-4">
            <label class="${T.lbl}" for="f-email">Email</label>
            <input class="${T.inp}" type="email" id="f-email" name="email" autofocus required autocomplete="email"${locked ? ' disabled' : ''}>
          </div>
          <div class="mb-1">
            <label class="${T.lbl}" for="f-password">Password</label>
            <input class="${T.inp}" type="password" id="f-password" name="password" required autocomplete="current-password"${locked ? ' disabled' : ''}>
          </div>
          <div class="text-right mt-1 mb-0">
            <button type="button" class="text-[12px] text-green bg-transparent border-none cursor-pointer hover:underline p-0" id="btn-forgot-pw">Forgot password?</button>
          </div>
        </div>
        <div class="${T.mFoot}">
          <button type="button" class="${T.btn} ${T.md} ${T.outline}" id="modal-close-btn2">Cancel</button>
          <button type="submit" class="${T.btn} ${T.md} ${T.primary}"${locked ? ' disabled' : ''}>Login</button>
        </div>
      </form>`;
  }

  function modalTaskHtml(task, focusDates) {
    const isNew        = !task;
    const currentColor = task?.color || COLORS[0];

    return `
      <div class="${T.mHead}">
        <h2 class="${T.mTitle}">${isNew ? 'Add Task' : 'Edit Task'}</h2>
        <button class="${T.mClose}" id="modal-close-btn">×</button>
      </div>
      <form id="modal-form">
        <div class="${T.mBody}">
          <div id="modal-err" class="${T.mErr}" style="display:none"></div>
          <div class="mb-4">
            <label class="${T.lbl}" for="f-title">Title</label>
            <input class="${T.inp}" type="text" id="f-title" value="${esc(task?.title || '')}" required${focusDates ? '' : ' autofocus'}>
          </div>
          <div class="mb-4">
            <label class="${T.lbl}" for="f-note">Note <span class="font-normal text-[#909090]">(optional)</span></label>
            <textarea class="${T.ta}" id="f-note">${esc(task?.note || '')}</textarea>
          </div>
          <div class="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label class="${T.lbl}" for="f-start">Start Date</label>
              <input class="${T.inp}" type="date" id="f-start" value="${esc(task?.start_date || (state.chart.view_start > isoToday() ? state.chart.view_start : isoToday()))}" min="${esc(state.chart.view_start)}" max="${esc(state.chart.view_end)}"${focusDates ? ' autofocus' : ''}>
            </div>
            <div>
              <label class="${T.lbl}" for="f-end">End Date</label>
              <input class="${T.inp}" type="date" id="f-end" value="${esc(task?.end_date || (state.chart.view_start > isoToday() ? state.chart.view_start : isoToday()))}" min="${esc(state.chart.view_start)}" max="${esc(state.chart.view_end)}">
            </div>
          </div>
          <div class="mb-4">
            <label class="${T.lbl}">Colour</label>
            ${buildSwatchGrid(currentColor)}
            <input type="hidden" id="f-color" value="${esc(currentColor)}">
          </div>
          <div class="flex items-center gap-2.5">
            <input type="checkbox" id="f-launch" class="w-4 h-4 cursor-pointer accent-green flex-shrink-0"${task?.type === 'launch' ? ' checked' : ''}>
            <label class="text-[13px] text-[#fffbf5] cursor-pointer select-none" for="f-launch">Full height column on end date</label>
          </div>
        </div>
        <div class="${T.mFoot}">
          <button type="button" class="${T.btn} ${T.md} ${T.outline}" id="modal-close-btn2">Cancel</button>
          ${isNew ? `<button type="button" class="${T.btn} ${T.md} ${T.outline}" id="modal-save-add-btn">Save &amp; Add Another</button>` : ''}
          <button type="submit" class="${T.btn} ${T.md} ${T.primary}">${isNew ? 'Save Task' : 'Save Changes'}</button>
        </div>
      </form>`;
  }

  function modalSectionHtml(task) {
    const isNew        = !task;
    const currentColor = task?.color || TINT_COLORS[0];
    return `
      <div class="${T.mHead}">
        <h2 class="${T.mTitle}">${isNew ? 'Add Section' : 'Edit Section'}</h2>
        <button class="${T.mClose}" id="modal-close-btn">×</button>
      </div>
      <form id="modal-form">
        <div class="${T.mBody}">
          <div id="modal-err" class="${T.mErr}" style="display:none"></div>
          <div class="mb-4">
            <label class="${T.lbl}" for="f-title">Section Title</label>
            <input class="${T.inp}" type="text" id="f-title" value="${esc(task?.title || '')}" required autofocus>
          </div>
          <div class="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label class="${T.lbl}" for="f-start">Start Date</label>
              <input class="${T.inp}" type="date" id="f-start" value="${esc(task?.start_date || (state.chart.view_start > isoToday() ? state.chart.view_start : isoToday()))}" min="${esc(state.chart.view_start)}" max="${esc(state.chart.view_end)}">
            </div>
            <div>
              <label class="${T.lbl}" for="f-end">End Date</label>
              <input class="${T.inp}" type="date" id="f-end" value="${esc(task?.end_date || (state.chart.view_start > isoToday() ? state.chart.view_start : isoToday()))}" min="${esc(state.chart.view_start)}" max="${esc(state.chart.view_end)}">
            </div>
          </div>
          <div class="mb-0">
            <label class="${T.lbl}">Colour</label>
            ${buildSwatchGrid(currentColor)}
            <input type="hidden" id="f-color" value="${esc(currentColor)}">
          </div>
        </div>
        <div class="${T.mFoot}">
          <button type="button" class="${T.btn} ${T.md} ${T.outline}" id="modal-close-btn2">Cancel</button>
          <button type="submit" class="${T.btn} ${T.md} ${T.primary}">${isNew ? 'Add Section' : 'Save Changes'}</button>
        </div>
      </form>`;
  }

  function modalChartHtml(chart) {
    const isNew    = !chart;
    const defStart = chart?.view_start || isoToday();
    const defEnd   = chart?.view_end   || formatDate(addDays(today(), 30));
    return `
      <div class="${T.mHead}">
        <h2 class="${T.mTitle}">${isNew ? 'New Chart' : 'Edit Chart'}</h2>
        <button class="${T.mClose}" id="modal-close-btn">×</button>
      </div>
      <form id="modal-form">
        <div class="${T.mBody}">
          <div id="modal-err" class="${T.mErr}" style="display:none"></div>
          <div class="mb-4">
            <label class="${T.lbl}" for="f-title">Chart Title</label>
            <input class="${T.inp}" type="text" id="f-title" value="${esc(chart?.title || '')}" required autofocus>
          </div>
          ${isNew ? `
          <div class="mb-4">
            <label class="${T.lbl}" for="f-slug">Custom URL <span class="font-normal text-[#909090]">(optional — lowercase letters, numbers, hyphens)</span></label>
            <input class="${T.inp}" type="text" id="f-slug" placeholder="e.g. my-project-2025" minlength="2" maxlength="60" autocomplete="off">
          </div>` : ''}
          <div class="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label class="${T.lbl}" for="f-start">View Start</label>
              <input class="${T.inp}" type="date" id="f-start" value="${esc(defStart)}" required>
            </div>
            <div>
              <label class="${T.lbl}" for="f-end">View End</label>
              <input class="${T.inp}" type="date" id="f-end" value="${esc(defEnd)}" required>
            </div>
          </div>
          <div class="mb-0">
            <label class="${T.lbl}" for="f-mode">Default View</label>
            <select class="${T.sel}" id="f-mode">
              <option value="week"${(chart?.view_mode||'week')==='week' ? ' selected':''}>Week</option>
              <option value="day"${chart?.view_mode==='day' ? ' selected':''}>Day</option>
            </select>
          </div>
        </div>
        <div class="${T.mFoot}">
          <button type="button" class="${T.btn} ${T.md} ${T.outline}" id="modal-close-btn2">Cancel</button>
          <button type="submit" class="${T.btn} ${T.md} ${T.primary}">${isNew ? 'Create Chart' : 'Save Changes'}</button>
        </div>
      </form>`;
  }

  // ============================================================
  // MODAL SYSTEM
  // ============================================================
  function openModal(html, onSubmit) {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    content.innerHTML = html;
    overlay.classList.remove('hidden');

    const close = () => closeModal();
    document.getElementById('modal-close-btn')?.addEventListener('click', close);
    document.getElementById('modal-close-btn2')?.addEventListener('click', close);
    overlay.addEventListener('click', e => {
      if (e.target !== overlay) return;
      const titleInput = document.getElementById('f-title');
      if (titleInput && titleInput.value.trim() !== '') return;
      close();
    });

    function selectSwatch(el) {
      document.querySelectorAll('#color-swatches [data-color]').forEach(s => {
        s.style.boxShadow = 'inset 0 0 0 1px rgba(255,255,255,0.10)';
        s.style.transform = '';
        s.innerHTML = '';
      });
      el.style.boxShadow = '0 0 0 2px #fffbf5, inset 0 0 0 1px rgba(0,0,0,0.12)';
      el.style.transform = 'scale(1.1)';
      const c = el.dataset.color;
      el.innerHTML = checkSvg(isDarkColor(c) ? '#fff' : '#1a1a1a');
      document.getElementById('f-color').value = c;
    }

    document.querySelectorAll('[data-color]').forEach(sw => {
      sw.addEventListener('click', () => selectSwatch(sw));
    });

    document.getElementById('custom-color-input')?.addEventListener('change', e => {
      const c = e.target.value;
      const existing = document.querySelector(`#color-swatches [data-color="${CSS.escape(c)}"]`);
      if (existing) {
        selectSwatch(existing);
      } else {
        // Clear all preset selections
        document.querySelectorAll('#color-swatches [data-color]').forEach(s => {
          s.style.boxShadow = ''; s.style.transform = ''; s.innerHTML = '';
        });
        // Style the custom btn as the selected swatch
        const customSpan = document.querySelector('#custom-color-btn > span');
        if (customSpan) {
          const inp = customSpan.querySelector('input');
          customSpan.style.cssText = `width:22px;height:22px;position:relative;overflow:hidden;border-radius:4px;flex-shrink:0;background:${c};box-shadow:0 0 0 2px #fffbf5;border:none;display:flex;align-items:center;justify-content:center`;
          customSpan.innerHTML = checkSvg(isDarkColor(c) ? '#fff' : '#1a1a1a');
          if (inp) customSpan.appendChild(inp);
        }
        document.getElementById('f-color').value = c;
      }
    });

    initEmojiPicker();

    const form = document.getElementById('modal-form');
    if (form && onSubmit) form.addEventListener('submit', async e => { e.preventDefault(); await onSubmit(); });
  }

  function initEmojiPicker() {
    ['f-title', 'f-note'].forEach(fieldId => {
      const el = document.getElementById(fieldId);
      if (!el) return;
      let picker = null;

      const hidePicker = () => { if (picker) { picker.remove(); picker = null; } };

      el.addEventListener('input', () => {
        const val = el.value;
        const pos = el.selectionStart;
        const before = val.slice(0, pos);
        const match = before.match(/:([a-z0-9_]+)$/);
        if (!match) { hidePicker(); return; }
        const query = match[1];
        const results = EMOJI_MAP.filter(([name]) => name.startsWith(query)).slice(0, 10);
        if (!results.length) { hidePicker(); return; }

        if (!picker) {
          picker = document.createElement('div');
          picker.className = 'fixed z-[700] bg-[#2a2a2a] border border-[#484848] rounded-md shadow-xl flex flex-wrap gap-0.5 p-1.5';
          document.body.appendChild(picker);
        }
        const rect = el.getBoundingClientRect();
        picker.style.top  = (rect.bottom + 4) + 'px';
        picker.style.left = rect.left + 'px';

        picker.innerHTML = results.map(([name, emoji]) =>
          `<button type="button" title=":${name}:" data-emoji="${emoji}" data-matchlen="${match[0].length}" class="text-xl leading-none p-1 rounded hover:bg-white/10 bg-transparent border-none cursor-pointer">${emoji}</button>`
        ).join('');

        picker.querySelectorAll('[data-emoji]').forEach(btn => {
          btn.addEventListener('mousedown', e => {
            e.preventDefault();
            const colonStart = pos - parseInt(btn.dataset.matchlen);
            el.value = val.slice(0, colonStart) + btn.dataset.emoji + val.slice(pos);
            el.dispatchEvent(new Event('input'));
            hidePicker();
            el.focus();
          });
        });
      });

      el.addEventListener('keydown', e => { if (e.key === 'Escape') hidePicker(); });
      el.addEventListener('blur', () => setTimeout(hidePicker, 150));
    });
  }

  function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById('modal-content').innerHTML = '';
  }

  function showModalError(msg) {
    const el = document.getElementById('modal-err');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  }

  // ============================================================
  // TOAST
  // ============================================================
  function toast(msg, type) {
    const tc = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast pointer-events-auto text-[13px] px-4 py-2.5 rounded-lg shadow-xl max-w-xs ${
      type === 'error' ? 'bg-red text-white' :
      type === 'success' ? 'bg-green text-black hover:bg-greenlight' :
      'bg-gray-900 text-white'
    }`;
    el.textContent = msg;
    tc.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  // ============================================================
  // ACTIONS — AUTH
  // ============================================================
  async function doLogin(email, password) {
    const res = await api('login', 'POST', { email, password });
    state.isLoggedIn = true;
    state.isAdmin    = !!res.is_admin;
    state.email      = res.email;
    state.userId     = res.user_id || null;
    if (state.page === 'home') {
      try { state.charts = await api('list_charts'); } catch (_) {}
    }
    toast('Logged in as ' + res.email, 'success');
    closeModal();
    rerenderApp();
  }

  async function doLogout() {
    await api('logout', 'POST');
    state.isLoggedIn = false;
    state.isAdmin    = false;
    state.email      = null;
    state.userId     = null;
    toast('Logged out');
    rerenderApp();
  }

  // ============================================================
  // ACTIONS — VIEW MODE
  // ============================================================
  async function setViewMode(mode) {
    if (!state.chart || state.chart.view_mode === mode) return;
    state.chart.view_mode = mode;
    if (state.isLoggedIn) {
      await api('update_chart', 'POST', {
        id: state.chart.id, title: state.chart.title,
        view_start: state.chart.view_start, view_end: state.chart.view_end, view_mode: mode,
      });
    }
    rerenderApp();
  }

  // ============================================================
  // ACTIONS — CHARTS
  // ============================================================
  function promptCreateChart() {
    openModal(modalChartHtml(null), async () => {
      const title = document.getElementById('f-title').value.trim();
      const start = document.getElementById('f-start').value;
      const end   = document.getElementById('f-end').value;
      const mode  = document.getElementById('f-mode').value;
      const slug  = (document.getElementById('f-slug')?.value || '').trim().toLowerCase();
      if (!title || !start || !end) { showModalError('All fields are required.'); return; }
      if (start >= end) { showModalError('Start date must be before end date.'); return; }
      try {
        const res = await api('create_chart', 'POST', { title, view_start: start, view_end: end, view_mode: mode, slug });
        window.location.href = '?c=' + res.slug;
      } catch (err) { showModalError(err.message); }
    });
  }

  function promptEditChart() {
    openModal(modalChartHtml(state.chart), async () => {
      const title = document.getElementById('f-title').value.trim();
      const start = document.getElementById('f-start').value;
      const end   = document.getElementById('f-end').value;
      const mode  = document.getElementById('f-mode').value;
      if (!title || !start || !end) { showModalError('All fields are required.'); return; }
      if (start >= end) { showModalError('Start date must be before end date.'); return; }
      try {
        await api('update_chart', 'POST', { id: state.chart.id, title, view_start: start, view_end: end, view_mode: mode });
        state.chart = { ...state.chart, title, view_start: start, view_end: end, view_mode: mode };
        closeModal(); toast('Chart updated', 'success'); rerenderApp();
      } catch (err) { showModalError(err.message); }
    });
  }

  function promptRenameChart(id) {
    const chart = state.charts.find(c => c.id === id);
    if (!chart) return;
    openModal(`
      <form id="modal-form" class="px-5 pt-5 pb-4">
        <h2 class="text-base font-semibold mb-4">Rename Chart</h2>
        <div id="modal-err" class="text-red text-[12px] mb-2" style="display:none"></div>
        <div class="flex flex-col gap-3">
          <div>
            <label class="block text-[12px] text-[#909090] mb-1" for="f-title">Title</label>
            <input id="f-title" class="w-full bg-[#2a2a2a] border border-[#484848] rounded-md px-3 py-2 text-[13px] text-[#fffbf5] focus:outline-none focus:border-green" value="${esc(chart.title)}">
          </div>
          <div>
            <label class="block text-[12px] text-[#909090] mb-1" for="f-slug">URL slug</label>
            <input id="f-slug" class="w-full bg-[#2a2a2a] border border-[#484848] rounded-md px-3 py-2 text-[13px] text-[#fffbf5] focus:outline-none focus:border-green font-mono" value="${esc(chart.slug)}" placeholder="my-chart-name">
            <p class="text-[11px] text-[#606060] mt-1">Lowercase letters, numbers, hyphens. 2–60 chars.</p>
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-5">
          <button type="button" class="${T.btn} ${T.sm} ${T.outline}" id="modal-close-btn2">Cancel</button>
          <button type="submit" class="${T.btn} ${T.sm} ${T.primary}">Save</button>
        </div>
      </form>`, async () => {
        const title = document.getElementById('f-title').value.trim();
        const slug  = document.getElementById('f-slug').value.trim().toLowerCase();
        if (!title) { showModalError('Title is required.'); return; }
        if (!/^[a-z0-9][a-z0-9\-]{0,58}[a-z0-9]$/.test(slug) && !/^[a-z0-9]{2,60}$/.test(slug)) {
          showModalError('Slug may only contain lowercase letters, numbers, and hyphens (2–60 chars).'); return;
        }
        try {
          const res = await api('rename_chart', 'POST', { id, title, slug });
          const idx = state.charts.findIndex(c => c.id === id);
          if (idx !== -1) { state.charts[idx].title = title; state.charts[idx].slug = res.slug; }
          closeModal(); toast('Chart renamed', 'success'); rerenderApp();
        } catch (err) { showModalError(err.message); }
      });
    setTimeout(() => document.getElementById('f-title')?.select(), 50);
  }

  async function duplicateChart(id) {
    try {
      const res = await api('duplicate_chart', 'POST', { id });
      state.charts.unshift(res.chart);
      rerenderApp();
      toast('Chart duplicated', 'success');
    } catch (err) { toast(err.message, 'error'); }
  }

  async function deleteChart(id) {
    if (!confirm('Move this chart to the bin?')) return;
    try {
      await api('delete_chart', 'POST', { id });
      const idx = state.charts.findIndex(c => c.id === id);
      if (idx !== -1) {
        const [removed] = state.charts.splice(idx, 1);
        removed.deleted_at = new Date().toISOString();
        state.binCharts.unshift(removed);
      }
      toast('Chart moved to bin'); rerenderApp();
    } catch (err) { toast(err.message, 'error'); }
  }

  async function viewBin() {
    try {
      state.binCharts  = await api('list_bin');
      state.viewingBin = true;
      rerenderApp();
    } catch (err) { toast(err.message, 'error'); }
  }

  function viewHome() {
    state.viewingBin = false;
    rerenderApp();
  }

  async function restoreChart(id) {
    try {
      await api('restore_chart', 'POST', { id });
      const idx = state.binCharts.findIndex(c => c.id === id);
      if (idx !== -1) {
        const [restored] = state.binCharts.splice(idx, 1);
        delete restored.deleted_at;
        state.charts.unshift(restored);
      }
      toast('Chart restored', 'success'); rerenderApp();
    } catch (err) { toast(err.message, 'error'); }
  }

  async function purgeChart(id) {
    const chart = state.binCharts.find(c => c.id === id);
    if (!confirm(`Permanently delete "${chart?.title}"? This cannot be undone.`)) return;
    try {
      await api('purge_chart', 'POST', { id });
      state.binCharts = state.binCharts.filter(c => c.id !== id);
      toast('Permanently deleted'); rerenderApp();
    } catch (err) { toast(err.message, 'error'); }
  }

  async function purgeBin() {
    if (!confirm('Empty the bin? All deleted charts and their tasks will be permanently removed.')) return;
    try {
      await api('purge_bin', 'POST', {});
      state.binCharts = [];
      toast('Bin emptied'); rerenderApp();
    } catch (err) { toast(err.message, 'error'); }
  }

  // ============================================================
  // UNDO / CLIPBOARD / SELECTION HELPERS
  // ============================================================
  function pushUndo(entry) {
    state.undoStack.push(entry);
    if (state.undoStack.length > 20) state.undoStack.shift();
  }

  async function undoLast() {
    if (!state.undoStack.length) { toast('Nothing to undo'); return; }
    const entry = state.undoStack.pop();
    try {
      if (entry.type === 'create') {
        for (const id of entry.ids) await api('delete_task', 'POST', { id });
        state.tasks = state.tasks.filter(t => !entry.ids.includes(t.id));
        toast('Undo', 'success');

      } else if (entry.type === 'delete' || entry.type === 'cut_paste') {
        // Re-create deleted tasks; collect old→new ID mapping
        const idMap = {};
        for (const task of entry.deleted) {
          const res = await api('create_task', 'POST', {
            chart_id: state.chart.id, type: task.type, title: task.title,
            note: task.note, start_date: task.start_date, end_date: task.end_date, color: task.color,
          });
          idMap[task.id] = res.task.id;
          state.tasks.push(res.task);
        }
        if (entry.type === 'cut_paste') {
          // Also delete the pasted copies
          for (const id of entry.createdIds) await api('delete_task', 'POST', { id });
          state.tasks = state.tasks.filter(t => !entry.createdIds.includes(t.id));
        }
        // Restore original order, mapping old IDs to new IDs
        const restoredOrder = entry.prevOrder.map(id => idMap[id] ?? id).filter(id => state.tasks.some(t => t.id === id));
        await api('reorder_tasks', 'POST', { chart_id: state.chart.id, order: restoredOrder });
        state.tasks.sort((a, b) => restoredOrder.indexOf(a.id) - restoredOrder.indexOf(b.id));
        toast('Undo', 'success');

      } else if (entry.type === 'reorder') {
        const validOrder = entry.prevOrder.filter(id => state.tasks.some(t => t.id === id));
        await api('reorder_tasks', 'POST', { chart_id: state.chart.id, order: validOrder });
        state.tasks.sort((a, b) => validOrder.indexOf(a.id) - validOrder.indexOf(b.id));
        toast('Undo', 'success');
      }
      state.selectedTaskIds.clear();
      rerenderBody();
    } catch (err) { toast('Undo failed: ' + err.message, 'error'); }
  }

  async function duplicateTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    try {
      const res = await api('create_task', 'POST', {
        chart_id: state.chart.id, type: task.type, title: task.title + ' (copy)',
        note: task.note, start_date: task.start_date, end_date: task.end_date, color: task.color,
      });
      const idx = state.tasks.findIndex(t => t.id === id);
      state.tasks.splice(idx + 1, 0, res.task);
      await api('reorder_tasks', 'POST', { chart_id: state.chart.id, order: state.tasks.map(t => t.id) });
      pushUndo({ type: 'create', ids: [res.task.id] });
      toast('Duplicated', 'success'); rerenderBody();
    } catch (err) { toast(err.message, 'error'); }
  }

  function copySelected() {
    if (!state.selectedTaskIds.size) { toast('Select tasks first'); return; }
    state.clipboard = {
      action: 'copy',
      tasks: state.tasks.filter(t => state.selectedTaskIds.has(t.id)).map(t => ({ ...t })),
    };
    toast(`Copied ${state.clipboard.tasks.length} item(s)`);
  }

  function cutSelected() {
    if (!state.selectedTaskIds.size) { toast('Select tasks first'); return; }
    state.clipboard = {
      action: 'cut',
      tasks: state.tasks.filter(t => state.selectedTaskIds.has(t.id)).map(t => ({ ...t })),
    };
    toast(`Cut ${state.clipboard.tasks.length} item(s)`);
    rerenderBody();
  }

  async function pasteClipboard() {
    if (!state.clipboard) { toast('Nothing to paste'); return; }
    const { action, tasks: cbTasks } = state.clipboard;
    const prevOrder = state.tasks.map(t => t.id);

    try {
      const created = [];
      for (const task of cbTasks) {
        const res = await api('create_task', 'POST', {
          chart_id: state.chart.id, type: task.type, title: task.title,
          note: task.note, start_date: task.start_date, end_date: task.end_date, color: task.color,
        });
        created.push(res.task);
      }

      // Always paste at end
      state.tasks.push(...created);
      const createdIds = created.map(t => t.id);
      await api('reorder_tasks', 'POST', { chart_id: state.chart.id, order: state.tasks.map(t => t.id) });

      if (action === 'cut') {
        const cutIds = cbTasks.map(t => t.id);
        for (const id of cutIds) {
          if (state.tasks.find(t => t.id === id)) await api('delete_task', 'POST', { id });
        }
        state.tasks = state.tasks.filter(t => !cutIds.includes(t.id));
        pushUndo({ type: 'cut_paste', createdIds, deleted: cbTasks, prevOrder });
      } else {
        pushUndo({ type: 'create', ids: createdIds });
      }

      state.clipboard = null;
      state.selectedTaskIds.clear();
      createdIds.forEach(id => state.selectedTaskIds.add(id));
      toast(`Pasted ${created.length} item(s)`, 'success');
      rerenderBody();
    } catch (err) { toast('Paste failed: ' + err.message, 'error'); }
  }

  // ============================================================
  // ACTIONS — TASKS
  // ============================================================
  function promptAddTask() {
    const doSave = async (addAnother) => {
      const title = document.getElementById('f-title').value.trim();
      const note  = document.getElementById('f-note').value.trim();
      const start = document.getElementById('f-start').value;
      const end   = document.getElementById('f-end').value;
      const color = document.getElementById('f-color').value;
      const taskType = document.getElementById('f-launch')?.checked ? 'launch' : 'task';
      if (!title) { showModalError('Title is required.'); return; }
      try {
        const res = await api('create_task', 'POST', {
          chart_id: state.chart.id, type: taskType, title, note, start_date: start, end_date: end, color,
        });
        state.tasks.push(res.task);
        pushUndo({ type: 'create', ids: [res.task.id] });
        rerenderBody();
        if (addAnother) { promptAddTask(); toast('Task added', 'success'); }
        else { closeModal(); toast('Task added', 'success'); }
      } catch (err) { showModalError(err.message); }
    };
    openModal(modalTaskHtml(null, false), () => doSave(false));
    document.getElementById('f-start')?.addEventListener('change', e => {
      document.getElementById('f-end').value = e.target.value;
    });
    document.getElementById('modal-save-add-btn')?.addEventListener('click', () => doSave(true));
  }

  function promptAddSection() {
    openModal(modalSectionHtml(null), async () => {
      const title = document.getElementById('f-title').value.trim();
      const color = document.getElementById('f-color').value;
      const start = document.getElementById('f-start').value;
      const end   = document.getElementById('f-end').value;
      if (!title) { showModalError('Title is required.'); return; }
      try {
        const res = await api('create_task', 'POST', { chart_id: state.chart.id, type: 'section', title, color, start_date: start, end_date: end });
        state.tasks.push(res.task);
        pushUndo({ type: 'create', ids: [res.task.id] });
        closeModal(); toast('Section added', 'success'); rerenderBody();
      } catch (err) { showModalError(err.message); }
    });
    document.getElementById('f-start')?.addEventListener('change', e => {
      document.getElementById('f-end').value = e.target.value;
    });
  }

  function promptEditTask(id, focusDates) {
    const task    = state.tasks.find(t => t.id === id);
    if (!task) return;
    const isSec   = task.type === 'section';
    openModal(isSec ? modalSectionHtml(task) : modalTaskHtml(task, !!focusDates), async () => {
      const title = document.getElementById('f-title').value.trim();
      if (!title) { showModalError('Title is required.'); return; }
      const payload = { id, title, color: document.getElementById('f-color').value };
      if (!isSec) {
        payload.note = document.getElementById('f-note').value.trim();
        payload.type = document.getElementById('f-launch')?.checked ? 'launch' : 'task';
      }
      payload.start_date = document.getElementById('f-start').value;
      payload.end_date   = document.getElementById('f-end').value;
      try {
        const res = await api('update_task', 'POST', payload);
        const idx = state.tasks.findIndex(t => t.id === id);
        if (idx !== -1) state.tasks[idx] = res.task;
        closeModal(); toast('Saved', 'success'); rerenderBody();
      } catch (err) { showModalError(err.message); }
    });
    document.getElementById('f-start')?.addEventListener('change', e => {
      document.getElementById('f-end').value = e.target.value;
    });
  }

  async function deleteTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!confirm(`Delete "${task?.title}"?`)) return;
    try {
      pushUndo({ type: 'delete', deleted: [task], prevOrder: state.tasks.map(t => t.id) });
      await api('delete_task', 'POST', { id });
      state.tasks = state.tasks.filter(t => t.id !== id);
      state.openMenuId = null;
      toast('Deleted'); rerenderBody();
    } catch (err) { toast(err.message, 'error'); }
  }

  function toggleNote(id) {
    if (state.expandedNotes.has(id)) state.expandedNotes.delete(id);
    else state.expandedNotes.add(id);
    rerenderBody();
  }

  // ============================================================
  // DRAG & DROP REORDER
  // ============================================================
  function initDragDrop() {
    const body = document.getElementById('ganttBody');
    if (!body || !state.isLoggedIn || state.locked) return;

    let dragId = null;

    body.addEventListener('dragstart', e => {
      const row = e.target.closest('[data-task-id]');
      if (!row) return;
      dragId = parseInt(row.dataset.taskId);
      row.classList.add('opacity-40');
      e.dataTransfer.effectAllowed = 'move';
    });

    body.addEventListener('dragend', () => {
      body.querySelectorAll('[data-task-id]').forEach(r => {
        r.classList.remove('opacity-40');
        r.removeAttribute('data-drag-over');
      });
    });

    body.addEventListener('dragover', e => {
      e.preventDefault();
      const row = e.target.closest('[data-task-id]');
      if (!row || parseInt(row.dataset.taskId) === dragId) return;
      body.querySelectorAll('[data-task-id]').forEach(r => r.removeAttribute('data-drag-over'));
      row.setAttribute('data-drag-over', 'true');
    });

    body.addEventListener('drop', async e => {
      e.preventDefault();
      const targetRow = e.target.closest('[data-task-id]');
      if (!targetRow || !dragId) return;
      const targetId = parseInt(targetRow.dataset.taskId);
      if (targetId === dragId) return;

      const from = state.tasks.findIndex(t => t.id === dragId);
      const to   = state.tasks.findIndex(t => t.id === targetId);
      if (from === -1 || to === -1) return;

      pushUndo({ type: 'reorder', prevOrder: state.tasks.map(t => t.id) });
      const moved = state.tasks.splice(from, 1)[0];
      state.tasks.splice(to, 0, moved);

      try {
        await api('reorder_tasks', 'POST', { chart_id: state.chart.id, order: state.tasks.map(t => t.id) });
      } catch (err) { toast('Reorder failed: ' + err.message, 'error'); }

      rerenderBody();
    });
  }

  // ============================================================
  // BAR RESIZE (registered once at init)
  // ============================================================
  function initBarResize() {
    let resizing    = null; // edge resize
    let movingBar   = null; // bar drag-move
    let resizingCol = null; // task column resize
    let resizingView = null; // view range resize

    document.addEventListener('mousedown', e => {
      // 0. View range resize (extends/shrinks chart start or end date)
      const viewHandle = e.target.closest('[data-view-resize]');
      if (viewHandle) {
        e.preventDefault();
        const edge = viewHandle.dataset.viewResize;
        const origDate = edge === 'left' ? parseDate(state.chart.view_start) : parseDate(state.chart.view_end);
        resizingView = { edge, startX: e.clientX, origDate };
        document.body.style.cursor     = 'col-resize';
        document.body.style.userSelect = 'none';
        return;
      }

      // 1. Column resize handle
      const colHandle = e.target.closest('[data-col-resize]');
      if (colHandle) {
        e.preventDefault();
        resizingCol = { startX: e.clientX, startWidth: taskColW(), currentWidth: taskColW() };
        document.body.style.cursor     = 'col-resize';
        document.body.style.userSelect = 'none';
        return;
      }

      // 2. Edge resize handle
      const handle = e.target.closest('[data-resize-edge]');
      if (handle && !state.locked) {
        e.preventDefault();
        e.stopPropagation();
        const taskId = parseInt(handle.dataset.resizeId);
        const edge   = handle.dataset.resizeEdge;
        const task   = state.tasks.find(t => t.id === taskId);
        if (!task || !task.start_date || !task.end_date) return;
        const bar = document.querySelector(`[data-bar-id="${taskId}"]`);
        if (bar) bar.style.transition = 'none';
        resizing = { taskId, edge, startX: e.clientX, origStart: parseDate(task.start_date), origEnd: parseDate(task.end_date), bar, pendingDate: null };
        document.body.style.cursor     = 'col-resize';
        document.body.style.userSelect = 'none';
        return;
      }

      // 3. Bar body drag-move
      const bar = e.target.closest('[data-bar-id]');
      if (bar && !state.locked) {
        e.preventDefault();
        const taskId = parseInt(bar.dataset.barId);
        const task   = state.tasks.find(t => t.id === taskId);
        if (!task || !task.start_date || !task.end_date) return;
        bar.style.transition = 'none';
        movingBar = { taskId, startX: e.clientX, origStart: parseDate(task.start_date), origEnd: parseDate(task.end_date), bar, pendingStart: null, pendingEnd: null };
        document.body.style.cursor     = 'grabbing';
        document.body.style.userSelect = 'none';
      }
    });

    // Prevent HTML5 row-reorder drag while bar-moving
    document.addEventListener('dragstart', e => { if (movingBar) e.preventDefault(); });

    document.addEventListener('mousemove', e => {
      if (resizingView) {
        const pp = pxPerDay();
        const deltaDays = Math.round((e.clientX - resizingView.startX) / pp);
        let newDate = addDays(resizingView.origDate, deltaDays);
        // Enforce minimum 3-day range
        if (resizingView.edge === 'left') {
          const ve = parseDate(state.chart.view_end);
          if (daysBetween(newDate, ve) < 2) newDate = addDays(ve, -2);
          state.chart.view_start = formatDate(newDate);
        } else {
          const vs = parseDate(state.chart.view_start);
          if (daysBetween(vs, newDate) < 2) newDate = addDays(vs, 2);
          state.chart.view_end = formatDate(newDate);
        }
        // Live preview: rebuild header + update widths
        const tw = totalTimelineWidth();
        const header = document.getElementById('timelineHeader');
        const wrap   = document.getElementById('timelineHeaderWrap');
        if (header) header.innerHTML = buildTimelineHeader();
        if (wrap)   wrap.style.width = tw + 'px';
        const table = document.querySelector('#ganttScroll > div');
        if (table) table.style.minWidth = `calc(${taskColW()}px + ${tw}px)`;
        return;
      }

      if (resizingCol) {
        const w = Math.max(120, Math.min(Math.round(window.innerWidth * 0.5), resizingCol.startWidth + (e.clientX - resizingCol.startX)));
        document.querySelectorAll('[data-task-col]').forEach(el => { el.style.width = w + 'px'; el.style.minWidth = w + 'px'; });
        const container = document.querySelector('#ganttScroll > div');
        if (container) container.style.minWidth = `calc(${w}px + ${totalTimelineWidth()}px)`;
        resizingCol.currentWidth = w;
        return;
      }

      if (resizing) {
        const { edge, startX, origStart, origEnd, bar } = resizing;
        const pp        = pxPerDay();
        const deltaDays = Math.round((e.clientX - startX) / pp);
        const vs = parseDate(state.chart.view_start);
        const ve = parseDate(state.chart.view_end);
        let newStart = origStart, newEnd = origEnd;
        if (edge === 'right') { newEnd   = addDays(origEnd,   deltaDays); if (newEnd   < origStart) newEnd   = origStart; }
        else                  { newStart = addDays(origStart, deltaDays); if (newStart > origEnd)   newStart = origEnd; }
        resizing.pendingDate = edge === 'right' ? newEnd : newStart;
        if (bar) {
          const left  = Math.max(0, daysBetween(vs, newStart)) * pp;
          const right = Math.min((daysBetween(vs, ve) + 1) * pp, (daysBetween(vs, newEnd) + 1) * pp);
          const w = right - left;
          if (w > 0) { bar.style.left = left + 'px'; bar.style.width = w + 'px'; }
        }
        return;
      }

      if (movingBar) {
        const { startX, origStart, origEnd, bar } = movingBar;
        const pp        = pxPerDay();
        const deltaDays = Math.round((e.clientX - startX) / pp);
        const vs = parseDate(state.chart.view_start);
        const newStart = addDays(origStart, deltaDays);
        const newEnd   = addDays(origEnd,   deltaDays);
        movingBar.pendingStart = newStart;
        movingBar.pendingEnd   = newEnd;
        if (bar) {
          const left = Math.max(0, daysBetween(vs, newStart)) * pp;
          bar.style.left = left + 'px'; // width unchanged
        }
      }
    });

    document.addEventListener('mouseup', async () => {
      if (resizingView) {
        resizingView = null;
        document.body.style.cursor     = '';
        document.body.style.userSelect = '';
        try {
          await api('update_chart', 'POST', {
            id:         state.chart.id,
            title:      state.chart.title,
            view_mode:  state.chart.view_mode,
            view_start: state.chart.view_start,
            view_end:   state.chart.view_end,
          });

          // Clamp any tasks that now fall entirely outside the new range
          const vs = parseDate(state.chart.view_start);
          const ve = parseDate(state.chart.view_end);
          const toUpdate = [];
          for (const task of state.tasks) {
            if (!task.start_date || !task.end_date) continue;
            const ts = parseDate(task.start_date);
            const te = parseDate(task.end_date);
            let newStart = ts, newEnd = te;
            if (te < vs) {
              // entirely off left — slide to start, preserve duration
              const dur = daysBetween(ts, te);
              newStart = vs;
              newEnd   = addDays(vs, dur);
            } else if (ts > ve) {
              // entirely off right — slide to end, preserve duration
              const dur = daysBetween(ts, te);
              newEnd   = ve;
              newStart = addDays(ve, -dur);
              if (newStart < vs) newStart = vs;
            }
            if (formatDate(newStart) !== task.start_date || formatDate(newEnd) !== task.end_date) {
              toUpdate.push({ ...task, start_date: formatDate(newStart), end_date: formatDate(newEnd) });
            }
          }
          if (toUpdate.length) {
            await Promise.all(toUpdate.map(async t => {
              const res = await api('update_task', 'POST', t);
              const idx = state.tasks.findIndex(x => x.id === t.id);
              if (idx !== -1) state.tasks[idx] = res.task;
            }));
            toast(`${toUpdate.length} task${toUpdate.length > 1 ? 's' : ''} moved to fit new range`, 'info');
          }
        } catch (err) { toast('Failed to save: ' + err.message, 'error'); }
        rerenderBody();
        return;
      }

      if (resizingCol) {
        if (state.compact) state.taskColWidthCompact = resizingCol.currentWidth;
        else               state.taskColWidth        = resizingCol.currentWidth;
        resizingCol = null;
        document.body.style.cursor     = '';
        document.body.style.userSelect = '';
        rerenderBody();
        return;
      }

      if (resizing) {
        const { taskId, edge, bar, pendingDate } = resizing;
        resizing = null;
        document.body.style.cursor     = '';
        document.body.style.userSelect = '';
        if (bar) bar.style.transition = '';
        if (!pendingDate) return;
        const task = state.tasks.find(t => t.id === taskId);
        if (!task) return;
        const payload = {
          id: task.id, chart_id: task.chart_id, type: task.type, title: task.title,
          note: task.note, color: task.color, sort_order: task.sort_order,
          start_date: edge === 'left'  ? formatDate(pendingDate) : task.start_date,
          end_date:   edge === 'right' ? formatDate(pendingDate) : task.end_date,
        };
        try {
          const res = await api('update_task', 'POST', payload);
          const idx = state.tasks.findIndex(t => t.id === taskId);
          if (idx !== -1) state.tasks[idx] = res.task;
        } catch (err) { toast('Failed to save: ' + err.message, 'error'); }
        rerenderBody();
        return;
      }

      if (movingBar) {
        const { taskId, bar, pendingStart, pendingEnd } = movingBar;
        movingBar = null;
        document.body.style.cursor     = '';
        document.body.style.userSelect = '';
        if (bar) bar.style.transition = '';
        if (!pendingStart) return;
        const task = state.tasks.find(t => t.id === taskId);
        if (!task) return;
        const payload = {
          id: task.id, chart_id: task.chart_id, type: task.type, title: task.title,
          note: task.note, color: task.color, sort_order: task.sort_order,
          start_date: formatDate(pendingStart),
          end_date:   formatDate(pendingEnd),
        };
        try {
          const res = await api('update_task', 'POST', payload);
          const idx = state.tasks.findIndex(t => t.id === taskId);
          if (idx !== -1) state.tasks[idx] = res.task;
        } catch (err) { toast('Failed to save: ' + err.message, 'error'); }
        rerenderBody();
      }
    });
  }

  // ============================================================
  // RENDER HELPERS
  // ============================================================
  function rerenderApp() {
    const root = document.getElementById('app');
    root.innerHTML = state.page === 'home' ? renderHome() : renderChart();
    bindEvents();
    initDragDrop();
  }

  function rerenderBody() {
    const body   = document.getElementById('ganttBody');
    const header = document.getElementById('timelineHeader');
    if (!body) { rerenderApp(); return; }

    const tw     = totalTimelineWidth();
    const tdLine = todayLineStyle();

    const sectionMap    = buildSectionMap();
    const launchColumns = launchColumnStyles();
    const weekendCols   = weekendColumns();
    body.innerHTML = state.tasks.length === 0
      ? `<div class="text-center py-12 px-5 text-[14px] text-[#909090]">No tasks yet.${state.isLoggedIn ? ' Use "+ Task" or "+ Section" above.' : ' Login to add tasks.'}</div>`
      : state.tasks.map(t => renderTaskRow(t, tw, tdLine, sectionMap.get(t.id), launchColumns, weekendCols)).join('');

    if (header) { header.innerHTML = buildTimelineHeader(); }
    const headerWrap = document.getElementById('timelineHeaderWrap');
    if (headerWrap) headerWrap.style.width = tw + 'px';

    const table = document.querySelector('#ganttScroll > div');
    if (table) table.style.minWidth = `calc(${taskColW()}px + ${tw}px)`;

    bindBodyEvents();
    initDragDrop();
  }

  // ============================================================
  // EVENT BINDING
  // ============================================================
  function bindEvents() {
    document.getElementById('btn-create-chart')?.addEventListener('click', promptCreateChart);
    document.getElementById('btn-login-modal')?.addEventListener('click', () => openLoginModal());
    document.getElementById('btn-logout')?.addEventListener('click', doLogout);
    document.getElementById('btn-manage-users')?.addEventListener('click', openUsersModal);
    document.getElementById('btn-add-task')?.addEventListener('click', promptAddTask);
    document.getElementById('btn-add-section')?.addEventListener('click', promptAddSection);
    document.getElementById('btn-edit-chart')?.addEventListener('click', promptEditChart);
    document.getElementById('btn-view-bin')?.addEventListener('click', viewBin);
    document.getElementById('btn-view-home')?.addEventListener('click', viewHome);
    document.getElementById('btn-purge-bin')?.addEventListener('click', purgeBin);
    document.getElementById('btn-compact')?.addEventListener('click', () => { state.compact = !state.compact; rerenderApp(); });
    document.getElementById('btn-lock')?.addEventListener('click', () => { state.locked = !state.locked; rerenderApp(); });

    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => setViewMode(btn.dataset.view));
    });
    document.querySelectorAll('[data-rename-chart]').forEach(btn => {
      btn.addEventListener('click', () => promptRenameChart(parseInt(btn.dataset.renameChart)));
    });
    document.querySelectorAll('[data-duplicate-chart]').forEach(btn => {
      btn.addEventListener('click', () => duplicateChart(parseInt(btn.dataset.duplicateChart)));
    });
    document.querySelectorAll('[data-delete-chart]').forEach(btn => {
      btn.addEventListener('click', () => deleteChart(parseInt(btn.dataset.deleteChart)));
    });
    document.querySelectorAll('[data-restore-chart]').forEach(btn => {
      btn.addEventListener('click', () => restoreChart(parseInt(btn.dataset.restoreChart)));
    });
    document.querySelectorAll('[data-purge-chart]').forEach(btn => {
      btn.addEventListener('click', () => purgeChart(parseInt(btn.dataset.purgeChart)));
    });

    bindBodyEvents();
  }

  // Apply or remove selection styling to a row element
  function applyRowSelection(row, selected) {
    if (selected) {
      row.style.outline = '3px solid #4A90E2';
      row.style.outlineOffset = '-3px';
      row.style.background = 'rgba(74,144,226,0.10)';
    } else {
      row.style.outline = '';
      row.style.outlineOffset = '';
      row.style.background = '';
    }
  }

  function bindBodyEvents() {
    document.querySelectorAll('.kebab-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.menu);
        // Reset all sticky cells back to their default z-index
        document.querySelectorAll('[data-task-col]').forEach(el => el.style.zIndex = '');
        state.openMenuId = state.openMenuId === id ? null : id;
        document.querySelectorAll('[id^="menu-"]').forEach(m => m.classList.add('hidden'));
        if (state.openMenuId) {
          document.getElementById('menu-' + state.openMenuId)?.classList.remove('hidden');
          // Elevate this row's sticky cell so the dropdown overlaps rows below
          btn.closest('[data-task-col]')?.style.setProperty('z-index', '500');
        }
      });
    });

    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        state.openMenuId = null;
        document.querySelectorAll('[id^="menu-"]').forEach(m => m.classList.add('hidden'));
        document.querySelectorAll('[data-task-col]').forEach(el => el.style.zIndex = '');
        switch (btn.dataset.action) {
          case 'edit-task':      promptEditTask(id, false); break;
          case 'edit-section':   promptEditTask(id, false); break;
          case 'edit-dates':     promptEditTask(id, true);  break;
          case 'change-color':   promptEditTask(id, false); break;
          case 'duplicate-task': duplicateTask(id);         break;
          case 'delete-task':    deleteTask(id);            break;
        }
      });
    });

    document.querySelectorAll('[data-toggle-note]').forEach(btn => {
      btn.addEventListener('click', () => toggleNote(parseInt(btn.dataset.toggleNote)));
    });

    // Row double-click → edit
    document.querySelectorAll('[data-task-id]').forEach(row => {
      row.addEventListener('dblclick', e => {
        if (e.target.closest('button,a,input,[data-resize-edge],[data-bar-id]')) return;
        promptEditTask(parseInt(row.dataset.taskId), false);
      });
    });

    // Row click → select (direct DOM update, no rerender)
    // Ctrl/Cmd held = add to / remove from selection; plain click = single-select
    document.querySelectorAll('[data-task-id]').forEach(row => {
      row.addEventListener('click', e => {
        if (e.target.closest('button,a,input,[data-resize-edge],[data-bar-id]')) return;
        const id = parseInt(row.dataset.taskId);
        const multi = e.ctrlKey || e.metaKey;
        if (multi) {
          // Toggle this item in the existing selection
          if (state.selectedTaskIds.has(id)) {
            state.selectedTaskIds.delete(id);
            applyRowSelection(row, false);
          } else {
            state.selectedTaskIds.add(id);
            applyRowSelection(row, true);
          }
        } else {
          // Deselect all, then select this one
          document.querySelectorAll('[data-task-id]').forEach(r => {
            state.selectedTaskIds.delete(parseInt(r.dataset.taskId));
            applyRowSelection(r, false);
          });
          state.selectedTaskIds.add(id);
          applyRowSelection(row, true);
        }
      });
    });

    // Click on gantt background → deselect all
    document.getElementById('ganttScroll')?.addEventListener('click', e => {
      if (!e.target.closest('[data-task-id]') && state.selectedTaskIds.size) {
        state.selectedTaskIds.clear();
        document.querySelectorAll('[data-task-id]').forEach(r => applyRowSelection(r, false));
      }
    });

    document.addEventListener('click', () => {
      if (state.openMenuId) {
        state.openMenuId = null;
        document.querySelectorAll('[id^="menu-"]').forEach(m => m.classList.add('hidden'));
        document.querySelectorAll('[data-task-col]').forEach(el => el.style.zIndex = '');
      }
    }, { capture: true });
  }

  // Keyboard shortcuts: Ctrl/Cmd Z/C/X/V/A (chart page only, logged in, no modal)
  document.addEventListener('keydown', e => {
    if (state.page !== 'chart' || !state.isLoggedIn) return;
    if (document.querySelector('#modal-overlay:not(.hidden)')) return;
    if (e.target.matches('input,textarea,select')) return;
    const mod = e.ctrlKey || e.metaKey;
    if (!mod) return;
    switch (e.key.toLowerCase()) {
      case 'z': e.preventDefault(); undoLast(); break;
      case 'c': e.preventDefault(); copySelected(); break;
      case 'x': e.preventDefault(); cutSelected(); break;
      case 'v': e.preventDefault(); pasteClipboard(); break;
      case 'a': e.preventDefault();
        state.tasks.forEach(t => state.selectedTaskIds.add(t.id));
        document.querySelectorAll('[data-task-id]').forEach(r => applyRowSelection(r, true));
        break;
    }
  });

  // ============================================================
  // LOGIN MODAL
  // ============================================================
  function openLoginModal(lockedMinutes) {
    openModal(modalLoginHtml(lockedMinutes), async () => {
      const email    = document.getElementById('f-email').value.trim();
      const password = document.getElementById('f-password').value;
      if (!email || !password) { showModalError('Both fields are required.'); return; }
      try {
        await doLogin(email, password);
      } catch (err) {
        if (err.message && err.message.includes('wait')) {
          const mins = parseInt(err.message.match(/\d+/) || ['1']);
          closeModal();
          openLoginModal(isNaN(mins) ? 1 : mins);
        } else {
          showModalError(err.message);
        }
      }
    });
    // Wire up "Forgot password?" link after modal renders
    document.getElementById('btn-forgot-pw')?.addEventListener('click', () => {
      closeModal();
      openForgotPasswordModal();
    });
  }

  function openForgotPasswordModal() {
    const html = `
      <div class="${T.mHead}">
        <h2 class="${T.mTitle}">Reset Password</h2>
        <button class="${T.mClose}" id="modal-close-btn">×</button>
      </div>
      <form id="modal-form">
        <div class="${T.mBody}">
          <p class="text-[13px] text-[#909090] mb-4">Enter your account email and we'll send a reset link.</p>
          <div id="modal-err" class="${T.mErr}" style="display:none"></div>
          <div class="mb-0">
            <label class="${T.lbl}" for="f-reset-email">Email address</label>
            <input class="${T.inp}" type="email" id="f-reset-email" name="email" autofocus required autocomplete="email">
          </div>
        </div>
        <div class="${T.mFoot}">
          <button type="button" class="${T.btn} ${T.md} ${T.outline}" id="modal-close-btn2">Cancel</button>
          <button type="submit" class="${T.btn} ${T.md} ${T.primary}">Send Reset Link</button>
        </div>
      </form>`;
    openModal(html, async () => {
      const email = document.getElementById('f-reset-email').value.trim();
      if (!email) { showModalError('Email is required.'); return; }
      try {
        await api('forgot_password', 'POST', { email });
        closeModal();
        toast('If that address is registered, a reset link has been sent.');
      } catch (err) { showModalError(err.message); }
    });
  }

  // ============================================================
  // USER MANAGEMENT MODAL
  // ============================================================
  async function openUsersModal() {
    let users = [];
    try { users = await api('list_users'); }
    catch (err) { toast(err.message, 'error'); return; }
    renderUsersModal(users);
  }

  function renderUsersModal(users) {
    const rows = users.map(u => `
      <tr>
        <td class="px-2.5 py-2.5 border-b border-[#383838] align-middle font-semibold text-[13px] break-all">${esc(u.email)}</td>
        <td class="px-2.5 py-2.5 border-b border-[#383838] align-middle w-20">
          ${u.is_admin ? `<span class="${T.adminBadge} !ml-0">Admin</span>` : `<span class="${T.userBadge}">User</span>`}
        </td>
        <td class="px-2.5 py-2.5 border-b border-[#383838] align-middle text-right whitespace-nowrap">
          <button class="${T.btn} ${T.sm} ${T.outline}" data-chpw="${u.id}" data-email="${esc(u.email)}">Change PW</button>
          ${u.id !== state.userId ? `<button class="${T.btn} ${T.sm} ${T.danger} ml-1.5" data-deluser="${u.id}" data-email="${esc(u.email)}">Delete</button>` : ''}
        </td>
      </tr>`).join('');

    const html = `
      <div class="${T.mHead}">
        <h2 class="${T.mTitle}">Manage Users</h2>
        <button class="${T.mClose}" id="modal-close-btn">×</button>
      </div>
      <div class="${T.mBody} pb-2">
        <table class="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th class="text-left text-[11px] font-bold uppercase tracking-wider text-[#909090] px-2.5 py-1.5 border-b-2 border-[#383838]">Email</th>
              <th class="text-left text-[11px] font-bold uppercase tracking-wider text-[#909090] px-2.5 py-1.5 border-b-2 border-[#383838]">Role</th>
              <th class="text-[11px] font-bold uppercase tracking-wider text-[#909090] px-2.5 py-1.5 border-b-2 border-[#383838] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="px-[22px] py-4 border-t border-[#383838]">
        <h3 class="text-sm font-semibold mb-1">Add New User</h3>
        <p class="text-[12px] text-[#909090] mb-3">A setup link will be emailed to the address.</p>
        <div id="add-user-err" class="${T.mErr}" style="display:none"></div>
        <form id="add-user-form">
          <div class="mb-3">
            <input class="${T.inp}" type="email" id="new-email" placeholder="user@example.com" required autocomplete="off">
          </div>
          <div class="flex items-center gap-4 flex-wrap">
            <label class="flex items-center gap-1.5 text-[13px] font-medium cursor-pointer select-none">
              <input type="checkbox" id="new-is-admin" class="w-3.5 h-3.5"> Grant Admin
            </label>
            <button type="submit" class="${T.btn} ${T.sm} ${T.primary}">Invite User</button>
          </div>
        </form>
      </div>
      <div class="${T.mFoot}">
        <button type="button" class="${T.btn} ${T.md} ${T.outline}" id="modal-close-btn2">Close</button>
      </div>`;

    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    content.innerHTML = html;
    overlay.classList.remove('hidden');

    document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
    document.getElementById('modal-close-btn2')?.addEventListener('click', closeModal);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

    document.getElementById('add-user-form').addEventListener('submit', async e => {
      e.preventDefault();
      const email    = document.getElementById('new-email').value.trim();
      const isAdminU = document.getElementById('new-is-admin').checked;
      const errEl    = document.getElementById('add-user-err');
      errEl.style.display = 'none';
      try {
        const res = await api('create_user', 'POST', { email, is_admin: isAdminU });
        // Always show the setup link — email is sent in the background
        closeModal();
        openModal(
          `<h2 class="text-lg font-semibold mb-3">User created</h2>
           <p class="text-sm text-[#fffbf5] mb-3">An account for <strong>${escHtml(email)}</strong> has been created. An invite email is being sent in the background.</p>
           <p class="text-sm text-[#fffbf5] mb-1">You can also share this setup link directly (expires in 24 hours):</p>
           <input readonly class="w-full text-xs border border-[#484848] rounded px-2 py-1 font-mono bg-[#2a2a2a] text-[#fffbf5]" value="${escHtml(res.setup_link || '')}" onclick="this.select()">`,
          null
        );
        openUsersModal();
      } catch (err) { errEl.textContent = err.message; errEl.style.display = 'block'; }
    });

    document.querySelectorAll('[data-deluser]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.deluser), email = btn.dataset.email;
        if (!confirm(`Delete user "${email}"? This cannot be undone.`)) return;
        try {
          await api('delete_user', 'POST', { id });
          toast(`User "${email}" deleted`); closeModal(); openUsersModal();
        } catch (err) { toast(err.message, 'error'); }
      });
    });

    document.querySelectorAll('[data-chpw]').forEach(btn => {
      btn.addEventListener('click', () => openChangePasswordModal(parseInt(btn.dataset.chpw), btn.dataset.email));
    });
  }

  function openChangePasswordModal(userId, email) {
    const html = `
      <div class="${T.mHead}">
        <h2 class="${T.mTitle}">Change Password</h2>
        <button class="${T.mClose}" id="modal-close-btn">×</button>
      </div>
      <form id="modal-form">
        <div class="${T.mBody}">
          <p class="text-[13px] text-[#909090] mb-3.5">Setting new password for <strong class="text-[#fffbf5]">${esc(email)}</strong></p>
          <div id="modal-err" class="${T.mErr}" style="display:none"></div>
          <div class="mb-4">
            <label class="${T.lbl}" for="f-newpw">New Password</label>
            <input class="${T.inp}" type="password" id="f-newpw" required minlength="6" autofocus autocomplete="new-password">
          </div>
          <div class="mb-0">
            <label class="${T.lbl}" for="f-newpw2">Confirm Password</label>
            <input class="${T.inp}" type="password" id="f-newpw2" required autocomplete="new-password">
          </div>
        </div>
        <div class="${T.mFoot}">
          <button type="button" class="${T.btn} ${T.md} ${T.outline}" id="modal-close-btn2">Cancel</button>
          <button type="submit" class="${T.btn} ${T.md} ${T.primary}">Save Password</button>
        </div>
      </form>`;

    openModal(html, async () => {
      const pw = document.getElementById('f-newpw').value;
      const pw2 = document.getElementById('f-newpw2').value;
      if (pw !== pw2) { showModalError('Passwords do not match.'); return; }
      if (pw.length < 6) { showModalError('Password must be at least 6 characters.'); return; }
      try {
        await api('change_password', 'POST', { user_id: userId, password: pw });
        toast(`Password updated for "${email}"`, 'success');
        closeModal(); openUsersModal();
      } catch (err) { showModalError(err.message); }
    });
  }

  // ============================================================
  // INIT
  // ============================================================
  async function init() {
    try {
      const auth = await api('check_auth');
      state.isLoggedIn = auth.loggedIn;
      state.isAdmin    = !!auth.is_admin;
      state.email      = auth.email;
      state.userId     = auth.user_id || null;
    } catch (_) { /* pre-install or offline */ }

    const slug = window.GANTT_SLUG;

    if (slug) {
      try {
        const chartData = await api('get_chart&slug=' + encodeURIComponent(slug));
        state.chart     = chartData;
        state.chartSlug = slug;
        state.page      = 'chart';
        state.tasks     = await api('get_tasks&chart_id=' + chartData.id);
      } catch (err) {
        document.getElementById('app').innerHTML = `
          <div class="flex flex-col items-center justify-center h-screen text-[#909090] gap-4">
            <h2 class="text-2xl font-semibold text-[#fffbf5]">Chart not found</h2>
            <p>The chart you&rsquo;re looking for doesn&rsquo;t exist or was deleted.</p>
            <a href="index.php" class="text-green hover:underline">← Back to all charts</a>
          </div>`;
        return;
      }
    } else {
      state.page = 'home';
      try { state.charts = await api('list_charts'); }
      catch (_) { state.charts = []; }
    }

    rerenderApp();
    initBarResize();
  }

  init();

})();
