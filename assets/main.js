const _asset = (src) => (typeof window !== 'undefined' && window.__ASSETS && window.__ASSETS[src]) || src;
// Movin' Artists Market — scroll film (Active Theory-style sequence, re-skinned)
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const Q = new URLSearchParams(location.search);
const CAPTURE = Q.has('capture');
const RM = !CAPTURE && matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = s => document.querySelector(s);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (p, a, b) => clamp((p - a) / (b - a));
const sstep = t => t * t * (3 - 2 * t);
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eout = t => 1 - Math.pow(1 - t, 3);
const ein = t => t * t * t;
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// ---------------------------------------------------------------- content
const CARDS = [
  { t: ['DESIGN'], s: 'LOGOS · INTROS · END CARDS', n: 'SVC.01 // 111 HZ', img: 'i4' },
  { t: ['FILM'], s: 'SHOOT DAYS · EVENT RECAPS', n: 'SVC.02 // 222 HZ', img: 'hall' },
  { t: ['EDIT'], s: '15–30S PROMOS · ADS · REELS', n: 'SVC.03 // 333 HZ', img: 'i8' },
  { t: ['PROMOTE'], s: 'IG · TIKTOK · YOUTUBE', n: 'SVC.04 // 444 HZ', img: 'i1' },
  { t: ['BOOST'], s: 'PAID REACH · NEW LOCAL AUDIENCES', n: 'SVC.05 // 555 HZ', img: 'i5' },
  { t: ['WEBSITE'], s: 'A HOME ON THE GRID', n: 'SVC.06 // 666 HZ', img: 'lobby' },
  { t: ['SIGNAL', 'NODE'], s: '$175 / MO — TIER 01', n: 'PLAN // TIER 01', img: 'entrance' },
  { t: ['CARRIER', 'BOOST'], s: '$350 / MO — TIER 02', n: 'PLAN // TIER 02', img: 'monogram' },
  { t: ['SHRINE', 'ACTIVATION'], s: '$600 / MO — TIER 03', n: 'PLAN // TIER 03', img: 'hero' },
];
const SCENES = [[0, 'SCN 01 — SIGNAL'], [.09, 'SCN 02 — IGNITION'], [.25, 'SCN 03 — THE MARK'], [.41, 'SCN 04 — SERVICES'], [.75, 'SCN 05 — THE CORE'], [.875, 'SCN 06 — THE MARKET'], [.95, 'SCN 07 — JOIN US']];

// reduced motion: static page
if (RM) {
  document.body.classList.add('rm', 'ready');
  $('#still').hidden = false;
  $('#still .s-grid').innerHTML = CARDS.slice(0, 6).map(c => `<div><img src="assets/img/${c.img}.webp" alt=""><h3>${c.t.join(' ')}</h3><p class="mono">${c.s}</p></div>`).join('');
  $('#still .s-plans').innerHTML = $('#plans').innerHTML;
  throw new Error('reduced-motion: static fallback');
}

// ---------------------------------------------------------------- renderer
const canvas = $('#gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: CAPTURE });
const DPR = CAPTURE ? 1 : Math.min(devicePixelRatio, 1.5);
renderer.setPixelRatio(DPR);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, .05, 400);
const pmrem = new THREE.PMREMGenerator(renderer);
const env = pmrem.fromScene(new RoomEnvironment(), .04).texture;
scene.environment = env;
scene.environmentIntensity = 1.0;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .6, .5, .9);
composer.addPass(bloom);
const fx = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uGlitch: { value: 0 }, uAb: { value: .0015 }, uVig: { value: 1 }, uFlash: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) } },
  vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `uniform sampler2D tDiffuse;uniform float uTime,uGlitch,uAb,uVig,uFlash;uniform vec2 uRes;varying vec2 vUv;
  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  void main(){vec2 uv=vUv;float g=uGlitch;
    float band=floor(uv.y*mix(18.,60.,h(vec2(floor(uTime*14.),3.))));float r=h(vec2(band,floor(uTime*20.)));
    if(r<g*.65) uv.x+= (h(vec2(band,floor(uTime*30.)))-.5)*.22*g;
    vec2 blk=floor(uv*vec2(16.,9.));if(h(blk+floor(uTime*12.))<g*.18) uv+= (vec2(h(blk),h(blk+1.))-.5)*.06*g;
    vec2 d=(uv-.5);float ab=uAb+g*.02;
    vec3 c=vec3(texture2D(tDiffuse,uv-d*ab).r,texture2D(tDiffuse,uv).g,texture2D(tDiffuse,uv+d*ab).b);
    c+=uFlash*vec3(1.,.82,.5);
    c*=mix(1.,smoothstep(1.15,.25,length(d*vec2(1.,.9))),uVig);
    c+= (h(uv*uRes+fract(uTime)*91.)-.5)*.035;
    c*=1.-g*.25*step(.5,fract(uv.y*uRes.y*.5));
    gl_FragColor=vec4(c,1.);}`
});
composer.addPass(fx);
composer.addPass(new OutputPass());

// ---------------------------------------------------------------- loaders
const tl = new THREE.TextureLoader();
const loadTex = (u, srgb = true) => new Promise(r => tl.load(_asset(u), t => { if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; r(t); }));
const loadImg = u => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = _asset(u); });

function radialTex(stops, size = 256) {
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d');
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const glowTex = radialTex([[0, 'rgba(255,236,190,1)'], [.18, 'rgba(255,196,90,.55)'], [.45, 'rgba(255,130,30,.16)'], [1, 'rgba(0,0,0,0)']]);
const softTex = radialTex([[0, 'rgba(255,255,255,1)'], [.4, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']], 64);

// ---------------------------------------------------------------- shared shader chunks
const NOISE = `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
i=mod289(i);vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}
float fbm(vec3 p){float f=0.,a=.5;for(int i=0;i<5;i++){f+=a*snoise(p);p*=2.02;a*=.5;}return f;}`;

// ---------------------------------------------------------------- background nebula
const skyU = { uTime: { value: 0 }, uNeb: { value: 0 }, uFire: { value: 0 }, uDeep: { value: 0 }, uCol: { value: 0 } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(150, 48, 32), new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false,
  vertexShader: `varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: NOISE + `uniform float uTime,uNeb,uFire,uDeep,uCol;varying vec3 vP;
  void main(){vec3 p=vP*2.2;float n=fbm(p+vec3(0.,uTime*.02,uTime*.015));float n2=fbm(p*1.7-vec3(uTime*.03,0.,0.)+n);
    vec3 base=vec3(.006,.008,.014);
    vec3 neb=mix(vec3(.02,.05,.13),vec3(.09,.17,.38),smoothstep(-.2,.6,n2));
    neb+=vec3(.55,.22,.04)*pow(smoothstep(.25,.9,n*n2*2.+.2),2.)*.35;
    neb*=smoothstep(-.5,.5,n)*.9+.15;
    vec3 fire=mix(vec3(.04,.015,0.),vec3(1.,.5,.08),smoothstep(-.05,.75,n2))*smoothstep(-.25,.55,n)*1.2+vec3(1.,.85,.35)*pow(smoothstep(.35,.9,n2),3.)*1.2;
    vec3 col=base+ neb*uNeb*.26 + fire*uFire*.38;
    float vy=vP.y;vec3 deep=mix(vec3(.01,.015,.04),vec3(.03,.06,.16),smoothstep(-.3,.6,vy))+vec3(.35,.18,.04)*pow(max(0.,-vy),3.)*.4;
    col=mix(col,deep*(.8+.4*n2),uDeep);
    vec3 colm=mix(vec3(.04,.07,.24),vec3(.55,.2,.03),smoothstep(.55,.95,n2*.5+.5))*(.35+.65*smoothstep(-.4,.5,n));
    col=mix(col,colm*.22+base,uCol);
    gl_FragColor=vec4(col,1.);}`
}));
scene.add(sky);

// ---------------------------------------------------------------- ambient gold dust
function makeDust(count, box, center) {
  const g = new THREE.BufferGeometry(); const pos = new Float32Array(count * 3), rnd = new Float32Array(count), col = new Float32Array(count * 3);
  const pal = [[1, .78, .3], [1, .62, .16], [.95, .9, .55], [1, .45, .1], [.85, .95, .5]];
  for (let i = 0; i < count; i++) {
    pos[i * 3] = center.x + (Math.random() - .5) * box.x; pos[i * 3 + 1] = center.y + (Math.random() - .5) * box.y; pos[i * 3 + 2] = center.z + (Math.random() - .5) * box.z;
    rnd[i] = Math.random(); const c = pal[(Math.random() * pal.length) | 0]; col.set(c, i * 3);
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aR', new THREE.BufferAttribute(rnd, 1)); g.setAttribute('aC', new THREE.BufferAttribute(col, 3));
  const u = { uTime: { value: 0 }, uA: { value: 1 }, uPR: { value: DPR }, uSz: { value: 34 }, uScroll: { value: 0 } };
  const m = new THREE.ShaderMaterial({
    uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float aR;attribute vec3 aC;uniform float uTime,uPR,uSz,uScroll,uA;varying vec3 vC;varying float vA;
    void main(){vec3 p=position;p.y+=sin(uTime*.3+aR*30.)*.25+uScroll*(aR-.5)*3.;p.x+=cos(uTime*.25+aR*20.)*.2;
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
      float tw=.35+.65*pow(.5+.5*sin(uTime*(1.5+aR*3.)+aR*60.),3.);
      gl_PointSize=min(uSz*uPR*(.3+aR*.9)/-mv.z,48.);vC=aC*(1.+tw*1.6);vA=uA*tw;}`,
    fragmentShader: `varying vec3 vC;varying float vA;void main(){float r=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,r);a*=a;gl_FragColor=vec4(vC*a*vA,a*vA);}`
  });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; return pts;
}
const dust = makeDust(3200, new THREE.Vector3(30, 18, 34), new THREE.Vector3(0, 0, -6)); scene.add(dust);
const dust2 = makeDust(1600, new THREE.Vector3(26, 22, 26), new THREE.Vector3(0, -42, -2)); scene.add(dust2);

// ---------------------------------------------------------------- the mark (chrome M/A)
const LOGO_AR = 1246 / 1263;
const LW = 1.45, LH = LW * LOGO_AR;
const logoU = { map: { value: null }, uTime: { value: 0 }, uA: { value: 1 }, uShine: { value: 1 }, uWarm: { value: .18 }, uCut: { value: 0 }, uSweep: { value: -1 }, uCharge: { value: 0 } };
const logoVS = `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const logoFS = `uniform sampler2D map;uniform float uTime,uA,uShine,uWarm,uCut,uSweep,uCharge;varying vec2 vUv;
void main(){vec4 t=texture2D(map,vUv);
  if(uCut>.5&&t.a<.5)discard;
  float sw=vUv.x*.8+(1.-vUv.y)*.6;float sweep=smoothstep(.1,0.,abs(sw-uSweep))+.45*smoothstep(.22,0.,abs(sw-uSweep+.16));
  float l=dot(t.rgb,vec3(.333));
  vec3 warm=mix(vec3(1.),vec3(1.06,.92,.72),uWarm);
  vec3 c=t.rgb*warm*1.05;
  c+= vec3(1.,.8,.45)*sweep*uShine*2.2*smoothstep(.35,1.,l);
  c+= vec3(1.,.7,.3)*pow(l,8.)*.35*uShine;
  c=mix(c,c*vec3(1.25,1.02,.7)+vec3(.35,.2,.04)*l,uCharge);
  gl_FragColor=vec4(c,t.a*uA*(uCut>.5?1.:1.));}`;
const logoMat = new THREE.ShaderMaterial({ uniforms: logoU, vertexShader: logoVS, fragmentShader: logoFS, transparent: true, depthWrite: false });
const mark = new THREE.Group(); scene.add(mark);
const logo = new THREE.Mesh(new THREE.PlaneGeometry(LW, LH), logoMat); mark.add(logo);
const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffb648, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .35 }));
halo.scale.set(5, 5, 1); halo.position.z = -.3; mark.add(halo);
const chrome = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: .16, clearcoat: 1, clearcoatRoughness: .05, iridescence: .9, iridescenceIOR: 1.7, iridescenceThicknessRange: [250, 800], envMapIntensity: .75 });
const arcU = { uArc: { value: 1 }, uArcRot: { value: 0 } };
function arcClip(m) {
  m.onBeforeCompile = sh => {
    sh.uniforms.uArc = arcU.uArc; sh.uniforms.uArcRot = arcU.uArcRot;
    sh.vertexShader = 'varying vec3 vLoc;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvLoc=position;');
    sh.fragmentShader = 'uniform float uArc,uArcRot;varying vec3 vLoc;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\n float ang=fract((atan(vLoc.y,vLoc.x)+3.14159265)/6.2831853-uArcRot);if(ang>uArc)discard;');
  }; return m;
}
const ringMat = arcClip(chrome.clone());
const ring = new THREE.Mesh(new THREE.TorusGeometry(1.32, .085, 40, 220), ringMat); mark.add(ring);
const drawHead = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffe2a0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
drawHead.scale.set(.9, .9, 1); mark.add(drawHead);
const ringGlow = new THREE.Mesh(new THREE.TorusGeometry(1.32, .012, 8, 220), arcClip(new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.05, .5), transparent: true, opacity: .6 })));
ringGlow.position.z = .09; mark.add(ringGlow);
// swooping lines (hourglass under the mark)
const swoopU = { uTime: { value: 0 }, uDraw: { value: 1 }, uA: { value: .75 }, uWave: { value: 1 } };
const swoopMat = new THREE.ShaderMaterial({ uniforms: swoopU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `uniform float uTime,uWave;varying vec2 vUv;void main(){vUv=uv;vec3 p=position;float k=smoothstep(-1.2,-2.,p.y);
    p.x+=sin(p.y*1.7-uTime*1.6)*.07*k*uWave;p.z+=cos(p.y*1.3-uTime*1.2)*.08*k*uWave;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
  fragmentShader: `uniform float uTime,uDraw,uA;varying vec2 vUv;void main(){float u=vUv.x;if(u>uDraw)discard;
    float head=smoothstep(.06,0.,uDraw-u)*step(uDraw,.999);
    float glint=smoothstep(.07,0.,abs(fract(u*.8-uTime*.35)-.5));
    vec3 c=vec3(1.,.9,.7)*(.8+glint*1.4)+vec3(1.,.8,.4)*head*3.;
    float a=uA*(1.-smoothstep(.85,1.,u)*.6);gl_FragColor=vec4(c*a,a);}` });
const swoops = new THREE.Group(); mark.add(swoops);
[1, -1].forEach(s => {
  const c = new THREE.CatmullRomCurve3([[-.12 * s, -1.25, 0], [-.55 * s, -1.75, .1], [-.2 * s, -2.55, .25], [.55 * s, -3.4, .1], [.85 * s, -4.15, -.1], [.35 * s, -4.75, -.25], [-.45 * s, -5.1, -.3]].map(a => new THREE.Vector3(...a)));
  swoops.add(new THREE.Mesh(new THREE.TubeGeometry(c, 160, .011, 6, false), swoopMat));
});

// orbiting gold dust that spirals toward the mark (and gets sucked in on charge-up)
const orbGeo = new THREE.BufferGeometry(); { const n = 1800, a = [], r = [], z = [], q = []; for (let i = 0; i < n; i++) { a.push(Math.random() * 6.283); r.push(Math.random()); z.push((Math.random() - .5) * 2); q.push(Math.random()); }
  orbGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Array(n * 3).fill(0), 3)); orbGeo.setAttribute('aA', new THREE.Float32BufferAttribute(a, 1)); orbGeo.setAttribute('aRad', new THREE.Float32BufferAttribute(r, 1)); orbGeo.setAttribute('aZ', new THREE.Float32BufferAttribute(z, 1)); orbGeo.setAttribute('aR', new THREE.Float32BufferAttribute(q, 1)); }
const orbU = { uTime: { value: 0 }, uA: { value: 0 }, uSuck: { value: 0 }, uPR: { value: DPR } };
const orb = new THREE.Points(orbGeo, new THREE.ShaderMaterial({ uniforms: orbU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `attribute float aA,aRad,aZ,aR;uniform float uTime,uSuck,uPR,uA;varying vec3 vC;varying float vA;
  void main(){float sp=.05+aR*.08+uSuck*uSuck*1.6;float life=fract(aRad-uTime*sp);
    float r=mix(1.,7.5,life);r=mix(r,r*.18+.15,uSuck*uSuck);
    float ang=aA+uTime*(.35+aR*.3)/(.4+r*.35)+uSuck*uSuck*9./(r+.3);
    vec3 p=vec3(cos(ang)*r,sin(ang)*r*.82-.25,aZ*r*.45);
    vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
    gl_PointSize=min((28.+aR*46.)*uPR*(1.+uSuck*.6)/-mv.z,22.);
    float tw=.6+.4*sin(uTime*(2.+aR*4.)+aR*50.);
    vC=mix(vec3(1.,.66,.2),vec3(1.,.92,.65),aR)*(1.1+uSuck*1.8)*tw;
    vA=uA*smoothstep(1.,.75,life)*smoothstep(0.,.12,life)*(.55+.45*aR);}`,
  fragmentShader: `varying vec3 vC;varying float vA;void main(){float r=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,r);a*=a;gl_FragColor=vec4(vC*a*vA,a*vA);}` }));
orb.frustumCulled = false;
// light streaks / speed lines rushing past the camera
const strGeo = new THREE.BufferGeometry(); { const n = 260, P = [], A = [], C = [], idx = [];
  for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, r = .55 + Math.pow(Math.random(), .7) * 4.5, z0 = Math.random(), L = .8 + Math.random() * 2.4, w = .004 + Math.random() * .014, q = Math.random();
    [[-1, 0], [1, 0], [1, 1], [-1, 1]].forEach(([sd, e]) => { P.push(0, 0, 0); A.push(a, r, z0, L); C.push(sd, e, w, q); });
    const b = i * 4; idx.push(b, b + 1, b + 2, b, b + 2, b + 3); }
  strGeo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); strGeo.setAttribute('aS', new THREE.Float32BufferAttribute(A, 4)); strGeo.setAttribute('aC', new THREE.Float32BufferAttribute(C, 4)); strGeo.setIndex(idx); }
const strU = { uTime: { value: 0 }, uA: { value: 0 }, uSpeed: { value: 1 }, uZ: { value: 0 } };
const streaks = new THREE.Mesh(strGeo, new THREE.ShaderMaterial({ uniforms: strU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  vertexShader: `attribute vec4 aS,aC;uniform float uTime,uSpeed,uZ;varying float vE;varying float vQ;varying float vZ;
  void main(){float z=mix(-16.,4.,fract(aS.z+uTime*uSpeed*(.6+aC.w*.8)))+uZ;
    vec2 d=vec2(cos(aS.x),sin(aS.x));vec2 tg=vec2(-d.y,d.x);
    vec3 p=vec3(d*aS.y+tg*aC.x*aC.z,z+aC.y*aS.w*(.6+uSpeed*.25));
    vE=aC.y;vQ=aC.w;vZ=z-uZ;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
  fragmentShader: `uniform float uA;varying float vE;varying float vQ;varying float vZ;void main(){
    vec3 c=mix(vec3(1.,.62,.18),vec3(1.,.95,.8),vQ)*1.8;float a=uA*vE*vE*smoothstep(-16.,-10.,vZ)*smoothstep(4.,1.,vZ)*(.4+.6*vQ);gl_FragColor=vec4(c*a,a);}` }));
streaks.frustumCulled = false; scene.add(streaks);
// shockwave rings
const shockMat = () => new THREE.ShaderMaterial({ uniforms: { uA: { value: 0 }, uW: { value: .06 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `uniform float uA,uW;varying vec2 vUv;void main(){float r=length(vUv-.5)*2.;float b=smoothstep(uW,0.,abs(r-.94));float inner=smoothstep(.94,.5,r)*.12;
    vec3 c=mix(vec3(1.,.55,.12),vec3(1.,.95,.8),b);gl_FragColor=vec4(c*(b*1.6+inner)*uA,(b+inner)*uA);}` });
const shocks = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), shockMat()); m.visible = false; return m; });

// ---------------------------------------------------------------- logo particles (sampled from the PNG alpha)
let burst, burstU;
async function buildBurst() {
  const img = await loadImg('assets/chrome-ma-640.png');
  const W = 210, H = Math.round(W * LOGO_AR); const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0, W, H); const d = g.getImageData(0, 0, W, H).data;
  const home = [], dir = [], rnd = [], col = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4; if (d[i + 3] < 120) continue;
    for (let k = 0; k < 1; k++) {
      const px = (x / W - .5) * LW + (Math.random() - .5) * LW / W, py = -(y / H - .5) * LH + (Math.random() - .5) * LH / H, pz = (Math.random() - .5) * .04;
      home.push(px, py, pz);
      const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      let dx = Math.sin(ph) * Math.cos(th) + px * 1.2, dy = Math.sin(ph) * Math.sin(th) + py * 1.2, dz = Math.cos(ph) * .5 + .15;
      const l = Math.hypot(dx, dy, dz); dir.push(dx / l, dy / l, dz / l);
      rnd.push(Math.random()); const b = (d[i] + d[i + 1] + d[i + 2]) / 765; col.push(b * 1.1, b * 1.05, b * .95);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(home, 3)); geo.setAttribute('aDir', new THREE.Float32BufferAttribute(dir, 3));
  geo.setAttribute('aR', new THREE.Float32BufferAttribute(rnd, 1)); geo.setAttribute('aC', new THREE.Float32BufferAttribute(col, 3));
  burstU = { uE: { value: 0 }, uTime: { value: 0 }, uA: { value: 0 }, uPR: { value: DPR }, uSz: { value: 12 }, uSwirl: { value: .4 } };
  burst = new THREE.Points(geo, new THREE.ShaderMaterial({
    uniforms: burstU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: NOISE + `attribute vec3 aDir,aC;attribute float aR;uniform float uE,uTime,uPR,uSz,uA,uSwirl;varying vec3 vC;varying float vA;
    void main(){float e=uE;vec3 p=position;
      float d=e*(1.2+aR*aR*7.)*(.6+.4*e);
      p+=aDir*d;
      p+=vec3(snoise(p*.6+uTime*.2),snoise(p*.6+7.+uTime*.2),snoise(p*.6+13.))*e*1.0;
      float ang=uSwirl*d*.32*(1.+.25*sin(aR*31.));float cs=cos(ang),sn=sin(ang);p.xy=mat2(cs,-sn,sn,cs)*p.xy;
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
      float big=step(.82,aR);gl_PointSize=min(uSz*uPR*(1.+e*(1.+aR*3.))*(1.+big*1.2)/-mv.z,46.);
      float heat=smoothstep(0.,.25,e);
      vec3 hot=mix(vec3(1.,.93,.75),mix(vec3(1.,.7,.18),vec3(1.,.38,.06),aR),smoothstep(.15,.8,e));
      vC=mix(aC*1.1,hot*(1.05+big*1.3),heat);
      vA=uA*(1.-smoothstep(.9,1.,e)*.2)*(.8+.2*sin(uTime*11.+aR*80.))*mix(.55,1.,big)*mix(.45,1.,smoothstep(.0,.35,e));}`,
    fragmentShader: `varying vec3 vC;varying float vA;void main(){float r=length(gl_PointCoord-.5);float a=smoothstep(.5,.05,r);gl_FragColor=vec4(vC*a*vA,a*vA);}`
  }));
  burst.frustumCulled = false; mark.add(burst);
  // trail ghosts: same particles a few frames behind, dimmer & smaller
  [[.06, .28, .75], [.13, .13, .55]].forEach(([lag, a, sz]) => {
    const m = burst.material.clone(); const u = m.uniforms; u.uLag = { value: lag }; u.uAm = { value: a }; u.uSm = { value: sz };
    const g = new THREE.Points(geo, m); g.frustumCulled = false; g.userData = u; mark.add(g); ghosts.push(g);
  });
}
const ghosts = [];
// big soft fire blobs for the explosion
const fireGeo = new THREE.BufferGeometry(); { const n = 700, p = [], d = [], r = []; for (let i = 0; i < n; i++) { const th = Math.random() * 6.283, ph = Math.acos(2 * Math.random() - 1); p.push(0, 0, 0); d.push(Math.sin(ph) * Math.cos(th), Math.sin(ph) * Math.sin(th) * .8, Math.abs(Math.cos(ph)) * .9); r.push(Math.random()); } fireGeo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); fireGeo.setAttribute('aDir', new THREE.Float32BufferAttribute(d, 3)); fireGeo.setAttribute('aR', new THREE.Float32BufferAttribute(r, 1)); }
const fireU = { uE: { value: 0 }, uA: { value: 0 }, uTime: { value: 0 }, uPR: { value: DPR }, map: { value: softTex } };
const fire = new THREE.Points(fireGeo, new THREE.ShaderMaterial({
  uniforms: fireU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `attribute vec3 aDir;attribute float aR;uniform float uE,uTime,uPR,uA;varying vec3 vC;varying float vA;
  void main(){vec3 p=aDir*(pow(uE,.6)*(1.+aR*7.))+vec3(sin(aR*90.+uTime),cos(aR*70.+uTime),0.)*.3*uE;
   vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
   gl_PointSize=min((60.+aR*260.)*uPR*(.5+uE)/max(-mv.z,.6),200.);
   vC=mix(vec3(1.,.5,.06),vec3(1.,.88,.45),aR*aR)*1.2;vA=uA*(.18+.35*(1.-aR))*(1.-smoothstep(.45,.9,uE));}`,
  fragmentShader: `uniform sampler2D map;varying vec3 vC;varying float vA;void main(){float a=texture2D(map,gl_PointCoord).a;gl_FragColor=vec4(vC*a*vA,a*vA);}`
}));
fire.frustumCulled = false; mark.add(fire);
const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xfff0d0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
flash.scale.set(12, 12, 1); mark.add(flash);
mark.add(orb); shocks.forEach(m => mark.add(m));

// ---------------------------------------------------------------- spine column (carousel backdrop)
const colU = { uTime: { value: 0 }, uA: { value: 0 }, uFlow: { value: 0 } };
const column = new THREE.Mesh(new THREE.CylinderGeometry(.62, .62, 16, 96, 260, true), new THREE.ShaderMaterial({
  uniforms: colU, transparent: true, depthWrite: true, side: THREE.DoubleSide,
  vertexShader: NOISE + `uniform float uTime,uFlow;varying vec3 vN;varying vec3 vV;varying float vNz;varying float vY;varying vec3 vW;
  void main(){vec3 p=position;float y=p.y;float tw=y*.55+uTime*.15+uFlow*4.;
    float c=cos(tw),s=sin(tw);p.xz=mat2(c,-s,s,c)*p.xz;
    float n=snoise(vec3(p.x*1.4,y*.45-uFlow*6.-uTime*.25,p.z*1.4));float n2=snoise(vec3(p.x*3.,y*1.6+uTime*.2,p.z*3.));
    vec3 nrm=normalize(vec3(p.x,0.,p.z));
    float bulge=.55+.6*smoothstep(-.4,1.,sin(y*.9+uFlow*5.))+n*.75+n2*.22;
    p+=nrm*bulge*.9;p+=nrm*snoise(p*4.5+uTime*.1)*.18;vNz=n;vY=y;vW=(modelMatrix*vec4(p,1.)).xyz;
    vec4 mv=modelViewMatrix*vec4(p,1.);vV=-mv.xyz;vN=normalize(normalMatrix*nrm);gl_Position=projectionMatrix*mv;}`,
  fragmentShader: `uniform float uA,uTime;varying vec3 vN;varying vec3 vV;varying float vNz;varying float vY;varying vec3 vW;
  void main(){vec3 n=normalize(cross(dFdx(vW),dFdy(vW)));vec3 v=normalize(cameraPosition-vW);if(dot(n,v)<0.)n=-n;
    float f=pow(1.-abs(dot(n,v)),2.);
    float dk=max(dot(n,normalize(vec3(.6,.8,.5))),0.);float dr=max(dot(n,normalize(vec3(-.8,-.2,.4))),0.);
    vec3 blue=vec3(.09,.2,.62);vec3 org=vec3(1.,.45,.1);vec3 gold=vec3(1.,.8,.42);
    float m=smoothstep(-.05,.6,vNz);
    vec3 c=mix(blue*.25,org*.55,m)*(.25+dk*.9)+blue*.35*dr;
    c+=gold*pow(dk,8.)*m*.9;
    c+=mix(vec3(.3,.45,1.),gold,m)*f*.35;
    float fade=smoothstep(8.,3.5,abs(vY));
    gl_FragColor=vec4(c,uA*fade);}`
}));
column.position.set(.35, 0, -3.2); scene.add(column);
// ember petals around the spine
const embersGeo = new THREE.BufferGeometry(); { const n = 2600, p = [], r = [], c = []; const pal = [[1, .45, .1], [1, .72, .25], [.25, .45, 1], [1, .2, .08], [1, .9, .7]]; for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, rr = .9 + Math.pow(Math.random(), 2) * 2.6, y = (Math.random() - .5) * 13; p.push(Math.cos(a) * rr, y, Math.sin(a) * rr); r.push(Math.random()); c.push(...pal[(Math.random() * pal.length) | 0]); } embersGeo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); embersGeo.setAttribute('aR', new THREE.Float32BufferAttribute(r, 1)); embersGeo.setAttribute('aC', new THREE.Float32BufferAttribute(c, 3)); }
const embU = { uTime: { value: 0 }, uA: { value: 0 }, uFlow: { value: 0 }, uPR: { value: DPR } };
const embers = new THREE.Points(embersGeo, new THREE.ShaderMaterial({
  uniforms: embU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `attribute float aR;attribute vec3 aC;uniform float uTime,uA,uFlow,uPR;varying vec3 vC;varying float vA;
  void main(){vec3 p=position;float a=uTime*(.1+aR*.2)+uFlow*3.*(aR+.3);float c=cos(a),s=sin(a);p.xz=mat2(c,-s,s,c)*p.xz;p.y=mod(p.y+uFlow*8.*(aR-.3)+6.5,13.)-6.5;
    vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=min((10.+aR*26.)*uPR/-mv.z,40.);
    vC=aC*1.1;vA=uA*.8*smoothstep(6.5,3.,abs(p.y));}`,
  fragmentShader: `varying vec3 vC;varying float vA;void main(){vec2 q=gl_PointCoord-.5;float a=smoothstep(.5,.1,length(q*vec2(1.,1.7)));gl_FragColor=vec4(vC*a*vA,a*vA);}`
}));
embers.frustumCulled = false; embers.position.copy(column.position); scene.add(embers);

// ---------------------------------------------------------------- glass cards
const cardsG = new THREE.Group(); scene.add(cardsG);
const cards = [];
const CW = 2.5, CH = 1.56;
function titleTex(card, i) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 640; const g = c.getContext('2d', { willReadFrequently: true });
  g.textBaseline = 'alphabetic';
  g.font = '600 22px "JetBrains Mono"'; g.fillStyle = 'rgba(255,215,122,.95)'; g.fillText(card.n, 52, 70);
  g.textAlign = 'right'; g.fillStyle = 'rgba(239,230,210,.75)'; g.fillText(String(i + 1).padStart(2, '0') + ' / 09', 972, 70); g.textAlign = 'left';
  const lines = card.t; const fs = lines.length > 1 ? (lines.some(l => l.length > 7) ? 170 : 200) : 250;
  g.font = `900 ${fs}px "Big Shoulders Display"`;
  const lh = fs * .86; const y0 = 320 + lh * .32 - (lines.length - 1) * lh / 2;
  const draw = (dx, dy, col) => { g.fillStyle = col; lines.forEach((l, k) => g.fillText(l, 52 + dx, y0 + k * lh + dy)); };
  draw(-9, 0, 'rgba(255,120,20,.55)'); draw(9, 3, 'rgba(60,110,255,.55)'); draw(0, 0, 'rgba(240,234,222,.97)');
  // glitch slices
  for (let k = 0; k < 4; k++) { const y = 160 + hash(i * 13 + k) * 320, h = 4 + hash(i * 7 + k) * 12, dx = (hash(i * 3 + k * 5) - .5) * 36; const s = g.getImageData(0, y, 1024, h); g.putImageData(s, dx, y); }
  g.font = '400 24px "JetBrains Mono"'; g.fillStyle = 'rgba(239,230,210,.85)'; g.fillText(card.s, 52, 590);
  g.strokeStyle = 'rgba(255,215,122,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(52, 96); g.lineTo(240, 96); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
async function buildCards() {
  const geo = new RoundedBoxGeometry(CW, CH, .14, 6, .1);
  for (let i = 0; i < CARDS.length; i++) {
    const tex = await loadTex(`assets/img/${CARDS[i].img}.webp`);
    const g = new THREE.Group();
    const img = new THREE.Mesh(new THREE.PlaneGeometry(CW * .9, CH * .86), new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(1.15, 1.1, 1.05) }));
    img.position.z = -.12; g.add(img);
    const glass = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: .28, transmission: 1, thickness: .9, ior: 1.45, dispersion: 4, clearcoat: 1, clearcoatRoughness: .1, specularIntensity: 1, envMapIntensity: 1.2, iridescence: .35, attenuationColor: new THREE.Color(1, .95, .88), attenuationDistance: 3 }));
    g.add(glass);
    const tt = new THREE.Mesh(new THREE.PlaneGeometry(CW * .96, CW * .96 * .625), new THREE.MeshBasicMaterial({ map: titleTex(CARDS[i], i), transparent: true, depthWrite: false, toneMapped: false }));
    tt.position.z = .085; g.add(tt);
    const edge = new THREE.Mesh(new THREE.PlaneGeometry(CW * 1.25, CH * 1.35), new THREE.MeshBasicMaterial({ map: glowTex, color: i > 5 ? 0xff8a1e : 0x3b6dff, transparent: true, opacity: .0, depthWrite: false, blending: THREE.AdditiveBlending }));
    edge.position.z = -.25; g.add(edge);
    g.userData = { tt, edge, i }; cardsG.add(g); cards.push(g);
  }
}

// ---------------------------------------------------------------- core / lab
const core = new THREE.Group(); core.position.set(0, -42, 0); scene.add(core);
const darkMetal = new THREE.MeshStandardMaterial({ color: 0x1b1d22, metalness: .9, roughness: .38, envMapIntensity: .7 });
const brass = new THREE.MeshStandardMaterial({ color: 0xc9953a, metalness: 1, roughness: .22, envMapIntensity: 1.2 });
const crystal = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25, 0), new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: .02, transmission: 1, thickness: .5, ior: 1.25, dispersion: 3, iridescence: .6, flatShading: true, attenuationColor: new THREE.Color(1, .85, .55), attenuationDistance: 2.2, envMapIntensity: 1.6 }));
core.add(crystal);
const coreLogoU = { ...logoU, uCut: { value: 1 }, uA: { value: 1 }, map: logoU.map, uSweep: { value: -1 }, uCharge: { value: 0 } };
const coreLogo = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.15 * LOGO_AR), new THREE.ShaderMaterial({ uniforms: coreLogoU, vertexShader: logoVS, fragmentShader: logoFS, transparent: false, side: THREE.DoubleSide }));
core.add(coreLogo);
const coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffa83a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .9 }));
coreGlow.scale.set(7, 7, 1); coreGlow.position.z = -.6; core.add(coreGlow);
const coreLight = new THREE.PointLight(0xffb050, 40, 30, 1.6); core.add(coreLight);
const rimLight = new THREE.DirectionalLight(0x4a74ff, 2.2); rimLight.position.set(-6, 8, -6); core.add(rimLight); rimLight.target = crystal;
const rings = [];
[[2.0, .07, brass], [2.55, .05, chrome], [3.15, .11, darkMetal], [3.7, .03, brass]].forEach(([r, t, m], k) => {
  const o = new THREE.Mesh(new THREE.TorusGeometry(r, t, 24, 180), m); o.rotation.set(hash(k) * 3, hash(k + 9) * 3, 0); core.add(o); rings.push(o);
  if (k == 0) { const gl = new THREE.Mesh(new THREE.TorusGeometry(r, .008, 6, 180), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.2, .8, .35) })); o.add(gl); }
});
// pipes, frame, wires, floor
for (let k = 0; k < 18; k++) {
  const a = k / 18 * 6.283 + hash(k) * .3, R = 5.5 + hash(k + 3) * 3.5, r = .1 + hash(k + 5) * .28; if (Math.sin(a) > .2) continue;
  const p = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 22, 16), darkMetal); p.position.set(Math.cos(a) * R, 3, Math.sin(a) * R - 1); core.add(p);
  if (k % 3 == 0) { const b = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.4, r * 1.4, .25, 16), brass); b.position.copy(p.position); b.position.y = -1 + hash(k) * 4; core.add(b); }
}
for (let k = 0; k < 6; k++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, 20, 12), darkMetal); p.rotation.z = Math.PI / 2; p.rotation.y = hash(k + 20) * 3; p.position.set(0, 4.5 + k * 1.1, -4 + hash(k) * 3); core.add(p); }
{ const S = 3.2, e = [[-1, -1], [1, -1], [1, 1], [-1, 1]]; const bm = new THREE.MeshStandardMaterial({ color: 0x3a3f4a, metalness: .9, roughness: .3 });
  e.forEach(([x, z]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(.12, S * 2, .12), bm); b.position.set(x * S, 0, z * S); core.add(b); });
  [-S, S].forEach(y => { [[S * 2, .12, .12, 0, -S], [S * 2, .12, .12, 0, S], [.12, .12, S * 2, -S, 0], [.12, .12, S * 2, S, 0]].forEach(([w, h, d, x, z]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bm); b.position.set(x, y, z); core.add(b); }); }); }
const wireMat = new THREE.MeshStandardMaterial({ color: 0x0c0d10, metalness: .5, roughness: .5 });
const hotWire = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.3, .6, .15) });
for (let k = 0; k < 16; k++) {
  const a = hash(k + 40) * 6.283, b = a + 1 + hash(k + 41) * 2.5, R = 3.4 + hash(k + 42) * 3;
  const p0 = new THREE.Vector3(Math.cos(a) * R, 9, Math.sin(a) * R), p2 = new THREE.Vector3(Math.cos(b) * 1.2, .8 + hash(k) * 1.5, Math.sin(b) * 1.2);
  const p1 = p0.clone().lerp(p2, .5); p1.y -= 2.5 + hash(k + 43) * 3;
  const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(p0, p1, p2), 40, k % 5 == 0 ? .018 : .035, 6), k % 5 == 0 ? hotWire : wireMat); core.add(tube);
}
const floorU = { uTime: { value: 0 } };
const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShaderMaterial({
  uniforms: floorU,
  vertexShader: `varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
  fragmentShader: NOISE + `uniform float uTime;varying vec3 vW;void main(){vec2 q=vW.xz;float d=length(q);
    vec2 g=abs(fract(q*.5)-.5);float line=smoothstep(.03,.0,min(g.x,g.y));
    float w=snoise(vec3(q*.35,uTime*.25))*.5+.5;
    vec3 c=vec3(.01,.015,.03)+vec3(.05,.1,.28)*w*.6;
    c+=vec3(1.,.62,.2)*line*.1*smoothstep(12.,2.,d);
    c+=vec3(1.,.6,.2)*.35*smoothstep(6.,0.,d);
    gl_FragColor=vec4(c*smoothstep(30.,8.,d),1.);}`
}));
floor.rotation.x = -Math.PI / 2; floor.position.y = -3.4; core.add(floor);

// ---------------------------------------------------------------- mosaic ("THE MARKET") on 2D canvas
const mc = $('#mosaic'), mg = mc.getContext('2d');
const src = document.createElement('canvas'), sg = src.getContext('2d', { willReadFrequently: true });
let logoImg;
function sizeMosaic() { mc.width = innerWidth; mc.height = innerHeight; }
function drawMosaic(t, k) {
  const W = mc.width, H = mc.height, P = H > W;
  mg.fillStyle = '#040406'; mg.fillRect(0, 0, W, H);
  // top: pixel water band (blue + gold glints)
  const wb = H * (P ? .3 : .36), px = Math.max(6, Math.round(W / 190));
  for (let y = 0; y < wb; y += px) for (let x = 0; x < W; x += px) {
    const yy = y / wb, v = Math.sin(x * .012 + t * 1.3 + Math.sin(y * .05 + t) * 2) * .5 + Math.sin(x * .031 - t * 1.7 + y * .02) * .5;
    const l = (v * .5 + .5) * (.25 + yy * .75);
    const gl = Math.pow(Math.max(0, v), 6) * yy;
    mg.fillStyle = `rgb(${(18 + l * 50 + gl * 230) | 0},${(28 + l * 70 + gl * 170) | 0},${(70 + l * 140 + gl * 60) | 0})`;
    mg.fillRect(x, y, px - 1, px - 1);
  }
  const hg = mg.createLinearGradient(0, wb - 40, 0, wb + 30); hg.addColorStop(0, 'rgba(4,4,6,0)'); hg.addColorStop(1, 'rgba(4,4,6,1)'); mg.fillStyle = hg; mg.fillRect(0, wb - 40, W, 70);
  // strip
  const sy = P ? H * .38 : H * .47, sh = P ? H * .5 : H * .42, sx = W * (P ? .04 : .12), sw = W * (P ? .92 : .76);
  const cell = Math.max(9, Math.round(sh / (P ? 34 : 28)));
  const cols = Math.ceil(sw / cell), rows = Math.ceil(sh / (cell * .866));
  src.width = cols; src.height = rows;
  const gr = sg.createRadialGradient(cols * .64, rows * .5, 0, cols * .64, rows * .5, cols * .5);
  gr.addColorStop(0, '#fff2c0'); gr.addColorStop(.25, '#e2a13a'); gr.addColorStop(.6, '#5a3208'); gr.addColorStop(1, '#100800');
  sg.fillStyle = gr; sg.fillRect(0, 0, cols, rows);
  // concentric pulse
  for (let r = 0; r < 6; r++) { sg.strokeStyle = `rgba(255,220,140,${.25 + .2 * Math.sin(t * 3 + r)})`; sg.lineWidth = 1; sg.beginPath(); sg.arc(cols * .64, rows * .5, ((r * 6 + t * 9) % 36) + 2, 0, 6.283); sg.stroke(); }
  // M/A silhouette in the mosaic
  if (logoImg && !P) { const lh = rows * .6, lw = lh / LOGO_AR; sg.globalAlpha = .9; sg.drawImage(logoImg, cols * .68 - lw / 2, rows * .2, lw, lh); sg.globalAlpha = 1; }
  // right panel: amber/red noise field
  const rx = cols * .78; for (let y = 0; y < rows; y++) for (let x = rx; x < cols; x++) { const n = hash(x * 3.1 + y * 17.7 + Math.floor(t * 8)); sg.fillStyle = `rgba(${200 + n * 55 | 0},${70 + n * 120 | 0},${20 + n * 40 | 0},${.5 + n * .5})`; sg.fillRect(x, y, 1, 1); }
  const id = sg.getImageData(0, 0, cols, rows).data;
  const ox = sx, oy = sy;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = (r * cols + c) * 4, R = id[i], G = id[i + 1], B = id[i + 2]; const l = (R * .3 + G * .59 + B * .11) / 255;
    if (l < .04) continue;
    const x = ox + c * cell + (r & 1 ? cell / 2 : 0), y = oy + r * cell * .866;
    // reveal: diagonal wipe
    if ((c / cols + r / rows * .3) > k * 1.6) continue;
    const rad = cell * .5 * (.35 + .65 * Math.min(1, l * 1.4));
    mg.fillStyle = `rgb(${R},${G},${B})`; mg.beginPath();
    for (let a = 0; a < 6; a++) { const an = a * 1.0472 + .5236; mg.lineTo(x + Math.cos(an) * rad, y + Math.sin(an) * rad); }
    mg.fill();
  }
  // left emblem: ring + real chrome M/A
  const ecx = sx + sw * (P ? .17 : .1), ecy = sy + sh * .5, er = sh * (P ? .2 : .36);
  mg.fillStyle = 'rgba(4,4,6,.92)'; mg.beginPath(); mg.arc(ecx, ecy, er * 1.12, 0, 6.283); mg.fill();
  mg.strokeStyle = '#e2b04a'; mg.lineWidth = Math.max(2, er * .035); mg.beginPath(); mg.arc(ecx, ecy, er, 0, 6.283); mg.stroke();
  mg.setLineDash([4, 6]); mg.lineWidth = 1; mg.beginPath(); mg.arc(ecx, ecy, er * 1.08, t * .5, t * .5 + 6.283); mg.stroke(); mg.setLineDash([]);
  if (logoImg) { const lw = er * 1.25, lh = lw * LOGO_AR; mg.drawImage(logoImg, ecx - lw / 2, ecy - lh / 2, lw, lh); }
  // pixel title, distressed
  const fs = Math.round(P ? W * .085 : sh * .2);
  mg.font = `700 ${fs}px Silkscreen`; mg.textBaseline = 'top';
  const tx = P ? sx + sw * .34 : sx + sw * .19, ty = P ? sy + sh * .1 : sy + sh * .2;
  mg.fillStyle = 'rgba(255,120,20,.5)'; mg.fillText('// THE', tx - 3, ty); mg.fillText('MARKET', tx - 3, ty + fs * 1.02);
  mg.fillStyle = '#fff1cf'; mg.fillText('// THE', tx, ty); mg.fillText('MARKET', tx, ty + fs * 1.02);
  // distress: knock out pixels
  mg.fillStyle = '#060507';
  for (let n = 0; n < 110; n++) { const q = hash(n * 9.13 + Math.floor(t * 6) * .37); const q2 = hash(n * 4.7 + 2); const s = 2 + (hash(n * 1.3) * 3 | 0); mg.globalAlpha = .6; mg.fillRect(tx + q * fs * 3.6, ty + q2 * fs * 2.1, s, s); }
  mg.globalAlpha = 1;
  mg.font = `400 ${Math.max(10, Math.round(fs * .16))}px "JetBrains Mono"`; mg.fillStyle = '#ffe2a0';
  const mx = P ? tx : sx + sw * .815, my = P ? ty + fs * 2.4 : sy + sh * .3;
  mg.fillStyle = 'rgba(4,4,6,.72)'; mg.fillRect(mx - 10, my - 10, fs * 3.2, fs * 1.25); mg.fillStyle = '#ffe2a0';
  ['OUR HOME FOR LOCAL BRANDS.', 'WHERE SIGNALS TURN INTO', 'PRODUCTS, MERCH & DROPS.', '', 'PROVIDENCE // 41.8240 N'].forEach((l, i) => mg.fillText(l, mx, my + i * fs * .22));
  // scanline + slices during entry
  if (k < .5) { for (let n = 0; n < 10; n++) { const y = hash(n + Math.floor(t * 30)) * H, h = 4 + hash(n * 3) * 30; mg.drawImage(mc, 0, y, W, h, (hash(n * 7 + t) - .5) * 120, y, W, h); } }
}

// ---------------------------------------------------------------- DOM timeline (GSAP, driven by p)
const domTL = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
domTL.set({}, {}, 1);
domTL.fromTo('#hero', { opacity: 0 }, { opacity: 1, duration: .03 }, .262)
  .fromTo('#hero h1 span', { yPercent: 70, opacity: 0, clipPath: 'inset(0 0 100% 0)' }, { yPercent: 0, opacity: 1, clipPath: 'inset(0 0 0% 0)', stagger: .01, duration: .045, ease: 'power3.out' }, .262)
  .fromTo('#hero .copy p', { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: .008, duration: .04, ease: 'power3.out' }, .28)
  .to('#hero h1', { y: () => -innerHeight * .9, duration: .065, ease: 'power2.in' }, .365)
  .to('#hero .copy', { y: () => -innerHeight * 1.2, duration: .065, ease: 'power2.in' }, .365)
  .to('#hero', { opacity: 0, duration: .02 }, .43)
  .fromTo('#services', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .03, ease: 'power2.out' }, .43)
  .fromTo('#services li', { x: -20, opacity: 0 }, { x: 0, opacity: 1, stagger: .004, duration: .02 }, .435)
  .fromTo('#cardIdx', { opacity: 0 }, { opacity: 1, duration: .02 }, .44)
  .to(['#services', '#cardIdx'], { opacity: 0, y: 40, duration: .025 }, .755)
  .fromTo('#mosaic', { opacity: 0 }, { opacity: 1, duration: .012 }, .878)
  .fromTo('#plans', { opacity: 0 }, { opacity: 1, duration: .02 }, .948)
  .fromTo('.endhead', { y: 60 }, { y: 0, duration: .03, ease: 'power3.out' }, .948)
  .fromTo('.tier', { y: 80, opacity: 0, rotateX: 25 }, { y: 0, opacity: 1, rotateX: 0, stagger: .008, duration: .03, ease: 'power3.out' }, .952)
  .fromTo('#contact', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .02 }, .97);

// ---------------------------------------------------------------- camera path
const V = (x, y, z) => new THREE.Vector3(x, y, z);
let portrait = false, K = 1; // K: depth scale for portrait
const camPos = new THREE.Vector3(), camTgt = new THREE.Vector3();
function cameraAt(p, t = 0, shake = 0) {
  // intro → rush → hero → carousel → plunge → core
  const z0 = 11 * K;
  if (p < .25) {
    const a = eio(seg(p, 0, .1)), b = ein(seg(p, .08, .14));
    camPos.set(0, lerp(-.6, -.2, a), lerp(z0, z0 * .78, a) - b * (z0 * .78 - 1.6));
    camTgt.set(0, lerp(-1.3, -.2, a), 0);
    if (p > .14) { const c = eout(seg(p, .14, .26)); camPos.set(Math.sin(c * 3.14) * .5, 0, lerp(1.6, 7.2 * K, c)); camTgt.set(0, 0, 0); }
  } else if (p < .76) {
    const h = seg(p, .25, .42);
    camPos.set(lerp(.3, 0, h), lerp(0, .15, h), lerp(7.2 * K, 7.6 * K, h)); camTgt.set(0, 0, 0);
  } else {
    const d = seg(p, .745, .835), e = eio(d), look = Math.sin(Math.PI * Math.min(1, d * 1.1));
    camPos.set(0, lerp(.15, -41.3, e), lerp(7.6 * K, 9.2 * K, e));
    camTgt.set(0, lerp(0, -42, e) - look * 7, 0);
    const o = sstep(seg(p, .835, 1)); camPos.x += Math.sin(o * 2.2) * 2.2; camPos.z -= o * 2.2; camPos.y += o * .6;
  }
  if (p < .3) { const dr = 1 - seg(p, .1, .14); camPos.x += Math.sin(t * .37) * .22 * dr; camPos.y += Math.sin(t * .29 + 1) * .14 * dr; camTgt.x += Math.sin(t * .23) * .08 * dr; }
  if (shake > 0) { const k = Math.floor(t * 60); camPos.x += (hash(k) - .5) * shake; camPos.y += (hash(k + 99) - .5) * shake; camTgt.x += (hash(k + 7) - .5) * shake * .6; }
  camera.position.copy(camPos); camera.lookAt(camTgt);
}

// ---------------------------------------------------------------- per-frame scene update
const ui = { scnName: $('#scnName'), scnPct: $('#scnPct'), rail: $('#railFill'), cardNum: $('#cardNum'), cardName: $('#cardName'), lis: [...document.querySelectorAll('#services li')] };
let lastCard = -1, lastScn = '';
let T0 = CAPTURE ? 1 : 0;
const typeEls = [...document.querySelectorAll('#log span, #scn span')].map(el => ({ el, txt: el.textContent }));
const hudBits = { brand: $('.brand'), pills: [...document.querySelectorAll('.pills > *')], ticks: [...document.querySelectorAll('.tick')], rail: $('#rail') };
let uiDone = false;
function introUI(lt) {
  if (uiDone) return;
  const k = v => String(v);
  hudBits.brand.style.opacity = k(sstep(seg(lt, .1, .6))); hudBits.brand.style.transform = `translateY(${(1 - eout(seg(lt, .1, .7))) * -14}px)`;
  hudBits.pills.forEach((el, i) => { const a = seg(lt, .35 + i * .1, .8 + i * .1); el.style.opacity = k(sstep(a)); el.style.transform = `translateY(${(1 - eout(a)) * -12}px)`; });
  hudBits.ticks.forEach((el, i) => { const a = eout(seg(lt, .2 + i * .06, .8 + i * .06)); el.style.opacity = k(a); el.style.transform = `scale(${2 - a})`; });
  hudBits.rail.style.transform = `scaleY(${eout(seg(lt, .6, 1.4))})`;
  typeEls.forEach(({ el, txt }, i) => { if (el.id === 'scnPct') return; const a = seg(lt, .5 + i * .18, 1.3 + i * .18); const n = Math.round(txt.length * a);
    el.textContent = txt.slice(0, n) + (a > 0 && a < 1 ? '▌' : ''); if (!el.textContent) el.innerHTML = '&nbsp;'; });
  if (lt > 2.6) { uiDone = true; typeEls.forEach(({ el, txt }) => { if (el.id !== 'scnPct') el.textContent = txt; }); }
}
function update(p, t) {
  const hero = seg(p, .26, .42);
  const lt = Math.max(0, t - T0); // seconds since load (intro animation clock)
  const charge = ein(seg(p, .045, .12)) * (1 - seg(p, .121, .13));
  const ex0 = seg(p, .12, .2);
  const kick = seg(p, .118, .122) * (1 - seg(p, .122, .15));
  cameraAt(p, t, charge * charge * .07 + kick * .22);
  introUI(lt);
  sky.position.copy(camera.position);
  // ---- shared time uniforms
  [skyU, dust.material.uniforms, dust2.material.uniforms, logoU, colU, embU, floorU, fireU, orbU, strU, swoopU].forEach(u => u.uTime.value = t);
  if (burstU) burstU.uTime.value = t;
  fx.uniforms.uTime.value = t;
  // ---- background moods
  const fireAmt = seg(p, .11, .135) * (1 - seg(p, .19, .26));
  skyU.uFire.value = fireAmt * .45; skyU.uNeb.value = seg(p, .2, .3); skyU.uCol.value = seg(p, .4, .46) * (1 - seg(p, .74, .8)); skyU.uDeep.value = seg(p, .745, .8);
  dust.material.uniforms.uA.value = (1 - seg(p, .735, .78)) * (1 - fireAmt * .6) * lerp(1, .55, seg(p, .4, .45));
  dust.material.uniforms.uScroll.value = p * 4;
  dust2.material.uniforms.uA.value = seg(p, .77, .83);
  // ---- the mark
  const ex = ex0, rf = seg(p, .2, .275);
  const E = ex < 1 ? eout(ex) : Math.pow(1 - rf, 2.4);
  mark.visible = p < .5;
  const intro = 1 - seg(p, .115, .121);
  const load = sstep(seg(lt, 0, .7));
  const lock = seg(p, .262, .278) * (1 - seg(p, .278, .31)); // logo "locks in" after the vortex
  logoU.uA.value = Math.max(intro * load, sstep(seg(p, .255, .282)));
  logo.scale.setScalar(lerp(.86, 1, eout(load)) * (1 - charge * .1 + Math.sin(t * 40) * charge * charge * .012) * (1 + lock * .06));
  // shimmer: load sweep, then slow periodic sweeps, then rapid sweeps while charging
  const per = (lt - 1.6) / 2.4; const slow = lt < 1.6 ? lerp(-.4, 1.9, seg(lt, .35, 1.35)) : lerp(-.4, 1.9, sstep(clamp((per - Math.floor(per)) * 1.6)));
  logoU.uSweep.value = charge > .05 ? lerp(-.4, 1.9, (t * (1.4 + charge * 2.5)) % 1) : slow;
  if (p > .2) logoU.uSweep.value = lerp(-.4, 1.9, seg(p, .27, .31));
  logoU.uShine.value = 1 + charge * .8 + lock * .5;
  logoU.uCharge.value = Math.max(charge * .85, lock * .3);
  // ring: draws on at load, then rotates/tilts; spins up on charge
  const arc = eout(seg(lt, .15, 1.35));
  const reArc = sstep(seg(p, .258, .3));
  arcU.uArc.value = p < .2 ? arc : reArc; arcU.uArcRot.value = p < .2 ? .25 : .75;
  const rs = Math.max(intro * lerp(.78, 1, eout(seg(lt, .1, 1.2))), sstep(seg(p, .26, .31)));
  ring.scale.setScalar(lerp(.2, 1, rs) * (1 + charge * .08) * (1 + lock * .05)); ring.visible = rs > .01 && arcU.uArc.value > .002;
  ringGlow.scale.copy(ring.scale); ringGlow.visible = ring.visible;
  ringGlow.material.opacity = (.2 + .08 * Math.sin(t * 2.2) + charge * .3 + lock * .15) * rs * (1 - .8 * hero);
  const spin = t * .12 + charge * charge * 7 + lt * 0;
  ring.rotation.set(lerp(.25, .55, hero) + Math.sin(t * .4) * .14 * (1 - hero * .6) + charge * .25, lerp(-.15, -.45, hero) + Math.sin(t * .31) * .2 * (1 - hero * .6), spin);
  ringGlow.rotation.copy(ring.rotation);
  // draw-head spark at the tip of the ring while it draws
  { const aa = (arcU.uArcRot.value + arcU.uArc.value) * 6.2831853 - Math.PI; const v = new THREE.Vector3(Math.cos(aa) * 1.32, Math.sin(aa) * 1.32, 0).multiply(ring.scale).applyEuler(ring.rotation);
    drawHead.position.copy(v); const on = (p < .2 ? (arc > .01 && arc < .995) : (reArc > .01 && reArc < .995)) ? 1 : 0; drawHead.material.opacity = on * .9; drawHead.visible = on > 0; }
  // swoops draw themselves, undulate, then get pulled up into the charge
  swoopU.uDraw.value = eio(seg(lt, .45, 1.7)); swoopU.uA.value = .7 * (1 - seg(p, .06, .11)); swoops.visible = swoopU.uA.value > .01;
  swoopU.uWave.value = 1 + charge * 2; swoops.scale.y = 1 - charge * .35;
  logo.rotation.y = Math.sin(t * .5) * .12 + lerp(0, -.25, hero);
  // orbiting dust → suction
  orbU.uA.value = load * (1 - seg(p, .115, .125)) * 1.0; orbU.uSuck.value = charge; orb.visible = orbU.uA.value > 0;
  // light streaks during the rush
  strU.uA.value = charge * (1 - seg(p, .135, .17)) * 1.1 + kick * .6; strU.uSpeed.value = .35 + charge * 2.2 + kick * 2; strU.uZ.value = camera.position.z - 4; streaks.rotation.x = 0; streaks.position.set(0, 0, 0);
  const plunge = seg(p, .74, .765) * (1 - seg(p, .815, .845));
  if (plunge > 0) { strU.uA.value = plunge * .75; strU.uSpeed.value = 1.8; strU.uZ.value = -2; streaks.rotation.x = -Math.PI / 2; streaks.position.copy(camera.position); }
  streaks.visible = strU.uA.value > .002;
  // shockwaves: two on the burst, one when the mark locks back in
  [[seg(p, .12, .158), 18, .9], [seg(p, .126, .175), 26, .55], [seg(p, .266, .3), 3.2, .3]].forEach(([k, R, a], i) => {
    const m = shocks[i]; m.visible = k > 0 && k < 1; const ek = eout(k); m.scale.setScalar(.6 + ek * R); m.material.uniforms.uA.value = a * Math.pow(1 - k, 1.6); m.material.uniforms.uW.value = .03 + k * .05; m.rotation.x = i == 2 ? 0 : -.15; });
  if (burst) { burstU.uE.value = E; burstU.uA.value = (p > .119 && p < .3) ? (1 - sstep(seg(p, .265, .292))) : 0; burst.visible = burstU.uA.value > 0;
    burstU.uSwirl.value = lerp(.35, 3.2, sstep(seg(p, .17, .215)));
    ghosts.forEach(g => { const u = g.userData; const pl = p - u.uLag.value * .05; const exl = seg(pl, .12, .2), rfl = seg(pl, .2, .275);
      u.uE.value = exl < 1 ? eout(exl) : Math.pow(1 - rfl, 2.4); u.uA.value = burstU.uA.value * u.uAm.value * (pl > .12 ? 1 : 0); u.uSwirl.value = lerp(.35, 3.2, sstep(seg(pl, .17, .215)));
      u.uTime.value = t; u.uSz.value = 12 * u.uSm.value; g.visible = u.uA.value > 0; }); }
  fireU.uE.value = ex; fireU.uA.value = seg(p, .118, .13) * (1 - seg(p, .138, .175)) * 1.1; fire.visible = fireU.uA.value > 0;
  flash.material.opacity = Math.min(1, Math.pow(seg(p, .1, .121), 2) * (1 - seg(p, .121, .145)) * .5 + lock * .1 + charge * .06); flash.scale.setScalar(4 + charge * 3 + ex * 5 - lock * 1.5);
  halo.material.opacity = (.12 + .05 * Math.sin(t * 2.2)) * load + .22 * charge * intro - .07 * hero + lock * .12; halo.scale.setScalar(5 + Math.sin(t * 2.2) * .25 + charge * 2);
  // hero layout: mark slides right-of-center & rises out for the carousel
  const out = eio(seg(p, .37, .45));
  const hx = portrait ? 0 : lerp(0, .55, sstep(hero * 1.6 > 1 ? 1 : hero * 1.6));
  mark.position.set(hx + out * 1.6, (portrait ? lerp(0, -.9, hero) : 0) + out * 6, -out * 4);
  mark.scale.setScalar(lerp(1, portrait ? .95 : 1.42, sstep(seg(p, .25, .33))));
  // ---- bloom & fx
  bloom.strength = .55 + fireAmt * .7 + flash.material.opacity * .7 + charge * .2 + seg(p, .12, .14) * (1 - seg(p, .2, .26)) * .3 - seg(p, .41, .46) * .25 * (1 - seg(p, .74, .78));
  bloom.radius = .55 + fireAmt * .25;
  fx.uniforms.uFlash.value = flash.material.opacity * .12 + kick * .08;
  const gl = Math.max(seg(p, .858, .874) * (1 - seg(p, .878, .892)), seg(p, .4, .41) * (1 - seg(p, .41, .425)) * .25, seg(p, .118, .122) * (1 - seg(p, .122, .13)) * .35);
  fx.uniforms.uGlitch.value = gl;
  fx.uniforms.uAb.value = .0015 + fireAmt * .003 + charge * .006 + kick * .012 + seg(p, .44, .46) * .001;
  // ---- spine + cards
  const cA = seg(p, .425, .47) * (1 - seg(p, .77, .8));
  colU.uA.value = cA; embU.uA.value = cA; column.visible = embers.visible = cA > 0;
  colU.uFlow.value = embU.uFlow.value = p;
  column.position.y = embers.position.y = lerp(-4, 0, seg(p, .4, .48)) + 0;
  cardsG.visible = p > .41 && p < .8;
  const cp = seg(p, .43, .752); // card travel
  const N = cards.length, span = N + 1.6;
  const X = portrait ? 3.2 : 6.6, Z = portrait ? 2.4 : 3.0;
  let front = -1, fd = 9;
  cards.forEach((g, i) => {
    // s: +1.3 (enter right) → -1.3 (exit left)
    const s = 1.35 - (cp * span - i * .92) * .95 * (1 / 1.0);
    const ss = clamp(s, -1.6, 1.6);
    const a = ss * 1.05;
    g.position.set(Math.sin(a) * X, .25 + ss * .25 - Math.abs(ss) * .15 + (portrait ? .3 : 0), Math.cos(a) * Z - Z + .6 - Math.abs(ss) * 1.1);
    g.rotation.set(-.06 + ss * .04, -a * .55, ss * .07 + Math.sin(t * .6 + i) * .015);
    g.scale.setScalar(portrait ? 1.25 : 1.5);
    g.visible = Math.abs(s) < 1.55;
    g.userData.edge.material.opacity = .22 * (1 - Math.min(1, Math.abs(s)));
    if (Math.abs(s) < fd) { fd = Math.abs(s); front = i; }
  });
  if (front !== lastCard && front >= 0) { lastCard = front; ui.cardNum.textContent = String(front + 1).padStart(2, '0'); ui.cardName.textContent = CARDS[front].t.join(' '); ui.lis.forEach((li, k) => li.classList.toggle('on', k === Math.min(front, 5) && front < 6)); }
  // ---- core
  core.visible = p > .735;
  crystal.rotation.set(t * .2, t * .3 + p * 6, 0); coreLogo.rotation.y = Math.sin(t * .7) * .4;
  rings.forEach((r, k) => { r.rotation.x += 0; r.rotation.set(hash(k) * 3 + t * (.15 + k * .07) * (k % 2 ? 1 : -1) + p * 4, hash(k + 9) * 3 + t * .1 * (k + 1), t * .05 * k); });
  coreGlow.material.opacity = .3 + .1 * Math.sin(t * 2.3);
  coreLight.intensity = 14 + 5 * Math.sin(t * 2.3);
  // ---- mosaic
  const mk = seg(p, .876, .93);
  if (p > .87) drawMosaic(t, mk);
  // ---- HUD
  domTL.progress(p);
  ui.rail.style.height = (p * 100).toFixed(2) + '%';
  ui.scnPct.textContent = String(Math.round(p * 100)).padStart(3, '0') + '%';
  let nm = SCENES[0][1]; SCENES.forEach(([a, n]) => { if (p >= a) nm = n; });
  if (nm !== lastScn) { lastScn = nm; if (uiDone) ui.scnName.textContent = nm; else typeEls.find(o => o.el === ui.scnName).txt = nm; }
  composer.render();
}

// ---------------------------------------------------------------- sizing
function resize() {
  const w = innerWidth, h = innerHeight; portrait = h > w; K = portrait ? 1.55 : 1;
  camera.aspect = w / h; camera.fov = portrait ? 46 : 38; camera.updateProjectionMatrix();
  renderer.setSize(w, h); composer.setSize(w, h); bloom.setSize(w * .5, h * .5);
  fx.uniforms.uRes.value.set(w, h); sizeMosaic();
}
addEventListener('resize', resize);

// ---------------------------------------------------------------- boot
let ready = false;
(async () => {
  const ldp = $('#ldp'); let n = 0; const tick = () => { n++; ldp.textContent = Math.min(99, n * 20); };
  await document.fonts.load('900 100px "Big Shoulders Display"'); await document.fonts.load('600 20px "JetBrains Mono"'); await document.fonts.load('400 20px "JetBrains Mono"'); await document.fonts.load('700 40px Silkscreen'); await document.fonts.ready; tick();
  const lt = await loadTex('assets/chrome-ma-640.png'); logoU.map.value = lt; tick();
  logoImg = await loadImg('assets/chrome-ma-640.png');
  await buildBurst(); tick();
  await buildCards(); tick();
  resize();
  // pre-compile
  renderer.compile(scene, camera);
  ready = true; ldp.textContent = 100; document.body.classList.add('ready');
  if (CAPTURE) { $('#loader').style.display = 'none'; window.__frame = (p, t) => update(p, t); window.__ready = true; update(0, 0); return; }
  // smooth scroll → progress (Lenis + ScrollTrigger scrub)
  gsap.registerPlugin(ScrollTrigger);
  const lenis = new Lenis({ lerp: .085, wheelMultiplier: .9, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000)); gsap.ticker.lagSmoothing(0);
  const state = { p: 0 };
  ScrollTrigger.create({ trigger: '#spacer', start: 'top top', end: 'bottom bottom', scrub: .6, onUpdate: s => { gsap.to(state, { p: s.progress, duration: .5, ease: 'power2.out', overwrite: true }); } });
  // nav jumps
  // nav jumps → sections after the cinematic part (brand → top)
  document.querySelectorAll('a[href^="#"]').forEach(el => el.addEventListener('click', e => {
    const id = el.getAttribute('href'); if (id === '#') { e.preventDefault(); return; }
    const t = id === '#top' ? 0 : document.querySelector(id); if (t === null) return;
    e.preventDefault(); lenis.scrollTo(t, { duration: id === '#top' ? 2.6 : 2.2, offset: id === '#top' ? 0 : -70 });
  }));
  // fade the fixed HUD chrome once the page leaves the cinematic part
  const full = document.getElementById('full');
  ScrollTrigger.create({ trigger: full, start: 'top 60%', onToggle: s => document.body.classList.toggle('infull', s.isActive) });
  const t0 = performance.now(); T0 = 0;
  gsap.ticker.add(() => update(state.p, (performance.now() - t0) / 1000));
})();
