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
EOF

