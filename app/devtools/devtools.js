console.log("Hey I am from devtools");

chrome.devtools.panels.elements.createSidebarPane("LetXPath", (panel) => {
    console.log("Hey!");
    chrome.devtools.panels.elements.onSelectionChanged
        .addListener(() => {
            panel.setExpression(`$0.attributes`)
        })

});

// demo - we not gonna use this
// chrome.devtools.panels.create("LetXPath",
//     "MyPanelIcon.png",
//     "Panel.html",
//     function (panel) {
//         // code invoked on panel creation
//     }
// );