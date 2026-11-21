(function () {
  const { L, step, out } = GV;
  const lanes = (items) => ({ type: 'lanes', wide: true, title: L('Goroutines', 'Goroutine'), items });

  GV.register({
    id: 'go-select-context', track: 'go', phase: 'conc', order: 4, minutes: 22,
    title: L('select, timeouts and context', 'select, timeout আর context'),
    summary: L('select waits on several channels at once. Add a timeout, spot the goroutine leak it can cause, then cancel a group of workers with context.', 'select একসাথে কয়েকটা channel-এ অপেক্ষা করে। Timeout যোগ করুন, এর কারণে হওয়া goroutine leak চিনুন, তারপর context দিয়ে একদল worker বাতিল করুন।'),
    idea: L([
      '<code>select</code> is a switch for channels. It waits until <b>one</b> of its cases can proceed, then runs that one. Picture waiting at a bus stop served by two routes: you take whichever bus arrives first. Adding <code>case &lt;-time.After(d)</code> is like deciding "if nothing comes in 10 minutes, I walk." That is a <b>timeout</b>.',
      'In a server, every request should have a deadline. If a client disconnects or a downstream call takes too long, all the goroutines working on that request should stop. <code>context.Context</code> carries that stop signal: <code>ctx.Done()</code> is a channel that is closed when the context is cancelled or its deadline passes. Workers watch it with select.',
      'Contexts form a tree. Cancelling a parent cancels all its children, so one cancel at the top of a request stops everything below it.',
    ], [
      '<code>select</code> হলো channel-এর জন্য একটা switch। এটা অপেক্ষা করে যতক্ষণ না তার case-গুলোর <b>একটা</b> এগোতে পারে, তারপর সেটাই চালায়। দুই রুটের বাস থামে এমন স্টপে অপেক্ষার কথা ভাবুন: যে বাস আগে আসে সেটাতেই উঠবেন। <code>case &lt;-time.After(d)</code> যোগ করা মানে ঠিক করা "১০ মিনিটে কিছু না এলে হেঁটে যাব।" এটাই <b>timeout</b>।',
      'সার্ভারে প্রতিটা request-এর একটা deadline থাকা উচিত। Client সংযোগ বিচ্ছিন্ন করলে বা পরের call খুব দেরি করলে, সেই request-এ কাজ করা সব goroutine-এর থামা উচিত। <code>context.Context</code> সেই থামার সংকেত বহন করে: <code>ctx.Done()</code> একটা channel, যেটা context বাতিল হলে বা deadline পেরোলে বন্ধ হয়। Worker-রা select দিয়ে এটা খেয়াল রাখে।',
      'Context একটা গাছ তৈরি করে। Parent বাতিল করলে তার সব child বাতিল হয়, তাই request-এর উপরে একটা cancel নিচের সবকিছু থামিয়ে দেয়।',
    ]),
    visual: {
      file: 'main.go',
      examples: [
        {
          label: L('select with a timeout', 'Timeout-সহ select'),
          inputs: [
            { key: 'work', label: L('Work takes (ms)', 'কাজে লাগে (ms)'), type: 'int', def: 2000, min: 100, max: 5000 },
            { key: 'limit', label: L('Timeout (ms)', 'Timeout (ms)'), type: 'int', def: 1000, min: 100, max: 5000 },
          ],
          code: (inp) => `
package main

import (
	"fmt"
	"time"
)

func main() {
	result := make(chan string) // {unbuffered: see the leak below|unbuffered: নিচের leak দেখুন} @@mk
	go func() { @@go
		time.Sleep(${inp.work} * time.Millisecond) // {slow work|ধীর কাজ} @@work
		result <- "done" @@send
	}()
	select { // {wait for whichever is ready first|যেটা আগে প্রস্তুত তার জন্য অপেক্ষা} @@sel
	case r := <-result: @@cr
		fmt.Println(r) @@pr
	case <-time.After(${inp.limit} * time.Millisecond): @@ct
		fmt.Println("timeout") @@pt
	}
}`,
          build({ work, limit }) {
            const max = Math.max(work, limit) * 1.15;
            const tl = (now) => ({ type: 'timeline', wide: true, title: L('Clock', 'ঘড়ি'), now, max, marks: [{ t: work, label: L('work done', 'কাজ শেষ'), cls: work <= limit ? 'ok' : '' }, { t: limit, label: L('timeout', 'timeout'), cls: work > limit ? 'bad' : '' }] });
            const s = [];
            s.push(step('mk', L('An unbuffered result channel.', 'একটা unbuffered result channel।'), [tl(0), lanes([{ name: 'main', state: 'run', text: '' }])]));
            s.push(step('go', L(`Start the worker. It will need ${work} ms.`, `Worker শুরু। এর লাগবে ${work} ms।`), [tl(0), lanes([{ name: 'main', state: 'run', text: '' }, { name: 'worker', state: 'sleep', text: L(`sleeping ${work} ms`, `${work} ms ঘুমাচ্ছে`) }])]));
            s.push(step('sel', L(`select waits on two channels: the result, and a timer that fires after ${limit} ms.`, `select দুটো channel-এ অপেক্ষা করে: result, আর ${limit} ms পরে বাজবে এমন একটা timer।`), [tl(0), lanes([{ name: 'main', state: 'block', text: L('select: result or timer', 'select: result নাকি timer') }, { name: 'worker', state: 'sleep', text: L('working…', 'কাজ করছে…') }])], {
              ask: { q: L(`Work takes ${work} ms and the timeout is ${limit} ms. What prints?`, `কাজে ${work} ms লাগে, timeout ${limit} ms। কী print হবে?`), options: work <= limit ? ['done', 'timeout'] : ['timeout', 'done'], answer: 0, why: L('select runs the case whose channel becomes ready first.', 'যে case-এর channel আগে প্রস্তুত হয় select সেটাই চালায়।') },
            }));
            if (work <= limit) {
              s.push(step('send', L(`At ${work} ms the worker sends "done". main is waiting in select, so the hand-off happens.`, `${work} ms-এ worker "done" পাঠায়। main select-এ অপেক্ষায়, তাই হাতবদল হয়।`), [tl(work), lanes([{ name: 'main', state: 'block', text: L('select', 'select') }, { name: 'worker', state: 'run', text: L('result &lt;- "done"', 'result &lt;- "done"') }])]));
              s.push(step('cr', L('The result case is ready first, so it wins.', 'Result case আগে প্রস্তুত, তাই সেটাই জেতে।'), [tl(work), lanes([{ name: 'main', state: 'run', text: L('r = "done"', 'r = "done"') }, { name: 'worker', state: 'done', text: '' }])]));
              s.push(step('pr', L('Prints done. Try a work time larger than the timeout to see the other path.', 'done print হয়। অন্য পথ দেখতে timeout-এর চেয়ে বেশি কাজের সময় দিয়ে চালান।'), [tl(work), lanes([{ name: 'main', state: 'done', text: '' }, { name: 'worker', state: 'done', text: '' }]), out(['done'], 1)], { tone: 'ok' }));
            } else {
              s.push(step('ct', L(`At ${limit} ms the timer fires first. select takes the timeout case.`, `${limit} ms-এ timer আগে বাজে। select timeout case নেয়।`), [tl(limit), lanes([{ name: 'main', state: 'run', text: L('timeout case', 'timeout case') }, { name: 'worker', state: 'sleep', text: L('still working…', 'এখনো কাজ করছে…') }])]));
              s.push(step('pt', L('main prints timeout and moves on.', 'main timeout print করে এগিয়ে যায়।'), [tl(limit), lanes([{ name: 'main', state: 'run', text: L('moved on', 'এগিয়ে গেছে') }, { name: 'worker', state: 'sleep', text: L('still working…', 'এখনো কাজ করছে…') }]), out(['timeout'], 1)]));
              s.push(step('send', L(`At ${work} ms the worker tries to send. Nobody will ever receive from an unbuffered channel now, so it <b>blocks forever</b>: a goroutine leak. In a server this leaks memory on every timed-out request. Fix: <code>make(chan string, 1)</code> so the send always succeeds.`, `${work} ms-এ worker পাঠাতে চায়। এখন unbuffered channel থেকে কেউ কখনো নেবে না, তাই এটা <b>চিরকাল আটকে</b> থাকে: একটা goroutine leak। সার্ভারে প্রতিটা timeout হওয়া request-এ এটা মেমরি লিক করে। সমাধান: <code>make(chan string, 1)</code>, যাতে send সবসময় সফল হয়।`), [tl(work), lanes([{ name: 'main', state: 'run', text: '' }, { name: 'worker', state: 'panic', text: L('blocked forever on result &lt;-', 'result &lt;- এ চিরকাল আটকে') }]), out(['timeout'])], { tone: 'bad' }));
            }
            return s;
          },
        },
        {
          label: L('Cancel workers with context', 'Context দিয়ে worker বাতিল'),
          code: `
package main

import (
	"context"
	"fmt"
	"sync"
	"time"
)

func worker(ctx context.Context, id int, wg *sync.WaitGroup) {
	defer wg.Done()
	for {
		select {
		case <-ctx.Done(): // {closed on cancel or deadline|cancel বা deadline-এ বন্ধ হয়} @@done
			fmt.Println("worker", id, "stopped:", ctx.Err()) @@stop
			return
		default:
			time.Sleep(100 * time.Millisecond) // {one small piece of work|ছোট এক টুকরো কাজ} @@work
		}
	}
}

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 300*time.Millisecond) @@ctx
	defer cancel() // {always release the context|সবসময় context ছেড়ে দাও} @@defer
	var wg sync.WaitGroup
	for id := 1; id <= 2; id++ {
		wg.Add(1)
		go worker(ctx, id, &wg) @@start
	}
	wg.Wait() @@wait
	fmt.Println("all workers stopped") @@end
}`,
          build() {
            const tree = (st) => ({ type: 'boxes', title: L('Context tree', 'Context গাছ'), layout: 'chain', items: [{ id: 'bg', name: 'Background()', type: 'root', val: L('never cancelled', 'কখনো বাতিল হয় না') }, { id: 'tc', name: 'WithTimeout', type: '300ms', val: st === 'done' ? L('Done: deadline exceeded', 'Done: deadline exceeded') : L('active', 'সক্রিয়'), cls: st === 'done' ? 'bad' : 'live' }] });
            const tl = (now) => ({ type: 'timeline', title: L('Clock', 'ঘড়ি'), now, max: 360, marks: [{ t: 300, label: L('deadline', 'deadline'), cls: 'bad' }] });
            const W = (id, state, text) => ({ name: `worker ${id}`, state, text });
            const ar = [{ from: 'bg', to: 'tc', label: L('child', 'child') }];
            return [
              step('ctx', L('<code>WithTimeout</code> creates a child of Background that cancels itself after 300 ms.', '<code>WithTimeout</code> Background-এর একটা child বানায়, যেটা 300 ms পরে নিজেকে বাতিল করে।'), [tree('active'), tl(0)], { arrows: ar }),
              step('defer', L('<code>defer cancel()</code> frees the timer even if we finish early. go vet warns if you forget it.', '<code>defer cancel()</code> আগে শেষ হলেও timer মুক্ত করে। ভুলে গেলে go vet সতর্ক করে।'), [tree('active'), tl(0)], { arrows: ar }),
              step('start', L('Start two workers. Both receive the same ctx.', 'দুটো worker শুরু। দুটোই একই ctx পায়।'), [tree('active'), tl(0), lanes([W(1, 'run', L('checking ctx.Done()', 'ctx.Done() দেখছে')), W(2, 'run', L('checking ctx.Done()', 'ctx.Done() দেখছে'))])], { arrows: ar }),
              step('work', L('ctx.Done() is not closed, so select takes <code>default</code> and does a 100 ms piece of work.', 'ctx.Done() বন্ধ না, তাই select <code>default</code> নিয়ে 100 ms-এর এক টুকরো কাজ করে।'), [tree('active'), tl(100), lanes([W(1, 'sleep', L('working (t=0–100)', 'কাজ (t=0–100)')), W(2, 'sleep', L('working (t=0–100)', 'কাজ (t=0–100)'))])], { arrows: ar }),
              step('work', L('Loop again: still not cancelled, another piece of work.', 'আবার লুপ: এখনো বাতিল না, আরেক টুকরো কাজ।'), [tree('active'), tl(200), lanes([W(1, 'sleep', L('working (t=100–200)', 'কাজ (t=100–200)')), W(2, 'sleep', L('working (t=100–200)', 'কাজ (t=100–200)'))])], { arrows: ar }),
              step('wait', L('main waits for both workers with wg.Wait().', 'main wg.Wait() দিয়ে দুটো worker-এর জন্য অপেক্ষা করে।'), [tree('active'), tl(250), lanes([{ name: 'main', state: 'block', text: L('wg.Wait()', 'wg.Wait()') }, W(1, 'sleep', L('working (t=200–300)', 'কাজ (t=200–300)')), W(2, 'sleep', L('working (t=200–300)', 'কাজ (t=200–300)'))])], {
                arrows: ar,
                ask: { q: L('At t = 300 ms the deadline passes. What happens to ctx.Done()?', 't = 300 ms-এ deadline পেরিয়ে যায়। ctx.Done()-এর কী হয়?'), options: [L('It is closed, so every receive on it succeeds at once', 'বন্ধ হয়ে যায়, তাই এর উপর প্রতিটা receive সাথে সাথে সফল হয়'), L('It sends one value to one worker', 'একজন worker-কে একটা মান পাঠায়'), L('Nothing until cancel() is called', 'cancel() call না হওয়া পর্যন্ত কিছু না')], answer: 0, why: L('Closing a channel is a broadcast: all receivers wake up. That is why one cancel stops every worker.', 'Channel বন্ধ করা মানে সবাইকে জানানো: সব receiver জেগে ওঠে। এজন্যই একটা cancel সব worker থামায়।') },
              }),
              step('done', L('Deadline reached: the context closes its Done channel. Both workers\' selects see it on the next loop.', 'Deadline পৌঁছেছে: context তার Done channel বন্ধ করে। পরের লুপেই দুই worker-এর select এটা দেখে।'), [tree('done'), tl(300), lanes([{ name: 'main', state: 'block', text: L('wg.Wait()', 'wg.Wait()') }, W(1, 'run', L('case &lt;-ctx.Done()', 'case &lt;-ctx.Done()')), W(2, 'run', L('case &lt;-ctx.Done()', 'case &lt;-ctx.Done()'))])], { arrows: ar }),
              step('stop', L('Each worker prints why it stopped. <code>ctx.Err()</code> says <code>context deadline exceeded</code> (or <code>context canceled</code> if cancel() was called).', 'প্রতিটা worker কেন থামল print করে। <code>ctx.Err()</code> বলে <code>context deadline exceeded</code> (অথবা cancel() call হলে <code>context canceled</code>)।'), [tree('done'), tl(300), lanes([{ name: 'main', state: 'block', text: L('wg.Wait()', 'wg.Wait()') }, W(1, 'done', L('returned', 'ফিরে গেছে')), W(2, 'done', L('returned', 'ফিরে গেছে'))]), out(['worker 1 stopped: context deadline exceeded', 'worker 2 stopped: context deadline exceeded'], 2)], { arrows: ar }),
              step('end', L('Both called Done, so Wait returns. No goroutine is left running. (The two worker lines can appear in either order.)', 'দুটোই Done call করেছে, তাই Wait ফেরে। কোনো goroutine আর চলছে না। (দুই worker-এর লাইন যেকোনো ক্রমে আসতে পারে।)'), [tree('done'), tl(300), lanes([{ name: 'main', state: 'done', text: '' }]), out(['worker 1 stopped: context deadline exceeded', 'worker 2 stopped: context deadline exceeded', 'all workers stopped'], 1)], { arrows: ar, tone: 'ok' }),
            ];
          },
        },
      ],
    },
    walk: [
      { at: 'sel', ex: 0, code: 'select { case …: case …: }', text: L('Blocks until one case is ready. If several are ready, it picks one at random.', 'একটা case প্রস্তুত না হওয়া পর্যন্ত আটকে থাকে। কয়েকটা প্রস্তুত থাকলে এলোমেলোভাবে একটা বেছে নেয়।') },
      { at: 'ct', ex: 0, code: 'case <-time.After(d):', text: L('time.After returns a channel that receives once after d.', 'time.After একটা channel দেয়, যেটা d সময় পরে একবার মান পায়।') },
      { at: 'ctx', ex: 1, code: 'context.WithTimeout(parent, d)', text: L('Returns a child context and its cancel function.', 'একটা child context আর তার cancel function দেয়।') },
      { at: 'done', ex: 1, code: 'case <-ctx.Done():', text: L('The standard way for any goroutine to notice cancellation.', 'যেকোনো goroutine-এর বাতিল হওয়া টের পাওয়ার প্রচলিত উপায়।') },
    ],
    mistakes: [
      { title: L('Leaking the worker on timeout', 'Timeout-এ worker leak'), err: '', fix: L('After a timeout nobody reads the unbuffered channel, so the worker blocks forever. Give the channel a buffer of 1, or pass a context so the worker can give up too.', 'Timeout-এর পর কেউ unbuffered channel পড়ে না, তাই worker চিরকাল আটকে থাকে। Channel-কে 1-এর buffer দিন, অথবা context পাঠান যাতে worker-ও হাল ছাড়তে পারে।') },
      { title: L('Forgetting cancel()', 'cancel() ভুলে যাওয়া'), err: './main.go:22:7: the cancel function returned by context.WithTimeout should be called, not discarded, to avoid a context leak', fix: L('<code>go vet</code> reports this. Always <code>defer cancel()</code> right after creating the context.', '<code>go vet</code> এটা জানায়। Context বানানোর ঠিক পরেই সবসময় <code>defer cancel()</code>।') },
      { title: L('Storing a context in a struct', 'Struct-এ context রাখা'), err: '', fix: L('Pass ctx as the first parameter of each function that needs it: <code>func Fetch(ctx context.Context, id int)</code>. Contexts belong to a request, not to a long-lived object.', 'যে function-এর লাগে তার প্রথম parameter হিসেবে ctx পাঠান: <code>func Fetch(ctx context.Context, id int)</code>। Context একটা request-এর, দীর্ঘস্থায়ী object-এর না।') },
      { title: L('A busy default case', 'ব্যস্ত default case'), err: 'for { select { case <-ch: ...; default: } } // spins at 100% CPU', fix: L('An empty default turns select into a busy loop. Remove default to block, or do real work in it.', 'খালি default select-কে একটা ব্যস্ত লুপ বানায়। আটকে থাকতে default সরান, অথবা তাতে আসল কাজ করুন।') },
    ],
    perf: L([
      'Every HTTP request in <code>net/http</code> already carries a context: <code>r.Context()</code>. It is cancelled when the client disconnects. Pass it to database and HTTP client calls (<code>db.QueryContext(ctx, …)</code>) so abandoned requests stop using resources.',
      'Prefer one context deadline per request over many scattered <code>time.After</code> calls; it gives every layer the same budget.',
    ], [
      '<code>net/http</code>-এর প্রতিটা request-এর সাথেই একটা context থাকে: <code>r.Context()</code>। Client সংযোগ বিচ্ছিন্ন করলে এটা বাতিল হয়। Database আর HTTP client call-এ এটা পাঠান (<code>db.QueryContext(ctx, …)</code>), যাতে পরিত্যক্ত request resource ব্যবহার বন্ধ করে।',
      'ছড়ানো অনেক <code>time.After</code>-এর বদলে প্রতি request-এ একটা context deadline ভালো; এতে প্রতিটা স্তর একই সময়সীমা পায়।',
    ]),
    quiz: [
      { q: L('Several cases of a select are ready at once. Which runs?', 'Select-এর কয়েকটা case একসাথে প্রস্তুত। কোনটা চলবে?'), options: [L('One chosen at random', 'এলোমেলোভাবে বেছে নেওয়া একটা'), L('The first one written', 'প্রথমে লেখাটা'), L('All of them', 'সবগুলো')], answer: 0, why: L('Random choice prevents one channel from starving the others.', 'এলোমেলো বাছাই একটা channel-কে অন্যগুলোকে বঞ্চিত করতে দেয় না।') },
      { q: L('How does one cancel() stop many goroutines?', 'একটা cancel() কীভাবে অনেক goroutine থামায়?'), options: [L('It closes ctx.Done(); every receiver wakes up', 'ctx.Done() বন্ধ করে; প্রতিটা receiver জেগে ওঠে'), L('It kills the goroutines directly', 'সরাসরি goroutine মেরে ফেলে'), L('It sends one value per goroutine', 'প্রতি goroutine-এ একটা মান পাঠায়')], answer: 0, why: L('Go cannot kill goroutines from outside. Each one must check Done and return.', 'Go বাইরে থেকে goroutine মারতে পারে না। প্রত্যেককে Done দেখে নিজে return করতে হয়।') },
      { q: L('Where should ctx go in a function signature?', 'Function signature-এ ctx কোথায় থাকবে?'), options: [L('First parameter', 'প্রথম parameter'), L('Last parameter', 'শেষ parameter'), L('In a struct field', 'একটা struct field-এ')], answer: 0, why: L('By convention: func DoThing(ctx context.Context, …).', 'প্রথা অনুযায়ী: func DoThing(ctx context.Context, …)।') },
    ],
    exercises: [
      { title: L('Fix the leak', 'Leak ঠিক করুন'),
        task: L('Take the timeout example with work 2000 ms and timeout 1000 ms. Make one change so the worker goroutine can always finish. Then prove it: after the select, sleep 1.5 s and print <code>runtime.NumGoroutine()</code>. It should be 1.', 'কাজ 2000 ms আর timeout 1000 ms-এর timeout উদাহরণটা নিন। একটা পরিবর্তন করুন যাতে worker goroutine সবসময় শেষ হতে পারে। তারপর প্রমাণ করুন: select-এর পর 1.5 s ঘুমিয়ে <code>runtime.NumGoroutine()</code> print করুন। এটা 1 হওয়া উচিত।'),
        hints: [L('The worker blocks on send because nobody receives. What if the send did not need a receiver?', 'কেউ না নেওয়ায় worker send-এ আটকে থাকে। Send-এর জন্য যদি receiver না লাগত?'), L('A buffer of size 1.', '1 আকারের একটা buffer।')],
        solution: `package main

import (
	"fmt"
	"runtime"
	"time"
)

func main() {
	result := make(chan string, 1) // {buffer 1: the send never blocks|buffer 1: send কখনো আটকায় না}
	go func() {
		time.Sleep(2 * time.Second)
		result <- "done"
	}()
	select {
	case r := <-result:
		fmt.Println(r)
	case <-time.After(1 * time.Second):
		fmt.Println("timeout")
	}
	time.Sleep(1500 * time.Millisecond)
	fmt.Println("goroutines:", runtime.NumGoroutine()) // {1|1}
}` },
      { title: L('A ticker that stops', 'থেমে যাওয়া ticker'),
        task: L('Print "tick" every 100 ms using <code>time.NewTicker</code>, and stop cleanly after 550 ms using a context with timeout. Expect five ticks.', '<code>time.NewTicker</code> দিয়ে প্রতি 100 ms-এ "tick" print করুন, আর timeout-সহ context দিয়ে 550 ms পরে পরিষ্কারভাবে থামুন। পাঁচটা tick আশা করুন।'),
        hints: [L('Loop over a select with two cases: <code>&lt;-ticker.C</code> and <code>&lt;-ctx.Done()</code>.', 'দুই case-এর select-এর উপর লুপ: <code>&lt;-ticker.C</code> আর <code>&lt;-ctx.Done()</code>।'), L('<code>defer ticker.Stop()</code> releases the ticker.', '<code>defer ticker.Stop()</code> ticker ছেড়ে দেয়।')],
        solution: `package main

import (
	"context"
	"fmt"
	"time"
)

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 550*time.Millisecond)
	defer cancel()
	ticker := time.NewTicker(100 * time.Millisecond)
	defer ticker.Stop()
	for {
		select {
		case <-ticker.C:
			fmt.Println("tick")
		case <-ctx.Done():
			fmt.Println("stopped:", ctx.Err())
			return
		}
	}
}` },
    ],
    takeaways: [
      L('select waits on several channel operations and runs the first ready one.', 'select কয়েকটা channel অপারেশনে অপেক্ষা করে, আর প্রথম প্রস্তুতটা চালায়।'),
      L('time.After gives a simple timeout, but watch for goroutines left blocked on send.', 'time.After সহজ timeout দেয়, তবে send-এ আটকে থাকা goroutine খেয়াল রাখুন।'),
      L('context carries cancellation and deadlines down a call tree; closing Done is a broadcast.', 'context বাতিল আর deadline call গাছ বেয়ে নিচে পৌঁছায়; Done বন্ধ করা মানে সবাইকে জানানো।'),
      L('Pass ctx first, defer cancel(), and check ctx.Done() in long-running work.', 'ctx প্রথমে পাঠান, defer cancel() দিন, আর দীর্ঘ কাজে ctx.Done() দেখুন।'),
    ],
    links: [
      { t: 'Go blog: Go Concurrency Patterns: Context', url: 'https://go.dev/blog/context' },
      { t: 'Package context', url: 'https://pkg.go.dev/context' },
      { t: 'A Tour of Go: Select', url: 'https://go.dev/tour/concurrency/5' },
    ],
  });
})();
