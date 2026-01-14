# Quick Reference Guide

One-page reference for the County Subscription Availability Checker application.

---

## 🚀 Quick Start (Copy & Paste)

```bash
# 1. Create database
psql -U postgres -c "CREATE DATABASE county_subscription;"

# 2. Run schema
psql -U postgres -d county_subscription -f database/schema.sql

# 3. Configure environment
cp .env.local.example .env.local
# Edit .env.local with your database password

# 4. Seed database
node database/seed-counties.js

# 5. Start server
npm run dev

# Visit: http://localhost:3000
```

---

## 📁 File Structure (What Goes Where)

```
offer-page/
├── app/
│   ├── api/              ← Backend API endpoints
│   ├── components/       ← UI components
│   ├── layout.jsx        ← Site layout & metadata
│   └── page.jsx          ← Main homepage
├── database/
│   ├── schema.sql        ← Database structure
│   └── seed-counties.js  ← Populate database
├── lib/
│   └── db.js             ← Database connection
└── .env.local            ← Database credentials (create this!)
```

---

## 🔌 API Endpoints

| Method | Endpoint | Purpose | Returns |
|--------|----------|---------|---------|
| GET | `/api/states` | All US states | 51 states |
| GET | `/api/counties/:stateId` | Counties for state | Array of counties |
| GET | `/api/county-status/:countyId` | County status | available/partially_locked/fully_locked |
| POST | `/api/free-trial` | Free trial signup | Success/error |

**Quick Test:**
```bash
curl http://localhost:3000/api/states
```

---

## 🗄️ Database Quick Commands

```bash
# Connect
psql -U postgres -d county_subscription

# Useful queries
SELECT COUNT(*) FROM States;        # Should be 51
SELECT COUNT(*) FROM Counties;      # Should be 3000+

# Check status distribution
SELECT status, COUNT(*) FROM Counties GROUP BY status;

# Find available county
SELECT county_id, name FROM Counties WHERE status = 'available' LIMIT 1;

# Change county status (for testing)
UPDATE Counties SET status = 'available' WHERE county_id = 123;
```

---

## 🎨 Component Status Map

| County Status | Component | Features |
|---------------|-----------|----------|
| `available` | AvailableComponent | ✅ Free trial banner<br>✅ Email form<br>✅ 3 paid plans |
| `partially_locked` | PartiallyLockedComponent | ❌ No free trial<br>✅ 3 paid plans |
| `fully_locked` | FullyLockedComponent | ❌ No plans<br>✅ "Search another" button |

---

## 🐛 Troubleshooting Quick Fixes

| Error | Solution |
|-------|----------|
| "ECONNREFUSED" | Start PostgreSQL: `net start postgresql-x64-14` (Windows) |
| "database does not exist" | Run: `psql -U postgres -c "CREATE DATABASE county_subscription;"` |
| "relation does not exist" | Run: `psql -U postgres -d county_subscription -f database/schema.sql` |
| "Port 3000 in use" | Run on different port: `PORT=3001 npm run dev` |
| No counties in dropdown | Check database has data: `SELECT COUNT(*) FROM Counties;` |
| API returns empty array | Re-seed database: `node database/seed-counties.js` |

---

## 🔑 Environment Variables

```env
# .env.local
DB_HOST=localhost
DB_PORT=5432
DB_NAME=county_subscription
DB_USER=postgres
DB_PASSWORD=your_password_here
```

---

## 📊 Status Flow Logic

```
User Selects County
    ↓
Check Status in Database
    ↓
┌───────────┼───────────┐
│           │           │
available   partially   fully
            locked      locked
│           │           │
↓           ↓           ↓
Free Trial  Paid Only   Unavailable
+ Paid      Plans       (Search other)
```

---

## 🎯 Common User Journeys

### Journey 1: Happy Path
1. Select state → Select county → See "FREE TRIAL"
2. Enter email → Submit → Success!

### Journey 2: No Free Trial
1. Select state → Select county → See "No free trial"
2. Review paid plans → Click "Get Started"

### Journey 3: County Occupied
1. Select state → Select county → See "Not available"
2. Click "Search Another" → Try different county

---

## 🧪 Quick API Tests

```bash
# Get all states
curl http://localhost:3000/api/states | json_pp

# Get Texas counties (state_id might vary)
curl http://localhost:3000/api/counties/44 | json_pp

# Check county status
curl http://localhost:3000/api/county-status/1 | json_pp

# Submit free trial
curl -X POST http://localhost:3000/api/free-trial \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","county_id":1}'
```

---

## 📝 Database Schema Quick Reference

### States Table
```sql
state_id (PK) | name (VARCHAR) | abbreviation (CHAR)
```

### Counties Table
```sql
county_id (PK) | name (VARCHAR) | state_id (FK) | status (VARCHAR)
```
**Status values:** `available`, `partially_locked`, `fully_locked`

### Offers Table
```sql
offer_id (PK) | name (VARCHAR) | price (DECIMAL) | tier_level (INT)
```
**Tiers:** 0=Free, 1=Basic, 2=Plus, 3=Pro

---

## 🚢 Deployment Checklist

- [ ] PostgreSQL database created
- [ ] Schema applied
- [ ] Data seeded
- [ ] Environment variables set
- [ ] `npm run build` succeeds
- [ ] All API endpoints tested
- [ ] Mobile responsive verified

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| [README.md](README.md) | Full documentation |
| [SETUP.md](SETUP.md) | Setup guide |
| [USER_JOURNEYS.md](USER_JOURNEYS.md) | 8 detailed user scenarios |
| [USER_FLOWS.md](USER_FLOWS.md) | Visual flow diagrams |
| [TESTING_SCENARIOS.md](TESTING_SCENARIOS.md) | Testing examples |
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | This file! |

---

## 🔧 Useful Scripts

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm start            # Run production server

# Database
node database/seed-counties.js    # Seed database
psql -U postgres -d county_subscription -f database/schema.sql  # Apply schema

# Testing
curl http://localhost:3000/api/states  # Quick API test
```

---

## 💡 Key Features at a Glance

✅ **51 US states** with full county data
✅ **3,000+ counties** with status tracking
✅ **Real-time API** accessible externally
✅ **Three status types** with conditional rendering
✅ **Email form submission** for free trials
✅ **Mobile responsive** design
✅ **PostgreSQL database** with connection pooling
✅ **Next.js 15** with App Router
✅ **RESTful API** endpoints
✅ **Error handling** throughout

---

## 🎓 Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, Tailwind CSS 4 |
| Backend | Next.js API Routes |
| Database | PostgreSQL |
| DB Client | node-postgres (pg) |
| Icons | Lucide React |
| Styling | Tailwind CSS |

---

## 📞 Need More Help?

- **Setup issues**: See [SETUP.md](SETUP.md)
- **User flows**: See [USER_JOURNEYS.md](USER_JOURNEYS.md)
- **Testing**: See [TESTING_SCENARIOS.md](TESTING_SCENARIOS.md)
- **Architecture**: See [README.md](README.md)

---

## 🎉 Success Indicators

You know it's working when:

✅ Visit http://localhost:3000 - Page loads
✅ Select a state - Counties populate
✅ Select county - Status displays correctly
✅ Available county - See free trial form
✅ Submit email - Success message appears
✅ API calls work - `curl http://localhost:3000/api/states` returns data

---

**That's it! You're ready to go! 🚀**

For detailed information, see the comprehensive documentation files listed above.
