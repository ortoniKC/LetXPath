// panelconfig.js
$(document).ready(function () {
  // Establish connection with the service worker
  // var devtoolsConnections = chrome.tabs.connect(
  //   chrome.devtools.inspectedWindow.tabId
  // );

  const tabId = chrome.devtools.inspectedWindow.tabId;
  // ------ highlight XPath & Code Snippets -----------
  $("#tab_header li.tab-item").on("click", function () {
    let number = $(this).data("option");
    $("#tab_header li.tab-item").removeClass("active");
    $(this).addClass("active");
    $("#tab_container .container_item").removeClass("active");
    $('div[data-item="' + number + '"]').addClass("active");
    if (number == 5) {
      $("#tag-5").prop("checked", true);
    } else if (number == 4) {
      $("#tag-1").prop("checked", true);
    } else {
      $("input[name='filter-radio']").prop("checked", false);
    }
    sendMessageToCS(tabId, {
      request: "cleanhighlight",
    });
  });

  // ------ get selected values
  $("select#selector").change(function () {
    var selectedvalue = $(this).children("option:selected").val();
    let selector = {
      request: "utilsSelector",
      selectedValue: selectedvalue,
    };
    sendMessageToCS(tabId, {
      selector,
    });
  });
  // --- snippet changer
  $("body").on("change", "#snippetsSelector", (changed) => {
    let type = changed.target.selectedOptions[0].value;
    let codeType = changed.target.selectedOptions[0].attributes.ct.value;
    let codeValue = changed.target.selectedOptions[0].attributes.cv.value;
    let vn = changed.target.selectedOptions[0].attributes.vn.value;
    let mn = changed.target.selectedOptions[0].attributes.mn.value;
    generateSnippet(type, codeType, codeValue, vn, mn);
    // let t = changed.target.id;
    setTimeout(() => {
      let from = document.getElementsByClassName("toast")[0];
      let range = document.createRange();
      copyToClipBoard(range, from);
      $("select").prop("selectedIndex", 0);
    }, 100);
  });

  // --- on click evaluate axes
  $("body").on("click", "div#anchorXPath input[type='radio']", (ele) => {
    let prefol = document.getElementById("anxp").attributes.value.value;
    // find the selected source
    let src = $("input[name='src']:checked").val();
    // find the selected target
    let tgt = $("input[name='tgt']:checked").val();
    // get both values
    sendMessageToCS(tabId, {
      request: "parseAxes",
      data: `//${src + prefol + tgt}`,
    });
  });

  // --- open option page
  $("body").on("click", "#openSetting", () => {
    chrome.runtime.openOptionsPage(() => {});
  });
  // --- click to copy code
  $("body").on("click", "#copyCode", (t) => {
    try {
      var from = document.getElementById("sniplang");
      var range = document.createRange();
      copyToClipBoard(range, from);
    } catch (error) {}
  });
  // To copy Xpath
  $("body").on("click", "#xpathVal", (e) => {
    try {
      let t = e.target;
      let c = t.dataset.copytarget;
      c = c.replace("#", "");
      var from = document.getElementById(c);
      var range = document.createRange();
      copyToClipBoard(range, from);
    } catch (error) {}
  });
  // click to copy axes xpath
  $("body").on("click", "#anxp", (e) => {
    try {
      let t = e.target;
      let c = t.dataset.copytarget;
      c = c.replace("#", "");
      var from = document.getElementById(c);
      var range = document.createRange();
      copyToClipBoard(range, from);
    } catch (error) {}
  });
  // click to copy table values
  $("body").on("click", ".btn.btn-link.btn-sm", (e) => {
    try {
      let t = e.target;
      let c = t.dataset.copytarget;
      c = c.replace("#", "");
      var from = document.getElementById(c);
      var range = document.createRange();
      copyToClipBoard(range, from);
    } catch (error) {}
  });

  // ----- custom search
  $("body").on("click", "#usxp", (e) => {
    // send the value to content script and evaluate
    const val = document.getElementById("searchVal");
    if (val.value.length > 0) {
      sendMessageToCS(tabId, {
        request: "cleanhighlight",
      });
      sendMessageToCS(tabId, {
        request: "userSearchXP",
        data: val.value,
      });
    }
  });
  $("body").on("click", "#convertSelector", (e) => {
    // send the value to content script and evaluate
    const val = document.getElementById("convert");
    if (val.value.length > 0) {
      sendMessageToCS(tabId, {
        data: val.value,
        request: "dotheconversion",
      });
    }
  });
  // hide toast message - hide sinppet
  $("body").on("click", "button.btn.btn-clear", (e) => {
    document.querySelector(".toast").classList.add("d-hide");
  });

  $("body").on("click", "#cleanhighlight", () => {
    document.getElementById("searchVal").value = "";
    jQuery("#insertsearch").empty();
    sendMessageToCS(tabId, {
      request: "cleanhighlight",
    });
  });
});
function sendMessageToCS(tabId, request) {
  chrome.tabs.sendMessage(tabId, request).then(() => {
    console.log("sent", request);
  });

  // return new Promise((resolve) => {
  //   chrome.tabs.sendMessage(tabId, request);
  //   resolve();
  // });
}

function copyToClipBoard(range, node) {
  try {
    window.getSelection().removeAllRanges();
    range.selectNodeContents(node);
    window.getSelection().addRange(range);
    document.execCommand("copy");
    window.getSelection().removeAllRanges();
    node.classList.add("copied");
    setTimeout(function () {
      node.classList.remove("copied");
    }, 1500);
  } catch (error) {}
}

function generateSnippet(type, codeType, codeValue, vn, mn) {
  chrome.storage.local.get(
    [
      "langID",
      "clickvalue",
      "sendvalue",
      "textvalue",
      "attrvalue",
      "customLang",
    ],
    function (result) {
      let code;
      let lang = result.langID;
      switch (lang) {
        case "playwrightJS":
          code = playwrightSnippetJS(type, codeType, codeValue, vn);
          break;
        case "playwrightJava":
          code = playwrightSnippetJava(type, codeType, codeValue, vn);
          break;
        case "javas":
          code = javaSnippet(type, codeType, codeValue, vn);
          break;
        case "protractorjs":
          code = jsSnippet(type, codeType, codeValue, vn);
          break;
        case "py":
          code = pySnippet(type, codeType, codeValue, vn);
          break;
        case "csharp":
          code = javaSnippet(type, codeType, codeValue, vn);
          break;
        case "custom":
          code = customSnippets(type, codeType, codeValue, vn, result, mn);
          break;
        default:
          code = javaSnippet(type, codeType, codeValue, vn);
          break;
      }

      document.querySelector(".toast").textContent = "";
      document.querySelector(".toast").classList.remove("d-hide");
      // let to = document.querySelector(".toast");
      let t = `<button class="btn btn-clear float-right"></button>
            <div class="text-ellipsis text-center">${code}</div>`;
      $(".toast").append(t);
    }
  );
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
      str += `.click();`;
      break;
    case "sendKeys":
      str += `.sendKeys();`;
      break;
    case "getAttribute":
      str += `.getAttribute();`;
      break;
    case "getText":
      str += `.getText();`;
      break;
    default:
      str = "hide";
      break;
  }
  return str;
}

function playwrightSnippetJava(type, codeType, codeValue, variable) {
  let str;
  switch (codeType) {
    case "CSS":
      str = `page.locator("${codeValue}")`;
      break;
    case "Unique Class Atrribute":
      str = `page.locator(".${codeValue}")`;
      break;
    case "Unique TagName":
      str = `page.locator("${codeValue}")`;
      break;
    case "Link Text":
      str = `page.locator("'${codeValue}'")`;
      break;
    case "Unique ID":
      str = `page.locator("id=${codeValue}")`;
      break;
    case "Unique Name":
      str = `page.locator("[name='${codeValue}']")`;
      break;
    case "Unique PartialLinkText":
      str = `page.locator("a:has-text('${codeValue}'")`;
      break;
    default:
      str = `page.locator("${codeValue}")`;
      break;
  }
  switch (type) {
    case "click":
      str += `.click();`;
      break;
    case "sendKeys":
      str += `.fill();`;
      break;
    case "getAttribute":
      str += `.getAttribute();`;
      break;
    case "getText":
      str += `.textContent();`;
      break;
    default:
      str = "hide";
      break;
  }
  return str;
}

function playwrightSnippetJS(type, codeType, codeValue, variable) {
  let str;
  switch (codeType) {
    case "CSS":
      str = `await page.locator("${codeValue}")`;
      break;
    case "Unique Class Atrribute":
      str = `await page.locator(".${codeValue}")`;
      break;
    case "Unique TagName":
      str = `await page.locator("${codeValue}")`;
      break;
    case "Link Text":
      str = `await page.locator("'${codeValue}'")`;
      break;
    case "Unique ID":
      str = `await page.locator("id=${codeValue}")`;
      break;
    case "Unique Name":
      str = `await page.locator("[name='${codeValue}']")`;
      break;
    case "Unique PartialLinkText":
      str = `await page.locator("a:has-text('${codeValue}'")`;
      break;
    default:
      str = `await page.locator("${codeValue}")`;
      break;
  }
  switch (type) {
    case "click":
      str += `.click();`;
      break;
    case "sendKeys":
      str += `.fill();`;
      break;
    case "getAttribute":
      str += `.getAttribute();`;
      break;
    case "getText":
      str += `.textContent();`;
      break;
    default:
      str = "hide";
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
      str += `.click();`;
      // str = `private ${variable} = ${str}`
      break;
    case "sendKeys":
      // str = `private ${variable} = ${str}`
      str += `.sendKeys()`;
      break;
    case "getAttribute":
      str += `.getAttribute();`;
      break;
    case "getText":
      str += `.getText();`;
      break;
    default:
      str = "hide";
      break;
  }
  return str;
}
function pySnippet(type, codeType, codeValue, variable) {
  let str;
  // getAttribute Collection based XPath //input[@placeholder='first name & last name'] firstName" false
  switch (codeType) {
    case "CSS":
      str = `driver.find_element(by=By.CSS_SELECTOR, value="${codeValue}")`;
      break;
    case "Unique Class Atrribute":
      str = `driver.find_element(by=By.CLASS_NAME, value="${codeValue}")`;
      break;
    case "Unique TagName":
      str = `driver.find_element(by=By.TAG_NAME, value="${codeValue}")`;
      break;
    case "Link Text":
      str = `driver.find_element(by=By.LINK_TEXT, value="${codeValue}")`;
      break;
    case "Unique ID":
      str = `driver.find_element(by=By.ID, value="${codeValue}")`;
      break;
    case "Unique Name":
      str = `driver.find_element(by=By.NAME, value="${codeValue}")`;
      break;
    case "Unique PartialLinkText":
      str = `driver.find_element(by=By.PARTIAL_LINK_TEXT, value="${codeValue}")`;
      break;
    default:
      str = `driver.find_element(by=By.XPATH, value="${codeValue}")`;
      break;
  }
  switch (type) {
    case "click":
      str += `.click();`;
      break;
    case "sendKeys":
      str += `.send_keys();`;
      break;
    case "getAttribute":
      str += `.get_attribute();`;
      break;
    case "getText":
      str += `.get_text();`;
      break;
    default:
      str = "hide";
      break;
  }
  return str;
}
function customSnippets(type, codeType, codeValue, vn, result, mn) {
  let locatorValue;
  if (result.customLang === "jscs") {
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
  let str = "";
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
      return "hide";
  }
}

function custSnip(str, locatorValue, vn, mn) {
  if (str.includes("${lc}")) {
    str = str.replaceAll("${lc}", locatorValue) + "\r\n";
  }
  if (str.includes("${vn}")) {
    str = str.replaceAll("${vn}", vn);
  }
  if (str.includes("${mn}")) {
    str = str.replaceAll("${mn}", mn) + "\r\n";
  }
  return str.trim();
}
