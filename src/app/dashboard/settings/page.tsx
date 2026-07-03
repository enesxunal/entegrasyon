export default function SettingsPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Settings</h1>
      <p className="mb-8 text-slate-600">Workspace and platform configuration.</p>

      <div className="space-y-4">
        <div className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold">Workspace</h2>
          <p className="mt-2 text-sm text-slate-600">Demo Workspace (MVP)</p>
        </div>
        <div className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold">Zippr Mode</h2>
          <p className="mt-2 text-sm text-slate-600">
            Server ZIPPR_MODE: {process.env.ZIPPR_MODE ?? "mock"} (set via
            environment variable)
          </p>
        </div>
        <div className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold">Future</h2>
          <ul className="mt-2 list-inside list-disc text-sm text-slate-600">
            <li>Supabase Auth migration</li>
            <li>Supabase Row Level Security</li>
            <li>OAuth 2.1 provider connections</li>
            <li>SCIM user provisioning</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
