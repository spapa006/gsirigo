import { NextResponse } from 'next/server';

/**
 * Convert any thrown error (DB driver, connection, config) into a JSON 500
 * whose `error` is the real underlying message. Admin debugging should never
 * have to guess from a generic "Failed to save X".
 */
export function serverErrorResponse(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ error: message }, { status: 500 });
}