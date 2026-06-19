import { state } from './state';
import { getNumberOfXPath, evaluateXPathExpression, checkIDNameClassHref } from './utils';

export function handleTable(ele: HTMLElement): void {
    let orgEle = ele;
    let no_of_tables = state.elementOwnerDocument.getElementsByTagName('table').length;
    // find if its table is unique
    let table = ele.closest('table') as HTMLElement | null;
    if (!table) return;
    table.setAttribute('letxpath', 'letxpathtable');
    let has = checkIDNameClassHref(table, false);
    if (!has) {
        let parent = table.parentElement;
        while (!has && parent) {
            has = checkIDNameClassHref(parent, false);
            if (!has) parent = parent.parentElement;
        }
    }
    let tag = table.tagName.toLowerCase();
    let tableElementFound = '';
    let count: number | undefined;
    if (table.hasAttribute('id')) {
        tableElementFound = `//${tag}[@id='${table.id}']`;
        count = getNumberOfXPath(tableElementFound);
    }
    else if (table.hasAttribute('class')) {
        let length = table.classList.length;
        if (length > 1) {
            tableElementFound = `//${tag}[contains(@class,'${table.classList[0]} ${table.classList[1]}')]`;
        }
        else {
            tableElementFound = `//${tag}[@class='${table.className}']`;
        }
        count = getNumberOfXPath(tableElementFound);
    }
    else if (table.hasAttribute('name')) {
        const nameAttr = table.getAttribute('name');
        tableElementFound = `//${tag}[@name='${nameAttr}']`;
        count = getNumberOfXPath(tableElementFound);
    }
    let tablePath: string | null = '';
    let ev = evaluateXPathExpression(tableElementFound);
    if (ev && ev.singleNodeValue != null) {
        const node = ev.singleNodeValue as HTMLElement;
        if (node.hasAttribute('letxpath')) {
            tablePath = tableElementFound;
        }
        else {
            tablePath = getTableXpath(tableElementFound);
        }
    }
    if (tablePath) {
        let evTable = evaluateXPathExpression(tablePath);
        let tableNode = evTable?.singleNodeValue as HTMLElement | null;
        if (tableNode) {
            tableNode.removeAttribute('letxpath');
        }
        // find no.of rows
        // get no.of rows in xpath
        let data = getLongTableRow(orgEle, tablePath);
        // pass details
        let details = {
            tableLocator: tablePath,
            totalTables: no_of_tables,
            tableData: data
        };
        state.webTableDetails = details;
    }

    function getTableXpath(locator: string): string | null {
        let tablePath = `${locator}//table`;
        let evaluated = evaluateXPathExpression(tablePath);
        if (evaluated && evaluated.singleNodeValue != null) {
            const node = evaluated.singleNodeValue as HTMLElement;
            if (node.hasAttribute('letxpath'))
                return tablePath;
            else {
                const count = getNumberOfXPath(tablePath);
                if (count !== undefined && count > 1) {
                    return addTableIndexToXpath(tablePath) || null;
                }
            }
        }
        else {
            tablePath = `${locator}/following::table`;
            let evaluated = evaluateXPathExpression(tablePath);
            if (evaluated && evaluated.singleNodeValue != null) {
                const node = evaluated.singleNodeValue as HTMLElement;
                if (node.hasAttribute('letxpath'))
                    return tablePath;
                else {
                    const count = getNumberOfXPath(tablePath);
                    if (count !== undefined && count > 1) {
                        return addTableIndexToXpath(tablePath) || null;
                    }
                }
            }
        }
        return null;
    }
}

export function getLongTableRow(ele: HTMLElement, tablePath: string): string {
    var rowsPath: string[] = [];
    let current: HTMLElement | null = ele;
    while (current && current.nodeType === 1) {
        let tag = current.tagName.toLowerCase();
        if (tag == 'table') {
            rowsPath.unshift(tablePath);
            break;
        } else {
            let prevSib: Element | null = current;
            let position = 1;
            while (prevSib && (prevSib = prevSib.previousElementSibling)) {
                if (prevSib.tagName.toLowerCase() == tag) position++;
            }
            tag += `[${position}]`;
        }
        rowsPath.unshift(tag);
        current = current.parentNode as HTMLElement | null;
    }
    return rowsPath.join("/");
}

export function addTableIndexToXpath(allXpathAttr: string): string | null | undefined {
    try {
        var index = 0;
        let doc = state.elementOwnerDocument.evaluate(allXpathAttr, state.elementOwnerDocument, null, XPathResult.ANY_TYPE, null);
        var next = doc.iterateNext() as HTMLElement | null;
        try {
            while (next) {
                index++;
                if (next.attributes.getNamedItem('letxpath') != null) { throw new Error('break'); }
                next = doc.iterateNext() as HTMLElement | null;
            }
        }
        catch (error) { }
        let indexedXpath = `(${allXpathAttr})[${index}]`;
        let c = getNumberOfXPath(indexedXpath);
        if (c !== undefined && c > 0) { return indexedXpath; } else return null;
    } catch (error) { }
}