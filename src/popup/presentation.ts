import type {
  AuditCategory,
  AuditIssue,
  AuditScore,
  AuditSeverity
} from '../shared/types';

export const categoryOrder: AuditCategory[] = [
  'SEO',
  'Accessibility',
  'Images',
  'Performance'
];

export const groupIssuesByCategory = (
  issues: AuditIssue[]
): Record<AuditCategory, AuditIssue[]> => ({
  SEO: issues.filter((issue) => issue.category === 'SEO'),
  Accessibility: issues.filter((issue) => issue.category === 'Accessibility'),
  Images: issues.filter((issue) => issue.category === 'Images'),
  Performance: issues.filter((issue) => issue.category === 'Performance')
});

export const getSeverityClasses = (severity: AuditSeverity): string => {
  switch (severity) {
    case 'pass':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'warning':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'fail':
      return 'border-rose-200 bg-rose-50 text-rose-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
};

export const getScoreTone = (score: number): string => {
  if (score >= 90) {
    return 'text-emerald-600';
  }

  if (score >= 70) {
    return 'text-amber-500';
  }

  return 'text-rose-500';
};

export const getScoreRing = (score: number): string => {
  if (score >= 90) {
    return 'ring-emerald-200';
  }

  if (score >= 70) {
    return 'ring-amber-200';
  }

  return 'ring-rose-200';
};

export const getScoreCards = (
  score: AuditScore
): Array<{ label: string; value: number }> => [
  { label: 'SEO', value: score.seoScore },
  { label: 'Accessibility', value: score.accessibilityScore },
  { label: 'Images', value: score.imageScore }
];
