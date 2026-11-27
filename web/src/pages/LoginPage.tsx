import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api/v1'}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        setError('Invalid email or password')
        return
      }
      navigate('/home')
    } catch {
      setError('Something went wrong')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="max-w-md w-full bg-surface-container-low rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-ink mb-2">Welcome back</h1>
        <p className="text-primary-500 text-sm font-medium mb-6">Crowning African tech.</p>
        {error && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger/20 text-danger text-sm rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 border border-outline-variant bg-surface-input text-ink rounded-md focus:ring-2 focus:ring-primary-600"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full px-3 py-2 border border-outline-variant bg-surface-input text-ink rounded-md focus:ring-2 focus:ring-primary-600"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full py-3 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 transition-colors">
            Sign in
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-on-surface-variant">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
