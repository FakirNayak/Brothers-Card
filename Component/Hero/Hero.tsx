"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/* ---------- palette ---------- */

const GOLD = "#d9b565";
const GOLD_DEEP = "#a8812f";
const MAROON = "#6b1329";
const MAROON_DEEP = "#4a0c1d";
const serif = "Georgia, 'Times New Roman', serif";
const flag = () => window as unknown as { __kcLoaded?: boolean };
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => x * x * (3 - 2 * x);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ---------- canvas-drawn textures (no image files needed) ---------- */

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return { c, g: c.getContext("2d")! };
}

function radial(size: number, stops: [number, string][]) {
  const { c, g } = canvas(size, size);
  const h = size / 2;
  const gr = g.createRadialGradient(h, h, 0, h, h, h);
  stops.forEach(([o, col]) => gr.addColorStop(o, col));
  g.fillStyle = gr;
  g.fillRect(0, 0, size, size);
  return c;
}

function mandala(
  g: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rings: number[],
  color: string,
) {
  g.save();
  g.translate(cx, cy);
  g.strokeStyle = color;
  g.lineWidth = 2.5;
  rings.forEach((r, ri) => {
    const n = 20 + ri * 4;
    for (let i = 0; i < n; i++) {
      g.save();
      g.rotate((i / n) * Math.PI * 2);
      g.beginPath();
      g.ellipse(0, -r, 12 + ri * 2, r * 0.2, 0, 0, Math.PI * 2);
      g.stroke();
      g.restore();
    }
    g.beginPath();
    g.arc(0, 0, r + 6, 0, Math.PI * 2);
    g.stroke();
  });
  g.restore();
}

/* maroon velvet with a faint gold lattice; mask=true gives a black fill */
function paintBase(
  g: CanvasRenderingContext2D,
  W: number,
  H: number,
  mask: boolean,
) {
  if (mask) {
    g.fillStyle = "#000";
    g.fillRect(0, 0, W, H);
    return;
  }
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#8a1c38");
  bg.addColorStop(1, MAROON_DEEP);
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(217,181,101,0.09)";
  g.lineWidth = 1.5;
  for (let x = -H; x < W + H; x += 48) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x + H, H);
    g.stroke();
    g.beginPath();
    g.moveTo(x, H);
    g.lineTo(x + H, 0);
    g.stroke();
  }
}

/* palace-door panel. L / R = outside (an arch that joins across the seam), IN = inside lining */
function makeDoor(side: "L" | "R" | "IN", mask = false) {
  const W = 850;
  const H = 1200;
  const { c, g } = canvas(W, H);
  const gold = mask ? "#fff" : GOLD;
  paintBase(g, W, H, mask);
  g.strokeStyle = gold;
  g.fillStyle = gold;
  g.lineJoin = "round";
  g.lineWidth = 10;
  g.strokeRect(26, 26, W - 52, H - 52);
  g.lineWidth = 2.5;
  g.strokeRect(52, 52, W - 104, H - 104);
  [
    [74, 74],
    [W - 74, 74],
    [74, H - 74],
    [W - 74, H - 74],
  ].forEach(([x, y]) => {
    g.beginPath();
    g.arc(x, y, 9, 0, Math.PI * 2);
    g.fill();
  });
  g.textAlign = "center";
  const cx = W / 2;

  if (side === "IN") {
    mandala(g, cx, H / 2, [250, 190, 130], gold);
    g.font = `italic 44px ${serif}`;
    g.fillText("Brothers Card", cx, H - 120);
    return c;
  }

  const top = 470;
  const arch = (rr: number, lw: number) => {
    g.lineWidth = lw;
    g.beginPath();
    g.moveTo(cx - rr, H - 190);
    g.lineTo(cx - rr, top);
    g.arc(cx, top, rr, Math.PI, 0);
    g.lineTo(cx + rr, H - 190);
    g.closePath();
    g.stroke();
  };
  arch(305, 5);
  arch(278, 2);
  g.font = `italic 150px ${serif}`;
  g.fillText(side === "L" ? "Shubh" : "Vivah", cx, 565);
  g.font = `italic 44px ${serif}`;
  g.fillText(side === "L" ? "Brothers" : "Card", cx, 650);
  mandala(g, cx, 880, [95, 62, 32], gold);
  return c;
}

function makeCardFront() {
  const W = 1500;
  const H = 1000;
  const { c, g } = canvas(W, H);
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#fffaf0");
  bg.addColorStop(1, "#f6e6c4");
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  g.strokeStyle = GOLD_DEEP;
  g.lineWidth = 6;
  g.strokeRect(36, 36, W - 72, H - 72);
  g.lineWidth = 2;
  g.strokeRect(58, 58, W - 116, H - 116);
  [
    [58, 58, 1, 1],
    [W - 58, 58, -1, 1],
    [58, H - 58, 1, -1],
    [W - 58, H - 58, -1, -1],
  ].forEach(([x, y, sx, sy]) => {
    g.save();
    g.translate(x, y);
    g.scale(sx, sy);
    g.lineWidth = 2.5;
    [70, 105, 140].forEach((r) => {
      g.beginPath();
      g.arc(0, 0, r, 0, Math.PI / 2);
      g.stroke();
    });
    g.restore();
  });
  g.textAlign = "center";
  g.fillStyle = GOLD_DEEP;
  g.font = `italic 42px ${serif}`;
  g.fillText("With the blessings of our families", W / 2, 215);
  g.fillStyle = MAROON;
  g.font = `italic 158px ${serif}`;
  g.fillText("Aarav & Meera", W / 2, 440);
  g.strokeStyle = GOLD_DEEP;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(W / 2 - 330, 520);
  g.lineTo(W / 2 - 30, 520);
  g.moveTo(W / 2 + 30, 520);
  g.lineTo(W / 2 + 330, 520);
  g.stroke();
  g.fillStyle = GOLD_DEEP;
  g.beginPath();
  g.moveTo(W / 2, 502);
  g.lineTo(W / 2 + 16, 520);
  g.lineTo(W / 2, 538);
  g.lineTo(W / 2 - 16, 520);
  g.fill();
  g.fillStyle = MAROON;
  g.font = `44px ${serif}`;
  g.fillText("request the honour of your presence", W / 2, 625);
  g.font = `bold 56px ${serif}`;
  g.fillText("14 February 2027, Bengaluru", W / 2, 722);
  g.fillStyle = GOLD_DEEP;
  g.font = `italic 38px ${serif}`;
  g.fillText("Reception and dinner to follow", W / 2, 790);
  g.font = `30px ${serif}`;
  g.fillText("Brothers Card", W / 2, 885);
  return c;
}

function makeCardBack() {
  const W = 1500;
  const H = 1000;
  const { c, g } = canvas(W, H);
  paintBase(g, W, H, false);
  g.strokeStyle = GOLD;
  g.lineWidth = 6;
  g.strokeRect(36, 36, W - 72, H - 72);
  g.lineWidth = 2;
  g.strokeRect(58, 58, W - 116, H - 116);
  mandala(g, W / 2, H / 2, [330, 270, 210], GOLD);
  g.fillStyle = MAROON_DEEP;
  g.beginPath();
  g.arc(W / 2, H / 2, 140, 0, Math.PI * 2);
  g.fill();
  g.lineWidth = 4;
  g.stroke();
  g.fillStyle = GOLD;
  g.textAlign = "center";
  g.font = `italic 170px ${serif}`;
  g.fillText("B", W / 2, H / 2 + 56);
  return c;
}

function makeSeal() {
  const { c, g } = canvas(256, 256);
  const gr = g.createRadialGradient(100, 90, 10, 128, 128, 128);
  gr.addColorStop(0, "#fff1c4");
  gr.addColorStop(0.55, GOLD);
  gr.addColorStop(1, GOLD_DEEP);
  g.fillStyle = gr;
  g.beginPath();
  g.arc(128, 128, 126, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = GOLD_DEEP;
  g.lineWidth = 6;
  g.beginPath();
  g.arc(128, 128, 104, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = MAROON;
  g.textAlign = "center";
  g.font = `italic 150px ${serif}`;
  g.fillText("B", 128, 178);
  return c;
}

function makeRay() {
  const { c, g } = canvas(64, 256);
  const gr = g.createLinearGradient(0, 0, 64, 0);
  gr.addColorStop(0, "rgba(255,220,140,0)");
  gr.addColorStop(0.5, "rgba(255,232,170,0.9)");
  gr.addColorStop(1, "rgba(255,220,140,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 256);
  const fade = g.createLinearGradient(0, 0, 0, 256);
  fade.addColorStop(0, "rgba(0,0,0,1)");
  fade.addColorStop(0.5, "rgba(0,0,0,0)");
  fade.addColorStop(1, "rgba(0,0,0,1)");
  g.globalCompositeOperation = "destination-out";
  g.fillStyle = fade;
  g.fillRect(0, 0, 64, 256);
  return c;
}

/* ---------- Three.js scene: royal gatefold invitation that swings open ---------- */

function CardScene({
  open,
  ready,
  onToggle,
}: {
  open: boolean;
  ready: boolean;
  onToggle: () => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(0);
  const introRef = useRef(0);

  useEffect(() => {
    openRef.current = open ? 1 : 0;
  }, [open]);
  useEffect(() => {
    introRef.current = ready ? 1 : 0;
  }, [ready]);

  useEffect(() => {
    const mount = mountRef.current!;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const small = window.innerWidth < 640;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.domElement.className = "block h-full w-full cursor-pointer";
    renderer.domElement.style.touchAction = "pan-y";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.8;

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 60);
    camera.position.set(0, 0.1, 8);

    scene.add(new THREE.AmbientLight(0xfff0e0, 0.8));
    const key = new THREE.DirectionalLight(0xfff0dc, 2.2);
    key.position.set(3, 5, 6);
    scene.add(key);
    const rim = new THREE.PointLight(0xd9b565, 22, 18);
    rim.position.set(-4, 2, 3);
    scene.add(rim);
    const spot = new THREE.PointLight(0xffe2a0, 0, 10);
    spot.position.set(0, 0.5, 2.5);
    scene.add(spot);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const textures: THREE.Texture[] = [];
    const tex = (cv: HTMLCanvasElement, srgb = true) => {
      const t = new THREE.CanvasTexture(cv);
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = maxAniso;
      textures.push(t);
      return t;
    };

    // velvet + real gold foil (gold reflects, maroon stays matte)
    const velvet = (map: THREE.Texture, mask: THREE.Texture) =>
      new THREE.MeshPhysicalMaterial({
        map,
        metalnessMap: mask,
        metalness: 1,
        roughness: 0.4,
        bumpMap: mask,
        bumpScale: 2,
        sheen: 1,
        sheenColor: new THREE.Color("#c2476a"),
        sheenRoughness: 0.5,
        emissive: 0xffffff,
        emissiveMap: map,
        emissiveIntensity: 0.12,
      });
    const solid = new THREE.MeshStandardMaterial({
      color: 0x5a0f24,
      roughness: 0.6,
    });

    const root = new THREE.Group();
    scene.add(root);

    const BW = 3.4; // closed width
    const BH = 2.4; // height
    const DW = BW / 2; // one door

    // backing + spine frame
    const back = new THREE.Mesh(new THREE.BoxGeometry(BW, BH, 0.06), solid);
    back.position.z = -0.05;
    const spineH = new THREE.BoxGeometry(BW + 0.05, 0.05, 0.16);
    const spineV = new THREE.BoxGeometry(0.05, BH, 0.16);
    const sTop = new THREE.Mesh(spineH, solid);
    sTop.position.y = BH / 2;
    const sBot = new THREE.Mesh(spineH, solid);
    sBot.position.y = -BH / 2;
    const sL = new THREE.Mesh(spineV, solid);
    sL.position.x = -BW / 2;
    const sR = new THREE.Mesh(spineV, solid);
    sR.position.x = BW / 2;
    root.add(back, sTop, sBot, sL, sR);

    // light rays behind the card (additive sunburst)
    const rayTex = new THREE.CanvasTexture(makeRay());
    textures.push(rayTex);
    const rayMat = new THREE.MeshBasicMaterial({
      map: rayTex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const rays = new THREE.Group();
    rays.position.z = -0.7;
    const rayGeo = new THREE.PlaneGeometry(0.9, 8);
    const RAYS = 9;
    for (let i = 0; i < RAYS; i++) {
      const m = new THREE.Mesh(rayGeo, rayMat);
      m.rotation.z = (i / RAYS) * Math.PI;
      rays.add(m);
    }
    root.add(rays);

    // the invitation card, tucked between the doors
    const paper = new THREE.MeshStandardMaterial({
      color: 0xf6e6c4,
      roughness: 0.8,
    });
    const cardFrontTex = tex(makeCardFront());
    const cardBackTex = tex(makeCardBack());
    const cardFrontMat = new THREE.MeshStandardMaterial({
      map: cardFrontTex,
      roughness: 0.7,
      emissive: 0xffffff,
      emissiveMap: cardFrontTex,
      emissiveIntensity: 0.35,
    });
    const cardBackMat = new THREE.MeshStandardMaterial({
      map: cardBackTex,
      roughness: 0.5,
      metalness: 0.2,
      emissive: 0xffffff,
      emissiveMap: cardBackTex,
      emissiveIntensity: 0.2,
    });
    const card = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.0, 0.02), [
      paper,
      paper,
      paper,
      paper,
      cardFrontMat,
      cardBackMat,
    ]);
    root.add(card);

    // two palace doors hinged at the outer edges
    const inTex = tex(makeDoor("IN"));
    const inMask = tex(makeDoor("IN", true), false);
    const inMat = velvet(inTex, inMask);
    const doorGeo = new THREE.BoxGeometry(DW, BH, 0.06);
    const makeDoorMesh = (side: "L" | "R") => {
      const outTex = tex(makeDoor(side));
      const outMask = tex(makeDoor(side, true), false);
      const mesh = new THREE.Mesh(doorGeo, [
        solid,
        solid,
        solid,
        solid,
        velvet(outTex, outMask), // +z outside
        inMat, // -z inside
      ]);
      const hinge = new THREE.Group();
      hinge.position.set(side === "L" ? -BW / 2 : BW / 2, 0, 0.05);
      mesh.position.x = side === "L" ? DW / 2 : -DW / 2;
      hinge.add(mesh);
      root.add(hinge);
      return hinge;
    };
    const doorL = makeDoorMesh("L");
    const doorR = makeDoorMesh("R");

    // gold clasp that spins away when the doors open
    const seal = new THREE.Group();
    seal.position.set(0, 0, 0.11);
    const sealBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.34, 0.07, 48),
      new THREE.MeshStandardMaterial({
        color: 0xd9b565,
        metalness: 1,
        roughness: 0.28,
      }),
    );
    sealBody.rotation.x = Math.PI / 2;
    const sealTex = tex(makeSeal());
    const sealFace = new THREE.Mesh(
      new THREE.CircleGeometry(0.31, 48),
      new THREE.MeshStandardMaterial({
        map: sealTex,
        metalness: 0.6,
        roughness: 0.3,
      }),
    );
    sealFace.position.z = 0.037;
    seal.add(sealBody, sealFace);
    root.add(seal);

    // soft ground shadow (maroon, never black)
    const shadowTex = new THREE.CanvasTexture(
      radial(256, [
        [0, "rgba(58,8,23,0.65)"],
        [1, "rgba(58,8,23,0)"],
      ]),
    );
    textures.push(shadowTex);
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 2.4),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -BH / 2 - 0.4;
    root.add(shadow);

    // petals
    const PETALS = small ? 48 : 80;
    const petals = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(0.15, 0.22),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.88,
      }),
      PETALS,
    );
    const palette = ["#e8a0b4", "#c2476a", "#d9b565", "#ffe3c8"].map(
      (c) => new THREE.Color(c),
    );
    const pd = Array.from({ length: PETALS }, (_, i) => {
      petals.setColorAt(i, palette[i % palette.length]);
      return {
        x: (Math.random() - 0.5) * 10,
        y: (Math.random() - 0.5) * 9,
        z: Math.random() * 5 - 2.5,
        s: 0.15 + Math.random() * 0.3,
        r: 0.4 + Math.random() * 1.2,
        p: Math.random() * 6.28,
      };
    });
    scene.add(petals);
    const dummy = new THREE.Object3D();

    // gold dust
    const SP = small ? 120 : 220;
    const spPos = new Float32Array(SP * 3);
    for (let i = 0; i < SP; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 1.8 + Math.random() * 2.8;
      spPos[i * 3] = Math.cos(a) * r;
      spPos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      spPos[i * 3 + 2] = Math.sin(a) * r * 0.6;
    }
    const spGeo = new THREE.BufferGeometry();
    spGeo.setAttribute("position", new THREE.BufferAttribute(spPos, 3));
    const dotTex = new THREE.CanvasTexture(
      radial(64, [
        [0, "rgba(255,240,200,1)"],
        [0.3, "rgba(255,220,140,0.6)"],
        [1, "rgba(255,220,140,0)"],
      ]),
    );
    textures.push(dotTex);
    const spMat = new THREE.PointsMaterial({
      map: dotTex,
      size: 0.18,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const sparkles = new THREE.Points(spGeo, spMat);
    scene.add(sparkles);

    // responsive camera: fit the closed box, pull back to fit the open doors
    const view = { c: 7, o: 9 };
    const resize = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const th = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const fit = (hw: number, hh: number) =>
        Math.max(hh / th, hw / (th * camera.aspect));
      view.c = fit(2.15, 1.75);
      view.o = fit(3.5, 2.05);
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const pointer = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      const r = mount.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      pointer.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    const onLeave = () => {
      pointer.x = 0;
      pointer.y = 0;
    };
    mount.addEventListener("pointermove", onMove);
    mount.addEventListener("pointerleave", onLeave);

    let visible = true;
    const io = new IntersectionObserver(
      ([en]) => (visible = en.isIntersecting),
    );
    io.observe(mount);

    const clock = new THREE.Clock();
    let prog = reduce ? 1 : 0;
    let intro = reduce ? 1 : 0;
    const cur = { x: 0, y: 0 };

    renderer.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      if (!visible) return;

      intro +=
        (introRef.current - intro) * (1 - Math.exp(-dt * (reduce ? 30 : 1.6)));
      prog +=
        (openRef.current - prog) * (1 - Math.exp(-dt * (reduce ? 30 : 1.3)));
      const e = ease(prog);
      const i = ease(intro);

      // phases: clasp spins off -> doors swing -> card glides out -> settle
      const t0 = ease(clamp01(e / 0.12));
      const t1 = ease(clamp01((e - 0.08) / 0.5));
      const t2 = ease(clamp01((e - 0.5) / 0.4));
      const t3 = ease(clamp01((e - 0.85) / 0.15));

      doorL.rotation.y = t1 * 2.3;
      doorR.rotation.y = -t1 * 2.3;
      seal.scale.setScalar(Math.max(0.0001, 1 - t0));
      seal.rotation.z = t0 * 4;
      seal.visible = t0 < 0.99;

      card.position.set(0, t2 * 0.06, t2 * 0.9);
      card.scale.setScalar(1 + t2 * 0.12 + t3 * 0.03);
      card.rotation.y = reduce ? 0 : Math.sin(t * 0.7) * 0.05 * t2;
      card.rotation.x = -t3 * 0.03;

      rays.rotation.z = t * 0.06;
      rays.scale.setScalar(0.6 + e * 0.5);
      rayMat.opacity = e * 0.45;
      spot.intensity = e * 22;

      cur.x += (pointer.x - cur.x) * 0.06;
      cur.y += (pointer.y - cur.y) * 0.06;
      root.rotation.y =
        cur.x * 0.35 +
        (reduce ? 0 : Math.sin(t * 0.5) * 0.08) -
        (1 - e) * 0.2 +
        (1 - i) * 1.3;
      root.rotation.x = cur.y * 0.14 + 0.06 * (1 - e);
      root.position.y = (reduce ? 0 : Math.sin(t * 0.9) * 0.06) - (1 - i) * 1.4;
      root.scale.setScalar(0.7 + 0.3 * i);
      shadow.scale.setScalar(1 + e * 0.5);
      camera.position.z = lerp(view.c, view.o, e);

      if (!reduce) {
        for (let k = 0; k < PETALS; k++) {
          const d = pd[k];
          d.y -= d.s * dt;
          if (d.y < -4.6) d.y = 4.6;
          dummy.position.set(d.x + Math.sin(t * 0.6 + d.p) * 0.5, d.y, d.z);
          dummy.rotation.set(t * d.r + d.p, t * d.r * 0.7, d.p);
          dummy.updateMatrix();
          petals.setMatrixAt(k, dummy.matrix);
        }
        petals.instanceMatrix.needsUpdate = true;
        sparkles.rotation.y = t * 0.08;
        sparkles.scale.setScalar(0.85 + e * 0.35);
        spMat.opacity = 0.35 + e * 0.35 + Math.sin(t * 1.5) * 0.15;
      }
      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      ro.disconnect();
      io.disconnect();
      mount.removeEventListener("pointermove", onMove);
      mount.removeEventListener("pointerleave", onLeave);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mats = Array.isArray(m.material)
          ? m.material
          : m.material
            ? [m.material]
            : [];
        mats.forEach((mt) => mt.dispose());
      });
      textures.forEach((x) => x.dispose());
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="h-full w-full"
      onClick={onToggle}
      role="img"
      aria-label="A 3D maroon and gold wedding invitation whose palace doors swing open to reveal the card"
    />
  );
}

/* ---------- Hero section ---------- */

const css = `
@keyframes kcRise{from{transform:translateY(108%)}to{transform:none}}
@keyframes kcFade{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes kcSpin{to{transform:rotate(360deg)}}
@keyframes kcFloat{from{transform:translateY(-6px)}to{transform:translateY(8px)}}
@keyframes kcMarquee{to{transform:translateX(-50%)}}
@keyframes kcShimmer{from{background-position:200% 0}to{background-position:-200% 0}}
.kc-rise{animation:kcRise 1.2s cubic-bezier(.2,.8,.2,1) both}
.kc-fade{animation:kcFade 1s ease-out both}
.kc-spin{animation:kcSpin 24s linear infinite}
.kc-float{animation:kcFloat 6s ease-in-out infinite alternate}
.kc-marquee{animation:kcMarquee 45s linear infinite}
.kc-shimmer{animation:kcShimmer 7s linear infinite}
@media (prefers-reduced-motion:reduce){.kc-rise,.kc-fade,.kc-spin,.kc-float,.kc-marquee,.kc-shimmer{animation:none}}
`;

const lattice = {
  backgroundImage:
    "repeating-linear-gradient(45deg, rgba(217,181,101,0.06) 0 1px, transparent 1px 38px), repeating-linear-gradient(-45deg, rgba(217,181,101,0.06) 0 1px, transparent 1px 38px)",
};

const tags = [
  "Hindu",
  "Muslim",
  "Christian",
  "Sikh",
  "Destination",
  "Minimal",
  "Royal foil",
  "Laser-cut",
];

export default function Hero() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  // wait for the loader doors (falls back after 6s)
  useEffect(() => {
    if (flag().__kcLoaded) {
      setReady(true);
      return;
    }
    const on = () => setReady(true);
    window.addEventListener("kc:loaded", on);
    const fb = setTimeout(on, 15000);
    return () => {
      window.removeEventListener("kc:loaded", on);
      clearTimeout(fb);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const id = setTimeout(() => setOpen(true), 1600);
    return () => clearTimeout(id);
  }, [ready]);

  const a = (cls: string) => (ready ? cls : "opacity-0");

  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-[#4a0c1d] text-[#fff4de]">
      <style>{css}</style>

      {/* Atmosphere: maroon depth, soft gold light, lattice, ornate frame (no circles) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(80%_70%_at_78%_45%,rgba(217,181,101,0.16),transparent_75%),radial-gradient(55%_55%_at_5%_100%,rgba(138,28,56,0.9),transparent_70%),linear-gradient(180deg,#3a0817_0%,#4a0c1d_45%,#5c1126_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={lattice}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-3 -z-0 rounded-[28px] border border-[#d9b565]/25 sm:inset-5"
      />

      <div className="mx-auto grid min-h-[100svh] max-w-7xl items-center gap-4 px-6 pb-28 pt-28 sm:px-10 lg:grid-cols-[1fr_1.05fr] lg:gap-10 lg:pt-24">
        {/* Copy */}
        <div className="text-center lg:text-left">
          <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.9rem,7.4vw,6.4rem)] font-medium leading-[0.98] tracking-tight">
            <span className="block overflow-hidden pb-1">
              <span
                className={`block ${a("kc-rise")}`}
                style={{ animationDelay: "100ms" }}
              >
                Wedding cards
              </span>
            </span>
            <span className="block overflow-hidden pb-3">
              <span
                className={`block ${a("kc-rise")}`}
                style={{ animationDelay: "260ms" }}
              >
                <span className="kc-shimmer block bg-[linear-gradient(110deg,#a8812f_20%,#fff1c4_45%,#d9b565_55%,#a8812f_80%)] bg-[length:200%_100%] bg-clip-text italic text-transparent">
                  crafted like heirlooms.
                </span>
              </span>
            </span>
          </h1>

          <p
            className={`mx-auto mt-6 max-w-[34rem] text-base leading-relaxed text-[#fff4de]/80 sm:text-lg lg:mx-0 ${a("kc-fade")}`}
            style={{ animationDelay: "650ms" }}
          >
            Brothers Card makes foil-stamped, letterpress and laser-cut
            invitations, designed with you and delivered to your guests anywhere
            in India.
          </p>

          <div
            className={`mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start ${a("kc-fade")}`}
            style={{ animationDelay: "850ms" }}
          >
            <a
              href="#collections"
              className="group relative w-full overflow-hidden rounded-full bg-[linear-gradient(135deg,#f3dc9b,#d9b565_50%,#a8812f)] px-9 py-4 text-center font-semibold text-[#4a0c1d] shadow-[0_10px_40px_-10px_rgba(217,181,101,0.7)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_50px_-8px_rgba(217,181,101,0.9)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d9b565] sm:w-auto"
            >
              <span className="relative z-10">Browse collections</span>
              <span
                aria-hidden
                className="absolute inset-y-0 -left-full w-1/2 -skew-x-12 bg-white/60 transition-all duration-700 group-hover:left-[130%]"
              />
            </a>
            <a
              href="#samples"
              className="w-full rounded-full border border-[#d9b565]/50 bg-[#fff4de]/5 px-9 py-4 text-center font-semibold backdrop-blur transition hover:border-[#d9b565] hover:bg-[#d9b565]/15 hover:text-[#f3dc9b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d9b565] sm:w-auto"
            >
              Order a sample kit
            </a>
          </div>

          <ul
            className={`mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[#fff4de]/75 lg:justify-start ${a("kc-fade")}`}
            style={{ animationDelay: "1050ms" }}
          >
            {[
              "Custom design in 48 hours",
              "Free samples at your door",
              "Delivered across India",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#d9b565"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="m5 12 5 5L20 7" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* 3D gatefold invitation */}
        <div
          className={`relative mx-auto w-full max-w-[680px] transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`}
        >
          <div className="relative aspect-[5/6] w-full sm:aspect-[4/3] lg:aspect-[5/4]">
            <CardScene
              open={open}
              ready={ready}
              onToggle={() => setOpen((o) => !o)}
            />

            {/* Glass chips */}
            <div className="kc-float absolute bottom-4 left-0 hidden rounded-2xl border border-[#d9b565]/30 bg-[#fff4de]/10 px-4 py-3 text-sm shadow-xl backdrop-blur-md sm:block">
              <p className="font-semibold text-[#fff4de]">Real gold foil</p>
              <p className="text-xs text-[#fff4de]/70">
                350 GSM textured board
              </p>
            </div>
            <div
              className="kc-float absolute right-0 top-[8%] hidden rounded-2xl border border-[#d9b565]/30 bg-[#fff4de]/10 px-4 py-3 text-sm shadow-xl backdrop-blur-md sm:block"
              style={{ animationDelay: "-3s" }}
            >
              <p className="font-semibold text-[#fff4de]">Ships in 3 days</p>
              <p className="text-xs text-[#fff4de]/70">Free sample kit first</p>
            </div>
          </div>

          <div className="relative mt-2 flex justify-center">
            <button
              onClick={() => setOpen((o) => !o)}
              className="rounded-full border border-[#d9b565]/50 bg-[#4a0c1d]/60 px-5 py-2.5 text-sm font-medium backdrop-blur transition hover:border-[#d9b565] hover:text-[#f3dc9b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d9b565]"
            >
              {open ? "Close the invitation" : "Open the invitation"}
            </button>
          </div>
        </div>
      </div>

      {/* Marquee */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 overflow-hidden border-t border-[#d9b565]/30 bg-[#3a0817]/70 py-4 backdrop-blur"
      >
        <div className="kc-marquee flex w-max items-center gap-10 whitespace-nowrap font-[family-name:var(--font-display)] text-2xl italic text-[#fff4de]/45 sm:text-3xl">
          {[...tags, ...tags].map((t, i) => (
            <span key={i} className="flex items-center gap-10">
              {t}
              <span className="text-base text-[#d9b565]">✦</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
