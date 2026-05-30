# Scorciatoie da tastiera

Tazly è pensato per essere usato da tastiera. Questo documento elenca tutte le scorciatoie attive e il loro comportamento contestuale.

## Modello di navigazione

L'app ha un layout **verticale** e la navigazione segue lo stesso asse:

- **`↑` / `↓`** → muove il "cursore" all'elemento precedente/successivo nell'ordine visivo della pagina (header categoria, task), risalendo fino agli input in cima (QuickAdd → CommandBar).
- **`Shift+↑` / `Shift+↓`** → scorciatoia che salta tra header di categoria (ignora i task). Da un task, `Shift+↑` torna all'header della **sua** categoria (parent); `Shift+↓` salta all'header della categoria successiva.
- **`→`** → secondo asse: apre/dà focus al **notepad laterale** del progetto (solo in modalità focus, vedi sotto).
- **`←`** → dal notepad torna alla lista; in **overview** sposta la selezione al progetto precedente; nella board in **focus mode** non è assegnata.

Esiste un cursore solo alla volta: o un task, o un'header di categoria, oppure il focus è su un input (CommandBar / QuickAdd / Notepad). Le selezioni `selectedTaskId` e `selectedCategoryId` sono mutuamente esclusive.

> **Due modalità di board.** *Focus* = un singolo progetto in primo piano, con QuickAdd e Notepad. *Overview* = griglia di progetti, con un progetto "selezionato" di cui si naviga il contenuto. La navigazione verticale condivisa vive in `useBoardKeyboard`; i casi di bordo (uscita verso l'alto, frecce orizzontali, `Esc`) sono delegati a `useFocusModeKeyboard` / `useOverviewKeyboard`.

## Scorciatoie globali

Attive ovunque, a meno delle eccezioni indicate.

Le scorciatoie con **`⌥` (Option/Alt)** funzionano anche dentro gli input (sono toggle di vista/tema/aiuto), e si disabilitano solo durante una rinomina/edit inline. Si matcha su `e.code`, perché su macOS `Option`+lettera produce caratteri speciali in `e.key`.

| Tasto | Azione | Disabilitato quando |
|-------|--------|---------------------|
| `⌥H` | Apre/chiude la cheatsheet | sei in edit/rinomina inline |
| `⌥L` | Apre/chiude lo storico (log) | sei in edit/rinomina inline |
| `⌥T` | Apre/chiude la gestione tag | sei in edit/rinomina inline |
| `⌥D` | Tema chiaro/scuro | sei in edit/rinomina inline |
| `⌘C` / `Ctrl+C` | Copia il testo del task selezionato | sei in un input, in edit mode, c'è già testo selezionato, o nessun task è selezionato |
| `⌘Z` / `Ctrl+Z` | Annulla l'ultima chiusura task (undo) | sei in un input, in edit mode, o non c'è nulla da annullare |
| `⌘K` / `Ctrl+K` | Reset della vista e focus alla CommandBar | sei in edit mode, o non sei sulla board (funziona anche dagli input) |
| `Esc` | Torna alla board da una vista secondaria (log/tag) | non sei in una vista secondaria, o sei in un input |

> Il `?` nell'header è un bottone cliccabile per l'aiuto, **non** una scorciatoia da tastiera: da tastiera si usa `⌥H`.

## CommandBar (search globale)

| Tasto | Contesto | Azione |
|-------|----------|--------|
| `Enter` | dropdown con suggerimenti | applica la suggestion attiva (gestito da `cmdk`) |
| `↑` / `↓` | dropdown suggerimenti aperto | naviga le suggestion |
| `↓` | dropdown chiuso, progetto in focus | esce e dà focus al **QuickAdd** del progetto |
| `↓` | dropdown chiuso, nessun focus, ≥1 progetto | seleziona il **primo progetto** dell'overview |
| `Tab` | progetto in focus | focus al QuickAdd |
| `Tab` | nessun focus, ≥1 suggestion | applica la prima suggestion |
| `→` | progetto in focus, cursore a fine input | apre il **notepad** |
| `Backspace` | input vuoto, progetto in focus, filtri attivi | rimuove l'ultimo filtro |
| `Backspace` | input vuoto, progetto in focus, nessun filtro | esce dal focus del progetto |
| `Esc` | input con testo | svuota l'input |
| `Esc` | input vuoto, filtri attivi | rimuove tutti i filtri |
| `Esc` | input vuoto, nessun filtro | esce dal focus del progetto |

## QuickAdd (creazione task)

Il QuickAdd è un workflow a step: **categoria → titolo → tag**. Le scorciatoie dipendono dallo step corrente.

**Principio di `Esc`**: `Esc` annulla, non naviga. È *progressivo* — prima svuota il testo del campo corrente, poi (a campo vuoto) torna allo step precedente. Per risalire alla CommandBar si usano `↑` o `⌘K`, non `Esc`.

**Step categoria**

| Tasto | Contesto | Azione |
|-------|----------|--------|
| `↑` | dropdown chiuso | focus alla **CommandBar** |
| `↓` | dropdown chiuso, ≥1 categoria | esce dall'input e seleziona la **prima categoria** del progetto |
| `↑` / `↓` | dropdown aperto | naviga le suggestion |
| `→` | cursore a fine input | apre il **notepad** |
| `Tab` / `Enter` | ≥1 suggestion | conferma la suggestion attiva |
| `Shift+Tab` | sempre | focus alla CommandBar |
| `Esc` | input con testo | svuota il campo |
| `Esc` | input vuoto | nessuna azione (usa `↑` / `⌘K` per uscire) |

**Step titolo**

| Tasto | Contesto | Azione |
|-------|----------|--------|
| `↑` | sempre | focus alla CommandBar |
| `→` | cursore a fine input | apre il **notepad** |
| `Tab` / `Enter` | con testo | conferma il titolo e passa allo step tag |
| `Shift+Tab` | sempre | torna allo step categoria |
| `Backspace` | input vuoto | torna allo step categoria |
| `Esc` | input con testo | svuota il campo |
| `Esc` | input vuoto | torna allo step categoria |

**Step tag**

| Tasto | Contesto | Azione |
|-------|----------|--------|
| `↑` | dropdown chiuso | focus alla CommandBar |
| `↑` / `↓` | dropdown aperto | naviga le suggestion |
| `→` | cursore a fine input | apre il **notepad** |
| `Tab` | ≥1 suggestion | aggiunge il tag attivo |
| `Enter` | con testo, ≥1 suggestion | aggiunge il tag attivo |
| `Enter` | senza testo, ≥1 tag selezionato | crea il task |
| `Shift+Tab` | sempre | torna allo step titolo |
| `Backspace` | input vuoto, nessun tag selezionato | torna allo step titolo |
| `Backspace` | input vuoto, ≥1 tag selezionato | rimuove l'ultimo tag |
| `Esc` | input con testo | svuota il campo |
| `Esc` | input vuoto | torna allo step titolo (i tag selezionati restano) |

## Navigazione board — modalità focus

Attiva quando un progetto è in focus e il focus **non** è in un input.

| Tasto | Contesto | Azione |
|-------|----------|--------|
| `↓` | qualsiasi | elemento successivo (header o task) nell'ordine visivo |
| `↑` | non sul primo elemento | elemento precedente |
| `↑` | primo elemento o nessuna selezione | focus al **QuickAdd** |
| `Shift+↓` | nessuna selezione | seleziona la prima header |
| `Shift+↓` | header o task | salta all'header della categoria successiva |
| `Shift+↑` | task | torna all'header della sua categoria (parent) |
| `Shift+↑` | header non-prima | header precedente |
| `Shift+↑` | prima header | focus al QuickAdd |
| `→` | qualsiasi | apre il **notepad** |
| `Space` | task selezionato | toggle done |
| `Space` | categoria selezionata | toggle collapsed/expanded |
| `Enter` | task selezionato | entra in **edit** del task |
| `Enter` | categoria selezionata | entra in **rinomina** della categoria |
| `Esc` | selezione attiva | deseleziona |
| `Esc` | nessuna selezione, filtri attivi | rimuove i filtri |
| `Esc` | nessuna selezione, nessun filtro | esce dalla modalità focus |

Quando ti sposti su un'header collassata e premi `↓`, la categoria viene espansa automaticamente prima di entrare nel primo task.

## Navigazione board — modalità overview

Attiva quando nessun progetto è in focus ma uno è selezionato nella griglia. Verticale e `Shift+↑↓`, `Space`, `Enter` (edit) funzionano come in focus mode; cambiano i bordi:

| Tasto | Contesto | Azione |
|-------|----------|--------|
| `←` / `→` | sempre | progetto precedente / successivo nella griglia |
| `Enter` | nessuna selezione interna al progetto | entra in **focus mode** sul progetto |
| `↑` | nessuna selezione | esce alla **CommandBar** |
| `↑` | primo elemento | deseleziona (resta nel progetto) |
| `Shift+↑` | prima header | deseleziona la categoria (resta nel progetto) |
| `Esc` | selezione attiva | deseleziona |
| `Esc` | nessuna selezione | esce alla CommandBar |

> **Uscita verso l'alto a due stadi (intenzionale).** A differenza del focus mode — dove sopra la board c'è la QuickAdd come atterraggio intermedio — qui lasciare la board significa saltare fino alla CommandBar. Quindi `↑`/`Shift+↑` con selezione prima *deselezionano* (restando nella board), e solo `↑` da già-deselezionato esce davvero. È una guardia contro l'uscita accidentale.

## Notepad (note per progetto)

Pannello laterale a destra in focus mode. All'apertura di un progetto è espanso solo se quel progetto ha già delle note; altrimenti resta chiuso. Si apre con `→` (o cliccando il rail laterale) e si chiude cliccando di nuovo il rail. Non si auto-nasconde quando lo svuoti.

| Tasto | Contesto | Azione |
|-------|----------|--------|
| `→` | lista, CommandBar o QuickAdd (cursore a fine testo) | apre il notepad e gli dà focus |
| `Esc` | textarea del notepad | esce dal notepad, focus al QuickAdd |
| `←` | textarea del notepad (cursore all'inizio) | esce dal notepad, focus al QuickAdd |

La textarea ha `spellCheck`, `autoCorrect`, `autoCapitalize` e `autoComplete` disabilitati per restare leggera e silenziosa. Il salvataggio è immediato a ogni keystroke. Le note sono per-progetto, persistite nello store.

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
- **Filtri attivi**: `↑` / `↓` e `Shift+↑` / `Shift+↓` rispettano i filtri (tag, categoria) e l'esclusione dei task completati.
- **`←` nella board focus**: oggi non assegnata. Possibile uso futuro per un pannello/colonna a sinistra.
</content>
</invoke>
