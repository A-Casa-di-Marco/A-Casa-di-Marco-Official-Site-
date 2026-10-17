/* Responsive video, accessible tour and translations for the new landing. */
(() => {
  Object.assign(T_EN, {
    'nav.spaces': 'The spaces', 'nav.reserve': 'Your stay ↗',
    'cinema.eyebrow': 'Private garden · Between city and coast',
    'cinema.title': 'A Casa <span class="hero-name">di <em>Marco</em></span>',
    'cinema.subtitle': '<em>Your quiet corner in Salerno.</em>',
    'cinema.reserve': 'Choose your dates', 'cinema.tour': 'Come on in',
    'cinema.location': 'SALERNO, CAMPANIA · ITALY', 'cinema.entire': 'A home of your own',
    'cinema.guests': 'Up to 6 guests', 'cinema.garden': 'Private garden', 'cinema.parking': 'Free parking',
    'cinema.caption': 'A little corner of green. Just for you.',
    'cinema.tourTitle': 'A look around Casa di Marco', 'cinema.tourNote': 'The full tour, at your own pace.',
    'cinema.close': 'Close tour', 'home.kicker': '01 / The pleasure of slowing down',
    'home.h2': 'Out there, discovery.<br>In here, tranquillity.',
    'spazi.kicker': '02 / Spaces to enjoy', 'spazi.h2': 'Make room for good moments.',
    'rec.showAll': 'Read all reviews', 'rec.showLess': 'Show less',
    'guide.h2': 'Salerno, through<br>our eyes.',
    'guide.p1': 'Where to stop for a meal, what to explore and the little details that make everything easier.',
    'guide.p2': 'We have gathered our tips in a digital guide to take with you, included in your stay.',
    'guide.explore': 'Browse an example ↗', 'guide.note': 'The full guide is sent to our guests.',
    'guide.notebook': 'Your stay notebook', 'guide.cover': 'Good things,<br>just around here.',
    'guide.food': 'At the table', 'guide.foodDesc': 'Restaurants and local flavours',
    'guide.places': 'Explore', 'guide.placesDesc': 'Seaside, villages and walks',
    'guide.shops': 'Everyday essentials', 'guide.shopsDesc': 'Groceries and useful shops',
    'guide.practical': 'Practical info', 'guide.practicalDesc': 'Nearby pharmacies',
    'guide.signature': 'A Casa di Marco · Tips from home',
    'guide.phoneNote': 'Your guide, wherever you go.',
    'guide.phoneLabel': 'Digital guide preview',
    'guide.dialogTitle': 'A taste of the guide', 'guide.close': 'Close guide preview'
  });
  applyLang();
  const reviewsGrid = document.getElementById('reviewsGrid');
  const reviewsToggle = document.getElementById('reviewsToggle');
  reviewsGrid.classList.add('is-collapsed');
  reviewsToggle.hidden = false;
  reviewsToggle.addEventListener('click', () => {
    const collapsed = reviewsGrid.classList.toggle('is-collapsed');
    reviewsToggle.setAttribute('aria-expanded', String(!collapsed));
  });
  document.querySelectorAll('.space-icon').forEach(icon => icon.setAttribute('aria-hidden', 'true'));
  const hero = document.getElementById('heroVideo');
  const toggle = document.getElementById('videoToggle');
  const dialog = document.getElementById('tourDialog');
  const full = document.getElementById('fullTour');
  const mobile = matchMedia('(max-width: 700px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const guideSection = document.querySelector('.guide-section');
  const phoneStage = guideSection.querySelector('.phone-stage');
  const phoneFront = phoneStage.querySelector('.phone-front');
  let guideFrame = 0;
  function updateGuidePhone() {
    guideFrame = 0;
    if (reduced.matches) {
      guideSection.classList.remove('is-motion-ready');
      phoneFront.inert = false;
      phoneFront.removeAttribute('aria-hidden');
      return;
    }
    guideSection.classList.add('is-motion-ready');
    const start = innerHeight * .86;
    const end = innerHeight * .18;
    const position = phoneStage.getBoundingClientRect().top;
    const progress = Math.max(0,Math.min(1,(start-position)/(start-end)));
    const eased = progress * progress * (3-2*progress);
    phoneStage.style.setProperty('--guide-angle',`${-180*eased}deg`);
    phoneStage.style.setProperty('--guide-tilt',`${-(innerWidth <= 600 ? 3 : 7)*(1-eased)}deg`);
    phoneStage.style.setProperty('--guide-lift',`${24*(1-eased)}px`);
    const interactive = progress > .8;
    phoneFront.inert = !interactive;
    if (interactive) phoneFront.removeAttribute('aria-hidden');
    else phoneFront.setAttribute('aria-hidden','true');
  }
  function queueGuidePhone() {
    if (!guideFrame) guideFrame = requestAnimationFrame(updateGuidePhone);
  }
  addEventListener('scroll',queueGuidePhone,{passive:true});
  addEventListener('resize',queueGuidePhone);
  reduced.addEventListener('change',queueGuidePhone);
  queueGuidePhone();
  let wantsPlayback = !reduced.matches && !navigator.connection?.saveData;
  let inView = true;
  let returnFocus;
  const mediaPath = kind => `assets/video/${kind}-${mobile.matches ? 'mobile' : 'desktop'}.mp4`;
  function syncButton() {
    const playing = !hero.paused;
    toggle.setAttribute('aria-pressed', String(playing));
    toggle.setAttribute('aria-label', playing ? tt('Metti in pausa il video', 'Pause video') : tt('Riproduci video', 'Play video'));
    toggle.firstElementChild.textContent = playing ? 'Ⅱ' : '▷';
    toggle.querySelector('[data-video-label]').textContent = playing ? tt('Pausa', 'Pause') : tt('Riproduci', 'Play');
  }
  async function playHero() {
    if (!hero.getAttribute('src')) hero.src = mediaPath('hero');
    try { await hero.play(); } catch { /* Poster remains visible when autoplay is unavailable. */ }
    syncButton();
  }
  function reconcile() {
    if (wantsPlayback && inView && !document.hidden && !dialog.open) playHero();
    else hero.pause();
  }
  hero.addEventListener('playing', () => { hero.classList.add('ready'); syncButton(); });
  hero.addEventListener('pause', syncButton);
  hero.addEventListener('error', () => { hero.classList.remove('ready'); wantsPlayback = false; syncButton(); });
  toggle.addEventListener('click', () => { wantsPlayback = hero.paused; reconcile(); });
  mobile.addEventListener('change', () => {
    hero.pause(); hero.classList.remove('ready'); hero.removeAttribute('src'); hero.load(); reconcile();
  });
  reduced.addEventListener('change', () => { wantsPlayback = !reduced.matches && !navigator.connection?.saveData; reconcile(); });
  document.addEventListener('visibilitychange', reconcile);
  new IntersectionObserver(entries => { inView = entries[0].isIntersecting; reconcile(); }, { threshold: .1 }).observe(hero);
  document.querySelectorAll('.tour-trigger').forEach(button => button.addEventListener('click', () => {
    returnFocus = button;
    hero.pause();
    const next = mediaPath('tour');
    if (full.getAttribute('src') !== next) { full.src = next; full.load(); }
    dialog.showModal();
    full.play().catch(() => {});
  }));
  document.getElementById('tourClose').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog && (event.clientX < dialog.getBoundingClientRect().left || event.clientX > dialog.getBoundingClientRect().right || event.clientY < dialog.getBoundingClientRect().top || event.clientY > dialog.getBoundingClientRect().bottom)) dialog.close(); });
  dialog.addEventListener('close', () => { full.pause(); returnFocus?.focus(); reconcile(); });
  document.getElementById('langSwitch').addEventListener('click', syncButton);
  syncButton();

  // Keep the pre-existing mobile menu state exposed to assistive technology.
  const nav = document.getElementById('navLinks');
  const navButton = document.getElementById('navToggle');
  new MutationObserver(() => navButton.setAttribute('aria-expanded', String(nav.classList.contains('show')))).observe(nav, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('show')) { nav.classList.remove('show'); navButton.focus(); } });

  // Validate direct date entry as well as calendar selections before WhatsApp opens.
  const arrival = document.getElementById('checkin');
  const departure = document.getElementById('checkout');
  arrival.min = toYMD(today);
  function validateDates() {
    arrival.setCustomValidity(''); departure.setCustomValidity('');
    const nextDay = arrival.value ? fromYMD(arrival.value) : new Date(today);
    nextDay.setDate(nextDay.getDate() + 1);
    departure.min = toYMD(nextDay);
    if (arrival.value && arrival.value < toYMD(today)) arrival.setCustomValidity(tt('Scegli una data da oggi in poi.', 'Choose today or a later date.'));
    if (arrival.value && departure.value && departure.value <= arrival.value) departure.setCustomValidity(tt('La partenza deve essere successiva all’arrivo.', 'Check-out must be after check-in.'));
    else if (arrival.value && departure.value && hasBusyDateBetween(arrival.value, departure.value)) departure.setCustomValidity(tt('Il periodo include date occupate. Scegli altre date.', 'Your stay includes unavailable dates. Choose different dates.'));
  }
  arrival.addEventListener('input', validateDates); departure.addEventListener('input', validateDates);
  document.getElementById('calendarGrid').addEventListener('click', validateDates);
  document.getElementById('bookingRequestForm').addEventListener('submit', event => {
    validateDates();
    if (!event.target.checkValidity()) { event.preventDefault(); event.stopImmediatePropagation(); event.target.reportValidity(); }
  }, true);
  validateDates();
})();
