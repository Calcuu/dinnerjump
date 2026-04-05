'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Circle, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

function MapUpdater({ lat, lng, radiusKm }: { lat: number; lng: number; radiusKm: number }) {
  const map = useMap()
  useEffect(() => {
    if (lat !== 0 && lng !== 0) {
      const bounds = L.latLng(lat, lng).toBounds(radiusKm * 2000)
      map.fitBounds(bounds, { padding: [20, 20] })
    }
  }, [lat, lng, radiusKm, map])
  return null
}

function DraggableMarker({ lat, lng, onPositionChange }: { lat: number; lng: number; onPositionChange?: (lat: number, lng: number) => void }) {
  const markerRef = useRef<L.Marker>(null)
  return (
    <Marker
      draggable={true}
      eventHandlers={{
        dragend() {
          const marker = markerRef.current
          if (marker && onPositionChange) {
            const pos = marker.getLatLng()
            onPositionChange(pos.lat, pos.lng)
          }
        },
      }}
      position={[lat, lng]}
      ref={markerRef}
      icon={defaultIcon}
    />
  )
}

type Props = {
  lat: number
  lng: number
  radiusKm: number
  onPositionChange?: (lat: number, lng: number) => void
}

export function LocationMap({ lat, lng, radiusKm, onPositionChange }: Props) {
  if (lat === 0 && lng === 0) return null
  return (
    <div className="mt-3 overflow-hidden rounded-lg border" style={{ height: '300px' }}>
      <MapContainer center={[lat, lng]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <DraggableMarker lat={lat} lng={lng} onPositionChange={onPositionChange} />
        <Circle center={[lat, lng]} radius={radiusKm * 1000} pathOptions={{ color: '#000', fillColor: '#000', fillOpacity: 0.08, weight: 2, dashArray: '5, 10' }} />
        <MapUpdater lat={lat} lng={lng} radiusKm={radiusKm} />
      </MapContainer>
    </div>
  )
}
