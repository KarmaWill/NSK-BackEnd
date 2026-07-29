import type { HskComposedPaper } from '../types/hskExams';

export function upsertPaperInList(
  papers: HskComposedPaper[],
  nextPaper: HskComposedPaper,
): HskComposedPaper[] {
  const index = papers.findIndex((paper) => paper.id === nextPaper.id);
  if (index < 0) return [nextPaper, ...papers];
  return papers.map((paper, paperIndex) => (paperIndex === index ? nextPaper : paper));
}

export function removePaperFromList(
  papers: HskComposedPaper[],
  paperId: string,
): HskComposedPaper[] {
  return papers.filter((paper) => paper.id !== paperId);
}
