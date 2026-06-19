import { state } from './state';
import { getTextBasedXPath } from './textXPath';
import { evaluateXPathExpression, getNumberOfXPath, addIndexToXpath } from './utils';

export function findLabel(element: HTMLElement, tagName: string): void {
    let label: string | undefined = undefined;
    let span: string | undefined = undefined;
    let ele = `//*[@letxxpath='letX']`;
    try {
        label = getLabelText(ele, tagName);
    } catch (error) { }
    try {
        span = getSpanText(ele, tagName);
    } catch (error) { }
    try {
        if (label === undefined && span === undefined) {
            let xp = getParentText(element, tagName);
            if (xp) {
                let temp = xp;
                let evaluated = evaluateXPathExpression(xp);
                if (evaluated && evaluated.singleNodeValue && (evaluated.singleNodeValue as HTMLElement).attributes.getNamedItem('letxxpath') != null) {
                    state.XPATHDATA.push([6, 'Text based following XPath', temp]);
                } else {
                    let indexed = addIndexToXpath(temp);
                    if (indexed != null) {
                        state.XPATHDATA.push([6, 'Text based following XPath', indexed]);
                    }
                }
            }
        }
    } catch (error) { }
}

export function getParentText(element: HTMLElement, tagName: string): string | null {
    let ep = element.parentNode?.parentNode as HTMLElement | null;
    if (!ep) return null;
    let child = ep.children;
    let tagN: string | null = null;
    let setBool = false;
    for (let i = 0; i < child.length; i++) {
        let innerChildLen = child[i].children.length;
        for (let j = 0; j < innerChildLen; j++) {
            const innerChild = child[i].children[j] as HTMLElement;
            if (innerChild.textContent && innerChild.textContent.length > 1) {
                ep = innerChild;
                tagN = ep.tagName;
                setBool = true;
                break;
            }
        }
        if (setBool)
            break;
    }
    if (!ep || !tagN) return null;
    let text = getTextBasedXPath(ep, tagN.toLowerCase());
    if (!text) return null;
    let temp = `${text}/following::${tagName}`;
    let count = getNumberOfXPath(temp);
    if (count == 1) {
        let xp = `${text}/following::${tagName}[1]`;
        return xp;
    } else if (count !== undefined && count > 1) {
        let xp = `${text}/following::${tagName}`;
        let indexed = addIndexToXpath(xp);
        return indexed || xp;
    } else
        return null;
}

export function getLabelText(ele: string, tagName: string): string | undefined {
    let labelNode = `${ele}/preceding::label[1]`;
    let checkLabelType = evaluateXPathExpression(labelNode);
    try {
        if (checkLabelType && checkLabelType.singleNodeValue && typeof (checkLabelType.singleNodeValue.textContent) === 'string') {
            return getLabel(labelNode, tagName);
        } else {
            throw new Error('no label preceding');
        }
    } catch (error) { }
}

export function getSpanText(ele: string, tagName: string): string | undefined {
    let spanNode = `${ele}/preceding::span[1]`;
    let checkSpanType = evaluateXPathExpression(spanNode);
    try {
        if (checkSpanType && checkSpanType.singleNodeValue && typeof (checkSpanType.singleNodeValue.textContent) === 'string') {
            return getLabel(spanNode, tagName);
        } else {
            throw new Error('no span text');
        }
    } catch (error) { }
}

export function getLabel(node: string, tagName: string): string | undefined {
    let c = getNumberOfXPath(node);
    if (c !== undefined && c > 0) {
        let label = evaluateXPathExpression(node);
        let newEle = label?.singleNodeValue as HTMLElement | null;
        if (newEle) {
            let labelTag = newEle.tagName.toLowerCase();
            let labelText = getTextBasedXPath(newEle, labelTag);
            if (labelText) {
                let newLabelXpath = labelText + '/' + 'following::' + tagName;
                if (getNumberOfXPath(newLabelXpath) == 1) {
                    let newLabel = evaluateXPathExpression(newLabelXpath);
                    if (newLabel && newLabel.singleNodeValue && (newLabel.singleNodeValue as HTMLElement).attributes.getNamedItem('letxxpath') != null) {
                        state.XPATHDATA.push([6, 'Text based following XPath', newLabelXpath]);
                        return newLabelXpath;
                    }
                } else {
                    let labelTextWithIndex = addIndexToXpath(newLabelXpath);
                    if (labelTextWithIndex) {
                        let newLabel = evaluateXPathExpression(labelTextWithIndex);
                        if (newLabel && newLabel.singleNodeValue && (newLabel.singleNodeValue as HTMLElement).attributes.getNamedItem('letxxpath') != null) {
                            state.XPATHDATA.push([6, 'Text based following XPath', labelTextWithIndex]);
                            return labelTextWithIndex;
                        }
                    }
                }
            }
        }
    }
}
