-- County Subscription Availability Checker Database Schema

-- Users Table (for application users)
CREATE TABLE IF NOT EXISTS Users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- NextAuth Tables (for authentication)
-- Note: These use TEXT for user_id for NextAuth compatibility
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

-- Admin Users Table (for admin panel authentication)
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

-- Admin Activity Log Table (audit trail for admin actions)
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

-- States Table
CREATE TABLE IF NOT EXISTS States (
    state_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    abbreviation CHAR(2) NOT NULL UNIQUE
);

-- Counties Table (with the important status column)
CREATE TABLE IF NOT EXISTS Counties (
    county_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    state_id INT NOT NULL REFERENCES States(state_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'available',
    CONSTRAINT chk_status CHECK (status IN ('available', 'partially_locked', 'fully_locked'))
);

-- Offers Table
CREATE TABLE IF NOT EXISTS Offers (
    offer_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    tier_level INT NOT NULL -- e.g., 0=Free, 1=Basic, 2=Plus, 3=Pro
);

-- Subscriptions Table (for record-keeping)
CREATE TABLE IF NOT EXISTS Subscriptions (
    subscription_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    county_id INT NOT NULL REFERENCES Counties(county_id) ON DELETE CASCADE,
    offer_id INT NOT NULL REFERENCES Offers(offer_id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    CONSTRAINT chk_subscription_status CHECK (status IN ('active', 'expired', 'cancelled'))
);

-- Trial Registrations Table (tracks free trial usage per county)
CREATE TABLE IF NOT EXISTS TrialRegistrations (
    trial_registration_id SERIAL PRIMARY KEY,
    county_id INT NOT NULL REFERENCES Counties(county_id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    bidsquire_user_id VARCHAR(255),
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    CONSTRAINT chk_trial_registration_status CHECK (status IN ('active', 'cancelled', 'upgraded')),
    CONSTRAINT unique_trial_per_county UNIQUE (county_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_counties_state_id ON Counties(state_id);
CREATE INDEX IF NOT EXISTS idx_counties_status ON Counties(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON Subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_county_id ON Subscriptions(county_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON Subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_trial_registrations_county_id ON TrialRegistrations(county_id);
CREATE INDEX IF NOT EXISTS idx_trial_registrations_email ON TrialRegistrations(email);
CREATE INDEX IF NOT EXISTS idx_trial_registrations_status ON TrialRegistrations(status);
