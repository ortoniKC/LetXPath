import { getPlaywrightRole, getAccessibleName, getElementLabelText } from './playwrightLocators';

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
  let parent = el.parentElement;
  while (parent) {
    if (parentSet.has(parent as HTMLElement)) return true;
    parent = parent.parentElement;
  }
  return false;
}

export function evaluatePlaywrightLocator(locatorStr: string, doc: Document): HTMLElement[] {
  const chain = parsePlaywrightChain(locatorStr);
  if (chain.length === 0) return [];
  
  let currentElements: HTMLElement[] = [];
  let isFirstStep = true;
  
  for (const step of chain) {
    const method = step.method;
    const args = step.args;
    let stepMatches: HTMLElement[] = [];
    
    if (method === 'locator') {
      const selector = parseStringArg(args);
      if (selector.startsWith('/') || selector.startsWith('(') || selector.startsWith('./')) {
        const xpathResult = doc.evaluate(selector, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        for (let idx = 0; idx < xpathResult.snapshotLength; idx++) {
          stepMatches.push(xpathResult.snapshotItem(idx) as HTMLElement);
        }
      } else {
        stepMatches = Array.from(doc.querySelectorAll(selector)) as HTMLElement[];
      }
    } else if (method === 'getByTestId') {
      const val = parseStringArg(args);
      const testIdAttrs = ['data-testid', 'data-test-id', 'data-test', 'testid'];
      const selector = testIdAttrs.map(attr => `[${attr}="${val.replace(/"/g, '\\"')}"]`).join(', ');
      stepMatches = Array.from(doc.querySelectorAll(selector)) as HTMLElement[];
    } else if (method === 'getByPlaceholder') {
      const val = parseStringArg(args);
      const selector = `[placeholder="${val.replace(/"/g, '\\"')}"]`;
      stepMatches = Array.from(doc.querySelectorAll(selector)) as HTMLElement[];
    } else if (method === 'getByTitle') {
      const val = parseStringArg(args);
      const selector = `[title="${val.replace(/"/g, '\\"')}"]`;
      stepMatches = Array.from(doc.querySelectorAll(selector)) as HTMLElement[];
    } else if (method === 'getByAltText') {
      const val = parseStringArg(args);
      const selector = `[alt="${val.replace(/"/g, '\\"')}"]`;
      stepMatches = Array.from(doc.querySelectorAll(selector)) as HTMLElement[];
    } else if (method === 'getByLabel') {
      const val = parseStringArg(args);
      const all = Array.from(doc.querySelectorAll('input, textarea, select, button')) as HTMLElement[];
      stepMatches = all.filter(el => getElementLabelText(el) === val);
    } else if (method === 'getByText') {
      const val = parseStringArg(args);
      const all = Array.from(doc.getElementsByTagName('*')) as HTMLElement[];
      stepMatches = all.filter(el => {
        const text = el.textContent?.replace(/\s+/g, ' ').trim() || '';
        const matches = text === val || text.includes(val);
        if (!matches) return false;
        
        // Innermost (leaf-most) matching element constraint:
        // Exclude parent containers where children also match the query
        return !Array.from(el.children).some(child => {
          const childText = child.textContent?.replace(/\s+/g, ' ').trim() || '';
          return childText === val || childText.includes(val);
        });
      });
    } else if (method === 'getByRole') {
      let roleVal = '';
      let nameVal: string | null = null;
      
      const firstCommaIdx = args.indexOf(',');
      if (firstCommaIdx === -1) {
        roleVal = parseStringArg(args);
      } else {
        roleVal = parseStringArg(args.substring(0, firstCommaIdx));
        const optionsStr = args.substring(firstCommaIdx + 1);
        const nameMatch = optionsStr.match(/name\s*:\s*(['"])([\s\S]*?)\1/);
        if (nameMatch) {
          nameVal = nameMatch[2].replace(/\\'/g, "'").replace(/\\"/g, '"');
        }
      }
      
      const all = Array.from(doc.getElementsByTagName('*')) as HTMLElement[];
      stepMatches = all.filter(el => {
        const role = getPlaywrightRole(el.tagName, el.getAttribute('type') || undefined);
        if (role !== roleVal) return false;
        if (nameVal !== null) {
          const accName = getAccessibleName(el);
          return accName === nameVal || accName.includes(nameVal);
        }
        return true;
      });
    } else if (method === 'nth') {
      const idx = parseInt(args, 10);
      if (!isNaN(idx) && idx >= 0 && idx < currentElements.length) {
        currentElements = [currentElements[idx]];
      } else {
        currentElements = [];
      }
      continue;
    } else {
      // Unknown method, skip
      continue;
    }
    
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
