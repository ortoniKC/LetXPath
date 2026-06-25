export interface WebTableDetails {
  totalTables: number;
  tableLocator: string;
  tableData: string;
}

export interface SelectedElement {
  xpathid: [number, string, string][];
  cssPath: [number, string, string][];
  tag: string;
  type: string;
  variablename?: string;
  methodname?: string;
  webtabledetails?: WebTableDetails | null;
  attributes?: Record<string, string>;
  text?: string;
  labelText?: string;
  playwrightLocators?: [number, string, string, string, string, string][];
  cypressLocators?: [number, string, string][];
}

export interface AxesData {
  src: [number, string, string][];
  dst: [number, string, string][];
  proOrFol: string;
  defaultXPath: string;
}

export interface ChromeStorageResult {
  langID?: string;
  customLang?: "jscs" | "javacs";
  clickvalue?: string;
  sendvalue?: string;
  textvalue?: string;
  attrvalue?: string;
  emailProvider?: string;
  mailosaurApiKey?: string;
  mailosaurServerId?: string;
}

export interface DevToolsMessageRequest {
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
  attributes?: Record<string, string>;
  text?: string;
  labelText?: string;
  playwrightLocators?: [number, string, string, string, string, string][];
  cypressLocators?: [number, string, string][];
  step?: any;
}

export interface TemplateGroup {
  click: string;
  send: string;
  text: string;
  attr: string;
}
