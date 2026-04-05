import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { Event } from '@/lib/types'

type Props = { event: Event & { confirmed_count: number; total_count: number } }

export function EventCard({ event }: Props) {
  const t = useTranslations('events')
  return (
    <Link href={`/events/${event.slug}`} className="block rounded-lg border p-4 hover:border-black transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{event.title}</h3>
          <p className="text-sm text-gray-500">{new Date(event.event_date).toLocaleDateString()} — {event.center_address}</p>
        </div>
        {event.type === 'closed' && (
          <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">{t('byInvitation')}</span>
        )}
      </div>
      <div className="mt-3 text-sm text-gray-600">{t('duosConfirmed', { count: event.confirmed_count })}</div>
    </Link>
  )
}
