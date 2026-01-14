# User Journeys - County Subscription Availability Checker

This document outlines detailed user journeys for the County Subscription Availability Checker application.

---

## Journey 1: New User - Free Trial Sign-Up (Happy Path)

**User Persona**: Sarah, a small business owner looking to expand into a new county

**Goal**: Find an available county and start a free trial

### Steps:

1. **Landing on Homepage**
   - Sarah visits `http://localhost:3000`
   - Sees the hero section: "Find Your Exclusive County"
   - Reads description: "Select your state and county to see available subscription plans"

2. **Selecting a State**
   - Sees two dropdowns: "1. Select a State" and "2. Select a County"
   - County dropdown is disabled (grayed out)
   - Clicks on the state dropdown
   - Scrolls through alphabetically sorted list
   - Selects "California"

3. **Selecting a County**
   - County dropdown becomes active
   - Sees "Search for a county..." placeholder
   - Types "Los" in search box
   - List filters to show only matching counties (Los Angeles County, etc.)
   - Clicks "Los Angeles County"

4. **Loading Status**
   - Sees loading spinner: "Loading county information..."
   - System fetches county status from database

5. **Viewing Available County**
   - Status returns as `available`
   - Sees prominent green banner: "FREE TRIAL is Available"
   - Sees large "FREE" text with description
   - Reads: "Pay only a percentage of your profits. No monthly fees."
   - Below sees email input form

6. **Submitting Free Trial**
   - Enters email: `sarah@business.com`
   - Clicks "Start Your Free Trial" button
   - Button shows "Submitting..."
   - Sees success message: "Free trial registration successful! Check your email for next steps."

7. **Viewing Additional Options**
   - Scrolls down to see three pricing cards:
     - Basic ($49/month)
     - Plus ($99/month)
     - Pro ($249/month) - featured with blue background
   - Considers upgrading later
   - Closes browser satisfied

**Technical Flow:**
```
Page Load → GET /api/states
Select State → GET /api/counties/:stateId
Select County → GET /api/county-status/:countyId
Submit Email → POST /api/free-trial
```

**Expected Outcome**: ✅ User successfully signs up for free trial

---

## Journey 2: Existing User - Finds Partially Locked County

**User Persona**: Mike, a consultant checking availability in his target market

**Goal**: Check if free trial is available in a specific county

### Steps:

1. **Accessing the Application**
   - Mike visits the homepage
   - Already knows which county he wants: "Cook County, Illinois"

2. **Quick Navigation**
   - Opens state dropdown
   - Selects "Illinois"
   - County dropdown populates
   - Types "Cook" in search
   - Clicks "Cook County"

3. **Loading Status**
   - Sees loading spinner
   - API fetches county status

4. **Viewing Partially Locked County**
   - Status returns as `partially_locked`
   - Sees blue info banner: "A plan is already active in Cook County. The free trial is no longer available."
   - Free trial section is NOT displayed

5. **Evaluating Paid Options**
   - Reviews three pricing tiers:
     - Basic: Core software, 1 user, $49/mo
     - Plus: Advanced analytics, 5 users, $99/mo
     - Pro: Exclusive access, unlimited users, $249/mo
   - Clicks "Get Started" on Plus plan
   - *(Future: Would proceed to payment)*

6. **Trying Alternative County**
   - Decides to check neighboring county
   - Selects "DuPage County" from dropdown
   - Checks if available there

**Technical Flow:**
```
Select Illinois → GET /api/counties/14
Select Cook County → GET /api/county-status/X
Status = partially_locked → Shows PartiallyLockedComponent
```

**Expected Outcome**: ✅ User understands county status and evaluates paid options

---

## Journey 3: User Discovers Fully Locked County

**User Persona**: Jennifer, an entrepreneur exploring expansion opportunities

**Goal**: Check availability in a specific county, adapt if unavailable

### Steps:

1. **Initial Search**
   - Jennifer visits homepage
   - Wants to check "Miami-Dade County, Florida"
   - Selects "Florida" from state dropdown
   - Types "Miami" in county search

2. **Selecting Target County**
   - Sees "Miami-Dade County" in results
   - Clicks to select
   - Loading spinner appears

3. **Encountering Fully Locked Status**
   - Status returns as `fully_locked`
   - Sees orange warning banner with X icon
   - Message: "This County is Not Available"
   - Reads: "The Pro plan for Miami-Dade County has been claimed, granting exclusive access."
   - Sees suggestion: "We recommend exploring a neighboring county"

4. **Searching for Alternative**
   - Clicks "Search Another County" button
   - Selection clears
   - State dropdown resets
   - County dropdown disables

5. **Finding Available Alternative**
   - Selects "Florida" again
   - Types "Broward" (neighboring county)
   - Selects "Broward County"
   - Status returns as `available`
   - Sees free trial option
   - Successfully signs up

**Technical Flow:**
```
Select Miami-Dade → GET /api/county-status/X
Status = fully_locked → Shows FullyLockedComponent
Click "Search Another" → Clear state
Select Broward → GET /api/county-status/Y
Status = available → Shows AvailableComponent
```

**Expected Outcome**: ✅ User finds alternative county and successfully signs up

---

## Journey 4: Comparison Shopper

**User Persona**: David, a business strategist comparing multiple counties

**Goal**: Check availability status across multiple counties before deciding

### Steps:

1. **Strategic Research**
   - David wants to compare 5 different counties in Texas
   - Opens the application
   - Selects "Texas" from dropdown

2. **Checking County 1: Harris County**
   - Searches for "Harris"
   - Selects "Harris County"
   - Status: `partially_locked` - notes "no free trial"
   - Takes note in his spreadsheet

3. **Checking County 2: Dallas County**
   - Searches for "Dallas"
   - Selects "Dallas County"
   - Status: `fully_locked` - notes "unavailable"

4. **Checking County 3: Tarrant County**
   - Searches for "Tarrant"
   - Selects "Tarrant County"
   - Status: `available` - notes "free trial available! ✓"

5. **Checking County 4: Bexar County**
   - Searches for "Bexar"
   - Selects "Bexar County"
   - Status: `available` - notes "free trial available! ✓"

6. **Checking County 5: Travis County**
   - Searches for "Travis"
   - Selects "Travis County"
   - Status: `partially_locked` - notes "no free trial"

7. **Making Decision**
   - Compares notes
   - Decides on Tarrant County (available + strategic location)
   - Goes back to Tarrant County
   - Enters email: `david@strategy.com`
   - Clicks "Start Your Free Trial"
   - Success message appears
   - Plans to add Bexar County later

**Technical Flow:**
```
For each county:
  Select County → GET /api/county-status/:countyId
  Review status → Take notes
  Repeat
Final selection → POST /api/free-trial
```

**Expected Outcome**: ✅ User compares multiple options and makes informed decision

---

## Journey 5: Mobile User on the Go

**User Persona**: Lisa, a sales representative checking availability from her phone

**Goal**: Quickly check county availability during client meeting

### Steps:

1. **Mobile Access**
   - Lisa opens website on iPhone during lunch break
   - Responsive design adapts to small screen
   - Sees clear hero section
   - Dropdowns are thumb-friendly

2. **Touch Interface**
   - Taps state dropdown
   - Native iOS dropdown appears
   - Scrolls to "Arizona"
   - Taps to select

3. **Mobile County Search**
   - County search input appears
   - Keyboard opens automatically
   - Types "Maric" (autocomplete helps)
   - Sees "Maricopa County" in dropdown
   - Taps to select

4. **Mobile-Optimized Results**
   - Loading spinner appears
   - Status: `available`
   - Free trial banner stacks vertically
   - Email input is full-width
   - Pricing cards stack in single column

5. **Mobile Form Submission**
   - Taps email input
   - Types email with phone keyboard
   - Email autocomplete suggests her work email
   - Taps "Start Your Free Trial" button
   - Success message appears in readable size
   - Can scroll down to see pricing tiers

**Technical Flow:**
```
Same API calls as desktop
Mobile-optimized UI with Tailwind responsive classes
Touch-friendly tap targets
```

**Expected Outcome**: ✅ User successfully completes task on mobile device

---

## Journey 6: Error Handling Journey

**User Persona**: Tom, a user experiencing technical issues

**Goal**: Navigate the application despite potential errors

### Scenarios:

#### Scenario A: Database Connection Error

1. Tom visits homepage
2. State dropdown shows "Loading states..."
3. API call fails (database down)
4. Sees red error banner: "Failed to load states. Please refresh the page."
5. Refreshes page
6. Database is back up
7. States load successfully

#### Scenario B: Invalid Email

1. Tom selects available county
2. Enters invalid email: "notanemail"
3. Clicks "Start Your Free Trial"
4. HTML5 validation prevents submission
5. Browser shows: "Please enter a valid email address"
6. Corrects to: "tom@email.com"
7. Successfully submits

#### Scenario C: Network Timeout

1. Tom selects county
2. Network is slow
3. Sees loading spinner for extended time
4. Eventually gets error: "Failed to load county status. Please try again."
5. Clicks county again
6. Network recovered
7. Status loads successfully

**Technical Flow:**
```
API Error → try/catch blocks
Frontend Error → Error state displayed
User Action → Retry mechanism
Success → Normal flow resumes
```

**Expected Outcome**: ✅ User understands errors and can recover

---

## Journey 7: API Integration User (External Developer)

**User Persona**: Alex, a developer building a mobile app that needs county data

**Goal**: Integrate the API into external application

### Steps:

1. **API Discovery**
   - Alex reads README.md
   - Finds API endpoint documentation
   - Notes base URL: `http://localhost:3000/api`

2. **Testing States Endpoint**
   ```bash
   curl http://localhost:3000/api/states
   ```
   - Receives JSON with all states
   - Parses `state_id` and `name` fields

3. **Testing Counties Endpoint**
   ```bash
   curl http://localhost:3000/api/counties/5
   ```
   - Receives counties for California (state_id: 5)
   - Notes county structure includes `status` field

4. **Testing County Status**
   ```bash
   curl http://localhost:3000/api/county-status/1234
   ```
   - Receives specific county status
   - Gets `available`, `partially_locked`, or `fully_locked`

5. **Testing Free Trial Submission**
   ```bash
   curl -X POST http://localhost:3000/api/free-trial \
     -H "Content-Type: application/json" \
     -d '{"email":"alex@dev.com","county_id":1234}'
   ```
   - Receives success response
   - Notes 201 status code

6. **Building Mobile App**
   - Integrates API calls into React Native app
   - Uses same endpoints
   - Displays data in native UI
   - Successfully processes free trial signups

**Technical Flow:**
```
External App → HTTP Request → Next.js API Route → PostgreSQL → JSON Response → External App
```

**Expected Outcome**: ✅ Developer successfully integrates API into external application

---

## Journey 8: Returning User Journey

**User Persona**: Emma, a user who signed up for free trial 2 weeks ago

**Goal**: Upgrade to paid plan in same county

### Steps:

1. **Returning to Site**
   - Emma returns after using free trial
   - Wants to upgrade to Plus plan
   - Selects "New York" state
   - Selects "Kings County" (Brooklyn)

2. **Checking Current Status**
   - County shows as `partially_locked`
   - Sees: "A plan is already active in Kings County"
   - Free trial is no longer displayed
   - Realizes someone (maybe her) already has a plan

3. **Reviewing Paid Options**
   - Sees three paid tiers
   - Reads Plus plan features:
     - All Basic features
     - Advanced analytics
     - Priority support
     - 5 user licenses
   - Clicks "Get Started" on Plus plan

4. **Future: Payment Flow**
   - *(Would be redirected to payment page)*
   - *(Would complete payment)*
   - *(Would receive confirmation)*

**Expected Outcome**: ✅ User understands status change and ready to upgrade

---

## Summary Table: User Journeys by County Status

| Journey | User Type | County Status | Primary Action | Outcome |
|---------|-----------|---------------|----------------|---------|
| 1 | New User | Available | Sign up for free trial | ✅ Success |
| 2 | Existing User | Partially Locked | Review paid plans | ✅ Evaluating |
| 3 | Entrepreneur | Fully Locked | Find alternative | ✅ Alternative found |
| 4 | Comparison Shopper | Mixed | Compare multiple | ✅ Best choice selected |
| 5 | Mobile User | Available | Mobile sign-up | ✅ Mobile success |
| 6 | User with Errors | N/A | Error recovery | ✅ Recovered |
| 7 | External Developer | N/A | API integration | ✅ Integrated |
| 8 | Returning User | Partially Locked | Upgrade plan | ✅ Ready to upgrade |

---

## Key User Flow Patterns

### Pattern 1: Discovery → Selection → Action
```
Homepage → Select State → Select County → View Status → Take Action
```

### Pattern 2: Status-Based Branching
```
County Selected
├── Available → Free Trial + Paid Options
├── Partially Locked → Paid Options Only
└── Fully Locked → Search Alternative
```

### Pattern 3: Error → Recovery
```
Error Occurs → Error Message → User Action → Retry → Success
```

### Pattern 4: Multi-County Comparison
```
Select County 1 → Note Status → Select County 2 → Note Status → Compare → Decide
```

---

## Conversion Metrics by Journey

| Metric | Journey 1 | Journey 2 | Journey 3 | Journey 5 |
|--------|-----------|-----------|-----------|-----------|
| Page Views | 1 | 1 | 1 | 1 |
| State Selections | 1 | 1 | 2 | 1 |
| County Checks | 1 | 1 | 2 | 1 |
| Form Submissions | 1 | 0 | 1 | 1 |
| Conversion Rate | 100% | 0% | 50% | 100% |

---

## User Journey Success Criteria

✅ **Navigation**: Users can easily find and select states/counties
✅ **Status Understanding**: Clear communication of county availability
✅ **Action Clarity**: Obvious next steps based on status
✅ **Error Handling**: Graceful degradation with clear messages
✅ **Mobile Experience**: Fully functional on all devices
✅ **Performance**: Fast loading and smooth interactions
✅ **API Accessibility**: External integration possible

---

## Future Journey Enhancements

1. **Authentication Journey**
   - User login/signup
   - Dashboard access
   - Subscription management

2. **Payment Journey**
   - Stripe integration
   - Payment confirmation
   - Receipt generation

3. **Multi-County Journey**
   - Subscribe to multiple counties
   - Manage multiple subscriptions
   - Volume discounts

4. **Admin Journey**
   - Manage county statuses
   - View analytics
   - User management

5. **Notification Journey**
   - Email confirmations
   - Status change alerts
   - Renewal reminders
