import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/api'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/avatar'

type Mentorship = {
  id: string
  mentor_id: string
  mentee_id: string
  status: string
  request_message: string | null
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
}

export default function MentorshipsPage() {
  const { data, isLoading, error } = useQuery<{ data: Mentorship[] }>({
    queryKey: ['mentorships'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Mentorship[] }>('/mentorships')
      return res.data
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-ink">My Mentorships</h2>
        <p className="text-neutral-600">Loading mentorships...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-ink">My Mentorships</h2>
        <p className="text-red-600">Failed to load mentorships.</p>
      </div>
    )
  }

  const mentorships = data?.data || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink">My Mentorships</h2>
          <p className="text-neutral-600">
            Track your active and past mentorships.
          </p>
        </div>
      </div>

      {mentorships.length === 0 ? (
        <EmptyState
          title="No mentorships yet"
          description="Find a mentor and send a request to get started."
        />
      ) : (
        <div className="space-y-4">
          {mentorships.map((m) => (
            <Card key={m.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-ink">Mentorship #{m.id.slice(0, 8)}</h3>
                <Badge variant={m.status === 'active' ? 'default' : 'secondary'}>
                  {m.status}
                </Badge>
              </div>
              {m.request_message && (
                <p className="text-sm text-neutral-600 mb-3">{m.request_message}</p>
              )}
              <div className="text-sm text-neutral-500 space-y-1">
                <span>
                  <span className="font-medium">Status:</span> {m.status}
                </span>
                {m.start_date && (
                  <span>
                    <span className="font-medium">Started:</span> {new Date(m.start_date).toLocaleDateString()}
                  </span>
                )}
                <span>
                  <span className="font-medium">Created:</span>{' '}
                  {new Date(m.created_at).toLocaleDateString()}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
