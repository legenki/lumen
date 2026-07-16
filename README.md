# Lumen

Generative image-filtering studio built on **p5.js + WebGL2**. Stack shader effect modules — fills, displacements, blurs, color ops, masks — combine them with 28 built-in presets, upload your own media, and export as PNG or MP4 video. Runs entirely in the browser as an offline-first PWA.

## Features

- **19 shader modules** across 6 groups: fills (color, gradient, media, noise), displacement (sine, cubic, simplex, texture map), blur (gaussian, motion, blue-noise), color (correction, gradient map, luma bands, RGB shift), effects (emboss, lens grid, warp grid), mask (media file)
- **MASK groups** — any module can act as an alpha mask for a group of subsequent passes, with drag-and-drop membership editing
- **28 built-in presets** — from "Gradient Plating" to "Soft Metal Stream", each a curated stack of modules with tuned parameters
- **User presets** — save, import/export as JSON
- **Media pool** — 21 built-in assets (photos, text overlays, shapes, gradients, noise) + user uploads via file picker or drag-and-drop
- **PNG and MP4 export** — h264-mp4-encoder (lazy-loaded), configurable duration and frame rate
- **Offline-first PWA** — install to home screen, works without network
- **Dirty-flag scheduler** — no eternal `requestAnimationFrame` loop; renders only when state changes

## Tech Stack

| Layer | Tech |
|-------|------|
| Runtime | p5.js 2.2.3 (instance mode, WebGL2, HALF_FLOAT FBOs) |
| Shaders | 19 GLSL fragment shaders + 1 shared vertex shader |
| Build | Vite 8, LightningCSS |
| Tests | Vitest 4 + jsdom (280 tests, 26 files) |
| Lint | ESLint 10 + Prettier |
| PWA | vite-plugin-pwa |
| Video | h264-mp4-encoder (vendored, lazy-loaded) |
| UI | Vanilla DOM, shared components from grafema/ritmo design system |

## Quick Start

```bash
npm install
npm run dev          # http://localhost:3000/lumen/
```

## Scripts

```bash
npm run dev          # Start dev server with HMR
npm run build        # Production build
npm run preview      # Preview production build
npm test             # Run all tests (vitest)
npm run lint         # ESLint (zero warnings policy)
npm run format       # Prettier auto-format
```

## Project Structure

```
src/
  js/
    main.js              # App entry, UI wiring
    app.js               # p5 instance, pipeline orchestration
    state.js             # Reactive state with persistence
    scheduler.js         # Dirty-flag render scheduler
    pipeline.js          # Ping-pong FBO shader pipeline
    stack.js             # Module stack CRUD
    media.js             # Media registry (built-in + user uploads)
    presets.js            # 28 built-in preset definitions
    presetConvert.js     # v2 format converter + state applicator
    inspector.js         # Right-panel parameter editor
    mediaPanel.js        # Media pool modal dialog
    assets.js            # DEFAULT_MEDIA manifest
    modules/
      index.js           # Module registry
      fill*.js           # 4 fill modules
      displace*.js       # 4 displacement modules
      blur*.js           # 3 blur modules
      color*.js          # 4 color-processing modules
      emboss/lens/warp   # 3 effect modules
      maskMedia.js       # MASK module
      uniformUtils.js    # Zero-alloc uniform helpers
      optionTables.js    # Shared select options
  shaders/
    lumen.vert           # Shared vertex shader
    *.frag               # 19 fragment shaders
  shared/
    ui/                  # Reusable UI components (panelBuilder, layerList, etc.)
    utils/               # Vendored utilities (presetIO, exportMedia, lazyLibs)
  css/
    style.css            # Single stylesheet (~2300 lines)
public/
  assets/lumen/media/    # 22 built-in media assets (webp/png)
reference/
  filtr/                 # Legacy tool reference (read-only)
```

## Modules

| Group | Module | Description |
|-------|--------|-------------|
| Fill | Color | Solid color fill with blend modes |
| Fill | Gradient | Linear, radial, angular, box, triangle gradients |
| Fill | Media File | Image/texture from media pool |
| Fill | Noise Grain | Procedural noise pattern |
| Displace | Sine | Wave-based displacement |
| Displace | Cubic Grid | Cubic grid distortion |
| Displace | Simplex Noise | Noise-based displacement with octaves |
| Displace | Texture Map | Displacement driven by a texture |
| Blur | Gaussian | Two-pass separable gaussian blur |
| Blur | Motion | Directional motion blur |
| Blur | Blue-Noise | Stochastic blue-noise dithered blur |
| Color | Color Adjust | Brightness, contrast, saturation, hue shift |
| Color | Gradient Map | Remap luminance through a gradient |
| Color | Luma Bands | Posterize into luminance bands |
| Color | RGB Shift | Chromatic aberration per channel |
| Effect | Emboss / Relief | Emboss with angle, depth, and mix controls |
| Effect | Lens Grid | Repeating lens/bulge grid |
| Effect | Warp Grid | Repeating warp/twist grid |
| Mask | Media File | Alpha mask from media pool, applied to N following passes |

## Architecture

The rendering pipeline uses **ping-pong FBOs**: two offscreen `p5.Graphics(WEBGL)` buffers swap roles each pass. Each module's `uniforms()` method returns a flat object of shader uniforms; the pipeline applies the corresponding `.frag` shader, reads from buffer A, writes to buffer B, then swaps. MASK modules define groups — the mask pass writes alpha, and all subsequent member passes composite through that alpha.

State is a plain object with persistence via `localStorage`. The scheduler uses a dirty flag + `p.redraw()` (no RAF loop), coalescing multiple changes into a single frame.

## License

Private.
