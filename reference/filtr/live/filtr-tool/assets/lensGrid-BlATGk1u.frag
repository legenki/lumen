#version 300 es
precision highp float;
precision highp int;

in vec2 vTexCoord;
out vec4 fragColor;

uniform sampler2D u_src;
uniform sampler2D u_blur;
uniform bool u_blurUse;

uniform sampler2D u_mask;
uniform bool u_maskUse;

uniform float u_aspect; // aspect ratio (width/height)
uniform float u_mix; // blend with original color (0 = original, 1 = only effect)
uniform float u_strength; // global effect strength (0 = none, >0 = stronger refraction)
uniform int u_wrapMode; // wrap mode: 0=CLAMP, 1=REPEAT, 2=MIRROR, 3=TRANSPARENT-CLAMP

uniform vec2 u_gridCells; // number of cells along X/Y (>= 1)
uniform float u_gridScale; // scale of the grid domain (1.0 fits short side)
uniform float u_gridAngle; // grid rotation in radians

// --------- lens / optics ---------
uniform float u_squircle; // squircle power (1–25)
uniform float u_lensScale; // lens size within cell [0.5–1.25]
uniform float u_edgeSoftness; // soft edge amount [0..1]
uniform float u_ior; // index of refraction (1.0–2.5)
uniform float u_curvature; // curvature (0.1–5.0)
uniform float u_aberration; // chromatic aberration delta IOR (0..0.2)

// light
uniform vec3 u_lightDir; // light direction in view space
uniform vec3 u_specColor; // highlight color
uniform float u_specAmount; // highlight strength [0..1]
uniform float u_specPower; // highlight sharpness (2.5..50)

// shadow
uniform vec3 u_shadowColor; // rim shadow color
uniform float u_shadowAmount; // rim shadow strength [0..1]
uniform float u_shadowPower; // rim shadow sharpness (1..10)

// ------------------- CONSTS / TUNING -------------------

// refraction strength vs. lens size
const float REFR_SIZE_MIN_RADIUS = 0.015;
const float REFR_SIZE_MAX_RADIUS = 0.25;
const float REFR_SIZE_MIN_SCALE = 0.1;
const float REFR_SIZE_MAX_SCALE = 1.0;

const float EPS = 1e-5;

// ----------------------------------------------------------
// wrap helpers
// ----------------------------------------------------------
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

// ----------------------------------------------------------
// uv <-> square-space (0..1)^2 with square cells in world
// ----------------------------------------------------------
vec2 uvToSquare(vec2 uv, out float inActiveArea) {
  float aspect = max(u_aspect, EPS);

  vec2 cells = max(u_gridCells, vec2(1.0));
  float cellsW = cells.x;
  float cellsH = cells.y;

  float Wscr = aspect;
  float Hscr = 1.0;

  float Wdom = cellsW;
  float Hdom = cellsH;

  float scaleFit = min(Wscr / Wdom, Hscr / Hdom);
  float scale = scaleFit * max(u_gridScale, 0.001);

  // uv -> world
  float cx = (uv.x - 0.5) * Wscr;
  float cy = (uv.y - 0.5) * Hscr;

  // world -> grid (in “cell units”)
  float gridX = cx / scale + 0.5 * Wdom;
  float gridY = cy / scale + 0.5 * Hdom;

  // normalize to [0..1]
  vec2 sq;
  sq.x = gridX / Wdom;
  sq.y = gridY / Hdom;

  float inside = step(0.0, sq.x) * step(sq.x, 1.0) * step(0.0, sq.y) * step(sq.y, 1.0);

  inActiveArea = inside;
  return sq;
}

// kept for compatibility, not used in refraction path
vec2 squareToUv(vec2 sq) {
  float aspect = max(u_aspect, EPS);

  vec2 cells = max(u_gridCells, vec2(1.0));
  float cellsW = cells.x;
  float cellsH = cells.y;

  float Wscr = aspect;
  float Hscr = 1.0;

  float Wdom = cellsW;
  float Hdom = cellsH;

  float scaleFit = min(Wscr / Wdom, Hscr / Hdom);
  float scale = scaleFit * max(u_gridScale, 0.001);

  float gridX = sq.x * Wdom;
  float gridY = sq.y * Hdom;

  float cx = (gridX - 0.5 * Wdom) * scale;
  float cy = (gridY - 0.5 * Hdom) * scale;

  vec2 uv;
  uv.x = 0.5 + cx / Wscr;
  uv.y = 0.5 + cy / Hscr;
  return uv;
}

// ----------------------------------------------------------
// blur mix
// ----------------------------------------------------------
vec3 sampleRefractTex(vec2 uv, float blurWeight) {
  vec3 sharp = texture(u_src, uv).rgb;

  if (!u_blurUse || blurWeight <= 0.0) {
    return sharp;
  }

  vec3 blurred = texture(u_blur, uv).rgb;
  blurWeight = clamp(blurWeight, 0.0, 1.0);
  return mix(sharp, blurred, blurWeight);
}

// ----------------------------------------------------------
// squircle helpers
// ----------------------------------------------------------
float SquircleMetric(vec2 dNorm, float pExp) {
  vec2 a = abs(dNorm);
  float s = pow(a.x, pExp) + pow(a.y, pExp);
  float r = pow(s, 1.0 / pExp);
  return r;
}

// delta and lensRadius are in the same units (here — cell-space)
vec2 SquircleGradAniso(vec2 delta, vec2 lensRadius, float pExp) {
  vec2 rRad = max(lensRadius, vec2(1e-4));

  vec2 dNorm = delta / rRad;

  vec2 s = sign(dNorm);
  vec2 a = abs(dNorm);
  vec2 gNorm = s * pow(a + 1e-8, vec2(pExp - 1.0));

  vec2 gGrid = gNorm / rRad;

  float len = max(length(gGrid), 1e-6);
  return gGrid / len;
}

// ----------------------------------------------------------
// Lens geometry in cell coords qGrid ∈ [-0.5..0.5]^2
// lensRadiusCell — radius in same units (0.5 = inscribed)
// ----------------------------------------------------------
bool computeLensGeomCell(vec2 cellPos, float lensRadiusCell, out vec3 normal, out float rNorm) {
  float R = max(lensRadiusCell, 1e-4);
  vec2 rRad = vec2(R);
  vec2 delta = cellPos;
  vec2 dNorm = delta / rRad;

  float pExp = max(u_squircle, 1.0);
  float r = SquircleMetric(dNorm, pExp);
  rNorm = r;

  if (r >= 1.0) {
    normal = vec3(0.0, 0.0, 1.0);
    return false;
  }

  float curveExp = max(u_curvature / max(u_lensScale, 1e-4), 0.0);

  vec2 dirCell = SquircleGradAniso(delta, rRad, pExp);
  float slopeBase = pow(r, curveExp);
  vec2 tangential = dirCell * slopeBase;

  float nLen2 = clamp(dot(tangential, tangential), 0.0, 0.99);
  float z = sqrt(max(0.01, 1.0 - nLen2));

  normal = normalize(vec3(tangential, z));
  return true;
}

// Screen-space refraction offset
vec2 computeRefractOffset(vec3 normal, float ior, float geomAmp) {
  float n = max(ior, 1.0001);
  vec3 incident = vec3(0.0, 0.0, -1.0);

  vec3 refr = refract(incident, normal, 1.0 / n);

  const float PARALLAX = 4.5;
  float t = PARALLAX / max(1e-5, -refr.z);

  return refr.xy * t * u_strength * geomAmp;
}

// ----------------------------------------------------------
// main
// ----------------------------------------------------------
void main() {
  vec2 uv = vTexCoord;
  vec4 baseColor = texture(u_src, uv);

  if (u_mix <= 0.0 || u_strength <= 0.0) {
    fragColor = baseColor;
    return;
  }

  // square-space with u_gridScale
  float dummy;
  vec2 uvSq = uvToSquare(uv, dummy);

  vec2 cells = max(u_gridCells, vec2(1.0));
  vec2 cellSize = 1.0 / cells;

  // grid rotation
  float ca = cos(u_gridAngle);
  float sa = sin(u_gridAngle);
  mat2 R = mat2(ca, -sa, sa, ca);
  mat2 RT = mat2(ca, sa, -sa, ca);

  vec2 gridCenter = vec2(0.5);
  vec2 pSq = uvSq - gridCenter;
  vec2 gridSize = cells;

  // square -> grid indices
  vec2 pGrid = pSq * gridSize;
  pGrid = R * pGrid;
  vec2 pGridSq = pGrid / gridSize;
  vec2 uvGridSq = pGridSq + gridCenter;

  // cell-local coords
  vec2 cellUV = uvGridSq * cells;
  vec2 qGrid = fract(cellUV) - 0.5; // [-0.5..0.5]^2
  vec2 cellId = floor(cellUV);

  float activeArea =
    step(0.0, uvGridSq.x) * step(uvGridSq.x, 1.0) * step(0.0, uvGridSq.y) * step(uvGridSq.y, 1.0);

  float maskTex = u_maskUse ? texture(u_mask, uv).a : 1.0;

  if (activeArea <= 0.0 || maskTex <= 0.0) {
    fragColor = baseColor;
    return;
  }

  // lens radius in cell space (0.5 = full cell)
  float lensRadiusCell = 0.5 * u_lensScale;

  // lens geometry in cell space
  vec3 normalGrid;
  float rNorm;
  bool insideLens = computeLensGeomCell(qGrid, lensRadiusCell, normalGrid, rNorm);

  if (!insideLens) {
    fragColor = baseColor;
    return;
  }

  // normal from grid-space to view-space (remove grid rotation)
  vec2 NxyView = RT * normalGrid.xy;
  vec3 Nview = normalize(vec3(NxyView, normalGrid.z));

  // base thickness profile
  float rim = smoothstep(0.0, 1.0, rNorm);
  float geomAmpBase = rim * (1.0 - rNorm);

  // 1) soft edge in lens radius
  float soft = clamp(u_edgeSoftness, 0.0, 1.0);
  float inner = 1.0 - soft;
  float edgeMaskLens = 1.0 - smoothstep(inner, 1.0, rNorm);

  // 2) soft edge against cell border when lens exceeds cell
  vec2 qAbs = abs(qGrid) * 2.0; // [0..1]
  float edgeDist = max(qAbs.x, qAbs.y); // 0 center, 1 border
  float over = clamp(u_lensScale - 1.0, 0.0, 1.25); // clamp(0 .. max u_lensScale)
  float cellSoft = soft * over;

  float edgeMaskCell = 1.0;
  if (cellSoft > 0.0) {
    float cellInner = 1.0 - cellSoft * 0.5;
    float rawMask = 1.0 - smoothstep(cellInner, 1.0, edgeDist);
    edgeMaskCell = 0.5 + 0.5 * rawMask;
  }

  float edgeMask = edgeMaskLens * edgeMaskCell;
  float geomAmp = geomAmpBase * edgeMask;

  // external mask
  geomAmp *= maskTex;

  // --- SIZE-BASED REFRACTION SCALE (depends on cells & u_gridScale) ---
  float cellsMax = max(cells.x, cells.y);
  // logical radius in screen terms: smaller lens (more cells / smaller grid) -> weaker refraction
  float lensRadiusLogical = 0.5 * u_lensScale * u_gridScale / max(cellsMax, 1.0);

  float sizeNorm = clamp(
    (lensRadiusLogical - REFR_SIZE_MIN_RADIUS) /
      (REFR_SIZE_MAX_RADIUS - REFR_SIZE_MIN_RADIUS + 1e-6),
    0.0,
    1.0
  );

  float refrSizeScale = mix(REFR_SIZE_MIN_SCALE, REFR_SIZE_MAX_SCALE, sizeNorm);

  float geomAmpRefract = geomAmp * refrSizeScale;

  // ------------------------------------------------------
  // Chromatic aberration / IOR
  // ------------------------------------------------------
  float iorG = max(u_ior, 1.0001);
  float iorRatio = (iorG - 1.0) / (iorG + 1.0);
  float baseDelta = clamp(u_aberration, 0.0, 0.3);
  bool noAberration = baseDelta <= EPS;

  float eff = 0.0;
  vec3 refrColor;

  if (noAberration) {
    float vis;
    vec2 offsetUv = computeRefractOffset(Nview, iorG, geomAmpRefract);
    vec2 srcUV = wrapUV(uv + offsetUv, u_wrapMode, vis);

    eff = clamp(activeArea * vis, 0.0, 1.0);

    float blurWeight = eff > 0.0 ? maskTex * eff : 0.0;
    vec2 finalUV = mix(uv, srcUV, eff);
    vec3 s = sampleRefractTex(finalUV, blurWeight);
    refrColor = s;
  } else {
    // 1. material / IOR
    float F0 = iorRatio * sqrt(max(iorRatio, 0.0));
    float F0Norm = clamp((F0 - 0.02) / 0.1, 0.0, 1.0);
    float dispersionScale = mix(0.6, 1.4, F0Norm);

    // 2. radius: stronger CA near rim
    float radialCA = pow(clamp(rNorm, 0.0, 1.0), 1.3);

    // 3. curvature
    float curvMin = 0.1;
    float curvMax = 5.0;
    float curvNorm = clamp((u_curvature - curvMin) / (curvMax - curvMin), 0.0, 1.0);
    float curvatureScale = mix(0.75, 1.25, curvNorm);

    float deltaIOR = baseDelta * dispersionScale * radialCA * curvatureScale;
    deltaIOR = clamp(deltaIOR, 0.0, 0.3);

    float iorR = iorG + deltaIOR;
    float iorB = max(1.0001, iorG - deltaIOR);

    float visR, visG, visB;

    vec2 offsetUvR = computeRefractOffset(Nview, iorR, geomAmpRefract);
    vec2 offsetUvG = computeRefractOffset(Nview, iorG, geomAmpRefract);
    vec2 offsetUvB = computeRefractOffset(Nview, iorB, geomAmpRefract);

    vec2 srcUV_R = wrapUV(uv + offsetUvR, u_wrapMode, visR);
    vec2 srcUV_G = wrapUV(uv + offsetUvG, u_wrapMode, visG);
    vec2 srcUV_B = wrapUV(uv + offsetUvB, u_wrapMode, visB);

    float visible = visG;
    eff = clamp(activeArea * visible, 0.0, 1.0);

    float blurWeight = eff > 0.0 ? maskTex * eff : 0.0;

    vec2 finalUV_R = mix(uv, srcUV_R, eff);
    vec2 finalUV_G = mix(uv, srcUV_G, eff);
    vec2 finalUV_B = mix(uv, srcUV_B, eff);

    vec3 sR = sampleRefractTex(finalUV_R, blurWeight);
    vec3 sG = sampleRefractTex(finalUV_G, blurWeight);
    vec3 sB = sampleRefractTex(finalUV_B, blurWeight);
    refrColor = vec3(sR.r, sG.g, sB.b);
  }

  if (eff <= 0.0) {
    fragColor = baseColor;
    return;
  }

  // ------------------------------------------------------
  // Highlight & rim shadow
  // ------------------------------------------------------
  vec3 N = Nview;
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 L = normalize(u_lightDir);
  vec3 H = normalize(L + V);

  float NdotL = max(dot(N, L), 0.0);
  float NdotH = max(dot(N, H), 0.0);
  float NdotV = clamp(dot(N, V), 0.0, 1.0);

  float edgeSoft01 = clamp(u_edgeSoftness, 0.0, 1.0);
  float edgeStart = mix(0.0, 0.6, edgeSoft01);
  float rimBase = smoothstep(edgeStart, 1.0, rNorm);

  float sharpSpec = u_specPower;
  float specLobe = pow(NdotH, sharpSpec);

  float sideX = smoothstep(0.6, 0.98, abs(N.x)) * (1.0 - smoothstep(0.0, 0.3, abs(N.y)));
  float sideY = smoothstep(0.6, 0.98, abs(N.y)) * (1.0 - smoothstep(0.0, 0.3, abs(N.x)));
  float sideMaskX = pow(sideX, sharpSpec);
  float sideMaskY = pow(sideY, sharpSpec);

  float squareness = clamp((u_squircle - 8.0) / (25.0 - 8.0), 0.0, 1.0);

  float highlightMaskGeom = rimBase + squareness * (sideMaskX + sideMaskY);
  highlightMaskGeom = clamp(highlightMaskGeom, 0.0, 1.0);

  float n = clamp(u_ior, 1.05, 2.5);
  float f0Ratio2 = (n - 1.0) / (n + 1.0);
  float F02 = f0Ratio2 * f0Ratio2;
  float F0Norm2 = clamp((F02 - 0.02) / 0.2, 0.0, 1.0);
  float iorSpecScale = mix(0.25, 1.5, F0Norm2);

  // 1) bright highlight (screen-like)
  float lightTerm = mix(0.2, 1.0, NdotL) * specLobe;

  float specAmt = u_specAmount * u_strength * highlightMaskGeom * lightTerm * iorSpecScale;

  float curvMin2 = 0.1;
  float curvMax2 = 5.0;
  float curvNormGlow = clamp((u_curvature - curvMin2) / (curvMax2 - curvMin2), 0.0, 1.0);

  float curvBoost = mix(0.8, 1.2, curvNormGlow) * 5.0 + sharpSpec * 0.5;

  specAmt *= curvBoost;
  specAmt *= maskTex;
  specAmt = max(specAmt, 0.0);

  vec3 specLight = clamp(u_specColor * specAmt, 0.0, 1.0);

  vec3 col = refrColor;
  col = 1.0 - (1.0 - col) * (1.0 - specLight);

  // 2) dark rim (multiply-like)
  float shadowGlobalStrength = u_shadowAmount * u_strength;

  float shadowInnerBase = 0.0;
  float rimShadowBase = smoothstep(shadowInnerBase, 1.0, rNorm);
  float shadowPower = max(u_shadowPower, 0.01);
  float rimShadow = pow(rimShadowBase, shadowPower);

  float sideShadow = pow(1.0 - NdotL, 1.1 + shadowPower);

  float F0shadow = F02;
  float fresnelEdge = F0shadow + (1.0 - F0shadow) * pow(1.0 - NdotV, 1.25 + shadowPower);

  float shadowMask = rimShadow * sideShadow * fresnelEdge;
  shadowMask = clamp(shadowMask, 0.0, 1.0);

  float rimShadowAmt = shadowGlobalStrength * maskTex * shadowMask;
  rimShadowAmt = clamp(rimShadowAmt, 0.0, 0.95);

  float globalShadowBase = shadowGlobalStrength * 0.15;
  globalShadowBase = clamp(globalShadowBase, 0.0, 0.2);

  float totalShadowAmt = globalShadowBase + rimShadowAmt * (1.0 - globalShadowBase);
  totalShadowAmt = clamp(totalShadowAmt, 0.0, 0.95);

  vec3 shadowColor = clamp(u_shadowColor, 0.0, 1.0);
  vec3 shadowTint = mix(vec3(1.0), shadowColor, totalShadowAmt);

  col *= shadowTint;

  vec3 glassPhys = clamp(col, 0.0, 1.0);

  // final mix
  float mixAmount = clamp(u_mix, 0.0, 1.0);
  float effectMask = eff * mixAmount;
  vec3 finalRGB = mix(baseColor.rgb, glassPhys, effectMask);
  fragColor = vec4(finalRGB, baseColor.a);
}
