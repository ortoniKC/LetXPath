let isSource = false;

function toggle() {
  isSource = !isSource;
  if (isSource) {
    chrome.contextMenus.update("LetXPath", { title: "Select Child" }, () => {});
  } else {
    chrome.contextMenus.update(
      "LetXPath",
      { title: "Select Parent" },
      () => {},
    );
  }
}

async function sendMessageTotab(tabId: number, msg: any) {
  try {
    await chrome.tabs.sendMessage(tabId, msg);
  } catch (err) {
    console.warn("Message send failed:", err);
  }
}

function getXPath(
  _info: chrome.contextMenus.OnClickData,
  tab: chrome.tabs.Tab,
) {
  const msg = { request: "context_menu_click" };
  if (tab.id !== undefined) {
    sendMessageTotab(tab.id, msg);
  }
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "LetXPath" && tab) {
    toggle();
    getXPath(info, tab);
  }
});

function sendToContentScript(request: any) {
  if (request.tab !== undefined) {
    sendMessageTotab(request.tab, request);
  }
}

chrome.runtime.onMessage.addListener(function (message, _sender, sendResponse) {
  if (
    ["parseAxes", "userSearchXP", "dotheconversion", "cleanhighlight"].includes(
      message.request,
    )
  ) {
    sendToContentScript(message);
    sendResponse("Hello");
  }
});

const installURL = chrome.runtime.getURL("install.html");

function handleInstall(details: chrome.runtime.InstalledDetails) {
  if (details.reason === "install") {
    chrome.tabs.create({ url: installURL });
    chrome.notifications.create({
      title: "LetXPath By LetCode with Koushik",
      message: "Please restart your browser to use LetXPath",
      iconUrl: "assets/32.png",
      type: "basic",
    });
  }

  // Clean up and recreate context menu
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "LetXPath",
      title: "Select Parent",
      contexts: ["all"],
    });
  });
}

chrome.runtime.onInstalled.addListener(handleInstall);
