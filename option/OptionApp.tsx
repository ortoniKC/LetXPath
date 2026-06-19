import React, { useState, useEffect } from 'react';

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

interface ChromeStorageResult {
  langID?: string;
  customLang?: 'jscs' | 'javacs';
  clickvalue?: string;
  sendvalue?: string;
  textvalue?: string;
  attrvalue?: string;
}

const OptionApp: React.FC = () => {
  const [langID, setLangID] = useState<string>('javas');
  const [customLang, setCustomLang] = useState<'jscs' | 'javacs'>('javacs');
  const [clickvalue, setClickvalue] = useState<string>('');
  const [sendvalue, setSendvalue] = useState<string>('');
  const [textvalue, setTextvalue] = useState<string>('');
  const [attrvalue, setAttrvalue] = useState<string>('');
  const [toast, setToast] = useState<string | null>(null);

  // Sync state with chrome.storage.local
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(
        ['langID', 'customLang', 'clickvalue', 'sendvalue', 'textvalue', 'attrvalue'],
        (result: ChromeStorageResult) => {
          if (result.langID) setLangID(result.langID);
          if (result.customLang) setCustomLang(result.customLang);
          
          const currentCustomLang = result.customLang || 'javacs';
          setClickvalue(result.clickvalue !== undefined ? result.clickvalue : DEFAULT_TEMPLATES[currentCustomLang].click);
          setSendvalue(result.sendvalue !== undefined ? result.sendvalue : DEFAULT_TEMPLATES[currentCustomLang].send);
          setTextvalue(result.textvalue !== undefined ? result.textvalue : DEFAULT_TEMPLATES[currentCustomLang].text);
          setAttrvalue(result.attrvalue !== undefined ? result.attrvalue : DEFAULT_TEMPLATES[currentCustomLang].attr);
        }
      );
    } else {
      // Dev LocalStorage Fallback
      const localCustomLang = (localStorage.getItem('customLang') as 'jscs' | 'javacs') || 'javacs';
      setLangID(localStorage.getItem('langID') || 'javas');
      setCustomLang(localCustomLang);
      setClickvalue(localStorage.getItem('clickvalue') || DEFAULT_TEMPLATES[localCustomLang].click);
      setSendvalue(localStorage.getItem('sendvalue') || DEFAULT_TEMPLATES[localCustomLang].send);
      setTextvalue(localStorage.getItem('textvalue') || DEFAULT_TEMPLATES[localCustomLang].text);
      setAttrvalue(localStorage.getItem('attrvalue') || DEFAULT_TEMPLATES[localCustomLang].attr);
    }
  }, []);

  // Update templates when custom framework lang switches if values are default
  const handleCustomLangChange = (newLang: 'jscs' | 'javacs') => {
    setCustomLang(newLang);
    setClickvalue(DEFAULT_TEMPLATES[newLang].click);
    setSendvalue(DEFAULT_TEMPLATES[newLang].send);
    setTextvalue(DEFAULT_TEMPLATES[newLang].text);
    setAttrvalue(DEFAULT_TEMPLATES[newLang].attr);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      langID,
      customLang,
      clickvalue,
      sendvalue,
      textvalue,
      attrvalue
    };

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set(data, () => {
        showToast('Settings saved successfully!');
      });
    } else {
      Object.keys(data).forEach(key => localStorage.setItem(key, data[key as keyof typeof data] as string));
      showToast('Local settings saved!');
    }
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const getCodeSample = (): string => {
    switch (langID) {
      case 'playwrightJS':
        return `await page.locator("locator value");`;
      case 'playwrightJava':
        return `page.locator("locator value");`;
      case 'javas':
        return `driver.findElement(By.xpath("locator value"));`;
      case 'py':
        return `driver.find_element(By.XPATH, "locator value")`;
      case 'csharp':
        return `driver.FindElement(By.Xpath("locator value"));`;
      case 'protractorjs':
        return `element(by.xpath("locator value"));`;
      case 'custom':
        return `Custom Framework Dynamic Snippets (Template: ${customLang === 'jscs' ? 'JS/TS' : 'Java/POM'})`;
      default:
        return `driver.findElement(By.xpath("locator value"));`;
    }
  };

  return (
    <div style={styles.container}>
      {toast && (
        <div style={styles.toast} className="toast toast-success">
          <span style={{ fontWeight: 'bold' }}>✓ {toast}</span>
        </div>
      )}
      
      <div className="container" style={{ maxWidth: '900px', margin: '40px auto' }}>
        <div style={styles.hero} className="hero bg-primary">
          <div className="hero-body">
            <h1 style={{ fontSize: '2.5rem', margin: 0, fontWeight: 700 }}>LetXPath Settings</h1>
            <p style={{ opacity: 0.8, marginTop: '8px' }}>Configure default code generation templates & custom selector frameworks</p>
          </div>
        </div>

        <div className="columns" style={{ marginTop: '24px' }}>
          <div className="column col-12">
            <div className="card" style={styles.card}>
              <div className="card-header">
                <div className="card-title h5" style={{ color: '#fff' }}>Snippet Configuration</div>
                <div className="card-subtitle" style={{ color: '#aaa' }}>Choose the default target framework for your copy-paste automation scripts</div>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <select 
                    style={styles.select}
                    className="form-select" 
                    value={langID} 
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      setLangID(e.target.value);
                      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                        chrome.storage.local.set({ langID: e.target.value });
                      } else {
                        localStorage.setItem('langID', e.target.value);
                      }
                      showToast(`Snippet type updated to ${e.target.value}`);
                    }}
                  >
                    <option value="javas">Selenium Java</option>
                    <option value="playwrightJS">Playwright - Node</option>
                    <option value="playwrightJava">Playwright - Java</option>
                    <option value="py">Selenium Python</option>
                    <option value="csharp">Selenium C#</option>
                    <option value="protractorjs">Protractor (Angular)</option>
                    <option value="custom">Custom Framework Templates</option>
                  </select>
                </div>

                <div style={styles.previewBox}>
                  <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Preview Template:</div>
                  <pre style={styles.code}><code>{getCodeSample()}</code></pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {langID === 'custom' && (
          <div className="columns" style={{ marginTop: '20px' }}>
            {/* Custom Settings Form */}
            <div className="column col-6 col-xs-12">
              <div className="card" style={styles.card}>
                <div className="card-header">
                  <div className="card-title h5" style={{ color: '#fff' }}>Custom Templates Builder</div>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSave}>
                    <div className="form-group">
                      <label className="form-label" style={{ color: '#ddd' }}>Framework Paradigm</label>
                      <div style={styles.radioGroup}>
                        <label className="form-radio" style={{ color: '#fff', marginRight: '16px' }}>
                          <input 
                            type="radio" 
                            name="customLangType" 
                            checked={customLang === 'jscs'} 
                            onChange={() => handleCustomLangChange('jscs')} 
                          />
                          <i className="form-icon"></i> Protractor JS/TS
                        </label>
                        <label className="form-radio" style={{ color: '#fff' }}>
                          <input 
                            type="radio" 
                            name="customLangType" 
                            checked={customLang === 'javacs'} 
                            onChange={() => handleCustomLangChange('javacs')} 
                          />
                          <i className="form-icon"></i> Selenium Java/POM
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ color: '#ddd' }}>Click Template</label>
                      <textarea 
                        style={styles.textarea}
                        className="form-input" 
                        rows={3}
                        value={clickvalue}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setClickvalue(e.target.value)}
                        placeholder="Click template string"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ color: '#ddd' }}>sendKeys Template</label>
                      <textarea 
                        style={styles.textarea}
                        className="form-input" 
                        rows={3}
                        value={sendvalue}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSendvalue(e.target.value)}
                        placeholder="SendKeys template string"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ color: '#ddd' }}>getText Template</label>
                      <textarea 
                        style={styles.textarea}
                        className="form-input" 
                        rows={3}
                        value={textvalue}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTextvalue(e.target.value)}
                        placeholder="GetText template string"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ color: '#ddd' }}>getAttribute Template</label>
                      <textarea 
                        style={styles.textarea}
                        className="form-input" 
                        rows={3}
                        value={attrvalue}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAttrvalue(e.target.value)}
                        placeholder="GetAttribute template string"
                      />
                    </div>

                    <div style={{ marginTop: '20px' }}>
                      <button type="submit" style={styles.btnSave} className="btn btn-primary">
                        Save Custom Snippets
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Instruction Card */}
            <div className="column col-6 col-xs-12">
              <div className="card" style={styles.card}>
                <div className="card-header">
                  <div className="card-title h5" style={{ color: '#fff' }}>Template Syntax Guide</div>
                </div>
                <div className="card-body" style={{ color: '#ccc' }}>
                  <p>Define custom code generation rules by placing interpolation tags in your templates. LetXPath will replace them with contextual element variables during evaluation:</p>
                  
                  <div style={styles.tokenContainer}>
                    <span className="chip" style={styles.chip}><strong>{"${lc}"}</strong> - Selector / Locator Value</span>
                    <span className="chip" style={styles.chip}><strong>{"${vn}"}</strong> - Camel-case Variable Name</span>
                    <span className="chip" style={styles.chip}><strong>{"${mn}"}</strong> - Camel-case Action Method Name</span>
                  </div>

                  <h5 style={{ color: '#fff', marginTop: '20px' }}>Example Patterns:</h5>
                  
                  <div style={styles.exampleBox}>
                    <div style={styles.exampleHeader}>Protractor JS/TS (Example)</div>
                    <pre style={styles.exampleCode}>
{`private \${vn} = \${lc};
async clickOn\${mn}() {
  await this.click(this.\${vn});
}`}
                    </pre>
                    <div style={{ fontSize: '0.8rem', color: '#999', margin: '4px 0' }}>Resolves as:</div>
                    <pre style={styles.exampleResult}>
{`private loginBtn = element(by.id('login'));
async clickOnLoginBtn() {
  await this.click(this.loginBtn);
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#181a1b',
    minHeight: '100vh',
    padding: '20px 0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  },
  hero: {
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #4d3df7 0%, #1e12a4 100%)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '30px 40px'
  },
  card: {
    backgroundColor: '#202224',
    border: '1px solid #303438',
    borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    padding: '16px'
  },
  select: {
    backgroundColor: '#2b2e31',
    color: '#fff',
    border: '1px solid #484c51',
    borderRadius: '4px',
    padding: '8px 12px'
  },
  previewBox: {
    marginTop: '16px',
    backgroundColor: '#181a1b',
    border: '1px solid #2b2e31',
    borderRadius: '6px',
    padding: '12px'
  },
  code: {
    margin: 0,
    backgroundColor: 'transparent',
    color: '#39db80',
    fontFamily: '"Oxygen Mono", monospace',
    fontSize: '0.9rem'
  },
  textarea: {
    backgroundColor: '#2b2e31',
    color: '#fff',
    border: '1px solid #484c51',
    fontFamily: '"Oxygen Mono", monospace',
    fontSize: '0.85rem',
    width: '100%'
  },
  radioGroup: {
    display: 'flex',
    margin: '10px 0'
  },
  btnSave: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    border: 'none',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
    cursor: 'pointer',
    color: '#fff',
    fontWeight: 'bold',
    width: '100%',
    padding: '10px'
  },
  tokenContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    margin: '16px 0'
  },
  chip: {
    backgroundColor: '#2b2e31',
    color: '#ddd',
    border: '1px solid #3d4145',
    padding: '6px 12px',
    borderRadius: '20px',
    alignSelf: 'flex-start'
  },
  exampleBox: {
    border: '1px solid #303438',
    borderRadius: '6px',
    padding: '12px',
    backgroundColor: '#181a1b',
    marginTop: '12px'
  },
  exampleHeader: {
    fontSize: '0.8rem',
    fontWeight: 'bold',
    color: '#8b8efc',
    marginBottom: '6px'
  },
  exampleCode: {
    backgroundColor: 'transparent',
    color: '#e5c07b',
    margin: 0,
    fontSize: '0.8rem'
  },
  exampleResult: {
    backgroundColor: 'transparent',
    color: '#98c379',
    margin: 0,
    fontSize: '0.8rem'
  },
  toast: {
    position: 'fixed' as const,
    top: '20px',
    right: '20px',
    zIndex: 9999,
    padding: '12px 24px',
    borderRadius: '6px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    border: '1px solid #10b981',
    background: '#10b981',
    color: '#fff',
    animation: 'slideIn 0.3s ease-out'
  }
};

export default OptionApp;
