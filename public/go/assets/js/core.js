/* core.js: shared state, language helpers and the Go syntax highlighter.
   Everything hangs off one global (GV) so the site works from plain <script> tags,
   on GitHub Pages and when index.html is opened straight from disk. */
(function () {
  'use strict';

  const GV = (window.GV = { lessons: [], byId: {}, glossary: [], memo: {} });
  GV.L = (en, bn) => ({ en, bn });

  GV.register = function (lesson) {
    GV.lessons.push(lesson);
    GV.byId[lesson.id] = lesson;
  };

  /* ---------- per-viewer state (progress, language, theme) ---------- */
  const KEY = 'go-line-by-line.v1';
  let st = {};
  try { st = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { st = {}; }
  st.done = st.done || {};
  st.quiz = st.quiz || {};
  if (!['en', 'bn', 'both'].includes(st.lang)) st.lang = 'both';
  if (typeof st.predict !== 'boolean') st.predict = true;
  GV.st = st;
  GV.save = function () {
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* storage blocked: progress lives for this visit only */ }
  };

  /* ---------- text helpers ---------- */
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ESC[c]);
  GV.esc = esc;

  const pick = (v) => (st.lang === 'bn' ? (v.bn != null ? v.bn : v.en) : (v.en != null ? v.en : v.bn));

  // ui(): interface chrome. "Both" keeps buttons short and in English.
  GV.ui = (en, bn) => (st.lang === 'bn' ? bn : en);
  // T(): a short plain label (string or {en,bn}), escaped.
  GV.T = (v) => (v == null ? '' : typeof v === 'object' ? esc(pick(v)) : esc(v));
  // H(): a heading. In "both" mode the Bangla sits under the English.
  GV.H = (v) => {
    if (v == null) return '';
    if (typeof v !== 'object') return esc(v);
    if (st.lang === 'both') return `<span lang="en">${esc(v.en)}</span><span class="h-bn" lang="bn">${esc(v.bn)}</span>`;
    return esc(pick(v));
  };
  // I(): trusted inline rich text from lesson files (may contain <code>, <b>).
  GV.I = (v) => {
    if (v == null) return '';
    if (typeof v !== 'object') return String(v);
    if (st.lang === 'both') return `<span class="dual-i"><span lang="en">${v.en}</span><span class="bn" lang="bn">${v.bn}</span></span>`;
    return `<span lang="${st.lang}">${pick(v)}</span>`;
  };
  // P(): trusted paragraphs. Accepts {en,bn} where each is a string or array of paragraphs.
  GV.P = (v) => {
    if (v == null) return '';
    const paras = (x) => (Array.isArray(x) ? x : [x]).map((p) => `<p>${p}</p>`).join('');
    if (typeof v !== 'object' || Array.isArray(v)) return paras(v);
    if (st.lang === 'both') {
      return `<div class="dual"><div class="dual-en" lang="en">${paras(v.en)}</div><div class="dual-bn bn" lang="bn">${paras(v.bn)}</div></div>`;
    }
    return `<div lang="${st.lang}">${paras(pick(v))}</div>`;
  };

  /* ---------- Go highlighter ---------- */
  const KW = new Set('break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var'.split(' '));
  const TY = new Set('bool byte complex64 complex128 error float32 float64 int int8 int16 int32 int64 rune string uint uint8 uint16 uint32 uint64 uintptr any comparable'.split(' '));
  const BI = new Set('append cap clear close complex copy delete imag len make max min new panic print println real recover nil true false iota'.split(' '));

  // Index where a // comment starts, ignoring // inside strings. -1 if none.
  function commentStart(line) {
    let q = null;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) {
        if (c === '\\' && q !== '`') { i++; continue; }
        if (c === q) q = null;
        continue;
      }
      if (c === '"' || c === '`' || c === "'") { q = c; continue; }
      if (c === '/' && line[i + 1] === '/') return i;
    }
    return -1;
  }

  function hlCode(code) {
    let out = '';
    let i = 0;
    const n = code.length;
    while (i < n) {
      const c = code[i];
      if (c === '"' || c === '`' || c === "'") {
        let j = i + 1;
        while (j < n && code[j] !== c) { if (code[j] === '\\' && c !== '`') j++; j++; }
        j = Math.min(j + 1, n);
        out += `<span class="t-str">${esc(code.slice(i, j))}</span>`;
        i = j;
        continue;
      }
      if (/[0-9]/.test(c) && !/[A-Za-z_0-9]/.test(code[i - 1] || '')) {
        let j = i;
        while (j < n && /[0-9a-fA-FxX._]/.test(code[j])) j++;
        out += `<span class="t-num">${esc(code.slice(i, j))}</span>`;
        i = j;
        continue;
      }
      if (/[A-Za-z_]/.test(c)) {
        let j = i;
        while (j < n && /[A-Za-z_0-9]/.test(code[j])) j++;
        const w = code.slice(i, j);
        const cls = KW.has(w) ? 't-kw' : TY.has(w) ? 't-ty' : BI.has(w) ? 't-bi' : code[j] === '(' ? 't-fn' : '';
        out += cls ? `<span class="${cls}">${w}</span>` : w;
        i = j;
        continue;
      }
      out += esc(c);
      i++;
    }
    return out;
  }
  GV.hlCode = hlCode;

  /* prepCode(): turns lesson source into display lines.
     - "@@name" at the end of a line is a marker that steps can point at; it is stripped.
     - In a comment, "{English|বাংলা}" picks one side by language (Bangla in "both" mode). */
  GV.prepCode = function (src) {
    const raw = String(src).replace(/^\n+/, '').replace(/\s+$/, '').split('\n');
    const markers = {};
    const plain = [];
    raw.forEach((ln, idx) => {
      const m = ln.match(/\s*@@([\w-]+)\s*$/);
      if (m) { markers[m[1]] = idx + 1; ln = ln.slice(0, m.index); }
      const cs = commentStart(ln);
      if (cs >= 0) {
        const head = ln.slice(0, cs);
        const com = ln.slice(cs).replace(/\{([^{}|]*)\|([^{}]*)\}/g, (_, en, bn) => (st.lang === 'en' ? en : bn));
        ln = head + com;
      }
      plain.push(ln.replace(/\s+$/, ''));
    });
    // gofmt aligns trailing comments on consecutive lines that share an indent.
    // Comment text differs per language, so the padding is computed here.
    const rows = plain.map((ln) => {
      const cs = commentStart(ln);
      const indent = ln.match(/^\t*/)[0];
      if (cs < 0) return null;
      const code = ln.slice(0, cs).replace(/\s+$/, '');
      if (code.trim() === '') return null;
      return { indent, code, com: ln.slice(cs) };
    });
    for (let i = 0; i < rows.length;) {
      if (!rows[i]) { i++; continue; }
      let j = i;
      while (j + 1 < rows.length && rows[j + 1] && rows[j + 1].indent === rows[i].indent) j++;
      if (j > i) {
        const w = Math.max(...rows.slice(i, j + 1).map((r) => [...r.code].length));
        for (let k = i; k <= j; k++) plain[k] = rows[k].code + ' '.repeat(w - [...rows[k].code].length + 1) + rows[k].com;
      }
      i = j + 1;
    }
    const html = plain.map((ln) => {
      const cs = commentStart(ln);
      if (cs < 0) return hlCode(ln);
      return hlCode(ln.slice(0, cs)) + `<span class="t-com">${esc(ln.slice(cs))}</span>`;
    });
    return { plain, html, markers };
  };

  /* Small DOM helpers */
  GV.$ = (sel, root) => (root || document).querySelector(sel);
  GV.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  GV.copyText = function (text, btn) {
    const done = (ok) => {
      if (!btn) return;
      const old = btn.textContent;
      btn.textContent = ok ? GV.ui('Copied', 'কপি হয়েছে') : GV.ui('Select and copy', 'সিলেক্ট করে কপি করুন');
      setTimeout(() => { btn.textContent = old; }, 1400);
    };
    try {
      navigator.clipboard.writeText(text).then(() => done(true), () => done(false));
    } catch (e) { done(false); }
  };

  // Thrown by a lesson's build() when the reader's input can't be used.
  GV.InputError = function (msg) { this.msg = msg; };

  /* ---------- lesson-writing kit ---------- */
  // step(line, note, panels, extra): one frame of an animation.
  GV.step = (line, note, panels, extra) => Object.assign({ line, note, panels: panels || [] }, extra || {});
  // out(lines, fresh): a terminal panel; the last `fresh` lines are highlighted as new.
  GV.out = (lines, fresh) => ({
    type: 'out',
    title: GV.L('Output', 'আউটপুট'),
    lines: lines.map((l, i) => {
      const x = typeof l === 'string' ? { v: l } : Object.assign({}, l);
      if (fresh && i >= lines.length - fresh && !x.cls) x.cls = 'new';
      return x;
    }),
  });
  // Fake but realistic-looking 64-bit Go heap addresses.
  GV.addr = (k) => '0xc0000' + (0x14080 + k * 8).toString(16);
  GV.clone = (o) => JSON.parse(JSON.stringify(o));
})();
