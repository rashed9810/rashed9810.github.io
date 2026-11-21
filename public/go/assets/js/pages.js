/* pages.js: routing plus the home, lesson and glossary views. */
(function () {
  'use strict';
  const GV = window.GV;
  const { esc, T, H, I, P, ui } = GV;

  const PHASES = [
    { id: 'start', track: 'go', title: GV.L('Start here', 'এখান থেকে শুরু'), why: GV.L('How a Go program runs, and the everyday syntax you will type all the time.', 'Go প্রোগ্রাম কীভাবে চলে, আর প্রতিদিন যে syntax লিখবেন।') },
    { id: 'memory', track: 'go', title: GV.L('Memory and data', 'মেমরি ও ডেটা'), why: GV.L('What really lives in memory: pointers, slices, maps and UTF-8 strings. Most Go bugs start here.', 'মেমরিতে আসলে কী থাকে: pointer, slice, map আর UTF-8 string। বেশিরভাগ Go bug এখান থেকেই শুরু।') },
    { id: 'types', track: 'go', title: GV.L('Types and behaviour', 'টাইপ ও আচরণ'), why: GV.L('Structs, interfaces and errors: the tools you design every backend service with.', 'Struct, interface আর error: প্রতিটা backend service ডিজাইনের মূল হাতিয়ার।') },
    { id: 'conc', track: 'go', title: GV.L('Concurrency', 'কনকারেন্সি'), why: GV.L('Goroutines, channels, locks and context. The reason companies pick Go for servers.', 'Goroutine, channel, lock আর context। সার্ভারের জন্য কোম্পানিগুলো Go বেছে নেয় এই কারণেই।') },
    { id: 'backend', track: 'go', title: GV.L('Backend', 'ব্যাকএন্ড'), why: GV.L('How a real HTTP request travels through a Go server.', 'একটা আসল HTTP request কীভাবে Go সার্ভারের ভেতর দিয়ে যায়।') },
    { id: 'patterns', track: 'dsa', title: GV.L('Problem-solving patterns', 'সমস্যা সমাধানের প্যাটার্ন'), why: GV.L('Five patterns that solve a large share of interview and production problems.', 'পাঁচটা প্যাটার্ন, যা দিয়ে ইন্টারভিউ আর বাস্তব কাজের অনেক সমস্যা সমাধান হয়।') },
    { id: 'structures', track: 'dsa', title: GV.L('Structures, sorting and graphs', 'ডেটা স্ট্রাকচার, সর্টিং ও গ্রাফ'), why: GV.L('Linked lists, sorting, graph search and dynamic programming.', 'Linked list, sorting, graph search আর dynamic programming।') },
  ];
  GV.PHASES = PHASES;

  const PLANNED = [
    GV.L('REST API with PostgreSQL (database/sql, pgx, migrations)', 'PostgreSQL সহ REST API (database/sql, pgx, migration)'),
    GV.L('Testing: table-driven tests, benchmarks, the race detector', 'Testing: table-driven test, benchmark, race detector'),
    GV.L('Docker: multi-stage builds and a 10 MB image', 'Docker: multi-stage build আর ১০ MB-এর image'),
    GV.L('Microservices: gRPC, protobuf and message queues', 'Microservice: gRPC, protobuf আর message queue'),
    GV.L('Distributed systems: retries, timeouts, tracing', 'Distributed system: retry, timeout, tracing'),
    GV.L('AI systems: streaming LLM calls, embeddings, a RAG service', 'AI সিস্টেম: streaming LLM call, embedding, RAG service'),
  ];

  function ordered(track) {
    return PHASES.filter((p) => !track || p.track === track).flatMap((ph) => GV.lessons.filter((l) => l.phase === ph.id).sort((a, b) => a.order - b.order));
  }
  GV.ordered = ordered;
  const number = (l) => ordered(l.track).indexOf(l) + 1;
  const trackName = (t) => (t === 'go' ? GV.L('Go concepts', 'Go কনসেপ্ট') : GV.L('Data structures and algorithms', 'ডেটা স্ট্রাকচার ও অ্যালগরিদম'));

  let activePlayers = [];
  function cleanup() { activePlayers.forEach((p) => p.destroy()); activePlayers = []; }

  /* ---------- top bar ---------- */
  function renderTopbar() {
    const bar = GV.$('#topbar');
    bar.innerHTML = `
      <div class="tb-inner">
        <a class="brand" href="#home" aria-label="Go, line by line home"><span class="brand-mark" aria-hidden="true">go<b>|</b></span><span class="brand-name">${ui('Go, line by line', 'লাইন ধরে Go')}</span></a>
        <nav class="tb-nav" aria-label="${ui('Sections', 'বিভাগ')}">
          <a href="#home">${ui('Roadmap', 'রোডম্যাপ')}</a>
          <a href="#glossary">${ui('Glossary', 'শব্দকোষ')}</a>
        </nav>
        <div class="tb-tools">
          <button type="button" class="btn ghost search-btn" aria-label="${ui('Search lessons', 'লেসন খুঁজুন')}"><span>${ui('Search', 'খুঁজুন')}</span><kbd>Ctrl K</kbd></button>
          <div class="seg" role="group" aria-label="Language">
            ${[['en', 'EN'], ['bn', 'বাং'], ['both', ui('Both', 'দুটো')]].map(([k, lbl]) => `<button type="button" data-lang="${k}" aria-pressed="${GV.st.lang === k}">${lbl}</button>`).join('')}
          </div>
          <button type="button" class="btn ghost icon theme-btn" aria-label="${ui('Switch light or dark theme', 'লাইট বা ডার্ক থিম')}" title="${ui('Theme', 'থিম')}"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z" fill="currentColor"/></svg></button>
        </div>
      </div>`;
    bar.querySelectorAll('[data-lang]').forEach((b) => { b.onclick = () => { GV.st.lang = b.dataset.lang; GV.save(); document.documentElement.lang = GV.st.lang === 'en' ? 'en' : 'bn'; route(true); }; });
    bar.querySelector('.theme-btn').onclick = () => {
      const root = document.documentElement;
      const cur = root.dataset.theme || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
      root.dataset.theme = cur === 'dark' ? 'light' : 'dark';
      GV.st.theme = root.dataset.theme; GV.save();
    };
    bar.querySelector('.search-btn').onclick = openSearch;
  }

  /* ---------- home ---------- */
  function lessonRow(l) {
    const done = GV.st.done[l.id];
    const q = GV.st.quiz[l.id];
    return `<a class="lrow ${done ? 'is-done' : ''}" href="#${l.id}">
      <span class="lnum mono">${String(number(l)).padStart(2, '0')}</span>
      <span class="ltext"><span class="ltitle">${H(l.title)}</span><span class="lsum">${T(l.summary)}</span></span>
      <span class="lmeta">${q ? `<span class="pill">${q.score}/${q.total}</span>` : ''}<span class="mono muted">${l.minutes} min</span>${done ? `<span class="pill ok">${ui('Done', 'শেষ')}</span>` : ''}</span>
    </a>`;
  }

  function renderHome() {
    const all = ordered();
    const doneCount = all.filter((l) => GV.st.done[l.id]).length;
    const last = GV.byId[GV.st.last];
    const firstUndone = all.find((l) => !GV.st.done[l.id]) || all[0];
    const resume = last && !GV.st.done[last.id] ? last : firstUndone;
    const pct = all.length ? Math.round((doneCount / all.length) * 100) : 0;
    const totalSteps = '600+';

    const phaseHtml = (track) => PHASES.filter((p) => p.track === track).map((ph) => {
      const ls = GV.lessons.filter((l) => l.phase === ph.id).sort((a, b) => a.order - b.order);
      if (!ls.length) return '';
      return `<div class="phase"><div class="phase-head"><h3>${H(ph.title)}</h3><p class="muted">${T(ph.why)}</p></div><div class="lrows">${ls.map(lessonRow).join('')}</div></div>`;
    }).join('');

    GV.$('#main').innerHTML = `
      <section class="hero wrap">
        <div class="hero-copy">
          <p class="hero-kicker">${ui('Go for backend and AI systems engineers', 'ব্যাকএন্ড ও AI সিস্টেম ইঞ্জিনিয়ারদের জন্য Go')}</p>
          <h1 class="hero-title">${GV.st.lang === 'bn' ? 'লাইন ধরে ধরে Go শিখুন' : 'Learn Go one running line at a time'}</h1>
          ${GV.st.lang === 'both' ? '<p class="hero-bn bn" lang="bn">লাইন ধরে ধরে Go শিখুন</p>' : ''}
          ${P(GV.L(
            'Every lesson runs real Go code in front of you. Step forward and back, change the input, and watch memory, pointers, goroutines or an algorithm change with it. Explanations come in English, Bangla, or both side by side.',
            'প্রতিটা লেসনে আসল Go কোড আপনার সামনে চলে। ধাপে ধাপে সামনে-পেছনে যান, input বদলান, আর দেখুন memory, pointer, goroutine বা algorithm কীভাবে বদলায়। ব্যাখ্যা পাবেন ইংরেজিতে, বাংলায়, অথবা দুটো পাশাপাশি।'))}
          <div class="cta">
            <a class="btn primary big" href="#${resume.id}">${last && !GV.st.done[last.id] ? ui('Continue', 'আবার শুরু করুন') : doneCount ? ui('Next lesson', 'পরের লেসন') : ui('Start lesson 1', 'লেসন ১ শুরু করুন')}<span class="cta-sub">${T(resume.title)}</span></a>
            <a class="btn ghost big" href="#glossary">${ui('Open the glossary', 'শব্দকোষ দেখুন')}</a>
          </div>
          <dl class="facts">
            <div><dt>${ui('Lessons', 'লেসন')}</dt><dd class="mono">${all.length}</dd></div>
            <div><dt>${ui('Animated steps', 'অ্যানিমেটেড ধাপ')}</dt><dd class="mono">${totalSteps}</dd></div>
            <div><dt>${ui('Your progress', 'আপনার অগ্রগতি')}</dt><dd class="mono">${doneCount}/${all.length}</dd></div>
          </dl>
        </div>
        <div class="hero-demo">
          <div class="demo-chrome"><span class="demo-dot"></span><span class="mono">binary_search.go</span><a href="#dsa-binary-search" class="demo-link">${ui('Open lesson', 'লেসন খুলুন')}</a></div>
          <div id="hero-player"></div>
        </div>
      </section>

      <section class="wrap progress-band" aria-label="${ui('Progress', 'অগ্রগতি')}">
        <div class="pbar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><span style="width:${pct}%"></span></div>
        <p class="muted small">${ui(`${doneCount} of ${all.length} lessons finished. Progress is saved in this browser only.`, `${all.length}টার মধ্যে ${doneCount}টা লেসন শেষ। অগ্রগতি শুধু এই ব্রাউজারে সেভ থাকে।`)}</p>
      </section>

      <section class="wrap how">
        <h2>${H(GV.L('How each lesson works', 'প্রতিটা লেসন কীভাবে চলে'))}</h2>
        <ol class="how-list">
          <li>${I(GV.L('<b>The idea.</b> A plain-language picture of the concept, with a real-world analogy.', '<b>মূল ধারণা।</b> সহজ ভাষায় একটা বাস্তব উদাহরণ দিয়ে ধারণাটা।'))}</li>
          <li>${I(GV.L('<b>Watch it run.</b> The code steps line by line. Turn on Predict mode and the player stops to ask what happens next.', '<b>চালিয়ে দেখুন।</b> কোড লাইন ধরে ধরে চলে। Predict mode চালু করলে player থেমে জিজ্ঞেস করে এরপর কী হবে।'))}</li>
          <li>${I(GV.L('<b>Mistakes and errors.</b> The real compiler and runtime messages you will hit, and how to fix them.', '<b>ভুল ও error।</b> আসল compiler ও runtime error message, আর কীভাবে ঠিক করবেন।'))}</li>
          <li>${I(GV.L('<b>Quiz and practice.</b> Questions with explanations, then exercises with hints before the solution.', '<b>কুইজ ও অনুশীলন।</b> ব্যাখ্যাসহ প্রশ্ন, তারপর হিন্টসহ exercise, সমাধান শেষে।'))}</li>
        </ol>
        <p class="muted small keys">${ui('Keyboard: → next step, ← back, Space play or pause, R restart, Ctrl K search.', 'কিবোর্ড: → পরের ধাপ, ← পেছনে, Space চালান/থামান, R শুরুতে, Ctrl K খুঁজুন।')}</p>
      </section>

      <section class="wrap roadmap" id="roadmap">
        <div class="track"><h2>${H(trackName('go'))}</h2>${phaseHtml('go')}</div>
        <div class="track"><h2>${H(trackName('dsa'))}</h2>${phaseHtml('dsa')}</div>
        <div class="track planned">
          <h2>${H(GV.L('Coming next on the path', 'পথের পরের ধাপগুলো'))}</h2>
          <p class="muted">${ui('These build on the lessons above and arrive as new lessons on this page.', 'এগুলো উপরের লেসনের উপর ভিত্তি করে এই পেজে নতুন লেসন হিসেবে যোগ হবে।')}</p>
          <ul class="planned-list">${PLANNED.map((p) => `<li>${I(p)}</li>`).join('')}</ul>
        </div>
      </section>`;

    const demo = GV.byId['dsa-binary-search'];
    if (demo) activePlayers.push(GV.mountPlayer(GV.$('#hero-player'), demo.visual, { mini: true, autoplay: true, loop: true, idBase: 'hero' }));
    document.title = 'Go, line by line';
  }

  /* ---------- lesson ---------- */
  function renderLesson(l) {
    GV.st.last = l.id; GV.save();
    const list = ordered(l.track);
    const idx = list.indexOf(l);
    const prev = list[idx - 1], next = list[idx + 1];
    const phase = PHASES.find((p) => p.id === l.phase);
    const done = !!GV.st.done[l.id];

    const sections = [
      ['idea', GV.L('The idea', 'মূল ধারণা')],
      ['run', GV.L('Watch it run', 'চালিয়ে দেখুন')],
      l.walk && ['walk', GV.L('Read the code', 'কোড পড়া')],
      l.mistakes && ['mistakes', GV.L('Common mistakes', 'সাধারণ ভুল')],
      l.perf && ['perf', GV.L('Performance and best practice', 'পারফরম্যান্স ও ভালো অভ্যাস')],
      l.quiz && ['quiz', GV.L('Check yourself', 'নিজেকে যাচাই')],
      l.exercises && ['practice', GV.L('Practice', 'অনুশীলন')],
      l.takeaways && ['takeaways', GV.L('Key takeaways', 'মূল কথা')],
      l.links && ['docs', GV.L('Read more', 'আরও পড়ুন')],
    ].filter(Boolean);

    const sec = (id, title, body) => `<section class="lsec" id="s-${id}" aria-labelledby="h-${id}"><h2 id="h-${id}">${H(title)}</h2>${body}</section>`;
    const S = Object.fromEntries(sections);

    const complexity = l.complexity ? `<div class="cx"><div><span class="muted small">${ui('Time', 'সময়')}</span><b class="mono">${esc(l.complexity.time)}</b></div><div><span class="muted small">${ui('Extra space', 'অতিরিক্ত মেমরি')}</span><b class="mono">${esc(l.complexity.space)}</b></div>${l.complexity.note ? `<p class="small">${I(l.complexity.note)}</p>` : ''}</div>` : '';

    GV.$('#main').innerHTML = `
      <div class="lesson wrap">
        <article class="lmain">
          <nav class="crumbs small" aria-label="breadcrumb"><a href="#home">${ui('Roadmap', 'রোডম্যাপ')}</a><span aria-hidden="true">/</span><span>${T(trackName(l.track))}</span><span aria-hidden="true">/</span><span>${T(phase.title)}</span></nav>
          <header class="lhead">
            <p class="lnum-big mono">${l.track === 'go' ? 'Go' : 'DSA'} ${String(number(l)).padStart(2, '0')}</p>
            <h1>${H(l.title)}</h1>
            <div class="lsummary">${I(l.summary)}</div>
            <div class="lhead-meta"><span class="mono muted">${l.minutes} min</span>
              <button type="button" class="btn ${done ? 'ok' : 'ghost'} mark-done" aria-pressed="${done}">${done ? ui('Finished', 'শেষ হয়েছে') : ui('Mark as finished', 'শেষ হিসেবে চিহ্নিত করুন')}</button></div>
          </header>

          ${sec('idea', S.idea, `<div class="prose">${P(l.idea)}</div>`)}

          ${sec('run', S.run, `<p class="muted small run-hint">${ui('Press Play, or use → and ←. Change the input and press Run to try your own values.', 'Play চাপুন, অথবা → আর ← ব্যবহার করুন। input বদলে Run চাপলে নিজের মান দিয়ে দেখতে পারবেন।')}</p>
            <div id="lesson-player"></div>${complexity}`)}

          ${l.walk ? sec('walk', S.walk, `<ol class="walk">${l.walk.map((w, k) => `<li><button type="button" class="walk-btn" data-k="${k}"><code>${esc(w.code)}</code></button><div>${I(w.text)}</div></li>`).join('')}</ol>`) : ''}

          ${l.mistakes ? sec('mistakes', S.mistakes, `<div class="mistakes">${l.mistakes.map((m) => `<div class="mistake"><h3>${H(m.title)}</h3>${m.err ? `<pre class="err-term"><code>${esc(m.err)}</code></pre>` : ''}<div class="fix">${I(m.fix)}</div></div>`).join('')}</div>`) : ''}

          ${l.perf ? sec('perf', S.perf, `<div class="prose">${P(l.perf)}</div>`) : ''}

          ${l.quiz ? sec('quiz', S.quiz, `<div class="quiz">${l.quiz.map((q, k) => `<div class="qcard" data-k="${k}"><p class="qq"><span class="mono muted">Q${k + 1}</span> ${I(q.q)}</p><div class="qopts">${q.options.map((o, j) => `<button type="button" class="btn opt" data-j="${j}">${I(o)}</button>`).join('')}</div><div class="qfb" aria-live="polite"></div></div>`).join('')}<div class="qscore muted"></div></div>`) : ''}

          ${l.exercises ? sec('practice', S.practice, `<div class="exes">${l.exercises.map((x, k) => `<div class="ex" data-k="${k}">
              <h3><span class="mono muted">${ui('Exercise', 'অনুশীলন')} ${k + 1}</span> ${H(x.title)}</h3>
              <div class="prose">${P(x.task)}</div>
              <div class="hints"></div>
              <div class="ex-actions">
                ${(x.hints || []).length ? `<button type="button" class="btn ghost hint-btn">${ui('Show a hint', 'একটা হিন্ট দেখাও')} (<span>0</span>/${x.hints.length})</button>` : ''}
                <button type="button" class="btn ghost sol-btn">${ui('Show the solution', 'সমাধান দেখাও')}</button>
                <a class="btn ghost" href="https://go.dev/play/" target="_blank" rel="noopener">${ui('Open Go Playground', 'Go Playground খুলুন')}</a>
              </div>
              <div class="sol" hidden><div class="code-head"><span class="mono">${ui('One good answer', 'একটা ভালো সমাধান')}</span><button type="button" class="btn tiny ghost sol-copy">${ui('Copy code', 'কোড কপি')}</button></div><pre class="code"><code></code></pre></div>
            </div>`).join('')}</div>`) : ''}

          ${l.takeaways ? sec('takeaways', S.takeaways, `<ul class="takeaways">${l.takeaways.map((t) => `<li>${I(t)}</li>`).join('')}</ul>`) : ''}

          ${l.links ? sec('docs', S.docs, `<ul class="links">${l.links.map((k) => `<li><a href="${esc(k.url)}" target="_blank" rel="noopener">${esc(k.t)}</a><span class="muted small">${esc(new URL(k.url).hostname)}</span></li>`).join('')}</ul>`) : ''}

          <nav class="pager" aria-label="${ui('Lesson navigation', 'লেসন নেভিগেশন')}">
            ${prev ? `<a class="btn ghost big" href="#${prev.id}"><span class="small muted">${ui('Previous', 'আগের')}</span>${T(prev.title)}</a>` : '<span></span>'}
            ${next ? `<a class="btn ghost big right" href="#${next.id}"><span class="small muted">${ui('Next', 'পরের')}</span>${T(next.title)}</a>` : '<span></span>'}
          </nav>
        </article>
        <aside class="toc" aria-label="${ui('On this page', 'এই পেজে')}">
          <p class="toc-title small muted">${ui('On this page', 'এই পেজে')}</p>
          <ol>${sections.map(([id, t]) => `<li><a href="#${l.id}" data-sec="s-${id}">${T(t)}</a></li>`).join('')}</ol>
        </aside>
      </div>`;

    document.title = `${T(l.title).replace(/&amp;/g, '&')} · Go, line by line`;

    const player = GV.mountPlayer(GV.$('#lesson-player'), l.visual, { memoKey: l.id, idBase: l.id });
    activePlayers.push(player);

    GV.$('.mark-done').onclick = () => {
      GV.st.done[l.id] = !GV.st.done[l.id];
      if (!GV.st.done[l.id]) delete GV.st.done[l.id];
      GV.save();
      const b = GV.$('.mark-done');
      const on = !!GV.st.done[l.id];
      b.className = `btn ${on ? 'ok' : 'ghost'} mark-done`;
      b.setAttribute('aria-pressed', on);
      b.textContent = on ? ui('Finished', 'শেষ হয়েছে') : ui('Mark as finished', 'শেষ হিসেবে চিহ্নিত করুন');
    };

    // TOC: scroll within the page without touching the hash (it names the lesson).
    GV.$$('.toc a').forEach((a) => {
      a.onclick = (e) => { e.preventDefault(); const t = document.getElementById(a.dataset.sec); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    });
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((ents) => {
        ents.forEach((en) => {
          if (en.isIntersecting) {
            GV.$$('.toc a').forEach((a) => a.classList.toggle('on', a.dataset.sec === en.target.id));
          }
        });
      }, { rootMargin: '-30% 0px -60% 0px' });
      GV.$$('.lsec').forEach((s) => io.observe(s));
    }

    // Walkthrough: jump the player to that line.
    GV.$$('.walk-btn').forEach((b) => {
      b.onclick = () => {
        const w = l.walk[+b.dataset.k];
        if (w.ex != null) player.setExample(w.ex);
        player.jumpToLine(w.at);
        const pl = GV.$('#lesson-player');
        pl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        pl.focus({ preventScroll: true });
      };
    });

    // Quiz
    if (l.quiz) {
      const answers = {};
      GV.$$('.qcard').forEach((card) => {
        const q = l.quiz[+card.dataset.k];
        card.querySelectorAll('.opt').forEach((b) => {
          b.onclick = () => {
            const j = +b.dataset.j;
            answers[card.dataset.k] = j === q.answer;
            card.querySelectorAll('.opt').forEach((x) => { x.disabled = true; const jj = +x.dataset.j; if (jj === q.answer) x.classList.add('right'); else if (jj === j) x.classList.add('wrong'); });
            card.querySelector('.qfb').innerHTML = `<div class="fb ${j === q.answer ? 'ok' : 'bad'}">${j === q.answer ? ui('Correct.', 'ঠিক!') : ui('Not quite.', 'হয়নি।')} ${I(q.why)}</div>`;
            const n = Object.keys(answers).length;
            if (n === l.quiz.length) {
              const score = Object.values(answers).filter(Boolean).length;
              GV.st.quiz[l.id] = { score, total: n }; GV.save();
              const sc = GV.$('.qscore');
              sc.innerHTML = `<p><b>${score}/${n}</b> ${score === n ? ui('All correct. You are ready for the practice below.', 'সব ঠিক! নিচের অনুশীলনের জন্য আপনি প্রস্তুত।') : ui('Re-read the explanations above, step the player through the tricky part, then try again.', 'উপরের ব্যাখ্যাগুলো আবার পড়ুন, কঠিন অংশটা player-এ আবার চালান, তারপর আবার চেষ্টা করুন।')}</p><button type="button" class="btn ghost q-retry">${ui('Try the quiz again', 'আবার কুইজ দিন')}</button>`;
              sc.querySelector('.q-retry').onclick = () => { route(true); requestAnimationFrame(() => { const s = document.getElementById('s-quiz'); if (s) s.scrollIntoView(); }); };
            }
          };
        });
      });
    }

    // Exercises
    if (l.exercises) {
      GV.$$('.ex').forEach((box) => {
        const x = l.exercises[+box.dataset.k];
        let shown = 0;
        const hb = box.querySelector('.hint-btn');
        if (hb) hb.onclick = () => {
          if (shown >= x.hints.length) return;
          box.querySelector('.hints').insertAdjacentHTML('beforeend', `<div class="hint"><span class="mono small muted">${ui('Hint', 'হিন্ট')} ${shown + 1}</span> ${I(x.hints[shown])}</div>`);
          shown++;
          hb.querySelector('span').textContent = shown;
          if (shown >= x.hints.length) hb.disabled = true;
        };
        const sol = box.querySelector('.sol');
        const code = GV.prepCode(x.solution);
        sol.querySelector('code').innerHTML = code.html.map((h, k) => `<span class="cl"><span class="ln">${k + 1}</span><span class="lc">${h || ' '}</span></span>`).join('');
        box.querySelector('.sol-btn').onclick = (e) => {
          sol.hidden = !sol.hidden;
          e.currentTarget.textContent = sol.hidden ? ui('Show the solution', 'সমাধান দেখাও') : ui('Hide the solution', 'সমাধান লুকাও');
        };
        const cp = box.querySelector('.sol-copy');
        cp.onclick = () => GV.copyText(code.plain.join('\n'), cp);
      });
    }
  }

  /* ---------- glossary ---------- */
  function renderGlossary() {
    const rows = GV.glossary.slice().sort((a, b) => a.en.localeCompare(b.en));
    GV.$('#main').innerHTML = `
      <div class="wrap gloss">
        <header class="lhead"><h1>${H(GV.L('Glossary', 'শব্দকোষ'))}</h1>
          <div class="lsummary">${I(GV.L('Go and computer-science terms in English, with a Bangla meaning and a one-line explanation. The term stays in English in code and documentation.', 'Go ও কম্পিউটার সায়েন্সের শব্দ ইংরেজিতে, সাথে বাংলা অর্থ আর এক লাইনের ব্যাখ্যা। কোড ও ডকুমেন্টেশনে শব্দটা ইংরেজিতেই থাকে।'))}</div></header>
        <label class="fld gsearch" for="gloss-q"><span>${ui('Filter terms', 'শব্দ খুঁজুন')}</span><input id="gloss-q" type="search" autocomplete="off" placeholder="slice, goroutine, পয়েন্টার…"></label>
        <div class="gtable-wrap"><table class="gtable"><thead><tr><th>${ui('Term', 'শব্দ')}</th><th>বাংলা</th><th>${ui('Meaning', 'অর্থ')}</th><th>${ui('Lesson', 'লেসন')}</th></tr></thead>
        <tbody>${rows.map((g) => `<tr data-s="${esc((g.en + ' ' + g.bn + ' ' + g.def.en + ' ' + g.def.bn).toLowerCase())}"><td><code>${esc(g.en)}</code></td><td class="bn" lang="bn">${esc(g.bn)}</td><td>${I(g.def)}</td><td>${g.lesson && GV.byId[g.lesson] ? `<a href="#${g.lesson}">${T(GV.byId[g.lesson].title)}</a>` : ''}</td></tr>`).join('')}</tbody></table></div>
      </div>`;
    const q = GV.$('#gloss-q');
    q.oninput = () => { const v = q.value.trim().toLowerCase(); GV.$$('.gtable tbody tr').forEach((tr) => { tr.hidden = v && !tr.dataset.s.includes(v); }); };
    document.title = 'Glossary · Go, line by line';
  }

  /* ---------- search palette ---------- */
  function openSearch() {
    let dlg = GV.$('#search-dlg');
    if (!dlg) {
      dlg = document.createElement('dialog');
      dlg.id = 'search-dlg';
      document.body.appendChild(dlg);
    }
    dlg.innerHTML = `<form method="dialog" class="sd"><label class="sr" for="sd-q">${ui('Search lessons and terms', 'লেসন ও শব্দ খুঁজুন')}</label>
      <input id="sd-q" type="search" autocomplete="off" placeholder="${ui('Search lessons and glossary…', 'লেসন ও শব্দকোষে খুঁজুন…')}">
      <ul class="sd-res" role="listbox"></ul><p class="muted small">${ui('Enter opens the first result. Esc closes.', 'Enter চাপলে প্রথম ফলাফল খুলবে। Esc চাপলে বন্ধ।')}</p></form>`;
    const input = dlg.querySelector('#sd-q'), res = dlg.querySelector('.sd-res');
    const items = [
      ...ordered().map((l) => ({ href: '#' + l.id, title: T(l.title), sub: T(l.summary), s: (l.title.en + ' ' + l.title.bn + ' ' + l.summary.en + ' ' + l.summary.bn).toLowerCase() })),
      ...GV.glossary.map((g) => ({ href: g.lesson ? '#' + g.lesson : '#glossary', title: esc(g.en) + ' · ' + esc(g.bn), sub: T(g.def), s: (g.en + ' ' + g.bn + ' ' + g.def.en + ' ' + g.def.bn).toLowerCase() })),
    ];
    const draw = () => {
      const v = input.value.trim().toLowerCase();
      const hits = (v ? items.filter((it) => it.s.includes(v)) : items.slice(0, 8)).slice(0, 10);
      res.innerHTML = hits.map((h) => `<li><a href="${h.href}"><b>${h.title}</b><span class="muted small">${h.sub}</span></a></li>`).join('') || `<li class="muted small">${ui('No match. Try a Go keyword like slice or channel.', 'মিল পাওয়া যায়নি। slice বা channel এর মতো Go শব্দ দিয়ে চেষ্টা করুন।')}</li>`;
      res.querySelectorAll('a').forEach((a) => { a.onclick = () => dlg.close(); });
    };
    input.oninput = draw;
    dlg.querySelector('form').onsubmit = (e) => { e.preventDefault(); const a = res.querySelector('a'); if (a) { location.hash = a.getAttribute('href'); dlg.close(); } };
    dlg.onclick = (e) => { if (e.target === dlg) dlg.close(); };
    draw();
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    input.focus();
  }

  /* ---------- router ---------- */
  let lastRoute = null;
  function route(force) {
    const h = (location.hash || '').replace(/^#/, '');
    const key = h || 'home';
    if (!force && key === lastRoute) return;
    const sameView = key === lastRoute;
    lastRoute = key;
    cleanup();
    renderTopbar();
    if (GV.byId[key]) renderLesson(GV.byId[key]);
    else if (key === 'glossary') renderGlossary();
    else renderHome();
    GV.$$('.tb-nav a').forEach((a) => a.setAttribute('aria-current', a.getAttribute('href') === '#' + key || (key === 'home' && a.getAttribute('href') === '#home') ? 'page' : 'false'));
    if (!sameView) window.scrollTo(0, 0);
  }
  GV.route = route;

  GV.start = function () {
    if (GV.st.theme) document.documentElement.dataset.theme = GV.st.theme;
    document.documentElement.lang = GV.st.lang === 'en' ? 'en' : 'bn';
    window.addEventListener('hashchange', () => route(false));
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); openSearch(); }
      else if (e.key === '/' && !e.target.matches('input, textarea, select')) { e.preventDefault(); openSearch(); }
    });
    route(true);
  };
})();
