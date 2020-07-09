console.log("Hey I am from devtools");

chrome.devtools.panels.elements.createSidebarPane("LetXPath", (panel) => {
    console.log("Hey!");
    chrome.devtools.panels.elements.onSelectionChanged
        .addListener(() => {
            chrome.devtools.inspectedWindow.eval("parseDOM($0)",
                { useContentScriptContext: true });
        });
    panel.setPage("panel/panel.html")
});