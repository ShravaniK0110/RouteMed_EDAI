import { supabase } from './supabase';
import {
  ML_URL,
  DEFAULT_HOSPITAL_RATING,
  MAX_ETA_SCORE_MINUTES,
  MAX_RESPONSE_SCORE_MINUTES,
  FALLBACK_SPEED_KMPH,
  DEMAND_HIGH_RISK,
  DEMAND_MEDIUM_RISK,
} from './config';

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function getTravelTimeMinutes(distanceKm: number, hour: number, dayOfWeek: number): Promise<number> {
  try {
    const routeId = distanceKm < 3 ? 'R1' : distanceKm < 7 ? 'R2' : 'R3';
    const res = await fetch(`${ML_URL}/predict/traffic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hour, day_of_week: dayOfWeek, route_id: routeId, weather: 'Clear' }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.predicted_travel_minutes) {
        return Math.ceil(data.predicted_travel_minutes * (distanceKm / 5));
      }
    }
  } catch {
    console.error('Traffic ML fallback triggered');
  }
  // Fallback: use configured city speed constant
  return Math.ceil((distanceKm / FALLBACK_SPEED_KMPH) * 60);
}

export async function selectOptimalHospital(
  patientLoc: { lat: number; lng: number },
  emergencyType: string,
  severity: string
) {
  const { data: hospitals, error } = await supabase
    .from('hospitals')
    .select('*')
    .eq('is_active', true);

  if (error || !hospitals) return [];

  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();

  let predictedCasualties = 1;
  try {
    const mlRes = await fetch(`${ML_URL}/predict/demand`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hour, day_of_week: dayOfWeek, location: 'Center', weather: 'Clear' }),
    });
    if (mlRes.ok) {
      const mlData = await mlRes.json();
      predictedCasualties =
        mlData.risk_score > DEMAND_HIGH_RISK   ? 3 :
        mlData.risk_score > DEMAND_MEDIUM_RISK ? 2 : 1;
    }
  } catch { /* silent fallback — 1 casualty assumed */ }

  const results = [];

  for (const h of hospitals) {
    const distKm    = getDistanceKm(patientLoc.lat, patientLoc.lng, Number(h.latitude), Number(h.longitude));
    const travelTime = await getTravelTimeMinutes(distKm, hour, dayOfWeek);

    // Factor 1: Travel Time (40%)
    const timeScore = Math.max(0, (MAX_ETA_SCORE_MINUTES - travelTime) / MAX_ETA_SCORE_MINUTES) * 0.4;

    // Factor 2: Bed Availability (30%)
    let bedScore = 0;
    if (h.total_beds > 0 && h.available_beds >= predictedCasualties) {
      bedScore = (h.available_beds / h.total_beds) * 0.3;
    }

    // Factor 3: Quality (20%) — use config default when rating is null
    const qualityScore = ((h.rating ?? DEFAULT_HOSPITAL_RATING) / 5) * 0.2;

    // Factor 4: Response Time (10%)
    const responseScore = Math.max(0, (MAX_RESPONSE_SCORE_MINUTES - travelTime) / MAX_RESPONSE_SCORE_MINUTES) * 0.1;

    // Specialty multiplier
    let specialtyMultiplier = 1.0;
    const type = emergencyType.toLowerCase();
    const equipmentList = Array.isArray(h.equipment) ? h.equipment.join(' ').toLowerCase() : '';

    if (type.includes('chest') || type.includes('cardiac') || type.includes('arrest')) {
      specialtyMultiplier = (equipmentList.includes('cardiologist') || equipmentList.includes('cath lab')) ? 1.3 : 1.0;
    } else if (severity === 'Critical' && !h.rating) {
      specialtyMultiplier = 0.7;
    }

    const totalScore = (timeScore + bedScore + qualityScore + responseScore) * specialtyMultiplier;
    results.push({ ...h, travelTime, totalScore });
  }

  return results.sort((a, b) => b.totalScore - a.totalScore).slice(0, 3);
}
