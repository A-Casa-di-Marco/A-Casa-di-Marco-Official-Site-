
/* Self-contained fictional public demo: no requests to the guest guide. */
(() => {
  const root = document.getElementById('guideDemo');
  if (!root) return;
  const categories = [
    ['food', 'restaurant', 'Dove mangiare', 'Where to eat', [
      ['Trattoria delle Nuvole', 'Cucina di terra · €€', 'Traditional cooking · €€', 'Una trattoria immaginaria con pasta fatta in casa e sapori di stagione.', 'An imaginary trattoria with homemade pasta and seasonal flavours.'],
      ['Osteria del Sole Blu', 'Cucina di mare · €€', 'Seafood · €€', 'Un locale inventato per mostrarti come presentiamo i consigli di mare.', 'A fictional restaurant showing how we present our seafood tips.']]],
    ['places', 'explore', 'Da scoprire', 'Places to explore', [
      ['Giardino dei Venti', 'Natura · demo', 'Nature · demo', 'Un giardino immaginario per una passeggiata tra verde e panorami.', 'An imaginary garden for a walk among greenery and views.'],
      ['Borgo delle Lanterne', 'Cultura · demo', 'Culture · demo', 'Un borgo di fantasia per illustrare le schede dei luoghi da visitare.', 'A fictional village illustrating our cards for places to visit.']]],
    ['shops', 'shopping_basket', 'La spesa', 'Groceries', [
      ['Market delle Nuvole', 'Supermercato · demo', 'Supermarket · demo', 'Un supermercato inventato per rappresentare le informazioni per la spesa.', 'A fictional supermarket illustrating grocery information.'],
      ['Bottega del Sole Blu', 'Bottega · demo', 'Local shop · demo', 'Una bottega immaginaria con pane, frutta e prodotti per la giornata.', 'An imaginary shop with bread, fruit and everyday groceries.']]],
    ['pharmacy', 'local_pharmacy', 'Farmacie', 'Pharmacies', [
      ['Farmacia delle Nuvole', 'Farmacia · demo', 'Pharmacy · demo', 'Nome inventato. La guida ospiti contiene le informazioni sulle farmacie reali.', 'Fictional name. The guest guide contains information about real pharmacies.'],
      ['Farmacia del Sole Blu', 'Farmacia · demo', 'Pharmacy · demo', 'Scheda dimostrativa, senza indirizzi, recapiti o orari reali.', 'Demo card without real addresses, contact details or opening hours.']]]
  ];
  let active = null;
  const en = () => document.documentElement.lang === 'en';
  const t = (it, english) => en() ? english : it;
  function render(focus) {
    const item = categories.find(c => c[0] === active);
    root.innerHTML = `
      <span class="guide-label">A Casa di Marco · DEMO</span>
      <p class="guide-demo-notice">${t('Anteprima dimostrativa · Luoghi e informazioni inventati', 'Demo preview · Fictional places and information')}</p>
      ${item ? `
        <button class="guide-demo-back" type="button"><span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>${t('Torna al menu', 'Back to menu')}</button>
        <h3 class="guide-demo-title" tabindex="-1">${item[en() ? 3 : 2]}</h3>
        <p class="guide-demo-intro">${t('Due esempi per provare la guida.', 'Two examples to try the guide.')}</p>
        <div class="guide-demo-cards">${item[4].map(c => `
          <article class="guide-demo-card"><span class="guide-demo-meta">${c[en() ? 2 : 1]}</span><h4>${c[0]}</h4><p>${c[en() ? 4 : 3]}</p></article>
        `).join('')}</div>
      ` : `
        <h3 class="guide-demo-title" tabindex="-1">${t('Il tuo soggiorno', 'Your stay')}</h3>
        <p class="guide-demo-intro">${t('Tocca una sezione e prova la guida.', 'Tap a section and try the guide.')}</p>
        <div class="guide-preview-grid">${categories.map(c => `
          <button class="guide-demo-category" type="button" data-guide-category="${c[0]}"><span class="material-symbols-outlined" aria-hidden="true">${c[1]}</span><strong>${c[en() ? 3 : 2]}</strong><small>${t('2 esempi', '2 examples')} <span aria-hidden="true">↗</span></small></button>
        `).join('')}</div>
      `}
      <div class="locked-tip"><span class="material-symbols-outlined" aria-hidden="true">lock</span><p>${t('La guida completa con i nostri consigli viene inviata agli ospiti.', 'The full guide with our tips is sent to guests.')}</p></div>`;
    root.scrollTop = 0;
    if (focus === 'title') root.querySelector('h3').focus({ preventScroll: true });
    else if (focus) root.querySelector('[data-guide-category="' + focus + '"]')?.focus({ preventScroll: true });
  }
  root.addEventListener('click', event => {
    const button = event.target.closest('[data-guide-category], .guide-demo-back');
    if (!button) return;
    const previous = active;
    active = button.dataset.guideCategory || null;
    render(active ? 'title' : previous);
  });
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && active) {
      event.preventDefault(); event.stopPropagation();
      const previous = active; active = null; render(previous);
    }
  });
  const dialog = document.getElementById('guideDialog');
  const openGuide = category => {
    active = category;
    dialog.showModal();
    render('title');
  };
  document.getElementById('guideExplore')?.addEventListener('click', () => openGuide(null));
  document.querySelectorAll('[data-guide-open]').forEach(button => button.addEventListener('click', () => openGuide(button.dataset.guideOpen)));
  document.getElementById('guideClose')?.addEventListener('click', () => dialog.close());
  new MutationObserver(() => render()).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  render();
})();
