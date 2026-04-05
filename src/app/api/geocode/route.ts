import { NextRequest, NextResponse } from 'next/server'

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'

function shortAddress(data: any): string {
  // Extract just street + city from Nominatim response
  const parts: string[] = []
  const addr = data.address
  if (addr) {
    const street = addr.road || addr.pedestrian || addr.neighbourhood || ''
    const houseNumber = addr.house_number || ''
    if (street) parts.push(houseNumber ? `${street} ${houseNumber}` : street)
    const city = addr.city || addr.town || addr.village || addr.municipality || ''
    if (city) parts.push(city)
  }
  return parts.length > 0 ? parts.join(', ') : data.display_name
}

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get('lat')
  const lng = request.nextUrl.searchParams.get('lng')
  const address = request.nextUrl.searchParams.get('address')

  // Reverse geocoding: lat/lng → address
  if (lat && lng) {
    const res = await fetch(
      `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { 'User-Agent': 'DinnerJump/1.0' } }
    )
    const data = await res.json()
    if (data.error) return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    return NextResponse.json({
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lon),
      displayName: shortAddress(data),
      fullName: data.display_name,
    })
  }

  // Forward geocoding: address → lat/lng
  if (!address) return NextResponse.json({ error: 'Address or coordinates required' }, { status: 400 })

  const res = await fetch(
    `${NOMINATIM_BASE}/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=nl,be,de&addressdetails=1`,
    { headers: { 'User-Agent': 'DinnerJump/1.0' } }
  )
  const data = await res.json()

  if (!data.length) return NextResponse.json({ error: 'Address not found' }, { status: 404 })

  return NextResponse.json({
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    displayName: shortAddress(data[0]),
    fullName: data[0].display_name,
  })
}
