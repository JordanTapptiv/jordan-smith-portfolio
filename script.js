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
let cursorTicking = false;
let previousFocus = null;
let activeSlides = [];
let activeSlideIndex = 0;
let touchStartX = 0;
let touchStartY = 0;

const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const moveCursor = () => {
  cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
  cursorTicking = false;
};

if (cursor && hasFinePointer) {
  window.addEventListener("pointermove", (event) => {
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

const initializeNameTilt = () => {
  if (!nameField || !nameLetters.length || prefersReducedMotion) return;

  const maxTilt = 19;
  const ease = 0.16;
  const letters = nameLetters.map((letter) => ({
    element: letter,
    currentTilt: 0,
    targetTilt: 0,
  }));

  let isAnimating = false;

  const animate = () => {
    let shouldContinue = false;

    letters.forEach((letter) => {
      letter.currentTilt += (letter.targetTilt - letter.currentTilt) * ease;

      if (Math.abs(letter.targetTilt - letter.currentTilt) > 0.02) {
        shouldContinue = true;
      } else if (letter.targetTilt === 0) {
        letter.element.classList.remove("is-tilting");
      }

      letter.element.style.setProperty("--tilt-x", `${letter.currentTilt.toFixed(2)}deg`);
    });

    if (shouldContinue) {
      window.requestAnimationFrame(animate);
    } else {
      isAnimating = false;
    }
  };

  const startAnimation = () => {
    if (isAnimating) return;

    isAnimating = true;
    window.requestAnimationFrame(animate);
  };

  letters.forEach((letter) => {
    letter.element.addEventListener("pointermove", (event) => {
      const rect = letter.element.getBoundingClientRect();
      const pointerY = (event.clientY - rect.top) / rect.height;
      const clampedY = Math.min(1, Math.max(0, pointerY));
      letter.targetTilt = (0.5 - clampedY) * maxTilt * 2;
      letter.element.classList.add("is-tilting");
      startAnimation();
    });

    letter.element.addEventListener("pointerleave", () => {
      letter.targetTilt = 0;
      startAnimation();
    });
  });
};

initializeNameTilt();

const openModal = (card) => {
  if (!modal || !modalTitle || !carouselTrack) return;

  previousFocus = document.activeElement;
  modalTitle.textContent = card.dataset.workTitle || "Work Example";
  activeSlides = [
    "linear-gradient(135deg, rgba(213, 254, 0, 0.24), transparent 42%)",
    "radial-gradient(circle at 25% 24%, rgba(213, 254, 0, 0.28), transparent 30%)",
    "linear-gradient(90deg, rgba(238, 238, 226, 0.08), transparent 36%, rgba(213, 254, 0, 0.18))",
  ];
  activeSlideIndex = 0;

  carouselTrack.innerHTML = activeSlides
    .map(
      (gradient, index) => `
        <div class="carousel-slide">
          <div
            class="modal-art"
            role="img"
            aria-label="${modalTitle.textContent} image ${index + 1}"
            style="--slide-gradient: ${gradient}"
          ></div>
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
