'use client'
import { useTranslations } from 'next-intl'
import type { WizardData } from './wizard'

type Props = { data: WizardData; onChange: (partial: Partial<WizardData>) => void }

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
        <input type="time" step={900} value={data.startTime} onChange={(e) => onChange({ startTime: e.target.value })} className="w-full rounded border px-3 py-2" />
      </div>
    </div>
  )
}
