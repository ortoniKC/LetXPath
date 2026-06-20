import { state } from './state';
import { searchAll } from './search';
import { parseDOM } from './content';

const ortoni = {
    parseSelectedDOM: () => {
        if (state.targetElemt) parseDOM(state.targetElemt);
    }
};

export function stopRecord(): void {
    state.elementOwnerDocument.removeEventListener("mouseover", mouseOver, true);
    state.elementOwnerDocument.removeEventListener("mouseout", mouseOut, true);

    let values = {
        date: Date.now().toString(),
        xpath: state.recordArray,
        xpathPOM: state.recordArrayPOM,
        title: state.elementOwnerDocument.title,
        URL: state.elementOwnerDocument.URL
    };
    chrome.storage.local.set({ "downloadData": values });
}

export function startRecording(): void {
    state.recordArray = [];
    state.elementOwnerDocument.addEventListener("mouseover", mouseOver, true);
    state.elementOwnerDocument.addEventListener("mouseout", mouseOut, true);
    state.elementOwnerDocument.addEventListener("click", doRecord, true);
}

export function doRecord(event: MouseEvent): void {
    if (state.isRecordEnabled) {
        event.stopPropagation();
        event.preventDefault();
        state.targetElemt = event.target as HTMLElement;
        ortoni.parseSelectedDOM();
        searchAll();
        try {
            state.recordArray = [];
            state.atrributesArray = [];
            state.webTableDetails = null;
        } catch (error) {
            state.recordArray = [];
            state.atrributesArray = [];
            state.webTableDetails = null;
        }
    }
}

function mouseOver(_event: MouseEvent): void {
    // legacy hover highlight placeholder
}

function mouseOut(_event: MouseEvent): void {
    // legacy hover highlight placeholder
}