import Link from "next/link";

export default function ZipprIntegrationDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <h1 className="font-bold">Zippr.ink + UIP Integration</h1>
          <Link href="/" className="text-sm text-blue-600">
            Home
          </Link>
        </div>
      </header>
      <article className="prose prose-slate mx-auto max-w-3xl px-6 py-10">
        <h1>Zippr.ink as UIP Provider</h1>
        <p>
          Zippr.ink does <strong>not</strong> need UIP code installed inside it.
          UIP calls Zippr&apos;s existing REST API — like any external client.
        </p>

        <h2>Architecture</h2>
        <pre>
          {`Customer Website
    → UIP Agent (signed event: image.uploaded)
    → UIP Control Plane (workflow)
    → Zippr.ink API (POST /api/v1/images/optimize-url)
    → Result back to agent / metadata logged in UIP`}
        </pre>

        <h2>What Zippr.ink provides</h2>
        <ul>
          <li>REST API: optimize-url, optimize, jobs</li>
          <li>API keys: zippr_test_... / zippr_live_...</li>
          <li>OpenAPI: /openapi.json</li>
        </ul>

        <h2>What UIP provides</h2>
        <ul>
          <li>Provider manifest (image.optimize capability)</li>
          <li>Customer workspace + agent registration</li>
          <li>Workflow: image.uploaded → optimize → replace</li>
          <li>Encrypted storage of customer Zippr API keys</li>
          <li>Metadata-only execution logs (no image payload storage)</li>
        </ul>

        <h2>Customer onboarding flow</h2>
        <ol>
          <li>Register at UIP (/register)</li>
          <li>Connect Zippr API key (Dashboard → Providers → Zippr.ink)</li>
          <li>Install agent on their server (or use demo site to test)</li>
          <li>Upload image → workflow runs → Zippr optimizes</li>
        </ol>

        <h2>Real vs mock mode</h2>
        <table>
          <thead>
            <tr>
              <th>ZIPPR_MODE</th>
              <th>Behavior</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>mock</td>
              <td>Fake optimization response (no Zippr API call)</td>
            </tr>
            <tr>
              <td>real</td>
              <td>Calls live Zippr.ink API with workspace API key</td>
            </tr>
          </tbody>
        </table>

        <h2>Future: Zippr-side enhancements</h2>
        <ul>
          <li>Zippr dashboard: &quot;Connect to UIP&quot; button</li>
          <li>OAuth instead of API key paste</li>
          <li>Webhook: job.completed → notify customer agent</li>
          <li>UIP listed as official Zippr integration partner</li>
        </ul>

        <h2>API reference</h2>
        <p>
          Zippr optimize URL endpoint used by UIP connector:
        </p>
        <pre>
          {`POST https://zippr.ink/api/v1/images/optimize-url
Authorization: Bearer zippr_live_...
Content-Type: application/json

{
  "image_url": "https://example.com/photo.jpg",
  "quality": 80,
  "format": "webp",
  "max_width": 1600,
  "strip_metadata": true
}`}
        </pre>
      </article>
    </div>
  );
}
