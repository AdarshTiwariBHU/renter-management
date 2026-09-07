import { NextRequest, NextResponse } from 'next/server';
import { saveFile } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await saveFile(buffer, file.name, file.type);

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      data: uploadResult,
      message: 'File uploaded successfully',
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'File upload failed';
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
