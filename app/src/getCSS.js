// CSS
/**
 * checkl if ID has numbers
 * if numbers are more than 2 don't consider value
 */
checkforInt = (id) => {
    return new RegExp('\\d{2,}', '\g').test(id);
}
// TODO: need to improvement
function getLongCssPath(ele) {
    var cssPath = [];
    while (ele.nodeType === 1) {
        let tag = ele.tagName.toLowerCase();
        let id = ele.id;
        if (id && !checkforInt(id)) {
            tag += `#${ele.id}`;
            cssPath.unshift(tag);
            break;
        } else {
            let prevSib = ele, position = 1;
            while (prevSib = prevSib.previousElementSibling) {
                if (prevSib.tagName.toLowerCase() == tag) position++;
            }
            if (position != 1) tag += `:nth-of-type(${position})`
        }
        cssPath.unshift(tag);
        ele = ele.parentNode
    }
    return cssPath.join(">");
}

function getClassCSS(ele) {
    let clscss = (ele.className).replace(/ /g, '.').replace(/\.\.+/g, '.');
    let spl = clscss.split('.');
    if (!(spl.length > 3)) {
        clscss = `${ele.tagName.toLowerCase()}.${clscss}`
        ele.ownerDocument.querySelectorAll(clscss).length == 1 ? CSSPATHDATA.push([3, 'Unique class', clscss]) : '';
    }

}

// css locators -- basics--
function getCSS(element, tagName) {
    CSSPATHDATA = [];
    Array.prototype.slice.call(element.attributes).forEach(function (item) {
        if (!filterAttributesFromElement(item)) {
            switch (item.name) {
                case 'id':
                    let id = `${tagName}#${item.value}`
                    CSSPATHDATA.push([0, 'Css', id])
                    break;
                case 'class':
                    let classN = `${tagName}.${item.value}`;
                    CSSPATHDATA.push([0, 'Css', classN])
                    break;
                default:
                    let attribuitesBased = `${tagName}[${item.name}='${item.value}']`
                    CSSPATHDATA.push([0, 'Css', attribuitesBased])
                    break;
            }
        }
    });
}

function extractElefromNode(ele, array) {
    if (ele.hasAttribute('id')) {
        if (elementOwnerDocument.querySelectorAll(`[id='${ele.id}']`).length == 1)
            return array.unshift(`//${ele.tagName.toLowerCase()}[@id='${ele.id}']`);
    } else if (ele.hasAttribute('name')) {
        if (elementOwnerDocument.querySelectorAll(`[name='${ele.name}']`).length == 1)
            return array.unshift(`//${ele.tagName.toLowerCase()}[@name='${ele.name}']`);
    }
    return null;
}
// if no xpath found it will be used, might be like absolute, but user must get atlelast 1 xpath for sure
// TODO: needs improvement
function getXPathWithPosition(ele) {
    let rowsPath = [];
    while (ele.nodeType === 1) {
        let tag = ele.tagName.toLowerCase();
        if (extractElefromNode(ele, rowsPath) != null) {
            break;
        } else {
            let prevSib = ele, position = 1;
            while (prevSib = prevSib.previousElementSibling && position < 5) {
                if (prevSib.tagName.toLowerCase() == tag) position++;
            }
            tag += `[${position}]`
        }
        rowsPath.unshift(tag);
        ele = ele.parentNode
    }
    return rowsPath.join('/');
}