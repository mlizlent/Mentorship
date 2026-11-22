import { Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { apiClient } from '@/services/api'

export default function Layout() {
  const navigate = useNavigate()
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function checkAuth() {
      try {
        await apiClient.get('/me')
      } catch {
        if (!cancelled) {
          navigate('/login')
        }
        return
      }
      if (!cancelled) {
        setCheckingAuth(false)
      }
    }

    checkAuth()

    return () => {
      cancelled = true
    }
  }, [navigate])

  if (checkingAuth) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary-700 text-white px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary-300">M</span>
            <div>
              <h1 className="text-sm font-bold tracking-tight">Malkia Mentor</h1>
              <p className="text-xs text-primary-300">Crowning African tech.</p>
            </div>
          </div>
          <nav className="hidden md:flex gap-6 text-sm">
            <a href="/home" className="hover:text-primary-300 transition-colors">
              Home
            </a>
            <a href="/mentors" className="hover:text-primary-300 transition-colors">
              Find Mentors
            </a>
            <a href="/profile" className="hover:text-primary-300 transition-colors">
              Profile
            </a>
            <a href="/mentorships" className="hover:text-primary-300 transition-colors">
              Mentorships
            </a>
            <a href="/messages" className="hover:text-primary-300 transition-colors">
              Messages
            </a>
            <button
              onClick={async () => {
                try {
                  await apiClient.post('/auth/logout', {})
                } catch {
                  // ignore logout errors
                }
                navigate('/login')
              }}
              className="hover:text-primary-300 transition-colors"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto p-4 w-full">
        <Outlet />
      </main>

      <footer className="border-t border-neutral-200 bg-neutral-50 py-6 text-center text-xs text-neutral-500">
        Malkia Mentor &copy; {new Date().getFullYear()} - Crowning African tech.
      </footer>
    </div>
  )
}
