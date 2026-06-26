import React from "react";
import { SelectedElement } from "../types";
import { colorizeCSS, getActionsForTag } from "../helpers";
import { styles } from "../styles";

interface CSSTabProps {
  selectedElement: SelectedElement | null;
  copyToClipboard: (value: string, message: string) => void;
  handleVerifyLocator: (value: string) => void;
  handleActionSelect: (
    e: React.ChangeEvent<HTMLSelectElement>,
    label: string,
    value: string,
  ) => void;
}

export const CSSTab: React.FC<CSSTabProps> = ({
  selectedElement,
  copyToClipboard,
  handleVerifyLocator,
  handleActionSelect,
}) => {
  if (!selectedElement || !selectedElement.cssPath || selectedElement.cssPath.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={{ fontSize: "1.8rem", marginBottom: "4px" }}>🎨</div>
        <div style={styles.emptyTitle}>Select an element in Elements tab</div>
        <div style={styles.emptySubtitle}>
          Ortoni Studio will display optimized CSS selectors here.
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
        {selectedElement.cssPath.map((item, idx) => {
          const [, label, value] = item;
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
                title="Click to copy CSS"
                onClick={() => copyToClipboard(value, "CSS Path copied!")}
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
                {getActionsForTag(selectedElement.tag, selectedElement.type).map(
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
  );
};
