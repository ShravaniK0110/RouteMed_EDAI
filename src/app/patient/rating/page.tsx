'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Star, CheckCircle2 } from 'lucide-react'

const QUICK_TAGS = ['Fast Arrival', 'Clean Vehicle', 'Professional', 'Safe Driving']

export default function PatientRating() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rideId = searchParams.get('rideId')

  const [rating, setRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [fare, setFare] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Fetch the ride's fare to display on completion screen
  useEffect(() => {
    if (!rideId) return
    supabase
      .from('rides')
      .select('total_fare')
      .eq('id', rideId)
      .single()
      .then(({ data }) => {
        if (data?.total_fare) setFare(data.total_fare)
      })
  }, [rideId])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleSubmit = async () => {
    if (rating === 0 || !rideId) return
    setSubmitting(true)

    // Save rating, tags, and comment directly on the rides row
    const { error } = await supabase
      .from('rides')
      .update({
        patient_rating: rating,
        rating_tags: selectedTags,
        rating_comment: comment.trim() || null,
        rated_at: new Date().toISOString(),
      })
      .eq('id', rideId)

    if (error) {
      console.error('Rating save error:', error.message)
      // Still navigate — don't block the user over a failed rating
    }

    setSubmitted(true)
    setSubmitting(false)

    // Brief success pause then go home
    setTimeout(() => router.push('/patient/home'), 1500)
  }

  const handleSkip = () => {
    router.push('/patient/home')
  }

  // Success screen after submission
  if (submitted) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 text-green-500 mb-4">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold text-white">Thank you!</h2>
        <p className="text-slate-400">Your feedback helps improve the service.</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto py-12 space-y-8 text-center">
      {/* Header */}
      <div>
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 text-green-500 mb-6">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Ride Completed</h1>
        <p className="text-slate-400">
          {fare ? `Total Fare: ₹${fare} · Paid via Cash` : 'Your ride has ended safely.'}
        </p>
      </div>

      {/* Rating Card */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Stars */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">How was your paramedic?</h3>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="p-2 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-10 w-10 transition-colors ${
                      (hoveredStar || rating) >= star
                        ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]'
                        : 'text-slate-700'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-slate-400 text-sm mt-2">
                {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][rating]}
              </p>
            )}
          </div>

          {/* Quick tags + comment — show after star selected */}
          {rating > 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="grid grid-cols-2 gap-2">
                {QUICK_TAGS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors border ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-blue-500 hover:text-white'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white placeholder:text-slate-600 outline-none focus:border-blue-500 resize-none"
                rows={3}
                placeholder="Leave a comment... (Optional)"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={handleSkip}
          className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all"
        >
          Skip
        </button>
        <button
          onClick={handleSubmit}
          disabled={rating === 0 || submitting}
          className={`flex-[2] py-4 rounded-xl font-bold shadow-lg transition-all ${
            rating > 0 && !submitting
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          {submitting ? 'Saving...' : 'Submit Feedback'}
        </button>
      </div>
    </div>
  )
}