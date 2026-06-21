import { asLocator } from './playwright/locatorGenerators';
import { escapeForTextSelector, escapeForAttributeSelector } from './playwright/stringUtils';

function getByTextMatches(doc: Document, val: string, exact: boolean): HTMLElement[] {
  const all = Array.from(doc.getElementsByTagName('*')) as HTMLElement[];
  return all.filter(el => {
    const text = el.textContent?.replace(/\s+/g, ' ').trim() || '';
    const matches = exact 
      ? text === val 
      : text.toLowerCase().includes(val.toLowerCase());
    if (!matches) return false;
    
    // Innermost matching element constraint:
    // Exclude parent elements where child elements also match the text
    return !Array.from(el.children).some(child => {
      const childText = child.textContent?.replace(/\s+/g, ' ').trim() || '';
      return exact 
        ? childText === val 
        : childText.toLowerCase().includes(val.toLowerCase());
    });
  });
}

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
    try {
      const label = el.ownerDocument.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (label) name = label.textContent || "";
    } catch (e) {}
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
    try {
      const label = el.ownerDocument.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (label) labelText = label.textContent || "";
    } catch (e) {}
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
): [number, string, string, string, string, string][] {
  const list: [number, string, string, string, string, string][] = [];
  const doc = element.ownerDocument;
  const tag = element.tagName.toLowerCase();
  const type = element.getAttribute('type') || undefined;

  const getLocators = (priority: number, label: string, selector: string) => {
    const jsVal = asLocator('javascript', selector);
    const pyVal = asLocator('python', selector);
    const javaVal = asLocator('java', selector);
    const csVal = asLocator('csharp', selector);
    return [priority, label, jsVal, pyVal, javaVal, csVal] as [number, string, string, string, string, string];
  };

  // 1. page.getByTestId
  const testIdAttrs = ['data-testid', 'data-test-id', 'data-test', 'testid'];
  for (const attr of testIdAttrs) {
    const testId = element.getAttribute(attr);
    if (testId) {
      const escapedVal = escapeForAttributeSelector(testId, true);
      const selector = `[${attr}=${escapedVal}]`;
      const count = doc.querySelectorAll(selector).length;
      if (count === 1) {
        list.push(getLocators(1, `getByTestId ('${attr}')`, `internal:testid=[data-testid=${escapedVal}]`));
      } else if (count > 1) {
        const idx = Array.from(doc.querySelectorAll(selector)).indexOf(element);
        if (idx !== -1) {
          list.push(getLocators(1.5, `getByTestId ('${attr}') [index]`, `internal:testid=[data-testid=${escapedVal}] >> nth=${idx}`));
        }
      }
      break;
    }
  }

  // 2. page.getByRole
  const role = getPlaywrightRole(tag, type);
  if (role) {
    const name = getAccessibleName(element);
    
    // Find matching elements for substring and exact name matches
    const substringRoleElements: HTMLElement[] = [];
    const exactRoleElements: HTMLElement[] = [];
    
    const all = doc.getElementsByTagName('*');
    for (let i = 0; i < all.length; i++) {
      const el = all[i] as HTMLElement;
      const elRole = getPlaywrightRole(el.tagName, el.getAttribute('type') || undefined);
      if (elRole === role) {
        const elName = getAccessibleName(el);
        if (elName.toLowerCase().includes(name.toLowerCase())) {
          substringRoleElements.push(el);
        }
        if (elName === name) {
          exactRoleElements.push(el);
        }
      }
    }

    if (substringRoleElements.length === 1 && substringRoleElements[0] === element) {
      if (name) {
        const escapedName = escapeForAttributeSelector(name, false);
        list.push(getLocators(2, `getByRole ('${role}')`, `internal:role=${role}[name=${escapedName}]`));
      } else {
        list.push(getLocators(2, `getByRole ('${role}')`, `internal:role=${role}`));
      }
    } else if (exactRoleElements.length === 1 && exactRoleElements[0] === element) {
      const escapedName = escapeForAttributeSelector(name, true);
      list.push(getLocators(2, `getByRole ('${role}') [exact]`, `internal:role=${role}[name=${escapedName}]`));
    } else if (exactRoleElements.length > 1) {
      const idx = exactRoleElements.indexOf(element);
      if (idx !== -1) {
        const escapedName = escapeForAttributeSelector(name, true);
        list.push(getLocators(2.5, `getByRole ('${role}') [exact index]`, `internal:role=${role}[name=${escapedName}] >> nth=${idx}`));
      }
    }
  }

  // 3. page.getByLabel
  const labelText = getElementLabelText(element);
  if (labelText) {
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

    const escapedLabel = escapeForTextSelector(labelText, true);
    if (count === 1) {
      list.push(getLocators(3, 'getByLabel', `internal:label=${escapedLabel}`));
    } else if (count > 1) {
      const idx = sameLabelElements.indexOf(element);
      if (idx !== -1) {
        list.push(getLocators(3.5, 'getByLabel [index]', `internal:label=${escapedLabel} >> nth=${idx}`));
      }
    }
  }

  // 4. page.getByPlaceholder
  const placeholder = element.getAttribute('placeholder');
  if (placeholder) {
    const escaped = placeholder.replace(/"/g, '\\"');
    const selector = `[placeholder="${escaped}"]`;
    const count = doc.querySelectorAll(selector).length;
    const escapedPlaceholder = escapeForAttributeSelector(placeholder, false);
    if (count === 1) {
      list.push(getLocators(4, 'getByPlaceholder', `internal:attr=[placeholder=${escapedPlaceholder}]`));
    } else if (count > 1) {
      const idx = Array.from(doc.querySelectorAll(selector)).indexOf(element);
      if (idx !== -1) {
        list.push(getLocators(4.5, 'getByPlaceholder [index]', `internal:attr=[placeholder=${escapedPlaceholder}] >> nth=${idx}`));
      }
    }
  }

  // 5. page.getByText
  const text = element.textContent?.replace(/\s+/g, ' ').trim() || "";
  if (text && text.length >= 1 && text.length < 80) {
    const substringMatches = getByTextMatches(doc, text, false);
    const exactMatches = getByTextMatches(doc, text, true);
    
    if (substringMatches.length === 1 && substringMatches[0] === element) {
      const escapedText = escapeForTextSelector(text, false);
      list.push(getLocators(5, 'getByText', `internal:text=${escapedText}`));
    } else if (exactMatches.length === 1 && exactMatches[0] === element) {
      const escapedText = escapeForTextSelector(text, true);
      list.push(getLocators(5, 'getByText [exact]', `internal:text=${escapedText}`));
    } else if (exactMatches.length > 1) {
      const idx = exactMatches.indexOf(element);
      if (idx !== -1) {
        const escapedText = escapeForTextSelector(text, true);
        list.push(getLocators(5.5, 'getByText [exact index]', `internal:text=${escapedText} >> nth=${idx}`));
      }
    }
  }

  // 6. page.getByAltText
  const alt = element.getAttribute('alt');
  if (alt) {
    const escaped = alt.replace(/"/g, '\\"');
    const selector = `[alt="${escaped}"]`;
    const count = doc.querySelectorAll(selector).length;
    const escapedAlt = escapeForAttributeSelector(alt, false);
    if (count === 1) {
      list.push(getLocators(6, 'getByAltText', `internal:attr=[alt=${escapedAlt}]`));
    } else if (count > 1) {
      const idx = Array.from(doc.querySelectorAll(selector)).indexOf(element);
      if (idx !== -1) {
        list.push(getLocators(6.5, 'getByAltText [index]', `internal:attr=[alt=${escapedAlt}] >> nth=${idx}`));
      }
    }
  }

  // 7. page.getByTitle
  const title = element.getAttribute('title');
  if (title) {
    const escaped = title.replace(/"/g, '\\"');
    const selector = `[title="${escaped}"]`;
    const count = doc.querySelectorAll(selector).length;
    const escapedTitle = escapeForAttributeSelector(title, false);
    if (count === 1) {
      list.push(getLocators(7, 'getByTitle', `internal:attr=[title=${escapedTitle}]`));
    } else if (count > 1) {
      const idx = Array.from(doc.querySelectorAll(selector)).indexOf(element);
      if (idx !== -1) {
        list.push(getLocators(7.5, 'getByTitle [index]', `internal:attr=[title=${escapedTitle}] >> nth=${idx}`));
      }
    }
  }

  // 8. Fallback locator ID, CSS and XPath
  const id = element.getAttribute('id');
  if (id) {
    list.push(getLocators(8, 'locator (ID)', `#${id}`));
  }

  if (cssData && cssData.length > 0) {
    const cssVal = cssData[0][2];
    list.push(getLocators(9, 'locator (CSS)', `css=${cssVal}`));
  }

  if (xpathData && xpathData.length > 0) {
    const xpathVal = xpathData[0][2];
    list.push(getLocators(10, 'locator (XPath)', `xpath=${xpathVal}`));
  }

  // Sort by priority (lowest number first)
  list.sort((a, b) => a[0] - b[0]);
  return list;
}
