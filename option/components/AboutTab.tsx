import React from "react";
import { styles } from "../styles";

export const AboutTab: React.FC = () => {
  return (
    <div style={styles.tabContent}>
      <div style={styles.sectionHeader}>
        <h1 style={styles.mainTitle}>About Ortoni Studio</h1>
        <p style={styles.mainSubtitle}>
          Learn more about the extension and get resources for automation testing.
        </p>
      </div>

      <div style={styles.card}>
        <div
          style={{
            display: "flex",
            gap: "20px",
            alignItems: "center",
            marginBottom: "24px",
            paddingBottom: "20px",
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          <img
            src="../assets/ortoni-studio-logo.png"
            alt="Ortoni Studio Logo"
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              objectFit: "contain",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
            }}
          />
          <div>
            <h2
              style={{
                margin: "0 0 4px 0",
                color: "var(--text-primary)",
                fontSize: "20px",
              }}
            >
              Ortoni Studio Pro
            </h2>
            <div style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
              Open Source XPath & Selector Tool • Version 3.0.2
            </div>
          </div>
        </div>

        <h3
          style={{
            color: "var(--text-primary)",
            fontSize: "16px",
            margin: "0 0 10px 0",
          }}
        >
          Core Features
        </h3>
        <ul
          style={{
            color: "var(--text-secondary)",
            fontSize: "13.5px",
            lineHeight: "1.8",
            margin: "0 0 24px 0",
            paddingLeft: "20px",
          }}
        >
          <li>Generate reliable XPath expressions & CSS locators instantly.</li>
          <li>Support for Cypress, Playwright, Selenium (Java, C#, Python), and Protractor.</li>
          <li>Interactive smart recorder which compiles script actions into full tests.</li>
          <li>Dynamic WebTable parsing and locator prioritization setup.</li>
          <li>100% open-source and local storage secured.</li>
        </ul>

        <h3
          style={{
            color: "var(--text-primary)",
            fontSize: "16px",
            margin: "0 0 12px 0",
          }}
        >
          Useful Links
        </h3>
        <div style={{ display: "flex", gap: "12px" }}>
          <a
            href="https://github.com/ortoniKC/LetXPath"
            target="_blank"
            rel="noreferrer"
            style={styles.aboutLink}
          >
            🐙 GitHub Repository
          </a>
          <a href="https://letcode.in" target="_blank" rel="noreferrer" style={styles.aboutLink}>
            🌐 LetCode Homepage
          </a>
          <a
            href="https://letcode.in/shadow"
            target="_blank"
            rel="noreferrer"
            style={styles.aboutLink}
          >
            🧪 Test Playground
          </a>
        </div>
      </div>

      <div
        style={{
          ...styles.card,
          marginTop: "20px",
          background:
            "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.02) 100%)",
          borderColor: "rgba(16, 185, 129, 0.2)",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#10b981",
            marginBottom: "6px",
          }}
        >
          ⭐ Support the Project
        </div>
        <div
          style={{
            color: "#c9d1d9",
            fontSize: "13px",
            lineHeight: "1.5",
          }}
        >
          If you find Ortoni Studio helpful, please consider leaving a review on the Chrome Web
          Store or giving our GitHub repository a star. It helps other developers find the tool!
        </div>
      </div>
    </div>
  );
};
