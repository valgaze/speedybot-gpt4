import { SpeedyFile } from "speedybot-mini";
export { SpeedyFile };
type FileCategory =
  | "image" // not prompt'able, give back url
  | "plaintext" // "markup"
  | "spreadsheet"
  | "code" //   | "stylesheet"
  | "document" // word doc
  | "config" // json and blars
  | "pdf"
  | "no handle";

interface FileHandler {
  category: FileCategory;
  extensions: string[];
  handle: (
    fileData: SpeedyFile,
    getCompletion: (prompt: string) => Promise<string>,
    userPrompt?: string,
    displayName?: string
  ) => Promise<string>;
}

export abstract class BaseFileHandler implements FileHandler {
  category: FileCategory;
  extensions: string[];

  constructor(category: FileCategory, extensions: string[]) {
    this.category = category;
    this.extensions = extensions;
  }

  abstract handle(
    fileData: SpeedyFile,
    getCompletion: (prompt: string) => Promise<string>,
    userPrompt?: string,
    displayName?: string
  ): Promise<string>;
}

// Add more handlers for the new categories here

export class FileProcessor {
  private handlers: FileHandler[] = [];

  registerHandler(handler: FileHandler) {
    this.handlers.push(handler);
  }

  registerHandlers(...handlers: FileHandler[]) {
    this.handlers.push(...handlers);
  }

  async process(
    fileData: SpeedyFile,
    getCompletion: (prompt: string) => Promise<string>,
    userPrompt?: string,
    displayName?: string
  ): Promise<string> {
    const handler = this.handlers.find((h) =>
      h.extensions.includes(fileData.extension.toLowerCase())
    );

    if (!handler) {
      return `Sorry, ${fileData.extension} files are not supported for analysis yet`;
    }

    return handler.handle(fileData, getCompletion, userPrompt, displayName);
  }
}
