'use client'

import { useState } from 'react'
import Link from 'next/link'
import Logo from '../components/Logo'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    userType: 'client',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    setIsSubmitting(false)
    setSubmitStatus('success')

    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        userType: 'client',
      })
      setSubmitStatus('idle')
    }, 3000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/">
              <Logo size="small" showTagline={false} />
            </Link>
            <div className="flex gap-4">
              <Link
                href="/"
                className="px-4 py-2 text-gray-700 hover:text-orange-600 font-medium"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-50 to-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Get in Touch</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Have a question or need help? We're here for you. Our Aussie-based team is ready to assist.
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                      <span className="text-2xl">📧</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                      <a href="mailto:support@anytrade.com.au" className="text-orange-600 hover:text-orange-700">
                        support@anytrade.com.au
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                      <span className="text-2xl">📞</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                      <a href="tel:1300-ANY-TRADE" className="text-blue-600 hover:text-blue-700">
                        1300 ANY TRADE
                      </a>
                      <p className="text-sm text-gray-600">Mon-Fri 9am-6pm AEST</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                      <span className="text-2xl">💬</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Live Chat</h3>
                      <p className="text-gray-600">Available 24/7 on our website</p>
                      <button className="text-green-600 hover:text-green-700 text-sm font-medium mt-1">
                        Start Chat →
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                      <span className="text-2xl">📍</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Office</h3>
                      <p className="text-gray-600">
                        123 Trade Street<br />
                        Sydney NSW 2000<br />
                        Australia
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 p-6 rounded-xl">
                <h3 className="font-bold text-gray-900 mb-3">Quick Links</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/client/signup" className="text-orange-600 hover:text-orange-700">
                      Post a Job
                    </Link>
                  </li>
                  <li>
                    <Link href="/tradesperson/signup" className="text-orange-600 hover:text-orange-700">
                      Join as a Tradie
                    </Link>
                  </li>
                  <li>
                    <Link href="/#pricing" className="text-orange-600 hover:text-orange-700">
                      View Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="/#how-it-works" className="text-orange-600 hover:text-orange-700">
                      How It Works
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Send Us a Message</h2>

                {submitStatus === 'success' && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">✓</span>
                      <div>
                        <p className="font-semibold text-green-900">Message Sent Successfully!</p>
                        <p className="text-sm text-green-700">We'll get back to you within 24 hours.</p>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="John Smith"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="04XX XXX XXX"
                      />
                    </div>

                    <div>
                      <label htmlFor="userType" className="block text-sm font-medium text-gray-700 mb-2">
                        I am a... *
                      </label>
                      <select
                        id="userType"
                        name="userType"
                        required
                        value={formData.userType}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="client">Client (looking for tradies)</option>
                        <option value="tradesperson">Tradesperson</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="How can we help you?"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Tell us more about your inquiry..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-2">How long does it take to get a response?</h3>
              <p className="text-gray-600">
                Our team typically responds within 24 hours during business days. For urgent matters, please call us directly.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-2">Is there a fee to contact support?</h3>
              <p className="text-gray-600">
                No, all support is completely free for both clients and tradespeople.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-2">Can I schedule a call with someone?</h3>
              <p className="text-gray-600">
                Yes! Mention your preferred time in the message above, and we'll arrange a call at your convenience.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-2">Do you offer support in languages other than English?</h3>
              <p className="text-gray-600">
                We currently offer support in English, but we're working on expanding to other languages soon.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="mb-4">
                <Logo size="small" showTagline={false} />
              </div>
              <p className="text-sm text-gray-400">
                Australia's trusted marketplace for quality tradespeople
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Clients</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/client/signup" className="hover:text-orange-500">Post a Job</Link></li>
                <li><Link href="/client/signin" className="hover:text-orange-500">Sign In</Link></li>
                <li><Link href="/" className="hover:text-orange-500">How It Works</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Tradies</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/tradesperson/signup" className="hover:text-orange-500">Join AnyTrade</Link></li>
                <li><Link href="/tradesperson/signin" className="hover:text-orange-500">Sign In</Link></li>
                <li><Link href="/" className="hover:text-orange-500">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/contact" className="hover:text-orange-500">Contact Us</Link></li>
                <li><Link href="/" className="hover:text-orange-500">About</Link></li>
                <li><Link href="/" className="hover:text-orange-500">Terms of Service</Link></li>
                <li><Link href="/" className="hover:text-orange-500">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 AnyTrade. Building Trust, One Job at a Time.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
