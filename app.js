
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const degToRad = THREE.MathUtils.degToRad;

const state = {
  iconType: 'inner',
  innerDirection: 'right',
  outerDirection: 'cw',
  angle: 90,
  speed: 1,
  sequence: [],
  mode: 'observe',
  animating: false,
  startQuaternion: new THREE.Quaternion(),
  lastAnimation: null
};

const host = $('#sceneHost');
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xeaf2fb, 18, 38);

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(0, 0.9, -14.5);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
host.appendChild(renderer.domElement);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.target.set(0, -0.15, 0);
orbit.minDistance = 7;
orbit.maxDistance = 25;
orbit.maxPolarAngle = Math.PI * .92;

const transform = new TransformControls(camera, renderer.domElement);
transform.setMode('rotate');
transform.setSpace('local');
transform.setSize(.82);
transform.addEventListener('dragging-changed', e => {
  orbit.enabled = !e.value && state.mode !== 'locked';
  if (!e.value) {
    state.startQuaternion.copy(carRoot.quaternion);
    updateVisualizer();
  }
});
scene.add(transform.getHelper());

scene.add(new THREE.HemisphereLight(0xffffff, 0xa7b6ca, 2.2));
const key = new THREE.DirectionalLight(0xffffff, 3.0);
key.position.set(7, 12, 8);
key.castShadow = true;
scene.add(key);
const fill = new THREE.DirectionalLight(0xbcd4ff, 1.5);
fill.position.set(-9, 6, -7);
scene.add(fill);

const grid = new THREE.GridHelper(36, 36, 0xa9bed8, 0xd5e1ef);
grid.position.y = -1.42;
grid.material.transparent = true;
grid.material.opacity = .62;
scene.add(grid);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(42, 42),
  new THREE.ShadowMaterial({ color: 0x6f829c, opacity: .18 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1.43;
ground.receiveShadow = true;
scene.add(ground);

const carRoot = new THREE.Group();
carRoot.position.set(0, -0.45, 0);
scene.add(carRoot);

function addMesh(geo, mat, x=0,y=0,z=0){
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x,y,z);
  m.castShadow = true;
  m.receiveShadow = true;
  carRoot.add(m);
  return m;
}
function material(color, metalness=.25, roughness=.35){
  return new THREE.MeshStandardMaterial({ color, metalness, roughness });
}
const red = material(0x2f8cff,.52,.20);
const redDark = material(0x0c55bd,.44,.22);
const dark = material(0x080d15,.58,.17);
const tire = material(0x0c1016,.05,.72);
const chrome = material(0xe1e9f2,.96,.12);
const light = new THREE.MeshStandardMaterial({ color:0xffffff, emissive:0xcfe3ff, emissiveIntensity:1.8, roughness:.18 });
const tail = new THREE.MeshStandardMaterial({ color:0xff3b30, emissive:0xff1f20, emissiveIntensity:1.4 });
const glass = new THREE.MeshPhysicalMaterial({ color:0x10243d, metalness:.08, roughness:.05, transparent:true, opacity:.86, clearcoat:1, clearcoatRoughness:.06 });

addMesh(new THREE.BoxGeometry(2.9,.72,5.25), red, 0,-.18,0);
addMesh(new THREE.BoxGeometry(2.55,.38,1.15), redDark, 0,.18,-2.05);
addMesh(new THREE.BoxGeometry(2.45,1.05,2.65), red, 0,.54,.15);
addMesh(new THREE.BoxGeometry(2.22,.82,.08), glass,0,.62,-1.18).rotation.x = -.18;
addMesh(new THREE.BoxGeometry(2.22,.82,.08), glass,0,.62,1.32).rotation.x = .18;
addMesh(new THREE.BoxGeometry(.08,.7,1.7), glass,-1.23,.60,.08);
addMesh(new THREE.BoxGeometry(.08,.7,1.7), glass,1.23,.60,.08);
addMesh(new THREE.BoxGeometry(1.75,.07,1.4), dark,0,1.09,.15);
addMesh(new THREE.BoxGeometry(.68,.22,.08), light,-.82,-.18,-2.66);
addMesh(new THREE.BoxGeometry(.68,.22,.08), light,.82,-.18,-2.66);
addMesh(new THREE.BoxGeometry(.72,.20,.08), tail,-.82,-.18,2.66);
addMesh(new THREE.BoxGeometry(.72,.20,.08), tail,.82,-.18,2.66);
addMesh(new THREE.BoxGeometry(1.35,.20,.06), dark,0,-.42,-2.69);

for (const x of [-1.52, 1.52]) {
  for (const z of [-1.58, 1.58]) {
    const t = addMesh(new THREE.CylinderGeometry(.53,.53,.34,28), tire, x,-.44,z);
    t.rotation.z = Math.PI / 2;
    const r = addMesh(new THREE.CylinderGeometry(.29,.29,.36,20), chrome, x,-.44,z);
    r.rotation.z = Math.PI / 2;
  }
}
const noseMarker = addMesh(
  new THREE.ConeGeometry(.24,.6,3),
  new THREE.MeshStandardMaterial({color:0x1769ff, emissive:0x0d3c99, emissiveIntensity:.3}),
  0,.18,-3.25
);
noseMarker.rotation.x = -Math.PI / 2;
state.startQuaternion.copy(carRoot.quaternion);

const ghostCar = carRoot.clone(true);
ghostCar.traverse((o) => {
  if (o.isMesh) {
    o.material = o.material.clone();
    o.material.transparent = true;
    o.material.opacity = .14;
    o.material.depthWrite = false;
  }
});
scene.add(ghostCar);

const axisGroup = new THREE.Group();
const protractorGroup = new THREE.Group();
scene.add(axisGroup, protractorGroup);

function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}
function makeTextSprite(text, options={}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const scale = 2;
  const fontSize = options.fontSize || 46;
  const padX = 22, padY = 14;
  ctx.font = `800 ${fontSize}px Inter, Arial, sans-serif`;
  const w = Math.ceil(ctx.measureText(text).width + padX * 2);
  const h = Math.ceil(fontSize + padY * 2);
  canvas.width = w * scale;
  canvas.height = h * scale;
  ctx.scale(scale, scale);
  ctx.font = `800 ${fontSize}px Inter, Arial, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillStyle = options.background || 'rgba(23,105,255,.95)';
  roundRect(ctx, 0, 0, w, h, 13);
  ctx.fill();
  ctx.fillStyle = options.color || '#ffffff';
  ctx.fillText(text, w / 2, h / 2 + 1);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  const height = options.worldHeight || .48;
  spr.scale.set(height * (w / h), height, 1);
  return spr;
}

const markerGroup = new THREE.Group();
scene.add(markerGroup);
const noseArrow = new THREE.ArrowHelper(new THREE.Vector3(0,0,-1), new THREE.Vector3(), 4.0, 0x1769ff, .42, .24);
const roofArrow = new THREE.ArrowHelper(new THREE.Vector3(0,1,0), new THREE.Vector3(), 3.0, 0x10a5a0, .42, .24);
markerGroup.add(noseArrow, roofArrow);
const noseLabel = makeTextSprite('NEZ', { worldHeight: .42, background:'rgba(23,105,255,.95)' });
const roofLabel = makeTextSprite('TOIT', { worldHeight: .42, background:'rgba(16,165,160,.95)' });
markerGroup.add(noseLabel, roofLabel);

function clearGroup(g){
  while(g.children.length){
    const c = g.children.pop();
    c.geometry?.dispose?.();
    if (c.material) {
      if (Array.isArray(c.material)) c.material.forEach(m => m.dispose?.());
      else c.material.dispose?.();
    }
  }
}

function buildPlanRuler(){
  const ticks = $('#rulerTicks');
  if(!ticks) return;
  ticks.innerHTML = '';

  for(let d=0; d<=360; d+=15){
    const tick = document.createElement('div');
    tick.className = 'ruler-tick';
    if(d % 90 === 0) tick.classList.add('major');
    else if(d % 45 === 0) tick.classList.add('mid');
    tick.dataset.degree = d;

    const label = document.createElement('div');
    label.className = 'ruler-tick-label';
    label.dataset.degree = d;
    label.textContent = (d % 45 === 0) ? `${d}°` : '';

    ticks.appendChild(tick);
    ticks.appendChild(label);
  }
}

function updatePlanRuler(progressDeg = 0){
  const ruler = $('#planRuler');
  if(!ruler) return;

  const isPlan = state.iconType === 'inner';
  ruler.hidden = !isPlan;
  if(!isPlan) return;

  const vertical = state.innerDirection === 'up' || state.innerDirection === 'down';
  ruler.classList.toggle('vertical', vertical);
  ruler.classList.toggle('horizontal', !vertical);

  const reverse = state.innerDirection === 'up' || state.innerDirection === 'left';
  const padStart = vertical ? 18 : 20;
  const padEnd = vertical ? 18 : 20;
  const trackSize = vertical
    ? Math.max(1, ruler.clientHeight - padStart - padEnd)
    : Math.max(1, ruler.clientWidth - padStart - padEnd);

  const value = Math.max(0, Math.min(Number(progressDeg) || 0, 360));
  const ratio = value / 360;
  const pos = reverse
    ? padStart + trackSize * (1 - ratio)
    : padStart + trackSize * ratio;

  ruler.querySelectorAll('.ruler-tick').forEach(el => {
    const d = Number(el.dataset.degree);
    const r = d / 360;
    const p = reverse
      ? padStart + trackSize * (1 - r)
      : padStart + trackSize * r;

    el.style.top = vertical ? `${p}px` : '';
    el.style.left = vertical ? '' : `${p}px`;
  });

  ruler.querySelectorAll('.ruler-tick-label').forEach(el => {
    const d = Number(el.dataset.degree);
    const r = d / 360;
    const p = reverse
      ? padStart + trackSize * (1 - r)
      : padStart + trackSize * r;

    el.style.top = vertical ? `${p}px` : '';
    el.style.left = vertical ? '' : `${p}px`;
  });

  const marker = $('#rulerMarker');
  const progress = $('#rulerProgress');
  const markerValue = $('#rulerMarkerValue');
  markerValue.textContent = `${formatAngle(value)}°`;

  if(vertical){
    marker.style.top = `${pos}px`;
    marker.style.left = '';

    const start = reverse ? padStart + trackSize : padStart;
    const top = Math.min(start, pos);
    progress.style.top = `${top}px`;
    progress.style.height = `${Math.abs(pos - start)}px`;
    progress.style.left = '';
    progress.style.width = '';
  } else {
    marker.style.left = `${pos}px`;
    marker.style.top = '';

    const start = reverse ? padStart + trackSize : padStart;
    const left = Math.min(start, pos);
    progress.style.left = `${left}px`;
    progress.style.width = `${Math.abs(pos - start)}px`;
    progress.style.top = '';
    progress.style.height = '';
  }
}

function getScreenBasis(){
  camera.updateMatrixWorld(true);

  // Repère écran exprimé dans le monde 3D.
  const right = new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion).normalize();
  const up = new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion).normalize();

  // "out" pointe de l'écran vers l'observateur.
  const forwardIntoScene = new THREE.Vector3();
  camera.getWorldDirection(forwardIntoScene).normalize();
  const out = forwardIntoScene.clone().negate();

  return { right, up, out };
}

function resolveInstruction(config = {}, frozenBasis = null){
  const iconType = config.iconType ?? state.iconType;
  const innerDirection = config.innerDirection ?? state.innerDirection;
  const outerDirection = config.outerDirection ?? state.outerDirection;
  const basis = frozenBasis || getScreenBasis();

  let axisWorld;
  let refWorld;
  let sign;
  let axisLabel;
  let symbol;

  if(iconType === 'outer'){
    // Flèche extérieure : rotation autour de la normale à l'écran.
    axisWorld = basis.out.clone();
    refWorld = basis.right.clone();
    sign = outerDirection === 'ccw' ? 1 : -1;
    axisLabel = 'profondeur';
    symbol = outerDirection === 'ccw' ? '↺' : '↻';
  } else {
    // Flèche intérieure : l'axe est DANS l'écran et PERPENDICULAIRE à la flèche.
    // Convention : on part d'un point qui sortirait de l'écran vers l'observateur.
    // La rotation positive/négative le déplace dans le sens de la flèche.
    refWorld = basis.out.clone();

    if(innerDirection === 'right'){
      axisWorld = basis.up.clone();
      sign = 1;
      axisLabel = 'vertical';
      symbol = '→';
    } else if(innerDirection === 'left'){
      axisWorld = basis.up.clone();
      sign = -1;
      axisLabel = 'vertical';
      symbol = '←';
    } else if(innerDirection === 'down'){
      axisWorld = basis.right.clone();
      sign = 1;
      axisLabel = 'horizontal';
      symbol = '↓';
    } else {
      axisWorld = basis.right.clone();
      sign = -1;
      axisLabel = 'horizontal';
      symbol = '↑';
    }
  }

  return {
    iconType,
    innerDirection,
    outerDirection,
    axisWorld: axisWorld.normalize(),
    refWorld: refWorld.normalize(),
    sign,
    axisLabel,
    symbol,
    basis: {
      right: basis.right.clone(),
      up: basis.up.clone(),
      out: basis.out.clone()
    }
  };
}



function updateMarkers(){
  const q = carRoot.quaternion;
  const noseDir = new THREE.Vector3(0,0,-1).applyQuaternion(q).normalize();
  const roofDir = new THREE.Vector3(0,1,0).applyQuaternion(q).normalize();
  noseArrow.position.copy(carRoot.position);
  noseArrow.setDirection(noseDir);
  roofArrow.position.copy(carRoot.position);
  roofArrow.setDirection(roofDir);
  noseLabel.position.copy(noseDir).multiplyScalar(4.15).add(carRoot.position);
  roofLabel.position.copy(roofDir).multiplyScalar(3.2).add(carRoot.position);
}
function updateVisualizer(progressDeg = 0, resolvedOverride = null){
  ghostCar.quaternion.copy(state.startQuaternion);
  clearGroup(axisGroup);
  clearGroup(protractorGroup);

  const resolved = resolvedOverride || resolveInstruction();
  const axis = resolved.axisWorld.clone();
  const ref = resolved.refWorld.clone();

  // Référence exactement perpendiculaire à l'axe.
  ref.addScaledVector(axis, -ref.dot(axis)).normalize();
  const tangent = new THREE.Vector3().crossVectors(axis, ref).normalize();

  const axisLen = 10.2;
  const axisPts = [
    axis.clone().multiplyScalar(-axisLen/2),
    axis.clone().multiplyScalar(axisLen/2)
  ];
  const axisLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(axisPts),
    new THREE.LineDashedMaterial({ color:0x1769ff, dashSize:.22, gapSize:.12 })
  );
  axisLine.computeLineDistances();
  axisGroup.add(axisLine);
  axisGroup.add(new THREE.ArrowHelper(axis.clone(), axis.clone().multiplyScalar(axisLen/2-.7), .65, 0x1769ff, .25,.16));
  axisGroup.add(new THREE.ArrowHelper(axis.clone().negate(), axis.clone().multiplyScalar(-axisLen/2+.7), .65, 0x1769ff, .25,.16));

  const ringR = 4.55;
  const ringPts = [];
  for(let i=0;i<=180;i++){
    const a = (i/180) * Math.PI * 2;
    ringPts.push(
      ref.clone().multiplyScalar(Math.cos(a))
        .add(tangent.clone().multiplyScalar(Math.sin(a)))
        .multiplyScalar(ringR)
    );
  }
  protractorGroup.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(ringPts),
    new THREE.LineBasicMaterial({ color:0x89a7d1, transparent:true, opacity:.62 })
  ));

  const tickPts = [];
  for(let d=0; d<360; d+=5){
    const a = degToRad(d);
    const longTick = d % 45 === 0;
    const r1 = ringR - (longTick ? .25 : .11);
    const p1 = ref.clone().multiplyScalar(Math.cos(a))
      .add(tangent.clone().multiplyScalar(Math.sin(a))).multiplyScalar(r1);
    const p2 = ref.clone().multiplyScalar(Math.cos(a))
      .add(tangent.clone().multiplyScalar(Math.sin(a))).multiplyScalar(ringR);
    tickPts.push(p1,p2);
  }
  protractorGroup.add(new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(tickPts),
    new THREE.LineBasicMaterial({ color:0x5f789d, transparent:true, opacity:.65 })
  ));

  for(let d=0; d<360; d+=45){
    const a = degToRad(d);
    const p = ref.clone().multiplyScalar(Math.cos(a))
      .add(tangent.clone().multiplyScalar(Math.sin(a))).multiplyScalar(ringR+.48);
    const s = makeTextSprite(`${d}°`, {
      worldHeight:.34,
      background:'rgba(255,255,255,.88)',
      color:'#425574'
    });
    s.position.copy(p);
    protractorGroup.add(s);
  }

  const arcDeg = clamp(Number(state.angle),0,360);
  const arcPts = [];
  const segments = Math.max(4, Math.ceil(arcDeg/2));
  for(let i=0;i<=segments;i++){
    const d = resolved.sign * arcDeg * (i/segments);
    const a = degToRad(d);
    arcPts.push(
      ref.clone().multiplyScalar(Math.cos(a))
        .add(tangent.clone().multiplyScalar(Math.sin(a)))
        .multiplyScalar(ringR-.07)
    );
  }
  protractorGroup.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(arcPts),
    new THREE.LineBasicMaterial({ color:0x1769ff, transparent:true, opacity:.95 })
  ));

  const pd = resolved.sign * progressDeg;
  const pa = degToRad(pd);
  const markerPos = ref.clone().multiplyScalar(Math.cos(pa))
    .add(tangent.clone().multiplyScalar(Math.sin(pa))).multiplyScalar(ringR);

  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(.12,20,20),
    new THREE.MeshStandardMaterial({
      color:0xffffff,
      emissive:0x1769ff,
      emissiveIntensity:1.2
    })
  );
  marker.position.copy(markerPos);
  protractorGroup.add(marker);

  $('#axisReadout').textContent = resolved.axisLabel;

  axisGroup.visible = $('#toggleAxis').checked;

  const isPlanMode = state.iconType === 'inner';
  protractorGroup.visible = !isPlanMode && $('#toggleProtractor').checked;
  updatePlanRuler(progressDeg);

  markerGroup.visible = $('#toggleMarkers').checked;
  ghostCar.visible = $('#toggleGhost').checked;
}
function resetCamera(){
  camera.position.set(0, 0.9, -14.5);
  orbit.target.set(0, -0.15, 0);
  camera.up.set(0,1,0);
  camera.lookAt(orbit.target);
  orbit.update();
}
function setMode(mode){
  state.mode = mode;
  $('#manipulateBtn').classList.toggle('active', mode === 'manipulate');
  $('#lockBtn').classList.toggle('active', mode === 'locked');

  if(mode === 'manipulate'){
    transform.attach(carRoot);
    orbit.enabled = true;
    $('#dragTip').textContent = 'Manipuler · glissez le fond pour la caméra, utilisez les anneaux pour la voiture';
  } else {
    transform.detach();
    orbit.enabled = false;
    state.startQuaternion.copy(carRoot.quaternion);
    updateVisualizer();
    $('#dragTip').textContent = 'Position verrouillée · lancez la simulation';
  }
}
function resetCar(){
  stopAnimation();
  transform.detach();
  carRoot.position.set(0,-0.45,0);
  carRoot.quaternion.identity();
  state.startQuaternion.copy(carRoot.quaternion);
  ghostCar.position.copy(carRoot.position);
  ghostCar.quaternion.copy(carRoot.quaternion);
  $('#liveAngle').textContent = '0°';
  setMode('manipulate');
  resetCamera();
  updateVisualizer(0);
}
function formatAngle(v){
  const n = Number(v);
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ',');
}
function setIconType(type){
  state.iconType = type;

  $$('.icon-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.iconType === type);
  });

  const card = $('#rotationModeCard');
  card.classList.toggle('mode-inner', type === 'inner');
  card.classList.toggle('mode-outer', type === 'outer');

  syncControls();
  updateVisualizer();
}

function setInnerDirection(direction){
  state.innerDirection = direction;
  $$('.direction-arrow').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.innerDirection === direction);
  });
  syncControls();
  updateVisualizer();
}

function setOuterDirection(direction){
  state.outerDirection = direction;
  $$('.outer-arrow-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.outerDirection === direction);
  });
  syncControls();
  updateVisualizer();
}

function syncControls(){
  $$('.icon-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.iconType === state.iconType);
  });

  $$('.direction-arrow').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.innerDirection === state.innerDirection);
  });

  $$('.outer-arrow-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.outerDirection === state.outerDirection);
  });

  const card = $('#rotationModeCard');
  card.classList.toggle('mode-inner', state.iconType === 'inner');
  card.classList.toggle('mode-outer', state.iconType === 'outer');

  $('#angleSlider').value = state.angle;
  $('#angleInput').value = state.angle;
  $('#targetAngle').textContent = `${formatAngle(state.angle)}°`;

  const resolved = resolveInstruction();
  $('#axisLabel').textContent = state.iconType === 'inner'
    ? `Sur le plan ${resolved.symbol}`
    : `En profondeur ${resolved.symbol}`;

  $('#axisReadout').textContent = resolved.axisLabel;
}
function setAngle(v){
  const normalized = String(v).replace(',', '.');
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return;
  const n = clamp(parsed, 0, 360);
  state.angle = Math.round(n * 10) / 10;
  syncControls();
  updateVisualizer();
}

let animationFrameId = null;
function stopAnimation(){
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
  state.animating = false;
  $('#playBtn').disabled = false;
}
function animateRotation(config={}, opts={}){
  if(state.animating) return Promise.resolve();

  const iconType = config.iconType ?? state.iconType;
  const innerDirection = config.innerDirection ?? state.innerDirection;
  const outerDirection = config.outerDirection ?? state.outerDirection;
  const angle = clamp(Number(config.angle ?? state.angle),0,360);
  const speed = Number(config.speed ?? state.speed);
  const startQ = (opts.startQuaternion || carRoot.quaternion.clone()).clone();

  // L'axe est calculé dans le REPÈRE ÉCRAN au moment du Play, puis figé.
  let resolved;
  if(config.axisWorld && config.refWorld){
    resolved = {
      iconType,
      innerDirection,
      outerDirection,
      axisWorld: new THREE.Vector3(...config.axisWorld),
      refWorld: new THREE.Vector3(...config.refWorld),
      sign: config.sign,
      axisLabel: config.axisLabel,
      symbol: config.symbol,
      basis: getScreenBasis()
    };
  } else {
    resolved = resolveInstruction({iconType, innerDirection, outerDirection});
  }

  const duration = Math.max(450,(angle/90)*1150/Math.max(speed,.1));

  state.iconType = iconType;
  state.innerDirection = innerDirection;
  state.outerDirection = outerDirection;
  state.angle = angle;
  state.startQuaternion.copy(startQ);

  state.lastAnimation = {
    iconType,
    innerDirection,
    outerDirection,
    angle,
    speed,
    axisWorld: resolved.axisWorld.toArray(),
    refWorld: resolved.refWorld.toArray(),
    sign: resolved.sign,
    axisLabel: resolved.axisLabel,
    symbol: resolved.symbol,
    startQuaternion: startQ.clone()
  };

  syncControls();
  updateVisualizer(0,resolved);

  state.animating = true;
  $('#playBtn').disabled = true;
  orbit.enabled = false;

  const startTime = performance.now();

  return new Promise(resolvePromise => {
    function frame(now){
      const raw = (now-startTime)/duration;
      const t = clamp(raw,0,1);
      const eased = 1-Math.pow(1-t,3);

      // IMPORTANT : axe monde / écran => on PREMULTIPLIE le quaternion.
      const delta = new THREE.Quaternion().setFromAxisAngle(
        resolved.axisWorld,
        degToRad(resolved.sign * angle * eased)
      );
      carRoot.quaternion.copy(startQ).premultiply(delta).normalize();

      const traveled = angle*eased;
      $('#liveAngle').textContent = `${traveled.toFixed(traveled<10?1:0)}°`;
      updateMarkers();
      updateVisualizer(traveled,resolved);

      if(t<1){
        animationFrameId=requestAnimationFrame(frame);
      }else{
        animationFrameId=null;
        state.animating=false;
        $('#playBtn').disabled=false;
        orbit.enabled = state.mode !== 'locked';
        $('#liveAngle').textContent=`${formatAngle(angle)}°`;
        updateVisualizer(angle,resolved);
        resolvePromise();
      }
    }
    animationFrameId=requestAnimationFrame(frame);
  });
}
function renderSequence(){
  const el = $('#sequenceList');
  if(!state.sequence.length){
    el.innerHTML='<div class="empty">Aucune étape pour le moment.</div>';
    return;
  }

  el.innerHTML='';
  state.sequence.forEach((step,i)=>{
    const div=document.createElement('div');
    div.className='step';

    const symbol = step.iconType === 'outer'
      ? (step.outerDirection === 'ccw' ? '↺' : '↻')
      : ({up:'↑',down:'↓',left:'←',right:'→'}[step.innerDirection]);

    const typeLabel = step.iconType === 'outer' ? 'En profondeur' : 'Sur le plan';

    div.innerHTML=`<div><b>Étape ${i+1} · ${typeLabel}</b><small>${formatAngle(step.angle)}° · ${symbol}</small></div><button>×</button>`;
    div.querySelector('button').addEventListener('click',()=>{
      state.sequence.splice(i,1);
      renderSequence();
    });
    el.appendChild(div);
  });
}

// listeners
$('#manipulateBtn').addEventListener('click', () => setMode('manipulate'));
$('#lockBtn').addEventListener('click', () => setMode('locked'));
$('#resetCarBtn').addEventListener('click', resetCar);
$('#resetViewBtn').addEventListener('click', resetCamera);
$('#fullscreenBtn').addEventListener('click', async () => {
  if (!document.fullscreenElement) await host.requestFullscreen?.();
  else await document.exitFullscreen?.();
});
$$('.icon-type-btn').forEach(btn => btn.addEventListener('click', () => {
  setIconType(btn.dataset.iconType);
}));
$$('.direction-arrow').forEach(btn => btn.addEventListener('click', () => {
  setInnerDirection(btn.dataset.innerDirection);
}));
$$('.outer-arrow-btn').forEach(btn => btn.addEventListener('click', () => {
  setOuterDirection(btn.dataset.outerDirection);
}));
$('#angleSlider').addEventListener('input', e => setAngle(e.target.value));
$('#angleInput').addEventListener('input', e => {
  if (e.target.value !== '') setAngle(e.target.value);
});
$('#angleInput').addEventListener('change', e => {
  if (e.target.value === '') {
    e.target.value = state.angle;
    return;
  }
  setAngle(e.target.value);
});

$('#playBtn').addEventListener('click', () => {
  setMode('locked');
  animateRotation();
});

['toggleAxis','toggleProtractor','toggleMarkers','toggleGhost'].forEach(id => {
  $('#' + id).addEventListener('change', () => {
    axisGroup.visible = $('#toggleAxis').checked;
    protractorGroup.visible = state.iconType === 'outer' && $('#toggleProtractor').checked;
    markerGroup.visible = $('#toggleMarkers').checked;
    ghostCar.visible = $('#toggleGhost').checked;
  });
});

$('#addStepBtn').addEventListener('click', () => {
  state.sequence.push({
    iconType: state.iconType,
    innerDirection: state.innerDirection,
    outerDirection: state.outerDirection,
    angle: state.angle,
    speed: state.speed
  });
  renderSequence();
});

$('#clearSequenceBtn').addEventListener('click', () => {
  state.sequence = [];
  renderSequence();
});
$('#playSequenceBtn').addEventListener('click', async () => {
  if (state.animating || !state.sequence.length) return;
  setMode('locked');
  for (const step of state.sequence) {
    await animateRotation(step, { startQuaternion: carRoot.quaternion.clone() });
    state.startQuaternion.copy(carRoot.quaternion);
  }
});

orbit.addEventListener('change', () => {
  if(!state.animating) updateVisualizer(0);
});

function resize(){
  const w = host.clientWidth;
  const h = host.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  const current = Number(
    String($('#liveAngle').textContent)
      .replace('°','')
      .replace(',','.')
  ) || 0;
  updatePlanRuler(current);
}
window.addEventListener('resize', resize);
new ResizeObserver(resize).observe(host);

function render(){
  orbit.update();
  updateMarkers();
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

setIconType('inner');
setInnerDirection('right');
setOuterDirection('cw');
buildPlanRuler();
syncControls();
setMode('manipulate');
resetCamera();
updateVisualizer(0);
renderSequence();
resize();
render();
