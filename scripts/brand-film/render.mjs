import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const dir = path.dirname(fileURLToPath(import.meta.url))
const output = path.resolve(dir, '../../public/media')
const browser = await chromium.launch({
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : {}),
  args: ['--allow-file-access-from-files'],
})
try {
  await mkdir(output, { recursive: true })
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
  })
  await page.goto(new URL('film.html', import.meta.url).href)
  await page.evaluate(() => window.ready)
  await page.evaluate(() => window.render(9.3))
  const poster = await page.evaluate(
    () =>
      document
        .querySelector('canvas')
        .toDataURL('image/webp', 0.88)
        .split(',')[1],
  )
  await writeFile(
    path.join(output, 'closer-poster.webp'),
    Buffer.from(poster, 'base64'),
  )
  const encoder = spawn(
    process.env.FFMPEG_PATH || 'ffmpeg',
    [
      '-y',
      '-f',
      'image2pipe',
      '-vcodec',
      'mjpeg',
      '-r',
      '30',
      '-i',
      'pipe:0',
      '-i',
      path.join(dir, 'soundtrack.wav'),
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-crf',
      '23',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-t',
      '26',
      '-movflags',
      '+faststart',
      path.join(output, 'closer.mp4'),
    ],
    { stdio: ['pipe', 'ignore', 'pipe'] },
  )
  let errors = ''
  encoder.stderr.on('data', (data) => {
    errors += data
  })
  const finished = new Promise((resolve, reject) => {
    encoder.on('error', reject)
    encoder.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(errors)),
    )
  })
  // Stop producing frames if the encoder cannot start or exits early.
  let encodingError
  finished.catch((error) => {
    encodingError = error
  })
  encoder.stdin.on('error', (error) => {
    encodingError = error
  })
  for (let frame = 0; frame < 780; frame++) {
    if (encodingError) throw encodingError
    const jpeg = await page.evaluate((time) => {
      window.render(time)
      return document
        .querySelector('canvas')
        .toDataURL('image/jpeg', 0.95)
        .split(',')[1]
    }, frame / 30)
    if (!encoder.stdin.write(Buffer.from(jpeg, 'base64')))
      await Promise.race([once(encoder.stdin, 'drain'), finished])
    if (frame % 150 === 0) console.log(`Rendering ${frame / 30}s / 26s`)
  }
  encoder.stdin.end()
  await finished
  console.log('Film and poster saved to public/media.')
} finally {
  await browser.close()
}
