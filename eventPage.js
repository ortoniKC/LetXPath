// create context menu to get XPath on click
chrome.contextMenus.create({
    "id": "LetXPath",
    "title": "Get XPath",
    "contexts": ["all"]
})

let getXPath = (info, tab) => {
    let msg = {
        request: 'context_menu_click'
    }
    chrome.tabs.sendMessage(tab.id, msg, () => {
        console.log("Message sent");
    })
}

// on context menu click send message to content script
chrome.contextMenus.onClicked.addListener((info, tab) => {
    getXPath(info, tab)
})

// background.js
var connections = {};

chrome.runtime.onConnect.addListener(function (port) {

    var extensionListener = function (message, sender, sendResponse) {
        console.log("with in on connect");
        console.log(message);

        // The original connection event doesn't include the tab ID of the
        // DevTools page, so we need to send it explicitly.
        if (message.name == "ortoni_devtools_message") {
            connections[message.tabId] = port;
            return;
        }
        // else if (message.request === "on_element_change") {
        //     console.log("on connecting", "on_element_chang");
        // }
        // other message handling
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
    console.log("with in on message");
    console.log(request);
    if (request.type === "send_to_dev") {
        // Messages from content scripts should have sender.tab set
        if (sender.tab) {
            var tabId = sender.tab.id;
            if (tabId in connections) {
                connections[tabId].postMessage(request);
                // alert(request + ' BG')
            } else {
                console.log("Tab not found in connection list.");
            }
        } else {
            console.log("sender.tab not defined.");
        }
    } if (request.request == "on_element_change") {
        if (sender.tab) {
            var tabId = sender.tab.id;
            if (tabId in connections) {
                connections[tabId].postMessage(request);
            } else {
                console.log("Tab not found in connection list.");
            }
        } else {
            console.log("sender.tab not defined.");
        }
        sendToContentScript(request);
    }

    return true;
});
var sendToContentScript = (request) => {
    chrome.tabs.sendMessage(request.id, request);
}