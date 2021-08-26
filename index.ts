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

function getTexts() {
  const body = DocumentApp.getActiveDocument().getBody()
  const children = []
  for (let i=0; i<body.getNumChildren(); i++) children.push(body.getChild(i))
  return children
    .filter(child => child.getType() === DocumentApp.ElementType.PARAGRAPH)
    .map(child => child.getText().trim())
    .filter(text => text)
}
