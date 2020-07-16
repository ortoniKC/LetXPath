
let installURL = "https://youtu.be/1CISIspFD_U";
let updateURL = "https://github.com/ortoniKC/LetXPath";
let uninstallURL = "https://www.letcode.in/products";

chrome.runtime.setUninstallURL(uninstallURL, () => { });

let installReason = (detail) => {
    console.log(detail);

    if (detail.reason === "install") {
        chrome.tabs.create({
            url: installURL
        })
    } else if (detail.reason === "update") {
        chrome.tabs.create({
            url: updateURL
        })
    }

}
chrome.runtime.onInstalled.addListener((details) => {
    installReason(details)
})


chrome.contextMenus.create({
    "id": "LetXPath",
    "title": "Get XPath",
    "contexts": ["all"]
})
let getXPath = (info, tab) => {
    let msg = {
        type: 'getXPath'
    }
    chrome.tabs.sendMessage(tab.id, msg, () => {
        console.log("Message sent");
    })
    console.log(tab);
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
    getXPath(info, tab)
})

