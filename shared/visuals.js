/* Project RECLAIM: shared high-detail visuals (three.js r128, loaded first).
   - Earth, Moon, Mars and the other planets are painted on the GPU from procedural noise (no image downloads),
     with bump maps, Earth's oceans and clouds, and glowing atmospheres
   - the RECLAIM lander (rocket) with metal panels, landing legs, engine bells and a live exhaust plume
   - the 2075 spacesuit (astronaut) with a reflective visor, life-support backpack, joints and lit details
   - soft dust plumes and a reflection environment for metal and visors */
const VIS = (() => {
  const UP = new THREE.Vector3(0, 1, 0);
  /* ---------------- GLSL: 3D simplex noise (Ashima Arts / Stefan Gustavson, MIT licence) ---------------- */
  const NOISE = `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.); const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.; vec4 s1=floor(b1)*2.+1.; vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.); m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;
  /* ---------------- planet painter: one fragment per texel of an equirectangular map ---------------- */
  const BAKE_FS = `
precision highp float;
uniform int uKind; uniform int uMode; uniform float uSeed; varying vec2 vUv;
${NOISE}
float fbm(vec3 p,int o){float a=.5,s=0.;for(int i=0;i<9;i++){if(i>=o)break;s+=a*snoise(p);p=p*2.03+vec3(1.7,9.2,3.1);a*=.5;}return s;}
float ridged(vec3 p,int o){float a=.5,s=0.;for(int i=0;i<8;i++){if(i>=o)break;s+=a*(1.-abs(snoise(p)));p=p*2.1+vec3(3.3,1.1,7.7);a*=.5;}return s;}
vec3 hash3(vec3 p){p=vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6)));return fract(sin(p)*43758.5453123);}
/* impact craters: a bowl, a raised rim and a skirt of ejecta. Adds rim brightness to 'rim'. */
float craters(vec3 p,float sc,float dens,inout float rim){
  vec3 q=p*sc,c=floor(q);float h=0.;
  for(int i=-1;i<=1;i++)for(int j=-1;j<=1;j++)for(int k=-1;k<=1;k++){
    vec3 cell=c+vec3(float(i),float(j),float(k)),r3=hash3(cell+uSeed);
    if(r3.z>dens)continue;
    vec3 fp=cell+.25+.5*hash3(cell+19.19+uSeed);
    float r=.12+.28*r3.x*r3.x,d=length(q-fp)/r;
    if(d>2.4)continue;
    float bowl=d<1.?(d*d-1.):0.,rm=exp(-pow((d-1.)/.2,2.)),ej=d>1.?exp(-(d-1.)*3.)*.12:0.;
    h+=(bowl*.8+rm*.32+ej)*r/sc*3.;rim+=(rm+ej*2.)*(.5+.5*r3.y);
  }
  return h;
}
void earth(vec3 p,out vec3 col,out float h,out float rough){
  vec3 w=vec3(fbm(p*1.8+1.3,4),fbm(p*1.8+7.1,4),fbm(p*1.8+4.7,4));
  float e=fbm(p*.85+w*.45,8)+.08*ridged(p*3.,5)-.1,lat=abs(p.y),sea=.04;
  float m=fbm(p*2.6+11.,5)*.6+.5;
  if(e<sea){float d=clamp((sea-e)*3.5,0.,1.);
    col=mix(vec3(.13,.42,.55),vec3(.03,.12,.30),pow(d,.5));col=mix(col,vec3(.015,.05,.17),smoothstep(.35,1.,d));h=0.;rough=.62;}
  else{float a=e-sea,temp=1.-lat*1.2-a*1.4+fbm(p*3.+5.,3)*.18;
    vec3 c=mix(vec3(.33,.40,.17),vec3(.09,.20,.07),smoothstep(.45,.7,m));
    c=mix(c,vec3(.76,.62,.42),smoothstep(.48,.3,m)*smoothstep(.5,.8,temp));
    c=mix(c,vec3(.45,.43,.35),smoothstep(.42,.22,temp));
    c=mix(c,vec3(.40,.34,.28),smoothstep(.16,.32,a));
    c=mix(c,vec3(.93,.95,.97),smoothstep(.2,.05,temp));
    col=c*(.82+.36*(fbm(p*22.,3)*.5+.5));h=a*1.4+.02;rough=.93;}
  float ice=smoothstep(.79,.85,lat+fbm(p*4.,4)*.07);
  col=mix(col,vec3(.94,.96,.98),ice);h=max(h,ice*.06);rough=mix(rough,.55,ice);
}
float clouds(vec3 p){
  vec3 w=vec3(fbm(p*2.+3.,4),fbm(p*2.+8.,4),fbm(p*2.+13.,4));
  float c=fbm(p*2.6+w*1.5,8),lat=abs(p.y),band=.12*cos(lat*10.)-.04;
  return smoothstep(.12,.55,c+band)*.92;
}
void moon(vec3 p,out vec3 col,out float h,float tint){
  float maria=smoothstep(.0,.28,fbm(p*1.05+vec3(2.,5.,1.),6))*tint,rim=0.;
  float cr=craters(p,2.5,.22,rim)*1.4+craters(p,6.,.42,rim)+craters(p,14.,.52,rim)*.8+craters(p,34.,.6,rim)*.6+craters(p,80.,.6,rim)*.4;
  float n=fbm(p*26.,4);
  col=mix(vec3(.70,.69,.66),vec3(.31,.31,.33),maria*.92)*(.88+.2*n);
  col=clamp(col+vec3(min(rim,2.))*.025,0.,1.);
  h=cr*2.2-maria*.06+n*.012;
}
void mars(vec3 p,out vec3 col,out float h){
  vec3 w=vec3(fbm(p*1.5+2.,4),fbm(p*1.5+6.,4),fbm(p*1.5+9.,4));
  float dark=smoothstep(.04,.32,fbm(p*1.25+w*.75,7)),dust=fbm(p*5.+1.,5),lat=abs(p.y),rim=0.;
  col=mix(vec3(.80,.47,.27),vec3(.63,.34,.19),smoothstep(-.25,.35,dust));
  col=mix(col,vec3(.33,.19,.13),dark*.82);
  float lon=atan(p.z,-p.x),vm=abs(p.y+.12+.05*sin(lon*4.)+.015*snoise(p*12.));
  float can=(1.-smoothstep(.0,.03,vm))*smoothstep(-2.3,-1.9,lon)*smoothstep(-.3,-.75,lon);
  float cr=craters(p,3.5,.3,rim)+craters(p,9.,.45,rim)*.8+craters(p,24.,.5,rim)*.5+craters(p,60.,.5,rim)*.3;
  vec3 vo=normalize(vec3(-.55,.32,.77));float vd=distance(p,vo),volc=exp(-vd*vd*70.);
  h=cr*1.6-can*.3+volc*.45+fbm(p*8.,4)*.03+(1.-dark)*.02;
  col=mix(col,vec3(.30,.17,.11),can*.65);col+=min(rim,2.)*.01;col*=.9+.16*(fbm(p*30.,3)*.5+.5);
  float ice=smoothstep(.86,.9,lat+fbm(p*5.,4)*.05);col=mix(col,vec3(.95,.93,.9),ice);h+=ice*.03;
}
vec3 gas(vec3 p,vec3 a,vec3 b,vec3 c,float f,float turb){
  float y=p.y+turb*fbm(p*vec3(2.,7.,2.)+fbm(p*3.,3),5)*.07;
  return mix(mix(a,b,sin(y*f)*.5+.5),c,(sin(y*f*2.3+1.)*.5+.5)*.45);
}
void main(){
  float phi=vUv.x*6.2831853,th=(1.-vUv.y)*3.14159265;
  vec3 p=vec3(-cos(phi)*sin(th),cos(th),sin(phi)*sin(th)),q=p+uSeed;
  vec3 col=vec3(.5);float h=0.,rough=1.;
  if(uKind==0)earth(q,col,h,rough);
  else if(uKind==1)moon(q,col,h,1.);
  else if(uKind==2)mars(q,col,h);
  else if(uKind==3){col=vec3(clouds(q));}
  else if(uKind==4){col=gas(q,vec3(.86,.77,.64),vec3(.66,.47,.31),vec3(.95,.90,.80),24.,1.);
    vec3 s=normalize(vec3(.6,-.38,.7));float d=length((p-s)*vec3(1.,1.9,1.));col=mix(col,vec3(.72,.36,.24),smoothstep(.16,.1,d));h=fbm(q*6.,3)*.1;}
  else if(uKind==5){col=gas(q,vec3(.91,.84,.66),vec3(.80,.70,.50),vec3(.96,.92,.78),30.,.35);}
  else if(uKind==6){float c=fbm(q*2.+fbm(q*3.,4)*1.2,6);col=mix(vec3(.85,.72,.48),vec3(.97,.88,.66),c*.5+.5);}
  else {moon(q,col,h,.35);col*=vec3(.96,.9,.84);}
  if(uMode==0)gl_FragColor=vec4(col,1.);
  else if(uMode==1)gl_FragColor=vec4(vec3(clamp(h*.5+.5,0.,1.)),1.);
  else gl_FragColor=vec4(vec3(rough),1.);
}`;
  const KINDS = { earth: 0, moon: 1, mars: 2, clouds: 3, jupiter: 4, saturn: 5, venus: 6, mercury: 7 };
  let bakeMat = null, bakeScene = null, bakeCam = null; const cache = new Map();
  function bake(renderer, kind, mode, w) {
    const key = kind + mode + w; if (cache.has(key)) return cache.get(key);
    if (!bakeMat) {
      bakeMat = new THREE.ShaderMaterial({ uniforms: { uKind: { value: 0 }, uMode: { value: 0 }, uSeed: { value: 0 } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }', fragmentShader: BAKE_FS, depthTest: false, depthWrite: false });
      bakeScene = new THREE.Scene(); const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bakeMat); q.frustumCulled = false; bakeScene.add(q); bakeCam = new THREE.Camera();
    }
    const h = w / 2, rt = new THREE.WebGLRenderTarget(w, h, { wrapS: THREE.RepeatWrapping, wrapT: THREE.ClampToEdgeWrapping, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: true, depthBuffer: false, stencilBuffer: false });
    rt.texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); if (mode === 0 && kind !== 'clouds') rt.texture.encoding = THREE.sRGBEncoding;
    bakeMat.uniforms.uKind.value = KINDS[kind]; bakeMat.uniforms.uMode.value = mode; bakeMat.uniforms.uSeed.value = kind === 'mercury' ? 4.2 : 0;
    const prev = renderer.getRenderTarget(), ac = renderer.autoClear, strips = Math.max(1, h / 256);   // in strips, so a slow GPU never stalls for long
    renderer.autoClear = false; renderer.setRenderTarget(rt); renderer.clear();
    for (let i = 0; i < strips; i++) { rt.scissor.set(0, i * h / strips, w, h / strips); rt.scissorTest = true; renderer.setRenderTarget(rt); renderer.render(bakeScene, bakeCam); }
    rt.scissorTest = false; renderer.setRenderTarget(prev); renderer.autoClear = ac;
    cache.set(key, rt.texture); return rt.texture;
  }
  /* glowing atmosphere: a shell that is brightest at the planet's edge and on its day side */
  const ATMO_VS = 'varying vec3 vN; varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }';
  const ATMO_FS = `uniform vec3 uColor; uniform vec3 uSun; uniform float uPoint; uniform float uEdge; uniform float uInt; uniform float uBack; varying vec3 vN; varying vec3 vW;
void main(){ vec3 V = normalize(cameraPosition - vW), N = normalize(vN), L = normalize(mix(uSun, uSun - vW, uPoint));
  float d = dot(N, V), g;
  if (uBack > .5) g = pow(smoothstep(0., uEdge, -d), 1.6); else g = pow(1. - max(d, 0.), 3.2);
  float lit = smoothstep(-.35, .55, dot(N, L));
  gl_FragColor = vec4(uColor * g * (.06 + .94 * lit) * uInt, 1.); }`;
  function atmosphere(r, color, opt) {
    const g = new THREE.Group(), sun = opt.sun || new THREE.Vector3(1, .3, .6), point = opt.point ? 1 : 0;
    const mk = (scale, back, int) => { const s = scale, m = new THREE.Mesh(new THREE.SphereGeometry(r * s, 64, 40), new THREE.ShaderMaterial({ uniforms: { uColor: { value: new THREE.Color(color) }, uSun: { value: sun }, uPoint: { value: point }, uEdge: { value: Math.sqrt(1 - 1 / (s * s)) }, uInt: { value: int }, uBack: { value: back ? 1 : 0 } }, vertexShader: ATMO_VS, fragmentShader: ATMO_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: back ? THREE.BackSide : THREE.FrontSide })); g.add(m); return m; };
    mk(opt.scale || 1.07, true, opt.glow || 1.2); mk(1.004, false, opt.haze || .9);
    return g;
  }
  /* a whole planet: surface, Earth's clouds and an atmosphere. opt: { res, sun (Vector3), point (light is a point at 'sun') } */
  function planet(renderer, kind, r, opt = {}) {
    const res = opt.res || 1024, g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ map: bake(renderer, kind, 0, res), roughness: 1, metalness: 0 });
    if (['earth', 'moon', 'mars', 'mercury'].includes(kind)) { mat.bumpMap = bake(renderer, kind, 1, res); mat.bumpScale = { earth: .8, moon: 1.5, mars: 1.1, mercury: 1.4 }[kind] * (opt.bump || 1); }
    if (kind === 'earth') { mat.roughnessMap = bake(renderer, 'earth', 2, res); mat.metalness = 0; }
    const surface = new THREE.Mesh(new THREE.SphereGeometry(r, 96, 64), mat); g.add(surface); g.userData.surface = surface;
    let clouds = null;
    if (kind === 'earth') { clouds = new THREE.Mesh(new THREE.SphereGeometry(r * 1.012, 96, 64), new THREE.MeshStandardMaterial({ color: 0xffffff, alphaMap: bake(renderer, 'clouds', 0, res), transparent: true, depthWrite: false, roughness: 1 })); g.add(clouds); }
    const air = { earth: [0x5fa8ff, 1.25, .9], mars: [0xe0a080, .8, .55], venus: [0xf3d9a0, 1, .8] }[kind];
    if (air && opt.atmo !== false) g.add(atmosphere(r, air[0], { sun: opt.sun, point: opt.point, glow: air[1], haze: air[2], scale: kind === 'mars' ? 1.035 : 1.06 }));
    g.userData.update = dt => { if (clouds) clouds.rotation.y += dt * .012; };
    return g;
  }
  /* ---------------- reflection environment (sky, horizon and a bright sun) for metal and visors ---------------- */
  const envs = new WeakMap();
  function env(renderer) {
    if (envs.has(renderer)) return envs.get(renderer);
    const sc = new THREE.Scene(), geo = new THREE.SphereGeometry(50, 32, 16), col = [], pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) { const y = pos.getY(i) / 50, c = new THREE.Color(); if (y > 0) c.setRGB(.05, .06, .08).lerp(new THREE.Color(.55, .55, .58), Math.pow(1 - y, 6)); else c.setRGB(.42, .38, .34).lerp(new THREE.Color(.25, .23, .21), Math.min(1, -y * 2)); col.push(c.r, c.g, c.b); }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); sc.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
    const s = new THREE.Mesh(new THREE.SphereGeometry(4, 16, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(12, 11, 10) })); s.position.set(30, 28, 20); sc.add(s);
    const fill = new THREE.Mesh(new THREE.SphereGeometry(9, 16, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(.9, .95, 1.1) })); fill.position.set(-30, 10, -25); sc.add(fill);
    const pm = new THREE.PMREMGenerator(renderer), t = pm.fromScene(sc, .02).texture; pm.dispose(); envs.set(renderer, t); return t;
  }
  /* ---------------- painted textures ---------------- */
  function paint(w, h, fn, srgb = true, rep) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; fn(cv.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(cv); if (srgb) t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
    if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t;
  }
  const rng = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
  let RT = null;
  function rocketTex() {
    if (RT) return RT;
    const panels = (c, w, h, r, line, rows, cols) => {   // panel seams with rivet lines
      c.strokeStyle = line; c.lineWidth = 2;
      for (let y = 0; y <= h; y += h / rows) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); const off = Math.round(y / (h / rows)) % 2 ? w / cols / 2 : 0;
        for (let x = off; x < w; x += w / cols) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + h / rows); c.stroke(); }
        c.fillStyle = 'rgba(40,44,50,.55)'; for (let x = 3; x < w; x += 9) { c.fillRect(x, y - 5, 2, 2); c.fillRect(x, y + 4, 2, 2); } }
    };
    const steel = paint(1024, 512, (c, w, h) => {
      const r = rng(7); c.fillStyle = '#b8bdc3'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 3000; i++) { const v = r() < .5 ? 255 : 40; c.fillStyle = 'rgba(' + v + ',' + v + ',' + (v + 8) + ',' + (.025 + r() * .05) + ')'; c.fillRect(r() * w - 200, r() * h, 200 + r() * 600, 1 + r() * 1.6); }
      panels(c, w, h, r, 'rgba(38,42,48,.6)', 8, 8);
      for (let i = 0; i < 26; i++) { const x = r() * w; const g = c.createLinearGradient(0, h, 0, h * (.3 + r() * .4)); g.addColorStop(0, 'rgba(30,24,20,.35)'); g.addColorStop(1, 'rgba(30,24,20,0)'); c.fillStyle = g; c.fillRect(x, 0, 3 + r() * 14, h); }
      const g = c.createLinearGradient(0, h, 0, h * .45); g.addColorStop(0, 'rgba(36,28,22,.6)'); g.addColorStop(.35, 'rgba(130,85,40,.2)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.save(); c.translate(w * .37, h * .5); c.rotate(-Math.PI / 2); c.font = '700 58px "Michroma", "Arial Black", sans-serif'; c.textAlign = 'center'; c.fillStyle = 'rgba(18,22,28,.88)'; c.fillText('RECLAIM', 0, 20); c.restore();
      c.save(); c.translate(w * .63, h * .42); c.fillStyle = '#ff7a2f'; c.beginPath(); c.arc(0, 0, 34, 0, 7); c.fill(); c.fillStyle = '#0b1a2a'; c.beginPath(); c.arc(0, 0, 27, 0, 7); c.fill();
      c.fillStyle = '#e9eef2'; c.font = '700 15px "Space Mono", monospace'; c.textAlign = 'center'; c.fillText('2075', 0, 6); c.restore();
      c.fillStyle = 'rgba(18,22,28,.85)'; c.font = '700 20px "Space Mono", monospace'; c.fillText('RCL-1', w * .61, h * .62);
    });
    const white = paint(1024, 512, (c, w, h) => {
      const r = rng(11); c.fillStyle = '#ecece8'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 900; i++) { c.fillStyle = 'rgba(0,0,0,' + (r() * .035) + ')'; c.fillRect(r() * w, r() * h, 2 + r() * 30, 2 + r() * 30); }
      c.fillStyle = '#16181c'; c.fillRect(0, 0, w * .16, h); c.fillRect(w * .92, 0, w * .08, h);   // black heat-shield tiles on the back
      c.strokeStyle = 'rgba(80,80,80,.35)'; c.lineWidth = 1.5; for (let y = 0; y < h; y += 24) for (let x = 0; x < w; x += 24) c.strokeRect(x + (y / 24 % 2) * 12, y, 24, 24);
      panels(c, w, h, r, 'rgba(90,92,96,.45)', 4, 10);
      c.fillStyle = '#ff7a2f'; c.fillRect(0, h * .08, w, 10);
    });
    const foil = paint(512, 512, (c, w, h) => {
      const r = rng(5); c.fillStyle = '#c8962f'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 1400; i++) { const x = r() * w, y = r() * h, s = 6 + r() * 30, v = r(); c.fillStyle = v > .5 ? 'rgba(255,226,140,' + (r() * .35) + ')' : 'rgba(90,55,10,' + (r() * .35) + ')';
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + s, y + (r() - .5) * s); c.lineTo(x + (r() - .5) * s, y + s); c.fill(); }
    }, true, [3, 2]);
    const nozzle = paint(256, 256, (c, w, h) => {
      const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#5b4a3a'); g.addColorStop(.35, '#3a3a44'); g.addColorStop(.7, '#4a4a58'); g.addColorStop(1, '#6b5640'); c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.strokeStyle = 'rgba(0,0,0,.35)'; for (let x = 0; x < w; x += 4) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }   // regenerative cooling tubes
    });
    const glowSprite = paint(128, 128, (c, w) => { const g = c.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,200,120,.75)'); g.addColorStop(1, 'rgba(255,120,40,0)'); c.fillStyle = g; c.fillRect(0, 0, w, w); }, false);
    return RT = { steel, white, foil, nozzle, glowSprite };
  }
  const PLUME_VS = 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }';
  const PLUME_FS = `uniform float uTime; uniform float uCore; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
float h1(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h1(i), h1(i + vec2(1, 0)), f.x), mix(h1(i + vec2(0, 1)), h1(i + vec2(1, 1)), f.x), f.y); }
void main(){
  float t = 1. - vUv.y, face = abs(dot(normalize(vN), normalize(vV)));
  float n = vn(vec2(vUv.x * 14., t * 7. - uTime * 9.)) * .6 + vn(vec2(vUv.x * 31., t * 17. - uTime * 19.)) * .4;
  float a = pow(1. - t, 1.4 + uCore * 1.6) * pow(face, 1.1 + uCore) * (.5 + .65 * n) * smoothstep(0., .05, t + .02);
  vec3 col = mix(vec3(1., .96, .86), vec3(1., .62, .24), smoothstep(0., .35, t)); col = mix(col, vec3(.85, .28, .08), smoothstep(.35, .9, t));
  if (uCore > .5) col = mix(vec3(.82, .9, 1.), vec3(1., .88, .65), t);
  gl_FragColor = vec4(col * (1.15 + uCore * .6), a); }`;
  /* ---------------- the RECLAIM lander ---------------- */
  function rocket(renderer) {
    const g = new THREE.Group(), T = rocketTex(), E = env(renderer);
    const M = o => new THREE.MeshStandardMaterial(Object.assign({ envMap: E, envMapIntensity: 1 }, o));
    const steel = M({ map: T.steel, metalness: .78, roughness: .34 }), white = M({ map: T.white, metalness: .05, roughness: .5, envMapIntensity: .6 });
    const dark = M({ color: 0x2a2d33, metalness: .7, roughness: .45 }), gold = M({ map: T.foil, metalness: .95, roughness: .3, bumpMap: T.foil, bumpScale: .03 });
    const chrome = M({ color: 0xe2e6ea, metalness: 1, roughness: .14 }), orange = M({ color: 0xff7a2f, metalness: .2, roughness: .5 });
    const glass = M({ color: 0x0b1724, metalness: .9, roughness: .05, emissive: 0x0b3a52, emissiveIntensity: .5, envMapIntensity: 1.6 });
    const nozzleM = M({ map: T.nozzle, metalness: .85, roughness: .38 }), heat = new THREE.MeshStandardMaterial({ color: 0x1a0d06, emissive: 0xff6a1a, emissiveIntensity: 0, side: THREE.BackSide, roughness: .6 });
    const add = (geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, par = g) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); par.add(m); return m; };
    const lathe = (pts, seg, mat) => add(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg), mat);
    const strut = (a, b, r, mat) => { const d = b.clone().sub(a), m = add(new THREE.CylinderGeometry(r, r, d.length(), 10), mat, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2); m.quaternion.setFromUnitVectors(UP, d.normalize()); return m; };
    // aft skirt (gold insulation), steel propellant tank, white crew cabin and nose
    lathe([[1.12, 1.3], [1.5, 1.38], [1.86, 2.0], [1.86, 2.62]], 48, gold);
    add(new THREE.CylinderGeometry(1.86, 1.86, 5.6, 64, 1, true), steel, 0, 5.42, 0);
    for (const y of [2.62, 8.22]) add(new THREE.CylinderGeometry(1.9, 1.9, .16, 64), orange, 0, y, 0);
    add(new THREE.CylinderGeometry(1.72, 1.86, 3.0, 64, 1, true), white, 0, 9.8, 0);
    add(new THREE.CylinderGeometry(1.75, 1.75, .1, 64), dark, 0, 11.32, 0);
    const nose = []; for (let i = 0; i <= 18; i++) { const t = i / 18; nose.push([Math.max(.001, 1.72 * Math.pow(1 - t * t, .62)), 11.36 + t * 4]); } lathe(nose, 64, white);
    add(new THREE.SphereGeometry(.16, 16, 10), dark, 0, 15.3, 0);
    // cabin windows facing the hatch side
    for (const da of [-.42, 0, .42]) { const a = Math.PI + da, r = 1.785; const w = add(new THREE.CircleGeometry(.24, 28), glass, Math.sin(a) * r, 10.05, Math.cos(a) * r, 0, a, 0); w.rotation.x = -.05;
      add(new THREE.TorusGeometry(.26, .045, 8, 28), dark, Math.sin(a) * (r + .01), 10.05, Math.cos(a) * (r + .01), 0, a, 0); }
    // hatch, frame, lit doorway and ladder (on the -z side)
    add(new THREE.BoxGeometry(1.0, 1.8, .05), new THREE.MeshStandardMaterial({ color: 0x05080c, emissive: 0x0c3448, emissiveIntensity: .8 }), 0, 3.6, -1.83);
    for (const [x, y, w, h] of [[-.6, 3.65, .08, 2.06], [.6, 3.65, .08, 2.06], [0, 4.68, 1.28, .08], [0, 2.62, 1.28, .08]]) add(new THREE.BoxGeometry(w, h, .1), dark, x, y, -1.9);
    const hinge = new THREE.Group(); hinge.position.set(-.56, 2.66, -1.92); g.add(hinge);
    const door = add(new THREE.BoxGeometry(1.1, 1.96, .07), steel, .56, .98, 0, 0, 0, 0, hinge); add(new THREE.CircleGeometry(.14, 20), glass, .56, 1.45, -.04, 0, Math.PI, 0, hinge); add(new THREE.BoxGeometry(.06, .3, .05), chrome, .95, .9, -.06, 0, 0, 0, hinge);
    for (const x of [-.3, .3]) strut(new THREE.Vector3(x, .12, -2.32), new THREE.Vector3(x, 2.62, -1.95), .028, chrome);
    for (let i = 0; i < 8; i++) { const k = (i + .5) / 8; add(new THREE.CylinderGeometry(.02, .02, .6, 8), chrome, 0, .12 + k * 2.5, -2.32 + k * .37, 0, 0, Math.PI / 2); }
    // four landing legs: telescoping shock struts, A-frame braces and foot pads
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + i * Math.PI / 2, dx = Math.cos(a), dz = Math.sin(a), P = (r, y, da = 0) => new THREE.Vector3(Math.cos(a + da) * r, y, Math.sin(a + da) * r);
      const A = P(1.86, 3.5), F = P(3.35, .16), mid = A.clone().lerp(F, .52), mid2 = A.clone().lerp(F, .62);
      strut(A, mid, .12, gold); strut(mid.clone().lerp(A, .08), F, .075, chrome);
      add(new THREE.CylinderGeometry(.14, .14, .2, 12), dark, mid.x, mid.y, mid.z).quaternion.setFromUnitVectors(UP, F.clone().sub(A).normalize());
      for (const s of [-.33, .33]) strut(P(1.86, 1.9, s), mid2, .05, dark);
      add(new THREE.CylinderGeometry(.42, .52, .12, 22), dark, F.x, .06, F.z); add(new THREE.SphereGeometry(.13, 12, 8), chrome, F.x, .2, F.z);
      add(new THREE.BoxGeometry(.3, .4, .3), dark, dx * 1.62, 12.0, dz * 1.62, 0, -a, 0);   // reaction-control thruster pods
      for (const s of [-1, 1]) add(new THREE.ConeGeometry(.06, .16, 10), dark, dx * 1.62 + Math.cos(a + s * Math.PI / 2) * .2, 12.0, dz * 1.62 + Math.sin(a + s * Math.PI / 2) * .2, 0, 0, 0).rotation.set(0, 0, 0);
    }
    // antenna mast and a small dish
    strut(new THREE.Vector3(.9, 14.0, .9), new THREE.Vector3(1.0, 15.6, 1.0), .02, chrome);
    const dish = add(new THREE.SphereGeometry(.45, 20, 10, 0, Math.PI * 2, 0, .9), M({ color: 0xe8e8e8, metalness: .3, roughness: .4, side: THREE.DoubleSide }), 1.95, 7.6, .6); dish.rotation.set(0, 0, -1.3);
    // engines: main bell (cooling tubes outside, glowing hot inside) and four steering thrusters
    const bell = []; for (let i = 0; i <= 16; i++) { const t = 1 - i / 16; bell.push([.36 + .74 * Math.pow(t, .62), .25 + (1 - t) * 1.2]); }
    const bg = new THREE.LatheGeometry(bell.map(([r, y]) => new THREE.Vector2(r, y)), 40); add(bg, nozzleM); add(bg, heat);
    add(new THREE.CylinderGeometry(.46, .5, .35, 20), dark, 0, 1.6, 0); add(new THREE.TorusGeometry(1.1, .04, 8, 40), chrome, 0, .26, 0, Math.PI / 2, 0, 0);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2, s = add(bg, nozzleM, Math.cos(a) * 1.28, .85, Math.sin(a) * 1.28); s.scale.setScalar(.28); }
    g.traverse(o => { if (o.isMesh && o.material !== glass) { o.castShadow = true; o.receiveShadow = true; } });
    // exhaust: a flickering outer plume, a bright core, shock diamonds and a glow, plus a light that lights the ground
    const flame = new THREE.Group(); flame.position.y = .25; flame.visible = false; g.add(flame);
    const tU = { value: 0 }, pm = core => new THREE.ShaderMaterial({ uniforms: { uTime: tU, uCore: { value: core } }, vertexShader: PLUME_VS, fragmentShader: PLUME_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    const outer = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 2.2, 8, 32, 12, true), pm(0)); outer.position.y = -4; flame.add(outer);
    const core = new THREE.Mesh(new THREE.CylinderGeometry(.5, .12, 2.8, 24, 6, true), pm(1)); core.position.y = -1.4; flame.add(core);
    const spr = (y, s, o) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glowSprite, transparent: true, opacity: o, depthWrite: false, blending: THREE.AdditiveBlending })); sp.position.y = y; sp.scale.set(s, s, 1); flame.add(sp); return sp; };
    const diamonds = [spr(-1.0, .9, .8), spr(-1.9, .7, .6), spr(-2.7, .5, .45)], glowS = spr(-.3, 4.2, .55);
    const light = new THREE.PointLight(0xffa860, 0, 45, 2); light.position.y = -1.5; g.add(light);
    g.userData = { flame, door, light, setDoor: k => { hinge.rotation.y = 1.9 * k; },
      update(dt) { tU.value += dt; const on = flame.visible, s = flame.scale.x; light.intensity = on ? (2.4 + Math.random() * .9) * s : 0;
        heat.emissiveIntensity = on ? 1.8 : Math.max(0, heat.emissiveIntensity - dt * .25); diamonds.forEach((d, i) => d.material.opacity = (.75 - i * .15) * (.7 + Math.random() * .3)); glowS.material.opacity = .45 + Math.random() * .15; } };
    return g;
  }
  /* ---------------- the 2075 spacesuit ---------------- */
  let fabric = null;
  function astronaut(renderer, suitColor = 0xf2f2ec, accent = 0xff7a2f) {
    const g = new THREE.Group(), E = env(renderer), PI = Math.PI;
    if (!fabric) fabric = paint(256, 256, (c, w, h) => { const r = rng(3); c.fillStyle = '#f4f4f0'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(0,0,0,.05)'; for (let i = 0; i < w; i += 4) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, h); c.stroke(); c.beginPath(); c.moveTo(0, i); c.lineTo(w, i); c.stroke(); }
      for (let i = 0; i < 300; i++) { c.fillStyle = 'rgba(0,0,0,' + r() * .04 + ')'; c.fillRect(r() * w, r() * h, 3 + r() * 20, 2 + r() * 8); } }, true, [2, 2]);
    const M = o => new THREE.MeshStandardMaterial(Object.assign({ envMap: E }, o));
    const suit = M({ color: suitColor, map: fabric, roughness: .85, metalness: 0, envMapIntensity: .35 }), hard = M({ color: suitColor, roughness: .38, metalness: .05, envMapIntensity: .75 });
    const acc = M({ color: accent, roughness: .55, metalness: .1, envMapIntensity: .4 }), dark = M({ color: 0x2c3036, roughness: .5, metalness: .5 }), metal = M({ color: 0x9aa3ad, roughness: .28, metalness: .92 });
    const visor = M({ color: 0xffc456, roughness: .05, metalness: 1, envMapIntensity: 1.8 }), glove = M({ color: 0xdedcd4, roughness: .7, metalness: 0, envMapIntensity: .3 }), boot = M({ color: 0xd9d7cf, roughness: .6, envMapIntensity: .3 });
    const lit = (c, i = 1.4) => new THREE.MeshStandardMaterial({ color: 0x0a1a20, emissive: c, emissiveIntensity: i, roughness: .4 }), glow = lit(0x6fe6ff);
    const mk = (geo, mat, par, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); par.add(m); return m; };
    const B = (w, h, d) => new THREE.BoxGeometry(w, h, d), Cy = (a, b, h, s = 16) => new THREE.CylinderGeometry(a, b, h, s), Sp = (r, a = 16, b = 12) => new THREE.SphereGeometry(r, a, b), To = (r, t, a = 8, b = 24) => new THREE.TorusGeometry(r, t, a, b);
    const hips = new THREE.Group(); hips.position.y = .95; g.add(hips);
    // lower torso, waist bearing, hard upper torso with shoulder dome
    mk(Cy(.23, .21, .22, 20), suit, hips, 0, .02, 0); mk(To(.236, .026, 8, 28), metal, hips, 0, .14, 0, PI / 2);
    const torso = mk(Cy(.29, .245, .5, 24), hard, hips, 0, .4, 0); torso.scale.z = .84;
    mk(new THREE.SphereGeometry(.29, 24, 10, 0, PI * 2, 0, PI / 2), hard, hips, 0, .645, 0).scale.set(1, .38, .84);
    // chest display and control module, glowing seams and a mission patch
    mk(B(.3, .17, .1), dark, hips, 0, .46, .25); mk(B(.19, .065, .012), glow, hips, -.025, .49, .301);
    [[0xffb000, -.09], [0x5dff9e, -.03], [0x6fe6ff, .03]].forEach(([c, x]) => mk(B(.035, .028, .02), lit(c, 1.6), hips, x, .415, .3));
    mk(Cy(.03, .03, .06, 12), metal, hips, .11, .43, .31, PI / 2);
    for (const s of [-1, 1]) mk(B(.014, .34, .014), glow, hips, s * .17, .42, .205, 0, s * .45, 0);
    mk(new THREE.CircleGeometry(.045, 20), acc, hips, .17, .56, .225, 0, .5, 0);
    // life-support backpack with vents, status lights, tanks, antenna and a cooling hose
    mk(B(.5, .62, .24), hard, hips, 0, .42, -.31); mk(B(.48, .06, .23), acc, hips, 0, .76, -.31);
    mk(B(.36, .22, .02), dark, hips, 0, .3, -.432); for (let i = 0; i < 5; i++) mk(B(.32, .012, .012), metal, hips, 0, .22 + i * .04, -.445);
    [[0x5dff9e, -.16], [0x5dff9e, -.12], [0xffb000, -.08]].forEach(([c, x]) => mk(Sp(.014, 8, 6), lit(c, 2), hips, x, .64, -.435));
    for (const s of [-1, 1]) mk(Cy(.05, .05, .5, 14), metal, hips, s * .275, .42, -.31);
    mk(Cy(.007, .007, .36, 6), metal, hips, .19, .95, -.36); mk(Sp(.016, 8, 6), lit(0xff4a3a, 2), hips, .19, 1.13, -.36);
    mk(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(.14, .44, .29), new THREE.Vector3(.3, .36, .2), new THREE.Vector3(.33, .42, -.05), new THREE.Vector3(.22, .52, -.2)]), 20, .022, 6), dark, hips);
    // helmet: hard shell, gold reflective visor, neck ring, lamps and a camera
    const head = new THREE.Group(); head.position.y = .86; hips.add(head);
    mk(To(.2, .036, 10, 28), metal, head, 0, -.2, 0, PI / 2); mk(Sp(.27, 32, 24), hard, head);
    mk(new THREE.SphereGeometry(.276, 32, 20, PI / 2 - 1.05, 2.1, .72, 1.28), visor, head);
    for (const s of [-1, 1]) mk(B(.075, .028, .045), lit(0xe8fbff, 2.2), head, s * .17, .14, .19, 0, s * .7, 0);
    mk(B(.05, .05, .09), dark, head, .215, .13, .03);
    // arms: shoulder bearings, elbows, wrist rings and gloves
    const arms = [-1, 1].map(s => {
      const a = new THREE.Group(); a.position.set(s * .34, .56, 0); hips.add(a);
      mk(Sp(.105), hard, a); mk(To(.096, .02, 8, 20), metal, a, 0, -.07, 0, PI / 2);
      mk(Cy(.088, .08, .3, 14), suit, a, 0, -.2, 0); mk(Cy(.091, .091, .05, 14), acc, a, 0, -.13, 0);
      const el = new THREE.Group(); el.position.y = -.33; a.add(el); a.userData.elbow = el;
      mk(Sp(.08, 14, 10), suit, el); mk(Cy(.078, .072, .26, 14), suit, el, 0, -.14, 0); mk(B(.012, .16, .012), glow, el, 0, -.14, .075);
      mk(To(.075, .018, 8, 18), metal, el, 0, -.28, 0, PI / 2);
      const hand = new THREE.Group(); hand.position.y = -.36; el.add(hand);
      mk(Cy(.08, .07, .08, 14), acc, hand, 0, .04, 0); mk(B(.1, .1, .056), glove, hand, 0, -.04, 0);
      mk(B(.095, .07, .05), glove, hand, 0, -.115, .01, .3); mk(Cy(.019, .016, .075, 8), glove, hand, -s * .058, -.04, .025, 0, 0, s * .5);
      return a;
    });
    // legs: hip joint, knee bearing, boots with soles and toe caps
    const legs = [-1, 1].map(s => {
      const l = new THREE.Group(); l.position.set(s * .13, 0, 0); hips.add(l);
      mk(Sp(.115, 14, 10), suit, l, 0, -.02, 0); mk(Cy(.115, .105, .42, 14), suit, l, 0, -.22, 0); mk(B(.012, .28, .012), glow, l, s * .108, -.22, .03);
      const knee = new THREE.Group(); knee.position.y = -.44; l.add(knee); l.userData.knee = knee;
      mk(Sp(.1, 14, 10), hard, knee, 0, 0, .015); mk(To(.1, .02, 8, 18), metal, knee, 0, -.06, 0, PI / 2);
      mk(Cy(.105, .095, .3, 14), suit, knee, 0, -.2, 0); mk(Cy(.1, .112, .12, 14), hard, knee, 0, -.35, 0);
      mk(B(.2, .12, .3), boot, knee, 0, -.425, .05); mk(B(.215, .045, .335), dark, knee, 0, -.49, .05); mk(B(.19, .07, .07), dark, knee, 0, -.42, .19);
      return l;
    });
    const tablet = mk(B(.26, .18, .03), M({ color: 0x1c2230, roughness: .4, metalness: .3, emissive: 0x0a3346 }), arms[1].userData.elbow, 0, -.36, .13, -.6); tablet.visible = false;
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return { g, hips, head, arms, legs, tablet, phase: 0, t: 0 };
  }
  /* ---------------- dust plumes: soft, lit-looking puffs in one draw call ---------------- */
  function puffs(scene, color, max = 260) {
    const pos = new Float32Array(max * 3), size = new Float32Array(max), alpha = new Float32Array(max), P = Array.from({ length: max }, () => ({ life: 0 }));
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1)); geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
    const tex = paint(64, 64, (c) => { const gr = c.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.5, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64); }, false);
    const mat = new THREE.ShaderMaterial({ uniforms: { uTex: { value: tex }, uColor: { value: new THREE.Color(color) }, uScale: { value: innerHeight / 2 } }, transparent: true, depthWrite: false,
      vertexShader: 'attribute float aSize; attribute float aAlpha; varying float vA; uniform float uScale; void main(){ vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position, 1.); gl_PointSize = aSize * uScale / max(.1, -mv.z); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform sampler2D uTex; uniform vec3 uColor; varying float vA; void main(){ float a = texture2D(uTex, gl_PointCoord).a * vA; if (a < .01) discard; gl_FragColor = vec4(uColor, a); }' });
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; scene.add(pts); let next = 0;
    return {
      emit(x, y, z, vx, vy, vz, s = 1, life = 2.5, grow = 2) { const p = P[next]; next = (next + 1) % max; Object.assign(p, { x, y, z, vx, vy, vz, s, life, l0: life, grow }); },
      update(dt, grav, ground, drag) {
        mat.uniforms.uScale.value = innerHeight / 2;
        P.forEach((p, i) => { if (p.life > 0) { p.life -= dt; const k = Math.exp(-drag * dt); p.vx *= k; p.vz *= k; p.vy = p.vy * k - grav * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
            const gy = ground(p.x, p.z) + .15; if (p.y < gy) { p.y = gy; p.vy = 0; p.vx *= .6; p.vz *= .6; }
            const age = 1 - p.life / p.l0; pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z; size[i] = p.s * (1 + age * p.grow); alpha[i] = Math.min(1, age * 8) * (1 - age) * .55; }
          else { alpha[i] = 0; pos[i * 3 + 1] = -999; } });
        geo.attributes.position.needsUpdate = geo.attributes.aSize.needsUpdate = geo.attributes.aAlpha.needsUpdate = true;
      } };
  }
  return { bake, planet, atmosphere, env, rocket, astronaut, puffs, paint };
})();
