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
let icon = "assets/32.png"
let html = "devtools.html";
let show = () => {
    // chrome.extension.sendMessage({ type: "getXPath" });
}
chrome.devtools.panels.elements.createSidebarPane(name, (panel) => {
    chrome.devtools.panels.elements.onSelectionChanged.addListener(() => {
        chrome
            .devtools
            .inspectedWindow
            .eval("parseDOM($0)", {
                useContentScriptContext: true
            });
        chrome.tabs.sendMessage(chrome.devtools.inspectedWindow.tabId, { request: "element_change" })
    });

    panel.setPage('panel.html');
    // panel.
});
devtools_connections.postMessage({
    name: 'ortoni_devtools_message_start',
    tabId: chrome.devtools.inspectedWindow.tabId
});

