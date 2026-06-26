import React from "react";
import { colorizeCode } from "../../panel/helpers";
import { styles } from "../styles";

interface TemplatesTabProps {
  customLang: "jscs" | "javacs";
  handleCustomLangChange: (lang: "jscs" | "javacs") => void;
  clickvalue: string;
  setClickvalue: (val: string) => void;
  sendvalue: string;
  setSendvalue: (val: string) => void;
  textvalue: string;
  setTextvalue: (val: string) => void;
  attrvalue: string;
  setAttrvalue: (val: string) => void;
  handleSaveAll: (e: React.FormEvent) => void;
}

export const TemplatesTab: React.FC<TemplatesTabProps> = ({
  customLang,
  handleCustomLangChange,
  clickvalue,
  setClickvalue,
  sendvalue,
  setSendvalue,
  textvalue,
  setTextvalue,
  attrvalue,
  setAttrvalue,
  handleSaveAll,
}) => {
  const compileTemplate = (tmpl: string, vn: string, lc: string, mn: string): string => {
    if (!tmpl) return "";
    return tmpl
      .replace(/\${vn}/g, vn)
      .replace(/\${lc}/g, lc)
      .replace(/\${mn}/g, mn);
  };

  return (
    <div style={styles.tabContent}>
      <div style={styles.sectionHeader}>
        <h1 style={styles.mainTitle}>Custom Page Object Templates</h1>
        <p style={styles.mainSubtitle}>
          Configure dynamic structural templates to match your internal framework design patterns.
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
                  color: "var(--text-secondary)",
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
                color: "var(--text-primary)",
              }}
            >
              Playground Compiler
            </h3>
            <p
              style={{
                margin: "0 0 16px 0",
                fontSize: "12px",
                color: "var(--text-secondary)",
              }}
            >
              Mock Element:{" "}
              <code style={{ color: "var(--color-primary)", backgroundColor: "var(--color-primary-tint)" }}>
                button#login-btn
              </code>
              , locator:{" "}
              <code style={{ color: "var(--color-primary)", backgroundColor: "var(--color-primary-tint)" }}>
                "//button[@id='login']"
              </code>
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
                color: "var(--text-primary)",
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
                <div style={styles.tokenDesc}>Evaluates to the selector/locator expression.</div>
              </div>
              <div style={styles.tokenRow}>
                <code style={styles.tokenCode}>{"${vn}"}</code>
                <div style={styles.tokenDesc}>Camel-cased variable name (e.g. loginButton).</div>
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
  );
};
