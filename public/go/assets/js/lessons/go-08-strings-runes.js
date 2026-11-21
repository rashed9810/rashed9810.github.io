(function () {
  const { L, step, out } = GV;
  const enc = new TextEncoder();
  const hex = (b) => b.toString(16).padStart(2, '0');

  function analyse(s) {
    const groups = [];
    let idx = 0;
    for (const ch of s) {
      const bytes = [...enc.encode(ch)];
      groups.push({ ch, bytes: bytes.map(hex), raw: bytes, idx, cp: 'U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0') });
      idx += bytes.length;
    }
    return { groups, len: idx };
  }
  const qrune = (ch) => (ch === "'" ? "'\\''" : ch === '\\' ? "'\\\\'" : `'${ch}'`);
  const panel = (groups, cur, title, dimFrom) => ({ type: 'bytes', title: title || L('The string as UTF-8 bytes (hex), grouped by rune', 'string টা UTF-8 byte (hex) হিসেবে, rune অনুযায়ী ভাগ করা'), groups: groups.map((g, k) => Object.assign({}, g, { cls: k === cur ? 'cur' : dimFrom != null && k >= dimFrom ? 'dim' : '' })) });

  GV.register({
    id: 'go-strings-runes', track: 'go', phase: 'memory', order: 4, minutes: 18,
    title: L('Strings, bytes and runes (with Bangla)', 'String, byte আর rune (বাংলা দিয়ে)'),
    summary: L('A Go string is a row of UTF-8 bytes. See why len("গো") is 6, how range yields runes, and why slicing can break a letter.', 'Go string হলো UTF-8 byte-এর একটা সারি। দেখুন len("গো") কেন 6, range কীভাবে rune দেয়, আর slice করলে কেন অক্ষর ভেঙে যায়।'),
    idea: L([
      'A Go <code>string</code> is a read-only row of <b>bytes</b>, almost always UTF-8 encoded. English letters take 1 byte each. Bangla letters take <b>3 bytes</b> each. So <code>len(s)</code> counts bytes, not letters.',
      'A <b>rune</b> is Go\'s name for one Unicode code point (an <code>int32</code>). Think of a train: the bytes are the carriages, and a rune is one passenger group that may occupy one carriage (G) or three (গ). <code>for i, r := range s</code> walks passenger by passenger: <code>i</code> is the byte position where each rune starts and <code>r</code> is the rune.',
      'Indexing <code>s[i]</code> gives a single byte, not a letter. Slicing a string at a byte position in the middle of a Bangla letter cuts it in half and you get the replacement character \uFFFD. This matters every time your API handles Bangla names or text.',
      'One more Bangla detail: what a reader sees as one letter can be several runes. "গো" is two runes, the consonant গ (U+0997) and the vowel sign ো (U+09CB).',
    ], [
      'Go <code>string</code> হলো <b>byte</b>-এর একটা শুধু-পড়া-যায় সারি, প্রায় সবসময় UTF-8 এনকোডেড। ইংরেজি অক্ষর প্রতিটা 1 byte। বাংলা অক্ষর প্রতিটা <b>3 byte</b>। তাই <code>len(s)</code> অক্ষর না, byte গোনে।',
      '<b>Rune</b> হলো একটা Unicode code point-এর Go নাম (একটা <code>int32</code>)। একটা ট্রেনের কথা ভাবুন: byte হলো বগি, আর একটা rune হলো যাত্রীদের একটা দল, যারা একটা বগি (G) বা তিনটা বগি (গ) নিতে পারে। <code>for i, r := range s</code> দল ধরে ধরে হাঁটে: <code>i</code> হলো প্রতিটা rune যে byte অবস্থানে শুরু, আর <code>r</code> হলো rune টা।',
      '<code>s[i]</code> একটা byte দেয়, অক্ষর না। বাংলা অক্ষরের মাঝখানের byte-এ string slice করলে অক্ষরটা অর্ধেক কেটে যায়, আর \uFFFD দেখায়। আপনার API যখনই বাংলা নাম বা লেখা নিয়ে কাজ করবে, এটা গুরুত্বপূর্ণ।',
      'আরেকটা বাংলা বিষয়: পাঠক যেটাকে একটা অক্ষর দেখে সেটা কয়েকটা rune হতে পারে। "গো" দুটো rune: ব্যঞ্জন গ (U+0997) আর কার ো (U+09CB)।',
    ]),
    visual: {
      file: 'main.go',
      legend: [{ cls: 'cur', label: L('current rune', 'বর্তমান rune') }],
      examples: [
        {
          label: L('len, rune count and range', 'len, rune গণনা আর range'),
          inputs: [{ key: 's', label: L('Any text (try your name in Bangla)', 'যেকোনো লেখা (বাংলায় নিজের নাম দিয়ে দেখুন)'), type: 'text', def: 'Go গো', maxLen: 10 }],
          code: (inp) => {
            const a = analyse(inp.s);
            const k = (a.groups.find((g) => g.raw.length > 1) || a.groups[0]).idx;
            return `
package main

import (
	"fmt"
	"unicode/utf8"
)

func main() {
	s := ${JSON.stringify(inp.s)} @@s
	fmt.Println(len(s)) // {counts BYTES|BYTE গোনে} @@len
	fmt.Println(utf8.RuneCountInString(s)) // {counts runes|rune গোনে} @@cnt
	for i, r := range s { // {i = byte index, r = rune|i = byte index, r = rune} @@range
		fmt.Printf("%d %q\\n", i, r) @@pr
	}
	fmt.Println(s[${k}]) // {one byte, not a letter|একটা byte, অক্ষর না} @@idx
}`;
          },
          build({ s }) {
            const a = analyse(s);
            const lines = [];
            const steps = [];
            const multi = a.groups.find((g) => g.raw.length > 1);
            steps.push(step('s', L(`The string is stored as ${a.len} bytes. Each box below is one rune; the small cells are its bytes with their byte index.`, `string টা ${a.len}টা byte হিসেবে রাখা। নিচের প্রতিটা বাক্স একটা rune; ছোট ঘরগুলো তার byte, সাথে byte index।`), [panel(a.groups, -1)]));
            lines.push(String(a.len));
            steps.push(step('len', L(`<code>len(s)</code> is <b>${a.len}</b>: the number of bytes.${multi ? ' Bangla letters use 3 bytes each.' : ''}`, `<code>len(s)</code> = <b>${a.len}</b>: byte-এর সংখ্যা।${multi ? ' বাংলা অক্ষর প্রতিটা 3 byte নেয়।' : ''}`), [panel(a.groups, -1), out(lines.slice(), 1)], multi ? {
              ask: { q: L(`How many bytes is <code>${GV.esc(s)}</code>?`, `<code>${GV.esc(s)}</code> কত byte?`), options: [String(a.len), String(a.groups.length), String(a.len + 2)], answer: 0, why: L('ASCII characters are 1 byte; each Bangla code point here is 3 bytes in UTF-8.', 'ASCII অক্ষর 1 byte; এখানে প্রতিটা বাংলা code point UTF-8-এ 3 byte।') },
            } : {}));
            lines.push(String(a.groups.length));
            steps.push(step('cnt', L(`<code>utf8.RuneCountInString</code> counts runes: <b>${a.groups.length}</b>.`, `<code>utf8.RuneCountInString</code> rune গোনে: <b>${a.groups.length}</b>।`), [panel(a.groups, -1), out(lines.slice(), 1)]));
            a.groups.forEach((g, k) => {
              steps.push(step('range', L(`range decodes the rune starting at byte <b>${g.idx}</b>: ${g.cp}, ${g.raw.length} byte${g.raw.length > 1 ? 's' : ''}.`, `range byte <b>${g.idx}</b> থেকে শুরু হওয়া rune decode করে: ${g.cp}, ${g.raw.length} byte।`), [panel(a.groups, k), out(lines.slice())]));
              lines.push(`${g.idx} ${qrune(g.ch)}`);
              steps.push(step('pr', L(`Print the byte index ${g.idx} and the rune. ${k + 1 < a.groups.length ? `The next index jumps to ${a.groups[k + 1].idx}.` : 'That was the last rune.'}`, `byte index ${g.idx} আর rune print। ${k + 1 < a.groups.length ? `পরের index লাফিয়ে ${a.groups[k + 1].idx}।` : 'এটাই শেষ rune।'}`), [panel(a.groups, k), out(lines.slice(), 1)]));
            });
            const kb = (multi || a.groups[0]).idx;
            const byteVal = (multi || a.groups[0]).raw[0];
            lines.push(String(byteVal));
            steps.push(step('idx', L(`<code>s[${kb}]</code> is a single <b>byte</b>: ${byteVal} (0x${hex(byteVal)}). ${multi ? 'It is only the first third of a Bangla letter.' : ''}`, `<code>s[${kb}]</code> একটা মাত্র <b>byte</b>: ${byteVal} (0x${hex(byteVal)})। ${multi ? 'এটা একটা বাংলা অক্ষরের প্রথম এক-তৃতীয়াংশ মাত্র।' : ''}`), [panel(a.groups, a.groups.indexOf(multi || a.groups[0])), out(lines.slice(), 1)], { tone: 'ok' }));
            return steps;
          },
        },
        {
          label: L('Slicing through the middle of a letter', 'অক্ষরের মাঝখান দিয়ে slice'),
          code: `
package main

import "fmt"

func main() {
	s := "Go গো" @@s
	fmt.Println(s[:4]) // {cuts গ after 1 of its 3 bytes|গ-এর ৩ byte-এর ১টার পরেই কাটে} @@bad
	r := []rune(s) // {decode into runes first|আগে rune-এ decode করো} @@runes
	fmt.Println(string(r[:4])) // {cuts on rune boundaries|rune-এর সীমানায় কাটে} @@good
}`,
          build() {
            const a = analyse('Go গো');
            const cutPanel = (upto, title) => ({ type: 'bytes', title, groups: a.groups.map((g) => Object.assign({}, g, { cls: g.idx + g.raw.length <= upto ? 'cur' : g.idx < upto ? 'bad' : 'dim' })) });
            const runes = (n) => ({ type: 'array', title: L('[]rune(s): one cell per rune', '[]rune(s): প্রতি rune-এ একটা ঘর'), chars: true, cells: a.groups.map((g, k) => ({ v: g.ch === ' ' ? '␠' : g.ch, cls: k < n ? 'ok' : '' })) });
            return [
              step('s', L('Nine bytes, five runes.', 'নয়টা byte, পাঁচটা rune।'), [panel(a.groups, -1)]),
              step('bad', L('<code>s[:4]</code> takes bytes 0 to 3. Byte 3 is only the first of গ\'s three bytes, so the result ends with a broken, invalid sequence.', '<code>s[:4]</code> byte 0 থেকে 3 নেয়। Byte 3 হলো গ-এর তিনটা byte-এর প্রথমটা মাত্র, তাই ফলাফলের শেষে একটা ভাঙা, অবৈধ ক্রম থাকে।'), [cutPanel(4, L('s[:4] keeps bytes 0–3', 's[:4] রাখে byte 0–3')), out([{ v: 'Go \uFFFD', cls: 'bad' }])], {
                tone: 'bad',
              }),
              step('runes', L('Converting to <code>[]rune</code> decodes the UTF-8 so each element is one whole code point. This allocates a new slice of 4-byte runes.', '<code>[]rune</code>-এ রূপান্তর করলে UTF-8 decode হয়, তাই প্রতিটা উপাদান একটা পুরো code point। এতে 4-byte rune-এর নতুন একটা slice তৈরি হয়।'), [runes(0), out([{ v: 'Go \uFFFD', cls: 'bad' }])], {
                ask: { q: L('What does <code>string(r[:4])</code> print?', '<code>string(r[:4])</code> কী print করবে?'), options: ['Go গ', 'Go গো', 'Go \uFFFD'], answer: 0, why: L('The first four runes are G, o, space and গ. The vowel sign ো is the fifth rune.', 'প্রথম চারটা rune হলো G, o, স্পেস আর গ। কার ো হলো পঞ্চম rune।') },
              }),
              step('good', L('Cutting by runes never splits a code point. Note the vowel sign ো was the fifth rune, so it is not included.', 'Rune ধরে কাটলে কোনো code point ভাঙে না। খেয়াল করুন কার ো ছিল পঞ্চম rune, তাই সেটা নেই।'), [runes(4), out([{ v: 'Go \uFFFD', cls: 'bad' }, { v: 'Go গ', cls: 'new' }])], { tone: 'ok' }),
            ];
          },
        },
      ],
    },
    walk: [
      { at: 'len', ex: 0, code: 'len(s)', text: L('Bytes, always. Use it for buffer sizes, not for "number of letters".', 'সবসময় byte। Buffer size-এর জন্য ব্যবহার করুন, "অক্ষরের সংখ্যা"-র জন্য না।') },
      { at: 'range', ex: 0, code: 'for i, r := range s', text: L('Decodes UTF-8 for you. i is a byte offset and can jump by 3 for Bangla.', 'আপনার হয়ে UTF-8 decode করে। i হলো byte offset, বাংলার জন্য 3 করে লাফাতে পারে।') },
      { at: 'idx', ex: 0, code: 's[k]', text: L('A byte (uint8). Printing it shows a number.', 'একটা byte (uint8)। Print করলে একটা সংখ্যা দেখায়।') },
      { at: 'runes', ex: 1, code: 'r := []rune(s)', text: L('Use when you need to index or slice by character position.', 'অক্ষরের অবস্থান ধরে index বা slice করতে হলে ব্যবহার করুন।') },
    ],
    mistakes: [
      { title: L('Using len to count letters', 'অক্ষর গুনতে len ব্যবহার'), err: '', fix: L('For a name like "রাশেদ", len is 15. Use <code>utf8.RuneCountInString</code> for code points. For user-visible characters (graphemes) you need a package such as golang.org/x/text.', '"রাশেদ"-এর মতো নামের len 15। Code point-এর জন্য <code>utf8.RuneCountInString</code> ব্যবহার করুন। ব্যবহারকারী যেভাবে অক্ষর দেখে (grapheme) তার জন্য golang.org/x/text এর মতো package লাগবে।') },
      { title: L('Trying to change a character in place', 'জায়গাতেই অক্ষর বদলানোর চেষ্টা'), err: './main.go:7:2: cannot assign to s[0] (neither addressable nor a map index expression)', fix: L('Strings are immutable. Convert to <code>[]byte</code> or <code>[]rune</code>, change it, then convert back.', 'String অপরিবর্তনীয়। <code>[]byte</code> বা <code>[]rune</code>-এ রূপান্তর করে বদলান, তারপর আবার string করুন।') },
      { title: L('Building a long string with += in a loop', 'লুপে += দিয়ে লম্বা string বানানো'), err: '', fix: L('Each <code>+=</code> copies the whole string, so the loop is O(n²). Use <code>strings.Builder</code>.', 'প্রতিটা <code>+=</code> পুরো string কপি করে, তাই লুপটা O(n²)। <code>strings.Builder</code> ব্যবহার করুন।') },
    ],
    perf: L([
      '<code>[]rune(s)</code> and <code>string(r)</code> both allocate and copy. Inside hot loops, prefer <code>for range</code> over the string or the <code>unicode/utf8</code> functions, which decode without allocating.',
      'Converting between <code>string</code> and <code>[]byte</code> copies too. Many standard library functions come in both forms (<code>strings.Contains</code> and <code>bytes.Contains</code>) so you can stay in one type.',
    ], [
      '<code>[]rune(s)</code> আর <code>string(r)</code> দুটোই নতুন মেমরি নিয়ে কপি করে। ঘনঘন চলা লুপে string-এর উপর <code>for range</code> বা <code>unicode/utf8</code>-এর function ব্যবহার করুন, এগুলো মেমরি না নিয়েই decode করে।',
      '<code>string</code> আর <code>[]byte</code>-এর মধ্যে রূপান্তরও কপি করে। Standard library-র অনেক function দুই রূপেই আছে (<code>strings.Contains</code> আর <code>bytes.Contains</code>), তাই একটা type-এই থাকতে পারেন।',
    ]),
    quiz: [
      { q: L('What is <code>len("গো")</code>?', '<code>len("গো")</code> কত?'), options: ['6', '2', '1'], answer: 0, why: L('Two code points, three bytes each.', 'দুটো code point, প্রতিটা তিন byte।') },
      { q: L('In <code>for i, r := range s</code>, what is i?', '<code>for i, r := range s</code>-এ i কী?'), options: [L('The byte index where rune r starts', 'যে byte index-এ rune r শুরু'), L('The rune number: 0, 1, 2, …', 'rune-এর ক্রমিক নম্বর: 0, 1, 2, …'), L('The rune\'s length', 'rune-এর দৈর্ঘ্য')], answer: 0, why: L('That is why i jumps from 3 to 6 over a Bangla letter.', 'এজন্যই বাংলা অক্ষরের উপর i, 3 থেকে 6-এ লাফায়।') },
      { q: L('What type is <code>s[0]</code>?', '<code>s[0]</code>-এর type কী?'), options: ['byte (uint8)', 'rune', 'string'], answer: 0, why: L('Indexing a string gives a byte.', 'String index করলে byte পাওয়া যায়।') },
    ],
    exercises: [
      { title: L('Reverse a string safely', 'নিরাপদে string উল্টানো'),
        task: L('Write <code>func reverse(s string) string</code> that works for "hello" and for "বাংলা" without producing \uFFFD. Then think: does the Bangla result read correctly? Why not?', '<code>func reverse(s string) string</code> লিখুন যেটা "hello" আর "বাংলা" দুটোর জন্যই \uFFFD ছাড়া কাজ করে। তারপর ভাবুন: বাংলা ফলাফল কি ঠিকমতো পড়া যায়? কেন না?'),
        hints: [L('Reverse a <code>[]rune</code>, not the bytes.', 'Byte না, <code>[]rune</code> উল্টান।'), L('The vowel sign ো is its own rune, so after reversing it sits before its consonant.', 'কার ো নিজেই একটা rune, তাই উল্টানোর পর এটা ব্যঞ্জনের আগে চলে যায়।')],
        solution: `package main

import "fmt"

func reverse(s string) string {
	r := []rune(s)
	for i, j := 0, len(r)-1; i < j; i, j = i+1, j-1 {
		r[i], r[j] = r[j], r[i]
	}
	return string(r)
}

func main() {
	fmt.Println(reverse("hello"))
	fmt.Println(reverse("বাংলা")) // {valid UTF-8, but vowel signs move|বৈধ UTF-8, কিন্তু কার সরে যায়}
}` },
      { title: L('Build a string efficiently', 'দক্ষভাবে string বানানো'),
        task: L('Use <code>strings.Builder</code> to build the string "1,2,3,…,1000" (no trailing comma) and print its length.', '<code>strings.Builder</code> দিয়ে "1,2,3,…,1000" string বানান (শেষে কমা নেই) আর এর length print করুন।'),
        hints: [L('<code>var b strings.Builder</code>; then <code>b.WriteString</code> and <code>b.String()</code>.', '<code>var b strings.Builder</code>; তারপর <code>b.WriteString</code> আর <code>b.String()</code>।'), L('<code>strconv.Itoa(i)</code> turns an int into a string.', '<code>strconv.Itoa(i)</code> int-কে string বানায়।')],
        solution: `package main

import (
	"fmt"
	"strconv"
	"strings"
)

func main() {
	var b strings.Builder
	for i := 1; i <= 1000; i++ {
		if i > 1 {
			b.WriteByte(',')
		}
		b.WriteString(strconv.Itoa(i))
	}
	fmt.Println(len(b.String())) // {3892|3892}
}` },
    ],
    takeaways: [
      L('A string is immutable UTF-8 bytes. <code>len</code> counts bytes.', 'String হলো অপরিবর্তনীয় UTF-8 byte। <code>len</code> byte গোনে।'),
      L('A rune is one code point. <code>for range</code> over a string yields runes and their byte offsets.', 'Rune হলো একটা code point। String-এর উপর <code>for range</code> rune আর তার byte offset দেয়।'),
      L('Bangla letters are 3 bytes each; slicing by bytes can cut them. Slice <code>[]rune</code> instead.', 'বাংলা অক্ষর প্রতিটা 3 byte; byte ধরে slice করলে কেটে যেতে পারে। বরং <code>[]rune</code> slice করুন।'),
      L('Use strings.Builder to build strings in loops.', 'লুপে string বানাতে strings.Builder ব্যবহার করুন।'),
    ],
    links: [
      { t: 'Go blog: Strings, bytes, runes and characters in Go', url: 'https://go.dev/blog/strings' },
      { t: 'Package unicode/utf8', url: 'https://pkg.go.dev/unicode/utf8' },
      { t: 'Package strings', url: 'https://pkg.go.dev/strings' },
    ],
  });
})();
