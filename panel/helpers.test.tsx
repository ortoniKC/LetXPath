import { describe, it, expect } from "vitest";
import {
  getPlaywrightActions,
  getPlaywrightSnippet,
  getSeleniumJava,
  getPlaywrightJava,
  getPlaywrightJS,
  getSeleniumPython,
  getProtractor,
  getCypress,
  colorizeCode,
} from "./helpers";

describe("Panel Helpers - Selector Actions", () => {
  describe("getPlaywrightActions", () => {
    it("should return correct actions for select tag", () => {
      const actions = getPlaywrightActions("select");
      expect(actions).toContain("selectOption");
      expect(actions).toContain("click");
    });

    it("should return correct actions for checkbox input", () => {
      const actions = getPlaywrightActions("input", "checkbox");
      expect(actions).toContain("check");
      expect(actions).toContain("uncheck");
      expect(actions).toContain("click");
    });

    it("should return correct actions for text input", () => {
      const actions = getPlaywrightActions("input", "text");
      expect(actions).toContain("fill");
      expect(actions).toContain("type");
      expect(actions).not.toContain("check");
    });

    it("should return base actions for generic tags", () => {
      const actions = getPlaywrightActions("div");
      expect(actions).toContain("click");
      expect(actions).toContain("toBeVisible");
      expect(actions).not.toContain("fill");
    });
  });

  describe("getPlaywrightSnippet", () => {
    it("should generate correct snippet for click action", () => {
      const snippet = getPlaywrightSnippet("click", "page.locator('button')");
      expect(snippet).toBe("await page.locator('button').click();");
    });

    it("should generate correct snippet for fill action", () => {
      const snippet = getPlaywrightSnippet("fill", "page.locator('input')");
      expect(snippet).toBe("await page.locator('input').fill('text');");
    });

    it("should generate correct snippet for toBeVisible assertion", () => {
      const snippet = getPlaywrightSnippet("toBeVisible", "page.locator('div')");
      expect(snippet).toBe("await expect(page.locator('div')).toBeVisible();");
    });
  });
});

describe("Panel Helpers - Code Generation", () => {
  const cssSelector = "#submit-btn";
  const uniqueId = "btn-123";

  it("should generate correct Selenium Java selector", () => {
    expect(getSeleniumJava("CSS", cssSelector)).toBe(
      `driver.findElement(By.cssSelector("${cssSelector}"))`,
    );
    expect(getSeleniumJava("Unique ID", uniqueId)).toBe(`driver.findElement(By.id("${uniqueId}"))`);
  });

  it("should generate correct Playwright Java selector", () => {
    expect(getPlaywrightJava("CSS", cssSelector)).toBe(`page.locator("${cssSelector}")`);
    expect(getPlaywrightJava("Unique ID", uniqueId)).toBe(`page.locator("id=${uniqueId}")`);
  });

  it("should generate correct Playwright JS selector", () => {
    expect(getPlaywrightJS("CSS", cssSelector)).toBe(`await page.locator("${cssSelector}")`);
    expect(getPlaywrightJS("Unique ID", uniqueId)).toBe(`await page.locator("id=${uniqueId}")`);
  });

  it("should generate correct Selenium Python selector", () => {
    expect(getSeleniumPython("CSS", cssSelector)).toBe(
      `driver.find_element(by=By.CSS_SELECTOR, value="${cssSelector}")`,
    );
    expect(getSeleniumPython("Unique ID", uniqueId)).toBe(
      `driver.find_element(by=By.ID, value="${uniqueId}")`,
    );
  });

  it("should generate correct Protractor selector", () => {
    expect(getProtractor("CSS", cssSelector)).toBe(`element(by.css("${cssSelector}"))`);
    expect(getProtractor("Unique ID", uniqueId)).toBe(`element(by.id("${uniqueId}"))`);
  });

  it("should generate correct Cypress selector", () => {
    expect(getCypress("CSS", cssSelector)).toBe(`cy.get("${cssSelector}")`);
    expect(getCypress("Unique ID", uniqueId)).toBe(`cy.get("#${uniqueId}")`);
  });
});

describe("Panel Helpers - Syntax Highlighting", () => {
  it("should tokenize code correctly and parse async/await/page keywords properly", () => {
    const code = "test('recorded test', async ({ page }) => { await page.goto('url'); });";
    const result = colorizeCode(code, "playwrightJS");

    expect(result).toBeDefined();

    const elements = result as React.ReactElement[];

    const stringToken = elements.find((el) => el && el.props.children === "'recorded test'");
    expect(stringToken).toBeDefined();
    expect(stringToken?.props.style.color).toBe("#ce9178");

    const asyncToken = elements.find((el) => el && el.props.children === "async");
    expect(asyncToken).toBeDefined();
    expect(asyncToken?.props.style.color).toBe("#569cd6");

    const pageToken = elements.find((el) => el && el.props.children === "page");
    expect(pageToken).toBeDefined();
    expect(pageToken?.props.style.color).toBe("#9cdcfe");
  });
});
