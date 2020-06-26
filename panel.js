console.log("hi from panel");
chrome.runtime.onMessage.addListener((req, rec, res) => {
    console.log(req);
    document.getElementById("change").textContent = JSON.stringify(req.data);
})
let devtools_connections = chrome.runtime.connect({ name: "ortoni_devtools_message" });
// devtools_connections.postMessage({ req: "some thing", tab: chrome.devtools.inspectedWindow.tabId })