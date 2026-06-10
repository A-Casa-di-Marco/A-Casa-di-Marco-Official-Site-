const CALENDAR_FEED_URL = 'INCOLLA_QUI_URL_APPS_SCRIPT';
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

const monthNames = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
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
    if (ymd === selectedStart || ymd === selectedEnd) cell.classList.add('selected');
    cell.disabled = isPast || isBusy;
    cell.innerHTML = `<span class="day-number">${day}</span><span class="day-state">${isPast ? 'Passata' : isBusy ? 'Occupata' : 'Libera'}</span>`;
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
    if (calendarStatus) calendarStatus.textContent = 'Check-in selezionato. Ora scegli una data di check-out libera.';
  } else {
    if (ymd <= selectedStart) {
      selectedStart = ymd;
      if (checkinInput) checkinInput.value = ymd;
      if (calendarStatus) calendarStatus.textContent = 'Check-in aggiornato. Ora scegli una data di check-out successiva.';
    } else if (hasBusyDateBetween(selectedStart, ymd)) {
      if (calendarStatus) calendarStatus.textContent = 'Tra le date selezionate ci sono giorni occupati. Scegli un periodo senza date occupate.';
    } else {
      selectedEnd = ymd;
      if (checkoutInput) checkoutInput.value = ymd;
      if (calendarStatus) calendarStatus.textContent = `Periodo selezionato: ${formatItalianDate(selectedStart)} - ${formatItalianDate(selectedEnd)}.`;
    }
  }

  renderCalendar();
}

function loadAvailability() {
  if (!CALENDAR_FEED_URL || CALENDAR_FEED_URL.includes('INCOLLA_QUI')) {
    if (calendarStatus) calendarStatus.textContent = 'Calendario dimostrativo: collega Apps Script per leggere automaticamente Booking e Airbnb.';
    renderCalendar();
    return;
  }

  const callbackName = 'calendarCallback_' + Date.now();

  window[callbackName] = function(data) {
    const list = Array.isArray(data.occupied) ? data.occupied : [];
    occupiedDates = new Set(list);
    if (calendarStatus) calendarStatus.textContent = `Disponibilità aggiornata. Date occupate caricate: ${list.length}.`;
    renderCalendar();
    delete window[callbackName];
    script.remove();
  };

  const script = document.createElement('script');
  script.src = CALENDAR_FEED_URL + (CALENDAR_FEED_URL.includes('?') ? '&' : '?') + 'callback=' + callbackName;
  script.onerror = function() {
    if (calendarStatus) calendarStatus.textContent = 'Non riesco a caricare il calendario. Riprova più tardi o scrivici su WhatsApp.';
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

const childrenCountSelect = document.getElementById('childrenCount');
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

function updateCotVisibility() {
  if (!childrenAges || !cotBox) return;
  const ageSelects = Array.from(childrenAges.querySelectorAll('.child-age-select'));
  const hasSmallChild = ageSelects.some((select) => Number(select.value) <= 3);
  cotBox.classList.toggle('hidden', !hasSmallChild);
  if (!hasSmallChild && cotRequest) cotRequest.checked = false;
}

function renderChildrenAges() {
  if (!childrenCountSelect || !childrenBox || !childrenAges) return;

  const count = Number(childrenCountSelect.value);
  childrenAges.innerHTML = '';

  if (count <= 0) {
    childrenBox.classList.add('hidden');
    if (cotBox) cotBox.classList.add('hidden');
    if (cotRequest) cotRequest.checked = false;
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
}

if (childrenCountSelect) {
  childrenCountSelect.addEventListener('change', renderChildrenAges);
  renderChildrenAges();
}

const bookingRequestForm = document.getElementById('bookingRequestForm');

if (bookingRequestForm) {
  bookingRequestForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const name = document.getElementById('guestName').value.trim();
    const checkin = document.getElementById('checkin').value;
    const checkout = document.getElementById('checkout').value;
    const adults = document.getElementById('adults').value;
    const childrenCount = document.getElementById('childrenCount').value;
    const source = document.getElementById('source').value;
    const breakfastInterest = document.getElementById('breakfastInterest').value;
    const message = document.getElementById('message').value.trim();

    const ageSelects = Array.from(document.querySelectorAll('.child-age-select'));
    const childrenAgesText = ageSelects.map((select, index) => `Bambino ${index + 1}: ${select.value} anni`).join(', ');
    const cotText = cotRequest && cotRequest.checked ? 'Sì, richiedo la culla se disponibile' : 'No';

    const text = [
      'Ciao, vorrei richiedere disponibilità per A Casa di Marco.',
      '',
      'Nome: ' + name,
      'Check-in: ' + formatItalianDate(checkin),
      'Check-out: ' + formatItalianDate(checkout),
      'Adulti: ' + adults,
      'Bambini: ' + childrenCount,
      childrenAgesText ? 'Età bambini: ' + childrenAgesText : '',
      Number(childrenCount) > 0 ? 'Culla: ' + cotText : '',
      'Colazione: ' + breakfastInterest,
      'Vi ho trovati tramite: ' + source,
      message ? 'Richieste: ' + message : ''
    ].filter(Boolean).join('\n');

    window.open('https://wa.me/393923064010?text=' + encodeURIComponent(text), '_blank');
  });
}

renderCalendar();
loadAvailability();
