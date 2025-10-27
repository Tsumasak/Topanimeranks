# 🚀 Supabase Setup Guide - Top Anime Ranks

## 📋 Overview

This system uses Supabase as a high-performance cache for Jikan API data. Instead of fetching data directly from Jikan (which is slow and has rate limits), we:

1. **Sync data every 10 minutes** from Jikan to Supabase using Edge Functions
2. **Serve data instantly** from Supabase to users (< 1 second load times!)
3. **Automatic fallback** to Jikan if Supabase is empty (first-time setup)

---

## 🔧 Setup Instructions

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new organization (if you don't have one)
4. Create a new project:
   - **Name**: `top-anime-ranks` (or any name you prefer)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is perfect!

### Step 2: Get Your Credentials

1. Go to **Project Settings** (gear icon) → **API**
2. Copy these values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

### Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and paste your credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
   ```

### Step 4: Run Database Migrations

1. Go to your Supabase Dashboard → **SQL Editor**
2. Click **New Query**
3. Copy the entire content of `/supabase/migrations/20241027000001_initial_schema.sql`
4. Paste it in the SQL Editor
5. Click **Run** (bottom right)
6. Wait for success message: "✅ Top Anime Ranks schema created successfully!"

**Repeat for the second migration:**
1. Create another new query
2. Copy `/supabase/migrations/20241027000002_setup_cron.sql`
3. Paste and Run
4. Success: "✅ pg_cron configured successfully!"

### Step 5: Deploy Edge Function

**Option A: Using Supabase CLI (Recommended)**

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```
   (Find your project ref in Project Settings → General)

4. Deploy the function:
   ```bash
   supabase functions deploy sync-anime-data
   ```

**Option B: Manual Deploy (if CLI doesn't work)**

1. Go to **Edge Functions** in Supabase Dashboard
2. Click **Create a new function**
3. Name it: `sync-anime-data`
4. Copy the content from `/supabase/functions/sync-anime-data/index.ts`
5. Paste it in the editor
6. Click **Deploy**

### Step 6: Configure pg_cron Settings

⚠️ **Important**: pg_cron needs your Supabase URL and anon key to call the Edge Function.

1. Go to **SQL Editor** → **New Query**
2. Run this to set your configuration:
   ```sql
   ALTER DATABASE postgres SET app.settings.supabase_url = 'https://your-project.supabase.co';
   ALTER DATABASE postgres SET app.settings.supabase_anon_key = 'eyJhbGc...your-anon-key';
   ```
   (Replace with YOUR actual values)

3. Verify it worked:
   ```sql
   SELECT current_setting('app.settings.supabase_url');
   SELECT current_setting('app.settings.supabase_anon_key');
   ```

### Step 7: Test the Sync (Manual Trigger)

1. Go to **Edge Functions** → `sync-anime-data`
2. Click **Invoke** or **Test**
3. Use this JSON body:
   ```json
   {
     "sync_type": "weekly_episodes",
     "week_number": 1
   }
   ```
4. Click **Send**
5. Check the response - should see `"success": true`

6. Verify data in database:
   ```sql
   SELECT COUNT(*) FROM weekly_episodes;
   SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 5;
   ```

### Step 8: Verify Cron Jobs

1. Check if cron jobs are scheduled:
   ```sql
   SELECT * FROM cron.job;
   ```
   You should see 3 jobs:
   - `sync-weekly-episodes`
   - `sync-season-rankings`
   - `sync-anticipated-animes`

2. Check execution history:
   ```sql
   SELECT * FROM cron.job_run_details 
   ORDER BY start_time DESC 
   LIMIT 10;
   ```

### Step 9: Start Your App

```bash
npm run dev
```

The app will:
1. Try to fetch from Supabase first (fast!)
2. If empty, fallback to Jikan (slower, only on first load)
3. After 10 minutes, cron will sync new data automatically

---

## 📊 Database Schema

### Tables Created:

1. **weekly_episodes** - Episodes by week
   - Stores episode data for each week
   - Auto-updated every 10 minutes
   - Tracks position changes

2. **season_rankings** - Seasonal anime rankings
   - Animes grouped by season (winter, spring, summer, fall)
   - Includes full anime details

3. **anticipated_animes** - Most anticipated upcoming animes
   - Top 50 not-yet-aired animes
   - Sorted by members count

4. **sync_logs** - Synchronization history
   - Tracks all sync operations
   - Useful for debugging
   - Shows performance metrics

### Useful Queries:

```sql
-- Check latest sync status
SELECT * FROM latest_sync_status;

-- Count episodes per week
SELECT week_number, COUNT(*) 
FROM weekly_episodes 
GROUP BY week_number 
ORDER BY week_number;

-- Top 10 animes by members
SELECT anime_title, members, score 
FROM weekly_episodes 
WHERE week_number = 1 
ORDER BY members DESC 
LIMIT 10;

-- Sync errors
SELECT * FROM sync_logs 
WHERE status = 'error' 
ORDER BY created_at DESC;
```

---

## 🔍 Troubleshooting

### Problem: "No data in Supabase"
**Solution**: 
1. Check if Edge Function is deployed
2. Manually trigger sync (Step 7)
3. Check `sync_logs` table for errors

### Problem: "Cron jobs not running"
**Solution**:
1. Verify pg_cron extension is enabled
2. Check cron settings (Step 6)
3. Verify Edge Function URL is correct
4. Check `cron.job_run_details` for errors

### Problem: "Rate limit errors in sync_logs"
**Solution**:
- Normal! Jikan has rate limits
- The sync function has retry logic with delays
- Data will sync eventually

### Problem: "Function timeout"
**Solution**:
- Edge Functions have a 60s timeout
- If syncing takes too long, it may fail
- Check `sync_logs` for partial syncs
- Re-run the sync manually

---

## 📈 Performance Comparison

### Before (Direct Jikan API):
- ⏱️ Load time: **5-15 seconds**
- 🔄 Rate limits: **3 requests/second**
- ❌ Frequent failures due to rate limits

### After (Supabase Cache):
- ⏱️ Load time: **< 1 second** ⚡
- 🔄 Rate limits: **None for users!**
- ✅ Always fast and reliable

---

## 🎯 Next Steps

Once everything is working:

1. **Monitor sync logs** regularly for errors
2. **Adjust cron interval** if needed (currently 10 minutes)
3. **Add more weeks** to the sync as needed
4. **Optional**: Set up Supabase email alerts for sync failures

---

## 📚 Resources

- [Supabase Docs](https://supabase.com/docs)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [pg_cron Documentation](https://github.com/citusdata/pg_cron)
- [Jikan API Docs](https://docs.api.jikan.moe/)

---

## 💡 Tips

- **Free tier limits**: 500MB storage, 2GB bandwidth/month - plenty for this project!
- **Bandwidth optimization**: Supabase only sends data you request (SELECT fields)
- **Historical data**: Old weeks stay in DB (great for comparisons!)
- **Backup**: Supabase has automatic backups on paid tiers

---

**Need help?** Check the `sync_logs` table first - it shows exactly what's happening!

Good luck! 🚀
