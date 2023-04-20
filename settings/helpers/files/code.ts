import { BaseFileHandler, SpeedyFile } from "./index";

export class CodeHandler extends BaseFileHandler {
  constructor() {
    super("code", [
      "json",
      "js",
      "jsx",
      "ts",
      "tsx",
      "py",
      "java",
      "cs",
      "cpp",
      "hpp",
      "h",
      "php",
      "rb",
      "go",
      "rs",
      "swift",
      "kt",
      "kts",
      "sh",
      "bash",
      "zsh",
      "ps1",
      "psm1",
      "html",
      "htm",
      "xml",
      "yaml",
      "yml",
      "md",
      "markdown",
    ]);
  }

  async handle(
    fileData: SpeedyFile,
    getCompletion: (prompt: string) => Promise<string>,
    userPrompt?: string,
    displayName?: string
  ): Promise<string> {
    const easyDecode = new TextDecoder("utf-8").decode(fileData.data);
    const prompt = `Below is code/data from a file named ${fileData.fileName}. 
Explain the contents in a sharp, incisive, accurate manner. 
If the user adds any instructions below, follow those with 100% intensity
${userPrompt ? "The user " + displayName + "said:" + userPrompt : ""}
    ${easyDecode}`;
    const response = await getCompletion(prompt);
    return response;
  }
}
