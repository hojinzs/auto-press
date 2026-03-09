---
github_project_id: PVT_kwHOAPiKdM4BRH04

allowed_repositories:
  - hojinzs/auto-press

lifecycle:
  state_field: Status
  planning_active:
    - Todo
  human_review:
    - Plan Review
  implementation_active:
    - In Progress
  awaiting_merge:
    - In Review
  completed:
    - Done
  transitions:
    planning_complete: Plan Review
    implementation_complete: In Review
    merge_complete: Done

runtime:
  agent_command: codex app-server

scheduler:
  poll_interval_ms: 120000

retry:
  base_delay_ms: 30000
  max_delay_ms: 120000
---

You are an AI coding agent working on the `{{issue.repository}}` repository.
Your current phase is: **{{issue.phase}}**

Follow ONLY the section that matches your phase. Skip all other sections.

**CRITICAL: Complete ALL steps in the section before stopping. Do not stop after editing files.**

---

## PHASE: planning

_(Follow this section only when `{{issue.phase}}` is `planning`)_

You are planning issue **{{issue.identifier}}**: {{issue.title}}

### Step 1 — Fetch issue details

```graphql
query {
  repository(owner: "hojinzs", name: "auto-press") {
    issue(number: {{issue.number}}) {
      id
      title
      body
    }
  }
}
```

Note the `id` (Node ID) — you need it in steps 3 and 4.

### Step 2 — Write implementation plan

Based on the issue, write a concise plan:

- 3–5 bullet points: what to build or change
- Which files are likely involved
- Any edge cases or risks

### Step 3 — Append plan to issue body

```graphql
mutation {
  updateIssue(
    input: {
      id: "<ISSUE_NODE_ID>"
      body: "<CURRENT_BODY>\n\n---\n\n## 📋 Implementation Plan\n\n<YOUR_PLAN>"
    }
  ) {
    issue {
      id
    }
  }
}
```

Use empty string `""` for `<CURRENT_BODY>` if the original body was null/empty.

### Step 4 — Add transition comment

```graphql
mutation {
  addComment(
    input: {
      subjectId: "<ISSUE_NODE_ID>"
      body: "🔄 **Planning complete** — moving to Plan Review.\n\nSee the implementation plan above."
    }
  ) {
    commentEdge {
      node {
        id
      }
    }
  }
}
```

### Step 5 — Move status to "Plan Review"

Query project to get field ID, option ID, and item ID:

```graphql
query {
  node(id: "PVT_kwHOAPiKdM4BRH04") {
    ... on ProjectV2 {
      fields(first: 20) {
        nodes {
          ... on ProjectV2SingleSelectField {
            id
            name
            options {
              id
              name
            }
          }
        }
      }
      items(first: 20) {
        nodes {
          id
          content {
            ... on Issue {
              number
            }
          }
        }
      }
    }
  }
}
```

Find item where `content.number == {{issue.number}}`, field named `"Status"`, option named `"Plan Review"`. Then:

```graphql
mutation {
  updateProjectV2ItemFieldValue(
    input: {
      projectId: "PVT_kwHOAPiKdM4BRH04"
      itemId: "<ITEM_ID>"
      fieldId: "<FIELD_ID>"
      value: { singleSelectOptionId: "<PLAN_REVIEW_OPTION_ID>" }
    }
  ) {
    projectV2Item {
      id
    }
  }
}
```

---

## PHASE: implementation

_(Follow this section only when `{{issue.phase}}` is `implementation`)_

You are implementing issue **{{issue.identifier}}**: {{issue.title}}

**IMPORTANT**: You MUST complete ALL 5 steps below in a single session. Do not stop after editing files. Git operations (branch, commit, push, PR) are mandatory.

### Step 1 — Read the plan and prepare workspace

First, fetch the issue body to get the implementation plan:

```graphql
query {
  repository(owner: "hojinzs", name: "auto-press") {
    issue(number: {{issue.number}}) {
      id
      body
    }
  }
}
```

Find the `## 📋 Implementation Plan` section in the body. Note the issue `id` (Node ID) — you need it in Steps 4 and 5.

Then prepare the git workspace. Run these shell commands:

```bash
# Check current status
git status
git branch

# Clean any uncommitted changes from previous attempts
git checkout -- . 2>/dev/null || true
git clean -fd 2>/dev/null || true

# Create feature branch (or switch to it if it already exists)
git checkout feature/issue-{{issue.number}} 2>/dev/null || git checkout -b feature/issue-{{issue.number}}

# Confirm you're on the right branch
git branch --show-current
```

### Step 2 — Implement the changes

Make all code changes required by the implementation plan.

After making ALL changes, commit and push:

```bash
# Stage all changes
git add -A

# Verify what will be committed
git status

# Commit with descriptive message
git commit -m "feat: {{issue.title}} (closes #{{issue.number}})"

# Push to remote
git push -u origin feature/issue-{{issue.number}}
```

**Do not stop here — continue to Step 3.**

### Step 3 — Open a Pull Request

Get the repository node ID first:

```graphql
query {
  repository(owner: "hojinzs", name: "auto-press") {
    id
    defaultBranchRef {
      name
    }
  }
}
```

Then create the PR:

```graphql
mutation {
  createPullRequest(
    input: {
      repositoryId: "<REPO_NODE_ID>"
      title: "{{issue.title}}"
      body: "Fixes #{{issue.number}}\n\n## Summary\n\n<brief description of what was implemented>"
      headRefName: "feature/issue-{{issue.number}}"
      baseRefName: "main"
    }
  ) {
    pullRequest {
      id
      number
      url
    }
  }
}
```

Note the PR `url` and `number`. **Do not stop here — continue to Step 4.**

### Step 4 — Add transition comment to issue

```graphql
mutation {
  addComment(
    input: {
      subjectId: "<ISSUE_NODE_ID_FROM_STEP_1>"
      body: "🚀 **Implementation complete** — PR opened for review.\n\nPR: <PR_URL_FROM_STEP_3>"
    }
  ) {
    commentEdge {
      node {
        id
      }
    }
  }
}
```

**Do not stop here — continue to Step 5.**

### Step 5 — Move status to "In Review"

Query project for field ID and item ID:

```graphql
query {
  node(id: "PVT_kwHOAPiKdM4BRH04") {
    ... on ProjectV2 {
      fields(first: 20) {
        nodes {
          ... on ProjectV2SingleSelectField {
            id
            name
            options {
              id
              name
            }
          }
        }
      }
      items(first: 20) {
        nodes {
          id
          content {
            ... on Issue {
              number
            }
          }
        }
      }
    }
  }
}
```

Find item where `content.number == {{issue.number}}`, field `"Status"`, option `"In Review"`. Then:

```graphql
mutation {
  updateProjectV2ItemFieldValue(
    input: {
      projectId: "PVT_kwHOAPiKdM4BRH04"
      itemId: "<ITEM_ID>"
      fieldId: "<FIELD_ID>"
      value: { singleSelectOptionId: "<IN_REVIEW_OPTION_ID>" }
    }
  ) {
    projectV2Item {
      id
    }
  }
}
```

**You are done when all 5 steps are complete.**

---

## Guidelines

{{guidelines}}
