import { state } from "./state";
import { getTextBasedXPath } from "./textXPath";
import { evaluateXPathExpression, getNumberOfXPath, addIndexToXpath } from "./utils";

export function findLabel(element: HTMLElement, tagName: string): void {
  let label: string | undefined = undefined;
  let span: string | undefined = undefined;
  const ele = `//*[@letxxpath='letX']`;
  try {
    label = getLabelText(ele, tagName);
  } catch (error) {}
  try {
    span = getSpanText(ele, tagName);
  } catch (error) {}
  try {
    if (label === undefined && span === undefined) {
      const xp = getParentText(element, tagName);
      if (xp) {
        const temp = xp;
        const evaluated = evaluateXPathExpression(xp);
        if (
          evaluated &&
          evaluated.singleNodeValue &&
          (evaluated.singleNodeValue as HTMLElement).attributes.getNamedItem("letxxpath") != null
        ) {
          state.XPATHDATA.push([6, "Text based following XPath", temp]);
        } else {
          const indexed = addIndexToXpath(temp);
          if (indexed != null) {
            state.XPATHDATA.push([6, "Text based following XPath", indexed]);
          }
        }
      }
    }
  } catch (error) {}
}

export function getParentText(element: HTMLElement, tagName: string): string | null {
  let ep = element.parentNode?.parentNode as HTMLElement | null;
  if (!ep) return null;
  const child = ep.children;
  let tagN: string | null = null;
  let setBool = false;
  for (let i = 0; i < child.length; i++) {
    const innerChildLen = child[i].children.length;
    for (let j = 0; j < innerChildLen; j++) {
      const innerChild = child[i].children[j] as HTMLElement;
      if (innerChild.textContent && innerChild.textContent.length > 1) {
        ep = innerChild;
        tagN = ep.tagName;
        setBool = true;
        break;
      }
    }
    if (setBool) break;
  }
  if (!ep || !tagN) return null;
  const text = getTextBasedXPath(ep, tagN.toLowerCase());
  if (!text) return null;
  const temp = `${text}/following::${tagName}`;
  const count = getNumberOfXPath(temp);
  if (count == 1) {
    const xp = `${text}/following::${tagName}[1]`;
    return xp;
  } else if (count !== undefined && count > 1) {
    const xp = `${text}/following::${tagName}`;
    const indexed = addIndexToXpath(xp);
    return indexed || xp;
  } else return null;
}

export function getLabelText(ele: string, tagName: string): string | undefined {
  const labelNode = `${ele}/preceding::label[1]`;
  const checkLabelType = evaluateXPathExpression(labelNode);
  try {
    if (
      checkLabelType &&
      checkLabelType.singleNodeValue &&
      typeof checkLabelType.singleNodeValue.textContent === "string"
    ) {
      return getLabel(labelNode, tagName);
    } else {
      throw new Error("no label preceding");
    }
  } catch (error) {}
}

export function getSpanText(ele: string, tagName: string): string | undefined {
  const spanNode = `${ele}/preceding::span[1]`;
  const checkSpanType = evaluateXPathExpression(spanNode);
  try {
    if (
      checkSpanType &&
      checkSpanType.singleNodeValue &&
      typeof checkSpanType.singleNodeValue.textContent === "string"
    ) {
      return getLabel(spanNode, tagName);
    } else {
      throw new Error("no span text");
    }
  } catch (error) {}
}

export function getLabel(node: string, tagName: string): string | undefined {
  const c = getNumberOfXPath(node);
  if (c !== undefined && c > 0) {
    const label = evaluateXPathExpression(node);
    const newEle = label?.singleNodeValue as HTMLElement | null;
    if (newEle) {
      const labelTag = newEle.tagName.toLowerCase();
      const labelText = getTextBasedXPath(newEle, labelTag);
      if (labelText) {
        const newLabelXpath = labelText + "/" + "following::" + tagName;
        if (getNumberOfXPath(newLabelXpath) == 1) {
          const newLabel = evaluateXPathExpression(newLabelXpath);
          if (
            newLabel &&
            newLabel.singleNodeValue &&
            (newLabel.singleNodeValue as HTMLElement).attributes.getNamedItem("letxxpath") != null
          ) {
            state.XPATHDATA.push([6, "Text based following XPath", newLabelXpath]);
            return newLabelXpath;
          }
        } else {
          const labelTextWithIndex = addIndexToXpath(newLabelXpath);
          if (labelTextWithIndex) {
            const newLabel = evaluateXPathExpression(labelTextWithIndex);
            if (
              newLabel &&
              newLabel.singleNodeValue &&
              (newLabel.singleNodeValue as HTMLElement).attributes.getNamedItem("letxxpath") != null
            ) {
              state.XPATHDATA.push([6, "Text based following XPath", labelTextWithIndex]);
              return labelTextWithIndex;
            }
          }
        }
      }
    }
  }
}
