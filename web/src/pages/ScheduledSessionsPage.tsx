import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { apiClient } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { InitialsAvatar } from '@/components/ui/initials-avatar'

type RawSession = {
  id?: string
  ID?: string
  mentorship_id?: string
  MentorshipID?: string
  scheduled_at?: string
  ScheduledAt?: string
  duration_min?: number
  DurationMin?: number
  status?: string
  Status?: string
  notes?: string
}

type Mentorship = {
  id?: string
  ID?: string
  mentor_id?: string
  MentorID?: string
  status?: string
}

type Mentor = {
  id: string
  full_name: string
  county: string
  expertise: string[]
}

type ViewMode = 'agenda' | 'list'

export default function ScheduledSessionsPage() {
  const navigate = useNavigate()
  const [view, setView] = useState<ViewMode>('agenda')

  // Real mentorships
  const { data: mentorshipsRaw } = useQuery<{ data: Mentorship[] }>({
    queryKey: ['mentorships'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Mentorship[] }>('/mentorships')
      return res.data
    },
  })

  // Real mentors
  const { data: mentorsRaw } = useQuery<{ data: Mentor[] }>({
    queryKey: ['mentors'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Mentor[] }>('/mentors')
      return res.data
    },
  })

  const mentorships = useMemo(() => mentorshipsRaw?.data || [], [mentorshipsRaw])
  const mentors = useMemo(() => mentorsRaw?.data || [], [mentorsRaw])

  const activeMentorship = mentorships[0]
  const activeMentorshipId = activeMentorship?.id || activeMentorship?.ID

  // Real sessions
  const { data: sessionsRaw, isLoading: sessionsLoading } = useQuery<{ data: RawSession[] }>({
    queryKey: ['mentorship-sessions', activeMentorshipId],
    queryFn: async () => {
      if (!activeMentorshipId) return { data: [] }
      const res = await apiClient.get<{ data: RawSession[] }>(`/mentorships/${activeMentorshipId}/sessions`)
      return res.data
    },
    enabled: Boolean(activeMentorshipId),
  })

  const sessions = sessionsRaw?.data || []

  const queryClient = useQueryClient()
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [duration, setDuration] = useState('30')
  const [meetingLink, setMeetingLink] = useState('')

  const createSession = useMutation({
    mutationFn: async () => {
      if (!activeMentorshipId) throw new Error('No active mentorship')
      await apiClient.post(`/mentorships/${activeMentorshipId}/sessions`, {
        scheduled_at: new Date(scheduledAt).toISOString(),
        duration_min: Number(duration),
        meeting_link: meetingLink.trim(),
      })
    },
    onSuccess: () => {
      toast.success('Session scheduled')
      setScheduledAt('')
      setDuration('30')
      setMeetingLink('')
      setShowSchedule(false)
      void queryClient.invalidateQueries({
        queryKey: ['mentorship-sessions', activeMentorshipId],
      })
    },
    onError: () => toast.error('Could not schedule session'),
  })

  const updateSession = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiClient.patch(`/sessions/${id}`, { status })
    },
    onSuccess: () => {
      toast.success('Session updated')
      void queryClient.invalidateQueries({
        queryKey: ['mentorship-sessions', activeMentorshipId],
      })
    },
    onError: () => toast.error('Could not update session'),
  })

  const nextSession = sessions[0]
  const activeMentor = activeMentorship
    ? mentors.find((m) => m.id === (activeMentorship.mentor_id || activeMentorship.MentorID))
    : null

  return (
    <div className="space-y-8 font-body-md text-on-surface">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline/30 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
            Mentorship Calendar
          </div>
          <h1 className="text-3xl font-extrabold text-ink tracking-tight">Scheduled Sessions</h1>
          <p className="text-on-surface-variant text-sm mt-0.5">
            View upcoming 1:1 sessions and review notes with your mentor.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center p-1 rounded-xl bg-surface-container-low border border-outline/30">
            <button
              onClick={() => setView('agenda')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                view === 'agenda'
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-ink'
              }`}
            >
              Agenda View
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                view === 'list'
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-ink'
              }`}
            >
              All Sessions ({sessions.length})
            </button>
          </div>
          <Button
            onClick={() => navigate('/mentors')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary hover:bg-primary-700 text-white font-label-md text-label-md shadow-sm"
          >
            <span>Book with Mentor</span>
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Sessions List / Agenda */}
        <div className="lg:col-span-8 space-y-6">
          {sessionsLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-24 bg-surface-container rounded-2xl" />
              <div className="h-24 bg-surface-container rounded-2xl" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-surface-container-lowest border border-outline/30 shadow-sm space-y-4">
              <div>
                <h3 className="text-lg font-bold text-ink">No sessions scheduled yet</h3>
                <p className="text-sm text-on-surface-variant max-w-md mx-auto mt-1 leading-relaxed">
                  Your calendar is open. Once you connect with a mentor, scheduled 1:1 syncs and technical reviews will appear here.
                </p>
              </div>
              <div className="pt-2">
                <Button
                  onClick={() => navigate('/mentors')}
                  className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary-700 text-white font-label-md text-label-md shadow-sm"
                >
                  Find a Mentor
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((s, idx) => {
                const sessionId = s.id || s.ID
                const status = s.status || s.Status || 'scheduled'
                const dateStr = s.scheduled_at || s.ScheduledAt
                const dateObj = dateStr ? new Date(dateStr) : null
                const isValidDate = dateObj && !isNaN(dateObj.getTime())
                const dayMonth = isValidDate
                  ? dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                  : 'Upcoming'
                const timeStr = isValidDate
                  ? dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                  : 'Time TBD'

                return (
                  <Card
                    key={s.id || s.ID || idx}
                    className="p-5 rounded-2xl bg-surface-container-lowest border border-outline/30 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex flex-col items-center justify-center text-primary font-bold shrink-0">
                        <span className="text-xs uppercase">{dayMonth.split(' ')[0]}</span>
                        <span className="text-lg leading-tight">{dayMonth.split(' ')[1] || '•'}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-ink text-base">1:1 Mentorship Session</h3>
                          <Badge variant="outline" className="capitalize text-xs font-bold">
                            {status}
                          </Badge>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {timeStr} EAT • {s.duration_min || s.DurationMin || 60} mins
                        </p>
                        {activeMentor && (
                          <p className="text-xs text-primary font-medium mt-1">
                            With {activeMentor.full_name} ({activeMentor.county})
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Link
                        to="/messages"
                        className="px-4 py-2 rounded-full border border-outline/30 text-xs font-bold text-on-surface hover:bg-surface-container transition-colors"
                      >
                        Message Mentor
                      </Link>
                      {sessionId &&
                        status !== 'cancelled' &&
                        status !== 'completed' && (
                          <button
                            type="button"
                            onClick={() =>
                              updateSession.mutate({ id: sessionId, status: 'cancelled' })
                            }
                            disabled={updateSession.isPending}
                            className="px-4 py-2 rounded-full border border-red-200 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                          >
                            Cancel
                          </button>
                        )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: Upcoming Session Highlights */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 rounded-3xl bg-surface-container-lowest border border-outline/30 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-ink">Next Session</h3>
            </div>

            {nextSession ? (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline/20">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">Scheduled Date</span>
                  <p className="text-sm font-bold text-ink mt-0.5">
                    {nextSession.scheduled_at || nextSession.ScheduledAt || 'Confirmed'}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1 capitalize">
                    Status: {nextSession.status || nextSession.Status || 'Upcoming'}
                  </p>
                </div>
                {activeMentor && (
                  <div className="flex items-center gap-3 pt-2">
                    <InitialsAvatar
                      initials={activeMentor.full_name.slice(0, 2).toUpperCase()}
                      className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-xs"
                    />
                    <div>
                      <p className="text-xs font-bold text-ink">{activeMentor.full_name}</p>
                      <p className="text-[11px] text-on-surface-variant">Mentor</p>
                    </div>
                  </div>
                )}
                <Link
                  to="/messages"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary-700 shadow-sm transition-all"
                >
                  <span>Open Chat with Mentor</span>
                </Link>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline/20 text-xs text-on-surface-variant">
                No upcoming sessions scheduled. Reach out to a mentor from the directory to set up your sync.
              </div>
            )}
          </Card>

          {activeMentorshipId && (
            <Card className="p-6 rounded-3xl bg-surface-container-lowest border border-outline/30 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-bold text-ink">Schedule Session</h3>
                <button
                  type="button"
                  onClick={() => setShowSchedule((v) => !v)}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  {showSchedule ? 'Close' : 'New session'}
                </button>
              </div>

              {showSchedule ? (
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault()
                    createSession.mutate()
                  }}
                >
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Date &amp; time
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-outline/40 bg-surface-container-lowest text-sm text-ink"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={480}
                      required
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-outline/40 bg-surface-container-lowest text-sm text-ink"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Meeting link
                    </label>
                    <input
                      type="url"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      placeholder="https://meet.google.com/..."
                      className="w-full px-3 py-2 rounded-xl border border-outline/40 bg-surface-container-lowest text-sm text-ink"
                    />
                  </div>
                  <Button type="submit" disabled={createSession.isPending} className="w-full">
                    {createSession.isPending ? 'Scheduling...' : 'Schedule Session'}
                  </Button>
                </form>
              ) : (
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Set up a 1:1 session with your mentor. Times are in East Africa Time (EAT).
                </p>
              )}
            </Card>
          )}

          <Card className="p-6 rounded-3xl bg-surface-container-low border border-outline/30 shadow-sm space-y-3">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Timezone Notice
            </span>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              All session times are coordinated in East Africa Time (EAT / UTC+3). Be sure to join 5 minutes before scheduled start time.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}