# LetXPath Development Constitution

## Project Overview
LetXPath is a Chrome DevTools extension for generating XPath and CSS selectors with intelligent pattern recognition and code snippet generation for test automation frameworks.

**Core Features:**
- Multiple XPath/CSS selector generation strategies with priority ranking
- Axes-based XPath for parent-child relationships
- Framework-specific code snippets (Selenium, Playwright, Protractor)
- Custom search and XPath-to-CSS conversion
- Table structure extraction
- Element highlighting and validation

## Core Architecture Principles

### 1. Chrome Extension Communication Model
```
DevTools Sidebar (devtools.js)
    ↓ chrome.devtools.inspectedWindow.eval("parseDOM($0)") - Standard selection
    ↓ OR chrome.devtools.inspectedWindow.eval("handleDevToolsAxesSelection($0, mode)") - Axes selection
Content Script (content.js) - DOM Access & XPath Generation
    ↓ chrome.runtime.sendMessage({ request: "send_to_dev", data: ... }) - Standard XPath
    ↓ OR chrome.runtime.sendMessage({ request: "anchor", data: ... }) - Axes XPath
Panel UI (panel.js) - Receives via chrome.runtime.onMessage
    ↓ User interactions trigger chrome.tabs.sendMessage()
Service Worker (service_worker.js) - Context Menu & Background Tasks
    ↓ chrome.tabs.sendMessage() to content scripts (webpage context menu)
Content Script (content.js) - Processes requests
```

**Rules:**
- DevTools context CANNOT directly access DOM - always use `.eval()` with `useContentScriptContext: true`
- Content scripts have DOM access via `elementOwnerDocument` variable
- Service workers handle webpage context menu clicks and route messages
- **NEW:** Axes tab buttons in panel trigger `handleDevToolsAxesSelection()` via `chrome.devtools.inspectedWindow.eval()`
- Panel UI uses `panelconfig.js` (jQuery-based) for event handling and snippet generation
- All cross-context communication MUST be serializable (no functions, DOM nodes)
- Message format includes `request` field (string) and optional `data` field

### 2. XPath Generation Strategy

**Priority Order (from most to least reliable):**
1. Unique ID - Only the ID value is stored, not full XPath (e.g., `"elementId"` not `//*[@id='elementId']`)
2. Name-based XPath with validation and indexing
3. Class-based XPath (handles multi-class elements)
4. Other unique attributes (placeholder, title, custom attributes)
5. Text-based XPath with normalization (`normalize-space()`)
6. Label-based XPath (`//label[text()='...']/following::input`)
7. Following-sibling relationships
8. Parent-based XPath (traverses up to find unique parent)
9. Position-based as fallback (`//parent/descendant::tag[1]`)

**Note:** Lower priority numbers (0-10) are more reliable; higher numbers (90+) are fallback strategies.

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
- `following::` - all nodes after current element in document order
- `preceding::` - all nodes before current element in document order
- `following-sibling::` - siblings after current (used in XPath generation)
- `preceding-sibling::` - siblings before current (used in XPath generation)

**Anchor XPath Pattern:**
```javascript
// Select parent element via context menu (DevTools or webpage)
// Then select child element
// Generate: //parentLocator/following::childLocator
// Or: //parentLocator/preceding::childLocator
```

**Implementation:**
- Store first selection in `dupArray[0]`
- Store second selection in `dupArray[1]`
- Generate combinations using `getAnchorXPath()`
- System auto-detects whether to use `following::` or `preceding::` (not `following-sibling::`/`preceding-sibling::`)
- **Two selection methods:**
  1. **Sidebar buttons** (recommended): Click "Select Parent ($0)" and "Select Child ($0)" buttons in Axes tab, uses `$0`
  2. **Webpage context menu** (legacy): Right-click on page, uses `event.target`
- Both methods share the same `dupArray` state in content script
- Sidebar buttons call `handleDevToolsAxesSelection()` via `chrome.devtools.inspectedWindow.eval()` which invokes `buildXpath(element, 1, false)`

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
- Prefix utilities: `add`, `get`, `build`, `parse`, `validate`, `handle`
- Some inconsistencies exist (e.g., `xPathToCss` uses different casing)
- Global variables in UPPERCASE (e.g., `XPATHDATA`, `CSSPATHDATA`)
- Temporary/test variables often named `temp`, `tem`, `t`

**Functions:**
- Use regular functions (not arrows) for hoisting in content scripts
- Arrow functions ARE used in some places (e.g., `checkforInt`, event handlers)
- JSDoc comments exist but are inconsistent - many functions lack them
- Keep functions focused (single responsibility)
- Return early for error cases
- Some functions are quite long (e.g., `buildXpath`, `addAllXpathAttributesBbased`)

**Error Handling:**
```javascript
try {
    let result = riskyOperation();
    if (!result) return null; // Early return
} catch (error) {
    // Silent fail for non-critical operations
    // Most catch blocks are empty: catch (error) { }
    // Exceptions are rarely logged (only in devtools.js)
}
```

**Note:** The codebase uses extensive try-catch blocks but most are empty, silently swallowing errors. This is intentional for non-critical XPath generation failures.

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

**⚠️ KNOWN SECURITY ISSUE:** The current codebase in `panel.js` violates this rule with direct `innerHTML` usage. This is a security vulnerability that should be fixed.

**Highlighting Elements:**
- Add temporary attribute: `element.setAttribute('letxxpath', 'letX')` (note: sometimes `letxpath` without double 'x' is used in table handling)
- Remove after inspection: `element.removeAttribute('letxxpath')`
- Use attribute `letcss='1'` for visual highlighting (not a CSS class)
- Clear highlights with `clearHighlighter()` which removes the `letcss` attribute

### 7. Data Structures

**XPath Data Array Format:**
```javascript
XPATHDATA = [
    [priority, "Description", "xpath_value"],
    [1, "Unique ID", "elementId"],  // Just the ID value, not full XPath
    [2, "Name based XPath", "//input[@name='email']"],
    [102, "Unique Name", "nameValue"]  // Just the name value for priority 102
]
```

**Priority Numbers:**
- `0` - Link text
- `1` - Unique ID (value only)
- `2` - Name-based XPath
- `3` - Class-based XPath or Unique Class Attribute
- `4` - Other attributes
- `6` - Text-based XPath
- `8` - Following-sibling XPath
- `9` - Parent-based XPath
- `10` - Unique TagName
- `90` - Closest ID XPath (position-based fallback)
- `102` - Unique Name (value only)

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
    request: "message_type",  // Required: action identifier
    data: payload,             // Optional: depends on request type
    tab: tabId                 // Optional: used when routing from panel to content script
}
```

**Common Request Types:**
- `"send_to_dev"` - Content script sends XPath data to panel
- `"anchor"` - Send axes-based XPath data
- `"context_menu_click"` - Service worker notifies content script of webpage context menu click
- `"parseAxes"` - Evaluate custom axes XPath combination
- `"userSearchXP"` - Custom search from panel
- `"dotheconversion"` - Convert XPath to CSS
- `"cleanhighlight"` - Remove highlight attributes from elements
- `"customSearchResult"` - Return search results to panel
- `"conversion"` - Return CSS conversion result
- **NEW:** `"show_notification"` - Display notification toast in panel (from DevTools context)

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
```

### 9. Performance Optimization

**Rules:**
- Use `child::` over `descendant::` when depth known
- Limit `maxIndex` iterations (default: 3 for most cases, 20 for anchor XPath)
- Clear data arrays after sending: `XPATHDATA = []`, `atrributesArray = []`, `webTableDetails = null`
- Avoid nested loops in XPath evaluation
- Cache `elementOwnerDocument` reference (set per element: `elementOwnerDocument = element.ownerDocument`)
- Use `XPathResult.ANY_TYPE` for iteration, `XPathResult.ORDERED_NODE_SNAPSHOT_TYPE` for counting

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
- Load order in manifest.json:
  1. `content.js` (core engine)
  2. `conversion.js` (XPath to CSS)
  3. `anchorXPath.js` (axes-based XPath)
  4. `getCSS.js` (CSS generation)
  5. `getLabel.js` (label-based XPath)
  6. `methodName.js` (variable/method name generation)
  7. `record.js` (recording functionality)
  8. `search.js` (custom search)
  9. `textXPath.js` (text-based XPath)
  10. `utils.js` (validation utilities)
  11. `parentElements.js` (parent traversal)
  12. `handleTable.js` (table handling)

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
- `tabindex`, `autofocus`, `required`, `required-field` (non-unique)
- Empty `title` attributes or `type='text'` (too generic)
- Attributes starting with `on` (event handlers like `onclick`)
- Attributes starting with `data-ember` (framework-specific)
- Framework attributes: `ng-click`, `ng-model`, `ng-blur`, etc.
- Size-related: `height`, `width`, `size`, `border`, `maxlength`
- Navigation: `href`, `src`, `target`, `rel`
- Autocomplete-related: `autocomplete`, `autocapitalize`, `autocorrect`, `aria-autocomplete`
- Style-related: `style`, `face`
- Internal test attributes: `xpath`, `xpathtest`, `css`
- Attributes containing `length`, `pattern`, `ac_columns`, `ac_order_by`

**Implementation in `utils.js`:**
```javascript
function filterAttributesFromElement(item) {
    return (item.name === "letaxes") || (item.name === 'letxxpath') || 
           (item.name === "script") || (item.name === 'jsname') || 
           (item.name === 'jsmodel') || (item.name === 'jsdata') ||
           (item.name === 'jscontroller') || (item.name === 'face') || 
           (item.name.includes('pattern')) || (item.name.includes('length')) || 
           (item.name === 'border') || (item.name === 'formnovalidate') ||
           (item.name === 'required-field') || (item.name === 'ng-click') || 
           (item.name === 'tabindex') || (item.name === 'required') || 
           (item.name === 'strtindx') || ((item.name === 'title') && (item.value === '')) || 
           (item.name === 'autofocus') || (item.name === 'tabindex') || 
           ((item.name === 'type') && (item.value === 'text')) ||
           (item.name === 'ac_columns') || (item.name === 'ac_order_by') || 
           (item.name.startsWith('data-ember')) || (item.name === 'href') || 
           (item.name === 'aria-autocomplete') || (item.name === 'autocapitalize') || 
           (item.name === 'jsaction') || (item.name === 'autocorrect') ||
           (item.name === 'aria-haspopup') || (item.name === 'style') || 
           (item.name === 'size') || (item.name === 'height') || 
           (item.name === 'width') || (item.name.startsWith('on')) ||
           (item.name === 'autocomplete') || 
           (item.name === 'value' && item.value.length <= 2) ||
           (item.name === 'ng-model-options') || (item.name === 'ng-model-update-on-enter') || 
           (item.name === 'magellan-navigation-filter') || (item.name === 'ng-blur') || 
           (item.name === 'ng-focus') || (item.name === 'ng-trim') ||
           (item.name === 'spellcheck') || (item.name === 'target') || 
           (item.name === 'rel') || (item.name === 'maxlength') || 
           (item.name === 'routerlinkactive') || (item.name === 'src') ||
           (item.name === 'xpath') || (item.name === 'xpathtest') || (item.name === 'css');
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
    tag = "select";  // Tag is changed to 'select' for table elements
    handleTable(element); // Extract table structure
}
```

**Note:** Table handling uses `letxpath='letxpathtable'` (not `letxxpath`) as a marker attribute.

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
- Shadow DOM not yet supported (throws TypeError: "shadow dom not yet supported")
- Limited iframe support (can detect frames but cross-origin restrictions apply)
- Complex XPath functions may not convert to CSS (text(), axes, functions)
- Axes-based selectors require manual two-step parent-child selection via context menu
- Recording feature exists but may have limited functionality
- XPath with more than `maxIndex` matches (default 3-5) may be skipped
- Panel UI uses jQuery which adds dependency weight

**Enhancement Areas:**
- Shadow DOM penetration (major feature gap)
- Better iframe handling with cross-origin workarounds
- AI-powered selector optimization
- Real-time selector validation as user types
- Selector stability scoring (predict which selectors will break)
- Fix innerHTML security vulnerability in panel.js
- Migrate away from jQuery dependency
- Add TypeScript for better type safety
- Comprehensive test suite

## Development Checklist

- [ ] Function has JSDoc comment (aspirational - not consistently done)
- [ ] Error handling implemented (use empty catch blocks for non-critical failures)
- [ ] XPath validated with `getNumberOfXPath()`
- [ ] Attributes filtered with `filterAttributesFromElement()`
- [ ] Arrays cleared after use (`XPATHDATA = []`, `atrributesArray = []`)
- [ ] No `innerHTML` with user data (⚠️ currently violated in `panel.js`)
- [ ] Tested on 5+ websites
- [ ] No console errors (some console.log/console.info exist for debugging)
- [ ] Commit message has emoji prefix
- [ ] Code follows camelCase convention
- [ ] Global variables properly initialized at top of content.js
- [ ] `elementOwnerDocument` used instead of `document` for cross-frame compatibility

## Key Files Reference

- **app/src/content.js** - Core XPath generation engine with `buildXpath()` and message routing
- **app/src/utils.js** - Validation functions: `getNumberOfXPath()`, `evaluateXPathExpression()`, `filterAttributesFromElement()`, `addIndexToXpath()`, highlighter functions
- **app/src/anchorXPath.js** - Axes-based XPath generation with `getAnchorXPath()`
- **app/src/parentElements.js** - Parent traversal logic with `getParent()`, `addPreviousSibling()`
- **app/src/conversion.js** - XPath to CSS conversion with `xPathToCss()`
- **app/src/getCSS.js** - CSS selector generation with `getLongCssPath()`, `getClassCSS()`, `getXPathWithPosition()`
- **app/src/textXPath.js** - Text-based XPath with `getTextBasedXPath()`
- **app/src/getLabel.js** - Label-based XPath finding with `findLabel()`
- **app/src/methodName.js** - Variable/method name generation with `getMethodOrVarText()`, `getVariableAndMethodName()`
- **app/src/handleTable.js** - Table structure extraction
- **app/src/record.js** - Recording functionality (stores to `chrome.storage.local`)
- **app/src/search.js** - Custom search snippet generation
- **app/devtools/devtools.js** - DevTools sidebar panel creation and `parseDOM($0)` invocation
- **service_worker.js** - Background tasks, context menu creation/toggle, message routing
- **panel/panel.js** - UI rendering with jQuery, data display (⚠️ uses innerHTML)
- **panelconfig.js** - Event handlers, snippet generation for frameworks, clipboard operations
- **option/option.js** - Settings page for framework selection

---

## Quick Reference: Global Variables in content.js

```javascript
let targetElemt = null;              // Currently selected DOM element
let enablegcx = false;               // Enable get clicked xpath (unused)
let isRecordEnabled = false;         // Recording mode flag
let maxIndex = 3;                    // Max iterations for indexed XPath
let tempMaxIndex = 3;                // Temp storage for maxIndex
let maxId = 3;                       // Max digits in ID before filtering
let setPreOrFol = null;              // "following::" or "preceding::" for axes
let variableName = null;             // Generated variable name
let methodName = null;               // Generated method name
let dupArray = [];                   // Stores parent/child selections for axes
let XPATHDATA;                       // Main array of XPath results
let CSSPATHDATA = null;              // Array of CSS selector results
let atrributesArray = [];            // Collected attribute names
let webTableDetails = null;          // Table structure info
let elementOwnerDocument;            // Document context for element
let frameXPATH = null;               // Frame locator if in iframe
```

---

**Remember:** LetXPath is not just an XPath finder - it's an educational tool that shows users HOW to build such extensions. Code should be clear, well-commented, and exemplary.

**Mission Statement:** This extension demonstrates best practices in Chrome extension development while solving a real problem for test automation engineers. Every feature should be implemented in a way that teaches developers about DOM manipulation, XPath evaluation, and cross-context communication in browser extensions.
