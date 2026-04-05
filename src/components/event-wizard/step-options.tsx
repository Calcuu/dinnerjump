'use client'
import { useTranslations } from 'next-intl'
import type { WizardData } from './wizard'

type Props = { data: WizardData; onChange: (partial: Partial<WizardData>) => void }

export function StepOptions({ data, onChange }: Props) {
  const t = useTranslations('wizard')
  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="mb-2 block text-sm font-medium">{t('afterpartyAddress')}</label>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={data.afterpartyName}
            onChange={(e) => onChange({ afterpartyName: e.target.value })}
            className="w-full rounded border px-3 py-2"
            placeholder={t('afterpartyNamePlaceholder')}
          />
          <input
            type="text"
            value={data.afterpartyAddress}
            onChange={(e) => onChange({ afterpartyAddress: e.target.value })}
            className="w-full rounded border px-3 py-2"
            placeholder={t('afterpartyAddressPlaceholder')}
          />
        </div>
        <p className="mt-1 text-xs text-gray-400">{t('afterpartyHelp')}</p>
      </div>
      <div className="opacity-50">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={false} disabled />
          {t('welcomeCard')}
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{t('welcomeCardComingSoon')}</span>
        </label>
        <p className="mt-1 text-xs text-gray-400">{t('welcomeCardHelp')}</p>
      </div>
    </div>
  )
}
