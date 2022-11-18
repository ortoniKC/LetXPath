// Get method and varibale name from an element
function getMethodOrVarText(element) {
    let ele = element.nodeName;
    switch (ele) {
        case "INPUT":
            switch (element.type) {
                case 'file':
                    if (element.name.length > 1) {
                        return element.name;
                    }
                    return getParentTextForVariable(element);
                case 'email':
                    if (element.name.length > 1) {
                        return element.name;
                    }
                    return getParentTextForVariable(element);
                case 'image':
                    if (element.alt.length > 1) {
                        return element.alt;
                    }
                    if (element.name.length > 1) {
                        return element.name;
                    }
                case 'IMG':
                    if (element.alt.length > 1) {
                        return element.alt;
                    }
                    if (element.name.length > 1) {
                        return element.name;
                    }
                case 'search':
                    if (element.placeholder.length > 1) {
                        return element.placeholder;
                    }
                    if (element.title.length > 1) {
                        return element.title;
                    }
                    if (element.name.length > 1) {
                        return element.name;
                    }
                    return element.textContent.trim();
                case 'value':
                    if (element.placeholder.length > 1) {
                        return element.placeholder;
                    }
                    if (element.title.length > 1) {
                        return element.title;
                    }
                    if (element.name.length > 1) {
                        return element.name;
                    }
                    return element.textContent.trim();
                case 'text':
                    if (element.placeholder.length > 1) {
                        return element.placeholder;
                    }
                    if (element.title.length > 1) {
                        return element.title;
                    }
                    if (element.name.length > 1) {
                        return element.name;
                    }
                    return getParentTextForVariable(element);
                case 'button':
                    if (element.textContent.length > 1) {
                        return element.textContent.trim();
                    }
                    if (element.value.length > 1) {
                        return element.value;
                    }
                    if (element.name.length > 1) {
                        return element.name;
                    }
                case 'submit':
                    if (element.value.length > 1) {
                        return element.value;
                    }
                    if (element.name.length > 1) {
                        return element.name;
                    }
                case 'password':
                    if (element.name.length > 1) {
                        return element.name;
                    }
                    else
                        return element.type;
                default:
                    return getParentTextForVariable(element);
            }
        case "BUTTON":
            if (element.textContent.length > 1) {
                return element.textContent;
            }
            if (element.value.length > 1) {
                return element.value;
            }
            if (element.name.length > 1) {
                return element.name;
            }
            if (element.hasAttribute('aria-label')) {
                return element.attributes.getNamedItem('aria-label').value;
            }
            if (element.hasAttribute('data-original-title')) {
                return element.attributes.getNamedItem('data-original-title').value;
            }
            return element.textContent.trim();
        case "A":
            if (element.title.length > 1) {
                return element.title;
            }
            return element.textContent.trim();
        case "IMG":
            if (element.alt.length > 1) {
                return element.alt;
            }
            if (element.name.length > 1) {
                return element.name;
            }
            return getParentTextForVariable(element);
        case "SELECT":
            if (element.name.length > 1) {
                return element.name;
            }
            return getParentTextForVariable(element);
        default:
            let text = element.textContent.trim();
            if (text.length >= 2) {
                return text;
            }
            if (element.hasAttribute('name') && element.name.length > 1) {
                return element.name;
            }
            if (element.hasAttribute('title') && element.title.length > 1) {
                return element.title;
            }
            else {
                return getParentTextForVariable(element);
            }
    }
}
// if element doesn't have text go and find from parent
function getParentTextForVariable(element) {
    try {
        let i, j;
        let ep = element.parentNode;
        var child;
        var setBool;
        if (element.previousElementSibling) {
            ep = element.previousElementSibling.textContent.length >= 2 ? element.previousElementSibling : ep;
        }
        else if (ep != null) {
            do {
                child = ep.children;
                setBool = false;
                for (i = 0; i < child.length; i++) {
                    let innerChildLen = child[i].children.length;
                    if (innerChildLen >= 1) {
                        for (j = 0; j < innerChildLen; j++) {
                            if (child[i].children[j].textContent.length > 1 && (child[0].children[0].tagName != 'OPTION')) {
                                ep = child[i].children[j];
                                setBool = true;
                                break;
                            }
                        }
                        if (setBool) break;
                    } else {
                        if (child[i].textContent.length > 1 && (child[0].tagName != 'OPTION')) {
                            ep = child[i];
                            setBool = true;
                            break;
                        }
                    }
                    if (setBool) break;
                }
                ep = ep.parentNode;
            } while (!setBool);
        }
        return ep.textContent.trim();
    } catch (e) {
        
    }
}
// sepearting varibale and method Name
function getVariableAndMethodName(str) {
    let split = str.trim().split(' ');
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
    else if (split.length == 1) {
        let fc = split[0].charAt(0).toLocaleUpperCase();
        fc += split[0].substring(1, split[0].length);
        temp = fc;
    }
    methodName = temp.replace(/\W/g, '').replace(/\d/g, '').replace(/[&\/\\#,+()$~%.'":*?<>{}_-]/g, '');
    variableName = methodName.charAt(0).toLocaleLowerCase();
    variableName += methodName.substring(1, methodName.length);
}