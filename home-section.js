(() => {
  const { section, sectionUrl } = document.currentScript.dataset;

  document.addEventListener('DOMContentLoaded', () => {
    const requestedFragment = window.location.hash;
    if (sectionUrl) {
      const destination = new URL(sectionUrl, window.location.href);
      destination.search = window.location.search;
      destination.hash = requestedFragment || section;
      // Keep acquisition data on the original page load.
      window.history.replaceState(window.history.state, '', destination);
    }
    if (requestedFragment) return;

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
