export const TEACHER_ASSIGNMENTS_SYNC_KEY = "insaf-teacher-class-assignments-updated";

export function notifyTeacherAssignmentsUpdated(teacherId = "") {
  const payload = { teacherId: String(teacherId || ""), at: Date.now() };
  try {
    localStorage.setItem(TEACHER_ASSIGNMENTS_SYNC_KEY, JSON.stringify(payload));
    // storage event fires on other tabs; remove so next write still triggers
    localStorage.removeItem(TEACHER_ASSIGNMENTS_SYNC_KEY);
  } catch {
    // ignore quota / private mode
  }
  try {
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(TEACHER_ASSIGNMENTS_SYNC_KEY);
      channel.postMessage(payload);
      channel.close();
    }
  } catch {
    // ignore unsupported browsers
  }
  try {
    window.dispatchEvent(new CustomEvent(TEACHER_ASSIGNMENTS_SYNC_KEY, { detail: payload }));
  } catch {
    // ignore
  }
}

export function subscribeTeacherAssignmentsUpdated(callback) {
  if (typeof callback !== "function") return () => {};

  const onStorage = (event) => {
    if (event.key !== TEACHER_ASSIGNMENTS_SYNC_KEY || !event.newValue) return;
    try {
      callback(JSON.parse(event.newValue));
    } catch {
      callback({ at: Date.now() });
    }
  };

  const onCustom = (event) => callback(event.detail || { at: Date.now() });

  let channel = null;
  const onBroadcast = (event) => callback(event.data || { at: Date.now() });

  window.addEventListener("storage", onStorage);
  window.addEventListener(TEACHER_ASSIGNMENTS_SYNC_KEY, onCustom);

  try {
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel(TEACHER_ASSIGNMENTS_SYNC_KEY);
      channel.addEventListener("message", onBroadcast);
    }
  } catch {
    channel = null;
  }

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(TEACHER_ASSIGNMENTS_SYNC_KEY, onCustom);
    if (channel) {
      channel.removeEventListener("message", onBroadcast);
      channel.close();
    }
  };
}
