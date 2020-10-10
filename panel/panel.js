chrome.runtime.onMessage.addListener((req, rec, res) => {
  switch (req.request) {
    case "send_to_dev":
      buildUI(req);
      document.getElementById("cssbadge").attributes.getNamedItem('data-badge').value = '0'
      if (req.cssPath.length > 0) {
        buildCSSUI(req)
      } else {
        jQuery("#cssbody").empty();
        let ui = `<div class="empty">
        <p class="empty-title h5">Please select any element to get CSS/XPath</p>
        <p class="empty-subtitle">more new patterns coming soon :)</p>
        <p class="empty-subtitle">Did you know LetXPath is an open-source, if you found something wrong fix it :)</p>
        </div>`;
        jQuery("#cssbody").append(ui);
      }
      if (req.xpathid.length == 0) {
        jQuery("#addXPath").empty();
        let ui = `<div class="empty">
        <p class="empty-title h5">Please select any element to get XPath/CSS</p>
        <p class="empty-subtitle">more new patterns coming soon :)</p>
        <p class="empty-subtitle">Did you know LetXPath is an open-source, if you found something wrong fix it :)</p>
        </div>`;
        jQuery("#addXPath").append(ui);
      }
      return true;
    case "anchor":
      generateAxes(req);
      return true;
    case "axes":
      $("#anxp").empty();
      $("#anxp").text(req.data);
      jQuery("#anxp").trigger('custom-update');
      return true;
    case "fromUtilsSelector":
      utilsLocatorUI(req.data);
      return true;
    default:
      return true;
  }
})
let devtools_connections = chrome.runtime.connect({ name: "ortoni_devtools_message" });

function utilsLocatorUI(data) {
  let len = data.length;
  if (len > 0) {
    let ui = `
    <table class="table">
      <thead>
        <th>Select</th>
        <th>Name</th>
        <th>XPath</th>
      </thead>
      <tbody>
        ${getTR()}
      </tbody>
    </table>`;
    $("#show").append(ui);
  }
  function getTR() {
    let tr = '';
    for (let i = 0; i < data.length; i++) {
      tr += `<tr><td><input class="checkbox" type="checkbox" name="locator" id="loc${i}"></td>
          <td>${data[i][1]}</td>
          <td>${data[i][2][0][2]}</td></tr>`;
    }
    return tr;
  }
}
// generate axes based on user inputs
function generateAxes(req) {
  jQuery("#anchorXPath").empty();
  let ui = `<div class="form-horizontal">
  <div class="form-group">
  <div class="col-8">
    <code class="form-label" id="anxp" value="${req.data.proOrFol}">${req.data.defaultXPath}</code>
  </div>
  <div class="col-1 p-centered text-center">
    <button class="btn btn-link btn-sm tooltip tooltip-top" data-tooltip="Copy value" data-copytarget="anxp">
      <img src="../assets/icons/copy.svg" alt="copy" data-copytarget="anxp">
    </button>
  </div>
  </div>
</div>
  <div class="columns">
  <div class="column col-xs-6">
    <p class="chip bg-success">Parent Element</p>
    ${sourceElement(req.data.src)}
  </div>
  <div class="column col-xs-6">
    <p class="chip bg-success">Child Element</p>
    ${targetElement(req.data.dst)}
  </div>
</div>`
  jQuery("#anchorXPath").append(ui);
}
// Build the source element
function sourceElement(element) {
  let ui = '';
  for (let i = 0; i < element.length; i++) {
    if (i == 0) {
      ui += `<div class="form-group">
      <label class="form-switch">
        <input type="radio" name="src" value="${element[i][1]}" checked>
        <i class="form-icon"></i>${element[i][2]}
      </label>
    </div>`
    } else {
      ui += `<div class="form-group">
      <label class="form-switch">
        <input type="radio" name="src" value="${element[i][1]}">
        <i class="form-icon"></i>${element[i][2]}
      </label>
    </div>`;
    }
  }
  return ui;
}
// Build the target element
function targetElement(element) {
  let ui = '';
  for (let i = 0; i < element.length; i++) {
    if (i == 0) {
      ui += `<div class="form-group">
      <label class="form-switch">
        <input type="radio" name="tgt" value="${element[i][1]}" checked>
        <i class="form-icon"></i>${element[i][2]}
      </label>
    </div>`
    } else {
      ui += `<div class="form-group">
      <label class="form-switch">
        <input type="radio" name="tgt" value="${element[i][1]}">
        <i class="form-icon"></i>${element[i][2]}
      </label>
    </div>`;
    }
  }
  return ui;
}
// -------- based on the snippet type show the code ----------
function buildUI(data) {
  jQuery("#addXPath").empty();
  if (data.webtabledetails != null) {
    let table = `<div class="form-horizontal bg-secondary">
    <span class="label label-rounded sm">Table Info - Total no.of table ${data.webtabledetails.totalTables}</span>
    <div class="form-group">
      <div class="col-8">
        <code class="form-label" id="tablelocator">${data.webtabledetails.tableLocator}</code>
      </div>
      <div class="col-1 p-centered text-center">
        <button class="btn btn-link btn-sm tooltip tooltip-top" data-tooltip="Copy value" data-copytarget="#tablelocator">
          <img src="../assets/icons/copy.svg" alt="copy" data-copytarget="#tablelocator">
        </button>
      </div>
    </div>
    <div class="form-group">
      <div class="col-8">
        <code class="form-label" id="tabledata">${data.webtabledetails.tableData}</code>
      </div>
      <div class="col-1 p-centered text-center">
        <button class="btn btn-link btn-sm tooltip tooltip-top" data-tooltip="Copy value" id="copytd" data-copytarget="#tabledata">
          <img src="../assets/icons/copy.svg" alt="copy" data-copytarget="#tabledata"">
        </button>
      </div>
    </div>
  </div>`;
    jQuery("#addXPath").append(table);
  }
  let len = data.xpathid;
  document.getElementById("xpbadge").attributes.getNamedItem('data-badge').value = len.length
  for (let i = 0; i < len.length; i++) {
    generateXPathUI(data, i);
  }
}
// -------- Build XPath UI ---------
function generateXPathUI(data, i) {
  let ui = `<div class="form-horizontal">
  <span class="label label-rounded sm">${i + 1}. ${data.xpathid[i][1]}</span>
  <div class="form-group">
    <div class="col-8">
      <code class="form-label" id="xpath${i}">${data.xpathid[i][2]}</code>
    </div>
    <div class="col-1 p-centered text-center">
      <button class="btn btn-link btn-sm tooltip tooltip-top" data-tooltip="Copy value" data-copytarget="#xpath${i}">
        <img src="../assets/icons/copy.svg" alt="copy" data-copytarget="#xpath${i}">
      </button>
    </div>
    <div class="col-3 tooltip tooltip-top" data-tooltip="Copy Snippet">
      <select class="form-select select-sm" id="snippetsSelector">${getSelectionValues(data, i)}</select>
    </div>
  </div>
</div>`;
  jQuery("#addXPath").append(ui);
}
// ------- build drop-down for snippet based on element type -------
function getSelectionValues(data, i) {
  let finalOP;
  let type = data.type;
  let tag = data.tag;
  switch (tag) {
    case "input":
      if (type === "submit" || type === "radio" || type === "checkbox") {
        finalOP = `<option value = "snippet" ct = "snip" cv = "snip" vn = "snip">Snippet</option >
        <option value="click" ct="${data.xpathid[i][1]}" cv="${data.xpathid[i][2]}" vn="${data.variablename}">click</option>
        <option value="getAttribute" ct="${data.xpathid[i][1]}" cv="${data.xpathid[i][2]}" vn="${data.variablename}">getAttribute</option>`
      } else {
        finalOP = `<option value = "snippet" ct = "snip" cv = "snip" vn = "snip">Snippet</option >
        <option value="sendKeys" ct="${data.xpathid[i][1]}" cv="${data.xpathid[i][2]}" vn="${data.variablename}">sendKeys</option>
        <option value="getAttribute" ct="${data.xpathid[i][1]}" cv="${data.xpathid[i][2]}" vn="${data.variablename}">getAttribute</option>`
      }
      break;
    case "img":
      finalOP = `<option value = "snippet" ct = "snip" cv = "snip" vn = "snip">Snippet</option >
      <option value="click" ct="${data.xpathid[i][1]}" cv="${data.xpathid[i][2]}" vn="${data.variablename}">click</option>
      <option value="getAttribute" ct="${data.xpathid[i][1]}" cv="${data.xpathid[i][2]}" vn="${data.variablename}">getAttribute</option>`
      break;
    default:
      finalOP = `<option value = "snippet" ct = "snip" cv = "snip" vn = "snip">Snippet</option >
      <option value="click" ct="${data.xpathid[i][1]}" cv="${data.xpathid[i][2]}" vn="${data.variablename}">click</option>
      <option value="getText" ct="${data.xpathid[i][1]}" cv="${data.xpathid[i][2]}" vn="${data.variablename}">getText</option>`
      break;
  }
  return finalOP;
}
function buildCSSUI(data) {
  document.getElementById("cssbadge").attributes.getNamedItem('data-badge').value = data.cssPath.length
  jQuery("#cssbody").empty();
  let ui = '';
  for (let i = 0; i < data.cssPath.length; i++) {
    ui += `<div class="form-horizontal">
    <span class="label label-rounded sm">${i + 1}. ${data.cssPath[i][1]}</span>
      <div class="form-group">
        <div class="col-8">
          <code class="form-label" id="css${i}">${data.cssPath[i][2]}</code>
        </div>
        <div class="col-1 p-centered text-center">
          <button class="btn btn-link btn-sm tooltip tooltip-top" data-tooltip="Copy value" data-copytarget="#css${i}">
            <img src="../assets/icons/copy.svg" alt="copy" data-copytarget="#css${i}">
      </button>
    </div>
    </div>
    </div>`;
  }
  jQuery("#cssbody").append(ui)
}