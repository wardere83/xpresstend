# Dollar Index reference ticker

The homepage displays Pepperstone’s USDX CFD reference through TradingView’s published ticker-tape component. It tracks the six-currency US Dollar Index basket and is explicitly labeled as a reference CFD. It is not an official ICE real-time index subscription or an exchange-rate quote for customer transfers.

Primary provider references:

- https://www.tradingview.com/symbols/PEPPERSTONE-USDX/
- https://www.tradingview.com/widget-docs/widgets/tickers/ticker-tape/
- https://www.tradingview.com/widget-docs/tutorials/web-components/configuring/

Only USDX is requested. Repeated copies create the continuous tape; they are not additional instruments. Quotes, directional colors and attribution come directly from the provider. No market values are fabricated, hard-coded, scraped or cached by XpressTend. Provider market closures and outages can affect availability.

The public wrapper is served by the same Worker at its existing workers.dev origin. The main xpresstend.com and www.xpresstend.com pages embed it across origins, preventing the widget code from reading the parent app DOM or sessions. Its CSP alone permits the provider module, datafeed frame and sockets. Main pages retain first-party scripts and connections. The alternate workers.dev homepage displays a quote link rather than embedding a same-origin widget.

The full widget, including its attribution, is scaled uniformly to fit the slim 64px frame. Pause messages validate both source and origin. System and saved reduced-motion preferences stop the tape. A static provider link remains available if the module cannot load. The official ICE feed requires a separately licensed provider and is not enabled by this implementation.

Automated browser checks stub the provider module to verify XpressTend integration without relying on external market availability. A release smoke check must also verify actual provider quotes, motion controls, full attribution and cross-origin isolation against the deployed site.
