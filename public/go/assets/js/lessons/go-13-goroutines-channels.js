(function () {
  const { L, step, out } = GV;
  const lanes = (items) => ({ type: 'lanes', wide: true, title: L('Goroutines', 'Goroutine'), items });
  const g = (name, state, text) => ({ name, state, text });
  const ch = (opts) => Object.assign({ type: 'chan', title: L('Channel', 'Channel'), name: 'ch' }, opts);

  GV.register({
    id: 'go-goroutines-channels', track: 'go', phase: 'conc', order: 1, minutes: 22,
    title: L('Goroutines and channels', 'Goroutine আর channel'),
    summary: L('Start concurrent work with go, and pass values safely through unbuffered and buffered channels. Includes blocking, close, range and deadlock.', 'go দিয়ে একসাথে কাজ শুরু করুন, আর unbuffered ও buffered channel দিয়ে নিরাপদে মান পাঠান। Blocking, close, range আর deadlock-সহ।'),
    idea: L([
      'A <b>goroutine</b> is a function running concurrently with the rest of your program. Write <code>go f()</code> and f starts in the background while the caller carries on. Goroutines are very cheap (a few KB of stack each), so a Go server can run hundreds of thousands of them, often one per request.',
      'A <b>channel</b> is a typed pipe between goroutines. Think of an <b>unbuffered</b> channel as handing a parcel to someone in person: the giver waits until the receiver takes it, and the receiver waits until someone gives. Both meet at the same moment, which also synchronises them. A <b>buffered</b> channel is a small letterbox with room for N parcels: the sender only waits when it is full, the receiver only when it is empty.',
      'The Go motto: <i>do not communicate by sharing memory; share memory by communicating</i>. Passing a value through a channel hands over ownership cleanly, without locks.',
    ], [
      '<b>Goroutine</b> হলো এমন একটা function যেটা প্রোগ্রামের বাকি অংশের সাথে একসাথে চলে। <code>go f()</code> লিখলে f পেছনে চলতে শুরু করে, আর caller নিজের কাজ চালিয়ে যায়। Goroutine খুব সস্তা (প্রতিটার কয়েক KB stack), তাই একটা Go সার্ভার লাখো goroutine চালাতে পারে, প্রায়ই প্রতি request-এ একটা।',
      '<b>Channel</b> হলো goroutine-গুলোর মধ্যে type-যুক্ত একটা পাইপ। <b>Unbuffered</b> channel-কে ভাবুন হাতে হাতে পার্সেল দেওয়ার মতো: যে দেয় সে অপেক্ষা করে যতক্ষণ না অন্যজন নেয়, আর যে নেয় সে অপেক্ষা করে যতক্ষণ না কেউ দেয়। দুজন একই মুহূর্তে মেলে, এতে তারা সমন্বিতও হয়। <b>Buffered</b> channel হলো N টা পার্সেলের জায়গাওয়ালা ছোট একটা ডাকবাক্স: পাঠানো ব্যক্তি শুধু ভরা থাকলে অপেক্ষা করে, নেওয়া ব্যক্তি শুধু খালি থাকলে।',
      'Go-র মূলমন্ত্র: <i>মেমরি ভাগ করে যোগাযোগ করো না; যোগাযোগ করে মেমরি ভাগ করো</i>। Channel দিয়ে মান পাঠালে lock ছাড়াই পরিষ্কারভাবে মালিকানা হস্তান্তর হয়।',
    ]),
    visual: {
      file: 'main.go',
      legend: [{ cls: 'live', label: L('running', 'চলছে') }, { cls: 'cur', label: L('blocked, waiting', 'আটকে, অপেক্ষায়') }, { cls: 'ok', label: L('finished', 'শেষ') }],
      examples: [
        {
          label: L('Unbuffered: a hand-off', 'Unbuffered: হাতবদল'),
          code: `
package main

import "fmt"

func main() {
	ch := make(chan string) // {unbuffered|unbuffered} @@mk
	go func() { // {start a goroutine|একটা goroutine শুরু} @@go
		ch <- "ping" // {waits for a receiver|receiver-এর অপেক্ষা} @@send
	}()
	msg := <-ch // {waits for a sender|sender-এর অপেক্ষা} @@recv
	fmt.Println(msg) @@print
}`,
          build() {
            return [
              step('mk', L('Make an unbuffered channel of strings. It has no storage: every send must meet a receive.', 'String-এর একটা unbuffered channel। এর কোনো জায়গা নেই: প্রতিটা send-কে একটা receive-এর সাথে মিলতে হবে।'), [lanes([g('main', 'run', L('make(chan string)', 'make(chan string)'))]), ch({ cap: 0 })]),
              step('go', L('<code>go func(){…}()</code> starts a new goroutine. main does <b>not</b> wait for it; both now run concurrently.', '<code>go func(){…}()</code> একটা নতুন goroutine শুরু করে। main এর জন্য অপেক্ষা <b>করে না</b>; এখন দুটোই একসাথে চলে।'), [lanes([g('main', 'run', L('continues to the next line', 'পরের লাইনে চলে যায়')), g('goroutine 1', 'new', L('just started', 'এইমাত্র শুরু'))]), ch({ cap: 0 })]),
              step('recv', L('main reaches <code>&lt;-ch</code> first. Nobody has sent yet, so main <b>blocks</b>. Blocking is cheap: the scheduler runs other goroutines.', 'main আগে <code>&lt;-ch</code>-এ পৌঁছায়। এখনো কেউ পাঠায়নি, তাই main <b>আটকে</b> যায়। আটকে থাকা সস্তা: scheduler অন্য goroutine চালায়।'), [lanes([g('main', 'block', L('waiting to receive on ch', 'ch থেকে নেওয়ার অপেক্ষায়')), g('goroutine 1', 'run', L('about to send', 'পাঠাতে যাচ্ছে'))]), ch({ cap: 0 })], {
                ask: { q: L('If the goroutine never sent anything, what would happen to main?', 'Goroutine যদি কখনো কিছু না পাঠাত, main-এর কী হতো?'), options: [L('It would wait forever; Go reports a deadlock', 'চিরকাল অপেক্ষা করত; Go deadlock জানাত'), L('It would receive "" and continue', '"" পেয়ে চলতে থাকত'), L('It would time out after 1 second', '1 সেকেন্ড পরে time out হতো')], answer: 0, why: L('A receive with no possible sender blocks forever. When every goroutine is stuck, the runtime stops with "all goroutines are asleep - deadlock!".', 'পাঠানোর কেউ না থাকলে receive চিরকাল আটকে থাকে। সব goroutine আটকে গেলে runtime "all goroutines are asleep - deadlock!" বলে থামে।') },
              }),
              step('send', L('The goroutine sends "ping". A receiver is waiting, so the value is handed over directly.', 'Goroutine "ping" পাঠায়। একজন receiver অপেক্ষায় আছে, তাই মানটা সরাসরি হাতবদল হয়।'), [lanes([g('main', 'block', L('receiving…', 'নিচ্ছে…')), g('goroutine 1', 'run', L('ch &lt;- "ping"', 'ch &lt;- "ping"'))]), ch({ cap: 0, hand: '"ping"' })]),
              step('send', L('Hand-off complete. Both goroutines continue. The goroutine has nothing left to do and exits.', 'হাতবদল শেষ। দুটো goroutine-ই চলতে থাকে। Goroutine-এর আর কাজ নেই, তাই বের হয়ে যায়।'), [lanes([g('main', 'run', L('msg = "ping"', 'msg = "ping"')), g('goroutine 1', 'done', L('returned', 'ফিরে গেছে'))]), ch({ cap: 0 })]),
              step('print', L('main prints the message. The channel both moved the data and made main wait for the worker.', 'main বার্তাটা print করে। Channel ডেটাও পাঠাল, আবার main-কে worker-এর জন্য অপেক্ষাও করাল।'), [lanes([g('main', 'run', L('printing', 'print করছে')), g('goroutine 1', 'done', '')]), ch({ cap: 0 }), out(['ping'], 1)], { tone: 'ok' }),
            ];
          },
        },
        {
          label: L('Buffered, close and range', 'Buffered, close আর range'),
          code: `
package main

import "fmt"

func main() {
	ch := make(chan int, 2) // {room for 2 values|২টা মানের জায়গা} @@mk
	go func() { @@go
		for i := 1; i <= 3; i++ {
			ch <- i // {blocks only when the buffer is full|buffer ভরা থাকলে তবেই আটকায়} @@send
		}
		close(ch) // {no more values will come|আর কোনো মান আসবে না} @@close
	}()
	for v := range ch { // {stops after close and drain|close আর খালি হলে থামে} @@range
		fmt.Println(v) @@print
	}
}`,
          build() {
            const s = [];
            const P = (state, text) => g('producer', state, text), M = (state, text) => g('main', state, text);
            const st = (line, en, bn, mst, mtx, pst, ptx, buf, lines, extra, closed) => s.push(step(line, L(en, bn), [lanes([M(mst, mtx), P(pst, ptx)]), ch({ cap: 2, buf, closed }), out(lines.slice(), extra && extra.fresh)], extra && extra.opts));
            st('mk', 'A buffered channel with capacity 2.', 'Capacity 2-এর একটা buffered channel।', 'run', L('make(chan int, 2)', 'make(chan int, 2)'), null, null, [], []);
            s[0].panels[0].items.pop();
            st('go', 'Start the producer. (This is one possible schedule; the real order can vary between runs.)', 'Producer শুরু। (এটা একটা সম্ভাব্য ক্রম; আসল ক্রম প্রতিবার আলাদা হতে পারে।)', 'run', L('heading to range', 'range-এর দিকে যাচ্ছে'), 'new', L('started', 'শুরু হলো'), [], []);
            st('send', 'Send 1: there is room, so it goes into the buffer without waiting.', '1 পাঠানো: জায়গা আছে, তাই অপেক্ষা ছাড়াই buffer-এ যায়।', 'run', '', 'run', L('ch &lt;- 1', 'ch &lt;- 1'), [1], []);
            st('send', 'Send 2: still room. The buffer is now full.', '2 পাঠানো: এখনো জায়গা আছে। এখন buffer ভরা।', 'run', '', 'run', L('ch &lt;- 2', 'ch &lt;- 2'), [1, 2], []);
            st('send', 'Send 3: the buffer is full, so the producer <b>blocks</b>.', '3 পাঠানো: buffer ভরা, তাই producer <b>আটকে</b> যায়।', 'run', '', 'block', L('ch &lt;- 3 (waiting for room)', 'ch &lt;- 3 (জায়গার অপেক্ষায়)'), [1, 2], [], { opts: { ask: { q: L('The buffer holds 2 values and is full. What happens on <code>ch &lt;- 3</code>?', 'Buffer-এ 2টা মান, ভরা। <code>ch &lt;- 3</code>-এ কী হবে?'), options: [L('The producer blocks until main receives', 'main না নেওয়া পর্যন্ত producer আটকে থাকে'), L('The oldest value is dropped', 'সবচেয়ে পুরনো মান ফেলে দেওয়া হয়'), L('It panics', 'Panic করে')], answer: 0, why: L('Channels never drop values. A full buffer makes the sender wait.', 'Channel কখনো মান ফেলে দেয় না। Buffer ভরা থাকলে sender অপেক্ষা করে।') } } });
            st('range', 'main receives 1, the oldest value (channels are FIFO). That frees a slot.', 'main নেয় 1, সবচেয়ে পুরনো মান (channel FIFO)। একটা জায়গা খালি হলো।', 'run', L('v = 1', 'v = 1'), 'block', L('waiting…', 'অপেক্ষায়…'), [2], []);
            st('print', 'Print 1. Meanwhile the producer can put 3 into the freed slot.', '1 print। এর মধ্যে producer খালি জায়গায় 3 রাখতে পারে।', 'run', '', 'run', L('ch &lt;- 3 done', 'ch &lt;- 3 হয়ে গেছে'), [2, 3], ['1'], { fresh: 1 });
            st('close', '<code>close(ch)</code>: the producer says "no more values". Values already in the buffer are still delivered.', '<code>close(ch)</code>: producer জানায় "আর মান আসবে না"। Buffer-এ যা আছে তা এখনো পৌঁছাবে।', 'run', '', 'done', L('closed ch and returned', 'ch বন্ধ করে ফিরে গেছে'), [2, 3], ['1'], null, true);
            st('range', 'Receive 2.', '2 নেওয়া।', 'run', L('v = 2', 'v = 2'), 'done', '', [3], ['1'], null, true);
            st('print', 'Print 2.', '2 print।', 'run', '', 'done', '', [3], ['1', '2'], { fresh: 1 }, true);
            st('range', 'Receive 3.', '3 নেওয়া।', 'run', L('v = 3', 'v = 3'), 'done', '', [], ['1', '2'], null, true);
            st('print', 'Print 3.', '3 print।', 'run', '', 'done', '', [], ['1', '2', '3'], { fresh: 1 }, true);
            st('range', 'The channel is closed <b>and</b> empty, so <code>range</code> ends. Without close(), main would block here forever.', 'Channel বন্ধ <b>এবং</b> খালি, তাই <code>range</code> শেষ। close() না থাকলে main এখানে চিরকাল আটকে থাকত।', 'done', L('loop finished', 'লুপ শেষ'), 'done', '', [], ['1', '2', '3'], { opts: { tone: 'ok' } }, true);
            return s;
          },
        },
        {
          label: L('Deadlock', 'Deadlock'),
          code: `
package main

func main() {
	ch := make(chan int) @@mk
	ch <- 1 // {no receiver exists anywhere|কোথাও কোনো receiver নেই} @@send
}`,
          build() {
            return [
              step('mk', L('An unbuffered channel and a single goroutine: main.', 'একটা unbuffered channel আর একটাই goroutine: main।'), [lanes([g('main', 'run', '')]), ch({ cap: 0 })]),
              step('send', L('main sends, so it waits for a receiver. There is no other goroutine that could ever receive.', 'main পাঠায়, তাই receiver-এর অপেক্ষা করে। আর কোনো goroutine নেই যে কখনো নিতে পারবে।'), [lanes([g('main', 'block', L('ch &lt;- 1 waiting forever', 'ch &lt;- 1 চিরকাল অপেক্ষায়'))]), ch({ cap: 0, hand: 1 })]),
              step('send', L('Every goroutine is blocked, so the runtime detects it and crashes with a clear message.', 'সব goroutine আটকে আছে, তাই runtime এটা ধরে একটা স্পষ্ট বার্তা দিয়ে ক্র্যাশ করে।'), [lanes([g('main', 'panic', L('deadlocked', 'deadlock'))]), ch({ cap: 0, hand: 1 }), out([{ v: 'fatal error: all goroutines are asleep - deadlock!', cls: 'bad' }, { v: 'goroutine 1 [chan send]:', cls: 'bad' }])], { tone: 'bad' }),
            ];
          },
        },
      ],
    },
    walk: [
      { at: 'go', ex: 0, code: 'go func() { ... }()', text: L('Starts a goroutine. The trailing () calls the function literal.', 'একটা goroutine শুরু করে। শেষের () function literal-কে call করে।') },
      { at: 'send', ex: 0, code: 'ch <- "ping"', text: L('Send. On an unbuffered channel it waits for a receiver.', 'পাঠানো। Unbuffered channel-এ receiver-এর অপেক্ষা করে।') },
      { at: 'recv', ex: 0, code: 'msg := <-ch', text: L('Receive. Waits until a value is available.', 'নেওয়া। একটা মান না আসা পর্যন্ত অপেক্ষা করে।') },
      { at: 'close', ex: 1, code: 'close(ch)', text: L('Only the sender closes. Receivers then get remaining values, then zero values with ok == false.', 'শুধু sender বন্ধ করে। এরপর receiver বাকি মানগুলো পায়, তারপর ok == false সহ zero value।') },
      { at: 'range', ex: 1, code: 'for v := range ch {', text: L('Receives until the channel is closed and drained.', 'Channel বন্ধ আর খালি না হওয়া পর্যন্ত নিতে থাকে।') },
    ],
    mistakes: [
      { title: L('main exits before goroutines finish', 'Goroutine শেষ হওয়ার আগেই main বের হয়ে যায়'), err: 'go fmt.Println("hi") // often prints nothing', fix: L('When main returns, the program ends and every goroutine is killed. Wait using a channel or a <code>sync.WaitGroup</code> (worker-pool lesson). Never use time.Sleep to wait.', 'main return করলে প্রোগ্রাম শেষ, সব goroutine মারা যায়। Channel বা <code>sync.WaitGroup</code> দিয়ে অপেক্ষা করুন (worker-pool লেসন)। অপেক্ষার জন্য কখনো time.Sleep ব্যবহার করবেন না।') },
      { title: L('Sending on a closed channel', 'বন্ধ channel-এ পাঠানো'), err: 'panic: send on closed channel', fix: L('Only the goroutine that sends should close, and only once, after its last send.', 'শুধু যে goroutine পাঠায় সে বন্ধ করবে, আর একবারই, শেষ send-এর পর।') },
      { title: L('Deadlock', 'Deadlock'), err: 'fatal error: all goroutines are asleep - deadlock!', fix: L('Every send needs a receiver that will eventually run, and every range over a channel needs a close.', 'প্রতিটা send-এর এমন একজন receiver লাগবে যে এক সময় চলবে, আর channel-এর উপর প্রতিটা range-এর জন্য একটা close লাগবে।') },
      { title: L('Leaking goroutines', 'Goroutine লিক'), err: '', fix: L('A goroutine blocked forever on a channel nobody reads is a memory leak. Give every goroutine a way to finish (close, context cancellation).', 'যে channel কেউ পড়ে না তাতে চিরকাল আটকে থাকা goroutine একটা মেমরি লিক। প্রতিটা goroutine-কে শেষ হওয়ার উপায় দিন (close, context cancellation)।') },
    ],
    perf: L([
      'Goroutines start with about 2 KB of stack and the Go scheduler multiplexes them onto a few OS threads (GOMAXPROCS, by default the number of CPU cores). Creating one costs far less than creating a thread.',
      'Channels involve locking internally. For a simple shared counter, <code>sync/atomic</code> or a mutex is faster. Use channels to hand over work and ownership, not as a general replacement for every lock.',
    ], [
      'Goroutine প্রায় 2 KB stack দিয়ে শুরু হয়, আর Go scheduler এগুলোকে কয়েকটা OS thread-এ ভাগ করে চালায় (GOMAXPROCS, default হিসেবে CPU core-এর সংখ্যা)। একটা বানানোর খরচ thread বানানোর চেয়ে অনেক কম।',
      'Channel-এর ভেতরে locking আছে। সাধারণ shared counter-এর জন্য <code>sync/atomic</code> বা mutex দ্রুত। কাজ আর মালিকানা হস্তান্তরে channel ব্যবহার করুন, প্রতিটা lock-এর বিকল্প হিসেবে না।',
    ]),
    quiz: [
      { q: L('On an unbuffered channel, when does a send complete?', 'Unbuffered channel-এ send কখন শেষ হয়?'), options: [L('When a receiver takes the value', 'যখন একজন receiver মানটা নেয়'), L('Immediately', 'সাথে সাথে'), L('When the channel is closed', 'যখন channel বন্ধ হয়')], answer: 0, why: L('Unbuffered send and receive happen together.', 'Unbuffered send আর receive একসাথে ঘটে।') },
      { q: L('<code>ch := make(chan int, 3)</code>. How many sends succeed with no receiver?', '<code>ch := make(chan int, 3)</code>। কোনো receiver ছাড়া কয়টা send সফল হবে?'), options: ['3', '0', '1'], answer: 0, why: L('The buffer holds 3; the fourth send blocks.', 'Buffer-এ 3টা ধরে; চতুর্থ send আটকে যায়।') },
      { q: L('Who should close a channel?', 'Channel কে বন্ধ করবে?'), options: [L('The sender, after its last send', 'Sender, শেষ send-এর পর'), L('The receiver, when done reading', 'Receiver, পড়া শেষে'), L('Whoever finishes first', 'যে আগে শেষ করে')], answer: 0, why: L('Closing tells receivers no more values are coming; only the sender knows that.', 'বন্ধ করা মানে receiver-দের জানানো যে আর মান আসবে না; এটা শুধু sender জানে।') },
    ],
    exercises: [
      { title: L('Split the sum', 'যোগফল ভাগ করুন'),
        task: L('Sum the numbers 1 to 1,000,000 using two goroutines: one sums the first half, one the second. Each sends its partial sum on a channel; main receives both and prints the total, 500000500000.', 'দুটো goroutine দিয়ে 1 থেকে 1,000,000 পর্যন্ত যোগ করুন: একটা প্রথম অর্ধেক, আরেকটা দ্বিতীয় অর্ধেক। প্রতিটা নিজের আংশিক যোগফল একটা channel-এ পাঠায়; main দুটো নিয়ে মোট print করে, 500000500000।'),
        hints: [L('Write <code>func sum(from, to int, out chan&lt;- int)</code>.', '<code>func sum(from, to int, out chan&lt;- int)</code> লিখুন।'), L('Receive twice: <code>a, b := &lt;-ch, &lt;-ch</code>.', 'দুবার নিন: <code>a, b := &lt;-ch, &lt;-ch</code>।')],
        solution: `package main

import "fmt"

func sum(from, to int, out chan<- int) {
	s := 0
	for i := from; i <= to; i++ {
		s += i
	}
	out <- s // {send the partial result|আংশিক ফল পাঠাও}
}

func main() {
	ch := make(chan int)
	go sum(1, 500000, ch)
	go sum(500001, 1000000, ch)
	a, b := <-ch, <-ch // {waits for both|দুটোর জন্যই অপেক্ষা}
	fmt.Println(a + b)
}` },
      { title: L('Ping-pong', 'পিং-পং'),
        task: L('Two goroutines pass a counter back and forth over two channels, incrementing it each time. Stop at 10 and print who hit 10.', 'দুটো goroutine দুটো channel দিয়ে একটা counter আদান-প্রদান করে, প্রতিবার বাড়িয়ে। 10-এ থামুন আর কে 10-এ পৌঁছাল print করুন।'),
        hints: [L('ping and pong channels; each player receives on one and sends on the other.', 'ping আর pong channel; প্রতিটা খেলোয়াড় একটা থেকে নেয়, আরেকটাতে পাঠায়।'), L('Use a done channel so main knows when to exit.', 'main কখন বের হবে জানতে একটা done channel ব্যবহার করুন।')],
        solution: `package main

import "fmt"

func player(name string, in <-chan int, out chan<- int, done chan<- string) {
	for n := range in {
		n++
		if n == 10 {
			done <- name
			return
		}
		out <- n
	}
}

func main() {
	ping, pong := make(chan int), make(chan int)
	done := make(chan string)
	go player("ping", ping, pong, done)
	go player("pong", pong, ping, done)
	ping <- 0 // {serve the ball|বল ছাড়ো}
	fmt.Println(<-done, "hit 10")
}` },
    ],
    takeaways: [
      L('<code>go f()</code> starts a goroutine; main does not wait for it.', '<code>go f()</code> একটা goroutine শুরু করে; main এর জন্য অপেক্ষা করে না।'),
      L('Unbuffered channels hand values over and synchronise; buffered channels decouple up to their capacity.', 'Unbuffered channel মান হাতবদল করে আর সমন্বয় করে; buffered channel তার capacity পর্যন্ত আলাদা রাখে।'),
      L('The sender closes; range over a channel ends after close.', 'Sender বন্ধ করে; close-এর পর channel-এর উপর range শেষ হয়।'),
      L('If every goroutine is blocked, the program deadlocks. Give each goroutine a way to finish.', 'সব goroutine আটকে গেলে প্রোগ্রাম deadlock হয়। প্রতিটা goroutine-কে শেষ হওয়ার উপায় দিন।'),
    ],
    links: [
      { t: 'A Tour of Go: Concurrency', url: 'https://go.dev/tour/concurrency/1' },
      { t: 'Effective Go: Concurrency', url: 'https://go.dev/doc/effective_go#concurrency' },
      { t: 'Go blog: Share Memory By Communicating', url: 'https://go.dev/blog/codelab-share' },
    ],
  });
})();
