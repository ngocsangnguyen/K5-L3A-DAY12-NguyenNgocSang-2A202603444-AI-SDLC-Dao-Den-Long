import * as THREE from 'three';
import { randomFromSeed } from './core/random.js';
import { ISLAND_RADIUS } from './core/game.js';

const C = { grass: 0x315e51, sand: 0x698c72, rock: 0x284853, wood: 0x675d4d, gold: 0xffcc7c, dark: 0x152e35, leaf: 0x427d67 };
const material = (color, options = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...options });
const cone = (r, h, n = 7) => new THREE.ConeGeometry(r, h, n);
const cylinder = (top, bottom, h, n = 12) => new THREE.CylinderGeometry(top, bottom, h, n);
const sphere = (r = 1, n = 10) => new THREE.SphereGeometry(r, n, n - 2);
const dummy = new THREE.Object3D();

export class World {
  constructor(canvas, tuning) {
    this.canvas = canvas;
    this.tuning = tuning;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
    this.renderer.setClearColor(0x102932);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x102932, 0.008);
    this.camera = new THREE.PerspectiveCamera(43, 1, 0.1, 230);
    this.camera.position.set(30, 45, 60);
    this.target = new THREE.Vector3(-13, 0, 9);
    this.camera.lookAt(this.target);
    this.ambient = new THREE.HemisphereLight(0x9ed5cf, 0x1e323c, 1.85);
    this.scene.add(this.ambient);
    const moon = new THREE.DirectionalLight(0xb9d8e7, 2.1);
    moon.position.set(-18, 36, 12); moon.castShadow = true;
    moon.shadow.mapSize.set(1024, 1024);
    Object.assign(moon.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, near: 1, far: 90 });
    moon.shadow.normalBias = 0.04; moon.shadow.bias = -0.0001;
    this.scene.add(moon);
    this.random = randomFromSeed(810);
    this.lampModels = new Map(); this.moteModels = new Map(); this.shadeModels = new Map();
    this.pulses = []; this.floaters = []; this.stars = [];
    this.moteGeometry = sphere(0.095, 7);
    this.moteMaterial = material(0xffe9a2, { emissive: 0xffc54c, emissiveIntensity: 2.5 });
    this.glowTexture = this.createGlowTexture();
    this.glowMaterial = new THREE.SpriteMaterial({ map: this.glowTexture, color: 0xffcf73, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending });
    this.buildIsland(); this.buildNature(); this.buildSea(); this.buildAtmosphere();
    this.player = this.makePlayer(); this.scene.add(this.player);
    this.resize();
  }

  addMesh(parent, geometry, mat, pos, scale) {
    const mesh = new THREE.Mesh(geometry, mat);
    if (pos) mesh.position.set(...pos);
    if (scale) mesh.scale.set(...scale);
    mesh.castShadow = true; mesh.receiveShadow = true;
    parent.add(mesh); return mesh;
  }

  createGlowTexture() {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, '#fff7ce'); gradient.addColorStop(0.12, '#fff0a9ee'); gradient.addColorStop(0.35, '#ffdc7a55'); gradient.addColorStop(1, '#ffbd5500');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
  }

  buildIsland() {
    // The playable surface is Y=0. Terrain below it is visual only.
    const island = new THREE.Group(); this.scene.add(island);
    this.addMesh(island, cylinder(23, 20, 3.8, 52), material(C.rock), [0, -2.2, 0]);
    this.addMesh(island, cylinder(23.5, 23, 0.5, 70), material(C.sand), [0, -0.38, 0]);
    const groundGeometry = new THREE.CircleGeometry(23, 72);
    groundGeometry.rotateX(-Math.PI / 2);
    const colors = [], count = groundGeometry.attributes.position.count;
    for (let i = 0; i < count; i++) {
      const color = new THREE.Color(C.grass).multiplyScalar(0.87 + this.random() * 0.22);
      colors.push(color.r, color.g, color.b);
    }
    groundGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const ground = this.addMesh(island, groundGeometry, material(0xffffff, { vertexColors: true }), [0, -0.055, 0]);
    ground.castShadow = false;
    const stones = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), material(0x34525a), 56);
    for (let i = 0; i < 56; i++) {
      const a = i * Math.PI * 2 / 56;
      dummy.position.set(Math.cos(a) * 22, -1.1 - this.random() * 1.5, Math.sin(a) * 22);
      dummy.rotation.set(this.random(), this.random() * 6, this.random());
      dummy.scale.set(1 + this.random() * 1.3, 1.1 + this.random() * 2, 1 + this.random() * 1.5);
      dummy.updateMatrix(); stones.setMatrixAt(i, dummy.matrix);
    }
    stones.receiveShadow = true; this.scene.add(stones);
    const pathMaterial = material(0x6c8b70);
    // Five winding routes and a soft perimeter trail connect every objective.
    for (let i = 0; i < 5; i++) {
      const angle = Math.PI / 2 + i * Math.PI * 2 / 5;
      const end = new THREE.Vector3(Math.cos(angle) * 14, 0.007, Math.sin(angle) * 14);
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.007, 0), new THREE.Vector3(Math.cos(angle + .22) * 5, .007, Math.sin(angle + .22) * 5), new THREE.Vector3(Math.cos(angle - .12) * 10, .007, Math.sin(angle - .12) * 10), end]);
      this.ribbon(curve, 1.4, pathMaterial);
    }
    const ringPoints = Array.from({ length: 31 }, (_, i) => new THREE.Vector3(Math.cos(i / 30 * Math.PI * 2) * 14, .005, Math.sin(i / 30 * Math.PI * 2) * 14));
    this.ribbon(new THREE.CatmullRomCurve3(ringPoints), 1.05, pathMaterial);
    const spawn = this.addMesh(this.scene, cylinder(2.3, 2.5, .12, 32), material(0x88997b), [0, -.035, 0]); spawn.castShadow = false;
    // A small dock points into the cloud sea.
    const dock = new THREE.Group(); dock.position.set(1, 0, 22); this.scene.add(dock);
    const wood = material(0x7c765c);
    for (let i = 0; i < 10; i++) this.addMesh(dock, new THREE.BoxGeometry(2.8, .14, .48), wood, [0, -.1, i * .55]);
    for (const x of [-1.25, 1.25]) for (const z of [.2, 4.8]) {
      this.addMesh(dock, cylinder(.09, .12, 1.6), material(C.wood), [x, -.1, z]);
      this.addMesh(dock, sphere(.14, 7), material(0xaaa17b), [x, .75, z]);
    }
    // A little resting spot by the first lamp.
    const blanket = this.addMesh(this.scene, new THREE.BoxGeometry(2.3, .045, 1.2), material(0xb78865), [3.5, .02, 16.8]); blanket.rotation.y = -.2;
    this.addMesh(this.scene, cylinder(.35, .35, .42, 12), material(0x668c78), [4.3, .22, 17.2]);
  }

  ribbon(curve, width, mat) {
    const points = curve.getPoints(80), vertices = [], indices = [];
    points.forEach((point, i) => {
      const tangent = curve.getTangent(i / 80);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize().multiplyScalar(width / 2);
      vertices.push(point.x + normal.x, point.y, point.z + normal.z, point.x - normal.x, point.y, point.z - normal.z);
      if (i < 80) { const n = i * 2; indices.push(n, n + 2, n + 1, n + 1, n + 2, n + 3); }
    });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geo.setIndex(indices); geo.computeVertexNormals();
    const mesh = this.addMesh(this.scene, geo, mat); mesh.receiveShadow = true; mesh.castShadow = false;
  }

  buildNature() {
    const trunkMat = material(0x776753), leaves = [material(0x37745d), material(0x528b68), material(0x37695d)];
    const treeAngles = [.12, .66, 1.0, 1.62, 2.03, 2.52, 2.9, 3.35, 3.82, 4.25, 4.72, 5.18, 5.65, 5.95];
    treeAngles.forEach((a, i) => {
      const radius = 18.5 + this.random() * 2.2;
      const tree = new THREE.Group(); tree.position.set(Math.cos(a) * radius, 0, Math.sin(a) * radius);
      tree.scale.setScalar(.8 + this.random() * .45); tree.rotation.y = a; this.scene.add(tree);
      const trunk = this.addMesh(tree, cylinder(.13, .27, 3.2, 7), trunkMat, [0, 1.5, 0]); trunk.rotation.z = .1;
      if (i % 4 === 0) {
        // Rounded copper-pink trees are entirely procedural original assets.
        this.addMesh(tree, new THREE.IcosahedronGeometry(1.5, 1), material(0xac8e87), [0, 3.4, 0], [1.15, .75, 1]);
        this.addMesh(tree, new THREE.IcosahedronGeometry(1.1, 1), material(0xc0a192), [-.8, 3, .4]);
      } else {
        for (let j = 0; j < 3; j++) this.addMesh(tree, cone(1.65 - j * .35, 2.2 - j * .25, 7), leaves[(i + j) % leaves.length], [0, 2.5 + j * 1.1, 0]);
      }
      // Grass clumps at the tree base.
      for (let j = 0; j < 3; j++) this.addMesh(tree, new THREE.IcosahedronGeometry(.6, 0), leaves[(i + 1) % 3], [j * .5 - .5, .25, .5], [1, .55, 1]);
    });
    const grass = new THREE.InstancedMesh(cone(.14, .65, 4), material(0x6c9c72), 420);
    for (let i = 0; i < 420; i++) {
      const a = this.random() * Math.PI * 2, r = 4 + this.random() * 18;
      dummy.position.set(Math.cos(a) * r, .12, Math.sin(a) * r);
      dummy.rotation.set((this.random() - .5) * .6, this.random() * 6, (this.random() - .5) * .4);
      dummy.scale.set(.5 + this.random() * .7, .45 + this.random() * .8, .5 + this.random() * .7);
      dummy.updateMatrix(); grass.setMatrixAt(i, dummy.matrix);
    }
    this.scene.add(grass);
    const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(.7), material(0x789483), 40);
    for (let i = 0; i < 40; i++) {
      const a = this.random() * Math.PI * 2, r = 7 + this.random() * 14;
      dummy.position.set(Math.cos(a) * r, .08, Math.sin(a) * r); dummy.rotation.set(this.random(), this.random(), this.random());
      dummy.scale.set(.4 + this.random(), .25 + this.random() * .4, .5 + this.random()); dummy.updateMatrix(); rocks.setMatrixAt(i, dummy.matrix);
    }
    rocks.receiveShadow = true; this.scene.add(rocks);
    // Small glowing mushrooms give routes a quiet, fairytale detail.
    const mushroomMat = material(0x9cc7ad, { emissive: 0x345e49, emissiveIntensity: .35 });
    for (let i = 0; i < 26; i++) {
      const a = this.random() * Math.PI * 2, r = 8 + this.random() * 13, x = Math.cos(a) * r, z = Math.sin(a) * r;
      this.addMesh(this.scene, cylinder(.035, .045, .27, 6), material(0xb3b69b), [x, .1, z]);
      this.addMesh(this.scene, sphere(.22, 8), mushroomMat, [x, .26, z], [1, .45, 1]);
    }
  }

  buildSea() {
    const sea = this.addMesh(this.scene, new THREE.PlaneGeometry(400, 400), material(0x143b46, { roughness: .45, metalness: .25 }), [0, -4.5, 0]);
    sea.rotation.x = -Math.PI / 2; sea.castShadow = sea.receiveShadow = false;
    const rippleMat = new THREE.MeshBasicMaterial({ color: 0x9cc9b3, transparent: true, opacity: .065, side: THREE.DoubleSide, depthWrite: false });
    for (let i = 0; i < 9; i++) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(26 + i * 3, 26.06 + i * 3, 96), rippleMat);
      ring.rotation.x = -Math.PI / 2; ring.position.y = -4.45; this.scene.add(ring);
    }
    const cloudMat = material(0x658e91, { transparent: true, opacity: .33, flatShading: true });
    const clouds = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), cloudMat, 65);
    for (let i = 0; i < 65; i++) {
      const a = this.random() * Math.PI * 2, r = 30 + this.random() * 36;
      dummy.position.set(Math.cos(a) * r, -3.3 + this.random() * 1.1, Math.sin(a) * r);
      dummy.rotation.set(0, this.random() * 6, 0); dummy.scale.set(3 + this.random() * 6, .7 + this.random() * 1.2, 2 + this.random() * 4);
      dummy.updateMatrix(); clouds.setMatrixAt(i, dummy.matrix);
    }
    this.scene.add(clouds);
    for (const [x, z, s] of [[-44, -30, 5], [38, -38, 6], [55, 15, 4], [-50, 24, 3]]) {
      this.addMesh(this.scene, cylinder(s, s * .6, 4, 8), material(0x34545b), [x, -1.7, z]);
      this.addMesh(this.scene, cylinder(s + .1, s, .3, 10), material(0x527d6b), [x, .4, z]);
    }
  }

  buildAtmosphere() {
    const positions = [];
    for (let i = 0; i < 190; i++) positions.push((this.random() - .5) * 170, 12 + this.random() * 45, (this.random() - .5) * 170);
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.starField = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xc0e0d3, size: .09, transparent: true, opacity: .6, sizeAttenuation: true }));
    this.scene.add(this.starField);
    // Drifting decorative fireflies are browser-only and never enter simulation.
    for (let i = 0; i < 24; i++) {
      const sprite = new THREE.Sprite(this.glowMaterial); sprite.scale.setScalar(.35 + this.random() * .5);
      const a = this.random() * Math.PI * 2, r = 6 + this.random() * 20;
      sprite.position.set(Math.cos(a) * r, 1.5 + this.random() * 3, Math.sin(a) * r);
      this.floaters.push({ sprite, y: sprite.position.y, phase: this.random() * 6 }); this.scene.add(sprite);
    }
  }

  makePlayer() {
    const player = new THREE.Group(), cape = material(0xe6a067), skin = material(0xdac3a1), dark = material(0x294445), hat = material(0xdbc796);
    this.addMesh(player, cylinder(.28, .4, .75, 8), cape, [0, .73, 0]);
    this.addMesh(player, sphere(.27, 12), skin, [0, 1.32, 0]);
    this.addMesh(player, cone(.65, .38, 24), hat, [0, 1.58, 0]);
    const brim = this.addMesh(player, new THREE.TorusGeometry(.58, .025, 5, 32), material(0x9c9470), [0, 1.41, 0]); brim.rotation.x = Math.PI / 2;
    this.legs = [];
    for (const x of [-.16, .16]) this.legs.push(this.addMesh(player, cylinder(.095, .085, .4, 7), dark, [x, .22, 0]));
    for (const x of [-.34, .34]) {
      const arm = this.addMesh(player, cylinder(.085, .11, .45, 7), cape, [x, .87, 0]); arm.rotation.z = x > 0 ? .25 : -.25;
    }
    // A small paper lantern hangs from the side of Mây's conical hat.
    const cord = this.addMesh(player, cylinder(.012, .012, .5, 5), material(0x7b7154), [.46, 1.2, .05]); cord.castShadow = false;
    this.addMesh(player, sphere(.17, 10), material(0xffd18b, { emissive: 0xffa64a, emissiveIntensity: 1.3 }), [.46, .91, .05], [.8, 1.15, .8]);
    const glow = new THREE.Sprite(this.glowMaterial); glow.position.set(.46, 1, .05); glow.scale.setScalar(1.4); player.add(glow);
    this.playerLight = new THREE.PointLight(0xffc77c, 4, 6, 2); this.playerLight.position.set(0, 1.5, 0); player.add(this.playerLight);
    this.playerFacing = 0; return player;
  }

  makeLantern(lantern) {
    const group = new THREE.Group(); group.position.set(...lantern.pos); this.scene.add(group);
    const stone = material(0x6d8978), wood = material(C.wood);
    this.addMesh(group, cylinder(1.05, 1.2, .23, 10), stone, [0, .07, 0]);
    this.addMesh(group, cylinder(.6, .8, .25, 8), material(0x8c9c7b), [0, .28, 0]);
    for (const x of [-.65, .65]) this.addMesh(group, new THREE.BoxGeometry(.13, 2.7, .14), wood, [x, 1.65, 0]);
    this.addMesh(group, new THREE.BoxGeometry(1.75, .12, .2), wood, [0, 2.92, 0]);
    const roof = this.addMesh(group, cone(1.45, .5, 4), material(0x315c55), [0, 3.18, 0]); roof.rotation.y = Math.PI / 4;
    this.addMesh(group, sphere(.12, 8), material(0xb2a47b), [0, 3.51, 0]);
    const paper = material(0x81947e, { emissive: 0xf7b45a, emissiveIntensity: .05 });
    const body = this.addMesh(group, sphere(.62, 16), paper, [0, 2.2, 0], [.82, 1, .82]);
    const rimMat = material(0xa18a58);
    for (const y of [1.62, 2.78]) this.addMesh(group, cylinder(.19, .19, .08, 12), rimMat, [0, y, 0]);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2, points = [];
      for (let j = 0; j <= 12; j++) {
        const theta = j / 12 * Math.PI, r = Math.sin(theta) * .515;
        points.push(new THREE.Vector3(Math.cos(a) * r, 2.2 + Math.cos(theta) * .625, Math.sin(a) * r));
      }
      const rib = this.addMesh(group, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 12, .013, 4, false), rimMat); rib.castShadow = false;
    }
    this.addMesh(group, cylinder(.018, .018, .35, 5), material(0xc4a367), [0, 1.42, 0]);
    const glow = new THREE.Sprite(this.glowMaterial.clone()); glow.position.set(0, 2.2, 0); glow.scale.setScalar(3.8); glow.material.opacity = 0; group.add(glow);
    const light = new THREE.PointLight(0xffbd64, 0, 12, 2); light.position.set(0, 2.5, 0); group.add(light);
    const area = new THREE.Mesh(new THREE.CircleGeometry(this.tuning.safe_radius, 48), new THREE.MeshBasicMaterial({ color: 0xe4bf78, transparent: true, opacity: 0, depthWrite: false }));
    area.rotation.x = -Math.PI / 2; area.position.y = .027; group.add(area);
    const ring = new THREE.Mesh(new THREE.RingGeometry(this.tuning.safe_radius - .035, this.tuning.safe_radius, 64), new THREE.MeshBasicMaterial({ color: 0xf5d294, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = .03; group.add(ring);
    return { group, body, paper, glow, light, area, ring, brightness: 0 };
  }

  makeMote(mote) {
    const group = new THREE.Group();
    const core = new THREE.Mesh(this.moteGeometry, this.moteMaterial); group.add(core);
    const glow = new THREE.Sprite(this.glowMaterial); glow.scale.setScalar(.9); group.add(glow);
    this.scene.add(group); return { group, phase: Number(mote.id.slice(1)) * 1.78 };
  }

  makeShade(shade) {
    const group = new THREE.Group(), bodyMat = material(0x352c54, { emissive: 0x332446, emissiveIntensity: .35, transparent: true, opacity: .94 });
    this.addMesh(group, sphere(.67, 12), bodyMat, [0, .75, 0], [1, 1.17, 1]);
    for (let i = 0; i < 4; i++) {
      const tentacle = this.addMesh(group, cone(.17, .9, 6), bodyMat, [(i - 1.5) * .27, .13, 0]); tentacle.rotation.z = Math.PI + (i - 1.5) * .2;
    }
    const eyes = material(0xf5afbb, { emissive: 0xf6a0bc, emissiveIntensity: 2 });
    for (const x of [-.21, .21]) this.addMesh(group, sphere(.085, 8), eyes, [x, .92, .58]);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTexture, color: 0x9160c4, transparent: true, opacity: .25, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.position.y = .6; glow.scale.setScalar(2.6); group.add(glow);
    this.scene.add(group); return { group, bodyMat, phase: this.random() * 6 };
  }

  reset(game) {
    for (const { group } of this.lampModels.values()) this.disposeGroup(group);
    this.lampModels.clear();
    for (const { group } of this.moteModels.values()) this.scene.remove(group);
    this.moteModels.clear();
    for (const { group } of this.shadeModels.values()) this.disposeGroup(group);
    this.shadeModels.clear();
    for (const pulse of this.pulses) { this.scene.remove(pulse.mesh); pulse.mesh.geometry.dispose(); pulse.mesh.material.dispose(); }
    this.pulses = [];
    for (const lantern of game.lanterns) this.lampModels.set(lantern.id, this.makeLantern(lantern));
    for (const mote of game.motes) this.moteModels.set(mote.id, this.makeMote(mote));
    for (const shade of game.shades) this.shadeModels.set(shade.id, this.makeShade(shade));
    this.player.position.set(...game.player.pos);
  }

  disposeGroup(group) {
    this.scene.remove(group);
    group.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      // Group materials are private except shared sprite texture, which stays.
      if (obj.material) obj.material.dispose();
    });
  }

  pulse(pos) {
    const mesh = new THREE.Mesh(new THREE.RingGeometry(.95, 1, 64), new THREE.MeshBasicMaterial({ color: 0xffd68d, transparent: true, opacity: .9, side: THREE.DoubleSide, depthWrite: false }));
    mesh.rotation.x = -Math.PI / 2; mesh.position.set(pos[0], .13, pos[2]); this.scene.add(mesh);
    this.pulses.push({ mesh, age: 0 });
  }

  update(game, time, dt, { home, yaw, distance, reduceMotion = false }) {
    const litCount = game.lanterns.filter((l) => l.lit).length;
    this.ambient.intensity = THREE.MathUtils.lerp(this.ambient.intensity, 1.85 + litCount * .13, .025);
    this.player.position.set(...game.player.pos);
    if (Math.hypot(...game.input.move) > 0 && !home && game.state === 'playing') {
      const angle = Math.atan2(game.input.move[0], game.input.move[1]) + yaw;
      this.playerFacing += Math.atan2(Math.sin(angle - this.playerFacing), Math.cos(angle - this.playerFacing)) * .18;
      this.legs.forEach((leg, i) => { leg.rotation.x = Math.sin(time * 13 + i * Math.PI) * .55; });
    } else this.legs.forEach((leg) => { leg.rotation.x *= .8; });
    this.player.rotation.y = this.playerFacing;
    this.player.visible = game.tick >= game.invulnUntil || Math.floor(time * 12) % 2 === 0 || home;
    for (const lamp of game.lanterns) {
      const model = this.lampModels.get(lamp.id); if (!model) continue;
      const target = lamp.lit ? 1 : lamp.deposited / this.tuning.lantern_cost * .3;
      model.brightness = THREE.MathUtils.lerp(model.brightness, target, Math.min(1, dt * 3));
      const brightness = model.brightness;
      model.paper.color.setHex(lamp.lit ? 0xffc36b : 0x81947e);
      model.paper.emissiveIntensity = .04 + brightness * 1.6;
      model.glow.material.opacity = brightness * .7;
      model.light.intensity = brightness * 21;
      model.area.material.opacity = brightness * .075;
      model.ring.material.opacity = brightness * .27;
      model.body.rotation.z = reduceMotion ? 0 : Math.sin(time * .8 + Number(lamp.id.slice(1))) * .025;
    }
    const active = new Set(game.motes.map((m) => m.id));
    for (const [id, model] of this.moteModels) {
      if (!active.has(id)) { this.scene.remove(model.group); this.moteModels.delete(id); }
    }
    for (const mote of game.motes) {
      if (!this.moteModels.has(mote.id)) this.moteModels.set(mote.id, this.makeMote(mote));
      const model = this.moteModels.get(mote.id);
      model.group.position.set(mote.pos[0], .65 + (reduceMotion ? 0 : Math.sin(time * 2 + model.phase) * .16), mote.pos[2]);
    }
    for (const shade of game.shades) {
      if (!this.shadeModels.has(shade.id)) this.shadeModels.set(shade.id, this.makeShade(shade));
      const model = this.shadeModels.get(shade.id);
      model.group.position.set(shade.pos[0], shade.pos[1] + (reduceMotion ? 0 : Math.sin(time * 2.5 + model.phase) * .13), shade.pos[2]);
      model.group.rotation.y = Math.atan2(game.player.pos[0] - shade.pos[0], game.player.pos[2] - shade.pos[2]);
      model.bodyMat.color.setHex(shade.state === 'stunned' ? 0x64717d : 0x352c54);
      model.group.scale.setScalar(shade.state === 'stunned' ? .86 : 1);
    }
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const pulse = this.pulses[i]; pulse.age += dt;
      pulse.mesh.scale.setScalar(.2 + pulse.age * this.tuning.pulse_radius / .65);
      pulse.mesh.material.opacity = Math.max(0, .9 - pulse.age * 1.3);
      if (pulse.age > .75) { this.scene.remove(pulse.mesh); pulse.mesh.geometry.dispose(); pulse.mesh.material.dispose(); this.pulses.splice(i, 1); }
    }
    if (!reduceMotion) for (const f of this.floaters) f.sprite.position.y = f.y + Math.sin(time * .6 + f.phase) * .4;
    const mobile = innerWidth < 720;
    let desiredTarget, desiredPosition;
    if (home) {
      desiredTarget = new THREE.Vector3(mobile ? -8 : -13, 0, mobile ? 6 : 9);
      const drift = reduceMotion ? 0 : Math.sin(time * .035) * 2;
      desiredPosition = desiredTarget.clone().add(new THREE.Vector3(43 + drift, mobile ? 54 : 45, mobile ? 65 : 52));
    } else {
      desiredTarget = new THREE.Vector3(game.player.pos[0], .6, game.player.pos[2]);
      desiredPosition = desiredTarget.clone().add(new THREE.Vector3(Math.sin(yaw) * distance, distance * .78, Math.cos(yaw) * distance));
    }
    const smoothing = 1 - Math.exp(-dt * 3.5);
    this.target.lerp(desiredTarget, smoothing); this.camera.position.lerp(desiredPosition, smoothing); this.camera.lookAt(this.target);
    this.renderer.render(this.scene, this.camera);
  }

  project(pos) {
    const projected = new THREE.Vector3(...pos).project(this.camera);
    return { x: (projected.x * .5 + .5) * this.canvas.clientWidth, y: (-projected.y * .5 + .5) * this.canvas.clientHeight, visible: projected.z > -1 && projected.z < 1 && Math.abs(projected.x) < 1.05 && Math.abs(projected.y) < 1.05 };
  }
  resize() {
    const width = innerWidth, height = innerHeight;
    this.renderer.setSize(width, height, false); this.camera.aspect = width / height; this.camera.updateProjectionMatrix();
  }
}
