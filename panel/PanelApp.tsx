import React, { useState, useEffect, useRef } from "react";
import { SelectedElement, AxesData, ChromeStorageResult, DevToolsMessageRequest } from "./types";
import { styles } from "./styles";
import { EmailTestingTab } from "./EmailTestingTab";
import { XPathTab } from "./tabs/XPathTab";
import { CSSTab } from "./tabs/CSSTab";
import { AxesTab } from "./tabs/AxesTab";
import { PlaywrightTab } from "./tabs/PlaywrightTab";
import { CypressTab } from "./tabs/CypressTab";
import { RecorderTab } from "./tabs/RecorderTab";
import { ToolsTab } from "./tabs/ToolsTab";
import { AboutTab } from "./tabs/AboutTab";
import {
  colorizeXPath,
  colorizeCSS,
  colorizePlaywright,
  colorizeCode,
  getPlaywrightActions,
  getPlaywrightSnippet,
  getSeleniumJava,
  getPlaywrightJava,
  getPlaywrightJS,
  getSeleniumPython,
  getProtractor,
  getCypress,
  getCustomSnippet,
  generateRecordedScript,
  getActionsForTag,
} from "./helpers";
import { APPVERSION } from "./constants";

const PanelApp: React.FC = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [activeTab, setActiveTab] = useState<number>(1);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ theme: nextTheme });
    } else {
      localStorage.setItem("theme", nextTheme);
    }
  };

  // Recorder states
  const [recordedSteps, setRecordedSteps] = useState<any[]>([]);
  const stepsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (stepsContainerRef.current) {
      stepsContainerRef.current.scrollTop = stepsContainerRef.current.scrollHeight;
    }
  }, [recordedSteps.length]);

  const [isRecordingActive, setIsRecordingActive] = useState<boolean>(false);
  const [isVerifyModeActive, setIsVerifyModeActive] = useState<boolean>(false);
  const [recordingUrl, setRecordingUrl] = useState<string>("");
  const [templates, setTemplates] = useState<ChromeStorageResult>({});

  const [isScreenRecording, setIsScreenRecording] = useState<boolean>(false);
  const recordingWindowIdRef = useRef<number | null>(null);

  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);

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
  const [selectedFrameId, setSelectedFrameId] = useState<number | undefined>(undefined);
  const [registeredFrameIds, setRegisteredFrameIds] = useState<Set<number>>(new Set());
  const frameSearchResults = useRef<Map<number, { xpath: string; count: number }>>(new Map());
  const searchValRef = useRef<string>("");

  const [editedCode, setEditedCode] = useState<string>("");
  const [isAutoSyncActive, setIsAutoSyncActive] = useState<boolean>(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);

  const handleEditorScroll = () => {
    if (textareaRef.current) {
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
      }
      if (highlightRef.current) {
        highlightRef.current.scrollTop = textareaRef.current.scrollTop;
        highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
      }
    }
  };

  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedCode(e.target.value);
    setIsAutoSyncActive(false);
  };

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
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ isRecordingActive: false }, () => {
        sendMessageToCS({ request: "stop_recording" });
      });
    } else {
      localStorage.setItem("isRecordingActive", "false");
      console.log("Mock stopped recording");
    }
  };

  const handleStartScreenRecording = () => {
    if (typeof chrome !== "undefined" && chrome.windows && chrome.windows.create) {
      chrome.windows.create(
        {
          url: chrome.runtime.getURL("panel/recording.html"),
          type: "popup",
          width: 600,
          height: 400,
          focused: true,
        },
        (win) => {
          if (win && win.id) {
            recordingWindowIdRef.current = win.id;
          }
        },
      );
      showToast("Screen recorder window opened");
    } else {
      window.open(
        chrome.runtime.getURL("panel/recording.html"),
        "Ortoni Screen Recorder",
        "width=600,height=400",
      );
      showToast("Screen recorder window opened (mock)");
      setIsScreenRecording(true);
    }
  };

  const handleStopScreenRecording = () => {
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: "STOP_RECORDING" });
    } else {
      setIsScreenRecording(false);
      showToast("Video recording saved successfully! (mock)");
    }
  };

  const handleToggleVerifyMode = (active: boolean) => {
    setIsVerifyModeActive(active);
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ isVerifyModeActive: active });
    } else {
      localStorage.setItem("isVerifyModeActive", active ? "true" : "false");
    }
  };

  const handleClearRecording = () => {
    setRecordedSteps([]);
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
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
    } else if (currentLang === "cypress") {
      filename = "recorded_test.cy.js";
      mimeType = "text/javascript";
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

  useEffect(() => {
    if (isAutoSyncActive) {
      setEditedCode(generateRecordedScript(recordedSteps, recordingUrl, langID, templates));
    }
  }, [recordedSteps, recordingUrl, langID, isAutoSyncActive, templates]);

  useEffect(() => {
    const handleRuntimeMessage = (message: any) => {
      if (message.action === "RECORDING_STARTED") {
        setIsScreenRecording(true);
      } else if (message.action === "RECORDING_STOPPED") {
        setIsScreenRecording(false);
        recordingWindowIdRef.current = null;
      }
    };

    const handleWindowRemoved = (windowId: number) => {
      if (recordingWindowIdRef.current !== null && windowId === recordingWindowIdRef.current) {
        setIsScreenRecording(false);
        recordingWindowIdRef.current = null;
      }
    };

    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(handleRuntimeMessage);
    }
    if (typeof chrome !== "undefined" && chrome.windows && chrome.windows.onRemoved) {
      chrome.windows.onRemoved.addListener(handleWindowRemoved);
    }

    return () => {
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.removeListener(handleRuntimeMessage);
      }
      if (typeof chrome !== "undefined" && chrome.windows && chrome.windows.onRemoved) {
        chrome.windows.onRemoved.removeListener(handleWindowRemoved);
      }
    };
  }, []);

  const handleTabChange = (tabIndex: number) => {
    setActiveTab(tabIndex);
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ activeTab: tabIndex });
    } else {
      localStorage.setItem("activeTab", String(tabIndex));
    }
  };

  const tabId =
    typeof chrome !== "undefined" && chrome.devtools && chrome.devtools.inspectedWindow
      ? chrome.devtools.inspectedWindow.tabId
      : null;

  const sendMessageToCS = (msg: any) => {
    if (tabId && typeof chrome !== "undefined" && chrome.tabs) {
      if (registeredFrameIds.size > 0) {
        registeredFrameIds.forEach((frameId) => {
          chrome.tabs.sendMessage(tabId, msg, { frameId }, () => {
            const err = chrome.runtime.lastError;
            if (err) {
              console.warn(`Message send failed to frame ${frameId}:`, err.message);
              removeFrameId(frameId);
            }
          });
        });
      } else {
        const options = selectedFrameId !== undefined ? { frameId: selectedFrameId } : {};
        chrome.tabs.sendMessage(tabId, msg, options, () => {
          const err = chrome.runtime.lastError;
          if (err) {
            console.warn("Message send failed:", err.message);
          }
        });
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
        const frameId =
          req.senderMetadata?.frameId !== undefined
            ? req.senderMetadata.frameId
            : _sender && _sender.frameId !== undefined
              ? _sender.frameId
              : undefined;

        switch (req.request) {
          case "register_frame":
            if (frameId !== undefined) {
              addFrameId(frameId);
            }
            break;
          case "send_to_dev":
            if (frameId !== undefined) {
              setSelectedFrameId(frameId);
              addFrameId(frameId);
            }
            if (req.xpathid && req.cssPath && req.tag !== undefined && req.type !== undefined) {
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
            if (frameId !== undefined) {
              setSelectedFrameId(frameId);
              addFrameId(frameId);
            }
            if (req.data) {
              setAxesData(req.data);
              if (req.data.src && req.data.src.length > 0) setSelectedSrc(req.data.src[0][1]);
              if (req.data.dst && req.data.dst.length > 0) setSelectedDst(req.data.dst[0][1]);
              setAxesXPathResult(req.data.defaultXPath);
              handleTabChange(3); // Switch to Axes panel
            }
            break;
          case "axes":
            if (req.data) setAxesXPathResult(req.data);
            break;
          case "customSearchResult":
            if (req.data && frameId !== undefined) {
              frameSearchResults.current.set(frameId, req.data);

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
                totalCount > 0 ? bestXPath || `${locatorType} found` : `Wrong ${locatorType}`;

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

    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(listener);
    }

    return () => {
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.removeListener(listener);
      }
    };
  }, []);

  useEffect(() => {
    // Inject animation styles for recorder red dot and general panel tabs/rows
    const styleEl = document.createElement("style");
    styleEl.innerHTML = `
      .theme-light {
        --bg-primary: #f3f4f6;
        --bg-secondary: #ffffff;
        --bg-card: #ffffff;
        --border-color: #e5e7eb;
        --color-primary: #083d77;
        --color-primary-hover: #062c56;
        --color-primary-tint: rgba(8, 61, 119, 0.08);
        --text-primary: #1f2937;
        --text-secondary: #4b5563;
        --text-light: #ffffff;
        --color-alert: #ef4444;
        --color-success: #10b981;
      }
      .theme-dark {
        --bg-primary: #080a10;
        --bg-secondary: #101423;
        --bg-card: #101423;
        --border-color: rgba(255, 255, 255, 0.05);
        --color-primary: #6366f1;
        --color-primary-hover: #818cf8;
        --color-primary-tint: rgba(99, 102, 241, 0.15);
        --text-primary: #f1f5f9;
        --text-secondary: #94a3b8;
        --text-light: #ffffff;
        --color-alert: #ef4444;
        --color-success: #42b883;
        background-color: var(--bg-primary) !important;
        background-image:
          radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.12) 0px, transparent 50%),
          radial-gradient(at 100% 100%, rgba(66, 184, 131, 0.08) 0px, transparent 50%) !important;
        background-attachment: fixed !important;
      }

      @keyframes pulseRed {
        0% {
          transform: scale(0.95);
          box-shadow: 0 0 0 0 rgba(8, 61, 119, 0.7);
        }
        70% {
          transform: scale(1);
          box-shadow: 0 0 0 5px rgba(8, 61, 119, 0);
        }
        100% {
          transform: scale(0.95);
          box-shadow: 0 0 0 0 rgba(8, 61, 119, 0);
        }
      }
      .pulse-red-dot {
        animation: pulseRed 1.5s infinite;
      }

      /* Tab Content transitions */
      @keyframes tabFadeIn {
        from {
          opacity: 0;
          transform: translateY(6px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .tab-content-animate {
        animation: tabFadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }

      /* Staggered locator rows waterfall */
      @keyframes rowFadeIn {
        from {
          opacity: 0;
          transform: translateX(-4px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      .locator-row-animate {
        opacity: 0;
        animation: rowFadeIn 0.22s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        transition: all 0.18s ease-in-out;
      }
      .locator-row-animate:hover {
        background-color: var(--color-primary-tint) !important; /* Primary tint hover */
        transform: translateX(2px);
        box-shadow: 0 2px 8px rgba(8, 61, 119, 0.18);
      }

      /* Toast pop transition */
      @keyframes toastPop {
        0% {
          opacity: 0;
          transform: translate(-50%, 12px) scale(0.96);
        }
        100% {
          opacity: 1;
          transform: translate(-50%, 0) scale(1);
        }
      }
      .toast-pop-animate {
        animation: toastPop 0.22s cubic-bezier(0.18, 0.89, 0.32, 1.15) forwards;
      }

      /* Hover slider decoration for navbar links */
      .nav-tab-item {
        position: relative;
        transition: all 0.2s ease;
      }
      .nav-tab-item::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        width: 0;
        height: 2px;
        background-color: var(--color-primary); /* Primary tab indicator */
        transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
        transform: translateX(-50%);
      }
      .nav-tab-item:hover::after {
        width: 80%;
      }
      .nav-tab-item.active-tab::after {
        width: 100%;
        background-color: var(--color-primary); /* Primary tab indicator */
      }
    `;
    document.head.appendChild(styleEl);

    const loadSettings = () => {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(
          [
            "langID",
            "activeTab",
            "isRecordingActive",
            "isVerifyModeActive",
            "recordedSteps",
            "recordingUrl",
            "customLang",
            "clickvalue",
            "sendvalue",
            "textvalue",
            "attrvalue",
            "theme",
          ],
          (result) => {
            if (result.langID) setLangID(result.langID);
            if (result.activeTab) setActiveTab(result.activeTab);
            if (result.isRecordingActive !== undefined)
              setIsRecordingActive(result.isRecordingActive);
            if (result.isVerifyModeActive !== undefined)
              setIsVerifyModeActive(result.isVerifyModeActive);
            if (result.recordedSteps) setRecordedSteps(result.recordedSteps);
            if (result.recordingUrl) setRecordingUrl(result.recordingUrl);
            if (result.theme) setTheme(result.theme);
            setTemplates(result);
          },
        );
      } else {
        const localLang = localStorage.getItem("langID");
        if (localLang) setLangID(localLang);
        const localTab = localStorage.getItem("activeTab");
        if (localTab) setActiveTab(Number(localTab));
        const localRecordingActive = localStorage.getItem("isRecordingActive") === "true";
        setIsRecordingActive(localRecordingActive);
        const localVerifyActive = localStorage.getItem("isVerifyModeActive") === "true";
        setIsVerifyModeActive(localVerifyActive);
        const localRecordedSteps = JSON.parse(localStorage.getItem("recordedSteps") || "[]");
        setRecordedSteps(localRecordedSteps);
        const localRecordingUrl = localStorage.getItem("recordingUrl") || "";
        setRecordingUrl(localRecordingUrl);
        const localTheme = localStorage.getItem("theme") as "light" | "dark";
        if (localTheme) setTheme(localTheme);
        const localTemplates: ChromeStorageResult = {
          customLang: (localStorage.getItem("customLang") as "jscs" | "javacs") || "javacs",
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
      if (changes.isVerifyModeActive) {
        setIsVerifyModeActive(changes.isVerifyModeActive.newValue);
      }
      if (changes.recordedSteps) {
        setRecordedSteps(changes.recordedSteps.newValue || []);
      }
      if (changes.recordingUrl) {
        setRecordingUrl(changes.recordingUrl.newValue || "");
      }
      if (changes.theme) {
        setTheme(changes.theme.newValue);
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
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(storageListener);
    }
    return () => {
      document.head.removeChild(styleEl);
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
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
      case "cypress":
        str = getCypress(codeType, val);
        break;
      case "custom":
        return getCustomSnippet(actionType, codeType, val, variable, method, templates);
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
            : lang === "cypress"
              ? '.type("");'
              : '.sendKeys("");';
        break;
      case "getAttribute":
        str += lang.startsWith("playwright")
          ? '.getAttribute("value");'
          : lang === "py"
            ? '.get_attribute("value")'
            : lang === "cypress"
              ? '.invoke("attr", "value");'
              : '.getAttribute("value");';
        break;
      case "getText":
        str += lang.startsWith("playwright")
          ? ".textContent();"
          : lang === "py"
            ? ".get_text()"
            : lang === "cypress"
              ? '.invoke("text");'
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

    const varName = selectedElement ? selectedElement.variablename || "ele" : "ele";
    const methName = selectedElement ? selectedElement.methodname || "ele" : "ele";

    const copyProcess = (lang: string, templates: ChromeStorageResult) => {
      const code = getSnippetCode(action, codeType, val, varName, methName, lang, templates);
      copyToClipboard(code, `Snippet (${action}) copied to clipboard!`);
    };

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(
        ["langID", "customLang", "clickvalue", "sendvalue", "textvalue", "attrvalue"],
        (result: ChromeStorageResult) => {
          copyProcess(result.langID || "javas", result);
        },
      );
    } else {
      const localLang = localStorage.getItem("langID") || "javas";
      const localTemplates: ChromeStorageResult = {
        customLang: (localStorage.getItem("customLang") as "jscs" | "javacs") || "javacs",
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

  // Open Options page
  const handleOpenSettings = () => {
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.openOptionsPage) {
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
    <div className={theme === "light" ? "theme-light" : "theme-dark"} style={styles.appContainer}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* Custom scrollbar for primary/secondary theme panel */
        ::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        ::-webkit-scrollbar-track {
          background: var(--bg-primary);
        }
        ::-webkit-scrollbar-thumb {
          background: var(--color-primary-tint);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: var(--color-primary);
        }
        /* Custom styling overrides for inputs and selectors */
        select.form-select {
          appearance: auto !important;
          -webkit-appearance: auto !important;
          background: var(--bg-secondary) !important;
          border: 1px solid var(--border-color) !important;
          color: var(--text-primary) !important;
          padding: 1px 2px !important;
          font-size: 10px !important;
          height: 18px !important;
          border-radius: 2px !important;
        }
        input.form-input::placeholder {
          color: var(--text-secondary);
        }

        /* About Tab interactive styling */
        .about-link-item {
          color: var(--color-primary);
          text-decoration: none;
          transition: color 0.2s ease, text-decoration 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .about-link-item:hover {
          color: var(--color-primary-hover);
          text-decoration: underline;
        }
        .social-svg-icon {
          fill: var(--text-secondary);
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
          fill: var(--color-primary);
        }
        .social-svg-icon.linkedin:hover {
          fill: #0077b5;
        }
        .social-svg-icon.globe:hover {
          fill: var(--color-primary);
        }
        .social-svg-icon.star:hover {
          fill: var(--color-primary);
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
          border: 1px solid var(--border-color);
          border-radius: 4px;
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease, border-color 0.25s ease;
          transform-origin: bottom right;
          z-index: 10;
          position: relative;
        }
        .qr-wrapper:hover .qr-image {
          transform: scale(4.5);
          box-shadow: 0 10px 30px var(--color-primary-tint);
          border-color: var(--color-primary);
          z-index: 99999;
          position: relative;
        }
        .upi-copy-badge {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          padding: 3px 6px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--color-primary);
          font-family: Consolas, Monaco, monospace;
          font-size: 10px;
          cursor: pointer;
          transition: background-color 0.2s, border-color 0.2s;
        }
        .upi-copy-badge:hover {
          background-color: var(--bg-primary);
          border-color: var(--color-primary);
        }
        .product-item {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          padding: 6px 8px;
          transition: border-color 0.2s, background-color 0.2s;
          text-decoration: none;
          color: var(--text-primary);
          display: block;
          margin-bottom: 4px;
        }
        .product-item:hover {
          border-color: var(--color-primary);
          background-color: var(--bg-primary);
          color: var(--color-primary);
        }
      `,
        }}
      />

      {toast && (
        <div className="toast-pop-animate" style={styles.toast}>
          <span>{toast}</span>
        </div>
      )}

      {/* Tab Navigation header */}
      <div style={styles.navBar}>
        <ul style={styles.tabsList}>
          <li style={styles.tabItem} onClick={() => handleTabChange(1)}>
            <span
              className={`nav-tab-item ${activeTab === 1 ? "active-tab" : ""}`}
              style={activeTab === 1 ? styles.activeLink : styles.link}
            >
              XPath
            </span>
          </li>
          <li style={styles.tabItem} onClick={() => handleTabChange(2)}>
            <span
              className={`nav-tab-item ${activeTab === 2 ? "active-tab" : ""}`}
              style={activeTab === 2 ? styles.activeLink : styles.link}
            >
              CSS
            </span>
          </li>
          <li style={styles.tabItem} onClick={() => handleTabChange(3)}>
            <span
              className={`nav-tab-item ${activeTab === 3 ? "active-tab" : ""}`}
              style={activeTab === 3 ? styles.activeLink : styles.link}
            >
              Axes
            </span>
          </li>
          <li style={styles.tabItem} onClick={() => handleTabChange(4)}>
            <span
              className={`nav-tab-item ${activeTab === 4 ? "active-tab" : ""}`}
              style={activeTab === 4 ? styles.activeLink : styles.link}
            >
              Playwright
            </span>
          </li>
          <li style={styles.tabItem} onClick={() => handleTabChange(5)}>
            <span
              className={`nav-tab-item ${activeTab === 5 ? "active-tab" : ""}`}
              style={activeTab === 5 ? styles.activeLink : styles.link}
            >
              Cypress
            </span>
          </li>
          <li style={styles.tabItem} onClick={() => handleTabChange(6)}>
            <span
              className={`nav-tab-item ${activeTab === 6 ? "active-tab" : ""}`}
              style={activeTab === 6 ? styles.activeLink : styles.link}
            >
              Recorder
            </span>
          </li>
          <li style={styles.tabItem} onClick={() => handleTabChange(7)}>
            <span
              className={`nav-tab-item ${activeTab === 7 ? "active-tab" : ""}`}
              style={activeTab === 7 ? styles.activeLink : styles.link}
            >
              Tools
            </span>
          </li>
          <li style={styles.tabItem} onClick={() => handleTabChange(9)}>
            <span
              className={`nav-tab-item ${activeTab === 9 ? "active-tab" : ""}`}
              style={activeTab === 9 ? styles.activeLink : styles.link}
            >
              Emails
            </span>
          </li>
          <li style={styles.tabItem} onClick={() => handleTabChange(8)}>
            <span
              className={`nav-tab-item ${activeTab === 8 ? "active-tab" : ""}`}
              style={activeTab === 8 ? styles.activeLink : styles.link}
            >
              About
            </span>
          </li>
        </ul>
        <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
          <div
            style={styles.themeToggleBtn}
            onClick={toggleTheme}
            title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
          >
            {theme === "light" ? "🌙" : "☀️"}
          </div>
          <div style={styles.settingsBtn} onClick={handleOpenSettings} title="Settings">
            ⚙
          </div>
        </div>
      </div>

      {/* Main Containers */}
      <div style={styles.contentBody}>
        {/* XPath Tab */}
        {activeTab === 1 && (
          <XPathTab
            selectedElement={selectedElement}
            copyToClipboard={copyToClipboard}
            handleVerifyLocator={handleVerifyLocator}
            handleActionSelect={handleActionSelect}
          />
        )}

        {/* CSS Tab */}
        {activeTab === 2 && (
          <CSSTab
            selectedElement={selectedElement}
            copyToClipboard={copyToClipboard}
            handleVerifyLocator={handleVerifyLocator}
            handleActionSelect={handleActionSelect}
          />
        )}

        {/* Axes Tab */}
        {activeTab === 3 && (
          <AxesTab
            axesData={axesData}
            axesXPathResult={axesXPathResult}
            selectedSrc={selectedSrc}
            setSelectedSrc={setSelectedSrc}
            selectedDst={selectedDst}
            setSelectedDst={setSelectedDst}
            copyToClipboard={copyToClipboard}
          />
        )}

        {/* Playwright Tab */}
        {activeTab === 4 && (
          <PlaywrightTab
            selectedElement={selectedElement}
            langID={langID}
            copyToClipboard={copyToClipboard}
            handleVerifyLocator={handleVerifyLocator}
            handlePlaywrightActionSelect={handlePlaywrightActionSelect}
          />
        )}

        {/* Cypress Tab */}
        {activeTab === 5 && (
          <CypressTab
            selectedElement={selectedElement}
            copyToClipboard={copyToClipboard}
            handleVerifyLocator={handleVerifyLocator}
          />
        )}

        {/* Recorder Tab */}
        {activeTab === 6 && (
          <RecorderTab
            isRecordingActive={isRecordingActive}
            isVerifyModeActive={isVerifyModeActive}
            handleToggleVerifyMode={handleToggleVerifyMode}
            handleStopRecording={handleStopRecording}
            handleStartRecording={handleStartRecording}
            handleClearRecording={handleClearRecording}
            isScreenRecording={isScreenRecording}
            handleStopScreenRecording={handleStopScreenRecording}
            handleStartScreenRecording={handleStartScreenRecording}
            recordingUrl={recordingUrl}
            recordedSteps={recordedSteps}
            langID={langID}
            setLangID={setLangID}
            isAutoSyncActive={isAutoSyncActive}
            setIsAutoSyncActive={setIsAutoSyncActive}
            editedCode={editedCode}
            setEditedCode={setEditedCode}
            templates={templates}
            copyToClipboard={copyToClipboard}
            handleDownloadScript={handleDownloadScript}
          />
        )}

        {/* Tools Tab */}
        {activeTab === 7 && (
          <ToolsTab
            searchVal={searchVal}
            setSearchVal={setSearchVal}
            handleCustomSearch={handleCustomSearch}
            handleClearHighlight={handleClearHighlight}
            searchResult={searchResult}
            convertVal={convertVal}
            setConvertVal={setConvertVal}
            handleConvertXPath={handleConvertXPath}
            convertResult={convertResult || ""}
            copyToClipboard={copyToClipboard}
          />
        )}

        {/* About Tab */}
        {activeTab === 8 && <AboutTab copyToClipboard={copyToClipboard} />}

        {/* Email Opt Testing Tab */}
        {activeTab === 9 && (
          <div
            className="tab-content-animate"
            style={{ display: "flex", flexDirection: "column", height: "100%" }}
          >
            <EmailTestingTab />
          </div>
        )}
      </div>
    </div>
  );
};

export default PanelApp;
