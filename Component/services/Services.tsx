"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/* =====================================================================
   Brothers Card · Services section
   One 3D invitation on a stage. Pick a service and the card flips and
   becomes that craft: design proof, gold foil, letterpress, laser-cut,
   keepsake box. Edit the SERVICES array below to change the copy.
   ===================================================================== */

const GOLD = "#d9b565";
const GOLD_DEEP = "#a8812f";
const MAROON = "#6b1329";
const MAROON_DEEP = "#4a0c1d";
const serif = "Georgia, 'Times New Roman', serif";
const DURATION = 6500; // autoplay ms per service

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => x * x * (3 - 2 * x);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ---------- content ---------- */

const SERVICES = [
  {
    id: "design",
    name: "Custom design",
    line: "Your story, sketched with you.",
    body: "Share your names, colours and traditions. Our designers send a first proof within 48 hours and refine it with you until it feels right.",
    points: [
      "Hindu, Muslim, Christian and Sikh styles",
      "Layouts in the languages your guests read",
      "Proof revisions until you approve",
    ],
    tag: "First proof in 48 hours",
  },
  {
    id: "foil",
    name: "Gold foil stamping",
    line: "Real gold that catches the light.",
    body: "Genuine foil is pressed into 350 GSM textured board, so every border and name shimmers as the card turns in the hand.",
    points: [
      "Real gold foil",
      "350 GSM textured board",
      "Matching envelopes and inserts",
    ],
    tag: "Real gold foil",
  },
  {
    id: "letterpress",
    name: "Letterpress",
    line: "Type you can feel.",
    body: "Letters are pressed deep into soft, heavy paper. The impression is quiet, tactile and unmistakably handmade.",
    points: [
      "Deep, tactile impression",
      "Soft heavyweight paper",
      "Rich ink on ivory stock",
    ],
    tag: "Pressed by hand",
  },
  {
    id: "laser",
    name: "Laser-cut",
    line: "Lace carved from paper.",
    body: "A fine laser traces jaali and floral patterns into the card, layered over a colour backing so the light plays through.",
    points: [
      "Jaali, floral and motif cut-work",
      "Layered over a colour backing",
      "Sharp detail and clean edges",
    ],
    tag: "Intricate cut-work",
  },
  {
    id: "box",
    name: "Invitation boxes",
    line: "Open it like a gift.",
    body: "Invitations arrive in a keepsake box with the card, inserts and small extras tucked inside, then travel to your guests across India.",
    points: [
      "Rigid keepsake boxes",
      "Custom inserts and ribbons",
      "Delivered across India",
    ],
    tag: "Keepsake boxes",
  },
];

const PROMISES = [
  "Custom design in 48 hours",
  "Free samples at your door",
  "Ships in 3 days",
  "Delivered across India",
];

const ICONS = [
  "M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z",
  "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",
  "M5 21h14M8 17h8v-3a4 4 0 00-2-3.5V6a2 2 0 10-4 0v4.5A4 4 0 008 14v3z",
  "M12 2l10 10-10 10L2 12zM12 7l5 5-5 5-5-5z",
  "M21 8l-9-5-9 5v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v8",
];

/* ---------- canvas-drawn textures (no image files needed) ---------- */

const TW = 900;
const TH = 1240;

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

function paintVelvet(g: CanvasRenderingContext2D, mask: boolean) {
  if (mask) {
    g.fillStyle = "#000";
    g.fillRect(0, 0, TW, TH);
    return;
  }
  const bg = g.createLinearGradient(0, 0, TW, TH);
  bg.addColorStop(0, "#8a1c38");
  bg.addColorStop(1, MAROON_DEEP);
  g.fillStyle = bg;
  g.fillRect(0, 0, TW, TH);
  g.strokeStyle = "rgba(217,181,101,0.09)";
  g.lineWidth = 1.5;
  for (let x = -TH; x < TW + TH; x += 48) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x + TH, TH);
    g.stroke();
    g.beginPath();
    g.moveTo(x, TH);
    g.lineTo(x + TH, 0);
    g.stroke();
  }
}

/* 1 · design proof: sketch sheet with crop marks, swatches, flourish */
function makeDesign() {
  const { c, g } = canvas(TW, TH);
  g.fillStyle = "#fbf3e2";
  g.fillRect(0, 0, TW, TH);
  g.strokeStyle = "rgba(107,19,41,0.07)";
  g.lineWidth = 1;
  for (let x = 0; x < TW; x += 40) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, TH);
    g.stroke();
  }
  for (let y = 0; y < TH; y += 40) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(TW, y);
    g.stroke();
  }
  g.strokeStyle = MAROON;
  g.lineWidth = 3;
  g.setLineDash([16, 10]);
  g.strokeRect(64, 64, TW - 128, TH - 128);
  g.setLineDash([]);
  g.lineWidth = 2;
  [
    [30, 30, 1, 1],
    [TW - 30, 30, -1, 1],
    [30, TH - 30, 1, -1],
    [TW - 30, TH - 30, -1, -1],
  ].forEach(([x, y, sx, sy]) => {
    g.beginPath();
    g.moveTo(x, y + sy * 40);
    g.lineTo(x, y);
    g.lineTo(x + sx * 40, y);
    g.stroke();
  });
  g.textAlign = "center";
  g.fillStyle = GOLD_DEEP;
  g.font = `italic 40px ${serif}`;
  g.fillText("First sketch", TW / 2, 230);
  g.fillStyle = MAROON;
  g.font = `italic 128px ${serif}`;
  g.fillText("Aarav", TW / 2, 470);
  g.font = `italic 64px ${serif}`;
  g.fillText("&", TW / 2, 565);
  g.font = `italic 128px ${serif}`;
  g.fillText("Meera", TW / 2, 710);
  g.strokeStyle = GOLD;
  g.lineWidth = 5;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(TW / 2 - 260, 800);
  g.bezierCurveTo(TW / 2 - 120, 750, TW / 2 - 60, 860, TW / 2, 800);
  g.bezierCurveTo(TW / 2 + 60, 740, TW / 2 + 130, 850, TW / 2 + 260, 800);
  g.stroke();
  [MAROON, GOLD, "#c2476a", "#fff1c4"].forEach((col, i) => {
    g.fillStyle = col;
    g.beginPath();
    g.arc(TW / 2 - 165 + i * 110, 950, 40, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = MAROON;
    g.lineWidth = 2;
    g.stroke();
  });
  g.fillStyle = GOLD_DEEP;
  g.font = `italic 36px ${serif}`;
  g.fillText("Proof sent within 48 hours", TW / 2, 1100);
  return c;
}

/* 2 · gold foil on velvet; mask marks the metallic parts */
function makeFoil(mask: boolean) {
  const { c, g } = canvas(TW, TH);
  const gold = mask ? "#fff" : GOLD;
  paintVelvet(g, mask);
  g.strokeStyle = gold;
  g.fillStyle = gold;
  g.lineWidth = 10;
  g.strokeRect(40, 40, TW - 80, TH - 80);
  g.lineWidth = 2.5;
  g.strokeRect(70, 70, TW - 140, TH - 140);
  mandala(g, TW / 2, 330, [150, 110, 70], gold);
  g.textAlign = "center";
  g.font = `italic 130px ${serif}`;
  g.fillText("Aarav", TW / 2, 700);
  g.font = `italic 70px ${serif}`;
  g.fillText("&", TW / 2, 790);
  g.font = `italic 130px ${serif}`;
  g.fillText("Meera", TW / 2, 925);
  g.font = `40px ${serif}`;
  g.fillText("14 February 2027", TW / 2, 1070);
  return c;
}

function makeBack() {
  const { c, g } = canvas(TW, TH);
  paintVelvet(g, false);
  g.strokeStyle = GOLD;
  g.fillStyle = GOLD;
  g.lineWidth = 8;
  g.strokeRect(40, 40, TW - 80, TH - 80);
  g.lineWidth = 2;
  g.strokeRect(68, 68, TW - 136, TH - 136);
  mandala(g, TW / 2, TH / 2, [300, 240, 180], GOLD);
  g.fillStyle = MAROON_DEEP;
  g.beginPath();
  g.arc(TW / 2, TH / 2, 120, 0, Math.PI * 2);
  g.fill();
  g.lineWidth = 4;
  g.stroke();
  g.fillStyle = GOLD;
  g.textAlign = "center";
  g.font = `italic 150px ${serif}`;
  g.fillText("B", TW / 2, TH / 2 + 50);
  return c;
}

/* 3 · letterpress: ink on the map, deep impression on the bump map */
function pressArt(g: CanvasRenderingContext2D, col: string) {
  g.strokeStyle = col;
  g.fillStyle = col;
  g.lineWidth = 8;
  g.strokeRect(50, 50, TW - 100, TH - 100);
  g.lineWidth = 2;
  g.strokeRect(78, 78, TW - 156, TH - 156);
  g.textAlign = "center";
  g.font = `italic 42px ${serif}`;
  g.fillText("Together with their families", TW / 2, 260);
  g.font = `italic 150px ${serif}`;
  g.fillText("Aarav", TW / 2, 480);
  g.font = `italic 70px ${serif}`;
  g.fillText("&", TW / 2, 580);
  g.font = `italic 150px ${serif}`;
  g.fillText("Meera", TW / 2, 740);
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(TW / 2 - 200, 830);
  g.lineTo(TW / 2 + 200, 830);
  g.stroke();
  g.font = `44px ${serif}`;
  g.fillText("request your presence", TW / 2, 930);
  g.font = `bold 52px ${serif}`;
  g.fillText("14 February 2027", TW / 2, 1020);
}

function makePress() {
  const m = canvas(TW, TH);
  m.g.fillStyle = "#f4ead6";
  m.g.fillRect(0, 0, TW, TH);
  for (let i = 0; i < 6000; i++) {
    m.g.fillStyle = `rgba(107,19,41,${Math.random() * 0.05})`;
    m.g.fillRect(Math.random() * TW, Math.random() * TH, 2, 2);
  }
  pressArt(m.g, "rgba(107,19,41,0.88)");
  const b = canvas(TW, TH);
  b.g.fillStyle = "#909090";
  b.g.fillRect(0, 0, TW, TH);
  pressArt(b.g, "#000");
  return { map: m.c, bump: b.c };
}

/* 4 · laser-cut: alpha map punches a jaali lattice around a solid panel */
function makeLaser() {
  const px0 = 190;
  const px1 = TW - 190;
  const py0 = 440;
  const py1 = 800;
  const a = canvas(TW, TH);
  a.g.fillStyle = "#fff";
  a.g.fillRect(0, 0, TW, TH);
  a.g.fillStyle = "#000";
  const inPanel = (x: number, y: number) =>
    x > px0 - 45 && x < px1 + 45 && y > py0 - 45 && y < py1 + 45;
  for (let r = 0, y = 150; y < TH - 150; y += 64, r++) {
    for (let x = 150 + (r % 2) * 32; x < TW - 150; x += 64) {
      if (inPanel(x, y)) continue;
      a.g.beginPath();
      a.g.moveTo(x, y - 22);
      a.g.lineTo(x + 22, y);
      a.g.lineTo(x, y + 22);
      a.g.lineTo(x - 22, y);
      a.g.closePath();
      a.g.fill();
    }
  }
  const m = canvas(TW, TH);
  const bg = m.g.createLinearGradient(0, 0, TW, TH);
  bg.addColorStop(0, "#fff8ea");
  bg.addColorStop(1, "#f1dfb8");
  m.g.fillStyle = bg;
  m.g.fillRect(0, 0, TW, TH);
  m.g.strokeStyle = GOLD_DEEP;
  m.g.lineWidth = 8;
  m.g.strokeRect(50, 50, TW - 100, TH - 100);
  m.g.fillStyle = "#fff9ec";
  m.g.fillRect(px0, py0, px1 - px0, py1 - py0);
  m.g.lineWidth = 4;
  m.g.strokeRect(px0, py0, px1 - px0, py1 - py0);
  m.g.textAlign = "center";
  m.g.fillStyle = MAROON;
  m.g.font = `italic 120px ${serif}`;
  m.g.fillText("Shubh", TW / 2, 590);
  m.g.fillText("Vivah", TW / 2, 745);
  m.g.fillStyle = GOLD_DEEP;
  m.g.font = `italic 34px ${serif}`;
  m.g.fillText("Brothers Card", TW / 2, 1140);
  return { map: m.c, alpha: a.c };
}

/* ---------- the 3D stage ---------- */

function ServiceScene({
  active,
  seen,
  label,
}: {
  active: number;
  seen: boolean;
  label: string;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const seenRef = useRef(false);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);
  useEffect(() => {
    seenRef.current = seen;
  }, [seen]);

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
    renderer.domElement.className = "block h-full w-full";
    renderer.domElement.style.touchAction = "pan-y";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.85;

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
    camera.position.set(0, 0.1, 9);

    scene.add(new THREE.AmbientLight(0xfff0e0, 0.8));
    const key = new THREE.DirectionalLight(0xfff0dc, 2.2);
    key.position.set(3, 5, 6);
    scene.add(key);
    const rim = new THREE.PointLight(0xd9b565, 20, 18);
    rim.position.set(-4, 2, 3);
    scene.add(rim);
    const sweep = new THREE.PointLight(0xffe2a0, 16, 12);
    sweep.position.set(0, 1, 3);
    scene.add(sweep);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const disposables: { dispose: () => void }[] = [];
    const tex = (cv: HTMLCanvasElement, srgb = true) => {
      const t = new THREE.CanvasTexture(cv);
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = maxAniso;
      disposables.push(t);
      return t;
    };
    const reg = <T extends THREE.Material>(m: T) => {
      disposables.push(m);
      return m;
    };

    /* materials */
    const cream = reg(
      new THREE.MeshStandardMaterial({ color: 0xf2e4c4, roughness: 0.85 }),
    );
    const solid = reg(
      new THREE.MeshStandardMaterial({ color: 0x5a0f24, roughness: 0.6 }),
    );
    const goldMat = reg(
      new THREE.MeshStandardMaterial({
        color: 0xd9b565,
        metalness: 1,
        roughness: 0.25,
      }),
    );

    const designMat = reg(
      new THREE.MeshStandardMaterial({
        map: tex(makeDesign()),
        roughness: 0.85,
      }),
    );
    const foilMap = tex(makeFoil(false));
    const foilMask = tex(makeFoil(true), false);
    const foilMat = reg(
      new THREE.MeshPhysicalMaterial({
        map: foilMap,
        metalnessMap: foilMask,
        metalness: 1,
        roughness: 0.38,
        bumpMap: foilMask,
        bumpScale: 2,
        sheen: 1,
        sheenColor: new THREE.Color("#c2476a"),
        sheenRoughness: 0.5,
        emissive: 0xffffff,
        emissiveMap: foilMap,
        emissiveIntensity: 0.12,
      }),
    );
    const press = makePress();
    const pressMat = reg(
      new THREE.MeshStandardMaterial({
        map: tex(press.map),
        bumpMap: tex(press.bump, false),
        bumpScale: 5,
        roughness: 0.95,
      }),
    );
    const laser = makeLaser();
    const laserMat = reg(
      new THREE.MeshStandardMaterial({
        map: tex(laser.map),
        alphaMap: tex(laser.alpha, false),
        alphaTest: 0.5,
        roughness: 0.6,
      }),
    );
    const backTex = tex(makeBack());
    const backMat = reg(
      new THREE.MeshStandardMaterial({
        map: backTex,
        roughness: 0.5,
        metalness: 0.2,
        emissive: 0xffffff,
        emissiveMap: backTex,
        emissiveIntensity: 0.15,
      }),
    );
    const mats: THREE.Material[][] = [
      [cream, cream, cream, cream, designMat, backMat],
      [solid, solid, solid, solid, foilMat, backMat],
      [cream, cream, cream, cream, pressMat, backMat],
      [cream, cream, cream, cream, laserMat, backMat],
      [solid, solid, solid, solid, foilMat, backMat],
    ];

    const root = new THREE.Group();
    scene.add(root);

    /* card + laser backing share one rig so they flip together */
    const cardRig = new THREE.Group();
    const card = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.3, 0.05), mats[0]);
    const lasBack = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 3.3),
      reg(
        new THREE.MeshStandardMaterial({
          color: 0x6b1329,
          roughness: 0.55,
        }),
      ),
    );
    lasBack.position.z = -0.12;
    lasBack.visible = false; // only shown behind the laser-cut face
    cardRig.add(lasBack, card);
    root.add(cardRig);

    /* keepsake box (service 5) */
    const boxG = new THREE.Group();
    boxG.rotation.x = 0.35;
    const boxBase = new THREE.Mesh(new THREE.BoxGeometry(2.9, 1, 1.9), solid);
    const bandA = new THREE.Mesh(
      new THREE.BoxGeometry(2.94, 0.09, 1.94),
      goldMat,
    );
    bandA.position.y = 0.3;
    const lidPivot = new THREE.Group();
    lidPivot.position.set(0, 0.5, -0.95);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.3, 2.0), solid);
    lid.position.set(0, 0.15, 0.95);
    const bandB = new THREE.Mesh(
      new THREE.BoxGeometry(3.04, 0.07, 2.04),
      goldMat,
    );
    bandB.position.set(0, 0.1, 0.95);
    lidPivot.add(lid, bandB);
    const ribbon = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 1.02, 1.94),
      goldMat,
    );
    boxG.add(boxBase, bandA, ribbon, lidPivot);
    boxG.position.y = -3.4;
    boxG.visible = false;
    root.add(boxG);

    /* soft maroon shadow */
    const shadowTex = new THREE.CanvasTexture(
      radial(256, [
        [0, "rgba(40,4,14,0.6)"],
        [1, "rgba(40,4,14,0)"],
      ]),
    );
    disposables.push(shadowTex);
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(5.5, 1.6),
      reg(
        new THREE.MeshBasicMaterial({
          map: shadowTex,
          transparent: true,
          depthWrite: false,
        }),
      ),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -2.45;
    root.add(shadow);

    /* orbiting gold shards for depth */
    const SH = small ? 22 : 36;
    const shardGeo = new THREE.OctahedronGeometry(0.09, 0);
    const shards = new THREE.InstancedMesh(shardGeo, goldMat, SH);
    shards.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    root.add(shards);
    const dummy = new THREE.Object3D();

    /* gold dust */
    const SP = small ? 110 : 200;
    const spPos = new Float32Array(SP * 3);
    for (let i = 0; i < SP; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 1.8 + Math.random() * 2.6;
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
    disposables.push(dotTex);
    const spMat = reg(
      new THREE.PointsMaterial({
        map: dotTex,
        size: 0.16,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    const sparkles = new THREE.Points(spGeo, spMat);
    scene.add(sparkles);

    /* responsive camera: always fit the card and the open box */
    const resize = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const th = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      camera.position.z = Math.max(2.45 / th, 1.95 / (th * camera.aspect));
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

    const st = {
      target: 0,
      flip: 1,
      swapped: true,
      box: 0,
      intro: 0,
      burst: 0,
    };
    const apply = (i: number) => {
      card.material = mats[i];
      lasBack.visible = i === 3;
    };
    apply(0);

    const clock = new THREE.Clock();
    const cur = { x: 0, y: 0 };

    renderer.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      if (!visible) return;

      // new service picked: start a flip, swap the face at the half-turn
      const want = activeRef.current;
      if (want !== st.target) {
        st.target = want;
        st.burst = 1;
        if (reduce) {
          apply(want);
        } else {
          st.flip = 0;
          st.swapped = false;
        }
      }
      if (st.flip < 1) {
        st.flip = Math.min(1, st.flip + dt / 1.1);
        if (!st.swapped && st.flip >= 0.5) {
          apply(st.target);
          st.swapped = true;
        }
      }
      const f = ease(st.flip);
      st.intro +=
        ((seenRef.current ? 1 : 0) - st.intro) *
        (1 - Math.exp(-dt * (reduce ? 30 : 1.8)));
      const I = ease(clamp01(st.intro));
      st.box +=
        ((st.target === 4 ? 1 : 0) - st.box) *
        (1 - Math.exp(-dt * (reduce ? 30 : 3)));
      const B = ease(clamp01(st.box));
      st.burst = Math.max(0, st.burst - dt * 0.9);

      cardRig.rotation.y =
        (reduce ? 0 : f * Math.PI * 2) +
        (reduce ? 0 : Math.sin(t * 0.6) * 0.08);
      cardRig.position.y =
        lerp(0, 0.05, B) + (reduce ? 0 : Math.sin(t * 0.9) * 0.06);
      cardRig.scale.setScalar(
        lerp(1, 0.72, B) * (1 + Math.sin(clamp01(st.flip) * Math.PI) * 0.06),
      );

      boxG.visible = B > 0.01;
      boxG.position.y = lerp(-3.4, -1.65, B);
      boxG.scale.setScalar(lerp(0.6, 1, B));
      lidPivot.rotation.x = -B * 1.75;

      sweep.position.x = Math.sin(t * 0.9) * 3.2;
      sweep.position.y = 1 + Math.cos(t * 0.7) * 1.2;

      for (let k = 0; k < SH; k++) {
        const ang = (k / SH) * Math.PI * 2 + t * 0.3;
        const rad = 2.2 + (k % 5) * 0.16;
        dummy.position.set(
          Math.cos(ang) * rad,
          (((k * 37) % 100) / 100 - 0.5) * 4.2 + Math.sin(t + k) * 0.1,
          Math.sin(ang) * rad * 0.5 - 0.3,
        );
        dummy.rotation.set(t + k, t * 0.7 + k, 0);
        dummy.scale.setScalar(0.6 + 0.5 * Math.sin(t * 1.3 + k) ** 2);
        dummy.updateMatrix();
        shards.setMatrixAt(k, dummy.matrix);
      }
      shards.instanceMatrix.needsUpdate = true;

      spMat.size = 0.16 + st.burst * 0.14;
      sparkles.rotation.y = t * 0.08 + st.burst * 1.4;

      cur.x += (pointer.x - cur.x) * 0.06;
      cur.y += (pointer.y - cur.y) * 0.06;
      root.rotation.y = cur.x * 0.3 + (1 - I) * 1.2;
      root.rotation.x = cur.y * 0.12;
      root.position.y = -(1 - I) * 1;
      root.scale.setScalar(0.6 + 0.4 * I);
      shadow.scale.setScalar(1 + B * 0.4);

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
      });
      disposables.forEach((d) => d.dispose());
      shardGeo.dispose();
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
      role="img"
      aria-label={label}
    />
  );
}

/* ---------- section ---------- */

const css = `
@keyframes kcsBar{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes kcsPop{from{opacity:0;transform:translateY(8px) scale(.96)}to{opacity:1;transform:none}}
@keyframes kcsRise{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
.kcs-bar{animation:kcsBar linear both}
.kcs-pop{animation:kcsPop .6s cubic-bezier(.2,.8,.2,1) both}
.kcs-rise{animation:kcsRise .9s cubic-bezier(.2,.8,.2,1) both}
@media (prefers-reduced-motion:reduce){.kcs-bar,.kcs-pop,.kcs-rise{animation:none}}
`;

const lattice = {
  backgroundImage:
    "repeating-linear-gradient(45deg, rgba(107,19,41,0.045) 0 1px, transparent 1px 38px), repeating-linear-gradient(-45deg, rgba(107,19,41,0.045) 0 1px, transparent 1px 38px)",
};
const stageLattice = {
  backgroundImage:
    "repeating-linear-gradient(45deg, rgba(217,181,101,0.07) 0 1px, transparent 1px 38px), repeating-linear-gradient(-45deg, rgba(217,181,101,0.07) 0 1px, transparent 1px 38px)",
};

export default function Services() {
  const [active, setActive] = useState(0);
  const [picked, setPicked] = useState(false);
  const [hover, setHover] = useState(false);
  const [inView, setInView] = useState(false);
  const [seen, setSeen] = useState(false);
  const [reduce, setReduce] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const io = new IntersectionObserver(
      ([e]) => {
        setInView(e.isIntersecting);
        if (e.isIntersecting) setSeen(true);
      },
      { threshold: 0.2 },
    );
    if (sectionRef.current) io.observe(sectionRef.current);
    return () => io.disconnect();
  }, []);

  // autoplay: advances every few seconds until the visitor picks one
  const running = !picked && !reduce && inView && !hover;
  useEffect(() => {
    if (!running) return;
    const id = setTimeout(
      () => setActive((a) => (a + 1) % SERVICES.length),
      DURATION,
    );
    return () => clearTimeout(id);
  }, [running, active]);

  const rise = (d: number) =>
    seen
      ? { className: "kcs-rise", style: { animationDelay: `${d}ms` } }
      : { className: "opacity-0", style: undefined };
  const cur = SERVICES[active];

  return (
    <section
      id="services"
      ref={sectionRef}
      className="relative isolate overflow-hidden bg-[#fff4de] py-20 text-[#4a0c1d] sm:py-28"
    >
      <style>{css}</style>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_100%_0%,rgba(217,181,101,0.28),transparent_70%),radial-gradient(50%_40%_at_0%_100%,rgba(194,71,106,0.12),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={lattice}
      />

      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        {/* heading */}
        <div className="grid items-end gap-6 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
          <h2
            className={`font-[family-name:var(--font-display)] text-[clamp(2.3rem,5.4vw,4.6rem)] font-medium leading-[1.02] tracking-tight ${rise(0).className}`}
            style={rise(0).style}
          >
            From the first sketch to your guest&rsquo;s doorstep
          </h2>
          <p
            className={`max-w-lg text-base leading-relaxed text-[#4a0c1d]/75 sm:text-lg ${rise(150).className}`}
            style={rise(150).style}
          >
            Design, printing, finishing and delivery happen with one team, so
            your invitation looks on the table exactly as it did in the proof.
          </p>
        </div>

        {/* stage + list */}
        <div className="mt-12 grid items-start gap-8 lg:mt-16 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
          {/* 3D stage (first on mobile) */}
          <div className="relative order-first lg:sticky lg:top-24 lg:order-last">
            <div className="relative overflow-hidden rounded-[28px] border border-[#d9b565]/50 bg-[#4a0c1d] shadow-[0_40px_90px_-30px_rgba(74,12,29,0.75)]">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_70%_30%,rgba(217,181,101,0.22),transparent_70%),radial-gradient(60%_50%_at_0%_100%,rgba(138,28,56,0.9),transparent_70%),linear-gradient(180deg,#3a0817,#5c1126)]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={stageLattice}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-2.5 rounded-[22px] border border-[#d9b565]/25"
              />

              <div className="relative aspect-[4/5] w-full sm:aspect-[6/5] lg:aspect-[4/5]">
                <ServiceScene
                  active={active}
                  seen={seen}
                  label={`3D preview of ${cur.name}`}
                />

                <span
                  key={cur.id}
                  className="kcs-pop pointer-events-none absolute left-4 top-4 rounded-full border border-[#d9b565]/40 bg-[#fff4de]/10 px-4 py-1.5 text-xs font-medium text-[#fff4de] backdrop-blur-md sm:left-6 sm:top-6 sm:text-sm"
                >
                  {cur.tag}
                </span>

                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-[#3a0817]/90 to-transparent px-4 pb-4 pt-12 sm:px-6 sm:pb-5">
                  <p
                    key={cur.id + "n"}
                    className="kcs-pop font-[family-name:var(--font-display)] text-xl italic text-[#f3dc9b] sm:text-2xl"
                  >
                    {cur.name}
                  </p>
                  <a
                    href="#samples"
                    className="shrink-0 rounded-full bg-[linear-gradient(135deg,#f3dc9b,#d9b565_50%,#a8812f)] px-4 py-2 text-xs font-semibold text-[#4a0c1d] transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d9b565] sm:px-5 sm:text-sm"
                  >
                    Order a sample kit
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* service list */}
          <ul
            className="space-y-3"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            {SERVICES.map((s, i) => {
              const on = i === active;
              return (
                <li
                  key={s.id}
                  className={`relative overflow-hidden rounded-2xl border transition-all duration-500 ${
                    on
                      ? "border-[#d9b565] bg-white/70 shadow-[0_24px_50px_-26px_rgba(74,12,29,0.55)]"
                      : "border-[#4a0c1d]/10 bg-white/30 hover:border-[#d9b565]/80"
                  } ${rise(250 + i * 90).className}`}
                  style={rise(250 + i * 90).style}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActive(i);
                      setPicked(true);
                    }}
                    aria-expanded={on}
                    aria-controls={`svc-${s.id}`}
                    className="flex w-full items-center gap-4 p-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#a8812f] sm:p-5"
                  >
                    <span
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-colors duration-500 sm:h-12 sm:w-12 ${
                        on
                          ? "bg-[#4a0c1d] text-[#f3dc9b]"
                          : "bg-[#4a0c1d]/10 text-[#6b1329]"
                      }`}
                    >
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d={ICONS[i]} />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-[family-name:var(--font-display)] text-xl leading-tight sm:text-2xl">
                        {s.name}
                      </span>
                      <span className="mt-0.5 block text-sm text-[#4a0c1d]/65">
                        {s.line}
                      </span>
                    </span>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#a8812f"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`shrink-0 transition-transform duration-500 ${on ? "rotate-180" : ""}`}
                      aria-hidden
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>

                  <div
                    id={`svc-${s.id}`}
                    className={`grid transition-[grid-template-rows] duration-500 ease-out ${on ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-5 pb-6 sm:pl-[5.5rem] sm:pr-6">
                        <p className="text-sm leading-relaxed text-[#4a0c1d]/80 sm:text-base">
                          {s.body}
                        </p>
                        <ul className="mt-4 space-y-2">
                          {s.points.map((p) => (
                            <li
                              key={p}
                              className="flex items-start gap-2.5 text-sm text-[#4a0c1d]/85"
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#a8812f"
                                strokeWidth="2.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="mt-1 shrink-0"
                                aria-hidden
                              >
                                <path d="m5 12 5 5L20 7" />
                              </svg>
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {on && running && (
                    <span
                      aria-hidden
                      className="absolute inset-x-4 bottom-0 h-[3px] overflow-hidden rounded-full bg-[#d9b565]/20"
                    >
                      <span
                        key={`${active}-${running}`}
                        className="kcs-bar block h-full origin-left bg-[linear-gradient(90deg,#a8812f,#f3dc9b)]"
                        style={{ animationDuration: `${DURATION}ms` }}
                      />
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* promises */}
        <ul className="mt-12 grid grid-cols-2 gap-3 sm:mt-16 lg:grid-cols-4">
          {PROMISES.map((p) => (
            <li
              key={p}
              className="flex items-center gap-3 rounded-2xl border border-[#d9b565]/50 bg-white/50 px-4 py-4 text-sm font-medium sm:text-base"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#4a0c1d] text-[#f3dc9b]">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="m5 12 5 5L20 7" />
                </svg>
              </span>
              {p}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
