# Vercel Deployment Guide for AnyTrade

## Quick Fix for Current Build Error

The build errors have been fixed! Latest changes:

1. ✅ Downgraded to Prisma 5.22.0 (stable version, fixes schema compatibility)
2. ✅ Moved `prisma` to regular dependencies for Vercel builds
3. ✅ Added automatic Prisma client generation via postinstall script
4. ✅ Updated build command to generate Prisma before building Next.js

**Action Required:** Vercel should automatically redeploy with the latest push. The build should now succeed.

---

## Environment Variables Needed in Vercel

Go to your Vercel project → Settings → Environment Variables and add:

### Required for Build to Succeed:
```
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
```
This allows Prisma to build without downloading engine checksums.

### Required for Authentication to Work:
```bash
# Generate a secret with: openssl rand -base64 32
NEXTAUTH_SECRET=your-random-secret-key-here

# Your production URL (Vercel will provide this)
NEXTAUTH_URL=https://your-app.vercel.app
```

### Required for Database Features (Once You Set Up Supabase):
```bash
# Get this from Supabase dashboard → Settings → Database
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
```

---

## Setting Up Your Supabase Database

### 1. Create a Supabase Project
- Go to https://supabase.com
- Create a new project
- Note your database password

### 2. Get Your Database URL
- In Supabase: Settings → Database → Connection String
- Choose "URI" format
- Copy the connection string
- It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

### 3. Create Database Tables
You have two options:

#### Option A: Using Prisma (Recommended)
```bash
# On your local machine with DATABASE_URL in .env:
npx prisma db push
```

#### Option B: Run SQL directly in Supabase
Copy and run this SQL in Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User roles enum
CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'TRADESPERSON');
CREATE TYPE "JobStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'HELD', 'RELEASED', 'REFUNDED');

-- Users table
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tradesperson profiles
CREATE TABLE "Tradesperson" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL UNIQUE,
    "businessName" TEXT,
    "abn" TEXT,
    "trades" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "yearsExperience" INTEGER,
    "licenseNumber" TEXT,
    "bio" TEXT,
    "serviceAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postcode" TEXT,
    "stripeAccountId" TEXT UNIQUE,
    "stripeOnboarded" BOOLEAN NOT NULL DEFAULT false,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "premiumExpiresAt" TIMESTAMP(3),
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "completedJobs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tradesperson_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Jobs table
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "budget" DOUBLE PRECISION NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'OPEN',
    "preferredDate" TIMESTAMP(3),
    "urgency" TEXT,
    "acceptedTradeId" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Job_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Job Applications table
CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "jobId" TEXT NOT NULL,
    "tradespersonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "proposal" TEXT NOT NULL,
    "quotedPrice" DOUBLE PRECISION NOT NULL,
    "estimatedDays" INTEGER,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobApplication_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JobApplication_tradespersonId_fkey" FOREIGN KEY ("tradespersonId") REFERENCES "Tradesperson"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JobApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JobApplication_jobId_tradespersonId_key" UNIQUE ("jobId", "tradespersonId")
);

-- Reviews table
CREATE TABLE "Review" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "jobId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "tradespersonId" TEXT NOT NULL,
    "reviewedUserId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_tradespersonId_fkey" FOREIGN KEY ("tradespersonId") REFERENCES "Tradesperson"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_reviewedUserId_fkey" FOREIGN KEY ("reviewedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_jobId_reviewerId_key" UNIQUE ("jobId", "reviewerId")
);

-- Payments table
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "jobId" TEXT NOT NULL UNIQUE,
    "clientId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "platformFee" DOUBLE PRECISION NOT NULL,
    "tradespersonAmount" DOUBLE PRECISION NOT NULL,
    "stripePaymentIntent" TEXT UNIQUE,
    "stripeTransferId" TEXT UNIQUE,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "heldAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "Tradesperson_userId_idx" ON "Tradesperson"("userId");
CREATE INDEX "Tradesperson_stripeAccountId_idx" ON "Tradesperson"("stripeAccountId");
CREATE INDEX "Tradesperson_isPremium_idx" ON "Tradesperson"("isPremium");
CREATE INDEX "Job_clientId_idx" ON "Job"("clientId");
CREATE INDEX "Job_category_idx" ON "Job"("category");
CREATE INDEX "Job_status_idx" ON "Job"("status");
CREATE INDEX "Job_postcode_idx" ON "Job"("postcode");
CREATE INDEX "JobApplication_jobId_idx" ON "JobApplication"("jobId");
CREATE INDEX "JobApplication_tradespersonId_idx" ON "JobApplication"("tradespersonId");
CREATE INDEX "JobApplication_userId_idx" ON "JobApplication"("userId");
CREATE INDEX "JobApplication_status_idx" ON "JobApplication"("status");
CREATE INDEX "Review_jobId_idx" ON "Review"("jobId");
CREATE INDEX "Review_tradespersonId_idx" ON "Review"("tradespersonId");
CREATE INDEX "Review_reviewerId_idx" ON "Review"("reviewerId");
CREATE INDEX "Payment_jobId_idx" ON "Payment"("jobId");
CREATE INDEX "Payment_clientId_idx" ON "Payment"("clientId");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
```

### 4. Add DATABASE_URL to Vercel
- Copy your Supabase connection string
- Go to Vercel → Your Project → Settings → Environment Variables
- Add `DATABASE_URL` with your connection string
- Redeploy your app

---

## Deployment Checklist

- [ ] Push latest code to GitHub (✅ Done)
- [ ] Vercel automatically builds (should succeed now)
- [ ] Add `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1` in Vercel env vars
- [ ] Add `NEXTAUTH_SECRET` in Vercel env vars
- [ ] Add `NEXTAUTH_URL` in Vercel env vars (your .vercel.app URL)
- [ ] Create Supabase project and get DATABASE_URL
- [ ] Run database migrations (prisma db push or SQL script above)
- [ ] Add `DATABASE_URL` to Vercel env vars
- [ ] Redeploy from Vercel dashboard
- [ ] Test signup/signin functionality
- [ ] Create test accounts (one client, one tradesperson)
- [ ] Test job posting and applications

---

## Troubleshooting

### Build still failing?
1. Check Vercel build logs for specific errors
2. Ensure `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1` is set in environment variables
3. Try triggering a manual redeploy

### "The datasource property url is no longer supported" error?
This was an issue with Prisma 7.x which has breaking changes. The project now uses Prisma 5.22.0 (stable version) which is compatible with the schema. If you still see this error:
1. Make sure you've pulled the latest code
2. Delete `node_modules` and `package-lock.json`
3. Run `npm install` again
4. Redeploy

### Can't sign in after deploying?
1. Make sure `DATABASE_URL` is set and correct
2. Check that database tables exist in Supabase
3. Verify `NEXTAUTH_SECRET` and `NEXTAUTH_URL` are set correctly

### Database connection errors?
1. Verify your DATABASE_URL is correct
2. Check Supabase project is running
3. Make sure you're using the "Connection String" not "Connection Pooling" URL
4. Ensure your IP is allowed (Supabase allows all by default)

---

## Next Steps After Deployment

Once everything is working:

1. **Test the full user flow:**
   - Sign up as a client
   - Post a job
   - Sign up as a tradesperson
   - Browse and apply to the job
   - (Future: Accept application, complete job, leave review, process payment)

2. **Custom domain (optional):**
   - Go to Vercel → Your Project → Settings → Domains
   - Add your custom domain

3. **Future enhancements:**
   - Stripe Connect for payments
   - Real-time notifications
   - Image uploads for profiles and jobs
   - Premium tradesperson features

---

Need help? Check the main README.md for more details or open an issue on GitHub.
