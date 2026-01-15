# Coverage Calculation

## Context

Compute aggregated statistics from all agents' preferences for the coverage view.

## Acceptance Criteria

- [ ] Function that takes all agents and returns coverage data
- [ ] For each day+shift combination, count:
  - Number of agents marked "available"
  - Number of agents marked "unavailable"
  - Number of agents marked "neutral"
- [ ] Return structure: `Record<DayOfWeek, Record<ShiftId, { available: number, unavailable: number, neutral: number }>>`
- [ ] Calculation is efficient (not noticeable delay even with 20+ agents)
- [ ] Handle empty agent list (all counts are 0)

## Out of Scope

- Percentage calculations
- Trend analysis
- Filtering by agent subgroups
- Caching or memoization (unless needed for performance)

## Notes

This is a pure function - no side effects. Can be unit tested easily if desired.
