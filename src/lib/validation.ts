// ─────────────────────────────────────────────────────────────────────────────
// Zod validation schemas for all API request bodies (Issue 10)
// ─────────────────────────────────────────────────────────────────────────────
import { z } from 'zod';

// ── Shared primitives ────────────────────────────────────────────────────────

const uuid = z.string().uuid('Must be a valid UUID');

const latitude = z
  .number({ invalid_type_error: 'Latitude must be a number' })
  .min(-90, 'Latitude must be >= -90')
  .max(90,  'Latitude must be <= 90');

const longitude = z
  .number({ invalid_type_error: 'Longitude must be a number' })
  .min(-180, 'Longitude must be >= -180')
  .max(180,  'Longitude must be <= 180');

// ── Auth ─────────────────────────────────────────────────────────────────────

export const AdminLoginSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// ── Booking ──────────────────────────────────────────────────────────────────

export const BookingCreateSchema = z.object({
  patientId:  uuid,
  pickupLat:  latitude,
  pickupLng:  longitude,
  hospitalId: uuid,
  severity:   z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

export const SmartMatchSchema = z.object({
  request_id: uuid,
});

export const MlAnalysisSchema = z.object({
  latitude:      latitude.optional(),
  longitude:     longitude.optional(),
  emergencyType: z.string().min(1, 'Emergency type is required'),
  severity:      z.string().min(1, 'Severity is required'),
});

// ── Paramedic ────────────────────────────────────────────────────────────────

export const AcceptRideSchema = z.object({
  request_id:  uuid,
  paramedic_id: uuid,
});

export const RejectRideSchema = z.object({
  request_id:   uuid,
  paramedic_id: uuid,
  reason:       z.string().max(500).optional(),
});

export const UpdateLocationSchema = z.object({
  paramedic_id: uuid,
  latitude,
  longitude,
});

// ── Hospital ─────────────────────────────────────────────────────────────────

export const HospitalAlertSchema = z.object({
  hospital_id:          z.string().optional(),
  hospital_name:        z.string().min(1, 'Hospital name is required'),
  emergency_type:       z.string().min(1, 'Emergency type is required'),
  severity:             z.string().min(1, 'Severity is required'),
  eta_minutes:          z.number().int().min(1).max(120).optional(),
  patient_age:          z.union([z.string(), z.number()]).optional(),
  patient_medical_info: z.string().max(1000).optional(),
});

// ── Helper ───────────────────────────────────────────────────────────────────

/**
 * Parse and validate a request body against a Zod schema.
 * Returns { data } on success or { error: NextResponse } on failure.
 */
import { NextResponse } from 'next/server';
import type { ZodSchema } from 'zod';

export async function validateBody<T>(
  req: Request,
  schema: ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return {
      data: null,
      error: NextResponse.json(
        { success: false, code: 'BAD_REQUEST', error: 'Request body must be valid JSON' },
        { status: 400 }
      ),
    };
  }

  const result = schema.safeParse(raw);

  if (!result.success) {
    const messages = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
    return {
      data: null,
      error: NextResponse.json(
        { success: false, code: 'BAD_REQUEST', error: messages },
        { status: 400 }
      ),
    };
  }

  return { data: result.data, error: null };
}
