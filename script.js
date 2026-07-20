const nameField = document.querySelector(".name-field");
const nameLetters = Array.from(document.querySelectorAll(".letter"));
const cursor = document.querySelector(".cursor-dot");
const workCards = Array.from(document.querySelectorAll(".work-card"));
const modal = document.querySelector(".work-modal");
const modalTitle = document.querySelector("#modal-title");
const modalClose = document.querySelector(".modal-close");
const carouselTrack = document.querySelector(".carousel-track");
const carouselViewport = document.querySelector(".carousel-viewport");
const carouselCount = document.querySelector(".carousel-count");
const carouselPrev = document.querySelector(".carousel-prev");
const carouselNext = document.querySelector(".carousel-next");

let cursorX = 0;
let cursorY = 0;
let previousCursorX = 0;
let previousCursorY = 0;
let cursorVelocityX = 0;
let cursorVelocityY = 0;
let hasCursorPosition = false;
let cursorTicking = false;
let previousFocus = null;
let activeSlides = [];
let activeSlideIndex = 0;
let touchStartX = 0;
let touchStartY = 0;
let lastBurstTime = 0;

const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const moveCursor = () => {
  cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
  cursorTicking = false;
};

if (cursor && hasFinePointer) {
  window.addEventListener("pointermove", (event) => {
    cursorVelocityX = hasCursorPosition ? event.clientX - previousCursorX : 0;
    cursorVelocityY = hasCursorPosition ? event.clientY - previousCursorY : 0;
    previousCursorX = event.clientX;
    previousCursorY = event.clientY;
    hasCursorPosition = true;
    cursorX = event.clientX;
    cursorY = event.clientY;
    cursor.classList.add("is-visible");

    if (!cursorTicking) {
      window.requestAnimationFrame(moveCursor);
      cursorTicking = true;
    }
  });

  document.addEventListener("pointerleave", () => {
    cursor.classList.remove("is-visible");
  });
}

const initializeNamePhysics = () => {
  if (!nameField || !nameLetters.length || prefersReducedMotion) return;

  const fieldRect = nameField.getBoundingClientRect();
  const bounds = {
    minX: -fieldRect.left,
    maxX: window.innerWidth - fieldRect.left,
    minY: -fieldRect.top,
    maxY: window.innerHeight - fieldRect.top,
  };

  const bodies = nameLetters.map((letter) => {
    const rect = letter.getBoundingClientRect();

    return {
      element: letter,
      x: rect.left - fieldRect.left,
      y: rect.top - fieldRect.top,
      width: rect.width,
      height: rect.height,
      vx: 0,
      vy: 0,
      angle: 0,
      angularVelocity: 0,
    };
  });

  nameField.style.height = `${fieldRect.height}px`;
  nameField.classList.add("has-physics");

  const renderBody = (body) => {
    body.element.style.transform = `translate3d(${body.x}px, ${body.y}px, 0) rotate(${body.angle}deg)`;
  };

  bodies.forEach(renderBody);

  const createImpactBurst = (x, y, impulseX, impulseY) => {
    const now = performance.now();

    if (now - lastBurstTime < 90) return;

    lastBurstTime = now;
    const burst = document.createElement("span");
    const angle = Math.atan2(impulseY, impulseX) * (180 / Math.PI);
    burst.className = "impact-burst";
    burst.style.left = `${x - fieldRect.left}px`;
    burst.style.top = `${y - fieldRect.top}px`;
    burst.style.setProperty("--burst-angle", `${angle}deg`);
    burst.innerHTML = "<span></span><span></span><span></span><span></span><span></span>";
    nameField.appendChild(burst);
    window.setTimeout(() => burst.remove(), 580);
  };

  const pushBody = (body, clientX, clientY, impulseX, impulseY) => {
    const bodyCenterX = fieldRect.left + body.x + body.width / 2;
    const bodyCenterY = fieldRect.top + body.y + body.height / 2;
    const distance = Math.hypot(clientX - bodyCenterX, clientY - bodyCenterY);
    const radius = Math.max(body.width, body.height) * 0.62;

    if (distance > radius) return;

    const fallbackX = clientX < bodyCenterX ? 1 : -1;
    const fallbackY = clientY < bodyCenterY ? 1 : -1;
    const speed = Math.hypot(impulseX, impulseY);
    const force = Math.max(8, Math.min(34, speed * 1.24));
    const nx = speed > 0.2 ? impulseX / speed : fallbackX;
    const ny = speed > 0.2 ? impulseY / speed : fallbackY;

    body.vx += nx * force;
    body.vy += ny * force;
    body.angularVelocity += (nx - ny) * 0.5;
    body.angularVelocity = Math.max(-2.4, Math.min(2.4, body.angularVelocity));
    createImpactBurst(clientX, clientY, nx, ny);
  };

  if (hasFinePointer) {
    nameField.addEventListener("pointermove", (event) => {
      bodies.forEach((body) => {
        pushBody(body, event.clientX, event.clientY, cursorVelocityX, cursorVelocityY);
      });
    });
  }

  nameLetters.forEach((letter, index) => {
    letter.addEventListener("click", (event) => {
      const body = bodies[index];
      const rect = letter.getBoundingClientRect();
      const xDirection = event.clientX < rect.left + rect.width / 2 ? 1 : -1;

      pushBody(body, event.clientX, event.clientY, xDirection * 22, -6);
    });
  });

  const resolveLetterCollisions = () => {
    for (let i = 0; i < bodies.length; i += 1) {
      for (let j = i + 1; j < bodies.length; j += 1) {
        const a = bodies[i];
        const b = bodies[j];
        const ax = a.x + a.width / 2;
        const ay = a.y + a.height / 2;
        const bx = b.x + b.width / 2;
        const by = b.y + b.height / 2;
        const overlapX = (a.width + b.width) / 2 - Math.abs(ax - bx);
        const overlapY = (a.height + b.height) / 2 - Math.abs(ay - by);

        if (overlapX <= 0 || overlapY <= 0) continue;

        if (overlapX < overlapY) {
          const direction = ax < bx ? -1 : 1;
          a.x += (overlapX / 2) * direction;
          b.x -= (overlapX / 2) * direction;
          const temp = a.vx;
          a.vx = b.vx * 0.66;
          b.vx = temp * 0.66;
          a.angularVelocity -= direction * 0.14;
          b.angularVelocity += direction * 0.14;
        } else {
          const direction = ay < by ? -1 : 1;
          a.y += (overlapY / 2) * direction;
          b.y -= (overlapY / 2) * direction;
          const temp = a.vy;
          a.vy = b.vy * 0.66;
          b.vy = temp * 0.66;
          a.angularVelocity += direction * 0.14;
          b.angularVelocity -= direction * 0.14;
        }
      }
    }
  };

  const step = () => {
    bodies.forEach((body) => {
      body.x += body.vx;
      body.y += body.vy;
      body.angle += body.angularVelocity;

      body.vx *= 0.86;
      body.vy *= 0.86;
      body.angularVelocity *= 0.78;

      if (body.x < bounds.minX) {
        body.x = bounds.minX;
        body.vx = Math.abs(body.vx) * 0.45;
      }

      if (body.x + body.width > bounds.maxX) {
        body.x = bounds.maxX - body.width;
        body.vx = -Math.abs(body.vx) * 0.45;
      }

      if (body.y < bounds.minY) {
        body.y = bounds.minY;
        body.vy = Math.abs(body.vy) * 0.45;
      }

      if (body.y + body.height > bounds.maxY) {
        body.y = bounds.maxY - body.height;
        body.vy = -Math.abs(body.vy) * 0.45;
      }
    });

    resolveLetterCollisions();
    bodies.forEach(renderBody);
    window.requestAnimationFrame(step);
  };

  window.requestAnimationFrame(step);
};

document.fonts?.ready.then(initializeNamePhysics);
if (!document.fonts) {
  window.addEventListener("load", initializeNamePhysics);
}

const openModal = (card) => {
  if (!modal || !modalTitle || !carouselTrack) return;

  previousFocus = document.activeElement;
  modalTitle.textContent = card.dataset.workTitle || "Work Example";
  activeSlides = (card.dataset.slides || "")
    .split("|")
    .map((slide) => slide.trim())
    .filter(Boolean);
  activeSlideIndex = 0;

  carouselTrack.innerHTML = activeSlides
    .map(
      (src, index) => `
        <div class="carousel-slide">
          <img class="modal-image" src="${src}" alt="${modalTitle.textContent} image ${index + 1}" />
        </div>
      `
    )
    .join("");

  updateCarousel();
  modal.hidden = false;
  document.body.classList.add("modal-open");
  modalClose?.focus();
};

const updateCarousel = () => {
  if (!carouselTrack || !carouselCount) return;

  carouselTrack.style.setProperty("--slide-index", activeSlideIndex);
  carouselCount.textContent = `${activeSlideIndex + 1} / ${activeSlides.length}`;
};

const showSlide = (direction) => {
  if (!activeSlides.length) return;

  activeSlideIndex = (activeSlideIndex + direction + activeSlides.length) % activeSlides.length;
  updateCarousel();
};

const closeModal = () => {
  if (!modal) return;

  modal.hidden = true;
  document.body.classList.remove("modal-open");

  if (previousFocus instanceof HTMLElement) {
    previousFocus.focus();
  }
};

workCards.forEach((card) => {
  card.addEventListener("pointerenter", () => {
    cursor?.classList.add("is-viewing");
  });

  card.addEventListener("pointerleave", () => {
    cursor?.classList.remove("is-viewing");
  });

  card.addEventListener("click", () => openModal(card));

  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openModal(card);
    }
  });
});

modalClose?.addEventListener("click", closeModal);
carouselPrev?.addEventListener("click", () => showSlide(-1));
carouselNext?.addEventListener("click", () => showSlide(1));

carouselViewport?.addEventListener("touchstart", (event) => {
  const touch = event.changedTouches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
});

carouselViewport?.addEventListener("touchend", (event) => {
  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;

  if (Math.abs(deltaX) > 44 && Math.abs(deltaX) > Math.abs(deltaY)) {
    showSlide(deltaX < 0 ? 1 : -1);
  }
});

modal?.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal && !modal.hidden) {
    closeModal();
  }

  if (modal && !modal.hidden && event.key === "ArrowLeft") {
    showSlide(-1);
  }

  if (modal && !modal.hidden && event.key === "ArrowRight") {
    showSlide(1);
  }
});
