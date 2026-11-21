(function () {
  const { L, step, out } = GV;
  const iface = (name, type, value, cls) => ({ id: name, name, type: 'Shape (interface)', cls, fields: [{ k: 'type', v: type, id: name + '-t' }, { k: 'value', v: value, id: name + '-v' }] });
  const mem = (items, title) => ({ type: 'boxes', title: title || L('An interface value is a (type, value) pair', 'Interface value হলো একটা (type, value) জোড়া'), items });

  GV.register({
    id: 'go-interfaces', track: 'go', phase: 'types', order: 2, minutes: 20,
    title: L('Interfaces', 'Interface'),
    summary: L('An interface value is a (type, value) pair. See implicit implementation, dynamic dispatch, and the typed-nil gotcha that breaks err != nil.', 'Interface value হলো একটা (type, value) জোড়া। দেখুন নীরব implementation, dynamic dispatch, আর typed-nil-এর ফাঁদ যা err != nil ভেঙে দেয়।'),
    idea: L([
      'An <b>interface</b> is a job description. <code>Shape</code> says: "anything with an <code>Area() float64</code> method can do this job." A type never declares that it implements an interface. If it has the methods, it qualifies. This is called <b>implicit</b> or structural typing, and it keeps packages loosely coupled.',
      'Under the hood an interface variable holds two things: the <b>dynamic type</b> (which concrete type is inside, for example Rect) and the <b>value</b> (the Rect itself). Calling <code>s.Area()</code> looks at the type half and jumps to that type\'s method. That is <b>dynamic dispatch</b>.',
      'An interface is nil only when <b>both</b> halves are nil. If you put a nil <code>*MyErr</code> pointer into an <code>error</code>, the type half is filled in, so the interface is not nil. This one surprises almost every Go developer once.',
    ], [
      '<b>Interface</b> হলো একটা কাজের বিবরণ। <code>Shape</code> বলে: "যার <code>Area() float64</code> method আছে সে এই কাজ করতে পারবে।" কোনো type কখনো ঘোষণা করে না যে সে একটা interface implement করে। Method থাকলেই সে যোগ্য। একে বলে <b>implicit</b> বা structural typing, এতে package-গুলো আলগাভাবে যুক্ত থাকে।',
      'ভেতরে একটা interface variable দুটো জিনিস রাখে: <b>dynamic type</b> (ভেতরে কোন concrete type আছে, যেমন Rect) আর <b>value</b> (Rect টা নিজে)। <code>s.Area()</code> call করলে type অংশটা দেখে সেই type-এর method-এ লাফ দেয়। এটাই <b>dynamic dispatch</b>।',
      'Interface তখনই nil যখন <b>দুটো</b> অংশই nil। একটা nil <code>*MyErr</code> pointer যদি <code>error</code>-এ রাখেন, type অংশটা ভরা থাকে, তাই interface nil না। এটা প্রায় প্রত্যেক Go ডেভেলপারকে একবার অবাক করে।',
    ]),
    visual: {
      file: 'main.go',
      examples: [
        {
          label: L('One interface, two types', 'একটা interface, দুটো type'),
          code: `
package main

import "fmt"

type Shape interface { @@iface
	Area() float64
}

type Rect struct{ W, H float64 }
type Circle struct{ R float64 }

func (r Rect) Area() float64   { return r.W * r.H } @@rarea
func (c Circle) Area() float64 { return 3.14 * c.R * c.R } @@carea

func main() {
	var s Shape // {(nil, nil): no type, no value|(nil, nil): type নেই, value নেই} @@nil
	s = Rect{W: 3, H: 4} @@r
	fmt.Println(s.Area()) @@a1
	s = Circle{R: 1} @@c
	fmt.Println(s.Area()) @@a2
}`,
          build() {
            const rect = { id: 'rv', name: 'Rect', type: 'struct', fields: [{ k: 'W', v: 3 }, { k: 'H', v: 4 }] };
            const circ = { id: 'cv', name: 'Circle', type: 'struct', fields: [{ k: 'R', v: 1 }] };
            return [
              step('nil', L('A fresh interface variable holds (nil, nil). Calling a method on it would panic.', 'নতুন interface variable-এ থাকে (nil, nil)। এর উপর method call করলে panic হবে।'), [mem([iface('s', 'nil', 'nil', 'hl new')])]),
              step('r', L('Rect has <code>Area() float64</code>, so it satisfies Shape. No "implements" keyword needed. The pair becomes (Rect, {3 4}).', 'Rect-এর <code>Area() float64</code> আছে, তাই এটা Shape-এর শর্ত পূরণ করে। "implements" লেখার দরকার নেই। জোড়াটা হলো (Rect, {3 4})।'), [mem([iface('s', 'Rect', '●', 'hl'), rect])], { arrows: [{ from: 's-v', to: 'rv' }] }),
              step('rarea', L('<code>s.Area()</code> checks the type half (Rect) and dispatches to <code>Rect.Area</code>.', '<code>s.Area()</code> type অংশ (Rect) দেখে <code>Rect.Area</code>-তে পাঠায়।'), [mem([iface('s', 'Rect', '●'), rect])], { arrows: [{ from: 's-v', to: 'rv', cls: 'w' }] }),
              step('a1', L('3 × 4 = 12.', '3 × 4 = 12।'), [mem([iface('s', 'Rect', '●'), rect]), out(['12'], 1)], { arrows: [{ from: 's-v', to: 'rv' }] }),
              step('c', L('The same variable now holds a Circle. Both halves change.', 'একই variable এখন একটা Circle রাখে। দুটো অংশই বদলায়।'), [mem([iface('s', 'Circle', '●', 'hl'), circ]), out(['12'])], {
                arrows: [{ from: 's-v', to: 'cv' }],
                ask: { q: L('Which Area method runs for <code>s.Area()</code> now?', 'এখন <code>s.Area()</code>-এর জন্য কোন Area method চলবে?'), options: ['Circle.Area', 'Rect.Area', L('Shape.Area', 'Shape.Area')], answer: 0, why: L('Dispatch follows the dynamic type currently stored in the interface.', 'Interface-এ এখন যে dynamic type রাখা আছে, dispatch সেটাই অনুসরণ করে।') },
              }),
              step('carea', L('Dispatch picks <code>Circle.Area</code>.', 'Dispatch <code>Circle.Area</code> বেছে নেয়।'), [mem([iface('s', 'Circle', '●'), circ]), out(['12'])], { arrows: [{ from: 's-v', to: 'cv', cls: 'w' }] }),
              step('a2', L('3.14 × 1 × 1 = 3.14. Code that accepts a Shape works with any shape, including ones written later.', '3.14 × 1 × 1 = 3.14। যে কোড Shape নেয় সেটা যেকোনো shape-এর সাথে চলে, পরে লেখা shape-সহ।'), [mem([iface('s', 'Circle', '●'), circ]), out(['12', '3.14'], 1)], { arrows: [{ from: 's-v', to: 'cv' }], tone: 'ok' }),
            ];
          },
        },
        {
          label: L('The typed-nil gotcha', 'Typed-nil ফাঁদ'),
          code: `
package main

import "fmt"

type MyErr struct{}

func (*MyErr) Error() string { return "boom" }

func find() error { @@fn
	var p *MyErr = nil @@p
	return p // {wraps a nil pointer in a non-nil interface|nil pointer-কে non-nil interface-এ মোড়ে} @@ret
}

func main() {
	err := find() @@call
	fmt.Println(err == nil) @@cmp
}`,
          build() {
            const errBox = (t, v, cls) => ({ id: 'err', name: 'err', type: 'error (interface)', cls, fields: [{ k: 'type', v: t }, { k: 'value', v }] });
            return [
              step('p', L('Inside find, p is a <code>*MyErr</code> whose value is nil.', 'find-এর ভেতরে p একটা <code>*MyErr</code>, যার মান nil।'), [mem([{ name: 'p', type: '*MyErr', val: 'nil', cls: 'hl new' }], L('find() locals', 'find()-এর local'))]),
              step('ret', L('Returning p as an <code>error</code> builds an interface value: type = <code>*MyErr</code>, value = nil. The type half is <b>not</b> nil.', 'p-কে <code>error</code> হিসেবে return করলে একটা interface value তৈরি হয়: type = <code>*MyErr</code>, value = nil। Type অংশটা nil <b>না</b>।'), [mem([errBox('*MyErr', 'nil', 'hl')], L('The returned error', 'ফেরত আসা error'))], {
                ask: { q: L('What will <code>err == nil</code> print?', '<code>err == nil</code> কী print করবে?'), options: ['false', 'true'], answer: 0, why: L('An interface equals nil only if both its type and value are nil.', 'Interface তখনই nil-এর সমান যখন type আর value দুটোই nil।') },
              }),
              step('call', L('main receives the pair (*MyErr, nil).', 'main জোড়াটা পায় (*MyErr, nil)।'), [mem([errBox('*MyErr', 'nil')])]),
              step('cmp', L('<b>false</b>. A caller checking <code>if err != nil</code> would treat this as an error. Fix: in find, <code>return nil</code> directly when there is no error.', '<b>false</b>। যে caller <code>if err != nil</code> যাচাই করবে সে এটাকে error ধরবে। সমাধান: error না থাকলে find-এ সরাসরি <code>return nil</code> করুন।'), [mem([errBox('*MyErr', 'nil', 'bad')]), out(['false'], 1)], { tone: 'bad' }),
            ];
          },
        },
      ],
    },
    walk: [
      { at: 'iface', ex: 0, code: 'type Shape interface { Area() float64 }', text: L('A method set. Keep interfaces small; one method is common (io.Reader, fmt.Stringer).', 'একটা method set। Interface ছোট রাখুন; এক method-এর interface খুব প্রচলিত (io.Reader, fmt.Stringer)।') },
      { at: 'rarea', ex: 0, code: 'func (r Rect) Area() float64', text: L('Having this method is all it takes for Rect to be a Shape.', 'Rect-কে Shape হতে শুধু এই method থাকলেই যথেষ্ট।') },
      { at: 'r', ex: 0, code: 's = Rect{W: 3, H: 4}', text: L('Assigning stores both the type and a copy of the value.', 'Assign করলে type আর value-র একটা কপি দুটোই রাখা হয়।') },
      { at: 'ret', ex: 1, code: 'return p', text: L('Never return a typed nil pointer as an error. Return a literal nil.', 'কখনো typed nil pointer-কে error হিসেবে return করবেন না। সরাসরি nil return করুন।') },
    ],
    mistakes: [
      { title: L('Typed nil inside an interface', 'Interface-এর ভেতরে typed nil'), err: '', fix: L('<code>err != nil</code> is true even though the pointer inside is nil. Return <code>nil</code> explicitly on the success path.', 'ভেতরের pointer nil হলেও <code>err != nil</code> সত্য। সফলতার পথে স্পষ্টভাবে <code>nil</code> return করুন।') },
      { title: L('Pointer receiver, value assigned', 'Pointer receiver, অথচ value assign'), err: './main.go:15:12: cannot use Rect{…} (value of struct type Rect) as Shape value in assignment: Rect does not implement Shape (method Area has pointer receiver)', fix: L('If Area has a <code>*Rect</code> receiver, only <code>*Rect</code> satisfies Shape. Assign <code>&amp;Rect{...}</code>.', 'Area-র receiver যদি <code>*Rect</code> হয়, শুধু <code>*Rect</code> Shape-এর শর্ত পূরণ করে। <code>&amp;Rect{...}</code> assign করুন।') },
      { title: L('Type assertion without ok', 'ok ছাড়া type assertion'), err: 'panic: interface conversion: main.Shape is main.Circle, not main.Rect', fix: L('Use the safe form: <code>r, ok := s.(Rect)</code>, or a type switch.', 'নিরাপদ ফর্ম ব্যবহার করুন: <code>r, ok := s.(Rect)</code>, অথবা type switch।') },
      { title: L('Defining big interfaces up front', 'আগেভাগেই বড় interface বানানো'), err: '', fix: L('Go style: accept interfaces, return concrete structs. Define small interfaces where they are used, not where types are defined.', 'Go স্টাইল: interface নিন, concrete struct ফেরত দিন। ছোট interface যেখানে ব্যবহার হয় সেখানে বানান, type যেখানে বানানো হয় সেখানে না।') },
    ],
    quiz: [
      { q: L('How does a type declare that it implements an interface?', 'কোনো type কীভাবে ঘোষণা করে যে সে একটা interface implement করে?'), options: [L('It does not; having the methods is enough', 'করে না; method থাকলেই যথেষ্ট'), L('With the implements keyword', 'implements keyword দিয়ে'), L('By embedding the interface', 'interface embed করে')], answer: 0, why: L('Go interfaces are satisfied implicitly.', 'Go-র interface নিজে থেকেই পূরণ হয়।') },
      { q: L('When is an interface value equal to nil?', 'কখন একটা interface value nil-এর সমান?'), options: [L('When both type and value are nil', 'যখন type আর value দুটোই nil'), L('When the value inside is nil', 'যখন ভেতরের value nil'), L('Never', 'কখনো না')], answer: 0, why: L('A nil pointer with a known type makes a non-nil interface.', 'জানা type-সহ একটা nil pointer non-nil interface তৈরি করে।') },
      { q: L('What does a type switch do?', 'Type switch কী করে?'), options: [L('Branches on the dynamic type inside an interface', 'Interface-এর ভেতরের dynamic type অনুযায়ী শাখা নেয়'), L('Converts between any two types', 'যেকোনো দুই type-এর মধ্যে রূপান্তর করে'), L('Changes the static type of a variable', 'Variable-এর static type বদলায়')], answer: 0, why: L('<code>switch v := s.(type) { case Rect: … }</code>', '<code>switch v := s.(type) { case Rect: … }</code>') },
    ],
    exercises: [
      { title: L('Total area', 'মোট ক্ষেত্রফল'),
        task: L('Add a <code>Triangle{B, H float64}</code> type, then write <code>func totalArea(shapes []Shape) float64</code>. Call it with one of each shape.', 'একটা <code>Triangle{B, H float64}</code> type যোগ করুন, তারপর <code>func totalArea(shapes []Shape) float64</code> লিখুন। প্রতিটা shape-এর একটা দিয়ে call করুন।'),
        hints: [L('Triangle needs only an Area method to become a Shape.', 'Shape হতে Triangle-এর শুধু একটা Area method লাগবে।'), L('A []Shape can hold Rect, Circle and Triangle values together.', 'একটা []Shape-এ Rect, Circle আর Triangle একসাথে রাখা যায়।')],
        solution: `package main

import "fmt"

type Shape interface{ Area() float64 }

type Rect struct{ W, H float64 }
type Circle struct{ R float64 }
type Triangle struct{ B, H float64 }

func (r Rect) Area() float64     { return r.W * r.H }
func (c Circle) Area() float64   { return 3.14 * c.R * c.R }
func (t Triangle) Area() float64 { return 0.5 * t.B * t.H }

func totalArea(shapes []Shape) float64 {
	sum := 0.0
	for _, s := range shapes {
		sum += s.Area() // {dynamic dispatch|dynamic dispatch}
	}
	return sum
}

func main() {
	fmt.Println(totalArea([]Shape{Rect{3, 4}, Circle{1}, Triangle{4, 5}}))
}` },
      { title: L('Make it printable', 'Print-যোগ্য করুন'),
        task: L('Give Rect a <code>String() string</code> method so that <code>fmt.Println(Rect{3, 4})</code> prints <code>3×4 rectangle</code>. Which standard interface did you just satisfy?', 'Rect-কে একটা <code>String() string</code> method দিন, যাতে <code>fmt.Println(Rect{3, 4})</code> print করে <code>3×4 rectangle</code>। আপনি কোন standard interface পূরণ করলেন?'),
        hints: [L('fmt checks whether a value implements <code>fmt.Stringer</code>.', 'fmt দেখে মানটা <code>fmt.Stringer</code> implement করে কিনা।'), L('<code>fmt.Sprintf("%g×%g rectangle", r.W, r.H)</code>', '<code>fmt.Sprintf("%g×%g rectangle", r.W, r.H)</code>')],
        solution: `package main

import "fmt"

type Rect struct{ W, H float64 }

// {String makes Rect a fmt.Stringer|String দিয়ে Rect একটা fmt.Stringer}
func (r Rect) String() string {
	return fmt.Sprintf("%g×%g rectangle", r.W, r.H)
}

func main() {
	fmt.Println(Rect{3, 4})
}` },
    ],
    takeaways: [
      L('Interfaces describe behaviour. Types satisfy them implicitly by having the methods.', 'Interface আচরণ বর্ণনা করে। Method থাকলেই type নিজে থেকে সেটা পূরণ করে।'),
      L('An interface value is (dynamic type, value); method calls dispatch on the type.', 'Interface value হলো (dynamic type, value); method call type অনুযায়ী dispatch হয়।'),
      L('An interface is nil only if both parts are nil. Never return a typed nil as error.', 'দুটো অংশই nil হলে তবেই interface nil। কখনো typed nil-কে error হিসেবে return করবেন না।'),
      L('Keep interfaces small and define them where they are consumed.', 'Interface ছোট রাখুন আর যেখানে ব্যবহার হয় সেখানে বানান।'),
    ],
    links: [
      { t: 'A Tour of Go: Interfaces', url: 'https://go.dev/tour/methods/9' },
      { t: 'Go FAQ: Why is my nil error value not equal to nil?', url: 'https://go.dev/doc/faq#nil_error' },
      { t: 'Effective Go: Interfaces', url: 'https://go.dev/doc/effective_go#interfaces' },
    ],
  });
})();
