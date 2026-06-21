import React, { useState, useEffect, useRef } from "react";

const ACTION_LABELS = {
  textarea: ["snippet", "getAttribute", "sendKeys"],
  input: {
    click: ["snippet", "getAttribute", "click"],
    send: ["snippet", "getAttribute", "sendKeys"],
  },
  img: ["snippet", "getAttribute", "click"],
  default: ["snippet", "getAttribute", "click", "getText"],
};

interface TemplateGroup {
  click: string;
  send: string;
  text: string;
  attr: string;
}

const DEFAULT_TEMPLATES: Record<"jscs" | "javacs", TemplateGroup> = {
  jscs: {
    click:
      "private ${vn} = ${lc};\nasync clickOn${mn}(){\n  await this.click(this.${vn})\n}",
    send: "private ${vn} = ${lc};\nasync enter${mn}(value){\n  await this.sendKeys(this.${vn}, value)\n}",
    text: "private ${vn} = ${lc};\nasync get${mn}Text(){\n  return await this.getText(this.${vn})\n}",
    attr: "private ${vn} = ${lc};\nasync get${mn}Attr(attribute){\n  return await this.getAttribute(this.${vn}, attribute)\n}",
  },
  javacs: {
    click:
      "${lc} private WebElement ${vn};\npublic void clickOn${mn}(){\n  this.click(this.${vn});\n}",
    send: "${lc} private WebElement ${vn};\npublic void enter${mn}(String value){\n  this.type(this.${vn}, value);\n}",
    text: "${lc} private WebElement ${vn};\npublic String get${mn}Text(){\n  return this.getText(this.${vn});\n}",
    attr: "${lc} private WebElement ${vn};\npublic String get${mn}Attr(String attribute){\n  return this.getAttribute(this.${vn}, attribute);\n}",
  },
};

interface WebTableDetails {
  totalTables: number;
  tableLocator: string;
  tableData: string;
}

interface SelectedElement {
  xpathid: [number, string, string][];
  cssPath: [number, string, string][];
  tag: string;
  type: string;
  variablename?: string;
  methodname?: string;
  webtabledetails?: WebTableDetails | null;
  attributes?: Record<string, string>;
  text?: string;
  labelText?: string;
  playwrightLocators?: [number, string, string, string, string, string][];
  cypressLocators?: [number, string, string][];
}

interface AxesData {
  src: [number, string, string][];
  dst: [number, string, string][];
  proOrFol: string;
  defaultXPath: string;
}

interface ChromeStorageResult {
  langID?: string;
  customLang?: "jscs" | "javacs";
  clickvalue?: string;
  sendvalue?: string;
  textvalue?: string;
  attrvalue?: string;
}

interface DevToolsMessageRequest {
  request: string;
  data?: any;
  output?: string;
  xpathid?: [number, string, string][];
  cssPath?: [number, string, string][];
  tag?: string;
  type?: string;
  variablename?: string;
  methodname?: string;
  webtabledetails?: WebTableDetails | null;
  attributes?: Record<string, string>;
  text?: string;
  labelText?: string;
  playwrightLocators?: [number, string, string, string, string, string][];
  cypressLocators?: [number, string, string][];
  step?: any;
}

const colorizeXPath = (xpath: string): React.ReactNode => {
  const tokenRegex =
    /('(?:\\'|[^'])*'|"(?:\\"|[^"])*"|[a-zA-Z-]+::|@[a-zA-Z0-9_-]+|[a-zA-Z-]+\s*\(|text\s*\(\)|\/\/|\/|\[|\]|\(|\)|=|\b(?:and|or)\b|\d+|[a-zA-Z0-9_-]+)/g;
  const tokens = xpath.split(tokenRegex);
  return tokens.map((token, idx) => {
    if (!token) return null;
    let color = "#d4d4d4";
    if (token.startsWith("'") || token.startsWith('"')) {
      color = "#ce9178"; // string
    } else if (token.endsWith("::")) {
      color = "#c586c0"; // axes
    } else if (token.startsWith("@")) {
      color = "#9cdcfe"; // attribute
    } else if (token.includes("(")) {
      color = "#dcdcaa"; // function
    } else if (token === "//" || token === "/") {
      color = "#ff5d5b"; // slash
    } else if (["[", "]", "(", ")", "="].includes(token)) {
      color = "#ffd700"; // brackets/operators
    } else if (["and", "or"].includes(token)) {
      color = "#569cd6"; // logic
    } else if (/^\d+$/.test(token)) {
      color = "#b5cea8"; // index
    } else if (/^[a-zA-Z0-9_-]+$/.test(token)) {
      const tags = [
        "input",
        "div",
        "label",
        "span",
        "a",
        "button",
        "form",
        "img",
        "textarea",
        "select",
        "option",
        "table",
        "tr",
        "td",
        "th",
        "tbody",
        "thead",
        "ul",
        "li",
        "ol",
      ];
      if (tags.includes(token.toLowerCase())) {
        color = "#569cd6"; // tag
      } else {
        color = "#4ec9b0"; // identifier
      }
    }
    return (
      <span key={idx} style={{ color }}>
        {token}
      </span>
    );
  });
};

const colorizeCSS = (css: string): React.ReactNode => {
  const tokenRegex =
    /(\.[a-zA-Z0-9_-]+|#[a-zA-Z0-9_-]+|\[[a-zA-Z0-9_-]+|=['"]?[a-zA-Z0-9_-\s&]*['"]?\]|:[a-zA-Z0-9_-]+|>[+~*]?|[a-zA-Z0-9_-]+)/g;
  const tokens = css.split(tokenRegex);
  return tokens.map((token, idx) => {
    if (!token) return null;
    let color = "#d4d4d4";
    if (token.startsWith(".")) {
      color = "#dcdcaa"; // class
    } else if (token.startsWith("#")) {
      color = "#ce9178"; // id
    } else if (token.startsWith("[")) {
      color = "#9cdcfe"; // attribute
    } else if (token.startsWith("=")) {
      color = "#ce9178"; // attribute value
    } else if (token.startsWith(":")) {
      color = "#c586c0"; // pseudo class
    } else if ([">", "+", "~", "*", "^=", "$=", "*="].includes(token)) {
      color = "#ff5d5b"; // combinators
    } else if (/^[a-zA-Z0-9_-]+$/.test(token)) {
      const tags = [
        "input",
        "div",
        "label",
        "span",
        "a",
        "button",
        "form",
        "img",
        "textarea",
        "select",
        "option",
        "table",
        "tr",
        "td",
        "th",
        "tbody",
        "thead",
        "ul",
        "li",
        "ol",
      ];
      if (tags.includes(token.toLowerCase())) {
        color = "#569cd6"; // tag
      }
    }
    return (
      <span key={idx} style={{ color }}>
        {token}
      </span>
    );
  });
};

const getPlaywrightActions = (tag: string, type?: string): string[] => {
  const t = tag.toLowerCase();
  const typ = type?.toLowerCase() || "";
  const baseActions = [
    "click",
    "hover",
    "focus",
    "toBeVisible",
    "toBeHidden",
    "toHaveText",
  ];

  if (t === "select") {
    return ["selectOption", ...baseActions];
  }
  if (t === "input") {
    if (typ === "checkbox" || typ === "radio") {
      return ["check", "uncheck", ...baseActions];
    }
    return ["fill", "type", ...baseActions];
  }
  if (t === "textarea") {
    return ["fill", "type", ...baseActions];
  }
  return baseActions;
};

const getPlaywrightSnippet = (action: string, locator: string): string => {
  switch (action) {
    case "click":
      return `await ${locator}.click();`;
    case "fill":
      return `await ${locator}.fill('text');`;
    case "type":
      return `await ${locator}.pressSequentially('text');`;
    case "hover":
      return `await ${locator}.hover();`;
    case "focus":
      return `await ${locator}.focus();`;
    case "check":
      return `await ${locator}.check();`;
    case "uncheck":
      return `await ${locator}.uncheck();`;
    case "selectOption":
      return `await ${locator}.selectOption('value');`;
    case "dblclick":
      return `await ${locator}.dblclick();`;
    case "toBeVisible":
      return `await expect(${locator}).toBeVisible();`;
    case "toBeHidden":
      return `await expect(${locator}).toBeHidden();`;
    case "toHaveText":
      return `await expect(${locator}).toHaveText('value');`;
    case "toHaveValue":
      return `await expect(${locator}).toHaveValue('value');`;
    default:
      return `await ${locator}.click();`;
  }
};

const colorizePlaywright = (locator: string): React.ReactNode => {
  const tokenRegex =
    /('(?:\\'|[^'])*'|"(?:\\"|[^"])*"|\bpage\b|\bgetBy[a-zA-Z]+\b|\blocator\b|\bname\b|\{|\}|\(|\)|:|,)/g;
  const tokens = locator.split(tokenRegex);
  return tokens.map((token, idx) => {
    if (!token) return null;
    let color = "#d4d4d4";
    if (token.startsWith("'") || token.startsWith('"')) {
      color = "#ce9178"; // string
    } else if (token === "page") {
      color = "#9cdcfe"; // object variable
    } else if (token.startsWith("getBy") || token === "locator") {
      color = "#dcdcaa"; // function name
    } else if (token === "name") {
      color = "#9cdcfe"; // property key
    } else if (["{", "}", "(", ")"].includes(token)) {
      color = "#ffd700"; // brackets
    } else if ([":", ","].includes(token)) {
      color = "#b5cea8"; // operators/separators
    }
    return (
      <span key={idx} style={{ color }}>
        {token}
      </span>
    );
  });
};

const PanelApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(1);

  // Recorder states
  const [recordedSteps, setRecordedSteps] = useState<any[]>([]);
  const [isRecordingActive, setIsRecordingActive] = useState<boolean>(false);
  const [recordingUrl, setRecordingUrl] = useState<string>("");
  const [templates, setTemplates] = useState<ChromeStorageResult>({});

  const [selectedElement, setSelectedElement] =
    useState<SelectedElement | null>(null);

  // Axes states
  const [axesData, setAxesData] = useState<AxesData | null>(null);
  const [selectedSrc, setSelectedSrc] = useState<string>("");
  const [selectedDst, setSelectedDst] = useState<string>("");
  const [axesXPathResult, setAxesXPathResult] = useState<string>("");

  // Tools states
  const [searchVal, setSearchVal] = useState<string>("");
  const [searchResult, setSearchResult] = useState<{
    xpath: string;
    count: number;
  } | null>(null);
  const [convertVal, setConvertVal] = useState<string>("");
  const [convertResult, setConvertResult] = useState<string | null>(null);

  // Settings & toast
  const [toast, setToast] = useState<string | null>(null);
  const [langID, setLangID] = useState<string>("playwrightJS");
  const [selectedFrameId, setSelectedFrameId] = useState<number | undefined>(
    undefined,
  );
  const [registeredFrameIds, setRegisteredFrameIds] = useState<Set<number>>(
    new Set(),
  );
  const frameSearchResults = useRef<
    Map<number, { xpath: string; count: number }>
  >(new Map());
  const searchValRef = useRef<string>("");

  const addFrameId = (frameId: number) => {
    setRegisteredFrameIds((prev) => {
      if (prev.has(frameId)) return prev;
      const next = new Set(prev);
      next.add(frameId);
      return next;
    });
  };

  const removeFrameId = (frameId: number) => {
    setRegisteredFrameIds((prev) => {
      if (!prev.has(frameId)) return prev;
      const next = new Set(prev);
      next.delete(frameId);
      return next;
    });
  };

  const handleStartRecording = () => {
    if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTabObj = tabs[0];
        const url = activeTabObj?.url || "";
        setRecordingUrl(url);
        setRecordedSteps([]);
        setIsRecordingActive(true);
        chrome.storage.local.set(
          {
            isRecordingActive: true,
            recordedSteps: [],
            recordingUrl: url,
          },
          () => {
            sendMessageToCS({ request: "start_recording" });
          },
        );
      });
    } else {
      const url = window.location.href;
      setRecordingUrl(url);
      setRecordedSteps([]);
      setIsRecordingActive(true);
      localStorage.setItem("isRecordingActive", "true");
      localStorage.setItem("recordedSteps", JSON.stringify([]));
      localStorage.setItem("recordingUrl", url);
      console.log("Mock started recording");
    }
  };

  const handleStopRecording = () => {
    setIsRecordingActive(false);
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.set({ isRecordingActive: false }, () => {
        sendMessageToCS({ request: "stop_recording" });
      });
    } else {
      localStorage.setItem("isRecordingActive", "false");
      console.log("Mock stopped recording");
    }
  };

  const handleClearRecording = () => {
    setRecordedSteps([]);
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.set({ recordedSteps: [] });
    } else {
      localStorage.setItem("recordedSteps", JSON.stringify([]));
    }
  };

  const handleDownloadScript = (code: string, currentLang: string) => {
    let filename = "recorded_test.js";
    let mimeType = "text/javascript";
    if (currentLang === "playwrightJS") {
      filename = "recorded_test.spec.js";
    } else if (currentLang === "playwrightJava" || currentLang === "javas") {
      filename = "RecordedTest.java";
      mimeType = "text/x-java-source";
    } else if (currentLang === "py") {
      filename = "recorded_test.py";
      mimeType = "text/x-python";
    } else if (currentLang === "csharp") {
      filename = "RecordedTest.cs";
      mimeType = "text/plain";
    }

    const blob = new Blob([code], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToast("Script downloaded successfully!");
    setTimeout(() => setToast(null), 3000);
  };

  const generateRecordedScript = (
    steps: any[],
    initialUrl: string,
    currentLang: string,
  ): string => {
    const formattedSteps = steps
      .map((step) => {
        if (currentLang === "playwrightJS") {
          const locator = step.playwrightLocator;
          const call = locator.startsWith("page.")
            ? locator
            : `page.locator('${locator}')`;
          if (step.action === "click") {
            return `  await ${call}.click();`;
          } else if (step.action === "fill") {
            return `  await ${call}.fill('${step.value || ""}');`;
          } else if (step.action === "select") {
            return `  await ${call}.selectOption('${step.value || ""}');`;
          }
        } else if (currentLang === "playwrightJava") {
          const locator = step.playwrightLocator;
          const call = locator.startsWith("page.")
            ? locator
            : `page.locator("${locator}")`;
          if (step.action === "click") {
            return `    ${call}.click();`;
          } else if (step.action === "fill") {
            return `    ${call}.fill("${step.value || ""}");`;
          } else if (step.action === "select") {
            return `    ${call}.selectOption("${step.value || ""}");`;
          }
        } else if (currentLang === "javas") {
          const xpath = step.xpathLocator;
          if (step.action === "click") {
            return `    driver.findElement(By.xpath("${xpath}")).click();`;
          } else if (step.action === "fill") {
            return `    driver.findElement(By.xpath("${xpath}")).sendKeys("${step.value || ""}");`;
          } else if (step.action === "select") {
            return `    new Select(driver.findElement(By.xpath("${xpath}"))).selectByValue("${step.value || ""}");`;
          }
        } else if (currentLang === "py") {
          const xpath = step.xpathLocator;
          if (step.action === "click") {
            return `    driver.find_element(By.XPATH, "${xpath}").click()`;
          } else if (step.action === "fill") {
            return `    driver.find_element(By.XPATH, "${xpath}").send_keys("${step.value || ""}")`;
          } else if (step.action === "select") {
            return `    Select(driver.find_element(By.XPATH, "${xpath}")).select_by_value("${step.value || ""}")`;
          }
        } else if (currentLang === "csharp") {
          const xpath = step.xpathLocator;
          if (step.action === "click") {
            return `    driver.FindElement(By.XPath("${xpath}")).Click();`;
          } else if (step.action === "fill") {
            return `    driver.FindElement(By.XPath("${xpath}")).SendKeys("${step.value || ""}");`;
          } else if (step.action === "select") {
            return `    new SelectElement(driver.FindElement(By.XPath("${xpath}"))).SelectByValue("${step.value || ""}");`;
          }
        } else if (currentLang === "protractorjs") {
          const xpath = step.xpathLocator;
          if (step.action === "click") {
            return `    await element(by.xpath('${xpath}')).click();`;
          } else if (step.action === "fill") {
            return `    await element(by.xpath('${xpath}')).sendKeys('${step.value || ""}');`;
          }
        } else if (currentLang === "custom") {
          const variable = step.variableName || "ele";
          const method = step.methodName || "ele";
          const xpath = step.xpathLocator;
          if (step.action === "click") {
            return (
              "    " +
              getCustomSnippet(
                "click",
                "XPath",
                xpath,
                variable,
                method,
                templates,
              )
            );
          } else {
            return (
              "    " +
              getCustomSnippet(
                "sendKeys",
                "XPath",
                xpath,
                variable,
                method,
                templates,
              ).replaceAll("${value}", step.value || "")
            );
          }
        }
        return "";
      })
      .filter((line) => line !== "")
      .join("\n");

    if (currentLang === "playwrightJS") {
      return `import { test, expect } from '@playwright/test';\n\ntest('recorded test', async ({ page }) => {\n  await page.goto('${initialUrl}');\n${formattedSteps}\n});`;
    } else if (currentLang === "playwrightJava") {
      return `import com.microsoft.playwright.*;\n\npublic class RecordedTest {\n  public static void main(String[] args) {\n    try (Playwright playwright = Playwright.create()) {\n      Browser browser = playwright.chromium().launch(new BrowserType.LaunchOptions().setHeadless(false));\n      Page page = browser.newPage();\n      page.navigate("${initialUrl}");\n${formattedSteps}\n    }\n  }\n}`;
    } else if (currentLang === "javas") {
      return `import org.openqa.selenium.By;\nimport org.openqa.selenium.WebDriver;\nimport org.openqa.selenium.chrome.ChromeDriver;\nimport org.openqa.selenium.support.ui.Select;\n\npublic class RecordedTest {\n  public static void main(String[] args) {\n    WebDriver driver = new ChromeDriver();\n    driver.get("${initialUrl}");\n${formattedSteps}\n    driver.quit();\n  }\n}`;
    } else if (currentLang === "py") {
      return `from selenium import webdriver\nfrom selenium.webdriver.common.by import By\nfrom selenium.webdriver.support.ui import Select\n\ndriver = webdriver.Chrome()\ndriver.get("${initialUrl}")\n${formattedSteps}\ndriver.quit()`;
    } else if (currentLang === "csharp") {
      return `using OpenQA.Selenium;\nusing OpenQA.Selenium.Chrome;\nusing OpenQA.Selenium.Support.UI;\n\nclass RecordedTest {\n  static void Main() {\n    IWebDriver driver = new ChromeDriver();\n    driver.Navigate().GoToUrl("${initialUrl}");\n${formattedSteps}\n    driver.Quit();\n  }\n}`;
    } else if (currentLang === "protractorjs") {
      return `import { browser, element, by } from 'protractor';\n\ndescribe('Recorded Test', () => {\n  it('should execute recorded actions', async () => {\n    await browser.get('${initialUrl}');\n${formattedSteps}\n  });\n});`;
    } else if (currentLang === "custom") {
      return `// Custom Framework Recorded Script\n// Start URL: ${initialUrl}\n\n${formattedSteps}`;
    }
    return formattedSteps;
  };

  const handleTabChange = (tabIndex: number) => {
    setActiveTab(tabIndex);
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.set({ activeTab: tabIndex });
    } else {
      localStorage.setItem("activeTab", String(tabIndex));
    }
  };

  const tabId =
    typeof chrome !== "undefined" &&
    chrome.devtools &&
    chrome.devtools.inspectedWindow
      ? chrome.devtools.inspectedWindow.tabId
      : null;

  const sendMessageToCS = (msg: any) => {
    if (tabId && typeof chrome !== "undefined" && chrome.tabs) {
      if (registeredFrameIds.size > 0) {
        registeredFrameIds.forEach((frameId) => {
          (chrome.tabs.sendMessage(tabId, msg, { frameId }) as any)?.catch(
            (err: any) => {
              console.warn(`Message send failed to frame ${frameId}:`, err);
              removeFrameId(frameId);
            },
          );
        });
      } else {
        const options =
          selectedFrameId !== undefined ? { frameId: selectedFrameId } : {};
        (chrome.tabs.sendMessage(tabId, msg, options) as any)?.catch(
          (err: any) => console.warn("Message send failed:", err),
        );
      }
    } else {
      console.log("Mock Send to Content Script:", msg);
    }
  };

  useEffect(() => {
    // Message Listener
    const listener = (
      req: DevToolsMessageRequest,
      _sender: any,
      sendResponse: (r: string) => void,
    ) => {
      // Hide active toast on new messages
      setToast(null);

      try {
        switch (req.request) {
          case "register_frame":
            if (_sender && _sender.frameId !== undefined) {
              addFrameId(_sender.frameId);
            }
            break;
          case "send_to_dev":
            if (_sender && _sender.frameId !== undefined) {
              setSelectedFrameId(_sender.frameId);
              addFrameId(_sender.frameId);
            }
            if (
              req.xpathid &&
              req.cssPath &&
              req.tag !== undefined &&
              req.type !== undefined
            ) {
              setSelectedElement({
                xpathid: req.xpathid,
                cssPath: req.cssPath,
                tag: req.tag,
                type: req.type,
                variablename: req.variablename,
                methodname: req.methodname,
                webtabledetails: req.webtabledetails,
                attributes: req.attributes,
                text: req.text,
                labelText: req.labelText,
                playwrightLocators: req.playwrightLocators,
                cypressLocators: req.cypressLocators,
              });
            }
            break;
          case "anchor":
            if (_sender && _sender.frameId !== undefined) {
              setSelectedFrameId(_sender.frameId);
              addFrameId(_sender.frameId);
            }
            if (req.data) {
              setAxesData(req.data);
              if (req.data.src && req.data.src.length > 0)
                setSelectedSrc(req.data.src[0][1]);
              if (req.data.dst && req.data.dst.length > 0)
                setSelectedDst(req.data.dst[0][1]);
              setAxesXPathResult(req.data.defaultXPath);
              handleTabChange(3); // Switch to Axes panel
            }
            break;
          case "axes":
            if (req.data) setAxesXPathResult(req.data);
            break;
          case "customSearchResult":
            if (req.data && _sender && _sender.frameId !== undefined) {
              frameSearchResults.current.set(_sender.frameId, req.data);

              let totalCount = 0;
              let bestXPath = "";
              frameSearchResults.current.forEach((res) => {
                totalCount += res.count;
                if (res.count > 0) {
                  bestXPath = res.xpath;
                }
              });

              const locatorVal = searchValRef.current || "";
              const locatorType =
                locatorVal.includes("getBy") ||
                locatorVal.includes("locator(") ||
                locatorVal.startsWith("page.")
                  ? "Playwright"
                  : locatorVal.startsWith("/") || locatorVal.startsWith("(")
                    ? "XPath"
                    : "CSS";

              const status =
                totalCount > 0
                  ? bestXPath || `${locatorType} found`
                  : `Wrong ${locatorType}`;

              setSearchResult({
                xpath: status,
                count: totalCount,
              });
              setToast(`${status}: ${totalCount} element(s) matched`);
              setTimeout(() => setToast(null), 3000);
            }
            break;
          case "record_step":
            if (req.step) {
              setRecordedSteps((prev) => {
                if (prev.some((s) => s.id === req.step.id)) return prev;
                return [...prev, req.step];
              });
            }
            break;
          case "conversion":
            if (req.output !== undefined) setConvertResult(req.output);
            break;
          default:
            break;
        }
        if (sendResponse) sendResponse("completed");
      } catch (err) {
        console.error("Error handling background message:", err);
      }
    };

    if (
      typeof chrome !== "undefined" &&
      chrome.runtime &&
      chrome.runtime.onMessage
    ) {
      chrome.runtime.onMessage.addListener(listener);
    }

    return () => {
      if (
        typeof chrome !== "undefined" &&
        chrome.runtime &&
        chrome.runtime.onMessage
      ) {
        chrome.runtime.onMessage.removeListener(listener);
      }
    };
  }, []);

  useEffect(() => {
    // Inject animation styles for recorder red dot
    const styleEl = document.createElement("style");
    styleEl.innerHTML = `
      @keyframes pulseRed {
        0% {
          transform: scale(0.95);
          box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
        }
        70% {
          transform: scale(1);
          box-shadow: 0 0 0 5px rgba(239, 68, 68, 0);
        }
        100% {
          transform: scale(0.95);
          box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
        }
      }
      .pulse-red-dot {
        animation: pulseRed 1.5s infinite;
      }
    `;
    document.head.appendChild(styleEl);

    const loadSettings = () => {
      if (
        typeof chrome !== "undefined" &&
        chrome.storage &&
        chrome.storage.local
      ) {
        chrome.storage.local.get(
          [
            "langID",
            "activeTab",
            "isRecordingActive",
            "recordedSteps",
            "recordingUrl",
            "customLang",
            "clickvalue",
            "sendvalue",
            "textvalue",
            "attrvalue",
          ],
          (result) => {
            if (result.langID) setLangID(result.langID);
            if (result.activeTab) setActiveTab(result.activeTab);
            if (result.isRecordingActive !== undefined)
              setIsRecordingActive(result.isRecordingActive);
            if (result.recordedSteps) setRecordedSteps(result.recordedSteps);
            if (result.recordingUrl) setRecordingUrl(result.recordingUrl);
            setTemplates(result);
          },
        );
      } else {
        const localLang = localStorage.getItem("langID");
        if (localLang) setLangID(localLang);
        const localTab = localStorage.getItem("activeTab");
        if (localTab) setActiveTab(Number(localTab));
        const localRecordingActive =
          localStorage.getItem("isRecordingActive") === "true";
        setIsRecordingActive(localRecordingActive);
        const localRecordedSteps = JSON.parse(
          localStorage.getItem("recordedSteps") || "[]",
        );
        setRecordedSteps(localRecordedSteps);
        const localRecordingUrl = localStorage.getItem("recordingUrl") || "";
        setRecordingUrl(localRecordingUrl);
        const localTemplates: ChromeStorageResult = {
          customLang:
            (localStorage.getItem("customLang") as "jscs" | "javacs") ||
            "javacs",
          clickvalue: localStorage.getItem("clickvalue") || "",
          sendvalue: localStorage.getItem("sendvalue") || "",
          textvalue: localStorage.getItem("textvalue") || "",
          attrvalue: localStorage.getItem("attrvalue") || "",
        };
        setTemplates(localTemplates);
      }
    };
    loadSettings();
    const storageListener = (changes: any) => {
      if (changes.langID) {
        setLangID(changes.langID.newValue);
      }
      if (changes.activeTab) {
        setActiveTab(changes.activeTab.newValue);
      }
      if (changes.isRecordingActive) {
        setIsRecordingActive(changes.isRecordingActive.newValue);
      }
      if (changes.recordedSteps) {
        setRecordedSteps(changes.recordedSteps.newValue || []);
      }
      if (changes.recordingUrl) {
        setRecordingUrl(changes.recordingUrl.newValue || "");
      }
      setTemplates((prev) => {
        const next = { ...prev };
        if (changes.customLang) next.customLang = changes.customLang.newValue;
        if (changes.clickvalue) next.clickvalue = changes.clickvalue.newValue;
        if (changes.sendvalue) next.sendvalue = changes.sendvalue.newValue;
        if (changes.textvalue) next.textvalue = changes.textvalue.newValue;
        if (changes.attrvalue) next.attrvalue = changes.attrvalue.newValue;
        return next;
      });
    };
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.onChanged
    ) {
      chrome.storage.onChanged.addListener(storageListener);
    }
    return () => {
      document.head.removeChild(styleEl);
      if (
        typeof chrome !== "undefined" &&
        chrome.storage &&
        chrome.storage.onChanged
      ) {
        chrome.storage.onChanged.removeListener(storageListener);
      }
    };
  }, []);

  const getPlaywrightLanguageForLangID = (
    lang: string,
  ): "javascript" | "python" | "java" | "csharp" => {
    if (lang === "playwrightJS" || lang === "protractorjs") return "javascript";
    if (lang === "playwrightJava" || lang === "javas") return "java";
    if (lang === "py") return "python";
    if (lang === "csharp") return "csharp";
    return "javascript";
  };

  // Update dynamic Axes result when selections change
  useEffect(() => {
    if (axesData && selectedSrc && selectedDst) {
      const parentExpr = `//${selectedSrc}${axesData.proOrFol}${selectedDst}`;
      sendMessageToCS({
        request: "parseAxes",
        data: parentExpr,
      });
    }
  }, [selectedSrc, selectedDst]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const copyToClipboard = (text: string, label = "Copied to clipboard!") => {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "absolute";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    try {
      const successful = document.execCommand("copy");
      if (successful) {
        showToast(label);
      } else {
        console.warn("Copy command was unsuccessful");
      }
    } catch (err) {
      console.error("Copy failed:", err);
    }
    document.body.removeChild(el);
  };

  // Snippet Builders
  const getSeleniumJava = (codeType: string, val: string): string => {
    switch (codeType) {
      case "CSS":
        return `driver.findElement(By.cssSelector("${val}"))`;
      case "Unique Class Atrribute":
        return `driver.findElement(By.className("${val}"))`;
      case "Unique TagName":
        return `driver.findElement(By.tagName("${val}"))`;
      case "Link Text":
        return `driver.findElement(By.linkText("${val}"))`;
      case "Unique ID":
        return `driver.findElement(By.id("${val}"))`;
      case "Unique Name":
        return `driver.findElement(By.name("${val}"))`;
      case "Unique PartialLinkText":
        return `driver.findElement(By.partialLinkText("${val}"))`;
      default:
        return `driver.findElement(By.xpath("${val}"))`;
    }
  };

  const getPlaywrightJava = (codeType: string, val: string): string => {
    switch (codeType) {
      case "CSS":
        return `page.locator("${val}")`;
      case "Unique Class Atrribute":
        return `page.locator(".${val}")`;
      case "Unique TagName":
        return `page.locator("${val}")`;
      case "Link Text":
        return `page.locator("'${val}'")`;
      case "Unique ID":
        return `page.locator("id=${val}")`;
      case "Unique Name":
        return `page.locator("[name='${val}']")`;
      case "Unique PartialLinkText":
        return `page.locator("a:has-text('${val}'")`;
      default:
        return `page.locator("${val}")`;
    }
  };

  const getPlaywrightJS = (codeType: string, val: string): string => {
    switch (codeType) {
      case "CSS":
        return `await page.locator("${val}")`;
      case "Unique Class Atrribute":
        return `await page.locator(".${val}")`;
      case "Unique TagName":
        return `await page.locator("${val}")`;
      case "Link Text":
        return `await page.locator("'${val}'")`;
      case "Unique ID":
        return `await page.locator("id=${val}")`;
      case "Unique Name":
        return `await page.locator("[name='${val}']")`;
      case "Unique PartialLinkText":
        return `await page.locator("a:has-text('${val}'")`;
      default:
        return `await page.locator("${val}")`;
    }
  };

  const getProtractor = (codeType: string, val: string): string => {
    switch (codeType) {
      case "CSS":
        return `element(by.css("${val}"))`;
      case "Unique Class Atrribute":
        return `element(by.className("${val}"))`;
      case "Unique TagName":
        return `element(by.tagName("${val}"))`;
      case "Link Text":
        return `element(by.linkText("${val}"))`;
      case "Unique ID":
        return `element(by.id("${val}"))`;
      case "Unique Name":
        return `element(by.name("${val}"))`;
      case "Unique PartialLinkText":
        return `element(by.partialLinkText("${val}"))`;
      default:
        return `element(by.xpath("${val}"))`;
    }
  };

  const getSeleniumPython = (codeType: string, val: string): string => {
    switch (codeType) {
      case "CSS":
        return `driver.find_element(by=By.CSS_SELECTOR, value="${val}")`;
      case "Unique Class Atrribute":
        return `driver.find_element(by=By.CLASS_NAME, value="${val}")`;
      case "Unique TagName":
        return `driver.find_element(by=By.TAG_NAME, value="${val}")`;
      case "Link Text":
        return `driver.find_element(by=By.LINK_TEXT, value="${val}")`;
      case "Unique ID":
        return `driver.find_element(by=By.ID, value="${val}")`;
      case "Unique Name":
        return `driver.find_element(by=By.NAME, value="${val}")`;
      case "Unique PartialLinkText":
        return `driver.find_element(by=By.PARTIAL_LINK_TEXT, value="${val}")`;
      default:
        return `driver.find_element(by=By.XPATH, value="${val}")`;
    }
  };

  const getCustomSnippet = (
    actionType: string,
    codeType: string,
    val: string,
    variable: string,
    method: string,
    templates: ChromeStorageResult,
  ): string => {
    let locatorValue = "";
    const customLang = templates.customLang || "javacs";

    if (customLang === "jscs") {
      locatorValue = getProtractor(codeType, val);
    } else {
      switch (codeType) {
        case "CSS":
          locatorValue = `@FindBy(css = "${val}")\n`;
          break;
        case "Unique Class Atrribute":
          locatorValue = `@FindBy(className = "${val}")\n`;
          break;
        case "Unique TagName":
          locatorValue = `@FindBy(tagName = "${val}")\n`;
          break;
        case "Link Text":
          locatorValue = `@FindBy(linkText = "${val}")\n`;
          break;
        case "Unique ID":
          locatorValue = `@FindBy(id = "${val}")\n`;
          break;
        case "Unique Name":
          locatorValue = `@FindBy(name = "${val}")\n`;
          break;
        case "Unique PartialLinkText":
          locatorValue = `@FindBy(partialLinkText = "${val}")\n`;
          break;
        default:
          locatorValue = `@FindBy(xpath = "${val}")\n`;
          break;
      }
    }

    let template = "";
    switch (actionType) {
      case "click":
        template =
          templates.clickvalue !== undefined && templates.clickvalue !== ""
            ? templates.clickvalue
            : DEFAULT_TEMPLATES[customLang].click;
        break;
      case "sendKeys":
        template =
          templates.sendvalue !== undefined && templates.sendvalue !== ""
            ? templates.sendvalue
            : DEFAULT_TEMPLATES[customLang].send;
        break;
      case "getText":
        template =
          templates.textvalue !== undefined && templates.textvalue !== ""
            ? templates.textvalue
            : DEFAULT_TEMPLATES[customLang].text;
        break;
      case "getAttribute":
        template =
          templates.attrvalue !== undefined && templates.attrvalue !== ""
            ? templates.attrvalue
            : DEFAULT_TEMPLATES[customLang].attr;
        break;
      default:
        return "";
    }

    let result = template;
    if (result.includes("${lc}"))
      result = result.replaceAll("${lc}", locatorValue);
    if (result.includes("${vn}")) result = result.replaceAll("${vn}", variable);
    if (result.includes("${mn}")) result = result.replaceAll("${mn}", method);

    return result.trim();
  };

  const getSnippetCode = (
    actionType: string,
    codeType: string,
    val: string,
    variable: string,
    method: string,
    lang: string,
    templates: ChromeStorageResult,
  ): string => {
    let str = "";
    switch (lang) {
      case "playwrightJS":
        str = getPlaywrightJS(codeType, val);
        break;
      case "playwrightJava":
        str = getPlaywrightJava(codeType, val);
        break;
      case "javas":
        str = getSeleniumJava(codeType, val);
        break;
      case "py":
        str = getSeleniumPython(codeType, val);
        break;
      case "csharp":
        str = getSeleniumJava(codeType, val);
        break; // maps similarly
      case "protractorjs":
        str = getProtractor(codeType, val);
        break;
      case "custom":
        return getCustomSnippet(
          actionType,
          codeType,
          val,
          variable,
          method,
          templates,
        );
      default:
        str = getSeleniumJava(codeType, val);
        break;
    }

    switch (actionType) {
      case "click":
        str += ".click();";
        break;
      case "sendKeys":
        str += lang.startsWith("playwright")
          ? '.fill("");'
          : lang === "py"
            ? '.send_keys("")'
            : '.sendKeys("");';
        break;
      case "getAttribute":
        str += lang.startsWith("playwright")
          ? '.getAttribute("value");'
          : lang === "py"
            ? '.get_attribute("value")'
            : '.getAttribute("value");';
        break;
      case "getText":
        str += lang.startsWith("playwright")
          ? ".textContent();"
          : lang === "py"
            ? ".get_text()"
            : ".getText();";
        break;
      default:
        break;
    }
    return str;
  };

  const handleActionSelect = (
    e: React.ChangeEvent<HTMLSelectElement>,
    codeType: string,
    val: string,
  ) => {
    const action = e.target.value;
    if (action === "snippet") return;

    const varName = selectedElement
      ? selectedElement.variablename || "ele"
      : "ele";
    const methName = selectedElement
      ? selectedElement.methodname || "ele"
      : "ele";

    const copyProcess = (lang: string, templates: ChromeStorageResult) => {
      const code = getSnippetCode(
        action,
        codeType,
        val,
        varName,
        methName,
        lang,
        templates,
      );
      copyToClipboard(code, `Snippet (${action}) copied to clipboard!`);
    };

    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.get(
        [
          "langID",
          "customLang",
          "clickvalue",
          "sendvalue",
          "textvalue",
          "attrvalue",
        ],
        (result: ChromeStorageResult) => {
          copyProcess(result.langID || "javas", result);
        },
      );
    } else {
      const localLang = localStorage.getItem("langID") || "javas";
      const localTemplates: ChromeStorageResult = {
        customLang:
          (localStorage.getItem("customLang") as "jscs" | "javacs") || "javacs",
        clickvalue: localStorage.getItem("clickvalue") || "",
        sendvalue: localStorage.getItem("sendvalue") || "",
        textvalue: localStorage.getItem("textvalue") || "",
        attrvalue: localStorage.getItem("attrvalue") || "",
      };
      copyProcess(localLang, localTemplates);
    }

    // Reset dropdown selection
    e.target.value = "snippet";
  };

  const handlePlaywrightActionSelect = (
    e: React.ChangeEvent<HTMLSelectElement>,
    locator: string,
  ) => {
    const action = e.target.value;
    if (action === "snippet") return;
    const code = getPlaywrightSnippet(action, locator);
    copyToClipboard(code, "Playwright snippet copied!");
    e.target.value = "snippet";
  };

  const getActionsForTag = (tag: string, inputType: string): string[] => {
    if (tag === "textarea") return ACTION_LABELS.textarea;
    if (tag === "input") {
      if (["submit", "radio", "checkbox"].includes(inputType)) {
        return ACTION_LABELS.input.click;
      }
      return ACTION_LABELS.input.send;
    }
    if (tag === "img") return ACTION_LABELS.img;
    return ACTION_LABELS.default;
  };

  // Open Options page
  const handleOpenSettings = () => {
    if (
      typeof chrome !== "undefined" &&
      chrome.runtime &&
      chrome.runtime.openOptionsPage
    ) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open("../option/option.html", "_blank");
    }
  };

  // Custom Search triggers
  const handleCustomSearch = () => {
    if (searchVal.length > 0) {
      searchValRef.current = searchVal;
      frameSearchResults.current.clear();
      sendMessageToCS({ request: "cleanhighlight" });
      sendMessageToCS({ request: "userSearchXP", data: searchVal });
    }
  };

  const handleVerifyLocator = (locator: string) => {
    setSearchVal(locator);
    searchValRef.current = locator;
    frameSearchResults.current.clear();
    sendMessageToCS({ request: "cleanhighlight" });
    sendMessageToCS({ request: "userSearchXP", data: locator });
  };

  const handleClearHighlight = () => {
    setSearchVal("");
    searchValRef.current = "";
    frameSearchResults.current.clear();
    setSearchResult(null);
    sendMessageToCS({ request: "cleanhighlight" });
  };

  // Selector convertor trigger
  const handleConvertXPath = () => {
    if (convertVal.length > 0) {
      sendMessageToCS({ request: "dotheconversion", data: convertVal });
    }
  };

  return (
    <div style={styles.appContainer}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* Custom scrollbar for dark mode panel */
        ::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        ::-webkit-scrollbar-track {
          background: #181a1b;
        }
        ::-webkit-scrollbar-thumb {
          background: #37373d;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #464649;
        }
        /* Custom styling overrides for inputs and selectors */
        select.form-select {
          appearance: auto !important;
          -webkit-appearance: auto !important;
          background: #252526 !important;
          border: 1px solid #3c3c3c !important;
          color: #cccccc !important;
          padding: 1px 2px !important;
          font-size: 10px !important;
          height: 18px !important;
          border-radius: 2px !important;
        }
        input.form-input::placeholder {
          color: #555;
        }

        /* About Tab interactive styling */
        .about-link-item {
          color: #3794ff;
          text-decoration: none;
          transition: color 0.2s ease, text-decoration 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .about-link-item:hover {
          color: #58a6ff;
          text-decoration: underline;
        }
        .social-svg-icon {
          fill: #858585;
          transition: fill 0.2s ease, transform 0.2s ease;
          cursor: pointer;
        }
        .social-svg-icon:hover {
          transform: translateY(-1px);
        }
        .social-svg-icon.youtube:hover {
          fill: #ff0000;
        }
        .social-svg-icon.github:hover {
          fill: #ffffff;
        }
        .social-svg-icon.linkedin:hover {
          fill: #0077b5;
        }
        .social-svg-icon.globe:hover {
          fill: #4ade80;
        }
        .social-svg-icon.star:hover {
          fill: #ffb700;
        }
        .qr-wrapper {
          position: relative;
          display: inline-block;
          cursor: zoom-in;
          margin-top: 4px;
        }
        .qr-image {
          width: 40px;
          height: 40px;
          border: 1px solid #3c3c3c;
          border-radius: 4px;
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease, border-color 0.25s ease;
          transform-origin: bottom right;
          z-index: 10;
          position: relative;
        }
        .qr-wrapper:hover .qr-image {
          transform: scale(4.5);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.9);
          border-color: #3794ff;
          z-index: 99999;
        }
        .upi-copy-badge {
          background-color: #2b2b2b;
          border: 1px solid #3c3c3c;
          border-radius: 4px;
          padding: 3px 6px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #4ade80;
          font-family: Consolas, Monaco, monospace;
          font-size: 10px;
          cursor: pointer;
          transition: background-color 0.2s, border-color 0.2s;
        }
        .upi-copy-badge:hover {
          background-color: #353535;
          border-color: #4ade80;
        }
        .product-item {
          background-color: #1e1e1e;
          border: 1px solid #2d2d2d;
          border-radius: 4px;
          padding: 6px 8px;
          transition: border-color 0.2s, background-color 0.2s;
          text-decoration: none;
          color: #cccccc;
          display: block;
          margin-bottom: 4px;
        }
        .product-item:hover {
          border-color: #3794ff;
          background-color: #252526;
          color: #ffffff;
        }
      `,
        }}
      />

      {toast && (
        <div style={styles.toast}>
          <span>{toast}</span>
        </div>
      )}

      {/* Tab Navigation header */}
      <div style={styles.navBar}>
        <ul style={styles.tabsList}>
          <li style={styles.tabItem} onClick={() => handleTabChange(1)}>
            <span style={activeTab === 1 ? styles.activeLink : styles.link}>
              XPath
            </span>
          </li>
          <li style={styles.tabItem} onClick={() => handleTabChange(2)}>
            <span style={activeTab === 2 ? styles.activeLink : styles.link}>
              CSS
            </span>
          </li>
          <li style={styles.tabItem} onClick={() => handleTabChange(3)}>
            <span style={activeTab === 3 ? styles.activeLink : styles.link}>
              Axes
            </span>
          </li>
          <li style={styles.tabItem} onClick={() => handleTabChange(4)}>
            <span style={activeTab === 4 ? styles.activeLink : styles.link}>
              Playwright
            </span>
          </li>
          <li style={styles.tabItem} onClick={() => handleTabChange(5)}>
            <span style={activeTab === 5 ? styles.activeLink : styles.link}>
              Cypress
            </span>
          </li>
          <li style={styles.tabItem} onClick={() => handleTabChange(6)}>
            <span style={activeTab === 6 ? styles.activeLink : styles.link}>
              Recorder
            </span>
          </li>
          <li style={styles.tabItem} onClick={() => handleTabChange(7)}>
            <span style={activeTab === 7 ? styles.activeLink : styles.link}>
              Tools
            </span>
          </li>
          <li style={styles.tabItem} onClick={() => handleTabChange(8)}>
            <span style={activeTab === 8 ? styles.activeLink : styles.link}>
              About
            </span>
          </li>
        </ul>
        <div
          style={styles.settingsBtn}
          onClick={handleOpenSettings}
          title="Settings"
        >
          ⚙
        </div>
      </div>

      {/* Main Containers */}
      <div style={styles.contentBody}>
        {/* XPath Tab */}
        {activeTab === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {!selectedElement ||
            !selectedElement.xpathid ||
            selectedElement.xpathid.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: "1.8rem", marginBottom: "4px" }}>
                  🔍
                </div>
                <div style={styles.emptyTitle}>
                  Select an element in Elements tab
                </div>
                <div style={styles.emptySubtitle}>
                  LetXPath will display optimized XPaths & action snippets here.
                </div>
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                {/* Table Info if inside table */}
                {selectedElement.webtabledetails && (
                  <div style={styles.tableCard}>
                    <div style={styles.tableHeader}>
                      Table Detected (
                      {selectedElement.webtabledetails.totalTables} total)
                    </div>
                    <div style={styles.tableRow}>
                      <span style={styles.tableLabel}>Table XPath:</span>
                      <code
                        style={styles.tableCode}
                        title="Click to copy Table Locator"
                        onClick={() =>
                          copyToClipboard(
                            selectedElement.webtabledetails!.tableLocator,
                            "Table Locator copied!",
                          )
                        }
                      >
                        {colorizeXPath(
                          selectedElement.webtabledetails.tableLocator,
                        )}
                      </code>
                    </div>
                    <div style={styles.tableRow}>
                      <span style={styles.tableLabel}>Selected Row XPath:</span>
                      <code
                        style={styles.tableCode}
                        title="Click to copy Row Locator"
                        onClick={() =>
                          copyToClipboard(
                            selectedElement.webtabledetails!.tableData,
                            "Row Locator copied!",
                          )
                        }
                      >
                        {colorizeXPath(
                          selectedElement.webtabledetails.tableData,
                        )}
                      </code>
                    </div>
                  </div>
                )}

                {/* XPaths list */}
                <div style={styles.locatorList}>
                  {selectedElement.xpathid.map((item, idx) => {
                    const [, label, value] = item;
                    return (
                      <div key={idx} style={styles.locatorRow}>
                        <div style={styles.labelBox}>
                          <span style={styles.locatorLabel} title={label}>
                            {label}
                          </span>
                        </div>
                        <code
                          style={styles.codeSnippet}
                          title="Click to copy locator"
                          onClick={() =>
                            copyToClipboard(value, "Locator copied!")
                          }
                        >
                          {colorizeXPath(value)}
                        </code>
                        <button
                          style={styles.btnVerifyInline}
                          onClick={() => handleVerifyLocator(value)}
                          title="Verify and highlight element"
                        >
                          Find
                        </button>
                        <select
                          className="form-select select-sm"
                          style={styles.actionSelect}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            handleActionSelect(e, label, value)
                          }
                          defaultValue="snippet"
                        >
                          <option value="snippet" disabled>
                            Snippet
                          </option>
                          {getActionsForTag(
                            selectedElement.tag,
                            selectedElement.type,
                          ).map(
                            (act) =>
                              act !== "snippet" && (
                                <option key={act} value={act}>
                                  {act}
                                </option>
                              ),
                          )}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CSS Tab */}
        {activeTab === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {!selectedElement ||
            !selectedElement.cssPath ||
            selectedElement.cssPath.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: "1.8rem", marginBottom: "4px" }}>
                  🎨
                </div>
                <div style={styles.emptyTitle}>
                  Select an element in Elements tab
                </div>
                <div style={styles.emptySubtitle}>
                  LetXPath will display optimized CSS selectors here.
                </div>
              </div>
            ) : (
              <div style={styles.locatorList}>
                {selectedElement.cssPath.map((item, idx) => {
                  const [, label, value] = item;
                  return (
                    <div key={idx} style={styles.locatorRow}>
                      <div style={styles.labelBox}>
                        <span style={styles.locatorLabel} title={label}>
                          {label}
                        </span>
                      </div>
                      <code
                        style={styles.codeSnippet}
                        title="Click to copy CSS"
                        onClick={() =>
                          copyToClipboard(value, "CSS Path copied!")
                        }
                      >
                        {colorizeCSS(value)}
                      </code>
                      <button
                        style={styles.btnVerifyInline}
                        onClick={() => handleVerifyLocator(value)}
                        title="Verify and highlight element"
                      >
                        Find
                      </button>
                      <select
                        className="form-select select-sm"
                        style={styles.actionSelect}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          handleActionSelect(e, "CSS", value)
                        }
                        defaultValue="snippet"
                      >
                        <option value="snippet" disabled>
                          Snippet
                        </option>
                        {getActionsForTag(
                          selectedElement.tag,
                          selectedElement.type,
                        ).map(
                          (act) =>
                            act !== "snippet" && (
                              <option key={act} value={act}>
                                {act}
                              </option>
                            ),
                        )}
                      </select>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Axes Tab */}
        {activeTab === 3 && (
          <div>
            {!axesData ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: "1.8rem", marginBottom: "4px" }}>
                  🔗
                </div>
                <div style={styles.emptyTitle}>Axes-based dynamic locator</div>
                <div style={styles.emptySubtitle}>
                  Right click on the page context menu and select{" "}
                  <strong>Parent Element</strong>, then{" "}
                  <strong>Child Element</strong>.
                </div>
              </div>
            ) : (
              <div style={styles.axesContainer}>
                <div style={styles.axesResultBox}>
                  <div
                    style={{
                      fontSize: "9px",
                      color: "#858585",
                      marginBottom: "2px",
                    }}
                  >
                    Resulting XPath:
                  </div>
                  <code
                    style={styles.axesResultCode}
                    title="Click to copy Axes XPath"
                    onClick={() =>
                      copyToClipboard(axesXPathResult, "Axes XPath copied!")
                    }
                  >
                    {colorizeXPath(axesXPathResult)}
                  </code>
                </div>

                <div style={styles.axesColumns}>
                  {/* Src elements */}
                  <div style={styles.axesColumn}>
                    <div style={styles.columnHeader}>Parent Locators</div>
                    {axesData.src.map((el, i) => (
                      <div key={i} style={styles.radioWrapper}>
                        <label className="form-radio" style={styles.radioLabel}>
                          <input
                            type="radio"
                            name="axesSrc"
                            value={el[1]}
                            checked={selectedSrc === el[1]}
                            onChange={() => setSelectedSrc(el[1])}
                          />
                          <i className="form-icon" style={{ top: "2px" }}></i>
                          <span
                            style={{
                              marginLeft: "4px",
                              verticalAlign: "middle",
                            }}
                          >
                            {i + 1}. {el[2]}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>

                  {/* Dst elements */}
                  <div style={styles.axesColumn}>
                    <div style={styles.columnHeader}>Child Locators</div>
                    {axesData.dst.map((el, i) => (
                      <div key={i} style={styles.radioWrapper}>
                        <label className="form-radio" style={styles.radioLabel}>
                          <input
                            type="radio"
                            name="axesDst"
                            value={el[1]}
                            checked={selectedDst === el[1]}
                            onChange={() => setSelectedDst(el[1])}
                          />
                          <i className="form-icon" style={{ top: "2px" }}></i>
                          <span
                            style={{
                              marginLeft: "4px",
                              verticalAlign: "middle",
                            }}
                          >
                            {i + 1}. {el[2]}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Playwright Tab */}
        {activeTab === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {!selectedElement || !selectedElement.tag ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: "1.8rem", marginBottom: "4px" }}>
                  🎭
                </div>
                <div style={styles.emptyTitle}>
                  Select an element in Elements tab
                </div>
                <div style={styles.emptySubtitle}>
                  LetXPath will display Playwright-recommended locators here.
                </div>
              </div>
            ) : (
              <div style={styles.locatorList}>
                {(selectedElement.playwrightLocators || []).map((loc, idx) => {
                  const [, label, jsVal, pyVal, javaVal, csVal] = loc;
                  const playLang = getPlaywrightLanguageForLangID(langID);
                  let value = jsVal;
                  if (playLang === "python") value = pyVal;
                  else if (playLang === "java") value = javaVal;
                  else if (playLang === "csharp") value = csVal;
                  return (
                    <div key={idx} style={styles.locatorRow}>
                      <div style={styles.labelBox}>
                        <span style={styles.locatorLabel} title={label}>
                          {label}
                        </span>
                      </div>
                      <code
                        style={styles.codeSnippet}
                        title="Click to copy Playwright Locator"
                        onClick={() =>
                          copyToClipboard(value, "Playwright locator copied!")
                        }
                      >
                        {colorizePlaywright(value)}
                      </code>
                      <button
                        style={styles.btnVerifyInline}
                        onClick={() => handleVerifyLocator(jsVal)}
                        title="Verify and highlight element"
                      >
                        Find
                      </button>
                      <select
                        className="form-select select-sm"
                        style={styles.actionSelect}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          handlePlaywrightActionSelect(e, jsVal)
                        }
                        defaultValue="snippet"
                      >
                        <option value="snippet" disabled>
                          Snippet
                        </option>
                        {getPlaywrightActions(
                          selectedElement.tag,
                          selectedElement.type,
                        ).map((act) => (
                          <option key={act} value={act}>
                            {act}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Cypress Tab */}
        {activeTab === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {!selectedElement || !selectedElement.cypressLocators || selectedElement.cypressLocators.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>🌲</div>
                <div style={styles.emptyTitle}>Select an element in Elements tab</div>
                <div style={styles.emptySubtitle}>LetXPath will display Cypress-recommended locators here.</div>
              </div>
            ) : (
              <div style={styles.locatorList}>
                {selectedElement.cypressLocators.map((item, idx) => {
                  const [, label, value] = item;
                  return (
                    <div key={idx} style={styles.locatorRow}>
                      <div style={styles.labelBox}>
                        <span style={styles.locatorLabel} title={label}>{label}</span>
                      </div>
                      <code 
                        style={styles.codeSnippet} 
                        title="Click to copy Cypress Locator" 
                        onClick={() => copyToClipboard(value, 'Cypress locator copied!')}
                      >
                        {colorizePlaywright(value)}
                      </code>
                      <button 
                        style={styles.btnVerifyInline}
                        onClick={() => handleVerifyLocator(value.match(/cy\.get\('([^']+)'\)/)?.[1] || value.match(/cy\.contains\('([^']+)'\)/)?.[1] || value)}
                        title="Verify and highlight element"
                      >
                        Find
                      </button>
                      <select 
                        className="form-select select-sm" 
                        style={styles.actionSelect}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                          const act = e.target.value;
                          if (act === 'snippet') return;
                          let code = value;
                          if (act === 'click') {
                            code = `${value}.click()`;
                          } else if (act === 'type') {
                            code = `${value}.type('text')`;
                          } else if (act === 'select') {
                            code = `${value}.select('value')`;
                          }
                          copyToClipboard(code, 'Cypress action snippet copied!');
                          e.target.value = 'snippet';
                        }}
                        defaultValue="snippet"
                      >
                        <option value="snippet" disabled>Snippet</option>
                        <option value="click">click</option>
                        <option value="type">type</option>
                        <option value="select">select</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Recorder Tab */}
        {activeTab === 6 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              height: "100%",
            }}
          >
            {/* Control Bar */}
            <div style={styles.toolCard}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  {isRecordingActive ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span
                        className="pulse-red-dot"
                        style={styles.pulseRedDot}
                      ></span>
                      <span style={{ color: "#ff4d4d", fontWeight: 600 }}>
                        Recording...
                      </span>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span style={styles.greenDot}></span>
                      <span style={{ color: "#4ade80", fontWeight: 600 }}>
                        Idle
                      </span>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                  {isRecordingActive ? (
                    <button
                      style={styles.btnStopRecord}
                      onClick={handleStopRecording}
                    >
                      Stop Recording
                    </button>
                  ) : (
                    <button
                      style={styles.btnStartRecord}
                      onClick={handleStartRecording}
                    >
                      Start Recording
                    </button>
                  )}
                  <button
                    style={styles.btnClear}
                    onClick={handleClearRecording}
                  >
                    Clear
                  </button>
                </div>
              </div>
              {recordingUrl && (
                <div
                  style={{
                    fontSize: "9px",
                    color: "#858585",
                    marginTop: "4px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  Start URL:{" "}
                  <a
                    href={recordingUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#3794ff" }}
                  >
                    {recordingUrl}
                  </a>
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: "8px",
                flex: 1,
                minHeight: "300px",
              }}
            >
              {/* Left Column: Recorded Steps list */}
              <div
                style={{
                  ...styles.toolCard,
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={styles.toolTitle}>
                  Recorded Steps ({recordedSteps.length})
                </div>
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    maxHeight: "350px",
                    marginTop: "6px",
                    border: "1px solid #2d2d2d",
                    borderRadius: "4px",
                    padding: "4px",
                    backgroundColor: "#141414",
                  }}
                >
                  {recordedSteps.length === 0 ? (
                    <div
                      style={{
                        color: "#555",
                        textAlign: "center",
                        marginTop: "40px",
                        fontSize: "10px",
                      }}
                    >
                      No actions recorded yet.
                      <br />
                      Start recording and click or type on the page elements.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      {recordedSteps.map((step, i) => (
                        <div
                          key={step.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "4px",
                            borderBottom: "1px solid #222",
                            gap: "6px",
                          }}
                        >
                          <span style={{ color: "#858585", fontSize: "9px" }}>
                            {i + 1}.
                          </span>
                          <span
                            style={{
                              fontSize: "9px",
                              fontWeight: 600,
                              padding: "1px 4px",
                              borderRadius: "3px",
                              backgroundColor:
                                step.action === "click" ? "#0e639c" : "#10b981",
                              color: "#fff",
                            }}
                          >
                            {step.action.toUpperCase()}
                          </span>
                          <span
                            style={{
                              color: "#eee",
                              fontFamily: "monospace",
                              fontSize: "9px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "100px",
                            }}
                            title={step.tag}
                          >
                            &lt;{step.tag}
                            {step.type ? ` type="${step.type}"` : ""}&gt;
                          </span>
                          {step.value && (
                            <span
                              style={{
                                color: "#ffaf3b",
                                fontSize: "9px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                maxWidth: "80px",
                              }}
                              title={step.value}
                            >
                              "{step.value}"
                            </span>
                          )}
                          <span
                            style={{
                              color: "#858585",
                              fontSize: "9px",
                              marginLeft: "auto",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "120px",
                            }}
                            title={step.playwrightLocator || step.xpathLocator}
                          >
                            {step.playwrightLocator || step.xpathLocator}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Generated Code Preview */}
              <div
                style={{
                  ...styles.toolCard,
                  flex: 1.2,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "6px",
                  }}
                >
                  <div style={styles.toolTitle}>Generated Script</div>
                  <select
                    className="form-select select-sm"
                    style={{
                      ...styles.actionSelect,
                      width: "130px",
                      margin: 0,
                    }}
                    value={langID}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      setLangID(e.target.value);
                      if (
                        typeof chrome !== "undefined" &&
                        chrome.storage &&
                        chrome.storage.local
                      ) {
                        chrome.storage.local.set({ langID: e.target.value });
                      } else {
                        localStorage.setItem("langID", e.target.value);
                      }
                    }}
                  >
                    <option value="javas">Selenium Java</option>
                    <option value="playwrightJS">Playwright - Node</option>
                    <option value="playwrightJava">Playwright - Java</option>
                    <option value="py">Selenium Python</option>
                    <option value="csharp">Selenium C#</option>
                    <option value="protractorjs">Protractor (Angular)</option>
                    <option value="custom">Custom Framework</option>
                  </select>
                </div>

                <div
                  style={{
                    flex: 1,
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <textarea
                    readOnly
                    value={generateRecordedScript(
                      recordedSteps,
                      recordingUrl,
                      langID,
                    )}
                    style={{
                      flex: 1,
                      backgroundColor: "#141414",
                      color: "#4ade80",
                      border: "1px solid #2d2d2d",
                      borderRadius: "4px",
                      padding: "6px",
                      fontFamily: "monospace",
                      fontSize: "9px",
                      resize: "none",
                      outline: "none",
                      minHeight: "260px",
                    }}
                  />
                  <div
                    style={{ display: "flex", gap: "4px", marginTop: "6px" }}
                  >
                    <button
                      style={{ ...styles.btnFind, flex: 1 }}
                      onClick={() =>
                        copyToClipboard(
                          generateRecordedScript(
                            recordedSteps,
                            recordingUrl,
                            langID,
                          ),
                          "Script copied to clipboard!",
                        )
                      }
                    >
                      Copy Script
                    </button>
                    <button
                      style={{ ...styles.btnClear, flex: 1 }}
                      onClick={() =>
                        handleDownloadScript(
                          generateRecordedScript(
                            recordedSteps,
                            recordingUrl,
                            langID,
                          ),
                          langID,
                        )
                      }
                    >
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tools Tab */}
        {activeTab === 7 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {/* Custom Search Box */}
            <div style={styles.toolCard}>
              <div style={styles.toolTitle}>Universal Locator Evaluator</div>
              <div style={styles.toolDesc}>
                Evaluate, test, and highlight XPaths, CSS, and Playwright
                locators.
              </div>
              <div
                style={{ display: "flex", gap: "4px", alignItems: "stretch" }}
              >
                <input
                  type="text"
                  className="form-input"
                  style={styles.toolInput}
                  placeholder="Type locator (e.g. //input, #id, or page.getByRole('button'))"
                  value={searchVal}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchVal(e.target.value)
                  }
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                    e.key === "Enter" && handleCustomSearch()
                  }
                />
                <button style={styles.btnFind} onClick={handleCustomSearch}>
                  Find
                </button>
                <button style={styles.btnClear} onClick={handleClearHighlight}>
                  Clear
                </button>
              </div>
              {searchResult && (
                <div
                  style={
                    searchResult.count > 0
                      ? styles.searchSuccess
                      : styles.searchFail
                  }
                >
                  Matched elements: <strong>{searchResult.count}</strong>
                </div>
              )}
            </div>

            {/* CSS Converter Box */}
            <div style={styles.toolCard}>
              <div style={styles.toolTitle}>XPath to CSS Converter</div>
              <div style={styles.toolDesc}>
                Convert standard XPath queries directly into CSS selectors
                (Beta).
              </div>
              <div
                style={{ display: "flex", gap: "4px", alignItems: "stretch" }}
              >
                <input
                  type="text"
                  className="form-input"
                  style={styles.toolInput}
                  placeholder="Enter XPath to convert"
                  value={convertVal}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setConvertVal(e.target.value)
                  }
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                    e.key === "Enter" && handleConvertXPath()
                  }
                />
                <button style={styles.btnFind} onClick={handleConvertXPath}>
                  Convert
                </button>
              </div>
              {convertResult && (
                <div style={styles.convertBox}>
                  <div
                    style={{
                      fontSize: "9px",
                      color: "#858585",
                      marginBottom: "2px",
                    }}
                  >
                    CSS Selector Output:
                  </div>
                  <code
                    style={styles.convertCode}
                    title="Click to copy CSS Selector"
                    onClick={() =>
                      copyToClipboard(convertResult, "Converted CSS copied!")
                    }
                  >
                    {colorizeCSS(convertResult)}
                  </code>
                </div>
              )}
            </div>
          </div>
        )}

        {/* About Tab */}
        {activeTab === 8 && (
          <div style={styles.aboutCard}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "6px",
              }}
            >
              <img
                src="../assets/32.png"
                width="20px"
                height="20px"
                alt="LetXPath logo"
                style={{ borderRadius: "4px" }}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 600,
                    lineHeight: 1.2,
                  }}
                >
                  LetXPath
                </span>
                <span style={{ color: "#858585", fontSize: "9px" }}>
                  v3.0.1 • Open Source
                </span>
              </div>
            </div>

            <p
              style={{
                color: "#cccccc",
                fontSize: "10px",
                lineHeight: "1.4",
                margin: "6px 0",
              }}
            >
              A premium, lightweight developer tool built to accelerate locator
              building and CSS/XPath generation for test automation.
            </p>

            <div style={styles.divider} />

            {/* Social Icons row */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                margin: "8px 0",
                alignItems: "center",
              }}
            >
              <a
                href="https://youtube.com/@letcode"
                target="_blank"
                title="YouTube Channel"
              >
                <svg
                  className="social-svg-icon youtube"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.507 9.388.507 9.388.507s7.518 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              <a
                href="https://github.com/ortoniKC/LetXPath"
                target="_blank"
                title="GitHub Repository"
              >
                <svg
                  className="social-svg-icon github"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.82 1.102.82 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/in/ortoni/"
                target="_blank"
                title="LinkedIn Profile"
              >
                <svg
                  className="social-svg-icon linkedin"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
              <a
                href="https://letcode.in"
                target="_blank"
                title="LetCode Website"
              >
                <svg
                  className="social-svg-icon globe"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.53c-.26-.81-1-1.4-1.9-1.4h-1v-3c0-.55-.45-1-1-1h-6v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
              </a>
              <a
                href="https://chromewebstore.google.com/detail/letxpath/bekehlnepmijedippfibbmbglglbmlgk/reviews"
                target="_blank"
                title="Rate on Chrome Web Store"
              >
                <svg
                  className="social-svg-icon star"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </a>
            </div>

            <div style={styles.divider} />

            {/* Other Products Section */}
            <div style={{ margin: "8px 0" }}>
              <div
                style={{
                  color: "#858585",
                  fontSize: "9px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  marginBottom: "6px",
                  letterSpacing: "0.5px",
                }}
              >
                Our Automation Tools
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                <a
                  href="https://github.com/ortoniKC/ortoni-report"
                  target="_blank"
                  className="product-item"
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: "10px",
                        color: "#3794ff",
                      }}
                    >
                      Ortoni Report
                    </div>
                    <div
                      style={{
                        fontSize: "8px",
                        color: "#858585",
                        backgroundColor: "#2d2d2d",
                        padding: "1px 4px",
                        borderRadius: "3px",
                        marginLeft: "auto",
                      }}
                    >
                      GitHub
                    </div>
                  </div>
                  <div
                    style={{
                      color: "#858585",
                      fontSize: "9px",
                      marginTop: "2px",
                      lineHeight: "1.2",
                    }}
                  >
                    Sleek, feature-rich HTML reporter for Playwright test
                    results.
                  </div>
                </a>

                <a
                  href="https://marketplace.visualstudio.com/items?itemName=ortoni.ortoni"
                  target="_blank"
                  className="product-item"
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: "10px",
                        color: "#3794ff",
                      }}
                    >
                      Ortoni Runner
                    </div>
                    <div
                      style={{
                        fontSize: "8px",
                        color: "#858585",
                        backgroundColor: "#2d2d2d",
                        padding: "1px 4px",
                        borderRadius: "3px",
                        marginLeft: "auto",
                      }}
                    >
                      VS Code
                    </div>
                  </div>
                  <div
                    style={{
                      color: "#858585",
                      fontSize: "9px",
                      marginTop: "2px",
                      lineHeight: "1.2",
                    }}
                  >
                    VS Code extension to run Playwright & Cucumber tests
                    instantly.
                  </div>
                </a>
              </div>
            </div>

            <div style={styles.divider} />

            {/* Support / Sponsor Section */}
            <div
              style={{
                background: "linear-gradient(135deg, #1c1c1c 0%, #111111 100%)",
                border: "1px solid #333333",
                borderRadius: "6px",
                padding: "8px",
                marginTop: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <div
                    style={{
                      color: "#4ade80",
                      fontSize: "10px",
                      fontWeight: 600,
                      marginBottom: "2px",
                    }}
                  >
                    Support the Project
                  </div>
                  <div
                    style={{
                      color: "#858585",
                      fontSize: "9px",
                      lineHeight: "1.3",
                      maxWidth: "140px",
                    }}
                  >
                    LetXPath is free & open-source. Consider donating to help
                    maintain it!
                  </div>
                </div>

                {/* QR Code trigger-zoomable wrapper */}
                <div className="qr-wrapper" title="Hover to enlarge QR Code">
                  <img
                    src="../assets/ortoni.png"
                    alt="Donate UPI QR Code"
                    className="qr-image"
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  marginTop: "2px",
                }}
              >
                <span style={{ color: "#858585", fontSize: "9px" }}>UPI:</span>
                <div
                  className="upi-copy-badge"
                  onClick={() =>
                    copyToClipboard("ortoni@ybl", "UPI ID copied to clipboard!")
                  }
                  title="Click to copy UPI ID"
                >
                  <span>ortoni@ybl</span>
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="9"
                      y="9"
                      width="13"
                      height="13"
                      rx="2"
                      ry="2"
                    ></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: "12px",
                color: "#555",
                fontSize: "8px",
                textAlign: "center",
              }}
            >
              Created with ❤️ by Koushik Chatterjee. Licensed under MIT.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  btnStartRecord: {
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "3px 8px",
    fontSize: "10px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(16, 185, 129, 0.2)",
  },
  btnStopRecord: {
    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "3px 8px",
    fontSize: "10px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(239, 68, 68, 0.2)",
  },
  pulseRedDot: {
    display: "inline-block",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#ff4d4d",
    boxShadow: "0 0 0 0 rgba(255, 77, 77, 0.7)",
  },
  greenDot: {
    display: "inline-block",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#4ade80",
  },
  appContainer: {
    backgroundColor: "#181a1b",
    color: "#cccccc",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: "11px",
  },
  navBar: {
    borderBottom: "1px solid #2d2d2d",
    backgroundColor: "#252526",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 4px",
    height: "26px",
    userSelect: "none" as const,
    minHeight: "26px",
  },
  tabsList: {
    display: "flex",
    listStyle: "none",
    margin: 0,
    padding: 0,
    height: "100%",
    alignItems: "stretch",
  },
  tabItem: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    margin: 0,
    padding: 0,
  },
  link: {
    color: "#969696",
    padding: "0 8px",
    fontSize: "11px",
    fontWeight: "normal",
    height: "100%",
    display: "flex",
    alignItems: "center",
    borderBottom: "2px solid transparent",
    transition: "color 0.2s, border-color 0.2s",
    textDecoration: "none",
  },
  activeLink: {
    color: "#ffffff",
    padding: "0 8px",
    fontSize: "11px",
    fontWeight: "500",
    height: "100%",
    display: "flex",
    alignItems: "center",
    borderBottom: "2px solid #0e639c",
    textDecoration: "none",
  },
  settingsBtn: {
    padding: "0 6px",
    cursor: "pointer",
    fontSize: "18px",
    color: "#858585",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    transition: "color 0.2s",
    size: "16px",
  },
  contentBody: {
    padding: "6px",
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    overflowY: "auto" as const,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center" as const,
    color: "#777",
    marginTop: "40px",
    padding: "12px",
  },
  emptyTitle: {
    fontSize: "11px",
    fontWeight: "bold",
    color: "#bbbbbb",
    marginBottom: "2px",
  },
  emptySubtitle: {
    fontSize: "10px",
    maxWidth: "220px",
    lineHeight: "1.3",
  },
  locatorList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "2px",
  },
  locatorRow: {
    display: "flex",
    alignItems: "center",
    padding: "3px 4px",
    borderBottom: "1px solid #252526",
    gap: "4px",
    backgroundColor: "#1e1e1e",
    borderRadius: "2px",
  },
  labelBox: {
    display: "flex",
    alignItems: "center",
    gap: "3px",
    flexShrink: 1,
    flexGrow: 0,
    width: "84px",
    minWidth: "40px",
    overflow: "hidden",
  },
  priorityBadge: {
    backgroundColor: "#37373d",
    color: "#858585",
    fontSize: "9px",
    fontWeight: "bold",
    borderRadius: "2px",
    padding: "1px 3px",
    display: "inline-block",
    textAlign: "center" as const,
    minWidth: "12px",
  },
  locatorLabel: {
    fontSize: "10px",
    color: "#aaaaaa",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  codeSnippet: {
    flex: 1,
    minWidth: "20px",
    backgroundColor: "#151515",
    color: "#4ec9b0", // VSCode teal color for selector strings
    border: "1px solid #2d2d2d",
    borderRadius: "2px",
    padding: "2px 4px",
    fontSize: "10px",
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
    cursor: "pointer",
    userSelect: "all" as const,
  },
  actionSelect: {
    appearance: "auto" as any,
    WebkitAppearance: "auto" as any,
    backgroundColor: "#252526",
    color: "#cccccc",
    border: "1px solid #3c3c3c",
    borderRadius: "2px",
    padding: "1px 2px",
    fontSize: "10px",
    width: "72px",
    minWidth: "72px",
    flexShrink: 0,
    cursor: "pointer",
    outline: "none",
    height: "18px",
  },
  toast: {
    position: "fixed" as const,
    bottom: "12px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 9999,
    padding: "4px 10px",
    borderRadius: "4px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
    border: "1px solid #0e639c",
    background: "#0e639c",
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: "10px",
  },
  tableCard: {
    backgroundColor: "#202020",
    borderLeft: "3px solid #ffb86c",
    padding: "4px 6px",
    marginBottom: "4px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "2px",
    borderRadius: "2px",
  },
  tableHeader: {
    fontSize: "10px",
    fontWeight: "bold",
    color: "#ffb86c",
  },
  tableRow: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  tableLabel: {
    fontSize: "9px",
    color: "#888",
    width: "80px",
    minWidth: "80px",
  },
  tableCode: {
    flex: 1,
    backgroundColor: "#151515",
    color: "#ffb86c",
    border: "1px solid #2d2d2d",
    borderRadius: "2px",
    padding: "2px 4px",
    fontSize: "10px",
    fontFamily: "Consolas, Monaco, monospace",
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  axesContainer: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
    padding: "2px",
  },
  axesResultBox: {
    backgroundColor: "#151515",
    border: "1px solid #2d2d2d",
    borderRadius: "2px",
    padding: "4px 6px",
  },
  axesResultCode: {
    color: "#569cd6",
    fontSize: "10px",
    fontFamily: "Consolas, Monaco, monospace",
    fontWeight: "bold",
    cursor: "pointer",
    wordBreak: "break-all" as const,
    background: "none",
    padding: 0,
  },
  axesColumns: {
    display: "flex",
    gap: "4px",
    marginTop: "2px",
  },
  axesColumn: {
    flex: 1,
    border: "1px solid #2d2d2d",
    borderRadius: "2px",
    padding: "4px",
    backgroundColor: "#202020",
    maxHeight: "160px",
    overflowY: "auto" as const,
  },
  columnHeader: {
    fontSize: "9px",
    color: "#888",
    fontWeight: "bold",
    marginBottom: "4px",
    textTransform: "uppercase" as const,
    borderBottom: "1px solid #2d2d2d",
    paddingBottom: "2px",
  },
  radioWrapper: {
    margin: "2px 0",
  },
  radioLabel: {
    color: "#cccccc",
    fontSize: "10px",
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    userSelect: "none" as const,
  },
  toolCard: {
    backgroundColor: "#202020",
    border: "1px solid #2d2d2d",
    borderRadius: "2px",
    padding: "6px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
  },
  toolTitle: {
    fontSize: "10px",
    fontWeight: "bold",
    color: "#ffffff",
  },
  toolDesc: {
    fontSize: "9px",
    color: "#666",
    marginBottom: "2px",
  },
  toolInput: {
    backgroundColor: "#151515",
    color: "#cccccc",
    border: "1px solid #2d2d2d",
    borderRadius: "2px",
    padding: "2px 4px",
    fontSize: "10px",
    outline: "none",
    flex: 1,
    height: "20px",
  },
  btnFind: {
    border: "none",
    backgroundColor: "#0e639c",
    color: "#ffffff",
    padding: "2px 6px",
    fontSize: "10px",
    borderRadius: "2px",
    cursor: "pointer",
    fontWeight: "500",
    height: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  btnClear: {
    border: "none",
    backgroundColor: "transparent",
    color: "#f44336",
    padding: "2px 4px",
    fontSize: "10px",
    cursor: "pointer",
    height: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  btnVerifyInline: {
    border: "none",
    backgroundColor: "#0e639c",
    color: "#ffffff",
    padding: "1px 4px",
    fontSize: "9px",
    borderRadius: "2px",
    cursor: "pointer",
    height: "18px",
    width: "32px",
    minWidth: "32px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "4px",
    fontWeight: "500" as any,
  },
  searchSuccess: {
    marginTop: "2px",
    color: "#4ade80",
    fontSize: "10px",
  },
  searchFail: {
    marginTop: "2px",
    color: "#f44336",
    fontSize: "10px",
  },
  convertBox: {
    marginTop: "4px",
    backgroundColor: "#151515",
    border: "1px solid #2d2d2d",
    padding: "4px",
    borderRadius: "2px",
  },
  convertCode: {
    color: "#4ade80",
    fontSize: "10px",
    fontFamily: "Consolas, Monaco, monospace",
    cursor: "pointer",
    wordBreak: "break-all" as const,
    background: "none",
    padding: 0,
  },
  aboutCard: {
    backgroundColor: "#202020",
    border: "1px solid #2d2d2d",
    borderRadius: "2px",
    padding: "8px",
  },
  divider: {
    height: "1px",
    backgroundColor: "#2d2d2d",
    margin: "6px 0",
  },
  linkRow: {
    display: "flex",
    gap: "8px",
  },
  aboutLink: {
    color: "#3794ff",
    fontSize: "10px",
    textDecoration: "none",
  },
};

export default PanelApp;
