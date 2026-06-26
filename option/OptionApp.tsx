import React, { useState, useEffect } from "react";
import { colorizeCode } from "../panel/helpers";
import { APPVERSION } from "../panel/constants";
import { FRAMEWORKS } from "./constants";
import { styles } from "./styles";
import { GeneralTab } from "./components/GeneralTab";
import { SelectorsTab } from "./components/SelectorsTab";
import { TemplatesTab } from "./components/TemplatesTab";
import { EmailsTab } from "./components/EmailsTab";
import { AboutTab } from "./components/AboutTab";

interface TemplateGroup {
  click: string;
  send: string;
  text: string;
  attr: string;
}

const DEFAULT_TEMPLATES: Record<"jscs" | "javacs", TemplateGroup> = {
  jscs: {
    click: "private ${vn} = ${lc};\nasync clickOn${mn}(){\n  await this.click(this.${vn})\n}",
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

interface ChromeStorageResult {
  langID?: string;
  customLang?: "jscs" | "javacs";
  clickvalue?: string;
  sendvalue?: string;
  textvalue?: string;
  attrvalue?: string;
  selectorPriority?: string;
  emailProvider?: string;
  mailosaurApiKey?: string;
  mailosaurServerId?: string;
  theme?: "light" | "dark";
}

const OptionApp: React.FC = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [activeTab, setActiveTab] = useState<
    "general" | "selectors" | "templates" | "emails" | "about"
  >("general");

  // Email Opt Testing State
  const [emailProvider, setEmailProvider] = useState<"inboxkitten" | "maildrop" | "mailosaur">(
    "inboxkitten",
  );
  const [mailosaurApiKey, setMailosaurApiKey] = useState<string>("");
  const [mailosaurServerId, setMailosaurServerId] = useState<string>("");
  const [langID, setLangID] = useState<string>("javas");
  const [customLang, setCustomLang] = useState<"jscs" | "javacs">("javacs");
  const [clickvalue, setClickvalue] = useState<string>("");
  const [sendvalue, setSendvalue] = useState<string>("");
  const [textvalue, setTextvalue] = useState<string>("");
  const [attrvalue, setAttrvalue] = useState<string>("");
  const [selectorPriority, setSelectorPriority] = useState<string>("data-testid, id, name, class");

  // Interactive Tags manager state
  const [tagList, setTagList] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState<string>("");
  const [rawTextMode, setRawTextMode] = useState<boolean>(false);

  // Toast notifications state
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info";
  } | null>(null);

  // Sync state with chrome.storage.local / localStorage
  useEffect(() => {
    const parseTags = (str: string): string[] => {
      return str
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    };

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(
        [
          "langID",
          "customLang",
          "clickvalue",
          "sendvalue",
          "textvalue",
          "attrvalue",
          "selectorPriority",
          "emailProvider",
          "mailosaurApiKey",
          "mailosaurServerId",
          "theme",
        ],
        (result: ChromeStorageResult) => {
          if (result.langID) setLangID(result.langID);
          if (result.customLang) setCustomLang(result.customLang);
          if (result.emailProvider) setEmailProvider(result.emailProvider as any);
          if (result.mailosaurApiKey) setMailosaurApiKey(result.mailosaurApiKey);
          if (result.mailosaurServerId) setMailosaurServerId(result.mailosaurServerId);
          if (result.theme) setTheme(result.theme);

          const priority = result.selectorPriority || "data-testid, id, name, class";
          setSelectorPriority(priority);
          setTagList(parseTags(priority));

          const currentCustomLang = result.customLang || "javacs";
          setClickvalue(
            result.clickvalue !== undefined
              ? result.clickvalue
              : DEFAULT_TEMPLATES[currentCustomLang].click,
          );
          setSendvalue(
            result.sendvalue !== undefined
              ? result.sendvalue
              : DEFAULT_TEMPLATES[currentCustomLang].send,
          );
          setTextvalue(
            result.textvalue !== undefined
              ? result.textvalue
              : DEFAULT_TEMPLATES[currentCustomLang].text,
          );
          setAttrvalue(
            result.attrvalue !== undefined
              ? result.attrvalue
              : DEFAULT_TEMPLATES[currentCustomLang].attr,
          );
        },
      );
    } else {
      // Dev LocalStorage Fallback
      const localCustomLang = (localStorage.getItem("customLang") as "jscs" | "javacs") || "javacs";
      setLangID(localStorage.getItem("langID") || "javas");
      setCustomLang(localCustomLang);
      setEmailProvider((localStorage.getItem("emailProvider") as any) || "inboxkitten");
      setMailosaurApiKey(localStorage.getItem("mailosaurApiKey") || "");
      setMailosaurServerId(localStorage.getItem("mailosaurServerId") || "");
      const localTheme = localStorage.getItem("theme") as "light" | "dark";
      if (localTheme) setTheme(localTheme);

      const priority = localStorage.getItem("selectorPriority") || "data-testid, id, name, class";
      setSelectorPriority(priority);
      setTagList(parseTags(priority));

      setClickvalue(localStorage.getItem("clickvalue") || DEFAULT_TEMPLATES[localCustomLang].click);
      setSendvalue(localStorage.getItem("sendvalue") || DEFAULT_TEMPLATES[localCustomLang].send);
      setTextvalue(localStorage.getItem("textvalue") || DEFAULT_TEMPLATES[localCustomLang].text);
      setAttrvalue(localStorage.getItem("attrvalue") || DEFAULT_TEMPLATES[localCustomLang].attr);
    }

    const storageListener = (changes: any) => {
      if (changes.theme) {
        setTheme(changes.theme.newValue);
      }
    };
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(storageListener);
    }
    return () => {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.removeListener(storageListener);
      }
    };
  }, []);

  const handleCustomLangChange = (newLang: "jscs" | "javacs") => {
    setCustomLang(newLang);
    setClickvalue(DEFAULT_TEMPLATES[newLang].click);
    setSendvalue(DEFAULT_TEMPLATES[newLang].send);
    setTextvalue(DEFAULT_TEMPLATES[newLang].text);
    setAttrvalue(DEFAULT_TEMPLATES[newLang].attr);
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      langID,
      customLang,
      clickvalue,
      sendvalue,
      textvalue,
      attrvalue,
      selectorPriority,
    };

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set(data, () => {
        showToast("Settings saved successfully!", "success");
      });
    } else {
      Object.keys(data).forEach((key) =>
        localStorage.setItem(key, data[key as keyof typeof data] as string),
      );
      showToast("Settings saved to localStorage!", "info");
    }
  };

  const handleSaveEmails = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      emailProvider,
      mailosaurApiKey,
      mailosaurServerId,
    };

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set(data, () => {
        showToast("Email settings saved successfully!", "success");
      });
    } else {
      Object.keys(data).forEach((key) =>
        localStorage.setItem(key, data[key as keyof typeof data] as string),
      );
      showToast("Email settings saved to localStorage!", "info");
    }
  };

  const updateSelectorPriority = (newTags: string[]) => {
    setTagList(newTags);
    const priorityStr = newTags.join(", ");
    setSelectorPriority(priorityStr);

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ selectorPriority: priorityStr });
    } else {
      localStorage.setItem("selectorPriority", priorityStr);
    }
  };

  // Move tag left (higher priority / lower index)
  const moveTagLeft = (index: number) => {
    if (index === 0) return;
    const nextTags = [...tagList];
    const temp = nextTags[index];
    nextTags[index] = nextTags[index - 1];
    nextTags[index - 1] = temp;
    updateSelectorPriority(nextTags);
  };

  // Move tag right (lower priority / higher index)
  const moveTagRight = (index: number) => {
    if (index === tagList.length - 1) return;
    const nextTags = [...tagList];
    const temp = nextTags[index];
    nextTags[index] = nextTags[index + 1];
    nextTags[index + 1] = temp;
    updateSelectorPriority(nextTags);
  };

  // Delete tag
  const deleteTag = (index: number) => {
    const nextTags = tagList.filter((_, i) => i !== index);
    updateSelectorPriority(nextTags);
  };

  // Add new tag
  const addTag = () => {
    const cleaned = newTagInput.trim().toLowerCase();
    if (!cleaned) return;
    if (tagList.includes(cleaned)) {
      showToast(`"${cleaned}" is already in the list!`, "info");
      return;
    }
    const nextTags = [...tagList, cleaned];
    updateSelectorPriority(nextTags);
    setNewTagInput("");
  };

  // Reset to default selector priority
  const resetToDefaultPriority = () => {
    const defaults = ["data-testid", "id", "name", "class"];
    updateSelectorPriority(defaults);
    showToast("Reset to default priorities", "success");
  };

  const handleRawPriorityChange = (val: string) => {
    setSelectorPriority(val);
    const parsed = val
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    setTagList(parsed);

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ selectorPriority: val });
    } else {
      localStorage.setItem("selectorPriority", val);
    }
  };

  const showToast = (message: string, type: "success" | "info" = "success") => {
    setToast({ message, type });
  };

  const getCodeSample = (): string => {
    switch (langID) {
      case "playwrightJS":
        return `// Playwright Node snippet\nawait page.locator("css=button#submit-btn").click();`;
      case "playwrightJava":
        return `// Playwright Java snippet\npage.locator("css=button#submit-btn").click();`;
      case "javas":
        return `// Selenium Java snippet\nWebElement btn = driver.findElement(By.xpath("//button[@id='submit-btn']"));\nbtn.click();`;
      case "py":
        return `# Selenium Python snippet\nbtn = driver.find_element(By.XPATH, "//button[@id='submit-btn']")\nbtn.click()`;
      case "csharp":
        return `// Selenium C# snippet\nIWebElement btn = driver.FindElement(By.XPath("//button[@id='submit-btn']"));\nbtn.Click();`;
      case "protractorjs":
        return `// Protractor JS snippet\nlet btn = element(by.xpath("//button[@id='submit-btn']"));\nawait btn.click();`;
      case "cypress":
        return `// Cypress snippet\ncy.get("button#submit-btn").click();`;
      case "custom":
        return `// Custom Framework Templates Active\n// Active Paradigm: ${customLang === "jscs" ? "JS/TS Protractor" : "Selenium Java POM"}`;
      default:
        return `driver.findElement(By.xpath("//button[@id='submit-btn']")).click();`;
    }
  };

  // Compile individual templates
  const compileTemplate = (tmpl: string, vn: string, lc: string, mn: string): string => {
    if (!tmpl) return "";
    return tmpl
      .replace(/\${vn}/g, vn)
      .replace(/\${lc}/g, lc)
      .replace(/\${mn}/g, mn);
  };

  return (
    <div className={theme === "light" ? "theme-light" : "theme-dark"} style={styles.appContainer}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .theme-light {
          --bg-primary: #f3f4f6;
          --bg-secondary: #ffffff;
          --bg-card: #ffffff;
          --border-color: #e5e7eb;
          --color-primary: #4f46e5;
          --color-primary-hover: #4338ca;
          --color-primary-tint: rgba(79, 70, 229, 0.08);
          --text-primary: #1f2937;
          --text-secondary: #4b5563;
          --text-light: #ffffff;
          --color-alert: #ef4444;
          --color-success: #10b981;
        }
        .theme-dark {
          --bg-primary: #090d16;
          --bg-secondary: #111827;
          --bg-card: #1f2937;
          --border-color: #374151;
          --color-primary: #6366f1;
          --color-primary-hover: #818cf8;
          --color-primary-tint: rgba(99, 102, 241, 0.15);
          --text-primary: #f3f4f6;
          --text-secondary: #9ca3af;
          --text-light: #ffffff;
          --color-alert: #f87171;
          --color-success: #34d399;
        }

        body {
          margin: 0;
          background-color: var(--bg-primary) !important;
          color: var(--text-primary);
          overflow-x: hidden;
        }

        /* Scrollbar Styling */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: var(--bg-primary);
        }
        ::-webkit-scrollbar-thumb {
          background: var(--color-primary-tint);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: var(--color-primary);
        }

        /* Hover animations and transitions */
        .sidebar-btn {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .sidebar-btn:hover {
          background-color: var(--color-primary-tint);
          color: var(--color-primary) !important;
          transform: translateX(4px);
        }

        .framework-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        .framework-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px var(--color-primary-tint);
          border-color: var(--color-primary) !important;
        }
        .framework-card.active {
          border-color: var(--color-primary) !important;
          background: linear-gradient(145deg, var(--color-primary-tint) 0%, var(--bg-card) 100%) !important;
          box-shadow: 0 8px 20px var(--color-primary-tint);
        }

        .priority-pill {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .priority-pill:hover {
          transform: scale(1.03);
          background-color: var(--bg-card) !important;
          box-shadow: 0 4px 12px var(--color-primary-tint);
        }

        .form-select, .form-input, .form-textarea {
          transition: border-color 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease;
          background-color: var(--bg-card) !important;
          border: 1px solid var(--border-color) !important;
          color: var(--text-primary) !important;
          border-radius: 8px !important;
          padding: 10px 14px !important;
          font-size: 13px !important;
        }
        .form-select:focus, .form-input:focus, .form-textarea:focus {
          border-color: var(--color-primary) !important;
          box-shadow: 0 0 0 3px var(--color-primary-tint) !important;
          background-color: var(--bg-card) !important;
          outline: none;
        }

        .btn-gradient {
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%) !important;
          border: none !important;
          border-radius: 8px !important;
          color: var(--text-light) !important;
          font-weight: 600 !important;
          padding: 12px 24px !important;
          cursor: pointer !important;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
          box-shadow: 0 4px 14px var(--color-primary-tint) !important;
        }
        .btn-gradient:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px var(--color-primary-tint) !important;
          filter: brightness(1.05);
        }
        .btn-gradient:active {
          transform: translateY(1px);
        }

        .btn-outline {
          background: transparent !important;
          border: 1px solid var(--color-primary) !important;
          border-radius: 8px !important;
          color: var(--color-primary) !important;
          font-weight: 500 !important;
          padding: 10px 20px !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
        }
        .btn-outline:hover {
          border-color: var(--color-primary-hover) !important;
          background-color: var(--color-primary-tint) !important;
        }

        /* Toast slide-in/out */
        @keyframes slideIn {
          from {
            transform: translateY(30px) scale(0.9);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        .toast-popup {
          animation: slideIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
        }

        .ambient-mesh {
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, var(--color-primary-tint) 0%, rgba(235, 235, 211, 0.02) 50%, transparent 100%);
          top: -200px;
          right: -200px;
          z-index: -1;
          pointer-events: none;
          filter: blur(80px);
        }
      `,
        }}
      />

      {/* Background ambient light */}
      <div className="ambient-mesh" />

      {/* Floating Animated Toast */}
      {toast && (
        <div
          className="toast-popup"
          style={{
            position: "fixed",
            bottom: "30px",
            right: "30px",
            zIndex: 9999,
            padding: "14px 24px",
            borderRadius: "12px",
            boxShadow: "0 12px 36px rgba(0,0,0,0.5)",
            border: `1px solid ${toast.type === "success" ? "#10b981" : "#3b82f6"}`,
            background: "rgba(13, 17, 23, 0.95)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span
            style={{
              color: toast.type === "success" ? "#10b981" : "#3b82f6",
              fontSize: "18px",
              fontWeight: "bold",
            }}
          >
            {toast.type === "success" ? "✓" : "ℹ"}
          </span>
          <span style={{ fontWeight: "500", color: "#fff", fontSize: "13.5px" }}>
            {toast.message}
          </span>
          <button
            onClick={() => setToast(null)}
            style={{
              background: "none",
              border: "none",
              color: "#8b949e",
              cursor: "pointer",
              marginLeft: "12px",
              fontSize: "16px",
              padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Settings Grid Structure */}
      <div style={styles.dashboardContainer}>
        {/* Left Sidebar */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarBrand}>
            <img
              src="../assets/ortoni-studio-logo.png"
              alt="Ortoni Studio Logo"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                objectFit: "contain",
                boxShadow: "0 4px 12px var(--color-primary-tint)",
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={styles.brandTitle}>Ortoni Studio</div>
              <div style={styles.brandSubtitle}>Developer settings</div>
            </div>
            <div
              style={{
                cursor: "pointer",
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px",
                borderRadius: "50%",
                transition: "background-color 0.2s",
              }}
              onClick={() => {
                const nextTheme = theme === "light" ? "dark" : "light";
                setTheme(nextTheme);
                if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
                  chrome.storage.local.set({ theme: nextTheme });
                } else {
                  localStorage.setItem("theme", nextTheme);
                }
              }}
              title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            >
              {theme === "light" ? "🌙" : "☀️"}
            </div>
          </div>

          <div style={styles.navGroup}>
            <button
              className="sidebar-btn"
              onClick={() => setActiveTab("general")}
              style={{
                ...styles.sidebarLink,
                backgroundColor:
                  activeTab === "general" ? "var(--color-primary-tint)" : "transparent",
                color: activeTab === "general" ? "var(--color-primary)" : "var(--text-secondary)",
                borderLeft:
                  activeTab === "general"
                    ? "4px solid var(--color-primary)"
                    : "4px solid transparent",
              }}
            >
              <span style={{ marginRight: "10px" }}>⚙️</span> Snippet Framework
            </button>
            <button
              className="sidebar-btn"
              onClick={() => setActiveTab("selectors")}
              style={{
                ...styles.sidebarLink,
                backgroundColor:
                  activeTab === "selectors" ? "var(--color-primary-tint)" : "transparent",
                color: activeTab === "selectors" ? "var(--color-primary)" : "var(--text-secondary)",
                borderLeft:
                  activeTab === "selectors"
                    ? "4px solid var(--color-primary)"
                    : "4px solid transparent",
              }}
            >
              <span style={{ marginRight: "10px" }}>🎯</span> Selector Priorities
            </button>
            <button
              className="sidebar-btn"
              onClick={() => setActiveTab("templates")}
              style={{
                ...styles.sidebarLink,
                backgroundColor:
                  activeTab === "templates" ? "var(--color-primary-tint)" : "transparent",
                color: activeTab === "templates" ? "var(--color-primary)" : "var(--text-secondary)",
                borderLeft:
                  activeTab === "templates"
                    ? "4px solid var(--color-primary)"
                    : "4px solid transparent",
              }}
            >
              <span style={{ marginRight: "10px" }}>📝</span> Custom Templates
            </button>
            <button
              className="sidebar-btn"
              onClick={() => setActiveTab("emails")}
              style={{
                ...styles.sidebarLink,
                backgroundColor:
                  activeTab === "emails" ? "var(--color-primary-tint)" : "transparent",
                color: activeTab === "emails" ? "var(--color-primary)" : "var(--text-secondary)",
                borderLeft:
                  activeTab === "emails"
                    ? "4px solid var(--color-primary)"
                    : "4px solid transparent",
              }}
            >
              <span style={{ marginRight: "10px" }}>✉️</span> Email Testing
            </button>
            <button
              className="sidebar-btn"
              onClick={() => setActiveTab("about")}
              style={{
                ...styles.sidebarLink,
                backgroundColor:
                  activeTab === "about" ? "var(--color-primary-tint)" : "transparent",
                color: activeTab === "about" ? "var(--color-primary)" : "var(--text-secondary)",
                borderLeft:
                  activeTab === "about"
                    ? "4px solid var(--color-primary)"
                    : "4px solid transparent",
              }}
            >
              <span style={{ marginRight: "10px" }}>ℹ️</span> About Extension
            </button>
          </div>

          <div style={styles.sidebarFooter}>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
              Ortoni Studio Project
            </div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "var(--text-secondary)",
                marginTop: "2px",
              }}
            >
              {APPVERSION}
            </div>
          </div>
        </div>

        {/* Main Panel Content */}
        <div style={styles.mainPanel}>
          {activeTab === "general" && (
            <GeneralTab
              langID={langID}
              setLangID={setLangID}
              showToast={showToast}
              getCodeSample={getCodeSample}
            />
          )}

          {activeTab === "selectors" && (
            <SelectorsTab
              rawTextMode={rawTextMode}
              setRawTextMode={setRawTextMode}
              resetToDefaultPriority={resetToDefaultPriority}
              tagList={tagList}
              moveTagLeft={moveTagLeft}
              moveTagRight={moveTagRight}
              deleteTag={deleteTag}
              newTagInput={newTagInput}
              setNewTagInput={setNewTagInput}
              addTag={addTag}
              selectorPriority={selectorPriority}
              handleRawPriorityChange={handleRawPriorityChange}
            />
          )}

          {activeTab === "templates" && (
            <TemplatesTab
              customLang={customLang}
              handleCustomLangChange={handleCustomLangChange}
              clickvalue={clickvalue}
              setClickvalue={setClickvalue}
              sendvalue={sendvalue}
              setSendvalue={setSendvalue}
              textvalue={textvalue}
              setTextvalue={setTextvalue}
              attrvalue={attrvalue}
              setAttrvalue={setAttrvalue}
              handleSaveAll={handleSaveAll}
            />
          )}

          {activeTab === "emails" && (
            <EmailsTab
              emailProvider={emailProvider}
              setEmailProvider={setEmailProvider}
              mailosaurApiKey={mailosaurApiKey}
              setMailosaurApiKey={setMailosaurApiKey}
              mailosaurServerId={mailosaurServerId}
              setMailosaurServerId={setMailosaurServerId}
              handleSaveEmails={handleSaveEmails}
            />
          )}

          {activeTab === "about" && <AboutTab />}
        </div>
      </div>
    </div>
  );
};

export default OptionApp;
