# Export to JSON File

## Context

Allow users to download their data as a JSON file for backup or transfer to another browser/device.

## Acceptance Criteria

- [ ] "Export" button triggers file download
- [ ] File is named with timestamp, e.g., `shapeshifter-2024-01-15.json`
- [ ] File contains the full AppData structure (version + all agents)
- [ ] JSON is formatted with indentation for human readability
- [ ] Works in modern browsers (Chrome, Firefox, Safari, Edge)
- [ ] No server roundtrip - pure client-side download

## Out of Scope

- Exporting to other formats (CSV, Excel)
- Partial export (specific agents only)
- Automatic/scheduled backups

## Notes

Use the standard Blob + download link approach for client-side file generation.
