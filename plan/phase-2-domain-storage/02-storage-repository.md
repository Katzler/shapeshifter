# Implement Storage Repository

## Context

Create a thin abstraction over LocalStorage for persisting and retrieving the app data.

## Acceptance Criteria

- [ ] Define a storage key constant (e.g., `"shapeshifter-data"`)
- [ ] `loadData(): AppData | null` - retrieve and parse from LocalStorage
- [ ] `saveData(data: AppData): void` - serialize and save to LocalStorage
- [ ] `clearData(): void` - remove data from LocalStorage
- [ ] Handle JSON parse errors gracefully (return null, log warning)
- [ ] Return null if no data exists (first-time user)

## Out of Scope

- Data validation beyond JSON parsing
- Version migration logic
- Encryption or compression
- IndexedDB or other storage mechanisms

## Notes

Keep the repository simple - it's just a JSON serialization layer. Validation belongs elsewhere.
