
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)
  const [isLoading, setIsLoading] = React.useState(true)
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    const onChange = () => {
      // Clear any existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // Debounce the mobile detection update
      debounceTimerRef.current = setTimeout(() => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
        setIsLoading(false)
      }, 100) // 100ms debounce delay
    }

    mql.addEventListener("change", onChange)
    onChange() // Call immediately to set initial state

    return () => {
      mql.removeEventListener("change", onChange)
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return { isMobile: !!isMobile, isLoading }
}
