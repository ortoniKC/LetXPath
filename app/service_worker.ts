let isSource = false;

function toggle() {
  isSource = !isSource;
  if (isSource) {
    chrome.contextMenus.update("OrtoniStudio", { title: "Select Child" }, () => {});
  } else {
    chrome.contextMenus.update(
      "OrtoniStudio",
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
  if (info.menuItemId === "OrtoniStudio" && tab) {
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
      title: "Ortoni Studio By LetCode with Koushik",
      message: "Please restart your browser to use Ortoni Studio",
      iconUrl: "assets/32.png",
      type: "basic",
    });
  }

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "OrtoniStudio",
      title: "Select Parent",
      contexts: ["all"],
    });
  });
}

chrome.runtime.onInstalled.addListener(handleInstall);
