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
let axesSelectionMode = 'parent'; // Track current mode: 'parent' or 'child'

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
          console.error("XPath generation failed:", exceptionInfo.description);
        }
        console.info("Logged result:", result);
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

/**
 * Handles parent element selection from DevTools context menu
 */
function selectAxesParent() {
  // Check if there's an existing selection that needs reset
  chrome.devtools.inspectedWindow.eval(
    "(function() { " +
    "  if (typeof dupArray !== 'undefined' && dupArray.length > 0) { " +
    "    return { needsReset: true, currentLength: dupArray.length }; " +
    "  } " +
    "  return { needsReset: false }; " +
    "})()",
    { useContentScriptContext: true },
    (result, exceptionInfo) => {
      if (exceptionInfo) {
        console.error("Error checking dupArray state:", exceptionInfo.description);
        return;
      }

      if (result && result.needsReset) {
        // Reset existing selection
        chrome.devtools.inspectedWindow.eval(
          "dupArray.length = 0; tagArrHolder.length = 0;",
          { useContentScriptContext: true }
        );
        showNotification("Previous selection cleared. Starting new axes XPath selection.", "info");
      }

      // Proceed with parent selection
      axesSelectionMode = 'child'; // Next selection will be child

      chrome.devtools.inspectedWindow.eval(
        "handleDevToolsAxesSelection($0, 'parent')",
        { useContentScriptContext: true },
        (result, exceptionInfo) => {
          if (exceptionInfo) {
            console.error("Parent selection failed:", exceptionInfo.description);
            showNotification("Parent selection failed: " + exceptionInfo.description, "error");
          } else if (result && !result.success) {
            console.error("Parent selection error:", result.error);
            showNotification(result.error, "error");
          } else {
            console.info("Parent element selected for axes XPath");
            showNotification("Parent element selected. Now select a child element.", "success");
          }
        }
      );
    }
  );
}

/**
 * Handles child element selection from DevTools context menu
 */
function selectAxesChild() {
  // Validate state before proceeding
  chrome.devtools.inspectedWindow.eval(
    "(function() { " +
    "  if (typeof dupArray === 'undefined' || dupArray.length === 0) { " +
    "    return { error: 'Please select a parent element first' }; " +
    "  } " +
    "  if (dupArray.length >= 2) { " +
    "    return { error: 'Axes XPath already complete. Select a new parent to start over.' }; " +
    "  } " +
    "  return { ok: true }; " +
    "})()",
    { useContentScriptContext: true },
    (stateResult, stateException) => {
      if (stateException) {
        console.error("Error checking state:", stateException.description);
        return;
      }

      if (stateResult && stateResult.error) {
        showNotification(stateResult.error, "warning");
        return;
      }

      // State is valid, proceed with child selection
      axesSelectionMode = 'parent'; // Reset for next iteration

      chrome.devtools.inspectedWindow.eval(
        "handleDevToolsAxesSelection($0, 'child')",
        { useContentScriptContext: true },
        (result, exceptionInfo) => {
          if (exceptionInfo) {
            console.error("Child selection failed:", exceptionInfo.description);
            showNotification("Child selection failed: " + exceptionInfo.description, "error");
          } else if (result && !result.success) {
            console.error("Child selection error:", result.error);
            showNotification(result.error, "error");
          } else {
            console.info("Child element selected, generating axes XPath");
            showNotification("Axes XPath generated! Check the Axes tab.", "success");
          }
        }
      );
    }
  );
}

/**
 * Shows notification to user via panel
 * @param {string} message - Message to display
 * @param {string} type - Notification type: 'info', 'success', 'warning', 'error'
 */
function showNotification(message, type = 'info') {
  // Send notification to panel for display
  chrome.runtime.sendMessage({
    request: 'show_notification',
    data: { message, type }
  }, function(response) {
    // Silently handle errors
    if (chrome.runtime.lastError) {
      // Ignore
    }
  });

  // Also log to console for debugging
  console.info(`[LetXPath] ${message}`);
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

// Expose axes selection functions globally so they can be called from panel buttons
window.selectAxesParent = selectAxesParent;
window.selectAxesChild = selectAxesChild;
