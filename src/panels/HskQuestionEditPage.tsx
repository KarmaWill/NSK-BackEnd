import { useEffect, useMemo, useState } from 'react';
import { HskQuestionEditPreview } from '../components/HskQuestionEditPreview';
import { getAnswerModeDef, guessAnswerMode } from '../config/hskAnswerModes';
import { defaultCompoundForType, getRegistryEntry } from '../config/hskQuestionTypeRegistry';
import type { HskLevelCode, HskQuestionRow, HskQuestionTypeCode, HskQuestionTypeDef } from '../types/hskExams';

type Props = {
  question: HskQuestionRow;
  types: HskQuestionTypeDef[];
  tags: { id: string; label: string }[];
  onBack: () => void;
  onSave: (question: HskQuestionRow) => void;
};

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="hsk-question-edit-section-head">
      <span aria-hidden>{icon}</span>
      <h3>{title}</h3>
    </div>
  );
}

export function HskQuestionEditPage({ question, types, tags, onBack, onSave }: Props) {
  const [draft, setDraft] = useState<HskQuestionRow>(() => structuredClone(question));
  const [fullscreenPreview, setFullscreenPreview] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setDraft(structuredClone(question));
  }, [question]);

  const typeDef = types.find((t) => t.id === draft.type_id);
  const registry = getRegistryEntry(draft.type_id, defaultCompoundForType(draft.type_id));
  const modeLabel = getAnswerModeDef(
    guessAnswerMode(draft.type_id, typeDef?.answerMode as Parameters<typeof guessAnswerMode>[1]),
  ).label;

  const visibleTypes = useMemo(
    () => types.filter((t) => !t.id.startsWith('T')),
    [types],
  );

  const options =
    draft.payload?.runtimeOptions ??
    draft.options.map((o) => ({
      key: o.label,
      text: o.text,
      pinyin: o.pinyin,
      image: o.image,
    }));

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const update = <K extends keyof HskQuestionRow>(key: K, value: HskQuestionRow[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value, updatedAt: new Date().toISOString() }));
  };

  const updateOptionText = (index: number, text: string) => {
    const next = [...options];
    next[index] = { ...next[index], text };
    const rowOptions = next.map((o) => ({
      label: o.key,
      text: o.text ?? '',
      pinyin: o.pinyin,
      image: o.image,
    }));
    setDraft((prev) => ({
      ...prev,
      options: rowOptions,
      payload: { ...prev.payload, runtimeOptions: next },
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleSave = (status: 'draft' | 'published') => {
    if (!draft.stem.trim()) {
      showToast('请填写题干');
      return;
    }
    onSave({ ...draft, status });
  };

  if (fullscreenPreview) {
    return (
      <div className="hsk-question-edit-page hsk-question-edit-page-fullscreen">
        <header className="hsk-question-edit-topbar">
          <button type="button" className="hsk-question-edit-back" onClick={() => setFullscreenPreview(false)}>
            ← 返回编辑
          </button>
          <span className="hsk-question-edit-topbar-title">全屏预览 · {draft.question_uid}</span>
        </header>
        <div className="hsk-question-edit-fullscreen-preview">
          <HskQuestionEditPreview question={draft} typeDef={typeDef} />
        </div>
      </div>
    );
  }

  return (
    <div className="hsk-question-edit-page">
      <header className="hsk-question-edit-topbar">
        <div className="hsk-question-edit-topbar-left">
          <button type="button" className="hsk-question-edit-back" onClick={onBack}>
            返回
          </button>
          <h1 className="hsk-question-edit-title">编辑题目 {draft.question_uid}</h1>
          {typeDef && (
            <span className="hsk-question-edit-type-badge">
              {typeDef.name}
              <span className="hsk-question-edit-type-code">({draft.type_id})</span>
            </span>
          )}
        </div>
        <div className="hsk-question-edit-topbar-right">
          <span className="hsk-question-edit-preview-mode">preview 模式</span>
          <button
            type="button"
            className={`hsk-question-edit-fullscreen-btn${fullscreenPreview ? ' active' : ''}`}
            onClick={() => setFullscreenPreview(true)}
          >
            全屏预览
          </button>
        </div>
      </header>

      <div className="hsk-question-edit-body">
        <div className="hsk-question-edit-form-col">
          <div className="hsk-question-edit-form-inner">
            <SectionHeader icon="📋" title="元数据" />

            <div className="hsk-question-edit-meta-grid">
              <div className="form-group">
                <label>题目ID</label>
                <input type="text" value={draft.question_uid} readOnly className="input-readonly" />
              </div>
              <div className="form-group">
                <label>题型</label>
                <select
                  value={draft.type_id}
                  onChange={(e) => update('type_id', e.target.value as HskQuestionTypeCode)}
                >
                  {visibleTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>等级</label>
                <select
                  value={draft.level}
                  onChange={(e) => update('level', e.target.value as HskLevelCode)}
                >
                  {(['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'] as HskLevelCode[]).map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>分值</label>
                <input
                  type="number"
                  min={1}
                  value={draft.score}
                  onChange={(e) => update('score', Number(e.target.value) || 1)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>标签</label>
              <select
                value={draft.tags[0] ?? ''}
                onChange={(e) => update('tags', e.target.value ? [e.target.value] : [])}
              >
                <option value="">未设置</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.label}>{tag.label}</option>
                ))}
              </select>
            </div>

            <SectionHeader icon="📝" title="题干与作答" />

            <div className="form-group">
              <label>
                题干 (stem) <span className="required">*</span>
              </label>
              <textarea
                rows={3}
                value={draft.stem}
                onChange={(e) => update('stem', e.target.value)}
                placeholder="请输入题目题干…"
              />
            </div>

            {options.length > 0 && (
              <div className="form-group">
                <label>选项</label>
                <div className="hsk-question-edit-options">
                  {options.map((opt, idx) => (
                    <div key={opt.key} className="hsk-question-edit-option-row">
                      <span className="hsk-question-edit-option-key">{opt.key}</span>
                      <input
                        type="text"
                        value={opt.text ?? ''}
                        placeholder={`选项${opt.key}`}
                        onChange={(e) => updateOptionText(idx, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label>正确答案</label>
              <input
                type="text"
                value={draft.correctAnswer}
                onChange={(e) => update('correctAnswer', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>解析</label>
              <textarea
                rows={2}
                value={draft.explanation}
                onChange={(e) => update('explanation', e.target.value)}
                placeholder="题目解析（选填）"
              />
            </div>

            {(registry?.editorFields.includes('audio') || draft.audioUrl) && (
              <div className="form-group">
                <label>音频 URL</label>
                <input
                  type="url"
                  value={draft.payload?.audioUrl ?? draft.audioUrl ?? ''}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      audioUrl: e.target.value,
                      audioStatus: e.target.value ? 'ready' : 'none',
                      payload: { ...prev.payload, audioUrl: e.target.value },
                      updatedAt: new Date().toISOString(),
                    }))
                  }
                  placeholder="https://..."
                />
              </div>
            )}

            <SectionHeader icon="🔗" title="关联资源" />

            <div className="hsk-question-edit-links">
              <div>
                <label>关联课程</label>
                <input
                  type="text"
                  value={draft.linked_courses.join('、')}
                  onChange={(e) =>
                    update(
                      'linked_courses',
                      e.target.value.split('、').map((s) => s.trim()).filter(Boolean),
                    )
                  }
                  placeholder="多个用顿号分隔"
                />
              </div>
              <div>
                <label>关联试卷</label>
                <input
                  type="text"
                  value={draft.linked_papers.join('、')}
                  onChange={(e) =>
                    update(
                      'linked_papers',
                      e.target.value.split('、').map((s) => s.trim()).filter(Boolean),
                    )
                  }
                  placeholder="多个用顿号分隔"
                />
              </div>
              <div>
                <label>关联视频</label>
                <input
                  type="text"
                  value={draft.linked_videos.join('、')}
                  onChange={(e) =>
                    update(
                      'linked_videos',
                      e.target.value.split('、').map((s) => s.trim()).filter(Boolean),
                    )
                  }
                  placeholder="多个用顿号分隔"
                />
              </div>
            </div>

            <p className="hsk-question-edit-mode-hint">
              作答模式：{modeLabel} · 交互：{registry?.renderKey ?? draft.type_id}
            </p>
          </div>
        </div>

        <div className="hsk-question-edit-preview-col">
          <HskQuestionEditPreview question={draft} typeDef={typeDef} />
        </div>
      </div>

      <footer className="hsk-question-edit-footer">
        <span className="hsk-question-edit-footer-hint">
          <span className="required">*</span> 必填：题干 (stem) · （共 1 项）
        </span>
        <div className="hsk-question-edit-footer-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onBack}>
            取消
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleSave('draft')}>
            保存草稿
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => handleSave('published')}>
            发布
          </button>
        </div>
      </footer>

      {toast && <div className="hsk-toast show">{toast}</div>}
    </div>
  );
}
