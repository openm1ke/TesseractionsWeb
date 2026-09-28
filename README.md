# Tesseractions Web

Independent browser port of the Flutter game in `../Tesseractions`. It follows the canonical rules v2: two offset lattices, 41 shared slots, RED top-to-bottom and IVORY left-to-right.

## Included

- Playable local two-player mode and three offline AI levels
- Exact shared-slot blocking and graph-based victory detection
- Russian and English interface
- Five-step first-match tutorial with an interactive placement lesson
- Board coordinates, placement hints, reduced-motion option, and game sounds
- Horizontal move history, finished-match review, and automatic local save
- Responsive mouse, touch, and keyboard-friendly UI
- Standalone bilingual privacy policy at `/privacy.html`
- No backend, ads, accounts, analytics, cookies, or third-party runtime assets

## Development

```bash
npm install
npm run dev
```

Run the full verification gate:

```bash
npm run check
```

The production build is written to `dist/`. Vite uses a relative base path, so the folder can be deployed to a domain root, a subdirectory, GitHub Pages, or another static host.

## Source relationship

The web project is intentionally separate from Flutter and has no runtime dependency on it. The rule engine is ported from `lib/game/domain` and `lib/game/engine`; artwork and original sound effects are copied from the mobile project's own assets.
