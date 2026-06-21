import { state } from "./state";

export function getTextBasedXPath(element: HTMLElement, tagName: string): string | null {
  const textContent = element.textContent ? element.textContent.trim() : "";
  if (!textContent) return null;

  if (tagName === "a") return handleLinkText(element, textContent);

  const normalizedTextContent = textContent.replace(/\s+/g, " ");
  const xpaths = [
    `//${tagName}[normalize-space(text())='${normalizedTextContent}']`,
    `//${tagName}[text()='${textContent}']`,
    `//${tagName}[contains(text(),'${textContent}')]`,
    Array.from(element.childNodes).some((node) => node.nodeName === "BR")
      ? `//${tagName}[contains(.,'${textContent}')]`
      : null,
    handleComplexText(element, tagName, textContent),
  ].filter(Boolean) as string[];

  for (const xpath of xpaths) {
    if (validateXPath(xpath)) return xpath;
  }

  return null;
}

export function handleLinkText(element: HTMLElement, textContent: string): string | null {
  const normalizedTextContent = textContent.replace(/\s+/g, " ");
  const xpaths = [
    `//a[normalize-space(text())='${normalizedTextContent}']`,
    `//a[contains(text(),'${normalizedTextContent}')]`,
  ];

  if (element.childElementCount > 0) {
    const firstChild = element.children[0] as HTMLElement;
    const partialText = firstChild.innerText ? firstChild.innerText.trim() : "";
    if (partialText) {
      xpaths.push(`//a[contains(text(),'${partialText}')]`);
    }
  }

  for (const xpath of xpaths) {
    if (validateXPath(xpath)) return xpath;
  }

  return null;
}

export function handleComplexText(
  element: HTMLElement,
  tagName: string,
  textContent: string,
): string | null {
  const xpaths = [`//${tagName}[contains(.,'${textContent}')]`];

  for (let i = 0; i < element.childNodes.length; i++) {
    const child = element.childNodes[i];
    if (child.nodeType === Node.TEXT_NODE && child.textContent && child.textContent.trim()) {
      xpaths.push(`//${tagName}[text()='${child.textContent.trim()}']`);
    }
  }

  for (const xpath of xpaths) {
    if (validateXPath(xpath)) return xpath;
  }

  return null;
}

export function validateXPath(xpath: string): boolean {
  return getNumberOfTextXPath(xpath) === 1;
}

export function addIndexToXpath(xpath: string): string {
  const count = getNumberOfTextXPath(xpath);
  if (count > 1) {
    for (let i = 1; i <= count; i++) {
      const indexedXPath = `(${xpath})[${i}]`;
      if (validateXPath(indexedXPath)) return indexedXPath;
    }
  }
  return xpath;
}

export function getNumberOfTextXPath(xpath: string): number {
  try {
    const result = state.elementOwnerDocument.evaluate(
      xpath,
      state.elementOwnerDocument,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null,
    );
    return result.snapshotLength;
  } catch (e) {
    return 0;
  }
}
