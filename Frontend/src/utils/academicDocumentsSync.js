import { createCrossTabSync } from "./crossTabSync";

const sync = createCrossTabSync("insaf-academic-documents-updated");

export const notifyAcademicDocumentsUpdated = (detail = {}) => sync.notify(detail);
export const subscribeAcademicDocumentsUpdated = (callback) => sync.subscribe(callback);
