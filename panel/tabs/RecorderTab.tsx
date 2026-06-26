import React, { useRef } from "react";
import { colorizeCode, generateRecordedScript } from "../helpers";
import { styles } from "../styles";

interface RecorderTabProps {
  isRecordingActive: boolean;
  isVerifyModeActive: boolean;
  handleToggleVerifyMode: (val: boolean) => void;
  handleStopRecording: () => void;
  handleStartRecording: () => void;
  handleClearRecording: () => void;
  isScreenRecording: boolean;
  handleStopScreenRecording: () => void;
  handleStartScreenRecording: () => void;
  recordingUrl: string;
  recordedSteps: any[];
  langID: string;
  setLangID: (val: string) => void;
  isAutoSyncActive: boolean;
  setIsAutoSyncActive: (val: boolean) => void;
  editedCode: string;
  setEditedCode: (val: string) => void;
  templates: any;
  copyToClipboard: (value: string, message: string) => void;
  handleDownloadScript: (code: string, lang: string) => void;
}

export const RecorderTab: React.FC<RecorderTabProps> = ({
  isRecordingActive,
  isVerifyModeActive,
  handleToggleVerifyMode,
  handleStopRecording,
  handleStartRecording,
  handleClearRecording,
  isScreenRecording,
  handleStopScreenRecording,
  handleStartScreenRecording,
  recordingUrl,
  recordedSteps,
  langID,
  setLangID,
  isAutoSyncActive,
  setIsAutoSyncActive,
  editedCode,
  setEditedCode,
  templates,
  copyToClipboard,
  handleDownloadScript,
}) => {
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const stepsContainerRef = useRef<HTMLDivElement>(null);

  const handleEditorScroll = () => {
    if (textareaRef.current) {
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
      }
      if (highlightRef.current) {
        highlightRef.current.scrollTop = textareaRef.current.scrollTop;
        highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
      }
    }
  };

  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedCode(e.target.value);
    setIsAutoSyncActive(false);
  };

  return (
    <div
      className="tab-content-animate"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        height: "100%",
      }}
    >
      {/* Control Bar */}
      <div style={styles.toolCard}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {isRecordingActive ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span className="pulse-red-dot" style={styles.pulseRedDot}></span>
                <span style={{ color: "#ff4d4d", fontWeight: 600 }}>Recording...</span>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span style={styles.greenDot}></span>
                <span style={{ color: "#4ade80", fontWeight: 600 }}>Idle</span>
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <label
              className="form-switch"
              style={{
                color: "var(--text-primary)",
                display: "inline-flex",
                alignItems: "center",
                cursor: "pointer",
                margin: 0,
              }}
            >
              <input
                type="checkbox"
                checked={isVerifyModeActive}
                onChange={(e) => handleToggleVerifyMode(e.target.checked)}
              />
              <i className="form-icon"></i>
              <span
                style={{
                  fontSize: "11px",
                  marginLeft: "4px",
                  fontWeight: 500,
                }}
              >
                Verify Mode
              </span>
            </label>
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              {isRecordingActive ? (
                <button style={styles.btnStopRecord} onClick={handleStopRecording}>
                  Stop Recording
                </button>
              ) : (
                <button style={styles.btnStartRecord} onClick={handleStartRecording}>
                  Start Recording
                </button>
              )}
              <button style={styles.btnClear} onClick={handleClearRecording}>
                Clear
              </button>

              <div
                style={{
                  width: "1px",
                  backgroundColor: "#3c3c3c",
                  height: "14px",
                  margin: "0 6px",
                }}
              />

              {isScreenRecording ? (
                <button style={styles.btnStopVideo} onClick={handleStopScreenRecording}>
                  <span style={styles.redDotRecording}></span>
                  Stop Video
                </button>
              ) : (
                <button style={styles.btnStartVideo} onClick={handleStartScreenRecording}>
                  Record Video
                </button>
              )}
            </div>
          </div>
        </div>
        {recordingUrl && (
          <div
            style={{
              fontSize: "9px",
              color: "var(--text-secondary)",
              marginTop: "4px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            Start URL:{" "}
            <a
              href={recordingUrl}
              target="_blank"
              rel="noreferrer"
              style={{ color: "#3794ff" }}
            >
              {recordingUrl}
            </a>
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: "8px",
          flex: 1,
          minHeight: "300px",
        }}
      >
        {/* Left Column: Recorded Steps list */}
        <div
          style={{
            ...styles.toolCard,
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={styles.toolTitle}>Recorded Steps ({recordedSteps.length})</div>
          <div
            ref={stepsContainerRef}
            style={{
              flex: 1,
              overflowY: "auto",
              maxHeight: "350px",
              marginTop: "6px",
              border: "1px solid #2d2d2d",
              borderRadius: "4px",
              padding: "4px",
              backgroundColor: "#141414",
            }}
          >
            {recordedSteps.length === 0 ? (
              <div
                style={{
                  color: "#555",
                  textAlign: "center",
                  marginTop: "40px",
                  fontSize: "10px",
                }}
              >
                No actions recorded yet.
                <br />
                Start recording and click or type on the page elements.
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                {recordedSteps.map((step, i) => (
                  <div
                    key={step.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "4px",
                      borderBottom: "1px solid #222",
                      gap: "6px",
                    }}
                  >
                    <span style={{ color: "#858585", fontSize: "9px" }}>{i + 1}.</span>
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 600,
                        padding: "1px 4px",
                        borderRadius: "3px",
                        backgroundColor:
                          step.action === "click"
                            ? "#0e639c"
                            : step.action === "assert_visible"
                              ? "#8b5cf6"
                              : "#10b981",
                        color: "#fff",
                      }}
                    >
                      {step.action.toUpperCase()}
                    </span>
                    <span
                      style={{
                        color: "#eee",
                        fontFamily: "monospace",
                        fontSize: "9px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "100px",
                      }}
                      title={step.tag}
                    >
                      &lt;{step.tag}
                      {step.type ? ` type="${step.type}"` : ""}&gt;
                    </span>
                    {step.value && (
                      <span
                        style={{
                          color: "#ffaf3b",
                          fontSize: "9px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "80px",
                        }}
                        title={step.value}
                      >
                        "{step.value}"
                      </span>
                    )}
                    <span
                      style={{
                        color: "#858585",
                        fontSize: "9px",
                        marginLeft: "auto",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "120px",
                      }}
                      title={step.playwrightLocator || step.xpathLocator}
                    >
                      {step.playwrightLocator || step.xpathLocator}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Generated Code Preview */}
        <div
          style={{
            ...styles.toolCard,
            flex: 1.2,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "6px",
            }}
          >
            <div style={styles.toolTitle}>Generated Script</div>
            <select
              className="form-select select-sm"
              style={{
                ...styles.actionSelect,
                width: "130px",
                margin: 0,
              }}
              value={langID}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setLangID(e.target.value);
                if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
                  chrome.storage.local.set({ langID: e.target.value });
                } else {
                  localStorage.setItem("langID", e.target.value);
                }
              }}
            >
              <option value="javas">Selenium Java</option>
              <option value="playwrightJS">Playwright - Node</option>
              <option value="playwrightJava">Playwright - Java</option>
              <option value="py">Selenium Python</option>
              <option value="csharp">Selenium C#</option>
              <option value="protractorjs">Protractor (Angular)</option>
              <option value="cypress">Cypress</option>
              <option value="custom">Custom Framework</option>
            </select>
          </div>

          <div
            style={{
              flex: 1,
              position: "relative",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            {/* Editor Header / Toolbar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#1a1a1a",
                padding: "4px 8px",
                borderRadius: "4px",
                border: "1px solid #2d2d2d",
              }}
            >
              {/* Status Badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: isAutoSyncActive ? "#4ade80" : "#ff9800",
                    display: "inline-block",
                  }}
                />
                <span
                  style={{
                    fontSize: "10px",
                    color: "#ccc",
                    fontWeight: 600,
                  }}
                >
                  {isAutoSyncActive ? "Live Syncing" : "Manual Edit Mode"}
                </span>
              </div>

              {/* Editor Mode Control */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {!isAutoSyncActive && (
                  <button
                    style={{
                      backgroundColor: "#0e639c",
                      color: "#fff",
                      border: "none",
                      borderRadius: "3px",
                      padding: "2px 6px",
                      fontSize: "10px",
                      cursor: "pointer",
                      fontWeight: 600,
                      marginRight: "4px",
                    }}
                    onClick={() => {
                      setEditedCode(
                        generateRecordedScript(
                          recordedSteps,
                          recordingUrl,
                          langID,
                          templates,
                        ),
                      );
                      setIsAutoSyncActive(true);
                    }}
                    title="Revert manual edits and resume auto-sync with recorded steps"
                  >
                    Sync & Reset
                  </button>
                )}
                <label
                  className="form-switch"
                  style={{
                    color: "#fff",
                    display: "inline-flex",
                    alignItems: "center",
                    cursor: "pointer",
                    margin: 0,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isAutoSyncActive}
                    onChange={(e) => setIsAutoSyncActive(e.target.checked)}
                  />
                  <i className="form-icon"></i>
                  <span style={{ fontSize: "10px", marginLeft: "4px" }}>Auto Sync</span>
                </label>
              </div>
            </div>

            {/* Side-by-side Editor with Line Numbers */}
            <div
              style={{
                display: "flex",
                flex: 1,
                backgroundColor: "#1e1e1e",
                border: "1px solid #2d2d2d",
                borderRadius: "4px",
                minHeight: "260px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Line Numbers Column */}
              <div
                ref={lineNumbersRef}
                style={{
                  padding: "6px 8px",
                  backgroundColor: "#1a1a1a",
                  color: "#6e7681",
                  textAlign: "right",
                  fontFamily: "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
                  fontSize: "10px",
                  lineHeight: "1.6",
                  userSelect: "none",
                  borderRight: "1px solid #2d2d2d",
                  overflow: "hidden",
                  whiteSpace: "pre",
                  minWidth: "24px",
                }}
              >
                {editedCode
                  .split("\n")
                  .map((_, idx) => idx + 1)
                  .join("\n")}
              </div>

              {/* Editor Workspace Container */}
              <div
                style={{
                  position: "relative",
                  flex: 1,
                  display: "flex",
                  overflow: "hidden",
                }}
              >
                {/* Highlighted Code (Behind) */}
                <pre
                  ref={highlightRef}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    margin: 0,
                    padding: "6px 8px",
                    backgroundColor: "#1e1e1e",
                    color: "#d4d4d4",
                    fontFamily: "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
                    fontSize: "10px",
                    lineHeight: "1.6",
                    whiteSpace: "pre",
                    overflow: "hidden",
                    pointerEvents: "none",
                    boxSizing: "border-box",
                  }}
                >
                  {colorizeCode(editedCode, langID)}
                </pre>

                {/* Textarea Editor (On Top) */}
                <textarea
                  ref={textareaRef}
                  value={editedCode}
                  onChange={handleEditorChange}
                  onScroll={handleEditorScroll}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: "transparent",
                    color: "transparent",
                    caretColor: "#cccccc",
                    border: "none",
                    padding: "6px 8px",
                    fontFamily: "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
                    fontSize: "10px",
                    lineHeight: "1.6",
                    resize: "none",
                    outline: "none",
                    overflowY: "auto",
                    whiteSpace: "pre",
                    boxSizing: "border-box",
                  }}
                  placeholder="/* Type or record steps to see script code */"
                />
              </div>
            </div>

            {/* Copy / Download Footer */}
            <div style={{ display: "flex", gap: "4px", marginTop: "6px" }}>
              <button
                style={{ ...styles.btnFind, flex: 1 }}
                onClick={() => copyToClipboard(editedCode, "Script copied to clipboard!")}
              >
                Copy Script
              </button>
              <button
                style={{ ...styles.btnClear, flex: 1 }}
                onClick={() => handleDownloadScript(editedCode, langID)}
              >
                Download
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
