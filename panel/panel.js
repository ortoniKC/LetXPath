console.log("hi from panel");
// chrome.runtime.onMessage.addListener((req, rec, res) => {
//     console.log(req);
//     // if (req.message === "sendSelectedElement") {
//     //     // send to content script and call parseDOM function
//     //     chrome.devtools.inspectedWindow.eval("parseDOM($0)",
//     //         { useContentScriptContext: true }, (res, er) => {
//     //             console.log(res), er;
//     //         });
//     // }
//     if (req.request === "send_to_dev")
//         buildUI(req.data);
// })
// let devtools_connections = chrome.runtime.connect({ name: "ortoni_devtools_message" });
// devtools_connections.postMessage({ req: "some thing", tab: chrome.devtools.inspectedWindow.tabId });

function buildUI(data) {

}