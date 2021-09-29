/**
 * @OnlyCurrentDoc
 */
function include(filename: string) {
  return HtmlService.createHtmlOutputFromFile(filename)
    .getContent()
}

function onOpen(e: unknown) {
  DocumentApp.getUi().createAddonMenu()
    .addItem('Open sidebar', 'showSidebar')
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
  const selectedText = getSelectedText(doc)
  if (selectedText && selectedText.length > 3) return {text: selectedText, index: -1}
  const elemAtCursor = getElemAtCursor(doc)
  if (elemAtCursor) {
    const body = doc.getBody()
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

function setSelection(index: number, startOffset: number, endOffset: number): void {
  const doc = DocumentApp.getActiveDocument()
  const child = new FluentIterable(iterateChildren(doc.getBody()))
    .filter(child => !!getChildText(child))
    .find((child, i) => i == index)
  if (child) {
    const range = doc.newRange()
    if (isContainerElement(child)) {
      new FluentIterable(iterateDescendants(child))
        .filter(child => child.getType() == DocumentApp.ElementType.TEXT)
        .reduceUntil((offset, child) => {
          const textChild = child.asText()
          const end = offset + textChild.getText().length
          if (end > startOffset) {
            if (end <= endOffset) {
              if (offset >= startOffset) range.addElement(child)
              else range.addElement(textChild, startOffset-offset, end-offset-1)
            }
            else {
              range.addElement(textChild, Math.max(0, startOffset-offset), endOffset-offset-1)
            }
          }
          return end
        }, 0, offset => offset >= endOffset)
    }
    else {
      range.addElement(child)
    }
    doc.setSelection(range)
  }
}

function batch(items: {method: string, args?: any[]}[]) {
  const methodMap: {[method: string]: Function} = {
    getTextCurrent,
    getText,
    setSelection,
    setUserPrefs,
  }
  return items.map(({method, args}) => methodMap[method](...args || []))
}

function setUserPrefs(prefs: any) {
  PropertiesService.getUserProperties().setProperty("prefs", JSON.stringify(prefs))
}

function embedUserPrefs() {
  const prefs = PropertiesService.getUserProperties().getProperty("prefs") || "{}"
  return `<script>var userPrefs = ${prefs}</script>`
}


// -----------------------------------------------------------------------------

function getSelectedText(doc: GoogleAppsScript.Document.Document): string|undefined {
  const selection = doc.getSelection()
  if (selection) {
    return selection.getRangeElements()
      .map(x => {
        const elem = x.getElement()
        if (elem.getType() == DocumentApp.ElementType.TEXT) {
          const text = elem.asText().getText()
          return x.isPartial() ? text.substring(x.getStartOffset(), x.getEndOffsetInclusive() +1) : text
        }
        else {
          return getChildText(elem)
        }
      })
      .filter(text => text)
      .join("\n\n")
  }
}

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

function* iterateChildren(elem: GoogleAppsScript.Document.Body|GoogleAppsScript.Document.ContainerElement) {
  for (let i=0; i<elem.getNumChildren(); i++) yield elem.getChild(i)
}

function* iterateDescendants(elem: GoogleAppsScript.Document.ContainerElement): Iterable<GoogleAppsScript.Document.Element> {
  for (const child of iterateChildren(elem)) {
    yield child
    if (isContainerElement(child)) yield* iterateDescendants(child)
  }
}

function isContainerElement(elem: GoogleAppsScript.Document.Element): elem is GoogleAppsScript.Document.ContainerElement {
  return typeof (elem as any).getChild == "function"
}

function getChildText(child: GoogleAppsScript.Document.Element): string|undefined {
  switch (child.getType()) {
    case DocumentApp.ElementType.PARAGRAPH:
      return child.asParagraph().getText().trim()
    case DocumentApp.ElementType.LIST_ITEM:
      return child.asListItem().getText().trim()
    case DocumentApp.ElementType.TABLE:
      return child.asTable().getText().trim()
    case DocumentApp.ElementType.TEXT:
      return child.asText().getText().trim()
  }
}


// -----------------------------------------------------------------------------

class FluentIterable<T> {
  constructor(private iterable: Iterable<T>) {
  }
  *$map<R>(mapper: (value: T, index: number) => R): Iterable<R> {
    let index = 0
    for (const value of this.iterable) {
      yield mapper(value, index)
      index++
    }
  }
  *$filter(predicate: (value: T, index: number) => boolean): Iterable<T> {
    let index = 0
    for (const value of this.iterable) {
      if (predicate(value, index)) yield value
      index++
    }
  }
  map<R>(mapper: (value: T, index: number) => R): FluentIterable<R> {
    return new FluentIterable(this.$map(mapper))
  }
  filter(predicate: (value: T, index: number) => boolean): FluentIterable<T> {
    return new FluentIterable(this.$filter(predicate))
  }
  find(predicate: (value: T, index: number) => boolean): T|undefined {
    let index = 0
    for (const value of this.iterable) {
      if (predicate(value, index)) return value
      index++
    }
  }
  reduceUntil<R>(reducer: (acc: R, value: T, index: number) => R, initial: R, predicate: (acc: R, index: number) => boolean): R {
    let acc = initial
    let index = 0
    for (const value of this.iterable) {
      acc = reducer(acc, value, index)
      if (predicate(acc, index)) break
      index++
    }
    return acc
  }
}
