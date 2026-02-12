# Work Order & Technician Time Tracking System

Production-ready system for managing work orders, line items, and technician time tracking with manager approval workflow, billing exports, and comprehensive team collaboration features.

## Features

### Core Features
- **Mobile-First Technician Interface**: Frictionless timer switching for 5-10 minute tasks
- **One Active Timer Rule**: Database-enforced single active timer prevents overlapping time entries
- **Work Order Management**: Create, track, and manage work orders with line items and assignments
- **Time Approval Workflow**: Manager approval process for time entries with audit trail
- **Billing Export**: Generate PDF and CSV billing summaries with accurate time calculations
- **Role-Based Access**: Admin and Technician roles with appropriate permissions

### Phase 1 Enhancements
- **Customer Management**: Full CRUD with contact details, billing address, and notes
- **Search & Filtering**: Search work orders by WO# or customer; filter by status and priority
- **Comments System**: Threaded comments on work orders for team communication
- **Weekly Time Summary**: Dashboard showing technician hours with progress tracking
- **Status Filters**: Techs can filter assigned work by Open/Done status
- **Bulk Actions**: Multi-select line items for bulk status updates (Admin)

### Hardening & Safety
- **Database-Level Constraints**: PostgreSQL partial unique index enforces one active timer
- **Time Precision**: Seconds-based tracking (not rounded minutes) for accuracy
- **LOCKED Immutability**: Billed time entries cannot be edited without unlock workflow
- **Audit Logging**: All critical operations tracked with before/after snapshots
- **Soft Deletes**: Data preservation with `deletedAt` timestamps
- **Admin Exceptions Dashboard**: Proactive operational oversight for data quality

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: Cookie-based session authentication with bcrypt
- **PDF**: pdf-lib for billing document generation

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd "Shop Software Thing"
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up PostgreSQL database

Create a new PostgreSQL database:

```sql
CREATE DATABASE work_order_tracker;
```

### 4. Configure environment variables

Update the `.env` file with your database credentials:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/work_order_tracker?schema=public"
NEXTAUTH_SECRET="your-random-secret-here"
```

To generate a secure secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Run database migrations

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 6. Seed the database with demo data

```bash
npm run prisma:seed
```

This creates:
- 1 Admin user: `admin@example.com` / `admin123`
- 3 Tech users: `tech1@example.com`, `tech2@example.com`, `tech3@example.com` / `tech123`
- 3 Customers
- 3 Work Orders with multiple line items
- Sample time entries

### 7. Start the development server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Usage

### Logging In

Visit [http://localhost:3000/login](http://localhost:3000/login)

**Demo Credentials:**
- Admin: `admin@example.com` / `admin123`
- Technician: `tech1@example.com` / `tech123`

### Technician Workflow

1. **Login** as a technician → Redirects to "My Active Work"
2. **View Weekly Summary**: See hours tracked this week with progress bar and breakdown by work order
3. **Filter Tasks**: Use All/Open/Done tabs to filter assigned work
4. **Start Timer**: Tap "Start Timer" on a line item to begin tracking
5. **Auto-Switch**: Timer automatically stops when switching to a new task
6. **Add Notes**: Tap "Stop Timer" to pause work with optional notes
7. **Complete Tasks**: Tap "Done" when task is complete

### Manager Workflow

#### Work Order Management
1. **Login** as admin → Navigate to Work Orders
2. **Search & Filter**: Use search box (WO# or customer) and filter dropdowns (status, priority)
3. **Create Work Order**: Click "+ Create Work Order" → Select customer, enter WO#, set priority
4. **View Details**: Click on a work order to see line items, time entries, and totals
5. **Add Line Items**: Click "+ Add Line Item" → Enter description, estimate, assign techs
6. **Bulk Actions**: Check multiple line items → Click "Mark as Done" for bulk updates
7. **Add Comments**: Scroll to comments section → Post updates or questions

#### Customer Management
1. Navigate to **Customers** (admin navbar)
2. **Create Customer**: Click "+ Create Customer" → Enter company name, contact info, billing address
3. **Edit Customer**: Click "Edit" on any customer → Update details
4. **Delete Customer**: Click "Delete" (soft delete, preserves data)

#### Time Approval & Billing
1. **View Time Entries**: Open work order → Expand line items to view time entries
2. **Approve Time**: Click "Approve All Time" to approve pending entries
3. **Ready to Bill**: Click "Mark Ready to Bill" (only enabled when all time approved)
4. **Export**: Click "Export PDF" or "Export CSV" to generate billing packet

#### Monitoring & Exceptions
1. Navigate to **Exceptions** (admin navbar)
2. **Review Alerts**: Check for stale timers, unapproved time, data quality issues
3. **Take Action**: Investigate and resolve flagged items

## Database Schema

### Core Tables

- **users**: Admin and technician accounts with role-based access
- **customers**: Customer information with contact details and billing address (expanded in Phase 1)
- **work_orders**: Work order headers with status tracking
- **line_items**: Individual tasks within work orders
- **line_item_assignments**: Tech-to-task assignments for workload distribution
- **time_entries**: Time tracking records with approval states and seconds-based duration
- **comments**: Threaded comments on work orders and line items (Phase 1)
- **audit_log**: Change tracking for all critical operations

### Key Indexes

- `time_entries_one_active_timer_per_user` - PostgreSQL partial unique index (one active timer per user)
- `(user_id, end_ts)` on time_entries - fast active timer lookup
- `(work_order_id, line_item_id)` on time_entries - efficient rollups
- `(name)` on customers - search performance
- `(work_order_id)`, `(line_item_id)` on comments - fast comment retrieval
- `(deleted_at)` on all tables - soft delete filtering

## Business Rules

### One Active Timer Per Technician

When a technician starts a timer:
1. System checks for any active timer (where `end_ts` IS NULL)
2. If found, automatically stops it with current timestamp
3. Starts new timer immediately
4. All within a single database transaction

This prevents overlapping time entries and ensures data integrity.

### Approval Workflow

Time entry states:
- **DRAFT**: Default state, editable
- **SUBMITTED**: Ready for approval (future enhancement)
- **APPROVED**: Manager approved, ready for billing
- **LOCKED**: Billed, no further changes

### Billing Requirements

Work order can only be marked "Ready to Bill" when:
- All time entries are APPROVED or LOCKED
- No DRAFT or SUBMITTED entries remain

## Phase 1 Features Deep Dive

### Customer Management
**Page**: `/customers` (Admin only)

Manage customer information with comprehensive contact and billing details:
- **Contact Information**: Name, email, phone
- **Billing Address**: Street, city, state, ZIP, country
- **Notes**: Free-form notes for special customer requirements
- **Work Order Count**: Quick view of active work orders per customer
- **CRUD Operations**: Create, edit, soft delete customers
- **Search-Optimized**: Indexed on name for fast lookups

### Search & Filtering
**Page**: `/work-orders`

Find work orders quickly with multiple filter options:
- **Search Box**: Type-ahead search on WO number or customer name (case-insensitive)
- **Status Filter**: Filter by Draft, Open, In Progress, Ready to Bill, Closed
- **Priority Filter**: Filter by Low, Medium, High
- **Clear Filters**: One-click to reset all filters
- **Real-time Updates**: Results update immediately as you type/select
- **Backend Optimization**: Efficient database queries with proper indexing

### Comments System
**Location**: Work order detail pages

Facilitate team communication and documentation:
- **Threaded Comments**: Chronological comment history on each work order
- **User Context**: See who posted (name and role badge)
- **Timestamps**: Relative time display ("2h ago", "yesterday")
- **Real-time**: Comments appear immediately after posting
- **Markdown Support**: Preserved line breaks for formatted notes
- **Access Control**: All authenticated users can view and post

### Weekly Time Summary
**Page**: `/my-work` (Tech dashboard)

Help technicians track weekly progress:
- **Total Hours**: Large display of hours logged this week (Sunday-Saturday)
- **Progress Bar**: Visual indicator toward 40-hour week goal
  - Yellow: < 30 hours
  - Blue: 30-39 hours
  - Green: ≥ 40 hours
- **Work Order Breakdown**: See which work orders consumed time
- **Entry Count**: Number of time entries logged
- **Auto-Refresh**: Updates on page load

### Status Filters (Techs)
**Page**: `/my-work`

Organize assigned work by completion status:
- **All Tab**: Show all assigned line items
- **Open Tab**: Show only incomplete tasks
- **Done Tab**: Show only completed tasks
- **Count Badges**: Real-time counts on each tab
- **Client-Side**: Fast filtering without server round trips

### Bulk Actions
**Page**: `/work-orders/[id]` (Admin only)

Manage multiple line items efficiently:
- **Multi-Select**: Checkboxes on each line item
- **Bulk Actions Bar**: Appears when items selected
- **Mark as Done**: Update multiple items at once
- **Clear Selection**: Quick deselect all
- **Visual Feedback**: Selected count and action confirmation
- **Concurrent Updates**: Parallel API calls for speed

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout current session
- `GET /api/auth/me` - Get current user session

### Timer Operations
- `GET /api/timer/active` - Get active timer for current user
- `POST /api/timer/start` - Start timer (auto-stops existing, database-enforced)
- `POST /api/timer/stop` - Stop active timer with optional notes
- `GET /api/timer/weekly-summary` - Get weekly time summary with work order breakdown (Phase 1)

### Work Orders
- `GET /api/work-orders` - List work orders with search/filter support (role-based filtering)
  - Query params: `search`, `status`, `priority`
- `POST /api/work-orders` - Create work order (admin only)
- `GET /api/work-orders/[id]` - Get work order details with totals
- `POST /api/work-orders/[id]/approve` - Approve all time entries (admin only)
- `POST /api/work-orders/[id]/ready-to-bill` - Mark ready to bill (admin only)
- `POST /api/work-orders/[id]/line-items` - Add line item to work order (Phase 1)
- `GET /api/work-orders/[id]/comments` - Get comments for work order (Phase 1)
- `POST /api/work-orders/[id]/comments` - Add comment to work order (Phase 1)

### Customers (Phase 1)
- `GET /api/customers` - List all customers with work order counts
- `POST /api/customers` - Create customer (admin only)
- `PATCH /api/customers/[id]` - Update customer (admin only)
- `DELETE /api/customers/[id]` - Soft delete customer (admin only)

### Line Items
- `GET /api/line-items/my-work` - Get assigned open line items (tech)
- `POST /api/line-items/[id]/done` - Mark line item complete
- `GET /api/line-items/my-counts` - Get task counts (open/done/total) for current user (Phase 1)

### Users
- `GET /api/users` - List all technicians (for assignments)

### Exports
- `GET /api/export/pdf/[id]` - Generate PDF billing packet (admin only)
- `GET /api/export/csv/[id]` - Generate CSV billing export (admin only)

## Performance Optimization

Designed for 50 technicians with thousands of time entries:

- Indexed queries for active timer lookup
- Efficient work order rollups with aggregation
- Pagination-ready API design
- Optimized Prisma includes to prevent N+1 queries

## Production Deployment

### Build for production

```bash
npm run build
npm start
```

### Environment variables for production

Set these in your production environment:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="secure-random-secret"
NODE_ENV="production"
```

### Database migrations in production

```bash
npx prisma migrate deploy
```

## Future Enhancements (Phase 2+)

**Phase 1 Complete ✓**
- ✅ Customer Management
- ✅ Search & Filtering
- ✅ Comments System
- ✅ Weekly Time Summary
- ✅ Status Filters for Techs
- ✅ Bulk Actions

**Phase 2 Candidates:**
- File attachments on work orders and comments
- Email notifications for assignments and approvals
- Mobile-optimized PWA improvements
- Advanced reporting and analytics dashboard
- Custom fields for customers and work orders
- Recurring work orders and templates

**Phase 3+ Future Enhancements:**
- Inventory management
- Accounting system integration (QuickBooks, Xero)
- Offline mode with sync
- Multi-tenant architecture
- Rate cards and automatic pricing
- Scheduling and calendar integration
- Mobile native apps (iOS/Android)

## File Structure

```
├── app/
│   ├── api/                        # API routes
│   │   ├── auth/                   # Authentication endpoints
│   │   ├── customers/              # Customer CRUD (Phase 1)
│   │   │   └── [id]/              # Individual customer operations
│   │   ├── export/                 # PDF and CSV export
│   │   ├── line-items/             # Line item operations
│   │   │   ├── my-counts/         # Task count endpoint (Phase 1)
│   │   │   └── my-work/           # Assigned work endpoint
│   │   ├── timer/                  # Timer operations
│   │   │   ├── active/            # Active timer check
│   │   │   ├── start/             # Start timer
│   │   │   ├── stop/              # Stop timer
│   │   │   └── weekly-summary/    # Weekly summary (Phase 1)
│   │   ├── users/                  # User listing
│   │   └── work-orders/            # Work order management
│   │       └── [id]/              # Work order operations
│   │           ├── approve/       # Approve time
│   │           ├── comments/      # Comments (Phase 1)
│   │           ├── line-items/    # Add line items (Phase 1)
│   │           └── ready-to-bill/ # Mark ready to bill
│   ├── admin/
│   │   └── exceptions/            # Exceptions dashboard
│   ├── customers/                  # Customer management page (Phase 1)
│   ├── login/                      # Login page
│   ├── my-work/                    # Technician dashboard with weekly summary
│   ├── work-orders/                # Manager work order views
│   │   └── [id]/                  # Work order detail with comments
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Home (redirect based on role)
│   └── globals.css                 # Global styles
├── components/
│   ├── ActiveTimer.tsx             # Running timer display
│   ├── AddLineItemModal.tsx        # Add line item modal (Phase 1)
│   ├── CommentsSection.tsx         # Comments component (Phase 1)
│   ├── CreateWorkOrderModal.tsx    # Create WO modal (Phase 1)
│   ├── CustomerModal.tsx           # Customer create/edit modal (Phase 1)
│   ├── Navbar.tsx                  # Navigation with role-based links
│   └── WeeklyTimeSummary.tsx       # Weekly time summary (Phase 1)
├── lib/
│   ├── auth.ts                     # Authentication utilities
│   ├── audit.ts                    # Audit logging utilities
│   ├── db.ts                       # Prisma client instance
│   └── guards.ts                   # Immutability guards
├── prisma/
│   ├── migrations/                 # Database migration history
│   │   ├── 20240211000000_init/   # Initial schema with hardening
│   │   ├── 20240212000000_expand_customer_fields/  # Phase 1
│   │   └── 20240213000000_add_comments/            # Phase 1
│   ├── schema.prisma               # Database schema
│   └── seed.ts                     # Demo data seeding
├── middleware.ts                   # Route protection
├── package.json
├── tsconfig.json
└── README.md
```

## Troubleshooting

### Database connection errors

Ensure PostgreSQL is running and credentials in `.env` are correct:

```bash
psql -U username -d work_order_tracker
```

### Migration conflicts

Reset database (development only):

```bash
npx prisma migrate reset
```

### Build errors

Clear Next.js cache:

```bash
rm -rf .next
npm run build
```

## License

Proprietary - All rights reserved

## Support

For issues and questions, contact your system administrator.
