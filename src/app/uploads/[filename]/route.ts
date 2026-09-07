import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
};

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params;

    // Prevent directory traversal
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(process.cwd(), 'public', 'uploads', sanitizedFilename);

    try {
      const fileBuffer = await fs.readFile(filePath);
      const ext = path.extname(sanitizedFilename).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch {
      return new NextResponse('File not found', { status: 404 });
    }
  } catch (error) {
    console.error('Upload serve error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
