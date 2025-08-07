import type { Readable } from "stream";
import { pipeline } from "stream/promises";
import type { Entry } from "unzipper";
import { WritableStream } from "htmlparser2/WritableStream";

import {
  XmlNode,
  EntryType,
  WorkBookInfo,
  EntryParserResultInfo,
  WorkBookRels,
  EntryParserResultRels,
  WorkBookStyles,
  EntryParserResultStyles,
  WorkBookSharedStrings,
  EntryParserResultSharedStrings,
} from "./types";

export async function parseWorkBookInfo(
  entry: Entry,
): Promise<EntryParserResultInfo> {
  const workBookInfo: WorkBookInfo = {
    sheetRelationshipsNames: {},
    date1904: false,
  };

  await parseXml(entry, (node) => {
    if (node.name === "sheet") {
      workBookInfo.sheetRelationshipsNames[node.attributes["r:id"]] =
        node.attributes.name;
    } else if (node.name === "workbookPr" && node.attributes.date1904 === "1") {
      workBookInfo.date1904 = true;
    }
  });

  return { type: EntryType.Info, value: workBookInfo };
}

export async function parseWorkBookRels(
  entry: Entry,
): Promise<EntryParserResultRels> {
  const workBookRels: WorkBookRels = {
    sheetRelationships: {},
  };

  await parseXml(entry, (node) => {
    if (node.name === "Relationship") {
      workBookRels.sheetRelationships[node.attributes.Target] =
        node.attributes.Id;
    }
  });

  return { type: EntryType.Rels, value: workBookRels };
}

export async function parseWorkBookStyles(
  entry: Entry,
): Promise<EntryParserResultStyles> {
  const styles: WorkBookStyles = {
    hasFormatCodes: false,
    formatCodes: {},
    workBookStyles: [],
    xfs: [],
  };

  let xfs: XmlNode[] = [];
  await parseXml(entry, (node) => {
    switch (node.name) {
      case "numFmt":
        styles.hasFormatCodes ||= true;
        styles.formatCodes[node.attributes.numFmtId] =
          node.attributes.formatCode;
        break;

      case "xf":
        xfs.push(node);
        break;

      case "cellStyleXfs":
        // we don't need it
        xfs = [];
        break;

      case "cellXfs":
        // we need this
        styles.xfs.push(...xfs);
        break;
    }

    styles.workBookStyles.push(node);
  });

  return { type: EntryType.Styles, value: styles };
}

export async function parseWorkBookSharedStrings(
  entry: Entry,
): Promise<EntryParserResultSharedStrings> {
  const workBookSharedStrings: WorkBookSharedStrings = [];

  let pushNext = false;
  let collectText = false;

  await parseXml(entry, (node) => {
    if (node.name === "si") {
      collectText = false;
      pushNext = true;
      return;
    }

    if (pushNext && node.name === "t") {
      workBookSharedStrings.push(node.text);
      pushNext = false;
      return;
    }

    if (node.name === "t") {
      if (collectText) {
        workBookSharedStrings[workBookSharedStrings.length - 1] += node.text;
      } else {
        collectText = true;
        workBookSharedStrings[Math.max(0, workBookSharedStrings.length - 1)] =
          node.text;
      }
    }
  });

  return { type: EntryType.SharedStrings, value: workBookSharedStrings };
}

export async function parseXml(
  stream: Readable,
  nodeMapFn: (node: XmlNode) => void,
) {
  const nodeStack: XmlNode[] = [];

  const parser = new WritableStream(
    {
      onopentag(name, attributes) {
        nodeStack.push({
          name,
          attributes,
          text: "",
        });
      },
      ontext(text) {
        const stackSize = nodeStack.length;
        if (stackSize === 0) {
          return;
        }

        nodeStack[stackSize - 1].text += text;
      },
      onclosetag() {
        const node = nodeStack.pop();
        if (!node) {
          return;
        }
        nodeMapFn(node);
      },
    },
    { decodeEntities: true, xmlMode: true },
  );

  await pipeline(stream, parser);
}
