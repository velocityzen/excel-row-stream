import { Duplex } from "stream";
import unzipper, { Entry } from "unzipper";

import {
  EntryType,
  EntryParserResult,
  WorkBookInfo,
  WorkBookRels,
  WorkBookStyles,
  WorkBookSharedStrings,
  WorkbookStreamOptions,
  DeferredWorkSheet,
} from "./types";

import {
  parseWorkBookInfo,
  parseWorkBookRels,
  parseWorkBookStyles,
  parseWorkBookSharedStrings,
} from "./xml";

import { getSheetName, parseWorkSheet, parseWorkSheetRows } from "./worksheet";
import {
  deferSheet,
  isTempStream,
  getSheetStream,
  WorkSheetStream,
} from "./deferred";
import { isEmpyRow, dropEmptyValues, asyncIterate } from "./helpers";

const entryMatch: Map<RegExp, EntryType> = new Map([
  [/^xl\/workbook\.xml/, EntryType.Info],
  [/^xl\/_rels\/workbook\.xml\.rels/, EntryType.Rels],
  [/^xl\/sharedStrings\.xml/, EntryType.SharedStrings],
  [/^xl\/styles\.xml/, EntryType.Styles],
  [/^xl\/(worksheets\/sheet(\d+)\.xml)/i, EntryType.Sheet],
]);

async function handleEntry(entry: Entry): Promise<EntryParserResult> {
  let entryType: null | EntryType = null;
  let match: null | RegExpMatchArray = null;

  for (const [key, value] of entryMatch.entries()) {
    match = entry.path.match(key);

    if (!match) {
      continue;
    }

    entryType = value;
    break;
  }

  if (entryType && match) {
    switch (entryType) {
      case EntryType.Info:
        return parseWorkBookInfo(entry);
      case EntryType.Rels:
        return parseWorkBookRels(entry);
      case EntryType.SharedStrings:
        return parseWorkBookSharedStrings(entry);
      case EntryType.Styles:
        return parseWorkBookStyles(entry);
      case EntryType.Sheet:
        return parseWorkSheet(entry, match[1], match[2]);
    }
  }

  return {
    type: "ignore",
    value: entry.path,
  };
}

export default function createExcelWorkbookStream({
  matchSheet,
  dropEmptyRow,
  dropEmptyCell,
}: WorkbookStreamOptions) {
  let info: WorkBookInfo;
  let rels: WorkBookRels;
  let styles: WorkBookStyles;
  let sharedStrings: WorkBookSharedStrings;

  // worksheets, deferred for parsing after all meta is parsed
  const deferredSheets: DeferredWorkSheet[] = [];

  async function streamWorkSheet(workSheetStream: WorkSheetStream) {
    const sheetName = getSheetName(info, rels, workSheetStream.sheet.path);

    if (!matchSheet.test(sheetName)) {
      if (isTempStream(workSheetStream)) {
        workSheetStream.sheet.cleanupCallback();
      } else {
        await workSheetStream.entry.autodrain().promise();
      }
      return;
    }

    const sheetStream = getSheetStream(workSheetStream);

    await parseWorkSheetRows({
      stream: sheetStream,
      info,
      styles,
      sharedStrings,
      onRow: (row) => {
        if (dropEmptyRow && isEmpyRow(row)) {
          return;
        }
        stream.push(dropEmptyCell ? dropEmptyValues(row) : row);
      },
    });

    if (isTempStream(workSheetStream)) {
      workSheetStream.sheet.cleanupCallback();
    }
  }

  const unzipStream = unzipper
    .Parse()
    .on("error", (error) => stream.destroy(error))
    .on("finish", () => {
      if (deferredSheets.length > 0) {
        asyncIterate(deferredSheets, (deferredSheet) =>
          streamWorkSheet({ sheet: deferredSheet })
        )
          .then(() => stream.push(null))
          .catch((error: Error) => stream.destroy(error));
        return;
      }

      stream.push(null);
    })
    .on("entry", (entry: Entry) => {
      handleEntry(entry)
        .then(async (result) => {
          switch (result.type) {
            case EntryType.Info:
              info = result.value;
              break;

            case EntryType.Rels:
              rels = result.value;
              break;

            case EntryType.Styles:
              styles = result.value;
              break;

            case EntryType.SharedStrings:
              sharedStrings = result.value;
              break;

            case EntryType.Sheet:
              if (!info || !rels || !styles || !sharedStrings) {
                const deferredSheet = await deferSheet(entry, result.value);
                deferredSheets.push(deferredSheet);
                return;
              }

              await streamWorkSheet({ sheet: result.value, entry });
              break;

            default:
              await entry.autodrain().promise();
          }
        })
        .catch((error: Error) => stream.destroy(error));
    });

  const stream = new Duplex({
    readableObjectMode: true,
    allowHalfOpen: true,
    read() {
      // reading is in the parseWorkSheetRows.onRow handler
    },
    write(chunk, encoding, callback) {
      unzipStream.write(chunk, encoding, callback);
    },
  });

  return stream;
}
