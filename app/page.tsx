import Link from 'next/link'
import Image from 'next/image'
import Logo from './components/Logo'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Logo size="small" showTagline={false} />
            <div className="flex gap-4">
              <Link
                href="/client/signin"
                className="px-4 py-2 text-gray-700 hover:text-orange-600 font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/client/signup"
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-50 to-blue-50 py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                Find Quality Aussie <span className="text-orange-500">Tradespeople</span>
              </h1>
              <p className="text-xl text-gray-600">
                Connect with licensed, verified tradies for any job. From plumbing to electrical, carpentry to roofing - we've got you covered.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/client/signup"
                  className="px-8 py-4 bg-orange-500 text-white text-lg font-semibold rounded-lg hover:bg-orange-600 transition-all shadow-lg text-center"
                >
                  Post a Job (It's Free!)
                </Link>
                <Link
                  href="/tradesperson/signup"
                  className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-lg text-center"
                >
                  Join as a Tradie
                </Link>
              </div>
              <div className="flex items-center gap-8 pt-4">
                <div>
                  <p className="text-3xl font-bold text-gray-900">50,000+</p>
                  <p className="text-gray-600">Jobs Completed</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">10,000+</p>
                  <p className="text-gray-600">Licensed Tradies</p>
                </div>
              </div>
            </div>
            <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/images/hero-retro-tradesman.png"
                alt="Classic Australian Tradesman with Vintage Ute"
                fill
                className="object-cover"
                priority
              />
              {/* Subtle vintage overlay for extra authenticity */}
              <div className="absolute inset-0 bg-orange-900/10 mix-blend-multiply" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How AnyTrade Works</h2>
            <p className="text-xl text-gray-600">Getting the job done is as easy as 1-2-3</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-orange-500">1</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Post Your Job</h3>
              <p className="text-gray-600">
                Tell us what you need done. It's free to post and takes less than 2 minutes.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-orange-500">2</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Get Quotes</h3>
              <p className="text-gray-600">
                Receive competitive quotes from verified tradies. Compare profiles, reviews, and prices.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-orange-500">3</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Job Done!</h3>
              <p className="text-gray-600">
                Hire your chosen tradie. Pay securely through our escrow system once you're happy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Services */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Popular Services</h2>
            <p className="text-xl text-gray-600">Whatever you need, we've got the right tradie</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[
              { name: 'Plumbing', icon: '🔧' },
              { name: 'Electrical', icon: '⚡' },
              { name: 'Carpentry', icon: '🪚' },
              { name: 'Painting', icon: '🎨' },
              { name: 'Roofing', icon: '🏠' },
              { name: 'Landscaping', icon: '🌳' },
              { name: 'Tiling', icon: '◻️' },
              { name: 'Plastering', icon: '🧱' },
              { name: 'Demolition', icon: '🔨' },
              { name: 'Concreting', icon: '🏗️' },
              { name: 'Fencing', icon: '🚧' },
              { name: 'Locksmith', icon: '🔐' },
            ].map((service) => (
              <Link
                key={service.name}
                href="/client/signup"
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all text-center group hover:scale-105"
              >
                <div className="text-4xl mb-3">{service.icon}</div>
                <p className="font-semibold text-gray-900 group-hover:text-orange-500">
                  {service.name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose AnyTrade?</h2>
            <p className="text-xl text-gray-600">Built by Aussies, for Aussies</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-orange-50 p-8 rounded-xl">
              <div className="w-16 h-16 bg-orange-500 rounded-lg flex items-center justify-center mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Verified Tradies</h3>
              <p className="text-gray-600">
                All tradespeople are licensed, insured, and background checked. No cowboys here.
              </p>
            </div>
            <div className="bg-blue-50 p-8 rounded-xl">
              <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
                <span className="text-3xl">💰</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Secure Payments</h3>
              <p className="text-gray-600">
                Funds held in escrow until you're 100% satisfied with the work. Total peace of mind.
              </p>
            </div>
            <div className="bg-green-50 p-8 rounded-xl">
              <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center mb-4">
                <span className="text-3xl">⭐</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Real Reviews</h3>
              <p className="text-gray-600">
                Read honest reviews from real customers. Make informed decisions based on actual experiences.
              </p>
            </div>
            <div className="bg-purple-50 p-8 rounded-xl">
              <div className="w-16 h-16 bg-purple-500 rounded-lg flex items-center justify-center mb-4">
                <span className="text-3xl">🛡️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Support 24/7</h3>
              <p className="text-gray-600">
                Our Aussie-based support team is here to help whenever you need us.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600">No hidden fees. No surprises.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* For Clients */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-200">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">For Clients</h3>
                <p className="text-gray-600">Post jobs and hire tradies</p>
              </div>
              <div className="mb-8">
                <div className="text-5xl font-bold text-gray-900 mb-2">FREE</div>
                <p className="text-gray-600">to post jobs</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span className="text-gray-700">Post unlimited jobs</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span className="text-gray-700">Get competitive quotes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span className="text-gray-700">Review tradie profiles & ratings</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span className="text-gray-700">Escrow payment protection</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span className="text-gray-700">24/7 customer support</span>
                </li>
              </ul>
              <Link
                href="/client/signup"
                className="block w-full py-4 bg-orange-500 text-white text-center font-semibold rounded-lg hover:bg-orange-600 transition-all"
              >
                Post a Job Now
              </Link>
            </div>

            {/* For Tradies */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-8 border-2 border-orange-400 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-yellow-400 text-gray-900 px-4 py-1 text-sm font-bold rounded-bl-lg">
                POPULAR
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">For Tradies</h3>
                <p className="text-orange-100">Grow your business</p>
              </div>
              <div className="mb-8">
                <div className="text-5xl font-bold text-white mb-2">12.5%</div>
                <p className="text-orange-100">per completed job</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <span className="text-yellow-300 mr-3 text-xl">✓</span>
                  <span className="text-white">Unlimited job quotes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-300 mr-3 text-xl">✓</span>
                  <span className="text-white">Build your profile & reputation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-300 mr-3 text-xl">✓</span>
                  <span className="text-white">Guaranteed payment via escrow</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-300 mr-3 text-xl">✓</span>
                  <span className="text-white">Premium placement upgrade available</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-300 mr-3 text-xl">✓</span>
                  <span className="text-white">Direct client communication</span>
                </li>
              </ul>
              <Link
                href="/tradesperson/signup"
                className="block w-full py-4 bg-white text-orange-600 text-center font-semibold rounded-lg hover:bg-gray-100 transition-all"
              >
                Join as a Tradie
              </Link>
              <p className="text-center text-orange-100 text-sm mt-4">
                Only pay when you complete a job
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <p className="text-xl text-gray-600">Don't just take our word for it</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah M.',
                location: 'Sydney, NSW',
                text: 'Found an excellent electrician within hours. The whole process was seamless and the escrow payment system gave me total peace of mind.',
                rating: 5,
              },
              {
                name: 'Dave T.',
                location: 'Melbourne, VIC',
                text: 'As a plumber, AnyTrade has helped me grow my business significantly. I get quality leads and the payment system is bulletproof.',
                rating: 5,
              },
              {
                name: 'Emma K.',
                location: 'Brisbane, QLD',
                text: 'Needed urgent roof repairs and had three quotes within a day. Hired a great tradie who did fantastic work. Highly recommend!',
                rating: 5,
              },
            ].map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-8 rounded-xl">
                <div className="flex text-orange-500 mb-4">
                  {'★'.repeat(testimonial.rating)}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.text}"</p>
                <div>
                  <p className="font-bold text-gray-900">{testimonial.name}</p>
                  <p className="text-gray-600 text-sm">{testimonial.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Join thousands of Aussies finding quality tradies or growing their business
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/client/signup"
              className="px-8 py-4 bg-white text-orange-600 text-lg font-semibold rounded-lg hover:bg-gray-100 transition-all shadow-lg"
            >
              Post a Job - It's Free!
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 bg-orange-700 text-white text-lg font-semibold rounded-lg hover:bg-orange-800 transition-all shadow-lg"
            >
              Contact Us
            </Link>
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
                <li><Link href="#" className="hover:text-orange-500">How It Works</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Tradies</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/tradesperson/signup" className="hover:text-orange-500">Join AnyTrade</Link></li>
                <li><Link href="/tradesperson/signin" className="hover:text-orange-500">Sign In</Link></li>
                <li><Link href="#" className="hover:text-orange-500">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/contact" className="hover:text-orange-500">Contact Us</Link></li>
                <li><Link href="#" className="hover:text-orange-500">About</Link></li>
                <li><Link href="#" className="hover:text-orange-500">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-orange-500">Privacy Policy</Link></li>
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
