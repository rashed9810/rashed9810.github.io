/* renderers.js: turns a step's "panels" into HTML, and draws arrows between them.
   A step is a full snapshot, so each render is stateless and Back works for free. */
(function () {
  'use strict';
  const GV = window.GV;
  const esc = GV.esc;
  const T = GV.T;

  const norm = (c) => (c !== null && typeof c === 'object' && !Array.isArray(c) ? c : { v: c });
  const show = (v) => (v === undefined ? '' : v === null ? 'nil' : typeof v === 'object' && !Array.isArray(v) && ('en' in v) ? T(v) : esc(Array.isArray(v) ? '[' + v.join(' ') + ']' : v));
  const idAttr = (id) => (id ? ` data-id="${esc(id)}"` : '');

  // Colour family for pointer tags: left-ish names cyan, right-ish violet, "current" amber.
  const TAGC = { lo: 'a', l: 'a', left: 'a', i: 'a', slow: 'a', prev: 'a', start: 'a', head: 'a',
    hi: 'b', r: 'b', right: 'b', j: 'b', fast: 'b', next: 'b', end: 'b',
    mid: 'w', cur: 'w', key: 'w', top: 'w' };
  const tag = (name, cls) => `<span class="tag tag-${cls || TAGC[name] || 'n'}">${esc(name)}</span>`;

  const R = {};

  R.array = (p) => {
    const ptrs = {};
    Object.entries(p.ptrs || {}).forEach(([name, at]) => {
      if (at == null || at < 0) return;
      (ptrs[at] = ptrs[at] || []).push(name);
    });
    const cols = (p.cells || []).map((raw, i) => {
      const c = norm(raw);
      const id = c.id || (p.id ? `${p.id}-${i}` : '');
      const tags = (ptrs[i] || []).map((nm) => tag(nm, p.tagCls && p.tagCls[nm])).join('');
      return `<div class="col"><div class="cell ${c.cls || ''}"${idAttr(id)}><span>${show(c.v)}</span></div>` +
        (p.idx === false ? '' : `<div class="idx">${c.i != null ? esc(c.i) : i}</div>`) +
        `<div class="tags">${tags}</div></div>`;
    }).join('');
    const empty = (p.cells || []).length ? '' : `<div class="muted small">${GV.ui('empty', 'খালি')}</div>`;
    return `<div class="arr ${p.chars ? 'chars' : ''}">${cols}${empty}</div>`;
  };

  const fieldTable = (fields) => `<table class="fields">${fields.map((f) => {
    const x = Array.isArray(f) ? { k: f[0], v: f[1] } : f;
    return `<tr class="${x.cls || ''}"${idAttr(x.id)}><th>${esc(x.k)}</th><td>${show(x.v)}</td></tr>`;
  }).join('')}</table>`;

  R.boxes = (p) => {
    const items = (p.items || []).map((b) => {
      const body = b.fields ? fieldTable(b.fields) : `<div class="mb-val">${show(b.val)}</div>`;
      const tags = (b.tags || []).map((t) => tag(t)).join('');
      return `<div class="mcell"><div class="mbox ${b.cls || ''}"${idAttr(b.id)}>
        <div class="mb-head"><span class="mb-name">${esc(b.name || '')}</span>${b.type ? `<span class="mb-type">${esc(b.type)}</span>` : ''}</div>
        ${body}${b.addr ? `<div class="mb-addr">${esc(b.addr)}</div>` : ''}
      </div>${tags ? `<div class="tags">${tags}</div>` : ''}</div>`;
    }).join('');
    const empty = (p.items || []).length ? '' : `<div class="muted small">${p.emptyText ? T(p.emptyText) : GV.ui('nothing yet', 'এখনো কিছু নেই')}</div>`;
    return `<div class="boxes ${p.layout === 'chain' ? 'chain' : ''}">${items}${empty}</div>`;
  };

  R.frames = (p) => {
    const list = (p.items || []).slice();
    const html = list.map((f, i) => {
      const top = i === list.length - 1;
      const vars = (f.vars || []).map((v) => {
        const val = v.fields ? fieldTable(v.fields) : `<span class="fv">${show(v.v)}</span>`;
        return `<div class="fvar ${v.cls || ''}"${idAttr(v.id)}><span class="fk">${esc(v.k)}</span>${val}</div>`;
      }).join('');
      return `<div class="frame ${top ? 'top' : ''} ${f.cls || ''}"><div class="fr-fn"><span>${esc(f.fn)}</span>${top ? `<span class="fr-top">${GV.ui('running', 'চলছে')}</span>` : ''}</div>${vars ? `<div class="fr-vars">${vars}</div>` : ''}</div>`;
    }).reverse().join('');
    return `<div class="frames">${html || `<div class="muted small">${GV.ui('stack is empty', 'stack খালি')}</div>`}</div>`;
  };

  R.kv = (p) => {
    const rows = (p.rows || []).map((r) => `<tr class="${r.cls || ''}"${idAttr(r.id)}><td>${show(r.k)}</td><td>${show(r.v)}</td></tr>`).join('');
    const head = p.head || ['key', 'value'];
    return `<table class="kv"><thead><tr><th>${esc(head[0])}</th><th>${esc(head[1])}</th></tr></thead><tbody>${rows ||
      `<tr><td colspan="2" class="muted small">${p.nilMap ? 'nil map' : GV.ui('empty map', 'খালি map')}</td></tr>`}</tbody></table>`;
  };

  R.stack = (p) => {
    const items = (p.items || []).map(norm);
    const horiz = p.dir === 'h';
    const cells = items.map((c, i) => `<div class="sitem ${c.cls || ''}"${idAttr(c.id)}>${show(c.v)}${(!horiz && i === items.length - 1) ? `<span class="stop">${GV.ui('top', 'উপরে')}</span>` : ''}</div>`);
    if (!horiz) cells.reverse();
    const empty = items.length ? '' : `<div class="muted small">${GV.ui('empty', 'খালি')}</div>`;
    return `<div class="stk ${horiz ? 'h' : 'v'}">${horiz && items.length ? `<span class="qend">${GV.ui('front', 'সামনে')}</span>` : ''}${cells.join('')}${empty}</div>`;
  };

  const STATE = {
    run: ['running', 'চলছে'], block: ['blocked', 'আটকে আছে'], wait: ['waiting', 'অপেক্ষায়'],
    done: ['finished', 'শেষ'], sleep: ['sleeping', 'ঘুমাচ্ছে'], idle: ['idle', 'অলস'], new: ['created', 'তৈরি হলো'], panic: ['panicked', 'panic'],
  };
  R.lanes = (p) => `<div class="lanes">${(p.items || []).map((g) => {
    const s = STATE[g.state] || STATE.run;
    return `<div class="lane st-${g.state || 'run'} ${g.cls || ''}"${idAttr(g.id)}>
      <span class="ln-name">${esc(g.name)}</span>
      <span class="ln-state">${GV.ui(s[0], s[1])}</span>
      <span class="ln-text">${g.text ? GV.I(g.text) : ''}</span>
      ${g.reg != null ? `<span class="ln-reg">${esc(g.reg)}</span>` : ''}
    </div>`;
  }).join('')}</div>`;

  R.chan = (p) => {
    const cap = p.cap || 0;
    let slots = '';
    if (cap === 0) {
      slots = `<div class="slot hand ${p.hand != null ? 'full' : ''}">${p.hand != null ? show(p.hand) : GV.ui('hand-off', 'হাতবদল')}</div>`;
    } else {
      for (let i = 0; i < cap; i++) {
        const v = (p.buf || [])[i];
        slots += `<div class="slot ${v !== undefined ? 'full' : ''}">${v !== undefined ? show(v) : ''}</div>`;
      }
    }
    return `<div class="chan ${p.closed ? 'closed' : ''}"${idAttr(p.id)}>
      <div class="ch-meta"><code>${esc(p.name || 'ch')}</code><span>${cap === 0 ? GV.ui('unbuffered', 'unbuffered') : 'cap ' + cap}</span>${p.closed ? `<span class="pill bad">${GV.ui('closed', 'বন্ধ')}</span>` : ''}</div>
      <div class="ch-pipe">${slots}</div></div>`;
  };

  R.graph = (p) => {
    const W = p.w || 420, H = p.h || 260;
    const pos = {};
    (p.nodes || []).forEach((nd) => { pos[nd.id] = nd; });
    const edges = (p.edges || []).map((e) => {
      const a = pos[e.a], b = pos[e.b];
      if (!a || !b) return '';
      const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, r = 19;
      const x1 = a.x + dx / len * r, y1 = a.y + dy / len * r, x2 = b.x - dx / len * (r + (p.directed ? 4 : 0)), y2 = b.y - dy / len * (r + (p.directed ? 4 : 0));
      const mid = e.w != null ? `<text x="${(a.x + b.x) / 2}" y="${(a.y + b.y) / 2 - 6}" class="g-w">${esc(e.w)}</text>` : '';
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="g-edge ${e.cls || ''}" ${p.directed ? 'marker-end="url(#gah)"' : ''}/>${mid}`;
    }).join('');
    const nodes = (p.nodes || []).map((nd) => `<g class="g-node ${nd.cls || ''}"><circle cx="${nd.x}" cy="${nd.y}" r="19"/><text x="${nd.x}" y="${nd.y + 5}">${esc(nd.label != null ? nd.label : nd.id)}</text>${nd.sub != null ? `<text x="${nd.x}" y="${nd.y + 36}" class="g-sub">${esc(nd.sub)}</text>` : ''}</g>`).join('');
    return `<svg class="graph" viewBox="0 0 ${W} ${H}" role="img" aria-label="graph"><defs><marker id="gah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="g-ah"/></marker></defs>${edges}${nodes}</svg>`;
  };

  R.table = (p) => {
    const cls = p.cls || {};
    const head = `<tr><th class="corner">${esc(p.corner || '')}</th>${(p.cols || []).map((c) => `<th>${esc(c)}</th>`).join('')}</tr>`;
    const body = (p.cells || []).map((row, r) => `<tr><th>${esc((p.rows || [])[r] != null ? p.rows[r] : r)}</th>${row.map((v, c) => `<td class="${cls[r + ',' + c] || ''}">${v == null ? '' : esc(v)}</td>`).join('')}</tr>`).join('');
    return `<div class="tblwrap"><table class="dp">${head}${body}</table></div>`;
  };

  R.bytes = (p) => `<div class="bytes">${(p.groups || []).map((g) => `<div class="bgrp ${g.cls || ''}">
      <div class="bch">${g.ch === ' ' ? '␠' : esc(g.ch)}</div>
      <div class="bcells">${g.bytes.map((b, k) => `<span class="bcell"><span class="bhex">${esc(b)}</span><span class="bidx">${g.idx + k}</span></span>`).join('')}</div>
      <div class="bcp">${esc(g.cp || '')}</div>
    </div>`).join('')}</div>`;

  R.bars = (p) => {
    const vals = p.vals || [];
    const max = p.max || Math.max(1, ...vals);
    const cls = p.cls || {};
    return `<div class="bars">${vals.map((v, i) => `<div class="bar ${cls[i] || ''}"><div class="bfill" style="height:${Math.max(6, (v / max) * 100)}%"><span>${esc(v)}</span></div><div class="idx">${i}</div></div>`).join('')}</div>`;
  };

  R.flow = (p) => `<div class="flow">${(p.items || []).map((it, i) => `${i ? `<span class="flow-arrow ${it.back ? 'back' : ''}" aria-hidden="true"></span>` : ''}<div class="fstage ${it.cls || ''}"${idAttr(it.id)}><div class="fs-label">${T(it.label)}</div>${it.sub ? `<div class="fs-sub">${T(it.sub)}</div>` : ''}</div>`).join('')}</div>`;

  R.out = (p) => {
    const lines = (p.lines || []).map((l) => {
      const x = norm(l);
      return `<div class="oline ${x.cls || ''}">${esc(x.v)}</div>`;
    }).join('');
    return `<div class="term">${lines || `<div class="oline muted">${GV.ui('(no output yet)', '(এখনো কোনো output নেই)')}</div>`}</div>`;
  };

  R.timeline = (p) => {
    const max = p.max || 1;
    const marks = (p.marks || []).map((m) => `<div class="tl-mark ${m.cls || ''}" style="left:${(m.t / max) * 100}%"><span>${T(m.label)}</span></div>`).join('');
    return `<div class="tl"><div class="tl-bar"><div class="tl-fill" style="width:${Math.min(100, (p.now / max) * 100)}%"></div>${marks}</div><div class="tl-now">t = ${esc(p.now)}${esc(p.unit || 'ms')}</div></div>`;
  };

  R.text = (p) => `<div class="callout ${p.cls || ''}">${GV.I(p.text)}</div>`;

  GV.renderPanels = function (panels) {
    return (panels || []).map((p) => {
      const fn = R[p.type];
      if (!fn) return '';
      const title = p.title ? `<h4 class="pn-title">${T(p.title)}${p.badge ? ` <span class="pill">${T(p.badge)}</span>` : ''}</h4>` : '';
      return `<section class="panel pt-${p.type} ${p.wide ? 'wide' : ''} ${p.cls || ''}">${title}${fn(p)}</section>`;
    }).join('');
  };

  /* ---------- arrows ---------- */
  function edgePoint(r, toward, pad) {
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    const dx = toward.x - cx, dy = toward.y - cy;
    if (!dx && !dy) return { x: cx, y: cy };
    const hw = r.w / 2 + pad, hh = r.h / 2 + pad;
    const s = Math.min(hw / Math.abs(dx || 1e-9), hh / Math.abs(dy || 1e-9));
    return { x: cx + dx * s, y: cy + dy * s };
  }

  GV.drawArrows = function (stage, arrows) {
    const svg = stage.querySelector('.pl-arrows');
    if (!svg) return;
    const sr = stage.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${Math.round(sr.width)} ${Math.round(sr.height)}`);
    svg.setAttribute('width', Math.round(sr.width));
    svg.setAttribute('height', Math.round(sr.height));
    const kinds = ['n', 'w', 'd', 'bad', 'ok'];
    let out = '<defs>' + kinds.map((k) => `<marker id="ah-${k}-${stage.dataset.uid}" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="ah ah-${k}"/></marker>`).join('') + '</defs>';
    (arrows || []).forEach((a) => {
      const A = stage.querySelector(`[data-id="${a.from}"]`);
      const B = stage.querySelector(`[data-id="${a.to}"]`);
      if (!A || !B) return;
      const ra0 = A.getBoundingClientRect(), rb0 = B.getBoundingClientRect();
      if (!ra0.width || !rb0.width) return;
      const ra = { x: ra0.left - sr.left, y: ra0.top - sr.top, w: ra0.width, h: ra0.height };
      const rb = { x: rb0.left - sr.left, y: rb0.top - sr.top, w: rb0.width, h: rb0.height };
      const ca = { x: ra.x + ra.w / 2, y: ra.y + ra.h / 2 }, cb = { x: rb.x + rb.w / 2, y: rb.y + rb.h / 2 };
      const p1 = edgePoint(ra, cb, 1), p2 = edgePoint(rb, ca, 3);
      const dx = p2.x - p1.x, dy = p2.y - p1.y, len = Math.hypot(dx, dy) || 1;
      const off = Math.min(46, len * 0.22) * (a.bend == null ? 1 : a.bend);
      const qx = (p1.x + p2.x) / 2 - (dy / len) * off, qy = (p1.y + p2.y) / 2 + (dx / len) * off;
      const k = a.cls || 'n';
      out += `<path d="M${p1.x.toFixed(1)},${p1.y.toFixed(1)} Q${qx.toFixed(1)},${qy.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}" class="arrow a-${k}" marker-end="url(#ah-${k}-${stage.dataset.uid})"/>`;
      if (a.label) out += `<text x="${qx.toFixed(1)}" y="${(qy - 4).toFixed(1)}" class="a-label">${T(a.label)}</text>`;
    });
    svg.innerHTML = out;
  };
})();
