import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { deleteRedirect } from '@/lib/db/repositories/redirects';
import { serverErrorResponse } from '@/lib/api/error-response';

export const runtime = 'nodejs';

export async function DELETE(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { slug } = await context.params;
  if (!slug) {
    return NextResponse.json({ error: 'slug is required.' }, { status: 400 });
  }

  try {
    await deleteRedirect(slug);
  } catch (error) {
    return serverErrorResponse(error);
  }
  return NextResponse.json({ ok: true });
}