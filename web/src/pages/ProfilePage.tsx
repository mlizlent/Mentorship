import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/api'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { EmptyState } from '@/components/ui/avatar'
import { ToastContainer, toast } from 'react-toastify'

type User = {
  id: string
  email: string
  role: string
  full_name: string
  county: string
  language: string
  status: string
}

export default function ProfilePage() {
  const { data, isLoading, error } = useQuery<User | null>({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await apiClient.get<{ user: User }>('/me')
      return res.data.user
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-ink">My Profile</h2>
        <p className="text-neutral-600">Loading profile...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-ink">My Profile</h2>
        <p className="text-red-600">Failed to load profile.</p>
      </div>
    )
  }

  const user = data
  if (!user) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-ink">My Profile</h2>
        <p className="text-neutral-600">No profile data available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ToastContainer />
      <h2 className="text-2xl font-bold text-ink">My Profile</h2>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">Full Name</label>
            <p className="text-ink">{user.full_name}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">Email</label>
            <p className="text-ink">{user.email}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">Role</label>
            <Badge>{user.role}</Badge>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">County</label>
            <Input defaultValue={user.county} className="w-full" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">Language</label>
            <Select className="w-full" defaultValue={user.language}>
              <option value="en">English</option>
              <option value="sw">Kiswahili</option>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">Status</label>
            <p className="text-ink">{user.status}</p>
          </div>
        </div>

        <Button onClick={() => {}} className="w-full mt-4">
          Save Changes
        </Button>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-ink mb-4">Blocked Users</h3>
        <div className="space-y-2">
          <p className="text-sm text-neutral-500">
            Manage users you have blocked. Blocked users cannot interact with you.
          </p>
          <EmptyState title="No blocked users" description="You haven't blocked anyone yet." />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-ink mb-4">Report a User</h3>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast.info('Report submitted') }}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">Target User ID</label>
            <Input placeholder="Enter user ID to report" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">Reason</label>
            <textarea
              className="w-full p-2 border border-neutral-300 rounded-md"
              rows={4}
              placeholder="Describe the issue..."
            />
          </div>
          <Button type="submit" className="w-full">
            Submit Report
          </Button>
        </form>
      </Card>
    </div>
  )
}
