# LetXPath Development Constitution

## Project Overview
LetXPath is a Chrome DevTools extension for generating XPath and CSS selectors with intelligent pattern recognition and code snippet generation for test automation frameworks.

## Core Architecture Principles

### 1. Chrome Extension Communication Model
```
DevTools Panel (devtools.js)
    ↓ chrome.devtools.inspectedWindow.eval()
Content Script (content.js) - DOM Access
    ↓ chrome.runtime.sendMessage()
Service Worker (service_worker.js) - Background Logic
    ↓ chrome.tabs.sendMessage()
Panel UI (panel.js) - User Interface
```

**Rules:**
- DevTools context CANNOT directly access DOM - always use `.eval()` with `useContentScriptContext: true`
- Content scripts have DOM access but limited chrome API access
- Service workers have full chrome API access but NO DOM access
- All cross-context communication MUST be serializable (no functions, DOM nodes)
- Always validate message sources and data types

### 2. XPath Generation Strategy

**Priority Order (from most to least specific):**
1. Unique ID (`id="unique"` → `#unique` or `//*[@id='unique']`)
2. Unique Name (`name="username"` → `[name='username']`)
3. Unique Class (`class="btn-primary"` → `.btn-primary`)
4. Text-based (`<a>Login</a>` → `//a[text()='Login']`)
5. Attribute-based (`[@placeholder='Email']`)
6. Parent-child relationships (`//form//input[1]`)
7. Axes relationships (`preceding-sibling::`, `following-sibling::`)
8. Position-based with index (`(//button)[2]`)

**Implementation Rules:**
- Generate MULTIPLE XPath options, sorted by reliability
- ALWAYS validate XPath uniqueness: `getNumberOfXPath()` must return 1
- Use `maxIndex` limit (default: 3-5) to prevent excessive indexing
- Filter out dynamic/unreliable attributes (see `filterAttributesFromElement()`)
- Normalize text with `normalize-space()` for whitespace handling

### 3. Axes-Based XPath (Parent-Child Navigation)

**Supported Axes:**
- `child::` or `/` - immediate children only
- `parent::` or `..` - immediate parent only
- `descendant::` or `//` - all nested descendants
- `ancestor::` - all parents up to root
- `following-sibling::` - siblings after current
- `preceding-sibling::` - siblings before current

**Anchor XPath Pattern:**
```javascript
// Select parent element (right-click context menu)
// Then select child element
// Generate: //parentLocator//childLocator
// Or: //parentLocator/following-sibling::childLocator
```

**Implementation:**
- Store first selection in `dupArray[0]`
- Store second selection in `dupArray[1]`
- Generate combinations using `getAnchorXPath()`
- Toggle between `preceding-sibling::` and `following-sibling::` with context menu

### 4. CSS Selector Generation

**Priority Order:**
1. ID: `#elementId`
2. Class: `.className` or `tag.className`
3. Attribute: `tag[attr='value']`
4. Descendant: `parent > child`
5. Nth-child: `:nth-of-type(n)`

**Rules:**
- CSS selectors stored separately in `CSSPATHDATA` array
- XPath-to-CSS conversion available via `xPathToCss()` function
- NOT all XPath patterns have CSS equivalents (axes, text functions)
- Validate CSS with `document.querySelectorAll()`

### 5. Code Style & Conventions

**Naming:**
- `camelCase` for variables and functions
- `PascalCase` for classes (rare in this codebase)
- Descriptive names: `getNumberOfXPath()` not `getCount()`
- Prefix utilities: `add`, `get`, `build`, `parse`, `validate`

**Functions:**
- Use regular functions (not arrows) for hoisting in content scripts
- Add JSDoc comments with `@description`, `@param`, `@returns`
- Keep functions focused (single responsibility)
- Return early for error cases

**Error Handling:**
```javascript
try {
    let result = riskyOperation();
    if (!result) return null; // Early return
} catch (error) {
    // Silent fail for non-critical operations
    // Log only for debugging
}
```

### 6. DOM Manipulation & Security

**CRITICAL SECURITY RULES:**
- ⚠️ NEVER use `innerHTML` with unsanitized data
- ✅ USE `textContent` for plain text insertion
- ✅ USE `createElement()` + `appendChild()` for HTML
- ✅ Sanitize XPath/CSS values before display

**Example - WRONG:**
```javascript
element.innerHTML = `<code>${userXPath}</code>`; // XSS risk!
```

**Example - CORRECT:**
```javascript
element.textContent = userXPath; // Safe
// OR
const code = document.createElement('code');
code.textContent = userXPath;
element.appendChild(code);
```

**Highlighting Elements:**
- Add temporary attribute: `element.setAttribute('letxxpath', 'letX')`
- Remove after inspection: `element.removeAttribute('letxxpath')`
- Use CSS class `.letcss` for visual highlighting
- Clear highlights with `clearHighlighter()`

### 7. Data Structures

**XPath Data Array Format:**
```javascript
XPATHDATA = [
    [priority, "Description", "xpath_value"],
    [1, "Unique ID", "elementId"],
    [2, "Name based XPath", "//input[@name='email']"]
]
```

**CSS Data Array Format:**
```javascript
CSSPATHDATA = [
    [priority, "Description", "css_value"],
    [1, "Unique ID", "#elementId"],
    [3, "Unique Class", ".btn-primary"]
]
```

**Message Format:**
```javascript
{
    request: "message_type",
    data: payload,
    tab: tabId // optional
}
```

### 8. Testing & Validation

**Before Committing:**
1. Test on 5+ different websites
2. Test complex nested structures
3. Test dynamic content (SPAs)
4. Test iframes (limited support noted)
5. Test shadow DOM (currently unsupported)
6. Verify no console errors
7. Check memory leaks (clear arrays after use)

**Validation Functions:**
```javascript
getNumberOfXPath(xpath) // Returns count of matching elements
evaluateXPathExpression(xpath) // Returns XPathResult or null
validateXPath(xpath) // Boolean - exactly 1 match
```

### 9. Performance Optimization

**Rules:**
- Use `child::` over `descendant::` when depth known
- Limit `maxIndex` iterations (default: 3-5)
- Clear data arrays after sending: `XPATHDATA = []`
- Avoid nested loops in XPath evaluation
- Cache `elementOwnerDocument` reference

### 10. Framework Snippet Generation

**Supported Frameworks:**
- Selenium (Java, Python, C#)
- Playwright (JavaScript, Java)
- Protractor (JavaScript)
- Custom (user-defined templates)

**Template Variables:**
- `${lc}` - Locator value
- `${vn}` - Variable name
- `${mn}` - Method name

**Example:**
```javascript
// Playwright JS
await page.locator("${lc}").click();

// Selenium Java
driver.findElement(By.xpath("${lc}")).click();
```

### 11. Extension Manifest Requirements

**Permissions:**
- `contextMenus` - Right-click parent/child selection
- `activeTab` - Access current page DOM
- `storage` - Save user preferences
- `notifications` - Update notifications

**Content Security Policy:**
```json
"script-src 'self'; object-src 'self'"
```

**Content Scripts:**
- Must load at `document_start`
- `all_frames: false` (iframe support limited)
- Load order matters: utils → content → specific features

### 12. Common Patterns & Anti-Patterns

**✅ DO:**
```javascript
// Check element validity
if (!element || element.nodeType !== 1) return null;

// Validate XPath before pushing
let count = getNumberOfXPath(xpath);
if (count === 1) {
    XPATHDATA.push([priority, desc, xpath]);
}

// Clear previous state
let removePrevious = evaluateXPathExpression("//*[@letxxpath='letX']");
if (removePrevious.singleNodeValue) {
    removePrevious.singleNodeValue.removeAttribute('letxxpath');
}
```

**❌ DON'T:**
```javascript
// Don't assume element exists
element.getAttribute('id') // Might throw

// Don't create absolute XPath without validation
`/html/body/div[1]/div[2]...` // Fragile

// Don't store non-serializable data in chrome.storage
chrome.storage.local.set({ domNode: element }); // FAIL
```

### 13. Attribute Filtering

**Always Filter These Attributes:**
- `letxxpath`, `letaxes` (internal markers)
- `script`, `jsname`, `jsmodel`, `jsdata`, `jscontroller` (framework-specific)
- `tabindex`, `autofocus`, `required` (non-unique)
- Empty `title` attributes
- Attributes with excessive numbers (3+ digits)
- Pattern-based dynamic IDs

**Implementation:**
```javascript
function filterAttributesFromElement(item) {
    return (item.name === "letxxpath") || 
           (item.name === 'letaxes') ||
           (item.name.includes('pattern')) ||
           (item.value === '') ||
           /\d{3,}/.test(item.value);
}
```

### 14. Special Element Handling

**SVG Elements:**
```javascript
if (element.tagName === 'SVG' || element.farthestViewportElement) {
    element = element.farthestViewportElement.parentNode;
}
```

**Tables:**
```javascript
if (element.closest('table')) {
    handleTable(element); // Extract table structure
}
```

**Links (Anchor Tags):**
```javascript
if (tagName === 'a') {
    // Try link text first
    xpath = `//a[text()='${element.textContent}']`;
    // Fallback to partial link text
    xpath = `//a[contains(text(),'${element.textContent}')]`;
}
```

**Input Elements:**
```javascript
if (tagName === 'input' || tagName === 'textarea') {
    findLabel(element, tagName); // Look for associated label
}
```

### 15. Version Control Commit Prefixes

Use emojis for commit clarity:
- `📦 NEW:` - New feature
- `👌 IMPROVE:` - Improvement to existing feature
- `🐛 FIX:` - Bug fix
- `🐧 UI:` - UI improvements/bugs
- `🤖 TEST:` - Testing
- `📖 DOC:` - Documentation
- `🚀 RELEASE:` - Release version

### 16. Future Considerations

**Known Limitations:**
- Shadow DOM not yet supported (throws error)
- Limited iframe support
- Complex XPath functions may not convert to CSS
- Axes-based selectors require manual parent-child selection

**Enhancement Areas:**
- Shadow DOM penetration
- Better iframe handling
- AI-powered selector optimization
- Real-time selector validation
- Selector stability scoring

## Development Checklist

- [ ] Function has JSDoc comment
- [ ] Error handling implemented
- [ ] XPath validated with `getNumberOfXPath()`
- [ ] Attributes filtered with `filterAttributesFromElement()`
- [ ] Arrays cleared after use
- [ ] No `innerHTML` with user data
- [ ] Tested on 5+ websites
- [ ] No console errors
- [ ] Commit message has emoji prefix
- [ ] Code follows camelCase convention

## Key Files Reference

- **app/src/content.js** - Core XPath generation engine
- **app/src/parentElements.js** - Parent traversal logic
- **app/src/anchorXPath.js** - Axes-based XPath generation
- **app/src/conversion.js** - XPath to CSS conversion
- **app/src/utils.js** - Validation and utility functions
- **app/devtools/devtools.js** - DevTools integration
- **service_worker.js** - Background tasks & context menu
- **panel/panel.js** - UI rendering and interaction
- **panelconfig.js** - Snippet generation for frameworks

---

**Remember:** LetXPath is not just an XPath finder - it's an educational tool that shows users HOW to build such extensions. Code should be clear, well-commented, and exemplary.
