// Utility for calculating fares
export function calculateBaseFare(): number {
  return 50.0 // Base fare for ambulance in INR
}

export function calculateDistanceCharge(distanceKm: number): number {
  return 15.0 * distanceKm
}

export function calculateTimeCharge(timeMinutes: number): number {
  return 1.0 * timeMinutes
}

export function calculateSurgeMultiplier(riskScore: number): number {
  // If risk score from ML is high (e.g., > 70), surge pricing applies
  if (riskScore > 80) return 2.0
  if (riskScore > 60) return 1.5
  if (riskScore > 40) return 1.2
  return 1.0
}

export function getTotalFare(distanceKm: number, timeMinutes: number, riskScore: number = 0): number {
  const base = calculateBaseFare()
  const dist = calculateDistanceCharge(distanceKm)
  const time = calculateTimeCharge(timeMinutes)
  const surge = calculateSurgeMultiplier(riskScore)

  return (base + dist + time) * surge
}
