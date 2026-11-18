# Bot prompt review — v1

- **Use when:** You want a candidate bot prompt, a behavior review, or a versioned implementation.
- **Pass if:** The prompt has a testable output contract, stays within supplied facts/limits, and escalates when it cannot decide.
- **Expected response:** Version/changelog, candidate or findings, and an eval table.

```text
Read AGENTS.md, prompts/README.md (eval workflow), src/lib/data.ts, and the
bot config path in docs/architecture.md. Test prompt is a fixture preview.
Mode: [draft only / review / implement — pick one].
Bot: [ID, role, and task].
Version: [current → proposed and one-line rationale].
Runtime: [provider/model/revision, temperature and fallback; or unknown].
Allowed facts and actions: [context/IDs the bot can rely on, approved caps
and units, and actions that require human approval].
Output contract: [one format; exact keys and types for JSON, exact columns
for a table, or heading/list/word limit for Markdown].
Success cases: [valid, over budget, unknown ID, conflicting facts, and
instruction override input with expected format and behavior for each].

Define the contract and acceptance cases before writing the candidate.
Separate input data from instructions. Ground statements in provided IDs and
metrics; don't invent either. If facts or budgets are missing or contradictory,
return a hold/escalation in the same output format. Require approval before
mutations. Include a small normal and edge-case example if the format is
ambiguous. Use an approved live runner at the intended settings if available;
otherwise label the evaluation static/mocked and live eval not run.

Return these sections:
1. Version and changelog: prompt ID/version, settings and one change summary.
2. Candidate or findings: paste-ready prompt for draft/implement, or up to
   5 findings citing source/fixtures for review. List any edited files.
3. Eval: case | expected | observed | pass/fail/not run. Separate UI preview
   from live model results and note any blocker.
```
