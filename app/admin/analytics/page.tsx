import { prisma } from '@/lib/prisma'

export default async function AdminAnalyticsPage() {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)

  const [
    totalStats,
    last30Days,
    last7Days,
    topTradespeople,
    topClients,
    categoryStats,
    locationStats,
    growthMetrics,
  ] = await Promise.all([
    // Overall totals
    Promise.all([
      prisma.user.count(),
      prisma.job.count(),
      prisma.payment.aggregate({ _sum: { platformFee: true } }),
      prisma.review.aggregate({ _avg: { rating: true } }),
    ]),

    // Last 30 days
    Promise.all([
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.job.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.payment.aggregate({
        where: { createdAt: { gte: thirtyDaysAgo } },
        _sum: { platformFee: true },
      }),
    ]),

    // Last 7 days
    Promise.all([
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.job.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.payment.aggregate({
        where: { createdAt: { gte: sevenDaysAgo } },
        _sum: { platformFee: true },
      }),
    ]),

    // Top tradespeople by completed jobs
    prisma.tradesperson.findMany({
      take: 10,
      orderBy: { completedJobs: 'desc' },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    }),

    // Top clients by jobs posted
    prisma.user.findMany({
      where: { role: 'CLIENT' },
      take: 10,
      include: {
        _count: {
          select: { jobs: true },
        },
      },
      orderBy: {
        jobs: {
          _count: 'desc',
        },
      },
    }),

    // Jobs by category
    prisma.job.groupBy({
      by: ['category'],
      _count: true,
      orderBy: {
        _count: {
          category: 'desc',
        },
      },
    }),

    // Jobs by location (state)
    prisma.job.groupBy({
      by: ['state'],
      _count: true,
      orderBy: {
        _count: {
          state: 'desc',
        },
      },
    }),

    // Growth metrics (year over year)
    Promise.all([
      prisma.user.count({ where: { createdAt: { gte: oneYearAgo } } }),
      prisma.job.count({ where: { createdAt: { gte: oneYearAgo } } }),
      prisma.payment.aggregate({
        where: { createdAt: { gte: oneYearAgo } },
        _sum: { platformFee: true },
      }),
    ]),
  ])

  const [totalUsers, totalJobs, totalRevenue, avgRating] = totalStats
  const [users30d, jobs30d, revenue30d] = last30Days
  const [users7d, jobs7d, revenue7d] = last7Days
  const [usersYearly, jobsYearly, revenueYearly] = growthMetrics

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
        <p className="text-gray-600 mt-2">Detailed insights and performance metrics</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={totalUsers}
          change={`+${users30d} (30d)`}
          trend="up"
        />
        <MetricCard
          title="Total Jobs"
          value={totalJobs}
          change={`+${jobs30d} (30d)`}
          trend="up"
        />
        <MetricCard
          title="Total Revenue"
          value={`$${totalRevenue._sum.platformFee?.toFixed(2) || '0.00'}`}
          change={`+$${revenue30d._sum.platformFee?.toFixed(2) || '0.00'} (30d)`}
          trend="up"
        />
        <MetricCard
          title="Avg Rating"
          value={avgRating._avg.rating?.toFixed(2) || '0.00'}
          change="Platform average"
          trend="neutral"
        />
      </div>

      {/* Growth Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Growth Trends</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <p className="text-sm text-gray-600 mb-2">User Growth</p>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">Last 7 days</p>
                <p className="text-2xl font-bold text-blue-600">+{users7d}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Last 30 days</p>
                <p className="text-2xl font-bold text-blue-600">+{users30d}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Last 12 months</p>
                <p className="text-2xl font-bold text-blue-600">+{usersYearly}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">Job Growth</p>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">Last 7 days</p>
                <p className="text-2xl font-bold text-green-600">+{jobs7d}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Last 30 days</p>
                <p className="text-2xl font-bold text-green-600">+{jobs30d}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Last 12 months</p>
                <p className="text-2xl font-bold text-green-600">+{jobsYearly}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">Revenue Growth</p>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">Last 7 days</p>
                <p className="text-2xl font-bold text-orange-600">
                  ${revenue7d._sum.platformFee?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Last 30 days</p>
                <p className="text-2xl font-bold text-orange-600">
                  ${revenue30d._sum.platformFee?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Last 12 months</p>
                <p className="text-2xl font-bold text-orange-600">
                  ${revenueYearly._sum.platformFee?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Jobs by Category</h2>
          <div className="space-y-3">
            {categoryStats.map((stat) => (
              <div key={stat.category} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-32 text-sm font-medium text-gray-700 capitalize">
                    {stat.category}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 w-48">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{
                        width: `${(stat._count / totalJobs) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="text-sm font-bold text-gray-900">{stat._count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Jobs by Location</h2>
          <div className="space-y-3">
            {locationStats.map((stat) => (
              <div key={stat.state} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-24 text-sm font-medium text-gray-700">{stat.state}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 w-48">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${(stat._count / totalJobs) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="text-sm font-bold text-gray-900">{stat._count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Top Tradespeople</h2>
          <div className="space-y-4">
            {topTradespeople.map((tradie, index) => (
              <div key={tradie.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {tradie.businessName || tradie.user.name}
                    </p>
                    <p className="text-sm text-gray-500">{tradie.user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{tradie.completedJobs}</p>
                  <p className="text-xs text-gray-500">jobs completed</p>
                  <p className="text-sm text-yellow-600 mt-1">
                    ★ {tradie.averageRating.toFixed(1)} ({tradie.totalReviews})
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Top Clients</h2>
          <div className="space-y-4">
            {topClients.map((client, index) => (
              <div key={client.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
                  <div>
                    <p className="font-medium text-gray-900">{client.name}</p>
                    <p className="text-sm text-gray-500">{client.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{client._count.jobs}</p>
                  <p className="text-xs text-gray-500">jobs posted</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  title,
  value,
  change,
  trend,
}: {
  title: string
  value: string | number
  change: string
  trend: 'up' | 'down' | 'neutral'
}) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600',
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-sm text-gray-600 mb-2">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
      <p className={`text-sm ${trendColors[trend]}`}>{change}</p>
    </div>
  )
}
