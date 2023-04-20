import { PersonaKeyStrings } from "../personas";
export { SpeedyBotWithStorage } from "./storage/index";
export { OpenAIHelper } from "./openai";
export { Debug } from "./debug";
import { Message } from "./openai";

export type APP_CONFIG = {
  conversation_depth: number; // how many "rounds" of conversation to permit for token limit
  includePersonalDetails: boolean; // add user name to prompt
  validUsers: string[]; // List of permitted users by email address
  requestRoomId?: string; // roomId to send access requests
  superpowers: boolean; // Use (✨experimental✨ superpowers repo)
};
export type ChatHistory = {
  threads: {
    [key: string]: {
      count: number;
      history: Message[];
    };
  };
  selectedPersona: PersonaKeyStrings;
};

export const DEFAULT_HISTORY: ChatHistory = {
  selectedPersona: "MM", // change default to name of exported persona
  threads: {},
};

export const EMOJI_ROSTER = {
  pick: (arr: any[]) => arr[Math.floor(Math.random() * arr.length)],
  creative: ["✨", "🚀", "🎨", "🏝️", "👹"],
  business: ["📊", "📈", "📎", "🗂️", "🗃️"],
};

// Super Powers: eventing/integration system
export { superPowerPrompt } from "./superpowers";

// File processors

export { FileProcessor } from "./files/index";

// png, jpeg, etc
export { ImageHandler } from "./files/image";
// xlsx, xls,
export { SpreadsheetHandler } from "./files/spreadsheet";

// Code: "json","js","jsx","ts","tsx","py","java","cs","cpp","hpp","h","php","rb","go","rs","swift","kt","kts","sh","bash","zsh","ps1","psm1","html","htm","xml","yaml","yml","md","markdown"
export { CodeHandler } from "./files/code";

// Plaintext
export { PlainTextHandler } from "./files/plaintext";

// Docx, doc
export { DocumentHandler } from "./files/document";

// pdf
export { PDFHelper } from "./files/pdf";

// edit a message
export const editMessage = async (
  messageId: string,
  roomId: string,
  content: string,
  auth: string
): Promise<any> => {
  const url = `https://webexapis.com/v1/messages/${messageId}`;
  const headers = {
    Authorization: `Bearer ${auth}`,
    "Content-Type": "application/json",
  };
  const body = {
    roomId,
    markdown: content,
  };
  const options = {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  };

  const response = await fetch(url, options);
  return response.json();
};

export const pause = (seconds: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};
