chrome.runtime.onMessage.addListener((req, rec, res) => {
    console.log(req);
    if (req.request === "sendtodevtools") {
        buildUI(req.xpath);
    }
})

function buildUI(data) {
    // document.write(data);
    chrome.storage.local.get(["len"], (data) => {
        // document.write(data.len);
        let display = document.getElementById("display");
        display.textContent = '';
        display.textContent = data.len;

    })
}