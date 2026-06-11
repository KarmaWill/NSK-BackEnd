type VideoAddFormProps = {
  onCancel?: () => void;
  onSave?: (mode: 'publish' | 'draft') => void;
};

export function VideoAddForm({ onCancel, onSave }: VideoAddFormProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="form-row">
        <div className="form-group" style={{ flex: 2 }}>
          <label>视频标题</label>
          <input className="form-input" placeholder="请输入视频标题" />
        </div>
        <div className="form-group">
          <label>视频类型</label>
          <select className="form-input form-select">
            <option value="">选择类型…</option>
            <option value="culture">文化视频</option>
            <option value="promo">宣传视频</option>
          </select>
        </div>
      </div>
      <div className="form-group">
        <label>视频文件</label>
        <div className="form-hint" style={{ marginBottom: 8 }}>
          支持 mp4 / mov，建议横屏 16:9
        </div>
        <input type="file" accept="video/*" className="form-input" />
      </div>
      <div className="form-group">
        <label>简介</label>
        <textarea className="form-input" rows={4} placeholder="视频说明（选填）" />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        {onCancel && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>
            取消
          </button>
        )}
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => onSave?.('draft')}>
          存为草稿
        </button>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => onSave?.('publish')}>
          保存并发布
        </button>
      </div>
    </div>
  );
}
