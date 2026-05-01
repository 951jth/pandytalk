# Repository Agent Instructions

Before answering or running commands in this repository, read and follow:

- `.agent/rules.md`

Important encoding rule:

- This repository contains Korean comments and strings.
- When reading files with Korean text in PowerShell, use `Get-Content -Encoding UTF8 <path>`.
- Never treat mojibake in terminal output as file corruption.
- Do not delete, rewrite, normalize, or replace Korean comments or strings unless the user explicitly asks for that change.

