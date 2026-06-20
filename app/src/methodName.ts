import { state } from './state';

export function getMethodOrVarText(element: HTMLElement): string {
    const ele = element.nodeName;
    switch (ele) {
        case "INPUT":
            const inputElement = element as HTMLInputElement;
            switch (inputElement.type) {
                case 'file':
                    if (inputElement.name.length > 1) {
                        return inputElement.name;
                    }
                    return getParentTextForVariable(element);
                case 'email':
                    if (inputElement.name.length > 1) {
                        return inputElement.name;
                    }
                    return getParentTextForVariable(element);
                case 'image':
                    if (inputElement.alt.length > 1) {
                        return inputElement.alt;
                    }
                    if (inputElement.name.length > 1) {
                        return inputElement.name;
                    }
                    if (inputElement.placeholder.length > 1) {
                        return inputElement.placeholder;
                    }
                    if (inputElement.title.length > 1) {
                        return inputElement.title;
                    }
                    return inputElement.textContent?.trim() || '';
                case 'IMG':
                    const imgInInput = element as unknown as HTMLImageElement;
                    if (imgInInput.alt.length > 1) {
                        return imgInInput.alt;
                    }
                    if (imgInInput.name.length > 1) {
                        return imgInInput.name;
                    }
                    if (inputElement.placeholder.length > 1) {
                        return inputElement.placeholder;
                    }
                    if (inputElement.title.length > 1) {
                        return inputElement.title;
                    }
                    return inputElement.textContent?.trim() || '';
                case 'search':
                    if (inputElement.placeholder.length > 1) {
                        return inputElement.placeholder;
                    }
                    if (inputElement.title.length > 1) {
                        return inputElement.title;
                    }
                    if (inputElement.name.length > 1) {
                        return inputElement.name;
                    }
                    return inputElement.textContent?.trim() || '';
                case 'value':
                    if (inputElement.placeholder.length > 1) {
                        return inputElement.placeholder;
                    }
                    if (inputElement.title.length > 1) {
                        return inputElement.title;
                    }
                    if (inputElement.name.length > 1) {
                        return inputElement.name;
                    }
                    return inputElement.textContent?.trim() || '';
                case 'text':
                    if (inputElement.placeholder.length > 1) {
                        return inputElement.placeholder;
                    }
                    if (inputElement.title.length > 1) {
                        return inputElement.title;
                    }
                    if (inputElement.name.length > 1) {
                        return inputElement.name;
                    }
                    return getParentTextForVariable(element);
                case 'button':
                    if (inputElement.textContent && inputElement.textContent.length > 1) {
                        return inputElement.textContent.trim();
                    }
                    if (inputElement.value.length > 1) {
                        return inputElement.value;
                    }
                    if (inputElement.name.length > 1) {
                        return inputElement.name;
                    }
                    return inputElement.type;
                case 'submit':
                    if (inputElement.value.length > 1) {
                        return inputElement.value;
                    }
                    if (inputElement.name.length > 1) {
                        return inputElement.name;
                    }
                    return inputElement.type;
                case 'password':
                    if (inputElement.name.length > 1) {
                        return inputElement.name;
                    }
                    else
                        return inputElement.type;
                default:
                    return getParentTextForVariable(element);
            }
        case "BUTTON":
            const btnElement = element as HTMLButtonElement;
            if (btnElement.textContent && btnElement.textContent.length > 1) {
                return btnElement.textContent;
            }
            if (btnElement.value.length > 1) {
                return btnElement.value;
            }
            if (btnElement.name.length > 1) {
                return btnElement.name;
            }
            const ariaLabel = btnElement.getAttribute('aria-label');
            if (ariaLabel) {
                return ariaLabel;
            }
            const origTitle = btnElement.getAttribute('data-original-title');
            if (origTitle) {
                return origTitle;
            }
            return btnElement.textContent?.trim() || '';
        case "A":
            if (element.title.length > 1) {
                return element.title;
            }
            return element.textContent?.trim() || '';
        case "IMG":
            const imgElement = element as HTMLImageElement;
            if (imgElement.alt.length > 1) {
                return imgElement.alt;
            }
            if (imgElement.name.length > 1) {
                return imgElement.name;
            }
            return getParentTextForVariable(element);
        case "SELECT":
            const selElement = element as HTMLSelectElement;
            if (selElement.name.length > 1) {
                return selElement.name;
            }
            return getParentTextForVariable(element);
        default:
            const text = element.textContent?.trim() || '';
            if (text.length >= 2) {
                return text;
            }
            const nameAttr = element.getAttribute('name');
            if (nameAttr && nameAttr.length > 1) {
                return nameAttr;
            }
            if (element.title.length > 1) {
                return element.title;
            }
            else {
                return getParentTextForVariable(element);
            }
    }
}

export function getParentTextForVariable(element: HTMLElement): string {
    try {
        let i: number, j: number;
        let ep = element.parentNode as HTMLElement | null;
        let child: HTMLCollection;
        let setBool = false;
        if (element.previousElementSibling) {
            ep = (element.previousElementSibling.textContent && element.previousElementSibling.textContent.length >= 2) 
                ? (element.previousElementSibling as HTMLElement) 
                : ep;
        }
        else if (ep != null) {
            do {
                child = ep.children;
                setBool = false;
                for (i = 0; i < child.length; i++) {
                    const childNode = child[i] as HTMLElement;
                    const innerChildLen = childNode.children.length;
                    if (innerChildLen >= 1) {
                        for (j = 0; j < innerChildLen; j++) {
                            const innerChild = childNode.children[j] as HTMLElement;
                            if (innerChild.textContent && innerChild.textContent.length > 1 && (child[0].children[0].tagName != 'OPTION')) {
                                ep = innerChild;
                                setBool = true;
                                break;
                            }
                        }
                        if (setBool) break;
                    } else {
                        if (childNode.textContent && childNode.textContent.length > 1 && (child[0].tagName != 'OPTION')) {
                            ep = childNode;
                            setBool = true;
                            break;
                        }
                    }
                    if (setBool) break;
                }
                if (ep) ep = ep.parentNode as HTMLElement | null;
            } while (ep && !setBool);
        }
        return ep?.textContent?.trim() || '';
    } catch (e) {
        return '';
    }
}

export function getVariableAndMethodName(str: string): void {
    const split = str.trim().split(' ');
    let temp = '';
    let i = 0;
    if (split.length >= 2) {
        do {
            let fc = split[i].charAt(0).toUpperCase();
            fc += split[i].substring(1, split[i].length);
            temp += fc;
            i++;
        } while ((i < split.length) && (i < 3));
    }
    else if (split.length == 1 && split[0]) {
        let fc = split[0].charAt(0).toUpperCase();
        fc += split[0].substring(1, split[0].length);
        temp = fc;
    }
    state.methodName = temp.replace(/\W/g, '').replace(/\d/g, '').replace(/[&\/\\#,+()$~%.'":*?<>{}_-]/g, '');
    if (state.methodName.length > 0) {
        state.variableName = state.methodName.charAt(0).toLowerCase() + state.methodName.substring(1, state.methodName.length);
    } else {
        state.variableName = 'ele';
    }
}