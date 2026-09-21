import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { deleteRedirect } from '@/lib/db/repositories/redirects';
import { serverErrorResponse } from '@/lib/api/error-response';

export const runtime = 'nodejs';
// Cold-start + remote Turso handshake can exceed the 10s Hobby default on the
// first write; raise the cap so writes don't end up as opaque 504s.
export const maxDuration = 60;

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