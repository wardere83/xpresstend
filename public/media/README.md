# Sign-up panel video

Drop an MP4 here named `join-family.mp4` and the sign-up page will play it in
place of the still image, with no code change required.

Requirements:

- **H.264 MP4**, which every current browser plays.
- **No audio track.** It autoplays, and browsers only permit that when muted;
  a page that starts making noise during sign-up loses people.
- **Portrait or square**, roughly 4:5. The panel crops with `object-cover`, so
  a landscape clip will lose its sides.
- **Keep it under about 3 MB.** It loads on the sign-up path, where any delay
  costs conversions.

`src/assets/brand/join-family.jpg` stays in place as the poster frame, shown
while the video buffers and to anyone whose browser blocks autoplay.
