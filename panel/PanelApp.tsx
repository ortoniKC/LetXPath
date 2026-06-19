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
      {toast && (
        <div style={styles.toast} className="toast toast-success">
          <span>{toast}</span>
        </div>
      )}

      {/* Tab Navigation header */}
      <div style={styles.navBar}>
        <ul className="tab tab-block" style={{ margin: 0, border: 'none' }}>
          <li className={`tab-item c-hand ${activeTab === 1 ? 'active' : ''}`} onClick={() => setActiveTab(1)}>
            <a style={activeTab === 1 ? styles.activeLink : styles.link}>XPath</a>
          </li>
          <li className={`tab-item c-hand ${activeTab === 2 ? 'active' : ''}`} onClick={() => setActiveTab(2)}>
            <a style={activeTab === 2 ? styles.activeLink : styles.link}>CSS</a>
          </li>
          <li className={`tab-item c-hand ${activeTab === 3 ? 'active' : ''}`} onClick={() => setActiveTab(3)}>
            <a style={activeTab === 3 ? styles.activeLink : styles.link}>Axes</a>
          </li>
          <li className={`tab-item c-hand ${activeTab === 4 ? 'active' : ''}`} onClick={() => setActiveTab(4)}>
            <a style={activeTab === 4 ? styles.activeLink : styles.link}>Tools</a>
          </li>
          <li className={`tab-item c-hand ${activeTab === 5 ? 'active' : ''}`} onClick={() => setActiveTab(5)}>
            <a style={activeTab === 5 ? styles.activeLink : styles.link}>About</a>
          </li>
          <li className="tab-item c-hand" onClick={handleOpenSettings} style={{ padding: '0 8px', display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '1.2rem', color: '#8b8efc' }} title="Settings">⚙</span>
          </li>
        </ul>
      </div>

      {/* Main Containers */}
      <div style={styles.contentBody}>
        
        {/* XPath Tab */}
        {activeTab === 1 && (
          <div>
            {!selectedElement || !selectedElement.xpathid || selectedElement.xpathid.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🔍</div>
                <div style={styles.emptyTitle}>Select an element in Elements tab</div>
                <div style={styles.emptySubtitle}>LetXPath will display optimized XPaths & action snippets here.</div>
              </div>
            ) : (
              <div>
                {/* Table Info if inside table */}
                {selectedElement.webtabledetails && (
                  <div style={styles.tableCard}>
                    <div style={styles.tableHeader}>
                      Table Details ({selectedElement.webtabledetails.totalTables} detected)
                    </div>
                    <div style={styles.tableRow}>
                      <span style={styles.tableLabel}>Table XPath:</span>
                      <code style={styles.tableCode} onClick={() => copyToClipboard(selectedElement.webtabledetails!.tableLocator, 'Table Locator copied!')}>
                        {selectedElement.webtabledetails.tableLocator}
                      </code>
                    </div>
                    <div style={styles.tableRow}>
                      <span style={styles.tableLabel}>Row XPath:</span>
                      <code style={styles.tableCode} onClick={() => copyToClipboard(selectedElement.webtabledetails!.tableData, 'Row Locator copied!')}>
                        {selectedElement.webtabledetails.tableData}
                      </code>
                    </div>
                  </div>
                )}

                {/* XPaths list */}
                {selectedElement.xpathid.map((item, idx) => {
                  const [priority, label, value] = item;
                  return (
                    <div key={idx} style={styles.locatorCard}>
                      <div style={styles.cardMeta}>
                        <span className="badge" style={styles.priorityBadge}>{priority}</span>
                        <span style={styles.locatorLabel}>{label}</span>
                      </div>
                      <div style={styles.cardInputRow}>
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CSS Tab */}
        {activeTab === 2 && (
          <div>
            {!selectedElement || !selectedElement.cssPath || selectedElement.cssPath.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🎨</div>
                <div style={styles.emptyTitle}>Select an element in Elements tab</div>
                <div style={styles.emptySubtitle}>LetXPath will display optimized CSS selectors here.</div>
              </div>
            ) : (
              <div>
                {selectedElement.cssPath.map((item, idx) => {
                  const [priority, label, value] = item;
                  return (
                    <div key={idx} style={styles.locatorCard}>
                      <div style={styles.cardMeta}>
                        <span className="badge" style={styles.priorityBadge}>{priority}</span>
                        <span style={styles.locatorLabel}>{label}</span>
                      </div>
                      <div style={styles.cardInputRow}>
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
                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🔗</div>
                <div style={styles.emptyTitle}>Axes-based dynamic locator</div>
                <div style={styles.emptySubtitle}>
                  Right click on the page context menu and select <strong>Parent Element</strong>, then <strong>Child Element</strong>.
                </div>
              </div>
            ) : (
              <div style={styles.axesContainer}>
                <div style={styles.axesResultBox}>
                  <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '4px' }}>Resulting XPath:</div>
                  <code style={styles.axesResultCode} onClick={() => copyToClipboard(axesXPathResult, 'Axes XPath copied!')}>
                    {axesXPathResult}
                  </code>
                </div>

                <div className="columns" style={{ marginTop: '16px' }}>
                  {/* Src elements */}
                  <div className="column col-6" style={{ borderRight: '1px solid #303438' }}>
                    <div style={styles.columnHeader}>Parent Locators</div>
                    {axesData.src.map((el, i) => (
                      <div key={i} style={styles.radioWrapper}>
                        <label className="form-radio" style={{ color: '#fff', fontSize: '0.85rem' }}>
                          <input 
                            type="radio" 
                            name="axesSrc" 
                            value={el[1]} 
                            checked={selectedSrc === el[1]}
                            onChange={() => setSelectedSrc(el[1])}
                          />
                          <i className="form-icon"></i>{i + 1}. {el[2]}
                        </label>
                      </div>
                    ))}
                  </div>

                  {/* Dst elements */}
                  <div className="column col-6">
                    <div style={styles.columnHeader}>Child Locators</div>
                    {axesData.dst.map((el, i) => (
                      <div key={i} style={styles.radioWrapper}>
                        <label className="form-radio" style={{ color: '#fff', fontSize: '0.85rem' }}>
                          <input 
                            type="radio" 
                            name="axesDst" 
                            value={el[1]} 
                            checked={selectedDst === el[1]}
                            onChange={() => setSelectedDst(el[1])}
                          />
                          <i className="form-icon"></i>{i + 1}. {el[2]}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Custom Search Box */}
            <div style={styles.toolCard}>
              <div style={styles.toolTitle}>Custom XPath Evaluator</div>
              <div style={styles.toolDesc}>Evaluate, test, and highlight custom XPaths on the active page.</div>
              <div className="input-group" style={{ margin: '8px 0' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  style={styles.toolInput} 
                  placeholder="Type your XPath (e.g. //input[@name='q'])"
                  value={searchVal}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchVal(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleCustomSearch()}
                />
                <button className="btn btn-primary" style={styles.btnFind} onClick={handleCustomSearch}>Find</button>
                <button className="btn btn-link" style={styles.btnClear} onClick={handleClearHighlight}>Clear</button>
              </div>
              {searchResult && (
                <div style={searchResult.count > 0 ? styles.searchSuccess : styles.searchFail}>
                  <strong>{searchResult.xpath}</strong>: {searchResult.count} matching elements found
                </div>
              )}
            </div>

            {/* CSS Converter Box */}
            <div style={styles.toolCard}>
              <div style={styles.toolTitle}>XPath to CSS Converter</div>
              <div style={styles.toolDesc}>Convert standard XPath queries directly into CSS selectors (Beta).</div>
              <div className="input-group" style={{ margin: '8px 0' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  style={styles.toolInput} 
                  placeholder="Enter XPath to convert"
                  value={convertVal}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConvertVal(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleConvertXPath()}
                />
                <button className="btn btn-primary" style={styles.btnFind} onClick={handleConvertXPath}>Convert</button>
              </div>
              {convertResult && (
                <div style={styles.convertBox}>
                  <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '4px' }}>CSS Selector Output:</div>
                  <code style={styles.convertCode} onClick={() => copyToClipboard(convertResult, 'Converted CSS copied!')}>
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
            <h4 style={{ color: '#fff', margin: '0 0 10px 0', fontSize: '1.2rem', fontWeight: 600 }}>LetXPath By LetCode with Koushik</h4>
            <p style={{ color: '#ccc', fontSize: '0.9rem', lineHeight: '1.4' }}>
              LetXPath is an open-source, robust developer utility focused on simplifying element locator queries. It is free, always will be, and is built to optimize productivity for testing frameworks.
            </p>
            <div style={styles.divider} />
            
            <div style={styles.linkRow}>
              <a href="https://github.com/ortoniKC/LetXPath" target="_blank" style={styles.aboutLink}>GitHub Source</a>
              <a href="https://youtube.com/@letcode" target="_blank" style={styles.aboutLink}>YouTube Channel</a>
              <a href="https://chromewebstore.google.com/detail/letxpath/bekehlnepmijedippfibbmbglglbmlgk/reviews" target="_blank" style={styles.aboutLink}>Rate Extension</a>
            </div>

            <div style={{ marginTop: '20px', color: '#aaa', fontSize: '0.8rem' }}>
              Designed and built by Koushik Chatterjee. Feel free to contribute or raise issues!
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
    color: '#fff',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  navBar: {
    borderBottom: '1px solid #303438',
    backgroundColor: '#202224',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100
  },
  link: {
    color: '#aaa',
    padding: '8px 12px',
    fontSize: '0.85rem'
  },
  activeLink: {
    color: '#8b8efc',
    fontWeight: 'bold',
    padding: '8px 12px',
    fontSize: '0.85rem',
    borderBottom: '2px solid #8b8efc'
  },
  contentBody: {
    padding: '12px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    color: '#999',
    marginTop: '60px',
    padding: '20px'
  },
  emptyTitle: {
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#ddd',
    marginBottom: '4px'
  },
  emptySubtitle: {
    fontSize: '0.8rem',
    maxWidth: '240px'
  },
  locatorCard: {
    backgroundColor: '#202224',
    border: '1px solid #303438',
    borderRadius: '6px',
    padding: '10px',
    marginBottom: '10px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px'
  },
  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  priorityBadge: {
    backgroundColor: '#8b8efc',
    color: '#181a1b',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    borderRadius: '4px',
    padding: '2px 6px'
  },
  locatorLabel: {
    fontSize: '0.75rem',
    color: '#aaa',
    fontWeight: '500'
  },
  cardInputRow: {
    display: 'flex',
    alignItems: 'stretch',
    gap: '8px'
  },
  codeSnippet: {
    flex: 1,
    backgroundColor: '#181a1b',
    color: '#4ade80',
    border: '1px solid #484c51',
    borderRadius: '4px',
    padding: '6px 10px',
    fontSize: '0.8rem',
    fontFamily: '"Oxygen Mono", monospace',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    cursor: 'pointer',
    userSelect: 'none' as const
  },
  actionSelect: {
    backgroundColor: '#2b2e31',
    color: '#fff',
    border: '1px solid #484c51',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '0.8rem',
    width: '100px'
  },
  toast: {
    position: 'fixed' as const,
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 9999,
    padding: '10px 20px',
    borderRadius: '20px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
    border: '1px solid #8b8efc',
    background: '#8b8efc',
    color: '#181a1b',
    fontWeight: 'bold',
    fontSize: '0.8rem'
  },
  tableCard: {
    backgroundColor: '#202224',
    border: '1px solid #ffb86c',
    borderRadius: '6px',
    padding: '10px',
    marginBottom: '12px'
  },
  tableHeader: {
    fontSize: '0.8rem',
    fontWeight: 'bold',
    color: '#ffb86c',
    marginBottom: '6px'
  },
  tableRow: {
    display: 'flex',
    flexDirection: 'column' as const,
    marginBottom: '6px'
  },
  tableLabel: {
    fontSize: '0.7rem',
    color: '#aaa'
  },
  tableCode: {
    backgroundColor: '#181a1b',
    color: '#ffb86c',
    border: '1px solid #484c51',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '0.75rem',
    cursor: 'pointer',
    marginTop: '2px',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  axesContainer: {
    backgroundColor: '#202224',
    border: '1px solid #303438',
    borderRadius: '6px',
    padding: '12px'
  },
  axesResultBox: {
    backgroundColor: '#181a1b',
    border: '1px solid #303438',
    borderRadius: '4px',
    padding: '8px',
    marginBottom: '12px'
  },
  axesResultCode: {
    color: '#8b8efc',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    wordBreak: 'break-all' as const
  },
  columnHeader: {
    fontSize: '0.8rem',
    color: '#aaa',
    fontWeight: 'bold',
    marginBottom: '8px',
    textTransform: 'uppercase' as const
  },
  radioWrapper: {
    margin: '6px 0'
  },
  toolCard: {
    backgroundColor: '#202224',
    border: '1px solid #303438',
    borderRadius: '6px',
    padding: '12px'
  },
  toolTitle: {
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: '#fff'
  },
  toolDesc: {
    fontSize: '0.75rem',
    color: '#aaa',
    marginBottom: '8px'
  },
  toolInput: {
    backgroundColor: '#181a1b',
    color: '#fff',
    border: '1px solid #484c51',
    fontSize: '0.8rem'
  },
  btnFind: {
    border: 'none',
    backgroundColor: '#8b8efc',
    color: '#181a1b',
    fontWeight: 'bold',
    fontSize: '0.8rem'
  },
  btnClear: {
    color: '#ff5555',
    fontSize: '0.8rem'
  },
  searchSuccess: {
    marginTop: '8px',
    color: '#4ade80',
    fontSize: '0.8rem'
  },
  searchFail: {
    marginTop: '8px',
    color: '#ff5555',
    fontSize: '0.8rem'
  },
  convertBox: {
    marginTop: '8px',
    backgroundColor: '#181a1b',
    border: '1px solid #303438',
    padding: '8px',
    borderRadius: '4px'
  },
  convertCode: {
    color: '#4ade80',
    fontSize: '0.8rem',
    cursor: 'pointer',
    wordBreak: 'break-all' as const
  },
  aboutCard: {
    backgroundColor: '#202224',
    border: '1px solid #303438',
    borderRadius: '6px',
    padding: '16px'
  },
  divider: {
    height: '1px',
    backgroundColor: '#303438',
    margin: '12px 0'
  },
  linkRow: {
    display: 'flex',
    gap: '12px'
  },
  aboutLink: {
    color: '#8b8efc',
    fontSize: '0.85rem',
    textDecoration: 'none'
  }
};

export default PanelApp;
