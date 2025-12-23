# AnyTrade - Tradesperson Marketplace Platform

A modern marketplace platform connecting clients with verified tradespeople. Built with Next.js 14, Prisma, NextAuth, and Stripe.

## Features

- 🔐 **Dual Authentication**: Separate sign-up/sign-in for clients and tradespeople
- 💼 **Job Posting**: Clients can post jobs with detailed requirements
- 🔍 **Job Browsing**: Tradespeople can search and filter available jobs
- 📝 **Application System**: Apply to jobs with proposals and quotes
- ⭐ **Rating System**: 5-star reviews for completed work (coming soon)
- 💳 **Escrow Payments**: Stripe Connect integration (coming soon)
- 🎨 **Beautiful UI**: Fullscreen slideshow background with tradesperson images
- 📱 **Responsive Design**: Works seamlessly on all devices

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Authentication**: NextAuth.js v5
- **Payments**: Stripe Connect (coming soon)
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18.17.0 or higher
- PostgreSQL database (we recommend Supabase)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd AnyTrade
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env` file in the root directory:

```env
# Database - Get from Supabase
DATABASE_URL="postgresql://user:password@host:port/database"

# NextAuth - Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Stripe (optional, for future payments feature)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Prisma
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
```

4. Set up the database:

```bash
# Generate Prisma Client
npx prisma generate

# Push database schema to Supabase
npx prisma db push
```

5. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database Schema

The platform includes these core models:

- **User**: Authentication and user management
- **Tradesperson**: Professional profiles with trades and service areas
- **Job**: Job postings by clients
- **JobApplication**: Applications from tradespeople
- **Review**: Ratings and reviews
- **Payment**: Escrow payment tracking

## Project Structure

```
app/
├── api/              # API routes
│   ├── auth/         # Authentication endpoints
│   └── jobs/         # Job and application endpoints
├── client/           # Client pages
│   ├── signin/
│   ├── signup/
│   └── dashboard/
├── tradesperson/     # Tradesperson pages
│   ├── signin/
│   ├── signup/
│   └── dashboard/
├── components/       # Reusable components
└── page.tsx          # Homepage
```

## Deploy to Vercel

1. Update `.env` with your Supabase DATABASE_URL
2. Run `npx prisma db push` to create tables
3. Push code to GitHub
4. Import project in Vercel
5. Add environment variables in Vercel dashboard
6. Deploy

## Environment Variables for Production

Required in Vercel:
- `DATABASE_URL` - Your Supabase connection string
- `NEXTAUTH_SECRET` - Random secret key
- `NEXTAUTH_URL` - Your production URL
- `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1`

## User Flows

**Clients**: Sign up → Post job → Receive applications → Hire tradesperson

**Tradespeople**: Sign up → Browse jobs → Submit proposals → Get hired

## License

MIT License
