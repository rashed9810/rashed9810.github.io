(function () {
  const { L, step, out } = GV;
  const stack = (items) => ({ type: 'frames', title: L('Call stack (top runs now)', 'Call stack (উপরেরটা এখন চলছে)'), items });

  GV.register({
    id: 'go-functions', track: 'go', phase: 'start', order: 4, minutes: 18,
    title: L('Functions and the call stack', 'Function আর call stack'),
    summary: L('Watch stack frames get pushed and popped, return two values at once, and follow recursion down and back up.', 'Stack frame push আর pop হতে দেখুন, একসাথে দুটো মান return করুন, আর recursion নিচে নেমে আবার উঠে আসা দেখুন।'),
    idea: L([
      'Every function call gets its own <b>stack frame</b>: a private notepad holding its parameters and local variables. Calling a function puts a new notepad on top of the pile. Returning tears that notepad off and hands the result to the one underneath. The pile is the <b>call stack</b>.',
      'Go functions can return several values. The most common pair you will write as a backend engineer is <code>(result, error)</code>. Parameters are always passed <b>by value</b>: the function gets copies, which is why changing a parameter never changes the caller\'s variable (pointers, in a later lesson, change that).',
    ], [
      'প্রতিটা function call-এর নিজস্ব একটা <b>stack frame</b> থাকে: একটা ব্যক্তিগত নোটপ্যাড, যেখানে তার parameter আর local variable থাকে। Function call করলে স্তূপের উপরে একটা নতুন নোটপ্যাড বসে। Return করলে সেই নোটপ্যাড ছিঁড়ে ফেলে ফলাফলটা নিচের জনকে দেওয়া হয়। এই স্তূপটাই <b>call stack</b>।',
      'Go function একাধিক মান return করতে পারে। Backend ইঞ্জিনিয়ার হিসেবে সবচেয়ে বেশি লিখবেন এই জোড়াটা: <code>(result, error)</code>। Parameter সবসময় <b>by value</b> যায়: function কপি পায়, তাই parameter বদলালে caller-এর variable বদলায় না (পরের লেসনের pointer এটা বদলে দেয়)।',
    ]),
    visual: {
      file: 'main.go',
      examples: [
        {
          label: L('Two return values', 'দুটো return value'),
          code: `
package main

import "fmt"

func divide(a, b int) (int, int) { @@fn
	q := a / b @@q
	r := a % b @@r
	return q, r // {return two values at once|একসাথে দুটো মান ফেরত} @@ret
}

func main() {
	q, r := divide(17, 5) @@call
	fmt.Println(q, r) @@print
}`,
          build() {
            const mainF = (q, r, cls) => ({ fn: 'main()', vars: [{ k: 'q', v: q, cls }, { k: 'r', v: r, cls }] });
            return [
              step('call', L('<code>main</code> starts with one frame. It is about to call <code>divide(17, 5)</code>.', '<code>main</code> একটা frame নিয়ে শুরু। এখন <code>divide(17, 5)</code> call করবে।'), [stack([mainF('?', '?')])]),
              step('fn', L('A new frame is <b>pushed</b>. The arguments 17 and 5 are <b>copied</b> into parameters a and b.', 'একটা নতুন frame <b>push</b> হলো। Argument 17 আর 5 parameter a আর b-তে <b>কপি</b> হয়।'), [stack([mainF('?', '?'), { fn: 'divide(a, b)', vars: [{ k: 'a', v: 17, cls: 'new' }, { k: 'b', v: 5, cls: 'new' }] }])]),
              step('q', L('<code>17 / 5</code> on integers gives 3. The remainder is dropped.', 'পূর্ণসংখ্যায় <code>17 / 5</code> = 3। ভাগশেষ বাদ যায়।'), [stack([mainF('?', '?'), { fn: 'divide(a, b)', vars: [{ k: 'a', v: 17 }, { k: 'b', v: 5 }, { k: 'q', v: 3, cls: 'hl' }] }])]),
              step('r', L('<code>%</code> gives the remainder: 2.', '<code>%</code> দেয় ভাগশেষ: 2।'), [stack([mainF('?', '?'), { fn: 'divide(a, b)', vars: [{ k: 'a', v: 17 }, { k: 'b', v: 5 }, { k: 'q', v: 3 }, { k: 'r', v: 2, cls: 'hl' }] }])], {
                ask: { q: L('When divide returns, what happens to its frame?', 'divide return করলে তার frame-এর কী হয়?'), options: [L('It is popped; its variables are gone', 'Pop হয়; তার variable-গুলো হারিয়ে যায়'), L('It stays until main ends', 'main শেষ না হওয়া পর্যন্ত থাকে'), L('It is copied into main', 'main-এ কপি হয়')], answer: 0, why: L('Only the returned values survive, copied into the caller.', 'শুধু return করা মানগুলো টিকে থাকে, caller-এ কপি হয়ে।') },
              }),
              step('ret', L('<code>return q, r</code> pops the frame and hands back two values.', '<code>return q, r</code> frame টা pop করে দুটো মান ফেরত দেয়।'), [stack([mainF(3, 2, 'hl new')])], { arrows: [] }),
              step('print', L('Back in main with both results. The divide frame no longer exists.', 'দুটো ফলাফল নিয়ে main-এ ফিরে এলাম। divide-এর frame আর নেই।'), [stack([mainF(3, 2)]), out(['3 2'], 1)], { tone: 'ok' }),
            ];
          },
        },
        {
          label: L('Recursion: factorial', 'Recursion: factorial'),
          inputs: [{ key: 'n', label: L('n', 'n'), type: 'int', def: 4, min: 1, max: 7 }],
          code: (inp) => `
package main

import "fmt"

func factorial(n int) int { @@fn
	if n <= 1 { // {base case stops the recursion|base case recursion থামায়} @@base
		return 1 @@ret1
	}
	return n * factorial(n-1) @@rec
}

func main() {
	fmt.Println(factorial(${inp.n})) @@call
}`,
          build({ n }) {
            const s = [];
            const frames = [{ fn: 'main()', vars: [] }];
            const snap = () => stack(GV.clone(frames));
            s.push(step('call', L(`main calls <code>factorial(${n})</code>.`, `main <code>factorial(${n})</code> call করে।`), [snap()]));
            for (let k = n; k >= 1; k--) {
              frames.push({ fn: `factorial(${k})`, vars: [{ k: 'n', v: k, cls: 'new' }] });
              s.push(step('fn', L(`Push a frame for <code>factorial(${k})</code>. Each frame has its <b>own</b> n.`, `<code>factorial(${k})</code>-এর জন্য frame push। প্রতিটা frame-এর <b>নিজস্ব</b> n আছে।`), [snap()]));
              frames[frames.length - 1].vars[0].cls = '';
              if (k > 1) {
                s.push(step('rec', L(`${k} is not ≤ 1, so it needs <code>factorial(${k - 1})</code> first. This frame waits.`, `${k} ≤ 1 না, তাই আগে <code>factorial(${k - 1})</code> লাগবে। এই frame অপেক্ষা করে।`), [snap()], k === 2 ? {} : {}));
              } else {
                s.push(step('base', L(`n is 1: the <b>base case</b>. Now there are ${n + 1} frames on the stack.`, `n = 1: <b>base case</b>। এখন stack-এ ${n + 1}টা frame।`), [snap()], {
                  ask: { q: L(`How many frames are on the stack right now, counting main?`, `main সহ এই মুহূর্তে stack-এ কয়টা frame?`), options: [String(n + 1), String(n), '2'], answer: 0, why: L(`One for main plus one for each call from ${n} down to 1.`, `main-এর একটা, আর ${n} থেকে 1 পর্যন্ত প্রতিটা call-এর একটা করে।`) },
                }));
              }
            }
            let acc = 1;
            frames.pop();
            s.push(step('ret1', L('<code>factorial(1)</code> returns 1 and its frame is popped.', '<code>factorial(1)</code> 1 return করে, frame pop হয়।'), [snap(), { type: 'text', cls: 'run', text: L('returned 1', 'ফেরত এলো 1') }]));
            for (let k = 2; k <= n; k++) {
              acc *= k;
              frames.pop();
              s.push(step('rec', L(`<code>factorial(${k})</code> finishes: ${k} × ${acc / k} = ${acc}. Pop.`, `<code>factorial(${k})</code> শেষ: ${k} × ${acc / k} = ${acc}। Pop।`), [snap(), { type: 'text', cls: 'run', text: L(`returned ${acc}`, `ফেরত এলো ${acc}`) }]));
            }
            s.push(step('call', L(`Back in main with ${acc}. The stack unwound in the reverse order it grew.`, `${acc} নিয়ে main-এ ফেরা। Stack যে ক্রমে বেড়েছিল তার উল্টো ক্রমে খুলে গেল।`), [snap(), out([String(acc)], 1)], { tone: 'ok' }));
            return s;
          },
        },
      ],
    },
    walk: [
      { at: 'fn', ex: 0, code: 'func divide(a, b int) (int, int)', text: L('Parameters that share a type can share it: <code>a, b int</code>. The result types go in parentheses.', 'একই type-এর parameter একসাথে লেখা যায়: <code>a, b int</code>। Result type বন্ধনীতে যায়।') },
      { at: 'ret', ex: 0, code: 'return q, r', text: L('Returns both values, in order.', 'দুটো মানই ক্রম অনুযায়ী ফেরত দেয়।') },
      { at: 'call', ex: 0, code: 'q, r := divide(17, 5)', text: L('You must receive every value. Ignore one with <code>_</code>: <code>q, _ := divide(17, 5)</code>.', 'প্রতিটা মান নিতে হবে। একটা বাদ দিতে <code>_</code>: <code>q, _ := divide(17, 5)</code>।') },
      { at: 'base', ex: 1, code: 'if n <= 1 {', text: L('Every recursive function needs a base case that does not call itself.', 'প্রতিটা recursive function-এ এমন একটা base case লাগে যেটা নিজেকে call করে না।') },
    ],
    mistakes: [
      { title: L('Receiving fewer values than returned', 'যত মান return হয় তার চেয়ে কম নেওয়া'), err: './main.go:12:7: assignment mismatch: 1 variable but divide returns 2 values', fix: L('Receive both, or discard one with <code>_</code>.', 'দুটোই নিন, অথবা একটা <code>_</code> দিয়ে বাদ দিন।') },
      { title: L('Recursion without a base case', 'Base case ছাড়া recursion'), err: 'runtime: goroutine stack exceeds 1000000000-byte limit\nfatal error: stack overflow', fix: L('Each call adds a frame. Without a stopping condition the stack grows until Go stops the program.', 'প্রতিটা call একটা frame যোগ করে। থামার শর্ত না থাকলে stack বাড়তেই থাকে, তারপর Go প্রোগ্রাম থামিয়ে দেয়।') },
      { title: L('Expecting a parameter change to reach the caller', 'Parameter বদলালে caller-এ পৌঁছাবে ভাবা'), err: '', fix: L('Parameters are copies. Return the new value, or pass a pointer (next lesson).', 'Parameter হলো কপি। নতুন মান return করুন, অথবা pointer পাঠান (পরের লেসন)।') },
    ],
    perf: L([
      'Go stacks start small (a few KB) and grow automatically, so deep recursion is possible but not free. For simple loops like factorial or Fibonacci, an iterative version is faster and uses constant memory.',
      'Small functions are often <b>inlined</b> by the compiler: the call disappears and the body is pasted in. Write clear small functions; the compiler takes care of the cost.',
    ], [
      'Go-র stack ছোট (কয়েক KB) দিয়ে শুরু হয়, দরকারে নিজে থেকে বাড়ে। তাই গভীর recursion সম্ভব, তবে খরচ আছে। factorial বা Fibonacci-র মতো সহজ কাজে loop দিয়ে লেখা দ্রুত আর স্থির মেমরি নেয়।',
      'Compiler প্রায়ই ছোট function <b>inline</b> করে: call-টা উঠে গিয়ে body সরাসরি বসে যায়। পরিষ্কার ছোট function লিখুন; খরচের দিকটা compiler দেখবে।',
    ]),
    quiz: [
      { q: L('Where do a function\'s local variables live while it runs?', 'Function চলার সময় তার local variable কোথায় থাকে?'), options: [L('In its own stack frame', 'তার নিজস্ব stack frame-এ'), L('In the caller\'s frame', 'Caller-এর frame-এ'), L('In a global table', 'একটা global টেবিলে')], answer: 0, why: L('Each call gets a fresh frame, which is why recursive calls do not overwrite each other\'s n.', 'প্রতিটা call নতুন frame পায়, তাই recursive call-গুলো একে অপরের n মুছে দেয় না।') },
      { q: L('What is the idiomatic return type for something that can fail?', 'যে কাজ fail করতে পারে তার জন্য প্রচলিত return type কী?'), options: ['(T, error)', 'T or panic', '(bool, T)'], answer: 0, why: L('Return the value and an error; the caller checks <code>if err != nil</code>.', 'মান আর একটা error ফেরত দিন; caller <code>if err != nil</code> দিয়ে যাচাই করে।') },
      { q: L('<code>func f(x int) { x = 10 }</code>. After <code>a := 1; f(a)</code>, a is…', '<code>func f(x int) { x = 10 }</code>। <code>a := 1; f(a)</code>-এর পর a…'), options: ['1', '10', '0'], answer: 0, why: L('x was a copy of a.', 'x ছিল a-এর কপি।') },
    ],
    exercises: [
      { title: L('minMax', 'minMax'),
        task: L('Write <code>func minMax(nums []int) (int, int)</code> that returns the smallest and largest numbers. Test it with <code>[]int{4, 9, 1, 7}</code>. Assume the slice is not empty.', '<code>func minMax(nums []int) (int, int)</code> লিখুন যেটা সবচেয়ে ছোট আর বড় সংখ্যা ফেরত দেয়। <code>[]int{4, 9, 1, 7}</code> দিয়ে পরীক্ষা করুন। ধরে নিন slice খালি নয়।'),
        hints: [L('Start both min and max at <code>nums[0]</code>.', 'min আর max দুটোই <code>nums[0]</code> দিয়ে শুরু করুন।'), L('<code>for _, n := range nums</code> visits every value.', '<code>for _, n := range nums</code> প্রতিটা মান দেখে।')],
        solution: `package main

import "fmt"

func minMax(nums []int) (int, int) {
	lo, hi := nums[0], nums[0]
	for _, n := range nums {
		if n < lo {
			lo = n
		}
		if n > hi {
			hi = n
		}
	}
	return lo, hi
}

func main() {
	lo, hi := minMax([]int{4, 9, 1, 7})
	fmt.Println(lo, hi) // {1 9|1 9}
}` },
      { title: L('Fibonacci two ways', 'দুইভাবে Fibonacci'),
        task: L('Write a recursive <code>fib(n)</code> and an iterative <code>fibLoop(n)</code>. Try both with n = 40. Which one is noticeably slower, and why?', 'একটা recursive <code>fib(n)</code> আর একটা loop দিয়ে <code>fibLoop(n)</code> লিখুন। n = 40 দিয়ে দুটোই চালান। কোনটা স্পষ্টতই ধীর, আর কেন?'),
        hints: [L('Recursive fib calls fib(n-1) and fib(n-2), so the same values are computed again and again.', 'Recursive fib, fib(n-1) আর fib(n-2) দুটোই call করে, তাই একই মান বারবার হিসাব হয়।'), L('The loop only needs two variables: a, b = b, a+b.', 'Loop-এ শুধু দুটো variable লাগে: a, b = b, a+b।')],
        solution: `package main

import "fmt"

func fib(n int) int {
	if n < 2 {
		return n
	}
	return fib(n-1) + fib(n-2) // {exponential: repeats work|exponential: একই কাজ বারবার}
}

func fibLoop(n int) int {
	a, b := 0, 1
	for i := 0; i < n; i++ {
		a, b = b, a+b
	}
	return a
}

func main() {
	fmt.Println(fibLoop(40)) // {instant|সাথে সাথে}
	fmt.Println(fib(40))     // {takes a while|সময় লাগে}
}` },
    ],
    takeaways: [
      L('Each call pushes a frame with its own copies of parameters; return pops it.', 'প্রতিটা call নিজের parameter কপিসহ একটা frame push করে; return সেটা pop করে।'),
      L('Multiple return values are normal. <code>(T, error)</code> is the backend workhorse.', 'একাধিক return value স্বাভাবিক। <code>(T, error)</code> backend-এর প্রধান হাতিয়ার।'),
      L('Use <code>_</code> to discard a value you do not need.', 'যে মান লাগবে না সেটা <code>_</code> দিয়ে বাদ দিন।'),
      L('Recursion needs a base case. Prefer loops when recursion repeats work.', 'Recursion-এ base case লাগবে। Recursion একই কাজ বারবার করলে loop ভালো।'),
    ],
    links: [
      { t: 'A Tour of Go: Functions', url: 'https://go.dev/tour/basics/4' },
      { t: 'Effective Go: Multiple return values', url: 'https://go.dev/doc/effective_go#multiple-returns' },
      { t: 'Go spec: Function declarations', url: 'https://go.dev/ref/spec#Function_declarations' },
    ],
  });
})();
