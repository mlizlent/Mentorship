import { EmptyState } from '@/components/ui/avatar'

export default function MentorshipsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-ink">My Mentorships</h2>
      <EmptyState title="No mentorships yet" description="Find a mentor and send a request to get started." />
    </div>
  )
}
