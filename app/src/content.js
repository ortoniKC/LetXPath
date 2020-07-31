let targetElemt = null;

// used to send/recive message with in extension
let receiver = (message, sender, sendResponse) => {
    if (message.type === "getXPath") {
        console.log(message);
        parseDOM(targetElemt);
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
        // console.log(event.target);
        targetElemt = event.target;
    }, false);
}

// find different patterns of XPath 
function parseDOM(targetElemt) {
    let tag = targetElemt.tagName.toLowerCase();
    let attributes = targetElemt.attributes;
    addAllXPathAttributes(attributes, tag, targetElemt);
    getTextXPath(targetElemt);
    // console.log(XPATHDATA);
    let message = {
        request: "sendtodevtools",
        xpath: XPATHDATA
    }
    chrome.storage.local.set({ len: XPATHDATA.length })
    chrome.runtime.sendMessage(message)
    XPATHDATA = [];
}

// get all attribtes based XPath
function addAllXPathAttributes(attributes, tagName, targetElemt) {
    Array.prototype.slice.call(attributes).forEach(element => {
        switch (element.name) {
            case "id":
                getUniqueId(targetElemt, tagName);
                break;
            case "name":
                getUniqueName(targetElemt, tagName);
                break;
            case "className":
                getUniqueClassName(targetElemt, tagName);
                break;
            default:
                if (element.value != '')
                    attributesBasedXPath(element, tagName);
                break;
        }
    });
}

// find the no.of elements matches with XPath
function getCountOfXPath(xpath) {
    let count = document.evaluate(
        `count(${xpath})`, document, null, XPathResult.ANY_TYPE, null
    ).numberValue;
    return count;
}

// store all the XPath values in an array
let XPATHDATA = [];

// id
function getUniqueId(elemet, tag) {
    let idValue = elemet.id;
    let idPattern = `//*[@id='${idValue}']`;
    let count = getCountOfXPath(idPattern);
    if (count == 1) {
        XPATHDATA.push(["unique id:", idValue]);
    }
}

// name
function getUniqueName(element, tag) {
    let value = element.name;
    let nameValue = `//*[@name='${value}']`;
    let count = getCountOfXPath(nameValue);
    if (count == 1) {
        XPATHDATA.push(["unique name:", value]);
    }
}

// className
function getUniqueClassName(element, tag) {
    let value = element.className;
    let classvalue = `//*[@class='${value}']`;
    let count = getCountOfXPath(classvalue);
    if (count == 1) {
        XPATHDATA.push(["className:", value]);
    }
}


// tag
function getUniqueTagName(element, tag) {
    let count = document.getElementsByTagName(tag).length;
    if (count == 1) {
        XPATHDATA.push(["unique Tag name:", tag]);
    }
}

// link
function getUniqueLinkText(ele, tag) {
}


// Attributes based XPath 
function attributesBasedXPath(element, tagName) {
    let temp = `//${tagName}[@${element.name}='${element.value}']`;
    let count = getCountOfXPath(temp);
    if (count == 1) {
        XPATHDATA.push(["attributes based Xpath:", temp]);
    }
}