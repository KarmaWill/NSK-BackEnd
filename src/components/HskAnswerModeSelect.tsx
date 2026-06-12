import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  GROUPED_ANSWER_MODE_OPTIONS,
  uiModeLabel,
  type UiAnswerModeId,
} from '../config/hskTypeEditConfig';

type Props = {
  value: UiAnswerModeId;
  disabled?: boolean;
  onChange: (value: UiAnswerModeId) => void;
};

export function HskAnswerModeSelect({ value, disabled = false, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setMenuRect(null);
      return;
    }
    const rect = triggerRef.current.getBoundingClientRect();
    setMenuRect({
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
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

  const handleSelect = (mode: UiAnswerModeId) => {
    onChange(mode);
    setOpen(false);
  };

  const menu =
    open && menuRect
      ? createPortal(
          <div
            ref={menuRef}
            className="hsk-answer-mode-select-menu is-portal"
            role="listbox"
            aria-label="作答模式"
            style={{
              position: 'fixed',
              top: menuRect.top,
              left: menuRect.left,
              width: menuRect.width,
            }}
          >
            {GROUPED_ANSWER_MODE_OPTIONS.map((group) => (
              <div key={group.group} className="hsk-answer-mode-select-group">
                <div className="hsk-answer-mode-select-group-label" aria-hidden>
                  <span className="hsk-answer-mode-select-group-line" />
                  <span>{group.group}</span>
                  <span className="hsk-answer-mode-select-group-line" />
                </div>
                {group.modes.map((mode) => {
                  const selected = mode.value === value;
                  return (
                    <button
                      key={mode.value}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`hsk-answer-mode-select-option${selected ? ' is-selected' : ''}`}
                      onClick={() => handleSelect(mode.value)}
                    >
                      <span className="hsk-answer-mode-select-check" aria-hidden>
                        {selected ? '✓' : ''}
                      </span>
                      <span>{mode.label}</span>
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
        className={`hsk-answer-mode-select${open ? ' is-open' : ''}${disabled ? ' is-disabled' : ''}`}
      >
        <button
          ref={triggerRef}
          type="button"
          className="hsk-answer-mode-select-trigger"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => {
            if (!disabled) setOpen((prev) => !prev);
          }}
        >
          <span className="hsk-answer-mode-select-trigger-label">{uiModeLabel(value)}</span>
          <span className="hsk-answer-mode-select-chevron" aria-hidden>
            ▾
          </span>
        </button>
      </div>
      {menu}
    </>
  );
}
