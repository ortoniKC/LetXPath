# Ortoni Studio: Your Ultimate XPath & CSS Selector Finder 🚀

Ortoni Studio (formerly LetXPath) is an advanced, developer-focused browser extension designed to help automation engineers, QA specialists, and developers find, evaluate, and organize XPath and CSS selectors with a single click. Complete with tailored code snippets, a live code editor, smart action recorder, and priority tag management, Ortoni Studio brings a premium workspace directly into your DevTools.

---

## 🎨 What's New in Ortoni Studio?

We have completely modernized the tool and introduced several key features to elevate your automation workflow:

### 1. Zero-Dependency Live Code Editor with Syntax Highlighting ✍️
- We refactored and modularized the main panel interface into clean, single-responsibility files.
- The built-in interactive live code editor now features a high-performance syntax-highlighted editor overlay. It synchronizes text scrolls with a tokenized preview in real-time, preserving native keyboard controls, typing speeds, and selection states.

### 2. Interactive Attribute Prioritization 🎯
- You can now manage your query attributes (e.g., `data-testid`, `data-cy`, `id`, `name`, `class`) interactively in our redesigned settings dashboard.
- Instead of typing comma-separated strings, you can move chips left/right to adjust priorities, delete unused tags, or type to add custom ones. A text mode is still available for raw copy-pasting.

### 3. Custom POM Templates Builder & Real-time Compiler 🛠️
- Design custom page-object-model template methods for Click, SendKeys, GetText, and GetAttribute using placeholder interpolation variables like `${lc}` (locator), `${vn}` (variable name), and `${mn}` (method name).
- Features a **Live Compiler Playground** in the sidebar that instantly shows you how your templates compile against a mock element.

### 4. Smart Recorder Engine 📼
- Record clicks, text inputs, selection options, and assertions directly on the page.
- Generates clean, native Playwright (JavaScript/TypeScript/Java) or Cypress tests.
- **Redundancy Fix**: The engine detects when native selectors (like `getByText()`, `getByRole()`) are available and prefixes them with `page.` directly (e.g. `await expect(page.getByText('Item')).toBeVisible()`) rather than wrapping them in redundant locator methods.

### 5. Premium Dashboard UI & Aesthetics ✨
- Designed with deep-dark themes, ambient gradient glows, glassmorphism borders, responsive grid layouts, custom scrollbars, and slide-in animated success toasts.

---

## 🛠️ Key Features

- **Single-Click Selectors**: Obtain the absolute best XPath or CSS selector with just one click on any webpage element.
- **Axis-Based XPath Generation**: Automatically generates relational XPaths (like `following`, `following-sibling`, `preceding`, `preceding-sibling`) and parent-child hierarchies.
- **Playwright Isomorphic Engine**: Evaluates selectors using Microsoft Playwright's official isomorphic generator logic (`asLocator`) to output native, production-grade locators.
- **Universal Locator Evaluator**: Directly test, highlight, and verify CSS selectors, XPath expressions, or Playwright locators inside the web page in real-time.
- **Supported Frameworks**: Generates copy-paste code snippets for Selenium (Java, Python, C#), Protractor JS, Cypress, Playwright (Node, Java, Python, C#), and Custom POM frameworks.

---

## 🚀 How to Use Ortoni Studio

1. **Install the Extension**: Install Ortoni Studio into your Chromium-based browser.
2. **Open DevTools**: Press `F12` or right-click any element and select **Inspect**.
3. **Navigate to the Ortoni Studio Panel**: Look for the **Ortoni Studio** tab in your DevTools pane.
4. **Inspect & Extract**: Turn on inspector mode or click on the desired element on the web page to obtain its unique XPath and CSS locators immediately.
5. **Adjust Settings**: Open the **Settings** gear to customize your target frameworks, reorder selector priorities, or build custom page object templates.

---

## 🔗 Get Involved

- **Source Code**: [GitHub Repository](https://github.com/ortoniKC/LetXPath)
- **Tutorials & Videos**: Check out [LetCode with Koushik](https://letcode.in) for video tutorials on building and configuring the automation workspace.

---

## 💬 FAQ & Troubleshooting

* **Is it free?**
  Yes! Ortoni Studio is 100% free and open-source.
* **The extension isn't highlighting elements?**
  Try restarting your browser or refreshing the web tab. DevTools extensions require active tab permissions which can occasionally be suspended when reloading pages.
* **Where is my settings data stored?**
  All templates and selector priorities are stored locally using browser local storage or Chrome Sync storage. No external servers are called.

---
*Thank you for using Ortoni Studio! If this tool saves you time, please give us a 5-star rating on the Web Store or star our repository on GitHub!* ⭐
