import ExcelJS from "exceljs";

export interface ExcelColumn<T> {
  header: string;
  key: keyof T & string;
  width?: number;
}

// Construit un classeur .xlsx à partir de lignes typées et d'une définition
// de colonnes (header lisible -> clé de la ligne). Utilisé par les exports
// (commandes, sites...).
export async function buildWorkbookBuffer<T extends Record<string, unknown>>(
  sheetName: string,
  columns: ExcelColumn<T>[],
  rows: T[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  sheet.columns = columns.map((col) => ({ header: col.header, key: col.key, width: col.width ?? 20 }));
  sheet.getRow(1).font = { bold: true };

  for (const row of rows) {
    sheet.addRow(row);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// Génère un classeur "modèle" vide contenant uniquement l'en-tête, pour
// guider l'utilisateur lors d'un import.
export async function buildTemplateBuffer<T extends Record<string, unknown>>(
  sheetName: string,
  columns: ExcelColumn<T>[]
): Promise<Buffer> {
  return buildWorkbookBuffer(sheetName, columns, []);
}

export interface ParsedExcelRow {
  rowNumber: number;
  values: Record<string, unknown>;
}

// Parse la première feuille d'un classeur .xlsx : la ligne 1 est traitée
// comme un en-tête (correspondance insensible à la casse/espaces avec les
// `header` déclarés dans columns), les lignes suivantes comme des données.
export async function parseWorkbookBuffer<T extends Record<string, unknown>>(
  buffer: Buffer,
  columns: ExcelColumn<T>[]
): Promise<ParsedExcelRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const headerRow = sheet.getRow(1);
  const columnIndexByKey = new Map<string, number>();

  headerRow.eachCell((cell, colNumber) => {
    const headerText = normalizeHeader(String(cell.value ?? ""));
    const match = columns.find((col) => normalizeHeader(col.header) === headerText);
    if (match) columnIndexByKey.set(match.key, colNumber);
  });

  const rows: ParsedExcelRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const isEmpty = row.values === undefined || (Array.isArray(row.values) && row.values.every((v) => v == null));
    if (isEmpty) return;

    const values: Record<string, unknown> = {};
    for (const col of columns) {
      const colIndex = columnIndexByKey.get(col.key);
      values[col.key] = colIndex ? row.getCell(colIndex).value : undefined;
    }
    rows.push({ rowNumber, values });
  });

  return rows;
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

// --- Coercion de cellules Excel (exceljs renvoie des types variés selon le
// formatage : Date natif, RichText, string, number...) vers des types JS
// simples, utilisées avant validation Zod des lignes importées. ---

export function coerceCellString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "object" && "text" in (value as Record<string, unknown>)) {
    return String((value as { text: unknown }).text).trim() || undefined;
  }
  if (typeof value === "object" && "result" in (value as Record<string, unknown>)) {
    // Cellule formule : on prend le résultat calculé.
    return coerceCellString((value as { result: unknown }).result);
  }
  const str = String(value).trim();
  return str || undefined;
}

export function coerceCellNumber(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  const str = coerceCellString(value);
  if (str === undefined) return undefined;
  const normalized = Number(str.replace(",", "."));
  return Number.isNaN(normalized) ? undefined : normalized;
}

export function coerceCellBoolean(value: unknown, defaultValue: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const str = coerceCellString(value)?.toLowerCase();
  if (str === undefined) return defaultValue;
  if (["oui", "yes", "true", "1", "vrai"].includes(str)) return true;
  if (["non", "no", "false", "0", "faux"].includes(str)) return false;
  return defaultValue;
}

export function coerceCellDate(value: unknown): Date | undefined {
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    // Numéro de série Excel (jours depuis le 30/12/1899).
    const excelEpoch = Date.UTC(1899, 11, 30);
    return new Date(excelEpoch + value * 86400000);
  }
  const str = coerceCellString(value);
  if (str === undefined) return undefined;
  const parsed = new Date(str);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}
