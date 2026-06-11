import { useEffect, useMemo, useState } from 'react';
import { HSK_DEFAULT_TAG_LABELS } from '../config/hskQuestionTags';
import type { HskQuestionRow, HskQuestionTag } from '../types/hskExams';

function countQuestionsForTag(tag: HskQuestionTag, questions: HskQuestionRow[]): number {
  return questions.filter((q) => q.tags.includes(tag.label)).length;
}

type Props = {
  tags: HskQuestionTag[];
  questions: HskQuestionRow[];
  onTagsChange: (nextTags: HskQuestionTag[], nextQuestions: HskQuestionRow[]) => void;
  onToast: (message: string) => void;
  onNavigateToTag?: (tagLabel: string) => void;
};

export function HskTagManager({ tags, questions, onTagsChange, onToast, onNavigateToTag }: Props) {
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNameInput, setNewNameInput] = useState('');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ tag: HskQuestionTag; count: number } | null>(
    null,
  );

  useEffect(() => {
    if (!showCreateModal) return;
    const timer = window.setTimeout(() => {
      document.getElementById('hsk-tag-create-input')?.focus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [showCreateModal]);

  const sortedTags = useMemo(() => {
    const order = new Map(HSK_DEFAULT_TAG_LABELS.map((label, index) => [label, index]));
    return [...tags].sort((a, b) => {
      const ai = order.get(a.label as (typeof HSK_DEFAULT_TAG_LABELS)[number]) ?? 999;
      const bi = order.get(b.label as (typeof HSK_DEFAULT_TAG_LABELS)[number]) ?? 999;
      if (ai !== bi) return ai - bi;
      return a.label.localeCompare(b.label, 'zh-CN');
    });
  }, [tags]);

  const filteredTags = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sortedTags;
    return sortedTags.filter(
      (tag) =>
        tag.label.toLowerCase().includes(q) ||
        tag.description?.toLowerCase().includes(q),
    );
  }, [search, sortedTags]);

  const builtinCount = 0;
  const customCount = tags.length;

  const openCreateModal = () => {
    setNewNameInput('');
    setShowCreateModal(true);
  };

  const handleAddTag = () => {
    const label = newNameInput.trim();
    if (!label) return;
    if (tags.some((t) => t.label === label)) {
      onToast('标签名称已存在');
      return;
    }
    const next = [...tags, { id: `tag-${Date.now()}`, label }];
    onTagsChange(next, questions);
    setShowCreateModal(false);
    setNewNameInput('');
    onToast(`已添加标签 ${label}`);
  };

  const handleStartEdit = (tag: HskQuestionTag) => {
    setEditingTagId(tag.id);
    setEditValue(tag.label);
  };

  const handleSaveEdit = () => {
    if (!editingTagId || !editValue.trim()) return;
    const tag = tags.find((t) => t.id === editingTagId);
    if (!tag) return;
    const newLabel = editValue.trim();
    if (newLabel === tag.label) {
      setEditingTagId(null);
      return;
    }
    if (tags.some((t) => t.id !== tag.id && t.label === newLabel)) {
      onToast('标签名称已存在');
      return;
    }
    const nextTags = tags.map((t) => (t.id === tag.id ? { ...t, label: newLabel } : t));
    const nextQuestions = questions.map((q) => ({
      ...q,
      tags: q.tags.map((t) => (t === tag.label ? newLabel : t)),
    }));
    onTagsChange(nextTags, nextQuestions);
    setEditingTagId(null);
    onToast(`已更新标签 ${newLabel}`);
  };

  const confirmDeleteTag = () => {
    if (!deleteConfirm) return;
    const { tag } = deleteConfirm;
    const nextTags = tags.filter((t) => t.id !== tag.id);
    const nextQuestions = questions.map((q) => ({
      ...q,
      tags: q.tags.filter((t) => t !== tag.label),
    }));
    onTagsChange(nextTags, nextQuestions);
    setDeleteConfirm(null);
    onToast(`已删除标签 ${tag.label}`);
  };

  const handleNavigateToQuestions = (tag: HskQuestionTag, count: number) => {
    if (count > 0 && onNavigateToTag) {
      onNavigateToTag(tag.label);
    }
  };

  return (
    <div className="hsk-tag-mgmt">
      <div className="hsk-tag-mgmt-header">
        <div className="hsk-tag-mgmt-header-main">
          <h2 className="hsk-tag-mgmt-title">标签管理</h2>
          <p className="hsk-tag-mgmt-stats">
            共 {tags.length} 个标签 · {builtinCount} 个内置 · {customCount} 个自定义
          </p>
        </div>
        <div className="hsk-tag-mgmt-header-actions">
          <input
            type="search"
            className="hsk-tag-mgmt-search"
            placeholder="搜索标签..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="button" className="hsk-tag-create-btn" onClick={openCreateModal}>
            + 新建标签
          </button>
        </div>
      </div>

      <div className="hsk-tag-mgmt-body">
        <div className="hsk-tag-table-card">
          <table className="hsk-tag-table">
            <thead>
              <tr>
                <th>标签名称</th>
                <th>关联题目数</th>
                <th className="col-actions">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredTags.map((tag) => {
                const linkedCount = countQuestionsForTag(tag, questions);
                const isEditing = editingTagId === tag.id;
                return (
                  <tr key={tag.id}>
                    <td>
                      {isEditing ? (
                        <div className="hsk-tag-inline-edit">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveEdit();
                              }
                              if (e.key === 'Escape') {
                                setEditingTagId(null);
                              }
                            }}
                            className="hsk-tag-inline-input"
                            autoFocus
                          />
                          <button type="button" className="hsk-tag-inline-save" onClick={handleSaveEdit}>
                            保存
                          </button>
                          <button
                            type="button"
                            className="hsk-tag-inline-cancel"
                            onClick={() => setEditingTagId(null)}
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <span className="hsk-tag-badge">{tag.label}</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`hsk-tag-count${linkedCount > 0 ? ' is-link' : ''}`}
                        onClick={() => handleNavigateToQuestions(tag, linkedCount)}
                        disabled={linkedCount === 0 || !onNavigateToTag}
                      >
                        {linkedCount} 道题
                      </button>
                    </td>
                    <td>
                      <div className="hsk-tag-row-actions">
                        <button
                          type="button"
                          className="hsk-tag-action"
                          onClick={() => handleStartEdit(tag)}
                          disabled={isEditing}
                        >
                          编辑
                        </button>
                        <button
                          type="button"
                          className="hsk-tag-action hsk-tag-action-danger"
                          onClick={() => setDeleteConfirm({ tag, count: linkedCount })}
                          disabled={isEditing}
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredTags.length === 0 && (
            <div className="hsk-tag-empty">
              <p>{search.trim() ? '暂无匹配的标签' : '暂无标签'}</p>
              <p className="hsk-tag-empty-hint">在上方添加新标签</p>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div
          className="hsk-tag-modal-overlay"
          onClick={() => setShowCreateModal(false)}
          role="presentation"
        >
          <div
            className="hsk-tag-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="hsk-tag-create-title"
          >
            <h3 id="hsk-tag-create-title" className="hsk-tag-modal-title">
              新建标签
            </h3>
            <div className="hsk-tag-modal-field">
              <label htmlFor="hsk-tag-create-input">标签名称</label>
              <input
                id="hsk-tag-create-input"
                type="text"
                value={newNameInput}
                onChange={(e) => setNewNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="输入标签名称"
              />
            </div>
            <div className="hsk-tag-modal-actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCreateModal(false)}>
                取消
              </button>
              <button type="button" className="hsk-tag-modal-confirm" onClick={handleAddTag}>
                确认创建
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div
          className="hsk-tag-modal-overlay"
          onClick={() => setDeleteConfirm(null)}
          role="presentation"
        >
          <div
            className="hsk-tag-modal hsk-tag-modal-md"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="hsk-tag-delete-title"
          >
            <h3 id="hsk-tag-delete-title" className="hsk-tag-modal-title">
              删除标签「{deleteConfirm.tag.label}」
            </h3>
            {deleteConfirm.count > 0 ? (
              <div className="hsk-tag-delete-warning">
                该标签已关联 <strong>{deleteConfirm.count}</strong> 道题目。删除后，这些题目将失去此标签（题目本身不受影响）。确认删除？
              </div>
            ) : (
              <p className="hsk-tag-delete-text">
                确认删除标签「{deleteConfirm.tag.label}」？此操作不可恢复。
              </p>
            )}
            <div className="hsk-tag-modal-actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDeleteConfirm(null)}>
                取消
              </button>
              <button type="button" className="hsk-tag-modal-delete" onClick={confirmDeleteTag}>
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
