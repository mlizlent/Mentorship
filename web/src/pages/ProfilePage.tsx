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
  avatar_url?: string
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

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('avatar', file)
      await apiClient.post('/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => {
      toast.success('Profile picture updated')
      void queryClient.invalidateQueries({ queryKey: ['me'] })
    },
    onError: () => toast.error('Could not upload profile picture'),
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
          Manage your personal information and safety preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 rounded-2xl bg-surface-container-lowest border border-outline/40 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={`${user.full_name}'s avatar`}
                  className="w-16 h-16 rounded-2xl object-cover border border-outline/40"
                />
              ) : (
                <InitialsAvatar
                  initials={initials}
                  accent="bg-primary/10 text-primary"
                  className="w-16 h-16 rounded-2xl font-bold text-xl"
                />
              )}
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

            <div className="mt-4">
              <label className="block text-sm font-medium text-ink mb-1">Profile Picture</label>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                id="avatar-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadAvatar.mutate(file)
                }}
                disabled={uploadAvatar.isPending}
              />
              <label
                htmlFor="avatar-upload"
                className="inline-flex items-center gap-2 px-4 py-2 border border-outline-variant bg-surface-input text-ink rounded-md cursor-pointer hover:bg-surface-container-low transition-colors"
              >
                <span className="font-body-sm text-body-sm">
                  {uploadAvatar.isPending ? 'Uploading...' : 'Choose File'}
                </span>
              </label>
              <p className="text-xs text-on-surface-variant mt-1">JPG or PNG, max 2MB</p>
            </div>

            <Button
              onClick={() => updateProfile.mutate()}
              disabled={updateProfile.isPending}
              className="w-full mt-4"
            >
              {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}