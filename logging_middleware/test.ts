import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { Log } from "./logger";

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
