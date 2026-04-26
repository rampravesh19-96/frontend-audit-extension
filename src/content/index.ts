import type { AuditResult } from '../shared/types';

const AUDIT_PAGE_REQUEST = 'AUDIT_PAGE_REQUEST';
const AUDIT_PAGE_RESPONSE = 'AUDIT_PAGE_RESPONSE';

console.log('[Frontend Audit] content script loaded');

const getAccessibleText = (element: HTMLAnchorElement): string => {
  const ariaLabel = element.getAttribute('aria-label')?.trim() ?? '';
  const title = element.getAttribute('title')?.trim() ?? '';
  const text = element.innerText.trim();

  return ariaLabel || title || text;
};

const analyzePage = (): AuditResult => {
  const pageTitle = document.title.trim();
  const metaDescription =
    document
      .querySelector<HTMLMetaElement>('meta[name="description"]')
      ?.content.trim() ?? '';
  const h1Count = document.querySelectorAll('h1').length;

  const images = Array.from(document.images);
  const imageCount = images.length;
  const imagesMissingAlt = images.filter((image) => !image.alt.trim()).length;

  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a'));
  const totalLinksCount = links.length;
  const linksWithoutAccessibleText = links.filter(
    (link) => getAccessibleText(link).length === 0
  ).length;

  return {
    pageTitle,
    metaDescription,
    h1Count,
    imageCount,
    imagesMissingAlt,
    totalLinksCount,
    linksWithoutAccessibleText
  };
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== AUDIT_PAGE_REQUEST) {
    return false;
  }

  console.log('[Frontend Audit] audit request received');

  try {
    sendResponse({
      type: AUDIT_PAGE_RESPONSE,
      payload: analyzePage()
    });
  } catch (error) {
    sendResponse({
      type: AUDIT_PAGE_RESPONSE,
      payload: null,
      error: error instanceof Error ? error.message : 'Unknown analysis error'
    });
  }

  return false;
});
