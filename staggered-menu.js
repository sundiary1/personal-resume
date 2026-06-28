/* ───── StaggeredMenu — Vanilla JS + GSAP ───── */
(function () {
  const wrapper = document.querySelector('.sm-wrapper');
  const toggleBtn = document.querySelector('.sm-toggle');
  const panel = document.querySelector('.sm-panel');
  const prelayers = document.querySelector('.sm-prelayers');
  const prelayerEls = Array.from(document.querySelectorAll('.sm-prelayer'));
  const iconH = document.querySelector('.sm-icon-line-h');
  const iconV = document.querySelector('.sm-icon-line-v');
  const icon = document.querySelector('.sm-icon');
  const textInner = document.querySelector('.sm-toggle-textInner');

  if (!wrapper || !toggleBtn || !panel) return;

  let isOpen = false;
  let busy = false;

  /* ───── Init ───── */
  gsap.set([panel, ...prelayerEls], { xPercent: -100, opacity: 1 });
  if (prelayers) gsap.set(prelayers, { xPercent: 0, opacity: 1 });
  gsap.set(iconH, { rotate: 0 });
  gsap.set(iconV, { rotate: 90 });
  gsap.set(icon, { rotate: 0 });
  gsap.set(textInner, { yPercent: 0 });

  const itemLabels = Array.from(panel.querySelectorAll('.sm-panel-itemLabel'));
  const numberItems = Array.from(panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item'));
  const socialTitle = panel.querySelector('.sm-socials-title');
  const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link'));

  /* ───── Open Timeline ───── */
  function buildOpenTimeline() {
    if (itemLabels.length) gsap.set(itemLabels, { yPercent: 140, rotate: 10 });
    if (numberItems.length) gsap.set(numberItems, { '--sm-num-opacity': 0 });
    if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
    if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    prelayerEls.forEach((el, i) => {
      tl.fromTo(el, { xPercent: -100 }, { xPercent: 0, duration: 0.5, ease: 'power4.out' }, i * 0.07);
    });

    const lastTime = prelayerEls.length ? (prelayerEls.length - 1) * 0.07 : 0;
    const panelInsert = lastTime + (prelayerEls.length ? 0.08 : 0);
    tl.fromTo(panel, { xPercent: -100 }, { xPercent: 0, duration: 0.65, ease: 'power4.out' }, panelInsert);

    if (itemLabels.length) {
      const itemsStart = panelInsert + 0.65 * 0.15;
      tl.to(itemLabels, { yPercent: 0, rotate: 0, duration: 1, ease: 'power4.out', stagger: { each: 0.1 } }, itemsStart);
      if (numberItems.length) {
        tl.to(numberItems, { '--sm-num-opacity': 1, duration: 0.6, ease: 'power2.out', stagger: { each: 0.08 } }, itemsStart + 0.1);
      }
    }

    if (socialTitle || socialLinks.length) {
      const socialsStart = panelInsert + 0.65 * 0.4;
      if (socialTitle) tl.to(socialTitle, { opacity: 1, duration: 0.5, ease: 'power2.out' }, socialsStart);
      if (socialLinks.length) {
        tl.to(socialLinks, { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out', stagger: { each: 0.08 } }, socialsStart + 0.04);
      }
    }

    return tl;
  }

  let openTl = null;

  function playOpen() {
    if (busy) return;
    busy = true;
    openTl = buildOpenTimeline();
    openTl.eventCallback('onComplete', () => { busy = false; });
    openTl.play(0);
  }

  function playClose() {
    openTl?.kill();
    openTl = null;

    const all = [...prelayerEls, panel];
    gsap.to(all, {
      xPercent: -100,
      duration: 0.32,
      ease: 'power3.in',
      overwrite: 'auto',
      onComplete: () => {
        if (itemLabels.length) gsap.set(itemLabels, { yPercent: 140, rotate: 10 });
        if (numberItems.length) gsap.set(numberItems, { '--sm-num-opacity': 0 });
        if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
        if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });
        busy = false;
      }
    });
  }

  /* ───── Icon & Text Animation ───── */
  function animateIcon(opening) {
    if (!icon) return;
    if (opening) {
      gsap.to(icon, { rotate: 225, duration: 0.8, ease: 'power4.out', overwrite: 'auto' });
    } else {
      gsap.to(icon, { rotate: 0, duration: 0.35, ease: 'power3.inOut', overwrite: 'auto' });
    }
  }

  function animateText(opening) {
    if (!textInner) return;
    const target = opening ? 100 : 0;
    gsap.to(textInner, { yPercent: -target, duration: 0.45, ease: 'power3.out' });
  }

  /* ───── Toggle ───── */
  function openMenu() {
    if (isOpen) return;
    isOpen = true;
    toggleBtn.setAttribute('aria-expanded', 'true');
    toggleBtn.setAttribute('aria-label', 'Close menu');
    panel.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    playOpen();
    animateIcon(true);
    animateText(true);
  }

  function closeMenu() {
    if (!isOpen) return;
    isOpen = false;
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.setAttribute('aria-label', 'Open menu');
    panel.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    playClose();
    animateIcon(false);
    animateText(false);
  }

  toggleBtn.addEventListener('click', () => {
    if (isOpen) closeMenu();
    else openMenu();
  });

  /* ───── Close on click outside ───── */
  document.addEventListener('mousedown', (e) => {
    if (!isOpen) return;
    if (!panel.contains(e.target) && !toggleBtn.contains(e.target)) {
      closeMenu();
    }
  });

  /* ───── Close on Escape ───── */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closeMenu();
  });

  /* ───── Close on nav link click ───── */
  panel.querySelectorAll('.sm-panel-item').forEach((link) => {
    link.addEventListener('click', () => closeMenu());
  });
})();
