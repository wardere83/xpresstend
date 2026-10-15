/* TradingView's published widget owns its quotes and attribution. No prices are fabricated or scraped. */
const locales = new Set(['en', 'es', 'pt', 'ar'])
const requested = new URL(location.href).searchParams.get('lang') || 'en'
const locale = locales.has(requested) ? requested : 'en'
document.documentElement.lang = locale
const fallbackCopy = {
  en: 'DXY · View current reference quote on TradingView',
  es: 'DXY · Ver cotización de referencia actual en TradingView',
  pt: 'DXY · Ver cotação de referência atual no TradingView',
  ar: 'DXY · عرض السعر المرجعي الحالي على TradingView',
}
document.querySelector('.market-fallback').textContent = fallbackCopy[locale]
const host = document.getElementById('ticker')
const widget = document.createElement('tv-ticker-tape')
// Repeat only DXY so the tape spans wide screens and continues moving edge to edge.
widget.setAttribute('symbols', Array(16).fill('TVC:DXY').join(','))
widget.setAttribute('item-size', 'compact')
widget.setAttribute('hide-chart', '')
widget.setAttribute('transparent', '')
widget.setAttribute('theme', 'light')
let requestedPause = false
const systemMotion = matchMedia('(prefers-reduced-motion: reduce)')
function applyPause() {
  widget.toggleAttribute(
    'disable-scroll',
    requestedPause || systemMotion.matches,
  )
}
systemMotion.addEventListener('change', applyPause)
window.addEventListener('message', (event) => {
  if (event.source !== parent || event.origin !== location.origin) return
  if (event.data?.type !== 'xpresstend:market-motion') return
  requestedPause = event.data.paused === true
  applyPause()
})
applyPause()
const script = document.createElement('script')
script.type = 'module'
script.src = `https://widgets.tradingview-widget.com/w/${locale}/tv-ticker-tape.js`
script.addEventListener('load', async () => {
  await customElements.whenDefined('tv-ticker-tape')
  host.replaceChildren(widget)
  parent.postMessage({ type: 'xpresstend:market-ready' }, location.origin)
})
document.head.append(script)
