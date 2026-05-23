import type { FormEvent } from 'react';
import { useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ClipboardList,
  LoaderCircle,
  SearchCode,
  Sparkles,
  WandSparkles,
} from 'lucide-react';

type Mode = 'explain' | 'review' | 'improve';

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

const SAMPLE_CODE = `export async function fetchUserProfile(userId) {
  const response = await fetch("/api/users/" + userId);

  if (!response.ok) {
    return null;
  }

  const user = await response.json();
  return {
    id: user.id,
    name: user.name.trim(),
    lastLogin: new Date(user.last_login).toLocaleDateString(),
  };
}`;

const MODE_COPY: Record<
  Mode,
  {
    label: string;
    icon: typeof Sparkles;
    description: string;
    prompt: string;
  }
> = {
  explain: {
    label: 'Explain',
    icon: Sparkles,
    description: 'Break down what the code does in plain language.',
    prompt: 'Explain the intent and flow clearly. Call out anything non-obvious.',
  },
  review: {
    label: 'Review',
    icon: SearchCode,
    description: 'Focus on bugs, edge cases, and risky assumptions.',
    prompt: 'Review this code like a senior engineer. Be strict and specific.',
  },
  improve: {
    label: 'Improve',
    icon: WandSparkles,
    description: 'Suggest practical changes to make the code cleaner or stronger.',
    prompt: 'Propose precise improvements with the highest impact first.',
  },
};

export default function App() {
  const [mode, setMode] = useState<Mode>('explain');
  const [question, setQuestion] = useState(MODE_COPY.explain.prompt);
  const [code, setCode] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleModeChange = (nextMode: Mode) => {
    setMode(nextMode);
    setQuestion(MODE_COPY[nextMode].prompt);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!code.trim()) {
      setError('Paste some code before running the analysis.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode,
          question,
          code,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'The analysis request failed.');
      }

      setResult(payload.analysis as AnalysisResult);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Something went wrong while contacting the analyzer.';

      setError(message);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <div className="poster-noise pointer-events-none fixed inset-0 opacity-80" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(235,94,40,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(56,82,255,0.16),_transparent_30%)]" />

      <main className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="label-strip mb-3 inline-flex">AI code explanation and review tool</p>
            <h1 className="font-display text-5xl uppercase leading-none tracking-[0.08em] sm:text-7xl">
              Code Stand
            </h1>
            <p className="mt-4 max-w-2xl text-base text-[var(--muted)] sm:text-lg">
              Paste a snippet, choose what you need, and get a structured breakdown that stays
              specific to the code instead of drifting into vague advice.
            </p>
          </div>

          <div className="panel-surface max-w-sm border-[3px] border-[var(--ink)] p-4 shadow-[8px_8px_0_var(--shadow)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-[var(--ink)] bg-[var(--accent)]">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Analysis Engine
                </p>
                <p className="font-display text-2xl uppercase tracking-[0.08em]">AI Analyzer</p>
              </div>
            </div>
          </div>
        </header>

        <section className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <form
            className="panel-surface flex h-full flex-col border-[4px] border-[var(--ink)] p-5 shadow-[10px_10px_0_var(--shadow)]"
            onSubmit={handleSubmit}
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  Input
                </p>
                <h2 className="font-display text-3xl uppercase tracking-[0.08em]">Target Code</h2>
              </div>
              <div className="stamp">Precise output</div>
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-3">
              {(Object.entries(MODE_COPY) as Array<[Mode, (typeof MODE_COPY)[Mode]]>).map(
                ([modeKey, config]) => {
                  const Icon = config.icon;
                  const active = mode === modeKey;

                  return (
                    <button
                      key={modeKey}
                      className={`mode-card ${active ? 'mode-card-active' : ''}`}
                      onClick={() => handleModeChange(modeKey)}
                      type="button"
                    >
                      <Icon className="mb-3 h-5 w-5" />
                      <span className="font-display text-2xl uppercase tracking-[0.08em]">
                        {config.label}
                      </span>
                      <span className="mt-2 text-sm leading-5 text-[var(--muted)]">
                        {config.description}
                      </span>
                    </button>
                  );
                },
              )}
            </div>

            <label className="mb-3 block">
              <span className="mb-2 block font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                What do you want help with?
              </span>
              <input
                className="tool-input"
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Explain the async flow and point out any edge cases."
                value={question}
              />
            </label>

            <label className="flex min-h-0 flex-1 flex-col">
              <span className="mb-2 block font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                Paste code
              </span>
              <textarea
                className="tool-input min-h-[320px] flex-1 resize-y font-mono text-sm leading-6"
                onChange={(event) => setCode(event.target.value)}
                placeholder="Paste JavaScript, TypeScript, Python, Java, SQL, or any other code here."
                spellCheck={false}
                value={code}
              />
            </label>

            {error ? (
              <div className="mt-4 flex items-start gap-3 border-[3px] border-[var(--danger)] bg-[var(--danger-soft)] p-3 text-sm">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <p>{error}</p>
              </div>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button className="action-button flex-1" disabled={isLoading} type="submit">
                {isLoading ? (
                  <>
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                    Analyzing
                  </>
                ) : (
                  <>
                    <ClipboardList className="h-5 w-5" />
                    Run analysis
                  </>
                )}
              </button>
              <button
                className="secondary-button"
                onClick={() => setCode(SAMPLE_CODE)}
                type="button"
              >
                Load sample
              </button>
              <button
                className="secondary-button"
                onClick={() => {
                  setCode('');
                  setResult(null);
                  setError('');
                }}
                type="button"
              >
                Clear
              </button>
            </div>
          </form>

          <section className="panel-surface flex h-full flex-col border-[4px] border-[var(--ink)] p-5 shadow-[10px_10px_0_var(--shadow)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  Output
                </p>
                <h2 className="font-display text-3xl uppercase tracking-[0.08em]">
                  Breakdown
                </h2>
              </div>
              <div className="stamp">Structured</div>
            </div>

            {!result && !isLoading ? (
              <div className="flex flex-1 flex-col items-center justify-center border-[3px] border-dashed border-[var(--line)] bg-white/60 px-6 py-10 text-center">
                <CheckCircle2 className="mb-4 h-12 w-12 text-[var(--accent)]" />
                <p className="font-display text-3xl uppercase tracking-[0.08em]">Ready</p>
                <p className="mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">
                  The result panel will return a concise summary, key behaviors, risky parts,
                  concrete improvements, and a single recommended next step.
                </p>
              </div>
            ) : null}

            {isLoading ? (
              <div className="flex flex-1 flex-col items-center justify-center border-[3px] border-dashed border-[var(--line)] bg-white/60 px-6 py-10 text-center">
                <LoaderCircle className="mb-4 h-12 w-12 animate-spin text-[var(--accent)]" />
                <p className="font-display text-3xl uppercase tracking-[0.08em]">
                  Reading the target
                </p>
                <p className="mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">
                  The backend is generating a structured response so the UI can stay precise.
                </p>
              </div>
            ) : null}

            {result ? (
              <div className="flex flex-1 flex-col gap-5 overflow-y-auto pr-1">
                <div className="result-hero">
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/80">
                    Summary
                  </p>
                  <p className="mt-2 text-base leading-7 text-white">{result.summary}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <article className="result-card">
                    <p className="section-label">Intent</p>
                    <p className="mt-2 text-sm leading-6">{result.intent}</p>
                  </article>
                  <article className="result-card">
                    <p className="section-label">Confidence</p>
                    <p className="mt-2 text-sm uppercase tracking-[0.18em]">{result.confidence}</p>
                  </article>
                </div>

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
                  <div className="mt-3 grid gap-3">
                    {result.importantLines.map((item) => (
                      <div key={`${item.label}-${item.snippet}`} className="snippet-card">
                        <p className="font-display text-2xl uppercase tracking-[0.08em]">
                          {item.label}
                        </p>
                        <pre className="mt-2 overflow-x-auto rounded-md bg-[var(--ink)]/95 p-3 text-xs leading-6 text-[var(--paper)]">
                          <code>{item.snippet}</code>
                        </pre>
                        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{item.why}</p>
                      </div>
                    ))}
                  </div>
                </article>

                <div className="grid gap-4 md:grid-cols-2">
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
                </div>

                <article className="result-card border-[var(--accent)] bg-[var(--accent-soft)]">
                  <p className="section-label">Recommended next step</p>
                  <p className="mt-2 text-sm leading-6">{result.nextStep}</p>
                </article>
              </div>
            ) : null}
          </section>
        </section>
      </main>
    </div>
  );
}
