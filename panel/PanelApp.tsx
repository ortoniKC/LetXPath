import React, { useState, useEffect } from 'react';

const ACTION_LABELS = {
  textarea: ['snippet', 'getAttribute', 'sendKeys'],
  input: {
    click: ['snippet', 'getAttribute', 'click'],
    send: ['snippet', 'getAttribute', 'sendKeys']
  },
  img: ['snippet', 'getAttribute', 'click'],
  default: ['snippet', 'getAttribute', 'click', 'getText']
};

interface TemplateGroup {
  click: string;
  send: string;
  text: string;
  attr: string;
}

const DEFAULT_TEMPLATES: Record<'jscs' | 'javacs', TemplateGroup> = {
  jscs: {
    click: "private ${vn} = ${lc};\nasync clickOn${mn}(){\n  await this.click(this.${vn})\n}",
    send: "private ${vn} = ${lc};\nasync enter${mn}(value){\n  await this.sendKeys(this.${vn}, value)\n}",
    text: "private ${vn} = ${lc};\nasync get${mn}Text(){\n  return await this.getText(this.${vn})\n}",
    attr: "private ${vn} = ${lc};\nasync get${mn}Attr(attribute){\n  return await this.getAttribute(this.${vn}, attribute)\n}"
  },
  javacs: {
    click: "${lc} private WebElement ${vn};\npublic void clickOn${mn}(){\n  this.click(this.${vn});\n}",
    send: "${lc} private WebElement ${vn};\npublic void enter${mn}(String value){\n  this.type(this.${vn}, value);\n}",
    text: "${lc} private WebElement ${vn};\npublic String get${mn}Text(){\n  return this.getText(this.${vn});\n}",
    attr: "${lc} private WebElement ${vn};\npublic String get${mn}Attr(String attribute){\n  return this.getAttribute(this.${vn}, attribute);\n}"
  }
};

interface WebTableDetails {
  totalTables: number;
  tableLocator: string;
  tableData: string;
}

interface SelectedElement {
  xpathid: [number, string, string][];
  cssPath: [number, string, string][];
  tag: string;
  type: string;
  variablename?: string;
  methodname?: string;
  webtabledetails?: WebTableDetails | null;
}

interface AxesData {
  src: [number, string, string][];
  dst: [number, string, string][];
  proOrFol: string;
  defaultXPath: string;
}

interface ChromeStorageResult {
  langID?: string;
  customLang?: 'jscs' | 'javacs';
  clickvalue?: string;
  sendvalue?: string;
  textvalue?: string;
  attrvalue?: string;
}

interface DevToolsMessageRequest {
  request: string;
  data?: any;
  output?: string;
  xpathid?: [number, string, string][];
  cssPath?: [number, string, string][];
  tag?: string;
  type?: string;
  variablename?: string;
  methodname?: string;
  webtabledetails?: WebTableDetails | null;
}

const PanelApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(1);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  
  // Axes states
  const [axesData, setAxesData] = useState<AxesData | null>(null);
  const [selectedSrc, setSelectedSrc] = useState<string>('');
  const [selectedDst, setSelectedDst] = useState<string>('');
  const [axesXPathResult, setAxesXPathResult] = useState<string>('');

  // Tools states
  const [searchVal, setSearchVal] = useState<string>('');
  const [searchResult, setSearchResult] = useState<{ xpath: string; count: number } | null>(null);
  const [convertVal, setConvertVal] = useState<string>('');
  const [convertResult, setConvertResult] = useState<string | null>(null);

  // Settings & toast
  const [toast, setToast] = useState<string | null>(null);

  const tabId = typeof chrome !== 'undefined' && chrome.devtools && chrome.devtools.inspectedWindow
    ? chrome.devtools.inspectedWindow.tabId
    : null;

  const sendMessageToCS = (msg: any) => {
    if (tabId && typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.sendMessage(tabId, msg).catch(err => console.warn('Message send failed:', err));
    } else {
      console.log('Mock Send to Content Script:', msg);
    }
  };

  useEffect(() => {
    // Message Listener
    const listener = (req: DevToolsMessageRequest, _sender: any, sendResponse: (r: string) => void) => {
      // Hide active toast on new messages
      setToast(null);

      try {
        switch (req.request) {
          case 'send_to_dev':
            if (req.xpathid && req.cssPath && req.tag !== undefined && req.type !== undefined) {
              setSelectedElement({
                xpathid: req.xpathid,
                cssPath: req.cssPath,
                tag: req.tag,
                type: req.type,
                variablename: req.variablename,
                methodname: req.methodname,
                webtabledetails: req.webtabledetails
              });
              // Default activeTab to 1 if we get element updates
              setActiveTab(1);
            }
            break;
          case 'anchor':
            if (req.data) {
              setAxesData(req.data);
              if (req.data.src && req.data.src.length > 0) setSelectedSrc(req.data.src[0][1]);
              if (req.data.dst && req.data.dst.length > 0) setSelectedDst(req.data.dst[0][1]);
              setAxesXPathResult(req.data.defaultXPath);
              setActiveTab(3); // Switch to Axes panel
            }
            break;
          case 'axes':
            if (req.data) setAxesXPathResult(req.data);
            break;
          case 'customSearchResult':
            if (req.data) setSearchResult(req.data);
            break;
          case 'conversion':
            if (req.output !== undefined) setConvertResult(req.output);
            break;
          default:
            break;
        }
        if (sendResponse) sendResponse('completed');
      } catch (err) {
        console.error('Error handling background message:', err);
      }
    };

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(listener);
    }

    return () => {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.removeListener(listener);
      }
    };
  }, []);

  // Update dynamic Axes result when selections change
  useEffect(() => {
    if (axesData && selectedSrc && selectedDst) {
      const parentExpr = `//${selectedSrc}${axesData.proOrFol}${selectedDst}`;
      sendMessageToCS({
        request: 'parseAxes',
        data: parentExpr
      });
    }
  }, [selectedSrc, selectedDst]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const copyToClipboard = (text: string, label = 'Copied to clipboard!') => {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        showToast(label);
      } else {
        console.warn('Copy command was unsuccessful');
      }
    } catch (err) {
      console.error('Copy failed:', err);
    }
    document.body.removeChild(el);
  };

  // Snippet Builders
  const getSeleniumJava = (codeType: string, val: string): string => {
    switch (codeType) {
      case 'CSS': return `driver.findElement(By.cssSelector("${val}"))`;
      case 'Unique Class Atrribute': return `driver.findElement(By.className("${val}"))`;
      case 'Unique TagName': return `driver.findElement(By.tagName("${val}"))`;
      case 'Link Text': return `driver.findElement(By.linkText("${val}"))`;
      case 'Unique ID': return `driver.findElement(By.id("${val}"))`;
      case 'Unique Name': return `driver.findElement(By.name("${val}"))`;
      case 'Unique PartialLinkText': return `driver.findElement(By.partialLinkText("${val}"))`;
      default: return `driver.findElement(By.xpath("${val}"))`;
    }
  };

  const getPlaywrightJava = (codeType: string, val: string): string => {
    switch (codeType) {
      case 'CSS': return `page.locator("${val}")`;
      case 'Unique Class Atrribute': return `page.locator(".${val}")`;
      case 'Unique TagName': return `page.locator("${val}")`;
      case 'Link Text': return `page.locator("'${val}'")`;
      case 'Unique ID': return `page.locator("id=${val}")`;
      case 'Unique Name': return `page.locator("[name='${val}']")`;
      case 'Unique PartialLinkText': return `page.locator("a:has-text('${val}'")`;
      default: return `page.locator("${val}")`;
    }
  };

  const getPlaywrightJS = (codeType: string, val: string): string => {
    switch (codeType) {
      case 'CSS': return `await page.locator("${val}")`;
      case 'Unique Class Atrribute': return `await page.locator(".${val}")`;
      case 'Unique TagName': return `await page.locator("${val}")`;
      case 'Link Text': return `await page.locator("'${val}'")`;
      case 'Unique ID': return `await page.locator("id=${val}")`;
      case 'Unique Name': return `await page.locator("[name='${val}']")`;
      case 'Unique PartialLinkText': return `await page.locator("a:has-text('${val}'")`;
      default: return `await page.locator("${val}")`;
    }
  };

  const getProtractor = (codeType: string, val: string): string => {
    switch (codeType) {
      case 'CSS': return `element(by.css("${val}"))`;
      case 'Unique Class Atrribute': return `element(by.className("${val}"))`;
      case 'Unique TagName': return `element(by.tagName("${val}"))`;
      case 'Link Text': return `element(by.linkText("${val}"))`;
      case 'Unique ID': return `element(by.id("${val}"))`;
      case 'Unique Name': return `element(by.name("${val}"))`;
      case 'Unique PartialLinkText': return `element(by.partialLinkText("${val}"))`;
      default: return `element(by.xpath("${val}"))`;
    }
  };

  const getSeleniumPython = (codeType: string, val: string): string => {
    switch (codeType) {
      case 'CSS': return `driver.find_element(by=By.CSS_SELECTOR, value="${val}")`;
      case 'Unique Class Atrribute': return `driver.find_element(by=By.CLASS_NAME, value="${val}")`;
      case 'Unique TagName': return `driver.find_element(by=By.TAG_NAME, value="${val}")`;
      case 'Link Text': return `driver.find_element(by=By.LINK_TEXT, value="${val}")`;
      case 'Unique ID': return `driver.find_element(by=By.ID, value="${val}")`;
      case 'Unique Name': return `driver.find_element(by=By.NAME, value="${val}")`;
      case 'Unique PartialLinkText': return `driver.find_element(by=By.PARTIAL_LINK_TEXT, value="${val}")`;
      default: return `driver.find_element(by=By.XPATH, value="${val}")`;
    }
  };

  const getCustomSnippet = (actionType: string, codeType: string, val: string, variable: string, method: string, templates: ChromeStorageResult): string => {
    let locatorValue = '';
    const customLang = templates.customLang || 'javacs';
    
    if (customLang === 'jscs') {
      locatorValue = getProtractor(codeType, val);
    } else {
      switch (codeType) {
        case 'CSS': locatorValue = `@FindBy(css = "${val}")\n`; break;
        case 'Unique Class Atrribute': locatorValue = `@FindBy(className = "${val}")\n`; break;
        case 'Unique TagName': locatorValue = `@FindBy(tagName = "${val}")\n`; break;
        case 'Link Text': locatorValue = `@FindBy(linkText = "${val}")\n`; break;
        case 'Unique ID': locatorValue = `@FindBy(id = "${val}")\n`; break;
        case 'Unique Name': locatorValue = `@FindBy(name = "${val}")\n`; break;
        case 'Unique PartialLinkText': locatorValue = `@FindBy(partialLinkText = "${val}")\n`; break;
        default: locatorValue = `@FindBy(xpath = "${val}")\n`; break;
      }
    }

    let template = '';
    switch (actionType) {
      case 'click':
        template = templates.clickvalue !== undefined && templates.clickvalue !== '' 
          ? templates.clickvalue 
          : DEFAULT_TEMPLATES[customLang].click;
        break;
      case 'sendKeys':
        template = templates.sendvalue !== undefined && templates.sendvalue !== '' 
          ? templates.sendvalue 
          : DEFAULT_TEMPLATES[customLang].send;
        break;
      case 'getText':
        template = templates.textvalue !== undefined && templates.textvalue !== '' 
          ? templates.textvalue 
          : DEFAULT_TEMPLATES[customLang].text;
        break;
      case 'getAttribute':
        template = templates.attrvalue !== undefined && templates.attrvalue !== '' 
          ? templates.attrvalue 
          : DEFAULT_TEMPLATES[customLang].attr;
        break;
      default:
        return '';
    }

    let result = template;
    if (result.includes('${lc}')) result = result.replaceAll('${lc}', locatorValue);
    if (result.includes('${vn}')) result = result.replaceAll('${vn}', variable);
    if (result.includes('${mn}')) result = result.replaceAll('${mn}', method);
    
    return result.trim();
  };

  const getSnippetCode = (actionType: string, codeType: string, val: string, variable: string, method: string, lang: string, templates: ChromeStorageResult): string => {
    let str = '';
    switch (lang) {
      case 'playwrightJS': str = getPlaywrightJS(codeType, val); break;
      case 'playwrightJava': str = getPlaywrightJava(codeType, val); break;
      case 'javas': str = getSeleniumJava(codeType, val); break;
      case 'py': str = getSeleniumPython(codeType, val); break;
      case 'csharp': str = getSeleniumJava(codeType, val); break; // maps similarly
      case 'protractorjs': str = getProtractor(codeType, val); break;
      case 'custom': return getCustomSnippet(actionType, codeType, val, variable, method, templates);
      default: str = getSeleniumJava(codeType, val); break;
    }

    switch (actionType) {
      case 'click': str += '.click();'; break;
      case 'sendKeys': str += lang.startsWith('playwright') ? '.fill("");' : (lang === 'py' ? '.send_keys("")' : '.sendKeys("");'); break;
      case 'getAttribute': str += lang.startsWith('playwright') ? '.getAttribute("value");' : (lang === 'py' ? '.get_attribute("value")' : '.getAttribute("value");'); break;
      case 'getText': str += lang.startsWith('playwright') ? '.textContent();' : (lang === 'py' ? '.get_text()' : '.getText();'); break;
      default: break;
    }
    return str;
  };

  const handleActionSelect = (e: React.ChangeEvent<HTMLSelectElement>, codeType: string, val: string) => {
    const action = e.target.value;
    if (action === 'snippet') return;

    const varName = selectedElement ? selectedElement.variablename || 'ele' : 'ele';
    const methName = selectedElement ? selectedElement.methodname || 'ele' : 'ele';
    
    const copyProcess = (lang: string, templates: ChromeStorageResult) => {
      const code = getSnippetCode(action, codeType, val, varName, methName, lang, templates);
      copyToClipboard(code, `Snippet (${action}) copied to clipboard!`);
    };

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(
        ['langID', 'customLang', 'clickvalue', 'sendvalue', 'textvalue', 'attrvalue'],
        (result: ChromeStorageResult) => {
          copyProcess(result.langID || 'javas', result);
        }
      );
    } else {
      const localLang = localStorage.getItem('langID') || 'javas';
      const localTemplates: ChromeStorageResult = {
        customLang: (localStorage.getItem('customLang') as 'jscs' | 'javacs') || 'javacs',
        clickvalue: localStorage.getItem('clickvalue') || '',
        sendvalue: localStorage.getItem('sendvalue') || '',
        textvalue: localStorage.getItem('textvalue') || '',
        attrvalue: localStorage.getItem('attrvalue') || ''
      };
      copyProcess(localLang, localTemplates);
    }
    
    // Reset dropdown selection
    e.target.value = 'snippet';
  };

  const getActionsForTag = (tag: string, inputType: string): string[] => {
    if (tag === 'textarea') return ACTION_LABELS.textarea;
    if (tag === 'input') {
      if (['submit', 'radio', 'checkbox'].includes(inputType)) {
        return ACTION_LABELS.input.click;
      }
      return ACTION_LABELS.input.send;
    }
    if (tag === 'img') return ACTION_LABELS.img;
    return ACTION_LABELS.default;
  };

  // Open Options page
  const handleOpenSettings = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('../option/option.html', '_blank');
    }
  };

  // Custom Search triggers
  const handleCustomSearch = () => {
    if (searchVal.length > 0) {
      sendMessageToCS({ request: 'cleanhighlight' });
      sendMessageToCS({ request: 'userSearchXP', data: searchVal });
    }
  };

  const handleClearHighlight = () => {
    setSearchVal('');
    setSearchResult(null);
    sendMessageToCS({ request: 'cleanhighlight' });
  };

  // Selector convertor trigger
  const handleConvertXPath = () => {
    if (convertVal.length > 0) {
      sendMessageToCS({ request: 'dotheconversion', data: convertVal });
    }
  };

  return (
    <div style={styles.appContainer}>
      <style dangerouslySetInnerHTML={{ __html: `
        /* Custom scrollbar for dark mode panel */
        ::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        ::-webkit-scrollbar-track {
          background: #181a1b;
        }
        ::-webkit-scrollbar-thumb {
          background: #37373d;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #464649;
        }
        /* Custom styling overrides for inputs and selectors */
        select.form-select {
          background-position: right 4px center !important;
          padding-right: 14px !important;
        }
        input.form-input::placeholder {
          color: #555;
        }
      `}} />

      {toast && (
        <div style={styles.toast}>
          <span>{toast}</span>
        </div>
      )}

      {/* Tab Navigation header */}
      <div style={styles.navBar}>
        <ul style={styles.tabsList}>
          <li style={styles.tabItem} onClick={() => setActiveTab(1)}>
            <span style={activeTab === 1 ? styles.activeLink : styles.link}>XPath</span>
          </li>
          <li style={styles.tabItem} onClick={() => setActiveTab(2)}>
            <span style={activeTab === 2 ? styles.activeLink : styles.link}>CSS</span>
          </li>
          <li style={styles.tabItem} onClick={() => setActiveTab(3)}>
            <span style={activeTab === 3 ? styles.activeLink : styles.link}>Axes</span>
          </li>
          <li style={styles.tabItem} onClick={() => setActiveTab(4)}>
            <span style={activeTab === 4 ? styles.activeLink : styles.link}>Tools</span>
          </li>
          <li style={styles.tabItem} onClick={() => setActiveTab(5)}>
            <span style={activeTab === 5 ? styles.activeLink : styles.link}>About</span>
          </li>
        </ul>
        <div style={styles.settingsBtn} onClick={handleOpenSettings} title="Settings">
          ⚙
        </div>
      </div>

      {/* Main Containers */}
      <div style={styles.contentBody}>
        
        {/* XPath Tab */}
        {activeTab === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {!selectedElement || !selectedElement.xpathid || selectedElement.xpathid.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>🔍</div>
                <div style={styles.emptyTitle}>Select an element in Elements tab</div>
                <div style={styles.emptySubtitle}>LetXPath will display optimized XPaths & action snippets here.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {/* Table Info if inside table */}
                {selectedElement.webtabledetails && (
                  <div style={styles.tableCard}>
                    <div style={styles.tableHeader}>
                      Table Detected ({selectedElement.webtabledetails.totalTables} total)
                    </div>
                    <div style={styles.tableRow}>
                      <span style={styles.tableLabel}>Table XPath:</span>
                      <code style={styles.tableCode} title="Click to copy Table Locator" onClick={() => copyToClipboard(selectedElement.webtabledetails!.tableLocator, 'Table Locator copied!')}>
                        {selectedElement.webtabledetails.tableLocator}
                      </code>
                    </div>
                    <div style={styles.tableRow}>
                      <span style={styles.tableLabel}>Selected Row XPath:</span>
                      <code style={styles.tableCode} title="Click to copy Row Locator" onClick={() => copyToClipboard(selectedElement.webtabledetails!.tableData, 'Row Locator copied!')}>
                        {selectedElement.webtabledetails.tableData}
                      </code>
                    </div>
                  </div>
                )}

                {/* XPaths list */}
                <div style={styles.locatorList}>
                  {selectedElement.xpathid.map((item, idx) => {
                    const [priority, label, value] = item;
                    return (
                      <div key={idx} style={styles.locatorRow}>
                        <div style={styles.labelBox}>
                          <span style={styles.priorityBadge}>{priority}</span>
                          <span style={styles.locatorLabel} title={label}>{label}</span>
                        </div>
                        <code 
                          style={styles.codeSnippet} 
                          title="Click to copy locator" 
                          onClick={() => copyToClipboard(value, 'Locator copied!')}
                        >
                          {value}
                        </code>
                        <select 
                          className="form-select select-sm" 
                          style={styles.actionSelect}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleActionSelect(e, label, value)}
                          defaultValue="snippet"
                        >
                          <option value="snippet" disabled>Snippet</option>
                          {getActionsForTag(selectedElement.tag, selectedElement.type).map(act => (
                            act !== 'snippet' && <option key={act} value={act}>{act}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CSS Tab */}
        {activeTab === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {!selectedElement || !selectedElement.cssPath || selectedElement.cssPath.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>🎨</div>
                <div style={styles.emptyTitle}>Select an element in Elements tab</div>
                <div style={styles.emptySubtitle}>LetXPath will display optimized CSS selectors here.</div>
              </div>
            ) : (
              <div style={styles.locatorList}>
                {selectedElement.cssPath.map((item, idx) => {
                  const [priority, label, value] = item;
                  return (
                    <div key={idx} style={styles.locatorRow}>
                      <div style={styles.labelBox}>
                        <span style={styles.priorityBadge}>{priority}</span>
                        <span style={styles.locatorLabel} title={label}>{label}</span>
                      </div>
                      <code 
                        style={styles.codeSnippet} 
                        title="Click to copy CSS" 
                        onClick={() => copyToClipboard(value, 'CSS Path copied!')}
                      >
                        {value}
                      </code>
                      <select 
                        className="form-select select-sm" 
                        style={styles.actionSelect}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleActionSelect(e, 'CSS', value)}
                        defaultValue="snippet"
                      >
                        <option value="snippet" disabled>Snippet</option>
                        {getActionsForTag(selectedElement.tag, selectedElement.type).map(act => (
                          act !== 'snippet' && <option key={act} value={act}>{act}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Axes Tab */}
        {activeTab === 3 && (
          <div>
            {!axesData ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>🔗</div>
                <div style={styles.emptyTitle}>Axes-based dynamic locator</div>
                <div style={styles.emptySubtitle}>
                  Right click on the page context menu and select <strong>Parent Element</strong>, then <strong>Child Element</strong>.
                </div>
              </div>
            ) : (
              <div style={styles.axesContainer}>
                <div style={styles.axesResultBox}>
                  <div style={{ fontSize: '9px', color: '#858585', marginBottom: '2px' }}>Resulting XPath:</div>
                  <code style={styles.axesResultCode} title="Click to copy Axes XPath" onClick={() => copyToClipboard(axesXPathResult, 'Axes XPath copied!')}>
                    {axesXPathResult}
                  </code>
                </div>

                <div style={styles.axesColumns}>
                  {/* Src elements */}
                  <div style={styles.axesColumn}>
                    <div style={styles.columnHeader}>Parent Locators</div>
                    {axesData.src.map((el, i) => (
                      <div key={i} style={styles.radioWrapper}>
                        <label className="form-radio" style={styles.radioLabel}>
                          <input 
                            type="radio" 
                            name="axesSrc" 
                            value={el[1]} 
                            checked={selectedSrc === el[1]}
                            onChange={() => setSelectedSrc(el[1])}
                          />
                          <i className="form-icon" style={{ top: '2px' }}></i>
                          <span style={{ marginLeft: '4px', verticalAlign: 'middle' }}>{i + 1}. {el[2]}</span>
                        </label>
                      </div>
                    ))}
                  </div>

                  {/* Dst elements */}
                  <div style={styles.axesColumn}>
                    <div style={styles.columnHeader}>Child Locators</div>
                    {axesData.dst.map((el, i) => (
                      <div key={i} style={styles.radioWrapper}>
                        <label className="form-radio" style={styles.radioLabel}>
                          <input 
                            type="radio" 
                            name="axesDst" 
                            value={el[1]} 
                            checked={selectedDst === el[1]}
                            onChange={() => setSelectedDst(el[1])}
                          />
                          <i className="form-icon" style={{ top: '2px' }}></i>
                          <span style={{ marginLeft: '4px', verticalAlign: 'middle' }}>{i + 1}. {el[2]}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tools Tab */}
        {activeTab === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Custom Search Box */}
            <div style={styles.toolCard}>
              <div style={styles.toolTitle}>Custom XPath Evaluator</div>
              <div style={styles.toolDesc}>Evaluate, test, and highlight custom XPaths on the active page.</div>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'stretch' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  style={styles.toolInput} 
                  placeholder="Type your XPath (e.g. //input[@name='q'])"
                  value={searchVal}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchVal(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleCustomSearch()}
                />
                <button style={styles.btnFind} onClick={handleCustomSearch}>Find</button>
                <button style={styles.btnClear} onClick={handleClearHighlight}>Clear</button>
              </div>
              {searchResult && (
                <div style={searchResult.count > 0 ? styles.searchSuccess : styles.searchFail}>
                  Matched elements: <strong>{searchResult.count}</strong>
                </div>
              )}
            </div>

            {/* CSS Converter Box */}
            <div style={styles.toolCard}>
              <div style={styles.toolTitle}>XPath to CSS Converter</div>
              <div style={styles.toolDesc}>Convert standard XPath queries directly into CSS selectors (Beta).</div>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'stretch' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  style={styles.toolInput} 
                  placeholder="Enter XPath to convert"
                  value={convertVal}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConvertVal(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleConvertXPath()}
                />
                <button style={styles.btnFind} onClick={handleConvertXPath}>Convert</button>
              </div>
              {convertResult && (
                <div style={styles.convertBox}>
                  <div style={{ fontSize: '9px', color: '#858585', marginBottom: '2px' }}>CSS Selector Output:</div>
                  <code style={styles.convertCode} title="Click to copy CSS Selector" onClick={() => copyToClipboard(convertResult, 'Converted CSS copied!')}>
                    {convertResult}
                  </code>
                </div>
              )}
            </div>
          </div>
        )}

        {/* About Tab */}
        {activeTab === 5 && (
          <div style={styles.aboutCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <img src="../assets/32.png" width="16px" height="16px" alt="LetXPath logo" />
              <h4 style={{ color: '#fff', margin: 0, fontSize: '11px', fontWeight: 600 }}>LetXPath By LetCode with Koushik</h4>
            </div>
            <p style={{ color: '#aaa', fontSize: '10px', lineHeight: '1.4', margin: '0 0 8px 0' }}>
              LetXPath is a lightweight developer utility built to accelerate locator building for test automation.
            </p>
            <div style={styles.divider} />
            
            <div style={styles.linkRow}>
              <a href="https://github.com/ortoniKC/LetXPath" target="_blank" style={styles.aboutLink}>GitHub Source</a>
              <a href="https://youtube.com/@letcode" target="_blank" style={styles.aboutLink}>YouTube Channel</a>
              <a href="https://chromewebstore.google.com/detail/letxpath/bekehlnepmijedippfibbmbglglbmlgk/reviews" target="_blank" style={styles.aboutLink}>Rate Extension</a>
            </div>

            <div style={{ marginTop: '12px', color: '#777', fontSize: '9px' }}>
              Designed and built by Koushik Chatterjee.
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

const styles = {
  appContainer: {
    backgroundColor: '#181a1b',
    color: '#cccccc',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '11px'
  },
  navBar: {
    borderBottom: '1px solid #2d2d2d',
    backgroundColor: '#252526',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 4px',
    height: '26px',
    userSelect: 'none' as const,
    minHeight: '26px'
  },
  tabsList: {
    display: 'flex',
    listStyle: 'none',
    margin: 0,
    padding: 0,
    height: '100%',
    alignItems: 'stretch'
  },
  tabItem: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    margin: 0,
    padding: 0
  },
  link: {
    color: '#969696',
    padding: '0 8px',
    fontSize: '11px',
    fontWeight: 'normal',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    borderBottom: '2px solid transparent',
    transition: 'color 0.2s, border-color 0.2s',
    textDecoration: 'none'
  },
  activeLink: {
    color: '#ffffff',
    padding: '0 8px',
    fontSize: '11px',
    fontWeight: '500',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    borderBottom: '2px solid #0e639c',
    textDecoration: 'none'
  },
  settingsBtn: {
    padding: '0 6px',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#858585',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    transition: 'color 0.2s'
  },
  contentBody: {
    padding: '6px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    overflowY: 'auto' as const
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    color: '#777',
    marginTop: '40px',
    padding: '12px'
  },
  emptyTitle: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#bbbbbb',
    marginBottom: '2px'
  },
  emptySubtitle: {
    fontSize: '10px',
    maxWidth: '220px',
    lineHeight: '1.3'
  },
  locatorList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px'
  },
  locatorRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '3px 4px',
    borderBottom: '1px solid #252526',
    gap: '4px',
    backgroundColor: '#1e1e1e',
    borderRadius: '2px'
  },
  labelBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    width: '84px',
    minWidth: '84px',
    overflow: 'hidden'
  },
  priorityBadge: {
    backgroundColor: '#37373d',
    color: '#858585',
    fontSize: '9px',
    fontWeight: 'bold',
    borderRadius: '2px',
    padding: '1px 3px',
    display: 'inline-block',
    textAlign: 'center' as const,
    minWidth: '12px'
  },
  locatorLabel: {
    fontSize: '10px',
    color: '#aaaaaa',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const
  },
  codeSnippet: {
    flex: 1,
    backgroundColor: '#151515',
    color: '#4ec9b0', // VSCode teal color for selector strings
    border: '1px solid #2d2d2d',
    borderRadius: '2px',
    padding: '2px 4px',
    fontSize: '10px',
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    cursor: 'pointer',
    userSelect: 'all' as const
  },
  actionSelect: {
    backgroundColor: '#252526',
    color: '#cccccc',
    border: '1px solid #3c3c3c',
    borderRadius: '2px',
    padding: '1px 2px',
    fontSize: '10px',
    width: '64px',
    cursor: 'pointer',
    outline: 'none',
    height: '18px'
  },
  toast: {
    position: 'fixed' as const,
    bottom: '12px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 9999,
    padding: '4px 10px',
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
    border: '1px solid #0e639c',
    background: '#0e639c',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '10px'
  },
  tableCard: {
    backgroundColor: '#202020',
    borderLeft: '3px solid #ffb86c',
    padding: '4px 6px',
    marginBottom: '4px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
    borderRadius: '2px'
  },
  tableHeader: {
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#ffb86c'
  },
  tableRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  tableLabel: {
    fontSize: '9px',
    color: '#888',
    width: '80px',
    minWidth: '80px'
  },
  tableCode: {
    flex: 1,
    backgroundColor: '#151515',
    color: '#ffb86c',
    border: '1px solid #2d2d2d',
    borderRadius: '2px',
    padding: '2px 4px',
    fontSize: '10px',
    fontFamily: 'Consolas, Monaco, monospace',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  axesContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    padding: '2px'
  },
  axesResultBox: {
    backgroundColor: '#151515',
    border: '1px solid #2d2d2d',
    borderRadius: '2px',
    padding: '4px 6px'
  },
  axesResultCode: {
    color: '#569cd6',
    fontSize: '10px',
    fontFamily: 'Consolas, Monaco, monospace',
    fontWeight: 'bold',
    cursor: 'pointer',
    wordBreak: 'break-all' as const
  },
  axesColumns: {
    display: 'flex',
    gap: '4px',
    marginTop: '2px'
  },
  axesColumn: {
    flex: 1,
    border: '1px solid #2d2d2d',
    borderRadius: '2px',
    padding: '4px',
    backgroundColor: '#202020',
    maxHeight: '160px',
    overflowY: 'auto' as const
  },
  columnHeader: {
    fontSize: '9px',
    color: '#888',
    fontWeight: 'bold',
    marginBottom: '4px',
    textTransform: 'uppercase' as const,
    borderBottom: '1px solid #2d2d2d',
    paddingBottom: '2px'
  },
  radioWrapper: {
    margin: '2px 0'
  },
  radioLabel: {
    color: '#cccccc',
    fontSize: '10px',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none' as const
  },
  toolCard: {
    backgroundColor: '#202020',
    border: '1px solid #2d2d2d',
    borderRadius: '2px',
    padding: '6px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px'
  },
  toolTitle: {
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#ffffff'
  },
  toolDesc: {
    fontSize: '9px',
    color: '#666',
    marginBottom: '2px'
  },
  toolInput: {
    backgroundColor: '#151515',
    color: '#cccccc',
    border: '1px solid #2d2d2d',
    borderRadius: '2px',
    padding: '2px 4px',
    fontSize: '10px',
    outline: 'none',
    flex: 1,
    height: '20px'
  },
  btnFind: {
    border: 'none',
    backgroundColor: '#0e639c',
    color: '#ffffff',
    padding: '2px 6px',
    fontSize: '10px',
    borderRadius: '2px',
    cursor: 'pointer',
    fontWeight: '500',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnClear: {
    border: 'none',
    backgroundColor: 'transparent',
    color: '#f44336',
    padding: '2px 4px',
    fontSize: '10px',
    cursor: 'pointer',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  searchSuccess: {
    marginTop: '2px',
    color: '#4ade80',
    fontSize: '10px'
  },
  searchFail: {
    marginTop: '2px',
    color: '#f44336',
    fontSize: '10px'
  },
  convertBox: {
    marginTop: '4px',
    backgroundColor: '#151515',
    border: '1px solid #2d2d2d',
    padding: '4px',
    borderRadius: '2px'
  },
  convertCode: {
    color: '#4ade80',
    fontSize: '10px',
    fontFamily: 'Consolas, Monaco, monospace',
    cursor: 'pointer',
    wordBreak: 'break-all' as const
  },
  aboutCard: {
    backgroundColor: '#202020',
    border: '1px solid #2d2d2d',
    borderRadius: '2px',
    padding: '8px'
  },
  divider: {
    height: '1px',
    backgroundColor: '#2d2d2d',
    margin: '6px 0'
  },
  linkRow: {
    display: 'flex',
    gap: '8px'
  },
  aboutLink: {
    color: '#3794ff',
    fontSize: '10px',
    textDecoration: 'none'
  }
};

export default PanelApp;
