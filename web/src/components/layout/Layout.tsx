import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { apiClient } from '@/services/api'
import { InitialsAvatar } from '@/components/ui/initials-avatar'

type Me = {
  full_name?: string
  role?: string
  county?: string
  email?: string
}

const WORKSPACE_LINKS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Find Mentors', path: '/mentors' },
  { label: 'My Mentorship', path: '/mentorships' },
  { label: 'Scheduled Sessions', path: '/sessions' },
  { label: 'Messages', path: '/messages' },
  { label: 'Profile', path: '/profile' },
  { label: 'Admin Dashboard', path: '/admin' },
]

const BOTTOM_NAV = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Mentors', path: '/mentors' },
  { label: 'Mentorship', path: '/mentorships' },
  { label: 'Sessions', path: '/sessions' },
  { label: 'Messages', path: '/messages' },
]

function isActive(pathname: string, path: string) {
  if (path === '/dashboard') return pathname === '/dashboard' || pathname === '/home' || pathname === '/'
  return pathname === path || pathname.startsWith(path + '/')
}

function getInitials(name?: string) {
  if (!name) return 'MM'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'MM'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [me, setMe] = useState<Me | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function checkAuth() {
      try {
        const res = await apiClient.get<{ user?: Me } | Me>('/me')
        if (cancelled) return
        const data = (res.data as { user?: Me })?.user || (res.data as Me)
        setMe(data)
        setCheckingAuth(false)
      } catch {
        if (!cancelled) {
          navigate('/login')
        }
      }
    }

    checkAuth()

    return () => {
      cancelled = true
    }
  }, [navigate])

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const displayName = me?.full_name || 'Mentee User'
  const roleLine = [me?.role || 'Mentee', me?.county].filter(Boolean).join(' • ')
  const userInitials = getInitials(me?.full_name)

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout', {})
    } catch {
      // ignore logout errors
    }
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased">
      {/* PERSISTENT TOP NAVBAR */}
      <header className="fixed top-0 left-0 w-full z-50 bg-surface-container-lowest/95 backdrop-blur-xl shadow-sm border-b border-outline/40">
        <div className="h-20 w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline-sm font-extrabold shadow-sm"
              >
                M
              </span>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-primary leading-tight font-extrabold">
                  Malkia Mentor
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold tracking-wider uppercase text-[10px]">
                  Community Portal
                </span>
              </div>
            </Link>

          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/profile"
              className="flex items-center gap-3 pl-2 p-1 rounded-full hover:bg-surface-container transition-colors"
            >
              <InitialsAvatar
                initials={userInitials}
                accent="bg-primary-container/20 text-primary ring-2 ring-primary-container/30"
                className="w-10 h-10 rounded-full font-bold text-sm"
              />
              <div className="hidden xl:flex flex-col text-left">
                <span className="font-label-md text-label-md text-on-surface font-bold leading-tight">
                  {displayName}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant capitalize">
                  {roleLine}
                </span>
              </div>
            </Link>

            <button
              onClick={logout}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-on-surface-variant hover:text-danger hover:bg-danger/10 transition-colors"
              title="Sign out"
            >
              <span>Logout</span>
            </button>

            <button
              className="lg:hidden px-3 py-2 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {menuOpen ? 'Close' : 'Menu'}
            </button>
          </div>
        </div>
      </header>

      {/* PERSISTENT WORKSPACE SIDEBAR */}
      <aside className="hidden lg:flex fixed top-20 left-0 w-64 h-[calc(100vh-5rem)] flex-col justify-between bg-surface-container-lowest z-40 px-4 py-6 overflow-y-auto border-r border-outline/40">
        <div className="flex flex-col gap-6">
          <div className="px-3 flex items-center gap-2">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
              Mentee Workspace
            </span>
          </div>
          <nav className="flex flex-col gap-1">
            {WORKSPACE_LINKS.map((item) => {
              const active = isActive(location.pathname, item.path)
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl font-label-md text-label-md transition-all ${
                    active
                      ? 'bg-primary/10 text-primary font-bold shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline/30 flex flex-col gap-2">
          <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider">
            Need Guidance?
          </span>
          <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">
            Reach out to verified senior leaders in your field.
          </p>
          <Link
            to="/mentors"
            className="text-xs font-bold text-primary hover:underline mt-1 inline-flex items-center gap-1"
          >
            Find a Mentor
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="pt-20 lg:ml-64 pb-24 lg:pb-12 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <Outlet />
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-outline/40">
        <div className="grid grid-cols-5 py-1">
          {BOTTOM_NAV.map((item) => {
            const active = isActive(location.pathname, item.path)
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 font-label-sm text-[11px] transition-colors ${
                  active ? 'text-primary font-bold' : 'text-on-surface-variant'
                }`}
              >
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* MOBILE FLYOUT MENU */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute top-0 right-0 h-full w-72 bg-surface-container-lowest shadow-xl p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-outline/30">
                <span className="font-headline-sm text-headline-sm text-primary font-bold">Navigation</span>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="px-2 py-1 rounded-full text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
                  aria-label="Close menu"
                >
                  Close
                </button>
              </div>
              <nav className="flex flex-col gap-1">
                {WORKSPACE_LINKS.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-label-md text-label-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  >
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
            <button
              onClick={() => {
                setMenuOpen(false)
                logout()
              }}
              className="flex items-center gap-2 p-3 rounded-xl font-label-md text-danger hover:bg-danger/10 text-left w-full"
            >
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}