/**
 * @description The best of LeTXPath, unique implementation comparing to other product out there
 * @param {*} getsingleXPath
 * @param {*} tagArr
 * @param {*} dupArray
 * @param {*} element
 */

function getAnchorXPath(getsingleXPath, tagArr, dupArray, element) {
  if (dupArray.length == 0) {
    let r = evaluateXPathExpression("//*[@letxxpath='letX']");
    let a = r.singleNodeValue;
    if (a) {
      a.removeAttribute("letxxpath");
    }
  }
  if (dupArray.length == 1) {
    let r = evaluateXPathExpression("//*[@letaxes='letX']");
    let a = r.singleNodeValue;
    if (a) {
      a.removeAttribute("letaxes");
    }
  }
  dupArray.push(getsingleXPath);
  let length = dupArray.length;
  if (length == 2) {
    let srcArrayXP = [];
    let dstArrayXP = [];
    let firstElement = dupArray[0][0][2];
    if (firstElement.startsWith("//") || firstElement.startsWith("(")) {
      firstElement = firstElement;
    } else {
      let a = dupArray[0];
      for (let index = 0; index < a.length; index++) {
        let c = dupArray[0][index][2];
        if (c.startsWith("//") || c.startsWith("(")) {
          firstElement = dupArray[0][index][2];
          break;
        }
      }
    }
    let secondElement = `*${letXP}`;
    if (getNumberOfXPath(`${firstElement}/following::${secondElement}`) == 1) {
      setPreOrFol = "/following::";
    } else if (
      getNumberOfXPath(`${firstElement}/preceding::${secondElement}`) == 1
    ) {
      setPreOrFol = "/preceding::";
    } else {
      setPreOrFol = null;
    }
    let sxp = dupArray[0];
    let dxp = dupArray[1];
    extractXPathFormArray(sxp, srcArrayXP, tagArr[0]);
    extractXPathFormArray(dxp, dstArrayXP, tagArr[1]);
    let defaultXP = `//${srcArrayXP[0][1]}${setPreOrFol}${dstArrayXP[0][1]}`;
    let defaultCount = getNumberOfXPath(defaultXP);
    if (defaultCount == 0 || defaultCount == undefined) {
      defaultXP = "Pattern not matched, Please try other combinations";
    } else if (defaultCount == 1) {
      defaultXP = defaultXP;
    } else if (defaultCount > 1) {
      defaultXP = addIndexToXpath(defaultXP);
    }
    let dom = {
      webtabledetails: webTableDetails,
      anchor: true,
      proOrFol: setPreOrFol,
      src: srcArrayXP,
      dst: dstArrayXP,
      defaultXPath: defaultXP,
    };
    element.setAttribute("letaxes", "letX");
    sendMessage({ request: "anchor", data: dom });
    webTableDetails = null;
    // make xpath to 0 so it can be used again
    tagArrHolder = [];
    dupArray.length = 0;
  }
  function extractXPathFormArray(sxp, anchorArr, tag) {
    for (const key in sxp) {
      let xpathNumber = sxp[key][0];
      let xpathValue = sxp[key][1];
      let xpathData = sxp[key][2];
      switch (xpathNumber) {
        case 1:
          // ID
          pushXPath(xpathData, anchorArr, tag, "id", 1, xpathValue);
          break;
        case 2:
          // Name
          pushXPath(xpathData, anchorArr, tag, "name", 2, xpathValue);
          break;
        case 3:
          // CLASS
          pushXPath(xpathData, anchorArr, tag, "class", 3, xpathValue);
          break;
        case 0:
          // LINK
          if (xpathData.startsWith("//") || xpathData.startsWith("(")) {
            // let temp = xpathData.substring(0, xpathData.lastIndexOf(')'));
            if (xpathData.startsWith("//")) {
              xpathData = xpathData.substring(2, xpathData.length);
              anchorArr.push([0, xpathData, xpathValue]);
            } else if (xpathData.startsWith("(//")) {
              xpathData = xpathData.substring(3, xpathData.lastIndexOf(")"));
              anchorArr.push([0, xpathData, xpathValue]);
            }
          } else {
            let temp = `${tag}[text()[normalize-space()='${xpathData}']]`;
            anchorArr.push([0, temp, xpathValue]);
          }
          break;
        case 10:
          // TAG
          anchorArr.push([10, tag, xpathValue]);
          break;
        default:
          // Others
          if (xpathData.startsWith("//") || xpathData.startsWith("(")) {
            // let temp = xpathData.substring(0, xpathData.lastIndexOf(')'));
            if (xpathData.startsWith("//")) {
              xpathData = xpathData.substring(2, xpathData.length);
              anchorArr.push([2, xpathData, xpathValue]);
            } else if (xpathData.startsWith("(//")) {
              xpathData = xpathData.substring(3, xpathData.lastIndexOf(")"));
              anchorArr.push([-1, xpathData, xpathValue]);
            }
          }
          break;
      }
    }
  }
  function pushXPath(xpathData, anchorArr, tag, attr, number, xpathValue) {
    if (xpathData.startsWith("//") || xpathData.startsWith("(")) {
      // let temp = xpathData.substring(0, xpathData.lastIndexOf(')'));
      if (xpathData.startsWith("//")) {
        xpathData = xpathData.substring(2, xpathData.length);
        anchorArr.push([number, xpathData, xpathValue]);
      } else if (xpathData.startsWith("(//")) {
        xpathData = xpathData.substring(3, xpathData.lastIndexOf(")"));
        anchorArr.push([number, xpathData, xpathValue]);
      }
    } else {
      let temp = `${tag}[@${attr}='${xpathData}']`;
      anchorArr.push([number, temp, xpathValue]);
    }
  }
}
