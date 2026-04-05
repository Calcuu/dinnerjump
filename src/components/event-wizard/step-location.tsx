'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import type { WizardData } from './wizard'

const LocationMap = dynamic(() => import('./location-map').then(mod => ({ default: mod.LocationMap })), {
  ssr: false,
  loading: () => <div className="mt-3 h-[250px] rounded-lg border bg-gray-50 flex items-center justify-center text-sm text-gray-400">Kaart laden...</div>,
})

type Props = { data: WizardData; onChange: (partial: Partial<WizardData>) => void }

export function StepLocation({ data, onChange }: Props) {
  const t = useTranslations('wizard')
  const [geocoding, setGeocoding] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)

  async function handleGeocode() {
    if (!data.centerAddress) return
    setGeocoding(true)
    setGeoError(null)
    const res = await fetch(`/api/geocode?address=${encodeURIComponent(data.centerAddress)}`)
    if (!res.ok) { setGeoError('Adres niet gevonden'); setGeocoding(false); return }
    const geo = await res.json()
    onChange({ centerLat: geo.lat, centerLng: geo.lng })
    setGeocoding(false)
  }

  async function handleUseMyLocation() {
    if (!navigator.geolocation) { setGeoError('Geolocatie wordt niet ondersteund'); return }
    setLocating(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        onChange({ centerLat: latitude, centerLng: longitude })
        // Reverse geocode to get address
        const res = await fetch(`/api/geocode?lat=${latitude}&lng=${longitude}`)
        if (res.ok) {
          const geo = await res.json()
          onChange({ centerAddress: geo.displayName, centerLat: latitude, centerLng: longitude })
        }
        setLocating(false)
      },
      () => { setGeoError('Locatie kon niet worden bepaald'); setLocating(false) },
      { enableHighAccuracy: true }
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium">{t('centerAddress')}</label>
        <div className="flex gap-2">
          <input type="text" value={data.centerAddress} onChange={(e) => onChange({ centerAddress: e.target.value })} className="flex-1 rounded border px-3 py-2" placeholder="bijv. Amsterdam Centrum" />
          <button type="button" onClick={handleGeocode} disabled={geocoding} className="rounded bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200 disabled:opacity-50">
            {geocoding ? '...' : 'Zoek'}
          </button>
        </div>
        <button type="button" onClick={handleUseMyLocation} disabled={locating} className="mt-2 text-sm text-blue-600 hover:underline disabled:opacity-50">
          {locating ? '...' : t('useMyLocation')}
        </button>
        {geoError && <p className="mt-1 text-sm text-red-600">{geoError}</p>}
        {data.centerLat !== 0 && <p className="mt-1 text-sm text-green-600">Locatie gevonden</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">{t('radius')}: {data.radiusKm} km</label>
        <input type="range" min={1} max={10} value={data.radiusKm} onChange={(e) => onChange({ radiusKm: parseInt(e.target.value) })} className="w-full" />
        <div className="flex justify-between text-xs text-gray-400"><span>1 km</span><span>10 km</span></div>
      </div>

      <LocationMap lat={data.centerLat} lng={data.centerLng} radiusKm={data.radiusKm} onPositionChange={(lat, lng) => onChange({ centerLat: lat, centerLng: lng })} />

      <div>
        <label className="mb-1 block text-sm font-medium">{t('travelTime')}</label>
        <div className="flex gap-4">
          {([15, 30, 45] as const).map((min) => (
            <label key={min} className="flex items-center gap-2">
              <input type="radio" checked={data.travelTimeMinutes === min} onChange={() => onChange({ travelTimeMinutes: min })} />
              {min} min
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-400">{t('travelTimeHelp')}</p>
      </div>
    </div>
  )
}
