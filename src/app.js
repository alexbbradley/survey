/* survey/src/app.js — Typeform-style survey SPA */
'use strict';

(function () {

  // ── Tailwind class constants ───────────────────────────────────────────────
  const T = {
    // Buttons
    btn:     'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-colors cursor-pointer border-0',
    md:      'px-5 py-2.5 text-sm',
    lg:      'px-6 sm:px-8 py-3 text-base',
    sm:      'px-3 py-1.5 text-xs',
    primary: 'bg-green text-[#1a1a1a] hover:bg-greenlight',
    outline: 'bg-transparent border border-[#383838] text-[#fffbf5] hover:border-[#484848] hover:bg-[#2a2a2a]',
    danger:  'bg-red/10 border border-red/40 text-red hover:bg-red/20',
    // Inputs
    inp:     'w-full bg-transparent border-0 border-b-2 border-[#383838] focus:border-green outline-none text-[#fffbf5] py-2 transition-colors placeholder:text-[#484848]',
    ta:      'w-full bg-[#222222] border border-[#383838] focus:border-green outline-none text-[#fffbf5] p-4 rounded-xl transition-colors placeholder:text-[#484848] resize-none min-h-[140px]',
    lbl:     'block text-sm font-medium text-[#909090] mb-1',
    // Modal
    mHead:   'flex items-center justify-between px-6 py-4 border-b border-[#383838]',
    mBody:   'px-6 py-5',
    mFoot:   'flex items-center justify-end gap-3 px-6 py-4 border-t border-[#383838]',
    mClose:  'text-[#909090] hover:text-[#fffbf5] cursor-pointer text-xl leading-none bg-transparent border-0 p-0',
    mTitle:  'text-base font-semibold text-[#fffbf5]',
    mErr:    'text-red text-sm mt-1',
    // Badges
    adminBadge: 'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-green/20 text-green',
    userBadge:  'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#383838] text-[#909090]',
  };

  // ── Utilities ──────────────────────────────────────────────────────────────
  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async function api(action, method, body) {
    const opts = { method: method || 'GET', headers: {} };
    if (body) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const res  = await fetch(`api.php?action=${action}`, opts);
    const json = await res.json().catch(() => ({ error: 'Invalid server response' }));
    if (!res.ok) { const e = new Error(json.error || 'Request failed'); e.data = json; throw e; }
    return json;
  }

  function toast(msg, type) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    const colours = type === 'error'   ? 'bg-red/10 border-red/40 text-red'
                  : type === 'success' ? 'bg-green/10 border-green/40 text-green'
                  : 'bg-[#222222] border-[#383838] text-[#fffbf5]';
    el.className = `pointer-events-auto border rounded-xl px-4 py-3 text-sm font-medium shadow-lg toast ${colours}`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  // ── Modal ──────────────────────────────────────────────────────────────────
  function openModal(html, onSubmit) {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    content.innerHTML = html;
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    const form = content.querySelector('form');
    if (form && onSubmit) {
      form.addEventListener('submit', async e => {
        e.preventDefault();
        await onSubmit(form);
      });
    }
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); }, { once: true });
  }

  function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
    document.getElementById('modal-content').innerHTML = '';
  }

  // ── localStorage token per survey slug ────────────────────────────────────
  function getStoredToken(slug) {
    try { return localStorage.getItem('survey_token_' + slug) || null; }
    catch (_) { return null; }
  }
  function setStoredToken(slug, token) {
    try { localStorage.setItem('survey_token_' + slug, token); }
    catch (_) {}
  }
  function clearStoredToken(slug) {
    try { localStorage.removeItem('survey_token_' + slug); }
    catch (_) {}
  }

  // ── State ──────────────────────────────────────────────────────────────────
  const state = {
    // Auth
    isLoggedIn: false,
    isAdmin:    false,
    email:      null,
    userId:     null,
    // Routing
    page:        'loading', // 'loading'|'home'|'survey'|'responses'|'completed'|'not_found'
    surveySlug:  window.SURVEY_SLUG || null,
    surveyView:  window.SURVEY_VIEW || null,
    // Survey definition
    survey:      null,  // { title, description, thank_you, questions[] }
    // Session
    token:           null,
    currentQuestion: 0,
    maxReached:      0,   // furthest step index the user has reached
    answers:         {},  // { question_key: answer_value_string }
    // Admin
    surveys:      [],   // [{slug, title}] for home page
    responsesData: null, // { questions[], sessions[] }
    // UI
    saving: false,
    _keyHandler: null,
  };

  // ── Validation helpers ─────────────────────────────────────────────────────
  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }
  function isValidUrl(v) {
    try { new URL(v); return true; } catch (_) { return false; }
  }

  // ── Render app ─────────────────────────────────────────────────────────────
  function rerenderApp() {
    const app = document.getElementById('app');
    if (!app) return;
    switch (state.page) {
      case 'loading':
        app.innerHTML = `<div class="flex items-center justify-center h-screen bg-[#1a1a1a] text-[#909090]">Loading…</div>`;
        break;
      case 'home':
        app.innerHTML = renderHome();
        attachHomeEvents();
        break;
      case 'survey':
        app.innerHTML = renderSurvey();
        attachSurveyEvents();
        focusInput();
        break;
      case 'responses':
        app.innerHTML = renderResponses();
        attachResponsesEvents();
        break;
      case 'completed':
        app.innerHTML = renderCompleted();
        break;
      case 'not_found':
        app.innerHTML = renderNotFound();
        break;
    }
  }

  // ── Home page (admin) ──────────────────────────────────────────────────────
  function renderHome() {
    if (!state.isLoggedIn) {
      return `
        <div class="flex flex-col items-center justify-center min-h-screen bg-[#1a1a1a] px-6">
          <h1 class="text-2xl font-bold text-[#fffbf5] mb-2">Survey App</h1>
          <p class="text-[#909090] mb-8 text-sm">Admin login required</p>
          <button id="btn-login" class="${T.btn} ${T.md} ${T.primary}">Log in</button>
        </div>`;
    }

    const surveyCards = state.surveys.length
      ? state.surveys.map(s => `
          <div class="bg-[#222222] border border-[#383838] rounded-xl p-5 flex items-center justify-between gap-4">
            <div>
              <div class="font-semibold text-[#fffbf5]">${esc(s.title)}</div>
              <div class="text-xs text-[#909090] mt-0.5 font-mono">${esc(s.slug)}</div>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <a href="?s=${esc(s.slug)}" class="${T.btn} ${T.sm} ${T.outline}">Take survey</a>
              <a href="?s=${esc(s.slug)}&view=responses" class="${T.btn} ${T.sm} ${T.primary}">Responses</a>
            </div>
          </div>`).join('')
      : `<p class="text-[#909090] text-sm">No surveys found. Create a <code class="text-green font-mono">surveys/&lt;slug&gt;.php</code> file to get started.</p>`;

    return `
      <div class="min-h-screen bg-[#1a1a1a]">
        <header class="border-b border-[#383838] px-6 py-4 flex items-center justify-between">
          <span class="font-bold text-[#fffbf5]">Survey App</span>
          <div class="flex items-center gap-3">
            <span class="text-sm text-[#909090]">${esc(state.email)}</span>
            <span class="${state.isAdmin ? T.adminBadge : T.userBadge}">${state.isAdmin ? 'Admin' : 'User'}</span>
            <button id="btn-logout" class="${T.btn} ${T.sm} ${T.outline}">Log out</button>
          </div>
        </header>
        <main class="max-w-2xl mx-auto px-6 py-10">
          <h2 class="text-lg font-semibold text-[#fffbf5] mb-6">Surveys</h2>
          <div class="flex flex-col gap-3">${surveyCards}</div>
        </main>
      </div>`;
  }

  function attachHomeEvents() {
    document.getElementById('btn-login')?.addEventListener('click', openLoginModal);
    document.getElementById('btn-logout')?.addEventListener('click', async () => {
      await api('logout', 'POST');
      state.isLoggedIn = false;
      state.isAdmin    = false;
      state.email      = null;
      state.surveys    = [];
      rerenderApp();
    });
  }

  // ── Survey page ────────────────────────────────────────────────────────────

  /** Get the flat list of questions inside a step (group or single). */
  function getStepQuestions(step) {
    return step.type === 'group' ? step.questions : [step];
  }

  function renderSurvey() {
    const steps = state.survey.questions;

    // Intro page
    if (state.currentQuestion === -1) {
      const desc = state.survey.description || '';
      const paragraphs = desc.split(/\n\n+/).map(p => `<p class="text-[#c0c0c0] text-base leading-relaxed">${esc(p.trim())}</p>`).join('');
      return `
        <div class="relative min-h-screen bg-[#1a1a1a]">
          <div class="flex flex-col items-start justify-center min-h-screen px-8 py-16 max-w-2xl mx-auto w-full">
            <h1 class="text-3xl sm:text-4xl font-bold text-[#fffbf5] mb-8 leading-tight">${esc(state.survey.title)}</h1>
            <div class="flex flex-col gap-4 mb-10">${paragraphs}</div>
            <button id="btn-next" class="${T.btn} ${T.lg} ${T.primary}">Get started &rarr;</button>
          </div>
        </div>`;
    }

    const step   = steps[state.currentQuestion];
    const isLast = state.currentQuestion === steps.length - 1;
    const isGroup = step.type === 'group';
    const questions = getStepQuestions(step);

    // Keyboard hint: hide if any field is textarea/radio/ranking
    const hasTextarea = questions.some(q => q.type === 'textarea');
    const hasChoiceOnly = questions.every(q => q.type === 'radio' || q.type === 'ranking');
    const kbHint = hasChoiceOnly ? ''
      : hasTextarea ? `Press <kbd>Ctrl</kbd> + <kbd>Enter ↵</kbd> to continue`
      : `Press <kbd>Enter ↵</kbd> to continue`;

    const body = isGroup
      ? `${step.label ? `<h2 class="text-xl sm:text-2xl xl:text-3xl font-bold text-[#fffbf5] mb-8 leading-tight">${esc(step.label)}</h2>` : ''}
         <div class="flex flex-col gap-8 w-full">
           ${questions.map(q => `
             <div>
               <label class="text-lg font-semibold text-[#fffbf5] mb-3 block">
                 ${esc(q.label)}${q.required ? ' <span class="text-red">*</span>' : ''}
               </label>
               <div class="w-full" data-question-key="${esc(q.key)}">
                 ${renderQuestionInput(q)}
               </div>
             </div>`).join('')}
         </div>`
      : `<label class="text-xl sm:text-2xl font-bold text-[#fffbf5] mb-8 leading-tight block">
           ${esc(step.label)}${step.required ? ' <span class="text-red">*</span>' : ''}
         </label>
         <div class="w-full" id="question-input-wrap">
           ${renderQuestionInput(step)}
         </div>`;

    // Step bar segments — clickable for visited steps
    const stepBar = steps.map((_, i) => {
      const color = i < state.currentQuestion ? 'bg-green/40'
                  : i === state.currentQuestion ? 'bg-green'
                  : i <= state.maxReached ? 'bg-[#383838]'
                  : 'bg-[#2a2a2a]';
      const clickable = i <= state.maxReached && i !== state.currentQuestion;
      const cursor = clickable ? 'cursor-pointer hover:bg-green/60' : '';
      return `<div class="flex-1 h-3 sm:h-1.5 rounded sm:rounded-full ${color} ${cursor} transition-colors duration-300" data-step-nav="${i}"></div>`;
    }).join('');

    return `
      <div class="relative min-h-screen bg-[#1a1a1a]">
        <div class="fixed top-0 left-0 right-0 z-10 bg-[#1a1a1a] px-6 py-3">
          <div class="flex items-center justify-between">
            <span class="text-base font-semibold ">${esc(state.survey.title)}</span>
            <div class="relative flex-shrink-0 ml-4">
              <button id="btn-menu-toggle" class="w-8 h-8 flex items-center justify-center rounded-lg text-[#909090] hover:text-[#fffbf5] hover:bg-[#2a2a2a] transition-colors cursor-pointer bg-transparent border-0">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="3" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="13" r="1.5" fill="currentColor"/></svg>
              </button>
              <div id="popup-menu" class="hidden absolute right-0 top-10 bg-[#222222] border border-[#383838] rounded-xl shadow-lg py-1 min-w-[160px]">
                <button id="btn-start-over" class="w-full text-left px-4 py-2.5 text-sm text-[#fffbf5] hover:bg-[#2a2a2a] transition-colors cursor-pointer bg-transparent border-0">Start over</button>
              </div>
            </div>
          </div>
          <div class="flex gap-0.5 md:gap-1.5 max-w-2xl mx-auto mt-8">${stepBar}</div>
        </div>
        <div class="flex flex-col items-start justify-center min-h-screen px-6 sm:px-8 pt-24 pb-16 max-w-2xl mx-auto w-full">
          <p class="text-sm text-[#909090] mb-4">Page ${state.currentQuestion + 1} of ${steps.length}</p>
          ${body}
          <div id="validation-error" class="hidden text-red text-sm mt-3"></div>
          <div class="flex items-center gap-3 mt-8">
            ${state.currentQuestion >= 0 ? `<button id="btn-back" class="${T.btn} ${T.md} ${T.outline}">&larr; Back</button>` : ''}
            <button id="btn-next" class="${T.btn} ${T.md} ${T.primary}" ${state.saving ? 'disabled' : ''}>
              ${state.saving ? 'Submitting&hellip;' : isLast ? 'Submit' : 'Next &rarr;'}
            </button>
          </div>
          ${kbHint ? `<p class="text-xs text-[#484848] mt-4 hidden sm:block">${kbHint}</p>` : ''}
        </div>
      </div>`;
  }

  function renderQuestionInput(q) {
    const saved = state.answers[q.key] ?? '';
    switch (q.type) {
      case 'text':
        return `<input id="q-input" class="${T.inp} text-lg sm:text-xl" type="text" value="${esc(saved)}" placeholder="${esc(q.placeholder || '')}" autocomplete="${esc(q.autocomplete || 'off')}" maxlength="500">`;
      case 'email':
        return `<input id="q-input" class="${T.inp} text-lg sm:text-xl" type="email" value="${esc(saved)}" placeholder="${esc(q.placeholder || 'you@example.com')}" autocomplete="${esc(q.autocomplete || 'email')}">`;
      case 'url':
        return `<input id="q-input" class="${T.inp} text-lg sm:text-xl" type="url" value="${esc(saved)}" placeholder="${esc(q.placeholder || 'https://')}" autocomplete="${esc(q.autocomplete || 'url')}">`;
      case 'textarea':
        return `<textarea id="q-input" class="${T.ta} text-lg" maxlength="5000" placeholder="${esc(q.placeholder || '')}">${esc(saved)}</textarea>`;
      case 'radio':
        return renderRadioOptions(q, saved);
      case 'ranking':
        return renderRankingWidget(q, saved);
      default:
        return `<input id="q-input" class="${T.inp} text-xl" type="text" value="${esc(saved)}" autocomplete="off">`;
    }
  }

  function renderRadioOptions(q, saved) {
    const name = `q_radio_${q.key}`;
    return `<div class="radio-group flex flex-col gap-3 w-full max-w-lg" data-radio-key="${esc(q.key)}">` +
      q.options.map(opt => {
        const checked = saved === opt;
        return `<label class="flex items-center gap-4 px-5 py-4 rounded-xl border ${checked ? 'border-green bg-green/10' : 'border-[#383838] bg-[#222222]'} cursor-pointer hover:border-green/60 transition-colors">
          <input type="radio" name="${name}" value="${esc(opt)}" class="sr-only" ${checked ? 'checked' : ''}>
          <span class="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${checked ? 'border-green' : 'border-[#484848]'}">
            ${checked ? '<span class="w-3 h-3 rounded-full bg-green"></span>' : ''}
          </span>
          <span class="text-[#fffbf5] text-[16px]">${esc(opt)}</span>
        </label>`;
      }).join('') +
    `</div>`;
  }

  function renderRankingWidget(q, saved) {
    let items;
    try { items = JSON.parse(saved); } catch (_) { items = null; }
    const touched = Array.isArray(items) && items.length === q.items.length;
    if (!touched) {
      items = [...q.items];
    }

    const listItems = items.map((item, i) => `
      <li data-rank-item="${esc(item)}"
          draggable="true"
          class="flex items-center gap-3 px-4 py-3 bg-[#222222] border border-[#383838] rounded-xl mb-2 cursor-grab active:cursor-grabbing select-none transition-colors hover:border-[#484848]">
        <span class="text-[#484848] text-xl leading-none flex-shrink-0">⠿</span>
        <span class="flex-1 text-[#fffbf5] text-[16px]">${esc(item)}</span>
        <span class="text-xs text-[#fffbf5] flex-shrink-0 rank-num">${touched ? i + 1 : ''}</span>
      </li>`).join('');

    return `<ul class="rank-list w-full max-w-lg" data-rank-key="${esc(q.key)}">${listItems}</ul>
      <p class="text-xs text-[#484848] mt-2">Drag items to reorder — 1 is most important</p>`;
  }

  function attachSurveyEvents() {
    // Intro page — just wire up the start button
    if (state.currentQuestion === -1) {
      document.getElementById('btn-next')?.addEventListener('click', () => {
        state.currentQuestion = 0;
        rerenderApp();
        focusInput();
      });
      return;
    }

    const step = state.survey.questions[state.currentQuestion];
    const questions = getStepQuestions(step);

    document.getElementById('btn-next')?.addEventListener('click', handleNext);
    document.getElementById('btn-back')?.addEventListener('click', handleBack);
    document.getElementById('btn-start-over')?.addEventListener('click', handleStartOver);

    // Popup menu toggle
    const menuToggle = document.getElementById('btn-menu-toggle');
    const popupMenu  = document.getElementById('popup-menu');
    if (menuToggle && popupMenu) {
      menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        popupMenu.classList.toggle('hidden');
      });
      document.addEventListener('click', () => popupMenu.classList.add('hidden'));
    }

    // Step bar navigation
    document.querySelectorAll('[data-step-nav]').forEach(el => {
      el.addEventListener('click', () => {
        const target = parseInt(el.dataset.stepNav, 10);
        if (target === state.currentQuestion) return;
        if (target > state.maxReached) return;

        // Going forward — validate current step first
        if (target > state.currentQuestion) {
          const err = validateCurrentStep();
          if (err) { showValidationError(err); return; }
          collectCurrentAnswers();
        }

        removeKeyHandler();
        state.currentQuestion = target;
        rerenderApp();
        focusInput();
      });
    });

    questions.forEach(q => {
      // Radio: update selection highlight (auto-advance only for solo radios)
      const radioName = `q_radio_${q.key}`;
      document.querySelectorAll(`[name="${radioName}"]`).forEach(radio => {
        radio.addEventListener('change', () => {
          updateRadioVisuals(radio.value, q.key);
          state.answers[q.key] = radio.value;
          // Only auto-advance if this is the sole question on the page
          if (questions.length === 1) setTimeout(handleNext, 280);
        });
      });

      // Ranking drag-and-drop
      if (q.type === 'ranking') {
        initRankingDrag(q);
      }
    });

    // Keyboard shortcut
    const hasTextarea = questions.some(q => q.type === 'textarea');
    const hasChoiceOnly = questions.every(q => q.type === 'radio' || q.type === 'ranking');
    const keyHandler = (e) => {
      if (hasChoiceOnly) return;
      if (hasTextarea) {
        if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); handleNext(); }
      } else {
        if (e.key === 'Enter') { e.preventDefault(); handleNext(); }
      }
    };
    document.addEventListener('keydown', keyHandler);
    state._keyHandler = keyHandler;
  }

  function updateRadioVisuals(selectedValue, key) {
    const container = key
      ? document.querySelector(`[data-radio-key="${key}"]`)
      : document.querySelector('.radio-group');
    if (!container) return;
    container.querySelectorAll('label').forEach(label => {
      const input    = label.querySelector('input[type="radio"]');
      const circle   = label.querySelector('span:nth-child(2)');
      const isChecked = input && input.value === selectedValue;

      // Toggle border/bg on label
      label.classList.toggle('border-green',     isChecked);
      label.classList.toggle('bg-green/10',      isChecked);
      label.classList.toggle('border-[#383838]', !isChecked);
      label.classList.toggle('bg-[#222222]',     !isChecked);

      // Toggle circle indicator
      if (circle) {
        circle.classList.toggle('border-green',    isChecked);
        circle.classList.toggle('border-[#484848]', !isChecked);
        circle.innerHTML = isChecked ? '<span class="w-3 h-3 rounded-full bg-green"></span>' : '';
      }
    });
  }

  function focusInput() {
    setTimeout(() => {
      const el = document.getElementById('q-input')
               || document.querySelector('[data-question-key] input')
               || document.querySelector('[data-question-key] textarea');
      el?.focus();
    }, 50);
  }

  function getInputValue(q) {
    switch (q.type) {
      case 'radio': {
        const checked = document.querySelector(`[name="q_radio_${q.key}"]:checked`)
                     || document.querySelector('[name="q_radio"]:checked');
        return checked ? checked.value : (state.answers[q.key] || '');
      }
      case 'ranking':
        return getRankingValue(q.key) || state.answers[q.key] || '';
      default: {
        // In a group, find by data attribute; otherwise fall back to id
        const el = document.querySelector(`[data-question-key="${q.key}"] input, [data-question-key="${q.key}"] textarea`)
                || document.getElementById('q-input');
        return el ? el.value : (state.answers[q.key] || '');
      }
    }
  }

  function showValidationError(msg) {
    const el = document.getElementById('validation-error');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 4000);
  }

  function removeKeyHandler() {
    if (state._keyHandler) {
      document.removeEventListener('keydown', state._keyHandler);
      state._keyHandler = null;
    }
  }

  /** Validate all questions on the current step. Returns error message or null. */
  function validateCurrentStep() {
    const step = state.survey.questions[state.currentQuestion];
    const questions = getStepQuestions(step);
    for (const q of questions) {
      const value = getInputValue(q);
      if (q.required && q.type === 'ranking' && !state.answers[q.key]) return 'Please drag the items to set your preferred order.';
      if (q.required && !value.trim()) return `Please answer: ${q.label}`;
      if (q.type === 'email' && value && !isValidEmail(value)) return 'Please enter a valid email address.';
      if (q.type === 'url' && value && !isValidUrl(value)) return 'Please enter a valid URL (include https://).';
    }
    return null;
  }

  /** Collect all input values from the current step into state.answers. Returns the values. */
  function collectCurrentAnswers() {
    const step = state.survey.questions[state.currentQuestion];
    const questions = getStepQuestions(step);
    const values = {};
    for (const q of questions) {
      values[q.key] = getInputValue(q);
    }
    Object.assign(state.answers, values);
    return values;
  }

  async function handleNext() {
    if (state.saving) return;

    const err = validateCurrentStep();
    if (err) { showValidationError(err); return; }

    const values = collectCurrentAnswers();
    removeKeyHandler();

    const step = state.survey.questions[state.currentQuestion];
    const stepQuestions = getStepQuestions(step);
    const isLast = state.currentQuestion === state.survey.questions.length - 1;

    if (isLast) {
      state.saving = true;
      rerenderApp();
      try {
        for (const q of stepQuestions) {
          await api('save_answer', 'POST', {
            token:          state.token,
            question_key:   q.key,
            answer_value:   values[q.key],
            question_index: state.currentQuestion,
          });
        }
        await api('complete_survey', 'POST', { token: state.token });
        clearStoredToken(state.surveySlug);
        state.saving = false;
        state.page   = 'completed';
      } catch (err) {
        toast(err.message, 'error');
        state.saving = false;
      }
      rerenderApp();
      return;
    }

    // Fire-and-forget for non-final steps
    for (const q of stepQuestions) {
      api('save_answer', 'POST', {
        token:          state.token,
        question_key:   q.key,
        answer_value:   values[q.key],
        question_index: state.currentQuestion,
      }).catch(err => toast(err.message, 'error'));
    }

    state.currentQuestion += 1;
    state.maxReached = Math.max(state.maxReached, state.currentQuestion);
    rerenderApp();
    focusInput();
  }

  function handleBack() {
    if (state.currentQuestion <= -1) return;
    removeKeyHandler();
    state.currentQuestion -= 1;
    rerenderApp();
    focusInput();
  }

  async function handleStartOver() {
    removeKeyHandler();
    clearStoredToken(state.surveySlug);
    try {
      const session = await api('start_session', 'POST', { slug: state.surveySlug });
      setStoredToken(state.surveySlug, session.token);
      state.token           = session.token;
      state.answers         = {};
      state.currentQuestion = 0;
      state.maxReached      = 0;
    } catch (err) {
      toast(err.message, 'error');
    }
    rerenderApp();
    focusInput();
  }

  // ── Ranking drag-and-drop ──────────────────────────────────────────────────
  function initRankingDrag(q) {
    const list = document.querySelector(`[data-rank-key="${q.key}"]`);
    if (!list) return;

    let dragSrc = null;

    // ── Mouse / desktop drag ──
    list.addEventListener('dragstart', e => {
      dragSrc = e.target.closest('[data-rank-item]');
      if (!dragSrc) return;
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => { if (dragSrc) dragSrc.style.opacity = '0.4'; }, 0);
    });

    list.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const target = e.target.closest('[data-rank-item]');
      if (target && target !== dragSrc) {
        const rect  = target.getBoundingClientRect();
        const after = e.clientY > rect.top + rect.height / 2;
        list.insertBefore(dragSrc, after ? target.nextSibling : target);
      }
    });

    list.addEventListener('dragend', () => {
      if (dragSrc) dragSrc.style.opacity = '';
      dragSrc = null;
      updateRankNumbers();
      state.answers[q.key] = getRankingValue();
    });

    // ── Touch drag ──
    let touchItem = null;
    let touchClone = null;
    let touchOffsetY = 0;

    list.addEventListener('touchstart', e => {
      const li = e.target.closest('[data-rank-item]');
      if (!li) return;
      touchItem = li;
      const touch = e.touches[0];
      const rect = li.getBoundingClientRect();
      touchOffsetY = touch.clientY - rect.top;

      // Create a floating clone for visual feedback
      touchClone = li.cloneNode(true);
      touchClone.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;opacity:0.85;z-index:1000;pointer-events:none;`;
      document.body.appendChild(touchClone);

      li.style.opacity = '0.4';
    }, { passive: true });

    list.addEventListener('touchmove', e => {
      if (!touchItem) return;
      e.preventDefault();
      const touch = e.touches[0];

      // Move the floating clone
      if (touchClone) {
        touchClone.style.top = (touch.clientY - touchOffsetY) + 'px';
      }

      // Reorder in the list
      const target = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('[data-rank-item]');
      if (target && target !== touchItem && list.contains(target)) {
        const rect  = target.getBoundingClientRect();
        const after = touch.clientY > rect.top + rect.height / 2;
        list.insertBefore(touchItem, after ? target.nextSibling : target);
      }
    }, { passive: false });

    const endTouch = () => {
      if (!touchItem) return;
      touchItem.style.opacity = '';
      if (touchClone) { touchClone.remove(); touchClone = null; }
      touchItem = null;
      updateRankNumbers();
      state.answers[q.key] = getRankingValue();
    };
    list.addEventListener('touchend', endTouch);
    list.addEventListener('touchcancel', endTouch);
  }

  function updateRankNumbers() {
    document.querySelectorAll('[data-rank-item]').forEach((el, i) => {
      const num = el.querySelector('.rank-num');
      if (num) num.textContent = i + 1;
    });
  }

  function getRankingValue(key) {
    const container = key ? document.querySelector(`[data-rank-key="${key}"]`) : document;
    const items = [...(container || document).querySelectorAll('[data-rank-item]')];
    if (!items.length) return '';
    return JSON.stringify(items.map(el => el.dataset.rankItem));
  }

  // ── Completed page ─────────────────────────────────────────────────────────
  function renderCompleted() {
    const title = state.survey?.thank_you_title || 'Thank you!';
    const body  = state.survey?.thank_you || '';
    const paragraphs = body
      ? body.split(/\n\n+/).map(p => `<p class="text-[#c0c0c0] text-base leading-relaxed">${esc(p.trim())}</p>`).join('')
      : '<p class="text-[#909090] text-sm">Your responses have been recorded.</p>';
    return `
      <div class="flex flex-col items-center justify-center min-h-screen bg-[#1a1a1a] text-center px-8">
        <div class="w-16 h-16 rounded-full bg-green/20 flex items-center justify-center mb-6 text-2xl">✓</div>
        <h1 class="text-xl sm:text-2xl font-bold text-[#fffbf5] mb-4 max-w-lg">${esc(title)}</h1>
        <div class="flex flex-col gap-3 max-w-lg">${paragraphs}</div>
      </div>`;
  }

  // ── Not found page ─────────────────────────────────────────────────────────
  function renderNotFound() {
    return `
      <div class="flex flex-col items-center justify-center min-h-screen bg-[#1a1a1a] text-center px-8">
        <h1 class="text-2xl font-bold text-[#fffbf5] mb-3">Survey not found</h1>
        <p class="text-[#909090] text-sm">This survey doesn't exist or may have been removed.</p>
      </div>`;
  }

  // ── Responses page (admin) ─────────────────────────────────────────────────
  function renderResponses() {
    const { questions, sessions } = state.responsesData || { questions: [], sessions: [] };

    const colHeaders = questions.map(q =>
      `<th class="px-3 py-2 text-left text-xs font-medium text-[#909090] whitespace-nowrap max-w-[180px]">${esc(q.label)}</th>`
    ).join('');

    const rows = sessions.map(s => {
      const cells = questions.map(q => {
        const raw = s.answers?.[q.key] ?? '';
        let display = raw;
        if (q.type === 'ranking') {
          try {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) display = arr.join(' > ');
          } catch (_) {}
        }
        return `<td class="px-3 py-2 text-sm text-[#909090] max-w-[180px] truncate" title="${esc(display)}">${esc(display)}</td>`;
      }).join('');

      const completed = s.completed_at
        ? `<span class="text-green text-xs">${esc(s.completed_at)}</span>`
        : `<span class="text-[#484848] text-xs">partial</span>`;

      return `<tr class="border-b border-[#383838] hover:bg-[#2a2a2a]">
        <td class="px-3 py-2 text-xs font-mono text-[#484848]">${esc(s.session_token.substring(0, 8))}…</td>
        <td class="px-3 py-2 text-xs text-[#909090] whitespace-nowrap">${esc(s.created_at)}</td>
        <td class="px-3 py-2 whitespace-nowrap">${completed}</td>
        <td class="px-3 py-2 text-xs text-[#484848]">${esc(s.ip_address)}</td>
        ${cells}
      </tr>`;
    }).join('');

    const emptyState = sessions.length === 0
      ? `<tr><td colspan="${4 + questions.length}" class="px-3 py-10 text-center text-[#484848] text-sm">No responses yet.</td></tr>`
      : '';

    const completedCount = sessions.filter(s => s.completed_at).length;

    return `
      <div class="min-h-screen bg-[#1a1a1a]">
        <header class="border-b border-[#383838] px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div class="flex items-center gap-3">
            <a href="/" class="text-[#909090] hover:text-[#fffbf5] text-sm transition-colors">← All surveys</a>
            <span class="text-[#383838]">/</span>
            <span class="font-semibold text-[#fffbf5]">${esc(state.survey?.title || state.surveySlug)}</span>
            <code class="text-xs text-[#484848]">${esc(state.surveySlug)}</code>
          </div>
          <div class="flex items-center gap-2">
            <a href="?s=${esc(state.surveySlug)}" class="${T.btn} ${T.sm} ${T.outline}">Take survey</a>
            <a href="api.php?action=export_csv&slug=${esc(state.surveySlug)}" class="${T.btn} ${T.sm} ${T.primary}">Export CSV</a>
            <button id="btn-clear" class="${T.btn} ${T.sm} ${T.danger}">Clear all responses</button>
          </div>
        </header>
        <div class="px-6 py-6">
          <p class="text-sm text-[#909090] mb-4">
            ${sessions.length} response${sessions.length !== 1 ? 's' : ''} &nbsp;·&nbsp;
            ${completedCount} completed &nbsp;·&nbsp;
            ${sessions.length - completedCount} partial
          </p>
          <div class="overflow-x-auto rounded-xl border border-[#383838]">
            <table class="w-full bg-[#222222]">
              <thead class="border-b border-[#383838] bg-[#2a2a2a]">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-medium text-[#909090]">Session</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-[#909090] whitespace-nowrap">Started</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-[#909090]">Status</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-[#909090]">IP</th>
                  ${colHeaders}
                </tr>
              </thead>
              <tbody>${rows}${emptyState}</tbody>
            </table>
          </div>
        </div>
      </div>`;
  }

  function attachResponsesEvents() {
    document.getElementById('btn-clear')?.addEventListener('click', async () => {
      if (!confirm(`Delete ALL responses for "${state.survey?.title}"? This cannot be undone.`)) return;
      try {
        const r = await api('clear_responses', 'POST', { slug: state.surveySlug });
        toast(`Cleared ${r.deleted} response${r.deleted !== 1 ? 's' : ''}.`, 'success');
        const fresh = await api(`get_responses&slug=${state.surveySlug}`);
        state.responsesData = fresh;
        rerenderApp();
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  }

  // ── Login modal ────────────────────────────────────────────────────────────
  function openLoginModal() {
    openModal(`
      <div class="${T.mHead}">
        <span class="${T.mTitle}">Log in</span>
        <button class="${T.mClose}" id="modal-close-btn">&times;</button>
      </div>
      <form id="modal-form">
        <div class="${T.mBody} flex flex-col gap-4">
          <div>
            <label class="${T.lbl}">Email</label>
            <input class="${T.inp}" type="email" name="email" required autocomplete="email" placeholder="admin@example.com">
          </div>
          <div>
            <label class="${T.lbl}">Password</label>
            <input class="${T.inp}" type="password" name="password" required>
          </div>
          <p id="login-error" class="${T.mErr} hidden"></p>
        </div>
        <div class="${T.mFoot}">
          <button type="submit" class="${T.btn} ${T.md} ${T.primary}">Log in</button>
        </div>
      </form>`, async (form) => {
        const errEl = document.getElementById('login-error');
        errEl.classList.add('hidden');
        try {
          const fd  = new FormData(form);
          const res = await api('login', 'POST', {
            email:    fd.get('email'),
            password: fd.get('password'),
          });
          state.isLoggedIn = true;
          state.isAdmin    = res.is_admin;
          state.email      = res.email;
          state.userId     = res.user_id;
          closeModal();
          if (state.surveySlug && state.surveyView === 'responses') {
            await loadResponses();
          } else {
            if (state.isAdmin) {
              state.surveys = await api('list_surveys');
            }
            state.page = 'home';
          }
          rerenderApp();
        } catch (err) {
          errEl.textContent = err.message;
          errEl.classList.remove('hidden');
        }
      });

    document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
  }

  // ── Responses loader ───────────────────────────────────────────────────────
  async function loadResponses() {
    try {
      const r = await api(`get_responses&slug=${state.surveySlug}`);
      state.responsesData = r;
      state.page = 'responses';
    } catch (err) {
      toast(err.message, 'error');
      state.page = 'not_found';
    }
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  async function init() {
    // 1. Check auth
    try {
      const auth = await api('check_auth');
      state.isLoggedIn = auth.loggedIn;
      state.isAdmin    = auth.is_admin;
      state.email      = auth.email;
      state.userId     = auth.user_id;
    } catch (_) {}

    const slug = state.surveySlug;

    if (slug) {
      // 2. Load survey definition
      try {
        state.survey = await api(`get_survey&slug=${slug}`);
      } catch (_) {
        state.page = 'not_found';
        rerenderApp();
        return;
      }

      // 3. Responses view (admin only)
      if (state.surveyView === 'responses') {
        if (!state.isAdmin) {
          // Render a background and pop the login modal
          state.page = 'not_found';
          rerenderApp();
          openLoginModal();
          return;
        }
        await loadResponses();
        rerenderApp();
        return;
      }

      // 4. Take survey flow
      const storedToken = getStoredToken(slug);
      try {
        const session = await api('start_session', 'POST', {
          slug,
          token: storedToken,
        });
        setStoredToken(slug, session.token);
        state.token           = session.token;
        state.answers         = session.answers || {};
        // Show intro for new sessions, resume at saved position otherwise
        const isNew = session.current_question === 0 && Object.keys(state.answers).length === 0;
        state.currentQuestion = isNew ? -1 : session.current_question;
        state.maxReached      = session.current_question;
        state.page            = 'survey';
      } catch (err) {
        if (err.message === 'already_completed') {
          if (err.data) {
            state.survey = state.survey || {};
            if (err.data.thank_you_title) state.survey.thank_you_title = err.data.thank_you_title;
            if (err.data.thank_you) state.survey.thank_you = err.data.thank_you;
          }
          state.page = 'completed';
        } else {
          toast(err.message, 'error');
          state.page = 'not_found';
        }
      }

    } else {
      // 5. Home page
      if (state.isAdmin) {
        try { state.surveys = await api('list_surveys'); } catch (_) {}
      }
      state.page = 'home';
    }

    rerenderApp();
  }

  init();

})();
