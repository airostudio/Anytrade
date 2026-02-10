import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function AdminReviewsPage() {
  const [reviews, reviewStats] = await Promise.all([
    prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        job: {
          select: {
            title: true,
          },
        },
        reviewer: {
          select: {
            name: true,
            email: true,
          },
        },
        tradesperson: {
          select: {
            businessName: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    }),
    Promise.all([
      prisma.review.count({ where: { rating: 5 } }),
      prisma.review.count({ where: { rating: 4 } }),
      prisma.review.count({ where: { rating: 3 } }),
      prisma.review.count({ where: { rating: 2 } }),
      prisma.review.count({ where: { rating: 1 } }),
      prisma.review.aggregate({ _avg: { rating: true } }),
    ]),
  ])

  const [fiveStars, fourStars, threeStars, twoStars, oneStar, avgRating] = reviewStats

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Review Management</h1>
        <p className="text-gray-600 mt-2">Monitor and moderate customer reviews</p>
      </div>

      {/* Rating Overview */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-lg p-8 text-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="text-purple-100 text-sm">Average Rating</p>
            <div className="flex items-baseline mt-2">
              <p className="text-6xl font-bold">{avgRating._avg.rating?.toFixed(2) || '0.00'}</p>
              <span className="text-3xl ml-2">★</span>
            </div>
            <p className="text-purple-100 text-sm mt-2">{reviews.length} total reviews</p>
          </div>
          <div className="space-y-2">
            <RatingBar stars={5} count={fiveStars} total={reviews.length} />
            <RatingBar stars={4} count={fourStars} total={reviews.length} />
            <RatingBar stars={3} count={threeStars} total={reviews.length} />
            <RatingBar stars={2} count={twoStars} total={reviews.length} />
            <RatingBar stars={1} count={oneStar} total={reviews.length} />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <div className="text-4xl mb-2">⭐⭐⭐⭐⭐</div>
            <p className="text-3xl font-bold text-gray-900">{fiveStars}</p>
            <p className="text-sm text-gray-600 mt-1">5 Stars</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <div className="text-4xl mb-2">⭐⭐⭐⭐</div>
            <p className="text-3xl font-bold text-gray-900">{fourStars}</p>
            <p className="text-sm text-gray-600 mt-1">4 Stars</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <div className="text-4xl mb-2">⭐⭐⭐</div>
            <p className="text-3xl font-bold text-gray-900">{threeStars}</p>
            <p className="text-sm text-gray-600 mt-1">3 Stars</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <div className="text-4xl mb-2">⭐⭐</div>
            <p className="text-3xl font-bold text-red-600">{twoStars}</p>
            <p className="text-sm text-gray-600 mt-1">2 Stars</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <div className="text-4xl mb-2">⭐</div>
            <p className="text-3xl font-bold text-red-600">{oneStar}</p>
            <p className="text-sm text-gray-600 mt-1">1 Star</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-4">
          <input
            type="search"
            placeholder="Search reviews by comment or tradesperson..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
            <option value="">All Time</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <div className="flex text-yellow-500 text-xl">
                    {'★'.repeat(review.rating)}
                    {'☆'.repeat(5 - review.rating)}
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      review.rating >= 4
                        ? 'bg-green-100 text-green-800'
                        : review.rating === 3
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {review.rating} / 5
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-gray-900 font-medium">For: {review.tradesperson.businessName || review.tradesperson.user.name}</p>
                  <p className="text-sm text-gray-500">Job: {review.job.title}</p>
                </div>

                {review.comment && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 italic">"{review.comment}"</p>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
                  <div>
                    <span className="font-medium">Reviewer:</span> {review.reviewer.name}
                  </div>
                  <div>
                    <span className="font-medium">Date:</span>{' '}
                    {new Date(review.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 ml-4">
                <Link
                  href={`/admin/reviews/${review.id}`}
                  className="px-4 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 text-sm font-medium text-center"
                >
                  View Details
                </Link>
                {review.rating <= 2 && (
                  <button className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium">
                    Flag for Review
                  </button>
                )}
                <button className="px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 text-sm font-medium">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RatingBar({ stars, count, total }: { stars: number; count: number; total: number }) {
  const percentage = total > 0 ? (count / total) * 100 : 0

  return (
    <div className="flex items-center gap-3">
      <span className="text-white text-sm w-16">{stars} stars</span>
      <div className="flex-1 bg-purple-400 rounded-full h-3 overflow-hidden">
        <div
          className="bg-white h-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-white text-sm w-12 text-right">{count}</span>
    </div>
  )
}
