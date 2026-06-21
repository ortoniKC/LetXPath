import React, { useState, useEffect, useRef } from "react";
import {
  SelectedElement,
  AxesData,
  ChromeStorageResult,
  DevToolsMessageRequest,
} from "./types";
import { styles } from "./styles";
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
  const [activeTab, setActiveTab] = useState<number>(1);

  // Recorder states
  const [recordedSteps, setRecordedSteps] = useState<any[]>([]);
  const stepsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (stepsContainerRef.current) {
      stepsContainerRef.current.scrollTop =
        stepsContainerRef.current.scrollHeight;
    }
  }, [recordedSteps.length]);

  const [isRecordingActive, setIsRecordingActive] = useState<boolean>(false);
  const [isVerifyModeActive, setIsVerifyModeActive] = useState<boolean>(false);
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

  const handleToggleVerifyMode = (active: boolean) => {
    setIsVerifyModeActive(active);
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.set({ isVerifyModeActive: active });
    } else {
      localStorage.setItem("isVerifyModeActive", active ? "true" : "false");
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
      setEditedCode(
        generateRecordedScript(recordedSteps, recordingUrl, langID, templates),
      );
    }
  }, [recordedSteps, recordingUrl, langID, isAutoSyncActive, templates]);

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
          chrome.tabs.sendMessage(tabId, msg, { frameId }, () => {
            const err = chrome.runtime.lastError;
            if (err) {
              console.warn(
                `Message send failed to frame ${frameId}:`,
                err.message,
              );
              removeFrameId(frameId);
            }
          });
        });
      } else {
        const options =
          selectedFrameId !== undefined ? { frameId: selectedFrameId } : {};
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
            "isVerifyModeActive",
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
            if (result.isVerifyModeActive !== undefined)
              setIsVerifyModeActive(result.isVerifyModeActive);
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
        const localVerifyActive =
          localStorage.getItem("isVerifyModeActive") === "true";
        setIsVerifyModeActive(localVerifyActive);
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
      if (changes.isVerifyModeActive) {
        setIsVerifyModeActive(changes.isVerifyModeActive.newValue);
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
                  Ortoni Studio will display optimized XPaths & action snippets
                  here.
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
                  Ortoni Studio will display optimized CSS selectors here.
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
                  Ortoni Studio will display Playwright-recommended locators
                  here.
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
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {!selectedElement ||
            !selectedElement.cypressLocators ||
            selectedElement.cypressLocators.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: "1.8rem", marginBottom: "4px" }}>
                  🌲
                </div>
                <div style={styles.emptyTitle}>
                  Select an element in Elements tab
                </div>
                <div style={styles.emptySubtitle}>
                  Ortoni Studio will display Cypress-recommended locators here.
                </div>
              </div>
            ) : (
              <div style={styles.locatorList}>
                {selectedElement.cypressLocators.map((item, idx) => {
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
                        title="Click to copy Cypress Locator"
                        onClick={() =>
                          copyToClipboard(value, "Cypress locator copied!")
                        }
                      >
                        {colorizePlaywright(value)}
                      </code>
                      <button
                        style={styles.btnVerifyInline}
                        onClick={() =>
                          handleVerifyLocator(
                            value.match(/cy\.get\('([^']+)'\)/)?.[1] ||
                              value.match(/cy\.contains\('([^']+)'\)/)?.[1] ||
                              value,
                          )
                        }
                        title="Verify and highlight element"
                      >
                        Find
                      </button>
                      <select
                        className="form-select select-sm"
                        style={styles.actionSelect}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                          const act = e.target.value;
                          if (act === "snippet") return;
                          let code = value;
                          if (act === "click") {
                            code = `${value}.click()`;
                          } else if (act === "type") {
                            code = `${value}.type('text')`;
                          } else if (act === "select") {
                            code = `${value}.select('value')`;
                          }
                          copyToClipboard(
                            code,
                            "Cypress action snippet copied!",
                          );
                          e.target.value = "snippet";
                        }}
                        defaultValue="snippet"
                      >
                        <option value="snippet" disabled>
                          Snippet
                        </option>
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
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <label
                    className="form-switch"
                    style={{
                      color: "#fff",
                      display: "inline-flex",
                      alignItems: "center",
                      cursor: "pointer",
                      margin: 0,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isVerifyModeActive}
                      onChange={(e) => handleToggleVerifyMode(e.target.checked)}
                    />
                    <i className="form-icon"></i>
                    <span
                      style={{
                        fontSize: "11px",
                        marginLeft: "4px",
                        fontWeight: 500,
                      }}
                    >
                      Verify Mode
                    </span>
                  </label>
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
                  ref={stepsContainerRef}
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
                                step.action === "click"
                                  ? "#0e639c"
                                  : step.action === "assert_visible"
                                    ? "#8b5cf6"
                                    : "#10b981",
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
                    <option value="cypress">Cypress</option>
                    <option value="custom">Custom Framework</option>
                  </select>
                </div>

                <div
                  style={{
                    flex: 1,
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {/* Editor Header / Toolbar */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: "#1a1a1a",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      border: "1px solid #2d2d2d",
                    }}
                  >
                    {/* Status Badge */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          backgroundColor: isAutoSyncActive
                            ? "#4ade80"
                            : "#ff9800",
                          display: "inline-block",
                        }}
                      />
                      <span
                        style={{
                          fontSize: "10px",
                          color: "#ccc",
                          fontWeight: 600,
                        }}
                      >
                        {isAutoSyncActive ? "Live Syncing" : "Manual Edit Mode"}
                      </span>
                    </div>

                    {/* Editor Mode Control */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {!isAutoSyncActive && (
                        <button
                          style={{
                            backgroundColor: "#0e639c",
                            color: "#fff",
                            border: "none",
                            borderRadius: "3px",
                            padding: "2px 6px",
                            fontSize: "10px",
                            cursor: "pointer",
                            fontWeight: 600,
                            marginRight: "4px",
                          }}
                          onClick={() => {
                            setEditedCode(
                              generateRecordedScript(
                                recordedSteps,
                                recordingUrl,
                                langID,
                                templates,
                              ),
                            );
                            setIsAutoSyncActive(true);
                          }}
                          title="Revert manual edits and resume auto-sync with recorded steps"
                        >
                          Sync & Reset
                        </button>
                      )}
                      <label
                        className="form-switch"
                        style={{
                          color: "#fff",
                          display: "inline-flex",
                          alignItems: "center",
                          cursor: "pointer",
                          margin: 0,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isAutoSyncActive}
                          onChange={(e) =>
                            setIsAutoSyncActive(e.target.checked)
                          }
                        />
                        <i className="form-icon"></i>
                        <span style={{ fontSize: "10px", marginLeft: "4px" }}>
                          Auto Sync
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Side-by-side Editor with Line Numbers */}
                  <div
                    style={{
                      display: "flex",
                      flex: 1,
                      backgroundColor: "#1e1e1e",
                      border: "1px solid #2d2d2d",
                      borderRadius: "4px",
                      minHeight: "260px",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Line Numbers Column */}
                    <div
                      ref={lineNumbersRef}
                      style={{
                        padding: "6px 8px",
                        backgroundColor: "#1a1a1a",
                        color: "#6e7681",
                        textAlign: "right",
                        fontFamily:
                          "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
                        fontSize: "10px",
                        lineHeight: "1.6",
                        userSelect: "none",
                        borderRight: "1px solid #2d2d2d",
                        overflow: "hidden",
                        whiteSpace: "pre",
                        minWidth: "24px",
                      }}
                    >
                      {editedCode
                        .split("\n")
                        .map((_, idx) => idx + 1)
                        .join("\n")}
                    </div>

                    {/* Editor Workspace Container */}
                    <div
                      style={{
                        position: "relative",
                        flex: 1,
                        display: "flex",
                        overflow: "hidden",
                      }}
                    >
                      {/* Highlighted Code (Behind) */}
                      <pre
                        ref={highlightRef}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          margin: 0,
                          padding: "6px 8px",
                          backgroundColor: "#1e1e1e",
                          color: "#d4d4d4",
                          fontFamily:
                            "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
                          fontSize: "10px",
                          lineHeight: "1.6",
                          whiteSpace: "pre",
                          overflow: "hidden",
                          pointerEvents: "none",
                          boxSizing: "border-box",
                        }}
                      >
                        {colorizeCode(editedCode, langID)}
                      </pre>

                      {/* Textarea Editor (On Top) */}
                      <textarea
                        ref={textareaRef}
                        value={editedCode}
                        onChange={handleEditorChange}
                        onScroll={handleEditorScroll}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          backgroundColor: "transparent",
                          color: "transparent",
                          caretColor: "#cccccc",
                          border: "none",
                          padding: "6px 8px",
                          fontFamily:
                            "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
                          fontSize: "10px",
                          lineHeight: "1.6",
                          resize: "none",
                          outline: "none",
                          overflowY: "auto",
                          whiteSpace: "pre",
                          boxSizing: "border-box",
                        }}
                        placeholder="/* Type or record steps to see script code */"
                      />
                    </div>
                  </div>

                  {/* Copy / Download Footer */}
                  <div
                    style={{ display: "flex", gap: "4px", marginTop: "6px" }}
                  >
                    <button
                      style={{ ...styles.btnFind, flex: 1 }}
                      onClick={() =>
                        copyToClipboard(
                          editedCode,
                          "Script copied to clipboard!",
                        )
                      }
                    >
                      Copy Script
                    </button>
                    <button
                      style={{ ...styles.btnClear, flex: 1 }}
                      onClick={() => handleDownloadScript(editedCode, langID)}
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
                alt="Ortoni Studio logo"
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
                  Ortoni Studio
                </span>
                <span style={{ color: "#858585", fontSize: "9px" }}>
                  {APPVERSION} • Open Source
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
                    Ortoni Studio is free & open-source. Consider donating to
                    help maintain it!
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

export default PanelApp;
