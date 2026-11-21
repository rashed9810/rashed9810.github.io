(function () {
  const { L, step, out } = GV;
  const hdr = (name, len, cap, cls, at) => ({ id: name, name, type: '[]int', cls, fields: [{ k: 'ptr', v: at || '●', id: name + '-ptr' }, { k: 'len', v: len }, { k: 'cap', v: cap }] });
  const headers = (items) => ({ type: 'boxes', title: L('Slice headers (what the variable holds)', 'Slice header (variable আসলে যা রাখে)'), items });
  // backing array: cells inside [from, from+len) are visible through the slice
  const backing = (id, vals, title, visible, changed, dim) => ({ type: 'array', id, title, cells: vals.map((v, i) => ({ v, cls: dim ? 'dim' : i === changed ? 'cur' : visible(i) ? 'live' : '' })) });

  GV.register({
    id: 'go-slices', track: 'go', phase: 'memory', order: 2, minutes: 22,
    title: L('Arrays vs slices', 'Array বনাম slice'),
    summary: L('A slice is a small header (pointer, length, capacity) over a backing array. Watch append grow it, and two slices share memory.', 'Slice হলো একটা backing array-এর উপর ছোট একটা header (pointer, length, capacity)। দেখুন append কীভাবে বাড়ায়, আর দুটো slice কীভাবে একই মেমরি ভাগ করে।'),
    idea: L([
      'An <b>array</b> in Go has a fixed length that is part of its type: <code>[5]int</code> and <code>[6]int</code> are different types. You rarely use arrays directly. You use <b>slices</b>.',
      'A slice is like a bookmark ribbon laid over a row of seats in a cinema. The ribbon records three things: which seat it starts at (<b>pointer</b>), how many seats it covers (<b>len</b>), and how many seats are free to the right before the row ends (<b>cap</b>). The seats themselves are the <b>backing array</b>. Copying a slice copies the ribbon, not the seats, so two slices can cover the same seats.',
      '<code>append</code> fills the next free seat if there is room. When the row is full, Go books a bigger row elsewhere, copies everyone over, and returns a ribbon on the new row. That is why you must always write <code>s = append(s, x)</code>.',
    ], [
      'Go-তে <b>array</b>-এর দৈর্ঘ্য নির্দিষ্ট, আর সেটা type-এরই অংশ: <code>[5]int</code> আর <code>[6]int</code> আলাদা type। Array সরাসরি খুব কমই ব্যবহার হয়। ব্যবহার হয় <b>slice</b>।',
      'Slice হলো সিনেমা হলের এক সারি সিটের উপর রাখা একটা ফিতার মতো। ফিতাটা তিনটা জিনিস মনে রাখে: কোন সিট থেকে শুরু (<b>pointer</b>), কয়টা সিট ঢেকে রাখে (<b>len</b>), আর সারি শেষ হওয়ার আগে ডানে কয়টা সিট আছে (<b>cap</b>)। সিটগুলোই হলো <b>backing array</b>। Slice কপি করলে ফিতা কপি হয়, সিট না, তাই দুটো slice একই সিট ঢাকতে পারে।',
      '<code>append</code> জায়গা থাকলে পরের খালি সিটটা ভরে। সারি ভরে গেলে Go অন্য জায়গায় বড় একটা সারি বুক করে, সবাইকে সেখানে কপি করে, আর নতুন সারির উপর একটা ফিতা ফেরত দেয়। এজন্যই সবসময় লিখতে হয় <code>s = append(s, x)</code>।',
    ]),
    visual: {
      file: 'main.go',
      legend: [{ cls: 'live', label: L('visible through the slice (within len)', 'slice দিয়ে দেখা যায় (len-এর ভেতরে)') }, { cls: 'cur', label: L('just written', 'এইমাত্র লেখা হলো') }, { cls: 'dim', label: L('old array, garbage', 'পুরনো array, আবর্জনা') }],
      examples: [
        {
          label: L('append and growth', 'append আর বৃদ্ধি'),
          code: `
package main

import "fmt"

func main() {
	s := make([]int, 0, 2) // {len 0, room for 2|len 0, জায়গা 2টার} @@make
	s = append(s, 10) @@a1
	s = append(s, 20) @@a2
	s = append(s, 30) // {full: Go allocates a bigger array|ভরা: Go বড় নতুন array নেয়} @@a3
	fmt.Println(len(s), cap(s)) @@print
}`,
          build() {
            const t1 = L('Backing array #1 (cap 2)', 'Backing array #1 (cap 2)');
            const t2 = L('Backing array #2 (cap 4)', 'Backing array #2 (cap 4)');
            return [
              step('make', L('<code>make([]int, 0, 2)</code> allocates an array of 2 ints and a header with len 0, cap 2. Nothing is visible yet.', '<code>make([]int, 0, 2)</code> 2টা int-এর একটা array আর len 0, cap 2-এর একটা header বানায়। এখনো কিছু দেখা যায় না।'), [headers([hdr('s', 0, 2, 'hl new')]), backing('a1', [0, 0], t1, () => false)], { arrows: [{ from: 's-ptr', to: 'a1-0' }] }),
              step('a1', L('There is room (len 0 &lt; cap 2), so append writes 10 into slot 0 and returns a header with len 1.', 'জায়গা আছে (len 0 &lt; cap 2), তাই append slot 0-তে 10 লিখে len 1 সহ header ফেরত দেয়।'), [headers([hdr('s', 1, 2, 'hl')]), backing('a1', [10, 0], t1, (i) => i < 1, 0)], { arrows: [{ from: 's-ptr', to: 'a1-0' }] }),
              step('a2', L('Still room. 20 goes into slot 1. Now len equals cap: the array is full.', 'এখনো জায়গা আছে। 20 যায় slot 1-এ। এখন len = cap: array ভরা।'), [headers([hdr('s', 2, 2, 'hl')]), backing('a1', [10, 20], t1, (i) => i < 2, 1)], {
                arrows: [{ from: 's-ptr', to: 'a1-0' }],
              }),
              step('a3', L('No room left. append allocates a <b>new, bigger</b> array (cap 4 here), copies 10 and 20, writes 30, and returns a header pointing at the new array. The old array becomes garbage.', 'আর জায়গা নেই। append একটা <b>নতুন, বড়</b> array নেয় (এখানে cap 4), 10 আর 20 কপি করে, 30 লেখে, আর নতুন array-এর দিকে নির্দেশ করা header ফেরত দেয়। পুরনো array আবর্জনা হয়ে যায়।'), [headers([hdr('s', 3, 4, 'hl')]), backing('a1', [10, 20], t1, () => false, -1, true), backing('a2', [10, 20, 30, 0], t2, (i) => i < 3, 2)], {
                arrows: [{ from: 's-ptr', to: 'a2-0' }],
                ask: { q: L('The array is full (len 2, cap 2). What does <code>append(s, 30)</code> do?', 'Array ভরা (len 2, cap 2)। <code>append(s, 30)</code> কী করবে?'), options: [L('Allocates a bigger array, copies, then writes 30', 'বড় array নিয়ে কপি করে, তারপর 30 লেখে'), L('Panics: index out of range', 'Panic: index out of range'), L('Overwrites slot 0', 'slot 0 মুছে লেখে')], answer: 0, why: L('append grows the backing array automatically. Small slices roughly double their capacity.', 'append নিজে থেকে backing array বাড়ায়। ছোট slice মোটামুটি capacity দ্বিগুণ করে।') },
              }),
              step('print', L('len 3, cap 4. If we had written just <code>append(s, 30)</code> without <code>s =</code>, s would still be the old header with len 2.', 'len 3, cap 4। <code>s =</code> ছাড়া শুধু <code>append(s, 30)</code> লিখলে s থাকত পুরনো header, len 2।'), [headers([hdr('s', 3, 4)]), backing('a2', [10, 20, 30, 0], t2, (i) => i < 3), out(['3 4'], 1)], { arrows: [{ from: 's-ptr', to: 'a2-0' }], tone: 'ok' }),
            ];
          },
        },
        {
          label: L('Two slices, one array (aliasing)', 'দুটো slice, একটা array (aliasing)'),
          code: `
package main

import "fmt"

func main() {
	a := []int{1, 2, 3, 4, 5} @@a
	b := a[1:3] // {b sees a[1] and a[2]|b দেখে a[1] আর a[2]} @@b
	b[0] = 99 // {also changes a[1]!|a[1]-ও বদলায়!} @@w
	b = append(b, 77) // {fits in cap: overwrites a[3]|cap-এ জায়গা আছে: a[3] মুছে লেখে} @@app
	fmt.Println(a) @@print
	fmt.Println(b) @@print2
}`,
          build() {
            const T = L('Shared backing array', 'ভাগাভাগি করা backing array');
            const arr = (vals, changed, bLen) => ({ type: 'array', id: 'x', title: T, cells: vals.map((v, i) => ({ v, cls: i === changed ? 'cur' : i >= 1 && i < 1 + bLen ? 'win' : 'live' })) });
            const ar = [{ from: 'a-ptr', to: 'x-0' }];
            const br = [{ from: 'a-ptr', to: 'x-0' }, { from: 'b-ptr', to: 'x-1', cls: 'w' }];
            return [
              step('a', L('a covers all 5 elements: len 5, cap 5.', 'a পাঁচটা উপাদানই ঢাকে: len 5, cap 5।'), [headers([hdr('a', 5, 5, 'hl new')]), arr([1, 2, 3, 4, 5], -1, 0)], { arrows: ar }),
              step('b', L('<code>a[1:3]</code> makes a new <b>header</b>, not a new array. b starts at index 1, len 2, and cap 4 (everything from index 1 to the end).', '<code>a[1:3]</code> নতুন <b>header</b> বানায়, নতুন array না। b শুরু index 1 থেকে, len 2, আর cap 4 (index 1 থেকে শেষ পর্যন্ত সব)।'), [headers([hdr('a', 5, 5), hdr('b', 2, 4, 'hl new')]), arr([1, 2, 3, 4, 5], -1, 2)], { arrows: br }),
              step('w', L('<code>b[0] = 99</code> writes into the shared array, so a[1] is now 99 too.', '<code>b[0] = 99</code> ভাগের array-তে লেখে, তাই a[1]-ও এখন 99।'), [headers([hdr('a', 5, 5), hdr('b', 2, 4)]), arr([1, 99, 3, 4, 5], 1, 2)], { arrows: br }),
              step('app', L('b has len 2 but cap 4, so append has room. It writes 77 into the next slot, which is <b>a[3]</b>. No new array.', 'b-এর len 2 কিন্তু cap 4, তাই append-এর জায়গা আছে। এটা পরের slot-এ 77 লেখে, যেটা আসলে <b>a[3]</b>। নতুন array হয় না।'), [headers([hdr('a', 5, 5), hdr('b', 3, 4, 'hl')]), arr([1, 99, 3, 77, 5], 3, 3)], {
                arrows: br,
                ask: { q: L('What will <code>fmt.Println(a)</code> print?', '<code>fmt.Println(a)</code> কী print করবে?'), options: ['[1 99 3 77 5]', '[1 2 3 4 5]', '[1 99 3 4 5]'], answer: 0, why: L('Both writes went into the array that a also uses.', 'দুটো লেখাই সেই array-তে গেছে যেটা a-ও ব্যবহার করে।') },
              }),
              step('print', L('a changed even though we never wrote to a. This is <b>aliasing</b>.', 'আমরা a-তে কখনো লিখিনি, তবুও a বদলে গেছে। একে বলে <b>aliasing</b>।'), [headers([hdr('a', 5, 5), hdr('b', 3, 4)]), arr([1, 99, 3, 77, 5], -1, 3), out(['[1 99 3 77 5]'], 1)], { arrows: br, tone: 'bad' }),
              step('print2', L('To give b its own memory, copy it, or limit its capacity with a full slice expression <code>a[1:3:3]</code> so the next append must allocate.', 'b-কে নিজস্ব মেমরি দিতে কপি করুন, অথবা full slice expression <code>a[1:3:3]</code> দিয়ে capacity সীমিত করুন, যাতে পরের append নতুন array নিতে বাধ্য হয়।'), [headers([hdr('a', 5, 5), hdr('b', 3, 4)]), arr([1, 99, 3, 77, 5], -1, 3), out(['[1 99 3 77 5]', '[99 3 77]'], 1)], { arrows: br }),
            ];
          },
        },
      ],
    },
    walk: [
      { at: 'make', ex: 0, code: 'make([]int, 0, 2)', text: L('Type, length, capacity. Pre-sizing capacity avoids repeated growth when you know the final size.', 'Type, length, capacity। শেষ size জানা থাকলে আগে capacity দিলে বারবার বাড়ানো লাগে না।') },
      { at: 'a1', ex: 0, code: 's = append(s, 10)', text: L('Always assign the result. append may return a header for a different array.', 'সবসময় ফলাফল assign করুন। append ভিন্ন array-এর header ফেরত দিতে পারে।') },
      { at: 'b', ex: 1, code: 'b := a[1:3]', text: L('Half-open range: from index 1 up to but not including 3. Shares memory with a.', 'অর্ধ-খোলা পরিসর: index 1 থেকে 3-এর আগে পর্যন্ত। a-এর সাথে মেমরি ভাগ করে।') },
      { at: 'app', ex: 1, code: 'b = append(b, 77)', text: L('Within capacity, append writes in place, possibly over data another slice can see.', 'Capacity-র মধ্যে append জায়গাতেই লেখে, হয়তো অন্য slice যে ডেটা দেখে তার উপর।') },
    ],
    mistakes: [
      { title: L('Calling append without assigning', 'Assign না করে append call'), err: './main.go:7:2: append(s, 30) (value of type []int) is not used', fix: L('Write <code>s = append(s, 30)</code>.', 'লিখুন <code>s = append(s, 30)</code>।') },
      { title: L('Indexing past len', 'len-এর বাইরে index'), err: 'panic: runtime error: index out of range [5] with length 5', fix: L('Valid indexes are 0 to len-1. Capacity does not make extra indexes valid; use append to grow.', 'সঠিক index 0 থেকে len-1। Capacity থাকলেও বাড়তি index বৈধ হয় না; বাড়াতে append ব্যবহার করুন।') },
      { title: L('Surprise writes through a sub-slice', 'Sub-slice দিয়ে অপ্রত্যাশিত লেখা'), err: '', fix: L('Sub-slices share memory. Use <code>copy</code>, <code>slices.Clone(s)</code>, or <code>a[lo:hi:hi]</code> when the new slice must be independent.', 'Sub-slice মেমরি ভাগ করে। নতুন slice স্বাধীন হতে হলে <code>copy</code>, <code>slices.Clone(s)</code>, বা <code>a[lo:hi:hi]</code> ব্যবহার করুন।') },
      { title: L('Assuming nil and empty differ for len', 'nil আর খালি slice-এর len আলাদা ভাবা'), err: '', fix: L('<code>var s []int</code> (nil) and <code>[]int{}</code> both have len 0 and both work with append and range. They differ in JSON: nil encodes as <code>null</code>, empty as <code>[]</code>.', '<code>var s []int</code> (nil) আর <code>[]int{}</code> দুটোরই len 0, দুটোই append আর range-এ চলে। পার্থক্য JSON-এ: nil হয় <code>null</code>, খালি হয় <code>[]</code>।') },
    ],
    perf: L([
      'Growing a slice means allocating and copying. If you know roughly how many items are coming, use <code>make([]T, 0, n)</code>. This is one of the cheapest, most effective optimisations in Go code.',
      'A small sub-slice of a huge array keeps the whole array alive in memory. If you keep a few bytes of a large buffer, copy them out.',
    ], [
      'Slice বাড়ানো মানে নতুন মেমরি নেওয়া আর কপি করা। কতগুলো উপাদান আসবে মোটামুটি জানলে <code>make([]T, 0, n)</code> ব্যবহার করুন। Go কোডে এটা সবচেয়ে সস্তা আর কার্যকর optimisation-গুলোর একটা।',
      'বিশাল array-এর ছোট একটা sub-slice রাখলেও পুরো array মেমরিতে থেকে যায়। বড় buffer থেকে কয়েক byte রাখতে চাইলে কপি করে নিন।',
    ]),
    quiz: [
      { q: L('<code>s := make([]int, 3, 10)</code>. What are len(s) and cap(s)?', '<code>s := make([]int, 3, 10)</code>। len(s) আর cap(s) কত?'), options: ['3 and 10', '10 and 3', '0 and 10'], answer: 0, why: L('The second argument is length, the third is capacity. The 3 visible elements are zero.', 'দ্বিতীয় argument length, তৃতীয়টা capacity। দৃশ্যমান 3টা উপাদান শূন্য।') },
      { q: L('<code>b := a[2:4]</code> where len(a) is 6. What is cap(b)?', 'len(a) = 6, <code>b := a[2:4]</code>। cap(b) কত?'), options: ['4', '2', '6'], answer: 0, why: L('Capacity runs from b\'s start (index 2) to the end of a\'s array: 6 − 2 = 4.', 'Capacity হলো b-এর শুরু (index 2) থেকে a-এর array-এর শেষ পর্যন্ত: 6 − 2 = 4।') },
      { q: L('Why must you write <code>s = append(s, x)</code>?', 'কেন <code>s = append(s, x)</code> লিখতে হয়?'), options: [L('append may return a header for a new array', 'append নতুন array-এর header ফেরত দিতে পারে'), L('It is just a style rule', 'এটা শুধু স্টাইলের নিয়ম'), L('append is slow otherwise', 'নইলে append ধীর')], answer: 0, why: L('The header holds len, which append changes; and growth changes the pointer too.', 'Header-এ len থাকে, যেটা append বদলায়; আর বাড়লে pointer-ও বদলায়।') },
    ],
    exercises: [
      { title: L('Remove an element', 'একটা উপাদান মুছুন'),
        task: L('Write <code>func remove(s []int, i int) []int</code> that returns s without the element at index i, keeping order. Then explain what happened to the original slice you passed in.', '<code>func remove(s []int, i int) []int</code> লিখুন যেটা ক্রম ঠিক রেখে index i-এর উপাদান বাদ দিয়ে s ফেরত দেয়। তারপর ব্যাখ্যা করুন যে মূল slice পাঠিয়েছিলেন তার কী হলো।'),
        hints: [L('<code>append(s[:i], s[i+1:]...)</code> joins the parts before and after i.', '<code>append(s[:i], s[i+1:]...)</code> i-এর আগের আর পরের অংশ জোড়া দেয়।'), L('That append writes into the same array, shifting values left. Print the original afterwards.', 'ওই append একই array-তে লিখে মানগুলো বামে সরায়। পরে মূলটা print করে দেখুন।')],
        solution: `package main

import "fmt"

func remove(s []int, i int) []int {
	return append(s[:i], s[i+1:]...) // {shifts left in the SAME array|একই array-তে বামে সরায়}
}

func main() {
	a := []int{10, 20, 30, 40}
	b := remove(a, 1)
	fmt.Println(b) // {[10 30 40]|[10 30 40]}
	fmt.Println(a) // {[10 30 40 40]: a was modified|[10 30 40 40]: a বদলে গেছে}
}` },
      { title: L('An independent copy', 'স্বাধীন কপি'),
        task: L('Given <code>a := []int{1, 2, 3}</code>, make <code>b</code> a real copy using <code>make</code> and <code>copy</code>. Change <code>b[0]</code> and show that a is unchanged.', '<code>a := []int{1, 2, 3}</code> থেকে <code>make</code> আর <code>copy</code> দিয়ে <code>b</code>-কে আসল কপি বানান। <code>b[0]</code> বদলে দেখান a অপরিবর্তিত।'),
        hints: [L('The destination needs length, not just capacity: <code>make([]int, len(a))</code>.', 'Destination-এর length লাগবে, শুধু capacity না: <code>make([]int, len(a))</code>।'), L('<code>copy(dst, src)</code> returns how many elements it copied.', '<code>copy(dst, src)</code> কয়টা উপাদান কপি হলো তা ফেরত দেয়।')],
        solution: `package main

import "fmt"

func main() {
	a := []int{1, 2, 3}
	b := make([]int, len(a)) // {new backing array|নতুন backing array}
	copy(b, a)
	b[0] = 100
	fmt.Println(a, b) // {[1 2 3] [100 2 3]|[1 2 3] [100 2 3]}
}` },
    ],
    takeaways: [
      L('A slice is a header: pointer, len, cap. The data lives in a backing array.', 'Slice হলো একটা header: pointer, len, cap। ডেটা থাকে backing array-তে।'),
      L('Slicing and assigning share the array. Writes through one slice can show up in another.', 'Slice করা আর assign করা array ভাগ করে। এক slice দিয়ে লিখলে অন্যটাতেও দেখা যেতে পারে।'),
      L('append writes in place when there is capacity, otherwise it allocates a bigger array.', 'Capacity থাকলে append জায়গাতেই লেখে, নইলে বড় array নেয়।'),
      L('Always <code>s = append(s, ...)</code>, and pre-size with make when you can.', 'সবসময় <code>s = append(s, ...)</code>, আর সম্ভব হলে make দিয়ে আগে থেকে size দিন।'),
    ],
    links: [
      { t: 'Go blog: Go Slices: usage and internals', url: 'https://go.dev/blog/slices-intro' },
      { t: 'Go blog: Arrays, slices (and strings): the mechanics of append', url: 'https://go.dev/blog/slices' },
      { t: 'Package slices', url: 'https://pkg.go.dev/slices' },
    ],
  });
})();
