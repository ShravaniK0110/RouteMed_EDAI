import { NextResponse } from 'next/server';

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR';

const STATUS_MAP: Record<ApiErrorCode, number> = {
  BAD_REQUEST:    400,
  UNAUTHORIZED:   401,
  FORBIDDEN:      403,
  NOT_FOUND:      404,
  CONFLICT:       409,
  INTERNAL_ERROR: 500,
};

// Use for all known/expected errors
export function apiError(code: ApiErrorCode, message: string) {
  return NextResponse.json(
    { success: false, code, error: message },
    { status: STATUS_MAP[code] }
  );
}

// Use in every catch block — never exposes raw error internals to the client
export function apiCatchError(err: unknown, context: string) {
  console.error(`[${context}]`, err);
  return NextResponse.json(
    { success: false, code: 'INTERNAL_ERROR', error: 'Something went wrong. Please try again.' },
    { status: 500 }
  );
}
