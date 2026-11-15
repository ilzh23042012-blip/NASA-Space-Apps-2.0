/* Shared animation helpers built on GSAP (loaded from cdnjs before this file).
   If GSAP fails to load, or the player asked for reduced motion, every helper does nothing
   (or jumps straight to the end), so the game always keeps working without it. */
const ANIM = (() => {
  const reduce = () => { try { if (localStorage.getItem('ltMotion') === '1') return true; } catch (e) {} return matchMedia('(prefers-reduced-motion: reduce)').matches; };
  const on = () => !!window.gsap && !reduce();
  if (window.gsap) gsap.ticker.lagSmoothing(500, 33);   // a frozen tab resumes smoothly instead of jumping
  const lin = t => t, cache = {};
  /* an easing curve for loops that compute their own progress (0..1), e.g. a rocket flight or landing */
  const ease = name => { if (!window.gsap) return lin; return cache[name] || (cache[name] = gsap.parseEase(name) || lin); };
  /* a card or panel arriving: it rises and sharpens, then its contents follow one after another */
  function card(el, sel = 'h1,h2,h3,p,li,.tag,.row,ol,dl') {
    if (!el || !on()) return; gsap.killTweensOf(el);
    gsap.fromTo(el, { opacity: 0, y: 24, scale: .975 }, { opacity: 1, y: 0, scale: 1, duration: .5, ease: 'power3.out', clearProps: 'opacity,transform' });
    const kids = el.querySelectorAll(sel); if (!kids.length) return; gsap.killTweensOf(kids);
    gsap.fromTo(kids, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .38, ease: 'power2.out', stagger: .035, delay: .1, clearProps: 'opacity,transform' });
  }
  /* a list of items sliding in one after another */
  function stagger(els, from = { opacity: 0, x: -14 }, delay = 0) {
    if (!els || !els.length || !on()) return; gsap.killTweensOf(els);
    gsap.fromTo(els, from, { opacity: 1, x: 0, y: 0, scale: 1, duration: .45, ease: 'power3.out', stagger: .05, delay, clearProps: 'opacity,transform' });
  }
  /* a short "pop" for a message or a success */
  function pop(el, k = 1.08) { if (!el || !on()) return; gsap.fromTo(el, { scale: k }, { scale: 1, duration: .5, ease: 'back.out(3)', clearProps: 'transform' }); }
  /* a small shake for a mistake */
  function shake(el) { if (!el || !on()) return; gsap.fromTo(el, { x: -6 }, { x: 0, duration: .45, ease: 'elastic.out(1.2,.25)', clearProps: 'transform' }); }
  /* tween any object's numbers (camera positions, scales…). Returns a promise. Without GSAP it jumps to the end. */
  function to(obj, vars) {
    return new Promise(res => {
      const { onComplete } = vars;
      if (!on()) { for (const k in vars) if (typeof vars[k] === 'number' && k in obj && !['duration', 'delay'].includes(k)) obj[k] = vars[k]; if (vars.onUpdate) vars.onUpdate(); if (onComplete) onComplete(); return res(); }
      gsap.to(obj, Object.assign({}, vars, { onComplete() { if (onComplete) onComplete(); res(); } }));
    });
  }
  function kill(obj) { if (window.gsap) gsap.killTweensOf(obj); }
  return { get on() { return on(); }, ease, card, stagger, pop, shake, to, kill };
})();
