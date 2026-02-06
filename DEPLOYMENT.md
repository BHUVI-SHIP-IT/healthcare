# Campus Care - Supabase Deployment Guide

## Prerequisites
- Supabase CLI installed: `npm install -g supabase`
- Supabase account and project created

## Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

## Step 2: Login to Supabase

```bash
supabase login
```

## Step 3: Link Your Project

```bash
cd HCproject
supabase link --project-ref mtzwvtfmvoajohrodegp
```

When prompted, enter your database password.

## Step 4: Push Database Trigger and RLS Policies

Run the SQL migration in your Supabase dashboard:

1. Go to https://supabase.com/dashboard/project/mtzwvtfmvoajohrodegp/sql/new
2. Copy the contents of `supabase/migrations/00001_rls_and_triggers.sql`
3. Paste and click "Run"

## Step 5: Deploy Edge Functions

Deploy all functions with these commands:

```bash
supabase functions deploy approve-request
supabase functions deploy acknowledge-arrival
supabase functions deploy submit-doctor-report
supabase functions deploy hod-decision
supabase functions deploy authorize-exit
supabase functions deploy scan-gate-token
```

## Step 6: Deploy Frontend to Vercel

```bash
cd frontend
npm install -g vercel
vercel login
vercel --prod
```

**Environment Variables to set in Vercel:**
- `VITE_SUPABASE_URL`: `https://mtzwvtfmvoajohrodegp.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: `your-anon-key`

## Step 7: Clean Up Local Files

Once deployed and tested:

```bash
# Stop local servers
# Ctrl+C in each terminal

# Remove backend folder
rm -rf backend
rm docker-compose.yml
```

## Testing the Deployment

1. Visit your Vercel URL
2. Register a new user with Student role
3. Submit a health request
4. Register users with other roles
5. Test the complete workflow

## Done! 🎉

Your Campus Care app is now:
- ✅ Deployed to Vercel (frontend)
- ✅ Using Supabase Edge Functions (backend logic)
- ✅ Connected to Supabase PostgreSQL (database)
- ✅ Secured with RLS policies
- ✅ Using Supabase Auth (authentication)

**No Docker. No backend folder. Just a single frontend deployment!**
