export type QuestionOption = {
  text: string;
  pinyin: string;
  translation: string;
  image: string;
};

export type DiagnosticQuestion = {
  resourceId: string;
  hskLevel: string;
  hskLevelNum: number;
  typeName: string;
  typeCode: string;
  knowledgePoint: string;
  catalogId: string;
  difficulty: string;
  title: string;
  stem: string;
  audioId: string;
  stemText: string;
  stemPinyin: string;
  stemTranslation: string;
  stemImage: string;
  correctOptions: QuestionOption[];
  distractors: QuestionOption[];
  explanation: string;
  explanationEn: string;
};

function parseHskLevelNum(level: string): number {
  const m = level.match(/(\d+)/);
  return m ? Number(m[1]) : 0;
}

/** Parse CSV with quoted fields (supports commas and newlines inside quotes). */
export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || (c === '\r' && text[i + 1] === '\n')) {
      if (c === '\r') i++;
      row.push(field);
      field = '';
      if (row.some((cell) => cell.trim() !== '')) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell.trim() !== '')) rows.push(row);
  }
  return rows;
}

function optionFromRow(r: string[]): QuestionOption {
  return {
    text: (r[7] ?? '').trim(),
    pinyin: (r[8] ?? '').trim(),
    translation: (r[9] ?? '').trim(),
    image: (r[10] ?? '').trim(),
  };
}

export function aggregateDiagnosticQuestions(rows: string[][]): DiagnosticQuestion[] {
  const dataRows = rows.slice(1);
  const groups = new Map<string, string[][]>();

  for (const r of dataRows) {
    const resourceId = (r[3] ?? '').trim();
    const typeCode = (r[2] ?? '').trim();
    if (!resourceId || !typeCode) continue;
    const key = `${(r[0] ?? '').trim()}|${typeCode}|${resourceId}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  const questions: DiagnosticQuestion[] = [];

  for (const groupRows of groups.values()) {
    const first = groupRows[0];
    const q: DiagnosticQuestion = {
      resourceId: (first[3] ?? '').trim(),
      hskLevel: (first[0] ?? '').trim(),
      hskLevelNum: parseHskLevelNum(first[0] ?? ''),
      typeName: (first[1] ?? '').trim(),
      typeCode: (first[2] ?? '').trim(),
      knowledgePoint: (first[4] ?? '').trim(),
      catalogId: '',
      difficulty: '',
      title: '',
      stem: '',
      audioId: '',
      stemText: '',
      stemPinyin: '',
      stemTranslation: '',
      stemImage: '',
      correctOptions: [],
      distractors: [],
      explanation: '',
      explanationEn: '',
    };

    for (const r of groupRows) {
      const attr = (r[5] ?? '').trim();
      const text = (r[7] ?? '').trim();
      const pinyin = (r[8] ?? '').trim();
      const translation = (r[9] ?? '').trim();
      const image = (r[10] ?? '').trim();
      const audio = (r[6] ?? '').trim();
      const catalog = (r[12] ?? '').trim();
      const difficulty = (r[13] ?? '').trim();

      if (catalog) q.catalogId = catalog;
      if (difficulty) q.difficulty = difficulty;

      switch (attr) {
        case '标题':
          q.title = text;
          break;
        case '题干':
          q.stem = text;
          if (audio) q.audioId = audio;
          if (text) q.stemText = text;
          if (pinyin) q.stemPinyin = pinyin;
          if (translation) q.stemTranslation = translation;
          if (image) q.stemImage = image;
          break;
        case '正确选项':
          q.correctOptions.push(optionFromRow(r));
          break;
        case '干扰项':
          q.distractors.push(optionFromRow(r));
          break;
        case '解析':
          q.explanation = text;
          q.explanationEn = translation;
          break;
        default:
          break;
      }
    }

    if (!q.title && q.stem) q.title = q.stem;
    questions.push(q);
  }

  return questions.sort((a, b) => {
    if (a.hskLevelNum !== b.hskLevelNum) return a.hskLevelNum - b.hskLevelNum;
    return a.resourceId.localeCompare(b.resourceId);
  });
}

export function parseDiagnosticQuestionBankCsv(text: string): DiagnosticQuestion[] {
  return aggregateDiagnosticQuestions(parseCsvRows(text));
}
