# ⚡ Supabase Quickstart - 5 Minutes Setup

## 🎯 What You Get

- **100x faster** page loads (< 1 second instead of 5-15 seconds)
- **No rate limits** for users
- **Automatic updates** every 10 minutes
- **Historical data** for comparisons

---

## 🚀 Quick Setup (Copy & Paste)

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js
```

### 2. Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Fill in:
   - Name: `top-anime-ranks`
   - Password: (save it somewhere!)
   - Region: (choose closest to you)
4. Click **Create new project**
5. Wait ~2 minutes for project to be ready

### 3. Get Credentials

1. Go to **Settings** (⚙️) → **API**
2. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbG...` (long string)

### 4. Configure Environment

Create `.env` file in project root:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### 5. Run Migrations

**Go to:** Supabase Dashboard → **SQL Editor** → **New Query**

**Run Migration 1:**
1. Copy ALL content from `/supabase/migrations/20241027000001_initial_schema.sql`
2. Paste in SQL Editor
3. Click **RUN** (bottom right)
4. Wait for: ✅ Success

**Run Migration 2:**
1. Click **New Query**
2. Copy ALL content from `/supabase/migrations/20241027000002_setup_cron.sql`
3. Paste in SQL Editor
4. Click **RUN**
5. Wait for: ✅ Success

### 6. Deploy Edge Function

**Option A: Using Supabase Dashboard (Easiest)**

1. Go to **Edge Functions** (in sidebar)
2. Click **Create a new function**
3. Name: `sync-anime-data`
4. Copy entire content from `/supabase/functions/sync-anime-data/index.ts`
5. Paste in the editor
6. Click **Deploy function**

**Option B: Using CLI**

```bash
# Install CLI
npm install -g supabase

# Login
supabase login

# Link project (get ref from Settings → General)
supabase link --project-ref your-project-ref

# Deploy
supabase functions deploy sync-anime-data
```

### 7. Configure Cron Settings

**Go to:** SQL Editor → New Query

**Paste and run** (replace with YOUR credentials):

```sql
ALTER DATABASE postgres 
SET app.settings.supabase_url = 'https://your-project.supabase.co';

ALTER DATABASE postgres 
SET app.settings.supabase_anon_key = 'eyJhbGc...your-anon-key';
```

### 8. Initial Sync (Manual)

**Go to:** Edge Functions → `sync-anime-data` → **Invoke**

**Test with:**
```json
{
  "sync_type": "weekly_episodes",
  "week_number": 1
}
```

Click **Send**. Should see: `"success": true`

**Verify data:**
Go to **Table Editor** → `weekly_episodes` → Should have data!

### 9. Done! 🎉

```bash
npm run dev
```

Your app now loads **100x faster** from Supabase!

---

## 🔍 Verify It's Working

### Check Sync Status

**SQL Editor:**
```sql
SELECT * FROM latest_sync_status;
```

Should show recent syncs.

### Check Cron Jobs

```sql
SELECT * FROM cron.job;
```

Should show 3 jobs scheduled every 10 minutes.

### Check Data

```sql
-- Count episodes
SELECT COUNT(*) FROM weekly_episodes;

-- Latest sync
SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 5;
```

---

## ❗ Troubleshooting

### "No data in Supabase"
→ Run manual sync (Step 8)

### "Cron not running"
→ Check you ran Step 7 with YOUR credentials

### "Function error"
→ Check Edge Function logs in dashboard

### "Still slow"
→ Check browser console - should say "Found X episodes in Supabase"

---

## 📊 What Happens Now?

- ✅ Every **10 minutes**, Supabase syncs latest data from Jikan
- ✅ Users load data from Supabase (**< 1 second**)
- ✅ No rate limits for users
- ✅ Historical data saved for comparisons

---

## 🎓 Next Steps

1. **Monitor sync logs** for any errors
2. **Adjust interval** if needed (edit migration 2)
3. **Add more weeks** as they become available
4. **Optional**: Add SupabaseStatus component to show sync info

---

**Questions?** Check `/supabase/README.md` for detailed guide!

---

**Total setup time:** ~5 minutes ⏱️
**Performance improvement:** ~100x faster ⚡
**Cost:** $0 (free tier) 💰
