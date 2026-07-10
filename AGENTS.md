# Lumen: Agent Instructions

You are an agentic AI coding assistant working on the **Lumen** project. Lumen is a massive, complex generative design tool built with `p5.js`. 

Follow these architectural guidelines, constraints, and lessons learned from the broader ecosystem (Divix, Difuso, Bandada) when writing code, making architectural decisions, or refactoring.

## 1. Architecture & State Management
- **Single Source of Truth:** All configurations, settings, and mutable parameters MUST live in `state.js`.
- **Instance Mode:** Always use `p5.js` in Instance Mode (`new p5((p) => { ... })`). Never use global variables for p5 functions.
- **Declarative UI:** UI structures are defined via arrays in `controls.js` and parsed dynamically. When adding new parameters, add them to `state.js` and map them declaratively in `controls.js`.

## 2. UI & Component Repositories
Lumen's UI relies on two external design systems. If a required control (e.g., advanced spline editor, gradient mapper) is missing, you must switch contexts and implement the UI component in these repositories first:
- **Grafema:** `/Users/andy/Documents/GitHub/grafema`
- **Ritmo:** `/Users/andy/Documents/GitHub/ritmo`
Always respect the established "Glassmorphism" aesthetic (`backdrop-filter: blur`, strict grid alignment, `--margin-xlarge: 20px`).

## 3. Rendering Pipeline & Centering
- **Offscreen Buffers:** Do not draw complex elements directly to the main canvas. Use `p5.Graphics` buffers (e.g., `gForm`, `gDraw`) scaled by `cnv.density.base`.
- **Full Viewport Main Canvas:** The main `p5.js` DOM canvas must cover the full window (`width: 100vw; height: 100vh`).
- **Exact Centering:** Do not center relative to the full screen. Center the drawing relative to the **available workspace** (the space left of the 260px right panel + 20px margin = 290px offset).
  - 2D Canvas offset logic: `p.image(buffer, (p.width - 290) / 2, p.height / 2, ...);`
  - WebGL offset logic: `p.translate(-145, 0)` (since 0,0 is the center, shifting left by half of 290px centers it).
- **Scale Limit:** Scale the buffer bounding box so it fits within 85% of the window dimensions to preserve margins.

## 4. The `resizeCanvas` Trap (CRITICAL)
Calling `resizeCanvas()` on a `p5.Graphics` object **wipes its 2D Context completely**. 
Whenever you resize a buffer during resolution changes or High-Res exports, you **MUST** immediately re-apply drawing modes. Example:
```javascript
gForm.resizeCanvas(newW, newH);
gForm.pixelDensity(density);
gForm.strokeWeight(0.5);
gForm.noStroke();
gForm.angleMode(p.DEGREES); // If you forget this, transformations will collapse!
```

## 5. Performance Constraints (Zero-Allocation Loop)
Generative tools must maintain 60 FPS. 
- **NO GC in Draw:** Do not instantiate new Arrays (`[]`), Objects (`{}`), or `p5.Vector` instances inside the `p.draw()` loop or heavy math functions (like flocking algorithms).
- **Array Clearing:** If using spatial partitioning or buckets, do not reassign the grid `this.buckets = Array.from(...)`. Instead, iterate and empty them: `this.buckets[r][c].length = 0;`.
- **Math:** Use pre-calculated values and avoid square roots where distance-squared (`distSq`) is sufficient.

## 6. Randomization Scope
When implementing "Randomize" buttons for specific UI sections, the randomization functions (in `randomize.js`) MUST strictly mutate only the properties belonging to that specific domain.
- Never use a global `randomizeAll()` function for a local section button.
- Ensure noise seeds and colors aren't mutated when only transform parameters are randomized.

## 7. Offline First (PWA Requirements)
Lumen functions as an offline Progressive Web App.
- **NO External Assets:** Never hardcode URLs to Unsplash, AWS, or other external CDNs for default textures or fonts.
- **Local Assets Only:** All default state assets must reside in `public/assets/lumen/...` so the Vite PWA plugin can cache them into the Service Worker correctly.