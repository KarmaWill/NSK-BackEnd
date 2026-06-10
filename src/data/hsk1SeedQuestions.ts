import type { HskQuestionRow } from '../types/hskExams';

const stamp = () => new Date().toISOString();

function baseRow(partial: Partial<HskQuestionRow> & Pick<HskQuestionRow, 'question_uid' | 'type_id' | 'stem' | 'correctAnswer'>): HskQuestionRow {
  return {
    level: 'HSK1',
    tags: [],
    options: [],
    explanation: '',
    score: 5,
    audioStatus: 'none',
    imageStatus: 'none',
    linked_courses: [],
    linked_papers: ['HSK1 模拟卷'],
    linked_videos: [],
    status: 'published',
    createdAt: stamp(),
    updatedAt: stamp(),
    ...partial,
  };
}

/** HSK1 回归样例 — 与 hsk-exam-frontend.html questions1 前段对齐 */
export function createHsk1SeedQuestions(): HskQuestionRow[] {
  return [
    baseRow({
      question_uid: 'Q-L01-01',
      type_id: 'L01',
      stem: '七个苹果',
      correctAnswer: 'C',
      audioStatus: 'ready',
      payload: {
        content: { phrase: '七个苹果' },
        runtimeOptions: [
          { key: 'A', image: '🍎' },
          { key: 'B', image: '🍊' },
          { key: 'C', image: '🍎🍎' },
        ],
      },
    }),
    baseRow({
      question_uid: 'Q-L01-02',
      type_id: 'L01',
      stem: '汉语老师',
      correctAnswer: 'B',
      audioStatus: 'ready',
      payload: {
        content: { phrase: '汉语老师' },
        runtimeOptions: [
          { key: 'A', image: '👨‍⚕️' },
          { key: 'B', image: '👨‍🏫' },
          { key: 'C', image: '👨‍🍳' },
        ],
      },
    }),
    baseRow({
      question_uid: 'Q-L01-03',
      type_id: 'L01',
      stem: '很好吃',
      correctAnswer: 'A',
      audioStatus: 'ready',
      payload: {
        content: { phrase: '很好吃' },
        runtimeOptions: [
          { key: 'A', image: '😋' },
          { key: 'B', image: '😢' },
          { key: 'C', image: '😠' },
        ],
      },
    }),
    baseRow({
      question_uid: 'Q-L01-04',
      type_id: 'L01',
      stem: '坐飞机',
      correctAnswer: 'C',
      audioStatus: 'ready',
      payload: {
        content: { phrase: '坐飞机' },
        runtimeOptions: [
          { key: 'A', image: '🚄' },
          { key: 'B', image: '🚗' },
          { key: 'C', image: '✈️' },
        ],
      },
    }),
    baseRow({
      question_uid: 'Q-L01-05',
      type_id: 'L01',
      stem: '不高兴',
      correctAnswer: 'B',
      audioStatus: 'ready',
      payload: {
        content: { phrase: '不高兴' },
        runtimeOptions: [
          { key: 'A', image: '😊' },
          { key: 'B', image: '😞' },
          { key: 'C', image: '😴' },
        ],
      },
    }),
    baseRow({
      question_uid: 'Q-L03-01',
      type_id: 'L03',
      stem: '短句选答 1',
      correctAnswer: 'A',
      audioStatus: 'ready',
      payload: {
        runtimeOptions: [
          { key: 'A', text: '在读书', pinyin: 'zài dú shū' },
          { key: 'B', text: '六点了', pinyin: 'liù diǎn le' },
          { key: 'C', text: '再见', pinyin: 'zài jiàn' },
        ],
      },
    }),
    baseRow({
      question_uid: 'Q-L02-GROUP',
      type_id: 'L02',
      stem: '对话-图片匹配（复合题）',
      correctAnswer: 'E',
      audioStatus: 'ready',
      payload: {
        runtimeOptions: [
          { key: 'A', image: '👗' },
          { key: 'B', image: '🎤' },
          { key: 'C', image: '🎧' },
          { key: 'D', image: '🍳' },
          { key: 'E', image: '🏥' },
          { key: 'F', image: '🚗' },
        ],
        subQuestions: [
          { id: 11, answer: 'E', score: 5 },
          { id: 12, answer: 'A', score: 5 },
          { id: 13, answer: 'D', score: 5 },
          { id: 14, answer: 'C', score: 5 },
          { id: 15, answer: 'B', score: 5 },
        ],
      },
    }),
    baseRow({
      question_uid: 'Q-L02-S02',
      type_id: 'L02',
      stem: '对话-图片匹配 子题2',
      correctAnswer: 'A',
      score: 5,
      audioStatus: 'ready',
    }),
    baseRow({
      question_uid: 'Q-L02-S03',
      type_id: 'L02',
      stem: '对话-图片匹配 子题3',
      correctAnswer: 'D',
      score: 5,
      audioStatus: 'ready',
    }),
    baseRow({
      question_uid: 'Q-L02-S04',
      type_id: 'L02',
      stem: '对话-图片匹配 子题4',
      correctAnswer: 'C',
      score: 5,
      audioStatus: 'ready',
    }),
    baseRow({
      question_uid: 'Q-L02-S05',
      type_id: 'L02',
      stem: '对话-图片匹配 子题5',
      correctAnswer: 'B',
      score: 5,
      audioStatus: 'ready',
    }),
    baseRow({
      question_uid: 'Q-R01-01',
      type_id: 'R01',
      stem: '我喜欢吃面条。',
      correctAnswer: 'E',
      imageStatus: 'ready',
      payload: {
        content: { sentence: '我喜欢吃面条。', pinyin: 'wǒ xǐ huan chī miàn tiáo' },
        runtimeOptions: [
          { key: 'A', image: '🏠' },
          { key: 'B', image: '🍜' },
          { key: 'C', image: '📱' },
          { key: 'D', image: '🚗' },
          { key: 'E', image: '🍜' },
          { key: 'F', image: '✍️' },
        ],
      },
    }),
  ];
}
