# AI Agent Master Rules & Guidelines

This file defines the highest-priority project rules for AI agents working in this repository.

## 1. Mandatory Workflow Gate

For every user request, first decide whether `.agent/workflows/` contains a relevant workflow.

You must read the relevant workflow before answering or running commands for any request involving:

- git, commit, push, branch, merge, or pull request
- release, version bump, build number, runtime version, EAS Build, or EAS Update
- deploy, update, publish, retrospective, or project automation

When a workflow applies:

1. Read the workflow file before giving commands or explanations.
2. Follow the workflow over generic agent defaults.
3. Mention the workflow file used in the response.
4. Do not answer from memory if a project workflow defines the command format.
5. Do not run `git commit` or `git push` unless the user explicitly asks you to execute it.

Known workflow files:

- `.agent/workflows/pushAndCommit.md`
- `.agent/workflows/release-versioning.md`
- `.agent/workflows/eas-update.md`
- `.agent/workflows/retrospective.md`

## 2. Workflow Map

| Task type | Required workflow |
| :--- | :--- |
| Push or commit | `.agent/workflows/pushAndCommit.md` |
| Version bump or release versioning | `.agent/workflows/release-versioning.md` |
| EAS Update or CodePush-style update | `.agent/workflows/eas-update.md` |
| Project retrospective | `.agent/workflows/retrospective.md` |

## 3. Communication Rules

- Prefer Korean for explanations, summaries, and command suggestions.
- Preserve Korean text carefully. Do not rewrite, normalize, or replace Korean content unless the task requires it, and avoid edits that could introduce mojibake or encoding damage.
- Use Conventional Commits for commit messages.
- Keep command suggestions copy-ready in Markdown code blocks.
- Explain which workflow was used when a workflow applies.

## 4. Safety Guardrails

- Do not run destructive commands such as `rm`, `git reset`, `git push -f`, or `npm publish` without explicit user approval.
- If native files change, especially `android/`, `ios/`, `app.json`, `app.config.js`, or `package.json`, clearly warn that a native build or EAS build/update may be required.
- For commit and push requests, show `git status` first or summarize its result before suggesting final commands.
- When reading files that may contain Korean, use UTF-8-aware commands such as `Get-Content -Encoding UTF8` and set PowerShell output encoding to UTF-8 before judging text.
- Do not conclude that Korean comments or strings are corrupted based only on mojibake shown in terminal output. Prefer the IDE view or a UTF-8 re-read.
- Do not rewrite Korean comments or strings unless explicitly requested.

## 5. Technical Rules

- Follow the existing React Native and Expo Bare Workflow structure.
- Respect the project ESLint and Prettier conventions.
- For large changes, write or ask for an implementation plan before editing.

> Important: Even if the user says "handle it for me", do not skip applicable workflow steps.
