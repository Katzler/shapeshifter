# Setup Folder Structure

## Context

Establish the source folder structure to maintain clean separation between domain, storage, state, and UI layers.

## Acceptance Criteria

- [ ] Create `src/types/` directory for domain type definitions
- [ ] Create `src/storage/` directory for LocalStorage repository
- [ ] Create `src/store/` directory for React Context state management
- [ ] Create `src/components/` with subdirectories:
  - `agents/` - agent list and management
  - `grid/` - preference editing grid
  - `coverage/` - coverage summary view
  - `common/` - shared UI components
- [ ] Add placeholder `index.ts` or component files in each directory
- [ ] Verify imports work correctly across directories

## Out of Scope

- Implementing actual functionality in any module
- Creating detailed component hierarchies

## Notes

Keep the structure flat and simple. Avoid deep nesting.
