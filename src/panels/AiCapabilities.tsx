import { useMemo, useState } from 'react';
import { type AiCapability, type ScoreDimension, loadAiCapabilities, saveAiCapabilities } from '../stores/aiCapabilities';

type LangKey = 'EN' | 'CN' | 'ES' | 'FR' | 'PT' | 'JA' | 'KO' | 'VI' | 'TH' | 'ID' | 'MS' | 'KM';

const LANGS: { key: LangKey; label: string }[] = [
  { key: 'CN', label: '中文' },
  { key: 'EN', label: '英语' },
  { key: 'ES', label: '西语' },
  { key: 'FR', label: '法语' },
  { key: 'PT', label: '葡语' },
  { key: 'JA', label: '日语' },
  { key: 'KO', label: '韩语' },
  { key: 'VI', label: '越南语' },
  { key: 'TH', label: '泰语' },
  { key: 'ID', label: '印尼语' },
  { key: 'MS', label: '马来语' },
  { key: 'KM', label: '高棉语' },
];

function formatNow() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function emptyLang(): Record<LangKey, string> {
  return { CN: '', EN: '', ES: '', FR: '', PT: '', JA: '', KO: '', VI: '', TH: '', ID: '', MS: '', KM: '' };
}

function emptyScoreDesc(): Record<ScoreDimension, Record<LangKey, string>> {
  return {
    pronunciation: emptyLang(),
    fluency: emptyLang(),
    accuracy: emptyLang(),
    completeness: emptyLang(),
  };
}

export function AiCapabilities() {
  const [rows, setRows] = useState<AiCapability[]>(() => loadAiCapabilities());
  const [keyword, setKeyword] = useState('');
  const [editing, setEditing] = useState<AiCapability | null>(null);
  const [themeLangTab, setThemeLangTab] = useState<LangKey>('CN');
  const [bgLangTab, setBgLangTab] = useState<LangKey>('CN');
  const [scoreDescLangTab, setScoreDescLangTab] = useState<LangKey>('CN');

  const list = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return rows;
    return rows.filter((r) =>
      [r.aiId, r.themeNameByLang.CN, r.themeNameByLang.EN, r.themeCategory, r.dialogBackground, r.unitId, r.status]
        .join(' ')
        .toLowerCase()
        .includes(kw),
    );
  }, [rows, keyword]);

  const openNew = () => {
    setEditing({
      aiId: `AI-${Date.now()}`,
      levelId: '1',
      unitId: 'N10100',
      themeNameByLang: emptyLang(),
      themeCategory: '',
      dialogBackground: '',
      dialogBackgroundByLang: emptyLang(),
      goals: ['目标1', '目标2', '目标3'],
      prompt: '',
      turnLimit: 8,
      roleA: '学生',
      roleB: 'AI导师',
      userPickRole: 'A',
      firstSpeaker: 'B',
      aiScoreDimension: 'pronunciation',
      aiScoreDescByDimension: emptyScoreDesc(),
      status: '启用',
      updatedAt: formatNow(),
    });
    setThemeLangTab('CN');
    setBgLangTab('CN');
    setScoreDescLangTab('CN');
  };

  const saveOne = () => {
    if (!editing || !editing.aiId.trim() || !(editing.themeNameByLang.CN || editing.themeNameByLang.EN).trim()) return;
    const next = rows.some((r) => r.aiId === editing.aiId)
      ? rows.map((r) => (r.aiId === editing.aiId ? { ...editing, updatedAt: formatNow() } : r))
      : [{ ...editing, updatedAt: formatNow() }, ...rows];
    setRows(next);
    saveAiCapabilities(next);
    setEditing(null);
  };

  const removeOne = (aiId: string) => {
    const next = rows.filter((r) => r.aiId !== aiId);
    setRows(next);
    saveAiCapabilities(next);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">课程AI配置</div>
          <div className="page-subtitle">先在 AI角色配置里定义角色，再在这里做能力二次定义并收敛可调用范围</div>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setRows(loadAiCapabilities())}>↻ 刷新</button>
          <button type="button" className="btn btn-primary" onClick={openNew}>+ 新增课程AI配置</button>
        </div>
      </div>

      <div className="filter-bar">
        <input className="filter-select" style={{ minWidth: 340 }} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索 AI资源ID / 主题 / Level/Unit / 对话背景" />
      </div>

      <div className="table-wrap">
        <div className="table-top">
          <span className="table-count">共 {list.length} 条课程AI配置</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>AI资源ID</th>
              <th>主题（中文）</th>
              <th>Level/Unit</th>
              <th>主题分类</th>
              <th>评分维度</th>
              <th>状态</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.aiId}>
                <td className="td-mono">{r.aiId}</td>
                <td>{r.themeNameByLang.CN || r.themeNameByLang.EN || '—'}</td>
                <td className="td-mono">{`Level ${r.levelId} / ${r.unitId}`}</td>
                <td>{r.themeCategory || '—'}</td>
                <td>{scoreDimensionLabel(r.aiScoreDimension)}</td>
                <td>{r.status === '启用' ? <span className="badge badge-teal">启用</span> : <span className="badge badge-muted">停用</span>}</td>
                <td className="td-mono" style={{ fontSize: 12 }}>{r.updatedAt}</td>
                <td>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(r)}>编辑</button>
                  <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)' }} onClick={() => removeOne(r.aiId)}>删除</button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: 'var(--ink-light)' }}>暂无数据，请新增课程AI配置。</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={`modal-overlay ${editing ? 'open' : ''}`} onClick={() => setEditing(null)} role="dialog" aria-modal="true" aria-label="课程AI配置编辑">
        <div className="modal modal-wide" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 1040 }}>
          <div className="modal-header">
            <div className="modal-title">课程AI配置</div>
            <button type="button" className="modal-close" onClick={() => setEditing(null)} aria-label="关闭">✕</button>
          </div>
          {editing && (
            <>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">AI资源ID</label>
                    <input className="form-input font-mono" value={editing.aiId} onChange={(e) => setEditing((p) => (p ? { ...p, aiId: e.target.value } : p))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">NSK课程编号（Level / Unit）</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10 }}>
                      <select className="form-input form-select" value={editing.levelId} onChange={(e) => setEditing((p) => (p ? { ...p, levelId: e.target.value } : p))}>
                        <option value="1">Level 1</option>
                        <option value="2">Level 2</option>
                        <option value="3">Level 3</option>
                      </select>
                      <select className="form-input form-select" value={editing.unitId} onChange={(e) => setEditing((p) => (p ? { ...p, unitId: e.target.value } : p))}>
                        <option value="N10100">N10100 · Unit 1 日常主食</option>
                        <option value="N10200">N10200 · Unit 2 日常饮品</option>
                        <option value="N10300">N10300 · Unit 3 这是什么</option>
                        <option value="N10400">N10400 · Unit 4 自我介绍</option>
                        <option value="N10500">N10500 · Unit 5 我的宠物</option>
                        <option value="N10600">N10600 · Unit 6 家庭成员</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">主题多语言</label>
                  <LangTabs tab={themeLangTab} onSwitch={setThemeLangTab} />
                  <input className="form-input" value={editing.themeNameByLang[themeLangTab] ?? ''} onChange={(e) => setEditing((p) => (p ? { ...p, themeNameByLang: { ...p.themeNameByLang, [themeLangTab]: e.target.value } } : p))} placeholder="输入该语言主题名称" />
                </div>
                <div className="form-group">
                  <label className="form-label">主题分类</label>
                  <input className="form-input" value={editing.themeCategory} onChange={(e) => setEditing((p) => (p ? { ...p, themeCategory: e.target.value } : p))} placeholder="例如：生活场景 / 校园 / 商务 / HSK" />
                </div>
                <div className="form-group">
                  <label className="form-label">对话背景</label>
                  <textarea className="form-input" rows={2} value={editing.dialogBackground} onChange={(e) => setEditing((p) => (p ? { ...p, dialogBackground: e.target.value } : p))} />
                </div>
                <div className="form-group">
                  <label className="form-label">对话背景多语言</label>
                  <LangTabs tab={bgLangTab} onSwitch={setBgLangTab} />
                  <textarea className="form-input" rows={2} value={editing.dialogBackgroundByLang[bgLangTab] ?? ''} onChange={(e) => setEditing((p) => (p ? { ...p, dialogBackgroundByLang: { ...p.dialogBackgroundByLang, [bgLangTab]: e.target.value } } : p))} />
                </div>
                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>对话目标</label>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing((p) => (p ? { ...p, goals: [...p.goals, `目标${p.goals.length + 1}`] } : p))}>+ 新增目标</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                    {editing.goals.map((g, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span className="td-mono" style={{ width: 52 }}>{`目标${idx + 1}`}</span>
                        <input className="form-input" value={g} onChange={(e) => setEditing((p) => { if (!p) return p; const next = [...p.goals]; next[idx] = e.target.value; return { ...p, goals: next }; })} />
                        <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)' }} onClick={() => setEditing((p) => (p && p.goals.length > 1 ? { ...p, goals: p.goals.filter((_, i) => i !== idx) } : p))}>删除</button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">对话Prompt</label>
                  <textarea className="form-input" rows={3} value={editing.prompt} onChange={(e) => setEditing((p) => (p ? { ...p, prompt: e.target.value } : p))} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">对话轮数限制</label>
                    <input type="number" min={1} max={30} className="form-input" value={editing.turnLimit} onChange={(e) => setEditing((p) => (p ? { ...p, turnLimit: Number(e.target.value || 1) } : p))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">状态</label>
                    <select className="form-input form-select" value={editing.status} onChange={(e) => setEditing((p) => (p ? { ...p, status: e.target.value as AiCapability['status'] } : p))}>
                      <option value="启用">启用</option>
                      <option value="停用">停用</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">A 角色（固定角色脚本）</label>
                    <input className="form-input" value={editing.roleA} onChange={(e) => setEditing((p) => (p ? { ...p, roleA: e.target.value } : p))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">B 角色（固定角色脚本）</label>
                    <input className="form-input" value={editing.roleB} onChange={(e) => setEditing((p) => (p ? { ...p, roleB: e.target.value } : p))} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">用户选择角色</label>
                    <select className="form-input form-select" value={editing.userPickRole} onChange={(e) => setEditing((p) => { if (!p) return p; const pick = e.target.value as 'A' | 'B'; return { ...p, userPickRole: pick, firstSpeaker: pick === 'A' ? 'B' : 'A' }; })}>
                      <option value="A">{`用户选择A角色（${editing.roleA || 'A'}）`}</option>
                      <option value="B">{`用户选择B角色（${editing.roleB || 'B'}）`}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">起始说话角色</label>
                    <input className="form-input" value={editing.firstSpeaker === 'A' ? `${editing.roleA || 'A角色'}先说话` : `${editing.roleB || 'B角色'}先说话`} readOnly />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">AI评分维度</label>
                  <select className="form-input form-select" value={editing.aiScoreDimension} onChange={(e) => setEditing((p) => (p ? { ...p, aiScoreDimension: e.target.value as ScoreDimension } : p))}>
                    <option value="pronunciation">发音准确度</option>
                    <option value="fluency">流利度</option>
                    <option value="accuracy">表达准确度</option>
                    <option value="completeness">目标完成度</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">AI评分描述（多语言）</label>
                  <LangTabs tab={scoreDescLangTab} onSwitch={setScoreDescLangTab} />
                  <textarea
                    className="form-input"
                    rows={2}
                    value={editing.aiScoreDescByDimension[editing.aiScoreDimension]?.[scoreDescLangTab] ?? ''}
                    onChange={(e) =>
                      setEditing((p) => {
                        if (!p) return p;
                        const dim = p.aiScoreDimension;
                        return {
                          ...p,
                          aiScoreDescByDimension: {
                            ...p.aiScoreDescByDimension,
                            [dim]: {
                              ...p.aiScoreDescByDimension[dim],
                              [scoreDescLangTab]: e.target.value,
                            },
                          },
                        };
                      })
                    }
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>取消</button>
                <button type="button" className="btn btn-primary" onClick={saveOne}>保存</button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function scoreDimensionLabel(dim: ScoreDimension) {
  if (dim === 'fluency') return '流利度';
  if (dim === 'accuracy') return '表达准确度';
  if (dim === 'completeness') return '目标完成度';
  return '发音准确度';
}

function LangTabs({ tab, onSwitch }: { tab: LangKey; onSwitch: (key: LangKey) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
      {LANGS.map((l) => (
        <button
          key={l.key}
          type="button"
          className={`btn btn-sm ${tab === l.key ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => onSwitch(l.key)}
          style={l.key === 'CN' ? (tab === l.key ? { background: '#8a1c2b', borderColor: '#8a1c2b', color: '#fff' } : { background: '#fff5f5', borderColor: '#8a1c2b', color: '#8a1c2b' }) : undefined}
        >
          {l.key} {l.label}
        </button>
      ))}
    </div>
  );
}
