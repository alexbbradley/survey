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
    outlineLight: 'bg-transparent border border-[#cccccc] text-[#1a1a1a] hover:border-[#a0a0a0] hover:bg-[#f4f4f5]',
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

  async function api(action, method, body, timeoutMs) {
    const opts = { method: method || 'GET', headers: {} };
    if (body) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), timeoutMs || 20000);
    opts.signal = ctrl.signal;
    let res;
    try {
      res = await fetch(`api.php?action=${action}`, opts);
    } catch (e) {
      if (e.name === 'AbortError') throw new Error('Request timed out — check your connection');
      throw e;
    } finally {
      clearTimeout(timeoutId);
    }
    let json, parseFailed = false;
    try { json = await res.json(); } catch (_) { parseFailed = true; json = {}; }
    if (!res.ok || parseFailed) {
      const e = new Error(json.error || (parseFailed ? 'Invalid server response' : 'Request failed'));
      e.data = json;
      throw e;
    }
    return json;
  }

  function showFatalError(err) {
    console.error('Survey app failed to initialise:', err);
    if (window.__shownError) return;
    window.__shownError = true;
    if (window.__loadGuard) clearTimeout(window.__loadGuard);
    const app = document.getElementById('app');
    if (!app) return;
    const detail = err && err.message ? String(err.message).replace(/[<>&]/g, '') : '';
    app.innerHTML =
      '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#1a1a1a;padding:24px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">' +
        '<div style="max-width:420px;width:100%;background:#222;border:1px solid #383838;border-radius:12px;padding:28px;text-align:center;color:#fffbf5;">' +
          '<h1 style="font-size:18px;font-weight:600;margin:0 0 8px;">Something went wrong</h1>' +
          '<p style="font-size:14px;color:#909090;margin:0 0 20px;line-height:1.5;">We couldn\'t load the survey. Please check your connection and try again.</p>' +
          '<button onclick="location.reload()" style="background:#b8ff5c;color:#1a1a1a;border:0;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;cursor:pointer;">Reload</button>' +
          (detail ? '<p style="font-size:11px;color:#606060;margin:16px 0 0;word-break:break-word;">' + detail + '</p>' : '') +
        '</div>' +
      '</div>';
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
    shareToken:  window.SURVEY_SHARE_TOKEN || null, // public-share viewer
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
    selectedSessions: new Set(), // tokens of sessions selected for bulk actions
    emailSort: null,     // null | 'asc' | 'desc' — admin table sort on email column
    aiSummaries: {},     // { question_key: { summary_md, response_count, generated_at } }
    aiBusy:      {},     // { question_key: true } while a generate request is in-flight
    aiErrors:    {},     // { question_key: errorMessage } from the most recent failed generate
    shareInfo:   null,   // { token, url, created_at } | null  (admin only)
    // UI
    saving: false,
    _keyHandler: null,
  };

  /** True when the current page view is the public share-token view (read-only, non-admin). */
  function isShareView() {
    return !!state.shareToken;
  }

  // ── Validation helpers ─────────────────────────────────────────────────────
  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }
  function isValidUrl(v) {
    try { new URL(v); return true; } catch (_) { return false; }
  }

  // ── Render app ─────────────────────────────────────────────────────────────
  let mounted = false;
  function rerenderApp() {
    const app = document.getElementById('app');
    if (!app) return;
    if (!mounted && state.page !== 'loading') {
      mounted = true;
      window.__APP_MOUNTED = true;
      if (window.__loadGuard) clearTimeout(window.__loadGuard);
    }
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
          <div class="max-w-md w-full text-center">
            <h1 class="text-2xl font-bold text-[#fffbf5] mb-3">Survey Admin</h1>
            <p class="text-[#909090] mb-2 text-sm leading-relaxed">This area is for administrators only.</p>
            <p class="text-[#909090] mb-8 text-sm leading-relaxed">
              If you're here to complete a survey, please check the link you were sent. Survey links look like
              <code class="text-green font-mono bg-[#222222] px-1.5 py-0.5 rounded text-xs">/?s=survey-name</code>.
            </p>
            <button id="btn-login" class="${T.btn} ${T.md} ${T.primary}">Log in</button>
          </div>
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
    if (!step || typeof step !== 'object') return [];
    if (step.type === 'group') {
      return Array.isArray(step.questions)
        ? step.questions.filter(q => q && typeof q === 'object')
        : [];
    }
    return [step];
  }

  function getSurveyStepsCount() {
    return Array.isArray(state.survey?.questions) ? state.survey.questions.length : 0;
  }

  function clampSurveyProgress() {
    const total = getSurveyStepsCount();
    if (!total) {
      throw new Error('Survey has no questions configured');
    }
    const maxIndex = total - 1;
    if (state.currentQuestion > maxIndex) state.currentQuestion = maxIndex;
    if (state.maxReached > maxIndex) state.maxReached = maxIndex;
    if (state.currentQuestion < -1) state.currentQuestion = -1;
    if (state.maxReached < 0) state.maxReached = 0;
  }

  function renderSurvey() {
    const steps = Array.isArray(state.survey?.questions) ? state.survey.questions : [];
    if (!steps.length) {
      return renderNotFound();
    }

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
    if (!step || typeof step !== 'object') {
      return renderNotFound();
    }
    const isLast = state.currentQuestion === steps.length - 1;
    const isGroup = step.type === 'group';
    const isTwoCol = isGroup && step.layout === 'two-col';
    const isWideStep = isTwoCol;
    const questions = getStepQuestions(step);
    if (!questions.length) {
      return renderNotFound();
    }

    // Keyboard hint: hide if any field is textarea/radio/ranking
    const hasTextarea = questions.some(q => q.type === 'textarea');
    const hasChoiceOnly = questions.every(q => q.type === 'radio' || q.type === 'ranking' || q.type === 'checkbox');
    const kbHint = hasChoiceOnly ? ''
      : hasTextarea ? `Press <kbd>Ctrl</kbd> + <kbd>Enter ↵</kbd> to continue`
      : `Press <kbd>Enter ↵</kbd> to continue`;

    const descHtml = (q) => q.description
      ? `<p class="text-base text-[#909090] mb-3">${esc(q.description)}</p>` : '';

    const groupDescHtml = (isGroup && step.description)
      ? `<p class="text-base text-[#c0c0c0] mb-6 leading-relaxed">${esc(step.description)}</p>` : '';

    const body = isGroup
      ? `${step.label ? `<h2 class="text-xl sm:text-2xl xl:text-3xl font-bold text-[#fffbf5] mb-4 leading-tight">${esc(step.label)}</h2>` : ''}
         ${groupDescHtml}
         <div class="${isTwoCol ? 'grid md:grid-cols-2 gap-10 md:gap-8' : 'flex flex-col gap-12'} w-full"${step.paired_exclusive ? ' data-paired-exclusive="1"' : ''}>
           ${questions.map(q => {
             const useLabel = q.type !== 'radio' && q.type !== 'ranking' && q.type !== 'checkbox';
             const tag = useLabel ? 'label' : 'p';
             const forAttr = useLabel ? ` for="q-${esc(q.key)}"` : '';
             return `
             <div>
               <${tag}${forAttr} class="text-lg font-semibold text-[#fffbf5] mb-1 block">
                 ${esc(q.label)}${q.required ? ' <span class="text-red">*</span>' : ''}
               </${tag}>
               ${descHtml(q)}
               <div class="w-full" data-question-key="${esc(q.key)}">
                 ${renderQuestionInput(q, { wide: isTwoCol })}
               </div>
             </div>`;
           }).join('')}
         </div>`
      : `<${step.type !== 'radio' && step.type !== 'ranking' && step.type !== 'checkbox' ? `label for="q-${esc(step.key)}"` : 'p'} class="text-xl sm:text-2xl font-bold text-[#fffbf5] mb-3 leading-tight block">
           ${esc(step.label)}${step.required ? ' <span class="text-red">*</span>' : ''}
         </${step.type !== 'radio' && step.type !== 'ranking' && step.type !== 'checkbox' ? 'label' : 'p'}>
         ${descHtml(step)}
         <div class="w-full mt-5" id="question-input-wrap">
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
        <div class="fixed top-0 left-0 right-0 z-10 bg-[#1a1a1a] ">
          <div class="flex items-center justify-between px-6 pt-6 lg:pb-6">
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
          <div class="px-6 sm:px-8 flex gap-0.5 md:gap-1.5 ${isWideStep ? 'max-w-4xl' : 'max-w-2xl'} mx-auto mt-8">${stepBar}</div>
        </div>
        <div class="flex flex-col items-start justify-center min-h-screen px-6 sm:px-8 pt-36 pb-16 ${isWideStep ? 'max-w-4xl' : 'max-w-2xl'} mx-auto w-full">
          <p class="text-sm text-[#909090] mb-4">Page ${state.currentQuestion + 1} of ${steps.length}</p>
          ${body}
          <div id="validation-error" class="hidden text-red text-sm mt-3"></div>
          <div class="flex items-center gap-3 mt-8">
            ${state.currentQuestion >= 0 ? `<button id="btn-back" class="${T.btn} ${T.md} ${T.outline}">&larr; Back</button>` : ''}
            <button id="btn-next" class="${T.btn} ${T.md} ${T.primary}" ${state.saving ? 'disabled' : ''}>
              ${state.saving ? 'Submitting&hellip;' : isLast ? 'Submit' : 'Next &rarr;'}
            </button>
          </div>
          ${kbHint ? `<p class="text-xs text-[#484848] mt-8 hidden sm:block">${kbHint}</p>` : ''}
        </div>
      </div>`;
  }

  function renderQuestionInput(q, opts) {
    const saved = state.answers[q.key] ?? '';
    const id = `q-${q.key || 'input'}`;
    switch (q.type) {
      case 'text':
        return `<input id="${id}" class="${T.inp} text-base xl:text-lg" type="text" value="${esc(saved)}" placeholder="${esc(q.placeholder || '')}" autocomplete="${esc(q.autocomplete || 'off')}" maxlength="500">`;
      case 'email':
        return `<input id="${id}" class="${T.inp} text-base xl:text-lg" type="email" value="${esc(saved)}" placeholder="${esc(q.placeholder || 'you@example.com')}" autocomplete="${esc(q.autocomplete || 'email')}">`;
      case 'url':
        return `<input id="${id}" class="${T.inp} text-base xl:text-lg" type="url" value="${esc(saved)}" placeholder="${esc(q.placeholder || 'https://')}" autocomplete="${esc(q.autocomplete || 'url')}">`;
      case 'textarea':
        return `<textarea id="${id}" class="${T.ta} xl:text-lg text-base" maxlength="5000" placeholder="${esc(q.placeholder || '')}">${esc(saved)}</textarea>`;
      case 'radio':
        return renderRadioOptions(q, saved);
      case 'checkbox':
        return renderCheckboxOptions(q, saved, opts);
      case 'ranking':
        return renderRankingWidget(q, saved);
      default:
        return `<input id="${id}" class="${T.inp} text-xl" type="text" value="${esc(saved)}" autocomplete="off">`;
    }
  }

  function renderRadioOptions(q, saved) {
    const name = `q_radio_${q.key}`;
    return `<div class="radio-group flex flex-col gap-3 w-full max-w-lg" data-radio-key="${esc(q.key)}">` +
      q.options.map(opt => {
        const label = typeof opt === 'object' ? opt.label : opt;
        const desc  = typeof opt === 'object' ? opt.description : '';
        const value = label;
        const checked = saved === value;
        return `<label class="flex items-center gap-4 px-5 py-4 rounded-xl border ${checked ? 'border-green bg-green/10' : 'border-[#383838] bg-[#222222]'} cursor-pointer hover:border-green/60 transition-colors">
          <input type="radio" name="${name}" value="${esc(value)}" class="sr-only" ${checked ? 'checked' : ''}>
          <span class="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${checked ? 'border-green' : 'border-[#484848]'}">
            ${checked ? '<span class="w-3 h-3 rounded-full bg-green"></span>' : ''}
          </span>
          <div class="flex flex-col">
            <span class="text-[#fffbf5] text-[16px]">${esc(label)}</span>
            ${desc ? `<span class="text-[#909090] text-sm mt-0.5">${esc(desc)}</span>` : ''}
          </div>
        </label>`;
      }).join('') +
    `</div>`;
  }

  function renderCheckboxOptions(q, saved, opts) {
    let selected = [];
    try { const p = JSON.parse(saved); if (Array.isArray(p)) selected = p; } catch (_) {}
    const maxHint = q.max ? `<p class="text-xs text-[#484848] mb-3">Select up to ${q.max}</p>` : '';
    const widthCls = opts && opts.wide ? 'w-full' : 'w-full max-w-lg';
    return maxHint + `<div class="checkbox-group flex flex-col gap-3 ${widthCls}" data-checkbox-key="${esc(q.key)}" data-checkbox-max="${q.max || 0}">` +
      q.options.map(opt => {
        const label = typeof opt === 'object' ? opt.label : opt;
        const desc  = typeof opt === 'object' ? opt.description : '';
        const value = label;
        const checked = selected.includes(value);
        return `<label class="flex items-center gap-4 px-5 py-4 rounded-xl border ${checked ? 'border-green bg-green/10' : 'border-[#383838] bg-[#222222]'} cursor-pointer hover:border-green/60 transition-colors">
          <input type="checkbox" value="${esc(value)}" class="sr-only" ${checked ? 'checked' : ''}>
          <span class="w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${checked ? 'border-green bg-green' : 'border-[#484848]'}">
            ${checked ? '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}
          </span>
          <div class="flex flex-col">
            <span class="text-[#fffbf5] text-[16px]">${esc(label)}</span>
            ${desc ? `<span class="text-[#909090] text-sm mt-0.5">${esc(desc)}</span>` : ''}
          </div>
        </label>`;
      }).join('') +
    `</div>`;
  }

  /** Fisher-Yates shuffle (in-place). */
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function renderRankingWidget(q, saved) {
    let items;
    try { items = JSON.parse(saved); } catch (_) { items = null; }
    const touched = Array.isArray(items) && items.length === q.items.length;
    if (!touched) {
      items = shuffle([...q.items]);
    }

    const listItems = items.map((item, i) => `
      <li data-rank-item="${esc(item)}"
          draggable="true"
          class="flex items-center gap-3 px-4 py-3 bg-[#222222] border border-[#383838] rounded-xl mb-2 cursor-grab active:cursor-grabbing select-none transition-colors hover:border-[#484848]">
        <span class="text-[#484848] text-xl leading-none flex-shrink-0">⠿</span>
        <span class="flex-1 text-[#fffbf5] text-[16px]">${esc(item)}</span>
        <span class="text-xs text-[#fffbf5] flex-shrink-0 rank-num">${touched ? i + 1 : ''}</span>
      </li>`).join('');

    return `<ul class="rank-list w-full max-w-lg" data-rank-key="${esc(q.key)}">${listItems}</ul>`;
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

      // Checkbox: update visuals, enforce max
      if (q.type === 'checkbox') {
        const container = document.querySelector(`[data-checkbox-key="${q.key}"]`);
        if (container) {
          const max = parseInt(container.dataset.checkboxMax, 10) || 0;
          container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => {
              const checked = [...container.querySelectorAll('input[type="checkbox"]:checked')];
              if (max && checked.length > max) {
                cb.checked = false;
                showValidationError(`You can only select up to ${max}`);
                return;
              }
              const selected = checked.map(x => x.value);
              state.answers[q.key] = JSON.stringify(selected);
              updateCheckboxVisuals(q.key);

              // Paired-exclusive: grey out matching values in sibling lists.
              const pairedGrid = container.closest('[data-paired-exclusive]');
              if (pairedGrid) syncPairedDisabled(pairedGrid);
            });
          });
        }
      }

      // Ranking drag-and-drop
      if (q.type === 'ranking') {
        initRankingDrag(q);
      }
    });

    // Initial paired-exclusive sync (covers options pre-checked from saved state)
    document.querySelectorAll('[data-paired-exclusive]').forEach(grid => syncPairedDisabled(grid));

    // Keyboard shortcut
    const hasTextarea = questions.some(q => q.type === 'textarea');
    const hasChoiceOnly = questions.every(q => q.type === 'radio' || q.type === 'ranking' || q.type === 'checkbox');
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

  /**
   * For a paired-exclusive group: grey out any unchecked option whose value
   * is selected in a sibling list. Items already checked in the current list
   * are never disabled (so the user can always uncheck their own selection).
   */
  function syncPairedDisabled(grid) {
    const lists = [...grid.querySelectorAll('[data-checkbox-key]')];
    const selectedByList = new Map();
    lists.forEach(list => {
      const vals = new Set([...list.querySelectorAll('input[type="checkbox"]:checked')].map(cb => cb.value));
      selectedByList.set(list, vals);
    });
    lists.forEach(list => {
      const otherSelected = new Set();
      selectedByList.forEach((vals, otherList) => {
        if (otherList === list) return;
        vals.forEach(v => otherSelected.add(v));
      });
      list.querySelectorAll('label').forEach(label => {
        const cb = label.querySelector('input[type="checkbox"]');
        if (!cb) return;
        const shouldDisable = !cb.checked && otherSelected.has(cb.value);
        cb.disabled = shouldDisable;
        label.classList.toggle('opacity-40', shouldDisable);
        label.classList.toggle('pointer-events-none', shouldDisable);
        label.classList.toggle('cursor-not-allowed', shouldDisable);
      });
    });
  }

  function updateCheckboxVisuals(key) {
    const container = document.querySelector(`[data-checkbox-key="${key}"]`);
    if (!container) return;
    container.querySelectorAll('label').forEach(label => {
      const input = label.querySelector('input[type="checkbox"]');
      const box   = label.querySelector('span:nth-child(2)');
      const isChecked = input && input.checked;

      label.classList.toggle('border-green',     isChecked);
      label.classList.toggle('bg-green/10',      isChecked);
      label.classList.toggle('border-[#383838]', !isChecked);
      label.classList.toggle('bg-[#222222]',     !isChecked);

      if (box) {
        box.classList.toggle('border-green', isChecked);
        box.classList.toggle('bg-green',     isChecked);
        box.classList.toggle('border-[#484848]', !isChecked);
        box.innerHTML = isChecked
          ? '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
          : '';
      }
    });
  }

  function focusInput() {
    setTimeout(() => {
      const step = state.survey?.questions?.[state.currentQuestion];
      if (!step) return;
      const qs = getStepQuestions(step);
      const el = document.getElementById(`q-${qs[0]?.key}`)
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
      case 'checkbox': {
        const container = document.querySelector(`[data-checkbox-key="${q.key}"]`);
        if (!container) return state.answers[q.key] || '';
        const checked = [...container.querySelectorAll('input[type="checkbox"]:checked')].map(x => x.value);
        return JSON.stringify(checked);
      }
      default: {
        const el = document.getElementById(`q-${q.key}`);
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
      if (q.required && q.type === 'checkbox') {
        try { const arr = JSON.parse(value); if (!Array.isArray(arr) || arr.length === 0) return `Please answer: ${q.label}`; }
        catch (_) { return `Please answer: ${q.label}`; }
      }
      if (q.required && q.type !== 'checkbox' && !value.trim()) return `Please answer: ${q.label}`;
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
      state.currentQuestion = -1;
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
      ? body.split(/\n\s*\n/).map(p => `<p class="text-[#c0c0c0] text-base leading-relaxed">${p.trim()}</p>`).join('')
      : '<p class="text-[#909090] text-sm">Your responses have been recorded.</p>';
    return `
      <div class="flex flex-col items-center justify-center min-h-screen bg-[#1a1a1a] text-center px-8">
        <div class="w-16 h-16 rounded-full bg-green flex items-center justify-center mb-6 text-2xl text-black">✓</div>
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

  // ── Bar charts (ranking + checkbox tallies) ───────────────────────────────
  /**
   * Borda count: for N items, 1st place = N pts, 2nd = N-1, … last = 1.
   * Returns sorted array of { label, score, pct }.
   */
  function buildRankingChart(q, sessions) {
    const validAnswers = sessions
      .map(s => { try { return JSON.parse(s.answers?.[q.key] || ''); } catch (_) { return null; } })
      .filter(a => Array.isArray(a) && a.length === q.items.length);

    if (!validAnswers.length) return null;

    const n = q.items.length;
    const scores = {};
    q.items.forEach(item => scores[item] = 0);

    validAnswers.forEach(ranking => {
      ranking.forEach((item, i) => {
        if (scores[item] !== undefined) scores[item] += (n - i);
      });
    });

    const maxScore = Math.max(...Object.values(scores));
    return {
      bars: Object.entries(scores)
        .sort((a, b) => b[1] - a[1])
        .map(([label, score]) => ({
          label,
          score,
          pct: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
        })),
      responseCount: validAnswers.length,
    };
  }

  /** Tally selections across sessions for a radio question (one pick per respondent). */
  function buildRadioChart(q, sessions) {
    const tally = {};
    let responseCount = 0;
    sessions.forEach(s => {
      const raw = String(s.answers?.[q.key] ?? '').trim();
      if (!raw) return;
      responseCount++;
      tally[raw] = (tally[raw] || 0) + 1;
    });
    if (!Object.keys(tally).length) return null;
    const max = Math.max(...Object.values(tally));
    return {
      bars: Object.entries(tally)
        .sort((a, b) => b[1] - a[1])
        .map(([label, score]) => ({
          label,
          score,
          pct: max > 0 ? Math.round((score / max) * 100) : 0,
        })),
      responseCount,
    };
  }

  /** Tally selections across sessions for a checkbox question. */
  function buildCheckboxChart(q, sessions) {
    const tally = {};
    let responseCount = 0;
    sessions.forEach(s => {
      const raw = (s.answers?.[q.key] ?? '').trim();
      if (!raw) return;
      try {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length) {
          responseCount++;
          arr.forEach(opt => { tally[opt] = (tally[opt] || 0) + 1; });
        }
      } catch (_) {}
    });
    if (!Object.keys(tally).length) return null;
    const max = Math.max(...Object.values(tally));
    return {
      bars: Object.entries(tally)
        .sort((a, b) => b[1] - a[1])
        .map(([label, score]) => ({
          label,
          score,
          pct: max > 0 ? Math.round((score / max) * 100) : 0,
        })),
      responseCount,
    };
  }

  /** Brand palette for chart bars (cycles by bar index). */
  const CHART_PALETTE   = ['#A4CCC4', '#B1D0A1', '#C6B239', '#665D26', '#E3903F', '#F0712E', '#D2708A', '#782047', '#6677B6'];
  const CHART_BG_CREAM  = '#F9F7F4';

  /** Vertical bars HTML for the responses page (light theme). */
  function renderVerticalBars(data) {
    const cols = data.map((d, i) => `
      <div class="flex flex-col items-center gap-1 flex-1 min-w-0 h-full">
        <div class="text-xs text-[#1a1a1a] font-semibold flex-shrink-0">${d.score}</div>
        <div class="w-full flex-1 flex items-end min-h-0">
          <div class="w-full rounded-t transition-all"
               style="height:${Math.max(d.pct, 4)}%; min-height:6px; background-color:${CHART_PALETTE[i % CHART_PALETTE.length]}"></div>
        </div>
      </div>`).join('');

    const labels = data.map(d => `
      <div class="flex-1 min-w-0 text-center text-[11px] text-[#6b6b6b] leading-tight px-1 break-words">${esc(d.label)}</div>
    `).join('');

    return `
      <div class="flex items-stretch gap-2" style="height:200px">${cols}</div>
      <div class="flex items-start gap-2 mt-3">${labels}</div>`;
  }

  function renderBarCharts(questions, sessions, allQuestions) {
    allQuestions = allQuestions || questions;
    const chartQs = questions.filter(q =>
      q.type === 'ranking' || q.type === 'checkbox' || q.type === 'radio'
    );
    if (!chartQs.length) return '';

    return chartQs.map(q => {
      const num    = getQuestionNumber(allQuestions, q.key);
      const result = q.type === 'ranking' ? buildRankingChart(q, sessions)
                   : q.type === 'radio'   ? buildRadioChart(q, sessions)
                   :                        buildCheckboxChart(q, sessions);
      if (!result) return '';

      const footer = q.type === 'ranking'
        ? `Borda count — ${result.responseCount} response${result.responseCount !== 1 ? 's' : ''} weighted (1st = ${q.items.length} pts, last = 1 pt)`
        : q.type === 'radio'
          ? `${result.responseCount} response${result.responseCount !== 1 ? 's' : ''} · single choice`
          : `${result.responseCount} response${result.responseCount !== 1 ? 's' : ''}${q.max ? ` · up to ${q.max} selections each` : ''}`;

      return `
        <div class="mb-6">
          <div class="flex items-start justify-between mb-3 gap-3">
            <h3 class="text-base font-semibold text-[#1a1a1a] flex-1">
              <span class="text-[#a0a0a0] font-normal">${num}.</span> ${esc(q.label)}
            </h3>
            <button data-chart-download="${esc(q.key)}" class="${T.btn} ${T.sm} ${T.outlineLight} flex-shrink-0">View as PNG</button>
          </div>
          <div class="border border-[#e5e5e5] rounded-xl p-5" style="background-color:${CHART_BG_CREAM}">
            ${renderVerticalBars(result.bars)}
            <p class="text-xs text-[#7a6f60] mt-4">${footer}</p>
          </div>
        </div>`;
    }).join('');
  }

  /** Wrap text to fit a max width (canvas measureText). */
  function wrapText(ctx, text, maxWidth) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let current = '';
    for (const word of words) {
      const test = current ? current + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  /** Render a vertical bar chart to a Canvas (white background) and return it. */
  function renderChartCanvas(title, subtitle, data) {
    const W = 1200;
    const padTop = 210, padBot = 110, padLeft = 80, padRight = 60;
    const H = 710;
    const chartH = H - padTop - padBot;
    const chartW = W - padLeft - padRight;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = CHART_BG_CREAM;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    // Title (wrapped)
    ctx.font = '600 26px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    const titleLines = wrapText(ctx, title, W - padLeft - padRight);
    titleLines.slice(0, 2).forEach((line, i) => {
      ctx.fillText(line, padLeft, 24 + i * 32);
    });

    // Subtitle / footer note up top
    if (subtitle) {
      ctx.font = '16px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#444444';
      ctx.fillText(subtitle, padLeft, 24 + Math.min(titleLines.length, 2) * 32 + 8);
      ctx.fillStyle = '#000000';
    }

    if (!data.length) return canvas;

    const max = Math.max(...data.map(d => d.score)) || 1;
    const colW = chartW / data.length;
    const barW = Math.min(colW * 0.65, 110);
    const barX = (i) => padLeft + i * colW + (colW - barW) / 2;

    // Baseline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padLeft, padTop + chartH + 0.5);
    ctx.lineTo(padLeft + chartW, padTop + chartH + 0.5);
    ctx.stroke();

    data.forEach((d, i) => {
      const x = barX(i);
      const h = (d.score / max) * chartH;
      const y = padTop + chartH - h;

      ctx.fillStyle = CHART_PALETTE[i % CHART_PALETTE.length];
      const r = Math.min(barW / 2, Math.max(h, 0), 10);
      ctx.beginPath();
      ctx.roundRect(x, y, barW, h, [r, r, 0, 0]);
      ctx.fill();

      // Score above bar
      ctx.font = '600 18px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = '#000000';
      ctx.fillText(String(d.score), x + barW / 2, y - 8);

      // Rank number above the score (1, 2, 3, …)
      ctx.font = '14px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#666666';
      ctx.fillText('#' + (i + 1), x + barW / 2, y - 32);

      // Multi-line label centered horizontally under each bar. Wrap width
      // is the column width so labels never overlap their neighbours.
      ctx.save();
      ctx.translate(x + barW / 2, padTop + chartH + 12);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = '16px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#000000';
      const wrapWidth = colW - 12;
      const maxLines  = 3;
      const lineH     = 20;
      let lines = wrapText(ctx, d.label || '', wrapWidth);
      if (lines.length > maxLines) {
        lines = lines.slice(0, maxLines);
        lines[maxLines - 1] = lines[maxLines - 1] + '…';
      }
      lines.forEach((line, li) => ctx.fillText(line, 0, li * lineH));
      ctx.restore();
    });

    return canvas;
  }

  /** Open a modal showing the rendered chart with a Download button. */
  function openChartPreview(filename, title, subtitle, data) {
    const canvas  = renderChartCanvas(title, subtitle, data);
    const dataUrl = canvas.toDataURL('image/png');

    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/60 z-[600] flex items-center justify-center p-5';
    overlay.innerHTML = `
      <div class="bg-white rounded-xl w-full max-w-5xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
        <div class="flex items-center justify-between gap-3 px-5 py-3 border-b border-[#e5e5e5]">
          <span class="text-sm font-semibold text-[#1a1a1a] truncate">${esc(title)}</span>
          <button class="chart-modal-close text-[#909090] hover:text-[#1a1a1a] text-2xl leading-none cursor-pointer bg-transparent border-0 px-1" aria-label="Close">&times;</button>
        </div>
        <div class="flex-1 overflow-auto p-5 bg-[#fafafa]">
          <img src="${dataUrl}" class="block max-w-full h-auto mx-auto" alt="${esc(title)}">
        </div>
        <div class="flex items-center justify-end gap-2 px-5 py-3 border-t border-[#e5e5e5]">
          <button class="chart-modal-close ${T.btn} ${T.sm} ${T.outlineLight}">Close</button>
          <button class="chart-modal-download ${T.btn} ${T.sm} ${T.primary}">Download PNG</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const close = () => {
      overlay.remove();
      document.removeEventListener('keydown', keyHandler);
    };
    const keyHandler = (e) => { if (e.key === 'Escape') close(); };
    overlay.querySelectorAll('.chart-modal-close').forEach(b => b.addEventListener('click', close));
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    overlay.querySelector('.chart-modal-download').addEventListener('click', () => {
      canvas.toBlob(downloadBlob(filename), 'image/png');
    });
    document.addEventListener('keydown', keyHandler);
  }

  function downloadBlob(filename) {
    return (blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 200);
    };
  }

  // ── Answer summaries / per-question rendering ──────────────────────────────
  /** Get the 1-based question number within the full (flat) questions list. */
  function getQuestionNumber(questions, key) {
    return questions.findIndex(q => q.key === key) + 1;
  }

  /**
   * Walk every question in survey order and dispatch each through the
   * appropriate renderer (bar chart for ranking/checkbox, tally bars for
   * radio, card grid + AI summary for free-text). No survey-author opt-in
   * required — every question renders the same way across every survey.
   */
  function renderQuestionsInOrder(qs, sessions, allQuestions) {
    if (!sessions.length) return '';
    return qs.map(q => {
      if (q.type === 'ranking' || q.type === 'checkbox' || q.type === 'radio') {
        return renderBarCharts([q], sessions, allQuestions);
      }
      if (q.type === 'textarea' || q.type === 'text' || q.type === 'email') {
        return renderAnswerSummaries([q], sessions, allQuestions);
      }
      return '';
    }).join('');
  }

  /** Initial card count shown before "Show all" expands. */
  const ANSWER_CARDS_INITIAL = 6;

  /** Tiny markdown→HTML for the bounded AI summary output (h2/h3/blockquote/ul/strong/p). */
  function mdToHtml(md) {
    const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    const lines  = String(md || '').split(/\r?\n/);
    const out    = [];
    let inList   = false;
    let para     = [];
    const flushPara = () => {
      if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; }
    };
    const closeList = () => { if (inList) { out.push('</ul>'); inList = false; } };

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) { flushPara(); closeList(); continue; }
      let m;
      if ((m = line.match(/^### (.+)$/))) { flushPara(); closeList(); out.push(`<h3 class="text-sm font-semibold mt-4 mb-1 text-[#1a1a1a]">${inline(m[1])}</h3>`); continue; }
      if ((m = line.match(/^## (.+)$/)))  { flushPara(); closeList(); out.push(`<h2 class="text-base font-bold mt-5 mb-2 text-[#1a1a1a]">${inline(m[1])}</h2>`); continue; }
      if ((m = line.match(/^> (.+)$/)))   { flushPara(); closeList(); out.push(`<blockquote class="border-l-4 border-[#cccccc] pl-3 my-2 text-[#444444] italic">${inline(m[1])}</blockquote>`); continue; }
      if ((m = line.match(/^[-*] (.+)$/))) {
        flushPara();
        if (!inList) { out.push('<ul class="list-disc pl-5 my-2 space-y-1">'); inList = true; }
        out.push(`<li>${inline(m[1])}</li>`);
        continue;
      }
      para.push(line);
    }
    flushPara();
    closeList();
    return out.join('').replace(/<p>/g, '<p class="my-2">');
  }

  function renderAnswerSummaries(questions, sessions, allQuestions) {
    allQuestions = allQuestions || questions;
    // Ranking and checkbox questions are rendered by renderBarCharts instead.
    const summaryQs = questions.filter(q =>
      q.type !== 'ranking' && q.type !== 'checkbox'
    );
    if (!summaryQs.length || !sessions.length) return '';

    return summaryQs.map(q => {
      const num = getQuestionNumber(allQuestions, q.key);
      // Collect non-empty answers
      const answers = sessions
        .map(s => ({ value: (s.answers?.[q.key] ?? '').trim(), completed: !!s.completed_at }))
        .filter(a => a.value);

      if (!answers.length) return '';

      // Text/textarea — responsive grid of white cards with collapsible "show all"
      const total      = answers.length;
      const overflow   = total > ANSWER_CARDS_INITIAL;
      const cards = answers.map((a, i) => `
        <div class="answer-card bg-white text-[#1a1a1a] rounded-xl p-4 shadow-sm border border-[#e5e5e5] ${i >= ANSWER_CARDS_INITIAL ? 'hidden answer-card-hidden' : ''}">
          <p class="text-sm leading-relaxed whitespace-pre-line">${esc(a.value)}</p>
        </div>`).join('');

      return `
        <div class="mb-12 pb-12 border-b border-[#e5e5e5] min-w-0">
          <div class="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h3 class="text-base font-semibold text-[#1a1a1a]"><span class="text-[#a0a0a0] font-normal">${num}.</span> ${esc(q.label)} <span class="text-[#6b6b6b]">(${total})</span></h3>
          </div>
          ${q.type === 'textarea' ? renderAiSummaryPanel(q.key, total) : ''}
          <div class="answer-collapse relative" data-question-key="${esc(q.key)}">
            <div class="answer-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">${cards}</div>
            ${overflow ? `
              <div class="answer-fade absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
              <button class="answer-toggle mt-4 ${T.btn} ${T.sm} ${T.outlineLight}" data-expanded="0" data-total="${total}">
                Show all ${total}
              </button>
            ` : ''}
          </div>
        </div>`;
    }).join('');
  }

  /** Render the AI-summary panel above the answer cards. */
  function renderAiSummaryPanel(questionKey, responseCount) {
    const cached      = state.aiSummaries[questionKey] || null;
    const busy        = !!state.aiBusy[questionKey];
    const canCallApi  = state.isAdmin || isShareView();
    const canGenerate = canCallApi && responseCount >= 2;

    const headerInfo = cached
      ? `<span class="text-xs text-[#6b6b6b]">Generated ${esc(cached.generated_at)} · ${cached.response_count} response${cached.response_count !== 1 ? 's' : ''}</span>`
      : '';

    const button = (() => {
      if (!canCallApi) return '';
      if (busy) {
        return `<button class="${T.btn} ${T.sm} ${T.outlineLight}" disabled>Generating&hellip;</button>`;
      }
      if (cached) {
        return `<button class="ai-generate-btn ${T.btn} ${T.sm} ${T.outlineLight}" data-question-key="${esc(questionKey)}">Regenerate</button>`;
      }
      if (!canGenerate) {
        return `<button class="${T.btn} ${T.sm} ${T.outlineLight}" disabled title="Need at least 2 responses">Generate AI summary</button>`;
      }
      return `<button class="ai-generate-btn ${T.btn} ${T.sm} ${T.primary}" data-question-key="${esc(questionKey)}">Generate AI summary</button>`;
    })();

    const errMsg = state.aiErrors[questionKey] || null;
    const errorBlock = errMsg
      ? `<div class="ai-summary-error mt-3 text-xs text-red bg-red/5 border border-red/30 rounded-lg px-3 py-2 break-words"><strong>Last attempt failed:</strong> ${esc(errMsg)}</div>`
      : '';

    const body = cached
      ? `<div class="ai-summary-body mt-4 text-sm text-[#1a1a1a] bg-white rounded-xl p-5 border border-[#e5e5e5]">${mdToHtml(cached.summary_md)}</div>${errorBlock}`
      : (canCallApi
          ? `<p class="ai-summary-empty text-xs text-[#6b6b6b] mt-3">Click <em>Generate AI summary</em> to group these responses into themes.</p>${errorBlock}`
          : '');

    if (!canCallApi && !cached) return '';

    return `
      <div class="ai-summary mb-6 p-4 rounded-xl bg-[#fafafa] border border-[#e5e5e5]" data-ai-key="${esc(questionKey)}">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div class="flex items-center gap-2">
            <span class="text-xs uppercase tracking-wider font-semibold text-green">AI summary</span>
            ${headerInfo}
          </div>
          ${button}
        </div>
        ${body}
      </div>`;
  }

  // ── Responses page (admin or public share view) ────────────────────────────
  function renderResponses() {
    const { questions, sessions } = state.responsesData || { questions: [], sessions: [] };
    const shareView = isShareView();

    // Drop selections that no longer exist in the current session list
    const validTokens = new Set(sessions.map(s => s.session_token).filter(Boolean));
    [...state.selectedSessions].forEach(t => { if (!validTokens.has(t)) state.selectedSessions.delete(t); });

    // Pull the email question (if any) into a fixed early column. The
    // remaining questions follow the IP/Session columns at the end.
    const emailQ      = questions.find(q => q.type === 'email' || q.key === 'email');
    const emailKey    = emailQ?.key || null;
    const otherQs     = emailKey ? questions.filter(q => q.key !== emailKey) : questions;
    const totalCols   = 6 + otherQs.length; // checkbox + email + status + started + ip + session + others

    // Optional client-side sort on the email column for spotting duplicates.
    let displaySessions = sessions;
    if (state.emailSort && emailKey) {
      displaySessions = [...sessions].sort((a, b) => {
        const av = String(a.answers?.[emailKey] ?? '').trim().toLowerCase();
        const bv = String(b.answers?.[emailKey] ?? '').trim().toLowerCase();
        const cmp = av.localeCompare(bv);
        return state.emailSort === 'desc' ? -cmp : cmp;
      });
    }

    const colHeaders = otherQs.map(q =>
      `<th class="px-3 py-2 text-left text-xs font-medium text-[#6b6b6b] truncate min-w-[160px] max-w-[220px] sticky top-0 z-20 bg-[#f4f4f5]" title="${esc(q.label)}">${esc(q.label)}</th>`
    ).join('');

    const allChecked = sessions.length > 0 && sessions.every(s => s.session_token && state.selectedSessions.has(s.session_token));

    const rows = displaySessions.map(s => {
      const cells = otherQs.map(q => {
        const raw = s.answers?.[q.key] ?? '';
        let display = raw;
        if (q.type === 'ranking' || q.type === 'checkbox') {
          try {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) display = arr.join(q.type === 'ranking' ? ' > ' : ', ');
          } catch (_) {}
        }
        return `<td class="px-3 py-2 text-sm text-[#1a1a1a] truncate min-w-[160px] max-w-[220px]" title="${esc(display)}">${esc(display)}</td>`;
      }).join('');

      const completed = s.completed_at
        ? `<span class="text-green text-xs whitespace-nowrap">${esc(s.completed_at)}</span>`
        : `<span class="text-[#a0a0a0] text-xs">partial</span>`;

      const emailValue = emailKey ? (s.answers?.[emailKey] ?? '') : '';
      const isChecked = s.session_token && state.selectedSessions.has(s.session_token);

      return `<tr class="group border-b border-[#e5e5e5] hover:bg-[#f4f4f5] ${isChecked ? 'bg-[#f4f4f5]' : ''}">
        <td class="px-3 py-2 text-center w-10 sticky left-0 z-10 group-hover:bg-[#f4f4f5] ${isChecked ? 'bg-[#f4f4f5]' : 'bg-white'}">
          <input type="checkbox" class="row-select cursor-pointer accent-green w-4 h-4"
                 data-session-token="${esc(s.session_token || '')}" ${isChecked ? 'checked' : ''}>
        </td>
        <td class="px-3 py-2 text-sm text-[#1a1a1a] truncate max-w-[240px]" title="${esc(emailValue)}">${esc(emailValue)}</td>
        <td class="px-3 py-2 whitespace-nowrap">${completed}</td>
        <td class="px-3 py-2 text-xs text-[#6b6b6b] whitespace-nowrap">${esc(s.created_at)}</td>
        <td class="px-3 py-2 text-xs text-[#a0a0a0] truncate max-w-[140px]">${esc(s.ip_address || '')}</td>
        <td class="px-3 py-2 text-xs font-mono text-[#a0a0a0] truncate max-w-[120px]">${esc((s.session_token || '').substring(0, 8))}…</td>
        ${cells}
      </tr>`;
    }).join('');

    const emptyState = sessions.length === 0
      ? `<tr><td colspan="${totalCols}" class="px-3 py-10 text-center text-[#a0a0a0] text-sm">No responses yet.</td></tr>`
      : '';

    const completedCount = sessions.filter(s => s.completed_at).length;
    const partialCount   = sessions.length - completedCount;
    const selCount = state.selectedSessions.size;
    const bulkBarHidden = selCount === 0 ? 'hidden' : '';

    const csvHref = shareView
      ? `api.php?action=export_csv&slug=${esc(state.surveySlug)}&token=${encodeURIComponent(state.shareToken)}`
      : `api.php?action=export_csv&slug=${esc(state.surveySlug)}`;

    const headerActions = shareView
      ? `
        <span class="text-xs text-[#6b6b6b]">Read-only shared view</span>
        <a href="${csvHref}" class="${T.btn} ${T.sm} ${T.primary}">Export CSV</a>
      `
      : `
        <a href="?s=${esc(state.surveySlug)}" class="${T.btn} ${T.sm} ${T.outlineLight}">Take survey</a>
        <a href="${csvHref}" class="${T.btn} ${T.sm} ${T.primary}">Export CSV</a>
        <button id="btn-clear" class="${T.btn} ${T.sm} ${T.danger}">Clear all responses</button>
      `;

    const breadcrumbHome = shareView
      ? ''
      : `<a href="/" class="text-[#6b6b6b] hover:text-[#1a1a1a] text-sm transition-colors">← All surveys</a>
         <span class="text-[#cccccc]">/</span>`;

    const tableSection = shareView ? '' : `
      <div class="flex items-center justify-between gap-3 mb-3 mt-2">
        <h2 class="text-base font-semibold text-[#1a1a1a]">All responses</h2>
        <div class="text-sm text-[#6b6b6b]">
          <span class="text-green font-semibold">${completedCount}</span> submitted
          &nbsp;·&nbsp;
          <span class="text-[#1a1a1a] font-semibold">${partialCount}</span> partial
        </div>
      </div>
      <div id="bulk-actions" class="${bulkBarHidden} flex items-center justify-between gap-3 mb-3 px-4 py-3 rounded-xl bg-[#fafafa] border border-[#e5e5e5]">
        <span class="text-sm text-[#1a1a1a]"><span id="bulk-count">${selCount}</span> selected</span>
        <div class="flex items-center gap-2">
          <button id="btn-clear-selection" class="${T.btn} ${T.sm} ${T.outlineLight}">Clear selection</button>
          <button id="btn-delete-selected" class="${T.btn} ${T.sm} ${T.danger}">Delete selected</button>
        </div>
      </div>
      <div class="overflow-auto rounded-xl border border-[#e5e5e5] max-h-[70vh]">
        <table class="min-w-full bg-white" style="width: max-content">
          <thead class="border-b border-[#e5e5e5] bg-[#f4f4f5]">
            <tr>
              <th class="px-3 py-2 text-center w-10 sticky top-0 left-0 z-30 bg-[#f4f4f5]">
                <input type="checkbox" id="select-all" class="cursor-pointer accent-green w-4 h-4" ${allChecked ? 'checked' : ''}>
              </th>
              <th class="px-3 py-2 text-left text-xs font-medium text-[#6b6b6b] min-w-[180px] max-w-[240px] sticky top-0 z-20 bg-[#f4f4f5]">
                <button id="sort-email-btn" class="flex items-center gap-1 cursor-pointer bg-transparent border-0 text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors text-xs font-medium p-0">
                  Email
                  <span class="${state.emailSort ? 'text-[#1a1a1a]' : 'text-[#cccccc]'}">${
                    state.emailSort === 'asc' ? '▲' : state.emailSort === 'desc' ? '▼' : '↕'
                  }</span>
                </button>
              </th>
              <th class="px-3 py-2 text-left text-xs font-medium text-[#6b6b6b] w-28 whitespace-nowrap sticky top-0 z-20 bg-[#f4f4f5]">Status</th>
              <th class="px-3 py-2 text-left text-xs font-medium text-[#6b6b6b] w-44 whitespace-nowrap sticky top-0 z-20 bg-[#f4f4f5]">Started</th>
              <th class="px-3 py-2 text-left text-xs font-medium text-[#6b6b6b] w-32 whitespace-nowrap sticky top-0 z-20 bg-[#f4f4f5]">IP</th>
              <th class="px-3 py-2 text-left text-xs font-medium text-[#6b6b6b] w-28 whitespace-nowrap sticky top-0 z-20 bg-[#f4f4f5]">Session</th>
              ${colHeaders}
            </tr>
          </thead>
          <tbody>${rows}${emptyState}</tbody>
        </table>
      </div>
    `;

    const totalBadge = `<span class="text-xs px-2 py-1 rounded-full bg-[#f4f4f5] border border-[#e5e5e5] text-[#1a1a1a] font-semibold whitespace-nowrap">${sessions.length} response${sessions.length !== 1 ? 's' : ''}</span>`;

    return `
      <div class="min-h-screen bg-white text-[#1a1a1a]">
        <header class="sticky top-0 z-20 bg-white border-b border-[#e5e5e5] px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div class="flex items-center gap-3 flex-wrap">
            ${breadcrumbHome}
            <span class="font-semibold text-[#1a1a1a]">${esc(state.survey?.title || state.surveySlug)}</span>
            <code class="text-xs text-[#a0a0a0]">${esc(state.surveySlug)}</code>
            ${totalBadge}
          </div>
          <div class="flex items-center gap-2">
            ${headerActions}
          </div>
        </header>
        <div class="px-6 py-6 max-w-7xl mx-auto">
          ${renderShareLinkPanel()}
          ${renderQuestionsInOrder(questions, sessions, questions)}
          ${tableSection}
        </div>
      </div>`;
  }

  /** Admin-only "share link" panel above the summaries. */
  function renderShareLinkPanel() {
    if (isShareView() || !state.isAdmin) return '';
    const info = state.shareInfo;
    const body = info && info.url
      ? `
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <input id="share-url-input" readonly value="${esc(info.url)}"
                 class="flex-1 min-w-0 bg-white border border-[#cccccc] rounded-lg px-3 py-2 text-xs font-mono text-[#1a1a1a] focus:outline-none focus:border-green">
          <button id="share-copy-btn" class="${T.btn} ${T.sm} ${T.outlineLight}">Copy</button>
          <button id="share-reset-btn" class="${T.btn} ${T.sm} ${T.outlineLight}">Reset link</button>
          <button id="share-delete-btn" class="${T.btn} ${T.sm} ${T.danger}">Delete</button>
        </div>`
      : `
        <div class="flex items-center gap-3 flex-wrap">
          <span class="text-sm text-[#6b6b6b]">No share link yet — anyone with the link can view summaries (read-only, no IPs or session data).</span>
          <button id="share-create-btn" class="${T.btn} ${T.sm} ${T.primary}">Generate share link</button>
        </div>`;
    return `
      <div class="mb-6 p-4 rounded-xl bg-[#fafafa] border border-[#e5e5e5]">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-xs uppercase tracking-wider font-semibold text-green">Share link</span>
          ${info && info.created_at ? `<span class="text-xs text-[#6b6b6b]">created ${esc(info.created_at)}</span>` : ''}
        </div>
        ${body}
      </div>`;
  }

  function attachResponsesEvents() {
    // "Show all" / "Show fewer" toggle on each free-text answer grid.
    document.querySelectorAll('.answer-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const wrap     = btn.closest('.answer-collapse');
        const expanded = btn.dataset.expanded === '1';
        const total    = btn.dataset.total;
        if (!wrap) return;
        wrap.querySelectorAll('.answer-card-hidden').forEach(card => {
          card.classList.toggle('hidden', expanded);
        });
        const fade = wrap.querySelector('.answer-fade');
        if (fade) fade.classList.toggle('hidden', !expanded);
        btn.dataset.expanded = expanded ? '0' : '1';
        btn.textContent = expanded ? `Show all ${total}` : 'Show fewer';
      });
    });

    // AI summary: generate/regenerate per question
    document.querySelectorAll('.ai-generate-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const key = btn.dataset.questionKey;
        if (!key || state.aiBusy[key]) return;
        state.aiBusy[key] = true;
        rerenderApp();
        try {
          const body = { slug: state.surveySlug, question_key: key };
          if (isShareView()) body.token = state.shareToken;
          // AI summary calls with medium reasoning can take 60–180s; give the
          // fetch generous headroom beyond the 180s server-side curl timeout.
          const r = await api('generate_ai_summary', 'POST', body, 200000);
          state.aiSummaries[key] = {
            summary_md:     r.summary_md,
            response_count: r.response_count,
            generated_at:   r.generated_at,
          };
          delete state.aiErrors[key];
        } catch (err) {
          state.aiErrors[key] = err.message;
          toast(err.message, 'error');
        } finally {
          state.aiBusy[key] = false;
          rerenderApp();
        }
      });
    });

    // Email column sort (admin table — cycles none → asc → desc → none)
    document.getElementById('sort-email-btn')?.addEventListener('click', () => {
      state.emailSort = state.emailSort === null ? 'asc'
                      : state.emailSort === 'asc' ? 'desc'
                      : null;
      rerenderApp();
    });

    // Share-link panel (admin)
    document.getElementById('share-create-btn')?.addEventListener('click', async () => {
      try {
        const r = await api('create_share_token', 'POST', { slug: state.surveySlug });
        state.shareInfo = { token: r.token, url: r.url, created_at: new Date().toISOString().slice(0, 19).replace('T', ' ') };
        rerenderApp();
        toast('Share link created.', 'success');
      } catch (err) { toast(err.message, 'error'); }
    });

    document.getElementById('share-copy-btn')?.addEventListener('click', async () => {
      const input = document.getElementById('share-url-input');
      if (!input) return;
      try {
        await navigator.clipboard.writeText(input.value);
        toast('Copied to clipboard.', 'success');
      } catch (_) {
        input.select();
        document.execCommand('copy');
        toast('Copied to clipboard.', 'success');
      }
    });

    document.getElementById('share-reset-btn')?.addEventListener('click', async () => {
      if (!confirm('Resetting will invalidate the current link and create a new one. Continue?')) return;
      try {
        const r = await api('create_share_token', 'POST', { slug: state.surveySlug });
        state.shareInfo = { token: r.token, url: r.url, created_at: new Date().toISOString().slice(0, 19).replace('T', ' ') };
        rerenderApp();
        toast('New share link created — the old one no longer works.', 'success');
      } catch (err) { toast(err.message, 'error'); }
    });

    document.getElementById('share-delete-btn')?.addEventListener('click', async () => {
      if (!confirm('Delete the share link? Anyone with the URL will lose access.')) return;
      try {
        await api('delete_share_token', 'POST', { slug: state.surveySlug });
        state.shareInfo = null;
        rerenderApp();
        toast('Share link deleted.', 'success');
      } catch (err) { toast(err.message, 'error'); }
    });

    document.getElementById('btn-clear')?.addEventListener('click', async () => {
      if (!confirm(`Delete ALL responses for "${state.survey?.title}"? This cannot be undone.`)) return;
      try {
        const r = await api('clear_responses', 'POST', { slug: state.surveySlug });
        toast(`Cleared ${r.deleted} response${r.deleted !== 1 ? 's' : ''}.`, 'success');
        state.selectedSessions.clear();
        await loadResponses();
        rerenderApp();
      } catch (err) {
        toast(err.message, 'error');
      }
    });

    // Row selection
    const updateBulkBar = () => {
      const bar = document.getElementById('bulk-actions');
      const cnt = document.getElementById('bulk-count');
      const n = state.selectedSessions.size;
      if (cnt) cnt.textContent = n;
      if (bar) bar.classList.toggle('hidden', n === 0);
      const selectAll = document.getElementById('select-all');
      const sessions = state.responsesData?.sessions || [];
      if (selectAll) {
        selectAll.checked = sessions.length > 0 && sessions.every(s => state.selectedSessions.has(s.session_token));
      }
    };

    document.querySelectorAll('.row-select').forEach(cb => {
      cb.addEventListener('change', () => {
        const token = cb.dataset.sessionToken;
        if (cb.checked) state.selectedSessions.add(token);
        else state.selectedSessions.delete(token);
        cb.closest('tr')?.classList.toggle('bg-[#f4f4f5]', cb.checked);
        updateBulkBar();
      });
    });

    document.getElementById('select-all')?.addEventListener('change', (e) => {
      const sessions = state.responsesData?.sessions || [];
      if (e.target.checked) {
        sessions.forEach(s => state.selectedSessions.add(s.session_token));
      } else {
        state.selectedSessions.clear();
      }
      document.querySelectorAll('.row-select').forEach(cb => {
        cb.checked = state.selectedSessions.has(cb.dataset.sessionToken);
        cb.closest('tr')?.classList.toggle('bg-[#f4f4f5]', cb.checked);
      });
      updateBulkBar();
    });

    document.getElementById('btn-clear-selection')?.addEventListener('click', () => {
      state.selectedSessions.clear();
      document.querySelectorAll('.row-select').forEach(cb => {
        cb.checked = false;
        cb.closest('tr')?.classList.remove('bg-[#f4f4f5]');
      });
      updateBulkBar();
    });

    document.getElementById('btn-delete-selected')?.addEventListener('click', async () => {
      const tokens = [...state.selectedSessions];
      if (!tokens.length) return;
      const msg = `Delete ${tokens.length} selected response${tokens.length !== 1 ? 's' : ''}? This cannot be undone.`;
      if (!confirm(msg)) return;
      try {
        const r = await api('delete_sessions', 'POST', { slug: state.surveySlug, tokens });
        toast(`Deleted ${r.deleted} response${r.deleted !== 1 ? 's' : ''}.`, 'success');
        state.selectedSessions.clear();
        await loadResponses();
        rerenderApp();
      } catch (err) {
        toast(err.message, 'error');
      }
    });

    // Chart PNG download
    document.querySelectorAll('[data-chart-download]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.chartDownload;
        const { questions, sessions } = state.responsesData || { questions: [], sessions: [] };
        const q = questions.find(x => x.key === key);
        if (!q) return;
        const result = q.type === 'ranking' ? buildRankingChart(q, sessions)
                     : q.type === 'radio'   ? buildRadioChart(q, sessions)
                     :                        buildCheckboxChart(q, sessions);
        if (!result || !result.bars.length) {
          toast('No data to chart yet.', 'error');
          return;
        }
        const subtitle = q.type === 'ranking'
          ? `Borda count · ${result.responseCount} response${result.responseCount !== 1 ? 's' : ''} (1st = ${q.items.length} pts, last = 1 pt)`
          : q.type === 'radio'
            ? `${result.responseCount} response${result.responseCount !== 1 ? 's' : ''} · single choice`
            : `${result.responseCount} response${result.responseCount !== 1 ? 's' : ''}${q.max ? ` · up to ${q.max} selections each` : ''}`;
        const safeSlug = (state.surveySlug || 'survey').replace(/[^a-z0-9-]+/gi, '-');
        const safeKey  = (q.key || 'chart').replace(/[^a-z0-9-]+/gi, '-');
        openChartPreview(`${safeSlug}-${safeKey}.png`, q.label, subtitle, result.bars);
      });
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
      const slug = state.surveySlug;
      const [data, summaries, share] = await Promise.all([
        api(`get_responses&slug=${slug}`),
        api(`get_ai_summaries&slug=${slug}`).catch(() => ({})),
        api(`get_share_token&slug=${slug}`).catch(() => null),
      ]);
      state.responsesData = data;
      state.aiSummaries   = summaries || {};
      state.shareInfo     = share && share.token ? share : null;
      state.page          = 'responses';
    } catch (err) {
      toast(err.message, 'error');
      state.page = 'not_found';
    }
  }

  /** Public share-view loader — uses the share token in place of admin auth. */
  async function loadResponsesPublic() {
    try {
      const slug = state.surveySlug;
      const tok  = state.shareToken;
      const [data, summaries] = await Promise.all([
        api(`get_responses_public&token=${encodeURIComponent(tok)}`),
        api(`get_ai_summaries&slug=${slug}&token=${encodeURIComponent(tok)}`).catch(() => ({})),
      ]);
      state.responsesData = data;
      state.aiSummaries   = summaries || {};
      state.shareInfo     = null; // admin-only widget
      state.page          = 'responses';
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
        clampSurveyProgress();
      } catch (_) {
        state.page = 'not_found';
        rerenderApp();
        return;
      }

      // 3. Thank you preview
      if (state.surveyView === 'thankyou') {
        state.page = 'completed';
        rerenderApp();
        return;
      }

      // 4. Responses view — admin OR public share-token holder
      if (state.surveyView === 'responses') {
        if (state.shareToken) {
          await loadResponsesPublic();
          rerenderApp();
          return;
        }
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
        clampSurveyProgress();
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

  init().catch(err => showFatalError(err));

})();
