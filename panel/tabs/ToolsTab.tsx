import React from "react";
import { colorizeCSS } from "../helpers";
import { styles } from "../styles";

interface ToolsTabProps {
  searchVal: string;
  setSearchVal: (val: string) => void;
  handleCustomSearch: () => void;
  handleClearHighlight: () => void;
  searchResult: { count: number } | null;
  convertVal: string;
  setConvertVal: (val: string) => void;
  handleConvertXPath: () => void;
  convertResult: string;
  copyToClipboard: (value: string, message: string) => void;
}

export const ToolsTab: React.FC<ToolsTabProps> = ({
  searchVal,
  setSearchVal,
  handleCustomSearch,
  handleClearHighlight,
  searchResult,
  convertVal,
  setConvertVal,
  handleConvertXPath,
  convertResult,
  copyToClipboard,
}) => {
  return (
    <div
      className="tab-content-animate"
      style={{ display: "flex", flexDirection: "column", gap: "8px" }}
    >
      {/* Custom Search Box */}
      <div style={styles.toolCard}>
        <div style={styles.toolTitle}>Universal Locator Evaluator</div>
        <div style={styles.toolDesc}>
          Evaluate, test, and highlight XPaths, CSS, and Playwright locators.
        </div>
        <div style={{ display: "flex", gap: "4px", alignItems: "stretch" }}>
          <input
            type="text"
            className="form-input"
            style={styles.toolInput}
            placeholder="Type locator (e.g. //input, #id, or page.getByRole('button'))"
            value={searchVal}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchVal(e.target.value)}
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
          <div style={searchResult.count > 0 ? styles.searchSuccess : styles.searchFail}>
            Matched elements: <strong>{searchResult.count}</strong>
          </div>
        )}
      </div>

      {/* CSS Converter Box */}
      <div style={styles.toolCard}>
        <div style={styles.toolTitle}>XPath to CSS Converter</div>
        <div style={styles.toolDesc}>
          Convert standard XPath queries directly into CSS selectors (Beta).
        </div>
        <div style={{ display: "flex", gap: "4px", alignItems: "stretch" }}>
          <input
            type="text"
            className="form-input"
            style={styles.toolInput}
            placeholder="Enter XPath to convert"
            value={convertVal}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConvertVal(e.target.value)}
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
              onClick={() => copyToClipboard(convertResult, "Converted CSS copied!")}
            >
              {colorizeCSS(convertResult)}
            </code>
          </div>
        )}
      </div>
    </div>
  );
};
