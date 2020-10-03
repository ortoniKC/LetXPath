/**
 * @author Kousshik Chatterjee <koushik@letcode.in>
 * @description heart - core engine of extension
 */

// get the target element with context click
"use strict";
let targetElemt = null;
let enablegcx = false;
let isRecordEnabled = false;
// let attachedTabs = {};
// let version = "1.3";
/**
 * 
 * @param {*} data 
 * @description send the data to the panel.js
 */
function sendToDev(data) {
    chrome.runtime.sendMessage({ request: "fromUtilsSelector", data: data });
}
// used to send/receive message with in extension
let receiver = (message, sender, sendResponse) => {
    if (message.selector) {
        let selected = message.selector.selectedValue;
        utilsSelectorXPathData = [];
        switch (selected) {
            case "inputs":
                let ip = document.querySelectorAll("input");
                for (let index = 0; index < ip.length; index++) {
                    buildSelectedFileds(ip[index]);
                }
                sendToDev(utilsSelectorXPathData.sort());
                return true;
            case "dropdown":
                let dd = document.querySelectorAll("select");
                for (let index = 0; index < dd.length; index++) {
                    buildSelectedFileds(dd[index]);
                }
                sendToDev(utilsSelectorXPathData.sort());
                return true;
            // case "labels":
            //     let l = document.querySelectorAll("label");
            //     for (let index = 0; index < l.length; index++) {
            //         buildSelectedFileds(l[index]);
            //     }
            //     sendToDev(utilsSelectorXPathData.sort());
            //     return true;
            case "buttons":
                let bt = document.querySelectorAll("button");
                for (let index = 0; index < bt.length; index++) {
                    buildSelectedFileds(bt[index]);
                }
                sendToDev(utilsSelectorXPathData);
                return true;
            default:
                return true;
        }
    }
    switch (message.request) {
        case 'parseAxes':
            try {
                let value = message.data;
                let snapShot = elementOwnerDocument.evaluate(value, elementOwnerDocument, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                let count = snapShot.snapshotLength;
                if (count == 0 || count == undefined) {
                    chrome.runtime.sendMessage({ request: 'axes', data: "Sorry! Please try with different XPath combination" })
                } else if (count == 1) {
                    chrome.runtime.sendMessage({ request: 'axes', data: value });
                } else if (count > 1) {
                    let ex = addIndexToAxesXpath(value);
                    if (ex != null) {
                        chrome.runtime.sendMessage({ request: 'axes', data: ex });
                    } else {
                        chrome.runtime.sendMessage({ request: 'axes', data: "Sorry! Please try with different XPath combination" })
                    }
                }
                return true;
            } catch (error) { }
        // build possible xpath
        case "context_menu_click":
            parseAnchorXP(targetElemt);
            atrributesArray = [];
            webTableDetails = null;
            return true;
        default:
            return true;
    }
};
chrome.runtime.onMessage.addListener(receiver);

// capture mouse events once the DOM is loaded
window.addEventListener('DOMContentLoaded', (event) => {
    // get the target element once click on the context menu
    document.addEventListener("mousedown", (event) => {
        targetElemt = event.target;
    }, false);
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
let letXInc = null
let letXP = "[@letxxpath='letX']";
let _doc = '';
let atrributesArray = [];
var anchroXPathData;
let webTableDetails = null;
// Angular
let angularArray = null;
// find different patterns of XPath 
var isframeDoc = false;
var ownerDoc;
var elementOwnerDocument;
function buildSelectedFileds(targetElement) {
    elementOwnerDocument = targetElement.ownerDocument;
    if (targetElement != null) {
        try {
            maxIndex = tempMaxIndex != null ? tempMaxIndex : 5;
            if (targetElement.type != 'hidden')
                buildXpath(targetElement, 0, true);
        } catch (error) {
            if (error.message === 'shadow dom not yet supported')
                XPATHDATA = undefined
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
                if (error.message === 'shadow dom not yet supported')
                    XPATHDATA = undefined
            }
            let domInfo = {
                request: "send_to_dev",
                angXP: angularArray,
                cssPath: CSSPATHDATA,
                webtabledetails: webTableDetails,
                xpathid: XPATHDATA.sort(),
                tag: tag,
                type: type,
                hasFrame: hasFrame,
                variablename: variablename,
                anchor: false,
                atrributesArray: atrributesArray
            };
            // 
            chrome.runtime.sendMessage(domInfo);
            atrributesArray = [];
            // getAnchorXPath = [];
            // anchroXPathData = [];
            webTableDetails = null;
        }
    } catch (error) { }
}

function parseAnchorXP(targetElement) {
    if (targetElemt != null) {
        try {
            maxIndex = 20;
            buildXpath(targetElemt, 1, false);
        } catch (error) {

        }
    }
}

function buildXpath(element, boolAnchor, utils) {
    if (element.shadowRoot != null) {
        chrome.runtime.sendMessage({
            shadowRoot: true,
            anchor: undefined
        });
        throw new TypeError('shadow dom not yet supported')
    }
    let removeletX = `//*${letXP}`;
    try {
        let re = evaluateXPathExpression(removeletX)
        if (re.singleNodeValue != null) {
            re.singleNodeValue.removeAttribute('letxxpath');
            // removeAxes.removeAttribute('letaxes');
        }
        // let removeAxes = `//*[@letaxes='letX']`
        // let rea = evaluateXPathExpression(removeAxes)
        // if (rea.singleNodeValue != null) {
        //     rea.singleNodeValue.removeAttribute('letaxes');
        // }
    } catch (error) { }

    // add a attribute to locate the element
    element.setAttribute('letxxpath', 'letX')
    // generate method and varible name
    try {
        let name = getMethodOrVarText(element);
        getVariableAndMethodName(name);
        methodName = methodName.length >= 2 && methodName.length < 25 ? methodName : methodName.slice(0, 12);
        variableName = variableName.length >= 2 && variableName.length < 25 ? variableName : variableName.slice(0, 12);
        variablename = variableName;
    } catch (error) {
        variablename = null;
    }
    // create an array to put available xpath - generate different type and add
    XPATHDATA = [];
    CSSPATHDATA = [];
    // Handle SVG
    if ((element.farthestViewportElement != undefined) || (element.tagName === 'SVG') || (element.tagName === 'svg')) {
        try {
            element = element.farthestViewportElement.parentNode;
        } catch (error) {
            element = element.parentNode
        }
    }
    // To get tag name
    let tagName = element.tagName.toLowerCase();
    tag = tagName;
    if (element.hasAttribute('type')) {
        type = element.type
    }

    if (elementOwnerDocument.getElementsByTagName(tag).length == 1) {
        XPATHDATA.push([10, 'Unique TagName', tag])
    }
    // to find whether element is in frame
    hasFrame = frameElement != null ? frameElement : null;

    // TODO:
    // Find no.of frames available, then generate XPath or index for that

    // let frameLength = window.frames.length;

    // To get all attribuites
    let attributeElement = element.attributes;

    // let childNextSibling = element.nextSibling;
    let preiousSiblingElement = element.previousElementSibling;

    // To iterate all attributes xpath
    try {
        addAllXpathAttributesBbased(attributeElement, tagName, element);
    } catch (e) { }

    // Following-sibling push to array
    try {
        xpathFollowingSibling(preiousSiblingElement, tagName);
    } catch (e) { }

    // Text Based xpath
    try {
        if (element.innerText != '')
            xpathText(element, tagName);
    } catch (e) { }

    // to find label - following xpath only if tag name name is 'input or textarea'
    try {
        if ((tagName === 'input' || tagName === 'textarea')) {
            findLabel(element, tagName)
        }
    } catch (e) { }

    // get Parent node
    try {
        getParent(element, tagName)
    } catch (error) { }

    try {
        if (element.closest('table')) {
            tag = 'select';
            handleTable(element);
        }
    } catch (error) { }
    // Based on parent XPath
    try {
        if (XPATHDATA.length < 3)
            XPATHDATA.push([90, 'Closest ID XPath', getXPathWithPosition(element)])
    } catch (error) { }

    try {
        let css = getLongCssPath(element)
        console.log(css);
        let csslen = css.split('>');
        if (csslen.length < 5)
            CSSPATHDATA.push([11, 'ID with tag', css]);
        // if (elementOwnerDocument.querySelectorAll(css).length == 1)
        // console.log(CSSPATHDATA);
    } catch (error) { }

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
            } catch (e) { }
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
    if (!((getTextXPathEle === null) || (getTextXPathEle === undefined))) {
        XPATHDATA.push([6, 'Text based XPath', getTextXPathEle]);
    }
}

// To get Name based xpath - //tagName[@name='nameValue'] - index upto 3
function getNameXPath(element, tagName) {
    let nameBasedXpath = null;
    let clickedItemName = element.attributes.name.value;
    let matches = clickedItemName.match(/\d{3,}/g);
    if (!((clickedItemName === "") || (clickedItemName === undefined) || matches != null)) {
        let tempName = "[@name=\'" + clickedItemName + "\']";
        let tem = `//*${tempName}`;
        let count = getNumberOfXPath(tem)
        if (count == 1) {
            XPATHDATA.push([102, 'Unique Name', clickedItemName])
            CSSPATHDATA.push([3, 'Unique Name', `${tagName}[name='${clickedItemName}']`]);
        } else if (count > 1) {
            tem = `//${tagName}${tempName}`;
            nameBasedXpath = addIndexToXpath(tem)
        }
    }
    return nameBasedXpath;
}
// To get class based xpath - //tagName[@class='classValue'] - differs based on no.of classes
function getClassXPath(element, tagName) {
    let classBasedXpath = null;
    let clickedItemClass = element.className;
    let splitClass = clickedItemClass.trim().split(" ");
    if (splitClass.length > 2) {
        let cl = `${splitClass[0]} ${splitClass[1]}`;
        let temp = `//${tagName}[contains(@class,'${cl}')]`;
        let count = getNumberOfXPath(temp)
        if (count == 0) {
            return null;
        } else if (count > 1) {
            temp = addIndexToXpath(temp)
        }
        return temp;
        //  return null;
    }
    if (!((clickedItemClass === "") || (clickedItemClass === undefined))) {
        let tempClass = `//*[@class='${clickedItemClass}']`;
        let count = getNumberOfXPath(tempClass);
        let spl = clickedItemClass.trim().split(" ")
        if (count == 1 && spl.length == 1) {
            XPATHDATA.push([3, 'Unique Class Atrribute', clickedItemClass]);
            CSSPATHDATA.push([3, 'Unique Class Atrribute', '.' + clickedItemClass]);
            return null;
        } else {
            classBasedXpath = `//${tagName}[@class='${clickedItemClass}']`;
            let count = getNumberOfXPath(classBasedXpath)
            if (count == 0) {
                return null;
            } else if (count == 1) {
                return classBasedXpath;
            } else {
                classBasedXpath = addIndexToXpath(classBasedXpath)
            }
        }
    }
    return classBasedXpath;
}

function getIDXPath(element, tagName) {
    let idBasedXpath = null;
    let clicketItemId = element.id;
    let re = new RegExp('\\d{' + maxId + ',}', '\g');
    let matches = re.test(clicketItemId);
    if ((clicketItemId != null) && (clicketItemId.length > 0) && matches == false) {
        let tempId = "[@id=\'" + clicketItemId + "\']";
        idBasedXpath = '//' + '*' + tempId;
        let count = getNumberOfXPath(idBasedXpath)
        if (count == 0) {
            return null;
        } else if (count == 1) {
            return clicketItemId;
        } else {
            idBasedXpath = '//' + tagName + tempId;
            if (count > 1) {
                idBasedXpath = addIndexToXpath(idBasedXpath)
                if (idBasedXpath != null) {
                    XPATHDATA.push([1, 'XPath using Id', idBasedXpath])
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
        // Filter attribute not to shown in xpath
        if (item.value != 'letX') {
            atrributesArray.push(item.name);
        }
        if (!(filterAttributesFromElement(item))) {
            // Pushing xpath to arrays
            switch (item.name) {
                case 'id':
                    let id = getIDXPath(element, tagName)
                    if (id != null) {
                        XPATHDATA.push([1, 'Unique ID', id])
                        CSSPATHDATA.push([1, 'Unique ID', '#' + id])
                    }
                    ; break;
                case 'class':
                    let className = getClassXPath(element, tagName)
                    if (className != null) {
                        XPATHDATA.push([3, 'Class based XPath', className])
                    }
                    break;
                case 'name':
                    let name = getNameXPath(element, tagName)
                    if (name != null) {
                        XPATHDATA.push([2, 'Name based XPath', name])
                    }
                    break;
                default:
                    let temp = item.value;
                    let allXpathAttr = null;
                    if (temp != '') {
                        allXpathAttr = `//${tagName}[@${item.name}='${temp}']`
                    }
                    if (getNumberOfXPath(allXpathAttr) == 1) {
                        XPATHDATA.push([4, 'Collection based XPath', allXpathAttr]);
                    } else {
                        let temp = addIndexToXpath(allXpathAttr);
                        if (temp != undefined) {
                            XPATHDATA.push([4, 'Collection based XPath', temp]);
                        }
                    }
                    break;
            }
        }
    });

}