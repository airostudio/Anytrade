import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { signOut } from '@/lib/auth'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export default async function TradespersonDashboardPage() {
  const session = await auth()

  if (!session || session.user.role !== 'TRADESPERSON') {
    redirect('/tradesperson/signin')
  }

  // Fetch tradesperson profile
  const tradesperson = await prisma.tradesperson.findUnique({
    where: { userId: session.user.id },
    include: {
      _count: {
        select: {
          applications: true,
          reviews: true,
        },
      },
    },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              AnyTrade
            </Link>
            <span className="text-sm text-gray-500">Tradesperson Dashboard</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Welcome, {session.user.name}</span>
            <form
              action={async () => {
                'use server'
                await signOut({ redirectTo: '/' })
              }}
            >
              <button
                type="submit"
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Dashboard
          </h1>
          <p className="text-gray-600">
            Find jobs and manage your applications
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-sm text-gray-600 mb-1">Average Rating</div>
            <div className="text-3xl font-bold text-gray-900">
              {tradesperson?.averageRating.toFixed(1) || '0.0'}
              <span className="text-lg text-yellow-500 ml-1">★</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-sm text-gray-600 mb-1">Total Reviews</div>
            <div className="text-3xl font-bold text-gray-900">
              {tradesperson?.totalReviews || 0}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-sm text-gray-600 mb-1">Completed Jobs</div>
            <div className="text-3xl font-bold text-gray-900">
              {tradesperson?.completedJobs || 0}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-sm text-gray-600 mb-1">Applications</div>
            <div className="text-3xl font-bold text-gray-900">
              {tradesperson?._count.applications || 0}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/tradesperson/dashboard/jobs"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Browse Available Jobs
                </h3>
                <p className="text-gray-600 text-sm">
                  Find new opportunities in your area
                </p>
              </div>
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </Link>

          <Link
            href="/tradesperson/dashboard/applications"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  My Applications
                </h3>
                <p className="text-gray-600 text-sm">
                  Track your job applications
                </p>
              </div>
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
          </Link>

          <Link
            href="/tradesperson/dashboard/profile"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  My Profile
                </h3>
                <p className="text-gray-600 text-sm">
                  Update your professional information
                </p>
              </div>
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          </Link>
        </div>

        {/* Trades & Service Areas */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Your Trades & Service Areas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Trades</h3>
              <div className="flex flex-wrap gap-2">
                {tradesperson?.trades.map((trade) => (
                  <span
                    key={trade}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                  >
                    {trade}
                  </span>
                ))}
                {(!tradesperson?.trades || tradesperson.trades.length === 0) && (
                  <span className="text-gray-500 text-sm">No trades specified</span>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Service Areas</h3>
              <div className="flex flex-wrap gap-2">
                {tradesperson?.serviceAreas.map((area) => (
                  <span
                    key={area}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {area}
                  </span>
                ))}
                {(!tradesperson?.serviceAreas || tradesperson.serviceAreas.length === 0) && (
                  <span className="text-gray-500 text-sm">No service areas specified</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <div className="text-center py-12 text-gray-500">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p>No applications yet</p>
            <Link
              href="/tradesperson/dashboard/jobs"
              className="text-green-600 hover:text-green-700 font-semibold mt-2 inline-block"
            >
              Browse available jobs →
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
