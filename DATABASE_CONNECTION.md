# Database Connection Guide

This document explains how to connect to PostgreSQL using either connection strings or individual parameters.

---

## Connection String Format (Recommended)

The application now supports PostgreSQL connection strings for easier configuration.

### Format

```
postgresql://[user]:[password]@[host]:[port]/[database]
```

### Your Example

Based on your connection string: `postgresql://postgres:root@localhost:5433/`

```env
DATABASE_URL=postgresql://postgres:root@localhost:5433/county_subscription
```

---

## Setup Instructions

### Option 1: Using Connection String (Recommended)

**1. Create `.env.local` file:**

```bash
# In the project root
touch .env.local
```

**2. Add your connection string:**

```env
DATABASE_URL=postgresql://postgres:root@localhost:5433/county_subscription
```

**3. That's it!** The application will use this connection string.

---

### Option 2: Using Individual Parameters (Alternative)

If you prefer, you can use individual parameters instead:

```env
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=root
DB_NAME=county_subscription
```

---

## Connection String Breakdown

Using your example: `postgresql://postgres:root@localhost:5433/county_subscription`

| Component | Value | Description |
|-----------|-------|-------------|
| Protocol | `postgresql://` | Database type |
| User | `postgres` | Database username |
| Password | `root` | Database password |
| Host | `localhost` | Server address |
| Port | `5433` | Port number |
| Database | `county_subscription` | Database name |

---

## Examples for Different Scenarios

### Local Development (Port 5432)
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/county_subscription
```

### Local Development (Port 5433 - Your Case)
```env
DATABASE_URL=postgresql://postgres:root@localhost:5433/county_subscription
```

### Remote Server
```env
DATABASE_URL=postgresql://dbuser:secretpass@db.example.com:5432/county_subscription
```

### Docker Container
```env
DATABASE_URL=postgresql://postgres:password@postgres:5432/county_subscription
```

### Heroku/Render (with SSL)
```env
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

---

## Testing Your Connection

### Method 1: Using psql Command

```bash
# Using connection string
psql postgresql://postgres:root@localhost:5433/county_subscription

# Should connect successfully and show:
# county_subscription=#
```

### Method 2: Test in Application

```bash
# Start the dev server
npm run dev

# Check console output
# Should see: "Connected to PostgreSQL database"
```

### Method 3: Test API Endpoint

```bash
# Make a test request
curl http://localhost:3000/api/states

# Should return JSON with states
```

---

## Creating the Database

If the database doesn't exist yet, create it first:

### Using psql with Connection String

```bash
# Connect to default postgres database
psql postgresql://postgres:root@localhost:5433/postgres

# Create the database
CREATE DATABASE county_subscription;

# Exit
\q
```

### Or create without entering psql

```bash
psql postgresql://postgres:root@localhost:5433/postgres -c "CREATE DATABASE county_subscription"
```

---

## Running the Schema

### Option 1: Using psql with Connection String

```bash
psql postgresql://postgres:root@localhost:5433/county_subscription -f database/schema.sql
```

### Option 2: Using psql interactively

```bash
# Connect to database
psql postgresql://postgres:root@localhost:5433/county_subscription

# Run the schema
\i database/schema.sql

# Exit
\q
```

---

## Seeding the Database

The seed script also supports connection strings:

```bash
# Set environment variable (Windows CMD)
set DATABASE_URL=postgresql://postgres:root@localhost:5433/county_subscription

# Set environment variable (Windows PowerShell)
$env:DATABASE_URL="postgresql://postgres:root@localhost:5433/county_subscription"

# Set environment variable (Mac/Linux)
export DATABASE_URL=postgresql://postgres:root@localhost:5433/county_subscription

# Run seed script
node database/seed-counties.js
```

**Or** just create `.env.local` with `DATABASE_URL` and run:

```bash
node database/seed-counties.js
```

The script will automatically read from `.env.local`.

---

## Priority Order

The application checks for database configuration in this order:

1. **First**: Check for `DATABASE_URL` environment variable
2. **Second**: Use individual parameters (DB_HOST, DB_PORT, etc.)
3. **Third**: Use default values (localhost:5432)

```javascript
// This is how it works internally:
process.env.DATABASE_URL
  ? Use connection string
  : Use individual parameters or defaults
```

---

## Complete Setup Example (Your Configuration)

**Step 1: Create `.env.local`**

```env
DATABASE_URL=postgresql://postgres:root@localhost:5433/county_subscription
```

**Step 2: Create Database**

```bash
psql postgresql://postgres:root@localhost:5433/postgres -c "CREATE DATABASE county_subscription"
```

**Step 3: Run Schema**

```bash
psql postgresql://postgres:root@localhost:5433/county_subscription -f database/schema.sql
```

**Step 4: Seed Database**

```bash
node database/seed-counties.js
```

**Step 5: Start Application**

```bash
npm run dev
```

**Step 6: Test**

```bash
curl http://localhost:3000/api/states
```

---

## Troubleshooting

### Error: "Connection refused"

**Problem**: Can't connect to PostgreSQL

**Solutions**:
1. Check PostgreSQL is running
2. Verify port number (5433 in your case, not default 5432)
3. Test connection with psql first

```bash
psql postgresql://postgres:root@localhost:5433/postgres
```

---

### Error: "Password authentication failed"

**Problem**: Wrong password

**Solution**: Verify password in connection string

```bash
# Test with psql
psql postgresql://postgres:root@localhost:5433/postgres
# If this works, your credentials are correct
```

---

### Error: "Database does not exist"

**Problem**: Database not created yet

**Solution**: Create the database first

```bash
psql postgresql://postgres:root@localhost:5433/postgres -c "CREATE DATABASE county_subscription"
```

---

### Error: "Port 5432 connection refused" (but you use 5433)

**Problem**: Application is trying to connect to default port

**Solution**: Make sure `DATABASE_URL` is set correctly in `.env.local`:

```env
DATABASE_URL=postgresql://postgres:root@localhost:5433/county_subscription
```

---

## Environment Variables Reference

### Connection String Method

```env
# Required
DATABASE_URL=postgresql://user:password@host:port/database

# Optional (for SSL)
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

### Individual Parameters Method

```env
# All optional (with defaults shown)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=county_subscription
```

---

## Security Best Practices

1. **Never commit `.env.local`** to version control
   - Already in `.gitignore`
   - Use `.env.local.example` for templates

2. **Use strong passwords** in production
   - Not "root" or "postgres"
   - Use password generators

3. **Use SSL in production**
   ```env
   DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
   ```

4. **Restrict database access**
   - Only allow connections from application server
   - Use firewall rules

---

## Quick Commands Cheat Sheet

```bash
# Connect to database
psql postgresql://postgres:root@localhost:5433/county_subscription

# Create database
psql postgresql://postgres:root@localhost:5433/postgres -c "CREATE DATABASE county_subscription"

# Run schema
psql postgresql://postgres:root@localhost:5433/county_subscription -f database/schema.sql

# Check connection in psql
\conninfo

# List databases
\l

# List tables
\dt

# Exit psql
\q
```

---

## Your Complete Configuration

Based on your connection string `postgresql://postgres:root@localhost:5433/`:

### `.env.local` file:
```env
DATABASE_URL=postgresql://postgres:root@localhost:5433/county_subscription
```

### Complete setup:
```bash
# 1. Create database
psql postgresql://postgres:root@localhost:5433/postgres -c "CREATE DATABASE county_subscription"

# 2. Run schema
psql postgresql://postgres:root@localhost:5433/county_subscription -f database/schema.sql

# 3. Seed data
node database/seed-counties.js

# 4. Start app
npm run dev

# 5. Test
curl http://localhost:3000/api/states
```

---

**That's it! Your application is now configured to use PostgreSQL on port 5433!** 🎉
