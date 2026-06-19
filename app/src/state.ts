export interface WebTableDetails {
  totalTables: number;
  tableLocator: string;
  tableData: string;
}

export const state = {
  elementOwnerDocument: document,
  maxIndex: 3,
  maxId: 3,
  XPATHDATA: [] as [number, string, string][],
  CSSPATHDATA: [] as [number, string, string][],
  atrributesArray: [] as string[],
  webTableDetails: null as WebTableDetails | null,
  targetElemt: null as HTMLElement | null,
  frameXPATH: null as string | null,
  type: null as string | null,
  tag: null as string | null,
  variablename: null as string | null,
  methodName: null as string | null,
  variableName: null as string | null,
  tagArrHolder: [] as string[],
  dupArray: [] as any[],
  setPreOrFol: null as string | null,
  recordArray: [] as any[],
  recordArrayPOM: [] as any[],
  isRecordEnabled: false,
  searchXPathArray: [] as any[],
};
