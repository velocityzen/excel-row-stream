import fs from "fs";
import { pipeline } from "stream/promises";
import { Entry } from "unzipper";
import tmp from "tmp";

import { WorkSheet, DeferredWorkSheet } from "./types";

export async function deferSheet(
  entry: Entry,
  value: WorkSheet,
): Promise<DeferredWorkSheet> {
  return new Promise((resolve, reject) => {
    tmp.file((err, tmpFilePath, _fd, cleanupCallback) => {
      if (err) {
        reject(err);
        return;
      }

      pipeline(entry, fs.createWriteStream(tmpFilePath))
        .then(() => {
          resolve({
            ...value,
            tmpFilePath,
            cleanupCallback,
          });
        })
        .catch(reject);
    });
  });
}

interface Sheet {
  sheet: WorkSheet;
  entry: Entry;
}

interface DeferredSheet {
  sheet: DeferredWorkSheet;
}

export type WorkSheetStream = Sheet | DeferredSheet;

export function isTempStream(stream: WorkSheetStream): stream is DeferredSheet {
  return !("entry" in stream);
}

export function getSheetStream(stream: WorkSheetStream) {
  if (isTempStream(stream)) {
    return fs.createReadStream(stream.sheet.tmpFilePath);
  }

  return stream.entry;
}
