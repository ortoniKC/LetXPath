import React, { useState, useEffect } from "react";
import { colorizeCode } from "../panel/helpers";
import { APPVERSION } from "../panel/constants";

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
}

interface FrameworkOption {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  accent: string;
}

const FRAMEWORKS: FrameworkOption[] = [
  {
    id: "javas",
    name: "Selenium Java",
    subtitle: "Standard Java WebDriver actions",
    icon: "☕",
    accent: "24, 95%, 52%",
  },
  {
    id: "playwrightJS",
    name: "Playwright (Node)",
    subtitle: "Modern JS/TS test framework",
    icon: "🎭",
    accent: "168, 100%, 40%",
  },
  {
    id: "playwrightJava",
    name: "Playwright (Java)",
    subtitle: "Java bindings for Playwright API",
    icon: "🚀",
    accent: "200, 100%, 50%",
  },
  {
    id: "py",
    name: "Selenium Python",
    subtitle: "Python bindings for Selenium",
    icon: "🐍",
    accent: "45, 100%, 48%",
  },
  {
    id: "csharp",
    name: "Selenium C#",
    subtitle: "C# .NET driver actions",
    icon: "🎯",
    accent: "265, 100%, 65%",
  },
  {
    id: "protractorjs",
    name: "Protractor (Angular)",
    subtitle: "Angular E2E automation library",
    icon: "🛡️",
    accent: "350, 100%, 60%",
  },
  {
    id: "cypress",
    name: "Cypress",
    subtitle: "Developer-friendly web test runner",
    icon: "🌲",
    accent: "160, 100%, 40%",
  },
  {
    id: "custom",
    name: "Custom Framework",
    subtitle: "Define your own POM structures",
    icon: "🛠️",
    accent: "38, 92%, 50%",
  },
];

const OptionApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"general" | "selectors" | "templates" | "about">(
    "general",
  );
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
        ],
        (result: ChromeStorageResult) => {
          if (result.langID) setLangID(result.langID);
          if (result.customLang) setCustomLang(result.customLang);

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

      const priority = localStorage.getItem("selectorPriority") || "data-testid, id, name, class";
      setSelectorPriority(priority);
      setTagList(parseTags(priority));

      setClickvalue(localStorage.getItem("clickvalue") || DEFAULT_TEMPLATES[localCustomLang].click);
      setSendvalue(localStorage.getItem("sendvalue") || DEFAULT_TEMPLATES[localCustomLang].send);
      setTextvalue(localStorage.getItem("textvalue") || DEFAULT_TEMPLATES[localCustomLang].text);
      setAttrvalue(localStorage.getItem("attrvalue") || DEFAULT_TEMPLATES[localCustomLang].attr);
    }
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
    <div style={styles.appContainer}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        body {
          margin: 0;
          background-color: #080b10 !important;
          color: #c9d1d9;
          overflow-x: hidden;
        }

        /* Scrollbar Styling */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #080b10;
        }
        ::-webkit-scrollbar-thumb {
          background: #21262d;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #30363d;
        }

        /* Hover animations and transitions */
        .sidebar-btn {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .sidebar-btn:hover {
          background-color: rgba(255, 255, 255, 0.05);
          color: #ffffff !important;
          transform: translateX(4px);
        }

        .framework-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        .framework-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5), 0 0 15px rgba(56, 189, 248, 0.15);
          border-color: #38bdf8 !important;
        }
        .framework-card.active {
          border-color: #4f46e5 !important;
          background: linear-gradient(145deg, rgba(79, 70, 229, 0.1) 0%, rgba(17, 24, 39, 0.7) 100%) !important;
          box-shadow: 0 12px 30px rgba(79, 70, 229, 0.2), 0 0 25px rgba(79, 70, 229, 0.15);
        }

        .priority-pill {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .priority-pill:hover {
          transform: scale(1.03);
          background-color: #1f2937 !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .form-select, .form-input, .form-textarea {
          transition: border-color 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease;
          background-color: #0d1117 !important;
          border: 1px solid #21262d !important;
          color: #c9d1d9 !important;
          border-radius: 8px !important;
          padding: 10px 14px !important;
          font-size: 13px !important;
        }
        .form-select:focus, .form-input:focus, .form-textarea:focus {
          border-color: #4f46e5 !important;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.25) !important;
          background-color: #121824 !important;
          outline: none;
        }

        .btn-gradient {
          background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%) !important;
          border: none !important;
          border-radius: 8px !important;
          color: #ffffff !important;
          font-weight: 600 !important;
          padding: 12px 24px !important;
          cursor: pointer !important;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
          box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35) !important;
        }
        .btn-gradient:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(79, 70, 229, 0.5) !important;
          filter: brightness(1.1);
        }
        .btn-gradient:active {
          transform: translateY(1px);
        }

        .btn-outline {
          background: transparent !important;
          border: 1px solid #30363d !important;
          border-radius: 8px !important;
          color: #c9d1d9 !important;
          font-weight: 500 !important;
          padding: 10px 20px !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
        }
        .btn-outline:hover {
          border-color: #8b949e !important;
          background-color: rgba(255, 255, 255, 0.03) !important;
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
          background: radial-gradient(circle, rgba(79, 70, 229, 0.08) 0%, rgba(59, 130, 246, 0.05) 50%, transparent 100%);
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
            <div style={styles.logoBadge}>L</div>
            <div>
              <div style={styles.brandTitle}>Ortoni Studio</div>
              <div style={styles.brandSubtitle}>Developer settings</div>
            </div>
          </div>

          <div style={styles.navGroup}>
            <button
              className="sidebar-btn"
              onClick={() => setActiveTab("general")}
              style={{
                ...styles.sidebarLink,
                backgroundColor:
                  activeTab === "general" ? "rgba(79, 70, 229, 0.12)" : "transparent",
                color: activeTab === "general" ? "#38bdf8" : "#8b949e",
                borderLeft: activeTab === "general" ? "4px solid #4f46e5" : "4px solid transparent",
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
                  activeTab === "selectors" ? "rgba(79, 70, 229, 0.12)" : "transparent",
                color: activeTab === "selectors" ? "#38bdf8" : "#8b949e",
                borderLeft:
                  activeTab === "selectors" ? "4px solid #4f46e5" : "4px solid transparent",
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
                  activeTab === "templates" ? "rgba(79, 70, 229, 0.12)" : "transparent",
                color: activeTab === "templates" ? "#38bdf8" : "#8b949e",
                borderLeft:
                  activeTab === "templates" ? "4px solid #4f46e5" : "4px solid transparent",
              }}
            >
              <span style={{ marginRight: "10px" }}>📝</span> Custom Templates
            </button>
            <button
              className="sidebar-btn"
              onClick={() => setActiveTab("about")}
              style={{
                ...styles.sidebarLink,
                backgroundColor: activeTab === "about" ? "rgba(79, 70, 229, 0.12)" : "transparent",
                color: activeTab === "about" ? "#38bdf8" : "#8b949e",
                borderLeft: activeTab === "about" ? "4px solid #4f46e5" : "4px solid transparent",
              }}
            >
              <span style={{ marginRight: "10px" }}>ℹ️</span> About Extension
            </button>
          </div>

          <div style={styles.sidebarFooter}>
            <div style={{ fontSize: "11px", color: "#484f58" }}>Ortoni Studio Project</div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "#8b949e",
                marginTop: "2px",
              }}
            >
              {APPVERSION}
            </div>
          </div>
        </div>

        {/* Main Panel Content */}
        <div style={styles.mainPanel}>
          {/* TAB 1: GENERAL (Snippet Target Framework Selection) */}
          {activeTab === "general" && (
            <div style={styles.tabContent}>
              <div style={styles.sectionHeader}>
                <h1 style={styles.mainTitle}>Snippet Frameworks</h1>
                <p style={styles.mainSubtitle}>
                  Choose the default test automation framework generated when copying locators.
                </p>
              </div>

              {/* Frameworks grid selection */}
              <div style={styles.frameworksGrid}>
                {FRAMEWORKS.map((f) => {
                  const isActive = langID === f.id;
                  return (
                    <div
                      key={f.id}
                      onClick={() => {
                        setLangID(f.id);
                        if (
                          typeof chrome !== "undefined" &&
                          chrome.storage &&
                          chrome.storage.local
                        ) {
                          chrome.storage.local.set({ langID: f.id });
                        } else {
                          localStorage.setItem("langID", f.id);
                        }
                        showToast(`Target framework switched to ${f.name}`);
                      }}
                      className={`framework-card ${isActive ? "active" : ""}`}
                      style={{
                        ...styles.frameworkCard,
                        border: isActive ? "1px solid #4f46e5" : "1px solid #21262d",
                      }}
                    >
                      <div style={styles.cardHighlightDot} />
                      <div
                        style={{
                          ...styles.cardIconBox,
                          backgroundColor: `rgba(${f.accent}, 0.1)`,
                          color: `rgb(${f.accent})`,
                          border: `1px solid rgba(${f.accent}, 0.25)`,
                        }}
                      >
                        {f.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={styles.cardFrameworkName}>{f.name}</div>
                        <div style={styles.cardFrameworkSubtitle}>{f.subtitle}</div>
                      </div>
                      {isActive && <div style={styles.cardActiveCheck}>✓</div>}
                    </div>
                  );
                })}
              </div>

              {/* Live Preview Panel */}
              <div style={styles.previewContainer}>
                <div style={styles.previewHeader}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span style={styles.pulseDot} />
                    <span
                      style={{
                        fontSize: "11px",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        fontWeight: "bold",
                        color: "#8b949e",
                      }}
                    >
                      Output Syntax Preview ({langID})
                    </span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#58a6ff" }}>Auto-compiles instantly</div>
                </div>
                <div style={styles.previewBody}>
                  <pre style={styles.codePre}>
                    <code>{colorizeCode(getCodeSample(), langID)}</code>
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SELECTORS PRIORITIZATION */}
          {activeTab === "selectors" && (
            <div style={styles.tabContent}>
              <div style={styles.sectionHeader}>
                <h1 style={styles.mainTitle}>Attribute Prioritization</h1>
                <p style={styles.mainSubtitle}>
                  Define the order in which HTML attributes are queried to find unique web elements.
                </p>
              </div>

              <div style={styles.card}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: "15px", color: "#ffffff" }}>
                    Priority Order List
                  </h3>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      className="btn-outline"
                      onClick={() => setRawTextMode(!rawTextMode)}
                      style={{ padding: "6px 12px", fontSize: "12px" }}
                    >
                      {rawTextMode ? "🌐 Interactive Mode" : "✏️ Raw Text Edit"}
                    </button>
                    <button
                      className="btn-outline"
                      onClick={resetToDefaultPriority}
                      style={{ padding: "6px 12px", fontSize: "12px" }}
                    >
                      ↺ Restore Default
                    </button>
                  </div>
                </div>

                {!rawTextMode ? (
                  <>
                    <div
                      style={{
                        color: "#8b949e",
                        fontSize: "13px",
                        marginBottom: "16px",
                        lineHeight: "1.4",
                      }}
                    >
                      Drag-style order list. Use the{" "}
                      <strong style={{ color: "#58a6ff" }}>left (◂)</strong> and{" "}
                      <strong style={{ color: "#58a6ff" }}>right (▸)</strong> buttons on each badge
                      to change priorities. Ortoni Studio evaluates from left to right.
                    </div>

                    <div style={styles.priorityPillContainer}>
                      {tagList.map((tag, idx) => (
                        <div key={tag + idx} className="priority-pill" style={styles.priorityPill}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "11px",
                                color: "#8b949e",
                                fontWeight: "bold",
                              }}
                            >
                              {idx + 1}
                            </span>
                            <span style={{ color: "#ffffff", fontWeight: "500" }}>{tag}</span>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              gap: "2px",
                              borderLeft: "1px solid #30363d",
                              paddingLeft: "8px",
                              marginLeft: "4px",
                            }}
                          >
                            <button
                              onClick={() => moveTagLeft(idx)}
                              disabled={idx === 0}
                              style={{
                                ...styles.pillButton,
                                opacity: idx === 0 ? 0.3 : 1,
                                cursor: idx === 0 ? "not-allowed" : "pointer",
                              }}
                              title="Increase priority"
                            >
                              ◂
                            </button>
                            <button
                              onClick={() => moveTagRight(idx)}
                              disabled={idx === tagList.length - 1}
                              style={{
                                ...styles.pillButton,
                                opacity: idx === tagList.length - 1 ? 0.3 : 1,
                                cursor: idx === tagList.length - 1 ? "not-allowed" : "pointer",
                              }}
                              title="Decrease priority"
                            >
                              ▸
                            </button>
                            <button
                              onClick={() => deleteTag(idx)}
                              style={{
                                ...styles.pillButton,
                                color: "#ff5f56",
                                fontWeight: "bold",
                              }}
                              title="Delete attribute"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Tag Section */}
                    <div style={styles.addTagWrapper}>
                      <input
                        type="text"
                        className="form-input"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") addTag();
                        }}
                        placeholder="e.g. data-cy, alt, role"
                        style={{ flex: 1, maxWidth: "240px" }}
                      />
                      <button
                        className="btn-gradient"
                        onClick={addTag}
                        style={{ padding: "10px 18px", fontSize: "12px" }}
                      >
                        + Add Attribute
                      </button>
                    </div>
                  </>
                ) : (
                  <div>
                    <label
                      style={{
                        display: "block",
                        color: "#8b949e",
                        fontSize: "13px",
                        marginBottom: "8px",
                      }}
                    >
                      Comma separated attribute string:
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={selectorPriority}
                      onChange={(e) => handleRawPriorityChange(e.target.value)}
                      placeholder="e.g. data-testid, id, name, class"
                      style={{ width: "100%", boxSizing: "border-box" }}
                    />
                    <div
                      style={{
                        color: "#8b949e",
                        fontSize: "12px",
                        marginTop: "8px",
                      }}
                    >
                      Recommended:{" "}
                      <code style={{ color: "#58a6ff" }}>
                        data-testid, data-cy, id, name, class
                      </code>
                    </div>
                  </div>
                )}
              </div>

              {/* Informational Guidance Panel */}
              <div style={styles.infoCard}>
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: "bold",
                    color: "#ffffff",
                    marginBottom: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span>💡</span> How Prioritization Works
                </div>
                <div
                  style={{
                    color: "#c9d1d9",
                    fontSize: "13px",
                    lineHeight: "1.6",
                  }}
                >
                  When Ortoni Studio scans a web element on a page, it loops through your
                  prioritized list of attributes. If it finds a unique element using the highest
                  priority attribute (e.g. <code style={styles.codeText}>data-testid</code>), it
                  creates a selector instantly. If that fails or is non-unique, it proceeds to the
                  next attribute in the list. Setting test-ids at the top ensures robust locator
                  generation.
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM POM TEMPLATES BUILDER */}
          {activeTab === "templates" && (
            <div style={styles.tabContent}>
              <div style={styles.sectionHeader}>
                <h1 style={styles.mainTitle}>Custom Page Object Templates</h1>
                <p style={styles.mainSubtitle}>
                  Configure dynamic structural templates to match your internal framework design
                  patterns.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1fr",
                  gap: "20px",
                }}
              >
                {/* Form fields */}
                <div style={styles.card}>
                  <form
                    onSubmit={handleSaveAll}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "13px",
                          fontWeight: "600",
                          color: "#8b949e",
                          marginBottom: "8px",
                        }}
                      >
                        Framework Target Language
                      </label>
                      <div style={styles.radioContainer}>
                        <label style={styles.radioLabel}>
                          <input
                            type="radio"
                            name="customLangType"
                            checked={customLang === "jscs"}
                            onChange={() => handleCustomLangChange("jscs")}
                            style={{ marginRight: "8px" }}
                          />
                          Protractor JS/TS
                        </label>
                        <label style={styles.radioLabel}>
                          <input
                            type="radio"
                            name="customLangType"
                            checked={customLang === "javacs"}
                            onChange={() => handleCustomLangChange("javacs")}
                            style={{ marginRight: "8px" }}
                          />
                          Selenium Java / POM
                        </label>
                      </div>
                    </div>

                    <div>
                      <div style={styles.textareaHeader}>
                        <span>Click Template</span>
                        <span style={styles.textareaTag}>{"${vn}, ${lc}, ${mn}"}</span>
                      </div>
                      <textarea
                        className="form-textarea"
                        rows={3}
                        value={clickvalue}
                        onChange={(e) => setClickvalue(e.target.value)}
                        placeholder="Click template string"
                        style={styles.codeTextarea}
                      />
                    </div>

                    <div>
                      <div style={styles.textareaHeader}>
                        <span>sendKeys Template</span>
                        <span style={styles.textareaTag}>{"${vn}, ${lc}, ${mn}"}</span>
                      </div>
                      <textarea
                        className="form-textarea"
                        rows={3}
                        value={sendvalue}
                        onChange={(e) => setSendvalue(e.target.value)}
                        placeholder="SendKeys template"
                        style={styles.codeTextarea}
                      />
                    </div>

                    <div>
                      <div style={styles.textareaHeader}>
                        <span>getText Template</span>
                        <span style={styles.textareaTag}>{"${vn}, ${lc}, ${mn}"}</span>
                      </div>
                      <textarea
                        className="form-textarea"
                        rows={3}
                        value={textvalue}
                        onChange={(e) => setTextvalue(e.target.value)}
                        placeholder="GetText template"
                        style={styles.codeTextarea}
                      />
                    </div>

                    <div>
                      <div style={styles.textareaHeader}>
                        <span>getAttribute Template</span>
                        <span style={styles.textareaTag}>{"${vn}, ${lc}, ${mn}"}</span>
                      </div>
                      <textarea
                        className="form-textarea"
                        rows={3}
                        value={attrvalue}
                        onChange={(e) => setAttrvalue(e.target.value)}
                        placeholder="GetAttribute template"
                        style={styles.codeTextarea}
                      />
                    </div>

                    <button type="submit" className="btn-gradient" style={{ marginTop: "10px" }}>
                      💾 Save Custom Templates
                    </button>
                  </form>
                </div>

                {/* Guide & Real-time Compilation Preview */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                  }}
                >
                  {/* Real-time Compiler Playground */}
                  <div style={styles.card}>
                    <h3
                      style={{
                        margin: "0 0 4px 0",
                        fontSize: "15px",
                        color: "#ffffff",
                      }}
                    >
                      Playground Compiler
                    </h3>
                    <p
                      style={{
                        margin: "0 0 16px 0",
                        fontSize: "12px",
                        color: "#8b949e",
                      }}
                    >
                      Mock Element: <code style={{ color: "#58a6ff" }}>button#login-btn</code>,
                      locator: <code style={{ color: "#58a6ff" }}>"//button[@id='login']"</code>
                    </p>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "14px",
                      }}
                    >
                      <div>
                        <div style={styles.compilerLabel}>Compiled Click Action</div>
                        <div style={styles.compilerBox}>
                          <pre style={{ margin: 0 }}>
                            <code>
                              {colorizeCode(
                                compileTemplate(
                                  clickvalue,
                                  "loginBtn",
                                  customLang === "jscs"
                                    ? `element(by.id('login'))`
                                    : `By.xpath("//button[@id='login']")`,
                                  "LoginBtn",
                                ),
                                customLang === "jscs" ? "protractorjs" : "javas",
                              )}
                            </code>
                          </pre>
                        </div>
                      </div>

                      <div>
                        <div style={styles.compilerLabel}>Compiled SendKeys Action</div>
                        <div style={styles.compilerBox}>
                          <pre style={{ margin: 0 }}>
                            <code>
                              {colorizeCode(
                                compileTemplate(
                                  sendvalue,
                                  "loginBtn",
                                  customLang === "jscs"
                                    ? `element(by.id('login'))`
                                    : `By.xpath("//button[@id='login']")`,
                                  "LoginBtn",
                                ),
                                customLang === "jscs" ? "protractorjs" : "javas",
                              )}
                            </code>
                          </pre>
                        </div>
                      </div>

                      <div>
                        <div style={styles.compilerLabel}>Compiled GetText Action</div>
                        <div style={styles.compilerBox}>
                          <pre style={{ margin: 0 }}>
                            <code>
                              {colorizeCode(
                                compileTemplate(
                                  textvalue,
                                  "loginBtn",
                                  customLang === "jscs"
                                    ? `element(by.id('login'))`
                                    : `By.xpath("//button[@id='login']")`,
                                  "LoginBtn",
                                ),
                                customLang === "jscs" ? "protractorjs" : "javas",
                              )}
                            </code>
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Token Reference Table */}
                  <div style={styles.card}>
                    <h3
                      style={{
                        margin: "0 0 12px 0",
                        fontSize: "15px",
                        color: "#ffffff",
                      }}
                    >
                      Available Variables
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <div style={styles.tokenRow}>
                        <code style={styles.tokenCode}>{"${lc}"}</code>
                        <div style={styles.tokenDesc}>
                          Evaluates to the selector/locator expression.
                        </div>
                      </div>
                      <div style={styles.tokenRow}>
                        <code style={styles.tokenCode}>{"${vn}"}</code>
                        <div style={styles.tokenDesc}>
                          Camel-cased variable name (e.g. loginButton).
                        </div>
                      </div>
                      <div style={styles.tokenRow}>
                        <code style={styles.tokenCode}>{"${mn}"}</code>
                        <div style={styles.tokenDesc}>Method suffix string (e.g. LoginButton).</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ABOUT PAGE */}
          {activeTab === "about" && (
            <div style={styles.tabContent}>
              <div style={styles.sectionHeader}>
                <h1 style={styles.mainTitle}>About Ortoni Studio</h1>
                <p style={styles.mainSubtitle}>
                  Learn more about the extension and get resources for automation testing.
                </p>
              </div>

              <div style={styles.card}>
                <div
                  style={{
                    display: "flex",
                    gap: "20px",
                    alignItems: "center",
                    marginBottom: "24px",
                    paddingBottom: "20px",
                    borderBottom: "1px solid #21262d",
                  }}
                >
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "16px",
                      background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "32px",
                      color: "#ffffff",
                      fontWeight: "bold",
                      boxShadow: "0 8px 24px rgba(79, 70, 229, 0.4)",
                    }}
                  >
                    L
                  </div>
                  <div>
                    <h2
                      style={{
                        margin: "0 0 4px 0",
                        color: "#ffffff",
                        fontSize: "20px",
                      }}
                    >
                      Ortoni Studio Pro
                    </h2>
                    <div style={{ color: "#8b949e", fontSize: "13px" }}>
                      Open Source XPath & Selector Tool • Version 3.0.2
                    </div>
                  </div>
                </div>

                <h3
                  style={{
                    color: "#ffffff",
                    fontSize: "16px",
                    margin: "0 0 10px 0",
                  }}
                >
                  Core Features
                </h3>
                <ul
                  style={{
                    color: "#c9d1d9",
                    fontSize: "13.5px",
                    lineHeight: "1.8",
                    margin: "0 0 24px 0",
                    paddingLeft: "20px",
                  }}
                >
                  <li>Generate reliable XPath expressions & CSS locators instantly.</li>
                  <li>
                    Support for Cypress, Playwright, Selenium (Java, C#, Python), and Protractor.
                  </li>
                  <li>Interactive smart recorder which compiles script actions into full tests.</li>
                  <li>Dynamic WebTable parsing and locator prioritization setup.</li>
                  <li>100% open-source and local storage secured.</li>
                </ul>

                <h3
                  style={{
                    color: "#ffffff",
                    fontSize: "16px",
                    margin: "0 0 12px 0",
                  }}
                >
                  Useful Links
                </h3>
                <div style={{ display: "flex", gap: "12px" }}>
                  <a
                    href="https://github.com/ortoniKC/LetXPath"
                    target="_blank"
                    rel="noreferrer"
                    style={styles.aboutLink}
                  >
                    🐙 GitHub Repository
                  </a>
                  <a
                    href="https://letcode.in"
                    target="_blank"
                    rel="noreferrer"
                    style={styles.aboutLink}
                  >
                    🌐 LetCode Homepage
                  </a>
                  <a
                    href="https://letcode.in/shadow"
                    target="_blank"
                    rel="noreferrer"
                    style={styles.aboutLink}
                  >
                    🧪 Test Playground
                  </a>
                </div>
              </div>

              <div
                style={{
                  ...styles.card,
                  marginTop: "20px",
                  background:
                    "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.02) 100%)",
                  borderColor: "rgba(16, 185, 129, 0.2)",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#10b981",
                    marginBottom: "6px",
                  }}
                >
                  ⭐ Support the Project
                </div>
                <div
                  style={{
                    color: "#c9d1d9",
                    fontSize: "13px",
                    lineHeight: "1.5",
                  }}
                >
                  If you find Ortoni Studio helpful, please consider leaving a review on the Chrome
                  Web Store or giving our GitHub repository a star. It helps other developers find
                  the tool!
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  appContainer: {
    backgroundColor: "#080b10",
    minHeight: "100vh",
    position: "relative" as const,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: "#c9d1d9",
    boxSizing: "border-box" as const,
  },
  dashboardContainer: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "40px 20px",
    display: "grid",
    gridTemplateColumns: "260px 1fr",
    gap: "30px",
    boxSizing: "border-box" as const,
  },
  sidebar: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "24px",
    backgroundColor: "#0d1117",
    border: "1px solid #21262d",
    borderRadius: "16px",
    padding: "24px",
    height: "fit-content",
    boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
    position: "sticky" as const,
    top: "40px",
  },
  sidebarBrand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    paddingBottom: "16px",
    borderBottom: "1px solid #21262d",
  },
  logoBadge: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    color: "#ffffff",
    fontWeight: "bold",
    boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
  },
  brandTitle: {
    fontSize: "15px",
    fontWeight: "bold",
    color: "#ffffff",
  },
  brandSubtitle: {
    fontSize: "11px",
    color: "#8b949e",
    marginTop: "1px",
  },
  navGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  },
  sidebarLink: {
    display: "flex",
    alignItems: "center",
    padding: "12px 14px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "500",
    border: "none",
    textAlign: "left" as const,
    cursor: "pointer",
    width: "100%",
    boxSizing: "border-box" as const,
  },
  sidebarFooter: {
    marginTop: "12px",
    paddingTop: "16px",
    borderTop: "1px solid #21262d",
  },
  mainPanel: {
    flex: 1,
    minWidth: 0, // avoids flex items overflowing
  },
  tabContent: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "24px",
  },
  sectionHeader: {
    marginBottom: "8px",
  },
  mainTitle: {
    fontSize: "24px",
    fontWeight: 800,
    color: "#ffffff",
    margin: "0 0 6px 0",
    letterSpacing: "-0.5px",
  },
  mainSubtitle: {
    fontSize: "14px",
    color: "#8b949e",
    margin: 0,
    lineHeight: "1.4",
  },
  frameworksGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "16px",
  },
  frameworkCard: {
    position: "relative" as const,
    backgroundColor: "#0d1117",
    borderRadius: "12px",
    padding: "16px 18px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    boxSizing: "border-box" as const,
    overflow: "hidden",
  },
  cardHighlightDot: {
    position: "absolute" as const,
    width: "3px",
    height: "24px",
    left: 0,
    top: "calc(50% - 12px)",
    borderRadius: "0 4px 4px 0",
    backgroundColor: "transparent",
  },
  cardIconBox: {
    width: "38px",
    height: "38px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    flexShrink: 0,
  },
  cardFrameworkName: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#ffffff",
  },
  cardFrameworkSubtitle: {
    fontSize: "11px",
    color: "#8b949e",
    marginTop: "2px",
    lineHeight: "1.3",
  },
  cardActiveCheck: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: "bold",
    flexShrink: 0,
  },
  previewContainer: {
    backgroundColor: "#0d1117",
    border: "1px solid #21262d",
    borderRadius: "12px",
    overflow: "hidden",
  },
  previewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 20px",
    backgroundColor: "#161b22",
    borderBottom: "1px solid #21262d",
  },
  pulseDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "#3b82f6",
    boxShadow: "0 0 8px #3b82f6",
  },
  previewBody: {
    padding: "20px",
    overflowX: "auto" as const,
  },
  codePre: {
    margin: 0,
    backgroundColor: "transparent",
    fontFamily: "'JetBrains Mono', Consolas, Monaco, monospace",
    fontSize: "13px",
    lineHeight: "1.6",
  },
  card: {
    backgroundColor: "#0d1117",
    border: "1px solid #21262d",
    borderRadius: "12px",
    padding: "24px",
    boxSizing: "border-box" as const,
  },
  infoCard: {
    backgroundColor: "#161b22",
    border: "1px solid #30363d",
    borderRadius: "12px",
    padding: "20px",
    boxSizing: "border-box" as const,
  },
  codeText: {
    color: "#58a6ff",
    backgroundColor: "rgba(88, 166, 255, 0.08)",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "12px",
    fontFamily: "monospace",
  },
  priorityPillContainer: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "10px",
    margin: "16px 0",
  },
  priorityPill: {
    backgroundColor: "#161b22",
    border: "1px solid #30363d",
    padding: "6px 12px 6px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
  },
  pillButton: {
    background: "none",
    border: "none",
    color: "#8b949e",
    cursor: "pointer",
    padding: "2px 4px",
    fontSize: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  addTagWrapper: {
    display: "flex",
    gap: "10px",
    marginTop: "20px",
    alignItems: "center",
  },
  radioContainer: {
    display: "flex",
    gap: "16px",
    margin: "4px 0",
  },
  radioLabel: {
    display: "inline-flex",
    alignItems: "center",
    cursor: "pointer",
    fontSize: "13px",
    color: "#c9d1d9",
  },
  textareaHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px",
  },
  textareaTag: {
    fontSize: "10px",
    color: "#8b949e",
    backgroundColor: "#161b22",
    padding: "2px 6px",
    borderRadius: "4px",
    fontFamily: "monospace",
  },
  codeTextarea: {
    fontFamily: "'JetBrains Mono', Consolas, Monaco, monospace",
    fontSize: "12px",
    lineHeight: "1.5",
    width: "100%",
    boxSizing: "border-box" as const,
    resize: "vertical" as const,
  },
  compilerLabel: {
    fontSize: "11px",
    textTransform: "uppercase" as const,
    fontWeight: "bold",
    color: "#8b949e",
    marginBottom: "4px",
  },
  compilerBox: {
    backgroundColor: "#080b10",
    border: "1px solid #21262d",
    borderRadius: "8px",
    padding: "12px",
    fontFamily: "'JetBrains Mono', Consolas, Monaco, monospace",
    fontSize: "12px",
    lineHeight: "1.5",
    overflowX: "auto" as const,
  },
  tokenRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px 12px",
    backgroundColor: "#161b22",
    borderRadius: "8px",
    border: "1px solid #30363d",
  },
  tokenCode: {
    color: "#58a6ff",
    fontWeight: "bold",
    fontSize: "13px",
    fontFamily: "monospace",
    minWidth: "50px",
  },
  tokenDesc: {
    fontSize: "12px",
    color: "#8b949e",
  },
  aboutLink: {
    display: "inline-flex",
    alignItems: "center",
    padding: "10px 16px",
    borderRadius: "8px",
    border: "1px solid #30363d",
    color: "#c9d1d9",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "500",
    transition: "all 0.2s ease",
    backgroundColor: "#161b22",
  },
};

export default OptionApp;
