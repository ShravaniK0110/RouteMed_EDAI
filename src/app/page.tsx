import Link from 'next/link'

export default function RootLanding() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] space-y-8 text-center px-4">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-4 sm:text-5xl md:text-6xl">
          AmbulanceRoute <span className="text-blue-500">Pune</span>
        </h1>
        <p className="max-w-2xl mx-auto text-xl text-slate-400">
          The fast, reliable, and intelligent Uber-like ambulance booking platform.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 max-w-4xl w-full">
        <Link href="/auth/patient/signup" className="flex flex-col items-center justify-center p-8 bg-slate-900 border border-slate-800 rounded-2xl hover:border-blue-500 hover:bg-slate-800 transition-all cursor-pointer shadow-lg">
          <div className="w-16 h-16 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center mb-4 text-2xl font-bold">P</div>
          <h2 className="text-xl font-bold text-white mb-2">Patients</h2>
          <p className="text-sm text-slate-400 text-center">Book a life-saving ride instantly with live tracking.</p>
        </Link>
        <Link href="/auth/paramedic/signup" className="flex flex-col items-center justify-center p-8 bg-slate-900 border border-slate-800 rounded-2xl hover:border-green-500 hover:bg-slate-800 transition-all cursor-pointer shadow-lg">
          <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-4 text-2xl font-bold">E</div>
          <h2 className="text-xl font-bold text-white mb-2">Paramedics</h2>
          <p className="text-sm text-slate-400 text-center">Accept emergency rides and earn securely.</p>
        </Link>
        <Link href="/admin/dashboard" className="flex flex-col items-center justify-center p-8 bg-slate-900 border border-slate-800 rounded-2xl hover:border-purple-500 hover:bg-slate-800 transition-all cursor-pointer shadow-lg sm:col-span-2 md:col-span-1">
          <div className="w-16 h-16 bg-purple-500/20 text-purple-500 rounded-full flex items-center justify-center mb-4 text-2xl font-bold">A</div>
          <h2 className="text-xl font-bold text-white mb-2">Admins</h2>
          <p className="text-sm text-slate-400 text-center">Manage the platform, users, and finances.</p>
        </Link>
      </div>
    </div>
  )
}
