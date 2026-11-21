(function () {
  const { L, step, out, addr } = GV;
  const A = addr(0);
  const mem = (items) => ({ type: 'boxes', title: L('Memory', 'মেমরি'), items });
  const stack = (items) => ({ type: 'frames', title: L('Call stack', 'Call stack'), items });

  GV.register({
    id: 'go-pointers', track: 'go', phase: 'memory', order: 1, minutes: 18,
    title: L('Pointers', 'Pointer'),
    summary: L('A pointer is a box that holds another box\'s address. See &, *, pass-by-pointer, and the nil panic.', 'Pointer হলো এমন একটা বাক্স যেটা আরেকটা বাক্সের address রাখে। দেখুন &, *, pointer দিয়ে পাঠানো, আর nil panic।'),
    idea: L([
      'Think of a friend\'s house. The <b>value</b> is the house itself. A <b>pointer</b> is a slip of paper with the house\'s address on it. If you give someone a photocopy of the house (pass by value) and they paint it, your house is unchanged. Give them the address slip (a pointer) and they can walk over and paint your actual house.',
      'Two symbols do all the work. <code>&amp;x</code> means "the address of x": it makes the arrow. <code>*p</code> means "go to where p points": it follows the arrow, to read or to write. A pointer type is written <code>*int</code>, "pointer to int".',
      'Go has no pointer arithmetic like C, so pointers are safe to use. You will use them to let functions change data, and to avoid copying large structs.',
    ], [
      'একজন বন্ধুর বাড়ির কথা ভাবুন। <b>Value</b> হলো বাড়িটা নিজে। <b>Pointer</b> হলো একটা কাগজ, যাতে বাড়ির ঠিকানা লেখা। কাউকে বাড়ির একটা ফটোকপি দিলে (pass by value) সে রং করলেও আপনার বাড়ি একই থাকে। ঠিকানার কাগজটা দিলে (pointer) সে গিয়ে আপনার আসল বাড়িটাই রং করতে পারে।',
      'দুটো চিহ্নই সব কাজ করে। <code>&amp;x</code> মানে "x-এর address": এটা তীর বানায়। <code>*p</code> মানে "p যেখানে নির্দেশ করে সেখানে যাও": তীর অনুসরণ করে পড়া বা লেখা। Pointer type লেখা হয় <code>*int</code>, মানে "int-এর pointer"।',
      'Go-তে C-এর মতো pointer arithmetic নেই, তাই pointer নিরাপদ। Function-কে ডেটা বদলাতে দিতে আর বড় struct কপি এড়াতে এগুলো ব্যবহার করবেন।',
    ]),
    visual: {
      file: 'main.go',
      legend: [{ cls: 'cur', label: L('just changed', 'এইমাত্র বদলেছে') }, { cls: 'bad', label: L('crash', 'crash') }],
      examples: [
        {
          label: L('Address-of and dereference', 'Address-of আর dereference'),
          code: `
package main

import "fmt"

func main() {
	x := 10 @@x
	p := &x // {p holds the address of x|p রাখে x-এর address} @@p
	fmt.Println(*p) // {follow the arrow and read|তীর অনুসরণ করে পড়ো} @@read
	*p = 20 // {follow the arrow and write|তীর অনুসরণ করে লেখো} @@write
	fmt.Println(x) @@print
}`,
          build() {
            const x = (v, cls) => ({ id: 'x', name: 'x', type: 'int', val: v, addr: A, cls });
            const p = (cls) => ({ id: 'p', name: 'p', type: '*int', val: A, addr: addr(6), cls });
            return [
              step('x', L('<code>x := 10</code>: an int box at address ' + A + '.', '<code>x := 10</code>: ' + A + ' address-এ একটা int বাক্স।'), [mem([x(10, 'hl new')])]),
              step('p', L('<code>&amp;x</code> is the address of x. p stores that address, so p "points to" x.', '<code>&amp;x</code> হলো x-এর address। p সেটা রাখে, তাই p, x-কে "নির্দেশ করে"।'), [mem([x(10), p('hl new')])], { arrows: [{ from: 'p', to: 'x' }] }),
              step('read', L('<code>*p</code> follows the arrow and reads what is there: 10.', '<code>*p</code> তীর অনুসরণ করে সেখানে যা আছে পড়ে: 10।'), [mem([x(10, 'live'), p()]), out(['10'], 1)], { arrows: [{ from: 'p', to: 'x', cls: 'w' }] }),
              step('write', L('<code>*p = 20</code> follows the arrow and writes. We changed x without writing its name.', '<code>*p = 20</code> তীর অনুসরণ করে লেখে। x-এর নাম না লিখেই x বদলে গেল।'), [mem([x(20, 'hl'), p()]), out(['10'])], {
                arrows: [{ from: 'p', to: 'x', cls: 'w' }],
                ask: { q: L('What does <code>fmt.Println(x)</code> print next?', 'এরপর <code>fmt.Println(x)</code> কী print করবে?'), options: ['20', '10', L('an address like 0xc000014080', '0xc000014080 এর মতো address')], answer: 0, why: L('*p and x are the same box.', '*p আর x একই বাক্স।') },
              }),
              step('print', L('x is 20. Printing p itself would show the address, not 20.', 'x এখন 20। p নিজে print করলে address দেখাত, 20 না।'), [mem([x(20), p()]), out(['10', '20'], 1)], { arrows: [{ from: 'p', to: 'x' }], tone: 'ok' }),
            ];
          },
        },
        {
          label: L('Pass by value vs by pointer', 'Value বনাম pointer দিয়ে পাঠানো'),
          code: `
package main

import "fmt"

func addOneValue(n int) { @@fv
	n++ // {changes a copy|একটা কপি বদলায়} @@vinc
}

func addOnePtr(n *int) { @@fp
	*n++ // {changes the caller's x|caller-এর x বদলায়} @@pinc
}

func main() {
	x := 5 @@x
	addOneValue(x) @@cv
	addOnePtr(&x) @@cp
	fmt.Println(x) @@print
}`,
          build() {
            const m = (v, cls) => ({ fn: 'main()', vars: [{ id: 'mx', k: 'x', v, cls }] });
            return [
              step('x', L('main has x = 5.', 'main-এ x = 5।'), [stack([m(5, 'new')])]),
              step('fv', L('<code>addOneValue(x)</code> pushes a frame. n gets a <b>copy</b> of 5.', '<code>addOneValue(x)</code> একটা frame push করে। n পায় 5-এর একটা <b>কপি</b>।'), [stack([m(5), { fn: 'addOneValue(n)', vars: [{ id: 'vn', k: 'n', v: 5, cls: 'new' }] }])]),
              step('vinc', L('<code>n++</code> changes the copy to 6. main\'s x is untouched.', '<code>n++</code> কপিটা 6 করে। main-এর x অক্ষত।'), [stack([m(5), { fn: 'addOneValue(n)', vars: [{ id: 'vn', k: 'n', v: 6, cls: 'hl' }] }])], {
                ask: { q: L('When addOneValue returns, what is main\'s x?', 'addOneValue return করলে main-এর x কত?'), options: ['5', '6'], answer: 0, why: L('The function only had a copy.', 'Function-এর কাছে ছিল শুধু একটা কপি।') },
              }),
              step('cv', L('The frame is popped and the copy is gone. x is still 5.', 'Frame pop হলো, কপিটা হারিয়ে গেল। x এখনো 5।'), [stack([m(5)])]),
              step('fp', L('<code>addOnePtr(&amp;x)</code> passes the <b>address</b> of x. n is a pointer pointing into main\'s frame.', '<code>addOnePtr(&amp;x)</code> x-এর <b>address</b> পাঠায়। n একটা pointer, main-এর frame-এর দিকে নির্দেশ করে।'), [stack([m(5), { fn: 'addOnePtr(n)', vars: [{ id: 'pn', k: 'n', v: '&x', cls: 'new' }] }])], { arrows: [{ from: 'pn', to: 'mx' }] }),
              step('pinc', L('<code>*n++</code> follows the arrow and increments the real x.', '<code>*n++</code> তীর ধরে গিয়ে আসল x বাড়ায়।'), [stack([m(6, 'hl'), { fn: 'addOnePtr(n)', vars: [{ id: 'pn', k: 'n', v: '&x' }] }])], { arrows: [{ from: 'pn', to: 'mx', cls: 'w' }] }),
              step('print', L('Only the pointer version changed x.', 'শুধু pointer সংস্করণটাই x বদলেছে।'), [stack([m(6)]), out(['6'], 1)], { tone: 'ok' }),
            ];
          },
        },
        {
          label: L('nil pointer panic', 'nil pointer panic'),
          code: `
package main

import "fmt"

func main() {
	var p *int // {zero value of a pointer is nil|pointer-এর zero value হলো nil} @@decl
	fmt.Println(p == nil) @@check
	fmt.Println(*p) // {there is no box to follow to|অনুসরণ করার মতো কোনো বাক্স নেই} @@deref
}`,
          build() {
            return [
              step('decl', L('<code>var p *int</code> creates a pointer with the zero value <code>nil</code>: it points nowhere.', '<code>var p *int</code> একটা pointer বানায়, যার zero value <code>nil</code>: এটা কোথাও নির্দেশ করে না।'), [mem([{ id: 'p', name: 'p', type: '*int', val: 'nil', addr: addr(0), cls: 'hl new' }])]),
              step('check', L('Comparing with nil is safe.', 'nil-এর সাথে তুলনা নিরাপদ।'), [mem([{ name: 'p', type: '*int', val: 'nil', addr: addr(0) }]), out(['true'], 1)]),
              step('deref', L('<code>*p</code> tries to follow an arrow that does not exist. The program <b>panics</b> and stops.', '<code>*p</code> এমন একটা তীর অনুসরণ করতে চায় যেটার অস্তিত্বই নেই। প্রোগ্রাম <b>panic</b> করে থেমে যায়।'), [mem([{ name: 'p', type: '*int', val: 'nil', addr: addr(0), cls: 'bad' }]), out(['true', { v: 'panic: runtime error: invalid memory address or nil pointer dereference', cls: 'bad' }, { v: '[signal SIGSEGV: segmentation violation ...]', cls: 'bad' }])], { tone: 'bad' }),
            ];
          },
        },
      ],
    },
    walk: [
      { at: 'p', ex: 0, code: 'p := &x', text: L('<code>&amp;</code> takes the address. The type of p is <code>*int</code>.', '<code>&amp;</code> address নেয়। p-এর type হলো <code>*int</code>।') },
      { at: 'write', ex: 0, code: '*p = 20', text: L('<code>*</code> on a pointer value means "the box it points to".', 'Pointer মানের উপর <code>*</code> মানে "যে বাক্সের দিকে নির্দেশ করে"।') },
      { at: 'fp', ex: 1, code: 'func addOnePtr(n *int)', text: L('In a type, <code>*int</code> means "pointer to int".', 'Type-এর মধ্যে <code>*int</code> মানে "int-এর pointer"।') },
      { at: 'deref', ex: 2, code: 'fmt.Println(*p)', text: L('Dereferencing nil panics. Check <code>p != nil</code> when a pointer may be empty.', 'nil dereference করলে panic। Pointer খালি হতে পারলে <code>p != nil</code> যাচাই করুন।') },
    ],
    mistakes: [
      { title: L('Dereferencing a nil pointer', 'nil pointer dereference করা'), err: 'panic: runtime error: invalid memory address or nil pointer dereference', fix: L('Check for nil first, or make sure the pointer was set (for example with <code>&amp;value</code> or <code>new(T)</code>).', 'আগে nil যাচাই করুন, অথবা নিশ্চিত করুন pointer-এ কিছু রাখা হয়েছে (যেমন <code>&amp;value</code> বা <code>new(T)</code> দিয়ে)।') },
      { title: L('Confusing p with *p', 'p আর *p গুলিয়ে ফেলা'), err: './main.go:8:6: cannot use 20 (untyped int constant) as *int value in assignment', fix: L('<code>p = 20</code> tries to store a number in an address box. You meant <code>*p = 20</code>.', '<code>p = 20</code> address-এর বাক্সে সংখ্যা রাখতে চায়। আপনি চেয়েছিলেন <code>*p = 20</code>।') },
      { title: L('Fearing pointers to local variables', 'Local variable-এর pointer নিয়ে ভয়'), err: '', fix: L('Returning <code>&amp;local</code> is safe in Go. The compiler\'s <b>escape analysis</b> moves the variable to the heap so it outlives the function. In C this would be a bug.', 'Go-তে <code>&amp;local</code> return করা নিরাপদ। Compiler-এর <b>escape analysis</b> variable-টা heap-এ সরিয়ে দেয়, তাই function শেষেও টিকে থাকে। C-তে এটা bug হতো।') },
    ],
    perf: L([
      'Passing a pointer copies 8 bytes instead of the whole value, which matters for large structs. For small values like int or a 2-field struct, passing by value is usually just as fast and easier to reason about.',
      'Values that escape to the heap must later be cleaned up by the garbage collector. Run <code>go build -gcflags=-m</code> to see what escapes.',
    ], [
      'Pointer পাঠালে পুরো মানের বদলে মাত্র 8 byte কপি হয়, বড় struct-এর ক্ষেত্রে এটা গুরুত্বপূর্ণ। int বা দুই field-এর ছোট struct-এর জন্য by value পাঠানো সাধারণত সমান দ্রুত আর বোঝা সহজ।',
      'যেসব মান heap-এ চলে যায়, পরে garbage collector-কে সেগুলো পরিষ্কার করতে হয়। কোনগুলো escape করে দেখতে <code>go build -gcflags=-m</code> চালান।',
    ]),
    quiz: [
      { q: L('If <code>p := &amp;x</code>, what is <code>*p</code>?', '<code>p := &amp;x</code> হলে <code>*p</code> কী?'), options: [L('The value stored in x', 'x-এ রাখা মান'), L('The address of x', 'x-এর address'), L('The address of p', 'p-এর address')], answer: 0, why: L('* follows the pointer to the box it points at.', '* pointer ধরে তার নির্দেশিত বাক্সে যায়।') },
      { q: L('What is the zero value of <code>*string</code>?', '<code>*string</code>-এর zero value কী?'), options: ['nil', '""', L('a pointer to ""', '"" এর pointer')], answer: 0, why: L('Every pointer type starts as nil.', 'প্রতিটা pointer type nil দিয়ে শুরু হয়।') },
      { q: L('Why pass <code>&amp;x</code> to a function?', 'Function-এ <code>&amp;x</code> কেন পাঠাবেন?'), options: [L('So it can change the caller\'s x', 'যাতে caller-এর x বদলাতে পারে'), L('To make the call run on another core', 'যাতে call অন্য core-এ চলে'), L('Go requires it for ints', 'int-এর জন্য Go এটা বাধ্যতামূলক করে')], answer: 0, why: L('With the address, the function can write to the original.', 'Address থাকলে function আসলটাতে লিখতে পারে।') },
    ],
    exercises: [
      { title: L('swap with pointers', 'Pointer দিয়ে swap'),
        task: L('Write <code>func swap(a, b *int)</code> that swaps the two ints the pointers point to. Call it from main and print the result.', '<code>func swap(a, b *int)</code> লিখুন যেটা দুই pointer-এর নির্দেশিত int অদলবদল করে। main থেকে call করে ফলাফল print করুন।'),
        hints: [L('Inside, work with <code>*a</code> and <code>*b</code>, not a and b.', 'ভেতরে a, b না, <code>*a</code> আর <code>*b</code> নিয়ে কাজ করুন।'), L('Call it as <code>swap(&amp;x, &amp;y)</code>.', 'এভাবে call করুন: <code>swap(&amp;x, &amp;y)</code>।')],
        solution: `package main

import "fmt"

func swap(a, b *int) {
	*a, *b = *b, *a // {write through both pointers|দুই pointer দিয়েই লেখা}
}

func main() {
	x, y := 1, 2
	swap(&x, &y)
	fmt.Println(x, y) // {2 1|2 1}
}` },
      { title: L('A counter that survives', 'টিকে থাকা কাউন্টার'),
        task: L('Write <code>func newCounter() *int</code> that returns a pointer to a new int starting at 0. In main, increment it three times through the pointer and print 3. Why is returning a pointer to a local safe here?', '<code>func newCounter() *int</code> লিখুন যেটা 0 দিয়ে শুরু হওয়া একটা নতুন int-এর pointer ফেরত দেয়। main-এ pointer দিয়ে তিনবার বাড়িয়ে 3 print করুন। এখানে local-এর pointer ফেরত দেওয়া নিরাপদ কেন?'),
        hints: [L('<code>n := 0; return &amp;n</code> works.', '<code>n := 0; return &amp;n</code> কাজ করবে।'), L('Think about escape analysis.', 'Escape analysis নিয়ে ভাবুন।')],
        solution: `package main

import "fmt"

func newCounter() *int {
	n := 0
	return &n // {n escapes to the heap|n heap-এ চলে যায়}
}

func main() {
	c := newCounter()
	for i := 0; i < 3; i++ {
		*c++
	}
	fmt.Println(*c)
}` },
    ],
    takeaways: [
      L('<code>&amp;x</code> makes an arrow to x; <code>*p</code> follows the arrow.', '<code>&amp;x</code> x-এর দিকে তীর বানায়; <code>*p</code> তীর অনুসরণ করে।'),
      L('Function arguments are copies. Pass a pointer when the function must change the original.', 'Function argument হলো কপি। আসলটা বদলাতে হলে pointer পাঠান।'),
      L('A nil pointer points nowhere; dereferencing it panics.', 'nil pointer কোথাও নির্দেশ করে না; dereference করলে panic।'),
      L('Returning a pointer to a local is safe; the compiler moves it to the heap.', 'Local-এর pointer ফেরত দেওয়া নিরাপদ; compiler সেটা heap-এ সরিয়ে দেয়।'),
    ],
    links: [
      { t: 'A Tour of Go: Pointers', url: 'https://go.dev/tour/moretypes/1' },
      { t: 'Go FAQ: Pass by value', url: 'https://go.dev/doc/faq#pass_by_value' },
      { t: 'Go FAQ: Stack or heap?', url: 'https://go.dev/doc/faq#stack_or_heap' },
    ],
  });
})();
