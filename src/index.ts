import "cross-fetch/polyfill";
// import { FormData } from "formdata-node";
// globalThis.FormData = FormData;
import dotenv from "dotenv";
import { logoRoll } from "speedybot-mini";
import path from "path";
import { Websocket } from "./utils";

// Expects .env to get token on BOT_TOKEN
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import CultureBot from "./../settings/config";

const token = process.env.BOT_TOKEN as string;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string;
if (!token) {
  console.log("\n## Token missing (check .env file)");
  process.exit(0);
}
main(token, OPENAI_API_KEY);

async function main(token: string, OPEN_AI_KEY: string) {
  CultureBot.setToken(token);
  CultureBot.addSecret("OPENAI_API_KEY", OPEN_AI_KEY);
  const inst = new Websocket(token);
  await inst.start();
  console.log(logoRoll());
  console.log("Websockets Registered. Listening...");
  const selfData = await inst.getSelf(true);
  const { displayName, emails } = selfData;
  const [email] = emails;
  console.log(`🤖 You can contact your agent '${displayName}' here: ${email}`);

  inst.on("message", (websocketEvent: any) => {
    // send to processing incoming websocket
    CultureBot.processIncoming(websocketEvent);
  });

  inst.on("submit", (websocketSubmitEvent: any) => {
    CultureBot.processIncoming(websocketSubmitEvent);
  });
}
