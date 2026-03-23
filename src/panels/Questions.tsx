import { useEffect, useMemo, useRef, useState } from 'react';
import { applyQuestionListOverrides, subscribeQuestionOverrideUpdates } from '../stores/questionOverrides';

type QuestionRow = {
  no: string;
  dirId: string;
  typeName: string;
  typeCode: string;
  resId: string;
  diff: string;
  knowledge: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

const defaultRows: QuestionRow[] = [
  { no: '001', dirId: 'N10101', typeName: '听音选图', typeCode: 'T00_LISTEN_SELECT_IMAGE', resId: 'M0300001', diff: '★', knowledge: '米饭', enabled: true, createdAt: '2026-03-03 10:22', updatedAt: '2026-03-04 09:35' },
  { no: '002', dirId: 'N10101', typeName: '汉字填空', typeCode: 'T01_PICTURE_FILL_IN', resId: 'M0400001', diff: '★', knowledge: '米', enabled: true, createdAt: '2026-03-03 11:10', updatedAt: '2026-03-04 09:40' },
];

const OPTION_LANGS = ['EN', 'ES', 'FR', 'PT', 'JA', 'KO', 'TH', 'VI', 'ID', 'MS', 'KM'] as const;
type OptionItem = { cn: string; pinyin: string; emoji: string; correct: boolean; byLang?: Partial<Record<typeof OPTION_LANGS[number], string>> };
const defaultOptions: OptionItem[] = [
  { cn: '面条', pinyin: 'miàn tiáo', emoji: '🍜', correct: true },
  { cn: '饺子', pinyin: 'jiǎo zi', emoji: '🥟', correct: false },
  { cn: '米饭', pinyin: 'mǐ fàn', emoji: '🍚', correct: false },
  { cn: '汤', pinyin: 'tāng', emoji: '🍲', correct: false },
];

type PreviewType = 'T00' | 'T01' | 'T02' | 'T03' | 'T04' | 'T05';
type TypeMeta = {
  stemLabel: string;
  stemPlaceholder: string;
  needAudio: boolean;
  optionMainLabel: string;
  optionMainPlaceholder: string;
  showPinyin: boolean;
  showVisual: boolean;
  typeHint: string;
};

type LessonItem = { id: string; label: string; lessonNo: number };
type UnitItem = { id: string; label: string; unitNo: number; lessons: LessonItem[] };
const LEVEL_OPTIONS = [{ id: '1', label: 'Level 1' }];
const LESSON_MAP: UnitItem[] = [
  {
    id: 'N10100',
    label: 'U1 日常主食',
    unitNo: 1,
    lessons: [
      { id: 'N10101', label: 'L1 米饭', lessonNo: 1 },
      { id: 'N10102', label: 'L2 饺子', lessonNo: 2 },
      { id: 'N10103', label: 'L3 吃包子', lessonNo: 3 },
    ],
  },
  {
    id: 'N10200',
    label: 'U2 日常饮品',
    unitNo: 2,
    lessons: [
      { id: 'N10201', label: 'L1 水', lessonNo: 1 },
      { id: 'N10202', label: 'L2 茶', lessonNo: 2 },
      { id: 'N10203', label: 'L3 喝牛奶', lessonNo: 3 },
    ],
  },
];

const TYPE_META: Record<PreviewType, TypeMeta> = {
  T00: {
    stemLabel: '题干说明（听音选图）',
    stemPlaceholder: '如：听音频，选择正确图片',
    needAudio: true,
    optionMainLabel: '选项图片ID',
    optionMainPlaceholder: '如 [米饭图片]',
    showPinyin: false,
    showVisual: false,
    typeHint: 'T00：以音频为题干，A-D 选项应填写图片ID',
  },
  T01: {
    stemLabel: '题干图片ID',
    stemPlaceholder: '如：[大米图片]',
    needAudio: false,
    optionMainLabel: '选项汉字',
    optionMainPlaceholder: '如：米',
    showPinyin: true,
    showVisual: false,
    typeHint: 'T01：图片填空，A-D 为汉字选项（可填拼音）',
  },
  T02: {
    stemLabel: '题干内容（图片+词汇）',
    stemPlaceholder: '如：[米饭图片] 米饭 mǐfàn',
    needAudio: true,
    optionMainLabel: '选项英文释义',
    optionMainPlaceholder: '如：Rice / Noodles',
    showPinyin: false,
    showVisual: false,
    typeHint: 'T02：词意选择，A-D 选项为英文释义',
  },
  T03: {
    stemLabel: '题干说明（听力选择）',
    stemPlaceholder: '如：听音频，选择你听到的句子',
    needAudio: true,
    optionMainLabel: '句子选项',
    optionMainPlaceholder: '如：我吃包子。',
    showPinyin: true,
    showVisual: false,
    typeHint: 'T03：听力选择，A-D 选项为句子（中文+拼音）',
  },
  T04: {
    stemLabel: '英文题干',
    stemPlaceholder: '如：Dumplings / Tea leaves',
    needAudio: true,
    optionMainLabel: '选项汉字',
    optionMainPlaceholder: '如：饺子',
    showPinyin: true,
    showVisual: true,
    typeHint: 'T04：词意选择2，A-D 建议填写图片ID + 拼音 + 汉字',
  },
  T05: {
    stemLabel: '英文题干',
    stemPlaceholder: '如：This is noodles.',
    needAudio: false,
    optionMainLabel: '中文句子选项',
    optionMainPlaceholder: '如：这是面条。',
    showPinyin: true,
    showVisual: false,
    typeHint: 'T05：语义/语法选择，A-D 为中文句子（可填拼音）',
  },
};

const IMAGE_REF_MAP: Record<string, { name: string; size: string; dirId: string; usage: string }> = {
  P100001: { name: '米饭主图.png', size: '126KB', dirId: 'N10101', usage: '学习资源/题库' },
  P100002: { name: '饺子主图.png', size: '143KB', dirId: 'N10102', usage: '学习资源/题库' },
  P100003: { name: '包子主图.png', size: '138KB', dirId: 'N10103', usage: '学习资源/题库' },
  P100004: { name: '水主图.png', size: '102KB', dirId: 'N10201', usage: '学习资源/题库' },
  P100005: { name: '茶主图.png', size: '118KB', dirId: 'N10202', usage: '学习资源/题库' },
};
const AUDIO_REF_LIST: { id: string; name: string }[] = [
  { id: 'Y100001', name: 'Unit1-MainFoods.mp3' },
  { id: 'Y100002', name: 'Unit2-DailyDrinks.mp3' },
  { id: 'Y100003', name: 'Unit3-WhatIsThis.mp3' },
  { id: 'Y100004', name: 'Unit4-SelfIntro.mp3' },
  { id: 'Y100005', name: 'Unit5-MyPet.mp3' },
  { id: 'Y100006', name: 'Unit6-FamilyMembers.mp3' },
];

export function Questions() {
  const [rows, setRows] = useState<QuestionRow[]>(() => applyQuestionListOverrides(defaultRows));
  const [refreshing, setRefreshing] = useState(false);
  const [toastText, setToastText] = useState('');
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionRow | null>(null);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);
  const [previewType, setPreviewType] = useState<PreviewType>('T00');
  const [stemTextByLang, setStemTextByLang] = useState<Record<string, string>>({ CN: '', EN: 'noodles', ES: '', FR: '', PT: '', JA: '', KO: '', TH: '', VI: '', ID: '', MS: '', KM: '' });
  const [stemLang, setStemLang] = useState('EN');
  const [options, setOptions] = useState<OptionItem[]>(defaultOptions);
  const [audioPickerOpen, setAudioPickerOpen] = useState(false);
  const [imagePickerForOption, setImagePickerForOption] = useState<number | null>(null);
  const [optionImagePickerField, setOptionImagePickerField] = useState<'cn' | 'emoji'>('cn');
  const [stemImagePickerOpen, setStemImagePickerOpen] = useState(false);
  const [stemPinyin, setStemPinyin] = useState('');
  const [stemImageIdT02, setStemImageIdT02] = useState('');
  const [cfgUnitId, setCfgUnitId] = useState<string>('N10100');
  const [cfgLessonId, setCfgLessonId] = useState<string>('N10101');
  const [cfgSerial, setCfgSerial] = useState<string>('01');
  const [cfgAudioId, setCfgAudioId] = useState('T100001.mp3');
  const [cfgAnswerAnalysisByLang, setCfgAnswerAnalysisByLang] = useState<Record<string, string>>({ CN: '', EN: '', ES: '', FR: '', PT: '', JA: '', KO: '', TH: '', VI: '', ID: '', MS: '', KM: '' });
  const [cfgAnswerAnalysisLang, setCfgAnswerAnalysisLang] = useState('CN');
  const [cfgEnabled, setCfgEnabled] = useState(true);
  const [cfgErrors, setCfgErrors] = useState<Record<string, string>>({});
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [dirKeyword, setDirKeyword] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedDiff, setSelectedDiff] = useState<string>('');
  const [importFileName, setImportFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return subscribeQuestionOverrideUpdates(() => {
      setRows((prev) => applyQuestionListOverrides(prev));
    });
  }, []);
  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    window.setTimeout(() => {
      setRows((prev) => applyQuestionListOverrides([...prev]));
      setRefreshing(false);
      setToastText('题库管理刷新完成');
      window.setTimeout(() => setToastText(''), 1600);
    }, 600);
  };

  const setCorrect = (index: number) => {
    setOptions((prev) => prev.map((o, i) => ({ ...o, correct: i === index })));
  };

  const updateOption = (index: number, field: keyof OptionItem, value: string | boolean) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, [field]: value } : o)));
  };
  const updateOptionByLang = (index: number, lang: typeof OPTION_LANGS[number], value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, byLang: { ...(o.byLang ?? {}), [lang]: value } } : o)));
  };
  const [optLang, setOptLang] = useState<typeof OPTION_LANGS[number]>('EN');

  const imageRefValues = useMemo(
    () =>
      Object.entries(IMAGE_REF_MAP).map(([id, meta]) => `${id} ${meta.name} ${meta.dirId} ${meta.usage}`.toLowerCase()),
    [],
  );
  const imageIdList = useMemo(() => Object.keys(IMAGE_REF_MAP), []);
  const resolveImageId = (raw: string) => {
    const v = raw.trim();
    if (!v) return '';
    if (IMAGE_REF_MAP[v]) return v;
    const q = v.toLowerCase();
    const idx = imageRefValues.findIndex((line) => line.includes(q));
    return idx >= 0 ? imageIdList[idx] : v;
  };

  const openAdd = () => {
    const now = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    const nowText = `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())} ${p(now.getHours())}:${p(now.getMinutes())}`;
    setEditingQuestion({
      no: String(rows.length + 1).padStart(3, '0'),
      dirId: cfgLessonId || 'N10101',
      typeName: '听音选图',
      typeCode: 'T00_LISTEN_SELECT_IMAGE',
      resId: `M0${String(300000 + rows.length + 1)}`,
      diff: '★',
      knowledge: '',
      enabled: true,
      createdAt: nowText,
      updatedAt: nowText,
    });
    setPreviewType('T00');
    setCfgEnabled(true);
    setCfgErrors({});
    setConfigModalOpen(true);
  };
  const openConfig = (row: QuestionRow) => {
    setEditingQuestion(row);
    const match = row.dirId.match(/^N(\d)(\d{2})0(\d)$/);
    if (match) {
      const u = Number(match[2]);
      const l = Number(match[3]);
      const unit = LESSON_MAP.find((x) => x.unitNo === u);
      if (unit) {
        setCfgUnitId(unit.id);
        const lesson = unit.lessons.find((x) => x.lessonNo === l);
        setCfgLessonId(lesson?.id ?? unit.lessons[0]?.id ?? 'N10101');
      }
    }
    setCfgAnswerAnalysisByLang((prev) => ({ ...prev, CN: row.knowledge ?? '', EN: '', ES: '', FR: '', PT: '', JA: '', KO: '', TH: '', VI: '', ID: '', MS: '', KM: '' }));
    setCfgAudioId('T100001.mp3');
    setCfgEnabled(row.enabled);
    setCfgErrors({});
    setConfigModalOpen(true);
  };

  const confirmDelete = () => {
    if (deleteConfirmIndex === null) return;
    setRows((prev) => prev.filter((_, i) => i !== deleteConfirmIndex));
    setDeleteConfirmIndex(null);
  };
  const onPickImportFile = (file?: File) => {
    if (!file) return;
    setImportFileName(file.name);
  };
  const toggleEnabled = (resId: string) => {
    setRows((prev) => prev.map((r) => (r.resId === resId ? { ...r, enabled: !r.enabled } : r)));
  };
  const cfgLessonOptions = useMemo(
    () => LESSON_MAP.find((u) => u.id === cfgUnitId)?.lessons ?? [],
    [cfgUnitId],
  );
  const typeMeta = TYPE_META[previewType];
  const filterUnitOptions = useMemo(() => (selectedLevel ? LESSON_MAP : []), [selectedLevel]);
  const filterLessonOptions = useMemo(
    () => (selectedUnit ? LESSON_MAP.find((u) => u.id === selectedUnit)?.lessons ?? [] : []),
    [selectedUnit],
  );
  const cfgUnitNo = LESSON_MAP.find((u) => u.id === cfgUnitId)?.unitNo ?? 1;
  const cfgLessonNo = cfgLessonOptions.find((l) => l.id === cfgLessonId)?.lessonNo ?? 1;
  // 题号锁定前缀：Level(1) + 0Unit + 0Lesson + 序号，例如 U2/L3/01 => 1020301
  const lockedQuestionCode = `1${String(cfgUnitNo).padStart(2, '0')}${String(cfgLessonNo).padStart(2, '0')}${cfgSerial.padStart(2, '0')}`;
  const stemText = previewType === 'T02' ? (stemTextByLang.CN || stemImageIdT02 || '') : (stemTextByLang.CN || stemTextByLang.EN || '');
  const validateConfig = () => {
    const errs: Record<string, string> = {};
    if (!previewType) errs.type = '请选择题目类型';
    if (previewType !== 'T00' && previewType !== 'T03' && !stemText.trim()) errs.stem = '请输入题干';
    if (typeMeta.needAudio && !cfgAudioId.trim()) errs.audio = '该题型必须填写音频ID';
    const hasAnswer = Object.values(cfgAnswerAnalysisByLang).some((v) => v.trim());
    if (!hasAnswer) errs.answer = '请填写答案解析（至少一种语言）';
    if (!cfgSerial.trim()) errs.serial = '请输入序号';
    if (options.filter((o) => o.correct).length !== 1) errs.correct = '必须且仅能选择 1 个正确答案';
    options.forEach((o, i) => {
      if (!o.cn.trim()) errs[`opt-${i}`] = `${String.fromCharCode(65 + i)} 选项「${typeMeta.optionMainLabel}」必填`;
    });
    return errs;
  };
  const handleConfirmConfig = () => {
    const errs = validateConfig();
    setCfgErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setConfigModalOpen(false);
  };
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const unitMatch = selectedUnit ? row.dirId.startsWith(selectedUnit.slice(0, 4)) || row.dirId === selectedUnit : true;
      const lessonMatch = selectedLesson ? row.dirId === selectedLesson : true;
      const keywordMatch = dirKeyword ? row.dirId.toLowerCase().includes(dirKeyword.toLowerCase()) : true;
      const typeMatch = selectedType ? row.typeName === selectedType : true;
      const diffMatch = selectedDiff ? row.diff === selectedDiff : true;
      return unitMatch && lessonMatch && keywordMatch && typeMatch && diffMatch;
    });
  }, [rows, selectedUnit, selectedLesson, dirKeyword, selectedType, selectedDiff]);

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">题库管理</div>
          <div className="page-subtitle">共 54 道题目（题组）· 含 T00–T05 六种题型</div>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-secondary" onClick={handleRefresh} disabled={refreshing}>
            <span className={`spin-icon ${refreshing ? 'spinning' : ''}`}>↻</span>
            刷新
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setImportModalOpen(true)}>导入题目</button>
          <button type="button" className="btn btn-primary" onClick={openAdd}>+ 新增题目</button>
        </div>
      </div>
      <div className="filter-bar">
        <select
          className="filter-select"
          value={selectedLevel}
          onChange={(e) => {
            setSelectedLevel(e.target.value);
            setSelectedUnit('');
            setSelectedLesson('');
          }}
        >
          <option value="">全部级别</option>
          {LEVEL_OPTIONS.map((lv) => (
            <option key={lv.id} value={lv.id}>{lv.label}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={selectedUnit}
          onChange={(e) => {
            setSelectedUnit(e.target.value);
            setSelectedLesson('');
          }}
          disabled={!selectedLevel}
        >
          <option value="">全部单元</option>
          {filterUnitOptions.map((u) => (
            <option key={u.id} value={u.id}>U{u.unitNo} · {u.label}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={selectedLesson}
          onChange={(e) => setSelectedLesson(e.target.value)}
          disabled={!selectedUnit}
        >
          <option value="">全部课程</option>
          {filterLessonOptions.map((l) => (
            <option key={l.id} value={l.id}>L{l.lessonNo} · {l.label}</option>
          ))}
        </select>
        <input
          className="filter-select"
          style={{ minWidth: 170 }}
          placeholder="目录ID，如 N10101"
          value={dirKeyword}
          onChange={(e) => setDirKeyword(e.target.value)}
        />
        <select className="filter-select" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
          <option value="">全部题型</option>
          <option>T00 听音选图</option>
          <option>T01 汉字填空</option>
          <option>T02 词意选择1</option>
          <option>T03 听力选择</option>
          <option>T05 语义选择</option>
        </select>
        <span className={`filter-tag ${selectedDiff === '' ? 'active' : ''}`} onClick={() => setSelectedDiff('')}>全部难度</span>
        <span className={`filter-tag ${selectedDiff === '★' ? 'active' : ''}`} onClick={() => setSelectedDiff('★')}>★ 一星</span>
        <span className={`filter-tag ${selectedDiff === '★★' ? 'active' : ''}`} onClick={() => setSelectedDiff('★★')}>★★ 二星</span>
      </div>
      <div className="table-wrap">
        <div className="table-top">
          <span className="table-count">共 {filteredRows.length} 道题目</span>
          <span style={{ flex: 1 }} />
        </div>
        <table>
          <thead>
            <tr>
              <th>序号</th>
              <th>目录ID</th>
              <th>题型</th>
              <th>题型编码</th>
              <th>资源ID</th>
              <th>难度</th>
              <th>知识点</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.resId}>
                <td className="td-mono">{row.no}</td>
                <td className="td-mono">{row.dirId}</td>
                <td>{row.typeName}</td>
                <td className="td-mono text-muted">{row.typeCode}</td>
                <td className="td-mono">{row.resId}</td>
                <td className="text-muted">{row.diff}</td>
                <td>{row.knowledge}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label className="toggle-wrap">
                      <input type="checkbox" checked={row.enabled} onChange={() => toggleEnabled(row.resId)} />
                      <div className="toggle-track" />
                      <div className="toggle-thumb" />
                    </label>
                    <span style={{ fontSize: 12, color: 'var(--ink-light)' }}>{row.enabled ? '已启用' : '已停用'}</span>
                  </div>
                </td>
                <td className="td-mono" style={{ fontSize: 12 }}>{row.createdAt}</td>
                <td className="td-mono" style={{ fontSize: 12 }}>{row.updatedAt}</td>
                <td>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => openConfig(row)}>配置</button>
                  {' '}
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirmIndex(rows.findIndex((r) => r.resId === row.resId))} style={{ color: 'var(--rose)' }}>删除</button>
                </td>
              </tr>
            ))}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={11} style={{ textAlign: 'center', color: 'var(--ink-light)' }}>
                  无匹配数据，请调整筛选条件
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="pagination">
          <span className="page-info">第 1 页，共 6 页</span>
          <button type="button" className="page-btn">‹</button>
          <button type="button" className="page-btn active">1</button>
          <button type="button" className="page-btn">›</button>
        </div>
      </div>

      {/* 导入题目弹窗 */}
      <div className={`modal-overlay ${importModalOpen ? 'open' : ''}`} onClick={() => setImportModalOpen(false)} role="dialog" aria-modal="true" aria-label="导入题目">
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
          <div className="modal-header">
            <div className="modal-title">导入题目</div>
            <button type="button" className="modal-close" onClick={() => setImportModalOpen(false)} aria-label="关闭">✕</button>
          </div>
          <div className="modal-body">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv"
              style={{ display: 'none' }}
              onChange={(e) => onPickImportFile(e.target.files?.[0])}
            />
            <div
              style={{
                border: '1px dashed var(--stone-dark)',
                borderRadius: 12,
                padding: '44px 20px',
                textAlign: 'center',
                background: 'var(--mist)',
                marginBottom: 18,
                cursor: 'pointer',
              }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                onPickImportFile(e.dataTransfer.files?.[0]);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            >
              <div style={{ width: 50, height: 50, margin: '0 auto 12px', border: '2px solid var(--ink-light)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-light)', fontSize: 26 }}>
                ↑
              </div>
              <div style={{ fontSize: 16, marginBottom: 2 }}>点击上传或拖拽文件至此</div>
              <div className="form-hint">支持 .xlsx / .csv 格式 · 最大 10MB</div>
              {importFileName && (
                <div style={{ marginTop: 10, fontSize: 12, color: 'var(--teal)' }}>已选择：{importFileName}</div>
              )}
            </div>

            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>导入规范</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--ink-light)', lineHeight: 1.9 }}>
              <li>题号格式：Lv+1｜Unit+1｜Lesson+1，如 <b style={{ color: 'var(--ink)' }}>1010101</b></li>
              <li>必填列：题号、单元、课程、题型、题型编码、难度、知识点</li>
              <li>题型编码：<b style={{ color: 'var(--ink)' }}>T00_LISTEN_SELECT_IMAGE / T01_PICTURE_FILL_IN</b> 等</li>
              <li>正确答案：填写 <b style={{ color: 'var(--ink)' }}>A / B / C / D</b></li>
              <li>答案解析需分别填写中文和英文两列</li>
            </ul>

            <div style={{ marginTop: 12 }}>
              <a
                href="/题目导入表.xlsx"
                download="题目导入表.xlsx"
                className="btn btn-ghost"
                style={{ gap: 6, textDecoration: 'none' }}
              >
                <span>⇩</span>
                下载导入模板
              </a>
              <span className="form-hint" style={{ marginLeft: 8 }}>模板含全部字段及示例数据</span>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => setImportModalOpen(false)}>取消</button>
            <button type="button" className="btn btn-primary" onClick={() => setImportModalOpen(false)}>确认导入</button>
          </div>
        </div>
      </div>

      {/* 修改题库配置 — 含显示顺序/题干/可编辑选项、16:9 横屏预览、题型切换 */}
      <div className={`modal-overlay ${configModalOpen ? 'open' : ''}`} onClick={() => setConfigModalOpen(false)} role="dialog" aria-modal="true" aria-label="修改题库配置">
        <div className="modal modal-wide" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '95vw', width: 1200 }}>
          <div className="modal-header">
            <div>
              <div className="modal-title">修改题库配置</div>
              <div style={{ fontSize: 11, color: 'var(--ink-light)', marginTop: 2 }}>
                当前题型：{editingQuestion?.typeName ?? 'T00 听音选图'} · {editingQuestion?.knowledge ?? 'N10101 米饭'}
              </div>
            </div>
            <button type="button" className="modal-close" onClick={() => setConfigModalOpen(false)} aria-label="关闭">✕</button>
          </div>
          <div className="modal-body" style={{ padding: 0, display: 'flex', minHeight: '80vh' }}>
            {/* 左侧：题型详情 + 题干编辑 + 选项 */}
            <div style={{ flex: 1, padding: 24, overflowY: 'auto', borderRight: '1px solid var(--stone-dark)' }}>
              <div style={{ background: 'var(--ink)', color: '#fff', padding: '9px 14px', borderRadius: 6, marginBottom: 14, fontSize: 13, fontWeight: 500 }}>题型详情</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">* 题目类型</label><select className="form-input form-select" value={previewType} onChange={(e) => setPreviewType(e.target.value as PreviewType)}><option value="T00">T00 听音选图</option><option value="T01">T01 汉字填空</option><option value="T02">T02 词意选择1</option><option value="T03">T03 听力选择</option><option value="T04">T04 词意选择2</option><option value="T05">T05 语义选择</option></select></div>
                {cfgErrors.type && <div className="form-hint" style={{ color: 'var(--rose)', marginTop: -6 }}>{cfgErrors.type}</div>}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">* 题号（前缀自动锁定）</label>
                  <input
                    className="form-input"
                    value={lockedQuestionCode}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 7);
                      const serial = digits.slice(-2);
                      setCfgSerial((serial || '01').padStart(2, '0').slice(-2));
                    }}
                    style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}
                  />
                  <div className="form-hint">题号{lockedQuestionCode}（规则：Lv+1｜Unit+1｜Lesson+1）</div>
                  {cfgErrors.serial && <div className="form-hint" style={{ color: 'var(--rose)' }}>{cfgErrors.serial}</div>}
                </div>
              </div>
              <div style={{ background: 'var(--ink)', color: '#fff', padding: '9px 14px', borderRadius: 6, marginBottom: 14, fontSize: 13, fontWeight: 500 }}>题干编辑</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                  {previewType === 'T01' ? (
                    <>
                      <label className="form-label">* {typeMeta.stemLabel}</label>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          className="form-input"
                          style={{ flex: 1 }}
                          value={stemTextByLang.CN ?? ''}
                          onChange={(e) => setStemTextByLang((prev) => ({ ...prev, CN: e.target.value }))}
                          onBlur={() => setStemTextByLang((prev) => ({ ...prev, CN: resolveImageId(prev.CN ?? '') }))}
                          placeholder={typeMeta.stemPlaceholder}
                          list="image-id-suggestions"
                        />
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setStemImagePickerOpen(true)}>从资源库选择图片</button>
                      </div>
                      <div className="form-hint">图片要求 1:1 比例，小于 1MB</div>
                      {IMAGE_REF_MAP[stemText] ? <div className="form-hint">已关联：{IMAGE_REF_MAP[stemText].name} / {IMAGE_REF_MAP[stemText].size}</div> : null}
                      {cfgErrors.stem && <div className="form-hint" style={{ color: 'var(--rose)' }}>{cfgErrors.stem}</div>}
                    </>
                  ) : previewType === 'T02' ? (
                    <>
                      <label className="form-label">* 题干图片</label>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                        <input
                          className="form-input"
                          style={{ flex: 1 }}
                          value={stemImageIdT02}
                          onChange={(e) => setStemImageIdT02(e.target.value)}
                          onBlur={() => setStemImageIdT02(resolveImageId(stemImageIdT02))}
                          placeholder="如：P100001"
                          list="image-id-suggestions"
                        />
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setStemImagePickerOpen(true)}>从资源库选择图片</button>
                      </div>
                      <div className="form-hint" style={{ marginBottom: 10 }}>图片要求 1:1 比例，小于 1MB</div>
                      {IMAGE_REF_MAP[stemImageIdT02] ? <div className="form-hint" style={{ marginBottom: 10 }}>已关联：{IMAGE_REF_MAP[stemImageIdT02].name} / {IMAGE_REF_MAP[stemImageIdT02].size}</div> : null}
                      <label className="form-label">* 题干中文</label>
                      <input className="form-input" style={{ marginBottom: 10 }} value={stemTextByLang.CN ?? ''} onChange={(e) => setStemTextByLang((prev) => ({ ...prev, CN: e.target.value }))} placeholder="如：米饭" />
                      <label className="form-label">题干拼音</label>
                      <input className="form-input" value={stemPinyin} onChange={(e) => setStemPinyin(e.target.value)} placeholder="如：mǐfàn" style={{ fontStyle: 'italic' }} />
                      {cfgErrors.stem && <div className="form-hint" style={{ color: 'var(--rose)' }}>{cfgErrors.stem}</div>}
                    </>
                  ) : (previewType === 'T00' || previewType === 'T03') ? (
                    <div className="form-hint">本题型无需题干说明，请填写下方音频ID与选项{previewType === 'T00' ? '（图片）' : '（中文+拼音）'}</div>
                  ) : (
                    <>
                      <label className="form-label">* {typeMeta.stemLabel}（多语言）</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {(['CN', 'EN', 'ES', 'FR', 'PT', 'JA', 'KO', 'TH', 'VI', 'ID', 'MS', 'KM'] as const).map((lang) => (
                            <button key={lang} type="button" className={`btn btn-sm ${stemLang === lang ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setStemLang(lang)}>{lang}</button>
                          ))}
                        </div>
                        <button type="button" className="btn btn-sm btn-secondary" style={{ marginLeft: 'auto' }} onClick={() => setStemTextByLang((prev) => ({ ...prev, ...Object.fromEntries((['EN', 'ES', 'FR', 'PT', 'JA', 'KO', 'TH', 'VI', 'ID', 'MS', 'KM'] as const).map((l) => [l, (prev.EN || prev.CN || prev[l]) || ''])) }))}>自动翻译</button>
                      </div>
                      <input
                        className="form-input"
                        value={stemTextByLang[stemLang] ?? ''}
                        onChange={(e) => setStemTextByLang((prev) => ({ ...prev, [stemLang]: e.target.value }))}
                        onBlur={() => {
                          if (previewType !== 'T04') return;
                          const resolved = resolveImageId(stemTextByLang[stemLang] ?? '');
                          if (resolved !== (stemTextByLang[stemLang] ?? '')) setStemTextByLang((prev) => ({ ...prev, [stemLang]: resolved }));
                        }}
                        placeholder={typeMeta.stemPlaceholder}
                        list={previewType === 'T04' ? 'image-id-suggestions' : undefined}
                      />
                      {previewType === 'T04' && (
                        <div className="form-hint">
                          可输入图片ID或关键词（如“米饭”），失焦后自动匹配为图片ID
                          {IMAGE_REF_MAP[stemText] ? ` · 已关联：${IMAGE_REF_MAP[stemText].name} / ${IMAGE_REF_MAP[stemText].size}` : ''}
                        </div>
                      )}
                      {cfgErrors.stem && <div className="form-hint" style={{ color: 'var(--rose)' }}>{cfgErrors.stem}</div>}
                    </>
                  )}
                </div>
                {typeMeta.needAudio && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">* 音频ID</label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input className="form-input" value={cfgAudioId} onChange={(e) => setCfgAudioId(e.target.value)} style={{ fontFamily: 'JetBrains Mono', fontSize: '10.5px', flex: 1 }} />
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAudioPickerOpen(true)}>从资源库选择</button>
                    </div>
                    {cfgErrors.audio && <div className="form-hint" style={{ color: 'var(--rose)' }}>{cfgErrors.audio}</div>}
                  </div>
                )}
                <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">启用状态</label><div style={{ display: 'flex', alignItems: 'center', height: 36, gap: 9 }}><label className="toggle-wrap"><input type="checkbox" checked={cfgEnabled} onChange={() => setCfgEnabled((v) => !v)} /><div className="toggle-track" /><div className="toggle-thumb" /></label><span style={{ fontSize: 12, color: 'var(--ink-light)' }}>{cfgEnabled ? '已启用' : '已停用'}</span></div></div>
              </div>
              <div className="form-hint" style={{ marginTop: -4, marginBottom: 12 }}>{typeMeta.typeHint}</div>
              <div style={{ background: 'var(--ink)', color: '#fff', padding: '9px 14px', borderRadius: 6, marginBottom: 14, fontSize: 13, fontWeight: 500 }}>选项（A-D，点击 ✓ 设为正确）</div>
              {cfgErrors.correct && <div className="form-hint" style={{ color: 'var(--rose)', marginBottom: 10 }}>{cfgErrors.correct}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {options.map((opt, i) => (
                  <div key={i} style={{ border: `1px solid ${opt.correct ? 'var(--teal)' : 'var(--stone-dark)'}`, borderRadius: 8, padding: 12, position: 'relative', background: opt.correct ? 'var(--teal-l)' : 'var(--white)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '3px 8px', borderRadius: 999, background: 'var(--stone)' }}>
                        <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--ink)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono' }}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--ink-light)', fontWeight: 600 }}>选项 {String.fromCharCode(65 + i)}</span>
                      </div>
                      <button type="button" style={{ width: 20, height: 20, borderRadius: '50%', border: 'none', background: opt.correct ? 'var(--teal)' : 'var(--stone-dark)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setCorrect(i)} aria-label={opt.correct ? '正确选项' : '设为正确'}>
                      {opt.correct ? <svg viewBox="0 0 24 24" width="10" height="10"><polyline points="20 6 9 17 4 12" stroke="white" strokeWidth="2.5" fill="none" /></svg> : null}
                    </button>
                    </div>
                    <div className="form-group" style={{ marginBottom: 8 }}>
                      <label className="form-label">{previewType === 'T02' ? '选项释义（多语言，中文除外）' : typeMeta.optionMainLabel}</label>
                      {previewType === 'T02' ? (
                        <>
                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {OPTION_LANGS.map((lang) => (
                                <button key={lang} type="button" className={`btn btn-sm ${optLang === lang ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setOptLang(lang)}>{lang}</button>
                              ))}
                            </div>
                            <button type="button" className="btn btn-sm btn-secondary" style={{ marginLeft: 'auto' }} onClick={() => setOptions((prev) => prev.map((o, j) => (j === i ? { ...o, byLang: { ...(o.byLang ?? {}), ...Object.fromEntries(OPTION_LANGS.filter((l) => l !== 'EN').map((l) => [l, o.cn])) } } : o)))}>自动翻译</button>
                          </div>
                          <input className="form-input" value={optLang === 'EN' ? opt.cn : (opt.byLang?.[optLang] ?? '')} onChange={(e) => (optLang === 'EN' ? updateOption(i, 'cn', e.target.value) : updateOptionByLang(i, optLang, e.target.value))} placeholder={typeMeta.optionMainPlaceholder} />
                        </>
                      ) : (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input className="form-input" style={{ flex: 1 }} value={opt.cn} onChange={(e) => updateOption(i, 'cn', e.target.value)} onBlur={() => { if (previewType === 'T00') updateOption(i, 'cn', resolveImageId(opt.cn)); }} placeholder={typeMeta.optionMainPlaceholder} list={previewType === 'T00' ? 'image-id-suggestions' : undefined} />
                          {previewType === 'T00' && <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setOptionImagePickerField('cn'); setImagePickerForOption(i); }}>从资源库选择</button>}
                        </div>
                      )}
                    </div>
                    {previewType === 'T00' && (
                      <div className="form-hint" style={{ marginTop: -2, marginBottom: 8 }}>
                        可输入图片ID或关键词，自动匹配资源库图片
                        {IMAGE_REF_MAP[opt.cn] ? ` · 已关联：${IMAGE_REF_MAP[opt.cn].name}` : ''}
                      </div>
                    )}
                    {cfgErrors[`opt-${i}`] && <div className="form-hint" style={{ color: 'var(--rose)', marginTop: -4, marginBottom: 8 }}>{cfgErrors[`opt-${i}`]}</div>}
                    {typeMeta.showPinyin && (
                      <div className="form-group" style={{ marginBottom: 8 }}><label className="form-label">拼音</label><input className="form-input" value={opt.pinyin} onChange={(e) => updateOption(i, 'pinyin', e.target.value)} style={{ fontStyle: 'italic' }} placeholder="如：jiǎozi" /></div>
                    )}
                    {typeMeta.showVisual && (
                      <div className="form-group" style={{ marginBottom: 8 }}>
                        <label className="form-label">选项图片ID</label>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
                            className="form-input"
                            value={opt.emoji}
                            onChange={(e) => updateOption(i, 'emoji', e.target.value)}
                            onBlur={() => updateOption(i, 'emoji', resolveImageId(opt.emoji))}
                            style={{ flex: 1 }}
                            placeholder="如：P100002 / 饺子"
                            list="image-id-suggestions"
                          />
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setOptionImagePickerField('emoji'); setImagePickerForOption(i); }}>从资源库选择</button>
                        </div>
                        {IMAGE_REF_MAP[opt.emoji] && <div className="form-hint" style={{ marginTop: 4 }}>已关联：{IMAGE_REF_MAP[opt.emoji].name}</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <datalist id="image-id-suggestions">
                {Object.entries(IMAGE_REF_MAP).map(([id, meta]) => (
                  <option key={id} value={id}>{meta.name}</option>
                ))}
              </datalist>
              <div style={{ background: 'var(--ink)', color: '#fff', padding: '9px 14px', borderRadius: 6, marginTop: 18, marginBottom: 14, fontSize: 13, fontWeight: 500 }}>答案解析（多语言）</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(['CN', 'EN', 'ES', 'FR', 'PT', 'JA', 'KO', 'TH', 'VI', 'ID', 'MS', 'KM'] as const).map((lang) => (
                    <button key={lang} type="button" className={`btn btn-sm ${cfgAnswerAnalysisLang === lang ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setCfgAnswerAnalysisLang(lang)}>{lang}</button>
                  ))}
                </div>
                <button type="button" className="btn btn-sm btn-secondary" style={{ marginLeft: 'auto' }} onClick={() => setCfgAnswerAnalysisByLang((prev) => ({ ...prev, ...Object.fromEntries((['EN', 'ES', 'FR', 'PT', 'JA', 'KO', 'TH', 'VI', 'ID', 'MS', 'KM'] as const).map((l) => [l, prev.CN || prev[l] || ''])) }))}>自动翻译</button>
              </div>
              <textarea className="form-input" rows={3} value={cfgAnswerAnalysisByLang[cfgAnswerAnalysisLang] ?? ''} onChange={(e) => setCfgAnswerAnalysisByLang((prev) => ({ ...prev, [cfgAnswerAnalysisLang]: e.target.value }))} placeholder="答案解析（至少填写一种语言）" />
              {cfgErrors.answer && <div className="form-hint" style={{ color: 'var(--rose)', marginTop: 4 }}>{cfgErrors.answer}</div>}
            </div>
            {/* 右侧：16:9 横屏平板预览 */}
            <div style={{ width: 420, flexShrink: 0, padding: 22, background: 'var(--mist)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 600, letterSpacing: '.4px', textTransform: 'uppercase', color: 'var(--ink-light)', marginBottom: 14, alignSelf: 'flex-start' }}>实时预览（16:9 横屏）</div>
              <div style={{ width: '100%', maxWidth: 400, aspectRatio: '16/9', background: '#1a1a1a', borderRadius: 12, padding: 6, boxShadow: '0 12px 32px rgba(0,0,0,0.14)' }}>
                <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--stone-dark)', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <div style={{ width: 12, height: 12, background: 'var(--stone-dark)', borderRadius: '50%' }} />
                    <div style={{ flex: 1, height: 2, background: 'linear-gradient(to right,#f59e0b 40%,var(--stone-dark) 40%)', borderRadius: 2 }} />
                  </div>
                  <div style={{ flex: 1, padding: 8, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: 'var(--ink-light)', marginBottom: 6 }}>
                      {previewType === 'T00'
                        ? 'Choose the correct picture'
                        : previewType === 'T01'
                          ? '选出正确的汉字'
                          : previewType === 'T02'
                            ? '选择正确的意思'
                            : previewType === 'T03'
                              ? '根据听力选择正确答案'
                              : previewType === 'T04'
                                ? '请重组正确语序'
                                : '选择正确的中文翻译'}
                    </div>
                    {(previewType === 'T00' || previewType === 'T02' || previewType === 'T03') && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8, padding: '4px 8px', background: 'var(--stone)', borderRadius: 6 }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg viewBox="0 0 24 24" fill="white" width="8" height="8"><polygon points="5 3 19 12 5 21 5 3" /></svg></div>
                        <span style={{ fontSize: '9px', color: 'var(--ink-light)', fontFamily: 'JetBrains Mono' }}>{previewType === 'T03' && !stemText ? '听音频，选择正确图片' : stemText}</span>
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, flex: 1, minHeight: 0 }}>
                      {options.map((opt, i) => (
                        <div key={i} style={{ borderRadius: 6, border: opt.correct ? '2px solid var(--teal)' : '1px solid var(--stone-dark)', background: opt.correct ? 'var(--teal-l)' : 'var(--stone)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: previewType === 'T01' ? 12 : 14 }}>
                          <span>{previewType === 'T00' && IMAGE_REF_MAP[opt.cn] ? IMAGE_REF_MAP[opt.cn].name : (opt.emoji || opt.cn)}</span>
                          {previewType === 'T03' ? (opt.pinyin ? <span style={{ fontSize: 7, fontFamily: 'Noto Serif SC', fontStyle: 'italic' }}>{opt.pinyin}</span> : null) : previewType !== 'T00' ? <span style={{ fontSize: 7, fontFamily: 'Noto Serif SC' }}>{opt.cn}</span> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => setConfigModalOpen(false)}>取消</button>
            <button type="button" className="btn btn-primary" onClick={handleConfirmConfig}>确定</button>
          </div>
        </div>
      </div>

      {/* 确认删除题目 */}
      {deleteConfirmIndex !== null && (
        <div className="modal-overlay open" onClick={() => setDeleteConfirmIndex(null)} role="dialog" aria-modal="true" aria-label="确认删除">
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <div className="modal-title">确认删除</div>
              <button type="button" className="modal-close" onClick={() => setDeleteConfirmIndex(null)} aria-label="关闭">✕</button>
            </div>
            <div className="modal-body">
              <p style={{ margin: 0 }}>确认删除该题目？删除后不可恢复。</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setDeleteConfirmIndex(null)}>取消</button>
              <button type="button" className="btn btn-primary" style={{ background: 'var(--rose)' }} onClick={confirmDelete}>确认删除</button>
            </div>
          </div>
        </div>
      )}

      {audioPickerOpen && (
        <div className="modal-overlay open" onClick={() => setAudioPickerOpen(false)} role="dialog" aria-modal="true" aria-label="选择音频">
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <div className="modal-title">从资源库选择音频</div>
              <button type="button" className="modal-close" onClick={() => setAudioPickerOpen(false)} aria-label="关闭">✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
                {AUDIO_REF_LIST.map((a) => (
                  <button key={a.id} type="button" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => { setCfgAudioId(a.id); setAudioPickerOpen(false); }}>
                    <span className="td-mono">{a.id}</span>
                    <span style={{ marginLeft: 8 }}>{a.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {imagePickerForOption !== null && (
        <div className="modal-overlay open" onClick={() => setImagePickerForOption(null)} role="dialog" aria-modal="true" aria-label="选择图片">
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <div className="modal-title">从资源库选择图片</div>
              <button type="button" className="modal-close" onClick={() => setImagePickerForOption(null)} aria-label="关闭">✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
                {Object.entries(IMAGE_REF_MAP).map(([id, meta]) => (
                  <button key={id} type="button" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => { updateOption(imagePickerForOption, optionImagePickerField, id); setImagePickerForOption(null); }}>
                    <span className="td-mono">{id}</span>
                    <span style={{ marginLeft: 8 }}>{meta.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {stemImagePickerOpen && (
        <div className="modal-overlay open" onClick={() => setStemImagePickerOpen(false)} role="dialog" aria-modal="true" aria-label="选择题干图片">
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <div className="modal-title">从资源库选择图片</div>
              <button type="button" className="modal-close" onClick={() => setStemImagePickerOpen(false)} aria-label="关闭">✕</button>
            </div>
            <div className="modal-body">
              <div className="form-hint" style={{ marginBottom: 8 }}>图片要求 1:1 比例，小于 1MB</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
                {Object.entries(IMAGE_REF_MAP).map(([id, meta]) => (
                  <button key={id} type="button" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => { if (previewType === 'T02') setStemImageIdT02(id); else setStemTextByLang((prev) => ({ ...prev, CN: id })); setStemImagePickerOpen(false); }}>
                    <span className="td-mono">{id}</span>
                    <span style={{ marginLeft: 8 }}>{meta.name}</span>
                    {meta.size && <span style={{ marginLeft: 8, color: 'var(--ink-light)', fontSize: 12 }}>{meta.size}</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {toastText && <div className="toast show success">{toastText}</div>}
    </>
  );
}
