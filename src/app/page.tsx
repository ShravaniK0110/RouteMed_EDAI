import Link from 'next/link'

export default function RootLanding() {
  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <header className="border-b border-primary/20 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent rounded-sm flex items-center justify-center">
            <span className="text-white text-xs font-mono font-bold">RM</span>
          </div>
          <span className="font-semibold text-ink tracking-tight">RouteMed</span>
          <span className="text-dark/50 text-sm hidden sm:block">· Pune Emergency Dispatch</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-3xl w-full">
          <div className="flex items-center gap-2 mb-8">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-mono text-dark/60 uppercase tracking-widest">System Operational</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-ink leading-tight mb-4 tracking-tight">
            Emergency response,<br />
            <span className="text-primary">where it counts.</span>
          </h1>
          <p className="text-dark text-lg mb-12 max-w-xl leading-relaxed">
            Intelligent ambulance dispatch for Pune. GPS routing, live tracking, and ML-optimised hospital matching.
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <Link
              href="/auth/patient/signup"
              className="group border-2 border-primary/20 bg-paper hover:border-primary hover:bg-white rounded-xl p-6 transition-all shadow-warm hover:shadow-warm-lg"
            >
              <div className="mb-4">
                <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-widest text-primary/60 mb-2">Portal 01</span>
                <h2 className="text-xl font-bold text-ink group-hover:text-primary transition-colors">Patients</h2>
              </div>
              <p className="text-sm text-dark leading-relaxed">Book emergency transport. Live GPS tracking. ML-matched hospitals.</p>
              <div className="mt-5 flex items-center gap-1 text-xs font-mono font-bold text-primary">
                Enter <span className="ml-1 group-hover:translate-x-1 transition-transform inline-block">→</span>
              </div>
            </Link>

            <Link
              href="/auth/paramedic/signup"
              className="group border-2 border-primary/20 bg-paper hover:border-primary hover:bg-white rounded-xl p-6 transition-all shadow-warm hover:shadow-warm-lg"
            >
              <div className="mb-4">
                <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-widest text-primary/60 mb-2">Portal 02</span>
                <h2 className="text-xl font-bold text-ink group-hover:text-primary transition-colors">Paramedics</h2>
              </div>
              <p className="text-sm text-dark leading-relaxed">Accept dispatches, navigate to patients, track earnings securely.</p>
              <div className="mt-5 flex items-center gap-1 text-xs font-mono font-bold text-primary">
                Enter <span className="ml-1 group-hover:translate-x-1 transition-transform inline-block">→</span>
              </div>
            </Link>

            <Link
              href="/admin/dashboard"
              className="group border-2 border-primary/20 bg-paper hover:border-primary hover:bg-white rounded-xl p-6 transition-all shadow-warm hover:shadow-warm-lg"
            >
              <div className="mb-4">
                <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-widest text-primary/60 mb-2">Portal 03</span>
                <h2 className="text-xl font-bold text-ink group-hover:text-primary transition-colors">Admin</h2>
              </div>
              <p className="text-sm text-dark leading-relaxed">Fleet oversight, user management, live ops dashboard, financials.</p>
              <div className="mt-5 flex items-center gap-1 text-xs font-mono font-bold text-primary">
                Enter <span className="ml-1 group-hover:translate-x-1 transition-transform inline-block">→</span>
              </div>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-primary/10 px-8 py-4 text-center">
        <span className="text-xs text-dark/40 font-mono">Built for Pune</span>
      </footer>
    </div>
  )
}