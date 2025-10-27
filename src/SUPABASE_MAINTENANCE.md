# 🛠️ Supabase Maintenance & Troubleshooting

## 🔍 Daily Monitoring

### Quick Health Check

Run these queries in Supabase SQL Editor:

```sql
-- 1. Check latest sync status (should be recent)
SELECT * FROM latest_sync_status;

-- 2. Count total data
SELECT 
  'weekly_episodes' as table_name, 
  COUNT(*) as count 
FROM weekly_episodes
UNION ALL
SELECT 
  'season_rankings', 
  COUNT(*) 
FROM season_rankings
UNION ALL
SELECT 
  'anticipated_animes', 
  COUNT(*) 
FROM anticipated_animes;

-- 3. Check for recent errors
SELECT * FROM sync_logs 
WHERE status = 'error' 
ORDER BY created_at DESC 
LIMIT 5;
```

### What to Look For

✅ **Good:**
- Latest sync within last 10 minutes
- No errors in `sync_logs`
- Increasing data counts

❌ **Bad:**
- No syncs in last hour
- Multiple errors in `sync_logs`
- Zero data counts

---

## 🔧 Common Issues & Fixes

### Issue 1: Cron Jobs Stopped Running

**Symptoms:**
- No recent entries in `cron.job_run_details`
- `latest_sync_status` shows old timestamps

**Diagnosis:**
```sql
-- Check if jobs are scheduled
SELECT * FROM cron.job;

-- Check recent executions
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

**Fix:**
```sql
-- Unschedule old jobs
SELECT cron.unschedule('sync-weekly-episodes');
SELECT cron.unschedule('sync-season-rankings');
SELECT cron.unschedule('sync-anticipated-animes');

-- Re-run the cron migration
-- Copy and run: /supabase/migrations/20241027000002_setup_cron.sql
```

---

### Issue 2: Edge Function Failing

**Symptoms:**
- Errors in `sync_logs`
- Status 500 when manually invoking function

**Diagnosis:**
Check Edge Function logs:
1. Go to **Edge Functions** → `sync-anime-data`
2. Click **Logs**
3. Look for error messages

**Common Causes:**

#### A. Rate Limit from Jikan
```
Error: HTTP 429: Too Many Requests
```

**Fix:** Wait 1-2 minutes, then retry. Function has retry logic.

#### B. Timeout (60 seconds)
```
Error: Function timeout
```

**Fix:** Sync smaller batches
```typescript
// In Edge Function, reduce the number of items
const topAnimes = allAnimes.slice(0, 25); // Instead of 50
```

#### C. Network Error
```
Error: Failed to fetch
```

**Fix:** Usually temporary. Check Jikan API status at [status.jikan.moe](https://status.jikan.moe)

---

### Issue 3: Duplicate Data

**Symptoms:**
- Same episode appears multiple times
- Incorrect counts

**Diagnosis:**
```sql
-- Find duplicates
SELECT 
  episode_id, 
  week_number, 
  COUNT(*) as count
FROM weekly_episodes
GROUP BY episode_id, week_number
HAVING COUNT(*) > 1;
```

**Fix:**
```sql
-- Remove duplicates (keep newest)
DELETE FROM weekly_episodes a
USING weekly_episodes b
WHERE a.id < b.id
  AND a.episode_id = b.episode_id
  AND a.week_number = b.week_number;
```

---

### Issue 4: Frontend Still Using Jikan

**Symptoms:**
- Browser console shows "Falling back to Jikan..."
- Page loads slowly

**Diagnosis:**
Check browser console for:
```
[SupabaseService] No data in Supabase
```

**Possible Causes:**

#### A. Environment Variables Missing
```bash
# Check .env file
cat .env

# Should have:
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...
```

**Fix:** Add variables and restart dev server

#### B. Database Empty
```sql
-- Check if data exists
SELECT COUNT(*) FROM weekly_episodes;
```

**Fix:** Run manual sync (see SUPABASE_QUICKSTART.md Step 8)

#### C. Wrong Credentials
**Fix:** Double-check URL and key in `.env` match Supabase dashboard

---

### Issue 5: Old Data Not Updating

**Symptoms:**
- Week 1 data same as yesterday
- Scores not updating

**Diagnosis:**
```sql
-- Check when data was last updated
SELECT 
  week_number,
  MAX(updated_at) as last_update
FROM weekly_episodes
GROUP BY week_number
ORDER BY week_number;
```

**Fix:**
```sql
-- Manual trigger for specific week
-- Run in Edge Function (Invoke tab):
{
  "sync_type": "weekly_episodes",
  "week_number": 1
}
```

---

## 🧹 Maintenance Tasks

### Weekly

#### 1. Check Disk Usage
```sql
-- Estimate database size
SELECT 
  pg_size_pretty(pg_database_size(current_database())) 
  as database_size;
```

Target: < 50MB (well within 500MB limit)

#### 2. Check Sync Performance
```sql
-- Average sync duration
SELECT 
  sync_type,
  AVG(duration_ms) as avg_duration_ms,
  MAX(duration_ms) as max_duration_ms
FROM sync_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY sync_type;
```

Target: < 30000ms (30 seconds)

#### 3. Error Rate
```sql
-- Error percentage
SELECT 
  sync_type,
  COUNT(*) FILTER (WHERE status = 'error') * 100.0 / COUNT(*) as error_rate
FROM sync_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY sync_type;
```

Target: < 5% error rate

---

### Monthly

#### 1. Clean Old Sync Logs
```sql
-- Delete logs older than 30 days
DELETE FROM sync_logs
WHERE created_at < NOW() - INTERVAL '30 days';
```

#### 2. Optimize Tables
```sql
-- Vacuum and analyze (frees up space)
VACUUM ANALYZE weekly_episodes;
VACUUM ANALYZE season_rankings;
VACUUM ANALYZE anticipated_animes;
VACUUM ANALYZE sync_logs;
```

#### 3. Review Indexes
```sql
-- Check unused indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelname NOT LIKE '%pkey';
```

---

## 📊 Performance Optimization

### Slow Queries

#### Find Slow Queries
```sql
-- Enable query logging (run once)
ALTER DATABASE postgres SET log_min_duration_statement = 1000; -- Log queries > 1s
```

Check logs in Supabase Dashboard → **Logs** → **Postgres Logs**

#### Add Missing Indexes
```sql
-- Example: If filtering by score is slow
CREATE INDEX idx_weekly_episodes_score_week 
ON weekly_episodes(week_number, score DESC NULLS LAST);
```

### Connection Pooling

Already enabled by default. No action needed.

### Enable RLS Caching (Supabase paid tier)

Speeds up RLS policy checks. Upgrade to Pro if needed.

---

## 🚨 Emergency Procedures

### Complete Reset (Nuclear Option)

**⚠️ WARNING: Deletes ALL data!**

```sql
-- 1. Stop cron jobs
SELECT cron.unschedule('sync-weekly-episodes');
SELECT cron.unschedule('sync-season-rankings');
SELECT cron.unschedule('sync-anticipated-animes');

-- 2. Drop all tables
DROP TABLE IF EXISTS weekly_episodes CASCADE;
DROP TABLE IF EXISTS season_rankings CASCADE;
DROP TABLE IF EXISTS anticipated_animes CASCADE;
DROP TABLE IF EXISTS sync_logs CASCADE;
DROP VIEW IF EXISTS latest_sync_status CASCADE;

-- 3. Re-run migrations
-- Run: /supabase/migrations/20241027000001_initial_schema.sql
-- Run: /supabase/migrations/20241027000002_setup_cron.sql

-- 4. Manual sync to repopulate
-- Use Edge Function Invoke with week_number: 1, 2, 3, etc.
```

### Rollback to Jikan Only

If Supabase is completely broken:

```typescript
// In .env, comment out Supabase vars
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...
```

Restart dev server. App will use Jikan API directly.

---

## 📈 Monitoring Setup (Optional)

### Email Alerts for Errors

1. Go to Supabase Dashboard → **Database** → **Webhooks**
2. Create webhook for `sync_logs` table
3. Trigger on INSERT when `status = 'error'`
4. Send to monitoring service (e.g., [webhooks.fyi](https://webhooks.fyi))

### Uptime Monitoring

Use [UptimeRobot](https://uptimerobot.com/) (free):
1. Monitor Edge Function URL
2. Alert if function returns error
3. Check every 5 minutes

---

## 🔐 Security Maintenance

### Rotate Anon Key (If Leaked)

1. Go to **Settings** → **API**
2. Click **Reset anon key**
3. Update environment variables everywhere:
   - `.env` (local)
   - Vercel environment variables
   - `app.settings.supabase_anon_key` in database

```sql
ALTER DATABASE postgres 
SET app.settings.supabase_anon_key = 'new-key-here';
```

### Review RLS Policies

```sql
-- List all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public';
```

Ensure:
- Public can only SELECT
- Only service_role can INSERT/UPDATE/DELETE

---

## 📝 Changelog

Keep track of changes:

```markdown
## 2024-10-27
- Initial Supabase setup
- Created schema with 4 tables
- Deployed Edge Function
- Configured 10-minute sync interval

## [Add your changes here]
```

---

## 🎯 SLAs (Self-Imposed)

- **Sync Frequency**: Every 10 minutes ± 1 minute
- **Uptime**: 99.9% (cron jobs running)
- **Data Freshness**: < 10 minutes old
- **Error Rate**: < 5%
- **Response Time**: < 500ms (Supabase queries)

---

## 📞 Support Resources

- **Supabase Discord**: [discord.supabase.com](https://discord.supabase.com)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Jikan API Status**: [status.jikan.moe](https://status.jikan.moe)

---

## ✅ Monthly Checklist

- [ ] Review `latest_sync_status` - all green?
- [ ] Check `sync_logs` error rate - < 5%?
- [ ] Clean old logs (> 30 days)
- [ ] Run VACUUM ANALYZE
- [ ] Check database size - < 50MB?
- [ ] Verify cron jobs running
- [ ] Test manual sync
- [ ] Check Edge Function logs for warnings
- [ ] Review performance metrics
- [ ] Update this document with any issues/fixes

---

**Last Updated:** 2024-10-27
**Next Review:** [Add 1 month from today]
