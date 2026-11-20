"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

const LOGO_SRC = "/logo.jpeg"; // put your file in /public/logo.jpeg
const SHOW_NAME = true;

const links = [
  {
    label: "Services",
    href: "#services",
    note: "Design, foil, letterpress and more",
  },
  { label: "Collections", href: "#collections", note: "Browse every style" },
  { label: "Designs", href: "#designs", note: "Ready-made invitation designs" },
  { label: "Customize", href: "#customize", note: "Make it yours" },
  { label: "Sample kit", href: "#samples", note: "Free samples at your door" },
  { label: "Contact", href: "#contact", note: "Talk to our team" },
];

const flag = () => window as unknown as { __kcLoaded?: boolean };

const css = `
html{scroll-padding-top:7rem}
.kcn-spot{opacity:0;transition:opacity .4s}
.kcn-nav:hover .kcn-spot{opacity:1}
@keyframes kcnShine{from{transform:translateX(-140%) skewX(-18deg)}to{transform:translateX(340%) skewX(-18deg)}}
.kcn-cta:hover .kcn-shine{animation:kcnShine .9s ease}
@media (prefers-reduced-motion:reduce){.kcn-cta:hover .kcn-shine{animation:none}}
`;

/* ---------- big 3D logo coin ----------
   - hangs out of the bar so it is the biggest thing in the header
   - real thickness (stacked gold layers), logo floats above the face
   - tilts toward the pointer / finger, glare follows
   - spins in once when the page is ready                              */

const EXTRUSION = [
  "#c99a3c",
  "#b88a33",
  "#a8812f",
  "#8f6a22",
  "#775619",
  "#5e4312",
];

function Logo({
  onClick,
  ready,
  compact,
}: {
  onClick?: () => void;
  ready: boolean;
  compact: boolean;
}) {
  const reduce = useReducedMotion();
  const [logoOk, setLogoOk] = useState(true);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [24, -24]), {
    stiffness: 180,
    damping: 15,
  });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-28, 28]), {
    stiffness: 180,
    damping: 15,
  });
  const shadowX = useTransform(mx, [-0.5, 0.5], [14, -14]);
  const glare = useTransform(
    [mx, my],
    (v: number[]) =>
      `radial-gradient(circle at ${(v[0] + 0.5) * 100}% ${(v[1] + 0.5) * 100}%, rgba(255,255,255,0.7), transparent 55%)`,
  );

  const onMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <a
      href="#"
      onClick={onClick}
      onPointerMove={reduce ? undefined : onMove}
      onPointerLeave={onLeave}
      className="group relative z-10 -my-4 flex shrink-0 items-center gap-3 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f3dc9b] sm:-my-5 sm:gap-4"
      aria-label="Brothers Card home"
    >
      <motion.div
        animate={{ scale: compact ? 0.84 : 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 24 }}
        style={{ transformOrigin: "left center", perspective: 700 }}
        className="h-[76px] w-[76px] sm:h-[92px] sm:w-[92px]"
      >
        {/* one-time spin-in */}
        <motion.div
          initial={reduce ? false : { rotateY: -200, opacity: 0, scale: 0.6 }}
          animate={
            ready
              ? { rotateY: 0, opacity: 1, scale: 1 }
              : { rotateY: -200, opacity: 0, scale: 0.6 }
          }
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          style={{ transformStyle: "preserve-3d" }}
          className="h-full w-full"
        >
          {/* gentle float */}
          <motion.div
            animate={reduce ? undefined : { y: [0, -3, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformStyle: "preserve-3d" }}
            className="h-full w-full"
          >
            {/* tilt */}
            <motion.div
              style={{
                rotateX: rx,
                rotateY: ry,
                transformStyle: "preserve-3d",
              }}
              className="relative h-full w-full"
            >
              {/* ground shadow */}
              <motion.span
                aria-hidden
                className="absolute inset-[6px] rounded-full bg-black/60 blur-xl"
                style={{ x: shadowX, y: 14, transform: "translateZ(-40px)" }}
              />

              {/* coin thickness */}
              {EXTRUSION.map((c, i) => (
                <span
                  key={c}
                  aria-hidden
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: c,
                    transform: `translateZ(${-(i + 1) * 2.5}px)`,
                  }}
                />
              ))}

              {/* gold rim + cream face */}
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-[conic-gradient(from_210deg,#fff1c4,#d9b565,#a8812f,#f3dc9b,#fff1c4)] p-[4px] shadow-[0_14px_28px_-8px_rgba(0,0,0,0.75)]"
              >
                <span className="block h-full w-full rounded-full bg-[radial-gradient(circle_at_30%_22%,#ffffff,#fff8e6_65%,#f2e3bd)] shadow-[inset_0_2px_6px_rgba(120,80,10,0.35)]" />
              </span>

              {/* logo floats above the face */}
              <span
                className="absolute inset-[13%] grid place-items-center"
                style={{ transform: "translateZ(26px)" }}
              >
                {logoOk ? (
                  <Image
                    src={LOGO_SRC}
                    alt=""
                    width={240}
                    height={240}
                    priority
                    onError={() => setLogoOk(false)}
                    className="h-full w-full object-contain drop-shadow-[0_6px_8px_rgba(60,20,0,0.35)]"
                  />
                ) : (
                  <span className="bg-[linear-gradient(135deg,#8a1c38,#3a0817)] bg-clip-text font-[family-name:var(--font-display)] text-5xl italic leading-none text-transparent">
                    B
                  </span>
                )}
              </span>

              {/* glare */}
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full opacity-60"
                style={{ background: glare, transform: "translateZ(34px)" }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>

      {SHOW_NAME && (
        <span
          className="hidden leading-none min-[420px]:block"
          style={{
            textShadow:
              "0 1px 0 rgba(107,19,41,.9), 0 6px 14px rgba(0,0,0,.35)",
          }}
        >
          <span className="block font-[family-name:var(--font-display)] text-xl font-semibold tracking-wide text-[#fff4de] transition-colors group-hover:text-[#f3dc9b] sm:text-[1.65rem]">
            Brothers{" "}
            <span className="font-normal italic text-[#d9b565]">Card</span>
          </span>
          <span className="mt-1.5 hidden text-xs tracking-wide text-[#fff4de]/60 sm:block">
            Wedding invitation studio
          </span>
        </span>
      )}
    </a>
  );
}

/* ---------- navbar ---------- */

export default function Navbar() {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [cart, setCart] = useState(2);
  const [ready, setReady] = useState(false);
  const { scrollY, scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 24);
    setHidden(y > prev && y > 180 && !open);
    if (y < 200) setActive(null);
  });

  // wait for the loader doors before sliding in
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

  // highlight the link of the section being read
  useEffect(() => {
    const els = links
      .map((l) => document.querySelector(l.href))
      .filter(Boolean) as Element[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) setActive(`#${en.target.id}`);
        }),
      { rootMargin: "-40% 0px -55% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const mq = window.matchMedia("(min-width: 1280px)");
    const onMq = () => mq.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
    };
  }, [open]);

  const onNavMove = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <>
      <style>{css}</style>

      <motion.header
        initial={{ y: -140, opacity: 0 }}
        animate={{
          y: ready && !hidden ? 0 : -140,
          opacity: ready ? 1 : 0,
        }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-0 z-50 px-3 pt-6 sm:px-6 sm:pt-7"
      >
        {/* gold rim */}
        <div
          className={`kcn-nav mx-auto max-w-7xl rounded-full p-px transition-all duration-500 ${
            scrolled
              ? "bg-[linear-gradient(135deg,rgba(243,220,155,0.9),rgba(217,181,101,0.2)_45%,rgba(168,129,47,0.8))] shadow-[0_22px_50px_-16px_rgba(20,0,6,0.95)]"
              : "bg-[linear-gradient(135deg,rgba(243,220,155,0.4),rgba(217,181,101,0.08)_45%,rgba(217,181,101,0.3))]"
          }`}
        >
          <nav
            onPointerMove={onNavMove}
            aria-label="Main"
            className={`relative flex h-16 items-center justify-between rounded-full pl-2 pr-2.5 transition-colors duration-500 sm:pl-3 sm:pr-3.5 ${
              scrolled
                ? "bg-[#3a0817]/90 backdrop-blur-xl"
                : "bg-[#4a0c1d]/55 backdrop-blur-md"
            }`}
          >
            {/* pointer light */}
            <span
              aria-hidden
              className="kcn-spot pointer-events-none absolute inset-0 overflow-hidden rounded-full"
              style={{
                background:
                  "radial-gradient(240px circle at var(--mx,50%) var(--my,50%), rgba(243,220,155,0.16), transparent 70%)",
              }}
            />
            {/* top highlight */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-24 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
            />
            {/* scroll progress */}
            <motion.span
              aria-hidden
              style={{ scaleX: progress }}
              className={`pointer-events-none absolute inset-x-24 -bottom-px h-[2px] origin-left rounded-full bg-[linear-gradient(90deg,#a8812f,#f3dc9b,#d9b565)] shadow-[0_0_10px_#f3dc9b] transition-opacity duration-500 ${scrolled ? "opacity-100" : "opacity-0"}`}
            />

            <Logo
              onClick={() => setOpen(false)}
              ready={ready}
              compact={scrolled}
            />

            {/* desktop links */}
            <ul
              className="relative hidden items-center gap-1 xl:flex"
              onMouseLeave={() => setHovered(null)}
            >
              {links.map((l) => {
                const on = active === l.href;
                return (
                  <li key={l.label} className="relative">
                    <a
                      href={l.href}
                      onMouseEnter={() => setHovered(l.label)}
                      onFocus={() => setHovered(l.label)}
                      aria-current={on ? "true" : undefined}
                      className={`relative z-10 block rounded-full px-4 py-2 text-[15px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d9b565] ${
                        on
                          ? "text-[#f3dc9b]"
                          : "text-[#fff4de]/85 hover:text-[#fff4de]"
                      }`}
                    >
                      {l.label}
                    </a>
                    {hovered === l.label && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-full bg-[#d9b565]/15 ring-1 ring-[#d9b565]/45"
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 32,
                        }}
                      />
                    )}
                    {on && (
                      <motion.span
                        layoutId="nav-dot"
                        aria-hidden
                        className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#f3dc9b] shadow-[0_0_8px_#f3dc9b]"
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                        }}
                      />
                    )}
                  </li>
                );
              })}
            </ul>

            {/* actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setCart((c) => c + 1)}
                className="relative grid h-10 w-10 place-items-center rounded-full border border-[#fff4de]/25 bg-[#fff4de]/5 text-[#fff4de] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_6px_14px_-6px_rgba(0,0,0,0.6)] transition hover:-translate-y-0.5 hover:border-[#d9b565] hover:text-[#d9b565] active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d9b565]"
                aria-label={`Cart, ${cart} items`}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M6 7h12l-1 13H7L6 7Z" />
                  <path d="M9 7a3 3 0 0 1 6 0" />
                </svg>
                <motion.span
                  key={cart}
                  initial={{ scale: 1.8 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#d9b565] px-1 text-[11px] font-bold text-[#4a0c1d] shadow-[0_2px_6px_rgba(0,0,0,0.4)]"
                >
                  {cart}
                </motion.span>
              </button>

              <a
                href="#samples"
                className="kcn-cta relative hidden overflow-hidden rounded-full bg-[linear-gradient(180deg,#f7e3a8,#d9b565_55%,#b88a33)] px-5 py-2.5 text-sm font-semibold text-[#4a0c1d] shadow-[inset_0_1px_0_rgba(255,255,255,0.65),inset_0_-3px_0_rgba(120,80,10,0.35),0_10px_24px_-8px_rgba(217,181,101,0.75)] transition hover:-translate-y-0.5 active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d9b565] sm:block"
              >
                <span className="relative z-10">Get free samples</span>
                <span
                  aria-hidden
                  className="kcn-shine absolute inset-y-0 left-0 w-1/3 bg-white/60"
                  style={{ transform: "translateX(-140%) skewX(-18deg)" }}
                />
              </a>

              <button
                onClick={() => setOpen((o) => !o)}
                className="relative grid h-10 w-10 place-items-center rounded-full border border-[#fff4de]/25 bg-[#fff4de]/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_6px_14px_-6px_rgba(0,0,0,0.6)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d9b565] xl:hidden"
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
                aria-controls="kcn-menu"
              >
                <motion.span
                  className="absolute h-[1.5px] w-5 rounded-full bg-[#fff4de]"
                  animate={{ y: open ? 0 : -4, rotate: open ? 45 : 0 }}
                />
                <motion.span
                  className="absolute h-[1.5px] w-5 rounded-full bg-[#fff4de]"
                  animate={{ y: open ? 0 : 4, rotate: open ? -45 : 0 }}
                />
              </button>
            </div>
          </nav>
        </div>
      </motion.header>

      {/* mobile + tablet menu */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-[#1f0309]/75 backdrop-blur-sm xl:hidden"
            />
            <motion.div
              key="panel"
              id="kcn-menu"
              initial={{ rotateX: -85, opacity: 0, y: -16 }}
              animate={{ rotateX: 0, opacity: 1, y: 0 }}
              exit={{ rotateX: -85, opacity: 0, y: -16 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{
                transformPerspective: 1200,
                transformOrigin: "top center",
              }}
              className="fixed inset-x-3 top-[7.6rem] z-40 max-h-[calc(100svh-8.5rem)] overflow-y-auto rounded-[28px] border border-[#d9b565]/40 bg-[#4a0c1d] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] sm:inset-x-6 sm:left-auto sm:top-[8.2rem] sm:w-[26rem] xl:hidden"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_40%_at_90%_0%,rgba(217,181,101,0.22),transparent_70%),radial-gradient(60%_40%_at_0%_100%,rgba(138,28,56,0.85),transparent_70%)]" />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, rgba(217,181,101,0.06) 0 1px, transparent 1px 38px), repeating-linear-gradient(-45deg, rgba(217,181,101,0.06) 0 1px, transparent 1px 38px)",
                }}
              />

              <ul className="relative p-3 sm:p-4">
                {links.map((l, i) => {
                  const on = active === l.href;
                  return (
                    <motion.li
                      key={l.label}
                      initial={{ opacity: 0, y: 18, rotateX: 40 }}
                      animate={{ opacity: 1, y: 0, rotateX: 0 }}
                      transition={{
                        delay: 0.18 + i * 0.06,
                        duration: 0.5,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      style={{ transformPerspective: 800 }}
                    >
                      <a
                        href={l.href}
                        onClick={() => setOpen(false)}
                        className={`group flex items-center justify-between gap-4 rounded-2xl px-4 py-3.5 transition-colors hover:bg-[#d9b565]/10 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#d9b565] ${
                          on ? "bg-[#d9b565]/10" : ""
                        }`}
                      >
                        <span>
                          <span
                            className={`block font-[family-name:var(--font-display)] text-2xl leading-tight sm:text-[1.7rem] ${
                              on ? "text-[#f3dc9b]" : "text-[#fff4de]"
                            }`}
                          >
                            {l.label}
                          </span>
                          <span className="mt-0.5 block text-xs text-[#fff4de]/60 sm:text-sm">
                            {l.note}
                          </span>
                        </span>
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#d9b565"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="shrink-0 transition-transform group-hover:translate-x-1"
                          aria-hidden
                        >
                          <path d="M5 12h14M13 6l6 6-6 6" />
                        </svg>
                      </a>
                    </motion.li>
                  );
                })}
              </ul>

              <div className="relative border-t border-[#d9b565]/20 p-4 sm:p-5">
                <a
                  href="#samples"
                  onClick={() => setOpen(false)}
                  className="block rounded-full bg-[linear-gradient(180deg,#f7e3a8,#d9b565_55%,#b88a33)] py-3.5 text-center font-semibold text-[#4a0c1d] shadow-[inset_0_1px_0_rgba(255,255,255,0.65),inset_0_-3px_0_rgba(120,80,10,0.35),0_10px_24px_-8px_rgba(217,181,101,0.6)] transition active:translate-y-px"
                >
                  Get free samples
                </a>
                <p className="mt-3 text-center text-xs text-[#fff4de]/60">
                  Free samples at your door. Delivered across India.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
