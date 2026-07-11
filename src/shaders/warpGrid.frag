#version 300 es
precision highp float;
precision highp int;

in vec2 vTexCoord;
out vec4 fragColor;

uniform sampler2D u_src;

// effect mask (same size as source)
uniform sampler2D u_mask;
uniform bool u_maskUse;

uniform float u_aspect; // aspect ratio (width/height)
uniform float u_mix; // blend with original color (0 = original, 1 = only effect)
uniform float u_strength; // global effect strength (0 = original UVs, 1 = fully warped)
uniform float u_blendEdge; // soft edge amount for cell borders [0..1]

uniform vec2 u_gridCells; // number of cells along X/Y (>= 1) in square space e.g. vec2(20.0, 20.0)
uniform float u_gridScale; // scale of the effect square (1.0 fits short side; <1 smaller, >1 larger)
uniform float u_gridAngle; // rotation of the *effect area* (square + grid), in radians

// radial falloff around u_falloffFocus in square space
uniform vec2 u_falloffRange; // x = start, y = end (0..1)
uniform int u_falloffMode; // mode: 0 = off, 1 = stronger near center, 2 = stronger near edges
uniform vec2 u_falloffFocus; // falloff + sampling focus in square space [0..1]

uniform int u_wrapMode; // wrap mode: 0=CLAMP, 1=REPEAT, 2=MIRROR, 3=TRANSPARENT-CLAMP

const float EPS = 1e-5;

//---------------------- helpers ----------------------------

// Effective focus:
vec2 getFocus() {
  vec2 center = vec2(0.5);
  // falloff off → use center; no adjustment
  if (u_falloffMode == 0) {
    return center;
  }
  // detect 1D grid
  bool oneCol = u_gridCells.x <= 1.0001 && u_gridCells.y > 1.0001;
  bool oneRow = u_gridCells.y <= 1.0001 && u_gridCells.x > 1.0001;
  // --- 1D mode: no compensation ---
  // u_falloffFocus is already in "grid" space [0..1]^2
  if (oneRow || oneCol) {
    return u_falloffFocus;
  }
  // --- 2D mode: compensate rotation and scale ---
  vec2 focusScreen = u_falloffFocus; // user provides in screen UVs
  float ca = cos(u_gridAngle);
  float sa = sin(u_gridAngle);
  // 1) rotate like uv -> uvRot
  vec2 p = focusScreen - center;
  vec2 focusRot = vec2(p.x * ca - p.y * sa, p.x * sa + p.y * ca) + center;
  // 2) convert to "grid" space, like uvRot -> uvSq (uvToSquare)
  float s = max(u_gridScale, 0.001);
  vec2 dRot = focusRot - center;
  vec2 focusGrid = center + dRot / s;
  return focusGrid;
}

// Pick axis for 1D mode from u_gridCells; default to horizontal when grid is 2D.
vec2 chooseAxisAuto() {
  bool oneCol = u_gridCells.x <= 1.0001 && u_gridCells.y > 1.0001;
  bool oneRow = u_gridCells.y <= 1.0001 && u_gridCells.x > 1.0001;
  if (oneRow) {
    return vec2(1.0, 0.0); // N x 1 → stripes along X
  }
  if (oneCol) {
    return vec2(0.0, 1.0); // 1 x N → stripes along Y
  }
  return vec2(1.0, 0.0);
}

// 1D offset direction and factor from focus
void computeOffsetDirAndFactorAuto(vec2 cellCenterSq, out vec2 dirSq, out float axisFactor) {
  vec2 focus = getFocus();
  vec2 d = cellCenterSq - focus;
  vec2 axis = chooseAxisAuto();
  float proj = dot(d, axis);
  // four corners of [0..1]^2 relative to focus
  vec2 c0 = vec2(0.0, 0.0) - focus;
  vec2 c1 = vec2(1.0, 0.0) - focus;
  vec2 c2 = vec2(0.0, 1.0) - focus;
  vec2 c3 = vec2(1.0, 1.0) - focus;
  float maxProj = 0.0;
  maxProj = max(maxProj, abs(dot(c0, axis)));
  maxProj = max(maxProj, abs(dot(c1, axis)));
  maxProj = max(maxProj, abs(dot(c2, axis)));
  maxProj = max(maxProj, abs(dot(c3, axis)));
  float norm = maxProj > 0.0 ? clamp(abs(proj) / maxProj, 0.0, 1.0) : 0.0;
  // simple linear profile 0..1 along axis
  axisFactor = norm;
  float signAxis = proj >= 0.0 ? 1.0 : -1.0;
  dirSq = axis * signAxis;
}

float mirrorWrap1D(float x) {
  float t = floor(x);
  float f = x - t;
  float isOdd = mod(t, 2.0);
  return mix(f, 1.0 - f, isOdd);
}

vec2 wrapUV(vec2 uv, int mode, out float visible) {
  visible = 1.0;
  if (mode == 0) {
    // CLAMP
    return clamp(uv, 0.0, 1.0);
  } else if (mode == 1) {
    // REPEAT
    return fract(uv);
  } else if (mode == 2) {
    // MIRROR
    return vec2(mirrorWrap1D(uv.x), mirrorWrap1D(uv.y));
  } else {
    // 3: TRANSPARENT-CLAMP
    visible = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
    return clamp(uv, 0.0, 1.0);
  }
}

// Map rotated UV -> grid UV (rectangular, full screen with zoom by u_gridScale)
vec2 uvToGrid(vec2 uvRot, out float inActiveArea) {
  float s = max(u_gridScale, 0.001);
  vec2 center = vec2(0.5);
  vec2 d = uvRot - center;
  // u_gridScale = 1.0 -> entire screen area
  // u_gridScale < 1.0 -> smaller area around center
  // u_gridScale > 1.0 -> area extends beyond edges
  vec2 gridUV = center + d / s;
  float inside =
    step(0.0, gridUV.x) * step(gridUV.x, 1.0) * step(0.0, gridUV.y) * step(gridUV.y, 1.0);
  inActiveArea = inside;
  return gridUV;
}

// Inverse transform: grid UV -> screen UV
vec2 gridToUv(vec2 gridUV) {
  float s = max(u_gridScale, 0.001);
  vec2 center = vec2(0.5);
  vec2 d = gridUV - center;
  return center + d * s;
}

// Simple square mask per cell (soft edges controlled by u_blendEdge)
float cellShapeMask(vec2 qGrid) {
  vec2 p = qGrid * 2.0; // coords from -1 to 1 inside cell
  float a = max(abs(p.x), abs(p.y));

  // soft edge width ONLY from u_blendEdge
  float edge = clamp(u_blendEdge, 0.0, 1.0);

  // near-zero softness -> hard edges
  if (edge <= EPS) {
    return 1.0 - step(1.0, a);
  }

  // inner — level where mask is still 1.0
  float inner = 1.0 - edge;

  // base mask: 1 inside, 0 at border, smooth transition
  float baseMask = 1.0 - smoothstep(inner, 1.0, a);

  // ---- optional extra softening via u_strength ----
  // strengthFactor in [0..1]
  float strengthFactor = clamp(u_strength, 0.0, 1.0);

  // curve:
  //  - small u_strength → slightly sharper transition
  //  - large u_strength → softer/more stretched visually
  float curve = mix(1.5, 0.75, strengthFactor); // 2.0 = sharper, 0.5 = softer

  // change curve shape without changing zone width
  float shapedMask = pow(baseMask, curve);

  // float  shapedMask = baseMask;
  return shapedMask;
}

// Radial falloff around focus in square space.
float computeFalloffSq(vec2 uvGrid) {
  if (u_falloffMode == 0) {
    return 1.0;
  }
  vec2 focus = getFocus();
  bool oneCol = u_gridCells.x <= 1.0001 && u_gridCells.y > 1.0001;
  bool oneRow = u_gridCells.y <= 1.0001 && u_gridCells.x > 1.0001;
  float rNorm = 0.0;
  float aspect = max(u_aspect, EPS);
  if (oneRow || oneCol) {
    // 1D falloff — aspect can be ignored
    vec2 axis = oneRow ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec2 d = uvGrid - focus;
    float proj = dot(d, axis);
    vec2 c0 = vec2(0.0, 0.0) - focus;
    vec2 c1 = vec2(1.0, 0.0) - focus;
    vec2 c2 = vec2(0.0, 1.0) - focus;
    vec2 c3 = vec2(1.0, 1.0) - focus;
    float maxProj = 0.0;
    maxProj = max(maxProj, abs(dot(c0, axis)));
    maxProj = max(maxProj, abs(dot(c1, axis)));
    maxProj = max(maxProj, abs(dot(c2, axis)));
    maxProj = max(maxProj, abs(dot(c3, axis)));
    if (maxProj > 0.0) {
      rNorm = clamp(abs(proj) / maxProj, 0.0, 1.0);
    } else {
      rNorm = 0.0;
    }
  } else {
    // 2D radial falloff in pixel metric
    vec2 d = uvGrid - focus;
    vec2 dPix = vec2(d.x, d.y / aspect);
    float dist = length(dPix);
    vec2 c0 = vec2(0.0, 0.0) - focus;
    vec2 c1 = vec2(1.0, 0.0) - focus;
    vec2 c2 = vec2(0.0, 1.0) - focus;
    vec2 c3 = vec2(1.0, 1.0) - focus;
    float maxR = 0.0;
    maxR = max(maxR, length(vec2(c0.x, c0.y / aspect)));
    maxR = max(maxR, length(vec2(c1.x, c1.y / aspect)));
    maxR = max(maxR, length(vec2(c2.x, c2.y / aspect)));
    maxR = max(maxR, length(vec2(c3.x, c3.y / aspect)));
    if (maxR > 0.0) {
      rNorm = clamp(dist / maxR, 0.0, 1.0);
    } else {
      rNorm = 0.0;
    }
  }
  float start = min(u_falloffRange.x, u_falloffRange.y);
  float end = max(u_falloffRange.x, u_falloffRange.y);
  float span = max(end - start, EPS);
  float t = clamp((rNorm - start) / span, 0.0, 1.0);
  float base =
    u_falloffMode == 1
      ? 1.0 - t // stronger at center
      : t; // stronger at edges
  return base;
}

void main() {
  vec2 uv = vTexCoord;
  vec4 baseColor = texture(u_src, uv);

  // 0. Rotate effect area (square + grid), but NOT the sampled texture.
  float ca = cos(u_gridAngle);
  float sa = sin(u_gridAngle);
  vec2 center = vec2(0.5);
  vec2 p = uv - center;
  vec2 uvRot = vec2(p.x * ca - p.y * sa, p.x * sa + p.y * ca) + center;

  // 1. Map rotated UV into square-space
  float activeArea;
  vec2 uvGrid = uvToGrid(uvRot, activeArea);

  // 2. Grid in square-space (no local rotation)
  vec2 cells = max(u_gridCells, vec2(1.0));
  vec2 cellSize = 1.0 / cells;
  float cellDiag = length(cellSize);

  vec2 cellUV = uvGrid * cells;
  vec2 qGrid = fract(cellUV) - 0.5; // local coords in cell [-0.5..0.5]
  vec2 cellId = floor(cellUV);
  vec2 cellCenterSq = (cellId + 0.5) / cells; // cell center in [0..1]^2

  // Mask value for current cell (with smooth edges if enabled)
  float shapeMask = cellShapeMask(qGrid);

  // 3. Offset direction and magnitude per cell (1D profile along axis)
  vec2 dirSq;
  float axisFactor;
  computeOffsetDirAndFactorAuto(cellCenterSq, dirSq, axisFactor);

  // falloff at the cell center affects displacement amplitude
  float cellFalloff = computeFalloffSq(cellCenterSq);

  float shiftMag = 0.5 * cellDiag * axisFactor * cellFalloff;
  vec2 offsetSq = dirSq * shiftMag;

  // 4. Mini-copy per cell around focus, scale = 1.0
  vec2 focus = getFocus();
  float s = max(u_gridScale, 0.001);
  vec2 srcSq = focus + qGrid / s + offsetSq;

  // 5. Convert back to unrotated screen UV, then undo rotation for texture sampling
  float visible;
  vec2 srcUVRotBase = gridToUv(srcSq); // coords in unrotated "square" space
  vec2 q2 = srcUVRotBase - center;
  // inverse rotation (-u_gridAngle)
  vec2 srcUV = vec2(q2.x * ca + q2.y * sa, -q2.x * sa + q2.y * ca) + center;
  srcUV = wrapUV(srcUV, u_wrapMode, visible);

  // 6. Per-pixel falloff in square space
  float falloff = computeFalloffSq(uvGrid);

  // 7. Effect weight (including mask and smooth edges)
  float baseStr = clamp(u_strength, 0.0, 1.0);
  float maskVal = u_maskUse ? texture(u_mask, uv).a : 1.0;
  float eff = clamp(baseStr * maskVal * visible * activeArea * shapeMask * falloff, 0.0, 1.0);

  // 8. Mix original and warped color
  vec2 warpedUV = mix(uv, srcUV, eff);
  vec4 warpedColor = texture(u_src, warpedUV);
  float mixAmount = clamp(u_mix, 0.0, 1.0);
  fragColor = mix(baseColor, warpedColor, mixAmount);
}
