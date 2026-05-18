import {
  BASE_FARE_INR,
  RATE_PER_KM_INR,
  RATE_PER_MINUTE_INR,
  SURGE_CRITICAL_THRESHOLD,
  SURGE_HIGH_THRESHOLD,
  SURGE_MEDIUM_THRESHOLD,
} from './config';

export function calculateBaseFare(): number {
  return BASE_FARE_INR;
}

export function calculateDistanceCharge(distanceKm: number): number {
  return RATE_PER_KM_INR * distanceKm;
}

export function calculateTimeCharge(timeMinutes: number): number {
  return RATE_PER_MINUTE_INR * timeMinutes;
}

export function calculateSurgeMultiplier(riskScore: number): number {
  if (riskScore > SURGE_CRITICAL_THRESHOLD) return 2.0;
  if (riskScore > SURGE_HIGH_THRESHOLD)     return 1.5;
  if (riskScore > SURGE_MEDIUM_THRESHOLD)   return 1.2;
  return 1.0;
}

export function getTotalFare(distanceKm: number, timeMinutes: number, riskScore = 0): number {
  const base   = calculateBaseFare();
  const dist   = calculateDistanceCharge(distanceKm);
  const time   = calculateTimeCharge(timeMinutes);
  const surge  = calculateSurgeMultiplier(riskScore);
  return (base + dist + time) * surge;
}
