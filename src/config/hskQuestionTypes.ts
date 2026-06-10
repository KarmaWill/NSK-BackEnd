import type { HskQuestionTypeCode, HskQuestionTypeDef, HskSectionModule } from '../types/hskExams';

const now = () => new Date().toISOString().slice(0, 10);

type SeedRow = Omit<HskQuestionTypeDef, 'hskTypeCode' | 'lastModified'>;

const rows: SeedRow[] = [
  { id: 'L01', name: '判断对错', section: 'listening', description: '听句判断真假', defaultScore: 2, hskLevels: [1, 2], difficulty: '★☆☆☆☆', isPublished: true },
  { id: 'L02', name: '看图选词', section: 'listening', description: '听音频选对应图片', defaultScore: 2, hskLevels: [1, 2], difficulty: '★★☆☆☆', isPublished: true },
  { id: 'L03', name: '听句选图', section: 'listening', description: '听句子选择对应图片', defaultScore: 2, hskLevels: [1, 2, 3], difficulty: '★★☆☆☆', isPublished: true },
  { id: 'L04', name: '听后选择', section: 'listening', description: '听对话后选答案', defaultScore: 2, hskLevels: [3, 4, 5], difficulty: '★★★☆☆', isPublished: true },
  { id: 'L05', name: '听后排序', section: 'listening', description: '听对话排列句子顺序', defaultScore: 2, hskLevels: [4, 5, 6], difficulty: '★★★★☆', isPublished: false },
  { id: 'L06', name: '短文多题', section: 'listening', description: '短文听力多道题', defaultScore: 2, hskLevels: [5, 6], difficulty: '★★★★☆', isPublished: true },
  { id: 'R01', name: '图文匹配', section: 'reading', description: '图片与句子对应', defaultScore: 2, hskLevels: [1, 2, 3], difficulty: '★☆☆☆☆', isPublished: true },
  { id: 'R02', name: '词句搭配', section: 'reading', description: '词语与句子配对', defaultScore: 2, hskLevels: [2, 3], difficulty: '★★☆☆☆', isPublished: true },
  { id: 'R03', name: '完型填空', section: 'reading', description: '从词库选词填入空白', defaultScore: 2, hskLevels: [3, 4, 5], difficulty: '★★★☆☆', isPublished: true },
  { id: 'R04', name: '阅读理解', section: 'reading', description: '读文章后选择答案', defaultScore: 2, hskLevels: [3, 4, 5, 6], difficulty: '★★★★☆', isPublished: true },
  { id: 'R05', name: '选词填空', section: 'reading', description: '选择恰当词语填空', defaultScore: 2, hskLevels: [4, 5, 6], difficulty: '★★★☆☆', isPublished: true },
  { id: 'R06', name: '句子排序', section: 'reading', description: '拖拽排列句子顺序', defaultScore: 2, hskLevels: [4, 5, 6], difficulty: '★★★★☆', isPublished: false },
  { id: 'R07', name: '段落理解', section: 'reading', description: '理解段落主旨', defaultScore: 2, hskLevels: [5, 6], difficulty: '★★★★★', isPublished: false },
  { id: 'W01', name: '看图组词', section: 'writing', description: '看图片组合词语', defaultScore: 2, hskLevels: [1, 2], difficulty: '★★☆☆☆', isPublished: true },
  { id: 'W02', name: '连词成句', section: 'writing', description: '拖拽词语排列成句', defaultScore: 2, hskLevels: [2, 3, 4], difficulty: '★★★☆☆', isPublished: true },
  { id: 'W03', name: '看图写句', section: 'writing', description: '看图片写句子', defaultScore: 2, hskLevels: [3, 4, 5], difficulty: '★★★★☆', isPublished: true },
  { id: 'W04', name: '命题作文', section: 'writing', description: '根据命题写短文，AI 评分', defaultScore: 10, hskLevels: [4, 5, 6], difficulty: '★★★★★', isPublished: false },
];

export const HSK_QUESTION_TYPE_DEFS: HskQuestionTypeDef[] = rows.map((row) => ({
  ...row,
  hskTypeCode: row.id,
  lastModified: now(),
}));

export const HSK_TYPE_CODES = HSK_QUESTION_TYPE_DEFS.map((t) => t.id);

export function getQuestionTypeDef(code: HskQuestionTypeCode) {
  return HSK_QUESTION_TYPE_DEFS.find((t) => t.id === code);
}

export function getSectionName(section: HskSectionModule) {
  switch (section) {
    case 'listening':
      return '听力';
    case 'reading':
      return '阅读';
    case 'writing':
      return '书写';
  }
}

export function levelToNumber(level: string): number | null {
  const m = level.match(/HSK(\d)/i);
  return m ? Number(m[1]) : null;
}
