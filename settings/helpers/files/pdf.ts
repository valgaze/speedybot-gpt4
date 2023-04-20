import { PDFExtract, PDFExtractOptions } from "pdf.js-extract";
const pdfExtract = new PDFExtract();
export interface m {
  firstPage?: number; // default:`1` - start extract at page nr
  lastPage?: number; //  stop extract at page nr, no default value
  password?: string; //  for decrypting password-protected PDFs., no default value
  verbosity?: number; // default:`-1` - log level of pdf.js
  normalizeWhitespace?: boolean; // default:`false` - replaces all occurrences of whitespace with standard spaces (0x20).
  disableCombineTextItems?: boolean; // default:`false` - do not attempt to combine  same line {@link TextItem}'s.
}

import { BaseFileHandler, SpeedyFile } from "./index";

export class PDFHelper extends BaseFileHandler {
  constructor() {
    super("pdf", ["pdf"]);
  }

  async extract(buffer, opts: PDFExtractOptions = {}) {
    return new Promise((resolve, reject) => {
      pdfExtract.extractBuffer(buffer, opts, (err, data) => {
        if (err) return reject(err);
        resolve(data);
      });
    });
  }

  async handle(
    fileData: SpeedyFile,
    getCompletion: (prompt: string) => Promise<string>,
    userPrompt?: string,
    displayName?: string
  ): Promise<string> {
    const plainText = await this.extract(fileData.data);
    const prompt = `
The data below is plaintext extracted from a ${fileData.extension} file
Filename: ${fileData.fileName}
${userPrompt || "Please analyze this document with a summary"}
${JSON.stringify(plainText)}`;
    const response = await getCompletion(prompt);
    return response;
  }
}
