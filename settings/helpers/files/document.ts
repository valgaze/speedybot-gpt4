import { extractRawText } from "mammoth";
import { BaseFileHandler, SpeedyFile } from "./index";
export class DocumentHandler extends BaseFileHandler {
  constructor() {
    super("document", ["doc", "docx"]);
  }

  async handle(
    fileData: SpeedyFile,
    getCompletion: (prompt: string) => Promise<string>,
    userPrompt?: string,
    displayName?: string
  ): Promise<string> {
    const plainText = await extractRawText({ buffer: fileData.data });
    const prompt = `
The data below is plaintext extracted from a ${fileData.extension} file
Filename: ${fileData.fileName}
${userPrompt || "Please analyze this document with a summary"}
${plainText.value}`;
    const response = await getCompletion(prompt);
    return response;
  }
}
