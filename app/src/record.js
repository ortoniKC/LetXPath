function stopRecord() {
    document.removeEventListener("mouseover", mouseOver, true);
    document.removeEventListener("mouseout", mouseOut, true);
    // Not working for cross-origin (Chrome security policy)
    // let frl = window.top.document.getElementsByTagName('iframe').length;

    let values = {
        date: Date.now().toString(),
        xpath: recordArray,
        xpathPOM: recordArrayPOM,
        title: document.title,
        URL: document.URL
    }
    chrome.storage.local.set({ "downloadData": values })
    // chrome.extension.sendRequest(values); // deprecated
}
function startRecording() {
    searchXPathArray = [];
    document.addEventListener("mouseover", mouseOver, true);
    document.addEventListener("mouseout", mouseOut, true);
    document.addEventListener("click", doRecord, true);
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