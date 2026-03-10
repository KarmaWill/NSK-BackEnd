/* Data from cms-prototype-v3.html — catalogData, resourceData, questionData, langData */

export interface CatalogNode {
  id: string;
  name: string;
  cn?: string;
  en?: string;
  leaf: number;
  cover?: string;
  res?: number;
  q?: number;
  children?: CatalogNode[];
}

export const catalogData: CatalogNode[] = [
  {
    id: 'N00000',
    name: 'NSK Chinese',
    cn: 'NSK 中文',
    leaf: 0,
    children: [
      {
        id: 'N10000',
        name: 'Level 1',
        cn: '一起吃饭吗？',
        leaf: 0,
        children: [
          {
            id: 'N10100',
            name: 'Unit 1',
            cn: '日常主食',
            en: 'Main Foods',
            leaf: 0,
            cover: 'FM-Unit1.png',
            children: [
              { id: 'N10101', name: 'Lesson 1', cn: '米饭', en: 'Rice', leaf: 1, res: 4, q: 3 },
              { id: 'N10102', name: 'Lesson 2', cn: '饺子', en: 'Dumplings', leaf: 1, res: 3, q: 3 },
              { id: 'N10103', name: 'Lesson 3', cn: '吃包子', en: 'I Eat Baozi', leaf: 1, res: 3, q: 3 },
            ],
          },
          {
            id: 'N10200',
            name: 'Unit 2',
            cn: '日常饮品',
            en: 'Daily Drinks',
            leaf: 0,
            cover: 'FM-Unit2.png',
            children: [
              { id: 'N10201', name: 'Lesson 1', cn: '水', en: 'Water', leaf: 1, res: 3, q: 3 },
              { id: 'N10202', name: 'Lesson 2', cn: '茶', en: 'Tea', leaf: 1, res: 3, q: 3 },
              { id: 'N10203', name: 'Lesson 3', cn: '喝牛奶', en: 'I Drink Milk', leaf: 1, res: 3, q: 3 },
            ],
          },
          {
            id: 'N10300',
            name: 'Unit 3',
            cn: '这是什么？',
            en: 'What is this?',
            leaf: 0,
            cover: 'FM-Unit3.png',
            children: [
              { id: 'N10301', name: 'Lesson 1', cn: '这是米饭', en: 'This is Rice', leaf: 1, res: 3, q: 3 },
              { id: 'N10302', name: 'Lesson 2', cn: '这是饺子', en: 'These are Dumplings', leaf: 1, res: 3, q: 3 },
              { id: 'N10303', name: 'Lesson 3', cn: '这不是面包', en: 'This is Not Bread', leaf: 1, res: 3, q: 3 },
            ],
          },
          {
            id: 'N10400',
            name: 'Unit 4',
            cn: '自我介绍',
            en: 'Self-Intro',
            leaf: 0,
            cover: 'FM-Unit4.png',
            children: [
              { id: 'N10401', name: 'Lesson 1', cn: '我叫……', en: 'My Name is ...', leaf: 1, res: 3, q: 3 },
              { id: 'N10402', name: 'Lesson 2', cn: '我是学生', en: 'I am a Student', leaf: 1, res: 3, q: 3 },
              { id: 'N10403', name: 'Lesson 3', cn: '我不是中国人', en: 'I am Not a Chinese', leaf: 1, res: 3, q: 3 },
            ],
          },
          {
            id: 'N10500',
            name: 'Unit 5',
            cn: '我的宠物',
            en: 'My Pet',
            leaf: 0,
            cover: 'FM-Unit5.png',
            children: [
              { id: 'N10501', name: 'Lesson 1', cn: '这是我的猫', en: 'This is My Cat', leaf: 1, res: 3, q: 3 },
              { id: 'N10502', name: 'Lesson 2', cn: '谁的狗？', en: 'Whose Dog', leaf: 1, res: 3, q: 3 },
              { id: 'N10503', name: 'Lesson 3', cn: '我有三只猫', en: 'I Have Three Cats', leaf: 1, res: 3, q: 3 },
            ],
          },
          {
            id: 'N10600',
            name: 'Unit 6',
            cn: '家庭成员',
            en: 'Family Members',
            leaf: 0,
            cover: 'FM-Unit6.png',
            children: [
              { id: 'N10601', name: 'Lesson 1', cn: '我的爸爸', en: 'My Dad', leaf: 1, res: 3, q: 3 },
              { id: 'N10602', name: 'Lesson 2', cn: '她的妈妈', en: 'Her Mom', leaf: 1, res: 3, q: 4 },
              { id: 'N10603', name: 'Lesson 3', cn: '你家几口人', en: 'How Many People', leaf: 1, res: 3, q: 3 },
            ],
          },
        ],
      },
    ],
  },
];

export interface ResourceRow {
  dir: string;
  type: string;
  id: string;
  word: string;
  audio: string;
  cn: string;
  py: string;
  en: string;
  img: string;
  pos: string;
  hsk: string;
  lang: string;
}

export const resourceData: ResourceRow[] = [
  { dir: 'N10100', type: '有声阅读', id: 'M0100001', word: '', audio: 'Y100001.mp3', cn: '我爱吃米饭，', py: 'Wǒ ài chī mǐfàn,', en: 'I love eating rice,', img: '', pos: '', hsk: '', lang: 'L000033' },
  { dir: 'N10100', type: '有声阅读', id: 'M0100001', word: '', audio: 'Y100002.mp3', cn: '我爱吃饺子，', py: 'wǒ ài chī jiǎozi,', en: 'I love eating dumplings,', img: '', pos: '', hsk: '', lang: 'L000034' },
  { dir: 'N10100', type: '有声阅读', id: 'M0100001', word: '', audio: 'Y100003.mp3', cn: '我也爱吃包子。', py: 'wǒ yě ài chī bāozi.', en: 'I also love eating baozi.', img: '', pos: '', hsk: '', lang: 'L000035' },
  { dir: 'N10100', type: '有声阅读', id: 'M0100001', word: '', audio: 'Y100004.mp3', cn: '我的肚子说："太好了！"', py: 'Wǒ de dù zi shuō:', en: 'My tummy says: "Great!"', img: '', pos: '', hsk: '', lang: 'L000036' },
  { dir: 'N10101', type: '学习卡片', id: 'M0200001', word: '字', audio: 'Y100005.mp3', cn: '米', py: 'mǐ', en: 'Rice', img: 'XUE-100001.png', pos: 'n.', hsk: '0', lang: 'L000004' },
  { dir: 'N10101', type: '学习卡片', id: 'M0200002', word: '词', audio: 'Y100006.mp3', cn: '米饭', py: 'mǐ fàn', en: 'Cooked rice', img: 'XUE-100019.png', pos: 'n.', hsk: 'HSK 1', lang: 'L000037' },
  { dir: 'N10101', type: '学习卡片', id: 'M0200003', word: '句', audio: 'Y100007.mp3', cn: '这是米饭。', py: 'Zhè shì mǐfàn.', en: 'This is rice.', img: 'XUE-100037.png', pos: '', hsk: '', lang: 'L000038' },
  { dir: 'N10102', type: '学习卡片', id: 'M0200004', word: '字', audio: 'Y100008.mp3', cn: '饺', py: 'jiǎo', en: 'Dumpling', img: 'XUE-100002.png', pos: 'n.', hsk: '0', lang: 'L000039' },
  { dir: 'N10102', type: '学习卡片', id: 'M0200005', word: '词', audio: 'Y100009.mp3', cn: '饺子', py: 'jiǎo zi', en: 'Dumplings', img: 'XUE-100020.png', pos: 'n.', hsk: 'HSK 4', lang: 'L000005' },
  { dir: 'N10102', type: '学习卡片', id: 'M0200006', word: '句', audio: 'Y100010.mp3', cn: '我吃饺子。', py: 'Wǒ chī jiǎozi.', en: 'I eat dumplings.', img: 'XUE-100038.png', pos: '', hsk: '', lang: 'L000040' },
];

export interface QuestionRow {
  dir: string;
  type: string;
  code: string;
  res: string;
  diff: string;
  kp: string;
  status: 'published' | 'draft' | 'review';
}

export const questionData: QuestionRow[] = [
  { dir: 'N10101', type: '听音选图', code: 'T00_LISTEN_SELECT_IMAGE', res: 'M0300001', diff: '★', kp: '米饭', status: 'published' },
  { dir: 'N10101', type: '汉字填空', code: 'T01_PICTURE_FILL_IN', res: 'M0400001', diff: '★', kp: '米', status: 'published' },
  { dir: 'N10101', type: '词意选择1', code: 'T02_PICTURE_SELECT_TEXT', res: 'M0500001', diff: '★★', kp: '米饭', status: 'review' },
  { dir: 'N10102', type: '听音选图', code: 'T00_LISTEN_SELECT_IMAGE', res: 'M0300002', diff: '★', kp: '饺子', status: 'published' },
  { dir: 'N10102', type: '汉字填空', code: 'T01_PICTURE_FILL_IN', res: 'M0400002', diff: '★', kp: '饺', status: 'draft' },
  { dir: 'N10201', type: '听音选图', code: 'T00_LISTEN_SELECT_IMAGE', res: 'M0300005', diff: '★', kp: '水', status: 'published' },
  { dir: 'N10601', type: '听音选图', code: 'T00_LISTEN_SELECT_IMAGE', res: 'M0300013', diff: '★', kp: '爸爸', status: 'published' },
  { dir: 'N10601', type: '词意选择1', code: 'T02_PICTURE_SELECT_TEXT', res: 'M0500006', diff: '★★', kp: '爸爸', status: 'draft' },
  { dir: 'N10602', type: '汉字填空', code: 'T01_PICTURE_FILL_IN', res: 'M0400017', diff: '★', kp: '她', status: 'review' },
  { dir: 'N10602', type: '听力选择', code: 'T03_LISTEN_SELECT_SENTENCE', res: 'M0700007', diff: '★★', kp: '这是她的妈妈', status: 'draft' },
  { dir: 'N10603', type: '语义选择', code: 'T05_GRAMMAR_SELECT', res: 'M0800006', diff: '★★', kp: '你家几口人', status: 'published' },
];

export interface LangRow {
  id: string;
  cn: string;
  th: string;
  vi: string;
  ko: string;
  ja: string;
}

export const langData: LangRow[] = [
  { id: 'L000001', cn: 'NSK Chinese', th: '', vi: '', ko: '', ja: '' },
  { id: 'L000002', cn: 'Meal Together?', th: '', vi: '', ko: '', ja: '' },
  { id: 'L000003', cn: 'Main Foods', th: 'อาหารหลักประจำวัน', vi: 'Thức ăn chính', ko: '주요 음식', ja: '主要な食べ物' },
  { id: 'L000004', cn: 'Rice', th: 'ข้าว', vi: 'Gạo', ko: '쌀', ja: '米' },
  { id: 'L000005', cn: 'Dumplings', th: 'เกี๊ยว', vi: 'Bánh bao', ko: '', ja: '餃子' },
  { id: 'L000006', cn: 'I Eat Baozi', th: '', vi: '', ko: '', ja: '' },
  { id: 'L000007', cn: 'Daily Drinks', th: 'เครื่องดื่มประจำวัน', vi: 'Đồ uống hàng ngày', ko: '일상 음료', ja: '日常的な飲み物' },
  { id: 'L000008', cn: 'Water', th: 'น้ำ', vi: 'Nước', ko: '물', ja: '水' },
  { id: 'L000009', cn: 'Tea', th: 'ชา', vi: 'Trà', ko: '차', ja: 'お茶' },
  { id: 'L000010', cn: 'I Drink Milk', th: '', vi: '', ko: '', ja: '' },
];
