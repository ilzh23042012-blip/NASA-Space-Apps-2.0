/* Rover Rescue / Project RECLAIM: shared rover models and mission history.
   Used by repair.html (hand-tracked repair bay) and story.html (astronaut, rocket, driving). Needs three.js r128 loaded first. */
/* ================= geometry helpers ================= */
const V = (x, y, z) => new THREE.Vector3(x, y, z), PIE = Math.PI, YAX = V(0, 1, 0), ZAX = V(0, 0, 1), IDQ = new THREE.Quaternion();
const BoxG = THREE.BoxGeometry, CylG = THREE.CylinderGeometry, SphG = THREE.SphereGeometry;
const glow = c => new THREE.MeshBasicMaterial({ color: c });
const GOLD = 0xd4a74a, STEEL = 0xb9b9b9;
function strut(add, M, a, b, r = .02, c = STEEL) {
  const d = b.clone().sub(a), m = add(new CylG(r, r, d.length(), 6), M(c, .8, .4), (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  m.quaternion.setFromUnitVectors(YAX, d.normalize()); return m;
}
const tagged = (add, key) => (...a) => { const m = add(...a); m.userData[key] = true; return m; };
/* Spirit / Opportunity wheel (aluminium, cleated) */
function wheelBuild(add, M) {
  const r = PIE / 2;
  add(new CylG(.33, .33, .26, 14), M(0x1c1c1e, .1, .95, 0, true), 0, 0, 0, r, 0, 0); add(new CylG(.23, .23, .28, 14), M(0x8f9aa5, .85, .3), 0, 0, 0, r, 0, 0);
  add(new BoxG(.4, .05, .29), M(0x5f6a75, .8, .4)); add(new BoxG(.05, .4, .29), M(0x5f6a75, .8, .4)); add(new CylG(.07, .07, .33, 8), M(GOLD, .9, .3), 0, 0, 0, r, 0, 0);
  for (let i = 0; i < 10; i++) { const a = i / 10 * PIE * 2; add(new BoxG(.05, .08, .27), M(0x111113, .1, .95), Math.cos(a) * .34, Math.sin(a) * .34, 0, 0, 0, a); }
}
/* Apollo LRV wheel: woven wire mesh with titanium chevron treads and a hub drive motor */
function lrvWheelBuild(add, M) {
  const r = PIE / 2, mesh = new THREE.MeshStandardMaterial({ color: 0xaab0b6, metalness: .8, roughness: .4, wireframe: true });
  add(new CylG(.4, .4, .23, 22, 2, true), mesh, 0, 0, 0, r, 0, 0);
  for (const z of [-.115, .115]) add(new THREE.TorusGeometry(.4, .014, 6, 32), M(0x9a9ea4, .8, .4), 0, 0, z);
  for (let i = 0; i < 16; i++) { const a = i / 16 * PIE * 2; add(new BoxG(.05, .012, .2), M(0xb9a26a, .7, .4), Math.cos(a) * .405, Math.sin(a) * .405, 0, 0, 0, a + PIE / 2); }
  add(new CylG(.13, .13, .2, 16), M(0x3a3d42, .6, .5), 0, 0, 0, r, 0, 0); add(new CylG(.06, .06, .24, 10), M(GOLD, .9, .3), 0, 0, 0, r, 0, 0);
}
/* LRV fender: a fiberglass arc over the wheel plus an extension (rear side on rear wheels). state: full | broken */
const fenderBuild = (rear, state) => (add, M) => {
  const fm = M(0xd9d4c6, .3, .6); fm.side = THREE.DoubleSide;
  add(new CylG(.47, .47, .27, 16, 1, true, PIE - .75, 1.5), fm, 0, 0, 0, PIE / 2, 0, 0);
  if (state === 'full') { const e = add(new CylG(.47, .47, .27, 8, 1, true, rear ? PIE + .75 : PIE - 1.35, .6), fm, 0, 0, 0, PIE / 2, 0, 0); e.userData.ext = true; }
  else { add(new CylG(.47, .47, .27, 2, 1, true, PIE + .75, .1), fm, 0, 0, 0, PIE / 2, 0, 0);
    add(new BoxG(.05, .012, .1), fm, -.37, .29, .06, 0, 0, .9); add(new BoxG(.04, .012, .07), fm, -.38, .28, -.07, 0, 0, .7); }
};
const EMPTY = { id: 'none', kind: 'none', name: '', build() {} };

/* ================= rover models ================= */
function lrvParts(a17) {
  const W = (id, nm, x, z) => ({ id, kind: 'wheel', gen: 'Wire-mesh wheel', name: 'Wire-mesh wheel (' + nm + ')', home: V(x, -.05, z), dir: V(x * .3, -.25, Math.sign(z)).normalize(), build: lrvWheelBuild,
    info: 'Woven zinc-coated steel wire with titanium treads, light and springy. Each wheel had its own electric drive motor.' });
  const Fd = (id, nm, x, z, rear, st) => ({ id, kind: 'fender', name: 'Fender (' + nm + ')', home: V(x, -.05, z), dir: V(x * .3, .35, Math.sign(z)).normalize(), build: fenderBuild(rear, st),
    info: st === 'broken' ? 'The extension at the back of this fender has broken off. Nothing now stops the wheel throwing dust upward.' : 'Fiberglass fender with an extension. It stops the wheel throwing lunar dust over the crew and equipment.' });
  const P = [
    { id: 'chassis', kind: 'chassis', name: 'Aluminium chassis', home: V(0, 0, 0), dir: V(0, 0, 0), info: 'Three hinged sections. The rover folded up so it fitted in a bay on the side of the Lunar Module.', build(add, M) {
        const al = M(0xc8ccd2, .7, .4), tube = M(0x9aa0a8, .8, .35);
        add(new BoxG(1.2, .05, 1.0), al, 0, .12, 0); add(new BoxG(.75, .05, .9), al, .98, .12, 0); add(new BoxG(.75, .05, .9), al, -.98, .12, 0);
        for (const z of [-.47, .47]) add(new BoxG(2.7, .05, .05), tube, 0, .1, z);
        for (const x of [-1.15, 1.15]) for (const s of [-1, 1]) { strut(add, M, V(x * .7, .1, s * .45), V(x, -.05, s * .86), .022, 0x9aa0a8); strut(add, M, V(x * 1.13, .1, s * .45), V(x, -.05, s * .86), .022, 0x9aa0a8); }
        add(new BoxG(.3, .03, .8), M(0x6b6f75, .5, .6), .52, .16, 0); } },
    { id: 'seats', kind: 'seats', name: 'Crew seats', home: V(-.15, .15, 0), dir: V(0, 1, 0), info: 'Two folding seats with seat belts. The astronauts drove sitting down, in pressurised suits.', build(add, M) {
        for (const z of [-.3, .3]) { add(new BoxG(.45, .05, .42), M(0x6f747b, .4, .6), 0, .08, z); add(new BoxG(.05, .42, .42), M(0x6f747b, .4, .6), -.25, .3, z, 0, 0, -.15);
          strut(add, M, V(.2, .08, z), V(.2, -.02, z), .012); strut(add, M, V(-.2, .08, z), V(-.2, -.02, z), .012); } } },
    { id: 'hc', kind: 'hc', name: 'Hand controller (T-handle)', home: V(.22, .15, 0), dir: V(.3, 1, 0).normalize(), info: 'One T-shaped handle between the seats: push forward to go, pull back to brake, tilt left or right to steer.', build(add, M) {
        add(new BoxG(.1, .06, .1), M(0x2a2d33, .5, .5), 0, .03, 0); add(new CylG(.022, .022, .3, 10), M(0x9aa0a8, .8, .3), 0, .2, 0); add(new BoxG(.05, .045, .2), M(0x1d1f23, .4, .6), 0, .36, 0); } },
    { id: 'console', kind: 'nav', name: 'Control and display console', gen: 'Navigation console', home: V(.5, .15, 0), dir: V(1, .6, 0).normalize(), info: 'Showed heading, speed, distance and the bearing and range back to the Lunar Module, worked out by a navigation computer.', build(add, M) {
        strut(add, M, V(0, 0, 0), V(.05, .45, 0), .025); add(new BoxG(.08, .26, .42), M(0x3a3d42, .5, .5), .07, .55, 0, 0, 0, -.35);
        for (let i = 0; i < 6; i++) add(new CylG(.025, .025, .02, 12), M(0xdedede, .4, .5), .115, .48 + (i % 2) * .1, -.14 + (i / 2 | 0) * .14, 0, 0, PIE / 2 - .35);
        add(new SphG(.05, 12, 8), M(0x1a1a1a, .3, .4), .11, .62, 0); } },
    { id: 'batt', kind: 'batt', name: 'Batteries (2 × 36-volt silver-zinc)', gen: 'Battery', home: V(1.05, .2, 0), dir: V(1, .5, 0).normalize(), info: 'Two non-rechargeable batteries powered the wheel motors and steering. No solar panels and no nuclear power.', build(add, M) {
        for (const z of [-.22, .22]) { add(new BoxG(.3, .14, .3), M(0x4a4f57, .6, .5), 0, 0, z); add(new BoxG(.32, .02, .32), M(0xeeeeee, .3, .6), 0, .08, z); } } },
    { id: 'lcru', kind: 'comm', name: 'Lunar Communications Relay Unit', gen: 'Radio relay', home: V(1.32, .25, .05), dir: V(1, .5, 0).normalize(), info: 'Let the crew talk to Earth directly and sent colour TV through the umbrella-shaped high-gain antenna.', build(add, M) {
        add(new BoxG(.22, .2, .36), M(0xd9d9d9, .6, .4)); strut(add, M, V(0, .1, .1), V(0, .95, .1), .015);
        const um = M(0xe8e8e8, .4, .5); um.side = THREE.DoubleSide; add(new CylG(.42, .02, .14, 18, 1, true), um, 0, 1.0, .1, 0, 0, .35);
        add(new CylG(.012, .012, .7, 6), M(0x9aa0a8, .8, .4), 0, .45, -.18); } },
    { id: 'tv', kind: 'tv', name: 'Remote-controlled TV camera', gen: 'TV camera', home: V(1.38, .5, -.32), dir: V(1, .4, -.5).normalize(), info: 'Controllers on Earth could point and zoom this colour TV camera. It filmed the Lunar Module lifting off.', build(add, M) {
        strut(add, M, V(0, -.3, 0), V(0, 0, 0), .015); add(new BoxG(.13, .12, .18), M(0xeeeeee, .4, .5), 0, .06, 0); add(new CylG(.035, .035, .08, 10), M(0x1a1a1a, .4, .5), .1, .06, 0, 0, 0, PIE / 2); } },
    { id: 'pallet', kind: 'pallet', name: 'Tool and sample pallet', gen: 'Tool pallet', home: V(-1.25, .3, 0), dir: V(-1, .4, 0).normalize(), info: 'Carried rakes, scoops, tongs, core tubes and bags for rock and soil samples.', build(add, M) {
        add(new BoxG(.3, .36, .7), M(0x8a8f96, .6, .5)); for (const z of [-.2, 0, .2]) add(new CylG(.012, .012, .8, 6), M(0xb9b9b9, .8, .4), -.05, .4, z);
        add(new BoxG(.2, .14, .16), M(0xe0ddd5, .4, .6), .05, .26, .22); } },
    W('wFL', 'left front', 1.15, -1.0), W('wFR', 'right front', 1.15, 1.0), W('wRL', 'left rear', -1.15, -1.0), W('wRR', 'right rear', -1.15, 1.0),
    Fd('fFL', 'left front', 1.15, -1.0, false, 'full'), Fd('fFR', 'right front', 1.15, 1.0, false, 'full'), Fd('fRL', 'left rear', -1.15, -1.0, true, 'full'),
    Fd('fRR', 'right rear', -1.15, 1.0, true, a17 ? 'broken' : 'full')];
  if (a17) P.push({ id: 'sep', kind: 'sep', name: 'Surface Electrical Properties receiver', gen: 'SEP receiver', home: V(-1.3, .55, -.25), dir: V(-1, .5, -.4).normalize(), info: 'Apollo 17 only: it picked up radio waves sent through the ground to probe layers below the surface.', build(add, M) {
      add(new BoxG(.18, .14, .2), M(0xe0ddd5, .4, .6)); add(new THREE.TorusGeometry(.14, .008, 4, 20), M(0x9aa0a8, .8, .4), 0, .14, 0, PIE / 2, 0, 0); } });
  return P;
}
function merParts(spirit) {
  const Wm = (id, nm, x, z) => ({ id, kind: 'wheel', gen: 'Wheel', spare: true, name: 'Wheel (' + nm + ')', home: V(x, -.42, z), dir: V(x * .4, -.3, Math.sign(z)).normalize(), build: wheelBuild,
    info: 'One of six aluminium wheels, each with its own motor. The four corner wheels can also steer.' });
  const P = [
    { id: 'body', kind: 'chassis', name: 'Warm electronics box', home: V(0, 0, 0), dir: V(0, 0, 0), info: 'Holds the computer and batteries, kept warm by electric heaters and small radioisotope heater units.', build(add, M) {
        add(new BoxG(1.5, .42, 1.0), M(0xe9e5dc, .35, .55)); add(new BoxG(1.54, .05, 1.04), M(GOLD, .9, .3), 0, -.22, 0);
        for (const z of [-1, 1]) { add(new BoxG(1.7, .05, .05), M(STEEL, .8, .4), 0, -.12, z * .68); add(new BoxG(.05, .05, .2), M(STEEL, .8, .4), 0, -.12, z * .58);
          for (const x of [-.75, 0, .75]) add(new BoxG(.05, .26, .05), M(STEEL, .8, .4), x, -.25, z * .68); }
        add(new CylG(.012, .012, .55, 6), M(0x888888, .8, .4), -.6, .5, -.38); add(new SphG(.025, 8, 8), glow(0xffb000), -.6, .78, -.38); } },
    { id: 'solar', kind: 'solar', name: 'Solar arrays', home: V(0, .24, 0), dir: V(0, 1, 0), info: 'About 1.3 square metres of solar cells, the rover’s only source of power.', build(add, M) {
        const cell = M(0x1b2c52, .55, .22), line = M(0x9fb3d1, .8, .3), fr = M(STEEL, .8, .4);
        const pan = (x, z, sx, sz) => { add(new BoxG(sx + .04, .02, sz + .04), fr, x, -.012, z); add(new BoxG(sx, .03, sz), cell, x, 0, z);
          for (let i = 1; i < 4; i++) add(new BoxG(.01, .034, sz), line, x - sx / 2 + i * sx / 4, .001, z); add(new BoxG(sx, .034, .01), line, x, .001, z); };
        pan(0, 0, 1.45, 1.0); pan(0, .83, 1.45, .66); pan(0, -.83, 1.45, .66); pan(-.95, 0, .45, .9); } },
    { id: 'mast', kind: 'mast', spare: true, name: 'Pancam mast', gen: 'Camera mast', home: V(.55, .26, .3), dir: V(.3, 1, .3).normalize(), info: 'Panoramic and navigation cameras about 1.5 m up, roughly the eye height of a person. Pancam also measured how dusty the sky was by photographing the Sun.', build(add, M) {
        add(new CylG(.035, .035, .85, 8), M(STEEL, .7, .4), 0, .425, 0); add(new BoxG(.13, .13, .46), M(0x5a616b, .5, .5), 0, .9, 0);
        for (const z of [-.18, .18]) add(new CylG(.035, .035, .04, 10), glow(0x66e6ff), .075, .9, z, 0, 0, PIE / 2); } },
    { id: 'hga', kind: 'hga', spare: true, name: 'High-gain antenna', gen: 'High-gain antenna', home: V(-.25, .26, -.3), dir: V(-.3, 1, -.3).normalize(), info: 'A steerable dish for talking directly to Earth through NASA’s Deep Space Network.', build(add, M) {
        add(new CylG(.03, .03, .22, 8), M(STEEL, .7, .4), 0, .11, 0); add(new SphG(.045, 10, 10), M(GOLD, .9, .3), 0, .24, 0); add(new CylG(.17, .17, .025, 28), M(0xdedede, .4, .5), 0, .3, 0, .7, 0, 0); } },
    { id: 'arm', kind: 'arm', spare: true, name: 'Robotic arm', gen: 'Robotic arm', home: V(.8, -.08, 0), dir: V(1, 0, 0), info: 'Carries a microscopic imager, two spectrometers and a Rock Abrasion Tool that grinds into rocks.', build(add, M) {
        add(new BoxG(.1, .12, .16), M(GOLD, .9, .3)); add(new CylG(.028, .028, .42, 8), M(STEEL, .8, .35), .06, -.02, .2, PIE / 2, 0, 0);
        add(new SphG(.045, 10, 10), M(0x9aa4ad, .8, .3), .06, -.02, .42); add(new CylG(.028, .028, .36, 8), M(STEEL, .8, .35), .12, -.05, .25, PIE / 2, 0, 0);
        add(new BoxG(.1, .1, .1), M(0x2a2d33, .5, .5), .13, -.06, .05); add(new CylG(.025, .025, .1, 8), M(0xcfd6dc, .8, .3), .13, -.13, .05); } },
    Wm('wRF', 'right front', .75, .68), Wm('wRM', 'right middle', 0, .68), Wm('wRR', 'right rear', -.75, .68),
    Wm('wLF', 'left front', .75, -.68), Wm('wLM', 'left middle', 0, -.68), Wm('wLR', 'left rear', -.75, -.68)];
  if (spirit) P.push({ id: 'sand', kind: 'sand', still: true, name: 'Soft soil at "Troy"', home: V(0, -.74, .1), dir: V(0, 0, 0), info: 'Fine, loose soil hidden under a thin crust.', build(add, M) {
      add(new SphG(1.35, 28, 10, 0, PIE * 2, 0, PIE / 2).scale(1, .27, .78), M(0xc79a63, 0, 1)); } });
  return P;
}
// a def that builds a whole rover in one group; each mesh remembers which part it came from (userData.pid)
const wholeDef = (C, skip = []) => ({ id: C.id + '_all', kind: 'whole', name: C.name, build(add, M) {
  for (const d of C.parts) if (!skip.includes(d.id)) d.build((geo, mt, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { const m = add(geo, mt, x + d.home.x, y + d.home.y, z + d.home.z, rx, ry, rz); m.userData.pid = d.id; return m; }, M);
} });
const lrvCorner = { id: 'rrCorner', kind: 'corner', name: 'Right-rear wheel and fender', build(add, M) {
  lrvWheelBuild(tagged(add, 'spin'), M); fenderBuild(true, 'broken')(add, M);
  add(new BoxG(1.5, .05, .3), M(0xc8ccd2, .7, .4), .9, .17, -.45); strut(add, M, V(.3, .15, -.45), V(0, 0, -.12), .022, 0x9aa0a8);
  add(new BoxG(.45, .05, .4), M(0x6f747b, .4, .6), 1.15, .42, -.55); add(new BoxG(.05, .42, .4), M(0x6f747b, .4, .6), .9, .62, -.55, 0, 0, -.15);
} };
const merWheelUnit = { id: 'merWheel', kind: 'wheel', name: 'Right-front wheel', build(add, M) { wheelBuild(tagged(add, 'spin'), M); } };

/* ================= the four missions (deterministic, based on NASA history) ================= */
const LABEL = { H: ['HISTORICAL EVENT', '#5dff9e'], R: ['INTERACTIVE RECONSTRUCTION', '#46d9ff'], X: ['HYPOTHETICAL SIMULATION', '#ff9a3c'] };
const SRC = {
  a15: ['Apollo 15 mission summary (NASA History, SP-4029)', 'https://www.nasa.gov/wp-content/uploads/static/history/SP-4029/Apollo_15a_Summary.htm'],
  a17: ['Apollo 17 mission summary (NASA History, SP-4029)', 'https://www.nasa.gov/wp-content/uploads/static/history/SP-4029/Apollo_17a_Summary.htm'],
  spirit: ['Spirit mission page (NASA Science)', 'https://science.nasa.gov/mission/mer-spirit/'],
  mer: ['Mars Exploration Rovers Spirit and Opportunity (NASA Science)', 'https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/'],
};
const MISSIONS = [
  { id: 'a15', name: 'Apollo 15 Lunar Roving Vehicle', short: 'Apollo 15 LRV', years: 'July – August 1971', where: 'Hadley–Apennine, Moon', env: 'MOON', k: .62, accent: '#46d9ff',
    challenge: 'Steering fault and route planning', card: 'The first rover driven by astronauts on the Moon. Sort out a steering scare, then plan a safe science drive.', parts: lrvParts(false),
    people: 'Commander David Scott and Lunar Module Pilot James Irwin explored the surface. Command Module Pilot Alfred Worden stayed in lunar orbit.',
    before: 'Apollo 15 launched on 26 July 1971 and was the first of the longer "J-missions". It carried the first Lunar Roving Vehicle (LRV): a battery-powered car that folded up against the side of the Lunar Module Falcon. Its job was to carry two astronauts and their tools much farther than they could walk, to the edge of Hadley Rille and the slopes of the Apennine Mountains.',
    objective: 'Inspect the rover and diagnose its front-steering problem. Then plan a drive that reaches important geology and still brings the crew home safely.',
    tasks: [
      { part: 'hc', recipe: 'a15_steer', label: 'R', title: 'Front steering not responding', text: 'Front wheels ignore the steering handle', when: '31 July 1971, first drive',
        history: 'On the first drive the front-wheel steering did not respond. Troubleshooting with the switches did not fix it, so Scott drove the whole first traverse steering with the rear wheels only. When the rover was powered up for the second moonwalk, the front steering worked again. The exact cause was never confirmed.',
        explain: { title: 'Two steering systems', text: 'The LRV had separate electric steering motors for the front and the rear wheels, each with its own switch and circuit breaker. With both working it could turn in a circle about 3 m across. With one, it needed more room, but it could still drive. Building in a backup like this is called redundancy.' },
        learn: 'Each of the four wheels had its own small electric motor (about a quarter of a horsepower) inside its hub, so a single motor failure would not stop the rover. Steering was "drive by wire": the T-handle sent electrical signals to the steering motors rather than pulling on a mechanical linkage.' },
      { part: 'console', recipe: 'a15_route', label: 'R', title: 'Plan the science drive', text: 'Pick stops within battery and life-support limits', when: '31 July – 2 August 1971',
        history: 'Over three moonwalks Scott and Irwin drove about 28 km. At Spur crater they found a bright, very old crystal-rich rock nicknamed the Genesis Rock.',
        explain: { title: 'The walkback limit', text: 'Mission rules kept the rover close enough to the Lunar Module that, if it broke down, the astronauts could still walk back before their backpacks ran low on oxygen and cooling. Oxygen belonged to the astronauts’ life-support backpacks, not to the rover. That limit often mattered more than the battery.' },
        learn: 'The Genesis Rock (sample 15415) is anorthosite: rock made mostly of the mineral plagioclase, from the Moon’s early crust, about 4 billion years old. Basalts collected near Hadley Rille are hardened lava, and many contain holes left by gas bubbles. Breccias are rocks smashed apart by impacts and welded back together.' }],
    after: 'The LRV carried Scott and Irwin about 28 km in roughly three hours of driving, far more ground than walking would have allowed. Apollo 15 brought home about 77 kg of lunar samples. Before leaving, the crew parked the rover so its TV camera could film the Lunar Module’s lift-off. The rover is still at Hadley today.',
    facts: ['On 31 July 1971 Scott and Irwin made the first drive by astronauts on another world.', 'The LRV weighed about 210 kg on Earth but could carry more than twice its own weight in crew, tools and rocks.', 'It ran on two 36-volt silver-zinc batteries, with no solar panels and no nuclear power.', 'The Genesis Rock showed that the Moon had a crust of pale anorthosite very early in its history.'],
    sources: [SRC.a15, ['NASA Image and Video Library: Apollo 15 rover photographs', 'https://images.nasa.gov/search?q=apollo%2015%20lunar%20roving%20vehicle']] },
  { id: 'a17', name: 'Apollo 17 Lunar Roving Vehicle', short: 'Apollo 17 LRV', years: 'December 1972', where: 'Taurus–Littrow Valley, Moon', env: 'MOON', k: .62, accent: '#c9d1d8',
    challenge: 'Improvised fender repair', card: 'A broken fender showered the crew with dust. Rebuild the famous fix made from maps, tape and clamps.', parts: lrvParts(true),
    people: 'Commander Gene Cernan and geologist Harrison "Jack" Schmitt, the only professional scientist to walk on the Moon, explored the surface. Ronald Evans orbited above.',
    before: 'Apollo 17 was the last crewed Moon landing. Cernan and Schmitt landed in the Taurus–Littrow valley, a deep valley ringed by mountains, to collect very old crust rocks and look for signs of young volcanic activity. Their Lunar Roving Vehicle was the same design as Apollo 15’s.',
    objective: 'Inspect the damaged fender and see how the wheel throws dust. Then rebuild the repair the crew and Mission Control invented, and test it.',
    tasks: [
      { part: 'fRR', recipe: 'a17_dust', label: 'H', title: 'Fender extension broken off', text: 'The right-rear wheel sprays dust over the crew', when: '11 December 1972, first moonwalk',
        history: 'A hammer in Cernan’s suit pocket caught the right-rear fender extension and knocked it off. Tape would not stick because everything was coated in dust, and the uncovered wheel threw a "rooster tail" of grit over the astronauts.',
        explain: { title: 'Why lunar dust is a problem', text: 'Lunar dust is made of sharp, glassy fragments that were never smoothed by wind or water. It clings to everything, scratches visors and seals, jams joints, and dark dust absorbs sunlight so dusty equipment overheats.' },
        learn: 'With no air and only one-sixth of Earth’s gravity, dust flung up by a wheel flies in long, high arcs and is not slowed by air drag. That is why even a small missing piece of fender made such a big difference.' },
      { part: 'fRR', recipe: 'a17_fender', label: 'R', title: 'Build a replacement fender', text: 'Make one from maps, tape and clamps', when: '12 December 1972, second moonwalk',
        history: 'First the crew taped the broken extension back on, but on the dusty fender the tape would not hold and the piece came off again during the drive. Overnight, astronaut John Young and engineers on Earth worked out a better fix: four stiff laminated maps taped together and held on with two clamps borrowed from inside the Lunar Module. Cernan and Schmitt fitted it the next morning and it worked for the rest of the mission.',
        explain: { title: 'Engineering with what you have', text: 'Nobody could send spare parts to the Moon. The team listed what the crew already had, tested ideas on Earth, and read the instructions up by radio. Clamps worked where tape alone failed because they do not depend on a clean, dust-free surface.' },
        learn: 'This is a classic example of teamwork between astronauts and Mission Control. People on the ground rehearsed the repair with real materials so the crew could do it quickly and safely in their bulky gloves.' }],
    after: 'Cernan and Schmitt drove about 36 km and brought home about 111 kg of samples, including orange soil full of tiny volcanic glass beads found at Shorty crater. On 14 December 1972 they left the Moon. Their rover, with its map-and-tape fender, was parked near the landing site, where it remains. No human has been back to the Moon since.',
    facts: ['A missing piece of fender turned into a serious problem because lunar dust is sharp, clingy and travels far in low gravity.', 'The fix used four laminated maps, tape and two clamps from inside the Lunar Module, designed with help from Mission Control.', 'Apollo 17 returned about 111 kg of rock and soil, the most of any Apollo mission.', 'Jack Schmitt was a trained geologist, the only scientist to walk on the Moon.'],
    sources: [SRC.a17, ['NASA Image and Video Library: Apollo 17 rover fender repair photographs', 'https://images.nasa.gov/search?q=apollo%2017%20fender']] },
  { id: 'spirit', name: 'Spirit', short: 'Spirit', years: '2004 – 2010', where: 'Gusev Crater, Mars', env: 'MARS', k: 1, accent: '#ff9a3c',
    challenge: 'Wheel failure and escape attempt', card: 'Built for 90 days, it worked for six years. A dead wheel, a sand trap and a cold winter ended its journey.', parts: merParts(true),
    people: 'Run by a team at NASA’s Jet Propulsion Laboratory, with scientists led by Steve Squyres of Cornell University.',
    before: 'Spirit landed in Gusev Crater on 4 January 2004, one of NASA’s two Mars Exploration Rovers. It was designed for about 90 sols (Mars days). Its goal was to study rocks and soils for clues that water once shaped Mars. In the Columbia Hills, around a feature called Home Plate, it found its biggest discoveries.',
    objective: 'Investigate the failed wheel, experiment with ways to escape the soft soil at Troy, and see why winter sunlight mattered so much.',
    tasks: [
      { part: 'wRF', recipe: 'spirit_wheel', label: 'H', title: 'Right-front wheel stops', text: 'The drive motor has failed', when: 'March 2006',
        history: 'From 2004 the right-front wheel motor drew more electric current than the others, a sign of internal friction, and the team sometimes drove backwards to spread its lubricant. In March 2006 it stopped turning for good. Spirit kept going backwards, dragging the dead wheel, and in 2007 the wheel churned up bright soil that turned out to be almost pure silica.',
        explain: { title: 'An accidental discovery', text: 'A wheel that cannot turn slides instead of rolling, so it ploughs a trench. Spirit’s trench exposed soil about 90% silica. On Earth, deposits like this form around hot springs or steam vents, so this was strong evidence of hot water on ancient Mars.' },
        learn: 'Driving backwards meant the five working wheels pulled the dead one behind them. It was slower and harder to steer, but it let Spirit keep exploring for three more years.' },
      { part: 'wRF', recipe: 'mer_wheel', label: 'X', optional: true, after: 0, title: 'What if you could replace the wheel?', text: 'A hands-on thought experiment', when: 'Hypothetical',
        history: 'This never happened. No person or robot could reach Spirit on Mars, so the dead wheel was never replaced. Try the swap here as a simulation of how wheels are serviced.',
        explain: { title: 'Why robots must be repair-free', text: 'Mars rovers are designed so that a single failure does not end the mission: six wheels instead of four, backup computers, and software that can be updated from Earth. Physical repairs are impossible.' },
        learn: 'Engineers test rover parts on Earth for many times their expected use, and they write flight software so the team can find new ways to drive around failures.' },
      { part: 'sand', recipe: 'spirit_escape', label: 'R', title: 'Trapped at Troy', text: 'Wheels sinking into soft soil', when: 'April 2009 – January 2010',
        history: 'Spirit broke through a crust into fine, loose soil at a site called Troy, and a rock may have been touching its belly. Engineers tested escape moves on Earth with a test rover in a sandbox of similar soil, then tried them on Mars, gaining only centimetres. In November 2009 a second wheel (right-rear) stalled. In January 2010 NASA declared Spirit a stationary science platform.',
        explain: { title: 'Traction and slip', text: 'A wheel moves a rover only if the ground pushes back on it. In loose soil a fast-spinning wheel just digs a hole ("100% slip"). Slow, careful moves sink less and keep what little grip there is.' },
        learn: 'Even while stuck, Spirit kept doing science: its spinning wheels had dug up layers of soil rich in sulfate minerals, another clue that water once moved through the ground.' },
      { part: 'sand', recipe: 'mer_tow', label: 'X', optional: true, after: 2, title: 'What if a tow line existed?', text: 'A cat’s-cradle tow experiment', when: 'Hypothetical',
        history: 'This never happened: there was nobody on Mars to tow Spirit. This experiment uses your hands as a tow line to show how pulling force can help when wheels alone slip.',
        explain: { title: 'Pulling versus pushing', text: 'A tow line pulls the rover along the surface, so it does not depend on wheel grip. That is why stuck vehicles on Earth are winched out.' },
        learn: 'Future missions study ideas like wheels that can "walk" or inch forward, so rovers can free themselves without help.' },
      { part: 'solar', recipe: 'spirit_winter', label: 'R', title: 'Preparing for winter', text: 'Panels cannot face the low winter Sun', when: 'Early 2010',
        history: 'Stuck in place, Spirit could not drive onto a slope that tilted its solar panels toward the winter Sun. The team switched off everything not needed for survival. Spirit last communicated on 22 March 2010. NASA ended efforts to contact it in May 2011.',
        explain: { title: 'Angles and solar power', text: 'When sunlight hits a panel at a steep angle, the same light spreads over a bigger area, so the panel makes less power. In winter the Sun stays low, so tilting the panels toward it can make a big difference.' },
        learn: 'In earlier winters the team parked Spirit on north-facing slopes (Spirit was in the southern hemisphere) to catch more sunlight. At Troy it could not move far enough to do this.' }],
    after: 'Spirit worked for more than six years instead of 90 days and drove about 7.7 km. Real rescue attempts did not free it: NASA turned it into a stationary science platform, and it fell silent in March 2010 during the Martian winter. It still sits at Troy, near Home Plate in Gusev Crater.',
    facts: ['Spirit was designed for about 90 sols but operated for over 2,200 sols.', 'Its dragging, broken wheel exposed silica-rich soil: evidence of hot water, possibly hot springs, on ancient Mars.', 'In soft soil, spinning wheels faster mostly digs them deeper; traction depends on the ground pushing back.', 'Solar power falls in winter because sunlight arrives at a low angle and days are shorter.'],
    sources: [SRC.spirit, SRC.mer] },
  { id: 'opportunity', name: 'Opportunity', short: 'Opportunity', years: '2004 – 2018', where: 'Perseverance Valley, Endeavour Crater, Mars', env: 'MARS', k: 1, accent: '#ffb000',
    challenge: 'Solar power and survival decisions', card: 'Nearly 15 years and 45 km on Mars, until a planet-wide dust storm blotted out the Sun.', parts: merParts(false),
    people: 'Operated from NASA’s Jet Propulsion Laboratory by the same team as Spirit, working through the night on "Mars time" in the early years.',
    before: 'Opportunity landed at Meridiani Planum on 25 January 2004, three weeks after Spirit. Within weeks it found rocks that had formed in water, and tiny round grains nicknamed "blueberries". In 2011 it reached the rim of the 22 km-wide Endeavour Crater, and by 2018 it was exploring Perseverance Valley on the crater’s inner slope.',
    objective: 'Live through Opportunity’s last weeks: watch the dust storm grow, decide how to use its shrinking energy, then try to make contact again.',
    tasks: [
      { part: 'solar', recipe: 'opp_storm', label: 'H', title: 'A planet-wide dust storm', text: 'Sunlight blocked: power collapsing', when: 'May – June 2018',
        history: 'A dust storm grew until it wrapped around the whole planet. The sky above Opportunity became so dark that its panels produced only a tiny fraction of normal power. The panels were not broken; the problem was missing sunlight.',
        explain: { title: 'Measuring a dusty sky', text: 'Scientists describe how much dust is in the sky with a number called tau (optical depth). With higher tau, less sunlight reaches the ground. Over Opportunity tau rose above 10, the darkest sky a Mars rover had ever measured.' },
        learn: 'Opportunity measured tau by photographing the Sun with its Pancam camera and checking how much dimmer it looked than in a clear sky.' },
      { part: 'body', recipe: 'opp_energy', label: 'R', title: 'Survive on battery power', text: 'Decide what to keep running', when: 'June 2018',
        history: 'With too little power, Opportunity entered a low-power fault mode: it shut down almost everything except a clock that woke it to check its batteries. It last communicated on 10 June 2018.',
        explain: { title: 'Energy and heat', text: 'Electronics and batteries can be damaged by the deep cold of a Martian night. Small radioisotope heater units gave some warmth without electricity, but electric heaters drain the battery. A dusty sky also traps some heat, so storm nights are less cold.' },
        learn: 'Every watt-hour is a budget decision: energy used for heating, radio or science is energy not stored for tomorrow. Spacecraft engineers plan these budgets every day.' },
      { part: 'hga', recipe: 'opp_comm', label: 'R', title: 'Listening for Opportunity', text: 'Send commands and wait for a reply', when: 'June 2018 – February 2019',
        history: 'After the storm cleared, NASA sent more than a thousand recovery commands using the Deep Space Network’s big antennas. No reply came. NASA declared the mission complete on 13 February 2019.',
        explain: { title: 'Talking across space', text: 'Radio travels at the speed of light, but Mars is so far away that a message takes several minutes to arrive, and the reply takes just as long to come back. Controllers cannot steer in real time: they send commands and wait.' },
        learn: 'The team hoped a gust of wind might blow dust off the panels, which had happened before ("cleaning events"). This is why they kept listening through the windy season.' }],
    after: 'Opportunity worked for almost 15 years instead of 90 days and drove more than 45 km, a record for driving on another world at the time. It found strong evidence that liquid water once soaked the ground at Meridiani Planum. The 2018 dust storm cut off its power, and despite more than a thousand recovery commands it never answered again. It remains in Perseverance Valley.',
    facts: ['Opportunity was designed for about 90 sols and operated for over 5,000 sols.', 'It drove about 45 km, more than any other off-world vehicle at the time.', 'Its last problem was a dust-darkened sky, not broken panels: power depends on how much sunlight gets through.', 'Radio messages to Mars take minutes each way, so rovers must look after themselves between commands.'],
    sources: [SRC.mer, ['NASA Image and Video Library: Opportunity rover', 'https://images.nasa.gov/search?q=opportunity%20rover']] },
];

/* ================= Project RECLAIM (story mode, set in a fictional 2075) =================
   Everything under `story2075` / `drive` is fiction and is labelled as such in the game.
   Facts shown at checkpoints are real NASA history. */
const RECLAIM = {
  a15: { body: 'MOON', word: 'Curiosity', repairs: ['a15_steer'],
    intro: 'In 2075, Project RECLAIM lands you at Hadley–Apennine, where the first rover ever driven by astronauts has stood since 1971. On its very first drive in real history, its front steering stopped responding. Use your hands to diagnose the steering, then take the rover on one more science drive to the places that made it famous.',
    task: 'Diagnose the steering fault, then drive to three sampling sites and back to your rocket.',
    drive: { type: 'checkpoints', vehicle: 'ride', checkpoints: [
      { name: 'Hadley Rille (the Elbow)', fact: 'Hadley Rille is a winding channel more than a kilometre wide and hundreds of metres deep, probably carved by flowing lava. Scott and Irwin sampled its rim on their first drive.' },
      { name: 'St. George crater', fact: 'On the slope of Mount Hadley Delta the crew collected breccias: rocks shattered by impacts and welded back together, which record the Moon’s violent early history.' },
      { name: 'Spur crater', fact: 'At Spur crater the crew found a white, crystal-rich rock nicknamed the Genesis Rock (sample 15415): anorthosite from the Moon’s ancient crust, about 4 billion years old.' }] },
    done2075: 'Samples collected and the crew safely back at the rocket.', real: 'In reality the rover has not moved since 1971. Over three moonwalks it carried Scott and Irwin about 28 km.' },
  a17: { body: 'MOON', word: 'Ingenuity', repairs: ['a17_dust', 'a17_fender'],
    intro: 'In 2075, Project RECLAIM reaches Taurus–Littrow, where the last rover driven on the Moon still wears its famous home-made fender. Find out why one small broken piece caused so much trouble in 1972 and rebuild the fix yourself. A fictional emergency call is about to put it to the test.',
    task: 'Rebuild the map-and-tape fender, then rush supplies to a stranded crew member before time runs out.',
    drive: { type: 'rescue', vehicle: 'ride', time: 90, call: 'RECLAIM-2 to all units (fictional, 2075): geologist Dr Ana Ruiz is stranded near the South Massif with a failed rover battery. Bring her the spare battery and water before her reserve runs low.',
      facts: [['Lunar dust', 'Without its fender, the rover threw a "rooster tail" of dust over the crew. Dark dust soaks up sunlight, so dusty suits and equipment can overheat.'],
        ['The longest drives', 'Cernan and Schmitt drove about 36 km in the Taurus–Littrow valley, the longest total distance of any Apollo rover.'],
        ['Teamwork across 380,000 km', 'The map-and-tape fender was worked out overnight on Earth by astronaut John Young and engineers, then read up to the crew by radio.']] },
    done2075: 'Supplies delivered and everyone back safely, thanks to a fender made from maps.', real: 'In reality the map fender lasted for the rest of Apollo 17. The rover was parked near the landing site, where it remains.' },
  spirit: { body: 'MARS', word: 'Perseverance', repairs: ['spirit_wheel'],
    intro: 'In 2075, Project RECLAIM reaches Spirit, still stuck at Troy in Gusev Crater where it fell silent in 2010. Spirit is far too small to ride, so you will drive it by remote control. First find out why its right-front wheel died, then try to steer it out of the soft soil to a sunnier slope.',
    task: 'Investigate the dead wheel, then drive Spirit by remote control out of the soft soil to safe, sunny ground.',
    drive: { type: 'escape', vehicle: 'remote', facts: [
      ['Home Plate', 'Nearby Home Plate is a layered plateau made by an explosive volcanic eruption, possibly involving water.'],
      ['Silica soil', 'The bright soil Spirit dug up with its dead wheel is about 90% silica, a sign of ancient hot springs or steam vents.'],
      ['Winter sunlight', 'In winter Spirit needed a slope tilted toward the north to catch enough sunlight. At Troy it could not reach one.']] },
    done2075: 'Spirit is out of the soft soil and on a sunny slope.', real: 'This rescue is fiction. The real Spirit never escaped Troy and last communicated on 22 March 2010.' },
  opportunity: { body: 'MARS', word: 'Legacy', repairs: ['opp_storm', 'opp_energy'],
    intro: 'In 2075, Project RECLAIM reaches Perseverance Valley on the rim of Endeavour Crater, where Opportunity fell silent during the great dust storm of 2018. Relive how the storm drained its power, then drive it by remote control to a ridge with a clear view of Earth and send one last science report, on a limited battery.',
    task: 'Relive the 2018 power crisis, then reach the signal ridge and transmit before the battery runs out.',
    drive: { type: 'signal', vehicle: 'remote', facts: [
      ['Blueberries', 'Opportunity found small round "blueberries" of the mineral hematite, which on Earth usually forms in water.'],
      ['Endeavour Crater', 'Endeavour Crater is about 22 km wide. Opportunity spent its last seven years exploring its rim.'],
      ['Marathon rover', 'Opportunity drove about 45 km in total, an off-Earth driving record at the time.']] },
    done2075: 'Report transmitted to Earth from the signal ridge.', real: 'This recovery is fiction. The real Opportunity never answered after 10 June 2018, and NASA declared its mission complete on 13 February 2019.' },
};
const RECLAIM_ORDER = ['a15', 'a17', 'spirit', 'opportunity'];
const RECLAIM_ENDING = 'Mission Control, 2075: Four machines, four lessons. Apollo 15’s rover showed how far curiosity can carry explorers when they can travel. Apollo 17’s map fender showed that ingenuity can fix almost anything. Spirit kept working for six years on a broken wheel, and Opportunity outlived its 90-day plan by almost 15 years. Every outpost on the Moon and Mars today stands on what these rovers taught us.';
const progressKey = 'reclaimProgress';
const getProgress = () => { try { return JSON.parse(localStorage.getItem(progressKey) || '{}'); } catch (e) { return {}; } };
const setProgress = (id, v = true) => { const p = getProgress(); p[id] = v; try { localStorage.setItem(progressKey, JSON.stringify(p)); } catch (e) {} return p; };

/* ================= parts ================= */
function builder(g, mats, ghost) {
  const M = (c, m = .5, r = .5, e = 0, flat = false) => {
    const mt = ghost ? new THREE.MeshBasicMaterial({ color: 0x5dff9e, wireframe: true, transparent: true, opacity: .55 })
      : new THREE.MeshStandardMaterial({ color: c, metalness: m, roughness: r, emissive: e, flatShading: flat });
    mats.push(mt); return mt;
  };
  const add = (geo, mt, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, ghost && !mt.wireframe ? M() : mt); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); g.add(m); return m; };
  return { add, M };
}
function makePart(def, style) {
  const g = new THREE.Group(), mats = [], b = builder(g, mats, style === 'ghost');
  def.build(b.add, b.M);
  const p = { g, mats, def, state: 'ok', scanned: false };
  g.children.forEach(m => m.userData.part = p);
  return p;
}
const lname = d => d.gen || d.name;
const meshesOf = part => part.g.children.filter(m => m.isMesh && !m.userData.dust);
const meshesIn = g => { const out = []; g.traverse(o => { if (o.isMesh) out.push(o); }); return out; };
