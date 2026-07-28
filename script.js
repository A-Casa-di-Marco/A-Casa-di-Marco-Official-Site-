const CALENDAR_FEED_URL = 'https://script.google.com/macros/s/AKfycbzaikXcMmx1sPsPkQw3Id2Wa31qeMNIfA1IpqDV-KPW4eA5ViM8P8SkXEYbdpEqFZ5o/exec';
const FALLBACK_OCCUPIED_DATES = [];

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
  return fromYMD(dateValue).toLocaleDateString('it-IT', {
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

  calendarTitle.textContent = `${monthNames[month]} ${year}`;

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
      <span class="day-state">${isPast ? 'Passata' : isBusy ? 'Occupata' : 'Libera'}</span>
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
      calendarStatus.textContent = 'Check-in selezionato. Ora scegli una data di check-out libera.';
    }
  } else {
    if (ymd <= selectedStart) {
      selectedStart = ymd;

      if (checkinInput) checkinInput.value = ymd;

      if (calendarStatus) {
        calendarStatus.textContent = 'Check-in aggiornato. Ora scegli una data di check-out successiva.';
      }
    } else if (hasBusyDateBetween(selectedStart, ymd)) {
      if (calendarStatus) {
        calendarStatus.textContent = 'Tra le date selezionate ci sono giorni occupati. Scegli un periodo senza date occupate.';
      }
    } else {
      selectedEnd = ymd;

      if (checkoutInput) checkoutInput.value = ymd;

      if (calendarStatus) {
        calendarStatus.textContent = `Periodo selezionato: ${formatItalianDate(selectedStart)} - ${formatItalianDate(selectedEnd)}.`;
      }
    }
  }

  renderCalendar();
}

function loadAvailability() {
  if (!CALENDAR_FEED_URL || CALENDAR_FEED_URL.includes('INCOLLA_QUI')) {
    if (calendarStatus) {
      calendarStatus.textContent = 'Calendario dimostrativo: collega Apps Script per leggere automaticamente Booking e Airbnb.';
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
      calendarStatus.textContent = `Disponibilità aggiornata. Date occupate caricate: ${list.length}.`;
    }

    renderCalendar();
    delete window[callbackName];
    script.remove();
  };

  script.src = CALENDAR_FEED_URL + (CALENDAR_FEED_URL.includes('?') ? '&' : '?') + 'callback=' + callbackName;
  script.onerror = function() {
    if (calendarStatus) {
      calendarStatus.textContent = 'Non riesco a caricare il calendario. Riprova più tardi o scrivici su WhatsApp.';
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
  let html = '<option value="0">0 anni</option>';
  html += '<option value="1">1 anno</option>';

  for (let i = 2; i <= 17; i++) {
    html += `<option value="${i}">${i} anni</option>`;
  }

  return html;
}

function updateGuestLimitNote() {
  if (!guestLimitNote || !adultsSelect || !childrenCountSelect) return;

  const adults = Number(adultsSelect.value);
  const children = Number(childrenCountSelect.value);
  const total = adults + children;
  const remainingChildren = Math.max(0, MAX_TOTAL_GUESTS - adults);

  guestLimitNote.textContent =
    `Massimo ${MAX_TOTAL_GUESTS} persone totali, bambini inclusi. ` +
    `Con ${adults} ${adults === 1 ? 'adulto' : 'adulti'} puoi aggiungere al massimo ` +
    `${remainingChildren} ${remainingChildren === 1 ? 'bambino' : 'bambini'}. ` +
    `Totale selezionato: ${total}/${MAX_TOTAL_GUESTS}.`;
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
      option.textContent = 'Nessun bambino';
    } else if (i === 1) {
      option.textContent = '1 bambino';
    } else {
      option.textContent = `${i} bambini`;
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
      <label for="childAge${i}">Età bambino ${i}</label>
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
    const source = document.getElementById('source').value;
    const breakfastInterest = document.getElementById('breakfastInterest').value;
    const message = document.getElementById('message').value.trim();

    const totalGuests = adults + childrenCount;

    if (totalGuests > MAX_TOTAL_GUESTS) {
      alert(`La richiesta può essere inviata per massimo ${MAX_TOTAL_GUESTS} persone totali, bambini inclusi.`);
      return;
    }

    const ageSelects = Array.from(document.querySelectorAll('.child-age-select'));
    const childrenAgesText = ageSelects
      .map((select, index) => `Bambino ${index + 1}: ${select.value} anni`)
      .join(', ');

    const hasSmallChild = ageSelects.some((select) => Number(select.value) <= 3);
    const cotText = hasSmallChild
      ? (cotRequest && cotRequest.checked
          ? `Sì, richiedo ${MAX_COTS} culla se disponibile`
          : 'No')
      : 'Non necessaria';

    const text = [
      'Ciao, vorrei richiedere disponibilità per A Casa di Marco.',
      '',
      'Nome: ' + name,
      'Check-in: ' + formatItalianDate(checkin),
      'Check-out: ' + formatItalianDate(checkout),
      'Adulti: ' + adults,
      'Bambini: ' + childrenCount,
      'Totale ospiti: ' + totalGuests + '/' + MAX_TOTAL_GUESTS,
      childrenAgesText ? 'Età bambini: ' + childrenAgesText : '',
      childrenCount > 0 ? 'Culla: ' + cotText : '',
      'Colazione: ' + breakfastInterest,
      'Vi ho trovati tramite: ' + source,
      message ? 'Richieste: ' + message : ''
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
    photos: ['assets/camera-matrimoniale-1.jpg', 'assets/camera-matrimoniale-2.jpg', 'assets/camera-matrimoniale-3.jpg'],
    items: [
      ['king_bed', '1 letto matrimoniale: può ospitare 2 persone.'],
      ['child_care', 'Culla su richiesta: 1 disponibile, ideale per bambini piccoli.'],
      ['nights_stay', 'Ambiente tranquillo per riposare dopo una giornata fuori.']
    ]
  },
  camera2: {
    kicker: 'Seconda camera',
    title: 'Camera 2 · fino a 4 posti letto',
    desc: 'La seconda camera è più flessibile ed è adatta a bambini, ragazzi o piccoli gruppi. I posti letto sono distribuiti tra futon, lettino singolo e letto rialzato.',
    photos: ['assets/camera-2-1.jpg', 'assets/camera-2-2.jpg', 'assets/camera-2-3.jpg'],
    items: [
      ['bed', 'Futon piazza e mezzo: può ospitare fino a 2 persone.'],
      ['single_bed', 'Lettino singolo: 1 posto letto.'],
      ['bedroom_child', 'Letto rialzato a castello: 1 posto letto.'],
      ['family_restroom', 'Soluzione comoda per famiglie o gruppi fino a 6 ospiti totali.']
    ]
  },
  bagno: {
    kicker: 'Bagno',
    title: 'Bagno funzionale',
    desc: 'Bagno pratico e organizzato, con i servizi utili per il soggiorno e la lavatrice a disposizione degli ospiti.',
    photos: ['assets/bagno-1.jpg', 'assets/bagno-2.jpg', 'assets/bagno-3.jpg'],
    items: [
      ['shower', 'Doccia e servizi essenziali.'],
      ['local_laundry_service', 'Lavatrice disponibile nell’alloggio.'],
      ['cleaning_services', 'Ideale anche per soggiorni di più giorni.']
    ]
  },
  cucina: {
    kicker: 'Cucina',
    title: 'Cucina attrezzata',
    desc: 'Una cucina utile per colazioni, pasti semplici e soggiorni più lunghi. Perfetta se preferite avere autonomia durante la vacanza.',
    photos: ['assets/cucina-1.jpg', 'assets/cucina-2.jpg', 'assets/cucina-3.jpg', 'assets/cucina-4.jpg', 'assets/cucina-5.jpg'],
    items: [
      ['cooking', 'Cucina attrezzata per preparare pasti e colazioni.'],
      ['coffee', 'Macchina caffè e moka.'],
      ['restaurant', 'Tavolo e spazio per mangiare in casa.'],
      ['kitchen', 'Utile per famiglie e soggiorni di più giorni.']
    ]
  }
};

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
  const item = spaceData[currentSpaceKey];
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
  const item = spaceData[spaceKey];
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
  const item = spaceData[currentSpaceKey];
  if (!item || !item.photos.length) return;
  currentSpacePhotoIndex = (currentSpacePhotoIndex + 1) % item.photos.length;
  showSpacePhoto();
}

function prevSpacePhoto() {
  const item = spaceData[currentSpaceKey];
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
