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

function getCurrentIndex() {
  const cursor = DocumentApp.getActiveDocument().getCursor()
  if (cursor != null) {
    let elem = cursor.getElement()
    while (elem.getParent().getType() != DocumentApp.ElementType.BODY_SECTION) elem = elem.getParent()
    return elem.getParent().getChildIndex(elem)
  }
  return 0
}

function getText(index: number) {
  const body = DocumentApp.getActiveDocument().getBody()
  if (index >= body.getNumChildren()) return null
  const child = body.getChild(index)
  switch (child.getType()) {
    case DocumentApp.ElementType.PARAGRAPH:
      return child.asParagraph().getText().trim()
    case DocumentApp.ElementType.LIST_ITEM:
      return child.asListItem().getText().trim()
    case DocumentApp.ElementType.TABLE:
      return child.asTable().getText().trim()
    default:
      return ""
  }
}
