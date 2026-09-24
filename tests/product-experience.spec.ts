import { expect, test } from '@playwright/test'

// Deterministic, offline API fixtures: these checks never touch customer data.
test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: '{"error":"unauthorized"}',
    }),
  )
})

test('homepage loops the film silently with no route to audio, and omits preview furniture', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Connection stays.',
  )
  await expect(
    page.getByText(
      /Replay film|Sound on|Full screen|Concept preview|Private creative preview/,
    ),
  ).toHaveCount(0)
  const video = page.locator('video')

  /*
   * The film is an ambient loop now, so the guarantees worth holding are
   * different from before: it must run by itself, keep running, and offer no
   * route to audio.
   *
   * No controls is what removes the audio. `muted` alone leaves a volume
   * slider in the control bar, so asserting muted without asserting the
   * absence of controls would pass on a video anyone could unmute.
   */
  await expect(video).toHaveAttribute('loop', '')
  await expect(video).not.toHaveAttribute('controls', /.*/)
  /*
   * Muted is checked on the DOM property, not the attribute. React assigns
   * `muted` as a property and never writes the attribute, so asserting the
   * attribute fails on a video that is genuinely silent. The property is also
   * the thing that actually governs playback, so it is the better assertion
   * regardless.
   */
  expect(await video.evaluate((v) => (v as HTMLVideoElement).muted)).toBe(true)
  expect(await video.evaluate((v) => (v as HTMLVideoElement).controls)).toBe(false)
  // preload=metadata: it has to start unprompted, but must not pull the whole
  // file down on a phone before the section is even in view.
  await expect(video).toHaveAttribute('preload', 'metadata')

  /*
   * Scrolled to first, because the film sits below the fold and Chrome holds
   * playback on an off-screen video to save power and data. That deferral is
   * wanted, not worked around: an ambient loop nobody can see should not be
   * decoding. So this reaches the section the way a visitor does, then asserts
   * it starts on its own from there.
   */
  await video.scrollIntoViewIfNeeded()
  await expect
    .poll(() => video.evaluate((v) => (v as HTMLVideoElement).currentTime))
    .toBeGreaterThan(0)
  expect(await video.evaluate((v) => (v as HTMLVideoElement).paused)).toBe(false)
  expect(await video.evaluate((v) => (v as HTMLVideoElement).videoWidth)).toBe(
    1920,
  )
  expect(
    await video.evaluate((v) => (v as HTMLVideoElement).duration),
  ).toBeCloseTo(26, 0)
  /*
   * The old flow revealed native controls once playback began, and asserted
   * they appeared. They must never appear now, which is checked above; this is
   * where the previous expectation lived and it would contradict that.
   */
  expect(errors).toEqual([])
})

test('app feature tabs support keyboard selection and load actual app images', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('tab', { name: 'Send', exact: true }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(
    page.getByRole('tab', { name: 'People', exact: true }),
  ).toBeFocused()
  await expect(page.getByRole('tabpanel')).toContainText('Start with someone.')
  await page.keyboard.press('End')
  await expect(page.getByRole('tabpanel')).toContainText('Follow every step.')
  const image = page.locator('.brand-device img')
  await image.scrollIntoViewIfNeeded()
  await expect
    .poll(() => image.evaluate((img) => (img as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0)
})

test('download disclosure has valid targets, closes on Escape, and restores focus', async ({
  page,
}) => {
  await page.goto('/')
  const download = page.getByRole('button', {
    name: 'Download the app',
    exact: true,
  })
  await download.click()
  const popover = page.locator('.brand-download-popover')

  /*
   * Neither app is released, so the guarantee is the opposite of before: there
   * must be no link to a build at all. Asserting the absence of an href is the
   * point — a disabled-looking card that still carries a download URL is
   * exactly the mistake this catches, since anyone can read the markup.
   */
  await expect(popover.getByText(/Android/)).toBeVisible()
  await expect(popover.getByText(/iPhone/)).toBeVisible()
  await expect(popover.getByText('In release preparation').first()).toBeVisible()
  await expect(popover.getByRole('link', { name: /Android/ })).toHaveCount(0)
  await expect(popover.getByRole('link', { name: /iPhone/ })).toHaveCount(0)
  await expect(popover.locator('a[href*="xpresstend.apk"]')).toHaveCount(0)

  // The one live action while both are unreleased, so the menu is not a dead end.
  await expect(popover.getByRole('link')).toHaveAttribute(
    'href',
    /^mailto:support@xpresstend.com/,
  )

  await page.keyboard.press('Escape')
  await expect(popover).toHaveCount(0)
  await expect(download).toBeFocused()
})

test('explore enters the actual app, navigates, and exits to the website', async ({
  page,
}) => {
  const writes: string[] = []
  page.on('request', (request) => {
    if (request.method() === 'POST' && /\/api\//.test(request.url()))
      writes.push(request.url())
  })
  await page.goto('/')
  await page
    .getByRole('button', { name: 'Explore the app', exact: true })
    .first()
    .click()
  await expect(page).toHaveURL(/#\/app$/)
  await expect(page.getByText('Explore mode · Sample data')).toBeVisible()
  await page
    .locator('.product-phone')
    .getByRole('link', { name: 'Recipients', exact: true })
    .click()
  await expect(page).toHaveURL(/#\/recipients$/)
  await page.getByRole('button', { name: 'Leave explore mode' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Money moves.',
  )
  expect(writes).toEqual([])
})

test('guest transfer walkthrough completes locally without asking for a real password', async ({
  page,
}) => {
  const writes: string[] = []
  page.on('request', (request) => {
    if (request.method() === 'POST' && /\/api\//.test(request.url()))
      writes.push(request.url())
  })
  await page.goto('/')
  await page
    .getByRole('button', { name: 'Explore the app', exact: true })
    .first()
    .click()
  await page.locator('.product-send-card > button').click()
  await expect(page).toHaveURL(/#\/send$/)
  await page.getByRole('button', { name: /Continue/i }).click()
  await expect(page).toHaveURL(/#\/review$/)
  await page.getByRole('button', { name: /^Send \$/ }).click()
  await expect(page).toHaveURL(/#\/success$/)
  await expect(page.locator('input[type=password]')).toHaveCount(0)
  await expect(page.getByText('Explore mode · Sample data')).toBeVisible()
  expect(writes).toEqual([])
})

test('a signed-in empty account never sees the tour recipients or history on Home', async ({
  page,
}) => {
  await page.route('**/api/**', (route) => {
    const endpoint = new URL(route.request().url()).pathname
    const body = endpoint.endsWith('/auth/me')
      ? {
          user: {
            id: 'customer-test',
            firstName: 'Taylor',
            lastName: 'Test',
            email: 'test@example.com',
            kycStatus: 'pending',
            kycTier: 0,
            status: 'active',
          },
        }
      : endpoint.endsWith('/recipients')
        ? { recipients: [] }
        : endpoint.endsWith('/transfers')
          ? { transfers: [] }
          : {}
    return route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })
  await page.goto('/#/app')
  await expect(page.locator('.product-home-greeting')).toContainText('Taylor')
  await expect(page.getByText('Explore mode · Sample data')).toHaveCount(0)
  await expect(
    page.getByText('Add new recipient', { exact: true }),
  ).toBeVisible()
  await expect(page.locator('.product-home-section ul li')).toHaveCount(0)
})

for (const width of [320, 390, 768, 1440]) {
  test(`homepage and app fit a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await expect(
      page.getByRole('button', { name: 'Download the app', exact: true }),
    ).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width)
    await page
      .getByRole('button', { name: 'Explore the app', exact: true })
      .first()
      .click()
    await expect(page).toHaveURL(/#\/app$/)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width)
  })
}

for (const language of ['so', 'es', 'pt-BR', 'ar']) {
  test(`editorial page and app work in ${language}`, async ({ page }) => {
    await page.addInitScript(
      (language) => localStorage.setItem('xpresstend.lang', language),
      language,
    )
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('lang', language)
    await expect(page.locator('html')).toHaveAttribute(
      'dir',
      language === 'ar' ? 'rtl' : 'ltr',
    )
    await expect(page.getByRole('heading', { level: 1 })).not.toContainText(
      'Money moves.',
    )
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(390)
    await page.locator('.brand-actions .brand-primary').click()
    await expect(page).toHaveURL(/#\/app$/)
    await expect(page.locator('.product-explore-bar')).toBeVisible()
  })
}

test('reduced motion keeps the video paused and removes decorative animation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  expect(
    await page.locator('video').evaluate((v) => (v as HTMLVideoElement).paused),
  ).toBe(true)
  expect(
    await page
      .locator('.brand-hero')
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('none')
})

test('Watch the film starts playback from the hero', async ({ page }) => {
  await page.goto('/')
  await page
    .getByRole('button', { name: 'Watch the film', exact: true })
    .click()
  await expect
    .poll(() =>
      page
        .locator('video')
        .evaluate((v) => (v as HTMLVideoElement).currentTime),
    )
    .toBeGreaterThan(0)
})

test('real accounts still require a password before any transfer submission', async ({
  page,
}) => {
  const writes: string[] = []
  page.on('request', (request) => {
    if (request.method() === 'POST' && /\/api\//.test(request.url()))
      writes.push(request.url())
  })
  await page.route('**/api/**', (route) => {
    const endpoint = new URL(route.request().url()).pathname
    const body = endpoint.endsWith('/auth/me')
      ? {
          user: {
            id: 'customer-test',
            firstName: 'Taylor',
            lastName: 'Test',
            email: 'test@example.com',
            kycStatus: 'approved',
            kycTier: 1,
            status: 'active',
          },
        }
      : endpoint.endsWith('/recipients')
        ? {
            recipients: [
              {
                id: 'recipient-test',
                full_name: 'Test Recipient',
                country: 'SO',
                payout_method: 'mobile_wallet',
                phone: '+252610000000',
                bank_name: null,
                relationship: 'Family',
                created_at: '2026-01-01',
              },
            ],
          }
        : endpoint.endsWith('/transfers')
          ? { transfers: [] }
          : {}
    return route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })
  await page.goto('/#/send')
  await page.getByRole('button', { name: /Continue/i }).click()
  await expect(page).toHaveURL(/#\/review$/)
  await page.getByRole('button', { name: /^Send \$/ }).click()
  await expect(page.locator('input[type=password]')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Authorise transfer', exact: true }),
  ).toBeDisabled()
  expect(writes).toEqual([])
})

/**
 * The institutional pages exist for people doing diligence, so the checks are
 * about substance being present and reachable rather than about styling: a
 * partner who cannot find the registration, or who finds a broken link to the
 * register, draws exactly the conclusion the pages are there to prevent.
 */
test('the company pages are reachable and carry the registration', async ({ page }) => {
  await page.goto('/')

  // Reachable from the landing page rather than only by typing a URL.
  await page.getByRole('link', { name: 'Compliance', exact: true }).first().click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Compliance')

  // The registration, the verification route, and the limits that are enforced.
  await expect(page.getByText('NMLS ID 2900672').first()).toBeVisible()
  await expect(
    page.getByRole('link', { name: /NMLS Consumer Access/ }).first(),
  ).toHaveAttribute('href', 'https://www.nmlsconsumeraccess.org/')
  await expect(page.getByRole('table')).toContainText('No transfers permitted')

  // Where the company actually stands is stated, not hidden behind a toggle.
  await expect(page.getByText(/does not hold or move customer funds/).first()).toBeVisible()

  for (const [path, heading] of [
    ['company', 'Company'],
    ['security', 'Security and platform'],
    ['partners', 'Partnerships'],
  ] as const) {
    await page.goto(`/#/${path}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading)
    // Every formal page repeats the registration, because each is landed on
    // directly as often as it is navigated to.
    await expect(page.getByText(/NMLS ID 2900672/).first()).toBeVisible()
  }
})

test('every company link in the footer resolves to a real page', async ({ page }) => {
  await page.goto('/')
  const footer = page.locator('.brand-footer')
  for (const name of ['Company', 'Compliance', 'Security', 'Partnerships']) {
    const href = await footer.getByRole('link', { name, exact: true }).getAttribute('href')
    expect(href).toBeTruthy()
    await page.goto(href!.startsWith('#') ? `/${href}` : href!)
    // A route that falls through to the catch-all lands back on the marketing
    // page, which is the failure this catches.
    await expect(page.getByRole('heading', { level: 1 })).not.toHaveText('Money moves.')
    await page.goto('/')
  }
})

/*
 * The jump lists on the document pages were every one of them a dead link.
 *
 * The app is served by a hash router, so the whole route lives in
 * location.hash. A plain href="#limits" therefore replaced the route rather
 * than scrolling within it, matched nothing, and the catch-all returned the
 * reader to the landing page — from the compliance page, mid-read, on the one
 * document a banking partner opens first. It is a class of bug that looks
 * correct in the markup and only shows itself when clicked, which is why it
 * gets a test rather than a comment.
 */
test('every jump link on the document pages stays on its page and finds its section', async ({
  page,
}) => {
  for (const route of ['company', 'compliance', 'security', 'partners', 'support']) {
    await page.goto(`/#/${route}`)
    const links = page.locator('nav[aria-label="On this page"] a')
    const count = await links.count()
    expect(count).toBeGreaterThan(0)

    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href')
      expect(href, `${route} jump link ${i} has no href`).toBeTruthy()

      // Followed as a cold URL, which is how a forwarded section link arrives.
      await page.goto(`/${href}`)
      const target = href!.split('#').pop()!
      await expect(page.locator(`#${target}`)).toHaveCount(1)
      // Landing back on the marketing page is the failure this catches.
      await expect(page.getByRole('heading', { level: 1 })).not.toHaveText(
        /Money moves/,
      )
    }
  }
})

/*
 * The header and footer are one component each rather than one per page. A
 * reader crossing from the landing page to the compliance page should not be
 * able to tell they have changed template, because a visible seam there is
 * read as two sites stitched together.
 */
test('every public page wears the same header and footer', async ({ page }) => {
  const columns = ['Company', 'Product', 'Legal']
  for (const route of ['', 'company', 'compliance', 'security', 'partners', 'privacy', 'support']) {
    await page.goto(`/#/${route}`)
    await expect(page.locator('header.brand-header')).toHaveCount(1)
    await expect(page.locator('footer.brand-footer')).toHaveCount(1)
    for (const column of columns) {
      await expect(
        page.locator('.brand-footer-columns').getByRole('heading', { name: column, exact: true }),
      ).toBeVisible()
    }
    // The registration travels with the footer, so it is on every page.
    await expect(page.getByText(/NMLS ID 2900672/).first()).toBeVisible()
  }
})

/*
 * Six tabs open from one diligence session used to carry six identical titles,
 * and a forwarded link previewed as the home page whatever it pointed at.
 */
test('each document page sets its own title and description', async ({ page }) => {
  const pages = [
    ['company', 'Company | XpressTend'],
    ['compliance', 'Compliance | XpressTend'],
    ['security', 'Security and platform | XpressTend'],
    ['partners', 'Partnerships | XpressTend'],
    ['privacy', 'Privacy Policy | XpressTend'],
    ['support', 'Support | XpressTend'],
  ] as const

  const seen = new Set<string>()
  for (const [route, title] of pages) {
    await page.goto(`/#/${route}`)
    await expect(page).toHaveTitle(title)
    const description = await page
      .locator('meta[name="description"]')
      .getAttribute('content')
    expect(description, `${route} has no description`).toBeTruthy()
    expect(seen.has(description!), `${route} reuses another page's description`).toBe(false)
    seen.add(description!)
    // The social card follows the page, not the site.
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', title)
  }
})

/*
 * The public pages are read by people deciding whether this is a company worth
 * integrating with. Development-stage vocabulary on any of them undoes the
 * rest of the page, so the absence is asserted rather than trusted.
 */
test('no public page carries beta or placeholder vocabulary', async ({ page }) => {
  const forbidden =
    /\b(beta|coming soon|under construction|lorem ipsum|TODO|FIXME|TBD|placeholder)\b/i
  for (const route of ['', 'company', 'compliance', 'security', 'partners', 'privacy', 'support']) {
    await page.goto(`/#/${route}`)
    const text = await page.locator('body').innerText()
    expect(text, `/${route} contains development-stage copy`).not.toMatch(forbidden)
  }
})
