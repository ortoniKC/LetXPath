import { getPlaywrightRole, getAccessibleName, getElementLabelText } from './playwrightLocators';
import { parseSelector, parseAttributeSelector } from './playwright/selectorParser';

function parseStringArg(str: string): string {
  str = str.trim();
  if ((str.startsWith("'") && str.endsWith("'")) || (str.startsWith('"') && str.endsWith('"'))) {
    str = str.substring(1, str.length - 1);
  }
  return str.replace(/\\'/g, "'").replace(/\\"/g, '"');
}

export function parsePlaywrightChain(locatorStr: string): { method: string; args: string }[] {
  const chain: { method: string; args: string }[] = [];
  let s = locatorStr.trim();
  if (s.startsWith('await ')) {
    s = s.substring(6).trim();
  }
  if (s.startsWith('page.')) {
    s = s.substring(5).trim();
  }
  
  let i = 0;
  while (i < s.length) {
    let method = '';
    while (i < s.length && s[i] !== '(' && s[i] !== '.') {
      method += s[i];
      i++;
    }
    method = method.trim();
    if (s[i] === '(') {
      i++; // consume '('
      let args = '';
      let parenCount = 1;
      let inSingleQuote = false;
      let inDoubleQuote = false;
      let escaped = false;
      
      while (i < s.length && parenCount > 0) {
        const char = s[i];
        if (escaped) {
          args += char;
          escaped = false;
        } else if (char === '\\') {
          args += char;
          escaped = true;
        } else if (char === "'" && !inDoubleQuote) {
          inSingleQuote = !inSingleQuote;
          args += char;
        } else if (char === '"' && !inSingleQuote) {
          inDoubleQuote = !inDoubleQuote;
          args += char;
        } else if (!inSingleQuote && !inDoubleQuote) {
          if (char === '(') {
            parenCount++;
          } else if (char === ')') {
            parenCount--;
          }
          if (parenCount > 0) {
            args += char;
          }
        } else {
          args += char;
        }
        i++;
      }
      if (method) {
        chain.push({ method, args: args.trim() });
      }
    } else if (s[i] === '.') {
      i++; // consume '.'
    } else {
      i++;
    }
  }
  return chain;
}

function isDescendantOfAnySet(el: HTMLElement, parentSet: Set<HTMLElement>): boolean {
  let parent: Node | null = el.parentNode || el.parentElement;
  while (parent) {
    if (parentSet.has(parent as HTMLElement)) return true;
    if (parent instanceof ShadowRoot) {
      parent = parent.host;
    } else {
      parent = parent.parentNode || (parent as HTMLElement).parentElement;
    }
  }
  return false;
}

function getAllElementsIncludingShadow(root: Node | ShadowRoot): HTMLElement[] {
  const result: HTMLElement[] = [];
  const walk = (node: Node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      result.push(node as HTMLElement);
      const el = node as HTMLElement;
      if (el.shadowRoot) {
        walk(el.shadowRoot);
      }
    }
    let child = node.firstChild;
    while (child) {
      walk(child);
      child = child.nextSibling;
    }
  };
  walk(root);
  return result;
}

function detectExact(text: string): { exact?: boolean, text: string } {
  let exact = false;
  if (text.endsWith('"')) {
    text = JSON.parse(text);
    exact = true;
  } else if (text.endsWith('"s')) {
    text = JSON.parse(text.substring(0, text.length - 1));
    exact = true;
  } else if (text.endsWith('"i')) {
    text = JSON.parse(text.substring(0, text.length - 1));
    exact = false;
  }
  return { exact, text };
}

function evaluateSelectorPart(part: any, doc: Document): HTMLElement[] {
  if (part.name === 'css') {
    const all = getAllElementsIncludingShadow(doc);
    return all.filter(el => {
      try {
        return el.matches(part.source || part.body);
      } catch {
        return false;
      }
    });
  }
  if (part.name === 'xpath') {
    const stepMatches: HTMLElement[] = [];
    try {
      const xpathResult = doc.evaluate(part.source || part.body, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      for (let idx = 0; idx < xpathResult.snapshotLength; idx++) {
        stepMatches.push(xpathResult.snapshotItem(idx) as HTMLElement);
      }
    } catch {
      // ignore
    }
    return stepMatches;
  }
  if (part.name === 'internal:testid') {
    const attrSelector = parseAttributeSelector(part.body as string, true);
    const value = attrSelector.attributes[0]?.value;
    const all = getAllElementsIncludingShadow(doc);
    const testIdAttrs = ['data-testid', 'data-test-id', 'data-test', 'testid'];
    return all.filter(el => {
      return testIdAttrs.some(attr => el.getAttribute(attr) === value);
    });
  }
  if (part.name === 'internal:role') {
    const attrSelector = parseAttributeSelector(part.body as string, true);
    const roleVal = attrSelector.name;
    let nameVal: string | null = null;
    let exact = false;
    for (const attr of attrSelector.attributes) {
      if (attr.name === 'name') {
        nameVal = attr.value;
        exact = attr.caseSensitive;
      }
    }
    const all = getAllElementsIncludingShadow(doc);
    return all.filter(el => {
      const role = getPlaywrightRole(el.tagName, el.getAttribute('type') || undefined);
      if (role !== roleVal) return false;
      if (nameVal !== null) {
        const accName = getAccessibleName(el);
        return exact 
          ? accName === nameVal 
          : accName.toLowerCase().includes(nameVal.toLowerCase());
      }
      return true;
    });
  }
  if (part.name === 'internal:text') {
    const { exact, text } = detectExact(part.body as string);
    const val = text;
    const all = getAllElementsIncludingShadow(doc);
    return all.filter(el => {
      const textContent = el.textContent?.replace(/\s+/g, ' ').trim() || '';
      const matches = exact 
        ? textContent === val 
        : textContent.toLowerCase().includes(val.toLowerCase());
      if (!matches) return false;
      
      // leaf-most match constraint
      return !Array.from(el.children).some(child => {
        const childText = child.textContent?.replace(/\s+/g, ' ').trim() || '';
        return exact 
          ? childText === val 
          : childText.toLowerCase().includes(val.toLowerCase());
      });
    });
  }
  if (part.name === 'internal:label') {
    const { exact, text } = detectExact(part.body as string);
    const val = text;
    const all = getAllElementsIncludingShadow(doc);
    return all.filter(el => {
      const elLabel = getElementLabelText(el);
      return exact 
        ? elLabel === val 
        : elLabel.toLowerCase().includes(val.toLowerCase());
    });
  }
  if (part.name === 'internal:attr') {
    const attrSelector = parseAttributeSelector(part.body as string, true);
    const { name, value, caseSensitive } = attrSelector.attributes[0];
    const val = value as string;
    const exact = !!caseSensitive;
    const all = getAllElementsIncludingShadow(doc);
    return all.filter(el => {
      const attrVal = el.getAttribute(name) || '';
      return exact 
        ? attrVal === val 
        : attrVal.toLowerCase().includes(val.toLowerCase());
    });
  }
  return [];
}

export function evaluatePlaywrightLocator(locatorStr: string, doc: Document): HTMLElement[] {
  const chain = parsePlaywrightChain(locatorStr);
  if (chain.length === 0) return [];
  
  const operations: { type: 'part' | 'nth' | 'first' | 'last'; data?: any }[] = [];
  
  for (const step of chain) {
    const method = step.method;
    const args = step.args;
    
    if (method === 'locator') {
      const selector = parseStringArg(args);
      const parsed = parseSelector(selector);
      for (const part of parsed.parts) {
        if (part.name === 'nth') {
          operations.push({ type: 'nth', data: parseInt(part.body as string, 10) });
        } else if (part.name === 'first') {
          operations.push({ type: 'first' });
        } else if (part.name === 'last') {
          operations.push({ type: 'last' });
        } else {
          operations.push({ type: 'part', data: part });
        }
      }
    } else if (method === 'first') {
      operations.push({ type: 'first' });
    } else if (method === 'last') {
      operations.push({ type: 'last' });
    } else if (method === 'nth') {
      const idx = parseInt(args, 10);
      operations.push({ type: 'nth', data: idx });
    } else if (method === 'getByTestId') {
      const val = parseStringArg(args);
      operations.push({
        type: 'part',
        data: { name: 'internal:testid', body: `[data-testid="${val.replace(/"/g, '\\"')}"]`, source: '' }
      });
    } else if (method === 'getByPlaceholder') {
      const val = parseStringArg(args);
      const exact = /exact\s*:\s*true/.test(args);
      operations.push({
        type: 'part',
        data: { name: 'internal:attr', body: `[placeholder="${val.replace(/"/g, '\\"')}"${exact ? 's' : 'i'}]`, source: '' }
      });
    } else if (method === 'getByTitle') {
      const val = parseStringArg(args);
      const exact = /exact\s*:\s*true/.test(args);
      operations.push({
        type: 'part',
        data: { name: 'internal:attr', body: `[title="${val.replace(/"/g, '\\"')}"${exact ? 's' : 'i'}]`, source: '' }
      });
    } else if (method === 'getByAltText') {
      const val = parseStringArg(args);
      const exact = /exact\s*:\s*true/.test(args);
      operations.push({
        type: 'part',
        data: { name: 'internal:attr', body: `[alt="${val.replace(/"/g, '\\"')}"${exact ? 's' : 'i'}]`, source: '' }
      });
    } else if (method === 'getByLabel') {
      const val = parseStringArg(args);
      const exact = /exact\s*:\s*true/.test(args);
      operations.push({
        type: 'part',
        data: { name: 'internal:label', body: `"${val.replace(/"/g, '\\"')}"${exact ? 's' : 'i'}`, source: '' }
      });
    } else if (method === 'getByText') {
      let val = '';
      let exact = false;
      const firstComma = args.indexOf(',');
      if (firstComma === -1) {
        val = parseStringArg(args);
      } else {
        val = parseStringArg(args.substring(0, firstComma));
        exact = /exact\s*:\s*true/.test(args.substring(firstComma + 1));
      }
      operations.push({
        type: 'part',
        data: { name: 'internal:text', body: `"${val.replace(/"/g, '\\"')}"${exact ? 's' : 'i'}`, source: '' }
      });
    } else if (method === 'getByRole') {
      let roleVal = '';
      let nameVal: string | null = null;
      let exact = false;
      
      const firstCommaIdx = args.indexOf(',');
      if (firstCommaIdx === -1) {
        roleVal = parseStringArg(args);
      } else {
        roleVal = parseStringArg(args.substring(0, firstCommaIdx));
        const optionsStr = args.substring(firstCommaIdx + 1);
        exact = /exact\s*:\s*true/.test(optionsStr);
        const nameMatch = optionsStr.match(/name\s*:\s*(['"])([\s\S]*?)\1/);
        if (nameMatch) {
          nameVal = nameMatch[2].replace(/\\'/g, "'").replace(/\\"/g, '"');
        }
      }
      
      let body = roleVal;
      if (nameVal !== null) {
        body += `[name="${nameVal.replace(/"/g, '\\"')}"${exact ? 's' : 'i'}]`;
      }
      operations.push({
        type: 'part',
        data: { name: 'internal:role', body, source: '' }
      });
    }
  }
  
  let currentElements: HTMLElement[] = [];
  let isFirstStep = true;
  
  for (const op of operations) {
    if (op.type === 'nth') {
      const idx = op.data;
      if (idx >= 0 && idx < currentElements.length) {
        currentElements = [currentElements[idx]];
      } else if (idx < 0 && Math.abs(idx) <= currentElements.length) {
        currentElements = [currentElements[currentElements.length + idx]];
      } else {
        currentElements = [];
      }
      continue;
    }
    if (op.type === 'first') {
      currentElements = currentElements.length > 0 ? [currentElements[0]] : [];
      continue;
    }
    if (op.type === 'last') {
      currentElements = currentElements.length > 0 ? [currentElements[currentElements.length - 1]] : [];
      continue;
    }
    
    const part = op.data;
    const stepMatches = evaluateSelectorPart(part, doc);
    
    if (isFirstStep) {
      currentElements = stepMatches;
      isFirstStep = false;
    } else {
      const parentSet = new Set(currentElements);
      currentElements = stepMatches.filter(el => isDescendantOfAnySet(el, parentSet));
    }
  }
  
  return currentElements;
}
