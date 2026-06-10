import { useEffect, useMemo, useState } from 'react';
import { getRegistryEntry } from '../config/hskQuestionTypeRegistry';
import type { HskQuestionRow, HskRuntimeOption, HskSubQuestionPayload } from '../types/hskExams';

type Props = {
  question: HskQuestionRow;
  open: boolean;
  onClose: () => void;
  onSave: (question: HskQuestionRow) => void;
};

function emptyOption(key: string): HskRuntimeOption {
  return { key, text: '', pinyin: '', image: '' };
}

export function HskQuestionPayloadEditor({ question, open, onClose, onSave }: Props) {
  const registry = useMemo(
    () => getRegistryEntry(question.type_id, !!question.payload?.subQuestions?.length),
    [question.type_id, question.payload?.subQuestions?.length],
  );
  const fields = registry?.editorFields ?? ['content', 'options', 'answer'];

  const [draft, setDraft] = useState(question);

  useEffect(() => {
    if (open) setDraft(structuredClone(question));
  }, [open, question]);

  if (!open) return null;

  const payload = draft.payload ?? {};
  const contentJson = JSON.stringify(payload.content ?? {}, null, 2);
  const options = payload.runtimeOptions ?? draft.options.map((o) => ({
    key: o.label,
    text: o.text,
    pinyin: o.pinyin,
    image: o.image,
  }));
  const subQuestions = payload.subQuestions ?? [];

  const updatePayload = (patch: Partial<typeof payload>) => {
    setDraft({
      ...draft,
      payload: { ...payload, ...patch },
      updatedAt: new Date().toISOString(),
    });
  };

  const save = () => {
    onSave({
      ...draft,
      audioStatus: draft.audioUrl || draft.payload?.audioUrl ? 'ready' : draft.audioStatus,
      imageStatus: options.some((o) => o.image) ? 'ready' : draft.imageStatus,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 720, width: '92vw', maxHeight: '90vh', overflow: 'auto' }}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>题目 Payload · {draft.question_uid}</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="form-label">renderKey</label>
            <input
              className="form-input"
              value={payload.renderKey ?? registry?.renderKey ?? draft.type_id}
              readOnly
            />
          </div>

          {fields.includes('content') && (
            <div>
              <label className="form-label">content (JSON)</label>
              <textarea
                className="form-input"
                rows={5}
                defaultValue={contentJson}
                onBlur={(e) => {
                  try {
                    updatePayload({ content: JSON.parse(e.target.value || '{}') });
                  } catch {
                    /* keep previous */
                  }
                }}
              />
            </div>
          )}

          {fields.includes('audio') && (
            <div>
              <label className="form-label">audioUrl</label>
              <input
                className="form-input"
                value={draft.payload?.audioUrl ?? draft.audioUrl ?? ''}
                onChange={(e) => {
                  setDraft({
                    ...draft,
                    audioUrl: e.target.value,
                    payload: { ...payload, audioUrl: e.target.value },
                  });
                }}
                placeholder="https://..."
              />
            </div>
          )}

          {fields.includes('options') && (
            <div>
              <label className="form-label">options</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {options.map((opt, idx) => (
                  <div key={opt.key} style={{ display: 'grid', gridTemplateColumns: '48px 1fr 1fr 1fr', gap: 8 }}>
                    <input className="form-input" value={opt.key} readOnly />
                    <input
                      className="form-input"
                      placeholder="text"
                      value={opt.text ?? ''}
                      onChange={(e) => {
                        const next = [...options];
                        next[idx] = { ...opt, text: e.target.value };
                        updatePayload({ runtimeOptions: next });
                      }}
                    />
                    <input
                      className="form-input"
                      placeholder="pinyin"
                      value={opt.pinyin ?? ''}
                      onChange={(e) => {
                        const next = [...options];
                        next[idx] = { ...opt, pinyin: e.target.value };
                        updatePayload({ runtimeOptions: next });
                      }}
                    />
                    <input
                      className="form-input"
                      placeholder="image URL / emoji"
                      value={opt.image ?? ''}
                      onChange={(e) => {
                        const next = [...options];
                        next[idx] = { ...opt, image: e.target.value };
                        updatePayload({ runtimeOptions: next });
                      }}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => updatePayload({ runtimeOptions: [...options, emptyOption(String.fromCharCode(65 + options.length))] })}
                >
                  + 添加选项
                </button>
              </div>
            </div>
          )}

          {fields.includes('subQuestions') && (
            <div>
              <label className="form-label">复合子题 subQuestions</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {subQuestions.map((sub, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '80px 80px 1fr', gap: 8 }}>
                    <input
                      className="form-input"
                      type="number"
                      value={sub.id ?? idx + 1}
                      onChange={(e) => {
                        const next: HskSubQuestionPayload[] = [...subQuestions];
                        next[idx] = { ...sub, id: Number(e.target.value) };
                        updatePayload({ subQuestions: next });
                      }}
                    />
                    <input
                      className="form-input"
                      value={sub.answer}
                      onChange={(e) => {
                        const next = [...subQuestions];
                        next[idx] = { ...sub, answer: e.target.value };
                        updatePayload({ subQuestions: next });
                      }}
                    />
                    <input
                      className="form-input"
                      type="number"
                      value={sub.score}
                      onChange={(e) => {
                        const next = [...subQuestions];
                        next[idx] = { ...sub, score: Number(e.target.value) };
                        updatePayload({ subQuestions: next });
                      }}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() =>
                    updatePayload({
                      subQuestions: [...subQuestions, { id: subQuestions.length + 1, answer: 'A', score: 5 }],
                    })
                  }
                >
                  + 添加子题
                </button>
              </div>
            </div>
          )}

          {fields.includes('answer') && (
            <div>
              <label className="form-label">correctAnswer</label>
              <input
                className="form-input"
                value={draft.correctAnswer}
                onChange={(e) => setDraft({ ...draft, correctAnswer: e.target.value })}
              />
            </div>
          )}
        </div>
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: 16 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>取消</button>
          <button type="button" className="btn btn-primary" onClick={save}>保存 Payload</button>
        </div>
      </div>
    </div>
  );
}
