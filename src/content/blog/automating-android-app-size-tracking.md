---
title: "Automating Android App Size Tracking in GitLab CI"
description: "How to track your Android app's size over time using GitLab CI, Git Worktrees, and a simple CSV file—without relying on expensive third-party tools."
pubDate: "2026-02-15"
tags: ["Android", "CI/CD", "GitLab", "App Size", "DevOps", "Engineering Productivity"]
draft: false
---

As mobile engineering organizations scale and new features are constantly merged, one of the silent killers of user acquisition is **App Size**. A larger APK or App Bundle (AAB) directly correlates to lower install conversion rates, especially in emerging markets. 

## The Story: Death by a Thousand Commits

A few years ago, while leading a major platform modernization effort, our engineering teams were shipping features at an incredible pace. Squads were autonomous, delivering business value sprint after sprint. However, there was a hidden cost to this velocity. 

Product management noticed a steady, unexplained drop in install conversion rates. After investigating the drop-off funnels, the culprit was finally found: over the course of several months, our Android app size had quietly bloated by over 40MB. 

Because we had 50+ engineers across multiple squads merging code daily, nobody noticed the incremental jumps. A new analytics SDK here, a massive unoptimized image asset there, and suddenly the app was too large for many users to download over cellular networks.

We realized that if you wait until a release candidate is cut to check your app size, you're already too late. Finding which of the 100 merged pull requests caused the bloat is a forensic nightmare. We needed continuous, automated visibility into how *every single commit* impacted our binary size, and we needed it integrated directly into our CI pipeline.

While there are many third-party services that track app metrics, they often come with hefty enterprise price tags or complex integrations. Today, I want to share a lightweight, robust approach to tracking app size entirely within **GitLab CI**, using nothing but Bash, CSV files, and `git worktree`.

## The Core Idea: Git-Backed Metrics

Instead of setting up a dedicated database or dashboarding service to store our metrics, we can use our Git repository itself as the database. 

The strategy is simple:
1. After a successful release or nightly build, calculate the size of the generated `.aab` file.
2. Check out an orphaned "metrics" branch (e.g., `metrics/app-size`) that exists solely to hold data.
3. Append the new size data to a CSV file.
4. Commit and push the changes back to GitLab automatically.

By keeping the CSV in the repository, any team member can easily pull the data into Excel, Google Sheets, or a simple Python script to generate trend graphs.

## The Implementation

Below is a stripped-down version of the GitLab CI script we use to accomplish this. 

Instead of doing a destructive `git checkout` which could interfere with the CI runner's state, we use **Git Worktrees**. A worktree allows us to check out the `metrics/app-size` branch into a temporary directory (`/tmp/metrics`) while keeping the main repository untouched.

```bash
# 1. Locate the generated App Bundle and calculate its size in MB
AAB_FILE="$(find . -maxdepth 4 -type f -name '*.aab' -print -quit)"
BYTES="$(wc -c < "${AAB_FILE}")"
AAB_SIZE_MB="$(awk -v b="${BYTES}" 'BEGIN { printf "%.2f", b/1024/1024 }')"

# 2. Gather metadata
APP_NAME="$(basename "${AAB_FILE}")"
COMMIT_SHORT="${CI_COMMIT_SHORT_SHA}"
BUILD_DATE="$(date -u +'%Y-%m-%d %H:%M:%S')"

# 3. Setup Git Worktree to cleanly checkout the metrics branch
METRICS_BRANCH="metrics/app-size"
METRICS_CSV_PATH="metrics/android_appsize.csv"
WT=/tmp/metrics

# Remove old worktree if it exists
if [ -d "$WT" ]; then git worktree remove --force "$WT" || rm -rf "$WT"; fi

git fetch origin +refs/heads/*:refs/remotes/origin/*

# Check if the branch exists remotely, otherwise create it
if git show-ref --verify --quiet "refs/remotes/origin/${METRICS_BRANCH}"; then
  git worktree add --no-checkout "$WT" "origin/${METRICS_BRANCH}"
  git -C "$WT" checkout -B "${METRICS_BRANCH}" "origin/${METRICS_BRANCH}"
else
  git worktree add --no-checkout -b "${METRICS_BRANCH}" "$WT" HEAD
  git -C "$WT" checkout "${METRICS_BRANCH}"
fi

cd "$WT"
mkdir -p "$(dirname "${METRICS_CSV_PATH}")"

# 4. Initialize CSV headers if the file is new
[ -s "${METRICS_CSV_PATH}" ] || echo "datetime_utc,app_name,size_mb,commit" > "${METRICS_CSV_PATH}"

# 5. Append the new data
printf '%s,%s,%s,%s\n' "${BUILD_DATE}" "${APP_NAME}" "${AAB_SIZE_MB}" "${COMMIT_SHORT}" >> "${METRICS_CSV_PATH}"

# 6. Commit and Push back to GitLab using the CI Bot token
git config user.email "ci-bot@yourcompany.com"
git config user.name  "CI Bot"
git add "${METRICS_CSV_PATH}"
git diff --cached --quiet || git commit -m "Metrics Update: ${AAB_SIZE_MB}MB (${COMMIT_SHORT})"
git push "https://gitlab-ci-token:${GITLAB_TOKEN}@${CI_SERVER_HOST}/${CI_PROJECT_PATH}.git" HEAD:"${METRICS_BRANCH}"
```

## Why Git Worktrees?

You might wonder why we use `git worktree add` instead of a standard `git clone` or `git checkout`. 

In a CI environment, runners heavily optimize how they fetch and cache repositories. Performing a `git checkout` to a completely different branch in the middle of a CI job can corrupt the workspace for subsequent steps (like archiving artifacts or uploading test results). 

`git worktree` allows us to check out the metrics branch into an isolated `/tmp/` directory, commit to it, and push it, all without ever modifying the `HEAD` or working tree of the actual CI build directory.

## Pruning Old Data

If you run this script on every commit, your CSV file will grow infinitely. To prevent the repository from bloating, we added a small cleanup script using `awk` that removes any CSV rows older than two years right before committing. 

```bash
# Calculate cutoff date (2 years ago)
Y=$(date -u +%Y); M=$(date -u +%m); D=$(date -u +%d)
CUTOFF=$(printf "%04d-%02d-%02d" $((Y-2)) "$M" "$D")

# Filter out old rows while keeping the header
awk -F, -v c="$CUTOFF" 'NR==1{print;next} substr($1,1,10)>=c' "${METRICS_CSV_PATH}" | sort -t, -k1,1r > "${METRICS_CSV_PATH}.tmp"
mv "${METRICS_CSV_PATH}.tmp" "${METRICS_CSV_PATH}"
```

## Conclusion

By leveraging built-in Git tools and a few lines of bash, we created a highly resilient, zero-cost app size tracking system. Engineering squads can now attach simple visualization scripts to this CSV branch to generate charts for management, or set up CI alerts that fail the build if a pull request increases the app size by more than 1MB. 

This is what engineering productivity looks like at scale: using simple, composable tools to solve organizational bottlenecks without introducing unnecessary vendor lock-in.
