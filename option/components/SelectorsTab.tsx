import React from "react";
import { styles } from "../styles";

interface SelectorsTabProps {
  rawTextMode: boolean;
  setRawTextMode: (val: boolean) => void;
  resetToDefaultPriority: () => void;
  tagList: string[];
  moveTagLeft: (idx: number) => void;
  moveTagRight: (idx: number) => void;
  deleteTag: (idx: number) => void;
  newTagInput: string;
  setNewTagInput: (val: string) => void;
  addTag: () => void;
  selectorPriority: string;
  handleRawPriorityChange: (val: string) => void;
}

export const SelectorsTab: React.FC<SelectorsTabProps> = ({
  rawTextMode,
  setRawTextMode,
  resetToDefaultPriority,
  tagList,
  moveTagLeft,
  moveTagRight,
  deleteTag,
  newTagInput,
  setNewTagInput,
  addTag,
  selectorPriority,
  handleRawPriorityChange,
}) => {
  return (
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
          <h3 style={{ margin: 0, fontSize: "15px", color: "var(--text-primary)" }}>
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
              🔄 Restore Default
            </button>
          </div>
        </div>

        {!rawTextMode ? (
          <>
            <div
              style={{
                color: "var(--text-secondary)",
                fontSize: "13px",
                marginBottom: "16px",
                lineHeight: "1.4",
              }}
            >
              Drag-style order list. Use the{" "}
              <strong style={{ color: "var(--color-primary)" }}>left (◂)</strong> and{" "}
              <strong style={{ color: "var(--color-primary)" }}>right (▸)</strong> buttons on each badge
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
                        color: "var(--text-secondary)",
                        fontWeight: "bold",
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span style={{ color: "var(--text-primary)", fontWeight: "500" }}>{tag}</span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "2px",
                      borderLeft: "1px solid var(--border-color)",
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
                color: "var(--text-secondary)",
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
                color: "var(--text-secondary)",
                fontSize: "12px",
                marginTop: "8px",
              }}
            >
              Recommended:{" "}
              <code style={{ color: "var(--color-primary)", backgroundColor: "var(--color-primary-tint)", border: "1px solid var(--border-color)" }}>
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
            color: "var(--text-primary)",
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
            color: "var(--text-secondary)",
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
  );
};
