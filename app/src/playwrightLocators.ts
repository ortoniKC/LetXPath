import { getNumberOfXPath } from './utils';

// Helper to determine the Playwright ARIA role
export const getPlaywrightRole = (tag: string, type?: string): string | null => {
  const t = tag.toLowerCase();
  if (t === 'button') return 'button';
  if (t === 'a') return 'link';
  if (t === 'h1' || t === 'h2' || t === 'h3' || t === 'h4' || t === 'h5' || t === 'h6') return 'heading';
  if (t === 'input') {
    const typeLower = type?.toLowerCase();
    if (typeLower === 'checkbox') return 'checkbox';
    if (typeLower === 'radio') return 'radio';
    if (typeLower === 'button' || typeLower === 'submit' || typeLower === 'reset') return 'button';
    return 'textbox';
  }
  if (t === 'textarea') return 'textbox';
  if (t === 'select') return 'combobox';
  return null;
};

// Helper to get accessible name for role selector
export const getAccessibleName = (el: HTMLElement): string => {
  let name = "";
  if (el.getAttribute('aria-label')) {
    name = el.getAttribute('aria-label') || "";
  } else if (el.id) {
    const label = el.ownerDocument.querySelector(`label[for="${el.id}"]`);
    if (label) name = label.textContent || "";
  }
  if (!name) {
    const preceding = el.previousElementSibling;
    if (preceding && preceding.tagName === 'LABEL') {
      name = preceding.textContent || "";
    } else {
      const closestLabel = el.closest('label');
      if (closestLabel) {
        name = closestLabel.textContent || "";
      }
    }
  }
  if (!name && el.getAttribute('title')) {
    name = el.getAttribute('title') || "";
  }
  if (!name && el.getAttribute('placeholder')) {
    name = el.getAttribute('placeholder') || "";
  }
  if (!name && el.getAttribute('alt')) {
    name = el.getAttribute('alt') || "";
  }
  if (!name) {
    name = el.textContent || "";
  }
  return name.trim().replace(/\s+/g, ' ');
};

// Get the associated label text
export const getElementLabelText = (el: HTMLElement): string => {
  let labelText = "";
  if (el.id) {
    const label = el.ownerDocument.querySelector(`label[for="${el.id}"]`);
    if (label) labelText = label.textContent || "";
  }
  if (!labelText) {
    const preceding = el.previousElementSibling;
    if (preceding && preceding.tagName === 'LABEL') {
      labelText = preceding.textContent || "";
    } else {
      const closestLabel = el.closest('label');
      if (closestLabel) {
        labelText = closestLabel.textContent || "";
      }
    }
  }
  return labelText.trim().replace(/\s+/g, ' ');
};

// Core locator builder
export function buildPlaywrightLocators(
  element: HTMLElement,
  xpathData: [number, string, string][],
  cssData: [number, string, string][]
): [number, string, string][] {
  const list: [number, string, string][] = [];
  const doc = element.ownerDocument;
  const tag = element.tagName.toLowerCase();
  const type = element.getAttribute('type') || undefined;

  // 1. page.getByTestId
  const testIdAttrs = ['data-testid', 'data-test-id', 'data-test', 'testid'];
  for (const attr of testIdAttrs) {
    const testId = element.getAttribute(attr);
    if (testId) {
      const escaped = testId.replace(/'/g, "\\'");
      const selector = `[${attr}="${escaped}"]`;
      const count = doc.querySelectorAll(selector).length;
      if (count === 1) {
        list.push([1, `getByTestId ('${attr}')`, `page.getByTestId('${escaped}')`]);
      } else if (count > 1) {
        // Disambiguate with index
        const idx = Array.from(doc.querySelectorAll(selector)).indexOf(element);
        if (idx !== -1) {
          list.push([1.5, `getByTestId ('${attr}') [index]`, `page.getByTestId('${escaped}').nth(${idx})`]);
        }
      }
      break;
    }
  }

  // 2. page.getByRole
  const role = getPlaywrightRole(tag, type);
  if (role) {
    const name = getAccessibleName(element);
    // Let's count elements with the same role and name on the page
    let count = 0;
    const sameRoleElements: HTMLElement[] = [];
    const all = doc.getElementsByTagName('*');
    for (let i = 0; i < all.length; i++) {
      const el = all[i] as HTMLElement;
      const elRole = getPlaywrightRole(el.tagName, el.getAttribute('type') || undefined);
      if (elRole === role) {
        const elName = getAccessibleName(el);
        if (elName === name) {
          sameRoleElements.push(el);
          count++;
        }
      }
    }

    const escapedName = name.replace(/'/g, "\\'");
    if (count === 1) {
      if (escapedName) {
        list.push([2, `getByRole ('${role}')`, `page.getByRole('${role}', { name: '${escapedName}' })`]);
      } else {
        list.push([2, `getByRole ('${role}')`, `page.getByRole('${role}')`]);
      }
    } else if (count > 1) {
      const idx = sameRoleElements.indexOf(element);
      if (idx !== -1) {
        if (escapedName) {
          list.push([2.5, `getByRole ('${role}') [index]`, `page.getByRole('${role}', { name: '${escapedName}' }).nth(${idx})`]);
        } else {
          list.push([2.5, `getByRole ('${role}') [index]`, `page.getByRole('${role}').nth(${idx})`]);
        }
      }
    }
  }

  // 3. page.getByLabel
  const labelText = getElementLabelText(element);
  if (labelText) {
    // Count labels with the same text
    let count = 0;
    const sameLabelElements: HTMLElement[] = [];
    const all = doc.getElementsByTagName('*');
    for (let i = 0; i < all.length; i++) {
      const el = all[i] as HTMLElement;
      const elLabel = getElementLabelText(el);
      if (elLabel === labelText && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) {
        sameLabelElements.push(el);
        count++;
      }
    }

    const escapedLabel = labelText.replace(/'/g, "\\'");
    if (count === 1) {
      list.push([3, 'getByLabel', `page.getByLabel('${escapedLabel}')`]);
    } else if (count > 1) {
      const idx = sameLabelElements.indexOf(element);
      if (idx !== -1) {
        list.push([3.5, 'getByLabel [index]', `page.getByLabel('${escapedLabel}').nth(${idx})`]);
      }
    }
  }

  // 4. page.getByPlaceholder
  const placeholder = element.getAttribute('placeholder');
  if (placeholder) {
    const escaped = placeholder.replace(/'/g, "\\'");
    const selector = `[placeholder="${escaped}"]`;
    const count = doc.querySelectorAll(selector).length;
    if (count === 1) {
      list.push([4, 'getByPlaceholder', `page.getByPlaceholder('${escaped}')`]);
    } else if (count > 1) {
      const idx = Array.from(doc.querySelectorAll(selector)).indexOf(element);
      if (idx !== -1) {
        list.push([4.5, 'getByPlaceholder [index]', `page.getByPlaceholder('${escaped}').nth(${idx})`]);
      }
    }
  }

  // 5. page.getByText
  const text = element.textContent?.trim() || "";
  if (text && text.length > 1 && text.length < 80) {
    const escaped = text.replace(/'/g, "\\'");
    let count = 0;
    try {
      const xpath = `//*[normalize-space(text())='${escaped}']`;
      const num = getNumberOfXPath(xpath);
      count = num !== undefined ? num : 0;
    } catch (e) {}

    if (count === 1) {
      list.push([5, 'getByText', `page.getByText('${escaped}')`]);
    } else if (count > 1) {
      // Find index of this node among elements with the same text
      try {
        const xpath = `//*[normalize-space(text())='${escaped}']`;
        const res = doc.evaluate(xpath, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        let idx = -1;
        for (let i = 0; i < res.snapshotLength; i++) {
          if (res.snapshotItem(i) === element) {
            idx = i;
            break;
          }
        }
        if (idx !== -1) {
          list.push([5.5, 'getByText [index]', `page.getByText('${escaped}').nth(${idx})`]);
        }
      } catch (e) {}
    }
  }

  // 6. page.getByAltText
  const alt = element.getAttribute('alt');
  if (alt) {
    const escaped = alt.replace(/'/g, "\\'");
    const selector = `[alt="${escaped}"]`;
    const count = doc.querySelectorAll(selector).length;
    if (count === 1) {
      list.push([6, 'getByAltText', `page.getByAltText('${escaped}')`]);
    } else if (count > 1) {
      const idx = Array.from(doc.querySelectorAll(selector)).indexOf(element);
      if (idx !== -1) {
        list.push([6.5, 'getByAltText [index]', `page.getByAltText('${escaped}').nth(${idx})`]);
      }
    }
  }

  // 7. page.getByTitle
  const title = element.getAttribute('title');
  if (title) {
    const escaped = title.replace(/'/g, "\\'");
    const selector = `[title="${escaped}"]`;
    const count = doc.querySelectorAll(selector).length;
    if (count === 1) {
      list.push([7, 'getByTitle', `page.getByTitle('${escaped}')`]);
    } else if (count > 1) {
      const idx = Array.from(doc.querySelectorAll(selector)).indexOf(element);
      if (idx !== -1) {
        list.push([7.5, 'getByTitle [index]', `page.getByTitle('${escaped}').nth(${idx})`]);
      }
    }
  }

  // 8. Fallback locator ID, CSS and XPath
  const id = element.getAttribute('id');
  if (id) {
    const escaped = id.replace(/'/g, "\\'");
    list.push([8, 'locator (ID)', `page.locator('#${escaped}')`]);
  }

  if (cssData && cssData.length > 0) {
    const cssVal = cssData[0][2];
    const escaped = cssVal.replace(/'/g, "\\'");
    list.push([9, 'locator (CSS)', `page.locator('${escaped}')`]);
  }

  if (xpathData && xpathData.length > 0) {
    const xpathVal = xpathData[0][2];
    const escaped = xpathVal.replace(/'/g, "\\'");
    list.push([10, 'locator (XPath)', `page.locator('${escaped}')`]);
  }

  // Sort by priority (lowest number first)
  list.sort((a, b) => a[0] - b[0]);
  return list;
}
