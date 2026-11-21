(function () {
  const { L, step, out } = GV;
  const STAGES = [
    { label: 'client', sub: L('curl / browser', 'curl / browser') },
    { label: 'logging', sub: L('middleware', 'middleware') },
    { label: 'auth', sub: L('middleware', 'middleware') },
    { label: 'mux', sub: L('router', 'router') },
    { label: 'getBook', sub: L('handler', 'handler') },
  ];
  const flow = (cur, state, back) => ({
    type: 'flow', wide: true, title: L('Request path through the server', 'সার্ভারের ভেতর দিয়ে request-এর পথ'),
    items: STAGES.map((st, k) => Object.assign({}, st, { cls: k === cur ? (state || 'cur') : back && k < cur ? 'live' : k < cur ? 'ok' : 'dim' })),
  });
  const reqBox = (method, path, auth) => ({ type: 'boxes', title: L('Incoming request', 'আসা request'), items: [{ name: 'r', type: '*http.Request', fields: [{ k: 'Method', v: method }, { k: 'URL.Path', v: path }, { k: 'Authorization', v: auth ? '"Bearer t0ken"' : '""', cls: auth ? '' : 'bad' }] }] });
  const resp = (lines) => Object.assign(out(lines, lines.length), { title: L('HTTP response', 'HTTP response') });
  const logp = (lines) => Object.assign(out(lines, lines.length ? 1 : 0), { title: L('Server log', 'সার্ভার লগ') });

  GV.register({
    id: 'go-http-middleware', track: 'go', phase: 'backend', order: 1, minutes: 25,
    title: L('HTTP handlers and middleware', 'HTTP handler আর middleware'),
    summary: L('Follow one request through logging and auth middleware, Go 1.22 method-and-path routing, and a JSON handler, then back out again.', 'একটা request অনুসরণ করুন logging আর auth middleware, Go 1.22-এর method-ও-path routing, আর একটা JSON handler দিয়ে, তারপর আবার বাইরে।'),
    idea: L([
      'In Go, anything with a <code>ServeHTTP(w http.ResponseWriter, r *http.Request)</code> method is an <code>http.Handler</code>. The request comes in as <code>r</code>; you write the response to <code>w</code>. That single interface is the whole web stack: routers, middleware and your handlers all speak it.',
      '<b>Middleware</b> is a function that takes a handler and returns a new handler wrapped around it, like layers of an onion or security checkpoints at an airport. A request passes inward through each layer (logging, then auth), reaches the handler, and the response passes back out through the same layers in reverse. Any layer may stop the request early, as auth does when a token is missing.',
      'Since Go 1.22 the standard <code>http.ServeMux</code> understands methods and path parameters: <code>"GET /books/{id}"</code>, read with <code>r.PathValue("id")</code>. For many services you no longer need a third-party router.',
    ], [
      'Go-তে যার <code>ServeHTTP(w http.ResponseWriter, r *http.Request)</code> method আছে সেটাই একটা <code>http.Handler</code>। Request আসে <code>r</code> হিসেবে; response লেখেন <code>w</code>-তে। এই একটা interface-ই পুরো web stack: router, middleware আর আপনার handler সবাই এই ভাষায় কথা বলে।',
      '<b>Middleware</b> হলো এমন একটা function যেটা একটা handler নিয়ে তার চারপাশে মোড়ানো নতুন handler ফেরত দেয়, পেঁয়াজের স্তর বা বিমানবন্দরের নিরাপত্তা চেকপয়েন্টের মতো। Request প্রতিটা স্তর পেরিয়ে ভেতরে যায় (logging, তারপর auth), handler-এ পৌঁছায়, আর response একই স্তরগুলো উল্টো ক্রমে পেরিয়ে বাইরে আসে। যেকোনো স্তর আগেভাগেই request থামাতে পারে, যেমন token না থাকলে auth থামায়।',
      'Go 1.22 থেকে standard <code>http.ServeMux</code> method আর path parameter বোঝে: <code>"GET /books/{id}"</code>, পড়া হয় <code>r.PathValue("id")</code> দিয়ে। অনেক সার্ভিসে এখন আর third-party router লাগে না।',
    ]),
    visual: {
      file: 'main.go',
      legend: [{ cls: 'cur', label: L('running now', 'এখন চলছে') }, { cls: 'ok', label: L('passed through', 'পার হয়েছে') }, { cls: 'bad', label: L('stopped the request', 'request থামিয়েছে') }],
      examples: [
        {
          label: L('One request, start to finish', 'একটা request, শুরু থেকে শেষ'),
          inputs: [
            { key: 'method', label: L('Method', 'Method'), type: 'select', def: 'GET', options: [{ v: 'GET', label: 'GET' }, { v: 'POST', label: 'POST' }] },
            { key: 'path', label: L('Path', 'Path'), type: 'text', def: '/books/42', maxLen: 30 },
            { key: 'auth', label: L('Send Authorization header', 'Authorization header পাঠাও'), type: 'bool', def: true },
          ],
          code: `
package main

import (
	"fmt"
	"log"
	"net/http"
	"time"
)

func logging(next http.Handler) http.Handler { @@logfn
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now() @@logstart
		next.ServeHTTP(w, r) // {call the inner layer|ভেতরের স্তর call করো} @@lognext
		log.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(start)) @@logafter
	})
}

func auth(next http.Handler) http.Handler { @@authfn
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") == "" { @@authchk
			http.Error(w, "unauthorized", http.StatusUnauthorized) @@auth401
			return // {stop: inner layers never run|থামো: ভেতরের স্তর আর চলবে না} @@authret
		}
		next.ServeHTTP(w, r) @@authnext
	})
}

func getBook(w http.ResponseWriter, r *http.Request) { @@handler
	id := r.PathValue("id") // {captured by the id wildcard|id wildcard যা ধরেছে} @@pathval
	w.Header().Set("Content-Type", "application/json") @@ctype
	fmt.Fprintf(w, \`{"id":%q,"title":"Go in Action"}\`, id) @@write
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /books/{id}", getBook) // {Go 1.22+ pattern|Go 1.22+ pattern} @@route
	handler := logging(auth(mux)) // {outermost layer first|সবচেয়ে বাইরের স্তর আগে} @@wrap
	log.Fatal(http.ListenAndServe(":8080", handler)) @@listen
}`,
          build({ method, path, auth }) {
            if (!path.startsWith('/')) throw new GV.InputError(L('A path starts with /, for example /books/7.', 'Path / দিয়ে শুরু হয়, যেমন /books/7।'));
            const m = path.match(/^\/books\/([^/]+)$/);
            const s = [];
            const R = reqBox(method, path, auth);
            s.push(step('wrap', L('At startup the layers are nested: <code>logging(auth(mux))</code>. The server only knows the outermost handler.', 'শুরুতেই স্তরগুলো একটার ভেতরে আরেকটা বসানো হয়: <code>logging(auth(mux))</code>। সার্ভার শুধু সবচেয়ে বাইরের handler চেনে।'), [flow(-1), R]));
            s.push(step('listen', L(`A client sends <code>${method} ${GV.esc(path)}</code>. net/http starts a new goroutine for this request and calls <code>handler.ServeHTTP</code>.`, `একজন client পাঠায় <code>${method} ${GV.esc(path)}</code>। net/http এই request-এর জন্য নতুন একটা goroutine শুরু করে <code>handler.ServeHTTP</code> call করে।`), [flow(0), R]));
            s.push(step('logstart', L('logging records the start time.', 'logging শুরুর সময় লিখে রাখে।'), [flow(1), R]));
            s.push(step('lognext', L('…and passes the request inward to auth.', '…তারপর request ভেতরে auth-এর কাছে পাঠায়।'), [flow(1), R]));
            s.push(step('authchk', L('auth checks the Authorization header.', 'auth, Authorization header দেখে।'), [flow(2), R], {
              ask: { q: L(auth ? 'The header is present. What does auth do?' : 'The header is empty. Will getBook run?', auth ? 'Header আছে। auth কী করবে?' : 'Header খালি। getBook কি চলবে?'), options: auth ? [L('Call next.ServeHTTP: pass the request inward', 'next.ServeHTTP call: request ভেতরে পাঠাবে'), L('Write the response itself', 'নিজেই response লিখবে')] : [L('No. auth writes 401 and returns', 'না। auth 401 লিখে return করবে'), L('Yes, after a warning', 'হ্যাঁ, একটা সতর্কতার পর')], answer: 0, why: L('Middleware decides whether to call next. Not calling it stops the chain.', 'Middleware ঠিক করে next call করবে কিনা। Call না করলে chain থেমে যায়।') },
            }));
            if (!auth) {
              const r401 = ['HTTP/1.1 401 Unauthorized', 'Content-Type: text/plain; charset=utf-8', 'X-Content-Type-Options: nosniff', '', 'unauthorized'];
              s.push(step('auth401', L('No token: <code>http.Error</code> writes status 401 and a short body.', 'Token নেই: <code>http.Error</code> 401 status আর ছোট একটা body লেখে।'), [flow(2, 'bad'), R, resp(r401)], { tone: 'bad' }));
              s.push(step('authret', L('<code>return</code> is essential. Without it, the code would go on to call next and the handler would run anyway.', '<code>return</code> অপরিহার্য। এটা না থাকলে কোড next call করত, আর handler তবুও চলত।'), [flow(2, 'bad'), R, resp(r401)]));
              s.push(step('logafter', L('Control returns out through logging, which logs the request. Even rejected requests get logged because logging is the outer layer.', 'Control logging দিয়ে বাইরে ফেরে, যেটা request লগ করে। Logging বাইরের স্তর বলে বাতিল request-ও লগ হয়।'), [flow(1, 'cur', true), R, resp(r401), logp([`${method} ${path} 31.2µs`])], { tone: 'ok' }));
              return s;
            }
            s.push(step('authnext', L('Token present, so auth calls the next layer: the router.', 'Token আছে, তাই auth পরের স্তর call করে: router।'), [flow(2), R]));
            if (!m) {
              const r404 = ['HTTP/1.1 404 Not Found', 'Content-Type: text/plain; charset=utf-8', '', '404 page not found'];
              s.push(step('route', L(`No pattern matches <code>${GV.esc(path)}</code>, so ServeMux answers 404 itself.`, `<code>${GV.esc(path)}</code>-এর সাথে কোনো pattern মেলে না, তাই ServeMux নিজেই 404 দেয়।`), [flow(3, 'bad'), R, resp(r404)], { tone: 'bad' }));
              s.push(step('logafter', L('Back out through auth and logging.', 'auth আর logging দিয়ে বাইরে ফেরা।'), [flow(1, 'cur', true), R, resp(r404), logp([`${method} ${path} 18.9µs`])]));
              return s;
            }
            if (method !== 'GET') {
              const r405 = ['HTTP/1.1 405 Method Not Allowed', 'Allow: GET, HEAD', 'Content-Type: text/plain; charset=utf-8', '', 'Method Not Allowed'];
              s.push(step('route', L('The path matches <code>/books/{id}</code> but only for GET. Since Go 1.22, ServeMux replies 405 with an Allow header.', 'Path <code>/books/{id}</code>-এর সাথে মেলে, কিন্তু শুধু GET-এর জন্য। Go 1.22 থেকে ServeMux Allow header-সহ 405 দেয়।'), [flow(3, 'bad'), R, resp(r405)], { tone: 'bad' }));
              s.push(step('logafter', L('Back out through auth and logging.', 'auth আর logging দিয়ে বাইরে ফেরা।'), [flow(1, 'cur', true), R, resp(r405), logp([`${method} ${path} 20.4µs`])]));
              return s;
            }
            const id = decodeURIComponent(m[1]);
            s.push(step('route', L(`ServeMux matches <code>GET /books/{id}</code> and captures id = "${GV.esc(id)}".`, `ServeMux <code>GET /books/{id}</code> মেলায় আর id = "${GV.esc(id)}" ধরে।`), [flow(3), R]));
            s.push(step('pathval', L('<code>r.PathValue("id")</code> reads the captured segment, always as a string.', '<code>r.PathValue("id")</code> ধরা অংশটা পড়ে, সবসময় string হিসেবে।'), [flow(4), R, { type: 'boxes', items: [{ name: 'id', type: 'string', val: JSON.stringify(id), cls: 'hl new' }] }]));
            s.push(step('ctype', L('Set headers <b>before</b> writing the body. Once the body starts, headers are sent and cannot change.', 'Body লেখার <b>আগে</b> header সেট করুন। Body শুরু হলেই header পাঠানো হয়ে যায়, আর বদলানো যায় না।'), [flow(4), R]));
            const body = `{"id":${JSON.stringify(id)},"title":"Go in Action"}`;
            const r200 = ['HTTP/1.1 200 OK', 'Content-Type: application/json', '', body];
            s.push(step('write', L('Writing the body sends status 200 automatically, because no other status was set.', 'Body লিখলে নিজে থেকেই 200 status যায়, কারণ অন্য কোনো status সেট করা হয়নি।'), [flow(4, 'ok'), R, resp(r200)]));
            s.push(step('authnext', L('getBook returns; control unwinds back out through auth…', 'getBook ফিরে আসে; control auth দিয়ে বাইরে ফিরতে থাকে…'), [flow(2, 'cur', true), R, resp(r200)]));
            s.push(step('logafter', L('…and logging, which now knows the total time and writes the log line.', '…আর logging, যেটা এখন মোট সময় জানে আর লগ লাইন লেখে।'), [flow(1, 'cur', true), R, resp(r200), logp([`GET ${path} 48.7µs`])], { tone: 'ok' }));
            return s;
          },
        },
      ],
    },
    walk: [
      { at: 'logfn', code: 'func logging(next http.Handler) http.Handler', text: L('The middleware shape: take a handler, return a handler.', 'Middleware-এর আকার: একটা handler নাও, একটা handler ফেরত দাও।') },
      { at: 'lognext', code: 'next.ServeHTTP(w, r)', text: L('Code before this runs on the way in; code after runs on the way out.', 'এর আগের কোড ভেতরে যাওয়ার পথে চলে; পরের কোড বাইরে আসার পথে।') },
      { at: 'authret', code: 'return', text: L('Stops the chain after writing an error response.', 'Error response লেখার পর chain থামায়।') },
      { at: 'route', code: 'mux.HandleFunc("GET /books/{id}", getBook)', text: L('Method plus path pattern, built into the standard library since Go 1.22.', 'Method আর path pattern, Go 1.22 থেকে standard library-তেই।') },
      { at: 'wrap', code: 'logging(auth(mux))', text: L('Read inside out: mux is wrapped by auth, which is wrapped by logging.', 'ভেতর থেকে বাইরে পড়ুন: mux-কে auth মোড়ে, আর auth-কে logging মোড়ে।') },
    ],
    mistakes: [
      { title: L('Forgetting return after http.Error', 'http.Error-এর পর return ভুলে যাওয়া'), err: 'http: superfluous response.WriteHeader call from main.getBook (main.go:31)', fix: L('Without return, the inner handler also runs and tries to write a second status. Always return after writing an error.', 'return না থাকলে ভেতরের handler-ও চলে আর দ্বিতীয়বার status লিখতে চায়। Error লেখার পর সবসময় return করুন।') },
      { title: L('Setting headers after writing the body', 'Body লেখার পর header সেট করা'), err: '', fix: L('The first Write sends the headers. Later <code>w.Header().Set</code> calls are silently ignored. Set headers first, then call WriteHeader (if not 200), then Write.', 'প্রথম Write header পাঠিয়ে দেয়। পরের <code>w.Header().Set</code> চুপচাপ উপেক্ষিত হয়। আগে header, তারপর (200 না হলে) WriteHeader, তারপর Write।') },
      { title: L('No server timeouts', 'সার্ভারে timeout নেই'), err: '', fix: L('<code>http.ListenAndServe</code> has no timeouts, so slow clients can hold connections forever. In production create an <code>http.Server</code> with ReadHeaderTimeout, ReadTimeout and WriteTimeout.', '<code>http.ListenAndServe</code>-এ কোনো timeout নেই, তাই ধীর client চিরকাল সংযোগ ধরে রাখতে পারে। Production-এ ReadHeaderTimeout, ReadTimeout আর WriteTimeout-সহ একটা <code>http.Server</code> বানান।') },
      { title: L('Middleware in the wrong order', 'ভুল ক্রমে middleware'), err: '', fix: L('<code>auth(logging(mux))</code> would not log rejected requests. Put logging and panic recovery outermost.', '<code>auth(logging(mux))</code> বাতিল request লগ করত না। Logging আর panic recovery সবচেয়ে বাইরে রাখুন।') },
    ],
    perf: L([
      'net/http serves each request in its own goroutine, so handlers run concurrently. Any shared state they touch (a map cache, a counter) needs a mutex.',
      'Pass <code>r.Context()</code> into database and outgoing HTTP calls. When the client disconnects, the context is cancelled and that work stops instead of wasting resources.',
    ], [
      'net/http প্রতিটা request নিজস্ব goroutine-এ চালায়, তাই handler-গুলো একসাথে চলে। এরা যে shared state ছোঁয় (map cache, counter) তার জন্য mutex লাগবে।',
      'Database আর বাইরের HTTP call-এ <code>r.Context()</code> পাঠান। Client সংযোগ বিচ্ছিন্ন করলে context বাতিল হয়, আর সেই কাজ resource নষ্ট না করে থেমে যায়।',
    ]),
    quiz: [
      { q: L('In <code>logging(auth(mux))</code>, which runs first for an incoming request?', '<code>logging(auth(mux))</code>-এ আসা request-এর জন্য কোনটা আগে চলে?'), options: ['logging', 'auth', 'mux'], answer: 0, why: L('The outermost wrapper sees the request first and the response last.', 'সবচেয়ে বাইরের মোড়ক request আগে আর response শেষে দেখে।') },
      { q: L('How does middleware stop a request?', 'Middleware কীভাবে request থামায়?'), options: [L('It writes a response and returns without calling next', 'Response লিখে next call না করে return করে'), L('It panics', 'Panic করে'), L('It closes the connection', 'সংযোগ বন্ধ করে')], answer: 0, why: L('Not calling next.ServeHTTP is all it takes.', 'next.ServeHTTP call না করাই যথেষ্ট।') },
      { q: L('Pattern <code>"GET /books/{id}"</code>, request <code>POST /books/7</code>. Response?', 'Pattern <code>"GET /books/{id}"</code>, request <code>POST /books/7</code>। Response?'), options: ['405 Method Not Allowed', '404 Not Found', '200 OK'], answer: 0, why: L('The path matches but the method does not.', 'Path মেলে কিন্তু method মেলে না।') },
    ],
    exercises: [
      { title: L('A request ID middleware', 'Request ID middleware'),
        task: L('Write <code>requestID(next http.Handler) http.Handler</code> that sets an <code>X-Request-ID</code> response header (use a counter from <code>sync/atomic</code>) before calling next. Add it as the outermost layer and check with <code>curl -i</code>.', '<code>requestID(next http.Handler) http.Handler</code> লিখুন, যেটা next call করার আগে একটা <code>X-Request-ID</code> response header সেট করে (<code>sync/atomic</code>-এর counter ব্যবহার করুন)। সবচেয়ে বাইরের স্তর হিসেবে যোগ করে <code>curl -i</code> দিয়ে দেখুন।'),
        hints: [L('Same shape as logging: return <code>http.HandlerFunc(func(w, r) { … })</code>.', 'logging-এর মতোই আকার: <code>http.HandlerFunc(func(w, r) { … })</code> return করুন।'), L('Headers must be set before the inner handler writes the body.', 'ভেতরের handler body লেখার আগেই header সেট করতে হবে।')],
        solution: `package main

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"sync/atomic"
)

var nextID atomic.Int64

func requestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := nextID.Add(1)
		w.Header().Set("X-Request-ID", strconv.FormatInt(id, 10)) // {before next writes|next লেখার আগে}
		next.ServeHTTP(w, r)
	})
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /ping", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "pong")
	})
	log.Fatal(http.ListenAndServe(":8080", requestID(mux)))
}` },
      { title: L('POST a book as JSON', 'JSON হিসেবে বই POST'),
        task: L('Add <code>POST /books</code> that decodes <code>{"title": "..."}</code> into a struct with <code>json.NewDecoder(r.Body).Decode</code>. Reply 400 on bad JSON or an empty title, otherwise 201 with the book as JSON.', '<code>POST /books</code> যোগ করুন, যেটা <code>json.NewDecoder(r.Body).Decode</code> দিয়ে <code>{"title": "..."}</code> একটা struct-এ decode করে। ভুল JSON বা খালি title হলে 400, নইলে বইটা JSON হিসেবে দিয়ে 201।'),
        hints: [L('Struct fields need tags: <code>Title string `json:"title"`</code>.', 'Struct field-এ tag লাগবে: <code>Title string `json:"title"`</code>।'), L('Order: set Content-Type, then <code>w.WriteHeader(http.StatusCreated)</code>, then encode.', 'ক্রম: Content-Type সেট, তারপর <code>w.WriteHeader(http.StatusCreated)</code>, তারপর encode।')],
        solution: `package main

import (
	"encoding/json"
	"log"
	"net/http"
)

type Book struct {
	ID    int    \`json:"id"\`
	Title string \`json:"title"\`
}

func createBook(w http.ResponseWriter, r *http.Request) {
	var b Book
	if err := json.NewDecoder(r.Body).Decode(&b); err != nil || b.Title == "" {
		http.Error(w, "bad request: need a JSON body with a title", http.StatusBadRequest)
		return
	}
	b.ID = 1 // {a real service would insert into PostgreSQL here|আসল সার্ভিস এখানে PostgreSQL-এ insert করত}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(b)
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("POST /books", createBook)
	log.Fatal(http.ListenAndServe(":8080", mux))
}` },
    ],
    takeaways: [
      L('Everything in net/http is an http.Handler: one method, ServeHTTP(w, r).', 'net/http-এর সবকিছুই একটা http.Handler: একটা method, ServeHTTP(w, r)।'),
      L('Middleware wraps a handler; code before next runs inbound, code after runs outbound.', 'Middleware একটা handler মোড়ে; next-এর আগের কোড ভেতরে যাওয়ার পথে, পরের কোড বাইরে আসার পথে চলে।'),
      L('Stop a request by writing a response and returning without calling next.', 'Response লিখে next call না করে return করলেই request থামে।'),
      L('Go 1.22 ServeMux routes by method and path; set headers before the body; add timeouts in production.', 'Go 1.22-এর ServeMux method আর path দিয়ে route করে; body-র আগে header; production-এ timeout দিন।'),
    ],
    links: [
      { t: 'Go blog: Routing Enhancements for Go 1.22', url: 'https://go.dev/blog/routing-enhancements' },
      { t: 'Package net/http', url: 'https://pkg.go.dev/net/http' },
      { t: 'Writing Web Applications (net/http)', url: 'https://go.dev/doc/articles/wiki/' },
    ],
  });
})();
