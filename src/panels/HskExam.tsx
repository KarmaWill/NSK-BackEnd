import { useState } from 'react';
import { PageTabPanel, PageTabs } from '../components/PageTabs';
import { HskQuestionConfig } from './HskQuestionConfig';

type QuestionType = {
  id: string;
  name: string;
  desc: string;
  count: number;
  status: 'done' | 'warn' | 'empty';
};

type SectionType = 'listening' | 'reading' | 'writing';

type LevelData = {
  name: string;
  title: string;
  duration: number;
  totalQ: number;
  passScore: number;
  configured: number;
  total: number;
};

const LEVELS: Record<number, LevelData> = {
  1: { name: 'HSK 1', title: 'HSK 1 级模考配置', duration: 40, totalQ: 40, passScore: 120, configured: 18, total: 20 },
  2: { name: 'HSK 2', title: 'HSK 2 级模考配置', duration: 55, totalQ: 60, passScore: 120, configured: 22, total: 28 },
  3: { name: 'HSK 3', title: 'HSK 3 级模考配置', duration: 85, totalQ: 80, passScore: 180, configured: 30, total: 36 },
  4: { name: 'HSK 4', title: 'HSK 4 级模考配置', duration: 100, totalQ: 100, passScore: 180, configured: 38, total: 45 },
  5: { name: 'HSK 5', title: 'HSK 5 级模考配置', duration: 125, totalQ: 100, passScore: 180, configured: 29, total: 45 },
  6: { name: 'HSK 6', title: 'HSK 6 级模考配置', duration: 140, totalQ: 101, passScore: 180, configured: 15, total: 50 },
};

const SECTIONS: Record<SectionType, { name: string; dotClass: string; fillClass: string; idClass: string }> = {
  listening: { name: '听力', dotClass: 'dot-listening', fillClass: 'fill-listening', idClass: 'id-listening' },
  reading: { name: '阅读', dotClass: 'dot-reading', fillClass: 'fill-reading', idClass: 'id-reading' },
  writing: { name: '书写', dotClass: 'dot-writing', fillClass: 'fill-writing', idClass: 'id-writing' },
};

const QTYPES: Record<number, Record<SectionType, QuestionType[]>> = {
  1: {
    listening: [
      { id: 'L01', name: '图片选择', desc: '听音频选对应图片', count: 5, status: 'done' },
      { id: 'L02', name: '判断对错', desc: '听句判断真假', count: 10, status: 'done' },
      { id: 'L03', name: '短句选答', desc: '听短句选择答案', count: 5, status: 'warn' },
    ],
    reading: [
      { id: 'R01', name: '图文匹配', desc: '图片与句子对应', count: 5, status: 'done' },
      { id: 'R02', name: '阅读判断', desc: '阅读句子判对错', count: 10, status: 'done' },
      { id: 'R03', name: '问答匹配', desc: '问题与回答配对', count: 5, status: 'empty' },
    ],
    writing: [
      { id: 'W01', name: '汉字辨写', desc: '识别或填写汉字', count: 10, status: 'done' },
      { id: 'W02', name: '连词成句', desc: '拖拽词语排列成句', count: 5, status: 'empty' },
    ],
  },
  4: {
    listening: [
      { id: 'L04', name: '对话选答', desc: '听对话后选答案', count: 8, status: 'done' },
      { id: 'L05', name: '对话多题', desc: '长对话对应多道题', count: 12, status: 'done' },
      { id: 'L06', name: '短文多题', desc: '短文听力多道题', count: 5, status: 'done' },
    ],
    reading: [
      { id: 'R01', name: '图文匹配', desc: '图片与句子对应', count: 10, status: 'done' },
      { id: 'R03', name: '问答匹配', desc: '问题与回答配对', count: 10, status: 'done' },
      { id: 'R04', name: '词语填空', desc: '从词库选词填入空白', count: 10, status: 'done' },
      { id: 'R05', name: '句子排序', desc: '拖拽排列句子顺序', count: 5, status: 'warn' },
      { id: 'R06', name: '段落填空', desc: '文章中填入句段', count: 5, status: 'empty' },
    ],
    writing: [
      { id: 'W03', name: '看图造句', desc: '看图片写句子', count: 5, status: 'done' },
      { id: 'W04', name: '短文写作', desc: '80–150字，AI 评分', count: 2, status: 'warn' },
    ],
  },
  6: {
    listening: [
      { id: 'L06', name: '短文多题', desc: '短文听力多道题', count: 10, status: 'done' },
      { id: 'L07', name: '访谈长篇', desc: '访谈/报道型长篇', count: 5, status: 'empty' },
    ],
    reading: [
      { id: 'R04', name: '词语填空', desc: '从词库选词填入空白', count: 20, status: 'done' },
      { id: 'R06', name: '段落填空', desc: '文章中填入句段', count: 10, status: 'done' },
      { id: 'R07', name: '阅读理解', desc: '读文章后选择答案', count: 20, status: 'done' },
    ],
    writing: [
      { id: 'W05', name: '命题作文', desc: '150–400字，AI 评分', count: 1, status: 'warn' },
      { id: 'W06', name: '缩写改写', desc: '缩写长文，AI 评分', count: 1, status: 'empty' },
    ],
  },
};

function getSectionData(level: number, sec: SectionType): QuestionType[] {
  const base = QTYPES[level] || QTYPES[4];
  return base[sec] || QTYPES[4][sec] || [];
}

const EXAM_TABS = [
  { id: 'templates', label: '试卷模板' },
  { id: 'rules', label: '考试规范' },
] as const;

export function HskExam() {
  const [activeTab, setActiveTab] = useState<string>('rules');
  const [curLevel, setCurLevel] = useState(4);
  const [collapsed, setCollapsed] = useState<Record<SectionType, boolean>>({
    listening: false,
    reading: false,
    writing: false,
  });
  const [toast, setToast] = useState<string | null>(null);
  const [configMode, setConfigMode] = useState<{ section: SectionType; typeId: string } | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const toggleSection = (sec: SectionType) => {
    setCollapsed((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const levelData = LEVELS[curLevel];
  const pct = Math.round((levelData.configured / levelData.total) * 100);

  const statsData = [
    { label: '考试时长', value: levelData.duration, unit: '分钟', pct: Math.round((levelData.duration / 160) * 100), highlight: false },
    { label: '题目总数', value: levelData.totalQ, unit: '题', pct: Math.round((levelData.totalQ / 101) * 100), highlight: false },
    { label: '及格分数线', value: levelData.passScore, unit: '分', pct: Math.round((levelData.passScore / 300) * 100), highlight: false },
    { label: '优秀分数线', value: Math.round(levelData.passScore * 1.4), unit: '分', pct: Math.round((levelData.passScore * 1.4) / 300) * 100, highlight: false },
    { label: '题型配置进度', value: pct, unit: '%', pct: pct, highlight: true },
  ];

  // 如果处于配置模式，显示配置页面
  if (configMode) {
    return (
      <HskQuestionConfig
        section={configMode.section}
        questionTypeId={configMode.typeId}
        hskLevel={curLevel}
        onBack={() => setConfigMode(null)}
      />
    );
  }

  const rulesPanel = (
    <>
      <div className="hsk-level-header">
        <div className="hsk-lh-top">
          <div className="hsk-lh-title">
            <div className="hsk-level-badge">HSK {curLevel}</div>
            <div>
              <div className="hsk-lh-main-title">{levelData.title}</div>
              <div className="hsk-lh-subtitle">切换等级查看对应题型配置</div>
            </div>
          </div>
          <div className="hsk-lh-lvl-tabs">
            {[1, 2, 3, 4, 5, 6].map((l) => (
              <div
                key={l}
                className={`hsk-lvl-tab ${l === curLevel ? 'active' : ''}`}
                onClick={() => setCurLevel(l)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setCurLevel(l)}
              >
                {LEVELS[l].name}
              </div>
            ))}
          </div>
        </div>

        <div className="hsk-stats-row">
          {statsData.map((s, idx) => (
            <div key={idx} className="hsk-stat-card">
              <div className="hsk-stat-label">{s.label}</div>
              <div>
                <span className="hsk-stat-value" style={s.highlight ? { color: 'var(--primary)' } : {}}>
                  {s.value}
                </span>
                <span className="hsk-stat-unit">{s.unit}</span>
              </div>
              <div className="hsk-stat-progress">
                <div className="hsk-stat-fill" style={{ width: `${s.pct}%`, background: s.highlight ? 'var(--primary)' : 'var(--text3)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {(Object.entries(SECTIONS) as [SectionType, typeof SECTIONS[SectionType]][]).map(([sec, info]) => {
        const types = getSectionData(curLevel, sec);
        const done = types.filter((t) => t.status === 'done').length;
        const total = types.length;
        const sectionPct = total ? Math.round((done / total) * 100) : 0;
        const isCollapsed = collapsed[sec];
        const hasWarn = types.some((t) => t.status === 'warn');
        const isComplete = done === total && total > 0;
        const totalQuestions = types.reduce((s, t) => s + t.count, 0);

        return (
          <div key={sec} className="hsk-section-block">
            <div className={`hsk-section-header ${isCollapsed ? 'collapsed' : ''}`} onClick={() => toggleSection(sec)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && toggleSection(sec)}>
              <div className="hsk-sh-left">
                <div className={`hsk-section-dot ${info.dotClass}`} />
                <div>
                  <span className="hsk-section-name">{info.name}</span>
                  <span className="hsk-section-meta">
                    {total} 种题型 · {totalQuestions} 题
                  </span>
                </div>
              </div>
              <div className="hsk-sh-right">
                <div className="hsk-section-progress-wrap">
                  <div className="hsk-mini-progress">
                    <div className={`hsk-mini-fill ${info.fillClass}`} style={{ width: `${sectionPct}%` }} />
                  </div>
                  <span>
                    {done}/{total} 已配置
                  </span>
                </div>
                {hasWarn && (
                  <span className="hsk-status-badge warn">
                    ⚠️ 待完善
                  </span>
                )}
                {isComplete && (
                  <span className="hsk-status-badge success">
                    ✓ 已完成
                  </span>
                )}
                <span className="hsk-collapse-icon">{isCollapsed ? '▶' : '▼'}</span>
              </div>
            </div>

            {!isCollapsed && (
              <div className="hsk-section-body">
                <div className="hsk-qtype-grid">
                  {types.map((t) => (
                    <div
                      key={t.id}
                      className={`hsk-qtype-card ${t.status === 'empty' ? 'unconfigured' : 'configured'}`}
                      onClick={() => setConfigMode({ section: sec, typeId: t.id })}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setConfigMode({ section: sec, typeId: t.id })}
                    >
                      <div className="hsk-qtc-top">
                        <span className={`hsk-qtc-id ${info.idClass}`}>{t.id}</span>
                        <span className={`hsk-qtc-status ${t.status === 'done' ? 'st-done' : t.status === 'warn' ? 'st-warn' : 'st-empty'}`}>
                          {t.status === 'done' ? '已配置' : t.status === 'warn' ? '待完善' : '未配置'}
                        </span>
                      </div>
                      <div className="hsk-qtc-name">{t.name}</div>
                      <div className="hsk-qtc-desc">{t.desc}</div>
                      <div className="hsk-qtc-footer">
                        <span className="hsk-qtc-count">
                          {t.status === 'empty' ? <span style={{ color: 'var(--text3)' }}>暂无题目</span> : <><strong>{t.count}</strong> 题</>}
                        </span>
                        <span className="hsk-qtc-arrow">→</span>
                      </div>
                    </div>
                  ))}
                  <button type="button" className="hsk-add-type-btn" onClick={() => showToast(`打开 ${info.name}节题型选择器…`)}>
                    <span style={{ fontSize: '16px' }}>+</span>
                    添加题型
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {toast && <div className="hsk-toast show">{toast}</div>}
    </>
  );

  return (
    <>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title">考试管理</div>
          <div className="page-subtitle">试卷模板 · 考试规范与题型预览</div>
        </div>
        {activeTab === 'rules' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn" onClick={() => showToast('已保存为草稿')}>
              💾 保存草稿
            </button>
            <button type="button" className="btn btn-primary" onClick={() => showToast('配置已发布上线 ✓')}>
              📤 发布
            </button>
          </div>
        )}
      </div>

      <PageTabs tabs={[...EXAM_TABS]} activeTab={activeTab} onTabChange={setActiveTab}>
        <PageTabPanel id="templates" activeTab={activeTab}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">试卷模板列表</div>
            </div>
            <div className="card-body">
              <p className="text-muted" style={{ margin: 0 }}>
                定义 HSK1–6 / 自定义模板：各题型数量、总分、时长与适用场景。保存后可作为「试卷管理」组卷基础。
              </p>
              <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => showToast('新建模板')}>
                + 新建试卷模板
              </button>
            </div>
          </div>
        </PageTabPanel>
        <PageTabPanel id="rules" activeTab={activeTab}>
          {rulesPanel}
        </PageTabPanel>
      </PageTabs>
    </>
  );
}
