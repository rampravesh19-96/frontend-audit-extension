import type { AuditResult, AuditScore } from './types';

const clampScore = (score: number): number =>
  Math.max(0, Math.min(100, Math.round(score)));

export const calculateSeoScore = (result: AuditResult): number => {
  let score = 0;

  if (result.pageTitle) {
    score += 35;
  }

  if (result.metaDescription) {
    score += 35;
  }

  if (result.h1Count === 1) {
    score += 30;
  }

  return clampScore(score);
};

export const calculateAccessibilityScore = (result: AuditResult): number => {
  let score = 0;

  if (result.linksWithoutAccessibleText === 0) {
    score += 50;
  }

  if (result.imagesMissingAlt === 0) {
    score += 50;
  }

  return clampScore(score);
};

export const calculateImageScore = (result: AuditResult): number => {
  if (result.imageCount === 0) {
    return 100;
  }

  const imagesWithAlt = result.imageCount - result.imagesMissingAlt;
  const percentWithAlt = (imagesWithAlt / result.imageCount) * 100;

  return clampScore(percentWithAlt);
};

export const calculateAuditScore = (result: AuditResult): AuditScore => {
  const seoScore = calculateSeoScore(result);
  const accessibilityScore = calculateAccessibilityScore(result);
  const imageScore = calculateImageScore(result);
  const overallScore = clampScore(
    (seoScore + accessibilityScore + imageScore) / 3
  );

  return {
    overallScore,
    seoScore,
    accessibilityScore,
    imageScore
  };
};
