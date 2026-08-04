import "server-only";

import ExcelJS from "exceljs";

/**
 * Turns a workbook into the plain grid the parser expects.
 *
 * Split from parse.ts so the parsing rules can be tested without a real file,
 * and so the workbook library never reaches a client bundle.
 */

/** These sheets are ~16 KB; anything far larger is not a marking scheme. */
export const MAX_WORKBOOK_BYTES = 2 * 1024 * 1024;

/** Renders whatever ExcelJS hands back as the text a person would see. */
function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString();

  if (typeof value === "object") {
    // Formula cells carry their last computed result; use it rather than the
    // formula text, since a max mark may well be a SUM.
    if ("result" in value && value.result !== undefined) return cellText(value.result as ExcelJS.CellValue);
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("");
    }
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("error" in value) return "";
  }

  return String(value);
}

export async function readWorkbookGrid(buffer: Buffer): Promise<string[][]> {
  if (buffer.byteLength > MAX_WORKBOOK_BYTES) {
    throw new Error("That file is too large to be a marking scheme.");
  }

  const workbook = new ExcelJS.Workbook();
  try {
    // ExcelJS's declaration predates Node's generic Buffer<ArrayBufferLike>, so
    // the two Buffer types no longer line up even though the value is right.
    await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  } catch {
    throw new Error("That file could not be opened as an Excel workbook.");
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("That workbook has no sheets.");

  const grid: string[][] = [];
  sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const cells: string[] = [];
    row.eachCell({ includeEmpty: true }, (cellValue, colNumber) => {
      cells[colNumber - 1] = cellText(cellValue.value);
    });
    grid[rowNumber - 1] = cells;
  });

  // eachRow skips trailing gaps, so fill the holes rather than leaving undefined
  // rows for the parser to guard against on every access.
  for (let i = 0; i < grid.length; i += 1) if (!grid[i]) grid[i] = [];

  return grid;
}
