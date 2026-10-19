import { expect, test, type Locator, type Page } from '@playwright/test'
import { mockMarket } from './fixtures/market'

async function angle(phone: Locator) {
  return phone.evaluate((element) => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform)
    return Math.atan2(matrix.b, matrix.a) * 180 / Math.PI
  })
}

async function expectAngle(phone: Locator, degrees: number) {
  await expect.poll(async () => Math.abs(await angle(phone) - degrees)).toBeLessThan(0.15)
}

async function layout(phone: Locator) {
  return phone.evaluate((element) => [element.offsetWidth, element.offsetHeight])
}

async function outside(page: Page) {
  await page.mouse.move(4, 4)
  await page.locator('.a11y-launcher').focus()
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', (route) => route.fulfill({ status: 401, json: { error: 'unauthorized' } }))
  await mockMarket(page)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
})

test('the homepage phone tilts at rest and straightens for its screen, adjacent copy and keyboard tabs', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const section = page.locator('#experience')
  const phone = section.locator('.brand-device')
  await phone.scrollIntoViewIfNeeded()
  await outside(page)
  await expectAngle(phone, -5)
  const original = await layout(phone)
  await phone.hover()
  await expectAngle(phone, 0)
  await outside(page)
  await expectAngle(phone, -5)
  await section.locator('.brand-experience-copy').hover()
  await expectAngle(phone, 0)
  await outside(page)
  await expectAngle(phone, -5)

  const send = section.getByRole('tab', { name: 'Send', exact: true })
  await send.focus()
  await expectAngle(phone, 0)
  await page.keyboard.press('ArrowRight')
  await expect(section.getByRole('tab', { name: 'People', exact: true })).toBeFocused()
  await expect(section.locator('.app-preview')).toHaveAttribute('data-screen', 'people')
  expect(await layout(phone)).toEqual(original)
  await outside(page)
  await expectAngle(phone, -5)
  await page.goto('/#/demo')
  const demo = page.locator('.demo-phone')
  await expect(demo).toBeVisible()
  expect(await layout(demo)).toEqual(original)
  await expect(demo).toHaveCSS('transform', 'none')
})

test.describe('touchscreen phone tilt', () => {
  test.use({ hasTouch: true, isMobile: true })
  for (const lang of ['en', 'ar']) {
    test(`the ${lang} phone fits narrow screens and stays upright for touch interactions until an outside tap`, async ({ page }) => {
      await page.addInitScript((lang) => {
        localStorage.setItem('xpresstend.lang', lang)
        if (lang === 'ar')
          localStorage.setItem('xpresstend.accessibility', JSON.stringify({ text: 'largest', spacing: true }))
      }, lang)
      for (const width of [390, 320]) {
        await page.setViewportSize({ width, height: 844 })
        await page.goto('/')
        const section = page.locator('#experience')
        const phone = section.locator('.brand-device')
        await phone.scrollIntoViewIfNeeded()
        await expectAngle(phone, -1.5)
        const original = await layout(phone)
        const bounds = (await phone.boundingBox())!
        expect(bounds.x).toBeGreaterThanOrEqual(0)
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(width)
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
        // Real taps must keep working while the handset settles upright.
        await phone.locator('.tour-controls button').nth(2).tap()
        await expectAngle(phone, 0)
        await expect(phone.locator('.app-tour')).toHaveAttribute('data-tour-step', 'signin')
        await phone.locator('.tour-action').tap()
        await expect(phone.locator('.app-tour')).toHaveAttribute('data-tour-step', 'document')
        await expectAngle(phone, 0)
        await section.locator('.brand-experience-copy h2').tap()
        await expect(section).toHaveAttribute('data-phone-engaged', 'true')
        await expectAngle(phone, 0)
        await section.locator('.brand-tabs button').nth(1).tap()
        await expect(phone.locator('.app-preview')).toHaveAttribute('data-screen', 'people')
        expect(await layout(phone)).toEqual(original)
        await page.locator('.a11y-launcher').tap()
        await expect(section).toHaveAttribute('data-phone-engaged', 'false')
        await expectAngle(phone, -1.5)
        await page.keyboard.press('Escape')
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await section.locator('.brand-experience-copy h2').tap()
        await expect(section).toHaveAttribute('data-phone-engaged', 'true')
        await expect(phone).toHaveCSS('transform', 'none')
        await expect(phone).toHaveCSS('transition-duration', '0s')
        await page.emulateMedia({ reducedMotion: 'no-preference' })
      }
    })
  }
})

test('device and saved reduced motion keep the phone upright without transitions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const phone = page.locator('.brand-device')
  await phone.scrollIntoViewIfNeeded()
  await outside(page)
  await expectAngle(phone, 0)
  await expect(phone).toHaveCSS('transition-duration', '0s')
  await phone.hover()
  await expect(phone).toHaveCSS('transform', 'none')
  await phone.locator('.tour-controls button').nth(1).focus()
  await expect(phone).toHaveCSS('transform', 'none')
  await expect(phone).toHaveCSS('transition-duration', '0s')
  await outside(page)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expectAngle(phone, -5)
  await page.locator('.a11y-launcher').click()
  await page.locator('.a11y-dialog').getByLabel('Motion', { exact: true }).selectOption('reduce')
  await page.keyboard.press('Escape')
  await expectAngle(phone, 0)
  await expect(phone).toHaveCSS('transition-duration', '0s')
  await page.reload()
  await phone.scrollIntoViewIfNeeded()
  await expectAngle(phone, 0)
  await page.locator('.a11y-launcher').click()
  await page.locator('.a11y-dialog').getByLabel('Motion', { exact: true }).selectOption('system')
  await page.keyboard.press('Escape')
  await outside(page)
  await expectAngle(phone, -5)
})
