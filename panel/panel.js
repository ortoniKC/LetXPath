chrome.runtime.onMessage.addListener((req, rec, res) => {
  hideToast();
  try {
    switch (req.request) {
      case "send_to_dev":
        handleSendToDev(req);
        res("completed");
        break;
      case "anchor":
        handleAnchor(req);
        res("completed");
        break;
      case "axes":
        updateElementText("#anxp", req.data);
        res("completed");
        break;
      case "fromUtilsSelector":
        utilsLocatorUI(req.data);
        res("completed");
        break;
      case "customSearchResult":
        buildSearchUI(req.data);
        res("completed");
        break;
      case "conversion":
        buildConversionUI(req.output);
        res("completed");
        break;
      default:
        res("completed");
        break;
    }
  } catch (error) {}
});

function hideToast() {
  document.querySelector(".toast").classList.add("d-hide");
}

function handleSendToDev(req) {
  buildUI(req);
  resetBadge("cssbadge", "0");
  if (req.cssPath.length > 0) {
    buildCSSUI(req);
  } else {
    displayEmptyMessage("#cssbody");
  }
  if (req.xpathid.length == 0) {
    displayEmptyMessage("#addXPath");
  }
}

function handleAnchor(req) {
  resetBadge("xpbadge", "0");
  clearElementContent("#addXPath");
  resetBadge("cssbadge", "0");
  clearElementContent("#cssbody");
  displayEmptyMessage("#addXPath");
  displayEmptyMessage("#cssbody");
  generateAxes(req);
}

function resetBadge(elementId, value) {
  document
    .getElementById(elementId)
    .attributes.getNamedItem("data-badge").value = value;
}

function clearElementContent(selector) {
  document.querySelector(selector).innerHTML = "";
}

function displayEmptyMessage(selector) {
  const ui = `<div class="empty bg-dark">
                <p class="empty-title h5">Please select any element to get CSS/XPath</p>
                <p class="empty-subtitle">More new patterns coming soon :)</p>
                <p class="empty-subtitle">Did you know LetXPath is an open-source? If you found something wrong, fix it :)</p>
              </div>`;
  document.querySelector(selector).innerHTML = ui;
}

function buildSearchUI(data) {
  clearElementContent("#insertsearch");
  const ui = `<label for="count">${data.count}</label>
              <label for="xpath">${data.xpath}</label>`;
  document.querySelector("#insertsearch").innerHTML = ui;
}

function buildConversionUI(data) {
  clearElementContent("#insertCSS");
  const ui = `<h1 class="title">${data}</h1>`;
  document.querySelector("#insertCSS").innerHTML = ui;
}

function utilsLocatorUI(data) {
  if (data.length > 0) {
    const ui = `<table class="table">
                  <thead>
                    <th>Select</th>
                    <th>Name</th>
                    <th>XPath</th>
                  </thead>
                  <tbody>
                    ${data
                      .map(
                        (item, index) => `<tr>
                      <td><input class="checkbox" type="checkbox" name="locator" id="loc${index}"></td>
                      <td>${item[1]}</td>
                      <td>${item[2][0][2]}</td>
                    </tr>`
                      )
                      .join("")}
                  </tbody>
                </table>`;
    document.querySelector("#show").innerHTML = ui;
  }
}

function generateAxes(req) {
  activatePanel(3);
  clearElementContent("#anchorXPath");
  const ui = `<div class="form-horizontal">
                <div class="form-group">
                  <div class="col-12 tooltip tooltip-bottom" data-tooltip="Click to copy">
                    <code class="form-label text-clip" id="anxp" data-copytarget="#anxp" value="${
                      req.data.proOrFol
                    }">
                      ${req.data.defaultXPath}
                    </code>
                  </div>
                </div>
                <div class="columns">
                  <div class="column col-xs-6">
                    <p class="chip bg-success">Parent Element</p>
                    ${generateElementUI(req.data.src, "src")}
                  </div>
                  <div class="divider-vert" data-content="Axes"></div>
                  <div class="column col-xs-6">
                    <p class="chip bg-success">Child Element</p>
                    ${generateElementUI(req.data.dst, "tgt")}
                  </div>
                </div>
              </div>`;
  document.querySelector("#anchorXPath").innerHTML = ui;
}

function activatePanel(option) {
  document
    .querySelectorAll("#tab_header li.tab-item")
    .forEach((tab) => tab.classList.remove("active"));
  document
    .querySelector(`#tab_header li.tab-item[data-option='${option}']`)
    .classList.add("active");
  document
    .querySelectorAll("#tab_container .container_item")
    .forEach((item) => item.classList.remove("active"));
  document.querySelector(`div[data-item='${option}']`).classList.add("active");
}

function generateElementUI(elements, name) {
  return elements
    .map(
      (element, index) => `
    <div class="form-group ${index === 0 ? "has-info" : ""}">
      <label class="form-switch">
        <input type="radio" name="${name}" value="${element[1]}" ${
        index === 0 ? "checked" : ""
      }>
        <i class="form-icon"></i>${index + 1}. ${element[2]}
      </label>
    </div>
  `
    )
    .join("");
}

function buildUI(data) {
  clearElementContent("#addXPath");
  if (data.webtabledetails != null) {
    const tableUI = `<div class="form-horizontal bg-dark">
                      <span class="label label-rounded sm label-primary">Table Info - Total no.of table ${data.webtabledetails.totalTables}</span>
                      <div class="form-group">
                        <div class="col-11">
                          <span class="label label-rounded label-success sm">Table unique locator</span>
                          <code class="form-label text-clip" id="tablelocator">${data.webtabledetails.tableLocator}</code>
                        </div>
                        <div class="col-1 p-centered text-center">
                          <button class="btn btn-link btn-sm tooltip tooltip-top" data-tooltip="Copy value" data-copytarget="#tablelocator">
                            <img src="../assets/icons/copy.svg" alt="copy" data-copytarget="#tablelocator">
                          </button>
                        </div>
                      </div>
                      <div class="form-group">
                        <div class="col-11">
                          <span class="label label-rounded label-success sm">Locator for selected row</span>
                          <code class="form-label text-clip" id="tabledata">${data.webtabledetails.tableData}</code>
                        </div>
                        <div class="col-1 p-centered text-center">
                          <button class="btn btn-link btn-sm tooltip tooltip-top" data-tooltip="Copy value" id="copytd" data-copytarget="#tabledata">
                            <img src="../assets/icons/copy.svg" alt="copy" data-copytarget="#tabledata">
                          </button>
                        </div>
                      </div>
                    </div>`;
    document.querySelector("#addXPath").innerHTML = tableUI;
  }
  updateBadgeCount("xpbadge", data.xpathid.length);
  data.xpathid.forEach((xpath, i) => generateXPathUI(data, i));
}

function updateBadgeCount(elementId, count) {
  document
    .getElementById(elementId)
    .attributes.getNamedItem("data-badge").value = count;
}

function generateXPathUI(data, i) {
  const ui = `<div class="form-horizontal bg-dark">
                <span class="label label-success label-rounded sm">${i + 1}. ${
    data.xpathid[i][1]
  }</span>
                <div class="form-group">
                  <div class="col-10 c-hand tooltip tooltip-top" id="xpathVal" data-copytarget="#xpath${i}" data-tooltip="Click to copy">
                    <code class="form-label text-clip" id="xpath${i}" data-copytarget="#xpath${i}">${
    data.xpathid[i][2]
  }</code>
                  </div>
                  <div class="col-2 tooltip tooltip-top" data-tooltip="Copy Snippet">
                    <div class="form-group bg-dark">
                      <select class="form-select select-sm" id="snippetsSelector">${getSelectionValues(
                        data,
                        i,
                        data.xpathid,
                        false
                      )}</select>
                    </div>
                  </div>
                </div>
              </div>`;
  document.querySelector("#addXPath").innerHTML += ui;
}
function getSelectionValues(data, i, xp, isCSS) {
  const tag = data.tag;
  const type = data.type;
  const t = isCSS ? "CSS" : xp[i][1];
  const commonOptions = `
    <option value="snippet" ct="snip" cv="snip" vn="snip">Snippet</option>
    <option value="getAttribute" ct="${t}" cv="${xp[i][2]}" vn="${data.variablename}" mn="${data.methodname}">getAttribute</option>`;
  switch (tag) {
    case "textarea":
      return `${commonOptions}
              <option value="sendKeys" ct="${t}" cv="${xp[i][2]}" vn="${data.variablename}" mn="${data.methodname}">sendKeys</option>`;
    case "input":
      if (type === "submit" || type === "radio" || type === "checkbox") {
        return `${commonOptions}
                <option value="click" ct="${t}" cv="${xp[i][2]}" vn="${data.variablename}" mn="${data.methodname}">click</option>`;
      } else {
        return `${commonOptions}
                <option value="sendKeys" ct="${t}" cv="${xp[i][2]}" vn="${data.variablename}" mn="${data.methodname}">sendKeys</option>`;
      }
    case "img":
      return `${commonOptions}
              <option value="click" ct="${t}" cv="${xp[i][2]}" vn="${data.variablename}" mn="${data.methodname}">click</option>`;
    default:
      return `${commonOptions}
              <option value="click" ct="${t}" cv="${xp[i][2]}" vn="${data.variablename}" mn="${data.methodname}">click</option>
              <option value="getText" ct="${t}" cv="${xp[i][2]}" vn="${data.variablename}" mn="${data.methodname}">getText</option>`;
  }
}

function buildCSSUI(data) {
  updateBadgeCount("cssbadge", data.cssPath.length);
  clearElementContent("#cssbody");
  data.cssPath.forEach((item, i) => {
    const ui = `<div class="form-horizontal">
                  <span class="label label-rounded label-success sm">${
                    i + 1
                  }. ${item[1]}</span>
                  <div class="form-group">
                    <div class="col-10 tooltip tooltip-top" id="xpathVal" data-tooltip="Click to copy" data-copytarget="#css${i}">
                      <code class="form-label text-clip" id="css${i}" data-copytarget="#css${i}">${
      item[2]
    }</code>
                    </div>
                    <div class="col-2 tooltip tooltip-top" data-tooltip="Copy Snippet">
                      <select class="form-select select-sm" id="snippetsSelector">${getSelectionValues(
                        data,
                        i,
                        data.cssPath,
                        true
                      )}</select>
                    </div>
                  </div>
                </div>`;
    document.querySelector("#cssbody").innerHTML += ui;
  });
}

// Helper function to update element text content
function updateElementText(selector, text) {
  document.querySelector(selector).textContent = text;
}
