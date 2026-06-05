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
  canDeleteOption?: (value: string) => boolean;
  onDeleteOption?: (value: string) => void;
  deleteConfirmHint?: (label: string) => ReactNode;
  disabled?: boolean;
  style?: CSSProperties;
};

function OptionRow({
  opt,
  selected,
  canDelete,
  onPick,
  onDeleteClick,
}: {
  opt: InlineAddSelectOption;
  selected: boolean;
  canDelete: boolean;
  onPick: () => void;
  onDeleteClick: () => void;
}) {
  return (
    <div className={`library-inline-select-option-row${selected ? ' is-selected' : ''}`}>
      <button
        type="button"
        role="option"
        aria-selected={selected}
        className={`library-inline-select-option${selected ? ' is-selected' : ''}`}
        onClick={onPick}
      >
        {opt.label}
      </button>
      {canDelete && (
        <button
          type="button"
          className="library-inline-select-option-delete"
          aria-label={`删除 ${opt.label}`}
          title="删除"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick();
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

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
  canDeleteOption,
  onDeleteOption,
  deleteConfirmHint,
  disabled,
  style,
}: LibraryInlineAddSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const deleteInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [addInput, setAddInput] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<InlineAddSelectOption | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

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
        setDeleteTarget(null);
        setDeleteConfirmText('');
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

  useEffect(() => {
    if (deleteTarget && deleteInputRef.current) {
      deleteInputRef.current.focus();
    }
  }, [deleteTarget]);

  const closePanel = () => {
    setOpen(false);
    setAddMode(false);
    setAddInput('');
    setDeleteTarget(null);
    setDeleteConfirmText('');
  };

  const openAddMode = () => {
    if (!onAdd) return;
    setDeleteTarget(null);
    setDeleteConfirmText('');
    setAddMode(true);
    setAddInput('');
  };

  const cancelAdd = () => {
    setAddMode(false);
    setAddInput('');
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
    setDeleteConfirmText('');
  };

  const confirmAdd = () => {
    if (!onAdd) return;
    const next = sanitizeAdd ? sanitizeAdd(addInput) : addInput.trim();
    if (!next) return;
    if (canConfirmAdd && !canConfirmAdd(next)) return;
    onAdd(next);
    closePanel();
  };

  const confirmDelete = () => {
    if (!deleteTarget || !onDeleteOption) return;
    if (deleteConfirmText !== deleteTarget.label) return;
    onDeleteOption(deleteTarget.value);
    closePanel();
  };

  const handlePick = (picked: string) => {
    onSelect(picked);
    closePanel();
  };

  const openDeleteConfirm = (opt: InlineAddSelectOption) => {
    setAddMode(false);
    setAddInput('');
    setDeleteTarget(opt);
    setDeleteConfirmText('');
  };

  const canDelete = (opt: InlineAddSelectOption) =>
    !!onDeleteOption && !!canDeleteOption?.(opt.value);

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
          if (open && deleteTarget) {
            cancelDelete();
            return;
          }
          setOpen((prev) => !prev);
          if (!open) {
            setAddMode(false);
            setDeleteTarget(null);
            setDeleteConfirmText('');
          }
        }}
      >
        <span className={value ? 'library-inline-select-value' : 'library-inline-select-placeholder'}>
          {value ? selectedLabel || value : placeholder}
        </span>
        <span className="library-inline-select-chevron" aria-hidden />
      </button>

      {open && (
        <div className="library-inline-select-panel" id={listId} role="listbox">
          {deleteTarget ? (
            <div className="library-inline-select-delete-panel">
              <div className="library-inline-select-delete-title">确认删除</div>
              <p className="library-inline-select-delete-hint">
                {deleteConfirmHint ? (
                  deleteConfirmHint(deleteTarget.label)
                ) : (
                  <>请输入 <strong>{deleteTarget.label}</strong> 以确认删除，此操作不可恢复。</>
                )}
              </p>
              <input
                ref={deleteInputRef}
                type="text"
                className="form-input"
                placeholder={deleteTarget.label}
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && deleteConfirmText === deleteTarget.label) {
                    e.preventDefault();
                    confirmDelete();
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelDelete();
                  }
                }}
              />
              <div className="library-inline-select-delete-actions">
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  disabled={deleteConfirmText !== deleteTarget.label}
                  onClick={confirmDelete}
                >
                  确认删除
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={cancelDelete}>
                  取消
                </button>
              </div>
            </div>
          ) : addMode ? (
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
                      <OptionRow
                        key={opt.value}
                        opt={opt}
                        selected={value === opt.value}
                        canDelete={canDelete(opt)}
                        onPick={() => handlePick(opt.value)}
                        onDeleteClick={() => openDeleteConfirm(opt)}
                      />
                    ))}
                  </div>
                ))}
                {!groups &&
                  (options ?? []).map((opt) => (
                    <OptionRow
                      key={opt.value}
                      opt={opt}
                      selected={value === opt.value}
                      canDelete={canDelete(opt)}
                      onPick={() => handlePick(opt.value)}
                      onDeleteClick={() => openDeleteConfirm(opt)}
                    />
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
