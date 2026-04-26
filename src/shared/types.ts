export interface AuditResult {
  pageTitle: string;
  metaDescription: string;
  h1Count: number;
  imageCount: number;
  imagesMissingAlt: number;
  totalLinksCount: number;
  linksWithoutAccessibleText: number;
}

export type AuditCategory = 'SEO' | 'Accessibility' | 'Images' | 'Performance';

export type AuditSeverity = 'pass' | 'warning' | 'fail';

export interface AuditScore {
  overallScore: number;
  seoScore: number;
  accessibilityScore: number;
  imageScore: number;
}

export interface AuditIssue {
  id: string;
  category: AuditCategory;
  severity: AuditSeverity;
  title: string;
  description: string;
  recommendation: string;
}

export interface AuditHistoryItem {
  id: string;
  url: string;
  hostname: string;
  createdAt: string;
  result: AuditResult;
  score: AuditScore;
  issues: AuditIssue[];
}

export interface AuditResponse {
  ok: boolean;
  result?: AuditResult;
  error?: string;
}
