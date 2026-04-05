'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { registerDuo } from '@/actions/duos'
import type { Event } from '@/lib/types'

type Props = { event: Event }

export function RegistrationForm({ event }: Props) {
  const t = useTranslations('registration')
  const locale = useLocale()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const address = formData.get('address') as string
    const city = formData.get('city') as string
    const postalCode = formData.get('postalCode') as string

    const geoRes = await fetch(`/api/geocode?address=${encodeURIComponent(`${address}, ${postalCode} ${city}`)}`)
    if (!geoRes.ok) { setError('Adres niet gevonden'); setLoading(false); return }
    const geo = await geoRes.json()

    const result = await registerDuo({
      eventId: event.id, partnerName: formData.get('partnerName') as string,
      partnerEmail: formData.get('partnerEmail') as string,
      addressLine: address, city, postalCode, country: 'NL', lat: geo.lat, lng: geo.lng,
    })

    if (result.error === 'outside_radius') { setError(t('outsideRadius')); setLoading(false); return }
    if (result.error) { setError(result.error); setLoading(false); return }

    const checkoutRes = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duoId: result.duoId, eventSlug: event.slug, locale }),
    })
    const { url } = await checkoutRes.json()
    window.location.href = url
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">{t('title')}</h2>
      <input name="partnerName" placeholder={t('partnerName')} required className="rounded border px-3 py-2" />
      <input name="partnerEmail" type="email" placeholder={t('partnerEmail')} required className="rounded border px-3 py-2" />
      <hr />
      <input name="address" placeholder={t('address')} required className="rounded border px-3 py-2" />
      <div className="flex gap-2">
        <input name="postalCode" placeholder={t('postalCode')} required className="w-1/3 rounded border px-3 py-2" />
        <input name="city" placeholder={t('city')} required className="flex-1 rounded border px-3 py-2" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="rounded bg-black px-6 py-3 text-white hover:bg-gray-800 disabled:opacity-50">
        {loading ? '...' : t('pay')}
      </button>
    </form>
  )
}
