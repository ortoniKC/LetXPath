import React from "react";
import { ChromeStorageResult } from "./types";
import { ACTION_LABELS, DEFAULT_TEMPLATES } from "./constants";

export const colorizeCode = (code: string, _lang: string): React.ReactNode => {
  if (!code) return "";
  
  // Regex to match comments, strings, keywords, numbers, builtins/objects, and method/variable identifiers
  const tokenRegex = /(\/\/.*|#.*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:await|async|import|from|const|let|class|public|static|void|try|using|new|describe|it|def|return)\b|\b\d+\b|\b(?:cy|page|expect|assert|driver|browser|element|by|By)\b|[a-zA-Z0-9_$]+|[^a-zA-Z0-9_$\s]+|\s+)/g;
  
  const tokens = code.split(tokenRegex);
  return tokens.map((token, idx) => {
    if (!token) return null;
    let color = "#d4d4d4";
    
    if (token.startsWith("//") || token.startsWith("#")) {
      color = "#6a9955"; // green comments
    } else if (token.startsWith('"') || token.startsWith("'")) {
      color = "#ce9178"; // orange/brown strings
    } else if (/^(?:await|async|import|from|const|let|class|public|static|void|try|using|new|describe|it|def|return)$/.test(token)) {
      color = "#569cd6"; // blue keywords
    } else if (/^(?:cy|page|expect|assert|driver|browser|element|by|By)$/.test(token)) {
      color = "#9cdcfe"; // light blue builtins/objects
    } else if (/^\d+$/.test(token)) {
      color = "#b5cea8"; // light green numbers
    } else if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(token)) {
      color = "#dcdcaa"; // yellow function/method/variable identifiers
    }
    
    return (
      <span key={idx} style={{ color }}>
        {token}
      </span>
    );
  });
};

export const colorizeXPath = (xpath: string): React.ReactNode => {
  const tokenRegex =
    /('(?:\\'|[^'])*'|"(?:\\"|[^"])*"|[a-zA-Z-]+::|@[a-zA-Z0-9_-]+|[a-zA-Z-]+\s*\(|text\s*\(\)|\/\/|\/|\[|\]|\(|\)|=|\b(?:and|or)\b|\d+|[a-zA-Z0-9_-]+)/g;
  const tokens = xpath.split(tokenRegex);
  return tokens.map((token, idx) => {
    if (!token) return null;
    let color = "#d4d4d4";
    if (token.startsWith("'") || token.startsWith('"')) {
      color = "#ce9178"; // string
    } else if (token.endsWith("::")) {
      color = "#c586c0"; // axes
    } else if (token.startsWith("@")) {
      color = "#9cdcfe"; // attribute
    } else if (token.includes("(")) {
      color = "#dcdcaa"; // function
    } else if (token === "//" || token === "/") {
      color = "#ff5d5b"; // slash
    } else if (["[", "]", "(", ")", "="].includes(token)) {
      color = "#ffd700"; // brackets/operators
    } else if (["and", "or"].includes(token)) {
      color = "#569cd6"; // logic
    } else if (/^\d+$/.test(token)) {
      color = "#b5cea8"; // index
    } else if (/^[a-zA-Z0-9_-]+$/.test(token)) {
      const tags = [
        "input",
        "div",
        "label",
        "span",
        "a",
        "button",
        "form",
        "img",
        "textarea",
        "select",
        "option",
        "table",
        "tr",
        "td",
        "th",
        "tbody",
        "thead",
        "ul",
        "li",
        "ol",
      ];
      if (tags.includes(token.toLowerCase())) {
        color = "#569cd6"; // tag
      } else {
        color = "#4ec9b0"; // identifier
      }
    }
    return (
      <span key={idx} style={{ color }}>
        {token}
      </span>
    );
  });
};

export const colorizeCSS = (css: string): React.ReactNode => {
  const tokenRegex =
    /(\.[a-zA-Z0-9_-]+|#[a-zA-Z0-9_-]+|\[[a-zA-Z0-9_-]+|=['"]?[a-zA-Z0-9_-\s&]*['"]?\]|:[a-zA-Z0-9_-]+|>[+~*]?|[a-zA-Z0-9_-]+)/g;
  const tokens = css.split(tokenRegex);
  return tokens.map((token, idx) => {
    if (!token) return null;
    let color = "#d4d4d4";
    if (token.startsWith(".")) {
      color = "#dcdcaa"; // class
    } else if (token.startsWith("#")) {
      color = "#ce9178"; // id
    } else if (token.startsWith("[")) {
      color = "#9cdcfe"; // attribute
    } else if (token.startsWith("=")) {
      color = "#ce9178"; // attribute value
    } else if (token.startsWith(":")) {
      color = "#c586c0"; // pseudo class
    } else if ([">", "+", "~", "*", "^=", "$=", "*="].includes(token)) {
      color = "#ff5d5b"; // combinators
    } else if (/^[a-zA-Z0-9_-]+$/.test(token)) {
      const tags = [
        "input",
        "div",
        "label",
        "span",
        "a",
        "button",
        "form",
        "img",
        "textarea",
        "select",
        "option",
        "table",
        "tr",
        "td",
        "th",
        "tbody",
        "thead",
        "ul",
        "li",
        "ol",
      ];
      if (tags.includes(token.toLowerCase())) {
        color = "#569cd6"; // tag
      }
    }
    return (
      <span key={idx} style={{ color }}>
        {token}
      </span>
    );
  });
};

export const getPlaywrightActions = (tag: string, type?: string): string[] => {
  const t = tag.toLowerCase();
  const typ = type?.toLowerCase() || "";
  const baseActions = [
    "click",
    "hover",
    "focus",
    "toBeVisible",
    "toBeHidden",
    "toHaveText",
  ];

  if (t === "select") {
    return ["selectOption", ...baseActions];
  }
  if (t === "input") {
    if (typ === "checkbox" || typ === "radio") {
      return ["check", "uncheck", ...baseActions];
    }
    return ["fill", "type", ...baseActions];
  }
  if (t === "textarea") {
    return ["fill", "type", ...baseActions];
  }
  return baseActions;
};

export const getPlaywrightSnippet = (action: string, locator: string): string => {
  switch (action) {
    case "click":
      return `await ${locator}.click();`;
    case "fill":
      return `await ${locator}.fill('text');`;
    case "type":
      return `await ${locator}.pressSequentially('text');`;
    case "hover":
      return `await ${locator}.hover();`;
    case "focus":
      return `await ${locator}.focus();`;
    case "check":
      return `await ${locator}.check();`;
    case "uncheck":
      return `await ${locator}.uncheck();`;
    case "selectOption":
      return `await ${locator}.selectOption('value');`;
    case "dblclick":
      return `await ${locator}.dblclick();`;
    case "toBeVisible":
      return `await expect(${locator}).toBeVisible();`;
    case "toBeHidden":
      return `await expect(${locator}).toBeHidden();`;
    case "toHaveText":
      return `await expect(${locator}).toHaveText('value');`;
    case "toHaveValue":
      return `await expect(${locator}).toHaveValue('value');`;
    default:
      return `await ${locator}.click();`;
  }
};

export const colorizePlaywright = (locator: string): React.ReactNode => {
  const tokenRegex =
    /('(?:\\'|[^'])*'|"(?:\\"|[^"])*"|\bpage\b|\bgetBy[a-zA-Z]+\b|\blocator\b|\bname\b|\{|\}|\(|\)|:|,)/g;
  const tokens = locator.split(tokenRegex);
  return tokens.map((token, idx) => {
    if (!token) return null;
    let color = "#d4d4d4";
    if (token.startsWith("'") || token.startsWith('"')) {
      color = "#ce9178"; // string
    } else if (token === "page") {
      color = "#9cdcfe"; // object variable
    } else if (token.startsWith("getBy") || token === "locator") {
      color = "#dcdcaa"; // function name
    } else if (token === "name") {
      color = "#9cdcfe"; // property key
    } else if (["{", "}", "(", ")"].includes(token)) {
      color = "#ffd700"; // brackets
    } else if ([":", ","].includes(token)) {
      color = "#b5cea8"; // operators/separators
    }
    return (
      <span key={idx} style={{ color }}>
        {token}
      </span>
    );
  });
};

export const getSeleniumJava = (codeType: string, val: string): string => {
  switch (codeType) {
    case "CSS":
      return `driver.findElement(By.cssSelector("${val}"))`;
    case "Unique Class Atrribute":
      return `driver.findElement(By.className("${val}"))`;
    case "Unique TagName":
      return `driver.findElement(By.tagName("${val}"))`;
    case "Link Text":
      return `driver.findElement(By.linkText("${val}"))`;
    case "Unique ID":
      return `driver.findElement(By.id("${val}"))`;
    case "Unique Name":
      return `driver.findElement(By.name("${val}"))`;
    case "Unique PartialLinkText":
      return `driver.findElement(By.partialLinkText("${val}"))`;
    default:
      return `driver.findElement(By.xpath("${val}"))`;
  }
};

export const getPlaywrightJava = (codeType: string, val: string): string => {
  switch (codeType) {
    case "CSS":
      return `page.locator("${val}")`;
    case "Unique Class Atrribute":
      return `page.locator(".${val}")`;
    case "Unique TagName":
      return `page.locator("${val}")`;
    case "Link Text":
      return `page.locator("'${val}'")`;
    case "Unique ID":
      return `page.locator("id=${val}")`;
    case "Unique Name":
      return `page.locator("[name='${val}']")`;
    case "Unique PartialLinkText":
      return `page.locator("a:has-text('${val}'")`;
    default:
      return `page.locator("${val}")`;
  }
};

export const getPlaywrightJS = (codeType: string, val: string): string => {
  switch (codeType) {
    case "CSS":
      return `await page.locator("${val}")`;
    case "Unique Class Atrribute":
      return `await page.locator(".${val}")`;
    case "Unique TagName":
      return `await page.locator("${val}")`;
    case "Link Text":
      return `await page.locator("'${val}'")`;
    case "Unique ID":
      return `await page.locator("id=${val}")`;
    case "Unique Name":
      return `await page.locator("[name='${val}']")`;
    case "Unique PartialLinkText":
      return `await page.locator("a:has-text('${val}'")`;
    default:
      return `await page.locator("${val}")`;
  }
};

export const getSeleniumPython = (codeType: string, val: string): string => {
  switch (codeType) {
    case "CSS":
      return `driver.find_element(by=By.CSS_SELECTOR, value="${val}")`;
    case "Unique Class Atrribute":
      return `driver.find_element(by=By.CLASS_NAME, value="${val}")`;
    case "Unique TagName":
      return `driver.find_element(by=By.TAG_NAME, value="${val}")`;
    case "Link Text":
      return `driver.find_element(by=By.LINK_TEXT, value="${val}")`;
    case "Unique ID":
      return `driver.find_element(by=By.ID, value="${val}")`;
    case "Unique Name":
      return `driver.find_element(by=By.NAME, value="${val}")`;
    case "Unique PartialLinkText":
      return `driver.find_element(by=By.PARTIAL_LINK_TEXT, value="${val}")`;
    default:
      return `driver.find_element(by=By.XPATH, value="${val}")`;
  }
};

export const getProtractor = (codeType: string, val: string): string => {
  switch (codeType) {
    case "CSS":
      return `element(by.css("${val}"))`;
    case "Unique Class Atrribute":
      return `element(by.className("${val}"))`;
    case "Unique TagName":
      return `element(by.tagName("${val}"))`;
    case "Link Text":
      return `element(by.linkText("${val}"))`;
    case "Unique ID":
      return `element(by.id("${val}"))`;
    case "Unique Name":
      return `element(by.name("${val}"))`;
    case "Unique PartialLinkText":
      return `element(by.partialLinkText("${val}"))`;
    default:
      return `element(by.xpath("${val}"))`;
  }
};

export const getCypress = (codeType: string, val: string): string => {
  switch (codeType) {
    case "CSS":
      return `cy.get("${val}")`;
    case "Unique Class Atrribute":
      return `cy.get(".${val}")`;
    case "Unique TagName":
      return `cy.get("${val}")`;
    case "Link Text":
      return `cy.contains("${val}")`;
    case "Unique ID":
      return `cy.get("#${val}")`;
    case "Unique Name":
      return `cy.get("[name='${val}']")`;
    case "Unique PartialLinkText":
      return `cy.contains("${val}")`;
    default:
      return `cy.xpath("${val}")`;
  }
};

export function getCustomSnippet(
  actionType: string,
  codeType: string,
  val: string,
  variable: string,
  method: string,
  templates: ChromeStorageResult,
): string {
  let locatorValue = "";
  const customLang = templates.customLang || "javacs";

  if (customLang === "jscs") {
    locatorValue = getProtractor(codeType, val);
  } else {
    switch (codeType) {
      case "CSS":
        locatorValue = `@FindBy(css = "${val}")\n`;
        break;
      case "Unique Class Atrribute":
        locatorValue = `@FindBy(className = "${val}")\n`;
        break;
      case "Unique TagName":
        locatorValue = `@FindBy(tagName = "${val}")\n`;
        break;
      case "Link Text":
        locatorValue = `@FindBy(linkText = "${val}")\n`;
        break;
      case "Unique ID":
        locatorValue = `@FindBy(id = "${val}")\n`;
        break;
      case "Unique Name":
        locatorValue = `@FindBy(name = "${val}")\n`;
        break;
      case "Unique PartialLinkText":
        locatorValue = `@FindBy(partialLinkText = "${val}")\n`;
        break;
      default:
        locatorValue = `@FindBy(xpath = "${val}")\n`;
        break;
    }
  }

  let template = "";
  switch (actionType) {
    case "click":
      template =
        templates.clickvalue !== undefined && templates.clickvalue !== ""
          ? templates.clickvalue
          : DEFAULT_TEMPLATES[customLang].click;
      break;
    case "sendKeys":
      template =
        templates.sendvalue !== undefined && templates.sendvalue !== ""
          ? templates.sendvalue
          : DEFAULT_TEMPLATES[customLang].send;
      break;
    case "getText":
      template =
        templates.textvalue !== undefined && templates.textvalue !== ""
          ? templates.textvalue
          : DEFAULT_TEMPLATES[customLang].text;
      break;
    case "getAttribute":
      template =
        templates.attrvalue !== undefined && templates.attrvalue !== ""
          ? templates.attrvalue
          : DEFAULT_TEMPLATES[customLang].attr;
      break;
    default:
      return "";
  }

  let result = template;
  if (result.includes("${lc}"))
    result = result.replaceAll("${lc}", locatorValue);
  if (result.includes("${vn}")) result = result.replaceAll("${vn}", variable);
  if (result.includes("${mn}")) result = result.replaceAll("${mn}", method);

  return result.trim();
}

export function generateRecordedScript(
  steps: any[],
  initialUrl: string,
  currentLang: string,
  templates: ChromeStorageResult,
): string {
  const formattedSteps = steps
    .map((step) => {
      if (currentLang === "playwrightJS") {
        const locator = step.playwrightLocator;
        const call = locator.startsWith("page.")
          ? locator
          : "page.locator('" + locator + "')";
        if (step.action === "click") {
          return "  await " + call + ".click();";
        } else if (step.action === "fill") {
          return "  await " + call + ".fill('" + (step.value || "") + "');";
        } else if (step.action === "select") {
          return "  await " + call + ".selectOption('" + (step.value || "") + "');";
        } else if (step.action === "assert_visible") {
          return "  await expect(" + call + ").toBeVisible();";
        }
      } else if (currentLang === "playwrightJava") {
        const locator = step.playwrightLocator;
        const call = locator.startsWith("page.")
          ? locator
          : "page.locator(\"" + locator + "\")";
        if (step.action === "click") {
          return "    " + call + ".click();";
        } else if (step.action === "fill") {
          return "    " + call + ".fill(\"" + (step.value || "") + "\");";
        } else if (step.action === "select") {
          return "    " + call + ".selectOption(\"" + (step.value || "") + "\");";
        } else if (step.action === "assert_visible") {
          return "    assertThat(" + call + ").isVisible();";
        }
      } else if (currentLang === "javas") {
        const xpath = step.xpathLocator;
        if (step.action === "click") {
          return "    driver.findElement(By.xpath(\"" + xpath + "\")).click();";
        } else if (step.action === "fill") {
          return "    driver.findElement(By.xpath(\"" + xpath + "\")).sendKeys(\"" + (step.value || "") + "\");";
        } else if (step.action === "select") {
          return "    new Select(driver.findElement(By.xpath(\"" + xpath + "\"))).selectByValue(\"" + (step.value || "") + "\");";
        } else if (step.action === "assert_visible") {
          return "    assertTrue(driver.findElement(By.xpath(\"" + xpath + "\")).isDisplayed());";
        }
      } else if (currentLang === "py") {
        const xpath = step.xpathLocator;
        if (step.action === "click") {
          return "    driver.find_element(By.XPATH, \"" + xpath + "\").click()";
        } else if (step.action === "fill") {
          return "    driver.find_element(By.XPATH, \"" + xpath + "\").send_keys(\"" + (step.value || "") + "\")";
        } else if (step.action === "select") {
          return "    Select(driver.find_element(By.XPATH, \"" + xpath + "\")).select_by_value(\"" + (step.value || "") + "\")";
        } else if (step.action === "assert_visible") {
          return "    assert driver.find_element(By.XPATH, \"" + xpath + "\").is_displayed()";
        }
      } else if (currentLang === "csharp") {
        const xpath = step.xpathLocator;
        if (step.action === "click") {
          return "    driver.FindElement(By.XPath(\"" + xpath + "\")).Click();";
        } else if (step.action === "fill") {
          return "    driver.FindElement(By.XPath(\"" + xpath + "\")).SendKeys(\"" + (step.value || "") + "\");";
        } else if (step.action === "select") {
          return "    new SelectElement(driver.FindElement(By.XPath(\"" + xpath + "\"))).SelectByValue(\"" + (step.value || "") + "\");";
        } else if (step.action === "assert_visible") {
          return "    Assert.IsTrue(driver.FindElement(By.XPath(\"" + xpath + "\")).Displayed);";
        }
      } else if (currentLang === "protractorjs") {
        const xpath = step.xpathLocator;
        if (step.action === "click") {
          return "    await element(by.xpath('" + xpath + "')).click();";
        } else if (step.action === "fill") {
          return "    await element(by.xpath('" + xpath + "')).sendKeys('" + (step.value || "") + "');";
        } else if (step.action === "assert_visible") {
          return "    expect(await element(by.xpath('" + xpath + "')).isDisplayed()).toBe(true);";
        }
      } else if (currentLang === "cypress") {
        const locator = step.cypressLocator || ("cy.xpath('" + step.xpathLocator + "')");
        if (step.action === "click") {
          return "  " + locator + ".click();";
        } else if (step.action === "fill") {
          return "  " + locator + ".type('" + (step.value || "") + "');";
        } else if (step.action === "select") {
          return "  " + locator + ".select('" + (step.value || "") + "');";
        } else if (step.action === "assert_visible") {
          return "  " + locator + ".should('be.visible');";
        }
      } else if (currentLang === "custom") {
        const variable = step.variableName || "ele";
        const method = step.methodName || "ele";
        const xpath = step.xpathLocator;
        if (step.action === "click") {
          return (
            "    " +
            getCustomSnippet(
              "click",
              "XPath",
              xpath,
              variable,
              method,
              templates,
            )
          );
        } else if (step.action === "assert_visible") {
          return "    // Assert visibility of element: " + xpath;
        } else {
          return (
            "    " +
            getCustomSnippet(
              "sendKeys",
              "XPath",
              xpath,
              variable,
              method,
              templates,
            ).replaceAll("${value}", step.value || "")
          );
        }
      }
      return "";
    })
    .filter((line) => line !== "")
    .join("\n");

  switch (currentLang) {
    case "playwrightJS":
      return "import { test, expect } from '@playwright/test';\n\ntest('recorded test', async ({ page }) => {\n  await page.goto('" + initialUrl + "');\n" + formattedSteps + "\n});";
    case "playwrightJava":
      return "import com.microsoft.playwright.*;\n\npublic class RecordedTest {\n  public static void main(String[] args) {\n    try (Playwright playwright = Playwright.create()) {\n      Browser browser = playwright.chromium().launch(new BrowserType.LaunchOptions().setHeadless(false));\n      Page page = browser.newPage();\n      page.navigate(\"" + initialUrl + "\");\n" + formattedSteps + "\n    }\n  }\n}";
    case "javas":
      return "import org.openqa.selenium.By;\nimport org.openqa.selenium.WebDriver;\nimport org.openqa.selenium.chrome.ChromeDriver;\nimport org.openqa.selenium.support.ui.Select;\n\npublic class RecordedTest {\n  public static void main(String[] args) {\n    WebDriver driver = new ChromeDriver();\n    driver.get(\"" + initialUrl + "\");\n" + formattedSteps + "\n    driver.quit();\n  }\n}";
    case "py":
      return "from selenium import webdriver\nfrom selenium.webdriver.common.by import By\nfrom selenium.webdriver.support.ui import Select\n\ndriver = webdriver.Chrome()\ndriver.get(\"" + initialUrl + "\")\n" + formattedSteps + "\ndriver.quit()";
    case "csharp":
      return "using OpenQA.Selenium;\nusing OpenQA.Selenium.Chrome;\nusing OpenQA.Selenium.Support.UI;\n\nclass RecordedTest {\n  static void Main() {\n    IWebDriver driver = new ChromeDriver();\n    driver.Navigate().GoToUrl(\"" + initialUrl + "\");\n" + formattedSteps + "\n    driver.Quit();\n  }\n}";
    case "protractorjs":
      return "import { browser, element, by } from 'protractor';\n\ndescribe('Recorded Test', () => {\n  it('should execute recorded actions', async () => {\n    await browser.get('" + initialUrl + "');\n" + formattedSteps + "\n  });\n});";
    case "cypress":
      return "describe('Recorded Test', () => {\n  it('should execute recorded actions', () => {\n    cy.visit('" + initialUrl + "');\n" + formattedSteps + "\n  });\n});";
    case "custom":
      return "// Custom Framework Recorded Script\n// Start URL: " + initialUrl + "\n\n" + formattedSteps;
    default:
      return formattedSteps;
  }
}

export const getActionsForTag = (tag: string, inputType: string): string[] => {
  if (tag === "textarea") return ACTION_LABELS.textarea;
  if (tag === "input") {
    if (["submit", "radio", "checkbox"].includes(inputType)) {
      return ACTION_LABELS.input.click;
    }
    return ACTION_LABELS.input.send;
  }
  if (tag === "img") return ACTION_LABELS.img;
  return ACTION_LABELS.default;
};
