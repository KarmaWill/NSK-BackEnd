import { useEffect, useRef, useState } from 'react';
import { FoxAvatar } from './FoxAvatar';
import { loadAdminProfile, saveAdminProfile, type AdminProfile } from '../stores/adminProfile';

type Props = {
  open: boolean;
  username: string;
  roleLabel: string;
  onClose: () => void;
};

export function AdminProfileModal({ open, username, roleLabel, onClose }: Props) {
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const profile = loadAdminProfile();
    setDisplayName(profile.displayName);
    setAvatarUrl(profile.avatarUrl);
  }, [open]);

  if (!open) return null;

  const handleSave = () => {
    const next: AdminProfile = {
      displayName: displayName.trim() || loadAdminProfile().displayName,
      avatarUrl,
    };
    saveAdminProfile(next);
    onClose();
  };

  const handleFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setAvatarUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="modal-overlay open"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="管理员账号设置"
    >
      <div className="modal admin-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">管理员账号设置</div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">✕</button>
        </div>
        <div className="modal-body">
          <div className="admin-profile-preview">
            <div className="user-avatar user-avatar-lg">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="user-avatar-img" />
              ) : (
                <FoxAvatar size={44} />
              )}
            </div>
            <div>
              <div className="admin-profile-preview-name">{displayName.trim() || '群哥'}</div>
              <div className="admin-profile-preview-meta">{username} · {roleLabel}</div>
            </div>
          </div>

          <div className="form-group">
            <label>显示名称</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="在侧边栏显示的名称"
              maxLength={24}
            />
          </div>

          <div className="form-group">
            <label>登录账号</label>
            <input type="text" value={username} readOnly className="input-readonly" />
          </div>

          <div className="form-group">
            <label>当前角色</label>
            <input type="text" value={roleLabel} readOnly className="input-readonly" />
            <div className="form-hint">角色可在侧边栏「角色」处切换</div>
          </div>

          <div className="form-group">
            <label>头像</label>
            <div className="admin-profile-avatar-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setAvatarUrl(null)}
              >
                使用默认小狐狸
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => fileRef.current?.click()}
              >
                上传图片
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  handleFile(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>取消</button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>保存</button>
        </div>
      </div>
    </div>
  );
}
