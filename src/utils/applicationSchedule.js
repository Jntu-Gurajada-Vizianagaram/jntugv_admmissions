import { useEffect, useState } from 'react'

export const APPLICATION_OPENS_AT = new Date('2026-07-30T17:00:00+05:30').getTime()
export const APPLICATION_COMMENCE_LABEL = 'Applications Commence Shortly at 5:00 PM Today'
const APPLICATION_OPEN_OVERRIDE = import.meta.env.VITE_APPLICATION_OPEN_OVERRIDE === 'true'

export const isApplicationOpen = () => APPLICATION_OPEN_OVERRIDE || Date.now() >= APPLICATION_OPENS_AT

export const useApplicationOpen = () => {
  const [isOpen, setIsOpen] = useState(isApplicationOpen)

  useEffect(() => {
    if (isOpen) return undefined
    const timer = window.setInterval(() => setIsOpen(isApplicationOpen()), 30000)
    return () => window.clearInterval(timer)
  }, [isOpen])

  return isOpen
}
