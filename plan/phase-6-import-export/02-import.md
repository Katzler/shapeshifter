# Import from JSON File

## Context

Allow users to restore data from a previously exported JSON file.

## Acceptance Criteria

- [ ] "Import" button opens file picker (accepts .json files)
- [ ] Parse selected file as JSON
- [ ] Validate structure:
  - Has `version` field (number)
  - Has `agents` array
  - Each agent has `id`, `name`, `preferences`
- [ ] Show error message if file is invalid (not JSON or wrong structure)
- [ ] **Confirm before replacing**: warn user that import will replace all current data
- [ ] On successful import, replace LocalStorage data and update UI state
- [ ] Clear agent selection after import

## Out of Scope

- Merging imported data with existing data
- Version migration during import
- Importing from URL or clipboard

## Notes

Be defensive with validation - users might select wrong files accidentally. Clear error messages help.
