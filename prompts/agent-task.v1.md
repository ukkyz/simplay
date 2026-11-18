# Agent task — v1

- **Use when:** You want an implementation, a plan, or a focused review.
- **Pass if:** The result can be checked against observable criteria and doesn't expand scope.
- **Expected response:** Outcome, work, verification, and open items, in that order.

```text
Read AGENTS.md. Use only the linked guide(s) relevant to this task.
Mode: [implement / plan-only / review — pick one].

Outcome: [one user-visible behavior or deliverable].
Repro or reference: [seeded route, fixture IDs, steps, actual vs. expected;
link a screenshot or trace if relevant].
Start here: [likely file(s) or component(s), optional].
Constraints: [what must remain unchanged, target viewport/device if relevant].
Out of scope: [adjacent work not requested].

Acceptance:
1. [Normal case with an observable result.]
2. [Failure/edge case and expected fallback.]
3. [Regression check: reload, navigation, keyboard, or baseline budget as applicable.]

Implementation mode: make the smallest patch that meets the criteria. Run
npm run check and the relevant browser checks. Plan-only/review: don't edit;
prioritize steps or findings and cite source evidence. Ask one targeted question
only if missing information would change the outcome or constraints.

Return these headings:
- Outcome: 1–2 sentences stating the result or recommendation.
- Work: up to 5 bullets with affected files, proposed steps, or findings.
- Verification: commands and routes tried with results; mark not-run checks.
- Open items: assumptions, blockers, or "None."
```
