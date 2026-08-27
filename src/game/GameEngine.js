import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { gsap } from 'gsap';
import { AudioManager } from './audio';
import { comboTaunts, hitDialogues, idleDialogues, recoverDialogues } from './data';
export class GameEngine {
    canvas;
    look;
    events;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(48, 1, .1, 100);
    renderer;
    world;
    queue;
    clock = new THREE.Clock();
    entities = [];
    bodyMap = new Map();
    boss = [];
    bossCenter;
    bossReaction = 0;
    bossReactionTime = 0;
    bossDragOffset = new THREE.Vector3();
    bossKnocked = false;
    bossKnockTime = 0;
    raf = 0;
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    selected = null;
    bossRestPose = new Map();
    previousPointer = new THREE.Vector2();
    pointerVelocity = new THREE.Vector2();
    orbit = { yaw: 0, pitch: 0, distance: 10.5 };
    orbiting = false;
    chargeStarted = 0;
    chargeWeapon = null;
    comboTimer = 0;
    idleTimer = 0;
    fallenTimer = 0;
    activeProps = [];
    heldProp = null;
    heldWeapon = 'whip';
    heldAnimating = false;
    hitCooldown = new Map();
    settings = { shake: true, slowmo: true, particles: 2, fps: 60 };
    stressGainRate = .4;
    stats = { stress: 0, combo: 0, maxCombo: 0, destruction: 0, hits: 0, slipperHits: 0, bestWeapon: '巴掌', rage: false, rageRemaining: 0 };
    weaponHits = new Map();
    audio = new AudioManager();
    lastHitDialogue = '';
    particles = [];
    disposed = false;
    constructor(canvas, look, events) {
        this.canvas = canvas;
        this.look = look;
        this.events = events;
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
        this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    async init() {
        await RAPIER.init();
        this.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
        this.queue = new RAPIER.EventQueue(true);
        this.buildScene();
        this.bind();
        this.resize();
        this.clock.start();
        this.loop();
    }
    mat(color, roughness = .72) { return new THREE.MeshStandardMaterial({ color, roughness, metalness: .04 }); }
    addRigid(mesh, pos, shape, size, dynamic = true, meta = {}) {
        mesh.position.copy(pos);
        this.scene.add(mesh);
        mesh.traverse(o => { if (o instanceof THREE.Mesh) {
            o.castShadow = true;
            o.receiveShadow = true;
        } });
        const desc = dynamic ? RAPIER.RigidBodyDesc.dynamic().setLinearDamping(.35).setAngularDamping(.45) : RAPIER.RigidBodyDesc.fixed();
        desc.setTranslation(pos.x, pos.y, pos.z);
        const body = this.world.createRigidBody(desc);
        let collider;
        if (shape === 'ball')
            collider = RAPIER.ColliderDesc.ball(size.x);
        else if (shape === 'capsule')
            collider = RAPIER.ColliderDesc.capsule(size.y, size.x);
        else
            collider = RAPIER.ColliderDesc.cuboid(size.x, size.y, size.z);
        collider.setRestitution(.22).setFriction(.7).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
        // Boss limbs belong to group 2 and only collide with environment group 1.
        // This prevents adjacent ragdoll colliders from fighting their joints and jittering forever.
        if (meta.boss)
            collider.setCollisionGroups((0x0002 << 16) | 0x0001);
        else
            collider.setCollisionGroups((0x0001 << 16) | 0xffff);
        this.world.createCollider(collider, body);
        const e = { mesh, body, createdAt: performance.now(), ...meta };
        this.entities.push(e);
        this.bodyMap.set(body.handle, e);
        mesh.traverse(o => { o.userData.entity = e; });
        return e;
    }
    box(name, pos, size, color, dynamic = true, value = 1) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x * 2, size.y * 2, size.z * 2), this.mat(color));
        mesh.name = name;
        return this.addRigid(mesh, pos, 'box', size, dynamic, { value });
    }
    buildScene() {
        this.scene.background = new THREE.Color(0xcfe7f4);
        this.scene.fog = new THREE.Fog(0xcfe7f4, 16, 32);
        const hemi = new THREE.HemisphereLight(0xfff7dc, 0x66748c, 2.2);
        this.scene.add(hemi);
        const sun = new THREE.DirectionalLight(0xfff1c7, 3.2);
        sun.position.set(-6, 10, 5);
        sun.castShadow = true;
        sun.shadow.mapSize.set(2048, 2048);
        this.scene.add(sun);
        this.box('地面', new THREE.Vector3(0, -.25, 0), new THREE.Vector3(7, .25, 6), 0xd9c7a3, false, 0);
        this.box('后墙', new THREE.Vector3(0, 3, -5.5), new THREE.Vector3(7, 3, .15), 0xf7f2e7, false, 0);
        this.box('侧墙', new THREE.Vector3(-6.85, 3, 0), new THREE.Vector3(.15, 3, 5.5), 0xe7eff1, false, 0);
        this.box('右界', new THREE.Vector3(6.85, 2, 0), new THREE.Vector3(.15, 2, 5.5), 0xc4dce2, false, 0);
        this.addWindow();
        this.addDesk();
        this.addFurniture();
        this.createBoss();
        this.camera.position.set(0, 4.2, 10.5);
        this.camera.lookAt(0, 2, 0);
    }
    addWindow() {
        const frame = this.box('窗户', new THREE.Vector3(3.8, 3.3, -5.3), new THREE.Vector3(2.1, 1.45, .08), 0x8fd3ed, false, 0);
        const bars = new THREE.Group();
        for (const [x, y, sx, sy] of [[0, 0, .05, 1.45], [0, 0, 2.1, .05], [-2.08, 0, .05, 1.45], [2.08, 0, .05, 1.45], [0, -1.42, 2.1, .05], [0, 1.42, 2.1, .05]]) {
            const b = new THREE.Mesh(new THREE.BoxGeometry(sx * 2, sy * 2, .12), this.mat(0xffffff));
            b.position.set(x, y, .1);
            bars.add(b);
        }
        frame.mesh.add(bars);
    }
    addDesk() {
        this.box('老板桌', new THREE.Vector3(0, 1.05, -1.55), new THREE.Vector3(2.4, .16, 1), 0x8b5737, false, 0);
        for (const x of [-2, 2])
            for (const z of [-2.15, -.95])
                this.box('桌腿', new THREE.Vector3(x, .5, z), new THREE.Vector3(.16, .5, .16), 0x60402c, false, 0);
        const monitor = this.box('显示器', new THREE.Vector3(.75, 2.05, -1.8), new THREE.Vector3(.75, .52, .1), 0x27313b, true, 7);
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.28, .72), new THREE.MeshBasicMaterial({ color: 0x5cd6d0 }));
        screen.position.z = .105;
        monitor.mesh.add(screen);
        this.box('键盘', new THREE.Vector3(.55, 1.45, -.85), new THREE.Vector3(.7, .06, .27), 0x363d47, true, 3);
        this.box('咖啡杯', new THREE.Vector3(-1.25, 1.55, -1.4), new THREE.Vector3(.18, .26, .18), 0xe8d5b2, true, 2);
        for (let i = 0; i < 7; i++)
            this.box('文件', new THREE.Vector3(-1.9 + i * .28, 1.55 + i * .018, -1), new THREE.Vector3(.18, .025, .25), [0xef6d65, 0x64b5dd, 0xf6ce55][i % 3], true, 1);
    }
    addFurniture() {
        this.addOfficeChair();
        this.box('文件柜', new THREE.Vector3(-5.35, 1.15, -3.8), new THREE.Vector3(.75, 1.15, .65), 0x6e8797, true, 8);
        const printer = this.box('打印机', new THREE.Vector3(-4.4, .65, 2.8), new THREE.Vector3(.75, .45, .62), 0xe8edf0, true, 10);
        printer.mesh.userData.printer = true;
        this.box('书柜', new THREE.Vector3(5.25, 1.5, -4.5), new THREE.Vector3(.8, 1.5, .45), 0x835a3d, true, 8);
        this.box('垃圾桶', new THREE.Vector3(3.8, .48, 1.5), new THREE.Vector3(.42, .48, .42), 0x7096a0, true, 3);
        this.box('白板', new THREE.Vector3(-3.5, 3.1, -5.1), new THREE.Vector3(1.35, .85, .09), 0xffffff, true, 6);
        this.box('台灯', new THREE.Vector3(1.9, 1.7, -1.6), new THREE.Vector3(.18, .5, .18), 0xf3bc43, true, 2);
        this.box('纸箱', new THREE.Vector3(4.9, .55, 3.6), new THREE.Vector3(.58, .55, .58), 0xb8854f, true, 3);
        for (let i = 0; i < 4; i++)
            this.addPlant(i);
    }
    addOfficeChair() { const g = this.makeChair(); g.scale.setScalar(.82); this.addRigid(g, new THREE.Vector3(-2.7, .9, .4), 'box', new THREE.Vector3(.65, .9, .65), true, { value: 7 }); g.name = '办公椅'; }
    makeChair() { const g = new THREE.Group(), dark = this.mat(0x293a50), metal = this.mat(0x4c5864, .35); const seat = new THREE.Mesh(new THREE.BoxGeometry(1.15, .22, 1.05), dark); seat.position.y = .65; g.add(seat); const back = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.25, .18), dark); back.position.set(0, 1.35, .44); back.rotation.x = -.12; g.add(back); const stem = new THREE.Mesh(new THREE.CylinderGeometry(.09, .12, .75, 10), metal); stem.position.y = .18; g.add(stem); for (let i = 0; i < 5; i++) {
        const a = i * Math.PI * 2 / 5, leg = new THREE.Mesh(new THREE.BoxGeometry(.08, .08, .78), metal);
        leg.position.set(Math.sin(a) * .28, -.2, Math.cos(a) * .28);
        leg.rotation.y = a;
        g.add(leg);
        const wheel = new THREE.Mesh(new THREE.TorusGeometry(.11, .045, 6, 10), this.mat(0x171b20));
        wheel.position.set(Math.sin(a) * .65, -.25, Math.cos(a) * .65);
        wheel.rotation.y = a;
        g.add(wheel);
    } for (const x of [-.66, .66]) {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(.08, .55, .08), metal);
        arm.position.set(x, .95, 0);
        g.add(arm);
        const pad = new THREE.Mesh(new THREE.BoxGeometry(.35, .08, .12), dark);
        pad.position.set(x, 1.2, -.05);
        g.add(pad);
    } return g; }
    makeSlipper() { const g = new THREE.Group(), sole = new THREE.Mesh(new THREE.CapsuleGeometry(.34, .95, 6, 12), this.mat(0xe8554d)); sole.rotation.z = Math.PI / 2; sole.scale.set(1, .28, .58); g.add(sole); for (const side of [-1, 1]) {
        const strap = new THREE.Mesh(new THREE.TorusGeometry(.34, .065, 7, 16, Math.PI * .72), this.mat(0xf8b08c));
        strap.rotation.set(Math.PI / 2, 0, side * .72);
        strap.position.set(.18, side * .12, .18);
        g.add(strap);
    } const tread = new THREE.Mesh(new THREE.BoxGeometry(.7, .03, .34), this.mat(0xc83d38)); tread.position.set(-.12, -.13, 0); g.add(tread); return g; }
    makeKeyboard() { const g = new THREE.Group(), base = new THREE.Mesh(new THREE.BoxGeometry(1.65, .16, .62), this.mat(0x303844)); base.rotation.x = -.08; g.add(base); for (let r = 0; r < 4; r++)
        for (let c = 0; c < 11; c++) {
            const key = new THREE.Mesh(new THREE.BoxGeometry(.115, .06, .1), this.mat(c === 10 && r === 3 ? 0x58b8c9 : 0xe4e7e9));
            key.position.set(-.68 + c * .135, .11, -.22 + r * .14);
            key.name = 'keycap';
            g.add(key);
        } const space = new THREE.Mesh(new THREE.BoxGeometry(.65, .065, .1), this.mat(0xcbd0d4)); space.position.set(.05, .115, .2); g.add(space); return g; }
    makeHammer() { const g = new THREE.Group(), handle = new THREE.Mesh(new THREE.CylinderGeometry(.09, .12, 1.45, 12), this.mat(0x3aa9d8)); handle.position.y = -.55; g.add(handle); const head = new THREE.Mesh(new THREE.CapsuleGeometry(.38, .95, 8, 14), this.mat(0xf4c83f)); head.rotation.z = Math.PI / 2; head.position.y = .2; g.add(head); for (const x of [-.68, .68]) {
        const rim = new THREE.Mesh(new THREE.TorusGeometry(.36, .055, 8, 16), this.mat(0xf08a37));
        rim.rotation.y = Math.PI / 2;
        rim.position.set(x, .2, 0);
        g.add(rim);
    } return g; }
    makeBat() { const pivot = new THREE.Group(), bat = new THREE.Group(), wood = this.mat(0xc7833e, .55); const profile = [new THREE.Vector2(.16, 0), new THREE.Vector2(.17, .1), new THREE.Vector2(.11, .18), new THREE.Vector2(.1, .85), new THREE.Vector2(.13, 1.15), new THREE.Vector2(.2, 1.55), new THREE.Vector2(.28, 2.15), new THREE.Vector2(.3, 2.48), new THREE.Vector2(.27, 2.63), new THREE.Vector2(0, 2.7)]; bat.add(new THREE.Mesh(new THREE.LatheGeometry(profile, 18), wood)); const grip = new THREE.Mesh(new THREE.CylinderGeometry(.112, .14, .78, 14), this.mat(0x30251f, .9)); grip.position.y = .48; bat.add(grip); for (let i = 0; i < 6; i++) {
        const wrap = new THREE.Mesh(new THREE.TorusGeometry(.118, .015, 6, 14), this.mat(0x846f60));
        wrap.position.y = .2 + i * .115;
        wrap.rotation.x = Math.PI / 2;
        bat.add(wrap);
    } bat.rotation.z = -.72; pivot.add(bat); return pivot; }
    makeFish() { const g = new THREE.Group(), body = new THREE.Mesh(new THREE.SphereGeometry(.55, 14, 9), this.mat(0x72b9c8)); body.scale.set(1.55, .55, .35); g.add(body); const tail = new THREE.Mesh(new THREE.ConeGeometry(.52, .72, 3), this.mat(0x4d91a4)); tail.rotation.z = -Math.PI / 2; tail.position.x = -1.05; g.add(tail); const fin = new THREE.Mesh(new THREE.ConeGeometry(.25, .55, 3), this.mat(0x4d91a4)); fin.position.set(0, .35, 0); g.add(fin); for (const z of [-.18, .18]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(.075, 8, 6), this.mat(0x121820));
        eye.position.set(.58, .14, z);
        g.add(eye);
    } return g; }
    makeFan() { const g = new THREE.Group(), metal = this.mat(0xb8c4cb, .38), blue = this.mat(0x55b8cf); const pole = new THREE.Mesh(new THREE.CylinderGeometry(.07, .1, 1.2, 10), metal); pole.position.y = -.55; g.add(pole); const base = new THREE.Mesh(new THREE.CylinderGeometry(.55, .65, .14, 16), metal); base.position.y = -1.15; g.add(base); const cage = new THREE.Mesh(new THREE.TorusGeometry(.72, .045, 8, 28), metal); g.add(cage); const hub = new THREE.Mesh(new THREE.SphereGeometry(.16, 10, 8), metal); g.add(hub); for (let i = 0; i < 4; i++) {
        const blade = new THREE.Mesh(new THREE.CapsuleGeometry(.16, .48, 4, 8), blue);
        blade.scale.set(.45, 1, .18);
        blade.position.set(Math.cos(i * Math.PI / 2) * .34, Math.sin(i * Math.PI / 2) * .34, .02);
        blade.rotation.z = i * Math.PI / 2 + .6;
        g.add(blade);
    } return g; }
    addPlant(i) {
        const g = new THREE.Group();
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(.28, .38, .55, 8), this.mat(0xd66c4b));
        g.add(pot);
        for (let j = 0; j < 5; j++) {
            const leaf = new THREE.Mesh(new THREE.SphereGeometry(.3, 7, 5), this.mat(0x57a65d));
            leaf.scale.set(.6, 1.5, .5);
            leaf.position.set(Math.sin(j * 1.26) * .25, .55 + Math.random() * .3, Math.cos(j * 1.26) * .25);
            g.add(leaf);
        }
        this.addRigid(g, new THREE.Vector3(-5 + i * 3.2, .45, 4.6), 'box', new THREE.Vector3(.4, .45, .4), true, { value: 3 });
    }
    createBoss() {
        const skin = this.mat(this.look.skin), suit = this.mat(this.look.suit), hair = this.mat(this.look.hair), shoe = this.mat(0x241f1e);
        const add = (part, pos, shape, radius, half, material) => {
            const geo = shape === 'ball' ? new THREE.SphereGeometry(radius, 16, 12) : new THREE.CapsuleGeometry(radius, half * 2, 5, 10);
            const mesh = new THREE.Mesh(geo, material);
            const e = this.addRigid(mesh, pos, shape, new THREE.Vector3(radius, half, radius), true, { boss: true, part, value: 0 });
            this.boss.push(e);
            this.bossRestPose.set(part, pos.clone());
            return e;
        };
        const hip = add('hip', new THREE.Vector3(0, 2.25, 0), 'capsule', .35, .28, suit);
        this.bossCenter = hip.body;
        const chest = add('chest', new THREE.Vector3(0, 3.05, 0), 'capsule', .52, .38, suit);
        chest.mesh.scale.x = this.look.body;
        const head = add('head', new THREE.Vector3(0, 4.15, 0), 'ball', .62, .62, skin);
        const hairCap = new THREE.Mesh(new THREE.SphereGeometry(.64, 12, 7, 0, Math.PI * 2, 0, Math.PI / 2), hair);
        hairCap.scale.y = .48;
        hairCap.position.y = .25;
        head.mesh.add(hairCap);
        const nose = new THREE.Mesh(new THREE.SphereGeometry(.11, 8, 6), skin);
        nose.position.set(0, .02, .59);
        head.mesh.add(nose);
        for (const x of [-.22, .22]) {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(.055, 8, 6), this.mat(0x171717));
            eye.position.set(x, .16, .57);
            head.mesh.add(eye);
        }
        if (this.look.glasses) {
            const gm = this.mat(0x242424);
            for (const x of [-.22, .22]) {
                const ring = new THREE.Mesh(new THREE.TorusGeometry(.16, .025, 6, 16), gm);
                ring.position.set(x, .15, .6);
                head.mesh.add(ring);
            }
        }
        const tie = new THREE.Mesh(new THREE.ConeGeometry(.12, .7, 4), this.mat(this.look.tie));
        tie.rotation.z = Math.PI;
        tie.position.set(0, .1, .52);
        chest.mesh.add(tie);
        const lu = add('leftArm', new THREE.Vector3(-.72, 3.15, 0), 'capsule', .17, .34, suit), ll = add('leftHand', new THREE.Vector3(-1.15, 2.65, 0), 'capsule', .14, .3, skin);
        const ru = add('rightArm', new THREE.Vector3(.72, 3.15, 0), 'capsule', .17, .34, suit), rl = add('rightHand', new THREE.Vector3(1.15, 2.65, 0), 'capsule', .14, .3, skin);
        const lul = add('leftLeg', new THREE.Vector3(-.28, 1.45, 0), 'capsule', .2, .38, suit), lll = add('leftFoot', new THREE.Vector3(-.28, .6, .12), 'capsule', .18, .32, shoe);
        const rul = add('rightLeg', new THREE.Vector3(.28, 1.45, 0), 'capsule', .2, .38, suit), rll = add('rightFoot', new THREE.Vector3(.28, .6, .12), 'capsule', .18, .32, shoe);
        void chest;
        void head;
        void lu;
        void ll;
        void ru;
        void rl;
        void lul;
        void lll;
        void rul;
        void rll;
        this.setBossStanding();
    }
    setBossStanding() {
        this.bossReaction = 0;
        this.bossReactionTime = 0;
        this.bossDragOffset.set(0, 0, 0);
        this.bossKnocked = false;
        this.bossKnockTime = 0;
        this.boss.forEach(b => {
            const rest = this.bossRestPose.get(b.part || '');
            if (!rest)
                return;
            b.body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true);
            b.body.setNextKinematicTranslation({ x: rest.x, y: rest.y, z: rest.z });
            b.body.setNextKinematicRotation({ x: 0, y: 0, z: 0, w: 1 });
            b.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
            b.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        });
    }
    bind() {
        this.canvas.addEventListener('pointerdown', this.down);
        window.addEventListener('pointermove', this.move);
        window.addEventListener('pointerup', this.up);
        this.canvas.addEventListener('wheel', this.wheel, { passive: false });
        window.addEventListener('resize', this.resize);
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    }
    updatePointer(e) { const r = this.canvas.getBoundingClientRect(); this.mouse.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); }
    down = (e) => { this.updatePointer(e); this.previousPointer.set(e.clientX, e.clientY); if (e.button === 2)
        this.orbiting = true; };
    move = (e) => { this.pointerVelocity.set(e.clientX - this.previousPointer.x, e.clientY - this.previousPointer.y); this.previousPointer.set(e.clientX, e.clientY); if (this.orbiting) {
        this.orbit.yaw -= e.movementX * .005;
        this.orbit.pitch = THREE.MathUtils.clamp(this.orbit.pitch + e.movementY * .004, -.15, .45);
    } this.updatePointer(e); };
    up = (e) => { if (e.button === 2)
        this.orbiting = false; };
    wheel = (e) => { e.preventDefault(); this.orbit.distance = THREE.MathUtils.clamp(this.orbit.distance + e.deltaY * .006, 7, 14); };
    setSettings(s) { Object.assign(this.settings, s); if (s.sfx != null)
        this.audio.volume = s.sfx; }
    setHeldWeapon(id) { this.heldWeapon = id; if (this.heldProp)
        this.scene.remove(this.heldProp); this.heldProp = this.makeHeldProp(id); this.scene.add(this.heldProp); }
    makeHeldProp(id) {
        let prop;
        if (id === 'whip')
            prop = this.makeWhip();
        else if (id === 'slap')
            prop = this.makeHand();
        else if (id === 'slipper')
            prop = this.makeSlipper();
        else if (id === 'keyboard')
            prop = this.makeKeyboard();
        else if (id === 'chair')
            prop = this.makeChair();
        else if (id === 'hammer')
            prop = this.makeHammer();
        else if (id === 'bat')
            prop = this.makeBat();
        else if (id === 'fish')
            prop = this.makeFish();
        else
            prop = this.makeFish();
        const scales = { whip: .72, slap: .62, slipper: .62, keyboard: .55, chair: .48, hammer: .58, bat: .68, fish: .6 };
        prop.scale.setScalar(scales[id] || .55);
        prop.traverse(o => { if (o instanceof THREE.Mesh) {
            o.castShadow = true;
            o.renderOrder = 10;
        } });
        return prop;
    }
    beginCharge(id) { this.chargeWeapon = id; this.chargeStarted = performance.now(); this.audio.tone('whoosh'); }
    releaseCharge(x, y) { if (!this.chargeWeapon)
        return; const charge = THREE.MathUtils.clamp((performance.now() - this.chargeStarted) / 1200, .25, 1); this.useWeapon(this.chargeWeapon, x, y, charge); this.chargeWeapon = null; }
    useWeapon(id, x = innerWidth / 2, y = innerHeight / 2, charge = 1) {
        const mult = this.stats.rage ? 3 : 1, power = { whip: 20, slap: 18, slipper: 24, keyboard: 30, chair: 36, hammer: 52, bat: 44, fish: 30 }[id] * charge * mult;
        if (id === 'whip') {
            this.swingWhip(power, x, y);
            return;
        }
        if (id === 'slap') {
            const part = this.pickBoss(x, y) ?? this.boss.find(b => b.part === 'head');
            this.swingProp(this.makeHand(), power, x, y, '啪！', '巴掌', part.part === 'head' ? 2 : 1);
            return;
        }
        if (id === 'chair') {
            this.throwChair(power, x, y);
            return;
        }
        if (id === 'hammer') {
            this.swingProp(this.makeHammer(), power, x, y, charge > .9 ? '满蓄力！' : '咚！', '充气锤', charge > .9 ? 8 : 5);
            return;
        }
        if (id === 'bat') {
            this.swingBat(power, x, y);
            return;
        }
        if (id === 'fish') {
            this.swingProp(this.makeFish(), power, x, y, '啪叽！', '咸鱼', 4);
            return;
        }
        this.projectile(id, power, x, y);
    }
    makeHand() { const g = new THREE.Group(), skin = this.mat(this.look.skin); const palm = new THREE.Mesh(new THREE.SphereGeometry(.34, 12, 9), skin); palm.scale.set(.85, 1, .38); g.add(palm); for (let i = 0; i < 4; i++) {
        const finger = new THREE.Mesh(new THREE.CapsuleGeometry(.055, .42, 4, 7), skin);
        finger.position.set(-.2 + i * .13, .45, 0);
        finger.rotation.z = (i - 1.5) * .08;
        g.add(finger);
    } const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(.065, .3, 4, 7), skin); thumb.position.set(.34, .08, 0); thumb.rotation.z = -.8; g.add(thumb); return g; }
    makeWhip() { const g = new THREE.Group(), leather = this.mat(0x4b2417, .82), metal = this.mat(0xd7aa4c, .35); const handle = new THREE.Mesh(new THREE.CylinderGeometry(.09, .12, .85, 10), leather); handle.rotation.z = -.35; handle.position.set(-.15, -.25, 0); g.add(handle); const guard = new THREE.Mesh(new THREE.TorusGeometry(.14, .035, 7, 14), metal); guard.rotation.x = Math.PI / 2; guard.position.set(-.29, .14, 0); g.add(guard); const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-.28, .18, 0), new THREE.Vector3(.05, .65, 0), new THREE.Vector3(.55, .88, .03), new THREE.Vector3(1.05, .65, 0), new THREE.Vector3(1.45, .15, 0), new THREE.Vector3(1.72, -.45, 0)]); g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 28, .035, 7, false), leather)); const tip = new THREE.Mesh(new THREE.CapsuleGeometry(.025, .38, 4, 6), this.mat(0x25110c)); tip.position.set(1.78, -.63, 0); tip.rotation.z = .3; g.add(tip); return g; }
    swingWhip(power, x, y) { const prop = this.heldProp; if (!prop || this.heldAnimating)
        return; const hit = this.pickScene(x, y); this.heldAnimating = true; const startQ = prop.quaternion.clone(); gsap.to(prop.rotation, { z: prop.rotation.z - 1.8, y: prop.rotation.y + .65, duration: .12, ease: 'power3.in', onComplete: () => { this.strikeTarget(hit, power, x, y, '啪嚓！', '皮鞭', 3); this.audio.tone('whoosh', 1.5); gsap.to(prop.rotation, { z: prop.rotation.z + 1.8, y: prop.rotation.y - .65, duration: .24, ease: 'elastic.out(1,.35)', onComplete: () => { prop.quaternion.copy(startQ); this.heldAnimating = false; } }); } }); }
    swingBat(power, x, y) { const prop = this.heldProp, bat = prop?.children[0]; if (!prop || !bat || this.heldAnimating)
        return; const hit = this.pickScene(x, y), restAngle = bat.rotation.z, heldPosition = prop.position.clone(); const entryRay = new THREE.Raycaster(); entryRay.setFromCamera(new THREE.Vector2(1.45, -1.35), this.camera); const offscreen = entryRay.ray.origin.clone().add(entryRay.ray.direction.clone().multiplyScalar(3.1)); this.heldAnimating = true; prop.position.copy(offscreen); bat.rotation.z = .05; gsap.to(prop.position, { x: heldPosition.x, y: heldPosition.y, z: heldPosition.z, duration: .22, ease: 'power4.in' }); gsap.to(bat.rotation, { z: Math.PI - .18, duration: .22, ease: 'power4.in', onComplete: () => { this.strikeTarget(hit, power, x, y, '砰！', '棒球棍', 6); this.audio.tone('hit', 2.2); this.shake(.75); gsap.to(bat.rotation, { z: restAngle, duration: .3, ease: 'back.out(1.8)', onComplete: () => { prop.position.copy(heldPosition); this.heldAnimating = false; } }); } }); }
    throwChair(power, x, y) { const model = this.makeChair(); model.scale.setScalar(.82); const pos = this.heldProp?.position.clone() || this.camera.position.clone().add(this.camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(3)); const hit = this.pickScene(x, y); const direction = hit ? hit.point.clone().sub(pos).normalize() : this.raycaster.ray.direction.clone(); const chair = this.addRigid(model, pos, 'box', new THREE.Vector3(.65, .9, .65), true, { value: 8, temporary: true, expiresAt: performance.now() + 6000 }); chair.mesh.name = '投掷办公椅'; const speed = 15 + power * .22; chair.body.setLinvel({ x: direction.x * speed, y: direction.y * speed + .35, z: direction.z * speed }, true); chair.body.setAngvel({ x: 3.5, y: 7, z: 5 }, true); if (this.heldProp) {
        this.heldProp.visible = false;
        setTimeout(() => { if (this.heldProp && this.heldWeapon === 'chair')
            this.heldProp.visible = true; }, 420);
    } this.audio.tone('whoosh', 1.5); this.weaponHits.set('办公椅', (this.weaponHits.get('办公椅') || 0) + 1); }
    swingProp(_prop, power, x, y, label, weapon, points) { const prop = this.heldProp; if (!prop || this.heldAnimating)
        return; const hit = this.pickScene(x, y); this.heldAnimating = true; const start = prop.position.clone(), target = hit?.point || this.raycaster.ray.origin.clone().add(this.raycaster.ray.direction.clone().multiplyScalar(7)); gsap.to(prop.position, { x: target.x, y: target.y, z: target.z, duration: .16, ease: 'power3.in', onComplete: () => { this.strikeTarget(hit, power, x, y, label, weapon, points); gsap.to(prop.position, { x: start.x, y: start.y, z: start.z, duration: .22, ease: 'back.out(1.8)', onComplete: () => { this.heldAnimating = false; } }); } }); gsap.fromTo(prop.rotation, { z: -1.1 }, { z: 1.15, duration: .38, ease: 'power2.inOut' }); }
    showFan() { const fan = this.makeFan(); this.scene.add(fan); this.activeProps.push(fan); fan.position.set(-3, 1.7, 3); fan.rotation.y = .55; fan.scale.setScalar(.9); gsap.from(fan.scale, { x: 0, y: 0, z: 0, duration: .25, ease: 'back.out(2)' }); gsap.to(fan.rotation, { z: Math.PI * 14, duration: 3.5, ease: 'none', onComplete: () => this.removeProp(fan) }); }
    launchRocketChair(x, y) { const chair = this.makeChair(); this.scene.add(chair); this.activeProps.push(chair); chair.position.set(0, 1.1, .4); chair.scale.setScalar(.9); let count = 3; this.events.onDialogue('火箭椅启动：3'); const timer = window.setInterval(() => { count--; if (count > 0) {
        this.events.onDialogue(`火箭椅启动：${count}`);
        return;
    } clearInterval(timer); this.events.onDialogue('起飞！'); this.reactBoss(1.6); this.registerHit(8, '发射！', x, y, '火箭椅'); this.rocketFlames(chair); gsap.to(chair.position, { y: 9, z: -2, duration: 1.2, ease: 'power3.in', onComplete: () => this.removeProp(chair) }); }, 550); }
    rocketFlames(chair) { for (let i = 0; i < 18; i++) {
        const flame = new THREE.Mesh(new THREE.ConeGeometry(.08 + Math.random() * .08, .5 + Math.random() * .5, 6), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffc52f : 0xff5b38 }));
        flame.position.copy(chair.position).add(new THREE.Vector3((Math.random() - .5) * .6, -.7, (Math.random() - .5) * .4));
        this.scene.add(flame);
        this.activeProps.push(flame);
        gsap.to(flame.position, { y: flame.position.y - 3 - Math.random() * 2, duration: .6 + Math.random() * .4, onComplete: () => this.removeProp(flame) });
    } }
    removeProp(prop) { this.scene.remove(prop); this.activeProps = this.activeProps.filter(p => p !== prop); }
    pickBoss(x, y) { const r = this.canvas.getBoundingClientRect(); this.mouse.set((x - r.left) / r.width * 2 - 1, -((y - r.top) / r.height) * 2 + 1); this.raycaster.setFromCamera(this.mouse, this.camera); return this.raycaster.intersectObjects(this.boss.map(b => b.mesh), true)[0]?.object.userData.entity; }
    pickScene(x, y) { const r = this.canvas.getBoundingClientRect(); this.mouse.set((x - r.left) / r.width * 2 - 1, -((y - r.top) / r.height) * 2 + 1); this.raycaster.setFromCamera(this.mouse, this.camera); const hit = this.raycaster.intersectObjects(this.scene.children, true).find(h => h.object.userData.entity); return hit ? { entity: hit.object.userData.entity, point: hit.point.clone(), direction: this.raycaster.ray.direction.clone() } : null; }
    strikeTarget(hit, power, x, y, label, weapon, points) { if (!hit)
        return; if (hit.entity.boss) {
        this.reactBoss(Math.min(1.5, power / 30));
        this.registerHit(points, label, x, y, weapon);
        return;
    } if (!hit.entity.body.isFixed())
        hit.entity.body.applyImpulse({ x: hit.direction.x * power * .55, y: Math.max(1, hit.direction.y * power * .35 + power * .08), z: hit.direction.z * power * .55 }, true); this.registerHit(Math.max(1, Math.min(3, Math.round(points * .5))), hit.entity.mesh.name ? `${hit.entity.mesh.name}！` : '哐！', x, y, weapon); }
    push(_e, power) { this.reactBoss(Math.min(1.5, power / 24)); }
    reactBoss(amount) { if (amount >= .82) {
        this.knockBossDown();
        return;
    } if (this.bossKnocked)
        return; this.bossReaction = Math.max(this.bossReaction, amount); this.bossReactionTime = 0; }
    knockBossDown() { if (this.bossKnocked)
        return; this.selected = null; this.bossDragOffset.set(0, 0, 0); this.bossKnocked = true; this.bossKnockTime = 0; this.events.onDialogue('我先躺一会儿……'); }
    directionToBoss(p) { const b = this.bossCenter.translation(); return new THREE.Vector3(b.x - p.x, b.y - p.y, b.z - p.z).normalize(); }
    projectile(id, power, x, y) { const mesh = id === 'slipper' ? this.makeSlipper() : this.makeKeyboard(); const hit = this.pickScene(x, y); const heldPosition = this.heldProp?.position.clone(); const pos = heldPosition || this.camera.position.clone().add(this.raycaster.ray.direction.clone().multiplyScalar(2.8)); const direction = hit ? hit.point.clone().sub(pos).normalize() : this.raycaster.ray.direction.clone(); const flightSpeed = 18 + power * .35; const size = id === 'keyboard' ? new THREE.Vector3(.82, .12, .32) : new THREE.Vector3(.58, .12, .3); const e = this.addRigid(mesh, pos, 'box', size, true, { value: id === 'keyboard' ? 4 : 2, temporary: true, expiresAt: performance.now() + 5000 }); e.mesh.name = id; e.body.setLinvel({ x: direction.x * flightSpeed, y: direction.y * flightSpeed + .15, z: direction.z * flightSpeed }, true); e.body.setAngvel(id === 'slipper' ? { x: 12, y: 2, z: 7 } : { x: 3, y: 6, z: 2 }, true); if (this.heldProp) {
        this.heldProp.visible = false;
        setTimeout(() => { if (this.heldProp && this.heldWeapon === id)
            this.heldProp.visible = true; }, 280);
    } this.weaponHits.set(id, (this.weaponHits.get(id) || 0) + 1); if (id === 'keyboard')
        setTimeout(() => this.keyExplosion(e), 420); }
    keyExplosion(e) { if (!this.bodyMap.has(e.body.handle))
        return; const p = e.body.translation(); for (let i = 0; i < 10; i++) {
        const k = this.box('键帽', new THREE.Vector3(p.x + (Math.random() - .5), p.y, p.z), new THREE.Vector3(.1, .05, .1), 0x58616d, true, 1);
        k.temporary = true;
        k.expiresAt = performance.now() + 3000;
        k.body.applyImpulse({ x: (Math.random() - .5) * 5, y: Math.random() * 5, z: (Math.random() - .5) * 5 }, true);
    } }
    registerHit(points, label, x, y, weapon) { const stressGain = Math.round(Math.max(.4, points * this.stressGainRate) * 10) / 10; this.stats.hits++; this.stats.stress = Math.min(100, this.stats.stress + stressGain); this.stats.combo++; this.comboTimer = 2.4; this.stats.maxCombo = Math.max(this.stats.maxCombo, this.stats.combo); this.stats.destruction = Math.min(100, this.stats.destruction + points * .45); const n = (this.weaponHits.get(weapon) || 0) + 1; this.weaponHits.set(weapon, n); this.stats.bestWeapon = [...this.weaponHits.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || weapon; this.audio.tone(this.stats.combo > 4 ? 'combo' : 'hit', Math.min(3, points / 3)); this.events.onHit(stressGain, label, x, y); this.events.onDialogue(this.nextHitDialogue()); this.spawnParticles(x, y); this.shake(Math.min(1, points / 8)); this.events.onStats({ ...this.stats }); if (this.stats.stress >= 100 && !this.stats.rage)
        this.startRage(); }
    nextHitDialogue() { let pool = hitDialogues; if (this.stats.combo >= 20)
        pool = comboTaunts.slice(3);
    else if (this.stats.combo >= 10)
        pool = comboTaunts.slice(2);
    else if (this.stats.combo >= 5)
        pool = comboTaunts.slice(0, 3); const choices = pool.filter(line => line !== this.lastHitDialogue); const line = choices[Math.floor(Math.random() * choices.length)] || pool[0]; this.lastHitDialogue = line; return line; }
    startRage() { this.stats.rage = true; this.stats.rageRemaining = 10; this.audio.tone('rage', 3); this.events.onStats({ ...this.stats }); }
    spawnParticles(x, y) { if (!this.settings.particles)
        return; const ray = new THREE.Raycaster(); this.mouse.set(x / innerWidth * 2 - 1, -y / innerHeight * 2 + 1); ray.setFromCamera(this.mouse, this.camera); const p = this.camera.position.clone().add(ray.ray.direction.multiplyScalar(6)); for (let i = 0; i < this.settings.particles * 4; i++) {
        const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(.05 + Math.random() * .08), new THREE.MeshBasicMaterial({ color: [0xffdf53, 0xff765e, 0xffffff][i % 3] }));
        mesh.position.copy(p);
        this.scene.add(mesh);
        this.particles.push({ mesh, born: performance.now(), velocity: new THREE.Vector3((Math.random() - .5) * 5, Math.random() * 4, (Math.random() - .5) * 3) });
    } }
    shake(amount) { if (!this.settings.shake)
        return; gsap.fromTo(this.canvas, { x: (Math.random() - .5) * 12 * amount, y: (Math.random() - .5) * 8 * amount }, { x: 0, y: 0, duration: .25, ease: 'elastic.out(1,.25)' }); }
    collision(a, b) { const ea = this.bodyMap.get(a), eb = this.bodyMap.get(b); if (!ea || !eb)
        return; const boss = ea.boss ? ea : eb.boss ? eb : null, other = boss === ea ? eb : ea; if (!boss || !other || other.value === 0)
        return; const now = performance.now(), key = other.body.handle; if ((this.hitCooldown.get(key) || 0) > now)
        return; const speed = other.body.linvel(), mag = Math.hypot(speed.x, speed.y, speed.z); if (mag < 2.5)
        return; this.hitCooldown.set(key, now + 650); this.reactBoss(Math.min(1.2, mag / 18)); const pts = Math.min(5, Math.max(1, Math.round(mag / 5))) + (other.value && other.value > 5 ? 2 : 0); this.registerHit(pts, other.mesh.name === '显示器' ? '屏幕报销！' : '哐！', innerWidth / 2, innerHeight / 2, other.mesh.name); if (other.mesh.userData.printer && mag > 4)
        this.events.onAchievement('printer', '打印机终于坏了'); }
    recover() { if (!this.bossCenter)
        return; this.selected = null; this.setBossStanding(); this.world.propagateModifiedBodyPositionsToColliders(); this.events.onDialogue(recoverDialogues[Math.floor(Math.random() * recoverDialogues.length)]); this.fallenTimer = 0; }
    update(dt) { if (this.comboTimer > 0) {
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) {
            this.stats.combo = 0;
            this.events.onStats({ ...this.stats });
        }
    } this.idleTimer += dt; if (this.idleTimer > 7) {
        this.idleTimer = 0;
        this.events.onDialogue(idleDialogues[Math.floor(Math.random() * idleDialogues.length)]);
    } if (this.stats.rage) {
        this.stats.rageRemaining = Math.max(0, this.stats.rageRemaining - dt);
        this.events.onStats({ ...this.stats });
        if (this.stats.rageRemaining <= 0) {
            this.stats.rage = false;
            this.events.onStats({ ...this.stats });
            this.events.onRageEnd();
        }
    } this.updateBossPose(dt); this.updateHeldProp(dt); for (const e of this.entities) {
        const p = e.body.translation(), q = e.body.rotation();
        e.mesh.position.set(p.x, p.y, p.z);
        e.mesh.quaternion.set(q.x, q.y, q.z, q.w);
    } this.particles = this.particles.filter(p => { const age = (performance.now() - p.born) / 1000; if (age > .65) {
        this.scene.remove(p.mesh);
        return false;
    } p.velocity.y -= 9.8 * dt; p.mesh.position.addScaledVector(p.velocity, dt); p.mesh.scale.setScalar(1 - age); return true; }); }
    updateHeldProp(dt) { const prop = this.heldProp; if (!prop || this.heldAnimating)
        return; this.raycaster.setFromCamera(this.mouse, this.camera); const target = this.raycaster.ray.origin.clone().add(this.raycaster.ray.direction.clone().multiplyScalar(3.1)); prop.position.lerp(target, 1 - Math.exp(-18 * dt)); const baseQ = this.camera.quaternion.clone(); const tilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(.12, -.35, -.18)); prop.quaternion.slerp(baseQ.multiply(tilt), 1 - Math.exp(-12 * dt)); }
    cleanupTemporary() { const now = performance.now(), temporary = this.entities.filter(e => e.temporary).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)); const remove = new Set(temporary.filter((e, i) => now >= (e.expiresAt || Infinity) || i < temporary.length - 24)); for (const e of remove) {
        this.scene.remove(e.mesh);
        this.bodyMap.delete(e.body.handle);
        this.hitCooldown.delete(e.body.handle);
        this.world.removeRigidBody(e.body);
    } if (remove.size)
        this.entities = this.entities.filter(e => !remove.has(e)); }
    updateBossPose(dt) { if (this.bossKnocked) {
        this.updateKnockdown(dt);
        return;
    } this.bossReactionTime += dt; const decay = Math.exp(-3.3 * this.bossReactionTime); const wobble = Math.sin(this.bossReactionTime * 16) * this.bossReaction * decay; if (decay < .015)
        this.bossReaction = 0; this.boss.forEach(b => { const rest = this.bossRestPose.get(b.part || ''); if (!rest)
        return; const height = (rest.y - .6) / 3.6; const partBoost = b.part === 'head' ? 1.35 : b.part?.includes('Arm') || b.part?.includes('Hand') ? 1.15 : 1; const drag = this.bossDragOffset; const x = rest.x + drag.x + wobble * .34 * height * partBoost; const y = rest.y + drag.y + Math.abs(wobble) * .05; const z = rest.z + drag.z - Math.abs(wobble) * .18 * height; const rz = -wobble * .12 * partBoost, ry = Math.sin(this.bossReactionTime * 11) * this.bossReaction * decay * .08 * partBoost; const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, rz)); b.body.setNextKinematicTranslation({ x, y, z }); b.body.setNextKinematicRotation({ x: q.x, y: q.y, z: q.z, w: q.w }); }); }
    updateKnockdown(dt) { this.bossKnockTime += dt; const t = this.bossKnockTime; let progress; if (t < .48)
        progress = 1 - Math.pow(1 - t / .48, 3);
    else if (t < 2.25)
        progress = 1;
    else if (t < 3.25)
        progress = Math.pow(1 - (t - 2.25), 2);
    else {
        this.setBossStanding();
        this.events.onDialogue(recoverDialogues[Math.floor(Math.random() * recoverDialogues.length)]);
        return;
    } const angle = progress * Math.PI * .5, pivot = new THREE.Vector3(0, .62, 0), q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), angle); this.boss.forEach(b => { const rest = this.bossRestPose.get(b.part || ''); if (!rest)
        return; const p = rest.clone().sub(pivot).applyQuaternion(q).add(pivot); b.body.setNextKinematicTranslation({ x: p.x, y: p.y, z: p.z }); b.body.setNextKinematicRotation({ x: q.x, y: q.y, z: q.z, w: q.w }); }); }
    loop = () => { if (this.disposed)
        return; this.raf = requestAnimationFrame(this.loop); const dt = Math.min(.033, this.clock.getDelta()); this.world.timestep = 1 / this.settings.fps; this.cleanupTemporary(); this.world.step(this.queue); this.queue.drainCollisionEvents((a, b, started) => { if (started)
        this.collision(a, b); }); this.update(dt); const target = new THREE.Vector3(0, 2.1, 0); this.camera.position.set(Math.sin(this.orbit.yaw) * this.orbit.distance, 3.8 + this.orbit.pitch * 6, Math.cos(this.orbit.yaw) * this.orbit.distance); this.camera.lookAt(target); this.renderer.render(this.scene, this.camera); };
    resize = () => { const w = this.canvas.clientWidth, h = this.canvas.clientHeight; this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.renderer.setSize(w, h, false); };
    dispose() { this.disposed = true; cancelAnimationFrame(this.raf); window.removeEventListener('pointermove', this.move); window.removeEventListener('pointerup', this.up); window.removeEventListener('resize', this.resize); this.renderer.dispose(); }
}
