(function () {
  const { L, step, out } = GV;
  const lanes = (a, b) => ({ type: 'lanes', wide: true, title: L('Two goroutines, each with its own CPU register', 'দুটো goroutine, প্রত্যেকের নিজস্ব CPU register'), items: [a, b] });
  const G = (name, state, text, reg) => ({ name, state, text, reg: reg == null ? null : 'reg=' + reg });
  const shared = (v, cls, lock) => ({ type: 'boxes', title: L('Shared memory', 'ভাগাভাগি করা মেমরি'), items: [{ name: 'counter', type: 'int', val: v, cls }].concat(lock ? [{ name: 'mu', type: 'sync.Mutex', val: lock, cls: lock === 'free' ? '' : 'hl' }] : []) });

  GV.register({
    id: 'go-mutex-race', track: 'go', phase: 'conc', order: 2, minutes: 18,
    title: L('Data races and sync.Mutex', 'Data race আর sync.Mutex'),
    summary: L('Step through two goroutines running counter++ at the same time, watch an update get lost, then fix it with a mutex.', 'একসাথে counter++ চালানো দুটো goroutine ধাপে ধাপে দেখুন, একটা আপডেট হারিয়ে যেতে দেখুন, তারপর mutex দিয়ে ঠিক করুন।'),
    idea: L([
      '<code>counter++</code> looks like one action, but the CPU does three: <b>load</b> the value into a register, <b>add</b> one, <b>store</b> it back. If two goroutines interleave those steps, both can load the same old value, and one increment disappears. That is a <b>data race</b>: two goroutines touch the same memory at the same time and at least one writes.',
      'A <b>mutex</b> (mutual exclusion lock) is the key to a single bathroom: whoever holds the key goes in, everyone else waits at the door. <code>mu.Lock()</code> takes the key, <code>mu.Unlock()</code> returns it. The code between them, the <b>critical section</b>, is run by one goroutine at a time.',
      'Races are nasty because they are random: your test passes 99 times and fails on the 100th, usually in production. Go ships a detector: run <code>go test -race</code> or <code>go run -race</code>.',
    ], [
      '<code>counter++</code> দেখতে একটা কাজ, কিন্তু CPU তিনটা কাজ করে: মানটা register-এ <b>load</b>, এক <b>যোগ</b>, তারপর আবার <b>store</b>। দুটো goroutine যদি এই ধাপগুলো মিশিয়ে ফেলে, দুটোই একই পুরনো মান load করতে পারে, আর একটা বৃদ্ধি হারিয়ে যায়। এটাই <b>data race</b>: দুটো goroutine একই সময়ে একই মেমরি ছোঁয়, আর অন্তত একটা লেখে।',
      '<b>Mutex</b> (mutual exclusion lock) হলো একটাই বাথরুমের চাবির মতো: যার হাতে চাবি সে ভেতরে যায়, বাকিরা দরজায় অপেক্ষা করে। <code>mu.Lock()</code> চাবি নেয়, <code>mu.Unlock()</code> ফেরত দেয়। মাঝের কোড, অর্থাৎ <b>critical section</b>, একবারে একটা goroutine-ই চালায়।',
      'Race কঠিন কারণ এটা এলোমেলো: আপনার test 99 বার পাস করে আর 100তম বার fail করে, সাধারণত production-এ। Go-র সাথেই একটা detector আছে: <code>go test -race</code> বা <code>go run -race</code> চালান।',
    ]),
    visual: {
      file: 'main.go',
      examples: [
        {
          label: L('The race: a lost update', 'Race: হারিয়ে যাওয়া আপডেট'),
          code: `
package main

import (
	"fmt"
	"sync"
)

var counter int

func inc(wg *sync.WaitGroup) {
	defer wg.Done()
	counter++ // {really: load, add, store|আসলে: load, add, store} @@inc
}

func main() {
	var wg sync.WaitGroup
	wg.Add(2) @@add
	go inc(&wg) @@g1
	go inc(&wg) @@g2
	wg.Wait() @@wait
	fmt.Println(counter) // {expected 2...|আশা ছিল 2...} @@print
}`,
          build() {
            return [
              step('add', L('counter starts at 0. We start two goroutines, each doing <code>counter++</code> once.', 'counter শুরু 0 দিয়ে। দুটো goroutine শুরু করব, প্রতিটা একবার <code>counter++</code> করবে।'), [lanes(G('G1', 'idle', ''), G('G2', 'idle', '')), shared(0)]),
              step('inc', L('G1 <b>loads</b> counter (0) into its register.', 'G1 counter (0) নিজের register-এ <b>load</b> করে।'), [lanes(G('G1', 'run', L('load counter', 'counter load'), 0), G('G2', 'idle', '')), shared(0, 'live')]),
              step('inc', L('Before G1 can store, the scheduler switches. G2 also <b>loads</b> counter: still 0.', 'G1 store করার আগেই scheduler বদলে দেয়। G2-ও counter <b>load</b> করে: এখনো 0।'), [lanes(G('G1', 'wait', L('paused before store', 'store-এর আগে থেমে আছে'), 0), G('G2', 'run', L('load counter', 'counter load'), 0)), shared(0, 'live')], {
                ask: { q: L('Both registers hold 0. After both add 1 and store, what is counter?', 'দুটো register-এই 0। দুটোই 1 যোগ করে store করলে counter কত?'), options: ['1', '2', '0'], answer: 0, why: L('Each computes 0 + 1 = 1 and stores 1. The second store overwrites the first.', 'প্রত্যেকে 0 + 1 = 1 হিসাব করে 1 store করে। দ্বিতীয় store প্রথমটার উপর লেখে।') },
              }),
              step('inc', L('G1 adds 1 and <b>stores</b> 1.', 'G1 1 যোগ করে 1 <b>store</b> করে।'), [lanes(G('G1', 'run', L('store 0+1', 'store 0+1'), 1), G('G2', 'wait', L('paused', 'থেমে আছে'), 0)), shared(1, 'hl')]),
              step('inc', L('G2 adds 1 to <b>its</b> stale 0 and stores 1. G1\'s update is overwritten.', 'G2 <b>নিজের</b> পুরনো 0-তে 1 যোগ করে 1 store করে। G1-এর আপডেট মুছে গেল।'), [lanes(G('G1', 'done', ''), G('G2', 'run', L('store 0+1', 'store 0+1'), 1)), shared(1, 'bad')], { tone: 'bad' }),
              step('print', L('With this interleaving it prints 1, not 2. Run the program yourself and you will usually see 2: the bug appears only sometimes, which is exactly why races are dangerous. With many goroutines the total comes out wrong by a random amount. <code>go run -race</code> flags this line every time.', 'এই ক্রমে চললে 2 না, 1 print হয়। নিজে চালালে সাধারণত 2 দেখবেন: bug-টা শুধু মাঝে মাঝে দেখা দেয়, আর ঠিক এজন্যই race বিপজ্জনক। অনেক goroutine থাকলে মোট এলোমেলোভাবে ভুল আসে। <code>go run -race</code> প্রতিবারই এই লাইন ধরিয়ে দেয়।'), [lanes(G('G1', 'done', ''), G('G2', 'done', '')), shared(1, 'bad'), out(['1', { v: 'WARNING: DATA RACE  (with -race)', cls: 'bad' }], 2)], { tone: 'bad' }),
            ];
          },
        },
        {
          label: L('Fixed with a mutex', 'Mutex দিয়ে ঠিক করা'),
          code: `
package main

import (
	"fmt"
	"sync"
)

var (
	counter int
	mu      sync.Mutex
)

func inc(wg *sync.WaitGroup) {
	defer wg.Done()
	mu.Lock() // {take the key|চাবি নাও} @@lock
	counter++ @@inc
	mu.Unlock() // {give it back|ফেরত দাও} @@unlock
}

func main() {
	var wg sync.WaitGroup
	wg.Add(2)
	go inc(&wg)
	go inc(&wg)
	wg.Wait() @@wait
	fmt.Println(counter) @@print
}`,
          build() {
            return [
              step('lock', L('G1 calls <code>mu.Lock()</code>. The mutex was free, so G1 holds it.', 'G1 <code>mu.Lock()</code> call করে। Mutex খালি ছিল, তাই G1 সেটা ধরে।'), [lanes(G('G1', 'run', L('holds mu', 'mu ধরে আছে')), G('G2', 'idle', '')), shared(0, '', 'held by G1')]),
              step('lock', L('G2 calls <code>mu.Lock()</code>, but G1 holds it, so G2 <b>blocks</b> at the door.', 'G2 <code>mu.Lock()</code> call করে, কিন্তু G1 ধরে আছে, তাই G2 দরজায় <b>আটকে</b> থাকে।'), [lanes(G('G1', 'run', L('in critical section', 'critical section-এ')), G('G2', 'block', L('waiting for mu', 'mu-এর অপেক্ষায়'))), shared(0, '', 'held by G1')]),
              step('inc', L('G1 does load, add, store with nobody interfering: counter = 1.', 'G1 কারো বাধা ছাড়াই load, add, store করে: counter = 1।'), [lanes(G('G1', 'run', L('counter++', 'counter++'), 1), G('G2', 'block', L('waiting for mu', 'mu-এর অপেক্ষায়'))), shared(1, 'hl', 'held by G1')]),
              step('unlock', L('G1 unlocks. The waiting G2 now gets the mutex.', 'G1 unlock করে। অপেক্ষারত G2 এখন mutex পায়।'), [lanes(G('G1', 'done', ''), G('G2', 'run', L('holds mu', 'mu ধরে আছে'))), shared(1, '', 'held by G2')], {
                ask: { q: L('G2 now loads counter. What value does it see?', 'G2 এখন counter load করবে। কোন মান দেখবে?'), options: ['1', '0'], answer: 0, why: L('The lock made G1\'s write finish, and be visible, before G2 could start.', 'Lock নিশ্চিত করেছে G2 শুরু করার আগেই G1-এর লেখা শেষ আর দৃশ্যমান হয়েছে।') },
              }),
              step('inc', L('G2 loads 1, adds 1, stores 2.', 'G2 1 load করে, 1 যোগ করে, 2 store করে।'), [lanes(G('G1', 'done', ''), G('G2', 'run', L('counter++', 'counter++'), 2)), shared(2, 'hl', 'held by G2')]),
              step('unlock', L('G2 unlocks; the mutex is free again.', 'G2 unlock করে; mutex আবার খালি।'), [lanes(G('G1', 'done', ''), G('G2', 'done', '')), shared(2, '', 'free')]),
              step('print', L('Always 2. Same result on every run, and the race detector is silent.', 'সবসময় 2। প্রতিবার একই ফলাফল, আর race detector চুপ।'), [lanes(G('G1', 'done', ''), G('G2', 'done', '')), shared(2, 'ok', 'free'), out(['2'], 1)], { tone: 'ok' }),
            ];
          },
        },
      ],
    },
    walk: [
      { at: 'inc', ex: 0, code: 'counter++', text: L('Three machine steps, not one. Unsafe when shared without synchronisation.', 'একটা না, তিনটা মেশিন ধাপ। Synchronisation ছাড়া ভাগ করলে অনিরাপদ।') },
      { at: 'lock', ex: 1, code: 'mu.Lock()', text: L('Blocks until this goroutine owns the mutex.', 'এই goroutine mutex-এর মালিক না হওয়া পর্যন্ত আটকে থাকে।') },
      { at: 'unlock', ex: 1, code: 'mu.Unlock()', text: L('In real code write <code>mu.Lock(); defer mu.Unlock()</code> so an early return or panic cannot leave it locked.', 'আসল কোডে লিখুন <code>mu.Lock(); defer mu.Unlock()</code>, যাতে আগেভাগে return বা panic হলেও lock থেকে না যায়।') },
      { at: 'wait', ex: 1, code: 'wg.Wait()', text: L('Waits for both goroutines (see the worker-pool lesson).', 'দুটো goroutine-এর জন্য অপেক্ষা করে (worker-pool লেসন দেখুন)।') },
    ],
    mistakes: [
      { title: L('Forgetting to unlock', 'Unlock ভুলে যাওয়া'), err: 'fatal error: all goroutines are asleep - deadlock!', fix: L('An early return between Lock and Unlock leaves the mutex held forever. Use <code>defer mu.Unlock()</code> right after Lock.', 'Lock আর Unlock-এর মাঝে আগেভাগে return হলে mutex চিরকাল ধরা থাকে। Lock-এর ঠিক পরে <code>defer mu.Unlock()</code> ব্যবহার করুন।') },
      { title: L('Copying a mutex', 'Mutex কপি করা'), err: './main.go:10:9: Get passes lock by value: main.SafeCounter contains sync.Mutex', fix: L('This is a <code>go vet</code> warning. A copied mutex is a different lock. Use pointer receivers on structs that contain a mutex.', 'এটা <code>go vet</code>-এর সতর্কতা। কপি করা mutex একটা আলাদা lock। Mutex আছে এমন struct-এ pointer receiver ব্যবহার করুন।') },
      { title: L('Unprotected map access from goroutines', 'Goroutine থেকে সুরক্ষাহীন map ব্যবহার'), err: 'fatal error: concurrent map writes', fix: L('The runtime catches this one even without -race. Guard the map with a mutex.', 'Runtime এটা -race ছাড়াই ধরে। Map-কে mutex দিয়ে সুরক্ষা দিন।') },
      { title: L('Holding a lock while doing slow work', 'ধীর কাজের সময় lock ধরে রাখা'), err: '', fix: L('Keep critical sections short. Do I/O and network calls outside the lock.', 'Critical section ছোট রাখুন। I/O আর network call lock-এর বাইরে করুন।') },
    ],
    perf: L([
      'For a single counter, <code>sync/atomic</code> (for example <code>atomic.Int64</code>) is faster than a mutex because it uses one CPU instruction.',
      'If reads vastly outnumber writes, <code>sync.RWMutex</code> lets many readers in at once while writers get exclusive access. Measure before switching: an RWMutex costs more per operation.',
    ], [
      'একটা counter-এর জন্য <code>sync/atomic</code> (যেমন <code>atomic.Int64</code>) mutex-এর চেয়ে দ্রুত, কারণ এটা একটা মাত্র CPU instruction ব্যবহার করে।',
      'লেখার চেয়ে পড়া অনেক বেশি হলে <code>sync.RWMutex</code> একসাথে অনেক reader ঢুকতে দেয়, আর writer একা প্রবেশাধিকার পায়। বদলানোর আগে মেপে দেখুন: RWMutex-এর প্রতি অপারেশনের খরচ বেশি।',
    ]),
    quiz: [
      { q: L('What is a data race?', 'Data race কী?'), options: [L('Two goroutines access the same memory concurrently and at least one writes', 'দুটো goroutine একসাথে একই মেমরি ছোঁয় আর অন্তত একটা লেখে'), L('Two goroutines finish at the same time', 'দুটো goroutine একই সময়ে শেষ হয়'), L('A goroutine running too fast', 'একটা goroutine খুব দ্রুত চলে')], answer: 0, why: L('Reads alone are safe; a concurrent write makes it a race.', 'শুধু পড়া নিরাপদ; একসাথে লেখা থাকলেই race।') },
      { q: L('How do you detect races in Go?', 'Go-তে race কীভাবে ধরবেন?'), options: ['go test -race', 'go vet -race', 'go build -check'], answer: 0, why: L('The race detector instruments memory accesses at runtime.', 'Race detector runtime-এ মেমরি অ্যাক্সেস পর্যবেক্ষণ করে।') },
      { q: L('Best way to make sure a mutex is always released?', 'Mutex সবসময় ছেড়ে দেওয়া নিশ্চিত করার সেরা উপায়?'), options: ['mu.Lock(); defer mu.Unlock()', L('Unlock at the end of the function', 'Function-এর শেষে Unlock'), L('Unlock inside every if branch', 'প্রতিটা if শাখায় Unlock')], answer: 0, why: L('defer runs on every return path, even panics.', 'defer প্রতিটা return পথে চলে, panic-এও।') },
    ],
    exercises: [
      { title: L('SafeCounter', 'SafeCounter'),
        task: L('Build <code>type SafeCounter struct</code> holding a <code>map[string]int</code> and a mutex, with methods <code>Inc(key string)</code> and <code>Value(key string) int</code>. Start 100 goroutines that each call <code>Inc("hits")</code>, wait, and print 100. Run it with <code>-race</code>.', 'একটা <code>type SafeCounter struct</code> বানান যাতে একটা <code>map[string]int</code> আর একটা mutex আছে, সাথে <code>Inc(key string)</code> আর <code>Value(key string) int</code> method। 100টা goroutine চালান যেগুলো প্রতিটা <code>Inc("hits")</code> call করে, অপেক্ষা করে 100 print করুন। <code>-race</code> দিয়ে চালান।'),
        hints: [L('Pointer receivers, so the mutex is never copied.', 'Pointer receiver, যাতে mutex কখনো কপি না হয়।'), L('Value must lock too: reads during writes are races.', 'Value-তেও lock লাগবে: লেখার সময় পড়াও race।')],
        solution: `package main

import (
	"fmt"
	"sync"
)

type SafeCounter struct {
	mu sync.Mutex
	m  map[string]int
}

func (c *SafeCounter) Inc(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.m[key]++
}

func (c *SafeCounter) Value(key string) int {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.m[key]
}

func main() {
	c := &SafeCounter{m: map[string]int{}}
	var wg sync.WaitGroup
	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			c.Inc("hits")
		}()
	}
	wg.Wait()
	fmt.Println(c.Value("hits"))
}` },
      { title: L('Atomic instead', 'বরং atomic'),
        task: L('Rewrite the two-goroutine counter with <code>atomic.Int64</code> and no mutex. When would you still need a mutex?', 'দুই-goroutine counter-টা mutex ছাড়া <code>atomic.Int64</code> দিয়ে আবার লিখুন। কখন তবুও mutex লাগবে?'),
        hints: [L('<code>var counter atomic.Int64</code>, then <code>counter.Add(1)</code> and <code>counter.Load()</code>.', '<code>var counter atomic.Int64</code>, তারপর <code>counter.Add(1)</code> আর <code>counter.Load()</code>।'), L('Atomics protect one value. Updating two related values together needs a lock.', 'Atomic একটা মান সুরক্ষা দেয়। সম্পর্কিত দুটো মান একসাথে বদলাতে lock লাগে।')],
        solution: `package main

import (
	"fmt"
	"sync"
	"sync/atomic"
)

func main() {
	var counter atomic.Int64
	var wg sync.WaitGroup
	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			counter.Add(1) // {one indivisible CPU operation|একটা অবিভাজ্য CPU অপারেশন}
		}()
	}
	wg.Wait()
	fmt.Println(counter.Load()) // {always 1000|সবসময় 1000}
}` },
    ],
    takeaways: [
      L('<code>x++</code> on shared memory is load, add, store: not safe across goroutines.', 'Shared মেমরিতে <code>x++</code> মানে load, add, store: goroutine জুড়ে নিরাপদ না।'),
      L('A mutex lets one goroutine at a time into the critical section. Pair Lock with defer Unlock.', 'Mutex একবারে একটা goroutine-কে critical section-এ ঢুকতে দেয়। Lock-এর সাথে defer Unlock দিন।'),
      L('Run tests with <code>-race</code> as a habit; races are random and hide in tests.', 'অভ্যাস হিসেবে <code>-race</code> দিয়ে test চালান; race এলোমেলো আর test-এ লুকিয়ে থাকে।'),
      L('Use atomics for single counters and RWMutex for read-heavy data, after measuring.', 'একক counter-এ atomic, পড়া-প্রধান ডেটায় RWMutex, মেপে দেখার পর।'),
    ],
    links: [
      { t: 'Data Race Detector', url: 'https://go.dev/doc/articles/race_detector' },
      { t: 'A Tour of Go: sync.Mutex', url: 'https://go.dev/tour/concurrency/9' },
      { t: 'The Go Memory Model', url: 'https://go.dev/ref/mem' },
    ],
  });
})();
