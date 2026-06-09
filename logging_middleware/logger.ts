const TOKEN = process.env.ACCESS_TOKEN?.trim();

/**
 * Reusable logging function that sends a structured log entry to the
 * evaluation test server. Every significant event in the application
 * should call this instead of using console logging.
 *
 * @param stack   Where the log originates: "backend" or "frontend".
 * @param level   Severity: "debug" | "info" | "warn" | "error" | "fatal".
 * @param pkg     The package/module raising the log (e.g. "handler", "db").
 * @param message Descriptive, context-rich message about what happened.
 * @returns       The parsed JSON response from the log server, or undefined on failure.
 */
export async function Log(
  stack: string,
  level: string,
  pkg: string,
  message: string
) {
  try {
    const response = await fetch(
      "http://4.224.186.213/evaluation-service/logs",
      {
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
      }
    );

    return await response.json();
  } catch (error) {
    console.error(error);
  }
}
