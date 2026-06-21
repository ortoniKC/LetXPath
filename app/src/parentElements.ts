import { state } from "./state";
import {
  filterAttributesFromElement,
  addIndexToXpath,
  getNumberOfXPath,
  evaluateXPathExpression,
  checkIDNameClassHref,
} from "./utils";
import { escapeXpathString } from "./xpathUtils";

export function getParentId(element: HTMLElement, tagName: string): string | null {
  const clicketItemId = element.id;
  const re = new RegExp("\\d{" + state.maxId + ",}", "g");
  const matches = re.test(clicketItemId);
  if (clicketItemId != null && clicketItemId.length > 0 && matches == false) {
    const temp = `//${tagName}[@id=${escapeXpathString(clicketItemId)}]`;
    return temp;
  } else return null;
}

export function getParentName(element: HTMLElement, tagName: string): string | null {
  const clickedItemName = element.getAttribute("name");
  if (clickedItemName && clickedItemName.length > 0) {
    const matches = clickedItemName.match(/\d{3,}/g);
    if (matches == null) {
      const tempName = `//${tagName}[@name=${escapeXpathString(clickedItemName)}]`;
      return tempName;
    }
  }
  return null;
}

export function getParentClassName(element: HTMLElement, tagName: string): string | null {
  const clickedItemClass = element.className;
  if (typeof clickedItemClass !== "string") return null;
  const splitClass = clickedItemClass.trim().split(" ");
  if (splitClass.length > 2) {
    const cl = `${splitClass[0]} ${splitClass[1]}`;
    const temp = `//${tagName}[contains(@class,'${cl}')]`;
    return temp;
  } else if (!(clickedItemClass === "" || clickedItemClass === undefined)) {
    const tempClass = `//${tagName}[@class='${clickedItemClass}']`;
    return tempClass;
  } else return null;
}

export function addPreviousSibling(preSib: HTMLElement, tagName: string): void {
  try {
    let classHasSpace = false;
    let temp: string | null = null;
    const previousSiblingTagName = preSib.tagName.toLowerCase();
    if (previousSiblingTagName != "script") {
      Array.prototype.slice.call(preSib.attributes).forEach(function (item: Attr) {
        if (!filterAttributesFromElement(item)) {
          let tempvalue: string | null = null;
          switch (item.name) {
            case "id":
              if (preSib.hasAttribute("id")) {
                const id = preSib.id;
                const re = new RegExp("\\d{" + state.maxId + ",}", "g");
                const matches = re.test(id);
                if (id != null && id.length > 0 && matches == false) {
                  tempvalue = id;
                }
              }
              break;
            case "class":
              if (preSib.hasAttribute("class")) {
                tempvalue = preSib.className;
                const splClass = tempvalue.trim().split(" ");
                if (splClass.length > 2) {
                  tempvalue = `contains(@class,'${splClass[0]} ${splClass[1]}')`;
                  classHasSpace = true;
                }
              }
              break;
            case "name":
              if (preSib.hasAttribute("name")) {
                tempvalue = preSib.getAttribute("name");
              }
              break;
            default:
              tempvalue = item.value;
          }
          if (tempvalue == "") {
            tempvalue = null;
          }
          if (classHasSpace && tempvalue) {
            temp = `//${previousSiblingTagName}[${tempvalue}]/following-sibling::${tagName}[1]`;
            if (temp.startsWith("//")) {
              const evaluated = evaluateXPathExpression(temp);
              if (
                getNumberOfXPath(temp) == 1 &&
                evaluated &&
                evaluated.singleNodeValue &&
                (evaluated.singleNodeValue as HTMLElement).attributes.getNamedItem("letxxpath") !=
                  null
              ) {
                state.XPATHDATA.push([8, "Following sibling XPath", temp]);
              } else {
                const t = addIndexToXpath(
                  `//${previousSiblingTagName}[${tempvalue}]/following-sibling::${tagName}`,
                );
                if (t != undefined) {
                  state.XPATHDATA.push([8, "Following sibling XPath", t]);
                } else temp = null;
              }
            }
          } else if (tempvalue != null) {
            const escapedVal = escapeXpathString(tempvalue);
            temp = `//${previousSiblingTagName}[@${item.name}=${escapedVal}]/following-sibling::${tagName}[1]`;
            if (temp.startsWith("//")) {
              const evaluated = evaluateXPathExpression(temp);
              if (
                getNumberOfXPath(temp) == 1 &&
                evaluated &&
                evaluated.singleNodeValue &&
                (evaluated.singleNodeValue as HTMLElement).attributes.getNamedItem("letxxpath") !=
                  null
              ) {
                state.XPATHDATA.push([8, "Following sibling XPath", temp]);
              } else {
                const t = addIndexToXpath(
                  `//${previousSiblingTagName}[@${item.name}=${escapedVal}]/following-sibling::${tagName}`,
                );
                if (t != undefined) {
                  state.XPATHDATA.push([8, "Following sibling XPath", t]);
                } else temp = null;
              }
            }
          }
        }
      });
      if (temp == null || (preSib.innerText && preSib.innerText.length > 1)) {
        let temp1 = "";
        let labelText = "";
        let tag = "";
        let bo = false;
        if (preSib.parentNode) {
          const child = preSib.parentNode.children;
          for (let i = 0; i < child.length; i++) {
            const text = child[i].textContent;
            if (text && text.trim() != "") {
              labelText = text;
              tag = child[i].tagName.toLowerCase();
              break;
            }
          }
        }
        if (labelText.match(/[\r\n\x0B\x0C\u0085\u2028\u2029]+/g)) {
          labelText = labelText.replace(/[\r\n\x0B\x0C\u0085\u2028\u2029]+/g, " ");
          bo = true;
        }

        const escapedText = escapeXpathString(labelText);
        if (bo && labelText.trim().length > 1) {
          const trimmedEscaped = escapeXpathString(labelText.trim());
          temp1 = `//${tag}[text()[normalize-space()=${trimmedEscaped}]]/following-sibling::${tagName}[1]`;
        } else {
          temp1 = `//${tag}[text()=${escapedText}]/following-sibling::${tagName}[1]`;
        }
        const c = getNumberOfXPath(temp1);

        if (bo && labelText.trim().length > 1) {
          const trimmedEscaped = escapeXpathString(labelText.trim());
          temp1 = `//${tag}[text()[normalize-space()=${trimmedEscaped}]]/following-sibling::${tagName}`;
        } else {
          temp1 = `//${tag}[text()=${escapedText}]/following-sibling::${tagName}`;
        }

        if (c == 0) {
          return;
        }
        const evaluatedTemp1 = evaluateXPathExpression(temp1);
        if (
          c == 1 &&
          evaluatedTemp1 &&
          evaluatedTemp1.singleNodeValue &&
          (evaluatedTemp1.singleNodeValue as HTMLElement).attributes.getNamedItem("letxxpath") !=
            null
        ) {
          state.XPATHDATA.push([8, "Following sibling XPath", temp1]);
        } else if (c != undefined || c != null) {
          const xp = addIndexToXpath(temp1);
          if (xp != undefined) {
            state.XPATHDATA.push([8, "Following sibling XPath", xp]);
          }
        }
      }
    }
  } catch (error) {}
}

export function getParent(element: HTMLElement, tagName: string): void {
  let parent = element.parentNode as HTMLElement | null;
  if (!parent) return;
  let bo = false;
  bo = checkIDNameClassHref(parent, bo);
  while (bo == false && parent) {
    parent = parent.parentNode as HTMLElement | null;
    if (parent) bo = checkIDNameClassHref(parent, bo);
  }
  if (!parent) return;
  const attributeElement = parent.attributes;
  const tag = parent.tagName.toLowerCase();
  let parentId: string | null = null;
  let parentClass: string | null = null;
  let parentName: string | null = null;
  let others: string | null = null;
  Array.prototype.slice.call(attributeElement).forEach(function (item: Attr) {
    if (!filterAttributesFromElement(item)) {
      switch (item.name) {
        case "id":
          parentId = getParentId(parent!, tag);
          break;
        case "class":
          parentClass = getParentClassName(parent!, tag);
          break;
        case "name":
          parentName = getParentName(parent!, tag);
          break;
        default:
          const temp = item.value;
          if (temp != "") {
            others = `//${tag}[@${item.name}='${temp}']`;
          }
          break;
      }
    }
  });
  if (parentId != null) {
    getParentXp(parentId, tagName, "id");
  }
  if (parentClass != null) {
    getParentXp(parentClass, tagName, "class");
  }
  if (parentName != null) {
    getParentXp(parentName, tagName, "name");
  }
  if (others != null) {
    getParentXp(others, tagName, "attribute");
  }

  function getParentXp(parentXPath: string, targetTagName: string, locator: string) {
    let tem = `${parentXPath}//${targetTagName}[1]`;
    const checkTem = evaluateXPathExpression(tem);
    let c = getNumberOfXPath(tem);
    if (c == 0) {
      return;
    }
    if (c == 1) {
      try {
        if (
          checkTem &&
          checkTem.singleNodeValue &&
          (checkTem.singleNodeValue as HTMLElement).hasAttribute("letxxpath")
        ) {
          state.XPATHDATA.push([9, `Parent ${locator} XPath`, tem]);
        } else {
          tem = `${parentXPath}//${targetTagName}`;
          c = getNumberOfXPath(tem);
          if (c == 0) {
            return;
          }
          if (c && c >= 1) {
            try {
              const te = addIndexToXpath(tem);
              if (te) {
                const checkTe = evaluateXPathExpression(te);
                if (
                  checkTe &&
                  checkTe.singleNodeValue &&
                  (checkTe.singleNodeValue as HTMLElement).getAttribute("letxxpath") === "letX"
                ) {
                  state.XPATHDATA.push([9, `Parent ${locator} XPath`, te]);
                }
              }
            } catch (e) {}
          }
        }
      } catch (e) {}
    } else if (c && c > 1) {
      tem = `${parentXPath}//${targetTagName}`;
      const t = addIndexToXpath(tem);
      if (t != undefined && t != null) {
        state.XPATHDATA.push([9, `Parent ${locator} XPath`, t]);
      }
    }
  }
}
