'use server'

import { createClient } from '@/lib/supabase/server'
import { generateInviteCode } from '@/lib/invite-code'
import { generateEventSlug } from '@/lib/slug'

type CreateEventInput = {
  title: string
  description?: string
  eventDate: string
  startTime: string
  travelTimeMinutes: 15 | 30 | 45
  centerAddress: string
  centerLat: number
  centerLng: number
  radiusKm: number
  type: 'open' | 'closed'
  invitationPolicy: 'organizer_only' | 'participants_allowed'
  afterpartyName?: string
  afterpartyAddress?: string
  afterpartyLat?: number
  afterpartyLng?: number
  welcomeCardEnabled: boolean
}

export async function createEvent(input: CreateEventInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const slug = generateEventSlug(input.title)
  const inviteCode = generateInviteCode()

  const eventDate = new Date(input.eventDate)
  const deadline = new Date(eventDate)
  deadline.setDate(deadline.getDate() - 7)

  const { data: event, error } = await supabase
    .from('events')
    .insert({
      organizer_id: user.id,
      title: input.title,
      description: input.description || null,
      slug,
      event_date: input.eventDate,
      start_time: input.startTime,
      travel_time_minutes: input.travelTimeMinutes,
      center_address: input.centerAddress,
      center_lat: input.centerLat,
      center_lng: input.centerLng,
      radius_km: input.radiusKm,
      type: input.type,
      status: 'registration_open',
      invite_code: inviteCode,
      invitation_policy: input.invitationPolicy,
      afterparty_address: input.afterpartyName && input.afterpartyAddress
        ? `${input.afterpartyName} — ${input.afterpartyAddress}`
        : input.afterpartyAddress || input.afterpartyName || null,
      afterparty_lat: input.afterpartyLat || null,
      afterparty_lng: input.afterpartyLng || null,
      welcome_card_enabled: input.welcomeCardEnabled,
      registration_deadline: deadline.toISOString(),
    })
    .select()
    .single()

  if (error) return { error: error.message }
  return { event }
}
