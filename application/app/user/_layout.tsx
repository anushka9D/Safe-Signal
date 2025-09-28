
import { Slot, Redirect } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../../config/firebase-config'
import { isEnabledForUser, isLocked, authenticate } from '../../lib/biometrics'

export default function AdminLayout() {
  const [status, setStatus] = useState<'checking' | 'ok' | 'out' | 'locked'>('checking')
  const prompted = useRef(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return setStatus('out')

      const [enabled, locked] = await Promise.all([
        isEnabledForUser(user.uid),
        isLocked(user.uid),
      ])

   
      if (enabled && locked) {
        if (!prompted.current) {
          prompted.current = true
          const ok = await authenticate()
          if (!ok) return setStatus('out')
        }
      }
      setStatus('ok')
    })
    return unsub
  }, [])

  if (status === 'checking') return null
  if (status === 'out') return <Redirect href="/auth/login" />
  return <Slot />
}
