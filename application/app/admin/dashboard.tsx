import React, { useEffect, useMemo, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { View, Text, ScrollView, Pressable, ActivityIndicator, TextInput, Alert } from 'react-native'
import { db } from '../../config/firebase-config'
import {
  collection, query, orderBy, limit, onSnapshot, Timestamp,
  where, getCountFromServer, addDoc, deleteDoc, doc, serverTimestamp
} from 'firebase/firestore'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)

 
  const [usersTotal, setUsersTotal] = useState<number | null>(null)
  const [users7d, setUsers7d] = useState<number | null>(null)
  const [safeTotal, setSafeTotal] = useState<number | null>(null)
  const [safe7d, setSafe7d] = useState<number | null>(null)

 
  const [users, setUsers] = useState<any[]>([])
  const [safeRecent, setSafeRecent] = useState<any[]>([])

 
  const [qUsers, setQUsers] = useState('')

  
  const [label, setLabel] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [userId, setUserId] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const since7d = Timestamp.fromMillis(Date.now() - 7 * 24 * 60 * 60 * 1000)

   
    ;(async () => {
      const cUsers = await getCountFromServer(collection(db, 'users'))
      const cUsers7 = await getCountFromServer(query(collection(db, 'users'), where('createdAt', '>=', since7d)))
      const cSafe = await getCountFromServer(collection(db, 'safe_locations'))
      const cSafe7 = await getCountFromServer(query(collection(db, 'safe_locations'), where('createdAt', '>=', since7d)))
      setUsersTotal(cUsers.data().count)
      setUsers7d(cUsers7.data().count)
      setSafeTotal(cSafe.data().count)
      setSafe7d(cSafe7.data().count)
    })().catch(() => {})

  
    const unsubUsers = onSnapshot(
      query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(50)),
      snap => setUsers(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
    )

   
    const unsubSafe = onSnapshot(
      query(collection(db, 'safe_locations'), orderBy('createdAt', 'desc'), limit(20)),
      snap => setSafeRecent(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
    )

    setLoading(false)
    return () => { unsubUsers(); unsubSafe() }
  }, [])

  const filteredUsers = useMemo(() => {
    const t = qUsers.trim().toLowerCase()
    if (!t) return users
    return users.filter(u =>
      (u.name ?? '').toLowerCase().includes(t) ||
      (u.email ?? '').toLowerCase().includes(t)
    )
  }, [users, qUsers])

  const addSafe = async () => {
    if (busy) return
    if (!label || !lat || !lng) return Alert.alert('Missing', 'Label, latitude and longitude are required.')
    const latNum = Number(lat), lngNum = Number(lng)
    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) return Alert.alert('Invalid', 'Lat/Lng must be numbers.')
    setBusy(true)
    try {
      await addDoc(collection(db, 'safe_locations'), {
        label: label.trim(),
        location: { lat: latNum, lng: lngNum },
        userId: userId || null,
        createdAt: serverTimestamp(),
        
      })
      setLabel(''); setLat(''); setLng(''); setUserId('')
    } catch (e:any) {
      Alert.alert('Error', String(e?.message ?? e))
    } finally {
      setBusy(false)
    }
  }

  const removeSafe = async (id: string) => {
    if (busy) return
    setBusy(true)
    try { await deleteDoc(doc(db, 'safe_locations', id)) }
    catch (e:any) { Alert.alert('Error', String(e?.message ?? e)) }
    finally { setBusy(false) }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#0b1220] items-center justify-center">
        <ActivityIndicator />
        <Text className="text-slate-400 mt-2">Loading…</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0b1220]">
      <ScrollView contentContainerClassName="p-5 gap-10 pb-40">

       
        <View className="gap-3">
          <Text className="text-white text-2xl font-extrabold">Admin Dashboard</Text>
          <View className="flex-row gap-3">
            <KPI label="Users" value={usersTotal ?? '—'} />
            <KPI label="New (7d)" value={users7d ?? '—'} />
          </View>
          <View className="flex-row gap-3">
            <KPI label="Safe locations" value={safeTotal ?? '—'} />
            <KPI label="New safe (7d)" value={safe7d ?? '—'} />
          </View>
        </View>

      
        <View className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <Text className="text-white font-bold mb-3">Users</Text>
          <TextInput
            className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white mb-3"
            placeholder="Search name or email"
            placeholderTextColor="#94a3b8"
            value={qUsers}
            onChangeText={setQUsers}
            autoCapitalize="none"
          />
          {filteredUsers.length === 0
            ? <Text className="text-slate-400">No users match.</Text>
            : filteredUsers.map(u => (
                <Row
                  key={u.id}
                  title={u.name ?? '—'}
                  subtitle={`${u.email ?? '—'} • ${u.preferredLanguage ?? 'en'} • ${fmtDate(u.createdAt)}`}
                />
              ))
          }
        </View>

       
       

      
        <View className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <Text className="text-white font-bold mb-3">Recent activity</Text>
          <Text className="text-slate-300 mb-2">Latest signups</Text>
          {users.slice(0,10).map(u => (
            <Row key={`su_${u.id}`} title={u.name ?? '—'} subtitle={`${u.email ?? '—'} • ${fmtDate(u.createdAt)}`} />
          ))}
          
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}


function KPI({ label, value }: { label: string; value: number | string }) {
  return (
    <View className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4">
      <Text className="text-slate-400 text-xs">{label}</Text>
      <Text className="text-white text-2xl font-extrabold">{value}</Text>
    </View>
  )
}

function Row({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="py-3 border-b border-white/10">
      <Text className="text-white font-semibold">{title}</Text>
      {!!subtitle && <Text className="text-slate-400 text-xs mt-0.5">{subtitle}</Text>}
    </View>
  )
}

const num = (n?: number) => (typeof n === 'number' ? n.toFixed(4) : '—')
function fmtDate(t?: any) {
  if (!t?.toMillis) return '—'
  const d = new Date(t.toMillis())
  return d.toLocaleString()
}
