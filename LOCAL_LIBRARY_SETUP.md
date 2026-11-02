# My Library local setup

This change adds My Library, folders, learning notes, external problem links, and repeated reviews. It has not been deployed or connected to a production database.

1. Run `database/library_migration.sql` once in the SQL editor of the Supabase project used by this local clone. The migration creates user owned tables and row level security policies. Back up the database first if it contains important data.
2. Keep the existing `backend/.env` and `frontend/.env` settings for the local Supabase project. The backend uses the signed-in user's bearer token for new library queries; no service role key is needed.
3. Run `npm install` in `backend` and `frontend`, then start the two existing dev scripts. Open `/library` after signing in.

New reviews follow 1, 3, 7, 14, 30, 60, then 120 day intervals. External metadata is a best effort suggestion from the page title and visible markup; users should confirm it. External solves are self reported and do not change `user_stats.total_score`.

The legacy code execution path still runs submissions locally on the backend host. Use an isolated execution service before exposing this app to untrusted public traffic.
