import { useEffect, useRef, useState } from "react";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { finishPreloader, isAppReady, markAppReady } from "@/lib/preloader";

const LOGO_SRC = "/mcrelish-logo.png";
const MIN_BUILD_S = 2.2;
const HOLD_MS = 450;
const DISPERSE_MS = 1300;
const MAX_WAIT_S = 9;
const FLOATS = 13;

type Phase = "loading" | "dispersing" | "done";
type Scene = {
  render: (build: number, disperse: number, time: number) => void;
  resize: () => void;
  destroy: () => void;
};

const VERTEX = `
attribute vec3 aTarget;
attribute vec3 aStart;
attribute vec3 aColor;
attribute vec4 aRand;
uniform float uBuild;
uniform float uDisperse;
uniform float uTime;
uniform float uPx;
uniform vec2 uView;
varying vec3 vColor;
varying float vAlpha;
const float D = 3.4;
mat2 rot(float a) { float c = cos(a); float s = sin(a); return mat2(c, -s, s, c); }
void main() {
  float delay = aRand.x * 0.5;
  float b = clamp((uBuild - delay) / 0.5, 0.0, 1.0);
  float e = 1.0 - pow(1.0 - b, 3.0);
  vec3 p = mix(aStart, aTarget, e);
  p.xz = rot((1.0 - e) * 3.2 * aRand.z) * p.xz;
  float s = uTime * 1.6 + aRand.w * 40.0;
  p += (1.0 - uDisperse) * 0.006 * vec3(sin(s), cos(s * 1.3), sin(s * 0.7));
  float de = uDisperse * uDisperse;
  vec3 dir = normalize(aTarget * vec3(1.0, 1.0, 0.6) + aStart * 0.3 + vec3(0.0001));
  p += dir * de * (1.6 + 3.2 * aRand.y);
  p.y += de * aRand.z * 0.8;
  float yaw = sin(uTime * 0.7) * 0.55 + uDisperse * aRand.z * 1.2;
  p.xz = rot(yaw) * p.xz;
  float w = D - p.z;
  gl_Position = vec4(p.xy * (2.1 / w) * uView, 0.0, 1.0);
  gl_PointSize = max(1.0, (1.0 + aRand.y) * 1.6 * uPx * (D / w));
  vColor = aColor * (0.92 + 0.2 * sin(s * 0.5));
  vAlpha = smoothstep(0.0, 0.25, b) * (1.0 - smoothstep(0.35, 1.0, uDisperse));
}`;

const FRAGMENT = `
precision mediump float;
varying vec3 vColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = (1.0 - smoothstep(0.15, 0.5, d)) * vAlpha;
  gl_FragColor = vec4(vColor * a, a);
}`;

function buildParticles(img: HTMLImageElement, count: number) {
  const sw = 200;
  const sh = Math.max(1, Math.round((sw * img.naturalHeight) / img.naturalWidth));
  const sample = document.createElement("canvas");
  sample.width = sw;
  sample.height = sh;
  const ctx = sample.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2d context unavailable");
  ctx.drawImage(img, 0, 0, sw, sh);
  const pixels = ctx.getImageData(0, 0, sw, sh).data;

  const points: number[] = [];
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const i = (y * sw + x) * 4;
      if ((pixels[i + 3] ?? 0) > 70) {
        points.push(
          x,
          y,
          (pixels[i] ?? 0) / 255,
          (pixels[i + 1] ?? 0) / 255,
          (pixels[i + 2] ?? 0) / 255,
        );
      }
    }
  }
  const n = points.length / 5;
  if (n === 0) throw new Error("logo has no visible pixels");

  const height = 1.7;
  const width = height * (sw / sh);
  const data = new Float32Array(count * FLOATS);
  for (let i = 0; i < count; i++) {
    const k = n >= count ? Math.floor((i * n) / count) : i % n;
    const base = k * 5;
    const px = (points[base] ?? 0) + Math.random() - 0.5;
    const py = (points[base + 1] ?? 0) + Math.random() - 0.5;
    const x = (px / sw - 0.5) * width;
    const y = (0.5 - py / sh) * height;
    const r2 = (x / (width / 2)) ** 2 + (y / (height / 2)) ** 2;
    const z = 0.34 * (1 - Math.min(1, r2)) + (Math.random() - 0.5) * 0.2;
    const shade = 0.9 + Math.random() * 0.2;

    const radius = 2.2 + Math.random() * 3.4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const o = i * FLOATS;
    data[o] = x;
    data[o + 1] = y;
    data[o + 2] = z;
    data[o + 3] = radius * Math.sin(phi) * Math.cos(theta);
    data[o + 4] = radius * Math.sin(phi) * Math.sin(theta) * 0.8;
    data[o + 5] = radius * Math.cos(phi) * 0.8;
    data[o + 6] = Math.min(1, (points[base + 2] ?? 0) * shade);
    data[o + 7] = Math.min(1, (points[base + 3] ?? 0) * shade);
    data[o + 8] = Math.min(1, (points[base + 4] ?? 0) * shade);
    data[o + 9] = Math.random();
    data[o + 10] = Math.random();
    data[o + 11] = Math.random() * 2 - 1;
    data[o + 12] = Math.random();
  }
  return data;
}

function createScene(canvas: HTMLCanvasElement, data: Float32Array): Scene {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    premultipliedAlpha: true,
  });
  if (!gl) throw new Error("WebGL unavailable");
  const count = data.length / FLOATS;

  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("shader allocation failed");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) ?? "shader compile failed");
    }
    return shader;
  };
  const program = gl.createProgram();
  if (!program) throw new Error("program allocation failed");
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("program link failed");
  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  const layout: [string, number, number][] = [
    ["aTarget", 3, 0],
    ["aStart", 3, 3],
    ["aColor", 3, 6],
    ["aRand", 4, 9],
  ];
  for (const [name, size, offset] of layout) {
    const location = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, FLOATS * 4, offset * 4);
  }
  const uniform = (name: string) => gl.getUniformLocation(program, name);
  const uBuild = uniform("uBuild");
  const uDisperse = uniform("uDisperse");
  const uTime = uniform("uTime");
  const uPx = uniform("uPx");
  const uView = uniform("uView");

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.disable(gl.DEPTH_TEST);

  const resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cssW = Math.max(1, canvas.clientWidth);
    const cssH = Math.max(1, canvas.clientHeight);
    const w = Math.round(cssW * dpr);
    const h = Math.round(cssH * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    const min = Math.min(cssW, cssH);
    gl.uniform2f(uView, min / cssW, min / cssH);
    gl.uniform1f(uPx, dpr * Math.min(1.4, Math.max(0.7, min / 700)));
  };
  resize();

  return {
    render(build, disperse, time) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uBuild, build);
      gl.uniform1f(uDisperse, disperse);
      gl.uniform1f(uTime, time);
      gl.drawArrays(gl.POINTS, 0, count);
    },
    resize,
    destroy() {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

export function PreloaderReady() {
  useEffect(() => {
    markAppReady();
  }, []);
  return null;
}

export function Preloader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const percentRef = useRef<HTMLSpanElement>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [mode, setMode] = useState<"pending" | "gl" | "static">("pending");
  useScrollLock(phase === "loading");

  useEffect(() => {
    if (window.location.pathname.startsWith("/admin")) {
      setPhase("done");
      finishPreloader();
      return;
    }

    let alive = true;
    let raf = 0;
    let scene: Scene | null = null;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const minBuild = reduced ? 0.6 : MIN_BUILD_S;
    let loaded = document.readyState === "complete";
    const onLoad = () => {
      loaded = true;
    };
    const onResize = () => scene?.resize();
    window.addEventListener("load", onLoad);
    window.addEventListener("resize", onResize);

    const start = performance.now();
    let last = start;
    let build = 0;
    let disperse = 0;
    let stage: "build" | "hold" | "disperse" = "build";
    let stageStart = start;

    const frame = (now: number) => {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const elapsed = (now - start) / 1000;

      if (stage === "build") {
        const ready = (loaded && isAppReady()) || elapsed > MAX_WAIT_S;
        const target = ready ? 1 : 0.88 * (1 - Math.exp(-elapsed / 1.4));
        build += Math.min(Math.max(target - build, 0), dt / minBuild);
        if (build >= 0.999) {
          build = 1;
          stage = "hold";
          stageStart = now;
        }
      } else if (stage === "hold") {
        if (now - stageStart > HOLD_MS) {
          stage = "disperse";
          stageStart = now;
          setPhase("dispersing");
        }
      } else {
        disperse = Math.min(1, (now - stageStart) / DISPERSE_MS);
      }

      scene?.render(build, disperse, elapsed);
      if (percentRef.current) percentRef.current.textContent = `${Math.round(build * 100)}%`;

      if (stage === "disperse" && disperse >= 1) {
        alive = false;
        setPhase("done");
        finishPreloader();
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!alive || !canvas || reduced) {
        if (alive) setMode("static");
        return;
      }
      try {
        const small = window.innerWidth < 700 || (navigator.hardwareConcurrency ?? 8) <= 2;
        scene = createScene(canvas, buildParticles(img, small ? 24000 : 48000));
        setMode("gl");
      } catch {
        setMode("static");
      }
    };
    img.onerror = () => setMode("static");
    img.src = LOGO_SRC;

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("load", onLoad);
      window.removeEventListener("resize", onResize);
      scene?.destroy();
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      id="preloader"
      role="status"
      aria-label="Loading McRelish"
      className={`fixed inset-0 z-[100] ${phase === "dispersing" ? "pointer-events-none" : ""}`}
    >
      <noscript>
        <style>{"#preloader{display:none}"}</style>
      </noscript>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-ink transition-opacity duration-700"
        style={{ opacity: phase === "dispersing" ? 0 : 1 }}
      />
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full" />
      {mode === "static" && (
        <div className="absolute inset-0 grid place-items-center">
          <img
            src={LOGO_SRC}
            alt=""
            className="h-28 w-auto motion-safe:animate-pulse"
            style={{ opacity: phase === "dispersing" ? 0 : 1, transition: "opacity 500ms" }}
          />
        </div>
      )}
      <p
        className="absolute inset-x-0 bottom-[10vh] text-center text-[11px] font-semibold uppercase tracking-[0.35em] text-cream/60 transition-opacity duration-500"
        style={{ opacity: phase === "dispersing" ? 0 : 1 }}
      >
        Loading{" "}
        <span ref={percentRef} className="tabular-nums">
          0%
        </span>
      </p>
    </div>
  );
}
