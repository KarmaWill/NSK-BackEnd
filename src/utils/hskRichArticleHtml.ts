import { countHanInText, splitPinyinWord } from './pinyinUtils';

/** 将纯文本转为段落 HTML；首段带缩进类名 */
export function plainTextToRichArticleHtml(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '<p class="hsk-rich-article-indent"><br></p>';

  const blocks = trimmed
    .split(/\n{2,}/)
    .map((block) => block.replace(/\n/g, '<br>'))
    .filter(Boolean);

  if (blocks.length === 0) return '<p class="hsk-rich-article-indent"><br></p>';

  return blocks
    .map((block, idx) => {
      const cls = idx === 0 ? ' class="hsk-rich-article-indent"' : '';
      return `<p${cls}>${block || '<br>'}</p>`;
    })
    .join('');
}

export function looksLikeRichArticleHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

export function articleHtmlFromValue(value: string): string {
  if (!value?.trim()) return '<p class="hsk-rich-article-indent"><br></p>';
  if (looksLikeRichArticleHtml(value)) return value;
  return plainTextToRichArticleHtml(value);
}

export function normalizeRichArticleHtml(html: string): string {
  const trimmed = html
    .replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '')
    .replace(/^<br\s*\/?>$/i, '')
    .trim();
  if (!trimmed) return '';
  return trimmed;
}

export function stripRichArticleHtml(value: string): string {
  if (!value?.trim()) return '';
  if (typeof document === 'undefined') {
    return value
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  const doc = new DOMParser().parseFromString(articleHtmlFromValue(value), 'text/html');
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}

export function countHanInRichArticle(value: string): number {
  return countHanInText(stripRichArticleHtml(value));
}

const ALLOWED_TAGS = new Set(['P', 'STRONG', 'B', 'EM', 'I', 'U', 'BR', 'IMG', 'SPAN']);

function convertStyleSpan(el: HTMLElement, doc: Document): HTMLElement | null {
  if (el.tagName !== 'SPAN') return null;
  const style = (el.getAttribute('style') ?? '').toLowerCase();
  let tag: string | null = null;
  if (/font-weight:\s*(bold|[7-9]00)/.test(style)) tag = 'strong';
  else if (/font-style:\s*italic/.test(style)) tag = 'em';
  else if (/text-decoration.*underline/.test(style)) tag = 'u';
  if (!tag) return null;
  const next = doc.createElement(tag);
  while (el.firstChild) next.appendChild(el.firstChild);
  return next;
}

export function sanitizeRichArticleHtml(html: string): string {
  if (typeof document === 'undefined') return html;
  const doc = new DOMParser().parseFromString(articleHtmlFromValue(html), 'text/html');

  const walk = (node: Node) => {
    const children = [...node.childNodes];
    for (const child of children) {
      if (child.nodeType === Node.TEXT_NODE) continue;
      if (child.nodeType !== Node.ELEMENT_NODE) {
        child.parentNode?.removeChild(child);
        continue;
      }
      let el = child as HTMLElement;

      const converted = convertStyleSpan(el, doc);
      if (converted) {
        el.parentNode?.replaceChild(converted, el);
        el = converted;
      }

      if (!ALLOWED_TAGS.has(el.tagName)) {
        while (el.firstChild) el.parentNode?.insertBefore(el.firstChild, el);
        el.parentNode?.removeChild(el);
        continue;
      }
      [...el.attributes].forEach((attr) => {
        if (el.tagName === 'IMG' && (attr.name === 'src' || attr.name === 'alt' || attr.name === 'class')) {
          return;
        }
        if (attr.name === 'class' && el.tagName === 'P' && el.className.includes('hsk-rich-article-indent')) {
          return;
        }
        el.removeAttribute(attr.name);
      });
      walk(el);
    }
  };

  walk(doc.body);
  return normalizeRichArticleHtml(doc.body.innerHTML) || doc.body.innerHTML;
}

/** 按段落汉字数，将整段拼音词切分给各 <p> */
export function splitArticlePinyinByParagraph(html: string, pinyinInput: string): string[] {
  if (typeof document === 'undefined') return [];
  const doc = new DOMParser().parseFromString(articleHtmlFromValue(html), 'text/html');
  const paragraphs = [...doc.body.querySelectorAll('p')];
  const pinyinWords = pinyinInput?.trim() ? pinyinInput.trim().split(/\s+/).filter(Boolean) : [];
  if (!pinyinWords.length || !paragraphs.length) return paragraphs.map(() => '');

  const wordCharCounts = pinyinWords.map((w) => splitPinyinWord(w).length);
  const result: string[] = [];
  let wordIdx = 0;

  for (const paragraph of paragraphs) {
    const need = countHanInText(paragraph.textContent ?? '');
    if (need <= 0) {
      result.push('');
      continue;
    }
    const words: string[] = [];
    let got = 0;
    while (got < need && wordIdx < pinyinWords.length) {
      words.push(pinyinWords[wordIdx]);
      got += wordCharCounts[wordIdx];
      wordIdx += 1;
    }
    result.push(words.join(' '));
  }

  return result;
}

/** 将预设题目图片插入到第二段（无第二段则自动创建） */
export function insertPresetImageInSecondParagraph(html: string, imageUrl: string): string {
  if (!imageUrl.trim()) return html;
  if (typeof document === 'undefined') return html;

  const doc = new DOMParser().parseFromString(articleHtmlFromValue(html), 'text/html');
  const body = doc.body;
  let paragraphs = [...body.querySelectorAll('p')];

  if (paragraphs.length === 0) {
    body.innerHTML =
      '<p class="hsk-rich-article-indent"><br></p><p><br></p>';
    paragraphs = [...body.querySelectorAll('p')];
  } else if (paragraphs.length === 1) {
    const second = doc.createElement('p');
    second.innerHTML = '<br>';
    body.appendChild(second);
    paragraphs = [...body.querySelectorAll('p')];
  }

  const second = paragraphs[1];
  const safeUrl = imageUrl.replace(/"/g, '&quot;');
  second.innerHTML = `<img src="${safeUrl}" alt="阅读配图" class="hsk-rich-article-inline-image" />`;
  return sanitizeRichArticleHtml(body.innerHTML);
}

export function ensureFirstParagraphIndent(html: string): string {
  if (typeof document === 'undefined') return html;
  const doc = new DOMParser().parseFromString(articleHtmlFromValue(html), 'text/html');
  const first = doc.body.querySelector('p');
  if (first) first.classList.add('hsk-rich-article-indent');
  return sanitizeRichArticleHtml(doc.body.innerHTML);
}
