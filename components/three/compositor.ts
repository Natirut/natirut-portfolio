/**
 * Final full-screen pass. Scene A is the chapter we are diving out of, scene B
 * the one we are diving into.
 *
 *  - A keeps zooming toward its focus point with a radial motion blur.
 *  - B grows out of its own anchor point.
 *  - The swap happens through a rotated halftone dot screen that blooms outward
 *    from the focus, with a coloured rim on each dot — the print aesthetic of
 *    the reference piece, re-imagined as a data transition.
 *  - Output stays linear HDR; bloom and grading happen in postfx.ts.
 */
export const compositorVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const compositorFragment = /* glsl */ `
  uniform sampler2D tA;
  uniform sampler2D tB;
  uniform float uMix;
  uniform float uTime;
  uniform float uVelocity;
  uniform vec2 uFocus;
  uniform vec2 uAnchor;
  uniform vec2 uRes;
  uniform vec3 uRim;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  vec3 radialBlur(sampler2D tex, vec2 uv, vec2 center, float strength) {
    vec3 acc = vec3(0.0);
    const int N = 8;
    for (int k = 0; k < N; k++) {
      float s = float(k) / float(N - 1);
      vec2 q = center + (uv - center) * (1.0 - strength * s);
      acc += texture2D(tex, clamp(q, 0.001, 0.999)).rgb;
    }
    return acc / float(N);
  }

  void main() {
    float aspect = uRes.x / uRes.y;
    float pulse = sin(3.14159 * uMix);

    // --- scene A: keep plunging toward the focus
    float zoomA = 1.0 + uMix * uMix * 2.2;
    vec2 uvA = uFocus + (vUv - uFocus) / zoomA;
    float blurA = pulse * 0.16 + uVelocity * 0.01;
    vec3 colA;
    if (blurA > 0.002) {
      colA = radialBlur(tA, uvA, uFocus, blurA);
      // cheap chromatic fringe: re-tint red/blue from two offset taps
      float ca = pulse * 0.012;
      vec3 fR = texture2D(tA, clamp(uFocus + (uvA - uFocus) * (1.0 + ca), 0.001, 0.999)).rgb;
      vec3 fB = texture2D(tA, clamp(uFocus + (uvA - uFocus) * (1.0 - ca), 0.001, 0.999)).rgb;
      colA.r = mix(colA.r, fR.r, 0.5);
      colA.b = mix(colA.b, fB.b, 0.5);
    } else {
      colA = texture2D(tA, uvA).rgb;
    }

    vec3 col = colA;

    if (uMix > 0.0005) {
      // --- scene B: bloom out of its anchor
      float growB = 1.0 + (1.0 - uMix) * (1.0 - uMix) * 1.4;
      vec2 uvB = uAnchor + (vUv - uAnchor) * growB;
      float blurB = pulse * 0.1;
      vec3 colB = blurB > 0.002 ? radialBlur(tB, uvB, uAnchor, -blurB * 0.6) : texture2D(tB, uvB).rgb;

      // --- halftone dissolve
      float cellPx = 22.0 * max(1.0, uRes.y / 1100.0);
      mat2 rot = mat2(0.8660, 0.5, -0.5, 0.8660);
      vec2 px = vUv * uRes;
      vec2 g = rot * px / cellPx;
      vec2 id = floor(g);
      vec2 fr = fract(g) - 0.5;
      vec2 cellCenterPx = (transpose(rot) * ((id + 0.5) * cellPx));
      vec2 cellUv = cellCenterPx / uRes;
      float d = length((cellUv - uFocus) * vec2(aspect, 1.0));
      float n = hash(id) * 0.35;
      float reveal = clamp(uMix * 3.9 - d * 1.05 - n, 0.0, 1.0);
      float radius = reveal * 0.74;
      float len = length(fr);
      float aa = 1.2 / cellPx;
      float dotMask = 1.0 - smoothstep(radius - aa, radius + aa, len);
      dotMask = mix(dotMask, 1.0, smoothstep(0.9, 1.0, uMix));

      float rim = smoothstep(radius - 0.14, radius - 0.02, len) * dotMask * step(0.02, radius) * (1.0 - step(0.72, radius));

      col = mix(colA, colB, dotMask);
      col += uRim * rim * smoothstep(0.1, 0.3, radius) * 0.9 * pulse;

      // a thin white flash at the heart of the dive
      col += vec3(1.0) * smoothstep(0.35, 0.0, d) * pow(pulse, 8.0) * 0.25;
    }

    gl_FragColor = vec4(col, 1.0);
  }
`;
