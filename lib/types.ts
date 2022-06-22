import type { Entry } from "unzipper";

export type XmlNode = {
  name: string;
  text: string;
  attributes: Record<string, string>;
};

export type RowWithValues = {
  index: number;
  values: unknown[];
};

export type RowWithColumns = {
  index: number;
  columns: Record<string, unknown>;
};

export type RowAsObject = Record<string, unknown>;

export type Cell = {
  id: string;
  value: unknown;
  formula: boolean;
};

export enum EntryType {
  Info = "info",
  Rels = "rels",
  Styles = "styles",
  SharedStrings = "sharedstrings",
  Sheet = "sheet",
}

export type WorkBookInfo = {
  sheetRelationshipsNames: Record<string, string>;
  date1904: boolean;
};

export interface EntryParserResultInfo {
  type: EntryType.Info;
  value: WorkBookInfo;
}

export type WorkBookRels = {
  sheetRelationships: Record<string, string>;
};

export interface EntryParserResultRels {
  type: EntryType.Rels;
  value: WorkBookRels;
}

export type WorkBookStyles = {
  hasFormatCodes: boolean;
  formatCodes: Record<string, string>;
  workBookStyles: XmlNode[];
  xfs: XmlNode[];
};

export interface EntryParserResultStyles {
  type: EntryType.Styles;
  value: WorkBookStyles;
}

export type WorkBookSharedStrings = string[];

export interface EntryParserResultSharedStrings {
  type: EntryType.SharedStrings;
  value: WorkBookSharedStrings;
}

export type WorkSheet = {
  id: number;
  path: string;
};

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
  dropEmptyRows?: boolean;
  dropEmptyCells?: boolean;
}
