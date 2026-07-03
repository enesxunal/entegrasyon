import crypto from "crypto";
import fs from "fs";
import path from "path";

function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile();

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const AGENT_ID = process.env.AGENT_TEST_ID;
const AGENT_SECRET = process.env.AGENT_TEST_SECRET;

function parseArgs() {
  const args = process.argv.slice(2);
  let imageUrl = "https://example.com/demo-image.jpg";

  for (const arg of args) {
    if (arg.startsWith("--image-url=")) {
      imageUrl = arg.replace("--image-url=", "");
    }
  }

  return { imageUrl };
}

function signRequest(
  secret: string,
  timestamp: string,
  nonce: string,
  rawBody: string
) {
  const payload = `${timestamp}.${nonce}.${rawBody}`;
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

async function main() {
  if (!AGENT_ID || !AGENT_SECRET) {
    console.error(
      "Missing AGENT_TEST_ID or AGENT_TEST_SECRET environment variables."
    );
    console.error(
      "Create an agent in the dashboard and set these in your .env file."
    );
    process.exit(1);
  }

  if (
    AGENT_ID.includes("buraya") ||
    AGENT_SECRET.includes("buraya") ||
    AGENT_SECRET.length < 20
  ) {
    console.error("AGENT_TEST_ID and AGENT_TEST_SECRET look like placeholders.");
    console.error("Dashboard → Agents → Create Agent → copy real ID and secret into .env");
    process.exit(1);
  }

  const { imageUrl } = parseArgs();

  const event = {
    event_id: `evt_${Date.now()}`,
    event_type: "image.uploaded",
    source: "basic_site_agent",
    created_at: new Date().toISOString(),
    data: {
      image_url: imageUrl,
      filename: "demo-image.jpg",
      mime_type: "image/jpeg",
      size_bytes: 850000,
    },
  };

  const rawBody = JSON.stringify(event);
  const timestamp = String(Date.now());
  const nonce = crypto.randomBytes(16).toString("hex");
  const signature = signRequest(AGENT_SECRET, timestamp, nonce, rawBody);

  console.log(`Sending image.uploaded event to ${APP_URL}/api/agent/events`);
  console.log(`  image_url: ${imageUrl}`);

  const response = await fetch(`${APP_URL}/api/agent/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Agent-Id": AGENT_ID,
      "X-Timestamp": timestamp,
      "X-Nonce": nonce,
      "X-Signature": signature,
    },
    body: rawBody,
  });

  const responseText = await response.text();
  let result: unknown = null;
  try {
    result = responseText ? JSON.parse(responseText) : null;
  } catch {
    console.error(`Server returned HTTP ${response.status} (not JSON):`);
    console.error(responseText || "(empty body)");
    process.exit(1);
  }

  if (!response.ok) {
    console.error(`Event rejected (HTTP ${response.status}):`, result);
    process.exit(1);
  }

  console.log("Event accepted:");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
