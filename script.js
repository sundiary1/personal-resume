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
  let pressedCard = null;
  let rafId = null;

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
      const scale = (1 - Math.min(distance / edge, 1) * 0.2) * (1 + 0.1 * Math.max(0, 1 - distance / boostRange));
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

  gallery.addEventListener("pointerdown", (event) => {
    isDragging = true;
    moved = false;
    pressedCard = event.target.closest(".circular-card");
    startX = event.clientX;
    startTarget = scroll.target;
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
    isDragging = false;
    gallery.releasePointerCapture?.(event.pointerId);
    if (moved) {
      suppressClickUntil = performance.now() + 300;
    } else if (pressedCard) {
      suppressClickUntil = performance.now() + 300;
      openViewer(pressedCard);
    }
    pressedCard = null;
    moved = false;
    snapToNearest();
  });

  gallery.addEventListener("pointercancel", () => {
    isDragging = false;
    moved = false;
    pressedCard = null;
  });

  gallery.addEventListener("click", (event) => {
    if (performance.now() > suppressClickUntil) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickUntil = 0;
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
