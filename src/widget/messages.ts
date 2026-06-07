/**
 * Contratto postMessage tra l'overlay (iniettato nella pagina ospite) e il widget
 * (iframe cross-origin). SOLO TIPI: `widgetOverlay.ts` viene serializzato con
 * toString() e iniettato, quindi non può importare valori a runtime — ma gli
 * `import type` sono cancellati in compilazione, perciò il contratto si condivide
 * qui ed è verificato dal compilatore ai due capi. Le stringhe `type` restano
 * letterali inline nei due file (il vincolo runtime non lascia alternative), ma
 * ora un refuso o un campo mancante diventa un errore di tipo.
 */

/** Overlay → widget: testo cliccato sulla pagina + provenienza (la vede solo l'overlay). */
export interface CaptureMessage {
  type: 'tazly:capture'
  text: string
  sourceUrl: string
  sourceTitle: string
}

/** Widget → overlay. */
export interface ReadyMessage {
  type: 'tazly:ready'
}
export interface CloseMessage {
  type: 'tazly:close'
}
export interface ResizeMessage {
  type: 'tazly:resize'
  height: number
}
/** Entra/esce dalla modalità selezione: l'overlay rimpicciolisce l'iframe a icona
 *  (in alto a destra) e lascia la pagina libera per la selezione nativa del testo. */
export interface SelectModeMessage {
  type: 'tazly:select-mode'
  on: boolean
}

export type OverlayToWidget = CaptureMessage
export type WidgetToOverlay = ReadyMessage | CloseMessage | ResizeMessage | SelectModeMessage
