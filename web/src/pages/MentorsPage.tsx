import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/api'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { InitialsAvatar } from '@/components/ui/initials-avatar'
import { merolineProfile } from '@/data/featuredMentors'
import { toast } from 'react-toastify'

type Mentor = {
  id?: string
  user_id?: string
  full_name: string
  email?: string
  county?: string
  bio?: string
  expertise?: string[]
  years_experience?: number
  hours_per_month?: number
  languages?: string[]
  max_mentees?: number
  verified_at?: string | null
  verified_by?: string | null
  status?: string
  active_mentees?: number
  photo?: string
}

const merolineMentor: Mentor = {
  id: merolineProfile.id,
  full_name: merolineProfile.name,
  county: merolineProfile.location,
  bio: merolineProfile.about,
  expertise: merolineProfile.expertise,
  hours_per_month: 20,
  languages: merolineProfile.languages,
  photo: merolineProfile.photo,
}

export default function MentorsPage() {
  const [search, setSearch] = useState('')
  const [countyFilter, setCountyFilter] = useState('All counties')
  const [languageFilter, setLanguageFilter] = useState('All languages')
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null)
  const [requestNote, setRequestNote] = useState('')
  const [sentRequests, setSentRequests] = useState<Record<string, boolean>>({})

  const { data, isLoading } = useQuery<{ data: Mentor[] }>({
    queryKey: ['mentors'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<{ data: Mentor[] }>('/mentors')
        return res.data
      } catch {
        return { data: [] }
      }
    },
  })

  const rawMentors = useMemo(() => data?.data || [], [data])

  const mentors = useMemo(() => {
    const apiMentors = rawMentors.filter(
      (m) =>
        m.id !== merolineMentor.id &&
        m.full_name.toLowerCase() !== merolineMentor.full_name.toLowerCase()
    )

    return [merolineMentor, ...apiMentors].filter((m) => {
      if (countyFilter !== 'All counties' && m.county !== countyFilter) {
        return false
      }
      if (languageFilter !== 'All languages') {
        const langs = m.languages || []
        if (!langs.some((l) => l.toLowerCase() === languageFilter.toLowerCase())) {
          return false
        }
      }
      if (search.trim() !== '') {
        const term = search.toLowerCase()
        const nameMatch = m.full_name.toLowerCase().includes(term)
        const bioMatch = (m.bio || '').toLowerCase().includes(term)
        const countyMatch = (m.county || '').toLowerCase().includes(term)
        const skillMatch = (m.expertise || []).some((e) => e.toLowerCase().includes(term))
        if (!nameMatch && !bioMatch && !countyMatch && !skillMatch) {
          return false
        }
      }
      return true
    })
  }, [rawMentors, search, countyFilter, languageFilter])

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMentor) return
    const mentorId = selectedMentor.id || selectedMentor.user_id || ''

    if (mentorId === merolineProfile.id) {
      toast.info(
        'This is a featured profile preview. Pick a verified mentor from the directory to send a request.'
      )
      return
    }

    try {
      await apiClient.post('/mentorships', {
        mentor_id: mentorId,
        request_message: requestNote,
      })
      setSentRequests((prev) => ({ ...prev, [mentorId]: true }))
      toast.success(`Mentorship request sent to ${selectedMentor.full_name}!`)
      setSelectedMentor(null)
      setRequestNote('')
    } catch {
      toast.error('Could not send mentorship request. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-ink">Find a Mentor</h2>
          <p className="text-neutral-600">Loading verified mentors...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-56 bg-surface-container rounded-2xl animate-pulse" />
          <div className="h-56 bg-surface-container rounded-2xl animate-pulse" />
          <div className="h-56 bg-surface-container rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
            Mentor Directory
          </div>
          <h2 className="text-2xl font-bold text-ink">Find a Mentor</h2>
          <p className="text-neutral-600 text-sm mt-0.5">
            Connect directly with verified senior women tech leaders and request 1:1 mentorship.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search by expertise, name, bio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-outline-variant bg-surface-input rounded-xl w-full sm:w-60 text-sm"
          />
          <select
            value={countyFilter}
            onChange={(e) => setCountyFilter(e.target.value)}
            className="px-3 py-2 border border-outline-variant bg-surface-input rounded-xl text-sm"
          >
            <option>All counties</option>
            <option>Nairobi</option>
            <option>Mombasa</option>
            <option>Kisumu</option>
            <option>Nakuru</option>
            <option>Eldoret</option>
          </select>
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="px-3 py-2 border border-outline-variant bg-surface-input rounded-xl text-sm"
          >
            <option>All languages</option>
            <option>English</option>
            <option>Kiswahili</option>
          </select>
        </div>
      </div>

      {mentors.length === 0 ? (
        <EmptyState title="No mentors found" description="Try adjusting your filters or search keywords." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentors.map((m) => {
            const mentorId = m.id || m.user_id || m.full_name
            const isVerified = m.verified_at !== null || m.status === 'verified'
            const hasRequested = !!sentRequests[mentorId]
            const initials = m.full_name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()

            return (
              <Card key={mentorId} className="p-5 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-start gap-3.5 mb-3">
                    <Link
                      to={`/mentors/${mentorId}`}
                      className="flex items-start gap-3.5 group flex-1 min-w-0"
                      aria-label={`View ${m.full_name}'s profile`}
                    >
                      {m.photo ? (
                        <img
                          src={m.photo}
                          alt={`${m.full_name} portrait`}
                          className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-outline/40"
                        />
                      ) : (
                        <InitialsAvatar
                          initials={initials}
                          className="w-12 h-12 rounded-2xl bg-primary/10 text-primary font-bold text-sm shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="font-bold text-ink truncate text-base group-hover:text-primary transition-colors">
                            {m.full_name}
                          </h3>
                          <Badge variant={isVerified ? 'default' : 'secondary'} className="text-[10px] px-2 py-0.5">
                            {isVerified ? 'Verified' : 'Pending'}
                          </Badge>
                        </div>
                        <p className="text-xs text-primary font-medium mt-0.5">{m.county || 'Kenya'}</p>
                      </div>
                    </Link>
                  </div>

                  <p className="text-xs text-neutral-600 line-clamp-3 mb-3 leading-relaxed">
                    {m.bio || 'Experienced technology mentor dedicated to accelerating women in tech.'}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {(m.expertise || []).map((e) => (
                      <span
                        key={e}
                        className="px-2 py-0.5 rounded-full bg-surface-container text-xs text-on-surface-variant font-medium"
                      >
                        {e}
                      </span>
                    ))}
                  </div>

                  <Link
                    to={`/mentors/${mentorId}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline mb-4"
                  >
                    View profile
                  </Link>
                </div>

                <div>
                  <div className="text-[11px] text-neutral-500 mb-3 pt-2 border-t border-outline/30 flex items-center justify-between">
                    <span>
                      {m.years_experience ? `${m.years_experience}+ years experience` : 'Community mentor'}
                    </span>
                    <span>{m.hours_per_month || 15} hrs/month</span>
                  </div>

                  <Button
                    onClick={() => {
                      setSelectedMentor(m)
                      setRequestNote(
                        `Hi ${m.full_name}, I would love to connect with you for mentorship. I am eager to learn from your experience in ${(m.expertise || ['tech'])[0]}.`
                      )
                    }}
                    className={`w-full py-2.5 rounded-xl font-label-md text-label-md transition-all ${
                      hasRequested
                        ? 'bg-surface-container text-primary font-bold'
                        : 'bg-primary hover:bg-primary-700 text-white shadow-sm'
                    }`}
                  >
                    {hasRequested ? 'Request Sent' : 'Request Mentorship'}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* REQUEST MENTORSHIP MODAL */}
      {selectedMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-outline/50 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-ink">Request Mentorship</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Reach out to <span className="font-bold text-primary">{selectedMentor.full_name}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedMentor(null)}
                className="px-2 py-1 rounded-full text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-ink"
                aria-label="Close"
              >
                Close
              </button>
            </div>

            <div className="bg-surface-container-low p-3.5 rounded-2xl text-xs space-y-1">
              <p className="font-bold text-ink">{selectedMentor.full_name} • {selectedMentor.county}</p>
              <p className="text-on-surface-variant">
                Expertise: {(selectedMentor.expertise || []).join(', ')}
              </p>
            </div>

            <form onSubmit={handleSendRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">
                  Introduction &amp; Goals Note
                </label>
                <textarea
                  required
                  rows={4}
                  className="w-full p-3 border border-outline-variant bg-surface-input text-ink rounded-xl focus:ring-2 focus:ring-primary-600 text-sm leading-relaxed"
                  placeholder="Share a bit about your background and what you hope to achieve..."
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setSelectedMentor(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary-700 text-white">
                  Send Mentorship Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
