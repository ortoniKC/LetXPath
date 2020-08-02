// create context menu to get XPath on click -  In feature this might removed
chrome.contextMenus.create({
    "id": "LetXPath",
    "title": "Select Parent",
    "contexts": ["all"]
})
/**
 * Toggle the context menu option
 */
let isSource = false;
function toggle() {
    isSource = !isSource;
    if (isSource) {
        chrome.contextMenus.update('LetXPath', { "title": "Select Child", }, () => { })
    } else {
        chrome.contextMenus.update('LetXPath', { "title": "Select Parent", }, () => { })
    }
}
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId == "LetXPath") {
        toggle();
    }
});
let getXPath = (info, tab) => {
    let msg = {
        request: 'context_menu_click'
    }
    chrome.tabs.sendMessage(tab.id, msg, () => { })
}
// on context menu click send message to content script
chrome.contextMenus.onClicked.addListener((info, tab) => {
    getXPath(info, tab)
})

// --------------- Below code is from chrome message passing API, same applicable for other Chromium based API like, 
// --------------- firefox, MS edge, opera
// background.js

var connections = {};
chrome.runtime.onConnect.addListener(function (port) {
    var extensionListener = function (message, sender, sendResponse) {

        // The original connection event doesn't include the tab ID of the
        // DevTools page, so we need to send it explicitly.
        if (message.name == "devtools_panel") {
            connections[message.tabId] = port;
            return;
        }
        if (message.selector) {
            if (message.selector.request === "utilsSelector") {
                if (sender.tab) {
                    var tabId = sender.tab.id;
                    if (tabId in connections) {
                        connections[tabId].postMessage(request);
                    } else {

                    }
                } else {

                }
                // send message to content script
                sendToContentScript(message);
            }
        }
    }
    // Listen to messages sent from the DevTools page
    port.onMessage.addListener(extensionListener);
    port.onDisconnect.addListener(function (port) {
        port.onMessage.removeListener(extensionListener);
        var tabs = Object.keys(connections);
        for (var i = 0, len = tabs.length; i < len; i++) {
            if (connections[tabs[i]] == port) {
                delete connections[tabs[i]]
                break;
            }
        }
    });
});

// Receive message from content script and relay to the devTools page for the
// current tab
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {


    if (request.type === "send_to_dev") {
        // Messages from content scripts should have sender.tab set
        if (sender.tab) {
            var tabId = sender.tab.id;
            if (tabId in connections) {
                connections[tabId].postMessage(request);
            } else {

            }
        } else {

        }
    }
    // to avoid async problem return is used!
    return true;
});
/**
 * @param {} request 
 * @description used to send the message object to the content script
 */
var sendToContentScript = (request) => {
    chrome.tabs.sendMessage(request.tab, request);
}

// install and update notification

let installURL = chrome.runtime.getURL("install.html");
let updateURL = "https://github.com/ortoniKC/LetXPath";
let uninstallURL = "https://www.letcode.in/products";

// chrome.runtime.setUninstallURL(uninstallURL, () => { });

let installReason = (detail) => {
    console.log(detail);

    if (detail.reason === "install") {
        chrome.tabs.create({
            url: installURL
        })
    }
    // else if (detail.reason === "update") {
    //     notification();
    //     chrome.notifications.onClicked.addListener(onClickNotification);
    // }
}

function onClickNotification() {
    chrome.tabs.create({
        url: updateURL
    });
}

function notification() {
    chrome.notifications.create(
        {
            title: 'LetXPath',
            message: 'Hurray!!!!! I have a update for you',
            iconUrl: 'assets/32.png',
            type: 'basic'
        }
    )
}

chrome.runtime.onInstalled.addListener((details) => {
    installReason(details)
})
