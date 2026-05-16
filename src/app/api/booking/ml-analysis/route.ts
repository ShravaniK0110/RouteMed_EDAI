// src/app/api/booking/ml-analysis/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { selectOptimalHospital } from '@/lib/algorithms'

export async function POST(req: NextRequest) {
  try {
    const { latitude, longitude, emergencyType, severity } = await req.json()

    const patientLoc = {
      lat: latitude ?? 18.5204,
      lng: longitude ?? 73.8567,
    }

    const topHospitals = await selectOptimalHospital(patientLoc, emergencyType, severity)

    if (!topHospitals || topHospitals.length === 0) {
      return NextResponse.json({ error: 'No hospitals found in database' }, { status: 404 })
    }

    const best = topHospitals[0]

    const factors = [
      `Travel Time Score: ${((best.timeScore ?? 0) * 100).toFixed(0)}% (40% weight) — ETA ~${(best.travelTime ?? 0).toFixed(1)} min`,
      `Bed Availability Score: ${((best.bedScore ?? 0) * 100).toFixed(0)}% (30% weight) — ${best.availableBeds ?? 0}/${best.totalBeds ?? 0} beds free`,
      `Hospital Quality Score: ${((best.qualityScore ?? 0) * 100).toFixed(0)}% (20% weight) — ${best.quality ?? 0}/5 stars`,
      `Response Time Score: ${((best.responseScore ?? 0) * 100).toFixed(0)}% (10% weight)`,
      `Specialty Multiplier: ${best.specialtyMultiplier ?? 1}x — ${(best.specialtyMultiplier ?? 1) > 1 ? '✅ Matched specialty for this emergency' : (best.specialtyMultiplier ?? 1) < 1 ? '⚠️ Critical care penalty applied' : 'No specialty bonus'}`,
      `Final Score: ${((best.totalScore ?? 0) * 100).toFixed(1)} / 100`,
    ]

    const equipmentList: string[] = Array.isArray(best.equipment)
      ? best.equipment
      : []

    return NextResponse.json({
      selectedHospital: {
        id: best.id,
        name: best.name,
        lat: best.lat,
        lng: best.lng,
        beds: best.availableBeds,
        equipment: equipmentList,
        distance: parseFloat((best.travelTime ?? 0).toFixed(1)),
        quality: best.quality,
      },
      allTopHospitals: topHospitals.map((h: any) => ({
        name: h.name,
        score: ((h.totalScore ?? 0) * 100).toFixed(1),
        beds: h.availableBeds,
        eta: (h.travelTime ?? 0).toFixed(1),
      })),
      analysis: {
        reason: `Selected ${best.name} using weighted ML scoring across 4 factors + specialty match:`,
        factors,
      },
      mlPredictions: {
        traffic_severity: (best.travelTime ?? 0) > 15 ? 'High' : 'Normal',
        is_high_demand: (best.totalScore ?? 0) < 0.4,
        predicted_casualties: 1,
      },
      rideId: `ride_${Date.now()}`,
    })
  } catch (error) {
    console.error('ML Analysis error:', error)
    return NextResponse.json({ error: 'Analysis failed', details: String(error) }, { status: 500 })
  }
}