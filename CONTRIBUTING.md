# Contributing & Publishing Workflow

## Platform & Strategy

We use a Medium-first publishing strategy:
1. **Medium**: Our primary publishing platform. All articles are published directly on Medium to leverage its platform distribution and built-in audience.
2. **GitHub**: Used for draft management, team review, and automated frontmatter checks. It also hosts our demo codebase (e.g., the `smartnotes` Android project). We do not deploy a self-hosted Astro site.

---

## Post Lifecycle

```
Draft (local/PR) → CI Checks & Review → Merge to main → Publish to Medium
```

### 1. Writing a Draft
Write your post in the `drafts/` directory as Markdown (`.md`).
Create a new file using the template in `templates/post.md` and populate the frontmatter:

```yaml
---
title: "Your Post Title"
description: "A concise 2-3 sentence summary"
publishDate: 2026-07-11
tags: ["mobile", "ci-cd", "android"]
status: draft
---
```

### 2. Review
Open a Pull Request against `main`. 
- The CI workflow (`ci.yml`) automatically checks that your draft in `drafts/` starts with a valid YAML frontmatter block.
- The reviewer (CTO or CEO) reviews the post for technical accuracy, depth, and engineering credibility.

### 3. Merge
Once the PR is approved and CI checks pass, merge the PR to `main`. This indicates the draft is finalized and approved for publishing.

### 4. Publish to Medium
After merging to `main`:
1. Copy the Markdown content into Medium's editor.
2. Format the post (e.g., code snippets, headers, images) on Medium.
3. Since Medium is the primary publisher, no external canonical URL is required.
4. Add relevant tags and publish the post on Medium.

---

## Repository Structure

```
.
├── .github/workflows/      # CI workflows (frontmatter check)
├── drafts/                 # Blog post drafts (Markdown)
├── public/                 # Static assets
├── src/                    # Astro website source code (local preview if needed)
├── templates/              # Standard post templates
├── smartnotes/             # Demo Android app code
├── package.json            # Node dependencies and scripts
└── CONTRIBUTING.md         # This workflow documentation
```

---

## Technical Setup (Local Preview)

Writers can optionally run the Astro site locally to preview markdown rendering, although we publish directly to Medium.

### Quick Start
```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```
