import { Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { apiClient } from '@/services/api'

const MoonIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79" />
  </svg>
)

const SunIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
)

export default function Layout() {
  const navigate = useNavigate()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

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

  useEffect(() => {
    const saved = localStorage.getItem('malkia-dark-mode')
    const initial = saved ? saved === 'true' : window.matchMedia('(prefers-color-scheme: dark)').matches
    setDarkMode(initial)
    if (initial) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('malkia-dark-mode', 'true')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('malkia-dark-mode', 'false')
    }
  }, [darkMode])

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
            <a href="/dashboard" className="hover:text-primary-300 transition-colors">
              Dashboard
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
              onClick={() => setDarkMode((prev) => !prev)}
              className="hover:text-primary-300 transition-colors p-1 rounded hover:bg-surface-container-low/30"
              title="Toggle dark mode"
            >
              {darkMode ? <SunIcon /> : <MoonIcon />}
            </button>
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

      <footer className="border-t border-outline-variant bg-surface-container-low py-6 text-center text-xs text-on-surface-variant">
        Malkia Mentor &copy; {new Date().getFullYear()} - Crowning African tech.
      </footer>
    </div>
  )
}
