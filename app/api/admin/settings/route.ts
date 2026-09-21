import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { saveSettings, SETTING_KEYS } from '@/lib/db/repositories/settings';
import { revalidateSiteWide } from '@/lib/revalidate';
import { serverErrorResponse } from '@/lib/api/error-response';

export const runtime = 'nodejs';
// Cold-start + remote Turso handshake can exceed the 10s Hobby default on the
// first write; raise the cap so writes don't end up as opaque 504s.
export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const entries: Record<string, string> = {};
  for (const key of SETTING_KEYS) {
    const value = body[key];
    if (typeof value === 'string') entries[key] = value;
  }

  try {
    await saveSettings(entries);
  } catch (error) {
    return serverErrorResponse(error);
  }
  revalidateSiteWide();
  return NextResponse.json({ ok: true });
}