// Create a context menu to get XPath on click. This might be removed in the future.
chrome.contextMenus.create({
    id: "LetXPath",
    title: "Select Parent",
    contexts: ["all"]
});

let isSource = false;

/**
 * Get XPath information and send a message to the content script.
 * @param {Object} info - Information about the context menu click event.
 * @param {Object} tab - The details of the tab where the click took place.
 */
function getXPath(info, tab) {
    const msg = { request: 'context_menu_click' };
    chrome.tabs.sendMessage(tab.id, msg);
}

// Event listener for context menu clicks.
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "LetXPath") {
        toggle();
        getXPath(info, tab);
    }
});

/**
 * Send a message to the content script.
 * @param {Object} request - The message object to send to the content script.
 */
function sendToContentScript(request) {
    chrome.tabs.sendMessage(request.tab, request);
}
let connections = {};
chrome.runtime.onConnect.addListener(port => {
    const extensionListener = (message, sender, sendResponse) => {
        const { name, tabId, selector, request } = message;
        if (name === "devtools_panel" || name === "init") {
            connections[tabId] = port;
            return true;
        }
        if (selector && selector.request === "utilsSelector" && sender.tab) {
            const tabId = sender.tab.id;
            if (tabId in connections) {
                connections[tabId].postMessage(request);
            }
            sendToContentScript(message);
            return true;
        }
        if (["parseAxes", "userSearchXP", "dotheconversion", "cleanhighlight"].includes(request)) {
            sendToContentScript(message);
            return true;
        }
    };

    port.onMessage.addListener(extensionListener);

    port.onDisconnect.addListener(() => {
        port.onMessage.removeListener(extensionListener);
        const tabs = Object.keys(connections);
        for (const tab of tabs) {
            if (connections[tab] === port) {
                delete connections[tab];
                break;
            }
        }
        return true;
    });
});

// Install and update notifications
const installURL = chrome.runtime.getURL("install.html");
const updateURL = "https://github.com/ortoniKC/LetXPath/releases";

/**
 * Handle installation and update events.
 * @param {Object} details - Details about the installation or update event.
 */
function handleInstall(details) {
    if (details.reason === "install") {
        chrome.tabs.create({ url: installURL });
        chrome.notifications.create({
            title: 'LetXPath By LetCode with Koushik',
            message: 'Please restart your browser to use LetXPath',
            iconUrl: 'assets/32.png',
            type: 'basic'
        });
    }
    else if (details.reason === "update") {
        updateNotification();
        chrome.notifications.onClicked.addListener(onClickNotification);
    }
}

/**
 * Handle click events on update notifications.
 */
function onClickNotification() {
    chrome.tabs.create({ url: updateURL });
}

/**
 * Show an update notification.
 */
function updateNotification() {
    chrome.notifications.create({
        title: 'LetXPath',
        message: 'LetXPath has been updated. Please click to read the changelog.',
        iconUrl: 'assets/32.png',
        type: 'basic'
    });
}

chrome.runtime.onInstalled.addListener(handleInstall);

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