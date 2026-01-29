# Layer Violation - Components Calling Supabase Directly

**Priority**: Medium
**Category**: Architecture
**Files Affected**:
- `src/components/workspace/CreateWorkspace.tsx`
- `src/components/workspace/InviteModal.tsx`
- `src/components/workspace/PendingInvites.tsx`
- `src/components/workspace/TeamManagement.tsx`
- `src/components/workspace/ImportLocalData.tsx`
- `src/store/AuthContext.tsx`
**Estimated Time**: 2-3 hours

## Problem

Components in the UI layer directly import and call `supabase`:

```typescript
import { supabase } from '../../lib/supabase';
// ...
const { data, error } = await supabase.from('workspace_members')...
```

This violates the layered architecture:
- `types → domain → infrastructure → store → components`

Database queries should go through the infrastructure layer (`SupabaseWorkspaceService`).

## Why It Matters

- **No single point of control**: Authorization, validation, and query logic scattered across UI
- **Hard to test**: Components tightly coupled to Supabase
- **Hard to audit**: Need to check every component for data access patterns
- **Hard to change**: Switching databases requires touching every component

## Acceptance Criteria

- [ ] All Supabase queries moved to `SupabaseWorkspaceService`
- [ ] Components call service methods, not `supabase` directly
- [ ] Only `src/lib/supabase.ts` and `src/infrastructure/` import Supabase client
- [ ] Service methods handle errors consistently
- [ ] Tests pass
- [ ] No new warnings/errors

## Notes

This is a larger refactor. Consider doing it incrementally:
1. First, add methods to `SupabaseWorkspaceService` for each query
2. Then, update components one by one to use the service
3. Finally, remove direct `supabase` imports from components

The service already exists at `src/infrastructure/persistence/SupabaseWorkspaceService.ts` - just needs more methods.
