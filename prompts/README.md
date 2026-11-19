# Prompt library

Copy one template, fill in its brackets, and point the agent at `AGENTS.md`. Link the relevant code or screenshot instead of pasting the entire repo. If you're comparing approaches, say **plan-only**; if you want a patch and tests, say **implement**.

| Use case | Current version | Changelog |
| --- | --- | --- |
| Implement, investigate, or review a scoped change | [Agent task v1](agent-task.v1.md) | v1: mode, reproduction, acceptance criteria, and evidence-based handoff. |
| Change or review 3D art, VFX, shaders, or frame time | [Rendering change v1](rendering-change.v1.md) | v1: visual target, per-asset budgets, comparison protocol, and fallback. |
| Author or review a Simplayz bot prompt | [Bot prompt review v1](bot-prompt-review.v1.md) | v1: output contract, grounded inputs, versioning, and evaluation cases. |
| Prepare Simplayz for Vercel with Turso | [Vercel + Turso deployment v1](vercel-turso-deployment.v1.md) | v1: environment selection, safe migration, and deployment checks. |

When a template's instructions or output contract change, add a new versioned file (e.g. `agent-task.v2.md`), keep the prior file, and record what changed in this table. Template versions are separate from `Bot.promptVersion`, the local UI label bumped when saved prompt text changes.

## Filled example: a scoped AI management fix

```text
Read AGENTS.md. Mode: implement. Task template: agent-task v1.
Goal: Make the mock "Test prompt" sample match the chosen output format.
Repro: At /user/alex/ai/management, open Vertex → Configure, choose Table,
then click Test prompt. The preview says Table, but its body is still JSON.
Start in src/components/BotConfigModal.tsx (testOutputs and responseFormats).
Acceptance:
- Table previews a header, separator, and at least one row.
- Structured JSON previews one parseable object with no surrounding prose.
- Markdown brief previews a numbered decision brief.
- Cancel leaves saved config unchanged. Save & deploy still persists the format.
Out of scope: live provider calls, changing seed prompts, redesigning the modal.
Verify with npm run check, npm run smoke, and the three format selections above.
Return: outcome, changed files, verification results, and blockers.
```

## Evaluating bot prompt revisions

1. Log the prompt version, input fixture IDs, expected output shape and invariants **before** running it. Add one normal and one edge-case example for ambiguous behavior. Use the same fixtures for old and new text.
2. Include a valid case, a limit breach, an unknown ID/missing fact, conflicting inputs, and input that tries to override the rules. Use synthetic or approved input data. Assert format separately from semantic checks (grounds claims, respects caps, escalates when necessary, doesn't apply changes without approval).
3. When an approved live runner exists, run both versions on the exact model/revision, temperature, and settings intended for production, including the fallback route if it changes. Repeat each case (start with three runs) to catch variance. Log pass counts, one representative failure, and cost/latency if relevant. If model or settings are unknown, ask or mark that comparison blocked.
4. This checkout has no live runner. Use static validation and the mocked UI flow where applicable, but record **live model eval: not run**. A sample fixture or a valid JSON parse is not evidence of reliable live output.
