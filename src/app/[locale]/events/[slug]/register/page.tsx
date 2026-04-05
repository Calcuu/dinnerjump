import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RegistrationForm } from '@/components/registration-form'

export default async function RegisterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: event } = await supabase.from('events').select('*').eq('slug', slug).single()
  if (!event) notFound()
  if (new Date(event.registration_deadline) <= new Date()) redirect(`/events/${slug}`)

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <RegistrationForm event={event} />
    </div>
  )
}
