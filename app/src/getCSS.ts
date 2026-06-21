import { state } from './state';
import { filterAttributesFromElement } from './utils';

export const checkforInt = (id: string): boolean => {
    return new RegExp('\\d{2,}', 'g').test(id);
};

export function getLongCssPath(ele: HTMLElement): string {
    const cssPath: string[] = [];
    let current: HTMLElement | null = ele;
    while (current && current.nodeType === 1) {
        let tag = current.tagName.toLowerCase();
        const id = current.id;
        if (id && !checkforInt(id)) {
            tag += `#${current.id}`;
            cssPath.unshift(tag);
            break;
        } else {
            let prevSib: Element | null = current;
            let position = 1;
            while (prevSib && (prevSib = prevSib.previousElementSibling)) {
                if (prevSib.tagName.toLowerCase() == tag) position++;
            }
            if (position != 1) tag += `:nth-of-type(${position})`;
        }
        cssPath.unshift(tag);
        current = current.parentNode as HTMLElement | null;
    }
    return cssPath.join(">");
}

export function getClassCSS(ele: HTMLElement): void {
    let clickedItemClass = ele.className;
    if (typeof clickedItemClass !== 'string') {
        if (clickedItemClass && typeof (clickedItemClass as any).animVal === 'string') {
            clickedItemClass = (clickedItemClass as any).animVal;
        } else {
            return;
        }
    }
    let clscss = clickedItemClass.replace(/ /g, '.').replace(/\.\.+/g, '.');
    const spl = clscss.split('.');
    if (!(spl.length > 3)) {
        clscss = `${ele.tagName.toLowerCase()}.${clscss}`;
        try {
            if (ele.ownerDocument.querySelectorAll(clscss).length == 1) {
                state.CSSPATHDATA.push([3, 'Unique class', clscss]);
            }
        } catch (e) {}
    }
}

export function getCSS(element: HTMLElement, tagName: string): void {
    state.CSSPATHDATA = [];
    Array.prototype.slice.call(element.attributes).forEach(function (item: Attr) {
        if (!filterAttributesFromElement(item)) {
            switch (item.name) {
                case 'id':
                    const id = `${tagName}#${item.value}`;
                    state.CSSPATHDATA.push([0, 'Css', id]);
                    break;
                case 'class':
                    const classN = `${tagName}.${item.value}`;
                    state.CSSPATHDATA.push([0, 'Css', classN]);
                    break;
                default:
                    const attribuitesBased = `${tagName}[${item.name}='${item.value}']`;
                    state.CSSPATHDATA.push([0, 'Css', attribuitesBased]);
                    break;
            }
        }
    });
}

export function extractElefromNode(ele: HTMLElement, array: string[]): number | null {
    if (ele.hasAttribute('id')) {
        if (state.elementOwnerDocument.querySelectorAll(`[id='${ele.id}']`).length == 1) {
            return array.unshift(`//${ele.tagName.toLowerCase()}[@id='${ele.id}']`);
        }
    } else if (ele.hasAttribute('name')) {
        const nameAttr = ele.getAttribute('name');
        if (nameAttr && state.elementOwnerDocument.querySelectorAll(`[name='${nameAttr}']`).length == 1) {
            return array.unshift(`//${ele.tagName.toLowerCase()}[@name='${nameAttr}']`);
        }
    }
    return null;
}

export function getXPathWithPosition(ele: HTMLElement): string {
    const rowsPath: string[] = [];
    let current: HTMLElement | null = ele;
    while (current && current.nodeType === 1) {
        let tag = current.tagName.toLowerCase();
        if (extractElefromNode(current, rowsPath) != null) {
            break;
        } else {
            let prevSib: Element | null = current;
            let position = 1;
            while (prevSib && (prevSib = prevSib.previousElementSibling) && position < 5) {
                if (prevSib.tagName.toLowerCase() == tag) position++;
            }
            tag += `[${position}]`;
        }
        rowsPath.unshift(tag);
        current = current.parentNode as HTMLElement | null;
    }
    return rowsPath.join('/');
}