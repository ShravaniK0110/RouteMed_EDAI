// Define the Paramedic type — matches the actual Supabase paramedics table columns
export interface Paramedic {
  id: string;
  current_lat: number | null;
  current_lng: number | null;
  average_rating?: number | null;
  vehicle_registration?: string;
}

// Average emergency ambulance speed in city traffic
export const LIVE_AMBULANCE_SPEED_KMPH = 30;

// ─────────────────────────────────────────────────────────────
// 1. Haversine Formula for Distance Calculation
// ─────────────────────────────────────────────────────────────
export function getDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {

  const R = 6371;

  const dLat =
    (lat2 - lat1) * (Math.PI / 180);

  const dLon =
    (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +

    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *

    Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
}

export function calculateETA(
  distanceKm: number,
  speedKmph: number = LIVE_AMBULANCE_SPEED_KMPH
): number {

  if (
    !distanceKm ||
    distanceKm <= 0
  ) {
    return 1;
  }

  const etaMinutes =
    (distanceKm / speedKmph) * 60;

  return Math.max(
    1,
    Math.round(etaMinutes)
  );
}

export function calculateParamedicScore(
  paramedic: Paramedic,
  distanceKm: number,
  emergencyType: string,
  specialReqs: string[]
): number {

  let score = 100;

  // Distance penalty
  score -= distanceKm * 5;

  // Rating bonus
  if (paramedic.average_rating) {
    score +=
      paramedic.average_rating * 2;
  }

  // Optional future logic
  // Example:
  // cardiac ambulance bonus
  // trauma handling bonus
  // ICU-equipped vehicle bonus

  return Math.max(0, score);
}