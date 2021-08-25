/**
 * @OnlyCurrentDoc
 */

function onOpen(e) {
  DocumentApp.getUi().createAddonMenu()
    .addItem('Open', 'showSidebar')
    .addToUi()
}

function onInstall(e) {
  onOpen(e)
}

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('sidebar')
    .setTitle('Read Aloud')
  DocumentApp.getUi().showSidebar(html)
}
