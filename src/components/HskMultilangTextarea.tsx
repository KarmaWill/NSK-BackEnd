import { LANG_OPTIONS, type LangKey, type TitleByLang } from '../config/languages';

type Props = {
  langTab: LangKey;
  onLangTabChange: (lang: LangKey) => void;
  valueByLang: TitleByLang;
  onChange: (lang: LangKey, value: string) => void;
  onAutoTranslate: () => void;
  placeholder?: string;
  rows?: number;
  fieldHint?: string;
};

export function HskMultilangTextarea({
  langTab,
  onLangTabChange,
  valueByLang,
  onChange,
  onAutoTranslate,
  placeholder,
  rows = 3,
  fieldHint,
}: Props) {
  const currentValue = valueByLang[langTab] ?? '';

  return (
    <div className="library-multilang-panel">
      <div className="library-multilang-toolbar">
        <div className="library-multilang-tabs">
          {LANG_OPTIONS.map((o) => (
            <button
              key={o.key}
              type="button"
              className={`btn btn-sm ${langTab === o.key ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => onLangTabChange(o.key)}
            >
              {o.key} {o.label}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onAutoTranslate}>
          自动翻译
        </button>
      </div>
      <textarea
        rows={rows}
        className="form-input hsk-multilang-textarea"
        value={currentValue}
        onChange={(e) => onChange(langTab, e.target.value)}
        placeholder={placeholder ?? `${LANG_OPTIONS.find((l) => l.key === langTab)?.label ?? langTab}`}
      />
      {fieldHint && <div className="form-hint">{fieldHint}</div>}
    </div>
  );
}
