import { useState } from 'react';

type VideoTypeRow = {
  id: string;
  name: string;
  key: string;
  description: string;
  videoCount: number;
  isActive: boolean;
};

const SEED_TYPES: VideoTypeRow[] = [
  { id: '1', name: '文化视频', key: 'culture', description: '文化类讲解与展示', videoCount: 12, isActive: true },
  { id: '2', name: '宣传视频', key: 'promo', description: '官网与营销位视频', videoCount: 3, isActive: true },
  { id: '3', name: '课程片段', key: 'lesson_clip', description: '课程内嵌短视频', videoCount: 0, isActive: true },
];

export function VideoTypes() {
  const [types] = useState<VideoTypeRow[]>(SEED_TYPES);

  return (
    <>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title">视频类型</div>
          <div className="page-subtitle">管理视频类型配置，用于视频导入与列表筛选</div>
        </div>
        <button type="button" className="btn btn-primary btn-sm">
          + 新建类型
        </button>
      </div>
      <div className="card">
        <div className="card-body">
          <table>
            <thead>
              <tr>
                <th>类型名称</th>
                <th>标识 key</th>
                <th>说明</th>
                <th>视频数</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {types.map((row) => (
                <tr key={row.id}>
                  <td>
                    <b>{row.name}</b>
                  </td>
                  <td>
                    <code>{row.key}</code>
                  </td>
                  <td>{row.description}</td>
                  <td>{row.videoCount}</td>
                  <td>
                    <span className={`badge ${row.isActive ? 'badge-teal' : 'badge-amber'}`}>
                      {row.isActive ? '启用' : '停用'}
                    </span>
                  </td>
                  <td>
                    <button type="button" className="btn btn-secondary btn-sm">
                      编辑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
