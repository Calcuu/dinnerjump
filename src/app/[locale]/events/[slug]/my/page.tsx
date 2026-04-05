import { notFound, redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { InvitationForm } from '@/components/invitation-form'

export default async function MyEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const t = await getTranslations('registration')
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: event } = await supabase.from('events').select('*').eq('slug', slug).single()
  if (!event) notFound()

  const { data: duo } = await supabase.from('duos').select('*').eq('event_id', event.id)
    .or(`person1_id.eq.${user.id},person2_id.eq.${user.id}`).neq('status', 'cancelled').single()
  if (!duo) redirect(`/events/${slug}`)

  const { count: sentCount } = await supabase.from('invitations').select('*', { count: 'exact', head: true }).eq('invited_by_duo_id', duo.id)

  const isOrganizer = event.organizer_id === user.id
  const canInvite = event.invitation_policy === 'participants_allowed' || isOrganizer

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">{event.title}</h1>
      <div className="mb-6 rounded-lg border p-4">
        <p className="font-medium">
          {duo.status === 'confirmed' && t('confirmed')}
          {duo.status === 'waitlisted' && t('waitlisted', { count: 0 })}
          {duo.status === 'registered' && t('registered')}
        </p>
      </div>
      {canInvite && (
        <div className="mt-8">
          <InvitationForm eventId={event.id} duoId={duo.id} sentCount={sentCount ?? 0} isOrganizer={isOrganizer} />
        </div>
      )}
    </div>
  )
}
