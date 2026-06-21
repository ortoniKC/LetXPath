const html = "panel/panel.html";
let isActive = false;

function updatePanel() {
  if (isActive) {
    chrome.devtools.inspectedWindow.eval(
      "parseDOM($0)",
      { useContentScriptContext: true },
      (_result, exceptionInfo) => {
        if (exceptionInfo) {
          // Exception info handled silently or logged
        }
      },
    );
  }
}

function onHidden() {
  isActive = false;
  chrome.devtools.panels.elements.onSelectionChanged.removeListener(
    updatePanel,
  );
}

chrome.devtools.panels.elements.createSidebarPane(
  "Ortoni Studio",
  (sideBar) => {
    sideBar.setPage(html);

    chrome.devtools.panels.elements.onSelectionChanged.addListener(updatePanel);

    sideBar.onShown.addListener(() => {
      isActive = true;
      updatePanel();
    });

    sideBar.onHidden.addListener(onHidden);
  },
);
export {};
