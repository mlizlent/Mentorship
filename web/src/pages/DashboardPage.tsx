import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/api'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InitialsAvatar } from '@/components/ui/initials-avatar'

type User = {
  id: string
  full_name: string
  email: string
  role: string
  county: string
  language: string
}

type Mentorship = {
  id?: string
  ID?: string
  mentor_id?: string
  MentorID?: string
  status?: string
  Status?: string
  start_date?: string | null
  created_at?: string
}

type Mentor = {
  id: string
  full_name: string
  expertise: string[]
  county: string
  years_experience: number
}

type Session = {
  id?: string
  ID?: string
  scheduled_at?: string
  ScheduledAt?: string
  status?: string
  Status?: string
  duration_min?: number
  DurationMin?: number
}

type Goal = {
  id?: string
  ID?: string
  title?: string
  Title?: string
  status?: string
  Status?: string
  description?: string
}

export default function DashboardPage() {
  const navigate = useNavigate()

  // Real user data
  const { data: userResponse, isLoading: userLoading } = useQuery<{ user: User }>({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await apiClient.get<{ user: User }>('/me')
      return res.data
    },
  })

  // Real mentorships data
  const { data: mentorshipsResponse, isLoading: mentorshipsLoading } = useQuery<{ data: Mentorship[] }>({
    queryKey: ['mentorships'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Mentorship[] }>('/mentorships')
      return res.data
    },
  })

  // Real mentors data
  const { data: mentorsResponse } = useQuery<{ data: Mentor[] }>({
    queryKey: ['mentors'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Mentor[] }>('/mentors')
      return res.data
    },
  })

  const user = userResponse?.user
  const mentorships = useMemo(() => mentorshipsResponse?.data || [], [mentorshipsResponse])
  const mentors = useMemo(() => mentorsResponse?.data || [], [mentorsResponse])

  const activeMentorship = mentorships.find((m) => (m.status || m.Status) === 'active') || mentorships[0]
  const activeMentorshipId = activeMentorship?.id || activeMentorship?.ID

  // Real sessions for the active mentorship
  const { data: sessionsResponse } = useQuery<{ data: Session[] }>({
    queryKey: ['mentorship-sessions', activeMentorshipId],
    queryFn: async () => {
      if (!activeMentorshipId) return { data: [] }
      const res = await apiClient.get<{ data: Session[] }>(`/mentorships/${activeMentorshipId}/sessions`)
      return res.data
    },
    enabled: Boolean(activeMentorshipId),
  })

  // Real goals for the active mentorship
  const { data: goalsResponse } = useQuery<{ data: Goal[] }>({
    queryKey: ['mentorship-goals', activeMentorshipId],
    queryFn: async () => {
      if (!activeMentorshipId) return { data: [] }
      const res = await apiClient.get<{ data: Goal[] }>(`/mentorships/${activeMentorshipId}/goals`)
      return res.data
    },
    enabled: Boolean(activeMentorshipId),
  })

  const sessions = sessionsResponse?.data || []
  const goals = goalsResponse?.data || []

  const activeMentor = activeMentorship
    ? mentors.find((m) => m.id === (activeMentorship.mentor_id || activeMentorship.MentorID))
    : null

  const activeCount = mentorships.filter((m) => (m.status || m.Status) === 'active').length

  const isLoading = userLoading || mentorshipsLoading

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-surface-container rounded-2xl w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="h-32 bg-surface-container rounded-2xl" />
          <div className="h-32 bg-surface-container rounded-2xl" />
          <div className="h-32 bg-surface-container rounded-2xl" />
        </div>
        <div className="h-64 bg-surface-container rounded-2xl w-full" />
      </div>
    )
  }

  const displayName = user?.full_name || 'Mentee'

  return (
    <div className="space-y-8 font-body-md text-on-surface">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-primary/10 via-surface-container to-surface-container-high border border-outline/40 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-lowest text-primary font-label-sm text-xs font-bold shadow-sm mb-3">
            Mentee Growth Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            Welcome back, {displayName}
          </h1>
          <p className="text-on-surface-variant text-sm mt-1 max-w-xl leading-relaxed">
            Track your mentorship tracks, upcoming sessions, and milestones. Connect directly with senior women tech leaders.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => navigate('/mentors')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary hover:bg-primary-700 text-white font-label-md text-label-md shadow-md transition-all"
          >
            <span>Find a Mentor</span>
          </Button>
          <Button
            onClick={() => navigate('/sessions')}
            variant="outline"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-label-md text-label-md hover:bg-surface-container transition-all"
          >
            <span>Sessions</span>
          </Button>
        </div>
      </div>

      {/* Real Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-5 rounded-2xl bg-surface-container-lowest border border-outline/40 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-bold text-on-surface-variant tracking-wider">
                My Mentorships
              </span>
              <p className="text-3xl font-extrabold text-ink mt-1">{mentorships.length}</p>
            </div>
          </div>
          <p className="text-xs text-on-surface-variant mt-3">{activeCount} active track{activeCount === 1 ? '' : 's'}</p>
        </Card>

        <Card className="p-5 rounded-2xl bg-surface-container-lowest border border-outline/40 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-bold text-on-surface-variant tracking-wider">
                Scheduled Sessions
              </span>
              <p className="text-3xl font-extrabold text-ink mt-1">{sessions.length}</p>
            </div>
          </div>
          <p className="text-xs text-on-surface-variant mt-3">Logged with mentors</p>
        </Card>

        <Card className="p-5 rounded-2xl bg-surface-container-lowest border border-outline/40 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-bold text-on-surface-variant tracking-wider">
                Active Goals
              </span>
              <p className="text-3xl font-extrabold text-ink mt-1">{goals.length}</p>
            </div>
          </div>
          <p className="text-xs text-on-surface-variant mt-3">Milestones in progress</p>
        </Card>

        <Card className="p-5 rounded-2xl bg-surface-container-lowest border border-outline/40 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-bold text-on-surface-variant tracking-wider">
                Mentors Available
              </span>
              <p className="text-3xl font-extrabold text-ink mt-1">{mentors.length}</p>
            </div>
          </div>
          <p className="text-xs text-on-surface-variant mt-3">In African tech directory</p>
        </Card>
      </div>

      {/* Active Mentorship Track or Empty State */}
      {mentorships.length === 0 ? (
        <Card className="p-10 rounded-3xl bg-surface-container-lowest border border-outline/40 text-center shadow-sm">
          <h2 className="text-xl font-bold text-ink">No active mentorship tracks yet</h2>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto mt-2 leading-relaxed">
            You haven't requested a mentorship yet. Browse verified senior leaders in engineering, product, and data to begin your 1:1 acceleration.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button
              onClick={() => navigate('/mentors')}
              className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary-700 text-white font-label-md text-label-md shadow-sm"
            >
              Explore Mentors
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Mentorship Card */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="p-6 rounded-3xl bg-surface-container-lowest border border-outline/40 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <InitialsAvatar
                    initials={activeMentor ? activeMentor.full_name.slice(0, 2).toUpperCase() : 'MM'}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-white font-bold text-lg"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-ink">
                        {activeMentor ? activeMentor.full_name : 'Active Mentor'}
                      </h2>
                      <Badge variant="secondary" className="capitalize text-xs font-bold">
                        {activeMentorship.status || activeMentorship.Status || 'Active'}
                      </Badge>
                    </div>
                    <p className="text-xs text-primary font-semibold mt-0.5">
                      {activeMentor?.expertise?.join(' • ') || 'Technology Leadership'}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {activeMentor?.county || 'Kenya'} • {activeMentor?.years_experience || 5} yrs experience
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => navigate('/messages')}
                    variant="outline"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold"
                  >
                    <span>Direct Message</span>
                  </Button>
                  <Button
                    onClick={() => navigate('/mentorships')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-primary text-white"
                  >
                    <span>View Track</span>
                  </Button>
                </div>
              </div>

              {/* Sessions List */}
              <div className="pt-4 border-t border-outline/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-ink">Upcoming Sessions</h3>
                  <Link to="/sessions" className="text-xs text-primary font-bold hover:underline">
                    View Calendar
                  </Link>
                </div>
                {sessions.length === 0 ? (
                  <p className="text-xs text-on-surface-variant py-2">
                    No sessions scheduled yet. Reach out to your mentor to schedule your first sync.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {sessions.slice(0, 3).map((s, idx) => (
                      <div
                        key={s.id || s.ID || idx}
                        className="p-3.5 rounded-xl bg-surface-container-low border border-outline/30 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-xs font-bold text-ink">1:1 Mentorship Session</p>
                            <p className="text-[11px] text-on-surface-variant">
                              {s.scheduled_at || s.ScheduledAt || 'Scheduled'}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs capitalize">
                          {s.status || s.Status || 'Scheduled'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Goals List */}
              <div className="pt-4 border-t border-outline/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-ink">Goals &amp; Deliverables</h3>
                  <Link to="/mentorships" className="text-xs text-primary font-bold hover:underline">
                    Manage Goals
                  </Link>
                </div>
                {goals.length === 0 ? (
                  <p className="text-xs text-on-surface-variant py-2">
                    No goals defined yet. Set career roadmaps and milestones with your mentor.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {goals.slice(0, 3).map((g, idx) => (
                      <div
                        key={g.id || g.ID || idx}
                        className="p-3.5 rounded-xl bg-surface-container-low border border-outline/30 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-bold text-ink">{g.title || g.Title || 'Growth Milestone'}</p>
                          <p className="text-[11px] text-on-surface-variant">{g.description || ''}</p>
                        </div>
                        <Badge variant="outline" className="text-xs capitalize">
                          {g.status || g.Status || 'In Progress'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Quick Shortcuts Right Column */}
          <div className="lg:col-span-4 space-y-5">
            <Card className="p-5 rounded-3xl bg-surface-container-lowest border border-outline/40 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-ink">Quick Navigation</h3>
              <div className="flex flex-col gap-2">
                <Link
                  to="/mentors"
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors text-xs font-semibold text-ink"
                >
                  <span className="flex items-center gap-2">
                    Find Mentors
                  </span>

                </Link>
                <Link
                  to="/mentorships"
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors text-xs font-semibold text-ink"
                >
                  <span className="flex items-center gap-2">
                    Mentorship Space
                  </span>

                </Link>
                <Link
                  to="/sessions"
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors text-xs font-semibold text-ink"
                >
                  <span className="flex items-center gap-2">
                    Scheduled Sessions
                  </span>

                </Link>
                <Link
                  to="/messages"
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors text-xs font-semibold text-ink"
                >
                  <span className="flex items-center gap-2">
                    Messages
                  </span>

                </Link>
              </div>
            </Card>

            <Card className="p-5 rounded-3xl bg-surface-container-low border border-outline/40 shadow-sm space-y-2">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Mentee Safety
              </span>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                All mentors are verified tech professionals bound by our code of conduct.
              </p>
              <Link to="/profile" className="text-xs font-bold text-primary hover:underline inline-block mt-1">
                View Code of Conduct &amp; Safety
              </Link>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
