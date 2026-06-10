export type HskLevelStandard = {
  level: number;
  title: string;
  durationMinutes: number;
  totalQuestions: number;
  totalScore: number;
  passScore: number;
  scorePerQuestion: number;
  defaultNoticeRules: string[];
};

export const HSK_LEVEL_STANDARDS: Record<number, HskLevelStandard> = {
  1: {
    level: 1,
    title: 'HSK（一级）模拟卷',
    durationMinutes: 40,
    totalQuestions: 40,
    totalScore: 200,
    passScore: 120,
    scorePerQuestion: 5,
    defaultNoticeRules: [
      '本次考试共 40 题，满分 200 分，考试时长 40 分钟。',
      '听力部分约 17 分钟，阅读部分约 23 分钟，请合理分配答题时间。',
      '听力音频仅播放一次，请集中注意力。',
      '提交后不可修改答案，请确认后再提交。',
    ],
  },
  2: {
    level: 2,
    title: 'HSK（二级）模拟卷',
    durationMinutes: 55,
    totalQuestions: 60,
    totalScore: 200,
    passScore: 120,
    scorePerQuestion: 5,
    defaultNoticeRules: [
      '本次考试共 60 题，满分 200 分，考试时长 55 分钟。',
      '含听力、阅读、书写三部分，请按顺序作答。',
    ],
  },
  3: {
    level: 3,
    title: 'HSK（三级）模拟卷',
    durationMinutes: 85,
    totalQuestions: 80,
    totalScore: 300,
    passScore: 180,
    scorePerQuestion: 5,
    defaultNoticeRules: [
      '本次考试共 80 题，满分 300 分，考试时长 85 分钟。',
    ],
  },
  4: {
    level: 4,
    title: 'HSK（四级）模拟卷',
    durationMinutes: 100,
    totalQuestions: 100,
    totalScore: 300,
    passScore: 180,
    scorePerQuestion: 3,
    defaultNoticeRules: [
      '本次考试共 100 题，满分 300 分，考试时长 100 分钟。',
    ],
  },
  5: {
    level: 5,
    title: 'HSK（五级）模拟卷',
    durationMinutes: 125,
    totalQuestions: 100,
    totalScore: 300,
    passScore: 180,
    scorePerQuestion: 3,
    defaultNoticeRules: [
      '本次考试共 100 题，满分 300 分，考试时长 125 分钟。',
    ],
  },
  6: {
    level: 6,
    title: 'HSK（六级）模拟卷',
    durationMinutes: 140,
    totalQuestions: 101,
    totalScore: 300,
    passScore: 180,
    scorePerQuestion: 3,
    defaultNoticeRules: [
      '本次考试共 101 题，满分 300 分，考试时长 140 分钟。',
    ],
  },
};

export function getLevelStandard(level: number): HskLevelStandard | null {
  return HSK_LEVEL_STANDARDS[level] ?? null;
}
