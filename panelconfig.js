$(document).ready(function () {
    // trying dark mode
    // ------ highlight XPath & Code Snippets -----------
    $('#tab_header li.tab-item').on('click', function () {
        let number = $(this).data('option');
        $('#tab_header li.tab-item').removeClass('active');
        $(this).addClass('active');
        $('#tab_container .container_item').removeClass('active');
        $('div[data-item="' + number + '"]').addClass('active');
    });

    // ------ get selected values
    $("select#selector").change(function () {
        var selectedvalue = $(this).children("option:selected").val();
        let selector = {
            request: "utilsSelector",
            selectedValue: selectedvalue
        }
        devtools_connections.postMessage({ selector, tab: chrome.devtools.inspectedWindow.tabId });
    });
    // --- snippet changer
    $('body').on('change', '#snippetsSelector', (changed) => {
        let type = changed.target.selectedOptions[0].value;
        let codeType = changed.target.selectedOptions[0].attributes.ct.value;
        let codeValue = changed.target.selectedOptions[0].attributes.cv.value;
        let vn = changed.target.selectedOptions[0].attributes.vn.value;
        let mn = changed.target.selectedOptions[0].attributes.mn.value;
        generateSnippet(type, codeType, codeValue, vn, mn);
        // let t = changed.target.id;
        setTimeout(() => {
            let from = document.getElementsByClassName('toast')[0]
            let range = document.createRange();
            copyToClipBoard(range, from);
            $('select').prop('selectedIndex', 0);
            // setTimeout(() => { from.classList.add('d-hide') }, 3000)
        }, 100);
    });

    // --- on click evaluate axes
    $('body').on('click', "input[type='radio']", (ele) => {
        let prefol = document.getElementById("anxp").attributes.value.value;
        // find the selected source
        let src = $("input[name='src']:checked").val();
        // find the selected target
        let tgt = $("input[name='tgt']:checked").val();
        // get both values
        devtools_connections.postMessage({
            data: `//${src + prefol + tgt}`,
            request: "parseAxes", tab: chrome.devtools.inspectedWindow.tabId
        });
    })

    // --- open option page
    $('body').on('click', '#openSetting', () => {
        chrome.runtime.openOptionsPage(() => { });
    })
    // --- click to copy code
    $('body').on('click', '#copyCode', (t) => {
        try {
            var from = document.getElementById("sniplang");
            var range = document.createRange();
            copyToClipBoard(range, from);
        } catch (error) { }
    })
    // To copy Xpath
    $('body').on('click', '#xpathVal', (e) => {
        try {
            let t = e.target;
            let c = t.dataset.copytarget;
            c = c.replace("#", "");
            var from = document.getElementById(c);
            var range = document.createRange();
            copyToClipBoard(range, from);
        } catch (error) { }
    })
    // click to copy axes xpath
    $('body').on('click', '#anxp', (e) => {
        try {
            let t = e.target;
            let c = t.dataset.copytarget;
            c = c.replace("#", "");
            var from = document.getElementById(c);
            var range = document.createRange();
            copyToClipBoard(range, from);
        } catch (error) { }
    })
    // click to copy table values
    $('body').on('click', '.btn.btn-link.btn-sm', (e) => {
        try {
            let t = e.target;
            let c = t.dataset.copytarget;
            c = c.replace("#", "");
            var from = document.getElementById(c);
            var range = document.createRange();
            copyToClipBoard(range, from);
        } catch (error) { }
    })

    // ----- custom search
    $('body').on('click', '#usxp', (e) => {
        // send the value to content script and evaluate
        const val = document.getElementById("searchVal");
        if (val.value.length > 0) {
            devtools_connections.postMessage({
                data: val.value,
                request: "userSearchXP", tab: chrome.devtools.inspectedWindow.tabId
            });
        }
    });
    $('body').on('click', '.btn,btn-clear', (e) => {
        document.querySelector('.toast').classList.add('d-hide');
    });

});
function copyToClipBoard(range, node) {
    try {
        window.getSelection().removeAllRanges();
        range.selectNodeContents(node);
        window.getSelection().addRange(range);
        document.execCommand('copy');
        window.getSelection().removeAllRanges();
        node.classList.add('copied');
        setTimeout(function () { node.classList.remove('copied'); }, 1500);
    } catch (error) { }
}
function generateSnippet(type, codeType, codeValue, vn, mn) {
    chrome.storage.local.get(['langID', 'clickvalue', 'sendvalue', 'textvalue', 'attrvalue', 'customLang'], function (result) {
        let code;
        let lang = result.langID;
        switch (lang) {
            case "javas":
                code = javaSnippet(type, codeType, codeValue, vn);
                break;
            case "protractorjs":
                code = jsSnippet(type, codeType, codeValue, vn)
                break;
            case "py":
                code = pySnippet(type, codeType, codeValue, vn)
                break;
            case "csharp":
                code = javaSnippet(type, codeType, codeValue, vn)
                break;
            case "custom":
                code = customSnippets(type, codeType, codeValue, vn, result, mn)
                // alert('Not yet implemented')
                // chrome.storage.local.get(['click-value'], (result) => {
                //     console.log(result);
                // })
                break;
            default:
                code = javaSnippet(type, codeType, codeValue, vn);
                break;
        }
        if (code === 'hide') {
            document.querySelector('.toast').classList.add('d-hide');
        }
        else {
            document.querySelector(".toast").textContent = '';
            document.querySelector('.toast').classList.remove('d-hide');
            // let to = document.querySelector(".toast");
            let t = `<button class="btn btn-clear float-right"></button>
            <div class="text-ellipsis text-center">${code}</div>`
            $('.toast').append(t);
        }
    });
}
function javaSnippet(type, codeType, codeValue, variable) {
    let str;
    switch (codeType) {
        case "CSS":
            str = `driver.findElement(By.cssSelector("${codeValue}"))`;
            break;
        case "Unique Class Atrribute":
            str = `driver.findElement(By.className("${codeValue}"))`;
            break;
        case "Unique TagName":
            str = `driver.findElement(By.tagName("${codeValue}"))`;
            break;
        case "Link Text":
            str = `driver.findElement(By.linkText("${codeValue}"))`;
            break;
        case "Unique ID":
            str = `driver.findElement(By.id("${codeValue}"))`;
            break;
        case "Unique Name":
            str = `driver.findElement(By.name("${codeValue}"))`;
            break;
        case "Unique PartialLinkText":
            str = `driver.findElement(By.partialLinkText("${codeValue}"))`;
            break;
        default:
            str = `driver.findElement(By.xpath("${codeValue}"))`;
            break;
    }
    switch (type) {
        case "click":
            str += `.click();`
            break;
        case "sendKeys":
            str += `.sendKeys();`
            break;
        case "getAttribute":
            str += `.getAttribute();`
            break;
        case "getText":
            str += `.getText();`
            break;
        default:
            str = 'hide';
            break;
    }
    return str;
}
// TODO: test snippets values
function jsSnippet(type, codeType, codeValue, variable) {

    let str;
    // getAttribute Collection based XPath //input[@placeholder='first name & last name'] firstName" false
    switch (codeType) {
        case "CSS":
            str = `element(by.css("${codeValue}"))`;
            break;
        case "Unique Class Atrribute":
            str = `element(by.className("${codeValue}"))`;
            break;
        case "Unique TagName":
            str = `element(by.tagName("${codeValue}"))`;
            break;
        case "Link Text":
            str = `element(by.linkText("${codeValue}"))`;
            break;
        case "Unique ID":
            str = `element(by.id("${codeValue}"))`;
            break;
        case "Unique Name":
            str = `element(by.name("${codeValue}"))`;
            break;
        case "Unique PartialLinkText":
            str = `element(by.partialLinkText("${codeValue}"))`;
            break;
        default:
            str = `element(by.xpath("${codeValue}"))`;
            break;
    }
    switch (type) {
        case "click":
            str += `.click();`
            // str = `private ${variable} = ${str}`
            break;
        case "sendKeys":
            // str = `private ${variable} = ${str}`
            str += `.sendKeys()`
            break;
        case "getAttribute":
            str += `.getAttribute();`
            break;
        case "getText":
            str += `.getText();`
            break;
        default:
            str = 'hide';
            break;
    }
    return str;
}
function pySnippet(type, codeType, codeValue, variable) {

    let str;
    // getAttribute Collection based XPath //input[@placeholder='first name & last name'] firstName" false
    switch (codeType) {
        case "CSS":
            str = `find_element_by_css_selector("${codeValue}")`;
            break;
        case "Unique Class Atrribute":
            str = `find_element_by_class_name("${codeValue}")`;
            break;
        case "Unique TagName":
            str = `find_element_by_tag_name("${codeValue}")`;
            break;
        case "Link Text":
            str = `find_element_by_link_text("${codeValue}")`;
            break;
        case "Unique ID":
            str = `find_element_by_id("${codeValue}")`;
            break;
        case "Unique Name":
            str = `find_element_by_name("${codeValue}")`;
            break;
        case "Unique PartialLinkText":
            str = `find_element_by_partial_link_text("${codeValue}")`;
            break;
        default:
            str = `find_element_by_xpath("${codeValue}")`;
            break;
    }
    switch (type) {
        case "click":
            str += `.click();`
            break;
        case "sendKeys":
            str += `.send_keys();`
            break;
        case "getAttribute":
            str += `.get_attribute();`
            break;
        case "getText":
            str += `.get_text();`
            break;
        default:
            str = 'hide';
            break;
    }
    return str;
}
function customSnippets(type, codeType, codeValue, vn, result, mn) {
    let locatorValue;
    if (result.customLang === 'jscs') {
        switch (codeType) {
            case "CSS":
                locatorValue = `element(by.css("${codeValue}"))`;
                break;
            case "Unique Class Atrribute":
                locatorValue = `element(by.className("${codeValue}"))`;
                break;
            case "Unique TagName":
                locatorValue = `element(by.tagName("${codeValue}"))`;
                break;
            case "Link Text":
                locatorValue = `element(by.linkText("${codeValue}"))`;
                break;
            case "Unique ID":
                locatorValue = `element(by.id("${codeValue}"))`;
                break;
            case "Unique Name":
                locatorValue = `element(by.name("${codeValue}"))`;
                break;
            case "Unique PartialLinkText":
                locatorValue = `element(by.partialLinkText("${codeValue}"))`;
                break;
            default:
                locatorValue = `element(by.xpath("${codeValue}"))`;
                break;
        }
    } else {
        switch (codeType) {
            case "CSS":
                locatorValue = `@FindBy(css = "${codeValue}")\r\n`;
                break;
            case "Unique Class Atrribute":
                locatorValue = `@FindBy(className = "${codeValue}")\r\n`;
                break;
            case "Unique TagName":
                locatorValue = `@FindBy(tagName = "${codeValue}")\r\n`;
                break;
            case "Link Text":
                locatorValue = `@FindBy(linkText = "${codeValue}")\r\n`;
                break;
            case "Unique ID":
                locatorValue = `@FindBy(id= "${codeValue}")\r\n`;
                break;
            case "Unique Name":
                locatorValue = `@FindBy(name = "${codeValue}")\r\n`;
                break;
            case "Unique PartialLinkText":
                locatorValue = `@FindBy(partialLinkText = "${codeValue}")\r\n`;
                break;
            default:
                locatorValue = `@FindBy(xpath = "${codeValue}")\r\n`;
                break;
        }
    }
    let str = '';
    switch (type) {
        case "click":
            str = result.clickvalue;
            str = custSnip(str, locatorValue, vn, mn);
            return str;
        case "sendKeys":
            str = result.sendvalue;
            return custSnip(str, locatorValue, vn, mn);
        case "getAttribute":
            str = result.attrvalue;
            return custSnip(str, locatorValue, vn, mn);
        case "getText":
            str = result.textvalue;
            return custSnip(str, locatorValue, vn, mn);
        default:
            return 'hide';
    }
}

function custSnip(str, locatorValue, vn, mn) {
    if (str.includes('${lc}')) {
        str = str.replaceAll('${lc}', locatorValue) + '\r\n';
    } if (str.includes('${vn}')) {
        str = str.replaceAll('${vn}', vn);
    } if (str.includes('${mn}')) {
        str = str.replaceAll('${mn}', mn) + '\r\n';
    }
    return str.trim();
}

