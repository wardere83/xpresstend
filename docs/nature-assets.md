# Philanthropy nature assets

Generated with the built-in image-generation tool; these are illustrative nature assets, not photographs documenting an XpressTend event or project. The original generated PNGs remain outside the repository. Optimized WebP copies are committed with the site:

- `public/media/river-habitat.webp` (640 × 640): clear water, visible current, rocks and planted riverbanks. Circular SVG clipping preserves the existing medallion layout.
- `public/media/wagtail-poses.webp` (768 × 768, alpha): a naturally proportioned wagtail in flight and perched. The SVG frames select the appropriate pose; offscreen pausing, landing geometry and reduced-motion behavior remain operational.

## Prompt set

River: “Use case: photorealistic-natural. Asset type: square website philanthropy river medallion background. Create a realistic aerial wildlife photograph looking straight down at a gently curving clear blue-green river flowing diagonally from the upper left to the lower right. The river must be immediately recognizable, occupy roughly half the frame, with visible ripples and sunlit current; both banks have natural grasses, small shrubs, sparse leafy trees and some stones. Natural riparian vegetation, restrained deep green, warm earth and turquoise water. Crisp organic textures, soft afternoon sunlight. The composition must remain legible when cropped to a circle and displayed at 220 pixels. Fill the entire square, no circular frame, no text, no people, no buildings, no map-like lines, no illustration or 3D rendering.”

Bird: “Use case: photorealistic-natural. Asset type: transparent website bird animation sprite sheet. A real small African pied wagtail bird, photographed with a telephoto wildlife lens, natural fine black, white and charcoal feather detail, delicate dark beak, believable slim legs and toes, natural proportions and tiny eye, lit by soft daylight. Create ONE square transparent sprite sheet arranged in TWO EQUAL HORIZONTAL CELLS: upper half shows the whole bird in SIDE PROFILE FACING LEFT flying with wings raised and gracefully spread; lower half shows the same whole bird SIDE PROFILE FACING LEFT calmly perched, folded wings, both feet at the bottom, no branch. Center each pose in its own half, leave transparent margins around each, keep bird anatomy entirely within its half, show the full long tail. True transparent background, isolated cutouts, no scenery, no text, no frame, no illustration, no cartoon, no robot, no glow.”

The selected generated sheet has unequal occupied pose bounds. SVG view boxes use the actual inspected bounds rather than cutting the flight feathers at the nominal midpoint.
