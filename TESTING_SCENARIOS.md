# Testing Scenarios & Examples

This document provides practical testing scenarios and examples for the County Subscription Availability Checker application.

---

## Table of Contents

1. [API Testing Examples](#api-testing-examples)
2. [Frontend Testing Scenarios](#frontend-testing-scenarios)
3. [Database Testing](#database-testing)
4. [Integration Testing](#integration-testing)
5. [Edge Cases](#edge-cases)
6. [Performance Testing](#performance-testing)

---

## API Testing Examples

### 1. Test GET /api/states

**Test: Fetch all states**

```bash
curl http://localhost:3000/api/states
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "state_id": 1,
      "name": "Alabama",
      "abbreviation": "AL"
    },
    {
      "state_id": 2,
      "name": "Alaska",
      "abbreviation": "AK"
    }
    // ... 49 more states
  ]
}
```

**Validation Checks:**
- ✅ Status code: 200
- ✅ Response has `success: true`
- ✅ Data array contains 51 items (50 states + DC)
- ✅ Each state has `state_id`, `name`, `abbreviation`
- ✅ States are sorted alphabetically

---

### 2. Test GET /api/counties/:stateId

**Test: Fetch counties for California (state_id: 5)**

```bash
curl http://localhost:3000/api/counties/5
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "county_id": 123,
      "name": "Alameda County",
      "status": "available"
    },
    {
      "county_id": 124,
      "name": "Alpine County",
      "status": "partially_locked"
    }
    // ... more counties
  ]
}
```

**Test Cases:**

#### Valid State ID
```bash
curl http://localhost:3000/api/counties/5
# Expected: 200, ~58 California counties
```

#### Invalid State ID
```bash
curl http://localhost:3000/api/counties/999
# Expected: 200, empty data array []
```

#### Missing State ID
```bash
curl http://localhost:3000/api/counties/
# Expected: 404 (route not found)
```

#### Non-numeric State ID
```bash
curl http://localhost:3000/api/counties/abc
# Expected: 200, empty data array (no match)
```

---

### 3. Test GET /api/county-status/:countyId

**Test: Check status of specific county**

```bash
curl http://localhost:3000/api/county-status/123
```

**Expected Responses:**

#### Available County
```json
{
  "success": true,
  "data": {
    "county_id": 123,
    "name": "Alameda County",
    "status": "available",
    "state_id": 5
  }
}
```

#### Partially Locked County
```json
{
  "success": true,
  "data": {
    "county_id": 456,
    "name": "Cook County",
    "status": "partially_locked",
    "state_id": 14
  }
}
```

#### Fully Locked County
```json
{
  "success": true,
  "data": {
    "county_id": 789,
    "name": "Miami-Dade County",
    "status": "fully_locked",
    "state_id": 10
  }
}
```

#### County Not Found
```bash
curl http://localhost:3000/api/county-status/99999
```

```json
{
  "success": false,
  "error": "County not found"
}
```
Status: 404

---

### 4. Test POST /api/free-trial

**Test: Submit free trial registration**

#### Successful Registration
```bash
curl -X POST http://localhost:3000/api/free-trial \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "county_id": 123
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Free trial registration successful",
  "data": {
    "email": "user@example.com",
    "county_id": 123,
    "county_name": "Alameda County"
  }
}
```
Status: 201

#### Invalid Email Format
```bash
curl -X POST http://localhost:3000/api/free-trial \
  -H "Content-Type: application/json" \
  -d '{
    "email": "notanemail",
    "county_id": 123
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Invalid email format"
}
```
Status: 400

#### Missing Required Fields
```bash
curl -X POST http://localhost:3000/api/free-trial \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Email and county_id are required"
}
```
Status: 400

#### County Not Available
```bash
curl -X POST http://localhost:3000/api/free-trial \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "county_id": 789
  }'
```
*(Assuming county 789 is fully_locked)*

**Expected Response:**
```json
{
  "success": false,
  "error": "Free trial is not available for this county",
  "county_status": "fully_locked"
}
```
Status: 400

#### County Does Not Exist
```bash
curl -X POST http://localhost:3000/api/free-trial \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "county_id": 99999
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "County not found"
}
```
Status: 404

---

## Frontend Testing Scenarios

### Scenario 1: Initial Page Load

**Test Steps:**
1. Open `http://localhost:3000`
2. Wait for page to load

**Expected Results:**
- ✅ Hero section displays: "Find Your Exclusive County"
- ✅ State dropdown shows "Loading states..." then populates
- ✅ County dropdown is disabled with placeholder: "Please select a state first"
- ✅ No pricing cards are visible
- ✅ No error messages display

**Debug:**
```javascript
// Check browser console
// Should see: "Executed query", "Connected to PostgreSQL database"
```

---

### Scenario 2: State Selection

**Test Steps:**
1. Click on state dropdown
2. Scroll to "Texas"
3. Click "Texas"

**Expected Results:**
- ✅ County dropdown becomes enabled
- ✅ Placeholder changes to "Search for a county..."
- ✅ Counties are loaded (should see 254 Texas counties)
- ✅ Selected state displays: "Selected: [County], Texas" (after county selection)

**Debug:**
```javascript
// Network tab should show:
// GET /api/counties/44 (200 OK)
```

---

### Scenario 3: County Search

**Test Steps:**
1. Select state: "California"
2. Click county search input
3. Type "Los"
4. Observe dropdown

**Expected Results:**
- ✅ Dropdown opens automatically on focus
- ✅ List filters to show only matching counties
- ✅ Shows "Los Angeles County"
- ✅ Case-insensitive search works
- ✅ If no matches, shows "No counties found."

---

### Scenario 4: Available County Display

**Test Steps:**
1. Select state
2. Select county with `available` status
3. Observe displayed components

**Expected Results:**
- ✅ Loading spinner appears briefly
- ✅ Green "FREE TRIAL is Available" banner displays
- ✅ Email input form is visible
- ✅ Submit button says "Start Your Free Trial"
- ✅ Three pricing cards display below (Basic, Plus, Pro)
- ✅ Pro card has blue/indigo background (featured)

---

### Scenario 5: Free Trial Form Submission

**Test Steps:**
1. Navigate to available county
2. Enter email: "test@example.com"
3. Click "Start Your Free Trial"

**Expected Results:**
- ✅ Button text changes to "Submitting..."
- ✅ Button becomes disabled
- ✅ Success message appears: "Free trial registration successful! Check your email..."
- ✅ Message has green background
- ✅ Email input clears
- ✅ Button re-enables

**Invalid Email Test:**
1. Enter: "notanemail"
2. Click submit

**Expected Results:**
- ✅ HTML5 validation prevents submission
- ✅ Browser shows: "Please enter a valid email address"

---

### Scenario 6: Partially Locked County

**Test Steps:**
1. Select county with `partially_locked` status

**Expected Results:**
- ✅ Blue info banner displays
- ✅ Message: "A plan is already active in [County]. The free trial is no longer available."
- ✅ NO free trial section visible
- ✅ Only three pricing cards display
- ✅ No email input form

---

### Scenario 7: Fully Locked County

**Test Steps:**
1. Select county with `fully_locked` status

**Expected Results:**
- ✅ Orange warning banner with X icon
- ✅ Message: "This County is Not Available"
- ✅ Text: "The Pro plan for [County] has been claimed..."
- ✅ Suggestion: "We recommend exploring a neighboring county"
- ✅ "Search Another County" button visible
- ✅ NO pricing cards visible

**Test Clear Button:**
1. Click "Search Another County"

**Expected Results:**
- ✅ State dropdown resets to "Choose a state..."
- ✅ County dropdown disables
- ✅ County search input clears
- ✅ Pricing section disappears

---

### Scenario 8: Multiple County Comparisons

**Test Steps:**
1. Select Texas
2. Select Travis County → Note status
3. Select Dallas County → Note status
4. Select Harris County → Note status

**Expected Results:**
- ✅ Each selection triggers new API call
- ✅ Loading spinner shows between selections
- ✅ Correct component displays for each status
- ✅ Navigation is smooth and fast
- ✅ No UI glitches or flashing

---

### Scenario 9: Mobile Responsive Testing

**Test Steps:**
1. Open DevTools (F12)
2. Toggle device emulation (iPhone, Android)
3. Test all user flows

**Expected Results:**
- ✅ Layout stacks vertically on small screens
- ✅ Dropdowns are full-width
- ✅ Pricing cards stack in single column
- ✅ Email form stacks vertically
- ✅ Text is readable (not too small)
- ✅ Buttons are large enough to tap
- ✅ No horizontal scrolling

---

## Database Testing

### Test 1: Verify Database Connection

```bash
psql -U postgres -d county_subscription
```

```sql
-- Should connect successfully
-- \c county_subscription

-- List all tables
\dt

-- Expected output:
--  public | counties      | table | postgres
--  public | offers        | table | postgres
--  public | states        | table | postgres
--  public | subscriptions | table | postgres
--  public | users         | table | postgres
```

---

### Test 2: Verify Data Integrity

```sql
-- Count states (should be 51)
SELECT COUNT(*) FROM States;

-- Count counties (should be 3000+)
SELECT COUNT(*) FROM Counties;

-- Count offers (should be 4)
SELECT COUNT(*) FROM Offers;

-- Check status distribution
SELECT status, COUNT(*)
FROM Counties
GROUP BY status;

-- Expected:
-- available          | ~2100
-- partially_locked   | ~600
-- fully_locked       | ~300
```

---

### Test 3: Test Relationships

```sql
-- Verify all counties have valid state_id
SELECT COUNT(*)
FROM Counties
WHERE state_id NOT IN (SELECT state_id FROM States);
-- Expected: 0

-- Get counties for specific state
SELECT c.name, c.status, s.name as state_name
FROM Counties c
JOIN States s ON c.state_id = s.state_id
WHERE s.abbreviation = 'CA'
LIMIT 5;

-- Should return California counties
```

---

### Test 4: Test Status Changes

```sql
-- Find an available county
SELECT county_id, name, status
FROM Counties
WHERE status = 'available'
LIMIT 1;

-- Change status to partially_locked
UPDATE Counties
SET status = 'partially_locked'
WHERE county_id = 1234;

-- Verify change
SELECT status FROM Counties WHERE county_id = 1234;
-- Expected: partially_locked

-- Test in UI: Select that county
-- Should now show PartiallyLockedComponent

-- Revert change
UPDATE Counties
SET status = 'available'
WHERE county_id = 1234;
```

---

## Integration Testing

### Test 1: End-to-End Free Trial Flow

```javascript
// Test script using fetch API

async function testFreeTrialFlow() {
  try {
    // 1. Fetch states
    const statesRes = await fetch('http://localhost:3000/api/states');
    const statesData = await statesRes.json();
    console.log('✓ States fetched:', statesData.data.length);

    // 2. Get California (state_id: 5)
    const ca = statesData.data.find(s => s.abbreviation === 'CA');

    // 3. Fetch CA counties
    const countiesRes = await fetch(`http://localhost:3000/api/counties/${ca.state_id}`);
    const countiesData = await countiesRes.json();
    console.log('✓ Counties fetched:', countiesData.data.length);

    // 4. Find available county
    const availableCounty = countiesData.data.find(c => c.status === 'available');

    if (!availableCounty) {
      console.log('✗ No available county found');
      return;
    }

    console.log('✓ Found available county:', availableCounty.name);

    // 5. Check status
    const statusRes = await fetch(`http://localhost:3000/api/county-status/${availableCounty.county_id}`);
    const statusData = await statusRes.json();
    console.log('✓ Status confirmed:', statusData.data.status);

    // 6. Submit free trial
    const trialRes = await fetch('http://localhost:3000/api/free-trial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        county_id: availableCounty.county_id
      })
    });
    const trialData = await trialRes.json();

    if (trialData.success) {
      console.log('✓ Free trial submitted successfully!');
      console.log('✓ ALL TESTS PASSED');
    } else {
      console.log('✗ Free trial submission failed:', trialData.error);
    }

  } catch (error) {
    console.error('✗ Test failed:', error);
  }
}

// Run test
testFreeTrialFlow();
```

**Expected Console Output:**
```
✓ States fetched: 51
✓ Counties fetched: 58
✓ Found available county: Alameda County
✓ Status confirmed: available
✓ Free trial submitted successfully!
✓ ALL TESTS PASSED
```

---

## Edge Cases

### Edge Case 1: Database Connection Failure

**Simulate:**
```bash
# Stop PostgreSQL
# Windows: net stop postgresql-x64-14
# Mac: brew services stop postgresql
# Linux: sudo systemctl stop postgresql

# Try to access application
curl http://localhost:3000/api/states
```

**Expected Behavior:**
- API returns 500 error
- Frontend shows error message
- User can refresh and retry

---

### Edge Case 2: Very Long County Name

**Test County:**
```sql
-- Insert test county with long name
INSERT INTO Counties (name, state_id, status)
VALUES ('Very Long County Name That Should Still Display Correctly In The Dropdown', 5, 'available');
```

**Expected Behavior:**
- Name displays fully in dropdown
- No text overflow
- Clickable area works correctly

---

### Edge Case 3: Special Characters in Search

**Test Steps:**
1. Select state
2. Type in county search: `O'Brien` or `St. Mary`

**Expected Behavior:**
- Search handles apostrophes correctly
- Periods and spaces don't break search
- Results filter correctly

---

### Edge Case 4: Rapid State Changes

**Test Steps:**
1. Quickly click through multiple states
2. Don't wait for counties to load

**Expected Behavior:**
- Only the latest county request completes
- No race conditions
- No stale data displayed
- Loading states handled properly

---

### Edge Case 5: Empty Email Submission

**Test Steps:**
1. Navigate to available county
2. Leave email blank
3. Click submit

**Expected Behavior:**
- HTML5 required attribute prevents submission
- Browser shows: "Please fill out this field"

---

## Performance Testing

### Test 1: API Response Times

```bash
# Install httpie (better than curl)
# pip install httpie

# Test states endpoint
time http GET http://localhost:3000/api/states

# Expected: < 100ms

# Test counties endpoint (large state)
time http GET http://localhost:3000/api/counties/44

# Expected: < 200ms
```

**Performance Benchmarks:**
- States API: < 100ms
- Counties API: < 200ms
- County Status: < 100ms
- Free Trial POST: < 150ms

---

### Test 2: Database Query Performance

```sql
-- Enable timing
\timing on

-- Test queries
SELECT * FROM States;
-- Expected: ~5ms

SELECT * FROM Counties WHERE state_id = 5;
-- Expected: ~10ms

SELECT * FROM Counties WHERE county_id = 1234;
-- Expected: ~2ms (indexed)
```

---

### Test 3: Frontend Load Performance

**Test with Lighthouse:**
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Run audit

**Target Scores:**
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90

---

## Automated Testing Template

```javascript
// tests/api.test.js

describe('API Endpoints', () => {

  test('GET /api/states returns all states', async () => {
    const res = await fetch('http://localhost:3000/api/states');
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(51);
  });

  test('GET /api/counties/:stateId returns counties', async () => {
    const res = await fetch('http://localhost:3000/api/counties/5');
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('POST /api/free-trial validates email', async () => {
    const res = await fetch('http://localhost:3000/api/free-trial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'invalid',
        county_id: 123
      })
    });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('email');
  });

});
```

---

## Testing Checklist

### Before Production Deployment

- [ ] All API endpoints return correct status codes
- [ ] Database queries are optimized (use indexes)
- [ ] Error handling works for all scenarios
- [ ] Form validation prevents invalid submissions
- [ ] Mobile responsiveness tested on real devices
- [ ] Performance benchmarks met
- [ ] Security: SQL injection prevention verified
- [ ] Environment variables configured
- [ ] Database backups configured
- [ ] Monitoring and logging set up

### User Acceptance Testing

- [ ] Free trial signup works end-to-end
- [ ] All three status types display correctly
- [ ] County search filters accurately
- [ ] Error messages are user-friendly
- [ ] Loading states provide feedback
- [ ] Navigation is intuitive
- [ ] Design matches requirements
- [ ] Accessibility standards met

---

This comprehensive testing guide ensures your application works correctly across all scenarios! 🧪✅
