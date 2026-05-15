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
3. Apri una nuova scheda → Tazly.
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
│   ├── board/                 # tutto ciò che riguarda la board
│   │   ├── BoardView.tsx      # root: griglia o focus mode, filtri
│   │   ├── ProjectCard.tsx    # card progetto con quick-add + categorie
│   │   ├── CategoryBlock.tsx  # categoria collassabile + task list
│   │   ├── TaskRow.tsx        # task con checkbox, tag, edit inline
│   │   ├── QuickAddBar.tsx    # barra di inserimento Tab-step + sintassi rapida
│   │   ├── FilterBar.tsx      # filtri stato + tag
│   │   └── ProjectSidebar.tsx # sidebar in focus mode
│   ├── tags/
│   │   ├── TagsView.tsx       # gestione tag (CRUD + riordina)
│   │   └── TagBadge.tsx       # rendering badge colorato
│   ├── common/
│   │   └── EmptyState.tsx
│   └── ui/                    # primitivi shadcn-style (Button, Input)
├── store/
│   └── useBoardStore.ts       # Zustand + persist su chrome.storage.local
├── lib/
│   ├── storage.ts             # adapter chrome.storage / localStorage
│   ├── colors.ts              # palette TAG_COLORS (10 colori, classi Tailwind)
│   ├── id.ts                  # wrapper crypto.randomUUID
│   └── utils.ts               # cn() per Tailwind class merge
├── types/
│   └── domain.ts              # Board, Project, Category, Task, Tag
├── manifest.ts                # manifest MV3 per CRX plugin
├── NewTab.tsx                 # entry component (tab Board/Tag + dev reset)
├── main.tsx                   # createRoot
└── index.css                  # Tailwind import + custom keyframes
```

### Store

- Singolo store globale (`useBoardStore`)
- Stato: `{ board: { projects: Project[], tags: Tag[] } }`
- Actions immutabili (niente Immer, manual spread)
- Validazioni: trim del nome, niente duplicati case-insensitive su tag e categorie nello stesso progetto
- `addProject` / `addCategory` / `addTask` ritornano l'id creato (usato da `QuickAddBar` per highlight e auto-expand)

### Persistenza

- Adapter `chromeStorage` in `src/lib/storage.ts` con fallback a `localStorage` se `chrome.storage.local` non è disponibile (es. quando apri `http://localhost:5173/` direttamente senza estensione).
- Chiave: `tazly-board`.
- `version: 1` (non viene incrementata durante dev; vedi sezione Reset).

### Quick-add: macchina a step

`QuickAddBar` tiene state `step: 'category' | 'title' | 'tags'` e per ogni step:
- input controllato + dropdown autocomplete
- gestione tastiera: `Tab` / `Shift+Tab` / `Backspace` su input vuoto / `↑↓` / `Invio` / `Esc`
- transizione step ⇒ focus automatico sull'input corretto via `useRef`

Sintassi rapida `Cat: testo #tag1 #tag2` parsata via regex `/^([^:]+):\s*(.+?)(?:\s+(#\S+(?:\s+#\S+)*))?$/`. Si attiva solo se l'utente preme `Invio` mentre digita nel campo categoria e l'input contiene `:`.

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
- `manifest.json` MV3 senza service worker e senza riferimenti a localhost
- `index.html` + assets bundle
- `icons/` copiate da `public/`

Il bundle è ~80 KB gzippato. Niente service worker = niente Status 3 in produzione.

## Troubleshooting

| Problema | Soluzione |
|---|---|
| `Service worker registration failed. Status code: 3` | `dist/` in stato dev. Lancia `pnpm dev` o rifai `pnpm build`. |
| `CORS blocked: chrome-extension://` | Manca whitelist in `vite.config.ts → server.cors`. Già configurata. |
| `Unknown input options: platform` (warning Rolldown) | Incompatibilità nota CRX ↔ Vite 8 Rolldown. Innocuo. |
| HMR non aggiorna la new tab | Pagine `chrome-extension://` hanno restrizioni. Ricarica la tab o l'estensione. |
| Dati vecchi rimasti dopo cambio schema | Click "Reset (dev)" in header o `__tazlyReset()` in console. |
