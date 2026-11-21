(function () {
  const { L, step } = GV;
  const view = (nums, i, hit) => ({ type: 'array', title: L('nums', 'nums'), cells: nums.map((v, k) => ({ v, cls: k === i ? (hit ? 'ok' : 'cur') : k === hit ? 'ok' : k < i ? 'dim' : '' })), ptrs: { i } });
  const seen = (m, hl, cls) => ({ type: 'kv', title: L('seen: map[int]int  (value → index)', 'seen: map[int]int  (value → index)'), head: ['value', 'index'], rows: m.map(([v, ix]) => ({ k: v, v: ix, cls: v === hl ? cls || 'hl' : '' })) });
  const vars = (n, need) => ({ type: 'boxes', items: [{ name: 'n', type: 'int', val: n }, { name: 'need', type: 'int', val: need, cls: 'hl' }] });

  GV.register({
    id: 'dsa-two-sum', track: 'dsa', phase: 'patterns', order: 4, minutes: 12,
    title: L('Hash map: Two Sum', 'Hash map: Two Sum'),
    summary: L('Remember what you have seen in a map so each lookup is instant, turning a nested loop into a single pass. Works on unsorted data.', 'যা দেখেছেন তা একটা map-এ মনে রাখুন, যাতে প্রতিটা খোঁজা সাথে সাথে হয়; nested loop হয়ে যায় এক পাস। না সাজানো ডেটাতেও চলে।'),
    idea: L([
      'For each number n, the partner you need is <code>target − n</code>. Instead of scanning the rest of the slice for it (O(n²) overall), keep a notebook of every value seen so far and where it was. A map lookup is O(1) on average, so one pass is enough.',
      'Imagine a party where each guest needs a dance partner whose ticket number adds up to 17. Rather than each new guest asking everyone in the room, the host keeps a guest list. The new arrival with ticket 9 just asks: "is 8 already here?"',
      'This is the most common trade in algorithm design: spend memory (the map) to save time.',
    ], [
      'প্রতিটা সংখ্যা n-এর জন্য যে সঙ্গী লাগবে সে হলো <code>target − n</code>। বাকি slice খুঁজে দেখার বদলে (মোট O(n²)), এখন পর্যন্ত দেখা প্রতিটা মান আর তার অবস্থান একটা খাতায় লিখে রাখুন। Map-এ খোঁজা গড়ে O(1), তাই এক পাসই যথেষ্ট।',
      'একটা পার্টির কথা ভাবুন, যেখানে প্রত্যেক অতিথির এমন নাচের সঙ্গী লাগবে যার টিকিট নম্বর যোগ করলে 17 হয়। প্রতিটা নতুন অতিথি ঘরের সবাইকে জিজ্ঞেস না করে, আয়োজক একটা অতিথি তালিকা রাখেন। টিকিট 9 নিয়ে আসা নতুন অতিথি শুধু জিজ্ঞেস করে: "8 কি আগেই এসেছে?"',
      'এটাই algorithm ডিজাইনের সবচেয়ে প্রচলিত বিনিময়: সময় বাঁচাতে মেমরি (map) খরচ।',
    ]),
    complexity: { time: 'O(n)', space: 'O(n)', note: L('Compared with two pointers, this needs no sorting but uses memory for the map.', 'Two pointers-এর তুলনায় এতে সাজানো লাগে না, কিন্তু map-এর জন্য মেমরি লাগে।') },
    visual: {
      file: 'two_sum.go',
      legend: [{ cls: 'cur', label: L('current number', 'বর্তমান সংখ্যা') }, { cls: 'dim', label: L('already in the map', 'আগেই map-এ') }, { cls: 'ok', label: L('the pair', 'জোড়া') }],
      examples: [
        {
          label: L('Find two numbers that add up to target', 'যোগফল target হয় এমন দুটো সংখ্যা'),
          inputs: [
            { key: 'nums', label: L('Numbers (any order)', 'সংখ্যা (যেকোনো ক্রমে)'), type: 'list', def: [11, 3, 7, 15, 2, 9, 6], maxLen: 12 },
            { key: 'target', label: L('Target', 'Target'), type: 'int', def: 17 },
          ],
          code: `
func twoSum(nums []int, target int) (int, int) {
	seen := map[int]int{} // {value → index|value → index} @@init
	for i, n := range nums { @@loop
		need := target - n @@need
		if j, ok := seen[need]; ok { // {O(1) lookup|O(1) খোঁজা} @@look
			return j, i @@found
		}
		seen[n] = i @@store
	}
	return -1, -1 @@miss
}`,
          build({ nums, target }) {
            const s = [], m = [];
            let asked = false;
            s.push(step('init', L('An empty map. We will walk the slice once.', 'একটা খালি map। Slice-এর উপর একবার হাঁটব।'), [view(nums, -1), seen(m)]));
            for (let i = 0; i < nums.length; i++) {
              const n = nums[i], need = target - n;
              s.push(step('need', L(`i = ${i}, n = ${n}. The partner we need is ${target} − ${n} = ${need}.`, `i = ${i}, n = ${n}। দরকারি সঙ্গী হলো ${target} − ${n} = ${need}।`), [view(nums, i), seen(m), vars(n, need)]));
              const hit = m.find(([v]) => v === need);
              const extra = (!asked && m.length >= 2) ? { ask: { q: L(`Is ${need} already in the map?`, `${need} কি আগেই map-এ আছে?`), options: hit ? [L('Yes', 'হ্যাঁ'), L('No', 'না')] : [L('No', 'না'), L('Yes', 'হ্যাঁ')], answer: 0, why: L('Look at the table: the map holds every earlier value.', 'টেবিলটা দেখুন: map-এ আগের প্রতিটা মান আছে।') } } : {};
              if (!asked && m.length >= 2) asked = true;
              if (hit) {
                s.push(step('look', L(`${need} is in the map at index ${hit[1]}. One lookup, no scanning.`, `${need} map-এ আছে, index ${hit[1]}-এ। এক বার খোঁজা, পুরোটা দেখা লাগেনি।`), [view(nums, i), seen(m, need, 'ok'), vars(n, need)], extra));
                s.push(step('found', L(`Answer: indexes ${hit[1]} and ${i} (${need} + ${n} = ${target}).`, `উত্তর: index ${hit[1]} আর ${i} (${need} + ${n} = ${target})।`), [view(nums, i, hit[1]), seen(m, need, 'ok')], { tone: 'ok' }));
                return s;
              }
              s.push(step('look', L(`${need} is not in the map yet.`, `${need} এখনো map-এ নেই।`), [view(nums, i), seen(m), vars(n, need)], extra));
              m.push([n, i]);
              s.push(step('store', L(`Remember ${n} at index ${i}, so a later number can find it.`, `${n}-কে index ${i}-এ মনে রাখো, যাতে পরের কোনো সংখ্যা এটা খুঁজে পায়।`), [view(nums, i), seen(m, n, 'new')]));
            }
            s.push(step('miss', L('No pair adds up to the target.', 'কোনো জোড়ার যোগফল target হয় না।'), [view(nums, nums.length), seen(m)], { tone: 'bad' }));
            return s;
          },
        },
      ],
    },
    walk: [
      { at: 'init', code: 'seen := map[int]int{}', text: L('Keys are values, map values are indexes.', 'Key হলো মান, map-এর value হলো index।') },
      { at: 'look', code: 'if j, ok := seen[need]; ok {', text: L('Comma-ok tells "missing" from "index 0".', 'Comma-ok "নেই" আর "index 0" আলাদা করে।') },
      { at: 'store', code: 'seen[n] = i', text: L('Store after checking, so a number never pairs with itself.', 'যাচাইয়ের পরে রাখুন, যাতে একটা সংখ্যা নিজের সাথে জোড়া না হয়।') },
    ],
    mistakes: [
      { title: L('Storing before checking', 'যাচাইয়ের আগে রাখা'), err: '', fix: L('With target 10 and n = 5, storing first finds 5 itself. Check, then store.', 'Target 10 আর n = 5 হলে আগে রাখলে 5 নিজেকেই খুঁজে পায়। আগে যাচাই, তারপর রাখা।') },
      { title: L('Ignoring ok', 'ok উপেক্ষা'), err: '', fix: L('<code>seen[need]</code> returns 0 for a missing key, which is also a valid index. Always use the comma-ok form.', 'নেই এমন key-তে <code>seen[need]</code> 0 দেয়, যেটা একটা বৈধ index-ও। সবসময় comma-ok ফর্ম ব্যবহার করুন।') },
    ],
    quiz: [
      { q: L('What does the map trade for speed?', 'গতির বিনিময়ে map কী নেয়?'), options: [L('Memory: O(n) extra space', 'মেমরি: O(n) অতিরিক্ত জায়গা'), L('Correctness', 'সঠিকতা'), L('Nothing', 'কিছুই না')], answer: 0, why: L('Classic time–space trade-off.', 'প্রচলিত সময়–মেমরি বিনিময়।') },
      { q: L('Does this approach need sorted input?', 'এই পদ্ধতিতে কি সাজানো input লাগে?'), options: [L('No', 'না'), L('Yes', 'হ্যাঁ')], answer: 0, why: L('The map does not care about order.', 'Map ক্রমের পরোয়া করে না।') },
      { q: L('Average cost of one map lookup?', 'Map-এ একবার খোঁজার গড় খরচ?'), options: ['O(1)', 'O(log n)', 'O(n)'], answer: 0, why: L('Hashing jumps straight to the bucket.', 'Hashing সরাসরি bucket-এ পৌঁছায়।') },
    ],
    exercises: [
      { title: L('First repeated value', 'প্রথম পুনরাবৃত্ত মান'),
        task: L('Return the first value that appears twice in <code>[5, 1, 4, 1, 5]</code> (answer 1, because its second copy comes first). Use a set: <code>map[int]bool</code>.', '<code>[5, 1, 4, 1, 5]</code>-এ দুবার আসা প্রথম মান ফেরত দিন (উত্তর 1, কারণ এর দ্বিতীয় কপি আগে আসে)। একটা set ব্যবহার করুন: <code>map[int]bool</code>।'),
        hints: [L('Walk once; if seen[n] is already true, that is the answer.', 'একবার হাঁটুন; seen[n] আগেই true হলে সেটাই উত্তর।'), L('Return a second bool to signal "none found".', '"পাওয়া যায়নি" জানাতে দ্বিতীয় একটা bool ফেরত দিন।')],
        solution: `package main

import "fmt"

func firstRepeat(nums []int) (int, bool) {
	seen := map[int]bool{}
	for _, n := range nums {
		if seen[n] {
			return n, true
		}
		seen[n] = true
	}
	return 0, false
}

func main() {
	fmt.Println(firstRepeat([]int{5, 1, 4, 1, 5}))
}` },
      { title: L('Count pairs', 'জোড়া গোনা'),
        task: L('Count how many index pairs (i &lt; j) sum to the target. For <code>[1, 5, 7, -1, 5]</code> and target 6 the answer is 3.', 'কতগুলো index জোড়ার (i &lt; j) যোগফল target হয় গুনুন। <code>[1, 5, 7, -1, 5]</code> আর target 6 হলে উত্তর 3।'),
        hints: [L('Store counts instead of indexes: <code>map[int]int</code> of value → how many times seen.', 'Index-এর বদলে গণনা রাখুন: value → কতবার দেখা, এমন <code>map[int]int</code>।'), L('For each n, add count[target-n] to the answer, then increment count[n].', 'প্রতিটা n-এর জন্য উত্তরে count[target-n] যোগ, তারপর count[n] বাড়ান।')],
        solution: `package main

import "fmt"

func countPairs(nums []int, target int) int {
	count := map[int]int{}
	pairs := 0
	for _, n := range nums {
		pairs += count[target-n] // {every earlier partner forms a pair|আগের প্রতিটা সঙ্গী একটা জোড়া}
		count[n]++
	}
	return pairs
}

func main() {
	fmt.Println(countPairs([]int{1, 5, 7, -1, 5}, 6)) // {3|3}
}` },
    ],
    takeaways: [
      L('Store what you have seen; look up the complement in O(1).', 'যা দেখেছেন তা রাখুন; পরিপূরক O(1)-এ খুঁজুন।'),
      L('Check before storing to avoid pairing an element with itself.', 'নিজের সাথে জোড়া এড়াতে রাখার আগে যাচাই করুন।'),
      L('Use comma-ok, because 0 is a valid index.', 'Comma-ok ব্যবহার করুন, কারণ 0 একটা বৈধ index।'),
    ],
    links: [{ t: 'Go blog: Go maps in action', url: 'https://go.dev/blog/maps' }],
  });
})();
