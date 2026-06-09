import * as dotenv from "dotenv";
import * as path from "path";

// Load the bearer token from the repository root .env file.
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { Log } from "../logging_middleware/logger";
import { Notification } from "./types";
import { fetchNotifications, selectTopN } from "./service";

const TOP_N = 10;

// Prints the priority inbox to the console in a readable form.
function printTopN(items: Notification[]): void {
  console.log(`\nPriority Inbox - Top ${items.length} Notifications\n`);
  items.forEach((item, i) => {
    const rank = String(i + 1).padStart(2, " ");
    const type = item.Type.padEnd(10, " ");
    console.log(`${rank}. [${type}] ${item.Timestamp}  ${item.Message}`);
  });
}

async function main(): Promise<void> {
  try {
    const notifications = await fetchNotifications();
    const top = selectTopN(notifications, TOP_N);

    await Log(
      "backend",
      "info",
      "handler",
      `selected top ${top.length} priority notifications`
    );

    printTopN(top);
  } catch (error) {
    await Log(
      "backend",
      "fatal",
      "handler",
      `priority inbox failed: ${(error as Error).message}`
    );
    console.error(error);
  }
}

main();
