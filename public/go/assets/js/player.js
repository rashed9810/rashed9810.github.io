/* player.js: the step-through player. Shows a step's panels, highlights the running line,
   narrates in English/Bangla, and (in Predict mode) asks a question before key steps. */
(function () {
  'use strict';
  const GV = window.GV;
  const { esc, T, I, ui } = GV;
  let uidSeq = 0;

  function parseInput(def, raw) {
    const v = String(raw).trim();
    if (def.type === 'list') {
      if (!v) throw new GV.InputError(GV.L('Enter at least one number.', 'অন্তত একটা সংখ্যা লিখুন।'));
      const nums = v.split(/[\s,]+/).filter(Boolean).map(Number);
      if (nums.some((x) => !Number.isInteger(x))) throw new GV.InputError(GV.L('Use whole numbers separated by commas, like 3, 8, 12.', 'কমা দিয়ে আলাদা করা পূর্ণসংখ্যা লিখুন, যেমন 3, 8, 12।'));
      if (def.maxLen && nums.length > def.maxLen) throw new GV.InputError(GV.L(`Use at most ${def.maxLen} numbers so the picture stays readable.`, `ছবিটা পরিষ্কার রাখতে সর্বোচ্চ ${def.maxLen}টা সংখ্যা দিন।`));
      return nums;
    }
    if (def.type === 'int') {
      const n = Number(v);
      if (!Number.isInteger(n)) throw new GV.InputError(GV.L('Enter a whole number.', 'একটা পূর্ণসংখ্যা লিখুন।'));
      if (def.min != null && n < def.min) throw new GV.InputError(GV.L(`Use a number of at least ${def.min}.`, `কমপক্ষে ${def.min} দিন।`));
      if (def.max != null && n > def.max) throw new GV.InputError(GV.L(`Use a number up to ${def.max}.`, `সর্বোচ্চ ${def.max} দিন।`));
      return n;
    }
    if (def.type === 'bool') return !!raw;
    if (def.type === 'text') {
      if (def.maxLen && [...v].length > def.maxLen) throw new GV.InputError(GV.L(`Keep it to ${def.maxLen} characters.`, `${def.maxLen} অক্ষরের মধ্যে রাখুন।`));
      if (!v && !def.allowEmpty) throw new GV.InputError(GV.L('Type something first.', 'আগে কিছু লিখুন।'));
      return v;
    }
    return v;
  }

  function fmtInput(def, val) {
    if (def.type === 'list') return val.join(', ');
    return val;
  }

  GV.mountPlayer = function (root, visual, opts) {
    opts = opts || {};
    const uid = ++uidSeq;
    const memoKey = opts.memoKey;
    const memo = (memoKey && GV.memo[memoKey]) || {};
    const P = { ex: memo.ex || 0, i: 0, steps: [], timer: null, speed: memo.speed || 1, inputs: memo.inputs || {}, answered: {}, asking: null, code: null };
    const examples = visual.examples;
    if (P.ex >= examples.length) P.ex = 0;

    const mini = !!opts.mini;
    root.classList.add('player');
    if (mini) root.classList.add('mini');
    root.innerHTML = `
      ${mini ? '' : `<div class="pl-top">
        ${examples.length > 1 ? `<label class="fld"><span>${ui('Example', 'উদাহরণ')}</span><select class="pl-ex" id="ex-${opts.idBase || uid}">${examples.map((e, k) => `<option value="${k}">${T(e.label)}</option>`).join('')}</select></label>` : `<div class="pl-ex-one">${T(examples[0].label)}</div>`}
        <form class="pl-inputs" novalidate></form>
      </div>`}
      <div class="pl-controls" role="toolbar" aria-label="${ui('Step controls', 'ধাপ নিয়ন্ত্রণ')}">
        ${mini ? '' : `<button type="button" class="btn ghost pl-reset" title="R">${ui('Reset', 'শুরুতে')}</button>
        <button type="button" class="btn ghost pl-back" title="←">${ui('Back', 'পেছনে')}</button>`}
        <button type="button" class="btn primary pl-play" title="Space">${ui('Play', 'চালান')}</button>
        ${mini ? '' : `<button type="button" class="btn ghost pl-next" title="→">${ui('Next', 'পরের ধাপ')}</button>
        <label class="fld inline"><span class="sr">${ui('Speed', 'গতি')}</span><select class="pl-speed" id="sp-${opts.idBase || uid}">
          <option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option></select></label>`}
        <input type="range" class="pl-range" min="0" max="0" value="0" aria-label="${ui('Step', 'ধাপ')}" id="rg-${opts.idBase || uid}">
        <span class="pl-count mono"></span>
        ${mini ? '' : `<label class="switch" title="${ui('Pause and ask me to predict before key steps', 'গুরুত্বপূর্ণ ধাপের আগে থেমে আমাকে অনুমান করতে বলো')}">
          <input type="checkbox" class="pl-predict" id="pr-${opts.idBase || uid}" ${GV.st.predict ? 'checked' : ''}><span>${ui('Predict mode', 'অনুমান মোড')}</span></label>`}
      </div>
      <div class="pl-body">
        <div class="pl-left">
          <div class="pl-stage" data-uid="${uid}"><svg class="pl-arrows" aria-hidden="true"></svg><div class="pl-panels"></div></div>
          <div class="pl-note" aria-live="polite"></div>
        </div>
        <div class="pl-code">
          <div class="code-head"><span class="mono">${esc(visual.file || 'main.go')}</span>${mini ? '' : `<button type="button" class="btn tiny ghost pl-copy">${ui('Copy code', 'কোড কপি')}</button>`}</div>
          <pre class="code"><code></code></pre>
        </div>
      </div>
      ${mini || !visual.legend ? '' : `<div class="pl-legend">${visual.legend.map((l) => `<span class="lg"><i class="sw ${l.cls}"></i>${T(l.label)}</span>`).join('')}</div>`}`;

    const $ = (s) => root.querySelector(s);
    const stage = $('.pl-stage'), panelsEl = $('.pl-panels'), noteEl = $('.pl-note'), codeEl = $('.pl-code code'), codeBox = $('.pl-code pre');
    const range = $('.pl-range'), countEl = $('.pl-count'), playBtn = $('.pl-play');

    function currentEx() { return examples[P.ex]; }

    function buildInputs() {
      const form = $('.pl-inputs');
      if (!form) return;
      const ex = currentEx();
      const defs = ex.inputs || [];
      if (!defs.length) { form.innerHTML = ''; return; }
      form.innerHTML = defs.map((d) => {
        const id = `in-${opts.idBase || uid}-${P.ex}-${d.key}`;
        const val = P.inputs[P.ex + ':' + d.key] != null ? P.inputs[P.ex + ':' + d.key] : fmtInput(d, d.def);
        if (d.type === 'bool') return `<label class="switch" for="${id}"><input type="checkbox" id="${id}" data-key="${d.key}" ${val === true || val === 'true' ? 'checked' : ''}><span>${T(d.label)}</span></label>`;
        if (d.type === 'select') return `<label class="fld" for="${id}"><span>${T(d.label)}</span><select id="${id}" data-key="${d.key}">${d.options.map((o) => `<option value="${esc(o.v)}" ${String(o.v) === String(val) ? 'selected' : ''}>${T(o.label)}</option>`).join('')}</select></label>`;
        return `<label class="fld ${d.type === 'list' ? 'grow' : ''}" for="${id}"><span>${T(d.label)}</span><input id="${id}" data-key="${d.key}" value="${esc(val)}" ${d.type === 'int' ? 'inputmode="numeric"' : ''} autocomplete="off" spellcheck="false"></label>`;
      }).join('') + `<button class="btn primary">${ui('Run', 'চালান')}</button><div class="pl-err" role="alert"></div>`;
      form.onsubmit = (e) => { e.preventDefault(); rebuild(true); };
    }

    function readInputs() {
      const ex = currentEx();
      const vals = {};
      (ex.inputs || []).forEach((d) => {
        const el = root.querySelector(`[data-key="${d.key}"]`);
        let raw = d.def;
        if (el) raw = d.type === 'bool' ? el.checked : el.value;
        else if (P.inputs[P.ex + ':' + d.key] != null) raw = P.inputs[P.ex + ':' + d.key];
        else raw = d.type === 'list' ? d.def.join(',') : d.def;
        vals[d.key] = parseInput(d, raw);
        P.inputs[P.ex + ':' + d.key] = d.type === 'bool' ? vals[d.key] : (el ? el.value : fmtInput(d, vals[d.key]));
      });
      return vals;
    }

    function rebuild(fromUser) {
      stop();
      const ex = currentEx();
      const errEl = $('.pl-err');
      let input;
      try { input = readInputs(); if (errEl) errEl.textContent = ''; }
      catch (err) {
        if (err instanceof GV.InputError) { if (errEl) errEl.innerHTML = I(err.msg); return; }
        throw err;
      }
      let steps;
      try { steps = ex.build(input); }
      catch (err) {
        if (err instanceof GV.InputError) { if (errEl) errEl.innerHTML = I(err.msg); return; }
        throw err;
      }
      P.steps = steps;
      P.answered = {};
      const src = typeof ex.code === 'function' ? ex.code(input) : ex.code;
      P.code = GV.prepCode(src);
      codeEl.innerHTML = P.code.html.map((h, k) => `<span class="cl" data-ln="${k + 1}"><span class="ln">${k + 1}</span><span class="lc">${h || ' '}</span></span>`).join('');
      range.max = Math.max(0, steps.length - 1);
      const start = !fromUser && memo.i != null && memo.ex === P.ex ? Math.min(memo.i, steps.length - 1) : 0;
      show(start);
      save();
    }

    function lineOf(step) {
      if (step.line == null) return null;
      if (typeof step.line === 'number') return step.line;
      return P.code.markers[step.line] || null;
    }

    function show(i) {
      P.i = Math.max(0, Math.min(i, P.steps.length - 1));
      P.asking = null;
      const s = P.steps[P.i];
      panelsEl.innerHTML = GV.renderPanels(s.panels);
      noteEl.className = 'pl-note' + (s.tone ? ' tone-' + s.tone : '');
      noteEl.innerHTML = `<div class="note-step mono">${ui('Step', 'ধাপ')} ${P.i + 1}</div><div class="note-body">${I(s.note)}</div>`;
      root.querySelectorAll('.cl.cur').forEach((el) => el.classList.remove('cur'));
      const ln = lineOf(s);
      if (ln) {
        const el = root.querySelector(`.cl[data-ln="${ln}"]`);
        if (el) {
          el.classList.add('cur');
          const rel = el.getBoundingClientRect().top - codeBox.getBoundingClientRect().top + codeBox.scrollTop;
          const top = rel - codeBox.clientHeight / 2 + el.clientHeight / 2;
          codeBox.scrollTo({ top: Math.max(0, top), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        }
      }
      range.value = P.i;
      countEl.textContent = `${P.i + 1} / ${P.steps.length}`;
      const back = $('.pl-back'); if (back) back.disabled = P.i === 0;
      const next = $('.pl-next'); if (next) next.disabled = P.i === P.steps.length - 1;
      redrawArrows();
      save();
    }

    function redrawArrows() {
      const s = P.steps[P.i];
      requestAnimationFrame(() => GV.drawArrows(stage, s && s.arrows));
    }

    function askFor(k) {
      const s = P.steps[k];
      return s && s.ask && GV.st.predict && !mini && !P.answered[k] ? s.ask : null;
    }

    function renderAsk(k) {
      const a = P.steps[k].ask;
      P.asking = k;
      noteEl.className = 'pl-note asking';
      noteEl.innerHTML = `<div class="note-step mono">${ui('Predict', 'অনুমান করুন')}</div>
        <div class="note-body"><div class="ask-q">${I(a.q)}</div>
        <div class="ask-opts">${a.options.map((o, j) => `<button type="button" class="btn opt" data-j="${j}">${I(o)}</button>`).join('')}</div>
        <div class="ask-fb" aria-live="polite"></div></div>`;
      noteEl.querySelectorAll('.opt').forEach((b) => {
        b.onclick = () => {
          const j = +b.dataset.j;
          const ok = j === a.answer;
          noteEl.querySelectorAll('.opt').forEach((x) => { x.disabled = true; const jj = +x.dataset.j; if (jj === a.answer) x.classList.add('right'); else if (jj === j) x.classList.add('wrong'); });
          noteEl.querySelector('.ask-fb').innerHTML = `<div class="fb ${ok ? 'ok' : 'bad'}">${ok ? ui('Correct.', 'ঠিক!') : ui('Not quite.', 'হয়নি।')} ${a.why ? I(a.why) : ''}</div>
            <button type="button" class="btn primary ask-go">${ui('Show this step', 'ধাপটা দেখাও')}</button>`;
          P.answered[k] = true;
          const go = noteEl.querySelector('.ask-go');
          go.onclick = () => show(k);
          go.focus({ preventScroll: true });
        };
      });
    }

    function next() {
      if (P.asking != null) return false;
      if (P.i >= P.steps.length - 1) return false;
      const k = P.i + 1;
      if (askFor(k)) { stop(); renderAsk(k); return false; }
      show(k);
      return true;
    }
    function back() { stop(); if (P.asking != null) { show(P.i); return; } if (P.i > 0) show(P.i - 1); }

    function play() {
      if (P.timer) { stop(); return; }
      if (P.i >= P.steps.length - 1) {
        if (!opts.loop) show(0);
      }
      playBtn.textContent = ui('Pause', 'থামান');
      playBtn.setAttribute('aria-pressed', 'true');
      const tick = () => {
        if (P.i >= P.steps.length - 1) {
          if (opts.loop) { P.timer = setTimeout(() => { show(0); P.timer = setTimeout(tick, 1200 / P.speed); }, 1800); return; }
          stop(); return;
        }
        if (!next()) { stop(); return; }
        P.timer = setTimeout(tick, 1300 / P.speed);
      };
      P.timer = setTimeout(tick, 500 / P.speed);
    }
    function stop() {
      if (P.timer) clearTimeout(P.timer);
      P.timer = null;
      playBtn.textContent = ui('Play', 'চালান');
      playBtn.setAttribute('aria-pressed', 'false');
    }

    function save() {
      if (!memoKey) return;
      GV.memo[memoKey] = { ex: P.ex, i: P.i, inputs: P.inputs, speed: P.speed };
    }

    // wiring
    playBtn.onclick = play;
    const nb = $('.pl-next'); if (nb) nb.onclick = () => { stop(); next(); };
    const bb = $('.pl-back'); if (bb) bb.onclick = back;
    const rb = $('.pl-reset'); if (rb) rb.onclick = () => { stop(); P.answered = {}; show(0); };
    range.oninput = () => { stop(); show(+range.value); };
    const sp = $('.pl-speed'); if (sp) { sp.value = String(P.speed); sp.onchange = () => { P.speed = +sp.value; save(); }; }
    const pr = $('.pl-predict'); if (pr) pr.onchange = () => { GV.st.predict = pr.checked; GV.save(); };
    const exSel = $('.pl-ex'); if (exSel) { exSel.value = String(P.ex); exSel.onchange = () => { P.ex = +exSel.value; buildInputs(); rebuild(true); }; }
    const cp = $('.pl-copy'); if (cp) cp.onclick = () => GV.copyText(P.code.plain.join('\n'), cp);

    if (!mini) {
      root.tabIndex = -1;
      root.addEventListener('keydown', (e) => {
        if (e.target.matches('input, select, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
        if (e.key === 'ArrowRight') { e.preventDefault(); stop(); next(); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
        else if (e.key === ' ' && !e.target.matches('button')) { e.preventDefault(); play(); }
        else if (e.key === 'r' || e.key === 'R') { stop(); show(0); }
      });
    }

    if (window.ResizeObserver) new ResizeObserver(redrawArrows).observe(stage);
    stage.addEventListener('scroll', redrawArrows, true);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(redrawArrows);

    buildInputs();
    rebuild(false);
    if (opts.autoplay) setTimeout(play, 700);

    return {
      jumpToLine(marker) {
        const target = typeof marker === 'number' ? marker : P.code.markers[marker];
        const k = P.steps.findIndex((s) => lineOf(s) === target);
        if (k >= 0) { stop(); show(k); }
        return k >= 0;
      },
      highlightOnly(marker) {
        const target = typeof marker === 'number' ? marker : P.code.markers[marker];
        root.querySelectorAll('.cl.peek').forEach((el) => el.classList.remove('peek'));
        const el = root.querySelector(`.cl[data-ln="${target}"]`);
        if (el) el.classList.add('peek');
      },
      setExample(k) { if (k >= 0 && k < examples.length && k !== P.ex) { P.ex = k; if (exSel) exSel.value = String(k); buildInputs(); rebuild(true); } },
      get example() { return P.ex; },
      destroy() { stop(); },
    };
  };
})();
