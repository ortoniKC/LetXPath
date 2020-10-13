/**
 * @author Kousshik Chatterjee <koushik@letcode.in>
 * @description evaluates the xpath
 */
// Filter values not to push
function filterAttributesFromElement(item) {
    return (item.name === "letaxes") || (item.name === 'letxxpath') || (item.name === "script") ||
        (item.name === 'jsname') || (item.name === 'jsmodel') || (item.name === 'jsdata') ||
        (item.name === 'jscontroller') || (item.name === 'face') || (item.name.includes('pattern')) ||
        (item.name.includes('length')) || (item.name === 'border') || (item.name === 'formnovalidate') ||
        (item.name === 'required-field') || (item.name === 'ng-click') || (item.name === 'tabindex') ||
        (item.name === 'required') || (item.name === 'strtindx') ||
        ((item.name === 'title') && (item.value === '')) || (item.name === 'autofocus') ||
        (item.name === 'tabindex') || ((item.name === 'type') && (item.value === 'text')) ||
        (item.name === 'ac_columns') || // (item.name.startsWith('d')) ||
        (item.name === 'ac_order_by') || (item.name.startsWith('data-ember')) ||
        (item.name.startsWith('aria-') && !(item.name === "aria-label")) ||
        (item.name === 'href') || (item.name === 'aria-autocomplete') ||
        (item.name === 'autocapitalize') || (item.name === 'jsaction') || (item.name === 'autocorrect') ||
        (item.name === 'aria-haspopup') || (item.name === 'style') || (item.name === 'size') ||
        (item.name === 'height') || (item.name === 'width') || (item.name.startsWith('on')) ||
        (item.name === 'autocomplete') || (item.name === 'value' && item.value.length <= 2) ||
        (item.name === 'ng-model-options') ||
        (item.name === 'ng-model-update-on-enter') || (item.name === 'magellan-navigation-filter') ||
        (item.name === 'ng-blur') || (item.name === 'ng-focus') || (item.name === 'ng-trim') ||
        (item.name === 'spellcheck') || (item.name === 'target') || (item.name === 'rel') ||
        (item.name === 'maxlength') || (item.name === 'routerlinkactive');
}
// Add Index to All XPATH
function addIndexToXpath(allXpathAttr) {
    try {
        let index = 0;
        let doc = elementOwnerDocument.evaluate(allXpathAttr, elementOwnerDocument, null, XPathResult.ANY_TYPE, null);
        let next = doc.iterateNext();
        try {
            while (next && index <= maxIndex) {
                index++;
                if ((next.attributes.letxxpath) != undefined) {
                    throw 'break';
                }
                next = doc.iterateNext();
            }
        } catch (error) { }
        let indexedXpath = `(${allXpathAttr})[${index}]`;
        if (index <= maxIndex) {
            let c = getNumberOfXPath(indexedXpath)
            if (c > 0) {
                return indexedXpath;
            }
        } else
            return null;
    } catch (error) { }

}
// Add Index to Axes XPATH
function addIndexToAxesXpath(allXpathAttr) {
    try {
        let index = 0;
        let doc = elementOwnerDocument.evaluate(allXpathAttr, elementOwnerDocument, null, XPathResult.ANY_TYPE, null);
        let next = doc.iterateNext();
        try {
            while (next && index <= maxIndex) {
                index++;
                if ((next.attributes.letaxes) != undefined) {
                    throw 'break';
                }
                next = doc.iterateNext();
            }
        } catch (error) { }
        let indexedXpath = `(${allXpathAttr})[${index}]`;
        if (index <= maxIndex) {
            let c = getNumberOfXPath(indexedXpath)
            if (c > 0) {
                return indexedXpath;
            }
        } else
            return null;
    } catch (error) { }

}
// To get count of each element - returns int
function getNumberOfXPath(element) {
    try {
        return elementOwnerDocument.evaluate('count(' + element + ')', elementOwnerDocument, null, XPathResult.ANY_TYPE, null).numberValue;
    } catch (error) { }
}
// Check if xpath is correct or not - returns boolean
function evaluateXPathExpression(element) {
    try {
        return elementOwnerDocument.evaluate(element, elementOwnerDocument, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    } catch (error) { }
}
// Remove added element
function removeletxxpath(element) {
    element.removeAttribute('letxxpath', 'letX');
}