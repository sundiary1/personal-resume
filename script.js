const revealTargets = document.querySelectorAll("[data-reveal]");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  revealTargets.forEach((target) => revealObserver.observe(target));
} else {
  revealTargets.forEach((target) => target.classList.add("is-visible"));
}

const sectionBands = Array.from(document.querySelectorAll("[data-section]"));

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-section-visible");
        }
      });
    },
    { rootMargin: "-12% 0px -18% 0px", threshold: 0.08 }
  );

  sectionBands.forEach((section) => sectionObserver.observe(section));
} else {
  sectionBands.forEach((section) => section.classList.add("is-section-visible"));
}

(function sectionParallax() {
  if (!sectionBands.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let ticking = false;

  function update() {
    sectionBands.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const viewportMiddle = window.innerHeight / 2;
      const sectionMiddle = rect.top + rect.height / 2;
      const distance = (sectionMiddle - viewportMiddle) / Math.max(window.innerHeight, 1);
      const shift = Math.max(-18, Math.min(18, distance * -22));
      section.style.setProperty("--section-shift", `${shift.toFixed(2)}px`);
    });
    ticking = false;
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  update();
})();

document.querySelectorAll("[data-split]").forEach((element) => {
  const text = element.textContent.replace(/\n\s*/g, "\n").trim();
  element.textContent = "";

  [...text].forEach((char, index) => {
    if (char === "\n") {
      element.appendChild(document.createElement("br"));
      return;
    }

    const span = document.createElement("span");
    span.className = "char";
    span.style.animationDelay = `${index * 22}ms`;
    span.textContent = char;
    element.appendChild(span);
  });
});

/* ----- FallingText hero ----- */
(function fallingTextHero() {
  const container = document.querySelector("[data-falling-text]");
  const target = container?.querySelector(".falling-text-target");
  const canvasContainer = container?.querySelector(".falling-text-canvas");
  const resetButton = document.querySelector("[data-reset-falling-text]");

  if (!container || !target || !canvasContainer || !resetButton) return;

  const originalHTML = target.innerHTML;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let cleanup = null;

  function resetText() {
    cleanup?.();
    cleanup = null;
    container.classList.remove("is-falling");
    canvasContainer.replaceChildren();
    target.innerHTML = originalHTML;
    target.removeAttribute("aria-hidden");
    target.querySelectorAll(".word").forEach((word) => {
      word.removeAttribute("style");
    });
  }

  function startFalling() {
    if (cleanup || prefersReducedMotion || !window.Matter) return;

    const { Engine, Render, World, Bodies, Runner, Mouse, MouseConstraint, Body } = window.Matter;
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    if (width <= 0 || height <= 0) return;

    container.classList.add("is-falling");

    const engine = Engine.create();
    engine.world.gravity.y = 1.2;

    const render = Render.create({
      element: canvasContainer,
      engine,
      options: {
        width,
        height,
        background: "transparent",
        wireframes: false,
      },
    });

    render.canvas.style.width = "100%";
    render.canvas.style.height = "100%";

    const boundaryOptions = {
      isStatic: true,
      render: { fillStyle: "transparent" },
    };
    const floor = Bodies.rectangle(width / 2, height + 26, width, 52, boundaryOptions);
    const leftWall = Bodies.rectangle(-26, height / 2, 52, height, boundaryOptions);
    const rightWall = Bodies.rectangle(width + 26, height / 2, 52, height, boundaryOptions);
    const ceiling = Bodies.rectangle(width / 2, -26, width, 52, boundaryOptions);

    const wordBodies = Array.from(target.querySelectorAll(".word")).map((word) => {
      const wordRect = word.getBoundingClientRect();
      const x = wordRect.left - rect.left + wordRect.width / 2;
      const y = wordRect.top - rect.top + wordRect.height / 2;
      const body = Bodies.rectangle(x, y, wordRect.width, wordRect.height, {
        restitution: 0.72,
        frictionAir: 0.012,
        friction: 0.22,
        render: { fillStyle: "transparent" },
      });

      Body.setVelocity(body, {
        x: (Math.random() - 0.5) * 5,
        y: -Math.random() * 2,
      });
      Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.08);

      word.style.position = "absolute";
      word.style.left = `${x}px`;
      word.style.top = `${y}px`;
      word.style.margin = "0";
      word.style.transform = "translate(-50%, -50%)";

      return { word, body };
    });

    const mouse = Mouse.create(container);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: 1.35,
        render: { visible: false },
      },
    });
    render.mouse = mouse;

    World.add(engine.world, [
      floor,
      leftWall,
      rightWall,
      ceiling,
      mouseConstraint,
      ...wordBodies.map(({ body }) => body),
    ]);

    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);

    let animationId = null;
    function updateWords() {
      wordBodies.forEach(({ word, body }) => {
        word.style.left = `${body.position.x}px`;
        word.style.top = `${body.position.y}px`;
        word.style.transform = `translate(-50%, -50%) rotate(${body.angle}rad)`;
      });
      animationId = requestAnimationFrame(updateWords);
    }
    updateWords();

    cleanup = () => {
      if (animationId) cancelAnimationFrame(animationId);
      Render.stop(render);
      Runner.stop(runner);
      render.canvas?.remove();
      World.clear(engine.world, false);
      Engine.clear(engine);
    };
  }

  container.addEventListener("click", startFalling);
  container.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      startFalling();
    }
  });
  resetButton.addEventListener("click", resetText);
  window.addEventListener("resize", () => {
    if (cleanup) resetText();
  });
})();

/* ----- CardNav ----- */
(function cardNav() {
  const container = document.querySelector(".card-nav-container");
  const nav = document.querySelector(".card-nav");
  const menuButton = document.querySelector(".hamburger-menu");
  const content = document.querySelector(".card-nav-content");
  const cards = Array.from(document.querySelectorAll(".nav-card"));
  const links = Array.from(document.querySelectorAll(".nav-card-link"));

  if (!container || !nav || !menuButton || !content) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasMousePointer = window.matchMedia("(pointer: fine)").matches;
  let isExpanded = false;
  let isPointerNearNav = true;
  let hideTimer = null;
  let timeline = null;

  function updateNavVisibility() {
    const shouldHide = hasMousePointer && !isExpanded && !isPointerNearNav && !container.matches(":focus-within");
    container.classList.toggle("is-hidden", shouldHide);
  }

  function scheduleInitialHide() {
    if (!hasMousePointer) return;
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => {
      isPointerNearNav = false;
      updateNavVisibility();
    }, 1800);
  }

  function calculateHeight() {
    const isMobile = window.matchMedia("(max-width: 780px)").matches;
    if (!isMobile) return 260;

    const previous = {
      visibility: content.style.visibility,
      pointerEvents: content.style.pointerEvents,
      position: content.style.position,
      height: content.style.height,
    };

    content.style.visibility = "visible";
    content.style.pointerEvents = "auto";
    content.style.position = "static";
    content.style.height = "auto";

    const topBar = 60;
    const padding = 16;
    const contentHeight = content.scrollHeight;

    content.style.visibility = previous.visibility;
    content.style.pointerEvents = previous.pointerEvents;
    content.style.position = previous.position;
    content.style.height = previous.height;

    return topBar + contentHeight + padding;
  }

  function setExpandedState(expanded) {
    isExpanded = expanded;
    nav.classList.toggle("open", expanded);
    menuButton.classList.toggle("open", expanded);
    menuButton.setAttribute("aria-expanded", String(expanded));
    menuButton.setAttribute("aria-label", expanded ? "关闭菜单" : "打开菜单");
    content.setAttribute("aria-hidden", String(!expanded));
    links.forEach((link) => {
      link.tabIndex = expanded ? 0 : -1;
    });
    updateNavVisibility();
  }

  function createTimeline() {
    if (!window.gsap || prefersReducedMotion) return null;

    window.gsap.set(nav, { height: 60, overflow: "hidden" });
    window.gsap.set(cards, { y: 50, opacity: 0 });

    const nextTimeline = window.gsap.timeline({ paused: true });
    nextTimeline.to(nav, {
      height: calculateHeight,
      duration: 0.4,
      ease: "power3.out",
    });
    nextTimeline.to(
      cards,
      {
        y: 0,
        opacity: 1,
        duration: 0.4,
        ease: "power3.out",
        stagger: 0.08,
      },
      "-=0.1"
    );

    return nextTimeline;
  }

  function rebuildTimeline() {
    timeline?.kill();
    timeline = createTimeline();
    if (isExpanded) {
      if (timeline) {
        timeline.progress(1);
      } else {
        nav.style.height = `${calculateHeight()}px`;
      }
    }
  }

  function openMenu() {
    setExpandedState(true);
    if (timeline) {
      timeline.play(0);
    } else {
      nav.style.height = `${calculateHeight()}px`;
      cards.forEach((card) => {
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
      });
    }
  }

  function closeMenu() {
    menuButton.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "打开菜单");

    if (timeline) {
      timeline.eventCallback("onReverseComplete", () => {
        setExpandedState(false);
      });
      timeline.reverse();
      return;
    }

    nav.style.height = "60px";
    setExpandedState(false);
  }

  function toggleMenu() {
    if (isExpanded) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  menuButton.addEventListener("click", toggleMenu);
  menuButton.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleMenu();
    }
  });

  links.forEach((link) => {
    link.addEventListener("click", () => closeMenu());
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isExpanded) closeMenu();
  });

  document.addEventListener("mousemove", (event) => {
    if (!hasMousePointer) return;
    isPointerNearNav = event.clientY <= 132 || container.matches(":hover");
    updateNavVisibility();
  });

  container.addEventListener("mouseenter", () => {
    isPointerNearNav = true;
    updateNavVisibility();
  });

  container.addEventListener("mouseleave", (event) => {
    if (!hasMousePointer) return;
    isPointerNearNav = event.clientY <= 132;
    updateNavVisibility();
  });

  container.addEventListener("focusin", () => {
    isPointerNearNav = true;
    updateNavVisibility();
  });

  container.addEventListener("focusout", () => {
    window.setTimeout(updateNavVisibility, 0);
  });

  window.addEventListener("resize", rebuildTimeline);

  setExpandedState(false);
  timeline = createTimeline();
  scheduleInitialHide();
})();

const viewer = document.querySelector(".viewer");
const viewerImage = document.querySelector("#viewerImage");
const viewerTitle = document.querySelector("#viewerTitle");
const closeButton = document.querySelector(".viewer-close");

function openViewer(button) {
  const src = button.dataset.full;
  const title = button.dataset.title || "完整长图";

  viewerImage.src = src;
  viewerImage.alt = `${title} 完整长图`;
  viewerTitle.textContent = title;
  document.body.classList.add("viewer-open");
  viewer.showModal();
}

function closeViewer() {
  viewer.close();
  document.body.classList.remove("viewer-open");
  viewerImage.removeAttribute("src");
}

document.querySelectorAll("[data-full]").forEach((button) => {
  button.addEventListener("click", () => openViewer(button));
});

closeButton.addEventListener("click", closeViewer);

viewer.addEventListener("click", (event) => {
  if (event.target === viewer) closeViewer();
});

viewer.addEventListener("close", () => {
  document.body.classList.remove("viewer-open");
});

/* ───── 光标光晕 ───── */
(function cursorGlow() {
  const glow = document.createElement("div");
  glow.className = "cursor-glow";
  glow.setAttribute("aria-hidden", "true");
  document.body.prepend(glow);

  const SIZE = 920;
  const HALF = SIZE / 2;
  const EASING = 0.07;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let glowX = mouseX;
  let glowY = mouseY;

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!glow.classList.contains("is-active")) {
      glow.classList.add("is-active");
    }
  });

  document.addEventListener("mouseleave", () => {
    glow.classList.remove("is-active");
  });

  function animate() {
    const dx = mouseX - glowX;
    const dy = mouseY - glowY;

    // 越远越快，越近越慢 —— 营造"惯性跟随"手感
    glowX += dx * (EASING + Math.abs(dx) * 0.00008);
    glowY += dy * (EASING + Math.abs(dy) * 0.00008);

    glow.style.transform = `translate(${glowX - HALF}px, ${glowY - HALF}px)`;

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
})();

/* ───── 轮播切换 ───── */
(function carousel() {
  const wrap = document.querySelector(".carousel-wrap");
  if (!wrap) return;

  const slides = Array.from(wrap.querySelectorAll(".carousel-slide"));
  const prevBtn = wrap.querySelector(".carousel-prev");
  const nextBtn = wrap.querySelector(".carousel-next");

  if (!slides.length) return;

  let current = slides.findIndex((s) => s.classList.contains("is-active"));
  if (current < 0) current = 0;

  function goTo(index) {
    slides[current].classList.remove("is-active");
    current = (index + slides.length) % slides.length;
    slides[current].classList.add("is-active");
  }

  prevBtn.addEventListener("click", () => goTo(current - 1));
  nextBtn.addEventListener("click", () => goTo(current + 1));
})();

/* ───── 弧形画廊 ───── */
(function circularGallery() {
  const gallery = document.querySelector(".circular-gallery");
  if (!gallery) return;

  const cards = Array.from(gallery.querySelectorAll(".circular-card"));
  if (!cards.length) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scroll = { current: 0, target: 0, last: 0 };
  let spacing = 280;
  let totalWidth = spacing * cards.length;
  let isDragging = false;
  let startX = 0;
  let startTarget = 0;
  let moved = false;
  let suppressClickUntil = 0;
  let pendingClickCard = null;
  let rafId = null;
  let isPointerInside = false;
  let isKeyboardFocusInside = false;
  let lastFrameTime = performance.now();

  const AUTO_ROTATE_SECONDS_PER_CARD = 4.6;

  function wrapDelta(value) {
    return ((value + totalWidth / 2) % totalWidth + totalWidth) % totalWidth - totalWidth / 2;
  }

  function measure() {
    const styles = getComputedStyle(gallery);
    const cardSize = parseFloat(styles.getPropertyValue("--gallery-card")) || cards[0].getBoundingClientRect().width;
    const gap = parseFloat(styles.getPropertyValue("--gallery-gap")) || 28;
    spacing = cardSize + gap;
    totalWidth = spacing * cards.length;
  }

  function render() {
    const rect = gallery.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height * 0.48;
    const edge = rect.width / 2 + spacing;
    const boostRange = spacing * 1.5;

    cards.forEach((card, index) => {
      const delta = wrapDelta(index * spacing - scroll.current);
      const normalized = Math.max(-1, Math.min(1, delta / Math.max(rect.width * 0.42, spacing)));
      const distance = Math.abs(delta);
      const arc = Math.pow(Math.abs(normalized), 2) * rect.height * 0.22;
      const rotate = -normalized * 18;
      const scale = (1 - Math.min(distance / edge, 1) * 0.2) * (1 + 0.3 * Math.max(0, 1 - distance / boostRange));
      const visible = distance < edge;

      card.style.transform = `translate(${centerX + delta - card.offsetWidth / 2}px, ${centerY + arc - card.offsetHeight / 2}px) rotate(${rotate}deg) scale(${scale})`;
      card.style.opacity = visible ? String(1 - Math.min(distance / edge, 0.82)) : "0";
      card.style.zIndex = String(100 - Math.round(distance));
      card.style.filter = "";
      card.style.boxShadow = "";
      card.style.pointerEvents = visible ? "auto" : "none";
      card.setAttribute("tabindex", visible ? "0" : "-1");
    });
  }

  function tick() {
    const now = performance.now();
    const deltaSeconds = Math.min((now - lastFrameTime) / 1000, 0.08);
    lastFrameTime = now;

    if (shouldAutoRotate()) {
      scroll.target += (spacing / AUTO_ROTATE_SECONDS_PER_CARD) * deltaSeconds;
    }

    const ease = prefersReducedMotion ? 1 : 0.075;
    scroll.current += (scroll.target - scroll.current) * ease;

    if (Math.abs(scroll.target - scroll.current) < 0.02) {
      scroll.current = scroll.target;
    }

    render();
    scroll.last = scroll.current;
    rafId = requestAnimationFrame(tick);
  }

  function snapToNearest() {
    scroll.target = Math.round(scroll.target / spacing) * spacing;
  }

  function settleAtNearest() {
    snapToNearest();
    if (prefersReducedMotion) {
      scroll.current = scroll.target;
      render();
    }
  }

  function shouldAutoRotate() {
    return (
      !prefersReducedMotion &&
      !isDragging &&
      !isPointerInside &&
      !isKeyboardFocusInside &&
      !document.body.classList.contains("viewer-open") &&
      document.visibilityState === "visible"
    );
  }

  gallery.addEventListener("pointerdown", (event) => {
    isDragging = true;
    moved = false;
    pendingClickCard = event.target.closest(".circular-card");
    startX = event.clientX;
    startTarget = scroll.target;
    scroll.current = scroll.target;
    gallery.setPointerCapture?.(event.pointerId);
  });

  gallery.addEventListener("pointermove", (event) => {
    if (!isDragging) return;
    const delta = event.clientX - startX;
    if (Math.abs(delta) > 6) moved = true;
    scroll.target = startTarget - delta * 1.15;
  });

  gallery.addEventListener("pointerup", (event) => {
    if (!isDragging) return;
    const wasDragged = moved;
    isDragging = false;
    gallery.releasePointerCapture?.(event.pointerId);
    if (wasDragged) {
      suppressClickUntil = performance.now() + 300;
      settleAtNearest();
    } else if (pendingClickCard) {
      suppressClickUntil = performance.now() + 300;
      openViewer(pendingClickCard);
      pendingClickCard = null;
    }
    moved = false;
  });

  gallery.addEventListener("pointercancel", () => {
    isDragging = false;
    moved = false;
    pendingClickCard = null;
    settleAtNearest();
  });

  gallery.addEventListener("pointerenter", () => {
    isPointerInside = true;
    settleAtNearest();
  });

  gallery.addEventListener("pointerleave", () => {
    isPointerInside = false;
  });

  gallery.addEventListener("focusin", () => {
    isKeyboardFocusInside = true;
    settleAtNearest();
  });

  gallery.addEventListener("focusout", () => {
    isKeyboardFocusInside = gallery.contains(document.activeElement);
  });

  gallery.addEventListener("click", (event) => {
    const card = event.target.closest(".circular-card") || pendingClickCard;

    if (performance.now() <= suppressClickUntil) {
      event.preventDefault();
      event.stopPropagation();
      pendingClickCard = null;
      suppressClickUntil = 0;
      return;
    }

    if (!card) return;

    event.preventDefault();
    event.stopPropagation();
    pendingClickCard = null;
    openViewer(card);
  }, true);

  gallery.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      scroll.target += spacing;
      snapToNearest();
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      scroll.target -= spacing;
      snapToNearest();
    }

    if (event.key === "Home") {
      event.preventDefault();
      scroll.target = 0;
    }
  });

  window.addEventListener("resize", () => {
    measure();
    snapToNearest();
    render();
  });

  measure();
  render();
  tick();
})();

/* ───── 卡片 3D 倾斜 ───── */
(function cardTilt() {
  if (window.matchMedia("(pointer: coarse)").matches) return;

  const cards = document.querySelectorAll(".workflow-visual, .work-image:not(.carousel-slide)");
  const MAX_TILT = 12;

  cards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const halfW = rect.width / 2;
      const halfH = rect.height / 2;

      const rotateY = ((x - halfW) / halfW) * MAX_TILT;
      const rotateX = ((halfH - y) / halfH) * MAX_TILT;

      card.style.transform = `perspective(500px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.03, 1.03, 1.03)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(500px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    });
  });
})();

/* ───── Planning Carousel ───── */
(function planningCarousel() {
  const carousel = document.querySelector('.planning-carousel');
  if (!carousel) return;
  const track = carousel.querySelector('.planning-track');
  const items = Array.from(track.querySelectorAll('.planning-item'));
  if (items.length < 4) return;

  const VISIBLE = 3;
  const INTERVAL = 5000;
  const totalPages = Math.ceil(items.length / VISIBLE);
  let currentPage = 0;
  let autoTimer = null;
  let isPaused = false;

  function getSlideWidth() {
    const first = items[0];
    return first.offsetWidth + parseFloat(getComputedStyle(first).marginRight || 0);
  }

  function goToPage(page) {
    currentPage = ((page % totalPages) + totalPages) % totalPages;
    track.style.transform = `translateX(-${currentPage * getSlideWidth() * VISIBLE}px)`;
  }

  function nextPage() {
    goToPage(currentPage + 1);
  }

  function startAuto() {
    stopAuto();
    autoTimer = setInterval(nextPage, INTERVAL);
  }

  function stopAuto() {
    clearInterval(autoTimer);
    autoTimer = null;
  }

  // Arrow buttons
  const prevBtn = carousel.querySelector('.planning-prev');
  const nextBtn = carousel.querySelector('.planning-next');
  if (prevBtn) prevBtn.addEventListener('click', () => goToPage(currentPage - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goToPage(currentPage + 1));

  // Pause on hover
  carousel.addEventListener('mouseenter', () => { isPaused = true; stopAuto(); });
  carousel.addEventListener('mouseleave', () => { isPaused = false; startAuto(); });

  // Recalculate on resize
  window.addEventListener('resize', () => {
    goToPage(currentPage);
  });

  startAuto();
})();

