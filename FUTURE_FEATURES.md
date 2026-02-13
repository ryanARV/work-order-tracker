# 🚀 Future Feature Roadmap
**Vision:** Transform into a complete service operations platform with customer engagement

---

## 🌟 PHASE 3: Customer Portal & Advanced Features

### Priority 1: Customer Portal (HIGH IMPACT) 🔥

#### Overview
A secure, read-only customer portal allowing customers to:
- Track repair progress in real-time
- View estimates and approve/reject remotely
- Upload photos/documents
- Communicate with service team
- View invoices and payment history

#### Security Architecture

**Multi-Tenant Isolation:**
```typescript
// Database row-level security (RLS) on Supabase
CREATE POLICY "Customers can only see their own data"
ON work_orders FOR SELECT
USING (customer_id = auth.uid());

// Application-level checks
const workOrder = await prisma.workOrder.findFirst({
  where: {
    id: woId,
    customerId: session.customerId, // ← Critical: always filter by customer
  }
});
```

**Separate Authentication System:**
- **Staff Portal:** `/login` → NextAuth with credentials
- **Customer Portal:** `/customer/login` → Magic link email authentication
  - No password required (reduces security risk)
  - Time-limited JWT tokens (24 hour expiry)
  - Email verification on every login
  - Rate limiting to prevent abuse

**Role Hierarchy:**
```typescript
enum UserRole {
  // Staff roles (full access)
  ADMIN
  MANAGER
  SERVICE_WRITER
  PARTS
  TECH

  // Customer role (read-only + limited actions)
  CUSTOMER // ← NEW
}
```

**Database Schema Changes:**
```prisma
model Customer {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String
  phone         String?

  // Customer portal access
  portalEnabled Boolean  @default(false)
  portalToken   String?  @unique // Magic link token
  portalTokenExpiry DateTime?
  lastPortalLogin DateTime?

  workOrders    WorkOrder[]
  estimates     Estimate[]
  messages      CustomerMessage[]
  uploads       CustomerUpload[]
}

model CustomerMessage {
  id          String   @id @default(cuid())
  customerId  String
  customer    Customer @relation(fields: [customerId], references: [id])
  workOrderId String?
  workOrder   WorkOrder? @relation(fields: [workOrderId], references: [id])

  message     String   @db.Text
  isFromCustomer Boolean // true = customer sent, false = staff reply
  readAt      DateTime?

  createdAt   DateTime @default(now())
  createdBy   String?  // Staff user ID if staff reply
}

model CustomerUpload {
  id          String   @id @default(cuid())
  customerId  String
  customer    Customer @relation(fields: [customerId], references: [id])
  workOrderId String?
  workOrder   WorkOrder? @relation(fields: [workOrderId], references: [id])

  fileName    String
  fileUrl     String   // S3/Supabase Storage URL
  fileType    String   // image/jpeg, application/pdf
  fileSize    Int
  description String?

  uploadedAt  DateTime @default(now())
}
```

#### Customer Portal Pages

**1. Customer Login (`/customer/login`)**
```typescript
// Magic link authentication flow
1. Customer enters email
2. System sends magic link to email
3. Customer clicks link → auto-login with JWT
4. JWT stored in httpOnly cookie (XSS protection)
5. Session expires after 24 hours
```

**Visual Design:**
- Clean, minimal login form
- "Enter your email to view your repairs" messaging
- Branded to match your shop
- No password field (magic link only)

**2. Customer Dashboard (`/customer/dashboard`)**
```typescript
interface CustomerDashboard {
  activeRepairs: WorkOrder[] // status !== CLOSED
  estimates: Estimate[] // pending customer approval
  recentActivity: Activity[] // last 30 days
  messages: Message[] // unread count
}
```

**Features:**
- Card-based layout showing all active work orders
- Status badges (In Progress, Waiting Parts, Ready for Pickup)
- Progress indicators (3/5 tasks complete)
- Estimated completion date
- Quick actions: "Approve Estimate", "View Invoice", "Send Message"

**3. Work Order Detail (`/customer/work-order/[id]`)**

**What Customers CAN See:**
- ✅ Work order number and status
- ✅ Progress timeline (visual stepper)
- ✅ Line items with descriptions (complaint/correction)
- ✅ Parts list with descriptions (NO PRICES if you prefer)
- ✅ Estimated completion date
- ✅ Photos/attachments uploaded by techs
- ✅ Messages/updates from service team
- ✅ Total estimate vs actual time (transparency)

**What Customers CANNOT See:**
- ❌ Internal notes/comments
- ❌ Tech names (optional privacy setting)
- ❌ Internal time tracking details
- ❌ Labor rates or cost breakdowns (unless you enable)
- ❌ Other customers' data (enforced by RLS)

**Visual Design:**
- Timeline view showing status progression
- Photo gallery if images uploaded
- Message thread at bottom
- Upload button for customer photos/documents

**4. Estimate Approval (`/customer/estimate/[id]`)**

**Features:**
- View estimate details (line items, parts, labor)
- Approve or Request Changes buttons
- Add comments/questions
- Digital signature (optional)
- Email notification to service writer on action

**Workflow:**
```
1. Service Writer creates estimate
2. System emails customer with magic link
3. Customer reviews and approves/rejects
4. Status updates in staff portal
5. If approved → one-click convert to WO
```

**5. Message Center (`/customer/messages`)**

**Features:**
- Threaded conversations per work order
- Real-time updates (polling or websockets)
- Attach photos (before damage photos, etc.)
- Read receipts
- Email notifications for new staff replies

**6. Upload Photos/Documents (`/customer/work-order/[id]/upload`)**

**Allowed File Types:**
- Images: JPEG, PNG, HEIC (convert to JPEG)
- Documents: PDF only
- Max size: 10MB per file
- Virus scanning (ClamAV or cloud service)

**Storage:**
- Supabase Storage (secure, CDN-backed)
- Or AWS S3 with presigned URLs
- Files linked to specific work order
- Auto-delete after WO closed + 90 days

---

### Implementation Phases for Customer Portal

#### Phase A: Foundation (Week 1)
- [ ] Add Customer model fields for portal access
- [ ] Create CustomerMessage and CustomerUpload models
- [ ] Set up Supabase Storage for file uploads
- [ ] Implement magic link authentication
- [ ] Create `/customer/login` page

#### Phase B: Core Portal (Week 2)
- [ ] Build customer dashboard
- [ ] Work order detail view (read-only)
- [ ] Message center (send/receive)
- [ ] File upload functionality

#### Phase C: Estimate Workflow (Week 3)
- [ ] Estimate approval page
- [ ] Email notifications
- [ ] Digital signature capture
- [ ] Auto-convert on approval

#### Phase D: Polish & Security (Week 4)
- [ ] Rate limiting on login attempts
- [ ] File scanning for uploads
- [ ] Activity logging for audit
- [ ] Mobile optimization
- [ ] Customer onboarding emails

---

## 🎯 Other Modern Platform Features

### 1. CompanyCam-Style Photo Management

**Features from CompanyCam:**
- Before/after photo comparisons
- Auto-organize by work order and date
- Draw/annotate on photos
- Automatic GPS tagging
- Share photo albums with customers

**Implementation:**
```typescript
model Photo {
  id          String   @id @default(cuid())
  workOrderId String
  workOrder   WorkOrder @relation(fields: [workOrderId], references: [id])

  url         String   // CDN URL
  thumbnail   String   // 200x200 thumbnail
  type        PhotoType // BEFORE, DURING, AFTER, DAMAGE, REPAIR

  takenAt     DateTime @default(now())
  takenBy     String   // User ID
  gpsLat      Float?
  gpsLng      Float?

  annotations Json?    // Drawing data if annotated
  description String?
  isVisibleToCustomer Boolean @default(true)
}
```

**UI Features:**
- Gallery view on WO detail page
- Before/after slider comparison
- Lightbox for full-screen viewing
- Download all as ZIP
- Share link generation (public URL with expiry)

**Mobile App (Future):**
- Native camera integration
- Offline photo capture
- Auto-sync when online
- Voice-to-text for descriptions

---

### 2. Salesforce-Style Activity Timeline

**What it is:** Unified activity feed showing everything that happened on a WO

**Timeline Events:**
- 🔵 Work order created
- ✏️ Status changed
- 👤 Tech assigned
- ⏱️ Timer started/stopped
- 💬 Comment added
- 📎 File uploaded
- 🔧 Part issued
- 📧 Email sent to customer
- ✅ Task completed

**Implementation:**
```typescript
model ActivityLog {
  id          String   @id @default(cuid())
  workOrderId String?
  workOrder   WorkOrder? @relation(fields: [workOrderId], references: [id])

  type        ActivityType
  description String
  metadata    Json?    // Extra data (e.g., which part, which tech)

  actorId     String   // Who did the action
  actor       User     @relation(fields: [actorId], references: [id])

  createdAt   DateTime @default(now())
}
```

**UI:**
- Vertical timeline on WO detail page
- Color-coded icons per event type
- Expandable details
- Filter by event type
- Export to PDF for customer

---

### 3. Smart Notifications & Alerts

**Customer Notifications:**
- 📧 Email when estimate ready
- 📧 Email when WO status changes
- 📧 Email when repair complete
- 📱 SMS for urgent updates (Twilio)
- 🔔 In-app notifications when logged in

**Staff Notifications:**
- 🔔 Tech: New assignment
- 🔔 Parts: Low stock alert
- 🔔 Service Writer: Estimate approved by customer
- 🔔 Manager: WO exceeding estimate by >20%
- 🔔 Admin: New customer message

**Implementation:**
```typescript
model NotificationPreference {
  userId      String   @id
  user        User     @relation(fields: [userId], references: [id])

  emailEnabled    Boolean @default(true)
  smsEnabled      Boolean @default(false)
  pushEnabled     Boolean @default(true)

  notifyOnAssignment  Boolean @default(true)
  notifyOnMessage     Boolean @default(true)
  notifyOnEstimate    Boolean @default(true)
}
```

---

### 4. Automated Workflows & Rules

**Inspired by Salesforce Process Builder:**

**Example Rules:**
1. **Auto-Assign Tech by Skill**
   - IF line item contains "electrical" → assign to Tech A
   - IF line item contains "hydraulic" → assign to Tech B

2. **Auto-Escalate Stale WOs**
   - IF WO in "In Progress" for >5 days → notify Manager

3. **Auto-Request Parts**
   - IF part quantity < reorder level → create purchase order

4. **Auto-Send Customer Updates**
   - IF WO status → "Ready for Pickup" → send email + SMS

**Implementation:**
```typescript
model AutomationRule {
  id          String   @id @default(cuid())
  name        String
  trigger     TriggerType // STATUS_CHANGE, TIME_BASED, FIELD_UPDATE

  conditions  Json     // { field: "status", operator: "equals", value: "IN_PROGRESS" }
  actions     Json     // [{ type: "SEND_EMAIL", template: "ready-for-pickup" }]

  isActive    Boolean  @default(true)
  createdBy   String
  createdAt   DateTime @default(now())
}
```

---

### 5. Mobile-First PWA

**Progressive Web App Features:**
- Install to home screen (iOS/Android)
- Offline mode for viewing recent WOs
- Camera integration for photo capture
- Push notifications
- GPS tracking for mobile techs

**Use Cases:**
- Techs in the shop can clock in/out from phone
- Snap photos and upload instantly
- View assigned tasks on mobile
- Update WO status from phone

**Tech Stack:**
- Next.js PWA plugin
- Service workers for offline
- IndexedDB for local storage
- Web Share API for sharing

---

### 6. Integrations & API

**QuickBooks Integration:**
- Sync customers from QB
- Export invoices to QB
- Sync parts costs
- Track AR aging

**Stripe/Square Payments:**
- Accept deposits on estimates
- Charge cards on file
- Send payment links to customers
- Track payment status

**Twilio SMS:**
- Send status updates
- Two-way messaging
- Appointment reminders

**Email Service (SendGrid/Postmark):**
- Transactional emails
- Estimate PDFs
- Invoice delivery
- Marketing campaigns (future)

---

### 7. Advanced Reporting & Analytics

**Dashboard Widgets:**
- Revenue by month (chart)
- Top 10 customers by spend
- Tech utilization %
- Average days to completion
- Parts inventory value
- Estimate approval rate

**Custom Report Builder:**
- Drag-and-drop fields
- Filter by date range
- Group by customer/tech/status
- Export to Excel/PDF
- Schedule email delivery

---

### 8. Scheduling & Calendar View

**Features:**
- Calendar view of scheduled jobs
- Drag-and-drop to reschedule
- Tech availability tracking
- Appointment booking (customer-facing)
- Reminder emails/SMS

**Implementation:**
```typescript
model Appointment {
  id          String   @id @default(cuid())
  workOrderId String?
  customer    Customer @relation(...)

  scheduledStart DateTime
  scheduledEnd   DateTime
  assignedTechId String?

  status      AppointmentStatus // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
  notes       String?
}
```

---

## 🎯 Recommended Roadmap (6-12 Months)

### Q1 2026: Customer Portal
- Sprint 5: Process Polish (OoS, QC, Goodwill) - **2 weeks**
- Sprint 6: Customer Portal Foundation - **3 weeks**
- Sprint 7: Estimate Approval + Messaging - **2 weeks**

**Outcome:** Customers can track repairs, approve estimates, communicate

### Q2 2026: Photo Management & Mobile
- Sprint 8: Photo Upload & Gallery - **2 weeks**
- Sprint 9: Mobile PWA - **3 weeks**
- Sprint 10: Before/After Comparisons - **1 week**

**Outcome:** Techs can capture photos, customers can view progress visually

### Q3 2026: Automation & Integrations
- Sprint 11: Notification System - **2 weeks**
- Sprint 12: QuickBooks Integration - **3 weeks**
- Sprint 13: Payment Processing (Stripe) - **2 weeks**

**Outcome:** Automated workflows, accounting integration, online payments

### Q4 2026: Advanced Features
- Sprint 14: Activity Timeline - **1 week**
- Sprint 15: Advanced Reporting - **2 weeks**
- Sprint 16: Scheduling Calendar - **3 weeks**

**Outcome:** Complete platform with scheduling, advanced analytics, automation

---

## 🔒 Security Best Practices

### Customer Portal Security Checklist

1. **Authentication:**
   - ✅ Magic links only (no passwords to steal)
   - ✅ JWT tokens with short expiry (24 hours)
   - ✅ httpOnly cookies (prevent XSS)
   - ✅ Rate limiting on login (prevent brute force)

2. **Authorization:**
   - ✅ Row-level security on database
   - ✅ Always filter queries by customerId
   - ✅ Never expose internal IDs to customers
   - ✅ Validate all input server-side

3. **Data Protection:**
   - ✅ HTTPS only (no HTTP)
   - ✅ Encrypt PII at rest
   - ✅ Redact sensitive data in logs
   - ✅ Regular security audits

4. **File Uploads:**
   - ✅ Scan for viruses (ClamAV)
   - ✅ Validate file types (whitelist only)
   - ✅ Size limits (10MB max)
   - ✅ Store in CDN (not local filesystem)
   - ✅ Auto-delete after retention period

5. **Monitoring:**
   - ✅ Log all customer portal access
   - ✅ Alert on suspicious activity
   - ✅ Track failed login attempts
   - ✅ Monitor for data exfiltration

---

## 💡 Customer Portal vs. Existing Platforms

### How You'll Compete:

**vs. Generic CRMs (Salesforce, HubSpot):**
- ✅ Built specifically for service shops
- ✅ No expensive per-user licensing
- ✅ Simpler, more focused UI
- ✅ Integrated with your existing workflow

**vs. Generic Project Management (Asana, Monday):**
- ✅ Industry-specific features (parts, labor, estimates)
- ✅ Customer portal built-in
- ✅ Time tracking designed for techs
- ✅ Repair-specific reporting

**vs. CompanyCam:**
- ✅ Photos + work orders in one system
- ✅ Full business management (not just photos)
- ✅ Estimate and billing integrated
- ✅ Lower total cost of ownership

**Your Competitive Advantage:**
- 🎯 Purpose-built for service operations
- 🎯 All-in-one (no integrations needed)
- 🎯 Modern UI that rivals commercial software
- 🎯 You own the code (can customize infinitely)
- 🎯 No per-user fees (host yourself)

---

## 📊 ROI of Customer Portal

**Benefits to Your Shop:**
1. **Reduced Phone Calls:** Customers self-serve for status updates (-30% calls)
2. **Faster Estimate Approvals:** Digital approval vs. phone tag (-2 days average)
3. **Customer Satisfaction:** Transparency builds trust (+20% repeat customers)
4. **Professional Image:** Modern portal = professional shop
5. **Upsell Opportunities:** Show before/after photos → sell more services

**Customer Benefits:**
1. Track repair progress 24/7
2. Approve estimates from anywhere
3. Upload damage photos immediately
4. Message shop without calling
5. View history of all past repairs

---

## 🎯 Next Steps

1. **Finish Sprint 5** (This week)
   - Out of Service flag
   - QC approval buttons
   - Goodwill tracking
   - CSV export

2. **Plan Customer Portal** (Next week)
   - Detailed technical spec
   - UI/UX mockups
   - Security review
   - Timeline and milestones

3. **Proof of Concept** (Week 3-4)
   - Build login + simple dashboard
   - Test with 1-2 customers
   - Gather feedback
   - Iterate on design

**Would you like me to start Sprint 5 now, or dive deeper into customer portal planning?**
