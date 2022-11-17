/**
 * @author Koushik Chatterjee <koushik350@gmail.com>
 * @param {*} element 
 * @param {*} tagName 
 * @description get all the parent elements attribues, to write more precise xpath 
 */

// To get Id based xpath
function getParentId(element, tagName) {
    let clicketItemId = element.id;
    let re = new RegExp('\\d{' + maxId + ',}', '\g');
    let matches = re.test(clicketItemId);
    if ((clicketItemId != null) && (clicketItemId.length > 0) && matches == false) {
        let temp = `//${tagName}[@id='${clicketItemId}']`;
        return temp;
    } else
        return null;

}
function getParentName(element, tagName) {
    let clickedItemName = element.name;
    let matches = clickedItemName.match(/\d{3,}/g);
    if (!((clickedItemName === "") || (clickedItemName === undefined))) {
        let tempName = `//${tagName}[@name='${clickedItemName}']`
        return tempName;
    } else
        return null;
}
function getParentClassName(element, tagName) {
    let clickedItemClass = element.className;
    let splitClass = clickedItemClass.trim().split(" ");
    if (splitClass.length > 2) {
        let cl = `${splitClass[0]} ${splitClass[1]}`;
        let temp = `//${tagName}[contains(@class,'${cl}')]`;
        return temp;
    } else if (!((clickedItemClass === "") || (clickedItemClass === undefined))) {
        let tempClass = `//${tagName}[@class='${clickedItemClass}']`
        return tempClass;
    } else
        return null;
}
// Add preceding element
function addPreviousSibling(preSib, tagName) {
    try {
        let classHasSpace = false;
        let temp;
        let previousSiblingTagName = preSib.tagName.toLowerCase();
        if (previousSiblingTagName != "script") {
            Array.prototype.slice.call(preSib.attributes).forEach(function (item) {
                if (!(filterAttributesFromElement(item))) {
                    let tempvalue = null;
                    switch (item.name) {
                        case 'id':
                            if (preSib.hasAttribute('id')) {
                                let id = preSib.id;
                                let re = new RegExp('\\d{' + maxId + ',}', '\g');
                                let matches = re.test(id);
                                if ((id != null) && (id.length > 0) && matches == false) {
                                    tempvalue = id;
                                }
                            }
                            break;
                        case 'class':
                            if (preSib.hasAttribute('class')) {
                                tempvalue = preSib.className;
                                let splClass = tempvalue.trim().split(" ");
                                if (splClass.length > 2) {
                                    tempvalue = `contains(@class,'${splClass[0]} ${splClass[1]}')`;
                                    classHasSpace = true;
                                }
                            }
                            break;
                        case 'name':
                            if (preSib.hasAttribute('name')) {
                                tempvalue = preSib.name;
                            }
                            break;
                        default:
                            tempvalue = item.value;
                    }
                    if (tempvalue == '') {
                        tempvalue = null;
                    }
                    if (classHasSpace) {
                        temp = `//${previousSiblingTagName}[${tempvalue}]/following-sibling::${tagName}[1]`
                        if (temp.startsWith('//')) {
                            if (getNumberOfXPath(temp) == 1 && evaluateXPathExpression(temp).singleNodeValue.attributes.letxxpath != undefined) {
                                XPATHDATA.push([8, 'Following sibling XPath', temp]);
                            } else {
                                let t = addIndexToXpath(`//${previousSiblingTagName}[${tempvalue}]/following-sibling::${tagName}`)
                                if (t != undefined) {
                                    XPATHDATA.push([8, 'Following sibling XPath', t])
                                } else
                                    temp = null;
                            }
                        }

                    } else if (tempvalue != null) {
                        temp = `//${previousSiblingTagName}[@${item.name}='${tempvalue}']/following-sibling::${tagName}[1]`
                        if (temp.startsWith('//')) {
                            if (getNumberOfXPath(temp) == 1 && evaluateXPathExpression(temp).singleNodeValue.attributes.letxxpath != undefined) {
                                XPATHDATA.push([8, 'Following sibling XPath', temp]);
                            } else {
                                let t = addIndexToXpath(`//${previousSiblingTagName}[@${item.name}='${tempvalue}']/following-sibling::${tagName}`)
                                if (t != undefined) {
                                    XPATHDATA.push([8, 'Following sibling XPath', t])
                                } else
                                    temp = null;
                            }
                        }
                    }
                }
            });
            if (temp == null || (preSib.innerText.length > 1)) {
                let temp1;
                let labelText;
                let tag;
                let bo = false;
                let child = preSib.parentNode.children;
                for (let i in child) {
                    let text = child[i].textContent;
                    if (text != '') {
                        labelText = text;
                        tag = child[i].tagName.toLowerCase()
                        break;
                    }
                }
                if (labelText.match(/[\r\n\x0B\x0C\u0085\u2028\u2029]+/g)) {
                    labelText = labelText.replace(/[\r\n\x0B\x0C\u0085\u2028\u2029]+/g, " ")
                    bo = true;
                }
                if (bo && labelText.trim().length > 1) {
                    temp1 = `//${tag}[text()[normalize-space()='${labelText.trim()}']]/following-sibling::${tagName}[1]`;
                } else {
                    temp1 = `//${tag}[text()='${labelText}']/following-sibling::${tagName}[1]`;
                }
                let c = getNumberOfXPath(temp1)
                temp1 = `//${tag}[text()='${labelText}']/following-sibling::${tagName}`;
                if (c == 0) {
                    return null
                }
                if (c == 1 && evaluateXPathExpression(temp1).singleNodeValue.attributes.letxxpath != undefined) {
                    XPATHDATA.push([8, 'Following sibling XPath', temp1])
                } else if ((c != undefined) || (c != null)) {
                    xp = addIndexToXpath(temp1)
                    if (xp != undefined) {
                        XPATHDATA.push([8, 'Following sibling XPath', xp])
                    }
                }
            }
        }
    } catch (error) { }
}
// get parent based XPath
function getParent(element, tagName) {
    let parent = element.parentNode;
    let bo = false;
    bo = checkIDNameClassHref(parent, bo);
    while (bo == false) {
        parent = parent.parentNode;
        bo = checkIDNameClassHref(parent, bo);
    }
    let attributeElement = parent.attributes;
    let tag = parent.tagName.toLowerCase();
    let parentId = null;
    let parentClass = null;
    let parentName = null;
    let others = null;
    Array.prototype.slice.call(attributeElement).forEach(function (item) {
        if (!(filterAttributesFromElement(item))) {
            switch (item.name) {
                case "id":
                    parentId = getParentId(parent, tag)
                    break;
                case "class":
                    parentClass = getParentClassName(parent, tag)
                    break;
                case "name":
                    parentName = getParentName(parent, tag)
                    break;
                default:
                    let temp = item.value;
                    if (temp != '') {
                        others = `//${tag}[@${item.name}='${temp}']`
                    }
                    break;
            }
        }
    });
    if (parentId != null && parentId != undefined) {
        getParentXp(parentId, tagName, 'id', element);
    }
    if (parentClass != null && parentClass != undefined) {
        getParentXp(parentClass, tagName, 'class', element);
    }
    if (parentName != null && parentName != undefined) {
        getParentXp(parentName, tagName, 'name', element);
    }
    if (others != null && others != undefined) {
        getParentXp(others, tagName, 'attribute', element);
    }
    function getParentXp(parent, tagName, locator, element) {
        let tem = `${parent}//${tagName}[1]`;
        let checkTem = evaluateXPathExpression(tem)
        let c = getNumberOfXPath(tem);
        if (c == 0) {
            return null;
        }
        if (c == 1) {
            try {
                if (checkTem.singleNodeValue.hasAttribute('letxxpath')) {
                    XPATHDATA.push([9, `Parent ${locator} XPath`, tem]);

                } else {
                    tem = `${parent}//${tagName}`;
                    c = getNumberOfXPath(tem);
                    if (c == 0) {
                        return null;
                    }
                    if (c >= 1) {
                        try {
                            let te = addIndexToXpath(tem)
                            checkTem = evaluateXPathExpression(te)
                            if (checkTem.singleNodeValue.attributes.letxxpath.value === "letX") {
                                XPATHDATA.push([9, `Parent ${locator} XPath`, te]);
                            }
                        } catch (e) {

                        }
                    }
                }
            } catch (e) {

            }
        } else if (c > 1) {
            tem = `${parent}//${tagName}`;
            let t = addIndexToXpath(tem);
            if (t != undefined && t != null) {
                XPATHDATA.push([9, `Parent ${locator} XPath`, t]);
            }
        }
    }
}
function checkIDNameClassHref(parent, bo) {
    Array.prototype.slice.call(parent.attributes).forEach(function (item) {
        if (item.name === 'id' || item.name === 'class' || item.name === 'name')
            bo = true;
    });
    return bo;
}