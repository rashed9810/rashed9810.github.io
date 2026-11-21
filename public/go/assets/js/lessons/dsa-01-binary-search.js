(function () {
  const { L, step } = GV;
  const view = (nums, lo, hi, mid, found) => ({
    type: 'array', title: L('nums (sorted)', 'nums (সাজানো)'),
    cells: nums.map((v, i) => ({ v, cls: i === found ? 'ok' : i === mid ? 'cur' : i >= lo && i <= hi ? 'live' : 'dim' })),
    ptrs: { lo: lo <= hi || found != null ? lo : -1, hi: lo <= hi || found != null ? hi : -1, mid: mid == null ? -1 : mid },
  });
  const vars = (lo, hi, mid) => ({ type: 'boxes', items: [{ name: 'lo', type: 'int', val: lo }, { name: 'hi', type: 'int', val: hi }, { name: 'mid', type: 'int', val: mid == null ? '–' : mid, cls: mid == null ? '' : 'hl' }] });

  GV.register({
    id: 'dsa-binary-search', track: 'dsa', phase: 'patterns', order: 1, minutes: 14,
    title: L('Binary search', 'Binary search'),
    summary: L('Find a value in a sorted list by checking the middle and throwing away the half that cannot contain it.', 'সাজানো তালিকায় একটা মান খুঁজুন: মাঝখানটা দেখে, যে অর্ধেকে উত্তর থাকতে পারে না সেটা বাদ দিয়ে।'),
    idea: L([
      'Think of a number-guessing game between 1 and 100. You guess 50 and hear "higher". In one guess you have ruled out half the numbers. Guess 75, hear "lower", and so on. You always find the number within about 7 guesses. Binary search does exactly this on a <b>sorted</b> slice: look at the middle value, then discard the half that cannot contain the target.',
      'Each step halves the search range, so doubling the input adds only one more step. One million items take about 20 steps. That is <b>O(log n)</b>, and it is why databases keep indexes sorted.',
    ], [
      '১ থেকে ১০০-এর মধ্যে একটা সংখ্যা অনুমানের খেলার কথা ভাবুন। আপনি বললেন ৫০, উত্তর এলো "আরও বড়"। এক অনুমানেই অর্ধেক সংখ্যা বাদ। এরপর ৭৫, উত্তর "আরও ছোট", এভাবে চলতে থাকে। মোটামুটি ৭ বারের মধ্যেই সংখ্যাটা পেয়ে যান। Binary search <b>সাজানো</b> slice-এ ঠিক এটাই করে: মাঝের মান দেখে, যে অর্ধেকে target থাকতে পারে না সেটা বাদ দেয়।',
      'প্রতিটা ধাপে খোঁজার পরিসর অর্ধেক হয়, তাই input দ্বিগুণ হলে মাত্র একটা ধাপ বাড়ে। দশ লাখ উপাদানে লাগে প্রায় ২০ ধাপ। এটাই <b>O(log n)</b>, আর এজন্যই database তার index সাজিয়ে রাখে।',
    ]),
    complexity: { time: 'O(log n)', space: 'O(1)', note: L('The input must already be sorted. Sorting first costs O(n log n), so binary search pays off when you search the same data many times.', 'Input আগে থেকেই সাজানো থাকতে হবে। আগে সাজাতে O(n log n) লাগে, তাই একই ডেটায় বারবার খুঁজলে binary search লাভজনক।') },
    visual: {
      file: 'binary_search.go',
      legend: [{ cls: 'live', label: L('still possible', 'এখনো সম্ভাব্য') }, { cls: 'cur', label: L('middle being checked', 'যে মাঝের মান দেখা হচ্ছে') }, { cls: 'dim', label: L('ruled out', 'বাদ দেওয়া হয়েছে') }, { cls: 'ok', label: L('found', 'পাওয়া গেছে') }],
      examples: [
        {
          label: L('Search a sorted slice', 'সাজানো slice-এ খোঁজা'),
          inputs: [
            { key: 'nums', label: L('Sorted numbers', 'সাজানো সংখ্যা'), type: 'list', def: [2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 91], maxLen: 14 },
            { key: 'target', label: L('Target', 'Target'), type: 'int', def: 23 },
          ],
          code: `
func binarySearch(nums []int, target int) int {
	lo, hi := 0, len(nums)-1 @@init
	for lo <= hi { @@cond
		mid := lo + (hi-lo)/2 // {avoids overflow of (lo+hi)|(lo+hi)-এর overflow এড়ায়} @@mid
		if nums[mid] == target { @@eq
			return mid @@found
		} else if nums[mid] < target { @@lt
			lo = mid + 1 // {target is to the right|target ডানদিকে} @@golo
		} else {
			hi = mid - 1 // {target is to the left|target বামদিকে} @@gohi
		}
	}
	return -1 // {not present|নেই} @@miss
}`,
          build({ nums, target }) {
            for (let i = 1; i < nums.length; i++) if (nums[i] < nums[i - 1]) throw new GV.InputError(L('Binary search needs sorted input. Put the numbers in increasing order.', 'Binary search-এ সাজানো input লাগে। সংখ্যাগুলো ছোট থেকে বড় ক্রমে দিন।'));
            const s = [];
            let lo = 0, hi = nums.length - 1, asked = false;
            s.push(step('init', L(`Start: lo is the first index (0), hi is the last (${hi}). The whole slice may still hold the answer.`, `শুরু: lo প্রথম index (0), hi শেষ index (${hi})। পুরো slice-এই এখনো উত্তর থাকতে পারে।`), [view(nums, lo, hi), vars(lo, hi)]));
            while (lo <= hi) {
              s.push(step('cond', L(`<code>lo &lt;= hi</code> (${lo} ≤ ${hi}): there is still a range to search.`, `<code>lo &lt;= hi</code> (${lo} ≤ ${hi}): খোঁজার পরিসর এখনো আছে।`), [view(nums, lo, hi), vars(lo, hi)]));
              const mid = lo + Math.floor((hi - lo) / 2);
              s.push(step('mid', L(`mid = ${lo} + (${hi} − ${lo}) / 2 = ${mid}. nums[${mid}] is ${nums[mid]}.`, `mid = ${lo} + (${hi} − ${lo}) / 2 = ${mid}। nums[${mid}] = ${nums[mid]}।`), [view(nums, lo, hi, mid), vars(lo, hi, mid)]));
              if (nums[mid] === target) {
                s.push(step('eq', L(`${nums[mid]} equals the target.`, `${nums[mid]} target-এর সমান।`), [view(nums, lo, hi, mid), vars(lo, hi, mid)]));
                s.push(step('found', L((() => { const c = s.filter((x) => x.line === 'mid').length; return `Found at index ${mid} after ${c} check${c === 1 ? '' : 's'}.`; })(), `${s.filter((x) => x.line === 'mid').length}টা যাচাইয়ের পর index ${mid}-এ পাওয়া গেছে।`), [view(nums, lo, hi, mid, mid), vars(lo, hi, mid)], { tone: 'ok' }));
                return s;
              }
              const right = nums[mid] < target;
              const extra = !asked ? { ask: { q: L(`nums[mid] = ${nums[mid]} and the target is ${target}. Which part can we throw away?`, `nums[mid] = ${nums[mid]}, target ${target}। কোন অংশ বাদ দেওয়া যায়?`), options: right ? [L(`Everything from lo to mid (values ≤ ${nums[mid]})`, `lo থেকে mid পর্যন্ত সব (মান ≤ ${nums[mid]})`), L(`Everything from mid to hi`, `mid থেকে hi পর্যন্ত সব`), L('Nothing yet', 'এখনো কিছু না')] : [L(`Everything from mid to hi (values ≥ ${nums[mid]})`, `mid থেকে hi পর্যন্ত সব (মান ≥ ${nums[mid]})`), L(`Everything from lo to mid`, `lo থেকে mid পর্যন্ত সব`), L('Nothing yet', 'এখনো কিছু না')], answer: 0, why: L('The slice is sorted, so every value on that side is too small (or too big) to be the target.', 'Slice সাজানো, তাই ওই পাশের প্রতিটা মান target হওয়ার জন্য খুব ছোট (বা খুব বড়)।') } } : {};
              asked = true;
              s.push(step('lt', L(`${nums[mid]} ${right ? '&lt;' : '&gt;'} ${target}. The target can only be to the ${right ? 'right' : 'left'} of mid.`, `${nums[mid]} ${right ? '&lt;' : '&gt;'} ${target}। target শুধু mid-এর ${right ? 'ডানে' : 'বামে'} থাকতে পারে।`), [view(nums, lo, hi, mid), vars(lo, hi, mid)], extra));
              if (right) lo = mid + 1; else hi = mid - 1;
              s.push(step(right ? 'golo' : 'gohi', L(right ? `lo = mid + 1 = ${lo}. Half of the range is gone in one step.` : `hi = mid − 1 = ${hi}. Half of the range is gone in one step.`, right ? `lo = mid + 1 = ${lo}। এক ধাপেই অর্ধেক পরিসর বাদ।` : `hi = mid − 1 = ${hi}। এক ধাপেই অর্ধেক পরিসর বাদ।`), [view(nums, lo, hi), vars(lo, hi)]));
            }
            s.push(step('cond', L(`lo (${lo}) &gt; hi (${hi}): the range is empty.`, `lo (${lo}) &gt; hi (${hi}): পরিসর খালি।`), [view(nums, lo, hi), vars(lo, hi)]));
            s.push(step('miss', L(`${target} is not in the slice. Return −1.`, `${target} slice-এ নেই। −1 ফেরত।`), [view(nums, lo, hi), vars(lo, hi)], { tone: 'bad' }));
            return s;
          },
        },
      ],
    },
    walk: [
      { at: 'init', code: 'lo, hi := 0, len(nums)-1', text: L('Inclusive bounds: both lo and hi are valid indexes to check.', 'দুই প্রান্তই অন্তর্ভুক্ত: lo আর hi দুটোই যাচাইযোগ্য index।') },
      { at: 'cond', code: 'for lo <= hi {', text: L('With inclusive bounds the loop runs while the range has at least one element.', 'অন্তর্ভুক্ত সীমায় পরিসরে অন্তত একটা উপাদান থাকা পর্যন্ত লুপ চলে।') },
      { at: 'mid', code: 'mid := lo + (hi-lo)/2', text: L('Same as (lo+hi)/2 but cannot overflow on huge slices.', '(lo+hi)/2-এর মতোই, তবে বিশাল slice-এ overflow হয় না।') },
      { at: 'golo', code: 'lo = mid + 1', text: L('+1 because mid itself was already checked. Forgetting it causes an infinite loop.', '+1 কারণ mid আগেই যাচাই হয়েছে। ভুলে গেলে লুপ অনন্তকাল চলে।') },
    ],
    mistakes: [
      { title: L('lo = mid instead of mid + 1', 'mid + 1-এর বদলে lo = mid'), err: '', fix: L('When lo and hi are adjacent, mid equals lo and nothing changes: an infinite loop. Exclude mid, since you already checked it.', 'lo আর hi পাশাপাশি হলে mid = lo, আর কিছুই বদলায় না: অনন্ত লুপ। mid বাদ দিন, কারণ এটা আগেই যাচাই হয়েছে।') },
      { title: L('Mixing inclusive and exclusive bounds', 'অন্তর্ভুক্ত আর বহির্ভূত সীমা মেশানো'), err: '', fix: L('Pick one style. With <code>hi = len(nums)</code> (exclusive), loop on <code>lo &lt; hi</code> and set <code>hi = mid</code>.', 'একটা স্টাইল বেছে নিন। <code>hi = len(nums)</code> (বহির্ভূত) হলে <code>lo &lt; hi</code> দিয়ে লুপ চালান আর <code>hi = mid</code> দিন।') },
      { title: L('Searching unsorted data', 'না সাজানো ডেটায় খোঁজা'), err: '', fix: L('The result is simply wrong, with no error. Sort first, or use a map for one-off lookups.', 'ফলাফল শুধু ভুল আসে, কোনো error নেই। আগে সাজান, অথবা একবারের খোঁজায় map ব্যবহার করুন।') },
    ],
    perf: L([
      'The standard library already has this: <code>slices.BinarySearch(nums, target)</code> returns the index and whether it was found, and <code>sort.Search(n, f)</code> finds the first index where a condition becomes true.',
      'The "find the first index where a condition flips" form is the most useful in practice: first version that fails, smallest capacity that fits, earliest timestamp after a point.',
    ], [
      'Standard library-তে এটা আগে থেকেই আছে: <code>slices.BinarySearch(nums, target)</code> index আর পাওয়া গেল কিনা ফেরত দেয়, আর <code>sort.Search(n, f)</code> খুঁজে বের করে কোন প্রথম index-এ একটা শর্ত সত্য হয়।',
      '"যে প্রথম index-এ শর্ত বদলে যায় সেটা খোঁজা" রূপটাই বাস্তবে সবচেয়ে কাজের: প্রথম কোন version fail করে, সবচেয়ে ছোট কোন capacity মেলে, কোনো মুহূর্তের পরের প্রথম timestamp।',
    ]),
    quiz: [
      { q: L('About how many checks does binary search need for 1,000,000 sorted items?', '১০ লাখ সাজানো উপাদানে binary search-এর মোটামুটি কয়টা যাচাই লাগে?'), options: ['20', '1,000', '500,000'], answer: 0, why: L('2^20 is about one million, so about 20 halvings.', '2^20 প্রায় দশ লাখ, তাই প্রায় ২০ বার অর্ধেক করা।') },
      { q: L('Why <code>lo + (hi-lo)/2</code> instead of <code>(lo+hi)/2</code>?', '<code>(lo+hi)/2</code>-এর বদলে <code>lo + (hi-lo)/2</code> কেন?'), options: [L('It cannot overflow', 'এতে overflow হয় না'), L('It is faster', 'এটা দ্রুত'), L('It rounds up', 'এটা উপরে round করে')], answer: 0, why: L('lo + hi can exceed the int range for very large indexes.', 'খুব বড় index-এ lo + hi, int-এর সীমা ছাড়িয়ে যেতে পারে।') },
      { q: L('What must be true of the input?', 'Input-এর ক্ষেত্রে কী সত্য হতে হবে?'), options: [L('It is sorted', 'এটা সাজানো'), L('It has no duplicates', 'কোনো পুনরাবৃত্তি নেই'), L('Its length is a power of two', 'দৈর্ঘ্য দুইয়ের ঘাত')], answer: 0, why: L('Discarding a half is only valid if the order tells you where the target can be.', 'ক্রম দেখে target কোথায় থাকতে পারে বোঝা গেলেই অর্ধেক বাদ দেওয়া বৈধ।') },
    ],
    exercises: [
      { title: L('First occurrence', 'প্রথম উপস্থিতি'),
        task: L('With duplicates like <code>[1, 2, 2, 2, 3]</code> and target 2, return the <b>first</b> index (1). Modify binary search so that on a match it keeps searching left.', '<code>[1, 2, 2, 2, 3]</code>-এর মতো পুনরাবৃত্তিসহ, target 2 হলে <b>প্রথম</b> index (1) ফেরত দিন। Binary search বদলান যাতে মিলে গেলেও বামে খুঁজতে থাকে।'),
        hints: [L('Keep a variable <code>ans := -1</code>; on a match set <code>ans = mid</code> and <code>hi = mid - 1</code>.', '<code>ans := -1</code> রাখুন; মিলে গেলে <code>ans = mid</code> আর <code>hi = mid - 1</code>।'), L('The loop still ends; ans holds the leftmost match.', 'লুপ তবুও শেষ হয়; ans-এ থাকে সবচেয়ে বামের মিল।')],
        solution: `package main

import "fmt"

func firstIndex(nums []int, target int) int {
	lo, hi, ans := 0, len(nums)-1, -1
	for lo <= hi {
		mid := lo + (hi-lo)/2
		if nums[mid] == target {
			ans = mid
			hi = mid - 1 // {keep looking left|বামে খুঁজতে থাকো}
		} else if nums[mid] < target {
			lo = mid + 1
		} else {
			hi = mid - 1
		}
	}
	return ans
}

func main() {
	fmt.Println(firstIndex([]int{1, 2, 2, 2, 3}, 2)) // {1|1}
}` },
      { title: L('Integer square root', 'পূর্ণসংখ্যার বর্গমূল'),
        task: L('Without math.Sqrt, return the largest x with x×x ≤ n. For n = 40 the answer is 6. Binary search over the answer range 0..n.', 'math.Sqrt ছাড়া সবচেয়ে বড় x ফেরত দিন যেখানে x×x ≤ n। n = 40 হলে উত্তর 6। উত্তরের পরিসর 0..n-এর উপর binary search করুন।'),
        hints: [L('You are searching for a boundary, not a value in a slice.', 'Slice-এর একটা মান না, একটা সীমানা খুঁজছেন।'), L('If mid×mid ≤ n, mid is a candidate: record it and go right.', 'mid×mid ≤ n হলে mid একটা সম্ভাব্য উত্তর: মনে রেখে ডানে যান।')],
        solution: `package main

import "fmt"

func isqrt(n int) int {
	lo, hi, ans := 0, n, 0
	for lo <= hi {
		mid := lo + (hi-lo)/2
		if mid*mid <= n {
			ans = mid // {mid works, try bigger|mid চলে, বড়টা দেখো}
			lo = mid + 1
		} else {
			hi = mid - 1
		}
	}
	return ans
}

func main() {
	fmt.Println(isqrt(40)) // {6|6}
}` },
    ],
    takeaways: [
      L('Binary search halves a sorted range each step: O(log n).', 'Binary search প্রতিটা ধাপে সাজানো পরিসর অর্ধেক করে: O(log n)।'),
      L('Keep bounds consistent and always move past mid (mid + 1, mid − 1).', 'সীমা সামঞ্জস্যপূর্ণ রাখুন, আর সবসময় mid পার হয়ে যান (mid + 1, mid − 1)।'),
      L('The same idea finds boundaries: first match, smallest value that works.', 'একই ধারণায় সীমানা খোঁজা যায়: প্রথম মিল, কাজ করে এমন সবচেয়ে ছোট মান।'),
      L('In real code use slices.BinarySearch or sort.Search.', 'আসল কোডে slices.BinarySearch বা sort.Search ব্যবহার করুন।'),
    ],
    links: [
      { t: 'Package slices: BinarySearch', url: 'https://pkg.go.dev/slices#BinarySearch' },
      { t: 'Package sort: Search', url: 'https://pkg.go.dev/sort#Search' },
    ],
  });
})();
