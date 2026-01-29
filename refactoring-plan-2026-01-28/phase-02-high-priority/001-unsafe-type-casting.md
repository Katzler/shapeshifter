# Unsafe Type Casting from Supabase Responses

**Priority**: High
**Category**: Type Safety
**Files Affected**:
- `src/store/AuthContext.tsx` (lines 108, 144)
- `src/infrastructure/persistence/SupabaseWorkspaceService.ts` (line 95)
**Estimated Time**: 15 minutes

## Problem

Multiple places use `as unknown as { ... }` pattern to cast Supabase JOIN responses:

```typescript
(row.workspaces as unknown as { name: string } | null)?.name ?? 'Unknown'
```

This bypasses TypeScript completely. If Supabase returns unexpected shape (e.g., array instead of object, different field names), we get runtime null pointer errors.

## Why It Matters

- Runtime crashes if Supabase schema changes
- No compile-time safety
- Bugs only discovered in production

## Acceptance Criteria

- [ ] Create proper TypeScript types for Supabase responses
- [ ] Use type guards or runtime validation
- [ ] Remove `as unknown as` casts
- [ ] Gracefully handle unexpected response shapes
- [ ] Tests pass
- [ ] No new warnings/errors

## Notes

Consider using Supabase's generated types (`supabase gen types typescript`) or creating explicit interfaces for query responses.
