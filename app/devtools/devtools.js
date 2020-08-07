/**
 * @see https://developer.chrome.com/extensions/examples/api/devtools/panels/chrome-query/devtools.js
 * @see https://developer.chrome.com/extensions/devtools#selected-element
 */
// --------------------------------------------------------------------------------------------------
/**
 * @author Koushik Chatterjee <koushik@letcode.in>
 */

// Create a connection to the background page
var devtools_connections = chrome.runtime.connect({
    name: "devtools_panel"
});
// long-term message connection
devtools_connections.postMessage({
    name: 'init',
    tabId: chrome.devtools.inspectedWindow.tabId
});
let name = "LetXPath";
let html = "panel/panel.html";
// TODO:
let onHidden = () => {
    chrome.devtools.panels.elements.onSelectionChanged.removeListener(() => {
    });
}

// Create a sidebar panle
chrome.devtools.panels.elements.createSidebarPane(name, (panel) => {
    function updatePanel() {
        // send the selected element to the content script to build the XPath
        chrome.devtools.inspectedWindow.eval("parseDOM($0)", {
            useContentScriptContext: true
        }, (result, exceptipon) => { });
    }
    // listen for the elements changes
    chrome.devtools.panels.elements.onSelectionChanged.addListener(updatePanel);
    // executes only once -> when user open the panel UI gets rendered
    panel.onShown.addListener(updatePanel);
    // set the HTML page only once, and listen to the changes & update the UI using message passing
    panel.setPage(html);
});
