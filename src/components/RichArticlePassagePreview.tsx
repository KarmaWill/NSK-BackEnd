import { useMemo } from 'react';
import { PinyinRubyText } from './PinyinRubyText';
import {
  articleHtmlFromValue,
  sanitizeRichArticleHtml,
  splitArticlePinyinByParagraph,
} from '../utils/hskRichArticleHtml';

type Props = {
  html: string;
  pinyin?: string;
  className?: string;
};

/** 富文本阅读段落：有拼音时按段 word-ruby，无拼音时保留 HTML 格式 */
export function RichArticlePassagePreview({ html, pinyin = '', className }: Props) {
  const blocks = useMemo(() => {
    const sanitized = sanitizeRichArticleHtml(html);
    const doc = new DOMParser().parseFromString(articleHtmlFromValue(sanitized), 'text/html');
    const pinyinByParagraph = pinyin.trim()
      ? splitArticlePinyinByParagraph(sanitized, pinyin)
      : [];
    let paragraphIndex = 0;

    return [...doc.body.childNodes]
      .map((node, index) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return null;
        const el = node as HTMLElement;

        if (el.tagName === 'P') {
          const plain = el.textContent ?? '';
          const indent = el.classList.contains('hsk-rich-article-indent')
            ? ' hsk-rich-article-indent'
            : '';
          const currentPinyin = pinyinByParagraph[paragraphIndex] ?? '';
          paragraphIndex += 1;
          const hasFormat = /<(strong|b|em|i|u)\b/i.test(el.innerHTML);

          if (currentPinyin.trim() && plain.trim() && !hasFormat) {
            return (
              <p key={`p-${index}`} className={indent.trim() || undefined}>
                <PinyinRubyText text={plain} pinyin={currentPinyin} className="" />
              </p>
            );
          }

          return (
            <p
              key={`p-${index}`}
              className={indent.trim() || undefined}
              dangerouslySetInnerHTML={{ __html: el.innerHTML }}
            />
          );
        }

        if (el.tagName === 'IMG') {
          return (
            <img
              key={`img-${index}`}
              src={el.getAttribute('src') ?? ''}
              alt={el.getAttribute('alt') ?? ''}
              className="hsk-rich-article-inline-image"
            />
          );
        }

        return null;
      })
      .filter(Boolean);
  }, [html, pinyin]);

  return <div className={className}>{blocks}</div>;
}
