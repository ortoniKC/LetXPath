// // Remove all existing context menu items to avoid duplicates
// chrome.contextMenus.removeAll(() => {
//   // Create the context menu item
//   chrome.contextMenus.create({
//     id: "LetXPath",
//     title: "Select Parent",
//     contexts: ["all"],
//   });
// });

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
async function sendMessageTotab(tab, msg) {
  chrome.tabs.sendMessage(tab, msg).then("Sent to CS");
  // return new Promise((resolve) => {
  //   resolve(response);
  // });
}

function getXPath(info, tab) {
  const msg = { request: "context_menu_click" };
  sendMessageTotab(tab.id, msg);
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "LetXPath") {
    toggle();
    getXPath(info, tab);
  }
});

function sendToContentScript(request) {
  sendMessageTotab(request.tab, request);
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (
    ["parseAxes", "userSearchXP", "dotheconversion", "cleanhighlight"].includes(
      message.request
    )
  ) {
    sendToContentScript(message);
    sendResponse("Hello");
  }
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
  chrome.contextMenus.create({
    id: "LetXPath",
    title: "Select Parent",
    contexts: ["all"],
  });
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
