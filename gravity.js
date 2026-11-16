// Portfolio v2 — scroll-driven gravity scene (Three.js).
// Scene and physics adapted from the Gravity studio template: hero cluster → drop
// to the floor → assemble into a code glyph → fly into the lens. After the scene the
// page continues with regular content and the simulation parks itself.
import * as THREE from 'three';

const lateStart = !!window.__gravityRevealed; // fallback already revealed the page
clearTimeout(window.__gravityTimer);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SHAPE_TEXT = '</>';

/* ================= Themes ================= */
const THEMES = [
  { id: 'royalBlue',  name: 'Royal Blue & Pearl',   description: '흰 슬레이트 그라데이션 위의 코발트 구슬', primaryColor: '#2F69FF', ballColor: '#2F69FF',
    heroBg: 'radial-gradient(circle at center, #ffffff 0%, #ecefff 35%, #c2d1ff 100%)' },
  { id: 'pinkBlush',  name: 'Rose Blush & Crème',   description: '펄 스튜디오의 캔디 핑크와 딸기빛 포인트', primaryColor: '#FFA6B3', ballColor: '#FFC5C2',
    heroBg: 'radial-gradient(circle at center, #ffffff 0%, #fff5f4 35%, #ffd6dc 100%)' },
  { id: 'voltLime',   name: 'Volt Lime & Slate',    description: '깨끗한 지평선 위의 네온 볼트 라임', primaryColor: '#E1FC03', ballColor: '#E1FC03',
    heroBg: 'radial-gradient(circle at center, #ffffff 0%, #fbffe5 35%, #eefcb0 100%)' },
  { id: 'arcticBlue', name: 'Arctic Sky & Crystal', description: '투명한 유리 광택의 차가운 아틱 블루', primaryColor: '#96E5FF', ballColor: '#96E5FF',
    heroBg: 'radial-gradient(circle at center, #ffffff 0%, #f0f9ff 35%, #c9f1ff 100%)' },
];
const themesEl = document.getElementById('themes');
themesEl.innerHTML = THEMES.map(t => `
  <button class="theme" data-id="${t.id}" type="button">
    <div class="theme-top"><span class="theme-name">${t.name}</span><span class="swatch" style="background:${t.primaryColor}"></span></div>
    <div class="theme-desc">${t.description}</div>
  </button>`).join('');

/* ================= Shared state ================= */
const control = { progress: 0, started: false };
const mousePos = { x: 99, y: 99, isDown: false };

window.addEventListener('pointermove', e => {
  mousePos.x = (e.clientX / window.innerWidth) * 2 - 1;
  mousePos.y = -(e.clientY / window.innerHeight) * 2 + 1;
});
document.documentElement.addEventListener('pointerleave', () => { mousePos.x = 99; mousePos.y = 99; });
window.addEventListener('mousedown', () => mousePos.isDown = true);
window.addEventListener('mouseup',   () => mousePos.isDown = false);

/* ================= Smooth scroll (Lenis-style) ================= */
if (!lateStart) window.scrollTo(0, 0);

const smooth = { current: 0, target: 0, active: false, locked: !lateStart };
const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
let drawerOpen = false;
const drawerEl = document.getElementById('drawer');

if (!reduceMotion) {
  window.addEventListener('wheel', (e) => {
    if (e.ctrlKey) return;                                   // keep pinch-zoom
    if (drawerOpen) { if (!drawerEl.contains(e.target)) e.preventDefault(); return; }
    e.preventDefault();
    if (smooth.locked) return;
    let d = e.deltaY;
    if (e.deltaMode === 1) d *= 16; else if (e.deltaMode === 2) d *= window.innerHeight;
    if (!smooth.active) smooth.current = smooth.target = window.scrollY;
    smooth.target = Math.min(maxScroll(), Math.max(0, smooth.target + d));
    smooth.active = true;
  }, { passive: false });
}

const smoothTick = () => {
  if (smooth.active) {
    smooth.current += (smooth.target - smooth.current) * 0.09;
    if (Math.abs(smooth.target - smooth.current) < 0.5) { smooth.current = smooth.target; smooth.active = false; }
    window.scrollTo(0, smooth.current);
  }
  requestAnimationFrame(smoothTick);
};
requestAnimationFrame(smoothTick);

// In-page links glide with the same easing.
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href').slice(1);
  const el = id && document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  if (drawerOpen) closeDrawer();
  const y = id === 'hero' ? 0 : Math.min(maxScroll(), el.getBoundingClientRect().top + window.scrollY);
  if (reduceMotion || smooth.locked) { window.scrollTo(0, y); }
  else { smooth.current = window.scrollY; smooth.target = y; smooth.active = true; }
  history.replaceState(null, '', '#' + id);
});

/* ================= Scroll → progress & background stage ================= */
// progress = section index + fraction through that section, so the scene stays in
// sync even when a section is taller than the viewport (e.g. on phones).
const stageEls = ['hero', 'about', 'approach', 'release', 'work'].map(id => document.getElementById(id));
let stageTops = [];
const measureStages = () => { stageTops = stageEls.map(el => el.getBoundingClientRect().top + window.scrollY); };
measureStages();

const bgLayers = ['bg-hero', 'bg-lime', 'bg-pink', 'bg-light'].map(id => document.getElementById(id));
let bgStage = 0;
const setBgStage = (s) => {
  if (s === bgStage) return;
  bgStage = s;
  bgLayers.forEach((el, i) => el.classList.toggle('on', i === s));
};
const computeProgress = (y) => {
  for (let i = 0; i < stageTops.length - 1; i++) {
    if (y < stageTops[i + 1]) return i + (y - stageTops[i]) / Math.max(1, stageTops[i + 1] - stageTops[i]);
  }
  return stageTops.length - 1 + (y - stageTops[stageTops.length - 1]) / (window.innerHeight || 1);
};
let scrollQueued = false;
const updateProgress = () => {
  scrollQueued = false;
  const progress = computeProgress(window.scrollY);
  control.progress = progress;
  document.body.classList.toggle('in-content', progress > 3.75);
  setBgStage(progress > 3.3 ? 3 : progress > 1.55 ? 2 : progress > 0.7 ? 1 : 0);
};
const queueProgress = () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateProgress); } };
window.addEventListener('scroll', queueProgress, { passive: true });
new ResizeObserver(() => { measureStages(); queueProgress(); }).observe(document.body);
updateProgress();

/* ================= Reveal (IntersectionObserver) ================= */
const io = new IntersectionObserver((entries) => {
  for (const en of entries) {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }
}, { threshold: 0.2 });
const observeReveals = () => document.querySelectorAll('.reveal:not(.in), .reveal-up:not(.in)').forEach(el => io.observe(el));

/* ================= Project video: play only while visible ================= */
{
  const vid = document.querySelector('.cover-itpt video');
  if (vid && !reduceMotion) {
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting) vid.play().catch(() => {}); else vid.pause();
    }, { threshold: 0.35 }).observe(vid);
  }
}

/* ================= Drawer ================= */
const scrim = document.getElementById('scrim');
const openDrawer = () => { drawerOpen = true; drawerEl.classList.add('open'); scrim.classList.add('open'); drawerEl.setAttribute('aria-hidden', 'false'); document.getElementById('close-controls').focus(); };
function closeDrawer() { drawerOpen = false; drawerEl.classList.remove('open'); scrim.classList.remove('open'); drawerEl.setAttribute('aria-hidden', 'true'); }
document.getElementById('open-controls').addEventListener('click', openDrawer);
document.getElementById('close-controls').addEventListener('click', closeDrawer);
scrim.addEventListener('click', closeDrawer);
window.addEventListener('keydown', e => { if (e.key === 'Escape' && drawerOpen) closeDrawer(); });

/* ================= WebGL scene ================= */
const sceneContainer = document.getElementById('scene');

function createGravityScene(container, ballColor, onReady) {
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, 0, 11);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const hemiLight = new THREE.HemisphereLight(0xffffff, new THREE.Color(ballColor), 1.6);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
  keyLight.position.set(-6, 10, 8);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 30;
  keyLight.shadow.camera.left = -8;
  keyLight.shadow.camera.right = 8;
  keyLight.shadow.camera.top = 8;
  keyLight.shadow.camera.bottom = -8;
  keyLight.shadow.bias = -0.0003;
  keyLight.shadow.radius = 12.0;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 1.25);
  rimLight.position.set(8, 7, -8);
  scene.add(rimLight);

  const frontLight = new THREE.DirectionalLight(0xffffff, 0.4);
  frontLight.position.set(0, 0, 11);
  scene.add(frontLight);

  const sideBounceLight = new THREE.DirectionalLight(0xffffff, 0.3);
  sideBounceLight.position.set(-9, -2, 4);
  scene.add(sideBounceLight);

  // --- Viewport frustum bounds ---
  let viewportWidth = 10;
  let viewportHeight = 6;
  const updateFrustumBounds = () => {
    const fovRad = THREE.MathUtils.degToRad(camera.fov);
    viewportHeight = 2 * Math.tan(fovRad / 2) * camera.position.z;
    viewportWidth = viewportHeight * (container.clientWidth / container.clientHeight);
  };
  updateFrustumBounds();

  const isMobile = window.innerWidth < 768;
  const ballCount = isMobile ? 64 : 104;

  // --- Palette ---
  const getDynamicColors = (baseColor) => {
    const hex = baseColor.toLowerCase();
    if (hex === '#e1fc03') {
      return { pastel: new THREE.Color('#FBFFE2'), light: new THREE.Color('#EFFE69'),
        medium: new THREE.Color('#E1FC03'), deep: new THREE.Color('#B1E200'), glass: new THREE.Color('#DCFF32') };
    } else if (hex === '#ffc5c2' || hex === '#ffa19e') {
      return { pastel: new THREE.Color('#FFF5F4'), light: new THREE.Color('#FFECEB'),
        medium: new THREE.Color('#FFA6B3'), deep: new THREE.Color('#FF4D6D'), glass: new THREE.Color('#FFA6B3') };
    } else if (hex === '#96e5ff') {
      return { pastel: new THREE.Color('#F0F9FF'), light: new THREE.Color('#C9F1FF'),
        medium: new THREE.Color('#96E5FF'), deep: new THREE.Color('#2BA5FF'), glass: new THREE.Color('#98E4FF') };
    } else if (hex === '#2f69ff') {
      return { pastel: new THREE.Color('#ECEFFF'), light: new THREE.Color('#A8C1FF'),
        medium: new THREE.Color('#2F69FF'), deep: new THREE.Color('#0A33BF'), glass: new THREE.Color('#4D80FF') };
    }
    const c = new THREE.Color(baseColor);
    return { pastel: c.clone().offsetHSL(0, -0.15, 0.25), light: c.clone().offsetHSL(0, -0.05, 0.12),
      medium: c.clone(), deep: c.clone().offsetHSL(0.01, 0.1, -0.12), glass: c.clone() };
  };

  const palette = getDynamicColors(ballColor);
  const palHero = palette;
  const palLime = getDynamicColors('#E1FC03');
  const palPink = getDynamicColors('#FFC5C2');
  const ROLES = ['pastel', 'light', 'medium', 'deep', 'glass'];
  const curPal = { pastel: new THREE.Color(), light: new THREE.Color(), medium: new THREE.Color(),
    deep: new THREE.Color(), glass: new THREE.Color() };

  // --- Spheres ---
  const sphereGeometry = new THREE.SphereGeometry(1, 48, 48);
  const balls = [];
  for (let i = 0; i < ballCount; i++) {
    let radius;
    const rand = Math.random();
    if (rand < 0.3) radius = 0.27 + Math.random() * 0.12;
    else if (rand < 0.8) radius = 0.42 + Math.random() * 0.18;
    else radius = 0.66 + Math.random() * 0.21;
    if (isMobile) radius *= 0.8;

    const mass = Math.pow(radius, 3);
    let sphereMat;
    let role = 'medium';
    const isGlass = Math.random() < 0.22;

    if (isGlass) {
      sphereMat = new THREE.MeshPhysicalMaterial({
        color: palette.glass, roughness: 0.08, metalness: 0.0,
        clearcoat: 1.0, clearcoatRoughness: 0.03, transmission: 0.95,
        ior: 1.485, thickness: 2.2,
        specularColor: new THREE.Color('#ffffff'), specularIntensity: 1.0,
        attenuationColor: palette.pastel, attenuationDistance: 1.0,
        emissive: palette.glass, emissiveIntensity: 0.12,
        transparent: true,
      });
      role = 'glass';
    } else {
      const colorRand = Math.random();
      if (colorRand < 0.25) role = 'pastel';
      else if (colorRand < 0.55) role = 'light';
      else if (colorRand < 0.85) role = 'medium';
      else role = 'deep';
      sphereMat = new THREE.MeshPhysicalMaterial({
        color: palette[role], roughness: 0.44, metalness: 0.0,
        clearcoat: 0.24, clearcoatRoughness: 0.35,
        emissive: palette[role], emissiveIntensity: 0.08,
        transparent: true,
      });
    }

    const group = new THREE.Group();
    const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMat);
    sphereMesh.scale.setScalar(radius);
    sphereMesh.castShadow = true;
    sphereMesh.receiveShadow = true;
    group.add(sphereMesh);
    scene.add(group);

    balls.push({
      id: i, radius, mass,
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      meshGroup: group, sphere: sphereMesh, material: sphereMat, role, isGlass,
      visualScale: radius,
      shapeTarget: new THREE.Vector3(),
      shapeRadius: radius,
      sizeJitter: 0.85 + Math.random() * 0.3,
    });
  }

  // --- Shape targets: sample the glyph "</>" from an offscreen canvas ---
  // Centroidal Voronoi relaxation spreads the balls evenly along the strokes, and
  // every ball shrinks to a common radius so the glyph reads cleanly.
  const sampleGlyph = (text, n) => {
    const W = 520, H = 260;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d', { willReadFrequently: true });
    g.fillStyle = '#000';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `700 ${Math.round(H * 0.82)}px "Space Grotesk", "Arial Black", "Helvetica Neue", sans-serif`;
    g.fillText(text, W / 2, H / 2);
    const data = g.getImageData(0, 0, W, H).data;
    const xs = [], ys = [];
    let minX = W, maxX = 0, minY = H, maxY = 0;
    for (let y = 0; y < H; y += 2) {
      for (let x = 0; x < W; x += 2) {
        if (data[(y * W + x) * 4 + 3] > 140) {
          xs.push(x); ys.push(y);
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
    }
    if (xs.length < n * 3) return null;
    const step = Math.max(1, Math.floor(xs.length / 2600));
    const sx = [], sy = [];
    for (let i = 0; i < xs.length; i += step) { sx.push(xs[i]); sy.push(ys[i]); }
    const m = sx.length;
    const cx = new Float64Array(n), cy = new Float64Array(n);
    for (let k = 0; k < n; k++) { const j = (Math.random() * m) | 0; cx[k] = sx[j]; cy[k] = sy[j]; }
    const ax = new Float64Array(n), ay = new Float64Array(n), cnt = new Uint32Array(n);
    for (let it = 0; it < 10; it++) {
      ax.fill(0); ay.fill(0); cnt.fill(0);
      for (let j = 0; j < m; j++) {
        let best = 0, bd = Infinity;
        for (let k = 0; k < n; k++) {
          const dx = sx[j] - cx[k], dy = sy[j] - cy[k];
          const d = dx * dx + dy * dy;
          if (d < bd) { bd = d; best = k; }
        }
        ax[best] += sx[j]; ay[best] += sy[j]; cnt[best]++;
      }
      for (let k = 0; k < n; k++) {
        if (cnt[k]) { cx[k] = ax[k] / cnt[k]; cy[k] = ay[k] / cnt[k]; }
        else { const j = (Math.random() * m) | 0; cx[k] = sx[j]; cy[k] = sy[j]; }
      }
    }
    return { cx, cy, minX, maxX, minY, maxY, areaPx: xs.length * 4 };
  };

  const inHeart = (x, y) => { const a = x * x + y * y - 1; return a * a * a - x * x * y * y * y <= 0; };
  const assignHeartTargets = () => {   // fallback if canvas sampling fails
    const S = Math.min(viewportWidth * 0.30, viewportHeight * 0.27);
    const meanRadius = balls.reduce((s, b) => s + b.radius, 0) / balls.length;
    const scale = Math.max(0.3, Math.min(1, (S * 0.45 / 2.3) / meanRadius));
    for (const b of balls) {
      let x = 0, y = 0, tries = 0;
      do { x = (Math.random() * 2 - 1) * 1.25; y = Math.random() * 2.55 - 1.4; tries++; } while (!inHeart(x, y) && tries < 60);
      b.shapeTarget.set(x * S, (y + 0.12) * S - viewportHeight * 0.03, (Math.random() - 0.5) * 0.35);
      b.shapeRadius = b.radius * scale;
    }
  };

  const assignShapeTargets = () => {
    let s;
    try { s = sampleGlyph(SHAPE_TEXT, balls.length); } catch (e) { s = null; }
    if (!s) { assignHeartTargets(); return; }
    const narrow = viewportWidth < viewportHeight;
    const boxW = viewportWidth * (narrow ? 0.9 : 0.58);
    const boxH = viewportHeight * (narrow ? 0.34 : 0.42);
    const bw = s.maxX - s.minX || 1, bh = s.maxY - s.minY || 1;
    const k = Math.min(boxW / bw, boxH / bh);
    const midX = (s.minX + s.maxX) / 2, midY = (s.minY + s.maxY) / 2;
    const area = s.areaPx * k * k;
    const rShape = Math.sqrt((0.66 * area) / (balls.length * Math.PI));
    // Shuffle so neighbouring balls in the drop pile don't map to neighbouring points.
    const order = balls.map((_, i) => i).sort(() => Math.random() - 0.5);
    order.forEach((bi, i) => {
      const b = balls[bi];
      b.shapeTarget.set((s.cx[i] - midX) * k, -(s.cy[i] - midY) * k + viewportHeight * 0.02, (Math.random() - 0.5) * 0.3);
      b.shapeRadius = rShape * b.sizeJitter;
    });
  };
  assignShapeTargets();
  if (document.fonts && document.fonts.load) {
    document.fonts.load('700 100px "Space Grotesk"', SHAPE_TEXT).then(assignShapeTargets).catch(() => {});
  }

  // --- Entrance scatter ---
  const scatterFar = (withInwardVelocity) => {
    const R = Math.max(viewportWidth, viewportHeight) * 1.5;
    for (const b of balls) {
      const a = Math.random() * Math.PI * 2;
      const px = Math.cos(a) * R * 1.25;
      const py = Math.sin(a) * R * 0.85;
      const pz = (Math.random() - 0.5) * 4;
      b.position.set(px, py, pz);
      b.meshGroup.position.copy(b.position);
      if (withInwardVelocity) b.velocity.set(-px, -py, -pz).normalize().multiplyScalar(0.08 + Math.random() * 0.05);
      else b.velocity.set(0, 0, 0);
    }
  };
  scatterFar(false); // parked off-screen until the loader reveals

  // --- Simulation parameters & mouse projection ---
  const params = {
    rebound: -0.3,
    mouseRepelForce: 0.05, mouseRepelRadius: 4.4,
    centerAttractForce: 0.0035, bounciness: 0.02,
  };

  const mouseProjVec = new THREE.Vector3();
  const mouseWorld3D = new THREE.Vector3();
  const updateMouse3D = () => {
    mouseProjVec.set(mousePos.x, mousePos.y, 0.5);
    mouseProjVec.unproject(camera);
    const dir = mouseProjVec.sub(camera.position).normalize();
    const distance = -camera.position.z / dir.z;
    mouseWorld3D.copy(camera.position).add(dir.multiplyScalar(distance));
  };

  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const smoothstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  // --- Animation / physics loop ---
  let animationFrameId = 0;
  const clock = new THREE.Clock();
  let localStarted = false;
  let entranceStart = 0;
  let reportedReady = false;
  let parked = false;

  const diffVec = new THREE.Vector3();
  const collideDiff = new THREE.Vector3();
  const relVel = new THREE.Vector3();
  const deltaPos = new THREE.Vector3();
  const rotAxis = new THREE.Vector3();
  const prevMouseWorld = new THREE.Vector3();
  let mouseSpeed = 0;

  const simulateAndRender = () => {
    animationFrameId = requestAnimationFrame(simulateAndRender);
    const time = clock.getElapsedTime();
    updateMouse3D();

    if (control.started && !localStarted) {
      localStarted = true;
      entranceStart = time;
      scatterFar(true);
    }
    if (!localStarted) {
      renderer.render(scene, camera);
      if (!reportedReady) { reportedReady = true; onReady(); }
      return;
    }

    const progress = control.progress;

    // Past the scene every ball has flown behind the camera: stop simulating.
    if (parked) {
      if (progress > 3.5) return;
      parked = false;
    }

    // --- mode blend factors ---
    const heroF = 1 - smoothstep(0.30, 0.80, progress);
    const dropRaw = smoothstep(0.40, 0.95, progress);
    const flyF = smoothstep(2.7, 3.45, progress);
    const shapeF = smoothstep(1.40, 2.05, progress) * (1 - smoothstep(2.55, 3.0, progress));
    const dropF = dropRaw * (1 - smoothstep(1.25, 1.75, progress));

    // --- scroll-driven palette morph: hero → volt-lime → rose-pink ---
    const bLime = smoothstep(0.55, 1.05, progress);
    const bPink = smoothstep(1.40, 1.95, progress);
    for (const role of ROLES) curPal[role].copy(palHero[role]).lerp(palLime[role], bLime).lerp(palPink[role], bPink);
    hemiLight.groundColor.copy(curPal.medium);

    const entranceT = easeOutCubic(clamp01((time - entranceStart) / 2.2));
    const attractionBoost = lerp(7.5, 1, entranceT);

    const isMouseInteracting = Math.abs(mousePos.x) < 0.99 || Math.abs(mousePos.y) < 0.99;
    mouseSpeed = isMouseInteracting ? Math.min(3, mouseWorld3D.distanceTo(prevMouseWorld)) : 0;
    prevMouseWorld.copy(mouseWorld3D);

    let damping = 0.91;
    damping = lerp(damping, 0.992, dropF);
    damping = lerp(damping, 0.90, shapeF);
    damping = lerp(damping, 0.985, flyF);

    const camZ = camera.position.z;
    const clusterActive = Math.max(heroF, entranceT < 1 ? 1 : 0);
    let allGone = flyF > 0.98;

    // 1. ACCELERATIONS
    for (let i = 0; i < balls.length; i++) {
      const b = balls[i];

      if (heroF > 0.01) {
        b.velocity.x += Math.sin(time * 0.4 + b.id * 1.5) * 0.0004 * b.radius * heroF;
        b.velocity.y += Math.cos(time * 0.5 + b.id * 1.2) * 0.0004 * b.radius * heroF;
        b.velocity.z += Math.sin(time * 0.35 + b.id) * 0.0001 * heroF;
      }

      const clusterStrength = params.centerAttractForce * attractionBoost * clusterActive;
      if (clusterStrength > 0.00001) {
        b.velocity.x += (0 - b.position.x) * clusterStrength * 0.38;
        b.velocity.y += (0 - b.position.y) * clusterStrength * 1.85;
        b.velocity.z += (0 - b.position.z) * clusterStrength * 1.8;
      }

      if (dropF > 0.001) b.velocity.y -= 0.011 * dropF;

      if (shapeF > 0.001) {
        const k = 0.06 * shapeF;
        b.velocity.x += (b.shapeTarget.x - b.position.x) * k;
        b.velocity.y += (b.shapeTarget.y - b.position.y) * k;
        b.velocity.z += (b.shapeTarget.z - b.position.z) * k;
      }

      if (flyF > 0.001) {
        const stagger = (b.id * 0.6180339887) % 1;
        const local = smoothstep(stagger * 0.55, stagger * 0.55 + 0.45, flyF);
        b.velocity.z += 0.05 * local;
        b.velocity.x += b.position.x * 0.006 * local;
        b.velocity.y += b.position.y * 0.006 * local;
      }

      if (isMouseInteracting) {
        diffVec.subVectors(b.position, mouseWorld3D);
        const rawDist = diffVec.length();
        const down = mousePos.isDown;
        const activeRepelRadius = down ? params.mouseRepelRadius * 1.4 : params.mouseRepelRadius;
        const activeRepelForce = down ? params.mouseRepelForce * 1.7 : params.mouseRepelForce;
        if (rawDist < activeRepelRadius && rawDist > 0.0001) {
          const ratio = rawDist / activeRepelRadius;
          const smoothFactor = 1.0 - (ratio * ratio * (3.0 - 2.0 * ratio));
          const push = smoothFactor * activeRepelForce * (1 + mouseSpeed * 3.2);
          diffVec.normalize();
          diffVec.z *= 0.12;
          diffVec.normalize();
          b.velocity.addScaledVector(diffVec, push);
        }
      }

      b.velocity.multiplyScalar(damping);
      b.position.addScaledVector(b.velocity, 1);

      // Keep flown-away balls just behind the lens so scrolling back up is quick.
      if (b.position.z > camZ + 1.5) {
        b.position.z = camZ + 1.5;
        if (b.velocity.z > 0) b.velocity.z = 0;
        b.velocity.x *= 0.8; b.velocity.y *= 0.8;
      }

      const c = b.isGlass ? curPal.glass : curPal[b.role];
      b.material.color.copy(c);
      b.material.emissive.copy(c);

      b.material.opacity = flyF > 0.001 ? 1 - smoothstep(camZ - 2.6, camZ - 0.3, b.position.z) : 1;
      if (b.material.opacity > 0.002) allGone = false;

      const targetVis = lerp(b.radius, b.shapeRadius, shapeF);
      b.visualScale += (targetVis - b.visualScale) * 0.12;
      b.sphere.scale.setScalar(b.visualScale);
    }

    // 2. PAIRWISE COLLISIONS (nearly disabled in shape mode so balls snap onto the glyph)
    const collideScale = 0.28 * (1 - 0.93 * shapeF) * (1 - flyF);
    if (collideScale > 0.0005) {
      for (let step = 0; step < 4; step++) {
        for (let i = 0; i < balls.length; i++) {
          for (let j = i + 1; j < balls.length; j++) {
            const b1 = balls[i];
            const b2 = balls[j];
            collideDiff.subVectors(b2.position, b1.position);
            const dist = collideDiff.length();
            const minDist = b1.visualScale + b2.visualScale;
            if (dist < minDist && dist > 0.001) {
              const overlap = minDist - dist;
              collideDiff.multiplyScalar(1 / dist);
              const totalMass = b1.mass + b2.mass;
              b1.position.addScaledVector(collideDiff, -overlap * (b2.mass / totalMass) * collideScale);
              b2.position.addScaledVector(collideDiff, overlap * (b1.mass / totalMass) * collideScale);
              relVel.subVectors(b2.velocity, b1.velocity);
              const velAlongNormal = relVel.dot(collideDiff);
              if (velAlongNormal < -0.0001) {
                const impulse = -(1 + params.bounciness) * velAlongNormal / (1 / b1.mass + 1 / b2.mass);
                b1.velocity.addScaledVector(collideDiff, -impulse / b1.mass);
                b2.velocity.addScaledVector(collideDiff, impulse / b2.mass);
              }
            }
          }
        }
      }
    }

    // 3. VIEWPORT WALLS + BOUNCY FLOOR
    const xBound = viewportWidth / 2 - 0.2;
    const topY = viewportHeight / 2 - 0.05;
    const floorY = -viewportHeight / 2 + 0.05;
    const zBound = 2.0;
    const restitution = 0.30 + 0.35 * dropF;
    const contain = flyF < 0.5;
    const zContain = flyF < 0.02;

    for (let i = 0; i < balls.length; i++) {
      const b = balls[i];
      const r = b.visualScale;
      if (contain) {
        if (b.position.x < -xBound - r) { b.position.x = -xBound - r; b.velocity.x *= params.rebound; }
        else if (b.position.x > xBound + r) { b.position.x = xBound + r; b.velocity.x *= params.rebound; }
        if (b.position.y - r < floorY) {
          b.position.y = floorY + r;
          if (b.velocity.y < 0) b.velocity.y = -b.velocity.y * restitution;
          if (dropF > 0.3) { b.velocity.x *= 0.86; b.velocity.z *= 0.86; }
        }
        if (b.position.y + r > topY) {
          b.position.y = topY - r;
          if (b.velocity.y > 0) b.velocity.y *= params.rebound;
        }
      }
      if (zContain) {
        if (b.position.z < -zBound) { b.position.z = -zBound; b.velocity.z *= params.rebound; }
        else if (b.position.z > zBound) { b.position.z = zBound; b.velocity.z *= params.rebound; }
      }

      deltaPos.copy(b.position).sub(b.meshGroup.position);
      if (deltaPos.lengthSq() > 0.000001) {
        rotAxis.set(deltaPos.y, -deltaPos.x, 0).normalize();
        b.meshGroup.rotateOnWorldAxis(rotAxis, (deltaPos.length() / b.radius) * 0.95);
      }
      b.meshGroup.position.copy(b.position);
    }

    renderer.render(scene, camera);
    if (!reportedReady) { reportedReady = true; onReady(); }
    if (allGone && progress > 3.5) parked = true;
  };

  simulateAndRender();

  // --- Resize ---
  const handleResize = () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    updateFrustumBounds();
    assignShapeTargets();
  };
  const ro = new ResizeObserver(handleResize);
  ro.observe(container);

  // --- Teardown (used when the palette re-keys the scene) ---
  return () => {
    cancelAnimationFrame(animationFrameId);
    ro.disconnect();
    for (const b of balls) b.material.dispose();
    sphereGeometry.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };
}

/* ================= Theme selection (re-keys the scene) ================= */
const DEFAULT_THEME = 'royalBlue';
const THEME_KEY = 'jiseok-portfolio-theme';
let selectedTheme = null;
let disposeScene = null;
let sceneReady = false;

const mountScene = (color) => {
  if (disposeScene) disposeScene();
  disposeScene = createGravityScene(sceneContainer, color, () => { sceneReady = true; });
};

const setTheme = (id) => {
  const t = THEMES.find(x => x.id === id) || THEMES[0];
  themesEl.querySelectorAll('.theme').forEach(el => el.classList.toggle('sel', el.dataset.id === t.id));
  bgLayers[0].style.background = t.heroBg;
  try { localStorage.setItem(THEME_KEY, t.id); } catch (e) {}
  if (t.id === selectedTheme && disposeScene) return;
  selectedTheme = t.id;
  mountScene(t.ballColor);
};
themesEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.theme');
  if (btn) setTheme(btn.dataset.id);
});
document.getElementById('reset-theme').addEventListener('click', () => setTheme(DEFAULT_THEME));

let savedTheme = DEFAULT_THEME;
try { savedTheme = localStorage.getItem(THEME_KEY) || DEFAULT_THEME; } catch (e) {}
try {
  setTheme(savedTheme);
} catch (err) {
  // No WebGL (or the context could not be created): show the page without the scene.
  console.warn('[gravity] scene disabled:', err);
  smooth.locked = false;
  window.__gravityReveal(true);
  throw err;
}

/* ================= Loader ================= */
const loader = document.getElementById('loader');
const loaderFill = document.getElementById('loader-fill');
const loaderCount = document.getElementById('loader-count');
const loaderStatus = document.getElementById('loader-status');
let loadValue = 0;
let loadLast = performance.now();
let leaving = false;

const onLoaderDone = () => {
  control.started = true;                       // releases the fly-in
  window.__gravityReveal(false);                // header + hero content in
  smooth.locked = false;
  observeReveals();
  measureStages();
  updateProgress();
};

if (lateStart) {
  document.documentElement.classList.remove('no-scene');
  control.started = true;
  observeReveals();
} else {
  const loaderTick = (now) => {
    const dt = Math.min((now - loadLast) / 1000, 0.05);
    loadLast = now;
    if (!sceneReady) loadValue += (92 - loadValue) * 1.7 * dt;
    else {
      loadValue += (100 - loadValue) * 6 * dt;
      if (loadValue >= 99.4) loadValue = 100;
    }
    loaderFill.style.width = loadValue.toFixed(2) + '%';
    loaderCount.textContent = String(Math.floor(loadValue)).padStart(3, '0') + '%';
    loaderStatus.textContent = loadValue < 100 ? 'Calibrating gravity field' : 'Entering orbit';

    if (loadValue >= 99.9 && sceneReady) {
      if (!leaving) {
        leaving = true;
        setTimeout(() => loader.classList.add('leaving'), 140);
        setTimeout(onLoaderDone, 140 + 520);
      }
      return;
    }
    requestAnimationFrame(loaderTick);
  };
  requestAnimationFrame(loaderTick);
}
