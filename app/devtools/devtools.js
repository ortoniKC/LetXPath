/**
 * @see https://developer.chrome.com/extensions/examples/api/devtools/panels/chrome-query/devtools.js
 * @see https://developer.chrome.com/extensions/devtools#selected-element
 */
/**
 * @author Koushik Chatterjee <koushik350@gmail.com>
 */

// Create a connection to the background page
const devtoolsConnection = chrome.runtime.connect({
    name: "devtools_panel"
});

// Long-term message connection
devtoolsConnection.postMessage({
    name: 'init',
    tabId: chrome.devtools.inspectedWindow.tabId
});

let isActive = false;

/**
 * Update the panel by sending the selected element to the content script to build the XPath
 */
function updatePanel() {
    if (isActive) {
        chrome.devtools.inspectedWindow.eval("parseDOM($0)", {
            useContentScriptContext: true
        }, (result, exceptionInfo) => {
            if (exceptionInfo) {
                console.error('Error parsing DOM:', exceptionInfo);
            }
        });
    }
}

/**
 * Handle the sidebar being shown
 */
function onShown() {
    isActive = true;
    updatePanel();
}

/**
 * Handle the sidebar being hidden
 */
function onHidden() {
    isActive = false;
}

// Create a sidebar panel in the Elements panel
chrome.devtools.panels.elements.createSidebarPane("LetXPath", (sideBar) => {
    // Set the HTML page for the sidebar only once
    sideBar.setPage("panel/panel.html");

    // Listen for changes in the selected element and update the panel
    chrome.devtools.panels.elements.onSelectionChanged.addListener(updatePanel);

    // Handle sidebar visibility changes
    sideBar.onShown.addListener(onShown);
    sideBar.onHidden.addListener(onHidden);
});
