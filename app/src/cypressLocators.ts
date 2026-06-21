export function buildCypressLocators(
  element: HTMLElement,
  xpathData: [number, string, string][],
  cssData: [number, string, string][],
  priorityList: string[]
): [number, string, string][] {
  const list: [number, string, string][] = [];
  const doc = element.ownerDocument;
  const tag = element.tagName.toLowerCase();

  // Helper to check uniqueness of a CSS selector
  const checkCSSUniqueness = (selector: string): { unique: boolean; index: number } => {
    try {
      const matches = Array.from(doc.querySelectorAll(selector));
      if (matches.length === 1) return { unique: true, index: 0 };
      const idx = matches.indexOf(element);
      return { unique: false, index: idx };
    } catch (e) {
      return { unique: false, index: -1 };
    }
  };

  // 1. Process custom priority attributes
  let pIdx = 1;
  for (const attr of priorityList) {
    const value = element.getAttribute(attr);
    if (value) {
      let selector = '';
      if (attr === 'id') {
        selector = `#${CSS.escape(value)}`;
      } else if (attr === 'class') {
        const classes = value.split(/\s+/).filter(Boolean);
        if (classes.length > 0) {
          selector = `.${classes.map(c => CSS.escape(c)).join('.')}`;
        }
      } else {
        selector = `[${attr}="${value.replace(/"/g, '\\"')}"]`;
      }

      if (selector) {
        const check = checkCSSUniqueness(selector);
        if (check.unique) {
          list.push([pIdx, `cy.get ('${attr}')`, `cy.get('${selector}')`]);
        } else if (check.index !== -1) {
          list.push([pIdx + 0.5, `cy.get ('${attr}') [eq]`, `cy.get('${selector}').eq(${check.index})`]);
        }
      }
    }
    pIdx++;
  }

  // 2. Contains Text based locator
  const textContent = element.textContent?.trim() || '';
  if (textContent && textContent.length > 0 && textContent.length < 50) {
    const escapedText = textContent.replace(/'/g, "\\'");
    const textMatches = Array.from(doc.querySelectorAll(tag)).filter(el => el.textContent?.trim() === textContent);
    if (textMatches.length === 1) {
      list.push([pIdx, `cy.contains`, `cy.contains('${escapedText}')`]);
    } else if (textMatches.length > 1) {
      const idx = textMatches.indexOf(element);
      if (idx !== -1) {
        list.push([pIdx + 0.5, `cy.contains [eq]`, `cy.contains('${escapedText}').eq(${idx})`]);
      }
    }
    pIdx++;
  }

  // 3. Fallback CSS selectors from cssData
  if (cssData && cssData.length > 0) {
    cssData.forEach((item) => {
      const [, label, selector] = item;
      const cypressCall = `cy.get('${selector}')`;
      if (!list.some(l => l[2] === cypressCall)) {
        list.push([pIdx, `cy.get (${label})`, cypressCall]);
      }
    });
    pIdx++;
  }

  // 4. Fallback XPath selectors from xpathData
  if (xpathData && xpathData.length > 0) {
    xpathData.forEach((item) => {
      const [, label, xpath] = item;
      const cypressCall = `cy.xpath('${xpath}')`;
      if (!list.some(l => l[2] === cypressCall)) {
        list.push([pIdx, `cy.xpath (${label})`, cypressCall]);
      }
    });
  }

  // Sort by priority index
  return list.sort((a, b) => a[0] - b[0]);
}
