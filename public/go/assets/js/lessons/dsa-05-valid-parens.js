(function () {
  const { L, step } = GV;
  const OPEN = { ')': '(', ']': '[', '}': '{' };
  const chars = (s, i, bad) => ({ type: 'array', chars: true, title: L('s', 's'), cells: [...s].map((c, k) => ({ v: c, cls: k === i ? (bad ? 'bad' : 'cur') : k < i ? 'dim' : '' })), ptrs: i >= 0 && i < s.length ? { c: i } : {}, tagCls: { c: 'w' } });
  const stk = (items, hl) => ({ type: 'stack', title: L('stack', 'stack'), items: items.map((v, k) => ({ v, cls: k === items.length - 1 ? hl || '' : '' })) });

  GV.register({
    id: 'dsa-valid-parens', track: 'dsa', phase: 'patterns', order: 5, minutes: 12,
    title: L('Stack: valid parentheses', 'Stack: সঠিক বন্ধনী'),
    summary: L('Use a last-in-first-out stack to check that every bracket is closed in the right order.', 'Last-in-first-out stack দিয়ে যাচাই করুন প্রতিটা বন্ধনী ঠিক ক্রমে বন্ধ হয়েছে কিনা।'),
    idea: L([
      'A <b>stack</b> is a pile of plates: you add to the top and take from the top. Last in, first out (<b>LIFO</b>). In Go a slice makes a perfect stack: <code>append</code> to push, <code>s[:len(s)-1]</code> to pop.',
      'Brackets nest like Russian dolls: the most recently opened one must be the first to close. So push every opening bracket. When a closing bracket arrives, the top of the stack must be its matching opener. At the end, the stack must be empty, otherwise something was never closed.',
      'The same idea checks HTML tags, parses JSON, evaluates expressions, and powers the "undo" button. You already watched a stack in the functions lesson: the call stack.',
    ], [
      '<b>Stack</b> হলো থালার স্তূপ: উপরে রাখেন, উপর থেকে নেন। শেষে ঢোকে, আগে বের হয় (<b>LIFO</b>)। Go-তে slice দিয়েই চমৎকার stack হয়: push করতে <code>append</code>, pop করতে <code>s[:len(s)-1]</code>।',
      'বন্ধনী রাশিয়ান পুতুলের মতো একটার ভেতরে আরেকটা বসে: সবচেয়ে সাম্প্রতিক খোলাটাই আগে বন্ধ হবে। তাই প্রতিটা খোলা বন্ধনী push করুন। বন্ধ বন্ধনী এলে stack-এর উপরেরটা অবশ্যই তার মিলের খোলা বন্ধনী হতে হবে। শেষে stack খালি থাকতে হবে, নইলে কিছু একটা কখনো বন্ধ হয়নি।',
      'একই ধারণায় HTML tag যাচাই, JSON parse, expression হিসাব, আর "undo" বোতাম চলে। Function লেসনে আপনি আগেই একটা stack দেখেছেন: call stack।',
    ]),
    complexity: { time: 'O(n)', space: 'O(n)', note: L('In the worst case (all openers) every character is on the stack.', 'সবচেয়ে খারাপ ক্ষেত্রে (সব খোলা বন্ধনী) প্রতিটা অক্ষর stack-এ থাকে।') },
    visual: {
      file: 'valid_parens.go',
      examples: [
        {
          label: L('Check a bracket string', 'বন্ধনীর string যাচাই'),
          inputs: [{ key: 's', label: L('Brackets only: ( ) [ ] { }', 'শুধু বন্ধনী: ( ) [ ] { }'), type: 'text', def: '{[()()]}', maxLen: 14 }],
          code: `
func isValid(s string) bool {
	pairs := map[rune]rune{')': '(', ']': '[', '}': '{'} @@pairs
	var stack []rune
	for _, c := range s { @@loop
		if open, isClose := pairs[c]; isClose { @@isclose
			if len(stack) == 0 || stack[len(stack)-1] != open { @@mismatch
				return false @@bad
			}
			stack = stack[:len(stack)-1] // {pop the matching opener|মিলে যাওয়া opener pop} @@pop
		} else {
			stack = append(stack, c) // {push an opener|opener push} @@push
		}
	}
	return len(stack) == 0 // {nothing left open|খোলা কিছু বাকি নেই} @@ret
}`,
          build({ s }) {
            if (!/^[()[\]{}]+$/.test(s)) throw new GV.InputError(L('Use only the characters ( ) [ ] { }.', 'শুধু ( ) [ ] { } অক্ষরগুলো ব্যবহার করুন।'));
            const out = [];
            const st = [];
            let asked = false;
            out.push(step('pairs', L('A map from each closer to its opener, and an empty stack.', 'প্রতিটা বন্ধ বন্ধনী থেকে তার খোলা বন্ধনীর একটা map, আর একটা খালি stack।'), [chars(s, -1), stk(st)]));
            for (let i = 0; i < s.length; i++) {
              const c = s[i];
              if (!OPEN[c]) {
                st.push(c);
                out.push(step('push', L(`<code>${c}</code> opens something. Push it.`, `<code>${c}</code> কিছু খোলে। Push করো।`), [chars(s, i), stk(st, 'new')]));
                continue;
              }
              const top = st[st.length - 1];
              const ok = top === OPEN[c];
              const extra = !asked ? { ask: { q: L(`<code>${c}</code> closes. The top of the stack is <code>${top || 'nothing'}</code>. Is this valid so far?`, `<code>${c}</code> বন্ধ করে। Stack-এর উপরে আছে <code>${top || 'কিছু না'}</code>। এখন পর্যন্ত কি সঠিক?`), options: ok ? [L(`Yes, pop the ${top}`, `হ্যাঁ, ${top} pop করো`), L('No, return false', 'না, false ফেরত')] : [L('No, return false', 'না, false ফেরত'), L('Yes, pop it', 'হ্যাঁ, pop করো')], answer: 0, why: L(`A closer must match the most recent unclosed opener, which is always on top. <code>${c}</code> needs <code>${OPEN[c]}</code>.`, `বন্ধ বন্ধনীকে সবচেয়ে সাম্প্রতিক না-বন্ধ খোলা বন্ধনীর সাথে মিলতে হবে, যেটা সবসময় উপরে থাকে। <code>${c}</code>-এর লাগে <code>${OPEN[c]}</code>।`) } } : {};
              asked = true;
              out.push(step('mismatch', L(`<code>${c}</code> closes. It needs <code>${OPEN[c]}</code> on top; the top is <code>${top || 'empty'}</code>.`, `<code>${c}</code> বন্ধ করে। উপরে <code>${OPEN[c]}</code> লাগবে; উপরে আছে <code>${top || 'খালি'}</code>।`), [chars(s, i), stk(st, ok ? 'ok' : 'bad')], extra));
              if (!ok) {
                out.push(step('bad', L(top ? `Wrong closer for <code>${top}</code>: brackets crossed. Not valid.` : 'A closer with nothing open. Not valid.', top ? `<code>${top}</code>-এর জন্য ভুল বন্ধনী: বন্ধনী আড়াআড়ি। সঠিক না।` : 'খোলা কিছু নেই অথচ বন্ধ বন্ধনী। সঠিক না।'), [chars(s, i, true), stk(st, 'bad')], { tone: 'bad' }));
                return out;
              }
              st.pop();
              out.push(step('pop', L(`Match. Pop <code>${OPEN[c]}</code>.`, `মিলেছে। <code>${OPEN[c]}</code> pop।`), [chars(s, i), stk(st)]));
            }
            const good = st.length === 0;
            out.push(step('ret', L(good ? 'The stack is empty: every bracket was closed in order. Valid.' : `The stack still holds <code>${st.join('')}</code>: opened but never closed. Not valid.`, good ? 'Stack খালি: প্রতিটা বন্ধনী ক্রম মেনে বন্ধ হয়েছে। সঠিক।' : `Stack-এ এখনো <code>${st.join('')}</code>: খোলা হয়েছে কিন্তু বন্ধ হয়নি। সঠিক না।`), [chars(s, s.length), stk(st, good ? '' : 'bad')], { tone: good ? 'ok' : 'bad' }));
            return out;
          },
        },
      ],
    },
    walk: [
      { at: 'pairs', code: 'map[rune]rune{\')\': \'(\', …}', text: L('Lookup table: closer → opener. Also tells whether c is a closer at all.', 'Lookup টেবিল: বন্ধ → খোলা। c আদৌ বন্ধ বন্ধনী কিনা সেটাও জানায়।') },
      { at: 'push', code: 'stack = append(stack, c)', text: L('Push = append to the end of the slice.', 'Push = slice-এর শেষে append।') },
      { at: 'pop', code: 'stack = stack[:len(stack)-1]', text: L('Pop = shorten the slice by one. Read stack[len(stack)-1] first if you need the value.', 'Pop = slice এক ঘর ছোট করা। মান লাগলে আগে stack[len(stack)-1] পড়ুন।') },
      { at: 'ret', code: 'return len(stack) == 0', text: L('Leftover openers mean an unclosed bracket.', 'বাকি থাকা খোলা বন্ধনী মানে কিছু বন্ধ হয়নি।') },
    ],
    mistakes: [
      { title: L('Popping an empty stack', 'খালি stack থেকে pop'), err: 'panic: runtime error: index out of range [-1]', fix: L('Check <code>len(stack) == 0</code> before reading the top. The input ")(" hits this.', 'উপরেরটা পড়ার আগে <code>len(stack) == 0</code> যাচাই করুন। ")(" input-এ এটা ঘটে।') },
      { title: L('Forgetting the final empty check', 'শেষের খালি যাচাই ভুলে যাওয়া'), err: '', fix: L('"((" never fails a match but is not valid. Return <code>len(stack) == 0</code>.', '"((" কখনো মিলে ব্যর্থ হয় না, কিন্তু সঠিক না। <code>len(stack) == 0</code> ফেরত দিন।') },
      { title: L('Counting instead of stacking', 'Stack-এর বদলে গোনা'), err: '', fix: L('Counters accept "([)]". Order matters, which is exactly what a stack remembers.', 'Counter "([)]" মেনে নেয়। ক্রম গুরুত্বপূর্ণ, আর stack ঠিক সেটাই মনে রাখে।') },
    ],
    quiz: [
      { q: L('Is "([)]" valid?', '"([)]" কি সঠিক?'), options: [L('No', 'না'), L('Yes', 'হ্যাঁ')], answer: 0, why: L('When ) arrives the top is [, not (.', ') এলে উপরে থাকে [, ( না।') },
      { q: L('How do you pop a slice-based stack in Go?', 'Go-তে slice-ভিত্তিক stack কীভাবে pop করেন?'), options: ['s = s[:len(s)-1]', 's = s[1:]', 'delete(s, len(s)-1)'], answer: 0, why: L('Drop the last element. s[1:] would remove from the bottom.', 'শেষ উপাদান বাদ। s[1:] নিচ থেকে সরাত।') },
      { q: L('Which order does a stack follow?', 'Stack কোন ক্রম মানে?'), options: ['LIFO', 'FIFO', L('sorted', 'সাজানো')], answer: 0, why: L('Last in, first out.', 'শেষে ঢোকে, আগে বের হয়।') },
    ],
    exercises: [
      { title: L('Deepest nesting', 'সবচেয়ে গভীর নেস্টিং'),
        task: L('Return the maximum nesting depth of a valid string: "(()(()))" has depth 3.', 'একটা সঠিক string-এর সর্বোচ্চ নেস্টিং গভীরতা ফেরত দিন: "(()(()))"-এর গভীরতা 3।'),
        hints: [L('The stack size after each push is the current depth.', 'প্রতিটা push-এর পর stack-এর আকারই বর্তমান গভীরতা।'), L('With one bracket type, a counter is enough here.', 'এক ধরনের বন্ধনী হলে এখানে একটা counter-ই যথেষ্ট।')],
        solution: `package main

import "fmt"

func maxDepth(s string) int {
	depth, best := 0, 0
	for _, c := range s {
		switch c {
		case '(':
			depth++
			best = max(best, depth)
		case ')':
			depth--
		}
	}
	return best
}

func main() {
	fmt.Println(maxDepth("(()(()))")) // {3|3}
}` },
      { title: L('Simplify a path', 'Path সরল করা'),
        task: L('Turn "/a/./b/../c/" into "/a/c" using a stack of directory names: push names, ignore ".", pop on "..".', 'Directory নামের একটা stack দিয়ে "/a/./b/../c/"-কে "/a/c" বানান: নাম push, "." উপেক্ষা, ".." পেলে pop।'),
        hints: [L('<code>strings.Split(path, "/")</code> gives the parts; skip empty strings.', '<code>strings.Split(path, "/")</code> অংশগুলো দেয়; খালি string বাদ দিন।'), L('Join with <code>"/" + strings.Join(stack, "/")</code>.', '<code>"/" + strings.Join(stack, "/")</code> দিয়ে জোড়া দিন।')],
        solution: `package main

import (
	"fmt"
	"strings"
)

func simplify(path string) string {
	var stack []string
	for _, part := range strings.Split(path, "/") {
		switch part {
		case "", ".":
			// {nothing to do|কিছু করার নেই}
		case "..":
			if len(stack) > 0 {
				stack = stack[:len(stack)-1]
			}
		default:
			stack = append(stack, part)
		}
	}
	return "/" + strings.Join(stack, "/")
}

func main() {
	fmt.Println(simplify("/a/./b/../c/"))
}` },
    ],
    takeaways: [
      L('A stack is LIFO; in Go use a slice with append and s[:len(s)-1].', 'Stack হলো LIFO; Go-তে append আর s[:len(s)-1] সহ একটা slice ব্যবহার করুন।'),
      L('Push openers, match closers against the top, and require an empty stack at the end.', 'খোলা বন্ধনী push, বন্ধ বন্ধনী উপরেরটার সাথে মেলান, আর শেষে stack খালি থাকা চাই।'),
      L('Guard every pop with a length check.', 'প্রতিটা pop-এর আগে length যাচাই করুন।'),
    ],
    links: [{ t: 'Go blog: Arrays, slices: the mechanics of append', url: 'https://go.dev/blog/slices' }],
  });
})();
