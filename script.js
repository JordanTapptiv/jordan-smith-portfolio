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

const knockLetter = (letter, index, clientX) => {
  if (letter.classList.contains("is-falling")) return;

  const rect = letter.getBoundingClientRect();
  const letterCenter = rect.left + rect.width / 2;
  const direction = clientX < letterCenter ? 1 : -1;
  const offset = direction * (70 + (index % 3) * 26);
  const rotation = direction * (18 + (index % 4) * 8);

  letter.style.setProperty("--fall-x", `${offset}px`);
  letter.style.setProperty("--fall-rotate", `${rotation}deg`);
  letter.classList.add("is-falling");
};

if (nameField) {
  nameLetters.forEach((letter, index) => {
    if (hasFinePointer) {
      letter.addEventListener("pointerenter", (event) => {
        knockLetter(letter, index, event.clientX);
      });
    }

    letter.addEventListener("click", (event) => {
      knockLetter(letter, index, event.clientX);
    });
  });
}

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
