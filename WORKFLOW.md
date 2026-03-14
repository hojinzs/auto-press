---
tracker:
  kind: github-project
  project_id: PVT_kwHOAPiKdM4BRH04
  state_field: Status
  active_states:
    - Todo
    - In Progress
  terminal_states:
    - Done
  blocker_check_states:
    - Todo
    - In Progress
polling:
  interval_ms: 30000
workspace:
  root: .runtime/symphony-workspaces
hooks:
  after_create: hooks/after_create.sh
  before_run: null
  after_run: null
  before_remove: null
  timeout_ms: 60000
agent:
  max_concurrent_agents: 10
  max_retry_backoff_ms: 30000
  retry_base_delay_ms: 1000
  max_turns: 20
codex:
  command: codex app-server
  read_timeout_ms: 5000
  turn_timeout_ms: 3600000
  stall_timeout_ms: 300000
---

## Status Map

| Status | Role | Meaning | Agent Action |
| ------ | ---- | ------- | ------------ |
| Draft | wait | 이슈가 아직 실행 가능한 수준으로 정리되지 않았거나 우선순위에 올리지 않은 상태다. | 작업을 시작하지 않는다. 정보 부족을 발견하더라도 임의 구현이나 임의 전이는 하지 않고 종료한다. |
| Todo | active | 구현 착수 전 계획 수립과 범위 확정이 필요한 상태다. | 이슈와 코멘트를 읽고 한국어 작업 메모를 만들거나 갱신한 뒤, 구현 계획과 검증 방안을 정리하고 `Plan Review`로 전이한다. |
| Plan Review | wait | 사람이 구현 계획, 범위, 우선순위를 검토하는 상태다. | 코드를 수정하지 않는다. 명시적 승인 또는 보완 지시가 있기 전까지 대기한다. |
| In Progress | active | 승인된 계획에 따라 구현하거나 리뷰 반영을 수행하는 상태다. | 코드를 수정하고 검증을 완료한 뒤 PR을 생성 또는 갱신하고 `In Review`로 전이한다. |
| In Review | wait | 사람이 PR을 리뷰하거나 머지 여부를 결정하는 상태다. | 추가 작업 없이 대기한다. 변경 요청이 오면 `In Progress`로, PR이 머지되면 `Done`으로 전이한다. |
| Done | terminal | 요구사항이 완료되고 검증 가능한 산출물이 반영된 상태다. | 즉시 종료한다. |

## Default Posture

1. This is an unattended orchestration session. Do not ask humans for follow-up tasks unless execution would be unsafe without missing facts.
2. Use `gh-project` for project status changes and issue comments, and use `commit`, `push`, `pull`, and `land` when their workflows apply.
3. Never edit the issue body for planning or progress tracking. Use issue comments only.
4. Every project status transition requires a separate issue comment in Korean. Updating the workpad comment does not replace that transition comment.
5. If you detect a blocker that prevents safe execution, leave a Korean issue comment describing the blocker and stop. Do not invent a new state.
6. If the issue is already in a terminal state, do nothing and exit.
7. Keep commits logically scoped and avoid leaving the branch or PR in a broken state.

## Related Skills

- **gh-project**: change project status and create or update issue comments
- **commit**: create logical commits with clean scope
- **push**: publish local commits to the remote branch
- **pull**: refresh the branch from the latest remote base when needed
- **land**: merge an approved PR and complete the issue lifecycle

## Status Transition Rules

- `Draft -> Todo`: only when the issue is actionable and ready for agent triage. The agent should not perform this transition on its own.
- `Todo -> Plan Review`: allowed only after the workpad is updated and the implementation plan, acceptance criteria, affected areas, and validation commands are documented.
- `Plan Review -> In Progress`: allowed only after explicit approval or concrete feedback in issue or PR comments that makes the plan executable without ambiguity.
- `In Progress -> In Review`: allowed only after the scoped implementation is complete, relevant validation has run, and a PR exists or has been updated for review.
- `In Review -> In Progress`: allowed only when review changes are requested or the PR can no longer be merged without further implementation.
- `In Review -> Done`: allowed only after the PR is merged, or the issue is otherwise completed without a PR and the completion bar is satisfied.
- Invalid transitions such as `Draft -> In Progress`, `Todo -> Done`, `Plan Review -> Done`, `In Progress -> Done`, or any transition out of `Done` are prohibited. If such a request appears, leave a Korean issue comment explaining why it is invalid and stop.

## Transition Comment Policy

Whenever you change project status, create an issue comment in Korean immediately before the status update. Each transition comment must include:

- the previous status and next status
- the reason for the transition
- concrete evidence such as plan readiness, PR URL, review feedback summary, or validation results
- blockers or risks when relevant

Use this structure:

```md
## 상태 전이

- 이전 상태: `<FROM>`
- 다음 상태: `<TO>`
- 사유: <한 줄 요약>
- 근거:
  - <증거 1>
  - <증거 2>
```

Use these transition-specific expectations:

- `Todo -> Plan Review`: summarize the implementation plan, affected files or systems, and planned validation commands.
- `Plan Review -> In Progress`: reference the approval or clarification comment that unlocked implementation.
- `In Progress -> In Review`: include the PR URL, key implementation summary, and executed validation commands with outcomes.
- `In Review -> In Progress`: summarize requested changes or merge blockers that require more implementation.
- `In Review -> Done`: include the merged PR URL or completion evidence and final validation status.

## Step 0: Determine current state and route

Check `{{issue.state}}` and follow the matching route:

- `Draft`: do not work. Exit without changes.
- `Todo`: proceed to Step 1.
- `Plan Review`: inspect recent comments. If there is explicit approval or concrete feedback that removes ambiguity, leave a Korean transition comment, move to `In Progress`, and continue with Step 2. Otherwise exit.
- `In Progress`: proceed to Step 2.
- `In Review`: inspect the linked PR and review comments. If changes are requested, leave a Korean transition comment, move to `In Progress`, and continue with Step 2. If the PR is merged and the completion bar is satisfied, leave a Korean transition comment, move to `Done`, and exit. Otherwise exit.
- `Done`: exit immediately.
- Any other state: leave a Korean issue comment noting that the state is unsupported, then exit.

## Step 1: Todo planning flow

1. Read the issue description and all issue comments before deciding on scope.
2. Create or update a Korean workpad comment using the template below.
3. Write a concise implementation plan with 3 to 5 concrete tasks.
4. Record explicit acceptance criteria and the exact validation commands you expect to run.
5. If required information is missing, leave a Korean blocker comment and stop without changing status.
6. Once the plan is ready, leave a Korean transition comment and move the issue to `Plan Review`.

## Step 2: In Progress execution flow

1. Re-read the issue, the approved plan, and any PR or review comments before editing code.
2. Continue an existing branch and PR if they already exist; otherwise create a feature branch.
3. Implement only the scoped work for `{{issue.identifier}}`.
4. Add or update tests when behavior changes.
5. Run the relevant validation commands and record the outcome in the workpad comment.
6. Create or update the PR with a concise summary tied to the issue.
7. Leave a Korean transition comment and move the issue to `In Review`.

## Step 3: In Review handling

1. While waiting for review, do not make speculative changes.
2. If review comments request code changes, summarize the requested work in a Korean transition comment, move to `In Progress`, and return to Step 2.
3. If the PR is merged and the completion bar is satisfied, leave a Korean transition comment and move to `Done`.
4. If the PR is closed without merge, leave a Korean issue comment explaining the situation and stop without guessing the next status.

## Completion Bar

All of the following must be true before treating the issue as ready for `In Review` or `Done`:

- [ ] The scoped requirements in `{{issue.identifier}}` are implemented.
- [ ] Relevant automated or manual validation has been run and recorded.
- [ ] A PR exists for code changes unless the task is documentation-only or otherwise does not require a PR.
- [ ] The workpad comment reflects the latest plan, validation, and risks.
- [ ] The required Korean transition comment for the next state is posted.

## Guardrails

- Do not modify the issue body for plans, checklists, or progress.
- Do not skip the Korean transition comment when changing status.
- Do not treat a workpad update as a substitute for a transition comment.
- Do not transition to `Done` until merge or equivalent completion evidence exists.
- Do not expand scope with opportunistic refactors unless they are required to complete the issue safely.
- Do not leave unresolved review feedback unaddressed when returning to `In Review`.

## Workpad Template

Create or update a single issue comment in Korean with this structure:

```md
## 작업 메모 - {{issue.identifier}}

**현재 상태**: {{issue.state}}
**브랜치**: <브랜치 이름 또는 없음>
**PR**: <PR URL 또는 없음>

### 계획

- [ ] 작업 항목 1
- [ ] 작업 항목 2

### 수용 기준

- [ ] 기준 1
- [ ] 기준 2

### 검증

- [ ] `<검증 명령어>`

### 진행 로그

- <YYYY-MM-DD HH:MM TZ>: <진행 내용>

### 리스크 및 메모

- 없음
```
