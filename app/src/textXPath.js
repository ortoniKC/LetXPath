function getTextXPath(element) {
    let tagName = element.tagName.toLowerCase()
    let text = element.textContent
    let pattern = `//${tagName}[text()='${text}']`
    XPATHDATA.push(['text', pattern])
}