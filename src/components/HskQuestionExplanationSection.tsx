import { LANG_OPTIONS, LANG_TAB_META, type LangKey, type TitleByLang } from '../config/languages';

type Props = {
  langTab: LangKey;
  onLangTabChange: (lang: LangKey) => void;
  valueByLang: TitleByLang;
  explanationPinyin: string;
  onChange: (lang: LangKey, value: string) => void;
  onExplanationPinyinChange: (value: string) => void;
  onAutoTranslate: () => void;
};

export function HskQuestionExplanationSection({
  langTab,
  onLangTabChange,
  valueByLang,
  explanationPinyin,
  onChange,
  onExplanationPinyinChange,
  onAutoTranslate,
}: Props) {
  const currentValue = valueByLang[langTab] ?? '';
  const tabMeta = LANG_TAB_META[langTab];

  return (
    <div className="hsk-question-explanation-section">
      <div className="hsk-question-edit-section-head">
        <div className="hsk-question-edit-section-head-main">
          <span aria-hidden>📖</span>
          <h3>答案解析</h3>
        </div>
      </div>

      <div className="form-group hsk-question-explanation-pinyin">
        <label>解析拼音（全局共享）</label>
        <input
          type="text"
          value={explanationPinyin}
          onChange={(e) => onExplanationPinyinChange(e.target.value)}
          placeholder="解析拼音，各语言版本共用"
        />
      </div>

      <div className="hsk-question-explanation-multilang">
        <div className="hsk-question-explanation-toolbar">
          <div className="hsk-question-explanation-tabs">
            {LANG_OPTIONS.map((o) => {
              const meta = LANG_TAB_META[o.key];
              return (
                <button
                  key={o.key}
                  type="button"
                  className={`hsk-question-explanation-tab${langTab === o.key ? ' is-active' : ''}`}
                  onClick={() => onLangTabChange(o.key)}
                >
                  <span className="hsk-question-explanation-tab-flag" aria-hidden>
                    {meta.flag}
                  </span>
                  <span className="hsk-question-explanation-tab-code">{meta.code}</span>
                  <span className="hsk-question-explanation-tab-label">{meta.label}</span>
                </button>
              );
            })}
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onAutoTranslate}>
            自动翻译
          </button>
        </div>

        <textarea
          rows={4}
          className="form-input hsk-question-explanation-textarea"
          value={currentValue}
          onChange={(e) => onChange(langTab, e.target.value)}
          placeholder={`${tabMeta.flag} ${tabMeta.code} ${tabMeta.label}`}
        />
      </div>
    </div>
  );
}
