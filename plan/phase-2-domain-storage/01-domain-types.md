# Define Domain Types

## Context

Establish TypeScript types that model the domain: agents, shifts, days, preferences, and the overall data structure.

## Acceptance Criteria

- [ ] `PreferenceStatus` type: union of `"available" | "unavailable" | "neutral"`
- [ ] `DayOfWeek` type: union of `"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"`
- [ ] `ShiftId` type: union of `"s1" | "s2" | "s3" | "s4" | "s5"`
- [ ] `Shift` type with: id, label (display name), startTime, endTime
- [ ] `SHIFTS` constant array defining the 5 shifts with their times
- [ ] `DAYS` constant array with day IDs and display names
- [ ] `DayPreferences` type: Record mapping ShiftId to PreferenceStatus
- [ ] `WeekPreferences` type: Record mapping DayOfWeek to DayPreferences
- [ ] `Agent` type with: id (string), name (string), preferences (WeekPreferences)
- [ ] `AppData` type with: version (number), agents (Agent array)
- [ ] Helper function to create default/empty preferences for a new agent

## Out of Scope

- Validation logic
- Business rules
- Migration code for future versions

## Notes

Use TypeScript's type system to make invalid states unrepresentable where practical. The `version` field starts at 1 and enables future schema migrations.
