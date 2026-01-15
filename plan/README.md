# ShapeShifter - Shift Preference Editor

## Overview

A single-user web application for managing shift preferences of a First Line support team (~10 agents). Built with React + Vite + TypeScript.

## How to Run

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Key Decisions

### Data Model
- **Versioned JSON schema** (v1) enables future migrations
- **Weekly template** - preferences repeat weekly, not date-specific
- **Three-state system**: neutral (default) → available → unavailable

### Architecture
```
src/
├── types/           # Domain types (Agent, Shift, Preference, etc.)
├── storage/         # LocalStorage repository
├── store/           # React Context for app state
├── components/      # UI components
│   ├── agents/      # Agent list, add/edit/delete
│   ├── grid/        # Preference editing grid
│   └── coverage/    # Coverage summary view
└── App.tsx
```

### Storage
- **No backend** - all data in browser LocalStorage
- **Single JSON blob** with version for future migrations
- **Export/Import** for backup and transfer between browsers

### Shift Definitions (Fixed)
| Shift | Time        | Notes                |
|-------|-------------|----------------------|
| S1    | 00:00-07:00 | Night/early morning  |
| S2    | 07:00-13:00 | Morning              |
| S3    | 09:00-17:00 | Standard day         |
| S4    | 12:00-20:00 | Late day             |
| S5    | 19:00-01:00 | Evening (crosses midnight) |

### UI Pattern
- **Left panel**: Agent list with CRUD
- **Right panel**: Either preference grid OR coverage view (tab-based)
- **Cell cycling**: Click to cycle through neutral → available → unavailable → neutral

## Phases

1. [Phase 1: Project Setup](./phase-1-setup/README.md)
2. [Phase 2: Domain & Storage](./phase-2-domain-storage/README.md)
3. [Phase 3: Agent Management](./phase-3-agent-management/README.md)
4. [Phase 4: Preference Grid](./phase-4-preference-grid/README.md)
5. [Phase 5: Coverage View](./phase-5-coverage-view/README.md)
6. [Phase 6: Import/Export](./phase-6-import-export/README.md)

## Out of Scope (Explicitly)
- User authentication
- Multi-user / real-time collaboration
- Backend / database
- Date-specific scheduling (only weekly templates)
- Drag-and-drop interactions
- Mobile-first design (desktop focus)
