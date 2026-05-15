# Scorciatoie da tastiera

Tazly è pensato per essere usato da tastiera. Questo documento elenca tutte le scorciatoie attive e il loro comportamento contestuale.

## Modello di navigazione

L'app ha un layout **verticale** e la navigazione segue lo stesso asse:

- **`↑` / `↓`** → muove il "cursore" all'elemento precedente/successivo nell'ordine visivo della pagina. Attraversa tutto: CommandBar → QuickAdd → header categoria → task → header categoria successiva → task → … .
- **`Shift+↑` / `Shift+↓`** → scorciatoia che salta tra header di categoria (ignora i task). Da un task, `Shift+↑` torna all'header della **sua** categoria (parent); `Shift+↓` salta all'header della categoria successiva.
- **`→`** → secondo asse: apre/dà focus al **notepad laterale** del progetto (vedi sotto).
- **`←`** → dal notepad torna alla lista; nella lista non è ancora assegnato.

Solo un elemento alla volta è selezionato: o un task, o un'header di categoria, oppure il focus è su un input (CommandBar / QuickAdd). Le selezioni sono mutuamente esclusive.

## Scorciatoie globali

| Tasto | Azione | Disabilitato quando |
|-------|--------|---------------------|
| `/` | Focus alla CommandBar (search) | sei in edit mode |
| `?` | Apre/chiude la cheatsheet con gli shortcut | sei dentro un input o in edit mode |

## CommandBar (search globale)

| Tasto | Contesto | Azione |
|-------|----------|--------|
| `↑` / `↓` | dropdown suggerimenti aperto | naviga le suggestion |
| `↓` | dropdown chiuso, progetto in focus | esce e dà focus al **QuickAdd** del progetto |
| `Enter` | almeno una suggestion | applica la suggestion attiva |
| `Tab` | progetto in focus | focus al QuickAdd |
| `Esc` | input con testo | svuota l'input |
| `Esc` | input vuoto, filtri attivi | rimuove i filtri |
| `Esc` | input vuoto, nessun filtro | esce dal focus del progetto |
| `Backspace` | input vuoto, filtri attivi | rimuove l'ultimo filtro |

## QuickAdd (creazione task)

Il QuickAdd è un workflow a step: **categoria → titolo → tag**. Le scorciatoie dipendono dallo step corrente.

**Step categoria**

| Tasto | Contesto | Azione |
|-------|----------|--------|
| `↑` | dropdown chiuso | focus alla **CommandBar** |
| `↓` | dropdown chiuso, esiste almeno una categoria | esce dall'input e seleziona la **prima categoria** del progetto |
| `↑` / `↓` | dropdown aperto | naviga le suggestion |
| `Tab` / `Enter` | almeno una suggestion | conferma la suggestion attiva |
| `Enter` | testo contiene `Cat: titolo #tag` | crea task con la sintassi rapida |
| `Shift+Tab` | sempre | focus alla CommandBar |
| `Esc` | input non vuoto | resetta lo step |
| `Esc` | input vuoto | focus alla CommandBar |

**Step titolo**

| Tasto | Azione |
|-------|--------|
| `↑` | focus alla CommandBar |
| `Tab` / `Enter` (con testo) | conferma il titolo e passa allo step tag |
| `Shift+Tab` / `Backspace` (su input vuoto) | torna allo step categoria |
| `Esc` | resetta lo step |

**Step tag**

| Tasto | Azione |
|-------|--------|
| `↑` (dropdown chiuso) | focus alla CommandBar |
| `↑` / `↓` (dropdown aperto) | naviga le suggestion |
| `Tab` | aggiunge il tag attivo |
| `Enter` (con testo) | aggiunge il tag attivo |
| `Enter` (senza testo, almeno un tag) | crea il task |
| `Shift+Tab` / `Backspace` (input vuoto, nessun tag) | torna allo step titolo |
| `Backspace` (input vuoto, almeno un tag selezionato) | rimuove l'ultimo tag |
| `Esc` | resetta lo step |

## Navigazione nei task / categorie (focus su un progetto)

Attiva quando il focus non è in un input.

| Tasto | Contesto | Azione |
|-------|----------|--------|
| `↓` | qualsiasi | elemento successivo (header o task) nell'ordine visivo |
| `↑` | qualsiasi (non primo elemento) | elemento precedente |
| `↑` | primo elemento o nessuna selezione | focus al **QuickAdd** |
| `Shift+↓` | nessuna selezione | seleziona la prima header |
| `Shift+↓` | header o task | salta all'header della categoria successiva |
| `Shift+↑` | task | torna all'header della sua categoria (parent) |
| `Shift+↑` | header non-prima | header precedente |
| `Shift+↑` | prima header | focus al QuickAdd |
| `Space` | task selezionato | toggle done |
| `Space` | categoria selezionata | toggle collapsed/expanded |
| `Enter` | task selezionato | entra in **edit** del task |
| `Enter` | categoria selezionata | entra in **rinomina** della categoria |

Quando ti sposti su un'header collassata e premi `↓`, la categoria viene espansa automaticamente prima di entrare nel primo task.

## Notepad (note per progetto)

Pannello laterale a destra (1/3 della larghezza in focus mode). Visibile solo se contiene testo o se è stato appena aperto in sessione: se viene svuotato e perde il focus, si nasconde automaticamente.

| Tasto | Contesto | Azione |
|-------|----------|--------|
| `→` | lista (no input attivo) | apre il notepad e gli dà focus |
| `→` | CommandBar (cursore a fine) | apre il notepad e gli dà focus |
| `→` | QuickAdd (cursore a fine del testo dello step corrente) | apre il notepad e gli dà focus |
| `Esc` | textarea del notepad | esce dal notepad, focus al QuickAdd |
| `←` | textarea del notepad (cursore all'inizio) | esce dal notepad, focus al QuickAdd |

La textarea ha `spellCheck`, `autoCorrect`, `autoCapitalize` e `autoComplete` disabilitati per restare leggera e silenziosa. Il salvataggio è immediato a ogni keystroke. Le note sono per-progetto, persistite nello store insieme al resto.

## Modalità edit (task o categoria)

Tutte le scorciatoie di navigazione sono disabilitate. Solo:

| Tasto | Azione |
|-------|--------|
| `Enter` | salva ed esce dall'edit |
| `Esc` | annulla ed esce dall'edit |
| `Tab` / `Shift+Tab` | navigazione standard tra input e bottoni del form |

Cliccare fuori dal box di edit (perdita di focus) equivale a `Esc` — le modifiche vengono annullate.

## Note sul comportamento

- **Single editing**: solo un task o una categoria possono essere in edit alla volta. Stato centralizzato nello store (`editingTaskId`, `editingCategoryId`).
- **Selezione mutuamente esclusiva**: `selectedTaskId` e `selectedCategoryId` non possono essere settati contemporaneamente; i setter dello store gestiscono la mutua esclusione.
- **`←` e `→` libere**: oggi non sono assegnate. In futuro saranno usate per spostare il focus su un eventuale pannello laterale (es. notepad).
- **Filtri attivi**: `↑` / `↓` e `Shift+↑` / `Shift+↓` rispettano i filtri (tag, categoria) e l'opzione "mostra fatti".
