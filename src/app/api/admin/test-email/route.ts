import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';
import { sendTestEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const targetEmail = body.targetEmail || 'adarshcsbhu@gmail.com';

    const result = await sendTestEmail(targetEmail);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
