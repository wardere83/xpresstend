# XpressTend brand film

An original 26-second, 1920×1080, 30 fps product film with an original synthesized ambient score. The opening is a single turquoise light reveal, followed by the sending journey. The phone interface and people are illustrative creative artwork; the website's app screenshots are captured from explore mode in the actual application.

The checked-in MP4, poster, and captions in `public/media/` are served directly. A normal application build does not need video tooling or regenerate the film.

To regenerate, install the project dependencies, Chromium (`npx playwright install chromium`), FFmpeg, and Python's NumPy package, then run:

```
python3 scripts/brand-film/soundtrack.py
node scripts/brand-film/render.mjs
```

`CHROME_PATH` may point to an existing Chromium/Chrome executable. `FFMPEG_PATH` may point to an existing FFmpeg binary. Both are optional. Fonts come from `public/fonts/`.

Playback is initiated by the visitor, never by scrolling or page load. Playback starts muted; native video controls appear after playback begins and allow sound to be enabled. The site also honors reduced-motion preferences for its decorative transitions.

## App images

Run the development server (`npm run dev -- --port 5178`), then run
`node scripts/brand-film/capture-app.mjs`. `APP_URL` can override the local
address. The capture script stubs authentication, uses explore mode, and
writes the three optimized WebP assets without accessing customer data.

## Browser checks

Run `npm run build && npm run test:e2e`. The test runner serves the production
build locally and uses stubbed API responses. `CHROME_PATH` can override the
browser executable for local checks. CI installs Chromium automatically.
