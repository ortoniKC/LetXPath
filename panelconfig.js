$(document).ready(function () {
    // trying dark mode
    if (window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('bg-dark');
    }

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
        generateSnippet(type, codeType, codeValue, vn);
        // let t = changed.target.id;
        setTimeout(() => {
            let from = document.getElementsByClassName('toast')[0]
            let range = document.createRange();
            copyToClipBoard(range, from);
        }, 100);
    });

    // --- on click evaluate axes
    $('body',).on('click', "input[type='radio']", (ele) => {
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

    // --- start debugger
    // $("#setdebugger").click(() => {
    //     chrome.debugger.onEvent.addListener(onEvent);
    //     chrome.debugger.onDetach.addListener(onDetach);
    //     var tabId = chrome.devtools.inspectedWindow.tabId;
    //     var debuggeeId = { tabId: tabId };
    //     if (attachedTabs[tabId] == "pausing")
    //         return;
    //     if (!attachedTabs[tabId])
    //         chrome.debugger.attach(debuggeeId, version, onAttach.bind(null, debuggeeId));
    //     else if (attachedTabs[tabId])
    //         chrome.debugger.detach(debuggeeId, onDetach.bind(null, debuggeeId));
    // });
    // --- open option page
    $('body').on('click', '#openSetting', () => {
        chrome.runtime.openOptionsPage(() => { });
    })
    // --- click to copy code
    // $('body').on('click', '#copyCode', (t) => {
    //     try {
    //         var from = document.getElementById("sniplang");
    //         var range = document.createRange();
    //         copyToClipBoard(range, from);
    //     } catch (error) { }
    // })
    // To copy Xpath
    $('body').on('click', 'button.btn.btn-sm', (e) => {
        try {
            let t = e.target;
            let c = t.dataset.copytarget;
            c = c.replace("#", "");
            var from = document.getElementById(c);
            var range = document.createRange();
            copyToClipBoard(range, from);
        } catch (error) { }
    })

    /**
     * @description - Feature is disabled as of now, as it is not working as expected
     */

    // debugger
    // var attachedTabs = {};
    // var version = "1.3";

    // var onAttach = (debuggeeId) => {
    //     if (chrome.runtime.lastError) {
    //         // alert(chrome.runtime.lastError.message);
    //         return;
    //     }
    //     var tabId = debuggeeId.tabId;
    //     attachedTabs[tabId] = "pausing";
    //     chrome.debugger.sendCommand(
    //         debuggeeId, "Debugger.enable", {},
    //         onDebuggerEnabled.bind(null, debuggeeId)
    //     );
    // }

    // var onDebuggerEnabled = (debuggeeId) => {
    //     chrome.debugger.sendCommand(debuggeeId, "Debugger.pause");
    //     document.querySelector("#setdebugger").textContent = "Paused";

    // }

    // var onEvent = (debuggeeId, method, setdebugger) => {
    //     var tabId = debuggeeId.tabId;
    //     if (method == "Debugger.paused") {
    //         attachedTabs[tabId] = "paused";
    //         document.querySelector("#setdebugger").textContent = "Resume";
    //     }
    // }

    // var onDetach = (debuggeeId) => {
    //     var tabId = debuggeeId.tabId;
    //     delete attachedTabs[tabId];
    //     document.querySelector("#setdebugger").textContent = "Start!";
    // }
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
function generateSnippet(type, codeType, codeValue, vn) {
    let isPOM = false;
    chrome.storage.local.get(['langID'], function (result) {
        let code;

        let lang = result.langID;
        switch (lang) {
            case "javas":
                code = javaSnippet(type, codeType, codeValue, vn, isPOM);
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
                // alert('Not yet implemented')
                break;
            default:
                code = javaSnippet(type, codeType, codeValue, vn, isPOM);
                break;
        }
        if (code === 'hide') {
            document.querySelector('.toast').classList.add('d-hide');
        } else {
            document.querySelector(".toast").textContent = '';
            document.querySelector('.toast').classList.remove('d-hide');
            document.querySelector(".toast").textContent = code;
        }
    });
}
let pom = false
function javaSnippet(type, codeType, codeValue, variable, isPOM) {

    let str;
    // getAttribute Collection based XPath //input[@placeholder='first name & last name'] firstName" false
    switch (codeType) {
        case "CSS":
            str = `driver.findElement(By.css("${codeValue}"))`;
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