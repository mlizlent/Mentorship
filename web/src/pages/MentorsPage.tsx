import { EmptyState } from '@/components/ui/avatar'

export default function MentorsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-ink">Find a Mentor</h2>
      <div className="flex gap-2 mb-6">
        <input type="text" placeholder="Search by expertise, bio..." className="px-3 py-2 border border-neutral-300 rounded-md w-full" />
        <select className="px-3 py-2 border border-neutral-300 rounded-md"><option>All counties</option></select>
        <select className="px-3 py-2 border border-neutral-300 rounded-md"><option>All languages</option></select>
      </div>
      <EmptyState title="No mentors found" description="Try adjusting your filters." />
    </div>
  )
}
