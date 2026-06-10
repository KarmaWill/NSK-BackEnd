import { useMemo, useState } from 'react';
import { getLevelStandard } from '../config/hskLevelStandards';
import { defaultCompoundForType, sectionDisplayLabel, typeRequiresCompound, typeSupportsCompound } from '../config/hskQuestionTypeRegistry';
import { getSectionName, levelToNumber } from '../config/hskQuestionTypes';
import type { HskPaperTemplate, HskQuestionTypeCode, HskQuestionTypeDef, HskSectionModule } from '../types/hskExams';
import { recalcTemplateTotals } from '../utils/hskPaperUtils';

type Props = {
  template: HskPaperTemplate;
  typeDefs: HskQuestionTypeDef[];
  onChange: (template: HskPaperTemplate) => void;
  onSave: () => void;
  onPublish: () => void;
  onBack: () => void;
  publishError?: string | null;
};

export function HskTemplateEditor({ template, typeDefs, onChange, onSave, onPublish, onBack, publishError }: Props) {
  const [activeModule, setActiveModule] = useState<HskSectionModule>('listening');

  const module = template.modules.find((m) => m.id === activeModule)!;
  const levelStandard = useMemo(() => {
    const n = levelToNumber(String(template.level));
    return n ? getLevelStandard(n) : null;
  }, [template.level]);

  const sectionTypes = useMemo(
    () => typeDefs.filter((t) => t.section === activeModule),
    [typeDefs, activeModule],
  );

  const updateTemplate = (patch: Partial<HskPaperTemplate>) => {
    onChange(recalcTemplateTotals({ ...template, ...patch }, typeDefs));
  };

  const updateModuleSection = (sectionId: string, patch: Partial<(typeof module.sections)[number]>) => {
    const modules = template.modules.map((m) => {
      if (m.id !== activeModule) return m;
      return {
        ...m,
        sections: m.sections.map((sec) => (sec.id === sectionId ? { ...sec, ...patch } : sec)),
      };
    });
    onChange(recalcTemplateTotals({ ...template, modules }, typeDefs));
  };

  const addSection = () => {
    const defaultType = sectionTypes[0]?.hskTypeCode ?? 'L01';
    const modules = template.modules.map((m) => {
      if (m.id !== activeModule) return m;
      const idx = m.sections.length + 1;
      return {
        ...m,
        sections: [
          ...m.sections,
          {
            id: `${activeModule}_s${Date.now()}`,
            name: `第 ${idx} 部分`,
            questionType: defaultType,
            isCompound: false,
            groups: [{ questionCount: 5, hasExample: false, exampleCount: 0 }],
            totalCount: 5,
            scoringCount: 5,
          },
        ],
      };
    });
    onChange(recalcTemplateTotals({ ...template, modules }, typeDefs));
  };

  const removeSection = (sectionId: string) => {
    const modules = template.modules.map((m) => {
      if (m.id !== activeModule) return m;
      return { ...m, sections: m.sections.filter((s) => s.id !== sectionId) };
    });
    onChange(recalcTemplateTotals({ ...template, modules }, typeDefs));
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <button type="button" className="back-btn" onClick={onBack}>← 返回列表</button>
          <div className="page-title" style={{ marginTop: 8 }}>{template.name}</div>
          <div className="page-subtitle">
            {template.level} · {template.totalQuestions} 题 · {template.totalScore} 分 · {template.totalDuration} 分钟
            {levelStandard && (
              <span style={{ marginLeft: 8 }}>
                · HSK{levelStandard.level} 标准 {levelStandard.totalScore} 分 / 及格 {levelStandard.passScore}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onSave}>保存草稿</button>
          <button type="button" className="btn btn-primary btn-sm" onClick={onPublish}>发布模板</button>
        </div>
      </div>

      {publishError && (
        <div className="form-hint" style={{ color: 'var(--rose)', marginBottom: 12 }}>{publishError}</div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div className="form-row">
            <div className="form-group">
              <label>模板名称</label>
              <input
                value={template.name}
                onChange={(e) => updateTemplate({ name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>级别</label>
              <select value={template.level} onChange={(e) => updateTemplate({ level: e.target.value })}>
                {['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6', 'custom'].map((lv) => (
                  <option key={lv} value={lv}>{lv}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>及格分</label>
              <input
                type="number"
                value={template.passScore}
                onChange={(e) => updateTemplate({ passScore: Number(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="hsk-stats-row" style={{ marginTop: 8 }}>
            {template.modules.map((m) => (
              <div key={m.id} className="hsk-stat-card">
                <div className="hsk-stat-label">{m.name}</div>
                <div className="hsk-stat-value">{m.totalQuestions}</div>
                <div className="hsk-stat-unit">题</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="type-tabs" style={{ marginBottom: 12 }}>
        {template.modules.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`type-tab ${activeModule === m.id ? 'active' : ''}`}
            onClick={() => setActiveModule(m.id)}
          >
            {m.name} ({m.totalQuestions})
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="card-title">{getSectionName(activeModule)} · 题型结构</div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={addSection}>+ 添加部分</button>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {module.sections.length === 0 ? (
            <div className="form-hint">暂无部分，点击「添加部分」开始配置</div>
          ) : (
            module.sections.map((sec) => (
              <div key={sec.id} className="config-section" style={{ padding: 12, border: '1px solid var(--stone-dark)', borderRadius: 8 }}>
                <div className="form-row">
                  <div className="form-group">
                    <label>部分名称</label>
                    <input
                      value={sec.name}
                      onChange={(e) => updateModuleSection(sec.id, { name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>题型</label>
                    <select
                      value={sec.questionType}
                      onChange={(e) => {
                        const questionType = e.target.value as HskQuestionTypeCode;
                        updateModuleSection(sec.id, {
                          questionType,
                          isCompound: defaultCompoundForType(questionType),
                        });
                      }}
                    >
                      {sectionTypes.map((t) => (
                        <option key={t.hskTypeCode} value={t.hskTypeCode}>{t.hskTypeCode} · {t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>题量</label>
                    <input
                      type="number"
                      min={1}
                      value={sec.groups[0]?.questionCount ?? 0}
                      onChange={(e) => {
                        const count = Math.max(1, Number(e.target.value) || 1);
                        updateModuleSection(sec.id, {
                          groups: [{ questionCount: count, hasExample: false, exampleCount: 0 }],
                        });
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label>学员端展示</label>
                    <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.5 }}>
                      {sectionDisplayLabel(sec.questionType, sec.isCompound)}
                    </div>
                    {typeRequiresCompound(sec.questionType) ? (
                      <div className="form-hint" style={{ fontSize: 12, marginTop: 6 }}>
                        此题型固定为一屏多小题，无需单独设置
                      </div>
                    ) : typeSupportsCompound(sec.questionType) ? (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 13 }}>
                        <input
                          type="checkbox"
                          checked={sec.isCompound}
                          onChange={(e) => updateModuleSection(sec.id, { isCompound: e.target.checked })}
                        />
                        合并为一屏多小题
                      </label>
                    ) : (
                      <div className="form-hint" style={{ fontSize: 12, marginTop: 6 }}>
                        每题独立一屏
                      </div>
                    )}
                  </div>
                  <div className="form-group" style={{ alignSelf: 'flex-end' }}>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeSection(sec.id)}>删除</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
