import { expect, test } from '@playwright/test'

test('the homepage phone loops through sign-in, verification and sending with playback controls', async ({
  page,
}) => {
  const writes: string[] = []
  page.on('request', (request) => {
    if (
      request.url().includes('/api/') &&
      !['GET', 'HEAD'].includes(request.method())
    )
      writes.push(request.url())
  })
  await page.clock.install()
  await page.goto('/')
  const tour = page.locator('.app-tour')
  await tour.scrollIntoViewIfNeeded()
  await expect(tour).toHaveAttribute('data-playing', 'true')
  const stages = [
    'signin',
    'document',
    'selfie',
    'checks',
    'ready',
    'home',
    'send',
    'review',
    'complete',
  ]
  const durations = [3200, 3400, 3200, 3400, 2600, 2800, 3600, 3400, 3600]
  for (let step = 0; step < stages.length; step++) {
    await expect(tour).toHaveAttribute('data-tour-step', stages[step])
    if (stages[step] === 'document')
      await expect(tour).toContainText('Sample identity document')
    if (stages[step] === 'checks')
      await expect(tour).toContainText('Sanctions screening')
    if (stages[step] === 'review') await expect(tour).toContainText('$126.49')
    if (stages[step] === 'complete')
      await expect(tour).toContainText('No money was sent')
    await page.clock.fastForward(durations[step])
  }
  await expect(tour).toHaveAttribute('data-tour-step', 'signin')
  await tour
    .getByRole('button', { name: 'Pause walkthrough', exact: true })
    .click()
  await page.clock.fastForward(15000)
  await expect(tour).toHaveAttribute('data-tour-step', 'signin')
  await tour
    .getByRole('button', { name: 'Next walkthrough step', exact: true })
    .click()
  await expect(tour).toHaveAttribute('data-tour-step', 'document')
  await tour
    .getByRole('button', { name: 'Restart walkthrough', exact: true })
    .click()
  await expect(tour).toHaveAttribute('data-tour-step', 'signin')
  expect(writes).toEqual([])
  await expect(tour.locator('input[type=file]')).toHaveCount(0)
})

test('the phone and accessibility controls stay slender and reduced motion leaves a manual tour', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const tour = page.locator('.app-tour')
  await tour.scrollIntoViewIfNeeded()
  await expect(tour).toHaveAttribute('data-playing', 'false')
  const mainWidth = await page
    .locator('.brand-device')
    .evaluate((el) => el.offsetWidth)
  await tour
    .getByRole('button', { name: 'Next walkthrough step', exact: true })
    .click()
  await expect(tour).toHaveAttribute('data-tour-step', 'document')
  await expect(tour.locator('.tour-scan')).toHaveCSS('display', 'none')
  await page.goto('/#/demo')
  const phone = page.locator('.demo-phone')
  await expect(phone).toBeVisible()
  expect(await phone.evaluate((el) => el.offsetWidth)).toBe(mainWidth)
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await phone.evaluate((el) => el.offsetWidth)).toBeLessThanOrEqual(288)
  const launcher = page.locator('.a11y-launcher')
  expect((await launcher.boundingBox())!.width).toBeLessThanOrEqual(44)
  await launcher.click()
  const panel = page.getByRole('dialog', { name: 'Accessibility', exact: true })
  expect((await panel.boundingBox())!.width).toBeLessThanOrEqual(280)
  await panel.getByLabel('Increase contrast', { exact: true }).check()
  await expect(page.locator('html')).toHaveAttribute(
    'data-a11y-contrast',
    'true',
  )
  await page.keyboard.press('Escape')
  await expect(launcher).toBeFocused()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390)
})

test('walkthrough mode and manual actions preserve focus and expose review details', async ({
  page,
}) => {
  await page.goto('/')
  const showcase = page.locator('#experience')
  await showcase.getByRole('tab', { name: 'Send', exact: true }).click()
  const switcher = showcase.locator('.brand-tour-replay')
  await switcher.focus()
  await page.keyboard.press('Enter')
  await expect(switcher).toBeFocused()
  await expect(switcher).toHaveText('View selected app screen')
  const tour = page.locator('.app-tour')
  await tour.locator('.tour-action').focus()
  await page.keyboard.press('Enter')
  await expect(
    tour.getByRole('heading', { name: 'Verify your identity', exact: true }),
  ).toBeFocused()
  await expect(tour).toHaveAttribute('data-playing', 'false')
  for (let step = 0; step < 6; step++)
    await tour
      .getByRole('button', { name: 'Next walkthrough step', exact: true })
      .click()
  await expect(tour).toHaveAttribute('data-tour-step', 'review')
  await expect(
    tour.getByRole('definition').filter({ hasText: '$126.49' }),
  ).toBeVisible()
})

test('the accessibility icon never covers demo navigation on short narrow viewports', async ({
  page,
}) => {
  for (const [width, height] of [
    [300, 600],
    [320, 740],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height })
    await page.goto('/#/demo')
    const phone = page.locator('.demo-phone')
    await expect(phone).toBeVisible()
    const phoneBox = (await phone.boundingBox())!
    const iconBox = (await page.locator('.a11y-launcher').boundingBox())!
    expect(iconBox.y).toBeGreaterThanOrEqual(phoneBox.y + phoneBox.height)
    const activity = page
      .locator('.demo-bottom')
      .getByRole('button', { name: 'Activity', exact: true })
    expect(
      await activity.evaluate((el) => {
        const r = el.getBoundingClientRect()
        return el.contains(
          document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2),
        )
      }),
    ).toBe(true)
    await activity.click()
    await expect(page.locator('.demo-content h2')).toHaveText('Your activity')
    expect(
      await page.evaluate(() => document.documentElement.scrollHeight),
    ).toBeLessThanOrEqual(height)
  }
})
