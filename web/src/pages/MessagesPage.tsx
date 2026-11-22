import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { apiClient } from '@/services/api'
import { createMessage } from '@/services/messaging'
import { InitialsAvatar } from '@/components/ui/initials-avatar'
import { SafeChatTips } from '@/components/ui/safe-chat-tips'

type User = {
  id: string
  full_name: string
  role: string
  county: string
}

type RawConversation = {
  id?: string
  ID?: string
  mentorship_id?: string
  MentorshipID?: string
  mentor_id?: string
  MentorID?: string
  mentee_id?: string
  MenteeID?: string
  other_user_id?: string
  OtherUserID?: string
  other_full_name?: string
  OtherFullName?: string
  other_role?: string
  OtherRole?: string
  last_message?: string | null
  LastMessage?: string | null
  last_message_at?: string | null
  LastMessageAt?: string | null
  unread_count?: number
  UnreadCount?: number
}

type Conversation = {
  id: string
  mentorshipId: string
  otherFullName: string
  otherRole: string
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
}

type RawMessage = {
  id?: string
  ID?: string
  sender_id?: string
  SenderID?: string
  body?: string
  Body?: string
  read_at?: string | null
  ReadAt?: string | null
  created_at?: string
  CreatedAt?: string
}

type Message = {
  id: string
  senderId: string
  body: string
  readAt: string | null
  createdAt: string
}

function normalizeConversation(c: RawConversation): Conversation {
  return {
    id: c.id ?? c.ID ?? '',
    mentorshipId: c.mentorship_id ?? c.MentorshipID ?? '',
    otherFullName: c.other_full_name ?? c.OtherFullName ?? 'Conversation',
    otherRole: c.other_role ?? c.OtherRole ?? '',
    lastMessage: c.last_message ?? c.LastMessage ?? null,
    lastMessageAt: c.last_message_at ?? c.LastMessageAt ?? null,
    unreadCount: c.unread_count ?? c.UnreadCount ?? 0,
  }
}

function normalizeMessage(m: RawMessage): Message {
  return {
    id: m.id ?? m.ID ?? '',
    senderId: m.sender_id ?? m.SenderID ?? '',
    body: m.body ?? m.Body ?? '',
    readAt: m.read_at ?? m.ReadAt ?? null,
    createdAt: m.created_at ?? m.CreatedAt ?? '',
  }
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatTime(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function dayKey(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toDateString()
}

function dayLabel(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  if (date.toDateString() === now.toDateString()) return 'Today'
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function relativeTime(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

const filters = [
  { key: 'all', label: 'All' },
  { key: 'mentors', label: 'Mentors' },
  { key: 'unread', label: 'Unread' },
] as const

type FilterKey = (typeof filters)[number]['key']



export default function MessagesPage() {
  const navigate = useNavigate()
  const { conversationId } = useParams<{ conversationId: string }>()
  const queryClient = useQueryClient()

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const { data: me } = useQuery<User>({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await apiClient.get<{ user: User }>('/me')
      return res.data.user
    },
  })

  const {
    data: conversationsRaw,
    isLoading: conversationsLoading,
    error: conversationsError,
  } = useQuery<{ data: RawConversation[] }>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: RawConversation[] }>('/messages')
      return res.data
    },
  })

  const conversations = useMemo(
    () => (conversationsRaw?.data ?? []).map(normalizeConversation),
    [conversationsRaw],
  )

  const activeId = conversationId ?? conversations[0]?.id ?? ''
  const activeConversation =
    conversations.find((c) => c.id === activeId) ?? null

  const {
    data: messagesRaw,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useQuery<{ data: RawMessage[] }>({
    queryKey: ['messages', activeId],
    queryFn: async () => {
      const res = await apiClient.get<{ data: RawMessage[] }>(
        `/messages/${activeId}/messages`,
      )
      return res.data
    },
    enabled: Boolean(activeId),
    refetchInterval: 5000,
  })

  const messages = useMemo(
    () => (messagesRaw?.data ?? []).map(normalizeMessage),
    [messagesRaw],
  )

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeId])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return conversations.filter((c) => {
      if (filter === 'mentors' && c.otherRole !== 'mentor') return false
      if (filter === 'unread' && c.unreadCount <= 0) return false
      if (!q) return true
      return (
        c.otherFullName.toLowerCase().includes(q) ||
        (c.lastMessage ?? '').toLowerCase().includes(q)
      )
    })
  }, [conversations, filter, query])

  const unreadTotal = conversations.filter((c) => c.unreadCount > 0).length
  const myId = me?.id

  const handleSend = async () => {
    const text = body.trim()
    if (!text || !activeId || sending) return
    setSending(true)
    try {
      await createMessage(activeId, { body: text })
      setBody('')
      await refetchMessages()
      queryClient.invalidateQueries({ queryKey: ['conversations' ] })
    } catch {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  const roleLabel = (role: string) =>
    role === 'mentor' ? 'Mentor' : role === 'mentee' ? 'Mentee' : 'Member'

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col overflow-hidden rounded-3xl border border-outline/30 bg-surface-container-lowest shadow-sm">
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANE: Conversations */}
              <section
                className={`${
                  conversationId ? 'hidden md:flex' : 'flex'
                } w-full md:w-80 lg:w-[360px] flex-shrink-0 flex-col bg-surface-container-lowest shadow-[2px_0_12px_rgba(31,21,53,0.03)] z-10`}
              >
                <div className="p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h1 className="font-headline-sm text-headline-sm text-on-surface font-extrabold tracking-tight">
                        Messages
                      </h1>
                      {unreadTotal > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm font-bold">
                          {unreadTotal} unread
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      aria-label="Start a conversation from a mentorship"
                      title="Start from a mentorship"
                      onClick={() => navigate('/mentorships')}
                      className="p-2.5 rounded-full bg-primary text-on-primary hover:bg-primary-container transition-all shadow-md shadow-primary/20 flex items-center justify-center"
                    >
                    </button>
                  </div>
                  <div className="relative w-full">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low rounded-xl text-on-surface font-body-sm text-body-sm placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_rgba(124,58,237,0.4)] transition-all"
                      placeholder="Search conversations..."
                      type="text"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {filters.map((f) => {
                      const isActive = filter === f.key
                      return (
                        <button
                          key={f.key}
                          type="button"
                          onClick={() => setFilter(f.key)}
                          className={
                            isActive
                              ? 'px-3.5 py-1.5 rounded-full font-label-sm text-label-sm font-bold bg-primary text-on-primary shadow-sm'
                              : 'px-3.5 py-1.5 rounded-full font-label-sm text-label-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors'
                          }
                        >
                          {f.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-3 pb-4">
                  {conversationsLoading ? (
                    <div className="flex flex-col gap-3">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-2xl bg-surface-container-low animate-pulse flex items-start gap-3"
                        >
                          <div className="w-12 h-12 rounded-full bg-surface-container-highest" />
                          <div className="flex-1 flex flex-col gap-2">
                            <div className="h-4 bg-surface-container-highest rounded w-3/4" />
                            <div className="h-3 bg-surface-container-highest rounded w-1/2" />
                            <div className="h-3 bg-surface-container-highest rounded w-5/6" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : conversationsError ? (
                    <div className="flex flex-col items-center justify-center text-center p-8 mt-12">
                      <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-primary mb-4">
                      </div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-1">
                        Could not load messages
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[240px]">
                        Messaging may be disabled or you are not connected.
                      </p>
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center p-8 mt-12">
                      <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-primary mb-4">
                      </div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-1">
                        No conversations
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[220px] mb-6">
                        Start a mentorship to unlock direct messaging with your
                        mentor.
                      </p>
                      <Link
                        to="/mentorships"
                        className="px-5 py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-bold shadow-md shadow-primary/20"
                      >
                        Go to My Mentorship
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {filtered.map((c) => {
                        const isActive = c.id === activeId
                        const accent =
                          c.otherRole === 'mentor'
                            ? 'bg-gradient-to-br from-primary to-primary-container text-on-primary'
                            : 'bg-gradient-to-br from-tertiary to-tertiary-container text-on-tertiary'
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => navigate(`/messages/${c.id}`)}
                            className={`relative p-3.5 rounded-2xl text-left transition-all duration-200 ${
                              isActive
                                ? 'bg-surface-container'
                                : 'hover:bg-surface-container-low'
                            }`}
                          >
                            {isActive && (
                              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-primary" />
                            )}
                            <div className="flex items-start gap-3 pl-1.5">
                              <div className="relative flex-shrink-0">
                                <InitialsAvatar
                                  initials={initialsFromName(c.otherFullName)}
                                  accent={accent}
                                  className="w-12 h-12 rounded-full text-headline-sm"
                                />
                                {c.unreadCount > 0 && (
                                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-tertiary-container ring-2 ring-surface-container-lowest" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                  <span className="font-title-md text-title-md text-on-surface font-bold truncate">
                                    {c.otherFullName}
                                  </span>
                                  <span
                                    className={`font-label-sm text-label-sm flex-shrink-0 ${
                                      c.unreadCount > 0
                                        ? 'text-primary font-bold'
                                        : 'text-on-surface-variant'
                                    }`}
                                  >
                                    {relativeTime(c.lastMessageAt)}
                                  </span>
                                </div>
                                <p className="font-label-sm text-label-sm text-primary font-semibold truncate mb-1">
                                  {roleLabel(c.otherRole)}
                                </p>
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                                    {c.lastMessage ?? 'No messages yet'}
                                  </p>
                                  {c.unreadCount > 0 && (
                                    <span className="w-5 h-5 rounded-full bg-primary text-on-primary font-label-sm text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                                      {c.unreadCount > 9 ? '9+' : c.unreadCount}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </section>

              {/* RIGHT PANE: Conversation Thread */}
              <section
                className={`${
                  conversationId ? 'flex' : 'hidden md:flex'
                } flex-1 flex-col bg-surface overflow-hidden`}
              >
                {activeConversation ? (
                  <>
                    <div className="px-4 lg:px-6 py-4 bg-surface-container-lowest shadow-[0_2px_12px_rgba(31,21,53,0.03)] flex items-center justify-between gap-4 z-10">
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          aria-label="Back to conversations"
                          onClick={() => navigate('/messages')}
                          className="md:hidden p-2 rounded-full text-on-surface-variant hover:bg-surface-container"
                        >
                        </button>
                        <InitialsAvatar
                          initials={initialsFromName(
                            activeConversation.otherFullName,
                          )}
                          accent={
                            activeConversation.otherRole === 'mentor'
                              ? 'bg-gradient-to-br from-primary to-primary-container text-on-primary'
                              : 'bg-gradient-to-br from-tertiary to-tertiary-container text-on-tertiary'
                          }
                          className="w-12 h-12 rounded-full text-headline-sm"
                        />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-headline-sm text-headline-sm text-on-surface font-extrabold truncate">
                              {activeConversation.otherFullName}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-fixed text-secondary text-[11px] font-bold">
                              {roleLabel(activeConversation.otherRole)}
                            </span>
                          </div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">
                            Mentorship conversation
                          </span>
                        </div>
                      </div>
                      <Link
                        to="/mentorships"
                        className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold transition-colors"
                      >
                        View Mentorship
                      </Link>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 space-y-4">
                      <SafeChatTips />
                      {messagesLoading ? (
                        <div className="space-y-3">
                          <div className="h-16 rounded-2xl bg-surface-container-low animate-pulse w-2/3" />
                          <div className="h-16 rounded-2xl bg-surface-container-low animate-pulse w-1/2 ml-auto" />
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center py-16">
                          <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-primary mb-4">
                          </div>
                          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-1">
                            No messages yet
                          </h3>
                          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[260px]">
                            Say hello to {activeConversation.otherFullName} to
                            start the conversation.
                          </p>
                        </div>
                      ) : (
                        messages.map((m, i) => {
                          const isMine = m.senderId === myId
                          const showDay =
                            i === 0 ||
                            dayKey(messages[i - 1].createdAt) !==
                              dayKey(m.createdAt)
                          return (
                            <div key={m.id}>
                              {showDay && (
                                <div className="flex items-center justify-center my-4">
                                  <div className="px-4 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-bold shadow-sm">
                                    {dayLabel(m.createdAt)}
                                  </div>
                                </div>
                              )}
                              <div
                                className={`flex flex-col gap-1.5 ${
                                  isMine ? 'items-end' : 'items-start'
                                }`}
                              >
                                <div
                                  className={`flex items-center gap-2 ${
                                    isMine ? 'flex-row-reverse' : ''
                                  }`}
                                >
                                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                                    {isMine
                                      ? 'You'
                                      : activeConversation.otherFullName}
                                  </span>
                                  <span className="font-label-sm text-label-sm text-outline">
                                    {formatTime(m.createdAt)}
                                  </span>
                                </div>
                                <div
                                  className={`max-w-[85%] md:max-w-2xl px-4 py-3 text-body-md leading-relaxed shadow-sm ${
                                    isMine
                                      ? 'bg-primary text-on-primary rounded-2xl rounded-tr-sm'
                                      : 'bg-surface-container-lowest text-on-surface rounded-2xl rounded-tl-sm'
                                  }`}
                                >
                                  <p className="whitespace-pre-wrap break-words">
                                    {m.body}
                                  </p>
                                </div>
                                {isMine && m.readAt && (
                                  <span className="flex items-center gap-1 text-primary text-[12px]">
                                    Read
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })
                      )}
                      <div ref={endRef} />
                    </div>

                    <div className="p-4 lg:p-5 bg-surface-container-lowest shadow-[0_-2px_12px_rgba(31,21,53,0.03)]">
                      <div className="p-3 bg-surface-container-low rounded-2xl flex flex-col gap-2.5 focus-within:bg-surface-container-lowest focus-within:shadow-[0_0_0_2px_rgba(124,58,237,0.4)] transition-all">
                        <textarea
                          value={body}
                          onChange={(e) => setBody(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder={`Message ${activeConversation.otherFullName}...`}
                          rows={2}
                          className="w-full bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none resize-none"
                        />
                        <div className="flex items-center justify-between pt-1">
                          <span className="hidden sm:inline font-label-sm text-label-sm text-outline">
                            Enter to send · Shift+Enter for new line
                          </span>
                          <button
                            type="button"
                            onClick={() => void handleSend()}
                            disabled={!body.trim() || sending}
                            className="px-5 py-2.5 rounded-full bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md font-bold shadow-md shadow-primary/25 transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                          >
                            <span>{sending ? 'Sending' : 'Send'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center text-primary mb-4">
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-1">
                      {conversationId
                        ? 'Conversation not found'
                        : 'Select a conversation'}
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[260px]">
                      {conversationId
                        ? 'This conversation may no longer be available.'
                        : 'Choose a thread on the left to start messaging.'}
                    </p>
                  </div>
                )}
              </section>
            </div>
          </div>
  )
}