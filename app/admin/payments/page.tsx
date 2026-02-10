import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function AdminPaymentsPage() {
  const [payments, paymentStats] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        job: {
          select: {
            title: true,
            budget: true,
          },
        },
        client: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
    Promise.all([
      prisma.payment.count({ where: { status: 'PENDING' } }),
      prisma.payment.count({ where: { status: 'HELD' } }),
      prisma.payment.count({ where: { status: 'RELEASED' } }),
      prisma.payment.count({ where: { status: 'REFUNDED' } }),
      prisma.payment.aggregate({
        _sum: {
          amount: true,
          platformFee: true,
          tradespersonAmount: true,
        },
      }),
    ]),
  ])

  const [pendingCount, heldCount, releasedCount, refundedCount, totals] = paymentStats

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
        <p className="text-gray-600 mt-2">Track all financial transactions and platform revenue</p>
      </div>

      {/* Revenue Overview */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-8 text-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <p className="text-green-100 text-sm">Total Transaction Volume</p>
            <p className="text-5xl font-bold mt-2">${totals._sum.amount?.toFixed(2) || '0.00'}</p>
            <p className="text-green-100 text-sm mt-2">{payments.length} transactions</p>
          </div>
          <div>
            <p className="text-green-100 text-sm">Platform Revenue (12.5%)</p>
            <p className="text-5xl font-bold mt-2">${totals._sum.platformFee?.toFixed(2) || '0.00'}</p>
            <p className="text-green-100 text-sm mt-2">Total fees collected</p>
          </div>
          <div>
            <p className="text-green-100 text-sm">Tradesperson Earnings</p>
            <p className="text-5xl font-bold mt-2">
              ${totals._sum.tradespersonAmount?.toFixed(2) || '0.00'}
            </p>
            <p className="text-green-100 text-sm mt-2">Paid to tradespeople</p>
          </div>
        </div>
      </div>

      {/* Status Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{pendingCount}</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Escrow</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{heldCount}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <span className="text-2xl">🔒</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Released</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{releasedCount}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Refunded</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{refundedCount}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <span className="text-2xl">↩️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-4">
          <input
            type="search"
            placeholder="Search by job title or client..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="HELD">Held (Escrow)</option>
            <option value="RELEASED">Released</option>
            <option value="REFUNDED">Refunded</option>
          </select>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
            <option value="">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Platform Fee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tradie Gets
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-gray-500">
                      {payment.id.substring(0, 8)}...
                    </div>
                    {payment.stripePaymentIntent && (
                      <div className="text-xs text-gray-400">
                        Stripe: {payment.stripePaymentIntent.substring(0, 12)}...
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {payment.job.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      Budget: ${payment.job.budget.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{payment.client.name}</div>
                    <div className="text-xs text-gray-500">{payment.client.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">
                      ${payment.amount.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-green-600">
                      ${payment.platformFee.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">12.5%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${payment.tradespersonAmount.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">87.5%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        payment.status === 'PENDING'
                          ? 'bg-orange-100 text-orange-800'
                          : payment.status === 'HELD'
                          ? 'bg-blue-100 text-blue-800'
                          : payment.status === 'RELEASED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {payment.status}
                    </span>
                    {payment.status === 'HELD' && payment.heldAt && (
                      <div className="text-xs text-gray-500 mt-1">
                        Since: {new Date(payment.heldAt).toLocaleDateString()}
                      </div>
                    )}
                    {payment.status === 'RELEASED' && payment.releasedAt && (
                      <div className="text-xs text-gray-500 mt-1">
                        On: {new Date(payment.releasedAt).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/admin/payments/${payment.id}`}
                      className="text-orange-600 hover:text-orange-900 mr-3"
                    >
                      View
                    </Link>
                    {payment.status === 'HELD' && (
                      <button className="text-green-600 hover:text-green-900 mr-3">
                        Release
                      </button>
                    )}
                    {payment.status === 'PENDING' && (
                      <button className="text-red-600 hover:text-red-900">Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
