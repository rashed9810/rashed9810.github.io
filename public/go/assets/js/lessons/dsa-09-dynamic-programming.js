(function () {
  const { L, step } = GV;

  GV.register({
    id: 'dsa-dynamic-programming', track: 'dsa', phase: 'structures', order: 4, minutes: 20,
    title: L('Dynamic programming tables', 'Dynamic programming টেবিল'),
    summary: L('Solve big problems from small answers stored in a table: climbing stairs in 1D, longest common subsequence in 2D, with each cell\'s sources highlighted.', 'ছোট উত্তর টেবিলে রেখে বড় সমস্যা সমাধান: 1D-তে সিঁড়ি বাওয়া, 2D-তে longest common subsequence, প্রতিটা ঘরের উৎস হাইলাইটসহ।'),
    idea: L([
      '<b>Dynamic programming</b> (DP) is recursion with a memory. When a problem breaks into smaller versions of itself, and the same smaller versions come up again and again, you solve each one <b>once</b>, write the answer in a table, and build bigger answers from it.',
      'Climbing stairs: you can take 1 or 2 steps at a time. How many ways to reach step n? Your last move came either from step n−1 or from n−2, so <code>ways[n] = ways[n−1] + ways[n−2]</code>. Recursion without a table recomputes the same steps exponentially many times; the table makes it linear.',
      'For two strings, the longest common subsequence (LCS) fills a 2D grid where each cell looks at its neighbours above, left and diagonal. The same shape underlies <code>diff</code>, git merges, spell checkers and DNA alignment.',
    ], [
      '<b>Dynamic programming</b> (DP) হলো স্মৃতিসহ recursion। কোনো সমস্যা যদি নিজেরই ছোট সংস্করণে ভাঙে, আর একই ছোট সংস্করণ বারবার আসে, তাহলে প্রতিটা <b>একবার</b> সমাধান করে উত্তর টেবিলে লিখুন, আর তা থেকে বড় উত্তর বানান।',
      'সিঁড়ি বাওয়া: একবারে ১ বা ২ ধাপ নেওয়া যায়। n-তম ধাপে পৌঁছানোর কয়টা উপায়? শেষ পদক্ষেপ এসেছে হয় n−1 থেকে, নয়তো n−2 থেকে, তাই <code>ways[n] = ways[n−1] + ways[n−2]</code>। টেবিল ছাড়া recursion একই ধাপ exponential বার হিসাব করে; টেবিল এটাকে linear করে।',
      'দুটো string-এর longest common subsequence (LCS) একটা 2D grid পূরণ করে, যেখানে প্রতিটা ঘর তার উপর, বাম আর কোনাকুনি প্রতিবেশী দেখে। <code>diff</code>, git merge, বানান-যাচাই আর DNA alignment-এর পেছনে এই আকারই।',
    ]),
    complexity: { time: 'O(n) and O(m·n)', space: 'O(n) and O(m·n)', note: L('Stairs needs only the last two values, so it can drop to O(1) space. LCS can keep just two rows.', 'সিঁড়িতে শুধু শেষ দুটো মান লাগে, তাই O(1) মেমরিতে নামানো যায়। LCS শুধু দুটো সারি রাখতে পারে।') },
    visual: {
      file: 'dp.go',
      legend: [{ cls: 'cur', label: L('cell being filled', 'যে ঘর পূরণ হচ্ছে') }, { cls: 'src', label: L('cells it reads from', 'যেসব ঘর থেকে পড়ে') }, { cls: 'ok', label: L('answer', 'উত্তর') }],
      examples: [
        {
          label: L('Climbing stairs (1D)', 'সিঁড়ি বাওয়া (1D)'),
          inputs: [{ key: 'n', label: L('Number of stairs n', 'সিঁড়ির সংখ্যা n'), type: 'int', def: 7, min: 2, max: 14 }],
          code: `
func climbStairs(n int) int {
	ways := make([]int, n+1) @@make
	ways[0], ways[1] = 1, 1 // {one way to stand still or take one step|দাঁড়িয়ে থাকা বা এক ধাপের এক উপায়} @@base
	for i := 2; i <= n; i++ { @@loop
		ways[i] = ways[i-1] + ways[i-2] // {last move was 1 or 2 stairs|শেষ পদক্ষেপ ১ বা ২ সিঁড়ি} @@fill
	}
	return ways[n] @@ret
}`,
          build({ n }) {
            const w = Array(n + 1).fill(null);
            const s = [];
            const tbl = (cls) => ({ type: 'table', wide: true, title: L('ways[i]', 'ways[i]'), corner: 'i', cols: Array.from({ length: n + 1 }, (_, i) => String(i)), rows: ['ways'], cells: [w.slice()], cls: cls || {} });
            s.push(step('make', L(`A table with one cell per stair, 0 to ${n}.`, `প্রতিটা সিঁড়ির জন্য একটা ঘর, 0 থেকে ${n}।`), [tbl()]));
            w[0] = 1; w[1] = 1;
            s.push(step('base', L('Base cases: one way to be at stair 0 (do nothing) and one way to reach stair 1.', 'Base case: সিঁড়ি 0-তে থাকার একটা উপায় (কিছু না করা), আর সিঁড়ি 1-এ পৌঁছানোর একটা উপায়।'), [tbl({ '0,0': 'cur', '0,1': 'cur' })]));
            for (let i = 2; i <= n; i++) {
              const extra = i === 4 ? { ask: { q: L(`ways[2] = ${w[2]} and ways[3] = ${w[3]}. What is ways[4]?`, `ways[2] = ${w[2]}, ways[3] = ${w[3]}। ways[4] কত?`), options: [String(w[3] + w[2]), String(w[3] * w[2]), String(w[3] + 1)], answer: 0, why: L('Add the two cells to the left: reach 4 from 3 with a 1-step, or from 2 with a 2-step.', 'বামের দুটো ঘর যোগ: 3 থেকে ১ ধাপে, অথবা 2 থেকে ২ ধাপে 4-এ পৌঁছানো।') } } : {};
              w[i] = w[i - 1] + w[i - 2];
              s.push(step('fill', L(`ways[${i}] = ways[${i - 1}] + ways[${i - 2}] = ${w[i - 1]} + ${w[i - 2]} = ${w[i]}. Each value is computed once.`, `ways[${i}] = ways[${i - 1}] + ways[${i - 2}] = ${w[i - 1]} + ${w[i - 2]} = ${w[i]}। প্রতিটা মান একবারই হিসাব হয়।`), [tbl({ [`0,${i}`]: 'cur', [`0,${i - 1}`]: 'src', [`0,${i - 2}`]: 'src' })], extra));
            }
            s.push(step('ret', L(`There are ${w[n]} ways to climb ${n} stairs, found with ${n - 1} additions. Plain recursion would make about ${Math.round(Math.pow(1.618, n))} calls. (These are the Fibonacci numbers.)`, `${n}টা সিঁড়ি বাওয়ার ${w[n]}টা উপায়, মাত্র ${n - 1}টা যোগে পাওয়া। সাধারণ recursion প্রায় ${Math.round(Math.pow(1.618, n))}টা call করত। (এগুলো Fibonacci সংখ্যা।)`), [tbl({ [`0,${n}`]: 'ok' })], { tone: 'ok' }));
            return s;
          },
        },
        {
          label: L('Longest common subsequence (2D)', 'Longest common subsequence (2D)'),
          inputs: [
            { key: 'a', label: L('String a', 'String a'), type: 'text', def: 'ABCBDA', maxLen: 7 },
            { key: 'b', label: L('String b', 'String b'), type: 'text', def: 'BDCABA', maxLen: 7 },
          ],
          code: `
func lcs(a, b string) int {
	dp := make([][]int, len(a)+1) @@make
	for i := range dp {
		dp[i] = make([]int, len(b)+1) // {row 0 and column 0 stay 0|সারি 0 আর কলাম 0 শূন্যই থাকে}
	}
	for i := 1; i <= len(a); i++ {
		for j := 1; j <= len(b); j++ { @@loop
			if a[i-1] == b[j-1] { @@eq
				dp[i][j] = dp[i-1][j-1] + 1 // {extend the diagonal match|কোনাকুনি মিল বাড়াও} @@diag
			} else {
				dp[i][j] = max(dp[i-1][j], dp[i][j-1]) // {best after dropping one char|একটা অক্ষর বাদ দিয়ে সেরা} @@skip
			}
		}
	}
	return dp[len(a)][len(b)] @@ret
}`,
          build({ a, b }) {
            if (!/^[\x20-\x7e]+$/.test(a + b)) throw new GV.InputError(L('Use plain ASCII letters here (the Go code compares bytes).', 'এখানে সাধারণ ASCII অক্ষর দিন (Go কোড byte তুলনা করে)।'));
            const m = a.length, n = b.length;
            const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
            const vis = Array.from({ length: m + 1 }, (_, i) => Array(n + 1).fill(null).map((_, j) => (i === 0 || j === 0 ? 0 : null)));
            const tbl = (cls) => ({ type: 'table', wide: true, title: L('dp[i][j] = LCS of a[:i] and b[:j]', 'dp[i][j] = a[:i] আর b[:j]-এর LCS'), corner: 'a\\b', cols: ['∅'].concat([...b]), rows: ['∅'].concat([...a]), cells: vis.map((r) => r.slice()), cls: cls || {} });
            const s = [];
            s.push(step('make', L(`A (${m}+1) × (${n}+1) grid. Row 0 and column 0 mean "empty string": LCS is 0.`, `একটা (${m}+1) × (${n}+1) grid। সারি 0 আর কলাম 0 মানে "খালি string": LCS 0।`), [tbl()]));
            let asked = false;
            for (let i = 1; i <= m; i++) {
              for (let j = 1; j <= n; j++) {
                const eq = a[i - 1] === b[j - 1];
                if (eq) {
                  dp[i][j] = dp[i - 1][j - 1] + 1;
                  vis[i][j] = dp[i][j];
                  s.push(step('diag', L(`a[${i - 1}] = '${a[i - 1]}' equals b[${j - 1}] = '${b[j - 1]}'. Take the diagonal and add 1: ${dp[i - 1][j - 1]} + 1 = ${dp[i][j]}.`, `a[${i - 1}] = '${a[i - 1]}' আর b[${j - 1}] = '${b[j - 1]}' সমান। কোনাকুনি নিয়ে 1 যোগ: ${dp[i - 1][j - 1]} + 1 = ${dp[i][j]}।`), [tbl({ [`${i},${j}`]: 'cur', [`${i - 1},${j - 1}`]: 'src' })]));
                } else {
                  const extra = !asked && i >= 2 && j >= 2 ? { ask: { q: L(`'${a[i - 1]}' ≠ '${b[j - 1]}'. Above is ${dp[i - 1][j]}, left is ${dp[i][j - 1]}. What goes in this cell?`, `'${a[i - 1]}' ≠ '${b[j - 1]}'। উপরে ${dp[i - 1][j]}, বামে ${dp[i][j - 1]}। এই ঘরে কী বসবে?`), options: [String(Math.max(dp[i - 1][j], dp[i][j - 1])), String(dp[i - 1][j] + dp[i][j - 1]), String(dp[i - 1][j - 1] + 1)].filter((v, k, arr) => arr.indexOf(v) === k), answer: 0, why: L('No match, so drop one character from either string and keep the better result.', 'মিল নেই, তাই যেকোনো একটা string থেকে একটা অক্ষর বাদ দিয়ে ভালো ফলটা রাখো।') } } : {};
                  if (extra.ask) asked = true;
                  dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                  vis[i][j] = dp[i][j];
                  s.push(step('skip', L(`'${a[i - 1]}' ≠ '${b[j - 1]}'. Take the larger of above (${dp[i - 1][j]}) and left (${dp[i][j - 1]}): ${dp[i][j]}.`, `'${a[i - 1]}' ≠ '${b[j - 1]}'। উপর (${dp[i - 1][j]}) আর বাম (${dp[i][j - 1]})-এর বড়টা: ${dp[i][j]}।`), [tbl({ [`${i},${j}`]: 'cur', [`${i - 1},${j}`]: 'src', [`${i},${j - 1}`]: 'src' })], extra));
                }
              }
            }
            // trace one LCS for display
            const path = {};
            let i = m, j = n, word = '';
            while (i > 0 && j > 0) {
              if (a[i - 1] === b[j - 1]) { path[`${i},${j}`] = 'path'; word = a[i - 1] + word; i--; j--; }
              else if (dp[i - 1][j] >= dp[i][j - 1]) i--; else j--;
            }
            path[`${m},${n}`] = 'ok';
            s.push(step('ret', L(`The bottom-right cell is the answer: LCS length ${dp[m][n]}. Following the matches back gives one such subsequence: "${word}".`, `নিচের ডান কোণের ঘরই উত্তর: LCS দৈর্ঘ্য ${dp[m][n]}। মিলগুলো পেছনে অনুসরণ করলে এমন একটা subsequence পাওয়া যায়: "${word}"।`), [tbl(path)], { tone: 'ok' }));
            return s;
          },
        },
      ],
    },
    walk: [
      { at: 'base', ex: 0, code: 'ways[0], ways[1] = 1, 1', text: L('Every DP needs base cases the recurrence can start from.', 'প্রতিটা DP-তে base case লাগে, যেখান থেকে recurrence শুরু হয়।') },
      { at: 'fill', ex: 0, code: 'ways[i] = ways[i-1] + ways[i-2]', text: L('The recurrence: express the answer in terms of smaller answers.', 'Recurrence: উত্তরকে ছোট উত্তর দিয়ে প্রকাশ।') },
      { at: 'diag', ex: 1, code: 'dp[i][j] = dp[i-1][j-1] + 1', text: L('Matching characters extend the best answer without them.', 'মিলে যাওয়া অক্ষর তাদের ছাড়া সেরা উত্তরকে বাড়ায়।') },
      { at: 'skip', ex: 1, code: 'max(dp[i-1][j], dp[i][j-1])', text: L('Built-in max needs Go 1.21 or newer.', 'Built-in max-এর জন্য Go 1.21 বা নতুন লাগবে।') },
    ],
    mistakes: [
      { title: L('Plain recursion without memo', 'Memo ছাড়া সাধারণ recursion'), err: '', fix: L('fib(n-1) + fib(n-2) recomputes the same values exponentially. Store results in a slice or map.', 'fib(n-1) + fib(n-2) একই মান exponential বার হিসাব করে। ফলাফল slice বা map-এ রাখুন।') },
      { title: L('Off-by-one between string and table indexes', 'String আর টেবিলের index-এ এক-ঘর ভুল'), err: 'panic: runtime error: index out of range [6] with length 6', fix: L('The table has an extra row and column for the empty prefix, so dp[i][j] compares a[i-1] with b[j-1].', 'টেবিলে খালি prefix-এর জন্য একটা বাড়তি সারি আর কলাম আছে, তাই dp[i][j], a[i-1]-কে b[j-1]-এর সাথে তুলনা করে।') },
      { title: L('Integer overflow', 'Integer overflow'), err: '', fix: L('Counting problems grow fast: ways for 92 stairs already near the int64 limit. Use math/big or a modulus when the problem asks for one.', 'গণনার সমস্যা দ্রুত বাড়ে: ৯২টা সিঁড়ির উপায়ই int64-এর সীমার কাছে। সমস্যা চাইলে math/big বা modulus ব্যবহার করুন।') },
    ],
    quiz: [
      { q: L('What two properties make a problem suitable for DP?', 'কোন দুটো বৈশিষ্ট্য থাকলে সমস্যা DP-র উপযুক্ত?'), options: [L('Overlapping subproblems and optimal substructure', 'Overlapping subproblem আর optimal substructure'), L('Sorted input and no duplicates', 'সাজানো input আর পুনরাবৃত্তি নেই'), L('A graph with no cycles only', 'শুধু চক্রহীন graph')], answer: 0, why: L('Small answers repeat, and big answers are built from small ones.', 'ছোট উত্তর বারবার আসে, আর বড় উত্তর ছোটগুলো দিয়ে তৈরি।') },
      { q: L('In LCS, when a[i-1] == b[j-1], dp[i][j] = …', 'LCS-এ a[i-1] == b[j-1] হলে dp[i][j] = …'), options: ['dp[i-1][j-1] + 1', 'max(dp[i-1][j], dp[i][j-1])', 'dp[i-1][j] + 1'], answer: 0, why: L('Use the match and extend the diagonal.', 'মিলটা ব্যবহার করে কোনাকুনি বাড়াও।') },
      { q: L('How much memory does climbing stairs really need?', 'সিঁড়ি বাওয়ায় আসলে কত মেমরি লাগে?'), options: [L('O(1): just the last two values', 'O(1): শুধু শেষ দুটো মান'), 'O(n²)', 'O(2ⁿ)'], answer: 0, why: L('Each cell reads only its two predecessors.', 'প্রতিটা ঘর শুধু তার আগের দুটো পড়ে।') },
    ],
    exercises: [
      { title: L('Stairs in O(1) space', 'O(1) মেমরিতে সিঁড়ি'),
        task: L('Rewrite climbStairs with two variables instead of a slice.', 'Slice-এর বদলে দুটো variable দিয়ে climbStairs আবার লিখুন।'),
        hints: [L('Keep prev2 and prev1, then shift them forward each step.', 'prev2 আর prev1 রাখুন, প্রতি ধাপে এগিয়ে দিন।'), L('Go\'s tuple assignment makes the shift one line.', 'Go-র tuple assignment দিয়ে এক লাইনেই এগোনো যায়।')],
        solution: `package main

import "fmt"

func climbStairs(n int) int {
	a, b := 1, 1 // {ways[i-2], ways[i-1]|ways[i-2], ways[i-1]}
	for i := 2; i <= n; i++ {
		a, b = b, a+b
	}
	return b
}

func main() {
	fmt.Println(climbStairs(7)) // {21|21}
}` },
      { title: L('Coin change', 'কয়েন বদল'),
        task: L('With coins <code>[1, 5, 10]</code>, find the fewest coins that make 27 (answer 5: 10 + 10 + 5 + 1 + 1). Fill <code>best[amount]</code> from 0 up to 27.', '<code>[1, 5, 10]</code> কয়েন দিয়ে 27 বানাতে সবচেয়ে কম কয়টা কয়েন লাগে বের করুন (উত্তর 5: 10 + 10 + 5 + 1 + 1)। 0 থেকে 27 পর্যন্ত <code>best[amount]</code> পূরণ করুন।'),
        hints: [L('best[0] = 0; every other cell starts at a large number.', 'best[0] = 0; বাকি প্রতিটা ঘর একটা বড় সংখ্যা দিয়ে শুরু।'), L('best[x] = min over coins c ≤ x of best[x-c] + 1.', 'best[x] = সব কয়েন c ≤ x-এর জন্য best[x-c] + 1-এর সর্বনিম্ন।')],
        solution: `package main

import (
	"fmt"
	"math"
)

func minCoins(coins []int, amount int) int {
	best := make([]int, amount+1)
	for x := 1; x <= amount; x++ {
		best[x] = math.MaxInt
		for _, c := range coins {
			if c <= x && best[x-c] != math.MaxInt {
				best[x] = min(best[x], best[x-c]+1) // {use coin c last|শেষে c কয়েনটা}
			}
		}
	}
	return best[amount]
}

func main() {
	fmt.Println(minCoins([]int{1, 5, 10}, 27)) // {5|5}
}` },
    ],
    takeaways: [
      L('DP = solve each subproblem once and store it.', 'DP = প্রতিটা ছোট সমস্যা একবার সমাধান করে রেখে দেওয়া।'),
      L('Define the table meaning, the base cases, the recurrence, and the fill order.', 'টেবিলের অর্থ, base case, recurrence আর পূরণের ক্রম ঠিক করুন।'),
      L('Look at which cells a cell reads; often you can keep less memory.', 'একটা ঘর কোন ঘরগুলো পড়ে দেখুন; প্রায়ই কম মেমরি রাখা যায়।'),
    ],
    links: [{ t: 'Go builtin: min and max', url: 'https://pkg.go.dev/builtin#min' }, { t: 'Package math/big', url: 'https://pkg.go.dev/math/big' }],
  });
})();
