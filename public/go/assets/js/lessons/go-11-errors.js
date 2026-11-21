(function () {
  const { L, step, out } = GV;
  const stack = (items) => ({ type: 'frames', title: L('Call stack', 'Call stack'), items });
  const chain = (items) => ({ type: 'boxes', title: L('Error chain (each error wraps the next)', 'Error chain (প্রতিটা error পরেরটাকে মোড়ে)'), layout: 'chain', items });

  GV.register({
    id: 'go-errors', track: 'go', phase: 'types', order: 3, minutes: 20,
    title: L('Errors: return, wrap, inspect', 'Error: ফেরত, মোড়ানো, যাচাই'),
    summary: L('Errors are values you return and check. Follow one through the stack, wrap it with %w for context, and find the cause with errors.Is.', 'Error হলো মান, যা return করে যাচাই করা হয়। একটা error stack ধরে অনুসরণ করুন, %w দিয়ে context যোগ করুন, আর errors.Is দিয়ে মূল কারণ খুঁজুন।'),
    idea: L([
      'Go has no exceptions for ordinary failures. A function that can fail returns an <code>error</code> as its last result, and the caller checks <code>if err != nil</code> right away. It looks repetitive at first, but every failure path is visible in the code, which is what you want in a server that must not fall over.',
      'Think of a parcel being returned to sender. Each office it passes through adds a label: "warehouse: could not deliver", "courier: address not found". The parcel inside stays the same. In Go, <code>fmt.Errorf("load profile %d: %w", id, err)</code> adds a label and keeps the original error inside. Later, <code>errors.Is(err, ErrNotFound)</code> opens the layers to check what the original problem was.',
      'This lesson goes beyond most tutorials because it is exactly how real Go services report problems: an HTTP handler turns <code>ErrNotFound</code> deep in the database layer into a 404.',
    ], [
      'সাধারণ ব্যর্থতার জন্য Go-তে exception নেই। যে function fail করতে পারে সে শেষ result হিসেবে একটা <code>error</code> ফেরত দেয়, আর caller সাথে সাথে <code>if err != nil</code> যাচাই করে। প্রথমে একঘেয়ে লাগে, কিন্তু কোডে প্রতিটা ব্যর্থতার পথ দেখা যায়, যেটা এমন সার্ভারে দরকার যেটা কখনো ভেঙে পড়া চলবে না।',
      'একটা পার্সেল প্রেরকের কাছে ফেরত যাওয়ার কথা ভাবুন। যে অফিস দিয়ে যায় সেটা একটা লেবেল লাগায়: "warehouse: পৌঁছানো যায়নি", "courier: ঠিকানা পাওয়া যায়নি"। ভেতরের পার্সেল একই থাকে। Go-তে <code>fmt.Errorf("load profile %d: %w", id, err)</code> একটা লেবেল যোগ করে আর মূল error ভেতরে রেখে দেয়। পরে <code>errors.Is(err, ErrNotFound)</code> স্তরগুলো খুলে দেখে মূল সমস্যা কী ছিল।',
      'এই লেসন বেশিরভাগ টিউটোরিয়ালের চেয়ে এগিয়ে, কারণ আসল Go সার্ভিস ঠিক এভাবেই সমস্যা জানায়: database layer-এর গভীরের <code>ErrNotFound</code>-কে HTTP handler 404-এ রূপান্তর করে।',
    ]),
    visual: {
      file: 'main.go',
      examples: [
        {
          label: L('Return, wrap and inspect', 'ফেরত, মোড়ানো ও যাচাই'),
          inputs: [{ key: 'id', label: L('User id (1 exists)', 'User id (1 আছে)'), type: 'int', def: 7, min: 0, max: 999 }],
          code: (inp) => `
package main

import (
	"errors"
	"fmt"
)

var ErrNotFound = errors.New("user not found") // {a sentinel error|একটা sentinel error} @@sent

func findUser(id int) (string, error) { @@fn
	if id != 1 { @@chk
		return "", ErrNotFound @@retErr
	}
	return "Rashed", nil @@ok
}

func loadProfile(id int) error { @@lp
	name, err := findUser(id) @@call
	if err != nil { @@if
		return fmt.Errorf("load profile %d: %w", id, err) // {add context, keep the cause|context যোগ, কারণ রেখে দাও} @@wrap
	}
	fmt.Println("hello,", name) @@hello
	return nil @@nilret
}

func main() {
	err := loadProfile(${inp.id}) @@main
	fmt.Println(err) @@print
	fmt.Println(errors.Is(err, ErrNotFound)) @@is
}`,
          build({ id }) {
            const s = [];
            const mainF = (err, cls) => ({ fn: 'main()', vars: [{ k: 'err', v: err == null ? '?' : err, cls }] });
            const lpF = (vars) => ({ fn: `loadProfile(${id})`, vars });
            if (id !== 1) {
              s.push(step('main', L(`main calls <code>loadProfile(${id})</code>.`, `main <code>loadProfile(${id})</code> call করে।`), [stack([mainF()])]));
              s.push(step('call', L('loadProfile calls findUser and will get two results back.', 'loadProfile, findUser call করে, দুটো result ফেরত পাবে।'), [stack([mainF(), lpF([{ k: 'name', v: '?' }, { k: 'err', v: '?' }]), { fn: `findUser(${id})`, vars: [{ k: 'id', v: id, cls: 'new' }] }])]));
              s.push(step('chk', L(`id is ${id}, not 1: there is no such user.`, `id = ${id}, 1 না: এমন কোনো user নেই।`), [stack([mainF(), lpF([{ k: 'name', v: '?' }, { k: 'err', v: '?' }]), { fn: `findUser(${id})`, vars: [{ k: 'id', v: id, cls: 'bad' }] }])]));
              s.push(step('retErr', L('Return the zero value for the result, plus the sentinel <code>ErrNotFound</code>.', 'Result-এর জন্য zero value, সাথে sentinel <code>ErrNotFound</code> ফেরত।'), [stack([mainF(), lpF([{ k: 'name', v: '""', cls: 'new' }, { k: 'err', v: 'ErrNotFound', cls: 'bad' }])]), chain([{ id: 'e0', name: 'ErrNotFound', type: '*errorString', val: '"user not found"', cls: 'bad new' }])]));
              s.push(step('if', L('Check immediately. err is not nil, so we stop here and return.', 'সাথে সাথে যাচাই। err nil না, তাই এখানেই থেমে return।'), [stack([mainF(), lpF([{ k: 'name', v: '""' }, { k: 'err', v: 'ErrNotFound', cls: 'bad' }])]), chain([{ id: 'e0', name: 'ErrNotFound', type: '*errorString', val: '"user not found"', cls: 'bad' }])], {
                ask: { q: L('We wrap with <code>%w</code>. What if we had used <code>%v</code> instead?', 'আমরা <code>%w</code> দিয়ে মোড়াচ্ছি। <code>%v</code> দিলে কী হতো?'), options: [L('Same message, but errors.Is would return false', 'একই বার্তা, কিন্তু errors.Is false দিত'), L('Nothing different', 'কোনো পার্থক্য নেই'), L('A compile error', 'Compile error')], answer: 0, why: L('%v only copies the text. %w keeps a link to the original error so errors.Is and errors.As can find it.', '%v শুধু লেখাটা কপি করে। %w মূল error-এর সাথে একটা যোগসূত্র রাখে, তাই errors.Is আর errors.As সেটা খুঁজে পায়।') },
              }));
              s.push(step('wrap', L('<code>fmt.Errorf</code> with <code>%w</code> creates a new error with context <b>and a link to the cause</b>.', '<code>%w</code>-সহ <code>fmt.Errorf</code> context-সহ একটা নতুন error বানায়, <b>সাথে কারণের সাথে যোগসূত্র</b>।'), [stack([mainF(), lpF([{ k: 'err', v: 'ErrNotFound' }])]), chain([{ id: 'e1', name: 'wrapped', type: '*fmt.wrapError', val: `"load profile ${id}: user not found"`, cls: 'hl new' }, { id: 'e0', name: 'ErrNotFound', type: '*errorString', val: '"user not found"', cls: 'bad' }])], { arrows: [{ from: 'e1', to: 'e0', cls: 'bad', label: 'Unwrap()' }] }));
              s.push(step('print', L('main prints the outermost message. Each layer added a prefix, reading like a breadcrumb trail.', 'main সবচেয়ে বাইরের বার্তা print করে। প্রতিটা স্তর একটা prefix যোগ করেছে, যেন একটা পথের চিহ্ন।'), [stack([mainF('wrapped', 'bad')]), chain([{ id: 'e1', name: 'wrapped', type: '*fmt.wrapError', val: `"load profile ${id}: user not found"` }, { id: 'e0', name: 'ErrNotFound', type: '*errorString', val: '"user not found"', cls: 'bad' }]), out([`load profile ${id}: user not found`], 1)], { arrows: [{ from: 'e1', to: 'e0', cls: 'bad' }] }));
              s.push(step('is', L('<code>errors.Is</code> walks the chain with Unwrap until it finds ErrNotFound: <b>true</b>. An HTTP handler would now answer 404.', '<code>errors.Is</code> Unwrap দিয়ে chain ধরে হাঁটে যতক্ষণ না ErrNotFound পায়: <b>true</b>। একটা HTTP handler এখন 404 দিত।'), [stack([mainF('wrapped')]), chain([{ id: 'e1', name: 'wrapped', type: '*fmt.wrapError', val: `"load profile ${id}: user not found"`, cls: 'dim' }, { id: 'e0', name: 'ErrNotFound', type: '*errorString', val: '"user not found"', cls: 'ok' }]), out([`load profile ${id}: user not found`, 'true'], 1)], { arrows: [{ from: 'e1', to: 'e0', cls: 'ok' }], tone: 'ok' }));
            } else {
              s.push(step('main', L('main calls <code>loadProfile(1)</code>.', 'main <code>loadProfile(1)</code> call করে।'), [stack([mainF()])]));
              s.push(step('call', L('loadProfile calls findUser.', 'loadProfile, findUser call করে।'), [stack([mainF(), lpF([{ k: 'name', v: '?' }, { k: 'err', v: '?' }]), { fn: 'findUser(1)', vars: [{ k: 'id', v: 1, cls: 'new' }] }])]));
              s.push(step('ok', L('User 1 exists. Return the name and a <b>nil</b> error.', 'User 1 আছে। নাম আর একটা <b>nil</b> error ফেরত।'), [stack([mainF(), lpF([{ k: 'name', v: '"Rashed"', cls: 'new' }, { k: 'err', v: 'nil', cls: 'new' }])])]));
              s.push(step('if', L('err is nil, so skip the error branch.', 'err nil, তাই error শাখা বাদ।'), [stack([mainF(), lpF([{ k: 'name', v: '"Rashed"' }, { k: 'err', v: 'nil' }])])]));
              s.push(step('hello', L('The happy path continues.', 'সুখী পথ চলতে থাকে।'), [stack([mainF(), lpF([{ k: 'name', v: '"Rashed"' }, { k: 'err', v: 'nil' }])]), out(['hello, Rashed'], 1)]));
              s.push(step('nilret', L('Return a literal nil: no error.', 'সরাসরি nil return: কোনো error নেই।'), [stack([mainF('nil', 'hl')]), out(['hello, Rashed'])]));
              s.push(step('print', L('Printing a nil error shows &lt;nil&gt;.', 'nil error print করলে &lt;nil&gt; দেখায়।'), [stack([mainF('nil')]), out(['hello, Rashed', '<nil>'], 1)]));
              s.push(step('is', L('errors.Is(nil, ErrNotFound) is false. Try id 7 to see the failure path.', 'errors.Is(nil, ErrNotFound) হলো false। ব্যর্থতার পথ দেখতে id 7 দিয়ে চালান।'), [stack([mainF('nil')]), out(['hello, Rashed', '<nil>', 'false'], 1)], { tone: 'ok' }));
            }
            return s;
          },
        },
      ],
    },
    walk: [
      { at: 'sent', code: 'var ErrNotFound = errors.New(...)', text: L('A sentinel error: a package-level value callers can compare against. Name it Err…', 'Sentinel error: package-level একটা মান যার সাথে caller তুলনা করতে পারে। নাম দিন Err… দিয়ে।') },
      { at: 'retErr', code: 'return "", ErrNotFound', text: L('On failure, return zero values plus the error.', 'ব্যর্থ হলে zero value আর error ফেরত দিন।') },
      { at: 'if', code: 'if err != nil {', text: L('Handle the error right after the call. Keep the happy path unindented.', 'Call-এর ঠিক পরেই error সামলান। সুখী পথটা indent ছাড়া রাখুন।') },
      { at: 'wrap', code: 'fmt.Errorf("...: %w", err)', text: L('Add what this layer was doing. Lowercase, no trailing punctuation.', 'এই স্তর কী করছিল তা যোগ করুন। ছোট হাতের অক্ষর, শেষে যতিচিহ্ন নয়।') },
      { at: 'is', code: 'errors.Is(err, ErrNotFound)', text: L('Checks the whole chain. Use errors.As to extract a custom error type.', 'পুরো chain যাচাই করে। Custom error type বের করতে errors.As ব্যবহার করুন।') },
    ],
    mistakes: [
      { title: L('Ignoring an error', 'Error উপেক্ষা করা'), err: 'n, _ := strconv.Atoi(input) // bad input silently becomes 0', fix: L('Discarding with <code>_</code> hides failures. Handle it, or wrap and return it.', '<code>_</code> দিয়ে বাদ দিলে ব্যর্থতা লুকিয়ে যায়। সামলান, অথবা মুড়ে return করুন।') },
      { title: L('Comparing wrapped errors with ==', 'মোড়ানো error == দিয়ে তুলনা'), err: 'if err == ErrNotFound { // false once anyone wraps it', fix: L('Use <code>errors.Is(err, ErrNotFound)</code>, which looks through every wrapping layer.', '<code>errors.Is(err, ErrNotFound)</code> ব্যবহার করুন, এটা প্রতিটা মোড়ানো স্তর ভেদ করে দেখে।') },
      { title: L('Capitalised error strings', 'বড় হাতের error string'), err: 'errors.New("User not found.")', fix: L('Go convention: lowercase and no trailing punctuation, because messages get joined: "load profile 7: user not found".', 'Go রীতি: ছোট হাতের অক্ষর, শেষে যতিচিহ্ন নেই, কারণ বার্তাগুলো জোড়া লাগে: "load profile 7: user not found"।') },
      { title: L('Using panic for expected failures', 'প্রত্যাশিত ব্যর্থতায় panic'), err: '', fix: L('panic is for programmer bugs and impossible states. A missing user or bad input is an ordinary error value.', 'panic প্রোগ্রামারের bug আর অসম্ভব অবস্থার জন্য। User না থাকা বা ভুল input সাধারণ error value।') },
    ],
    quiz: [
      { q: L('Which verb in fmt.Errorf keeps the original error inspectable?', 'fmt.Errorf-এর কোন verb মূল error যাচাইযোগ্য রাখে?'), options: ['%w', '%v', '%s'], answer: 0, why: L('Only %w wraps; the others flatten the error into text.', 'শুধু %w মোড়ায়; বাকিগুলো error-কে লেখায় পরিণত করে।') },
      { q: L('What should a function return on success?', 'সফল হলে function কী return করবে?'), options: [L('The result and a literal nil error', 'Result আর সরাসরি nil error'), L('The result only', 'শুধু result'), L('A nil pointer of the custom error type', 'Custom error type-এর nil pointer')], answer: 0, why: L('A typed nil would make err != nil true (see the interfaces lesson).', 'Typed nil দিলে err != nil সত্য হয়ে যেত (interface লেসন দেখুন)।') },
      { q: L('How do you get a *ValidationError out of a wrapped error?', 'মোড়ানো error থেকে *ValidationError কীভাবে বের করবেন?'), options: ['var ve *ValidationError; errors.As(err, &ve)', 'err.(*ValidationError)', 'errors.Is(err, ValidationError)'], answer: 0, why: L('errors.As searches the chain for a matching type and assigns it.', 'errors.As chain-এ মেলে এমন type খুঁজে assign করে।') },
    ],
    exercises: [
      { title: L('A custom error type', 'Custom error type'),
        task: L('Create <code>type ValidationError struct{ Field string }</code> with an Error method. Write <code>validateAge(age int) error</code> that returns it for ages below 0 or above 150. Wrap it in main with fmt.Errorf and recover the field name with <code>errors.As</code>.', '<code>type ValidationError struct{ Field string }</code> বানান, সাথে একটা Error method। <code>validateAge(age int) error</code> লিখুন যেটা 0-এর নিচে বা 150-এর উপরে বয়সের জন্য এটা ফেরত দেয়। main-এ fmt.Errorf দিয়ে মুড়ে <code>errors.As</code> দিয়ে field-এর নাম বের করুন।'),
        hints: [L('Use a pointer receiver: <code>func (e *ValidationError) Error() string</code>, and return <code>&amp;ValidationError{...}</code>.', 'Pointer receiver ব্যবহার করুন: <code>func (e *ValidationError) Error() string</code>, আর <code>&amp;ValidationError{...}</code> return করুন।'), L('Declare <code>var ve *ValidationError</code> and pass <code>&amp;ve</code> to errors.As.', '<code>var ve *ValidationError</code> ঘোষণা করে errors.As-এ <code>&amp;ve</code> পাঠান।')],
        solution: `package main

import (
	"errors"
	"fmt"
)

type ValidationError struct{ Field string }

func (e *ValidationError) Error() string { return "invalid " + e.Field }

func validateAge(age int) error {
	if age < 0 || age > 150 {
		return &ValidationError{Field: "age"}
	}
	return nil // {a literal nil, not a typed nil|সরাসরি nil, typed nil না}
}

func main() {
	err := fmt.Errorf("signup: %w", validateAge(200))
	var ve *ValidationError
	if errors.As(err, &ve) {
		fmt.Println("bad field:", ve.Field)
	}
	fmt.Println(err)
}` },
      { title: L('Parse with context', 'Context-সহ parse'),
        task: L('Write <code>parsePort(s string) (int, error)</code> using <code>strconv.Atoi</code>. Wrap conversion errors as <code>parse port "abc": …</code> and reject ports outside 1–65535 with your own error.', '<code>strconv.Atoi</code> দিয়ে <code>parsePort(s string) (int, error)</code> লিখুন। রূপান্তরের error-কে <code>parse port "abc": …</code> হিসেবে মুড়ুন, আর 1–65535-এর বাইরের port নিজের error দিয়ে বাতিল করুন।'),
        hints: [L('Use <code>%q</code> to quote the bad input in the message.', 'বার্তায় ভুল input quote করতে <code>%q</code> ব্যবহার করুন।'), L('Two separate checks: conversion, then range.', 'দুটো আলাদা যাচাই: রূপান্তর, তারপর পরিসর।')],
        solution: `package main

import (
	"fmt"
	"strconv"
)

func parsePort(s string) (int, error) {
	n, err := strconv.Atoi(s)
	if err != nil {
		return 0, fmt.Errorf("parse port %q: %w", s, err)
	}
	if n < 1 || n > 65535 {
		return 0, fmt.Errorf("port %d out of range 1-65535", n)
	}
	return n, nil
}

func main() {
	for _, in := range []string{"8080", "abc", "70000"} {
		p, err := parsePort(in)
		fmt.Println(p, err)
	}
}` },
    ],
    takeaways: [
      L('Errors are values: return <code>(T, error)</code> and check <code>err != nil</code> immediately.', 'Error হলো মান: <code>(T, error)</code> return করুন, আর সাথে সাথে <code>err != nil</code> যাচাই করুন।'),
      L('Wrap with <code>%w</code> to add context while keeping the cause.', 'কারণ রেখে context যোগ করতে <code>%w</code> দিয়ে মোড়ান।'),
      L('Inspect with <code>errors.Is</code> (sentinel values) and <code>errors.As</code> (error types), not ==.', '== না, <code>errors.Is</code> (sentinel value) আর <code>errors.As</code> (error type) দিয়ে যাচাই করুন।'),
      L('Lowercase messages, no panics for expected failures, literal nil on success.', 'ছোট হাতের বার্তা, প্রত্যাশিত ব্যর্থতায় panic নয়, সফলতায় সরাসরি nil।'),
    ],
    links: [
      { t: 'Go blog: Working with Errors in Go 1.13', url: 'https://go.dev/blog/go1.13-errors' },
      { t: 'Package errors', url: 'https://pkg.go.dev/errors' },
      { t: 'Go blog: Errors are values', url: 'https://go.dev/blog/errors-are-values' },
    ],
  });
})();
