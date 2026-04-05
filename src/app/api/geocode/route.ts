import { NextRequest, NextResponse } from 'next/server'

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address')
  if (!address) return NextResponse.json({ error: 'Address required' }, { status: 400 })

  const res = await fetch(
    `${NOMINATIM_URL}?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=nl,be,de`,
    { headers: { 'User-Agent': 'DinnerJump/1.0' } }
  )
  const data = await res.json()

  if (!data.length) return NextResponse.json({ error: 'Address not found' }, { status: 404 })

  return NextResponse.json({
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    displayName: data[0].display_name,
  })
}
