import { EmptyState } from '@/components/ui/avatar'

export default function MentorDetailPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-ink">Mentor Profile</h2>
      <EmptyState title="Mentor not found" description="The mentor profile could not be loaded." />
    </div>
  )
}
