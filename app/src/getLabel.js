/**
 * @author Koushik Chatterjee <koushik350@gmail.com>
 * @param {*} element 
 * @param {*} tagName 
 * @description The following methods are purely written on Guessing algorithm :P :P trust me it will work
 */
function findLabel(element, tagName) {
    let label, span = undefined;
    let ele = `//*[@letxxpath='letX']`;
    try {
        label = getLabelText(ele, tagName)
    } catch (error) { }
    try {
        span = getSpanText(ele, tagName)
    } catch (error) { }
    try {
        if (label === undefined && span === undefined) {
            let xp = getParentText(element, tagName)
            let temp = xp;
            xp = evaluateXPathExpression(xp);
            if (xp != null && xp != undefined && ((xp.singleNodeValue.attributes.letxxpath) != undefined)) {
                XPATHDATA.push([6, 'Text based following XPath', temp]);
            } else {
                temp = addIndexToXpath(temp)
                if (temp != null) {
                    XPATHDATA.push([6, 'Text based following XPath', temp]);
                }
            }
        }
    } catch (error) { }
}
function getParentText(element, tagName) {
    let ep = element.parentNode.parentNode;
    let child = ep.children;
    let tagN = null;
    let setBool = false;
    for (let i = 0; i < child.length; i++) {
        let innerChildLen = child[i].children.length;
        for (let i = 0; i < innerChildLen; i++) {
            if (child[i].children[i].textContent.length > 1) {
                ep = child[i].children[i];
                tagN = ep.tagName;
                setBool = true;
                break;
            }
        }
        if (setBool)
            break;
    }
    let text = getTextBasedXPath(ep, tagN.toLowerCase())
    let temp = `${text}/following::${tagName}`;
    let count = getNumberOfXPath(temp);
    if (count == 1) {
        let xp = `${text}/following::${tagName}[1]`;
        return xp;
    } else if (count > 1) {
        let xp = `${text}/following::${tagName}`;
        xp = addIndexToXpath(xp)
        return xp;
    } else
        return null;
}
function getLabelText(ele, tagName) {
    let labelNode = `${ele}/preceding::label[1]`;
    let checkLabelType = evaluateXPathExpression(labelNode);
    try {
        if (typeof (checkLabelType.singleNodeValue.textContent) === 'string') {
            return getLabel(labelNode, tagName);
        } else {
            throw 'no label preceding';
        }
    } catch (error) { }
}
function getSpanText(ele, tagName) {
    let spanNode = `${ele}/preceding::span[1]`;
    let checkSpanType = evaluateXPathExpression(spanNode);
    try {
        if (typeof (checkSpanType.singleNodeValue.textContent) === 'string') {
            return getLabel(spanNode, tagName);
        } else {
            throw 'no span text'
        }
    } catch (error) { }
}
function getLabel(node, tagName) {
    let c = getNumberOfXPath(node);
    if (c > 0) {
        let label = evaluateXPathExpression(node);
        let newEle = label.singleNodeValue;
        let labelTag = newEle.tagName.toLowerCase();
        let labelText = getTextBasedXPath(newEle, labelTag);
        let newLabelXpath = labelText + '/' + 'following::' + tagName;
        if (getNumberOfXPath(newLabelXpath) == 1) {
            let newLabel = evaluateXPathExpression(newLabelXpath);
            if (newLabel != null && newLabel != undefined && ((newLabel.singleNodeValue.attributes.letxxpath) != undefined)) {
                XPATHDATA.push([6, 'Text based following XPath', newLabelXpath]);
                return newLabelXpath;
            }
        } else {
            let labelTextWithIndex = addIndexToXpath(newLabelXpath)
            let newLabel = evaluateXPathExpression(labelTextWithIndex);
            if (!((newLabel === null) || (newLabel === undefined) || ((newLabel.singleNodeValue.attributes.letxxpath) === undefined))) {
                XPATHDATA.push([6, 'Text based following XPath', labelTextWithIndex]);
                return labelTextWithIndex;
            }
        }
    }
}
