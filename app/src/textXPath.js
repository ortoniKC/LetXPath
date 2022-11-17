/**
 * @author Koushik Chatterjee <koushik350@gmail.com>
 * @param {*} element 
 * @param {*} tagName 
 * @description Core of text based XPath - supports almost text based xpath pattern
 */

// To get text(contains() & text() & starts-with & dot contains(for <br>)) based xpath
function getTextBasedXPath(element, tagName) {
    let textBasedXpath = null;
    let checkReturn;
    let link;
    let hasSpace = false;
    let gotPartial = false;
    if (element.textContent.length > 0) {
        // link text
        if (tagName === 'a') {
            link = element.textContent;
            if (element.childElementCount > 0) {

                // changes to //a[contains(.,'text')]
                if (link) {
                    let t = `//a[.='${link.trim()}']`;
                    let c = getNumberOfXPath(t);
                    if (c == 1) {
                        XPATHDATA.push([0, 'Link Text', link.trim()]);
                    } else {
                        let t = `//a[contains(.,'${link.trim()}')]`;
                        let c = getNumberOfXPath(t);
                        if (c == 1) {
                            XPATHDATA.push([0, 'Link XPath', t]);
                        }
                    }
                }

                link = element.children[0].innerText;
                if (link != undefined) {
                    let partialLink = `//a[contains(text(),'${link.trim()}')]`;
                    if (getNumberOfXPath(partialLink) == 1) {
                        XPATHDATA.push([0, 'Partial Link Text', link.trim()])
                        gotPartial = true;
                    } else {
                        link = element.textContent;
                    }
                } else {
                    link = element.textContent;
                }
            }
            let temp = `//a[contains(text(),'${link.trim()}')]`
            checkReturn = link.match(/[\r\n\x0B\x0C\u0085\u2028\u2029]+/g);
            if (checkReturn && gotPartial == false) {
                link = link.replace(/[\r\n\x0B\x0C\u0085\u2028\u2029]+/g, " ")
                hasSpace = link.match(/\s/g);
                if (hasSpace) {
                    link = link.replace(/\s+/g, " ");
                    XPATHDATA.push([0, 'Link Text', link.trim()])
                }
            } else if (gotPartial == false && getNumberOfXPath(temp) == 1) {
                XPATHDATA.push([0, 'Link Text', link.trim()])
            } else if (gotPartial == false && getNumberOfXPath(`//a[text()='${link.trim()}']`) == 1) {
                XPATHDATA.push([0, 'Link Text', link.trim()])
            }
        }
        if (hasSpace) {
            let normalizeSpace = `//${tagName}[text()[normalize-space()='${link.trim()}']]`;
            let validNSXP = getNumberOfXPath(normalizeSpace)
            if (validNSXP == 1) {
                XPATHDATA.push([6, 'Normalize Space', normalizeSpace])
            } else if (validNSXP > 1) {
                let xp = addIndexToXpath(normalizeSpace)
                if (xp != null && xp != undefined)
                    XPATHDATA.push([6, 'Normalize Space', xp])
            }
        }

        // if tagName is select then text should not appears
        if (tagName != "select" && tagName != 'a') {
            let innerText = element.textContent;
            let hasBr = false;
            if (innerText.match(/[\r\n\x0B\x0C\u0085\u2028\u2029]+/g)) {
                hasSpace = innerText.match(/\s/g);
                if (hasSpace) {
                    innerText = innerText.replace(/\s+/g, " ");
                    if (innerText != " ") {
                        textBasedXpath = `//${tagName}[text()[normalize-space()='${innerText.trim()}']]`;
                    }
                    let validText = getTextCount(textBasedXpath)
                    while (validText) {
                        return textBasedXpath;
                    }
                }
            } else {
                textBasedXpath = `//${tagName}[text()='${innerText}']`;
                let simpleText = getTextCount(textBasedXpath);
                while (simpleText) {
                    return simpleText;
                }
            }
            let findBr = element.childNodes;
            let otherChild = element.childNodes;
            for (let br in findBr) {
                if (findBr[br].nodeName === 'BR') {
                    hasBr = true;
                    break;
                }
            }
            if (hasBr) {
                let containsdotText = '[contains(.,\'' + innerText.trim() + '\')]';
                textBasedXpath = '//' + tagName + containsdotText;
                let containsDotText = getTextCount(textBasedXpath);
                while (containsDotText) {
                    return containsDotText;
                }
            } else if (otherChild.length > 1) {
                let temp = null;
                for (let i = 0; i < otherChild.length; i++) {
                    if ((otherChild[i].textContent.length > 1) && (otherChild[i].textContent.match(/\w/g))) {
                        temp = otherChild[i].textContent;
                        textBasedXpath = '//' + tagName + '[text()=\'' + temp.trim() + '\']';
                        let otherChilText = getTextCount(textBasedXpath);
                        while (otherChilText) {
                            return otherChilText;
                        }
                    }
                }
            }
            if (innerText.length > 0) {
                if (innerText.match(/[\r\n\x0B\x0C\u0085\u2028\u2029]+/g)) {
                    hasSpace = innerText.match(/\s/g);
                    if (hasSpace) {
                        innerText = innerText.replace(/\s+/g, " ");
                        textBasedXpath = `//${tagName}[text()[normalize-space()='${innerText.trim()}']]`;
                    }
                } else if (innerText.match("\\s")) {
                    let containsText = '[contains(text(),\'' + innerText.trim() + '\')]';
                    textBasedXpath = '//' + tagName + containsText;
                    if (getNumberOfXPath(textBasedXpath) == 0) {
                        let t = innerText.split(/\u00a0/g)[1];
                        textBasedXpath = `//${tagName}[text()='${t}']`;
                    } else if (getNumberOfXPath(textBasedXpath) === 0) {
                        let startsWith = '[starts-with(text(),\'' + innerText.split(/\u00a0/g)[0].trim() + '\')]';
                        textBasedXpath = '//' + tagName + startsWith;
                    }
                }
            }
        }
        let count = getNumberOfXPath(textBasedXpath);
        if (count == 0 || count == undefined) {
            textBasedXpath = null;
        } else if (count > 1) {
            textBasedXpath = addIndexToXpath(textBasedXpath);
        }
        /**
         * To handle wild character like single quotes in a text
         */
        if (textBasedXpath != null) {
            if (textBasedXpath.startsWith('//') || textBasedXpath.startsWith('(')) {
                let len = textBasedXpath.split('\'').length;
                if (len > 2) {
                    let firstIndex = textBasedXpath.indexOf('\'');
                    let temp = textBasedXpath.replace(textBasedXpath.charAt(firstIndex), `"`);
                    let lastIndex = temp.lastIndexOf('\'');
                    textBasedXpath = setCharAt(temp, lastIndex, '"');
                }
            }
        }
        return textBasedXpath;
    }
}
function setCharAt(str, index, chr) {
    if (index > str.length - 1)
        return str;
    return str.substr(0, index) + chr + str.substr(index + 1);
}
// Find no.of text based xpath
function getTextCount(text) {
    let c = getNumberOfXPath(text)
    if (c == 0 || c == undefined) {
        return null;
    } else if (c == 1) {
        return text;
    } else {
        return text = addIndexToXpath(text)
    }
}