const scrollEffectElements = document.querySelectorAll(
  "#intersecting-effect-element",
);

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("isIntersecting");
    } else {
      entry.target.classList.remove("isIntersecting");
    }
  });
});

scrollEffectElements.forEach((el) => observer.observe(el));
