import { javaAdminFetch, unwrapPageRecords, type JavaPageResult } from '../lib/api';

export type MediaAssetType = 'audio' | 'video' | 'image';
export type MediaDirKind = 'level' | 'unit' | 'lesson';

export type MediaDirNode = {
  id: string;
  parentId: string | null;
  kind: MediaDirKind;
  label: string;
  sortOrder: number;
  children?: MediaDirNode[];
};

export type MediaAsset = {
  id: string;
  dirId: string | null;
  bucket: string;
  name: string;
  type: MediaAssetType;
  format: string;
  sizeBytes: number;
  durationSeconds: number | null;
  url: string;
  enabled: boolean;
  usageCount: number;
  usedBy: Array<{ kind: 'question' | 'paper' | 'video'; id: string; label?: string }>;
  createdAt: string;
  updatedAt: string;
};

export type MediaAssetPage = {
  total: number;
  records: MediaAsset[];
};

export type MediaAssetQuery = {
  current?: number;
  size?: number;
  type?: MediaAssetType;
  dirId?: string;
  dirIds?: string[];
  bucket?: string;
  keyword?: string;
  name?: string;
  format?: string;
  enabled?: boolean;
};

type JavaMediaDirNode = Omit<MediaDirNode, 'id' | 'parentId' | 'children'> & {
  id: string | number;
  parentId: string | number | null;
  children?: JavaMediaDirNode[];
};

type JavaMediaAsset = Omit<MediaAsset, 'id' | 'dirId'> & {
  id: string | number;
  dirId: string | number | null;
};

function normalizeId(value: string | number): string;
function normalizeId(value: string | number | null | undefined): string | null;
function normalizeId(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null;
  return String(value);
}

function normalizeDir(node: JavaMediaDirNode): MediaDirNode {
  return {
    ...node,
    id: normalizeId(node.id),
    parentId: normalizeId(node.parentId),
    children: node.children?.map(normalizeDir),
  };
}

function normalizeAsset(asset: JavaMediaAsset): MediaAsset {
  return {
    ...asset,
    id: normalizeId(asset.id),
    dirId: normalizeId(asset.dirId),
  };
}

function toJavaLong(value: string | number | null | undefined): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const raw = typeof value === 'number' ? String(value) : value.trim();
  if (!/^\d+$/.test(raw)) return undefined;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}

function requireJavaLong(value: string | number | null | undefined, label: string): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = toJavaLong(value);
  if (parsed === undefined) throw new Error(`${label} 必须是 Java 后端返回的数字 ID`);
  return parsed;
}

export async function listMediaDirs(): Promise<MediaDirNode[]> {
  const dirs = await javaAdminFetch<JavaMediaDirNode[]>('/media/dirs/tree');
  return dirs.map(normalizeDir);
}

export async function pageMediaAssets(params: MediaAssetQuery = {}): Promise<MediaAssetPage> {
  const qs = new URLSearchParams();
  qs.set('current', String(params.current ?? 1));
  qs.set('size', String(params.size ?? 20));
  if (params.type) qs.set('type', params.type);
  const dirId = requireJavaLong(params.dirId, '目录 ID');
  if (dirId !== undefined) qs.set('dirId', String(dirId));
  params.dirIds?.forEach((value) => {
    const parsed = requireJavaLong(value, '目录 ID');
    if (parsed !== undefined) qs.append('dirIds', String(parsed));
  });
  if (params.bucket) qs.set('bucket', params.bucket);
  if (params.keyword) qs.set('keyword', params.keyword);
  if (params.name) qs.set('name', params.name);
  if (params.format) qs.set('format', params.format);
  if (typeof params.enabled === 'boolean') qs.set('enabled', params.enabled ? '1' : '0');
  const page = await javaAdminFetch<JavaPageResult<JavaMediaAsset>>(`/media/assets/page?${qs}`);
  return {
    total: page.total ?? 0,
    records: unwrapPageRecords(page).map(normalizeAsset),
  };
}

export async function listMediaAssets(params: Omit<MediaAssetQuery, 'current' | 'size'> = {}): Promise<MediaAsset[]> {
  const pageSize = 200;
  const first = await pageMediaAssets({ ...params, current: 1, size: pageSize });
  if (first.records.length >= first.total) return first.records;

  const pageCount = Math.ceil(first.total / pageSize);
  const remaining = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) => pageMediaAssets({
      ...params,
      current: index + 2,
      size: pageSize,
    })),
  );
  return [first, ...remaining].flatMap((page) => page.records);
}

export async function uploadMediaAsset(
  file: File,
  meta: { dirId?: string; bucket?: string; name?: string },
): Promise<MediaAsset> {
  const form = new FormData();
  form.append('file', file);
  const dirId = requireJavaLong(meta.dirId, '目录 ID');
  if (dirId !== undefined) form.append('dirId', String(dirId));
  if (meta.bucket) form.append('bucket', meta.bucket);
  if (meta.name) form.append('name', meta.name);
  const asset = await javaAdminFetch<JavaMediaAsset>('/media/assets/upload', { method: 'POST', body: form });
  return normalizeAsset(asset);
}

export async function patchMediaAsset(
  id: string,
  patch: { name?: string; enabled?: boolean; dirId?: string; bucket?: string },
): Promise<MediaAsset> {
  let changed: JavaMediaAsset | null = null;
  const { enabled, ...metadata } = patch;
  const hasMetadata = Object.values(metadata).some((value) => value !== undefined);
  if (hasMetadata) {
    const dirId = requireJavaLong(metadata.dirId, '目录 ID');
    changed = await javaAdminFetch<JavaMediaAsset>('/media/assets', {
      method: 'PUT',
      body: JSON.stringify({
        id: requireJavaLong(id, '资源 ID'),
        ...metadata,
        ...(metadata.dirId !== undefined ? { dirId } : {}),
      }),
    });
  }
  if (typeof enabled === 'boolean') {
    changed = await javaAdminFetch<JavaMediaAsset>(`/media/assets/${encodeURIComponent(id)}/status`, {
      method: 'PUT',
      body: JSON.stringify({ enabled: enabled ? 1 : 0 }),
    });
  }
  if (changed) return normalizeAsset(changed);
  const asset = await javaAdminFetch<JavaMediaAsset>(`/media/assets/${encodeURIComponent(id)}`);
  return normalizeAsset(asset);
}

export async function replaceMediaAsset(id: string, file: File): Promise<MediaAsset> {
  const form = new FormData();
  form.append('file', file);
  const asset = await javaAdminFetch<JavaMediaAsset>(`/media/assets/${encodeURIComponent(id)}/replace`, {
    method: 'POST',
    body: form,
  });
  return normalizeAsset(asset);
}

export async function deleteMediaAsset(id: string): Promise<void> {
  await javaAdminFetch(`/media/assets/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
