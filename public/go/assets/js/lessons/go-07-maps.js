(function () {
  const { L, step, out } = GV;
  const kv = (rows, title, extra) => Object.assign({ type: 'kv', title: title || L('ages: map[string]int', 'ages: map[string]int'), rows }, extra || {});
  const vars = (items) => ({ type: 'boxes', items });

  GV.register({
    id: 'go-maps', track: 'go', phase: 'memory', order: 3, minutes: 16,
    title: L('Maps', 'Map'),
    summary: L('A map is a phone book: set, overwrite, look up with comma-ok, delete, count words, and avoid the nil-map panic.', 'Map হলো একটা ফোনবুক: সেট, ওভাররাইট, comma-ok দিয়ে খোঁজা, মুছে ফেলা, শব্দ গোনা, আর nil-map panic এড়ানো।'),
    idea: L([
      'A <b>map</b> is like a phone book: you look up a <b>key</b> (a name) and get a <b>value</b> (a number) almost instantly, no matter how many entries there are. In Go the types are fixed: <code>map[string]int</code> maps strings to ints. It is Go\'s version of a Python dict or a JavaScript object used as a dictionary.',
      'Looking up a missing key does not throw an error. You get the value type\'s <b>zero value</b>. To tell "missing" apart from "present but zero", use the <b>comma-ok</b> form: <code>v, ok := m[k]</code>.',
      'A map variable is a small handle to data stored elsewhere, so passing a map to a function lets that function change it. A map that was declared but never made is <code>nil</code>: you may read from it, but writing panics.',
    ], [
      '<b>Map</b> হলো একটা ফোনবুকের মতো: একটা <b>key</b> (নাম) খুঁজলে প্রায় সাথে সাথে <b>value</b> (নম্বর) পান, যত এন্ট্রিই থাকুক। Go-তে type নির্দিষ্ট: <code>map[string]int</code> মানে string থেকে int। এটা Python-এর dict বা JavaScript-এর dictionary হিসেবে ব্যবহৃত object-এর Go সংস্করণ।',
      'নেই এমন key খুঁজলে error হয় না। Value type-এর <b>zero value</b> পাওয়া যায়। "নেই" আর "আছে কিন্তু শূন্য" আলাদা করতে <b>comma-ok</b> ফর্ম ব্যবহার করুন: <code>v, ok := m[k]</code>।',
      'Map variable হলো অন্য জায়গায় রাখা ডেটার একটা ছোট হাতল, তাই map কোনো function-এ পাঠালে সেই function সেটা বদলাতে পারে। ঘোষণা করা কিন্তু make করা হয়নি এমন map হলো <code>nil</code>: পড়া যায়, কিন্তু লিখলে panic।',
    ]),
    visual: {
      file: 'main.go',
      legend: [{ cls: 'cur', label: L('just changed', 'এইমাত্র বদলেছে') }],
      examples: [
        {
          label: L('Set, look up, delete', 'সেট, খোঁজা, মুছে ফেলা'),
          code: `
package main

import "fmt"

func main() {
	ages := map[string]int{} // {an empty, ready-to-use map|খালি, ব্যবহারযোগ্য map} @@make
	ages["rahim"] = 30 @@s1
	ages["karim"] = 25 @@s2
	ages["rahim"] = 31 // {same key: overwrite|একই key: ওভাররাইট} @@over
	v, ok := ages["jamal"] // {missing key|নেই এমন key} @@look
	fmt.Println(v, ok) @@p1
	delete(ages, "karim") @@del
	fmt.Println(len(ages)) @@p2
}`,
          build() {
            return [
              step('make', L('<code>map[string]int{}</code> creates an empty map that is ready to write to.', '<code>map[string]int{}</code> একটা খালি map বানায়, যেটাতে সাথে সাথে লেখা যায়।'), [kv([])]),
              step('s1', L('Store key "rahim" with value 30.', 'key "rahim"-এ value 30 রাখা হলো।'), [kv([{ k: '"rahim"', v: 30, cls: 'new' }])]),
              step('s2', L('Another key, another entry.', 'আরেকটা key, আরেকটা এন্ট্রি।'), [kv([{ k: '"rahim"', v: 30 }, { k: '"karim"', v: 25, cls: 'new' }])]),
              step('over', L('Keys are unique. Writing "rahim" again replaces the old value.', 'Key অনন্য। আবার "rahim" লিখলে পুরনো মান বদলে যায়।'), [kv([{ k: '"rahim"', v: 31, cls: 'hl' }, { k: '"karim"', v: 25 }])], {
                ask: { q: L('"jamal" is not in the map. What does <code>v, ok := ages["jamal"]</code> give?', '"jamal" map-এ নেই। <code>v, ok := ages["jamal"]</code> কী দেবে?'), options: ['0 false', L('a panic', 'একটা panic'), 'nil false'], answer: 0, why: L('Missing keys return the zero value; ok tells you it was missing.', 'নেই এমন key zero value দেয়; ok জানায় যে সেটা ছিল না।') },
              }),
              step('look', L('Lookup of a missing key: v gets the zero value 0, ok is false. No error, no panic.', 'নেই এমন key খোঁজা: v পায় zero value 0, ok হলো false। কোনো error নেই, panic নেই।'), [kv([{ k: '"rahim"', v: 31 }, { k: '"karim"', v: 25 }]), vars([{ name: 'v', type: 'int', val: 0, cls: 'hl new' }, { name: 'ok', type: 'bool', val: 'false', cls: 'hl new' }])]),
              step('p1', L('Without ok, you could not tell a missing key from a real 0.', 'ok ছাড়া নেই এমন key আর সত্যিকারের 0 আলাদা করা যেত না।'), [kv([{ k: '"rahim"', v: 31 }, { k: '"karim"', v: 25 }]), vars([{ name: 'v', type: 'int', val: 0 }, { name: 'ok', type: 'bool', val: 'false' }]), out(['0 false'], 1)]),
              step('del', L('<code>delete(m, key)</code> removes the entry. Deleting a missing key is a safe no-op.', '<code>delete(m, key)</code> এন্ট্রি মুছে দেয়। নেই এমন key মুছলেও কোনো সমস্যা নেই।'), [kv([{ k: '"rahim"', v: 31 }, { k: '"karim"', v: 25, cls: 'dim' }]), out(['0 false'])]),
              step('p2', L('One entry left.', 'একটা এন্ট্রি বাকি।'), [kv([{ k: '"rahim"', v: 31 }]), out(['0 false', '1'], 1)], { tone: 'ok' }),
            ];
          },
        },
        {
          label: L('Count words', 'শব্দ গোনা'),
          inputs: [{ key: 'text', label: L('Sentence', 'বাক্য'), type: 'text', def: 'go is fun and go is fast', maxLen: 60 }],
          code: (inp) => `
package main

import (
	"fmt"
	"strings"
)

func main() {
	text := ${JSON.stringify(inp.text)}
	counts := map[string]int{} @@make
	for _, w := range strings.Fields(text) { // {split on spaces|স্পেস দিয়ে ভাগ} @@loop
		counts[w]++ // {missing key starts at 0|নেই এমন key 0 থেকে শুরু} @@inc
	}
	fmt.Println(counts) // {prints keys in sorted order|key সাজানো ক্রমে print করে} @@print
}`,
          build({ text }) {
            const words = text.split(/\s+/).filter(Boolean);
            if (words.length > 14) throw new GV.InputError(L('Use at most 14 words.', 'সর্বোচ্চ ১৪টা শব্দ দিন।'));
            const counts = new Map();
            const s = [];
            const arr = (cur) => ({ type: 'array', chars: false, title: L('strings.Fields(text)', 'strings.Fields(text)'), cells: words.map((w, i) => ({ v: w, cls: i === cur ? 'cur' : i < cur ? 'ok' : '' })) });
            const table = (hl) => kv([...counts.entries()].map(([k, v]) => ({ k: JSON.stringify(k), v, cls: k === hl ? (v === 1 ? 'new' : 'hl') : '' })), L('counts: map[string]int', 'counts: map[string]int'));
            s.push(step('make', L(`An empty map. The sentence has ${words.length} words.`, `একটা খালি map। বাক্যে ${words.length}টা শব্দ।`), [arr(-1), table()]));
            words.forEach((w, i) => {
              const seen = counts.has(w);
              s.push(step('loop', L(`Next word: <code>${GV.esc(w)}</code>.`, `পরের শব্দ: <code>${GV.esc(w)}</code>।`), [arr(i), table()]));
              counts.set(w, (counts.get(w) || 0) + 1);
              s.push(step('inc', seen
                ? L(`"${GV.esc(w)}" is already there, so its count goes up to ${counts.get(w)}.`, `"${GV.esc(w)}" আগেই আছে, তাই গণনা বেড়ে ${counts.get(w)}।`)
                : L(`"${GV.esc(w)}" is new. Reading it gives 0, then ++ stores 1. No "if exists" check needed.`, `"${GV.esc(w)}" নতুন। পড়লে 0 পাওয়া যায়, তারপর ++ রাখে 1। "আছে কিনা" যাচাই লাগে না।`), [arr(i), table(w)]));
            });
            const sorted = [...counts.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
            s.push(step('print', L('fmt prints maps with keys sorted, which makes output stable. A <code>for range</code> loop over a map, however, visits keys in random order.', 'fmt map print করে key সাজিয়ে, তাই output স্থির থাকে। তবে map-এর উপর <code>for range</code> লুপ key-গুলো এলোমেলো ক্রমে দেখে।'), [arr(words.length), table(), out(['map[' + sorted.map(([k, v]) => `${k}:${v}`).join(' ') + ']'], 1)], { tone: 'ok' }));
            return s;
          },
        },
        {
          label: L('nil map: read OK, write panics', 'nil map: পড়া চলে, লিখলে panic'),
          code: `
package main

import "fmt"

func main() {
	var m map[string]int // {declared, never made: nil|ঘোষণা হলো, make হয়নি: nil} @@decl
	fmt.Println(m["x"], len(m)) // {reading a nil map is fine|nil map পড়া ঠিক আছে} @@read
	m["x"] = 1 // {writing panics|লিখলে panic} @@write
}`,
          build() {
            return [
              step('decl', L('<code>var m map[string]int</code> gives a nil map. There is no storage behind it yet.', '<code>var m map[string]int</code> একটা nil map দেয়। এর পেছনে এখনো কোনো জায়গা নেই।'), [kv([], L('m (nil)', 'm (nil)'), { nilMap: true })]),
              step('read', L('Reads behave like an empty map: zero value, length 0.', 'পড়া খালি map-এর মতো আচরণ করে: zero value, length 0।'), [kv([], L('m (nil)', 'm (nil)'), { nilMap: true }), out(['0 0'], 1)]),
              step('write', L('There is nowhere to store the entry, so Go panics. Always create maps with <code>make(map[K]V)</code> or a literal <code>map[K]V{}</code>.', 'এন্ট্রি রাখার কোনো জায়গা নেই, তাই Go panic করে। সবসময় <code>make(map[K]V)</code> বা <code>map[K]V{}</code> দিয়ে map বানান।'), [kv([], L('m (nil)', 'm (nil)'), { nilMap: true, cls: '' }), out(['0 0', { v: 'panic: assignment to entry in nil map', cls: 'bad' }])], { tone: 'bad' }),
            ];
          },
        },
      ],
    },
    walk: [
      { at: 'make', ex: 0, code: 'ages := map[string]int{}', text: L('A literal. <code>make(map[string]int)</code> does the same, and accepts a size hint.', 'একটা literal। <code>make(map[string]int)</code>-ও একই কাজ করে, আর size hint নিতে পারে।') },
      { at: 'look', ex: 0, code: 'v, ok := ages["jamal"]', text: L('The comma-ok idiom. Use it whenever 0 or "" could be a real value.', 'comma-ok idiom। 0 বা "" যখন আসল মান হতে পারে তখন এটা ব্যবহার করুন।') },
      { at: 'inc', ex: 1, code: 'counts[w]++', text: L('Works on a missing key because reading returns 0 first.', 'নেই এমন key-তেও কাজ করে, কারণ পড়লে আগে 0 আসে।') },
      { at: 'write', ex: 2, code: 'm["x"] = 1', text: L('Panics on a nil map. Initialise maps in constructors.', 'nil map-এ panic। Constructor-এ map initialise করুন।') },
    ],
    mistakes: [
      { title: L('Writing to a nil map', 'nil map-এ লেখা'), err: 'panic: assignment to entry in nil map', fix: L('Create it first with make or a literal. Watch struct fields of map type: they start nil too.', 'আগে make বা literal দিয়ে বানান। Map type-এর struct field-ও nil দিয়ে শুরু হয়, খেয়াল রাখুন।') },
      { title: L('Relying on iteration order', 'Iteration-এর ক্রমের উপর নির্ভর করা'), err: '', fix: L('Go randomises map iteration order on purpose. Collect the keys, sort them with <code>slices.Sorted(maps.Keys(m))</code>, then loop.', 'Go ইচ্ছা করেই map iteration-এর ক্রম এলোমেলো রাখে। Key-গুলো সংগ্রহ করে <code>slices.Sorted(maps.Keys(m))</code> দিয়ে সাজিয়ে তারপর লুপ করুন।') },
      { title: L('Writing from several goroutines', 'একাধিক goroutine থেকে লেখা'), err: 'fatal error: concurrent map writes', fix: L('Maps are not safe for concurrent writes. Guard them with a <code>sync.Mutex</code> (see the mutex lesson).', 'Map একসাথে একাধিক জায়গা থেকে লেখার জন্য নিরাপদ নয়। <code>sync.Mutex</code> দিয়ে সুরক্ষা দিন (mutex লেসন দেখুন)।') },
      { title: L('Changing a field of a struct stored in a map', 'Map-এ রাখা struct-এর field বদলানো'), err: './main.go:12:2: cannot assign to struct field m["a"].Age in map', fix: L('Map values are not addressable. Read the struct, change it, write it back, or store pointers: <code>map[string]*User</code>.', 'Map-এর value addressable নয়। Struct পড়ুন, বদলান, আবার লিখুন, অথবা pointer রাখুন: <code>map[string]*User</code>।') },
    ],
    quiz: [
      { q: L('<code>m := map[string]bool{}</code>. What is <code>m["x"]</code>?', '<code>m := map[string]bool{}</code>। <code>m["x"]</code> কী?'), options: ['false', 'nil', L('panic', 'panic')], answer: 0, why: L('The zero value of bool.', 'bool-এর zero value।') },
      { q: L('Which line panics?', 'কোন লাইনে panic হবে?'), options: ['var m map[string]int; m["a"] = 1', 'm := map[string]int{}; m["a"] = 1', 'var m map[string]int; _ = m["a"]'], answer: 0, why: L('Only writing to a nil map panics.', 'শুধু nil map-এ লিখলেই panic।') },
      { q: L('Is <code>for k, v := range m</code> ordered?', '<code>for k, v := range m</code> কি ক্রম মেনে চলে?'), options: [L('No, the order is random', 'না, ক্রম এলোমেলো'), L('Yes, by insertion', 'হ্যাঁ, যোগ করার ক্রমে'), L('Yes, sorted by key', 'হ্যাঁ, key অনুযায়ী সাজানো')], answer: 0, why: L('Do not depend on map order. Sort keys when you need order.', 'Map-এর ক্রমের উপর নির্ভর করবেন না। ক্রম লাগলে key সাজান।') },
    ],
    exercises: [
      { title: L('Most frequent word', 'সবচেয়ে বেশিবার আসা শব্দ'),
        task: L('Extend the word counter to print the word that appears most often and how many times. If two words tie, any one is fine.', 'শব্দ গোনার প্রোগ্রামটা বাড়ান, যাতে সবচেয়ে বেশিবার আসা শব্দ আর কতবার এসেছে print হয়। দুটো সমান হলে যেকোনো একটা চলবে।'),
        hints: [L('After counting, loop over the map keeping a best word and best count.', 'গোনার পর map-এর উপর লুপ চালিয়ে সেরা শব্দ আর সেরা গণনা মনে রাখুন।'), L('<code>for w, c := range counts</code> gives key and value.', '<code>for w, c := range counts</code> key আর value দেয়।')],
        solution: `package main

import (
	"fmt"
	"strings"
)

func main() {
	text := "go is fun and go is fast and go is simple"
	counts := map[string]int{}
	for _, w := range strings.Fields(text) {
		counts[w]++
	}
	best, bestN := "", 0
	for w, n := range counts {
		if n > bestN {
			best, bestN = w, n
		}
	}
	fmt.Println(best, bestN) // {go 3|go 3}
}` },
      { title: L('Group names by first letter', 'প্রথম অক্ষর অনুযায়ী নাম সাজানো'),
        task: L('Given <code>[]string{"ana", "bob", "alex", "bina"}</code>, build a <code>map[byte][]string</code> grouping names by first letter, then print it.', '<code>[]string{"ana", "bob", "alex", "bina"}</code> থেকে প্রথম অক্ষর অনুযায়ী নাম সাজিয়ে একটা <code>map[byte][]string</code> বানিয়ে print করুন।'),
        hints: [L('<code>name[0]</code> is the first byte.', '<code>name[0]</code> হলো প্রথম byte।'), L('Appending to a missing key works: the zero value of a slice is nil, and append accepts nil.', 'নেই এমন key-তে append চলে: slice-এর zero value nil, আর append nil নিতে পারে।')],
        solution: `package main

import "fmt"

func main() {
	names := []string{"ana", "bob", "alex", "bina"}
	groups := map[byte][]string{}
	for _, n := range names {
		groups[n[0]] = append(groups[n[0]], n) // {nil slice is fine|nil slice চলবে}
	}
	fmt.Println(string('a'), groups['a'])
	fmt.Println(string('b'), groups['b'])
}` },
    ],
    takeaways: [
      L('Maps give fast lookup by key. Keys must be comparable types (no slices or maps as keys).', 'Map key দিয়ে দ্রুত খোঁজা দেয়। Key হতে হবে comparable type (slice বা map key হতে পারে না)।'),
      L('Missing keys return the zero value. Use <code>v, ok := m[k]</code> to detect absence.', 'নেই এমন key zero value দেয়। অনুপস্থিতি ধরতে <code>v, ok := m[k]</code> ব্যবহার করুন।'),
      L('Make maps before writing; a nil map panics on write.', 'লেখার আগে map বানান; nil map-এ লিখলে panic।'),
      L('Iteration order is random, and maps are not safe for concurrent writes.', 'Iteration-এর ক্রম এলোমেলো, আর map একসাথে লেখার জন্য নিরাপদ নয়।'),
    ],
    links: [
      { t: 'Go blog: Go maps in action', url: 'https://go.dev/blog/maps' },
      { t: 'A Tour of Go: Maps', url: 'https://go.dev/tour/moretypes/19' },
      { t: 'Package maps', url: 'https://pkg.go.dev/maps' },
    ],
  });
})();
