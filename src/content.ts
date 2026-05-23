type ScanResponse = {
  code: string;
  source: string;
  language: string;
  url: string;
};

function normalizeWhitespace(text: string) {
  return text.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
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

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'CODE_STAND_SCAN') {
    return;
  }

  const selection = getSelectionCode();
  const block = selection ?? getBestCodeBlock();

  if (!block) {
    sendResponse({
      error: 'No code block or meaningful code selection was found on this page.',
    });
    return;
  }

  sendResponse(block);
});
