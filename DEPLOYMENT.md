# Deployment Guide

This document provides step-by-step instructions for deploying to production and managing the production database.

## Quick Deployment Workflow

### Standard Deployment Process (Code + Database)

This is the complete workflow for deploying changes to production:

#### Step 1: Commit and Push to GitHub
```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Your commit message"

# Push to main branch
git push origin main
```

#### Step 1b: Deploy to Vercel
```bash
# Deploy to production using Vercel CLI
vercel --prod
```

**Note**: This manually triggers the production deployment. The deployment typically takes 1-2 minutes. You'll see build logs in the terminal and a deployment URL when complete.

---

#### Step 2: Refresh Production Database

After code is deployed, refresh the production database with sample data:

##### 2a. Switch to Production Environment
```bash
# Backup local .env and use production .env.cloud
mv .env .env.backup
cp .env.cloud .env
```

##### 2b. Check Migration Status
```bash
# Verify all migrations are applied
npx prisma migrate status --schema=prisma/schema.prisma
```

**Expected Output**: `Database schema is up to date!`

If migrations are needed, run:
```bash
npx prisma migrate deploy --schema=prisma/schema.prisma
```

##### 2c. Reseed Sample Data
```bash
# Run the sample data seeding script
npm run seed:sample
```

This creates:
- 3 Customers
- 3 Work Orders (various statuses)
- 2 Estimates
- 3 Parts
- Sample users with role-based accounts

**Sample Accounts** (password: `password123`):
- Tech 1: mike.tech@shop.com
- Tech 2: sarah.tech@shop.com
- Service Writer: david.writer@shop.com
- Parts Manager: lisa.parts@shop.com

##### 2d. Restore Local Environment
```bash
# Switch back to local environment
mv .env.backup .env
```

---

### Summary of Complete Deployment

When you run through the full deployment process, you will:
1. ✅ Commit and push code to GitHub main branch
2. ✅ Deploy to Vercel using CLI (`vercel --prod`)
3. ✅ Switch to production environment files
4. ✅ Verify/apply database migrations
5. ✅ Reseed sample data
6. ✅ Restore local environment
7. ✅ Verify production site is working

---

## Complete Production Deployment Checklist

Use this checklist for full production deployments:

- [ ] All code changes committed locally
- [ ] Local tests passing (if applicable)
- [ ] Push to GitHub main branch
- [ ] Verify Vercel deployment succeeds (check dashboard or wait for notification)
- [ ] Switch to production environment (.env.cloud)
- [ ] Check migration status
- [ ] Apply migrations if needed
- [ ] Reseed database with sample data
- [ ] Restore local environment (.env)
- [ ] Test production site with sample accounts
- [ ] Verify new features work as expected

---

## Environment Files

- **`.env`**: Local development environment (local PostgreSQL)
- **`.env.cloud`**: Production environment (Supabase PostgreSQL on port 6543)
- **`.env.backup`**: Temporary backup during production operations

**Important**: Never commit `.env` or `.env.cloud` to version control. These files contain sensitive credentials.

---

## Database Connection Details

### Local Database
- Host: localhost
- Port: 5432
- Database: work_order_db

### Production Database (Supabase)
- Host: db.enwmtwlpykmrrkzdbzyg.supabase.co
- Port: **6543** (Transaction Pooling - required for connection)
- Database: postgres

**Critical**: Always use port **6543** for Supabase connections, not port 5432. The transaction pooling mode is required.

---

## Troubleshooting

### "Can't reach database server at port 5432"
**Solution**: Make sure you're using `.env.cloud` which has the correct port 6543 connection string.

### Vercel deployment not triggering
**Solution**:
1. Check GitHub repository settings → Webhooks
2. Verify Vercel integration is connected
3. Manually trigger deployment from Vercel dashboard if needed

### Migration conflicts
**Solution**:
1. Check migration status: `npx prisma migrate status`
2. Review migration files in `prisma/migrations/`
3. If needed, reset with: `npx prisma migrate reset` (⚠️ DESTRUCTIVE - local only)

### Seed script fails
**Solution**:
1. Check database connection (migration status command should work)
2. Verify Prisma client is generated: `npx prisma generate`
3. Check for data conflicts (script may fail if data already exists)

---

## Production Verification

After deployment, test these critical paths:

1. **Authentication**: Login with sample accounts
2. **Role-based access**: Verify each role sees appropriate navigation/features
3. **Dashboard**: Check all role-specific dashboards render correctly
4. **Work Orders**: Create, edit, and view work orders
5. **Time Tracking**: Start/stop timers (TECH role)
6. **Parts Management**: Issue parts, check inventory
7. **Reports**: Generate and view reports

---

## Rollback Procedure

If deployment causes issues:

### Code Rollback
```bash
# Revert to previous commit
git revert HEAD
git push origin main
```

### Database Rollback
**Note**: Database rollbacks are complex. Best practice:
1. Always backup production data before major changes
2. Test migrations on staging/local first
3. For emergencies, restore from Supabase automatic backups (Point-in-time recovery)

---

## Automated Deployment (Future Enhancement)

Consider setting up:
- GitHub Actions for automated testing before deployment
- Staging environment for pre-production testing
- Database migration automation with rollback capabilities
- Health checks and monitoring

---

## Quick Reference Commands

### Full Deployment (Code + Database) - RECOMMENDED
Complete deployment workflow including git push and Vercel deployment:

```bash
# Stage, commit, and push to GitHub
git add . && \
git commit -m "Your deployment message" && \
git push origin main && \

# Deploy to Vercel production
vercel --prod && \

# Switch to production environment
mv .env .env.backup && \
cp .env.cloud .env && \

# Check migrations and reseed database
npx prisma migrate status --schema=prisma/schema.prisma && \
npm run seed:sample && \

# Restore local environment
mv .env.backup .env

echo "✅ Deployment complete! Production site is live with fresh data."
```

### Database Refresh Only (No Code Changes)
Use this when you only need to reseed the production database:

```bash
# Switch to production environment
mv .env .env.backup && \
cp .env.cloud .env && \

# Reseed database
npm run seed:sample && \

# Restore local environment
mv .env.backup .env

echo "✅ Database refresh complete!"
```

### Code Deployment Only (No Database Changes)
Use this when you only have code changes and don't need to refresh the database:

```bash
# Stage, commit, and push to GitHub
git add . && \
git commit -m "Your commit message" && \
git push origin main && \

# Deploy to Vercel production
vercel --prod

echo "✅ Code deployed to production!"
```

### Check Git Status
Before deploying, check what changes will be committed:

```bash
# View staged and unstaged changes
git status

# View detailed diff of changes
git diff
```

---

**Last Updated**: 2026-02-12 (Updated to include manual Vercel deployment via CLI)
