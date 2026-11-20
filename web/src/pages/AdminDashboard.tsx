import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/api'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

export default function AdminDashboard() {
  const { data, isLoading, error } = useQuery<{ data: MetricsData }>({
    queryKey: ['admin-metrics'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: MetricsData }>('/admin/metrics')
      return res.data
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-ink">Admin Dashboard</h2>
        <p className="text-neutral-600">Loading metrics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-ink">Admin Dashboard</h2>
        <p className="text-red-600">Failed to load metrics.</p>
      </div>
    )
  }

  const m = data?.data
  if (!m) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-ink">Admin Dashboard</h2>
        <p className="text-neutral-600">No metrics available.</p>
      </div>
    )
  }

  const countyEntries = Object.entries(m.reach.by_county)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink">Admin Dashboard</h2>
          <p className="text-neutral-600">Platform metrics and safety overview.</p>
        </div>
        <button className="px-4 py-2 bg-primary-700 text-white rounded-md hover:bg-primary-800 text-sm">
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">
            Total Mentees
          </h3>
          <p className="text-3xl font-bold text-ink">{m.reach.total_mentees}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">
            Total Mentors
          </h3>
          <p className="text-3xl font-bold text-ink">{m.reach.total_mentors}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">
            Match Rate
          </h3>
          <p className="text-3xl font-bold text-ink">
            {(m.matching.match_rate * 100).toFixed(0)}%
          </p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">
            Active Mentorships
          </h3>
          <p className="text-3xl font-bold text-ink">{m.engagement.active_mentorships}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">
            Open Reports
          </h3>
          <p className="text-3xl font-bold text-ink">{m.safety.open_reports}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">
            Goals Completed
          </h3>
          <p className="text-3xl font-bold text-ink">{m.outcomes.goals_completed}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4 col-span-1 lg:col-span-1">
          <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-4">
            Mentees by County
          </h3>
          <div className="h-64">
              <PieChart width={300} height={300}>
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

        <Card className="p-4 col-span-1 lg:col-span-1">
          <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-4">
            Matching Overview
          </h3>
          <div className="h-64">
            <BarChart width={400} height={300} data={[{ name: 'Requests', value: m.matching.requests_received }, { name: 'Queue', value: m.matching.unmatched_queue_size }]}>
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#7C3AED" radius={[4, 4, 0, 0]} />
            </BarChart>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">
            Median Days to Match
          </h3>
          <p className="text-2xl font-bold text-ink">{m.matching.median_days_to_match}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">
            Sessions per Pair
          </h3>
          <p className="text-2xl font-bold text-ink">{m.engagement.sessions_held_per_pair}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">
            Mentors Awaiting Verification
          </h3>
          <p className="text-2xl font-bold text-ink">{m.safety.mentors_awaiting_verification}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">
            Avg Session Rating
          </h3>
          <p className="text-2xl font-bold text-ink">{m.outcomes.average_session_rating.toFixed(1)}</p>
          <Badge variant="secondary">Outcomes</Badge>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">
            Median Time to Resolve (hrs)
          </h3>
          <p className="text-2xl font-bold text-ink">{m.safety.median_time_to_resolve_hours}</p>
          <Badge variant="secondary">Safety</Badge>
        </Card>
      </div>
    </div>
  )
}
