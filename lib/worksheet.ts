import { Readable } from "stream";
import type { Entry } from "unzipper";
import ssf from "ssf";

import {
  Row,
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
  onRow: (row: Row) => void;
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

    case "inlineStr": // inline string
      return cell.value;
  }

  if (styles.hasFormatCodes) {
    const formatId = parseInt(node.attributes.s, 10);
    const fullFormatId = Number.isNaN(formatId)
      ? 0
      : styles.xfs[formatId].attributes.numFmtId;

    if (fullFormatId !== undefined) {
      const format = styles.formatCodes[fullFormatId];
      if (format === undefined) {
        try {
          return ssf.format(Number(fullFormatId), Number(cell.value), {
            date1904,
          });
        } catch (e) {
          return "";
        }
      } else if (format !== "General") {
        try {
          return ssf.format(format, Number(cell.value), { date1904 });
        } catch (e) {
          return "";
        }
      }
    }
  } else {
    const numValue = parseFloat(cell.value as string);
    if (!isNaN(numValue)) {
      return numValue;
    }
  }

  return cell.value;
}

export function getSheetName(
  info: WorkBookInfo,
  rels: WorkBookRels,
  path: string
): string {
  return info.sheetRelationshipsNames[rels.sheetRelationships[path]];
}
