import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { App as CapApp } from '@capacitor/app'
import { Network } from '@capacitor/network'
import { useT } from '../i18n'
import { hideSplash, isNative, setStatusBarTint } from './capabilities'

/** Screens that paint a dark ground and need the status bar to match. */
const DARK_TINT_ROUTES = ['/success']

const BRAND_TINT = '#0B252F'
const DARK_TINT = '#051216'

/**
 * Native behaviour that has no web equivalent: dismissing the launch splash
 * once React has painted, keeping the status bar in step with the screen,
 * making the Android back gesture behave like a back button rather than
 * quitting mid-transfer, and telling the sender when the network drops.
 *
 * Renders only the offline notice; everything else is side effects.
 */
export function NativeShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const t = useT()
  const [offline, setOffline] = useState(false)

  // The splash is configured not to auto-hide, so the first paint is never a
  // white flash. Dismiss it once we are mounted and the UI is on screen.
  useEffect(() => {
    void hideSplash()
  }, [])

  useEffect(() => {
    const dark = DARK_TINT_ROUTES.includes(location.pathname)
    void setStatusBarTint(dark ? DARK_TINT : BRAND_TINT)
  }, [location.pathname])

  // Android hardware/gesture back. Without this the OS closes the app from any
  // screen, which mid-transfer reads as losing the money.
  useEffect(() => {
    if (!isNative) return
    let remove: (() => void) | undefined
    void CapApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack && location.pathname !== '/') {
        navigate(-1)
      } else {
        void CapApp.exitApp()
      }
    }).then((handle) => {
      remove = () => void handle.remove()
    })
    return () => remove?.()
  }, [location.pathname, navigate])

  useEffect(() => {
    let remove: (() => void) | undefined
    void Network.getStatus().then((status) => setOffline(!status.connected))
    void Network.addListener('networkStatusChange', (status) => {
      setOffline(!status.connected)
    }).then((handle) => {
      remove = () => void handle.remove()
    })
    return () => remove?.()
  }, [])

  if (!offline) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-50 bg-ink-900 px-4 py-2 text-center text-[13px] font-semibold text-white"
    >
      {t('network.offline')}
    </div>
  )
}
