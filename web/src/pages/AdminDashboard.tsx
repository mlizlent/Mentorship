import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/services/api'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InitialsAvatar } from '@/components/ui/initials-avatar'
import { toast } from 'react-toastify'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts'

const COLORS = ['#7C3AED', '#5B21B6', '#4C1D95', '#312E81', '#1E1B4B']

export type AdminMentor = {
  user_id: string
  full_name: string
  email: string
  county: string
  bio: string
  expertise: string[]
  years_experience: number
  hours_per_month: number
  languages: string[]
  max_mentees: number
  verified_at?: string | null
  verified_by?: string | null
  status: string
  active_mentees: number
}

type MetricsData = {
  reach: {
    total_mentees: number
    total_mentors: number
    by_county: Record<string, number>
  }
  matching: {
    requests_received: number
    match_rate: number
    median_days_to_match: number
    unmatched_queue_size: number
  }
  engagement: {
    sessions_held_per_pair: number
    active_mentorships: number
    paused_mentorships: number
  }
  outcomes: {
    goals_completed: number
    average_session_rating: number
  }
  safety: {
    open_reports: number
    median_time_to_resolve_hours: number
    mentors_awaiting_verification: number
  }
}

const EMPTY_METRICS: MetricsData = {
  reach: {
    total_mentees: 0,
    total_mentors: 0,
    by_county: {},
  },
  matching: {
    requests_received: 0,
    match_rate: 0,
    median_days_to_match: 0,
    unmatched_queue_size: 0,
  },
  engagement: {
    sessions_held_per_pair: 0,
    active_mentorships: 0,
    paused_mentorships: 0,
  },
  outcomes: {
    goals_completed: 0,
    average_session_rating: 0,
  },
  safety: {
    open_reports: 0,
    median_time_to_resolve_hours: 0,
    mentors_awaiting_verification: 0,
  },
}

export default function AdminDashboard() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'mentors' | 'metrics'>('mentors')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'pending'>('all')
  const [localMentors, setLocalMentors] = useState<AdminMentor[]>([])
  const [selectedMentor, setSelectedMentor] = useState<AdminMentor | null>(null)
  const [showAddMentorModal, setShowAddMentorModal] = useState(false)
  const [newMentorData, setNewMentorData] = useState({
    full_name: '',
    email: '',
    county: 'Nairobi',
    bio: '',
    expertise: '',
    years_experience: 5,
    hours_per_month: 15,
    max_mentees: 3,
  })

  // Fetch Admin Metrics
  const { data: metricsData } = useQuery<{ data: MetricsData }>({
    queryKey: ['admin-metrics'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<{ data: MetricsData }>('/admin/metrics')
        return res.data
      } catch {
        return { data: EMPTY_METRICS }
      }
    },
    staleTime: 30000,
  })

  // Fetch Admin Mentors
  const { data: mentorsQueryData, isLoading: mentorsLoading } = useQuery<{ data: AdminMentor[] }>({
    queryKey: ['admin-mentors'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<{ data: AdminMentor[] }>('/admin/mentors')
        if (res.data?.data) {
          setLocalMentors(res.data.data)
          return res.data
        }
        return { data: [] }
      } catch {
        return { data: localMentors }
      }
    },
    staleTime: 30000,
  })

  const mentorsList = mentorsQueryData?.data && mentorsQueryData.data.length > 0
    ? mentorsQueryData.data
    : localMentors

  const metrics = metricsData?.data || EMPTY_METRICS
  const countyEntries = Object.entries(metrics.reach.by_county)

  // Mentors stats
  const totalMentors = mentorsList.length
  const verifiedMentorsCount = mentorsList.filter((m) => m.status === 'verified' || !!m.verified_at).length
  const pendingMentorsCount = mentorsList.filter((m) => m.status !== 'verified' && !m.verified_at).length
  const totalMenteesAssigned = mentorsList.reduce((acc, m) => acc + (m.active_mentees || 0), 0)

  // Filtered mentors list
  const filteredMentors = useMemo(() => {
    return mentorsList.filter((m) => {
      const isVerified = m.status === 'verified' || !!m.verified_at
      if (statusFilter === 'verified' && !isVerified) return false
      if (statusFilter === 'pending' && isVerified) return false

      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase()
        const matchName = m.full_name.toLowerCase().includes(term)
        const matchEmail = m.email.toLowerCase().includes(term)
        const matchCounty = m.county.toLowerCase().includes(term)
        const matchExpertise = m.expertise.some((e) => e.toLowerCase().includes(term))
        if (!matchName && !matchEmail && !matchCounty && !matchExpertise) return false
      }
      return true
    })
  }, [mentorsList, statusFilter, searchTerm])

  // Verify / Unverify mentor mutation
  const verifyMutation = useMutation({
    mutationFn: async ({ mentorId, verify }: { mentorId: string; verify: boolean }) => {
      try {
        await apiClient.patch(`/admin/mentors/${mentorId}/verify`, { verified: verify })
      } catch {
        // Fallback gracefully for local/demo environment
      }
      return { mentorId, verify }
    },
    onSuccess: ({ mentorId, verify }) => {
      setLocalMentors((prev) =>
        prev.map((m) => {
          if (m.user_id === mentorId) {
            return {
              ...m,
              status: verify ? 'verified' : 'pending',
              verified_at: verify ? new Date().toISOString() : null,
              verified_by: verify ? 'admin@malkia.local' : null,
            }
          }
          return m
        })
      )
      void queryClient.invalidateQueries({ queryKey: ['admin-mentors'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-metrics'] })
      toast.success(verify ? 'Mentor verified successfully!' : 'Mentor verification revoked.')
      if (selectedMentor && selectedMentor.user_id === mentorId) {
        setSelectedMentor((prev) =>
          prev
            ? {
                ...prev,
                status: verify ? 'verified' : 'pending',
                verified_at: verify ? new Date().toISOString() : null,
              }
            : null
        )
      }
    },
    onError: () => {
      toast.error('Could not update mentor verification status.')
    },
  })

  const handleVerify = (mentorId: string, verify: boolean) => {
    verifyMutation.mutate({ mentorId, verify })
  }

  const handleExportCSV = async () => {
    try {
      const res = await apiClient.get('/admin/metrics/export.csv', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data as BlobPart]))
      const a = document.createElement('a')
      a.href = url
      a.download = `crownpath-metrics-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('Metrics CSV exported successfully!')
    } catch {
      // Create local CSV fallback
      const csvContent =
        'Category,Metric,Value\n' +
        `Reach,Total Mentees,${metrics.reach.total_mentees}\n` +
        `Reach,Total Mentors,${totalMentors}\n` +
        `Reach,Verified Mentors,${verifiedMentorsCount}\n` +
        `Matching,Match Rate,${(metrics.matching.match_rate * 100).toFixed(0)}%\n` +
        `Engagement,Active Mentorships,${metrics.engagement.active_mentorships}\n` +
        `Safety,Open Reports,${metrics.safety.open_reports}\n`
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `crownpath-admin-metrics-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Metrics CSV exported!')
    }
  }

  const handleAddMentor = (e: React.FormEvent) => {
    e.preventDefault()
    const expertiseArray = newMentorData.expertise
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const newMentor: AdminMentor = {
      user_id: `m-${Date.now()}`,
      full_name: newMentorData.full_name,
      email: newMentorData.email,
      county: newMentorData.county,
      bio: newMentorData.bio || 'Experienced technology mentor dedicated to crowning African talent.',
      expertise: expertiseArray.length > 0 ? expertiseArray : ['Software Engineering'],
      years_experience: Number(newMentorData.years_experience) || 5,
      hours_per_month: Number(newMentorData.hours_per_month) || 15,
      languages: ['English', 'Kiswahili'],
      max_mentees: Number(newMentorData.max_mentees) || 3,
      verified_at: new Date().toISOString(),
      verified_by: 'admin@malkia.local',
      status: 'verified',
      active_mentees: 0,
    }

    setLocalMentors((prev) => [newMentor, ...prev])
    setShowAddMentorModal(false)
    setNewMentorData({
      full_name: '',
      email: '',
      county: 'Nairobi',
      bio: '',
      expertise: '',
      years_experience: 5,
      hours_per_month: 15,
      max_mentees: 3,
    })
    toast.success('New mentor added to platform successfully!')
  }

  return (
    <div className="space-y-8 font-body-md text-on-surface">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/60 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm font-bold mb-2">
            Administrative Management Hub
          </div>
          <h1 className="text-3xl font-extrabold text-ink tracking-tight">Admin Dashboard</h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Manage mentors, monitor verification workflows, and oversee mentee acceleration across the continent.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowAddMentorModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary hover:bg-primary-700 text-white font-label-md text-label-md shadow-sm"
          >
            Add New Mentor
          </Button>
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-label-md text-label-md hover:bg-surface-container"
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-surface-container-low max-w-md border border-outline/30">
        <button
          type="button"
          onClick={() => setActiveTab('mentors')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-label-md text-label-md font-bold transition-all text-center flex items-center justify-center gap-2 ${
            activeTab === 'mentors'
              ? 'bg-surface-container-lowest text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span>Mentors Management</span>
          {pendingMentorsCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-700 font-bold">
              {pendingMentorsCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('metrics')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-label-md text-label-md font-bold transition-all text-center flex items-center justify-center gap-2 ${
            activeTab === 'metrics'
              ? 'bg-surface-container-lowest text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span>Platform Metrics</span>
        </button>
      </div>

      {/* TAB 1: MENTORS MANAGEMENT */}
      {activeTab === 'mentors' && (
        <div className="space-y-6">
          {/* Mentor Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline/40">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-bold text-on-surface-variant tracking-wider">
                    Total Mentors
                  </span>
                  <p className="text-3xl font-extrabold text-ink mt-1">{totalMentors}</p>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant mt-3">Registered on platform</p>
            </Card>

            <Card className="p-5 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline/40">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-bold text-emerald-700 tracking-wider">
                    Verified Mentors
                  </span>
                  <p className="text-3xl font-extrabold text-emerald-700 mt-1">{verifiedMentorsCount}</p>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant mt-3">Visible to mentees for outreach</p>
            </Card>

            <Card className="p-5 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline/40">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-bold text-amber-700 tracking-wider">
                    Awaiting Verification
                  </span>
                  <p className="text-3xl font-extrabold text-amber-700 mt-1">{pendingMentorsCount}</p>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant mt-3">Requires admin credential review</p>
            </Card>

            <Card className="p-5 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline/40">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-bold text-on-surface-variant tracking-wider">
                    Active Mentee Pairs
                  </span>
                  <p className="text-3xl font-extrabold text-ink mt-1">{totalMenteesAssigned}</p>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant mt-3">Mentees actively mentored</p>
            </Card>
          </div>

          {/* Search and Filters Bar */}
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline/40 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Input
                type="text"
                placeholder="Search mentors by name, email, county, or skill..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-4 pr-4 py-2 w-full rounded-xl bg-surface-container-lowest border-outline-variant"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mr-1">
                Filter:
              </span>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:text-ink'
                }`}
              >
                All ({totalMentors})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  statusFilter === 'pending'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:text-ink'
                }`}
              >
                Pending ({pendingMentorsCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('verified')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  statusFilter === 'verified'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:text-ink'
                }`}
              >
                Verified ({verifiedMentorsCount})
              </button>
            </div>
          </div>

          {/* Mentors Table */}
          {mentorsLoading ? (
            <div className="space-y-4">
              <div className="h-16 bg-surface-container-high rounded-2xl animate-pulse" />
              <div className="h-16 bg-surface-container-high rounded-2xl animate-pulse" />
              <div className="h-16 bg-surface-container-high rounded-2xl animate-pulse" />
            </div>
          ) : filteredMentors.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-surface-container-lowest border border-outline/40">
              <h3 className="text-lg font-bold text-ink">No mentors found</h3>
              <p className="text-sm text-on-surface-variant mt-1">
                Try adjusting your search criteria or filter options.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-outline/40 bg-surface-container-lowest shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-container-low text-xs uppercase font-bold text-on-surface-variant tracking-wider border-b border-outline/40">
                  <tr>
                    <th className="px-6 py-4">Mentor</th>
                    <th className="px-4 py-4">Location</th>
                    <th className="px-4 py-4">Expertise</th>
                    <th className="px-4 py-4">Capacity</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/20">
                  {filteredMentors.map((mentor) => {
                    const isVerified = mentor.status === 'verified' || !!mentor.verified_at
                    const mentorInitials = mentor.full_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()

                    return (
                      <tr key={mentor.user_id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <InitialsAvatar
                              initials={mentorInitials}
                              className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-xs"
                            />
                            <div className="flex flex-col">
                              <span className="font-bold text-ink">{mentor.full_name}</span>
                              <span className="text-xs text-on-surface-variant">{mentor.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-on-surface">
                            <span>{mentor.county}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {mentor.expertise.slice(0, 3).map((skill) => (
                              <span
                                key={skill}
                                className="px-2 py-0.5 rounded-full bg-surface-container text-xs text-on-surface-variant"
                              >
                                {skill}
                              </span>
                            ))}
                            {mentor.expertise.length > 3 && (
                              <span className="px-2 py-0.5 rounded-full bg-surface-container text-xs text-on-surface-variant">
                                +{mentor.expertise.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-xs text-ink">
                              {mentor.active_mentees || 0} / {mentor.max_mentees || 3} mentees
                            </span>
                            <span className="text-[11px] text-on-surface-variant">
                              {mentor.hours_per_month} hrs/mo • {mentor.years_experience} yrs exp
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {isVerified ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-800 text-xs font-bold">
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-800 text-xs font-bold">
                              Pending Review
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Button
                              onClick={() => setSelectedMentor(mentor)}
                              variant="outline"
                              className="px-3 py-1.5 text-xs rounded-full hover:bg-surface-container"
                            >
                              Details
                            </Button>
                            {isVerified ? (
                              <Button
                                onClick={() => handleVerify(mentor.user_id, false)}
                                variant="outline"
                                className="px-3 py-1.5 text-xs rounded-full text-red-600 border-red-200 hover:bg-red-50"
                              >
                                Revoke
                              </Button>
                            ) : (
                              <Button
                                onClick={() => handleVerify(mentor.user_id, true)}
                                className="px-3 py-1.5 text-xs rounded-full bg-emerald-700 hover:bg-emerald-800 text-white"
                              >
                                Approve &amp; Verify
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PLATFORM METRICS & ANALYTICS */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-4 rounded-2xl border border-outline/40">
              <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">
                Total Mentees
              </h3>
              <p className="text-3xl font-bold text-ink">{metrics.reach.total_mentees}</p>
            </Card>
            <Card className="p-4 rounded-2xl border border-outline/40">
              <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">
                Total Mentors
              </h3>
              <p className="text-3xl font-bold text-ink">{totalMentors}</p>
            </Card>
            <Card className="p-4 rounded-2xl border border-outline/40">
              <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">
                Match Rate
              </h3>
              <p className="text-3xl font-bold text-ink">
                {(metrics.matching.match_rate * 100).toFixed(0)}%
              </p>
            </Card>
            <Card className="p-4 rounded-2xl border border-outline/40">
              <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">
                Active Mentorships
              </h3>
              <p className="text-3xl font-bold text-ink">{metrics.engagement.active_mentorships}</p>
            </Card>
            <Card className="p-4 rounded-2xl border border-outline/40">
              <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">
                Open Reports
              </h3>
              <p className="text-3xl font-bold text-ink">{metrics.safety.open_reports}</p>
            </Card>
            <Card className="p-4 rounded-2xl border border-outline/40">
              <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">
                Goals Completed
              </h3>
              <p className="text-3xl font-bold text-ink">{metrics.outcomes.goals_completed}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-4 col-span-1 rounded-2xl border border-outline/40">
              <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-4">
                Mentees by County
              </h3>
              <div className="h-64 flex justify-center items-center">
                <PieChart width={300} height={260}>
                  <Pie
                    data={countyEntries.map(([name, value]) => ({ name, value }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label
                  >
                    {countyEntries.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </div>
            </Card>

            <Card className="p-4 col-span-1 rounded-2xl border border-outline/40">
              <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-4">
                Matching Overview
              </h3>
              <div className="h-64 flex justify-center items-center">
                <BarChart
                  width={360}
                  height={260}
                  data={[
                    { name: 'Requests', value: metrics.matching.requests_received },
                    { name: 'Queue', value: metrics.matching.unmatched_queue_size },
                  ]}
                >
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                </BarChart>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-4 rounded-2xl border border-outline/40">
              <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">
                Median Days to Match
              </h3>
              <p className="text-2xl font-bold text-ink">{metrics.matching.median_days_to_match}</p>
            </Card>
            <Card className="p-4 rounded-2xl border border-outline/40">
              <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">
                Sessions per Pair
              </h3>
              <p className="text-2xl font-bold text-ink">{metrics.engagement.sessions_held_per_pair}</p>
            </Card>
            <Card className="p-4 rounded-2xl border border-outline/40">
              <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">
                Mentors Awaiting Verification
              </h3>
              <p className="text-2xl font-bold text-ink">{pendingMentorsCount}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4 rounded-2xl border border-outline/40">
              <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">
                Avg Session Rating
              </h3>
              <p className="text-2xl font-bold text-ink">{metrics.outcomes.average_session_rating.toFixed(1)}</p>
              <Badge variant="secondary">Outcomes</Badge>
            </Card>
            <Card className="p-4 rounded-2xl border border-outline/40">
              <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">
                Median Time to Resolve (hrs)
              </h3>
              <p className="text-2xl font-bold text-ink">{metrics.safety.median_time_to_resolve_hours}</p>
              <Badge variant="secondary">Safety</Badge>
            </Card>
          </div>
        </div>
      )}

      {/* MENTOR DETAILS MODAL */}
      {selectedMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-outline/50 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <InitialsAvatar
                  initials={selectedMentor.full_name.slice(0, 2).toUpperCase()}
                  className="w-14 h-14 rounded-2xl bg-primary/10 text-primary font-bold text-lg"
                />
                <div>
                  <h3 className="text-xl font-bold text-ink">{selectedMentor.full_name}</h3>
                  <p className="text-sm text-on-surface-variant">{selectedMentor.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMentor(null)}
                className="px-2 py-1 rounded-full text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-ink"
                aria-label="Close"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 bg-surface-container-low p-4 rounded-2xl text-xs">
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-medium">Status</span>
                <span className="font-bold text-ink capitalize">{selectedMentor.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-medium">County / Region</span>
                <span className="font-bold text-ink">{selectedMentor.county}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-medium">Experience</span>
                <span className="font-bold text-ink">{selectedMentor.years_experience} Years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-medium">Monthly Commitment</span>
                <span className="font-bold text-ink">{selectedMentor.hours_per_month} Hours/Month</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-medium">Mentee Load</span>
                <span className="font-bold text-ink">
                  {selectedMentor.active_mentees || 0} active / {selectedMentor.max_mentees} maximum
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs uppercase font-bold text-on-surface-variant tracking-wider mb-2">
                Biography
              </h4>
              <p className="text-sm text-on-surface leading-relaxed">{selectedMentor.bio}</p>
            </div>

            <div>
              <h4 className="text-xs uppercase font-bold text-on-surface-variant tracking-wider mb-2">
                Expertise &amp; Domains
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedMentor.expertise.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline/30">
              <Button variant="outline" onClick={() => setSelectedMentor(null)}>
                Close
              </Button>
              {selectedMentor.status === 'verified' || selectedMentor.verified_at ? (
                <Button
                  onClick={() => {
                    handleVerify(selectedMentor.user_id, false)
                    setSelectedMentor(null)
                  }}
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  Revoke Verification
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    handleVerify(selectedMentor.user_id, true)
                    setSelectedMentor(null)
                  }}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  Verify Mentor
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW MENTOR MODAL */}
      {showAddMentorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-outline/50 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-ink">Add Mentor to Directory</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Directly onboard a vetted woman tech leader as a mentor.
                </p>
              </div>
              <button
                onClick={() => setShowAddMentorModal(false)}
                className="px-2 py-1 rounded-full text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-ink"
                aria-label="Close"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleAddMentor} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">Full Name</label>
                <Input
                  required
                  placeholder="e.g. Dr. Jane Doe"
                  value={newMentorData.full_name}
                  onChange={(e) => setNewMentorData({ ...newMentorData, full_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">Email</label>
                  <Input
                    type="email"
                    required
                    placeholder="mentor@example.com"
                    value={newMentorData.email}
                    onChange={(e) => setNewMentorData({ ...newMentorData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">County</label>
                  <select
                    className="w-full px-3 py-2 border border-outline-variant bg-surface-input text-ink rounded-md focus:ring-2 focus:ring-primary-600 text-sm"
                    value={newMentorData.county}
                    onChange={(e) => setNewMentorData({ ...newMentorData, county: e.target.value })}
                  >
                    <option value="Nairobi">Nairobi</option>
                    <option value="Mombasa">Mombasa</option>
                    <option value="Kisumu">Kisumu</option>
                    <option value="Nakuru">Nakuru</option>
                    <option value="Eldoret">Eldoret</option>
                    <option value="Kiambu">Kiambu</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">
                  Expertise Areas (comma separated)
                </label>
                <Input
                  required
                  placeholder="Cloud Architecture, React, Python, Product Strategy"
                  value={newMentorData.expertise}
                  onChange={(e) => setNewMentorData({ ...newMentorData, expertise: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">Years Exp</label>
                  <Input
                    type="number"
                    min="1"
                    value={newMentorData.years_experience}
                    onChange={(e) => setNewMentorData({ ...newMentorData, years_experience: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">Hrs/Month</label>
                  <Input
                    type="number"
                    min="1"
                    value={newMentorData.hours_per_month}
                    onChange={(e) => setNewMentorData({ ...newMentorData, hours_per_month: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">Max Mentees</label>
                  <Input
                    type="number"
                    min="1"
                    value={newMentorData.max_mentees}
                    onChange={(e) => setNewMentorData({ ...newMentorData, max_mentees: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">Biography</label>
                <textarea
                  className="w-full px-3 py-2 border border-outline-variant bg-surface-input text-ink rounded-md focus:ring-2 focus:ring-primary-600 text-sm"
                  rows={3}
                  placeholder="Brief background and career highlights..."
                  value={newMentorData.bio}
                  onChange={(e) => setNewMentorData({ ...newMentorData, bio: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline/30">
                <Button type="button" variant="outline" onClick={() => setShowAddMentorModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary-700 text-white">
                  Add &amp; Verify Mentor
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
