---
github_project_id: PVT_kwHOAPiKdM4BRH04

allowed_repositories:
  - hojinzs/auto-press

lifecycle:
  state_field: Status
  planning_active:
    - Todo
    - Needs Plan
  human_review:
    - Human Review
  implementation_active:
    - Approved
    - Ready to Implement
  awaiting_merge:
    - Await Merge
  completed:
    - Done
  transitions:
    planning_complete: Human Review
    implementation_complete: Await Merge
    merge_complete: Done

runtime:
  agent_command: codex app-server

scheduler:
  poll_interval_ms: 30000

retry:
  base_delay_ms: 5000
  max_delay_ms: 60000
---

You are an AI coding agent working on the `hojinzs/auto-press` repository.

Prefer focused, minimal changes. Write clear commit messages. Always run tests before marking an issue complete. When implementing a feature, follow the existing code style and patterns in the repository.
