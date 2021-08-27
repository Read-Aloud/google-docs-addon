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

function getCurrentIndex(): number {
  const doc = DocumentApp.getActiveDocument()
  const body = doc.getBody()
  const cursor = doc.getCursor()
  if (cursor != null) {
    const elem = new FluentIterable(iterateAncestors(cursor.getElement()))
      .find(elem => elem.getParent().getType() == DocumentApp.ElementType.BODY_SECTION)!
    const elemIndex = elem.getParent().getChildIndex(elem)
    const child = new FluentIterable(iterateChildren(body))
      .map((elem, i) => ({elem, text: getChildText(elem), index: i}))
      .filter(({text}) => !!text)
      .map((child, i) => ({...child, actualIndex: i}))
      .find(({index}) => index >= elemIndex)
    return child ? child.actualIndex : 0
  }
  return 0
}

function getText(index: number): string|undefined {
  const doc = DocumentApp.getActiveDocument()
  const child = new FluentIterable(iterateChildren(doc.getBody()))
    .map(elem => ({elem, text: getChildText(elem)}))
    .filter(({text}) => !!text)
    .find((child, i) => i == index)
  if (child) {
    doc.setSelection(doc.newRange().addElement(child.elem))
    return child.text
  }
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


// --------------------------------

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
