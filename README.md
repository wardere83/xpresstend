# XpressHawala

A working web build of the XpressHawala money-transfer app from the product mockups: a
voice-first remittance experience for a Seattle, WA based money transmitter serving
customers worldwide. **English is the primary language, with full translations into Somali
(Af-Soomaali), Brazilian Portuguese, Spanish and Arabic** that can be switched at any time —
the whole app, not just the marketing copy. Arabic renders right-to-left.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production bundle into dist/
npm run preview  # serve the production build
npm run lint     # oxlint
```

The build output in `dist/` is a static site — it can be dropped on any static host
(HostGator or any cPanel account, GitHub Pages, S3, Netlify, Cloudflare Pages). Routing
uses `HashRouter` and asset paths are relative, so there are no server rewrite rules to
configure and the site works just as well from a subfolder as from a domain root.

## Deploying

`.github/workflows/deploy.yml` builds and checks every push and pull request. Deploys are
opt-in, so nothing goes red before a target is configured. Each run also attaches the built
site as a `site` artifact, which can be downloaded and uploaded by hand at any time.

### HostGator (cPanel)

**Manual, once:** unzip a build into `public_html/` with cPanel's File Manager.

**Automatic, on every push to `main`:** add these under **Settings → Secrets and variables
→ Actions**, then push.

| Kind | Name | Value |
| --- | --- | --- |
| Variable | `DEPLOY_HOSTGATOR` | `true` |
| Variable | `HOSTGATOR_DIR` | target directory, defaults to `public_html/` |
| Secret | `HOSTGATOR_FTP_SERVER` | e.g. `ftp.xpresshawala.com` |
| Secret | `HOSTGATOR_FTP_USERNAME` | cPanel or FTP account username |
| Secret | `HOSTGATOR_FTP_PASSWORD` | that account's password |

Credentials belong in GitHub Secrets, never in the repository. The job uses FTPS on port 21
and only replaces files the build produces, leaving anything else in the directory alone.

### GitHub Pages

Set the variable `DEPLOY_PAGES` to `true`, **and** set **Settings → Pages → Build and
deployment → Source** to **GitHub Actions**. Creating a Pages site needs repo-admin rights
that the workflow token does not have, so that switch has to be flipped by hand once.

## What's in it

Every screen from the mockups is implemented and connected — you can walk the whole
send-money journey end to end.

| Route | Screen |
| --- | --- |
| `/` | Home — greeting, voice hero, service grid, recent transaction, recipients, quick actions |
| `/voice` | Voice assistant — listening state, countdown, sample prompts |
| `/assistant` | AI assistant chat — scripted transfer confirmation with a quote card |
| `/send` | Send Money — amount entry, live conversion, recipient picker, payment method |
| `/review` | Review & Confirm — summary, security notice, Face ID / PIN verification |
| `/success` | Transfer complete — receipt, reference ID, share |
| `/recipients` | Recipients — search, favourites, full list |
| `/activity` | Activity — monthly total, filters, transfer history |
| `/profile` | Profile — account, language, settings, company footer |
| `/rates` | Live rates across all corridors |
| `/help` | Help Center FAQ |
| `/refer` | Refer & Earn |
| `/support` | Live Support |

On a phone the app fills the screen. On a desktop it renders inside a device frame with a
screen index in the sidebar, so every page is reachable without walking the flow.

## Structure

```
src/
  config/brand.ts        Company name, HQ address, support details, reference prefix
  i18n/                  Translation provider + en.ts / so.ts dictionaries
  data/mock.ts           Recipients, corridors & rates, payment methods, transactions
  state/TransferContext  Current transfer, live quote, transfer history
  components/            Layout shell, bottom nav, language switcher, shared UI kit
  screens/               One file per screen
  lib/format.ts          Currency, rate, date and reference-ID formatting
```

### Changing the brand

Everything user-visible about the company lives in `src/config/brand.ts` — name, assistant
name, receipt prefix, Seattle HQ address, support contacts and licence line. Change `name`
there and the logo, page copy, chat header and footers all follow.

### Adding a language

1. Copy `src/i18n/so.ts`, translate the values (the keys are typed against `en.ts`, so a
   missing key is a compile error).
2. Add the code to `Lang` and the `LANGUAGES` list in `src/i18n/langs.ts`, including its
   `dir` (`'ltr'` or `'rtl'`) and the browser tags it should match on first visit.
3. Register the dictionary in `dictionaries` in `src/i18n/index.tsx`.
4. Add the country and relationship labels to `countryI18n` / `relationI18n` in
   `src/data/mock.ts` — both fall back to English when a language is missing.

The chosen language persists in `localStorage`; a browser set to one of the supported
languages gets it on first visit, everyone else gets English.

### Right-to-left

`I18nProvider` writes `lang` and `dir` onto `<html>` whenever the language changes, so
Arabic flips the document and every other language flips it back. Layout uses logical
Tailwind utilities (`text-start`/`text-end`, `start-*`/`end-*`) rather than physical
`left`/`right` ones, so it mirrors for free. Icons that carry a direction — the back
chevron, list-row chevrons, the send arrow — take `useMirrorClass()` from `src/i18n`,
which applies `scale-x-[-1]` under RTL. Latin runs inside Arabic text (phone numbers,
reference IDs, masked wallets) are wrapped in `<bdi>` so the bidi algorithm keeps them
intact.

### Rates and fees

Corridor rates and the flat fee live in `src/data/mock.ts` and are static sample data —
swap `corridors` for a rates API call when there's a backend. Fee handling is controlled by
`FEE_MODE` in `src/state/TransferContext.tsx`: `'added'` (default) charges the sender
amount + fee and delivers the full amount to the recipient; `'deducted'` takes the fee out
of what the recipient receives.

> Note: the mockups show `Total $504.99` (amount + fee) *and* `Recipient Gets $495.01`
> (amount − fee) on the same transfer, which charges the fee twice. This build applies the
> fee once, using `FEE_MODE`.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · React Router · lucide-react. No backend —
transfers are simulated in memory, so the app resets on reload.
