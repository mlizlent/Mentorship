import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { apiClient } from '@/services/api'
import { InitialsAvatar } from '@/components/ui/initials-avatar'


type Mentor = {
  id: string
  full_name: string
  bio: string
  expertise: string[]
  years_experience: number
  county: string
  languages: string[]
  hours_per_month: number
}

type RawMentorship = {
  id?: string
  ID?: string
  mentor_id?: string
  MentorID?: string
  mentee_id?: string
  MenteeID?: string
  status?: string
  Status?: string
  request_message?: string | null
  RequestMessage?: string | null
  start_date?: string | null
  StartDate?: string | null
  end_date?: string | null
  EndDate?: string | null
  created_at?: string
  CreatedAt?: string
}

type Mentorship = {
  id: string
  mentorId: string
  menteeId: string
  status: string
  requestMessage: string | null
  startDate: string | null
  endDate: string | null
  createdAt: string
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
  Description?: string
}

function normalizeMentorship(m: RawMentorship): Mentorship {
  const request = m.request_message ?? m.RequestMessage ?? null
  const start = m.start_date ?? m.StartDate ?? null
  const end = m.end_date ?? m.EndDate ?? null
  return {
    id: m.id ?? m.ID ?? '',
    mentorId: m.mentor_id ?? m.MentorID ?? '',
    menteeId: m.mentee_id ?? m.MenteeID ?? '',
    status: m.status ?? m.Status ?? 'pending',
    requestMessage: typeof request === 'string' ? request : null,
    startDate: typeof start === 'string' ? start : null,
    endDate: typeof end === 'string' ? end : null,
    createdAt: m.created_at ?? m.CreatedAt ?? '',
  }
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'MM'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatDate(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const tabs = [
  { key: 'goals', label: 'Goals & Roadmap' },
  { key: 'sessions', label: 'Sessions & Notes' },
  { key: 'resources', label: 'Shared Vault' },
] as const

type TabKey = (typeof tabs)[number]['key']

function StatCard({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline/30 shadow-sm flex items-center justify-between">
      <div className="flex flex-col">
        <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase tracking-wider text-xs">
          {label}
        </span>
        <span className="font-headline-md text-3xl font-extrabold text-ink mt-1">
          {value}
        </span>
      </div>
    </div>
  )
}

function EmptyPanel({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center p-10 rounded-2xl bg-surface-container-lowest border border-outline/30 shadow-sm text-center">
      <h3 className="font-headline-sm text-lg font-bold text-ink mb-1">
        {title}
      </h3>
      <p className="font-body-sm text-xs text-on-surface-variant max-w-sm leading-relaxed">
        {description}
      </p>
    </div>
  )
}

export default function MentorshipsPage() {
  const [tab, setTab] = useState<TabKey>('goals')
  const [selectedId, setSelectedId] = useState('')

  const {
    data: mentorshipsRaw,
    isLoading: mentorshipsLoading,
    error: mentorshipsError,
    refetch,
  } = useQuery<{ data: RawMentorship[] }>({
    queryKey: ['mentorships'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: RawMentorship[] }>('/mentorships')
      return res.data
    },
  })

  const { data: mentorsRaw } = useQuery<{ data: Mentor[] }>({
    queryKey: ['mentors'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Mentor[] }>('/mentors')
      return res.data
    },
  })

  const mentorships = useMemo(
    () => (mentorshipsRaw?.data ?? []).map(normalizeMentorship),
    [mentorshipsRaw],
  )
  const mentors = mentorsRaw?.data ?? []

  useEffect(() => {
    if (!selectedId && mentorships.length > 0) {
      setSelectedId(mentorships[0].id)
    }
  }, [mentorships, selectedId])

  const selected =
    mentorships.find((m) => m.id === selectedId) ?? mentorships[0] ?? null

  const { data: sessionsRaw, isLoading: sessionsLoading } = useQuery<{
    data: Session[]
  }>({
    queryKey: ['mentorship-sessions', selected?.id],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Session[] }>(
        `/mentorships/${selected?.id}/sessions`,
      )
      return res.data
    },
    enabled: Boolean(selected?.id),
  })

  const { data: goalsRaw, isLoading: goalsLoading } = useQuery<{ data: Goal[] }>({
    queryKey: ['mentorship-goals', selected?.id],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Goal[] }>(
        `/mentorships/${selected?.id}/goals`,
      )
      return res.data
    },
    enabled: Boolean(selected?.id),
  })

  const sessions = sessionsRaw?.data ?? []
  const goals = goalsRaw?.data ?? []

  const activeCount = mentorships.filter((m) => m.status === 'active').length
  const selectedMentor = selected
    ? mentors.find((m) => m.id === selected.mentorId)
    : undefined
  const partnerName = selectedMentor?.full_name ?? 'Mentor'
  const partnerInitials = initialsFromName(partnerName)
  const partnerRole =
    selectedMentor && selectedMentor.expertise.length > 0
      ? selectedMentor.expertise.join(' • ')
      : 'Technology Mentor'
  const partnerMeta = selectedMentor
    ? `${selectedMentor.county} · ${selectedMentor.years_experience} yrs experience`
    : selected
      ? `Status: ${selected.status}`
      : ''
  const nextSession = sessions[0]

  const isLoading = mentorshipsLoading

  const handleRefresh = () => {
    void refetch().then(() => toast.info('Mentorships refreshed'))
  }

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

  return (
    <div className="space-y-8 font-body-md text-on-surface">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-outline/30 pb-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant">
            <span className="inline-flex items-center gap-1 text-primary">
              My Mentorship Space
            </span>
            <span>•</span>
            <span className="bg-surface-container-high px-2.5 py-0.5 rounded-full text-on-surface">
              {activeCount} active track{activeCount === 1 ? '' : 's'}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-ink tracking-tight">
            Mentorship Growth Tracker
          </h1>
          <p className="text-on-surface-variant text-sm max-w-2xl leading-relaxed">
            Direct 1:1 acceleration space. Track your mentorships, scheduled session takeaways, and milestones with your mentor.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/mentors"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-primary hover:bg-primary-700 text-white font-label-md text-label-md shadow-sm transition-all"
          >
            Find a Mentor
          </Link>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-all border border-outline/40 shadow-sm text-sm font-semibold"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Mentorships" value={mentorships.length} />
        <StatCard label="Sessions Logged" value={sessions.length} />
        <StatCard label="Goals" value={goals.length} />
      </div>

      {mentorshipsError ? (
        <EmptyPanel
          title="Could not load mentorships"
          description="We couldn't reach the server. Please try refreshing in a moment."
        />
      ) : mentorships.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 lg:p-16 rounded-3xl bg-surface-container-lowest border border-outline/30 shadow-sm text-center">
          <h3 className="text-xl font-bold text-ink mb-2">
            No mentorships yet
          </h3>
          <p className="text-sm text-on-surface-variant max-w-md mb-6 leading-relaxed">
            You haven't requested a mentorship yet. Explore verified mentors in the directory to request your first 1:1 mentorship.
          </p>
          <Link
            to="/mentors"
            className="px-6 py-2.5 rounded-full bg-primary text-white font-label-md text-label-md hover:bg-primary-700 shadow-sm"
          >
            Explore Mentors
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Active Track Selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-3 rounded-2xl bg-surface-container-low border border-outline/30 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant pl-2">
                Active Track:
              </span>
              <select
                value={selected?.id ?? ''}
                onChange={(e) => setSelectedId(e.target.value)}
                className="px-4 py-2 rounded-xl bg-surface-container-lowest shadow-sm text-ink font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 border border-outline/30"
              >
                {mentorships.map((m) => {
                  const mentor = mentors.find(
                    (x) => x.id === m.mentorId,
                  )
                  const label = mentor
                    ? `${mentor.full_name} (${mentor.county})`
                    : `Mentorship ${m.id.slice(0, 8)}`
                  return (
                    <option key={m.id} value={m.id}>
                      {label}
                    </option>
                  )
                })}
              </select>
            </div>
            <Link
              to="/messages"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-surface-container-lowest text-ink hover:text-primary text-xs font-bold border border-outline/30 shadow-sm transition-colors self-end sm:self-center"
            >
              Direct Chat
            </Link>
          </div>

          {/* Active Mentor Profile Header Card */}
          <div className="relative overflow-hidden rounded-3xl bg-surface-container-lowest p-6 lg:p-8 border border-outline/30 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <InitialsAvatar
                    initials={partnerInitials}
                    accent="bg-gradient-to-br from-primary to-primary-container text-white"
                    className="w-16 h-16 rounded-2xl text-xl font-bold"
                  />
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold text-ink truncate">
                        {partnerName}
                      </h2>
                      {selected && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-secondary text-xs font-bold capitalize">
                          {selected.status}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-primary font-semibold mt-0.5">
                      {partnerRole}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {partnerMeta}
                    </p>
                  </div>
                </div>
                {selectedMentor?.bio && (
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {selectedMentor.bio}
                  </p>
                )}
                {selected?.requestMessage && (
                  <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline/20">
                    <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
                      Your request note
                    </span>
                    <p className="text-xs text-ink mt-1">
                      {selected.requestMessage}
                    </p>
                  </div>
                )}
              </div>

              <div className="lg:col-span-4 grid grid-cols-2 gap-3.5">
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline/20 flex flex-col justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Sessions Logged
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-extrabold text-primary">
                      {sessions.length}
                    </span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline/20 flex flex-col justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Goals Set
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-extrabold text-secondary">
                      {goals.length}
                    </span>
                  </div>
                </div>
                <div className="col-span-2 p-4 rounded-xl bg-surface-container-low border border-outline/20 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Track Status
                    </span>
                    <span className="text-xs font-bold text-ink capitalize mt-0.5">
                      {selected?.status ?? '—'}
                    </span>
                  </div>
                  <span className="text-xs text-on-surface-variant">
                    {formatDate(selected?.startDate ?? null)
                      ? `Started ${formatDate(selected?.startDate ?? null)}`
                      : 'Active'}
                  </span>
                </div>
              </div>

              <div className="lg:col-span-3 flex flex-col justify-between p-5 rounded-2xl bg-surface-container-low border border-outline/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    Next Session
                  </span>
                </div>
                {nextSession ? (
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-bold text-ink">
                      {nextSession.scheduled_at ?? nextSession.ScheduledAt
                        ? formatDate(
                              nextSession.scheduled_at ??
                                nextSession.ScheduledAt ??
                                null,
                            )
                        : 'Scheduled'}
                    </h3>
                    <p className="text-xs text-on-surface-variant capitalize">
                      {nextSession.status ?? nextSession.Status ?? 'Upcoming'}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-on-surface-variant">
                    No upcoming sessions scheduled yet.
                  </p>
                )}
                <Link
                  to="/sessions"
                  className="mt-3 text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                >
                  Schedule Session
                </Link>
              </div>
            </div>
          </div>

          {/* Tabs Container */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-surface-container-low border border-outline/30 max-w-xl">
              {tabs.map((t) => {
                const isActive = tab === t.key
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className={
                      isActive
                        ? 'flex-1 py-2 px-4 rounded-xl text-xs font-bold bg-surface-container-lowest text-primary shadow-sm transition-all text-center flex items-center justify-center gap-2'
                        : 'flex-1 py-2 px-4 rounded-xl text-xs font-semibold text-on-surface-variant hover:text-ink transition-all text-center flex items-center justify-center gap-2'
                    }
                  >
                    <span>{t.label}</span>
                  </button>
                )
              })}
            </div>

            {tab === 'goals' &&
              (goalsLoading ? (
                <div className="h-40 rounded-2xl bg-surface-container animate-pulse" />
              ) : goals.length === 0 ? (
                <EmptyPanel
                  title="No goals set yet"
                  description="Milestones and career goals you align on with your mentor will appear here."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {goals.map((g, i) => (
                    <div
                      key={g.id ?? g.ID ?? i}
                      className="p-5 rounded-2xl bg-surface-container-lowest border border-outline/30 shadow-sm"
                    >
                      <h4 className="text-sm font-bold text-ink">
                        {g.title ?? g.Title ?? 'Goal'}
                      </h4>
                      <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                        {g.description ?? g.Description ?? ''}
                      </p>
                      <span className="inline-block mt-3 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-xs capitalize font-bold">
                        {g.status ?? g.Status ?? 'pending'}
                      </span>
                    </div>
                  ))}
                </div>
              ))}

            {tab === 'sessions' &&
              (sessionsLoading ? (
                <div className="h-40 rounded-2xl bg-surface-container animate-pulse" />
              ) : sessions.length === 0 ? (
                <EmptyPanel
                  title="No sessions yet"
                  description="Your 1:1 sessions and their takeaways will show up here once scheduled."
                />
              ) : (
                <div className="space-y-3">
                  {sessions.map((s, i) => (
                    <div
                      key={s.id ?? s.ID ?? i}
                      className="p-4 rounded-2xl bg-surface-container-lowest border border-outline/30 shadow-sm flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-xs font-bold text-ink">
                            {s.scheduled_at ?? s.ScheduledAt
                              ? formatDate(s.scheduled_at ?? s.ScheduledAt ?? null)
                              : 'Mentorship Session'}
                          </p>
                          <p className="text-[11px] text-on-surface-variant capitalize">
                            {s.status ?? s.Status ?? 'Scheduled'}
                          </p>
                        </div>
                      </div>
                      {typeof (s.duration_min ?? s.DurationMin) === 'number' && (
                        <span className="text-xs font-semibold text-on-surface-variant">
                          {s.duration_min ?? s.DurationMin} mins
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ))}

            {tab === 'resources' && (
              <EmptyPanel
                title="No shared resources yet"
                description="Documents, code repositories, and materials shared between you and your mentor will appear here."
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}