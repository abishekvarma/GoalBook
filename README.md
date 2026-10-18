# Project Physique 40

A mobile-first personal tracker for food, workouts, body measurements and progress photos.

## Included

- Food logging with calories, protein, carbs, fat, grams, and raw/cooked state
- Starter food lookup and off-plan food tagging with a weekly summary
- Exercise logging with sets, reps, weights and recent performance
- Daily weight and waist entries, seven-day average and weight trend
- Progress photo timeline stored in this browser
- Editable diet and weekly workout plan text
- JSON backup export/import
- Responsive installable PWA shell
- Optional server-side AI plan organizer endpoint
- Optional Supabase schema with row-level security policies

## Important limitations

**This version is local-first.** Logs stay in the current browser/device; they do not sync between iPhone and laptop until Supabase authentication and sync are implemented and configured. Progress photos are stored in browser storage and are not encrypted by this app. Avoid sensitive photos on shared devices.

The optional AI endpoint requires server-side `OPENAI_API_KEY` and optionally `OPENAI_MODEL` environment variables. API use may incur separate charges. Never put API secrets in `public/config.js`.

The included SQL is a schema starting point, not a completed cloud-sync integration. Production photo storage requires a private Supabase Storage bucket and owner-scoped policies.

## Deployment

1. Import this GitHub repository into Vercel.
2. Check the deployment build and serverless function logs.
3. If enabling AI, configure `OPENAI_API_KEY` and optionally `OPENAI_MODEL` in Vercel environment variables. Never commit real keys.
4. If enabling cloud sync, create a Supabase project, review/run `supabase-setup.sql`, configure Auth and a private photo bucket, and implement/verify authenticated sync before storing sensitive data.

## Local preview

Serve the `public` directory with any static HTTP server. Food/workout logging works without the optional AI endpoint.

## Safety

This is a personal tracking tool, not medical advice. Avoid crash dieting. Body weight fluctuates and photos cannot reliably estimate body-fat percentage.