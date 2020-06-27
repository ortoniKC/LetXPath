/**
 * @see https://developer.chrome.com/extensions/examples/api/devtools/panels/chrome-query/devtools.js
 * @see https://developer.chrome.com/extensions/devtools#selected-element
 */

/**
 * @author Koushik Chatterjee <koushik@letcode.in>
 */

// Create a connection to the background page
var devtools_connections = chrome.runtime.connect({
    name: "ortoni_devtools_message"
});

let name = "LetXPath";
let html = "panel/panel.html";
let show = () => {
    // send msg to panel.js
    chrome.extension.sendMessage({ message: "sendSelectedElement" });
}
// Create a sidebar panle
chrome.devtools.panels.elements.createSidebarPane(name, (panel) => {
    // listen for the elements changes
    function updatePanel() {
        chrome.devtools.inspectedWindow.eval("parseDOM($0)", {
            useContentScriptContext: true
        }, (result, exceptipon) => {
            console.log(result, exceptipon);
        });
    }
    chrome.devtools.panels.elements.onSelectionChanged.addListener(updatePanel);
    panel.setPage(html);
});



//  devtools_connections.postMessage({
//         name: 'ortoni_devtools_message',
//         tabId: chrome.devtools.inspectedWindow.tabId
//     });
// send the selected element using - $0
// chrome.extension.sendMessage({
//     id: chrome.devtools.inspectedWindow.tabId,
//     request: "on_element_change"
// })