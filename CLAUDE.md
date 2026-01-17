cat << 'EOF' > CLAUDE.md
# Project Instructions for Claude

## Project Overview
This repository contains **ShapeShifter**, a simple single-user web application for managing weekly shift preferences for a First Line support team.

## Core Principles
- Single-user application
- No backend, no authentication
- LocalStorage JSON is the only persistence
- Weekly template only (Mon–Sun)
- Avoid overengineering

## Execution Plan
Follow the execution plan in `/plan`.
- Read `/plan/README.md`
- Follow phases in order
- Do not restart or reimplement completed work unless explicitly asked

## Architecture Guidelines
- src/types → domain types only
- src/storage → LocalStorage logic only
- src/store → React Context + simple actions
- src/components → UI only

## Data Model Rules
- Status: "neutral" | "available" | "unavailable"
- Missing preferences default to "neutral"
- Data must be JSON-serializable and versioned

## Sub-agents (lightweight role reviews)

Before implementing a non-trivial change or when asked to review work, run ONE quick pass with the relevant roles below.
Do NOT reread the entire repo. Use only local context, recent diffs, and filenames you touched.

### Roles
1) UX (User Experience)
- Goal: premium, calm, fast editing; minimize friction
- Checks: visual hierarchy, spacing, affordances, feedback, empty states, discoverability, sensible defaults

2) QA (Risk & Data Integrity)
- Goal: prevent data loss and silent failures
- Checks: destructive actions, import/export, persistence, constraints, weird inputs, edge cases

3) SCHED (Scheduling Correctness)
- Goal: scheduling logic is correct
- Checks: constraints (1 shift/day, cross-midnight), unavailable never assigned, fairness behavior

### Output format
- Maximum 6 findings total across all roles.
- Each finding: Title (≤6 words) | Role | Impact (H/M/L) | Fix (one line)
- No long explanations, no code blocks.

### When to run
- Before: adding a new feature, changing core UX, changing data model.
- After: a feature is implemented, run QA + SCHED briefly.

### Non-goals
- No enterprise architecture suggestions.
- No new libraries unless explicitly requested.
EOF

