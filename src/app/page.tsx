import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="text-lg font-semibold">UIP</div>
        <div className="flex gap-4">
          <Link href="/docs/protocol" className="text-sm text-slate-600 hover:text-slate-900">
            Protocol Docs
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-20 text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-wide text-blue-600">
          Universal Integration Platform
        </p>
        <h1 className="mb-6 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
          Connect SaaS services to websites without storing customer data.
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-600">
          A local-agent based integration control plane for SaaS providers and
          custom websites. UIP manages manifests, workflows, agents, and
          execution metadata. Sensitive business data is processed by your local
          agent whenever possible.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
          >
            Open Dashboard
          </Link>
          <Link
            href="/docs/protocol"
            className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 hover:bg-slate-50"
          >
            Read Protocol Docs
          </Link>
        </div>
      </main>
    </div>
  );
}
