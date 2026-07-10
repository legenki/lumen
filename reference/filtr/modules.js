// Module registry extracted verbatim from the deployed filtr-tool bundle
// (bundle-pretty.js:39359-41282, anchor: `label: "Fill: Media File"`).
// Minified identifiers replaced by named constants below; !0/!1 -> true/false.
// Bundle var -> constant name mapping (all option tables referenced by panels):
//   cs  (bundle-pretty.js:39331) -> BLEND_MODES
//   xs  (bundle-pretty.js:39247) -> WRAP_MODES
//   CI  (bundle-pretty.js:39279) -> ALPHA_MODES
//   Qh  (bundle-pretty.js:39309) -> GRADIENT_MODES
//   Gn  (bundle-pretty.js:39263) -> SINE_MODES
//   Pi  (bundle-pretty.js:39259) -> FREQ_MODES
//   Bh  (bundle-pretty.js:39268) -> SIMPLEX_NOISE_MODES
//   lh  (bundle-pretty.js:39283) -> DISPLACE_TEXTURE_SOURCE_MODES
//   _B  (bundle-pretty.js:39316) -> RGB_SHIFT_MODES
//   m4  (bundle-pretty.js:39291) -> EMBOSS_HEIGHT_SOURCE_MODES
//   w4  (bundle-pretty.js:39295) -> EMBOSS_CONTOUR_MODES
//   y4  (bundle-pretty.js:39287) -> EMBOSS_COLOR_MODES
//   D4  (bundle-pretty.js:39321) -> WARP_GRID_MODES
//   F4  (bundle-pretty.js:39326) -> WARP_GRID_FALLOFF_MODES
//   f4  (bundle-pretty.js:39272) -> MASK_CHANNELS
//   u4  (bundle-pretty.js:39178, `const u4 = 1e3`) -> MAX_SIMPLEX_HIGH_FREQ (numeric constant, not a table)

export const BLEND_MODES = {
  Normal: 0,
  Darken: 1,
  Multiply: 2,
  "Color Burn": 3,
  "Linear Burn": 4,
  "Darker Color": 5,
  Lighten: 6,
  Screen: 7,
  "Color Dodge": 8,
  "Linear Dodge (Add)": 9,
  "Lighter Color": 10,
  Overlay: 11,
  "Soft Light": 12,
  "Hard Light": 13,
  "Vivid Light": 14,
  "Linear Light": 15,
  "Pin Light": 16,
  "Hard Mix": 17,
  Difference: 18,
  Exclusion: 19,
  Subtract: 20,
  Divide: 21,
  Hue: 22,
  Saturation: 23,
  Color: 24,
  Luminosity: 25,
};

export const WRAP_MODES = {
  CLAMP: 0,
  REPEAT: 1,
  MIRROR: 2,
  TRANSPARENT: 3,
};

export const ALPHA_MODES = {
  "Ignore Source Alpha": 0,
  "Fade by Source Alpha": 1,
};

export const GRADIENT_MODES = {
  Linear: 0,
  Radial: 1,
  Angular: 2,
  Box: 3,
  Triangle: 4,
};

export const SINE_MODES = {
  "Flow (2D)": 0,
  "Radial (2D)": 1,
  "Radial (Center)": 2,
};

export const FREQ_MODES = {
  "Low Frequency": 0,
  "High Frequency": 1,
};

export const SIMPLEX_NOISE_MODES = {
  "1D Noise": 0,
  "2D Noise": 1,
};

export const DISPLACE_TEXTURE_SOURCE_MODES = {
  "Previous Pass": 0,
  "Media File": 1,
};

export const RGB_SHIFT_MODES = {
  Directional: 0,
  Center: 1,
  Edges: 2,
};

export const EMBOSS_HEIGHT_SOURCE_MODES = {
  Luma: 0,
  Alpha: 1,
};

export const EMBOSS_CONTOUR_MODES = {
  Linear: 0,
  Cone: 1,
  "Cone Inverted": 2,
  "Cove Deep": 3,
  "Cove Shallow": 4,
  "Ring Double": 5,
  "Ring Triple": 6,
  Arch: 7,
  Bump: 8,
  "Half Round": 9,
  Notch: 10,
  Triangle: 11,
};

export const EMBOSS_COLOR_MODES = {
  Grayscale: 0,
  "Colored Lighting": 1,
};

export const WARP_GRID_MODES = {
  "1D": 0,
  "2D Unified": 1,
  "2D Separate": 2,
};

export const WARP_GRID_FALLOFF_MODES = {
  Off: 0,
  Center: 1,
  Edges: 2,
};

export const MASK_CHANNELS = {
  Luma: 0,
  Alpha: 1,
  "R Channel": 2,
  "G Channel": 3,
  "B Channel": 4,
};

// Numeric constant (not an option table): max value for displaceSimplex's
// "High Frequency" seed control range.
const MAX_SIMPLEX_HIGH_FREQ = 1e3;

export const MODULES = {
        fillMedia: {
            label: "Fill: Media File",
            type: "pass",
            module: "fillMedia",
            defaults: {
                image: "text0",
                blendMode: 0,
                mix: 1,
                scale: 100,
                rotate: 0,
                position: {
                    x: 0,
                    y: 0
                },
                wrapMode: 3
            },
            panels: [{
                root: true,
                controls: [{
                    type: "select",
                    key: "blendMode",
                    label: "Blending Mode",
                    options: BLEND_MODES
                }, {
                    type: "number",
                    key: "mix",
                    label: "Pass Mix",
                    min: 0,
                    max: 1,
                    step: .01
                }, {
                    type: "separator"
                }, {
                    type: "media",
                    key: "image",
                    label: "Texture",
                    pool: "main",
                    view: "thumbnail-list",
                    allowNone: true,
                    imageDataKey: "image"
                }, {
                    type: "separator"
                }, {
                    type: "number",
                    key: "scale",
                    label: "Scale Image",
                    min: 1,
                    max: 250,
                    step: .1
                }, {
                    type: "number",
                    key: "rotate",
                    label: "Rotate Image",
                    min: -180,
                    max: 180,
                    step: 1
                }, {
                    type: "point2d",
                    key: "position",
                    label: "Position Offset",
                    picker: "inline",
                    expanded: false,
                    x: {
                        min: -50,
                        max: 50,
                        step: .1
                    },
                    y: {
                        min: -50,
                        max: 50,
                        step: .1
                    }
                }, {
                    type: "separator"
                }, {
                    type: "select",
                    key: "wrapMode",
                    label: "Wrapping Mode",
                    options: WRAP_MODES
                }]
            }]
        },
        fillColor: {
            label: "Fill: Color",
            type: "pass",
            module: "fillColor",
            defaults: {
                blendMode: 0,
                mix: 1,
                color: "#FFFFFF",
                alphaMode: 0
            },
            panels: [{
                root: true,
                controls: [{
                    type: "select",
                    key: "blendMode",
                    label: "Blending Mode",
                    options: BLEND_MODES
                }, {
                    type: "number",
                    key: "mix",
                    label: "Pass Mix",
                    min: 0,
                    max: 1,
                    step: .01
                }, {
                    type: "separator"
                }, {
                    type: "color",
                    key: "color",
                    label: "Color",
                    picker: "inline",
                    expanded: false
                }, {
                    type: "select",
                    key: "alphaMode",
                    label: "Alpha Mode",
                    options: ALPHA_MODES
                }]
            }]
        },
        fillGradient: {
            label: "Fill: Gradient",
            type: "pass",
            module: "fillGradient",
            defaults: {
                mix: 1,
                gradient: [{
                    time: 0,
                    value: {
                        r: 255,
                        g: 255,
                        b: 255,
                        a: 1
                    }
                }, {
                    time: 1,
                    value: {
                        r: 0,
                        g: 0,
                        b: 0,
                        a: 1
                    }
                }],
                gradMode: 0,
                alphaMode: 0,
                blendMode: 0,
                gradScale: 1,
                gradCenter: {
                    x: 0,
                    y: 0
                },
                gradAngle: 0,
                gradReverse: false,
                wrapMode: 0
            },
            panels: [{
                root: true,
                controls: [{
                    type: "select",
                    key: "blendMode",
                    label: "Blending Mode",
                    options: BLEND_MODES
                }, {
                    type: "number",
                    key: "mix",
                    label: "Pass Mix",
                    min: 0,
                    max: 1,
                    step: .01
                }, {
                    type: "separator"
                }, {
                    type: "select",
                    key: "gradMode",
                    label: "Gradient Mode",
                    options: GRADIENT_MODES
                }, {
                    type: "gradient",
                    key: "gradient",
                    label: "Gradient"
                }, {
                    type: "select",
                    key: "alphaMode",
                    label: "Alpha Mode",
                    options: ALPHA_MODES
                }, {
                    type: "separator"
                }, {
                    type: "number",
                    key: "gradScale",
                    label: "Gradient Scale",
                    min: .01,
                    max: 3,
                    step: .01,
                    showIf: {
                        key: "gradMode",
                        notEquals: GRADIENT_MODES[Object.keys(GRADIENT_MODES)[2]]
                    }
                }, {
                    type: "number",
                    key: "gradAngle",
                    label: "Gradient Angle",
                    min: -180,
                    max: 180,
                    step: 1
                }, {
                    type: "bool",
                    key: "gradReverse",
                    label: "Reverse Gradient"
                }, {
                    type: "separator"
                }, {
                    type: "point2d",
                    key: "gradCenter",
                    label: "Center Point",
                    picker: "inline",
                    expanded: false,
                    x: {
                        min: -.5,
                        max: .5,
                        step: .01
                    },
                    y: {
                        min: -.5,
                        max: .5,
                        step: .01
                    }
                }, {
                    type: "select",
                    key: "wrapMode",
                    label: "Wrapping Mode",
                    options: WRAP_MODES
                }]
            }]
        },
        fillNoise: {
            label: "Fill: Noise Grain",
            type: "pass",
            module: "fillNoise",
            defaults: {
                mix: .2,
                blendMode: 0,
                threshold: {
                    min: 0,
                    max: 1
                },
                alphaMode: 0,
                contrast: 1,
                colorNoise: false,
                size: 1,
                fps: 0
            },
            panels: [{
                root: true,
                controls: [{
                    type: "select",
                    key: "blendMode",
                    label: "Blending Mode",
                    options: BLEND_MODES
                }, {
                    type: "number",
                    key: "mix",
                    label: "Pass Mix",
                    min: 0,
                    max: 1,
                    step: .01
                }, {
                    type: "separator"
                }, {
                    type: "interval",
                    key: "threshold",
                    label: "Luma Threshold",
                    min: 0,
                    max: 1,
                    step: .01
                }, {
                    type: "number",
                    key: "contrast",
                    label: "Grain Contrast",
                    min: .5,
                    max: 5,
                    step: .01
                }, {
                    type: "separator"
                }, {
                    type: "bool",
                    key: "colorNoise",
                    label: "Color Noise"
                }, {
                    type: "number",
                    key: "size",
                    label: "Grain Size",
                    min: 1,
                    max: 10,
                    step: .1
                }, {
                    type: "select",
                    key: "alphaMode",
                    label: "Alpha Mode",
                    options: ALPHA_MODES
                }, {
                    type: "separator"
                }, {
                    type: "number",
                    key: "fps",
                    label: "Animation (FPS)",
                    min: 0,
                    max: 60,
                    step: 1
                }]
            }]
        },
        displaceSine: {
            label: "Displace: Sine",
            type: "pass",
            module: "displaceSine",
            defaults: {
                sineMode: SINE_MODES[Object.keys(SINE_MODES)[0]],
                amp: 10,
                compress: 0,
                aspect: 0,
                center: {
                    x: 0,
                    y: 0
                },
                freqMode: FREQ_MODES[Object.keys(FREQ_MODES)[0]],
                freqLow: 10,
                freqHigh: 100,
                angle: 0,
                phase: 0,
                cycle: 0,
                wrapMode: 0
            },
            panels: [{
                root: true,
                controls: [{
                    type: "select",
                    key: "sineMode",
                    label: "Sine Mode",
                    options: SINE_MODES
                }, {
                    type: "number",
                    key: "amp",
                    label: "Amplify",
                    min: 0,
                    max: 100,
                    step: .1
                }, {
                    type: "number",
                    key: "compress",
                    label: "Peaks Compress",
                    min: 0,
                    max: .95,
                    step: .01
                }, {
                    type: "separator"
                }, {
                    type: "number",
                    key: "aspect",
                    label: "Axis Aspect",
                    min: -1,
                    max: 1,
                    step: .01
                }, {
                    type: "number",
                    key: "angle",
                    label: "Space Rotation",
                    min: -180,
                    max: 180,
                    step: 1
                }, {
                    type: "separator"
                }, {
                    type: "select",
                    key: "freqMode",
                    label: "Frequency Mode",
                    options: FREQ_MODES
                }, {
                    type: "number",
                    key: "freqLow",
                    label: "Frequency Scale",
                    min: 0,
                    max: 25,
                    step: .1,
                    showIf: {
                        key: "freqMode",
                        in: [FREQ_MODES[Object.keys(FREQ_MODES)[0]]]
                    }
                }, {
                    type: "number",
                    key: "freqHigh",
                    label: "Frequency Scale",
                    min: 25,
                    max: 250,
                    step: 1,
                    showIf: {
                        key: "freqMode",
                        in: [FREQ_MODES[Object.keys(FREQ_MODES)[1]]]
                    }
                }, {
                    type: "separator"
                }, {
                    type: "number",
                    key: "phase",
                    label: "Phase Shift",
                    min: 0,
                    max: 1,
                    step: .01
                }, {
                    type: "number",
                    key: "cycle",
                    label: "Cycles",
                    min: -10,
                    max: 10,
                    step: .1
                }, {
                    type: "separator"
                }, {
                    type: "point2d",
                    key: "center",
                    label: "Center Point",
                    picker: "inline",
                    expanded: false,
                    x: {
                        min: -1,
                        max: 1,
                        step: .01
                    },
                    y: {
                        min: -1,
                        max: 1,
                        step: .01
                    },
                    showIf: {
                        key: "sineMode",
                        in: [SINE_MODES[Object.keys(SINE_MODES)[1]], SINE_MODES[Object.keys(SINE_MODES)[2]], SINE_MODES[Object.keys(SINE_MODES)[3]]]
                    }
                }, {
                    type: "select",
                    key: "wrapMode",
                    label: "Wrapping Mode",
                    options: WRAP_MODES
                }]
            }]
        },
        displaceCubic: {
            label: "Displace: Cubic Grid",
            type: "pass",
            module: "displaceCubic",
            defaults: {
                amp: {
                    x: .7,
                    y: .7
                },
                tile: {
                    x: 8,
                    y: 8
                },
                angle: 0,
                phase: 0,
                cycle: {
                    x: 0,
                    y: 0
                },
                wrapMode: 0
            },
            panels: [{
                root: true,
                controls: [{
                    type: "point2d",
                    key: "amp",
                    label: "Amplify",
                    picker: "inline",
                    expanded: false,
                    x: {
                        min: 0,
                        max: 1,
                        step: .01
                    },
                    y: {
                        min: 0,
                        max: 1,
                        step: .01
                    }
                }, {
                    type: "separator"
                }, {
                    type: "point2d",
                    key: "tile",
                    label: "Tiles Amount",
                    picker: "inline",
                    expanded: false,
                    x: {
                        min: 1,
                        max: 128,
                        step: 1
                    },
                    y: {
                        min: 1,
                        max: 128,
                        step: 1
                    }
                }, {
                    type: "number",
                    key: "angle",
                    label: "Grid Rotation",
                    min: -180,
                    max: 180,
                    step: 1
                }, {
                    type: "separator"
                }, {
                    type: "number",
                    key: "phase",
                    label: "Phase Shift",
                    min: 0,
                    max: 1,
                    step: .01
                }, {
                    type: "point2d",
                    key: "cycle",
                    label: "Cycles Amount",
                    picker: "inline",
                    expanded: false,
                    x: {
                        min: -10,
                        max: 10,
                        step: .1
                    },
                    y: {
                        min: -10,
                        max: 10,
                        step: .1
                    }
                }, {
                    type: "separator"
                }, {
                    type: "select",
                    key: "wrapMode",
                    label: "Wrapping Mode",
                    options: WRAP_MODES
                }]
            }]
        },
        displaceSimplex: {
            label: "Displace: Simplex Noise",
            type: "pass",
            module: "displaceSimplex",
            defaults: {
                noiseMode: SIMPLEX_NOISE_MODES[Object.keys(SIMPLEX_NOISE_MODES)[0]],
                amp: 10,
                octaves: 1,
                aspect: 0,
                angleDomain: 0,
                angleVector: 0,
                freqMode: FREQ_MODES[Object.keys(FREQ_MODES)[0]],
                freqLow: 10,
                freqHigh: 100,
                speed: 0,
                seed: 0,
                wrapMode: 0
            },
            panels: [{
                root: true,
                controls: [{
                    type: "select",
                    key: "noiseMode",
                    label: "Noise Mode",
                    options: SIMPLEX_NOISE_MODES
                }, {
                    type: "number",
                    key: "amp",
                    label: "Amplify",
                    min: 0,
                    max: 100,
                    step: .1
                }, {
                    type: "number",
                    key: "octaves",
                    label: "Noise Octaves",
                    min: 1,
                    max: 5,
                    step: 1
                }, {
                    type: "separator"
                }, {
                    type: "number",
                    key: "aspect",
                    label: "Axis Aspect",
                    min: -1,
                    max: 1,
                    step: .01
                }, {
                    type: "number",
                    key: "angleDomain",
                    label: "Domain Rotate",
                    min: -180,
                    max: 180,
                    step: 1
                }, {
                    type: "separator"
                }, {
                    type: "select",
                    key: "freqMode",
                    label: "Frequency Mode",
                    options: FREQ_MODES
                }, {
                    type: "number",
                    key: "freqLow",
                    label: "Frequency Scale",
                    min: 0,
                    max: 25,
                    step: .1,
                    showIf: {
                        key: "freqMode",
                        in: [FREQ_MODES[Object.keys(FREQ_MODES)[0]]]
                    }
                }, {
                    type: "number",
                    key: "freqHigh",
                    label: "Frequency Scale",
                    min: 25,
                    max: 1e3,
                    step: 1,
                    showIf: {
                        key: "freqMode",
                        in: [FREQ_MODES[Object.keys(FREQ_MODES)[1]]]
                    }
                }, {
                    type: "number",
                    key: "angleVector",
                    label: "Vector Angle",
                    min: -180,
                    max: 180,
                    step: 1
                }, {
                    type: "separator"
                }, {
                    type: "number",
                    key: "speed",
                    label: "Noise Speed",
                    min: 0,
                    max: 100,
                    step: 1
                }, {
                    type: "number",
                    key: "seed",
                    label: "Noise Seed",
                    min: 0,
                    max: MAX_SIMPLEX_HIGH_FREQ,
                    step: 1
                }, {
                    type: "separator"
                }, {
                    type: "select",
                    key: "wrapMode",
                    label: "Wrapping Mode",
                    options: WRAP_MODES
                }]
            }]
        },
        displaceTexture: {
            label: "Displace: Texture Map",
            type: "pass",
            module: "displaceTexture",
            defaults: {
                texture: "img0",
                weight: {
                    x: .5,
                    y: .5
                },
                scale: 100,
                position: {
                    x: 0,
                    y: 0
                },
                wrapMode: 3,
                mode: 0,
                source: "img1",
                scaleSrc: 100,
                rotateSrc: 0,
                positionSrc: {
                    x: 0,
                    y: 0
                },
                wrapModeSrc: 2
            },
            panels: [{
                root: true,
                controls: [{
                    type: "media",
                    key: "texture",
                    label: "Texture",
                    pool: "main",
                    view: "thumbnail-list",
                    allowNone: true,
                    imageDataKey: "texture"
                }, {
                    type: "point2d",
                    key: "weight",
                    label: "Displace Weight",
                    picker: "inline",
                    expanded: false,
                    x: {
                        min: -5,
                        max: 5,
                        step: .01
                    },
                    y: {
                        min: -5,
                        max: 5,
                        step: .01
                    }
                }, {
                    type: "separator"
                }, {
                    type: "number",
                    key: "scale",
                    label: "Texture Scale",
                    min: 1,
                    max: 250,
                    step: .1
                }, {
                    type: "point2d",
                    key: "position",
                    label: "Position Offset",
                    picker: "inline",
                    expanded: false,
                    x: {
                        min: -50,
                        max: 50,
                        step: .1
                    },
                    y: {
                        min: -50,
                        max: 50,
                        step: .1
                    }
                }, {
                    type: "select",
                    key: "wrapMode",
                    label: "Wrapping Mode",
                    options: WRAP_MODES
                }, {
                    type: "separator"
                }, {
                    type: "select",
                    key: "mode",
                    label: "Source",
                    options: DISPLACE_TEXTURE_SOURCE_MODES
                }, {
                    type: "media",
                    key: "source",
                    label: "Texture",
                    pool: "main",
                    view: "thumbnail-list",
                    allowNone: true,
                    imageDataKey: "source",
                    showIf: {
                        key: "mode",
                        in: [DISPLACE_TEXTURE_SOURCE_MODES[Object.keys(DISPLACE_TEXTURE_SOURCE_MODES)[1]]]
                    }
                }, {
                    type: "number",
                    key: "scaleSrc",
                    label: "Source Scale",
                    min: 1,
                    max: 250,
                    step: .1
                }, {
                    type: "number",
                    key: "rotateSrc",
                    label: "Source Rotate",
                    min: -180,
                    max: 180,
                    step: 1
                }, {
                    type: "point2d",
                    key: "positionSrc",
                    label: "Source Offset",
                    picker: "inline",
                    expanded: false,
                    x: {
                        min: -50,
                        max: 50,
                        step: .1
                    },
                    y: {
                        min: -50,
                        max: 50,
                        step: .1
                    }
                }, {
                    type: "select",
                    key: "wrapModeSrc",
                    label: "Wrapping Mode",
                    options: WRAP_MODES
                }]
            }]
        },
        blurGaussian: {
            label: "Blur: Gaussian",
            type: "pass",
            module: "blurGaussian",
            defaults: {
                mix: 1,
                blendMode: 0,
                radius: 15,
                aspect: 0
            },
            panels: [{
                root: true,
                controls: [{
                    type: "select",
                    key: "blendMode",
                    label: "Blending Mode",
                    options: BLEND_MODES
                }, {
                    type: "number",
                    key: "mix",
                    label: "Pass Mix",
                    min: 0,
                    max: 1,
                    step: .01
                }, {
                    type: "separator"
                }, {
                    type: "number",
                    key: "radius",
                    label: "Blur Radius",
                    min: 0,
                    max: 50,
                    step: 1
                }, {
                    type: "number",
                    key: "aspect",
                    label: "Aspect Ratio",
                    min: -1,
                    max: 1,
                    step: .01
                }]
            }]
        },
        blurMotion: {
            label: "Blur: Motion",
            type: "pass",
            module: "blurMotion",
            defaults: {
                mix: 1,
                blendMode: 0,
                radius: 15,
                angle: 0
            },
            panels: [{
                root: true,
                controls: [{
                    type: "select",
                    key: "blendMode",
                    label: "Blending Mode",
                    options: BLEND_MODES
                }, {
                    type: "number",
                    key: "mix",
                    label: "Pass Mix",
                    min: 0,
                    max: 1,
                    step: .01
                }, {
                    type: "separator"
                }, {
                    type: "number",
                    key: "radius",
                    label: "Blur Radius",
                    min: 0,
                    max: 50,
                    step: 1
                }, {
                    type: "number",
                    key: "angle",
                    label: "Blur Angle",
                    min: -180,
                    max: 180,
                    step: 1
                }]
            }]
        },
        blurNoise: {
            label: "Blur: Blue-Noise",
            type: "pass",
            module: "blurNoise",
            defaults: {
                mix: 1,
                blendMode: 0,
                radius: 8,
                samples: 16,
                scale: 5
            },
            panels: [{
                root: true,
                controls: [{
                    type: "select",
                    key: "blendMode",
                    label: "Blending Mode",
                    options: BLEND_MODES
                }, {
                    type: "number",
                    key: "mix",
                    label: "Pass Mix",
                    min: 0,
                    max: 1,
                    step: .01
                }, {
                    type: "separator"
                }, {
                    type: "number",
                    key: "radius",
                    label: "Blur Radius",
                    min: 0,
                    max: 50,
                    step: .1
                }, {
                    type: "separator"
                }, {
                    type: "number",
                    key: "samples",
                    label: "Noise Samples",
                    min: 1,
                    max: 24,
                    step: 1
                }, {
                    type: "number",
                    key: "scale",
                    label: "Noise Scale",
                    min: 0,
                    max: 1,
                    step: .01
                }]
            }]
        },
        gradientMap: {
            label: "Gradient Map",
            type: "pass",
            module: "gradientMap",
            defaults: {
                mix: 1,
                blendMode: 0,
                mapMode: 0,
                gradient: [{
                    time: 0,
                    value: {
                        r: 0,
                        g: 0,
                        b: 0,
                        a: 1
                    }
                }, {
                    time: 1,
                    value: {
                        r: 255,
                        g: 255,
                        b: 255,
                        a: 1
                    }
                }],
                mapReverse: false,
                mapGamma: 1,
                mapRange: {
                    min: 0,
                    max: 1
                },
                alphaMode: 0
            },
            panels: [{
                root: true,
                controls: [{
                    type: "select",
                    key: "blendMode",
                    label: "Blending Mode",
                    options: BLEND_MODES
                }, {
                    type: "number",
                    key: "mix",
                    label: "Pass Mix",
                    min: 0,
                    max: 1,
                    step: .01
                }, {
                    type: "separator"
                }, {
                    type: "number",
                    key: "mapGamma",
                    label: "Input Gamma",
                    min: .01,
                    max: 5,
                    step: .01
                }, {
                    type: "interval",
                    key: "mapRange",
                    label: "Input Range",
                    min: 0,
                    max: 1,
                    step: .01
                }, {
                    type: "bool",
                    key: "mapReverse",
                    label: "Reverse Map"
                }, {
                    type: "separator"
                }, {
                    type: "gradient",
                    key: "gradient",
                    label: "Gradient"
                }, {
                    type: "separator"
                }, {
                    type: "select",
                    key: "alphaMode",
                    label: "Alpha Mode",
                    options: ALPHA_MODES
                }]
            }]
        },
        colorCorrection: {
            label: "Color Adjust",
            type: "pass",
            module: "colorCorrection",
            defaults: {
                mix: 1,
                brightness: 0,
                contrast: 0,
                saturation: 1
            },
            panels: [{
                root: true,
                controls: [{
                    type: "number",
                    key: "mix",
                    label: "Pass Mix",
                    min: 0,
                    max: 1,
                    step: .01
                }, {
                    type: "separator"
                }, {
                    type: "number",
                    key: "brightness",
                    label: "Brightness",
                    min: -1,
                    max: 1,
                    step: .01
                }, {
                    type: "number",
                    key: "contrast",
                    label: "Contrast",
                    min: -1,
                    max: 5,
                    step: .01
                }, {
                    type: "separator"
                }, {
                    type: "number",
                    key: "saturation",
                    label: "Saturation",
                    min: 0,
                    max: 5,
                    step: .01
                }]
            }]
        },
        rgbShift: {
            label: "RGB Shift",
            type: "pass",
            module: "rgbShift",
            defaults: {
                mix: 1,
                abStrength: 10,
                abMode: 0,
                abAngle: 45,
                abFocus: {
                    x: 0,
                    y: 0
                },
                abChannel: {
                    x: .1,
                    y: .06,
                    z: .02
                },
                hueShift: 0,
                wrapMode: 2
            },
            panels: [{
                root: true,
                controls: [{
                    type: "number",
                    key: "mix",
                    label: "Pass Mix",
                    min: 0,
                    max: 1,
                    step: .01
                }, {
                    type: "separator"
                }, {
                    type: "select",
                    key: "abMode",
                    label: "Aberration Mode",
                    options: RGB_SHIFT_MODES
                }, {
                    type: "number",
                    key: "abStrength",
                    label: "Shift Strength",
                    min: -50,
                    max: 50,
                    step: .1
                }, {
                    type: "separator"
                }, {
                    type: "number",
                    key: "abAngle",
                    label: "Shift Angle",
                    min: -180,
                    max: 180,
                    step: 1,
                    showIf: {
                        key: "abMode",
                        equals: RGB_SHIFT_MODES[Object.keys(RGB_SHIFT_MODES)[0]]
                    }
                }, {
                    type: "point2d",
                    key: "abFocus",
                    label: "Focus Center",
                    picker: "inline",
                    expanded: false,
                    x: {
                        min: -.5,
                        max: .5,
                        step: .01
                    },
                    y: {
                        min: -.5,
                        max: .5,
                        step: .01
                    },
                    showIf: {
                        key: "abMode",
                        notEquals: RGB_SHIFT_MODES[Object.keys(RGB_SHIFT_MODES)[0]]
                    }
                }, {
                    type: "separator"
                }, {
                    type: "point3d",
                    key: "abChannel",
                    label: "Channel Shift",
                    picker: "inline",
                    expanded: false,
                    x: {
                        min: 0,
                        max: 1,
                        step: .01
                    },
                    y: {
                        min: 0,
                        max: 1,
                        step: .01
                    },
                    z: {
                        min: 0,
                        max: 1,
                        step: .01
                    }
                }, {
                    type: "number",
                    key: "hueShift",
                    label: "Hue Shift",
                    min: -1,
                    max: 1,
                    step: .01
                }, {
                    type: "separator"
                }, {
                    type: "select",
                    key: "wrapMode",
                    label: "Wrapping Mode",
                    options: WRAP_MODES
                }]
            }]
        },
        lumaBands: {
            label: "Luma Bands",
            type: "pass",
            module: "lumaBands",
            defaults: {
                blendMode: 0,
                mix: 1,
                weight: 1,
                weightAmp: 0,
                weightFreq: 1,
                phase: 0,
                phaseFreq: 0,
                contrast: 1
            },
            panels: [{
                root: true,
                controls: [{
                    type: "select",
                    key: "blendMode",
                    label: "Blending Mode",
                    options: BLEND_MODES
                }, {
                    type: "number",
                    key: "mix",
                    label: "Pass Mix",
                    min: 0,
                    max: 1,
                    step: .01
                }, {
                    type: "separator"
                }, {
                    type: "number",
                    key: "weight",
                    label: "Luma Weight",
                    min: 0,
                    max: 10,
                    step: .01
                }, {
                    type: "number",
                    key: "weightAmp",
                    label: "Animation Range",
                    min: 0,
                    max: 2,
                    step: .01
                }, {
                    type: "number",
                    key: "weightFreq",
                    label: "Frequency",
                    min: 0,
                    max: 5,
                    step: .1,
                    showIf: {
                        key: "weightAmp",
                        notEquals: 0
                    }
                }, {
                    type: "separator"
                }, {
                    type: "number",
                    key: "phase",
                    label: "Phase",
                    min: 0,
                    max: 1,
                    step: .01
                }, {
                    type: "number",
                    key: "phaseFreq",
                    label: "Phase Animation",
                    min: 0,
                    max: 10,
                    step: .1
                }, {
                    type: "separator"
                }, {
                    type: "number",
                    key: "contrast",
                    label: "Bands Contrast",
                    min: .25,
                    max: 5,
                    step: .01
                }]
            }]
        },
        embossEffect: {
            label: "Emboss / Relief",
            type: "pass",
            module: "embossEffect",
            defaults: {
                mix: 1,
                blendMode: 0,
                heightSource: 0,
                depthSize: 20,
                heightSize: .5,
                softness: .5,
                contourMode: 0,
                lightAlt: 30,
                lightAngle: 235,
                colorMode: 0,
                highColor: "#FFFFFF",
                highMode: 7,
                highOpacity: .9,
                shadColor: "#CCCCCC",
                shadMode: 7,
                shadOpacity: .9
            },
            panels: [{
                root: true,
                controls: [{
                    type: "select",
                    key: "blendMode",
                    label: "Blending Mode",
                    options: BLEND_MODES
                }, {
                    type: "number",
                    key: "mix",
                    label: "Pass Mix",
                    min: 0,
                    max: 1,
                    step: .01
                }, {
                    type: "separator"
                }, {
                    type: "select",
                    key: "heightSource",
                    label: "Height From",
                    options: EMBOSS_HEIGHT_SOURCE_MODES
                }, {
                    type: "number",
                    key: "depthSize",
                    label: "Depth Size",
                    min: 0,
                    max: 100,
                    step: .1
                }, {
                    type: "number",
                    key: "heightSize",
                    label: "Offset Size",
                    min: .01,
                    max: 10,
                    step: .01
                }, {
                    type: "number",
                    key: "softness",
                    label: "Blur Softness",
                    min: 0,
                    max: 1,
                    step: .01
                }, {
                    type: "separator"
                }, {
                    type: "select",
                    key: "contourMode",
                    label: "Gloss Contour",
                    options: EMBOSS_CONTOUR_MODES
                }, {
                    type: "number",
                    key: "lightAlt",
                    label: "Light Altitude",
                    min: 0,
                    max: 90,
                    step: .1
                }, {
                    type: "number",
                    key: "lightAngle",
                    label: "Light Angle",
                    min: 0,
                    max: 360,
                    step: 1
                }, {
                    type: "separator"
                }, {
                    type: "select",
                    key: "colorMode",
                    label: "Color Mode",
                    options: EMBOSS_COLOR_MODES
                }, {
                    type: "separator",
                    showIf: {
                        key: "colorMode",
                        in: [1]
                    }
                }, {
                    type: "color",
                    key: "highColor",
                    label: "High Color",
                    picker: "inline",
                    expanded: false,
                    showIf: {
                        key: "colorMode",
                        in: [1]
                    }
                }, {
                    type: "number",
                    key: "highOpacity",
                    label: "Opacity",
                    min: 0,
                    max: 1,
                    step: .01,
                    showIf: {
                        key: "colorMode",
                        in: [1]
                    }
                }, {
                    type: "select",
                    key: "highMode",
                    label: "Blending Mode",
                    options: BLEND_MODES,
                    showIf: {
                        key: "colorMode",
                        in: [1]
                    }
                }, {
                    type: "separator",
                    showIf: {
                        key: "colorMode",
                        in: [1]
                    }
                }, {
                    type: "color",
                    key: "shadColor",
                    label: "Shadow Color",
                    picker: "inline",
                    expanded: false,
                    showIf: {
                        key: "colorMode",
                        in: [1]
                    }
                }, {
                    type: "number",
                    key: "shadOpacity",
                    label: "Opacity",
                    min: 0,
                    max: 1,
                    step: .01,
                    showIf: {
                        key: "colorMode",
                        in: [1]
                    }
                }, {
                    type: "select",
                    key: "shadMode",
                    label: "Blending Mode",
                    options: BLEND_MODES,
                    showIf: {
                        key: "colorMode",
                        in: [1]
                    }
                }]
            }]
        },
        lensGrid: {
            label: "Lens Grid",
            type: "pass",
            module: "lensGrid",
            defaults: {
                mix: 1,
                strength: .5,
                blur: 1,
                gridCells: {
                    x: 6,
                    y: 6
                },
                gridScale: .9,
                gridAngle: 0,
                squircle: 8,
                lensScale: 1,
                ior: 1.5,
                curvature: 1,
                edgeSoftness: .1,
                aberration: .015,
                lightDir: {
                    x: .66,
                    y: .5
                },
                specAmount: .4,
                specPower: .5,
                specColor: "#FFFFFF",
                shadowAmount: .2,
                shadowPower: .5,
                shadowColor: "#000000",
                wrapMode: 2
            },
            panels: [{
                root: true,
                controls: [{
                    type: "number",
                    key: "strength",
                    label: "Effect Strength",
                    min: 0,
                    max: 1,
                    step: .01
                }, {
                    type: "number",
                    key: "blur",
                    label: "Blur Radius",
                    min: 0,
                    max: 5,
                    step: .1
                }, {
                    type: "separator"
                }, {
                    type: "point2d",
                    key: "gridCells",
                    label: "Grid Cells",
                    picker: "inline",
                    expanded: false,
                    x: {
                        min: 1,
                        max: 64,
                        step: 1
                    },
                    y: {
                        min: 1,
                        max: 64,
                        step: 1
                    }
                }, {
                    type: "number",
                    key: "gridScale",
                    label: "Grid Scale",
                    min: .5,
                    max: 2.5,
                    step: .01
                }, {
                    type: "number",
                    key: "gridAngle",
                    label: "Grid Rotation",
                    min: -180,
                    max: 180,
                    step: 1
                }, {
                    type: "separator"
                }]
            }, {
                title: "Lens Settings",
                expanded: false,
                controls: [{
                    type: "number",
                    key: "squircle",
                    label: "Lens Squircle",
                    min: 1,
                    max: 25,
                    step: .1
                }, {
                    type: "number",
                    key: "lensScale",
                    label: "Lens Scale",
                    min: .5,
                    max: 1.25,
                    step: .01
                }, {
                    type: "number",
                    key: "edgeSoftness",
                    label: "Edge Softness",
                    min: 0,
                    max: 1,
                    step: .01
                }, {
                    type: "separator"
                }, {
                    type: "number",
                    key: "ior",
                    label: "Glass IOR",
                    min: 1.05,
                    max: 3,
                    step: .01
                }, {
                    type: "number",
                    key: "curvature",
                    label: "Glass Curvature",
                    min: .1,
                    max: 5,
                    step: .01
                }, {
                    type: "number",
                    key: "aberration",
                    label: "Aberration",
                    min: 0,
                    max: .2,
                    step: .001
                }]
            }, {
                root: true,
                controls: [{
                    type: "separator"
                }]
            }, {
                title: "Light / Shadow",
                expanded: false,
                controls: [{
                    type: "point2d",
                    key: "lightDir",
                    label: "Light Direction",
                    picker: "inline",
                    expanded: false,
                    x: {
                        min: 0,
                        max: 1,
                        step: .01
                    },
                    y: {
                        min: -1,
                        max: 1,
                        step: .01
                    }
                }, {
                    type: "separator"
                }, {
                    type: "number",
                    key: "specAmount",
                    label: "Specular Amount",
                    min: 0,
                    max: 1,
                    step: .01
                }, {
                    type: "number",
                    key: "specPower",
                    label: "Specular Power",
                    min: .1,
                    max: 1,
                    step: .01
                }, {
                    type: "color",
                    key: "specColor",
                    label: "Color",
                    picker: "inline",
                    expanded: false
                }, {
                    type: "separator"
                }, {
                    type: "number",
                    key: "shadowAmount",
                    label: "Shadow Amount",
                    min: 0,
                    max: 1,
                    step: .01
                }, {
                    type: "number",
                    key: "shadowPower",
                    label: "Shadow Power",
                    min: .1,
                    max: 1,
                    step: .01
                }, {
                    type: "color",
                    key: "shadowColor",
                    label: "Color",
                    picker: "inline",
                    expanded: false
                }]
            }, {
                root: true,
                controls: [{
                    type: "separator"
                }, {
                    type: "select",
                    key: "wrapMode",
                    label: "Wrapping Mode",
                    options: WRAP_MODES
                }]
            }]
        },
        warpGrid: {
            label: "Warp Grid",
            type: "pass",
            module: "warpGrid",
            defaults: {
                mix: 1,
                strength: .1,
                cellFeather: 0,
                gridMode: 1,
                gridCell: 16,
                gridCells: {
                    x: 16,
                    y: 16
                },
                gridScale: 1,
                gridAngle: 0,
                falloffMode: 0,
                falloffRange: {
                    min: 0,
                    max: 1
                },
                falloffFocus1D: 0,
                falloffFocus2D: {
                    x: 0,
                    y: 0
                },
                wrapMode: 0
            },
            panels: [{
                root: true,
                controls: [{
                    type: "number",
                    key: "mix",
                    label: "Effect Mix",
                    min: 0,
                    max: 1,
                    step: .01
                }, {
                    type: "separator"
                }, {
                    type: "number",
                    key: "strength",
                    label: "Effect Strength",
                    min: 0,
                    max: 1,
                    step: .01
                }, {
                    type: "number",
                    key: "cellFeather",
                    label: "Cell Smoothing",
                    min: 0,
                    max: 1,
                    step: .01
                }, {
                    type: "separator"
                }, {
                    type: "select",
                    key: "gridMode",
                    label: "Grid Mode",
                    options: WARP_GRID_MODES
                }, {
                    type: "number",
                    key: "gridCell",
                    label: "Grid Cells",
                    min: 2,
                    max: 128,
                    step: 1,
                    showIf: {
                        key: "gridMode",
                        notEquals: 2
                    }
                }, {
                    type: "point2d",
                    key: "gridCells",
                    label: "Grid Cells",
                    picker: "inline",
                    expanded: false,
                    x: {
                        min: 2,
                        max: 128,
                        step: 1
                    },
                    y: {
                        min: 2,
                        max: 128,
                        step: 1
                    },
                    showIf: {
                        key: "gridMode",
                        equals: 2
                    }
                }, {
                    type: "number",
                    key: "gridScale",
                    label: "Grid Scale",
                    min: .5,
                    max: 2,
                    step: .01
                }, {
                    type: "number",
                    key: "gridAngle",
                    label: "Grid Rotation",
                    min: -180,
                    max: 180,
                    step: 1
                }, {
                    type: "separator"
                }, {
                    type: "select",
                    key: "falloffMode",
                    label: "Falloff Mode",
                    options: WARP_GRID_FALLOFF_MODES
                }, {
                    type: "interval",
                    key: "falloffRange",
                    label: "Falloff Range",
                    min: 0,
                    max: 1,
                    step: .01,
                    showIf: {
                        key: "falloffMode",
                        notEquals: 0
                    }
                }, {
                    type: "number",
                    key: "falloffFocus1D",
                    label: "Falloff Focus",
                    min: -.5,
                    max: .5,
                    step: .01,
                    showIf: [{
                        key: "gridMode",
                        equals: 0
                    }, {
                        key: "falloffMode",
                        notEquals: 0
                    }]
                }, {
                    type: "point2d",
                    key: "falloffFocus2D",
                    label: "Falloff Focus",
                    picker: "inline",
                    expanded: false,
                    x: {
                        min: -.5,
                        max: .5,
                        step: .01
                    },
                    y: {
                        min: -.5,
                        max: .5,
                        step: .01
                    },
                    showIf: [{
                        key: "gridMode",
                        notEquals: 0
                    }, {
                        key: "falloffMode",
                        notEquals: 0
                    }]
                }, {
                    type: "separator"
                }, {
                    type: "select",
                    key: "wrapMode",
                    label: "Wrapping Mode",
                    options: WRAP_MODES
                }]
            }]
        },
        maskMedia: {
            label: "MASK: Media File",
            type: "mask",
            module: "maskMedia",
            defaults: {
                image: "gradient-linear",
                __maskMembers: [],
                maskRange: {
                    min: 0,
                    max: 100
                },
                useChannel: 0,
                invert: false,
                contrast: {
                    min: 0,
                    max: 100
                },
                scale: 100,
                rotate: 0,
                position: {
                    x: 0,
                    y: 0
                },
                wrapMode: 0
            },
            panels: [{
                root: true,
                controls: [{
                    type: "media",
                    key: "image",
                    label: "Texture",
                    pool: "main",
                    view: "thumbnail-list",
                    allowNone: true,
                    imageDataKey: "image"
                }, {
                    type: "interval",
                    key: "maskRange",
                    label: "Mask Threshold",
                    min: 0,
                    max: 100,
                    step: .1
                }, {
                    type: "separator"
                }, {
                    type: "select",
                    key: "useChannel",
                    label: "Use Channel",
                    options: MASK_CHANNELS
                }, {
                    type: "bool",
                    key: "invert",
                    label: "Invert Colors"
                }, {
                    type: "interval",
                    key: "contrast",
                    label: "Contrast",
                    min: 0,
                    max: 100,
                    step: .1
                }, {
                    type: "separator"
                }, {
                    type: "number",
                    key: "scale",
                    label: "Scale Image",
                    min: 1,
                    max: 250,
                    step: .1
                }, {
                    type: "number",
                    key: "rotate",
                    label: "Rotate Image",
                    min: -180,
                    max: 180,
                    step: 1
                }, {
                    type: "point2d",
                    key: "position",
                    label: "Position Offset",
                    picker: "inline",
                    expanded: false,
                    x: {
                        min: -50,
                        max: 50,
                        step: .1
                    },
                    y: {
                        min: -50,
                        max: 50,
                        step: .1
                    }
                }, {
                    type: "separator"
                }, {
                    type: "select",
                    key: "wrapMode",
                    label: "Wrapping Mode",
                    options: WRAP_MODES
                }]
            }]
        }
    };
