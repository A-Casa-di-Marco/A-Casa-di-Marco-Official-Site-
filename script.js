const CALENDAR_FEED_URL = 'https://script.google.com/macros/s/AKfycbzaikXcMmx1sPsPkQw3Id2Wa31qeMNIfA1IpqDV-KPW4eA5ViM8P8SkXEYbdpEqFZ5o/exec';
const FALLBACK_OCCUPIED_DATES = [];

let LANG = 'it';
try { LANG = localStorage.getItem('lang') === 'en' ? 'en' : 'it'; } catch (e) {}
const tt = (it, en) => (LANG === 'en' ? en : it);

const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => navLinks.classList.toggle('show'));
  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => navLinks.classList.remove('show'));
  });
}

const currentYear = document.getElementById('currentYear');
if (currentYear) currentYear.textContent = new Date().getFullYear();


/* HERO CAROSELLO FOTO */
const heroSlides = Array.from(document.querySelectorAll('.hero-slide'));
let heroSlideIndex = 0;

if (heroSlides.length > 1) {
  setInterval(() => {
    heroSlides[heroSlideIndex].classList.remove('active');
    heroSlideIndex = (heroSlideIndex + 1) % heroSlides.length;
    heroSlides[heroSlideIndex].classList.add('active');
  }, 6500);
}

const monthNames = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];
const monthNamesEn = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const calendarGrid = document.getElementById('calendarGrid');
const calendarTitle = document.getElementById('calendarTitle');
const calendarStatus = document.getElementById('calendarStatus');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const todayBtn = document.getElementById('todayBtn');
const checkinInput = document.getElementById('checkin');
const checkoutInput = document.getElementById('checkout');

let occupiedDates = new Set(FALLBACK_OCCUPIED_DATES);
let selectedStart = '';
let selectedEnd = '';

const today = new Date();
today.setHours(0, 0, 0, 0);

let visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1);

function toYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function fromYMD(value) {
  return new Date(value + 'T12:00:00');
}

function formatItalianDate(dateValue) {
  if (!dateValue) return '';
  return fromYMD(dateValue).toLocaleDateString(LANG === 'en' ? 'en-GB' : 'it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function firstWeekdayMonday(date) {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

function hasBusyDateBetween(startYmd, endYmd) {
  const start = fromYMD(startYmd);
  const end = fromYMD(endYmd);

  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    if (occupiedDates.has(toYMD(d))) return true;
  }

  return false;
}

function renderCalendar() {
  if (!calendarGrid || !calendarTitle) return;

  calendarGrid.innerHTML = '';

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();

  calendarTitle.textContent = `${(LANG === 'en' ? monthNamesEn : monthNames)[month]} ${year}`;

  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const blanks = firstWeekdayMonday(first);

  for (let i = 0; i < blanks; i++) {
    const empty = document.createElement('div');
    empty.className = 'day-cell empty';
    calendarGrid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const ymd = toYMD(date);
    const isPast = date < today;
    const isBusy = occupiedDates.has(ymd);

    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'day-cell ' + (isPast ? 'past' : isBusy ? 'busy' : 'free');

    if (ymd === selectedStart || ymd === selectedEnd) {
      cell.classList.add('selected');
    }

    cell.disabled = isPast || isBusy;
    cell.innerHTML = `
      <span class="day-number">${day}</span>
      <span class="day-state">${isPast ? tt('Passata', 'Past') : isBusy ? tt('Occupata', 'Busy') : tt('Libera', 'Free')}</span>
    `;

    cell.addEventListener('click', () => selectDate(ymd));
    calendarGrid.appendChild(cell);
  }
}

function selectDate(ymd) {
  if (!selectedStart || (selectedStart && selectedEnd)) {
    selectedStart = ymd;
    selectedEnd = '';

    if (checkinInput) checkinInput.value = ymd;
    if (checkoutInput) checkoutInput.value = '';

    if (calendarStatus) {
      calendarStatus.textContent = tt('Arrivo selezionato. Ora scegli una data di partenza libera.', 'Check-in selected. Now choose a free check-out date.');
    }
  } else {
    if (ymd <= selectedStart) {
      selectedStart = ymd;

      if (checkinInput) checkinInput.value = ymd;

      if (calendarStatus) {
        calendarStatus.textContent = tt('Arrivo aggiornato. Ora scegli una data di partenza successiva.', 'Check-in updated. Now choose a later check-out date.');
      }
    } else if (hasBusyDateBetween(selectedStart, ymd)) {
      if (calendarStatus) {
        calendarStatus.textContent = tt('Tra le date selezionate ci sono giorni occupati. Scegli un periodo senza date occupate.', 'There are busy days between your selected dates. Choose a period without busy days.');
      }
    } else {
      selectedEnd = ymd;

      if (checkoutInput) checkoutInput.value = ymd;

      if (calendarStatus) {
        const range = `${formatItalianDate(selectedStart)} - ${formatItalianDate(selectedEnd)}`;
        calendarStatus.textContent = tt(`Periodo selezionato: ${range}.`, `Selected period: ${range}.`);
      }
    }
  }

  renderCalendar();
}

function loadAvailability() {
  if (!CALENDAR_FEED_URL || CALENDAR_FEED_URL.includes('INCOLLA_QUI')) {
    if (calendarStatus) {
      calendarStatus.textContent = tt('Calendario dimostrativo: collega Apps Script per leggere automaticamente Booking e Airbnb.', 'Demo calendar: connect Apps Script to read Booking and Airbnb automatically.');
    }
    renderCalendar();
    return;
  }

  const callbackName = 'calendarCallback_' + Date.now();
  const script = document.createElement('script');

  window[callbackName] = function(data) {
    const list = Array.isArray(data.occupied) ? data.occupied : [];
    occupiedDates = new Set(list);

    if (calendarStatus) {
      calendarStatus.textContent = tt(`Disponibilità aggiornata. Date occupate caricate: ${list.length}.`, `Availability updated. Busy dates loaded: ${list.length}.`);
    }

    renderCalendar();
    delete window[callbackName];
    script.remove();
  };

  script.src = CALENDAR_FEED_URL + (CALENDAR_FEED_URL.includes('?') ? '&' : '?') + 'callback=' + callbackName;
  script.onerror = function() {
    if (calendarStatus) {
      calendarStatus.textContent = tt('Non riesco a caricare il calendario. Riprova più tardi o scrivici su WhatsApp.', "Couldn't load the calendar. Try again later or message us on WhatsApp.");
    }
    renderCalendar();
  };

  document.body.appendChild(script);
}

if (prevMonthBtn) {
  prevMonthBtn.addEventListener('click', () => {
    visibleMonth.setMonth(visibleMonth.getMonth() - 1);
    renderCalendar();
  });
}

if (nextMonthBtn) {
  nextMonthBtn.addEventListener('click', () => {
    visibleMonth.setMonth(visibleMonth.getMonth() + 1);
    renderCalendar();
  });
}

if (todayBtn) {
  todayBtn.addEventListener('click', () => {
    visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    renderCalendar();
  });
}

/* ---------------------------
   MODULO OSPITI + BAMBINI
   massimo 6 persone totali
---------------------------- */

const MAX_TOTAL_GUESTS = 6;
const MAX_COTS = 1;

const adultsSelect = document.getElementById('adults');
const childrenCountSelect = document.getElementById('childrenCount');
const guestLimitNote = document.getElementById('guestLimitNote');
const childrenBox = document.getElementById('childrenBox');
const childrenAges = document.getElementById('childrenAges');
const cotBox = document.getElementById('cotBox');
const cotRequest = document.getElementById('cotRequest');

function buildAgeOptions() {
  let html = `<option value="0">0 ${tt('anni', 'years')}</option>`;
  html += `<option value="1">${tt('1 anno', '1 year')}</option>`;

  for (let i = 2; i <= 17; i++) {
    html += `<option value="${i}">${i} ${tt('anni', 'years')}</option>`;
  }

  return html;
}

function updateGuestLimitNote() {
  if (!guestLimitNote || !adultsSelect || !childrenCountSelect) return;

  const adults = Number(adultsSelect.value);
  const children = Number(childrenCountSelect.value);
  const total = adults + children;
  const remainingChildren = Math.max(0, MAX_TOTAL_GUESTS - adults);

  guestLimitNote.textContent = LANG === 'en'
    ? `Maximum ${MAX_TOTAL_GUESTS} people in total, children included. With ${adults} ${adults === 1 ? 'adult' : 'adults'} you can add up to ${remainingChildren} ${remainingChildren === 1 ? 'child' : 'children'}. Selected total: ${total}/${MAX_TOTAL_GUESTS}.`
    : `Massimo ${MAX_TOTAL_GUESTS} persone totali, bambini inclusi. Con ${adults} ${adults === 1 ? 'adulto' : 'adulti'} puoi aggiungere al massimo ${remainingChildren} ${remainingChildren === 1 ? 'bambino' : 'bambini'}. Totale selezionato: ${total}/${MAX_TOTAL_GUESTS}.`;
}

function updateChildrenCountOptions() {
  if (!adultsSelect || !childrenCountSelect) return;

  const adults = Number(adultsSelect.value);
  const maxChildren = Math.max(0, MAX_TOTAL_GUESTS - adults);
  const currentValue = Math.min(Number(childrenCountSelect.value || 0), maxChildren);

  childrenCountSelect.innerHTML = '';

  for (let i = 0; i <= maxChildren; i++) {
    const option = document.createElement('option');
    option.value = String(i);

    if (i === 0) {
      option.textContent = tt('Nessun bambino', 'No children');
    } else if (i === 1) {
      option.textContent = tt('1 bambino', '1 child');
    } else {
      option.textContent = `${i} ${tt('bambini', 'children')}`;
    }

    if (i === currentValue) option.selected = true;
    childrenCountSelect.appendChild(option);
  }

  renderChildrenAges();
  updateGuestLimitNote();
}

function updateCotVisibility() {
  if (!childrenAges || !cotBox) return;

  const ageSelects = Array.from(childrenAges.querySelectorAll('.child-age-select'));
  const hasSmallChild = ageSelects.some((select) => Number(select.value) <= 3);

  cotBox.classList.toggle('hidden', !hasSmallChild);

  if (!hasSmallChild && cotRequest) {
    cotRequest.checked = false;
  }
}

function renderChildrenAges() {
  if (!childrenCountSelect || !childrenBox || !childrenAges) return;

  const count = Number(childrenCountSelect.value);
  childrenAges.innerHTML = '';

  if (count <= 0) {
    childrenBox.classList.add('hidden');

    if (cotBox) cotBox.classList.add('hidden');
    if (cotRequest) cotRequest.checked = false;

    updateGuestLimitNote();
    return;
  }

  childrenBox.classList.remove('hidden');

  for (let i = 1; i <= count; i++) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <label for="childAge${i}">${tt(`Età bambino ${i}`, `Age of child ${i}`)}</label>
      <select id="childAge${i}" class="child-age-select">
        ${buildAgeOptions()}
      </select>
    `;
    childrenAges.appendChild(wrapper);
  }

  childrenAges.querySelectorAll('.child-age-select').forEach((select) => {
    select.addEventListener('change', updateCotVisibility);
  });

  updateCotVisibility();
  updateGuestLimitNote();
}

if (adultsSelect) {
  adultsSelect.addEventListener('change', updateChildrenCountOptions);
}

if (childrenCountSelect) {
  childrenCountSelect.addEventListener('change', renderChildrenAges);
}

updateChildrenCountOptions();

const bookingRequestForm = document.getElementById('bookingRequestForm');

if (bookingRequestForm) {
  bookingRequestForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const name = document.getElementById('guestName').value.trim();
    const checkin = document.getElementById('checkin').value;
    const checkout = document.getElementById('checkout').value;
    const adults = Number(document.getElementById('adults').value);
    const childrenCount = Number(document.getElementById('childrenCount').value);
    const source = document.getElementById('source').selectedOptions[0].textContent;
    const breakfastInterest = document.getElementById('breakfastInterest').selectedOptions[0].textContent;
    const message = document.getElementById('message').value.trim();

    const totalGuests = adults + childrenCount;

    if (totalGuests > MAX_TOTAL_GUESTS) {
      alert(tt(`La richiesta può essere inviata per massimo ${MAX_TOTAL_GUESTS} persone totali, bambini inclusi.`, `Requests can be sent for at most ${MAX_TOTAL_GUESTS} people in total, children included.`));
      return;
    }

    const ageSelects = Array.from(document.querySelectorAll('.child-age-select'));
    const childrenAgesText = ageSelects
      .map((select, index) => tt(`Bambino ${index + 1}: ${select.value} anni`, `Child ${index + 1}: ${select.value} years`))
      .join(', ');

    const hasSmallChild = ageSelects.some((select) => Number(select.value) <= 3);
    const cotText = hasSmallChild
      ? (cotRequest && cotRequest.checked
          ? tt(`Sì, richiedo ${MAX_COTS} culla se disponibile`, `Yes, I request ${MAX_COTS} cot if available`)
          : 'No')
      : tt('Non necessaria', 'Not needed');

    const text = [
      tt('Ciao, vorrei richiedere disponibilità per A Casa di Marco.', 'Hello, I would like to request availability for A Casa di Marco.'),
      '',
      tt('Nome: ', 'Name: ') + name,
      tt('Arrivo: ', 'Check-in: ') + formatItalianDate(checkin),
      tt('Partenza: ', 'Check-out: ') + formatItalianDate(checkout),
      tt('Adulti: ', 'Adults: ') + adults,
      tt('Bambini: ', 'Children: ') + childrenCount,
      tt('Totale ospiti: ', 'Total guests: ') + totalGuests + '/' + MAX_TOTAL_GUESTS,
      childrenAgesText ? tt('Età bambini: ', 'Children\u2019 ages: ') + childrenAgesText : '',
      childrenCount > 0 ? tt('Culla: ', 'Cot: ') + cotText : '',
      tt('Colazione: ', 'Breakfast: ') + breakfastInterest,
      tt('Vi ho trovati tramite: ', 'I found you via: ') + source,
      message ? tt('Richieste: ', 'Requests: ') + message : ''
    ].filter(Boolean).join('\n');

    window.open('https://wa.me/393923064010?text=' + encodeURIComponent(text), '_blank');
  });
}

renderCalendar();
loadAvailability();

/* ---------------------------
   LIGHTBOX GALLERIA FOTO
---------------------------- */

const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCounter = document.getElementById('lightboxCounter');
const lightboxClose = document.querySelector('.lightbox-close');
const lightboxPrev = document.querySelector('.lightbox-prev');
const lightboxNext = document.querySelector('.lightbox-next');

const galleryTriggers = Array.from(document.querySelectorAll('.gallery-trigger img'));
let lightboxIndex = 0;
let touchStartX = 0;
let touchEndX = 0;

function openLightbox(index) {
  if (!lightbox || !lightboxImg || galleryTriggers.length === 0) return;

  lightboxIndex = index;
  lightboxImg.src = galleryTriggers[lightboxIndex].src;
  lightboxImg.alt = galleryTriggers[lightboxIndex].alt;
  updateCounter();
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function showPrev() {
  if (galleryTriggers.length === 0) return;
  lightboxIndex = (lightboxIndex - 1 + galleryTriggers.length) % galleryTriggers.length;
  lightboxImg.src = galleryTriggers[lightboxIndex].src;
  lightboxImg.alt = galleryTriggers[lightboxIndex].alt;
  updateCounter();
}

function showNext() {
  if (galleryTriggers.length === 0) return;
  lightboxIndex = (lightboxIndex + 1) % galleryTriggers.length;
  lightboxImg.src = galleryTriggers[lightboxIndex].src;
  lightboxImg.alt = galleryTriggers[lightboxIndex].alt;
  updateCounter();
}

function updateCounter() {
  if (!lightboxCounter) return;
  lightboxCounter.textContent = (lightboxIndex + 1) + ' / ' + galleryTriggers.length;
}

galleryTriggers.forEach(function(img, index) {
  img.parentElement.addEventListener('click', function(e) {
    e.preventDefault();
    openLightbox(index);
  });
});

const galleryTrack = document.getElementById('galleryTrack');
if (galleryTrack) {
  const slides = Array.from(galleryTrack.querySelectorAll('.slide'));
  const galleryCounter = document.getElementById('galleryCounter');
  const galleryPrev = document.getElementById('galleryPrev');
  const galleryNext = document.getElementById('galleryNext');
  let galleryIndex = 0;

  function showSlide(i) {
    galleryIndex = (i + slides.length) % slides.length;
    slides.forEach(function(s, k) { s.classList.toggle('active', k === galleryIndex); });
    if (galleryCounter) galleryCounter.textContent = (galleryIndex + 1) + ' / ' + slides.length;
  }

  if (galleryPrev) galleryPrev.addEventListener('click', function() { showSlide(galleryIndex - 1); });
  if (galleryNext) galleryNext.addEventListener('click', function() { showSlide(galleryIndex + 1); });
}

if (lightboxClose) {
  lightboxClose.addEventListener('click', closeLightbox);
}

if (lightboxPrev) {
  lightboxPrev.addEventListener('click', function(e) {
    e.stopPropagation();
    showPrev();
  });
}

if (lightboxNext) {
  lightboxNext.addEventListener('click', function(e) {
    e.stopPropagation();
    showNext();
  });
}

if (lightbox) {
  lightbox.addEventListener('click', function(e) {
    if (e.target === lightbox) closeLightbox();
  });
}

document.addEventListener('keydown', function(e) {
  if (!lightbox || !lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') showPrev();
  if (e.key === 'ArrowRight') showNext();
});

if (lightbox) {
  lightbox.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  lightbox.addEventListener('touchend', function(e) {
    touchEndX = e.changedTouches[0].screenX;
    var delta = touchStartX - touchEndX;
    if (Math.abs(delta) > 50) {
      if (delta > 0) showNext();
      else showPrev();
    }
  }, { passive: true });
}


/* ---------------------------
   SEZIONE SPAZI INTERATTIVA
---------------------------- */
const spaceData = {
  camera1: {
    kicker: 'Camera matrimoniale',
    title: 'Camera matrimoniale',
    desc: 'Una camera pensata per due persone, semplice e confortevole. Su richiesta è possibile aggiungere una culla per bambini piccoli, se disponibile.',
    photos: ['assets/camera-matrimoniale-1.jpg', 'assets/camera-matrimoniale-2.jpg', 'assets/camera-matrimoniale-3.jpg', 'assets/camera-matrimoniale-4.jpg', 'assets/camera-matrimoniale-5.jpg', 'assets/camera-matrimoniale-6.jpg', 'assets/camera-matrimoniale-7.jpg', 'assets/camera-matrimoniale-8.jpg', 'assets/camera-matrimoniale-9.jpg', 'assets/camera-matrimoniale-10.jpg', 'assets/camera-matrimoniale-11.jpg', 'assets/camera-matrimoniale-12.jpg'],
    items: [
      ['king_bed', '1 letto matrimoniale: può ospitare 2 persone.'],
      ['child_care', 'Culla su richiesta: 1 disponibile, ideale per bambini piccoli.'],
      ['nights_stay', 'Ambiente tranquillo per riposare dopo una giornata fuori.']
    ],
    en: {
      kicker: 'Double bedroom',
      title: 'Double bedroom',
      desc: 'A room designed for two people, simple and comfortable. A cot for young children can be added on request, when available.',
      items: [
        ['king_bed', 'One double bed: sleeps 2 people.'],
        ['child_care', 'Cot on request: 1 available, ideal for young children.'],
        ['nights_stay', 'A quiet room to rest after a day out.']
      ]
    }
  },
  camera2: {
    kicker: 'Seconda camera',
    title: 'Seconda camera · fino a 4 posti letto',
    desc: 'La seconda camera è più flessibile ed è adatta a bambini, ragazzi o piccoli gruppi. I posti letto sono distribuiti tra futon, lettino singolo e letto rialzato.',
    photos: ['assets/camera-2-1.jpg', 'assets/camera-2-2.jpg', 'assets/camera-2-3.jpg', 'assets/camera-2-4.jpg', 'assets/camera-2-5.jpg'],
    items: [
      ['bed', 'Futon piazza e mezzo: può ospitare fino a 2 persone.'],
      ['single_bed', 'Lettino singolo: 1 posto letto.'],
      ['bedroom_child', 'Letto rialzato a castello: 1 posto letto.'],
      ['family_restroom', 'Soluzione comoda per famiglie o gruppi fino a 6 ospiti totali.']
    ],
    en: {
      kicker: 'Second bedroom',
      title: 'Second bedroom · sleeps up to 4',
      desc: 'The second room is more flexible and suits children, teenagers or small groups. The sleeping spots are spread across a futon, a single bed and a bunk bed.',
      items: [
        ['bed', '1.5-person futon: sleeps up to 2 people.'],
        ['single_bed', 'Single bed: 1 sleeping spot.'],
        ['bedroom_child', 'Bunk bed: 1 sleeping spot.'],
        ['family_restroom', 'A comfortable setup for families or groups of up to 6 guests in total.']
      ]
    }
  },
  bagno: {
    kicker: 'Bagno',
    title: 'Bagno funzionale',
    desc: 'Bagno pratico e organizzato, con i servizi utili per il soggiorno e la lavatrice a disposizione degli ospiti.',
    photos: ['assets/bagno-1.jpg', 'assets/bagno-2.jpg', 'assets/bagno-3.jpg', 'assets/bagno-4.jpg'],
    items: [
      ['shower', 'Doccia e servizi essenziali.'],
      ['local_laundry_service', 'Lavatrice disponibile nell’alloggio.'],
      ['cleaning_services', 'Ideale anche per soggiorni di più giorni.']
    ],
    en: {
      kicker: 'Bathroom',
      title: 'Practical bathroom',
      desc: 'A practical, organised bathroom with the essentials for your stay and a washing machine available to guests.',
      items: [
        ['shower', 'Shower and bathroom essentials.'],
        ['local_laundry_service', 'Washing machine in the apartment.'],
        ['cleaning_services', 'Also ideal for longer stays.']
      ]
    }
  },
  cucina: {
    kicker: 'Cucina',
    title: 'Cucina attrezzata',
    desc: 'Una cucina utile per colazioni, pasti semplici e soggiorni più lunghi. Perfetta se preferite avere autonomia durante la vacanza.',
    photos: ['assets/cucina-1.jpg', 'assets/cucina-2.jpg', 'assets/cucina-3.jpg', 'assets/cucina-4.jpg', 'assets/cucina-5.jpg', 'assets/cucina-6.jpg', 'assets/cucina-7.jpg', 'assets/cucina-8.jpg', 'assets/cucina-9.jpg'],
    items: [
      ['cooking', 'Cucina attrezzata per preparare pasti e colazioni.'],
      ['coffee', 'Macchina caffè e moka.'],
      ['restaurant', 'Tavolo e spazio per mangiare in casa.'],
      ['kitchen', 'Utile per famiglie e soggiorni di più giorni.']
    ],
    en: {
      kicker: 'Kitchen',
      title: 'Fully equipped kitchen',
      desc: 'A kitchen for breakfasts, simple meals and longer stays. Perfect if you like having your own space during the holiday.',
      items: [
        ['cooking', 'Equipped kitchen for preparing meals and breakfasts.'],
        ['coffee', 'Coffee machine and moka.'],
        ['restaurant', 'Table and space to eat inside.'],
        ['kitchen', 'Useful for families and longer stays.']
      ]
    }
  },
  veranda: {
    kicker: 'Veranda',
    title: 'Veranda · sala da pranzo coperta',
    desc: 'La veranda in legno è la sala da pranzo della casa: tavolo, sedie e divanetto in uno spazio coperto, con portoni scorrevoli aperti sul giardino e vista sulle montagne. Qui trovi anche il punto WiFi.',
    photos: ['assets/veranda-1.jpg', 'assets/veranda-2.jpg', 'assets/veranda-3.jpg', 'assets/veranda-4.jpg', 'assets/veranda-5.jpg', 'assets/veranda-6.jpg', 'assets/veranda-7.jpg', 'assets/veranda-8.jpg', 'assets/veranda-9.jpg', 'assets/veranda-10.jpg'],
    items: [
      ['table_restaurant', 'Tavolo da pranzo con sedie per colazioni e pasti in veranda.'],
      ['ac_unit', 'Climatizzatore: la veranda resta comoda anche nelle giornate calde.'],
      ['wifi', 'Punto WiFi in veranda: connessione anche nello spazio coperto.'],
      ['park', 'Portoni scorrevoli sul giardino con vista sulle montagne.']
    ],
    en: {
      kicker: 'Veranda',
      title: 'Veranda · covered dining room',
      desc: 'The wooden veranda is the dining room of the house: table, chairs and a small sofa in a covered space, with sliding doors onto the garden and mountain views. You will also find the WiFi point here.',
      items: [
        ['table_restaurant', 'Dining table with chairs for breakfasts and meals on the veranda.'],
        ['ac_unit', 'Air conditioning: the veranda stays comfortable even on hot days.'],
        ['wifi', 'WiFi point on the veranda: connection also in the covered space.'],
        ['park', 'Sliding doors onto the garden with mountain views.']
      ]
    }
  },
  giardino: {
    kicker: 'Giardino',
    title: 'Giardino privato',
    desc: 'Il giardino è l’ingresso della casa: cancello con insegna, prato, sedie lounge sotto l’ombrellone e un tavolo per i pasti all’aperto, con vista sulle montagne.',
    photos: ['assets/giardino-1.jpg', 'assets/giardino-2.jpg', 'assets/giardino-3.jpg', 'assets/giardino-4.jpg', 'assets/giardino-5.jpg', 'assets/giardino-6.jpg', 'assets/giardino-7.jpg', 'assets/giardino-8.jpg', 'assets/giardino-9.jpg', 'assets/giardino-10.jpg', 'assets/giardino-11.jpg', 'assets/giardino-12.jpg', 'assets/giardino-13.jpg'],
    items: [
      ['chair', 'Sedie lounge e ombrellone per rilassarsi sul prato.'],
      ['table_restaurant', 'Tavolo esterno per colazioni e cene all’aperto.'],
      ['park', 'Prato, fiori e vista sulle montagne.']
    ],
    en: {
      kicker: 'Garden',
      title: 'Private garden',
      desc: 'The garden is the entrance to the house: a gate with a sign, a lawn, lounge chairs under the parasol and a table for outdoor meals, with mountain views.',
      items: [
        ['chair', 'Lounge chairs and a parasol to relax on the lawn.'],
        ['table_restaurant', 'Outdoor table for breakfasts and dinners in the open air.'],
        ['park', 'Lawn, flowers and mountain views.']
      ]
    }
  }
};

function sp(key) {
  const base = spaceData[key];
  return LANG === 'en' && base.en ? Object.assign({}, base, base.en) : base;
}

const spaceModal = document.getElementById('spaceModal');
const spaceModalImg = document.getElementById('spaceModalImg');
const spaceModalCounter = document.getElementById('spaceModalCounter');
const spaceModalKicker = document.getElementById('spaceModalKicker');
const spaceModalTitle = document.getElementById('spaceModalTitle');
const spaceModalDesc = document.getElementById('spaceModalDesc');
const spaceModalList = document.getElementById('spaceModalList');
const spaceModalClose = document.querySelector('.space-modal-close');
const spaceModalPrev = document.querySelector('.space-modal-nav.prev');
const spaceModalNext = document.querySelector('.space-modal-nav.next');

let currentSpaceKey = '';
let currentSpacePhotoIndex = 0;

function showSpacePhoto() {
  const item = sp(currentSpaceKey);
  if (!item || !spaceModalImg) return;

  const photos = item.photos || [];
  const src = photos[currentSpacePhotoIndex] || 'assets/placeholder.svg';
  spaceModalImg.src = src;
  spaceModalImg.alt = item.title;

  if (spaceModalCounter) {
    spaceModalCounter.textContent = (currentSpacePhotoIndex + 1) + ' / ' + photos.length;
  }
}

function openSpaceModal(spaceKey) {
  const item = sp(spaceKey);
  if (!item || !spaceModal) return;

  currentSpaceKey = spaceKey;
  currentSpacePhotoIndex = 0;

  if (spaceModalKicker) spaceModalKicker.textContent = item.kicker;
  if (spaceModalTitle) spaceModalTitle.textContent = item.title;
  if (spaceModalDesc) spaceModalDesc.textContent = item.desc;

  if (spaceModalList) {
    spaceModalList.innerHTML = item.items.map(([icon, text]) => `
      <div><span class="material-symbols-outlined">${icon}</span><span>${text}</span></div>
    `).join('');
  }

  showSpacePhoto();
  spaceModal.classList.add('open');
  spaceModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeSpaceModal() {
  if (!spaceModal) return;
  spaceModal.classList.remove('open');
  spaceModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function nextSpacePhoto() {
  const item = sp(currentSpaceKey);
  if (!item || !item.photos.length) return;
  currentSpacePhotoIndex = (currentSpacePhotoIndex + 1) % item.photos.length;
  showSpacePhoto();
}

function prevSpacePhoto() {
  const item = sp(currentSpaceKey);
  if (!item || !item.photos.length) return;
  currentSpacePhotoIndex = (currentSpacePhotoIndex - 1 + item.photos.length) % item.photos.length;
  showSpacePhoto();
}

document.querySelectorAll('.space-card').forEach((card) => {
  card.addEventListener('click', () => openSpaceModal(card.dataset.space));
});

if (spaceModalClose) spaceModalClose.addEventListener('click', closeSpaceModal);
if (spaceModalNext) spaceModalNext.addEventListener('click', nextSpacePhoto);
if (spaceModalPrev) spaceModalPrev.addEventListener('click', prevSpacePhoto);

if (spaceModal) {
  spaceModal.addEventListener('click', (event) => {
    if (event.target === spaceModal) closeSpaceModal();
  });
}

document.addEventListener('keydown', (event) => {
  if (!spaceModal || !spaceModal.classList.contains('open')) return;
  if (event.key === 'Escape') closeSpaceModal();
  if (event.key === 'ArrowLeft') prevSpacePhoto();
  if (event.key === 'ArrowRight') nextSpacePhoto();
});


/* ---------------------------
   LINGUA IT / EN
---------------------------- */
const T_EN = {
  'doc.title': 'A Casa di Marco · Garden Cottage Escape in Salerno',
  'doc.desc': 'A Casa di Marco is a holiday home in Salerno with a private garden, free parking and an exclusive digital guide with local tips for making the most of Salerno during your stay.',
  'nav.menu': 'Open menu',
  'nav.casa': 'The house',
  'nav.guida': 'Digital guide',
  'nav.servizi': 'Services',
  'nav.foto': 'Photos',
  'nav.disp': 'Availability',
  'nav.dove': 'Where we are',
  'nav.rec': 'Reviews',
  'nav.prenota': 'Book',
  'hero.cta1': 'Book now',
  'hero.cta2': 'Message us on WhatsApp',
  'hero.scrollAria': 'Scroll to continue',
  'home.kicker': 'Welcome',
  'home.h2': 'Fresh, quiet, away from the chaos',
  'home.p1': '<strong>A Casa di Marco</strong> is your retreat in Salerno: an entire home with a private garden, off-street parking and comfortable spaces for up to 6 guests.',
  'home.p2': 'After the sea, the centre and the Coast, you come back here to a calmer, cooler and more private place: ideal for breathing, sleeping well and setting off again with more energy.',
  'home.chipsAria': 'Key facts about the house',
  'home.ch1': '<span class="material-symbols-outlined">cottage</span> Entire home',
  'home.ch2': '<span class="material-symbols-outlined">groups</span> Up to 6 guests',
  'home.ch3': '<span class="material-symbols-outlined">bed</span> 2 bedrooms · 4 beds',
  'home.ch4': '<span class="material-symbols-outlined">shower</span> 1 bathroom',
  'home.ch5': '<span class="material-symbols-outlined">child_care</span> 1 cot on request',
  'home.pointsAria': 'Highlights for relaxation',
  'home.pt1s': 'You sleep better',
  'home.pt1p': 'A quieter area, perfect for resting after a long day.',
  'home.pt2s': 'Private garden',
  'home.pt2p': 'An outdoor space of your own to truly switch off.',
  'home.pt3s': 'Privacy',
  'home.pt3p': 'Independent entrance, quiet, and spaces all to yourselves.',
  'guide.kicker': 'Included with your stay',
  'guide.h2': 'Your digital guide to experiencing Salerno',
  'guide.p1': 'A digital guide with local tips, places to see, restaurants, beaches and practical info.',
  'guide.p2': 'Everything a tap away on your phone, without wasting time on endless searches.',
  'guide.cta': 'Request availability',
  'guide.note': 'Preview only: the full guide is sent to guests.',
  'guide.previewAria': 'Digital guide preview',
  'guide.h3': 'Salerno guide',
  'guide.search': 'Search: restaurants, beaches, itineraries...',
  'guide.a1h': 'Where to eat',
  'guide.a1p': 'Hand-picked tips',
  'guide.a2h': 'What to see',
  'guide.a2p': 'Special corners',
  'guide.a3h': 'Sea and surroundings',
  'guide.a3p': 'Ideas for the day',
  'guide.a4h': 'Getting around',
  'guide.a4p': 'Practical info',
  'guide.locked': 'The full list with maps, tips and itineraries is shared after booking.',
  'svc.h2': 'Services and amenities',
  'svc.p': 'The important things, clear from the start.',
  'svc.f1h': 'Private garden',
  'svc.f1p': 'Your own outdoor space.',
  'svc.f2h': 'Parking',
  'svc.f2p': 'On-site and free.',
  'svc.f3h': 'Kitchen',
  'svc.f3p': 'Equipped for meals and breakfasts.',
  'svc.f4h': 'Coffee',
  'svc.f4p': 'Espresso and moka.',
  'svc.f5h': 'Wi-Fi',
  'svc.f5p': 'Connection included.',
  'svc.f6h': 'Air conditioning',
  'svc.f6p': 'Comfort in the warm months.',
  'svc.f7h': 'Washing machine',
  'svc.f7p': 'Useful for longer stays.',
  'svc.f8h': 'TV',
  'svc.f8p': 'For relaxing moments.',
  'svc.f9h': 'Cot',
  'svc.f9p': 'On request, 1 available.',
  'svc.f10h': 'Privacy',
  'svc.f10p': 'Independent entrance.',
  'svc.f11h': 'Digital guide',
  'svc.f11p': 'Local tips included.',
  'svc.f12h': 'Breakfast',
  'svc.f12p': 'On request.',
  'spazi.kicker': 'Spaces',
  'spazi.h2': 'Where you\u2019ll sleep and live in the house',
  'spazi.p': 'Bedrooms, bathroom, kitchen, veranda and garden: click each space to see photos and details.',
  'spazi.a1': 'Open details: Double bedroom',
  'spazi.t1': 'Double bedroom',
  'spazi.d1': '<strong>One double bed</strong> · sleeps 2.',
  'spazi.g1': 'Sleeps 2',
  'spazi.g2': 'Cot on request',
  'spazi.a2': 'Open details: Second bedroom',
  'spazi.t2': 'Second bedroom',
  'spazi.d2': '<strong>1.5-person futon</strong>, a single bed and a bunk bed.',
  'spazi.g3': 'Sleeps 4',
  'spazi.g4': 'Great for families',
  'spazi.a3': 'Open details: Bathroom',
  'spazi.t3': 'Bathroom',
  'spazi.d3': 'Practical bathroom with the essentials and a washing machine in the apartment.',
  'spazi.g5': 'Shower',
  'spazi.g6': 'Washing machine',
  'spazi.a4': 'Open details: Kitchen',
  'spazi.t4': 'Kitchen',
  'spazi.d4': 'A kitchen equipped for breakfasts, simple meals and longer stays.',
  'spazi.g7': 'Fully equipped',
  'spazi.g8': 'Coffee',
  'spazi.a5': 'Open details: Veranda',
  'spazi.t5': 'Veranda',
  'spazi.d5': '<strong>Covered dining room</strong> opening onto the garden.',
  'spazi.g9': 'Dining room',
  'spazi.g10': 'Garden view',
  'spazi.a6': 'Open details: Garden',
  'spazi.t6': 'Garden',
  'spazi.d6': '<strong>Lawn and lounge area</strong> with mountain views.',
  'spazi.g11': 'Lounge area',
  'spazi.g12': 'Meals outdoors',
  'aria.close': 'Close',
  'aria.prevPhoto': 'Previous photo',
  'aria.nextPhoto': 'Next photo',
  'modal.kicker': 'Space',
  'modal.title': 'Space details',
  'pos.kicker': 'Where we are',
  'pos.h2': 'Between city, coast and history.',
  'pos.p': 'From the city to the coast, from Greek temples to the villages of the Coast: on the left where we are, on the right the driving distances from the house.',
  'pos.mapH3': 'Brignano area, Salerno',
  'pos.mapAria': 'Map of the A Casa di Marco area',
  'pos.mapNote': 'The exact address is confirmed to guests before arrival.',
  'pos.mapBtn': 'Open area on Google Maps',
  'pos.i1h': 'Historic centre and seafront',
  'pos.i1p': 'The heart of Salerno: Via dei Mercanti, the cathedral and the seafront among cafés, restaurants and walks.',
  'pos.i1t': '<span class="material-symbols-outlined">directions_car</span> 2.7 km · ~10 min by car',
  'pos.i2p': 'The gateway to the Coast, famous for its colourful ceramics and a historic centre facing the sea.',
  'pos.i2t': '<span class="material-symbols-outlined">directions_car</span> 7.9 km · ~15 min by car',
  'pos.i3h': 'Amalfi Coast',
  'pos.i3p': 'Amalfi and Ravello, with villages suspended between mountain and sea, reachable by car.',
  'pos.i3t': '<span class="material-symbols-outlined">directions_car</span> 27.2 km · ~30 min by car',
  'pos.i4p': 'The best-preserved Greek temples in Italy and the archaeological museum, in the Sele plain.',
  'pos.i4t': '<span class="material-symbols-outlined">directions_car</span> 39.3 km · ~55 min by car',
  'pos.i5p': 'The archaeological site buried by the eruption of 79 AD: houses, shops and frescoes still legible.',
  'pos.i5t': '<span class="material-symbols-outlined">directions_car</span> 32 km · ~35 min by car',
  'pos.i6p': 'Wild coast, stone villages and a National Park: the calmer alternative to the Coast.',
  'pos.i6t': '<span class="material-symbols-outlined">directions_car</span> 67.5 km · ~80 min by car',
  'pos.i7s': 'Summer',
  'pos.i7h': 'The sea',
  'pos.i7p': 'In summer the sea is close: Salerno\u2019s beaches and seafront, a short drive away.',
  'pos.i7t': '<span class="material-symbols-outlined">directions_car</span> 4.1 km · ~10 min by car',
  'pos.i8s': 'Winter',
  'pos.i8h': 'Luci d\u2019Artista',
  'pos.i8p': 'In winter the historic centre lights up with Luci d\u2019Artista: the route along Via Roma and the seafront, from November to January.',
  'pos.i8t': '<span class="material-symbols-outlined">directions_car</span> 4.1 km · ~9 min by car',
  'foto.kicker': 'Gallery',
  'foto.h2': 'A look inside the house',
  'disp.kicker': 'Availability',
  'disp.h2': 'When would you like to come?',
  'disp.p': 'Check free and busy dates, pick a date in the calendar and send your request.',
  'disp.ariaPrevM': 'Previous month',
  'disp.miniLabel': 'Availability',
  'disp.ariaNextM': 'Next month',
  'disp.todayBtn': 'Back to this month',
  'disp.legendAria': 'Calendar legend',
  'disp.free': '<i class="dot free"></i> Free',
  'disp.busy': '<i class="dot busy"></i> Busy',
  'disp.past': '<i class="dot past"></i> Past',
  'disp.w1': 'Mon',
  'disp.w2': 'Tue',
  'disp.w3': 'Wed',
  'disp.w4': 'Thu',
  'disp.w5': 'Fri',
  'disp.w6': 'Sat',
  'disp.w7': 'Sun',
  'disp.gridAria': 'Availability calendar',
  'disp.note': 'Busy dates are read from the calendar linked to Booking and Airbnb. Updates may not be immediate: availability must always be confirmed before booking.',
  'disp.lblName': 'Name',
  'disp.phName': 'Your name',
  'disp.lblIn': 'Arrival',
  'disp.lblOut': 'Departure',
  'disp.lblAdults': 'Adults',
  'disp.ad1': '1 adult',
  'disp.ad2': '2 adults',
  'disp.ad3': '3 adults',
  'disp.ad4': '4 adults',
  'disp.ad5': '5 adults',
  'disp.ad6': '6 adults',
  'disp.lblChildren': 'Children',
  'disp.agesTitle': 'Children\u2019s ages',
  'disp.cot': 'I would like a cot for a child up to 3 years old, if available. Maximum 1 cot available.',
  'disp.lblSource': 'Where did you find us?',
  'disp.srcPass': 'Word of mouth',
  'disp.srcOther': 'Other',
  'disp.lblBreakfast': 'Breakfast',
  'disp.brkNo': 'No, thank you',
  'disp.brkYes': 'Yes, I would like information',
  'disp.lblMsg': 'Message',
  'disp.phMsg': 'Tell us about any special requests',
  'disp.submit': 'Send request on WhatsApp',
  'disp.smallNote': 'This request is not an instant booking: we will confirm availability and price for you. The city tax is not included.',
  'info.kicker': 'Good to know',
  'info.h2': 'Useful information',
  'info.t1': 'Check-in and check-out',
  'info.d1': 'Check-in between 3:00 PM and 10:00 PM. Check-out by 10:00 AM.',
  'info.t2': 'Capacity',
  'info.d2': 'Up to 6 guests. The cot is available on request and subject to availability.',
  'info.t3': 'Breakfast',
  'info.d3': 'Breakfast is not included in the price, but can be requested for a supplement through a partner café.',
  'info.t4': 'City tax',
  'info.d4': 'Salerno municipality: \u20ac3.00 per person per night. Children under 12 stay free.',
  'info.t5': 'Property code',
  'info.t6': 'Guide and support',
  'info.d6': 'Before and during your stay you get support via WhatsApp and access to the digital guide with local tips.',
  'rec.kicker': 'Reviews',
  'rec.h2': 'What guests appreciate',
  'rec.p': 'Original reviews published by guests on Booking and Airbnb.',
  'rec.s1': '4.88/5',
  'rec.s1p': '17 reviews · Guest favourite · Superhost',
  'rec.s2': '9.0/10',
  'rec.s2p': '15 reviews · Wonderful',
  'rec.attrT': '\u2013 Tobias, Switzerland · Booking',
  'rec.attrM': '\u2013 Maria, France · Booking',
  'rec.attrV': '\u2013 Vincenzo, Italy · Booking',
  'rec.seeB': 'See on Booking',
  'rec.seeA': 'See on Airbnb',
  'cont.kicker': 'Contact',
  'cont.h2': 'Write to us about your stay',
  'cont.p': 'For a direct request, the fastest way is WhatsApp.',
  'wa.aria': 'Message us on WhatsApp',
  'lb.ariaPrev': 'Previous',
  'lb.ariaNext': 'Next'
};

const I18N_ORIG = new Map();

function swapMarker(el, type, enVal) {
  if (enVal == null) return;
  if (LANG === 'en') {
    if (!I18N_ORIG.has(el)) I18N_ORIG.set(el, {});
    const saved = I18N_ORIG.get(el);
    if (!(type in saved)) saved[type] = type === 'html' ? el.innerHTML : el.getAttribute(type);
    if (type === 'html') el.innerHTML = enVal;
    else el.setAttribute(type, enVal);
  } else if (I18N_ORIG.has(el) && type in I18N_ORIG.get(el)) {
    const saved = I18N_ORIG.get(el);
    if (type === 'html') el.innerHTML = saved[type];
    else el.setAttribute(type, saved[type]);
  }
}

function applyLang() {
  const en = LANG === 'en';
  document.documentElement.lang = LANG;
  document.documentElement.dataset.lang = LANG;
  document.querySelectorAll('[data-i18n]').forEach((el) => swapMarker(el, 'html', T_EN[el.dataset.i18n]));
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => swapMarker(el, 'placeholder', T_EN[el.dataset.i18nPh]));
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => swapMarker(el, 'aria-label', T_EN[el.dataset.i18nAria]));
  document.querySelectorAll('[data-i18n-title]').forEach((el) => swapMarker(el, 'title', T_EN[el.dataset.i18nTitle]));
  document.querySelectorAll('[data-i18n-content]').forEach((el) => swapMarker(el, 'content', T_EN[el.dataset.i18nContent]));
  const sw = document.getElementById('langSwitch');
  if (sw) {
    sw.setAttribute('aria-pressed', en ? 'true' : 'false');
    sw.setAttribute('aria-label', en ? 'Switch to Italian' : 'Passa all\u2019inglese');
  }
}

function setLang(l) {
  LANG = l;
  try { localStorage.setItem('lang', l); } catch (e) {}
  applyLang();
  renderCalendar();
  updateChildrenCountOptions();
  if (spaceModal && spaceModal.classList.contains('open') && currentSpaceKey) {
    const idx = currentSpacePhotoIndex;
    openSpaceModal(currentSpaceKey);
    currentSpacePhotoIndex = idx;
    showSpacePhoto();
  }
}

const langSwitch = document.getElementById('langSwitch');
if (langSwitch) langSwitch.addEventListener('click', () => setLang(LANG === 'en' ? 'it' : 'en'));

applyLang();
