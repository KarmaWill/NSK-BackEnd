import { PinyinCountInput } from './PinyinCountInput';
import { PinyinRubyText } from './PinyinRubyText';
import {
  EXPLANATION_PINYIN_TAB_META,
  LANG_OPTIONS,
  LANG_TAB_META,
  type ExplanationEditorTab,
  type LangKey,
  type TitleByLang,
} from '../config/languages';
import { countHanInText } from '../utils/pinyinUtils';

type Props = {
  langTab: ExplanationEditorTab;
  onLangTabChange: (tab: ExplanationEditorTab) => void;
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
  const cnText = valueByLang.CN ?? '';
  const isPinyinTab = langTab === 'PY';
  const currentLangTab = isPinyinTab ? 'CN' : langTab;
  const currentValue = valueByLang[currentLangTab] ?? '';
  const tabMeta = LANG_TAB_META[currentLangTab];
  const showRubyPreview = Boolean(explanationPinyin.trim() && cnText.trim());

  return (
    <div className="hsk-question-explanation-section">
      <div className="hsk-question-edit-section-head">
        <div className="hsk-question-edit-section-head-main">
          <span aria-hidden>📖</span>
          <h3>答案解析</h3>
        </div>
      </div>

      <div className="hsk-question-explanation-multilang">
        <div className="hsk-question-explanation-toolbar">
          <div className="hsk-question-explanation-tabs">
            {LANG_OPTIONS.filter((o) => o.key === 'CN').map((o) => {
              const meta = LANG_TAB_META[o.key];
              return (
                <button
                  key={o.key}
                  type="button"
                  className={`hsk-question-explanation-tab${langTab === o.key ? ' is-active' : ''}`}
                  onClick={() => onLangTabChange(o.key)}
                  aria-label={o.label}
                >
                  <span className="hsk-question-explanation-tab-flag" aria-hidden>
                    {meta.flag}
                  </span>
                  <span className="hsk-question-explanation-tab-code">{meta.code}</span>
                </button>
              );
            })}
            <button
              type="button"
              className={`hsk-question-explanation-tab hsk-question-explanation-tab-pinyin${isPinyinTab ? ' is-active' : ''}`}
              onClick={() => onLangTabChange('PY')}
              aria-label="拼音"
            >
              <span className="hsk-question-explanation-tab-flag" aria-hidden>
                {EXPLANATION_PINYIN_TAB_META.flag}
              </span>
              <span className="hsk-question-explanation-tab-code">
                {EXPLANATION_PINYIN_TAB_META.code}
              </span>
            </button>
            {LANG_OPTIONS.filter((o) => o.key !== 'CN').map((o) => {
              const meta = LANG_TAB_META[o.key];
              return (
                <button
                  key={o.key}
                  type="button"
                  className={`hsk-question-explanation-tab${langTab === o.key ? ' is-active' : ''}`}
                  onClick={() => onLangTabChange(o.key)}
                  aria-label={o.label}
                >
                  <span className="hsk-question-explanation-tab-flag" aria-hidden>
                    {meta.flag}
                  </span>
                  <span className="hsk-question-explanation-tab-code">{meta.code}</span>
                </button>
              );
            })}
          </div>
          {!isPinyinTab && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={onAutoTranslate}>
              自动翻译
            </button>
          )}
        </div>

        {isPinyinTab ? (
          <div className="hsk-question-explanation-pinyin-panel">
            <p className="hsk-question-explanation-pinyin-hint">
              对照 🇨🇳 CN 解析配置拼音；词级连写或字级分写均可。未配置时不显示拼音，自动翻译不会修改此处。
            </p>
            <PinyinCountInput
              value={explanationPinyin}
              onChange={onExplanationPinyinChange}
              targetHanCount={countHanInText(cnText)}
              targetText={cnText}
              placeholder="词级：péngyou hěn hǎo；字级：péng you hěn hǎo"
              className="form-input hsk-question-explanation-pinyin-input"
            />
            {showRubyPreview && (
              <div className="hsk-question-explanation-ruby-preview">
                <div className="hsk-question-explanation-ruby-preview-label">拼音预览</div>
                <PinyinRubyText text={cnText} pinyin={explanationPinyin} />
              </div>
            )}
          </div>
        ) : (
          <>
            <textarea
              rows={4}
              className="form-input hsk-question-explanation-textarea"
              value={currentValue}
              onChange={(e) => onChange(currentLangTab, e.target.value)}
              placeholder={`${tabMeta.flag}${tabMeta.code} 解析内容`}
            />
            {langTab === 'CN' && showRubyPreview && (
              <div className="hsk-question-explanation-ruby-preview">
                <div className="hsk-question-explanation-ruby-preview-label">拼音预览</div>
                <PinyinRubyText text={cnText} pinyin={explanationPinyin} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
