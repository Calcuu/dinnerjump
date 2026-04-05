'use server'

import { createClient } from '@/lib/supabase/server'
import { resend } from '@/lib/resend'
import { nanoid } from 'nanoid'

type SendInvitationInput = {
  eventId: string
  duoId: string
  inviteeName: string
  inviteeEmail: string
  personalMessage?: string
}

export async function sendInvitation(input: SendInvitationInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: duo } = await supabase.from('duos').select('id, is_organizer_duo, event_id')
    .eq('id', input.duoId).or(`person1_id.eq.${user.id},person2_id.eq.${user.id}`).single()
  if (!duo) return { error: 'Duo not found' }

  const { data: event } = await supabase.from('events').select('invitation_policy, organizer_id, title, slug')
    .eq('id', input.eventId).single()
  if (!event) return { error: 'Event not found' }

  if (event.invitation_policy === 'organizer_only' && event.organizer_id !== user.id) {
    return { error: 'Only the organizer can send invitations' }
  }

  const refCode = nanoid(10)

  const { error: insertError } = await supabase.from('invitations').insert({
    event_id: input.eventId, invited_by_duo_id: input.duoId,
    invitee_name: input.inviteeName, invitee_email: input.inviteeEmail,
    personal_message: input.personalMessage || null, ref_code: refCode,
  })

  if (insertError) {
    if (insertError.message.includes('Maximum 5')) return { error: 'limit_reached' }
    return { error: insertError.message }
  }

  const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).single()
  const inviterName = profile?.display_name ?? 'Iemand'
  const eventUrl = `${process.env.NEXT_PUBLIC_APP_URL}/events/${event.slug}?ref=${refCode}`

  await resend.emails.send({
    from: 'Dinner Jump <noreply@dinnerjump.nl>',
    to: input.inviteeEmail,
    subject: `${inviterName} denkt dat Dinner Jump iets voor jou is`,
    text: [
      `Hoi ${input.inviteeName},`,
      '', `${inviterName} nodigt je uit voor ${event.title} — een Dinner Jump event!`,
      input.personalMessage ? `\n"${input.personalMessage}"\n` : '',
      `Bekijk het event en schrijf je in: ${eventUrl}`,
    ].join('\n'),
  })

  return { success: true }
}
