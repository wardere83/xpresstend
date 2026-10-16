/* TradingView's published widget owns its quotes and attribution. No prices are fabricated or scraped. */
const locales = new Set(['en', 'es', 'pt', 'ar'])
const requested = new URL(location.href).searchParams.get('lang') || 'en'
const locale = locales.has(requested) ? requested : 'en'
const providerLocale = { en: 'en', es: 'es', pt: 'br', ar: 'ar_AE' }[locale]
document.documentElement.lang = locale
const fallbackCopy = {
  en: 'USDX · View current reference quote on TradingView',
  es: 'USDX · Ver cotización de referencia actual en TradingView',
  pt: 'USDX · Ver cotação de referência atual no TradingView',
  ar: 'USDX · عرض السعر المرجعي الحالي على TradingView',
}
const fallback = document.querySelector('.market-fallback')
fallback.textContent = fallbackCopy[locale]
const host = document.getElementById('ticker')
// Configure the element before the published provider module upgrades it.
const widget = document.createElement('tv-ticker-tape')
// Pepperstone's six-currency Dollar Index CFD is available in published widgets.
// Repeat only that reference so the tape spans wide screens and keeps moving.
widget.setAttribute('symbols', Array(16).fill('PEPPERSTONE:USDX').join(','))
widget.setAttribute('item-size', 'compact')
widget.setAttribute('hide-chart', '')
widget.setAttribute('transparent', '')
widget.setAttribute('theme', 'light')
let requestedPause = false
let providerReady = false
const parentOrigin = document.referrer
  ? new URL(document.referrer).origin
  : location.origin
const systemMotion = matchMedia('(prefers-reduced-motion: reduce)')
function applyPause() {
  const stopped = requestedPause || systemMotion.matches
  widget.toggleAttribute('disable-scroll', stopped)
  host.dataset.paused = String(stopped)
  // The static alternative stops visible quote updates as well as scrolling.
  if (!providerReady) return
  if (stopped) host.replaceChildren(fallback)
  else if (!host.querySelector('tv-ticker-tape')) host.replaceChildren(widget)
}
systemMotion.addEventListener('change', applyPause)
window.addEventListener('message', (event) => {
  if (event.source !== parent || event.origin !== parentOrigin) return
  if (event.data?.type !== 'xpresstend:market-motion') return
  requestedPause = event.data.paused === true
  applyPause()
})
applyPause()
const script = document.createElement('script')
script.type = 'module'
script.src = `https://widgets.tradingview-widget.com/w/${providerLocale}/tv-ticker-tape.js`
script.addEventListener('load', async () => {
  await customElements.whenDefined('tv-ticker-tape')
  providerReady = true
  applyPause()
  parent.postMessage({ type: 'xpresstend:market-ready' }, parentOrigin)
})
document.head.append(script)
