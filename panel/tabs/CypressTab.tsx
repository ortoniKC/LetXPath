import React from "react";
import { SelectedElement } from "../types";
import { colorizePlaywright } from "../helpers";
import { styles } from "../styles";

interface CypressTabProps {
  selectedElement: SelectedElement | null;
  copyToClipboard: (value: string, message: string) => void;
  handleVerifyLocator: (value: string) => void;
}

export const CypressTab: React.FC<CypressTabProps> = ({
  selectedElement,
  copyToClipboard,
  handleVerifyLocator,
}) => {
  if (
    !selectedElement ||
    !selectedElement.cypressLocators ||
    selectedElement.cypressLocators.length === 0
  ) {
    return (
      <div style={styles.emptyState}>
        <div style={{ fontSize: "1.8rem", marginBottom: "4px" }}>🌲</div>
        <div style={styles.emptyTitle}>Select an element in Elements tab</div>
        <div style={styles.emptySubtitle}>
          Ortoni Studio will display Cypress-recommended locators here.
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
        {selectedElement.cypressLocators.map((item, idx) => {
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
                title="Click to copy Cypress Locator"
                onClick={() => copyToClipboard(value, "Cypress locator copied!")}
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
                  copyToClipboard(code, "Cypress action snippet copied!");
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
    </div>
  );
};
