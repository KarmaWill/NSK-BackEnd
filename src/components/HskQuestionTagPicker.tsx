import { useEffect, useMemo, useState } from 'react';
import {
  countTagsInCategory,
  getQuestionTagPickerCategories,
  getTagLabelsInCategory,
  groupSelectedTagsByCategory,
  HSK_QUESTION_TAG_CATEGORY_MAX_LENGTH,
  HSK_QUESTION_TAG_MAX_LENGTH,
  HSK_PRESET_TAG_CATEGORY_NAMES,
  isPresetTagCategory,
  sanitizeQuestionTagCategoryInput,
  sanitizeQuestionTagInput,
} from '../config/hskQuestionTags';
import type { HskQuestionTag, HskQuestionTagCatalog } from '../types/hskExams';
import { LibraryInlineAddSelect, type InlineAddSelectOption } from './LibraryInlineAddSelect';

type DeleteTarget =
  | { kind: 'tag'; label: string }
  | { kind: 'category'; label: string };

type Props = {
  tags: HskQuestionTag[];
  tagCatalog: HskQuestionTagCatalog;
  selected: string[];
  onChange: (next: string[]) => void;
  onGlobalTagsChange: (nextTags: HskQuestionTag[]) => void;
  onTagCatalogChange: (nextCatalog: HskQuestionTagCatalog) => void;
  onToast?: (message: string) => void;
};

function TagPickerDeleteModal({
  target,
  tagCount,
  onCancel,
  onConfirm,
}: {
  target: DeleteTarget | null;
  tagCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    setConfirmText('');
  }, [target?.label, target?.kind]);

  if (!target) return null;

  const isCategory = target.kind === 'category';
  const isPresetCategory = isCategory && isPresetTagCategory(target.label);
  const title = isCategory ? `删除分类「${target.label}」` : `删除标签「${target.label}」`;

  return (
    <div className="hsk-tag-modal-overlay" onClick={onCancel} role="presentation">
      <div
        className="hsk-tag-modal hsk-tag-modal-md"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-labelledby="hsk-tag-picker-delete-title"
      >
        <h3 id="hsk-tag-picker-delete-title" className="hsk-tag-modal-title">
          {title}
        </h3>
        {isCategory ? (
          isPresetCategory ? (
            <p className="hsk-tag-delete-text">
              该分类为内置分类。确认后将隐藏此分类，分类下标签仍保留；请输入 <strong>{target.label}</strong> 以确认。
            </p>
          ) : (
            <div className="hsk-tag-delete-warning">
              删除自定义分类将同时移除该分类下 <strong>{tagCount}</strong> 个标签，并从所有题目中清除，此操作对全库生效且不可恢复。请输入{' '}
              <strong>{target.label}</strong> 以确认。
            </div>
          )
        ) : (
          <p className="hsk-tag-delete-text">
            删除后该标签将从全库及所有题目中移除。请输入 <strong>{target.label}</strong> 以确认删除。
          </p>
        )}
        <div className="hsk-tag-modal-field">
          <label htmlFor="hsk-tag-picker-delete-input">确认名称</label>
          <input
            id="hsk-tag-picker-delete-input"
            type="text"
            value={confirmText}
            placeholder={target.label}
            onChange={(event) => setConfirmText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && confirmText === target.label) {
                event.preventDefault();
                onConfirm();
              }
              if (event.key === 'Escape') {
                event.preventDefault();
                onCancel();
              }
            }}
          />
        </div>
        <div className="hsk-tag-modal-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>
            取消
          </button>
          <button
            type="button"
            className="hsk-tag-modal-delete"
            disabled={confirmText !== target.label}
            onClick={onConfirm}
          >
            确认删除
          </button>
        </div>
      </div>
    </div>
  );
}

export function HskQuestionTagPicker({
  tags,
  tagCatalog,
  selected,
  onChange,
  onGlobalTagsChange,
  onTagCatalogChange,
  onToast,
}: Props) {
  const categories = useMemo(
    () => getQuestionTagPickerCategories(tags, tagCatalog),
    [tagCatalog, tags],
  );
  const [activeCategory, setActiveCategory] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const categoryOptions = useMemo(
    () => categories.map((cat) => ({ value: cat.category, label: cat.category })),
    [categories],
  );

  const activeCategoryDef = categories.find((cat) => cat.category === activeCategory);

  const tagOptions = useMemo(() => {
    if (!activeCategoryDef) return [];
    return getTagLabelsInCategory(activeCategoryDef.category, activeCategoryDef.tags, tags)
      .filter((label) => !selected.includes(label))
      .map((label) => ({ value: label, label }));
  }, [activeCategoryDef, selected, tags]);

  const selectedByCategory = useMemo(
    () => groupSelectedTagsByCategory(selected, categories, tags),
    [categories, selected, tags],
  );

  const canPickTag = tagOptions.length > 0;
  const deleteTargetTagCount =
    deleteTarget?.kind === 'category' ? countTagsInCategory(deleteTarget.label, tags, categories) : 0;

  useEffect(() => {
    if (activeCategory && !categories.some((cat) => cat.category === activeCategory)) {
      setActiveCategory('');
    }
  }, [activeCategory, categories]);

  const selectTag = (label: string) => {
    if (!label || selected.includes(label)) return;
    onChange([...selected, label]);
  };

  const removeTag = (label: string) => {
    onChange(selected.filter((t) => t !== label));
  };

  const addGlobalCategory = (rawLabel: string) => {
    const label = sanitizeQuestionTagCategoryInput(rawLabel);
    if (!label) return;
    if (
      HSK_PRESET_TAG_CATEGORY_NAMES.includes(label) ||
      tagCatalog.customCategories.includes(label) ||
      categories.some((cat) => cat.category === label)
    ) {
      onToast?.('分类名称已存在');
      setActiveCategory(label);
      return;
    }
    onTagCatalogChange({
      ...tagCatalog,
      customCategories: [...tagCatalog.customCategories, label],
    });
    setActiveCategory(label);
    onToast?.(`已添加分类 ${label}`);
  };

  const addGlobalTag = (rawLabel: string) => {
    if (!activeCategory) return;
    const label = sanitizeQuestionTagInput(rawLabel);
    if (!label) return;
    if (tags.some((tag) => tag.label === label)) {
      onToast?.('标签名称已存在');
      if (!selected.includes(label)) {
        onChange([...selected, label]);
      }
      return;
    }

    const category = activeCategory === '自定义标签' ? undefined : activeCategory;
    onGlobalTagsChange([
      ...tags,
      {
        id: `tag-${Date.now()}`,
        label,
        category,
      },
    ]);
    if (!selected.includes(label)) {
      onChange([...selected, label]);
    }
    onToast?.(`已添加标签 ${label}`);
  };

  const requestDeleteTag = (option: InlineAddSelectOption) => {
    setDeleteTarget({ kind: 'tag', label: option.label });
  };

  const requestDeleteCategory = (option: InlineAddSelectOption) => {
    if (option.value === '自定义标签') {
      onToast?.('「自定义标签」分类不可删除');
      return;
    }
    setDeleteTarget({ kind: 'category', label: option.value });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.kind === 'tag') {
      const label = deleteTarget.label;
      onGlobalTagsChange(tags.filter((tag) => tag.label !== label));
      onChange(selected.filter((item) => item !== label));
      onToast?.(`已删除标签 ${label}`);
    } else {
      const category = deleteTarget.label;
      if (isPresetTagCategory(category)) {
        onTagCatalogChange({
          ...tagCatalog,
          hiddenCategories: [...new Set([...tagCatalog.hiddenCategories, category])],
        });
        if (activeCategory === category) {
          setActiveCategory('');
        }
        onToast?.(`已隐藏分类 ${category}`);
      } else {
        const labelsInCategory = new Set(
          tags.filter((tag) => tag.category === category).map((tag) => tag.label),
        );
        onGlobalTagsChange(tags.filter((tag) => tag.category !== category));
        onChange(selected.filter((item) => !labelsInCategory.has(item)));
        onTagCatalogChange({
          ...tagCatalog,
          customCategories: tagCatalog.customCategories.filter((item) => item !== category),
          hiddenCategories: tagCatalog.hiddenCategories.filter((item) => item !== category),
        });
        if (activeCategory === category) {
          setActiveCategory('');
        }
        onToast?.(`已删除分类 ${category}`);
      }
    }

    setDeleteTarget(null);
  };

  return (
    <>
      <div className="hsk-question-tag-picker-compact">
        <p className="hsk-question-tag-picker-hint">标签与分类均为全库共用；新增或删除后，所有题目均受影响。</p>
        <div className="hsk-question-tag-picker-add-row">
          <div className="hsk-question-tag-picker-field">
            <span className="hsk-question-tag-picker-field-label">标签分类</span>
            <LibraryInlineAddSelect
              value={activeCategory}
              placeholder={categoryOptions.length > 0 ? '请选择分类' : '暂无可用分类'}
              options={categoryOptions}
              onSelect={(category) => setActiveCategory(category)}
              onAdd={addGlobalCategory}
              addLabel="+ 新建分类"
              addPlaceholder="输入分类名称"
              sanitizeAdd={sanitizeQuestionTagCategoryInput}
              maxLength={HSK_QUESTION_TAG_CATEGORY_MAX_LENGTH}
              canDeleteOption={(value) => value !== '自定义标签'}
              onDeleteOptionRequest={requestDeleteCategory}
              addHint={`最多 ${HSK_QUESTION_TAG_CATEGORY_MAX_LENGTH} 字；仅中文、英文字母、数字 · 全库共用`}
              disabled={categoryOptions.length === 0}
            />
          </div>
          <div className="hsk-question-tag-picker-field">
            <span className="hsk-question-tag-picker-field-label">具体标签</span>
            <LibraryInlineAddSelect
              value=""
              placeholder={
                !activeCategory
                  ? '请先选择分类'
                  : canPickTag
                    ? '请选择标签'
                    : '请选择或新建标签'
              }
              options={tagOptions}
              onSelect={selectTag}
              onAdd={activeCategory ? addGlobalTag : undefined}
              addLabel="+ 新建标签"
              addPlaceholder={`输入${activeCategory || '标签'}名称`}
              sanitizeAdd={sanitizeQuestionTagInput}
              maxLength={HSK_QUESTION_TAG_MAX_LENGTH}
              canDeleteOption={() => true}
              onDeleteOptionRequest={requestDeleteTag}
              addHint={`最多 ${HSK_QUESTION_TAG_MAX_LENGTH} 字；仅中文、英文字母、数字 · 全库共用`}
              disabled={!activeCategory}
            />
          </div>
        </div>

        {selectedByCategory.length > 0 && (
          <div className="hsk-question-tag-picker-selected">
            {selectedByCategory.map(({ category, labels }) => (
              <div key={category} className="hsk-question-tag-category-group">
                <div className="hsk-question-tag-category-label">{category}</div>
                <div className="library-feature-selected-tags">
                  {labels.map((label) => (
                    <span key={label} className="library-feature-selected-tag">
                      {label}
                      <button
                        type="button"
                        className="library-feature-selected-tag-remove"
                        aria-label={`移除 ${category} · ${label}`}
                        onClick={() => removeTag(label)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TagPickerDeleteModal
        target={deleteTarget}
        tagCount={deleteTargetTagCount}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
