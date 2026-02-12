# Quick Start Guide

Get the Work Order Tracker running in 5 minutes.

## Prerequisites

Install if you don't have them:
- Node.js 18+ ([download](https://nodejs.org/))
- PostgreSQL 14+ ([download](https://www.postgresql.org/download/))

## Setup Steps

### 1. Install dependencies

```bash
npm install
```

### 2. Create PostgreSQL database

Open your PostgreSQL client (psql, pgAdmin, etc.) and run:

```sql
CREATE DATABASE work_order_tracker;
```

### 3. Update database connection

Edit the `.env` file and update with your PostgreSQL credentials:

```env
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/work_order_tracker?schema=public"
```

Replace `YOUR_USERNAME` and `YOUR_PASSWORD` with your actual PostgreSQL credentials.

### 4. Run database setup

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 5. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Login Credentials

### Admin Account
- Email: `admin@example.com`
- Password: `admin123`

### Technician Accounts
- Email: `tech1@example.com` / Password: `tech123`
- Email: `tech2@example.com` / Password: `tech123`
- Email: `tech3@example.com` / Password: `tech123`

## What to Try

### As a Technician (tech1@example.com)

1. Login with technician credentials
2. You'll see "My Active Work" with assigned tasks
3. Click "Start Timer" on any task
4. Notice the running timer at the top
5. Click "Start Timer" on a different task - the first timer auto-stops!
6. Add notes and stop the timer
7. Mark a task as "Done"

### As an Admin (admin@example.com)

1. Login with admin credentials
2. See all work orders in the dashboard
3. Click on a work order (e.g., "WO-2024-002")
4. Expand line items to see time entries
5. Click "Approve All Time" to approve pending entries
6. Click "Mark Ready to Bill"
7. Try "Export PDF" and "Export CSV" buttons

## Troubleshooting

### Can't connect to database?

Make sure PostgreSQL is running:

```bash
# On Mac with Homebrew
brew services start postgresql

# On Windows, check Services app for PostgreSQL

# Test connection
psql -U your_username -d work_order_tracker
```

### Migration errors?

Reset the database (development only):

```bash
npx prisma migrate reset
```

### Port 3000 already in use?

Change the port:

```bash
PORT=3001 npm run dev
```

## Next Steps

Read the full [README.md](README.md) for:
- Complete API documentation
- Database schema details
- Production deployment guide
- Architecture overview

## Key Features to Explore

1. **One Active Timer Rule**: Try switching timers - the old one stops automatically
2. **Mobile-First**: Resize your browser to see the mobile interface
3. **Real-time Calculations**: Watch estimate vs. actual hours update
4. **Approval Workflow**: Time must be approved before billing
5. **Billing Export**: Generate professional PDF and CSV reports

Enjoy building with the Work Order Tracker!
