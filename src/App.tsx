import { GoogleGenAI } from '@google/genai';
import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  KeyRound,
  LoaderCircle,
  ScanSearch,
  Sparkles,
  WandSparkles,
} from 'lucide-react';

type Mode = 'explain' | 'review' | 'improve';

type ScanPayload = {
  code: string;
  source: string;
  language: string;
  url: string;
};

type AnalysisResult = {
  summary: string;
  intent: string;
  confidence: 'high' | 'medium' | 'low';
  whatItDoes: string[];
  importantLines: Array<{
    label: string;
    snippet: string;
    why: string;
  }>;
  risks: string[];
  improvements: string[];
  nextStep: string;
};

const MODEL = 'gemini-2.5-flash';

const RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'summary',
    'intent',
    'confidence',
    'whatItDoes',
    'importantLines',
    'risks',
    'improvements',
    'nextStep',
  ],
  properties: {
    summary: { type: 'string' },
    intent: { type: 'string' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    whatItDoes: {
      type: 'array',
      items: { type: 'string' },
      minItems: 2,
      maxItems: 6,
    },
    importantLines: {
      type: 'array',
      minItems: 1,
      maxItems: 4,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['label', 'snippet', 'why'],
        properties: {
          label: { type: 'string' },
          snippet: { type: 'string' },
          why: { type: 'string' },
        },
      },
    },
    risks: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      maxItems: 5,
    },
    improvements: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      maxItems: 5,
    },
    nextStep: { type: 'string' },
  },
} as const;

const MODE_COPY: Record<
  Mode,
  {
    label: string;
    prompt: string;
    icon: typeof Sparkles;
  }
> = {
  explain: {
    label: 'Explain',
    prompt: 'Explain what this code does clearly and precisely.',
    icon: Sparkles,
  },
  review: {
    label: 'Review',
    prompt: 'Review this code for bugs, edge cases, and risky assumptions.',
    icon: ScanSearch,
  },
  improve: {
    label: 'Improve',
    prompt: 'Suggest the highest-value improvements for this code.',
    icon: WandSparkles,
  },
};

function getActiveTab() {
  return new Promise<chrome.tabs.Tab>((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }

      const tab = tabs[0];
      if (!tab?.id) {
        reject(new Error('No active tab found.'));
        return;
      }

      resolve(tab);
    });
  });
}

function scanActiveTab() {
  return new Promise<ScanPayload>((resolve, reject) => {
    getActiveTab()
      .then((tab) => {
        chrome.tabs.sendMessage(tab.id!, { type: 'CODE_STAND_SCAN' }, (response) => {
          const error = chrome.runtime.lastError;
          if (error) {
            reject(
              new Error(
                'Could not scan this tab. Try a normal webpage with visible code blocks.',
              ),
            );
            return;
          }

          if (response?.error) {
            reject(new Error(response.error));
            return;
          }

          resolve(response as ScanPayload);
        });
      })
      .catch(reject);
  });
}

function loadApiKey() {
  return new Promise<string>((resolve) => {
    chrome.storage.local.get(['geminiApiKey'], (result) => {
      resolve((result.geminiApiKey as string | undefined) ?? '');
    });
  });
}

function saveApiKey(apiKey: string) {
  return new Promise<void>((resolve) => {
    chrome.storage.local.set({ geminiApiKey: apiKey }, () => resolve());
  });
}

export default function App() {
  const [mode, setMode] = useState<Mode>('explain');
  const [question, setQuestion] = useState(MODE_COPY.explain.prompt);
  const [apiKey, setApiKey] = useState('');
  const [code, setCode] = useState('');
  const [source, setSource] = useState('');
  const [pageUrl, setPageUrl] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [status, setStatus] = useState('Ready to scan the current tab.');
  const [error, setError] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadApiKey().then(setApiKey);
  }, []);

  const changeMode = (nextMode: Mode) => {
    setMode(nextMode);
    setQuestion(MODE_COPY[nextMode].prompt);
  };

  const handleSaveKey = async () => {
    setIsSavingKey(true);
    await saveApiKey(apiKey.trim());
    setIsSavingKey(false);
    setStatus('API key saved in local extension storage.');
  };

  const handleScan = async () => {
    setIsScanning(true);
    setError('');

    try {
      const payload = await scanActiveTab();
      setCode(payload.code);
      setSource(payload.source);
      setPageUrl(payload.url);
      setResult(null);
      setStatus(`Captured ${payload.source}${payload.language !== 'unknown' ? ` (${payload.language})` : ''}.`);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : 'Scan failed.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleAnalyze = async () => {
    if (!apiKey.trim()) {
      setError('Add your Gemini API key first.');
      return;
    }

    if (!code.trim()) {
      setError('Scan a page or paste code before analyzing.');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
      const prompt = [
        'You are a precise senior software engineer.',
        'Use only the supplied code and request.',
        'Be concise, concrete, and specific.',
        `Mode: ${mode}`,
        `Request: ${question.trim() || MODE_COPY[mode].prompt}`,
        pageUrl ? `Source URL: ${pageUrl}` : '',
        source ? `Captured from: ${source}` : '',
        'Code:',
        code,
      ]
        .filter(Boolean)
        .join('\n\n');

      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseJsonSchema: RESPONSE_SCHEMA,
        },
      });

      if (!response.text) {
        throw new Error('The model returned an empty response.');
      }

      setResult(JSON.parse(response.text) as AnalysisResult);
      setStatus(`Analysis complete with ${MODEL}.`);
    } catch (analyzeError) {
      setError(analyzeError instanceof Error ? analyzeError.message : 'Analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="popup-shell">
      <div className="popup-panel">
        <header className="header-strip">
          <div>
            <p className="micro-label">Chrome Extension</p>
            <h1 className="title">Code Stand</h1>
          </div>
          <div className="version-pill">v1.1</div>
        </header>

        <section className="section-block">
          <div className="section-title-row">
            <span className="section-label">Gemini API key</span>
            <KeyRound className="h-4 w-4" />
          </div>
          <div className="key-row">
            <input
              className="tool-input"
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="Paste your Gemini API key"
              type="password"
              value={apiKey}
            />
            <button className="mini-button" onClick={handleSaveKey} type="button">
              {isSavingKey ? '...' : 'Save'}
            </button>
          </div>
        </section>

        <section className="section-block">
          <div className="mode-grid">
            {(Object.entries(MODE_COPY) as Array<[Mode, (typeof MODE_COPY)[Mode]]>).map(
              ([modeKey, config]) => {
                const Icon = config.icon;
                return (
                  <button
                    key={modeKey}
                    className={`mode-card ${mode === modeKey ? 'mode-card-active' : ''}`}
                    onClick={() => changeMode(modeKey)}
                    type="button"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{config.label}</span>
                  </button>
                );
              },
            )}
          </div>

          <textarea
            className="tool-input prompt-box"
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Optional: ask for a more specific explanation."
            spellCheck={false}
            value={question}
          />
        </section>

        <section className="section-block">
          <div className="section-title-row">
            <span className="section-label">Current page code</span>
            <button className="mini-button" onClick={handleScan} type="button">
              {isScanning ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Scanning
                </>
              ) : (
                <>
                  <ScanSearch className="h-4 w-4" />
                  Scan tab
                </>
              )}
            </button>
          </div>
          <p className="status-line">{status}</p>
          {source ? <p className="source-line">{source}</p> : null}
          <textarea
            className="tool-input code-box"
            onChange={(event) => setCode(event.target.value)}
            placeholder="Scan a page or paste code here manually."
            spellCheck={false}
            value={code}
          />
        </section>

        {error ? (
          <div className="error-box">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <button className="action-button" onClick={handleAnalyze} type="button">
          {isAnalyzing ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Analyzing
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Analyze code
            </>
          )}
        </button>

        {result ? (
          <section className="result-panel">
            <article className="result-card hero-card">
              <p className="section-label">Summary</p>
              <p className="result-copy">{result.summary}</p>
            </article>

            <article className="result-card">
              <p className="section-label">Intent</p>
              <p className="result-copy">{result.intent}</p>
            </article>

            <article className="result-card">
              <p className="section-label">What it does</p>
              <ul className="result-list">
                {result.whatItDoes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="result-card">
              <p className="section-label">Important lines</p>
              <div className="snippet-list">
                {result.importantLines.map((item) => (
                  <div key={`${item.label}-${item.snippet}`} className="snippet-card">
                    <p className="snippet-title">{item.label}</p>
                    <pre className="snippet-pre">
                      <code>{item.snippet}</code>
                    </pre>
                    <p className="result-copy">{item.why}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="result-card">
              <p className="section-label">Risks</p>
              <ul className="result-list">
                {result.risks.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="result-card">
              <p className="section-label">Improvements</p>
              <ul className="result-list">
                {result.improvements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="result-card next-step-card">
              <div className="section-title-row">
                <span className="section-label">Next step</span>
                <Check className="h-4 w-4" />
              </div>
              <p className="result-copy">{result.nextStep}</p>
            </article>
          </section>
        ) : null}
      </div>
    </div>
  );
}
