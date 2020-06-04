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
    let idValue = targetElemt.id;
    let idPattern = `//*[@id='${idValue}']`;
    let count = getCountOfXPath(idPattern);
    if (count == 1) {
        idPattern = `//${tag}[@id='${idValue}']`;
        console.log(idPattern);
    } else {
        console.log("Duplicate");
    }
    let attributes = targetElemt.attributes;
    addAllXPathAttributes(attributes, tag)
}


function addAllXPathAttributes(attributes, tagName) {
    Array.prototype.slice.call(attributes).forEach(element => {
        // console.log(element);
        let temp = `//${tagName}[@${element.name}='${element.value}']`;
        let count = getCountOfXPath(temp);
        if (count == 1) {
            console.log(temp);
        } else {
            // console.log("Duplicate");
        }

    });
}

function getCountOfXPath(xpath) {
    let count = document.evaluate(
        `count(${xpath})`, document, null, XPathResult.ANY_TYPE, null
    ).numberValue;
    console.log('The count of the XPath is : ' + count);
    return count;
}