import React from "react";
import { FRAMEWORKS } from "../constants";
import { colorizeCode } from "../../panel/helpers";
import { styles } from "../styles";

interface GeneralTabProps {
  langID: string;
  setLangID: (id: string) => void;
  showToast: (msg: string) => void;
  getCodeSample: () => string;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({
  langID,
  setLangID,
  showToast,
  getCodeSample,
}) => {
  return (
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
                border: isActive
                  ? "1px solid var(--color-primary)"
                  : "1px solid var(--border-color)",
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
          <div style={{ fontSize: "11px", color: "#58a6ff" }}>
            Auto-compiles instantly
          </div>
        </div>
        <div style={styles.previewBody}>
          <pre style={styles.codePre}>
            <code>{colorizeCode(getCodeSample(), langID)}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
