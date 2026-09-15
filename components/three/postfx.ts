import * as THREE from "three";

/**
 * HDR post chain run after the chapter compositor:
 *   prefilter (soft-knee threshold) → dual-Kawase downsample ×N → upsample ×N
 *   → final grade (bloom add, highlight roll-off, sRGB, fine grain, vignette).
 * Everything works on half-float targets so neon and lens glints bloom
 * naturally without washing out the rest of the frame.
 */

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const prefilter = /* glsl */ `
  uniform sampler2D tInput;
  uniform float uThreshold;
  uniform float uKnee;
  varying vec2 vUv;
  void main() {
    vec3 c = texture2D(tInput, vUv).rgb;
    float br = max(c.r, max(c.g, c.b));
    float soft = clamp(br - uThreshold + uKnee, 0.0, 2.0 * uKnee);
    soft = soft * soft / (4.0 * uKnee + 1e-4);
    float contrib = max(soft, br - uThreshold) / max(br, 1e-4);
    gl_FragColor = vec4(min(c * contrib, vec3(40.0)), 1.0);
  }
`;

const downsample = /* glsl */ `
  uniform sampler2D tInput;
  uniform vec2 uTexel;
  varying vec2 vUv;
  void main() {
    vec3 s = texture2D(tInput, vUv).rgb * 4.0;
    s += texture2D(tInput, vUv + uTexel * vec2(-1.0, -1.0)).rgb;
    s += texture2D(tInput, vUv + uTexel * vec2( 1.0, -1.0)).rgb;
    s += texture2D(tInput, vUv + uTexel * vec2(-1.0,  1.0)).rgb;
    s += texture2D(tInput, vUv + uTexel * vec2( 1.0,  1.0)).rgb;
    gl_FragColor = vec4(s / 8.0, 1.0);
  }
`;

const upsample = /* glsl */ `
  uniform sampler2D tInput;
  uniform sampler2D tAdd;
  uniform vec2 uTexel;
  varying vec2 vUv;
  void main() {
    vec3 s = vec3(0.0);
    s += texture2D(tInput, vUv + uTexel * vec2(-2.0, 0.0)).rgb;
    s += texture2D(tInput, vUv + uTexel * vec2( 2.0, 0.0)).rgb;
    s += texture2D(tInput, vUv + uTexel * vec2(0.0, -2.0)).rgb;
    s += texture2D(tInput, vUv + uTexel * vec2(0.0,  2.0)).rgb;
    s += texture2D(tInput, vUv + uTexel * vec2(-1.0, -1.0)).rgb * 2.0;
    s += texture2D(tInput, vUv + uTexel * vec2( 1.0, -1.0)).rgb * 2.0;
    s += texture2D(tInput, vUv + uTexel * vec2(-1.0,  1.0)).rgb * 2.0;
    s += texture2D(tInput, vUv + uTexel * vec2( 1.0,  1.0)).rgb * 2.0;
    gl_FragColor = vec4(s / 12.0 + texture2D(tAdd, vUv).rgb, 1.0);
  }
`;

const finalGrade = /* glsl */ `
  uniform sampler2D tScene;
  uniform sampler2D tBloom;
  uniform float uBloom;
  uniform float uTime;
  uniform float uGrain;
  uniform float uFxaa;
  uniform vec2 uRes;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  // filmic shoulder: linear to 0.7, then a smooth exponential roll to white
  vec3 rolloff(vec3 c) {
    vec3 x = max(c, 0.0);
    vec3 hi = 0.7 + 0.3 * (1.0 - exp(-(x - 0.7) / 0.3));
    return mix(x, hi, step(0.7, x));
  }

  vec3 toSRGB(vec3 c) {
    return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
  }

  float luma(vec3 c) {
    return dot(rolloff(c), vec3(0.299, 0.587, 0.114));
  }

  // FXAA (console variant): used when MSAA is switched off to hold frame rate
  vec3 fxaa(vec2 uv) {
    vec2 px = 1.0 / uRes;
    vec3 nw = texture2D(tScene, uv + vec2(-1.0, -1.0) * px).rgb;
    vec3 ne = texture2D(tScene, uv + vec2( 1.0, -1.0) * px).rgb;
    vec3 sw = texture2D(tScene, uv + vec2(-1.0,  1.0) * px).rgb;
    vec3 se = texture2D(tScene, uv + vec2( 1.0,  1.0) * px).rgb;
    vec3 m = texture2D(tScene, uv).rgb;
    float lNW = luma(nw), lNE = luma(ne), lSW = luma(sw), lSE = luma(se), lM = luma(m);
    float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE)));
    float lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
    vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), (lNW + lSW) - (lNE + lSE));
    float reduce = max((lNW + lNE + lSW + lSE) * 0.03125, 1.0 / 128.0);
    float rcp = 1.0 / (min(abs(dir.x), abs(dir.y)) + reduce);
    dir = clamp(dir * rcp, vec2(-8.0), vec2(8.0)) * px;
    vec3 a = 0.5 * (texture2D(tScene, uv + dir * (1.0 / 3.0 - 0.5)).rgb + texture2D(tScene, uv + dir * (2.0 / 3.0 - 0.5)).rgb);
    vec3 b = a * 0.5 + 0.25 * (texture2D(tScene, uv - dir * 0.5).rgb + texture2D(tScene, uv + dir * 0.5).rgb);
    float lB = luma(b);
    return (lB < lMin || lB > lMax) ? a : b;
  }

  void main() {
    vec3 base = uFxaa > 0.5 ? fxaa(vUv) : texture2D(tScene, vUv).rgb;
    vec3 col = base + texture2D(tBloom, vUv).rgb * uBloom;
    col = toSRGB(rolloff(col));

    float grain = hash(vUv * uRes + fract(uTime * 13.0) * 97.0) - 0.5;
    col += grain * uGrain;

    float aspect = uRes.x / uRes.y;
    vec2 q = (vUv - 0.5) * vec2(aspect, 1.0);
    col *= mix(0.86, 1.0, smoothstep(1.3, 0.35, length(q)));

    gl_FragColor = vec4(col, 1.0);
  }
`;

const LEVELS = 6;

function target(w: number, h: number) {
  return new THREE.WebGLRenderTarget(Math.max(1, w), Math.max(1, h), {
    type: THREE.HalfFloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
    stencilBuffer: false,
  });
}

export class PostFX {
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private quad: THREE.Mesh;
  private down: THREE.WebGLRenderTarget[] = [];
  private up: THREE.WebGLRenderTarget[] = [];
  private width = 0;
  private height = 0;

  private mPre = this.material(prefilter, { tInput: null, uThreshold: 1.0, uKnee: 0.45 });
  private mDown = this.material(downsample, { tInput: null, uTexel: new THREE.Vector2() });
  private mUp = this.material(upsample, { tInput: null, tAdd: null, uTexel: new THREE.Vector2() });
  private mFinal = this.material(finalGrade, {
    tScene: null,
    tBloom: null,
    uBloom: 0.8,
    uTime: 0,
    uGrain: 0.014,
    uFxaa: 0,
    uRes: new THREE.Vector2(1, 1),
  });

  constructor() {
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.mFinal);
    this.quad.frustumCulled = false;
    this.scene.add(this.quad);
  }

  private material(fragmentShader: string, uniforms: Record<string, unknown>) {
    const u: Record<string, THREE.IUniform> = {};
    for (const [k, v] of Object.entries(uniforms)) u[k] = { value: v };
    return new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader,
      uniforms: u,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
  }

  setSize(width: number, height: number) {
    if (width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;
    [...this.down, ...this.up].forEach((t) => t.dispose());
    this.down = [];
    this.up = [];
    let w = Math.floor(width / 2);
    let h = Math.floor(height / 2);
    for (let i = 0; i < LEVELS; i++) {
      this.down.push(target(w, h));
      this.up.push(target(w, h));
      w = Math.floor(w / 2);
      h = Math.floor(h / 2);
    }
  }

  private pass(gl: THREE.WebGLRenderer, material: THREE.ShaderMaterial, out: THREE.WebGLRenderTarget | null) {
    this.quad.material = material;
    gl.setRenderTarget(out);
    gl.render(this.scene, this.camera);
  }

  render(
    gl: THREE.WebGLRenderer,
    input: THREE.Texture,
    opts: { bloom: number; threshold: number; time: number; grain: number; fxaa: boolean }
  ) {
    const d = this.down;
    const u = this.up;

    this.mPre.uniforms.tInput.value = input;
    this.mPre.uniforms.uThreshold.value = opts.threshold;
    this.pass(gl, this.mPre, d[0]);

    for (let i = 1; i < LEVELS; i++) {
      this.mDown.uniforms.tInput.value = d[i - 1].texture;
      this.mDown.uniforms.uTexel.value.set(0.5 / d[i - 1].width, 0.5 / d[i - 1].height);
      this.pass(gl, this.mDown, d[i]);
    }

    // walk back up, adding each level's detail
    let source = d[LEVELS - 1];
    for (let i = LEVELS - 2; i >= 0; i--) {
      this.mUp.uniforms.tInput.value = source.texture;
      this.mUp.uniforms.tAdd.value = d[i].texture;
      this.mUp.uniforms.uTexel.value.set(0.5 / source.width, 0.5 / source.height);
      this.pass(gl, this.mUp, u[i]);
      source = u[i];
    }

    const f = this.mFinal.uniforms;
    f.tScene.value = input;
    f.tBloom.value = source.texture;
    f.uBloom.value = opts.bloom;
    f.uTime.value = opts.time;
    f.uGrain.value = opts.grain;
    f.uFxaa.value = opts.fxaa ? 1 : 0;
    f.uRes.value.set(this.width, this.height);
    this.pass(gl, this.mFinal, null);
  }

  dispose() {
    [...this.down, ...this.up].forEach((t) => t.dispose());
    [this.mPre, this.mDown, this.mUp, this.mFinal].forEach((m) => m.dispose());
    this.quad.geometry.dispose();
  }
}
