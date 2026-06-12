import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { HskMultilangTextarea } from '../components/HskMultilangTextarea';
import { HskQuestionAudioSection } from '../components/HskQuestionAudioSection';
import { HskQuestionEditPreview } from '../components/HskQuestionEditPreview';
import { HskQuestionImageOptionsEditor } from '../components/HskQuestionImageOptionsEditor';
import { HskQuestionTagPicker } from '../components/HskQuestionTagPicker';
import { HskQuestionEditTypeSelect } from '../components/HskQuestionEditTypeSelect';
import { getAnswerModeDef, guessAnswerMode } from '../config/hskAnswerModes';
import { autoTranslateTitleByLang, resolveExplanationByLang, type LangKey } from '../config/languages';
import { isImageOptionQuestionType } from '../config/hskQuestionTypeGroups';
import { getQuestionStatusClass, getQuestionStatusLabel } from '../config/hskQuestionWorkflow';
import { defaultCompoundForType, getRegistryEntry } from '../config/hskQuestionTypeRegistry';
import type { HskLevelCode, HskQuestionRow, HskQuestionStatus, HskQuestionTypeDef, HskRuntimeOption } from '../types/hskExams';
import { HSK_QUESTION_LEVELS } from '../types/hskExams';

type Props = {
  question: HskQuestionRow;
  types: HskQuestionTypeDef[];
  tags: { id: string; label: string }[];
  onBack: () => void;
  onSave: (question: HskQuestionRow) => void;
};

function SectionHeader({
  icon,
  title,
  extra,
}: {
  icon: string;
  title: string;
  extra?: ReactNode;
}) {
  return (
    <div className={`hsk-question-edit-section-head${extra ? ' hsk-question-edit-section-head-split' : ''}`}>
      <div className="hsk-question-edit-section-head-main">
        <span aria-hidden>{icon}</span>
        <h3>{title}</h3>
      </div>
      {extra}
    </div>
  );
}

const DEFAULT_IMAGE_OPTIONS: HskRuntimeOption[] = [
  { key: 'A', text: '图片A', image: '' },
  { key: 'B', text: '图片B', image: '' },
  { key: 'C', text: '图片C', image: '' },
];

export function HskQuestionEditPage({ question, types, tags, onBack, onSave }: Props) {
  const [draft, setDraft] = useState<HskQuestionRow>(() => structuredClone(question));
  const [fullscreenPreview, setFullscreenPreview] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [explanationLangTab, setExplanationLangTab] = useState<LangKey>('CN');

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

  const explanationByLang = useMemo(
    () => resolveExplanationByLang(draft.explanation, draft.explanationByLang),
    [draft.explanation, draft.explanationByLang],
  );

  const options =
    draft.payload?.runtimeOptions ??
    draft.options.map((o) => ({
      key: o.label,
      text: o.text,
      pinyin: o.pinyin,
      image: o.image,
    }));

  const usesImageOptions = isImageOptionQuestionType(draft.type_id);
  const imageOptions = useMemo(() => {
    if (!usesImageOptions) return options;
    if (options.length >= 2) return options;
    return DEFAULT_IMAGE_OPTIONS;
  }, [usesImageOptions, options]);

  const showAudioSection = registry?.editorFields.includes('audio') || !!draft.audioUrl;
  const audioUrl = draft.payload?.audioUrl ?? draft.audioUrl ?? '';
  const audioTranscript = draft.payload?.audioTranscript ?? '';

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const update = <K extends keyof HskQuestionRow>(key: K, value: HskQuestionRow[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value, updatedAt: new Date().toISOString() }));
  };

  const syncRuntimeOptions = (next: HskRuntimeOption[]) => {
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
      imageStatus: next.some((o) => o.image) ? 'ready' : prev.imageStatus,
      updatedAt: new Date().toISOString(),
    }));
  };

  const updateOptionText = (index: number, text: string) => {
    const next = [...options];
    next[index] = { ...next[index], text };
    syncRuntimeOptions(next);
  };

  const updateAudioUrl = (url: string) => {
    setDraft((prev) => ({
      ...prev,
      audioUrl: url,
      audioStatus: url ? 'ready' : 'none',
      payload: { ...prev.payload, audioUrl: url },
      updatedAt: new Date().toISOString(),
    }));
  };

  const updateAudioTranscript = (text: string) => {
    setDraft((prev) => ({
      ...prev,
      payload: { ...prev.payload, audioTranscript: text },
      updatedAt: new Date().toISOString(),
    }));
  };

  const updateTags = (nextTags: string[]) => {
    setDraft((prev) => ({ ...prev, tags: nextTags, updatedAt: new Date().toISOString() }));
  };

  const updateExplanationLang = (lang: LangKey, value: string) => {
    setDraft((prev) => {
      const nextByLang = {
        ...resolveExplanationByLang(prev.explanation, prev.explanationByLang),
        [lang]: value,
      };
      return {
        ...prev,
        explanationByLang: nextByLang,
        explanation: lang === 'CN' ? value : (nextByLang.CN ?? prev.explanation),
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleAutoTranslateExplanation = () => {
    const seed = (explanationByLang.CN ?? explanationByLang[explanationLangTab] ?? '').trim();
    if (!seed) return;
    const next = autoTranslateTitleByLang(seed);
    setDraft((prev) => ({
      ...prev,
      explanationByLang: next,
      explanation: next.CN ?? prev.explanation,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleSave = (status: HskQuestionStatus) => {
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
              <div className="form-group hsk-question-edit-type-field">
                <label>题型</label>
                <HskQuestionEditTypeSelect
                  value={draft.type_id}
                  types={visibleTypes}
                  onChange={(typeId) => update('type_id', typeId)}
                />
              </div>
              <div className="form-group">
                <label>等级</label>
                <select
                  value={draft.level}
                  onChange={(e) => update('level', e.target.value as HskLevelCode)}
                >
                  {HSK_QUESTION_LEVELS.map((level) => (
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

            <div className="hsk-question-edit-workflow-card">
              <div className="hsk-question-edit-workflow-head">
                <span className={`hsk-question-list-status ${getQuestionStatusClass(draft.status)}`}>
                  {getQuestionStatusLabel(draft.status)}
                </span>
                <span className="hsk-question-edit-workflow-hint">流程：草稿 → 待审核 → 待发布 → 已发布</span>
              </div>
              <div className="hsk-question-edit-workflow-actions">
                {draft.status === 'draft' && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleSave('pending_review')}>
                    提交审核
                  </button>
                )}
                {draft.status === 'pending_review' && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleSave('pending_publish')}>
                    审核通过
                  </button>
                )}
                {draft.status === 'pending_publish' && (
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => handleSave('published')}>
                    发布
                  </button>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>标签</label>
              <div className="form-hint" style={{ marginBottom: 12 }}>
                按分类选择题型特征标签，可多选；在「标签管理」中新增的标签会出现在「自定义标签」分组。
              </div>
              <HskQuestionTagPicker
                tags={tags}
                selected={draft.tags}
                onChange={updateTags}
              />
              {draft.tags.length === 0 && (
                <div className="form-hint" style={{ marginTop: 8 }}>未设置</div>
              )}
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

            {showAudioSection && (
              <HskQuestionAudioSection
                audioUrl={audioUrl}
                audioTranscript={audioTranscript}
                required={registry?.editorFields.includes('audio') ?? false}
                onAudioUrlChange={updateAudioUrl}
                onAudioTranscriptChange={updateAudioTranscript}
              />
            )}

            {usesImageOptions ? (
              <HskQuestionImageOptionsEditor
                options={imageOptions}
                correctAnswer={draft.correctAnswer}
                showCorrectToggle={draft.type_id === 'L01'}
                onChange={syncRuntimeOptions}
                onCorrectAnswerChange={(answer) => update('correctAnswer', answer)}
              />
            ) : (
              options.length > 0 && (
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
              )
            )}

            {(!usesImageOptions || draft.type_id !== 'L01') && (
              <div className="form-group">
                <label>正确答案</label>
                <input
                  type="text"
                  value={draft.correctAnswer}
                  onChange={(e) => update('correctAnswer', e.target.value)}
                  placeholder={usesImageOptions ? '如 s1:img1,s2:img2,s3:img3' : ''}
                />
              </div>
            )}

            <div className="form-group">
              <label>解析</label>
              <HskMultilangTextarea
                langTab={explanationLangTab}
                onLangTabChange={setExplanationLangTab}
                valueByLang={explanationByLang}
                onChange={updateExplanationLang}
                onAutoTranslate={handleAutoTranslateExplanation}
                placeholder="题目解析（选填）"
                rows={3}
                fieldHint="中文解析会同步到 explanation 字段，供学员端默认展示"
              />
            </div>

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
          {draft.status === 'draft' && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleSave('pending_review')}>
              提交审核
            </button>
          )}
          {draft.status === 'pending_review' && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleSave('pending_publish')}>
              审核通过
            </button>
          )}
          {draft.status === 'pending_publish' && (
            <button type="button" className="btn btn-primary btn-sm" onClick={() => handleSave('published')}>
              发布
            </button>
          )}
          {draft.status === 'published' && (
            <button type="button" className="btn btn-primary btn-sm" disabled>
              已发布
            </button>
          )}
        </div>
      </footer>

      {toast && <div className="hsk-toast show">{toast}</div>}
    </div>
  );
}
