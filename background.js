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
    chrome.tabs.sendMessage(tab.id, msg)
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
            return true;
        }
        if (message.name == "init") {
            connections[message.tabId] = port;
            return true;
        }
        if (message.selector) {
            if (message.selector.request === "utilsSelector") {
                if (sender.tab) {
                    var tabId = sender.tab.id;
                    if (tabId in connections) {
                        connections[tabId].postMessage(request);
                    } else { }
                } else { }
                // send message to content script
                sendToContentScript(message);
            }
            return true;
        }
        if (message.request === "parseAxes") {
            sendToContentScript(message);
            return true;
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
        return true;
    });
});

// Receive message from content script and relay to the devTools page for the
// current tab
/**
 * @param {} request 
 * @description used to send the message object to the content script
 */
var sendToContentScript = (request) => {
    chrome.tabs.sendMessage(request.tab, request);
}
// install and update notification

let installURL = chrome.runtime.getURL("install.html");
let updateURL = "https://github.com/ortoniKC/LetXPath/releases";
let uninstallURL = "https://letcode.in/uninstall";

chrome.runtime.setUninstallURL(uninstallURL, () => {
    console.log('Uninstalled');
});

let installReason = (detail) => {
    if (detail.reason === "install") {
        chrome.tabs.create({
            url: installURL
        });
        chrome.notifications.create(
            {
                title: 'LetXPath',
                message: 'Please restart your browser to use LetXPath',
                iconUrl: 'assets/32.png',
                type: 'basic'
            }
        )
    }
    else if (detail.reason === "update") {
        updateNotification();
        chrome.notifications.onClicked.addListener(onClickNotification);
    }
}

function onClickNotification() {
    chrome.tabs.create({
        url: updateURL
    });
}

function updateNotification() {
    chrome.notifications.create(
        {
            title: 'LetXPath',
            message: 'LetXPath has been updated. Please click to read the changelog.',
            iconUrl: 'assets/32.png',
            type: 'basic'
        }
    )
}

chrome.runtime.onInstalled.addListener((details) => {
    installReason(details)
})

// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//     if (changeInfo.status === "complete") {
//         chrome.runtime.sendMessage({ request: 'pageInfo', tab: tab })
//     }
// })
// chrome.tabs.onCreated.addListener(tab => {
//     // chrome.runtime.sendMessage({ request: 'pageInfo', tab: tab })
//     chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//         if (changeInfo.status === "complete") {
//             chrome.runtime.sendMessage({ request: 'pageInfo', tab: tab })
//         }
//     })
// })