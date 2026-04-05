'use server'

import { createClient } from '@/lib/supabase/server'
import { isWithinRadius } from '@/lib/geo'

type RegisterDuoInput = {
  eventId: string
  partnerName: string
  partnerEmail: string
  addressLine: string
  city: string
  postalCode: string
  country: string
  lat: number
  lng: number
}

export async function registerDuo(input: RegisterDuoInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: event } = await supabase
    .from('events')
    .select('center_lat, center_lng, radius_km, registration_deadline, status')
    .eq('id', input.eventId)
    .single()

  if (!event) return { error: 'Event not found' }
  if (new Date(event.registration_deadline) <= new Date()) return { error: 'Registration is closed' }
  if (!isWithinRadius(event.center_lat, event.center_lng, input.lat, input.lng, event.radius_km)) return { error: 'outside_radius' }

  const { data: existingDuo } = await supabase
    .from('duos')
    .select('id')
    .eq('event_id', input.eventId)
    .eq('person1_id', user.id)
    .neq('status', 'cancelled')
    .single()

  if (existingDuo) return { error: 'Already registered' }

  const { data: duo, error } = await supabase
    .from('duos')
    .insert({
      event_id: input.eventId,
      person1_id: user.id,
      address_line: input.addressLine,
      city: input.city,
      postal_code: input.postalCode,
      country: input.country,
      lat: input.lat,
      lng: input.lng,
      status: 'pending_payment',
    })
    .select()
    .single()

  if (error) return { error: error.message }
  return { duoId: duo.id }
}
