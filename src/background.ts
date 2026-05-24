// Service worker minimale: apre Tazly come pagina full-tab on-demand.
// Al click sull'icona della toolbar focalizza la tab già aperta, se esiste,
// altrimenti ne crea una nuova. Evita copie duplicate della board.

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
