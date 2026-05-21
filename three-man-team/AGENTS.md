# Three Man Team Project Instructions

Use these instructions when this project is being run with the Three Man Team workflow.

## Session Start

1. Check `handoff/SESSION-CHECKPOINT.md`.
2. If the checkpoint clearly describes the active state, use it and avoid rereading older files.
3. If the checkpoint is empty or stale, read `handoff/BUILD-LOG.md`, then `handoff/ARCHITECT-BRIEF.md`.
4. Load the role file required by the current phase:
   - `ARCHITECT.md` for planning, scope, decisions, deploy or closeout.
   - `BUILDER.md` for implementation.
   - `REVIEWER.md` for review.

## Always Active Rules

- Trust the handoff files over chat memory when they conflict.
- Grep before reading large files.
- Read only the files needed for the current phase.
- Do not reread files already in context unless they changed.
- Keep one active step at a time.
- Put out-of-scope findings in `handoff/BUILD-LOG.md` under Known Gaps.
- Do not deploy, publish, or make irreversible changes without explicit user approval.

## Role Flow

```text
Architect brief
-> Builder implementation
-> Builder review request
-> Reviewer feedback
-> Builder fixes if needed
-> Architect closeout
```

Run these as phases in the current Codex session unless the user explicitly asks for parallel subagents.
