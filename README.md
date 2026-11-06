# rashed9810.github.io

Personal research and portfolio site of **Md. Rashed Miah**, published at **https://rashed9810.github.io**.

Built with Astro 7, TypeScript and Tailwind CSS 4. Static output, no backend. Fonts are self-hosted and icons are inline SVG, so the page makes no third-party requests.

## Deploy (first time, about 5 minutes)

1. On GitHub, create a **new public repository named exactly `rashed9810.github.io`**. Leave it empty (no README, no .gitignore).
2. In a terminal, inside this folder:
   ```bash
   git remote add origin https://github.com/rashed9810/rashed9810.github.io.git
   git push -u origin main
   ```
3. In the repository on GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Open the **Actions** tab. The "Deploy to GitHub Pages" run takes 1–2 minutes. When it is green, the site is live at https://rashed9810.github.io.

After that, every push to `main` redeploys automatically.

## Run it locally

Requires Node.js 22 or newer.

```bash
npm install
npm run dev       # live-reloading dev server at http://localhost:4321
npm run check     # type check
npm run build     # production build into dist/
npm run preview   # serve the production build
```

## Updating content

All text lives in `src/data/`. You should not need to touch the components.

| To change… | Edit |
|---|---|
| Name, email, links, SEO description | `src/data/site.ts` |
| Research interests, papers, thesis | `src/data/research.ts` |
| Projects | `src/data/projects.ts` |
| Jobs | `src/data/experience.ts` |
| Skills | `src/data/skills.ts` |
| Degrees | `src/data/education.ts` |
| CV download | replace `public/cv/Md-Rashed-Miah-CV.pdf` (keep the file name) |
| Photo | replace `public/img/portrait-320.webp` and `portrait-640.webp` (square) |

### Adding a paper

Add an entry to `works` in `src/data/research.ts`:

```ts
{
  title: 'Your paper title',
  status: 'review',            // 'published' | 'review' | 'ongoing' | 'completed'
  kind: 'Journal article',
  year: '2027',
  authors: 'A. Author, Md. Rashed Miah, B. Author',  // your name is highlighted automatically
  venue: 'Journal or conference name',
  summary: 'Two-sentence summary.',
  links: [{ label: 'DOI', href: 'https://doi.org/...' }, { label: 'PDF', href: '...' }],
},
```

The page groups entries under **Published papers**, **Under review**, **Ongoing research** and **Completed research**, and hides empty groups. Use `published` only once a paper has a DOI or an official venue page.

### Adding Google Scholar or ORCID

Add them to `academicProfiles` in `src/data/site.ts`. They appear in the Contact section and in the structured data search engines read.

## Structure

```
src/
  data/          content (edit these)
  components/    one file per section; VerifyDemo is the hero animation
  layouts/       Base.astro: <head>, SEO, Open Graph, JSON-LD
  pages/         index.astro, 404.astro
  styles/        global.css: colour tokens, type, motion
public/          CV, photo, favicon, social image, robots.txt
.github/workflows/deploy.yml   build + deploy to GitHub Pages
```

## Accessibility and motion

Animations stop for visitors with "reduce motion" turned on in their operating system. The hero demo then shows its final state. Navigation works by keyboard, focus is always visible, and Escape closes the mobile menu.
