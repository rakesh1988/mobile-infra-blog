# Rakesh Kashyap - Personal Blog

Welcome to the central repository for my personal blog. I am a Director of Engineering and Chapter Lead for Android, writing about Mobile Platforms, Android Architecture, Engineering Productivity, and CI/CD.

This project contains my content publishing platform built with Astro 6 and deployed to GitHub Pages. I host the canonical version of all articles on this static site and syndicate them to Medium to leverage their built-in distribution channels.

---

## 🚀 Quick Start (Local Development)

To run the blog platform locally on your machine, follow these steps:

### Prerequisites
- **Node.js**: `v22.x` or later
- **npm**: `v10.x` or later

### Command Guide
```bash
# 1. Install dependencies from the repository root
npm install

# 2. Run the development server
npm run dev

# 3. Open your browser
# Navigate to: http://localhost:4321/mobile-infra-blog/
```

- **Build for production**: `npm run build` (outputs static files to the `dist/` folder).
- **Preview production build**: `npm run preview`.

---

## 🛠️ Tech Stack & Architecture

### Blog Infrastructure

| Technology | Role | Rationale |
| :--- | :--- | :--- |
| **Astro 6** | Static Site Generator | Extremely fast, page-load performance optimization, native Markdown content collections (glob loader). |
| **GitHub Pages** | Hosting | Zero-cost, stable, global CDN, automated deployments via GitHub Actions. |
| **GitHub Actions** | CI/CD | Automatic builds and deployments to Pages upon merging to `main` branch. |
| **Plausible Analytics** | Site Analytics | Privacy-first, lightweight analytics script included in layouts. |
| **Medium** | Distribution | Syndication channel with built-in reach and audience engagement. |

---

## 📂 Project Structure

The project is structured to co-locate the website infrastructure, content posts, and demo codebase assets inside a single repository:

```text
.
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages deploy workflow (Action-driven)
├── public/                     # Static assets for the website (favicons, etc.)
├── src/                        # Astro Website Source Code
│   ├── components/             # Reusable Astro components (e.g., Analytics, PostPreview)
│   ├── content/                # Astro Content Collections (Markdown data source of truth)
│   │   └── blog/               # Markdown files for published posts and active drafts
│   ├── content.config.ts       # Schema validation rules for post frontmatter (Astro v6)
│   ├── layouts/                # Base page layouts (BaseLayout.astro)
│   ├── pages/                  # Static file routing & API endpoints (Astro pages)
│   │   ├── [...slug].astro     # Dynamic route for rendering blog posts
│   │   ├── archive.astro       # Blog archive / list page
│   │   ├── index.astro         # Site landing page (home)
│   │   └── rss.xml.js          # Automated RSS feed generation
│   └── styles/                 # Styling rules (global.css)
├── templates/                  # Post templates
│   └── post.md                 # Markdown template for writing new articles
├── astro.config.mjs            # Astro project settings (base path configured as "/mobile-infra-blog")
├── package.json                # Project dependencies and script definitions
├── CONTRIBUTING.md             # Developer workflow, lifecycle steps, and PR guidelines
└── README.md                   # This overview file
```

---

## ✍️ Publishing Workflow (Post Lifecycle)

Every piece of content follows a strict workflow from draft to distribution:

### 1. Write the Draft
Create a new Markdown file under `src/content/blog/` (e.g., `src/content/blog/my-new-post.md`). Populate the frontmatter with metadata and set `draft: true`:
```yaml
---
title: "Article Title"
description: "A 2-3 sentence summary of the post."
pubDate: 2026-07-11
tags: ["ci-cd", "android", "automation"]
draft: true
---
```

### 2. Code Review & Staging Preview
Open a Pull Request on GitHub. You can run the dev server locally (`npm run dev`) to inspect styling and layout.

### 3. Deploy (Publish to GitHub Pages)
Once approved, set `draft: false` in the frontmatter and merge to `main`. The `deploy.yml` workflow will automatically build and deploy the update. The article will go live under the canonical URL:
`https://rakesh1988.github.io/mobile-infra-blog/your-post-slug/`

### 4. Syndicate to Medium
Copy the post's text/markdown and create a new story on Medium.
- **CRUCIAL**: Go to Medium's Story Settings -> Advanced Settings -> **Canonical Link** and set it to the GitHub Pages URL. This prevents duplicate content penalties and ensures our site gets the SEO credit.
- Publish the syndicated version on Medium to reach subscribers.

---

## 🤖 AI-Friendly Guide (For AI Coding Agents)

This section contains structured context and rules for AI assistants interacting with this codebase.

### Conventions & Constraints

1.  **Base URL / Root Routing**:
    - The website is hosted under the subpath `/mobile-infra-blog`.
    - Always use the `baseUrl` constant in layouts and templates to prefix paths dynamically.
    - Do **not** hardcode root absolute URLs like `/favicon.svg` or `/hello-world/`.

2.  **Working Directories**:
    - The Astro site is at the repository **root**.
    - Commands such as `npm install`, `npm run dev`, and `npm run build` must be run from the root directory.

3.  **Blog Posts Source of Truth**:
    - All blog post content is stored under `src/content/blog/` using Markdown/MDX.
    - The schema is enforced in `src/content.config.ts`.
    - Do **not** use the root `drafts/` directory; all drafts live under the Astro content collection folder with `draft: true`.

4.  **GitHub Actions**:
    - The `.github/workflows/deploy.yml` file is configured to run at the repository root and output the static build to `dist/`. Keep this directory targeting intact.
