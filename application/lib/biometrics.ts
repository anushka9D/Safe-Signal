import * as LocalAuthentication from 'expo-local-authentication'
import * as SecureStore from 'expo-secure-store'

const safe = (s: string) => s.replace(/[^a-zA-Z0-9._-]/g, '_')
const bioKey = (uid: string) => `bio_${safe(uid)}_enabled`
const lockKey = (uid: string) => `lock_${safe(uid)}_enabled`

export async function getSupport() {
    const hasHardware = await LocalAuthentication.hasHardwareAsync()
    const enrolled = hasHardware ? await LocalAuthentication.isEnrolledAsync() : false
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync()
    return { hasHardware, enrolled, types }
}


export async function isEnabledForUser(uid: string) {
    return (await SecureStore.getItemAsync(bioKey(uid))) === '1'
}
export async function enableForUser(uid: string) {
    await SecureStore.setItemAsync(bioKey(uid), '1')
}
export async function disableForUser(uid: string) {
    await SecureStore.deleteItemAsync(bioKey(uid))
}


export async function setLocked(uid: string) {
    await SecureStore.setItemAsync(lockKey(uid), '1')
}
export async function clearLocked(uid: string) {
    await SecureStore.deleteItemAsync(lockKey(uid))
}
export async function isLocked(uid: string) {
    return (await SecureStore.getItemAsync(lockKey(uid))) === '1'
}

export async function authenticate(prompt = 'Unlock with biometrics') {
    const { success } = await LocalAuthentication.authenticateAsync({
        promptMessage: prompt,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use device PIN',
        disableDeviceFallback: false,
    })
    return success
}