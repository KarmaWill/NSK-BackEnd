import { VideoAddForm } from '../components/VideoAddForm';

export function VideoAdd() {
  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">新增视频</div>
          <div className="page-subtitle">上传或录入视频元数据，配置类型、标签与发布状态</div>
        </div>
      </div>
      <div className="card">
        <div className="card-body">
          <VideoAddForm />
        </div>
      </div>
    </>
  );
}
