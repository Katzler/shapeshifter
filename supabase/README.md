# Supabase Setup

## 1. Create Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key from Settings > API

## 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

## 3. Run Database Migration

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `migrations/001_initial_schema.sql`
4. Click "Run"

## 4. Enable Google OAuth

1. Go to Authentication > Providers
2. Enable Google provider
3. Add your Google OAuth credentials (from Google Cloud Console)
4. Add authorized redirect URL to your Google OAuth app

## Tables

- **workspaces** - Workspace metadata and app data (JSONB)
- **workspace_members** - Who has access to which workspace (with role)
- **workspace_invites** - Pending invitations

## Row Level Security

All tables have RLS enabled:
- Users can only see workspaces they're members of
- Only admins can invite/remove members
- Workspace creators cannot be removed
