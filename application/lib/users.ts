
import { db } from '../config/firebase-config'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { router, type Href } from 'expo-router'


export async function ensureUserDoc(u: User): Promise<void> {
  const ref = doc(db, 'users', u.uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(
      ref,
      {
        email: u.email ?? '',
        name: u.displayName ?? '',
        role: 'user',
        createdAt: serverTimestamp(),
      },
      { merge: true }
    )
  }
}

export async function getUserRole(u: User): Promise<string> {
  const snap = await getDoc(doc(db, 'users', u.uid))
  return snap.exists() ? ((snap.data().role as string) || 'user') : 'user'
}


export async function routeByRole(
  u: User,
  opts: { userHome?: Href; adminHome?: Href } = {}
): Promise<void> {
  const role = await getUserRole(u)

  const USER_HOME: Href = opts.userHome ?? '/user/dashboard'
  const ADMIN_HOME: Href = opts.adminHome ?? '/admin/dashboard'

  router.replace(role === 'admin' ? ADMIN_HOME : USER_HOME)
}
