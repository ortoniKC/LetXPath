chrome.contextMenus.create({
    "id": "LetX",
    "title": "Get XPath",
    "contexts": ["all"]
})


chrome.contextMenus.onClicked.addListener((info, tab) => {
    alert(Object.keys(info))


})
// chrome.contextMenus.onClicked.addListener(function() {

// })