import { TemplateGroup } from "./types";

export const ACTION_LABELS = {
  textarea: ["snippet", "getAttribute", "sendKeys"],
  input: {
    click: ["snippet", "getAttribute", "click"],
    send: ["snippet", "getAttribute", "sendKeys"],
  },
  img: ["snippet", "getAttribute", "click"],
  default: ["snippet", "getAttribute", "click", "getText"],
};

export const DEFAULT_TEMPLATES: Record<"jscs" | "javacs", TemplateGroup> = {
  jscs: {
    click:
      "private ${vn} = ${lc};\nasync clickOn${mn}(){\n  await this.click(this.${vn})\n}",
    send: "private ${vn} = ${lc};\nasync enter${mn}(value){\n  await this.sendKeys(this.${vn}, value)\n}",
    text: "private ${vn} = ${lc};\nasync get${mn}Text(){\n  return await this.getText(this.${vn})\n}",
    attr: "private ${vn} = ${lc};\nasync get${mn}Attr(attribute){\n  return await this.getAttribute(this.${vn}, attribute)\n}",
  },
  javacs: {
    click:
      "${lc} private WebElement ${vn};\npublic void clickOn${mn}(){\n  this.click(this.${vn});\n}",
    send: "${lc} private WebElement ${vn};\npublic void enter${mn}(String value){\n  this.type(this.${vn}, value);\n}",
    text: "${lc} private WebElement ${vn};\npublic String get${mn}Text(){\n  return this.getText(this.${vn});\n}",
    attr: "${lc} private WebElement ${vn};\npublic String get${mn}Attr(String attribute){\n  return this.getAttribute(this.${vn}, attribute);\n}",
  },
};
