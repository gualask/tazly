# Tazly

Una **Chrome New Tab extension** per gestire progetti e task in modo più strutturato di una todo classica, ma più leggero di Trello, Jira o ClickUp.

Ogni nuova scheda del browser diventa il tuo spazio di lavoro: vedi i progetti, le categorie e i task aperti senza modali, senza distrazioni.

## Modello

```
Board
  Progetto
    Categoria
      Task (con tag)
```

- **Tag controllati**: niente tag liberi. Li definisci in una schermata dedicata (nome, colore, descrizione, ordine) e li usi nei task tramite autocomplete.
- **Quick-add strutturata**: una barra in cima a ogni progetto guida l'inserimento in 3 step (categoria → testo → tag) confermati con `Tab`. Oppure la sintassi rapida `Categoria: testo #tag` in una riga sola.
- **Modalità focus**: un click sull'icona del progetto lo porta in primo piano con sidebar laterale degli altri progetti.
- **Filtri**: per stato (aperti/fatti/tutti) e per tag (multi-select).
- **Layout adattivo**: griglia 1/2/3 colonne in base al numero di progetti, sidebar in focus mode.
- **Persistenza locale**: tutto salvato in `chrome.storage.local`, niente account né server.

## Installazione

L'estensione non è ancora pubblicata sul Chrome Web Store. Per ora si carica come "unpacked":

1. Clona il repository e installa le dipendenze:
   ```bash
   pnpm install
   pnpm build
   ```
2. Apri `chrome://extensions` in Chrome.
3. Attiva **Developer mode** (toggle in alto a destra).
4. Click su **Load unpacked** e seleziona la cartella `dist/`.
5. Apri una nuova scheda → Tazly.

Per aggiornare l'estensione dopo aver fatto `pnpm build`, torna su `chrome://extensions` e clicca l'icona ⟳ Reload sulla card di Tazly.

## Utilizzo rapido

1. Vai sulla tab **Tag** e crea i tag che userai (es. `bug` rosso, `feature` blu, `doubt` viola).
2. Torna sulla tab **Board** e crea un progetto.
3. Nella barra in cima al progetto:
   - Scrivi una **categoria** (es. `Search`) → `Tab`
   - Scrivi il **testo del task** → `Tab`
   - Seleziona uno o più **tag** dall'autocomplete → `Invio` per creare
4. In alternativa, scrivi tutto in una riga: `Search: si resetta la pagina #bug` + `Invio`.

### Scorciatoie tastiera nella quick-add

| Tasto | Azione |
|---|---|
| `Tab` | Conferma il campo corrente e passa al successivo |
| `Shift+Tab` | Torna al campo precedente |
| `Backspace` su campo vuoto | Riapre/modifica il badge precedente |
| `↑` / `↓` | Naviga nei suggerimenti |
| `Invio` | Conferma il suggerimento corrente, o crea il task se tutti i campi sono pieni |
| `Esc` | Annulla l'inserimento |

### Filtri

La barra filtri sopra i progetti permette di filtrare i task visibili per:
- **Stato**: Tutti / Aperti / Fatti
- **Tag**: click su un tag per aggiungerlo al filtro (più tag = match OR)

I filtri sono globali a tutta la board.

### Modalità focus

Click sull'icona ⛶ accanto al titolo di un progetto. Il progetto diventa grande al centro, gli altri progetti compaiono in una sidebar a sinistra per switch rapido. Click sull'icona ⛚ per uscire.

## Stato del progetto

MVP funzionante con persistenza locale. Roadmap non ancora pubblicata.

Manca rispetto al disegno iniziale:
- drag & drop per riordinare progetti / categorie / task
- sync su account remoto (al momento solo storage locale per device)

## Sviluppo

Per chi vuole contribuire o eseguire l'app in modalità sviluppo, vedi [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md).
