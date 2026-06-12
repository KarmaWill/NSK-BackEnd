import { useEffect, useMemo, useState } from 'react';
import { HskAnswerModeSelect } from '../components/HskAnswerModeSelect';
import { HskTypeEditPreview } from '../components/HskTypeEditPreview';
import {
  defaultOptionCountForType,
  guessAnswerMode,
  optionLabelsFromCount,
  type AnswerModeId,
} from '../config/hskAnswerModes';
import {
  CHOICE_UI_MODES,
  FEATURE_CONFIG_GROUPS,
  editorFlagsFromFeatures,
  recommendFeaturesForUiMode,
  resolveTypeFeatures,
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
import type { HskQuestionTypeCode, HskQuestionTypeDef, HskSectionModule } from '../types/hskExams';
import { nextAvailableTypeIdForSection } from '../utils/hskQuestionTypeDuplicate';

type Props = {
  typeDef: HskQuestionTypeDef;
  isNew?: boolean;
  questionCount?: number;
  otherTypeIds?: HskQuestionTypeCode[];
  onBack: () => void;
  onSave: (next: HskQuestionTypeDef) => void;
  onDuplicateAndNew?: () => void;
};

function initFormState(typeDef: HskQuestionTypeDef) {
  const storedMode = guessAnswerMode(typeDef.id, typeDef.answerMode as AnswerModeId | undefined);
  return {
    name: typeDef.name,
    description: typeDef.description,
    uiAnswerMode: toUiAnswerMode(storedMode),
    defaultOptionCount: typeDef.defaultOptionCount ?? defaultOptionCountForType(typeDef.id),
    features: resolveTypeFeatures(typeDef),
  };
}

export function HskQuestionConfig({
  typeDef,
  isNew = false,
  questionCount = 0,
  otherTypeIds = [],
  onBack,
  onSave,
  onDuplicateAndNew,
}: Props) {
  const [name, setName] = useState(typeDef.name);
  const [description, setDescription] = useState(typeDef.description);
  const [section, setSection] = useState<HskSectionModule>(typeDef.section);
  const [typeId, setTypeId] = useState<string>(typeDef.id);
  const [uiAnswerMode, setUiAnswerMode] = useState<UiAnswerModeId>(() =>
    initFormState(typeDef).uiAnswerMode,
  );
  const [defaultOptionCount, setDefaultOptionCount] = useState(
    () => initFormState(typeDef).defaultOptionCount,
  );
  const [features, setFeatures] = useState<TypeFeatureState>(() => initFormState(typeDef).features);
  const [toast, setToast] = useState<string | null>(null);

  const featuresLocked = questionCount > 0;

  useEffect(() => {
    const next = initFormState(typeDef);
    setName(next.name);
    setDescription(next.description);
    setUiAnswerMode(next.uiAnswerMode);
    setDefaultOptionCount(next.defaultOptionCount);
    setFeatures(next.features);
    if (isNew) {
      setSection(typeDef.section);
      setTypeId(typeDef.id);
    }
  }, [typeDef, isNew]);

  const interaction = uiModeInteraction(uiAnswerMode);
  const optionLabels = useMemo(() => optionLabelsFromCount(defaultOptionCount), [defaultOptionCount]);
  const isChoiceMode = CHOICE_UI_MODES.has(uiAnswerMode);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const applyUiAnswerMode = (mode: UiAnswerModeId) => {
    if (featuresLocked) return;
    setUiAnswerMode(mode);
    setFeatures(recommendFeaturesForUiMode(mode));
    if (mode === 'true_false') {
      setDefaultOptionCount(2);
    } else if (mode === 'image_single_choice') {
      setDefaultOptionCount(3);
    } else if (CHOICE_UI_MODES.has(mode) && defaultOptionCount < 2) {
      setDefaultOptionCount(4);
    }
  };

  const toggleStem = (key: StemFeatureKey) => {
    if (featuresLocked) return;
    setFeatures((prev) => ({
      ...prev,
      stem: { ...prev.stem, [key]: !prev.stem[key] },
    }));
  };

  const toggleOption = (key: OptionFeatureKey) => {
    if (featuresLocked) return;
    setFeatures((prev) => ({
      ...prev,
      option: { ...prev.option, [key]: !prev.option[key] },
    }));
  };

  const toggleGlobal = (key: GlobalFeatureKey) => {
    if (featuresLocked) return;
    setFeatures((prev) => ({
      ...prev,
      global: { ...prev.global, [key]: !prev.global[key] },
    }));
  };

  const applySection = (nextSection: HskSectionModule) => {
    setSection(nextSection);
    const stubTypes = otherTypeIds.map((id) => ({ id, section: nextSection }) as HskQuestionTypeDef);
    const nextId = nextAvailableTypeIdForSection(nextSection, stubTypes);
    if (nextId) setTypeId(nextId);
  };

  const handleSave = () => {
    if (!name.trim()) {
      showToast('请填写题型名称');
      return;
    }
    let savedId = typeDef.id;
    if (isNew) {
      const id = typeId.trim().toUpperCase() as HskQuestionTypeCode;
      if (!/^[LRW]\d{2}$/.test(id)) {
        showToast('题型 ID 格式应为 L01、R01、W01 等');
        return;
      }
      const expectedPrefix = section === 'listening' ? 'L' : section === 'writing' ? 'W' : 'R';
      if (!id.startsWith(expectedPrefix)) {
        showToast(`题型 ID 应以 ${expectedPrefix} 开头（与分区一致）`);
        return;
      }
      if (otherTypeIds.includes(id)) {
        showToast(`题型 ID ${id} 已存在`);
        return;
      }
      savedId = id;
    }
    const lockedSnapshot = initFormState(typeDef);
    const answerMode = featuresLocked ? toStoredAnswerMode(lockedSnapshot.uiAnswerMode) : toStoredAnswerMode(uiAnswerMode);
    const nextOptionCount = featuresLocked ? lockedSnapshot.defaultOptionCount : defaultOptionCount;
    const nextFeatures = featuresLocked ? lockedSnapshot.features : features;

    onSave({
      ...typeDef,
      id: savedId,
      hskTypeCode: savedId,
      section: isNew ? section : typeDef.section,
      name: name.trim(),
      description: description.trim(),
      answerMode,
      defaultOptionCount: nextOptionCount,
      editorFieldFlags: editorFlagsFromFeatures(nextFeatures),
      lastModified: new Date().toISOString().slice(0, 10),
    });
    showToast(isNew ? '题型已创建' : '题型已保存');
  };

  const renderFeatureRow = (
    feat: { key: string; icon: string; label: string; hint: string },
    checked: boolean,
    onToggle: () => void,
  ) => (
    <label
      key={feat.key}
      className={`hsk-type-edit-feature-row${featuresLocked ? ' is-locked' : ''}`}
    >
      <input type="checkbox" checked={checked} onChange={onToggle} disabled={featuresLocked} />
      <span className="hsk-type-edit-field-icon" aria-hidden>
        {feat.icon}
      </span>
      <span className="hsk-type-edit-field-text">
        <strong>{feat.label}</strong>
        <span>{feat.hint}</span>
      </span>
    </label>
  );

  return (
    <div className="hsk-type-edit-page">
      <header className="hsk-type-edit-topbar">
        <nav className="hsk-type-edit-breadcrumb" aria-label="面包屑">
          <button type="button" className="hsk-type-edit-breadcrumb-link" onClick={onBack}>
            题型管理
          </button>
          <span className="hsk-type-edit-breadcrumb-sep">/</span>
          <span className="hsk-type-edit-breadcrumb-current">
            {isNew ? '新建题型' : `编辑题型：${name || typeDef.name}`}
          </span>
        </nav>
        <div className="hsk-type-edit-topbar-actions">
          {featuresLocked && onDuplicateAndNew && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={onDuplicateAndNew}>
              复制并新建
            </button>
          )}
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
            {featuresLocked && (
              <div className="hsk-type-edit-lock-banner" role="status">
                <div>
                  <strong>核心特征已锁定</strong>
                  <p>
                    该题型下已有 {questionCount} 道题目。作答模式、选项结构与题干/选项/全局附加组件不可修改，以免破坏已有题目数据。
                    如需调整结构，请复制并新建版本（如「{name} V2.0」）。
                  </p>
                </div>
                {onDuplicateAndNew && (
                  <button type="button" className="btn btn-primary btn-sm" onClick={onDuplicateAndNew}>
                    复制并新建
                  </button>
                )}
              </div>
            )}

            <section className="hsk-type-edit-card">
              <h2 className="hsk-type-edit-section-title">
                <span className="hsk-type-edit-section-accent" aria-hidden />
                基础信息
              </h2>

              {isNew && (
                <div className="hsk-type-edit-grid-2">
                  <div className="form-group">
                    <label>
                      分区 <span className="required">*</span>
                    </label>
                    <select value={section} onChange={(e) => applySection(e.target.value as HskSectionModule)}>
                      <option value="listening">听力</option>
                      <option value="reading">阅读</option>
                      <option value="writing">写作</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>
                      题型 ID <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      value={typeId}
                      onChange={(e) => setTypeId(e.target.value.toUpperCase())}
                      placeholder="如 R08"
                    />
                    <p className="hsk-type-edit-hint">格式 L01 / R01 / W01，同分区内不可重复</p>
                  </div>
                </div>
              )}

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

              <div className={`hsk-type-edit-grid-2${featuresLocked ? ' is-locked' : ''}`}>
                <div className="form-group">
                  <label>
                    作答模式 <span className="required">*</span>
                  </label>
                  <HskAnswerModeSelect
                    value={uiAnswerMode}
                    disabled={featuresLocked}
                    onChange={applyUiAnswerMode}
                  />
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

              {isChoiceMode && (
                <div className={`hsk-type-edit-choice-block${featuresLocked ? ' is-locked' : ''}`}>
                  <div className="hsk-type-edit-grid-2">
                    <div className="form-group">
                      <label>默认选项数</label>
                      <input
                        type="number"
                        min={2}
                        max={6}
                        value={defaultOptionCount}
                        disabled={featuresLocked}
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

            <section className={`hsk-type-edit-card${featuresLocked ? ' is-locked' : ''}`}>
              <h2 className="hsk-type-edit-section-title">
                <span className="hsk-type-edit-section-accent" aria-hidden />
                题型特征配置
              </h2>
              <p className="hsk-type-edit-lead">
                控制题目编辑页中题干区、选项区及全局结构的附加控件。
                {featuresLocked ? '当前为只读展示。' : '作答模式选择后系统会自动推荐。'}
              </p>

              {FEATURE_CONFIG_GROUPS.map((group) => (
                <div key={group.id} className="hsk-type-edit-feature-group">
                  <h3 className="hsk-type-edit-feature-group-title">{group.title}</h3>
                  <p className="hsk-type-edit-feature-group-lead">{group.lead}</p>
                  <div className="hsk-type-edit-feature-list">
                    {group.features.map((feat) => {
                      const checked =
                        group.id === 'stem'
                          ? features.stem[feat.key as StemFeatureKey]
                          : group.id === 'option'
                            ? features.option[feat.key as OptionFeatureKey]
                            : features.global[feat.key as GlobalFeatureKey];
                      const onToggle =
                        group.id === 'stem'
                          ? () => toggleStem(feat.key as StemFeatureKey)
                          : group.id === 'option'
                            ? () => toggleOption(feat.key as OptionFeatureKey)
                            : () => toggleGlobal(feat.key as GlobalFeatureKey);
                      return renderFeatureRow(feat, checked, onToggle);
                    })}
                  </div>
                </div>
              ))}
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
