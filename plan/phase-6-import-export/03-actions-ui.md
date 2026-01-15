# Data Actions UI

## Context

Provide clear, accessible UI for the export and import features.

## Acceptance Criteria

- [ ] Export and Import buttons placed in a consistent location:
  - Option A: In sidebar footer below agent list
  - Option B: In a header/toolbar area
- [ ] Buttons are clearly labeled ("Export Data", "Import Data")
- [ ] Buttons have appropriate icons (download, upload)
- [ ] Import shows loading state while processing file
- [ ] Success/error feedback after import (toast or inline message)
- [ ] Destructive nature of import is clear (replaces existing data)

## Out of Scope

- Settings panel or modal
- Other data management features (clear all, etc.)
- Drag-and-drop file import

## Notes

Keep the UI minimal but discoverable. These are utility functions, not primary workflows.
