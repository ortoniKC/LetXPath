import React from "react";
import { AxesData } from "../types";
import { colorizeXPath } from "../helpers";
import { styles } from "../styles";

interface AxesTabProps {
  axesData: AxesData | null;
  axesXPathResult: string;
  selectedSrc: string;
  setSelectedSrc: (val: string) => void;
  selectedDst: string;
  setSelectedDst: (val: string) => void;
  copyToClipboard: (value: string, message: string) => void;
}

export const AxesTab: React.FC<AxesTabProps> = ({
  axesData,
  axesXPathResult,
  selectedSrc,
  setSelectedSrc,
  selectedDst,
  setSelectedDst,
  copyToClipboard,
}) => {
  if (!axesData) {
    return (
      <div style={styles.emptyState}>
        <div style={{ fontSize: "1.8rem", marginBottom: "4px" }}>🔗</div>
        <div style={styles.emptyTitle}>Axes-based dynamic locator</div>
        <div style={styles.emptySubtitle}>
          Right click on the page context menu and select <strong>Parent Element</strong>,
          then <strong>Child Element</strong>.
        </div>
      </div>
    );
  }

  return (
    <div className="tab-content-animate">
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
            onClick={() => copyToClipboard(axesXPathResult, "Axes XPath copied!")}
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
    </div>
  );
};
