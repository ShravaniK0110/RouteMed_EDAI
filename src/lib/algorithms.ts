import { supabase } from './supabase'; 

// 1. ADDED: Define the ML Backend URL dynamically
const ML_URL = process.env.ML_BACKEND_URL || 'http://localhost:5001';

// Keep the Haversine logic exactly as you had it
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

// Fixed ML bridge to match your app.py routes
async function getTravelTimeMinutes(distanceKm: number, hour: number, dayOfWeek: number): Promise<number> {
  try {
    const routeId = distanceKm < 3 ? 'R1' : distanceKm < 7 ? 'R2' : 'R3';
    // 2. FIXED: Replaced localhost with the dynamic ML_URL
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
  } catch (err) {
    console.error("Traffic ML fallback triggered");
  }
  return Math.ceil((distanceKm / 20) * 60); // 20 km/h city fallback
}

export async function selectOptimalHospital(
  patientLoc: { lat: number; lng: number },
  emergencyType: string,
  severity: string
) {
  // Fetch from Supabase (Fixed column names: lat/lng)
  const { data: hospitals, error } = await supabase
    .from('hospitals')
    .select('*')
    .eq('is_active', true);

  if (error || !hospitals) return [];

  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();

  // Predict casualty demand
  let predictedCasualties = 1;
  try {
    // 3. FIXED: Replaced localhost with the dynamic ML_URL
    const mlRes = await fetch(`${ML_URL}/predict/demand`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hour, day_of_week: dayOfWeek, location: 'Center', weather: 'Clear' }),
    });
    if (mlRes.ok) {
      const mlData = await mlRes.json();
      predictedCasualties = mlData.risk_score > 70 ? 3 : mlData.risk_score > 40 ? 2 : 1;
    }
  } catch (err) { /* silent fallback */ }

  const results = [];

  for (const h of hospitals) {
    // Note: using h.lat/h.lng from our new Supabase schema
    const distKm = getDistanceKm(patientLoc.lat, patientLoc.lng, Number(h.lat), Number(h.lng));
    const travelTime = await getTravelTimeMinutes(distKm, hour, dayOfWeek);

    // Factor 1: Travel Time (40%)
    const timeScore = Math.max(0, (30 - travelTime) / 30) * 0.4;

    // Factor 2: Bed Availability (30%)
    let bedScore = 0;
    if (h.total_beds > 0 && h.available_beds >= predictedCasualties) {
      bedScore = (h.available_beds / h.total_beds) * 0.3;
    }

    // Factor 3: Quality (20%)
    const qualityScore = ((h.quality_rating ?? 4.0) / 5) * 0.2;

    // Factor 4: Response Time (10%)
    const responseScore = Math.max(0, (20 - travelTime) / 20) * 0.1;

    // 4. FIXED: Specialty Multiplier now reads the equipment array
    let specialtyMultiplier = 1.0;
    const type = emergencyType.toLowerCase();
    
    // Convert equipment array to a lowercase string for easy searching
    const equipmentList = Array.isArray(h.equipment) ? h.equipment.join(' ').toLowerCase() : '';

    if (type.includes('chest') || type.includes('cardiac') || type.includes('arrest')) {
      specialtyMultiplier = (equipmentList.includes('cardiologist') || equipmentList.includes('cath lab')) ? 1.3 : 1.0;
    } else if (severity === 'Critical' && !h.quality_rating) { // Quality as proxy for ICU
      specialtyMultiplier = 0.7;
    }

    const totalScore = (timeScore + bedScore + qualityScore + responseScore) * specialtyMultiplier;

    results.push({ ...h, travelTime, totalScore });
  }

  return results.sort((a, b) => b.totalScore - a.totalScore).slice(0, 3);
}