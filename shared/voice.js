/* Project RECLAIM: spoken lines with typed, disappearing subtitles.
   Each line plays audio/vo/<id>.mp3 if that id is listed in audio/vo/manifest.json (generate the files with VoiceStudio, see VOICEOVER.md).
   If the file is missing, the browser's built-in speech voice reads the line instead (lower quality), unless that is switched off.
   Subtitles are always shown. The 🔊 button mutes all speech. */
const VO_SPEAKERS = {
  control: { label: 'RECLAIM CONTROL · 2075', color: '#46d9ff', pitch: 1.05, rate: 1.02, prefer: /female|zira|aria|jenny|samantha|google uk english female/i },
  narrator: { label: 'NARRATOR · REAL HISTORY', color: '#5dff9e', pitch: .95, rate: .98, prefer: /guy|david|daniel|google us english|male/i },
  capcom: { label: 'HOUSTON CAPCOM · 1972 (dramatised)', color: '#ffb000', pitch: .9, rate: 1.05, radio: true, prefer: /mark|george|david|male/i },
  ana: { label: 'DR ANA RUIZ · 2075', color: '#ff9a3c', pitch: 1.15, rate: 1.05, prefer: /female|hazel|susan|zira/i },
};
const VO_LINES = {
  /* ---- arrival (story) ---- */
  a15_arrive: ['control', 'Welcome to Hadley–Apennine. That rover has been parked here since 1971. On its very first drive, its front steering stopped answering. Walk over and take a look.'],
  a17_arrive: ['control', 'Taurus–Littrow, the last place humans drove on the Moon. See the patched fender on the right rear wheel? That home-made fix is why we are here. Go and inspect it.'],
  spirit_arrive: ['control', 'Gusev Crater. Spirit has been stuck here at Troy since 2009, and its right-front wheel died in 2006. Walk over and find out what went wrong.'],
  opportunity_arrive: ['control', 'Perseverance Valley. Opportunity fell silent here in June 2018, when a dust storm covered the whole planet. Let’s find out how it lost its power.'],
  /* ---- drive briefings (story) ---- */
  a15_drive: ['control', 'Steering checks out. Now a science drive: Hadley Rille, St. George crater and Spur crater, in any order. Stop inside each ring and collect a sample.'],
  a17_drive: ['control', 'Fender’s on. And just in time: we have an emergency call.'],
  a17_call: ['control', 'All units: geologist Ana Ruiz is stranded near the South Massif with a dead rover battery. Take her the spare battery before her reserve runs low.'],
  spirit_drive: ['control', 'We can’t fix that wheel from here, and sunlight won’t fix it either. But winter is coming. We need Spirit on a north-facing slope, so its panels tilt toward the low Sun and make enough power to keep its heaters running.'],
  spirit_power: ['control', 'Your power pack has given Spirit just enough charge for a short drive. Spinning wheels in sand burn energy for nothing, so go slow.'],
  opportunity_drive: ['control', 'Opportunity’s panels are clean and its battery is charged, but only just. Drive it up to the ridge with a clear view of Earth and send its science report.'],
  /* ---- facts while driving (story) ---- */
  a15_cp0: ['narrator', 'Hadley Rille is a winding channel more than a kilometre wide, probably carved by flowing lava. Scott and Irwin sampled its rim on their first drive.'],
  a15_cp1: ['narrator', 'At St. George crater the crew collected breccias: rocks shattered by impacts and welded back together. They record the Moon’s violent early history.'],
  a15_cp2: ['narrator', 'At Spur crater Scott and Irwin found the Genesis Rock: a pale piece of the Moon’s ancient crust, about four billion years old.'],
  a15_wrong: ['control', 'Not quite. Look closely at the texture and colour, and try again.'],
  a15_home: ['control', 'All three samples are aboard. Bring the crew back to the rocket.'],
  a17_f0: ['narrator', 'Without its fender, the rover threw a rooster tail of dust over the crew. Dark dust soaks up sunlight, so dusty suits and equipment can overheat.'],
  a17_f1: ['narrator', 'Cernan and Schmitt drove about thirty-six kilometres in this valley, the farthest of any Apollo crew.'],
  a17_arrive_ana: ['ana', 'You made it! My rover’s battery is completely flat. Grab the spare from your rover and bring it to me.'],
  a17_connect: ['ana', 'Line the connector up with the socket, then push it home.'],
  a17_saved: ['ana', 'Power’s back! Thank you. I can drive myself home now.'],
  a17_f2: ['narrator', 'The map fender was worked out overnight on Earth by astronaut John Young and engineers, then read up to the crew by radio.'],
  spirit_silica: ['narrator', 'Look at the trail behind the dead wheel. In 2007 Spirit’s dragging wheel uncovered soil like this: about ninety percent silica. On Earth, deposits like this form around hot springs.'],
  spirit_f0: ['narrator', 'Nearby Home Plate is a layered plateau made by an explosive volcanic eruption, possibly involving water.'],
  spirit_f1: ['narrator', 'Spirit is in the southern hemisphere, so in winter the Sun stays low in the northern sky. A north-facing slope tilts the panels toward it.'],
  spirit_slope: ['control', 'You’re on the slope. The panels are tilted toward the Sun, and power is climbing. Spirit can survive the winter here.'],
  opportunity_f0: ['narrator', 'Opportunity found small round blueberries of the mineral hematite, which on Earth usually forms in water.'],
  opportunity_f1: ['narrator', 'Endeavour Crater is about twenty-two kilometres wide. Opportunity spent its last seven years exploring its rim.'],
  opportunity_f2: ['narrator', 'Opportunity drove about forty-five kilometres in total, a record for driving on another world at the time.'],
  /* ---- what really happened (story, end of each drive) ---- */
  a15_real: ['narrator', 'In reality this rover has not moved since 1971. Over three moonwalks it carried Scott and Irwin about twenty-eight kilometres.'],
  a17_real: ['narrator', 'In reality the map fender lasted for the rest of Apollo 17. The rover is still parked near the landing site.'],
  spirit_real: ['narrator', 'In reality Spirit never escaped Troy. It last spoke to Earth on the twenty-second of March, 2010.'],
  opportunity_real: ['narrator', 'In reality Opportunity never answered again after June 2018. NASA declared its mission complete in February 2019.'],
  ending: ['control', 'Four machines, four lessons. Curiosity, ingenuity, perseverance, and a legacy that every outpost on the Moon and Mars now stands on. Their journeys ended. Our exploration continues.'],
  /* ---- repair bay ---- */
  a15_steer_0: ['narrator', 'The thirty-first of July, 1971: the first drive. Tilt the T-handle left and right, and watch which wheels turn.'],
  a15_steer_1: ['narrator', 'The front and rear steering had separate circuits. Scott tried switching the forward steering off and on again.'],
  a15_steer_2: ['narrator', 'Test it again. Did cycling the switch help?'],
  a15_steer_3: ['narrator', 'Still nothing, so Scott drove the whole first traverse steering with the rear wheels only. The next morning, they powered up again.'],
  a15_steer_done: ['narrator', 'The front steering worked again on the second moonwalk. Nobody ever found out exactly why.'],
  a17_dust_0: ['narrator', 'The eleventh of December, 1972. The fender extension is gone. Spin the wheel and watch where the dust goes. Anything above the red line lands on the crew.'],
  a17_fender_0: ['capcom', 'Gene, Houston. Let’s try some tape on that extension and see if it holds.'],
  a17_fender_tapefail: ['narrator', 'The tape wouldn’t stick to the dusty fender. In 1972 the piece fell off again during the drive.'],
  a17_fender_1: ['capcom', 'Overnight, John Young and the engineers here worked out a better fix. Take four of your laminated maps and lay them out as one sheet.'],
  a17_fender_2: ['capcom', 'Now tape the maps together along both seams. That gives you a stiff replacement fender.'],
  a17_fender_3: ['capcom', 'Carry the sheet to the back of the right-rear fender, where the extension broke off.'],
  a17_fender_4: ['capcom', 'Hold it on with the two clamps from inside the Lunar Module. Tighten them both, and it won’t depend on tape sticking to dust.'],
  a17_fender_5: ['capcom', 'Nice work. Give the wheel a spin and let’s compare the dust.'],
  spirit_wheel_0: ['narrator', 'March 2006. Spirit’s right-front wheel has stopped. Send a drive command and watch the motor current and the wheel.'],
  spirit_wheel_1: ['control', 'The motor gets power, but the wheel won’t turn. Nobody can reach Mars to fix it. So what should the team do?'],
  spirit_wheel_2: ['narrator', 'Exactly what JPL did. Spirit drove backwards, pulling the dead wheel behind it. Drag the wheel through the soil and see what it uncovers.'],
  spirit_wheel_done: ['narrator', 'Bright white soil, almost pure silica. A broken wheel led to one of Spirit’s biggest discoveries.'],
  opp_storm_0: ['narrator', 'May 2018. A dust storm is spreading across Mars. Move through the storm and photograph the Sun three times. The dimmer it looks, the thicker the dust.'],
  opp_energy_0: ['control', 'Power is collapsing. Choose which systems stay on, then run the storm. Every combination ends differently, so experiment.'],
  opp_giveup: ['narrator', 'No combination could save the real Opportunity. Its panels were buried in dust, the cold may have damaged its battery, and more than a thousand wake-up calls went unanswered.'],
};
const VO = (() => {
  const st = { q: [], cur: null, muted: false, tts: true, el: null, btn: null, timer: 0, typeT: 0, audio: null, ac: null, voices: [] };
  try { st.muted = localStorage.getItem('reclaimMute') === '1'; } catch (e) {}
  // which recorded files exist: audio/vo/manifest.json is a JSON array of line ids
  const files = fetch('audio/vo/manifest.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : []).then(a => new Set(Array.isArray(a) ? a : [])).catch(() => new Set());
  if (window.speechSynthesis) { const lv = () => { st.voices = speechSynthesis.getVoices(); }; lv(); speechSynthesis.onvoiceschanged = lv; }
  function init(opt = {}) {
    if (st.el) return;
    const css = document.createElement('style');
    css.textContent = '#voSub{position:fixed;left:50%;transform:translateX(-50%);z-index:12;width:min(760px,calc(100vw - 32px));pointer-events:none;opacity:0;transition:opacity .4s;text-align:left;background:rgba(3,6,11,.82);border:1px solid rgba(70,217,255,.35);border-radius:8px;padding:10px 16px;font:500 1.02rem/1.45 "Chakra Petch","Segoe UI",system-ui,sans-serif;color:#eef6fa;box-shadow:0 0 30px rgba(0,0,0,.5)}' +
      '#voSub .who{font:700 .68rem "Space Mono",ui-monospace,monospace;letter-spacing:.14em;margin-bottom:3px}#voSub .cur{display:inline-block;width:.5em;height:1em;background:currentColor;vertical-align:-2px;margin-left:2px;animation:voB 1s steps(1) infinite}@keyframes voB{50%{opacity:0}}' +
      '#voMute{position:fixed;z-index:13;width:44px;height:44px;border-radius:6px;border:1px solid rgba(70,217,255,.5);background:rgba(4,9,16,.82);color:#dbeaf2;font-size:1.15rem;cursor:pointer}#voMute:hover{background:rgba(70,217,255,.22)}#voMute:focus-visible{outline:2px solid #46d9ff;outline-offset:2px}';
    document.head.appendChild(css);
    st.el = document.createElement('div'); st.el.id = 'voSub'; st.el.setAttribute('aria-live', 'polite'); st.el.style.bottom = (opt.bottom || 130) + 'px'; document.body.appendChild(st.el);
    st.btn = document.createElement('button'); st.btn.id = 'voMute'; st.btn.type = 'button';
    Object.assign(st.btn.style, opt.mute || { left: '14px', bottom: '14px' });
    st.btn.onclick = () => setMuted(!st.muted); document.body.appendChild(st.btn); paint();
  }
  function paint() { if (st.btn) { st.btn.textContent = st.muted ? '🔇' : '🔊'; st.btn.title = st.btn.ariaLabel = st.muted ? 'Voice off (subtitles stay on). Click to turn voice on' : 'Voice on. Click to mute'; } }
  function setMuted(m) { st.muted = m; try { localStorage.setItem('reclaimMute', m ? '1' : '0'); } catch (e) {} paint(); if (m) stopSound(); }
  function stopSound() { if (st.audio) { st.audio.pause(); st.audio = null; } if (window.speechSynthesis) speechSynthesis.cancel(); }
  function pickVoice(sp) { const en = st.voices.filter(v => /^en/i.test(v.lang)); return en.find(v => sp.prefer.test(v.name)) || en[0] || null; }
  function radioChain(a) {   // Apollo-era CAPCOM: band-limited "radio" sound
    try { if (!st.ac) st.ac = new (window.AudioContext || window.webkitAudioContext)(); const s = st.ac.createMediaElementSource(a), hp = st.ac.createBiquadFilter(), lp = st.ac.createBiquadFilter();
      hp.type = 'highpass'; hp.frequency.value = 420; lp.type = 'lowpass'; lp.frequency.value = 3000; s.connect(hp); hp.connect(lp); lp.connect(st.ac.destination); if (st.ac.state === 'suspended') st.ac.resume(); } catch (e) {}
  }
  function play(line) {
    return files.then(have => new Promise(done => {
      if (st.muted) return done(false);
      const a = new Audio(have.has(line.id) ? 'audio/vo/' + line.id + '.mp3' : 'data:,'); st.audio = a; let ended = false; const fin = ok => { if (!ended) { ended = true; done(ok); } };
      a.onended = () => fin(true);
      a.onerror = () => { if (st.audio !== a) return fin(false); st.audio = null; if (!st.tts || !window.speechSynthesis || st.muted) return fin(false);
        const sp = VO_SPEAKERS[line.who] || VO_SPEAKERS.control, u = new SpeechSynthesisUtterance(line.text), v = pickVoice(sp);
        if (v) u.voice = v; u.pitch = sp.pitch; u.rate = sp.rate; u.onend = u.onerror = () => fin(true); speechSynthesis.cancel(); speechSynthesis.speak(u); };
      if ((VO_SPEAKERS[line.who] || {}).radio) radioChain(a);
      if (!have.has(line.id)) return a.onerror();   // no recording yet: go straight to the fallback voice
      a.play().catch(() => {});
    }));
  }
  function type(line) {
    const sp = VO_SPEAKERS[line.who] || VO_SPEAKERS.control; let i = 0; clearInterval(st.typeT);
    st.el.innerHTML = '<div class="who" style="color:' + sp.color + '">' + sp.label + '</div><span class="tx"></span><span class="cur" style="color:' + sp.color + '"></span>';
    st.el.style.borderColor = sp.color + '66'; st.el.style.opacity = 1; const tx = st.el.querySelector('.tx');
    st.typeT = setInterval(() => { i = Math.min(line.text.length, i + 2); tx.textContent = line.text.slice(0, i); if (i >= line.text.length) { clearInterval(st.typeT); const c = st.el.querySelector('.cur'); if (c) c.remove(); } }, 32);
  }
  async function next() {
    if (st.cur || !st.q.length) return;
    const line = st.cur = st.q.shift(); clearTimeout(st.timer); type(line);
    const t0 = performance.now(), minMs = Math.max(2600, line.text.length * 52), spoke = await play(line);
    const left = Math.max(spoke ? 900 : 0, minMs - (performance.now() - t0));
    if (st.cur !== line) return;
    st.timer = setTimeout(() => { if (st.cur !== line) return; st.cur = null; if (!st.q.length) st.el.style.opacity = 0; line.res && line.res(); next(); }, left);
  }
  /* say('a15_arrive') or say({ who:'control', text:'…' }). Returns a promise that resolves when the line has finished. */
  function say(x, opt = {}) {
    init(); const base = typeof x === 'string' ? VO_LINES[x] : null;
    const line = base ? { id: x, who: base[0], text: base[1] } : Object.assign({ id: '_' }, x);
    if (!line.text) return Promise.resolve();
    if (opt.now) clear();
    return new Promise(res => { line.res = res; st.q.push(line); next(); });
  }
  function clear() { st.q.forEach(l => l.res && l.res()); st.q = []; if (st.cur && st.cur.res) st.cur.res(); st.cur = null; clearTimeout(st.timer); clearInterval(st.typeT); stopSound(); if (st.el) st.el.style.opacity = 0; }
  return { init, say, clear, setMuted, get muted() { return st.muted; }, set tts(v) { st.tts = v; } };
})();
