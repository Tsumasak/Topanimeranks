# 📚 Top Anime Ranks - Guidelines & Documentation

This folder contains **critical technical documentation** for the Top Anime Ranks project.

---

## 🚨 **MUST READ FIRST**

### **[CRITICAL_SYSTEM_LOGIC.md](./CRITICAL_SYSTEM_LOGIC.md)**
**READ THIS BEFORE TOUCHING ANY WEEK/RANKING CODE!**

Contains:
- ✅ Correct week_number calculation logic
- ❌ Common mistakes to avoid
- 📋 SQL functions for recalculation
- 🔒 Critical rules for episodes and rankings

**Last incident:** January 20, 2026 - Wrong SQL caused 442 episodes in one week

---

## 📖 **Development Guidelines**

### **[Guidelines.md](./Guidelines.md)**
General development guidelines and best practices for the project.

### **[CONTROLLER_PATTERN.md](./CONTROLLER_PATTERN.md)**
Architecture patterns and controller structure used in the codebase.

---

## 🗂️ **Related Documentation**

### **Supabase & Database**
See `/supabase/` folder for:
- Migration guides
- Deployment instructions
- Database schema documentation
- Edge function documentation

### **Data Management**
See `/data/` folder for:
- Manual episode management
- Finding missing episodes
- Troubleshooting data issues

---

## 📝 **Quick Reference**

### **Season Structure**
- **Winter:** January - March (starts Jan 1)
- **Spring:** April - June (starts Apr 1)
- **Summer:** July - September (starts Jul 1)
- **Fall:** October - December (starts Oct 1)

### **Week Calculation**
- **Week 1:** Season start → first Sunday (partial, 1-7 days)
- **Week 2+:** Monday → Sunday (full 7-day weeks)

### **Critical Tables**
- `weekly_episodes` - Episodes with weekly rankings
- `season_rankings` - Anime ranked by season
- `anticipated_animes` - Upcoming anime rankings

---

**⚠️ Always consult these guidelines before making system-wide changes!**
