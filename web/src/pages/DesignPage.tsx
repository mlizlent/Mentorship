import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function DesignPage() {
  const [tab, setTab] = useState('architecture')

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-ink">System Design</h2>
      <p className="text-neutral-600">
        Architecture, data model, API design, and security for Malkia Mentor.
      </p>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="architecture" onValueChange={setTab}>Architecture</TabsTrigger>
          <TabsTrigger value="data-model" onValueChange={setTab}>Data Model</TabsTrigger>
          <TabsTrigger value="api" onValueChange={setTab}>API Design</TabsTrigger>
          <TabsTrigger value="security" onValueChange={setTab}>Security</TabsTrigger>
        </TabsList>

        <TabsContent value="architecture" className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold text-ink mb-2">Monorepo</h3>
            <p className="text-neutral-600 text-sm">
              Single repo: Go backend in <code className="font-mono text-xs">api/</code>, React frontend
              in <code className="font-mono text-xs">web/</code>. Single CI pipeline.
            </p>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold text-ink mb-2">Database access</h3>
            <p className="text-neutral-600 text-sm">
              Direct <code className="font-mono text-xs">pgx</code> access (no sqlc). Typed query methods
              in <code className="font-mono text-xs">api/internal/db/queries.go</code>.
            </p>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold text-ink mb-2">Auth</h3>
            <p className="text-neutral-600 text-sm">
              JWT subject = user ID only. Role loaded from DB per request. Access token in HTTP-only
              cookie (path <code className="font-mono text-xs">/</code>), refresh token in HTTP-only
              cookie (path <code className="font-mono text-xs">/auth/refresh</code>).
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="data-model" className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold text-ink mb-2">Core tables</h3>
            <ul className="text-neutral-600 text-sm space-y-1 list-disc list-inside">
              <li>users (id, email, role, full_name, date_of_birth, county, language, status)</li>
              <li>mentor_profiles (user_id, bio, expertise, years_experience, verified_at)</li>
              <li>mentee_profiles</li>
              <li>mentorships (mentor_id, mentee_id, status)</li>
              <li>sessions (mentorship_id, scheduled_at, duration_min)</li>
              <li>goals (mentorship_id, title, target_date, status)</li>
              <li>reports (reporter_id, target_user_id, reason, status)</li>
              <li>user_blocks (blocker_id, blocked_id)</li>
              <li>admin_access_log</li>
              <li>notifications_outbox</li>
            </ul>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold text-ink mb-2">Auth</h3>
            <ul className="text-neutral-600 text-sm space-y-1 list-disc list-inside">
              <li>POST /api/v1/auth/register</li>
              <li>POST /api/v1/auth/login</li>
              <li>POST /api/v1/auth/refresh</li>
              <li>POST /api/v1/auth/logout</li>
            </ul>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold text-ink mb-2">User</h3>
            <ul className="text-neutral-600 text-sm space-y-1 list-disc list-inside">
              <li>GET /api/v1/me</li>
              <li>PUT /api/v1/me</li>
              <li>GET /api/v1/me/blocks</li>
              <li>POST /api/v1/me/blocks</li>
              <li>DELETE /api/v1/me/blocks/:id</li>
              <li>POST /api/v1/me/reports</li>
            </ul>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold text-ink mb-2">Admin</h3>
            <ul className="text-neutral-600 text-sm space-y-1 list-disc list-inside">
              <li>GET /api/v1/admin/mentors</li>
              <li>PATCH /api/v1/admin/mentors/:id/verify</li>
              <li>GET /api/v1/admin/reports</li>
              <li>PATCH /api/v1/admin/reports/:id</li>
              <li>GET /api/v1/admin/metrics</li>
              <li>GET /api/v1/admin/metrics/export.csv</li>
            </ul>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold text-ink mb-2">Access control</h3>
            <ul className="text-neutral-600 text-sm space-y-1 list-disc list-inside">
              <li>Role-based admin middleware (loads role from DB)</li>
              <li>Block list prevents interaction between users</li>
              <li>Admin access log records reads of personal data</li>
              <li>Self-block and self-report are rejected</li>
            </ul>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
