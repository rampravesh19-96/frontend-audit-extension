import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { calculateAuditScore } from '../shared/auditScoring';
import { generateAuditIssues } from '../shared/auditIssues';
import {
  clearAuditHistory,
  getAuditHistory,
  saveAuditHistoryItem
} from '../shared/auditStorage';
import { exportAuditAsCsv, exportAuditAsJson } from '../shared/auditExport';
import {
  AUDIT_PAGE_REQUEST,
  AUDIT_PAGE_RESPONSE
} from '../shared/messages';
import type {
  AuditHistoryItem,
  AuditResult
} from '../shared/types';
import {
  categoryOrder,
  getScoreCards,
  getScoreRing,
  getScoreTone,
  getSeverityClasses,
  groupIssuesByCategory
} from './presentation';

type ViewState = 'empty' | 'loading' | 'result' | 'error';
type ResultSource = 'live' | 'history';

function MetricRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="max-w-[190px] text-right text-xs font-medium leading-5 text-slate-900">
        {value}
      </span>
    </div>
  );
}

function Section({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-panel">
      <div className="mb-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        ) : null}
      </div>
      <div className="space-y-2 text-sm text-slate-700">{children}</div>
    </section>
  );
}

function IssueCard({
  severity,
  title,
  description,
  recommendation
}: {
  severity: 'pass' | 'warning' | 'fail';
  title: string;
  description: string;
  recommendation: string;
}) {
  return (
    <article className={`rounded-xl border p-2.5 ${getSeverityClasses(severity)}`}>
      <div className="mb-1.5 flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold leading-5">{title}</h3>
        <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]">
          {severity}
        </span>
      </div>
      <p className="text-xs leading-5">{description}</p>
      <p className="mt-1.5 text-xs leading-5">
        <span className="font-semibold">Recommendation:</span> {recommendation}
      </p>
    </article>
  );
}

function HistorySection({
  items,
  onSelect,
  onClear
}: {
  items: AuditHistoryItem[];
  onSelect: (item: AuditHistoryItem) => void;
  onClear: () => void;
}) {
  return (
    <Section
      title="Recent Audits"
      description="Saved history from your latest successful page analyses."
    >
      <div className="mb-2 flex items-center justify-end">
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
        >
          Clear History
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs leading-5 text-slate-500">
          No saved audits yet. Run an analysis to build your history.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-left transition hover:border-slate-300 hover:bg-slate-50"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold leading-5 text-slate-900">{item.hostname}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {formatHistoryTimestamp(item.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-semibold ${getScoreTone(item.score.overallScore)}`}>
                    {item.score.overallScore}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                    overall
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600">
                <span>{item.issues.length} findings</span>
                <span className="font-medium text-slate-900">Open audit</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </Section>
  );
}

function ExportActions({
  onExportJson,
  onExportCsv
}: {
  onExportJson: () => void;
  onExportCsv: () => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={onExportJson}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
      >
        Export JSON
      </button>
      <button
        type="button"
        onClick={onExportCsv}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
      >
        Export CSV
      </button>
    </div>
  );
}

const RESTRICTED_PAGE_MESSAGE =
  'This page cannot be analyzed due to browser restrictions. Try opening a normal website.';
const NO_ACTIVE_TAB_MESSAGE =
  'No active tab found. Open a website and try again.';
const MAX_HISTORY_PREVIEW = 5;
const MAX_HISTORY_ITEMS = 20;

function isRestrictedUrl(url?: string): boolean {
  if (!url) {
    return false;
  }

  return (
    url.startsWith('chrome://') ||
    url.startsWith('brave://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('edge://') ||
    url.startsWith('about:') ||
    url.startsWith('https://chrome.google.com/webstore') ||
    url.startsWith('https://chromewebstore.google.com')
  );
}

async function getCurrentTab(): Promise<chrome.tabs.Tab> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab) {
    throw new Error(NO_ACTIVE_TAB_MESSAGE);
  }

  return tab;
}

async function sendAuditMessage(tabId: number): Promise<{
  type?: string;
  payload?: AuditResult | null;
  error?: string;
}> {
  return (await chrome.tabs.sendMessage(tabId, {
    type: AUDIT_PAGE_REQUEST
  })) as {
    type?: string;
    payload?: AuditResult | null;
    error?: string;
  };
}

async function injectContentScript(tabId: number): Promise<void> {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['content.js']
  });
}

function formatHistoryTimestamp(value: string): string {
  const date = new Date(value);

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function getHistoryId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return Date.now().toString();
}

function createExportableAuditItem(params: {
  selectedAudit: AuditHistoryItem | null;
  result: AuditResult | null;
  score: AuditHistoryItem['score'] | null;
  issues: AuditHistoryItem['issues'];
}): AuditHistoryItem | null {
  const { selectedAudit, result, score, issues } = params;

  if (selectedAudit) {
    return selectedAudit;
  }

  if (!result || !score) {
    return null;
  }

  return {
    id: getHistoryId(),
    url: '',
    hostname: 'current-page',
    createdAt: new Date().toISOString(),
    result,
    score,
    issues
  };
}

export default function App() {
  const [viewState, setViewState] = useState<ViewState>('empty');
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string>('');
  const [history, setHistory] = useState<AuditHistoryItem[]>([]);
  const [selectedAudit, setSelectedAudit] = useState<AuditHistoryItem | null>(null);
  const [resultSource, setResultSource] = useState<ResultSource>('live');

  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      const storedHistory = await getAuditHistory();

      if (isMounted) {
        setHistory(storedHistory);
      }
    };

    void loadHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAnalyze = async () => {
    setViewState('loading');
    setError('');

    try {
      const tab = await getCurrentTab();
      console.log('[Frontend Audit] Active tab id:', tab.id);
      console.log('[Frontend Audit] Active tab url:', tab.url);
      console.log(
        '[Frontend Audit] isRestrictedUrl:',
        isRestrictedUrl(tab.url)
      );

      if (!tab.id) {
        throw new Error(NO_ACTIVE_TAB_MESSAGE);
      }

      if (tab.url && isRestrictedUrl(tab.url)) {
        throw new Error(RESTRICTED_PAGE_MESSAGE);
      }

      let response: {
        type?: string;
        payload?: AuditResult | null;
        error?: string;
      };

      try {
        response = await sendAuditMessage(tab.id);
        console.log('[Frontend Audit] Initial sendMessage response:', response);
      } catch (messageError) {
        console.warn(
          '[Frontend Audit] sendMessage failed, trying injection:',
          messageError
        );
        await injectContentScript(tab.id);
        response = await sendAuditMessage(tab.id);
        console.log('[Frontend Audit] Injection retry succeeded:', response);
      }

      if (response.type !== AUDIT_PAGE_RESPONSE || !response.payload) {
        throw new Error(
          response.error ?? 'Unable to connect to the page analyzer. Reload the page and try again.'
        );
      }

      const score = calculateAuditScore(response.payload);
      const issues = generateAuditIssues(response.payload);
      const hostname = tab.url ? new URL(tab.url).hostname : 'Unknown host';
      const historyItem: AuditHistoryItem = {
        id: getHistoryId(),
        url: tab.url ?? '',
        hostname,
        createdAt: new Date().toISOString(),
        result: response.payload,
        score,
        issues
      };

      void saveAuditHistoryItem(historyItem);
      setHistory((currentHistory) => [historyItem, ...currentHistory].slice(0, MAX_HISTORY_ITEMS));
      setResult(response.payload);
      setSelectedAudit(historyItem);
      setResultSource('live');
      setViewState('result');
    } catch (err) {
      setResult(null);
      setSelectedAudit(null);
      setError(
        err instanceof Error &&
        (err.message.includes('Could not establish connection') ||
          err.message.includes('Receiving end does not exist'))
          ? 'Unable to connect to the page analyzer. Reload the page and try again.'
          : err instanceof Error
            ? err.message
            : 'The extension could not inspect this page.'
      );
      setViewState('error');
    }
  };

  const handleSelectHistoryItem = (item: AuditHistoryItem) => {
    setResult(item.result);
    setSelectedAudit(item);
    setResultSource('history');
    setError('');
    setViewState('result');
  };

  const handleClearHistory = async () => {
    await clearAuditHistory();
    setHistory([]);
  };

  const score = useMemo(
    () =>
      selectedAudit
        ? selectedAudit.score
        : result
          ? calculateAuditScore(result)
          : null,
    [result, selectedAudit]
  );
  const issues = useMemo(
    () =>
      selectedAudit
        ? selectedAudit.issues
        : result
          ? generateAuditIssues(result)
          : [],
    [result, selectedAudit]
  );
  const issuesByCategory = useMemo(
    () => groupIssuesByCategory(issues),
    [issues]
  );
  const scoreCards = score ? getScoreCards(score) : [];
  const historyPreview = history.slice(0, MAX_HISTORY_PREVIEW);
  const activeResult = selectedAudit?.result ?? result;
  const exportableAudit = useMemo(
    () =>
      createExportableAuditItem({
        selectedAudit,
        result: activeResult,
        score,
        issues
      }),
    [activeResult, issues, score, selectedAudit]
  );

  const handleExportJson = () => {
    if (!exportableAudit) {
      return;
    }

    exportAuditAsJson(exportableAudit);
  };

  const handleExportCsv = () => {
    if (!exportableAudit) {
      return;
    }

    exportAuditAsCsv(exportableAudit);
  };

  return (
    <main className="h-[600px] w-[420px] overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.18),_transparent_32%),linear-gradient(180deg,_#fffaf4_0%,_#f8fafc_42%,_#eef2ff_100%)] p-3 text-slate-900">
      <div className="flex h-full flex-col rounded-[26px] border border-white/70 bg-white/75 p-3.5 backdrop-blur">
        <div className="mb-3 shrink-0">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-600">
            Frontend Audit
          </p>
          <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-slate-900">
            Fast page quality snapshot
          </h1>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Review key SEO, accessibility, and image signals from the active tab.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAnalyze}
          className="mb-3 shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-500"
          disabled={viewState === 'loading'}
        >
          {viewState === 'loading' ? 'Analyzing...' : 'Analyze Current Page'}
        </button>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {viewState === 'empty' && (
            <Section
              title="Ready To Audit"
              description="Start an analysis to generate scores, issues, and page detail metrics."
            >
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-xs leading-5 text-slate-500">
                Open any normal website in the active tab, then run the audit to populate the report.
              </div>
            </Section>
          )}

          {viewState === 'loading' && (
            <Section
              title="Analyzing"
              description="Collecting DOM signals from the active page."
            >
              <div className="rounded-xl bg-slate-900 p-4 text-xs leading-5 text-slate-100">
                Collecting page signals and preparing the audit summary...
              </div>
            </Section>
          )}

          {viewState === 'error' && (
            <Section title="Analysis Error" description="The extension could not complete the audit.">
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-700">
                {error}
              </div>
            </Section>
          )}

          {viewState === 'result' && activeResult && score && (
            <div className="space-y-3">
              <section className="rounded-[24px] border border-slate-200 bg-slate-950 p-4 text-white shadow-panel">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-300">
                      {resultSource === 'history' ? 'Saved Audit' : 'Overall Score'}
                    </p>
                    {selectedAudit ? (
                      <p className="mt-1 text-xs text-slate-300">
                        {selectedAudit.hostname}
                        {selectedAudit.createdAt
                          ? ` | ${formatHistoryTimestamp(selectedAudit.createdAt)}`
                          : ''}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="mt-2 flex items-end justify-between gap-4">
                  <div>
                    <div className="flex items-end gap-2">
                      <span className="text-5xl font-semibold leading-none">
                        {score.overallScore}
                      </span>
                      <span className="pb-1 text-xs text-slate-300">/100</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-300">
                      Snapshot based on SEO, accessibility, and image quality signals.
                    </p>
                  </div>
                </div>
              </section>

              <Section
                title="Category Scores"
                description="A quick breakdown of the scoring model."
              >
                <ExportActions
                  onExportJson={handleExportJson}
                  onExportCsv={handleExportCsv}
                />
                <div className="grid grid-cols-3 gap-2">
                  {scoreCards.map((card) => (
                    <div
                      key={card.label}
                      className={`rounded-xl bg-slate-50 p-2.5 text-center ring-1 ${getScoreRing(card.value)}`}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {card.label}
                      </p>
                      <p className={`mt-1.5 text-2xl font-semibold ${getScoreTone(card.value)}`}>
                        {card.value}
                      </p>
                    </div>
                  ))}
                </div>
              </Section>

              <Section
                title="Audit Details"
                description="Raw DOM values used by the audit and scoring utilities."
              >
                <MetricRow label="Page title" value={activeResult.pageTitle || 'Missing'} />
                <MetricRow
                  label="Meta description"
                  value={activeResult.metaDescription || 'Missing'}
                />
                <MetricRow label="H1 count" value={activeResult.h1Count} />
                <MetricRow label="Total links" value={activeResult.totalLinksCount} />
                <MetricRow
                  label="Links without accessible text"
                  value={activeResult.linksWithoutAccessibleText}
                />
                <MetricRow label="Image count" value={activeResult.imageCount} />
                <MetricRow
                  label="Images missing alt text"
                  value={activeResult.imagesMissingAlt}
                />
              </Section>

              <Section
                title="Issues"
                description="Grouped findings with recommendations for the next iteration."
              >
                <div className="space-y-3">
                  {categoryOrder.map((category) => (
                    <div key={category}>
                      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                        {category}
                      </h3>
                      <div className="space-y-1.5">
                        {issuesByCategory[category].map((issue) => (
                          <IssueCard
                            key={issue.id}
                            severity={issue.severity}
                            title={issue.title}
                            description={issue.description}
                            recommendation={issue.recommendation}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              <HistorySection
                items={historyPreview}
                onSelect={handleSelectHistoryItem}
                onClear={() => void handleClearHistory()}
              />
            </div>
          )}

          {viewState !== 'result' && (
            <div className="mt-3">
              <HistorySection
                items={historyPreview}
                onSelect={handleSelectHistoryItem}
                onClear={() => void handleClearHistory()}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
