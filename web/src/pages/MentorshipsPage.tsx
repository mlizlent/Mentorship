import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { apiClient } from '@/services/api'
import { featuredMentors } from '@/data/featuredMentors'
import { InitialsAvatar } from '@/components/ui/initials-avatar'

type User = {
  id: string
  email: string
  role: string
  full_name: string
  county: string
  language: string
  status: string
}

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
  { key: 'goals', label: 'Goals & Roadmap', icon: 'flag' },
  { key: 'sessions', label: 'Sessions & Notes', icon: 'forum' },
  { key: 'resources', label: 'Shared Vault', icon: 'folder_special' },
] as const

type TabKey = (typeof tabs)[number]['key']

const primaryNav: { label: string; to?: string; tab?: TabKey }[] = [
  { label: 'Explore Mentors', to: '/mentors' },
  { label: 'My Mentorship', to: '/mentorships' },
  { label: 'Messages', to: '/messages' },
  { label: 'Resources', tab: 'resources' },
]

const workspaceNav: {
  label: string
  icon: string
  to?: string
  tab?: TabKey
  active?: boolean
}[] = [
  { label: 'Overview', icon: 'space_dashboard', to: '/home' },
  { label: 'My Mentorship', icon: 'handshake', to: '/mentorships', active: true },
  { label: 'Scheduled Sessions', icon: 'calendar_month', tab: 'sessions' },
  { label: 'Growth Milestones', icon: 'flag', tab: 'goals' },
  { label: 'Messages', icon: 'forum', to: '/messages' },
  { label: 'Learning Vault', icon: 'folder_special', tab: 'resources' },
]

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string
  label: string
  value: number
}) {
  return (
    <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-sm flex items-center justify-between">
      <div className="flex flex-col">
        <span className="font-label-sm text-label-sm text-on-surface-variant">
          {label}
        </span>
        <span className="font-headline-md text-headline-md text-primary font-bold mt-1">
          {value}
        </span>
      </div>
      <div className="w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center text-primary">
        <span className="material-symbols-outlined text-[22px]">{icon}</span>
      </div>
    </div>
  )
}

function EmptyPanel({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center p-10 rounded-2xl bg-surface-container-lowest shadow-sm text-center">
      <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-primary mb-3">
        <span className="material-symbols-outlined text-[28px]">{icon}</span>
      </div>
      <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">
        {title}
      </h3>
      <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">
        {description}
      </p>
    </div>
  )
}

export default function MentorshipsPage() {
  const [tab, setTab] = useState<TabKey>('goals')
  const [selectedId, setSelectedId] = useState('')

  const { data: me, isLoading: meLoading } = useQuery<User>({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await apiClient.get<{ user: User }>('/me')
      return res.data.user
    },
  })

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

  const { data: goalsRaw, isLoading: goalsLoading } = useQuery<{ data: Goal[] }>(
    {
      queryKey: ['mentorship-goals', selected?.id],
      queryFn: async () => {
        const res = await apiClient.get<{ data: Goal[] }>(
          `/mentorships/${selected?.id}/goals`,
        )
        return res.data
      },
      enabled: Boolean(selected?.id),
    },
  )

  const sessions = sessionsRaw?.data ?? []
  const goals = goalsRaw?.data ?? []

  const activeCount = mentorships.filter((m) => m.status === 'active').length
  const userInitials = me ? initialsFromName(me.full_name) : 'MM'
  const selectedMentor = selected
    ? mentors.find((m) => m.id === selected.mentorId)
    : undefined
  const partnerName = selectedMentor?.full_name ?? 'Mentor'
  const partnerInitials = initialsFromName(partnerName)
  const partnerRole =
    selectedMentor && selectedMentor.expertise.length > 0
      ? selectedMentor.expertise.join(' • ')
      : 'Mentor'
  const partnerMeta = selectedMentor
    ? `${selectedMentor.county} · ${selectedMentor.years_experience} yrs experience`
    : selected
      ? `Status: ${selected.status}`
      : ''
  const nextSession = sessions[0]

  const isLoading = meLoading || mentorshipsLoading

  const handleRefresh = () => {
    void refetch().then(() => toast('Mentorships refreshed'))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
          <div className="h-8 w-72 rounded-full bg-surface-container animate-pulse" />
          <div className="h-64 rounded-2xl bg-surface-container-high w-full animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="h-40 rounded-2xl bg-surface-container-high animate-pulse" />
            <div className="h-40 rounded-2xl bg-surface-container-high animate-pulse" />
            <div className="h-40 rounded-2xl bg-surface-container-high animate-pulse" />
            <div className="h-40 rounded-2xl bg-surface-container-high animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased">
      <header className="fixed top-0 left-0 w-full z-50 bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_1px_12px_rgba(31,21,53,0.05)]">
        <div className="h-20 w-full px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline-sm font-extrabold shadow-sm"
              >
                M
              </span>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-primary leading-tight font-extrabold">
                  Malkia Mentor
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold tracking-wider uppercase text-[10px]">
                  Community Portal
                </span>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {primaryNav.map((item) =>
                item.to ? (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => item.tab && setTab(item.tab)}
                    className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    {item.label}
                  </button>
                ),
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => toast('No new notifications')}
              className="relative p-2.5 rounded-full text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[22px]">
                notifications
              </span>
            </button>
            <div className="flex items-center gap-3 pl-2">
              <InitialsAvatar
                initials={userInitials}
                accent="bg-primary-container/15 text-primary ring-2 ring-primary-container/20"
                className="w-10 h-10 rounded-full text-headline-sm"
              />
              <div className="hidden xl:flex flex-col">
                <span className="font-label-md text-label-md text-on-surface font-bold leading-tight">
                  {me?.full_name ?? 'My Account'}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant capitalize">
                  {me ? `${me.role} • ${me.county}` : 'Mentee'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex w-full">
        <aside className="hidden lg:flex fixed top-20 left-0 w-64 h-[calc(100vh-5rem)] flex-col justify-between bg-surface-container-lowest z-40 shadow-[2px_0_12px_rgba(31,21,53,0.03)] px-4 py-6 overflow-y-auto">
          <div className="flex flex-col gap-6">
            <div className="px-3 flex items-center gap-2">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Workspace
              </span>
            </div>
            <nav className="flex flex-col gap-1.5">
              {workspaceNav.map((item) => {
                const isActive = item.tab ? tab === item.tab : item.active
                const base =
                  'flex items-center gap-3 px-3.5 py-3 rounded-full font-label-md text-label-md transition-all'
                const cls = isActive
                  ? `${base} bg-surface-container text-primary font-bold shadow-sm`
                  : `${base} text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface`
                const inner = (
                  <>
                    <span className="material-symbols-outlined text-[20px]">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </>
                )
                return item.to ? (
                  <Link key={item.label} to={item.to} className={cls}>
                    {inner}
                  </Link>
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => item.tab && setTab(item.tab)}
                    className={cls}
                  >
                    {inner}
                  </button>
                )
              })}
            </nav>
          </div>
          <div className="flex flex-col gap-3 p-4 rounded-2xl bg-surface-container">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider">
                Your Activity
              </span>
              <span className="material-symbols-outlined text-secondary text-[18px]">
                insights
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface">
              {mentorships.length} mentorship
              {mentorships.length === 1 ? '' : 's'} · {activeCount} active
            </p>
            <Link
              to="/mentors"
              className="font-label-sm text-label-sm text-primary font-semibold hover:underline"
            >
              Find a mentor
            </Link>
          </div>
        </aside>

        <main className="w-full pt-20 lg:pl-64 bg-surface min-h-screen">
          <div className="flex flex-col w-full">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant">
                    <span className="inline-flex items-center gap-1 text-primary font-semibold">
                      <span className="material-symbols-outlined text-[16px]">
                        workspace_premium
                      </span>
                      My Mentorship
                    </span>
                    <span>•</span>
                    <span className="bg-surface-container-high px-2.5 py-0.5 rounded-full text-on-surface">
                      {activeCount} active
                    </span>
                  </div>
                  <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                    Mentorship Space &amp; Growth Tracker
                  </h1>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
                    Direct 1:1 acceleration space. Track your mentorships,
                    session takeaways, and goals with your mentor.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to="/mentors"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-primary-container text-on-primary font-label-md text-label-md hover:bg-primary shadow-[0_4px_16px_rgba(124,58,237,0.25)] transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      person_search
                    </span>
                    Find a Mentor
                  </Link>
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-surface-container-lowest text-primary font-label-md text-label-md hover:bg-surface-container transition-all shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      refresh
                    </span>
                    Refresh
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  icon="handshake"
                  label="Mentorships"
                  value={mentorships.length}
                />
                <StatCard
                  icon="forum"
                  label="Sessions Logged"
                  value={sessions.length}
                />
                <StatCard icon="flag" label="Goals" value={goals.length} />
              </div>

              {mentorshipsError ? (
                <EmptyPanel
                  icon="error_outline"
                  title="Could not load mentorships"
                  description="We couldn't reach the server. Please try refreshing in a moment."
                />
              ) : mentorships.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 lg:p-20 rounded-2xl bg-surface-container-lowest shadow-sm text-center">
                  <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center text-primary mb-4">
                    <span className="material-symbols-outlined text-[36px]">
                      diversity_1
                    </span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">
                    No mentorships yet
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-6">
                    You haven&apos;t started a mentorship yet. Explore the
                    featured mentors below, or browse all mentors to request your
                    first mentorship.
                  </p>
                  <Link
                    to="/mentors"
                    className="px-6 py-3 rounded-full bg-primary-container text-on-primary font-label-md text-label-md hover:bg-primary shadow-sm"
                  >
                    Explore Mentors
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-3 rounded-2xl bg-surface-container-low shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant pl-2">
                        Active Track:
                      </span>
                      <select
                        value={selected?.id ?? ''}
                        onChange={(e) => setSelectedId(e.target.value)}
                        className="px-4 py-2 rounded-xl bg-surface-container-lowest shadow-sm text-on-surface font-label-md text-label-md focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-lowest text-on-surface-variant hover:text-primary text-label-sm font-label-sm shadow-sm transition-colors self-end sm:self-center"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        chat_bubble_outline
                      </span>
                      Direct Chat
                    </Link>
                  </div>

                  <div className="relative overflow-hidden rounded-2xl bg-surface-container-lowest p-6 lg:p-8 shadow-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                      <div className="lg:col-span-5 flex flex-col gap-4">
                        <div className="flex items-start gap-4">
                          <InitialsAvatar
                            initials={partnerInitials}
                            accent="bg-gradient-to-br from-primary to-primary-container text-on-primary"
                            className="w-20 h-20 rounded-2xl text-headline-sm"
                          />
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h2 className="font-headline-sm text-headline-sm text-on-surface truncate">
                                {partnerName}
                              </h2>
                              {selected && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-secondary text-label-sm font-label-sm font-bold capitalize">
                                  {selected.status}
                                </span>
                              )}
                            </div>
                            <p className="font-label-md text-label-md text-primary font-semibold">
                              {partnerRole}
                            </p>
                            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                              {partnerMeta}
                            </p>
                          </div>
                        </div>
                        {selectedMentor?.bio && (
                          <p className="font-body-sm text-body-sm text-on-surface-variant">
                            {selectedMentor.bio}
                          </p>
                        )}
                        {selected?.requestMessage && (
                          <div className="p-3.5 rounded-xl bg-surface-container-low">
                            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                              Your request note
                            </span>
                            <p className="font-body-sm text-body-sm text-on-surface mt-1">
                              {selected.requestMessage}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="lg:col-span-4 grid grid-cols-2 gap-3.5">
                        <div className="p-4 rounded-xl bg-surface-container-low flex flex-col justify-between">
                          <span className="text-label-sm font-label-sm text-on-surface-variant">
                            Sessions Logged
                          </span>
                          <div className="flex items-baseline gap-2 mt-2">
                            <span className="font-headline-md text-headline-md text-primary font-bold">
                              {sessions.length}
                            </span>
                          </div>
                        </div>
                        <div className="p-4 rounded-xl bg-surface-container-low flex flex-col justify-between">
                          <span className="text-label-sm font-label-sm text-on-surface-variant">
                            Goals
                          </span>
                          <div className="flex items-baseline gap-2 mt-2">
                            <span className="font-headline-md text-headline-md text-secondary font-bold">
                              {goals.length}
                            </span>
                          </div>
                        </div>
                        <div className="col-span-2 p-4 rounded-xl bg-surface-container-low flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-label-sm font-label-sm text-on-surface-variant">
                              Status
                            </span>
                            <span className="font-label-md text-label-md text-on-surface font-bold capitalize">
                              {selected?.status ?? '—'}
                            </span>
                          </div>
                          <span className="text-label-sm text-label-sm text-on-surface-variant">
                            {formatDate(selected?.startDate ?? null)
                              ? `Started ${formatDate(selected?.startDate ?? null)}`
                              : 'Start date pending'}
                          </span>
                        </div>
                      </div>

                      <div className="lg:col-span-3 flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-br from-surface-container-high to-surface-container shadow-inner">
                        <div className="flex items-center justify-between mb-3">
                          <span className="inline-flex items-center gap-1.5 font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-secondary-container" />
                            Next Session
                          </span>
                        </div>
                        {nextSession ? (
                          <div className="flex flex-col gap-1">
                            <h3 className="font-headline-sm text-headline-sm text-on-surface leading-snug">
                              {nextSession.scheduled_at ?? nextSession.ScheduledAt
                                ? formatDate(
                                      nextSession.scheduled_at ??
                                        nextSession.ScheduledAt ??
                                        null,
                                    )
                                : 'Scheduled'}
                            </h3>
                            <p className="font-body-sm text-body-sm text-on-surface-variant capitalize">
                              {nextSession.status ?? nextSession.Status ?? 'upcoming'}
                            </p>
                          </div>
                        ) : (
                          <p className="font-body-sm text-body-sm text-on-surface-variant">
                            No upcoming sessions scheduled yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-3 p-1.5 rounded-2xl bg-surface-container-low max-w-xl shadow-sm">
                      {tabs.map((t) => {
                        const isActive = tab === t.key
                        return (
                          <button
                            key={t.key}
                            type="button"
                            onClick={() => setTab(t.key)}
                            className={
                              isActive
                                ? 'flex-1 py-2.5 px-4 rounded-xl font-label-md text-label-md font-bold bg-surface-container-lowest text-primary shadow-sm transition-all text-center flex items-center justify-center gap-2'
                                : 'flex-1 py-2.5 px-4 rounded-xl font-label-md text-label-md font-semibold text-on-surface-variant hover:text-on-surface transition-all text-center flex items-center justify-center gap-2'
                            }
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {t.icon}
                            </span>
                            <span>{t.label}</span>
                          </button>
                        )
                      })}
                    </div>

                    {tab === 'goals' &&
                      (goalsLoading ? (
                        <div className="h-40 rounded-2xl bg-surface-container-high animate-pulse" />
                      ) : goals.length === 0 ? (
                        <EmptyPanel
                          icon="flag"
                          title="No goals set yet"
                          description="Goals and milestones you agree on with your mentor will appear here."
                        />
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {goals.map((g, i) => (
                            <div
                              key={g.id ?? g.ID ?? i}
                              className="p-5 rounded-2xl bg-surface-container-lowest shadow-sm"
                            >
                              <h4 className="font-title-md text-title-md text-on-surface font-bold">
                                {g.title ?? g.Title ?? 'Goal'}
                              </h4>
                              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                                {g.description ?? g.Description ?? ''}
                              </p>
                              <span className="inline-block mt-3 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-label-sm font-label-sm capitalize">
                                {g.status ?? g.Status ?? 'pending'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ))}

                    {tab === 'sessions' &&
                      (sessionsLoading ? (
                        <div className="h-40 rounded-2xl bg-surface-container-high animate-pulse" />
                      ) : sessions.length === 0 ? (
                        <EmptyPanel
                          icon="forum"
                          title="No sessions yet"
                          description="Your 1:1 sessions and their takeaways will show up here once they are scheduled."
                        />
                      ) : (
                        <div className="flex flex-col gap-4">
                          {sessions.map((s, i) => (
                            <div
                              key={s.id ?? s.ID ?? i}
                              className="p-5 rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                            >
                              <div className="flex flex-col">
                                <span className="font-label-sm text-label-sm text-on-surface-variant">
                                  {s.scheduled_at ?? s.ScheduledAt
                                    ? formatDate(
                                          s.scheduled_at ?? s.ScheduledAt ?? null,
                                        )
                                    : 'Session'}
                                </span>
                                <span className="font-title-md text-title-md text-on-surface font-semibold capitalize">
                                  {s.status ?? s.Status ?? 'scheduled'}
                                </span>
                              </div>
                              {typeof (s.duration_min ?? s.DurationMin) ===
                                'number' && (
                                <span className="text-label-sm text-label-sm text-on-surface-variant">
                                  {s.duration_min ?? s.DurationMin} mins
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}

                    {tab === 'resources' && (
                      <EmptyPanel
                        icon="folder_special"
                        title="No shared resources yet"
                        description="Documents, RFCs, and artefacts shared between you and your mentor will appear here."
                      />
                    )}
                  </div>
                </div>
              )}

              <section id="featured" className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
                  <div>
                    <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-widest bg-surface-container-high px-4 py-1.5 rounded-full">
                      Sovereign Directory
                    </span>
                    <h2 className="font-headline-lg text-headline-lg text-on-surface mt-3">
                      Featured Mentors
                    </h2>
                    <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">
                      Learn from senior women navigating the frontier of African
                      and global tech.
                    </p>
                  </div>
                  <Link
                    to="/mentors"
                    className="font-label-md text-label-md text-primary font-bold hover:underline flex items-center gap-1"
                  >
                    Explore All Mentors
                    <span className="material-symbols-outlined text-[18px]">
                      arrow_forward
                    </span>
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {featuredMentors.map((mentor) => (
                    <div
                      key={mentor.name}
                      className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <InitialsAvatar
                          initials={mentor.initials}
                          accent={mentor.accent}
                          className="w-16 h-16 rounded-2xl text-title-md"
                        />
                        <div className="flex-1">
                          <h3 className="font-headline-sm text-title-md text-on-surface font-bold">
                            {mentor.name}
                          </h3>
                          <p className="font-body-sm text-body-sm text-primary font-semibold leading-snug">
                            {mentor.role}
                          </p>
                        </div>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mb-6 leading-normal">
                        {mentor.detail}
                      </p>
                      <Link
                        to="/mentors"
                        className="font-label-sm text-label-sm bg-primary text-on-primary px-4 py-2 rounded-full font-bold hover:bg-primary-container transition-colors text-center"
                      >
                        View Profile
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}