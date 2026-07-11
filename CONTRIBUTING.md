# Contributing & Publishing Workflow

## Platform & Strategy

We use a hybrid publishing strategy to maximize reach and ownership:
1. **GitHub Pages (Astro)**: Our primary home. Owns the brand, SEO, and permanent archive.
2. **Medium**: Distribution channel. Used to reach a wider audience and drive traffic back to our site.

---

## Post Lifecycle

```
Draft (local/PR) → Review → Publish to GitHub Pages → Cross-post to Medium
```

### 1. Writing a Draft
Write your post in `src/content/blog/` as Markdown (`.md`) or MDX (`.mdx`).
Set the `draft` flag to `true` in the frontmatter:

```yaml
---
title: "Your Post Title"
description: "A concise 2-3 sentence summary"
pubDate: 2026-07-11
tags: ["mobile", "ci-cd", "android"]
draft: true
---
```

Preview your changes locally:
```bash
npm run dev
```

### 2. Review
Open a Pull Request against `main`. The reviewer (CTO or CEO) checks accuracy, depth, and engineering credibility.

### 3. Primary Publish (GitHub Pages)
Once approved:
1. Set `draft: false` in the post's frontmatter.
2. Merge the PR to `main`.
3. The GitHub Actions pipeline (`deploy.yml`) builds the site and deploys it automatically.

### 4. Distribution (Medium)
After the live post is deployed:
1. Copy the content into Medium's editor.
2. **Crucial**: Set the "Canonical URL" in Medium settings to the URL of the post on our GitHub Pages site (e.g., `https://rakesh1988.github.io/blog/hello-world/`). This ensures Google attributes original authorship to our domain.
3. Add tags in Medium and publish.

---

## Repository Structure

```
.
├── .github/workflows/      # GitHub Actions deploy workflow
├── public/                 # Static assets (images, favicons)
├── src/
│   ├── components/         # Reusable Astro components
│   ├── content/
│   │   ├── blog/           # Blog posts (Source of Truth)
│   │   └── config.ts       # Post frontmatter schema definition
│   ├── layouts/            # Page layouts
│   ├── pages/              # Astro routes & pages
│   └── styles/             # Global styling
├── templates/              # Standard post templates
├── smartnotes/             # Demo Android app code
├── astro.config.mjs        # Astro configuration (base path: /blog)
├── package.json            # Node dependencies and scripts
└── CONTRIBUTING.md         # This workflow documentation
```

---

## Technical Setup

### Prerequisites
- Node.js 22+
- npm 10+

### Quick Start
```bash
# Install dependencies
npm install

# Start local development server (http://localhost:4321/blog/)
npm run dev

# Build the static site locally
npm run build

# Preview the local build
npm run preview
```
