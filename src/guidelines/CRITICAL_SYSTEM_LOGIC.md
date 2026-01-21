# 🚨 CRITICAL SYSTEM LOGIC - READ THIS FIRST!

## ⚠️ WEEK NUMBER CALCULATION - NEVER CHANGE THIS LOGIC!

### **The CORRECT Way (Used by the system):**

Each season has a **special Week 1** system:

- **Week 1**: From season start (1st of month) to **first Sunday** (partial week, 1-7 days)
- **Week 2+**: Monday to Sunday (full 7-day weeks)

### **Example: Winter 2026**
```
Jan 1 (Wed) = Season Start
Jan 4 (Sun) = First Sunday
Week 1: Jan 1-4   (Wed-Sun, 4 days)
Week 2: Jan 5-11  (Mon-Sun, 7 days)
Week 3: Jan 12-18 (Mon-Sun, 7 days)
Week 4: Jan 19-25 (Mon-Sun, 7 days)
```

### **Implementation:**
See `/supabase/functions/server/season-utils.tsx`:
- `getWeekInSeason()` function (lines 99-126)
- `getEpisodeWeekNumber()` function (lines 132-160)

---

## ❌ WRONG CALCULATIONS (NEVER USE THESE!)

### **❌ WRONG: Simple division by 7**
```sql
-- THIS IS WRONG! DO NOT USE!
FLOOR((aired_at - season_start) / 7) + 1
```
**Why wrong?** Assumes all weeks start on the same day. Ignores partial Week 1.

### **❌ WRONG: Fixed start dates**
```sql
-- THIS IS WRONG! DO NOT USE!
FLOOR((aired_at - 'Jan 1') / 7) + 1
```
**Why wrong?** Jan 1 can be any day of the week. Week 1 length varies.

---

## ✅ CORRECT SQL FOR RECALCULATION

**Always use this SQL function:**

```sql
CREATE OR REPLACE FUNCTION calculate_correct_week_number(
  p_aired_at TIMESTAMP WITH TIME ZONE,
  p_season TEXT,
  p_year INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  season_start DATE;
  first_sunday DATE;
  first_monday DATE;
  days_from_monday INTEGER;
  week_num INTEGER;
BEGIN
  season_start := CASE p_season
    WHEN 'winter' THEN make_date(p_year, 1, 1)
    WHEN 'spring' THEN make_date(p_year, 4, 1)
    WHEN 'summer' THEN make_date(p_year, 7, 1)
    WHEN 'fall' THEN make_date(p_year, 10, 1)
    ELSE make_date(p_year, 1, 1)
  END;
  
  first_sunday := season_start + ((7 - EXTRACT(DOW FROM season_start)::INTEGER) % 7);
  
  IF p_aired_at::DATE BETWEEN season_start AND first_sunday THEN
    RETURN 1;
  END IF;
  
  first_monday := first_sunday + 1;
  days_from_monday := p_aired_at::DATE - first_monday;
  week_num := FLOOR(days_from_monday / 7) + 2;
  
  RETURN GREATEST(1, LEAST(15, week_num));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Usage:
UPDATE weekly_episodes
SET week_number = calculate_correct_week_number(aired_at, season, year)
WHERE aired_at IS NOT NULL;
```

---

## 🔒 OTHER CRITICAL RULES

### **1. Episodes WITHOUT scores (NULL) should:**
- ❌ NOT have `position_in_week` 
- ❌ NOT show rank on frontend
- ❌ NOT show trend indicators

### **2. Anime with 100+ episodes:**
- Each episode gets its OWN season/year based on `aired_at`
- Example: Anime starts Spring 2023, but EP50 airs Fall 2023 → EP50 is "Fall 2023"

### **3. Season/Year detection:**
- Always use `aired_at` to determine season/year
- NEVER use the anime's original season from `season_rankings`

### **4. Edge Functions that handle episodes:**
- `insert-weekly-episodes` ✅ Uses correct logic
- `update-weekly-episodes` ⚠️ Check if hardcoded to Winter 2026
- `sync-past-anime-data` ✅ Uses correct logic (after fix)

---

## 📋 CHECKLIST FOR ANY WEEK_NUMBER CHANGES

Before modifying week_number calculation:

- [ ] Did you consult `/supabase/functions/server/season-utils.tsx`?
- [ ] Does it handle partial Week 1 (season start to first Sunday)?
- [ ] Does it handle full weeks (Monday-Sunday)?
- [ ] Did you test with multiple season start days (Wed, Thu, Fri, etc.)?
- [ ] Did you verify `position_in_week` ranks are correct after?

---

**🚨 IF YOU BREAK THIS, THE ENTIRE RANKING SYSTEM BREAKS! 🚨**

Last incident: January 20, 2026 - Wrong SQL caused 442 episodes in one week
