# AGENTS.md — Titroutine Workspace Rules

## Critical Rule: Read CLAUDE.md First
Before doing ANY research, file scanning, or grep commands, **read `CLAUDE.md`** in the project root. It contains a complete file map, database schema, server actions reference, and all conventions. This saves hundreds of tokens per session.

## Scope Discipline
- **NEVER modify components unrelated to the current task.**
- Before editing, explicitly list which files will be changed.
- If a component is NOT mentioned in the user's request, do NOT touch it.
- Always ask before changing more than 20% of existing code.

## Build Verification
- Use `cd apps/web && npm run build` to verify. This runs TypeScript checks.
- `npm run lint` is broken (Next 16 removed it). Don't use it.
- Terminal must be clean — no errors, no warnings that weren't there before.

## Don't Waste Tokens
- Skip `node_modules/`, `.next/`, `.turbo/`, `package-lock.json`, `tsconfig.tsbuildinfo`
- Skip `temp_agentpet/` unless explicitly asked about the macOS desktop app
- Skip sprite PNGs and font files
- The `CLAUDE.md` file has the full server actions table with line numbers — use it instead of grepping

## AgentPet Project Location
- When referencing the `agentpet` app, note that it is located outside the `titroutine` workspace in the sibling directory: `file:///Users/admin/Library/CloudStorage/OneDrive-lovenhu/Code/Antigravity/agentpet`.
