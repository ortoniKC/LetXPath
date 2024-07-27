// option.js
$(document).ready(function () {
  chrome.storage.local.get(
    [
      "langID",
      "customLang",
      "clickvalue",
      "sendvalue",
      "textvalue",
      "attrvalue",
    ],
    (result) => {
      if (result.langID != undefined) {
        const codeType = result.langID;
        $("select").val(codeType).change();
        embedCodeSample(codeType);
        setStorage({ langID: codeType });
      } else if (result.customLang != undefined) {
        const codeType = result.customLang;
        $("select").val(codeType).change();
        embedCodeSample(codeType);
        setStorage({ langID: codeType });
      } else {
        // $("select").val(result.langID).change();
        embedCodeSample("javas");
        setStorage({ langID: "javas" });
      }
      // set edited values in textarea
      if (result.clickvalue != undefined) {
        $("#click-s").val(result.clickvalue);
        $("#send-s").val(result.sendvalue);
        $("#text-s").val(result.textvalue);
        $("#attr-s").val(result.attrvalue);
      }
    }
  );
  $("select#snippets").change(function () {
    var selectedvalue = $(this).children("option:selected").val();
    setStorage({ langID: selectedvalue });
    embedCodeSample(selectedvalue);
  });

  $("form").on("submit", function () {
    let ip = $("input[name='cssnippetLanguage']:checked");
    let customLang = ip.attr("id");
    setStorage({ customLang: customLang });
    let clickAct = $("#click-s");
    setStorage({ clickvalue: clickAct.val() });
    let sendAct = $("#send-s");
    setStorage({ sendvalue: sendAct.val() });
    let textAct = $("#text-s");
    setStorage({ textvalue: textAct.val() });
    let attrAct = $("#attr-s");
    setStorage({ attrvalue: attrAct.val() });
  });
});

function setStorage(obj) {
  chrome.storage.local.set(obj, function () {});
}

function embedCodeSample(codetype) {
  jQuery("#samplecode").empty();
  let code;
  switch (codetype) {
    case "playwrightJS":
      code = `await page.locator("locator value");`;
      break;
    case "playwrightJava":
      code = `page.locator("locator value");`;
      break;
    case "javas":
      code = `driver.findElement(By.xpath("locator value"));`;
      break;
    case "py":
      code = `driver.find_element(By.XPATH, "locator value")`;
      break;
    case "csharp":
      code = `driver.FindElement(By.Xpath("locator value"));  `;
      break;
    case "protractorjs":
      code = `element(by.xpath("locator value"));`;
      break;
    case "custom":
      code = `Custome framework`;
      break;
    default:
      code = `driver.findElement(By.xpath("locator value"));`;
      break;
  }
  jQuery("#samplecode").append(`${code}`);
}
