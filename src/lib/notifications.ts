import { supabase } from './supabase';

// Insert a notification record — Supabase Realtime delivers it to the frontend instantly
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data: Record<string, any> = {},
  userType: 'patient' | 'paramedic' | 'hospital' = 'patient'
): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .insert([{ user_id: userId, user_type: userType, title, body, data }]);

  if (error) {
    console.error('[Notification Error]', error.message);
    return false;
  }

  return true;
}

// Convenience wrappers for each event type
export async function notifyParamedicNewRide(paramedicId: string, rideId: string, emergencyType: string) {
  return sendPushNotification(
    paramedicId,
    '🚨 New Emergency Ride',
    `${emergencyType} nearby. Accept within 30 seconds.`,
    { ride_id: rideId, action: 'new_ride' },
    'paramedic'
  );
}

export async function notifyPatientRideAccepted(patientId: string, paramedicName: string, etaMinutes: number) {
  return sendPushNotification(
    patientId,
    '✅ Ambulance On The Way',
    `${paramedicName} accepted your request. ETA: ${etaMinutes} mins.`,
    { action: 'ride_accepted' },
    'patient'
  );
}

export async function notifyHospitalAlert(hospitalId: string, emergencyType: string, etaMinutes: number) {
  return sendPushNotification(
    hospitalId,
    '🏥 Incoming Patient Alert',
    `${emergencyType} patient arriving in ~${etaMinutes} mins. Prepare equipment.`,
    { action: 'hospital_alert' },
    'hospital'
  );
}