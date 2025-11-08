# Spec-001: DevTools Context Menu Integration for Axes-Based XPath

## Status
**Ready for Implementation** | Version 1.1 | Created: November 8, 2025 | Reviewed: November 8, 2025

### Revision History
- **v1.0** - Initial draft
- **v1.1** - Corrected cross-context state management issues, removed infeasible Task 3.2, updated keyboard shortcut limitations, adjusted timeline estimates

## Overview
Add the ability to trigger "Select Parent" and "Select Child" operations directly from within Chrome DevTools Elements panel context menu, eliminating the need to right-click on the actual webpage. This enhancement improves the user experience for generating axes-based XPath selectors.

## Problem Statement

### Current Behavior
Users must currently:
1. Right-click on an element in the **webpage itself** → Select "Select Parent" from context menu
2. Right-click on another element in the **webpage** → Select "Select Child" from context menu
3. View generated axes-based XPath in the LetXPath DevTools sidebar

### Pain Points
- Switching context between DevTools and webpage is cumbersome
- Context menu appears on the webpage, cluttering the UI
- Workflow doesn't match natural DevTools interaction patterns
- Users already selecting elements in DevTools Elements panel via `$0`

### Desired Behavior
Users should be able to:
1. Right-click on an element in the **DevTools Elements panel** → Select "LetXPath: Select Parent"
2. Right-click on another element in the **DevTools Elements panel** → Select "LetXPath: Select Child"
3. View generated axes-based XPath in the LetXPath DevTools sidebar
4. (Optional) Maintain existing webpage context menu as fallback

## Technical Analysis

### Current Architecture

#### Existing Context Menu (Webpage)
- **Location**: `service_worker.js`
- **Registration**: `chrome.contextMenus.create()` with `contexts: ["all"]`
- **Toggle Mechanism**: `toggle()` function switches title between "Select Parent" and "Select Child"
- **Message Flow**:
  ```
  Context Menu Click → service_worker.js
      ↓ chrome.tabs.sendMessage({ request: "context_menu_click" })
  content.js → receiver() → case "context_menu_click"
      ↓ parseAnchorXP(targetElemt)
  buildXpath(element, 1, false) → stores in dupArray
      ↓ getAnchorXPath()
  Generates axes-based XPath → sends to panel.js
  ```

#### DevTools Integration
- **Location**: `app/devtools/devtools.js`
- **Element Selection**: Uses `$0` (currently selected element in Elements panel)
- **Evaluation**: `chrome.devtools.inspectedWindow.eval("parseDOM($0)")`
- **Current Limitation**: No DevTools-specific context menu exists

### Chrome Extension APIs Required

#### 1. DevTools Context Menu API
```javascript
chrome.devtools.panels.elements.createContextMenuItem(
  title: string,
  callback: function
)
```

**Capabilities:**
- Adds menu item to Elements panel context menu
- Only available in `devtools.js` context (not service worker)
- Callback receives no information about clicked element (must use `$0`)

**Limitations:**
- Cannot dynamically change menu item title (no update method)
- Cannot create nested menus or separators
- Must track state separately to know if parent/child mode

#### 2. Message Passing
```javascript
// From devtools.js to content script
chrome.devtools.inspectedWindow.eval(
  "functionName($0)",
  { useContentScriptContext: true }
)

// From content script to panel
chrome.runtime.sendMessage({ request: "anchor", data: {...} })
```

### Architecture Comparison

| Aspect | Current (Webpage Menu) | New (DevTools Menu) |
|--------|------------------------|---------------------|
| Menu Creation | `service_worker.js` | `devtools.js` |
| Element Reference | `targetElemt` from mousedown | `$0` from DevTools |
| Title Toggle | Dynamic via `chrome.contextMenus.update()` | Static (need workaround) |
| Message Flow | service_worker → content_script | devtools → content_script (via eval) |
| User Context | Must right-click on page | Right-click in DevTools |

## Proposed Solution

### Approach 1: Pure DevTools Context Menu (Recommended)

#### Architecture
```
DevTools Elements Panel Context Menu
    ↓ User right-clicks element
chrome.devtools.panels.elements.createContextMenuItem()
    ↓ Callback triggered
devtools.js → chrome.devtools.inspectedWindow.eval("handleDevToolsAxesSelection($0)")
    ↓ Executes in content script context
content.js → handleDevToolsAxesSelection(element)
    ↓ Determines if parent or child based on dupArray.length
    ↓ buildXpath(element, 1, false)
    ↓ getAnchorXPath()
Generates axes-based XPath → chrome.runtime.sendMessage()
    ↓ 
panel.js → Displays result in Axes tab
```

#### Implementation Strategy
1. Create **two separate** context menu items (cannot toggle dynamically)
2. Use global state to track which mode is active
3. Disable/enable menu items based on state
4. Leverage existing `dupArray` logic for parent/child tracking

### Approach 2: Hybrid (DevTools + Webpage)

Keep both context menus:
- DevTools menu for users who prefer Elements panel workflow
- Webpage menu for users who prefer page interaction

## Detailed Implementation Plan

### Phase 1: Core DevTools Context Menu Integration

#### Task 1.1: Create DevTools Context Menu Items
**File**: `app/devtools/devtools.js`

```javascript
// Add after sidebar creation
let axesSelectionMode = 'parent'; // 'parent' or 'child'

// Create parent selection menu item
chrome.devtools.panels.elements.createContextMenuItem(
  "LetXPath: Select Parent",
  function() {
    if (axesSelectionMode === 'parent') {
      selectAxesParent();
    }
  }
);

// Create child selection menu item
chrome.devtools.panels.elements.createContextMenuItem(
  "LetXPath: Select Child",
  function() {
    if (axesSelectionMode === 'child') {
      selectAxesChild();
    }
  }
);
```

**Acceptance Criteria:**
- [ ] Two menu items appear in Elements panel context menu
- [ ] Menu items are prefixed with "LetXPath:" for clarity
- [ ] Menu items appear below existing DevTools options

**Estimated Effort**: 2 hours

---

#### Task 1.2: Implement Selection Handler Functions
**File**: `app/devtools/devtools.js`

```javascript
function selectAxesParent() {
  axesSelectionMode = 'child'; // Next selection will be child
  
  chrome.devtools.inspectedWindow.eval(
    "handleDevToolsAxesSelection($0, 'parent')",
    { useContentScriptContext: true },
    (result, exceptionInfo) => {
      if (exceptionInfo) {
        console.error("Parent selection failed:", exceptionInfo.description);
      } else {
        console.info("Parent element selected for axes XPath");
        // TODO: Provide visual feedback to user
      }
    }
  );
}

function selectAxesChild() {
  axesSelectionMode = 'parent'; // Reset for next iteration
  
  chrome.devtools.inspectedWindow.eval(
    "handleDevToolsAxesSelection($0, 'child')",
    { useContentScriptContext: true },
    (result, exceptionInfo) => {
      if (exceptionInfo) {
        console.error("Child selection failed:", exceptionInfo.description);
      } else {
        console.info("Child element selected, generating axes XPath");
        // Automatically switch to Axes tab
        // TODO: Implement tab switching
      }
    }
  );
}
```

**Acceptance Criteria:**
- [ ] `selectAxesParent()` marks element as parent in `dupArray`
- [ ] `selectAxesChild()` triggers XPath generation
- [ ] Mode toggles between parent/child after each selection
- [ ] Errors are logged to console

**Estimated Effort**: 3 hours

---

#### Task 1.3: Create Content Script Handler
**File**: `app/src/content.js`

```javascript
/**
 * Handles axes-based XPath selection from DevTools context menu
 * @param {HTMLElement} element - The element selected via $0
 * @param {string} mode - Either 'parent' or 'child'
 */
function handleDevToolsAxesSelection(element, mode) {
  if (!element || element.nodeType !== 1) {
    console.error("Invalid element provided to handleDevToolsAxesSelection");
    return { success: false, error: "Invalid element" };
  }
  
  try {
    // Set maxIndex higher for axes XPath
    maxIndex = 20;
    
    // Build XPath with axes flag (second parameter = 1)
    buildXpath(element, 1, false);
    
    console.log(`DevTools ${mode} selection completed. dupArray length: ${dupArray.length}`);
    
    return { 
      success: true, 
      mode: mode,
      dupArrayLength: dupArray.length 
    };
  } catch (error) {
    console.error("Error in handleDevToolsAxesSelection:", error);
    return { success: false, error: error.message };
  }
}

// Expose to global scope for DevTools eval
window.handleDevToolsAxesSelection = handleDevToolsAxesSelection;
```

**Acceptance Criteria:**
- [ ] Function is globally accessible for DevTools eval
- [ ] Validates element before processing
- [ ] Reuses existing `buildXpath()` logic with axes mode (second param = 1)
- [ ] Returns success/error status for DevTools feedback
- [ ] Logs progress for debugging

**Estimated Effort**: 2 hours

---

#### Task 1.4: Update Message Handling
**File**: `panel/panel.js`

No changes required - existing `chrome.runtime.onMessage.addListener` already handles:
```javascript
case "anchor":
  handleAnchor(req);
  break;
```

**Acceptance Criteria:**
- [ ] Verify existing handler works with DevTools-triggered selections
- [ ] Axes tab automatically activates when XPath is generated

**Estimated Effort**: 1 hour (testing only)

---

### Phase 2: User Experience Enhancements

#### Task 2.1: Visual Feedback for Parent Selection
**Files**: `app/devtools/devtools.js`, `panel/panel.js`

**Implementation Strategy**: Send messages from devtools.js to panel.js for UI updates

```javascript
// In devtools.js
function showNotification(message, type = 'info') {
  // Send notification to panel for display
  chrome.runtime.sendMessage({
    request: 'show_notification',
    data: { message, type }
  });
  // Also log to console for debugging
  console.info(`[LetXPath] ${message}`);
}

// In panel/panel.js (add to existing message listener)
chrome.runtime.onMessage.addListener((req, rec, res) => {
  // ... existing cases ...
  if (req.request === 'show_notification') {
    const toast = document.querySelector('.toast');
    toast.textContent = req.data.message;
    toast.classList.remove('d-hide');
    toast.classList.add('toast-' + req.data.type);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      toast.classList.add('d-hide');
    }, 3000);
  }
});
```

**Acceptance Criteria:**
- [ ] User sees confirmation after selecting parent
- [ ] Clear indication that child selection is next step
- [ ] Notification is non-intrusive
- [ ] Uses existing toast UI component in panel

**Estimated Effort**: 3 hours (reduced - reuses existing UI)

---

#### Task 2.2: Conditional Menu Item Display
**File**: `app/devtools/devtools.js`

**Challenge**: `createContextMenuItem` doesn't support dynamic enable/disable.

**Workaround Options**:
1. Always show both menu items, handle logic internally
2. Show single "LetXPath: Select for Axes" item with smart detection
3. Add visual indicator in menu text (e.g., "Select Parent ✓" after selection)

**Recommended**: Option 1 (simplest, most explicit)

**⚠️ CRITICAL ISSUE**: `dupArray` and `tagArrHolder` are global variables in `content.js`, NOT accessible from `devtools.js` context!

**Corrected Implementation**:
```javascript
// Keep both menu items always visible
// Handle state validation via eval in content script

function selectAxesParent() {
  chrome.devtools.inspectedWindow.eval(
    "(function() { " +
    "  if (typeof dupArray !== 'undefined' && dupArray.length > 0) { " +
    "    return { needsReset: true, currentLength: dupArray.length }; " +
    "  } " +
    "  return { needsReset: false }; " +
    "})()",
    { useContentScriptContext: true },
    (result, exceptionInfo) => {
      if (result && result.needsReset) {
        if (confirm(`Reset current axes selection (${result.currentLength} element(s)) and start over?`)) {
          // Reset via eval
          chrome.devtools.inspectedWindow.eval(
            "dupArray.length = 0; tagArrHolder.length = 0;",
            { useContentScriptContext: true }
          );
        } else {
          return;
        }
      }
      // Continue with parent selection
      selectAxesParent(); // Original function from Task 1.2
    }
  );
}

function selectAxesChild() {
  // Check state before proceeding
  chrome.devtools.inspectedWindow.eval(
    "(function() { " +
    "  if (typeof dupArray === 'undefined' || dupArray.length === 0) { " +
    "    return { error: 'Please select a parent element first' }; " +
    "  } " +
    "  if (dupArray.length >= 2) { " +
    "    return { error: 'Already complete. Reset to start over.' }; " +
    "  } " +
    "  return { ok: true }; " +
    "})()",
    { useContentScriptContext: true },
    (result, exceptionInfo) => {
      if (result && result.error) {
        showNotification(result.error, "warning");
        return;
      }
      // Continue with child selection
      selectAxesChild(); // Original function from Task 1.2
    }
  );
}
```

**Acceptance Criteria:**
- [ ] Selecting child before parent shows helpful error
- [ ] User can reset and start over
- [ ] Clear feedback at each step
- [ ] State checks work across DevTools/content script boundary

**Estimated Effort**: 4 hours (increased due to cross-context complexity)

---

#### Task 2.3: Automatic Tab Switching
**File**: `panel/panel.js`

```javascript
// Update handleAnchor to auto-activate Axes tab
function handleAnchor(req) {
  resetBadge("xpbadge", "0");
  clearElementContent("#addXPath");
  resetBadge("cssbadge", "0");
  clearElementContent("#cssbody");
  displayEmptyMessage("#addXPath");
  displayEmptyMessage("#cssbody");
  generateAxes(req);
  
  // NEW: Auto-activate Axes tab
  activatePanel(3); // 3 = Axes tab
}
```

**Acceptance Criteria:**
- [ ] Axes tab automatically displays after child selection
- [ ] User doesn't need to manually switch tabs

**Estimated Effort**: 1 hour

---

### Phase 3: Polish and Testing

#### Task 3.1: Error Handling
**Files**: Multiple

**Scenarios to Handle**:
1. Selecting same element twice
2. Selecting parent after child
3. Shadow DOM elements (currently throws error)
4. Elements in iframes
5. Invalid element references

```javascript
// Enhanced error handling in content.js
function handleDevToolsAxesSelection(element, mode) {
  // Check for shadow DOM
  if (element.shadowRoot != null) {
    return { 
      success: false, 
      error: "Shadow DOM elements are not yet supported for axes XPath" 
    };
  }
  
  // Check for same element selection
  if (dupArray.length > 0) {
    let lastElement = evaluateXPathExpression("//*[@letxxpath='letX']");
    if (lastElement.singleNodeValue === element) {
      return {
        success: false,
        error: "Cannot select the same element twice. Please select a different element."
      };
    }
  }
  
  // Check element order (child must come after parent in DOM)
  if (mode === 'child' && dupArray.length === 1) {
    let parentElement = evaluateXPathExpression("//*[@letxxpath='letX']");
    if (!isDescendantOrFollowing(parentElement.singleNodeValue, element)) {
      return {
        success: false,
        error: "Selected child element must come after the parent in the document. Consider using 'preceding::' axis instead."
      };
    }
  }
  
  // ... existing code ...
}

function isDescendantOrFollowing(parent, child) {
  // Check if child is descendant of parent
  if (parent.contains(child)) {
    return true;
  }
  
  // Check if child follows parent in document order
  return (parent.compareDocumentPosition(child) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
}
```

**Acceptance Criteria:**
- [ ] All error cases show user-friendly messages
- [ ] No silent failures
- [ ] Errors logged to console for debugging

**Estimated Effort**: 4 hours

---

#### Task 3.2: State Persistence ⚠️ REMOVED - NOT FEASIBLE

**Decision**: Remove this task from scope.

**Reason**: 
- `dupArray` lives in content script context and stores actual XPath data structures
- DevTools context has no direct access to content script globals
- Persisting complex XPath data structures to storage would require deep serialization
- When DevTools closes, the content script continues running and maintains state naturally
- When page reloads, state SHOULD be cleared (old elements become invalid)

**Alternative Approach**:
- State naturally persists while DevTools is closed (content script keeps running)
- State naturally clears on page reload (appropriate behavior)
- No additional implementation needed

**Revised Acceptance Criteria:**
- [ ] ~~Selection state persists across DevTools close/reopen~~ (Not needed - content script maintains state)
- [ ] State clears on page navigation (existing behavior)
- [ ] Document that parent selection must be redone after page reload

**Estimated Effort**: 0 hours (removed from scope)

---

#### Task 3.3: Documentation Updates

**Files to Update**:
1. `README.md` - Add DevTools context menu usage instructions
2. `install.html` - Update onboarding with new feature
3. `/.agent/constitution.md` - Update architecture section

**New Content for README**:
```markdown
### Using Axes-Based XPath (Parent-Child Relationships)

#### Method 1: DevTools Context Menu (Recommended)
1. Open Chrome DevTools and navigate to the Elements panel
2. Right-click on the parent element → Select "LetXPath: Select Parent"
3. Right-click on the child element → Select "LetXPath: Select Child"
4. View generated axes-based XPath in the LetXPath sidebar under the "Axes" tab

#### Method 2: Webpage Context Menu (Legacy)
1. Right-click directly on an element in the webpage → Select "Select Parent"
2. Right-click on another element → Select "Select Child"
3. View results in LetXPath sidebar

**Note**: The DevTools method is preferred as it integrates seamlessly with your existing workflow.
```

**Acceptance Criteria:**
- [ ] README has clear usage instructions with screenshots
- [ ] Constitution updated with new architecture
- [ ] Install page mentions new feature

**Estimated Effort**: 3 hours

---

#### Task 3.4: Comprehensive Testing

**Test Plan**:

| Test Case | Description | Expected Result | Priority |
|-----------|-------------|-----------------|----------|
| TC-1 | Select parent then child | Generates valid axes XPath | P0 |
| TC-2 | Select child before parent | Shows error message | P0 |
| TC-3 | Select same element twice | Shows error message | P1 |
| TC-4 | Select sibling elements | Uses following-sibling:: axis | P1 |
| TC-5 | Select nested elements | Uses descendant:: axis | P1 |
| TC-6 | Select elements in different branches | Uses following:: axis | P1 |
| TC-7 | Shadow DOM elements | Shows "not supported" error | P2 |
| TC-8 | Iframe elements | Handles gracefully | P2 |
| TC-9 | Reset mid-selection | Clears state properly | P1 |
| TC-10 | DevTools close/reopen | State persists | P2 |
| TC-11 | Multiple selections | Only keeps last 2 | P1 |
| TC-12 | Tab switching | Automatically shows Axes tab | P1 |

**Test Websites**:
1. https://letcode.in (test automation practice site)
2. https://the-internet.herokuapp.com/
3. Complex SPA: https://react.dev/ (updated URL)
4. Table-heavy: Wikipedia article with tables
5. Shadow DOM: Developer-accessible site with shadow DOM (NOT chrome://settings - DevTools doesn't work on chrome:// URLs)

**Acceptance Criteria:**
- [ ] All P0 tests pass
- [ ] All P1 tests pass
- [ ] P2 tests documented (even if not passing)

**Estimated Effort**: 8 hours

---

### Phase 4: Optional Enhancements

#### Task 4.1: Visual Highlighting in Elements Panel
**Complexity**: High
**Value**: Medium

When parent is selected, highlight it in the Elements panel until child is selected.

**Challenge**: Chrome DevTools API doesn't provide direct element highlighting in Elements panel.

**Workaround**: Add temporary CSS class to element that makes it visually distinct on page.

```javascript
// In content.js
function highlightAxesParent(element) {
  element.classList.add('letxpath-axes-parent-selected');
  element.style.setProperty('outline', '3px solid #4CAF50', 'important');
}

function clearAxesHighlight() {
  let highlighted = document.querySelectorAll('.letxpath-axes-parent-selected');
  highlighted.forEach(el => {
    el.classList.remove('letxpath-axes-parent-selected');
    el.style.removeProperty('outline');
  });
}
```

**Estimated Effort**: 4 hours

---

#### Task 4.2: Keyboard Shortcuts ⚠️ API LIMITATION
**Complexity**: High (not Medium)
**Value**: High

Add keyboard shortcuts for power users:
- `Ctrl+Shift+P` - Select Parent
- `Ctrl+Shift+C` - Select Child  
- `Ctrl+Shift+R` - Reset Selection

**⚠️ CRITICAL LIMITATION**: `chrome.commands` API is NOT available in DevTools context!

**Alternative Approaches**:
1. **Use background script** - Commands trigger in service_worker.js, which sends messages to DevTools
2. **DevTools keyboard handling** - Use `document.addEventListener('keydown')` in panel (only works when panel has focus)
3. **Skip keyboard shortcuts** - Wait for Chrome to add DevTools command support

**Recommended**: Approach 2 (panel-level keyboard handling)

```javascript
// In panel/panel.js (where DOM events work)
document.addEventListener('keydown', (e) => {
  // Only trigger if not typing in input field
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    return;
  }
  
  if (e.ctrlKey && e.shiftKey && e.key === 'P') {
    e.preventDefault();
    // Send message to trigger parent selection
    chrome.runtime.sendMessage({ request: 'keyboard_select_parent' });
  }
  // ... similar for child and reset
});

// In devtools.js, listen for keyboard messages
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.request === 'keyboard_select_parent') {
    selectAxesParent();
  }
  // ... etc
});
```

**Caveat**: Only works when LetXPath panel/sidebar has focus.

**Manifest.json addition**:
```json
{
  "commands": {
    "select-axes-parent": {
      "suggested_key": {
        "default": "Ctrl+Shift+P",
        "mac": "Command+Shift+P"
      },
      "description": "Select parent element for axes XPath"
    },
    "select-axes-child": {
      "suggested_key": {
        "default": "Ctrl+Shift+C",
        "mac": "Command+Shift+C"
      },
      "description": "Select child element for axes XPath"
    },
    "reset-axes-selection": {
      "suggested_key": {
        "default": "Ctrl+Shift+R",
        "mac": "Command+Shift+R"
      },
      "description": "Reset axes XPath selection"
    }
  }
}
```

**Estimated Effort**: 3 hours

---

#### Task 4.3: Keep Webpage Context Menu (Backwards Compatibility)
**Complexity**: Low
**Value**: Medium

Maintain existing webpage context menu for users who prefer it.

**Implementation**: No changes needed - both can coexist.

**Acceptance Criteria:**
- [ ] Both context menus work independently
- [ ] Selecting via webpage menu updates DevTools state
- [ ] Selecting via DevTools menu updates webpage state

**Estimated Effort**: 2 hours (testing/coordination)

---

## Technical Considerations

### 1. Context Menu API Limitations

**Issue**: `chrome.devtools.panels.elements.createContextMenuItem()` cannot:
- Dynamically update title
- Be conditionally shown/hidden
- Provide nested menus
- Show checkmarks or icons

**Impact**: Cannot replicate exact behavior of webpage context menu toggle.

**Mitigation**: Use two separate menu items with clear naming.

---

### 2. Element Reference Differences

| Source | Reference Type | Reliability |
|--------|----------------|-------------|
| Webpage context menu | `event.target` from mousedown | Direct reference |
| DevTools `$0` | Currently selected in Elements panel | May change if user clicks elsewhere |

**Risk**: User might select element in Elements panel, then click elsewhere before triggering context menu.

**Mitigation**: 
- Capture `$0` immediately when menu is clicked
- Validate element still exists before processing

---

### 3. State Management

**Current Implementation**:
- `dupArray` is global in content.js (content script context)
- State is shared between webpage and DevTools contexts naturally (same content script)

**Proposed**:
- Keep shared state for both entry points (both ultimately call `buildXpath` in content.js)
- Add `axesSelectionMode` in devtools.js for UI tracking only
- State access from devtools.js requires `eval()` calls - cannot directly read/write

**Key Insight**: Both webpage context menu and DevTools context menu invoke the SAME content script code, so state naturally syncs.

**Risk**: User confusion if switching methods mid-flow, not actual data corruption.

**Mitigation**: 
- Document the shared state behavior as a feature, not a bug
- Visual feedback shows which step user is on regardless of entry point

---

### 4. Performance Impact

**Concerns**:
- Adding DevTools context menu items might slow down Elements panel
- Eval calls from devtools.js have overhead

**Measurement**:
- Benchmark context menu appearance time
- Profile eval call latency

**Acceptance Criteria**: < 50ms overhead for menu display

---

## Testing Strategy

### Unit Tests
- `handleDevToolsAxesSelection()` with various element types
- State management functions
- Error handling paths

### Integration Tests
- Complete parent → child flow
- Message passing between contexts
- State persistence

### Manual Testing Checklist
```
□ Install extension in Chrome
□ Open DevTools on test page
□ Verify context menu items appear
□ Test parent selection
  □ Verify visual feedback
  □ Check console logs
□ Test child selection
  □ Verify XPath generation
  □ Check Axes tab displays
□ Test error cases
  □ Child before parent
  □ Same element twice
  □ Invalid elements
□ Test state persistence
  □ Close/reopen DevTools
□ Test alongside webpage context menu
□ Test keyboard shortcuts (if implemented)
□ Cross-browser testing (Chromium-based)
```

---

## Open Questions

1. **Q**: Should we deprecate the webpage context menu?
   **A**: No, keep both. Some users may prefer page interaction.

2. **Q**: How do we handle users who switch between methods mid-flow?
   **A**: Shared state allows seamless switching. Add warning if needed.

3. **Q**: Should keyboard shortcuts be default or opt-in?
   **A**: Default, but allow disabling in settings.

4. **Q**: Should we support selecting parent from webpage and child from DevTools (or vice versa)?
   **A**: Yes, use shared `dupArray` state.

---

## Dependencies

### Chrome APIs
- `chrome.devtools.panels.elements.createContextMenuItem()` (Stable since Chrome 18)
- `chrome.devtools.inspectedWindow.eval()` (Stable)
- `chrome.storage.local` (Stable)

### Internal Dependencies
- Existing XPath generation engine (`buildXpath`, `getAnchorXPath`)
- Message passing infrastructure
- Panel UI rendering

### External Dependencies
- None (no new libraries required)

---

## Timeline Estimate

| Phase | Tasks | Effort | Duration |
|-------|-------|--------|----------|
| Phase 1: Core | Tasks 1.1-1.4 | 8 hours | 1 day |
| Phase 2: UX | Tasks 2.1-2.3 | 9 hours | 1 day |
| Phase 3: Testing | Tasks 3.1, 3.3-3.4 | 15 hours | 2 days |
| Phase 4: Optional | Tasks 4.1-4.3 | 11 hours | 1-2 days |
| **Total (Core + Testing)** | | **32 hours** | **4 days** |
| **Total (with Optional)** | | **43 hours** | **5-6 days** |

**Recommended Sprint**: 1 week for MVP (Phases 1-3), +1 week for polish (Phase 4)

**AI Self-Assessment**: 
- **Phase 1**: High confidence - straightforward API usage
- **Phase 2**: Medium confidence - cross-context state management tricky
- **Phase 3**: High confidence - testing and error handling
- **Phase 4**: Medium confidence - workarounds for API limitations

---

## Definition of Done

**MVP (Minimum Viable Product)**:
- [ ] All Phase 1 tasks completed and tested
- [ ] Phase 2 Task 2.1 (notifications) completed
- [ ] Phase 2 Task 2.3 (auto tab switch) completed
- [ ] Phase 3 Task 3.1 (error handling) completed
- [ ] All Phase 3 P0 tests passing
- [ ] No console errors in normal usage
- [ ] Documentation updated (README with usage instructions)
- [ ] Works on Chrome (primary target)

**Full Release**:
- [ ] All MVP criteria met
- [ ] Phase 2 Task 2.2 (conditional display) completed
- [ ] All Phase 3 P1 tests passing
- [ ] Constitution updated with new architecture
- [ ] Works on Chrome, Edge, Brave (Chromium-based browsers)
- [ ] Performance benchmarks met (< 50ms overhead)
- [ ] Release notes written
- [ ] User feedback from at least 3 beta testers

---

## Future Enhancements (Beyond This Spec)

1. **Multi-step axes paths**: Select 3+ elements for complex paths
2. **Visual path preview**: Show relationship between elements with arrows
3. **Axes recommendation engine**: Suggest optimal axis based on element positions
4. **Export axes patterns**: Save common parent-child patterns for reuse
5. **Integration with recording feature**: Auto-detect parent-child relationships during recording

---

## References

- Chrome DevTools Extension API: https://developer.chrome.com/docs/extensions/reference/devtools_panels/
- LetXPath Constitution: `/.agent/constitution.md`
- Existing Implementation: `service_worker.js`, `app/src/anchorXPath.js`

---