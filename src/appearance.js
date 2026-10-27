// Interface presentation only. No print settings, cut geometry or USB state live here.
export const APPEARANCES = Object.freeze(['simple', 'kawaii', 'engineer']);
const BACKGROUNDS = Object.freeze({ simple: '#030712', kawaii: '#fff6fb', engineer: '#0c1219' });

export function normaliseAppearance(value) {
  return APPEARANCES.includes(value) ? value : 'simple';
}

export function setAppearance(mode, { doc = document, store, onChange = () => {}, persist = true } = {}) {
  const choice = normaliseAppearance(mode);
  doc.body.dataset.appearance = choice;
  doc.documentElement.style.colorScheme = choice === 'kawaii' ? 'light' : 'dark';
  const meta = doc.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = BACKGROUNDS[choice];
  for (const button of doc.querySelectorAll('[data-appearance-choice]')) {
    button.setAttribute('aria-pressed', String(button.dataset.appearanceChoice === choice));
  }
  if (persist) store?.set('appearance', choice);
  onChange(choice);
  return choice;
}

export function installAppearanceControls({ doc = document, store, onChange = () => {} } = {}) {
  const value = normaliseAppearance(store?.get('appearance', 'simple'));
  // Applying the initial theme happens before canvas rendering is wired in.
  setAppearance(value, { doc, store, onChange: () => {}, persist: false });
  for (const button of doc.querySelectorAll('[data-appearance-choice]')) {
    button.addEventListener('click', () => {
      setAppearance(button.dataset.appearanceChoice, { doc, store, onChange });
    });
  }
  const dialog = doc.getElementById('helpDialog');
  const opener = doc.getElementById('helpBtn');
  const close = doc.getElementById('helpClose');
  opener?.addEventListener('click', () => {
    if (!dialog?.open) dialog?.showModal();
    opener?.setAttribute('aria-expanded', 'true');
  });
  close?.addEventListener('click', () => dialog?.close());
  dialog?.addEventListener('close', () => opener?.setAttribute('aria-expanded', 'false'));
  // Native <dialog> handles Escape, focus containment and restores focus to the opener.
  return value;
}
