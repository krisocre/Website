(() => {
  const section = document.currentScript.dataset.section;

  document.addEventListener('DOMContentLoaded', () => {
    // Leave explicit fragments to the browser and the existing navigation.
    if (window.location.hash) return;

    const target = document.querySelector(section);
    if (!target) return;

    const header = document.querySelector('.site-header, #navbar');
    const position = header && getComputedStyle(header).position;
    const offset = position === 'fixed' || position === 'sticky'
      ? header.getBoundingClientRect().bottom
      : 0;

    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - offset - 16,
      behavior: 'instant'
    });
  }, { once: true });
})();
