# Portivue

A responsive student portfolio app built with React, Vite, and Supabase.

## Features
- Supabase email/password sign-up and sign-in.
- Database trigger creates a `profiles` row on each new Auth user.
- Editable name, bio, and skills.
- Create, edit, and delete projects, certificates, and hackathons.
- Public read-only portfolio at `/u/<username>`.
- Entry labels: `Evidence linked` or `Self-reported`; these are not verification claims.
- Clearly marked sample portfolio at `/sample`.
- Row Level Security policies for public reads and owner-only writes.

## Setup
1. Create a `.env.local` file in the project root (copy `.env.example`).
2. Set:
   - `VITE_SUPABASE_URL=https://abpdrcslcsbatszipnyz.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=your Supabase publishable key`
3. In Supabase Dashboard, open **SQL Editor**, paste `db/schema.sql`, and run it.
4. In Supabase **Authentication → URL Configuration**, add your local and deployed site URLs to Site URL / Redirect URLs, e.g. `http://localhost:5173/**` and your production origin.
5. In Authentication settings, decide whether email confirmation should be enabled. If enabled, users need to confirm their email before a session is created.
6. Install and run:
   ```bash
   npm install
   npm run dev
   ```
7. Production build:
   ```bash
   npm run build
   ```

## Database notes
- `profiles.id` references `auth.users.id`.
- `handle_new_user()` inserts a profile when Supabase Auth creates a user.
- Default username is based on the email prefix plus a short unique suffix.
- RLS permits public reads for profile pages and entries. Only the authenticated owner can insert/update/delete their entries.
- If you later add private/draft portfolios, add a `is_public` field and revise the public SELECT policies before shipping that feature.
- The client uses only the publishable key. Never use a Supabase service-role/secret key in browser code.

## Limitations / production checklist
- This is a functional starter, not a hosted deployment; deploy the Vite build to your preferred host.
- Configure your Supabase Auth email templates and production redirect URLs.
- Consider rate limiting / CAPTCHA for public sign-up, a privacy/terms page, and server-side URL reputation checks if needed.
- Evidence URLs are user-submitted and are not fetched or verified by this application.
