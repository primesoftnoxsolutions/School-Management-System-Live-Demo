import { useCallback, useState } from "react";
import { readAppThemeDark, writeAppThemeDark } from "../utils/appTheme";
import { useAppThemeClass } from "./useAppThemeClass";

export function useAppTheme() {
  const [isDark, setIsDarkState] = useState(readAppThemeDark);

  useAppThemeClass(isDark);

  const setIsDark = useCallback((value) => {
    setIsDarkState((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      writeAppThemeDark(next);
      return next;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDarkState((prev) => {
      const next = !prev;
      writeAppThemeDark(next);
      return next;
    });
  }, []);

  return { isDark, setIsDark, toggleTheme };
}
