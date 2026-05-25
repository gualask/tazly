# Product

> Spec di prodotto e design di Tazly: target user, scopo, personalità di brand, principi di design e accessibilità. È l'input di contesto per la skill **impeccable** e per chi progetta l'interfaccia — **non** è documentazione utente (quella sta nel [README](./README.md)) né guida di sviluppo (vedi [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md)).

## Users

Sviluppatori solo e indie maker che vivono nel browser e portano avanti più progetti in parallelo (uno o due principali, qualche side project). Il loro contesto d'uso è la nuova tab: ogni `Cmd+T` è un micro-momento di context switch in cui vogliono vedere a colpo d'occhio cosa c'è da fare, su quale progetto, e aggiungere rapidamente un bug, una feature o un dubbio appena affiora. Non condividono, non hanno team, non vogliono cerimoniale: vogliono struttura sufficiente a non perdere niente, e velocità da terminale.

## Product Purpose

Tazly trasforma la pagina New Tab di Chrome in una board progettuale leggera. Organizza il lavoro in `Board → Progetto → Categoria → Task` con tag controllati (bug, feature, doubt, blocked...), in modo che ogni nuova scheda riporti l'utente sul lavoro attivo invece di portarlo via. Il successo è: l'utente apre una tab, in meno di 2 secondi sa cosa fare dopo, e in meno di 5 secondi può catturare un nuovo task strutturato senza toccare il mouse.

## Brand Personality

Tool-native con anima spatial. Tre parole: **affilato, sobrio, atmosferico**. La meccanica resta quella di un buon strumento da sviluppatore — Linear, Raycast, k9s — con tipografia tight, densità informativa alta, micro-interazioni discrete. Sopra di essa si stratifica un linguaggio visivo ispirato a visionOS: superfici glass traslucide, ambient gradient di fondo, ombre profonde stratificate, bordi luminosi inset. Il colore è funzionale ma non ostile: l'ambient di base regala calore, l'azione primaria ha un accent saturo che si stacca dal vetro. Voce UX: imperativa breve ("Aggiungi tag", "Categoria richiesta"), niente esclamativi, niente entusiasmo finto, niente emoji decorative.

## Anti-references

- **Jira / ClickUp**: toolbar infinite, dropdown nidificati, modali su modali, opzioni di configurazione esposte ovunque. Tazly nasconde la struttura, non la esibisce.
- **Trello**: griglia monotona di card identiche con stessa altezza e icona-titolo-testo ripetuti. Le card di Tazly variano in altezza in base al contenuto reale.
- **Apple Reminders / todo minimali**: liste piatte senza gerarchia visiva, troppo neutre, indistinguibili da una nota. Tazly è un tool da power user, non una checklist.
- **SaaS-cream generico**: gradient blu generici, hero metric giganti, card grid uniformi, palette neon. Il glass di Tazly è strutturale (superfici, depth), non decorativo.
- **Glass arbitrario**: blur dappertutto, tag neon, contrasto sparato. Il vetro deve avere una funzione (separare layer, dare profondità) — mai estetica fine a se stessa.

## Design Principles

1. **La tastiera è la prima interfaccia.** Mouse opzionale. Ogni azione ricorrente (quick add, switch progetto, focus, toggle categoria) deve avere una scorciatoia ovvia e una conferma visiva istantanea.
2. **Adattivo, non rigido.** Il layout reagisce alla quantità di contenuto: pochi progetti → tutti affiancati espansi; molti → sidebar + focus. Mai uno stato vuoto pesante né uno stato pieno illeggibile.
3. **Struttura controllata, attrito basso.** I tag sono curati (vocabolario chiuso) per evitare duplicati semantici (`feat`/`feature`/`features`), ma il quick-add resta a una sola riga, guidato da `Tab`.
4. **Niente modali.** Mai. Tutto è inline, focus mode, o sidebar. Aprire una card non chiude il contesto.
5. **Densità informativa onesta.** Spazio quando il contenuto è poco, compatto quando il contenuto è molto. Le card non hanno tutte la stessa altezza.
6. **Glass strutturale, azione solida.** Le superfici (card, header, popover) sono traslucide e stratificate. I CTA primari sono solidi e tinted (accent), per stagliarsi sul vetro con gerarchia chiara. Mai glass debole come azione primaria.

## Accessibility & Inclusion

Target WCAG 2.1 AA. Contrasto testo ≥ 4.5:1 sui colori semantici dei tag (validare ogni `TagColor` su sfondo chiaro e scuro). Focus visibile sempre, mai `outline: none` senza sostituto. Navigazione tastiera completa già implicita nel quick-add (`Tab`/`Shift+Tab`/`Esc`); estenderla a switch progetto, toggle categoria, focus mode. ARIA roles per board/list/listitem. Hit target minimo 32×32px per tap (anche se desktop-first). Da considerare in futuro: `prefers-reduced-motion` per le evidenziazioni post-creazione task.
