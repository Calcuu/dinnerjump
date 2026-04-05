'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { sendInvitation } from '@/actions/invitations'

type Props = { eventId: string; duoId: string; sentCount: number; isOrganizer: boolean }

export function InvitationForm({ eventId, duoId, sentCount, isOrganizer }: Props) {
  const t = useTranslations('invitations')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remaining = isOrganizer ? Infinity : 5 - sentCount
  const limitReached = !isOrganizer && remaining <= 0

  async function handleSubmit(formData: FormData) {
    setLoading(true); setSuccess(false); setError(null)
    const result = await sendInvitation({
      eventId, duoId, inviteeName: formData.get('name') as string,
      inviteeEmail: formData.get('email') as string,
      personalMessage: (formData.get('message') as string) || undefined,
    })
    setLoading(false)
    if (result.error === 'limit_reached') { setError(t('limitReached')); return }
    if (result.error) { setError(result.error); return }
    setSuccess(true)
  }

  if (limitReached) return <p className="text-sm text-gray-500">{t('limitReached')}</p>

  return (
    <div>
      <h3 className="mb-2 text-lg font-semibold">{t('title')}</h3>
      <p className="mb-4 text-sm text-gray-600">{t('subtitle')}</p>
      {!isOrganizer && <p className="mb-4 text-sm text-gray-500">{t('remaining', { count: remaining })}</p>}
      <form action={handleSubmit} className="flex flex-col gap-3">
        <input name="name" placeholder={t('name')} required className="rounded border px-3 py-2" />
        <input name="email" type="email" placeholder={t('email')} required className="rounded border px-3 py-2" />
        <textarea name="message" placeholder={t('message')} className="rounded border px-3 py-2" rows={2} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{t('sent')}</p>}
        <button type="submit" disabled={loading} className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800 disabled:opacity-50">
          {loading ? '...' : t('send')}
        </button>
      </form>
    </div>
  )
}
