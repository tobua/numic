import { useEffect, useState } from 'react'

export function useBreakpoint(initial = 'desktop') {
  const [breakpoint, setBreakpoint] = useState(initial)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1000px)')

    if (mediaQuery.matches) {
      setBreakpoint('mobile')
    }

    mediaQuery.addEventListener('change', (event) => {
      if (event.matches) {
        setBreakpoint('mobile')
      } else {
        setBreakpoint('desktop')
      }
    })
  }, [])

  return { breakpoint, mobile: breakpoint === 'mobile' }
}
