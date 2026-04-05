import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { EventCard } from '@/components/event-card'

export default async function DiscoveryPage() {
  const t = await getTranslations('events')
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .in('status', ['registration_open', 'confirmed'])
    .gte('event_date', new Date().toISOString().split('T')[0])
    .order('event_date', { ascending: true })

  const eventsWithCounts = await Promise.all(
    (events ?? []).map(async (event) => {
      const { count: confirmed_count } = await supabase.from('duos').select('*', { count: 'exact', head: true }).eq('event_id', event.id).eq('status', 'confirmed')
      const { count: total_count } = await supabase.from('duos').select('*', { count: 'exact', head: true }).eq('event_id', event.id).in('status', ['registered', 'waitlisted', 'confirmed'])
      return { ...event, confirmed_count: confirmed_count ?? 0, total_count: total_count ?? 0 }
    })
  )

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t('discover')}</h1>
      <div className="flex flex-col gap-4">
        {eventsWithCounts.length === 0 && <p className="text-gray-500">Geen events gevonden.</p>}
        {eventsWithCounts.map((event) => <EventCard key={event.id} event={event} />)}
      </div>
    </div>
  )
}
