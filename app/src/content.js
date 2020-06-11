// alert("Welcome")
let targetElemt = null;
let receiver = (message, sender, sendResponse) => {
    if (message.type === "getXPath") {
        console.log(message);
        parseDOM();
    }
};
chrome.runtime.onMessage.addListener(receiver);

window.addEventListener('DOMContentLoaded', (event) => {
    init();
});

function init() {
    document.addEventListener("mousedown", (event) => {
        // console.log(event.target);
        targetElemt = event.target;
    }, false);
}
function parseDOM() {
    let tag = targetElemt.tagName.toLowerCase();
    let attributes = targetElemt.attributes;
    addAllXPathAttributes(attributes, tag, targetElemt);
    console.log(XPATHDATA);
    XPATHDATA = [];
}


function addAllXPathAttributes(attributes, tagName, targetElemt) {
    Array.prototype.slice.call(attributes).forEach(element => {
        switch (element.name) {
            case "id":
                getUniqueId(targetElemt, tagName);
                break;
            case "name":
                getUniqueName(targetElemt, tagName);
                break; case "className":
                getUniqueClassName(targetElemt, tagName);
                break;
            default:
                if (element.value != '')
                    attributesBasedXPath(element, tagName);
                break;
        }
    });
}

function getCountOfXPath(xpath) {
    let count = document.evaluate(
        `count(${xpath})`, document, null, XPathResult.ANY_TYPE, null
    ).numberValue;
    // console.log('The count of the XPath is : ' + count);
    return count;
}
// id
let XPATHDATA = [];

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