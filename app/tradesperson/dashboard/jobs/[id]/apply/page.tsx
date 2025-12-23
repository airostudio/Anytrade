'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function ApplyJobPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  const [job, setJob] = useState<any>(null)
  const [formData, setFormData] = useState({
    proposal: '',
    quotedPrice: '',
    estimatedDays: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchingJob, setFetchingJob] = useState(true)

  useEffect(() => {
    fetchJob()
  }, [jobId])

  const fetchJob = async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`)
      const data = await res.json()
      setJob(data.job)
    } catch (error) {
      setError('Failed to load job details')
    } finally {
      setFetchingJob(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/jobs/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          ...formData,
          quotedPrice: parseFloat(formData.quotedPrice),
          estimatedDays: formData.estimatedDays ? parseInt(formData.estimatedDays) : null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application')
      }

      router.push('/tradesperson/dashboard/applications')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (fetchingJob) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Job not found</p>
          <Link href="/tradesperson/dashboard/jobs" className="text-green-600 hover:text-green-700">
            Back to Jobs
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/tradesperson/dashboard/jobs" className="text-gray-600 hover:text-gray-900">
            ← Back to Jobs
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Job Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{job.title}</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Budget</p>
              <p className="text-xl font-semibold text-green-600">${job.budget.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Location</p>
              <p className="text-lg font-medium text-gray-900">
                {job.city}, {job.state} {job.postcode}
              </p>
            </div>
          </div>
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-1">Description</p>
            <p className="text-gray-800">{job.description}</p>
          </div>
          <div className="flex gap-2 text-sm">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium capitalize">
              {job.category}
            </span>
            {job.urgency && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full font-medium capitalize">
                {job.urgency.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>

        {/* Application Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Submit Your Application</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="quotedPrice" className="block text-sm font-medium text-gray-700 mb-1">
                Your Quote ($) *
              </label>
              <input
                id="quotedPrice"
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="Enter your price quote"
                value={formData.quotedPrice}
                onChange={(e) => setFormData({ ...formData, quotedPrice: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Client's budget: ${job.budget.toLocaleString()}
              </p>
            </div>

            <div>
              <label htmlFor="estimatedDays" className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Days to Complete
              </label>
              <input
                id="estimatedDays"
                type="number"
                min="1"
                placeholder="e.g., 5"
                value={formData.estimatedDays}
                onChange={(e) => setFormData({ ...formData, estimatedDays: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="proposal" className="block text-sm font-medium text-gray-700 mb-1">
                Proposal *
              </label>
              <textarea
                id="proposal"
                required
                rows={6}
                placeholder="Explain your approach, experience, and why you're the best fit for this job..."
                value={formData.proposal}
                onChange={(e) => setFormData({ ...formData, proposal: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
              <Link
                href="/tradesperson/dashboard/jobs"
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
