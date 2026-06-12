import { useMemo } from 'react';
import {
  buildQuestionEditTypeOptions,
  questionEditTypeOptionLabel,
  questionEditTypeSelectValue,
} from '../config/hskQuestionTypeGroups';
import type { HskQuestionTypeCode, HskQuestionTypeDef } from '../types/hskExams';

type Props = {
  value: HskQuestionTypeCode;
  types: HskQuestionTypeDef[];
  onChange: (value: HskQuestionTypeCode) => void;
  disabled?: boolean;
  className?: string;
};

export function HskQuestionEditTypeSelect({
  value,
  types,
  onChange,
  disabled = false,
  className,
}: Props) {
  const options = useMemo(() => buildQuestionEditTypeOptions(types), [types]);
  const selectValue = questionEditTypeSelectValue(value);

  return (
    <select
      className={`hsk-question-edit-type-select${className ? ` ${className}` : ''}`}
      value={selectValue}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as HskQuestionTypeCode)}
    >
      {options.map((type) => (
        <option key={type.id} value={type.id}>
          {questionEditTypeOptionLabel(type)}
        </option>
      ))}
    </select>
  );
}
