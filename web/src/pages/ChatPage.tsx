import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import { apiClient } from '@/services/api'
import {
  createMessage,
  reportMessage,
} from '@/services/messaging'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SafeChatTips } from '@/components/ui/safe-chat-tips'
import { cn } from '@/lib/utils'
import type { Message } from '@/types/messaging'

type MessagesResponse = {
  data: Message[]
  meta: { limit: number }
}

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<MessagesResponse>({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const res = await apiClient.get<MessagesResponse>(
        `/messages/${conversationId}/messages`
      )
      return res.data
    },
    enabled: !!conversationId,
    refetchInterval: 3000,
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [data, conversationId])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim() || !conversationId || sending) return
    setSending(true)
    try {
      await createMessage(conversationId, { body })
      setBody('')
      await refetch()
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    } catch {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleReport = async (messageId: string) => {
    const reason = window.prompt('Why are you reporting this message?')
    if (!reason || !conversationId) return
    try {
      await reportMessage(conversationId, messageId, { reason })
      toast.success('Message reported')
      await refetch()
    } catch {
      toast.error('Failed to report message')
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-ink">Conversation</h2>
          <p className="text-neutral-600">Loading messages...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-ink">Conversation</h2>
          <p className="text-red-600">Failed to load messages.</p>
        </div>
      </div>
    )
  }

  const messages = data?.data || []
  const myId = 'current-user'

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="bg-primary-700 text-white px-4 py-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/messages')}>
          <span className="text-xl font-bold text-primary-300">←</span>
          <div>
            <h3 className="font-semibold text-white">Conversation</h3>
            <p className="text-xs text-primary-300">Mentorship messaging</p>
          </div>
        </div>
        <div className="text-xs text-primary-300">
          {messages.length} messages
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-neutral-50 p-4" ref={messagesEndRef}>
        <div className="max-w-2xl mx-auto">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center text-neutral-500">
              No messages yet. Start the conversation.
            </div>
          )}
          <SafeChatTips className="mb-4" />
          <div className="space-y-3">
            {messages.map((m) => {
              const isMine = m.sender_id === myId
              return (
                <div
                  key={m.id}
                  className={`flex ${
                    isMine ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <Card className={cn(
                    'max-w-[80%] px-4 py-3 rounded-2xl shadow-sm border',
                    isMine
                      ? 'bg-primary-600 text-white border-primary-700 ml-auto rounded-tr-none'
                      : 'bg-white text-ink border-neutral-300 rounded-tl-none'
                  )}>
                    <p className="text-sm">{m.body}</p>
                    <p className="text-[10px] mt-1 text-right opacity-70">
                      {isMine
                        ? 'You · '
                        : 'Them · '
                      }{new Date(m.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {!isMine && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="mt-2 h-7 w-7 p-0 text-neutral-500 hover:text-danger"
                        onClick={() => handleReport(m.id)}
                        title="Report message"
                      >
                        !
                      </Button>
                    )}
                  </Card>
                </div>
              )
            })}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-neutral-200 p-4">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type a message…"
              className="flex-1"
              disabled={sending}
            />
            <Button
              type="submit"
              variant="default"
              disabled={!body.trim() || sending}
            >
              Send
            </Button>
          </form>
        </div>
      </footer>
    </div>
  )
}
