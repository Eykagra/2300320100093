import * as dotenv from "dotenv";
import * as path from "path";

// Load the bearer token from the repository root .env file.
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { Log } from "./logger";

// Smoke test that verifies the middleware can reach the log server
// and create a log entry successfully.
async function test() {
  const result = await Log(
    "backend",
    "info",
    "handler",
    "Testing logger"
  );

  console.log(result);
}

test();
