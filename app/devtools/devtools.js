/**
 * @author
 * Koushik Chatterjee <koushik350@gmail.com>
 */

// Establish a connection to the DevTools panel
// var devtoolsConnections = chrome.runtime.connect({ name: "devtools_panel" });

// devtoolsConnections.postMessage({
//   name: "devtools_panel",
//   tabId: chrome.devtools.inspectedWindow.tabId,
// });

const html = "panel/panel.html";
let isActive = false;

/**
 * Updates the panel by evaluating the selected DOM element.
 */
function updatePanel() {
  if (isActive) {
    chrome.devtools.inspectedWindow.eval(
      "parseDOM($0)",
      { useContentScriptContext: true },
      (result, exceptionInfo) => {
        if (exceptionInfo) {
        }
      }
    );
  }
}

/**
 * Handles the sidebar being hidden.
 */
function onHidden() {
  isActive = false;
  chrome.devtools.panels.elements.onSelectionChanged.removeListener(
    updatePanel
  );
}

// Create the sidebar pane in the Elements panel
chrome.devtools.panels.elements.createSidebarPane("LetXPath", (sideBar) => {
  sideBar.setPage(html);

  chrome.devtools.panels.elements.onSelectionChanged.addListener(updatePanel);
  sideBar.onShown.addListener(() => {
    isActive = true;
    updatePanel();
  });
  sideBar.onHidden.addListener(onHidden);
});
