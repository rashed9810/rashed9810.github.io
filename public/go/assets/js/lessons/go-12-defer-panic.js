(function () {
  const { L, step, out } = GV;
  const defers = (items, title) => ({ type: 'stack', title: title || L('Deferred calls (last in, first out)', 'Defer করা call (শেষে ঢুকে আগে বের হয়)'), items });
  const stack = (items) => ({ type: 'frames', title: L('Call stack', 'Call stack'), items });

  GV.register({
    id: 'go-defer-panic', track: 'go', phase: 'types', order: 4, minutes: 16,
    title: L('Defer, panic and recover', 'Defer, panic আর recover'),
    summary: L('defer schedules cleanup that runs last-in-first-out when a function returns. See a panic unwind the stack and recover catch it.', 'defer এমন cleanup ঠিক করে রাখে যেটা function return করলে শেষে-ঢোকা-আগে-বের হিসেবে চলে। দেখুন panic কীভাবে stack খুলে দেয় আর recover সেটা ধরে।'),
    idea: L([
      '<code>defer f()</code> means "run f when this function returns, no matter how it returns". It is how Go guarantees cleanup: <code>defer file.Close()</code>, <code>defer mu.Unlock()</code>, <code>defer cancel()</code>. You write the cleanup right next to the setup, so you cannot forget it.',
      'Deferred calls pile up like plates: the last plate you put down is the first you pick up (<b>LIFO</b>). One subtle rule: the <b>arguments</b> of a deferred call are evaluated when the defer line runs, not later.',
      'A <b>panic</b> is Go\'s emergency stop for bugs: index out of range, nil pointer, divide by zero. It unwinds the stack, running each function\'s deferred calls on the way. A deferred function that calls <b>recover()</b> can catch the panic and turn it into an ordinary error. HTTP servers use this so one bad request does not crash the whole server.',
    ], [
      '<code>defer f()</code> মানে "এই function যেভাবেই return করুক, তখন f চালাও"। Go এভাবেই cleanup নিশ্চিত করে: <code>defer file.Close()</code>, <code>defer mu.Unlock()</code>, <code>defer cancel()</code>। Setup-এর ঠিক পাশেই cleanup লেখা হয়, তাই ভুলে যাওয়ার উপায় নেই।',
      'Defer করা call গুলো থালার মতো স্তূপ হয়: শেষে রাখা থালাটা আগে তোলা হয় (<b>LIFO</b>)। একটা সূক্ষ্ম নিয়ম: defer করা call-এর <b>argument</b> হিসাব হয় defer লাইনটা চলার সময়েই, পরে না।',
      '<b>Panic</b> হলো bug-এর জন্য Go-র জরুরি ব্রেক: index out of range, nil pointer, শূন্য দিয়ে ভাগ। এটা stack খুলতে থাকে, পথে প্রতিটা function-এর defer করা call চালায়। যে deferred function <b>recover()</b> call করে সে panic ধরে সাধারণ error বানাতে পারে। HTTP সার্ভার এটা ব্যবহার করে, যাতে একটা খারাপ request পুরো সার্ভার ক্র্যাশ না করায়।',
    ]),
    visual: {
      file: 'main.go',
      examples: [
        {
          label: L('defer runs last in, first out', 'defer শেষে-ঢোকা-আগে-বের ক্রমে চলে'),
          code: `
package main

import "fmt"

func main() {
	defer fmt.Println("first defer") @@d1
	defer fmt.Println("second defer") @@d2
	fmt.Println("working...") @@work
} @@end`,
          build() {
            const a = { v: '"first defer"' }, b = { v: '"second defer"' };
            return [
              step('d1', L('The call is not run now. It is pushed onto main\'s defer stack.', 'Call টা এখন চলে না। main-এর defer stack-এ push হয়।'), [defers([Object.assign({ cls: 'new' }, a)]), out([])]),
              step('d2', L('A second deferred call goes on top.', 'দ্বিতীয় deferred call উপরে বসে।'), [defers([a, Object.assign({ cls: 'new' }, b)]), out([])]),
              step('work', L('Normal code runs first.', 'আগে সাধারণ কোড চলে।'), [defers([a, b]), out(['working...'], 1)], {
                ask: { q: L('main is about to return. Which deferred line prints first?', 'main এখন return করবে। কোন deferred লাইন আগে print হবে?'), options: ['second defer', 'first defer'], answer: 0, why: L('Deferred calls run in reverse order: last in, first out.', 'Deferred call উল্টো ক্রমে চলে: শেষে ঢোকে, আগে বের হয়।') },
              }),
              step('end', L('main returns, so the top deferred call runs.', 'main return করছে, তাই উপরের deferred call চলে।'), [defers([a, Object.assign({ cls: 'hl' }, b)]), out(['working...', 'second defer'], 1)]),
              step('end', L('Then the next one down.', 'তারপর তার নিচেরটা।'), [defers([Object.assign({ cls: 'hl' }, a)]), out(['working...', 'second defer', 'first defer'], 1)]),
              step('end', L('The defer stack is empty and the function is really finished.', 'Defer stack খালি, function সত্যিই শেষ।'), [defers([]), out(['working...', 'second defer', 'first defer'])], { tone: 'ok' }),
            ];
          },
        },
        {
          label: L('Arguments are evaluated immediately', 'Argument সাথে সাথে হিসাব হয়'),
          code: `
package main

import "fmt"

func main() {
	x := 1 @@x
	defer fmt.Println("deferred:", x) // {x is read NOW (1)|x এখনই পড়া হয় (1)} @@d
	x = 2 @@set
	fmt.Println("now:", x) @@p
} @@end`,
          build() {
            const xb = (v, cls) => ({ type: 'boxes', items: [{ name: 'x', type: 'int', val: v, cls }] });
            return [
              step('x', L('x is 1.', 'x = 1।'), [xb(1, 'hl new'), defers([])]),
              step('d', L('The defer line runs: Go evaluates the arguments right now and stores them with the call. The saved argument is 1.', 'Defer লাইন চলে: Go এখনই argument হিসাব করে call-এর সাথে রেখে দেয়। রাখা argument হলো 1।'), [xb(1), defers([{ v: 'Println("deferred:", 1)', cls: 'new' }])]),
              step('set', L('x changes to 2. The saved argument does not.', 'x বদলে 2 হয়। রাখা argument বদলায় না।'), [xb(2, 'hl'), defers([{ v: 'Println("deferred:", 1)' }])], {
                ask: { q: L('What will the deferred line print?', 'Deferred লাইন কী print করবে?'), options: ['deferred: 1', 'deferred: 2'], answer: 0, why: L('Arguments were captured when defer ran. To see the latest x, defer a closure: <code>defer func() { fmt.Println(x) }()</code>.', 'Defer চলার সময়েই argument ধরা হয়েছিল। সর্বশেষ x দেখতে closure defer করুন: <code>defer func() { fmt.Println(x) }()</code>।') },
              }),
              step('p', L('Normal print shows the current x.', 'সাধারণ print বর্তমান x দেখায়।'), [xb(2), defers([{ v: 'Println("deferred:", 1)' }]), out(['now: 2'], 1)]),
              step('end', L('On return, the deferred call prints the value captured earlier.', 'Return-এর সময় deferred call আগে ধরা মানটা print করে।'), [xb(2), defers([{ v: 'Println("deferred:", 1)', cls: 'hl' }]), out(['now: 2', 'deferred: 1'], 1)], { tone: 'ok' }),
            ];
          },
        },
        {
          label: L('panic, then recover', 'panic, তারপর recover'),
          code: `
package main

import "fmt"

func safeDivide(a, b int) (result int, err error) { @@fn
	defer func() { @@def
		if r := recover(); r != nil { // {catch the panic|panic ধরো} @@rec
			err = fmt.Errorf("recovered: %v", r) @@seterr
		}
	}()
	return a / b, nil // {b is 0: runtime panic|b = 0: runtime panic} @@div
}

func main() {
	res, err := safeDivide(10, 0) @@call
	fmt.Println(res, err) @@print
}`,
          build() {
            const mainF = (vars) => ({ fn: 'main()', vars: vars || [{ k: 'res', v: '?' }, { k: 'err', v: '?' }] });
            const sd = (vars, cls) => ({ fn: 'safeDivide(10, 0)', vars, cls });
            const v0 = [{ k: 'a', v: 10 }, { k: 'b', v: 0 }, { k: 'result', v: 0 }, { k: 'err', v: 'nil' }];
            return [
              step('call', L('main calls safeDivide(10, 0). Named results start at zero values.', 'main safeDivide(10, 0) call করে। নাম দেওয়া result zero value দিয়ে শুরু।'), [stack([mainF(), sd(v0)])]),
              step('def', L('A deferred closure is registered. It will run on any exit, including a panic.', 'একটা deferred closure নিবন্ধিত হয়। যেকোনোভাবে বের হলেই চলবে, panic-সহ।'), [stack([mainF(), sd(v0)]), defers([{ v: 'func(){ recover… }', cls: 'new' }], L('safeDivide defers', 'safeDivide-এর defer'))]),
              step('div', L('<code>10 / 0</code> on integers panics. Normal execution stops; Go starts unwinding the stack.', 'পূর্ণসংখ্যায় <code>10 / 0</code> panic করে। স্বাভাবিক চলা থামে; Go stack খুলতে শুরু করে।'), [stack([mainF(), sd(v0, 'bad')]), defers([{ v: 'func(){ recover… }' }], L('safeDivide defers', 'safeDivide-এর defer')), { type: 'text', cls: 'bad', text: L('panic: runtime error: integer divide by zero', 'panic: runtime error: integer divide by zero') }], { tone: 'bad' }),
              step('rec', L('While unwinding, the deferred closure runs. <code>recover()</code> returns the panic value and stops the panic.', 'খোলার সময় deferred closure চলে। <code>recover()</code> panic-এর মান ফেরত দেয় আর panic থামিয়ে দেয়।'), [stack([mainF(), sd(v0)]), defers([{ v: 'func(){ recover… }', cls: 'hl' }], L('safeDivide defers', 'safeDivide-এর defer'))], {
                ask: { q: L('After recover, does the program crash?', 'recover-এর পর প্রোগ্রাম কি ক্র্যাশ করবে?'), options: [L('No, safeDivide returns normally with an error', 'না, safeDivide error নিয়ে স্বাভাবিকভাবে return করে'), L('Yes, panics always crash', 'হ্যাঁ, panic সবসময় ক্র্যাশ করায়')], answer: 0, why: L('recover inside a deferred function turns the panic into a normal return.', 'Deferred function-এর ভেতরে recover, panic-কে স্বাভাবিক return-এ পরিণত করে।') },
              }),
              step('seterr', L('Because the result is <b>named</b>, the closure can set err. That value is what the caller receives.', 'Result <b>নাম দেওয়া</b> বলে closure, err সেট করতে পারে। caller ঠিক এই মানটাই পায়।'), [stack([mainF(), sd([{ k: 'a', v: 10 }, { k: 'b', v: 0 }, { k: 'result', v: 0 }, { k: 'err', v: 'recovered: …', cls: 'hl' }])]), defers([], L('safeDivide defers', 'safeDivide-এর defer'))]),
              step('print', L('main gets 0 and an error instead of a crash.', 'main ক্র্যাশের বদলে 0 আর একটা error পায়।'), [stack([mainF([{ k: 'res', v: 0 }, { k: 'err', v: 'recovered: …', cls: 'hl' }])]), out(['0 recovered: runtime error: integer divide by zero'], 1)], { tone: 'ok' }),
            ];
          },
        },
      ],
    },
    walk: [
      { at: 'd1', ex: 0, code: 'defer fmt.Println(...)', text: L('Schedules the call for when main returns.', 'main return করার সময়ের জন্য call ঠিক করে রাখে।') },
      { at: 'd', ex: 1, code: 'defer fmt.Println("deferred:", x)', text: L('Arguments are copied at the defer line.', 'Defer লাইনেই argument কপি হয়।') },
      { at: 'rec', ex: 2, code: 'if r := recover(); r != nil {', text: L('recover only works directly inside a deferred function.', 'recover শুধু deferred function-এর ভেতরে সরাসরি কাজ করে।') },
      { at: 'fn', ex: 2, code: '(result int, err error)', text: L('Named results let a deferred closure change what is returned.', 'নাম দেওয়া result থাকলে deferred closure ফেরত মান বদলাতে পারে।') },
    ],
    mistakes: [
      { title: L('defer inside a loop', 'লুপের ভেতরে defer'), err: 'for _, name := range files {\n\tf, _ := os.Open(name)\n\tdefer f.Close() // all files stay open until the function returns\n}', fix: L('Deferred calls wait for the <b>function</b> to end, not the loop iteration. Move the body into a helper function, or close explicitly.', 'Deferred call <b>function</b> শেষ হওয়ার অপেক্ষা করে, লুপের ঘুরতি না। Body একটা সাহায্যকারী function-এ সরান, অথবা নিজে close করুন।') },
      { title: L('Expecting defer to see later values', 'Defer পরের মান দেখবে আশা করা'), err: '', fix: L('Arguments are evaluated at the defer statement. Use a closure if you need the final value.', 'Argument defer statement-এই হিসাব হয়। শেষ মান লাগলে closure ব্যবহার করুন।') },
      { title: L('Calling recover outside a deferred function', 'Deferred function-এর বাইরে recover'), err: '', fix: L('recover() returns nil unless it is called directly by a deferred function during a panic.', 'Panic চলাকালীন deferred function সরাসরি call না করলে recover() nil ফেরত দেয়।') },
      { title: L('Using panic as an exception', 'Panic-কে exception হিসেবে ব্যবহার'), err: '', fix: L('Return errors for expected failures. Reserve panic for bugs and truly impossible states.', 'প্রত্যাশিত ব্যর্থতায় error return করুন। Panic রাখুন bug আর সত্যিই অসম্ভব অবস্থার জন্য।') },
    ],
    quiz: [
      { q: L('Three defers A, B, C in that order. In what order do they run?', 'তিনটা defer A, B, C এই ক্রমে। কোন ক্রমে চলবে?'), options: ['C, B, A', 'A, B, C', L('random', 'এলোমেলো')], answer: 0, why: L('LIFO, like a stack of plates.', 'LIFO, থালার স্তূপের মতো।') },
      { q: L('Do deferred calls run when the function panics?', 'Function panic করলে কি deferred call চলে?'), options: [L('Yes, during unwinding', 'হ্যাঁ, খোলার সময়'), L('No', 'না')], answer: 0, why: L('That is what makes defer reliable for unlocking and closing.', 'এজন্যই unlock আর close-এর জন্য defer নির্ভরযোগ্য।') },
      { q: L('Where must recover() be called to stop a panic?', 'Panic থামাতে recover() কোথায় call করতে হবে?'), options: [L('Directly inside a deferred function', 'সরাসরি একটা deferred function-এর ভেতরে'), L('Anywhere in main', 'main-এর যেকোনো জায়গায়'), L('Before the panic happens', 'Panic হওয়ার আগে')], answer: 0, why: L('Only a deferred call runs during unwinding.', 'খোলার সময় শুধু deferred call-ই চলে।') },
    ],
    exercises: [
      { title: L('Time a function', 'Function-এর সময় মাপুন'),
        task: L('Write <code>func timer(name string) func()</code> that records the start time and returns a function that prints how long has passed. Use it as <code>defer timer("work")()</code> at the top of a function that sleeps 200 ms.', '<code>func timer(name string) func()</code> লিখুন, যেটা শুরুর সময় মনে রেখে একটা function ফেরত দেয় যেটা কত সময় গেছে print করে। 200 ms ঘুমায় এমন function-এর শুরুতে <code>defer timer("work")()</code> হিসেবে ব্যবহার করুন।'),
        hints: [L('<code>timer("work")</code> runs immediately (arguments are evaluated at the defer line); only the returned function is deferred.', '<code>timer("work")</code> সাথে সাথে চলে (argument defer লাইনেই হিসাব হয়); শুধু ফেরত আসা function টা defer হয়।'), L('<code>time.Since(start)</code> gives the elapsed duration.', '<code>time.Since(start)</code> কত সময় গেছে দেয়।')],
        solution: `package main

import (
	"fmt"
	"time"
)

func timer(name string) func() {
	start := time.Now()
	return func() {
		fmt.Printf("%s took %v\\n", name, time.Since(start).Round(time.Millisecond))
	}
}

func work() {
	defer timer("work")() // {timer runs now, the closure runs at return|timer এখন চলে, closure চলে return-এ}
	time.Sleep(200 * time.Millisecond)
}

func main() {
	work()
}` },
      { title: L('Protect a handler', 'Handler সুরক্ষা'),
        task: L('Write <code>func safely(f func()) (err error)</code> that runs f and converts any panic into an error. Test it with a function that indexes past the end of a slice.', '<code>func safely(f func()) (err error)</code> লিখুন যেটা f চালায় আর যেকোনো panic-কে error-এ রূপান্তর করে। এমন একটা function দিয়ে পরীক্ষা করুন যেটা slice-এর শেষের বাইরে index করে।'),
        hints: [L('Same shape as safeDivide: named error result plus a deferred recover.', 'safeDivide-এর মতোই: নাম দেওয়া error result আর deferred recover।'), L('net/http uses this exact idea so one panicking handler does not kill the server.', 'net/http ঠিক এই ধারণা ব্যবহার করে, যাতে একটা handler panic করলে পুরো সার্ভার না মরে।')],
        solution: `package main

import "fmt"

func safely(f func()) (err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("panic: %v", r)
		}
	}()
	f()
	return nil
}

func main() {
	err := safely(func() {
		s := []int{1, 2, 3}
		i := 5
		fmt.Println(s[i]) // {index out of range|index out of range}
	})
	fmt.Println("still running:", err)
}` },
    ],
    takeaways: [
      L('defer schedules cleanup next to setup; deferred calls run LIFO on every exit.', 'defer setup-এর পাশেই cleanup ঠিক করে; প্রতিটা প্রস্থানে deferred call LIFO ক্রমে চলে।'),
      L('Deferred arguments are evaluated immediately; use a closure for later values.', 'Deferred argument সাথে সাথে হিসাব হয়; পরের মানের জন্য closure ব্যবহার করুন।'),
      L('panic unwinds the stack running defers; recover in a deferred function stops it.', 'panic defer চালাতে চালাতে stack খোলে; deferred function-এ recover সেটা থামায়।'),
      L('Use errors for expected failures and panic only for bugs.', 'প্রত্যাশিত ব্যর্থতায় error, panic শুধু bug-এর জন্য।'),
    ],
    links: [
      { t: 'Go blog: Defer, Panic, and Recover', url: 'https://go.dev/blog/defer-panic-and-recover' },
      { t: 'Effective Go: Defer', url: 'https://go.dev/doc/effective_go#defer' },
      { t: 'Go spec: Handling panics', url: 'https://go.dev/ref/spec#Handling_panics' },
    ],
  });
})();
