import { useCallback, useEffect, useRef, type ChangeEvent, type KeyboardEvent, type MouseEvent } from 'react';
import {
  articleHtmlFromValue,
  insertPresetImageInSecondParagraph,
  normalizeRichArticleHtml,
  sanitizeRichArticleHtml,
} from '../utils/hskRichArticleHtml';

type Props = {
  value: string;
  onChange: (next: string) => void;
  /** 切换题目时传入，用于重置编辑器内容 */
  remountKey?: string;
  presetImageUrl?: string;
  placeholder?: string;
};

export function HskRichArticleEditor({
  value,
  onChange,
  remountKey = 'default',
  presetImageUrl = '',
  placeholder = '输入阅读理解的文章全文…',
}: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    el.innerHTML = articleHtmlFromValue(value);
    el.querySelector('p')?.classList.add('hsk-rich-article-indent');
  }, [remountKey]);

  const syncFromEditor = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    el.querySelector('p')?.classList.add('hsk-rich-article-indent');
    const raw = normalizeRichArticleHtml(el.innerHTML) ?? el.innerHTML;
    onChange(sanitizeRichArticleHtml(raw));
  }, [onChange]);

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
    if (editorRef.current) {
      editorRef.current.innerHTML = articleHtmlFromValue(next);
      editorRef.current.querySelector('p')?.classList.add('hsk-rich-article-indent');
    }
    onChange(next);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    document.execCommand('insertParagraph');
    syncFromEditor();
  };

  return (
    <div className="hsk-rich-article-editor-wrap">
      <div className="hsk-rich-article-toolbar" role="toolbar" aria-label="文章格式">
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
        Enter 换段 · 首段自动空两字 · 「预设图片」插入到第二段
      </p>
    </div>
  );
}
