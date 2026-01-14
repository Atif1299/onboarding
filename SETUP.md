# Quick Setup Guide

Follow these steps to get the County Subscription Availability Checker running on your local machine.

## Prerequisites Check

```bash
# Check Node.js version (should be 18+)
node --version

# Check PostgreSQL version (should be 12+)
psql --version

# Check npm version
npm --version
```

## Quick Start (5 Minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Setup PostgreSQL Database

**Option A: Using psql command line**
```bash
# Create database
psql -U postgres -c "CREATE DATABASE county_subscription;"

# Run schema
psql -U postgres -d county_subscription -f database/schema.sql
```

**Option B: Using pgAdmin or any PostgreSQL GUI**
1. Create a new database named `county_subscription`
2. Run the SQL from `database/schema.sql`

### Step 3: Configure Environment

Create `.env.local` file:
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=county_subscription
DB_USER=postgres
DB_PASSWORD=YOUR_PASSWORD_HERE
```

### Step 4: Seed Database
```bash
node database/seed-counties.js
```

Expected output:
```
Starting database seeding...

Inserting states...
✓ States inserted successfully

Inserting counties...

✓ Database seeded successfully!

Statistics:
- Total states: 51
- Total counties: 3000+
- Available: ~2100
- Partially locked: ~600
- Fully locked: ~300
- Total offers: 4

✓ Seeding completed successfully!
```

### Step 5: Run Development Server
```bash
npm run dev
```

Visit: **http://localhost:3000**

## Troubleshooting

### Database Connection Errors

**Error: "ECONNREFUSED"**
- PostgreSQL is not running
- Solution: Start PostgreSQL service
  ```bash
  # Windows
  net start postgresql-x64-14

  # Mac
  brew services start postgresql

  # Linux
  sudo systemctl start postgresql
  ```

**Error: "password authentication failed"**
- Incorrect database credentials
- Solution: Update `.env.local` with correct credentials

**Error: "database does not exist"**
- Database not created
- Solution: Run `psql -U postgres -c "CREATE DATABASE county_subscription;"`

### Seeding Errors

**Error: "Cannot find module"**
- Dependencies not installed
- Solution: Run `npm install`

**Error: "relation does not exist"**
- Schema not created
- Solution: Run `psql -U postgres -d county_subscription -f database/schema.sql`

### Port Already in Use

**Error: "Port 3000 is already in use"**
- Another process is using port 3000
- Solution:
  - Kill the process or
  - Run on different port: `PORT=3001 npm run dev`

## Verifying Installation

### Check Database
```bash
# Connect to database
psql -U postgres -d county_subscription

# Verify tables
\dt

# Check states count
SELECT COUNT(*) FROM States;

# Check counties count
SELECT COUNT(*) FROM Counties;

# Exit
\q
```

### Check API Endpoints

Once dev server is running, test these URLs in your browser:

1. **States**: http://localhost:3000/api/states
2. **Counties** (example for Alabama, state_id=1): http://localhost:3000/api/counties/1
3. **County Status** (example): http://localhost:3000/api/county-status/1

All should return JSON responses.

## Next Steps

1. ✅ Open http://localhost:3000
2. ✅ Select a state from dropdown
3. ✅ Select a county
4. ✅ See pricing based on county status
5. ✅ Try free trial signup (for available counties)

## Production Deployment

See [README.md](README.md#deployment) for deployment instructions.

## Need Help?

- Check [README.md](README.md) for detailed documentation
- Review API endpoint documentation
- Check database schema in `database/schema.sql`

## Common Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Re-seed database (WARNING: This may reset data)
node database/seed-counties.js
```
