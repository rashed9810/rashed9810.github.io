(function () {
  const { L, step } = GV;
  const view = (nums, start, k, cls) => ({ type: 'array', title: L('nums', 'nums'), cells: nums.map((v, i) => ({ v, cls: cls && cls[i] ? cls[i] : i >= start && i < start + k ? 'win' : '' })), ptrs: start >= 0 ? { start, end: start + k - 1 } : {}, tagCls: { start: 'a', end: 'b' } });
  const vars = (sum, best, hl) => ({ type: 'boxes', items: [{ name: 'sum', type: 'int', val: sum, cls: hl === 'sum' ? 'hl' : '' }, { name: 'best', type: 'int', val: best == null ? '–' : best, cls: hl === 'best' ? 'ok' : '' }] });

  GV.register({
    id: 'dsa-sliding-window', track: 'dsa', phase: 'patterns', order: 3, minutes: 12,
    title: L('Sliding window', 'Sliding window'),
    summary: L('Slide a fixed-size window across a list, adding the new item and dropping the old one, instead of re-adding everything.', 'নির্দিষ্ট আকারের একটা window তালিকার উপর দিয়ে সরান, সব আবার যোগ না করে নতুনটা যোগ আর পুরনোটা বাদ দিয়ে।'),
    idea: L([
      'Say you want the best 3-day sales total in a month. The slow way re-adds 3 numbers for every starting day. Notice that two neighbouring windows share most of their days: moving the window one step right only <b>adds</b> the new day and <b>drops</b> the oldest. That turns O(n×k) into O(n).',
      'It is like a train passing a platform: at each moment you only care about which carriage just arrived and which just left. Sliding windows power rate limiters ("requests in the last 60 seconds"), moving averages on metrics dashboards, and many string problems.',
    ], [
      'ধরুন এক মাসে সবচেয়ে ভালো ৩ দিনের বিক্রির মোট চান। ধীর পদ্ধতি প্রতিটা শুরুর দিনের জন্য আবার ৩টা সংখ্যা যোগ করে। খেয়াল করুন, পাশাপাশি দুটো window-এর বেশিরভাগ দিনই এক: window এক ধাপ ডানে সরালে শুধু নতুন দিনটা <b>যোগ</b> হয় আর সবচেয়ে পুরনোটা <b>বাদ</b> যায়। এতে O(n×k) হয়ে যায় O(n)।',
      'প্ল্যাটফর্ম পার হওয়া ট্রেনের মতো: প্রতিটা মুহূর্তে শুধু দেখার বিষয় কোন বগি এইমাত্র এলো আর কোনটা চলে গেল। Rate limiter ("শেষ ৬০ সেকেন্ডে কয়টা request"), metrics dashboard-এর moving average, আর অনেক string সমস্যা sliding window দিয়েই চলে।',
    ]),
    complexity: { time: 'O(n)', space: 'O(1)', note: L('Each element is added once and removed once.', 'প্রতিটা উপাদান একবার যোগ আর একবার বাদ হয়।') },
    visual: {
      file: 'sliding_window.go',
      legend: [{ cls: 'win', label: L('inside the window', 'window-এর ভেতরে') }, { cls: 'ok', label: L('entering', 'ঢুকছে') }, { cls: 'bad', label: L('leaving', 'বের হচ্ছে') }],
      examples: [
        {
          label: L('Maximum sum of k neighbours', 'k টা পাশাপাশি উপাদানের সর্বোচ্চ যোগফল'),
          inputs: [
            { key: 'nums', label: L('Numbers', 'সংখ্যা'), type: 'list', def: [4, 2, 1, 7, 8, 1, 2, 8, 1, 0], maxLen: 14 },
            { key: 'k', label: L('Window size k', 'Window আকার k'), type: 'int', def: 3, min: 1, max: 8 },
          ],
          code: `
func maxWindowSum(nums []int, k int) int {
	sum := 0
	for i := 0; i < k; i++ { @@first
		sum += nums[i]
	}
	best := sum @@best0
	for i := k; i < len(nums); i++ { @@slide
		sum += nums[i] - nums[i-k] // {add the new, drop the old|নতুনটা যোগ, পুরনোটা বাদ} @@move
		if sum > best { @@cmp
			best = sum @@upd
		}
	}
	return best @@ret
}`,
          build({ nums, k }) {
            if (k > nums.length) throw new GV.InputError(L('k must not be larger than the number of values.', 'k মানের সংখ্যার চেয়ে বড় হতে পারবে না।'));
            const s = [];
            let sum = 0;
            for (let i = 0; i < k; i++) sum += nums[i];
            s.push(step('first', L(`Add the first ${k} values once: sum = ${sum}.`, `প্রথম ${k}টা মান একবার যোগ: sum = ${sum}।`), [view(nums, 0, k), vars(sum, null, 'sum')]));
            let best = sum;
            s.push(step('best0', L('That is the best so far.', 'এটাই এখন পর্যন্ত সেরা।'), [view(nums, 0, k), vars(sum, best, 'best')]));
            let asked = false;
            for (let i = k; i < nums.length; i++) {
              const start = i - k + 1;
              const cls = {}; for (let x = start; x < i; x++) cls[x] = 'win'; cls[i] = 'ok'; cls[i - k] = 'bad';
              const extra = !asked ? { ask: { q: L(`The window slides right. Instead of re-adding ${k} numbers, what is the new sum?`, `Window ডানে সরছে। ${k}টা সংখ্যা আবার যোগ না করে নতুন sum কত?`), options: [`${sum} + ${nums[i]} − ${nums[i - k]} = ${sum + nums[i] - nums[i - k]}`, `${sum} + ${nums[i]} = ${sum + nums[i]}`, `${nums[i]}`], answer: 0, why: L('Add the value entering on the right, subtract the one leaving on the left.', 'ডানে যেটা ঢুকছে সেটা যোগ, বামে যেটা বের হচ্ছে সেটা বিয়োগ।') } } : {};
              asked = true;
              const old = sum;
              sum += nums[i] - nums[i - k];
              s.push(step('move', L(`Slide: add nums[${i}] = ${nums[i]}, drop nums[${i - k}] = ${nums[i - k]}. sum = ${old} + ${nums[i]} − ${nums[i - k]} = ${sum}.`, `সরানো: nums[${i}] = ${nums[i]} যোগ, nums[${i - k}] = ${nums[i - k]} বাদ। sum = ${old} + ${nums[i]} − ${nums[i - k]} = ${sum}।`), [view(nums, start, k, cls), vars(sum, best, 'sum')], extra));
              if (sum > best) {
                best = sum;
                s.push(step('upd', L(`${sum} beats the previous best. best = ${best}.`, `${sum} আগের সেরাকে হারাল। best = ${best}।`), [view(nums, start, k), vars(sum, best, 'best')]));
              } else {
                s.push(step('cmp', L(`${sum} is not more than ${best}. Keep best.`, `${sum}, ${best}-এর চেয়ে বেশি না। best যেমন আছে।`), [view(nums, start, k), vars(sum, best)]));
              }
            }
            s.push(step('ret', L(`The best window sum is ${best}, found with ${nums.length - k} slides instead of ${(nums.length - k + 1) * k} additions.`, `সবচেয়ে ভালো window যোগফল ${best}, ${(nums.length - k + 1) * k}টা যোগের বদলে ${nums.length - k}টা সরানোতেই।`), [view(nums, -1, 0), vars(sum, best, 'best')], { tone: 'ok' }));
            return s;
          },
        },
      ],
    },
    walk: [
      { at: 'first', code: 'for i := 0; i < k; i++ { sum += nums[i] }', text: L('Build the first window once.', 'প্রথম window একবার তৈরি।') },
      { at: 'move', code: 'sum += nums[i] - nums[i-k]', text: L('The whole trick in one line: O(1) work per slide.', 'পুরো কৌশল এক লাইনে: প্রতি সরানোতে O(1) কাজ।') },
    ],
    mistakes: [
      { title: L('Off-by-one on the dropped index', 'বাদ দেওয়া index-এ এক-ঘর ভুল'), err: '', fix: L('When i enters, the leaving index is i − k, not i − k + 1. Check with a tiny example by hand.', 'i ঢুকলে বের হওয়া index হলো i − k, i − k + 1 না। ছোট একটা উদাহরণ হাতে করে যাচাই করুন।') },
      { title: L('Not handling k larger than the input', 'Input-এর চেয়ে বড় k না সামলানো'), err: 'panic: runtime error: index out of range [3] with length 3', fix: L('Validate k ≤ len(nums) and decide what to return otherwise.', 'k ≤ len(nums) যাচাই করুন, নইলে কী ফেরত দেবেন ঠিক করুন।') },
      { title: L('Starting best at 0', 'best-কে 0 দিয়ে শুরু করা'), err: '', fix: L('With all-negative numbers the answer is negative. Start best at the first window\'s sum.', 'সব ঋণাত্মক সংখ্যা হলে উত্তরও ঋণাত্মক। best শুরু করুন প্রথম window-এর যোগফল দিয়ে।') },
    ],
    quiz: [
      { q: L('How much work does each slide do?', 'প্রতিটা সরানোতে কত কাজ হয়?'), options: ['O(1)', 'O(k)', 'O(n)'], answer: 0, why: L('One addition and one subtraction.', 'একটা যোগ আর একটা বিয়োগ।') },
      { q: L('A rate limiter counting requests in the last minute is an example of…', 'শেষ এক মিনিটের request গোনা rate limiter হলো এর উদাহরণ…'), options: [L('a sliding window', 'sliding window'), L('binary search', 'binary search'), L('a stack', 'stack')], answer: 0, why: L('The window moves with time, adding new requests and dropping old ones.', 'সময়ের সাথে window সরে, নতুন request যোগ আর পুরনো বাদ।') },
      { q: L('With n = 10 and k = 3, how many windows are there?', 'n = 10, k = 3 হলে কয়টা window?'), options: ['8', '7', '10'], answer: 0, why: L('n − k + 1.', 'n − k + 1।') },
    ],
    exercises: [
      { title: L('Moving average', 'Moving average'),
        task: L('Return a slice of averages for every window of size k as float64. For <code>[2, 4, 6, 8]</code> and k = 2 the result is <code>[3 5 7]</code>.', 'k আকারের প্রতিটা window-এর গড় float64 slice হিসেবে ফেরত দিন। <code>[2, 4, 6, 8]</code> আর k = 2 হলে ফল <code>[3 5 7]</code>।'),
        hints: [L('Same loop; append sum / k at each step, converting with float64().', 'একই লুপ; প্রতি ধাপে sum / k append করুন, float64() দিয়ে রূপান্তর করে।'), L('Pre-size: make([]float64, 0, len(nums)-k+1).', 'আগে আকার দিন: make([]float64, 0, len(nums)-k+1)।')],
        solution: `package main

import "fmt"

func movingAvg(nums []int, k int) []float64 {
	out := make([]float64, 0, len(nums)-k+1)
	sum := 0
	for i, n := range nums {
		sum += n
		if i >= k {
			sum -= nums[i-k] // {drop the oldest|সবচেয়ে পুরনোটা বাদ}
		}
		if i >= k-1 {
			out = append(out, float64(sum)/float64(k))
		}
	}
	return out
}

func main() {
	fmt.Println(movingAvg([]int{2, 4, 6, 8}, 2))
}` },
      { title: L('Longest run without repeats', 'পুনরাবৃত্তি ছাড়া সবচেয়ে লম্বা অংশ'),
        task: L('Find the length of the longest substring of "abcabcbb" with no repeated byte (answer 3). This window grows and shrinks: move the left edge forward whenever a repeat appears.', '"abcabcbb"-এ কোনো byte পুনরাবৃত্তি ছাড়া সবচেয়ে লম্বা substring-এর দৈর্ঘ্য বের করুন (উত্তর 3)। এই window বাড়ে আর কমে: পুনরাবৃত্তি এলেই বাম প্রান্ত সামনে সরান।'),
        hints: [L('Keep <code>last := map[byte]int{}</code> with the last index of each byte.', 'প্রতিটা byte-এর শেষ index রাখতে <code>last := map[byte]int{}</code>।'), L('If s[r] was seen inside the window, set left = last[s[r]] + 1.', 's[r] যদি window-এর ভেতরে আগে দেখা যায়, left = last[s[r]] + 1।')],
        solution: `package main

import "fmt"

func longestUnique(s string) int {
	last := map[byte]int{}
	best, left := 0, 0
	for r := 0; r < len(s); r++ {
		if i, ok := last[s[r]]; ok && i >= left {
			left = i + 1 // {shrink past the repeat|পুনরাবৃত্তির পরে সরো}
		}
		last[s[r]] = r
		best = max(best, r-left+1)
	}
	return best
}

func main() {
	fmt.Println(longestUnique("abcabcbb")) // {3|3}
}` },
    ],
    takeaways: [
      L('Neighbouring windows overlap; update the total instead of recomputing it.', 'পাশাপাশি window একে অপরকে ঢাকে; আবার হিসাব না করে মোট আপডেট করুন।'),
      L('Fixed windows slide by one; variable windows grow on the right and shrink on the left.', 'নির্দিষ্ট window এক ঘর করে সরে; পরিবর্তনশীল window ডানে বাড়ে, বামে কমে।'),
      L('O(n) time, O(1) extra space for sums.', 'যোগফলের জন্য O(n) সময়, O(1) অতিরিক্ত মেমরি।'),
    ],
    links: [{ t: 'Go builtin: min and max (Go 1.21+)', url: 'https://pkg.go.dev/builtin#max' }],
  });
})();
