import crypto from "crypto";

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

  const result = await response.json();

  if (!response.ok) {
    console.error("Event rejected:", result);
    process.exit(1);
  }

  console.log("Event accepted:");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
