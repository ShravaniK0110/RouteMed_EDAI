// ─────────────────────────────────────────────────────────────────────────────
// Central configuration constants
// All hardcoded fallback values live here — never scattered in business logic.
// ─────────────────────────────────────────────────────────────────────────────

// Default city centre coordinates (Pune)
// Used only when GPS is unavailable
export const DEFAULT_LAT = 18.5204;
export const DEFAULT_LNG = 73.8567;

// ─────────────────────────────────────────────────────────────────────────────
// Dispatch & ETA
// ─────────────────────────────────────────────────────────────────────────────

// Sentinel value when paramedic has no GPS fix
export const UNREACHABLE_DISTANCE_KM = 999;

// Assumed distance when GPS missing
export const FALLBACK_DISTANCE_KM = 2.0;

// SINGLE SOURCE OF TRUTH
// Standard city ambulance speed used everywhere
export const FALLBACK_AMBULANCE_SPEED_KMPH = 30;

// ─────────────────────────────────────────────────────────────────────────────
// Hospital scoring
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_HOSPITAL_RATING = 4.0;

// ETA beyond this scores 0 on time
export const MAX_ETA_SCORE_MINUTES = 30;

// Response score factor cutoff
export const MAX_RESPONSE_SCORE_MINUTES = 20;

// ─────────────────────────────────────────────────────────────────────────────
// Pricing (INR)
// ─────────────────────────────────────────────────────────────────────────────

export const BASE_FARE_INR = 50.0;
export const RATE_PER_KM_INR = 15.0;
export const RATE_PER_MINUTE_INR = 1.0;

// ─────────────────────────────────────────────────────────────────────────────
// Surge thresholds (risk score 0–100)
// ─────────────────────────────────────────────────────────────────────────────

export const SURGE_CRITICAL_THRESHOLD = 80; // 2.0×
export const SURGE_HIGH_THRESHOLD = 60;     // 1.5×
export const SURGE_MEDIUM_THRESHOLD = 40;   // 1.2×

// ─────────────────────────────────────────────────────────────────────────────
// ML demand thresholds
// ─────────────────────────────────────────────────────────────────────────────

export const DEMAND_HIGH_RISK = 70;
export const DEMAND_MEDIUM_RISK = 40;

// ─────────────────────────────────────────────────────────────────────────────
// ML Backend
// ─────────────────────────────────────────────────────────────────────────────

export const ML_URL =
  process.env.ML_BACKEND_URL ||
  'http://localhost:5001';