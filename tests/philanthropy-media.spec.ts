import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: '{"error":"unauthorized"}',
    }),
  )
  await page.route('**/media/community-literacy-poster.webp', (route) =>
    route.fulfill({
      contentType: 'image/webp',
      path: 'public/media/closer-poster.webp',
    }),
  )
})

for (const failure of ['decode', 'network'] as const) {
  test(`the philanthropy banner restores its still fallback after a ${failure} failure`, async ({
    page,
  }) => {
    let requestedFilm = false
    await page.route('**/media/community-literacy.mp4', async (route) => {
      if (route.request().method() === 'HEAD') {
        await route.fulfill({ status: 200, contentType: 'video/mp4', body: '' })
        return
      }
      requestedFilm = true
      if (failure === 'network') await route.abort('failed')
      else
        await route.fulfill({
          status: 200,
          contentType: 'video/mp4',
          body: 'invalid-video',
        })
    })
    await page.goto('/#/philanthropy')
    const banner = page.getByRole('region', {
      name: 'XpressTend Financial Literacy',
      exact: true,
    })
    await expect(banner.getByRole('heading', { level: 1 })).toBeVisible()
    await expect.poll(() => requestedFilm).toBe(true)
    await expect(banner.locator('video')).toHaveCount(0)
    await expect(banner.getByRole('button', { name: /the film/ })).toHaveCount(
      0,
    )
    await expect(banner.locator('div[aria-hidden="true"]').first()).toHaveCSS(
      'background-image',
      /radial-gradient/,
    )
    await expect(
      page.getByRole('link', {
        name: 'Contact XpressTend Financial Literacy',
        exact: true,
      }),
    ).toBeVisible()
  })
}

test('an available banner film plays silently and stops when reduced motion is enabled', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.route('**/media/community-literacy.mp4', async (route) => {
    if (route.request().method() === 'HEAD') {
      await route.fulfill({ status: 200, contentType: 'video/mp4', body: '' })
    } else {
      await route.fulfill({
        contentType: 'video/mp4',
        path: 'public/media/closer.mp4',
      })
    }
  })
  await page.goto('/#/philanthropy')
  const film = page.locator('video')
  await expect
    .poll(() =>
      film.evaluate((element: HTMLVideoElement) => element.currentTime),
    )
    .toBeGreaterThan(0)
  await expect(film).toHaveJSProperty('muted', true)
  await expect(
    page.getByRole('button', { name: 'Pause the film', exact: true }),
  ).toBeVisible()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(film).toHaveJSProperty('paused', true)
  await expect(
    page.getByRole('button', { name: 'Play the film', exact: true }),
  ).toBeVisible()
})

for (const language of ['en', 'ar']) {
  test(`the film keeps ${language} copy readable over bright footage`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.addInitScript(
      (language) => localStorage.setItem('xpresstend.lang', language),
      language,
    )
    await page.route('**/media/community-literacy.mp4', (route) =>
      route.request().method() === 'HEAD'
        ? route.fulfill({ status: 200, contentType: 'video/mp4', body: '' })
        : route.fulfill({
            contentType: 'video/mp4',
            path: 'public/media/closer.mp4',
          }),
    )
    await page.goto('/#/philanthropy')
    const film = page.locator('.philanthropy-banner-film')
    await expect
      .poll(() =>
        film.evaluate((element: HTMLVideoElement) => element.currentTime),
      )
      .toBeGreaterThan(0)
    // A pure white video frame exercises the worst-case footage brightness.
    await film.evaluate(async (element: HTMLVideoElement) => {
      const canvas = document.createElement('canvas')
      canvas.width = 64
      canvas.height = 64
      const context = canvas.getContext('2d')!
      context.fillStyle = '#fff'
      context.fillRect(0, 0, 64, 64)
      const stream = canvas.captureStream(0)
      element.srcObject = stream
      const frame = new Promise<void>((resolve) =>
        element.requestVideoFrameCallback(() => resolve()),
      )
      const playback = element.play()
      const track = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack
      track.requestFrame()
      await playback
      await frame
    })
    const media = page.locator('.philanthropy-banner-media')
    const scrim = page.locator('.philanthropy-film-scrim')
    const mediaLayer = await media.evaluate((element) =>
      Number(getComputedStyle(element).zIndex),
    )
    const scrimLayer = await scrim.evaluate((element) =>
      Number(getComputedStyle(element).zIndex),
    )
    expect(mediaLayer).toBeLessThan(scrimLayer)
    const intro = page.locator(
      '.philanthropy-hero .institutional-hero-copy > p:not(.institutional-eyebrow):not(.sr-only)',
    )
    const bounds = (await intro.boundingBox())!
    const text = await intro.evaluate(
      (element) => getComputedStyle(element).color,
    )
    const screenshot = (await page.screenshot()).toString('base64')
    const contrast = await page.evaluate(
      async ({ screenshot, bounds, text }) => {
        const image = new Image()
        image.src = `data:image/png;base64,${screenshot}`
        await image.decode()
        const canvas = document.createElement('canvas')
        canvas.width = image.width
        canvas.height = image.height
        const context = canvas.getContext('2d')!
        context.drawImage(image, 0, 0)
        const luminance = (channels: number[]) => {
          const linear = channels.map((channel) => {
            const value = channel / 255
            return value <= 0.04045
              ? value / 12.92
              : ((value + 0.055) / 1.055) ** 2.4
          })
          return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722
        }
        const samples: number[] = []
        for (let y = bounds.y + 2; y < bounds.y + bounds.height - 2; y += 4) {
          for (let x = bounds.x + 2; x < bounds.x + bounds.width - 2; x += 4) {
            samples.push(
              luminance(
                Array.from(context.getImageData(x, y, 1, 1).data).slice(0, 3),
              ),
            )
          }
        }
        samples.sort((a, b) => a - b)
        // Median sampling excludes the small number of pixels occupied by glyphs.
        const backdrop = samples[Math.floor(samples.length / 2)]
        const foreground = luminance(
          text
            .match(/[\d.]+/g)!
            .slice(0, 3)
            .map(Number),
        )
        return (foreground + 0.05) / (backdrop + 0.05)
      },
      { screenshot, bounds, text },
    )
    expect(contrast).toBeGreaterThanOrEqual(4.5)
  })
}

test('the philanthropy river stays circular, flows only while visible and respects reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/#/philanthropy')
  const river = page.locator('.philanthropy-habitat .xt-river')
  await river.scrollIntoViewIfNeeded()
  await expect(river).toHaveAttribute('data-scene', 'original-waterways')
  await expect(river.locator('clipPath circle')).toHaveCount(1)
  await expect(river.locator('image')).toHaveCount(0)
  await expect(river.locator('.xt-river-banks path')).toHaveCount(3)
  await expect(river).toHaveAttribute('data-active', 'true')
  const current = river.locator('.xt-river-current').first()
  const offset = await current.evaluate(
    (element) => getComputedStyle(element).strokeDashoffset,
  )
  await expect
    .poll(() =>
      current.evaluate((element) => getComputedStyle(element).strokeDashoffset),
    )
    .not.toBe(offset)
  await page.evaluate(() =>
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'instant',
    }),
  )
  await expect(river).toHaveAttribute('data-active', 'false')
  await expect(current).toHaveCSS('animation-play-state', 'paused')
  const paused = await current.evaluate(
    async (element) => {
      // CSS pause has a pending animation task until the browser commits it.
      // Sample the frozen position after that task, rather than the DOM flag.
      await Promise.all(element.getAnimations().map((animation) => animation.ready))
      return getComputedStyle(element).strokeDashoffset
    },
  )
  await page.evaluate(async () => {
    for (let frame = 0; frame < 6; frame++)
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      )
  })
  expect(
    await current.evaluate(
      (element) => getComputedStyle(element).strokeDashoffset,
    ),
  ).toBe(paused)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 320, height: 844 })
  await river.scrollIntoViewIfNeeded()
  await expect(river).toHaveAttribute('data-active', 'false')
  await expect(current).toHaveCSS('animation-name', 'none')
  const bounds = await river.boundingBox()
  expect(bounds!.width).toBeCloseTo(bounds!.height, 1)
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320)
})
