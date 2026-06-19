import { state } from './state';

export function filterAttributesFromElement(item: Attr): boolean {
    return (item.name === "letaxes") || (item.name === 'letxxpath') || (item.name === "script") ||
        (item.name === 'jsname') || (item.name === 'jsmodel') || (item.name === 'jsdata') ||
        (item.name === 'jscontroller') || (item.name === 'face') || (item.name.includes('pattern')) ||
        (item.name.includes('length')) || (item.name === 'border') || (item.name === 'formnovalidate') ||
        (item.name === 'required-field') || (item.name === 'ng-click') || (item.name === 'tabindex') ||
        (item.name === 'required') || (item.name === 'strtindx') ||
        ((item.name === 'title') && (item.value === '')) || (item.name === 'autofocus') ||
        (item.name === 'tabindex') || ((item.name === 'type') && (item.value === 'text')) ||
        (item.name === 'ac_columns') ||
        (item.name === 'ac_order_by') || (item.name.startsWith('data-ember')) ||
        (item.name === 'href') || (item.name === 'aria-autocomplete') ||
        (item.name === 'autocapitalize') || (item.name === 'jsaction') || (item.name === 'autocorrect') ||
        (item.name === 'aria-haspopup') || (item.name === 'style') || (item.name === 'size') ||
        (item.name === 'height') || (item.name === 'width') || (item.name.startsWith('on')) ||
        (item.name === 'autocomplete') || (item.name === 'value' && item.value.length <= 2) ||
        (item.name === 'ng-model-options') ||
        (item.name === 'ng-model-update-on-enter') || (item.name === 'magellan-navigation-filter') ||
        (item.name === 'ng-blur') || (item.name === 'ng-focus') || (item.name === 'ng-trim') ||
        (item.name === 'spellcheck') || (item.name === 'target') || (item.name === 'rel') ||
        (item.name === 'maxlength') || (item.name === 'routerlinkactive') || (item.name === 'src') ||
        (item.name === 'xpath') || (item.name === 'xpathtest') || (item.name === 'css');
}

export function addIndexToXpath(allXpathAttr: string): string | null | undefined {
    try {
        let index = 0;
        let doc = state.elementOwnerDocument.evaluate(allXpathAttr, state.elementOwnerDocument, null, XPathResult.ANY_TYPE, null);
        let next = doc.iterateNext() as HTMLElement | null;
        try {
            while (next && index <= state.maxIndex) {
                index++;
                if (next.attributes.getNamedItem('letxxpath') != null) {
                    throw new Error('break');
                }
                next = doc.iterateNext() as HTMLElement | null;
            }
        } catch (error) { }
        let indexedXpath = `(${allXpathAttr})[${index}]`;
        if (index <= state.maxIndex) {
            let c = getNumberOfXPath(indexedXpath);
            if (c !== undefined && c > 0) {
                return indexedXpath;
            }
        } else {
            return null;
        }
    } catch (error) { }
}

export function addIndexToAxesXpath(allXpathAttr: string): string | null | undefined {
    try {
        let index = 0;
        let doc = state.elementOwnerDocument.evaluate(allXpathAttr, state.elementOwnerDocument, null, XPathResult.ANY_TYPE, null);
        let next = doc.iterateNext() as HTMLElement | null;
        try {
            while (next && index <= state.maxIndex) {
                index++;
                if (next.attributes.getNamedItem('letaxes') != null) {
                    throw new Error('break');
                }
                next = doc.iterateNext() as HTMLElement | null;
            }
        } catch (error) { }
        let indexedXpath = `(${allXpathAttr})[${index}]`;
        if (index <= state.maxIndex) {
            let c = getNumberOfXPath(indexedXpath);
            if (c !== undefined && c > 0) {
                return indexedXpath;
            }
        } else {
            return null;
        }
    } catch (error) { }
}

export function getNumberOfXPath(element: string): number | undefined {
    try {
        return state.elementOwnerDocument.evaluate('count(' + element + ')', state.elementOwnerDocument, null, XPathResult.ANY_TYPE, null).numberValue;
    } catch (error) { }
}

export function evaluateXPathExpression(element: string): XPathResult | undefined {
    try {
        return state.elementOwnerDocument.evaluate(element, state.elementOwnerDocument, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    } catch (error) { }
}

export function removeletxxpath(element: HTMLElement): void {
    element.removeAttribute('letxxpath');
}

export function frameXPath(hasFrame: HTMLIFrameElement): string | undefined {
    if (hasFrame != undefined) {
        let id: string | undefined, src: string | undefined, name: string | undefined;
        let attr = hasFrame.attributes;
        for (let i = 0; i < attr.length; i++) {
            switch (attr[i].name) {
                case "id":
                    id = attr.getNamedItem('id')?.nodeValue || undefined;
                    break;
                case "name":
                    name = attr.getNamedItem('name')?.nodeValue || undefined;
                    break;
                case "src":
                    src = attr.getNamedItem('src')?.nodeValue || undefined;
                    break;
                default:
                    break;
            }
        }
        let frametag = hasFrame.tagName.toLowerCase();
        if (id != undefined) {
            return `//${frametag}[@id='${id}']`;
        }
        else if (name != undefined) {
            return `//${frametag}[@name='${name}']`;
        }
        else if (src != undefined) {
            return `//${frametag}[@src='${src}']`;
        }
    }
}

export function addHighlighter(result: XPathResult): void {
    try {
        for (let i = 0; i < result.snapshotLength; i++) {
            const node = result.snapshotItem(i) as HTMLElement;
            if (node) node.setAttribute("letcss", "1");
        }
    } catch (error) { }
}

export function clearHighlighter(result: XPathResult): void {
    try {
        for (let i = 0; i < result.snapshotLength; i++) {
            const node = result.snapshotItem(i) as HTMLElement;
            if (node) node.removeAttribute("letcss");
        }
    } catch (error) { }
}

export function checkIDNameClassHref(parent: HTMLElement, bo: boolean): boolean {
    if (parent && parent.attributes) {
        Array.prototype.slice.call(parent.attributes).forEach(function (item: Attr) {
            if (item.name === 'id' || item.name === 'class' || item.name === 'name')
                bo = true;
        });
    }
    return bo;
}