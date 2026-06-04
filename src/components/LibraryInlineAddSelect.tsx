import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';

export type InlineAddSelectOption = {
  value: string;
  label: string;
};

export type InlineAddSelectGroup = {
  label: string;
  options: InlineAddSelectOption[];
};

type LibraryInlineAddSelectProps = {
  value: string;
  placeholder?: string;
  options?: InlineAddSelectOption[];
  groups?: InlineAddSelectGroup[];
  addLabel?: string;
  addPlaceholder?: string;
  onSelect: (value: string) => void;
  onAdd?: (value: string) => void;
  canConfirmAdd?: (value: string) => boolean;
  sanitizeAdd?: (value: string) => string;
  maxLength?: number;
  addHint?: ReactNode;
  renderAddExtras?: () => ReactNode;
  disabled?: boolean;
  style?: CSSProperties;
};

export function LibraryInlineAddSelect({
  value,
  placeholder = '请选择',
  options,
  groups,
  addLabel = '+ 新建',
  addPlaceholder = '输入名称',
  onSelect,
  onAdd,
  canConfirmAdd,
  sanitizeAdd,
  maxLength,
  addHint,
  renderAddExtras,
  disabled,
  style,
}: LibraryInlineAddSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [addInput, setAddInput] = useState('');

  const flatOptions = groups
    ? groups.flatMap((g) => g.options)
    : (options ?? []);

  const selectedLabel = flatOptions.find((o) => o.value === value)?.label ?? '';

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setAddMode(false);
        setAddInput('');
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  useEffect(() => {
    if (addMode && addInputRef.current) {
      addInputRef.current.focus();
    }
  }, [addMode]);

  const closePanel = () => {
    setOpen(false);
    setAddMode(false);
    setAddInput('');
  };

  const openAddMode = () => {
    if (!onAdd) return;
    setAddMode(true);
    setAddInput('');
  };

  const cancelAdd = () => {
    setAddMode(false);
    setAddInput('');
  };

  const confirmAdd = () => {
    if (!onAdd) return;
    const next = sanitizeAdd ? sanitizeAdd(addInput) : addInput.trim();
    if (!next) return;
    if (canConfirmAdd && !canConfirmAdd(next)) return;
    onAdd(next);
    closePanel();
  };

  const handlePick = (picked: string) => {
    onSelect(picked);
    closePanel();
  };

  return (
    <div
      ref={rootRef}
      className={`library-inline-select${open ? ' is-open' : ''}${disabled ? ' is-disabled' : ''}`}
      style={style}
    >
      <button
        type="button"
        className="library-inline-select-trigger form-input form-select"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          if (disabled) return;
          if (open && addMode) {
            cancelAdd();
            return;
          }
          setOpen((prev) => !prev);
          if (!open) setAddMode(false);
        }}
      >
        <span className={value ? 'library-inline-select-value' : 'library-inline-select-placeholder'}>
          {value ? selectedLabel || value : placeholder}
        </span>
        <span className="library-inline-select-chevron" aria-hidden />
      </button>

      {open && (
        <div className="library-inline-select-panel" id={listId} role="listbox">
          {addMode ? (
            <div className="library-inline-select-add-panel">
              {renderAddExtras?.()}
              <input
                ref={addInputRef}
                type="text"
                className="form-input library-inline-select-add-input"
                placeholder={addPlaceholder}
                value={addInput}
                maxLength={maxLength}
                onChange={(e) => {
                  const raw = e.target.value;
                  setAddInput(sanitizeAdd ? sanitizeAdd(raw) : raw);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    confirmAdd();
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelAdd();
                  }
                }}
              />
              {addHint && <div className="form-hint library-inline-select-add-hint">{addHint}</div>}
              <div className="library-inline-select-add-actions">
                <button type="button" className="btn btn-primary btn-sm" onClick={confirmAdd}>
                  确认
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={cancelAdd}>
                  取消
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="library-inline-select-list">
                {groups?.map((group) => (
                  <div key={group.label} className="library-inline-select-group">
                    <div className="library-inline-select-group-label">{group.label}</div>
                    {group.options.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        role="option"
                        aria-selected={value === opt.value}
                        className={`library-inline-select-option${value === opt.value ? ' is-selected' : ''}`}
                        onClick={() => handlePick(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                ))}
                {!groups &&
                  (options ?? []).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={value === opt.value}
                      className={`library-inline-select-option${value === opt.value ? ' is-selected' : ''}`}
                      onClick={() => handlePick(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
              </div>
              {onAdd && (
                <>
                  <div className="library-inline-select-divider" />
                  <button type="button" className="library-inline-select-add-trigger" onClick={openAddMode}>
                    {addLabel}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
