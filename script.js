const revealTargets = document.querySelectorAll("[data-reveal]");

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

document.querySelectorAll("[data-split]").forEach((element) => {
  const text = element.textContent;
  element.textContent = "";

  [...text].forEach((char, index) => {
    const span = document.createElement("span");
    span.className = "char";
    span.style.animationDelay = `${index * 22}ms`;
    span.textContent = char === "\n" ? " " : char;
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

document.querySelectorAll(".work-image").forEach((button) => {
  button.addEventListener("click", () => openViewer(button));
});

closeButton.addEventListener("click", closeViewer);

viewer.addEventListener("click", (event) => {
  if (event.target === viewer) closeViewer();
});

viewer.addEventListener("close", () => {
  document.body.classList.remove("viewer-open");
});
