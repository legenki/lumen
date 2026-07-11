// LUMEN — встроенные пресеты (дословно из reference/filtr/presets.js, старый формат filtr-tool v2)
// Конвертация в формат Lumen — src/js/presetConvert.js
export const PRESETS = [
  {
    toolId: "filtr-tool",
    version: 2,
    name: "Gradient Plating",
    createdAt: "2025-12-16_17-32-46",
    main: {
        cnv: {
            ratio: "1:1",
            animation: true,
            scale: {
                value: 3
            }
        },
        rec: {
            frame: 251,
            length: {
                value: 10
            }
        }
    },
    modules: [{
        ref: "p01",
        name: "fillGradient",
        enabled: true,
        params: {
            mix: 1,
            gradient: [{
                time: .503,
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
                    a: .6621126698052795
                }
            }],
            gradMode: 1,
            alphaMode: 0,
            blendMode: 0,
            gradScale: .66,
            gradCenter: {
                x: 0,
                y: 0
            },
            gradAngle: 0,
            gradReverse: false,
            wrapMode: 0
        }
    }, {
        ref: "p02",
        name: "displaceSimplex",
        enabled: true,
        params: {
            noiseMode: 1,
            amp: 32,
            octaves: 1,
            aspect: 0,
            angleDomain: 0,
            angleVector: 0,
            freqMode: 0,
            freqLow: 1.9999999999999996,
            freqHigh: 100,
            speed: 10,
            seed: 320,
            wrapMode: 0
        }
    }, {
        ref: "p03",
        name: "fillMedia",
        enabled: true,
        params: {
            image: "text0",
            blendMode: 2,
            mix: 1,
            scale: 90,
            rotate: 0,
            position: {
                x: 0,
                y: 0
            },
            wrapMode: 0
        }
    }, {
        ref: "p04",
        name: "blurGaussian",
        enabled: true,
        params: {
            mix: 1,
            blendMode: 0,
            radius: 10,
            aspect: 0
        }
    }, {
        ref: "p05",
        name: "colorCorrection",
        enabled: true,
        params: {
            mix: 1,
            brightness: 0,
            contrast: 1,
            saturation: 1
        }
    }, {
        ref: "p06",
        name: "embossEffect",
        enabled: true,
        params: {
            mix: 1,
            blendMode: 0,
            heightSource: 0,
            depthSize: .9999999999999944,
            heightSize: .49999999999999906,
            softness: 0,
            contourMode: 0,
            lightAlt: 18.5,
            lightAngle: 30,
            colorMode: 0,
            highColor: "#FFFFFF",
            highMode: 7,
            highOpacity: .8,
            shadColor: "#0000FF",
            shadMode: 7,
            shadOpacity: .8
        }
    }, {
        ref: "p07",
        name: "lumaBands",
        enabled: true,
        params: {
            blendMode: 0,
            mix: 1,
            weight: 2.16,
            weightAmp: 0,
            weightFreq: 1,
            phase: 0,
            phaseFreq: 0,
            contrast: 1
        }
    }, {
        ref: "p08",
        name: "fillNoise",
        enabled: true,
        params: {
            mix: .11,
            blendMode: 2,
            threshold: {
                min: 0,
                max: .8
            },
            alphaMode: 0,
            contrast: 1,
            colorNoise: true,
            size: 1,
            fps: 0,
            soft: .2
        }
    }, {
        ref: "p09",
        name: "fillColor",
        enabled: true,
        params: {
            blendMode: 11,
            mix: 1,
            color: "#0051ba",
            alphaMode: 0
        }
    }]
  },
  {
    toolId: "filtr-tool",
    version: 2,
    name: "Hyper Ink",
    createdAt: "2025-12-16_17-34-5",
    main: {
        cnv: {
            ratio: "1:1",
            animation: true,
            scale: {
                value: 3
            }
        },
        rec: {
            frame: 341,
            length: {
                value: 10
            }
        }
    },
    modules: [{
        ref: "p01",
        name: "fillColor",
        enabled: true,
        params: {
            blendMode: 0,
            mix: 1,
            color: "#FFFFFF",
            alphaMode: 0
        }
    }, {
        ref: "p02",
        name: "fillMedia",
        enabled: true,
        params: {
            image: "text0",
            blendMode: 0,
            mix: 1,
            scale: 100,
            rotate: 0,
            position: {
                x: 0,
                y: 0
            },
            wrapMode: 0
        }
    }, {
        ref: "p03",
        name: "embossEffect",
        enabled: true,
        params: {
            mix: 1,
            blendMode: 0,
            heightSource: 0,
            depthSize: 19.999999999999996,
            heightSize: 2.8,
            softness: .5,
            contourMode: 0,
            lightAlt: 75,
            lightAngle: 0,
            colorMode: 0,
            highColor: "#FFFFFF",
            highMode: 7,
            highOpacity: .8,
            shadColor: "#0000FF",
            shadMode: 7,
            shadOpacity: .8
        }
    }, {
        ref: "p04",
        name: "lumaBands",
        enabled: true,
        params: {
            blendMode: 0,
            mix: 1,
            weight: 1.5,
            weightAmp: 0,
            weightFreq: 1,
            phase: 0,
            phaseFreq: 0,
            contrast: 2
        }
    }, {
        ref: "m01",
        name: "maskMedia",
        enabled: true,
        params: {
            image: "gradient-circle",
            maskRange: {
                min: 20,
                max: 100
            },
            useChannel: 0,
            invert: false,
            contrast: {
                min: 0,
                max: 100
            },
            scale: 155.5,
            rotate: 0,
            position: {
                x: 0,
                y: 0
            },
            wrapMode: 0
        },
        members: ["p05", "p06"]
    }, {
        ref: "p05",
        name: "rgbShift",
        enabled: true,
        params: {
            mix: 1,
            abStrength: 5,
            abMode: 0,
            abAngle: 90,
            abFocus: {
                x: 0,
                y: 0
            },
            abChannel: {
                x: 20816681711721685e-33,
                y: .04000000000000002,
                z: .1
            },
            hueShift: 0,
            wrapMode: 2
        }
    }, {
        ref: "p06",
        name: "displaceCubic",
        enabled: true,
        params: {
            amp: {
                x: 0,
                y: .5999999999999999
            },
            tile: {
                x: 8,
                y: 4
            },
            angle: 0,
            phase: 0,
            cycle: {
                x: 1,
                y: 1
            },
            wrapMode: 0
        }
    }, {
        ref: "p07",
        name: "fillNoise",
        enabled: true,
        params: {
            mix: .6,
            blendMode: 11,
            threshold: {
                min: 0,
                max: 1
            },
            alphaMode: 1,
            contrast: 2.5,
            colorNoise: false,
            size: 1,
            fps: 0,
            soft: .5
        }
    }]
  },
  {
    toolId: "filtr-tool",
    version: 2,
    name: "Chroma Modulation",
    createdAt: "2025-12-16_17-47-52",
    main: {
        cnv: {
            ratio: "1:1",
            animation: true,
            scale: {
                value: 3
            }
        },
        rec: {
            frame: 223,
            length: {
                value: 5
            }
        }
    },
    modules: [{
        ref: "p01",
        name: "fillGradient",
        enabled: true,
        params: {
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
                time: .457,
                value: {
                    r: 82,
                    g: 53,
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
            gradScale: .06,
            gradCenter: {
                x: 0,
                y: 0
            },
            gradAngle: 90,
            gradReverse: false,
            wrapMode: 2
        }
    }, {
        ref: "p02",
        name: "fillMedia",
        enabled: false,
        params: {
            image: "img3",
            blendMode: 0,
            mix: 1,
            scale: 50,
            rotate: 0,
            position: {
                x: 0,
                y: 0
            },
            wrapMode: 1
        }
    }, {
        ref: "p03",
        name: "blurGaussian",
        enabled: false,
        params: {
            mix: 1,
            blendMode: 0,
            radius: 40,
            aspect: 0
        }
    }, {
        ref: "p04",
        name: "displaceSine",
        enabled: true,
        params: {
            sineMode: 2,
            amp: 25,
            compress: 4163336342344337e-32,
            aspect: 0,
            center: {
                x: 0,
                y: 0
            },
            freqMode: 0,
            freqLow: 3.9999999999999973,
            freqHigh: 100,
            angle: 0,
            phase: 0,
            cycle: 3,
            wrapMode: 0
        }
    }, {
        ref: "p05",
        name: "displaceTexture",
        enabled: true,
        params: {
            texture: "img1",
            weight: {
                x: .3,
                y: .3
            },
            scale: 100,
            position: {
                x: 0,
                y: 0
            },
            wrapMode: 3,
            mode: 0,
            source: "img1",
            scaleSrc: 125,
            rotateSrc: 0,
            positionSrc: {
                x: 0,
                y: 0
            },
            wrapModeSrc: 2
        }
    }, {
        ref: "p06",
        name: "fillNoise",
        enabled: true,
        params: {
            mix: .15,
            blendMode: 15,
            threshold: {
                min: 0,
                max: 1
            },
            alphaMode: 0,
            contrast: .5,
            colorNoise: false,
            size: 2,
            fps: 0,
            soft: .24999999999999997
        }
    }]
  },
  {
    toolId: "filtr-tool",
    version: 2,
    name: "Avant-Garde Mirrors",
    createdAt: "2025-12-16_17-48-36",
    main: {
        cnv: {
            ratio: "1:1",
            animation: true,
            scale: {
                value: 3
            }
        },
        rec: {
            frame: 0,
            length: {
                value: 10
            }
        }
    },
    modules: [{
        ref: "p01",
        name: "fillColor",
        enabled: true,
        params: {
            blendMode: 0,
            mix: 1,
            color: "#000000",
            alphaMode: 0
        }
    }, {
        ref: "m01",
        name: "maskMedia",
        enabled: true,
        params: {
            image: "gradient-circle",
            maskRange: {
                min: 0,
                max: 100
            },
            useChannel: 0,
            invert: false,
            contrast: {
                min: 0,
                max: 8
            },
            scale: 4,
            rotate: 0,
            position: {
                x: 0,
                y: 0
            },
            wrapMode: 1,
            aspect: 1
        },
        members: ["p02", "p03"]
    }, {
        ref: "p02",
        name: "fillMedia",
        enabled: true,
        params: {
            image: "img1",
            blendMode: 0,
            mix: 1,
            scale: 100,
            rotate: 0,
            position: {
                x: 0,
                y: 0
            },
            wrapMode: 0
        }
    }, {
        ref: "p03",
        name: "fillColor",
        enabled: true,
        params: {
            blendMode: 21,
            mix: 1,
            color: "#3cbcff",
            alphaMode: 0
        }
    }, {
        ref: "p04",
        name: "displaceSimplex",
        enabled: true,
        params: {
            noiseMode: 1,
            amp: 17,
            octaves: 2,
            aspect: 0,
            angleDomain: 0,
            angleVector: 0,
            freqMode: 0,
            freqLow: 5,
            freqHigh: 100,
            speed: 10,
            seed: 488,
            wrapMode: 2
        }
    }, {
        ref: "p05",
        name: "rgbShift",
        enabled: true,
        params: {
            mix: 1,
            abStrength: 6,
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
        }
    }, {
        ref: "p06",
        name: "displaceSine",
        enabled: true,
        params: {
            sineMode: 0,
            amp: 8,
            compress: .21,
            aspect: 0,
            center: {
                x: 0,
                y: 0
            },
            freqMode: 0,
            freqLow: 11.5,
            freqHigh: 100,
            angle: 0,
            phase: 0,
            cycle: 0,
            wrapMode: 0
        }
    }]
  },
  {
    toolId: "filtr-tool",
    version: 2,
    name: "Magic Branding",
    createdAt: "2025-12-16_17-49-4",
    main: {
        cnv: {
            ratio: "1:1",
            animation: true,
            scale: {
                value: 2.5
            }
        },
        rec: {
            frame: 164,
            length: {
                value: 10
            }
        }
    },
    modules: [{
        ref: "p01",
        name: "fillGradient",
        enabled: true,
        params: {
            mix: 1,
            gradient: [{
                time: 0,
                value: {
                    r: 15,
                    g: 11,
                    b: 38,
                    a: 1
                }
            }, {
                time: 1,
                value: {
                    r: 255,
                    g: 96,
                    b: 96,
                    a: 1
                }
            }],
            gradMode: 0,
            alphaMode: 0,
            blendMode: 0,
            gradScale: .9999999999999999,
            gradCenter: {
                x: 0,
                y: 0
            },
            gradAngle: 90,
            gradReverse: false,
            wrapMode: 1
        }
    }, {
        ref: "p02",
        name: "displaceSimplex",
        enabled: true,
        params: {
            noiseMode: 0,
            amp: 98.3,
            octaves: 1,
            aspect: 1,
            angleDomain: -95,
            angleVector: 0,
            freqMode: 0,
            freqLow: 2.3,
            freqHigh: 100,
            speed: 5,
            seed: 538,
            wrapMode: 2
        }
    }, {
        ref: "p03",
        name: "blurGaussian",
        enabled: true,
        params: {
            mix: 1,
            blendMode: 0,
            radius: 50,
            aspect: 0
        }
    }, {
        ref: "p04",
        name: "fillMedia",
        enabled: true,
        params: {
            image: "text4",
            blendMode: 11,
            mix: 1,
            scale: 100,
            rotate: 0,
            position: {
                x: 0,
                y: 0
            },
            wrapMode: 3
        }
    }, {
        ref: "p05",
        name: "blurGaussian",
        enabled: true,
        params: {
            mix: 1,
            blendMode: 0,
            radius: 10,
            aspect: 0
        }
    }, {
        ref: "p06",
        name: "colorCorrection",
        enabled: true,
        params: {
            mix: 1,
            brightness: .3,
            contrast: 1.2,
            saturation: 0
        }
    }, {
        ref: "p07",
        name: "embossEffect",
        enabled: true,
        params: {
            mix: .8,
            blendMode: 0,
            heightSource: 0,
            depthSize: 1.9999999999999991,
            heightSize: .5,
            softness: 0,
            contourMode: 0,
            lightAlt: 10,
            lightAngle: 235,
            colorMode: 0,
            highColor: "#FFFFFF",
            highMode: 7,
            highOpacity: .8,
            shadColor: "#0000FF",
            shadMode: 7,
            shadOpacity: .8
        }
    }, {
        ref: "p08",
        name: "lumaBands",
        enabled: true,
        params: {
            blendMode: 0,
            mix: 1,
            weight: 3.5,
            weightAmp: .4,
            weightFreq: 1,
            phase: 6938893903907228e-33,
            phaseFreq: 0,
            contrast: 1
        }
    }, {
        ref: "p09",
        name: "gradientMap",
        enabled: true,
        params: {
            mix: 1,
            blendMode: 11,
            mapMode: 0,
            gradient: [{
                time: .339,
                value: {
                    r: 108,
                    g: 105,
                    b: 255,
                    a: 1
                }
            }, {
                time: 1,
                value: {
                    r: 255,
                    g: 0,
                    b: 80,
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
        }
    }, {
        ref: "p10",
        name: "fillNoise",
        enabled: true,
        params: {
            mix: .12000000000000006,
            blendMode: 0,
            threshold: {
                min: 0,
                max: .8
            },
            alphaMode: 1,
            contrast: 1,
            colorNoise: true,
            size: 1,
            fps: 0,
            soft: .5
        }
    }]
  },
  {
    toolId: "filtr-tool",
    version: 2,
    name: "Deadline Flexing",
    createdAt: "2025-12-16_17-50-50",
    main: {
        cnv: {
            ratio: "4:3",
            animation: true,
            scale: {
                value: 3
            }
        },
        rec: {
            frame: 576,
            length: {
                value: 10
            }
        }
    },
    modules: [{
        ref: "p01",
        name: "fillMedia",
        enabled: true,
        params: {
            image: "img3",
            blendMode: 0,
            mix: 1,
            scale: 100,
            rotate: 0,
            position: {
                x: 0,
                y: 0
            },
            wrapMode: 0
        }
    }, {
        ref: "p02",
        name: "fillColor",
        enabled: true,
        params: {
            blendMode: 6,
            mix: 1,
            color: "#261e54",
            alphaMode: 0
        }
    }, {
        ref: "p03",
        name: "displaceSimplex",
        enabled: true,
        params: {
            noiseMode: 1,
            amp: 35.1,
            octaves: 1,
            aspect: 0,
            angleDomain: 0,
            angleVector: 0,
            freqMode: 0,
            freqLow: 3.0999999999999996,
            freqHigh: 100,
            speed: 15,
            seed: 361,
            wrapMode: 0
        }
    }, {
        ref: "m01",
        name: "maskMedia",
        enabled: true,
        params: {
            image: "text5",
            maskRange: {
                min: 0,
                max: 100
            },
            useChannel: 1,
            invert: true,
            contrast: {
                min: 0,
                max: 100
            },
            scale: 110,
            rotate: 0,
            position: {
                x: 0,
                y: 0
            },
            wrapMode: 0
        },
        members: ["p04"]
    }, {
        ref: "p04",
        name: "fillColor",
        enabled: true,
        params: {
            blendMode: 0,
            mix: 1,
            color: "#392e7f",
            alphaMode: 0
        }
    }, {
        ref: "p05",
        name: "fillNoise",
        enabled: true,
        params: {
            mix: .09999999999999999,
            blendMode: 0,
            threshold: {
                min: 0,
                max: 1
            },
            alphaMode: 0,
            contrast: 1.5,
            colorNoise: false,
            size: 1,
            fps: 0,
            soft: .25
        }
    }, {
        ref: "p06",
        name: "rgbShift",
        enabled: true,
        params: {
            mix: 1,
            abStrength: -20.000000000000004,
            abMode: 1,
            abAngle: 45,
            abFocus: {
                x: 0,
                y: 0
            },
            abChannel: {
                x: .1,
                y: .15000000000000002,
                z: .23
            },
            hueShift: 0,
            wrapMode: 2
        }
    }]
  },
  {
    toolId: "filtr-tool",
    version: 2,
    name: "Bubble Wrap",
    createdAt: "2025-12-16_17-51-10",
    main: {
        cnv: {
            ratio: "1:1",
            animation: true,
            scale: {
                value: 3.5
            }
        },
        rec: {
            frame: 337,
            length: {
                value: 10
            }
        }
    },
    modules: [{
        ref: "p01",
        name: "fillGradient",
        enabled: true,
        params: {
            mix: 1,
            gradient: [{
                time: 0,
                value: {
                    r: 255,
                    g: 193,
                    b: 193,
                    a: 1
                }
            }, {
                time: .241,
                value: {
                    r: 255,
                    g: 119,
                    b: 203,
                    a: 1
                }
            }, {
                time: .392,
                value: {
                    r: 255,
                    g: 129,
                    b: 74,
                    a: 1
                }
            }, {
                time: .641,
                value: {
                    r: 255,
                    g: 0,
                    b: 39,
                    a: 1
                }
            }, {
                time: 1,
                value: {
                    r: 66,
                    g: 0,
                    b: 255,
                    a: 1
                }
            }],
            gradMode: 1,
            alphaMode: 0,
            blendMode: 0,
            gradScale: .9,
            gradCenter: {
                x: 0,
                y: 0
            },
            gradAngle: 0,
            gradReverse: true,
            wrapMode: 2
        }
    }, {
        ref: "p02",
        name: "displaceSimplex",
        enabled: true,
        params: {
            noiseMode: 1,
            amp: 45.50000000000001,
            octaves: 1,
            aspect: 0,
            angleDomain: 0,
            angleVector: 0,
            freqMode: 0,
            freqLow: 1.9999999999999996,
            freqHigh: 100,
            speed: 14,
            seed: 714,
            wrapMode: 2
        }
    }, {
        ref: "p03",
        name: "colorCorrection",
        enabled: true,
        params: {
            mix: 1,
            brightness: 0,
            contrast: .5,
            saturation: 1
        }
    }, {
        ref: "p04",
        name: "lensGrid",
        enabled: true,
        params: {
            mix: 1,
            strength: .9999999999999999,
            blur: 0,
            gridCells: {
                x: 16,
                y: 16
            },
            gridScale: .9500000000000001,
            gridAngle: 0,
            squircle: 2,
            lensScale: 1,
            ior: 3,
            curvature: 4,
            edgeSoftness: 0,
            aberration: .04999999999999999,
            lightDir: {
                x: .7000000000000001,
                y: -1
            },
            specAmount: .30000000000000004,
            specPower: .3,
            specColor: "#f6e8ff",
            shadowAmount: .29999999999999993,
            shadowPower: .25,
            shadowColor: "#d65fe1",
            wrapMode: 0,
            gridMode: 0
        }
    }]
  },
  {
    toolId: "filtr-tool",
    version: 2,
    name: "Lo-Fi Breezing",
    createdAt: "2025-12-16_17-51-43",
    main: {
        cnv: {
            ratio: "1:1",
            animation: true,
            scale: {
                value: 3
            }
        },
        rec: {
            frame: 275,
            length: {
                value: 10
            }
        }
    },
    modules: [{
        ref: "p01",
        name: "fillMedia",
        enabled: true,
        params: {
            image: "img2",
            blendMode: 0,
            mix: 1,
            scale: 105,
            rotate: 0,
            position: {
                x: 0,
                y: 2
            },
            wrapMode: 0
        }
    }, {
        ref: "m01",
        name: "maskMedia",
        enabled: true,
        params: {
            image: "gradient-circle",
            maskRange: {
                min: 0,
                max: 100
            },
            useChannel: 0,
            invert: true,
            contrast: {
                min: 30,
                max: 100
            },
            scale: 130,
            rotate: 0,
            position: {
                x: 0,
                y: 0
            },
            wrapMode: 0
        },
        members: ["p02", "p03", "p04", "p05"]
    }, {
        ref: "p02",
        name: "displaceSine",
        enabled: true,
        params: {
            sineMode: 2,
            amp: 100,
            compress: .16,
            aspect: -.64,
            center: {
                x: 0,
                y: 0
            },
            freqMode: 0,
            freqLow: 1.6,
            freqHigh: 100,
            angle: 0,
            phase: 0,
            cycle: 2,
            wrapMode: 0
        }
    }, {
        ref: "p03",
        name: "displaceSine",
        enabled: true,
        params: {
            sineMode: 1,
            amp: 60,
            compress: .6,
            aspect: 0,
            center: {
                x: 0,
                y: 0
            },
            freqMode: 0,
            freqLow: 25,
            freqHigh: 100,
            angle: 136,
            phase: 0,
            cycle: -4,
            wrapMode: 2
        }
    }, {
        ref: "p04",
        name: "rgbShift",
        enabled: true,
        params: {
            mix: 1,
            abStrength: 40.00000000000001,
            abMode: 2,
            abAngle: 45,
            abFocus: {
                x: 0,
                y: 0
            },
            abChannel: {
                x: .2,
                y: 0,
                z: .48
            },
            hueShift: 0,
            wrapMode: 2
        }
    }, {
        ref: "p05",
        name: "blurNoise",
        enabled: true,
        params: {
            mix: 1,
            blendMode: 0,
            radius: 50,
            samples: 16,
            scale: 5
        }
    }]
  },
  {
    toolId: "filtr-tool",
    version: 2,
    name: "Printed Memories",
    createdAt: "2025-12-16_17-53-1",
    main: {
        cnv: {
            ratio: "1:1",
            animation: true,
            scale: {
                value: 3
            }
        },
        rec: {
            frame: 388,
            length: {
                value: 10
            }
        }
    },
    modules: [{
        ref: "p01",
        name: "fillColor",
        enabled: true,
        params: {
            blendMode: 0,
            mix: 1,
            color: "#FFFFFF",
            alphaMode: 0
        }
    }, {
        ref: "p02",
        name: "fillMedia",
        enabled: true,
        params: {
            image: "text0",
            blendMode: 0,
            mix: 1,
            scale: 33,
            rotate: 0,
            position: {
                x: 0,
                y: 0
            },
            wrapMode: 1
        }
    }, {
        ref: "m01",
        name: "maskMedia",
        enabled: true,
        params: {
            image: "img3",
            maskRange: {
                min: 0,
                max: 100
            },
            useChannel: 0,
            invert: true,
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
            wrapMode: 3
        },
        members: ["p03", "p04", "p05"]
    }, {
        ref: "p03",
        name: "fillColor",
        enabled: true,
        params: {
            blendMode: 2,
            mix: 1,
            color: "#000000",
            alphaMode: 0
        }
    }, {
        ref: "p04",
        name: "displaceSine",
        enabled: true,
        params: {
            sineMode: 2,
            amp: 10,
            compress: 0,
            aspect: 0,
            center: {
                x: 0,
                y: .5
            },
            freqMode: 0,
            freqLow: 1,
            freqHigh: 27,
            angle: 0,
            phase: 0,
            cycle: 2,
            wrapMode: 0
        }
    }, {
        ref: "p05",
        name: "blurNoise",
        enabled: true,
        params: {
            mix: 1,
            blendMode: 7,
            radius: 10,
            samples: 4,
            scale: 5
        }
    }]
  },
  {
    toolId: "filtr-tool",
    version: 2,
    name: "Corrosive Spectrum Wave",
    createdAt: "2025-12-16_17-53-55",
    main: {
        cnv: {
            ratio: "1:1",
            animation: false,
            scale: {
                value: 3
            }
        },
        rec: {
            frame: 36,
            length: {
                value: 10
            }
        }
    },
    modules: [{
        ref: "p01",
        name: "fillColor",
        enabled: true,
        params: {
            blendMode: 0,
            mix: 1,
            color: "#FFFFFF",
            alphaMode: 0
        }
    }, {
        ref: "p02",
        name: "fillMedia",
        enabled: true,
        params: {
            image: "text1",
            blendMode: 0,
            mix: 1,
            scale: 100,
            rotate: 0,
            position: {
                x: 0,
                y: 0
            },
            wrapMode: 0
        }
    }, {
        ref: "m01",
        name: "maskMedia",
        enabled: true,
        params: {
            image: "gradient-reflect",
            maskRange: {
                min: 2,
                max: 100
            },
            useChannel: 0,
            invert: false,
            contrast: {
                min: 0,
                max: 100
            },
            scale: 90,
            rotate: 0,
            position: {
                x: 0,
                y: 0
            },
            wrapMode: 0
        },
        members: ["p03", "p04"]
    }, {
        ref: "p03",
        name: "blurGaussian",
        enabled: true,
        params: {
            mix: 1,
            blendMode: 0,
            radius: 40,
            aspect: -1
        }
    }, {
        ref: "p04",
        name: "displaceSimplex",
        enabled: false,
        params: {
            noiseMode: 1,
            amp: 18.500000000000004,
            octaves: 1,
            aspect: .54,
            angleDomain: 0,
            angleVector: 0,
            freqMode: 0,
            freqLow: 10,
            freqHigh: 1e3,
            speed: 0,
            seed: 0,
            wrapMode: 0
        }
    }, {
        ref: "p05",
        name: "fillGradient",
        enabled: true,
        params: {
            mix: 1,
            gradient: [{
                time: 0,
                value: {
                    r: 21,
                    g: 3,
                    b: 255,
                    a: 1
                }
            }, {
                time: .405,
                value: {
                    r: 255,
                    g: 78,
                    b: 0,
                    a: 1
                }
            }, {
                time: .503,
                value: {
                    r: 255,
                    g: 178,
                    b: 3,
                    a: 1
                }
            }, {
                time: .5750000000000001,
                value: {
                    r: 255,
                    g: 0,
                    b: 226,
                    a: 1
                }
            }, {
                time: 1,
                value: {
                    r: 21,
                    g: 3,
                    b: 255,
                    a: 1
                }
            }],
            gradMode: 1,
            alphaMode: 1,
            blendMode: 11,
            gradScale: .12999999999999998,
            gradCenter: {
                x: 0,
                y: 0
            },
            gradAngle: 45,
            gradReverse: false,
            wrapMode: 2
        }
    }, {
        ref: "p06",
        name: "lumaBands",
        enabled: true,
        params: {
            blendMode: 0,
            mix: 1,
            weight: .5,
            weightAmp: 0,
            weightFreq: 1,
            phase: 0,
            phaseFreq: 0,
            contrast: 1.5
        }
    }, {
        ref: "p07",
        name: "fillColor",
        enabled: true,
        params: {
            blendMode: 1,
            mix: 1,
            color: "#fecede",
            alphaMode: 0
        }
    }, {
        ref: "p08",
        name: "fillNoise",
        enabled: true,
        params: {
            mix: .2,
            blendMode: 14,
            threshold: {
                min: 0,
                max: .9
            },
            alphaMode: 0,
            contrast: 1.5,
            colorNoise: false,
            size: 1,
            fps: 0
        }
    }]
  },
  {
    toolId: "filtr-tool",
    version: 2,
    name: "Mosaic Reflection",
    createdAt: "2025-12-16_17-54-24",
    main: {
        cnv: {
            ratio: "3:4",
            animation: true,
            scale: {
                value: 3
            }
        },
        rec: {
            frame: 104,
            length: {
                value: 10
            }
        }
    },
    modules: [{
        ref: "p01",
        name: "fillMedia",
        enabled: true,
        params: {
            image: "img1",
            blendMode: 0,
            mix: 1,
            scale: 100,
            rotate: 0,
            position: {
                x: 0,
                y: 0
            },
            wrapMode: 3
        }
    }, {
        ref: "m01",
        name: "maskMedia",
        enabled: true,
        params: {
            image: "gradient-linear",
            maskRange: {
                min: 0,
                max: 80
            },
            useChannel: 0,
            invert: false,
            contrast: {
                min: 20,
                max: 100
            },
            scale: 70,
            rotate: 90,
            position: {
                x: -13,
                y: 0
            },
            wrapMode: 0
        },
        members: ["p02", "p03", "p04", "p05"]
    }, {
        ref: "p02",
        name: "fillColor",
        enabled: true,
        params: {
            blendMode: 11,
            mix: 1,
            color: "#ff0070",
            alphaMode: 0
        }
    }, {
        ref: "p03",
        name: "displaceSine",
        enabled: true,
        params: {
            sineMode: 1,
            amp: 54,
            compress: 0,
            aspect: 0,
            center: {
                x: 0,
                y: 0
            },
            freqMode: 0,
            freqLow: 12.6,
            freqHigh: 100,
            angle: 0,
            phase: 0,
            cycle: -1,
            wrapMode: 0
        }
    }, {
        ref: "p04",
        name: "displaceSine",
        enabled: true,
        params: {
            sineMode: 0,
            amp: 10,
            compress: 0,
            aspect: 0,
            center: {
                x: 0,
                y: 0
            },
            freqMode: 1,
            freqLow: 10,
            freqHigh: 25,
            angle: 0,
            phase: 0,
            cycle: -2,
            wrapMode: 0
        }
    }, {
        ref: "p05",
        name: "displaceSine",
        enabled: true,
        params: {
            sineMode: 0,
            amp: 10,
            compress: 0,
            aspect: 0,
            center: {
                x: 0,
                y: 0
            },
            freqMode: 1,
            freqLow: 10,
            freqHigh: 25,
            angle: 0,
            phase: 0,
            cycle: -2,
            wrapMode: 0
        }
    }]
  },
  {
    toolId: "filtr-tool",
    version: 2,
    name: "Metaphysics Pool",
    createdAt: "2025-12-16_17-54-54",
    main: {
        cnv: {
            ratio: "1:1",
            animation: true,
            scale: {
                value: 3
            }
        },
        rec: {
            frame: 76,
            length: {
                value: 10
            }
        }
    },
    modules: [{
        ref: "p01",
        name: "fillColor",
        enabled: true,
        params: {
            blendMode: 0,
            mix: 1,
            color: "#FFFFFF",
            alphaMode: 0
        }
    }, {
        ref: "p02",
        name: "fillMedia",
        enabled: true,
        params: {
            image: "text1",
            blendMode: 0,
            mix: 1,
            scale: 100,
            rotate: 0,
            position: {
                x: 0,
                y: 0
            },
            wrapMode: 0
        }
    }, {
        ref: "m01",
        name: "maskMedia",
        enabled: true,
        params: {
            image: "gradient-circle",
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
            scale: 10,
            rotate: 0,
            position: {
                x: 0,
                y: 0
            },
            wrapMode: 2
        },
        members: ["p03", "p04", "p05", "p06"]
    }, {
        ref: "p03",
        name: "displaceSine",
        enabled: true,
        params: {
            sineMode: 2,
            amp: 20,
            compress: 0,
            aspect: 0,
            center: {
                x: 0,
                y: 0
            },
            freqMode: 0,
            freqLow: 8,
            freqHigh: 100,
            angle: 0,
            phase: 0,
            cycle: -2,
            wrapMode: 0,
            freq: 17.05
        }
    }, {
        ref: "p04",
        name: "rgbShift",
        enabled: true,
        params: {
            mix: 1,
            abStrength: 4.999999999999999,
            abMode: 0,
            abAngle: 45,
            abFocus: {
                x: 0,
                y: 0
            },
            abChannel: {
                x: .22,
                y: .08,
                z: 0
            },
            hueShift: 0,
            wrapMode: 2
        }
    }, {
        ref: "p05",
        name: "displaceSine",
        enabled: true,
        params: {
            sineMode: 2,
            amp: 20,
            compress: 0,
            aspect: 0,
            center: {
                x: 0,
                y: 0
            },
            freqMode: 0,
            freqLow: 8,
            freqHigh: 100,
            angle: 0,
            phase: 0,
            cycle: -2,
            wrapMode: 0,
            freq: 17.05
        }
    }, {
        ref: "p06",
        name: "blurNoise",
        enabled: true,
        params: {
            mix: 1,
            blendMode: 0,
            radius: 5,
            samples: 1,
            scale: 5
        }
    }]
  },
  {
    toolId: "filtr-tool",
    version: 2,
    name: "Temporal Portrait",
    createdAt: "2025-12-16_17-55-35",
    main: {
        cnv: {
            ratio: "1:1",
            animation: true,
            scale: {
                value: 3
            }
        },
        rec: {
            frame: 195,
            length: {
                value: 10
            }
        }
    },
    modules: [{
        ref: "p01",
        name: "fillColor",
        enabled: true,
        params: {
            blendMode: 0,
            mix: 1,
            color: "#FFFFFF",
            alphaMode: 0
        }
    }, {
        ref: "p02",
        name: "fillMedia",
        enabled: true,
        params: {
            image: "img0",
            blendMode: 0,
            mix: 1,
            scale: 100,
            rotate: 0,
            position: {
                x: 0,
                y: 0
            },
            wrapMode: 3
        }
    }, {
        ref: "m01",
        name: "maskMedia",
        enabled: true,
        params: {
            image: "gradient-circle",
            maskRange: {
                min: 53.2,
                max: 100
            },
            useChannel: 0,
            invert: true,
            contrast: {
                min: 50,
                max: 80
            },
            scale: 58,
            rotate: 0,
            position: {
                x: 5,
                y: -5
            },
            wrapMode: 0
        },
        members: ["p03"]
    }, {
        ref: "p03",
        name: "gradientMap",
        enabled: true,
        params: {
            mix: 1,
            blendMode: 0,
            mapMode: 0,
            gradient: [{
                time: .156,
                value: {
                    r: 0,
                    g: 0,
                    b: 0,
                    a: 1
                }
            }, {
                time: .228,
                value: {
                    r: 0,
                    g: 63,
                    b: 255,
                    a: 1
                }
            }, {
                time: .496,
                value: {
                    r: 255,
                    g: 32,
                    b: 32,
                    a: 1
                }
            }, {
                time: .542,
                value: {
                    r: 243,
                    g: 0,
                    b: 255,
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
        }
    }, {
        ref: "m02",
        name: "maskMedia",
        enabled: true,
        params: {
            image: "gradient-circle",
            maskRange: {
                min: 0,
                max: 100
            },
            useChannel: 0,
            invert: true,
            contrast: {
                min: 50,
                max: 80
            },
            scale: 58,
            rotate: 0,
            position: {
                x: 5,
                y: -5
            },
            wrapMode: 0
        },
        members: ["p04"]
    }, {
        ref: "p04",
        name: "displaceSimplex",
        enabled: true,
        params: {
            noiseMode: 1,
            amp: 25,
            octaves: 5,
            aspect: -1,
            angleDomain: 0,
            angleVector: 0,
            freqMode: 0,
            freqLow: 2.9,
            freqHigh: 100,
            speed: 30,
            seed: 663,
            wrapMode: 2
        }
    }]
  },
  {
    toolId: "filtr-tool",
    version: 2,
    name: "Soft Errors",
    createdAt: "2025-12-16_17-58-49",
    main: {
        cnv: {
            ratio: "4:3",
            animation: true,
            scale: {
                value: 3
            }
        },
        rec: {
            frame: 122,
            length: {
                value: 5
            }
        }
    },
    modules: [{
        ref: "p01",
        name: "fillColor",
        enabled: true,
        params: {
            blendMode: 0,
            mix: 1,
            color: "#ffffff",
            alphaMode: 0
        }
    }, {
        ref: "p02",
        name: "fillMedia",
        enabled: true,
        params: {
            image: "text2",
            blendMode: 0,
            mix: 1,
            scale: 110,
            rotate: 0,
            position: {
                x: 0,
                y: 0
            },
            wrapMode: 0
        }
    }, {
        ref: "p03",
        name: "fillGradient",
        enabled: true,
        params: {
            mix: 1,
            gradient: [{
                time: 0,
                value: {
                    r: 0,
                    g: 247,
                    b: 255,
                    a: 1
                }
            }, {
                time: 1,
                value: {
                    r: 255,
                    g: 0,
                    b: 0,
                    a: 1
                }
            }],
            gradMode: 1,
            alphaMode: 1,
            blendMode: 9,
            gradScale: .09999999999999998,
            gradCenter: {
                x: 0,
                y: 0
            },
            gradAngle: 0,
            gradReverse: false,
            wrapMode: 2
        }
    }, {
        ref: "p04",
        name: "displaceSine",
        enabled: true,
        params: {
            sineMode: 0,
            amp: 3,
            compress: .3,
            aspect: -1,
            center: {
                x: 0,
                y: 0
            },
            freqMode: 0,
            freqLow: 10,
            freqHigh: 25,
            angle: 0,
            phase: 0,
            cycle: 2,
            wrapMode: 0,
            freq: 1.17,
            textureWrap: "CLAMP"
        }
    }, {
        ref: "p05",
        name: "fillMedia",
        enabled: true,
        params: {
            image: "text2",
            blendMode: 2,
            mix: 1,
            scale: 110,
            rotate: 0,
            position: {
                x: 0,
                y: 0
            },
            wrapMode: 0
        }
    }, {
        ref: "p06",
        name: "displaceSine",
        enabled: true,
        params: {
            sineMode: 0,
            amp: 3,
            compress: .3,
            aspect: -1,
            center: {
                x: 0,
                y: 0
            },
            freqMode: 0,
            freqLow: 25,
            freqHigh: 27,
            angle: 0,
            phase: 0,
            cycle: 6,
            wrapMode: 0,
            freq: 1.17,
            textureWrap: "CLAMP"
        }
    }, {
        ref: "m01",
        name: "maskMedia",
        enabled: true,
        params: {
            image: "noise0",
            maskRange: {
                min: 5,
                max: 25
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
            wrapMode: 1
        },
        members: ["p07", "p08", "p09"]
    }, {
        ref: "p07",
        name: "warpGrid",
        enabled: true,
        params: {
            mix: 1,
            strength: .3,
            cellFeather: .24999999999999997,
            gridMode: 1,
            gridCell: 60,
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
        }
    }, {
        ref: "p08",
        name: "rgbShift",
        enabled: true,
        params: {
            mix: 1,
            abStrength: 12,
            abMode: 0,
            abAngle: 10,
            abFocus: {
                x: 0,
                y: 0
            },
            abChannel: {
                x: 3469446951953614e-33,
                y: .2,
                z: .5
            },
            hueShift: 1,
            wrapMode: 2
        }
    }, {
        ref: "p09",
        name: "displaceSimplex",
        enabled: true,
        params: {
            noiseMode: 1,
            amp: 8,
            octaves: 2,
            aspect: -.8,
            angleDomain: 0,
            angleVector: 0,
            freqMode: 1,
            freqLow: 10,
            freqHigh: 1e3,
            speed: 0,
            seed: 415,
            wrapMode: 0
        }
    }]
  },
  {
    toolId: "filtr-tool",
    version: 2,
    name: "Toxic Atmosphere",
    createdAt: "2025-12-16_18-0-2",
    main: {
        cnv: {
            ratio: "1:1",
            animation: true,
            scale: {
                value: 3
            }
        },
        rec: {
            frame: 467,
            length: {
                value: 10
            }
        }
    },
    modules: [{
        ref: "p01",
        name: "fillColor",
        enabled: true,
        params: {
            blendMode: 0,
            mix: 1,
            color: "#FFFFFF",
            alphaMode: 0
        }
    }, {
        ref: "p02",
        name: "fillMedia",
        enabled: true,
        params: {
            image: "text3",
            blendMode: 0,
            mix: 1,
            scale: 100,
            rotate: 0,
            position: {
                x: 0,
                y: 0
            },
            wrapMode: 0
        }
    }, {
        ref: "m01",
        name: "maskMedia",
        enabled: true,
        params: {
            image: "noise0",
            maskRange: {
                min: 5,
                max: 100
            },
            useChannel: 0,
            invert: false,
            contrast: {
                min: 16,
                max: 100
            },
            scale: 100,
            rotate: 0,
            position: {
                x: 0,
                y: 0
            },
            wrapMode: 3
        },
        members: ["p03", "p04", "p05", "p06", "p07"]
    }, {
        ref: "p03",
        name: "displaceSimplex",
        enabled: true,
        params: {
            noiseMode: 0,
            amp: 8,
            octaves: 1,
            aspect: 0,
            angleDomain: 0,
            angleVector: 0,
            freqMode: 0,
            freqLow: 10,
            freqHigh: 100,
            speed: 12,
            seed: 922,
            wrapMode: 0
        }
    }, {
        ref: "p04",
        name: "blurNoise",
        enabled: true,
        params: {
            mix: 1,
            blendMode: 0,
            radius: 20,
            samples: 24,
            scale: 5
        }
    }, {
        ref: "p05",
        name: "fillColor",
        enabled: true,
        params: {
            blendMode: 6,
            mix: 1,
            color: "#ffffff",
            alphaMode: 1
        }
    }, {
        ref: "p06",
        name: "fillGradient",
        enabled: true,
        params: {
            mix: 1,
            gradient: [{
                time: .379,
                value: {
                    r: 255,
                    g: 148,
                    b: 41,
                    a: 1
                }
            }, {
                time: .811,
                value: {
                    r: 255,
                    g: 148,
                    b: 41,
                    a: 0
                }
            }],
            gradMode: 1,
            alphaMode: 1,
            blendMode: 4,
            gradScale: 1,
            gradCenter: {
                x: 0,
                y: 0
            },
            gradAngle: 0,
            gradReverse: false,
            wrapMode: 0
        }
    }, {
        ref: "p07",
        name: "rgbShift",
        enabled: true,
        params: {
            mix: 1,
            abStrength: 25,
            abMode: 2,
            abAngle: 0,
            abFocus: {
                x: 0,
                y: 0
            },
            abChannel: {
                x: .3,
                y: .18000000000000002,
                z: 0
            },
            hueShift: 0,
            wrapMode: 2
        }
    }]
  },
  {
    toolId: "filtr-tool",
    version: 2,
    name: "Radiant Plastique",
    createdAt: "2025-12-16_18-1-6",
    main: {
        cnv: {
            ratio: "1:1",
            animation: true,
            scale: {
                value: 2.5
            }
        },
        rec: {
            frame: 194,
            length: {
                value: 5
            }
        }
    },
    modules: [{
        ref: "p01",
        name: "fillColor",
        enabled: true,
        params: {
            blendMode: 0,
            mix: 1,
            color: "#FFFFFF",
            alphaMode: 0
        }
    }, {
        ref: "p02",
        name: "fillMedia",
        enabled: true,
        params: {
            image: "text2",
            blendMode: 0,
            mix: 1,
            scale: 102,
            rotate: 0,
            position: {
                x: 0,
                y: 0
            },
            wrapMode: 0
        }
    }, {
        ref: "p03",
        name: "blurGaussian",
        enabled: true,
        params: {
            mix: 1,
            blendMode: 0,
            radius: 30,
            aspect: 0
        }
    }, {
        ref: "p04",
        name: "fillColor",
        enabled: true,
        params: {
            blendMode: 3,
            mix: 1,
            color: "#c4bdff",
            alphaMode: 0
        }
    }, {
        ref: "p05",
        name: "lumaBands",
        enabled: true,
        params: {
            blendMode: 0,
            mix: .89,
            weight: 3,
            weightAmp: .07999999999999999,
            weightFreq: 1,
            phase: .3500000000000001,
            phaseFreq: 0,
            contrast: .75
        }
    }, {
        ref: "p06",
        name: "colorCorrection",
        enabled: true,
        params: {
            mix: 1,
            brightness: -.15000000000000002,
            contrast: .36,
            saturation: .9999999999999998
        }
    }, {
        ref: "p07",
        name: "fillGradient",
        enabled: true,
        params: {
            mix: .75,
            gradient: [{
                time: 0,
                value: {
                    r: 230,
                    g: 204,
                    b: 246,
                    a: 1
                }
            }, {
                time: .988,
                value: {
                    r: 255,
                    g: 77,
                    b: 0,
                    a: 1
                }
            }],
            gradMode: 1,
            alphaMode: 0,
            blendMode: 14,
            gradScale: 1.21,
            gradCenter: {
                x: 0,
                y: 0
            },
            gradAngle: 90,
            gradReverse: false,
            wrapMode: 2
        }
    }, {
        ref: "p08",
        name: "fillNoise",
        enabled: true,
        params: {
            mix: .3,
            blendMode: 12,
            threshold: {
                min: 0,
                max: 1
            },
            alphaMode: 1,
            contrast: 1,
            colorNoise: false,
            size: 1,
            fps: 0
        }
    }]
  },
  {
    toolId: "filtr-tool",
    version: 2,
    name: "Plasma Drift",
    createdAt: "2025-12-16_18-1-28",
    main: {
        cnv: {
            ratio: "1:1",
            animation: true,
            scale: {
                value: 3
            }
        },
        rec: {
            frame: 387,
            length: {
                value: 10
            }
        }
    },
    modules: [{
        ref: "p01",
        name: "fillGradient",
        enabled: true,
        params: {
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
                time: .156,
                value: {
                    r: 255,
                    g: 220,
                    b: 154,
                    a: 1
                }
            }, {
                time: .536,
                value: {
                    r: 147,
                    g: 82,
                    b: 255,
                    a: 1
                }
            }, {
                time: .863,
                value: {
                    r: 39,
                    g: 4,
                    b: 89,
                    a: 1
                }
            }],
            gradMode: 0,
            alphaMode: 0,
            blendMode: 0,
            gradScale: .06999999999999998,
            gradCenter: {
                x: 0,
                y: 0
            },
            gradAngle: -10,
            gradReverse: false,
            wrapMode: 2
        }
    }, {
        ref: "p02",
        name: "displaceSine",
        enabled: true,
        params: {
            sineMode: 1,
            amp: 100,
            compress: 4163336342344337e-32,
            aspect: 0,
            center: {
                x: 0,
                y: 0
            },
            freqMode: 0,
            freqLow: 3.9999999999999973,
            freqHigh: 100,
            angle: 0,
            phase: 0,
            cycle: .9999999999999999,
            wrapMode: 0
        }
    }, {
        ref: "p03",
        name: "displaceCubic",
        enabled: true,
        params: {
            amp: {
                x: .49999999999999994,
                y: .49999999999999994
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
        }
    }, {
        ref: "p04",
        name: "fillNoise",
        enabled: true,
        params: {
            mix: .4,
            blendMode: 11,
            threshold: {
                min: 0,
                max: 1
            },
            alphaMode: 1,
            contrast: .5,
            colorNoise: false,
            size: 1,
            fps: 0
        }
    }]
  },
  {
    toolId: "filtr-tool",
    version: 2,
    name: "Chill Workflow",
    createdAt: "2025-12-16_18-2-3",
    main: {
        cnv: {
            ratio: "4:3",
            animation: true,
            scale: {
                value: 3
            }
        },
        rec: {
            frame: 163,
            length: {
                value: 10
            }
        }
    },
    modules: [{
        ref: "p01",
        name: "fillGradient",
        enabled: true,
        params: {
            mix: 1,
            gradient: [{
                time: 0,
                value: {
                    r: 163,
                    g: 179,
                    b: 238,
                    a: 1
                }
            }, {
                time: .332,
                value: {
                    r: 255,
                    g: 176,
                    b: 69,
                    a: 1
                }
            }, {
                time: .64,
                value: {
                    r: 181,
                    g: 25,
                    b: 221,
                    a: 1
                }
            }, {
                time: 1,
                value: {
                    r: 107,
                    g: 0,
                    b: 204,
                    a: 1
                }
            }],
            gradMode: 0,
            alphaMode: 0,
            blendMode: 19,
            gradScale: 1,
            gradCenter: {
                x: 0,
                y: -.05
            },
            gradAngle: -90,
            gradReverse: false,
            wrapMode: 0
        }
    }, {
        ref: "p02",
        name: "fillMedia",
        enabled: true,
        params: {
            image: "text5",
            blendMode: 21,
            mix: .8,
            scale: 100,
            rotate: 0,
            position: {
                x: 0,
                y: 0
            },
            wrapMode: 0
        }
    }, {
        ref: "m01",
        name: "maskMedia",
        enabled: true,
        params: {
            image: "gradient-linear",
            maskRange: {
                min: 0,
                max: 100
            },
            useChannel: 0,
            invert: true,
            contrast: {
                min: 0,
                max: 100
            },
            scale: 65,
            rotate: 180,
            position: {
                x: 0,
                y: 10
            },
            wrapMode: 0
        },
        members: ["p03", "p04", "p05"]
    }, {
        ref: "p03",
        name: "blurGaussian",
        enabled: true,
        params: {
            mix: 1,
            blendMode: 0,
            radius: 50,
            aspect: 0
        }
    }, {
        ref: "p04",
        name: "displaceSimplex",
        enabled: true,
        params: {
            noiseMode: 1,
            amp: 35,
            octaves: 1,
            aspect: 0,
            angleDomain: 0,
            angleVector: 0,
            freqMode: 0,
            freqLow: 3,
            freqHigh: 100,
            speed: 12,
            seed: 361,
            wrapMode: 0
        }
    }, {
        ref: "p05",
        name: "displaceSimplex",
        enabled: true,
        params: {
            noiseMode: 1,
            amp: 5,
            octaves: 1,
            aspect: -1,
            angleDomain: 0,
            angleVector: 0,
            freqMode: 0,
            freqLow: 12,
            freqHigh: 100,
            speed: 20,
            seed: 807,
            wrapMode: 0
        }
    }, {
        ref: "p06",
        name: "fillNoise",
        enabled: true,
        params: {
            mix: .15,
            blendMode: 11,
            threshold: {
                min: 0,
                max: 1
            },
            alphaMode: 0,
            contrast: 1,
            colorNoise: true,
            size: 1.5,
            fps: 0
        }
    }]
  },
  {
    toolId: "filtr-tool",
    version: 2,
    name: "Rad Workflow",
    createdAt: "2025-12-16_18-2-21",
    main: {
        cnv: {
            ratio: "1:1",
            animation: true,
            scale: {
                value: 3
            }
        },
        rec: {
            frame: 188,
            length: {
                value: 5
            }
        }
    },
    modules: [{
        ref: "p01",
        name: "fillGradient",
        enabled: true,
        params: {
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
            gradScale: .09999999999999998,
            gradCenter: {
                x: 0,
                y: 0
            },
            gradAngle: 0,
            gradReverse: false,
            wrapMode: 2
        }
    }, {
        ref: "p02",
        name: "displaceSimplex",
        enabled: true,
        params: {
            noiseMode: 1,
            amp: 80,
            octaves: 1,
            aspect: 0,
            angleDomain: 0,
            angleVector: 0,
            freqMode: 0,
            freqLow: 1.9999999999999996,
            freqHigh: 25,
            speed: 14,
            seed: 308,
            wrapMode: 2
        }
    }, {
        ref: "p03",
        name: "embossEffect",
        enabled: true,
        params: {
            mix: 1,
            blendMode: 0,
            heightSource: 0,
            depthSize: 22.7,
            heightSize: .62,
            softness: 0,
            contourMode: 0,
            lightAlt: 54.00000000000001,
            lightAngle: 235,
            colorMode: 0,
            highColor: "#FFFFFF",
            highMode: 7,
            highOpacity: .8,
            shadColor: "#0000FF",
            shadMode: 7,
            shadOpacity: .8
        }
    }, {
        ref: "p04",
        name: "fillMedia",
        enabled: true,
        params: {
            image: "text5",
            blendMode: 1,
            mix: 1,
            scale: 114.2,
            rotate: 0,
            position: {
                x: 0,
                y: 0
            },
            wrapMode: 0
        }
    }, {
        ref: "p05",
        name: "blurGaussian",
        enabled: true,
        params: {
            mix: 1,
            blendMode: 0,
            radius: 23,
            aspect: 0
        }
    }, {
        ref: "p06",
        name: "lumaBands",
        enabled: true,
        params: {
            blendMode: 0,
            mix: 1,
            weight: 3,
            weightAmp: .6,
            weightFreq: 2,
            phase: 0,
            phaseFreq: 1.9999999999999998,
            contrast: 1
        }
    }, {
        ref: "p07",
        name: "fillColor",
        enabled: true,
        params: {
            blendMode: 4,
            mix: 1,
            color: "#ff29ad",
            alphaMode: 0
        }
    }, {
        ref: "p08",
        name: "colorCorrection",
        enabled: true,
        params: {
            mix: 1,
            brightness: 1734723475976807e-32,
            contrast: 1,
            saturation: 1.5
        }
    }]
  },
  {
    toolId: "filtr-tool",
    version: 2,
    name: "Braindance Loop",
    createdAt: "2025-12-16_18-3-13",
    main: {
        cnv: {
            ratio: "1:1",
            animation: true,
            scale: {
                value: 3
            }
        },
        rec: {
            frame: 508,
            length: {
                value: 10
            }
        }
    },
    modules: [{
        ref: "p01",
        name: "displaceTexture",
        enabled: true,
        params: {
            texture: "noise0",
            weight: {
                x: 3,
                y: 3
            },
            scale: 100,
            position: {
                x: 0,
                y: 0
            },
            wrapMode: 3,
            mode: 1,
            source: "gradient-circle",
            scaleSrc: 100,
            rotateSrc: 0,
            positionSrc: {
                x: 0,
                y: 0
            },
            wrapModeSrc: 2
        }
    }, {
        ref: "p02",
        name: "fillGradient",
        enabled: true,
        params: {
            mix: 1,
            gradient: [{
                time: .091,
                value: {
                    r: 0,
                    g: 112,
                    b: 255,
                    a: 1
                }
            }, {
                time: .189,
                value: {
                    r: 0,
                    g: 0,
                    b: 0,
                    a: 1
                }
            }, {
                time: .628,
                value: {
                    r: 0,
                    g: 0,
                    b: 0,
                    a: 1
                }
            }, {
                time: .65,
                value: {
                    r: 0,
                    g: 112,
                    b: 255,
                    a: 1
                }
            }, {
                time: .791,
                value: {
                    r: 255,
                    g: 0,
                    b: 0,
                    a: 1
                }
            }, {
                time: .798,
                value: {
                    r: 0,
                    g: 0,
                    b: 0,
                    a: 1
                }
            }],
            gradMode: 3,
            alphaMode: 1,
            blendMode: 7,
            gradScale: 1.06,
            gradCenter: {
                x: 0,
                y: 0
            },
            gradAngle: 0,
            gradReverse: false,
            wrapMode: 2
        }
    }, {
        ref: "p03",
        name: "rgbShift",
        enabled: true,
        params: {
            mix: 1,
            abStrength: 10,
            abMode: 1,
            abAngle: 45,
            abFocus: {
                x: 0,
                y: 0
            },
            abChannel: {
                x: .19,
                y: .08,
                z: .02
            },
            hueShift: 0,
            wrapMode: 2
        }
    }, {
        ref: "m01",
        name: "maskMedia",
        enabled: true,
        params: {
            image: "gradient-circle",
            maskRange: {
                min: 40,
                max: 100
            },
            useChannel: 0,
            invert: false,
            contrast: {
                min: 0,
                max: 100
            },
            scale: 125,
            rotate: 0,
            position: {
                x: 0,
                y: 0
            },
            wrapMode: 0
        },
        members: ["p04", "p05", "p06"]
    }, {
        ref: "p04",
        name: "blurGaussian",
        enabled: true,
        params: {
            mix: 1,
            blendMode: 0,
            radius: 20,
            aspect: 0
        }
    }, {
        ref: "p05",
        name: "displaceSine",
        enabled: true,
        params: {
            sineMode: 2,
            amp: 100,
            compress: .66,
            aspect: -20816681711721685e-33,
            center: {
                x: 0,
                y: 0
            },
            freqMode: 0,
            freqLow: 9,
            freqHigh: 100,
            angle: 0,
            phase: 0,
            cycle: .9999999999999999,
            wrapMode: 0
        }
    }, {
        ref: "p06",
        name: "displaceSine",
        enabled: true,
        params: {
            sineMode: 1,
            amp: 9.999999999999995,
            compress: 0,
            aspect: -20816681711721685e-33,
            center: {
                x: 0,
                y: 0
            },
            freqMode: 0,
            freqLow: 1.9999999999999996,
            freqHigh: 100,
            angle: 0,
            phase: 0,
            cycle: 2,
            wrapMode: 0
        }
    }, {
        ref: "p07",
        name: "fillNoise",
        enabled: true,
        params: {
            mix: .3,
            blendMode: 8,
            threshold: {
                min: 0,
                max: 1
            },
            alphaMode: 1,
            contrast: .5,
            colorNoise: false,
            size: 1,
            fps: 0
        }
    }]
  },
  {
    toolId: "filtr-tool",
    version: 2,
    name: "Noir Carbon Imprint",
    createdAt: "2025-12-16_18-3-36",
    main: {
        cnv: {
            ratio: "1:1",
            animation: false,
            scale: {
                value: 3
            }
        },
        rec: {
            frame: 7,
            length: {
                value: 10
            }
        }
    },
    modules: [{
        ref: "p01",
        name: "fillMedia",
        enabled: true,
        params: {
            image: "noise0",
            blendMode: 0,
            mix: 1,
            scale: 100,
            rotate: 0,
            position: {
                x: 0,
                y: 0
            },
            wrapMode: 1
        }
    }, {
        ref: "p02",
        name: "displaceSimplex",
        enabled: true,
        params: {
            noiseMode: 1,
            amp: 10,
            octaves: 1,
            aspect: -.8,
            angleDomain: 0,
            angleVector: 0,
            freqMode: 1,
            freqLow: 25,
            freqHigh: 600,
            speed: 0,
            seed: 0,
            wrapMode: 0,
            angle: 0
        }
    }, {
        ref: "p03",
        name: "fillMedia",
        enabled: true,
        params: {
            image: "text4",
            blendMode: 0,
            mix: 1,
            scale: 100,
            rotate: 0,
            position: {
                x: 0,
                y: 0
            },
            wrapMode: 0
        }
    }, {
        ref: "p04",
        name: "blurGaussian",
        enabled: true,
        params: {
            mix: 1,
            blendMode: 0,
            radius: 12,
            aspect: .75
        }
    }, {
        ref: "p05",
        name: "lumaBands",
        enabled: true,
        params: {
            blendMode: 0,
            mix: 1,
            weight: 1.53,
            weightAmp: 0,
            weightFreq: 1,
            phase: 0,
            phaseFreq: 0,
            contrast: .98
        }
    }, {
        ref: "p06",
        name: "colorCorrection",
        enabled: true,
        params: {
            mix: 1,
            brightness: .05,
            contrast: .49999999999999994,
            saturation: .5
        }
    }, {
        ref: "p07",
        name: "gradientMap",
        enabled: true,
        params: {
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
                time: .673,
                value: {
                    r: 71,
                    g: 90,
                    b: 102,
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
            mapGamma: 1.5,
            mapRange: {
                min: 0,
                max: 1
            },
            alphaMode: 0
        }
    }, {
        ref: "p08",
        name: "fillNoise",
        enabled: true,
        params: {
            mix: .2,
            blendMode: 0,
            threshold: {
                min: 0,
                max: .8
            },
            alphaMode: 1,
            contrast: 1,
            colorNoise: true,
            size: 1,
            fps: 0
        }
    }]
  },
  {
    toolId: "filtr-tool",
    version: 2,
    name: "Clay Rainbow Aesthetics",
    createdAt: "2025-12-16_18-4-1",
    main: {
        cnv: {
            ratio: "1:1",
            animation: false,
            scale: {
                value: 2.8
            }
        },
        rec: {
            frame: 2,
            length: {
                value: 5
            }
        }
    },
    modules: [{
        ref: "p01",
        name: "fillColor",
        enabled: true,
        params: {
            blendMode: 0,
            mix: 1,
            color: "#FFFFFF",
            alphaMode: 0
        }
    }, {
        ref: "p02",
        name: "fillMedia",
        enabled: true,
        params: {
            image: "text2",
            blendMode: 0,
            mix: 1,
            scale: 115,
            rotate: 0,
            position: {
                x: 0,
                y: 0
            },
            wrapMode: 0
        }
    }, {
        ref: "p03",
        name: "blurGaussian",
        enabled: true,
        params: {
            mix: 1,
            blendMode: 0,
            radius: 22,
            aspect: 0
        }
    }, {
        ref: "p04",
        name: "colorCorrection",
        enabled: true,
        params: {
            mix: 1,
            brightness: -.4,
            contrast: .25,
            saturation: 1
        }
    }, {
        ref: "p05",
        name: "embossEffect",
        enabled: true,
        params: {
            mix: 1,
            blendMode: 0,
            heightSource: 0,
            depthSize: 1.9999999999999947,
            heightSize: .4099999999999991,
            softness: 0,
            contourMode: 3,
            lightAlt: 16.7,
            lightAngle: 140,
            colorMode: 0,
            highColor: "#FFFFFF",
            highMode: 7,
            highOpacity: .8,
            shadColor: "#0000FF",
            shadMode: 7,
            shadOpacity: .8
        }
    }, {
        ref: "p06",
        name: "colorCorrection",
        enabled: true,
        params: {
            mix: 1,
            brightness: 0,
            contrast: 2.1999999999999997,
            saturation: 1
        }
    }, {
        ref: "p07",
        name: "fillGradient",
        enabled: true,
        params: {
            mix: .75,
            gradient: [{
                time: .012,
                value: {
                    r: 76,
                    g: 0,
                    b: 255,
                    a: 1
                }
            }, {
                time: .5,
                value: {
                    r: 206,
                    g: 197,
                    b: 212,
                    a: 1
                }
            }, {
                time: 1,
                value: {
                    r: 255,
                    g: 0,
                    b: 118,
                    a: 1
                }
            }],
            gradMode: 0,
            alphaMode: 0,
            blendMode: 11,
            gradScale: 1,
            gradCenter: {
                x: 0,
                y: 0
            },
            gradAngle: 90,
            gradReverse: false,
            wrapMode: 0
        }
    }, {
        ref: "p08",
        name: "fillGradient",
        enabled: true,
        params: {
            mix: .8,
            gradient: [{
                time: .012,
                value: {
                    r: 255,
                    g: 226,
                    b: 0,
                    a: 1
                }
            }, {
                time: .5,
                value: {
                    r: 206,
                    g: 197,
                    b: 212,
                    a: 1
                }
            }, {
                time: 1,
                value: {
                    r: 0,
                    g: 211,
                    b: 255,
                    a: 1
                }
            }],
            gradMode: 0,
            alphaMode: 0,
            blendMode: 11,
            gradScale: 1,
            gradCenter: {
                x: 0,
                y: 0
            },
            gradAngle: 0,
            gradReverse: false,
            wrapMode: 0
        }
    }]
  },
  {
    toolId: "filtr-tool",
    version: 2,
    name: "UV Alloy",
    createdAt: "2025-12-16_18-4-17",
    main: {
        cnv: {
            ratio: "1:1",
            animation: true,
            scale: {
                value: 3
            }
        },
        rec: {
            frame: 275,
            length: {
                value: 5
            }
        }
    },
    modules: [{
        ref: "p01",
        name: "fillGradient",
        enabled: true,
        params: {
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
            gradScale: .03999999999999998,
            gradCenter: {
                x: 0,
                y: 0
            },
            gradAngle: 0,
            gradReverse: false,
            wrapMode: 2
        }
    }, {
        ref: "p02",
        name: "displaceSimplex",
        enabled: true,
        params: {
            noiseMode: 1,
            amp: 80,
            octaves: 1,
            aspect: 0,
            angleDomain: 0,
            angleVector: 0,
            freqMode: 0,
            freqLow: 1.9999999999999996,
            freqHigh: 25,
            speed: 10,
            seed: 308,
            wrapMode: 2,
            angle: 66
        }
    }, {
        ref: "p03",
        name: "embossEffect",
        enabled: true,
        params: {
            mix: 1,
            blendMode: 0,
            heightSource: 0,
            depthSize: 9.999999999999995,
            heightSize: 5,
            softness: .3,
            contourMode: 1,
            lightAlt: 45,
            lightAngle: 0,
            colorMode: 0,
            highColor: "#FFFFFF",
            highMode: 7,
            highOpacity: .8,
            shadColor: "#0000FF",
            shadMode: 7,
            shadOpacity: .8
        }
    }, {
        ref: "p04",
        name: "lumaBands",
        enabled: true,
        params: {
            blendMode: 0,
            mix: .65,
            weight: 1.5,
            weightAmp: 0,
            weightFreq: 1,
            phase: 0,
            phaseFreq: 0,
            contrast: 1
        }
    }, {
        ref: "p05",
        name: "fillColor",
        enabled: true,
        params: {
            blendMode: 3,
            mix: 1,
            color: "#5d4aff",
            alphaMode: 0
        }
    }, {
        ref: "p06",
        name: "fillNoise",
        enabled: true,
        params: {
            mix: .19999999999999998,
            blendMode: 0,
            threshold: {
                min: .15,
                max: .85
            },
            alphaMode: 0,
            contrast: .5,
            colorNoise: false,
            size: 1,
            fps: 0
        }
    }]
  },
  {
    toolId: "filtr-tool",
    version: 2,
    name: "Molten Scars Relief",
    createdAt: "2025-12-16_18-5-16",
    main: {
        cnv: {
            ratio: "1:1",
            animation: false,
            scale: {
                value: 3
            }
        },
        rec: {
            frame: 8,
            length: {
                value: 5
            }
        }
    },
    modules: [{
        ref: "p01",
        name: "fillColor",
        enabled: true,
        params: {
            blendMode: 0,
            mix: 1,
            color: "#ffffff",
            alphaMode: 0
        }
    }, {
        ref: "p02",
        name: "fillMedia",
        enabled: true,
        params: {
            image: "text1",
            blendMode: 0,
            mix: 1,
            scale: 100,
            rotate: 0,
            position: {
                x: 0,
                y: 0
            },
            wrapMode: 0
        }
    }, {
        ref: "m01",
        name: "maskMedia",
        enabled: false,
        params: {
            image: "noise0",
            maskRange: {
                min: 0,
                max: 100
            },
            useChannel: 0,
            invert: true,
            contrast: {
                min: 0,
                max: 80
            },
            scale: 100,
            rotate: 0,
            position: {
                x: 0,
                y: 0
            },
            wrapMode: 3
        },
        members: ["p03", "p04", "p05", "p06"]
    }, {
        ref: "p03",
        name: "fillColor",
        enabled: true,
        params: {
            blendMode: 2,
            mix: 1,
            color: "#595959",
            alphaMode: 0
        }
    }, {
        ref: "p04",
        name: "blurGaussian",
        enabled: true,
        params: {
            mix: 1,
            blendMode: 0,
            radius: 20,
            aspect: 0
        }
    }, {
        ref: "p05",
        name: "embossEffect",
        enabled: true,
        params: {
            mix: 1,
            blendMode: 8,
            heightSource: 0,
            depthSize: 38.199999999999996,
            heightSize: 10,
            softness: 0,
            contourMode: 0,
            lightAlt: 76.3,
            lightAngle: 108,
            colorMode: 0,
            highColor: "#FFFFFF",
            highMode: 7,
            highOpacity: .8,
            shadColor: "#0000FF",
            shadMode: 7,
            shadOpacity: .8
        }
    }, {
        ref: "p06",
        name: "embossEffect",
        enabled: true,
        params: {
            mix: 1,
            blendMode: 0,
            heightSource: 0,
            depthSize: 10.999999999999995,
            heightSize: .6,
            softness: 0,
            contourMode: 5,
            lightAlt: 46.50000000000001,
            lightAngle: 205,
            colorMode: 0,
            highColor: "#FFFFFF",
            highMode: 7,
            highOpacity: .8,
            shadColor: "#0000FF",
            shadMode: 7,
            shadOpacity: .8,
            height: .6199999999999983
        }
    }, {
        ref: "p07",
        name: "gradientMap",
        enabled: false,
        params: {
            mix: 1,
            blendMode: 0,
            mapMode: 0,
            gradient: [{
                time: 0,
                value: {
                    r: 255,
                    g: 0,
                    b: 0,
                    a: 1
                }
            }, {
                time: .169,
                value: {
                    r: 0,
                    g: 0,
                    b: 0,
                    a: 1
                }
            }, {
                time: .607,
                value: {
                    r: 59,
                    g: 59,
                    b: 59,
                    a: 1
                }
            }, {
                time: .843,
                value: {
                    r: 205,
                    g: 206,
                    b: 229,
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
        }
    }, {
        ref: "p08",
        name: "fillNoise",
        enabled: true,
        params: {
            mix: .5,
            blendMode: 11,
            threshold: {
                min: 0,
                max: .9
            },
            alphaMode: 1,
            contrast: .7000000000000001,
            colorNoise: false,
            size: 1,
            fps: 0
        }
    }]
  },
  {
    toolId: "filtr-tool",
    version: 2,
    name: "Bioplastic Cell",
    createdAt: "2025-12-16_18-9-2",
    main: {
        cnv: {
            ratio: "1:1",
            animation: true,
            scale: {
                value: 3
            }
        },
        rec: {
            frame: 245,
            length: {
                value: 15
            }
        }
    },
    modules: [{
        ref: "p01",
        name: "fillGradient",
        enabled: true,
        params: {
            mix: 1,
            gradient: [{
                time: 0,
                value: {
                    r: 250,
                    g: 255,
                    b: 188,
                    a: 1
                }
            }, {
                time: .327,
                value: {
                    r: 255,
                    g: 44,
                    b: 44,
                    a: 1
                }
            }, {
                time: .5690000000000001,
                value: {
                    r: 83,
                    g: 0,
                    b: 196,
                    a: 1
                }
            }, {
                time: .654,
                value: {
                    r: 68,
                    g: 0,
                    b: 214,
                    a: 1
                }
            }, {
                time: .6930000000000001,
                value: {
                    r: 251,
                    g: 51,
                    b: 38,
                    a: 1
                }
            }, {
                time: .994,
                value: {
                    r: 52,
                    g: 0,
                    b: 174,
                    a: 1
                }
            }],
            gradMode: 1,
            alphaMode: 0,
            blendMode: 0,
            gradScale: .63,
            gradCenter: {
                x: 2949029909160572e-32,
                y: -8673617379884035e-33
            },
            gradAngle: 0,
            gradReverse: false,
            wrapMode: 3
        }
    }, {
        ref: "m01",
        name: "maskMedia",
        enabled: true,
        params: {
            image: "gradient-circle",
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
            scale: 116.8,
            rotate: 0,
            position: {
                x: 0,
                y: 0
            },
            wrapMode: 0
        },
        members: ["p02", "p03"]
    }, {
        ref: "p02",
        name: "displaceSimplex",
        enabled: true,
        params: {
            noiseMode: 1,
            amp: 54.800000000000004,
            octaves: 1,
            aspect: 0,
            angleDomain: 0,
            angleVector: 0,
            freqMode: 0,
            freqLow: 11.6,
            freqHigh: 100,
            speed: 6,
            seed: 848,
            wrapMode: 2
        }
    }, {
        ref: "p03",
        name: "displaceSimplex",
        enabled: true,
        params: {
            noiseMode: 1,
            amp: 28.9,
            octaves: 4,
            aspect: 0,
            angleDomain: 0,
            angleVector: 0,
            freqMode: 0,
            freqLow: 3.9,
            freqHigh: 100,
            speed: 6,
            seed: 527,
            wrapMode: 2
        }
    }, {
        ref: "p04",
        name: "embossEffect",
        enabled: true,
        params: {
            mix: 1,
            blendMode: 0,
            heightSource: 0,
            depthSize: 100,
            heightSize: 1,
            softness: .26,
            contourMode: 2,
            lightAlt: 51.199999999999996,
            lightAngle: 115,
            colorMode: 1,
            highColor: "#550027",
            highMode: 12,
            highOpacity: 1,
            shadColor: "#000000",
            shadMode: 11,
            shadOpacity: .9
        }
    }, {
        ref: "p05",
        name: "fillColor",
        enabled: true,
        params: {
            blendMode: 7,
            mix: 1,
            color: "#151515",
            alphaMode: 0
        }
    }, {
        ref: "p06",
        name: "fillNoise",
        enabled: true,
        params: {
            mix: .19999999999999998,
            blendMode: 11,
            threshold: {
                min: 0,
                max: .9
            },
            alphaMode: 1,
            contrast: 5,
            colorNoise: true,
            size: 1,
            fps: 30
        }
    }]
  },
  {
    toolId: "filtr-tool",
    version: 2,
    name: "Blazing Box",
    createdAt: "2025-12-16_18-9-36",
    main: {
        cnv: {
            ratio: "1:1",
            animation: true,
            scale: {
                value: 3
            }
        },
        rec: {
            frame: 75,
            length: {
                value: 15
            }
        }
    },
    modules: [{
        ref: "p01",
        name: "fillGradient",
        enabled: true,
        params: {
            mix: 1,
            gradient: [{
                time: 0,
                value: {
                    r: 255,
                    g: 235,
                    b: 150,
                    a: 1
                }
            }, {
                time: .497,
                value: {
                    r: 255,
                    g: 113,
                    b: 173,
                    a: 1
                }
            }, {
                time: 1,
                value: {
                    r: 26,
                    g: 29,
                    b: 255,
                    a: 1
                }
            }],
            gradMode: 3,
            alphaMode: 0,
            blendMode: 0,
            gradScale: .15000000000000002,
            gradCenter: {
                x: 2949029909160572e-32,
                y: -8673617379884035e-33
            },
            gradAngle: 0,
            gradReverse: false,
            wrapMode: 2
        }
    }, {
        ref: "m01",
        name: "maskMedia",
        enabled: true,
        params: {
            image: "shape2",
            maskRange: {
                min: 0,
                max: 100
            },
            useChannel: 0,
            invert: true,
            contrast: {
                min: 0,
                max: 100
            },
            scale: 78.1,
            rotate: 0,
            position: {
                x: 0,
                y: 0
            },
            wrapMode: 0
        },
        members: ["p02"]
    }, {
        ref: "p02",
        name: "displaceSine",
        enabled: true,
        params: {
            sineMode: 0,
            amp: 46.50000000000001,
            compress: .54,
            aspect: 0,
            center: {
                x: 0,
                y: 0
            },
            freqMode: 0,
            freqLow: 3.3,
            freqHigh: 25,
            angle: -46,
            phase: 0,
            cycle: 4,
            wrapMode: 1
        }
    }, {
        ref: "p03",
        name: "embossEffect",
        enabled: true,
        params: {
            mix: 1,
            blendMode: 0,
            heightSource: 0,
            depthSize: 27.9,
            heightSize: 2.17,
            softness: .48000000000000004,
            contourMode: 5,
            lightAlt: 23.2,
            lightAngle: 145,
            colorMode: 1,
            highColor: "#58ff74",
            highMode: 9,
            highOpacity: 1,
            shadColor: "#000000",
            shadMode: 11,
            shadOpacity: 1
        }
    }, {
        ref: "p04",
        name: "fillColor",
        enabled: true,
        params: {
            blendMode: 14,
            mix: 1,
            color: "#1a2e15",
            alphaMode: 0
        }
    }, {
        ref: "p05",
        name: "fillNoise",
        enabled: true,
        params: {
            mix: .10000000000000002,
            blendMode: 15,
            threshold: {
                min: 0,
                max: .8
            },
            alphaMode: 1,
            contrast: 2,
            colorNoise: true,
            size: 1,
            fps: 0
        }
    }]
  },
  {
    toolId: "filtr-tool",
    version: 2,
    name: "Reflective Stack",
    createdAt: "2025-12-16_18-9-54",
    main: {
        cnv: {
            ratio: "1:1",
            animation: true,
            scale: {
                value: 3.5
            }
        },
        rec: {
            frame: 353,
            length: {
                value: 10
            }
        }
    },
    modules: [{
        ref: "p01",
        name: "fillColor",
        enabled: true,
        params: {
            blendMode: 0,
            mix: 1,
            color: "#FFFFFF",
            alphaMode: 0
        }
    }, {
        ref: "p02",
        name: "fillMedia",
        enabled: true,
        params: {
            image: "text0",
            blendMode: 0,
            mix: 1,
            scale: 90,
            rotate: 0,
            position: {
                x: 0,
                y: 0
            },
            wrapMode: 3
        }
    }, {
        ref: "p03",
        name: "displaceSimplex",
        enabled: true,
        params: {
            noiseMode: 0,
            amp: 20,
            octaves: 1,
            aspect: 0,
            angleDomain: 0,
            angleVector: 0,
            freqMode: 0,
            freqLow: 0,
            freqHigh: 100,
            speed: 22,
            seed: 496,
            wrapMode: 0
        }
    }, {
        ref: "p04",
        name: "lensGrid",
        enabled: true,
        params: {
            mix: 1,
            strength: .6,
            blur: .9999999999999996,
            gridCells: {
                x: 2,
                y: 2
            },
            gridScale: .7,
            gridAngle: 45,
            squircle: 8.019999999999998,
            lensScale: .9500000000000002,
            ior: 1.3500000000000003,
            curvature: 4,
            edgeSoftness: .030000000000000002,
            aberration: .019999999999999997,
            lightDir: {
                x: .34,
                y: .09999999999999998
            },
            specAmount: .43999999999999984,
            specPower: .7000000000000001,
            specColor: "#cfe2e9",
            shadowAmount: .73,
            shadowPower: .46,
            shadowColor: "#0d0f10",
            wrapMode: 0,
            gridMode: 0
        }
    }]
  },
  {
    toolId: "filtr-tool",
    version: 2,
    name: "Soft Metal Stream",
    createdAt: "2025-12-16_18-10-13",
    main: {
        cnv: {
            ratio: "4:3",
            animation: true,
            scale: {
                value: 3
            }
        },
        rec: {
            frame: 70,
            length: {
                value: 10
            }
        }
    },
    modules: [{
        ref: "p01",
        name: "fillGradient",
        enabled: true,
        params: {
            mix: 1,
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
                    r: 132,
                    g: 132,
                    b: 132,
                    a: 1
                }
            }],
            gradMode: 0,
            alphaMode: 0,
            blendMode: 0,
            gradScale: 1.2,
            gradCenter: {
                x: 0,
                y: 0
            },
            gradAngle: 90,
            gradReverse: false,
            wrapMode: 2
        }
    }, {
        ref: "p02",
        name: "displaceSimplex",
        enabled: true,
        params: {
            noiseMode: 0,
            amp: 100,
            octaves: 1,
            aspect: .04999999999999998,
            angleDomain: 60,
            angleVector: 0,
            freqMode: 0,
            freqLow: .6999999999999997,
            freqHigh: 100,
            speed: 8,
            seed: 723,
            wrapMode: 2
        }
    }, {
        ref: "p03",
        name: "blurGaussian",
        enabled: true,
        params: {
            mix: 1,
            blendMode: 0,
            radius: 50,
            aspect: 0
        }
    }, {
        ref: "p04",
        name: "warpGrid",
        enabled: true,
        params: {
            mix: 1,
            strength: .8,
            cellFeather: 0,
            gridMode: 0,
            gridCell: 17,
            gridCells: {
                x: 16,
                y: 16
            },
            gridScale: 1.4000000000000001,
            gridAngle: 9,
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
        }
    }, {
        ref: "p05",
        name: "embossEffect",
        enabled: true,
        params: {
            mix: .7000000000000001,
            blendMode: 0,
            heightSource: 0,
            depthSize: 4.999999999999999,
            heightSize: 5,
            softness: .3,
            contourMode: 0,
            lightAlt: 0,
            lightAngle: 160,
            colorMode: 0,
            highColor: "#FFFFFF",
            highMode: 7,
            highOpacity: .8,
            shadColor: "#0000FF",
            shadMode: 7,
            shadOpacity: .8
        }
    }, {
        ref: "p06",
        name: "lumaBands",
        enabled: true,
        params: {
            blendMode: 0,
            mix: 1,
            weight: 5,
            weightAmp: 1,
            weightFreq: 1,
            phase: 6938893903907228e-33,
            phaseFreq: 2,
            contrast: 1
        }
    }, {
        ref: "p07",
        name: "fillColor",
        enabled: true,
        params: {
            blendMode: 18,
            mix: 1,
            color: "#ff451b",
            alphaMode: 0
        }
    }, {
        ref: "p08",
        name: "fillNoise",
        enabled: true,
        params: {
            mix: .10000000000000007,
            blendMode: 17,
            threshold: {
                min: 0,
                max: 1
            },
            alphaMode: 1,
            contrast: .5,
            colorNoise: true,
            size: 1,
            fps: 0
        }
    }]
  },
];
