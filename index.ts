/**
 * @OnlyCurrentDoc
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
    .getContent()
}

function onOpen(e) {
  DocumentApp.getUi().createAddonMenu()
    .addItem('Open', 'showSidebar')
    .addToUi()
}

function onInstall(e) {
  onOpen(e)
}

function showSidebar() {
  const html = HtmlService.createTemplateFromFile('sidebar')
    .evaluate()
    .setTitle('Read Aloud')
  DocumentApp.getUi().showSidebar(html)
}
