(function () {
  const { L, step, out, addr } = GV;
  const mem = (items, title) => ({ type: 'boxes', title: title || L('Memory: each variable is a named box', 'মেমরি: প্রতিটা variable একটা নাম দেওয়া বাক্স'), items });
  const box = (name, type, val, k, cls) => ({ id: name + k, name, type, val, addr: addr(k), cls });

  GV.register({
    id: 'go-variables', track: 'go', phase: 'start', order: 2, minutes: 15,
    title: L('Variables, types and zero values', 'Variable, type আর zero value'),
    summary: L('A variable is a named box in memory. See var vs :=, zero values, copying, and shadowing.', 'Variable হলো মেমরিতে একটা নাম দেওয়া বাক্স। দেখুন var বনাম :=, zero value, কপি, আর shadowing।'),
    idea: L([
      'Picture memory as a long shelf of boxes. A <b>variable</b> is a box with a name label, a fixed <b>type</b> (what kind of thing fits inside), and an <b>address</b> (where the box sits on the shelf). In Go the type is fixed when the box is made: an <code>int</code> box never holds a string.',
      'Go never gives you an empty, random box. Every new variable starts with its type\'s <b>zero value</b>: <code>0</code> for numbers, <code>""</code> for strings, <code>false</code> for bool, <code>nil</code> for pointers, slices and maps. Python would raise an error for an unset name; Go simply hands you a sensible starting value.',
      'Assigning one variable to another <b>copies</b> the value into the other box. After the copy, the two boxes are independent.',
    ], [
      'মেমরিকে একটা লম্বা তাকের বাক্সের সারি হিসেবে ভাবুন। <b>Variable</b> হলো একটা বাক্স, যার গায়ে নামের লেবেল, একটা নির্দিষ্ট <b>type</b> (ভেতরে কী ধরনের জিনিস রাখা যাবে), আর একটা <b>address</b> (তাকের কোথায় বাক্সটা আছে)। Go-তে বাক্স তৈরির সময়েই type ঠিক হয়ে যায়: <code>int</code> বাক্সে কখনো string রাখা যায় না।',
      'Go কখনো খালি বা আবর্জনা-ভরা বাক্স দেয় না। প্রতিটা নতুন variable তার type-এর <b>zero value</b> দিয়ে শুরু হয়: সংখ্যার জন্য <code>0</code>, string-এর জন্য <code>""</code>, bool-এর জন্য <code>false</code>, আর pointer, slice, map-এর জন্য <code>nil</code>।',
      'এক variable আরেকটাতে assign করলে মানটা অন্য বাক্সে <b>কপি</b> হয়। কপির পর দুটো বাক্স সম্পূর্ণ আলাদা।',
    ]),
    visual: {
      file: 'main.go',
      legend: [{ cls: 'cur', label: L('just changed', 'এইমাত্র বদলেছে') }, { cls: 'live', label: L('in scope', 'scope-এর ভেতরে') }],
      examples: [
        {
          label: L('Declare, assign and copy', 'ঘোষণা, assign ও কপি'),
          code: `
package main

import "fmt"

func main() {
	var age int // {declared, starts at zero value 0|ঘোষণা হলো, zero value 0 দিয়ে শুরু} @@a
	age = 27 @@b
	name := "Rashed" // {:= declares and infers the type|:= ঘোষণা করে, type নিজেই বুঝে নেয়} @@c
	var ready bool @@d
	copyAge := age // {copies the value 27|মান 27 কপি হয়} @@e
	copyAge = 30 @@f
	fmt.Println(age, copyAge, name, ready) @@g
}`,
          build() {
            const s = [];
            s.push(step('a', L('<code>var age int</code> makes an int box. We never assigned it, so it holds the zero value <code>0</code>.', '<code>var age int</code> একটা int বাক্স বানায়। আমরা কিছু assign করিনি, তাই এতে zero value <code>0</code>।'), [mem([box('age', 'int', 0, 0, 'hl new')])]));
            s.push(step('b', L('<code>age = 27</code> puts a new value into the <b>same</b> box. The address does not change.', '<code>age = 27</code> <b>একই</b> বাক্সে নতুন মান রাখে। Address বদলায় না।'), [mem([box('age', 'int', 27, 0, 'hl')])]));
            s.push(step('c', L('<code>:=</code> declares and assigns in one go. Go infers the type <code>string</code> from <code>"Rashed"</code>. It only works inside functions.', '<code>:=</code> একসাথে ঘোষণা আর assign করে। <code>"Rashed"</code> দেখে Go নিজেই type <code>string</code> বুঝে নেয়। এটা শুধু function-এর ভেতরে চলে।'), [mem([box('age', 'int', 27, 0), box('name', 'string', '"Rashed"', 1, 'hl new')])]));
            s.push(step('d', L('A bool declared without a value starts as <code>false</code>. No undefined, no null surprises.', 'মান ছাড়া ঘোষণা করা bool শুরু হয় <code>false</code> দিয়ে। undefined বা null-এর কোনো ঝামেলা নেই।'), [mem([box('age', 'int', 27, 0), box('name', 'string', '"Rashed"', 1), box('ready', 'bool', 'false', 4, 'hl new')])]));
            s.push(step('e', L('<code>copyAge := age</code> makes a <b>new box</b> and copies 27 into it. Two boxes, two addresses.', '<code>copyAge := age</code> একটা <b>নতুন বাক্স</b> বানিয়ে তাতে 27 কপি করে। দুটো বাক্স, দুটো address।'), [mem([box('age', 'int', 27, 0, 'live'), box('name', 'string', '"Rashed"', 1), box('ready', 'bool', 'false', 4), box('copyAge', 'int', 27, 5, 'hl new')])], { arrows: [{ from: 'age0', to: 'copyAge5', cls: 'd', label: L('copy', 'কপি') }] }));
            s.push(step('f', L('Changing <code>copyAge</code> touches only its own box.', '<code>copyAge</code> বদলালে শুধু তার নিজের বাক্সটাই বদলায়।'), [mem([box('age', 'int', 27, 0), box('name', 'string', '"Rashed"', 1), box('ready', 'bool', 'false', 4), box('copyAge', 'int', 30, 5, 'hl')])], {
              ask: { q: L('After <code>copyAge = 30</code>, what is <code>age</code>?', '<code>copyAge = 30</code>-এর পর <code>age</code> কত?'), options: ['27', '30', '0'], answer: 0, why: L('Assignment copied the value. The boxes are independent.', 'Assignment মানটা কপি করেছিল। বাক্স দুটো আলাদা।') },
            }));
            s.push(step('g', L('Println prints values separated by spaces. Note the bool printed as <code>false</code>.', 'Println মানগুলো স্পেস দিয়ে আলাদা করে print করে। bool টা <code>false</code> হিসেবে এসেছে।'), [mem([box('age', 'int', 27, 0), box('name', 'string', '"Rashed"', 1), box('ready', 'bool', 'false', 4), box('copyAge', 'int', 30, 5)]), out(['27 30 Rashed false'], 1)], { tone: 'ok' }));
            return s;
          },
        },
        {
          label: L('Shadowing: a new x inside a block', 'Shadowing: block-এর ভেতরে নতুন x'),
          code: `
package main

import "fmt"

func main() {
	x := 1 @@x1
	if x > 0 { @@if
		x := 2 // {a NEW x that hides the outer one|নতুন x, বাইরেরটাকে আড়াল করে} @@x2
		fmt.Println("inner:", x) @@p1
	} @@close
	fmt.Println("outer:", x) @@p2
}`,
          build() {
            const outer = (cls) => mem([box('x', 'int', 1, 0, cls)], L('main() scope', 'main() scope'));
            const inner = (cls) => mem([box('x', 'int', 2, 3, cls)], L('if-block scope', 'if-block scope'));
            return [
              step('x1', L('<code>x := 1</code> creates x in main\'s scope.', '<code>x := 1</code> main-এর scope-এ x তৈরি করে।'), [outer('hl new')]),
              step('if', L('Entering the <code>if</code> block opens a new, inner scope.', '<code>if</code> block-এ ঢুকলে একটা নতুন, ভেতরের scope খোলে।'), [outer('live'), mem([], L('if-block scope', 'if-block scope'))]),
              step('x2', L('<code>x := 2</code> uses <code>:=</code>, so it declares a <b>second</b> x in the inner scope. The outer x is hidden, not changed. This is <b>shadowing</b>.', '<code>x := 2</code>-তে <code>:=</code> আছে, তাই ভেতরের scope-এ <b>দ্বিতীয়</b> একটা x ঘোষণা হয়। বাইরের x লুকিয়ে যায়, বদলায় না। একে বলে <b>shadowing</b>।'), [outer('dim'), inner('hl new')]),
              step('p1', L('Inside the block, the name x means the inner box.', 'Block-এর ভেতরে x নাম মানে ভেতরের বাক্সটা।'), [outer('dim'), inner('live'), out(['inner: 2'], 1)]),
              step('close', L('The block ends and the inner x disappears.', 'Block শেষ, ভেতরের x হারিয়ে গেল।'), [outer('live'), out(['inner: 2'])], {
                ask: { q: L('What will the last line print?', 'শেষ লাইনটা কী print করবে?'), options: ['outer: 1', 'outer: 2', L('compile error', 'compile error')], answer: 0, why: L('The outer x was never assigned 2. Only the inner x was.', 'বাইরের x-এ কখনো 2 assign হয়নি। শুধু ভেতরের x-এ হয়েছিল।') },
              }),
              step('p2', L('The outer x is still 1. Shadowing often hides bugs with <code>err</code>: writing <code>err :=</code> inside a block instead of <code>err =</code>.', 'বাইরের x এখনো 1। Shadowing প্রায়ই <code>err</code>-এর bug লুকায়: block-এর ভেতরে <code>err =</code>-এর বদলে <code>err :=</code> লিখে ফেলা।'), [outer('hl'), out(['inner: 2', 'outer: 1'], 1)], { tone: 'ok' }),
            ];
          },
        },
      ],
    },
    walk: [
      { at: 'a', ex: 0, code: 'var age int', text: L('Long form. Use it when you want the zero value, or at package level where <code>:=</code> is not allowed.', 'লম্বা ফর্ম। zero value চাইলে, বা package level-এ (যেখানে <code>:=</code> চলে না) এটা ব্যবহার করুন।') },
      { at: 'c', ex: 0, code: 'name := "Rashed"', text: L('Short form: declare plus assign, type inferred. The common choice inside functions.', 'ছোট ফর্ম: ঘোষণা আর assign একসাথে, type নিজে থেকে। Function-এর ভেতরে এটাই বেশি ব্যবহার হয়।') },
      { at: 'e', ex: 0, code: 'copyAge := age', text: L('Copies the value. For int, string and structs, you get an independent copy.', 'মান কপি করে। int, string, struct-এর ক্ষেত্রে আলাদা একটা কপি পাবেন।') },
      { at: 'x2', ex: 1, code: 'x := 2', text: L('Inside a block, := makes a new variable with the same name. Use = to change the outer one.', 'Block-এর ভেতরে := একই নামে নতুন variable বানায়। বাইরেরটা বদলাতে = ব্যবহার করুন।') },
    ],
    mistakes: [
      { title: L('Declaring a variable you never use', 'Variable ঘোষণা করে ব্যবহার না করা'), err: './main.go:6:2: declared and not used: total', fix: L('Delete it or use it. Go treats unused local variables as errors to keep code honest.', 'মুছে দিন বা ব্যবহার করুন। কোড পরিষ্কার রাখতে Go অব্যবহৃত local variable-কে error ধরে।') },
      { title: L('Using := outside a function', 'Function-এর বাইরে := ব্যবহার'), err: './main.go:3:1: syntax error: non-declaration statement outside function body', fix: L('At package level write <code>var count = 0</code>. <code>:=</code> only works inside functions.', 'Package level-এ লিখুন <code>var count = 0</code>। <code>:=</code> শুধু function-এর ভেতরে চলে।') },
      { title: L(':= with nothing new on the left', 'বাম পাশে নতুন কিছু না রেখে :='), err: './main.go:8:4: no new variables on left side of :=', fix: L('The variable already exists. Use <code>=</code> to assign.', 'Variable আগেই আছে। Assign করতে <code>=</code> ব্যবহার করুন।') },
      { title: L('Mixing types without converting', 'Convert না করে type মেশানো'), err: './main.go:8:14: invalid operation: age * price (mismatched types int and float64)', fix: L('Go never converts silently. Write <code>float64(age) * price</code>.', 'Go কখনো নিজে থেকে convert করে না। লিখুন <code>float64(age) * price</code>।') },
    ],
    quiz: [
      { q: L('What is the zero value of a <code>string</code>?', '<code>string</code>-এর zero value কী?'), options: ['""', 'nil', '" "'], answer: 0, why: L('An empty string. Strings are never nil in Go.', 'খালি string। Go-তে string কখনো nil হয় না।') },
      { q: L('Which line compiles at package level (outside any function)?', 'কোন লাইনটা package level-এ (function-এর বাইরে) compile হবে?'), options: ['var port = 8080', 'port := 8080', 'port = 8080'], answer: 0, why: L('Only declarations with var, const, type or func are allowed outside functions.', 'Function-এর বাইরে শুধু var, const, type বা func দিয়ে ঘোষণা চলে।') },
      { q: L('<code>a := 5; b := a; b = 9</code>. What is a?', '<code>a := 5; b := a; b = 9</code>। a কত?'), options: ['5', '9', L('it depends', 'নির্ভর করে')], answer: 0, why: L('b got a copy of 5. Changing b never changes a.', 'b পেয়েছিল 5-এর একটা কপি। b বদলালে a বদলায় না।') },
    ],
    exercises: [
      { title: L('Swap two values', 'দুটো মান অদলবদল'),
        task: L('Declare <code>a := 3</code> and <code>b := 7</code>, swap them without a third variable, and print both. Go has a one-line way to do it.', '<code>a := 3</code> আর <code>b := 7</code> ঘোষণা করুন, তৃতীয় variable ছাড়া অদলবদল করে দুটোই print করুন। Go-তে এক লাইনে করার উপায় আছে।'),
        hints: [L('Go allows assigning several variables at once: <code>x, y = ...</code>', 'Go-তে একসাথে কয়েকটা variable assign করা যায়: <code>x, y = ...</code>'), L('The right side is evaluated fully before anything is stored.', 'কিছু রাখার আগে ডান পাশটা পুরোপুরি হিসাব হয়ে যায়।')],
        solution: `package main

import "fmt"

func main() {
	a, b := 3, 7
	a, b = b, a // {right side is evaluated first|আগে ডান পাশ হিসাব হয়}
	fmt.Println(a, b)
}` },
      { title: L('Print every zero value', 'সব zero value print করুন'),
        task: L('Declare an int, a float64, a string and a bool with <code>var</code> and no value. Print them with <code>fmt.Printf("%v %v %q %v\\n", ...)</code>. Why is <code>%q</code> useful for the string?', '<code>var</code> দিয়ে মান ছাড়া একটা int, float64, string আর bool ঘোষণা করুন। <code>fmt.Printf("%v %v %q %v\\n", ...)</code> দিয়ে print করুন। string-এর জন্য <code>%q</code> কেন কাজের?'),
        hints: [L('<code>%v</code> prints any value in its default format.', '<code>%v</code> যেকোনো মান default ফরম্যাটে print করে।'), L('An empty string prints as nothing with %v. %q adds quotes so you can see it.', 'খালি string %v দিয়ে কিছুই দেখায় না। %q quote দেয়, তাই দেখা যায়।')],
        solution: `package main

import "fmt"

func main() {
	var n int
	var f float64
	var s string
	var ok bool
	fmt.Printf("%v %v %q %v\\n", n, f, s, ok) // {prints: 0 0 "" false|print হবে: 0 0 "" false}
}` },
    ],
    takeaways: [
      L('A variable is a typed box with an address. Its type never changes.', 'Variable হলো type-যুক্ত একটা বাক্স, যার address আছে। Type কখনো বদলায় না।'),
      L('New variables start at their zero value, so Go has no uninitialised memory.', 'নতুন variable zero value দিয়ে শুরু হয়, তাই Go-তে অনির্ধারিত মেমরি নেই।'),
      L('Use <code>:=</code> inside functions and <code>var</code> for zero values or package-level variables.', 'Function-এর ভেতরে <code>:=</code>, আর zero value বা package-level variable-এর জন্য <code>var</code>।'),
      L('Assignment copies. Watch for := accidentally shadowing an outer variable.', 'Assignment কপি করে। খেয়াল রাখুন := যেন ভুল করে বাইরের variable shadow না করে।'),
    ],
    links: [
      { t: 'A Tour of Go: Variables', url: 'https://go.dev/tour/basics/8' },
      { t: 'Go spec: The zero value', url: 'https://go.dev/ref/spec#The_zero_value' },
      { t: 'Effective Go: Redeclaration and reassignment', url: 'https://go.dev/doc/effective_go#redeclaration' },
    ],
  });
})();
