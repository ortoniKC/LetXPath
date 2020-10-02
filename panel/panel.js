chrome.runtime.onMessage.addListener((req, rec, res) => {
  switch (req.request) {
    case "send_to_dev":
      buildUI(req);
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
  let ui = `<code value="${req.data.proOrFol}" id="anxp">${req.data.defaultXPath}></code>
  <div class="columns">
  <div class="column col-xs-6">
    <p class="chip">Parent Element</p>
    ${sourceElement(req.data.src)}
  </div>
  <div class="column col-xs-6">
    <p class="chip">Child Element</p>
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
    let table = `<div class="block is-small" id="tablecodeviewer">
    <label class="label is-small">Table Info - Total no.of table ${data.webtabledetails.totalTables}</label>
    <div class="field is-grouped">
      <p class="control has-icons-right is-size-7 is-expanded code lang-XQuery" id="tablelocator">${data.webtabledetails.tableLocator}</p>
      <p class="control" data-copytarget="#tablelocator">
      <button class="button is-primary is-small" id="copytd" data-copytarget="#tablelocator">
        <span class="icon is-small" data-copytarget="#tablelocator">
          <img src="../assets/icons/clipboard.svg" alt="code" class="custom-svg has-text-white" data-copytarget="#tablelocator"></img>
        </span>
      </button>
    </p>
    </div>
    <div class="field is-grouped">
    <p class="control has-icons-right is-size-7 is-expanded code lang-XQuery" id="tabledata">${data.webtabledetails.tableData}</p>
    <p class="control" data-copytarget="#tabledata">
      <button class="button is-primary is-small" id="copytd" data-copytarget="#tabledata">
        <span class="icon is-small" data-copytarget="#tabledata">
          <img src="../assets/icons/clipboard.svg" alt="code" class="custom-svg has-text-white" data-copytarget="#tabledata"></img>
        </span>
      </button>
    </p>
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
      <select class="form-select select-sm" id="snippetsSelector">
        ${getSelectionValues(data, i)}
      </select>
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
      if (type === "submit") {
        finalOP = `<option value="snippet" ct="snip" cv="snip" vn="snip">Snippet</option>
        <option value="click" ct="${data.xpathid[i][1]}" cv="${data.xpathid[i][2]}" vn="${data.variablename}">click</option>
        <option value="getAttribute" ct="${data.xpathid[i][1]}" cv="${data.xpathid[i][2]}" vn="${data.variablename}">getAttribute</option>`
      } else {
        finalOP = `<option value="snippet" ct="snip" cv="snip" vn="snip">Snippet</option>
        <option value="sendKeys" ct="${data.xpathid[i][1]}" cv="${data.xpathid[i][2]}" vn="${data.variablename}">sendKeys</option>
        <option value="getAttribute" ct="${data.xpathid[i][1]}" cv="${data.xpathid[i][2]}" vn="${data.variablename}">getAttribute</option>`
      }
      break;
    case "img":
      finalOP = `<option value="snippet" ct="snip" cv="snip" vn="snip">Snippet</option>
      <option value="click" ct="${data.xpathid[i][1]}" cv="${data.xpathid[i][2]}" vn="${data.variablename}">click</option>
      <option value="getAttribute" ct="${data.xpathid[i][1]}" cv="${data.xpathid[i][2]}" vn="${data.variablename}">getAttribute</option>`
      break;
    default:
      finalOP = `<option value="snippet" ct="snip" cv="snip" vn="snip">Snippet</option>
      <option value="click" ct="${data.xpathid[i][1]}" cv="${data.xpathid[i][2]}" vn="${data.variablename}">click</option>
      <option value="getText" ct="${data.xpathid[i][1]}" cv="${data.xpathid[i][2]}" vn="${data.variablename}">getText</option>`
      break;
  }
  return finalOP;
}