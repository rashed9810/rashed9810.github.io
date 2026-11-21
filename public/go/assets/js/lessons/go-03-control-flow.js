(function () {
  const { L, step, out } = GV;
  const strip = (n, cur, doneTo) => ({ type: 'array', title: L('Loop counter i', 'লুপ কাউন্টার i'), idx: false,
    cells: Array.from({ length: n }, (_, k) => ({ v: k + 1, cls: k + 1 === cur ? 'cur' : k + 1 <= doneTo ? 'ok' : '' })) });

  GV.register({
    id: 'go-control-flow', track: 'go', phase: 'start', order: 3, minutes: 15,
    title: L('Control flow: for, if and switch', 'কন্ট্রোল ফ্লো: for, if আর switch'),
    summary: L('Go has one loop keyword, for, used three ways. switch picks the first matching case and never falls through.', 'Go-তে লুপের জন্য একটাই keyword, for, তিনভাবে ব্যবহার হয়। switch প্রথম মিলে যাওয়া case বেছে নেয়, নিচে গড়িয়ে পড়ে না।'),
    idea: L([
      'Go keeps control flow small on purpose. There is no <code>while</code> and no <code>do</code>: <code>for</code> covers all of them. <code>for i := 0; i &lt; n; i++</code> is the classic loop, <code>for cond { }</code> is a while loop, and <code>for { }</code> loops forever until you <code>break</code> or <code>return</code>.',
      'Think of <code>switch</code> as a receptionist checking a list from the top. The first rule that matches decides where you go, and checking stops there. Unlike C or JavaScript there is no <code>break</code> to forget, because Go cases do not fall into the next one.',
      'Conditions need no parentheses, but braces are always required, even for one line.',
    ], [
      'Go ইচ্ছা করেই control flow ছোট রেখেছে। <code>while</code> বা <code>do</code> নেই: সবকিছুর জন্য <code>for</code>। <code>for i := 0; i &lt; n; i++</code> হলো চেনা লুপ, <code>for cond { }</code> হলো while লুপ, আর <code>for { }</code> অনন্তকাল চলে যতক্ষণ না <code>break</code> বা <code>return</code> হয়।',
      '<code>switch</code>-কে ভাবুন একজন রিসেপশনিস্টের মতো, যিনি উপর থেকে একটা তালিকা মিলিয়ে দেখছেন। প্রথম যে নিয়ম মেলে সেটাই ঠিক করে আপনি কোথায় যাবেন, আর সেখানেই দেখা থামে। C বা JavaScript-এর মতো <code>break</code> ভুলে যাওয়ার ভয় নেই, কারণ Go-র case পরের case-এ গড়িয়ে পড়ে না।',
      'শর্তে বন্ধনী লাগে না, কিন্তু এক লাইনের জন্যও brace সবসময় লাগবে।',
    ]),
    visual: {
      file: 'main.go',
      legend: [{ cls: 'cur', label: L('current i', 'বর্তমান i') }, { cls: 'ok', label: L('already handled', 'আগেই হয়ে গেছে') }],
      examples: [
        {
          label: L('FizzBuzz with a tagless switch', 'Tagless switch দিয়ে FizzBuzz'),
          inputs: [{ key: 'n', label: L('Count up to n', 'n পর্যন্ত গুনুন'), type: 'int', def: 15, min: 1, max: 20 }],
          code: (inp) => `
package main

import "fmt"

func main() {
	for i := 1; i <= ${inp.n}; i++ { @@for
		switch { // {checks cases top to bottom|উপর থেকে নিচে case মেলায়} @@sw
		case i%15 == 0: @@c15
			fmt.Println("FizzBuzz") @@p15
		case i%3 == 0: @@c3
			fmt.Println("Fizz") @@p3
		case i%5 == 0: @@c5
			fmt.Println("Buzz") @@p5
		default: @@def
			fmt.Println(i) @@pd
		}
	}
}`,
          build({ n }) {
            const s = [], lines = [];
            const vars = (i) => ({ type: 'boxes', items: [{ id: 'i', name: 'i', type: 'int', val: i, cls: 'hl' }] });
            for (let i = 1; i <= n; i++) {
              s.push(step('for', L(`Loop: <code>i = ${i}</code>. Is <code>${i} &lt;= ${n}</code>? Yes, so the body runs.`, `লুপ: <code>i = ${i}</code>। <code>${i} &lt;= ${n}</code>? হ্যাঁ, তাই body চলবে।`), [strip(n, i, i - 1), vars(i), out(lines.slice())]));
              const checks = [['c15', 15, 'FizzBuzz', 'p15'], ['c3', 3, 'Fizz', 'p3'], ['c5', 5, 'Buzz', 'p5']];
              let matched = false;
              for (const [mk, d, word, pk] of checks) {
                const hit = i % d === 0;
                const extra = i === 15 && mk === 'c15' ? { ask: { q: L('i is 15. It is divisible by 3, 5 and 15. Which case runs?', 'i = 15। এটা 3, 5 আর 15 সবকটা দিয়ে বিভাজ্য। কোন case চলবে?'), options: ['FizzBuzz', 'Fizz', L('Fizz, then Buzz, then FizzBuzz', 'Fizz, তারপর Buzz, তারপর FizzBuzz')], answer: 0, why: L('switch runs only the first case that matches. That is why the 15 check must come first.', 'switch শুধু প্রথম মিলে যাওয়া case চালায়। এজন্যই 15-এর check সবার আগে রাখতে হয়।') } } : {};
                s.push(step(mk, L(`<code>${i} % ${d}</code> is ${i % d}. ${hit ? 'Match.' : 'No match, check the next case.'}`, `<code>${i} % ${d}</code> = ${i % d}। ${hit ? 'মিলে গেছে।' : 'মেলেনি, পরের case দেখি।'}`), [strip(n, i, i - 1), vars(i), out(lines.slice())], extra));
                if (hit) {
                  lines.push(word);
                  s.push(step(pk, L(`Print <code>${word}</code>. The switch ends here; no other case is checked.`, `<code>${word}</code> print। switch এখানেই শেষ, আর কোনো case দেখা হয় না।`), [strip(n, i, i), vars(i), out(lines.slice(), 1)]));
                  matched = true;
                  break;
                }
              }
              if (!matched) {
                lines.push(String(i));
                s.push(step('pd', L(`No case matched, so <code>default</code> prints ${i}.`, `কোনো case মেলেনি, তাই <code>default</code> ${i} print করে।`), [strip(n, i, i), vars(i), out(lines.slice(), 1)]));
              }
            }
            s.push(step('for', L(`<code>i</code> becomes ${n + 1}. <code>${n + 1} &lt;= ${n}</code> is false, so the loop stops.`, `<code>i</code> হলো ${n + 1}। <code>${n + 1} &lt;= ${n}</code> মিথ্যা, তাই লুপ থামে।`), [strip(n, -1, n), { type: 'boxes', items: [{ name: 'i', type: 'int', val: n + 1, cls: 'dim' }] }, out(lines.slice())], { tone: 'ok' }));
            return s;
          },
        },
        {
          label: L('for as a while loop (Collatz)', 'while লুপ হিসেবে for (Collatz)'),
          inputs: [{ key: 'n', label: L('Start number', 'শুরুর সংখ্যা'), type: 'int', def: 6, min: 2, max: 40 }],
          code: (inp) => `
package main

import "fmt"

func main() {
	n := ${inp.n} @@init
	steps := 0
	for n != 1 { // {Go's "while" loop|Go-র "while" লুপ} @@cond
		if n%2 == 0 { @@if
			n /= 2 @@half
		} else {
			n = 3*n + 1 @@triple
		}
		steps++ @@inc
	}
	fmt.Println("steps:", steps) @@print
}`,
          build({ n }) {
            const s = [];
            const seq = [n];
            const vars = (v, st, c) => ({ type: 'boxes', items: [{ name: 'n', type: 'int', val: v, cls: c === 'n' ? 'hl' : '' }, { name: 'steps', type: 'int', val: st, cls: c === 's' ? 'hl' : '' }] });
            const path = () => ({ type: 'array', title: L('Values n has taken', 'n যেসব মান নিয়েছে'), idx: false, cells: seq.map((v, k) => ({ v, cls: k === seq.length - 1 ? 'cur' : 'dim' })) });
            let st = 0;
            s.push(step('init', L(`Start with n = ${n}, steps = 0.`, `শুরু: n = ${n}, steps = 0।`), [vars(n, 0, 'n'), path()]));
            let guard = 0;
            while (n !== 1 && guard++ < 120) {
              s.push(step('cond', L(`<code>n != 1</code>? n is ${n}, so keep looping.`, `<code>n != 1</code>? n = ${n}, তাই লুপ চলবে।`), [vars(n, st), path()]));
              const even = n % 2 === 0;
              s.push(step('if', L(`${n} is ${even ? 'even' : 'odd'}.`, `${n} ${even ? 'জোড়' : 'বিজোড়'}।`), [vars(n, st), path()]));
              n = even ? n / 2 : 3 * n + 1;
              seq.push(n);
              s.push(step(even ? 'half' : 'triple', L(even ? `Halve it: n = ${n}.` : `Odd: n = 3n + 1 = ${n}.`, even ? `অর্ধেক: n = ${n}।` : `বিজোড়: n = 3n + 1 = ${n}।`), [vars(n, st, 'n'), path()]));
              st++;
              s.push(step('inc', L(`steps++ makes steps ${st}. In Go, <code>++</code> is a statement, not an expression.`, `steps++ করে steps = ${st}। Go-তে <code>++</code> একটা statement, expression না।`), [vars(n, st, 's'), path()]));
            }
            s.push(step('cond', L('<code>n != 1</code> is false now. The loop ends.', 'এখন <code>n != 1</code> মিথ্যা। লুপ শেষ।'), [vars(n, st), path()]));
            s.push(step('print', L(`It took ${st} steps to reach 1.`, `1-এ পৌঁছাতে ${st} ধাপ লাগল।`), [vars(n, st), path(), out([`steps: ${st}`], 1)], { tone: 'ok' }));
            return s;
          },
        },
      ],
    },
    walk: [
      { at: 'for', ex: 0, code: 'for i := 1; i <= n; i++ {', text: L('init; condition; post. No parentheses. <code>i</code> exists only inside the loop.', 'init; শর্ত; post। কোনো বন্ধনী নেই। <code>i</code> শুধু লুপের ভেতরেই থাকে।') },
      { at: 'sw', ex: 0, code: 'switch {', text: L('A switch with no value acts like a clean if / else-if chain.', 'মান ছাড়া switch একটা পরিষ্কার if / else-if চেইনের মতো কাজ করে।') },
      { at: 'c15', ex: 0, code: 'case i%15 == 0:', text: L('Cases are checked in order. The most specific rule goes first.', 'Case ক্রম অনুযায়ী দেখা হয়। সবচেয়ে নির্দিষ্ট নিয়মটা আগে রাখুন।') },
      { at: 'cond', ex: 1, code: 'for n != 1 {', text: L('Only a condition: this is Go\'s while loop.', 'শুধু একটা শর্ত: এটাই Go-র while লুপ।') },
    ],
    mistakes: [
      { title: L('Expecting fall-through like C or JavaScript', 'C বা JavaScript-এর মতো fall-through আশা করা'), err: '', fix: L('Each case ends by itself. If you truly want the next case to run, write the keyword <code>fallthrough</code>, but you rarely need it. List several values in one case instead: <code>case "sat", "sun":</code>', 'প্রতিটা case নিজে থেকেই শেষ হয়। সত্যিই পরের case চালাতে চাইলে <code>fallthrough</code> লিখতে হয়, তবে খুব কমই লাগে। বরং এক case-এ কয়েকটা মান দিন: <code>case "sat", "sun":</code>') },
      { title: L('Using i++ as a value', 'i++ কে মান হিসেবে ব্যবহার'), err: './main.go:7:9: syntax error: unexpected ++ at end of statement', fix: L('<code>x := i++</code> is not allowed. Write <code>i++</code> on its own line, then use i.', '<code>x := i++</code> চলে না। <code>i++</code> আলাদা লাইনে লিখুন, তারপর i ব্যবহার করুন।') },
      { title: L('Putting the general case first', 'সাধারণ case আগে রাখা'), err: '', fix: L('If <code>i%3 == 0</code> comes before <code>i%15 == 0</code>, 15 prints Fizz. Order cases from most specific to least.', '<code>i%3 == 0</code> যদি <code>i%15 == 0</code>-এর আগে থাকে, 15-এর জন্য Fizz print হবে। সবচেয়ে নির্দিষ্ট থেকে সাধারণ ক্রমে case সাজান।') },
      { title: L('A loop that never ends', 'যে লুপ কখনো শেষ হয় না'), err: '', fix: L('In <code>for cond { }</code>, something in the body must eventually make the condition false. Press Ctrl+C to stop a stuck program.', '<code>for cond { }</code>-এ body-র ভেতরে কিছু একটা অবশ্যই এক সময় শর্তটা মিথ্যা করবে। আটকে যাওয়া প্রোগ্রাম থামাতে Ctrl+C চাপুন।') },
    ],
    quiz: [
      { q: L('How do you write a while loop in Go?', 'Go-তে while লুপ কীভাবে লেখেন?'), options: ['for x < 10 { }', 'while x < 10 { }', 'loop x < 10 { }'], answer: 0, why: L('Go has only <code>for</code>. With just a condition it behaves like while.', 'Go-তে শুধু <code>for</code>। শুধু শর্ত দিলে এটা while-এর মতো কাজ করে।') },
      { q: L('After a matching case finishes, what happens?', 'একটা case মিলে কাজ শেষ হলে কী হয়?'), options: [L('The switch ends', 'switch শেষ হয়'), L('The next case runs too', 'পরের case-ও চলে'), L('default runs', 'default চলে')], answer: 0, why: L('No implicit fall-through in Go.', 'Go-তে নিজে থেকে fall-through হয় না।') },
      { q: L('Which line is valid Go?', 'কোন লাইনটা সঠিক Go?'), options: ['if x > 3 { fmt.Println(x) }', 'if (x > 3) fmt.Println(x)', 'if x > 3: fmt.Println(x)'], answer: 0, why: L('Braces are mandatory, parentheses are optional and gofmt removes them.', 'Brace বাধ্যতামূলক। বন্ধনী ঐচ্ছিক, gofmt সেগুলো সরিয়ে দেয়।') },
    ],
    exercises: [
      { title: L('Multiplication table', 'নামতা'),
        task: L('Print the table of 7 from 7 × 1 to 7 × 10, one line each, in the form <code>7 x 3 = 21</code>.', '7-এর নামতা 7 × 1 থেকে 7 × 10 পর্যন্ত প্রতি লাইনে একটা করে print করুন, এভাবে: <code>7 x 3 = 21</code>।'),
        hints: [L('A classic three-part for loop from 1 to 10.', '1 থেকে 10 পর্যন্ত তিন অংশের for লুপ।'), L('<code>fmt.Printf("%d x %d = %d\\n", ...)</code> formats it neatly.', '<code>fmt.Printf("%d x %d = %d\\n", ...)</code> সুন্দর করে format করে।')],
        solution: `package main

import "fmt"

func main() {
	n := 7
	for i := 1; i <= 10; i++ {
		fmt.Printf("%d x %d = %d\\n", n, i, n*i)
	}
}` },
      { title: L('Count the digits', 'অঙ্ক গুনুন'),
        task: L('Given <code>n := 90210</code>, count its digits using a while-style loop that divides by 10. Print <code>5</code>. What should happen for n = 0?', '<code>n := 90210</code> দেওয়া আছে। 10 দিয়ে ভাগ করে while-ধরনের লুপে অঙ্ক গুনুন। <code>5</code> print করুন। n = 0 হলে কী হওয়া উচিত?'),
        hints: [L('Integer division drops the last digit: 90210 / 10 is 9021.', 'পূর্ণসংখ্যার ভাগে শেষ অঙ্ক বাদ যায়: 90210 / 10 = 9021।'), L('Zero has one digit, so handle it before the loop.', 'শূন্যের একটা অঙ্ক আছে, তাই লুপের আগেই সামলান।')],
        solution: `package main

import "fmt"

func main() {
	n := 90210
	count := 0
	if n == 0 {
		count = 1 // {0 has one digit|0-এর একটা অঙ্ক}
	}
	for n > 0 {
		n /= 10
		count++
	}
	fmt.Println(count)
}` },
    ],
    takeaways: [
      L('One loop keyword: <code>for</code> with three parts, with a condition, or with nothing.', 'লুপের একটাই keyword: তিন অংশসহ, শুধু শর্তসহ, বা কিছু ছাড়াই <code>for</code>।'),
      L('switch runs the first matching case and stops. Order cases carefully.', 'switch প্রথম মিলে যাওয়া case চালিয়ে থেমে যায়। Case সাবধানে সাজান।'),
      L('No parentheses around conditions; braces always.', 'শর্তের চারপাশে বন্ধনী নয়; brace সবসময়।'),
      L('<code>i++</code> is a statement, so it cannot be used inside an expression.', '<code>i++</code> একটা statement, তাই expression-এর ভেতরে ব্যবহার করা যায় না।'),
    ],
    links: [
      { t: 'A Tour of Go: Flow control', url: 'https://go.dev/tour/flowcontrol/1' },
      { t: 'Effective Go: Control structures', url: 'https://go.dev/doc/effective_go#control-structures' },
      { t: 'Go spec: Switch statements', url: 'https://go.dev/ref/spec#Switch_statements' },
    ],
  });
})();
