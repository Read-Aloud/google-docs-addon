/**
 * @OnlyCurrentDoc
 */
function include(filename: string) {
  return HtmlService.createHtmlOutputFromFile(filename)
    .getContent()
}

function onOpen(e: unknown) {
  DocumentApp.getUi().createAddonMenu()
    .addItem('Open', 'showSidebar')
    .addToUi()
}

function onInstall(e: unknown) {
  onOpen(e)
}

function showSidebar() {
  const html = HtmlService.createTemplateFromFile('sidebar')
    .evaluate()
    .setTitle('Read Aloud')
  DocumentApp.getUi().showSidebar(html)
}


// -----------------------------------------------------------------------------

function getTextCurrent(): {text: string, index: number}|undefined {
  const doc = DocumentApp.getActiveDocument()
  const body = doc.getBody()
  const elemAtCursor = getElemAtCursor(doc)
  if (elemAtCursor) {
    const elem = new FluentIterable(iterateAncestors(elemAtCursor))
      .find(elem => elem.getParent().getType() == DocumentApp.ElementType.BODY_SECTION)!
    const elemIndex = elem.getParent().getChildIndex(elem)
    const child = new FluentIterable(iterateChildren(body))
      .map((elem, i) => ({elem, text: getChildText(elem), index: i}))
      .filter(({text}) => !!text)
      .map((child, i) => ({...child, actualIndex: i}))
      .find(({index}) => index >= elemIndex)
    if (child) return {text: child.text!, index: child.actualIndex}
  }
  return getText(0)
}

function getText(index: number): {text: string, index: number}|undefined {
  const doc = DocumentApp.getActiveDocument()
  const text = new FluentIterable(iterateChildren(doc.getBody()))
    .map(child => getChildText(child))
    .filter(text => !!text)
    .find((text, i) => i == index)
  if (text) return {text, index}
}

function setSelection(index: number): void {
  const doc = DocumentApp.getActiveDocument()
  const child = new FluentIterable(iterateChildren(doc.getBody()))
    .filter(child => !!getChildText(child))
    .find((child, i) => i == index)
  if (child) doc.setSelection(doc.newRange().addElement(child))
}


// -----------------------------------------------------------------------------

function getElemAtCursor(doc: GoogleAppsScript.Document.Document): GoogleAppsScript.Document.Element|undefined {
  const cursor = doc.getCursor()
  if (cursor) return cursor.getElement()
  const selection = doc.getSelection()
  if (selection) return selection.getRangeElements()[0].getElement()
}

function* iterateAncestors(elem: GoogleAppsScript.Document.Element) {
  do {
    yield elem
    elem = elem.getParent()
  }
  while (elem)
}

function* iterateChildren(body: GoogleAppsScript.Document.Body) {
  for (let i=0; i<body.getNumChildren(); i++) yield body.getChild(i)
}

function getChildText(child: GoogleAppsScript.Document.Element): string|undefined {
  switch (child.getType()) {
    case DocumentApp.ElementType.PARAGRAPH:
      return child.asParagraph().getText().trim()
    case DocumentApp.ElementType.LIST_ITEM:
      return child.asListItem().getText().trim()
    case DocumentApp.ElementType.TABLE:
      return child.asTable().getText().trim()
  }
}


// -----------------------------------------------------------------------------

class FluentIterable<T> {
  constructor(private iterable: Iterable<T>) {
  }
  map<R>(mapper: (value: T, index: number) => R): FluentIterable<R> {
    return new FluentIterable(mapIterable(this.iterable, mapper))
  }
  filter(predicate: (value: T, index: number) => boolean): FluentIterable<T> {
    return new FluentIterable(filterIterable(this.iterable, predicate))
  }
  find(predicate: (value: T, index: number) => boolean): T|undefined {
    return findIterable(this.iterable, predicate)
  }
  reduce<R>(reducer: (acc: R, value: T, index: number) => R, initialValue: R): R {
    return reduceIterable(this.iterable, reducer, initialValue)
  }
}

function* filterIterable<T>(iterable: Iterable<T>, predicate: (value: T, index: number) => boolean): Iterable<T> {
  let index = 0
  for (const value of iterable) {
    if (predicate(value, index)) yield value
    index++
  }
}

function* mapIterable<R, T>(iterable: Iterable<T>, mapper: (value: T, index: number) => R): Iterable<R> {
  let index = 0
  for (const value of iterable) {
    yield mapper(value, index)
    index++
  }
}

function findIterable<T>(iterable: Iterable<T>, predicate: (value: T, index: number) => boolean): T|undefined {
  let index = 0
  for (const value of iterable) {
    if (predicate(value, index)) return value
    index++
  }
}

function reduceIterable<R, T>(iterable: Iterable<T>, reducer: (acc: R, value: T, index: number) => R, initial: R): R {
  let acc = initial
  let index = 0
  for (const value of iterable) {
    acc = reducer(acc, value, index)
    index++
  }
  return acc
}
