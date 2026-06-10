import { useState } from 'react';
import { analyzeExamPdfText, extractTextFromPdfFile } from '../services/hskExamAnalyze';
import type { HskExamAnalyzeResult } from '../types/hskExams';

type Props = {
  open: boolean;
  existingTypeCodes: string[];
  onClose: () => void;
  onImported: (result: HskExamAnalyzeResult) => void;
};

export function HskImportWizard({ open, existingTypeCodes, onClose, onImported }: Props) {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<HskExamAnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleFile = async (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('请上传 PDF 文件');
      return;
    }
    setError(null);
    setPreview(null);
    setFileName(file.name);
    setLoading(true);
    try {
      const text = await extractTextFromPdfFile(file);
      const result = await analyzeExamPdfText(text, existingTypeCodes, { useMock: true });
      setPreview(result);
    } catch {
      setError('解析失败，请重新上传');
    } finally {
      setLoading(false);
    }
  };

  const confirmImport = () => {
    if (!preview) return;
    onImported(preview);
    setPreview(null);
    setFileName('');
    onClose();
  };

  return (
    <div className="modal-overlay open" onClick={onClose} role="dialog" aria-modal="true" aria-label="智能导入">
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <div className="modal-title">智能导入</div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">✕</button>
        </div>
        <div className="modal-body">
          <div
            className={`library-catalog-import-dropzone${loading ? ' is-loading' : ''}${preview ? ' is-ready' : ''}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void handleFile(e.dataTransfer.files?.[0]);
            }}
          >
            {loading ? (
              <div className="library-catalog-import-loading">
                <span className="library-catalog-import-spinner" aria-hidden />
                <div>正在解析 PDF…</div>
              </div>
            ) : preview ? (
              <>
                <div className="library-catalog-import-drop-title">
                  解析完成 · {preview.examMeta.title} · {preview.examMeta.level}
                </div>
                <div className="form-hint">{fileName}</div>
                <div className="form-hint" style={{ marginTop: 8 }}>
                  识别 {preview.sections.length} 个部分，共 {preview.sections.reduce((s, x) => s + x.questionCount, 0)} 题
                </div>
              </>
            ) : (
              <>
                <div className="library-catalog-import-drop-icon" aria-hidden>↑</div>
                <div className="library-catalog-import-drop-title">拖拽 PDF 或点击选择</div>
                <div className="form-hint">支持文字版 PDF · 最大 50MB</div>
                <input
                  type="file"
                  accept=".pdf"
                  style={{ marginTop: 12 }}
                  onChange={(e) => void handleFile(e.target.files?.[0])}
                />
              </>
            )}
          </div>
          {error && <div className="form-hint" style={{ color: 'var(--rose)' }}>{error}</div>}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>取消</button>
          <button type="button" className="btn btn-primary btn-sm" disabled={!preview || loading} onClick={confirmImport}>
            导入为模板
          </button>
        </div>
      </div>
    </div>
  );
}
