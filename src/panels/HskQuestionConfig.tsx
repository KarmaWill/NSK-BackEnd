import { useMemo, useState } from 'react';
import { HskTypeEditPreview } from '../components/HskTypeEditPreview';
import {
  defaultOptionCountForType,
  guessAnswerMode,
  optionLabelsFromCount,
  type AnswerModeId,
} from '../config/hskAnswerModes';
import {
  CHOICE_UI_MODES,
  GLOBAL_FEATURES,
  GROUPED_ANSWER_MODE_OPTIONS,
  OPTION_FEATURES,
  STEM_FEATURES,
  editorFlagsFromFeatures,
  featuresFromEditorFlags,
  recommendFeaturesForUiMode,
  toStoredAnswerMode,
  toUiAnswerMode,
  uiModeInteraction,
  uiModeLabel,
  type GlobalFeatureKey,
  type OptionFeatureKey,
  type StemFeatureKey,
  type TypeFeatureState,
  type UiAnswerModeId,
} from '../config/hskTypeEditConfig';
import type { HskQuestionTypeCode, HskQuestionTypeDef } from '../types/hskExams';

type Props = {
  typeDef: HskQuestionTypeDef;
  otherTypeIds?: HskQuestionTypeCode[];
  onBack: () => void;
  onSave: (next: HskQuestionTypeDef) => void;
};

export function HskQuestionConfig({ typeDef, onBack, onSave }: Props) {
  const storedMode = guessAnswerMode(typeDef.id, typeDef.answerMode as AnswerModeId | undefined);

  const [name, setName] = useState(typeDef.name);
  const [description, setDescription] = useState(typeDef.description);
  const [uiAnswerMode, setUiAnswerMode] = useState<UiAnswerModeId>(() => toUiAnswerMode(storedMode));
  const [defaultScore, setDefaultScore] = useState(typeDef.defaultScore);
  const [defaultOptionCount, setDefaultOptionCount] = useState(
    typeDef.defaultOptionCount ?? defaultOptionCountForType(typeDef.id),
  );
  const [features, setFeatures] = useState<TypeFeatureState>(() =>
    featuresFromEditorFlags(typeDef.editorFieldFlags ?? {}),
  );
  const [toast, setToast] = useState<string | null>(null);

  const interaction = uiModeInteraction(uiAnswerMode);
  const optionLabels = useMemo(() => optionLabelsFromCount(defaultOptionCount), [defaultOptionCount]);
  const isChoiceMode = CHOICE_UI_MODES.has(uiAnswerMode);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const applyUiAnswerMode = (mode: UiAnswerModeId) => {
    setUiAnswerMode(mode);
    setFeatures(recommendFeaturesForUiMode(mode));
  };

  const toggleStem = (key: StemFeatureKey) => {
    setFeatures((prev) => ({
      ...prev,
      stem: { ...prev.stem, [key]: !prev.stem[key] },
    }));
  };

  const toggleOption = (key: OptionFeatureKey) => {
    setFeatures((prev) => ({
      ...prev,
      option: { ...prev.option, [key]: !prev.option[key] },
    }));
  };

  const toggleGlobal = (key: GlobalFeatureKey) => {
    setFeatures((prev) => ({
      ...prev,
      global: { ...prev.global, [key]: !prev.global[key] },
    }));
  };

  const handleSave = () => {
    if (!name.trim()) {
      showToast('请填写题型名称');
      return;
    }
    const answerMode = toStoredAnswerMode(uiAnswerMode);
    onSave({
      ...typeDef,
      name: name.trim(),
      description: description.trim(),
      defaultScore,
      answerMode,
      defaultOptionCount,
      editorFieldFlags: editorFlagsFromFeatures(features),
      lastModified: new Date().toISOString().slice(0, 10),
    });
    showToast('题型已保存');
  };

  return (
    <div className="hsk-type-edit-page">
      <header className="hsk-type-edit-topbar">
        <nav className="hsk-type-edit-breadcrumb" aria-label="面包屑">
          <button type="button" className="hsk-type-edit-breadcrumb-link" onClick={onBack}>
            题型管理
          </button>
          <span className="hsk-type-edit-breadcrumb-sep">/</span>
          <span className="hsk-type-edit-breadcrumb-current">编辑题型：{name || typeDef.name}</span>
        </nav>
        <div className="hsk-type-edit-topbar-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onBack}>
            取消
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleSave}>
            保存题型
          </button>
        </div>
      </header>

      <div className="hsk-type-edit-split">
        <div className="hsk-type-edit-form-col">
          <div className="hsk-type-edit-form-inner">
            <section className="hsk-type-edit-card">
              <h2 className="hsk-type-edit-section-title">
                <span className="hsk-type-edit-section-accent" aria-hidden />
                基础信息
              </h2>

              <div className="form-group">
                <label>
                  题型名称 <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="如：听力单选题、图片选择"
                />
              </div>

              <div className="form-group">
                <label>描述</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="题型描述（选填），用于帮助其他管理员理解该题型用途"
                />
              </div>

              <div className="hsk-type-edit-grid-2">
                <div className="form-group">
                  <label>
                    作答模式 <span className="required">*</span>
                  </label>
                  <select value={uiAnswerMode} onChange={(e) => applyUiAnswerMode(e.target.value as UiAnswerModeId)}>
                    {GROUPED_ANSWER_MODE_OPTIONS.map((group) => (
                      <optgroup key={group.group} label={`── ${group.group} ──`}>
                        {group.modes.map((mode) => (
                          <option key={mode.value} value={mode.value}>
                            {mode.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <p className="hsk-type-edit-hint">选择后自动推导交互方式并推荐配置字段</p>
                </div>

                <div className="form-group">
                  <label>交互方式</label>
                  <input type="text" value={interaction} readOnly className="input-readonly" />
                  <p className="hsk-type-edit-hint">
                    由作答模式「{uiModeLabel(uiAnswerMode)}」自动推导
                  </p>
                </div>
              </div>

              <div className="form-group hsk-type-edit-score-field">
                <label>默认分值</label>
                <input
                  type="number"
                  min={1}
                  value={defaultScore}
                  onChange={(e) => setDefaultScore(Number(e.target.value) || 1)}
                />
              </div>

              {isChoiceMode && (
                <div className="hsk-type-edit-choice-block">
                  <div className="hsk-type-edit-grid-2">
                    <div className="form-group">
                      <label>默认选项数</label>
                      <input
                        type="number"
                        min={2}
                        max={6}
                        value={defaultOptionCount}
                        onChange={(e) => setDefaultOptionCount(Number(e.target.value) || 2)}
                      />
                    </div>
                    <div className="form-group">
                      <label>选项标签</label>
                      <div className="hsk-type-edit-option-labels">
                        {optionLabels.map((label) => (
                          <span key={label} className="hsk-type-edit-option-chip">
                            {label}
                          </span>
                        ))}
                      </div>
                      <p className="hsk-type-edit-hint">由默认选项数自动生成 A/B/C/D…</p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="hsk-type-edit-card">
              <h2 className="hsk-type-edit-section-title">
                <span className="hsk-type-edit-section-accent" aria-hidden />
                题型特征配置
              </h2>
              <p className="hsk-type-edit-lead">
                控制题目编辑页中题干区、选项区及全局结构的附加控件。作答模式选择后系统会自动推荐。
              </p>

              <div className="hsk-type-edit-feature-group">
                <h3 className="hsk-type-edit-feature-group-title">题干区</h3>
                <div className="hsk-type-edit-feature-grid">
                  {STEM_FEATURES.map((feat) => (
                    <label key={feat.key} className="hsk-type-edit-feature-row">
                      <input
                        type="checkbox"
                        checked={features.stem[feat.key]}
                        onChange={() => toggleStem(feat.key)}
                      />
                      <span className="hsk-type-edit-field-icon" aria-hidden>{feat.icon}</span>
                      <span className="hsk-type-edit-field-text">
                        <strong>{feat.label}</strong>
                        <span>{feat.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="hsk-type-edit-feature-group">
                <h3 className="hsk-type-edit-feature-group-title">选项区</h3>
                <div className="hsk-type-edit-feature-grid">
                  {OPTION_FEATURES.map((feat) => (
                    <label key={feat.key} className="hsk-type-edit-feature-row">
                      <input
                        type="checkbox"
                        checked={features.option[feat.key]}
                        onChange={() => toggleOption(feat.key)}
                      />
                      <span className="hsk-type-edit-field-icon" aria-hidden>{feat.icon}</span>
                      <span className="hsk-type-edit-field-text">
                        <strong>{feat.label}</strong>
                        <span>{feat.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="hsk-type-edit-feature-group">
                <h3 className="hsk-type-edit-feature-group-title">全局结构</h3>
                <div className="hsk-type-edit-feature-grid">
                  {GLOBAL_FEATURES.map((feat) => (
                    <label key={feat.key} className="hsk-type-edit-feature-row">
                      <input
                        type="checkbox"
                        checked={features.global[feat.key]}
                        onChange={() => toggleGlobal(feat.key)}
                      />
                      <span className="hsk-type-edit-field-icon" aria-hidden>{feat.icon}</span>
                      <span className="hsk-type-edit-field-text">
                        <strong>{feat.label}</strong>
                        <span>{feat.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </section>

            <div className="hsk-type-edit-footer-mobile">
              <button type="button" className="btn btn-secondary" onClick={onBack}>
                取消
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSave}>
                保存题型
              </button>
            </div>
          </div>
        </div>

        <aside className="hsk-type-edit-preview-col">
          <HskTypeEditPreview
            answerMode={uiAnswerMode}
            optionCount={defaultOptionCount}
            features={features}
          />
        </aside>
      </div>

      {toast && <div className="hsk-toast show">{toast}</div>}
    </div>
  );
}
