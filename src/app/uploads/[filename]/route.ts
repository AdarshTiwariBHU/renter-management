import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { connectToDatabase } from '@/lib/db';
import UploadedFile from '@/models/UploadedFile';

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
  context: { params: { filename: string } | Promise<{ filename: string }> }
) {
  try {
    const params = await context.params;
    const { filename } = params;

    // Prevent directory traversal
    const sanitizedFilename = path.basename(filename);

    // 1. Try finding in MongoDB Atlas
    try {
      await connectToDatabase();
      const fileDoc = await UploadedFile.findOne({ filename: sanitizedFilename });
      if (fileDoc && fileDoc.data) {
        return new NextResponse(new Uint8Array(fileDoc.data), {
          status: 200,
          headers: {
            'Content-Type': fileDoc.mimeType || 'application/octet-stream',
            'Content-Length': fileDoc.data.length.toString(),
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }
    } catch (dbErr) {
      console.warn('MongoDB file fetch error, trying local fallback:', dbErr);
    }

    // 2. Fallback to local filesystem (e.g. for existing local files)
    try {
      const filePath = path.join(process.cwd(), 'public', 'uploads', sanitizedFilename);
      const fileBuffer = await fs.readFile(filePath);
      const ext = path.extname(sanitizedFilename).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      return new NextResponse(new Uint8Array(fileBuffer), {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': fileBuffer.length.toString(),
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
