'use client'
import { useTranslations } from 'next-intl'
import type { WizardData } from './wizard'

type Props = { data: WizardData; onChange: (partial: Partial<WizardData>) => void }

// Generate time options in 15-minute intervals from 16:00 to 21:00
const TIME_OPTIONS: string[] = []
for (let h = 16; h <= 21; h++) {
  for (const m of [0, 15, 30, 45]) {
    TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }
}

export function StepDateTime({ data, onChange }: Props) {
  const t = useTranslations('wizard')
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium">{t('eventDate')}</label>
        <input type="date" value={data.eventDate} onChange={(e) => onChange({ eventDate: e.target.value })} className="w-full rounded border px-3 py-2" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">{t('startTime')}</label>
        <select
          value={data.startTime}
          onChange={(e) => onChange({ startTime: e.target.value })}
          className="w-full rounded border px-3 py-2"
        >
          {TIME_OPTIONS.map((time) => (
            <option key={time} value={time}>{time}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
