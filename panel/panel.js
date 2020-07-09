chrome.runtime.onMessage.addListener((req, rec, res) => {
    console.log(req);
    if (req.request === "sendtodevtools") {
        buildUI(req.xpath);
    }
})

function buildUI(data) {
    document.write(data);
}