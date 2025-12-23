export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          AnyTrade
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Find Trusted Tradespeople for Any Job
        </p>
        <div className="space-y-4">
          <a
            href="/client/signup"
            className="block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Sign Up as Client
          </a>
          <a
            href="/tradesperson/signup"
            className="block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Sign Up as Tradesperson
          </a>
        </div>
      </div>
    </div>
  )
}
