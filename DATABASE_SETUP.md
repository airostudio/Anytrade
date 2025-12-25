# Database Setup Guide

## Troubleshooting "Internal Server Error" on Signup

If you're getting internal server errors when trying to create users, it's likely the database isn't set up yet.

---

## Step 1: Check Database Connection

Visit this URL after deployment:
```
https://your-app.vercel.app/api/health/db
```

This will tell you exactly what's wrong:
- ✅ "Database connection successful" - Database is working
- ❌ "Database connection failed" - DATABASE_URL is wrong or database doesn't exist
- ❌ "Database tables don't exist" - Need to run migrations

---

## Step 2: Verify Environment Variables

Make sure these are set in **Vercel → Settings → Environment Variables**:

```bash
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://your-app.vercel.app
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
```

**Important**:
- Replace `[PASSWORD]` with your actual Supabase password
- Replace `xxxxx` with your Supabase project reference ID
- Make sure `DATABASE_URL` uses the **direct connection string**, not the pooler URL

---

## Step 3: Set Up Supabase Database

### Option A: Create Supabase Project (if you haven't)

1. Go to https://supabase.com
2. Click "New Project"
3. Choose:
   - Name: AnyTrade
   - Database Password: (create a strong password and save it!)
   - Region: Choose closest to your users
4. Wait for project to be created (2-3 minutes)

### Option B: Get Your Connection String

1. In Supabase dashboard, go to **Settings → Database**
2. Scroll to **Connection String**
3. Select **URI** (not Session mode or Transaction mode)
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your database password
6. Add this to Vercel environment variables as `DATABASE_URL`

---

## Step 4: Create Database Tables

You have **two options**:

### Option 1: Using Prisma (Recommended - Locally)

On your local machine:

```bash
# Make sure DATABASE_URL is in your local .env file
echo 'DATABASE_URL="your-supabase-connection-string"' > .env

# Generate Prisma client
npx prisma generate

# Create database tables
npx prisma db push
```

This will create all tables automatically from your Prisma schema.

### Option 2: Manual SQL (In Supabase Dashboard)

1. Go to Supabase → **SQL Editor**
2. Click **New Query**
3. Copy and paste this SQL:

```sql
-- Create enums
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
    CONSTRAINT "Tradesperson_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    CONSTRAINT "Job_clientId_fkey" FOREIGN KEY ("clientId")
        REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    CONSTRAINT "JobApplication_jobId_fkey" FOREIGN KEY ("jobId")
        REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JobApplication_tradespersonId_fkey" FOREIGN KEY ("tradespersonId")
        REFERENCES "Tradesperson"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JobApplication_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
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
    CONSTRAINT "Review_jobId_fkey" FOREIGN KEY ("jobId")
        REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId")
        REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_tradespersonId_fkey" FOREIGN KEY ("tradespersonId")
        REFERENCES "Tradesperson"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_reviewedUserId_fkey" FOREIGN KEY ("reviewedUserId")
        REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
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
    CONSTRAINT "Payment_jobId_fkey" FOREIGN KEY ("jobId")
        REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payment_clientId_fkey" FOREIGN KEY ("clientId")
        REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for better performance
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "Tradesperson_userId_idx" ON "Tradesperson"("userId");
CREATE INDEX "Job_clientId_idx" ON "Job"("clientId");
CREATE INDEX "Job_category_idx" ON "Job"("category");
CREATE INDEX "Job_status_idx" ON "Job"("status");
CREATE INDEX "JobApplication_jobId_idx" ON "JobApplication"("jobId");
CREATE INDEX "JobApplication_tradespersonId_idx" ON "JobApplication"("tradespersonId");
```

4. Click **Run** or press `Ctrl+Enter`
5. Wait for confirmation: "Success. No rows returned"

---

## Step 5: Verify Setup

After creating tables:

1. **Check database health**:
   ```
   https://your-app.vercel.app/api/health/db
   ```
   Should return: `"status": "healthy"`

2. **Try creating a test user**:
   - Go to your site
   - Click "Sign Up as Client"
   - Fill in the form
   - If successful, you'll be redirected to sign in!

---

## Common Issues

### Issue: "Database connection failed"
**Solution**:
- Check `DATABASE_URL` in Vercel environment variables
- Make sure you're using the **direct connection** URL (not pooler)
- Verify your Supabase project is active

### Issue: "Database tables don't exist"
**Solution**:
- Run `npx prisma db push` locally with DATABASE_URL in .env
- OR run the SQL script in Supabase SQL Editor

### Issue: "Prisma client not initialized"
**Solution**:
- This shouldn't happen on Vercel (postinstall handles it)
- If it does: trigger a new deployment

### Issue: Changes not reflecting on Vercel
**Solution**:
1. Go to Vercel → Settings → Environment Variables
2. Make a small change (add a space, remove it, save)
3. Go to Deployments tab
4. Click "Redeploy" on the latest deployment

---

## Next Steps

Once database is set up:

1. ✅ Test client signup
2. ✅ Test tradesperson signup
3. ✅ Test job posting
4. ✅ Test job applications

Your platform is ready to go! 🚀
