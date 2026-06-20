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

/* ───── 椭圆无限轮播 ───── */
(function showcaseCarousel() {
  const track = document.querySelector(".showcase-track");
  if (!track) return;

  const cards = Array.from(track.querySelectorAll(".showcase-card"));
  const prevBtn = document.querySelector(".showcase-prev");
  const nextBtn = document.querySelector(".showcase-next");
  if (!cards.length) return;

  const TOTAL = cards.length;
  const VISIBLE = 5; // slots: -2, -1, 0 (center), +1, +2
  const HALF = Math.floor(VISIBLE / 2); // 2

  // position indices: which card goes into which slot
  let slots = Array.from({ length: TOTAL }, (_, i) => i);

  function render() {
    cards.forEach((card, i) => {
      const slotIdx = slots.indexOf(i);
      const offset = slotIdx - HALF; // -2..0..+2
      const dir = Math.sign(offset) || 1;
      const count = Math.abs(offset);

      if (offset === 0) {
        card.style.transform = "translateX(-50%)";
      } else {
        card.style.transform = `translateX(calc(-50% + ${dir} * (var(--card-size) + var(--card-gap)) * ${count}))`;
      }

      const visible = Math.abs(offset) <= HALF;
      card.style.opacity = visible ? "1" : "0";
      card.style.pointerEvents = visible ? "auto" : "none";
      card.setAttribute("tabindex", visible ? "0" : "-1");
    });
  }

  function next() {
    // card wraps from visible-left to hidden-right — disable transition
    const wrapCard = cards[slots[0]];
    wrapCard.style.transition = "none";
    slots.push(slots.shift());
    render();
    wrapCard.offsetHeight;
    wrapCard.style.transition = "";
  }

  function prev() {
    // card wraps from hidden-right to visible-left — disable transition
    const wrapCard = cards[slots[slots.length - 1]];
    wrapCard.style.transition = "none";
    slots.unshift(slots.pop());
    render();
    wrapCard.offsetHeight;
    wrapCard.style.transition = "";
  }

  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);

  render();
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
