import * as XLSX from 'xlsx';

export type ParsedCatalogLesson = {
  title: string;
  page?: string;
};

export type ParsedCatalogUnit = {
  order: number;
  title: string;
  lessons: ParsedCatalogLesson[];
};

const CN_DIGIT: Record<string, number> = {
  零: 0,
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
};

function cnToNumber(text: string): number | null {
  if (/^\d+$/.test(text)) return Number(text);
  if (text === '十') return 10;
  if (text.startsWith('十')) {
    const rest = text.slice(1);
    return 10 + (CN_DIGIT[rest] ?? 0);
  }
  if (text.endsWith('十')) {
    const head = text.slice(0, -1);
    return (CN_DIGIT[head] ?? 0) * 10;
  }
  if (text.includes('十')) {
    const [head, tail] = text.split('十');
    return (CN_DIGIT[head] ?? 0) * 10 + (CN_DIGIT[tail] ?? 0);
  }
  return CN_DIGIT[text] ?? null;
}

function parseUnitOrder(text: string): number | null {
  const match = text.match(/第([一二三四五六七八九十百]+)单元/);
  if (!match) return null;
  return cnToNumber(match[1]);
}

function formatUnitTitle(raw: string, order: number): string {
  const nameMatch = raw.match(/第[一二三四五六七八九十百]+单元\s*(.+)/);
  const name = nameMatch?.[1]?.trim();
  return name ? `U${order} ${name}` : raw;
}

function cellText(value: unknown): string {
  if (value == null) return '';
  return String(value).trim();
}

function isHeaderRow(colA: string, colB: string): boolean {
  return colA.includes('一级目录') || colB.includes('二级目录') || colA.includes('目录');
}

export function parseCatalogWorkbook(data: ArrayBuffer): ParsedCatalogUnit[] {
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('Excel 文件中没有工作表');
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
    header: 1,
    defval: null,
    raw: false,
  });

  const units: ParsedCatalogUnit[] = [];
  let current: ParsedCatalogUnit | null = null;

  rows.forEach((row, index) => {
    if (!Array.isArray(row)) return;

    const colA = cellText(row[0]);
    const colB = cellText(row[1]);
    const colC = cellText(row[2]);

    if (!colA && !colB) return;
    if (index === 0 && isHeaderRow(colA, colB)) return;

    if (colA) {
      const order = parseUnitOrder(colA) ?? units.length + 1;
      current = {
        order,
        title: formatUnitTitle(colA, order),
        lessons: [],
      };
      units.push(current);
      return;
    }

    if (colB && current) {
      current.lessons.push({
        title: colB,
        page: colC || undefined,
      });
    }
  });

  if (units.length === 0) {
    throw new Error('未识别到有效目录，请检查表格格式');
  }

  const emptyUnits = units.filter((unit) => unit.lessons.length === 0);
  if (emptyUnits.length > 0) {
    throw new Error(`以下单元缺少课程：${emptyUnits.map((unit) => unit.title).join('、')}`);
  }

  return units;
}
