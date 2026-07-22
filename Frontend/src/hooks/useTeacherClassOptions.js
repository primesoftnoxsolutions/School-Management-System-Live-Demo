import { useCallback, useEffect, useState } from "react";
import api from "../services/api/client";
import { subscribeTeacherAssignmentsUpdated } from "../utils/teacherAssignmentsSync";

const POLL_MS = 2000;

const optionsSignature = (options = []) =>
  options
    .map((item) => `${item._id || ""}|${item.className || ""}|${item.section || "A"}|${item.subject || ""}|${item.branch || ""}`)
    .sort()
    .join(";;");

/**
 * Loads teacher class/section options and keeps them in sync when Super Admin
 * changes assignments — without requiring a full page reload.
 */
export default function useTeacherClassOptions({ poll = true, mergeClasses = false } = {}) {
  const [classOptions, setClassOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadClasses = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      let next = [];
      if (mergeClasses) {
        const [optionsRes, classesRes] = await Promise.all([
          api.get("/teacher-panel/class-options").catch(() => ({ data: { data: [] } })),
          api.get("/teacher-panel/classes", { params: { page: 1, limit: 100 } }).catch(() => ({ data: { data: { items: [] } } })),
        ]);
        const fromOptions = Array.isArray(optionsRes.data?.data) ? optionsRes.data.data : [];
        const fromClasses = Array.isArray(classesRes.data?.data?.items) ? classesRes.data.data.items : [];
        next = [...fromOptions, ...fromClasses].map((item) => ({
          ...item,
          _id: item._id || `${item.className}__${item.section || "A"}`,
          className: item.className,
          section: item.section || "A",
        }));
      } else {
        const { data } = await api.get("/teacher-panel/class-options");
        next = data.data || [];
      }

      setClassOptions((current) => (optionsSignature(current) === optionsSignature(next) ? current : next));
      return next;
    } catch {
      if (!silent) setClassOptions([]);
      return [];
    } finally {
      if (!silent) setLoading(false);
    }
  }, [mergeClasses]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    if (!poll) return undefined;

    const refresh = () => loadClasses({ silent: true });
    const intervalId = window.setInterval(refresh, POLL_MS);
    const onFocus = () => refresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const unsubscribe = subscribeTeacherAssignmentsUpdated(() => refresh());

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      unsubscribe();
    };
  }, [poll, loadClasses]);

  return { classOptions, setClassOptions, loading, reload: loadClasses };
}
