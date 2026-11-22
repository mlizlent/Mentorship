import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/api'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

type Mentor = {
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
  verified_at: string | null
  verified_by: string | null
  status: string
  active_mentees: number
}

export default function MentorsPage() {
  const { data, isLoading, error } = useQuery<{ data: Mentor[] }>({
    queryKey: ['mentors'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Mentor[] }>('/mentors')
      return res.data
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-ink">Find a Mentor</h2>
        <p className="text-neutral-600">Loading mentors...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-ink">Find a Mentor</h2>
        <p className="text-red-600">Failed to load mentors.</p>
      </div>
    )
  }

  const mentors = data?.data || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">Find a Mentor</h2>
          <p className="text-neutral-600">
            Browse verified mentors and send a mentorship request.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by expertise, bio..."
            className="px-3 py-2 border border-outline-variant rounded-md w-full md:w-64"
          />
          <select className="px-3 py-2 border border-outline-variant rounded-md">
            <option>All counties</option>
          </select>
          <select className="px-3 py-2 border border-outline-variant rounded-md">
            <option>All languages</option>
          </select>
        </div>
      </div>

      {mentors.length === 0 ? (
        <EmptyState title="No mentors found" description="Try adjusting your filters." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentors.map((m) => (
            <Card key={m.user_id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-ink">{m.full_name}</h3>
                <Badge variant={m.verified_at ? 'default' : 'secondary'}>
                  {m.verified_at ? 'Verified' : 'Unverified'}
                </Badge>
              </div>
              <p className="text-sm text-neutral-600 mb-2">{m.county}</p>
              <p className="text-sm text-neutral-800 mb-3">{m.bio}</p>
              <div className="flex gap-2 mb-3">
                {m.expertise.map((e) => (
                  <Badge key={e} className="text-xs px-2 py-1">
                    {e}
                  </Badge>
                ))}
              </div>
              <div className="text-xs text-neutral-500 mb-4">
                {m.years_experience} years exp &bull; {m.hours_per_month} hrs/mo &bull;
                {m.languages.join(', ')}
              </div>
              <Button
                onClick={() => {}}
                className="w-full"
                disabled={!m.verified_at}
              >
                {m.verified_at ? 'Request Mentorship' : 'Not verified'}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
