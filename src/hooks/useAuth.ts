import { useEffect, useState } from 'react'
import { getMe } from '../lib/api'

export function useAuth() {
  const [admin, setAdmin] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    getMe()
      .then(() => {
        if (!cancelled) setAdmin(true)
      })
      .catch(() => {
        if (!cancelled) setAdmin(false)
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { isAdmin: admin, ready }
}
