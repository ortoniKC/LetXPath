import React from "react";
import { SelectedElement } from "../types";
import { colorizeXPath, getActionsForTag } from "../helpers";
import { styles } from "../styles";

interface XPathTabProps {
  selectedElement: SelectedElement | null;
  copyToClipboard: (value: string, message: string) => void;
  handleVerifyLocator: (value: string) => void;
  handleActionSelect: (
    e: React.ChangeEvent<HTMLSelectElement>,
    label: string,
    value: string,
  ) => void;
}

export const XPathTab: React.FC<XPathTabProps> = ({
  selectedElement,
  copyToClipboard,
  handleVerifyLocator,
  handleActionSelect,
}) => {
  if (!selectedElement || !selectedElement.xpathid || selectedElement.xpathid.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={{ fontSize: "1.8rem", marginBottom: "4px" }}>🔍</div>
        <div style={styles.emptyTitle}>Select an element in Elements tab</div>
        <div style={styles.emptySubtitle}>
          Ortoni Studio will display optimized XPaths & action snippets here.
        </div>
      </div>
    );
  }

  return (
    <div
      className="tab-content-animate"
      style={{ display: "flex", flexDirection: "column", gap: "4px" }}
    >
      {/* Table Info if inside table */}
      {selectedElement.webtabledetails && (
        <div style={styles.tableCard}>
          <div style={styles.tableHeader}>
            Table Detected ({selectedElement.webtabledetails.totalTables} total)
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
              {colorizeXPath(selectedElement.webtabledetails.tableLocator)}
            </code>
          </div>
          <div style={styles.tableRow}>
            <span style={styles.tableLabel}>Selected Row XPath:</span>
            <code
              style={styles.tableCode}
              title="Click to copy Row Locator"
              onClick={() =>
                copyToClipboard(selectedElement.webtabledetails!.tableData, "Row Locator copied!")
              }
            >
              {colorizeXPath(selectedElement.webtabledetails.tableData)}
            </code>
          </div>
        </div>
      )}

      {/* XPaths list */}
      <div style={styles.locatorList}>
        {selectedElement.xpathid.map((item, idx) => {
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
                title="Click to copy locator"
                onClick={() => copyToClipboard(value, "Locator copied!")}
              >
                {colorizeXPath(value)}
              </code>
              <button
                style={styles.btnVerifyInline}
                onClick={() => handleVerifyLocator(value)}
                title="Verify and highlight element"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="11"
                  height="11"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
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
