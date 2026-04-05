import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Thermometer } from '@/components/thermometer'
import { CountdownTimer } from '@/components/countdown-timer'
import { Link } from '@/i18n/navigation'

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const t = await getTranslations('events')
  const supabase = await createClient()

  const { data: event } = await supabase.from('events').select('*').eq('slug', slug).single()
  if (!event) notFound()

  const { count: totalDuos } = await supabase.from('duos').select('*', { count: 'exact', head: true }).eq('event_id', event.id).in('status', ['registered', 'waitlisted', 'confirmed'])
  const { count: confirmedDuos } = await supabase.from('duos').select('*', { count: 'exact', head: true }).eq('event_id', event.id).eq('status', 'confirmed')

  const isOpen = new Date(event.registration_deadline) > new Date()

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        {event.type === 'closed' && (
          <span className="mb-2 inline-block rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">{t('byInvitation')}</span>
        )}
        <h1 className="text-3xl font-bold">{event.title}</h1>
        {event.description && <p className="mt-2 text-gray-600">{event.description}</p>}
      </div>
      <div className="mb-6 flex flex-col gap-2 text-sm">
        <p>{new Date(event.event_date).toLocaleDateString()}</p>
        <p>{t('startTime', { time: event.start_time.slice(0, 5) })}</p>
        <p>{t('travelTime', { minutes: event.travel_time_minutes })}</p>
        <p>{event.center_address} ({event.radius_km} km radius)</p>
      </div>
      <div className="mb-6"><Thermometer totalPaidDuos={totalDuos ?? 0} confirmedDuos={confirmedDuos ?? 0} /></div>
      <div className="mb-6"><CountdownTimer deadline={event.registration_deadline} /></div>
      {isOpen && event.type === 'open' && (
        <Link href={`/events/${event.slug}/register`} className="inline-block rounded bg-black px-6 py-3 text-white hover:bg-gray-800">{t('registerButton')}</Link>
      )}
      {isOpen && event.type === 'closed' && <p className="text-sm text-gray-500">{t('byInvitation')}</p>}
      {!isOpen && <p className="text-sm text-gray-500">{t('registrationClosed')}</p>}
    </div>
  )
}
