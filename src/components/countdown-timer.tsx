'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

export function CountdownTimer({ deadline }: { deadline: string }) {
  const t = useTranslations('events')
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    function update() {
      const diff = new Date(deadline).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft(t('registrationClosed')); return }
      const days = Math.floor(diff / 86400000)
      const hours = Math.floor((diff % 86400000) / 3600000)
      const minutes = Math.floor((diff % 3600000) / 60000)
      setTimeLeft(`${days}d ${hours}h ${minutes}m`)
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [deadline, t])

  return (
    <div className="text-sm text-gray-600">
      <span className="font-medium">{t('deadline')}:</span> {timeLeft}
    </div>
  )
}
