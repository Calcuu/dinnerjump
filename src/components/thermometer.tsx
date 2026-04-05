'use client'

import { useTranslations } from 'next-intl'
import { computeWaitlistInfo } from '@/lib/waitlist'

type Props = { totalPaidDuos: number; confirmedDuos: number }

export function Thermometer({ totalPaidDuos, confirmedDuos }: Props) {
  const t = useTranslations('thermometer')
  const info = computeWaitlistInfo(totalPaidDuos)
  const progress = totalPaidDuos < 9 ? (totalPaidDuos / 9) * 100 : 100

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-2 flex justify-between text-sm">
        <span className="font-medium">{confirmedDuos} duo's bevestigd</span>
        <span className="text-gray-500">{t('minimum')}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
        <div className="h-full rounded-full bg-black transition-all duration-500" style={{ width: `${Math.min(progress, 100)}%` }} />
      </div>
      <p className="mt-2 text-sm text-gray-600">
        {info.phase === 'confirmed' && t('confirmed')}
        {info.phase === 'minimum' && t('waitingForMinimum', { count: info.duosNeeded })}
        {info.phase === 'waitlist' && t('nextTable', { count: info.duosNeeded })}
      </p>
    </div>
  )
}
