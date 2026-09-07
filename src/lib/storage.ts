import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export interface UploadResult {
  url: string;
  publicId?: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export async function saveFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<UploadResult> {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
    'application/pdf',
    'image/heic',
    'image/heif',
    'image/pjpeg',
    'image/x-png',
    'image/gif',
  ];

  const ext = path.extname(originalName).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.heic', '.heif', '.gif'];

  const isValidMime = allowedMimeTypes.includes(mimeType?.toLowerCase());
  const isValidExt = allowedExts.includes(ext);

  if (!isValidMime && !isValidExt) {
    throw new Error('Invalid file format. Allowed types: JPEG, PNG, WEBP, PDF, HEIC');
  }

  const maxSize = 25 * 1024 * 1024; // 25MB limit for modern mobile camera photos
  if (buffer.length > maxSize) {
    throw new Error('File size exceeds 25MB limit');
  }

  // Check if Cloudinary is configured
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    // Cloudinary direct upload via fetch
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signatureString = `timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`;
    const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
    formData.append('file', blob, originalName);
    formData.append('api_key', process.env.CLOUDINARY_API_KEY);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', 'renters_management');

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
      { method: 'POST', body: formData }
    );

    if (res.ok) {
      const data = await res.json();
      return {
        url: data.secure_url,
        publicId: data.public_id,
        originalName,
        mimeType,
        size: buffer.length,
      };
    }
    console.warn('Cloudinary upload failed, falling back to local storage');
  }

  // Local storage fallback
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });

  const fileExt = ext || (mimeType.includes('pdf') ? '.pdf' : '.jpg');
  const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${fileExt}`;
  const filePath = path.join(uploadsDir, uniqueName);

  await fs.writeFile(filePath, buffer);

  return {
    url: `/uploads/${uniqueName}`,
    originalName,
    mimeType,
    size: buffer.length,
  };
}
