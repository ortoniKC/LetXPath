import React from "react";
import { SelectedElement } from "../types";
import { colorizePlaywright, getPlaywrightActions } from "../helpers";
import { styles } from "../styles";

interface PlaywrightTabProps {
  selectedElement: SelectedElement | null;
  langID: string;
  copyToClipboard: (value: string, message: string) => void;
  handleVerifyLocator: (value: string) => void;
  handlePlaywrightActionSelect: (e: React.ChangeEvent<HTMLSelectElement>, jsVal: string) => void;
}

export const PlaywrightTab: React.FC<PlaywrightTabProps> = ({
  selectedElement,
  langID,
  copyToClipboard,
  handleVerifyLocator,
  handlePlaywrightActionSelect,
}) => {
  const getPlaywrightLanguageForLangID = (
    lang: string,
  ): "javascript" | "python" | "java" | "csharp" => {
    if (lang === "playwrightJS" || lang === "protractorjs") return "javascript";
    if (lang === "playwrightJava" || lang === "javas") return "java";
    if (lang === "py") return "python";
    if (lang === "csharp") return "csharp";
    return "javascript";
  };

  if (!selectedElement || !selectedElement.tag) {
    return (
      <div style={styles.emptyState}>
        <div style={{ fontSize: "1.8rem", marginBottom: "4px" }}>🎭</div>
        <div style={styles.emptyTitle}>Select an element in Elements tab</div>
        <div style={styles.emptySubtitle}>
          Ortoni Studio will display Playwright-recommended locators here.
        </div>
      </div>
    );
  }

  return (
    <div
      className="tab-content-animate"
      style={{ display: "flex", flexDirection: "column", gap: "4px" }}
    >
      <div style={styles.locatorList}>
        {(selectedElement.playwrightLocators || []).map((loc, idx) => {
          const [, label, jsVal, pyVal, javaVal, csVal] = loc;
          const playLang = getPlaywrightLanguageForLangID(langID);
          let value = jsVal;
          if (playLang === "python") value = pyVal;
          else if (playLang === "java") value = javaVal;
          else if (playLang === "csharp") value = csVal;
          return (
            <div
              className="locator-row-animate"
              key={idx}
              style={{
                ...styles.locatorRow,
                animationDelay: `${idx * 0.04}s`,
              }}
            >
              <div style={styles.labelBox}>
                <span style={styles.locatorLabel} title={label}>
                  {label}
                </span>
              </div>
              <code
                style={styles.codeSnippet}
                title="Click to copy Playwright Locator"
                onClick={() => copyToClipboard(value, "Playwright locator copied!")}
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
                {getPlaywrightActions(selectedElement.tag, selectedElement.type).map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
};
