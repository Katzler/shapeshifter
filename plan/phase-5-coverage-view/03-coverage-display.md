# Coverage Grid Display

## Context

Render the coverage statistics in a grid format similar to the preference editor.

## Acceptance Criteria

- [ ] Same grid layout as preference editor (days as columns, shifts as rows)
- [ ] Each cell shows counts: e.g., "3 / 2 / 5" (available / unavailable / neutral)
- [ ] Or use visual bars/badges with colors matching the preference states
- [ ] Cell with 0 available agents should stand out (potential coverage gap)
- [ ] Legend explaining what the numbers/colors mean
- [ ] Grid is read-only (no clicking interaction)
- [ ] Updates automatically when preferences change (if user has both views accessible)

## Out of Scope

- Drill-down to see which specific agents are in each state
- Alerts or warnings for low coverage
- Exporting coverage data separately

## Notes

The goal is a quick visual overview. Make it scannable - a manager should spot coverage gaps at a glance.
