import { expect, test } from '@playwright/test'
import { interfaceMessages } from '../src/i18n/interfaceCopy'

test('the demo keeps a clear, keyboard-friendly journey and consistent sample details', async ({
  page,
}) => {
  const apiRequests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/api/')) apiRequests.push(request.url())
  })
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto('/#/demo')
  await page.getByRole('button', { name: 'People', exact: true }).click()
  await expect(page.locator('.demo-content h2')).toBeFocused()
  await expect(page.locator('.demo-person')).toHaveCount(2)
  await expect(page.locator('.demo-person').first()).toContainText(
    'Sam Erikson',
  )
  await page.getByRole('button', { name: /Farah Bilingsley/ }).click()
  await expect(
    page.locator('.demo-progress [aria-current=step]'),
  ).toContainText('Send')
  const amount = page.getByLabel('Sample amount (USD)', { exact: true })
  await amount.fill('0')
  await page
    .getByRole('button', { name: 'Review demo transfer', exact: true })
    .click()
  await expect(amount).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('alert')).toContainText('between $1 and $10,000')
  await amount.fill('125.50')
  await expect(page.locator('.demo-estimate')).toContainText('$126.49')
  await expect(amount).toHaveAttribute('aria-invalid', 'false')
  await page
    .getByRole('button', { name: 'Review demo transfer', exact: true })
    .click()
  await expect(page.locator('.demo-content h2')).toBeFocused()
  await expect(
    page.locator('.demo-progress [aria-current=step]'),
  ).toContainText('Review your demo')
  await expect(page.locator('.demo-summary')).toContainText('Farah Bilingsley')
  await page
    .getByRole('button', { name: 'Edit sample details', exact: true })
    .click()
  await expect(amount).toHaveValue('125.50')
  await expect(page.locator('.demo-form select')).toHaveValue(
    'Farah Bilingsley',
  )
  await page
    .getByRole('button', { name: 'Review demo transfer', exact: true })
    .click()
  await page.getByRole('button', { name: 'Complete demo', exact: true }).click()
  await expect(
    page.locator('.demo-progress [aria-current=step]'),
  ).toContainText('Demo complete')
  await page
    .getByRole('button', { name: 'View demo activity', exact: true })
    .click()
  await expect(page.locator('.demo-content')).toContainText('Farah Bilingsley')
  await expect(page.locator('.demo-content')).toContainText('No money sent')
  await expect(page.locator('.demo-bottom')).toBeInViewport()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320)
  expect(
    await page.evaluate(() => document.documentElement.scrollHeight),
  ).toBeLessThanOrEqual(740)
  expect(apiRequests).toEqual([])
})

test('demo type stays legible and screen transitions honor reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/#/demo')
  await expect(page.locator('.demo-screen')).toHaveCSS('animation-name', 'none')
  for (const selector of [
    '.demo-muted',
    '.demo-mini-grid small',
    '.demo-bottom button:not([aria-current])',
  ]) {
    const text = page.locator(selector).first()
    expect(
      await text.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeGreaterThanOrEqual(13)
    const contrast = await text.evaluate((el) => {
      const rgb = (value: string) =>
        value
          .match(/[\d.]+/g)!
          .slice(0, 3)
          .map(Number)
      const luminance = (channels: number[]) =>
        channels
          .map((n) => {
            const v = n / 255
            return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
          })
          .reduce((sum, n, i) => sum + n * [0.2126, 0.7152, 0.0722][i], 0)
      let surface: Element | null = el
      while (
        surface &&
        getComputedStyle(surface).backgroundColor === 'rgba(0, 0, 0, 0)'
      )
        surface = surface.parentElement
      const foreground = luminance(rgb(getComputedStyle(el).color))
      const background = luminance(
        rgb(
          surface
            ? getComputedStyle(surface).backgroundColor
            : 'rgb(255, 255, 255)',
        ),
      )
      return (
        (Math.max(foreground, background) + 0.05) /
        (Math.min(foreground, background) + 0.05)
      )
    })
    expect(contrast).toBeGreaterThanOrEqual(4.5)
  }
})

test('larger text keeps the translated demo inside a narrow phone with a full-size exit target', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 })
  for (const lang of ['en', 'es', 'pt-BR', 'ar']) {
    await page.goto('/')
    await page.evaluate((lang) => {
      localStorage.setItem('xpresstend.lang', lang)
      localStorage.setItem(
        'xpresstend.accessibility',
        JSON.stringify({ text: 'largest' }),
      )
    }, lang)
    await page.goto('/?large-demo=' + lang + '#/demo')
    const index = ['es', 'pt-BR', 'ar'].indexOf(lang)
    const p = (s: string) => (index < 0 ? s : interfaceMessages[s][index])
    await page.getByRole('button', { name: p('Send'), exact: true }).click()
    await expect(page.locator('.demo-progress')).toBeVisible()
    for (const selector of [
      '.demo-phone',
      '.demo-content',
      '.demo-top',
      '.demo-bottom',
    ]) {
      const overflow = await page
        .locator(selector)
        .evaluate((el) => el.scrollWidth - el.clientWidth)
      expect(overflow, selector + ':' + lang).toBeLessThanOrEqual(1)
    }
    expect(
      (await page
        .getByRole('link', { name: p('Exit demo'), exact: true })
        .boundingBox())!.width,
    ).toBeGreaterThanOrEqual(44)
    await expect(page.locator('.demo-bottom')).toBeInViewport()
  }
})
