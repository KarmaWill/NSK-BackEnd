export type VideoStatus = 'published' | 'draft' | 'unpublished';

export type VideoSubtitle = {
  id: string;
  lang: string;
  fileName: string;
  status: 'ready' | 'processing' | 'missing';
};

export type VideoMarker = {
  id: string;
  time: string;
  label: string;
  note: string;
};

export type VideoRecord = {
  id: string;
  titleZh: string;
  titleEn: string;
  position: string;
  duration: string;
  publishAt: string;
  status: VideoStatus;
  videoType: string;
  category: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  coverUrl?: string;
  subtitles: VideoSubtitle[];
  markers: VideoMarker[];
};

const LESSON_TOPICS: Record<number, string> = {
  1: '你好',
  2: '自我介绍',
  3: '数字与年龄',
  4: '家庭成员',
  5: '购物询价',
  6: '天气与季节',
  7: '爱好兴趣',
  8: '学校生活',
  9: '交通出行',
  10: '看病就医',
  11: '节日习俗',
  12: '打电话',
  13: '约见面',
  14: '租房看房',
  15: '银行办事',
  16: '运动健身',
  17: '旅游计划',
  18: '职场面试',
  19: '邮件写作',
  20: '环保话题',
  21: '科技生活',
  22: '社交媒体',
  23: '餐厅点餐',
  24: '问路指路',
  25: '时间表达',
};

const VIDEO_TYPES = ['教学视频', '测试视频', '儿歌', '文化视频'] as const;

function daysAgoIso(days: number, hour = 12, minute = 0): string {
  const d = new Date('2026-06-05T12:00:00');
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

function makeSubtitles(count: number, idPrefix: string): VideoSubtitle[] {
  const langs = ['中文', 'English', 'ไทย', 'Tiếng Việt', 'Bahasa', '日本語', '한국어', 'Español'];
  return langs.slice(0, count).map((lang, i) => ({
    id: `${idPrefix}-sub-${i}`,
    lang,
    fileName: `${idPrefix.toLowerCase()}-${lang.slice(0, 2)}.vtt`,
    status: 'ready' as const,
  }));
}

function lessonDuration(n: number): string {
  const min = 3 + (n % 5);
  const sec = (n * 7) % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

function buildLessonVideo(n: number, overrides?: Partial<VideoRecord>): VideoRecord {
  const id = `VID-${String(n).padStart(3, '0')}`;
  const topic = LESSON_TOPICS[n] ?? `主题 ${n}`;
  const typeIdx = n % VIDEO_TYPES.length;
  const defaultStatus: VideoStatus = n <= 20 ? 'published' : n === 21 ? 'unpublished' : n === 22 ? 'draft' : n === 24 ? 'unpublished' : n === 25 ? 'draft' : 'published';
  const subCount = n === 25 ? 1 : n === 24 ? 4 : n === 23 ? 8 : 2 + (n % 4);
  const daysAgo = n === 25 ? 5 : n === 24 ? 1 : n === 23 ? 2 : 3 + (n % 14);

  return {
    id,
    titleZh: `第${n}课 — ${topic}`,
    titleEn: `Lesson ${n} — ${topic}`,
    position: '课程视频库',
    duration: lessonDuration(n),
    publishAt: defaultStatus === 'published' ? daysAgoIso(daysAgo + 10).slice(0, 10) : '待定',
    status: defaultStatus,
    videoType: VIDEO_TYPES[typeIdx],
    category: n <= 10 ? '初级入门' : n <= 20 ? '中级进阶' : '高级应用',
    description: `第 ${n} 课教学视频：${topic}。`,
    createdAt: daysAgoIso(daysAgo + 30, 10, 0),
    updatedAt: daysAgoIso(daysAgo, 14 + (n % 8), 20 + (n % 40)),
    subtitles: makeSubtitles(subCount, id),
    markers: [
      { id: `${id}-mk-1`, time: '0:30', label: '导入', note: '课程开场' },
      { id: `${id}-mk-2`, time: '2:00', label: '重点', note: '核心句型' },
    ],
    ...overrides,
  };
}

/** 与参考端 VideoList 对齐的 25 条样例（第 23–25 课与参考数据一致） */
export const VIDEO_RECORDS: VideoRecord[] = Array.from({ length: 25 }, (_, i) => {
  const n = i + 1;
  if (n === 23) {
    return buildLessonVideo(23, {
      duration: '3:00',
      videoType: '儿歌',
      status: 'published',
      updatedAt: daysAgoIso(2, 9, 12),
      subtitles: makeSubtitles(8, 'VID-023'),
      publishAt: '2026-05-20',
    });
  }
  if (n === 24) {
    return buildLessonVideo(24, {
      duration: '7:00',
      videoType: '测试视频',
      status: 'unpublished',
      updatedAt: daysAgoIso(1, 16, 45),
      subtitles: makeSubtitles(4, 'VID-024'),
      publishAt: '2026-05-28',
    });
  }
  if (n === 25) {
    return buildLessonVideo(25, {
      duration: '4:35',
      videoType: '教学视频',
      status: 'draft',
      updatedAt: daysAgoIso(5, 11, 8),
      subtitles: [{ id: 'sub-25-zh', lang: '中文', fileName: '', status: 'missing' }],
      category: '中级进阶',
      markers: [
        { id: 'mk-25-1', time: '0:45', label: '词汇点', note: '点、分、刻' },
        { id: 'mk-25-2', time: '2:10', label: '句型', note: '几点几分' },
        { id: 'mk-25-3', time: '3:50', label: '练习', note: '跟读环节' },
      ],
    });
  }
  return buildLessonVideo(n);
});

export function statusLabel(status: VideoStatus): string {
  if (status === 'published') return '已发布';
  if (status === 'unpublished') return '已下架';
  return '草稿';
}

export function statusBadgeClass(status: VideoStatus): string {
  if (status === 'published') return 'badge-teal';
  if (status === 'unpublished') return 'badge-muted';
  return 'badge-amber';
}

export function countReadySubtitles(video: VideoRecord): number {
  return video.subtitles.filter((s) => s.status === 'ready').length;
}

export function subtitleLangSummary(video: VideoRecord): string {
  const n = video.subtitles.length;
  if (n === 0) return '无字幕';
  return `${n} 种语言`;
}

export function formatRelativeUpdatedAt(updatedAt: string): string {
  const now = new Date('2026-06-05T12:00:00');
  const then = new Date(updatedAt.replace(' ', 'T'));
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin} 分钟前`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} 小时前`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay} 天前`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} 个月前`;
  return `${Math.floor(diffMonth / 12)} 年前`;
}
