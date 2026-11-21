(function () {
  const { L, step } = GV;
  const view = (nums, l, r, cls) => ({ type: 'array', title: L('nums (sorted)', 'nums (সাজানো)'), cells: nums.map((v, i) => ({ v, cls: (i === l || i === r) ? (cls || 'cur') : i > l && i < r ? 'live' : 'dim' })), ptrs: { l, r } });
  const vars = (l, r, sum, target) => ({ type: 'boxes', items: [{ name: 'l', type: 'int', val: l }, { name: 'r', type: 'int', val: r }, { name: 'sum', type: 'int', val: sum == null ? '–' : sum, cls: sum == null ? '' : sum === target ? 'ok' : 'hl' }, { name: 'target', type: 'int', val: target }] });

  GV.register({
    id: 'dsa-two-pointers', track: 'dsa', phase: 'patterns', order: 2, minutes: 12,
    title: L('Two pointers', 'Two pointers'),
    summary: L('Walk two markers inward from both ends of a sorted slice to find a pair with a given sum in one pass, no nested loops.', 'সাজানো slice-এর দুই প্রান্ত থেকে দুটো মার্কার ভেতরের দিকে এনে এক পাসেই নির্দিষ্ট যোগফলের জোড়া খুঁজুন, nested loop ছাড়াই।'),
    idea: L([
      'The brute-force way to find two numbers that add up to a target checks every pair: O(n²). With <b>sorted</b> input there is a smarter way. Put one finger on the smallest value (l) and one on the largest (r). If their sum is too small, the only way to grow it is to move l right. If it is too big, move r left. Every move rules out one value for good, so you finish in one pass.',
      'Picture two people walking toward each other along a row of price tags, trying to find two items that exactly match a gift card. Too cheap, the left person steps right; too expensive, the right person steps left.',
    ], [
      'Target-এর সমান যোগফলের দুটো সংখ্যা খোঁজার সহজ পদ্ধতি প্রতিটা জোড়া যাচাই করে: O(n²)। <b>সাজানো</b> input-এ আরও বুদ্ধিমান উপায় আছে। এক আঙুল সবচেয়ে ছোট মানে (l), আরেক আঙুল সবচেয়ে বড় মানে (r)। যোগফল খুব ছোট হলে বাড়ানোর একমাত্র উপায় l ডানে সরানো। খুব বড় হলে r বামে সরান। প্রতিটা সরানো একটা মানকে চিরতরে বাদ দেয়, তাই এক পাসেই শেষ।',
      'দামের ট্যাগের সারি ধরে দুজন মানুষ একে অপরের দিকে হাঁটছে, একটা গিফট কার্ডের সাথে ঠিক মেলে এমন দুটো জিনিস খুঁজছে, এমন কল্পনা করুন। খুব সস্তা হলে বামের জন ডানে এক পা, খুব দামি হলে ডানের জন বামে এক পা।',
    ]),
    complexity: { time: 'O(n)', space: 'O(1)', note: L('Each step moves one pointer, and they meet after at most n − 1 steps.', 'প্রতিটা ধাপে একটা pointer সরে, আর সর্বোচ্চ n − 1 ধাপে তারা মেলে।') },
    visual: {
      file: 'two_pointers.go',
      legend: [{ cls: 'cur', label: L('l and r', 'l আর r') }, { cls: 'live', label: L('still in play', 'এখনো খেলায়') }, { cls: 'dim', label: L('ruled out', 'বাদ') }, { cls: 'ok', label: L('pair found', 'জোড়া পাওয়া গেছে') }],
      examples: [
        {
          label: L('Pair with a target sum', 'Target যোগফলের জোড়া'),
          inputs: [
            { key: 'nums', label: L('Sorted numbers', 'সাজানো সংখ্যা'), type: 'list', def: [1, 3, 4, 6, 8, 11, 14], maxLen: 12 },
            { key: 'target', label: L('Target sum', 'Target যোগফল'), type: 'int', def: 17 },
          ],
          code: `
func pairSum(nums []int, target int) (int, int) {
	l, r := 0, len(nums)-1 @@init
	for l < r { @@cond
		sum := nums[l] + nums[r] @@sum
		if sum == target { @@eq
			return l, r @@found
		}
		if sum < target { @@lt
			l++ // {need a bigger sum|বড় যোগফল দরকার} @@incl
		} else {
			r-- // {need a smaller sum|ছোট যোগফল দরকার} @@decr
		}
	}
	return -1, -1 @@miss
}`,
          build({ nums, target }) {
            for (let i = 1; i < nums.length; i++) if (nums[i] < nums[i - 1]) throw new GV.InputError(L('Two pointers from both ends needs sorted input.', 'দুই প্রান্ত থেকে two pointers-এর জন্য সাজানো input লাগে।'));
            const s = [];
            let l = 0, r = nums.length - 1, asked = false;
            s.push(step('init', L('l starts at the smallest value, r at the largest.', 'l শুরু সবচেয়ে ছোট মানে, r সবচেয়ে বড় মানে।'), [view(nums, l, r), vars(l, r, null, target)]));
            while (l < r) {
              const sum = nums[l] + nums[r];
              s.push(step('sum', L(`sum = nums[${l}] + nums[${r}] = ${nums[l]} + ${nums[r]} = ${sum}.`, `sum = nums[${l}] + nums[${r}] = ${nums[l]} + ${nums[r]} = ${sum}।`), [view(nums, l, r), vars(l, r, sum, target)]));
              if (sum === target) {
                s.push(step('found', L(`Match: indexes ${l} and ${r}. Found in ${s.filter((x) => x.line === 'sum').length} checks instead of up to ${nums.length * (nums.length - 1) / 2} pairs.`, `মিলেছে: index ${l} আর ${r}। সর্বোচ্চ ${nums.length * (nums.length - 1) / 2}টা জোড়ার বদলে ${s.filter((x) => x.line === 'sum').length}টা যাচাইয়েই।`), [view(nums, l, r, 'ok'), vars(l, r, sum, target)], { tone: 'ok' }));
                return s;
              }
              const small = sum < target;
              const extra = !asked ? { ask: { q: L(`sum is ${sum}, target is ${target}. Which pointer moves?`, `sum ${sum}, target ${target}। কোন pointer সরবে?`), options: small ? [L('l moves right', 'l ডানে সরবে'), L('r moves left', 'r বামে সরবে')] : [L('r moves left', 'r বামে সরবে'), L('l moves right', 'l ডানে সরবে')], answer: 0, why: small ? L(`Moving l right is the only way to get a bigger sum. nums[${l}] can never be part of the answer, because even paired with the largest value it is too small.`, `l ডানে সরানোই বড় যোগফলের একমাত্র উপায়। nums[${l}] কখনো উত্তরের অংশ হতে পারবে না, কারণ সবচেয়ে বড় মানের সাথেও এটা খুব ছোট।`) : L(`Moving r left shrinks the sum. nums[${r}] is too big even with the smallest value.`, `r বামে সরালে যোগফল কমে। সবচেয়ে ছোট মানের সাথেও nums[${r}] খুব বড়।`) } } : {};
              asked = true;
              if (small) { l++; s.push(step('incl', L(`${sum} &lt; ${target}: too small, so l moves right to ${l}.`, `${sum} &lt; ${target}: খুব ছোট, তাই l ডানে সরে ${l}-এ।`), [view(nums, l, r), vars(l, r, null, target)], extra)); }
              else { r--; s.push(step('decr', L(`${sum} &gt; ${target}: too big, so r moves left to ${r}.`, `${sum} &gt; ${target}: খুব বড়, তাই r বামে সরে ${r}-এ।`), [view(nums, l, r), vars(l, r, null, target)], extra)); }
            }
            s.push(step('miss', L('The pointers met without a match: no such pair.', 'মিল ছাড়াই pointer দুটো মিলে গেল: এমন কোনো জোড়া নেই।'), [view(nums, l, r), vars(l, r, null, target)], { tone: 'bad' }));
            return s;
          },
        },
      ],
    },
    walk: [
      { at: 'init', code: 'l, r := 0, len(nums)-1', text: L('Two indexes at opposite ends.', 'বিপরীত দুই প্রান্তে দুটো index।') },
      { at: 'cond', code: 'for l < r {', text: L('Strict: a pair needs two different positions.', 'কঠোর শর্ত: জোড়ায় দুটো আলাদা অবস্থান লাগে।') },
      { at: 'incl', code: 'l++', text: L('Discards nums[l] permanently: it is too small to pair with anything left.', 'nums[l] চিরতরে বাদ: বাকি কারো সাথে জোড়া হওয়ার জন্য এটা খুব ছোট।') },
    ],
    mistakes: [
      { title: L('Using it on unsorted input', 'না সাজানো input-এ ব্যবহার'), err: '', fix: L('The "too small, move left pointer" logic only holds when values increase. For unsorted data, use the hash-map approach (Two Sum lesson).', '"খুব ছোট, বাম pointer সরাও" যুক্তি শুধু মান বাড়তে থাকলেই খাটে। না সাজানো ডেটায় hash-map পদ্ধতি ব্যবহার করুন (Two Sum লেসন)।') },
      { title: L('Using l <= r', 'l <= r ব্যবহার'), err: '', fix: L('That would pair an element with itself. Use l &lt; r.', 'তাতে একটা উপাদান নিজের সাথেই জোড়া হতো। l &lt; r ব্যবহার করুন।') },
      { title: L('Moving both pointers at once', 'একসাথে দুটো pointer সরানো'), err: '', fix: L('You might skip the answer. Move exactly one pointer per step, based on the comparison.', 'উত্তর বাদ পড়ে যেতে পারে। তুলনার উপর ভিত্তি করে প্রতি ধাপে ঠিক একটা pointer সরান।') },
    ],
    quiz: [
      { q: L('Why is two pointers O(n) here?', 'এখানে two pointers কেন O(n)?'), options: [L('Each step permanently discards one element', 'প্রতিটা ধাপে একটা উপাদান চিরতরে বাদ যায়'), L('It uses a map', 'এটা map ব্যবহার করে'), L('It sorts first', 'আগে সাজায়')], answer: 0, why: L('n − 1 discards at most, then the pointers meet.', 'সর্বোচ্চ n − 1 বার বাদ, তারপর pointer মেলে।') },
      { q: L('sum &gt; target. What next?', 'sum &gt; target। এরপর কী?'), options: ['r--', 'l++', L('return -1', 'return -1')], answer: 0, why: L('Only a smaller right value can reduce the sum.', 'শুধু ছোট ডান মানই যোগফল কমাতে পারে।') },
      { q: L('Another classic two-pointer task is…', 'আরেকটা প্রচলিত two-pointer কাজ হলো…'), options: [L('Checking whether a string is a palindrome', 'একটা string palindrome কিনা দেখা'), L('Counting word frequencies', 'শব্দের পুনরাবৃত্তি গোনা'), L('Finding a shortest path', 'সবচেয়ে ছোট পথ খোঁজা')], answer: 0, why: L('Compare from both ends and move inward.', 'দুই প্রান্ত থেকে তুলনা করে ভেতরে আসা।') },
    ],
    exercises: [
      { title: L('Palindrome check', 'Palindrome যাচাই'),
        task: L('Write <code>isPalindrome(s string) bool</code> using two pointers on bytes. "racecar" is true, "go" is false.', 'Byte-এর উপর two pointers দিয়ে <code>isPalindrome(s string) bool</code> লিখুন। "racecar" true, "go" false।'),
        hints: [L('i from the start, j from the end; compare s[i] and s[j].', 'শুরু থেকে i, শেষ থেকে j; s[i] আর s[j] তুলনা।'), L('For Bangla text, convert to []rune first (strings lesson).', 'বাংলা লেখার জন্য আগে []rune-এ রূপান্তর করুন (string লেসন)।')],
        solution: `package main

import "fmt"

func isPalindrome(s string) bool {
	for i, j := 0, len(s)-1; i < j; i, j = i+1, j-1 {
		if s[i] != s[j] {
			return false
		}
	}
	return true
}

func main() {
	fmt.Println(isPalindrome("racecar"), isPalindrome("go"))
}` },
      { title: L('Remove duplicates in place', 'জায়গাতেই পুনরাবৃত্তি মুছুন'),
        task: L('Given a sorted slice, keep one copy of each value at the front and return the new length. <code>[1, 1, 2, 3, 3]</code> becomes <code>[1, 2, 3]</code> with length 3. Use a slow pointer (write position) and a fast pointer (read position).', 'একটা সাজানো slice-এ প্রতিটা মানের একটা কপি সামনে রেখে নতুন length ফেরত দিন। <code>[1, 1, 2, 3, 3]</code> হবে <code>[1, 2, 3]</code>, length 3। একটা ধীর pointer (লেখার অবস্থান) আর একটা দ্রুত pointer (পড়ার অবস্থান) ব্যবহার করুন।'),
        hints: [L('Both pointers move left to right here, at different speeds.', 'এখানে দুটো pointer-ই বাম থেকে ডানে চলে, আলাদা গতিতে।'), L('Write only when nums[fast] differs from the last written value.', 'nums[fast] শেষ লেখা মানের থেকে আলাদা হলেই কেবল লিখুন।')],
        solution: `package main

import "fmt"

func dedupe(nums []int) int {
	if len(nums) == 0 {
		return 0
	}
	slow := 1
	for fast := 1; fast < len(nums); fast++ {
		if nums[fast] != nums[slow-1] {
			nums[slow] = nums[fast] // {write the next unique value|পরের অনন্য মান লেখো}
			slow++
		}
	}
	return slow
}

func main() {
	a := []int{1, 1, 2, 3, 3}
	n := dedupe(a)
	fmt.Println(a[:n], n)
}` },
    ],
    takeaways: [
      L('Two pointers on sorted data turns many O(n²) pair searches into O(n).', 'সাজানো ডেটায় two pointers অনেক O(n²) জোড়া-খোঁজাকে O(n) বানায়।'),
      L('Each move must permanently rule something out; that is the correctness argument.', 'প্রতিটা সরানো চিরতরে কিছু বাদ দিতে হবে; এটাই সঠিকতার যুক্তি।'),
      L('Pointers can move toward each other or in the same direction at different speeds.', 'Pointer একে অপরের দিকে, বা একই দিকে আলাদা গতিতে চলতে পারে।'),
    ],
    links: [{ t: 'Go by Example: Slices', url: 'https://gobyexample.com/slices' }],
  });
})();
