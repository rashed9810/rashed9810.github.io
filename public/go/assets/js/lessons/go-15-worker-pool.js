(function () {
  const { L, step, out } = GV;

  GV.register({
    id: 'go-worker-pool', track: 'go', phase: 'conc', order: 3, minutes: 20,
    title: L('WaitGroup and worker pools', 'WaitGroup আর worker pool'),
    summary: L('A fixed set of workers pulls jobs from a channel while a WaitGroup counts outstanding work. The pattern behind most Go batch jobs.', 'নির্দিষ্ট কয়েকটা worker একটা channel থেকে কাজ নেয়, আর WaitGroup বাকি কাজ গোনে। Go-র বেশিরভাগ batch কাজের পেছনে এই প্যাটার্ন।'),
    idea: L([
      'Picture a restaurant kitchen. Orders go onto a rail (the <b>jobs channel</b>). A fixed number of cooks (the <b>workers</b>) each grab the next ticket, cook, and put the dish on the pass (the <b>results channel</b>). Hiring a cook per order would be chaos; a fixed crew keeps the kitchen predictable. In a backend, the "cooks" are goroutines calling a database, an API or an LLM, and the fixed number protects that service from being flooded.',
      'A <code>sync.WaitGroup</code> is the manager\'s tally: <code>Add(1)</code> when a cook starts a shift, <code>Done()</code> when they leave, and <code>Wait()</code> blocks until the tally is back to zero.',
      'Closing the jobs channel is how you tell the cooks "no more orders": each worker\'s <code>for range jobs</code> loop ends, they call Done, and Wait returns.',
    ], [
      'একটা রেস্তোরাঁর রান্নাঘর কল্পনা করুন। অর্ডারগুলো একটা রেলে যায় (<b>jobs channel</b>)। নির্দিষ্ট সংখ্যক রাঁধুনি (<b>worker</b>) প্রত্যেকে পরের টিকিট নেয়, রান্না করে, আর পরিবেশনের জায়গায় খাবার রাখে (<b>results channel</b>)। প্রতি অর্ডারে একজন রাঁধুনি নিয়োগ করলে বিশৃঙ্খলা হতো; নির্দিষ্ট দল রান্নাঘর সামলে রাখে। Backend-এ "রাঁধুনি" হলো database, API বা LLM call করা goroutine, আর নির্দিষ্ট সংখ্যা সেই সার্ভিসকে বন্যা থেকে রক্ষা করে।',
      '<code>sync.WaitGroup</code> হলো ম্যানেজারের হিসাবের খাতা: রাঁধুনি শিফট শুরু করলে <code>Add(1)</code>, চলে গেলে <code>Done()</code>, আর হিসাব শূন্য না হওয়া পর্যন্ত <code>Wait()</code> আটকে থাকে।',
      'jobs channel বন্ধ করা মানে রাঁধুনিদের বলা "আর অর্ডার নেই": প্রত্যেক worker-এর <code>for range jobs</code> লুপ শেষ হয়, তারা Done call করে, আর Wait ফিরে আসে।',
    ]),
    visual: {
      file: 'main.go',
      legend: [{ cls: 'live', label: L('busy', 'ব্যস্ত') }, { cls: 'cur', label: L('waiting', 'অপেক্ষায়') }, { cls: 'ok', label: L('finished', 'শেষ') }],
      examples: [
        {
          label: L('Workers squaring numbers', 'Worker দিয়ে সংখ্যার বর্গ'),
          inputs: [
            { key: 'w', label: L('Workers', 'Worker'), type: 'int', def: 2, min: 1, max: 4 },
            { key: 'n', label: L('Jobs', 'কাজ'), type: 'int', def: 5, min: 1, max: 8 },
          ],
          code: (inp) => `
package main

import (
	"fmt"
	"sync"
)

func worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
	defer wg.Done() // {tell the WaitGroup when this worker exits|worker বের হলে WaitGroup-কে জানাও} @@done
	for j := range jobs { // {take jobs until the channel is closed|channel বন্ধ না হওয়া পর্যন্ত কাজ নাও} @@take
		results <- j * j @@send
	}
}

func main() {
	jobs := make(chan int, ${inp.n}) @@mk
	results := make(chan int, ${inp.n})
	var wg sync.WaitGroup

	for w := 1; w <= ${inp.w}; w++ {
		wg.Add(1) // {Add BEFORE starting the goroutine|goroutine শুরুর আগেই Add} @@add
		go worker(w, jobs, results, &wg) @@start
	}
	for j := 1; j <= ${inp.n}; j++ {
		jobs <- j @@enq
	}
	close(jobs) // {no more jobs|আর কাজ নেই} @@close
	wg.Wait() // {block until every worker called Done|সব worker Done না করা পর্যন্ত আটকে থাকো} @@wait
	close(results) @@cres
	for r := range results { @@range
		fmt.Println(r) @@print
	}
}`,
          build({ w, n }) {
            const s = [];
            let queue = [], results = [], wg = 0, closed = false;
            const workers = Array.from({ length: w }, (_, k) => ({ name: `worker ${k + 1}`, state: 'idle', text: '', started: false }));
            const snap = (mainState, mainText) => [
              { type: 'lanes', wide: true, title: L('Goroutines', 'Goroutine'), items: [{ name: 'main', state: mainState, text: mainText }].concat(workers.filter((x) => x.started).map((x) => ({ name: x.name, state: x.state, text: x.text }))) },
              { type: 'chan', title: L('jobs', 'jobs'), name: 'jobs', cap: n, buf: queue.slice(), closed },
              { type: 'boxes', items: [{ name: 'wg', type: 'WaitGroup', val: `counter = ${wg}`, cls: 'hl' }] },
              { type: 'stack', dir: 'h', title: L('results (arrival order)', 'results (পৌঁছানোর ক্রমে)'), items: results.map((v) => ({ v, cls: 'ok' })) },
            ];
            s.push(step('mk', L(`Two buffered channels with room for ${n} values, and a WaitGroup at zero.`, `${n}টা মানের জায়গাসহ দুটো buffered channel, আর শূন্যে থাকা একটা WaitGroup।`), snap('run', L('setting up', 'প্রস্তুতি'))));
            workers.forEach((x, k) => {
              wg++;
              s.push(step('add', L(`<code>wg.Add(1)</code>: counter = ${wg}.`, `<code>wg.Add(1)</code>: counter = ${wg}।`), snap('run', '')));
              x.started = true; x.state = 'block'; x.text = L('waiting on range jobs (empty)', 'range jobs-এ অপেক্ষা (খালি)');
              s.push(step('start', L(`Start worker ${k + 1}. jobs is empty, so it blocks waiting for work.`, `worker ${k + 1} শুরু। jobs খালি, তাই কাজের অপেক্ষায় আটকে থাকে।`), snap('run', '')));
            });
            for (let j = 1; j <= n; j++) queue.push(j);
            s.push(step('enq', L(`main sends jobs 1 to ${n}. The buffer is big enough, so main never waits. (Workers may start grabbing jobs as soon as the first arrives; we show them waiting so each step stays readable.)`, `main 1 থেকে ${n} পর্যন্ত কাজ পাঠায়। Buffer যথেষ্ট বড়, তাই main অপেক্ষা করে না। (প্রথম কাজ আসামাত্র worker নিতে শুরু করতে পারে; প্রতিটা ধাপ পরিষ্কার রাখতে আমরা তাদের অপেক্ষায় দেখাচ্ছি।)`), snap('run', L('sending jobs', 'কাজ পাঠাচ্ছে'))));
            closed = true;
            s.push(step('close', L('<code>close(jobs)</code>: workers can still drain what is queued, then their loops end.', '<code>close(jobs)</code>: worker-রা জমে থাকা কাজ এখনো শেষ করতে পারবে, তারপর তাদের লুপ শেষ হবে।'), snap('run', '')));
            s.push(step('wait', L(`<code>wg.Wait()</code>: main blocks until the counter drops from ${wg} to 0.`, `<code>wg.Wait()</code>: counter ${wg} থেকে 0 না হওয়া পর্যন্ত main আটকে থাকে।`), snap('block', L('wg.Wait()', 'wg.Wait()')), {
              ask: { q: L(`${n} jobs, ${w} worker${w > 1 ? 's' : ''}. When does wg.Wait() return?`, `${n}টা কাজ, ${w}টা worker। wg.Wait() কখন ফিরবে?`), options: [L('After every worker\'s loop ends and it calls Done', 'প্রতিটা worker-এর লুপ শেষ হয়ে Done call করার পর'), L('As soon as the first result arrives', 'প্রথম ফলাফল আসামাত্র'), L('Right after close(jobs)', 'close(jobs)-এর ঠিক পরেই')], answer: 0, why: L('Wait returns when the counter is zero, which happens only after each worker runs its deferred Done.', 'Counter শূন্য হলে Wait ফেরে, যা ঘটে প্রতিটা worker-এর deferred Done চলার পরই।') },
            }));
            let round = 0;
            while (queue.length) {
              round++;
              const took = [];
              workers.forEach((x) => {
                if (queue.length) { const j = queue.shift(); x.state = 'run'; x.text = L(`processing job ${j}`, `কাজ ${j} করছে`); x.job = j; took.push(`w${workers.indexOf(x) + 1}→${j}`); }
                else { x.job = null; }
              });
              s.push(step('take', L(`Round ${round}: each free worker takes the next job (${took.join(', ')}).`, `ধাপ ${round}: প্রতিটা খালি worker পরের কাজ নেয় (${took.join(', ')})।`), snap('block', L('wg.Wait()', 'wg.Wait()'))));
              workers.forEach((x) => { if (x.job != null) { results.push(x.job * x.job); x.text = L(`sent ${x.job}×${x.job} = ${x.job * x.job}`, `পাঠাল ${x.job}×${x.job} = ${x.job * x.job}`); } });
              s.push(step('send', L('Each busy worker sends its result. Results arrive in whatever order workers finish.', 'প্রতিটা ব্যস্ত worker নিজের ফল পাঠায়। যে আগে শেষ করে তার ফল আগে আসে।'), snap('block', L('wg.Wait()', 'wg.Wait()'))));
              workers.forEach((x) => { if (x.job != null) { x.state = 'block'; x.text = L('waiting on range jobs', 'range jobs-এ অপেক্ষা'); } });
            }
            workers.forEach((x) => { x.state = 'done'; x.text = L('range ended → wg.Done()', 'range শেষ → wg.Done()'); });
            wg = 0;
            s.push(step('done', L('jobs is closed and empty, so every worker\'s range loop ends. Each deferred <code>wg.Done()</code> runs and the counter reaches 0.', 'jobs বন্ধ আর খালি, তাই প্রতিটা worker-এর range লুপ শেষ। প্রতিটা deferred <code>wg.Done()</code> চলে, counter 0-তে পৌঁছায়।'), snap('block', L('wg.Wait()', 'wg.Wait()'))));
            s.push(step('cres', L('Wait returns. Now it is safe to close results: nobody can send any more.', 'Wait ফিরে এলো। এখন results বন্ধ করা নিরাপদ: আর কেউ পাঠাতে পারবে না।'), snap('run', L('close(results)', 'close(results)'))));
            s.push(step('print', L(`main ranges over results and prints ${results.length} values. On a real run the order can differ, because workers finish at different times.`, `main results-এর উপর range করে ${results.length}টা মান print করে। আসল রানে ক্রম আলাদা হতে পারে, কারণ worker-রা আলাদা সময়ে শেষ করে।`), snap('done', L('finished', 'শেষ')).concat([out(results.map(String), results.length)]), { tone: 'ok' }));
            return s;
          },
        },
      ],
    },
    walk: [
      { at: 'add', code: 'wg.Add(1)', text: L('Call Add in the parent, before <code>go</code>. Calling it inside the goroutine races with Wait.', 'Parent-এ, <code>go</code>-এর আগে Add call করুন। Goroutine-এর ভেতরে call করলে Wait-এর সাথে race হয়।') },
      { at: 'done', code: 'defer wg.Done()', text: L('Deferred so it runs even if the worker returns early or panics.', 'Defer করা, যাতে worker আগেভাগে return বা panic করলেও চলে।') },
      { at: 'take', code: 'for j := range jobs', text: L('Workers share one channel; each job goes to exactly one worker.', 'Worker-রা একটা channel ভাগ করে; প্রতিটা কাজ ঠিক একজন worker-এর কাছেই যায়।') },
      { at: 'wait', code: 'wg.Wait()', text: L('Blocks until the counter is zero. Only then close results.', 'Counter শূন্য না হওয়া পর্যন্ত আটকে থাকে। তারপরই results বন্ধ করুন।') },
    ],
    mistakes: [
      { title: L('wg.Add inside the goroutine', 'Goroutine-এর ভেতরে wg.Add'), err: 'go func() { wg.Add(1); defer wg.Done(); ... }()', fix: L('Wait may run before the goroutine has called Add, see zero, and return early. Add in the parent.', 'Goroutine Add call করার আগেই Wait চলে শূন্য দেখে আগেভাগে ফিরে যেতে পারে। Parent-এ Add করুন।') },
      { title: L('Forgetting close(jobs)', 'close(jobs) ভুলে যাওয়া'), err: 'fatal error: all goroutines are asleep - deadlock!', fix: L('Workers wait on range forever, Done never runs, so Wait never returns.', 'Worker-রা চিরকাল range-এ অপেক্ষা করে, Done কখনো চলে না, তাই Wait কখনো ফেরে না।') },
      { title: L('Passing a WaitGroup by value', 'WaitGroup value হিসেবে পাঠানো'), err: 'func worker(wg sync.WaitGroup) // go vet: passes lock by value', fix: L('Each worker would call Done on its own copy. Pass <code>*sync.WaitGroup</code>.', 'প্রতিটা worker নিজের কপিতে Done call করত। <code>*sync.WaitGroup</code> পাঠান।') },
      { title: L('Unbuffered results with Wait before reading', 'Wait-এর আগে না পড়া unbuffered results'), err: '', fix: L('Workers block sending results nobody reads yet, while main blocks in Wait: deadlock. Buffer results, or read them in a separate goroutine.', 'কেউ না পড়া results পাঠাতে গিয়ে worker আটকে থাকে, আর main আটকে থাকে Wait-এ: deadlock। results buffer করুন, অথবা আলাদা goroutine-এ পড়ুন।') },
    ],
    perf: L([
      'The right worker count depends on the work. CPU-bound work rarely benefits from more workers than <code>runtime.NumCPU()</code>. I/O-bound work (HTTP, database, LLM calls) can use many more, limited by what the remote service tolerates.',
      'For "run these tasks and stop at the first error", <code>golang.org/x/sync/errgroup</code> adds error propagation and context cancellation, and <code>SetLimit(n)</code> gives you a pool in one line.',
    ], [
      'সঠিক worker সংখ্যা কাজের উপর নির্ভর করে। CPU-নির্ভর কাজে <code>runtime.NumCPU()</code>-এর বেশি worker খুব কমই লাভ দেয়। I/O-নির্ভর কাজ (HTTP, database, LLM call) অনেক বেশি worker নিতে পারে, দূরের সার্ভিস যতটা সহ্য করে ততটা।',
      '"এই কাজগুলো চালাও আর প্রথম error-এ থামো" এর জন্য <code>golang.org/x/sync/errgroup</code> error পৌঁছানো আর context cancellation যোগ করে, আর <code>SetLimit(n)</code> এক লাইনেই pool দেয়।',
    ]),
    quiz: [
      { q: L('Where should <code>wg.Add(1)</code> go?', '<code>wg.Add(1)</code> কোথায় থাকবে?'), options: [L('In the parent, before the go statement', 'Parent-এ, go statement-এর আগে'), L('First line inside the goroutine', 'Goroutine-এর ভেতরের প্রথম লাইনে'), L('After wg.Wait()', 'wg.Wait()-এর পরে')], answer: 0, why: L('Otherwise Wait can observe a zero counter too early.', 'নইলে Wait খুব আগেই শূন্য counter দেখতে পারে।') },
      { q: L('What makes a worker\'s <code>for j := range jobs</code> loop end?', 'Worker-এর <code>for j := range jobs</code> লুপ কীসে শেষ হয়?'), options: [L('jobs is closed and drained', 'jobs বন্ধ আর খালি হলে'), L('jobs is empty', 'jobs খালি হলে'), L('wg.Wait() is called', 'wg.Wait() call হলে')], answer: 0, why: L('An empty but open channel just blocks.', 'খালি কিন্তু খোলা channel শুধু আটকে রাখে।') },
      { q: L('Why use a fixed pool instead of one goroutine per job?', 'প্রতি কাজে একটা goroutine-এর বদলে নির্দিষ্ট pool কেন?'), options: [L('To limit load on the resource the jobs use', 'কাজগুলো যে resource ব্যবহার করে তার উপর চাপ সীমিত রাখতে'), L('Goroutines are expensive to create', 'Goroutine বানানো ব্যয়বহুল'), L('Channels need exactly N readers', 'Channel-এ ঠিক N জন reader লাগে')], answer: 0, why: L('Goroutines are cheap; databases and APIs are not. The pool caps concurrency.', 'Goroutine সস্তা; database আর API না। Pool একসাথে চলা কাজের সংখ্যা সীমিত রাখে।') },
    ],
    exercises: [
      { title: L('Sum the results', 'ফলাফল যোগ করুন'),
        task: L('Change main so it collects the results into a slice and prints the total instead of each value. For 5 jobs the sum of squares is 55.', 'main বদলান, যাতে প্রতিটা মানের বদলে ফলাফলগুলো একটা slice-এ সংগ্রহ করে মোট print করে। 5টা কাজের জন্য বর্গের যোগফল 55।'),
        hints: [L('Keep the pool exactly as is; only the final loop changes.', 'Pool যেমন আছে রাখুন; শুধু শেষের লুপ বদলাবে।'), L('<code>total += r</code> inside <code>for r := range results</code>.', '<code>for r := range results</code>-এর ভেতরে <code>total += r</code>।')],
        solution: `package main

import (
	"fmt"
	"sync"
)

func worker(jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
	defer wg.Done()
	for j := range jobs {
		results <- j * j
	}
}

func main() {
	const n = 5
	jobs := make(chan int, n)
	results := make(chan int, n)
	var wg sync.WaitGroup
	for w := 0; w < 2; w++ {
		wg.Add(1)
		go worker(jobs, results, &wg)
	}
	for j := 1; j <= n; j++ {
		jobs <- j
	}
	close(jobs)
	wg.Wait()
	close(results)
	total := 0
	for r := range results {
		total += r
	}
	fmt.Println(total) // {55|55}
}` },
      { title: L('A pool for slow calls', 'ধীর call-এর জন্য pool'),
        task: L('Simulate 10 "API calls" that each take 300 ms (<code>time.Sleep</code>). Process them with 3 workers and print the total elapsed time. It should be close to 1.2 s, not 3 s. Explain the number.', 'প্রতিটা 300 ms নেয় এমন 10টা "API call" অনুকরণ করুন (<code>time.Sleep</code>)। 3টা worker দিয়ে চালিয়ে মোট সময় print করুন। এটা 3 s না, 1.2 s-এর কাছাকাছি হওয়া উচিত। সংখ্যাটা ব্যাখ্যা করুন।'),
        hints: [L('Record <code>start := time.Now()</code> before and print <code>time.Since(start)</code> after.', 'আগে <code>start := time.Now()</code> রাখুন, পরে <code>time.Since(start)</code> print করুন।'), L('10 jobs over 3 workers is 4 rounds of 300 ms.', '3টা worker-এ 10টা কাজ মানে 300 ms-এর 4টা রাউন্ড।')],
        solution: `package main

import (
	"fmt"
	"sync"
	"time"
)

func main() {
	jobs := make(chan int, 10)
	var wg sync.WaitGroup
	start := time.Now()
	for w := 0; w < 3; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for range jobs {
				time.Sleep(300 * time.Millisecond) // {pretend API call|নকল API call}
			}
		}()
	}
	for i := 0; i < 10; i++ {
		jobs <- i
	}
	close(jobs)
	wg.Wait()
	fmt.Println(time.Since(start).Round(100 * time.Millisecond)) // {~1.2s: 4 rounds|~1.2s: 4 রাউন্ড}
}` },
    ],
    takeaways: [
      L('A worker pool is N goroutines ranging over one jobs channel.', 'Worker pool হলো একটা jobs channel-এর উপর range করা N টা goroutine।'),
      L('WaitGroup: Add in the parent, defer Done in the worker, Wait to block until zero.', 'WaitGroup: parent-এ Add, worker-এ defer Done, শূন্য না হওয়া পর্যন্ত Wait।'),
      L('Close jobs to stop workers; close results only after Wait.', 'Worker থামাতে jobs বন্ধ করুন; results বন্ধ করুন শুধু Wait-এর পর।'),
      L('Pool size protects downstream services; pick it from the kind of work.', 'Pool-এর আকার পরের সার্ভিসকে রক্ষা করে; কাজের ধরন দেখে বেছে নিন।'),
    ],
    links: [
      { t: 'Go by Example: Worker Pools', url: 'https://gobyexample.com/worker-pools' },
      { t: 'Package sync: WaitGroup', url: 'https://pkg.go.dev/sync#WaitGroup' },
      { t: 'Package errgroup', url: 'https://pkg.go.dev/golang.org/x/sync/errgroup' },
    ],
  });
})();
