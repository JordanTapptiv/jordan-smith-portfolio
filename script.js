const nameField = document.querySelector(".name-field");
const letters = Array.from(document.querySelectorAll(".name-line span"));

let pointerX = 0;
let pointerY = 0;
let ticking = false;

const resetLetters = () => {
  nameField?.classList.remove("is-active");
  letters.forEach((letter) => {
    letter.style.removeProperty("--tx");
    letter.style.removeProperty("--ty");
    letter.style.removeProperty("--skew");
    letter.style.removeProperty("--glow");
  });
};

const renderInteraction = () => {
  const fieldRect = nameField.getBoundingClientRect();
  const centerX = fieldRect.left + fieldRect.width / 2;
  const centerY = fieldRect.top + fieldRect.height / 2;
  const reticleX = `${(pointerX - centerX) * 0.08}px`;
  const reticleY = `${(pointerY - centerY) * 0.08}px`;

  nameField.style.setProperty("--reticle-x", reticleX);
  nameField.style.setProperty("--reticle-y", reticleY);

  letters.forEach((letter) => {
    const rect = letter.getBoundingClientRect();
    const letterX = rect.left + rect.width / 2;
    const letterY = rect.top + rect.height / 2;
    const deltaX = pointerX - letterX;
    const deltaY = pointerY - letterY;
    const distance = Math.hypot(deltaX, deltaY);
    const strength = Math.max(0, 1 - distance / 190);
    const direction = deltaX < 0 ? 1 : -1;

    letter.style.setProperty("--tx", `${direction * strength * 9}px`);
    letter.style.setProperty("--ty", `${Math.sin(deltaY * 0.025) * strength * 7}px`);
    letter.style.setProperty("--skew", `${direction * strength * 7}deg`);
    letter.style.setProperty(
      "--glow",
      strength > 0.05
        ? `${direction * -3 * strength}px 0 0 rgba(213, 254, 0, ${0.9 * strength}), ${direction * 4 * strength}px 0 0 rgba(31, 31, 29, ${0.35 * strength})`
        : "none"
    );
  });

  ticking = false;
};

if (nameField && window.matchMedia("(pointer: fine)").matches) {
  nameField.addEventListener("pointermove", (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    nameField.classList.add("is-active");

    if (!ticking) {
      window.requestAnimationFrame(renderInteraction);
      ticking = true;
    }
  });

  nameField.addEventListener("pointerleave", resetLetters);
}
