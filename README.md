# County Subscription Availability Checker

A full-stack web application built with Next.js that allows users to check the availability of services in specific US counties. Users can select a state and county to view available subscription plans based on the county's status.

## Features

- **📍 Interactive County Selection**: Select your state and search through counties with real-time filtering
- **💰 Dynamic Pricing Display**: View subscription plans based on county availability status
- **🎯 Three Status Scenarios**:
  - **Available**: Free trial + paid plans (Basic, Plus, Pro)
  - **Partially Locked**: Only paid plans (free trial unavailable)
  - **Fully Locked**: County is occupied (no plans available)
- **📧 Free Trial Signup**: Email-based registration for available counties
- **🎨 Responsive Design**: Beautiful UI built with Tailwind CSS
- **⚡ Next.js App Router**: Modern architecture with API routes
- **🗄️ PostgreSQL Database**: Robust data storage with relational design

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library with hooks
- **Tailwind CSS 4** - Utility-first CSS framework
- **Lucide React** - Modern icon library

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **PostgreSQL** - Relational database
- **node-postgres (pg)** - PostgreSQL client for Node.js

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 18.x or higher
- **PostgreSQL** 12.x or higher
- **npm** or **yarn**

## Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Install Node.js dependencies
npm install
```

### 2. Database Setup

#### Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE county_subscription;

# Exit psql
\q
```

#### Run Schema Creation

```bash
# Run the schema SQL file
psql -U postgres -d county_subscription -f database/schema.sql
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```bash
# Copy the example file
cp .env.local.example .env.local
```

Edit `.env.local` with your database credentials:

**Option 1: Using Connection String (Recommended)**
```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/county_subscription

# Example with custom port:
DATABASE_URL=postgresql://postgres:root@localhost:5433/county_subscription
```

**Option 2: Using Individual Parameters**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=county_subscription
DB_USER=postgres
DB_PASSWORD=your_password_here
```

> 💡 **Note**: If `DATABASE_URL` is set, it will be used. Otherwise, individual parameters will be used.

See [DATABASE_CONNECTION.md](DATABASE_CONNECTION.md) for detailed connection guide.

### 4. Seed the Database

Populate the database with US states and counties:

```bash
node database/seed-counties.js
```

This will insert:
- 51 US states (including DC)
- ~3,000+ US counties
- 4 subscription offers
- Random status assignments for demo purposes

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
offer-page/
├── app/
│   ├── api/                      # Next.js API routes
│   │   ├── states/
│   │   │   └── route.js         # GET /api/states
│   │   ├── counties/
│   │   │   └── [stateId]/
│   │   │       └── route.js     # GET /api/counties/:stateId
│   │   ├── county-status/
│   │   │   └── [countyId]/
│   │   │       └── route.js     # GET /api/county-status/:countyId
│   │   └── free-trial/
│   │       └── route.js         # POST /api/free-trial
│   ├── components/              # React components
│   │   ├── AvailableComponent.jsx
│   │   ├── PartiallyLockedComponent.jsx
│   │   └── FullyLockedComponent.jsx
│   ├── layout.jsx               # Root layout with metadata
│   └── page.jsx                 # Main page component
├── database/
│   ├── schema.sql               # Database schema
│   ├── seed.sql                 # Manual seed file
│   └── seed-counties.js         # Automated seeding script
├── lib/
│   └── db.js                    # Database connection utility
├── src/
│   ├── data/
│   │   └── us-states-counties.json
│   └── index.css                # Global styles (Tailwind)
├── next.config.mjs              # Next.js configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── jsconfig.json                # Path aliases configuration
└── package.json
```

## API Endpoints

### GET `/api/states`
Fetches all US states.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "state_id": 1,
      "name": "Alabama",
      "abbreviation": "AL"
    }
  ]
}
```

### GET `/api/counties/:stateId`
Fetches all counties for a specific state.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "county_id": 1,
      "name": "Autauga County",
      "status": "available"
    }
  ]
}
```

### GET `/api/county-status/:countyId`
Fetches the status of a specific county.

**Response:**
```json
{
  "success": true,
  "data": {
    "county_id": 1,
    "name": "Autauga County",
    "status": "available",
    "state_id": 1
  }
}
```

### POST `/api/free-trial`
Handles free trial registration.

**Request Body:**
```json
{
  "email": "user@example.com",
  "county_id": 123
}
```

**Response:**
```json
{
  "success": true,
  "message": "Free trial registration successful",
  "data": {
    "email": "user@example.com",
    "county_id": 123,
    "county_name": "Autauga County"
  }
}
```

## Database Schema

### Tables

- **Users** - User accounts
- **States** - US states with abbreviations
- **Counties** - US counties with status tracking
- **Offers** - Subscription tiers
- **Subscriptions** - User subscriptions

### County Status Values

- `available` - Free trial and all paid plans available
- `partially_locked` - Only paid plans available (free trial taken)
- `fully_locked` - County is exclusively claimed (no plans available)

## Development

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Lint Code

```bash
npm run lint
```

## Deployment

This application can be deployed to:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **AWS**
- **Any Node.js hosting platform**

Make sure to:
1. Set up your PostgreSQL database
2. Configure environment variables
3. Run the seeding script
4. Deploy the Next.js application

## Future Enhancements

- [ ] User authentication and login
- [ ] Payment integration (Stripe/PayPal)
- [ ] Email notifications
- [ ] Admin dashboard for managing counties
- [ ] Analytics and reporting
- [ ] County recommendations
- [ ] Multi-county subscriptions

## License

This project is private and proprietary.

## Support

For issues or questions, please contact the development team.
