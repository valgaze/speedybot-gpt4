import { BaseFileHandler, SpeedyFile } from "./index";
import * as XLSX from "xlsx";
import { Sheet2JSONOpts, WorkSheet, ParsingOptions } from "xlsx";
const { utils, read } = XLSX;

class XlsHelper {
  public $utils = utils;
  public WorkBookInst: XLSX.WorkBook;
  constructor(buf: unknown, opts: ParsingOptions = {}) {
    this.WorkBookInst = read(buf, opts);
  }

  /**
   *
   * Get first/default sheet's JSON representation
   */
  public getJSON<T = unknown>(
    sheet?: WorkSheet,
    config: Sheet2JSONOpts = {}
  ): T[] {
    if (sheet) {
      return utils.sheet_to_json(sheet, config);
    } else {
      const defaultSheet = this.getFirstSheet();
      return utils.sheet_to_json(defaultSheet, config);
    }
  }

  public getHTML(sheet: WorkSheet) {
    return utils.sheet_to_html(sheet);
  }

  public getJSONBySheetName(name: string, opts: Sheet2JSONOpts): unknown {
    const sheet = this.getSheetByName(name);
    return utils.sheet_to_json(sheet, opts);
  }

  public getJSONByIndex(
    idx: string | number,
    config: Sheet2JSONOpts = {}
  ): unknown {
    const sheetNames = this.getSheetNames();
    const sheetName = sheetNames[Number(idx)];
    const sheet = this.getSheetByName(sheetName);
    return this.getJSON(sheet, config);
  }

  public getSheetByName(name): WorkSheet {
    const idx = this.getSheetIndexByName(name);
    if (idx >= 0) {
      const sheet = this.WorkBookInst.Sheets[name];
      return sheet;
    } else {
      throw new Error(`Sheet with name '${name}' does not exist`);
    }
  }

  public getSheetByIndex(index: number) {
    const sheetNames = this.getSheetNames();
    if (index > sheetNames.length - 1) {
      throw new Error(
        `${index} is not  a valid index (max of ${sheetNames.length - 1})`
      );
    } else {
      const name = sheetNames[index];
      return this.getSheetByName(name);
    }
  }

  public getFirstSheet() {
    return this.getSheetByIndex(0);
  }

  public getWorkbook() {
    return this.WorkBookInst;
  }

  public getSheetIndexByName(name: string) {
    return this.getSheetNames().indexOf(name);
  }

  public getSheetNames(): string[] {
    return this.WorkBookInst.SheetNames;
  }
}
export class SpreadsheetHandler extends BaseFileHandler {
  constructor() {
    super("spreadsheet", ["xlsx", "xls"]);
  }

  async handle(
    fileData: SpeedyFile,
    getCompletion: (prompt: string) => Promise<string>,
    userPrompt?: string,
    displayName?: string
  ): Promise<string> {
    console.log("## xlsx");
    const prompt = `
    The data below is a json representation of a spreadsheet extracted using xlsx
    Filename (before conversion): ${fileData.fileName}
    ${
      userPrompt ||
      "Please analyze this spreadsheet that has been transformed into json"
    }
    ${JSON.stringify(this.getJSON(fileData.data))}`;
    const response = await getCompletion(prompt);
    return response;
  }

  getJSON(dataBuffer: unknown) {
    const inst = new XlsHelper(dataBuffer);
    const sheet = inst.getFirstSheet();
    const jsonData = inst.getJSON(sheet);
    return jsonData;
  }
}
