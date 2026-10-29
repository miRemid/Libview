import { useEffect, useState } from 'react'
import { isAdmin, pb } from '../lib/pocketbase'

export function useAuth() {
  const [admin, setAdmin] = useState(isAdmin())

  useEffect(() => {
    return pb.authStore.onChange(() => {
      setAdmin(isAdmin())
    })
  }, [])

  return { isAdmin: admin }
}
