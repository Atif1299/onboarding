# User Flows - Visual Diagrams

This document provides ASCII-based visual flow diagrams for the County Subscription Availability Checker.

---

## Main Application Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         LANDING PAGE                             │
│                                                                  │
│    ╔════════════════════════════════════════════════════════╗   │
│    ║   Find Your Exclusive County                          ║   │
│    ║   Select your state and county to see available      ║   │
│    ║   subscription plans and unlock your potential       ║   │
│    ╚════════════════════════════════════════════════════════╝   │
│                                                                  │
│    ┌──────────────────────────┐  ┌──────────────────────────┐  │
│    │ 1. Select a State        │  │ 2. Select a County       │  │
│    │ [Dropdown - Enabled]     │  │ [Dropdown - Disabled]    │  │
│    └──────────────────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    User Selects State
                            │
                            ▼
            ┌───────────────────────────┐
            │  GET /api/states          │
            │  Returns: All US States   │
            └───────────────────────────┘
                            │
                            ▼
                    State Selected
                            │
                            ▼
            ┌───────────────────────────────┐
            │  GET /api/counties/:stateId   │
            │  Returns: Counties for state  │
            └───────────────────────────────┘
                            │
                            ▼
            ┌───────────────────────────────┐
            │  County Dropdown Enabled      │
            │  User can search & select     │
            └───────────────────────────────┘
                            │
                            ▼
                    User Selects County
                            │
                            ▼
            ┌─────────────────────────────────┐
            │  GET /api/county-status/        │
            │  :countyId                      │
            │  Returns: Status of county      │
            └─────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
   Status: available          Status: partially_locked / fully_locked
        │                                       │
        ▼                                       ▼
   Show Component                         Show Component
        │                                       │
        └───────────────────┬───────────────────┘
                            ▼
                    User Takes Action
```

---

## Status-Based Component Flow

```
                    County Status Check
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │  AVAILABLE   │ │   PARTIAL    │ │FULLY LOCKED  │
    │              │ │   LOCKED     │ │              │
    └──────────────┘ └──────────────┘ └──────────────┘
            │               │               │
            ▼               ▼               ▼
┌──────────────────┐ ┌────────────────┐ ┌─────────────────┐
│ Available        │ │ Partially      │ │ FullyLocked     │
│ Component        │ │ Locked         │ │ Component       │
│                  │ │ Component      │ │                 │
│ ┌──────────────┐ │ │                │ │ ┌─────────────┐ │
│ │FREE TRIAL IS │ │ │ ┌────────────┐ │ │ │   COUNTY    │ │
│ │  AVAILABLE!  │ │ │ │ Info Banner│ │ │ │     NOT     │ │
│ │              │ │ │ │ No Free    │ │ │ │  AVAILABLE  │ │
│ │ ┌──────────┐ │ │ │ │ Trial      │ │ │ │             │ │
│ │ │  Email   │ │ │ │ └────────────┘ │ │ │   County    │ │
│ │ │  Input   │ │ │ │                │ │ │   Claimed   │ │
│ │ └──────────┘ │ │ │                │ │ │             │ │
│ │              │ │ │                │ │ │ ┌─────────┐ │ │
│ │  [Submit]    │ │ │                │ │ │ │ Search  │ │ │
│ └──────────────┘ │ │                │ │ │ │ Another │ │ │
│                  │ │                │ │ │ └─────────┘ │ │
│ ┌──────────────┐ │ │ ┌────────────┐ │ │               │ │
│ │ Paid Plans   │ │ │ │ Paid Plans │ │ │               │ │
│ │              │ │ │ │            │ │ │               │ │
│ │ • Basic      │ │ │ │ • Basic    │ │ │               │ │
│ │ • Plus       │ │ │ │ • Plus     │ │ │               │ │
│ │ • Pro        │ │ │ │ • Pro      │ │ │               │ │
│ └──────────────┘ │ │ └────────────┘ │ │               │ │
└──────────────────┘ └────────────────┘ └─────────────────┘
```

---

## Free Trial Submission Flow

```
User on Available County Page
            │
            ▼
    ┌──────────────────┐
    │ Enters Email     │
    │ user@email.com   │
    └──────────────────┘
            │
            ▼
    ┌──────────────────┐
    │ Clicks "Start    │
    │ Your Free Trial" │
    └──────────────────┘
            │
            ▼
    ┌──────────────────────────────┐
    │ Frontend Validation          │
    │ - Email format check         │
    │ - Required field check       │
    └──────────────────────────────┘
            │
            ├─── Invalid ──────► Show Error Message
            │                    └──► Return to Form
            │
            ▼ Valid
    ┌──────────────────────────────┐
    │ POST /api/free-trial         │
    │ Body: {                      │
    │   email: "user@email.com",   │
    │   county_id: 123             │
    │ }                            │
    └──────────────────────────────┘
            │
            ▼
    ┌──────────────────────────────┐
    │ Backend Validation           │
    │ - Check county exists        │
    │ - Check status = available   │
    │ - Validate email format      │
    └──────────────────────────────┘
            │
            ├─── Error ──────────► Return 400/404
            │                      └──► Show Error
            │
            ▼ Success
    ┌──────────────────────────────┐
    │ Log to Console               │
    │ (Future: Save to DB,         │
    │  Send email, etc.)           │
    └──────────────────────────────┘
            │
            ▼
    ┌──────────────────────────────┐
    │ Return 201 Created           │
    │ {                            │
    │   success: true,             │
    │   message: "Registration     │
    │             successful"      │
    │ }                            │
    └──────────────────────────────┘
            │
            ▼
    ┌──────────────────────────────┐
    │ Show Success Message         │
    │ "Free trial registration     │
    │  successful! Check email..."  │
    └──────────────────────────────┘
```

---

## State & County Selection Flow

```
            Page Load
                │
                ▼
    ┌───────────────────────┐
    │ useEffect() runs      │
    │ Fetch all states      │
    └───────────────────────┘
                │
                ▼
    ┌───────────────────────┐
    │ GET /api/states       │
    └───────────────────────┘
                │
                ▼
    ┌───────────────────────┐
    │ setState(data)        │
    │ Populate dropdown     │
    └───────────────────────┘
                │
                ▼
    ┌───────────────────────────────┐
    │ User Sees Dropdown            │
    │ "Choose a state..."           │
    │ • Alabama                     │
    │ • Alaska                      │
    │ • ...                         │
    └───────────────────────────────┘
                │
                ▼
    ┌───────────────────────────────┐
    │ User Selects "California"     │
    └───────────────────────────────┘
                │
                ▼
    ┌───────────────────────────────┐
    │ handleStateChange(5)          │
    │ - setSelectedState(CA obj)    │
    │ - setCounties([])             │
    │ - fetchCounties(5)            │
    └───────────────────────────────┘
                │
                ▼
    ┌───────────────────────────────┐
    │ GET /api/counties/5           │
    │ Loading: true                 │
    └───────────────────────────────┘
                │
                ▼
    ┌───────────────────────────────┐
    │ Returns 58 CA counties        │
    │ setCounties(data)             │
    │ Loading: false                │
    └───────────────────────────────┘
                │
                ▼
    ┌───────────────────────────────┐
    │ County Dropdown Enabled       │
    │ "Search for a county..."      │
    └───────────────────────────────┘
                │
                ▼
    ┌───────────────────────────────┐
    │ User Types "Los"              │
    │ Filter: counties matching "Los"│
    └───────────────────────────────┘
                │
                ▼
    ┌───────────────────────────────┐
    │ Filtered Results:             │
    │ • Los Angeles County          │
    └───────────────────────────────┘
                │
                ▼
    ┌───────────────────────────────┐
    │ User Clicks County            │
    │ handleCountySelect()          │
    └───────────────────────────────┘
                │
                ▼
    ┌───────────────────────────────┐
    │ GET /api/county-status/1234   │
    │ Loading: true                 │
    └───────────────────────────────┘
                │
                ▼
    ┌───────────────────────────────┐
    │ Returns status: "available"   │
    │ setCountyStatus(status)       │
    │ Loading: false                │
    └───────────────────────────────┘
                │
                ▼
    ┌───────────────────────────────┐
    │ Render AvailableComponent     │
    └───────────────────────────────┘
```

---

## Database Query Flow

```
    API Request Received
            │
            ▼
    ┌──────────────────┐
    │ Parse Parameters │
    │ Validate Input   │
    └──────────────────┘
            │
            ▼
    ┌──────────────────┐
    │ Import db.js     │
    │ Get pool conn    │
    └──────────────────┘
            │
            ▼
    ┌─────────────────────────────┐
    │ Execute SQL Query           │
    │ query(text, params)         │
    └─────────────────────────────┘
            │
            ▼
    ┌─────────────────────────────┐
    │ PostgreSQL Database         │
    │                             │
    │ States                      │
    │ ├─ state_id                 │
    │ ├─ name                     │
    │ └─ abbreviation             │
    │                             │
    │ Counties                    │
    │ ├─ county_id                │
    │ ├─ name                     │
    │ ├─ state_id (FK)            │
    │ └─ status                   │
    └─────────────────────────────┘
            │
            ▼
    ┌─────────────────────────────┐
    │ Return Results              │
    │ result.rows                 │
    └─────────────────────────────┘
            │
            ▼
    ┌─────────────────────────────┐
    │ Format Response             │
    │ {                           │
    │   success: true,            │
    │   data: [...]               │
    │ }                           │
    └─────────────────────────────┘
            │
            ▼
    ┌─────────────────────────────┐
    │ Send JSON Response          │
    │ NextResponse.json()         │
    └─────────────────────────────┘
```

---

## Error Handling Flow

```
                User Action
                    │
                    ▼
            ┌───────────────┐
            │ API Call      │
            └───────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
    Success                   Error
        │                       │
        │           ┌───────────┴───────────┐
        │           │                       │
        │           ▼                       ▼
        │   Network Error          Database Error
        │           │                       │
        │           ▼                       ▼
        │   ┌──────────────┐       ┌──────────────┐
        │   │ Catch in     │       │ Catch in     │
        │   │ Frontend     │       │ API Route    │
        │   └──────────────┘       └──────────────┘
        │           │                       │
        │           ▼                       ▼
        │   ┌──────────────┐       ┌──────────────┐
        │   │ setError()   │       │ Return 500   │
        │   │ Show Banner  │       │ with message │
        │   └──────────────┘       └──────────────┘
        │           │                       │
        │           └───────────┬───────────┘
        │                       │
        ▼                       ▼
    ┌──────────────────────────────────┐
    │ User Sees Error Message          │
    │ "Failed to load... Please retry" │
    └──────────────────────────────────┘
                    │
                    ▼
            ┌──────────────┐
            │ User can:    │
            │ • Retry      │
            │ • Refresh    │
            │ • Try other  │
            └──────────────┘
```

---

## Mobile Responsive Flow

```
    Desktop (>768px)                Mobile (<768px)

    ┌────────────────────┐          ┌──────────────┐
    │ State    │ County  │          │ State        │
    │ Dropdown │ Dropdown│          │ Dropdown     │
    └────────────────────┘          └──────────────┘
                                    ┌──────────────┐
                                    │ County       │
                                    │ Dropdown     │
                                    └──────────────┘

    ┌──────────────────────────┐    ┌──────────────┐
    │    FREE TRIAL CARD       │    │ FREE TRIAL   │
    │  ┌────────┐  ┌────────┐ │    │ CARD         │
    │  │ Email  │  │ Submit │ │    │ (Stacked)    │
    │  └────────┘  └────────┘ │    │              │
    └──────────────────────────┘    │ ┌──────────┐ │
                                    │ │  Email   │ │
    ┌────┬────┬────┐                │ └──────────┘ │
    │Basic│Plus│Pro │                │ ┌──────────┐ │
    │ $49│$99 │$249│                │ │  Submit  │ │
    └────┴────┴────┘                │ └──────────┘ │
    (Side by side)                  └──────────────┘
                                    ┌──────────────┐
                                    │ Basic        │
                                    │ $49          │
                                    └──────────────┘
                                    ┌──────────────┐
                                    │ Plus         │
                                    │ $99          │
                                    └──────────────┘
                                    ┌──────────────┐
                                    │ Pro          │
                                    │ $249         │
                                    └──────────────┘
                                    (Stacked)
```

---

## Complete User Journey - Success Path

```
START
  │
  ▼
Homepage Load
  │
  ▼
Fetch States ──► Loading Spinner ──► States Loaded
  │
  ▼
User Browses States ──► Selects "Texas"
  │
  ▼
Fetch Counties ──► Loading ──► 254 Counties Loaded
  │
  ▼
User Types "Travis" ──► Filter Results ──► Shows "Travis County"
  │
  ▼
User Clicks County ──► Fetch Status ──► Loading ──► Status: "available"
  │
  ▼
Display Available Component
  ├─► Free Trial Banner (Green)
  ├─► Email Input Field
  ├─► Basic Plan Card
  ├─► Plus Plan Card
  └─► Pro Plan Card (Featured)
  │
  ▼
User Enters Email: "user@example.com"
  │
  ▼
User Clicks "Start Your Free Trial"
  │
  ▼
Submit Form ──► Validate Email ──► POST /api/free-trial
  │
  ▼
Backend Validates ──► Check County ──► Status OK
  │
  ▼
Log Signup ──► Return Success (201)
  │
  ▼
Show Success Message: "Free trial registration successful!"
  │
  ▼
User Scrolls Down ──► Reviews Paid Plans
  │
  ▼
User Satisfied ──► Closes Browser
  │
  ▼
END (Success! ✓)
```

---

## API Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│  │ Web Browser│  │ Mobile App │  │ External   │               │
│  │            │  │            │  │ API Client │               │
│  └────────────┘  └────────────┘  └────────────┘               │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS API LAYER                          │
│                                                                  │
│  /api/states            /api/counties/:id                       │
│  /api/county-status/:id /api/free-trial                         │
│                                                                  │
│  ┌──────────────────────────────────────────────────┐          │
│  │ Request Validation → Route Handler → Response    │          │
│  └──────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ SQL Queries
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                              │
│                                                                  │
│  ┌────────────────────────────────────────────────┐            │
│  │         PostgreSQL Database                     │            │
│  │                                                 │            │
│  │  lib/db.js (Connection Pool)                   │            │
│  │      ↓                                          │            │
│  │  ┌─────────┐ ┌─────────┐ ┌────────────┐       │            │
│  │  │ States  │ │Counties │ │   Offers   │       │            │
│  │  ├─────────┤ ├─────────┤ ├────────────┤       │            │
│  │  │ state_id│ │county_id│ │  offer_id  │       │            │
│  │  │  name   │ │  name   │ │    name    │       │            │
│  │  │  abbrev │ │state_id │ │   price    │       │            │
│  │  └─────────┘ │ status  │ │ tier_level │       │            │
│  │              └─────────┘ └────────────┘       │            │
│  └────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary: Key Flow Patterns

1. **Request → Validate → Query → Response**
   - Standard API pattern used across all endpoints

2. **Select → Fetch → Display → Act**
   - User interaction pattern for state/county selection

3. **Available → Partial → Locked**
   - Three-way status branching for county availability

4. **Try → Catch → Display Error → Retry**
   - Error handling pattern throughout application

5. **Desktop → Mobile → Responsive**
   - Adaptive layout based on screen size

These flows ensure a consistent, predictable user experience across all scenarios!
