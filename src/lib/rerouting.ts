import { supabase } from './supabase';
import { ML_URL } from './config';

export async function checkForBetterRoute(rideId: string, lat: number, lng: number) {
  try {
    const response = await fetch(`${ML_URL}/predict/traffic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ride_id: rideId, current_lat: lat, current_lng: lng }),
    });

    if (!response.ok) return { suggestReroute: false };

    const data = await response.json();

    if (data.alternative_route && data.time_saved > 2) {
      return {
        suggestReroute: true,
        newRouteName: data.alternative_route_name,
        timeSaved: data.time_saved,
      };
    }

    return { suggestReroute: false };
  } catch (error) {
    console.error('Rerouting AI Error:', error);
    return { suggestReroute: false };
  }
}
