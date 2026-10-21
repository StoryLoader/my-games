---
name: 민준이의 섬
description: A kid's night-sky island and the blue arcade next to it; chibi, blocky, and touch-reactive.
colors:
  night: "#0b1530"
  night-deep: "#050a1c"
  night-glow: "#1b3a6b"
  ink: "#ffffff"
  ink-soft: "#cfe0ff"
  blue: "#2f6bff"
  blue-light: "#7fd1ff"
  blue-dark: "#1d46b0"
  wood: "#c69c5d"
  wood-ink: "#2b1a0e"
  wood-edge: "#6e4a25"
  grass: "#5fb14a"
  torch: "#ffb347"
  cabinet-light: "#5b8fff"
  cabinet-shade: "#2457e0"
  cabinet-rim: "#7aa4ff"
  bezel: "#0b1024"
  crt: "#070c22"
  brick-red: "#ff4f64"
  brick-red-dark: "#b52a43"
  brick-orange: "#ffa53a"
  brick-green: "#5fc24a"
  brick-blue: "#4a86ff"
  meadow-sky-top: "#5cbcff"
  meadow-sky-bottom: "#d2f0ff"
  meadow: "#7cc653"
  dirt: "#c4854a"
  alarm: "#ff5d73"
typography:
  display:
    fontFamily: "'Black Han Sans', 'Do Hyeon', sans-serif"
    fontSize: "clamp(3.2rem, 9vw, 6rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "'Black Han Sans', 'Jua', sans-serif"
    fontSize: "clamp(2rem, 8.5vw, 3.6rem)"
    fontWeight: 400
    lineHeight: 1.05
  title:
    fontFamily: "'Black Han Sans', 'Jua', sans-serif"
    fontSize: "1.7rem"
    fontWeight: 400
    lineHeight: 1.15
  body:
    fontFamily: "'Do Hyeon', sans-serif"
    fontSize: "1.2rem"
    fontWeight: 400
    lineHeight: 1.5
  game:
    fontFamily: "'Jua', sans-serif"
    fontSize: "1.05rem"
    fontWeight: 400
    lineHeight: 1.4
  pixel:
    fontFamily: "'Press Start 2P', 'Jua', monospace"
    fontSize: "8px"
    fontWeight: 400
    lineHeight: 1
rounded:
  sign: "6px"
  panel: "10px"
  button: "14px"
  art: "16px"
  cta: "18px"
  card: "22px"
  pill: "999px"
spacing:
  gutter: "16px"
  card-gap: "22px"
  card-pad: "18px"
components:
  button-primary:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.ink}"
    typography: "{typography.game}"
    rounded: "{rounded.cta}"
    padding: "12px 22px 14px"
  button-wood:
    backgroundColor: "{colors.wood}"
    textColor: "{colors.wood-ink}"
    typography: "{typography.game}"
    rounded: "{rounded.button}"
    height: "44px"
    padding: "0 13px 3px 9px"
  card-game:
    backgroundColor: "{colors.night}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-pad}"
  badge:
    backgroundColor: "{colors.torch}"
    textColor: "{colors.wood-ink}"
    rounded: "{rounded.panel}"
    padding: "4px 12px 6px"
  badge-wip:
    backgroundColor: "{colors.blue-light}"
    textColor: "{colors.wood-ink}"
    rounded: "{rounded.panel}"
    padding: "4px 12px 6px"
  play-chip:
    backgroundColor: "#2a5ff0"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "6px 14px 8px"
  panel-wood:
    backgroundColor: "{colors.wood}"
    textColor: "{colors.wood-ink}"
    rounded: "{rounded.panel}"
    padding: "22px 22px 20px"
---

# Design System: 민준이의 섬

## Overview

**Creative North Star: "The Blue Block Arcade at Night"**

Everything here belongs to one place: 민준's island under a night sky, and the arcade room beside it. The ground is a deep navy sky with twinkling square pixel stars. Things standing in that sky are chunky, toy-like objects with a lit top edge and a dark bottom edge, so they read as 3D blocks you could pick up: wood signs, blue pill buttons, game cards, a whole arcade cabinet. The palette is 민준's blue against night, warmed by wood and torch light.

Each game is its own small world inside that place. A game keeps the brand tokens and adds only the colours its world needs (a cabinet and CRT for 벽돌깨기, a sunny meadow for 두더지 잡기). When the user supplies an asset kit, that kit's palette wins for that game (가위바위보 follows its PNG set). Every surface reacts to touch: things lift, tilt, press down, or pop.

The confirmed rejection, from the user (2026-10-08): screens designed out of emoji. Pictures are user-supplied images or SVG/CSS/Canvas drawn in code.

**Key Characteristics:**
- Night-sky ground: radial navy glow fading to near-black, with square pixel stars.
- Toy-block depth: a light inset on top, a dark inset on the bottom, and a soft drop shadow.
- Blue is the action colour. Wood is the colour for signs and navigation. Torch amber is for scores and highlights.
- Pixel and block textures (procedural plank texture, 16px block textures, crisp-edged SVG) are part of the world, not a retro gimmick.
- Each game is a separate world that keeps the shared tokens and its own palette extension.
- Every pressable thing answers touch with a lift, tilt, or press.

## Colors

Night navy and 민준's blue are the base, warmed by wood and torch; each game world adds its own named extension.

### Primary
- **민준 Blue** (blue): primary buttons, the arcade cabinet body, the selected-card ring, the index title.
- **Sky Glint** (blue-light): focus rings, the arcade headline, and the WIP badge. It is the lit side of every blue object.
- **Deep Moulding Blue** (blue-dark): the bottom-bevel shadow under blue buttons, the extrusion under titles, and cabinet edge moulding.

### Secondary
- **Plank Wood** (wood): back buttons, story panels, island signs. Wood means "sign" or "navigation", never the primary action.
- **Charred Ink** (wood-ink): text on wood and the single outline colour in cartoon worlds (mole's line colour).
- **Bark Edge** (wood-edge): bottom bevel and border of wood, and sign posts.

### Tertiary
- **Torch Amber** (torch): score numbers, NEW badges, CRT HUD labels, lit coin slots, and the warm glow in the marquee.
- **Grass Top** (grass): grass-block tops and the lobby scrollbar.

### Neutral
- **Night** (night): card fill and the middle stop of the page gradient.
- **Night Deep** (night-deep): the outer stop of the page gradient and the scrollbar track.
- **Night Glow** (night-glow): the top centre of the page gradient and the resting card ring.
- **Star White** (ink): text on night.
- **Moon Haze** (ink-soft): secondary text on night.

### Game-world extensions
- **Arcade cabinet (벽돌깨기):** cabinet-light and cabinet-shade for the lit and shaded sides of the blue body, cabinet-rim for the screen rim and deck top, bezel for the near-black bezel, crt for the glass. The four brick colours (brick-red, brick-orange, brick-green, brick-blue) each have a light and a dark bevel in canvas code. brick-red also does the paddle caps and the joystick ball.
- **Cartoon meadow (두더지 잡기):** a light daytime sky gradient (meadow-sky-top to meadow-sky-bottom), meadow and turf greens, dirt browns, and alarm red for the last 5 seconds. Every outline uses wood-ink.
- **Asset kit (가위바위보):** uses the colours sampled from the user's PNGs (outline #2a2118, cream #fffaf0, its own blue #4a9cf8, pink, yellow). These live only in that file and are not system tokens.

### Named Rules
**The Same Names Rule.** Each page copies the brand tokens into its own `:root` under the same variable names. A game adds new names for its world and never redefines a brand name with a new value. The asset-kit game is the one recorded exception.

**The Blue Acts Rule.** Blue is the action colour: the main button, the selected card, the lit cabinet. Wood is for navigation and signs. When a game ends, only the primary "다시 하기" stays blue.

## Typography

**Display Font:** Black Han Sans (with Do Hyeon / Jua)
**Body Font:** Do Hyeon on the island site; Jua on the lobby and game screens
**Label/Mono Font:** Press Start 2P (with Jua), only inside the 벽돌깨기 cabinet

**Character:** Black Han Sans is a heavy, blocky Korean headline face that reads like stacked blocks. Jua is round and friendly, and easy for kids to read in Korean. Press Start 2P adds a pixel voice for digits and English signage, and only on an arcade screen.

### Hierarchy
- **Display** (400, clamp(3.2rem, 9vw, 6rem), 1): the island title. Blue, with a stepped 7-layer extrusion down to the darkest blue.
- **Headline** (400, clamp(2rem, 8.5vw, 3.6rem), 1.05): page titles such as 민준이의 오락실. Sky Glint with a 4px blue-dark extrusion.
- **Title** (400, 1.7rem, 1.15): game card names and the story-panel heading (2.1rem).
- **Body** (400, 1.2rem, 1.5): story panels on the island, and card descriptions in Jua (1.4 line height).
- **Game** (Jua 400, about 1.05 to 1.32rem): HUD, buttons, and signs on every game screen.
- **Pixel label** (Press Start 2P 400, 8 CRT pixels with an 8px minimum, snapped to 4px steps; digits at 12 CRT pixels with a 16px minimum, snapped to 8px steps): SCORE, the score digits, and the BRICK marquee logo.

### Named Rules
**The Jua On Screens Rule.** On a game screen (HUD, score, buttons), Korean text is set in Jua. This is a provisional choice in CLAUDE.md, recorded as current practice.

**The Pixel Voice Rule.** Press Start 2P is only for digits and English signage on a pixel arcade screen, and always falls back to Jua. Korean text inside that same screen stays in Jua (목숨, 벽돌깨기). Don't use it on the site or on other games.

## Layout

Everything is single-column and mobile-first. The page gutter is 16px on every page, and nothing scrolls horizontally. The lobby is one centred column (max 560px) of game cards spaced 22px apart. Each card is a 120px art tile next to the text, and the tile shrinks to 92px under 400px. Game screens fill the viewport using `svh` units and respect safe-area insets. The back sign sits at top-left. From 720px up on 벽돌깨기 it floats absolutely so the cabinet can take the full height.

Each game sizes its play area from a fixed logical canvas. 블록 쌓기 is 360 logical pixels wide. 벽돌깨기's CRT is 224×304, scaled by a CRT-pixel unit (the screen width divided by 224), with the screen capped at 480px. When the viewport is too short, the cabinet runs off the bottom edge instead of ending in a stub, and the CRT keeps its height. Size from viewport units in these layouts. Chrome collapses `cqh` to 0 inside a size container, which made the mole field disappear.

## Elevation & Depth

Depth comes from layered shadows, in one recurring recipe: a light inset along the top edge, a darker inset along the bottom edge, and a soft ambient drop shadow tinted with night or ink. Together these turn a flat shape into a pressable toy block. Titles get the same treatment as a stacked extrusion in a darker blue. The CRT gets the reverse: a dark inner vignette, 3px scanlines, and a faint highlight top-left so the glass looks curved.

### Shadow Vocabulary
- **Block bevel** (`box-shadow: inset 0 3px 0 rgba(255,255,255,.32), inset 0 -5px 0 var(--wood-edge), 0 6px 12px rgba(5,10,28,.4)`): wood signs and back buttons. Blue buttons use the same recipe with blue-dark as the bottom inset.
- **Card lift** (`box-shadow: inset 0 0 0 3px var(--night-glow), 0 14px 30px rgba(0,0,0,.35)`): lobby cards at rest. On hover the ring turns blue and the shadow grows to 0 20px 36px.
- **Title extrusion** (`text-shadow: 0 4px 0 var(--blue-dark), 0 10px 24px rgba(5,10,28,.6)`): headlines on night.
- **CRT glass** (`box-shadow: inset 0 0 calc(22 * var(--u)) rgba(0,0,0,.75), inset 0 0 calc(5 * var(--u)) rgba(0,0,0,.9)`): the inner vignette of the arcade screen.

### Named Rules
**The Lit Top, Dark Bottom Rule.** A pressable object has a lighter top edge and a darker bottom edge. Pressing it moves it down 2 to 3px, and on some buttons the bottom bevel shrinks.

**The Still Shadow Rule.** Never put `filter: drop-shadow` on an element that moves. Use box-shadow, or draw the shadow into the art (a rule from performance fixes).

## Shapes

Corners are soft and toy-like. Island signs and panels have small corners (6 to 10px) to match pixel planks. Wood back buttons are 14px, blue game buttons 18px, art tiles 16px, cards 22px, and the island's welcome buttons are full pills. Cartoon worlds outline every shape in one 3px ink line. Pixel worlds use `crispEdges` SVG and canvas with smoothing turned off. 벽돌깨기's CRT glass is the one curved, non-rectangular shape (8% / 6% radius), and its deck top is a trapezoid made with clip-path.

## Components

### Buttons
Tactile, toy-like, and always responsive to touch.
- **Shape:** soft rounded rectangle (14px wood, 18px blue game CTA); full pill for the island welcome buttons.
- **Primary (blue 3D):** 민준 Blue fill, white Jua label, a 4px white top inset and a 5 to 6px blue-dark bottom inset. In cartoon worlds it also gets a 3px ink border and an ink text stroke.
- **Hover / Focus:** lifts 2px (some wood buttons also tilt -2deg), or brightens 8 to 10%. Pressed: moves down 2 to 3px. Focus ring: 3px Sky Glint outline with a 3 to 4px offset. The mole meadow uses an ink focus ring instead.
- **Wood (navigation and secondary):** Plank Wood with an SVG grain and plank-seam overlay, Charred Ink text and a 3px ink border, 44px tall, with an SVG arrow icon. It is the back button on every game except the asset-kit game, and the "그만하기" state while a game is running.

### Chips
- **Play chip:** a small blue pill (#2a5ff0) with a blue-dark bottom inset. It sits on every lobby card.
- **Badge:** Torch Amber tag on the card's top-right edge for NEW, and Sky Glint for 만드는 중. Ink text, 10px corners.

### Cards / Containers
- **Corner Style:** 22px (cards), 16px (art tile inside).
- **Background:** Night. The featured card adds a diagonal gradient from #13306a into Night.
- **Shadow Strategy:** Card lift (see Elevation). Hover: rises 4px and tilts -0.6deg on a springy curve (cubic-bezier(.2, 1.4, .4, 1)). Pressed: moves down 1px.
- **Border:** a 3px inset ring, Night Glow at rest and blue on hover or when featured.
- **Internal Padding:** 18px (14px under 400px).
- **Art tile:** each game draws its own miniature in CSS or SVG (a pixel tower, a meadow hole, the arcade cabinet) or uses its own asset.

### Navigation
- A single back sign at top-left per page (섬으로, 오락실). It is a Wood button with an SVG arrow and Jua text. There is no nav bar.

### Wood Story Panel (signature)
- On the island, tapping a sign opens a panel. It uses the procedural pixel plank texture at 48px, a 3px Bark Edge border, 10px corners, Charred Ink text, and the block bevel. It slides up 24px and fades in on cubic-bezier(.16, 1, .3, 1).

### Arcade Cabinet (signature, 벽돌깨기)
- From top to bottom: a blue-dark marquee with a warm lightbox and rainbow pixel letters, a blue body with a lighter and a shaded side, a recessed rim and near-black bezel, curved CRT glass (scanlines, vignette, a slow light roll), a control deck with a red-ball joystick and two round buttons that tilt or press on input, and a coin door with lit slots. The CRT HUD has a pixel SCORE on the left and pixel SVG hearts with a Jua 목숨 label on the right. Bricks have pixel bevels, the paddle is silver with red caps, and the walls are steel pipes, all drawn on canvas at integer CRT pixels.

## Do's and Don'ts

### Do:
- **Do** copy the brand tokens into each new page's `:root` under the same names, and add new names for a game's own world.
- **Do** draw every picture as SVG, CSS, Canvas, or a user-supplied image. When an asset folder is given, use it first.
- **Do** give every pressable object the lit-top, dark-bottom bevel and a press-down state, and make touch visibly move something.
- **Do** keep the 16px page gutter, prevent horizontal scroll, use `svh`-based sizing, and make touch targets at least 44px.
- **Do** set Korean UI text in Jua on game screens, and keep Press Start 2P to digits and English signage on a pixel arcade screen.
- **Do** pause decorative loops under `prefers-reduced-motion`.

### Don't:
- **Don't** use emoji in place of pictures on game screens. The island's click-to-burst emoji fireworks are a required feature and the only sanctioned emoji effect.
- **Don't** redefine a brand token name with a different value in a brand-world page.
- **Don't** put `filter: drop-shadow` on moving elements, or draw text or emoji to a canvas with `fillText` every frame.
- **Don't** use `cqh` inside a size container for a game field. Size from viewport units.
- **Don't** use Press Start 2P for Korean text or outside an arcade-screen world.
