console.log("Hey I am from devtools");

chrome.devtools.panels.elements.createSidebarPane("LetXPath", () => {
    console.log("Hey!");

});

// demo - we not gonna use this
// chrome.devtools.panels.create("LetXPath",
//     "MyPanelIcon.png",
//     "Panel.html",
//     function (panel) {
//         // code invoked on panel creation
//     }
// );