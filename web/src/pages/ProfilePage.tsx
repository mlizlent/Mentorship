import { EmptyState } from '@/components/ui/avatar'

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-ink">My Profile</h2>
      <EmptyState title="Profile" description="Edit your profile information." />
    </div>
  )
}
