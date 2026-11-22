import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/services/api'
import { Card } from '@/components/ui/card'
import { InitialsAvatar } from '@/components/ui/initials-avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'react-toastify'

type User = {
  id?: string
  full_name: string
  email?: string
  county?: string
  language?: string
  role?: string
  status?: string
}

type Block = {
  blocked_id: string
  created_at: string
}

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const { data } = useQuery<{ user: User }>({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await apiClient.get<{ user: User }>('/me')
      return res.data
    },
  })

  const user = data?.user

  const [fullName, setFullName] = useState('')
  const [county, setCounty] = useState('')
  const [language, setLanguage] = useState('en')
  const [reportTargetId, setReportTargetId] = useState('')
  const [reportReason, setReportReason] = useState('')
  const [blockTargetId, setBlockTargetId] = useState('')

  useEffect(() => {
    if (!user) return
    setFullName(user.full_name || '')
    setCounty(user.county || '')
    setLanguage(user.language || 'en')
  }, [user])

  const updateProfile = useMutation({
    mutationFn: async () => {
      await apiClient.put('/me', {
        full_name: fullName.trim(),
        county: county.trim(),
        language,
      })
    },
    onSuccess: () => {
      toast.success('Profile updated successfully')
      void queryClient.invalidateQueries({ queryKey: ['me'] })
    },
    onError: () => toast.error('Could not update your profile'),
  })

  const reportUser = useMutation({
    mutationFn: async () => {
      await apiClient.post('/me/reports', {
        target_user_id: reportTargetId.trim(),
        reason: reportReason.trim(),
      })
    },
    onSuccess: () => {
      toast.success('Report submitted')
      setReportTargetId('')
      setReportReason('')
    },
    onError: () => toast.error('Could not submit report'),
  })

  const {
    data: blocksData,
    refetch: refetchBlocks,
    isLoading: blocksLoading,
  } = useQuery<{ data: Block[] }>({
    queryKey: ['blocks'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Block[] }>('/me/blocks')
      return res.data
    },
  })

  const blocks = blocksData?.data ?? []

  const blockUser = useMutation({
    mutationFn: async () => {
      await apiClient.post('/me/blocks', { blocked_id: blockTargetId.trim() })
    },
    onSuccess: () => {
      toast.success('User blocked')
      setBlockTargetId('')
      void refetchBlocks()
    },
    onError: () => toast.error('Could not block user'),
  })

  const unblockUser = useMutation({
    mutationFn: async (blockedId: string) => {
      await apiClient.delete(`/me/blocks/${blockedId}`)
    },
    onSuccess: () => {
      toast.success('User unblocked')
      void refetchBlocks()
    },
    onError: () => toast.error('Could not unblock user'),
  })

  const initials =
    user?.full_name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline-md text-headline-md text-ink font-bold">My Profile</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Manage your personal information, safety preferences, and blocked users.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 rounded-2xl bg-surface-container-lowest border border-outline/40 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <InitialsAvatar
                initials={initials}
                accent="bg-primary/10 text-primary"
                className="w-16 h-16 rounded-2xl font-bold text-xl"
              />
              <div>
                <h2 className="font-headline-sm text-headline-sm text-ink font-bold">
                  {user?.full_name || 'Your profile'}
                </h2>
                <p className="text-sm text-on-surface-variant">
                  {user?.email} · <span className="capitalize">{user?.role}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Full Name</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant bg-surface-input text-ink rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">County</label>
                <Input
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant bg-surface-input text-ink rounded-md"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-ink mb-1">Preferred Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant bg-surface-input text-ink rounded-md"
                >
                  <option value="en">English</option>
                  <option value="sw">Swahili</option>
                </select>
              </div>
            </div>

            <Button
              onClick={() => updateProfile.mutate()}
              disabled={updateProfile.isPending}
              className="w-full mt-4"
            >
              {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </Card>

          <Card className="p-6 rounded-2xl bg-surface-container-lowest border border-outline/40 shadow-sm">
            <h2 className="font-headline-sm text-headline-sm text-ink font-bold mb-2">Safety &amp; Support</h2>
            <p className="text-sm text-on-surface-variant mb-4">
              Block users or report behavior that violates our community code of conduct.
            </p>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                reportUser.mutate()
              }}
            >
              <div>
                <label className="block text-sm font-medium text-ink mb-1">User ID to report</label>
                <Input
                  required
                  value={reportTargetId}
                  onChange={(e) => setReportTargetId(e.target.value)}
                  placeholder="User UUID"
                  className="w-full px-3 py-2 border border-outline-variant bg-surface-input text-ink rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Reason</label>
                <textarea
                  required
                  minLength={5}
                  rows={3}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Describe the incident..."
                  className="w-full px-3 py-2 border border-outline-variant bg-surface-input text-ink rounded-md"
                />
              </div>
              <Button type="submit" disabled={reportUser.isPending}>
                {reportUser.isPending ? 'Submitting...' : 'Submit Report'}
              </Button>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 rounded-2xl bg-surface-container-lowest border border-outline/40 shadow-sm">
            <h3 className="font-headline-xs text-headline-xs text-ink font-bold mb-3">Account Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Role</span>
                <span className="text-ink capitalize">{user?.role || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Status</span>
                <span className="text-ink capitalize">{user?.status || 'active'}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-2xl bg-surface-container-lowest border border-outline/40 shadow-sm">
            <h3 className="font-headline-xs text-headline-xs text-ink font-bold mb-2">Blocked Users</h3>
            <p className="text-xs text-on-surface-variant mb-3">
              Blocked users cannot message or request mentorship from you.
            </p>

            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={blockTargetId}
                  onChange={(e) => setBlockTargetId(e.target.value)}
                  placeholder="User UUID"
                  className="flex-1 min-w-0 px-3 py-2 border border-outline-variant bg-surface-input text-ink rounded-md text-sm"
                />
                <Button
                  type="button"
                  onClick={() => blockUser.mutate()}
                  disabled={blockUser.isPending}
                  className="shrink-0"
                >
                  Block
                </Button>
              </div>

              {blocksLoading ? (
                <p className="text-xs text-on-surface-variant">Loading blocked users...</p>
              ) : blocks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-outline-variant/60 bg-surface-container-low p-4 text-center">
                  <p className="text-sm text-on-surface-variant">No users blocked.</p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Blocked users will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {blocks.map((block) => (
                    <div
                      key={block.blocked_id}
                      className="flex items-center justify-between gap-2 rounded-xl bg-surface-container-low px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-ink truncate">{block.blocked_id}</p>
                        <p className="text-[11px] text-on-surface-variant">
                          Blocked {new Date(block.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => unblockUser.mutate(block.blocked_id)}
                        disabled={unblockUser.isPending}
                        className="shrink-0 text-xs font-bold text-primary hover:underline"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}