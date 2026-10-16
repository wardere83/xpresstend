# Philanthropy banner film

Drop an MP4 into `public/media/` named `community-literacy.mp4`, with its
opening frame as `community-literacy-poster.webp`, and the XpressTend Financial Literacy page
will play it behind the banner, with no code change required. Until then the
page shows a still banner.

Requirements:

- **H.264 MP4, landscape 16:9**, 1920×1080. It fills the shared banner on
  desktop and phones: roughly the 60% on the copy side sits under a dark scrim so the
  words stay legible, and `object-cover` trims the frame edges to fit. Keep
  essential action in the center and faces clear of the frame edges, text,
  and orbit graphic. Check the crop at narrow phone widths before publishing.
- **No audio track.** It autoplays muted and loops. A localized pause control
  remains available, and reduced motion starts the film paused.
- **Keep it under about 6 MB**, roughly 15 to 25 seconds.
- **Licensed footage of real people**, with releases that cover commercial use.
