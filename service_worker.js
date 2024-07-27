// Remove all existing context menu items to avoid duplicates
chrome.contextMenus.removeAll(() => {
  // Create the context menu item
  chrome.contextMenus.create({
    id: "LetXPath",
    title: "Select Parent",
    contexts: ["all"],
  });
});

let isSource = false;
function toggle() {
  isSource = !isSource;
  if (isSource) {
    chrome.contextMenus.update("LetXPath", { title: "Select Child" }, () => {});
  } else {
    chrome.contextMenus.update(
      "LetXPath",
      { title: "Select Parent" },
      () => {}
    );
  }
}

function getXPath(info, tab) {
  const msg = { request: "context_menu_click" };
  chrome.tabs.sendMessage(tab.id, msg).then(() => {});
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "LetXPath") {
    toggle();
    getXPath(info, tab);
  }
});

function sendToContentScript(request) {
  chrome.tabs.sendMessage(request.tab, request).then(() => {});
}

let connections = {};
chrome.runtime.onConnect.addListener((port) => {
  const extensionListener = (message, sender, sendResponse) => {
    const { name, tabId, selector, request } = message;

    if (name === "devtools_panel_config") {
      connections[tabId] = port;
    }

    if (selector && selector.request === "utilsSelector" && sender.tab) {
      const tabId = sender.tab.id;
      if (tabId in connections) {
        connections[tabId].postMessage(request);
      }
      sendToContentScript(message);
    }

    if (
      [
        "parseAxes",
        "userSearchXP",
        "dotheconversion",
        "cleanhighlight",
      ].includes(request)
    ) {
      sendToContentScript(message);
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
  });
});

const installURL = chrome.runtime.getURL("install.html");
const updateURL = "https://github.com/ortoniKC/LetXPath/releases";

function handleInstall(details) {
  if (details.reason === "install") {
    chrome.tabs.create({ url: installURL });
    chrome.notifications.create({
      title: "LetXPath By LetCode with Koushik",
      message: "Please restart your browser to use LetXPath",
      iconUrl: "assets/32.png",
      type: "basic",
    });
  }
  // else if (details.reason === "update") {
  //   updateNotification();
  //   chrome.notifications.onClicked.addListener(onClickNotification);
  // }
}

function onClickNotification() {
  chrome.tabs.create({ url: updateURL });
}

function updateNotification() {
  chrome.notifications.create({
    title: "LetXPath",
    message: "LetXPath has been updated. Please click to read the changelog.",
    iconUrl: "assets/32.png",
    type: "basic",
  });
}

chrome.runtime.onInstalled.addListener(handleInstall);
