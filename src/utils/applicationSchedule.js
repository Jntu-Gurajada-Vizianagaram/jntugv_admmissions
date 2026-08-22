import { useEffect, useState } from 'react'

export const APPLICATION_OPENS_AT = new Date('2026-07-30T17:00:00+05:30').getTime()
export const APPLICATION_CLOSES_AT = new Date('2026-08-22T17:00:00+05:30').getTime()
export const APPLICATION_COMMENCE_LABEL = 'Applications Closed'
const APPLICATION_OPEN_OVERRIDE = import.meta.env.VITE_APPLICATION_OPEN_OVERRIDE === 'true'

export const isApplicationOpen = () => APPLICATION_OPEN_OVERRIDE || (Date.now() >= APPLICATION_OPENS_AT && Date.now() < APPLICATION_CLOSES_AT)

export const useApplicationOpen = () => {
  const [isOpen, setIsOpen] = useState(isApplicationOpen)

  useEffect(() => {
    if (isOpen) return undefined
    const timer = window.setInterval(() => setIsOpen(isApplicationOpen()), 30000)
    return () => window.clearInterval(timer)
  }, [isOpen])

  return isOpen
}
