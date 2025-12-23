import BackgroundSlideshow from './components/BackgroundSlideshow'
import Logo from './components/Logo'

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <BackgroundSlideshow />

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div className="mb-8 flex justify-center">
          <div className="bg-white/95 backdrop-blur-sm px-8 py-6 rounded-2xl shadow-2xl">
            <Logo size="large" />
          </div>
        </div>
        <p className="text-2xl md:text-3xl text-white mb-12 drop-shadow-lg font-medium">
          Find Trusted Tradespeople for Any Job
        </p>
        <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
          <a
            href="/client/signup"
            className="w-full md:w-auto px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-2xl hover:shadow-blue-500/50 hover:scale-105"
          >
            Sign Up as Client
          </a>
          <a
            href="/tradesperson/signup"
            className="w-full md:w-auto px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-all shadow-2xl hover:shadow-green-500/50 hover:scale-105"
          >
            Sign Up as Tradesperson
          </a>
        </div>

        {/* Additional info */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-lg shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Verified Professionals</h3>
            <p className="text-gray-700">All tradespeople are licensed and background checked</p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-lg shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Secure Payments</h3>
            <p className="text-gray-700">Escrow protection until job completion</p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-lg shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">5-Star Ratings</h3>
            <p className="text-gray-700">Read reviews from real customers</p>
          </div>
        </div>
      </div>
    </div>
  )
}
