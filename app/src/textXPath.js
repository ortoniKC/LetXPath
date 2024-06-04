/**
 * @author Koushik Chatterjee <koushik350@gmail.com>
 * @description Generate an XPath expression to locate an element based on its text content.
 * @param {HTMLElement} element - The element for which to generate the XPath.
 * @param {string} tagName - The tag name of the element.
 * @returns {string|null} The generated XPath or null if no valid XPath is found.
 */
function getTextBasedXPath(element, tagName) {
    let textBasedXPath = null;
    const textContent = element.textContent.trim();

    if (textContent.length === 0) return null;

    // Handle link text specifically
    if (tagName === 'a') {
        return handleLinkText(element, textContent);
    }

    // Handle normalize-space if the text contains whitespace
    if (/\s/.test(textContent)) {
        textBasedXPath = `//${tagName}[text()[normalize-space()='${textContent.replace(/\s+/g, " ")}']]`;
        if (validateXPath(textBasedXPath)) return textBasedXPath;
    }

    // Exact text match
    textBasedXPath = `//${tagName}[text()='${textContent}']`;
    if (validateXPath(textBasedXPath)) return textBasedXPath;

    // Contains text
    textBasedXPath = `//${tagName}[contains(text(),'${textContent}')]`;
    if (validateXPath(textBasedXPath)) return textBasedXPath;

    // Handle <br> tags within text
    if (Array.from(element.childNodes).some(node => node.nodeName === 'BR')) {
        textBasedXPath = `//${tagName}[contains(.,'${textContent}')]`;
        if (validateXPath(textBasedXPath)) return textBasedXPath;
    }

    // Fallback for multi-line text or other complex cases
    return handleComplexText(element, tagName, textContent);
}

/**
 * Generate an XPath expression for a link (<a>) element based on its text content.
 * @param {HTMLElement} element - The link element.
 * @param {string} textContent - The text content of the link element.
 * @returns {string|null} The generated XPath or null if no valid XPath is found.
 */
function handleLinkText(element, textContent) {
    let linkText = textContent.replace(/\s+/g, " ");
    let xpath = `//a[normalize-space(text())='${linkText}']`;
    if (validateXPath(xpath)) return xpath;

    xpath = `//a[contains(text(),'${linkText}')]`;
    if (validateXPath(xpath)) return xpath;

    if (element.childElementCount > 0) {
        const partialText = element.children[0].innerText.trim();
        xpath = `//a[contains(text(),'${partialText}')]`;
        if (validateXPath(xpath)) return xpath;
    }

    return null;
}

/**
 * Handle more complex text scenarios, such as multi-line text or elements with child nodes.
 * @param {HTMLElement} element - The element for which to generate the XPath.
 * @param {string} tagName - The tag name of the element.
 * @param {string} textContent - The text content of the element.
 * @returns {string|null} The generated XPath or null if no valid XPath is found.
 */
function handleComplexText(element, tagName, textContent) {
    let textBasedXPath = `//${tagName}[contains(.,'${textContent}')]`;
    if (validateXPath(textBasedXPath)) return textBasedXPath;

    for (let child of element.childNodes) {
        if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
            textBasedXPath = `//${tagName}[text()='${child.textContent.trim()}']`;
            if (validateXPath(textBasedXPath)) return textBasedXPath;
        }
    }

    return null;
}

/**
 * Validate the generated XPath by checking if it selects exactly one element.
 * @param {string} xpath - The XPath to validate.
 * @returns {boolean} True if the XPath is valid (selects exactly one element), otherwise false.
 */
function validateXPath(xpath) {
    const resultCount = getNumberOfXPath(xpath);
    return resultCount === 1;
}

/**
 * Add an index to an XPath if it selects multiple elements to ensure uniqueness.
 * @param {string} xpath - The XPath to which to add an index.
 * @returns {string} The indexed XPath.
 */
function addIndexToXpath(xpath) {
    let count = getNumberOfXPath(xpath);
    if (count > 1) {
        for (let i = 1; i <= count; i++) {
            let indexedXPath = `(${xpath})[${i}]`;
            if (validateXPath(indexedXPath)) return indexedXPath;
        }
    }
    return xpath;
}

/**
 * Get the number of elements that match a given XPath.
 * @param {string} xpath - The XPath to evaluate.
 * @returns {number} The number of matching elements.
 */
function getNumberOfXPath(xpath) {
    // This function should interact with the DOM to count the elements matching the XPath
    // Implementation depends on the specific context where this function is used.
    // Example: In a browser extension, use `document.evaluate` to count nodes.
    let result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    return result.snapshotLength;
}
