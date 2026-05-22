const nameField = document.querySelector(".name-field");
const nameLetters = Array.from(document.querySelectorAll(".letter"));
const cursor = document.querySelector(".cursor-dot");
const workCards = Array.from(document.querySelectorAll(".work-card"));
const modal = document.querySelector(".work-modal");
const modalTitle = document.querySelector("#modal-title");
const modalClose = document.querySelector(".modal-close");

let cursorX = 0;
let cursorY = 0;
let cursorTicking = false;
let previousFocus = null;

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

if (nameField && hasFinePointer) {
  nameLetters.forEach((letter, index) => {
    letter.addEventListener("pointerenter", (event) => {
      if (letter.classList.contains("is-falling")) return;

      const rect = letter.getBoundingClientRect();
      const letterCenter = rect.left + rect.width / 2;
      const direction = event.clientX < letterCenter ? 1 : -1;
      const offset = direction * (70 + (index % 3) * 26);
      const rotation = direction * (18 + (index % 4) * 8);

      letter.style.setProperty("--fall-x", `${offset}px`);
      letter.style.setProperty("--fall-rotate", `${rotation}deg`);
      letter.classList.add("is-falling");
    });
  });
}

const openModal = (card) => {
  if (!modal || !modalTitle) return;

  previousFocus = document.activeElement;
  modalTitle.textContent = card.dataset.workTitle || "Work Example";
  modal.hidden = false;
  document.body.classList.add("modal-open");
  modalClose?.focus();
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

modal?.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal && !modal.hidden) {
    closeModal();
  }
});
