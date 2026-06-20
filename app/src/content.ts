import { state } from './state';
import { 
  evaluateXPathExpression, 
  getNumberOfXPath, 
  filterAttributesFromElement, 
  addIndexToXpath, 
  addIndexToAxesXpath, 
  frameXPath, 
  addHighlighter, 
  clearHighlighter, 
  removeletxxpath 
} from './utils';
import { xPathToCss } from './conversion';
import { getAnchorXPath } from './anchorXPath';
import { getTextBasedXPath } from './textXPath';
import { findLabel } from './getLabel';
import { getParent, addPreviousSibling } from './parentElements';
import { handleTable } from './handleTable';
import { getLongCssPath, getClassCSS, getXPathWithPosition } from './getCSS';
import { getMethodOrVarText, getVariableAndMethodName } from './methodName';
import { buildPlaywrightLocators } from './playwrightLocators';

export function sendToDev(data: any): void {
  sendMessage({ request: "fromUtilsSelector", data: data });
}

// used to send/receive message with in extension
const receiver = (message: any, _sender: any, sendResponse: (r: any) => void) => {
  switch (message.request) {
    case "dotheconversion":
      const input = message.data;
      const output = xPathToCss(input);
      sendMessage({
        request: "conversion",
        output: output,
      });
      break;
    case "parseAxes":
      try {
        let value = message.data;
        let axesSnapshot = state.elementOwnerDocument.evaluate(
          value,
          state.elementOwnerDocument,
          null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
          null
        );
        let axesCount = axesSnapshot.snapshotLength;
        if (axesCount == 0 || axesCount == undefined) {
          sendMessage({
            request: "axes",
            data: "Sorry! Please try with different XPath combination",
          });
        } else if (axesCount == 1) {
          sendMessage({ request: "axes", data: value });
        } else if (axesCount > 1) {
          let ex = addIndexToAxesXpath(value);
          if (ex != null) {
            sendMessage({ request: "axes", data: ex });
          } else {
            sendMessage({
              request: "axes",
              data: "Sorry! Please try with different XPath combination",
            });
          }
        }
      } catch (error) {}
      break;
    case "context_menu_click":
      if (state.targetElemt) {
        parseAnchorXP(state.targetElemt);
      }
      state.atrributesArray = [];
      state.webTableDetails = null;
      break;
    case "userSearchXP":
      let val = message.data;
      let customSnapshot: XPathResult | undefined;
      let customCount = 0;
      try {
        customSnapshot = state.elementOwnerDocument.evaluate(
          val,
          state.elementOwnerDocument,
          null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
          null
        );
        customCount = customSnapshot.snapshotLength;
      } catch (error) {
        customCount = 0;
      }
      let isXPathCorrect = customCount > 0 ? "XPath found" : "Wrong XPath";
      if (customCount > 0 && customSnapshot) {
        addHighlighter(customSnapshot);
      }
      sendMessage({
        request: "customSearchResult",
        data: {
          xpath: isXPathCorrect,
          count: customCount,
        },
      });
      break;
    case "cleanhighlight":
      let removeCSS = "//*[@letcss='1']";
      let cleanSnapshot: XPathResult | undefined;
      let cleanCount = 0;
      try {
        cleanSnapshot = state.elementOwnerDocument.evaluate(
          removeCSS,
          state.elementOwnerDocument,
          null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
          null
        );
        cleanCount = cleanSnapshot.snapshotLength;
      } catch (error) {
        cleanCount = 0;
      }
      if (cleanCount > 0 && cleanSnapshot) {
        clearHighlighter(cleanSnapshot);
      }
      break;
    default:
      if (sendResponse) sendResponse(true);
  }
};

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener(receiver);
}

// capture mouse events once the DOM is loaded
window.addEventListener("DOMContentLoaded", () => {
  document.addEventListener(
    "mousedown",
    (event) => {
      state.targetElemt = event.target as HTMLElement;
    },
    false
  );
});

export function buildSelectedFields(targetElement: HTMLElement) {
  state.elementOwnerDocument = targetElement.ownerDocument;
  if (targetElement != null) {
    try {
      state.maxIndex = 5;
      if (targetElement.getAttribute('type') !== "hidden") {
        buildXpath(targetElement, 0, true);
      }
    } catch (error: any) {
      if (error.message === "shadow dom not yet supported") {
        state.XPATHDATA = [];
      }
    }
  }
}

export function parseDOM(targetElement: HTMLElement) {
  try {
    if (targetElement != null) {
      state.elementOwnerDocument = targetElement.ownerDocument;
      try {
        state.maxIndex = 5;
        buildXpath(targetElement, 0, false);
      } catch (error: any) {
        if (error.message === "shadow dom not yet supported") {
          state.XPATHDATA = [];
        }
      }

      // Get raw attributes for Playwright locator generation
      let attrs: Record<string, string> = {};
      if (targetElement.attributes) {
        for (let i = 0; i < targetElement.attributes.length; i++) {
          const attr = targetElement.attributes[i];
          if (attr.name !== 'letxxpath' && attr.name !== 'letcss') {
            attrs[attr.name] = attr.value;
          }
        }
      }

      // Get truncated text content
      let textContent = targetElement.textContent?.trim() || "";
      if (textContent.length > 80) {
        textContent = textContent.slice(0, 80) + "...";
      }

      // Find associated label text
      let labelText: string = "";
      if (targetElement.id) {
        const associatedLabel = targetElement.ownerDocument.querySelector(`label[for="${targetElement.id}"]`);
        if (associatedLabel) {
          labelText = associatedLabel.textContent?.trim() || "";
        }
      }
      if (!labelText) {
        const precedingLabel = targetElement.previousElementSibling;
        if (precedingLabel && precedingLabel.tagName === 'LABEL') {
          labelText = precedingLabel.textContent?.trim() || "";
        } else {
          const closestLabel = targetElement.closest('label');
          if (closestLabel) {
            labelText = closestLabel.textContent?.trim() || "";
          }
        }
      }
      if (labelText.length > 80) {
        labelText = labelText.slice(0, 80) + "...";
      }

      // Generate Playwright specific locators using the Playwright repository priority strategy
      const pwLocators = buildPlaywrightLocators(targetElement, state.XPATHDATA, state.CSSPATHDATA);

      let domInfo = {
        request: "send_to_dev",
        cssPath: state.CSSPATHDATA,
        webtabledetails: state.webTableDetails,
        xpathid: state.XPATHDATA.sort(),
        tag: state.tag,
        type: state.type,
        hasFrame: state.frameXPATH,
        variablename: state.variablename,
        methodname: state.methodName,
        anchor: false,
        atrributesArray: state.atrributesArray,
        attributes: attrs,
        text: textContent,
        labelText: labelText,
        playwrightLocators: pwLocators
      };
      
      sendMessage(domInfo);

      state.atrributesArray = [];
      state.webTableDetails = null;
    }
  } catch (error) {}
}

export async function sendMessage(msg: any): Promise<any> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage(msg, (response) => {
        resolve(response);
      });
    } else {
      resolve(null);
    }
  });
}

export function parseAnchorXP(targetElement: HTMLElement) {
  if (targetElement != null) {
    try {
      state.maxIndex = 20;
      buildXpath(state.targetElemt!, 1, false);
    } catch (error) {}
  }
}

export function buildXpath(element: HTMLElement, boolAnchor: number, _utils: boolean) {
  if (element.shadowRoot != null) {
    sendMessage({
      shadowRoot: true,
      anchor: undefined,
    });
    throw new TypeError("shadow dom not yet supported");
  }
  let removeletX = `//*[@letxxpath='letX']`;
  try {
    let re = evaluateXPathExpression(removeletX);
    if (re && re.singleNodeValue != null) {
      (re.singleNodeValue as HTMLElement).removeAttribute("letxxpath");
    }
  } catch (error) {}

  // add a attribute to locate the element
  element.setAttribute("letxxpath", "letX");
  // generate method and varible name
  try {
    let name = getMethodOrVarText(element);
    getVariableAndMethodName(name);
    
    state.methodName = state.methodName && state.methodName.length >= 2 && state.methodName.length < 25
      ? state.methodName
      : (state.methodName ? state.methodName.slice(0, 12) : 'ele');
      
    state.variableName = state.variableName && state.variableName.length >= 2 && state.variableName.length < 25
      ? state.variableName
      : (state.variableName ? state.variableName.slice(0, 12) : 'ele');
      
    state.variablename = state.variableName != null && state.variableName.length > 1 ? state.variableName : "ele";
    state.methodName = state.methodName != null && state.methodName.length > 1 ? state.methodName : "ele";
  } catch (error) {
    state.variablename = null;
  }
  
  // create an array to put available xpath - generate different type and add
  state.XPATHDATA = [];
  state.CSSPATHDATA = [];
  
  // Handle SVG
  let currentElement: HTMLElement | null = element;
  if (
    (currentElement as any).farthestViewportElement != undefined ||
    currentElement.tagName === "SVG" ||
    currentElement.tagName === "svg"
  ) {
    try {
      currentElement = (currentElement as any).farthestViewportElement.parentNode as HTMLElement;
    } catch (error) {
      currentElement = currentElement.parentNode as HTMLElement;
    }
  }
  
  // To get tag name
  let tagName = currentElement.tagName.toLowerCase();
  state.tag = tagName;
  if (currentElement.hasAttribute("type")) {
    state.type = currentElement.getAttribute('type');
  }

  if (state.elementOwnerDocument.getElementsByTagName(tagName).length == 1) {
    state.XPATHDATA.push([10, "Unique TagName", tagName]);
  }

  // Find no.of frames available, then generate XPath or index for that
  try {
    let fr = document.querySelectorAll("iframe");
    if (fr.length > 0) {
      state.frameXPATH = frameXPath(fr[0] as HTMLIFrameElement) || null;
    }
  } catch (error) {}

  // To get all attribuites
  let attributeElement = currentElement.attributes;
  let preiousSiblingElement = currentElement.previousElementSibling as HTMLElement | null;

  // To iterate all attributes xpath
  try {
    addAllXpathAttributesBased(attributeElement, tagName, currentElement);
  } catch (e) {}

  // Following-sibling push to array
  try {
    if (preiousSiblingElement) {
      xpathFollowingSibling(preiousSiblingElement, tagName);
    }
  } catch (e) {}

  // Text Based xpath
  try {
    if (currentElement.textContent && currentElement.textContent.trim() != "") {
      xpathText(currentElement, tagName);
    }
  } catch (e) {}

  // to find label - following xpath only if tag name name is 'input or textarea'
  try {
    if (tagName === "input" || tagName === "textarea") {
      findLabel(currentElement, tagName);
    }
  } catch (e) {}

  // get Parent node
  try {
    getParent(currentElement, tagName);
  } catch (error) {}

  try {
    if (currentElement.closest("table")) {
      state.tag = "select";
      handleTable(currentElement);
    }
  } catch (error) {}
  
  // Based on parent XPath
  try {
    if (state.XPATHDATA.length < 3) {
      state.XPATHDATA.push([90, "Closest ID XPath", getXPathWithPosition(currentElement)]);
    }
  } catch (error) {}

  try {
    let css = getLongCssPath(currentElement);
    let csslen = css.split(">");
    if (csslen.length < 5) {
      state.CSSPATHDATA.push([11, "Closest ID CSS", css]);
    }
  } catch (error) {}

  // AXES BASED XPATH
  switch (boolAnchor) {
    case 0:
      try {
        removeletxxpath(currentElement);
      } catch (e) {}
      break;
    case 1:
      state.tagArrHolder.push(tagName);
      getAnchorXPath(state.XPATHDATA, state.tagArrHolder, state.dupArray, currentElement);
      break;
  }
}

// Add xpath following-sibling
export function xpathFollowingSibling(preiousSiblingElement: HTMLElement, tagName: string) {
  if (preiousSiblingElement != null || preiousSiblingElement != undefined) {
    addPreviousSibling(preiousSiblingElement, tagName);
  }
}

// Get Text based XPath
export function xpathText(element: HTMLElement, tagName: string) {
  let getTextXPathEle = getTextBasedXPath(element, tagName);
  if (!(getTextXPathEle === null || getTextXPathEle === undefined)) {
    state.XPATHDATA.push([6, "Text based XPath", getTextXPathEle]);
  }
}

// To get Name based xpath - //tagName[@name='nameValue'] - index upto 3
export function getNameXPath(element: HTMLElement, tagName: string): string | null | undefined {
  let nameBasedXpath = null;
  const nameAttr = element.getAttribute('name');
  if (!nameAttr) return null;
  let matches = nameAttr.match(/\d{3,}/g);
  if (
    !(
      nameAttr === "" ||
      nameAttr === undefined ||
      matches != null
    )
  ) {
    let tempName = "[@name='" + nameAttr + "']";
    let tem = `//*${tempName}`;
    let count = getNumberOfXPath(tem);
    if (count == 1) {
      state.XPATHDATA.push([102, "Unique Name", nameAttr]);
      state.CSSPATHDATA.push([
        3,
        "Unique Name",
        `${tagName}[name='${nameAttr}']`,
      ]);
    } else if (count !== undefined && count > 1) {
      tem = `//${tagName}${tempName}`;
      nameBasedXpath = addIndexToXpath(tem);
    }
  }
  return nameBasedXpath;
}

// To get class based xpath - //tagName[@class='classValue'] - differs based on no.of classes
export function getClassXPath(element: HTMLElement, tagName: string): string | null | undefined {
  getClassCSS(element);
  let classBasedXpath = null;
  let clickedItemClass = element.className;
  if (typeof clickedItemClass !== 'string') return null;
  let splitClass = clickedItemClass.trim().split(" ");
  if (splitClass.length > 2) {
    let cl = `${splitClass[0]} ${splitClass[1]}`;
    let temp = `//${tagName}[contains(@class,'${cl}')]`;
    let count = getNumberOfXPath(temp);
    if (count == 0) {
      return null;
    }
    if (count == 1) {
      state.CSSPATHDATA.push([
        3,
        "Unique class css",
        `${tagName}.${splitClass[0]}.${splitClass[1]}`,
      ]);
    } else if (count !== undefined && count > 1) {
      temp = addIndexToXpath(temp) || temp;
    }
    return temp;
  }
  if (!(clickedItemClass === "" || clickedItemClass === undefined)) {
    let tempClass = `//*[@class='${clickedItemClass}']`;
    let count = getNumberOfXPath(tempClass);
    let spl = clickedItemClass.trim().split(" ");
    if (count == 1 && spl.length == 1) {
      state.XPATHDATA.push([3, "Unique Class Atrribute", clickedItemClass]);
      state.CSSPATHDATA.push([3, "Unique Class Atrribute", "." + clickedItemClass]);
      return null;
    } else {
      classBasedXpath = `//${tagName}[@class='${clickedItemClass}']`;
      let count = getNumberOfXPath(classBasedXpath);
      if (count == 0) {
        return null;
      } else if (count == 1) {
        return classBasedXpath;
      } else if (count !== undefined && count > 1) {
        classBasedXpath = addIndexToXpath(classBasedXpath) || classBasedXpath;
      }
    }
  }
  return classBasedXpath;
}

export function getIDXPath(element: HTMLElement, tagName: string): string | null | undefined {
  let idBasedXpath = null;
  let clicketItemId = element.id;
  let re = new RegExp("\\d{" + state.maxId + ",}", "g");
  let matches = re.test(clicketItemId);
  if (clicketItemId != null && clicketItemId.length > 0 && matches == false) {
    let tempId = "[@id='" + clicketItemId + "']";
    idBasedXpath = "//" + "*" + tempId;
    let count = getNumberOfXPath(idBasedXpath);
    if (count == 0) {
      return null;
    } else if (count == 1) {
      return clicketItemId;
    } else {
      idBasedXpath = "//" + tagName + tempId;
      if (count !== undefined && count > 1) {
        idBasedXpath = addIndexToXpath(idBasedXpath) || idBasedXpath;
        if (idBasedXpath != null) {
          state.XPATHDATA.push([1, "XPath using Id", idBasedXpath]);
        }
        return null;
      }
    }
  }
  return idBasedXpath;
}

// Add all attributes xpath except filter
export function addAllXpathAttributesBased(attribute: NamedNodeMap, tagName: string, element: HTMLElement) {
  Array.prototype.slice.call(attribute).forEach(function (item: Attr) {
    if (item.value === "letX" || filterAttributesFromElement(item)) {
      return;
    }

    switch (item.name) {
      case "id":
        let id = getIDXPath(element, tagName);
        if (id != null) {
          state.XPATHDATA.push([1, "Unique ID", id]);
          state.CSSPATHDATA.push([1, "Unique ID", `#${id}`]);
        }
        break;
      case "class":
        let className = getClassXPath(element, tagName);
        if (className != null) {
          state.XPATHDATA.push([3, "Class based XPath", className]);
        }
        break;
      case "name":
        let name = getNameXPath(element, tagName);
        if (name != null) {
          state.XPATHDATA.push([2, "Name based XPath", name]);
        }
        break;
      default:
        let temp = item.value;
        if (temp !== "") {
          let allXpathAttr = `//${tagName}[@${item.name}='${temp}']`;
          let xpathResult = getNumberOfXPath(allXpathAttr);
          if (xpathResult == 1) {
            state.XPATHDATA.push([4, `${item.name}`, allXpathAttr]);
            state.CSSPATHDATA.push([
              4,
              `${item.name}`,
              `${tagName}[${item.name}='${temp}']`,
            ]);
          } else {
            let indexedXPath = addIndexToXpath(allXpathAttr);
            if (indexedXPath !== undefined && indexedXPath !== null) {
              state.XPATHDATA.push([4, `${item.name}`, indexedXPath]);
            }
          }
        }
        break;
    }
    state.atrributesArray.push(item.name);
  });
}

// Expose parseDOM globally for inspected window evaluations
(window as any).parseDOM = parseDOM;
(window as any).parseAnchorXP = parseAnchorXP;
(window as any).evaluateXPathExpression = evaluateXPathExpression;
