import { Readable } from "stream";
import type { Entry } from "unzipper";

import {
  RowWithValues,
  Cell,
  XmlNode,
  EntryType,
  EntryParserResultSheet,
  WorkBookInfo,
  WorkBookRels,
  WorkBookStyles,
  WorkBookSharedStrings,
} from "./types";

import { parseXml } from "./xml";
import { format } from "./format";
import { getFormatId } from "./helpers";

export function parseWorkSheet(
  entry: Entry,
  path: string,
  number: string
): Promise<EntryParserResultSheet> {
  return Promise.resolve({
    type: EntryType.Sheet,
    value: {
      id: parseInt(number, 10),
      path,
    },
  });
}

interface ParseWorkSheetRowsOptions {
  stream: Readable;
  info: WorkBookInfo;
  styles: WorkBookStyles;
  sharedStrings: WorkBookSharedStrings;
  onRow: (row: RowWithValues) => void;
}

export async function parseWorkSheetRows({
  stream,
  info,
  styles,
  sharedStrings,
  onRow,
}: ParseWorkSheetRowsOptions): Promise<void> {
  let index = 1; // excel index starts from one
  const columns: XmlNode[] = [];
  let row: unknown[] = [];
  let currentCell = {} as Cell;

  await parseXml(stream, (node) => {
    switch (node.name) {
      case "col":
        columns.push(node);
        break;

      case "t": //inlineStr value
      case "v": //value
        currentCell.value = node.text;
        break;

      case "f": // cell formula
        currentCell.formula = true;
        break;

      case "c": // cell
        currentCell.id = node.attributes.r;
        // eslint-disable-next-line no-case-declarations
        const value = getCellValue(
          currentCell,
          node,
          styles,
          sharedStrings,
          info.date1904
        );
        row.push(value);
        currentCell = {} as Cell;
        break;

      case "row": // row is closed
        onRow({
          index,
          values: row,
        });

        index++;
        row = [];
        break;
    }
  });
}

function getCellValue(
  cell: Cell,
  node: XmlNode,
  styles: WorkBookStyles,
  sharedStrings: WorkBookSharedStrings,
  date1904: boolean
): unknown {
  switch (node.attributes.t) {
    case "s": // shared string
      // eslint-disable-next-line no-case-declarations
      const index = parseInt(cell.value as string, 10);
      return sharedStrings[index] ?? "";

    case "str": // just string
    case "inlineStr": // inline string
      return cell.value;
  }

  const cellFormatId = getFormatId(node.attributes.s);
  const formatId = cellFormatId
    ? styles.xfs[cellFormatId].attributes.numFmtId
    : 0;

  return format({
    formatId,
    hasFormatCodes: styles.hasFormatCodes,
    formatCodes: styles.formatCodes,
    date1904,
    value: cell.value,
  });
}

export function getSheetName(
  info: WorkBookInfo,
  rels: WorkBookRels,
  path: string
): string {
  return info.sheetRelationshipsNames[rels.sheetRelationships[path]];
}
