import { BaseFileHandler, SpeedyFile } from "./index";
export class ImageHandler extends BaseFileHandler {
  constructor() {
    super("image", ["png", "jpeg", "jpg", "gif", "bmp", "webp", "tiff"]);
  }
  async handle(
    fileData: SpeedyFile,
    getCompletion: (prompt: string) => Promise<string>,
    userPrompt?: string,
    displayName?: string
  ): Promise<string> {
    return `Below is code from a ${fileData.extension} file
    ${userPrompt ? "The user said:" + userPrompt : displayName} 
    `;
  }
}
