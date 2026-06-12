import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  buildGroupedQuestionTypes,
  questionTypeSelectLabel,
} from '../config/hskQuestionTypeGroups';
import type { HskQuestionTypeCode, HskQuestionTypeDef } from '../types/hskExams';

type Props = {
  value: HskQuestionTypeCode | 'all';
  types: HskQuestionTypeDef[];
  onChange: (value: HskQuestionTypeCode | 'all') => void;
  includeAll?: boolean;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
};

export function HskQuestionTypeSelect({
  value,
  types,
  onChange,
  includeAll = true,
  disabled = false,
  className,
  ariaLabel = '题型',
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );

  const groups = useMemo(() => buildGroupedQuestionTypes(types), [types]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setMenuRect(null);
      return;
    }
    const rect = triggerRef.current.getBoundingClientRect();
    setMenuRect({
      top: rect.bottom + 6,
      left: rect.left,
      width: Math.max(rect.width, 280),
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onScroll = (event: Event) => {
      const target = event.target as Node | null;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const handleSelect = (next: HskQuestionTypeCode | 'all') => {
    onChange(next);
    setOpen(false);
  };

  const menu =
    open && menuRect
      ? createPortal(
          <div
            ref={menuRef}
            className="hsk-question-type-select-menu is-portal"
            role="listbox"
            aria-label={ariaLabel}
            style={{
              position: 'fixed',
              top: menuRect.top,
              left: menuRect.left,
              width: menuRect.width,
            }}
          >
            {includeAll && (
              <button
                type="button"
                role="option"
                aria-selected={value === 'all'}
                className={`hsk-question-type-select-option hsk-question-type-select-option-all${value === 'all' ? ' is-selected' : ''}`}
                onClick={() => handleSelect('all')}
              >
                <span className="hsk-question-type-select-check" aria-hidden>
                  {value === 'all' ? '✓' : ''}
                </span>
                <span>全部题型</span>
              </button>
            )}
            {groups.map((group) => (
              <div key={group.section} className="hsk-question-type-select-group">
                <div className="hsk-question-type-select-group-label" aria-hidden>
                  <span>{group.icon}</span>
                  <span>{group.groupLabel}</span>
                </div>
                {group.options.map((opt) => {
                  const selected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`hsk-question-type-select-option${selected ? ' is-selected' : ''}`}
                      onClick={() => handleSelect(opt.value)}
                    >
                      <span className="hsk-question-type-select-check" aria-hidden>
                        {selected ? '✓' : ''}
                      </span>
                      <span className="hsk-question-type-select-option-icon" aria-hidden>
                        {opt.icon}
                      </span>
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div
        ref={rootRef}
        className={`hsk-question-type-select${open ? ' is-open' : ''}${disabled ? ' is-disabled' : ''}${className ? ` ${className}` : ''}`}
      >
        <button
          ref={triggerRef}
          type="button"
          className="hsk-question-type-select-trigger"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => {
            if (!disabled) setOpen((prev) => !prev);
          }}
        >
          <span className="hsk-question-type-select-trigger-label">
            {questionTypeSelectLabel(value, types)}
          </span>
          <span className="hsk-question-type-select-chevron" aria-hidden>
            ▾
          </span>
        </button>
      </div>
      {menu}
    </>
  );
}
