import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/api'
import { merolineProfile } from '@/data/featuredMentors'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Mentor = {
  id?: string
  full_name: string
  bio?: string
  expertise?: string[]
  years_experience?: number
  county?: string
  languages?: string[]
  hours_per_month?: number
  max_mentees?: number
  active_mentees?: number
  verified?: boolean
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function SectionCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <Card className="p-6 rounded-2xl bg-surface-container-lowest border border-outline/40 shadow-sm">
      <h2 className="font-headline-sm text-headline-sm text-ink font-bold mb-3">{title}</h2>
      {children}
    </Card>
  )
}

function MerolineProfile() {
  const profile = merolineProfile

  return (
    <div className="space-y-6">
      <Link
        to="/mentors"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <span aria-hidden="true">←</span> Back to mentors
      </Link>

      <Card className="overflow-hidden rounded-3xl bg-surface-container-lowest border border-outline/40 shadow-sm">
        <div className="bg-gradient-to-br from-primary/10 via-surface-container to-surface-container-high px-6 sm:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            {profile.photo ? (
              <img
                src={profile.photo}
                alt={`${profile.name} portrait`}
                className="w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-3xl object-cover border-4 border-surface-container-lowest shadow-md shrink-0"
              />
            ) : (
              <div className="w-28 h-28 rounded-3xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-2xl shrink-0">
                {profile.initials}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="font-headline-md text-headline-md sm:text-headline-lg sm:leading-tight text-ink font-extrabold tracking-tight">
                  {profile.name}
                </h1>
                <Badge variant="default" className="text-[10px] px-2 py-0.5">
                  Verified
                </Badge>
              </div>
              <p className="font-body-md text-body-md text-primary font-semibold">
                {profile.role}
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                {profile.location}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-outline/30">
          <div className="flex flex-wrap gap-1.5">
            {profile.expertise?.map((item) => (
              <span
                key={item}
                className="px-2.5 py-1 rounded-full bg-surface-container text-xs text-on-surface-variant font-medium"
              >
                {item}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to="/mentors"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-primary hover:bg-primary-700 text-white font-label-md text-label-md shadow-sm transition-all"
            >
              Request Mentorship
            </Link>
            <Link
              to="/mentors"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-surface-container-low hover:bg-surface-container-high text-ink font-label-md text-label-md transition-all"
            >
              All Mentors
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="About me">
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              {profile.about}
            </p>
          </SectionCard>

          <SectionCard title="I can help you with">
            <ul className="space-y-2.5">
              {profile.helpTopics?.map((topic) => (
                <li key={topic} className="flex items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold shrink-0"
                  >
                    ✓
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface leading-relaxed">
                    {topic}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SectionCard title="My mentoring style">
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                {profile.mentoringStyle}
              </p>
            </SectionCard>

            <SectionCard title="Best for mentees who">
              <ul className="space-y-2.5">
                {profile.bestFor?.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0"
                    />
                    <span className="font-body-sm text-body-sm text-on-surface leading-relaxed">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          </div>
        </div>

        <div className="space-y-6">
          <SectionCard title="Availability">
            <p className="font-body-sm text-body-sm text-on-surface leading-relaxed">
              {profile.availability}
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
              We'll agree on days and times that work for both of us.
            </p>
          </SectionCard>

          <SectionCard title="Languages">
            <div className="flex flex-wrap gap-1.5">
              {profile.languages?.map((language) => (
                <span
                  key={language}
                  className="px-2.5 py-1 rounded-full bg-surface-container text-xs text-on-surface-variant font-medium"
                >
                  {language}
                </span>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Links">
            <div className="flex flex-col gap-2">
              {profile.links?.map((link) => {
                const content = (
                  <>
                    <span className="font-label-md text-label-md text-ink font-semibold">
                      {link.label}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                      {link.handle}
                    </span>
                  </>
                )

                return link.url ? (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors"
                  >
                    {content}
                  </a>
                ) : (
                  <div
                    key={link.label}
                    className="flex flex-col p-3 rounded-xl bg-surface-container-low"
                  >
                    {content}
                  </div>
                )
              })}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

function MentorProfileFallback({ mentor }: { mentor: Mentor }) {
  return (
    <div className="space-y-6">
      <Link
        to="/mentors"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <span aria-hidden="true">←</span> Back to mentors
      </Link>

      <Card className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest border border-outline/40 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="w-24 h-24 rounded-3xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-2xl shrink-0">
            {initials(mentor.full_name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="font-headline-md text-headline-md text-ink font-extrabold tracking-tight">
                {mentor.full_name}
              </h1>
              <Badge variant={mentor.verified ? 'default' : 'secondary'} className="text-[10px] px-2 py-0.5">
                {mentor.verified ? 'Verified' : 'Pending'}
              </Badge>
            </div>
            <p className="font-body-sm text-body-sm text-primary font-semibold">
              {mentor.county || 'Kenya'}
            </p>
            {mentor.expertise && mentor.expertise.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {mentor.expertise.map((item) => (
                  <span
                    key={item}
                    className="px-2.5 py-1 rounded-full bg-surface-container text-xs text-on-surface-variant font-medium"
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="About">
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              {mentor.bio || 'Experienced technology mentor dedicated to accelerating women in tech.'}
            </p>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="At a glance">
            <dl className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <dt className="font-body-sm text-body-sm text-on-surface-variant">Experience</dt>
                <dd className="font-body-sm text-body-sm text-ink font-semibold">
                  {mentor.years_experience ? `${mentor.years_experience}+ years` : 'Not listed'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="font-body-sm text-body-sm text-on-surface-variant">Availability</dt>
                <dd className="font-body-sm text-body-sm text-ink font-semibold">
                  {mentor.hours_per_month ? `${mentor.hours_per_month} hrs/month` : 'Not listed'}
                </dd>
              </div>
            </dl>
          </SectionCard>

          {mentor.languages && mentor.languages.length > 0 && (
            <SectionCard title="Languages">
              <div className="flex flex-wrap gap-1.5">
                {mentor.languages.map((language) => (
                  <span
                    key={language}
                    className="px-2.5 py-1 rounded-full bg-surface-container text-xs text-on-surface-variant font-medium"
                  >
                    {language}
                  </span>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MentorDetailPage() {
  const { id } = useParams()
  const isMeroline = !id || id === merolineProfile.id || id === 'meroline'

  const { data, isLoading, isError } = useQuery<{ mentor: Mentor }>({
    queryKey: ['mentor', id],
    queryFn: async () => {
      const res = await apiClient.get<{ mentor: Mentor }>(`/mentors/${id}`)
      return res.data
    },
    enabled: !isMeroline && Boolean(id),
  })

  if (isMeroline) {
    return <MerolineProfile />
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-4 w-32 bg-surface-container rounded-full" />
        <div className="h-48 bg-surface-container rounded-3xl w-full" />
        <div className="h-64 bg-surface-container rounded-2xl w-full" />
      </div>
    )
  }

  if (isError || !data?.mentor) {
    return (
      <div className="space-y-6">
        <Link
          to="/mentors"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <span aria-hidden="true">←</span> Back to mentors
        </Link>
        <Card className="p-10 rounded-2xl bg-surface-container-lowest border border-outline/40 text-center">
          <h2 className="font-headline-sm text-headline-sm text-ink font-bold">Mentor not found</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            This mentor profile could not be loaded.
          </p>
        </Card>
      </div>
    )
  }

  return <MentorProfileFallback mentor={data.mentor} />
}