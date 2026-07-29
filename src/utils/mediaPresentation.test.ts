import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { formatMediaDuration, resolveMediaThumbnailState } from './mediaPresentation';

test('formatMediaDuration renders known durations and leaves missing values explicit', () => {
  assert.equal(formatMediaDuration(10), '00:00:10');
  assert.equal(formatMediaDuration(1.5), '00:00:02');
  assert.equal(formatMediaDuration(null), '--');
  assert.equal(formatMediaDuration(Number.NaN), '--');
});

test('resolveMediaThumbnailState only renders an image when its preview URL is available', () => {
  assert.equal(resolveMediaThumbnailState('图片', '/files/cover.png', false), 'image');
  assert.equal(resolveMediaThumbnailState('图片', '/files/cover.png', true), 'image-unavailable');
  assert.equal(resolveMediaThumbnailState('图片', undefined, false), 'image-unavailable');
  assert.equal(resolveMediaThumbnailState('音频', '/files/audio.mp3', false), 'audio');
  assert.equal(resolveMediaThumbnailState('视频', '/files/video.mp4', false), 'video');
});
