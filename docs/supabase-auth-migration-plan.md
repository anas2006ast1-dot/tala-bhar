# Supabase Auth and RLS cutover plan

Review draft only. No Auth settings or SQL have been changed in the live Supabase project. The current deployed site remains untouched until this branch is approved and deployed.

## Current implementation

- The browser signs in with Supabase Auth email/password and only admits a user whose server-managed `app_metadata.role` equals `admin`.
- The role check is for user experience only. Database and Storage RLS must enforce the same boundary.
- Cloudflare Worker receives the Supabase access token for image uploads and menu-snapshot publication, validates it through Supabase Auth `/auth/v1/user`, and accepts only server-managed `app_metadata.role = admin`. It has no separate Worker password or custom session secret.
- The customer menu remains public. Auth tokens are stored in tab-scoped `sessionStorage`; the Service Worker handles neither Auth requests nor Auth responses.
- The browser receives only the Supabase publishable/anon key. Never put a Supabase secret or service-role key in a `VITE_` variable, browser bundle, GitHub, or Vercel client environment.

## Required operator steps (not performed)

1. In Supabase Authentication, create/invite the intended administrator and confirm a recovery method. Disable public sign-ups if the project does not need customer accounts. Do not remove existing users until their purpose is known.
2. From a trusted local shell, assign the admin claim using `scripts/set-admin-role.mjs` after reviewing it. Set `SUPABASE_URL` and a server-only `SUPABASE_SECRET_KEY` in that shell's environment; pass the target Auth user UUID and `grant`. Do not save the secret in `.env`, Vite variables, Git, terminal transcripts, or Vercel client settings. The script is not run by this change.
3. Deploy a Vercel Preview only after approval and add its exact origin to the Worker `APP_ORIGINS` setting. Sign in through that Preview and confirm it admits the admin. A regular Auth user must be denied by both RLS and Worker. If the role was just assigned, sign out and back in so the JWT contains the current `app_metadata` claim.
4. Run `supabase/proposals/admin-auth-rls-preflight.sql` in the SQL editor only after approval. Review all current policies and save their output for rollback; check whether this project has other policies or clients depending on authenticated writes.
5. After explicit approval, apply `supabase/proposals/admin-auth-rls.sql`. It changes policies only: it does not delete or modify menu rows, tables, buckets, or stored files. Public reads remain, and mutations to menu tables and the `menu-images` bucket require the server-managed admin claim.
6. Set the Vercel Preview variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (or legacy public anon key), `VITE_MEDIA_API_URL`, and `VITE_R2_PUBLIC_URL`. Never set a secret key in a `VITE_` variable. Verify menu and administrator operations on Preview, then promote/deploy only after separate approval. Do not merge to `main` or deploy production as part of this task.

## Cutover and access continuity

The old fixed-password client login is removed from this branch; leaving it as a fallback would preserve a bypassable credential. The currently deployed version is unaffected until deployment. Before production cutover, create and assign the Supabase administrator and verify Auth on a preview. Coordinate applying the reviewed RLS draft with deploying the Auth-aware client: applying RLS first can temporarily block edits from the old client, while deploying first leaves the old database policies active until SQL is applied. Keep the exact preflight policy inventory and use it to prepare a reviewed rollback. Do not restore a client-side password as rollback.

After enabling RLS restrictions, log in again to receive a fresh JWT and verify public menu reads, admin CRUD, and Storage upload/update/delete. Test with a separate ordinary Auth user and confirm all writes are denied. If Auth, role assignment, or policy checks fail, pause the cutover and use the saved policy inventory to restore the reviewed prior policies.

## Security notes

- `app_metadata` is assigned by a trusted server-side operator. The app does not use mutable `user_metadata` for authorization.
- The provided role-assignment script uses a server-only secret through process environment and prints neither the key nor target email. Run it only from a trusted machine and only for a reviewed UUID.
- The old fixed password was present in the earlier committed source. Removing it from this branch does not erase prior Git history. Treat it as compromised and rotate it anywhere it was reused. Rewriting published history is a separate repository operation and is not included here.
- No real Supabase account, RLS policy, or SQL was exercised in this local task.
