import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function AdminDashboard() {
  // Fetch all stats in parallel
  const [
    totalUsers,
    totalClients,
    totalTradespeople,
    totalJobs,
    openJobs,
    inProgressJobs,
    completedJobs,
    cancelledJobs,
    totalApplications,
    pendingApplications,
    totalReviews,
    averageRating,
    totalPayments,
    totalRevenue,
    pendingPayments,
    recentUsers,
    recentJobs,
  ] = await Promise.all([
    // User stats
    prisma.user.count(),
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.user.count({ where: { role: 'TRADESPERSON' } }),

    // Job stats
    prisma.job.count(),
    prisma.job.count({ where: { status: 'OPEN' } }),
    prisma.job.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.job.count({ where: { status: 'COMPLETED' } }),
    prisma.job.count({ where: { status: 'CANCELLED' } }),

    // Application stats
    prisma.jobApplication.count(),
    prisma.jobApplication.count({ where: { status: 'PENDING' } }),

    // Review stats
    prisma.review.count(),
    prisma.review.aggregate({ _avg: { rating: true } }),

    // Payment stats
    prisma.payment.count(),
    prisma.payment.aggregate({ _sum: { platformFee: true } }),
    prisma.payment.count({ where: { status: 'PENDING' } }),

    // Recent activity
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.job.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: { name: true },
        },
      },
    }),
  ])

  const stats = {
    users: {
      total: totalUsers,
      clients: totalClients,
      tradespeople: totalTradespeople,
      admins: totalUsers - totalClients - totalTradespeople,
    },
    jobs: {
      total: totalJobs,
      open: openJobs,
      inProgress: inProgressJobs,
      completed: completedJobs,
      cancelled: cancelledJobs,
    },
    applications: {
      total: totalApplications,
      pending: pendingApplications,
      accepted: totalApplications - pendingApplications,
    },
    reviews: {
      total: totalReviews,
      averageRating: averageRating._avg.rating || 0,
    },
    payments: {
      total: totalPayments,
      revenue: totalRevenue._sum.platformFee || 0,
      pending: pendingPayments,
    },
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of platform activity and statistics</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.users.total}
          subtitle={`${stats.users.clients} clients, ${stats.users.tradespeople} tradies`}
          icon="👥"
          color="blue"
          link="/admin/users"
        />
        <StatCard
          title="Total Jobs"
          value={stats.jobs.total}
          subtitle={`${stats.jobs.open} open, ${stats.jobs.completed} completed`}
          icon="💼"
          color="green"
          link="/admin/jobs"
        />
        <StatCard
          title="Platform Revenue"
          value={`$${stats.payments.revenue.toFixed(2)}`}
          subtitle={`${stats.payments.total} transactions`}
          icon="💰"
          color="orange"
          link="/admin/payments"
        />
        <StatCard
          title="Average Rating"
          value={stats.reviews.averageRating.toFixed(1)}
          subtitle={`${stats.reviews.total} reviews`}
          icon="⭐"
          color="purple"
          link="/admin/reviews"
        />
      </div>

      {/* Detailed Stats Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Breakdown */}
        <StatsSection title="User Statistics" icon="👥">
          <StatRow label="Total Users" value={stats.users.total} />
          <StatRow label="Clients" value={stats.users.clients} />
          <StatRow label="Tradespeople" value={stats.users.tradespeople} />
          <StatRow label="Admins" value={stats.users.admins} />
        </StatsSection>

        {/* Job Breakdown */}
        <StatsSection title="Job Statistics" icon="💼">
          <StatRow label="Total Jobs" value={stats.jobs.total} />
          <StatRow label="Open Jobs" value={stats.jobs.open} highlight="green" />
          <StatRow label="In Progress" value={stats.jobs.inProgress} highlight="blue" />
          <StatRow label="Completed" value={stats.jobs.completed} />
          <StatRow label="Cancelled" value={stats.jobs.cancelled} highlight="red" />
        </StatsSection>

        {/* Application Breakdown */}
        <StatsSection title="Application Statistics" icon="📝">
          <StatRow label="Total Applications" value={stats.applications.total} />
          <StatRow label="Pending" value={stats.applications.pending} highlight="orange" />
          <StatRow label="Accepted" value={stats.applications.accepted} highlight="green" />
        </StatsSection>

        {/* Payment Breakdown */}
        <StatsSection title="Payment Statistics" icon="💰">
          <StatRow label="Total Transactions" value={stats.payments.total} />
          <StatRow label="Platform Revenue" value={`$${stats.payments.revenue.toFixed(2)}`} />
          <StatRow label="Pending Payments" value={stats.payments.pending} highlight="orange" />
        </StatsSection>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Recent Users</h3>
            <Link href="/admin/users" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'CLIENT' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {user.role}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Recent Jobs</h3>
            <Link href="/admin/jobs" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {recentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{job.title}</p>
                  <p className="text-sm text-gray-500">by {job.client.name}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                    job.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                    job.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                    job.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {job.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    ${job.budget.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, subtitle, icon, color, link }: {
  title: string
  value: string | number
  subtitle: string
  icon: string
  color: 'blue' | 'green' | 'orange' | 'purple'
  link?: string
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  const content = (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  )

  return link ? <Link href={link}>{content}</Link> : content
}

function StatsSection({ title, icon, children }: {
  title: string
  icon: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{icon}</span>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  )
}

function StatRow({ label, value, highlight }: {
  label: string
  value: string | number
  highlight?: 'green' | 'blue' | 'orange' | 'red'
}) {
  const highlightClasses = {
    green: 'text-green-600 font-semibold',
    blue: 'text-blue-600 font-semibold',
    orange: 'text-orange-600 font-semibold',
    red: 'text-red-600 font-semibold',
  }

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-700">{label}</span>
      <span className={highlight ? highlightClasses[highlight] : 'text-gray-900 font-medium'}>
        {value}
      </span>
    </div>
  )
}
