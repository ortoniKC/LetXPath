import { state } from './state';
import { buildPlaywrightLocators } from './playwrightLocators';

function sendMessage(msg: any): Promise<any> {
    return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage(msg, (response) => {
                resolve(response);
            });
        } else {
            resolve(null);
        }
    });
}

function getBestLocators(element: HTMLElement) {
    // Invoke parseDOM to populate state.XPATHDATA and state.CSSPATHDATA
    if ((window as any).parseDOM) {
        (window as any).parseDOM(element);
    }

    const bestXPath = state.XPATHDATA && state.XPATHDATA.length > 0 ? state.XPATHDATA[0][2] : '';
    const bestCSS = state.CSSPATHDATA && state.CSSPATHDATA.length > 0 ? state.CSSPATHDATA[0][2] : '';
    
    const pwLocators = buildPlaywrightLocators(element, state.XPATHDATA, state.CSSPATHDATA);
    const bestPlaywright = pwLocators && pwLocators.length > 0 ? pwLocators[0] : null;

    return {
        xpath: bestXPath,
        css: bestCSS,
        playwright: bestPlaywright ? bestPlaywright[2] : '', // js value
        playwrightPy: bestPlaywright ? bestPlaywright[3] : '',
        playwrightJava: bestPlaywright ? bestPlaywright[4] : '',
        playwrightCS: bestPlaywright ? bestPlaywright[5] : '',
        variableName: state.variablename || 'ele',
        methodName: state.methodName || 'ele'
    };
}

export function recordClick(event: MouseEvent): void {
    if (!state.isRecordEnabled) return;

    const element = event.target as HTMLElement;
    if (!element) return;

    // Skip our own highlighted elements or overlay widgets
    if (element.getAttribute('letxxpath') === 'letX') return;

    const locators = getBestLocators(element);

    const step = {
        id: Math.random().toString(36).substring(2, 9),
        action: 'click',
        tag: element.tagName.toLowerCase(),
        type: element.getAttribute('type') || undefined,
        xpathLocator: locators.xpath,
        cssLocator: locators.css,
        playwrightLocator: locators.playwright,
        playwrightPy: locators.playwrightPy,
        playwrightJava: locators.playwrightJava,
        playwrightCS: locators.playwrightCS,
        variableName: locators.variableName,
        methodName: locators.methodName,
        url: element.ownerDocument.URL,
        title: element.ownerDocument.title,
        timestamp: Date.now()
    };

    // Store step in chrome.storage.local
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['recordedSteps'], (result) => {
            const steps = result.recordedSteps || [];
            steps.push(step);
            chrome.storage.local.set({ recordedSteps: steps });
        });
    } else {
        // Fallback for development
        const localSteps = JSON.parse(localStorage.getItem('recordedSteps') || '[]');
        localSteps.push(step);
        localStorage.setItem('recordedSteps', JSON.stringify(localSteps));
        // Dispatch custom event to notify local UI in preview
        window.dispatchEvent(new CustomEvent('recorded_steps_changed', { detail: localSteps }));
    }

    sendMessage({ request: "record_step", step });
}

export function recordChange(event: Event): void {
    if (!state.isRecordEnabled) return;

    const element = event.target as HTMLElement;
    if (!element) return;

    const tagName = element.tagName.toLowerCase();
    if (tagName !== 'input' && tagName !== 'textarea' && tagName !== 'select') return;

    if (tagName === 'input') {
        const type = (element as HTMLInputElement).type;
        // Skip clicks/buttons/checkbox/radio as they are covered by click events
        if (['button', 'submit', 'image', 'checkbox', 'radio', 'file'].includes(type)) return;
    }

    const value = (element as HTMLInputElement).value;
    const locators = getBestLocators(element);

    const step = {
        id: Math.random().toString(36).substring(2, 9),
        action: tagName === 'select' ? 'select' : 'fill',
        tag: tagName,
        type: element.getAttribute('type') || undefined,
        value: value,
        xpathLocator: locators.xpath,
        cssLocator: locators.css,
        playwrightLocator: locators.playwright,
        playwrightPy: locators.playwrightPy,
        playwrightJava: locators.playwrightJava,
        playwrightCS: locators.playwrightCS,
        variableName: locators.variableName,
        methodName: locators.methodName,
        url: element.ownerDocument.URL,
        title: element.ownerDocument.title,
        timestamp: Date.now()
    };

    // Store step in chrome.storage.local
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['recordedSteps'], (result) => {
            const steps = result.recordedSteps || [];
            steps.push(step);
            chrome.storage.local.set({ recordedSteps: steps });
        });
    } else {
        const localSteps = JSON.parse(localStorage.getItem('recordedSteps') || '[]');
        localSteps.push(step);
        localStorage.setItem('recordedSteps', JSON.stringify(localSteps));
        window.dispatchEvent(new CustomEvent('recorded_steps_changed', { detail: localSteps }));
    }

    sendMessage({ request: "record_step", step });
}

export function startRecording(): void {
    state.isRecordEnabled = true;
    
    // Add event listeners on the document
    document.removeEventListener("click", recordClick, true);
    document.removeEventListener("change", recordChange, true);
    
    document.addEventListener("click", recordClick, true);
    document.addEventListener("change", recordChange, true);
}

export function stopRecord(): void {
    state.isRecordEnabled = false;
    document.removeEventListener("click", recordClick, true);
    document.removeEventListener("change", recordChange, true);
}