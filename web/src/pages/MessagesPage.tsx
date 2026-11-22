import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '@/services/api'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/avatar'
import type { Conversation } from '@/types/messaging'

type ConversationsResponse = {
  data: Conversation[]
  meta: { limit: number }
}

export default function MessagesPage() {
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery<ConversationsResponse>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await apiClient.get<ConversationsResponse>('/messages')
      return res.data
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-ink">Messages</h2>
        <p className="text-neutral-600">Loading conversations...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-ink">Messages</h2>
        <p className="text-red-600">Failed to load conversations.</p>
      </div>
    )
  }

  const conversations = data?.data || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink">Messages</h2>
          <p className="text-neutral-600">
            Your mentorship conversations.
          </p>
        </div>
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          description="Start a conversation from an active mentorship."
        />
      ) : (
        <div className="space-y-3">
          {conversations.map((c) => (
            <Card
              key={c.id}
              className="p-4 cursor-pointer hover:bg-neutral-50 transition-colors"
              onClick={() => navigate(`/messages/${c.id}`)}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-ink">{c.other_full_name}</h3>
                  <p className="text-sm text-neutral-500">
                    {c.other_role === 'mentor' ? 'Mentor' : 'Mentee'}
                  </p>
                </div>
                {c.unread_count > 0 && (
                  <Badge variant="default">{c.unread_count}</Badge>
                )}
              </div>
              {c.last_message && (
                <p className="text-sm text-neutral-600 truncate max-w-[280px]">
                  {c.last_message}
                </p>
              )}
              <div className="text-xs text-neutral-400 mt-2">
                {c.last_message_at ? (
                  <span>
                    {new Date(c.last_message_at).toLocaleString()}
                  </span>
                ) : (
                  <span>No messages yet</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
