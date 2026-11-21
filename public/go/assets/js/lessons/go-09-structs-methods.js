(function () {
  const { L, step, out } = GV;
  const stack = (items) => ({ type: 'frames', title: L('Call stack', 'Call stack'), items });
  const acc = (id, bal, cls, hlBal) => ({ id, k: 'acc', cls, fields: [{ k: 'Owner', v: '"Rashed"' }, { k: 'Balance', v: bal, cls: hlBal ? 'hl' : '' }] });

  GV.register({
    id: 'go-structs-methods', track: 'go', phase: 'types', order: 1, minutes: 18,
    title: L('Structs and methods', 'Struct আর method'),
    summary: L('Group fields into a struct, attach methods, and see why a value receiver changes a copy while a pointer receiver changes the original.', 'Field গুলো struct-এ একত্র করুন, method যোগ করুন, আর দেখুন value receiver কেন কপি বদলায় আর pointer receiver আসলটা।'),
    idea: L([
      'A <b>struct</b> is a record with named fields, like a form with labelled boxes: an <code>Account</code> has an Owner and a Balance. Go has no classes. Instead you declare a struct type and attach <b>methods</b> to it.',
      'A method is just a function with a <b>receiver</b> written before its name: <code>func (a *Account) Deposit(n int)</code>. The receiver is a parameter like any other, so the copy rule applies. A <b>value receiver</b> <code>(a Account)</code> gets a photocopy of the form; scribbling on it changes nothing. A <b>pointer receiver</b> <code>(a *Account)</code> gets the address of the original form.',
      'The usual rule: if any method needs to change the struct, or the struct is large, use pointer receivers for all its methods.',
    ], [
      '<b>Struct</b> হলো নাম দেওয়া field-সহ একটা রেকর্ড, লেবেল লাগানো ঘরের একটা ফর্মের মতো: একটা <code>Account</code>-এ Owner আর Balance আছে। Go-তে class নেই। বরং একটা struct type ঘোষণা করে তার সাথে <b>method</b> যুক্ত করা হয়।',
      'Method হলো এমন একটা function যার নামের আগে একটা <b>receiver</b> লেখা থাকে: <code>func (a *Account) Deposit(n int)</code>। Receiver অন্য যেকোনো parameter-এর মতোই, তাই কপির নিয়ম খাটে। <b>Value receiver</b> <code>(a Account)</code> ফর্মের একটা ফটোকপি পায়; তাতে লিখলে কিছুই বদলায় না। <b>Pointer receiver</b> <code>(a *Account)</code> আসল ফর্মের address পায়।',
      'সাধারণ নিয়ম: কোনো method যদি struct বদলাতে চায়, বা struct বড় হয়, তাহলে তার সব method-এ pointer receiver ব্যবহার করুন।',
    ]),
    visual: {
      file: 'main.go',
      examples: [
        {
          label: L('Value vs pointer receiver', 'Value বনাম pointer receiver'),
          code: `
package main

import "fmt"

type Account struct { @@type
	Owner   string
	Balance int
}

func (a Account) DepositCopy(n int) { @@vm
	a.Balance += n // {changes the copy only|শুধু কপি বদলায়} @@vadd
}

func (a *Account) Deposit(n int) { @@pm
	a.Balance += n // {changes the original|আসলটা বদলায়} @@padd
}

func main() {
	acc := Account{Owner: "Rashed", Balance: 100} @@new
	acc.DepositCopy(50) @@c1
	fmt.Println(acc.Balance) @@p1
	acc.Deposit(50) // {Go passes &acc automatically|Go নিজে থেকে &acc পাঠায়} @@c2
	fmt.Println(acc.Balance) @@p2
}`,
          build() {
            const m = (bal, hl) => ({ fn: 'main()', vars: [acc('macc', bal, '', hl)] });
            return [
              step('new', L('A struct literal with named fields. The whole struct lives in main\'s frame.', 'নাম দেওয়া field-সহ একটা struct literal। পুরো struct main-এর frame-এ থাকে।'), [stack([m(100)])]),
              step('vm', L('<code>DepositCopy</code> has a value receiver, so the <b>entire struct is copied</b> into its frame.', '<code>DepositCopy</code>-এর value receiver, তাই <b>পুরো struct কপি</b> হয়ে তার frame-এ যায়।'), [stack([m(100), { fn: 'Account.DepositCopy(a, n)', vars: [{ k: 'a', fields: [{ k: 'Owner', v: '"Rashed"' }, { k: 'Balance', v: 100 }], cls: 'new' }, { k: 'n', v: 50 }] }])]),
              step('vadd', L('The copy\'s Balance becomes 150. main\'s acc is still 100.', 'কপির Balance হলো 150। main-এর acc এখনো 100।'), [stack([m(100), { fn: 'Account.DepositCopy(a, n)', vars: [{ k: 'a', fields: [{ k: 'Owner', v: '"Rashed"' }, { k: 'Balance', v: 150, cls: 'hl' }] }, { k: 'n', v: 50 }] }])], {
                ask: { q: L('What does the next <code>fmt.Println(acc.Balance)</code> print?', 'পরের <code>fmt.Println(acc.Balance)</code> কী print করবে?'), options: ['100', '150', '50'], answer: 0, why: L('The method changed a copy that disappears when it returns.', 'Method একটা কপি বদলেছে, যেটা return করলেই হারিয়ে যায়।') },
              }),
              step('p1', L('The change was lost with the copy.', 'কপির সাথেই পরিবর্তনটা হারিয়ে গেল।'), [stack([m(100)]), out(['100'], 1)], { tone: 'bad' }),
              step('pm', L('<code>acc.Deposit(50)</code> has a pointer receiver. Because acc is a variable, Go quietly passes <code>&amp;acc</code>.', '<code>acc.Deposit(50)</code>-এর pointer receiver। acc একটা variable, তাই Go চুপচাপ <code>&amp;acc</code> পাঠায়।'), [stack([m(100), { fn: '(*Account).Deposit(a, n)', vars: [{ id: 'pa', k: 'a', v: '&acc', cls: 'new' }, { k: 'n', v: 50 }] }]), out(['100'])], { arrows: [{ from: 'pa', to: 'macc' }] }),
              step('padd', L('<code>a.Balance</code> on a pointer automatically means <code>(*a).Balance</code>. The original changes.', 'Pointer-এর উপর <code>a.Balance</code> মানে নিজে থেকেই <code>(*a).Balance</code>। আসলটা বদলায়।'), [stack([m(150, true), { fn: '(*Account).Deposit(a, n)', vars: [{ id: 'pa', k: 'a', v: '&acc' }, { k: 'n', v: 50 }] }]), out(['100'])], { arrows: [{ from: 'pa', to: 'macc', cls: 'w' }] }),
              step('p2', L('150. Pointer receivers are how methods change their struct.', '150। Pointer receiver দিয়েই method তার struct বদলায়।'), [stack([m(150)]), out(['100', '150'], 1)], { tone: 'ok' }),
            ];
          },
        },
        {
          label: L('range copies each element', 'range প্রতিটা উপাদান কপি করে'),
          code: `
package main

import "fmt"

type Account struct {
	Owner   string
	Balance int
}

func main() {
	accs := []Account{{"A", 10}, {"B", 20}} @@make
	for _, a := range accs { // {a is a copy of each element|a প্রতিটা উপাদানের কপি} @@r1
		a.Balance = 0 @@z1
	}
	fmt.Println(accs) @@p1
	for i := range accs { // {use the index to reach the real element|আসল উপাদানে পৌঁছাতে index ব্যবহার করো} @@r2
		accs[i].Balance = 0 @@z2
	}
	fmt.Println(accs) @@p2
}`,
          build() {
            const arr = (b0, b1, cur, cls) => ({ type: 'array', title: L('accs: []Account', 'accs: []Account'), cells: [{ v: `A:${b0}`, cls: cur === 0 ? cls : '' }, { v: `B:${b1}`, cls: cur === 1 ? cls : '' }] });
            const loopVar = (v, cls) => ({ type: 'boxes', items: [{ name: 'a', type: 'Account (copy)', fields: [{ k: 'Owner', v: v[0] }, { k: 'Balance', v: v[1], cls: cls }], cls: 'ghost' }] });
            return [
              step('make', L('A slice of two structs. Each element is a full struct stored in the backing array.', 'দুটো struct-এর একটা slice। প্রতিটা উপাদান backing array-তে রাখা একটা পুরো struct।'), [arr(10, 20)]),
              step('r1', L('First iteration: <code>a</code> receives a <b>copy</b> of accs[0].', 'প্রথম ঘুরতি: <code>a</code> পায় accs[0]-এর একটা <b>কপি</b>।'), [arr(10, 20, 0, 'live'), loopVar(['"A"', 10])]),
              step('z1', L('Zeroing the copy. accs[0] is unchanged.', 'কপিটা শূন্য করা হলো। accs[0] অপরিবর্তিত।'), [arr(10, 20, 0, 'live'), loopVar(['"A"', 0], 'hl')]),
              step('z1', L('Second iteration: same story for B.', 'দ্বিতীয় ঘুরতি: B-এর ক্ষেত্রেও একই।'), [arr(10, 20, 1, 'live'), loopVar(['"B"', 0], 'hl')], {
                ask: { q: L('What does <code>fmt.Println(accs)</code> print now?', 'এখন <code>fmt.Println(accs)</code> কী print করবে?'), options: ['[{A 10} {B 20}]', '[{A 0} {B 0}]'], answer: 0, why: L('Only the loop variable copies were changed.', 'শুধু loop variable-এর কপিগুলো বদলেছে।') },
              }),
              step('p1', L('Nothing changed in the slice.', 'Slice-এ কিছুই বদলায়নি।'), [arr(10, 20), out(['[{A 10} {B 20}]'], 1)], { tone: 'bad' }),
              step('z2', L('With the index, <code>accs[i].Balance</code> writes straight into the backing array.', 'Index দিয়ে <code>accs[i].Balance</code> সরাসরি backing array-তে লেখে।'), [arr(0, 20, 0, 'cur'), out(['[{A 10} {B 20}]'])]),
              step('z2', L('Same for the second element.', 'দ্বিতীয় উপাদানের জন্যও একই।'), [arr(0, 0, 1, 'cur'), out(['[{A 10} {B 20}]'])]),
              step('p2', L('Both balances are zero now.', 'এখন দুটো balance-ই শূন্য।'), [arr(0, 0), out(['[{A 10} {B 20}]', '[{A 0} {B 0}]'], 1)], { tone: 'ok' }),
            ];
          },
        },
      ],
    },
    walk: [
      { at: 'type', ex: 0, code: 'type Account struct {', text: L('A new named type. Capitalised fields are exported, which also matters for encoding/json.', 'একটা নতুন নামযুক্ত type। বড় হাতের field exported, যা encoding/json-এর জন্যও গুরুত্বপূর্ণ।') },
      { at: 'vm', ex: 0, code: 'func (a Account) DepositCopy(n int)', text: L('Value receiver: fine for methods that only read.', 'Value receiver: শুধু পড়ে এমন method-এর জন্য ঠিক আছে।') },
      { at: 'pm', ex: 0, code: 'func (a *Account) Deposit(n int)', text: L('Pointer receiver: required to modify the struct.', 'Pointer receiver: struct বদলাতে এটাই লাগবে।') },
      { at: 'z2', ex: 1, code: 'accs[i].Balance = 0', text: L('Modify slice elements through the index, not the range copy.', 'Slice-এর উপাদান index দিয়ে বদলান, range-এর কপি দিয়ে না।') },
    ],
    mistakes: [
      { title: L('Mutating through a value receiver', 'Value receiver দিয়ে বদলানোর চেষ্টা'), err: '', fix: L('No error, no change: the silent bug. <code>go vet</code> will not catch it either. Use a pointer receiver.', 'কোনো error নেই, কোনো পরিবর্তনও নেই: নীরব bug। <code>go vet</code>-ও এটা ধরবে না। Pointer receiver ব্যবহার করুন।') },
      { title: L('Mixing value and pointer receivers', 'Value আর pointer receiver মেশানো'), err: '', fix: L('Pick one style per type. Mixed receivers cause confusing interface behaviour (next lesson).', 'প্রতিটা type-এর জন্য একটা স্টাইল বেছে নিন। মেশানো receiver interface-এ বিভ্রান্তিকর আচরণ তৈরি করে (পরের লেসন)।') },
      { title: L('Comparing structs that hold slices', 'Slice-সহ struct তুলনা'), err: './main.go:14:5: invalid operation: a == b (struct containing []string cannot be compared)', fix: L('Structs are comparable only if every field is. Compare fields yourself, or use <code>slices.Equal</code> for slice fields.', 'সব field comparable হলে তবেই struct comparable। নিজে field তুলনা করুন, অথবা slice field-এর জন্য <code>slices.Equal</code>।') },
    ],
    quiz: [
      { q: L('Which receiver lets a method change the struct\'s fields?', 'কোন receiver দিয়ে method struct-এর field বদলাতে পারে?'), options: ['(a *Account)', '(a Account)', L('either', 'যেকোনোটা')], answer: 0, why: L('Only a pointer receiver reaches the original.', 'শুধু pointer receiver আসলটায় পৌঁছায়।') },
      { q: L('<code>acc</code> is a variable of type Account. Can you call a pointer method as <code>acc.Deposit(5)</code>?', '<code>acc</code> একটা Account variable। Pointer method কি <code>acc.Deposit(5)</code> এভাবে call করা যায়?'), options: [L('Yes, Go takes &acc automatically', 'হ্যাঁ, Go নিজে থেকে &acc নেয়'), L('No, you must write (&acc).Deposit(5)', 'না, (&acc).Deposit(5) লিখতে হবে')], answer: 0, why: L('Addressable values get an automatic &.', 'Addressable মানে নিজে থেকেই & যোগ হয়।') },
      { q: L('Inside <code>for _, a := range accs</code>, <code>a</code> is…', '<code>for _, a := range accs</code>-এর ভেতরে <code>a</code> হলো…'), options: [L('a copy of the element', 'উপাদানের কপি'), L('a reference to the element', 'উপাদানের reference')], answer: 0, why: L('range assigns each element to the loop variable by value.', 'range প্রতিটা উপাদান value হিসেবে loop variable-এ রাখে।') },
    ],
    exercises: [
      { title: L('Rectangle', 'আয়তক্ষেত্র'),
        task: L('Define <code>type Rect struct{ W, H float64 }</code> with a method <code>Area() float64</code> (value receiver) and <code>Scale(f float64)</code> (pointer receiver) that multiplies both sides. Show that Scale really changes the rectangle.', '<code>type Rect struct{ W, H float64 }</code> ঘোষণা করুন, সাথে <code>Area() float64</code> (value receiver) আর দুই বাহু গুণ করা <code>Scale(f float64)</code> (pointer receiver)। দেখান Scale সত্যিই আয়তক্ষেত্র বদলায়।'),
        hints: [L('Area only reads, so a value receiver is fine.', 'Area শুধু পড়ে, তাই value receiver চলবে।'), L('Some teams prefer all-pointer receivers for consistency. Either is acceptable here.', 'কিছু টিম সামঞ্জস্যের জন্য সব pointer receiver পছন্দ করে। এখানে দুটোই চলবে।')],
        solution: `package main

import "fmt"

type Rect struct{ W, H float64 }

func (r Rect) Area() float64 { return r.W * r.H }

func (r *Rect) Scale(f float64) {
	r.W *= f
	r.H *= f
}

func main() {
	r := Rect{W: 2, H: 3}
	fmt.Println(r.Area()) // {6|6}
	r.Scale(2)
	fmt.Println(r.Area()) // {24|24}
}` },
      { title: L('Withdraw with a rule', 'নিয়মসহ টাকা তোলা'),
        task: L('Add <code>func (a *Account) Withdraw(n int) bool</code> that refuses (returns false, balance unchanged) when n is more than the balance. In the errors lesson you will turn this bool into an error.', '<code>func (a *Account) Withdraw(n int) bool</code> যোগ করুন, যেটা n যদি balance-এর বেশি হয় তাহলে অস্বীকার করে (false ফেরত, balance অপরিবর্তিত)। Error লেসনে এই bool-কে error বানাবেন।'),
        hints: [L('Check first, then subtract.', 'আগে যাচাই, তারপর বিয়োগ।'), L('Return early on the failure path.', 'ব্যর্থতার পথে আগেই return করুন।')],
        solution: `package main

import "fmt"

type Account struct {
	Owner   string
	Balance int
}

func (a *Account) Withdraw(n int) bool {
	if n > a.Balance {
		return false // {refuse, keep balance|অস্বীকার, balance যেমন ছিল}
	}
	a.Balance -= n
	return true
}

func main() {
	acc := Account{Owner: "Rashed", Balance: 100}
	fmt.Println(acc.Withdraw(30), acc.Balance)  // {true 70|true 70}
	fmt.Println(acc.Withdraw(500), acc.Balance) // {false 70|false 70}
}` },
    ],
    takeaways: [
      L('Structs group named fields; methods attach behaviour through a receiver.', 'Struct নাম দেওয়া field একত্র করে; method receiver দিয়ে আচরণ যুক্ত করে।'),
      L('Value receivers get a copy. Pointer receivers can change the original.', 'Value receiver কপি পায়। Pointer receiver আসলটা বদলাতে পারে।'),
      L('If one method needs a pointer receiver, give all methods of that type pointer receivers.', 'একটা method-এর pointer receiver লাগলে ওই type-এর সব method-কে pointer receiver দিন।'),
      L('range copies elements; modify slices through their index.', 'range উপাদান কপি করে; slice বদলান index দিয়ে।'),
    ],
    links: [
      { t: 'A Tour of Go: Methods', url: 'https://go.dev/tour/methods/1' },
      { t: 'Go FAQ: Should I define methods on values or pointers?', url: 'https://go.dev/doc/faq#methods_on_values_or_pointers' },
      { t: 'Go Code Review Comments: Receiver type', url: 'https://go.dev/wiki/CodeReviewComments#receiver-type' },
    ],
  });
})();
