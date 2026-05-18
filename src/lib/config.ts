// ─────────────────────────────────────────────────────────────────────────────
// Central configuration constants
// All hardcoded fallback values live here — never scattered in business logic.
// ─────────────────────────────────────────────────────────────────────────────

// Default city centre coordinates (Pune) — used only when GPS is unavailable
export const DEFAULT_LAT = 18.5204;
export const DEFAULT_LNG = 73.8567;

// Dispatching fallbacks
export const UNREACHABLE_DISTANCE_KM = 999;   // Sentinel: paramedic has no GPS fix
export const FALLBACK_DISTANCE_KM    = 2.0;   // Assumed distance when GPS missing
export const FALLBACK_SPEED_KMPH     = 20;    // City speed assumption for ETA calc
export const FALLBACK_AMBULANCE_SPEED = 30;   // Speed used in accept-ride ETA

// Hospital scoring defaults
export const DEFAULT_HOSPITAL_RATING    = 4.0; // Used when rating is null in DB
export const MAX_ETA_SCORE_MINUTES      = 30;  // ETA beyond this scores 0 on time
export const MAX_RESPONSE_SCORE_MINUTES = 20;  // Same for response score factor

// Pricing (INR)
export const BASE_FARE_INR        = 50.0;
export const RATE_PER_KM_INR      = 15.0;
export const RATE_PER_MINUTE_INR  = 1.0;

// Surge thresholds (risk score 0-100)
export const SURGE_CRITICAL_THRESHOLD = 80;   // 2.0×
export const SURGE_HIGH_THRESHOLD     = 60;   // 1.5×
export const SURGE_MEDIUM_THRESHOLD   = 40;   // 1.2×

// ML demand thresholds
export const DEMAND_HIGH_RISK   = 70; // risk_score above → 3 predicted casualties
export const DEMAND_MEDIUM_RISK = 40; // risk_score above → 2 predicted casualties

// ML backend URL
export const ML_URL = process.env.ML_BACKEND_URL || 'http://localhost:5001';
