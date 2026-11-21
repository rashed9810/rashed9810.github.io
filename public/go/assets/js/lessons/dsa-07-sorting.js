(function () {
  const { L, step } = GV;
  const bars = (vals, cls, title) => ({ type: 'bars', wide: true, title: title || L('a', 'a'), vals: vals.slice(), cls });
  const counter = (cmp, sw, label2) => ({ type: 'boxes', items: [{ name: 'comparisons', type: 'count', val: cmp }, { name: label2 || 'swaps', type: 'count', val: sw }] });
  const check = (a) => { if (a.some((x) => x < 0 || x > 99)) throw new GV.InputError(L('Use numbers from 0 to 99 so the bars fit.', 'বার মানানোর জন্য 0 থেকে 99-এর সংখ্যা দিন।')); };

  GV.register({
    id: 'dsa-sorting', track: 'dsa', phase: 'structures', order: 2, minutes: 16,
    title: L('Sorting: bubble and insertion', 'Sorting: bubble আর insertion'),
    summary: L('Watch two simple O(n²) sorts compare and move values, count their work, and see why real code calls slices.Sort.', 'দুটো সহজ O(n²) sort-এ মানের তুলনা আর সরানো দেখুন, কাজ গুনুন, আর দেখুন আসল কোড কেন slices.Sort call করে।'),
    idea: L([
      '<b>Bubble sort</b> walks the slice comparing neighbours and swapping any pair in the wrong order. After each pass the largest remaining value has "bubbled" to the end, like a big bubble rising. If a whole pass makes no swaps, the slice is already sorted and we can stop early.',
      '<b>Insertion sort</b> is how you sort playing cards in your hand: take the next card, slide it left past every bigger card, and drop it into the gap. It is very fast on data that is already nearly sorted, which is why real sorting libraries use it for small pieces.',
      'Both take O(n²) time in the worst case. Production code uses <code>slices.Sort</code> (pattern-defeating quicksort, O(n log n)). Learning the simple ones teaches you how to count the work an algorithm does.',
    ], [
      '<b>Bubble sort</b> slice ধরে হাঁটে, পাশাপাশি দুটো তুলনা করে, ভুল ক্রমের জোড়া অদলবদল করে। প্রতিটা পাসের পর বাকি মানগুলোর সবচেয়ে বড়টা শেষে "ভেসে" যায়, বড় একটা বুদবুদের মতো। কোনো পাসে একটাও অদলবদল না হলে slice আগেই সাজানো, তাই আগেভাগেই থামা যায়।',
      '<b>Insertion sort</b> হলো হাতে তাস সাজানোর মতো: পরের তাসটা নিন, তার চেয়ে বড় প্রতিটা তাস পেরিয়ে বামে সরান, ফাঁকে বসিয়ে দিন। প্রায় সাজানো ডেটায় এটা খুব দ্রুত, এজন্যই আসল sorting library ছোট অংশের জন্য এটা ব্যবহার করে।',
      'দুটোরই সবচেয়ে খারাপ ক্ষেত্রে O(n²) সময় লাগে। Production কোড <code>slices.Sort</code> ব্যবহার করে (pattern-defeating quicksort, O(n log n))। সহজগুলো শিখলে বোঝা যায় একটা algorithm কতটা কাজ করে কীভাবে গুনতে হয়।',
    ]),
    complexity: { time: 'O(n²)', space: 'O(1)', note: L('Best case O(n) for both on already-sorted input (bubble with the early exit). slices.Sort is O(n log n).', 'আগে থেকে সাজানো input-এ দুটোরই সেরা ক্ষেত্রে O(n) (আগেভাগে থামাসহ bubble)। slices.Sort হলো O(n log n)।') },
    visual: {
      file: 'sorting.go',
      legend: [{ cls: 'cmp', label: L('being compared', 'তুলনা হচ্ছে') }, { cls: 'cur', label: L('just moved', 'এইমাত্র সরল') }, { cls: 'key', label: L('key being inserted', 'যে key বসানো হচ্ছে') }, { cls: 'ok', label: L('in final place', 'চূড়ান্ত জায়গায়') }],
      examples: [
        {
          label: L('Bubble sort', 'Bubble sort'),
          inputs: [{ key: 'a', label: L('Numbers (0–99)', 'সংখ্যা (0–99)'), type: 'list', def: [42, 17, 88, 5, 63, 29, 71], maxLen: 10 }],
          code: `
func bubbleSort(a []int) {
	n := len(a)
	for i := 0; i < n-1; i++ { @@outer
		swapped := false
		for j := 0; j < n-1-i; j++ { // {last i values are already in place|শেষ i টা মান আগেই জায়গায়} @@inner
			if a[j] > a[j+1] { @@cmp
				a[j], a[j+1] = a[j+1], a[j] @@swap
				swapped = true
			}
		}
		if !swapped { // {no swaps: already sorted|কোনো অদলবদল নেই: আগেই সাজানো} @@early
			return
		}
	}
}`,
          build({ a }) {
            check(a);
            a = a.slice();
            const n = a.length, s = [];
            let cmp = 0, sw = 0, asked = false;
            const done = new Set();
            const cl = (extra) => { const c = {}; done.forEach((k) => { c[k] = 'ok'; }); return Object.assign(c, extra || {}); };
            s.push(step('outer', L(`${n} values. Each pass pushes the largest remaining value to the end.`, `${n}টা মান। প্রতিটা পাস বাকিগুলোর সবচেয়ে বড়টাকে শেষে পাঠায়।`), [bars(a, cl()), counter(cmp, sw)]));
            for (let i = 0; i < n - 1; i++) {
              let swapped = false;
              s.push(step('outer', L(`Pass ${i + 1}.`, `পাস ${i + 1}।`), [bars(a, cl()), counter(cmp, sw)]));
              for (let j = 0; j < n - 1 - i; j++) {
                cmp++;
                const out = a[j] > a[j + 1];
                const extra = !asked ? { ask: { q: L(`Compare ${a[j]} and ${a[j + 1]}. Swap them?`, `${a[j]} আর ${a[j + 1]} তুলনা। অদলবদল হবে?`), options: out ? [L('Yes', 'হ্যাঁ'), L('No', 'না')] : [L('No', 'না'), L('Yes', 'হ্যাঁ')], answer: 0, why: L('Swap only when the left value is bigger.', 'শুধু বামেরটা বড় হলেই অদলবদল।') } } : {};
                asked = true;
                s.push(step('cmp', L(`Is ${a[j]} &gt; ${a[j + 1]}? ${out ? 'Yes.' : 'No, leave them.'}`, `${a[j]} &gt; ${a[j + 1]}? ${out ? 'হ্যাঁ।' : 'না, যেমন আছে থাক।'}`), [bars(a, cl({ [j]: 'cmp', [j + 1]: 'cmp' })), counter(cmp, sw)], extra));
                if (out) {
                  [a[j], a[j + 1]] = [a[j + 1], a[j]];
                  sw++; swapped = true;
                  s.push(step('swap', L(`Swap: ${a[j]} moves left, ${a[j + 1]} moves right.`, `অদলবদল: ${a[j]} বামে, ${a[j + 1]} ডানে।`), [bars(a, cl({ [j]: 'cur', [j + 1]: 'cur' })), counter(cmp, sw)]));
                }
              }
              done.add(n - 1 - i);
              if (!swapped) {
                for (let k = 0; k < n; k++) done.add(k);
                s.push(step('early', L(`No swaps in this pass, so the slice is sorted. Stop early after ${i + 1} pass${i === 0 ? '' : 'es'}.`, `এই পাসে কোনো অদলবদল নেই, তাই slice সাজানো। ${i + 1}টা পাসের পর আগেভাগেই থামা।`), [bars(a, cl()), counter(cmp, sw)], { tone: 'ok' }));
                return s;
              }
              s.push(step('early', L(`${a[n - 1 - i]} is now in its final place.`, `${a[n - 1 - i]} এখন চূড়ান্ত জায়গায়।`), [bars(a, cl()), counter(cmp, sw)]));
            }
            done.add(0);
            s.push(step('outer', L(`Sorted with ${cmp} comparisons and ${sw} swaps.`, `${cmp}টা তুলনা আর ${sw}টা অদলবদলে সাজানো হলো।`), [bars(a, cl()), counter(cmp, sw)], { tone: 'ok' }));
            return s;
          },
        },
        {
          label: L('Insertion sort', 'Insertion sort'),
          inputs: [{ key: 'a', label: L('Numbers (0–99)', 'সংখ্যা (0–99)'), type: 'list', def: [42, 17, 88, 5, 63, 29, 71], maxLen: 10 }],
          code: `
func insertionSort(a []int) {
	for i := 1; i < len(a); i++ { @@outer
		key := a[i] // {the card in your hand|হাতের তাসটা} @@key
		j := i - 1
		for j >= 0 && a[j] > key { @@cmp
			a[j+1] = a[j] // {shift the bigger value right|বড় মানটা ডানে সরাও} @@shift
			j--
		}
		a[j+1] = key // {drop it into the gap|ফাঁকে বসিয়ে দাও} @@place
	}
}`,
          build({ a }) {
            check(a);
            a = a.slice();
            const n = a.length, s = [];
            let cmp = 0, mv = 0, asked = false;
            const sortedUpTo = (i, extra) => { const c = {}; for (let k = 0; k < i; k++) c[k] = 'ok'; return Object.assign(c, extra || {}); };
            const keyBox = (k) => ({ type: 'boxes', items: [{ name: 'key', type: 'int', val: k == null ? '–' : k, cls: k == null ? '' : 'hl' }] });
            s.push(step('outer', L('The first value alone is a sorted hand of one card.', 'প্রথম মানটা একা, এক তাসের সাজানো হাত।'), [bars(a, sortedUpTo(1)), keyBox(null), counter(cmp, mv, 'shifts')]));
            for (let i = 1; i < n; i++) {
              const key = a[i];
              s.push(step('key', L(`Pick up key = a[${i}] = ${key}. Everything left of it is already sorted.`, `key = a[${i}] = ${key} তোলা। এর বামের সব আগেই সাজানো।`), [bars(a, sortedUpTo(i, { [i]: 'key' })), keyBox(key), counter(cmp, mv, 'shifts')]));
              let j = i - 1;
              while (j >= 0) {
                cmp++;
                const bigger = a[j] > key;
                const extra = !asked && i >= 2 ? { ask: { q: L(`key is ${key}. a[${j}] is ${a[j]}. Does ${a[j]} shift right?`, `key ${key}। a[${j}] = ${a[j]}। ${a[j]} কি ডানে সরবে?`), options: bigger ? [L('Yes', 'হ্যাঁ'), L('No, the key goes here', 'না, key এখানেই বসবে')] : [L('No, the key goes here', 'না, key এখানেই বসবে'), L('Yes', 'হ্যাঁ')], answer: 0, why: L('Values bigger than the key make room by shifting right.', 'Key-এর চেয়ে বড় মানগুলো ডানে সরে জায়গা করে দেয়।') } } : {};
                if (!asked && i >= 2) asked = true;
                s.push(step('cmp', L(`Is a[${j}] = ${a[j]} &gt; ${key}? ${bigger ? 'Yes.' : 'No.'}`, `a[${j}] = ${a[j]} &gt; ${key}? ${bigger ? 'হ্যাঁ।' : 'না।'}`), [bars(a, sortedUpTo(i + 1, { [j]: 'cmp' })), keyBox(key), counter(cmp, mv, 'shifts')], extra));
                if (!bigger) break;
                a[j + 1] = a[j];
                mv++;
                s.push(step('shift', L(`Shift ${a[j]} right into slot ${j + 1}. (Slot ${j} still shows the old copy until something overwrites it.)`, `${a[j]}-কে ডানে slot ${j + 1}-এ সরানো। (কিছু উপরে না লেখা পর্যন্ত slot ${j}-এ পুরনো কপি দেখায়।)`), [bars(a, sortedUpTo(i + 1, { [j + 1]: 'cur' })), keyBox(key), counter(cmp, mv, 'shifts')]));
                j--;
              }
              a[j + 1] = key;
              s.push(step('place', L(`Drop key ${key} into slot ${j + 1}. The first ${i + 1} values are sorted.`, `key ${key}-কে slot ${j + 1}-এ বসানো। প্রথম ${i + 1}টা মান সাজানো।`), [bars(a, sortedUpTo(i + 1, { [j + 1]: 'key' })), keyBox(key), counter(cmp, mv, 'shifts')]));
            }
            s.push(step('outer', L(`Sorted with ${cmp} comparisons and ${mv} shifts. Try an already sorted input: it needs only ${n - 1} comparisons.`, `${cmp}টা তুলনা আর ${mv}টা সরানোতে সাজানো। আগে থেকে সাজানো input দিয়ে দেখুন: মাত্র ${n - 1}টা তুলনা লাগে।`), [bars(a, sortedUpTo(n)), keyBox(null), counter(cmp, mv, 'shifts')], { tone: 'ok' }));
            return s;
          },
        },
      ],
    },
    walk: [
      { at: 'inner', ex: 0, code: 'for j := 0; j < n-1-i; j++', text: L('Shrinks each pass: the tail is already sorted.', 'প্রতি পাসে ছোট হয়: শেষের অংশ আগেই সাজানো।') },
      { at: 'swap', ex: 0, code: 'a[j], a[j+1] = a[j+1], a[j]', text: L('Go\'s tuple assignment swaps without a temp variable.', 'Go-র tuple assignment অস্থায়ী variable ছাড়াই অদলবদল করে।') },
      { at: 'cmp', ex: 1, code: 'for j >= 0 && a[j] > key', text: L('Short-circuit: j >= 0 is checked first, so a[-1] is never read.', 'Short-circuit: আগে j >= 0 যাচাই হয়, তাই a[-1] কখনো পড়া হয় না।') },
      { at: 'place', ex: 1, code: 'a[j+1] = key', text: L('j stopped one left of the gap.', 'j ফাঁকের এক ঘর বামে থেমেছে।') },
    ],
    mistakes: [
      { title: L('Off-by-one in the inner loop', 'ভেতরের লুপে এক-ঘর ভুল'), err: 'panic: runtime error: index out of range [7] with length 7', fix: L('With a[j+1], j must stop at n-2. Use j &lt; n-1-i.', 'a[j+1] থাকলে j-কে n-2-এ থামতে হবে। j &lt; n-1-i ব্যবহার করুন।') },
      { title: L('Writing your own sort in production', 'Production-এ নিজের sort লেখা'), err: '', fix: L('Use <code>slices.Sort(s)</code>, or <code>slices.SortFunc(s, cmp)</code> for custom order. They are tested, O(n log n), and fast.', '<code>slices.Sort(s)</code>, অথবা নিজের ক্রমের জন্য <code>slices.SortFunc(s, cmp)</code> ব্যবহার করুন। এগুলো পরীক্ষিত, O(n log n), আর দ্রুত।') },
      { title: L('Needing a stable sort', 'Stable sort দরকার'), err: '', fix: L('slices.Sort is not stable: equal elements may change order. Use <code>slices.SortStableFunc</code> when order of equals matters.', 'slices.Sort stable না: সমান উপাদানের ক্রম বদলাতে পারে। সমানদের ক্রম গুরুত্বপূর্ণ হলে <code>slices.SortStableFunc</code> ব্যবহার করুন।') },
    ],
    quiz: [
      { q: L('After pass 1 of bubble sort, what is guaranteed?', 'Bubble sort-এর পাস ১-এর পর কী নিশ্চিত?'), options: [L('The largest value is at the end', 'সবচেয়ে বড় মান শেষে'), L('The smallest value is at the start', 'সবচেয়ে ছোট মান শুরুতে'), L('The slice is half sorted', 'Slice অর্ধেক সাজানো')], answer: 0, why: L('It is carried right by every swap it wins.', 'প্রতিটা জেতা অদলবদলে এটা ডানে চলে যায়।') },
      { q: L('Which sort shines on nearly sorted input?', 'প্রায় সাজানো input-এ কোন sort ভালো?'), options: ['insertion sort', L('both equally', 'দুটোই সমান'), L('neither', 'কোনোটাই না')], answer: 0, why: L('Each key moves only a little, so the inner loop is short.', 'প্রতিটা key সামান্য সরে, তাই ভেতরের লুপ ছোট।') },
      { q: L('What should production Go code use to sort []int?', '[]int সাজাতে production Go কোড কী ব্যবহার করবে?'), options: ['slices.Sort', L('a hand-written bubble sort', 'হাতে লেখা bubble sort'), 'sort.Bubble'], answer: 0, why: L('Generic, fast, O(n log n).', 'Generic, দ্রুত, O(n log n)।') },
    ],
    exercises: [
      { title: L('Sort structs by a field', 'Field অনুযায়ী struct সাজানো'),
        task: L('Sort a slice of <code>User{Name string; Age int}</code> by Age, youngest first, using <code>slices.SortFunc</code> and <code>cmp.Compare</code>.', '<code>User{Name string; Age int}</code>-এর একটা slice Age অনুযায়ী সাজান, সবচেয়ে কম বয়সী আগে, <code>slices.SortFunc</code> আর <code>cmp.Compare</code> দিয়ে।'),
        hints: [L('The compare function returns negative, zero or positive.', 'Compare function ঋণাত্মক, শূন্য বা ধনাত্মক ফেরত দেয়।'), L('<code>func(a, b User) int { return cmp.Compare(a.Age, b.Age) }</code>', '<code>func(a, b User) int { return cmp.Compare(a.Age, b.Age) }</code>')],
        solution: `package main

import (
	"cmp"
	"fmt"
	"slices"
)

type User struct {
	Name string
	Age  int
}

func main() {
	users := []User{{"Rina", 31}, {"Arif", 24}, {"Mita", 28}}
	slices.SortFunc(users, func(a, b User) int {
		return cmp.Compare(a.Age, b.Age) // {ascending by age|বয়স অনুযায়ী ছোট থেকে বড়}
	})
	fmt.Println(users)
}` },
      { title: L('Count the work', 'কাজ গোনা'),
        task: L('Make bubble sort return how many comparisons it did. Try a sorted slice of 1,000 numbers and a reversed one. Explain the difference.', 'Bubble sort-কে কয়টা তুলনা করল তা ফেরত দিতে বলুন। 1,000টা সংখ্যার একটা সাজানো আর একটা উল্টো slice দিয়ে চালান। পার্থক্য ব্যাখ্যা করুন।'),
        hints: [L('Sorted input stops after one pass thanks to the early exit.', 'আগেভাগে থামার কারণে সাজানো input এক পাসেই থামে।'), L('Reversed input needs n(n−1)/2 comparisons.', 'উল্টো input-এ n(n−1)/2টা তুলনা লাগে।')],
        solution: `package main

import "fmt"

func bubbleCount(a []int) int {
	n, cmps := len(a), 0
	for i := 0; i < n-1; i++ {
		swapped := false
		for j := 0; j < n-1-i; j++ {
			cmps++
			if a[j] > a[j+1] {
				a[j], a[j+1] = a[j+1], a[j]
				swapped = true
			}
		}
		if !swapped {
			break
		}
	}
	return cmps
}

func main() {
	sorted := make([]int, 1000)
	reversed := make([]int, 1000)
	for i := range sorted {
		sorted[i] = i
		reversed[i] = 1000 - i
	}
	fmt.Println(bubbleCount(sorted), bubbleCount(reversed)) // {999 499500|999 499500}
}` },
    ],
    takeaways: [
      L('Bubble sort swaps neighbours; insertion sort slides each key into place.', 'Bubble sort পাশাপাশি অদলবদল করে; insertion sort প্রতিটা key জায়গামতো সরিয়ে বসায়।'),
      L('Both are O(n²) worst case, O(n) on sorted input.', 'দুটোই সবচেয়ে খারাপ ক্ষেত্রে O(n²), সাজানো input-এ O(n)।'),
      L('In real code use slices.Sort, SortFunc or SortStableFunc.', 'আসল কোডে slices.Sort, SortFunc বা SortStableFunc ব্যবহার করুন।'),
    ],
    links: [{ t: 'Package slices: Sort', url: 'https://pkg.go.dev/slices#Sort' }, { t: 'Package cmp', url: 'https://pkg.go.dev/cmp' }],
  });
})();
