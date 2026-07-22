import { createCrossTabSync } from "./crossTabSync";

const sync = createCrossTabSync("insaf-syllabus-updated");

export const notifySyllabusUpdated = (detail = {}) => sync.notify(detail);
export const subscribeSyllabusUpdated = (callback) => sync.subscribe(callback);
