// Service worker minimale: apre Tazly come pagina full-tab on-demand e gestisce
// la scorciatoia che inietta il widget di cattura promemoria nella pagina corrente.

import { injectCaptureOverlay } from './widgetOverlay'

chrome.action.onClicked.addListener(async () => {
  const url = chrome.runtime.getURL('index.html')

  const [existing] = await chrome.tabs.query({ url })

  if (existing?.id != null) {
    await chrome.tabs.update(existing.id, { active: true })
    if (existing.windowId != null) {
      await chrome.windows.update(existing.windowId, { focused: true })
    }
    return
  }

  await chrome.tabs.create({ url })
})

/** Pagine dove un content script non può girare (store, pagine riservate del browser). */
function isInjectable(url: string | undefined): boolean {
  if (!url) return false
  if (!/^https?:\/\//.test(url) && !url.startsWith('file://')) return false
  if (url.startsWith('https://chrome.google.com/webstore')) return false
  if (url.startsWith('https://chromewebstore.google.com')) return false
  return true
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'open-quick-add') return

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab?.id == null || !isInjectable(tab.url)) return

  const widgetUrl = chrome.runtime.getURL('widget.html')
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: injectCaptureOverlay,
      args: [widgetUrl],
    })
  } catch {
    // pagina non iniettabile (es. PDF viewer, pagine protette): ignora silenziosamente
  }
})
