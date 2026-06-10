const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('show');
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => navLinks.classList.remove('show'));
  });
}

const currentYear = document.getElementById('currentYear');

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

function formatItalianDate(dateValue) {
  if (!dateValue) return '';

  const date = new Date(dateValue + 'T12:00:00');

  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

const bookingRequestForm = document.getElementById('bookingRequestForm');

if (bookingRequestForm) {
  bookingRequestForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const name = document.getElementById('guestName').value.trim();
    const checkin = document.getElementById('checkin').value;
    const checkout = document.getElementById('checkout').value;
    const guests = document.getElementById('guests').value;
    const source = document.getElementById('source').value;
    const message = document.getElementById('message').value.trim();

    const text = [
      'Ciao, vorrei richiedere disponibilità per A Casa di Marco.',
      '',
      'Nome: ' + name,
      'Check-in: ' + formatItalianDate(checkin),
      'Check-out: ' + formatItalianDate(checkout),
      'Ospiti: ' + guests,
      'Vi ho trovati tramite: ' + source,
      message ? 'Richieste: ' + message : ''
    ].filter(Boolean).join('\n');

    const whatsappUrl = 'https://wa.me/393923064010?text=' + encodeURIComponent(text);

    window.open(whatsappUrl, '_blank');
  });
}