/**
 * @see https://developer.chrome.com/extensions/examples/api/devtools/panels/chrome-query/devtools.js
 * @see https://developer.chrome.com/extensions/devtools#selected-element
 */
// --------------------------------------------------------------------------------------------------
/**
 * @author Koushik Chatterjee <koushik350@gmail.com>
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
let isActive = false;
// Create a sidebar panle
/**
 * Performance issue is fixed with onshow & onhide listener
 */
function updatePanel() {
    if (isActive) {
        // send the selected element to the content script to build the XPath
        chrome.devtools.inspectedWindow.eval("parseDOM($0)", {
            useContentScriptContext: true
        }, (result, exceptionInfo) => { });
    }
}
chrome.devtools.panels.elements.createSidebarPane(name, (sideBar) => {
    // set the HTML page only once, and listen to the changes & update the UI using message passing
    sideBar.setPage(html);
    // executes only once -> when user open the panel UI gets rendered
    chrome.devtools.panels.elements.onSelectionChanged.addListener(() => {
        return updatePanel();
    });
    // On visible find XPath
    sideBar.onShown.addListener(() => {
        isActive = true;
        return updatePanel();
    })
    // On hidden don't find XPath
    sideBar.onHidden.addListener(() => {
        return onHidden(updatePanel);
    });

});
function onHidden(updatePanel) {
    isActive = false;
    chrome.devtools.panels.elements
        .onSelectionChanged
        .removeListener(updatePanel);
}

