/* AULUCK background: the approved live creatures (betta, jellyfish, shark, whale), drawn with WebGL from the
   approved sprite files in assets/creatures/. Same paths, motion and glow as the approved live background.
   Reduced motion: one still frame, no loop. Tab hidden: the browser pauses the loop.
   The canvas never takes clicks and sits under the page content. */
(() => {
"use strict";
/* ============================================================
   AULUCK live background: real body motion.
   One WebGL canvas. Every creature is a textured mesh that is bent in the
   vertex shader (travelling body wave, fin sway, bell pulse, arm sway),
   steered along curved paths. The betta plays the member's own clip.
   All motion is a pure function of time, so the clock can be stepped.
   ============================================================ */
const SRC = {
  jelly: "assets/creatures/creature-jellyfish-cyan.webp", shark: "assets/creatures/creature-shark-solid.webp",
  whale: "assets/creatures/creature-whale-solid.webp",
  bettaStrip: "assets/creatures/betta-video-strip.webp", bettaGlow: "assets/creatures/betta-glow-strip.webp"
};
const BETTA = {n: 61, cols: 10, rows: 7, fps: 14};
/* Tweakable: AMP = how strongly bodies bend, SPEED = clock speed */
const CFG = {amp: 1.0, speed: 1.0};
const HASH = location.hash || "";
const PREVIEW = /preview/.test(HASH);
const STEP = /step/.test(HASH);
const FILM = /film/.test(HASH);
const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (PREVIEW) document.documentElement.classList.add("pv");
const DBG = {noTrail: false, freeze: false, pin: false, only: -1, noGhost: false, noGlow: false};
const TAU = Math.PI * 2;
const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
const lerp = (a, b, t) => a + (b - a) * t;

/* kind: 0 shark, 1 whale, 2 octopus, 3 jelly, 5 betta clip
   nat: direction the artwork faces (+1 right, -1 left, 0 none) */
const C = [
 {id:"betta", kind:5, nat:-1, wf:.30, ar:256/384, sp:.075, f:.5,  pTop:.60, hue:-15,  gain:.50, pv:{x:.85, y:.25, W:370, dir:1}},
 {id:"jelly", kind:3, nat:0,  wf:.17, ar:448/528, sp:.024, f:.4,  pTop:.30, hue:60,   gain:.75, pv:{x:.27, y:.745, W:330, dir:1}},
 {id:"shark", kind:0, nat:1,  wf:.30, ar:246/451, sp:.060, f:.85, pTop:.60, hue:115,  gain:.55, pv:{x:.16, y:.26, W:380, dir:1}},
 {id:"whale", kind:1, nat:1,  wf:.34, ar:311/481, sp:.040, f:.32, pTop:.40, hue:20,   gain:.55, pv:{x:.70, y:.68, W:410, dir:-1}}
];

/* ---------- random ---------- */
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}

/* ---------- layout state ---------- */
const canvas = document.getElementById("bg");
const heroText = null;   /* no hero text on the site: creatures may cross the full height, the page content sits above */
let vw = innerWidth, vh = innerHeight, Bx = Math.max(vw, 620), dpr = 1, quality = 1;
let textRect = null;
let cycles = C.map(() => []);

function measure(){
  vw = innerWidth; vh = innerHeight; Bx = Math.max(vw, 620);
  if (PREVIEW) { textRect = null; }
  else { textRect = null; }
  cycles = C.map(() => []);
}
function bands(){
  if (!textRect) return [{lo:0, hi:vh}];
  const b = [];
  if (textRect.top > vh*.16) b.push({lo:0, hi:textRect.top, top:true});
  if (vh-textRect.bottom > vh*.16) b.push({lo:textRect.bottom, hi:vh, top:false});
  return b.length ? b : [{lo:0, hi:vh, top:true}];
}

/* ---------- paths ---------- */
function genCycle(ci, k, start){
  const c = C[ci], R = rng(ci*7919 + k*104729 + 17);
  let dir = R() < .5 ? -1 : 1;
  if (c.nat) dir = (k + ci) % 2 ? c.nat : -c.nat;
  const z = R(), sc = .78 + .4*z;
  const bs = bands();
  let bd = bs[0];
  if (bs.length > 1) bd = R() < c.pTop ? bs[0] : bs[1]; else R();
  let W = c.wf*Bx*sc, H = W*c.ar;
  const bandH = bd.hi - bd.lo;
  if (H > bandH*.86) { const f = bandH*.86/H; W *= f; H *= f; }
  const half = H*.56;
  let yLo = bd.lo + half, yHi = bd.hi - half;
  if (yHi < yLo) yLo = yHi = (bd.lo + bd.hi)/2;
  const margin = W*.62;
  const x0 = dir > 0 ? -margin : vw + margin, x1 = dir > 0 ? vw + margin : -margin;
  const span = Math.abs(x1 - x0);
  const kk = clamp(span/(2.2*bandH), .25, 1);
  const y0 = lerp(yLo, yHi, R());
  const y1 = lerp(y0, lerp(yLo, yHi, R()), kk);
  const c1y = lerp(y0, lerp(yLo, yHi, R()), kk), c2y = lerp(y0, lerp(yLo, yHi, R()), kk);
  const c1x = x0 + (x1-x0)*(.28 + R()*.1), c2x = x0 + (x1-x0)*(.62 + R()*.1);
  const sp = c.sp*Bx*(.7 + .6*z);
  const dur = span*1.12/sp, gap = R()*2.2;
  const cyc = {t0:start, t1:start+dur, t2:start+dur+gap, dir, z, sc, W, H,
          x0, y0, c1x, c1y, c2x, c2y, x1, y1, drift:0, spd:sp/1.12};
  if (c.kind <= 1) cyc.wv = mkWeave(c, R, cyc.spd, H, false);
  return cyc;
}
function cycleAt(ci, t){
  const L = cycles[ci];
  if (!L.length) {
    const first = genCycle(ci, 0, 0);
    const R = rng(ci*31 + 5);
    const shift = (.12 + R()*.5)*(first.t1);
    first.t0 -= shift; first.t1 -= shift; first.t2 -= shift;
    L.push(first);
  }
  while (L[L.length-1].t2 <= t) L.push(genCycle(ci, L.length, L[L.length-1].t2));
  for (let i = L.length-1; i >= 0; i--) if (L[i].t0 <= t) return L[i];
  return null;
}
function bez(a,b,c,d,u){const v=1-u;return v*v*v*a+3*v*v*u*b+3*v*u*u*c+u*u*u*d;}

/* weave: sinuous swerving of the swim path (shark and whale). Heading follows the path, and the
   spine lags the heading, so every swerve turns into a real bend of the body. */
function mkWeave(c, R, spd, H, big){
  const shark = c.kind === 0;
  let a1 = (shark ? .50 : .38)*(big ? 1.15 : 1), a2 = shark ? .20 : .16;
  const w1 = shark ? .55 : .42, w2 = shark ? .23 : .19;
  const est = spd*(Math.tan(a1)/w1 + Math.tan(a2)/w2);
  const lim = (big ? .62 : .34)*H;
  if (est > lim){ const f = lim/est; a1 = Math.atan(Math.tan(a1)*f); a2 = Math.atan(Math.tan(a2)*f); }
  return {a1, a2, w1: big ? w1*1.5 : w1, w2, ph: R()*TAU, sp: spd, sv: shark ? .32 : .18};
}
function weave(cy, t){
  const w = cy.wv;
  if (!w) return [0, 0];
  const dy = w.sp*(Math.tan(w.a1)/w.w1*Math.sin(w.w1*t + w.ph) + Math.tan(w.a2)/w.w2*Math.sin(w.w2*t + 2*w.ph));
  const dx = w.sp*w.sv*Math.sin(.9*t + w.ph*1.3)/.9*cy.dir;
  return [dx, dy];
}
/* preview: camera follows each creature, so it wanders near its cell centre
   while its heading follows a virtual drift (like wildlife footage).
   #film: the shark and whale really swim across the frame, whale dives. */
const PV = {W:1280, H:720};
const FILMT = {
  shark:{x:-230, y:.33, vx:150, W:450, dir:1, z:.86},
  whale:{x:1460, y:.40, vx:-128, W:560, dir:-1, z:.97, dv:{per:100, off:97.5, down:3.2, hold:1.2, up:4.8, Dk:.34}},
  betta:{x:.80, y:.08, W:250, dir:1},
  jelly:{x:.88, y:.83, W:220, dir:1}
};
function previewCycle(ci){
  const c = C[ci], R = rng(ci*131 + 7);
  const s = vw/1280;
  if (FILM){
    const f = FILMT[c.id];
    if (c.kind <= 1){
      const W = f.W*s, H = W*c.ar, spd = Math.abs(f.vx)*s;
      return {t0:-1e9, t1:1e9, t2:1e9, dir:f.dir, z:f.z, sc:1, W, H, cx:f.x*s, cy:f.y*vh, drift:0, spd, film:f,
              dv:f.dv, wv:mkWeave(c, R, spd, H, true)};
    }
    const W = f.W*s;
    return {t0:-1e9, t1:1e9, t2:1e9, dir:f.dir, z:1, sc:1, W, H:W*c.ar, cx:f.x*vw, cy:f.y*vh,
            drift:c.kind === 5 ? 95 : 14, spd:60};
  }
  const p = c.pv, W = p.W*s;
  const cyc = {t0:-1e9, t1:1e9, t2:1e9, dir:p.dir, z:1, sc:1, W, H:W*c.ar,
          cx:p.x*vw, cy:p.y*vh, drift:c.kind<=1||c.kind===5 ? 95 : 14, spd:95*s};
  if (c.kind <= 1) cyc.wv = mkWeave(c, R, 95*s, cyc.H, false);
  return cyc;
}
function basePos(ci, t, cyOv){
  if (REDUCE && !PREVIEW) return staticPos(ci);
  if (PREVIEW){
    const cy = cyOv || previewCycle(ci), s = vw/1280;
    if (DBG.freeze) return {x:cy.cx, y:cy.cy, cy};
    if (cy.wv){
      const [wx, wy] = weave(cy, t);
      return {x:cy.cx + (cy.film ? s*cy.film.vx*t : 0) + wx, y:cy.cy + wy, cy};
    }
    const ph = ci*1.7;
    const x = cy.cx + s*(26*Math.sin(.5*t + ph) + 10*Math.sin(.23*t + ph*2));
    const y = cy.cy + s*(32*Math.sin(.8*t + ph*.6) + 10*Math.sin(.31*t + ph));
    return {x, y, cy};
  }
  const cy = cyOv || cycleAt(ci, t);
  if (!cy) return null;
  if (!cyOv && t > cy.t1) return null;
  const u = clamp((t - cy.t0)/(cy.t1 - cy.t0), 0, 1);
  const P = {x:bez(cy.x0,cy.c1x,cy.c2x,cy.x1,u), y:bez(cy.y0,cy.c1y,cy.c2y,cy.y1,u), cy};
  if (cy.wv){
    // swerve fades in and out so the creature still enters and leaves on its planned line
    const k = Math.sin(Math.PI*u), [wx, wy] = weave(cy, t);
    P.x += wx*k; P.y += wy*k;
  }
  return P;
}
/* still layout for prefers-reduced-motion */
const SLOT = {shark:[.27,true], betta:[.73,true], jelly:[.27,false], whale:[.72,false]};
function staticPos(ci){
  const c = C[ci], bs = bands();
  const sl = SLOT[c.id];
  let bd = bs.length > 1 ? (sl[1] ? bs[0] : bs[1]) : bs[0];
  const slotW = vw/3, bandH = bd.hi - bd.lo;
  let W = Math.min(c.wf*Bx*.95, slotW*1.25), H = W*c.ar;
  if (H > bandH*.84) { const f = bandH*.84/H; W *= f; H *= f; }
  const dir = c.nat ? c.nat*(sl[1] ? 1 : -1) : 1;
  return {x:vw*sl[0], y:(bd.lo+bd.hi)/2, cy:{dir, z:.85, sc:1, W, H, drift:0, t0:-1e9, t1:1e9}};
}

/* ---------- creature state (pure function of t) ---------- */
function G(x){return 1 - Math.pow(1 - clamp(x,0,1), 2.6);}
function surgeOff(x){return G(x) - x;}
function wrapPi(a){while(a>Math.PI)a-=TAU;while(a<-Math.PI)a+=TAU;return a;}

/* whale dive: every DIVE.per seconds it pitches nose down, glides down, levels out
   at depth, then rises gently back. Pure function of time. */
const DIVE = {per:14, off:12.2, down:3.4, hold:1.4, up:6, Dk:.36};
const ease = x => {x = clamp(x,0,1); return x - Math.sin(TAU*x)/TAU;};       // smooth start and stop
const easeD = x => (x > 0 && x < 1) ? 1 - Math.cos(TAU*x) : 0;               // its slope
function diveAt(T, H, cy){
  const dv = cy && cy.dv ? Object.assign({}, DIVE, cy.dv) : DIVE;
  const u = (((T + dv.off) % dv.per) + dv.per) % dv.per, D = dv.Dk*H;
  const a = u/dv.down, b = (u - dv.down - dv.hold)/dv.up;
  const dy = D*(ease(a) - ease(b));
  const vy = D*(easeD(a)/dv.down - easeD(b)/dv.up);   // px per second, down is positive
  return {dy:dy - .22*D, vy};
}
function velAt(ci, cy, t, h){
  h = h || .03;
  const a = basePos(ci, t-h, cy), b = basePos(ci, t+h, cy);
  const d = cy.drift || 0;
  let vx = (b.x-a.x)/(2*h), vy = (b.y-a.y)/(2*h);
  if (PREVIEW && !DBG.freeze) vx += d*cy.dir;
  return [vx, vy];
}

/* ---- spine: 16 samples along the body, head right. Every sample follows the heading the head had
   a moment earlier (follow the leader), plus a travelling swim wave that grows toward the tail. ---- */
const SPN = 16, SX0 = .02, SX1 = .98, KN = 8;
const SPD = {
  0:{pts:[[.02,.58],[.14,.59],[.5,.51],[.85,.50],[.98,.46]], tau:2.3, amp:.105, fl:.020, k:4.4, L:.06, head:.97},
  1:{pts:[[.02,.32],[.04,.33],[.13,.39],[.22,.47],[.32,.52],[.45,.49],[.58,.40],[.70,.30],[.85,.19],[.96,.12],[.98,.11]],
     tau:3.6, amp:.058, fl:.060, k:3.3, L:.33, head:.95}
};
function restY(pts, x){
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]){
    const u = (x - pts[i-1][0])/(pts[i][0] - pts[i-1][0]); return lerp(pts[i-1][1], pts[i][1], u);
  }
  return pts[pts.length-1][1];
}
for (const k in SPD){
  const d = SPD[k]; d.ry = new Float32Array(SPN); d.xs = [];
  for (let j = 0; j < SPN; j++){const x = SX0 + (SX1 - SX0)*j/(SPN-1); d.xs.push(x); d.ry[j] = restY(d.pts, x);}
}
const sOfX = (x, d) => clamp((d.head - x)/(d.head - .04), 0, 1);
function thetaAt(ci, cy, tt, ms, H){
  const [vx, vy] = velAt(ci, cy, tt, .12);
  let vv = vy;
  if (C[ci].kind === 1) vv += 1.3*diveAt(tt, H, cy).vy;
  const hx = Math.max(vx*ms, .5*(cy.spd || 60));
  return Math.atan2(vv, hx);       // head-down positive, in the sprite's own frame
}
const spOut = new Float32Array(SPN*4);
function buildSpine(ci, cy, t, T, W, H, ms, wph, moving){
  const c = C[ci], d = SPD[c.kind], N = SPN;
  const th = new Float32Array(KN);
  let thc = 0;
  if (moving){
    for (let i = 0; i < KN; i++) th[i] = thetaAt(ci, cy, t - d.tau*i/(KN-1), ms, H);
    thc = thetaAt(ci, cy, t - d.tau*.47, ms, H);
  }
  const thAt = s => {const f = clamp(s, 0, 1)*(KN-1), i = Math.min(Math.floor(f), KN-2); return lerp(th[i], th[i+1], f - i);};
  const Rx = [], Ry = [], Sx = new Array(N), Sy = new Array(N), wv = [];
  const sw = 1 + .22*Math.sin(.31*T + ci*2);
  for (let j = 0; j < N; j++){
    Rx.push((d.xs[j] - .5)*W); Ry.push((d.ry[j] - .5)*H);
    const s = sOfX(d.xs[j], d), s2 = s*s;
    const am = (.05 + .95*Math.pow(s, 2.1));
    const ph = wph - d.k*s;
    wv.push(CFG.amp*sw*W*(d.amp*am*Math.sin(ph) + d.fl*smoothstepJS(.70, 1, s)*Math.sin(ph + 1.57)));
  }
  const cj = 8;
  Sx[cj] = Rx[cj]; Sy[cj] = Ry[cj];
  const seg = j => {                           // rotated rest segment j -> j+1
    const sm = sOfX((d.xs[j] + d.xs[j+1])/2, d);
    const b = moving ? CFG.amp*(thAt(sm) - thc) : 0;
    const co = Math.cos(b), si = Math.sin(b), vx = Rx[j+1] - Rx[j], vy = Ry[j+1] - Ry[j];
    return [co*vx - si*vy, si*vx + co*vy];
  };
  for (let j = cj; j < N-1; j++){const v = seg(j); Sx[j+1] = Sx[j] + v[0]; Sy[j+1] = Sy[j] + v[1];}
  for (let j = cj-1; j >= 0; j--){const v = seg(j); Sx[j] = Sx[j+1] - v[0]; Sy[j] = Sy[j+1] - v[1];}
  for (let j = 0; j < N; j++) Sy[j] += wv[j] - wv[cj];
  for (let j = 0; j < N; j++){
    const a = Math.max(j-1, 0), b = Math.min(j+1, N-1);
    const rho = Math.atan2(Sy[b]-Sy[a], Sx[b]-Sx[a]) - Math.atan2(Ry[b]-Ry[a], Rx[b]-Rx[a]);
    spOut[j*4] = Sx[j]; spOut[j*4+1] = Sy[j]; spOut[j*4+2] = Math.cos(rho); spOut[j*4+3] = Math.sin(rho);
  }
  return {sp:Float32Array.from(spOut), thc};
}
function state(ci, t){
  const c = C[ci], P = basePos(ci, t);
  if (!P) return null;
  const cy = P.cy, W = cy.W, H = cy.H, ms = cy.dir;
  let vx = 0, vy = 0, turn = 0;
  const live = !DBG.freeze && !(REDUCE && !PREVIEW);
  if (live) {
    [vx, vy] = velAt(ci, cy, t);
    if (c.kind === 5 || c.kind >= 2){
      const [ax, ay] = velAt(ci, cy, t-.25), [bx, by] = velAt(ci, cy, t+.25);
      turn = wrapPi(Math.atan2(by*ms, bx*ms) - Math.atan2(ay*ms, ax*ms))/.5;
    }
  }
  const sp = Math.hypot(vx, vy);
  let rot = 0, flip = 1, roll = 0, spine = null;
  const T = (REDUCE && !PREVIEW) ? 7 : t;
  const wph = TAU*(c.f*T + .06*Math.sin(.37*T + ci) + ci*.7);
  let ph = T/2.6 + ci*.13;   // jelly pulse phase
  let jet = 0, gl2 = 0, ox = 0, oy = 0, dive = 0;
  if (c.kind <= 1){
    flip = ms === c.nat ? 1 : -1;
    const sd = SPD[c.kind];
    spine = buildSpine(ci, cy, t, T, W, H, ms, wph, live);
    rot = flip*((DBG.pin || !live ? 0 : spine.thc) + sd.L);
    if (c.kind === 1 && live) dive = diveAt(T, H, cy).dy;
    roll = 0;
  } else if (c.kind === 5){
    const hd = clamp(Math.atan2(vy*ms, vx*ms), -.95, .95);
    rot = DBG.freeze ? 0 : hd;
    flip = ms === c.nat ? 1 : -1;
    roll = clamp(turn*ms*1.2, -.5, .5);
  } else if (c.kind === 3){
    rot = clamp(vx/(.09*Bx)*.28, -.28, .28) + .1*Math.sin(.45*T + ci);
    const S = .55*H;
    const so = -S*surgeOff(((ph%1)+1)%1);
    ox = Math.sin(rot)*(-so); oy = Math.cos(rot)*so;
  } else if (c.kind === 2){
    rot = clamp(vx/(.09*Bx)*.2, -.2, .2) + .08*Math.sin(.4*T + ci);
    const pj = (((T/5.5 + .4)%1)+1)%1;
    jet = pj < .25 ? Math.sin(pj/.25*Math.PI) : 0;
    gl2 = pj < .25 ? 0 : Math.exp(-(pj - .25)*3.2);
    const S = .55*H, so = -S*surgeOff(pj);
    ox = Math.sin(rot)*(-so); oy = Math.cos(rot)*so;
  }
  if (DBG.freeze){ ox = oy = 0; }
  // parallax camera
  const z = cy.z, cam = PREVIEW ? .25 : 1;
  const camx = Math.sin(.07*T)*26*cam, camy = Math.cos(.053*T)*12*cam;
  let px = P.x + ox + camx*(z-.45)*1.3, py = P.y + oy + dive + camy*(z-.45)*1.3;
  if (DBG.pin && c.kind <= 1){px = vw/2; py = vh/2;}
  // surge velocity adds to trail
  let tvx = vx, tvy = vy;
  if (c.kind === 3 || c.kind === 2){
    const dt = .05;
    const g = (tt) => {
      const pp = c.kind === 3 ? (((tt/2.6+ci*.13)%1)+1)%1 : (((tt/5.5+.4)%1)+1)%1;
      return -.55*H*surgeOff(pp);
    };
    const sv = (g(T+dt) - g(T-dt))/(2*dt);
    tvx += Math.sin(rot)*(-sv); tvy += Math.cos(rot)*sv;
  }
  const lag = c.kind === 3 ? .20 : .14;
  return {ci, x:px, y:py, W, H, rot, flip, z, sc:cy.sc,
          bright:.55 + .45*z, soft:(1-z)*.5, alpha:1, spine:spine ? spine.sp : null,
          wph, ph, jet, gl2, turn:clamp(-turn*ms*(c.kind===5?.5:1.1), -.32, .32),
          roll, trail:[-tvx*lag, -tvy*lag], speed:sp, t};
}

/* ---------- WebGL ---------- */
const gl = canvas.getContext("webgl", {alpha:false, antialias:false, premultipliedAlpha:true, powerPreference:"high-performance"});
let ready = false;
const VS = `
precision highp float;
attribute vec2 aUV;
uniform vec2 uRes, uPos, uSize, uPivot, uE;
uniform float uRot, uFlip, uKind, uW, uPh, uTurn, uRoll, uAmp, uJet, uGl;
uniform vec4 uSp[16];
uniform float uRy[16];
uniform vec2 uTrail;
varying vec2 vQ;
float pulse(float ph){ph=fract(ph);return ph<.3?sin(ph/.3*1.5708):pow(1.-(ph-.3)/.7,2.);}
/* fin: rotate the part of the picture inside a capsule about the fin root */
vec2 fin(vec2 q,vec2 root,vec2 tip,float wid,float ang,vec2 sz){
  vec2 P=(q-root)*sz,ax=(tip-root)*sz;
  float L2=dot(ax,ax),t=dot(P,ax)/L2;
  vec2 nr=vec2(-ax.y,ax.x)/sqrt(L2);
  float dn=abs(dot(P,nr)),w=wid*sz.x;
  float m=smoothstep(-.02,.12,t)*(1.-smoothstep(1.05,1.35,t))*(1.-smoothstep(w,w*1.9,dn));
  float a=ang*smoothstep(0.,.55,t)*m,c=cos(a),s=sin(a);
  return vec2(c*P.x-s*P.y,s*P.x+c*P.y)-P;
}
vec3 deform(vec2 q){
  float W=uSize.x,H=uSize.y,A=uAmp;
  vec2 d=vec2(0.);float tw=0.;
  if(uKind<1.5){                       // shark / whale: head right, tail left, bent along the spine
    float f=clamp((q.x-.02)/.96,0.,1.)*15.;
    float fi=min(floor(f),14.);float u=f-fi;int i=int(fi);
    vec4 a=uSp[i],b=uSp[i+1];
    float ry=mix(uRy[i],uRy[i+1],u);
    vec2 sp=mix(a.xy,b.xy,u);
    vec2 cs=mix(a.zw,b.zw,u);cs/=max(length(cs),.001);
    float xc=clamp(q.x,.02,.98);
    vec2 off=vec2((q.x-xc)*W,(q.y-ry)*H);
    vec2 pb=sp+vec2(cs.x*off.x-cs.y*off.y,cs.y*off.x+cs.x*off.y);
    // fins sweep on their own phase (pre-bend picture coordinates, rotated with the local spine)
    vec2 fd=vec2(0.);
    if(uKind<.5){
      fd+=fin(q,vec2(.55,.67),vec2(.25,.90),.055,A*.38*sin(uW*.7+2.6),uSize);
      fd+=fin(q,vec2(.665,.75),vec2(.72,.90),.045,A*.30*sin(uW*.7+3.4),uSize);
      fd+=fin(q,vec2(.47,.30),vec2(.44,.08),.05,A*.10*sin(uW-1.4),uSize);
    }else{
      fd+=fin(q,vec2(.58,.48),vec2(.43,.90),.085,A*.32*sin(uW*.8+1.3),uSize);
      fd+=fin(q,vec2(.72,.53),vec2(.73,.82),.060,A*.28*sin(uW*.8+2.4),uSize);
    }
    pb+=vec2(cs.x*fd.x-cs.y*fd.y,cs.y*fd.x+cs.x*fd.y);
    d=pb-(q-uPivot)*uSize;
  }else if(uKind<2.5){                 // octopus
    vec2 rv=(q-vec2(.55,.38))*vec2(W,H);
    float r=length(rv),nr=r/(.5*W);
    float w=smoothstep(.10,.55,nr);
    float ang=atan(rv.y,rv.x);
    vec2 perp=vec2(-rv.y,rv.x)/max(r,1.);
    float armPh=ang*1.2+.9*sin(ang*2.);
    d+=perp*A*W*.07*pow(w,1.8)*sin(uW-nr*3.+armPh);
    d+=perp*A*W*.018*pow(w,3.)*sin(uW*.7-nr*5.+armPh*1.3+1.);   // curling arm tips
    d+=normalize(rv+vec2(.001))*A*W*.012*pow(w,2.)*sin(uW*1.3-nr*3.+ang*2.);
    d-=rv*(.12*uJet*A)*w;                      // jet: arms pull in and stream together
    d.y+=H*.07*A*uGl*pow(w,1.6);               // glide: arms trail behind
    d+=rv*(1.-w)*A*(.055*sin(uW*1.6)-.10*uJet+.05*uGl);   // mantle squeezes on the jet, refills in the glide
    d.y+=H*.05*uJet*A*w;
    tw=w;
  }else if(uKind<3.5){                 // jellyfish
    float cx=.52,rim=.64;
    float c=pulse(uPh);
    float inB=1.-smoothstep(.62,.70,q.y);
    float ten=smoothstep(.60,1.,q.y);
    float cc=pulse(uPh-.30*clamp((q.y-rim)/.36,0.,1.));
    float sqz=A*(.34*c-.05*(1.-c))*(smoothstep(.06,.62,q.y)*inB)+.30*A*cc*(1.-inB)*(1.-.55*ten);
    d.x-=(q.x-cx)*W*sqz;
    d.y-=H*.11*A*c*smoothstep(.10,.62,q.y);
    d.y+=H*.09*A*ten*(1.-cc)-H*.04*A*ten*cc;
    d.x+=A*W*.09*pow(ten,1.3)*sin(uW*.9-ten*5.+q.x*9.);
    tw=pow(ten,1.2);
  }else{                               // betta clip: only a little steering bend
    float s=clamp((q.x-.10)/.85,0.,1.);
    d.y+=uTurn*A*W*.16*s*s;
  }
  return vec3(d,tw);
}
void main(){
  vec2 q=(aUV-.5)*uE+.5;
  vec3 dd=deform(q);
  vec2 p=(q-uPivot)*uSize+dd.xy;
  p.x*=uFlip;
  float c=cos(uRot),s=sin(uRot);
  vec2 r=vec2(c*p.x-s*p.y,s*p.x+c*p.y);
  vec2 pos=uPos+r+uTrail*dd.z;
  gl_Position=vec4(pos.x/uRes.x*2.-1.,1.-pos.y/uRes.y*2.,0.,1.);
  vQ=q;
}`;
const FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uTex,uTexB;
uniform vec4 uCellA,uCellB,uBmap;
uniform float uMode,uMix,uAlpha,uBright,uSoft,uGain,uIri,uTm;
uniform vec2 uRimR;
uniform mat3 uHue;
varying vec2 vQ;
vec3 hsv(float h,float s,float v){vec3 k=clamp(abs(fract(h+vec3(0.,2./3.,1./3.))*6.-3.)-1.,0.,1.);return v*mix(vec3(1.),k,s);}
/* slowly drifting blue / violet / cyan / magenta sheen along the body */
float irHue(vec2 q){
  float ph=q.x*3.6-q.y*2.0+uTm*.32+.55*sin(q.y*5.5+uTm*.45)+.35*sin(q.x*9.+uTm*.2);
  return .69+.19*sin(ph);
}
vec4 atlas(sampler2D t,vec2 q){
  vec2 qq=clamp(q,.003,.997);
  vec4 a=texture2D(t,uCellA.xy+qq*uCellA.zw);
  vec4 b=texture2D(t,uCellB.xy+qq*uCellB.zw);
  vec4 s=mix(a,b,uMix);
  return vec4(s.rgb,max(max(s.r,s.g),s.b));
}
void main(){
  vec2 q=vQ;
  float inside=step(0.,q.x)*step(q.x,1.)*step(0.,q.y)*step(q.y,1.);
  if(uMode<.5){                    // sprite body
    vec4 s=texture2D(uTex,clamp(q,0.,1.))*inside;
    vec4 b=texture2D(uTexB,q*uBmap.xy+uBmap.zw);
    vec4 c=mix(s,b,uSoft);
    vec3 outc=c.rgb;
    if(uIri>.01){
      vec3 col=c.rgb/max(c.a,.001);
      float lum=clamp(dot(col,vec3(.25,.6,.15))*1.25,0.,1.);
      vec3 cbl=b.rgb/max(b.a,.001); lum=mix(lum,clamp(dot(cbl,vec3(.25,.6,.15))*1.25,0.,1.),.30);
      float h=irHue(q);
      vec3 tint=hsv(h,.80-.38*smoothstep(.55,1.,lum),1.);
      float l2=smoothstep(.05,.8,lum);
      vec3 skin=tint*(.10+1.25*l2);
      skin=mix(skin,col*1.3,.22);
      // soft travelling sheen (broad, not a pattern)
      float sh=pow(.5+.5*sin(q.x*6.5-uTm*.7+q.y*2.5),5.);
      skin+=hsv(h+.14,.45,1.)*sh*.30*smoothstep(.1,.6,lum);
      // fins and the bright cyan edges glow harder
      skin+=hsv(h-.06,.65,1.)*smoothstep(.6,1.,lum)*.40;
      // rim light from the true silhouette
      float aa=0.;
      for(int i=0;i<8;i++){
        float an=float(i)*.7854;
        vec2 o=vec2(cos(an),sin(an))*uRimR;
        vec2 qq=q+o; aa+=texture2D(uTex,clamp(qq,0.,1.)).a*step(0.,qq.x)*step(qq.x,1.)*step(0.,qq.y)*step(qq.y,1.);
      }
      float rim=clamp(1.-aa/8.,0.,1.)*c.a*(1.-uSoft);
      skin+=hsv(h+.10,.55,1.)*rim*1.25;
      outc=mix(c.rgb,skin*c.a,uIri);
    }
    gl_FragColor=vec4(outc*uBright,c.a)*uAlpha;
  }else if(uMode<1.5){             // betta clip body (luminance key)
    vec4 s=atlas(uTex,q)*inside;
    vec4 b=atlas(uTexB,q)*inside;
    vec4 c=mix(s,b,uSoft);
    gl_FragColor=vec4(c.rgb*uBright,c.a)*uAlpha;
  }else if(uMode<2.5){             // sprite glow (hue shifted, additive)
    vec4 b=texture2D(uTexB,q*uBmap.xy+uBmap.zw);
    vec3 gc=uHue*b.rgb;
    if(uIri>.01){
      float lb=clamp(dot(b.rgb,vec3(.25,.6,.15))*1.4,0.,1.);
      gc=mix(gc,hsv(irHue(q)+.03,.85,1.)*(.2+1.2*lb)*smoothstep(0.,.25,b.a),uIri);
    }
    gl_FragColor=vec4(gc*uGain*uAlpha,0.);
  }else{                           // betta glow
    vec4 b=atlas(uTexB,q)*inside;
    gl_FragColor=vec4(uHue*b.rgb*uGain*uAlpha,0.);
  }
}`;
const SVS = `
attribute vec4 aS;
uniform float uT,uDpr; uniform vec2 uCam;
varying float vA;
void main(){
  float z=aS.z;
  vec2 p=vec2(fract(aS.x-uT*.0035*z+uCam.x*z*.0004),fract(aS.y+uT*.0022*z+uCam.y*z*.0004));
  gl_Position=vec4(p.x*2.-1.,1.-p.y*2.,0.,1.);
  gl_PointSize=aS.w*uDpr*(.7+z*.9);
  vA=(.22+.5*z)*(.65+.35*sin(uT*1.3+aS.x*40.));
}`;
const SFS = `
precision mediump float;
varying float vA;
void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.08,d);gl_FragColor=vec4(vec3(.5,.72,1.)*a*vA,0.);}`;

/* betta trail: soft additive blobs along the path the tail has just swum, colour-shifting and fading */
const TVS = `
attribute vec3 aP; attribute vec4 aC;
uniform vec2 uRes; uniform float uDpr;
varying vec4 vC;
void main(){
  gl_Position=vec4(aP.x/uRes.x*2.-1.,1.-aP.y/uRes.y*2.,0.,1.);
  gl_PointSize=aP.z*uDpr; vC=aC;
}`;
const TFS = `
precision mediump float;
varying vec4 vC;
void main(){
  float d=length(gl_PointCoord-.5)*2.;
  float a=exp(-d*d*3.2)*(1.-smoothstep(.85,1.,d));
  gl_FragColor=vec4(vC.rgb*a*vC.a,0.);
}`;
const TRAIL = {n:64, span:2.8};
let tprog, TU = {}, trailBuf;
const trailData = new Float32Array(TRAIL.n*7);
function hsl2rgb(h, s, l){
  h = ((h%360)+360)%360/360;
  const f = n => {const k = (n + h*12)%12; return l - s*Math.min(l,1-l)*Math.max(-1, Math.min(k-3, 9-k, 1));};
  return [f(0), f(8), f(4)];
}
function drawTrail(ci, t, s){
  const c = C[ci], W = s.W, H = s.H, cyc = basePos(ci, t) && basePos(ci, t).cy;
  const d = PREVIEW && cyc ? (cyc.drift || 0)*cyc.dir : 0;
  let n = 0, prev = null;
  for (let i = 0; i < TRAIL.n; i++){
    const a = i/(TRAIL.n-1), age = a*TRAIL.span, tt = t - age;
    const g = i === 0 ? s : state(ci, tt);
    if (!g) break;
    // emit point: mid-tail of the sprite, rotated into place
    let px = (.80 - .4154)*g.W*g.flip, py = (.34 - .3545)*g.H;
    const cs = Math.cos(g.rot), sn = Math.sin(g.rot);
    let x = g.x + cs*px - sn*py - d*age, y = g.y + sn*px + cs*py;
    if (prev && Math.hypot(x - prev[0], y - prev[1]) > W*.5) break;   // path restarted, stop here
    prev = [x, y];
    y += Math.sin(age*4.2 + t*1.3)*W*.012*a;                           // lazy ripple as it drifts
    const fade = Math.pow(1 - a, 1.7)*smoothstepJS(0, .03, a + .03);
    const hue = 300 + 70*Math.sin(.35*t) - age*85 + 40*Math.sin(age*1.7 + t*.5);
    const rgb = hsl2rgb(hue, .8, .55);
    const o = n*7;
    trailData[o] = x; trailData[o+1] = y; trailData[o+2] = W*(.11 + .16*a);
    trailData[o+3] = rgb[0]; trailData[o+4] = rgb[1]; trailData[o+5] = rgb[2];
    trailData[o+6] = .2*fade*(.35 + .65*s.z);
    n++;
  }
  if (n < 2) return;
  gl.useProgram(tprog);
  gl.blendFunc(gl.ONE, gl.ONE);
  gl.bindBuffer(gl.ARRAY_BUFFER, trailBuf);
  gl.bufferData(gl.ARRAY_BUFFER, trailData.subarray(0, n*7), gl.DYNAMIC_DRAW);
  const lp = gl.getAttribLocation(tprog, "aP"), lc = gl.getAttribLocation(tprog, "aC");
  gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 3, gl.FLOAT, false, 28, 0);
  gl.enableVertexAttribArray(lc); gl.vertexAttribPointer(lc, 4, gl.FLOAT, false, 28, 12);
  gl.uniform2f(TU.uRes, vw, vh); gl.uniform1f(TU.uDpr, dpr);
  gl.drawArrays(gl.POINTS, 0, n);
  gl.disableVertexAttribArray(lp); gl.disableVertexAttribArray(lc);
  // restore creature program state
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, meshBuf);
  const al = gl.getAttribLocation(prog, "aUV");
  gl.enableVertexAttribArray(al); gl.vertexAttribPointer(al, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
}
function smoothstepJS(a, b, x){const u = clamp((x-a)/(b-a), 0, 1); return u*u*(3-2*u);}

let prog, sprog, U = {}, SU = {}, meshBuf, idxBuf, idxCount, starBuf, STARN = 90;
const TEX = {};
function compile(type, src){
  const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error("shader: " + gl.getShaderInfoLog(s));
  return s;
}
function link(vs, fs){
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl.VERTEX_SHADER, vs)); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error("link: " + gl.getProgramInfoLog(p));
  return p;
}
function uniforms(p, names){const o={};names.forEach(n=>o[n]=gl.getUniformLocation(p,n));return o;}

function loadImg(src){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error("img"));i.src=src;});}
function mkTex(img, premul){
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premul);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return t;
}
/* soft padded copy of a sprite for glow and depth softness (blur done once on a small canvas) */
function makeBlur(img){
  const w = 150, h = Math.round(w*img.height/img.width);
  const pw = Math.round(w*.2), ph = Math.round(h*.2), cw = w + 2*pw, ch = h + 2*ph;
  const cv = document.createElement("canvas"); cv.width = cw; cv.height = ch;
  const x = cv.getContext("2d"); x.drawImage(img, pw, ph, w, h);
  const id = x.getImageData(0, 0, cw, ch), d = id.data, n = cw*ch;
  let A = new Float32Array(n*4), B = new Float32Array(n*4);
  for (let i = 0; i < n; i++){const a = d[i*4+3]/255; A[i*4]=d[i*4]/255*a; A[i*4+1]=d[i*4+1]/255*a; A[i*4+2]=d[i*4+2]/255*a; A[i*4+3]=a;}
  const rr = 4;
  for (let pass = 0; pass < 3; pass++){
    for (let y = 0; y < ch; y++) for (let k = 0; k < 4; k++){
      let s = 0; const o = y*cw;
      for (let xx = -rr; xx <= rr; xx++) s += A[(o + clamp(xx,0,cw-1))*4+k];
      for (let xx = 0; xx < cw; xx++){
        B[(o+xx)*4+k] = s/(2*rr+1);
        s += A[(o + clamp(xx+rr+1,0,cw-1))*4+k] - A[(o + clamp(xx-rr,0,cw-1))*4+k];
      }
    }
    for (let xx = 0; xx < cw; xx++) for (let k = 0; k < 4; k++){
      let s = 0;
      for (let yy = -rr; yy <= rr; yy++) s += B[(clamp(yy,0,ch-1)*cw + xx)*4+k];
      for (let yy = 0; yy < ch; yy++){
        A[(yy*cw+xx)*4+k] = s/(2*rr+1);
        s += B[(clamp(yy+rr+1,0,ch-1)*cw + xx)*4+k] - B[(clamp(yy-rr,0,ch-1)*cw + xx)*4+k];
      }
    }
  }
  for (let i = 0; i < n; i++){
    const a = A[i*4+3];
    if (a > 0.002){d[i*4]=Math.min(255,A[i*4]/a*255);d[i*4+1]=Math.min(255,A[i*4+1]/a*255);d[i*4+2]=Math.min(255,A[i*4+2]/a*255);d[i*4+3]=Math.min(255,a*255*1.0);}
    else {d[i*4]=d[i*4+1]=d[i*4+2]=d[i*4+3]=0;}
  }
  x.putImageData(id, 0, 0);
  return {cv, E:[cw/w, ch/h], map:[w/cw, h/ch, pw/cw, ph/ch]};
}

function hueM(deg){
  const a = deg*Math.PI/180, c = Math.cos(a), s = Math.sin(a);
  const r0 = [.213+.787*c-.213*s, .715-.715*c-.715*s, .072-.072*c+.928*s];
  const r1 = [.213-.213*c+.143*s, .715+.285*c+.140*s, .072-.072*c-.283*s];
  const r2 = [.213-.213*c-.787*s, .715-.715*c+.715*s, .072+.928*c+.072*s];
  return new Float32Array([r0[0],r1[0],r2[0],r0[1],r1[1],r2[1],r0[2],r1[2],r2[2]]);
}
function hueOf(ci, t){return C[ci].hue + 38*Math.sin(.11*t + ci*1.7) + 22*Math.sin(.043*t + ci);}

async function init(){
  if (!gl) return;
  prog = link(VS, FS); sprog = link(SVS, SFS); tprog = link(TVS, TFS);
  TU = uniforms(tprog, ["uRes","uDpr"]); trailBuf = gl.createBuffer();
  U = uniforms(prog, ["uRes","uPos","uSize","uPivot","uE","uRot","uFlip","uKind","uW","uPh","uTurn","uRoll","uAmp","uJet","uGl","uSp","uRy","uTrail",
    "uTex","uTexB","uCellA","uCellB","uBmap","uMode","uMix","uAlpha","uBright","uSoft","uGain","uHue","uIri","uTm","uRimR"]);
  SU = uniforms(sprog, ["uT","uDpr","uCam"]);
  // mesh
  const NX = 41, NY = 33, v = new Float32Array(NX*NY*2), ix = [];
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++){v[(j*NX+i)*2] = i/(NX-1); v[(j*NX+i)*2+1] = j/(NY-1);}
  for (let j = 0; j < NY-1; j++) for (let i = 0; i < NX-1; i++){
    const a = j*NX+i, b = a+1, c = a+NX, d = c+1; ix.push(a,b,c,b,d,c);
  }
  meshBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, meshBuf); gl.bufferData(gl.ARRAY_BUFFER, v, gl.STATIC_DRAW);
  idxBuf = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(ix), gl.STATIC_DRAW); idxCount = ix.length;
  // stars
  const R = rng(99), sd = new Float32Array(STARN*4);
  for (let i = 0; i < STARN; i++){sd[i*4]=R();sd[i*4+1]=R();sd[i*4+2]=.2+R()*.8;sd[i*4+3]=1.2+R()*2.2;}
  starBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, starBuf); gl.bufferData(gl.ARRAY_BUFFER, sd, gl.STATIC_DRAW);
  // textures
  const names = ["jelly","shark","whale"];
  const imgs = await Promise.all(names.map(n => loadImg(SRC[n])).concat([loadImg(SRC.bettaStrip), loadImg(SRC.bettaGlow)]));
  names.forEach((n, i) => {
    const bl = makeBlur(imgs[i]);
    TEX[n] = {tex:mkTex(imgs[i], true), texB:mkTex(bl.cv, true), E:bl.E, map:bl.map, atlas:false};
  });
  TEX.betta = {tex:mkTex(imgs[names.length], false), texB:mkTex(imgs[names.length+1], false), E:[1,1], map:[1,1,0,0], atlas:true};
  resize();
  ready = true;
  api.ready = true;
}

function resize(){
  measure();
  dpr = Math.min(window.devicePixelRatio || 1, 2)*quality;
  const w = Math.round(vw*dpr), h = Math.round(vh*dpr);
  if (canvas.width !== w || canvas.height !== h){canvas.width = w; canvas.height = h;}
}

const SEL = {x:0};
function bindTex(tx){
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tx.tex);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tx.texB);
}
function setCell(loc, f){
  const cw = 1/BETTA.cols, ch = 1/BETTA.rows;
  gl.uniform4f(loc, (f%BETTA.cols)*cw, Math.floor(f/BETTA.cols)*ch, cw, ch);
}
function bettaFrames(t){
  const n = BETTA.n, per = 2*(n-1);
  let p = (t*BETTA.fps)%per; if (p < 0) p += per;
  if (p > n-1) p = per - p;
  let f0 = Math.floor(p); const m = p - f0;
  return [f0, Math.min(f0+1, n-1), m];
}
function drawCreature(s, pass, aMul, hue){
  const c = C[s.ci], tx = TEX[c.id];
  bindTex(tx);
  const isB = c.kind === 5;
  gl.uniform2f(U.uRes, vw, vh);
  gl.uniform2f(U.uPos, s.x, s.y);
  gl.uniform2f(U.uSize, s.W, s.H);
  const pivot = isB ? [.4154, .3545] : [.5, .5];
  gl.uniform2f(U.uPivot, pivot[0], pivot[1]);
  const glow = pass === "glow";
  gl.uniform2f(U.uE, glow && !isB ? tx.E[0] : 1, glow && !isB ? tx.E[1] : 1);
  gl.uniform1f(U.uRot, s.rot); gl.uniform1f(U.uFlip, s.flip); gl.uniform1f(U.uKind, c.kind);
  gl.uniform1f(U.uW, s.wph % TAU); gl.uniform1f(U.uPh, s.ph); gl.uniform1f(U.uTurn, s.turn);
  gl.uniform1f(U.uRoll, s.roll); gl.uniform1f(U.uAmp, CFG.amp); gl.uniform1f(U.uJet, s.jet); gl.uniform1f(U.uGl, s.gl2);
  if (s.spine){gl.uniform4fv(U.uSp, s.spine); gl.uniform1fv(U.uRy, SPD[c.kind].ry);}
  gl.uniform2f(U.uTrail, s.trail[0], s.trail[1]);
  gl.uniform1i(U.uTex, 0); gl.uniform1i(U.uTexB, 1);
  gl.uniform4f(U.uBmap, tx.map[0], tx.map[1], tx.map[2], tx.map[3]);
  if (isB){
    const [f0, f1, m] = bettaFrames(s.t);
    setCell(U.uCellA, f0); setCell(U.uCellB, f1); gl.uniform1f(U.uMix, m);
  } else gl.uniform1f(U.uMix, 0);
  gl.uniform1f(U.uMode, (glow ? 2 : 0) + (isB ? 1 : 0));
  gl.uniform1f(U.uAlpha, aMul); gl.uniform1f(U.uBright, s.bright); gl.uniform1f(U.uSoft, s.soft);
  gl.uniform1f(U.uGain, c.gain);
  gl.uniform1f(U.uIri, c.kind <= 1 ? 1 : 0); gl.uniform1f(U.uTm, s.t*1.0 + c.kind*2.3);
  gl.uniform2f(U.uRimR, .0085, .0085/c.ar);
  if (glow) gl.uniformMatrix3fv(U.uHue, false, hue);
  gl.drawElements(gl.TRIANGLES, idxCount, gl.UNSIGNED_SHORT, 0);
}

let curT = 0;
function renderAt(t){
  if (!ready) return;
  curT = t;
  resize();
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND);
  gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
  // stars / marine snow
  gl.blendFunc(gl.ONE, gl.ONE);
  gl.useProgram(sprog);
  gl.bindBuffer(gl.ARRAY_BUFFER, starBuf);
  const sl = gl.getAttribLocation(sprog, "aS");
  gl.enableVertexAttribArray(sl); gl.vertexAttribPointer(sl, 4, gl.FLOAT, false, 0, 0);
  gl.uniform1f(SU.uT, t); gl.uniform1f(SU.uDpr, dpr);
  gl.uniform2f(SU.uCam, Math.sin(.07*t)*26*vw/20, Math.cos(.053*t)*12*vh/20);
  gl.drawArrays(gl.POINTS, 0, STARN);
  gl.disableVertexAttribArray(sl);
  // creatures, far to near
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, meshBuf);
  const al = gl.getAttribLocation(prog, "aUV");
  gl.enableVertexAttribArray(al); gl.vertexAttribPointer(al, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
  const live = [];
  for (let i = 0; i < C.length; i++){
    if (DBG.only >= 0 && DBG.only !== i) continue;
    const s = state(i, t);
    if (!s) continue;
    const rad = Math.max(s.W, s.H)*.75;
    if (s.x < -rad || s.x > vw + rad || s.y < -rad || s.y > vh + rad) continue;
    live.push(s);
  }
  live.sort((a, b) => a.z - b.z);
  const still = REDUCE && !PREVIEW;
  for (const s of live){
    const hue = hueM(hueOf(s.ci, s.t));
    if (C[s.ci].kind === 5 && !still && !DBG.freeze && !DBG.noTrail) drawTrail(s.ci, t, s);
    if (!DBG.noGlow){
      gl.blendFunc(gl.ONE, gl.ONE);
      drawCreature(s, "glow", .85*(.4 + .6*s.z), hue);
    }
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    if (!still && !DBG.noGhost && !DBG.freeze && C[s.ci].kind > 1){
      const k = clamp(s.speed/420, 0, 1)*.20 + (C[s.ci].kind===3||C[s.ci].kind===2 ? .06 : 0);
      if (k > .02){
        for (const dtg of [.14, .07]){
          const g = state(s.ci, t - dtg);
          if (g) drawCreature(g, "body", k*(dtg > .1 ? .6 : 1), null);
        }
      }
    }
    drawCreature(s, "body", s.alpha, null);
  }
  gl.disableVertexAttribArray(al);
}

/* ---------- loop ---------- */
let rafId = 0, t0 = 0, paused = false, fpsEma = 60, lastNow = 0, slow = 0;
function frame(now){
  rafId = requestAnimationFrame(frame);
  if (paused) return;
  if (!t0) t0 = now;
  const dt = lastNow ? now - lastNow : 16.7; lastNow = now;
  fpsEma += (1000/Math.max(dt, 1) - fpsEma)*.05;
  // keep it smooth on weak phones: soften render resolution a little if frames run long
  if (!PREVIEW && !STEP){
    slow = dt > 26 ? slow + 1 : Math.max(0, slow - 1);
    if (slow > 45 && quality > .6){quality *= .8; slow = 0;}
  }
  renderAt((now - t0)/1000*CFG.speed);
}
const api = window.__aulickBg = {
  ready: false,
  fps: () => Math.round(fpsEma),
  creatures: () => C.map((c, i) => {const s = state(i, curT); return s ? {id:c.id, x:s.x, y:s.y, w:s.W, h:s.H, rot:s.rot} : null;}),
  hueNow: () => hueOf(0, curT),
  renderAt, cfg: CFG, dbg: DBG,
  pause: () => {paused = true;}, resume: () => {paused = false;},
  mode: {preview: PREVIEW, step: STEP, reduce: REDUCE},
  textRect: () => textRect, bands
};
addEventListener("resize", () => {if (ready){resize(); if (REDUCE || STEP) renderAt(curT || 7);}});
init().then(() => {
  if (!gl) return;
  if (REDUCE && !PREVIEW) { renderAt(7); }
  else if (STEP) { renderAt(0); }
  else rafId = requestAnimationFrame(frame);
}).catch(e => {console.warn("background unavailable", e && e.message);});
})();
