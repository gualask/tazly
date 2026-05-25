# Sviluppo

Guida operativa per chi lavora sul codice di Tazly.

## Stack

- **Vite 8** (con Rolldown) come bundler e dev server
- **React 19** + **TypeScript**
- **Tailwind v4** (plugin `@tailwindcss/vite`, no `tailwind.config.js` — token in `src/index.css`)
- **shadcn/ui** stile (componenti copiati in `src/components/ui`, non importati come dipendenza)
- **Zustand** + `persist` middleware per stato e persistenza
- **`@crxjs/vite-plugin`** per il bundling come estensione Chrome MV3
- **Biome** per format e lint (niente ESLint, niente Prettier)
- **Tabler Icons** per le icone

## Comandi

```bash
pnpm install                 # installa dipendenze
pnpm dev                     # dev server con HMR
pnpm build                   # build di produzione in dist/
pnpm preview                 # preview del build (NON è l'estensione caricata in Chrome)
pnpm lint                    # biome check
pnpm format                  # biome format --write
```

## Workflow Chrome Extension

L'estensione si carica come "unpacked" da `chrome://extensions`. Esistono due modalità:

### Dev mode (con HMR)

1. `pnpm dev` — Vite gira su `localhost:5173`. **Non aprire** quell'URL nel browser come app normale (è solo per servire i moduli all'estensione).
2. In `chrome://extensions` → "Load unpacked" → seleziona `dist/`. CRX rigenera `dist/` ogni volta che `pnpm dev` parte.
3. Click sull'icona **Tazly** nella toolbar → si apre la tab dell'app (il service worker la apre on-demand).
4. Modifiche a `.tsx` / `.css` / store: HMR aggiorna la scheda automaticamente.
5. Modifiche a `manifest.ts` / `vite.config.ts` / `package.json`: ferma `pnpm dev`, rilancia, poi ⟳ Reload sull'estensione in `chrome://extensions`.

### Production mode

1. `pnpm build` — `dist/` autosufficiente, niente riferimenti a localhost.
2. ⟳ Reload sull'estensione (o "Load unpacked" la prima volta).
3. Ogni volta che vuoi aggiornare, rifai `pnpm build` + Reload.

> Cosa fare quando vedi **"Service worker registration failed. Status code: 3"**: significa che `dist/` è in stato dev (referenzia `localhost:5173`) ma il dev server non gira. Lancia `pnpm dev` oppure fai un `pnpm build` pulito.

### CORS in dev

`vite.config.ts` whitelista l'origine `chrome-extension://` (`server.cors.origin = [/chrome-extension:\/\//]`). Senza questa whitelist Vite 6+ blocca le richieste del service worker dell'estensione.

## Reset dello store (solo dev)

In fase di sviluppo lo schema dei dati può cambiare e i tag/progetti salvati in `chrome.storage.local` diventano incompatibili.

Due modi per resettare:

1. **Pulsante "Reset (dev)"** nell'header dell'app (visibile solo quando `import.meta.env.DEV === true`, sparisce nel build di produzione).
2. **Console DevTools**: `__tazlyReset()`.

Entrambi:
- chiamano `useBoardStore.persist.clearStorage()` (rimuove la chiave `tazly-board` da `chrome.storage.local` / `localStorage`)
- chiamano `resetBoard()` sullo store (riporta lo stato in memoria a `{ projects: [], tags: [] }`)

> Convenzione: **non versionare lo schema dello store in dev**. Niente `version` bumps né `migrate` per breaking change durante lo sviluppo — basta resettare. Si introduce versionamento solo dopo la prima release pubblica.

## Architettura

```
src/
├── components/
│   ├── board/                      # tutto ciò che riguarda la board
│   │   ├── BoardView.tsx           # root: griglia (overview) o focus mode, filtri
│   │   ├── CommandBar.tsx          # search/azioni globali + breadcrumb focus + filtri
│   │   ├── CommandSuggestionItem.tsx
│   │   ├── ProjectCard.tsx         # card progetto con quick-add + categorie
│   │   ├── CategoryBlock.tsx       # categoria collassabile + task list
│   │   ├── TaskRow.tsx             # task con checkbox, tag, edit inline
│   │   ├── QuickAddBar.tsx         # UI barra di inserimento (step categoria→titolo→tag)
│   │   ├── QuickAddDropdown.tsx    # dropdown autocomplete della quick-add
│   │   ├── Notepad.tsx             # note per-progetto (textarea laterale)
│   │   ├── NotepadTab.tsx          # tab/toggle del notepad
│   │   ├── useQuickAdd.ts          # macchina a step + gestione tastiera della quick-add
│   │   ├── useBoardSelectionSync.ts# tiene coerente la selezione al variare del contenuto
│   │   ├── useFocusModeKeyboard.ts # cablaggio tastiera in focus mode
│   │   └── useOverviewKeyboard.ts  # cablaggio tastiera in overview
│   ├── tags/
│   │   ├── TagsView.tsx            # gestione tag (CRUD + riordina)
│   │   └── TagBadge.tsx            # rendering badge colorato
│   ├── log/
│   │   └── LogView.tsx             # vista log/attività
│   ├── common/
│   │   ├── EmptyState.tsx
│   │   └── IconButton.tsx
│   └── ui/                         # primitivi shadcn-style scritti a mano
├── hooks/
│   ├── useBoardKeyboard.ts         # navigazione verticale condivisa focus/overview
│   ├── useBoardNav.ts              # modello di navigazione (nav items, indice, salti)
│   ├── useGlobalHotkeys.ts         # ?, ⌘C copia, ⌘Z undo, ⌘K reset
│   └── useTheme.ts
├── store/
│   ├── useBoardStore.ts            # compone le slice + persist su chrome.storage.local
│   ├── types.ts                    # tipi dello store e delle slice
│   ├── helpers.ts                  # utility condivise tra slice
│   └── slices/                     # projectSlice, categorySlice, taskSlice,
│                                   #   tagSlice, focusSlice, uiSlice
├── lib/
│   ├── storage.ts                  # adapter chrome.storage / localStorage
│   ├── focus.ts                    # helper per spostare il focus (CommandBar, QuickAdd)
│   ├── keyboard.ts                 # helper tastiera condivisi (es. → al notepad)
│   ├── dom.ts                      # isEditableTarget, isMac
│   ├── quickAddParse.ts            # parser della sintassi rapida `Cat: testo #tag`
│   ├── commandSuggestions.ts       # costruzione suggerimenti della CommandBar
│   ├── colors.ts                   # palette TAG_COLORS (classi Tailwind)
│   ├── id.ts                       # wrapper crypto.randomUUID
│   └── utils.ts                    # cn() per Tailwind class merge
├── types/
│   └── domain.ts                   # Board, Project, Category, Task, Tag (branded IDs)
├── manifest.ts                     # manifest MV3 per CRX plugin (action + service worker)
├── background.ts                   # service worker: apre Tazly full-tab on-demand
├── App.tsx                         # root component (tab Board/Tag/Log + dev reset)
├── main.tsx                        # createRoot
└── index.css                       # Tailwind import + custom keyframes
```

### Store

- Store globale `useBoardStore`, composto da **slice** (`store/slices/`): una per dominio (progetti, categorie, task, tag, focus, UI). `useBoardStore.ts` le assembla e applica il middleware `persist`.
- Stato principale: `{ board: { projects: Project[], tags: Tag[] } }`, più lo stato di UI/navigazione (focus, selezione, filtri, editing).
- Actions immutabili (niente Immer, manual spread).
- Validazioni: trim del nome, niente duplicati case-insensitive su tag e categorie nello stesso progetto.
- `addProject` / `addCategory` / `addTask` ritornano l'id creato (usato dalla quick-add per highlight e auto-expand).

### Apertura dell'app (action + service worker)

Tazly **non** è più un override della New Tab. È una pagina full-tab (`index.html`) aperta on-demand: `background.ts` è un service worker che al click sull'icona della toolbar (`chrome.action.onClicked`) focalizza la tab già aperta se esiste, altrimenti ne crea una nuova. Il manifest dichiara quindi `action` + `background.service_worker`.

### Persistenza

- Adapter `chromeStorage` in `src/lib/storage.ts` con fallback a `localStorage` se `chrome.storage.local` non è disponibile (es. quando apri `http://localhost:5173/` direttamente senza estensione).
- Chiave: `tazly-board`.
- `version: 1` (non viene incrementata durante dev; vedi sezione Reset).

### Quick-add: macchina a step

La logica vive nell'hook `useQuickAdd` (`components/board/useQuickAdd.ts`); `QuickAddBar` ne è la sola UI. L'hook tiene state `step: 'category' | 'title' | 'tags'` e per ogni step:
- input controllato + dropdown autocomplete
- gestione tastiera: `Tab` / `Shift+Tab` / `Backspace` su input vuoto / `↑↓` / `Invio` / `Esc` (vedi [`KEYBINDINGS.md`](./KEYBINDINGS.md))
- transizione step ⇒ focus automatico sull'input corretto via `useRef`

Sintassi rapida `Cat: testo #tag1 #tag2` parsata in `lib/quickAddParse.ts`. Si attiva solo se l'utente preme `Invio` mentre digita nel campo categoria e l'input contiene `:`.

> La navigazione da tastiera dell'intera board è documentata a parte in [`KEYBINDINGS.md`](./KEYBINDINGS.md): hook condiviso `useBoardKeyboard` + cablaggi `useFocusModeKeyboard` / `useOverviewKeyboard`, più le hotkey globali in `useGlobalHotkeys`.

## Convenzioni di codice

- **Niente commenti** che descrivono cosa fa il codice. Solo per spiegare il *perché* di scelte non ovvie (constraint, workaround, invariante).
- **Niente `tailwind.config.js`**: i token vivono in `src/index.css` con `@theme`.
- **Niente shadcn CLI**: i componenti UI si scrivono a mano in `src/components/ui/`, imitando lo stile di `button.tsx`. Niente nuove dipendenze radix senza approvazione esplicita.
- **TypeScript strict**: branded IDs (`type TagId = string` etc.) per evitare swap accidentali.
- **Biome**: lanciato in pre-commit consigliato (manualmente con `pnpm lint`/`pnpm format`).

## Testing in browser

Per un check rapido senza caricare l'estensione, l'app gira anche direttamente su `http://localhost:5173/` (Vite serve `index.html`). La persistenza in questo caso usa `localStorage` invece di `chrome.storage.local` grazie al fallback dell'adapter.

## Build di produzione

`pnpm build` produce `dist/` con:
- `manifest.json` MV3 (con `action` + `background.service_worker`) senza riferimenti a localhost
- `index.html` + assets bundle
- `background.js` (service worker che apre l'app on-demand)
- `icons/` copiate da `public/`

In produzione il service worker non referenzia `localhost`, quindi si registra senza errori (vedi Troubleshooting per lo Status 3 in dev).

## Troubleshooting

| Problema | Soluzione |
|---|---|
| `Service worker registration failed. Status code: 3` | `dist/` in stato dev. Lancia `pnpm dev` o rifai `pnpm build`. |
| `CORS blocked: chrome-extension://` | Manca whitelist in `vite.config.ts → server.cors`. Già configurata. |
| `Unknown input options: platform` (warning Rolldown) | Incompatibilità nota CRX ↔ Vite 8 Rolldown. Innocuo. |
| HMR non aggiorna la new tab | Pagine `chrome-extension://` hanno restrizioni. Ricarica la tab o l'estensione. |
| Dati vecchi rimasti dopo cambio schema | Click "Reset (dev)" in header o `__tazlyReset()` in console. |
