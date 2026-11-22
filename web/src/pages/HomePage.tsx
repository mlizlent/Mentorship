import { EmptyState } from '@/components/ui/avatar'

export default function HomePage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-ink">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-low p-6 rounded-lg border border-outline-variant shadow-sm">
          <h3 className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">Upcoming Sessions</h3>
          <p className="text-2xl font-bold text-ink mt-2">0</p>
        </div>
        <div className="bg-surface-container-low p-6 rounded-lg border border-outline-variant shadow-sm">
          <h3 className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">Open Goals</h3>
          <p className="text-2xl font-bold text-ink mt-2">0</p>
        </div>
        <div className="bg-surface-container-low p-6 rounded-lg border border-outline-variant shadow-sm">
          <h3 className="text-sm font-medium text-on-surface-variant uppercase tracking-wider">Pending Requests</h3>
          <p className="text-2xl font-bold text-ink mt-2">0</p>
        </div>
      </div>
      <EmptyState title="No activity yet" description="Start by finding a mentor or exploring suggested matches." />
    </div>
  )
}
