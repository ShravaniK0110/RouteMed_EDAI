// Define the Paramedic type — matches the actual Supabase paramedics table columns
export interface Paramedic {
  id: string;
  current_lat: number | null;
  current_lng: number | null;
  average_rating?: number | null;
  vehicle_registration?: string;
}

// 1. Haversine Formula for Distance Calculation
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 2. Base Scoring Algorithm (40/30/20/10 logic)
export function calculateParamedicScore(
  paramedic: Paramedic,
  distanceKm: number,
  emergencyType: string,
  specialReqs: string[]
): number {
  let score = 100;

  // Penalty for distance (-5 points per km)
  score -= (distanceKm * 5);

  // Bonus for high ratings
  if (paramedic.average_rating) {
    score += (paramedic.average_rating * 2);
  }

  return Math.max(0, score);
}