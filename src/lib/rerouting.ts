import { ML_URL } from './config';

export async function checkForBetterRoute(
  rideId: string,
  lat: number,
  lng: number
) {
  try {

    const now = new Date();

    const response = await fetch(
      `${ML_URL}/predict/traffic`,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          ride_id: rideId,
          current_lat: lat,
          current_lng: lng,

          // ML inputs
          hour: now.getHours(),
          day_of_week: now.getDay(),

          // fallback demo values
          route_id: 'R1',
          weather: 'Clear'
        }),
      }
    );

    if (!response.ok) {

      console.error(
        '[REROUTE ERROR] ML server failed'
      );

      return {
        suggestReroute: false
      };
    }

    const data = await response.json();

    console.log(
      '[REROUTE ML RESPONSE]',
      data
    );

    // FIX:
    // Now compatible with Flask response

    if (
      data.alternative_route === true &&
      data.time_saved > 2
    ) {

      return {
        suggestReroute: true,

        newRouteName:
          data.alternative_route_name ||
          'Optimized Route',

        timeSaved:
          data.time_saved || 0,

        predictedTravelMinutes:
          data.predicted_travel_minutes || null
      };
    }

    return {
      suggestReroute: false,
      predictedTravelMinutes:
        data.predicted_travel_minutes || null
    };

  } catch (error) {

    console.error(
      '[REROUTING AI ERROR]',
      error
    );

    return {
      suggestReroute: false
    };
  }
}