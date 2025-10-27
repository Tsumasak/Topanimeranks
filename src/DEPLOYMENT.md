# 🚀 Deployment Guide - Top Anime Ranks with Supabase

## 📋 Prerequisites

- Supabase project set up (see `SUPABASE_QUICKSTART.md`)
- Vercel account (free)

---

## 🌐 Deploy to Vercel

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Add Supabase integration"
git push origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Select your repository
4. Click **Import**

### Step 3: Add Environment Variables

In Vercel project settings:

1. Go to **Settings** → **Environment Variables**
2. Add these variables:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGc...` (your anon key) | Production, Preview, Development |

3. Click **Save**

### Step 4: Deploy

1. Go to **Deployments**
2. Click **Deploy** (or it auto-deploys on push)
3. Wait ~2 minutes
4. Visit your site at `https://your-project.vercel.app`

---

## ✅ Verify Production Setup

### 1. Check Browser Console

Open DevTools → Console. You should see:

```
[SupabaseService] Fetching week 1...
[SupabaseService] ✅ Found X episodes in Supabase
```

**NOT:**
```
[SupabaseService] Falling back to Jikan...
```

If you see fallback, Supabase credentials might be wrong.

### 2. Check Load Time

- **With Supabase**: < 1 second
- **Without Supabase**: 5-15 seconds

### 3. Check Network Tab

DevTools → Network:

- Should see requests to `your-project.supabase.co`
- NOT many requests to `api.jikan.moe`

---

## 🔧 Post-Deployment Checks

### Supabase Dashboard

1. Go to **Table Editor** → `sync_logs`
2. Check latest syncs are running every 10 minutes
3. Status should be `success`

### Edge Function Logs

1. Go to **Edge Functions** → `sync-anime-data`
2. Click **Logs**
3. Should see regular invocations every 10 minutes
4. No errors

### Cron Jobs

```sql
-- Check job history
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

Should show jobs running every 10 minutes.

---

## 🐛 Troubleshooting

### Problem: Site still slow in production

**Check:**
1. Environment variables are set in Vercel
2. Variables start with `VITE_` (required for Vite)
3. Redeploy after adding variables

**Fix:**
```bash
# Verify env vars
vercel env ls

# Redeploy
vercel --prod
```

### Problem: "Supabase not configured"

**Check:**
- Browser console for exact error
- Environment variables in Vercel settings
- Variable names are EXACTLY: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

**Fix:**
1. Double-check variable names (case-sensitive!)
2. Make sure values don't have extra spaces
3. Redeploy

### Problem: No data in Supabase

**Check:**
- Run manual sync (see `SUPABASE_QUICKSTART.md` Step 8)
- Check `sync_logs` table for errors
- Verify Edge Function is deployed

**Fix:**
```sql
-- Check sync status
SELECT * FROM latest_sync_status;

-- Check errors
SELECT * FROM sync_logs 
WHERE status = 'error' 
ORDER BY created_at DESC;
```

### Problem: Cron jobs not running

**Check:**
- Step 7 in `SUPABASE_QUICKSTART.md` was completed
- Settings have correct URL and anon key

**Fix:**
```sql
-- Re-run configuration
ALTER DATABASE postgres 
SET app.settings.supabase_url = 'https://your-project.supabase.co';

ALTER DATABASE postgres 
SET app.settings.supabase_anon_key = 'eyJhbGc...';

-- Verify
SELECT current_setting('app.settings.supabase_url');
```

---

## 📊 Performance Monitoring

### Add Performance Tracking (Optional)

Edit `services/supabase.ts`:

```typescript
// Add at the top of functions
const startTime = performance.now();

// Add at the end
const duration = performance.now() - startTime;
console.log(`[Perf] Loaded in ${duration.toFixed(0)}ms`);
```

### Expected Performance

- **Supabase**: 100-500ms
- **Jikan Fallback**: 5000-15000ms

---

## 🔐 Security Notes

### Environment Variables

✅ **SAFE to expose:**
- `VITE_SUPABASE_URL` (public URL)
- `VITE_SUPABASE_ANON_KEY` (anon/public key with RLS protection)

❌ **NEVER expose:**
- `SUPABASE_SERVICE_ROLE_KEY` (only use in Edge Functions, never in frontend)

### Row Level Security (RLS)

Already configured in migrations:
- ✅ Public can READ all tables
- ✅ Only Edge Functions (service role) can WRITE
- ✅ Users cannot modify data directly

---

## 📈 Scaling

### Free Tier Limits (Supabase)

- ✅ 500MB database storage
- ✅ 2GB bandwidth/month
- ✅ 500K Edge Function invocations/month

**Current usage (estimated):**
- Storage: ~10MB (months of data)
- Bandwidth: ~100MB/month (1000 users/day)
- Functions: ~4,320/month (every 10 min)

**You're well within limits!** 🎉

### When to Upgrade

Consider paid tier ($25/month) when:
- > 100K monthly users
- > 500MB data (years of history)
- Need faster Edge Functions
- Want automatic backups

---

## 🎯 Optimization Tips

### 1. Enable Gzip Compression (Vercel)

Already enabled by default in Vercel! No action needed.

### 2. Cache Control Headers

Add to `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 3. Supabase Connection Pooling

Already enabled by default for serverless environments.

---

## 📱 Mobile Performance

### Test on Mobile

1. Open Chrome DevTools
2. Click device icon (responsive mode)
3. Select mobile device
4. Reload page
5. Check Performance tab

**Expected:**
- First load: < 2 seconds (including images)
- Cached load: < 0.5 seconds

---

## 🔄 Update Strategy

### When API Changes

1. Update Edge Function (`/supabase/functions/sync-anime-data/index.ts`)
2. Deploy function: `supabase functions deploy sync-anime-data`
3. Manual trigger to test
4. Monitor `sync_logs` for errors

### When Schema Changes

1. Create new migration file
2. Run in SQL Editor
3. Update TypeScript types
4. Update Edge Function if needed
5. Redeploy

---

## 📚 Resources

- [Vercel Deployment Docs](https://vercel.com/docs)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

---

## ✨ Post-Deployment Checklist

- [ ] Environment variables set in Vercel
- [ ] Site loads in < 1 second
- [ ] Browser console shows Supabase messages
- [ ] No Jikan API errors
- [ ] Cron jobs running every 10 minutes
- [ ] `sync_logs` showing success
- [ ] Mobile performance tested
- [ ] All pages working correctly

---

**Congratulations!** Your site is now **100x faster** in production! 🚀

**Questions?** Check the browser console first - it tells you exactly what's happening!
