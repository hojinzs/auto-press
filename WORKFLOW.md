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
  poll_interval_ms: 30000

retry:
  base_delay_ms: 5000
  max_delay_ms: 60000
---

You are an AI coding agent working on the `{{issue.repository}}` repository.

## Current task

Planning phase for issue **{{issue.identifier}}**: {{issue.title}}

## Instructions

Follow these steps in order. Do not skip any step.

---

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

Note the `id` (Node ID) — you will need it in later steps.

---

### Step 2 — Write an implementation plan

Based on the issue title and body, write a concise implementation plan:
- 3–5 bullet points describing what needs to be built or changed
- Which files are likely involved
- Any edge cases or risks

---

### Step 3 — Append the plan to the issue body

Take the current `body` from Step 1. Append the plan section below it and update the issue:

```graphql
mutation {
  updateIssue(input: {
    id: "<ISSUE_NODE_ID_FROM_STEP_1>"
    body: "<CURRENT_BODY_FROM_STEP_1>\n\n---\n\n## 📋 Implementation Plan\n\n<YOUR_PLAN_HERE>"
  }) {
    issue { id }
  }
}
```

Replace `<ISSUE_NODE_ID_FROM_STEP_1>` with the `id` field from Step 1.
Replace `<CURRENT_BODY_FROM_STEP_1>` with the exact existing body (empty string `""` if body was null or empty).
Replace `<YOUR_PLAN_HERE>` with your plan from Step 2.

---

### Step 4 — Add a transition comment

Post a comment on the issue announcing that planning is complete:

```graphql
mutation {
  addComment(input: {
    subjectId: "<ISSUE_NODE_ID_FROM_STEP_1>"
    body: "🔄 **Planning complete** — moving to Plan Review.\n\nSee the implementation plan above."
  }) {
    commentEdge { node { id } }
  }
}
```

---

### Step 5 — Move status to "Plan Review" (REQUIRED)

First, query the project to get the Status field ID, the "Plan Review" option ID, and this issue's project item ID:

```graphql
query {
  node(id: "PVT_kwHOAPiKdM4BRH04") {
    ... on ProjectV2 {
      fields(first: 20) {
        nodes {
          ... on ProjectV2SingleSelectField {
            id
            name
            options { id name }
          }
        }
      }
      items(first: 20) {
        nodes {
          id
          content {
            ... on Issue { number }
          }
        }
      }
    }
  }
}
```

Find:
- The item where `content.number == {{issue.number}}` → its `id` is the `itemId`
- The field named `"Status"` → its `id` is the `fieldId`
- The option named `"Plan Review"` inside that field → its `id` is the `optionId`

Then run the mutation:

```graphql
mutation {
  updateProjectV2ItemFieldValue(input: {
    projectId: "PVT_kwHOAPiKdM4BRH04"
    itemId: "<ITEM_ID>"
    fieldId: "<FIELD_ID>"
    value: { singleSelectOptionId: "<PLAN_REVIEW_OPTION_ID>" }
  }) {
    projectV2Item { id }
  }
}
```

All 5 steps must be completed before you finish.

## Guidelines

{{guidelines}}
