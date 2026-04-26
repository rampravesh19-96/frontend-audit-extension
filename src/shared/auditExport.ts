import type { AuditHistoryItem } from './types';

const FALLBACK_HOSTNAME = 'unknown-site';
const FALLBACK_PAGE = 'current-page';

const sanitizeSegment = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || FALLBACK_PAGE;

const getSafeHostname = (item: AuditHistoryItem): string =>
  sanitizeSegment(item.hostname || item.url || FALLBACK_HOSTNAME);

const getSafeDate = (item: AuditHistoryItem): string => {
  const rawDate = item.createdAt ? item.createdAt.slice(0, 10) : '';
  return /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : 'unknown-date';
};

const getFilename = (item: AuditHistoryItem, extension: 'json' | 'csv'): string =>
  `frontend-audit-${getSafeHostname(item)}-${getSafeDate(item)}.${extension}`;

const downloadFile = (content: string, mimeType: string, filename: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const escapeCsvValue = (value: string | number): string => {
  const normalized = String(value);

  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  return normalized;
};

export const exportAuditAsJson = (item: AuditHistoryItem): void => {
  const payload = JSON.stringify(item, null, 2);
  downloadFile(payload, 'application/json', getFilename(item, 'json'));
};

export const exportAuditAsCsv = (item: AuditHistoryItem): void => {
  const rows: Array<Array<string | number>> = [
    ['Section', 'Field', 'Value'],
    ['Summary', 'URL', item.url || FALLBACK_PAGE],
    ['Summary', 'Hostname', item.hostname || FALLBACK_HOSTNAME],
    ['Summary', 'Created At', item.createdAt || ''],
    ['Scores', 'Overall Score', item.score.overallScore],
    ['Scores', 'SEO Score', item.score.seoScore],
    ['Scores', 'Accessibility Score', item.score.accessibilityScore],
    ['Scores', 'Image Score', item.score.imageScore],
    ['Audit Details', 'Page Title', item.result.pageTitle || ''],
    ['Audit Details', 'Meta Description', item.result.metaDescription || ''],
    ['Audit Details', 'H1 Count', item.result.h1Count],
    ['Audit Details', 'Image Count', item.result.imageCount],
    ['Audit Details', 'Images Missing Alt', item.result.imagesMissingAlt],
    ['Audit Details', 'Total Links Count', item.result.totalLinksCount],
    [
      'Audit Details',
      'Links Without Accessible Text',
      item.result.linksWithoutAccessibleText
    ],
    ['Issues', 'Category', 'Severity', 'Title', 'Recommendation']
  ];

  const issueRows = item.issues.map((issue) => [
    'Issues',
    issue.category,
    issue.severity,
    issue.title,
    issue.recommendation
  ]);

  const csv = [...rows, ...issueRows]
    .map((row) => row.map(escapeCsvValue).join(','))
    .join('\n');

  downloadFile(csv, 'text/csv;charset=utf-8', getFilename(item, 'csv'));
};
