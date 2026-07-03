import Link from "next/link";

export default function ProtocolDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <h1 className="font-bold">UIP Protocol</h1>
          <Link href="/" className="text-sm text-blue-600">
            Home
          </Link>
        </div>
      </header>
      <article className="prose prose-slate mx-auto max-w-3xl px-6 py-10">
        <h1>Universal Integration Protocol</h1>
        <p>
          UIP connects SaaS providers and customer agents using manifests,
          capabilities, events, and workflows — without storing sensitive
          business payloads in the control plane.
        </p>

        <h2>What is a provider?</h2>
        <p>
          A provider is an external SaaS service (e.g. Zippr.ink) that publishes
          capabilities like <code>image.optimize</code> through a manifest.
        </p>

        <h2>What is an agent?</h2>
        <p>
          An agent runs on the customer side (website, app, or simulator). It
          emits events and executes local capabilities. For MVP we use{" "}
          <code>local_simulator</code>.
        </p>

        <h2>What is a manifest?</h2>
        <p>
          A versioned JSON document describing service identity, auth, capabilities,
          events, schemas, and endpoints.
        </p>

        <h2>What is a capability?</h2>
        <p>
          A normalized action such as <code>image.optimize</code> or{" "}
          <code>image.replace</code> with input/output JSON schemas.
        </p>

        <h2>What is an event?</h2>
        <p>
          A trigger such as <code>image.uploaded</code> that starts matching
          workflows.
        </p>

        <h2>What is a workflow?</h2>
        <p>
          A deterministic sequence of steps connecting an event to provider and
          agent capabilities.
        </p>

        <h2>What data is stored?</h2>
        <ul>
          <li>Manifests, workflows, policies (metadata)</li>
          <li>Execution status, duration, step names</li>
          <li>Safe error codes and messages</li>
          <li>Encrypted API keys and agent signing keys</li>
        </ul>

        <h2>What data is NOT stored?</h2>
        <ul>
          <li>Full event payloads</li>
          <li>Image binary data</li>
          <li>Customer PII, orders, invoices, payments</li>
          <li>Raw secrets in logs</li>
        </ul>

        <h2>Agent request signing</h2>
        <p>Every agent request must include:</p>
        <pre>
          {`X-Agent-Id
X-Timestamp
X-Nonce
X-Signature

HMAC_SHA256(agent_secret, timestamp + "." + nonce + "." + raw_body)`}
        </pre>
        <p>Timestamp max age: 5 minutes. Nonces must be unique.</p>

        <h2>Zippr.ink demo flow</h2>
        <pre>
          {`image.uploaded → image.optimize → image.replace`}
        </pre>
        <ol>
          <li>Local agent sends signed <code>image.uploaded</code> event</li>
          <li>UIP finds active workflow</li>
          <li>Zippr.ink <code>/api/v1/images/optimize-url</code> is called</li>
          <li>Result is normalized to <code>media.image_optimize_result.v1</code></li>
          <li><code>image.replace</code> is simulated locally</li>
          <li>Metadata-only execution log is stored</li>
        </ol>

        <p>
          Set <code>ZIPPR_MODE=mock</code> for development without a real API key,
          or <code>ZIPPR_MODE=real</code> for live Zippr.ink calls.
        </p>
      </article>
    </div>
  );
}
