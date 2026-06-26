import React from "react";
import { APPVERSION } from "../constants";
import { styles } from "../styles";

interface AboutTabProps {
  copyToClipboard: (value: string, message: string) => void;
}

export const AboutTab: React.FC<AboutTabProps> = ({ copyToClipboard }) => {
  return (
    <div className="tab-content-animate" style={styles.aboutCard}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "6px",
        }}
      >
        <img
          src="../assets/ortoni-studio-logo.png"
          width="20px"
          height="20px"
          alt="Ortoni Studio logo"
          style={{ borderRadius: "4px", objectFit: "contain" }}
        />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            Ortoni Studio
          </span>
          <span style={{ color: "#858585", fontSize: "9px" }}>{APPVERSION} • Open Source</span>
        </div>
      </div>

      <p
        style={{
          color: "#cccccc",
          fontSize: "10px",
          lineHeight: "1.4",
          margin: "6px 0",
        }}
      >
        A premium, lightweight developer tool built to accelerate locator building and CSS/XPath
        generation for test automation.
      </p>

      <div style={styles.divider} />

      {/* Social Icons row */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          margin: "8px 0",
          alignItems: "center",
        }}
      >
        <a href="https://youtube.com/@letcode" target="_blank" title="YouTube Channel">
          <svg className="social-svg-icon youtube" width="16" height="16" viewBox="0 0 24 24">
            <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.507 9.388.507 9.388.507s7.518 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        </a>
        <a href="https://github.com/ortoniKC/LetXPath" target="_blank" title="GitHub Repository">
          <svg className="social-svg-icon github" width="16" height="16" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.82 1.102.82 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </a>
        <a href="https://www.linkedin.com/in/ortoni/" target="_blank" title="LinkedIn Profile">
          <svg className="social-svg-icon linkedin" width="16" height="16" viewBox="0 0 24 24">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
          </svg>
        </a>
        <a href="https://letcode.in" target="_blank" title="LetCode Website">
          <svg className="social-svg-icon globe" width="16" height="16" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.53c-.26-.81-1-1.4-1.9-1.4h-1v-3c0-.55-.45-1-1-1h-6v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
        </a>
        <a
          href="https://chromewebstore.google.com/detail/letxpath/bekehlnepmijedippfibbmbglglbmlgk/reviews"
          target="_blank"
          title="Rate on Chrome Web Store"
        >
          <svg className="social-svg-icon star" width="16" height="16" viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        </a>
      </div>

      <div style={styles.divider} />

      {/* Other Products Section */}
      <div style={{ margin: "8px 0" }}>
        <div
          style={{
            color: "#858585",
            fontSize: "9px",
            fontWeight: 600,
            textTransform: "uppercase",
            marginBottom: "6px",
            letterSpacing: "0.5px",
          }}
        >
          Our Automation Tools
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <a
            href="https://github.com/ortoniKC/ortoni-report"
            target="_blank"
            className="product-item"
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "10px",
                  color: "#3794ff",
                }}
              >
                Ortoni Report
              </div>
              <div
                style={{
                  fontSize: "8px",
                  color: "#858585",
                  backgroundColor: "#2d2d2d",
                  padding: "1px 4px",
                  borderRadius: "3px",
                  marginLeft: "auto",
                }}
              >
                GitHub
              </div>
            </div>
            <div
              style={{
                color: "#858585",
                fontSize: "9px",
                marginTop: "2px",
                lineHeight: "1.2",
              }}
            >
              Sleek, feature-rich HTML reporter for Playwright test results.
            </div>
          </a>

          <a
            href="https://marketplace.visualstudio.com/items?itemName=ortoni.ortoni"
            target="_blank"
            className="product-item"
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "10px",
                  color: "#3794ff",
                }}
              >
                Ortoni Runner
              </div>
              <div
                style={{
                  fontSize: "8px",
                  color: "#858585",
                  backgroundColor: "#2d2d2d",
                  padding: "1px 4px",
                  borderRadius: "3px",
                  marginLeft: "auto",
                }}
              >
                VS Code
              </div>
            </div>
            <div
              style={{
                color: "#858585",
                fontSize: "9px",
                marginTop: "2px",
                lineHeight: "1.2",
              }}
            >
              VS Code extension to run Playwright & Cucumber tests instantly.
            </div>
          </a>
        </div>
      </div>

      <div style={styles.divider} />

      {/* Support / Sponsor Section */}
      <div
        style={{
          background: "linear-gradient(135deg, #1c1c1c 0%, #111111 100%)",
          border: "1px solid #333333",
          borderRadius: "6px",
          padding: "8px",
          marginTop: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div
              style={{
                color: "#4ade80",
                fontSize: "10px",
                fontWeight: 600,
                marginBottom: "2px",
              }}
            >
              Support the Project
            </div>
            <div
              style={{
                color: "#858585",
                fontSize: "9px",
                lineHeight: "1.3",
                maxWidth: "140px",
              }}
            >
              Ortoni Studio is free & open-source. Consider donating to help maintain it!
            </div>
          </div>

          {/* QR Code trigger-zoomable wrapper */}
          <div className="qr-wrapper" title="Hover to enlarge QR Code">
            <img src="../assets/ortoni.png" alt="Donate UPI QR Code" className="qr-image" />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            marginTop: "2px",
          }}
        >
          <span style={{ color: "#858585", fontSize: "9px" }}>UPI:</span>
          <div
            className="upi-copy-badge"
            onClick={() => copyToClipboard("ortoni@ybl", "UPI ID copied to clipboard!")}
            title="Click to copy UPI ID"
          >
            <span>ortoni@ybl</span>
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "12px",
          color: "#555",
          fontSize: "8px",
          textAlign: "center",
        }}
      >
        Created with ❤️ by Koushik Chatterjee. Licensed under MIT.
      </div>
    </div>
  );
};
