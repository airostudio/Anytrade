'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BackgroundSlideshow from '@/app/components/BackgroundSlideshow'

const TRADE_OPTIONS = [
  'Electrician',
  'Plumber',
  'Carpenter',
  'Bricklayer',
  'Painter',
  'Roofer',
  'Landscaper',
  'HVAC Technician',
  'Locksmith',
  'Tiler',
]

export default function TradespersonSignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    businessName: '',
    abn: '',
    trades: [] as string[],
    serviceAreas: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const toggleTrade = (trade: string) => {
    if (formData.trades.includes(trade)) {
      setFormData({
        ...formData,
        trades: formData.trades.filter((t) => t !== trade),
      })
    } else {
      setFormData({
        ...formData,
        trades: [...formData.trades, trade],
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.trades.length === 0) {
      setError('Please select at least one trade')
      return
    }

    setLoading(true)

    try {
      const serviceAreas = formData.serviceAreas
        .split(',')
        .map((area) => area.trim())
        .filter((area) => area.length > 0)

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          role: 'TRADESPERSON',
          businessName: formData.businessName,
          abn: formData.abn,
          trades: formData.trades,
          serviceAreas,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Signup failed')
      }

      router.push('/tradesperson/signin?registered=true')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center py-12">
      <BackgroundSlideshow />

      <div className="relative z-10 w-full max-w-2xl px-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Tradesperson Sign Up
          </h1>
          <p className="text-gray-600 mb-6 text-center">
            Join AnyTrade and connect with clients
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name
                </label>
                <input
                  id="businessName"
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="abn" className="block text-sm font-medium text-gray-700 mb-1">
                  ABN
                </label>
                <input
                  id="abn"
                  type="text"
                  value={formData.abn}
                  onChange={(e) => setFormData({ ...formData, abn: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Your Trades *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {TRADE_OPTIONS.map((trade) => (
                  <button
                    key={trade}
                    type="button"
                    onClick={() => toggleTrade(trade)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.trades.includes(trade)
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {trade}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="serviceAreas" className="block text-sm font-medium text-gray-700 mb-1">
                Service Areas (comma-separated suburbs)
              </label>
              <input
                id="serviceAreas"
                type="text"
                placeholder="e.g., Sydney CBD, Parramatta, Bondi"
                value={formData.serviceAreas}
                onChange={(e) => setFormData({ ...formData, serviceAreas: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            Already have an account?{' '}
            <Link href="/tradesperson/signin" className="text-green-600 hover:text-green-700 font-semibold">
              Sign In
            </Link>
          </p>

          <p className="mt-4 text-center text-gray-600">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              ← Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
