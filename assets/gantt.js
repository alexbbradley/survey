/* ============================================================
   gantt.js — Full Gantt Chart Application
   Vanilla JS, no dependencies
   ============================================================ */

(function () {
  'use strict';

  // ============================================================
  // CONSTANTS
  // ============================================================
  const DAY_PX  = 40;   // pixels per day in day-view
  const WEEK_PX = 100;  // pixels per week in week-view

  const COLORS = [
    '#4A90E2', '#7ED321', '#F5A623', '#E53E3E', '#9013FE',
    '#50E3C2', '#417505', '#BD10E0', '#F8B500', '#4A4A4A',
  ];

  const MONTH_NAMES = ['January','February','March','April','May','June',
                        'July','August','September','October','November','December'];
  const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun',
                        'Jul','Aug','Sep','Oct','Nov','Dec'];

  // ============================================================
  // STATE
  // ============================================================
  const state = {
    page:          'home',   // 'home' | 'chart'
    chartSlug:     null,
    chart:         null,
    tasks:         [],
    charts:        [],       // home page list
    isLoggedIn:    false,
    isAdmin:       false,
    username:      null,
    userId:        null,
    expandedNotes: new Set(),
    openMenuId:    null,
    modal:         null,     // { type, data }
    dragTaskId:    null,
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

  function daysBetween(a, b) {
    return Math.round((b - a) / 86400000);
  }

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
    return state.chart?.view_mode === 'day' ? DAY_PX : (WEEK_PX / 7);
  }

  function totalTimelineWidth() {
    if (!state.chart) return 0;
    const start = parseDate(state.chart.view_start);
    const end   = parseDate(state.chart.view_end);
    const days  = daysBetween(start, end) + 1;
    return Math.ceil(days * pxPerDay());
  }

  function barStyle(task) {
    const vs = parseDate(state.chart.view_start);
    const ve = parseDate(state.chart.view_end);
    const ts = parseDate(task.start_date);
    const te = parseDate(task.end_date);
    if (!ts || !te || !vs || !ve) return null;

    const pp = pxPerDay();
    const rawLeft  = daysBetween(vs, ts) * pp;
    const rawRight = (daysBetween(vs, te) + 1) * pp;

    const clampedLeft  = Math.max(0, rawLeft);
    const clampedRight = Math.min((daysBetween(vs, ve) + 1) * pp, rawRight);
    const width = clampedRight - clampedLeft;
    if (width <= 0) return null;

    return `left:${clampedLeft}px;width:${width}px;background:${task.color || '#4A90E2'}`;
  }

  function todayLineStyle() {
    if (!state.chart) return null;
    const vs = parseDate(state.chart.view_start);
    const ve = parseDate(state.chart.view_end);
    const td = today();
    if (td < vs || td > ve) return null;
    const left = daysBetween(vs, td) * pxPerDay();
    return `left:${left}px`;
  }

  // ============================================================
  // HTML ESCAPING
  // ============================================================
  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  // ============================================================
  // API CALLS
  // ============================================================
  async function api(action, method, body) {
    const opts = { method: method || 'GET', headers: {} };
    if (body) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(`api.php?action=${action}`, opts);
    const json = await res.json().catch(() => ({ error: 'Invalid server response' }));
    if (!res.ok) throw new Error(json.error || 'Request failed');
    return json;
  }

  // ============================================================
  // TIMELINE HEADER GENERATION
  // ============================================================
  function buildTimelineHeader() {
    const vs   = parseDate(state.chart.view_start);
    const ve   = parseDate(state.chart.view_end);
    const mode = state.chart.view_mode;
    const pp   = pxPerDay();

    // Build month spans + cell labels
    const months = [];
    const cells  = [];

    if (mode === 'day') {
      let cur = new Date(vs);
      let monthIdx = -1, monthW = 0;

      while (cur <= ve) {
        const m = cur.getMonth(), y = cur.getFullYear();
        if (m !== monthIdx) {
          if (monthIdx !== -1) months.push({ label: MONTH_SHORT[monthIdx] + ' ' + months._y, width: monthW });
          months._y  = y;
          monthIdx   = m;
          monthW     = 0;
        }
        const isWE = cur.getDay() === 0 || cur.getDay() === 6;
        const isTd = daysBetween(today(), cur) === 0;
        cells.push({ label: cur.getDate(), cls: (isWE ? ' weekend' : '') + (isTd ? ' today' : ''), width: DAY_PX });
        monthW += DAY_PX;
        cur = addDays(cur, 1);
      }
      if (monthIdx !== -1) months.push({ label: MONTH_SHORT[monthIdx] + ' ' + months._y, width: monthW });

    } else {
      // week view — find Monday ≤ view_start
      let weekStart = new Date(vs);
      const dow = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - (dow === 0 ? 6 : dow - 1));

      let cur = new Date(weekStart);
      let monthIdx = -1, monthW = 0;

      while (cur <= ve) {
        const m = cur.getMonth(), y = cur.getFullYear();
        if (m !== monthIdx) {
          if (monthIdx !== -1) months.push({ label: MONTH_SHORT[monthIdx] + ' ' + months._y, width: monthW });
          months._y = y;
          monthIdx  = m;
          monthW    = 0;
        }
        const label = MONTH_SHORT[cur.getMonth()] + ' ' + cur.getDate();
        cells.push({ label, cls: '', width: WEEK_PX });
        monthW += WEEK_PX;
        cur = addDays(cur, 7);
      }
      if (monthIdx !== -1) months.push({ label: MONTH_SHORT[monthIdx] + ' ' + months._y, width: monthW });
    }

    // Clean up helper property
    months.forEach(m => delete m._y);

    const monthsHtml = months.map(m =>
      `<div class="tl-month" style="width:${m.width}px">${esc(m.label)}</div>`
    ).join('');

    const cellsHtml = cells.map(c =>
      `<div class="tl-cell${c.cls}" style="width:${c.width}px">${c.label}</div>`
    ).join('');

    return `<div class="tl-months">${monthsHtml}</div><div class="tl-days">${cellsHtml}</div>`;
  }

  // ============================================================
  // RENDER — HOME
  // ============================================================
  function renderHome() {
    const charts = state.charts;
    return `
      <div class="home-container">
        <header class="app-header">
          <div class="app-header-left"><h1>Gantt Charts</h1></div>
          <div class="app-header-right">
            ${state.isLoggedIn
              ? `<span class="auth-status">${esc(state.username)}${state.isAdmin ? ' <span class="admin-badge">Admin</span>' : ''}</span>
                 ${state.isAdmin ? `<button class="btn btn-outline btn-sm" id="btn-manage-users">Users</button>` : ''}
                 <button class="btn btn-outline btn-sm" id="btn-logout">Logout</button>`
              : `<button class="btn btn-outline btn-sm" id="btn-login-modal">Login</button>`}
          </div>
        </header>
        <main class="home-main">
          <div class="home-actions">
            <h2>Your Charts</h2>
            ${state.isLoggedIn
              ? `<button class="btn btn-primary" id="btn-create-chart">+ New Chart</button>`
              : ''}
          </div>
          ${charts.length === 0
            ? `<p class="empty-state">No charts yet.${state.isLoggedIn ? ' Click "+ New Chart" to create one.' : ' Login to create charts.'}</p>`
            : `<div class="chart-list">${charts.map(c => `
                <div class="chart-card">
                  <div class="chart-card-info">
                    <a href="?c=${esc(c.slug)}" class="chart-card-title">${esc(c.title)}</a>
                    <span class="chart-card-dates">${esc(c.view_start)} → ${esc(c.view_end)} &nbsp;·&nbsp; ${esc(c.view_mode)} view</span>
                  </div>
                  <div class="chart-card-actions">
                    <a href="?c=${esc(c.slug)}" class="btn btn-sm btn-outline">Open</a>
                    ${state.isLoggedIn
                      ? `<button class="btn btn-sm btn-danger" data-delete-chart="${c.id}">Delete</button>`
                      : ''}
                  </div>
                </div>`).join('')}
              </div>`}
        </main>
      </div>`;
  }

  // ============================================================
  // RENDER — CHART PAGE
  // ============================================================
  function renderChart() {
    const ch = state.chart;
    const tw = totalTimelineWidth();
    const tdLine = todayLineStyle();

    const taskRowsHtml = state.tasks.length === 0
      ? `<div class="empty-tasks">No tasks yet.${state.isLoggedIn ? ' Use "+ Task" or "+ Section" above.' : ' Login to add tasks.'}</div>`
      : state.tasks.map(t => renderTaskRow(t, tw, tdLine)).join('');

    return `
      <div class="chart-container">
        <header class="app-header">
          <div class="app-header-left">
            <a href="index.php" class="back-link">← All Charts</a>
            <h1 class="chart-title">${esc(ch.title)}</h1>
          </div>
          <div class="app-header-right">
            <div class="view-toggle">
              <button class="btn btn-sm ${ch.view_mode === 'day' ? 'btn-primary' : 'btn-outline'}" data-view="day">Day</button>
              <button class="btn btn-sm ${ch.view_mode === 'week' ? 'btn-primary' : 'btn-outline'}" data-view="week">Week</button>
            </div>
            ${state.isLoggedIn ? `
              <button class="btn btn-sm btn-outline" id="btn-edit-chart">Edit Chart</button>
              <button class="btn btn-sm btn-primary"  id="btn-add-task">+ Task</button>
              <button class="btn btn-sm btn-outline"  id="btn-add-section">+ Section</button>
              ${state.isAdmin ? `<button class="btn btn-sm btn-outline" id="btn-manage-users">Users</button>` : ''}
              <span class="auth-status">${esc(state.username)}${state.isAdmin ? ' <span class="admin-badge">Admin</span>' : ''}</span>
              <button class="btn btn-sm btn-outline"  id="btn-logout">Logout</button>
            ` : `
              <button class="btn btn-sm btn-outline" id="btn-login-modal">Login to Edit</button>
            `}
          </div>
        </header>

        <div class="gantt-scroll-container" id="ganttScroll">
          <div class="gantt-table" style="min-width:calc(var(--label-w) + ${tw}px)">

            <div class="gantt-header-row">
              <div class="gantt-label-header">Task</div>
              <div class="gantt-timeline-header" style="width:${tw}px">
                ${buildTimelineHeader()}
              </div>
            </div>

            <div class="gantt-body" id="ganttBody">
              ${taskRowsHtml}
            </div>

          </div>
        </div>
      </div>`;
  }

  function renderTaskRow(task, tw, tdLine) {
    const isSec    = task.type === 'section';
    const expanded = state.expandedNotes.has(task.id);
    const bs       = !isSec ? barStyle(task) : null;
    const isMenu   = state.openMenuId === task.id;

    return `
      <div class="gantt-row ${isSec ? 'section-row' : 'task-row'}" data-task-id="${task.id}"
           draggable="${state.isLoggedIn ? 'true' : 'false'}">
        <div class="gantt-label-cell">
          <div class="gantt-label-content">
            <div class="gantt-label-top">
              ${state.isLoggedIn ? `
                <div class="kebab-wrapper">
                  <button class="kebab-btn" data-menu="${task.id}" title="Options">⋮</button>
                  <div class="kebab-menu${isMenu ? ' open' : ''}" id="menu-${task.id}">
                    ${isSec ? `
                      <button data-action="edit-section" data-id="${task.id}">Edit Title</button>
                      <button data-action="delete-task"  data-id="${task.id}" class="danger">Delete Section</button>
                    ` : `
                      <button data-action="edit-task"    data-id="${task.id}">Edit Task</button>
                      <button data-action="edit-dates"   data-id="${task.id}">Edit Dates</button>
                      <button data-action="change-color" data-id="${task.id}">Change Color</button>
                      <button data-action="delete-task"  data-id="${task.id}" class="danger">Delete Task</button>
                    `}
                  </div>
                </div>` : ''}
              <span class="gantt-task-title">${esc(task.title)}</span>
              ${!isSec && task.note ? `
                <button class="note-toggle-btn" data-toggle-note="${task.id}" title="${expanded ? 'Hide note' : 'Show note'}">${expanded ? '▲' : '▼'}</button>
              ` : ''}
            </div>
            ${!isSec && task.note && expanded ? `
              <div class="gantt-task-note">${esc(task.note)}</div>
            ` : ''}
          </div>
        </div>
        <div class="gantt-timeline-cell" style="width:${tw}px">
          ${tdLine ? `<div class="today-line" style="${tdLine}"></div>` : ''}
          ${bs ? `<div class="gantt-bar" style="${bs}"><span class="gantt-bar-label">${esc(task.title)}</span></div>` : ''}
        </div>
      </div>`;
  }

  // ============================================================
  // MODALS — HTML builders
  // ============================================================
  function modalLoginHtml(lockedMinutes) {
    const locked = !!lockedMinutes;
    return `
      <div class="modal-header">
        <h2>Login</h2>
        <button class="modal-close" id="modal-close-btn">×</button>
      </div>
      <form id="modal-form" autocomplete="on">
        <div class="modal-body">
          <div id="modal-err" class="modal-error"${locked ? '' : ' style="display:none"'}>${locked ? `Too many failed attempts. Please wait ${lockedMinutes} minute(s) before trying again.` : ''}</div>
          <div class="form-group">
            <label class="form-label" for="f-username">Username</label>
            <input type="text" id="f-username" name="username" autofocus required autocomplete="username"${locked ? ' disabled' : ''}>
          </div>
          <div class="form-group">
            <label class="form-label" for="f-password">Password</label>
            <input type="password" id="f-password" name="password" required autocomplete="current-password"${locked ? ' disabled' : ''}>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" id="modal-close-btn2">Cancel</button>
          <button type="submit" class="btn btn-primary"${locked ? ' disabled' : ''}>Login</button>
        </div>
      </form>`;
  }

  function modalTaskHtml(task, focusDates) {
    const isNew  = !task;
    const colors = COLORS.map(c =>
      `<div class="color-swatch${(task?.color || COLORS[0]) === c ? ' selected' : ''}"
            style="background:${c}" data-color="${c}" title="${c}"></div>`
    ).join('');

    return `
      <div class="modal-header">
        <h2>${isNew ? 'Add Task' : 'Edit Task'}</h2>
        <button class="modal-close" id="modal-close-btn">×</button>
      </div>
      <form id="modal-form">
        <div class="modal-body">
          <div id="modal-err" class="modal-error" style="display:none"></div>
          <div class="form-group">
            <label class="form-label" for="f-title">Title</label>
            <input type="text" id="f-title" value="${esc(task?.title || '')}" required ${focusDates ? '' : 'autofocus'}>
          </div>
          <div class="form-group">
            <label class="form-label" for="f-note">Note <span class="optional">(optional)</span></label>
            <textarea id="f-note" rows="3">${esc(task?.note || '')}</textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="f-start">Start Date</label>
              <input type="date" id="f-start" value="${esc(task?.start_date || isoToday())}" ${focusDates ? 'autofocus' : ''}>
            </div>
            <div class="form-group">
              <label class="form-label" for="f-end">End Date</label>
              <input type="date" id="f-end" value="${esc(task?.end_date || isoToday())}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Color</label>
            <div class="color-swatches" id="color-swatches">${colors}</div>
            <input type="hidden" id="f-color" value="${esc(task?.color || COLORS[0])}">
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" id="modal-close-btn2">Cancel</button>
          <button type="submit" class="btn btn-primary">${isNew ? 'Add Task' : 'Save Changes'}</button>
        </div>
      </form>`;
  }

  function modalSectionHtml(task) {
    const isNew = !task;
    return `
      <div class="modal-header">
        <h2>${isNew ? 'Add Section' : 'Edit Section'}</h2>
        <button class="modal-close" id="modal-close-btn">×</button>
      </div>
      <form id="modal-form">
        <div class="modal-body">
          <div id="modal-err" class="modal-error" style="display:none"></div>
          <div class="form-group">
            <label class="form-label" for="f-title">Section Title</label>
            <input type="text" id="f-title" value="${esc(task?.title || '')}" required autofocus>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" id="modal-close-btn2">Cancel</button>
          <button type="submit" class="btn btn-primary">${isNew ? 'Add Section' : 'Save Changes'}</button>
        </div>
      </form>`;
  }

  function modalChartHtml(chart) {
    const isNew = !chart;
    const defStart = chart?.view_start || isoToday();
    const defEnd   = chart?.view_end   || formatDate(addDays(today(), 30));
    return `
      <div class="modal-header">
        <h2>${isNew ? 'New Chart' : 'Edit Chart'}</h2>
        <button class="modal-close" id="modal-close-btn">×</button>
      </div>
      <form id="modal-form">
        <div class="modal-body">
          <div id="modal-err" class="modal-error" style="display:none"></div>
          <div class="form-group">
            <label class="form-label" for="f-title">Chart Title</label>
            <input type="text" id="f-title" value="${esc(chart?.title || '')}" required autofocus>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="f-start">View Start</label>
              <input type="date" id="f-start" value="${esc(defStart)}" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="f-end">View End</label>
              <input type="date" id="f-end" value="${esc(defEnd)}" required>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="f-mode">Default View</label>
            <select id="f-mode">
              <option value="week"${(chart?.view_mode||'week')==='week' ? ' selected':''}>Week</option>
              <option value="day"${chart?.view_mode==='day' ? ' selected':''}>Day</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" id="modal-close-btn2">Cancel</button>
          <button type="submit" class="btn btn-primary">${isNew ? 'Create Chart' : 'Save Changes'}</button>
        </div>
      </form>`;
  }

  // ============================================================
  // MODAL OPEN / CLOSE
  // ============================================================
  function openModal(html, onSubmit) {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    content.innerHTML = html;
    overlay.classList.remove('hidden');

    // Close buttons
    const close = () => closeModal();
    document.getElementById('modal-close-btn')?.addEventListener('click', close);
    document.getElementById('modal-close-btn2')?.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    // Color swatch selection
    document.querySelectorAll('.color-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
        sw.classList.add('selected');
        document.getElementById('f-color').value = sw.dataset.color;
      });
    });

    // Form submit
    const form = document.getElementById('modal-form');
    if (form && onSubmit) {
      form.addEventListener('submit', async e => {
        e.preventDefault();
        await onSubmit();
      });
    }
  }

  function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.add('hidden');
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
    el.className = 'toast' + (type ? ' ' + type : '');
    el.textContent = msg;
    tc.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  // ============================================================
  // ACTIONS
  // ============================================================

  // -- Auth --
  async function doLogin(username, password) {
    const res = await api('login', 'POST', { username, password });
    state.isLoggedIn = true;
    state.isAdmin    = !!res.is_admin;
    state.username   = res.username;
    state.userId     = res.user_id || null;
    toast('Logged in as ' + res.username, 'success');
    closeModal();
    rerenderApp();
  }

  async function doLogout() {
    await api('logout', 'POST');
    state.isLoggedIn = false;
    state.isAdmin    = false;
    state.username   = null;
    state.userId     = null;
    toast('Logged out');
    rerenderApp();
  }

  // -- View mode --
  async function setViewMode(mode) {
    if (!state.chart || state.chart.view_mode === mode) return;
    state.chart.view_mode = mode;
    await api('update_chart', 'POST', {
      id:         state.chart.id,
      title:      state.chart.title,
      view_start: state.chart.view_start,
      view_end:   state.chart.view_end,
      view_mode:  mode,
    });
    rerenderApp();
  }

  // -- Create chart --
  function promptCreateChart() {
    openModal(modalChartHtml(null), async () => {
      const title = document.getElementById('f-title').value.trim();
      const start = document.getElementById('f-start').value;
      const end   = document.getElementById('f-end').value;
      const mode  = document.getElementById('f-mode').value;
      if (!title || !start || !end) { showModalError('All fields are required.'); return; }
      if (start >= end) { showModalError('Start date must be before end date.'); return; }
      try {
        const res = await api('create_chart', 'POST', { title, view_start: start, view_end: end, view_mode: mode });
        window.location.href = '?c=' + res.slug;
      } catch (err) { showModalError(err.message); }
    });
  }

  // -- Edit chart --
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
        closeModal();
        toast('Chart updated', 'success');
        rerenderApp();
      } catch (err) { showModalError(err.message); }
    });
  }

  // -- Delete chart --
  async function deleteChart(id) {
    if (!confirm('Delete this chart and all its tasks?')) return;
    try {
      await api('delete_chart', 'POST', { id });
      state.charts = state.charts.filter(c => c.id !== id);
      toast('Chart deleted');
      rerenderApp();
    } catch (err) { toast(err.message, 'error'); }
  }

  // -- Add task --
  function promptAddTask() {
    openModal(modalTaskHtml(null, false), async () => {
      const title = document.getElementById('f-title').value.trim();
      const note  = document.getElementById('f-note').value.trim();
      const start = document.getElementById('f-start').value;
      const end   = document.getElementById('f-end').value;
      const color = document.getElementById('f-color').value;
      if (!title) { showModalError('Title is required.'); return; }
      try {
        const res = await api('create_task', 'POST', {
          chart_id: state.chart.id, type: 'task',
          title, note, start_date: start, end_date: end, color,
        });
        state.tasks.push(res.task);
        closeModal();
        toast('Task added', 'success');
        rerenderBody();
      } catch (err) { showModalError(err.message); }
    });
  }

  // -- Add section --
  function promptAddSection() {
    openModal(modalSectionHtml(null), async () => {
      const title = document.getElementById('f-title').value.trim();
      if (!title) { showModalError('Title is required.'); return; }
      try {
        const res = await api('create_task', 'POST', {
          chart_id: state.chart.id, type: 'section', title,
        });
        state.tasks.push(res.task);
        closeModal();
        toast('Section added', 'success');
        rerenderBody();
      } catch (err) { showModalError(err.message); }
    });
  }

  // -- Edit task --
  function promptEditTask(id, focusDates) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    const isSec = task.type === 'section';
    const html  = isSec ? modalSectionHtml(task) : modalTaskHtml(task, !!focusDates);

    openModal(html, async () => {
      const title = document.getElementById('f-title').value.trim();
      if (!title) { showModalError('Title is required.'); return; }

      const payload = { id, title };
      if (!isSec) {
        payload.note       = document.getElementById('f-note').value.trim();
        payload.start_date = document.getElementById('f-start').value;
        payload.end_date   = document.getElementById('f-end').value;
        payload.color      = document.getElementById('f-color').value;
      }
      try {
        const res = await api('update_task', 'POST', payload);
        const idx = state.tasks.findIndex(t => t.id === id);
        if (idx !== -1) state.tasks[idx] = res.task;
        closeModal();
        toast('Saved', 'success');
        rerenderBody();
      } catch (err) { showModalError(err.message); }
    });
  }

  // -- Delete task --
  async function deleteTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!confirm(`Delete "${task?.title}"?`)) return;
    try {
      await api('delete_task', 'POST', { id });
      state.tasks = state.tasks.filter(t => t.id !== id);
      state.openMenuId = null;
      toast('Deleted');
      rerenderBody();
    } catch (err) { toast(err.message, 'error'); }
  }

  // -- Toggle note --
  function toggleNote(id) {
    if (state.expandedNotes.has(id)) state.expandedNotes.delete(id);
    else state.expandedNotes.add(id);
    rerenderBody();
  }

  // ============================================================
  // DRAG & DROP (row reorder)
  // ============================================================
  function initDragDrop() {
    const body = document.getElementById('ganttBody');
    if (!body || !state.isLoggedIn) return;

    let dragId = null;
    let dragEl = null;

    body.addEventListener('dragstart', e => {
      const row = e.target.closest('.gantt-row');
      if (!row) return;
      dragId = parseInt(row.dataset.taskId);
      dragEl = row;
      row.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    body.addEventListener('dragend', () => {
      document.querySelectorAll('.gantt-row.dragging').forEach(r => r.classList.remove('dragging'));
      document.querySelectorAll('.gantt-row.drag-over').forEach(r => r.classList.remove('drag-over'));
      dragEl = null;
    });

    body.addEventListener('dragover', e => {
      e.preventDefault();
      const row = e.target.closest('.gantt-row');
      if (!row || parseInt(row.dataset.taskId) === dragId) return;
      document.querySelectorAll('.gantt-row.drag-over').forEach(r => r.classList.remove('drag-over'));
      row.classList.add('drag-over');
    });

    body.addEventListener('drop', async e => {
      e.preventDefault();
      const targetRow = e.target.closest('.gantt-row');
      if (!targetRow || !dragId) return;

      const targetId = parseInt(targetRow.dataset.taskId);
      if (targetId === dragId) return;

      // Reorder state.tasks
      const fromIdx = state.tasks.findIndex(t => t.id === dragId);
      const toIdx   = state.tasks.findIndex(t => t.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return;

      const moved = state.tasks.splice(fromIdx, 1)[0];
      state.tasks.splice(toIdx, 0, moved);

      // Persist
      try {
        await api('reorder_tasks', 'POST', {
          chart_id: state.chart.id,
          order: state.tasks.map(t => t.id),
        });
      } catch (err) { toast('Reorder failed: ' + err.message, 'error'); }

      rerenderBody();
    });
  }

  // ============================================================
  // RENDER HELPERS
  // ============================================================
  function rerenderApp() {
    const root = document.getElementById('app');
    if (state.page === 'home') {
      root.innerHTML = renderHome();
    } else {
      root.innerHTML = renderChart();
    }
    bindEvents();
    initDragDrop();
  }

  function rerenderBody() {
    // Only replace the task body + timeline header to avoid full re-render
    const body = document.getElementById('ganttBody');
    const header = document.getElementById('timelineHeader') || null;
    if (!body) { rerenderApp(); return; }

    const tw    = totalTimelineWidth();
    const tdLine = todayLineStyle();
    body.innerHTML = state.tasks.length === 0
      ? `<div class="empty-tasks">No tasks yet.${state.isLoggedIn ? ' Use "+ Task" or "+ Section" above.' : ' Login to add tasks.'}</div>`
      : state.tasks.map(t => renderTaskRow(t, tw, tdLine)).join('');

    if (header) {
      header.innerHTML = buildTimelineHeader();
      header.style.width = tw + 'px';
    }

    // Update table min-width
    const table = document.querySelector('.gantt-table');
    if (table) table.style.minWidth = `calc(var(--label-w) + ${tw}px)`;

    bindBodyEvents();
    initDragDrop();
  }

  // ============================================================
  // EVENT BINDING
  // ============================================================
  function bindEvents() {
    // Home page
    document.getElementById('btn-create-chart')?.addEventListener('click', promptCreateChart);
    document.getElementById('btn-login-modal')?.addEventListener('click', () => openLoginModal());
    document.getElementById('btn-logout')?.addEventListener('click', doLogout);
    document.getElementById('btn-manage-users')?.addEventListener('click', openUsersModal);

    // Chart page
    document.getElementById('btn-add-task')?.addEventListener('click', promptAddTask);
    document.getElementById('btn-add-section')?.addEventListener('click', promptAddSection);
    document.getElementById('btn-edit-chart')?.addEventListener('click', promptEditChart);

    // View toggle
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => setViewMode(btn.dataset.view));
    });

    // Delete chart (home page)
    document.querySelectorAll('[data-delete-chart]').forEach(btn => {
      btn.addEventListener('click', () => deleteChart(parseInt(btn.dataset.deleteChart)));
    });

    bindBodyEvents();
  }

  function bindBodyEvents() {
    // Kebab menus
    document.querySelectorAll('.kebab-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.menu);
        state.openMenuId = state.openMenuId === id ? null : id;
        // Toggle only this menu to avoid full re-render
        document.querySelectorAll('.kebab-menu').forEach(m => m.classList.remove('open'));
        if (state.openMenuId) {
          document.getElementById('menu-' + state.openMenuId)?.classList.add('open');
        }
      });
    });

    // Menu actions
    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        state.openMenuId = null;
        document.querySelectorAll('.kebab-menu').forEach(m => m.classList.remove('open'));
        switch (btn.dataset.action) {
          case 'edit-task':    promptEditTask(id, false); break;
          case 'edit-section': promptEditTask(id, false); break;
          case 'edit-dates':   promptEditTask(id, true);  break;
          case 'change-color': promptEditTask(id, false); break;
          case 'delete-task':  deleteTask(id);            break;
        }
      });
    });

    // Note toggle
    document.querySelectorAll('[data-toggle-note]').forEach(btn => {
      btn.addEventListener('click', () => toggleNote(parseInt(btn.dataset.toggleNote)));
    });

    // Close menus on outside click
    document.addEventListener('click', () => {
      if (state.openMenuId) {
        state.openMenuId = null;
        document.querySelectorAll('.kebab-menu').forEach(m => m.classList.remove('open'));
      }
    }, { capture: true, once: false });
  }

  function openLoginModal(lockedMinutes) {
    openModal(modalLoginHtml(lockedMinutes), async () => {
      const username = document.getElementById('f-username').value.trim();
      const password = document.getElementById('f-password').value;
      if (!username || !password) { showModalError('Both fields are required.'); return; }
      try {
        await doLogin(username, password);
      } catch (err) {
        // If locked out, re-render with lockout notice
        if (err.message && err.message.includes('wait')) {
          const mins = parseInt(err.message.match(/\d+/) || ['1']);
          closeModal();
          openLoginModal(isNaN(mins) ? 1 : mins);
        } else {
          showModalError(err.message);
        }
      }
    });
  }

  // ============================================================
  // USER MANAGEMENT MODAL
  // ============================================================
  async function openUsersModal() {
    let users = [];
    try {
      users = await api('list_users');
    } catch (err) {
      toast(err.message, 'error'); return;
    }
    renderUsersModal(users);
  }

  function renderUsersModal(users) {
    const rows = users.map(u => `
      <tr data-user-id="${u.id}">
        <td class="ut-name">${esc(u.username)}</td>
        <td class="ut-role">${u.is_admin ? '<span class="admin-badge">Admin</span>' : '<span class="user-badge">User</span>'}</td>
        <td class="ut-actions">
          <button class="btn btn-sm btn-outline" data-chpw="${u.id}" data-uname="${esc(u.username)}">Change PW</button>
          ${u.id !== state.userId ? `<button class="btn btn-sm btn-danger" data-deluser="${u.id}" data-uname="${esc(u.username)}">Delete</button>` : ''}
        </td>
      </tr>`).join('');

    const html = `
      <div class="modal-header">
        <h2>Manage Users</h2>
        <button class="modal-close" id="modal-close-btn">×</button>
      </div>
      <div class="modal-body" style="padding-bottom:8px">
        <table class="users-table">
          <thead><tr><th>Username</th><th>Role</th><th>Actions</th></tr></thead>
          <tbody id="users-tbody">${rows}</tbody>
        </table>
      </div>
      <div class="modal-body" style="border-top:1px solid var(--border);padding-top:16px">
        <h3 style="font-size:14px;margin-bottom:12px">Add New User</h3>
        <div id="add-user-err" class="modal-error" style="display:none"></div>
        <form id="add-user-form">
          <div class="form-row" style="margin-bottom:10px">
            <div class="form-group" style="margin-bottom:0">
              <input type="text" id="new-username" placeholder="Username" required minlength="3" autocomplete="off">
            </div>
            <div class="form-group" style="margin-bottom:0">
              <input type="password" id="new-password" placeholder="Password (min 6 chars)" required minlength="6" autocomplete="new-password">
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
            <label style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:500;cursor:pointer">
              <input type="checkbox" id="new-is-admin"> Grant Admin
            </label>
            <button type="submit" class="btn btn-primary btn-sm">Add User</button>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline" id="modal-close-btn2">Close</button>
      </div>`;

    // Use openModal but we need to re-bind events manually since it's a special modal
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    content.innerHTML = html;
    overlay.classList.remove('hidden');

    document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
    document.getElementById('modal-close-btn2')?.addEventListener('click', closeModal);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

    // Add user form
    document.getElementById('add-user-form').addEventListener('submit', async e => {
      e.preventDefault();
      const username = document.getElementById('new-username').value.trim();
      const password = document.getElementById('new-password').value;
      const isAdminU = document.getElementById('new-is-admin').checked;
      const errEl    = document.getElementById('add-user-err');
      errEl.style.display = 'none';
      try {
        await api('create_user', 'POST', { username, password, is_admin: isAdminU });
        toast(`User "${username}" created`, 'success');
        // Refresh modal
        closeModal();
        openUsersModal();
      } catch (err) {
        errEl.textContent   = err.message;
        errEl.style.display = 'block';
      }
    });

    // Delete user buttons
    document.querySelectorAll('[data-deluser]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id    = parseInt(btn.dataset.deluser);
        const uname = btn.dataset.uname;
        if (!confirm(`Delete user "${uname}"? This cannot be undone.`)) return;
        try {
          await api('delete_user', 'POST', { id });
          toast(`User "${uname}" deleted`);
          closeModal();
          openUsersModal();
        } catch (err) { toast(err.message, 'error'); }
      });
    });

    // Change password buttons
    document.querySelectorAll('[data-chpw]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id    = parseInt(btn.dataset.chpw);
        const uname = btn.dataset.uname;
        openChangePasswordModal(id, uname);
      });
    });
  }

  function openChangePasswordModal(userId, username) {
    const html = `
      <div class="modal-header">
        <h2>Change Password</h2>
        <button class="modal-close" id="modal-close-btn">×</button>
      </div>
      <form id="modal-form">
        <div class="modal-body">
          <p style="margin-bottom:14px;font-size:13px;color:var(--text-muted)">Setting new password for <strong>${esc(username)}</strong></p>
          <div id="modal-err" class="modal-error" style="display:none"></div>
          <div class="form-group">
            <label class="form-label" for="f-newpw">New Password</label>
            <input type="password" id="f-newpw" required minlength="6" autofocus autocomplete="new-password">
          </div>
          <div class="form-group">
            <label class="form-label" for="f-newpw2">Confirm Password</label>
            <input type="password" id="f-newpw2" required autocomplete="new-password">
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" id="modal-close-btn2">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Password</button>
        </div>
      </form>`;

    openModal(html, async () => {
      const pw  = document.getElementById('f-newpw').value;
      const pw2 = document.getElementById('f-newpw2').value;
      if (pw !== pw2) { showModalError('Passwords do not match.'); return; }
      if (pw.length < 6) { showModalError('Password must be at least 6 characters.'); return; }
      try {
        await api('change_password', 'POST', { user_id: userId, password: pw });
        toast(`Password updated for "${username}"`, 'success');
        closeModal();
        openUsersModal();
      } catch (err) { showModalError(err.message); }
    });
  }

  // ============================================================
  // INIT
  // ============================================================
  async function init() {
    // Check auth
    try {
      const auth = await api('check_auth');
      state.isLoggedIn = auth.loggedIn;
      state.isAdmin    = !!auth.is_admin;
      state.username   = auth.username;
      state.userId     = auth.user_id || null;
    } catch (_) { /* offline / pre-install — skip */ }

    const slug = window.GANTT_SLUG;

    if (slug) {
      // Chart view
      try {
        const [chartData, tasksData] = await Promise.all([
          api('get_chart&slug=' + encodeURIComponent(slug)),
          // We need chart id first — load tasks after
          Promise.resolve(null),
        ]);
        state.chart     = chartData;
        state.chartSlug = slug;
        state.page      = 'chart';

        const tasks = await api('get_tasks&chart_id=' + chartData.id);
        state.tasks = tasks;
      } catch (err) {
        // Chart not found — fall back to home with error
        document.getElementById('app').innerHTML =
          `<div style="text-align:center;padding:80px 20px;color:#666">
            <h2 style="margin-bottom:12px">Chart not found</h2>
            <p>The chart you're looking for doesn't exist or was deleted.</p>
            <a href="index.php" style="color:#4A90E2;margin-top:16px;display:inline-block">← Back to all charts</a>
          </div>`;
        return;
      }
    } else {
      // Home page
      state.page = 'home';
      try {
        state.charts = await api('list_charts');
      } catch (_) { state.charts = []; }
    }

    rerenderApp();
  }

  // Start
  init();

})();
