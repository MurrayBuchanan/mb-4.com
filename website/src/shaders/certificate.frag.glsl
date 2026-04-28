
  uniform sampler2D map;
  uniform sampler2D uFoilMap;
  uniform float matteRoughness;
  uniform float reflectiveStrength;
  uniform vec3 uCameraPosition;
  uniform vec3 uLight1Position;
  uniform float uLight1Intensity;
  uniform vec3 uLight2Position;
  uniform float uLight2Intensity;
  uniform float uTime;
  uniform float uScrollOffset;
  uniform vec2  uMouse;
  uniform float uBevelSize;
  uniform float uBevelStrength;
  uniform float uFoilSaturation;
  uniform float uFoilOpacity;
  uniform float uFoilContrast;

  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  vec3 hueToRgb(float h) {
    h = fract(h);
    float r = abs(h * 6.0 - 3.0) - 1.0;
    float g = 2.0 - abs(h * 6.0 - 2.0);
    float b = 2.0 - abs(h * 6.0 - 4.0);
    return clamp(vec3(r, g, b), 0.0, 1.0);
  }

  // Hard Light: foil acts as the light source painted over the certificate.
  // blend = 0.5 → no change; < 0.5 → darkens (multiply); > 0.5 → brightens (screen).
  vec3 hardLight(vec3 base, vec3 blend) {
    vec3 dark   = 2.0 * base * blend;
    vec3 bright = 1.0 - 2.0 * (1.0 - base) * (1.0 - blend);
    return mix(dark, bright, step(0.5, blend));
  }

  void main() {
    vec4 texColor = texture2D(map, vUv);
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(uCameraPosition - vWorldPosition);
    vec3 L1 = normalize(uLight1Position - vWorldPosition);
    vec3 L2 = normalize(uLight2Position - vWorldPosition);

    float NdotL1 = max(dot(N, L1), 0.0);
    float NdotL2 = max(dot(N, L2), 0.0);
    float diffuse = NdotL1 * uLight1Intensity + NdotL2 * uLight2Intensity;
    diffuse = 0.5 + diffuse * 0.5;

    float matte = 1.0 - matteRoughness * 0.3;
    vec3 baseColor = texColor.rgb * matte * diffuse;

    // ── Holographic foil ─────────────────────────────────────────────
    float foilStrength = texture2D(uFoilMap, vUv).r;

    float NdotV = max(dot(N, V), 0.0);
    vec3  R     = reflect(-V, N);
    float fresnel = pow(1.0 - NdotV, 2.5);

    // ── Angle-dependent hue — NO atan, so no ±π wrap discontinuity ──
    // Smooth dot-product projections of R onto two orthogonal reference
    // directions; tilting the card rotates R and continuously shifts the hue.
    float PI2     = 6.28318530718;
    float viewHue = fract(R.x * 2.2 + R.y * 1.6 + R.z * 0.5 + uTime * 0.04
                          + uScrollOffset + uMouse.x * 0.8 + uMouse.y * 0.5);

    // ── Multi-frequency diffraction bands ──
    // Integer coefficients → sin completes whole cycles over UV [0,1],
    // so there is zero discontinuity at any UV boundary.
    float g1 = sin((vUv.x *  7.0 + vUv.y *  3.0) * PI2);
    float g2 = sin((vUv.x *  2.0 - vUv.y *  6.0) * PI2);
    float g3 = sin((vUv.x * 10.0 + vUv.y *  7.0) * PI2);
    float hue = fract(viewHue + g1 * 0.18 + g2 * 0.12 + g3 * 0.05 + fresnel * 0.08);

    // White areas (foilStrength ≈ 1) → normal hue.
    // Gray areas (foilStrength < 1 but > 0) → complementary hue (+0.5).
    // smoothstep maps the transition so anti-aliased edges blend cleanly.
    float isWhite = smoothstep(0.7, 0.97, foilStrength);
    float effectiveHue = fract(hue + mix(0.5, 0.0, isWhite));

    // Vivid, saturated rainbow
    vec3 rainbow = hueToRgb(effectiveHue);
    float luma = dot(rainbow, vec3(0.299, 0.587, 0.114));
    rainbow = clamp(mix(vec3(luma), rainbow, uFoilSaturation), 0.0, 1.0);

    // ── Foil stamp bevel: bump-map the edges of the foil mask ──
    // Sample the mask at 4 neighbours to approximate the gradient.
    // Non-zero gradient = edge of the stamp = raised bevel highlight/shadow.
    vec2 foilGrad = vec2(
      texture2D(uFoilMap, vUv + vec2( uBevelSize, 0.0)).r - texture2D(uFoilMap, vUv + vec2(-uBevelSize, 0.0)).r,
      texture2D(uFoilMap, vUv + vec2(0.0,  uBevelSize)).r - texture2D(uFoilMap, vUv + vec2(0.0, -uBevelSize)).r
    );
    // Perturb the surface normal in UV/tangent space (PlaneGeometry: U→X, V→Y)
    vec3 bumpN   = normalize(N + vec3(foilGrad.x, foilGrad.y, 0.0) * uBevelStrength);
    float bumpD  = max(dot(bumpN, L1), 0.0) * uLight1Intensity
                 + max(dot(bumpN, L2), 0.0) * uLight2Intensity;
    float bumpDiffuse = 0.5 + bumpD * 0.5;
    // Additive bevel: only the delta above normal diffuse, masked to stamp edge
    float bevelMagnitude = length(foilGrad);
    float bevel = (bumpDiffuse - diffuse) * bevelMagnitude * uBevelStrength * 1.2;
    vec3 baseColor_beveled = baseColor + baseColor * bevel;

    // ── Hard Light blend: foil tints the certificate without covering it ──
    float metalDiff = mix(0.15, 1.0, pow(diffuse, 1.8));
    float tintStr   = (0.38 + fresnel * 0.52) * metalDiff * uFoilContrast;
    vec3  foilTint  = mix(vec3(0.5), rainbow, tintStr);

    vec3 foilColor = hardLight(baseColor_beveled, foilTint);

    // ── Additive specular on top (glint + sheen, no animated sparkle) ──
    vec3  H1 = normalize(L1 + V);
    vec3  H2 = normalize(L2 + V);
    float sGlint = pow(max(dot(N, H1), 0.0), 256.0) * uLight1Intensity * 3.5
                 + pow(max(dot(N, H2), 0.0), 256.0) * uLight2Intensity * 3.0;
    float sSheen = pow(max(dot(N, H1), 0.0), 20.0)  * uLight1Intensity * 0.28
                 + pow(max(dot(N, H2), 0.0), 20.0)  * uLight2Intensity * 0.22;
    vec3 specColor = mix(rainbow, vec3(1.0), 0.6);
    foilColor += specColor * sGlint + rainbow * sSheen * 0.45;

    // ── Composite ──
    // Use beveled base outside the foil area, foil overlay inside it
    vec3 finalBase = mix(baseColor, baseColor_beveled, foilStrength);
    vec3 composited = mix(finalBase, foilColor, foilStrength * uFoilOpacity);

    // ── Shadow saturation: boost saturation in darker areas only ──
    float compLuma = dot(composited, vec3(0.299, 0.587, 0.114));
    float inShadow = 1.0 - smoothstep(0.0, 0.4, compLuma);
    float shadowSatBoost = inShadow * 0.22;
    composited = clamp(compLuma + (composited - compLuma) * (1.0 + shadowSatBoost), 0.0, 1.0);

    // ── Film grain — value noise with bilinear interp to avoid stripes; stronger dark/light mix ──
    const float GRAIN_FREQ = 3000.0;
    vec2  grainCell  = floor(vUv * GRAIN_FREQ);
    vec2  grainFrac  = fract(vUv * GRAIN_FREQ);
    vec2  g       = grainFrac * grainFrac * (3.0 - 2.0 * grainFrac); // smoothstep for smooth blending
    float h00     = fract(sin(dot(grainCell,              vec2(127.1, 311.7))) * 43758.5453);
    float h10     = fract(sin(dot(grainCell + vec2(1,0),  vec2(269.5, 183.3))) * 43758.5453);
    float h01     = fract(sin(dot(grainCell + vec2(0,1),  vec2(419.2, 371.9))) * 43758.5453);
    float h11     = fract(sin(dot(grainCell + vec2(1,1),  vec2(83.7, 97.1))) * 43758.5453);
    float grain   = mix(mix(h00, h10, g.x), mix(h01, h11, g.x), g.y);
    float grainAdd = (grain - 0.5) * 0.14;
    // In blacks: only add positive grain (compLuma from shadow-sat block) so dark areas get visible lighter speckles (avoid clamp-to-0)
    float inDark = 1.0 - smoothstep(0.0, 0.1, compLuma);
    grainAdd = mix(grainAdd, max(0.0, grainAdd), inDark);
    composited += grainAdd;

    gl_FragColor = vec4(composited, texColor.a);
  }
