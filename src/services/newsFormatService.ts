import { apiFetch } from '../lib/api';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isLikelyHeading(line: string) {
  if (line.length > 80) return false;
  if (/[.!?。！？]$/.test(line)) return false;
  if (/^[-•*>#\d]/.test(line)) return false;
  return line.length <= 60;
}

function formatLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed) return '';

  if (/^>\s?/.test(trimmed)) {
    return `<blockquote>${escapeHtml(trimmed.replace(/^>\s?/, ''))}</blockquote>`;
  }
  if (/^[-•*]\s+/.test(trimmed)) {
    return `<ul><li>${escapeHtml(trimmed.replace(/^[-•*]\s+/, ''))}</li></ul>`;
  }
  if (isLikelyHeading(trimmed)) {
    return `<h2>${escapeHtml(trimmed)}</h2>`;
  }
  return `<p>${escapeHtml(trimmed)}</p>`;
}

/** 规则排版：空行分段 + 短行标题 + 列表/引用识别 */
export function formatNewsBodyLocal(raw: string): string {
  const text = raw.replace(/\r\n/g, '\n').trim();
  if (!text) return '';

  const blocks = text.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

  return blocks
    .map((block) => {
      const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
      if (!lines.length) return '';

      if (lines.every((line) => /^[-•*]\s+/.test(line))) {
        return `<ul>${lines
          .map((line) => `<li>${escapeHtml(line.replace(/^[-•*]\s+/, ''))}</li>`)
          .join('')}</ul>`;
      }

      if (lines.length === 1) return formatLine(lines[0]);

      return lines.map((line) => formatLine(line)).join('\n');
    })
    .filter(Boolean)
    .join('\n');
}

export type NewsFormatResult = {
  html: string;
  source: 'ai' | 'local';
};

/** AI 排版：调用后端；失败或未配置时回退规则排版 */
export async function formatNewsBodyWithAi(raw: string): Promise<NewsFormatResult> {
  try {
    const data = await apiFetch<{ html?: string }>('/api/cms/news/format-body', {
      method: 'POST',
      body: JSON.stringify({ text: raw }),
    });
    const html = data.html?.trim();
    if (html) return { html, source: 'ai' };
  } catch {
    /* API 未就绪，回退本地规则 */
  }
  return { html: formatNewsBodyLocal(raw), source: 'local' };
}

export function isNewsAiFormatEnabled() {
  return import.meta.env.VITE_NEWS_AI_FORMAT === '1';
}
