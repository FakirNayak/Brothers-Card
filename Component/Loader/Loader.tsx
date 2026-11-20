"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const flag = () => window as unknown as { __kcLoaded?: boolean };
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => x * x * (3 - 2 * x);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function dotTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,240,200,1)");
  gr.addColorStop(0.3, "rgba(255,220,140,0.6)");
  gr.addColorStop(1, "rgba(255,220,140,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return c;
}

/* ---------- 3D golden armillary: rings assemble around a glowing jewel ---------- */

const RINGS = [
  {
    r: 2.0,
    tube: 0.04,
    tx: 1.2,
    ty: 0.0,
    sx: 0.32,
    sy: 0.18,
    scatter: 2.6,
    orbs: 2,
  },
  {
    r: 1.62,
    tube: 0.034,
    tx: 0.4,
    ty: 1.0,
    sx: -0.28,
    sy: 0.4,
    scatter: -3.1,
    orbs: 1,
  },
  {
    r: 1.25,
    tube: 0.03,
    tx: 1.9,
    ty: 0.5,
    sx: 0.5,
    sy: -0.3,
    scatter: 3.6,
    orbs: 2,
  },
  {
    r: 2.35,
    tube: 0.022,
    tx: 0.2,
    ty: 0.2,
    sx: 0.14,
    sy: 0.24,
    scatter: -2.2,
    orbs: 0,
  },
];

function ArmillaryScene({
  progress,
  onReady,
}: {
  progress: React.MutableRefObject<number>;
  onReady: () => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const readyCb = useRef(onReady);
  readyCb.current = onReady;

  useEffect(() => {
    const mount = mountRef.current!;
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    const boot = (): (() => void) | undefined => {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const small = window.innerWidth < 640;

      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        });
      } catch {
        // no WebGL: the CSS emblem keeps playing, loader still finishes
        readyCb.current();
        return undefined;
      }
      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, small ? 1.5 : 2),
      );
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
      renderer.domElement.className = "block h-full w-full";
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTex;
      scene.environmentIntensity = 1;

      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 60);
      camera.position.set(0, 0.8, 9.5);

      scene.add(new THREE.AmbientLight(0xffe8d0, 0.45));
      const key = new THREE.DirectionalLight(0xfff0dc, 2.2);
      key.position.set(3, 5, 4);
      scene.add(key);
      const rose = new THREE.PointLight(0xff7a9c, 20, 14);
      rose.position.set(-4, 1, 3);
      scene.add(rose);
      const core = new THREE.PointLight(0xffd27a, 0, 8);
      scene.add(core);

      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xd9b565,
        metalness: 1,
        roughness: 0.22,
      });
      const paleMat = new THREE.MeshStandardMaterial({
        color: 0xf3dc9b,
        metalness: 1,
        roughness: 0.18,
      });

      const world = new THREE.Group();
      scene.add(world);

      const ringObjs = RINGS.map((d, i) => {
        const grp = new THREE.Group();
        const torus = new THREE.Mesh(
          new THREE.TorusGeometry(d.r, d.tube, 16, 180),
          i % 2 ? paleMat : goldMat,
        );
        grp.add(torus);
        const orbs: THREE.Mesh[] = [];
        for (let k = 0; k < d.orbs; k++) {
          const o = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 24, 24),
            paleMat,
          );
          grp.add(o);
          orbs.push(o);
        }
        world.add(grp);
        return { grp, torus, orbs, d };
      });

      const gemGeo = new THREE.OctahedronGeometry(0.46, 0);
      const gem = new THREE.Mesh(
        gemGeo,
        new THREE.MeshStandardMaterial({
          color: 0xfff3d0,
          emissive: 0xffc864,
          emissiveIntensity: 1.4,
          metalness: 0.4,
          roughness: 0.08,
          flatShading: true,
        }),
      );
      const cageMat = new THREE.MeshBasicMaterial({
        color: 0xf3dc9b,
        wireframe: true,
        transparent: true,
        opacity: 0.7,
      });
      const cage = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.78, 0),
        cageMat,
      );
      world.add(gem, cage);

      const SHARDS = small ? 28 : 44;
      const shardGeo = new THREE.OctahedronGeometry(0.07, 0);
      const shards = new THREE.InstancedMesh(shardGeo, goldMat, SHARDS);
      shards.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      scene.add(shards);

      const SP = small ? 110 : 190;
      const sp = new Float32Array(SP * 3);
      const speed = new Float32Array(SP);
      for (let i = 0; i < SP; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * 2.6;
        sp[i * 3] = Math.cos(a) * r;
        sp[i * 3 + 1] = Math.random() * 5 - 2.4;
        sp[i * 3 + 2] = Math.sin(a) * r;
        speed[i] = 0.2 + Math.random() * 0.45;
      }
      const spGeo = new THREE.BufferGeometry();
      spGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
      const dot = new THREE.CanvasTexture(dotTexture());
      const dustMat = new THREE.PointsMaterial({
        map: dot,
        size: 0.14,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const dust = new THREE.Points(spGeo, dustMat);
      scene.add(dust);

      const resize = () => {
        const w = mount.clientWidth || 1;
        const h = mount.clientHeight || 1;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(mount);

      const dummy = new THREE.Object3D();
      const clock = new THREE.Clock();
      let notified = false;

      renderer.setAnimationLoop(() => {
        const dt = Math.min(clock.getDelta(), 0.05);
        const t = clock.elapsedTime;
        const p = progress.current;
        const intro = ease(clamp01(t / 1.2));

        ringObjs.forEach((o, i) => {
          const b = ease(clamp01((p - i * 0.1) / 0.5));
          const k = 1 - b;
          o.grp.rotation.x =
            o.d.tx + t * o.d.sx * (0.6 + 0.4 * p) + k * o.d.scatter;
          o.grp.rotation.y =
            o.d.ty + t * o.d.sy * (0.6 + 0.4 * p) - k * o.d.scatter * 0.6;
          o.grp.scale.setScalar(lerp(0.25, 1, b) * lerp(0.7, 1, intro));
          o.orbs.forEach((orb, n) => {
            const a =
              t * (0.9 + i * 0.25) +
              (n * Math.PI * 2) / Math.max(1, o.orbs.length);
            orb.position.set(Math.cos(a) * o.d.r, Math.sin(a) * o.d.r, 0);
          });
        });

        gem.rotation.y = t * 1.2;
        gem.rotation.x = t * 0.6;
        gem.scale.setScalar(
          (0.4 + 0.6 * ease(p)) * (1 + Math.sin(t * 3) * 0.04),
        );
        cage.rotation.y = -t * 0.8;
        cage.rotation.z = t * 0.5;
        cage.scale.setScalar(0.5 + 0.5 * ease(p));
        cageMat.opacity = 0.25 + 0.5 * ease(p);
        core.intensity = 4 + 30 * ease(p);

        for (let k = 0; k < SHARDS; k++) {
          const a = (k / SHARDS) * Math.PI * 2 + t * 0.25;
          const rad = 2.6 * (0.3 + 0.7 * ease(p));
          dummy.position.set(
            Math.cos(a) * rad,
            -1.9 + Math.sin(t * 2 + k * 0.7) * 0.12 * ease(p),
            Math.sin(a) * rad,
          );
          dummy.rotation.set(t + k, t * 0.7 + k, 0);
          dummy.scale.setScalar(
            0.4 + 0.6 * ease(clamp01(p * 1.4 - (k / SHARDS) * 0.4)),
          );
          dummy.updateMatrix();
          shards.setMatrixAt(k, dummy.matrix);
        }
        shards.instanceMatrix.needsUpdate = true;

        world.rotation.y = reduce ? 0 : t * 0.18 + p * 1.2;

        const arr = spGeo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < SP; i++) {
          let y = arr.getY(i) + dt * speed[i] * (0.5 + p * 1.2);
          if (y > 2.8) y = -2.4;
          arr.setY(i, y);
        }
        arr.needsUpdate = true;
        dust.rotation.y = t * 0.12;

        camera.position.set(
          reduce ? 0 : Math.sin(t * 0.35) * 0.9,
          lerp(1.4, 0.5, ease(p)),
          lerp(10.4, 8.2, ease(p)),
        );
        camera.lookAt(0, -0.2, 0);

        renderer.render(scene, camera);

        // first frame is on screen: crossfade from the CSS emblem and start the timeline
        if (!notified) {
          notified = true;
          readyCb.current();
        }
      });

      return () => {
        renderer.setAnimationLoop(null);
        ro.disconnect();
        ringObjs.forEach((o) => {
          o.torus.geometry.dispose();
          o.orbs.forEach((x) => x.geometry.dispose());
        });
        goldMat.dispose();
        paleMat.dispose();
        gemGeo.dispose();
        (gem.material as THREE.Material).dispose();
        cage.geometry.dispose();
        cageMat.dispose();
        shardGeo.dispose();
        shards.dispose();
        spGeo.dispose();
        dustMat.dispose();
        dot.dispose();
        envTex.dispose();
        pmrem.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === mount) {
          mount.removeChild(renderer.domElement);
        }
      };
    };

    // let the browser paint the loader shell first, then build WebGL
    const id = window.setTimeout(() => {
      if (!cancelled) cleanup = boot();
    }, 60);

    return () => {
      cancelled = true;
      clearTimeout(id);
      cleanup?.();
    };
  }, [progress]);

  return <div ref={mountRef} className="h-full w-full" />;
}

/* ---------- decorative corner ---------- */

function Corner({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 60 60"
      className={`pointer-events-none absolute h-12 w-12 sm:h-16 sm:w-16 ${className}`}
      fill="none"
      stroke="#d9b565"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M2 58V2h56" />
      <path d="M12 58V12h46" opacity="0.5" />
      <circle cx="2" cy="2" r="3" fill="#d9b565" />
    </svg>
  );
}

/* ---------- loader ---------- */

const css = `
@keyframes kclLetter{from{opacity:0;transform:translateY(18px) rotateX(70deg);filter:blur(6px)}to{opacity:1;transform:none;filter:none}}
@keyframes kclFade{from{opacity:0}to{opacity:1}}
@keyframes kclIn{from{opacity:0}to{opacity:1}}
@keyframes kclGlint{from{transform:translateX(-120%)}to{transform:translateX(420%)}}
@keyframes kclR1{from{transform:rotateY(0)}to{transform:rotateY(360deg)}}
@keyframes kclR2{from{transform:rotateX(0)}to{transform:rotateX(360deg)}}
@keyframes kclR3{from{transform:rotate3d(1,1,0,0)}to{transform:rotate3d(1,1,0,360deg)}}
@keyframes kclGem{0%,100%{transform:rotate(45deg) scale(.9)}50%{transform:rotate(225deg) scale(1.12)}}
.kcl-in{animation:kclIn .7s ease-out backwards}
.kcl-letter{display:inline-block;animation:kclLetter .9s cubic-bezier(.2,.8,.2,1) both}
.kcl-fade{animation:kclFade 1s ease-out both}
.kcl-glint{animation:kclGlint 1.8s ease-in-out infinite}
.kcl-r1{animation:kclR1 6s linear infinite}
.kcl-r2{animation:kclR2 8s linear infinite}
.kcl-r3{animation:kclR3 10s linear infinite}
.kcl-gem{animation:kclGem 4s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.kcl-in,.kcl-letter,.kcl-fade,.kcl-glint,.kcl-r1,.kcl-r2,.kcl-r3,.kcl-gem{animation:none}}
`;

const lattice = {
  backgroundImage:
    "repeating-linear-gradient(45deg, rgba(217,181,101,0.06) 0 1px, transparent 1px 38px), repeating-linear-gradient(-45deg, rgba(217,181,101,0.06) 0 1px, transparent 1px 38px)",
};
const doorBg = {
  ...lattice,
  backgroundColor: "#4a0c1d",
};

export default function Loader() {
  const [pct, setPct] = useState(0);
  const [phase, setPhase] = useState<"loading" | "exit" | "gone">("loading");
  const [sceneReady, setSceneReady] = useState(false);
  const progress = useRef(0);
  const go = useRef(false); // timeline starts only once the first 3D frame is visible

  const onReady = useCallback(() => {
    go.current = true;
    setSceneReady(true);
  }, []);

  useEffect(() => {
    // window flag resets on every refresh, so the loader plays on each reload
    // but is skipped on client-side navigation (when this component remounts)
    if (flag().__kcLoaded) {
      setPhase("gone");
      return;
    }
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const MIN_MS = reduce ? 1200 : 4200;
    document.body.style.overflow = "hidden";
    let docReady = document.readyState === "complete";
    const onLoad = () => (docReady = true);
    window.addEventListener("load", onLoad);

    const timers: ReturnType<typeof setTimeout>[] = [];
    let raf = 0;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      progress.current = 1;
      setPct(100);
      setPhase("exit");
      document.body.style.overflow = "";
      timers.push(
        setTimeout(() => {
          flag().__kcLoaded = true;
          window.dispatchEvent(new Event("kc:loaded"));
        }, 700),
      );
      timers.push(setTimeout(() => setPhase("gone"), 2400));
    };

    // fallbacks: never wait forever for WebGL, never get stuck on screen
    timers.push(
      setTimeout(() => {
        go.current = true;
        setSceneReady(true);
      }, 2500),
    );
    timers.push(setTimeout(finish, 14000));

    // time is accumulated frame by frame, so a slow frame never makes it jump
    let elapsed = 0;
    let prev = performance.now();
    let last = -1;
    const tick = (now: number) => {
      if (finished) return;
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;
      if (go.current) elapsed += dt;
      const t = Math.min((elapsed * 1000) / MIN_MS, 1);
      const eased = 1 - Math.pow(1 - t, 2.4);
      const p = docReady ? eased : Math.min(eased, 0.9);
      progress.current = p;
      const v = Math.round(p * 100);
      if (v !== last) {
        last = v;
        setPct(v);
      }
      if (p >= 1) finish();
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      finished = true;
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      window.removeEventListener("load", onLoad);
      document.body.style.overflow = "";
    };
  }, []);

  if (phase === "gone") return null;
  const exit = phase === "exit";
  const msg =
    pct < 30
      ? "Selecting the finest paper"
      : pct < 60
        ? "Pressing the gold foil"
        : pct < 90
          ? "Folding your invitation"
          : "Welcome to Brothers Card";
  const name = "Brothers Card";

  return (
    <div
      className={`kcl-root fixed inset-0 z-[100] ${exit ? "pointer-events-none" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Loading Brothers Card"
    >
      <style>{css}</style>
      <noscript>
        <style>{`.kcl-root{display:none!important}`}</style>
      </noscript>

      {/* Palace doors: solid maroon from the very first paint, swing apart at the end */}
      <div className="absolute inset-0 flex">
        {(["l", "r"] as const).map((side) => {
          const l = side === "l";
          return (
            <div
              key={side}
              className={`relative h-full w-1/2 overflow-hidden transition-transform duration-[1500ms] ease-[cubic-bezier(.76,0,.24,1)] ${
                exit ? (l ? "-translate-x-full" : "translate-x-full") : ""
              }`}
              style={{
                ...doorBg,
                transitionDelay: exit ? "350ms" : "0ms",
              }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_100%_50%,rgba(217,181,101,0.2),transparent_70%)]" />
              <div
                className={`absolute bottom-[10%] top-[8%] w-[78%] max-w-[460px] border-[#d9b565]/40 ${
                  l
                    ? "right-0 rounded-tl-[999px] border-l-2 border-t-2"
                    : "left-0 rounded-tr-[999px] border-r-2 border-t-2"
                }`}
              />
              <div
                className={`absolute bottom-[12%] top-[10.5%] w-[72%] max-w-[420px] border-[#d9b565]/20 ${
                  l
                    ? "right-0 rounded-tl-[999px] border-l border-t"
                    : "left-0 rounded-tr-[999px] border-r border-t"
                }`}
              />
              <span
                aria-hidden
                className={`absolute inset-y-0 w-[3px] bg-[linear-gradient(180deg,#a8812f,#f3dc9b,#a8812f)] ${l ? "right-0" : "left-0"}`}
              />
            </div>
          );
        })}
      </div>

      {/* Content */}
      <div
        className={`kcl-in absolute inset-0 transition-all duration-700 ${exit ? "scale-110 opacity-0" : ""}`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_45%_at_50%_42%,rgba(217,181,101,0.28),transparent_70%),radial-gradient(70%_60%_at_50%_115%,rgba(138,28,56,0.9),transparent_70%),radial-gradient(120%_120%_at_50%_50%,transparent_55%,rgba(58,8,23,0.75))]" />
        <div className="pointer-events-none absolute inset-3 rounded-[24px] border border-[#d9b565]/25 sm:inset-5 sm:rounded-[28px]" />
        <Corner className="left-5 top-5 sm:left-8 sm:top-8" />
        <Corner className="right-5 top-5 rotate-90 sm:right-8 sm:top-8" />
        <Corner className="bottom-5 right-5 rotate-180 sm:bottom-8 sm:right-8" />
        <Corner className="bottom-5 left-5 -rotate-90 sm:bottom-8 sm:left-8" />

        <div className="relative flex h-full flex-col items-center justify-center px-6">
          <div className="relative aspect-square w-[min(92vw,52svh,540px)]">
            {/* instant CSS emblem (shows before JavaScript is ready) */}
            <div
              aria-hidden
              className={`absolute inset-0 grid place-items-center transition-opacity duration-700 ${sceneReady ? "opacity-0" : "opacity-100"}`}
              style={{ perspective: 800 }}
            >
              <div
                className="relative h-[46%] w-[46%]"
                style={{ transformStyle: "preserve-3d" }}
              >
                <span className="kcl-r1 absolute inset-0 rounded-full border-2 border-[#d9b565]" />
                <span className="kcl-r2 absolute inset-[12%] rounded-full border-2 border-[#f3dc9b]" />
                <span className="kcl-r3 absolute inset-[26%] rounded-full border-2 border-[#c9a050]" />
                <span className="kcl-gem absolute inset-[40%] bg-[linear-gradient(135deg,#fff3d0,#d9b565)] shadow-[0_0_40px_#ffc864]" />
              </div>
            </div>

            {/* real 3D scene fades in over it once its first frame is drawn */}
            <div
              className={`absolute inset-0 transition-opacity duration-700 ${sceneReady ? "opacity-100" : "opacity-0"}`}
            >
              <ArmillaryScene progress={progress} onReady={onReady} />
            </div>
          </div>

          <h2
            className="-mt-2 font-[family-name:var(--font-display)] text-3xl text-[#fff4de] sm:text-5xl"
            style={{ perspective: 600 }}
            aria-hidden
          >
            {name.split("").map((ch, i) => (
              <span
                key={i}
                className={`kcl-letter ${i >= 9 ? "italic text-[#d9b565]" : ""}`}
                style={{ animationDelay: `${300 + i * 70}ms` }}
              >
                {ch === " " ? "\u00A0" : ch}
              </span>
            ))}
          </h2>

          <p
            key={msg}
            className="kcl-fade mt-2 h-5 text-sm text-[#fff4de]/70 sm:text-base"
          >
            {msg}
          </p>

          <div className="mt-4 flex w-[min(72vw,340px)] items-center gap-3">
            <div className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-[#d9b565]/20">
              <div
                className="absolute inset-y-0 left-0 overflow-hidden rounded-full bg-[linear-gradient(90deg,#a8812f,#f3dc9b,#d9b565)] shadow-[0_0_12px_#f3dc9b]"
                style={{ width: `${pct}%` }}
              >
                <span className="kcl-glint absolute inset-y-0 w-1/4 bg-white/70 blur-[2px]" />
              </div>
            </div>
            <span className="w-10 text-right font-[family-name:var(--font-display)] text-lg tabular-nums text-[#d9b565] sm:text-xl">
              {pct}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
