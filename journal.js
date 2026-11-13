/* Presentation-only enhancements. Storage, training and calculations stay in app modules. */
(() => {
  const main = document.getElementById('main');
  const updateTitle = () => {
    document.title = `${main.querySelector('h1')?.textContent || 'FPV'} · Çalışma defteri`;
  };
  updateTitle();
  window.addEventListener('hashchange', () => {
    updateTitle();
    if (location.hash !== '#main') main.focus({ preventScroll: true });
  });
  const feedback = document.getElementById('record-feedback');
  new MutationObserver(() => {
    const attempts = document.querySelector('[name="attempts"]');
    if (!attempts) return;
    const invalid = !!feedback.textContent;
    attempts.setAttribute('aria-invalid', String(invalid));
    attempts.setAttribute('aria-describedby', 'record-feedback');
    if (invalid) attempts.focus();
  }).observe(feedback, { childList: true, characterData: true, subtree: true });
})();
