import { supabase } from './supabase';

// Fix 4: Use environment variable with a fallback for local development
const ML_URL = process.env.ML_BACKEND_URL || 'http://localhost:5001';

export async function checkForBetterRoute(rideId: string, lat: number, lng: number) {
  try {
    // Calling the ML service to predict traffic on alternative routes
    // Fix 4: Replaced hardcoded URL with dynamic ML_URL
    const response = await fetch(`${ML_URL}/predict/traffic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ride_id: rideId,
        current_lat: lat,
        current_lng: lng
      })
    });

    if (!response.ok) return { suggestReroute: false };

    const data = await response.json();
    
    // Logic to determine if the new route is significantly faster
    if (data.alternative_route && data.time_saved > 2) {
      return {
        suggestReroute: true,
        newRouteName: data.alternative_route_name,
        timeSaved: data.time_saved
      };
    }

    return { suggestReroute: false };
  } catch (error) {
    console.error("Rerouting AI Error:", error);
    return { suggestReroute: false };
  }
}