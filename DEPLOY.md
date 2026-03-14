# Deploy Calmo to GitHub Pages (calmo.fit)

## Prerequisites

- Repository on GitHub
- Custom domain **calmo.fit** with DNS:
  - **A** records: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
  - Or **CNAME**: `calmo.fit` → `<username>.github.io` (if using user/org Pages)
- GitHub Pages enabled: Settings → Pages → Source: **GitHub Actions** or **Deploy from branch** (branch: `gh-pages` or `main`, folder: `/ (root)` or `dist`)

## Build

```bash
npm ci
npm run build
```

The `dist` folder will contain:

- `index.html` – SPA entry (canonical https://calmo.fit/)
- `404.html` – SPA fallback (redirects to index.html with `?redirect=/path`)
- `CNAME` – contains `calmo.fit`
- `.nojekyll` – disables Jekyll on GitHub Pages
- `robots.txt`, `sitemap.xml` – SEO
- `assets/` – JS/CSS (base `/`)

## Deploy from branch (manual)

1. Build: `npm run build`
2. If you use branch `gh-pages` with the **contents of dist**:
   - Copy contents of `dist` to the root of a branch named `gh-pages` and push.
   - In Settings → Pages, set source to branch `gh-pages`, folder `/ (root)`.
3. If you use branch `main` and docs folder:
   - Set Pages source to branch `main`, folder `/docs`, then set `vite.config.ts` `build.outDir` to `docs` and build.

## Deploy with GitHub Actions (recommended)

Create `.github/workflows/deploy-pages.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@3
        with:
          path: dist

  deploy:
    environment: github-pages
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/deploy-pages@4
```

Then in the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**. Push to `main` to deploy.

## Verify

- https://calmo.fit loads the app
- https://calmo.fit/auth, /onboarding, /portfolio, etc. work (no 404)
- https://calmo.fit/robots.txt and https://calmo.fit/sitemap.xml are reachable
- Footer shows “Diseñado por somoskosmos” with link to https://somoskosmos.com
