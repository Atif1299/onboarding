# Database Schema Comparison

**Date:** 2025-10-23
**Purpose:** Compare schema.sql file with actual database and identify inconsistencies

## Summary

**Schema File Tables:** 6 tables defined
**Actual Database Tables:** 10 tables present

## Comparison Results

### ✅ Tables in BOTH Schema File and Database (Matching)

#### 1. **Users**
- **Schema File:** ✓ Defined
- **Database:** ✓ Present
- **Status:** ✅ MATCH
- Columns match schema definition

#### 2. **States**
- **Schema File:** ✓ Defined
- **Database:** ✓ Present
- **Status:** ✅ MATCH
- Columns match schema definition

#### 3. **Counties**
- **Schema File:** ✓ Defined
- **Database:** ✓ Present
- **Status:** ✅ MATCH
- Columns match schema definition
- Indexes match: idx_counties_state_id, idx_counties_status

#### 4. **Offers**
- **Schema File:** ✓ Defined
- **Database:** ✓ Present
- **Status:** ✅ MATCH
- Columns match schema definition

#### 5. **Subscriptions**
- **Schema File:** ✓ Defined
- **Database:** ✓ Present
- **Status:** ✅ MATCH
- Columns match schema definition
- Indexes match: idx_subscriptions_user_id, idx_subscriptions_county_id, idx_subscriptions_status

#### 6. **TrialRegistrations**
- **Schema File:** ✓ Defined
- **Database:** ✓ Present
- **Status:** ✅ MATCH (Recently Added)
- Columns match schema definition
- Indexes match: idx_trial_registrations_county_id, idx_trial_registrations_email, idx_trial_registrations_status
- Constraints match: unique_trial_per_county, chk_trial_registration_status

---

### ⚠️ Tables in Database but NOT in Schema File (Extra Tables)

These tables exist in the database but are not defined in the schema.sql file:

#### 1. **accounts**
- **Purpose:** NextAuth session management
- **Columns:** 14 columns including provider info, tokens, timestamps
- **Foreign Keys:** References users (via user_id text field)
- **Status:** ⚠️ NOT IN SCHEMA FILE
- **Recommendation:** Add to schema.sql for completeness

#### 2. **sessions**
- **Purpose:** NextAuth session storage
- **Columns:** id, session_token, user_id, expires, created_at, updated_at
- **Status:** ⚠️ NOT IN SCHEMA FILE
- **Recommendation:** Add to schema.sql for completeness

#### 3. **admin_users**
- **Purpose:** Admin authentication and authorization
- **Columns:** admin_id, username, email, password_hash, full_name, role, is_active, timestamps
- **Constraints:** Role check (admin/super_admin)
- **Status:** ⚠️ NOT IN SCHEMA FILE
- **Recommendation:** Add to schema.sql for completeness

#### 4. **admin_activity_log**
- **Purpose:** Audit trail for admin actions
- **Columns:** log_id, admin_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent, created_at
- **Foreign Keys:** References admin_users
- **Status:** ⚠️ NOT IN SCHEMA FILE
- **Recommendation:** Add to schema.sql for completeness

---

## Detailed Inconsistencies

### 1. Missing NextAuth Tables in Schema File

**Issue:** NextAuth creates `accounts` and `sessions` tables but they're not in schema.sql

**Impact:**
- Schema file is incomplete
- New database setups might not have these tables
- Documentation doesn't reflect actual database structure

**Recommendation:** Add NextAuth schema to schema.sql

### 2. Missing Admin Tables in Schema File

**Issue:** Admin functionality uses `admin_users` and `admin_activity_log` tables but they're not in schema.sql

**Impact:**
- Schema file is incomplete
- Admin functionality won't work on fresh database setup
- No documented admin schema

**Recommendation:** Add admin tables to schema.sql

---

## Data Type Differences

### Users Table - User ID Mismatch

**Schema File Definition:**
```sql
user_id SERIAL PRIMARY KEY  -- INTEGER type
```

**Database Reality:**
- `users.user_id` = INTEGER (matches schema) ✅
- `accounts.user_id` = TEXT (for NextAuth compatibility) ⚠️
- `sessions.user_id` = TEXT (for NextAuth compatibility) ⚠️

**Issue:** There's a disconnect between the integer user_id in users table and text user_id in NextAuth tables

**Impact:**
- Potential foreign key relationship issues
- No direct FK constraint between users and accounts/sessions tables

**Recommendation:**
- Document this intentional design choice
- OR unify to use integer user_id across all tables

---

## Recommendations

### HIGH PRIORITY

1. **Add Missing Tables to schema.sql**
   - Add accounts table definition
   - Add sessions table definition
   - Add admin_users table definition
   - Add admin_activity_log table definition

2. **Document User ID Strategy**
   - Clarify why accounts/sessions use TEXT while users use INTEGER
   - Add comments in schema file explaining the design choice

### MEDIUM PRIORITY

3. **Create Migration Scripts**
   - Add migration script for NextAuth tables
   - Add migration script for Admin tables
   - Document migration order/dependencies

4. **Schema Versioning**
   - Add schema version tracking table
   - Track which migrations have been applied

### LOW PRIORITY

5. **Documentation**
   - Create ER diagram showing all relationships
   - Document each table's purpose
   - Add examples of common queries

---

## Schema File Updates Needed

To make schema.sql match the actual database, add:

```sql
-- NextAuth Tables
CREATE TABLE IF NOT EXISTS Accounts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_account_id TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT accounts_provider_provider_account_id_unique UNIQUE (provider, provider_account_id)
);

CREATE TABLE IF NOT EXISTS Sessions (
    id TEXT PRIMARY KEY,
    session_token TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Admin Tables
CREATE TABLE IF NOT EXISTS Admin_Users (
    admin_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    CONSTRAINT admin_users_role_check CHECK (role IN ('admin', 'super_admin'))
);

CREATE TABLE IF NOT EXISTS Admin_Activity_Log (
    log_id SERIAL PRIMARY KEY,
    admin_id INT REFERENCES Admin_Users(admin_id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id INT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## Conclusion

**Overall Status:** ⚠️ **PARTIAL MATCH**

- ✅ Core application tables (6/6) match perfectly
- ⚠️ 4 additional tables exist in database but not in schema file
- ⚠️ User ID type inconsistency between core and NextAuth tables

**Action Required:** Update schema.sql to include all tables for complete documentation and reproducibility.
