import { BaseFileHandler, SpeedyFile } from "./index";
export class PlainTextHandler extends BaseFileHandler {
  constructor() {
    super("plaintext", ["txt", "log", "csv"]);
  }

  async handle(
    fileData: SpeedyFile,
    getCompletion: (prompt: string) => Promise<string>,
    userPrompt?: string,
    displayName?: string
  ): Promise<string> {
    // const plainText = new TextDecoder("utf-8").decode(fileData.data);
    const plainText = fileData.data.replace(/\u0000/g, "");
    const prompt = `Below is text from a file named ${fileData.fileName}. 
Explain the contents in a sharp, incisive, accurate manner. 
If the user adds any instructions below, follow those with 100% intensity
${userPrompt ? "The user " + displayName + "said:" + userPrompt : ""}
${plainText}`;
    const response = await getCompletion(prompt);
    return response;
  }
}
