# Anteprima cinematografica — A Casa di Marco

La home è stata aggiornata localmente. Nessun push o deploy sul sito pubblico.

## Anteprima

Avviare dalla cartella del sito: `python -m http.server 4174 --bind 127.0.0.1`.
Aprire http://127.0.0.1:4174. Non serve una build né installare dipendenze JavaScript.

## Esperienza

- Palette originale: verde bosco, crema, sabbia.
- Filmato iniziale di 24 secondi, composto da quattro scene con brevi dissolvenze.
- Ripresa orizzontale sul desktop e verticale su smartphone; viene caricata una sola variante.
- Avvio silenzioso, pausa manuale e automatica fuori schermo; immagine statica per movimento ridotto e risparmio dati.
- Tour integrale su richiesta, con controlli e inquadratura intera. Audio ambientale rimosso.
- Foto WebP con caricamento differito, conservando gli originali.
- Lingue italiano/inglese, gallerie, guida digitale e richiesta di soggiorno via WhatsApp conservate.
- Controlli su date e capienza; calendario non disponibile indica date da verificare.

La richiesta resta una richiesta di disponibilità: prezzo e conferma sono gestiti dall'host. Non è stato aggiunto un checkout con pagamenti o tariffe inventate.

## File

- `cinematic.css`: nuovo aspetto responsive, caricato dopo lo stile originale.
- `cinematic.js`: video, tour accessibile, traduzioni e validazione date.
- `assets/video/`: due montaggi brevi, due tour integrali e due poster.
- `scripts/prepare-video.py`: montaggio riproducibile con FFmpeg; gli originali restano in Downloads.
- `scripts/prepare-photos.py`: conversione foto con Pillow.

Per rigenerare i video: `python scripts/prepare-video.py --ffmpeg PERCORSO_FFMPEG --source CARTELLA_VIDEO`.
Per rigenerare le foto: `python scripts/prepare-photos.py`.

## Verifiche

Verificati nel browser: video desktop/mobile, tour interi, menu mobile, cambio lingua, date invertite, capienza massima e calendario collegato. Nessuna richiesta WhatsApp inviata durante i controlli.

## Selezione foto e guida

Controllate visivamente le 53 foto originali. La galleria principale usa una selezione di 18 scatti; i sei ambienti hanno gallerie dedicate con 26 foto complessive. La matrimoniale n. 9, capovolta e priva di orientamento EXIF, è stata esclusa in favore della n. 10, che mostra correttamente la stessa zona. Esclusi dalla presentazione gli scatti più scuri e diversi doppioni; nessun originale eliminato o alterato. Galleria e dettagli mostrano le immagini intere con `object-fit: contain`.

La guida è presentata su un telefono che ruota dal retro allo schermo seguendo lo scorrimento della pagina. Le quattro categorie aprono il contenuto dimostrativo in un dialog accessibile. Con la preferenza di movimento ridotto il telefono mostra subito lo schermo, senza animazione. La demo rimane esplicitamente identificata come fittizia; la guida completa riservata agli ospiti non è stata pubblicata.
