# Tazly app

## Idea

Una **Chrome New Tab extension** per gestire progetti e task in modo più strutturato di una todo classica, ma più leggero di Trello, Jira o ClickUp.

Il prodotto mostra i progetti direttamente nella nuova scheda del browser, così ogni nuova tab riporta l’utente al lavoro attivo.

## Concetto centrale

L’app organizza il lavoro così:

```text
Board
  Progetto
    Categoria
      Task
        Tag / tipo
```

Esempio:

```text
ircnews
  Search
    [bug] Quando si cambia la pagina si resetta

  Discovery
    [doubt] Pulsante saluto e lista sono unificabili
    [feature] Possibilità vedere lista bot
```

## Elementi principali

### Board

La board contiene tutti i progetti.

Quando ci sono pochi progetti, vengono mostrati tutti insieme come card affiancate.

### Progetto

Ogni progetto è una card autonoma con:

- nome progetto;
- conteggio task aperti;
- riepilogo tag importanti, tipo bug o blocked;
- categorie interne;
- pulsante “focus/full screen”.

### Categoria

Le categorie raggruppano task per area funzionale.

Esempi:

- Search
- Discovery
- Hero
- Pricing
- Form
- Bot
- Admin

Ogni categoria mostra:

- numero task;
- riepilogo tag;
- stato espanso o collassato.

### Task

Ogni task ha:

- titolo;
- categoria;
- tag;
- stato;
- checkbox;
- eventuale menu azioni.

## Tag controllati

I tag non sono liberi durante l’inserimento dei task.

L’utente deve prima definirli in una schermata dedicata, scegliendo per ciascun tag:

- nome;
- colore;
- eventuale descrizione;
- eventuale ordine di visualizzazione.

Esempi di tag:

- `bug`
- `feature`
- `doubt`
- `chore`
- `refactor`
- `research`
- `blocked`

Questo evita disordine e duplicati tipo:

```text
feature
features
feat
idea
improvement
```

Durante l’inserimento di un task, l’utente può scegliere solo tra i tag già definiti.

## Schermata gestione tag

La schermata tag serve a configurare il vocabolario del workspace o della board.

Esempio:

```text
Tag
  bug       rosso
  feature   blu
  doubt     viola
  chore     grigio
  blocked   arancione
```

Azioni disponibili:

- creare un nuovo tag;
- rinominare un tag;
- cambiare colore;
- disattivare un tag;
- riordinare i tag;
- vedere quanti task usano quel tag.

Nel primo MVP eviterei tag completamente liberi dentro la quick-add bar. La creazione del tag dovrebbe avvenire nella schermata dedicata, così la struttura rimane pulita.

## Modalità board default

Quando i progetti sono pochi, la sidebar non è visibile.

Esempio con 2 progetti:

```text
[ ircnews ]        [ landing ]
Search            Hero
Discovery         Pricing
                  Form
```

Le card sono affiancate e le checklist interne sono già espanse.

Obiettivo: vedere tutta la board senza entrare in modalità focus.

## Modalità focus progetto

Ogni progetto ha un pulsante tipo “full screen”.

Quando lo clicchi:

- il progetto selezionato diventa centrale e grande;
- gli altri progetti vengono ridotti in sidebar;
- le categorie del progetto attivo restano visibili;
- non si apre nessuna modale.

Questo evita il comportamento tipo Trello, dove serve chiudere una card per aprirne un’altra.

## Comportamento adattivo

L’interfaccia decide quanto espandere in base alla quantità di contenuto.

### Pochi task

Mostra tutto espanso.

```text
Progetto
  Categoria
    Task
    Task
```

### Molti task

Collassa alcune categorie.

```text
Progetto
  Search
    Task
  Discovery
    collassata
  Bot
    collassata
```

### Molti progetti

Passa a una vista più focalizzata.

```text
Sidebar progetti
  ircnews
  landing
  admin

Area centrale
  progetto attivo
```

## Inserimento rapido strutturato

L’app usa una barra di inserimento veloce, ma forzatamente strutturata.

Ogni nuovo elemento richiede sempre:

```text
Categoria
Testo dell’elemento
Tag
```

L’inserimento funziona a step, usando `Tab` per confermare ogni parte.

Esempio:

```text
Discovery [Tab]
Possibilità vedere lista bot [Tab]
feature [Invio]
```

Durante l’inserimento, ogni valore confermato diventa un badge.

Esempio visivo:

```text
[Discovery] [Possibilità vedere lista bot] [feature]
```

Con `Invio`, il task viene creato nella categoria corretta:

```text
Discovery
  [feature] Possibilità vedere lista bot
```

## Autocompletamento

La barra di inserimento supporta autocomplete per categoria e tag.

### Categoria

L’autocomplete suggerisce categorie già presenti nel progetto attivo.

Esempio:

```text
Search
Discovery
Bot
Admin
```

Le categorie possono essere suggerite in base a:

- uso recente;
- categorie con task aperti;
- frequenza di utilizzo;
- ordine manuale.

La creazione di nuove categorie può essere permessa, ma dovrebbe essere esplicita.

Esempio:

```text
Crea categoria "Deploy"
```

### Tag

L’autocomplete dei tag mostra solo tag già definiti dall’utente nella schermata tag.

Esempio:

```text
bug
feature
doubt
chore
blocked
```

Ogni suggerimento mostra anche il colore associato al tag.

## Regole tastiera

```text
Tab
  Conferma il campo corrente e passa al successivo.

Shift + Tab
  Torna al campo precedente.

Backspace su campo vuoto
  Riapre/modifica il badge precedente.

Invio
  Se categoria, testo e tag sono validi, crea il task.

Esc
  Annulla l’inserimento.

Click su badge
  Modifica quel valore.
```

Se l’utente preme `Invio` senza aver completato tutti i campi, l’app mostra un errore leggero e porta il focus sul campo mancante.

Esempi:

```text
Categoria richiesta
Testo elemento richiesto
Tag richiesto
```

## Sintassi veloce opzionale

Oltre al flusso guidato, l’app può supportare una sintassi rapida:

```text
Discovery: Possibilità vedere lista bot #feature
```

L’app la interpreta e la trasforma nei badge:

```text
[Discovery] [Possibilità vedere lista bot] [feature]
```

Questa modalità serve agli utenti più veloci, ma produce sempre lo stesso formato strutturato.

## Dopo l’inserimento

Dopo aver creato un task:

- il task appare subito nella categoria corretta;
- la categoria viene espansa se era chiusa;
- il nuovo task viene evidenziato per un breve momento;
- la barra resta pronta per inserire un altro elemento.

Possibile comportamento utile:

```text
Dopo aver inserito un task in Discovery,
la barra mantiene Discovery come categoria selezionata.
```

Questo velocizza l’inserimento di più task nella stessa categoria.

## Principi UX

- niente modali obbligatorie;
- cambio progetto in un click;
- editing inline;
- categorie espandibili/collassabili;
- vista pulita e leggibile;
- nuova tab come spazio di focus;
- sidebar solo quando serve;
- board completa quando lo spazio lo permette;
- inserimento rapido ma strutturato;
- tag controllati, non liberi;
- autocompletamento dove serve.

## MVP

Funzionalità minime:

- estensione Chrome New Tab;
- board con progetti;
- progetto come card;
- categorie interne;
- task con tag;
- schermata gestione tag;
- colore personalizzato per ogni tag;
- filtri per tag/stato;
- quick add strutturato con `Tab`;
- autocomplete categoria;
- autocomplete tag;
- espandi/collassa categoria;
- modalità focus progetto;
- salvataggio locale;
- eventuale sync/account in fase successiva.

## Posizionamento

Non è una todo app generica.

È più vicino a:

> una board progettuale leggera con task strutturati per categoria e tag.

Possibile promessa:

> Gestisci bug, feature e dubbi per progetto direttamente nella nuova scheda, senza la pesantezza di Jira e senza le modali di Trello.
