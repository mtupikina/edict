# Agent instructions (edict)

This directory is the **edict** Angular app (its own git repo).

## Before coding

1. Read **workspace** `.cursor/rules/` (start with `apply-project-rules.mdc`, `two-separate-repos.mdc`).
2. Read **all** rules in **`edict/.cursor/rules/`** (including `agent-workflow.mdc`).

## Cursor user rules (recommended)

Add a global user-rule line such as: *In the edict-admin-workspace, before code edits read root + project `.cursor/rules/` and obey them over speed; include **Rules read** in the first substantive code reply per `apply-project-rules.mdc`.*

## Commands

Run npm/git **from `edict/`**, never from the monorepo-style workspace root alone.
