import { useEffect, useState } from 'react'

export const APPLICATION_OPENS_AT = new Date('2026-07-30T17:00:00+05:30').getTime()
export const APPLICATION_OPEN_LABEL = '30 July 2026 at 5:00 PM IST'

export const isApplicationOpen = () => Date.now() >= APPLICATION_OPENS_AT

export const useApplicationOpen = () => {
  const [isOpen, setIsOpen] = useState(isApplicationOpen)

  useEffect(() => {
    if (isOpen) return undefined
    const timer = window.setInterval(() => setIsOpen(isApplicationOpen()), 30000)
    return () => window.clearInterval(timer)
  }, [isOpen])

  return isOpen
}
