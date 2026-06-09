const LOG_URL = "/evaluation-service/logs";
const TOKEN = import.meta.env.VITE_ACCESS_TOKEN?.trim();

// Reusable logging function for the frontend. Mirrors the shared logging
// middleware contract and sends a structured log entry to the test server.
// Every significant frontend event should call this instead of console logging.
export async function Log(
  stack: string,
  level: string,
  pkg: string,
  message: string
): Promise<void> {
  try {
    await fetch(LOG_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        stack,
        level,
        package: pkg,
        message,
      }),
    });
  } catch {
    // Logging must never break the UI, so failures are swallowed silently.
  }
}
