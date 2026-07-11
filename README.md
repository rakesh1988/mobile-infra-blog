# Mobile Infrastructure & Automation Blog Agency

Welcome to the central repository for the **Mobile Infrastructure & Automation Blog Agency**. This project contains our content publishing platform built with Astro and deployed to GitHub Pages.

We follow a hybrid publishing model: we host the canonical version of all articles on our static site (deployed to GitHub Pages) and syndicate them to Medium to leverage their built-in audience and distribution channels.

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
# Navigate to: http://localhost:4321/blog/
```

- **Build for production**: `npm run build` (outputs static files to the `dist/` folder).
- **Preview production build**: `npm run preview`.

---

## 🛠️ Tech Stack & Architecture

### Blog Infrastructure

| Technology | Role | Rationale |
| :--- | :--- | :--- |
| **Astro 5** | Static Site Generator | Extremely fast, page-load performance optimization, native Markdown/MDX content collections. |
| **GitHub Pages** | Hosting | Zero-cost, stable, global CDN, automated deployments via GitHub Actions. |
| **GitHub Actions** | CI/CD | Automatic builds and deployments to Pages upon merging to `main` branch. |
| **Plausible Analytics** | Site Analytics | Privacy-first, lightweight analytics script included in layouts. |
| **Medium** | Distribution | Syndication channel with built-in reach and audience engagement. |

---

## 📂 Project Structure

The project is structured to co-locate the website infrastructure, content posts, and demo codebase assets inside a single repository:

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages deploy workflow (Action-driven)
├── public/                     # Static assets for the website (favicons, etc.)
├── src/                        # Astro Website Source Code
│   ├── components/             # Reusable Astro components (e.g., Analytics, PostPreview)
│   ├── content/                # Astro Content Collections (Markdown data source of truth)
│   │   ├── blog/               # Markdown files for published posts and active drafts
│   │   └── config.ts           # Schema validation rules for post frontmatter
│   ├── layouts/                # Base page layouts (BaseLayout.astro)
│   ├── pages/                  # Static file routing & API endpoints (Astro pages)
│   │   ├── [...slug].astro     # Dynamic route for rendering blog posts
│   │   ├── archive.astro       # Blog archive / list page
│   │   ├── index.astro         # Site landing page (home)
│   │   └── rss.xml.js          # Automated RSS feed generation
│   └── styles/                 # Styling rules (global.css)
├── templates/                  # Post templates
│   └── post.md                 # Markdown template for writing new articles
├── astro.config.mjs            # Astro project settings (base path configured as "/blog")
├── package.json                # Project dependencies and script definitions
├── CONTRIBUTING.md             # Developer workflow, lifecycle steps, and PR guidelines
└── README.md                   # This overview file
```

---

## ✍️ Publishing Workflow (Post Lifecycle)

Every piece of content we produce follows a strict workflow from draft to distribution:

### 1. Write the Draft
Create a new Markdown file under `src/content/blog/` (e.g., `src/content/blog/my-new-post.md`). Populate the frontmatter with your metadata and set `draft: true`:
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
Open a Pull Request on GitHub. Team members will review the article for technical depth and clarity. You can run the dev server locally (`npm run dev`) to inspect styling and layout.

### 3. Deploy (Publish to GitHub Pages)
Once approved, set `draft: false` in the frontmatter and merge to `main`. The `deploy.yml` workflow will automatically build and deploy the update. The article will go live under the canonical URL:
`https://rakesh1988.github.io/blog/your-post-slug/`

### 4. Syndicate to Medium
Copy the post's text/markdown and create a new story on Medium.
- **CRUCIAL**: Go to Medium's Story Settings -> Advanced Settings -> **Canonical Link** and set it to the GitHub Pages URL. This prevents duplicate content penalties and ensures our site gets the SEO credit.
- Publish the syndicated version on Medium to reach subscribers.

---

## 🤖 AI-Friendly Guide (For AI Coding Agents)

This section contains structured context and rules for AI assistants (like Claude, Copilot, or specialized agents) interacting with this codebase.

### Conventions & Constraints

1.  **Base URL / Root Routing**:
    - The website is hosted under the subpath `/blog`.
    - Always use the `{baseUrl}` constant in layouts and templates to prefix paths dynamically.
    - `baseUrl` is defined in components as:
      `const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;`
    - Do **not** hardcode root absolute URLs like `/favicon.svg` or `/hello-world/`.

2.  **Working Directories**:
    - The Astro site is at the repository **root**.
    - Commands such as `npm install`, `npm run dev`, and `npm run build` must be run from the root directory. Do not look for or try to create a nested `blog/` folder.

3.  **Blog Posts Source of Truth**:
    - All blog post content is stored under `src/content/blog/` using Markdown/MDX.
    - The schema is enforced in `src/content/config.ts`.
    - Do **not** use the root `drafts/` directory anymore; all drafts live under the Astro content collection folder with `draft: true`.

4.  **GitHub Actions**:
    - The `.github/workflows/deploy.yml` file is configured to run at the repository root and output the static build to `dist/`. Keep this directory targeting intact.

