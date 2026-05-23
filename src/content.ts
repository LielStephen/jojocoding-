type ScanResponse = {
  code: string;
  source: string;
  language: string;
  url: string;
};

type PasteResponse = {
  ok?: boolean;
  error?: string;
};

let lastEditableElement: HTMLElement | HTMLTextAreaElement | HTMLInputElement | null = null;

function normalizeWhitespace(text: string) {
  return text.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
}

function isEditableElement(
  element: Element | null,
): element is HTMLElement | HTMLTextAreaElement | HTMLInputElement {
  if (!element) {
    return false;
  }

  if (element instanceof HTMLTextAreaElement) {
    return !element.disabled && !element.readOnly;
  }

  if (element instanceof HTMLInputElement) {
    const allowedTypes = ['text', 'search', 'url', 'email', 'tel', 'password'];
    return allowedTypes.includes(element.type) && !element.disabled && !element.readOnly;
  }

  if (element instanceof HTMLElement) {
    return element.isContentEditable;
  }

  return false;
}

function isVisible(element: Element) {
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function rememberEditableTarget(element: EventTarget | null) {
  if (!(element instanceof Element)) {
    return;
  }

  if (isEditableElement(element) && isVisible(element)) {
    lastEditableElement = element;
    return;
  }

  const nestedEditable = element.closest(
    'textarea, input, [contenteditable]:not([contenteditable="false"])',
  );
  if (nestedEditable && isEditableElement(nestedEditable) && isVisible(nestedEditable)) {
    lastEditableElement = nestedEditable;
  }
}

function getEditorCandidate() {
  if (lastEditableElement && document.contains(lastEditableElement) && isVisible(lastEditableElement)) {
    return lastEditableElement;
  }

  if (isEditableElement(document.activeElement) && isVisible(document.activeElement)) {
    return document.activeElement;
  }

  const fallback = document.querySelector(
    'textarea, .monaco-editor textarea, .cm-editor [contenteditable]:not([contenteditable="false"]), [contenteditable]:not([contenteditable="false"]), input[type="text"], input[type="search"]',
  );

  if (fallback && isEditableElement(fallback) && isVisible(fallback)) {
    return fallback;
  }

  return null;
}

function setTextInputValue(element: HTMLTextAreaElement | HTMLInputElement, code: string) {
  const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');

  descriptor?.set?.call(element, code);
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

function pasteIntoEditor(code: string): PasteResponse {
  const target = getEditorCandidate();

  if (!target) {
    return {
      error: 'No editable code field was found on this page. Click inside the editor first, then try again.',
    };
  }

  target.focus();

  if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
    setTextInputValue(target, code);
    return { ok: true };
  }

  if (target.isContentEditable) {
    const selection = document.getSelection();
    if (selection && document.activeElement === target) {
      const inserted = document.execCommand('selectAll');
      document.execCommand('insertText', false, code);
      if (!inserted) {
        target.textContent = code;
      }
    } else {
      target.textContent = code;
    }

    target.dispatchEvent(new InputEvent('input', { bubbles: true, data: code, inputType: 'insertText' }));
    target.dispatchEvent(new Event('change', { bubbles: true }));
    return { ok: true };
  }

  return {
    error: 'The detected editor could not be updated.',
  };
}

function guessLanguage(element: Element) {
  const classText = `${element.className ?? ''} ${element.getAttribute('data-language') ?? ''}`.toLowerCase();
  const candidates = [
    'typescript',
    'javascript',
    'python',
    'java',
    'csharp',
    'cpp',
    'rust',
    'go',
    'sql',
    'html',
    'css',
    'json',
    'bash',
  ];

  const found = candidates.find((candidate) => classText.includes(candidate));
  return found ?? 'unknown';
}

function getSelectionCode() {
  const selection = window.getSelection()?.toString() ?? '';
  const normalized = normalizeWhitespace(selection);

  if (normalized.length < 24) {
    return null;
  }

  return {
    code: normalized,
    source: 'Selected text',
    language: 'unknown',
    url: window.location.href,
  } satisfies ScanResponse;
}

function getBestCodeBlock() {
  const blocks = Array.from(document.querySelectorAll('pre, code'))
    .map((element) => {
      const code = normalizeWhitespace(element.textContent ?? '');
      return {
        code,
        source: element.tagName.toLowerCase() === 'pre' ? '<pre> block' : '<code> block',
        language: guessLanguage(element),
      };
    })
    .filter((block) => block.code.length >= 24)
    .sort((left, right) => right.code.length - left.code.length);

  if (!blocks.length) {
    return null;
  }

  const best = blocks[0];
  return {
    ...best,
    url: window.location.href,
  } satisfies ScanResponse;
}

document.addEventListener('focusin', (event) => {
  rememberEditableTarget(event.target);
});

document.addEventListener('pointerdown', (event) => {
  rememberEditableTarget(event.target);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'CODE_STAND_SCAN') {
    const selection = getSelectionCode();
    const block = selection ?? getBestCodeBlock();

    if (!block) {
      sendResponse({
        error: 'No code block or meaningful code selection was found on this page.',
      });
      return;
    }

    sendResponse(block);
    return;
  }

  if (message?.type === 'CODE_STAND_PASTE') {
    const code = typeof message.code === 'string' ? message.code : '';
    sendResponse(pasteIntoEditor(code));
    return;
  }
});
