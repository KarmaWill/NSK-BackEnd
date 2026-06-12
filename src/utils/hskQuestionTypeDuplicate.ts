import { editorFlagsFromFeatures, resolveTypeFeatures } from '../config/hskTypeEditConfig';
import type { HskQuestionTypeCode, HskQuestionTypeDef, HskSectionModule } from '../types/hskExams';

export function suggestDuplicateTypeName(name: string): string {
  const m = name.match(/^(.+?)\s+V(\d+)\.(\d+)$/);
  if (m) {
    return `${m[1]} V${m[2]}.${Number(m[3]) + 1}`;
  }
  return `${name} V2.0`;
}

function nextAvailableTypeId(
  sectionPrefix: string,
  existingIds: Set<string>,
): HskQuestionTypeCode | null {
  for (let i = 1; i <= 99; i += 1) {
    const candidate = `${sectionPrefix}${String(i).padStart(2, '0')}` as HskQuestionTypeCode;
    if (!existingIds.has(candidate)) return candidate;
  }
  return null;
}

export function nextAvailableTypeIdForSection(
  section: HskSectionModule,
  existingTypes: HskQuestionTypeDef[],
): HskQuestionTypeCode | null {
  const prefix = section === 'listening' ? 'L' : section === 'writing' ? 'W' : 'R';
  return nextAvailableTypeId(prefix, new Set(existingTypes.map((t) => t.id)));
}

export function createBlankQuestionType(
  existingTypes: HskQuestionTypeDef[],
  section: HskSectionModule = 'reading',
): HskQuestionTypeDef {
  const id = nextAvailableTypeIdForSection(section, existingTypes) ?? ('R01' as HskQuestionTypeCode);
  return {
    id,
    hskTypeCode: id,
    name: '',
    section,
    description: '',
    defaultScore: 2,
    hskLevels: [1, 2, 3, 4, 5, 6],
    difficulty: '★★☆☆☆',
    isPublished: false,
    answerMode: 'single_choice',
    defaultOptionCount: 4,
    lastModified: new Date().toISOString().slice(0, 10),
  };
}

export function buildDuplicateQuestionType(
  source: HskQuestionTypeDef,
  existingTypes: HskQuestionTypeDef[],
): HskQuestionTypeDef | null {
  const existingIds = new Set(existingTypes.map((t) => t.id));
  const sectionPrefix = source.id.charAt(0);
  const id = nextAvailableTypeId(sectionPrefix, existingIds);
  if (!id) return null;

  const features = resolveTypeFeatures(source);
  return {
    ...source,
    id,
    hskTypeCode: id,
    name: suggestDuplicateTypeName(source.name),
    isPublished: false,
    editorFieldFlags: source.editorFieldFlags ?? editorFlagsFromFeatures(features),
    lastModified: new Date().toISOString().slice(0, 10),
  };
}
