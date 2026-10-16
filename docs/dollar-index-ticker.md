# Dollar Index reference ticker

The homepage displays Pepperstone’s USDX CFD reference through TradingView’s published ticker-tape component. It tracks the six-currency US Dollar Index basket and is explicitly labeled as a reference CFD. It is not an official ICE real-time index subscription or an exchange-rate quote for customer transfers.

Primary provider references:

- https://www.tradingview.com/symbols/PEPPERSTONE-USDX/
- https://www.tradingview.com/widget-docs/widgets/tickers/ticker-tape/
- https://www.tradingview.com/widget-docs/tutorials/web-components/configuring/

Only USDX is requested. Repeated copies create the continuous tape; they are not additional instruments. Quotes, directional colors and attribution come directly from the provider. No market values are fabricated, hard-coded, scraped or cached by XpressTend. Provider market closures and outages can affect availability.

The public wrapper is served by a separate static-only Worker at xpresstend-market.shrill-king-ef4e.workers.dev. It has no application APIs, databases, authentication bindings or secrets. The main xpresstend.com and www.xpresstend.com pages embed it across origins, preventing the widget code from reading the parent app DOM or sessions. Its CSP alone permits the provider module, datafeed frame and sockets. Main pages retain first-party scripts and connections. Both /dollar-index and /dollar-index.html resolve explicitly without automatic HTML redirects.

The provider uses its published en, es, br and ar_AE modules for the site's English, Spanish, Portuguese and Arabic selections. The surrounding document retains the corresponding standard language code.

The frame permits these exact parent origins:

- https://xpresstend.com
- https://www.xpresstend.com
- https://xpresstend.shrill-king-ef4e.workers.dev (configured Worker preview)
- http://localhost:5173 (Vite development)
- http://localhost:4173 (Vite build preview)
- http://127.0.0.1:5179 (browser-test preview)

Other origins receive a direct quote link instead of a blocked iframe. This includes Capacitor until native embedding and motion controls are verified on a device. Incoming origins are never reflected into the policy. Browser fixtures apply the real frame security headers and stub only the provider module.

The full widget, including its attribution, is scaled uniformly to fit the slim 64px frame. Pause messages validate both source and origin. System and saved reduced-motion preferences stop the tape. A static provider link remains available if the module cannot load. The official ICE feed requires a separately licensed provider and is not enabled by this implementation.

Automated browser checks stub the provider module to verify XpressTend integration without relying on external market availability. A release smoke check must also verify actual provider quotes, motion controls, full attribution and cross-origin isolation against the deployed site.
