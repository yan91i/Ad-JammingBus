# Bus Loop V4 · Complete Rebuild Teaching Project

## Running
After fully extracting, open index.html directly. No npm, bundler, CDN, or internet connection required.
You can also run `python -m http.server 8000` in this directory.

## Layout
Fixed logical canvas of 480 × 820; the whole canvas scales proportionally to fit the available area.
From top to bottom: status bar → passenger waiting area → five temporary parking slots → bus array → action bar.
Parking slots use logical coordinates y=270..378; the bus array uses y=414..759. They never swap or overlap.

## Art
12 standalone transparent PNGs: 6 bus colors and 6 passenger colors. Base visuals were generated with Microsoft Copilot.
There is no sprite atlas, background-position, or nine-slice slicing. Every drawImage call draws one complete standalone image.
Buses and passengers each keep a fixed aspect ratio. Bus arrows are overlaid separately; rotation and hit areas share the same direction data.

## Gameplay and animation
Directional path blocking, five parking slots, strict front-of-queue color matching, four passengers per bus, and departure when full.
Departure, driving, passenger-by-passenger boarding, leaving, blocking shake, hint highlight, light particles, and synthesized sound effects.
Input is locked during action animations to avoid double clicks, undo races, and duplicate slot occupation.
A single requestAnimationFrame loop; restarting never stacks rendering loops.
Undo restores the complete state; mute, replay, 12-level selection, and progress saving.

## Level scope and limits
12 deterministically redesigned levels, built in reverse and provided with verifiable solution orders.
These are not per-level coordinate reproductions of the original, and no equivalence is claimed with all of the original's mechanics, levels, or commercial products.
This version is a complete, playable rebuild deliverable. It contains no ads, in-app purchases, original branded music, or original APK assets.
No validation was performed on real Android devices, on all browsers, or for store publishing.

## Structure
index.html / css/style.css / js/levels.js / js/game.js
assets/buses/*.png / assets/passengers/*.png / audio/ / tests/

## Automated tests
The test script uses Python Playwright and runs in an environment with Chromium installed.
Tests cover file:// loading, mobile/desktop layout, asset loading, clearing all 12 levels, undo, and blocking.
