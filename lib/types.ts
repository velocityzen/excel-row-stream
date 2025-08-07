import type { Entry } from "unzipper";

export interface XmlNode {
  name: string;
  text: string;
  attributes: Record<string, string>;
}

export interface RowWithValues {
  index: number;
  values: unknown[];
}

export interface RowWithColumns {
  index: number;
  columns: Record<string, unknown>;
}

export type RowAsObject = Record<string, unknown>;

export interface Cell {
  id: string;
  value: unknown;
  formula: boolean;
}

export enum EntryType {
  Info = "info",
  Rels = "rels",
  Styles = "styles",
  SharedStrings = "sharedstrings",
  Sheet = "sheet",
}

export interface WorkBookInfo {
  sheetRelationshipsNames: Record<string, string>;
  date1904: boolean;
}

export interface EntryParserResultInfo {
  type: EntryType.Info;
  value: WorkBookInfo;
}

export interface WorkBookRels {
  sheetRelationships: Record<string, string>;
}

export interface EntryParserResultRels {
  type: EntryType.Rels;
  value: WorkBookRels;
}

export interface WorkBookStyles {
  hasFormatCodes: boolean;
  formatCodes: Record<string, string>;
  workBookStyles: XmlNode[];
  xfs: XmlNode[];
}

export interface EntryParserResultStyles {
  type: EntryType.Styles;
  value: WorkBookStyles;
}

export type WorkBookSharedStrings = string[];

export interface EntryParserResultSharedStrings {
  type: EntryType.SharedStrings;
  value: WorkBookSharedStrings;
}

export interface WorkSheet {
  id: number;
  path: string;
}

export type DeferredWorkSheet = WorkSheet & {
  tmpFilePath: string;
  cleanupCallback: () => void;
};

export interface EntryParserResultSheet {
  type: EntryType.Sheet;
  value: WorkSheet;
}

export interface EntryParserResultIgnore {
  type: "ignore";
  value: string; // this will have ingored entry name
}

export type EntryParserResult =
  | EntryParserResultIgnore
  | EntryParserResultInfo
  | EntryParserResultRels
  | EntryParserResultStyles
  | EntryParserResultSharedStrings
  | EntryParserResultSheet;

export type EntryParser = (entry: Entry) => Promise<EntryParserResult>;

export interface WorkbookStreamOptions {
  matchSheet: RegExp;
  alwaysAddSecondsToCustomTimeFormat?: boolean;
  dropEmptyRows?: boolean;
  dropEmptyCells?: boolean;
}
