import { useCallback, useEffect, useRef, type ChangeEvent, type KeyboardEvent, type MouseEvent } from 'react';
import {
  applyRichArticleParagraphIndent,
  articleHtmlFromValue,
  insertPresetImageInSecondParagraph,
  normalizeRichArticleHtml,
  RICH_ARTICLE_INDENT_CLASS,
  sanitizeRichArticleHtml,
} from '../utils/hskRichArticleHtml';

type Props = {
  value: string;
  onChange: (next: string) => void;
  /** 切换题目时传入，用于重置编辑器内容 */
  remountKey?: string;
  presetImageUrl?: string;
  placeholder?: string;
  /** 段首空两格：开启后每段（含 Enter 新段）应用缩进 */
  paragraphIndent?: boolean;
  onParagraphIndentChange?: (enabled: boolean) => void;
};

function syncEditorParagraphIndent(el: HTMLElement, enabled: boolean) {
  el.querySelectorAll('p').forEach((paragraph) => {
    if (enabled) paragraph.classList.add(RICH_ARTICLE_INDENT_CLASS);
    else paragraph.classList.remove(RICH_ARTICLE_INDENT_CLASS);
  });
}

export function HskRichArticleEditor({
  value,
  onChange,
  remountKey = 'default',
  presetImageUrl = '',
  placeholder = '输入阅读理解的文章全文…',
  paragraphIndent = false,
  onParagraphIndentChange,
}: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevParagraphIndent = useRef(paragraphIndent);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    el.innerHTML = articleHtmlFromValue(value, paragraphIndent);
    syncEditorParagraphIndent(el, paragraphIndent);
    prevParagraphIndent.current = paragraphIndent;
  }, [remountKey]);

  useEffect(() => {
    if (prevParagraphIndent.current === paragraphIndent) return;
    prevParagraphIndent.current = paragraphIndent;
    const el = editorRef.current;
    if (!el) return;
    el.innerHTML = articleHtmlFromValue(value, paragraphIndent);
    syncEditorParagraphIndent(el, paragraphIndent);
  }, [paragraphIndent, value]);

  const syncFromEditor = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    syncEditorParagraphIndent(el, paragraphIndent);
    const raw = normalizeRichArticleHtml(el.innerHTML) ?? el.innerHTML;
    onChange(sanitizeRichArticleHtml(raw));
  }, [onChange, paragraphIndent]);

  const runCommand = (command: string, commandValue?: string) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    try {
      document.execCommand('styleWithCSS', false, 'false');
    } catch {
      /* ignore */
    }
    document.execCommand(command, false, commandValue);
    syncFromEditor();
  };

  const handleToolbarMouseDown = (event: MouseEvent, command: string) => {
    event.preventDefault();
    runCommand(command);
  };

  const insertHtml = (snippet: string) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    document.execCommand('insertHTML', false, snippet);
    syncFromEditor();
  };

  const handleImageFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file?.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const safe = reader.result.replace(/"/g, '&quot;');
      insertHtml(
        `<img src="${safe}" alt="${file.name.replace(/"/g, '&quot;')}" class="hsk-rich-article-inline-image" />`,
      );
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleInsertPresetImage = () => {
    if (!presetImageUrl.trim()) return;
    const next = insertPresetImageInSecondParagraph(value, presetImageUrl);
    const indented = applyRichArticleParagraphIndent(next, paragraphIndent);
    if (editorRef.current) {
      editorRef.current.innerHTML = articleHtmlFromValue(indented, paragraphIndent);
      syncEditorParagraphIndent(editorRef.current, paragraphIndent);
    }
    onChange(indented);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    document.execCommand('insertParagraph');
    const el = editorRef.current;
    if (el && paragraphIndent) {
      syncEditorParagraphIndent(el, true);
    }
    syncFromEditor();
  };

  const handleToggleParagraphIndent = () => {
    onParagraphIndentChange?.(!paragraphIndent);
  };

  return (
    <div className="hsk-rich-article-editor-wrap">
      <div className="hsk-rich-article-toolbar" role="toolbar" aria-label="文章格式">
        <button
          type="button"
          className={`hsk-rich-article-tool-btn${paragraphIndent ? ' is-active' : ''}`}
          title="段首空两格（Enter 换段自动应用）"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleToggleParagraphIndent}
          disabled={!onParagraphIndentChange}
        >
          段首空两格
        </button>
        <span className="hsk-rich-article-tool-divider" aria-hidden />
        <button
          type="button"
          className="hsk-rich-article-tool-btn"
          title="加粗"
          onMouseDown={(e) => handleToolbarMouseDown(e, 'bold')}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className="hsk-rich-article-tool-btn"
          title="斜体"
          onMouseDown={(e) => handleToolbarMouseDown(e, 'italic')}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className="hsk-rich-article-tool-btn"
          title="下划线"
          onMouseDown={(e) => handleToolbarMouseDown(e, 'underline')}
        >
          <span className="hsk-rich-article-tool-u">U</span>
        </button>
        <span className="hsk-rich-article-tool-divider" aria-hidden />
        <button
          type="button"
          className="hsk-rich-article-tool-btn"
          title="上传图片并插入光标处"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        >
          插图
        </button>
        <button
          type="button"
          className="hsk-rich-article-tool-btn hsk-rich-article-tool-btn--accent"
          title="将右侧预设题目图片插入到第二段"
          disabled={!presetImageUrl.trim()}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleInsertPresetImage}
        >
          预设图片
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageFile} />
      </div>
      <div
        ref={editorRef}
        className="hsk-rich-article-editor"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={syncFromEditor}
        onBlur={syncFromEditor}
        onKeyDown={handleKeyDown}
      />
      <p className="hsk-question-r02-block-hint hsk-rich-article-hint">
        Enter 换段
        {paragraphIndent ? ' · 已开启段首空两格' : ' · 可点「段首空两格」开启缩进'}
        {' · 「预设图片」插入到第二段'}
      </p>
    </div>
  );
}
