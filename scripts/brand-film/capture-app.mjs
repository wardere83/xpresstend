import { chromium } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
)
try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 780 },
    deviceScaleFactor: 2,
  })
  await page.route('**/api/**', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: '{"error":"unauthorized"}',
    }),
  )
  await page.goto(process.env.APP_URL || 'http://127.0.0.1:5178')
  await page
    .getByRole('button', { name: 'Explore the app', exact: true })
    .first()
    .click()
  await page.waitForURL('**/#/app')
  for (const [name, route] of [
    ['send', 'app'],
    ['people', 'recipients'],
    ['activity', 'activity'],
  ]) {
    await page.evaluate((route) => {
      window.location.hash = `/${route}`
    }, route)
    await page.waitForURL(`**/#/${route}`)
    await page.evaluate(() => document.fonts.ready)
    await page.addStyleTag({
      content:
        '.product-explore-bar{display:none!important} *{animation:none!important;transition:none!important}',
    })
    const png = await page.locator('.product-phone').screenshot()
    const webp = await page.evaluate(async (base64) => {
      const image = new Image()
      image.src = `data:image/png;base64,${base64}`
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      canvas.getContext('2d').drawImage(image, 0, 0)
      return canvas.toDataURL('image/webp', 0.9).split(',')[1]
    }, png.toString('base64'))
    await writeFile(
      new URL(`../../public/media/app-${name}.webp`, import.meta.url),
      Buffer.from(webp, 'base64'),
    )
    console.log(`Captured ${name}`)
  }
} finally {
  await browser.close()
}
