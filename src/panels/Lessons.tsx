import type { ReactNode, CSSProperties } from 'react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { applyQuestionListOverrides, subscribeQuestionOverrideUpdates, upsertQuestionOverride } from '../stores/questionOverrides';
import { loadAiCapabilities } from '../stores/aiCapabilities';
import { loadCourseLibs, COURSE_LIBS_UPDATED_EVENT, type CourseLibRow } from '../stores/courseLibs';

type LangKey = 'EN' | 'ES' | 'FR' | 'PT' | 'CN' | 'JA' | 'KO' | 'TH' | 'VI' | 'ID' | 'MS' | 'KM';

type CatalogNode = {
  id: string;
  name: string;
  cn?: string;
  en?: string;
  leaf: 0 | 1;
  cover?: string;
  res?: number;
  q?: number;
  children?: CatalogNode[];
  nameByLang?: Partial<Record<LangKey, string>>;
  targetByLang?: Partial<Record<LangKey, string>>;
  resourceIds?: string[];
  questionIds?: string[];
};

function withMultiLang(n: CatalogNode): CatalogNode {
  return {
    ...n,
    nameByLang: n.nameByLang ?? { EN: n.en ?? '', ES: '', FR: '', PT: '', CN: n.cn ?? '', JA: '', KO: '', TH: '', VI: '', ID: '', MS: '', KM: '' },
    targetByLang: n.targetByLang ?? { EN: '', ES: '', FR: '', PT: '', CN: '', JA: '', KO: '', TH: '', VI: '', ID: '', MS: '', KM: '' },
    children: n.children?.map(withMultiLang),
  };
}

const catalogData: CatalogNode[] = ([
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
] as CatalogNode[]).map(withMultiLang);

// 模拟学习资源列表（与目录匹配）
const MOCK_RESOURCES = [
  { resId: 'M0200001', dirId: 'N10101', text: '我爱吃米饭，', type: '有声阅读' },
  { resId: 'M0200002', dirId: 'N10101', text: '米', type: '学习卡片' },
  { resId: 'M0200003', dirId: 'N10101', text: '米饭', type: '学习卡片' },
  { resId: 'M0200004', dirId: 'N10101', text: '饺子', type: '学习卡片' },
  { resId: 'M0200005', dirId: 'N10102', text: '饺子', type: '有声阅读' },
  { resId: 'M0200006', dirId: 'N10102', text: '包子', type: '学习卡片' },
  { resId: 'M0200007', dirId: 'N10201', text: '水', type: '学习卡片' },
  { resId: 'M0200008', dirId: 'N10202', text: '茶', type: '学习卡片' },
  { resId: 'M0200009', dirId: 'N10202', text: '牛奶', type: '学习卡片' },
  { resId: 'M0200010', dirId: 'N10301', text: '这是米饭', type: '有声阅读' },
  { resId: 'V0100001', dirId: 'N10101', text: '米饭课堂短视频', type: '视频' },
  { resId: 'V0100002', dirId: 'N10202', text: '茶文化入门视频', type: '视频' },
];

const isLearningCardResource = (resId: string) =>
  MOCK_RESOURCES.some((r) => r.resId === resId && r.type === '学习卡片');

// 模拟题目列表（与目录匹配）
const MOCK_QUESTIONS = [
  { resId: 'M0300001', dirId: 'N10101', typeName: '听音选图', knowledge: '米饭' },
  { resId: 'M0400001', dirId: 'N10101', typeName: '汉字填空', knowledge: '米' },
  { resId: 'M0300002', dirId: 'N10101', typeName: '听音选图', knowledge: '饺子' },
  { resId: 'M0300003', dirId: 'N10102', typeName: '听音选图', knowledge: '饺子' },
  { resId: 'M0400002', dirId: 'N10102', typeName: '汉字填空', knowledge: '包子' },
  { resId: 'M0300004', dirId: 'N10201', typeName: '听音选图', knowledge: '水' },
  { resId: 'M0300005', dirId: 'N10202', typeName: '听音选图', knowledge: '茶' },
  { resId: 'M0500001', dirId: 'N10202', typeName: '词意选择', knowledge: '茶' },
  { resId: 'M0300006', dirId: 'N10301', typeName: '听音选图', knowledge: '米饭' },
  { resId: 'M0400003', dirId: 'N10301', typeName: '汉字填空', knowledge: '这是' },
];

const LANG_OPTIONS: { key: LangKey; label: string }[] = [
  { key: 'CN', label: '中文' },
  { key: 'EN', label: '英文' },
  { key: 'ES', label: '西语' },
  { key: 'FR', label: '法语' },
  { key: 'PT', label: '葡语' },
  { key: 'JA', label: '日语' },
  { key: 'KO', label: '韩语' },
  { key: 'TH', label: '泰语' },
  { key: 'VI', label: '越南语' },
  { key: 'ID', label: '印尼语' },
  { key: 'MS', label: '马来语' },
  { key: 'KM', label: '高棉语' },
];

function countNodes(nodes: CatalogNode[]): { levels: number; units: number; lessons: number; resources: number } {
  let levels = 0;
  let units = 0;
  let lessons = 0;
  let resources = 0;
  function walk(list: CatalogNode[]) {
    for (const n of list) {
      if (n.name.startsWith('Level')) levels += 1;
      else if (n.name.startsWith('Unit')) units += 1;
      else if (n.name.startsWith('Lesson')) {
        lessons += 1;
        const r = (n.resourceIds?.length ?? n.res ?? 0) + (n.questionIds?.length ?? n.q ?? 0);
        resources += r;
      }
      if (n.children?.length) walk(n.children);
    }
  }
  walk(nodes);
  return { levels, units, lessons, resources };
}

function findNode(nodes: CatalogNode[], id: string): CatalogNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const found = findNode(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

function getParentId(nodes: CatalogNode[], targetId: string, parentId: string | null = null): string | null {
  for (const n of nodes) {
    if (n.id === targetId) return parentId;
    if (n.children) {
      const found = getParentId(n.children, targetId, n.id);
      if (found !== null) return found;
    }
  }
  return null;
}

function updateNodeInTree(nodes: CatalogNode[], targetId: string, patch: Partial<CatalogNode>): CatalogNode[] {
  return nodes.map((n) => {
    if (n.id === targetId) return { ...n, ...patch };
    if (n.children) return { ...n, children: updateNodeInTree(n.children, targetId, patch) };
    return n;
  });
}

function getNextChildId(nodes: CatalogNode[], parentId: string): string {
  const parent = findNode(nodes, parentId);
  const children = parent?.children ?? [];
  const nums = children.map((c) => parseInt(c.id.slice(1), 10) || 0);
  const next = Math.max(0, ...nums) + 1;
  const digitLen = Math.max(5, parentId.length - 1);
  return 'N' + String(next).padStart(digitLen, '0');
}

function insertChildNode(nodes: CatalogNode[], parentId: string, node: CatalogNode): CatalogNode[] {
  return nodes.map((n) => {
    if (n.id !== parentId) {
      if (n.children) return { ...n, children: insertChildNode(n.children, parentId, node) };
      return n;
    }
    const children = [...(n.children ?? []), node];
    return { ...n, children };
  });
}

function removeNodeFromTree(nodes: CatalogNode[], targetId: string): CatalogNode[] {
  return nodes
    .filter((n) => n.id !== targetId)
    .map((n) => (n.children ? { ...n, children: removeNodeFromTree(n.children, targetId) } : n));
}

type NodeKind = 'root' | 'level' | 'unit' | 'lesson';
function getNodeKind(node: CatalogNode | null): NodeKind {
  if (!node) return 'root';
  if (node.id === 'N00000') return 'root';
  if (/^Level\s/i.test(node.name)) return 'level';
  if (/^Unit\s/i.test(node.name)) return 'unit';
  return 'lesson';
}

/** 当前选中节点下允许新增的子类型：仅 Level→Unit→Lesson 逐级 */
function getAllowedChildKind(parentKind: NodeKind): 'Level' | 'Unit' | 'Lesson' | null {
  if (parentKind === 'root') return 'Level';
  if (parentKind === 'level') return 'Unit';
  if (parentKind === 'unit') return 'Lesson';
  return null;
}

function UnitModuleCard({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div
      style={{
        border: '1px solid var(--stone-dark)',
        borderRadius: 12,
        background: 'var(--white)',
        padding: 14,
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: hint ? 6 : 10 }}>
        <div style={{ fontSize: 12, letterSpacing: 0.5, fontWeight: 700, color: 'var(--ink)' }}>{title}</div>
      </div>
      {hint && <p className="form-hint" style={{ marginTop: 0, marginBottom: 10 }}>{hint}</p>}
      {children}
    </div>
  );
}

type LessonsProps = {
  onNavigate?: (id: import('../types').PanelId) => void;
  activeCourseLibId?: string;
  onActiveCourseLibChange?: (id: string) => void;
};

export function Lessons({ activeCourseLibId = '', onActiveCourseLibChange }: LessonsProps) {
  const [courseLibs, setCourseLibs] = useState<CourseLibRow[]>(() => loadCourseLibs());
  useEffect(() => {
    const sync = () => setCourseLibs(loadCourseLibs());
    window.addEventListener(COURSE_LIBS_UPDATED_EVENT, sync);
    return () => window.removeEventListener(COURSE_LIBS_UPDATED_EVENT, sync);
  }, []);

  const [catalog, setCatalog] = useState<CatalogNode[]>(catalogData);
  const [selectedId, setSelectedId] = useState<string>('N10100');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(['N00000', 'N10000', 'N10100']));
  const [nameLang, setNameLang] = useState<LangKey>('CN');
  const [targetLang, setTargetLang] = useState<LangKey>('EN');
  const [matchModal, setMatchModal] = useState<'resource' | 'question' | 'associate' | null>(null);
  const [associateDefaultFocus, setAssociateDefaultFocus] = useState<'question' | 'resource' | null>(null);
  const [addNodeModalOpen, setAddNodeModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [coverPendingFile, setCoverPendingFile] = useState<File | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [studyReportModalOpen, setStudyReportModalOpen] = useState(false);
  const [studyReportChosen, setStudyReportChosen] = useState<{ chars: string[]; words: string[]; sentences: string[] }>({ chars: [], words: [], sentences: [] });
  const [questionPool, setQuestionPool] = useState(() => applyQuestionListOverrides(MOCK_QUESTIONS));
  const [draftNameByLang, setDraftNameByLang] = useState<Partial<Record<LangKey, string>>>({});
  const [draftTargetByLang, setDraftTargetByLang] = useState<Partial<Record<LangKey, string>>>({});
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [unitBonusType, setUnitBonusType] = useState<'audio' | 'video' | ''>('');
  const [unitBonusResId, setUnitBonusResId] = useState('');
  const [unitDeepTypes, setUnitDeepTypes] = useState<('audio' | 'ai' | 'video')[]>([]);
  const [unitDeepResIds, setUnitDeepResIds] = useState(['', '']);
  const [unitResPicker, setUnitResPicker] = useState<{ open: boolean; target: 'bonus' | 'deep0' | 'deep1' | null }>({ open: false, target: null });
  const [unitResKeyword, setUnitResKeyword] = useState('');
  const MOCK_CHARS = ['米', '饭', '吃', '水', '茶', '我', '你', '是', '不'];
  const MOCK_WORDS = ['米饭', '饺子', '包子', '喝水', '喝茶', '牛奶'];
  const MOCK_SENTENCES = ['我爱吃米饭。', '这是饺子。', '你喝什么？'];
  const langBtnStyle = (key: LangKey, active: boolean): CSSProperties | undefined => {
    if (key !== 'CN') return undefined;
    return active
      ? { background: '#8a1c2b', borderColor: '#8a1c2b', color: '#fff' }
      : { background: '#fff5f5', borderColor: '#8a1c2b', color: '#8a1c2b' };
  };
  const autoTranslateByLang = (seed: string): Partial<Record<LangKey, string>> => {
    const base = (seed || '').trim();
    return {
      CN: base,
      EN: base ? `${base} (English)` : '',
      ES: base ? `${base} (Español)` : '',
      FR: base ? `${base} (Français)` : '',
      PT: base ? `${base} (Português)` : '',
      JA: base ? `${base} (日本語)` : '',
      KO: base ? `${base} (한국어)` : '',
      TH: base ? `${base} (ไทย)` : '',
      VI: base ? `${base} (Tiếng Việt)` : '',
      ID: base ? `${base} (Bahasa Indonesia)` : '',
      MS: base ? `${base} (Bahasa Melayu)` : '',
      KM: base ? `${base} (ខ្មែរ)` : '',
    };
  };
  const aiCaps = useMemo(() => loadAiCapabilities(), [unitResPicker.open]);
  const enabledAiCaps = useMemo(() => aiCaps.filter((a) => a.status === '启用'), [aiCaps]);
  const defaultAiResId = enabledAiCaps[0]?.aiId ?? '';
  const pickerExpectedType = useMemo(() => {
    if (unitResPicker.target === 'bonus') return unitBonusType;
    if (unitResPicker.target === 'deep0') return unitDeepTypes[0] ?? '';
    if (unitResPicker.target === 'deep1') return unitDeepTypes[1] ?? '';
    return '';
  }, [unitResPicker.target, unitBonusType, unitDeepTypes]);
  const unitResOptions = useMemo(() => {
    const aiRows = aiCaps.map((a) => ({
      resId: a.aiId,
      dirId: a.unitId || '—',
      text: a.themeNameByLang?.CN || a.themeNameByLang?.EN || '课程AI配置',
      type: 'AI导师',
    }));
    const allRows = [...MOCK_RESOURCES, ...aiRows];
    const byExpectedType = allRows.filter((r) => {
      if (!pickerExpectedType) return true;
      if (pickerExpectedType === 'audio') return r.type === '有声阅读';
      if (pickerExpectedType === 'video') return r.type === '视频';
      if (pickerExpectedType === 'ai') return r.type === 'AI导师';
      return true;
    });
    return byExpectedType.filter((r) =>
      [r.resId, r.dirId, r.text, r.type].join(' ').toLowerCase().includes(unitResKeyword.toLowerCase()),
    );
  }, [aiCaps, pickerExpectedType, unitResKeyword]);
  const pickUnitRes = (resId: string) => {
    if (unitResPicker.target === 'bonus') setUnitBonusResId(resId);
    if (unitResPicker.target === 'deep0') setUnitDeepResIds((p) => [resId, p[1]]);
    if (unitResPicker.target === 'deep1') setUnitDeepResIds((p) => [p[0], resId]);
    setUnitResPicker({ open: false, target: null });
    setUnitResKeyword('');
  };

  const toggleDeepType = (t: 'audio' | 'ai' | 'video') => {
    setUnitDeepTypes((prev) => {
      if (prev.includes(t)) return prev.filter((x) => x !== t);
      if (prev.length >= 2) return prev;
      return [...prev, t];
    });
  };

  useEffect(() => {
    setUnitDeepResIds((prev) => {
      const next: [string, string] = [prev[0], prev[1]];
      let changed = false;
      [0, 1].forEach((idx) => {
        const t = unitDeepTypes[idx];
        const isAiId = aiCaps.some((a) => a.aiId === next[idx]);
        if (t === 'ai') {
          if (!next[idx] && defaultAiResId) {
            next[idx] = defaultAiResId;
            changed = true;
          }
        } else if (isAiId) {
          next[idx] = '';
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [unitDeepTypes, aiCaps, defaultAiResId]);

  useEffect(() => {
    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    setCoverPreviewUrl(null);
    setCoverPendingFile(null);
    setCoverError(null);
  }, [selectedId]);

  useEffect(() => {
    return subscribeQuestionOverrideUpdates(() => {
      setQuestionPool((prev) => applyQuestionListOverrides(prev));
    });
  }, []);

  const stats = useMemo(() => countNodes(catalog), [catalog]);
  const selectedNode = useMemo(() => {
    for (const root of catalog) {
      const found = findNode([root], selectedId);
      if (found) return found;
    }
    return null;
  }, [catalog, selectedId]);

  useEffect(() => {
    if (!selectedNode) return;
    setDraftNameByLang(selectedNode.nameByLang ?? {});
    setDraftTargetByLang(selectedNode.targetByLang ?? {});
  }, [selectedNode?.id]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateSelectedNode = (patch: Partial<CatalogNode>) => {
    if (!selectedId) return;
    setCatalog((prev) => updateNodeInTree(prev, selectedId, patch));
  };

  const publishCurrentNode = () => {
    if (!selectedNode) return;
    updateSelectedNode({
      nameByLang: draftNameByLang,
      targetByLang: draftTargetByLang,
      cn: draftNameByLang.CN ?? selectedNode.cn,
      en: draftNameByLang.EN ?? selectedNode.en,
    });
  };

  const nodeKind = useMemo(() => getNodeKind(selectedNode), [selectedNode]);
  const allowedChildKind = useMemo(() => getAllowedChildKind(nodeKind), [nodeKind]);

  const COVER_ASPECT = 5 / 3;
  const COVER_MAX_MB = 1;
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    setCoverError(null);
    setCoverPreviewUrl(null);
    setCoverPendingFile(null);
    if (!file || !file.type.startsWith('image/')) {
      setCoverError('请选择图片文件');
      return;
    }
    if (file.size > COVER_MAX_MB * 1024 * 1024) {
      setCoverError(`图片须 ≤ ${COVER_MAX_MB}MB`);
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const w = img.width;
      const h = img.height;
      const ratio = w / h;
      const target = COVER_ASPECT;
      if (Math.abs(ratio - target) > 0.05) {
        setCoverError('图片比例须为 5:3');
        URL.revokeObjectURL(url);
        return;
      }
      setCoverPreviewUrl(url);
      setCoverPendingFile(file);
    };
    img.onerror = () => {
      setCoverError('图片加载失败');
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };
  const handleCoverConfirm = () => {
    if (!coverPendingFile || !coverPreviewUrl) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateSelectedNode({ cover: reader.result as string });
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
      setCoverPreviewUrl(null);
      setCoverPendingFile(null);
      setCoverError(null);
    };
    reader.readAsDataURL(coverPendingFile);
  };
  const handleCoverCancel = () => {
    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    setCoverPreviewUrl(null);
    setCoverPendingFile(null);
    setCoverError(null);
  };

  const handleDeleteNode = (id: string) => {
    let pid: string | null = null;
    for (const root of catalog) {
      pid = getParentId([root], id);
      if (pid !== null) break;
    }
    setCatalog((prev) => removeNodeFromTree(prev, id));
    if (selectedId === id || (pid && selectedId === id)) {
      setSelectedId(pid ?? catalog[0]?.id ?? '');
    }
    setDeleteConfirmId(null);
  };

  const parentId = selectedNode
    ? (() => {
        for (const root of catalog) {
          const pid = getParentId([root], selectedId);
          if (pid !== null) return pid;
        }
        return 'N10000';
      })()
    : '';

  const resourceCount = selectedNode
    ? selectedNode.leaf === 1
      ? (selectedNode.resourceIds?.length ?? selectedNode.res ?? 0)
      : (selectedNode.children?.reduce((s, c) => s + (c.resourceIds?.length ?? c.res ?? 0), 0) ?? 0)
    : 0;
  const questionCount = selectedNode
    ? selectedNode.leaf === 1
      ? (selectedNode.questionIds?.length ?? selectedNode.q ?? 0)
      : (selectedNode.children?.reduce((s, c) => s + (c.questionIds?.length ?? c.q ?? 0), 0) ?? 0)
    : 0;

  const renderTree = (nodes: CatalogNode[], depth: number = 0): ReactNode => {
    return nodes.map((node) => {
      const hasChildren = (node.children?.length ?? 0) > 0;
      const isExpanded = expandedIds.has(node.id);
      const isLeaf = node.leaf === 1;
      const isSelected = selectedId === node.id;
      const resNum = node.resourceIds?.length ?? node.res ?? 0;
      const qNum = node.questionIds?.length ?? node.q ?? 0;

      return (
        <div key={node.id} className="tree-node">
          <div
            className={`tree-node-row ${isSelected ? 'selected' : ''}`}
            style={{ paddingLeft: 12 + depth * 20 }}
            onClick={() => setSelectedId(node.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setSelectedId(node.id)}
          >
            <span
              className={`tree-toggle ${hasChildren ? (isExpanded ? 'expanded' : '') : 'leaf'}`}
              onClick={(e) => {
                e.stopPropagation();
                if (hasChildren) toggleExpand(node.id);
              }}
              role={hasChildren ? 'button' : undefined}
              aria-expanded={hasChildren ? isExpanded : undefined}
            >
              {hasChildren ? '▶' : ''}
            </span>
            {isLeaf && <span className="tree-dot" />}
            <span className="tree-label">
              {node.name}
              {(node.nameByLang?.CN ?? node.cn) ? <span className="cn"> {node.nameByLang?.CN ?? node.cn}</span> : null}
            </span>
            {isLeaf && (
              <span className="tree-count">
                {resNum}资 {qNum}题
              </span>
            )}
            {node.id !== 'N00000' && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ marginLeft: 6, padding: '2px 6px', fontSize: 11, color: 'var(--rose)' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirmId(node.id);
                }}
                aria-label="删除节点"
              >
                删除
              </button>
            )}
          </div>
          {hasChildren && isExpanded && (
            <div className="tree-children">{renderTree(node.children!, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span>目录管理</span>
            {courseLibs.length > 1 && (
              <select
                className="form-input form-select"
                style={{ width: 'auto', minWidth: 160, fontSize: 13 }}
                value={activeCourseLibId}
                onChange={(e) => onActiveCourseLibChange?.(e.target.value)}
                aria-label="切换课程"
              >
                {courseLibs.map((lib) => (
                  <option key={lib.id} value={lib.id}>
                    {lib.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="page-subtitle">
            NSK Chinese A1 · {stats.levels} 个 Level · {stats.units} 个 Unit · {stats.lessons} 个 Lesson
          </div>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-secondary">导入</button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon grey">📚</div>
          <div><div className="stat-val">{stats.levels}</div><div className="stat-label">Level 数量</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warm">📦</div>
          <div><div className="stat-val">{stats.units}</div><div className="stat-label">Unit 数量</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">📄</div>
          <div><div className="stat-val">{stats.lessons}</div><div className="stat-label">Lesson 数量</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">🔗</div>
          <div><div className="stat-val">{stats.resources}</div><div className="stat-label">题目总数</div></div>
        </div>
      </div>

      <div className="tree-container">
        <div className="tree-panel">
          <div className="tree-header">
            课程目录树
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setAddNodeModalOpen(true)}
              disabled={allowedChildKind === null}
              aria-label="层级配置"
              title={allowedChildKind === null ? '仅 Level 下可新增 Unit，Unit 下可新增 Lesson' : `新增${allowedChildKind === 'Level' ? ' Level' : allowedChildKind === 'Unit' ? ' Unit' : ' Lesson'}`}
            >
              层级配置
            </button>
          </div>
          <div className="tree-body">{renderTree(catalog)}</div>
        </div>

        <div className="detail-panel">
          <div className="detail-header">
            <div>
              <div className="detail-title">
                {selectedNode ? `${selectedNode.name} · ${selectedNode.nameByLang?.CN ?? selectedNode.cn ?? '—'}` : '请选择节点'}
              </div>
              <div className="detail-id">
                {selectedNode
                  ? `NameId: ${selectedNode.id}  ·  ParentId: ${parentId}  ·  节点类型: ${selectedNode.leaf === 1 ? '叶节点 (Lesson)' : '容器节点'}`
                  : ''}
              </div>
            </div>
            <div className="btn-group">
              <button type="button" className="btn btn-secondary">保存</button>
              <button type="button" className="btn btn-primary" onClick={publishCurrentNode}>发布</button>
            </div>
          </div>
          <div className="detail-body">
            {selectedNode ? (
              <div key={selectedNode.id}>
                {/* NSK 根节点：配置暂时为空，点触无效 */}
                {nodeKind === 'root' && (
                  <div className="section-title" style={{ marginTop: 0 }}>NSK 配置</div>
                )}
                {nodeKind === 'root' && (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', background: 'var(--mist)', borderRadius: 8, pointerEvents: 'none', userSelect: 'none' }}>
                    暂无配置 · 点触无效
                  </div>
                )}

                {/* Level：可配置不同 Unit */}
                {nodeKind === 'level' && (
                  <>
                    <div className="section-title" style={{ marginTop: 0 }}>Level 内容 · 可配置不同 Unit</div>
                    <p className="form-hint">在「层级配置」中可在此 Level 下新增 Unit；下方为本 Level 下的 Unit 列表。</p>
                    <div style={{ marginTop: 12 }}>
                      {(selectedNode.children ?? []).map((c) => (
                        <div key={c.id} style={{ padding: '8px 12px', background: 'var(--mist)', borderRadius: 6, marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="font-mono">{c.id}</span>
                          <span>{c.name} {c.cn ?? ''}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Unit：学习目标、Lesson、Bonus Class、Deep Learning、Study report、错题本 */}
                {nodeKind === 'unit' && (
                  <>
                    <div className="section-title" style={{ marginTop: 0 }}>单元配置</div>
                    <div className="form-group full">
                      <label>名称（多语言）</label>
                      <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, background: 'var(--mist)' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              const seed = (draftNameByLang.CN ?? draftNameByLang[nameLang] ?? '').trim();
                              setDraftNameByLang((prev) => ({ ...prev, ...autoTranslateByLang(seed) }));
                            }}
                          >
                            自动翻译
                          </button>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                          {LANG_OPTIONS.map((o) => (
                            <button
                              key={o.key}
                              type="button"
                              className={`btn btn-sm ${nameLang === o.key ? 'btn-primary' : 'btn-secondary'}`}
                              onClick={() => setNameLang(o.key)}
                              style={langBtnStyle(o.key, nameLang === o.key)}
                            >
                              {o.key} {o.label}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          className="form-input"
                          style={{ width: '100%', boxSizing: 'border-box' }}
                          value={draftNameByLang[nameLang] ?? ''}
                          onChange={(e) => setDraftNameByLang((prev) => ({ ...prev, [nameLang]: e.target.value }))}
                          placeholder={`${LANG_OPTIONS.find((l) => l.key === nameLang)?.label ?? nameLang}名称`}
                        />
                      </div>
                    </div>
                    <div className="form-group full">
                      <label>学习目标（多语言）</label>
                      <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, background: 'var(--mist)' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              const seed = (draftTargetByLang.CN ?? draftTargetByLang[targetLang] ?? '').trim();
                              setDraftTargetByLang((prev) => ({ ...prev, ...autoTranslateByLang(seed) }));
                            }}
                          >
                            自动翻译
                          </button>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                          {LANG_OPTIONS.map((o) => (
                            <button
                              key={o.key}
                              type="button"
                              className={`btn btn-sm ${targetLang === o.key ? 'btn-primary' : 'btn-secondary'}`}
                              onClick={() => setTargetLang(o.key)}
                              style={langBtnStyle(o.key, targetLang === o.key)}
                            >
                              {o.key} {o.label}
                            </button>
                          ))}
                        </div>
                        <textarea rows={2} className="form-input" style={{ width: '100%', boxSizing: 'border-box' }} value={draftTargetByLang[targetLang] ?? ''} onChange={(e) => setDraftTargetByLang((prev) => ({ ...prev, [targetLang]: e.target.value }))} placeholder="学习目标" />
                      </div>
                    </div>
                    <div className="section-title">Lesson 列表</div>
                    <div style={{ marginBottom: 12 }}>
                      {(selectedNode.children ?? []).map((c) => (
                        <div key={c.id} style={{ padding: '8px 12px', background: 'var(--mist)', borderRadius: 6, marginBottom: 6 }}><span className="font-mono">{c.id}</span> {c.name} {c.cn ?? ''}</div>
                      ))}
                    </div>
                    <UnitModuleCard
                      title="BONUS CLASS"
                      hint="选择有声阅读或视频，点击配置拉起资源库进行搜索与匹配"
                    >
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <select className="form-input form-select" style={{ width: 170 }} value={unitBonusType} onChange={(e) => setUnitBonusType(e.target.value as 'audio' | 'video' | '')}>
                          <option value="">— 请选择资源类型 —</option>
                          <option value="audio">有声阅读</option>
                          <option value="video">视频</option>
                        </select>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setUnitResPicker({ open: true, target: 'bonus' })}>{unitBonusResId ? '更改' : '配置'}</button>
                        {unitBonusResId && (
                          <>
                            <span className="badge badge-teal">已配置</span>
                            <span className="font-mono">{unitBonusResId}</span>
                            <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)' }} onClick={() => setUnitBonusResId('')}>删除</button>
                          </>
                        )}
                      </div>
                      {unitBonusResId && <div className="form-hint" style={{ marginTop: 8 }}>{MOCK_RESOURCES.find((r) => r.resId === unitBonusResId)?.text ?? ''}</div>}
                    </UnitModuleCard>
                    <UnitModuleCard
                      title="DEEP LEARNING"
                      hint="有声阅读、AI导师、视频 三选二；有声阅读/视频通过配置调取，AI导师通过开关启用自动回挂"
                    >
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input type="checkbox" checked={unitDeepTypes.includes('audio')} onChange={() => toggleDeepType('audio')} />
                          有声阅读
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input type="checkbox" checked={unitDeepTypes.includes('ai')} onChange={() => toggleDeepType('ai')} />
                          AI 导师
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input type="checkbox" checked={unitDeepTypes.includes('video')} onChange={() => toggleDeepType('video')} />
                          视频
                        </label>
                      </div>
                      {unitDeepTypes.length === 2 && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div>
                            {unitDeepTypes[0] === 'ai' ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 41, border: '1px solid var(--border)', borderRadius: 8, padding: '0 10px', background: 'var(--mist)' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <input
                                    type="checkbox"
                                    checked={!!unitDeepResIds[0]}
                                    onChange={(e) => setUnitDeepResIds((p) => [e.target.checked ? defaultAiResId : '', p[1]])}
                                    disabled={!defaultAiResId}
                                  />
                                  启用AI导师
                                </label>
                                {unitDeepResIds[0] && (
                                  <>
                                    <span className="badge badge-teal">已启动</span>
                                    <span className="font-mono">{unitDeepResIds[0]}</span>
                                  </>
                                )}
                                {!defaultAiResId && <span className="form-hint">未找到启用中的课程AI配置</span>}
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setUnitResPicker({ open: true, target: 'deep0' })}>{unitDeepResIds[0] ? '更改' : '配置'}</button>
                                {unitDeepResIds[0] && (
                                  <>
                                    <span className="badge badge-teal">已配置</span>
                                    <span className="font-mono">{unitDeepResIds[0]}</span>
                                    <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)' }} onClick={() => setUnitDeepResIds((p) => ['', p[1]])}>删除</button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                          <div>
                            {unitDeepTypes[1] === 'ai' ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 41, border: '1px solid var(--border)', borderRadius: 8, padding: '0 10px', background: 'var(--mist)' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <input
                                    type="checkbox"
                                    checked={!!unitDeepResIds[1]}
                                    onChange={(e) => setUnitDeepResIds((p) => [p[0], e.target.checked ? defaultAiResId : ''])}
                                    disabled={!defaultAiResId}
                                  />
                                  启用AI导师
                                </label>
                                {unitDeepResIds[1] && (
                                  <>
                                    <span className="badge badge-teal">已启动</span>
                                    <span className="font-mono">{unitDeepResIds[1]}</span>
                                  </>
                                )}
                                {!defaultAiResId && <span className="form-hint">未找到启用中的课程AI配置</span>}
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setUnitResPicker({ open: true, target: 'deep1' })}>{unitDeepResIds[1] ? '更改' : '配置'}</button>
                                {unitDeepResIds[1] && (
                                  <>
                                    <span className="badge badge-teal">已配置</span>
                                    <span className="font-mono">{unitDeepResIds[1]}</span>
                                    <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)' }} onClick={() => setUnitDeepResIds((p) => [p[0], ''])}>删除</button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </UnitModuleCard>
                    <UnitModuleCard
                      title="STUDY REPORT"
                      hint="勾选本单元重要汉字、词汇、句型，支持外显和逐项删除"
                    >
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setStudyReportModalOpen(true)}>
                          {studyReportChosen.chars.length || studyReportChosen.words.length || studyReportChosen.sentences.length ? '重新配置' : '进入编辑'}
                        </button>
                        {(studyReportChosen.chars.length > 0 || studyReportChosen.words.length > 0 || studyReportChosen.sentences.length > 0) && (
                          <>
                            <span className="badge badge-teal">已配置</span>
                            <span className="form-hint">{`汉字 ${studyReportChosen.chars.length} · 词汇 ${studyReportChosen.words.length} · 句型 ${studyReportChosen.sentences.length}`}</span>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--rose)' }}
                              onClick={() => setStudyReportChosen({ chars: [], words: [], sentences: [] })}
                            >
                              删除
                            </button>
                          </>
                        )}
                      </div>
                      {(studyReportChosen.chars.length > 0 || studyReportChosen.words.length > 0 || studyReportChosen.sentences.length > 0) && (
                        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          {studyReportChosen.chars.map((c) => (
                            <span key={`c-${c}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <span className="badge badge-muted">{`汉字 ${c}`}</span>
                              <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)' }} onClick={() => setStudyReportChosen((p) => ({ ...p, chars: p.chars.filter((x) => x !== c) }))}>×</button>
                            </span>
                          ))}
                          {studyReportChosen.words.map((w) => (
                            <span key={`w-${w}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <span className="badge badge-muted">{`词汇 ${w}`}</span>
                              <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)' }} onClick={() => setStudyReportChosen((p) => ({ ...p, words: p.words.filter((x) => x !== w) }))}>×</button>
                            </span>
                          ))}
                          {studyReportChosen.sentences.map((s) => (
                            <span key={`s-${s}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <span className="badge badge-muted">{`句型 ${s}`}</span>
                              <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)' }} onClick={() => setStudyReportChosen((p) => ({ ...p, sentences: p.sentences.filter((x) => x !== s) }))}>×</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </UnitModuleCard>
                  </>
                )}

                {/* Lesson：学习卡片、练习题；其下配置音频和图片 */}
                {nodeKind === 'lesson' && (
                  <>
                    <div className="section-title" style={{ marginTop: 0 }}>课程配置 · 学习卡片与题型</div>
                    <div className="form-row" style={{ marginBottom: 4 }}>
                      <div className="form-group">
                        <label>NameId *</label>
                        <input type="text" className="font-mono" value={selectedNode.id} style={{ fontSize: '1rem' }} readOnly />
                      </div>
                      <div className="form-group">
                        <label>ParentId</label>
                        <input type="text" className="font-mono" value={parentId} style={{ fontSize: '1rem' }} readOnly />
                      </div>
                    </div>

                    <div className="form-group full">
                      <label>名称（多语言）</label>
                      <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, background: 'var(--mist)' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                          {LANG_OPTIONS.map((o) => (
                            <button
                              key={o.key}
                              type="button"
                              className={`btn btn-sm ${nameLang === o.key ? 'btn-primary' : 'btn-secondary'}`}
                              onClick={() => setNameLang(o.key)}
                              style={langBtnStyle(o.key, nameLang === o.key)}
                            >
                              {o.key} {o.label}
                            </button>
                          ))}
                        </div>
                        <input type="text" className="form-input" style={{ width: '100%', boxSizing: 'border-box' }} value={draftNameByLang[nameLang] ?? ''} onChange={(e) => setDraftNameByLang((prev) => ({ ...prev, [nameLang]: e.target.value }))} placeholder={`${LANG_OPTIONS.find((l) => l.key === nameLang)?.label ?? nameLang}名称`} />
                      </div>
                    </div>
                    <div className="form-group full">
                      <label>学习目标（多语言）</label>
                      <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, background: 'var(--mist)' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                          {LANG_OPTIONS.map((o) => (
                            <button
                              key={o.key}
                              type="button"
                              className={`btn btn-sm ${targetLang === o.key ? 'btn-primary' : 'btn-secondary'}`}
                              onClick={() => setTargetLang(o.key)}
                              style={langBtnStyle(o.key, targetLang === o.key)}
                            >
                              {o.key} {o.label}
                            </button>
                          ))}
                        </div>
                        <textarea rows={3} className="form-input" style={{ width: '100%', boxSizing: 'border-box' }} value={draftTargetByLang[targetLang] ?? ''} onChange={(e) => setDraftTargetByLang((prev) => ({ ...prev, [targetLang]: e.target.value }))} placeholder={`${LANG_OPTIONS.find((l) => l.key === targetLang)?.label ?? targetLang}学习目标`} />
                      </div>
                    </div>

                    <div className="section-title">关联内容 · 学习卡片与练习题</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <button type="button" className="btn btn-secondary" onClick={() => { setAssociateDefaultFocus(null); setMatchModal('associate'); }}>
                        关联相关内容
                      </button>
                      <button type="button" className="btn btn-ghost" onClick={() => { setAssociateDefaultFocus('question'); setMatchModal('associate'); }}>
                        预览并修改配置（题目 {questionCount}）
                      </button>
                      <span className="form-hint">学习资源 {resourceCount} 条 · 题目 {questionCount} 道（含音频、图片配置）</span>
                    </div>
                    <div style={{ marginTop: 10, border: '1px solid var(--stone-dark)', borderRadius: 10, background: 'var(--mist)', padding: 10 }}>
                      <div className="form-hint" style={{ marginBottom: 8 }}>已选内容外显（可直接移除）</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span className="badge badge-teal">学习资源</span>
                          {(selectedNode.resourceIds ?? []).length === 0 && <span className="form-hint">暂未选择</span>}
                          {(selectedNode.resourceIds ?? []).map((id) => (
                            <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid var(--stone-dark)', borderRadius: 999, background: '#fff', padding: '2px 8px' }}>
                              <span className="font-mono" style={{ fontSize: 12 }}>{id}</span>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '0 4px', color: 'var(--rose)' }}
                                onClick={() => updateSelectedNode({ resourceIds: (selectedNode.resourceIds ?? []).filter((x) => x !== id) })}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span className="badge badge-indigo">题目</span>
                          {(selectedNode.questionIds ?? []).length === 0 && <span className="form-hint">暂未选择</span>}
                          {(selectedNode.questionIds ?? []).map((id) => (
                            <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid var(--stone-dark)', borderRadius: 999, background: '#fff', padding: '2px 8px' }}>
                              <span className="font-mono" style={{ fontSize: 12 }}>{id}</span>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '0 4px', color: 'var(--rose)' }}
                                onClick={() => updateSelectedNode({ questionIds: (selectedNode.questionIds ?? []).filter((x) => x !== id) })}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Unit 也显示名称多语言与封面（与 Lesson 共用部分表单项时可选） */}
                {nodeKind === 'level' && (
                  <>
                    <div className="form-group full">
                      <label>名称（多语言）</label>
                      <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, background: 'var(--mist)' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                          {LANG_OPTIONS.map((o) => (
                            <button
                              key={o.key}
                              type="button"
                              className={`btn btn-sm ${nameLang === o.key ? 'btn-primary' : 'btn-secondary'}`}
                              onClick={() => setNameLang(o.key)}
                              style={langBtnStyle(o.key, nameLang === o.key)}
                            >
                              {o.key} {o.label}
                            </button>
                          ))}
                        </div>
                        <input type="text" className="form-input" style={{ width: '100%', boxSizing: 'border-box' }} value={draftNameByLang[nameLang] ?? ''} onChange={(e) => setDraftNameByLang((prev) => ({ ...prev, [nameLang]: e.target.value }))} placeholder={`${LANG_OPTIONS.find((l) => l.key === nameLang)?.label ?? nameLang}名称`} />
                      </div>
                    </div>
                  </>
                )}
                {nodeKind === 'unit' && (
                  <UnitModuleCard
                    title="COVER"
                    hint="封面图 5:3 比例，限制 1MB；点击更换上传本地图片，确认后更新"
                  >
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleCoverChange}
                    />
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <div
                        style={{
                          width: 100,
                          height: 60,
                          background: 'var(--bg)',
                          borderRadius: 10,
                          border: '1px solid var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                        }}
                      >
                        {(coverPreviewUrl || (selectedNode.cover && selectedNode.cover.startsWith('data:'))) ? (
                          <img src={coverPreviewUrl ?? selectedNode.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '1.5rem' }}>📷</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => coverInputRef.current?.click()}>
                          更换
                        </button>
                        {coverPendingFile && (
                          <>
                            <button type="button" className="btn btn-primary btn-sm" onClick={handleCoverConfirm}>确认</button>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={handleCoverCancel}>取消</button>
                          </>
                        )}
                      </div>
                    </div>
                    {coverError && <div className="form-hint" style={{ color: 'var(--rose)', marginTop: 6 }}>{coverError}</div>}
                    {selectedNode.cover && !coverPendingFile && !coverPreviewUrl && <div className="form-hint" style={{ marginTop: 6 }}>已上传封面</div>}
                  </UnitModuleCard>
                )}
              </div>
            ) : (
              <p className="text-muted empty-hint">
                在左侧目录树中选择一个节点以编辑详情
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 关联相关内容弹窗（学习资源 / 题目 / 有声阅读 / AI导师） */}
      {matchModal === 'associate' && selectedNode && (
        <AssociateContentModal
          node={selectedNode}
          questionPool={questionPool}
          questionCount={questionCount}
          onUpdateResourceIds={(ids) => updateSelectedNode({ resourceIds: ids })}
          onUpdateQuestionIds={(ids) => updateSelectedNode({ questionIds: ids })}
          onOpenResourcePicker={() => setMatchModal('resource')}
          onOpenQuestionPicker={() => setMatchModal('question')}
          defaultFocus={associateDefaultFocus}
          onClose={() => { setMatchModal(null); setAssociateDefaultFocus(null); }}
        />
      )}

      {/* 匹配学习资源弹窗（供关联弹窗内调用） */}
      {matchModal === 'resource' && selectedNode && (
        <MatchResourceModal
          selectedId={selectedNode.id}
          selectedIds={selectedNode.resourceIds ?? []}
          onSave={(ids) => {
            updateSelectedNode({ resourceIds: ids });
            setAssociateDefaultFocus('resource');
            setMatchModal('associate');
          }}
          onClose={() => setMatchModal(null)}
        />
      )}

      {/* 匹配题目弹窗（供关联弹窗内调用） */}
      {matchModal === 'question' && selectedNode && (
        <MatchQuestionModal
          selectedId={selectedNode.id}
          questionPool={questionPool}
          selectedIds={selectedNode.questionIds ?? []}
          onPatchQuestion={(resId, patch) => {
            setQuestionPool((prev) => prev.map((q) => (q.resId === resId ? { ...q, ...patch } : q)));
            upsertQuestionOverride({ resId, ...patch });
          }}
          onSave={(ids) => {
            updateSelectedNode({ questionIds: ids });
            setAssociateDefaultFocus('question');
            setMatchModal('associate');
          }}
          onClose={() => setMatchModal(null)}
        />
      )}

      {unitResPicker.open && (
        <div className="modal-overlay open" onClick={() => { setUnitResPicker({ open: false, target: null }); setUnitResKeyword(''); }} role="dialog" aria-modal="true" aria-label="资源库选择">
          <div className="modal" style={{ maxWidth: 760 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                资源库选择
                {pickerExpectedType === 'audio' ? ' · 有声阅读' : pickerExpectedType === 'video' ? ' · 视频' : pickerExpectedType === 'ai' ? ' · AI导师' : ''}
              </div>
              <button type="button" className="modal-close" onClick={() => { setUnitResPicker({ open: false, target: null }); setUnitResKeyword(''); }} aria-label="关闭">✕</button>
            </div>
            <div className="modal-body">
              {pickerExpectedType === 'ai' && <div className="form-hint" style={{ marginBottom: 10 }}>数据来源：AI配置 → NSK体系课AI能力。</div>}
              <div className="form-group">
                <label className="form-label">搜索资源</label>
                <input
                  className="form-input"
                  placeholder="输入资源ID / 目录ID / 文本关键词"
                  value={unitResKeyword}
                  onChange={(e) => setUnitResKeyword(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">资源列表（{unitResOptions.length}）</label>
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, maxHeight: 320, overflowY: 'auto' }}>
                  {unitResOptions.map((r) => (
                    <div key={r.resId} style={{ padding: '10px 12px', borderBottom: '1px solid var(--mist)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="font-mono" style={{ fontSize: 12 }}>{r.resId}</span>
                      <span className="badge">{r.type}</span>
                      <span className="text-muted">{r.dirId}</span>
                      <span style={{ flex: 1 }}>{r.text}</span>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => pickUnitRes(r.resId)}>匹配</button>
                    </div>
                  ))}
                  {unitResOptions.length === 0 && (
                    <div style={{ padding: 16 }} className="text-muted">无匹配资源，请修改搜索条件。</div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => { setUnitResPicker({ open: false, target: null }); setUnitResKeyword(''); }}>取消</button>
            </div>
          </div>
        </div>
      )}

      {/* 层级配置：仅 Level→Unit→Lesson 逐级新增 */}
      {addNodeModalOpen && allowedChildKind && (
        <AddNodeModal
          catalog={catalog}
          selectedId={selectedId}
          allowedKind={allowedChildKind}
          onAdd={(newNode) => {
            setCatalog((prev) => insertChildNode(prev, selectedId, newNode));
            setExpandedIds((e) => new Set([...e, selectedId]));
            setAddNodeModalOpen(false);
          }}
          onClose={() => setAddNodeModalOpen(false)}
        />
      )}

      {/* Study Report 编辑：勾选重要汉字、词汇、句型 */}
      {studyReportModalOpen && (
        <div className="modal-overlay open" onClick={() => setStudyReportModalOpen(false)} role="dialog" aria-modal="true" aria-label="Study Report 编辑">
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div className="modal-title">Study Report · 勾选重要内容</div>
              <button type="button" className="modal-close" onClick={() => setStudyReportModalOpen(false)} aria-label="关闭">✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">重要汉字</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {MOCK_CHARS.map((c) => (
                    <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input
                        type="checkbox"
                        checked={studyReportChosen.chars.includes(c)}
                        onChange={() =>
                          setStudyReportChosen((p) => ({
                            ...p,
                            chars: p.chars.includes(c) ? p.chars.filter((x) => x !== c) : [...p.chars, c],
                          }))
                        }
                      />
                      <span>{c}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">重要词汇</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {MOCK_WORDS.map((w) => (
                    <label key={w} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input
                        type="checkbox"
                        checked={studyReportChosen.words.includes(w)}
                        onChange={() =>
                          setStudyReportChosen((p) => ({
                            ...p,
                            words: p.words.includes(w) ? p.words.filter((x) => x !== w) : [...p.words, w],
                          }))
                        }
                      />
                      <span>{w}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">重要句型</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {MOCK_SENTENCES.map((s) => (
                    <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={studyReportChosen.sentences.includes(s)}
                        onChange={() =>
                          setStudyReportChosen((p) => ({
                            ...p,
                            sentences: p.sentences.includes(s) ? p.sentences.filter((x) => x !== s) : [...p.sentences, s],
                          }))
                        }
                      />
                      <span>{s}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setStudyReportModalOpen(false)}>取消</button>
              <button type="button" className="btn btn-primary" onClick={() => setStudyReportModalOpen(false)}>确定</button>
            </div>
          </div>
        </div>
      )}

      {/* 删除节点确认 */}
      {deleteConfirmId && (
        <div className="modal-overlay open" onClick={() => setDeleteConfirmId(null)} role="dialog" aria-modal="true" aria-label="确认删除">
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <div className="modal-title">确认删除节点</div>
              <button type="button" className="modal-close" onClick={() => setDeleteConfirmId(null)} aria-label="关闭">✕</button>
            </div>
            <div className="modal-body">
              <p style={{ margin: 0 }}>删除后该节点及其下所有子节点将一并移除，且不可恢复。确认删除？</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setDeleteConfirmId(null)}>取消</button>
              <button type="button" className="btn btn-primary" style={{ background: 'var(--rose)' }} onClick={() => handleDeleteNode(deleteConfirmId)}>确认删除</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const MIN_MATCH = 1;
const MAX_MATCH = 10;
type QuestionEditDraft = {
  resId: string;
  dirId: string;
  typeCode: 'T00' | 'T01' | 'T02' | 'T03' | 'T04' | 'T05';
  typeName: string;
  stem: string;
  knowledge: string;
  diff: '一星' | '二星';
  answerIndex: number;
  options: [string, string, string, string];
  saved: boolean;
  updatedAt: string;
};

function AssociateContentModal({
  node,
  questionPool,
  questionCount,
  onUpdateResourceIds,
  onUpdateQuestionIds,
  onOpenResourcePicker,
  onOpenQuestionPicker,
  defaultFocus: _defaultFocus,
  onClose,
}: {
  node: CatalogNode;
  questionPool: typeof MOCK_QUESTIONS;
  questionCount: number;
  onUpdateResourceIds: (ids: string[]) => void;
  onUpdateQuestionIds: (ids: string[]) => void;
  onOpenResourcePicker: () => void;
  onOpenQuestionPicker: () => void;
  defaultFocus?: 'question' | 'resource' | null;
  onClose: () => void;
}) {
  const isLesson = node.leaf === 1;
  const resourceIds = (node.resourceIds ?? []).filter(isLearningCardResource);
  const questionIds = node.questionIds ?? [];
  const matchedResources = useMemo(
    () => resourceIds.map((id) => MOCK_RESOURCES.find((r) => r.resId === id)).filter(Boolean) as typeof MOCK_RESOURCES,
    [resourceIds],
  );
  const matchedQuestions = useMemo(
    () => questionIds.map((id) => questionPool.find((q) => q.resId === id)).filter(Boolean) as typeof MOCK_QUESTIONS,
    [questionIds, questionPool],
  );

  const moveQuestion = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= questionIds.length) return;
    const next = [...questionIds];
    const temp = next[index];
    next[index] = next[target];
    next[target] = temp;
    onUpdateQuestionIds(next);
  };

  const removeQuestion = (id: string) => {
    onUpdateQuestionIds(questionIds.filter((q) => q !== id));
  };
  const removeResource = (id: string) => {
    onUpdateResourceIds(resourceIds.filter((r) => r !== id));
  };
  const moveResource = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= resourceIds.length) return;
    const next = [...resourceIds];
    const temp = next[index];
    next[index] = next[target];
    next[target] = temp;
    onUpdateResourceIds(next);
  };

  return (
    <div className="modal-overlay open" onClick={onClose} role="dialog" aria-modal="true" aria-label="关联相关内容">
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <div className="modal-title">关联相关内容</div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">✕</button>
        </div>
        <div className="modal-body">
          {isLesson && (
            <>
              <div className="form-group">
                <label className="form-label">📄 学习资源（1–10 条）</label>
                <p className="form-hint">当前已关联 {resourceIds.length} 条 · 仅配置学习卡片</p>
                <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenResourcePicker}>
                  去配置学习资源
                </button>
                {resourceIds.length > 0 && (
                  <div style={{ marginTop: 10, border: '1px solid var(--stone-dark)', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ background: 'var(--mist)', padding: '8px 10px', fontSize: 12, color: 'var(--ink-light)' }}>
                      已匹配学习资源预览（{resourceIds.length}）
                    </div>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 8, maxHeight: 180, overflowY: 'auto' }}>
                      {resourceIds.map((rid, idx) => {
                        const r = matchedResources.find((x) => x.resId === rid);
                        return (
                          <li key={rid} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 4px', borderBottom: '1px solid var(--mist)' }}>
                            <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--teal-l)', color: 'var(--teal)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                              {idx + 1}
                            </span>
                            <span className="font-mono" style={{ minWidth: 76, fontSize: 12 }}>{rid}</span>
                            <span style={{ flex: 1, fontSize: 12, color: 'var(--ink-light)' }}>
                              {r ? `${r.type} · ${r.text}` : '未找到资源详情'}
                            </span>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button type="button" className="btn btn-ghost btn-sm" onClick={() => moveResource(idx, -1)} disabled={idx === 0}>↑</button>
                              <button type="button" className="btn btn-ghost btn-sm" onClick={() => moveResource(idx, 1)} disabled={idx === resourceIds.length - 1}>↓</button>
                              <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)' }} onClick={() => removeResource(rid)}>移除</button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">❓ 题目（1–10 道）</label>
                <p className="form-hint">当前已关联 {questionCount} 道 · 按题目资源 ID 匹配</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenQuestionPicker}>
                    去配置题目
                  </button>
                </div>
                <div className="form-hint" style={{ marginTop: 8 }}>
                  新增题目必须通过“去配置题目”勾选加入；此处仅支持预览、删减与顺序调整
                </div>

                {questionIds.length > 0 && (
                  <div style={{ marginTop: 10, border: '1px solid var(--stone-dark)', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ background: 'var(--mist)', padding: '8px 10px', fontSize: 12, color: 'var(--ink-light)' }}>
                      已匹配题目预览（{questionIds.length}）
                    </div>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 8, maxHeight: 220, overflowY: 'auto' }}>
                      {questionIds.map((qid, idx) => {
                        const q = matchedQuestions.find((x) => x.resId === qid);
                        return (
                          <li key={qid} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 4px', borderBottom: '1px solid var(--mist)' }}>
                            <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--teal-l)', color: 'var(--teal)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                              {idx + 1}
                            </span>
                            <span className="font-mono" style={{ minWidth: 76, fontSize: 12 }}>{qid}</span>
                            <span style={{ flex: 1, fontSize: 12, color: 'var(--ink-light)' }}>
                              {q ? `${q.typeName} · ${q.knowledge}` : '未找到题目详情'}
                            </span>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button type="button" className="btn btn-ghost btn-sm" onClick={() => moveQuestion(idx, -1)} disabled={idx === 0}>↑</button>
                              <button type="button" className="btn btn-ghost btn-sm" onClick={() => moveQuestion(idx, 1)} disabled={idx === questionIds.length - 1}>↓</button>
                              <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)' }} onClick={() => removeQuestion(qid)}>移除</button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={onClose}>确定</button>
        </div>
      </div>
    </div>
  );
}

function AddNodeModal({
  catalog,
  selectedId,
  allowedKind,
  onAdd,
  onClose,
}: {
  catalog: CatalogNode[];
  selectedId: string;
  allowedKind: 'Level' | 'Unit' | 'Lesson';
  onAdd: (node: CatalogNode) => void;
  onClose: () => void;
}) {
  const parent = useMemo(() => {
    for (const root of catalog) {
      const found = findNode([root], selectedId);
      if (found) return found;
    }
    return null;
  }, [catalog, selectedId]);
  const nextId = getNextChildId(catalog, selectedId);
  const kindLabels = { Level: 'Level（层级）', Unit: 'Unit（单元）', Lesson: 'Lesson（课程）' };

  const handleAdd = () => {
    const name = allowedKind === 'Level' ? 'Level 1' : allowedKind === 'Unit' ? 'Unit 1' : 'Lesson 1';
    const newNode: CatalogNode = withMultiLang({
      id: nextId,
      name,
      cn: allowedKind === 'Lesson' ? '新课' : allowedKind === 'Unit' ? '新单元' : '新层级',
      leaf: allowedKind === 'Lesson' ? 1 : 0,
      children: allowedKind === 'Lesson' ? undefined : [],
    });
    onAdd(newNode);
  };

  return (
    <div className="modal-overlay open" onClick={onClose} role="dialog" aria-modal="true" aria-label="层级配置">
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <div className="modal-title">层级配置 · 新增{kindLabels[allowedKind]}</div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">✕</button>
        </div>
        <div className="modal-body">
          <p className="form-hint" style={{ marginBottom: 12 }}>
            当前选中：{parent?.name ?? selectedId}（{parent?.id}） · 仅可在此层级下新增{kindLabels[allowedKind]}
          </p>
          <p className="form-hint">新节点 ID：<span className="font-mono">{nextId}</span></p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>取消</button>
          <button type="button" className="btn btn-primary" onClick={handleAdd}>新增</button>
        </div>
      </div>
    </div>
  );
}

function MatchResourceModal({
  selectedId,
  selectedIds,
  onSave,
  onClose,
}: {
  selectedId: string;
  selectedIds: string[];
  onSave: (ids: string[]) => void;
  onClose: () => void;
}) {
  const [chosen, setChosen] = useState<Set<string>>(() => new Set(selectedIds.filter(isLearningCardResource)));
  const [dirFilter, setDirFilter] = useState(selectedId);
  const [keyword, setKeyword] = useState('');

  const list = useMemo(() => {
    return MOCK_RESOURCES.filter((r) => {
      if (r.type !== '学习卡片') return false;
      const byDir = !dirFilter || r.dirId === dirFilter || r.dirId.startsWith(dirFilter.slice(0, 4));
      const byKeyword = !keyword || [r.resId, r.text, r.type].join(' ').toLowerCase().includes(keyword.toLowerCase());
      return byDir && byKeyword;
    });
  }, [dirFilter, keyword]);

  const toggle = (resId: string) => {
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(resId)) next.delete(resId);
      else if (next.size < MAX_MATCH) next.add(resId);
      return next;
    });
  };

  const valid = chosen.size >= MIN_MATCH && chosen.size <= MAX_MATCH;

  return (
    <div className="modal-overlay open" onClick={onClose} role="dialog" aria-modal="true" aria-label="匹配学习资源">
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <div className="modal-title">匹配学习资源（学习卡片，1–10 条）</div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">✕</button>
        </div>
        <div className="modal-body">
          <p className="form-hint" style={{ marginBottom: 12 }}>
            当前节点: {selectedId} · 调用资源库进行搜索与匹配，至少 {MIN_MATCH} 条、最多 {MAX_MATCH} 条
          </p>
          <div className="form-group">
            <label className="form-label">筛选目录</label>
            <select className="form-input form-select" value={dirFilter} onChange={(e) => setDirFilter(e.target.value)}>
              <option value="">全部</option>
              <option value="N10101">N10101 · 米饭</option>
              <option value="N10102">N10102 · 饺子</option>
              <option value="N10201">N10201 · 水</option>
              <option value="N10202">N10202 · 茶</option>
              <option value="N10301">N10301 · 这是米饭</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">搜索资源</label>
            <input className="form-input" placeholder="输入资源ID或内容关键词" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">勾选资源（已选 {chosen.size} / {MAX_MATCH}）</label>
            <ul style={{ listStyle: 'none', margin: 0, maxHeight: 240, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
              {list.map((r) => (
                <li key={r.resId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--mist)' }}>
                  <input
                    type="checkbox"
                    checked={chosen.has(r.resId)}
                    onChange={() => toggle(r.resId)}
                    disabled={!chosen.has(r.resId) && chosen.size >= MAX_MATCH}
                  />
                  <span className="font-mono" style={{ fontSize: 12 }}>{r.resId}</span>
                  <span className="text-muted">·</span>
                  <span>{r.text}</span>
                  <span className="badge badge-muted">{r.type}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>取消</button>
          <button type="button" className="btn btn-primary" onClick={() => valid && onSave([...chosen])} disabled={!valid}>
            确认（{chosen.size} 条）
          </button>
        </div>
      </div>
    </div>
  );
}

function MatchQuestionModal({
  selectedId,
  questionPool,
  selectedIds,
  onPatchQuestion,
  onSave,
  onClose,
}: {
  selectedId: string;
  questionPool: typeof MOCK_QUESTIONS;
  selectedIds: string[];
  onPatchQuestion: (resId: string, patch: { typeName?: string; knowledge?: string; diff?: string }) => void;
  onSave: (ids: string[]) => void;
  onClose: () => void;
}) {
  const [chosen, setChosen] = useState<Set<string>>(() => new Set(selectedIds));
  const [dirFilter, setDirFilter] = useState(selectedId);
  const [keyword, setKeyword] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeQid, setActiveQid] = useState<string>(selectedIds[0] ?? '');
  const [expandBelong, setExpandBelong] = useState(true);
  const [expandDetail, setExpandDetail] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, QuestionEditDraft>>({});

  const list = useMemo(() => {
    return questionPool.filter((q) => {
      const byDir = !dirFilter || q.dirId === dirFilter || q.dirId.startsWith(dirFilter.slice(0, 4));
      const byKeyword = !keyword || [q.resId, q.typeName, q.knowledge].join(' ').toLowerCase().includes(keyword.toLowerCase());
      return byDir && byKeyword;
    });
  }, [dirFilter, keyword, questionPool]);

  const selectedList = useMemo(
    () => [...chosen].map((id) => questionPool.find((q) => q.resId === id)).filter(Boolean) as typeof MOCK_QUESTIONS,
    [chosen, questionPool],
  );

  const toggle = (resId: string) => {
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(resId)) next.delete(resId);
      else if (next.size < MAX_MATCH) next.add(resId);
      return next;
    });
  };

  const valid = chosen.size >= MIN_MATCH && chosen.size <= MAX_MATCH;
  const orderedChosenIds = useMemo(() => {
    const legacyOrder = selectedIds.filter((id) => chosen.has(id));
    const appended = questionPool.map((q) => q.resId).filter((id) => chosen.has(id) && !legacyOrder.includes(id));
    return [...legacyOrder, ...appended];
  }, [chosen, selectedIds, questionPool]);

  useEffect(() => {
    if (!selectedList.length) {
      setDrafts({});
      setActiveQid('');
      return;
    }
    setDrafts((prev) => {
      const next: Record<string, QuestionEditDraft> = {};
      for (const q of selectedList) {
        const existed = prev[q.resId];
        if (existed) {
          next[q.resId] = existed;
          continue;
        }
        const typeCode = q.typeName.includes('听音选图')
          ? 'T00'
          : q.typeName.includes('汉字填空')
            ? 'T01'
            : q.typeName.includes('词意选择')
              ? 'T02'
              : 'T05';
        next[q.resId] = {
          resId: q.resId,
          dirId: q.dirId,
          typeCode,
          typeName: q.typeName,
          stem: q.knowledge,
          knowledge: q.knowledge,
          diff: '一星',
          answerIndex: 0,
          options: ['选项A', '选项B', '选项C', '选项D'],
          saved: false,
          updatedAt: '',
        };
      }
      return next;
    });
    setActiveQid((prev) => (prev && selectedList.some((x) => x.resId === prev) ? prev : selectedList[0].resId));
  }, [selectedList]);

  const activeDraft = activeQid ? drafts[activeQid] : undefined;
  const typeLabelMap: Record<QuestionEditDraft['typeCode'], string> = {
    T00: '听音选图',
    T01: '汉字填空',
    T02: '词意选择1',
    T03: '听力选择',
    T04: '语序重组',
    T05: '语义选择',
  };
  const nowText = () => {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  const updateDraft = (qid: string, patch: Partial<QuestionEditDraft>) => {
    setDrafts((prev) => ({ ...prev, [qid]: { ...prev[qid], ...patch, saved: false } }));
  };
  const saveCurrent = () => {
    if (!activeQid) return;
    const current = drafts[activeQid];
    if (current) onPatchQuestion(activeQid, { typeName: current.typeName, knowledge: current.knowledge, diff: current.diff });
    setDrafts((prev) => ({ ...prev, [activeQid]: { ...prev[activeQid], saved: true, updatedAt: nowText() } }));
  };

  return (
    <div className="modal-overlay open" onClick={onClose} role="dialog" aria-modal="true" aria-label="匹配题目">
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <div className="modal-title">匹配题目（1–10 道）</div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">✕</button>
        </div>
        <div className="modal-body">
          <p className="form-hint" style={{ marginBottom: 12 }}>
            当前节点: {selectedId} · 调用题库进行搜索与匹配，至少 {MIN_MATCH} 道、最多 {MAX_MATCH} 道
          </p>
          <div className="form-group">
            <label className="form-label">筛选目录</label>
            <select className="form-input form-select" value={dirFilter} onChange={(e) => setDirFilter(e.target.value)}>
              <option value="">全部</option>
              <option value="N10101">N10101 · 米饭</option>
              <option value="N10102">N10102 · 饺子</option>
              <option value="N10201">N10201 · 水</option>
              <option value="N10202">N10202 · 茶</option>
              <option value="N10301">N10301 · 这是米饭</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">搜索题目</label>
            <input className="form-input" placeholder="输入题目ID、题型或知识点关键词" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">勾选题目（已选 {chosen.size} / {MAX_MATCH}）</label>
            <ul style={{ listStyle: 'none', margin: 0, maxHeight: 240, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
              {list.map((q) => (
                <li key={q.resId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--mist)' }}>
                  <input
                    type="checkbox"
                    checked={chosen.has(q.resId)}
                    onChange={() => toggle(q.resId)}
                    disabled={!chosen.has(q.resId) && chosen.size >= MAX_MATCH}
                  />
                  <span className="font-mono" style={{ fontSize: 12 }}>{q.resId}</span>
                  <span className="text-muted">·</span>
                  <span>{q.typeName}</span>
                  <span className="text-muted">·</span>
                  <span>{q.knowledge}</span>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="form-hint">选中后可进入二次编辑，逐题调整并独立保存</span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditorOpen(true)} disabled={!valid}>
                批量二次编辑
              </button>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>取消</button>
          <button type="button" className="btn btn-primary" onClick={() => valid && onSave(orderedChosenIds)} disabled={!valid}>
            确认（{chosen.size} 道）
          </button>
        </div>
      </div>

      {editorOpen && (
        <div className="modal-overlay open" onClick={() => setEditorOpen(false)} role="dialog" aria-modal="true" aria-label="批量编辑题目">
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 1160 }}>
            <div className="modal-header">
              <div className="modal-title">批量编辑 · {selectedId} · 共 {selectedList.length} 题</div>
              <button type="button" className="modal-close" onClick={() => setEditorOpen(false)} aria-label="关闭">✕</button>
            </div>
            <div className="modal-body" style={{ padding: 0, display: 'flex', minHeight: 700 }}>
              <div style={{ flex: 1, borderRight: '1px solid var(--stone-dark)', padding: 16, overflowY: 'auto' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                  {selectedList.map((q, idx) => {
                    const saved = drafts[q.resId]?.saved;
                    return (
                      <button
                        key={q.resId}
                        type="button"
                        className={`btn btn-sm ${activeQid === q.resId ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveQid(q.resId)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: saved ? 'var(--teal)' : 'var(--stone-dark)' }} />
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                {activeDraft && (
                  <>
                    <div style={{ border: '1px solid var(--stone-dark)', borderRadius: 10, marginBottom: 12, overflow: 'hidden' }}>
                      <button type="button" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: 'none', background: 'var(--mist)', padding: '10px 12px', cursor: 'pointer' }} onClick={() => setExpandBelong((v) => !v)}>
                        <b style={{ fontSize: 13 }}>题型所属</b>
                        <span style={{ fontSize: 12, color: 'var(--ink-light)' }}>{expandBelong ? '收起' : '展开'}</span>
                      </button>
                      {expandBelong && (
                        <div style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">目录ID</label>
                            <input className="form-input font-mono" value={activeDraft.dirId} readOnly />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">题目ID</label>
                            <input className="form-input font-mono" value={activeDraft.resId} readOnly />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">难度</label>
                            <select className="form-input form-select" value={activeDraft.diff} onChange={(e) => updateDraft(activeQid, { diff: e.target.value as '一星' | '二星' })}>
                              <option value="一星">★ 一星</option>
                              <option value="二星">★★ 二星</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ border: '1px solid var(--stone-dark)', borderRadius: 10, marginBottom: 12, overflow: 'hidden' }}>
                      <button type="button" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: 'none', background: 'var(--mist)', padding: '10px 12px', cursor: 'pointer' }} onClick={() => setExpandDetail((v) => !v)}>
                        <b style={{ fontSize: 13 }}>题型详情</b>
                        <span style={{ fontSize: 12, color: 'var(--ink-light)' }}>{expandDetail ? '收起' : '展开'}</span>
                      </button>
                      {expandDetail && (
                        <div style={{ padding: 12 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label">题型</label>
                              <select
                                className="form-input form-select"
                                value={activeDraft.typeCode}
                                onChange={(e) => {
                                  const nextCode = e.target.value as QuestionEditDraft['typeCode'];
                                  updateDraft(activeQid, { typeCode: nextCode, typeName: typeLabelMap[nextCode] });
                                }}
                              >
                                <option value="T00">T00 听音选图</option>
                                <option value="T01">T01 汉字填空</option>
                                <option value="T02">T02 词意选择1</option>
                                <option value="T03">T03 听力选择</option>
                                <option value="T04">T04 语序重组</option>
                                <option value="T05">T05 语义选择</option>
                              </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label">知识点</label>
                              <input className="form-input" value={activeDraft.knowledge} onChange={(e) => updateDraft(activeQid, { knowledge: e.target.value })} />
                            </div>
                          </div>
                          <div className="form-group" style={{ marginBottom: 10 }}>
                            <label className="form-label">题干</label>
                            <input className="form-input" value={activeDraft.stem} onChange={(e) => updateDraft(activeQid, { stem: e.target.value })} />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            {activeDraft.options.map((v, i) => (
                              <div key={i} className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">选项 {String.fromCharCode(65 + i)}</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <input
                                    className="form-input"
                                    value={v}
                                    onChange={(e) => {
                                      const next = [...activeDraft.options] as QuestionEditDraft['options'];
                                      next[i] = e.target.value;
                                      updateDraft(activeQid, { options: next });
                                    }}
                                  />
                                  <button
                                    type="button"
                                    className={`btn btn-sm ${activeDraft.answerIndex === i ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => updateDraft(activeQid, { answerIndex: i })}
                                  >
                                    ✓
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                      <span className="form-hint">{activeDraft.saved ? `已保存（${activeDraft.updatedAt}）` : '未保存变更'}</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" className="btn btn-ghost" onClick={() => setDetailOpen(true)}>一键直通配置详情</button>
                        <button type="button" className="btn btn-primary" onClick={saveCurrent}>保存当前题</button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div style={{ width: 370, padding: 16, background: 'var(--mist)' }}>
                <div style={{ fontSize: 11, color: 'var(--ink-light)', marginBottom: 10 }}>16:9 横屏平板预览</div>
                <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 14, background: '#1f1f22', padding: 8, boxShadow: '0 8px 20px rgba(0,0,0,0.16)' }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: 10, background: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--stone-dark)', fontSize: 11, color: 'var(--ink-light)' }}>
                      {activeDraft ? `${activeDraft.typeCode} · ${activeDraft.typeName}` : '题型预览'}
                    </div>
                    <div style={{ padding: 10, flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ background: 'var(--stone)', borderRadius: 8, padding: '8px 10px', fontSize: 12, textAlign: 'center' }}>
                        {activeDraft?.stem || '题干预览'}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, flex: 1 }}>
                        {(activeDraft?.options ?? ['A', 'B', 'C', 'D']).map((opt, i) => (
                          <div key={i} style={{ border: activeDraft?.answerIndex === i ? '2px solid var(--teal)' : '1px solid var(--stone-dark)', borderRadius: 8, background: activeDraft?.answerIndex === i ? 'var(--teal-l)' : 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6, textAlign: 'center', fontSize: 12 }}>
                            <span style={{ marginRight: 4, color: 'var(--ink-light)' }}>{String.fromCharCode(65 + i)}.</span>{opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="form-hint" style={{ marginTop: 8 }}>
                  仅保留横屏预览，不展示竖屏预览
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setEditorOpen(false)}>返回选题</button>
              <button type="button" className="btn btn-primary" onClick={() => { selectedList.forEach((q) => { const d = drafts[q.resId]; if (d) onPatchQuestion(q.resId, { typeName: d.typeName, knowledge: d.knowledge, diff: d.diff }); }); onSave(orderedChosenIds); setEditorOpen(false); onClose(); }}>
                保存并应用（{chosen.size} 道）
              </button>
            </div>
          </div>
        </div>
      )}

      {detailOpen && activeDraft && (
        <div className="modal-overlay open" onClick={() => setDetailOpen(false)} role="dialog" aria-modal="true" aria-label="配置详情">
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div className="modal-title">配置详情 · {activeDraft.resId}</div>
              <button type="button" className="modal-close" onClick={() => setDetailOpen(false)} aria-label="关闭">✕</button>
            </div>
            <div className="modal-body">
              <div className="form-hint">题型：{activeDraft.typeCode} {activeDraft.typeName}</div>
              <div className="form-hint">目录：{activeDraft.dirId}</div>
              <div className="form-hint">知识点：{activeDraft.knowledge}</div>
              <div className="form-hint">答案：{String.fromCharCode(65 + activeDraft.answerIndex)}</div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-primary" onClick={() => setDetailOpen(false)}>我知道了</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
