import multer from "multer";
import { AppError } from "../errors/AppError";

const ALLOWED_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // legacy .xls (accepté, exceljs ne le lira pas mais on donne un message clair)
  "application/octet-stream", // certains navigateurs/OS n'envoient pas le bon type MIME
]);

// Upload en mémoire (pas d'écriture disque) : les fichiers importés sont de
// petite taille (grilles tarifaires, lots de commandes) et traités en un
// seul passage.
export const uploadExcel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 Mo
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype) && !file.originalname.endsWith(".xlsx")) {
      callback(AppError.badRequest("Seuls les fichiers .xlsx sont acceptés"));
      return;
    }
    callback(null, true);
  },
});
