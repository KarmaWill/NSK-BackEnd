import type { HskPaperTemplate } from '../types/hskExams';

export type TemplateListReconciliation = {
  templates: HskPaperTemplate[];
  pendingTemplates: HskPaperTemplate[];
};

export function reconcileTemplateList(
  serverTemplates: HskPaperTemplate[],
  pendingTemplates: HskPaperTemplate[],
): TemplateListReconciliation {
  if (pendingTemplates.length === 0) {
    return { templates: serverTemplates, pendingTemplates: [] };
  }

  const serverIds = new Set(serverTemplates.map((template) => template.id));
  const stillPending = pendingTemplates.filter((template) => !serverIds.has(template.id));
  if (stillPending.length === 0) {
    return { templates: serverTemplates, pendingTemplates: [] };
  }

  const pendingIds = new Set(stillPending.map((template) => template.id));
  return {
    templates: [
      ...serverTemplates.filter((template) => !pendingIds.has(template.id)),
      ...stillPending,
    ],
    pendingTemplates: stillPending,
  };
}

export function removePendingTemplate(
  pendingTemplates: HskPaperTemplate[],
  templateId: string,
): HskPaperTemplate[] {
  return pendingTemplates.filter((template) => template.id !== templateId);
}
