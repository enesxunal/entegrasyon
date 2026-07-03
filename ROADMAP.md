# UIP Roadmap

## Phase 1 — media.v1 (Current MVP)

- Zippr.ink provider
- Basic website local agent simulator
- `image.uploaded` → `image.optimize` → `image.replace`
- Metadata-only execution logs
- Manifest + JSON Schema validation
- HMAC agent request signing

## Phase 2 — commerce.v1

- WooCommerce plugin agent
- `order.paid` event
- Order normalization schemas

## Phase 3 — invoice.v1

- Mock e-invoice provider
- `invoice.create`
- `order.mark_invoiced`

## Phase 4 — Real e-invoice integration

- Paraşüt / Bizim Hesap connectors
- UBL-TR aligned schemas

## Phase 5 — shipment.v1

- Cargo provider connectors
- `shipment.create`, tracking events

## Phase 6 — notification.v1

- SMS / email providers
- `sms.send`, `email.send`

## Phase 7 — Security hardening

- OPA/Rego policy engine
- WASM/Extism sandbox for transforms
- Customer-managed secrets
- OAuth 2.1 provider auth flows

## Phase 8 — Platform scale

- BullMQ / Redis async workers
- Trigger.dev durable execution (optional)
- SCIM user provisioning
- Enterprise self-hosted control plane
- Public provider marketplace
- AI-assisted manifest generation (design-time only)
- Complex visual workflow builder

## Infrastructure future

- Enable Supabase Row Level Security policies for workspace-level isolation
- Migrate demo auth to Supabase Auth
- Supabase Storage (if needed for non-sensitive assets only)
- Data Plane execution mode: workflows run fully on local agent
