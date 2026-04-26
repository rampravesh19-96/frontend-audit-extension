import type { AuditCategory, AuditIssue, AuditResult } from './types';

const createIssue = (
  id: string,
  category: AuditCategory,
  severity: AuditIssue['severity'],
  title: string,
  description: string,
  recommendation: string
): AuditIssue => ({
  id,
  category,
  severity,
  title,
  description,
  recommendation
});

export const generateAuditIssues = (result: AuditResult): AuditIssue[] => {
  const issues: AuditIssue[] = [];

  if (result.pageTitle) {
    issues.push(
      createIssue(
        'page-title-pass',
        'SEO',
        'pass',
        'Page title is present',
        'The page includes a title element.',
        'Keep the title concise, unique, and relevant to the page content.'
      )
    );
  } else {
    issues.push(
      createIssue(
        'page-title-missing',
        'SEO',
        'fail',
        'Missing page title',
        'The page does not include a document title.',
        'Add a unique <title> element that clearly describes the page.'
      )
    );
  }

  if (result.metaDescription) {
    issues.push(
      createIssue(
        'meta-description-pass',
        'SEO',
        'pass',
        'Meta description is present',
        'The page includes a meta description.',
        'Review the description to ensure it accurately summarizes the page.'
      )
    );
  } else {
    issues.push(
      createIssue(
        'meta-description-missing',
        'SEO',
        'warning',
        'Missing meta description',
        'Search engines may generate a snippet automatically when no description is provided.',
        'Add a descriptive meta description to improve search result previews.'
      )
    );
  }

  if (result.h1Count === 1) {
    issues.push(
      createIssue(
        'h1-pass',
        'SEO',
        'pass',
        'Exactly one H1 found',
        'The page has a single primary heading.',
        'Keep using one clear H1 to define the main topic of the page.'
      )
    );
  } else if (result.h1Count === 0) {
    issues.push(
      createIssue(
        'h1-missing',
        'SEO',
        'warning',
        'No H1 heading found',
        'The page does not have a top-level heading.',
        'Add one descriptive H1 heading that introduces the page content.'
      )
    );
  } else {
    issues.push(
      createIssue(
        'h1-multiple',
        'SEO',
        'warning',
        'Multiple H1 headings found',
        `The page contains ${result.h1Count} H1 elements.`,
        'Limit the page to one primary H1 where possible and use lower heading levels for sub-sections.'
      )
    );
  }

  if (result.linksWithoutAccessibleText === 0) {
    issues.push(
      createIssue(
        'links-accessible-pass',
        'Accessibility',
        'pass',
        'All links have accessible text',
        'Every inspected link exposes visible or accessible labeling.',
        'Continue providing clear text, aria-labels, or titles for interactive links.'
      )
    );
  } else {
    issues.push(
      createIssue(
        'links-accessible-fail',
        'Accessibility',
        'fail',
        'Links without accessible text',
        `${result.linksWithoutAccessibleText} link(s) do not expose readable accessible text.`,
        'Add visible text, an aria-label, or a descriptive title to unlabeled links.'
      )
    );
  }

  if (result.imagesMissingAlt === 0) {
    issues.push(
      createIssue(
        'images-alt-pass',
        'Accessibility',
        'pass',
        'Images include alt text',
        'All detected images have alt text.',
        'Keep alt text descriptive, or use empty alt text only for decorative images.'
      )
    );
  } else {
    issues.push(
      createIssue(
        'images-alt-fail',
        'Accessibility',
        'fail',
        'Images missing alt text',
        `${result.imagesMissingAlt} image(s) are missing alt text.`,
        'Add meaningful alt attributes, or set alt="" for decorative imagery.'
      )
    );
  }

  if (result.imageCount === 0) {
    issues.push(
      createIssue(
        'images-none-pass',
        'Images',
        'pass',
        'No images found',
        'The page does not contain any images to audit.',
        'No image accessibility action is needed for this page.'
      )
    );
  } else if (result.imagesMissingAlt === 0) {
    issues.push(
      createIssue(
        'images-complete-pass',
        'Images',
        'pass',
        'All images have alt text',
        `${result.imageCount} image(s) were found and all include alt text.`,
        'Maintain alt text coverage as images are added or updated.'
      )
    );
  } else {
    issues.push(
      createIssue(
        'images-complete-fail',
        'Images',
        'fail',
        'Image alt coverage needs improvement',
        `${result.imagesMissingAlt} of ${result.imageCount} image(s) are missing alt text.`,
        'Review image content and add appropriate alt attributes.'
      )
    );
  }

  issues.push(
    createIssue(
      'performance-info',
      'Performance',
      'pass',
      'Performance insights coming soon',
      'The current report focuses on fast DOM-based quality checks for SEO, accessibility, and image coverage.',
      'Add runtime performance metrics such as Core Web Vitals and resource timing in a future version.'
    )
  );

  return issues;
};
