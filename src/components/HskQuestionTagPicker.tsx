import { useMemo } from 'react';
import {
  getQuestionTagPickerCategories,
  getTagLabelsInCategory,
} from '../config/hskQuestionTags';
import type { HskQuestionTag } from '../types/hskExams';
import { LibraryInlineAddSelect } from './LibraryInlineAddSelect';

type Props = {
  tags: HskQuestionTag[];
  selected: string[];
  onChange: (next: string[]) => void;
};

export function HskQuestionTagPicker({ tags, selected, onChange }: Props) {
  const categories = useMemo(() => getQuestionTagPickerCategories(tags), [tags]);

  const selectTag = (label: string) => {
    if (!label || selected.includes(label)) return;
    onChange([...selected, label]);
  };

  const removeTag = (label: string) => {
    onChange(selected.filter((t) => t !== label));
  };

  return (
    <div className="library-feature-picker">
      {categories.map((cat) => {
        const optionsInCategory = getTagLabelsInCategory(cat.category, cat.tags, tags);
        const selectedInCategory = selected.filter((label) => optionsInCategory.includes(label));

        return (
          <div key={cat.category} className="library-feature-category-block">
            <div className="library-feature-group-title">{cat.category}</div>
            <LibraryInlineAddSelect
              value=""
              placeholder="请选择标签"
              options={optionsInCategory.map((label) => ({ value: label, label }))}
              onSelect={selectTag}
              style={{ marginBottom: 10 }}
            />
            {selectedInCategory.length > 0 && (
              <div className="library-feature-selected-tags">
                {selectedInCategory.map((label) => (
                  <span key={label} className="library-feature-selected-tag">
                    {label}
                    <button
                      type="button"
                      className="library-feature-selected-tag-remove"
                      aria-label={`移除 ${label}`}
                      onClick={() => removeTag(label)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
