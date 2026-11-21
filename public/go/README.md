# Go, line by line

Animated, bilingual (English / বাংলা) Go lessons. Every lesson runs real Go code step by step: the running line is highlighted while memory, pointers, goroutines or an algorithm change beside it.

- 17 Go lessons: how Go runs → variables → control flow → functions → pointers → slices → maps → strings and runes (with Bangla) → structs → interfaces → errors → defer/panic → goroutines and channels → mutex and races → worker pools → select and context → HTTP middleware
- 9 DSA lessons with Go code: binary search, two pointers, sliding window, hash map, stack, linked list, sorting, BFS/DFS, dynamic programming
- 603 animated steps, Predict mode (the player stops and asks what happens next), quizzes, exercises with hints and solutions, glossary, search (Ctrl K), progress saved in the browser
- Plain HTML, CSS and JavaScript. No build step, no framework, no backend.

Every Go program on the site (99 of them) compiles, passes `gofmt` and `go vet`, and prints what the animation shows (checked with Go 1.24). Run the samples with Go 1.22 or newer (the HTTP lesson uses the 1.22 routing patterns).

## Put it on rashed9810.github.io

**Option A: as a folder in your existing site (recommended)**

1. Copy this whole folder into your `rashed9810.github.io` repository, for example as `go/`.
2. Commit and push:
   ```bash
   git add go
   git commit -m "Add Go, line by line"
   git push
   ```
3. Open `https://rashed9810.github.io/go/`. All paths are relative, so it works inside a subfolder.
4. Link to it from your home page: `<a href="go/">Learn Go, line by line</a>`.

**Option B: as its own repository**

1. Create a repo named `go-line-by-line` and push these files to `main`.
2. Repo Settings → Pages → Source: Deploy from a branch → `main` / root.
3. It appears at `https://rashed9810.github.io/go-line-by-line/`.

The `.nojekyll` file stops GitHub Pages from processing the site with Jekyll.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```
Opening `index.html` directly from disk also works.

## Add a lesson

1. Copy any file in `assets/js/lessons/` and rename it (files load in name order; the `phase` and `order` fields decide placement on the roadmap).
2. Add one `<script>` line for it in `index.html`, between `LESSONS:START` and `LESSONS:END`.
3. In code samples, end a line with `@@name` to let steps point at it, and write comments as `// {English|বাংলা}` so they switch with the language toggle.

## Files

```
index.html                page shell
assets/css/style.css      design (dark and light themes)
assets/js/core.js         language helpers, Go highlighter
assets/js/renderers.js    memory boxes, arrays, stacks, channels, graphs, tables
assets/js/player.js       step player, Predict mode
assets/js/pages.js        roadmap, lesson page, glossary, search
assets/js/glossary.js     bilingual glossary
assets/js/lessons/*.js    one file per lesson
```
