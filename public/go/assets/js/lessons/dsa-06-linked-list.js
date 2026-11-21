(function () {
  const { L, step } = GV;

  GV.register({
    id: 'dsa-linked-list', track: 'dsa', phase: 'structures', order: 1, minutes: 15,
    title: L('Linked list: reverse in place', 'Linked list: জায়গাতেই উল্টানো'),
    summary: L('Nodes point to the next node. Watch three pointers, prev, cur and next, flip every arrow without losing the rest of the list.', 'প্রতিটা node পরের node-এর দিকে নির্দেশ করে। দেখুন তিনটা pointer, prev, cur আর next, তালিকার বাকি অংশ না হারিয়ে প্রতিটা তীর উল্টে দেয়।'),
    idea: L([
      'A <b>linked list</b> is a treasure hunt: each note (node) holds a value and the location of the next note. There is no index; to reach the 5th node you follow 4 arrows. In Go a node is a struct with a pointer to the next node: <code>Next *Node</code>.',
      'Reversing means flipping every arrow. The danger: the moment you point <code>cur.Next</code> backwards, you lose the way to the rest of the list. So first save it in <code>next</code>, then flip, then step both <code>prev</code> and <code>cur</code> forward. Three pointers, constant extra memory.',
      'Go\'s standard library rarely needs hand-written lists (slices are faster thanks to CPU caches), but the pointer-juggling here is exactly the skill you need for trees, graphs and LRU caches.',
    ], [
      '<b>Linked list</b> হলো একটা গুপ্তধন খোঁজার খেলা: প্রতিটা চিরকুটে (node) একটা মান আর পরের চিরকুটের ঠিকানা থাকে। কোনো index নেই; ৫ম node-এ পৌঁছাতে ৪টা তীর অনুসরণ করতে হয়। Go-তে node হলো পরের node-এর pointer-সহ একটা struct: <code>Next *Node</code>।',
      'উল্টানো মানে প্রতিটা তীর উল্টে দেওয়া। বিপদ: যেই মুহূর্তে <code>cur.Next</code> পেছনে নির্দেশ করবেন, তালিকার বাকি অংশে যাওয়ার পথ হারাবেন। তাই আগে সেটা <code>next</code>-এ রাখুন, তারপর উল্টান, তারপর <code>prev</code> আর <code>cur</code> দুটোই এক ঘর এগিয়ে নিন। তিনটা pointer, স্থির অতিরিক্ত মেমরি।',
      'Go-র standard library-তে হাতে লেখা list খুব কমই লাগে (CPU cache-এর কারণে slice দ্রুত), কিন্তু এখানের pointer সামলানোর দক্ষতাই tree, graph আর LRU cache-এ লাগে।',
    ]),
    complexity: { time: 'O(n)', space: 'O(1)', note: L('Each node is visited once; only three pointer variables are used.', 'প্রতিটা node একবার দেখা হয়; শুধু তিনটা pointer variable ব্যবহার হয়।') },
    visual: {
      file: 'linked_list.go',
      legend: [{ cls: 'cur', label: L('cur', 'cur') }, { cls: 'ok', label: L('already reversed', 'আগেই উল্টানো') }],
      examples: [
        {
          label: L('Reverse a list', 'একটা list উল্টানো'),
          inputs: [{ key: 'vals', label: L('Values', 'মান'), type: 'list', def: [1, 2, 3, 4], maxLen: 6 }],
          code: `
type Node struct {
	Val  int
	Next *Node
}

func reverse(head *Node) *Node {
	var prev *Node @@init
	cur := head
	for cur != nil { @@cond
		next := cur.Next // {save the rest first|আগে বাকিটা রাখো} @@save
		cur.Next = prev  // {flip the arrow|তীর উল্টাও} @@flip
		prev = cur @@adv1
		cur = next @@adv2
	}
	return prev // {prev is the new head|prev-ই নতুন head} @@ret
}`,
          build({ vals }) {
            const n = vals.length;
            const nxt = vals.map((_, i) => (i + 1 < n ? i + 1 : 'nil'));
            const s = [];
            const snap = (prev, cur, next, flipped) => {
              const tagsFor = (i) => [prev === i ? 'prev' : null, cur === i ? 'cur' : null, next === i ? 'next' : null].filter(Boolean);
              const items = [{ id: 'nilL', name: 'nil', val: '∅', cls: 'ghost', tags: tagsFor(-1) }]
                .concat(vals.map((v, i) => ({ id: 'n' + i, name: 'node', fields: [{ k: 'Val', v }, { k: 'Next', v: nxt[i] === 'nil' ? 'nil' : '●' }], cls: i === cur ? 'hl' : flipped.has(i) ? 'ok' : '', tags: tagsFor(i) })))
                .concat([{ id: 'nilR', name: 'nil', val: '∅', cls: 'ghost', tags: tagsFor(n) }]);
              const arrows = [];
              vals.forEach((_, i) => {
                const t = nxt[i];
                if (t === 'nil') return;
                arrows.push(t < i ? { from: 'n' + i, to: 'n' + t, cls: 'ok', bend: -1.6 } : { from: 'n' + i, to: 'n' + t });
              });
              return { panels: [{ type: 'boxes', layout: 'chain', wide: true, title: L('Nodes in memory (arrows are Next pointers)', 'মেমরিতে node (তীরগুলো Next pointer)'), items }], arrows };
            };
            const push = (line, en, bn, prev, cur, next, flipped, extra) => { const x = snap(prev, cur, next, flipped); s.push(step(line, L(en, bn), x.panels, Object.assign({ arrows: x.arrows }, extra || {}))); };
            const flipped = new Set();
            push('init', 'prev starts as nil (the new tail will point to nothing). cur starts at the head.', 'prev শুরু হয় nil দিয়ে (নতুন শেষ node কিছুর দিকে নির্দেশ করবে না)। cur শুরু হয় head-এ।', -1, 0, null, flipped);
            let prev = -1, cur = 0, asked = false;
            while (cur < n) {
              push('cond', `cur is node ${vals[cur]}, not nil: keep going.`, `cur হলো node ${vals[cur]}, nil না: চালিয়ে যাও।`, prev, cur, null, flipped);
              const next = cur + 1;
              push('save', `Save <code>next = cur.Next</code> (${next < n ? 'node ' + vals[next] : 'nil'}). Without this we would lose the rest of the list.`, `<code>next = cur.Next</code> রাখো (${next < n ? 'node ' + vals[next] : 'nil'})। এটা না করলে বাকি তালিকা হারিয়ে যেত।`, prev, cur, next, flipped);
              const extra = !asked ? { ask: { q: L('If we had flipped <code>cur.Next = prev</code> before saving next, what would happen?', 'next রাখার আগেই যদি <code>cur.Next = prev</code> উল্টে দিতাম, কী হতো?'), options: [L('The rest of the list would be unreachable', 'বাকি তালিকায় আর পৌঁছানো যেত না'), L('Nothing different', 'কোনো পার্থক্য হতো না'), L('Go would copy the list', 'Go list-টা কপি করত')], answer: 0, why: L('cur.Next was the only pointer to the remaining nodes. Overwrite it and they are lost.', 'বাকি node-গুলোর একমাত্র pointer ছিল cur.Next। এটা মুছে দিলে সেগুলো হারিয়ে যায়।') } } : {};
              asked = true;
              nxt[cur] = prev === -1 ? 'nil' : prev;
              flipped.add(cur);
              push('flip', `Flip: <code>cur.Next = prev</code>. Node ${vals[cur]} now points ${prev === -1 ? 'to nil' : 'back to node ' + vals[prev]}.`, `উল্টানো: <code>cur.Next = prev</code>। node ${vals[cur]} এখন ${prev === -1 ? 'nil-এর দিকে' : 'পেছনে node ' + vals[prev] + '-এর দিকে'} নির্দেশ করে।`, prev, cur, next, flipped, extra);
              prev = cur;
              push('adv1', 'Move prev forward to cur.', 'prev এগিয়ে cur-এ।', prev, cur, next, flipped);
              cur = next;
              push('adv2', `Move cur forward to the saved next${cur < n ? '' : ' (nil)'}.`, `cur এগিয়ে রাখা next-এ${cur < n ? '' : ' (nil)'}।`, prev, cur, null, flipped);
            }
            push('cond', 'cur is nil: every arrow is flipped.', 'cur এখন nil: প্রতিটা তীর উল্টানো হয়ে গেছে।', prev, n, null, flipped);
            push('ret', `Return prev, node ${vals[n - 1]}: the new head. The list now reads ${vals.slice().reverse().join(' → ')} → nil.`, `prev ফেরত দাও, node ${vals[n - 1]}: নতুন head। তালিকা এখন ${vals.slice().reverse().join(' → ')} → nil।`, prev, n, null, flipped, { tone: 'ok' });
            return s;
          },
        },
      ],
    },
    walk: [
      { at: 'init', code: 'var prev *Node', text: L('A nil pointer: the reversed list\'s tail.', 'একটা nil pointer: উল্টানো তালিকার শেষ।') },
      { at: 'save', code: 'next := cur.Next', text: L('Save before you overwrite.', 'মুছে লেখার আগে রেখে দিন।') },
      { at: 'flip', code: 'cur.Next = prev', text: L('The actual reversal, one arrow at a time.', 'আসল উল্টানো, একবারে একটা তীর।') },
      { at: 'ret', code: 'return prev', text: L('cur is nil at the end; prev holds the last node, which is the new head.', 'শেষে cur nil; prev-এ থাকে শেষ node, যেটাই নতুন head।') },
    ],
    mistakes: [
      { title: L('Losing the rest of the list', 'তালিকার বাকি অংশ হারানো'), err: '', fix: L('Always save <code>cur.Next</code> before reassigning it.', 'Reassign করার আগে সবসময় <code>cur.Next</code> রাখুন।') },
      { title: L('Returning head or cur', 'head বা cur ফেরত দেওয়া'), err: '', fix: L('After the loop, cur is nil and the old head is now the tail. Return prev.', 'লুপের পর cur nil, আর পুরনো head এখন শেষ node। prev ফেরত দিন।') },
      { title: L('Dereferencing a nil node', 'nil node dereference'), err: 'panic: runtime error: invalid memory address or nil pointer dereference', fix: L('Loop on <code>cur != nil</code> and check before touching <code>cur.Next.Next</code>.', '<code>cur != nil</code> দিয়ে লুপ চালান, আর <code>cur.Next.Next</code> ছোঁয়ার আগে যাচাই করুন।') },
    ],
    quiz: [
      { q: L('What is the extra space of in-place reversal?', 'জায়গাতেই উল্টানোর অতিরিক্ত মেমরি কত?'), options: ['O(1)', 'O(n)', 'O(log n)'], answer: 0, why: L('Three pointers, regardless of length.', 'দৈর্ঘ্য যাই হোক, তিনটা pointer।') },
      { q: L('Access the k-th element of a linked list costs…', 'Linked list-এর k-তম উপাদানে পৌঁছাতে খরচ…'), options: ['O(k)', 'O(1)', 'O(log k)'], answer: 0, why: L('No indexes; you follow k arrows.', 'কোনো index নেই; k টা তীর অনুসরণ করতে হয়।') },
      { q: L('Which line must come before <code>cur.Next = prev</code>?', '<code>cur.Next = prev</code>-এর আগে কোন লাইন আসতেই হবে?'), options: ['next := cur.Next', 'prev = cur', 'cur = next'], answer: 0, why: L('Otherwise the remaining nodes become unreachable.', 'নইলে বাকি node-গুলোতে আর পৌঁছানো যায় না।') },
    ],
    exercises: [
      { title: L('Build and print', 'বানিয়ে print'),
        task: L('Write <code>fromSlice([]int) *Node</code> and <code>String(head *Node) string</code> that prints "1 -> 2 -> 3". Reverse a list and print it before and after.', '<code>fromSlice([]int) *Node</code> আর "1 -> 2 -> 3" print করে এমন <code>String(head *Node) string</code> লিখুন। একটা list উল্টে আগে আর পরে print করুন।'),
        hints: [L('Build from the back: for i from len-1 down to 0, head = &Node{v, head}.', 'পেছন থেকে বানান: i = len-1 থেকে 0 পর্যন্ত, head = &Node{v, head}।'), L('Use strings.Builder while walking the list.', 'তালিকা ধরে হাঁটার সময় strings.Builder ব্যবহার করুন।')],
        solution: `package main

import (
	"fmt"
	"strconv"
	"strings"
)

type Node struct {
	Val  int
	Next *Node
}

func fromSlice(vals []int) *Node {
	var head *Node
	for i := len(vals) - 1; i >= 0; i-- {
		head = &Node{Val: vals[i], Next: head}
	}
	return head
}

func String(head *Node) string {
	var b strings.Builder
	for n := head; n != nil; n = n.Next {
		if n != head {
			b.WriteString(" -> ")
		}
		b.WriteString(strconv.Itoa(n.Val))
	}
	return b.String()
}

func reverse(head *Node) *Node {
	var prev *Node
	for cur := head; cur != nil; {
		next := cur.Next
		cur.Next = prev
		prev, cur = cur, next
	}
	return prev
}

func main() {
	l := fromSlice([]int{1, 2, 3})
	fmt.Println(String(l))
	fmt.Println(String(reverse(l)))
}` },
      { title: L('Find the middle', 'মাঝখান খুঁজুন'),
        task: L('Return the middle node in one pass using a slow pointer (1 step) and a fast pointer (2 steps). For 1→2→3→4→5 return 3.', 'একটা ধীর pointer (১ ধাপ) আর একটা দ্রুত pointer (২ ধাপ) দিয়ে এক পাসেই মাঝের node ফেরত দিন। 1→2→3→4→5 হলে 3।'),
        hints: [L('When fast reaches the end, slow is halfway.', 'দ্রুতটা শেষে পৌঁছালে ধীরটা অর্ধেক পথে।'), L('Loop while fast != nil && fast.Next != nil.', 'fast != nil && fast.Next != nil থাকা পর্যন্ত লুপ।')],
        solution: `package main

import "fmt"

type Node struct {
	Val  int
	Next *Node
}

func middle(head *Node) *Node {
	slow, fast := head, head
	for fast != nil && fast.Next != nil {
		slow = slow.Next
		fast = fast.Next.Next // {two steps at a time|একবারে দুই ধাপ}
	}
	return slow
}

func main() {
	var head *Node
	for i := 5; i >= 1; i-- {
		head = &Node{Val: i, Next: head}
	}
	fmt.Println(middle(head).Val) // {3|3}
}` },
    ],
    takeaways: [
      L('A node holds a value and a pointer to the next node; access is sequential.', 'Node-এ একটা মান আর পরের node-এর pointer থাকে; পৌঁছানো ক্রমানুসারে।'),
      L('Reverse with prev, cur, next: save, flip, advance.', 'prev, cur, next দিয়ে উল্টান: রাখো, উল্টাও, এগোও।'),
      L('Slow and fast pointers find the middle or detect cycles.', 'ধীর আর দ্রুত pointer মাঝখান খোঁজে বা চক্র ধরে।'),
    ],
    links: [{ t: 'Package container/list', url: 'https://pkg.go.dev/container/list' }],
  });
})();
