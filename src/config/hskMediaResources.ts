export type HskMediaResource = {
  id: string;
  name: string;
  url: string;
  duration?: string;
  size: string;
};

/** 与 5174 端 ResourceModal 对齐的 HSK 音频资源库（mock） */
export const HSK_AUDIO_RESOURCES: HskMediaResource[] = [
  { id: 'aud-001', name: '日常问候.mp3', url: '/audio/daily-greeting.mp3', duration: '0:08', size: '1.2 MB' },
  { id: 'aud-002', name: '自我介绍.wav', url: '/audio/self-intro.wav', duration: '0:12', size: '2.5 MB' },
  { id: 'aud-003', name: '购物对话.mp3', url: '/audio/shopping-dialogue.mp3', duration: '0:18', size: '3.1 MB' },
  { id: 'aud-004', name: '餐厅点餐.m4a', url: '/audio/restaurant-order.m4a', duration: '0:10', size: '1.8 MB' },
  { id: 'aud-005', name: '问路指路.mp3', url: '/audio/ask-directions.mp3', duration: '0:14', size: '2.0 MB' },
  { id: 'aud-006', name: '时间表达.wav', url: '/audio/time-expression.wav', duration: '0:09', size: '1.5 MB' },
];

/** 与 5174 端图片选项资源对齐（mock） */
export const HSK_IMAGE_RESOURCES: HskMediaResource[] = [
  { id: 'img-cat', name: 'cat.png', url: '/images/cat.png', size: '128 KB' },
  { id: 'img-dog', name: 'dog.png', url: '/images/dog.png', size: '142 KB' },
  { id: 'img-bird', name: 'bird.png', url: '/images/bird.png', size: '119 KB' },
  { id: 'img-apple', name: 'apple.png', url: '/images/apple.png', size: '96 KB' },
  { id: 'img-bike', name: 'bike.png', url: '/images/bike.png', size: '134 KB' },
  { id: 'img-book', name: 'book.png', url: '/images/book.png', size: '110 KB' },
];

export function getHskMediaResources(kind: 'audio' | 'image'): HskMediaResource[] {
  return kind === 'audio' ? HSK_AUDIO_RESOURCES : HSK_IMAGE_RESOURCES;
}
