/**
 * @author Kousshik Chatterjee <koushik@letcode.in>
 * @description heart - core engine of extension
 */

// get the target element with context click
"use strict";
let targetElemt = null;

// Extension namespaces
// var letXPath = letXPath || {};
var enablegcx = false;
var isRecordEnabled = false;

// used to send/receive message with in extension
let receiver = (message, sender, sendResponse) => {
    switch (message.request) {
        case 'OFF':
            enablegcx = false;
            document.removeEventListener("mouseover", mouseOver, true);
            document.removeEventListener("mouseout", mouseOut, true);
            chrome.storage.local.set({
                'gcx': 'false', 'isRecord': 'false'
            });
            isRecordEnabled = false;
            stopRecord();
            let domInfo = {
                xpathid: undefined,
            }
            chrome.runtime.sendMessage(domInfo);
            break;
        case 'validateAnchorDetails':
            if (_doc == document) {
                let value = request.data;
                let snapShot = document.evaluate(value, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                let count = snapShot.snapshotLength;
                if (count == 0 || count == undefined) {
                    chrome.storage.local.set({
                        "anchorEvalXPath": 'Sorry! Please try with different XPath combination'
                    });
                } else if (count == 1) {
                    chrome.storage.local.set({
                        "anchorEvalXPath": value
                    });
                    addRemoveOutlineCustomeXpath(evaluateXPathExpression(value).singleNodeValue);
                } else if (count > 1) {
                    let ex = addIndexToXpath(value);
                    if (ex != null) {
                        chrome.storage.local.set({
                            "anchorEvalXPath": ex
                        });
                        addRemoveOutlineCustomeXpath(evaluateXPathExpression(ex).singleNodeValue);
                    } else
                        chrome.storage.local.set({
                            "anchorEvalXPath": 'Sorry! Please try with different XPath combination'
                        });
                }
            }
            break;
        case "AnchorXP":
            parseAnchorXP();
            atrributesArray = [];
            webTableDetails = null;
            return true;
        // build possible xpath
        case "context_menu_click":
            parseDOM(targetElemt);
            try {
                if (XPATHDATA != undefined) {
                    let domInfo = {
                        angXP: angularArray,
                        cssPath: cssPathArray,
                        webtabledetails: webTableDetails,
                        xpathid: XPATHDATA.sort(),
                        tag: tag,
                        type: type,
                        hasFrame: hasFrame,
                        variableFromBg: variableFromBg,
                        anchor: false,
                        atrributesArray: atrributesArray
                    };
                    if (_doc == document) {
                        chrome.runtime.sendMessage(domInfo);
                    }
                    console.log(domInfo);
                    anchorXPath = [];
                    atrributesArray = [];
                    webTableDetails = null;
                }
            } catch (error) { }
            return true;
        case 'startRecord':
            try {
                let domInfo = {
                    xpathid: undefined,
                }
                chrome.runtime.sendMessage(domInfo);
                isRecordEnabled = true;
                recordArray = [];
                recordArrayPOM = []
                startRecording();
            } catch (error) { }
            break;
        case 'stopRecord':
            try {
                isRecordEnabled = false;
                stopRecord();
            } catch (error) { }
            break;
        default:
            return true;
    }
};
chrome.runtime.onMessage.addListener(receiver);

// capture mouse events once the DOM is loaded
window.addEventListener('DOMContentLoaded', (event) => {
    init();
});

// get the target element once click on the context menu
function init() {
    document.addEventListener("mousedown", (event) => {
        targetElemt = event.target;
    }, false);
}
// get index value from user!
// get index value from user!
// gcx  - get clicked xpath
let maxIndex = 5;
let tempMaxIndex = 5;
let maxId = 3;
chrome.storage.local.get(['index', 'idNum'], function (data) {
    if (data.index != undefined) {
        tempMaxIndex = data.index;
    }
    if (data.idNum != undefined) {
        maxId = data.idNum;
    }
});
let setPreOrFol = null;
let variableName = null;
let methodName = null;
let hasFrame = null;
let variableFromBg = null;
let type = null;
let tag = null;
let tagArrHolder = [];
let dupArray = [];
let XPATHDATA;
let cssPathArray = null;
let mulXpathArray = [];
let letXInc = null
let letXP = "[@letXxpath='letX']";
let _doc = '';
let atrributesArray = [];
let webTableDetails = null;
// Angular
let angularArray = null;
// find different patterns of XPath 
function parseDOM(targetElemt) {
    if (targetElemt != null) {
        try {
            clearHighlights()
        } catch (error) { }
        try {
            maxIndex = tempMaxIndex != null ? tempMaxIndex : 5;
            buildXpath(targetElemt, 0);
        } catch (error) {
            if (error.message === 'shadow dom not yet supported')
                XPATHDATA = undefined
        }
        let domInfo = {
            angXP: angularArray,
            cssPath: cssPathArray,
            webtabledetails: webTableDetails,
            xpathid: XPATHDATA.sort(),
            tag: tag,
            type: type,
            hasFrame: hasFrame,
            variableFromBg: variableFromBg,
            anchor: false,
            atrributesArray: atrributesArray
        };
        if (_doc == document) {
            console.log(domInfo.xpathid[0][2]);
            // chrome.runtime.sendMessage(domInfo);
        }
        highlightSelectedDOM()
        setTimeout(() => {
            clearHighlights()
        }, 100);
    }
}
function parseAnchorXP() {
    if (targetElemt != null) {
        try {
            clearHighlights1()
            // ortoni.clearHighlights2()
        } catch (error) { }
        try {
            maxIndex = 20;
            buildXpath(targetElemt, 1);
        } catch (error) { }
        // ortoni.highlightSelectedDOM()
        setTimeout(() => {
            clearHighlights2()
        }, 100);
    }
}
function buildXpath(element, boolAnchor) {
    if (element.shadowRoot != null) {
        setStorage('-1');
        chrome.runtime.sendMessage({
            shadowRoot: true,
            anchor: undefined
        });
        throw new TypeError('shadow dom not yet supported')
    }
    let removeletX = `//*${letXP}`;
    let re = evaluateXPathExpression(removeletX)
    if (re.singleNodeValue != null) {
        re.singleNodeValue.removeAttribute('letXxpath');
    }
    // To avoid  multiple message calling
    _doc = document;
    // add a attribute to locate the element
    element.setAttribute('letXxpath', 'letX')
    // generate method and varible name
    try {
        let name = getMethodOrVarText(element);
        getVariableAndMethodName(name);
        methodName = methodName.length >= 2 && methodName.length < 25 ? methodName : methodName.slice(0, 10);
        chrome.storage.local.set({
            'methodName': methodName
        });
        variableName = variableName.length >= 2 && variableName.length < 25 ? variableName : variableName.slice(0, 10);
        chrome.storage.local.set({
            'variableName': variableName
        });
        variableFromBg = variableName;
    } catch (error) {
        variableFromBg = null;
        chrome.storage.local.set({
            'methodName': null
        });
        chrome.storage.local.set({
            'variableName': null
        });
    }
    // create an array to put available xpath - generate different type and add
    XPATHDATA = [];

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

    if (document.getElementsByTagName(tag).length == 1) {
        XPATHDATA.push([10, 'Tag Name is unique', tag])
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
    } catch (e) {
        console.log(e);
    }

    // Following-sibling push to array
    try {
        xpathFollowingSibling(preiousSiblingElement, tagName);
    } catch (e) {
        console.log(e);
    }

    // Text Based xpath
    try {
        if (element.innerText != '')
            xpathText(element, tagName);
    } catch (e) {
        console.log(e);
    }

    // to find label - following xpath only if tag name name is 'input or textarea'
    try {
        if ((tagName === 'input' || tagName === 'textarea')) {
            findLabel(element, tagName)
        }
    } catch (e) {
        console.log(e);
    }

    // get Parent node
    try {
        getParent(element, tagName)
    } catch (error) { }

    try {
        if (element.closest('table')) {
            handleTable(element);
        }
    } catch (error) { }
    // if no xpath found
    try {
        if (XPATHDATA.length < 3)
            XPATHDATA.push([90, 'Long XPATH', getXPathWithPosition(element)])
    } catch (error) { }
    try {
        cssPathArray = [];
        let css = getLongCssPath(element)
        if (document.querySelectorAll(css).length == 1)
            cssPathArray.push([11, 'CSS', css]);
    } catch (error) { }

    // ANCHOR BASED XPATH
    switch (boolAnchor) {
        case 0:
            setStorage(XPATHDATA.length + cssPathArray.length)
            try {
                removeLetXXpath(element);
            } catch (e) {
                console.log(e);
            }
            // TODO check condition
            if (isRecordEnabled) {
                XPATHDATA.sort();
                searchXPathArray.push([variableName, methodName, XPATHDATA[0][1], XPATHDATA[0][2]]);
            }
            break;
        case 1:
            tagArrHolder.push(tagName);
            anchorXPath(XPATHDATA, tagArrHolder, dupArray, element);
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
            XPATHDATA.push([102, 'Unique Name Attribute', clickedItemName])
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
        atrributesArray.push(item.name);
        if (!(filterAttributesFromElement(item))) {
            // Pushing xpath to arrays
            switch (item.name) {
                case 'id':
                    let id = getIDXPath(element, tagName)
                    if (id != null) {
                        XPATHDATA.push([1, 'Id is unique:', id])
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
