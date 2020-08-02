function stopRecord() {
    elementOwnerDocument.removeEventListener("mouseover", mouseOver, true);
    elementOwnerDocument.removeEventListener("mouseout", mouseOut, true);
    // Not working for cross-origin (Chrome security policy)
    // let frl = window.top.elementOwnerDocument.getElementsByTagName('iframe').length;

    let values = {
        date: Date.now().toString(),
        xpath: recordArray,
        xpathPOM: recordArrayPOM,
        title: elementOwnerDocument.title,
        URL: elementOwnerDocument.URL
    }
    chrome.storage.local.set({ "downloadData": values })
    // chrome.extension.sendRequest(values); // deprecated
}
function startRecording() {
    searchXPathArray = [];
    elementOwnerDocument.addEventListener("mouseover", mouseOver, true);
    elementOwnerDocument.addEventListener("mouseout", mouseOut, true);
    elementOwnerDocument.addEventListener("click", doRecord, true);
}
function doRecord(event) {
    if (isRecordEnabled) {
        event.stopPropagation();
        event.preventDefault();
        targetElemt = event.target;
        ortoni.parseSelectedDOM();
        searchAll();
        try {
            searchXPathArray = [];
            atrributesArray = [];
            webTableDetails = null;
        } catch (error) {
            searchXPathArray = [];
            atrributesArray = [];
            webTableDetails = null;
        }
    }
}