# Preference Cell

## Context

Each cell represents one day+shift combination and shows/edits the preference status.

## Acceptance Criteria

- [ ] Cell displays current status visually:
  - Neutral: subtle/gray background, no icon or dash
  - Available: green background or checkmark
  - Unavailable: red background or X mark
- [ ] Clicking the cell cycles: neutral → available → unavailable → neutral
- [ ] Visual feedback on hover (cursor pointer, subtle highlight)
- [ ] Click interaction feels responsive (no delay)
- [ ] Cell is keyboard accessible (tab navigation, Enter/Space to toggle)

## Out of Scope

- Right-click context menu
- Drag to select multiple cells
- Keyboard shortcuts for specific states

## Notes

Color choices should be accessible (sufficient contrast). Consider colorblind-friendly palette or use icons in addition to color.
