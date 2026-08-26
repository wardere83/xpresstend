/**
 * Thin wrappers over the native platform APIs.
 *
 * Every helper is a no-op on the web build, so screens can call them
 * unconditionally and the same source ships to xpresstend.com, iOS and
 * Android without branching at each call site.
 */
import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { Preferences } from '@capacitor/preferences'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'

export const isNative = Capacitor.isNativePlatform()
export const platform = Capacitor.getPlatform() as 'web' | 'ios' | 'android'

/** Physical feedback for a committed action — a tap that changed something. */
export async function tapFeedback(strength: 'light' | 'medium' | 'heavy' = 'light') {
  if (!isNative) return
  const style =
    strength === 'heavy' ? ImpactStyle.Heavy : strength === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light
  try {
    await Haptics.impact({ style })
  } catch {
    // Haptics are a courtesy; a device without a taptic engine must not break the flow.
  }
}

/** Reserved for the moment money actually moves: a distinct success buzz. */
export async function outcomeFeedback(outcome: 'success' | 'warning' | 'error') {
  if (!isNative) return
  const type =
    outcome === 'success'
      ? NotificationType.Success
      : outcome === 'warning'
        ? NotificationType.Warning
        : NotificationType.Error
  try {
    await Haptics.notification({ type })
  } catch {
    // As above — never let feedback failure surface to the sender.
  }
}

/** Tints the status bar to match the screen behind it. */
export async function setStatusBarTint(backgroundColor: string) {
  if (!isNative) return
  try {
    await StatusBar.setStyle({ style: Style.Dark })
    if (platform === 'android') await StatusBar.setBackgroundColor({ color: backgroundColor })
  } catch {
    // Some Android skins reject colour changes; the default tint stays.
  }
}

export async function hideSplash() {
  if (!isNative) return
  try {
    await SplashScreen.hide({ fadeOutDuration: 200 })
  } catch {
    // Already hidden.
  }
}

/**
 * Device-backed key/value storage. On iOS this is UserDefaults and on Android
 * SharedPreferences, so it is appropriate for preferences — never for tokens,
 * PII or anything a compromised device should not yield. Those belong in the
 * Keychain/Keystore once the transfer backend exists.
 */
export const deviceStore = {
  async get(key: string): Promise<string | null> {
    if (!isNative) return localStorage.getItem(key)
    const { value } = await Preferences.get({ key })
    return value
  },
  async set(key: string, value: string): Promise<void> {
    if (!isNative) {
      localStorage.setItem(key, value)
      return
    }
    await Preferences.set({ key, value })
  },
  async remove(key: string): Promise<void> {
    if (!isNative) {
      localStorage.removeItem(key)
      return
    }
    await Preferences.remove({ key })
  },
}
