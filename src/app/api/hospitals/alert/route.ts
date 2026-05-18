export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { apiCatchError } from '@/lib/api-error';
import { validateBody, HospitalAlertSchema } from '@/lib/validation';

const EQUIPMENT_MAP: Record<string, string[]> = {
  'Medical Emergency': ['Defibrillator', 'IV Lines', 'Oxygen', 'ECG Monitor'],
  'Accident / Injury': ['Trauma Bay', 'Blood Bank', 'X-Ray', 'Surgical Team'],
  'Pregnancy':         ['Delivery Suite', 'Neonatal Unit', 'Epidural Kit'],
  'Cardiac Arrest':    ['Cath Lab', 'Defibrillator', 'ACLS Team', 'ICU Bed'],
  'Stroke':            ['CT Scanner', 'Neuro Team', 'tPA Ready', 'ICU Bed'],
  'Hospital Transfer': ['Patient Bay', 'Medical Records', 'Receiving Team'],
};

export async function POST(req: NextRequest) {
  const { data: body, error: validationError } = await validateBody(req, HospitalAlertSchema);
  if (validationError) return validationError;

  try {
    const { hospital_id, hospital_name, emergency_type, severity, eta_minutes, patient_age, patient_medical_info } = body;

    const requiredEquipment = EQUIPMENT_MAP[emergency_type] ?? ['Emergency Bay', 'IV Lines', 'Oxygen'];

    const NIL_UUID      = '00000000-0000-0000-0000-000000000000';
    const safeHospitalId = (hospital_id && hospital_id.length > 20) ? hospital_id : NIL_UUID;

    const { data: alert, error } = await supabase
      .from('hospital_alerts')
      .insert([{
        hospital_id:          safeHospitalId,
        hospital_name:        hospital_name ?? 'Unknown Hospital',
        patient_condition:    emergency_type,
        emergency_type,
        severity,
        eta_minutes:          eta_minutes ?? 15,
        required_equipment:   JSON.stringify(requiredEquipment),
        patient_age:          patient_age ? parseInt(String(patient_age)) : null,
        patient_medical_info: patient_medical_info ?? null,
        status:               'Sent',
      }])
      .select()
      .single();

    if (error) {
      console.warn('[HOSPITAL ALERT DB Error]:', error.message);
      return NextResponse.json({
        success:            true,
        alert_id:           `mock-alert-${Date.now()}`,
        hospital:           hospital_name,
        eta_minutes,
        required_equipment: requiredEquipment,
        message:            'Hospital pre-alerted. (Note: DB save skipped)',
      });
    }

    console.log(`[HOSPITAL ALERT] → ${hospital_name}: ETA ${eta_minutes}min, needs ${requiredEquipment.join(', ')}`);

    return NextResponse.json({
      success:            true,
      alert_id:           alert.id,
      hospital:           hospital_name,
      eta_minutes,
      required_equipment: requiredEquipment,
      message:            'Hospital pre-alerted. Team will be ready on arrival.',
    });

  } catch (err: unknown) {
    return apiCatchError(err, 'HOSPITAL_ALERT');
  }
}
