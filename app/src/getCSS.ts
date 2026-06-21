import { state } from "./state";
import { filterAttributesFromElement } from "./utils";

export const checkforInt = (id: string): boolean => {
  return new RegExp("\\d{2,}", "g").test(id);
};

export function getLongCssPath(ele: HTMLElement): string {
  const doc = ele.ownerDocument;
  const path: string[] = [];
  let current: HTMLElement | null = ele;

  while (current && current.nodeType === 1) {
    const tag = current.tagName.toLowerCase();
    const id = current.id;

    // 1. If it has a unique ID, use it and stop
    if (id && !checkforInt(id)) {
      const idSelector = `#${CSS.escape(id)}`;
      try {
        if (doc.querySelectorAll(idSelector).length === 1) {
          path.unshift(idSelector);
          break;
        }
      } catch (e) {}
    }

    // 2. Try using classes
    let className = current.className;
    if (className && typeof (className as any).animVal === "string") {
      className = (className as any).animVal;
    }
    let selector = tag;
    if (typeof className === "string" && className.trim()) {
      const classes = className.trim().split(/\s+/).filter(Boolean);
      if (classes.length > 0) {
        selector += `.${classes.map((c) => CSS.escape(c)).join(".")}`;
      }
    }

    // Check if the current partial path is unique
    const currentPath = [selector, ...path].join(" > ");
    try {
      if (doc.querySelectorAll(currentPath).length === 1) {
        path.unshift(selector);
        break;
      }
    } catch (e) {}

    // 3. Fallback to nth-of-type
    let sibling = current;
    let position = 1;
    while (sibling && (sibling = sibling.previousElementSibling as HTMLElement)) {
      if (sibling.tagName.toLowerCase() === tag) {
        position++;
      }
    }

    let nthSelector = tag;
    if (position > 1) {
      nthSelector += `:nth-of-type(${position})`;
    }

    // Check if class with nth-of-type makes it unique
    if (selector !== tag) {
      let classNth = selector;
      if (position > 1) {
        classNth += `:nth-of-type(${position})`;
      }
      const testPath = [classNth, ...path].join(" > ");
      try {
        if (doc.querySelectorAll(testPath).length === 1) {
          path.unshift(classNth);
          break;
        }
      } catch (e) {}
    }

    path.unshift(position > 1 ? nthSelector : selector);
    current = current.parentNode as HTMLElement | null;
  }

  return path.join(" > ");
}

export function getClassCSS(ele: HTMLElement): void {
  let clickedItemClass = ele.className;
  if (typeof clickedItemClass !== "string") {
    if (clickedItemClass && typeof (clickedItemClass as any).animVal === "string") {
      clickedItemClass = (clickedItemClass as any).animVal;
    } else {
      return;
    }
  }
  let clscss = clickedItemClass.replace(/ /g, ".").replace(/\.\.+/g, ".");
  const spl = clscss.split(".");
  if (!(spl.length > 3)) {
    clscss = `${ele.tagName.toLowerCase()}.${clscss}`;
    try {
      if (ele.ownerDocument.querySelectorAll(clscss).length == 1) {
        state.CSSPATHDATA.push([3, "Unique class", clscss]);
      }
    } catch (e) {}
  }
}

export function getCSS(element: HTMLElement, tagName: string): void {
  state.CSSPATHDATA = [];
  Array.prototype.slice.call(element.attributes).forEach(function (item: Attr) {
    if (!filterAttributesFromElement(item)) {
      switch (item.name) {
        case "id":
          const id = `${tagName}#${item.value}`;
          state.CSSPATHDATA.push([0, "Css", id]);
          break;
        case "class":
          const classN = `${tagName}.${item.value}`;
          state.CSSPATHDATA.push([0, "Css", classN]);
          break;
        default:
          const attribuitesBased = `${tagName}[${item.name}='${item.value}']`;
          state.CSSPATHDATA.push([0, "Css", attribuitesBased]);
          break;
      }
    }
  });
}

export function extractElefromNode(ele: HTMLElement, array: string[]): number | null {
  if (ele.hasAttribute("id")) {
    if (state.elementOwnerDocument.querySelectorAll(`[id='${ele.id}']`).length == 1) {
      return array.unshift(`//${ele.tagName.toLowerCase()}[@id='${ele.id}']`);
    }
  } else if (ele.hasAttribute("name")) {
    const nameAttr = ele.getAttribute("name");
    if (
      nameAttr &&
      state.elementOwnerDocument.querySelectorAll(`[name='${nameAttr}']`).length == 1
    ) {
      return array.unshift(`//${ele.tagName.toLowerCase()}[@name='${nameAttr}']`);
    }
  }
  return null;
}

export function getXPathWithPosition(ele: HTMLElement): string {
  const rowsPath: string[] = [];
  let current: HTMLElement | null = ele;
  while (current && current.nodeType === 1) {
    let tag = current.tagName.toLowerCase();
    if (extractElefromNode(current, rowsPath) != null) {
      break;
    } else {
      let prevSib: Element | null = current;
      let position = 1;
      while (prevSib && (prevSib = prevSib.previousElementSibling)) {
        if (prevSib.tagName.toLowerCase() == tag) position++;
      }
      tag += `[${position}]`;
    }
    rowsPath.unshift(tag);
    current = current.parentNode as HTMLElement | null;
  }
  return rowsPath.join("/");
}
