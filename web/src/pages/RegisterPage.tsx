import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    date_of_birth: '',
    role: 'mentee',
    county: '',
    language: 'en',
    code_of_conduct_accepted: false,
  })
  const [error, setError] = useState('')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  if (searchParams.get('role') === 'mentor') formData.role = 'mentor'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'}/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error?.message || 'Registration failed')
        return
      }
      navigate('/home')
    } catch {
      setError('Something went wrong')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-ink mb-2">Create account</h1>
        <p className="text-primary-600 text-sm font-medium mb-6">Crowning African tech.</p>
        {error && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger/20 text-danger text-sm rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Email</label>
            <input type="email" required className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-600" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Password (min 10 chars)</label>
            <input type="password" required className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-600" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Full name</label>
            <input type="text" required className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-600" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Date of birth</label>
            <input type="date" required className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-600" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Role</label>
            <select className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-600" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
              <option value="mentee">Mentee</option>
              <option value="mentor">Mentor</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">County</label>
            <input type="text" required className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-600" value={formData.county} onChange={(e) => setFormData({ ...formData, county: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Language</label>
            <select className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-600" value={formData.language} onChange={(e) => setFormData({ ...formData, language: e.target.value })}>
              <option value="en">English</option>
              <option value="sw">Kiswahili</option>
            </select>
          </div>
          <div className="flex items-start gap-2">
            <input type="checkbox" required checked={formData.code_of_conduct_accepted} onChange={(e) => setFormData({ ...formData, code_of_conduct_accepted: e.target.checked })} />
            <label className="text-sm text-ink">I accept the code of conduct</label>
          </div>
          <button type="submit" className="w-full py-3 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 transition-colors">
            Create account
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-neutral-600">
          Already have an account?{' '}
          <a href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}
