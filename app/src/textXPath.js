function getTextXPath(element) {
    if (element.textContent != "") {
        let tagName = element.tagName.toLowerCase()
        let text = element.textContent

        let pattern = `//${tagName}[text()='${text}']`
        XPATHDATA.push(['text', pattern])

    }


}