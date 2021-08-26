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
  const children: GoogleAppsScript.Document.Element[] = []
  for (let i=0; i<body.getNumChildren(); i++) children.push(body.getChild(i))
  return children
    .filter(child => {
      switch (child.getType()) {
        case DocumentApp.ElementType.PARAGRAPH:
        case DocumentApp.ElementType.LIST_ITEM:
        case DocumentApp.ElementType.TABLE:
          return true
        default:
          return false
      }
    })
    .flatMap(child => {
      switch (child.getType()) {
        case DocumentApp.ElementType.PARAGRAPH:
          return child.asParagraph().getText().trim()
        case DocumentApp.ElementType.LIST_ITEM:
          const item = child.asListItem()
          const index = children
            .filter(c => c.getType() == DocumentApp.ElementType.LIST_ITEM && c.asListItem().getListId() == item.getListId())
            .findIndex(c => c == child)
          const itemNumber = index + 1
          const itemText = item.getText().trim()
          return itemNumber && itemText ? `${itemNumber}. ${itemText}` : itemText
        case DocumentApp.ElementType.TABLE:
          return child.asTable().getText().trim()
      }
    })
    .filter(text => text)
}
