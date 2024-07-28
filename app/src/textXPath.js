/**
 * @description Generate an XPath expression to locate an element based on its text content.
 * @param {HTMLElement} element - The element for which to generate the XPath.
 * @param {string} tagName - The tag name of the element.
 * @returns {string|null} The generated XPath or null if no valid XPath is found.
 */
function getTextBasedXPath(element, tagName) {
    const textContent = element.textContent.trim();
    if (!textContent) return null;

    if (tagName === 'a') return handleLinkText(element, textContent);

    const normalizedTextContent = textContent.replace(/\s+/g, " ");
    const xpaths = [
        `//${tagName}[normalize-space(text())='${normalizedTextContent}']`,
        `//${tagName}[text()='${textContent}']`,
        `//${tagName}[contains(text(),'${textContent}')]`,
        Array.from(element.childNodes).some(node => node.nodeName === 'BR') ? `//${tagName}[contains(.,'${textContent}')]` : null,
        handleComplexText(element, tagName, textContent)
    ].filter(Boolean);

    for (let xpath of xpaths) {
        if (validateXPath(xpath)) return xpath;
    }

    return null;
}

/**
 * Generate an XPath expression for a link (<a>) element based on its text content.
 * @param {HTMLElement} element - The link element.
 * @param {string} textContent - The text content of the link element.
 * @returns {string|null} The generated XPath or null if no valid XPath is found.
 */
function handleLinkText(element, textContent) {
    const normalizedTextContent = textContent.replace(/\s+/g, " ");
    const xpaths = [
        `//a[normalize-space(text())='${normalizedTextContent}']`,
        `//a[contains(text(),'${normalizedTextContent}')]`
    ];

    if (element.childElementCount > 0) {
        const partialText = element.children[0].innerText.trim();
        xpaths.push(`//a[contains(text(),'${partialText}')]`);
    }

    for (let xpath of xpaths) {
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
    const xpaths = [
        `//${tagName}[contains(.,'${textContent}')]`
    ];

    for (let child of element.childNodes) {
        if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
            xpaths.push(`//${tagName}[text()='${child.textContent.trim()}']`);
        }
    }

    for (let xpath of xpaths) {
        if (validateXPath(xpath)) return xpath;
    }

    return null;
}

/**
 * Validate the generated XPath by checking if it selects exactly one element.
 * @param {string} xpath - The XPath to validate.
 * @returns {boolean} True if the XPath is valid (selects exactly one element), otherwise false.
 */
function validateXPath(xpath) {
    return getNumberOfTextXPath(xpath) === 1;
}

/**
 * Add an index to an XPath if it selects multiple elements to ensure uniqueness.
 * @param {string} xpath - The XPath to which to add an index.
 * @returns {string} The indexed XPath.
 */
function addIndexToXpath(xpath) {
    const count = getNumberOfTextXPath(xpath);
    if (count > 1) {
        for (let i = 1; i <= count; i++) {
            const indexedXPath = `(${xpath})[${i}]`;
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
function getNumberOfTextXPath(xpath) {
    const result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    return result.snapshotLength;
}
