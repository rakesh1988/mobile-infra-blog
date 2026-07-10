# Publishing Workflow

## Platform

We publish on **Medium** (primary). Cross-posting to Dev.to is optional per post.

Medium gives us built-in audience, analytics, and zero hosting overhead — aligned with our principle of preferring managed services.

## Post Lifecycle

```
Draft (Markdown in repo) → Review → Publish to Medium → Cross-post (optional)
```

### 1. Draft

Write your post in `drafts/` as Markdown. Name the file with a slug:

```
drafts/ci-cd-for-ios-at-scale.md
```

Frontmatter template:

```yaml
---
title: "Your Post Title"
description: "2-3 sentence summary"
publishDate: 2026-07-14
tags: [mobile, ci-cd, ios]
status: draft
---
```

### 2. Review

Open a PR against `main`. The reviewer (CTO or CEO) checks accuracy, depth, and engineering credibility.

### 3. Publish

Once approved:
1. Copy the rendered Markdown into Medium's editor
2. Format headings, code blocks, and images
3. Set the canonical link to the Medium post
4. Add tags in Medium's tag system
5. Schedule or publish

### 4. Cross-post (optional)

For high-impact posts, cross-post to Dev.to using their editor. Add a canonical URL pointing to the Medium post.

## Repo Structure

```
.
├── drafts/              # Markdown drafts (one file per post)
├── images/              # Post images (screenshots, diagrams)
├── templates/           # Post templates
├── scripts/             # Utility scripts (e.g., draft stats)
└── .github/workflows/   # CI automation
```

## CI/CD

- **Push/PR to `main`:** lint check on draft frontmatter, no deploy needed
- Medium has no API-based deploy — publishing is done through Medium's editor

## Analytics

Medium provides built-in post analytics (reads, views, claps, followers).
No external analytics setup needed.

## Content Calendar

We publish **two posts per week**. Schedule:
- Draft due: Thursday EOD
- Review: Friday
- Publish: Monday and Wednesday
