function isValidXPath(expr) {
  return (
    typeof expr != "undefined" &&
    expr.replace(/[\s-_=]/g, "") !== "" &&
    expr.length ===
      expr.replace(
        /[-_\w:.]+\(\)\s*=|=\s*[-_\w:.]+\(\)|\sor\s|\sand\s|\[(?:[^\/\]]+[\/\[]\/?.+)+\]|starts-with\(|\[.*last\(\)\s*[-\+<>=].+\]|number\(\)|not\(|count\(|text\(|first\(|normalize-space|[^\/]following-sibling|concat\(|descendant::|parent::|self::|child::|/gi,
        ""
      ).length
  );
}

function getValidationRegex() {
  let regex =
    "(?P<node>" +
    "(" +
    "^id\\([\"\\']?(?P<idvalue>%(value)s)[\"\\']?\\)" + // special case! `id(idValue)`
    "|" +
    "(?P<nav>//?(?:following-sibling::)?)(?P<tag>%(tag)s)" + //  `//div`
    "(\\[(" +
    "(?P<matched>(?P<mattr>@?%(attribute)s=[\"\\'](?P<mvalue>%(value)s))[\"\\']" + // `[@id="well"]` supported and `[text()="yes"]` is not
    "|" +
    "(?P<contained>contains\\((?P<cattr>@?%(attribute)s,\\s*[\"\\'](?P<cvalue>%(value)s)[\"\\']\\))" + // `[contains(@id, "bleh")]` supported and `[contains(text(), "some")]` is not
    ")\\])?" +
    "(\\[\\s*(?P<nth>\\d+|last\\(\\s*\\))\\s*\\])?" +
    ")" +
    ")";

  const subRegexes = {
    tag: "([a-zA-Z][a-zA-Z0-9:-]{0,20}|\\*)",
    attribute: "[.a-zA-Z_:][-\\w:.]*(\\(\\))?)",
    value: "\\s*[\\w/:][-/\\w\\s,:;.]*",
  };

  Object.keys(subRegexes).forEach((key) => {
    regex = regex.replace(
      new RegExp("%\\(" + key + "\\)s", "gi"),
      subRegexes[key]
    );
  });

  regex = regex.replace(
    /\?P<node>|\?P<idvalue>|\?P<nav>|\?P<tag>|\?P<matched>|\?P<mattr>|\?P<mvalue>|\?P<contained>|\?P<cattr>|\?P<cvalue>|\?P<nth>/gi,
    ""
  );

  return new RegExp(regex, "gi");
}

function preParseXpath(expr) {
  return expr.replace(
    /contains\s*\(\s*concat\(["']\s+["']\s*,\s*@class\s*,\s*["']\s+["']\)\s*,\s*["']\s+([a-zA-Z0-9-_]+)\s+["']\)/gi,
    '@class="$1"'
  );
}

function xPathToCss(expr) {
  if (!expr) {
    return "Missing XPath expression";
  }

  expr = preParseXpath(expr);

  if (!isValidXPath(expr)) {
    return "Invalid or unsupported XPath: " + expr;
  }

  const xPathArr = expr.split("|");
  const prog = getValidationRegex();
  const cssSelectors = [];
  let xindex = 0;

  while (xPathArr[xindex]) {
    const css = [];
    let position = 0;
    let nodes;

    while ((nodes = prog.exec(xPathArr[xindex]))) {
      let attr;

      if (!nodes && position === 0) {
        return "Invalid or unsupported XPath: " + expr;
      }

      const match = {
        node: nodes[5],
        idvalue: nodes[12] || nodes[3],
        nav: nodes[4],
        tag: nodes[5],
        matched: nodes[7],
        mattr: nodes[10] || nodes[14],
        mvalue: nodes[12] || nodes[16],
        contained: nodes[13],
        cattr: nodes[14],
        cvalue: nodes[16],
        nth: nodes[18],
      };

      let nav = "";

      if (position != 0 && match["nav"]) {
        if (~match["nav"].indexOf("following-sibling::")) {
          nav = " + ";
        } else {
          nav = match["nav"] == "//" ? " " : " > ";
        }
      }

      const tag = match["tag"] === "*" ? "" : match["tag"] || "";

      if (match["contained"]) {
        if (match["cattr"].indexOf("@") === 0) {
          attr =
            "[" +
            match["cattr"].replace(/^@/, "") +
            '*="' +
            match["cvalue"] +
            '"]';
        }
      } else if (match["matched"]) {
        switch (match["mattr"]) {
          case "@id":
            attr =
              "#" +
              match["mvalue"].replace(/^\s+|\s+$/, "").replace(/\s/g, "#");
            break;
          case "@class":
            attr =
              "." +
              match["mvalue"].replace(/^\s+|\s+$/, "").replace(/\s/g, ".");
            break;
          case "text()":
          case ".":
          default:
            if (match["mattr"].indexOf("@") !== 0) {
            }
            if (match["mvalue"].indexOf(" ") !== -1) {
              match["mvalue"] =
                '"' + match["mvalue"].replace(/^\s+|\s+$/, "") + '"';
            }
            attr =
              "[" +
              match["mattr"].replace("@", "") +
              '="' +
              match["mvalue"] +
              '"]';
            break;
        }
      } else if (match["idvalue"]) {
        attr = "#" + match["idvalue"].replace(/\s/, "#");
      } else {
        attr = "";
      }

      let nth = "";

      if (match["nth"]) {
        if (match["nth"].indexOf("last") === -1) {
          if (isNaN(parseInt(match["nth"], 10))) {
          }
          nth =
            parseInt(match["nth"], 10) !== 1
              ? ":nth-of-type(" + match["nth"] + ")"
              : ":first-of-type";
        } else {
          nth = ":last-of-type";
        }
      }

      css.push(nav + tag + attr + nth);
      position++;
    }

    const result = css.join("");

    if (result === "") {
      return "Invalid or unsupported XPath";
    }

    cssSelectors.push(result);
    xindex++;
  }

  return cssSelectors.join(", ");
}
