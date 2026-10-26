/* Facebook is the enquiry destination. Add a business email only when supplied. */
const STUDIO_CONTACT_URL = 'https://web.facebook.com/profile.php?id=61595946298590';
const PACKAGES = {
  essential: { name: 'Essential Refresh', price: 49, photos: 5, scope: 'Up to 5 photos; 24-hour delivery; 1 round of minor revisions.' },
  listing: { name: 'Full Listing Polish', price: 99, photos: 15, scope: 'Up to 15 photos; priority 24-hour delivery; unlimited minor revisions.' },
  multi: { name: 'Multi-Property Pass', price: 249, photos: 45, scope: 'Up to 3 properties and 45 total photos; 12–24 hour turnaround; 1 vertical slideshow/reel per property.' }
};

const comparison = document.getElementById('comparison');
const range = document.getElementById('comparison-range');
const viewButtons = [...document.querySelectorAll('[data-view]')];
function setComparison(value) {
  const split = Math.max(0, Math.min(100, Number(value)));
  comparison.style.setProperty('--split', `${split}%`);
  range.value = split;
  range.setAttribute('aria-valuetext', `${split} percent original, ${100 - split} percent enhanced`);
  document.querySelector('.before-label').style.opacity = split < 12 ? '0' : '1';
  document.querySelector('.after-label').style.opacity = split > 88 ? '0' : '1';
  viewButtons.forEach(button => {
    const selected = Number(button.dataset.view) === split;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}
range.addEventListener('input', () => setComparison(range.value));
viewButtons.forEach(button => button.addEventListener('click', () => setComparison(button.dataset.view)));

const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.getElementById('site-nav');
function closeNavigation() {
  navigation.classList.remove('is-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open navigation');
}
menuToggle.addEventListener('click', () => {
  const isOpen = navigation.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeNavigation));
document.addEventListener('click', event => {
  if (!navigation.contains(event.target) && !menuToggle.contains(event.target)) closeNavigation();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeNavigation();
});

const comparisonDialog = document.getElementById('comparison-dialog');
document.getElementById('open-comparison').addEventListener('click', () => comparisonDialog.showModal());
document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
});

const form = document.getElementById('enquiry-form');
const packageSelect = document.getElementById('package');
const quantityInput = form.elements.namedItem('quantity');
const packageNote = document.getElementById('package-note');
function syncPackage() {
  const plan = PACKAGES[packageSelect.value];
  quantityInput.max = plan ? String(plan.photos) : '1000';
  packageNote.textContent = plan ? `${plan.name} — $${plan.price} flat fee. ${plan.scope}` : 'Choose a package above, or tell us what you need and we’ll help you choose.';
}
packageSelect.addEventListener('change', syncPackage);
document.querySelectorAll('[data-package]').forEach(button => button.addEventListener('click', () => {
  packageSelect.value = button.dataset.package;
  syncPackage();
  document.getElementById('request').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  packageSelect.focus({ preventScroll: true });
}));
syncPackage();
const requestDialog = document.getElementById('request-dialog');
const preparedMessage = document.getElementById('prepared-message');
const copyStatus = document.getElementById('copy-status');
const copyButtonLabel = document.querySelector('#copy-request span');
if (STUDIO_CONTACT_URL) {
  const contactURL = new URL(STUDIO_CONTACT_URL);
  if (contactURL.protocol === 'https:' || contactURL.protocol === 'mailto:') {
    const contactLink = document.getElementById('contact-link');
    contactLink.href = contactURL.href;
    contactLink.hidden = false;
    contactLink.textContent = 'Continue on Facebook ↗';
    document.getElementById('contact-note').textContent = 'Prepare and copy your enquiry, then send it to FrameFix on Facebook with your original photos. Nothing is sent or uploaded by this form.';
    document.getElementById('submit-label').textContent = 'Prepare my Facebook enquiry';
  }
}
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const name = String(data.get('name')).trim();
  const contact = String(data.get('contact')).trim();
  if (!name || !contact) {
    const field = form.elements.namedItem(!name ? 'name' : 'contact');
    field.setCustomValidity('Please add your details so we can prepare your enquiry.');
    field.reportValidity();
    field.addEventListener('input', () => field.setCustomValidity(''), { once: true });
    return;
  }
  const plan = PACKAGES[data.get('package')];
  const selectedPackage = plan ? `${plan.name} — $${plan.price} flat fee` : 'Help me choose a package / custom quote';
  preparedMessage.value = `Hi FrameFix! I’d like to enquire about photo enhancement.\n\nName: ${name}\nContact: ${contact}\nPackage: ${selectedPackage}\n${plan ? `Package details: ${plan.scope}\n` : ''}Photos for: ${data.get('purpose')}\nNumber of photos: ${data.get('quantity')}\nWhat needs attention: ${data.get('service')}\n\n${String(data.get('message')).trim() || 'Please review my photos and suggest what can be improved.'}\n\nI’ll send the original photos with this message. Please confirm the package, scope, and delivery timing before starting.`;
  copyStatus.textContent = '';
  copyButtonLabel.textContent = 'Copy my enquiry';
  requestDialog.showModal();
});
document.getElementById('copy-request').addEventListener('click', async () => {
  try {
    if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(preparedMessage.value);
    copyButtonLabel.textContent = 'Copied to clipboard';
    copyStatus.textContent = 'Copied! Your enquiry hasn’t been sent. It’s ready to paste into a message.';
  } catch {
    preparedMessage.focus();
    preparedMessage.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch { /* Manual selection remains available. */ }
    copyButtonLabel.textContent = copied ? 'Copied to clipboard' : 'Copy my enquiry';
    copyStatus.textContent = copied ? 'Copied! Your enquiry hasn’t been sent.' : 'Your message is selected. Use Copy on your device to copy it.';
  }
});
document.getElementById('year').textContent = new Date().getFullYear();
