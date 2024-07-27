/**
 * @author Koushik Chatterjee <koushik350@gmail.com>
 * @description heart - core engine of extension
 */

let targetElemt = null;
let enablegcx = false;
let isRecordEnabled = false;
/**
 * @param {*} data
 * @description send the data to the panel.js
 */
function sendToDev(data) {
  sendMessage({ request: "fromUtilsSelector", data: data });
}
// used to send/receive message with in extension
let receiver = (message, sender, sendResponse) => {
  switch (message.request) {
    case "dotheconversion":
      const input = message.data;
      const output = xPathToCss(input);
      sendMessage({
        request: "conversion",
        output: output,
      });
      // sendResponse(true);
      break;
    case "parseAxes":
      try {
        let value = message.data;
        let axesSnapshot = elementOwnerDocument.evaluate(
          value,
          elementOwnerDocument,
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
        // sendResponse(true);
        // return true;
        break;
      } catch (error) {}
    // build possible xpath
    case "context_menu_click":
      parseAnchorXP(targetElemt);
      atrributesArray = [];
      webTableDetails = null;
      // sendResponse(true);
      // return true;
      break;
    case "userSearchXP":
      let value = message.data;
      // elementOwnerDocument = document;
      // if (elementOwnerDocument.URL != 'about:blank') {
      // if (window.document == elementOwnerDocument) {
      let customSnapshot;
      let customCount;
      try {
        customSnapshot = elementOwnerDocument.evaluate(
          value,
          elementOwnerDocument,
          null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
          null
        );
        customCount = customSnapshot.snapshotLength;
      } catch (error) {
        customCount = 0;
      }
      let isXPathCorrect = customCount > 0 ? "XPath found" : "Wrong XPath";
      if (customCount > 0) {
        addHighlighter(customSnapshot);
      }
      sendMessage({
        request: "customSearchResult",
        data: {
          xpath: isXPathCorrect,
          count: customCount,
        },
      });
      // sendResponse(true);
      // return true;
      break;
    case "cleanhighlight":
      let removeCSS = "//*[@letcss='1']";
      // elementOwnerDocument = document;
      // if (window.document == elementOwnerDocument) {
      let cleanSnapshot;
      let cleanCount;
      try {
        cleanSnapshot = elementOwnerDocument.evaluate(
          removeCSS,
          elementOwnerDocument,
          null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
          null
        );
        cleanCount = cleanSnapshot.snapshotLength;
      } catch (error) {
        cleanCount = 0;
      }
      if (cleanCount > 0) {
        clearHighlighter(cleanSnapshot);
      }
      // sendResponse(true);
      // return true;
      break;
    default:
      sendResponse(true);
  }
};
chrome.runtime.onMessage.addListener(receiver);
// capture mouse events once the DOM is loaded
window.addEventListener("DOMContentLoaded", (event) => {
  // get the target element once click on the context menu
  document.addEventListener(
    "mousedown",
    (event) => {
      targetElemt = event.target;
    },
    false
  );
});

// get index value from user!
// get index value from user!
// gcx  - get clicked xpath
let maxIndex = 3;
let tempMaxIndex = 3;
let maxId = 3;
let setPreOrFol = null;
let variableName = null;
let methodName = null;
let hasFrame = null;
let variablename = null;
let type = null;
let tag = null;
let tagArrHolder = [];
let dupArray = [];
let XPATHDATA;
let CSSPATHDATA = null;
let utilsSelectorXPathData = [];
let letXInc = null;
let letXP = "[@letxxpath='letX']";
let _doc = "";
let atrributesArray = [];
var anchroXPathData;
let webTableDetails = null;
// Angular
let angularArray = null;
// find different patterns of XPath
let isframeDoc = false;
let ownerDoc;
let elementOwnerDocument;
let frameXPATH = null;
function buildSelectedFileds(targetElement) {
  elementOwnerDocument = targetElement.ownerDocument;
  if (targetElement != null) {
    try {
      maxIndex = tempMaxIndex != null ? tempMaxIndex : 5;
      if (targetElement.type != "hidden") buildXpath(targetElement, 0, true);
    } catch (error) {
      if (error.message === "shadow dom not yet supported")
        XPATHDATA = undefined;
    }
  }
}

function parseDOM(targetElement) {
  try {
    if (targetElement != null) {
      elementOwnerDocument = targetElement.ownerDocument;
      try {
        maxIndex = tempMaxIndex != null ? tempMaxIndex : 5;
        buildXpath(targetElement, 0, false);
      } catch (error) {
        if (error.message === "shadow dom not yet supported")
          XPATHDATA = undefined;
      }
      let domInfo = {
        request: "send_to_dev",
        angXP: angularArray,
        cssPath: CSSPATHDATA,
        webtabledetails: webTableDetails,
        xpathid: XPATHDATA.sort(),
        tag: tag,
        type: type,
        hasFrame: frameXPATH,
        variablename: variablename,
        methodname: methodName,
        anchor: false,
        atrributesArray: atrributesArray,
      };
      //
      sendMessage(domInfo);

      atrributesArray = [];
      // getAnchorXPath = [];
      // anchroXPathData = [];
      webTableDetails = null;
    }
  } catch (error) {}
}
async function sendMessage(msg) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(msg, (response) => {
      resolve(response);
    });
  });
}
function parseAnchorXP(targetElement) {
  if (targetElement != null) {
    try {
      maxIndex = 20;
      buildXpath(targetElemt, 1, false);
      aq;
    } catch (error) {}
  }
}

function buildXpath(element, boolAnchor, utils) {
  if (element.shadowRoot != null) {
    sendMessage({
      shadowRoot: true,
      anchor: undefined,
    });

    throw new TypeError("shadow dom not yet supported");
  }
  let removeletX = `//*${letXP}`;
  try {
    let re = evaluateXPathExpression(removeletX);
    if (re.singleNodeValue != null) {
      re.singleNodeValue.removeAttribute("letxxpath");
      // removeAxes.removeAttribute('letaxes');
    }
    // let removeAxes = `//*[@letaxes='letX']`
    // let rea = evaluateXPathExpression(removeAxes)
    // if (rea.singleNodeValue != null) {
    //     rea.singleNodeValue.removeAttribute('letaxes');
    // }
  } catch (error) {}

  // add a attribute to locate the element
  element.setAttribute("letxxpath", "letX");
  // generate method and varible name
  try {
    let name = getMethodOrVarText(element);
    getVariableAndMethodName(name);
    methodName =
      methodName.length >= 2 && methodName.length < 25
        ? methodName
        : methodName.slice(0, 12);
    variableName =
      variableName.length >= 2 && variableName.length < 25
        ? variableName
        : variableName.slice(0, 12);
    variablename =
      variableName != null && variableName.length > 1 ? variableName : "ele";
    methodName =
      methodName != null && methodName.length > 1 ? methodName : "ele";
    // console.log(variableName, methodName);
  } catch (error) {
    variablename = null;
  }
  // create an array to put available xpath - generate different type and add
  XPATHDATA = [];
  CSSPATHDATA = [];
  // Handle SVG
  if (
    element.farthestViewportElement != undefined ||
    element.tagName === "SVG" ||
    element.tagName === "svg"
  ) {
    try {
      element = element.farthestViewportElement.parentNode;
    } catch (error) {
      element = element.parentNode;
    }
  }
  // To get tag name
  let tagName = element.tagName.toLowerCase();
  tag = tagName;
  if (element.hasAttribute("type")) {
    type = element.type;
  }

  if (elementOwnerDocument.getElementsByTagName(tag).length == 1) {
    XPATHDATA.push([10, "Unique TagName", tag]);
  }

  // Find no.of frames available, then generate XPath or index for that
  try {
    // to find whether element is in frame
    let fr = document.querySelectorAll("iframe");
    if (fr.length > 0) {
      frameXPATH = frameXPath(fr[0]);
      // console.log(frameXPATH);
    }
  } catch (error) {}

  // To get all attribuites
  let attributeElement = element.attributes;

  // let childNextSibling = element.nextSibling;
  let preiousSiblingElement = element.previousElementSibling;

  // To iterate all attributes xpath
  try {
    addAllXpathAttributesBbased(attributeElement, tagName, element);
  } catch (e) {}

  // Following-sibling push to array
  try {
    xpathFollowingSibling(preiousSiblingElement, tagName);
  } catch (e) {}

  // Text Based xpath
  try {
    if (element.innerText != "") xpathText(element, tagName);
  } catch (e) {}

  // to find label - following xpath only if tag name name is 'input or textarea'
  try {
    if (tagName === "input" || tagName === "textarea") {
      findLabel(element, tagName);
    }
  } catch (e) {}

  // get Parent node
  try {
    getParent(element, tagName);
  } catch (error) {}

  try {
    if (element.closest("table")) {
      tag = "select";
      handleTable(element);
    }
  } catch (error) {}
  // Based on parent XPath
  try {
    if (XPATHDATA.length < 3)
      XPATHDATA.push([90, "Closest ID XPath", getXPathWithPosition(element)]);
  } catch (error) {}

  try {
    let css = getLongCssPath(element);
    // console.log(css);
    let csslen = css.split(">");
    if (csslen.length < 5) CSSPATHDATA.push([11, "Closest ID CSS", css]);
    // if (elementOwnerDocument.querySelectorAll(css).length == 1)
    // console.log(CSSPATHDATA);
  } catch (error) {}

  // try {
  //     if (utils) {
  //         utilsSelectorXPathData.push([methodName, variableName, XPATHDATA.sort()]);
  //     }
  // } catch (error) { alert(error) }

  // AXES BASED XPATH
  switch (boolAnchor) {
    case 0:
      try {
        removeletxxpath(element);
      } catch (e) {}
      break;
    case 1:
      tagArrHolder.push(tagName);
      getAnchorXPath(XPATHDATA, tagArrHolder, dupArray, element);
      break;
  }
}

// Add xpath following-sibling
function xpathFollowingSibling(preiousSiblingElement, tagName) {
  if (preiousSiblingElement != null || preiousSiblingElement != undefined) {
    addPreviousSibling(preiousSiblingElement, tagName);
  }
}

// Get Text based XPath
function xpathText(element, tagName) {
  let getTextXPathEle = getTextBasedXPath(element, tagName);
  if (!(getTextXPathEle === null || getTextXPathEle === undefined)) {
    XPATHDATA.push([6, "Text based XPath", getTextXPathEle]);
  }
}

// To get Name based xpath - //tagName[@name='nameValue'] - index upto 3
function getNameXPath(element, tagName) {
  let nameBasedXpath = null;
  let clickedItemName = element.attributes.name.value;
  let matches = clickedItemName.match(/\d{3,}/g);
  if (
    !(
      clickedItemName === "" ||
      clickedItemName === undefined ||
      matches != null
    )
  ) {
    let tempName = "[@name='" + clickedItemName + "']";
    let tem = `//*${tempName}`;
    let count = getNumberOfXPath(tem);
    if (count == 1) {
      XPATHDATA.push([102, "Unique Name", clickedItemName]);
      CSSPATHDATA.push([
        3,
        "Unique Name",
        `${tagName}[name='${clickedItemName}']`,
      ]);
    } else if (count > 1) {
      tem = `//${tagName}${tempName}`;
      nameBasedXpath = addIndexToXpath(tem);
    }
  }
  return nameBasedXpath;
}
// To get class based xpath - //tagName[@class='classValue'] - differs based on no.of classes
function getClassXPath(element, tagName) {
  getClassCSS(element);
  let classBasedXpath = null;
  let clickedItemClass = element.className;
  let splitClass = clickedItemClass.trim().split(" ");
  if (splitClass.length > 2) {
    let cl = `${splitClass[0]} ${splitClass[1]}`;
    let temp = `//${tagName}[contains(@class,'${cl}')]`;
    let count = getNumberOfXPath(temp);
    if (count == 0) {
      return null;
    }
    if (count == 1) {
      CSSPATHDATA.push([
        3,
        "Unique class css",
        `${tagName}.${splitClass[0]}.${splitClass[1]}`,
      ]);
    } else if (count > 1) {
      temp = addIndexToXpath(temp);
    }
    return temp;
    //  return null;
  }
  if (!(clickedItemClass === "" || clickedItemClass === undefined)) {
    let tempClass = `//*[@class='${clickedItemClass}']`;
    let count = getNumberOfXPath(tempClass);
    let spl = clickedItemClass.trim().split(" ");
    if (count == 1 && spl.length == 1) {
      XPATHDATA.push([3, "Unique Class Atrribute", clickedItemClass]);
      CSSPATHDATA.push([3, "Unique Class Atrribute", "." + clickedItemClass]);
      return null;
    } else {
      classBasedXpath = `//${tagName}[@class='${clickedItemClass}']`;
      let count = getNumberOfXPath(classBasedXpath);
      if (count == 0) {
        return null;
      } else if (count == 1) {
        return classBasedXpath;
      } else {
        classBasedXpath = addIndexToXpath(classBasedXpath);
      }
    }
  }
  return classBasedXpath;
}

function getIDXPath(element, tagName) {
  let idBasedXpath = null;
  let clicketItemId = element.id;
  let re = new RegExp("\\d{" + maxId + ",}", "g");
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
      if (count > 1) {
        idBasedXpath = addIndexToXpath(idBasedXpath);
        if (idBasedXpath != null) {
          XPATHDATA.push([1, "XPath using Id", idBasedXpath]);
        }
        return null;
      }
    }
  }
  return idBasedXpath;
}
// Add all atrributes xpath except filter
function addAllXpathAttributesBbased(attribute, tagName, element) {
  Array.prototype.slice.call(attribute).forEach(function (item) {
    // Filter attributes that should not be processed
    if (item.value === "letX" || filterAttributesFromElement(item)) {
      return;
    }

    // Pushing xpath to arrays
    switch (item.name) {
      case "id":
        let id = getIDXPath(element, tagName);
        if (id != null) {
          XPATHDATA.push([1, "Unique ID", id]);
          CSSPATHDATA.push([1, "Unique ID", `#${id}`]);
        }
        break;
      case "class":
        let className = getClassXPath(element, tagName);
        if (className != null) {
          XPATHDATA.push([3, "Class based XPath", className]);
        }
        break;
      case "name":
        let name = getNameXPath(element, tagName);
        if (name != null) {
          XPATHDATA.push([2, "Name based XPath", name]);
        }
        break;
      default:
        let temp = item.value;
        if (temp !== "") {
          let allXpathAttr = `//${tagName}[@${item.name}='${temp}']`;
          let xpathResult = getNumberOfXPath(allXpathAttr);
          if (xpathResult == 1) {
            XPATHDATA.push([4, `${item.name}`, allXpathAttr]);
            CSSPATHDATA.push([
              4,
              `${item.name}`,
              `${tagName}[${item.name}='${temp}']`,
            ]);
          } else {
            let indexedXPath = addIndexToXpath(allXpathAttr);
            if (indexedXPath !== undefined) {
              XPATHDATA.push([4, `${item.name}`, indexedXPath]);
            }
          }
        }
        break;
    }
    // Always push attribute name to attributesArray
    atrributesArray.push(item.name);
  });
}
