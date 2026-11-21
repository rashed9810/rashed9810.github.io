(function () {
  const { L, step } = GV;
  const POS = { A: [210, 34], B: [110, 110], C: [310, 110], D: [40, 200], E: [170, 200], F: [330, 210], G: [170, 280] };
  const EDGES = [['A', 'B'], ['A', 'C'], ['B', 'D'], ['B', 'E'], ['C', 'F'], ['E', 'F'], ['E', 'G']];
  const ADJ = {};
  Object.keys(POS).forEach((k) => { ADJ[k] = []; });
  EDGES.forEach(([a, b]) => { ADJ[a].push(b); ADJ[b].push(a); });
  Object.values(ADJ).forEach((l) => l.sort());
  const graph = (visited, frontier, cur, edgeHl) => ({
    type: 'graph', title: L('Graph (neighbours in alphabetical order)', 'Graph (প্রতিবেশী বর্ণানুক্রমে)'), w: 380, h: 316,
    nodes: Object.entries(POS).map(([id, [x, y]]) => ({ id, x, y, cls: id === cur ? 'cur' : visited.has(id) ? 'ok' : frontier.has(id) ? 'live' : '' })),
    edges: EDGES.map(([a, b]) => ({ a, b, cls: edgeHl && ((edgeHl[0] === a && edgeHl[1] === b) || (edgeHl[0] === b && edgeHl[1] === a)) ? 'hl' : '' })),
  });
  const orderP = (order) => ({ type: 'array', idx: false, chars: true, title: L('Visit order', 'দেখার ক্রম'), cells: order.map((v) => ({ v, cls: 'ok' })) });
  const startInput = { key: 'start', label: L('Start node', 'শুরুর node'), type: 'select', def: 'A', options: Object.keys(POS).map((k) => ({ v: k, label: k })) };
  const graphLit = 'graph := map[string][]string{\n\t"A": {"B", "C"}, "B": {"A", "D", "E"}, "C": {"A", "F"},\n\t"D": {"B"}, "E": {"B", "F", "G"}, "F": {"C", "E"}, "G": {"E"},\n}';

  GV.register({
    id: 'dsa-graph-bfs-dfs', track: 'dsa', phase: 'structures', order: 3, minutes: 18,
    title: L('Graph search: BFS and DFS', 'Graph search: BFS আর DFS'),
    summary: L('Explore a graph level by level with a queue (BFS) or as deep as possible with a stack (DFS), and watch the visited set grow.', 'একটা graph স্তর ধরে ধরে queue দিয়ে (BFS) বা যত গভীরে সম্ভব stack দিয়ে (DFS) ঘুরে দেখুন, আর visited set বাড়তে দেখুন।'),
    idea: L([
      'A <b>graph</b> is a set of nodes joined by edges: cities and roads, users and friendships, services and the calls between them. In Go, an adjacency list is simply <code>map[string][]string</code>.',
      '<b>BFS</b> (breadth-first search) is like ripples in a pond: first every node one step away, then two steps, and so on. It uses a <b>queue</b> (first in, first out), and it finds the shortest path in an unweighted graph. <b>DFS</b> (depth-first search) is like exploring a maze with one hand on the wall: go as deep as you can, then back up. It uses a <b>stack</b>.',
      'Both keep a <b>visited</b> set, otherwise a cycle (E–F–C–A–B–E here) would make them loop forever.',
    ], [
      '<b>Graph</b> হলো edge দিয়ে যুক্ত কিছু node: শহর আর রাস্তা, ব্যবহারকারী আর বন্ধুত্ব, সার্ভিস আর তাদের মধ্যের call। Go-তে adjacency list হলো শুধু <code>map[string][]string</code>।',
      '<b>BFS</b> (breadth-first search) পুকুরের ঢেউয়ের মতো: আগে এক ধাপ দূরের সব node, তারপর দুই ধাপ, এভাবে। এটা <b>queue</b> ব্যবহার করে (আগে ঢোকে, আগে বের হয়), আর ওজনহীন graph-এ সবচেয়ে ছোট পথ খুঁজে দেয়। <b>DFS</b> (depth-first search) হলো দেয়ালে এক হাত রেখে গোলকধাঁধা ঘোরার মতো: যত গভীরে পারেন যান, তারপর পিছিয়ে আসুন। এটা <b>stack</b> ব্যবহার করে।',
      'দুটোই একটা <b>visited</b> set রাখে, নইলে একটা চক্র (এখানে E–F–C–A–B–E) তাদের অনন্তকাল ঘোরাত।',
    ]),
    complexity: { time: 'O(V + E)', space: 'O(V)', note: L('Every node is enqueued once and every edge is looked at a constant number of times.', 'প্রতিটা node একবার queue-তে ঢোকে, আর প্রতিটা edge নির্দিষ্ট কয়েকবার দেখা হয়।') },
    visual: {
      file: 'graph.go',
      legend: [{ cls: 'cur', label: L('being processed', 'প্রক্রিয়া হচ্ছে') }, { cls: 'live', label: L('waiting in queue or stack', 'queue বা stack-এ অপেক্ষায়') }, { cls: 'ok', label: L('visited', 'দেখা হয়েছে') }],
      examples: [
        {
          label: L('BFS with a queue', 'Queue দিয়ে BFS'),
          inputs: [startInput],
          code: `
func bfs(graph map[string][]string, start string) []string {
	visited := map[string]bool{start: true} @@init
	queue := []string{start}
	var order []string
	for len(queue) > 0 { @@cond
		node := queue[0] // {take from the front|সামনে থেকে নাও} @@pop
		queue = queue[1:]
		order = append(order, node) @@visit
		for _, nb := range graph[node] { @@loop
			if !visited[nb] { @@chk
				visited[nb] = true // {mark when enqueued, not when visited|দেখার সময় না, queue-তে ঢোকানোর সময় চিহ্ন} @@mark
				queue = append(queue, nb) @@push
			}
		}
	}
	return order @@ret
}`,
          build({ start }) {
            const s = [];
            const marked = new Set([start]);
            const done = new Set();
            let queue = [start];
            const order = [];
            const q = () => ({ type: 'stack', dir: 'h', title: L('queue (front on the left)', 'queue (সামনে বামদিকে)'), items: queue.map((v, k) => ({ v, cls: k === 0 ? 'live' : '' })) });
            const snap = (cur, eh) => [graph(done, new Set(queue), cur, eh), q(), orderP(order)];
            s.push(step('init', L(`Start at ${start}: mark it and put it in the queue.`, `${start} থেকে শুরু: চিহ্ন দিয়ে queue-তে রাখো।`), snap()));
            let asked = false;
            while (queue.length) {
              const node = queue.shift();
              s.push(step('pop', L(`Take ${node} from the <b>front</b> of the queue.`, `queue-এর <b>সামনে</b> থেকে ${node} নাও।`), snap(node)));
              order.push(node); done.add(node);
              s.push(step('visit', L(`Visit ${node}. Its neighbours: ${ADJ[node].join(', ')}.`, `${node} দেখা হলো। এর প্রতিবেশী: ${ADJ[node].join(', ')}।`), snap(node)));
              const added = [];
              ADJ[node].forEach((nb) => {
                if (!marked.has(nb)) { marked.add(nb); queue.push(nb); added.push(nb); }
              });
              if (added.length) {
                const extra = !asked && queue.length >= 2 ? { ask: { q: L(`The queue is now ${queue.join(', ')}. Which node is processed next?`, `queue এখন ${queue.join(', ')}। এরপর কোন node প্রক্রিয়া হবে?`), options: [queue[0], queue[queue.length - 1]].filter((v, i, a) => a.indexOf(v) === i).concat(queue.length === 1 ? [node] : []), answer: 0, why: L('A queue serves the oldest entry first. That is what makes BFS go level by level.', 'Queue সবচেয়ে পুরনোটাকে আগে সেবা দেয়। এজন্যই BFS স্তর ধরে ধরে চলে।') } } : {};
                if (extra.ask) asked = true;
                s.push(step('push', L(`Enqueue unseen neighbours ${added.join(', ')} at the back.`, `না-দেখা প্রতিবেশী ${added.join(', ')}-কে পেছনে queue-তে রাখো।`), snap(node), extra));
              } else {
                s.push(step('chk', L('Every neighbour is already marked. Nothing to add.', 'প্রতিটা প্রতিবেশী আগেই চিহ্নিত। যোগ করার কিছু নেই।'), snap(node)));
              }
            }
            s.push(step('ret', L(`Queue empty. BFS order: ${order.join(' → ')}. Nodes appear in order of distance from ${start}.`, `queue খালি। BFS ক্রম: ${order.join(' → ')}। ${start} থেকে দূরত্বের ক্রমে node আসে।`), snap(), { tone: 'ok' }));
            return s;
          },
        },
        {
          label: L('DFS with a stack', 'Stack দিয়ে DFS'),
          inputs: [startInput],
          code: `
func dfs(graph map[string][]string, start string) []string {
	visited := map[string]bool{}
	stack := []string{start} @@init
	var order []string
	for len(stack) > 0 { @@cond
		node := stack[len(stack)-1] // {take from the top|উপর থেকে নাও} @@pop
		stack = stack[:len(stack)-1]
		if visited[node] { @@chk
			continue // {already handled via another path|অন্য পথে আগেই হয়ে গেছে} @@skip
		}
		visited[node] = true @@mark
		order = append(order, node)
		for i := len(graph[node]) - 1; i >= 0; i-- { @@loop
			stack = append(stack, graph[node][i]) // {reverse push: first neighbour on top|উল্টো push: প্রথম প্রতিবেশী উপরে} @@push
		}
	}
	return order @@ret
}`,
          build({ start }) {
            const s = [];
            const done = new Set();
            let stack = [start];
            const order = [];
            const st = () => ({ type: 'stack', title: L('stack (top first)', 'stack (উপরেরটা আগে)'), items: stack.map((v, k) => ({ v, cls: k === stack.length - 1 ? 'live' : done.has(v) ? 'dim' : '' })) });
            const snap = (cur) => [graph(done, new Set(stack.filter((x) => !done.has(x))), cur), st(), orderP(order)];
            s.push(step('init', L(`Push ${start}.`, `${start} push।`), snap()));
            let asked = false, guard = 0;
            while (stack.length && guard++ < 60) {
              const node = stack.pop();
              s.push(step('pop', L(`Pop ${node} from the <b>top</b>.`, `<b>উপর</b> থেকে ${node} pop।`), snap(node)));
              if (done.has(node)) {
                s.push(step('skip', L(`${node} was already visited through another path. Skip it.`, `${node} অন্য পথে আগেই দেখা হয়েছে। বাদ।`), snap()));
                continue;
              }
              done.add(node); order.push(node);
              s.push(step('mark', L(`Visit ${node}.`, `${node} দেখা হলো।`), snap(node)));
              const nbs = ADJ[node].filter((x) => !done.has(x));
              if (!nbs.length) { s.push(step('loop', L('No unvisited neighbours: back up.', 'না-দেখা প্রতিবেশী নেই: পিছিয়ে যাও।'), snap(node))); continue; }
              for (let i = ADJ[node].length - 1; i >= 0; i--) stack.push(ADJ[node][i]);
              const extra = !asked && order.length >= 2 ? { ask: { q: L(`Stack top is now ${stack[stack.length - 1]}. BFS would go to the oldest waiting node; where does DFS go?`, `stack-এর উপরে এখন ${stack[stack.length - 1]}। BFS যেত সবচেয়ে পুরনো অপেক্ষারত node-এ; DFS কোথায় যাবে?`), options: [stack[stack.length - 1], stack[0]].filter((v, i, a) => a.indexOf(v) === i).concat(stack.length === 1 ? ['–'] : []), answer: 0, why: L('A stack serves the newest entry first, so DFS dives deeper before trying siblings.', 'Stack সবচেয়ে নতুনটাকে আগে সেবা দেয়, তাই DFS ভাইবোনদের আগে আরও গভীরে যায়।') } } : {};
              if (extra.ask) asked = true;
              s.push(step('push', L(`Push neighbours ${ADJ[node].slice().reverse().join(', ')} so that ${ADJ[node][0]} ends up on top.`, `প্রতিবেশী ${ADJ[node].slice().reverse().join(', ')} push, যাতে ${ADJ[node][0]} উপরে থাকে।`), snap(node), extra));
            }
            s.push(step('ret', L(`Stack empty. DFS order: ${order.join(' → ')}. Compare it with the BFS order.`, `stack খালি। DFS ক্রম: ${order.join(' → ')}। BFS ক্রমের সাথে তুলনা করুন।`), snap(), { tone: 'ok' }));
            return s;
          },
        },
      ],
    },
    walk: [
      { at: 'init', ex: 0, code: 'visited := map[string]bool{start: true}', text: L('A set in Go is a map to bool (or to struct{}).', 'Go-তে set হলো bool (বা struct{})-এর map।') },
      { at: 'pop', ex: 0, code: 'node := queue[0]; queue = queue[1:]', text: L('Dequeue from the front. Fine for learning; for huge graphs use a ring buffer.', 'সামনে থেকে বের করা। শেখার জন্য ঠিক আছে; বিশাল graph-এ ring buffer ব্যবহার করুন।') },
      { at: 'mark', ex: 0, code: 'visited[nb] = true', text: L('Mark on enqueue so a node is never queued twice.', 'Queue-তে ঢোকানোর সময়েই চিহ্ন, যাতে একটা node দুবার না ঢোকে।') },
      { at: 'pop', ex: 1, code: 'node := stack[len(stack)-1]', text: L('Same loop, different container: that is the whole BFS/DFS difference.', 'একই লুপ, আলাদা পাত্র: BFS/DFS-এর পুরো পার্থক্য এটাই।') },
    ],
    mistakes: [
      { title: L('No visited set', 'Visited set নেই'), err: '', fix: L('Any cycle makes the search loop forever and memory grows until the program dies.', 'যেকোনো চক্রে খোঁজা অনন্তকাল ঘোরে, আর মেমরি বাড়তে থাকে যতক্ষণ না প্রোগ্রাম মরে।') },
      { title: L('Marking BFS nodes only when dequeued', 'শুধু বের করার সময় BFS node চিহ্নিত করা'), err: '', fix: L('Then a node can sit in the queue several times. Mark when you enqueue.', 'তাহলে একটা node কয়েকবার queue-তে থাকতে পারে। ঢোকানোর সময়েই চিহ্ন দিন।') },
      { title: L('Recursive DFS on very deep graphs', 'খুব গভীর graph-এ recursive DFS'), err: '', fix: L('Go stacks grow, but a million-deep recursion is still slow and memory-hungry. The explicit stack shown here avoids that.', 'Go-র stack বাড়ে, কিন্তু দশ লাখ গভীর recursion তবুও ধীর আর মেমরি-খেকো। এখানে দেখানো সুস্পষ্ট stack সেটা এড়ায়।') },
    ],
    quiz: [
      { q: L('Which finds the shortest path (fewest edges) in an unweighted graph?', 'ওজনহীন graph-এ সবচেয়ে ছোট পথ (সবচেয়ে কম edge) কোনটা খোঁজে?'), options: ['BFS', 'DFS', L('both always', 'দুটোই সবসময়')], answer: 0, why: L('BFS reaches nodes in order of distance.', 'BFS দূরত্বের ক্রমে node-এ পৌঁছায়।') },
      { q: L('BFS uses a … and DFS uses a …', 'BFS ব্যবহার করে … আর DFS ব্যবহার করে …'), options: [L('queue, stack', 'queue, stack'), L('stack, queue', 'stack, queue'), L('map, map', 'map, map')], answer: 0, why: L('FIFO for breadth, LIFO for depth.', 'চওড়ার জন্য FIFO, গভীরতার জন্য LIFO।') },
      { q: L('Time complexity of BFS on V nodes and E edges?', 'V node আর E edge-এ BFS-এর সময় জটিলতা?'), options: ['O(V + E)', 'O(V × E)', 'O(V²)'], answer: 0, why: L('Each node and edge is handled a constant number of times.', 'প্রতিটা node আর edge নির্দিষ্ট কয়েকবার সামলানো হয়।') },
    ],
    exercises: [
      { title: L('Shortest distance', 'সবচেয়ে কম দূরত্ব'),
        task: L('Modify BFS to return <code>map[string]int</code> of distances from the start. From A, G is 3 edges away.', 'BFS বদলে শুরু থেকে দূরত্বের একটা <code>map[string]int</code> ফেরত দিন। A থেকে G তিন edge দূরে।'),
        hints: [L('Replace visited with dist; a node is visited if it has an entry.', 'visited-এর বদলে dist; entry থাকলে node দেখা হয়েছে।'), L('When enqueuing nb from node: dist[nb] = dist[node] + 1.', 'node থেকে nb ঢোকানোর সময়: dist[nb] = dist[node] + 1।')],
        solution: `package main

import "fmt"

func distances(graph map[string][]string, start string) map[string]int {
	dist := map[string]int{start: 0}
	queue := []string{start}
	for len(queue) > 0 {
		node := queue[0]
		queue = queue[1:]
		for _, nb := range graph[node] {
			if _, seen := dist[nb]; !seen {
				dist[nb] = dist[node] + 1 // {one edge further|এক edge দূরে}
				queue = append(queue, nb)
			}
		}
	}
	return dist
}

func main() {
	` + graphLit.replace(/\n/g, '\n\t') + `
	fmt.Println(distances(graph, "A")["G"]) // {3|3}
}` },
      { title: L('Count islands', 'দ্বীপ গোনা'),
        task: L('A grid of "1" (land) and "0" (water) is a graph where each cell links to its up, down, left and right neighbours. Count connected islands with DFS. The sample grid has 3.', '"1" (স্থল) আর "0" (পানি)-এর একটা grid হলো graph, যেখানে প্রতিটা ঘর উপর, নিচ, বাম, ডানের প্রতিবেশীর সাথে যুক্ত। DFS দিয়ে যুক্ত দ্বীপ গুনুন। নমুনা grid-এ 3টা।'),
        hints: [L('Loop over every cell; when you find unvisited land, count one island and flood it.', 'প্রতিটা ঘর ধরে লুপ; না-দেখা স্থল পেলে একটা দ্বীপ গুনুন আর পুরোটা ভরিয়ে দিন।'), L('"Flooding" can simply set visited cells to "0".', '"ভরানো" মানে শুধু দেখা ঘরগুলো "0" করে দেওয়া।')],
        solution: `package main

import "fmt"

func islands(grid [][]byte) int {
	var sink func(r, c int)
	sink = func(r, c int) {
		if r < 0 || c < 0 || r >= len(grid) || c >= len(grid[0]) || grid[r][c] != '1' {
			return
		}
		grid[r][c] = '0' // {mark as visited|দেখা হয়েছে চিহ্ন}
		sink(r+1, c)
		sink(r-1, c)
		sink(r, c+1)
		sink(r, c-1)
	}
	count := 0
	for r := range grid {
		for c := range grid[r] {
			if grid[r][c] == '1' {
				count++
				sink(r, c)
			}
		}
	}
	return count
}

func main() {
	grid := [][]byte{
		[]byte("11000"),
		[]byte("11000"),
		[]byte("00100"),
		[]byte("00011"),
	}
	fmt.Println(islands(grid)) // {3|3}
}` },
    ],
    takeaways: [
      L('Represent graphs as map[node][]neighbour in Go.', 'Go-তে graph হিসেবে map[node][]neighbour ব্যবহার করুন।'),
      L('BFS = queue, level by level, shortest paths. DFS = stack, deep first.', 'BFS = queue, স্তর ধরে, সবচেয়ে ছোট পথ। DFS = stack, আগে গভীরে।'),
      L('Always track visited nodes. Both run in O(V + E).', 'সবসময় দেখা node মনে রাখুন। দুটোই O(V + E)।'),
    ],
    links: [{ t: 'Go by Example: Maps', url: 'https://gobyexample.com/maps' }],
  });
})();
