export type MediaThumbnailState = 'audio' | 'video' | 'image' | 'image-unavailable';

export function formatMediaDuration(seconds: number | null | undefined): string {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) return '--';

  const totalSeconds = Math.round(seconds);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const p = (value: number) => String(value).padStart(2, '0');
  return `${p(h)}:${p(m)}:${p(s)}`;
}

export function resolveMediaThumbnailState(
  type: string,
  mediaUrl: string | undefined,
  imageFailed: boolean,
): MediaThumbnailState {
  if (type === '音频') return 'audio';
  if (type === '视频') return 'video';
  return mediaUrl && !imageFailed ? 'image' : 'image-unavailable';
}
