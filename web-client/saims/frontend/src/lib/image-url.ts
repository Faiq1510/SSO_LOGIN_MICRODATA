type AssetImageLike = {
  image_url?: unknown;
  bucket_name?: unknown;
  object_key?: unknown;
};

const trimSlash = (value: string): string => value.replace(/\/+$/, '');

const normalizeBaseUrl = (value: string): string => {
  const cleaned = trimSlash(value.trim());
  if (!cleaned) return '';

  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    return cleaned;
  }

  return `http://${cleaned}`;
};

export const getMinioBaseUrl = (): string => {
  const envBase = normalizeBaseUrl(process.env.NEXT_PUBLIC_MINIO_URL || '');
  if (envBase) return envBase;

  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:9000`;
  }

  return 'http://localhost:9000';
};

export const resolveAssetImageUrl = (image: AssetImageLike): string => {
  const presigned = typeof image?.image_url === 'string' ? image.image_url.trim() : '';
  if (presigned) return presigned;

  const bucket = typeof image?.bucket_name === 'string' ? image.bucket_name.trim() : '';
  const objectKey = typeof image?.object_key === 'string' ? image.object_key.trim() : '';
  if (!bucket || !objectKey) return '';

  return `${getMinioBaseUrl()}/${bucket}/${objectKey}`;
};
