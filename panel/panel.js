chrome.runtime.onMessage.addListener((req, rec, res) => {
  console.log(req);

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
    default:
      return true;
  }
})
let devtools_connections = chrome.runtime.connect({ name: "ortoni_devtools_message" });

function generateAxes(req) {
  jQuery("#anchorXPath").empty();
  let ui = `
    <div class="field is-grouped">
    <p class="control has-icons-right is-size-7 is-expanded is-fullwidth code lang-XQuery" value="${req.data.proOrFol}" id="anxp">${req.data.defaultXPath}</p>
      <p class="control" data-copytarget="#anxp">
        <button class="button is-primary is-small" data-copytarget="#anxp">
          <span class="icon is-small" data-copytarget="#anxp">
          <img src="../assets/icons/clipboard.svg" alt="code" class="custom-svg has-text-white" data-copytarget="#anxp"></img>
          </span>
        </button>
      </p>
    </div>
    <div class="content">
    <div class="mycolumns">
      <div>
        <p>Source Elements</p>
        <div class="block">
         ${sourceElement(req.data.src)}
        </div>
      </div>
      <div>
        <p>Target Elements</p>
        <div class="block">
        ${targetElement(req.data.dst)}
        </div>
      </div>
    </div>
  </div>`;
  jQuery("#anchorXPath").append(ui);
  jQuery("#anchorXPath").trigger('custom-update');
}
function sourceElement(element) {
  let ui = '';
  for (let i = 0; i < element.length; i++) {
    if (i == 0) {
      ui += `<div class="control">
      <label class="radio" aria-label="${element[i][1]}" data-balloon-pos="up">
        <input type="radio" value="${element[i][1]}" name="src" checked>
        ${element[i][2]}
      </label>
    </div>`;
    } else {
      ui += `<div class="control">
      <label class="radio" aria-label="${element[i][1]}" data-balloon-pos="up">
        <input type="radio" value="${element[i][1]}" name="src">
        ${element[i][2]}
      </label>
    </div>`;
    }
  }
  return ui;
}
function targetElement(element) {
  let ui = '';
  for (let i = 0; i < element.length; i++) {
    if (i == 0) {
      ui += `<div class="control">
      <label class="radio" aria-label="${element[i][1]}" data-balloon-pos="up">
        <input type="radio" value="${element[i][1]}" name="tgt" checked>
        ${element[i][2]}
      </label>
    </div>`;
    } else {
      ui += `<div class="control">
      <label class="radio" aria-label="${element[i][1]}" data-balloon-pos="up">
        <input type="radio" value="${element[i][1]}" name="tgt">
        ${element[i][2]}
      </label>
    </div>`;
    }
  }
  return ui;
}


// -------- based on the snippet type show the code ----------
function buildUI(data) {
  jQuery("#addXPath").empty();
  let snippets = `<div class="block is-small is-hidden" id="codeviewer">
<label class="label is-small">Code Snippet</label>
<div class="field is-grouped">
  <p class="control has-icons-right is-size-7 is-expanded code lang-java" id="sniplang"></p>
  <p class="control">
    <button class="button is-primary is-small" id="copyCode">
    <span class="icon is-small">
    <img src="../assets/icons/clipboard.svg" alt="code" class="has-text-white"></img>
      </span>
    </button>
  </p>
</div>
</div>`;
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
  jQuery("#addXPath").append(snippets);
  let len = data.xpathid;
  for (let i = 0; i < len.length; i++) {
    generateXPathUI(data, i);
  }
  jQuery("#addXPath").trigger('custom-update');
}
// -------- Build XPath UI ---------
function generateXPathUI(data, i) {
  let ui = `<label class="label is-small">${i + 1}. ${data.xpathid[i][1]}</label>
<div class="field is-grouped">
<p class="control has-icons-right is-size-7 is-expanded is-fullwidth code lang-XQuery" id="xpath${i}">${data.xpathid[i][2]}</p>
  <p class="control" data-copytarget="#xpath${i}">
    <button class="button is-primary is-small" data-copytarget="#xpath${i}">
      <span class="icon is-small" data-copytarget="#xpath${i}">
      <img src="../assets/icons/clipboard.svg" alt="code" class="custom-svg has-text-white" data-copytarget="#xpath${i}"></img>
      </span>
    </button>
  </p>
  <div class="field has-addons">
    <div class="control is-expanded">
      <div class="select is-primary is-small is-fullwidth">
        <select name="snippetsSelector" id="snippetsSelector">
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