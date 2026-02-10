import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import Logo from '../components/Logo'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Check if user is admin
  if (!session || session.user?.role !== 'ADMIN') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Logo size="small" showTagline={false} />
              <span className="ml-4 px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">
                ADMIN
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900 text-sm">
                View Site
              </Link>
              <div className="text-sm text-gray-700">
                {session.user?.name}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white border-r border-gray-200 fixed left-0 top-16 bottom-0 overflow-y-auto">
          <nav className="p-4 space-y-2">
            <NavLink href="/admin" icon="📊">
              Dashboard
            </NavLink>
            <NavLink href="/admin/users" icon="👥">
              Users
            </NavLink>
            <NavLink href="/admin/jobs" icon="💼">
              Jobs
            </NavLink>
            <NavLink href="/admin/payments" icon="💰">
              Payments
            </NavLink>
            <NavLink href="/admin/reviews" icon="⭐">
              Reviews
            </NavLink>
            <NavLink href="/admin/analytics" icon="📈">
              Analytics
            </NavLink>
            <NavLink href="/admin/settings" icon="⚙️">
              Settings
            </NavLink>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

function NavLink({ href, icon, children }: { href: string; icon: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors"
    >
      <span className="text-xl">{icon}</span>
      <span className="font-medium">{children}</span>
    </Link>
  )
}
