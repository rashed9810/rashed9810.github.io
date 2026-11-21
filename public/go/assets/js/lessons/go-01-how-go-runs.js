(function () {
  const { L, step, out } = GV;

  const flow = (cur, bad) => ({
    type: 'flow', wide: true, title: L('From source file to running program', 'সোর্স ফাইল থেকে চলমান প্রোগ্রাম'),
    items: [
      { label: 'main.go', sub: L('your source code', 'আপনার সোর্স কোড') },
      { label: 'go build', sub: L('parse, type-check, compile', 'পার্স, টাইপ-চেক, কম্পাইল') },
      { label: './hello', sub: L('one binary file', 'একটা binary ফাইল') },
      { label: 'OS', sub: L('loads and runs it', 'লোড করে চালায়') },
    ].map((it, k) => Object.assign(it, { cls: k === cur ? (bad ? 'bad' : 'cur') : k < cur ? 'ok' : bad ? 'dim' : '' })),
  });

  GV.register({
    id: 'go-how-go-runs', track: 'go', phase: 'start', order: 1, minutes: 12,
    title: L('How a Go program runs', 'Go প্রোগ্রাম কীভাবে চলে'),
    summary: L('From main.go to a single binary: package main, imports, func main, and why the compiler is so strict.', 'main.go থেকে একটা binary: package main, import, func main, আর compiler কেন এত কড়া।'),
    idea: L([
      'Python and JavaScript are usually run by an interpreter that reads your code while it runs, like a live translator standing beside a speaker. Go works like a speech translated in full before the event. The <b>compiler</b> reads your whole program first, checks every type, and produces a single <b>binary</b> file in your computer\'s own machine language.',
      'Two things follow from that. Mistakes such as a misspelled function or an unused import are caught <i>before</i> the program ever runs. And the result is one file with no runtime to install, which is why Go servers ship as tiny Docker images.',
    ], [
      'Python আর JavaScript সাধারণত একটা interpreter দিয়ে চলে, যেটা কোড চলার সময়েই পড়ে, অনেকটা বক্তার পাশে দাঁড়ানো দোভাষীর মতো। Go হলো বক্তৃতা আগে থেকেই পুরোটা অনুবাদ করে রাখার মতো। <b>Compiler</b> (কম্পাইলার) পুরো প্রোগ্রাম আগে পড়ে, প্রতিটা type যাচাই করে, তারপর কম্পিউটারের নিজস্ব ভাষায় একটা <b>binary</b> ফাইল বানায়।',
      'এর ফল দুটো। ভুল বানানের function বা অব্যবহৃত import-এর মতো ভুল প্রোগ্রাম চলার <i>আগেই</i> ধরা পড়ে। আর ফলাফল হলো একটা মাত্র ফাইল, কোনো runtime ইনস্টল করতে হয় না। এজন্যই Go সার্ভার খুব ছোট Docker image হিসেবে deploy হয়।',
    ]),
    visual: {
      file: 'main.go',
      examples: [
        {
          label: L('Hello, Go: build and run', 'Hello, Go: বিল্ড ও রান'),
          code: `
package main @@pkg

import "fmt" @@imp

// {main is where the program starts|প্রোগ্রাম এখান থেকেই শুরু হয়}
func main() { @@main
	fmt.Println("Hello, Go!") @@p1
	fmt.Println("আমি Go শিখছি") @@p2
} @@end`,
          build() {
            return [
              step('pkg', L('The compiler opens <code>main.go</code>. <code>package main</code> says: this builds a program you can run, not a library for other code.', 'Compiler <code>main.go</code> খোলে। <code>package main</code> মানে: এটা চালানো যায় এমন প্রোগ্রাম, অন্য কোডের জন্য library না।'), [flow(0)]),
              step('imp', L('<code>import "fmt"</code> pulls in the <b>fmt</b> package from the standard library. It formats and prints text.', '<code>import "fmt"</code> standard library থেকে <b>fmt</b> package আনে। এটা দিয়ে লেখা format আর print করা হয়।'), [flow(0)]),
              step(null, L('<code>go build</code> parses every file, checks every type, and compiles. Any error stops the build here, before a single line runs.', '<code>go build</code> প্রতিটা ফাইল পার্স করে, প্রতিটা type যাচাই করে, তারপর কম্পাইল করে। কোনো error থাকলে এখানেই থেমে যায়, একটা লাইনও চলার আগে।'), [flow(1)], {
                ask: { q: L('Suppose you also wrote <code>import "os"</code> but never used it. When would you find out?', 'ধরুন আপনি <code>import "os"</code> লিখেছেন কিন্তু ব্যবহার করেননি। কখন জানবেন?'),
                  options: [L('Now, at compile time. The build fails.', 'এখনই, compile-এর সময়। build fail হবে।'), L('Only when the program reaches that line.', 'শুধু প্রোগ্রাম ওই লাইনে পৌঁছালে।'), L('Never. Go ignores unused imports.', 'কখনো না। Go অব্যবহৃত import উপেক্ষা করে।')],
                  answer: 0, why: L('Go treats an unused import as an error, not a warning, so it is caught during the build.', 'Go অব্যবহৃত import-কে warning না, error হিসেবে ধরে। তাই build-এর সময়েই ধরা পড়ে।') },
              }),
              step(null, L('The output is one file, <code>hello</code> (or <code>hello.exe</code> on Windows). It already contains the Go runtime and garbage collector.', 'ফলাফল একটা ফাইল, <code>hello</code> (Windows-এ <code>hello.exe</code>)। এর ভেতরেই Go runtime আর garbage collector আছে।'), [flow(2)]),
              step('main', L('You run <code>./hello</code>. The OS loads it, the Go runtime starts, then calls <code>main()</code>. This is the entry point.', 'আপনি <code>./hello</code> চালালেন। OS এটা লোড করে, Go runtime চালু হয়, তারপর <code>main()</code> call করে। এটাই entry point (প্রবেশ পথ)।'), [flow(3), out([])]),
              step('p1', L('<code>fmt.Println</code> prints the text and adds a newline. The capital <b>P</b> means Println is <b>exported</b>, so code outside the fmt package may call it.', '<code>fmt.Println</code> লেখাটা print করে, শেষে নতুন লাইন যোগ করে। বড় হাতের <b>P</b> মানে Println <b>exported</b> (বাইরে থেকে ব্যবহারযোগ্য)।'), [flow(3), out(['Hello, Go!'], 1)]),
              step('p2', L('Go source files are UTF-8, so Bangla text prints correctly with no extra setup.', 'Go সোর্স ফাইল UTF-8, তাই বাংলা লেখা কোনো বাড়তি সেটআপ ছাড়াই ঠিকমতো print হয়।'), [flow(3), out(['Hello, Go!', 'আমি Go শিখছি'], 1)]),
              step('end', L('<code>main</code> returns, so the program exits with status 0 (success). When main ends, the whole program ends, even if other work is still running.', '<code>main</code> শেষ হলো, তাই প্রোগ্রাম status 0 (সফল) দিয়ে বের হয়ে যায়। main শেষ হলে পুরো প্রোগ্রাম শেষ, অন্য কাজ চললেও।'), [flow(4), out(['Hello, Go!', 'আমি Go শিখছি', { v: '$ echo $?   →   0', cls: 'ok' }])], { tone: 'ok' }),
            ];
          },
        },
        {
          label: L('A compile error stops the build', 'Compile error build থামিয়ে দেয়'),
          code: `
package main

import (
	"fmt"
	"os" @@os
)

func main() { @@main
	fmt.Println("Hello, Go!")
}`,
          build() {
            return [
              step('main', L('This program imports two packages but only uses <code>fmt</code>.', 'এই প্রোগ্রাম দুটো package import করে কিন্তু শুধু <code>fmt</code> ব্যবহার করে।'), [flow(0)]),
              step('os', L('The compiler finds <code>"os"</code> unused and refuses to build. Read the error as <b>file:line:column: message</b>.', 'Compiler দেখে <code>"os"</code> অব্যবহৃত, তাই build করতে রাজি হয় না। Error পড়ুন এভাবে: <b>ফাইল:লাইন:কলাম: বার্তা</b>।'), [flow(1, true), out([{ v: '$ go build', cls: 'muted' }, { v: '# example.com/hello', cls: 'bad' }, { v: './main.go:5:2: "os" imported and not used', cls: 'bad' }])], { tone: 'bad' }),
              step('os', L('No binary was produced, and nothing ran. Fix it by deleting the line, or by actually using <code>os</code>. Your editor\'s Go extension does this on save.', 'কোনো binary তৈরি হয়নি, কিছুই চলেনি। লাইনটা মুছে দিন, অথবা সত্যিই <code>os</code> ব্যবহার করুন। Editor-এর Go extension save করলেই এটা ঠিক করে দেয়।'), [flow(1, true), out([{ v: '$ go build', cls: 'muted' }, { v: './main.go:5:2: "os" imported and not used', cls: 'bad' }]), { type: 'text', cls: 'run', text: L('Why so strict? Unused imports slow builds and hide mistakes in large codebases.', 'এত কড়া কেন? বড় কোডবেসে অব্যবহৃত import build ধীর করে আর ভুল লুকিয়ে রাখে।') }]),
            ];
          },
        },
      ],
    },
    walk: [
      { at: 'pkg', code: 'package main', text: L('Every file belongs to a package. Only <code>package main</code> produces a runnable program.', 'প্রতিটা ফাইল একটা package-এর অংশ। শুধু <code>package main</code> চালানো যায় এমন প্রোগ্রাম বানায়।') },
      { at: 'imp', code: 'import "fmt"', text: L('Brings in a package. Several imports go in a group: <code>import ( "fmt"; "os" )</code>, one per line.', 'Package আনে। একাধিক import একসাথে group-এ লেখা হয়, প্রতি লাইনে একটা।') },
      { at: 'main', code: 'func main() {', text: L('The entry point. No arguments, no return value. The <code>{</code> must stay on this line.', 'Entry point। কোনো argument নেই, কোনো return নেই। <code>{</code> অবশ্যই এই লাইনেই থাকবে।') },
      { at: 'p1', code: 'fmt.Println("Hello, Go!")', text: L('Calls an exported function from another package: <code>package.Name</code>.', 'অন্য package-এর exported function call: <code>package.Name</code>।') },
    ],
    mistakes: [
      { title: L('Putting { on the next line', '{ পরের লাইনে লেখা'), err: './main.go:5:1: syntax error: unexpected semicolon or newline before {', fix: L('Go inserts semicolons at line ends automatically, so <code>func main()</code> on its own line gets "closed" too early. Keep the brace on the same line. <code>gofmt</code> enforces this style everywhere.', 'Go লাইনের শেষে নিজে থেকে semicolon বসায়, তাই আলাদা লাইনে <code>func main()</code> আগেভাগেই "বন্ধ" হয়ে যায়। Brace একই লাইনে রাখুন। <code>gofmt</code> সব জায়গায় এই স্টাইল মানায়।') },
      { title: L('Unused import or variable', 'অব্যবহৃত import বা variable'), err: './main.go:5:2: "os" imported and not used\n./main.go:9:2: declared and not used: x', fix: L('Both are compile errors in Go. Remove them, or use <code>_</code> on purpose: <code>_ = x</code>.', 'Go-তে দুটোই compile error। মুছে ফেলুন, অথবা ইচ্ছা করে <code>_</code> ব্যবহার করুন: <code>_ = x</code>।') },
      { title: L('Running a package that is not main', 'main নয় এমন package চালানো'), err: 'package command-line-arguments is not a main package', fix: L('Rename the package to <code>main</code> and make sure it has a <code>func main()</code>.', 'Package-এর নাম <code>main</code> দিন আর নিশ্চিত করুন <code>func main()</code> আছে।') },
      { title: L('Building outside a module', 'Module ছাড়া build করা'), err: 'go: go.mod file not found in current directory or any parent directory', fix: L('Run <code>go mod init example.com/hello</code> once in the project folder. <code>go.mod</code> is like package.json in Node.', 'Project ফোল্ডারে একবার <code>go mod init example.com/hello</code> চালান। <code>go.mod</code> অনেকটা Node-এর package.json-এর মতো।') },
    ],
    perf: L([
      '<code>go run main.go</code> compiles into a temporary folder and runs it. It is convenient while learning. In production you always ship the output of <code>go build</code>.',
      'The build cache makes rebuilds fast: unchanged packages are not recompiled. Run <code>go vet ./...</code> before committing. It finds bugs the compiler allows, such as a wrong <code>Printf</code> verb.',
    ], [
      '<code>go run main.go</code> একটা অস্থায়ী ফোল্ডারে কম্পাইল করে চালায়। শেখার সময় সুবিধাজনক। Production-এ সবসময় <code>go build</code>-এর output ব্যবহার করবেন।',
      'Build cache থাকায় আবার build দ্রুত হয়: যেসব package বদলায়নি সেগুলো আবার কম্পাইল হয় না। Commit করার আগে <code>go vet ./...</code> চালান। Compiler যেসব bug ধরে না, যেমন ভুল <code>Printf</code> verb, সেগুলো এটা ধরে।',
    ]),
    quiz: [
      { q: L('What makes a Go file build into a runnable program?', 'কোন জিনিসটা একটা Go ফাইলকে চালানো যায় এমন প্রোগ্রামে পরিণত করে?'),
        options: [L('<code>package main</code> plus <code>func main()</code>', '<code>package main</code> আর <code>func main()</code>'), L('A file named main.go', 'main.go নামের ফাইল'), L('An <code>import "os"</code> line', '<code>import "os"</code> লাইন')],
        answer: 0, why: L('The file name does not matter. The package must be main and it must declare func main.', 'ফাইলের নাম কোনো ব্যাপার না। Package হতে হবে main, আর func main থাকতে হবে।') },
      { q: L('Why does <code>fmt.Println</code> start with a capital letter?', '<code>fmt.Println</code> বড় হাতের অক্ষরে শুরু কেন?'),
        options: [L('Capitalised names are exported, usable from other packages', 'বড় হাতের নাম exported, অন্য package থেকে ব্যবহার করা যায়'), L('It is a convention with no effect', 'এটা শুধু রীতি, কোনো প্রভাব নেই'), L('Functions that print must be capitalised', 'যেসব function print করে সেগুলো বড় হাতের হতে হয়')],
        answer: 0, why: L('In Go, the first letter decides visibility. <code>println</code> inside fmt would be private to fmt.', 'Go-তে প্রথম অক্ষর দিয়েই ঠিক হয় কে দেখতে পাবে। fmt-এর ভেতরের <code>println</code> fmt-এর বাইরে ব্যবহার করা যেত না।') },
      { q: L('What do you deploy to a server after <code>go build</code>?', '<code>go build</code>-এর পর সার্ভারে কী deploy করবেন?'),
        options: [L('The single binary file', 'একটা binary ফাইল'), L('The .go files plus a Go installation', '.go ফাইল আর Go ইনস্টলেশন'), L('A node_modules-style dependency folder', 'node_modules-এর মতো dependency ফোল্ডার')],
        answer: 0, why: L('The binary is self-contained. The server does not need Go installed.', 'Binary নিজেই সম্পূর্ণ। সার্ভারে Go ইনস্টল থাকার দরকার নেই।') },
    ],
    exercises: [
      { title: L('Introduce yourself', 'নিজের পরিচয়'),
        task: L('Write a program that prints three lines: your name, your job, and why you are learning Go. Build it with <code>go build</code> and run the binary, not <code>go run</code>.', 'একটা প্রোগ্রাম লিখুন যেটা তিনটা লাইন print করে: আপনার নাম, কাজ, আর কেন Go শিখছেন। <code>go build</code> দিয়ে build করে binary চালান, <code>go run</code> না।'),
        hints: [L('You need one import and three calls to the same function.', 'একটা import আর একই function তিনবার call করতে হবে।'), L('After <code>go build</code>, run <code>./hello</code> (or <code>hello.exe</code>).', '<code>go build</code>-এর পর <code>./hello</code> (বা <code>hello.exe</code>) চালান।')],
        solution: `package main

import "fmt"

func main() {
	fmt.Println("Name: Rashed")
	fmt.Println("Job: Software Engineer")
	fmt.Println("Learning Go to build backend and AI systems")
}` },
      { title: L('Print your OS and Go version', 'আপনার OS আর Go version print করুন'),
        task: L('Use the <code>runtime</code> package to print the operating system and the Go version the binary was built with. Find the right names yourself in the package docs at pkg.go.dev/runtime.', '<code>runtime</code> package দিয়ে operating system আর কোন Go version দিয়ে binary বানানো হয়েছে সেটা print করুন। সঠিক নামগুলো নিজেই pkg.go.dev/runtime-এ খুঁজে বের করুন।'),
        hints: [L('Two imports need the grouped form: <code>import ( ... )</code>.', 'দুটো import-এর জন্য group ফর্ম লাগবে: <code>import ( ... )</code>।'), L('Look for a constant named like the OS, and a function that returns the version.', 'OS-এর নামের মতো একটা constant, আর version ফেরত দেয় এমন একটা function খুঁজুন।')],
        solution: `package main

import (
	"fmt"
	"runtime"
)

func main() {
	// {GOOS is a constant, Version() is a function|GOOS একটা constant, Version() একটা function}
	fmt.Println("OS:", runtime.GOOS)
	fmt.Println("Go version:", runtime.Version())
}` },
    ],
    takeaways: [
      L('Go is compiled: errors are found before the program runs, and the result is one binary.', 'Go compiled: প্রোগ্রাম চলার আগেই error ধরা পড়ে, আর ফলাফল একটা binary।'),
      L('A runnable program needs <code>package main</code> and <code>func main()</code>.', 'চালানো যায় এমন প্রোগ্রামে <code>package main</code> আর <code>func main()</code> লাগবে।'),
      L('Capitalised names are exported. Lowercase names stay private to their package.', 'বড় হাতের নাম exported। ছোট হাতের নাম নিজের package-এর ভেতরেই থাকে।'),
      L('Unused imports and variables are compile errors. Let gofmt and go vet keep your code clean.', 'অব্যবহৃত import আর variable compile error। gofmt আর go vet দিয়ে কোড পরিষ্কার রাখুন।'),
    ],
    links: [
      { t: 'Tutorial: Get started with Go', url: 'https://go.dev/doc/tutorial/getting-started' },
      { t: 'How to Write Go Code (modules)', url: 'https://go.dev/doc/code' },
      { t: 'A Tour of Go', url: 'https://go.dev/tour/' },
    ],
  });
})();
