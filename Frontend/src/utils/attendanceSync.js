import { createCrossTabSync } from "./crossTabSync";

const sync = createCrossTabSync("insaf-attendance-updated");

export const notifyAttendanceUpdated = (detail = {}) => sync.notify(detail);
export const subscribeAttendanceUpdated = (callback) => sync.subscribe(callback);
